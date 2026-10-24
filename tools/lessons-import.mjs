// מייבא את 10 השיעורים של "לומדים בייסיק עם הדרקון" מהמקור של המנהל העליון (lesson01.json ... lesson10.json),
// כמו שהם, לקובץ אחד שהדף קורא: lessons/lessons.json. את הטקסטים לא עורכים כאן: מתקנים במקור ומייבאים שוב.
// הרצה: node tools/lessons-import.mjs ~/mac-tools/basic-lessons
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const src = process.argv[2];
if (!src) { console.error('usage: node tools/lessons-import.mjs <folder with lesson01.json...>'); process.exit(1); }
const out = [];
for (let n = 1; n <= 10; n++) {
  const d = JSON.parse(readFileSync(join(src, `lesson${String(n).padStart(2, '0')}.json`), 'utf8'));
  for (const lang of ['he', 'en']) {
    const L = d[lang];
    for (const k of ['title', 'intro', 'steps', 'run', 'tip', 'challenge', 'challengeCode', 'nextTeaser'])
      if (L[k] === undefined) throw new Error(`lesson ${n} ${lang}: missing ${k}`);
  }
  out.push({ n, he: d.he, en: d.en });
}
const dest = fileURLToPath(new URL('../lessons/lessons.json', import.meta.url));
writeFileSync(dest, JSON.stringify(out, null, 1) + '\n');
console.log(`lessons.json: ${out.length} lessons`);
