// בודקים מהקהילה (גונן, 10.11): "בדקתם? ספרו לנו אם עבד", מכל דף משחק. נשמר במאגר Neon (כמו hof.js) דרך DATABASE_URL שב-Vercel env.
// POST (ציבורי, רק מכתובות האתר): דיווח אחד. GET ?credits=1 (ציבורי): שמות הבודקים שאושרו, לכל משחק.
// GET ו-PATCH פרטיים: רק עם הכותרת x-reports-key ששווה ל-REPORTS_KEY שב-Vercel env. בלי המשתנה: 503.
// לא נשמרת כתובת IP. הגבלת הקצב בזיכרון בלבד. לא כותבים ליומן שום פרט אישי.
import { neon } from '@neondatabase/serverless';
import { timingSafeEqual } from 'node:crypto';
import { SLUGS } from './_games.js';

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
const ALLOWED_ORIGINS = [process.env.VERCEL_PROJECT_PRODUCTION_URL, 'dragon1982.com', 'www.dragon1982.com', 'dragon32.vercel.app'].filter(Boolean).map(h => 'https://' + h);
const RESULTS = ['ok', 'partly', 'no'];
const PER_HOUR = 10;          // דיווחים לשעה מכל כתובת
const BAD_KEYS_PER_HOUR = 20; // ניסיונות מפתח שגוי לשעה מכל כתובת
const hits = new Map(), badKeys = new Map();   // כתובת IP → זמנים בשעה האחרונה (בזיכרון בלבד, לא נשמר)

let ready = null;
const prepare = () => (ready ||= (async () => {
  await sql`create table if not exists reports (
    id serial primary key, game text not null, device text not null default '',
    result text not null check (result in ('ok','partly','no')), note text not null default '',
    name text not null default '', show_name boolean not null default false, contact text not null default '',
    created timestamptz not null default now(), approved boolean not null default false)`;
  await sql`create index if not exists reports_created on reports (created desc)`;
})().catch(e => { ready = null; throw e; }));

// טקסט נקי: בלי תווי בקרה (חוץ משורה חדשה בהערה), רווחים מקוצרים, ואורך מקסימלי
const clean = (v, max, lines = false) => String(v ?? '')
  .replace(lines ? /[\u0000-\u0009\u000B-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩]/g : /[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩]/g, lines ? '' : ' ')
  .replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);

const ipOf = req => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
function limited(map, ip, max) {
  const now = Date.now(), recent = (map.get(ip) || []).filter(t => now - t < 3600e3);
  if (map.size > 5000) map.clear();
  if (recent.length >= max) { map.set(ip, recent); return true; }
  recent.push(now); map.set(ip, recent);
  return false;
}
function keyOk(req) {
  const want = process.env.REPORTS_KEY || '', got = String(req.headers['x-reports-key'] || '');
  const a = Buffer.from(want), b = Buffer.from(got);
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}
const bodyOf = req => typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

async function credits() {
  const rows = await sql`select game, name from reports where approved and show_name and name <> '' order by created desc, id desc`;
  const out = {};
  for (const r of rows) { const l = (out[r.game] ||= []); if (!l.includes(r.name)) l.push(r.name); }
  return out;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const isPrivate = req.headers['x-reports-key'] !== undefined || req.method === 'PATCH';
  if (isPrivate && !process.env.REPORTS_KEY) { res.status(503).json({ error: 'off' }); return; }
  if (!sql) { res.status(503).json({ error: 'off' }); return; }
  try {
    // הצד הפרטי (דף הקריאה של גונן): מפתח נכון, אחרת 401. ניסיונות שגויים מוגבלים
    if (isPrivate) {
      const ip = ipOf(req);
      const now = Date.now();
      if ((badKeys.get(ip) || []).filter(t => now - t < 3600e3).length >= BAD_KEYS_PER_HOUR) { res.status(429).json({ error: 'busy' }); return; }
      if (!keyOk(req)) { limited(badKeys, ip, BAD_KEYS_PER_HOUR); res.status(401).json({ error: 'key' }); return; }
      await prepare();
      if (req.method === 'GET') {
        const rows = await sql`select id, game, device, result, note, name, show_name, contact, created, approved from reports order by created desc, id desc limit 2000`;
        res.status(200).json({ reports: rows });
        return;
      }
      if (req.method === 'PATCH') {
        const body = bodyOf(req), id = Number(body.id);
        if (!Number.isInteger(id) || id <= 0 || typeof body.approved !== 'boolean') { res.status(400).json({ error: 'bad' }); return; }
        const rows = await sql`update reports set approved = ${body.approved} where id = ${id} returning id, approved`;
        if (!rows.length) { res.status(404).json({ error: 'none' }); return; }
        res.status(200).json(rows[0]);
        return;
      }
      res.status(405).json({ error: 'method' });
      return;
    }

    if (req.method === 'GET') {
      if (!req.query || !req.query.credits) { res.status(400).json({ error: 'bad' }); return; }
      await prepare();
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
      res.status(200).json(await credits());
      return;
    }
    if (req.method !== 'POST') { res.status(405).json({ error: 'method' }); return; }
    const origin = req.headers.origin || '';
    const preview = /^https:\/\/dragon32-[a-z0-9-]+\.vercel\.app$/.test(origin);
    if (!ALLOWED_ORIGINS.includes(origin) && !preview) { res.status(403).json({ error: 'origin' }); return; }
    if (limited(hits, ipOf(req), PER_HOUR)) { res.status(429).json({ error: 'busy' }); return; }

    let body;
    try { body = bodyOf(req); } catch { res.status(400).json({ error: 'bad' }); return; }
    const game = String(body.game || '');
    const result = String(body.result || '');
    if (!SLUGS.has(game)) { res.status(400).json({ error: 'game' }); return; }
    if (!RESULTS.includes(result)) { res.status(400).json({ error: 'result' }); return; }
    const device = clean(body.device, 80), note = clean(body.note, 1000, true), name = clean(body.name, 40), contact = clean(body.contact, 80);
    const show = body.show_name === true && name !== '';

    await prepare();
    await sql`insert into reports (game, device, result, note, name, show_name, contact) values (${game}, ${device}, ${result}, ${note}, ${name}, ${show}, ${contact})`;
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('report', e && e.message);   // רק הודעת השגיאה של המאגר, בלי תוכן הדיווח
    res.status(500).json({ error: 'fail' });
  }
}
