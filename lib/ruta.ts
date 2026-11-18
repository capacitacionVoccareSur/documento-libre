// Antepone el basePath a los archivos de /public (plantilla, logo), necesario cuando
// la app se publica en una subcarpeta, como en GitHub Pages.
export const ruta = (p: string) => (process.env.NEXT_PUBLIC_BASE_PATH || "") + p
