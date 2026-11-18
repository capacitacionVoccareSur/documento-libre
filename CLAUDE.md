@AGENTS.md

# Documento Libre

Web pública y estática (Next.js 16, `output: "export"`) para completar el formato de asistencia
a capacitaciones **RE-VOC-TR-02** de Voccare y exportarlo a Word, Google Docs o PDF, sin login.
Proyecto aparte de `../voccare-app`.

## Comandos

```bash
npm run dev      # servidor de desarrollo
npm run build    # exportación estática en ./out
```

No hay tests automatizados.

## Reglas que no se negocian

- **Fidelidad a la plantilla.** El Word se genera rellenando la plantilla original
  `public/plantilla/reporte.docx` (exportada de Google Docs) en `lib/exportar-word.ts`. No
  regenerar el documento desde cero. La hoja en pantalla (`components/Hoja.tsx` +
  sección "Hoja" de `app/globals.css`) replica sus medidas: twips ÷ 15 = px a 96 dpi.
- **Marcadores de la plantilla:** `{{DIA}} {{MES}} {{AÑO}} {{TITULO}} {{RESPONSABLE}}
  {{DESARROLLO}} {{ASISTENTES}} {{SKILL}}` y la línea "HORA DE INICIO … HORA DE FINALIZACIÓN".
  Cada uno vive en un único `<w:t>`; si se cambia la plantilla, verificarlo.
- **Proxima Nova** solo va dentro del .docx / Google Docs. En pantalla se usa Figtree (licencia).
- **Diseño:** tema único "Marca Voccare" (azul #192441 + degradé del logo), tokens en `:root`.

## Registro en Google Sheets

`lib/registro.ts` envía cada exportación (Word, Google Docs, PDF) a un Apps Script
(`apps-script/Registro.gs`) publicado como aplicación web, que escribe en la pestaña
**"Registros Web"** de la planilla de voccare-app. URL en `NEXT_PUBLIC_REGISTRO_URL`.
voccare-app busca "Registros" y "Postulantes" por nombre exacto: no reutilizar esos nombres.
Si se cambia `Registro.gs`, hay que publicar una **nueva versión** de la implementación.
