// בדיקות הניסוי של שלב 1: מבנה התוכנית בזיכרון, בית אחרי בית, מול מה שהספרים מתארים.
// מקורות הציפיות: docs/DRAGON-SPEC-MEMORY.md, docs/DRAGON-SPEC-VERIFY.md (טבלת הטוקנים: Companion עמ' 39-40).
// הרצה: node rom2/tools/s1-test.mjs
import { runRom } from './xr2.mjs';

let pass = 0, fail = 0;
const w = (r, a) => r.ram[a] * 256 + r.ram[a + 1];
const hex = a => a.map(b => b.toString(16).padStart(2, '0')).join(' ');
// גוף השורה הראשונה בתוכנית (אחרי קישור ומספר), עד ה-0
function body(r, start = 0x1e01) { const out = []; for (let a = start + 4; r.ram[a]; a++) out.push(r.ram[a]); return out; }
async function check(name, lines, test) {
  try {
    const r = await runRom(lines, { timeout: 5 });
    const msg = test(r);
    if (msg === true) { pass++; console.log('  ✓ ' + name); }
    else { fail++; console.log('  ✗ ' + name + '\n      ' + msg); }
  } catch (e) { fail++; console.log('  ✗ ' + name + '\n      ' + e.message); }
}
const same = (got, want) => hex(got) === hex(want) ? true : `got ${hex(got)} / want ${hex(want)}`;
const t = s => [...s].map(c => c.charCodeAt(0));

console.log('stage 1: program storage');
await check('power-on: TXTTAB=$1E01, $1E00=0, empty program, VARTAB=ARYTAB=STREND=$1E03', [], r =>
  w(r, 0x19) === 0x1e01 && r.ram[0x1e00] === 0 && w(r, 0x1e01) === 0 && w(r, 0x1b) === 0x1e03 && w(r, 0x1d) === 0x1e03 && w(r, 0x1f) === 0x1e03
    || `TXTTAB ${w(r, 0x19).toString(16)} VARTAB ${w(r, 0x1b).toString(16)} ARYTAB ${w(r, 0x1d).toString(16)} STREND ${w(r, 0x1f).toString(16)}`);
await check('one line: [link][number][body][00], then 00 00, VARTAB after it', ['10 PRINT 1'], r =>
  same([...r.ram.subarray(0x1e01, 0x1e0b)], [0x1e, 0x09, 0x00, 0x0a, 0x87, 0x20, 0x31, 0x00, 0x00, 0x00]) === true && w(r, 0x1b) === 0x1e0b
    || same([...r.ram.subarray(0x1e01, 0x1e0b)], [0x1e, 0x09, 0x00, 0x0a, 0x87, 0x20, 0x31, 0x00, 0x00, 0x00]) + ` VARTAB ${w(r, 0x1b).toString(16)}`);
await check('GOTO = GO TO (81 BC), GOSUB = GO SUB (81 BD)', ['10 GOTO 5:GOSUB 7'], r => same(body(r), [0x81, 0xbc, 0x20, 0x35, 0x3a, 0x81, 0xbd, 0x20, 0x37]));
await check('GO TO with a space keeps the space (81 20 BC)', ['10 GO TO 5'], r => same(body(r), [0x81, 0x20, 0xbc, 0x20, 0x35]));
await check('ELSE gets a colon before it (3A 84), even after a colon (3A 3A 84)', ['10 IF A THEN 1 ELSE 2:ELSE'], r =>
  same(body(r), [0x85, 0x20, 0x41, 0x20, 0xbf, 0x20, 0x31, 0x20, 0x3a, 0x84, 0x20, 0x32, 0x3a, 0x3a, 0x84]));
await check("apostrophe = 3A 83, the rest kept as text", ["10 A=1:'PRINT X"], r => same(body(r), [0x41, 0xcb, 0x31, 0x3a, 0x3a, 0x83, ...t('PRINT X')]));
await check('? = PRINT (87)', ['10 ?1'], r => same(body(r), [0x87, 0x31]));
await check('functions: FF + token (CHR$ FF 91, PEEK FF 8C, USR FF A1)', ['10 A=CHR$(1)+PEEK(2)+USR(3)'], r =>
  same(body(r), [0x41, 0xcb, 0xff, 0x91, 0x28, 0x31, 0x29, 0xc3, 0xff, 0x8c, 0x28, 0x32, 0x29, 0xc3, 0xff, 0xa1, 0x28, 0x33, 0x29]));
await check('operators are tokens: + - * / ^ > = < (C3-CC), AND OR NOT', ['10 A=B+C-D*E/F^G>H<I AND J OR NOT K'], r =>
  same(body(r), [0x41, 0xcb, 0x42, 0xc3, 0x43, 0xc4, 0x44, 0xc5, 0x45, 0xc6, 0x46, 0xc7, 0x47, 0xca, 0x48, 0xcc, 0x49, 0x20, 0xc8, 0x20, 0x4a, 0x20, 0xc9, 0x20, 0xc0, 0x20, 0x4b]));
await check('keyword at the start of a name is a token (PRINTA = 87 41)', ['10 PRINTA'], r => same(body(r), [0x87, 0x41]));
await check('keyword inside a name stays text (XPRINT, SCORE)', ['10 XPRINT=SCORE'], r => same(body(r), [...t('XPRINT'), 0xcb, ...t('SCORE')]));
await check('strings are not crunched', ['10 PRINT "PRINT AND GOTO"'], r => same(body(r), [0x87, 0x20, ...t('"PRINT AND GOTO"')]));
await check('DATA is not crunched until a colon outside quotes', ['10 DATA PRINT,"A:B":PRINT'], r => same(body(r), [0x86, 0x20, ...t('PRINT,"A:B"'), 0x3a, 0x87]));
await check('REM keeps the rest, colons too', ['10 REM PRINT:GOTO'], r => same(body(r), [0x82, 0x20, ...t('PRINT:GOTO')]));
await check('CLOADM = CLOAD + M (99 4D), CSAVEM = 9A 4D', ['10 CLOADM:CSAVEM'], r => same(body(r), [0x99, 0x4d, 0x3a, 0x9a, 0x4d]));
await check('TAB( is one token (BB)', ['10 PRINT TAB(5)'], r => same(body(r), [0x87, 0x20, 0xbb, 0x35, 0x29]));

console.log('stage 1: editing and LIST');
await check('lines kept in order; insert, replace, delete', ['30 PRINT 3', '10 PRINT 1', '20 PRINT 9', '20 PRINT 2', '30', 'LIST'], r =>
  /LIST\n10 PRINT 1\n20 PRINT 2\nOK$/.test(r.screen.replace(/\n@$/, '')) || r.screen.split('\n').slice(-5).join(' | '));
