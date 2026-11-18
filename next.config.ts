import type { NextConfig } from "next"

// Exportación estática: la app es 100 % cliente y se puede publicar en
// cualquier hosting estático (GitHub Pages, Cloudflare Pages, Netlify).
// BASE_PATH: subcarpeta donde se publica (en GitHub Pages, "/documento-libre").
// Vacío al publicar en la raíz de un dominio.
const basePath = process.env.BASE_PATH || ""

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  images: { unoptimized: true },
  turbopack: { root: __dirname },
}

export default nextConfig
