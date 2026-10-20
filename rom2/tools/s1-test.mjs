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
await check('GOSUB frame = 5 bytes on the stack: BD, calling line, text pointer at the line number (reader)', ['10 GOSUB 100', '100 STOP', 'RUN'], r => {
  const f = [...r.ram.subarray(0x7f30, 0x7f36)]; const tp = f[3] * 256 + f[4];
  return (f[0] === 0xbd && f[1] === 0 && f[2] === 10 && f[5] === 0 && r.ram[tp] === 0x31 && r.ram[tp - 1] === 0x20 && r.ram[tp - 2] === 0xbd) || `frame ${hex(f)} text@${tp.toString(16)}=${r.ram[tp]?.toString(16)}`;
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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
