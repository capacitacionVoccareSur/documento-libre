// Genera el .docx rellenando la plantilla ORIGINAL (public/plantilla/reporte.docx,
// exportada tal cual desde Google Docs). Así el resultado es idéntico al formato
// oficial: mismas tablas, medidas, fuentes, logo y pie de página.
// Todo ocurre en el navegador.

import JSZip from "jszip"
import { cargarImagen } from "./html"
import { partesFecha, type Documento } from "./documento"

const URL_PLANTILLA = "/plantilla/reporte.docx"

// Medidas tomadas de la plantilla
const IND_DESARROLLO = 283 // twips: sangría de los párrafos de "DESARROLLO DEL TEMA"
const IND_LISTA = 360 // twips: sangría extra por nivel de lista
const ANCHO_MAX_IMG_PX = 600 // ancho útil de la celda (10170 twips − márgenes − sangría ≈ 643 px)
const EMU_POR_PX = 9525

const RPR_BASE = '<w:rFonts w:ascii="Proxima Nova" w:cs="Proxima Nova" w:eastAsia="Proxima Nova" w:hAnsi="Proxima Nova"/>'

const xml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

let plantillaCache: ArrayBuffer | null = null
async function plantilla(): Promise<ArrayBuffer> {
  if (!plantillaCache) {
    const r = await fetch(URL_PLANTILLA)
    if (!r.ok) throw new Error("No se pudo cargar la plantilla")
    plantillaCache = await r.arrayBuffer()
  }
  return plantillaCache
}

// ── HTML del editor → OOXML ──────────────────────────────────────────────────

interface Formato { b?: boolean; i?: boolean; u?: boolean }

interface Imagen { rId: string; archivo: string; bytes: Uint8Array; ext: "png" | "jpeg" | "gif"; w: number; h: number }

class Conversor {
  imagenes: Imagen[] = []
  private idDibujo = 1000

  constructor(private tamanos: Map<string, { w: number; h: number }>) {}

  private run(texto: string, f: Formato): string {
    if (!texto) return ""
    const rpr =
      RPR_BASE +
      (f.b ? '<w:b w:val="1"/><w:bCs w:val="1"/>' : "") +
      (f.i ? '<w:i w:val="1"/><w:iCs w:val="1"/>' : "") +
      (f.u ? '<w:u w:val="single"/>' : "")
    return `<w:r><w:rPr>${rpr}</w:rPr><w:t xml:space="preserve">${xml(texto)}</w:t></w:r>`
  }

