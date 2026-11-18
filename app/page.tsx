"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Hoja from "@/components/Hoja"
import Recorrido from "@/components/Recorrido"
import { BarraFormato } from "@/components/Editor"
import {
  IconoAlerta,
  IconoAyuda,
  IconoCandado,
  IconoCerrar,
  IconoCheck,
  IconoDescargar,
  IconoDocumento,
  IconoExterno,
  IconoImprimir,
  IconoLimpiar,
} from "@/components/Iconos"
import {
  borrarBorrador,
  cargarBorrador,
  documentoNuevo,
  guardarBorrador,
  nombreArchivo,
  type Documento,
} from "@/lib/documento"
import { copiarAlPortapapeles, descargar, imprimir } from "@/lib/exportar-html"
import { registrarGeneracion } from "@/lib/registro"
import { crearEnGoogleDocs, ErrorGoogle, googleDocsDirecto, precargarGoogle } from "@/lib/google-docs"

type Accion = "word" | "gdocs" | "pdf" | null
type Aviso = { titulo: string; detalle?: React.ReactNode; tipo: "ok" | "error" }

export default function Inicio() {
  const [doc, setDoc] = useState<Documento | null>(null)
  const [version, setVersion] = useState(0)
  const [ocupado, setOcupado] = useState<Accion>(null)
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [ayuda, setAyuda] = useState(false)
  const timerAviso = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Cargar borrador solo en el cliente (la página es estática)
  useEffect(() => {
    setDoc(cargarBorrador() ?? documentoNuevo())
    precargarGoogle()
  }, [])

  // Autoguardado local
  useEffect(() => {
    if (!doc) return
    const t = setTimeout(() => guardarBorrador(doc), 400)
    return () => clearTimeout(t)
  }, [doc])

  const mostrarAviso = useCallback((a: Aviso, ms = 6000) => {
    clearTimeout(timerAviso.current)
    setAviso(a)
    timerAviso.current = setTimeout(() => setAviso(null), ms)
  }, [])

  if (!doc) return <main className="min-h-dvh" />

  const tieneContenido = !!(doc.titulo || doc.responsable || doc.desarrollo || doc.asistentes.some((a) => a.nombre || a.operacion))

  // Limpia el borrador para empezar otro documento; se puede deshacer desde el aviso
  const limpiar = () => {
    if (!tieneContenido) {
      mostrarAviso({ titulo: "El borrador ya está vacío", tipo: "ok" }, 3000)
      return
    }
    const anterior = doc
    borrarBorrador()
    setDoc(documentoNuevo())
    setVersion((v) => v + 1)
    mostrarAviso(
      {
        titulo: "Borrador limpio",
        detalle: (
          <>
            Ya podés empezar otro documento.{" "}
            <button
              type="button"
              className="font-semibold text-[var(--text)] underline underline-offset-2"
              onClick={() => {
                setDoc(anterior)
                setVersion((v) => v + 1)
                setAviso(null)
              }}
            >Deshacer</button>
          </>
        ),
        tipo: "ok",
      },
      10000,
    )
  }

  const exportarWord = async () => {
    setOcupado("word")
    try {
      const { generarWord } = await import("@/lib/exportar-word")
      const blob = await generarWord(doc)
      descargar(blob, `${nombreArchivo(doc)}.docx`)
      registrarGeneracion(doc, "Word")
      mostrarAviso({ titulo: "Documento descargado", detalle: "Abrilo con Word, LibreOffice o subilo a Google Drive.", tipo: "ok" })
    } catch (err) {
      console.error(err)
      mostrarAviso({ titulo: "No se pudo generar el Word", detalle: "Probá de nuevo en unos segundos.", tipo: "error" })
    } finally {
      setOcupado(null)
    }
  }

  const abrirEnGoogleDocs = () => (googleDocsDirecto ? crearGoogleDoc() : copiarParaGoogleDocs())

  // Con NEXT_PUBLIC_GOOGLE_CLIENT_ID: se crea el documento en el Drive de quien lo usa
  const crearGoogleDoc = async () => {
    setOcupado("gdocs")
    try {
      const { url, abierto } = await crearEnGoogleDocs(doc)
      registrarGeneracion(doc, "Google Docs")
      mostrarAviso(
        {
          titulo: "Documento creado en tu Google Drive",
          detalle: (
            <>
              {abierto ? "Se abrió en una pestaña nueva. " : ""}
              <a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">Abrir en Google Docs</a>
            </>
          ),
          tipo: "ok",
        },
        abierto ? 8000 : 30000,
      )
    } catch (err) {
      console.error(err)
      const motivo = err instanceof ErrorGoogle ? err.motivo : "subida"
      const textos: Record<string, [string, string]> = {
        cancelado: ["No se dio permiso a Google", "Para crear el documento hace falta aceptar el permiso en la ventana de Google."],
        bloqueado: ["El navegador bloqueó la ventana de Google", "Permití las ventanas emergentes para este sitio y volvé a tocar Google Docs."],
        "sin-cargar": ["Google todavía no terminó de cargar", "Esperá unos segundos y volvé a intentar."],
        subida: ["No se pudo crear en Google Docs", "Probá de nuevo, o descargá el Word y subilo a Google Drive."],
      }
      const [titulo, detalle] = textos[motivo]
      mostrarAviso({
        titulo,
        detalle,
        tipo: "error",
      })
    } finally {
      setOcupado(null)
    }
  }

  // Sin cliente de Google configurado: copiar y pegar en un documento nuevo
  const copiarParaGoogleDocs = async () => {
    setOcupado("gdocs")
    try {
      await copiarAlPortapapeles(doc)
      registrarGeneracion(doc, "Google Docs")
      window.open("https://docs.new", "_blank", "noopener")
      mostrarAviso(
        {
          titulo: "Documento copiado",
          detalle: (
            <>
              En la pestaña de Google Docs que se abrió, pegá con <kbd className="rounded border px-1 text-xs">Ctrl</kbd> + <kbd className="rounded border px-1 text-xs">V</kbd>. Se crea en tu propia cuenta.
            </>
          ),
          tipo: "ok",
        },
        12000,
      )
    } catch (err) {
      console.error(err)
      mostrarAviso({ titulo: "Tu navegador no permitió copiar", detalle: "Descargá el Word y subilo a Google Drive.", tipo: "error" })
    } finally {
      setOcupado(null)
    }
  }

  const exportarPdf = () => {
    setOcupado("pdf")
    try {
      imprimir()
      registrarGeneracion(doc, "PDF")
    } finally {
      setTimeout(() => setOcupado(null), 800)
    }
  }

  return (
    <div className="min-h-dvh">
      {/* ── Barra superior ── */}
      <header className="cabecera z-20 md:sticky md:top-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
          <div className="mr-auto flex items-center gap-3">
            <span className="marca" aria-hidden><IconoDocumento className="h-[18px] w-[18px]" /></span>
            <div className="leading-tight">
              <h1 className="titulo-app text-[17px]">Documento libre</h1>
              <p className="texto-2 text-xs">Formato de asistencia a capacitaciones</p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-1.5" aria-label="Acciones del documento">
            <button className="btn btn-fantasma" onClick={() => setAyuda(true)}><IconoAyuda />Ayuda</button>
            <button className="btn btn-fantasma" onClick={exportarPdf} data-tour="generar" disabled={!!ocupado}><IconoImprimir />PDF</button>
            <button className="btn" onClick={abrirEnGoogleDocs} disabled={!!ocupado} data-tour="generar">
              <IconoExterno />{ocupado === "gdocs" ? (googleDocsDirecto ? "Creando…" : "Copiando…") : "Google Docs"}
            </button>
            <button className="btn btn-primario" onClick={exportarWord} disabled={!!ocupado} data-tour="generar">
              <IconoDescargar />{ocupado === "word" ? "Generando…" : "Descargar Word"}
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-28 pt-6 sm:px-6">
        <div className="mb-2 flex w-full max-w-[870px] items-center justify-end text-xs">
          <span className="texto-2 flex items-center gap-1.5">
            <IconoCheck className="h-3.5 w-3.5" />Guardado en este navegador
          </span>
        </div>

        <BarraFormato onAviso={(m) => mostrarAviso({ titulo: m, tipo: "error" })} />

        {/* Marco de borrador: indica que la hoja es una vista previa; no sale en el documento */}
        <div className="marco-borrador">
          <div className="marco-etiqueta">
            <span className="marco-sello">Borrador</span>
            <span className="mr-auto">Vista previa de la plantilla. El documento final se crea al descargarlo.</span>
            <button type="button" className="marco-ayuda" onClick={() => setAyuda(true)}>¿Cómo se usa?</button>
            <button type="button" className="marco-limpiar" onClick={limpiar} data-tour="limpiar">
              <IconoLimpiar />Limpiar borrador
            </button>
          </div>
          <Hoja
            doc={doc}
            version={version}
            onChange={setDoc}
            onAviso={(m) => mostrarAviso({ titulo: m, tipo: "error" })}
          />
        </div>

        <section className="mt-8 grid w-full max-w-[870px] gap-3 text-[13px] sm:grid-cols-3">
          {[
            { icono: <IconoDescargar />, titulo: "Word", texto: "Un .docx listo para Word, LibreOffice o Google Drive." },
            {
              icono: <IconoExterno />,
              titulo: "Google Docs",
              texto: googleDocsDirecto
                ? "Se crea en tu Google Drive y se abre solo. La primera vez, Google te pide permiso."
                : "Se copia el documento y se abre uno nuevo en tu cuenta.",
            },
            { icono: <IconoCandado />, titulo: "Sin cuentas", texto: "No hace falta registrarse. Al generar, se registran los datos del formato." },
          ].map((t) => (
            <div key={t.titulo} className="tarjeta flex gap-3">
              <span className="icono-suave shrink-0">{t.icono}</span>
              <div>
                <b className="block font-semibold">{t.titulo}</b>
                <span className="texto-2">{t.texto}</span>
              </div>
            </div>
          ))}
        </section>

        <footer className="pie">Creado por Edward Ravelo</footer>
      </main>

      <Recorrido abierto={ayuda} onCerrar={() => setAyuda(false)} />

      {aviso && (
        <div role="status" className="aviso">
          <span style={{ color: aviso.tipo === "error" ? "#dc2626" : "var(--accent)" }}>
            {aviso.tipo === "error" ? <IconoAlerta /> : <IconoCheck />}
          </span>
          <div className="min-w-0 flex-1">
            <b className="block font-semibold">{aviso.titulo}</b>
            {aviso.detalle && <span className="texto-2">{aviso.detalle}</span>}
          </div>
          <button onClick={() => setAviso(null)} className="texto-2 -mr-1 rounded p-0.5 hover:text-current" aria-label="Cerrar aviso">
            <IconoCerrar className="h-4 w-4" />
          </button>
        </div>
      )}

    </div>
  )
}
