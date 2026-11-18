// Íconos de línea (trazos estilo Lucide, 24×24). Heredan color y tamaño del contenedor.

type P = React.SVGProps<SVGSVGElement>

function Base({ children, ...props }: P & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

export const IconoDocumento = (p: P) => (
  <Base {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></Base>
)
export const IconoNuevo = (p: P) => (
  <Base {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M12 11v6M9 14h6" /></Base>
)
export const IconoDescargar = (p: P) => (
  <Base {...p}><path d="M12 4v11" /><path d="m7 10 5 5 5-5" /><path d="M5 20h14" /></Base>
)
export const IconoExterno = (p: P) => (
  <Base {...p}><path d="M14 4h6v6" /><path d="M20 4 11 13" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></Base>
)
export const IconoImprimir = (p: P) => (
  <Base {...p}><path d="M7 9V4h10v5" /><rect x="4" y="9" width="16" height="7" rx="2" /><path d="M7 14h10v6H7z" /></Base>
)
export const IconoCandado = (p: P) => (
  <Base {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Base>
)
export const IconoCheck = (p: P) => (
  <Base {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></Base>
)
export const IconoAlerta = (p: P) => (
  <Base {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v4.5M12 16h.01" /></Base>
)
export const IconoCerrar = (p: P) => (
  <Base {...p}><path d="M6 6l12 12M18 6 6 18" /></Base>
)
export const IconoLista = (p: P) => (
  <Base {...p}><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r=".6" fill="currentColor" /><circle cx="4.5" cy="12" r=".6" fill="currentColor" /><circle cx="4.5" cy="18" r=".6" fill="currentColor" /></Base>
)
export const IconoListaNumerada = (p: P) => (
  <Base {...p}><path d="M10 6h10M10 12h10M10 18h10" /><path d="M4 5h1v4M4 9h2" /><path d="M4 15.5a1 1 0 0 1 2 0c0 .8-2 1.5-2 2.5h2" /></Base>
)
export const IconoImagen = (p: P) => (
  <Base {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m21 16-5-5L6 20" /></Base>
)
export const IconoBorrarFormato = (p: P) => (
  <Base {...p}><path d="M5 6h11M10.5 6 8 18M4 20l16-16" /></Base>
)
export const IconoTitulo = (p: P) => (
  <Base {...p}><path d="M5 5v14M14 5v14M5 12h9" /><path d="M18 10.5 20 9v10" /></Base>
)
export const IconoParrafo = (p: P) => (
  <Base {...p}><path d="M5 7h14M5 12h14M5 17h9" /></Base>
)
export const IconoAyuda = (p: P) => (
  <Base {...p}><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.2-2.4 3.7" /><path d="M12 17h.01" /></Base>
)
export const IconoLimpiar = (p: P) => (
  <Base {...p}><path d="m16 4 4 4-9.5 9.5H6.5L4 15z" /><path d="M10 8l6 6" /><path d="M8 20h12" /></Base>
)
