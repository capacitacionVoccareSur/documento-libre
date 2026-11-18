// HTML del documento final, replicando la plantilla RE-VOC-TR-02.
// - Portapapeles (Google Docs): tablas en flujo normal con estilos en línea,
//   que es lo que Google Docs respeta al pegar. Fuente Proxima Nova (Docs la incluye).
// - Impresión / PDF: la misma maqueta exacta de la hoja en pantalla.

import { partesFecha, type Documento } from "./documento"
import { ruta } from "./ruta"

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const AZUL = "#192441"
const PROXIMA = "'Proxima Nova',Figtree,Arial,sans-serif"

let logoCache: string | null = null
async function logoDataUrl(): Promise<string> {
  if (logoCache) return logoCache
  const blob = await (await fetch(ruta("/plantilla/logo.png"))).blob()
  logoCache = await new Promise<string>((ok, mal) => {
    const fr = new FileReader()
    fr.onload = () => ok(fr.result as string)
    fr.onerror = mal
    fr.readAsDataURL(blob)
  })
  return logoCache
}

function desarrolloHtml(doc: Documento, estiloP: string): string {
  return (doc.desarrollo || "")
    .replace(/<img /g, '<img style="max-width:100%;height:auto" ')
    .replace(/<p>/g, `<p style="${estiloP}">`)
    .replace(/<h3>/g, `<p style="${estiloP}font-weight:bold">`).replace(/<\/h3>/g, "</p>")
    .replace(/<h2>/g, `<p style="${estiloP}font-weight:bold">`).replace(/<\/h2>/g, "</p>")
}

// ── Portapapeles (Google Docs) ───────────────────────────────────────────────

export async function generarHtmlCuerpo(doc: Documento): Promise<string> {
  const { dia, mes, anio } = partesFecha(doc.fecha)
  const logo = await logoDataUrl()

  const E = "border:1px solid #000;padding:0 5px;vertical-align:top;font-family:Arial,sans-serif;font-size:11pt;line-height:1.15;"
  const pE = "margin:0;padding-left:18pt;"
  const F = `border:1.5pt solid ${AZUL};padding:0 6pt;font-family:${PROXIMA};font-size:10pt;`
  const C = `border:1.5pt solid ${AZUL};padding:0 6pt;font-family:${PROXIMA};font-size:11pt;vertical-align:middle;`
  const pD = `margin:0;padding-left:14.2pt;font-family:${PROXIMA};font-size:11pt;`
  const vacio = `<p style="margin:0;font-family:${PROXIMA};font-size:11pt">&nbsp;</p>`

  const filas = doc.asistentes
    .map(
      (a) =>
        `<tr style="height:14.15pt"><td style="${C}text-align:center"><b>${esc(a.nombre) || "&nbsp;"}</b></td><td style="${C}text-align:center"><b>${esc(a.operacion) || "&nbsp;"}</b></td></tr>`,
    )
    .join("")

  return `<table style="border-collapse:collapse;width:441pt;margin-left:6.75pt;table-layout:fixed">
<colgroup><col style="width:88.5pt"><col style="width:202.5pt"><col style="width:150pt"></colgroup>
<tr style="height:14.25pt">
  <td rowspan="5" style="${E}"><img src="${logo}" width="78" height="69" style="width:78pt;height:69pt"></td>
  <td rowspan="3" style="${E}"><p style="${pE}">TÍTULO:</p><p style="margin:0;text-align:center;font-size:12pt"><b>FORMATO DE ASISTENCIA CAPACITACIONES</b></p></td>
  <td style="${E}"><p style="${pE}"><b>Código: </b><b style="font-size:10pt">RE-VOC-TR-02</b></p></td>
</tr>
<tr style="height:14.25pt"><td style="${E}"><p style="${pE}"><b>Versión: </b>02</p></td></tr>
<tr style="height:14.25pt"><td style="${E}"><p style="${pE}"><b>Clasificación: </b>Interna</p></td></tr>
<tr style="height:30pt">
  <td rowspan="2" style="${E}"><p style="${pE}">PROCESO:</p><p style="margin:0">&nbsp;</p><p style="margin:0;text-align:center"><b>TRAINING</b></p></td>
  <td style="${E}"><p style="${pE}"><b>Fecha de modificación: </b> 05/08/2026</p></td>
</tr>
<tr style="height:21.75pt"><td style="${E}"><p style="${pE}margin-bottom:8pt"><b>Fecha de revisión: </b></p></td></tr>
</table>
${vacio}
<table style="border-collapse:collapse;width:141pt;margin-left:340pt;table-layout:fixed">
<colgroup><col style="width:42.55pt"><col style="width:44.25pt"><col style="width:54.2pt"></colgroup>
<tr><td style="${F}text-align:center"><b>DIA</b></td><td style="${F}text-align:center"><b>MES</b></td><td style="${F}text-align:center"><b>AÑO</b></td></tr>
<tr style="height:21pt"><td style="${F}vertical-align:top">${esc(dia)}</td><td style="${F}vertical-align:top">${esc(mes)}</td><td style="${F}vertical-align:top">${esc(anio)}</td></tr>
</table>
${vacio}
<table style="border-collapse:collapse;width:508.5pt;margin-left:-28pt;table-layout:fixed">
<colgroup><col style="width:387pt"><col style="width:121.5pt"></colgroup>
<tr style="height:22.55pt"><td colspan="2" style="${C}"><b>TÍTULO: ${esc(doc.titulo)}</b></td></tr>
<tr style="height:28.25pt"><td colspan="2" style="${C}"><b>RESPONSABLE: ${esc(doc.responsable)}</b></td></tr>
<tr style="height:20pt"><td colspan="2" style="${C}"><b>HORA DE INICIO: ${esc(doc.horaInicio)}</b><span style="display:inline-block;width:${Math.max(20, 168 - doc.horaInicio.length * 7)}pt"></span><b>HORA DE FINALIZACIÓN: ${esc(doc.horaFin)}</b></td></tr>
<tr style="height:83.15pt"><td colspan="2" style="${C}vertical-align:top">
  <p style="margin:0">&nbsp;</p>
  <p style="${pD}"><b>DESARROLLO DEL TEMA: </b></p>
  <p style="margin:0">&nbsp;</p>
  <div style="${pD}">${desarrolloHtml(doc, pD.replace("padding-left:14.2pt;", "padding-left:0;"))}</div>
  <p style="margin:0">&nbsp;</p><p style="margin:0">&nbsp;</p><p style="margin:0">&nbsp;</p>
</td></tr>
<tr style="height:15.2pt"><td colspan="2" style="${C}text-align:center"><b>ASISTENTES</b></td></tr>
<tr style="height:15.2pt"><td style="${C}text-align:center"><b>NOMBRE</b></td><td style="${C}text-align:center"><b>OPERACIÓN</b></td></tr>
${filas}
</table>`
}

