import type { Metadata } from "next"
import { Figtree } from "next/font/google"
import "./globals.css"

// Figtree: fuente de la interfaz y sustituto en pantalla de Proxima Nova
// (el Word y Google Docs usan Proxima Nova real).
const figtree = Figtree({ variable: "--f-figtree", subsets: ["latin"], weight: ["400", "500", "600", "700"] })

export const metadata: Metadata = {
  title: "Documento Libre",
  description: "Completá el formato de asistencia a capacitaciones y descargalo en Word, PDF o abrilo en Google Docs. Sin cuentas ni permisos.",
  // Herramienta interna: que no aparezca en buscadores
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${figtree.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  )
}
