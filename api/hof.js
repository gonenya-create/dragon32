// היכל התהילה העולמי: עשרת השיאים בכל מחסנית, של כל השחקנים.
// נשמר במאגר Neon (Postgres, חבילה חינמית) דרך DATABASE_URL שב-Vercel env. בלי המשתנה: 503, והדף מציג רק את הטבלה של הבית.
// נשמרים רק: משחק, 3 אותיות, ניקוד ותאריך. בלי כתובת IP ובלי שום פרט אישי.
import { neon } from '@neondatabase/serverless';

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

const ALLOWED_ORIGINS = [process.env.VERCEL_PROJECT_PRODUCTION_URL, 'dragon1982.com', 'www.dragon1982.com', 'dragon32.vercel.app'].filter(Boolean).map(h => 'https://' + h);
// התקרה לכל משחק: ניקוד מעל זה לא אמיתי (נדיב מאוד ביחס למה שאפשר להשיג)
const GAMES = { tower: 200000, jungle: 200000, eggs: 50000, castle: 200000 };
const SIZE = 10;
// צירופים גסים לא נכנסים לטבלה; במקומם "???"
const RUDE = new Set(['ASS', 'CUM', 'DIK', 'DIC', 'FAG', 'FCK', 'FUC', 'FUK', 'FKU', 'KKK', 'NIG', 'NGR', 'SEX', 'TIT', 'XXX', 'NAZ', 'SS', 'PUS', 'COK', 'WTF', 'CNT', 'KYS']);
const hits = new Map();   // כתובת IP → זמני השליחות בשעה האחרונה (בזיכרון בלבד, לא נשמר)
const PER_HOUR = 12;

let ready = null;
const prepare = () => (ready ||= (async () => {
  await sql`create table if not exists hof (id serial primary key, game text not null, name text not null, score integer not null, created timestamptz not null default now())`;
  await sql`create index if not exists hof_game_score on hof (game, score desc, created)`;
})().catch(e => { ready = null; throw e; }));

async function tables(only) {
  const rows = await sql`select game, name, score from (
      select game, name, score, row_number() over (partition by game order by score desc, created asc) as r from hof
    ) t where r <= ${SIZE} order by game, r`;
  const out = {};
  for (const g of Object.keys(GAMES)) if (!only || only === g) out[g] = [];
  for (const r of rows) if (out[r.game]) out[r.game].push({ n: r.name, s: r.score });
  return out;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!sql) { res.status(503).json({ error: 'off' }); return; }
  try {
    await prepare();
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'public, max-age=20, s-maxage=20');
      res.status(200).json({ tables: await tables() });
      return;
    }
    if (req.method !== 'POST') { res.status(405).json({ error: 'method' }); return; }
    const origin = req.headers.origin || '';
    const preview = /^https:\/\/dragon32-[a-z0-9-]+\.vercel\.app$/.test(origin);
    if (!ALLOWED_ORIGINS.includes(origin) && !preview) { res.status(403).json({ error: 'origin' }); return; }

    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const now = Date.now(), recent = (hits.get(ip) || []).filter(t => now - t < 3600e3);
    if (recent.length >= PER_HOUR) { res.status(429).json({ error: 'busy' }); return; }
    recent.push(now); hits.set(ip, recent);

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const game = String(body.game || '').toLowerCase();
    const score = Number(body.score);
    let name = String(body.name || '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 3).trimEnd();
    if (!(game in GAMES)) { res.status(400).json({ error: 'game' }); return; }
    if (!Number.isInteger(score) || score <= 0 || score > GAMES[game]) { res.status(400).json({ error: 'score' }); return; }
    if (!name || RUDE.has(name) || RUDE.has(name.trim())) name = '???';

    await sql`insert into hof (game, name, score) values (${game}, ${name}, ${score})`;
    const [{ above }] = await sql`select count(*)::int as above from hof where game = ${game} and score > ${score}`;
    res.status(200).json({ rank: above + 1, tables: await tables(game) });
  } catch (e) {
    console.error('hof', e && e.message);
    res.status(500).json({ error: 'fail' });
  }
}
