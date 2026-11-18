/**
 * Registro.gs — registro de "Documento libre" en Google Sheets.
 *
 * Escribe en la planilla de voccare-app, en su propia pestaña "Registros Web",
 * que se crea sola al final. No toca "Registros" ni "Postulantes".
 *
 * Pensado para convivir con otros archivos del mismo proyecto (por ejemplo Código.gs):
 * todo vive dentro del objeto RegistroWeb. Los únicos nombres globales son doPost y
 * doGet, que Apps Script exige para las aplicaciones web. Si Código.gs ya define
 * doPost o doGet, NO pegues este archivo tal cual: hay que unirlos (ver README).
 *
 * Instalación (una sola vez):
 *  1. En la planilla → Extensiones → Apps Script → "+" → Secuencia de comandos → "Registro".
 *  2. Pegá este contenido completo en Registro.gs y guardá.
 *  3. Implementar → Nueva implementación → tipo "Aplicación web".
 *       Ejecutar como: Yo        Quién tiene acceso: Cualquier usuario
 *  4. Autorizá los permisos y copiá la URL que termina en /exec.
 *  5. En la app: NEXT_PUBLIC_REGISTRO_URL=<esa URL> (archivo .env.local) y volvé a compilar.
 */

var RegistroWeb = (function () {
  var ID_PLANILLA = '1VLvz9zxd3N_3fEXMlskI_hlCfamPBp4ZsMHxQaXjwGY'; // planilla de voccare-app
  var HOJA = 'Registros Web';
  var SALIDAS = ['Word', 'Google Docs', 'PDF'];
  var MAX_CELDA = 45000;
  // La planilla está en otra zona horaria: la hora se escribe ya convertida a Argentina
  var ZONA = 'America/Argentina/Buenos_Aires';

  var COLUMNAS = [
    ['Registrado (hora AR)', function (d, ahora) { return Utilities.formatDate(ahora, ZONA, 'dd/MM/yyyy HH:mm:ss'); }],
    ['Salida', function (d) { return d.salida; }],
    ['Fecha del documento', function (d) { return d.fecha; }],
    ['Título', function (d) { return d.titulo; }],
    ['Responsable', function (d) { return d.responsable; }],
    ['Hora de inicio', function (d) { return d.horaInicio; }],
    ['Hora de finalización', function (d) { return d.horaFin; }],
    ['Cant. asistentes', function (d) { return d.cantidadAsistentes; }],
    ['Asistentes', function (d) { return d.asistentes; }],
    ['Desarrollo del tema', function (d) { return d.desarrollo; }],
    ['Imágenes', function (d) { return d.imagenes; }],
    ['ID documento', function (d) { return d.idDocumento; }],
    ['Hora del navegador', function (d) { return d.generadoEn; }],
  ];

  function hoja() {
    var libro = SpreadsheetApp.openById(ID_PLANILLA);
    var h = libro.getSheetByName(HOJA);
    if (!h) h = libro.insertSheet(HOJA, libro.getNumSheets()); // al final, sin mover las demás
    if (h.getLastRow() === 0) {
      h.appendRow(COLUMNAS.map(function (c) { return c[0]; }));
      h.setFrozenRows(1);
      h.getRange(1, 1, 1, COLUMNAS.length).setFontWeight('bold').setBackground('#192441').setFontColor('#ffffff');
      h.setColumnWidth(10, 420); // Desarrollo del tema
      h.setColumnWidth(9, 280); // Asistentes
    }
    return h;
  }

  /** Recorta textos largos y neutraliza fórmulas (=, +, -, @) escritas por el usuario. */
  function limpiar(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number' || v instanceof Date) return v;
    var s = String(v).slice(0, MAX_CELDA);
    return /^[=+\-@]/.test(s) ? "'" + s : s;
  }

  function json(obj) {
    return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
  }

  function registrar(e) {
    try {
      var d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
      if (SALIDAS.indexOf(d.salida) === -1 || !d.idDocumento) return json({ ok: false, error: 'datos inválidos' });
      var lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try {
        var ahora = new Date();
        hoja().appendRow(COLUMNAS.map(function (c) { return limpiar(c[1](d, ahora)); }));
      } finally {
        lock.releaseLock();
      }
      return json({ ok: true });
    } catch (err) {
      return json({ ok: false, error: String(err) });
    }
  }

  function estado() {
    return json({ ok: true, servicio: 'registro documento libre' });
  }

  return { registrar: registrar, estado: estado };
})();

function doPost(e) {
  return RegistroWeb.registrar(e);
}

/** Para comprobar desde el navegador que la implementación responde. */
function doGet() {
  return RegistroWeb.estado();
}
