// הרשימה בדף "טוענים ל-Dragon אמיתי" (/lab/1982/real-dragon/ ו-/en/...): כל קלטת במדף, לפי המגירות, עם הפקודה וזמן הטעינה,
// וקישור ללשונית "ל-Dragon אמיתי" בדף המשחק. נבנית מ-lab/1982/games.js ומ-TAPES, ‏REAL_NO ו-REAL_PLAY_ONLY ב-lab/1982/shelf.js.
// node tools/lab/real-dragon.mjs        כותב את הרשימה בשני הדפים
// node tools/lab/real-dragon.mjs --check רק בודק שהיא מעודכנת (חלק מ-npm test)
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root = join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const shelf = await readFile(join(root, 'lab/1982/shelf.js'), 'utf8');
const gt = await readFile(join(root, 'lab/1982/games.js'), 'utf8');
const cat = JSON.parse(gt.slice(gt.indexOf('{'), gt.lastIndexOf('}') + 1));
const block = shelf.slice(shelf.indexOf('const TAPES = ['), shelf.indexOf('\n  ];', shelf.indexOf('const TAPES = [')));
const rowsT = [...block.matchAll(/^\s*\['(\w+)', '((?:[^'\\]|\\.)*)', '((?:[^'\\]|\\.)*)'(?:, ('\w'|null))?/gm)];
const kinds = new Map(rowsT.map(m => [m[1], m[4] ? m[4].replace(/'/g, '') : null]));
const names = new Map(rowsT.map(m => [m[1], [m[2], m[3]].map(x => x.replace(/\\'/g, "'"))]));
const set = name => new Set([...(shelf.match(new RegExp('const ' + name + ' = new Set\\(\\[([^\\]]*)\\]')) || ['', ''])[1].matchAll(/'(\w+)'/g)].map(m => m[1]));
const NO = set('REAL_NO'), ONLY = set('REAL_PLAY_ONLY');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
function list(he) {
  const L = a => (Array.isArray(a) ? a[he ? 0 : 1] : a) || '';
  const pre = he ? '/lab/1982/' : '/en/lab/1982/';
  let out = '', n = 0;
  for (const d of cat.drawers) {
    const rows = Object.entries(cat.games).filter(([id, g]) => g.drawer === d.key && kinds.has(id) && kinds.get(id) !== 'c' && !NO.has(id));
    if (!rows.length) continue;
    out += `<h3>${esc(he ? d.he : d.en)}</h3>\n<ul class="real-list">\n`;
    for (const [id, g] of rows) {
      const k = kinds.get(id), cmd = k === 'm' ? 'CLOADM, EXEC' : k ? 'CLOADM' : 'CLOAD, RUN';
      const name = L(names.get(id)) || id;
      out += `  <li><a href="${pre}${g.slug}/#real"><bdi>${esc(name)}</bdi></a> <code dir="ltr">${cmd}</code>${L(g.load) ? ' · ' + esc(L(g.load)) : ''}${ONLY.has(id) ? (he ? ' · השמעה בלבד' : ' · play only') : ''}</li>\n`;
      n++;
    }
    out += '</ul>\n';
  }
  return [out, n];
}
let stale = 0;
for (const [file, he] of [['lab/1982/real-dragon/index.html', true], ['en/lab/1982/real-dragon/index.html', false]]) {
  const path = join(root, file), html = await readFile(path, 'utf8');
  const [body, n] = list(he);
  const next = html.replace(/<!-- real-list -->[\s\S]*?<!-- \/real-list -->/, `<!-- real-list -->\n<p class="muted">${he ? n + ' משחקים.' : n + ' games.'}</p>\n${body}<!-- /real-list -->`);
  if (next === html) continue;
  if (process.argv.includes('--check')) { console.log('out of date: ' + file); stale++; }
  else await writeFile(path, next);
}
if (stale) { console.log('run node tools/lab/real-dragon.mjs'); process.exit(1); }
console.log('the real-Dragon list is up to date');
