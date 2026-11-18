// Registro de documentos generados en una planilla de Google Sheets.
//
// La app es estática y pública: no guarda credenciales. El registro se envía a
// un Google Apps Script publicado como aplicación web (ver apps-script/Registro.gs),
// que corre con la cuenta dueña de la planilla y agrega una fila por cada
// descarga o copia. Si NEXT_PUBLIC_REGISTRO_URL no está configurada, no se envía nada.

import { partesFecha, type Documento } from "./documento"
import { htmlATexto } from "./html"

export type Salida = "Word" | "Google Docs" | "PDF"

const URL_REGISTRO = process.env.NEXT_PUBLIC_REGISTRO_URL ?? ""

// Límite de Google Sheets: 50.000 caracteres por celda
const MAX_CELDA = 45000

export interface Registro {
  idDocumento: string
  salida: Salida
  generadoEn: string // ISO, hora del navegador
  fecha: string // DD/MM/AAAA del documento
  titulo: string
  responsable: string
  horaInicio: string
  horaFin: string
  asistentes: string // "Nombre (Operación); …"
  cantidadAsistentes: number
  desarrollo: string // texto plano
  imagenes: number
}

export function armarRegistro(doc: Documento, salida: Salida): Registro {
  const { dia, mes, anio } = partesFecha(doc.fecha)
  const asistentes = doc.asistentes
    .map((a) => ({ nombre: a.nombre.trim(), operacion: a.operacion.trim() }))
    .filter((a) => a.nombre || a.operacion)
  return {
    idDocumento: doc.id,
    salida,
    generadoEn: new Date().toISOString(),
    fecha: `${dia}/${mes}/${anio}`,
    titulo: doc.titulo.trim(),
    responsable: doc.responsable.trim(),
    horaInicio: doc.horaInicio.trim(),
    horaFin: doc.horaFin.trim(),
    asistentes: asistentes.map((a) => (a.operacion ? `${a.nombre} (${a.operacion})` : a.nombre)).join("; ").slice(0, MAX_CELDA),
    cantidadAsistentes: asistentes.length,
    desarrollo: htmlATexto(doc.desarrollo).slice(0, MAX_CELDA),
    imagenes: (doc.desarrollo.match(/<img /g) ?? []).length,
  }
}

/**
 * Envía el registro sin bloquear al usuario. Nunca lanza error: si falla
 * (sin conexión, script caído), el documento igual se generó.
 */
export function registrarGeneracion(doc: Documento, salida: Salida): void {
  if (!URL_REGISTRO) return
  try {
    const cuerpo = JSON.stringify(armarRegistro(doc, salida))
    // text/plain evita la verificación CORS previa; Apps Script responde con una
    // redirección que no necesitamos leer (modo no-cors).
    void fetch(URL_REGISTRO, {
      method: "POST",
      mode: "no-cors",
      keepalive: cuerpo.length < 60000,
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: cuerpo,
    }).catch(() => {})
  } catch {}
}
