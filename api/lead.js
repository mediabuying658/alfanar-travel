/* Vercel serverless function: POST /api/lead
   Receives the lead record sent by forms.js (navigator.sendBeacon, text/plain JSON),
   validates it, and forwards it to the CRM / Google Sheet / webhook configured in environment variables.
   Secrets live ONLY here (server side), never in the frontend.

   Environment variables (Vercel → Project → Settings → Environment Variables):
     LEAD_WEBHOOK_URL     required  e.g. Google Apps Script web-app URL, Make/Zapier hook, or CRM endpoint
     LEAD_WEBHOOK_SECRET  required  shared secret: sent as `token` in the JSON body (for Google Apps Script)
                                    and as X-AF-Signature = HMAC-SHA256(record) for receivers that read headers
     ALLOWED_ORIGINS      required  comma-separated, e.g. https://www.alfanar.example,https://alfanar.example

   NOTE: status "whatsapp_prefilled" means the visitor was shown a prefilled WhatsApp message.
   It does NOT mean a message was sent, nor that the lead is qualified.
*/
import crypto from 'node:crypto';

const SERVICES = new Set(['hotels', 'flights', 'honeymoon', 'umrah']);
const LEAD_ID = /^AF-(H|F|HM|U)-\d{6}-[0-9A-Z]{5}$/;
const MAX_BYTES = 16 * 1024;

function clean(v, depth = 0) {
  if (depth > 4) return undefined;
  if (typeof v === 'string') return v.slice(0, 1200);
  if (typeof v === 'number' || typeof v === 'boolean' || v === null) return v;
  if (Array.isArray(v)) return v.slice(0, 20).map((x) => clean(x, depth + 1));
  if (typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v).slice(0, 60)) if (/^[\w.-]{1,40}$/.test(k)) o[k] = clean(x, depth + 1);
    return o;
  }
  return undefined;
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body);
  if (typeof req.body === 'string') return req.body;
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > MAX_BYTES) throw new Error('too_large'); chunks.push(c); }
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req, res) {
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.origin || '';
  if (origin && allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  if (origin && allowed.length && !allowed.includes(origin)) return res.status(403).json({ ok: false, error: 'origin' });

  let lead;
  try { lead = JSON.parse(await readBody(req)); } catch (e) { return res.status(400).json({ ok: false, error: 'body' }); }
  if (!lead || !LEAD_ID.test(lead.lead_id || '') || !SERVICES.has(lead.service)) return res.status(422).json({ ok: false, error: 'invalid' });

  const record = clean({
    lead_id: lead.lead_id,
    revision: Number(lead.revision) || 1,
    status: 'whatsapp_prefilled',
    service: lead.service,
    created_at_client: lead.created_at,
    received_at_server: new Date().toISOString(),
    page: lead.page,
    lp_variant: lead.lp_variant,
    fields: lead.fields,
    message: lead.message,
    attribution: lead.attribution,           // click_ids present only when the visitor granted ad consent
    consent: lead.consent,
    user_agent: (req.headers['user-agent'] || '').slice(0, 300),
    // Downstream statuses are set later by the sales team / CRM, never by the website:
    // message_received_verified → qualified → quoted → booking_confirmed (+ booking_value_kwd)
  });

  const url = process.env.LEAD_WEBHOOK_URL;
  const secret = process.env.LEAD_WEBHOOK_SECRET;
  if (!url || !secret) { console.error('LEAD_WEBHOOK_URL / LEAD_WEBHOOK_SECRET not configured'); return res.status(503).json({ ok: false, error: 'not_configured' }); }

  const body = JSON.stringify({ token: secret, record });
  const sig = crypto.createHmac('sha256', secret).update(JSON.stringify(record)).digest('hex');
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AF-Signature': sig }, body, signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error('webhook ' + r.status);
  } catch (e) {
    console.error('lead forward failed', record.lead_id, e.message);
    return res.status(502).json({ ok: false });
  }
  return res.status(204).end();
}
