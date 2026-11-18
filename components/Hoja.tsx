"use client"

import { useEffect, useRef, useState } from "react"
import { EditorContenido } from "./Editor"
import { partesFecha, type Documento } from "@/lib/documento"
import { ruta } from "@/lib/ruta"

// Réplica en pantalla de la plantilla RE-VOC-TR-02 (public/plantilla/reporte.docx).
// Las medidas salen del .docx original (twips ÷ 15 = px a 96 dpi); ver
// "Hoja" en app/globals.css. El Word final se genera desde la plantilla real.

interface Props {
  doc: Documento
  version: number // cambia al crear un documento nuevo → remonta el editor
  onChange: (doc: Documento) => void
  onAviso: (msg: string) => void
}

const ANCHO_PAGINA = 816 // Carta: 8,5" × 96

/** Escala la hoja para que entre en pantallas angostas sin alterar su diseño. */
function useEscala(ref: React.RefObject<HTMLDivElement | null>) {
  const [escala, setEscala] = useState(1)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = () => setEscala(Math.min(1, el.clientWidth / ANCHO_PAGINA))
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return escala
}

export default function Hoja({ doc, version, onChange, onAviso }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const inputFecha = useRef<HTMLInputElement>(null)
  const escala = useEscala(contenedor)
  const { dia, mes, anio } = partesFecha(doc.fecha)

  const set = <K extends keyof Documento>(k: K, v: Documento[K]) => onChange({ ...doc, [k]: v })
  const setAsistente = (i: number, campo: "nombre" | "operacion", v: string) =>
    set("asistentes", doc.asistentes.map((a, idx) => (idx === i ? { ...a, [campo]: v } : a)))

  const abrirFecha = () => {
    const el = inputFecha.current
    if (!el) return
    try { el.showPicker() } catch { el.focus() }
  }

  return (
    <div ref={contenedor} className="w-full">
      <div className="mx-auto" style={{ width: ANCHO_PAGINA, zoom: escala }}>
        <article className="pagina editable" aria-label="Documento RE-VOC-TR-02">
          {/* ── Encabezado del formato (fijo, igual a la plantilla) ── */}
          <table className="t-enc" aria-label="Encabezado del formato">
            <colgroup><col style={{ width: 118 }} /><col style={{ width: 270 }} /><col style={{ width: 200 }} /></colgroup>
            <tbody>
              <tr style={{ height: 19 }}>
                <td rowSpan={5} className="enc-logo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ruta("/plantilla/logo.png")} alt="Voccare" width={104} height={92} />
                  <p>&nbsp;</p>
                  <p>&nbsp;</p>
                </td>
                <td rowSpan={3}>
                  <p>TÍTULO:</p>
                  <p className="enc-titulo">FORMATO DE ASISTENCIA CAPACITACIONES</p>
                </td>
                <td><p><b>Código: </b><b className="enc-codigo">RE-VOC-TR-02</b></p></td>
              </tr>
              <tr style={{ height: 19 }}><td><p><b>Versión: </b>02</p></td></tr>
              <tr style={{ height: 19 }}><td><p><b>Clasificación: </b>Interna</p></td></tr>
              <tr style={{ height: 40 }}>
                <td rowSpan={2}>
                  <p>PROCESO:</p>
                  <p>&nbsp;</p>
                  <p className="text-center"><b>TRAINING</b></p>
                </td>
                <td><p><b>Fecha de modificación: </b> 05/08/2026</p></td>
              </tr>
              <tr style={{ height: 29 }}><td><p className="enc-ultima"><b>Fecha de revisión: </b></p></td></tr>
            </tbody>
          </table>

          {/* ── Fecha ── */}
          <table className="t-fecha" aria-label="Fecha" data-tour="fecha">
            <colgroup><col style={{ width: 57 }} /><col style={{ width: 59 }} /><col style={{ width: 72 }} /></colgroup>
            <tbody>
              <tr><th>DIA</th><th>MES</th><th>AÑO</th></tr>
              <tr className="fila-clic" style={{ height: 28 }} onClick={abrirFecha} title="Hacé clic para cambiar la fecha">
                <td>{dia}</td>
                <td>{mes}</td>
                <td className="relative">
                  {anio}
                  <input
                    ref={inputFecha}
                    type="date"
                    aria-label="Fecha del documento"
                    value={doc.fecha}
                    onChange={(ev) => ev.target.value && set("fecha", ev.target.value)}
                    className="pointer-events-none absolute inset-0 opacity-0"
                    tabIndex={-1}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── Cuerpo ── */}
          <table className="t-principal">
            <colgroup><col style={{ width: 516 }} /><col style={{ width: 162 }} /></colgroup>
            <tbody>
              <tr style={{ height: 30 }} data-tour="datos">
                <td colSpan={2}>
                  <label className="campo-linea">
                    <b>TÍTULO:</b>
                    <input className="campo font-bold" placeholder="Título de la capacitación" value={doc.titulo} onChange={(ev) => set("titulo", ev.target.value)} />
                  </label>
                </td>
              </tr>
              <tr style={{ height: 38 }} data-tour="datos">
                <td colSpan={2}>
                  <label className="campo-linea">
                    <b>RESPONSABLE:</b>
                    <input className="campo font-bold" placeholder="Nombre y apellido" value={doc.responsable} onChange={(ev) => set("responsable", ev.target.value)} />
                  </label>
                </td>
              </tr>
              <tr style={{ height: 27 }} data-tour="datos">
                <td colSpan={2}>
                  <div className="flex items-baseline">
                    <label className="campo-linea shrink-0" style={{ width: 236 }}>
                      <b>HORA DE INICIO:</b>
                      <input className="campo font-bold" placeholder="09:00" value={doc.horaInicio} onChange={(ev) => set("horaInicio", ev.target.value)} />
                    </label>
                    <label className="campo-linea min-w-0 flex-1">
                      <b>HORA DE FINALIZACIÓN:</b>
                      <input className="campo font-bold" placeholder="11:00" value={doc.horaFin} onChange={(ev) => set("horaFin", ev.target.value)} />
                    </label>
                  </div>
                </td>
              </tr>
              <tr style={{ height: 111 }} data-tour="desarrollo">
                <td colSpan={2} className="celda-desarrollo">
                  <p>&nbsp;</p>
                  <p className="sangria"><b>DESARROLLO DEL TEMA: </b></p>
                  <p>&nbsp;</p>
                  <div className="sangria">
                    <EditorContenido
                      key={version}
                      valorInicial={doc.desarrollo}
                      onChange={(html) => set("desarrollo", html)}
                      onAviso={onAviso}
                    />
                  </div>
                  <p>&nbsp;</p>
                  <p>&nbsp;</p>
                  <p>&nbsp;</p>
                </td>
              </tr>
              <tr style={{ height: 20 }} data-tour="asistentes"><td colSpan={2} className="text-center"><b>ASISTENTES</b></td></tr>
              <tr style={{ height: 20 }}>
                <td className="text-center"><b>NOMBRE</b></td>
                <td className="text-center"><b>OPERACIÓN</b></td>
              </tr>
              {doc.asistentes.map((a, i) => (
                <tr key={i} style={{ height: 19 }} className="group" data-tour="asistentes">
                  <td>
                    <input className="campo text-center font-bold" aria-label={`Nombre del asistente ${i + 1}`} placeholder="Nombre y apellido" value={a.nombre} onChange={(ev) => setAsistente(i, "nombre", ev.target.value)} />
                  </td>
                  <td className="relative">
                    <input className="campo text-center font-bold" aria-label={`Operación del asistente ${i + 1}`} placeholder="Operación" value={a.operacion} onChange={(ev) => setAsistente(i, "operacion", ev.target.value)} />
                    {doc.asistentes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => set("asistentes", doc.asistentes.filter((_, idx) => idx !== i))}
                        className="quitar-fila"
                        aria-label={`Quitar fila ${i + 1}`}
                        title="Quitar fila"
                      >×</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="franja" aria-hidden />
        </article>
      </div>
      <div className="mx-auto mt-3 flex items-center justify-between" style={{ maxWidth: ANCHO_PAGINA * escala }}>
        <button
          type="button"
          onClick={() => set("asistentes", [...doc.asistentes, { nombre: "", operacion: "" }])}
          className="btn btn-fantasma"
        >+ Agregar asistente</button>
        <span className="texto-2 text-xs">{doc.asistentes.length} filas de asistentes</span>
      </div>
    </div>
  )
}
