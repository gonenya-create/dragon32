// דף לכל משחק בארון הקלטות (גונן, 27.10: "לכל משחק כתובת משלו"): /lab/1982/<slug>/ ו-/en/lab/1982/<slug>/.
// כל דף הוא אותה מכונה בדיוק (העתק של lab/1982/index.html), עם כותרת ותיאור של המשחק, ו-data-game שפותח את דף המשחק ליד המכונה.
// הרצה: node tools/lab/games-pages.mjs          (בונה מחדש, אחרי כל שינוי בדף המכונה או בקטלוג)
//        node tools/lab/games-pages.mjs --check  (בודק שהדפים מעודכנים; חלק מ-npm test)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const check = process.argv.includes('--check');
const gamesSrc = await readFile(join(root, 'lab/1982/games.js'), 'utf8');
const G = JSON.parse(gamesSrc.slice(gamesSrc.indexOf('{'), gamesSrc.lastIndexOf('}') + 1));
// השמות כמו על המדף (shelf.js, TAPES): ['id', 'שם', 'Name'
const shelf = await readFile(join(root, 'lab/1982/shelf.js'), 'utf8');
const names = {};
// רק ההתאמה הראשונה (TAPES בא ראשון): גם רשימות אחרות בקובץ נראות כך, למשל JOY = new Set(['ranger', 'devil', ...])
for (const m of shelf.matchAll(/\['([a-z]+)', '((?:[^'\\]|\\.)*)', '((?:[^'\\]|\\.)*)'/g)) if (!names[m[1]]) names[m[1]] = [m[2].replace(/\\'/g, "'"), m[3].replace(/\\'/g, "'")];
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
let bad = 0, n = 0;
for (const en of [false, true]) {
  const base = en ? '/en/lab/1982/' : '/lab/1982/', other = en ? '/lab/1982/' : '/en/lab/1982/';
  const tpl = await readFile(join(root, base.slice(1), 'index.html'), 'utf8');
  for (const [id, m] of Object.entries(G.games)) {
    const nm = names[id];
    if (!nm) throw new Error('No shelf name for ' + id);
    const title = `${en ? nm[1] : nm[0]} — Dragon 1982`, desc = (en ? m.about.en : m.about.he).join(' ');
    const U = 'https://dragon1982.com', he = `${U}/lab/1982/${m.slug}/`, enU = `${U}/en/lab/1982/${m.slug}/`;
    let html = tpl
      .replace(/<meta name="description"[^>]*>\n|<link rel="(?:canonical|alternate)"[^>]*>\n|<meta (?:property="og:|name="twitter:)[^>]*>\n/g, '')
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>\n<meta name="description" content="${esc(desc)}">\n<meta property="og:title" content="${esc(title)}">\n<meta property="og:description" content="${esc(desc)}">\n<meta property="og:type" content="website">\n<meta property="og:url" content="${en ? enU : he}">\n<meta property="og:image" content="${U}/lab/1982/shots/${id}.png">\n<meta name="twitter:card" content="summary">\n<link rel="canonical" href="${en ? enU : he}">\n<link rel="alternate" hreflang="he" href="${he}">\n<link rel="alternate" hreflang="en" href="${enU}">`)
      .replace('<body>', `<body data-game="${id}">`)
      .replace(`href="${other}"`, `href="${other}${m.slug}/"`)
      .replaceAll('href="./building/"', `href="${base}building/"`)
      .replaceAll('href="./SOURCE.md"', 'href="/lab/1982/SOURCE.md"');
    html = html.replace('<!doctype html>', `<!doctype html>\n<!-- נוצר ב-tools/lab/games-pages.mjs מ-${base}index.html. לא לערוך ביד. -->`);
    const out = join(root, base.slice(1), m.slug, 'index.html');
    n++;
    if (check) { let old = ''; try { old = await readFile(out, 'utf8'); } catch {} if (old !== html) { bad++; console.log('out of date: ' + base + m.slug + '/'); } }
    else { await mkdir(join(root, base.slice(1), m.slug), { recursive: true }); await writeFile(out, html); }
  }
}
if (check && bad) { console.log(`${bad} of ${n} game pages are out of date: run node tools/lab/games-pages.mjs`); process.exit(1); }
console.log(check ? `all ${n} game pages are up to date` : `built ${n} game pages`);
