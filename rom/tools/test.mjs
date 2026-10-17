// צילום המסך ללא רווחים בסוף כל שורה
// בדיקות ה-ROM: לכל מקרה מקלידים שורות ובודקים שהמסך מכיל את מה שצריך.
// הרצה: node rom/tools/test.mjs
import { execFileSync } from 'node:child_process';
import { runRom } from './xr.mjs';
const CASES = [
  ['zero upper bounds', ['DIM A(0),B(0,0):A(0)=2:B(0,0)=3:PRINT A(0);B(0,0)'], /\n 2  3\nOK/],
  ['auto DIM two dimensions', ['A(10,10)=4:PRINT A(0,0);A(10,10)'], /\n 0  4\nOK/],
  ['READ continues between commands', ['10 DATA 3,4','READ A:PRINT A','READ B:PRINT B'], /\n 3\nOK[\s\S]*\n 4\nOK/],
  ['RESTORE starts at next available line', ['10 DATA 3','30 DATA 7','RESTORE 20:READ A:PRINT A'], /\n 7\nOK/],
  ['ON zero line target', ['0 PRINT 6:END','ON 1 GOTO 0'], /\n 6\nOK/],
  ['two letter array names', ['DIM SCORE(1):SC(1)=6:PRINT SCORE(1)'], /\n 6\nOK/],

  ['ON GOTO selects second line', ['10 ON 2 GOTO 100,200:PRINT 99:END','100 PRINT 1:END','200 PRINT 2:END','RUN'], /RUN\n 2\nOK/],
  ['RETURN discards inner FOR', ['10 GOSUB 100:PRINT 8:END','100 FOR J=1 TO 3:PRINT J:RETURN','RUN'], /RUN\n 1\n 8\nOK/],
  ['GOSUB overflow', ['10 GOSUB 10','RUN'], /\?OM ERROR IN 10\nOK/],
  ['DATA colon in quotes', ['10 PRINT "X:DATA 99":DATA 7:REM DATA 8','READ A:PRINT A:READ B'], /\n 7\n\?OD ERROR\nOK/],
  ['RESTORE beyond program', ['10 DATA 1','RESTORE 100:READ A'], /\?OD ERROR\nOK/],
  ['quoted DATA item', ['10 DATA "X"','READ A'], /\?TM ERROR\nOK/],
  ['negative array index', ['PRINT A(-1)'], /\?BS ERROR\nOK/],
  ['array dimension mismatch', ['DIM A(2,2):PRINT A(1)'], /\?BS ERROR\nOK/],
  ['array allocation overflow', ['DIM A(1000,1000)'], /\?OM ERROR\nOK/],
  ['nested array in second index', ['DIM A(2,2):B(0)=2:A(1,B(0))=6:PRINT A(1,2)'], /\n 6\nOK/],

  ['nested GOSUB', ['10 GOSUB 100:PRINT 3:END','100 PRINT 1:GOSUB 200:RETURN','200 PRINT 2:RETURN','RUN'], /RUN\n 1\n 2\n 3\nOK/],
  ['RETURN without GOSUB', ['RETURN'], /\?RG ERROR\nOK/],
  ['GOSUB in FOR', ['10 FOR I=1 TO 3:GOSUB 100:NEXT:END','100 PRINT I;:RETURN','RUN'], /RUN\n 1  2  3\nOK/],
  ['direct GOSUB', ['100 PRINT 7:RETURN','GOSUB 100:PRINT 8'], /\n 7\n 8\nOK/],
  ['ON branches and return', ['10 ON 2 GOSUB 100,200:PRINT 9:END','100 PRINT 1:RETURN','200 PRINT 2:RETURN','RUN'], /RUN\n 2\n 9\nOK/],
  ['ON out of range', ['ON 0 GOTO 20,30:ON 3 GOSUB 20,30:PRINT 7'], /\n 7\nOK/],
  ...['-1','256'].map(n => ['ON range '+n, ['ON '+n+' GOTO 10'], /\?FC ERROR\nOK/]),
  ['DATA READ RESTORE', ['10 DATA 2,-3:DATA 4.5','20 DATA 8','30 READ A,B,C,D:PRINT A;B;C;D','40 RESTORE 20:READ A:PRINT A','50 RESTORE:READ A:PRINT A','RUN'], /RUN\n 2 -3  4\.5  8\n 8\n 2\nOK/],
  ['out of DATA', ['10 DATA 1','READ A,B'], /\?OD ERROR\nOK/],
  ['DATA ignores quoted words and REM', ['10 PRINT "DATA 99":REM DATA 98','20 DATA 6','READ A:PRINT A'], /\n 6\nOK/],
  ['DIM and arrays', ['DIM A(3),B(2,4):A(3)=7:B(2,4)=9:PRINT A(3)*2;B(2,4);A(0)'], /\n 14  9  0\nOK/],
  ['auto DIM and nested indices', ['B(0)=2:A(B(0))=8:PRINT A(2);A(10)'], /\n 8  0\nOK/],
  ['array FOR and scalar shift', ['DIM A(10):FOR I=1 TO 10:A(I)=I*I:NEXT:Z=7:PRINT A(3);A(10);Z'], /\n 9  100  7\nOK/],
  ['READ arrays', ['10 DATA 5,8','DIM A(2):READ A(0),A(2):PRINT A(0);A(2)'], /\n 5  8\nOK/],
  ['array bounds', ['DIM A(2):PRINT A(3)'], /\?BS ERROR\nOK/],
  ['array redimension', ['DIM A(2):DIM A(3)'], /\?DD ERROR\nOK/],

  ['integer functions', ['PRINT INT(-2.5);FIX(-2.5);ABS(-3);SGN(-2)'], /\n-3 -2  3 -1\nOK/],
  ['roots', ['PRINT SQR(16);SQR(2)'], /\n 4  1\.41421356\nOK/],
  ['trig identities', ['PRINT SIN(0);COS(0);ATN(1)*4'], /\n 0  1  3\.1415926[56]\nOK/],
  ['log exp', ['PRINT LOG(EXP(1));EXP(0)'], /\n 1  1\nOK/],
  ['prefix variables', ['IN=7:SQ=8:PRINT IN;SQ:INTX=9:PRINT INTX'], /\n 7  8\n 9\nOK/],
  ...['SQR(-1)','LOG(0)','LOG(-1)','SIN(1E10)','COS(-1E20)','TAN(65536)'].map(e => [e, ['PRINT '+e], /\?FC ERROR\nOK/]),
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
  ['graphics syntax', ['LINE(0,0)-(10,10),X'], /\?SN ERROR\nOK/],
  // מחרוזות (strings.s)
  ['string variables and +', ['A$="AB":B$=A$+"CD"+A$:PRINT B$;LEN(B$)'], /\nABCDAB 6\nOK/],
  ['LEFT$ RIGHT$ MID$', ['B$="DRAGON 32":PRINT LEFT$(B$,3);"/";RIGHT$(B$,2);"/";MID$(B$,3,3);"/";MID$(B$,8)'], /\nDRA\/32\/AGO\/32\nOK/],
  ['CHR$ ASC VAL STR$ STRING$', ['PRINT CHR$(65);ASC("B");VAL("12.5")*2;STR$(7);STRING$(3,"*");STRING$(2,66)'], /\nA 66  25  7\*\*\*BB\nOK/],
  ['INSTR and string comparison', ['A$="DRAGON":PRINT INSTR(A$,"GON");INSTR(A$,"X");"A"<"B";A$="DRAGON";"AB">"A"'], /\n 4  0 -1 -1 -1\nOK/],
  ['strings are copied on assignment', ['A$="ONE":X$=A$:A$="TWO":PRINT X$;A$'], /\nONETWO\nOK/],
  ['type mismatch', ['PRINT 1+"A"'], /\?TM ERROR\nOK/],
  ['INPUT string and numbers, ?? for missing values', ['10 INPUT "NAME";N$', '20 INPUT A,B', '30 PRINT "HI ";N$;A+B', 'RUN', 'GONEN', '3', '4'], /NAME\? GONEN\n\? 3\n\?\? 4\nHI GONEN 7\nOK/],
  ['INPUT ?REDO on a word for a number', ['10 INPUT A', '20 PRINT A*2', 'RUN', 'X', '21'], /\?REDO\n\? 21\n 42\nOK/],
  ['INPUT outside a program = ?ID', ['INPUT A'], /\?ID ERROR\nOK/],
  ['string memory is reused (300 joins)', ['10 A$="":FOR I=1 TO 300:A$=A$+"X":IF LEN(A$)>200 THEN A$=""', '20 NEXT:PRINT "DONE";LEN(A$)', 'RUN'], /DONE 99\nOK/, 30],
  // שלושת המקרים שקודקס מצא (תוקנו ב-interp.s)
  ['RUN twice re-reads DATA from the start', ['10 DATA 5', '20 READ A:PRINT A', 'RUN', 'RUN'], /RUN\n 5\nOK\nRUN\n 5\nOK/],
  ['array target survives a new scalar on the right side', ['DIM B(2):B(0)=Z+7:PRINT B(0);Z'], /\n 7  0\nOK/],
  ['a FOR inside a GOSUB with the same variable keeps the return', ['10 FOR I=1 TO 2:GOSUB 100:NEXT:PRINT "END":END', '100 FOR I=1 TO 2:NEXT:RETURN', 'RUN'], /RUN\nEND\nOK/]
];
let fail = 0;
for (const [name, lines, re, timeout] of CASES) {
  let out;
  try { out = (await runRom(lines, timeout ? { timeout } : {})).screen; }
  catch (error) { out = error.stack; }
  const ok = re.test(out);
  if (!ok) fail++;
  console.log((ok ? '  ✓ ' : '  ✗ ') + name + (ok ? '' : '\n' + out.split('\n').map(l => '      | ' + l).join('\n')));
}
console.log(`\n${CASES.length - fail} passed, ${fail} failed`);
try {
  execFileSync('node', [new URL('./gfx-test.mjs', import.meta.url).pathname], {stdio:'inherit'});
} catch { fail++; }
for (const file of ['func-test.mjs', 'sound-test.mjs', 'xr-test.mjs']) {
  try { execFileSync('node', [new URL(file, import.meta.url).pathname], {stdio:'inherit'}); }
  catch { fail++; }
}
process.exit(fail ? 1 : 0);