/** Copia el documento al portapapeles como texto enriquecido. */
export async function copiarAlPortapapeles(doc: Documento): Promise<void> {
  const html = await generarHtmlCuerpo(doc)
  const plano = new DOMParser().parseFromString(html, "text/html").body.innerText
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plano], { type: "text/plain" }),
      }),
    ])
    return
  }
  // Respaldo para navegadores sin ClipboardItem
  const contenedor = document.createElement("div")
  contenedor.innerHTML = html
  contenedor.style.cssText = "position:fixed;left:-9999px;top:0"
  document.body.appendChild(contenedor)
  const rango = document.createRange()
  rango.selectNodeContents(contenedor)
  const sel = window.getSelection()!
  sel.removeAllRanges()
  sel.addRange(rango)
  const ok = document.execCommand("copy")
  sel.removeAllRanges()
  contenedor.remove()
  if (!ok) throw new Error("El navegador no permitió copiar")
}

// ── Impresión / PDF: copia estática de la hoja en pantalla ───────────────────

export function imprimir(): void {
  const original = document.querySelector<HTMLElement>(".pagina")
  if (!original) return
  const copia = original.cloneNode(true) as HTMLElement
  // Inputs → texto, editor → contenido estático
  copia.querySelectorAll("input").forEach((i) => {
    if (i.type === "date") { i.remove(); return }
    const s = document.createElement("span")
    s.textContent = i.value // cloneNode conserva el valor actual de los inputs
    s.style.fontWeight = getComputedStyle(i).fontWeight
    i.replaceWith(s)
  })
  copia.querySelectorAll("[contenteditable]").forEach((e) => e.removeAttribute("contenteditable"))
  copia.querySelectorAll(".quitar-fila").forEach((b) => b.remove())

  const estilos = [...document.querySelectorAll('style, link[rel="stylesheet"]')].map((n) => n.outerHTML).join("")
  const iframe = document.createElement("iframe")
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0"
  document.body.appendChild(iframe)
  const w = iframe.contentWindow!
  w.document.open()
  w.document.write(`<!doctype html><html class="${document.documentElement.className}"><head><meta charset="utf-8"><title>${esc(document.title)}</title>${estilos}
<style>@page{size:letter;margin:0}html,body{background:#fff!important;margin:0}.pagina{box-shadow:none!important}.contenido:empty::before{content:none}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style>
</head><body>${copia.outerHTML}</body></html>`)
  w.document.close()
  const lanzar = () => {
    w.focus()
    w.print()
    setTimeout(() => iframe.remove(), 1000)
  }
  const listo = () => Promise.all([...Array.from(w.document.images).map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r }))), w.document.fonts?.ready])
  setTimeout(() => listo().then(lanzar), 100)
}

export function descargar(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
