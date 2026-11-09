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
const NO = set('REAL_NO');
// רק השמעה, בלי הורדה: הרשות של Peaksoft (Harry Whitehouse, ‏Tim Love) ושל Star Spores (‏David Shadoff) היא למדף באתר (permissions-log, 9.11)
const ONLY = new Set(['hangit', 'dhh', 'champs', 'lionht', 'sas', 'cricket', 'spores']);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
function list(he) {
  const L = a => (Array.isArray(a) ? a[he ? 0 : 1] : a) || '';
  const pre = he ? '/lab/1982/' : '/en/lab/1982/';
  let out = '', n = 0;
  for (const d of cat.drawers) {
    // כל משחקי המגירה, כמו בארון. מחסניות ו-Buzzard Bait בכרטיס אפור עם הסבר, בלי כפתורים (גונן, 9.11)
    const rows = Object.entries(cat.games).filter(([id, g]) => g.drawer === d.key && kinds.has(id));
    if (!rows.length) continue;
    out += `<h3>${esc(he ? d.he : d.en)} <span class="cnt">${rows.length}</span></h3>\n<ul class="real-list">\n`;
    for (const [id, g] of rows) {
      if (kinds.get(id) === 'c' || NO.has(id)) {
        const why = kinds.get(id) === 'c' ? (he ? 'מחסנית: היא לא עוברת בכבל קלטות.' : 'A cartridge: it can\'t go through a cassette lead.')
          : (he ? 'צריך מפתח חומרה שהיה בקופסה המקורית.' : 'It needs a hardware key that came in the original box.');
        out += `  <li id="${id}" class="off"><span class="rn"><bdi>${esc(L(names.get(id)) || id)}</bdi></span><span class="rm">${why}</span></li>\n`;
        continue;
      }
      const k = kinds.get(id), cmd = k === 'm' ? 'CLOADM → EXEC' : k ? 'CLOADM' : 'CLOAD → RUN';
      const name = L(names.get(id)) || id, file = (names.get(id)[1] || id).replace(/[^A-Za-z0-9 !'-]/g, '').trim() || id;
      const btns = `<button type="button" class="p">▶ ${he ? 'השמעה' : 'Play'}</button>` + (ONLY.has(id)
        ? `<span class="only">${he ? 'השמעה בלבד' : 'play only'}</span>`
        : `<button type="button" class="w">⬇ ${he ? 'צליל' : 'sound'}</button><a class="c" href="/lab/1982/tapes/${id}.cas" download="${esc(file)}.cas">⬇ ${he ? 'קלטת' : 'tape'}</a>`);
      out += `  <li id="${id}" data-id="${id}" data-file="${esc(file)}"><span class="rn"><bdi>${esc(name)}</bdi></span><span class="rm">${he ? 'ב-<bdi dir="ltr">Dragon</bdi> מקלידים:' : 'On the Dragon, type:'} <code dir="ltr">${cmd}</code>${L(g.load) ? '<br>' + (he ? 'טעינה: ' : 'Loading: ') + esc(L(g.load)) : ''}</span><span class="rb">${btns}</span><span class="bar"><i></i><span></span></span></li>\n`;
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
  const next = html.replace(/<!-- real-list -->[\s\S]*?<!-- \/real-list -->/, `<!-- real-list -->\n<p class="muted">${he ? n + ' משחקים אפשר לטעון ל-<bdi dir="ltr">Dragon</bdi> אמיתי, מתוך כל המשחקים במדף.' : n + ' of the shelf\'s games can be loaded into a real <bdi>Dragon</bdi>.'}</p>\n${body}<!-- /real-list -->`);
  if (next === html) continue;
  if (process.argv.includes('--check')) { console.log('out of date: ' + file); stale++; }
  else await writeFile(path, next);
}
if (stale) { console.log('run node tools/lab/real-dragon.mjs'); process.exit(1); }
console.log('the real-Dragon list is up to date');
