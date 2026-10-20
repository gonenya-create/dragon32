// הבדיקות שהתוצאה שלהן ידועה מהספרים (docs/DRAGON-TESTS-BASIC.md), מול ה-BASIC החדש.
// הרצה: node rom2/tools/known-test.mjs rom2/tools/known.json /tmp/known-result.json
import { runRom } from './xr2.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const known = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const res = [];
for (const [id, inp, out] of known) {
  let lines = inp.split('↵').map(s => s.replace(/␠/g, ' '));
  const hasProg = lines.some(l => /^\d/.test(l));
  if (hasProg && !lines.some(l => /^RUN\b/.test(l))) lines.push('RUN');
  const want = out.replace(/\\n/g, '\n').replace(/␠/g, ' ');
  let ok = false, err = '', screen = '';
  try {
    screen = (await runRom(lines, { timeout: 8 })).screen;
    const L = screen.split('\n');
    if (/^[A-Z\/][A-Z0-9]$/.test(want)) ok = L.some(l => l.startsWith(`?${want} ERROR`));
    else {
      // output lines expected right before the final OK
      const w = want.replace(/\n$/, '').split('\n');
      const end = L.lastIndexOf('OK');
      const got = L.slice(end - w.length, end);
      ok = JSON.stringify(got.map(s => s.trimEnd())) === JSON.stringify(w.map(s => s.trimEnd()));
    }
  } catch (e) { err = e.message.slice(0, 80); }
  res.push({ id, ok, err, want, got: screen.split('\n').slice(-6).join(' | ') });
  process.stdout.write(ok ? '.' : 'x');
}
writeFileSync(process.argv[3], JSON.stringify(res, null, 1));
console.log('\npass', res.filter(r => r.ok).length, 'of', res.length);
