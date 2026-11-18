"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { IconoCerrar } from "./Iconos"
import { googleDocsDirecto } from "@/lib/google-docs"

// Instructivo paso a paso: ilumina una parte de la pantalla, sombrea el resto y
// explica qué hacer ahí. Cada paso apunta a elementos con data-tour="…"; si un paso
// apunta a varios, ilumina el rectángulo que los contiene a todos.

interface Paso { destino: string; titulo: string; texto: React.ReactNode }

const PASOS: Paso[] = [
  {
    destino: ".marco-borrador",
    titulo: "Esto es un borrador",
    texto: (
      <>
        La hoja replica la plantilla RE-VOC-TR-02. El marco y las marcas de color son solo una guía: no
        salen en el documento final. Lo que escribís se guarda solo en este navegador.
      </>
    ),
  },
  {
    destino: '[data-tour="fecha"]',
    titulo: "Fecha",
    texto: "Hacé clic en el día, el mes o el año para elegir la fecha. Por defecto es la de hoy.",
  },
  {
    destino: '[data-tour="datos"]',
    titulo: "Datos de la capacitación",
    texto: "Completá el título, el responsable y las horas de inicio y finalización. Los campos en rosa son los que faltan llenar.",
  },
  {
    destino: '[data-tour="desarrollo"]',
    titulo: "Desarrollo del tema",
    texto: "Escribilo acá o pegalo desde Word o Google Docs. También podés arrastrar o pegar imágenes.",
  },
  {
    destino: ".barra",
    titulo: "Formato del desarrollo",
    texto: "Con esta barra le das negrita, cursiva o subrayado, armás subtítulos y listas, o insertás una imagen.",
  },
  {
    destino: '[data-tour="asistentes"]',
    titulo: "Asistentes",
    texto: (
      <>
        Nombre y operación de cada persona, una por fila. Con <b>+ Agregar asistente</b>, debajo de la hoja,
        sumás filas; para quitar una, pasá el mouse por encima y tocá la ×.
      </>
    ),
  },
  {
    destino: '[data-tour="generar"]',
    titulo: "Generá el documento",
    texto: (
      <ul className="recorrido-lista">
        <li><b>Descargar Word:</b> un .docx con el formato oficial.</li>
        <li>
          <b>Google Docs:</b>{" "}
          {googleDocsDirecto
            ? "se crea en tu Google Drive y se abre solo. La primera vez, Google te pide permiso."
            : "se copia el documento; pegalo con Ctrl + V en la pestaña que se abre."}
        </li>
        <li><b>PDF:</b> en la ventana de impresión elegí “Guardar como PDF”.</li>
        <li className="texto-2">Al generar, los datos del formato se registran para el seguimiento de capacitaciones.</li>
      </ul>
    ),
  },
  {
    destino: '[data-tour="limpiar"]',
    titulo: "Limpiar borrador",
    texto: "Cuando termines, borrá todo para empezar otro documento. Si fue sin querer, lo recuperás con Deshacer en el aviso que aparece.",
  },
]

const MARGEN = 8 // aire alrededor de lo iluminado
const BORDE = 16 // distancia mínima a los bordes de la ventana

type Caja = { top: number; left: number; width: number; height: number }

function medir(selector: string): Caja | null {
  const r = [...document.querySelectorAll(selector)].map((e) => e.getBoundingClientRect()).filter((x) => x.width > 0 && x.height > 0)
  if (!r.length) return null
  const top = Math.min(...r.map((x) => x.top))
  const left = Math.min(...r.map((x) => x.left))
  const bottom = Math.max(...r.map((x) => x.bottom))
  const right = Math.max(...r.map((x) => x.right))
  return { top: top - MARGEN, left: left - MARGEN, width: right - left + MARGEN * 2, height: bottom - top + MARGEN * 2 }
}

const sinMovimiento = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