  private imagen(src: string): string {
    const t = this.tamanos.get(src)
    const m = /^data:image\/(png|jpe?g|gif);base64,(.+)$/i.exec(src)
    if (!t || !m) return ""
    const ext = (m[1].toLowerCase() === "jpg" ? "jpeg" : m[1].toLowerCase()) as Imagen["ext"]
    const bin = atob(m[2])
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const n = this.imagenes.length + 1
    const img: Imagen = { rId: `rIdLibre${n}`, archivo: `libre_${n}.${ext === "jpeg" ? "jpeg" : ext}`, bytes, ext, w: t.w, h: t.h }
    this.imagenes.push(img)
    const escala = Math.min(1, ANCHO_MAX_IMG_PX / t.w)
    const cx = Math.round(t.w * escala * EMU_POR_PX)
    const cy = Math.round(t.h * escala * EMU_POR_PX)
    const id = ++this.idDibujo
    return (
      `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
      `<wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>` +
      `<wp:docPr id="${id}" name="Imagen ${n}"/>` +
      `<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
      `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
      `<pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="${img.archivo}"/><pic:cNvPicPr/></pic:nvPicPr>` +
      `<pic:blipFill><a:blip r:embed="${img.rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
      `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
      `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`
    )
  }

  /** Runs (texto, formato, saltos e imágenes) de un nodo en línea. */
  runs(nodo: Node, f: Formato = {}): string {
    let out = ""
    nodo.childNodes.forEach((h) => {
      if (h.nodeType === Node.TEXT_NODE) {
        out += this.run(h.textContent ?? "", f)
        return
      }
      if (h.nodeType !== Node.ELEMENT_NODE) return
      const el = h as HTMLElement
      switch (el.tagName) {
        case "B": case "STRONG": out += this.runs(el, { ...f, b: true }); break
        case "I": case "EM": out += this.runs(el, { ...f, i: true }); break
        case "U": out += this.runs(el, { ...f, u: true }); break
        case "BR": out += "<w:r><w:br/></w:r>"; break
        case "IMG": out += this.imagen(el.getAttribute("src") ?? ""); break
        case "UL": case "OL": break // se procesan como bloques
        default: out += this.runs(el, f)
      }
    })
    return out
  }

  parrafo(contenido: string, opciones: { sangria?: number; colgante?: number } = {}): string {
    const izq = opciones.sangria ?? IND_DESARROLLO
    const ind = opciones.colgante
      ? `<w:ind w:left="${izq}" w:hanging="${opciones.colgante}"/>`
      : `<w:ind w:left="${izq}" w:firstLine="0"/>`
    return `<w:p><w:pPr>${ind}<w:rPr>${RPR_BASE}</w:rPr></w:pPr>${contenido}</w:p>`
  }

  private lista(el: HTMLElement, nivel: number): string {
    const ordenada = el.tagName === "OL"
    let n = 0
    let out = ""
    el.childNodes.forEach((li) => {
      if (li.nodeType !== Node.ELEMENT_NODE) return
      const liEl = li as HTMLElement
      if (liEl.tagName === "UL" || liEl.tagName === "OL") { out += this.lista(liEl, nivel + 1); return }
      n++
      const vineta = ordenada ? `${n}.` : nivel === 0 ? "•" : nivel === 1 ? "◦" : "▪"
      const sangria = IND_DESARROLLO + IND_LISTA * (nivel + 1)
      out += this.parrafo(this.run(vineta, {}) + "<w:r><w:tab/></w:r>" + this.runs(liEl), { sangria, colgante: IND_LISTA })
      liEl.querySelectorAll(":scope > ul, :scope > ol").forEach((s) => (out += this.lista(s as HTMLElement, nivel + 1)))
    })
    return out
  }

  bloques(raiz: Node): string {
    let out = ""
    let suelto = ""
    const cerrar = () => { if (suelto) out += this.parrafo(suelto); suelto = "" }
    raiz.childNodes.forEach((h) => {
      if (h.nodeType === Node.TEXT_NODE) { if ((h.textContent ?? "").trim()) suelto += this.run(h.textContent ?? "", {}); return }
      if (h.nodeType !== Node.ELEMENT_NODE) return
      const el = h as HTMLElement
      switch (el.tagName) {
        case "P": case "DIV": cerrar(); out += this.parrafo(this.runs(el)); break
        case "H2": case "H3": cerrar(); out += this.parrafo(this.runs(el, { b: true })); break
        case "UL": case "OL": cerrar(); out += this.lista(el, 0); break
        case "BR": cerrar(); break
        default: {
          const env = document.createElement("div")
          env.appendChild(el.cloneNode(true))
          suelto += this.runs(env)
        }
      }
    })
    cerrar()
    return out
  }
}

async function medirImagenes(html: string): Promise<Map<string, { w: number; h: number }>> {
  const tamanos = new Map<string, { w: number; h: number }>()
  const srcs = new Set<string>()
  new DOMParser().parseFromString(html, "text/html").querySelectorAll("img").forEach((i) => {
    const s = i.getAttribute("src")
    if (s?.startsWith("data:image/")) srcs.add(s)
  })
  await Promise.all(
    [...srcs].map(async (s) => {
      try {
        const img = await cargarImagen(s)
        tamanos.set(s, { w: img.naturalWidth || 1, h: img.naturalHeight || 1 })
      } catch {}
    }),
  )
  return tamanos
}

// ── Relleno de la plantilla ──────────────────────────────────────────────────

/** "HORA DE INICIO: x      HORA DE FINALIZACIÓN: y" respetando la alineación original (32 espacios). */
function lineaHoras(inicio: string, fin: string): string {
  const relleno = Math.max(3, 32 - Math.round(inicio.length * 2.4))
  return `HORA DE INICIO: ${inicio}${" ".repeat(relleno)}HORA DE FINALIZACIÓN: ${fin}`
}

function reemplazarFilasAsistentes(docXml: string, doc: Documento): string {
  const filas = [...docXml.matchAll(/<w:tr(?:\s[^>]*)?>[\s\S]*?<\/w:tr>/g)].filter((m) => m[0].includes("{{ASISTENTES}}"))
  if (!filas.length) return docXml
  const modelo = filas[0][0]
  const nuevas = doc.asistentes
    .map((a) => modelo.replace("{{ASISTENTES}}", xml(a.nombre)).replace("{{SKILL}}", xml(a.operacion)))
    .join("")
  const inicio = filas[0].index!
  const ultima = filas[filas.length - 1]
  const fin = ultima.index! + ultima[0].length
  return docXml.slice(0, inicio) + nuevas + docXml.slice(fin)
}

export async function generarWord(doc: Documento): Promise<Blob> {
  const zip = await JSZip.loadAsync(await plantilla())
  let docXml = await zip.file("word/document.xml")!.async("string")
  const { dia, mes, anio } = partesFecha(doc.fecha)

  // Marcadores simples (cada uno vive en un único <w:t> en la plantilla)
  docXml = docXml
    .replace("{{DIA}}", xml(dia))
    .replace("{{MES}}", xml(mes))
    .replace("{{AÑO}}", xml(anio))
    .replace("{{TITULO}}", xml(doc.titulo))
    .replace("{{RESPONSABLE}}", xml(doc.responsable))
    .replace(/HORA DE INICIO: +HORA DE FINALIZACIÓN: ?/, xml(lineaHoras(doc.horaInicio, doc.horaFin)))

  docXml = reemplazarFilasAsistentes(docXml, doc)

  // {{DESARROLLO}}: se reemplaza el párrafo completo por el contenido enriquecido
  const conv = new Conversor(await medirImagenes(doc.desarrollo))
  const cuerpo = new DOMParser().parseFromString(doc.desarrollo || "", "text/html").body
  const parrafos = conv.bloques(cuerpo) || conv.parrafo("")
  const iMarca = docXml.indexOf("{{DESARROLLO}}")
  if (iMarca >= 0) {
    const ini = docXml.lastIndexOf("<w:p ", iMarca)
    const fin = docXml.indexOf("</w:p>", iMarca) + "</w:p>".length
    docXml = docXml.slice(0, ini) + parrafos + docXml.slice(fin)
  }

  // Imágenes del contenido: archivos, relaciones y tipos de contenido
  if (conv.imagenes.length) {
    const relsRuta = "word/_rels/document.xml.rels"
    let rels = await zip.file(relsRuta)!.async("string")
    const nuevasRels = conv.imagenes
      .map((i) => `<Relationship Id="${i.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${i.archivo}"/>`)
      .join("")
    rels = rels.replace("</Relationships>", nuevasRels + "</Relationships>")
    zip.file(relsRuta, rels)
    conv.imagenes.forEach((i) => zip.file(`word/media/${i.archivo}`, i.bytes))

    let tipos = await zip.file("[Content_Types].xml")!.async("string")
    const mime = { png: "image/png", jpeg: "image/jpeg", gif: "image/gif" } as const
    for (const ext of new Set(conv.imagenes.map((i) => i.ext))) {
      if (!new RegExp(`Extension="${ext}"`, "i").test(tipos)) {
        tipos = tipos.replace("</Types>", `<Default ContentType="${mime[ext]}" Extension="${ext}"/></Types>`)
      }
    }
    zip.file("[Content_Types].xml", tipos)
  }

  zip.file("word/document.xml", docXml)
  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
  })
}
