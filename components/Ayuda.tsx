"use client"

import { useEffect, useRef } from "react"
import { IconoCerrar } from "./Iconos"

// Panel con los pasos para completar y generar el documento.
// <dialog> nativo: Esc cierra y el foco queda dentro mientras está abierto.

export default function Ayuda({ abierta, onCerrar }: { abierta: boolean; onCerrar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (abierta && !d.open) d.showModal()
    if (!abierta && d.open) d.close()
  }, [abierta])

  return (
    <dialog
      ref={ref}
      className="dialogo"
      aria-labelledby="ayuda-titulo"
      onClose={onCerrar}
      onClick={(ev) => ev.target === ev.currentTarget && onCerrar()} // clic fuera del panel
    >
      <div className="dialogo-cabecera flex items-start gap-3">
        <div className="flex-1">
          <h2 id="ayuda-titulo" className="titulo-app text-lg">Cómo se usa</h2>
          <p className="texto-2 text-[13px]">Lo que ves es un borrador de la plantilla RE-VOC-TR-02. El documento final se crea al generarlo.</p>
        </div>
        <button onClick={onCerrar} className="texto-2 -mr-1 rounded-md p-1 hover:text-current" aria-label="Cerrar ayuda">
          <IconoCerrar className="h-5 w-5" />
        </button>
      </div>

      <ol className="pasos">
        <li className="paso">
          <div>
            <b>Completá los campos de la plantilla</b>
            Los espacios marcados así <span className="muestra-campo">Título de la capacitación</span> son los que tenés que llenar.
            <ul>
              <li>Título, responsable y horas de inicio y finalización.</li>
              <li>Para cambiar la fecha, hacé clic en el día, el mes o el año.</li>
            </ul>
          </div>
        </li>
        <li className="paso">
          <div>
            <b>Escribí el desarrollo del tema</b>
            Escribilo directamente o pegalo desde Word o Google Docs.
            <ul>
              <li>La barra de arriba de la hoja da negrita, subtítulos, listas e imágenes.</li>
              <li>También podés arrastrar o pegar una imagen dentro del recuadro.</li>
            </ul>
          </div>
        </li>
        <li className="paso">
          <div>
            <b>Cargá los asistentes</b>
            Nombre y operación de cada persona, una por fila.
            <ul>
              <li>“+ Agregar asistente”, debajo de la hoja, suma filas.</li>
              <li>Para quitar una fila, pasá el mouse por encima y tocá la ×.</li>
            </ul>
          </div>
        </li>
        <li className="paso">
          <div>
            <b>Generá el documento</b>
            Con los botones de arriba a la derecha:
            <ul>
              <li><b className="inline text-[var(--text)]">Descargar Word:</b> un .docx con el formato oficial, listo para Word o Google Drive.</li>
              <li><b className="inline text-[var(--text)]">Google Docs:</b> se copia el documento y se abre uno nuevo en tu cuenta; pegá con Ctrl + V.</li>
              <li><b className="inline text-[var(--text)]">PDF:</b> en la ventana de impresión elegí “Guardar como PDF”.</li>
            </ul>
          </div>
        </li>
      </ol>

      <div className="dialogo-pie">
        <span>El borrador se guarda solo en este navegador. “Nuevo” lo borra y empieza de cero.</span>
        <span>Las marcas de color y el marco no salen en el documento final.</span>
        <span>Al generar, los datos del formato se registran para el seguimiento de capacitaciones.</span>
      </div>
    </dialog>
  )
}
