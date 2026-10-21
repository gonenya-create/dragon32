// בדיקות פקודות הקבצים (שלב 3 חלק 5, צעד 2) מול המפרט (docs/DRAGON-SPEC-TAPE.md) והמודל (tapemodel.mjs).
// הרצה: node rom2/tools/tape-file-test.mjs
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
const hex = n => '$' + n.toString(16).toUpperCase().padStart(2, '0');
const nums = s => s.trim().split('\n').filter(l => /^[ \d-]+$/.test(l) && l.trim()).at(-1)?.trim().split(/\s+/).map(Number);
const dir = await mkdtemp(join(tmpdir(), 'dragon32-tfile-'));
const T = { timeout: 20, wallTimeout: 180000 };

// parseCas: הבלוקים בקובץ CAS: { type, data, ok }
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
// casFile: קובץ CAS מהמפרט (2.3). רציף: מבוא, כותרת, מבוא, בלוקים ברצף, סוף. עם פערים: מבוא לפני כל בלוק
function casFile({ name, type = 0, ascii = 0, gap = 0, exec = 0, load = 0, data = [] }) {
  const L = () => new Array(128).fill(0x55);
  const hdr = [...name.padEnd(8).slice(0, 8)].map(c => c.charCodeAt(0)).concat([type, ascii, gap, exec >> 8, exec & 255, load >> 8, load & 255]);
  const blocks = [];
  for (let i = 0; i < data.length; i += 255) blocks.push(blockBytes(1, data.slice(i, i + 255)));
  blocks.push(blockBytes(0xff, []));
  const out = [...L(), ...blockBytes(0, hdr)];
  if (gap) for (const bl of blocks) out.push(...L(), ...bl);
  else { out.push(...L()); for (const bl of blocks) out.push(...bl); }
  return out;
}
const put = async (name, bytes) => { const p = join(dir, name); await writeFile(p, Buffer.from(bytes)); return p; };

