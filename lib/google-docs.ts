// Crea el documento directamente en el Google Drive de quien usa la app.
//
// Se genera el mismo .docx que "Descargar Word" (plantilla original) y se sube a
// Drive pidiendo la conversión a Google Docs. El permiso lo da la propia cuenta de
// Google de la persona (ventana de Google, scope drive.file: la app solo ve los
// archivos que ella misma crea). No hay servidor ni credenciales guardadas: el token
// vive en memoria y vence en una hora.
//
// Requiere NEXT_PUBLIC_GOOGLE_CLIENT_ID (cliente OAuth "Aplicación web" con el
// origen del sitio autorizado). Sin esa variable, la app usa copiar y pegar.

import { nombreArchivo, type Documento } from "./documento"

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""
const SCOPE = "https://www.googleapis.com/auth/drive.file"
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

export const googleDocsDirecto = CLIENT_ID !== ""

// Tipos mínimos de Google Identity Services
interface RespuestaToken { access_token?: string; expires_in?: number; error?: string }
interface ClienteToken { requestAccessToken: (o?: { prompt?: string }) => void }
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (c: {
            client_id: string
            scope: string
            callback: (r: RespuestaToken) => void
            error_callback?: (e: { type: string }) => void
          }) => ClienteToken
        }
      }
    }
  }
}

export class ErrorGoogle extends Error {
  constructor(public motivo: "cancelado" | "bloqueado" | "sin-cargar" | "subida", mensaje?: string) {
    super(mensaje ?? motivo)
  }
}

let cliente: ClienteToken | null = null
let token: { valor: string; vence: number } | null = null
let pendiente: { ok: (t: string) => void; mal: (e: Error) => void } | null = null

/** Carga la librería de Google al abrir la página: el pedido de permiso tiene que
 *  salir en el mismo clic (si no, el navegador bloquea la ventana de Google). */
export function precargarGoogle(): void {
  if (!googleDocsDirecto || typeof window === "undefined" || document.getElementById("gis")) return
  const s = document.createElement("script")
  s.id = "gis"
  s.src = "https://accounts.google.com/gsi/client"
  s.async = true
  s.onload = () => {
    cliente = window.google!.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (r) => {
        const p = pendiente
        pendiente = null
        if (r.access_token) {
          token = { valor: r.access_token, vence: Date.now() + ((r.expires_in ?? 3600) - 60) * 1000 }
          p?.ok(r.access_token)
        } else {
          p?.mal(new ErrorGoogle("cancelado", r.error))
        }
      },
      error_callback: (e) => {
        const p = pendiente
        pendiente = null
        p?.mal(new ErrorGoogle(e.type === "popup_failed_to_open" ? "bloqueado" : "cancelado", e.type))
      },
    })
  }
  document.head.appendChild(s)
}

const tokenVigente = () => (token && token.vence > Date.now() ? token.valor : null)

/** Pide permiso (si hace falta). Llamar sincrónicamente dentro del clic. */
function obtenerToken(): Promise<string> {
  const t = tokenVigente()
  if (t) return Promise.resolve(t)
  if (!cliente) return Promise.reject(new ErrorGoogle("sin-cargar"))
  return new Promise((ok, mal) => {
    pendiente = { ok, mal }
    cliente!.requestAccessToken({ prompt: "" })
  })
}

async function subir(doc: Documento, archivo: Blob, t: string): Promise<string> {
  const meta = { name: nombreArchivo(doc), mimeType: "application/vnd.google-apps.document" }
  const form = new FormData()
  form.append("metadata", new Blob([JSON.stringify(meta)], { type: "application/json" }))
  form.append("file", new Blob([archivo], { type: DOCX }))
  const r = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", {
    method: "POST",
    headers: { Authorization: `Bearer ${t}` },
    body: form,
  })
  if (r.status === 401) token = null
  if (!r.ok) throw new ErrorGoogle("subida", `Drive respondió ${r.status}`)
  const { id, webViewLink } = (await r.json()) as { id: string; webViewLink?: string }
  return webViewLink || `https://docs.google.com/document/d/${id}/edit`
}

/**
 * Crea el Google Doc y devuelve su enlace. Llamar directamente desde el clic.
 * Si ya hay permiso, abre la pestaña en el acto y la lleva al documento cuando
 * está listo; si no, se intenta abrir al final (la página muestra el enlace igual).
 */
export async function crearEnGoogleDocs(doc: Documento): Promise<{ url: string; abierto: boolean }> {
  const pestana = tokenVigente() ? window.open("", "_blank") : null
  if (pestana) {
    pestana.opener = null
    pestana.document.title = "Creando documento…"
    pestana.document.body.style.cssText = "font:16px system-ui,sans-serif;color:#192441;display:grid;place-items:center;height:100vh;margin:0"
    pestana.document.body.textContent = "Creando el documento en Google Docs…"
  }
  try {
    const pedirToken = obtenerToken() // primero: tiene que salir en el mismo clic
    const { generarWord } = await import("./exportar-word")
    const [t, archivo] = await Promise.all([pedirToken, generarWord(doc)])
    const url = await subir(doc, archivo, t)
    if (pestana && !pestana.closed) {
      pestana.location.href = url
      return { url, abierto: true }
    }
    const nueva = window.open(url, "_blank")
    return { url, abierto: !!nueva }
  } catch (err) {
    pestana?.close()
    throw err
  }
}