export default function Recorrido({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const [i, setI] = useState(0)
  const [caja, setCaja] = useState<Caja | null>(null)
  const [altoTarjeta, setAltoTarjeta] = useState(220)
  const [vista, setVista] = useState({ w: 1024, h: 768 })
  const tarjeta = useRef<HTMLDivElement>(null)
  const botonSiguiente = useRef<HTMLButtonElement>(null)
  const paso = PASOS[i]
  const ultimo = i === PASOS.length - 1

  useEffect(() => { if (abierto) setI(0) }, [abierto])

  // Llevar el paso a la vista y seguirlo al desplazar o cambiar el tamaño
  useLayoutEffect(() => {
    if (!abierto) return
    const inicial = medir(paso.destino)
    if (inicial) {
      const libre = window.innerHeight - altoTarjeta - 40
      const destino = inicial.height < libre
        ? window.scrollY + inicial.top - Math.max(90, (libre - inicial.height) / 2)
        : window.scrollY + inicial.top - 90
      window.scrollTo({ top: Math.max(0, destino), behavior: sinMovimiento() ? "auto" : "smooth" })
    }
    const ubicar = () => {
      setCaja(medir(paso.destino))
      setVista({ w: window.innerWidth, h: window.innerHeight })
    }
    // Medir es barato (unos pocos rectángulos): se hace en cada evento, sin esperar
    // un cuadro de animación, así el foco nunca queda atrasado respecto de la página.
    ubicar()
    window.addEventListener("scroll", ubicar, true)
    window.addEventListener("resize", ubicar)
    return () => {
      window.removeEventListener("scroll", ubicar, true)
      window.removeEventListener("resize", ubicar)
    }
    // altoTarjeta solo afecta el desplazamiento inicial de cada paso
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, i, paso.destino])

  // Alto real de la tarjeta, para ubicarla arriba o abajo de lo iluminado
  useEffect(() => {
    const t = tarjeta.current
    if (!abierto || !t) return
    const ro = new ResizeObserver(() => setAltoTarjeta(t.offsetHeight))
    ro.observe(t)
    return () => ro.disconnect()
  }, [abierto])

  useEffect(() => { if (abierto) botonSiguiente.current?.focus({ preventScroll: true }) }, [abierto, i])

  const siguiente = useCallback(() => (ultimo ? onCerrar() : setI((n) => n + 1)), [ultimo, onCerrar])
  const anterior = useCallback(() => setI((n) => Math.max(0, n - 1)), [])

  useEffect(() => {
    if (!abierto) return
    const tecla = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onCerrar()
      else if (ev.key === "ArrowRight") siguiente()
      else if (ev.key === "ArrowLeft") anterior()
    }
    window.addEventListener("keydown", tecla)
    return () => window.removeEventListener("keydown", tecla)
  }, [abierto, siguiente, anterior, onCerrar])

  if (!abierto) return null

  // Posición de la tarjeta: debajo de lo iluminado, si no entra arriba, si no abajo de todo
  const ancho = Math.min(360, vista.w - BORDE * 2)
  let top: number
  let left: number
  if (!caja) {
    top = (vista.h - altoTarjeta) / 2
    left = (vista.w - ancho) / 2
  } else {
    const abajo = caja.top + caja.height + 12
    const arriba = caja.top - 12 - altoTarjeta
    top = abajo + altoTarjeta <= vista.h - BORDE ? abajo : arriba >= BORDE ? arriba : vista.h - altoTarjeta - BORDE
    left = Math.min(Math.max(caja.left + caja.width / 2 - ancho / 2, BORDE), vista.w - ancho - BORDE)
  }

  return (
    <>
      {/* Bloquea los clics en la página mientras dura el recorrido */}
      <div className="recorrido-bloqueo" aria-hidden />
      <div className="recorrido-foco" aria-hidden style={caja ?? { top: vista.h / 2, left: vista.w / 2, width: 0, height: 0 }} />
      <div
        ref={tarjeta}
        className="recorrido-tarjeta"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recorrido-titulo"
        aria-describedby="recorrido-texto"
        style={{ top, left, width: ancho }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="recorrido-contador">Paso {i + 1} de {PASOS.length}</p>
            <h2 id="recorrido-titulo" className="titulo-app text-base">{paso.titulo}</h2>
          </div>
          <button onClick={onCerrar} className="texto-2 -mr-1 -mt-0.5 rounded-md p-1 hover:text-current" aria-label="Cerrar instructivo">
            <IconoCerrar className="h-4 w-4" />
          </button>
        </div>
        <div id="recorrido-texto" className="mt-1.5 text-[13.5px] leading-relaxed">{paso.texto}</div>
        <div className="mt-4 flex items-center gap-2">
          <div className="recorrido-puntos mr-auto" aria-hidden>
            {PASOS.map((_, n) => <span key={n} className={n === i ? "activo" : n < i ? "hecho" : ""} />)}
          </div>
          {i > 0 && <button className="btn btn-fantasma" onClick={anterior}>Anterior</button>}
          <button ref={botonSiguiente} className="btn btn-primario" onClick={siguiente}>{ultimo ? "Finalizar" : "Siguiente"}</button>
        </div>
      </div>
    </>
  )
}