await check('links point to the next line; last link 0000; VARTAB right after it', ['10 PRINT 1', '20 PRINT 22'], r => {
  const l1 = w(r, 0x1e01), l2 = w(r, l1), v = w(r, 0x1b);
  return (l1 === 0x1e09 && w(r, l1 + 2) === 20 && w(r, l2) === 0 && v === l2 + 2) || `l1 ${l1.toString(16)} l2 ${l2.toString(16)} VARTAB ${v.toString(16)}`;
});
await check('LIST shows ELSE and apostrophe without the hidden colons, ? as PRINT', ['10 IF A THEN 1 ELSE 2', "20 A=1 'X", '30 ?5', 'LIST'], r =>
  /LIST\n10 IF A THEN 1 ELSE 2\n20 A=1 'X\n30 PRINT5\nOK$/.test(r.screen.replace(/\n@$/, '')) || r.screen.split('\n').slice(-6).join(' | '));
await check('LIST range and single line', ['10 PRINT 1', '20 PRINT 2', '30 PRINT 3', 'LIST 20', 'LIST 20-', 'LIST -10'], r =>
  /LIST 20\n20 PRINT 2\nOK\nLIST 20-\n20 PRINT 2\n30 PRINT 3\nOK\nLIST -10\n10 PRINT 1\nOK$/.test(r.screen.replace(/\n@$/, '')) || r.screen.split('\n').slice(-10).join(' | '));
await check('NEW: empty program, pointers reset', ['10 PRINT 1', 'NEW', 'LIST'], r =>
  w(r, 0x1e01) === 0 && w(r, 0x1b) === 0x1e03 || `link ${w(r, 0x1e01).toString(16)} VARTAB ${w(r, 0x1b).toString(16)}`);

console.log('stage 1b: expressions, numbers, variables, FOR/NEXT');
const screenHas = re => r => re.test(r.screen.replace(/\n@$/, '')) || r.screen.split('\n').slice(-6).join(' | ');
await check('PRINT 2+3', ['PRINT 2+3'], screenHas(/PRINT 2\+3\n 5\nOK$/));
await check('number output: fractions, negatives, leading point (L-PRINT style)', ['PRINT 10/4;-5;.5'], screenHas(/\n 2\.5 -5  \.5\nOK$/));
await check('number output: 9 digits, E notation up', ['PRINT 1E10;1/3;123456789'], screenHas(/\n 1E\+10  \.333333333  123456789\nOK$/));
await check('number output: E notation at 1E9 and small', ['PRINT 1E9;-1.5E-5;.01;.001'], screenHas(/\n 1E\+09 -1\.5E-05  \.01  1E-03\nOK$/));
await check('precedence and brackets, left to right', ['PRINT -2*3;2-3-4;8/2/2;(1+2)*3;2*3+4*5'], screenHas(/\n-6 -5  2  9  26\nOK$/));
await check('relations give -1 / 0 (> = < <= <>)', ['PRINT 3>2;3=2;2<=2;1<>1'], screenHas(/\n-1  0 -1  0\nOK$/));
await check('AND OR NOT on integers; -32768 is accepted (reader)', ['PRINT -32768 AND 1;12 AND 10;5 OR 2;NOT 0'], screenHas(/\n 0  8  7 -1\nOK$/));
await check('INT ABS SGN', ['PRINT INT(-2.5);ABS(-3);SGN(-4)'], screenHas(/\n-3  3 -1\nOK$/));
await check('variables: 2 letters count, unassigned reads 0', ['ABCD=7:ABEF=9:PRINT ABCD;ZZ'], screenHas(/\n 9  0\nOK$/));
await check('variable record: [name 2][value 5] at VARTAB, ARYTAB after it (5 = 83 20 00 00 00)', ['A=5'], r => {
  const v = w(r, 0x1b); const rec = [...r.ram.subarray(v, v + 7)];
  return (same(rec, [0x41, 0x00, 0x83, 0x20, 0x00, 0x00, 0x00]) === true && w(r, 0x1d) === v + 7 && w(r, 0x1f) === v + 7) || same(rec, [0x41, 0x00, 0x83, 0x20, 0x00, 0x00, 0x00]) + ` ARYTAB ${w(r, 0x1d).toString(16)}`;
});
await check('reading an unassigned variable does not create it (reader)', ['PRINT QQ'], r => w(r, 0x1d) === w(r, 0x1b) || `VARTAB ${w(r, 0x1b).toString(16)} ARYTAB ${w(r, 0x1d).toString(16)}`);
await check('FOR/NEXT with STEP -1, nested, NEXT J,I; GOTO', ['10 FOR I=3 TO 1 STEP -1:FOR J=1 TO 2:PRINT I*10+J;:NEXT J,I', '20 GOTO 40', '30 PRINT "BAD"', '40 PRINT "END"', 'RUN'], screenHas(/RUN\n 31  32  21  22  11  12 END\nOK$/));
await check('errors: ?/0 ?UL ?NF', ['PRINT 1/0', 'GOTO 99', 'NEXT'], screenHas(/\?\/0 ERROR\nOK\nGOTO 99\n\?UL ERROR\nOK\nNEXT\n\?NF ERROR\nOK$/));
await check('errors: ?OV ?SN, and IN line inside a program', ['PRINT 1E38*10', 'PRINT 2+', '10 PRINT 1/0', 'RUN'], screenHas(/\n\?OV ERROR\nOK\nPRINT 2\+\n\?SN ERROR\nOK\n10 PRINT 1\/0\nRUN\n\?\/0 ERROR IN 10\nOK$/));

console.log('stage 2 part 1: strings');
await check('string variables, + , LEN', ['A$="HELLO":B$=A$+" WORLD"', 'PRINT A$;B$;LEN(B$)'], screenHas(/\nHELLOHELLO WORLD 11\nOK$/));
await check('LEFT$ RIGHT$ MID$', ['B$="HELLO WORLD"', 'PRINT LEFT$(B$,3);"/";RIGHT$(B$,5);"/";MID$(B$,7,3);"/";MID$(B$,9)'], screenHas(/\nHEL\/WORLD\/WOR\/RLD\nOK$/));
await check('string compare, CHR$, ASC', ['PRINT "AB"<"AC";"B">"AB";"A"="A";CHR$(65);ASC("Z")'], screenHas(/\n-1 -1 -1 A 90\nOK$/));
await check('string descriptor in the variable: [len][?][addr 2][?]; temps at $01A9 freed', ['A$="XY"'], r => {
  const v = w(r, 0x1b); return (r.ram[v] === 0x41 && r.ram[v + 1] === 0x80 && r.ram[v + 2] === 2 && w(r, 0x0b) === 0x1a9) || `rec ${hex([...r.ram.subarray(v, v + 7)])} TEMPPT ${w(r, 0x0b).toString(16)}`;
});
await check('literal in a program line stays in the program (no copy)', ['10 A$="XY"', 'RUN'], r => {
  const v = w(r, 0x1b); const a = w(r, v + 4); return (a > 0x1e01 && a < w(r, 0x1b)) || `addr ${a.toString(16)}`;
});
await check('garbage collection keeps live strings; ?OS when really full (200 bytes)', ['10 B$="KEEP":FOR I=1 TO 300:A$="ABCDEFGHIJ"+"KLMNOP":NEXT', '20 PRINT A$;B$', '30 C$="":FOR I=1 TO 300:C$=C$+"Z":NEXT', 'RUN'], screenHas(/\nABCDEFGHIJKLMNOPKEEP\n\?OS ERROR IN 30\nOK$/));
await check('type mismatch', ['A=1:A$="X":PRINT A+A$'], screenHas(/\?TM ERROR\nOK$/));

console.log('stage 2 part 2: arrays');
await check('DIM, two dimensions, zero start', ['DIM A(3),B(2,4):A(3)=7:B(2,4)=9:PRINT A(3)*2;B(2,4);A(0)'], screenHas(/\n 14  9  0\nOK$/));
await check('auto DIM 0-10, ?BS past 10, ?FC negative, ?DD twice', ['C(10)=5:PRINT C(10)', 'PRINT C(11)', 'PRINT C(-1)', 'DIM C(2)'], screenHas(/\n 5\nOK\nPRINT C\(11\)\n\?BS ERROR\nOK\nPRINT C\(-1\)\n\?FC ERROR\nOK\nDIM C\(2\)\n\?DD ERROR\nOK$/));
await check('string arrays', ['DIM S$(2):S$(1)="HI":PRINT S$(1);S$(0);"/"'], screenHas(/\nHI\/\nOK$/));
await check('array record = reader test 5: sizes 4,3,2 (last first), length 131, offsets 5/10/30', ['DIM A(1,2,3)', 'A(1,0,0)=1:A(0,1,0)=2:A(0,0,1)=3'], r => {
  const at = w(r, 0x1d), base = at + 11;
  const head = same([...r.ram.subarray(at, at + 11)], [0x41, 0, 0, 131, 3, 0, 4, 0, 3, 0, 2]);
  return (head === true && r.ram[base + 5] === 0x81 && r.ram[base + 10] === 0x82 && r.ram[base + 30] === 0x82 && r.ram[base + 31] === 0x40) || head;
});
await check('array index inside an index', ['B(1)=3:A(B(1))=8:PRINT A(3)'], screenHas(/\n 8\nOK$/));

console.log('stage 2 part 3: control statements');
await check('IF/ELSE (catalogue L-IF-01, L-ELSE-01), false IF skips the line, IF n THEN line (L-FLOW-06/07)',
  ['10 IF 0 THEN PRINT "BAD" ELSE PRINT "A";', '20 IF -2 THEN PRINT "B"; ELSE PRINT "BAD"', '30 IF 0 THEN PRINT "BAD":PRINT "BAD"', '40 IF 1 THEN 60', '50 PRINT "BAD"', '60 IF 1 GOTO 80', '70 PRINT "BAD"', '80 PRINT "C"', 'RUN'], screenHas(/RUN\nABC\nOK$/));
await check('nested ELSE pairs with the nearest IF (L-FLOW-08: ours, open on hardware)', ['10 IF 1 THEN IF 0 THEN PRINT "A"; ELSE PRINT "B"; ELSE PRINT "C";', '20 IF 0 THEN IF 1 THEN PRINT "A"; ELSE PRINT "B"; ELSE PRINT "C";', 'RUN'], screenHas(/RUN\nBC\nOK$/));
await check('ELSE inside quotes or SQR/RND tokens is not an ELSE', ['IF 0 THEN PRINT "ELSE":A=SQR(4)+RND(1) ELSE PRINT "Y"'], screenHas(/\nY\nOK$/));
await check('GOSUB/RETURN (L-RETURN-01), GO SUB with a space (L-FLOW-05), nested', ['10 GOSUB 30:PRINT "B";:GO SUB 40:PRINT "D":END', '30 PRINT "A";:RETURN', '40 GOSUB 30:PRINT "C";:RETURN', 'RUN'], screenHas(/RUN\nABACD\nOK$/));
await check('GOSUB frame = 5 bytes on the stack: BD, calling line, text pointer at the line number; the statement return address (2) stays above it (reader)', ['10 GOSUB 100', '100 STOP', 'RUN'], r => {
  const f = [...r.ram.subarray(0x7f2e, 0x7f36)]; const tp = f[3] * 256 + f[4];
  return (f[0] === 0xbd && f[1] === 0 && f[2] === 10 && f[7] === 0 && r.ram[tp] === 0x31 && r.ram[tp - 1] === 0x20 && r.ram[tp - 2] === 0xbd) || `frame ${hex(f)} text@${tp.toString(16)}=${r.ram[tp]?.toString(16)}`;
});
await check('RETURN without GOSUB: ?RG; RETURN drops FOR loops opened inside the subroutine', ['10 GOSUB 30:PRINT "B":RETURN', '30 FOR I=1 TO 5:RETURN', 'RUN'], screenHas(/RUN\nB\n\?RG ERROR IN 10\nOK$/));
await check('ON GOTO (L-ON-01), ON 0 and past the list fall through (L-FLOW-09), ON GOSUB (L-FLOW-10)',
  ['10 ON 2 GOTO 30,40', '20 END', '30 PRINT "BAD":END', '40 ON 0 GOTO 30:ON 3 GOTO 30,30:ON 2 GOSUB 60,70:PRINT "B":END', '60 PRINT "BAD":RETURN', '70 PRINT "A";:RETURN', 'RUN'], screenHas(/RUN\nAB\nOK$/));
await check('DATA/READ: quotes keep : and , (L-DATA-01), READ moves on (L-READ-01), RESTORE (L-RESTORE-01)',
  ['10 DATA "A:B","C,D"', '20 READ A$,B$:PRINT A$;"/";B$', '30 DATA "E",F', '40 READ C$:READ D$:PRINT C$;D$;:RESTORE:READ E$:PRINT E$', 'RUN'], screenHas(/RUN\nA:B\/C,D\nEFA:B\nOK$/));
await check('READ numbers across lines and statements, signs, unquoted strings', ['10 DATA 1,-2.5', '20 PRINT "X";:DATA +3,HELLO WORLD', '30 READ A,B,C,D$:PRINT A;B;C;D$', 'RUN'], screenHas(/RUN\nX 1 -2\.5  3 HELLO WORLD\nOK$/));
await check('READ past the end: ?OD; text read as a number: ?SN in the DATA line', ['10 DATA 1', '20 READ A,B', 'RUN', '20 READ A$:READ A', '30 DATA X', 'RUN'], screenHas(/\?OD ERROR IN 20\nOK\n20 READ A\$:READ A\n30 DATA X\nRUN\n\?SN ERROR IN 30\nOK$/));
await check('INPUT with a prompt and two values (L-INPUT-01 values)', ['10 INPUT "X";A$,B$', '20 PRINT "[";A$;"][";B$;"]"', 'RUN', 'A,B'], screenHas(/RUN\nX\? A,B\n\[A\]\[B\]\nOK$/));
await check('INPUT: number, ?? for more, ?REDO, ?EXTRA IGNORED (messages: mit, open on hardware)', ['10 INPUT A,B', '20 PRINT A+B', '30 INPUT C:PRINT C', 'RUN', '1', 'X', '2,3', '4,5'], screenHas(/RUN\n\? 1\n\?\? X\n\?REDO\n\? 2,3\n 5\n\? 4,5\n\?EXTRA IGNORED\n 4\nOK$/));
await check('INPUT in direct mode: ?ID', ['INPUT A'], screenHas(/INPUT A\n\?ID ERROR\nOK$/));
await check('STOP prints BREAK IN line; CONT goes on, variables kept', ['10 A$="A":STOP:PRINT A$', 'RUN', 'CONT'], screenHas(/RUN\nBREAK IN 10\nOK\nCONT\nA\nOK$/));
await check('CONT inside a FOR loop and a GOSUB (the stack survives)', ['10 GOSUB 20:PRINT "E":END', '20 FOR I=1 TO 3:PRINT I;:STOP:NEXT:RETURN', 'RUN', 'CONT', 'CONT', 'CONT'], screenHas(/ 1\nBREAK IN 20\nOK\nCONT\n 2\nBREAK IN 20\nOK\nCONT\n 3\nBREAK IN 20\nOK\nCONT\nE\nOK$/));
await check('?CN at power-on and after an error', ['CONT', '10 STOP', 'RUN', 'PRINT 1/0', 'CONT'], screenHas(/\nCONT\n\?CN ERROR\nOK\n10 STOP\nRUN\nBREAK IN 10\nOK\nPRINT 1\/0\n\?\/0 ERROR\nOK\nCONT\n\?CN ERROR\nOK$/));
await check('a direct command between STOP and CONT is fine', ['10 STOP:PRINT "A"', 'RUN', 'PRINT 2', 'CONT'], screenHas(/\nPRINT 2\n 2\nOK\nCONT\nA\nOK$/));
await check('?CN after editing a line and after NEW', ['10 STOP:PRINT "A"', 'RUN', '20 REM', 'CONT', 'RUN', 'NEW', 'CONT'], screenHas(/RUN\nBREAK IN 10\nOK\n20 REM\nCONT\n\?CN ERROR\nOK\nRUN\nBREAK IN 10\nOK\nNEW\nOK\nCONT\n\?CN ERROR\nOK$/));
await check('BREAK key between statements: BREAK IN line, CONT goes on', ['10 INPUT A', '20 PRINT A*2', 'RUN', '5', '\x03', 'CONT'], screenHas(/\n\? 5\nBREAK IN 10\nOK\n\nCONT\n 10\nOK$/));
await check('BREAK key at an INPUT prompt: BREAK IN line, CONT asks again', ['10 INPUT A', '20 PRINT A*2', 'RUN', '\x03CONT', '7'], screenHas(/RUN\n\?\nBREAK IN 10\nOK\nCONT\n\? 7\n 14\nOK$/));
await check('END stops quietly; END in the middle of a line', ['10 PRINT "A":END:PRINT "B"', 'RUN'], screenHas(/RUN\nA\nOK$/));
await check('POKE/PEEK (L-POKE-01: $0600 = A5), ?FC for a negative address or a value over 255', ['POKE 1536,165:IF PEEK(1536)=165 THEN PRINT "A"', 'PRINT PEEK(-1)', 'POKE 1536,256'], r =>
  (r.ram[0x600] === 0xa5 && /\nA\nOK\nPRINT PEEK\(-1\)\n\?FC ERROR\nOK\nPOKE 1536,256\n\?FC ERROR\nOK$/.test(r.screen.replace(/\n@$/, ''))) || `$0600=${r.ram[0x600].toString(16)} ` + r.screen.split('\n').slice(-6).join(' | '));
await check('EXEC runs machine code that returns with RTS', ['POKE 1536,57:EXEC 1536:PRINT "A"'], screenHas(/\nA\nOK$/));
await check('DEF FN (L-DEF-01); the parameter keeps its value outside; FN inside FN', ['10 DEF FNA(X)=X+1', '20 DEF FNB(X)=FNA(X)*Y', '30 X=5:Y=2:IF FNA(2)=3 THEN PRINT "A";FNB(4);X', 'RUN'], screenHas(/RUN\nA 10  5\nOK$/));
await check('FN never defined: ?UF; DEF in direct mode: ?ID', ['PRINT FNZ(1)', 'DEF FNA(X)=1'], screenHas(/\n\?UF ERROR\nOK\nDEF FNA\(X\)=1\n\?ID ERROR\nOK$/));
await check('RUN line: starts there and clears variables (L-RUN-01)', ['10 PRINT "BAD"', '20 IF A=0 THEN PRINT "A"', 'A=7', 'RUN 20'], screenHas(/RUN 20\nA\nOK$/));

console.log('stage 2 part 4: memory');
await check('CLEAR clears values (L-CLEAR-01), and goes on to the next statement', ['10 A$="X":A=7:CLEAR:IF A=0 AND A$="" THEN PRINT "A"', 'RUN'], screenHas(/RUN\nA\nOK$/));
await check('CLEAR 200,30000: MEMSIZ=$752F, STKTOP=$7467, FRETOP=$752F (reader, D64 values L-MEM-01)', ['CLEAR 200,30000'], r =>
  (w(r, 0x27) === 0x752f && w(r, 0x21) === 0x7467 && w(r, 0x23) === 0x752f) || `MEMSIZ ${w(r, 0x27).toString(16)} STKTOP ${w(r, 0x21).toString(16)} FRETOP ${w(r, 0x23).toString(16)}`);
await check('CLEAR n keeps MEMSIZ; string space is exactly n bytes (10 fit, 11 give ?OS)', ['CLEAR 10:A$="1234567890"', 'B$="X"+"Y"', 'CLEAR 10:A$="12345678901"'], r =>
  (w(r, 0x27) === 0x7ffe && w(r, 0x21) === 0x7ffe - 10 && /\nB\$="X"\+"Y"\n\?OS ERROR\nOK\nCLEAR 10:A\$="12345678901"\n\?OS ERROR\nOK$/.test(r.screen.replace(/\n@$/, ''))) || `STKTOP ${w(r, 0x21).toString(16)} ` + r.screen.split('\n').slice(-5).join(' | '));
await check('CLEAR too big: ?OM, nothing changes', ['CLEAR 40000', 'CLEAR 32700', 'CLEAR 200,32768'], r =>
  (w(r, 0x21) === 0x7f36 && w(r, 0x27) === 0x7ffe && /\nCLEAR 40000\n\?OM ERROR\nOK\nCLEAR 32700\n\?OM ERROR\nOK\nCLEAR 200,32768\n\?OM ERROR\nOK$/.test(r.screen.replace(/\n@$/, ''))) || `STKTOP ${w(r, 0x21).toString(16)} ` + r.screen.split('\n').slice(-6).join(' | '));
await check('the stack moves with CLEAR: GOSUB frame right under the new STKTOP, zero at STKTOP-1', ['10 CLEAR 1000:GOSUB 20', '20 STOP', 'RUN'], r => {
  const t = 0x7ffe - 1000; const f = [...r.ram.subarray(t - 8, t)];
  return (f[0] === 0xbd && f[2] === 10 && f[7] === 0) || `STKTOP ${w(r, 0x21).toString(16)} frame ${hex(f)}`;
});
await check('PCLEAR 1 / 8: program moves to $0C01 / $3601 with a zero before it, LIST and RUN still work (book + reader)', ['10 PRINT "HI";', '20 GOTO 40', '30 PRINT "BAD"', '40 PRINT "!"', 'PCLEAR 1', 'RUN', 'PCLEAR 8', 'RUN'], r =>
  (w(r, 0x19) === 0x3601 && r.ram[0x3600] === 0 && w(r, 0x1b) > 0x3601 && w(r, 0x3601) > 0x3601 && /PCLEAR 1\nOK\nRUN\nHI!\nOK\nPCLEAR 8\nOK\nRUN\nHI!\nOK$/.test(r.screen.replace(/\n@$/, ''))) || `TXTTAB ${w(r, 0x19).toString(16)} ` + r.screen.split('\n').slice(-8).join(' | '));
await check('PCLEAR inside a program: moves, clears variables, goes on (L-PCLEAR-01 without PMODE)', ['10 A=77', '20 PRINT 256*PEEK(25)+PEEK(26)', '30 PCLEAR 5', '40 PRINT "CONTINUED";A', '50 PRINT 256*PEEK(25)+PEEK(26)', 'RUN'], screenHas(/RUN\n 7681\nCONTINUED 0\n 9217\nOK$/));
await check('memory full: a new variable gives ?OM and STREND stays under the stack', ['CLEAR 24963', 'A=1:B=1:C=1:D=1:E=1:F=1:G=1:H=1:I=1:J=1:K=1'], r =>
  (/\?OM ERROR\nOK$/.test(r.screen.replace(/\n@$/, '')) && w(r, 0x1f) + 58 < 0x1e7b) || `STREND ${w(r, 0x1f).toString(16)} ` + r.screen.split('\n').slice(-3).join(' | '));
await check('memory full: a long program line gives ?OM and is not stored', ['CLEAR 24963', '10 REM ' + 'X'.repeat(100), 'LIST'], r =>
  (/\n\?OM ERROR\nOK\nLIST\nOK$/.test(r.screen.replace(/\n@$/, '')) && w(r, 0x1e01) === 0) || r.screen.split('\n').slice(-5).join(' | '));
await check('PCLEAR 0 / 9: ?FC', ['PCLEAR 0', 'PCLEAR 9'], screenHas(/PCLEAR 0\n\?FC ERROR\nOK\nPCLEAR 9\n\?FC ERROR\nOK$/));

console.log('stage 2 part 5: functions');
// outLines: the screen has these full lines, in this order (other lines, like long typed commands that wrap, may come between)
const outLines = (...want) => r => { const L = r.screen.split('\n'); let k = 0; for (const l of L) if (k < want.length && l === want[k]) k++; return k === want.length || 'missing ' + JSON.stringify(want[k]) + ' | ' + L.slice(-8).join(' | '); };
await check('book-known function and operator tests (L-F-SGN INT ABS RND LEN VAL ASC FIX INSTR, L-OP-01/02/03/06/07, L-NPARSE-01/02/03)', ["10 IF SGN(-2)=-1 AND SGN(0)=0 AND SGN(2)=1 THEN PRINT \"Y\"; ELSE PRINT \"N\";", "20 IF INT(2.75)=2 AND INT(-2.75)=-3 THEN PRINT \"Y\"; ELSE PRINT \"N\";", "30 IF ABS(-3)=3 AND ABS(0)=0 THEN PRINT \"Y\"; ELSE PRINT \"N\";", "40 IF RND(1)=1 THEN PRINT \"Y\"; ELSE PRINT \"N\";", "50 IF LEN(\"\")=0 AND LEN(\"A\"+CHR$(13)+\"B\")=3 THEN PRINT \"Y\"; ELSE PRINT \"N\";", "60 IF VAL(\"27X\")=27 AND VAL(\"X27\")=0 THEN PRINT \"Y\"; ELSE PRINT \"N\";", "70 IF ASC(\"AZ\")=65 THEN PRINT \"Y\"; ELSE PRINT \"N\";", "80 IF FIX(2.75)=2 AND FIX(-2.75)=-2 THEN PRINT \"Y\"; ELSE PRINT \"N\";", "90 IF INSTR(2,\"ABABA\",\"BA\")=2 AND INSTR(1,\"ABC\",\"Z\")=0 THEN PRINT \"Y\"; ELSE PRINT \"N\";", "100 IF 2+3*4-8/2=10 THEN PRINT \"Y\"; ELSE PRINT \"N\";", "110 IF (2+3)*4=20 THEN PRINT \"Y\"; ELSE PRINT \"N\";", "120 IF 2*3^2=18 THEN PRINT \"Y\"; ELSE PRINT \"N\";", "130 IF 8/2*2=8 AND 9-3+1=7 THEN PRINT \"Y\"; ELSE PRINT \"N\";", "140 IF (10 AND 6)=2 AND (10 OR 6)=14 THEN PRINT \"Y\"; ELSE PRINT \"N\";", "150 IF &H2A=42 AND -&H2A=-42 THEN PRINT \"Y\"; ELSE PRINT \"N\";", "160 IF &O52=42 AND &52=42 THEN PRINT \"Y\"; ELSE PRINT \"N\";", "170 IF 1.25E2=125 AND 125E-2=1.25 THEN PRINT \"Y\"; ELSE PRINT \"N\";", "RUN"], screenHas(/RUN\nY{17}\nOK$/));
await check('book-known string outputs (L-F-CHR HEX LEFT RIGHT MID STRING)', ['A$="ABCDE":B$="/"', 'PRINT CHR$(65);CHR$(66);B$;HEX$(42)', 'PRINT LEFT$(A$,2);B$;RIGHT$(A$,2)', 'PRINT MID$(A$,2,2);B$;MID$(A$,4)', 'PRINT STRING$(3,"XY");STRING$(2,65)'], outLines('AB/2A', 'AB/DE', 'BC/DE', 'XXXAA'));
await check('POKE/PEEK $0600=5A (L-F-PEEK); POINT of a text cell after CLS is -1 (L-F-POINT)', ['POKE 1536,90:IF PEEK(1536)=90 THEN PRINT "Y";', 'IF POINT(0,0)=-1 THEN PRINT "Y"'], r =>
  (r.ram[0x600] === 0x5a && /\nY\nOK\n.*\nY\nOK$/.test(r.screen.replace(/\n@$/, ''))) || r.screen.split('\n').slice(-4).join(' | '));
await check('math: SQR LOG EXP SIN COS TAN ATN and ^ (5-byte results; MIT tables = Dragon, reader)', ['PRINT SQR(2);LOG(10)', 'PRINT EXP(1);SIN(1)', 'PRINT COS(0);TAN(.5);ATN(.5)', 'PRINT 2^10;2^.5;3^-1'], outLines(' 1.41421356  2.30258509', ' 2.71828183  .841470985', ' 1  .54630249  .463647609', ' 1024  1.41421356  .333333333'));
await check('^ cases (reader): 0^0=1, -2^2=-4, (-2)^3=-8, 2^3^2=64 (left first); 0^-1 ?/0; (-8)^(1/3) ?FC', ['PRINT 0^0;-2^2;(-2)^3;2^3^2<100', 'PRINT 0^-1', 'PRINT (-8)^(1/3)'], screenHas(/\n 1 -4 -8 -1\nOK\nPRINT 0\^-1\n\?\/0 ERROR\nOK\nPRINT \(-8\)\^\(1\/3\)\n\?FC ERROR\nOK$/));
await check('errors: SQR(-1) LOG(0) ?FC, EXP(89) ?OV', ['PRINT SQR(-1)', 'PRINT LOG(0)', 'PRINT EXP(89)'], screenHas(/\?FC ERROR\nOK\nPRINT LOG\(0\)\n\?FC ERROR\nOK\nPRINT EXP\(89\)\n\?OV ERROR\nOK$/));
await check('RND: the Dragon generator — first RND(0) leaves $0115-$0119 = 80 7F 8F 2B FE (reader)', ['X=RND(0)'], r => same([...r.ram.subarray(0x115, 0x11a)], [0x80, 0x7f, 0x8f, 0x2b, 0xfe]));
await check('RND: negative seeds by the mantissa only, so RND(-1) and RND(-2) start the same run; RND(6) is 1-6', ['X=RND(-1):A=RND(0):X=RND(-2):B=RND(0):PRINT A=B', '10 FOR I=1 TO 50:R=RND(6)', '20 IF R<1 OR R>6 OR R<>INT(R) THEN C=1', '30 NEXT:PRINT C', 'RUN'], outLines('-1', 'OK', '10 FOR I=1 TO 50:R=RND(6)', '20 IF R<1 OR R>6 OR R<>INT(R) TH', 'EN C=1', '30 NEXT:PRINT C', 'RUN', ' 0', 'OK'));
await check('Dragon rounding (reader): every operation rounds — RND(1)=2 from seed $9758135C; 4*ATN(1) prints 3.14159266; 3^2 is exactly 9', ['POKE 278,151:POKE 279,88:POKE 280,19:POKE 281,92', 'PRINT RND(1)', 'PRINT 4*ATN(1)', 'A=3^2'], r => {
  const v = w(r, 0x1b); const ok = same([...r.ram.subarray(v + 2, v + 7)], [0x84, 0x10, 0, 0, 0]);
  return (ok === true && outLines(' 2', ' 3.14159266')(r) === true) || (ok === true ? outLines(' 2', ' 3.14159266')(r) : ok);
});
await check('golden values (reader, computed from the source): 24 results byte for byte — LOG EXP SQR ^ SIN COS TAN ATN, divide, add, compare', ["A0=LOG(2)", "A1=LOG(3)", "A2=LOG(10)", "A3=EXP(1)", "A4=EXP(-1)", "A5=SQR(2)", "A6=SQR(16)", "A7=2^3", "A8=3^2", "A9=2^10", "B0=10^2", "B1=2^.5", "B2=SIN(1)", "B3=COS(1)", "B4=TAN(1)", "B5=ATN(1)", "B6=ATN(.5)", "B7=1/3", "B8=2/3*3", "B9=10/4", "C0=.1+.2", "C1=4*ATN(1)", "C2=2*3^2=18", "C3=2^3=8"], r => {
  const v = w(r, 0x1b); const want = [[128, 49, 114, 23, 249], [129, 12, 159, 83, 214], [130, 19, 93, 141, 222], [130, 45, 248, 84, 89], [127, 60, 90, 177, 178], [129, 53, 4, 243, 53], [131, 0, 0, 0, 0], [132, 0, 0, 0, 1], [132, 16, 0, 0, 0], [139, 0, 0, 0, 6], [135, 72, 0, 0, 2], [129, 53, 4, 243, 53], [128, 87, 106, 164, 119], [128, 10, 81, 64, 126], [129, 71, 89, 34, 228], [128, 73, 15, 218, 162], [127, 109, 99, 56, 43], [127, 42, 170, 170, 171], [130, 0, 0, 0, 0], [130, 32, 0, 0, 0], [127, 25, 153, 153, 154], [130, 73, 15, 218, 162], [129, 128, 0, 0, 0], [0, 0, 0, 0, 0]];
  for (let i = 0; i < want.length; i++) { const got = [...r.ram.subarray(v + 7 * i + 2, v + 7 * i + 7)]; const m = same(got, want[i]); if (m !== true) return 'value ' + i + ': ' + m; }
  return true;
});
await check('golden values: how PRINT shows them (reader), part 1', ["A0=LOG(2)", "A1=LOG(3)", "A2=LOG(10)", "A3=EXP(1)", "A4=EXP(-1)", "A5=SQR(2)", "A6=SQR(16)", "A7=2^3", "A8=3^2", "A9=2^10", "B0=10^2", "B1=2^.5", "B2=SIN(1)", "B3=COS(1)", "B4=TAN(1)", "B5=ATN(1)", "B6=ATN(.5)", "B7=1/3", "B8=2/3*3", "B9=10/4", "C0=.1+.2", "C1=4*ATN(1)", "C2=2*3^2=18", "C3=2^3=8", "PRINT A0;A1", "PRINT A2;A3", "PRINT A4;A5", "PRINT A6;A7"], outLines(...[" .693147181  1.09861229", " 2.30258509  2.71828183", " .367879441  1.41421356", " 4  8"]));
await check('golden values: how PRINT shows them (reader), part 2', ["A0=LOG(2)", "A1=LOG(3)", "A2=LOG(10)", "A3=EXP(1)", "A4=EXP(-1)", "A5=SQR(2)", "A6=SQR(16)", "A7=2^3", "A8=3^2", "A9=2^10", "B0=10^2", "B1=2^.5", "B2=SIN(1)", "B3=COS(1)", "B4=TAN(1)", "B5=ATN(1)", "B6=ATN(.5)", "B7=1/3", "B8=2/3*3", "B9=10/4", "C0=.1+.2", "C1=4*ATN(1)", "C2=2*3^2=18", "C3=2^3=8", "PRINT A8;A9", "PRINT B0;B1", "PRINT B2;B3", "PRINT B4;B5"], outLines(...[" 9  1024", " 100  1.41421356", " .841470985  .540302306", " 1.55740772  .785398163"]));
await check('golden values: how PRINT shows them (reader), part 3', ["A0=LOG(2)", "A1=LOG(3)", "A2=LOG(10)", "A3=EXP(1)", "A4=EXP(-1)", "A5=SQR(2)", "A6=SQR(16)", "A7=2^3", "A8=3^2", "A9=2^10", "B0=10^2", "B1=2^.5", "B2=SIN(1)", "B3=COS(1)", "B4=TAN(1)", "B5=ATN(1)", "B6=ATN(.5)", "B7=1/3", "B8=2/3*3", "B9=10/4", "C0=.1+.2", "C1=4*ATN(1)", "C2=2*3^2=18", "C3=2^3=8", "PRINT B6;B7", "PRINT B8;B9", "PRINT C0;C1", "PRINT C2;C3"], outLines(...[" .463647609  .333333333", " 2  2.5", " .3  3.14159266", "-1  0"]));
await check('STR$: leading space or minus, no trailing space (reader)', ['PRINT "[";STR$(0);"][";STR$(5);"][";STR$(-.5);"][";STR$(.5);"]"'], screenHas(/\n\[ 0\]\[ 5\]\[-\.5\]\[ \.5\]\nOK$/));
await check('VAL and &H/&O (reader): VAL("&H1G")=1, VAL("-&H10")=0, VAL("&O8")=8, &O9 ?SN, &HFFFF=65535', ['PRINT VAL("&H1G");VAL("-&H10");VAL("&O8");VAL("  -2.5X");&HFFFF', 'PRINT &O9'], screenHas(/\n 1  0  8 -2\.5  65535\nOK\nPRINT &O9\n\?SN ERROR\nOK$/));
await check('INSTR edges and HEX$ (reader): INSTR("","")=0, INSTR(4,"ABC","")=0, INSTR(2,"ABC","")=2; HEX$(0)="0", HEX$(65535)', ['PRINT INSTR("","");INSTR(4,"ABC","");INSTR(2,"ABC","");HEX$(0);"/";HEX$(65535)'], screenHas(/\n 0  0  2 0\/FFFF\nOK$/));
await check('VARPTR: variables 7 apart (L-F-VARPTR, D64 prediction 7); new variable in VARPTR: ?FC (reader)', ['10 A=1:B=2', '20 PRINT VARPTR(B)-VARPTR(A)', 'RUN', 'PRINT VARPTR(QQ)'], screenHas(/RUN\n 7\nOK\nPRINT VARPTR\(QQ\)\n\?FC ERROR\nOK$/));
await check('TIMER=16384 sets $0112-$0113 (reader); POS(0) is the screen column', ['TIMER=16384:PRINT PEEK(274);PEEK(275)', 'PRINT "AB";POS(0)'], screenHas(/\n 64  [0-9]+\nOK\n.*\nAB 2\nOK$/));
await check('INKEY$: the saved key at $87 first, then cleared (reader); a key pressed while running', ['POKE 135,65:A$=INKEY$:PRINT A$;PEEK(135)', '10 A$=INKEY$:IF A$="" THEN 10', '20 PRINT ASC(A$)', 'RUN', 'Q'], outLines('A 0', 'OK', '10 A$=INKEY$:IF A$="" THEN 10', '20 PRINT ASC(A$)', 'RUN', ' 81', 'OK'));
await check('JOYSTK: 0 refreshes all four (centre 31 in the emulator); 1-3 return the saved byte unmasked (reader)', ['PRINT JOYSTK(0);JOYSTK(3)', 'POKE 347,200:PRINT JOYSTK(1)'], screenHas(/\n 31  31\nOK\n.*\n 200\nOK$/));
await check('USR: default targets give ?FC (reader); DEF USR3 and a numeric / string argument reach the routine', ['PRINT USR0(1)', 'POKE 1536,57:DEF USR3=1536:PRINT USR3(7);USR3("AB")'], screenHas(/\nPRINT USR0\(1\)\n\?FC ERROR\nOK\n.*\n.*\n 7 AB\nOK$/));
await check('MEM is the free space between STREND and the stack', ['PRINT MEM>20000 AND MEM<30000'], screenHas(/\n-1\nOK$/));


console.log('stage 2: closing items');
// מקרי קצה בחשבון: 57 תוצאות שהקורא חישב מהמקור (rom2/tools/edge.json): הבתים של A ומה ש-PRINT מראה
{
  const { readFileSync } = await import('node:fs');
  const rows = JSON.parse(readFileSync(new URL('./edge.json', import.meta.url), 'utf8'));
  const bad = [];
  for (const [e, bytes, shown] of rows) {
    const r = await runRom([e.includes('A=') ? e : 'A=' + e, 'PRINT A'], { timeout: 5 });
    const L = r.screen.replace(/\n@$/, '').split('\n');
    if (shown.startsWith('?')) { if (!L.some(l => l.startsWith(shown + ' ERROR'))) bad.push(`${e}: want ${shown}`); continue; }
    let v = w(r, 0x1b); while (v < w(r, 0x1d) && !(r.ram[v] === 0x41 && r.ram[v + 1] === 0)) v += 7;
    const got = hex([...r.ram.subarray(v + 2, v + 7)]).toUpperCase();
    const i = L.findIndex(l => l === 'PRINT A');
    const out = (L[i + 1] || '').trim();
    if (got !== bytes || out !== shown) bad.push(`${e}: got ${got} "${out}" / want ${bytes} "${shown}"`);
  }
  if (bad.length === 0) { pass++; console.log(`  ✓ arithmetic edge cases (reader, computed from the source): all ${rows.length} — bytes and PRINT`); }
  else { fail++; console.log('  ✗ arithmetic edge cases\n      ' + bad.join('\n      ')); }
}
await check('MEM after power-on = 24871 (reader: S at the MEM call = $7F2A, 11 bytes below the main loop)', ['PRINT MEM'], outLines(' 24871'));
await check('10 PRINT MEM : RUN = 24862 (reader)', ['10 PRINT MEM', 'RUN'], outLines(' 24862'));
await check('MID$ statement (reader): 2 args, 3 args, longer replacement is cut, length kept', ['A$="HELLO"', 'MID$(A$,2)="XY"', 'PRINT A$', 'MID$(A$,2,1)="QQ"', 'PRINT A$', 'MID$(A$,4)="XYZW"', 'PRINT A$;LEN(A$)'], outLines('HXYLO', 'HQYLO', 'HQYXY 5'));
await check('MID$ statement: start 0 → ?FC', ['A$="HELLO"', 'MID$(A$,0)="X"'], r => /\?FC ERROR/.test(r.screen) || r.screen.split('\n').slice(-3).join(' | '));
await check('MID$ statement: start past the end → ?FC, even with an empty right side', ['A$="HELLO"', 'MID$(A$,6)=""'], r => /\?FC ERROR/.test(r.screen) || r.screen.split('\n').slice(-3).join(' | '));
await check('MID$ statement: numeric target or right side → ?TM', ['MID$(A,1)="X"', 'A$="HI"', 'MID$(A$,1)=5'], r => (r.screen.match(/\?TM ERROR/g) || []).length === 2 || r.screen.split('\n').slice(-4).join(' | '));
await check('MID$ statement on a string in the program text: copied first, the program is not changed', ['10 A$="HELLO"', '20 MID$(A$,1)="J"', '30 PRINT A$', 'RUN', 'LIST 10'], r =>
  /RUN\nJELLO\nOK\nLIST 10\n10 A\$="HELLO"\nOK$/.test(r.screen.replace(/\n@$/, '')) || r.screen.split('\n').slice(-6).join(' | '));
await check('JOYSTK (reader): JOYSTK(0) refreshes all four; a centred stick reads 31 in XRoar', ['PRINT JOYSTK(0);JOYSTK(1);JOYSTK(2);JOYSTK(3)'], outLines(' 31  31  31  31'));

await check('MEM inside expressions (reader: stack frames as in the original): 1+MEM, (MEM), -MEM, ABS(MEM), A=MEM', ['PRINT 1+MEM', 'PRINT (MEM)', 'PRINT -MEM', 'PRINT ABS(MEM)', 'A=MEM:PRINT A'], outLines(' 24860', ' 24866', '-24865', ' 24863', ' 24865'));
await check('MEM inside FOR = 24825 (reader)', ['10 FOR I=1 TO 1:PRINT MEM:NEXT', 'RUN'], outLines(' 24825'));
await check('MEM inside GOSUB = 24841 (reader: record 5 + return address 2)', ['10 GOSUB 20:END', '20 PRINT MEM:RETURN', 'RUN'], outLines(' 24841'));
await check('after RETURN the stack is balanced: 24871 - 23 program bytes = 24848', ['10 GOSUB 20:PRINT MEM:END', '20 RETURN', 'RUN'], outLines(' 24848'));

console.log('stage 3 part 1: text screen (reader: docs/DRAGON-SPEC-SCREEN.md)');
await check('CLS: all 512 cells $60, cursor $0400 (CURADR $88)', ['10 CLS:A=PEEK(136)*256+PEEK(137)', '20 PRINT A', 'RUN'], r => {
  for (let a = 0x420; a < 0x600; a++) if (r.ram[a] !== 0x60 && a >= 0x440) return `cell ${a.toString(16)} = ${r.ram[a].toString(16)}`;
  return /^ 1024\nOK/.test(r.screen.replace(/\n@$/, '')) || r.screen.split('\n').slice(0, 3).join(' | ');
});
await check('CLS 0 / 3 / 8 fill $80 / $AF / $FF', ['10 CLS 0:A=PEEK(1500):CLS 3:B=PEEK(1500):CLS 8:C=PEEK(1500)', '20 CLS:PRINT A;B;C', 'RUN'], outLines(' 128  175  255'));
await check('CLS 9-255: our line "THE DRAGON MACHINE 2026" (Gonen, 20.10; the original prints a Microsoft notice), two new lines, cursor $0440', ['10 CLS 9:A=PEEK(136)*256+PEEK(137)', '20 PRINT A', 'RUN'], r =>
  /^THE DRAGON MACHINE 2026\n\n 1088\nOK/.test(r.screen) || r.screen.split('\n').slice(0, 4).join(' | '));
await check('CLS 256 and CLS -1: ?FC; CLS "A": ?TM', ['CLS 256', 'CLS -1', 'CLS "A"'], r => (r.screen.match(/\?FC ERROR/g) || []).length === 2 && /\?TM ERROR/.test(r.screen) || r.screen.split('\n').slice(-7).join(' | '));
await check('characters (reader): lower case → $00-$1F (inverse), control codes ignored, CHR$(8) steps back and blanks, $80-$FF as is', ['CLS:PRINT CHR$(97);CHR$(1);"AB";CHR$(8);"C";CHR$(143)'], r =>
  same([...r.ram.subarray(0x400, 0x406)], [0x01, 0x41, 0x43, 0x8f, 0x60, 0x60]));
await check('CR blanks the rest of the line from the cursor on (here: the CR before OK, column 4 is not 0)', ['POKE 1059,65:POKE 1060,65:PRINT @36,"";'], r => (r.ram[0x423] === 0x41 && r.ram[0x424] === 0x60) || 'cells ' + r.ram[0x423].toString(16) + ' ' + r.ram[0x424].toString(16));
await check('PRINT @n: cell 0-511 (@100,"Q" → $0464); @512 and @-1: ?FC', ['PRINT @100,"Q";', 'PRINT @512,1', 'PRINT @-1'], r =>
  r.ram[0x464] === 0x51 && (r.screen.match(/\?FC ERROR/g) || []).length === 2 || `cell ${r.ram[0x464].toString(16)} | ` + r.screen.split('\n').slice(-5).join(' | '));
await check('SET/RESET/POINT (reader): colour per cell, colour 0 keeps it, RESET keeps the colour, text cell: RESET → $80, POINT -1/0/colour', ['SET(0,0,3):SET(1,1,0):A=POINT(0,0):B=POINT(1,1):C=POINT(1,0)', 'RESET(0,0):D=PEEK(1024):RESET(4,4):E=PEEK(1090)', 'SET(8,8,0):F=PEEK(1156):G=POINT(20,20)', 'PRINT A;B;C;D;E;F;G'], outLines(' 3  3  0  161  128  136 -1'));
await check('SET/RESET errors: x 64 or y 32 ?FC, colour 9 ?FC, colour missing ?SN', ['SET(64,0,1)', 'SET(0,32,1)', 'SET(0,0,9)', 'SET(0,0)'], r => (r.screen.match(/\?FC ERROR/g) || []).length === 3 && /\?SN ERROR\nOK$/.test(r.screen.replace(/\n@$/, '')) || r.screen.split('\n').slice(-8).join(' | '));
await check('CLEAR key while typing: the screen is cleared and the line starts again (reader)', ['PRINT 1\fPRINT 2'], r => /^PRINT 2\n 2\nOK/.test(r.screen) || r.screen.split('\n').slice(0, 3).join(' | '));
await check('cursor blink counter CBLCNT ($8F) = 50 at power-on (reader)', [], r => r.ram[0x8f] === 50 || 'CBLCNT ' + r.ram[0x8f]);

console.log('stage 3 part 2: editing tools (reader: docs/DRAGON-SPEC-EDIT.md)');
await check('TRON: [n] at each program line entered, no spaces, not again after a colon; flag $AF = $4F; TROFF: 0', ['10 PRINT "A";', '20 PRINT "B";:PRINT "C";', '30 GOTO 50', '40 PRINT "X"', '50 END', 'TRON', 'RUN', 'TROFF', 'RUN'], r =>
  /RUN\n\[10\]A\[20\]BC\[30\]\[50\]\nOK\nTROFF\nOK\nRUN\nABC\nOK$/.test(r.screen.replace(/\n@$/, '')) && r.ram[0xaf] === 0 || r.screen.split('\n').slice(-8).join(' | '));
await check('TRON survives RUN and NEW (reader)', ['TRON', 'NEW', '10 PRINT 1', 'RUN'], r => r.ram[0xaf] === 0x4f && /RUN\n\[10\] 1\nOK$/.test(r.screen.replace(/\n@$/, '')) || r.screen.split('\n').slice(-4).join(' | '));
await check('DEL n-m, -m, n-, missing lines are fine; DEL alone: ?FC', ['10 PRINT 1', '20 PRINT 2', '30 PRINT 3', '40 PRINT 4', '50 PRINT 5', 'DEL 20-30', 'DEL 5', 'DEL -10', 'DEL 50-', 'LIST', 'DEL'], r =>
  /DEL 50-\nOK\nLIST\n40 PRINT 4\nOK\nDEL\n\?FC ERROR\nOK$/.test(r.screen.replace(/\n@$/, '')) || r.screen.split('\n').slice(-7).join(' | '));
await check('DEL inside a program: deletes, stops, OK (the rest of the line is not run)', ['10 PRINT 1:DEL 30:PRINT 2', '30 REM', 'RUN', 'LIST'], r =>
  /RUN\n 1\nOK\nLIST\n10 PRINT 1:DEL 30:PRINT 2\nOK$/.test(r.screen.replace(/\n@$/, '')) || r.screen.split('\n').slice(-6).join(' | '));
await check('LINE INPUT: prompt without "?", the whole line kept (spaces, commas, quotes, colon)', ['10 LINE INPUT "NAME";A$', '20 PRINT "[";A$;"]"', 'RUN', '  HI, "YOU":X'], r =>
  /RUN\nNAME  HI, "YOU":X\n\[  HI, "YOU":X\]\nOK$/.test(r.screen.replace(/\n@$/, '')) || r.screen.split('\n').slice(-4).join(' | '));
await check('LINE INPUT: direct mode ?ID; numeric variable ?TM after the input', ['LINE INPUT A$', '10 LINE INPUT A', 'RUN', 'X'], r =>
  /LINE INPUT A\$\n\?ID ERROR/.test(r.screen) && /RUN\nX\n\?TM ERROR IN 10\nOK$/.test(r.screen.replace(/\n@$/, '')) || r.screen.split('\n').slice(-6).join(' | '));
await check('RENUM: GOTO, GOSUB, THEN, ELSE, ON lists, GO TO with spaces inside the number; text grows; the program still runs', ['10 IF X=0 THEN 30 ELSE 20', '20 GOSUB 40:ON X-1 GOTO 10,20:END', '30 X=1:GO TO 1 0', '40 PRINT "OK!";X:RETURN', 'RENUM 1000,0,1000', 'LIST', 'RUN'], r =>
  /LIST\n1000 IF X=0 THEN 3000 ELSE 2000\n2000 GOSUB 4000:ON X-1 GOTO 1000\n,2000:END\n3000 X=1:GO TO 1000\n4000 PRINT "OK!";X:RETURN\nOK\nRUN\nOK! 1\nOK$/.test(r.screen.replace(/\n@$/, '')) || r.screen.split('\n').slice(-9).join(' | '));
await check('RENUM: a missing target stays, "UL x IN y" with the new line number', ['10 GOTO 99', '20 GOTO 10', 'RENUM 100', 'LIST'], r =>
  /RENUM 100\nUL 99 IN 100\nOK\nLIST\n100 GOTO 99\n110 GOTO 100\nOK$/.test(r.screen.replace(/\n@$/, '')) || r.screen.split('\n').slice(-7).join(' | '));
await check('RENUM: ?FC for step 0, overlap with lines below the start, past 63999; ?SN for a number over 63999', ['10 PRINT 1', '20 PRINT 2', 'RENUM ,,0', 'RENUM 5,20', 'RENUM 63995,0,5', 'RENUM 64000'], r =>
  (r.screen.match(/\?FC ERROR/g) || []).length === 3 && /RENUM 64000\n\?SN ERROR\nOK$/.test(r.screen.replace(/\n@$/, '')) || r.screen.split('\n').slice(-10).join(' | '));
const editCase = (keys, want) => check(`EDIT: "${keys}" → ${want}`, ['10 PRINT "HELLO"', 'EDIT 10', keys, 'LIST'], r =>
  r.screen.replace(/\n@$/, '').endsWith(`LIST\n${want}\nOK`) || r.screen.split('\n').slice(-6).join(' | '));
await check('EDIT n: the whole line, then "n " again on a new line', ['10 PRINT "HELLO"', 'EDIT 10', 'Q'], r =>
  /EDIT 10\n10 PRINT "HELLO"\n10\nOK$/.test(r.screen.replace(/\n@$/, '')) || r.screen.split('\n').slice(-5).join(' | '));
await editCase('7 IXX_', '10 PRINT "XXHELLO"');
await editCase('SL2D', '10 PRINT "HEO"');
await editCase('XWORLD', '10 PRINT "HELLO"WORLD');
await editCase('6 HA"', '10 PRINT A"');
await editCase('8 3CABC', '10 PRINT "HABCO"');
await editCase('2SLKL', '10 PRINT "HEL');
await editCase('6 DA', '10 PRINT "HELLO"');
await check('EDIT: K then Q leaves the line unchanged (no save), OK', ['10 PRINT "HELLO"', 'EDIT 10', 'KHQ', 'LIST'], r => /\nOK\n\nLIST\n10 PRINT "HELLO"\nOK$/.test(r.screen.replace(/\n@$/, '')) || r.screen.split('\n').slice(-6).join(' | '));
await check('EDIT: E saves without printing the rest; no OK after saving', ['10 PRINT "HELLO"', 'EDIT 10', '6 DE'], r => /EDIT 10\n10 PRINT "HELLO"\n10 PRINT$/.test(r.screen.replace(/[\n@]+$/, '')) || r.screen.split('\n').slice(-4).join(' | '));
await check('EDIT with no number = line 0 (?UL); line missing ?UL; extra text ?SN', ['10 PRINT 1', 'EDIT', 'EDIT 20', 'EDIT 10 X'], r =>
  (r.screen.match(/\?UL ERROR/g) || []).length === 2 && /EDIT 10 X\n\?SN ERROR\nOK$/.test(r.screen.replace(/\n@$/, '')) || r.screen.split('\n').slice(-8).join(' | '));
await check('EDIT on a line longer than 128 characters (positions past 127)', ['10 REM ' + 'A'.repeat(130) + 'BCD', 'EDIT 10', '135 IZ_'], r => {
  const t = String.fromCharCode(...[...r.ram.subarray(0x1e05, 0x1e05 + 140)].filter(b => b >= 32 && b < 127));
  return t.endsWith('BZCD') || t.slice(-10); });
await check('EDIT saves like a typed line: variables cleared', ['10 PRINT A', 'A=5', 'EDIT 10', '', 'PRINT A'], outLines(' 0'));

console.log('stage 3 part 2: PRINT USING (reader: docs/DRAGON-SPEC-USING.md; 27 source predictions + the 24 L-USING tests + edges)');
{
  const { readFileSync } = await import('node:fs');
  const cases = JSON.parse(readFileSync(new URL('./using.json', import.meta.url), 'utf8'));
  const dec = b => { const c = b & 0x3f; const a = String.fromCharCode(c < 0x20 ? c + 0x40 : c); return b & 0x40 ? a : a.toLowerCase(); };
  const bad = [];
  for (const [cmd, want] of cases) {
    const r = await runRom(['CLS', cmd], { timeout: 5 });
    const rows = Array.from({ length: 16 }, (_, k) => [...r.ram.subarray(0x400 + 32 * k, 0x420 + 32 * k)].map(dec).join(''));
    const c0 = rows.findIndex(x => x.startsWith(cmd.slice(0, 10)));
    const n = c0 + Math.ceil(cmd.length / 32);
    const w = want.split('\n').map(x => x.startsWith('?') ? x + ' ERROR' : x);
    const got = rows.slice(n, n + w.length);
    // exact bytes for the first line: trailing spaces count when the wanted text ends with spaces
    const ok = got.every((g, k) => k === 0 && !w[k].startsWith('?') ? g.startsWith(w[k]) && g.slice(w[k].length).trim() === '' : g.trimEnd() === w[k]);
    if (!ok) bad.push(`${cmd} → ${JSON.stringify(got.map(x => x.trimEnd()))} / want ${JSON.stringify(w)}`);
  }
  if (!bad.length) { pass++; console.log(`  ✓ PRINT USING: all ${cases.length} cases`); }
  else { fail++; console.log('  ✗ PRINT USING\n      ' + bad.join('\n      ')); }
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
