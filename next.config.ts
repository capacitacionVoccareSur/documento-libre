import type { NextConfig } from "next"

// Exportación estática: la app es 100 % cliente y se puede publicar en
// cualquier hosting gratuito (Vercel, Netlify, GitHub Pages, Cloudflare Pages).
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  turbopack: { root: __dirname },
}

export default nextConfig
