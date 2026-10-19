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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
