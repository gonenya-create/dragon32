// קלטות המדף של מכונת ה-Dragon, כמו קלטות אמיתיות: המכונה עצמה שומרת כל תוכנית עם CSAVE,
// בפורמט המכווץ שלה (כותרת, בלוקים של 255, סוף קובץ), ו-XRoar כותב את מה שיצא מהרשמקול.
// המקור: assets/dragon/tapes/*.bas (אותן תוכניות כמו באפליקציה). היעד: lab/1982/tapes/*.cas
// הרצה: node rom/tools/mktapes.mjs          (בונה מחדש)
//        node rom/tools/mktapes.mjs --check  (בודק שהקלטות מעודכנות; אחרי כל שינוי ב-ROM או בתוכנית)
import { readFile, writeFile, mkdtemp, rm, readdir, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runRom } from './xr2.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const src = join(root, 'assets/dragon/tapes'), out = join(root, 'lab/1982/tapes');
const check = process.argv.includes('--check');
const dir = await mkdtemp(join(tmpdir(), 'dragon32-tapes-'));
await mkdir(out, { recursive: true });
let bad = 0;
try {
  for (const f of (await readdir(src)).filter(f => f.endsWith('.bas')).sort()) {
    const id = f.slice(0, -4);
    const lines = (await readFile(join(src, f), 'utf8')).split(/\r?\n/).filter(l => l.trim());
    const cas = join(dir, id + '.cas');
    const r = await runRom(['NEW', ...lines, `CSAVE "${id.toUpperCase()}"`], { timeout: 30, wallTimeout: 180000, tapeWrite: cas });
    if (/ERROR/.test(r.screen)) throw new Error(`${id}: ${r.screen}`);
    const bytes = await readFile(cas);
    if (check) {
      let old = null;
      try { old = await readFile(join(out, id + '.cas')); } catch {}
      const same = old && Buffer.compare(old, bytes) === 0;
      console.log(`${same ? '✓' : '✗'} ${id}.cas ${same ? 'מעודכנת' : 'לא מעודכנת: node rom/tools/mktapes.mjs'}`);
      if (!same) bad++;
    } else {
      await writeFile(join(out, id + '.cas'), bytes);
      console.log(`${id}.cas: ${bytes.length} בתים`);
    }
  }
} finally {
  await rm(dir, { recursive: true, force: true });
}
process.exit(bad ? 1 : 0);
