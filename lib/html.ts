// Saneado del contenido enriquecido del editor.
// Solo se conserva lo que sabemos exportar a Word y a Google Docs:
// párrafos, saltos, negrita, cursiva, subrayado, subtítulos, listas e imágenes.

const BLOQUES = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "UL", "OL", "BLOCKQUOTE", "PRE", "TABLE", "TR"])

function esImagenValida(src: string | null): src is string {
  return !!src && /^data:image\/(png|jpe?g|gif);base64,/i.test(src)
}

function limpiarNodo(origen: Node, destino: Node, doc: Document): void {
  origen.childNodes.forEach((hijo) => {
    if (hijo.nodeType === Node.TEXT_NODE) {
      const texto = (hijo.textContent ?? "").replace(/ /g, " ")
      if (texto) destino.appendChild(doc.createTextNode(texto))
      return
    }
    if (hijo.nodeType !== Node.ELEMENT_NODE) return

    const el = hijo as HTMLElement
    const tag = el.tagName
    if (["SCRIPT", "STYLE", "META", "LINK", "TITLE", "HEAD", "svg", "SVG"].includes(tag)) return

    // Formato que Google Docs / Word expresan con estilos en línea
    const estilo = el.getAttribute("style") ?? ""
    const negritaEstilo = /font-weight\s*:\s*(bold|[6-9]00)/i.test(estilo)
    const sinNegrita = /font-weight\s*:\s*(normal|[1-4]00)/i.test(estilo)
    const cursivaEstilo = /font-style\s*:\s*italic/i.test(estilo)
    const subrayadoEstilo = /text-decoration[^;]*underline/i.test(estilo)

    let nuevo: Node
    switch (tag) {
      case "B":
      case "STRONG":
        nuevo = sinNegrita ? doc.createDocumentFragment() : doc.createElement("b")
        break
      case "I":
      case "EM":
        nuevo = doc.createElement("i")
        break
      case "U":
        nuevo = doc.createElement("u")
        break
      case "BR":
        destino.appendChild(doc.createElement("br"))
        return
      case "UL":
      case "OL":
        nuevo = doc.createElement(tag.toLowerCase())
        break
      case "LI":
        nuevo = doc.createElement("li")
        break
      case "H1":
      case "H2":
        nuevo = doc.createElement("h2")
        break
      case "H3":
      case "H4":
      case "H5":
      case "H6":
        nuevo = doc.createElement("h3")
        break
      case "IMG": {
        const src = el.getAttribute("src")
        if (esImagenValida(src)) {
          const img = doc.createElement("img")
          img.setAttribute("src", src)
          destino.appendChild(img)
        }
        return
      }
      case "TD":
      case "TH": {
        // Las tablas pegadas se aplanan en texto separado por " | "
        limpiarNodo(el, destino, doc)
        if (el.nextElementSibling) destino.appendChild(doc.createTextNode(" | "))
        return
      }
      default:
        nuevo = BLOQUES.has(tag) ? doc.createElement("p") : doc.createDocumentFragment()
    }

    // Envolver con el formato expresado por estilos
    let contenedor: Node = nuevo
    let interior: Node = nuevo
    const envolver = (t: string) => {
      const w = doc.createElement(t)
      interior.appendChild(w)
      interior = w
    }
    if (!(nuevo instanceof HTMLElement && ["B", "UL", "OL"].includes(nuevo.tagName))) {
      if (negritaEstilo) envolver("b")
    }
    if (cursivaEstilo) envolver("i")
    if (subrayadoEstilo) envolver("u")

    limpiarNodo(el, interior, doc)

    // Párrafos anidados dentro de párrafos / ítems / subtítulos se aplanan
    if (
      contenedor instanceof HTMLElement && ["P", "H2", "H3"].includes(contenedor.tagName) &&
      destino instanceof HTMLElement && ["P", "LI", "H2", "H3"].includes(destino.tagName)
    ) {
      const frag = doc.createDocumentFragment()
      while (contenedor.firstChild) frag.appendChild(contenedor.firstChild)
      if (destino.lastChild) destino.appendChild(doc.createElement("br"))
      contenedor = frag
    }
    destino.appendChild(contenedor)
  })
}

export function sanearHtml(html: string): string {
  if (typeof window === "undefined") return ""
  const parsed = new DOMParser().parseFromString(html, "text/html")
  const salida = document.implementation.createHTMLDocument("")
  const raiz = salida.createElement("div")
  limpiarNodo(parsed.body, raiz, salida)
  // Quitar párrafos vacíos consecutivos al final
  while (raiz.lastChild && raiz.lastChild.nodeType === Node.ELEMENT_NODE && !(raiz.lastChild as HTMLElement).textContent?.trim() && !(raiz.lastChild as HTMLElement).querySelector("img")) {
    raiz.removeChild(raiz.lastChild)
  }
  return raiz.innerHTML
}

export function textoAHtml(texto: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  return texto
    .split(/\r?\n/)
    .map((linea) => `<p>${esc(linea) || "<br>"}</p>`)
    .join("")
}

// ── Imágenes ─────────────────────────────────────────────────────────────────

const ANCHO_MAX = 1400

/** Lee un archivo de imagen y lo normaliza a PNG/JPEG (lo único que Word acepta sin problemas). */
export async function imagenADataUrl(file: Blob): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await cargarImagen(url)
    const escala = Math.min(1, ANCHO_MAX / img.naturalWidth)
    const w = Math.max(1, Math.round(img.naturalWidth * escala))
    const h = Math.max(1, Math.round(img.naturalHeight * escala))
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")!
    const esJpeg = file.type === "image/jpeg"
    if (esJpeg) {
      ctx.fillStyle = "#fff"
      ctx.fillRect(0, 0, w, h)
    }
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL(esJpeg ? "image/jpeg" : "image/png", 0.9)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("No se pudo leer la imagen"))
    img.src = src
  })
}

/** Texto plano del contenido enriquecido (para el registro en la planilla). */
export function htmlATexto(html: string): string {
  if (!html) return ""
  const cuerpo = new DOMParser().parseFromString(html, "text/html").body
  const lineas: string[] = []
  let actual = ""
  const cortar = () => { lineas.push(actual.trimEnd()); actual = "" }
  const recorrer = (n: Node, prefijo = "") => {
    n.childNodes.forEach((h) => {
      if (h.nodeType === Node.TEXT_NODE) { actual += h.textContent ?? ""; return }
      if (h.nodeType !== Node.ELEMENT_NODE) return
      const el = h as HTMLElement
      switch (el.tagName) {
        case "BR": cortar(); break
        case "IMG": actual += "[imagen]"; break
        case "UL": case "OL": {
          if (actual) cortar()
          let i = 0
          el.childNodes.forEach((li) => {
            if (li.nodeType !== Node.ELEMENT_NODE) return
            const liEl = li as HTMLElement
            if (liEl.tagName !== "LI") { recorrer(liEl, prefijo + "  "); return }
            i++
            actual += `${prefijo}${el.tagName === "OL" ? `${i}.` : "•"} `
            recorrer(liEl, prefijo + "  ")
            if (actual) cortar()
          })
          break
        }
        case "P": case "DIV": case "H2": case "H3":
          if (actual) cortar()
          recorrer(el, prefijo)
          cortar()
          break
        default: recorrer(el, prefijo)
      }
    })
  }
  recorrer(cuerpo)
  if (actual) cortar()
  const SALTO = String.fromCharCode(10)
  return lineas.join(SALTO).replace(/\n{3,}/g, SALTO + SALTO).trim()
}
