// (screen.mjs מוריד רווחים בסוף כל שורה)
// בדיקות ה-ROM: לכל מקרה מקלידים שורות ובודקים שהמסך מכיל את מה שצריך.
// הרצה: rom/build.sh && node rom/tools/test.mjs
import { execFileSync } from 'node:child_process';
const run = (lines, secs = 0.4) => execFileSync('node', [new URL('./screen.mjs', import.meta.url).pathname, 'rom/build/d32.rom', String(secs), lines.join('|')], { encoding: 'utf8' });
const CASES = [
  ['boot', [], /DRAGON 1982 BASIC 1\.0\n\(C\) 2026 GONEN YAROM\n\nOK/],
  ['PRINT 2+3', ['PRINT 2+3'], /\n 5\nOK/],
  ['? and ;', ['? 7*6;"=";6*7'], /\n 42 = 42\nOK/],
  ['precedence and brackets', ['PRINT (2+3)*4-1,-2.5*-2'], /\n 19 {14}5\nOK/],
  ['fractions', ['PRINT 10/4;-5;.5'], /\n 2\.5 -5  \.5\nOK/],
  ['big and small numbers', ['PRINT 1E10;0.001;123456789'], /\n 1E\+10  1E-03  123456789\nOK/],
  ['division by zero', ['PRINT 2/0'], /\?\/0 ERROR\nOK/],
  ['syntax error', ['XYZ'], /XYZ\n\?SN ERROR\nOK/]
];
let fail = 0;
for (const [name, lines, re] of CASES) {
  const out = run(lines);
  const ok = re.test(out);
  if (!ok) fail++;
  console.log((ok ? '  ✓ ' : '  ✗ ') + name + (ok ? '' : '\n' + out.split('\n').map(l => '      | ' + l).join('\n')));
}
console.log(`\n${CASES.length - fail} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
