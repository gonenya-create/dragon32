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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
