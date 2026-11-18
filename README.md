# Documento Libre

Mini web pública para completar el formato de asistencia a capacitaciones
**RE-VOC-TR-02**, sin iniciar sesión y sin depender del Google Drive de nadie:

- **Word (.docx)**: se genera en el navegador rellenando la plantilla original
  (`public/plantilla/reporte.docx`, exportada de Google Docs), así que el resultado
  es idéntico al formato oficial.
- **Google Docs**: copia el documento con formato y abre `docs.new` en la cuenta de
  quien lo usa; solo hay que pegar con Ctrl+V.
- **PDF**: usa el diálogo de impresión del navegador ("Guardar como PDF").

El borrador se guarda automáticamente en el navegador (`localStorage`).

## Registro en Google Sheets

Cada vez que alguien descarga el Word, copia a Google Docs o imprime, se agrega una
fila en la pestaña **Registros Web** de la planilla de voccare-app (no toca "Registros" ni
"Postulantes"): fecha, título, responsable, horas,
asistentes, desarrollo del tema (texto), cantidad de imágenes y un ID por documento
(varias descargas del mismo documento comparten ID).

La app no guarda credenciales: envía los datos a un **Google Apps Script** publicado
como aplicación web, que corre con la cuenta dueña de la planilla.

1. En la planilla de voccare-app → **Extensiones → Apps Script** → **+ → Secuencia de comandos**,
   nombrala `Registro` y pegá `apps-script/Registro.gs`. Convive con `Código.gs`: todo queda
   dentro del objeto `RegistroWeb`; solo define `doPost` y `doGet`. Si `Código.gs` ya tiene
   alguna de esas dos funciones, hay que unirlas en vez de duplicarlas.
2. **Implementar → Nueva implementación → Aplicación web**
   (Ejecutar como: *Yo* · Acceso: *Cualquier usuario*). Autorizá y copiá la URL `/exec`.
3. Creá `.env.local` con `NEXT_PUBLIC_REGISTRO_URL=<URL>` (ver `.env.example`) y
   reiniciá `npm run dev` o volvé a compilar.

Si la variable está vacía, la app funciona igual y no registra nada. Si cambiás el
script, publicá una **nueva versión** de la implementación para que tome efecto.

> La URL del script queda visible en el código de la página, así que cualquiera podría
> enviarle filas. El script valida el formato, recorta textos largos y neutraliza
> fórmulas, pero no es un control de acceso: para eso está pensado el ingreso con código.

## Comandos

```bash
npm run dev      # http://localhost:3000
npm run build    # exportación estática en ./out
```

## Publicar

Es una exportación estática (`output: "export"` en `next.config.ts`): no necesita servidor.
En cualquier plataforma la configuración es la misma:

| Ajuste | Valor |
|---|---|
| Comando de compilación | `npm run build` |
| Carpeta publicada | `out` |
| Node | 20 o superior |
| Variable de entorno | `NEXT_PUBLIC_REGISTRO_URL` = URL `/exec` del Apps Script |

La variable se lee **al compilar**: si se cambia, hay que volver a publicar.

**Plataformas gratuitas recomendadas** (conectando el repositorio de GitHub, cada `git push`
publica solo):

- **Cloudflare Pages**: Workers & Pages → Crear → Pages → Conectar a Git. Preset "Next.js
  (Static HTML Export)". Sin restricción de uso comercial en el plan gratuito.
- **Netlify**: Add new site → Import from Git. Completar comando, carpeta y variable.
- **Vercel**: el plan Hobby es solo para uso **personal / no comercial**; para uso de la
  empresa corresponde el plan Pro.

> El botón de Google Docs usa la API del portapapeles, que exige HTTPS (todas estas
> plataformas lo dan por defecto).

## Estructura

| Archivo | Rol |
|---|---|
| `app/page.tsx` | Barra de acciones, autoguardado y avisos |
| `components/Hoja.tsx` | Réplica editable de la plantilla (medidas tomadas del .docx original) |
| `components/Editor.tsx` | Editor del "Desarrollo del tema" y su barra de formato (pegado saneado, imágenes) |
| `lib/documento.ts` | Modelo del documento, valores por defecto y borrador local |
| `lib/html.ts` | Saneado del HTML pegado y normalización de imágenes a PNG/JPEG |
| `lib/exportar-word.ts` | Rellena la plantilla original .docx (marcadores, filas de asistentes, contenido e imágenes) |
| `lib/exportar-html.ts` | HTML con estilos en línea para Google Docs, e impresión de la hoja |
| `lib/registro.ts` | Envío de cada documento generado al Apps Script de la planilla |
| `apps-script/Registro.gs` | Script que agrega las filas en Google Sheets |
| `public/plantilla/` | Plantilla original, logo y franja del pie |
