// בודקים מהקהילה (גונן, 10.11): בונה מ-lab/1982/games.js ומ-TAPES ב-lab/1982/shelf.js
//  1. api/_games.js: רשימת הכתובות (slug) של כל המשחקים, כדי ש-api/report.js יקבל דיווח רק על משחק שקיים;
//  2. בדף התודה (/lab/1982/testers/ ו-/en/...): שמות המשחקים בסדר הארון.
// node tools/lab/testers.mjs          כותב
// node tools/lab/testers.mjs --check  רק בודק שהכול מעודכן (חלק מ-npm test)
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const check = process.argv.includes('--check');
const gt = await readFile(join(root, 'lab/1982/games.js'), 'utf8');
const G = JSON.parse(gt.slice(gt.indexOf('{'), gt.lastIndexOf('}') + 1));
const shelf = await readFile(join(root, 'lab/1982/shelf.js'), 'utf8');
const names = {};
for (const m of shelf.matchAll(/\['([a-z0-9]+)', '((?:[^'\\]|\\.)*)', '((?:[^'\\]|\\.)*)'/g)) if (!names[m[1]]) names[m[1]] = [m[2].replace(/\\'/g, "'"), m[3].replace(/\\'/g, "'")];

// בסדר הארון: מגירה אחרי מגירה
const order = [];
for (const d of G.drawers) for (const [id, g] of Object.entries(G.games)) if (g.drawer === d.key) order.push([id, g]);
for (const [id, g] of Object.entries(G.games)) if (!order.some(x => x[0] === id)) order.push([id, g]);
const slugs = order.map(([, g]) => g.slug);
if (slugs.some(s => !/^[a-z0-9-]+$/.test(s))) throw new Error('bad slug');

const files = {
  'api/_games.js': `// נוצר ב-tools/lab/testers.mjs מ-lab/1982/games.js. לא לערוך ביד.\n// כל המשחקים שיש להם דף: api/report.js מקבל דיווח רק על אחד מהם.\nexport const SLUGS = new Set(${JSON.stringify(slugs)});\n`,
};
for (const [file, en] of [['lab/1982/testers/index.html', false], ['en/lab/1982/testers/index.html', true]]) {
  const map = {};
  for (const [id, g] of order) { const nm = names[id]; if (!nm) throw new Error('No shelf name for ' + id); map[g.slug] = en ? nm[1] : nm[0]; }
  const html = await readFile(join(root, file), 'utf8');
  const json = JSON.stringify(map).replace(/</g, '\\u003c');
  files[file] = html.replace(/<!-- testers-names -->[\s\S]*?<!-- \/testers-names -->/, `<!-- testers-names -->\n<script>window.D32_TESTER_GAMES = ${json}</script>\n<!-- /testers-names -->`);
}
let stale = 0;
for (const [file, text] of Object.entries(files)) {
  let old = ''; try { old = await readFile(join(root, file), 'utf8'); } catch {}
  if (old === text) continue;
  if (check) { stale++; console.log('out of date: ' + file); }
  else await writeFile(join(root, file), text);
}
if (stale) { console.log('run node tools/lab/testers.mjs'); process.exit(1); }
console.log(check ? `the testers list is up to date (${slugs.length} games)` : `wrote the testers list (${slugs.length} games)`);
