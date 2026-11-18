"use client"

import { useEffect, useRef } from "react"
import { imagenADataUrl, sanearHtml, textoAHtml } from "@/lib/html"
import {
  IconoBorrarFormato,
  IconoImagen,
  IconoLista,
  IconoListaNumerada,
  IconoParrafo,
  IconoTitulo,
} from "./Iconos"

// El editor (dentro de la hoja) y su barra de formato (fuera de la hoja, para
// no alterar el formato) se comunican a través del elemento con este id.
const ID_EDITOR = "editor-desarrollo"

function editor(): HTMLDivElement | null {
  return document.getElementById(ID_EDITOR) as HTMLDivElement | null
}

/** Enfoca el editor; si el cursor no estaba dentro, lo lleva al final. */
function enfocar() {
  const el = editor()
  if (!el) return
  const sel = window.getSelection()
  const dentro = sel && sel.rangeCount > 0 && el.contains(sel.getRangeAt(0).commonAncestorContainer)
  el.focus()
  if (!dentro && sel) {
    const r = document.createRange()
    r.selectNodeContents(el)
    r.collapse(false)
    sel.removeAllRanges()
    sel.addRange(r)
  }
}

function comando(cmd: string, valor?: string) {
  enfocar()
  document.execCommand(cmd, false, valor) // dispara "input" en el editor
}

function insertarHtml(html: string) {
  enfocar()
  document.execCommand("insertHTML", false, html)
}

async function insertarImagenes(archivos: File[], onError: (m: string) => void) {
  const imgs = archivos.filter((f) => /^image\/(png|jpe?g|gif|webp|bmp)$/i.test(f.type))
  try {
    for (const f of imgs) insertarHtml(`<p><img src="${await imagenADataUrl(f)}"></p>`)
  } catch {
    onError("No se pudo leer la imagen.")
  }
}

// ── Editor ───────────────────────────────────────────────────────────────────

interface PropsEditor {
  valorInicial: string
  onChange: (html: string) => void
  onAviso: (msg: string) => void
}

export function EditorContenido({ valorInicial, onChange, onAviso }: PropsEditor) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = valorInicial
    try {
      document.execCommand("defaultParagraphSeparator", false, "p")
      document.execCommand("styleWithCSS", false, "false")
    } catch {}
    // valorInicial solo se usa al montar (el padre cambia `key` para reiniciar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emitir = () => {
    const el = ref.current
    if (!el) return
    if (!el.textContent?.trim() && !el.querySelector("img")) el.innerHTML = ""
    onChange(el.innerHTML)
  }

  const alPegar = (e: React.ClipboardEvent) => {
    const dt = e.clipboardData
    const html = dt.getData("text/html")
    const texto = dt.getData("text/plain")
    const archivos = Array.from(dt.files)
    e.preventDefault()
    if (archivos.length && !html) void insertarImagenes(archivos, onAviso)
    else if (html) insertarHtml(sanearHtml(html))
    else if (texto) insertarHtml(textoAHtml(texto))
  }

  const alSoltar = (e: React.DragEvent) => {
    const archivos = Array.from(e.dataTransfer.files)
    if (!archivos.length) return
    e.preventDefault()
    void insertarImagenes(archivos, onAviso)
  }

  return (
    <div
      id={ID_EDITOR}
      ref={ref}
      className="contenido"
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label="Desarrollo del tema"
      data-placeholder="Escribí o pegá acá el desarrollo del tema…"
      onInput={emitir}
      onBlur={emitir}
      onPaste={alPegar}
      onDrop={alSoltar}
    />
  )
}

// ── Barra de formato ─────────────────────────────────────────────────────────

function Boton({ titulo, onClick, children }: { titulo: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" title={titulo} aria-label={titulo} onMouseDown={(e) => e.preventDefault()} onClick={onClick}>
      {children}
    </button>
  )
}

export function BarraFormato({ onAviso }: { onAviso: (msg: string) => void }) {
  const inputImg = useRef<HTMLInputElement>(null)
  return (
    <div className="barra" role="toolbar" aria-label="Formato del desarrollo del tema">
      <span className="barra-etiqueta">Desarrollo del tema</span>
      <Boton titulo="Negrita (Ctrl+B)" onClick={() => comando("bold")}><b>B</b></Boton>
      <Boton titulo="Cursiva (Ctrl+I)" onClick={() => comando("italic")}><i className="font-serif">I</i></Boton>
      <Boton titulo="Subrayado (Ctrl+U)" onClick={() => comando("underline")}><u>U</u></Boton>
      <span className="sep" />
      <Boton titulo="Subtítulo" onClick={() => comando("formatBlock", "<h3>")}><IconoTitulo /></Boton>
      <Boton titulo="Texto normal" onClick={() => comando("formatBlock", "<p>")}><IconoParrafo /></Boton>
      <Boton titulo="Lista con viñetas" onClick={() => comando("insertUnorderedList")}><IconoLista /></Boton>
      <Boton titulo="Lista numerada" onClick={() => comando("insertOrderedList")}><IconoListaNumerada /></Boton>
      <span className="sep" />
      <Boton titulo="Insertar imagen" onClick={() => inputImg.current?.click()}><IconoImagen /><span className="hidden sm:inline">Imagen</span></Boton>
      <Boton titulo="Quitar formato" onClick={() => comando("removeFormat")}><IconoBorrarFormato /></Boton>
      <input
        ref={inputImg}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        multiple
        hidden
        onChange={(e) => {
          void insertarImagenes(Array.from(e.target.files ?? []), onAviso)
          e.target.value = ""
        }}
      />
    </div>
  )
}
