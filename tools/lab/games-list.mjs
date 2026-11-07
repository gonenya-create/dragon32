// רשימת כל המשחקים במדף (גונן, 7.11): /lab/1982/games/ ו-/en/lab/1982/games/.
// נבנית מ-games.js ומ-shelf.js, כך שמשחק חדש במדף נכנס לרשימה לבד.
// שלושה חלקים: משחקים מהתקופה (לפי סדר המגירות), משחקים חדשים מהקהילה, ומה שכתבנו בעצמנו.
// הרצה: node tools/lab/games-list.mjs          (בונה מחדש)
//        node tools/lab/games-list.mjs --check  (בודק שהדפים מעודכנים; חלק מ-npm test)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const check = process.argv.includes('--check');
const gamesSrc = await readFile(join(root, 'lab/1982/games.js'), 'utf8');
const G = JSON.parse(gamesSrc.slice(gamesSrc.indexOf('{'), gamesSrc.lastIndexOf('}') + 1));
// TAPES ב-shelf.js: ['id', 'שם', 'Name', kind, [credit, ...]]. הקרדיט: "מחבר · חברה, שנה".
const shelf = await readFile(join(root, 'lab/1982/shelf.js'), 'utf8');
const T = {}, order = [];
const unq = s => s.replace(/\\'/g, "'");
for (const m of shelf.matchAll(/\['([a-z0-9]+)', '((?:[^'\\]|\\.)*)', '((?:[^'\\]|\\.)*)'(?:,\s*(?:'[a-z]'|null))?,?\s*(?:\[\s*'((?:[^'\\]|\\.)*)')?/g)) {
  if (T[m[1]] || !G.games[m[1]]) continue;
  T[m[1]] = { he: unq(m[2]), en: unq(m[3]), credit: m[4] ? unq(m[4]) : '' };
  order.push(m[1]);
}
for (const id of Object.keys(G.games)) if (!T[id]) throw new Error('No shelf entry for ' + id);
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const L = s => `<span dir="ltr">${esc(s)}</span>`;
// שם מחבר: מה שלפני " · ", בלי ", שנה" בסוף (במשחקי הקהילה)
const author = id => T[id].credit.split(' · ')[0].replace(/, \d{4}$/, '');
const drawers = G.drawers.filter(d => d.key !== 'type');
const yearKey = y => parseInt(y, 10) || 9999;
const rowsOf = key => order.filter(id => G.games[id].drawer === key)
  .map((id, i) => [id, i]).sort((a, b) => (yearKey(G.games[a[0]].year) - yearKey(G.games[b[0]].year)) || (a[1] - b[1])).map(x => x[0]);
const firstSentence = s => (s.match(/^.*?[.!?](?=\s|$)/) || [s])[0];

let bad = 0;
for (const en of [false, true]) {
  const lang = en ? 'en' : 'he', base = en ? '/en/lab/1982/' : '/lab/1982/';
  const t = (h, e) => en ? e : h;
  const name = id => en ? T[id].en : T[id].he;
  const isLatin = s => /^[\x20-\x7e]*$/.test(s);
  const nm = id => isLatin(name(id)) ? L(name(id)) : esc(name(id));
  const link = id => `<a href="${base}${G.games[id].slug}/">${nm(id)}</a>`;
  const dname = d => en ? d.en : esc(d.he).replace(/([A-Za-z][A-Za-z0-9 .'-]*[A-Za-z0-9])/g, '<span dir="ltr">$1</span>');
  const period = drawers.filter(d => d.key !== 'community' && d.key !== 'ours');
  const periodCount = period.reduce((n, d) => n + rowsOf(d.key).length, 0);
  let n = 0;
  const periodRows = period.map(d => {
    const ids = rowsOf(d.key); if (!ids.length) return '';
    return `<tr class="grp"><th colspan="5" scope="rowgroup">${dname(d)} <span class="cnt">${t(ids.length + ' משחקים', ids.length + (ids.length === 1 ? ' game' : ' games'))}</span></th></tr>\n` +
      ids.map(id => { const g = G.games[id]; return `<tr><td class="num">${++n}</td><td class="name">${link(id)}</td><td>${L(author(id))}</td><td class="topic">${en ? esc(g.tag[1]) : esc(g.tag[0])}</td><td class="yr">${L(g.year)}</td></tr>`; }).join('\n');
  }).join('\n');
  const comm = rowsOf('community');
  const commRows = comm.map((id, i) => { const g = G.games[id]; return `<tr><td class="num">${i + 1}</td><td class="name">${link(id)}</td><td>${L(author(id))}</td><td class="topic">${en ? esc(g.tag[1]) : esc(g.tag[0])}</td><td class="yr">${L(g.year)}</td></tr>`; }).join('\n');
  const ours = rowsOf('ours');
  const oursRows = ours.map((id, i) => { const g = G.games[id]; return `<tr><td class="num">${i + 1}</td><td class="name">${link(id)}</td><td class="lng">${g.group === 'basic' ? L('BASIC') : t('שפת מכונה', 'Machine code')}</td><td>${esc(firstSentence((en ? g.about.en : g.about.he)[0]))}</td></tr>`; }).join('\n');
  const U = 'https://dragon1982.com', heU = `${U}/lab/1982/games/`, enU = `${U}/en/lab/1982/games/`;
  const title = t('כל המשחקים במדף — Dragon 1982', 'Every game on the shelf — Dragon 1982');
  const desc = t(`${periodCount} משחקים מקוריים מימי ה-Dragon 32, שרצים במכונה באישור היוצרים: שם, מחבר, נושא, שנה ומדף.`,
    `${periodCount} original games from the Dragon 32 days that run on the machine with their authors' permission: name, author, subject, year and shelf.`);
  const html = `<!doctype html>
<!-- נוצר ב-tools/lab/games-list.mjs מ-games.js ו-shelf.js. לא לערוך ביד. -->
<html lang="${lang}" dir="${en ? 'ltr' : 'rtl'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${en ? enU : heU}">
<link rel="canonical" href="${en ? enU : heU}">
<link rel="alternate" hreflang="he" href="${heU}">
<link rel="alternate" hreflang="en" href="${enU}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Hebrew:wght@400;700&amp;family=Press+Start+2P&amp;display=swap">
<style>
:root { --ink:#1d1b26; --bg:#fbfaf6; --card:#fff; --band:#f6f3ec; --line:#e2ddd0; --muted:#7d7869; --grp:#efeaf8; --grp-ink:#4a3d70; --head:#1d1b26; --head-ink:#fff; --link:#2a5db0; --red:#c8102e; --green:#2f8f4e; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --ink:#ece9f2; --bg:#14121b; --card:#1c1a25; --band:#211f2b; --line:#2f2c3b; --muted:#9a95aa; --grp:#2a2440; --grp-ink:#cfc3f2; --head:#000; --head-ink:#fff; --link:#8fb4ff; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font-family: "IBM Plex Sans Hebrew", Arial, sans-serif; font-size: 15px; line-height: 1.45; }
.wrap { max-width: 980px; margin: 0 auto; padding: 0 16px 48px; }
header.hero { background: linear-gradient(160deg,#16141f 0%,#2a2238 100%); color: #fff; padding: 28px 16px 24px; text-align: center; position: relative; }
header.hero::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 6px; background: repeating-linear-gradient(90deg,var(--red) 0 25%,#ffd166 25% 50%,var(--green) 50% 75%,#3a7bd5 75% 100%); }
.pix { font-family: "Press Start 2P", monospace; color: #7CFC8A; font-size: clamp(16px, 4vw, 26px); text-shadow: 0 0 12px rgba(124,252,138,.45); }
h1 { font-size: clamp(24px, 5vw, 34px); margin: 14px 0 6px; }
.sub { opacity: .85; margin: 0; }
.stats { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 18px; }
.stat { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.18); border-radius: 12px; padding: 10px 16px; min-width: 120px; }
.stat b { display: block; font-size: 26px; color: #ffd166; }
nav.top { display: flex; gap: 14px; justify-content: space-between; flex-wrap: wrap; padding: 14px 0; font-size: 14px; }
nav.top a { color: var(--link); }
button.print { font: inherit; font-size: 14px; background: var(--card); color: var(--ink); border: 1px solid var(--line); border-radius: 8px; padding: 4px 12px; cursor: pointer; }
h2 { font-size: 22px; margin: 28px 0 4px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
h2 .tag { font-size: 12px; color: #fff; background: var(--red); border-radius: 99px; padding: 2px 10px; }
h2 .tag.g { background: var(--green); }
.lead { color: var(--muted); margin: 0 0 12px; }
.tbl { overflow-x: auto; border-radius: 10px; border: 1px solid var(--line); background: var(--card); }
table { width: 100%; border-collapse: collapse; }
thead th { background: var(--head); color: var(--head-ink); text-align: start; padding: 9px 10px; font-size: 14px; position: sticky; top: 0; }
td { padding: 7px 10px; border-top: 1px solid var(--line); vertical-align: top; }
tbody tr:nth-child(even):not(.grp) td { background: var(--band); }
tr.grp th { background: var(--grp); color: var(--grp-ink); text-align: start; font-size: 16px; padding: 10px; border-top: 2px solid #5b4a8a; }
tr.grp .cnt { font-weight: 400; font-size: 13px; opacity: .8; margin-inline-start: 8px; }
td.num { color: var(--muted); width: 2.5em; text-align: center; font-variant-numeric: tabular-nums; }
td.name { font-weight: 700; }
td.name a { color: inherit; text-decoration: none; border-bottom: 1px dotted var(--muted); }
td.name a:hover { color: var(--link); }
td.topic, td.yr, td.lng { white-space: nowrap; }
td.yr { font-variant-numeric: tabular-nums; }
@media (max-width: 640px) { td, thead th { padding: 6px 6px; font-size: 13.5px; } td.topic { white-space: normal; } }
@media print {
  @page { size: A4; margin: 12mm; }
  body { background: #fff; color: #000; font-size: 10.5pt; }
  nav.top { display: none; }
  header.hero { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  thead th, tr.grp th, tbody tr:nth-child(even) td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
  .tbl { overflow: visible; border: 0; }
  td.name a { border: 0; }
}
</style>
</head>
<body>
<header class="hero">
<div class="pix">DRAGON 32</div>
<h1>${t('כל המשחקים במדף', 'Every game on the shelf')}</h1>
<p class="sub">${t(`המשחקים שרצים ב<a href="/lab/1982/" style="color:#ffd166">מכונת ה-<span dir="ltr">Dragon</span></a>, כל אחד באישור היוצרים`, `The games that run on <a href="/en/lab/1982/" style="color:#ffd166">the Dragon machine</a>, each with its authors' permission`)}</p>
<div class="stats">
<div class="stat"><b>${periodCount}</b>${t('משחקים מהתקופה', 'games from the time')}</div>
<div class="stat"><b>${comm.length}</b>${t('משחקים מהקהילה', 'community games')}</div>
<div class="stat"><b>${ours.length}</b>${t('משחקים שכתבנו', 'games we wrote')}</div>
</div>
</header>
<div class="wrap">
<nav class="top"><a href="${base}">${t('← חזרה למכונה', '← Back to the machine')}</a><span><button class="print" type="button" onclick="print()">${t('🖨 הדפסה או שמירה כ-PDF', '🖨 Print or save as PDF')}</button> &nbsp; <a href="${en ? '/lab/1982/games/' : '/en/lab/1982/games/'}" hreflang="${en ? 'he' : 'en'}">${en ? 'עברית' : 'English'}</a></span></nav>

<h2>${t(`${periodCount} משחקים מהתקופה`, `${periodCount} games from the time`)} <span class="tag">${t('במדף', 'on the shelf')}</span></h2>
<p class="lead">${t('מסודרים לפי המגירות במדף של המכונה. לוחצים על שם של משחק כדי לפתוח אותו.', 'In the order of the drawers on the machine\'s shelf. Click a game\'s name to open it.')}</p>
<div class="tbl"><table>
<thead><tr><th>#</th><th>${t('שם', 'Name')}</th><th>${t('מחבר', 'Author')}</th><th>${t('נושא', 'Subject')}</th><th>${t('שנה', 'Year')}</th></tr></thead>
<tbody>
${periodRows}
</tbody></table></div>

<h2>${t(`${comm.length} משחקים חדשים מהקהילה`, `${comm.length} new games from the community`)} <span class="tag">${t('במדף', 'on the shelf')}</span></h2>
<p class="lead">${t('נכתבו בשנים האחרונות על ידי חובבי <span dir="ltr">Dragon</span>.', 'Written in recent years by Dragon fans.')}</p>
<div class="tbl"><table>
<thead><tr><th>#</th><th>${t('שם', 'Name')}</th><th>${t('מחבר', 'Author')}</th><th>${t('נושא', 'Subject')}</th><th>${t('שנה', 'Year')}</th></tr></thead>
<tbody>
${commRows}
</tbody></table></div>

<h2>${t(`${ours.length} המשחקים שכתבנו`, `${ours.length} games we wrote`)} <span class="tag g">${t('מתוצרת <span dir="ltr">Dragon 1982</span>', 'Made by Dragon 1982')}</span></h2>
<p class="lead">${t('כתבנו אותם ב-2026, בשביל המכונה הזאת.', 'We wrote them in 2026, for this machine.')}</p>
<div class="tbl"><table>
<thead><tr><th>#</th><th>${t('שם', 'Name')}</th><th>${t('שפה', 'Language')}</th><th>${t('על מה', 'What it is')}</th></tr></thead>
<tbody>
${oursRows}
</tbody></table></div>
</div>
</body>
</html>
`;
  const out = join(root, base.slice(1), 'games', 'index.html');
  if (check) { let old = ''; try { old = await readFile(out, 'utf8'); } catch {} if (old !== html) { bad++; console.log('out of date: ' + base + 'games/'); } }
  else { await mkdir(join(root, base.slice(1), 'games'), { recursive: true }); await writeFile(out, html); }
}
if (check && bad) { console.log('the games list is out of date: run node tools/lab/games-list.mjs'); process.exit(1); }
console.log(check ? 'the games list is up to date' : 'built the games list (he + en)');
