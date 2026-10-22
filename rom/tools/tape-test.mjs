// בדיקות הקלטת (שלב 3 חלק 5) מול המודל שנכתב מהמפרט (tapemodel.mjs).
// הרצה: node rom/tools/tape-test.mjs
// צעד 1: השגרות נקראות מ-BASIC עם EXEC, דרך הכניסות הקבועות ($8015-$8027) והמצביעים ($A004-$A00C).
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runRom } from './xr2.mjs';
import { traceDac } from './sndtrace.mjs';
import { leaderAndBlock, casBlock, blockBytes } from './tapemodel.mjs';

let pass = 0, fail = 0;
const ok = (name, cond, info = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${info}`); }
};
const hex = n => '$' + n.toString(16).toUpperCase().padStart(2, '0');
const lastNums = s => s.trim().split('\n').filter(l => /^[ \d-]+$/.test(l) && l.trim()).at(-1).trim().split(/\s+/).map(Number);
const dir = await mkdtemp(join(tmpdir(), 'dragon32-tape-'));
const WRITE = 'EXEC 32795:EXEC PEEK(40968)*256+PEEK(40969):EXEC 32792';           // מבוא, בלוק ($A008), מנוע כבוי
const READ = 'EXEC 32801:EXEC PEEK(40966)*256+PEEK(40967):EXEC 32792';            // סנכרון ($8021), בלוק ($A006), מנוע כבוי
const setBlk = (type, data, addr = 0x0600) =>
  `POKE 124,${type}:POKE 125,${data.length}:POKE 126,${addr >> 8}:POKE 127,${addr & 255}` +
  data.map((d, i) => `:POKE ${addr + i},${d}`).join('');

try {
  // 1. הגל של הכתיבה: כל כתיבה ל-$FF20 והמרווח שאחריה, מול המודל
  console.log('כתיבה: הגל והתזמון (1.3-1.5)');
  for (const [name, n, type, data] of [['מבוא 3 + בלוק של 3 בתים', 3, 1, [0x11, 0x22, 0x33]],
    ['מבוא 2 + בלוק ריק (סוף קובץ)', 2, 0xff, []], ['מבוא 2 + בית $00 ובית $FF', 2, 1, [0x00, 0xff]]]) {
    const { writes } = await traceDac([`POKE 144,0:POKE 145,${n}`, setBlk(type, data), WRITE], 'tleader', 3);
    const model = leaderAndBlock(n, type, data).writes;
    let bad = '';
    if (writes.length !== model.length) bad = `writes ${writes.length} != ${model.length}`;
    for (let i = 0; !bad && i < model.length; i++) {
      if (writes[i].v !== model[i].v) bad = `write ${i}: ${hex(writes[i].v)} != ${hex(model[i].v)}`;
      else if (i + 1 < writes.length && model[i].after !== null) {
        const gap = writes[i + 1].t - writes[i].t;
        if (gap !== model[i].after) bad = `gap after write ${i}: ${gap} != ${model[i].after}`;
      }
    }
    ok(`${name}: ${model.length} כתיבות`, !bad, bad);
  }
  {
    // ביט 0 = 813 מחזורים, ביט 1 = 435 (Ciaran): בבית $55 של המבוא, בלי הגבול
    const { writes } = await traceDac(['POKE 144,0:POKE 145,2', setBlk(1, []), WRITE], 'tleader', 3);
    const bitLen = (start, n) => writes[start + n].t - writes[start].t;
    ok('ביט 1 = 435 מחזורים, ביט 0 = 813', bitLen(0, 18) === 435 && bitLen(18, 36) === 813, `${bitLen(0, 18)} ${bitLen(18, 36)}`);
  }

  // 2. XRoar מפענח את מה שה-ROM כותב (קובץ CAS)
  console.log('כתיבה: XRoar קורא את מה שכתבנו');
  {
    const cas = join(dir, 'w.cas');
    await runRom(['POKE 144,0:POKE 145,10', setBlk(1, [0x11, 0x22, 0x33]), WRITE], { tapeWrite: cas, timeout: 6 });
    const got = [...await readFile(cas)];
    const want = blockBytes(1, [0x11, 0x22, 0x33]);
    const i = got.findIndex((b, k) => b === 0x3c && got[k - 1] === 0x55 && got[k + 1] === 1);
    ok(`CAS: מבוא $55 ואחריו ${want.map(hex).join(' ')}`, i > 0 && JSON.stringify(got.slice(i - 1, i - 1 + want.length)) === JSON.stringify(want) &&
      got.slice(0, i - 1).filter(b => b === 0x55).length >= 10, got.map(hex).join(' '));
  }

  // 3. קריאה: CAS שנבנה מהמפרט, ו-WAV שה-ROM עצמו כתב (שני הקטבים)
  console.log('קריאה: סנכרון ובלוק (1.7-1.9)');
  const readCase = async (name, tape, data, want) => {
    const s = await runRom(['POKE 126,6:POKE 127,0', READ,
      `PRINT PEEK(124);PEEK(125);PEEK(129);PEEK(132);${data.map((_, i) => `PEEK(${1536 + i})`).join(';') || '0'}`],
      { tapeLoad: tape, timeout: 10, wallTimeout: 120000 });
    const got = lastNums(s.screen);
    ok(name, JSON.stringify(got.filter((_, i) => i !== 3)) === JSON.stringify(want), `${got} != ${want}`);
    return got;
  };
  const casFile = async (name, bytes) => { const p = join(dir, name); await writeFile(p, Buffer.from(bytes)); return p; };
  await readCase('CAS: בלוק של 3 בתים', await casFile('r1.cas', casBlock(128, 1, [0x11, 0x22, 0x33])), [0x11, 0x22, 0x33], [1, 3, 0, 0x11, 0x22, 0x33]);
  await readCase('CAS: סוף קובץ', await casFile('r2.cas', casBlock(128, 0xff, [])), [], [255, 0, 0, 0]);
  const bad = casBlock(128, 1, [0x11, 0x22, 0x33]); bad[128 + 7] ^= 1;
  await readCase('CAS: סכום שגוי → 1', await casFile('r3.cas', bad), [0x11, 0x22, 0x33], [1, 3, 1, 0x11, 0x22, 0x33]);
  const data255 = Array.from({ length: 255 }, (_, i) => (i * 37 + 5) & 255);
  {
    const s = await runRom(['POKE 126,6:POKE 127,0', READ, 'S=0:FOR I=0 TO 254:S=S+PEEK(1536+I)*(I+1):NEXT:PRINT PEEK(125);PEEK(129);S'],
      { tapeLoad: await casFile('r4.cas', casBlock(128, 1, data255)), timeout: 10, wallTimeout: 120000 });
    const want = data255.reduce((a, d, i) => a + d * (i + 1), 0);
    ok('CAS: בלוק של 255 בתים', lastNums(s.screen).join(' ') === `255 0 ${want}`, s.screen);
  }
  {
    const s = await runRom(['POKE 126,128:POKE 127,0', READ, 'PRINT PEEK(129)'],
      { tapeLoad: await casFile('r5.cas', casBlock(128, 1, [1, 2, 3])), timeout: 10 });
    ok('קריאה לתוך ה-ROM → 2', lastNums(s.screen)[0] === 2, s.screen);
  }
  // WAV שה-ROM כתב, ואותו WAV הפוך
  const wav = join(dir, 'w.wav');
  await runRom(['POKE 144,0:POKE 145,128', setBlk(1, [0x11, 0x22, 0x33]), WRITE], { tapeWrite: wav, timeout: 6, xroarArgs: ['-tape-ao-rate', '44100'] });
  const p1 = await readCase('WAV שכתבנו: נקרא חזרה', wav, [0x11, 0x22, 0x33], [1, 3, 0, 0x11, 0x22, 0x33]);
  const w = await readFile(wav);
  const dataAt = w.indexOf('data') + 8, bits = w.readUInt16LE(34);
  const inv = Buffer.from(w);
  if (bits === 8) for (let i = dataAt; i < inv.length; i++) inv[i] = 255 - inv[i];
  else for (let i = dataAt; i + 1 < inv.length; i += 2) inv.writeInt16LE(Math.max(-32768, Math.min(32767, -inv.readInt16LE(i))), i);
  const wavInv = join(dir, 'winv.wav');
  await writeFile(wavInv, inv);
  const p2 = await readCase('WAV הפוך: נקרא חזרה', wavInv, [0x11, 0x22, 0x33], [1, 3, 0, 0x11, 0x22, 0x33]);
  ok(`שני הקטבים נותנים PHASE שונה (${p1[3]}, ${p2[3]})`, (p1[3] === 0) !== (p2[3] === 0));

  // 4. מצב: ערכי ההדלקה, ומה המנוע והפסיקות עושים
  console.log('מצב');
  {
    let s = await runRom(['FOR I=143 TO 150:PRINT PEEK(I);:NEXT:PRINT']);
    ok('$8F-$96 בהדלקה: 50 0 128 18 10 18 218 92', lastNums(s.screen).join(' ') === '50 0 128 18 10 18 218 92', s.screen);
    s = await runRom(['EXEC 32789']);
    ok('$8015: המנוע דולק', !!(s.pia1cra & 8), hex(s.pia1cra));
    s = await runRom(['EXEC 32789:EXEC 32792']);
    ok('$8018: המנוע כבוי', !(s.pia1cra & 8), hex(s.pia1cra));
    s = await runRom(['T=TIMER:EXEC 32789:PRINT TIMER-T']);
    const n = lastNums(s.screen)[0];
    ok(`השהיית המנוע כ-0.5 שנייה (${n} שדות)`, n >= 24 && n <= 27, s.screen);
    s = await runRom(['PRINT PEEK(40960)*256+PEEK(40961);PEEK(40964)*256+PEEK(40965);PEEK(40972)*256+PEEK(40973)']);
    ok('$A000/$A004/$A00C: מצביעים ל-$8006, $8021, $801B', lastNums(s.screen).join(' ') === '32774 32801 32795', s.screen);
    s = await runRom(['PRINT PEEK(32768);PEEK(32769)*256+PEEK(32770);PEEK(32798)']);
    ok('$8000: הוראות JMP', lastNums(s.screen)[0] === 0x7e && lastNums(s.screen)[2] === 0x7e, s.screen);
  }
} finally {
  await rm(dir, { recursive: true, force: true });
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
