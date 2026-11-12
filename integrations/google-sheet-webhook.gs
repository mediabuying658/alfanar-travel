/**
 * Al Fanar — lead inbox in Google Sheets (free, no CRM needed)
 *
 * Setup (5 minutes):
 * 1. Create a Google Sheet, e.g. "Al Fanar Leads".
 * 2. Extensions → Apps Script → paste this file → Save.
 * 3. Project Settings → Script properties → add  LEAD_TOKEN = <the same value as Vercel's LEAD_WEBHOOK_SECRET>.
 * 4. Deploy → New deployment → type "Web app" → Execute as: Me · Who has access: Anyone → Deploy.
 * 5. Copy the Web app URL into Vercel as LEAD_WEBHOOK_URL.
 *
 * Every form submission adds one row. The team fills the last columns
 * (received / qualified / booked / value) — these drive the Google Ads offline conversion imports.
 */
const HEADERS = ['created_at', 'lead_id', 'revision', 'service', 'status', 'name', 'destination / route', 'dates', 'travellers', 'budget',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'gclid', 'gbraid', 'wbraid', 'landing_page', 'message',
  'received_on_whatsapp (yes/no)', 'qualified (yes/no)', 'booking_confirmed (yes/no)', 'booking_value_kwd', 'agent_notes'];

function doPost(e) {
  const out = (o) => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
  let data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return out({ ok: false, error: 'json' }); }
  const token = PropertiesService.getScriptProperties().getProperty('LEAD_TOKEN');
  if (!token || data.token !== token) return out({ ok: false, error: 'auth' });

  const r = data.record || {};
  const f = r.fields || {};
  const a = r.attribution || {};
  const t = a.last_touch || {};
  const c = a.click_ids || {};
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    // a revised request (same lead_id) updates its row instead of adding a duplicate
    const ids = sheet.getLastRow() > 1 ? sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues().map((x) => x[0]) : [];
    const row = [
      r.received_at_server || new Date().toISOString(), r.lead_id, r.revision, r.service, r.status, f.name || '',
      f.destination || f.multiRoute || [f.origin, f.destination].filter(Boolean).join(' → '),
      [f.checkin || f.depart, f.checkout || f.return].filter(Boolean).join(' → '),
      [f.adults && f.adults + ' بالغ', f.children > 0 && f.children + ' طفل', f.infants > 0 && f.infants + ' رضيع', f.rooms && f.rooms + ' غرفة'].filter(Boolean).join('، '),
      f.budget_flexible ? 'مرنة' : (f.budget ? f.budget + ' ' + (f.budget_currency || 'KWD') : ''),
      t.utm_source || '', t.utm_medium || '', t.utm_campaign || '', t.utm_term || '', c.gclid || '', c.gbraid || '', c.wbraid || '',
      t.landing_page || r.page || '', r.message || ''
    ];
    const i = ids.indexOf(r.lead_id);
    if (i >= 0) sheet.getRange(i + 2, 1, 1, row.length).setValues([row]);
    else sheet.appendRow(row);
  } finally { lock.releaseLock(); }
  return out({ ok: true });
}
