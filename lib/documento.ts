// Modelo del documento. Corresponde 1:1 con los marcadores de la plantilla
// RE-VOC-TR-02 (public/plantilla/reporte.docx): {{DIA}} {{MES}} {{AÑO}}
// {{TITULO}} {{RESPONSABLE}} {{DESARROLLO}} {{ASISTENTES}} {{SKILL}}.
// Todo vive en el navegador: sin Google Drive, sin cuentas, sin servidor.

export interface Asistente {
  nombre: string
  operacion: string
}

export interface Documento {
  id: string // identifica el documento en la planilla de registro (varias descargas = mismo id)
  fecha: string // YYYY-MM-DD
  titulo: string
  responsable: string
  horaInicio: string
  horaFin: string
  desarrollo: string // HTML saneado (ver lib/html.ts)
  asistentes: Asistente[]
}

/** Filas de asistentes que trae la plantilla original. */
export const FILAS_ASISTENTES_INICIALES = 8

export function hoyISO(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function nuevoId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  }
}

export function documentoNuevo(): Documento {
  return {
    id: nuevoId(),
    fecha: hoyISO(),
    titulo: "",
    responsable: "",
    horaInicio: "",
    horaFin: "",
    desarrollo: "",
    asistentes: Array.from({ length: FILAS_ASISTENTES_INICIALES }, () => ({ nombre: "", operacion: "" })),
  }
}

export function partesFecha(iso: string): { dia: string; mes: string; anio: string } {
  const [anio = "", mes = "", dia = ""] = iso.split("-")
  return { dia, mes, anio }
}

export function nombreArchivo(doc: Documento): string {
  const base = `RE-VOC-TR-02 ${doc.titulo || "Documento"}`
  return base.replace(/[\\/:*?"<>|]+/g, "").trim().slice(0, 120)
}

// ── Persistencia local (solo comodidad: el borrador queda en este navegador) ──

const CLAVE = "documento-libre:v2"

export function cargarBorrador(): Documento | null {
  try {
    const raw = localStorage.getItem(CLAVE)
    if (!raw) return null
    const base = documentoNuevo()
    const g = JSON.parse(raw) as Partial<Documento>
    return {
      id: typeof g.id === "string" && g.id ? g.id : base.id,
      fecha: typeof g.fecha === "string" ? g.fecha : base.fecha,
      titulo: g.titulo ?? "",
      responsable: g.responsable ?? "",
      horaInicio: g.horaInicio ?? "",
      horaFin: g.horaFin ?? "",
      desarrollo: g.desarrollo ?? "",
      asistentes: Array.isArray(g.asistentes) && g.asistentes.length ? g.asistentes : base.asistentes,
    }
  } catch {
    return null
  }
}

export function guardarBorrador(doc: Documento): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(doc))
  } catch {
    // Sin espacio (imágenes grandes) o almacenamiento bloqueado: se ignora.
  }
}

export function borrarBorrador(): void {
  try {
    localStorage.removeItem(CLAVE)
  } catch {}
}
