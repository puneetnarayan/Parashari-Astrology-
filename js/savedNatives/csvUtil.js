// RFC4180-compliant CSV parse/serialize for the Saved Natives feature.
// Deliberately NOT a naive split-on-comma parser: handles quoted fields,
// embedded commas/quotes/newlines (doubled-quote escaping), and both
// \r\n and \n line endings, so Notes fields with commas/newlines and
// files written by the sibling KP app round-trip correctly.

const SAVED_NATIVES_REQUIRED_HEADERS = [
  'Name', 'Sex', 'Location', 'City', 'State', 'Country',
  'BirthDate', 'BirthTime', 'Latitude', 'Longitude',
  'TimezoneMode', 'UTCOffset', 'Notes'
];

// Parses full CSV text into { headers: [...], rows: [{header: value}] }.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  function pushField() { row.push(field); field = ''; }
  function pushRow() { pushField(); rows.push(row); row = []; }

  while (i < len) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { pushField(); i++; continue; }
    if (c === '\r') { i++; continue; } // normalize CRLF -> LF, skip bare CR
    if (c === '\n') { pushRow(); i++; continue; }
    field += c; i++;
  }
  // Final field/row if the text doesn't end with a newline.
  if (field.length || row.length) pushRow();

  // Drop trailing fully-empty rows (common with a trailing newline in the file).
  while (rows.length && rows[rows.length - 1].every(v => v === '')) rows.pop();

  if (!rows.length) return { headers: SAVED_NATIVES_REQUIRED_HEADERS.slice(), rows: [] };

  const fileHeaders = rows[0];
  // Normalize header set: the 13 required columns first, in their fixed
  // order, then any extra/unrecognized columns the file already has,
  // preserved in their original relative order — never reordered/renamed,
  // never dropped.
  const extraHeaders = fileHeaders.filter(h => !SAVED_NATIVES_REQUIRED_HEADERS.includes(h));
  const headers = SAVED_NATIVES_REQUIRED_HEADERS.concat(extraHeaders);

  const dataRows = rows.slice(1).map(cols => {
    const obj = {};
    fileHeaders.forEach((h, idx) => { obj[h] = cols[idx] !== undefined ? cols[idx] : ''; });
    // Ensure every required header exists on every record, defaulting to ''.
    headers.forEach(h => { if (!(h in obj)) obj[h] = ''; });
    obj.BirthDate = normalizeBirthDateToIso(obj.BirthDate);
    return obj;
  });

  return { headers, rows: dataRows };
}

// Accepts ISO yyyy-mm-dd (returned as-is), dd-mm-yyyy, or dd/mm/yyyy
// (converted to ISO). Anything else is returned unchanged rather than
// silently mangled.
function normalizeBirthDateToIso(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  let m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return s;
}

function csvEscapeField(value) {
  const s = value === undefined || value === null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function serializeCsv(headers, rows) {
  const lines = [headers.map(csvEscapeField).join(',')];
  rows.forEach(row => {
    lines.push(headers.map(h => csvEscapeField(row[h])).join(','));
  });
  return lines.join('\r\n') + '\r\n';
}

if (typeof module !== 'undefined') {
  module.exports = { SAVED_NATIVES_REQUIRED_HEADERS, parseCsv, serializeCsv, normalizeBirthDateToIso, csvEscapeField };
}
