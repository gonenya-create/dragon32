// (screen.mjs מוריד רווחים בסוף כל שורה)
// בדיקות ה-ROM: לכל מקרה מקלידים שורות ובודקים שהמסך מכיל את מה שצריך.
// הרצה: rom/build.sh && node rom/tools/test.mjs
import { execFileSync } from 'node:child_process';
// ניסיון שני אם XRoar לא ענה (קורה לפעמים כשהמחשב עמוס)
const once = (lines, secs) => execFileSync('node', [new URL('./screen.mjs', import.meta.url).pathname, 'rom/build/d32.rom', String(secs), lines.join('|')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const run = (lines, secs = 0.4) => { try { return once(lines, secs); } catch { return once(lines, secs); } };
const CASES = [
  ['boot', [], /DRAGON 1982 BASIC 1\.0\n\(C\) 2026 GONEN YAROM\n\nOK/],
  ['PRINT 2+3', ['PRINT 2+3'], /\n 5\nOK/],
  ['? and ;', ['? 7*6;"=";6*7'], /\n 42 = 42\nOK/],
  ['precedence and brackets', ['PRINT (2+3)*4-1,-2.5*-2'], /\n 19 {14}5\nOK/],
  ['fractions', ['PRINT 10/4;-5;.5'], /\n 2\.5 -5  \.5\nOK/],
  ['big and small numbers', ['PRINT 1E10;0.001;123456789'], /\n 1E\+10  1E-03  123456789\nOK/],
  ['division by zero', ['PRINT 2/0'], /\?\/0 ERROR\nOK/],
  ['syntax error', ['XYZ'], /XYZ\n\?SN ERROR\nOK/],
  ['program: FOR, IF, GOTO, variables', ['10 FOR I=1 TO 5', '20 PRINT I;', '30 NEXT I', '40 PRINT', '50 A=7:B=A*6', '60 IF B=42 THEN PRINT "YES";B', '70 GOTO 90', '80 PRINT "NEVER"', '90 END', 'RUN'], /RUN\n 1  2  3  4  5\nYES 42\nOK/],
  ['LIST keeps order; replace and delete lines', ['30 PRINT "C"', '10 PRINT "A"', '20 PRINT "X"', '20 PRINT "B"', '30', 'LIST'], /LIST\n10 PRINT "A"\n20 PRINT "B"\nOK/],
  ['error inside a program names the line', ['10 PRINT 1', '20 PRINT 1/0', 'RUN'], /\?\/0 ERROR IN 20\nOK/],
  ['GOTO to a missing line = ?UL', ['10 GOTO 50', 'RUN'], /\?UL ERROR IN 10\nOK/],
  ['NEXT without FOR = ?NF', ['NEXT'], /\?NF ERROR\nOK/],
  ['two-letter variable names (SCORE = SC)', ['SCORE=5:PRINT SC+1'], /\n 6\nOK/],
  ['STEP and nested loops', ['FOR I=3 TO 1 STEP -1:FOR J=1 TO 2:PRINT I*10+J;:NEXT J,I'], /\n 31  32  21  22  11  12\nOK/],
  ['comparisons give -1 / 0', ['PRINT 1<2;2<1;3=3;2<>2'], /\n-1  0 -1  0\nOK/],
  ['NEW clears the program', ['10 PRINT 1', 'NEW', 'LIST'], /NEW\nOK\nLIST\nOK/],
  ['graphics expression and PRINT coexist', ['PMODE 2+2,1','PCLS 0','PSET(2*4,12/2)','PRINT 6*7'], /\n 42\nOK/],
  ['invalid mode', ['PMODE 5'], /\?FC ERROR\nOK/],
  ['invalid page', ['PMODE 4,0'], /\?FC ERROR\nOK/],
  ['invalid coordinate', ['PSET(0,192)'], /\?FC ERROR\nOK/],
  ['invalid colour', ['PMODE 1','PCLS 0'], /\?FC ERROR\nOK/],
  ['graphics syntax', ['LINE(0,0)-(10,10),X'], /\?SN ERROR\nOK/]
];
let fail = 0;
for (const [name, lines, re] of CASES) {
  const out = run(lines);
  const ok = re.test(out);
  if (!ok) fail++;
  console.log((ok ? '  ✓ ' : '  ✗ ') + name + (ok ? '' : '\n' + out.split('\n').map(l => '      | ' + l).join('\n')));
}
console.log(`\n${CASES.length - fail} passed, ${fail} failed`);
try {
  execFileSync('node', [new URL('./gfx-test.mjs', import.meta.url).pathname], {stdio:'inherit'});
} catch { fail++; }
process.exit(fail ? 1 : 0);
