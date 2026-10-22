// בדיקות קובצי הנתונים והטקסט (שלב 3 חלק 5, צעד 3) מול המפרט (docs/DRAGON-SPEC-TAPE.md, סעיפים 3.3-3.13, 4, 9).
// הרצה: node rom/tools/tape-data-test.mjs
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runRom } from './xr2.mjs';
import { blockBytes } from './tapemodel.mjs';

let pass = 0, fail = 0;
const ok = (name, cond, info = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${info}`); }
};
const hx = a => a.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
const dir = await mkdtemp(join(tmpdir(), 'dragon32-tdata-'));
const T = { timeout: 30, wallTimeout: 240000 };
const err = (s, e) => s.screen.includes(`?${e} ERROR`);
const lines = s => s.screen.split('\n');

function parseCas(b) {
  const out = [];
  for (let i = 0; i + 3 < b.length; i++) {
    if (b[i] !== 0x55 || b[i + 1] !== 0x3c) continue;
    const type = b[i + 2], len = b[i + 3], data = [...b.slice(i + 4, i + 4 + len)];
    let sum = type + len; for (const d of data) sum += d;
    out.push({ type, data, ok: (sum & 255) === b[i + 4 + len] });
    i += 4 + len;
  }
  return out;
}
// קובץ עם פערים (2.3): מבוא לפני כל בלוק
function gapFile(name, type, ascii, data) {
  const L = () => new Array(128).fill(0x55);
  const hdr = [...name.padEnd(8).slice(0, 8)].map(c => c.charCodeAt(0)).concat([type, ascii, 0xff, 0, 0, 0, 0]);
  const out = [...L(), ...blockBytes(0, hdr)];
  for (let i = 0; i < data.length; i += 255) out.push(...L(), ...blockBytes(1, data.slice(i, i + 255)));
  out.push(...L(), ...blockBytes(0xff, []));
  return out;
}
const put = async (name, bytes) => { const p = join(dir, name); await writeFile(p, Buffer.from(bytes)); return p; };
const write = async (name, cmds) => { const p = join(dir, name); const s = await runRom(cmds, { ...T, tapeWrite: p }); return { s, bl: parseCas([...await readFile(p)]) }; };

try {
  // 1. PRINT #-1 (3.10, C-11)
  console.log('PRINT #-1 ו-CLOSE');
  {
    const { s, bl } = await write('d.cas', ['OPEN "O",#-1,"D"', 'PRINT #-1,"A,B"', 'PRINT #-1,"A";CHR$(13);"B,C";CHR$(34);"D"',
      'PRINT #-1,12;-3', 'PRINT #-1', 'CLOSE #-1', 'PRINT PEEK(120);PEEK(111)']);
    const h = bl[0];
    ok('כותרת: D, סוג 1, $FF $FF', h && String.fromCharCode(...h.data.slice(0, 8)) === 'D       ' && h.data[8] === 1 && h.data[9] === 0xff && h.data[10] === 0xff, h && hx(h.data));
    const want = [0x41, 0x2c, 0x42, 0x0d, 0x41, 0x0d, 0x0d, 0x0d, 0x42, 0x2c, 0x43, 0x0d, 0x22, 0x0d, 0x44, 0x0d,
      0x20, 0x31, 0x32, 0x0d, 0x2d, 0x33, 0x0d, 0x0d];
    ok('C-11: הבתים (CR אחרי כל פריט, מספר בלי רווח אחריו, PRINT #-1 לבד = CR)', bl[1] && hx(bl[1].data) === hx(want), bl[1] && hx(bl[1].data));
    ok('בלוק סוף, וכל הסכומים תקינים', bl.length === 3 && bl[2].type === 0xff && bl.every(b => b.ok), JSON.stringify(bl.map(b => b.type)));
    ok('אחרי CLOSE: מצב 0, התקן 0', lines(s).some(l => l.trim() === '0  0'), s.screen);
  }
  // 2. C-10: גודלי הבלוקים
  for (const [n, sizes] of [[254, [255, 253]], [256, [255, 255, 2]], [0, []]]) {   // (FOR עד 0 רץ פעם אחת: בלי FOR)
    const { bl } = await write(`n${n}.cas`, ['OPEN "O",#-1,"N"', n ? `FOR I=1 TO ${n}:PRINT #-1,"X";:NEXT` : 'REM', 'CLOSE']);
    const got = bl.slice(1, -1).map(b => b.data.length);
    ok(`C-10: ${n} פריטים → בלוקים ${sizes.join('+') || 'אין'}, ואחריהם סוף`, JSON.stringify(got) === JSON.stringify(sizes) && bl.at(-1).type === 0xff, JSON.stringify(got));
  }

  // 3. INPUT #-1, LINE INPUT #-1, EOF (3.11, 3.12, C-09)
  console.log('INPUT #-1, LINE INPUT #-1, EOF');
  const text = s => [...s].map(c => c.charCodeAt(0));
  const f1 = await put('f1.cas', gapFile('F', 1, 0xff, text('A,B\r12,-3.5\r"Q,R",7\rHELLO\r')));
  let s = await runRom(['10 OPEN "I",#-1,"F"', '20 INPUT #-1,A$', '30 INPUT #-1,X,Y', '40 INPUT #-1,B$,Z',
    '50 LINE INPUT #-1,C$', '60 PRINT A$;"/";X;Y;"/";B$;Z;"/";C$;"/";EOF(-1)', '70 CLOSE', 'RUN'], { ...T, tapeLoad: f1 });
  ok('INPUT: מחרוזת בלי מרכאות עד סוף השורה, מספרים, מרכאות; LINE INPUT; EOF=-1 בסוף', s.screen.includes('A,B/ 12 -3.5 /Q,R 7 /HELLO/-1'), s.screen);
  s = await runRom(['10 OPEN "I",#-1,"F"', '20 INPUT #-1,A$,B$', 'RUN'], { ...T, tapeLoad: await put('f2.cas', gapFile('F', 1, 0xff, text('A,B\r'))) });
  ok('C-09: INPUT #-1,A$,B$ על "A,B": ?IE', err(s, 'IE') && s.screen.includes('IN 20'), s.screen);
  s = await runRom(['10 OPEN "I",#-1,"F"', '20 PRINT EOF(-1)', 'RUN'], { ...T, tapeLoad: await put('e.cas', gapFile('F', 1, 0xff, [])) });
  ok('קובץ ריק: EOF(-1) = -1 מיד', lines(s).some(l => l.trim() === '-1'), s.screen);
  s = await runRom(['10 OPEN "I",#-1,"F"', '20 INPUT #-1,X', 'RUN'], { ...T, tapeLoad: await put('fd.cas', gapFile('F', 1, 0xff, text('12X\r'))) });
  ok('מספר ואחריו זבל: ?FD (לא ?REDO)', err(s, 'FD'), s.screen);
  s = await runRom(['OPEN "I",#-1,"F"', 'INPUT #-1,A$'], { ...T, tapeLoad: f1 });
  ok('INPUT #-1 במצב ישיר: ?ID', err(s, 'ID'), s.screen);

  // 4. שגיאות ומספרי התקן (C-15, 4.1)
  console.log('שגיאות והתקנים');
  const e1 = [['PRINT #-1,1', 'NO'], ['PRINT #1,1', 'DN'], ['PRINT #-3,1', 'DN'], ['PRINT #200,1', 'DN'], ['PRINT #40000,1', 'FC'],
    ['OPEN "X",#-1,"A"', 'FM'], ['OPEN "",#-1,"A"', 'FC'], ['OPEN "I",#-2,"A"', 'FM'], ['PRINT EOF(-2)', 'FM'], ['PRINT EOF(-1)', 'NO'],
    ['OPEN "O",#-1', 'SN'], ['CLOSE #5', 'DN']];
  for (const [cmd, e] of e1) {
    s = await runRom([cmd, 'PRINT PEEK(111)'], T);
    ok(`${cmd}: ?${e}, ההתקן חוזר ל-0`, err(s, e) && lines(s).some(l => l.trim() === '0'), s.screen);
  }
  s = await runRom(['PRINT EOF(0);PEEK(111)', 'CLOSE', 'CLOSE #-1,#0,#-2', 'PRINT #0,"SCR"', 'PRINT #-2,"P"', 'PRINT "Z"'], T);
  ok('EOF(0)=0; CLOSE כשסגור: בלי שגיאה; PRINT #0 למסך', s.screen.includes(' 0  0') && s.screen.includes('SCR') && !s.screen.includes('ERROR'), s.screen);
  s = await runRom(['10 OPEN "O",#-1,"A":INPUT #-1,X', 'RUN', 'OPEN "O",#-1,"B"', 'X=1/0', 'PRINT PEEK(120)'], { ...T, tapeWrite: join(dir, 'x.cas') });
  ok('C-15: INPUT # על קובץ כתיבה ?FM; OPEN שני ?AO; שגיאה משאירה פתוח (2)', err(s, 'AO') && err(s, 'FM') && lines(s).some(l => l.trim() === '2'), s.screen);
  s = await runRom(['10 OPEN "I",#-1,"F"', '20 PRINT #-1,"X"', 'RUN'], { ...T, tapeLoad: f1 });
  ok('PRINT # על קובץ קריאה: ?FM', err(s, 'FM'), s.screen);

  // 5. RUN ו-END סוגרים, STOP לא (6)
  console.log('סגירה');
  {
    const { bl } = await write('r.cas', ['OPEN "O",#-1,"R"', 'PRINT #-1,"X"', 'RUN']);
    ok('RUN סוגר: הבלוק האחרון וסוף', bl.length === 3 && hx(bl[1].data) === '58 0D' && bl[2].type === 0xff, JSON.stringify(bl.map(b => [b.type, b.data.length])));
    const r2 = await write('e2.cas', ['10 OPEN "O",#-1,"E":PRINT #-1,"Y":END', 'RUN', 'PRINT PEEK(120)']);
    ok('END סוגר', r2.bl.length === 3 && r2.bl[2].type === 0xff && lines(r2.s).some(l => l.trim() === '0'), r2.s.screen);
    const r3 = await write('s.cas', ['10 OPEN "O",#-1,"S":PRINT #-1,"Y":STOP', 'RUN', 'PRINT PEEK(120)']);
    ok('STOP לא סוגר (מצב 2)', r3.bl.length === 1 && lines(r3.s).some(l => l.trim() === '2'), r3.s.screen);
  }

  // 6. CSAVE ,A ו-CLOAD של קובץ טקסט (3.3, 3.6, C-02)
  console.log('CSAVE ,A ו-CLOAD של טקסט');
  {
    const { s: s1, bl } = await write('a.cas', ['10 PRINT "HI";', "20 A=1:IF A THEN PRINT 2 ELSE PRINT 3 ' X", '30 PRINT "END"', 'CSAVE "T",A', 'PRINT "NEXT"']);
    const h = bl[0];
    ok('כותרת: T, סוג 0, $FF $FF', h && h.data[8] === 0 && h.data[9] === 0xff && h.data[10] === 0xff, h && hx(h.data));
    const body = String.fromCharCode(...bl.slice(1, -1).flatMap(b => b.data));
    ok('הטקסט: CR לפני כל שורה ואחרי האחרונה, כמו LIST', body === '\r10 PRINT "HI";\r20 A=1:IF A THEN PRINT 2 ELSE PRINT 3 \' X\r30 PRINT "END"\r', JSON.stringify(body));
    ok('CSAVE ,A ממשיך לפקודה הבאה במצב ישיר', s1.screen.includes('NEXT'), s1.screen);
    const a = join(dir, 'a.cas');
    s = await runRom(['PCLEAR 1', 'CLOAD "T"', 'LIST', 'RUN', 'PRINT PEEK(25)*256+PEEK(26)'], { ...T, tapeLoad: a });
    ok('C-02: CLOAD של טקסט אחרי PCLEAR 1: הרשימה, ההרצה והכתובת $0C01', s.screen.includes('HI 2') && s.screen.includes('END') &&
      s.screen.replace(/\n/g, '').includes('20 A=1:IF A THEN PRINT 2 ELSE PRINT 3') && lines(s).some(l => l.trim() === '3073'), s.screen);
    const r4 = await write('a2.cas', ['10 PRINT 1', '20 CSAVE "T",A', '30 PRINT "NO"', 'RUN']);
    ok('CSAVE ,A בתוכנית: התוכנית נגמרת', !lines(r4.s).some(l => l.trim() === 'NO') && r4.bl.length >= 3, r4.s.screen);
  }
  s = await runRom(['CLOAD'], { ...T, tapeLoad: await put('ds.cas', gapFile('Q', 0, 0xff, text('10 PRINT 1\rPRINT 2\r'))) });
  ok('שורה בלי מספר: ?DS', err(s, 'DS'), s.screen);
  s = await runRom(['10 PRINT 9', 'CLOAD'], { ...T, tapeLoad: await put('fm.cas', gapFile('Q', 1, 0, text('10 PRINT 1\r'))) });
  ok('קובץ עם פערים בלי ASCII: ?FM, התוכנית נשמרת', err(s, 'FM'), s.screen);

  // 7. CLOADM של קובץ עם פערים (3.4): רשומות
  console.log('CLOADM עם פערים');
  {
    const rec = [0, 0, 3, 0x06, 0x00, 0x11, 0x22, 0x33, 0, 0, 1, 0x06, 0x10, 0x44, 1, 0, 0, 0x06, 0x01];
    const f = await put('m.cas', gapFile('M', 2, 0, rec));
    s = await runRom(['CLOADM "M",16', 'PRINT PEEK(1552);PEEK(1553);PEEK(1554);PEEK(1568);PEEK(157)*256+PEEK(158)'], { ...T, tapeLoad: f });
    ok('רשומות סוג 0, ואז סוף: הבתים במקום + היסט, ביצוע $0611', lines(s).some(l => l.trim() === '17  34  51  68  1553'), s.screen);
    s = await runRom(['CLOADM'], { ...T, tapeLoad: await put('m2.cas', gapFile('M', 2, 0, [0, 0, 5, 6, 0, 1, 2])) });
    ok('הקובץ נגמר באמצע: ?IO', err(s, 'IO'), s.screen);
  }
} finally {
  await rm(dir, { recursive: true, force: true });
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