try {
  // 1. CSAVE של תוכנית: הכותרת, הנתונים = הזיכרון מתחילת התוכנית עד VARTAB, וסוף קובץ
  console.log('CSAVE / CLOAD');
  const prog = ['10 PRINT "HELLO";', '20 FOR I=1 TO 3:PRINT I;:NEXT', '30 PRINT "END"'];
  const saved = join(dir, 'p.cas');
  const s1 = await runRom([...prog, 'CSAVE "PROG"',
    'S=0:FOR I=PEEK(25)*256+PEEK(26) TO PEEK(27)*256+PEEK(28)-1:S=S+PEEK(I):NEXT:PRINT S;PEEK(27)*256+PEEK(28)-PEEK(25)*256-PEEK(26)'],
  { ...T, tapeWrite: saved });
  const [sum, len] = nums(s1.screen);
  const bl = parseCas([...await readFile(saved)]);
  const hdr = bl[0];
  ok('כותרת: PROG + 4 רווחים, סוג 0, ASCII 0, פערים 0', hdr && hdr.type === 0 && hdr.data.length === 15 &&
    String.fromCharCode(...hdr.data.slice(0, 8)) === 'PROG    ' && hdr.data[8] === 0 && hdr.data[9] === 0 && hdr.data[10] === 0, JSON.stringify(hdr));
  const body = bl.slice(1, -1).flatMap(b => b.data);
  ok(`נתונים: ${len} בתים, הסכום ${sum}`, body.length === len && body.reduce((a, b) => a + b, 0) === sum && bl.every(b => b.ok), `${body.length} ${body.reduce((a, b) => a + b, 0)}`);
  ok('סוף קובץ: 55 3C FF 00 FF 55', bl.at(-1).type === 0xff && bl.at(-1).data.length === 0);
  ok('אחרי CSAVE הפקודה ממשיכה (S הודפס)', sum > 0);

  let s = await runRom(['CLOAD', 'LIST', 'RUN'], { ...T, tapeLoad: saved });
  ok('CLOAD: התוכנית נטענת ורצה', s.screen.includes('HELLO 1  2  3 END') && s.screen.includes('20 FOR I=1 TO 3:PRINT I;:NEXT'), s.screen);
  ok('CLOAD: F בפינה והשם, OK', s.screen.split('\n')[0].startsWith('F PROG'), s.screen.split('\n')[0]);
  s = await runRom(['CLEAR 100,20000', 'CLOAD', 'PRINT PEEK(25)*256+PEEK(26)'], { ...T, tapeLoad: saved });
  ok('CLOAD בלי שם: הקובץ הראשון', s.screen.includes('?') === false && nums(s.screen)[0] > 0, s.screen);

  // 2. חיפוש לפי שם, שם ארוך, SKIPF
  console.log('חיפוש ושמות');
  const two = await put('two.cas', [...casFile({ name: 'T', type: 2, exec: 0x601, load: 0x600, data: [1, 2, 3] }),
    ...(await readFile(saved))]);
  s = await runRom(['CLOAD "PROG"', 'RUN'], { ...T, tapeLoad: two });
  ok('CLOAD "PROG" מדלג על T ומוצא את PROG', s.screen.includes('HELLO'), s.screen);
  s = await runRom(['SKIPF "T"', 'CLOAD', 'RUN'], { ...T, tapeLoad: two });
  ok('SKIPF "T" ואז CLOAD', s.screen.includes('HELLO'), s.screen);
  s = await runRom(['CLOAD "PROG    XYZ"', 'RUN'], { ...T, tapeLoad: two });
  ok('CLOAD "PROG    XYZ": רק שמונה התווים הראשונים נחשבים', s.screen.includes('HELLO'), s.screen);
  {
    const long = join(dir, 'long.cas');
    await runRom(['10 REM', 'CSAVE "ABCDEFGHI"'], { ...T, tapeWrite: long });
    const h = parseCas([...await readFile(long)])[0];
    ok('CSAVE "ABCDEFGHI": השם ABCDEFGH', h && String.fromCharCode(...h.data.slice(0, 8)) === 'ABCDEFGH', h && h.data.join(','));
  }

  // 3. CSAVEM / CLOADM (C-03, C-04, C-05)
  console.log('CSAVEM / CLOADM');
  const m = join(dir, 'm.cas');
  await runRom(['POKE 1536,17:POKE 1537,34:POKE 1538,51', 'CSAVEM "M",1536,1538,1537'], { ...T, tapeWrite: m });
  const mb = parseCas([...await readFile(m)]);
  ok('C-03: כותרת סוג 2, 0/0, ביצוע $0601, טעינה $0600; בלוק של 3', mb[0] && mb[0].data[8] === 2 && mb[0].data[9] === 0 && mb[0].data[10] === 0 &&
    mb[0].data[11] === 6 && mb[0].data[12] === 1 && mb[0].data[13] === 6 && mb[0].data[14] === 0 &&
    JSON.stringify(mb[1].data) === '[17,34,51]' && mb[2].type === 0xff, JSON.stringify(mb));
  s = await runRom(['CLOADM', 'PRINT PEEK(1536);PEEK(1537);PEEK(1538);PEEK(157)*256+PEEK(158)'], { ...T, tapeLoad: m });
  ok('C-04: CLOADM טוען ל-$0600, ביצוע $0601', nums(s.screen).join(' ') === '17 34 51 1537', s.screen);
  s = await runRom(['CLOADM "M",16', 'PRINT PEEK(1552);PEEK(1553);PEEK(1554);PEEK(157)*256+PEEK(158)'], { ...T, tapeLoad: m });
  ok('C-05: עם היסט 16: $0610, ביצוע $0611', nums(s.screen).join(' ') === '17 34 51 1553', s.screen);
  s = await runRom(['CLOADM "M",16,5', 'PRINT PEEK(1552);PEEK(157)*256+PEEK(158)'], { ...T, tapeLoad: m });
  ok('CLOADM רציף עם זבל אחרי ההיסט: ?SN רק אחרי הטעינה (קורא: מדפסת 4.1)', s.screen.includes('?SN ERROR') && nums(s.screen).join(' ') === '17 1553', s.screen);
  s = await runRom(['10 CLOADM:PRINT "GO ON"', 'RUN'], { ...T, tapeLoad: m });
  ok('CLOADM בתוכנית: ממשיכים', s.screen.includes('GO ON'), s.screen);
  s = await runRom(['CSAVEM "M",1538,1536,1537']);
  ok('CSAVEM סוף לפני התחלה: ?FC', s.screen.includes('?FC ERROR'), s.screen);

  // 4. שגיאות (C-17, C-16)
  console.log('שגיאות');
  s = await runRom(['10 PRINT 1', 'CLOAD "M"', 'LIST'], { ...T, tapeLoad: m });
  ok('CLOAD של קוד מכונה: ?FM, התוכנית נשמרת', s.screen.includes('?FM ERROR') && s.screen.includes('10 PRINT 1'), s.screen);
  s = await runRom(['CLOADM "PROG"'], { ...T, tapeLoad: saved });
  ok('CLOADM של תוכנית: ?FM', s.screen.includes('?FM ERROR'), s.screen);
  const badc = casFile({ name: 'B', type: 2, load: 0x600, exec: 0x600, data: [1, 2, 3] });
  badc[badc.length - 7 - 6] ^= 0x40;
  s = await runRom(['CLOADM'], { ...T, tapeLoad: await put('bad.cas', badc) });
  ok('C-16: סכום שגוי בבלוק נתונים: ?IO', s.screen.includes('?IO ERROR') && !(s.pia1cra & 8), s.screen);
  s = await runRom(['CLOAD "A",1']);
  ok('CLOAD "A",1: ?SN לפני הקלטת', s.screen.includes('?SN ERROR'), s.screen);
  s = await runRom(['CLOAD 1']);
  ok('CLOAD 1: ?TM', s.screen.includes('?TM ERROR'), s.screen);

  // 5. MOTOR
  console.log('MOTOR');
  s = await runRom(['MOTOR ON']);
  ok('MOTOR ON: המנוע דולק', !!(s.pia1cra & 8), hex(s.pia1cra));
  s = await runRom(['MOTOR ON', 'MOTOR OFF']);
  ok('MOTOR OFF: כבוי', !(s.pia1cra & 8), hex(s.pia1cra));
  s = await runRom(['MOTOR ON', 'X=1/0']);
  ok('MOTOR ON ושגיאה: כבוי', !(s.pia1cra & 8));
  s = await runRom(['MOTOR']);
  ok('MOTOR: ?SN', s.screen.includes('?SN ERROR'));

  // 6. השורה הישירה לא נפגעת מהחוצץ (הכיווץ במקום, קורא 11)
  console.log('השורה הישירה');
  s = await runRom(['10 REM', 'CSAVE "X":PRINT "AFTER"'], { ...T, tapeWrite: join(dir, 'x.cas') });
  ok('CSAVE "X":PRINT "AFTER" בשורה ישירה', s.screen.includes('AFTER'), s.screen);
  s = await runRom(['PRINT PEEK(729)']);
  ok('$02D9 = $39 בהדלקה', nums(s.screen)[0] === 0x39, s.screen);
} finally {
  await rm(dir, { recursive: true, force: true });
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
