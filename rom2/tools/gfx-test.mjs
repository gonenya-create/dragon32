// בדיקות הגרפיקה (שלב 3, חלק 3): ה-ROM מול המודל שנכתב מהמפרט (gfxmodel.mjs), ובדיקות שגיאה.
// הרצה: node rom2/tools/gfx-test.mjs   (SEED=n לסדרה אחרת של קווים אקראיים)
import { runRom } from './xr2.mjs';
import { Gfx } from './gfxmodel.mjs';

let pass = 0, fail = 0;
const ok = (name, good, detail) => { if (good) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name + (detail ? '\n      ' + detail : '')); } };
let seed = +(process.env.SEED || 1982);
const rnd = n => { seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff; return seed % n; };
const tail = r => r.screen.split('\n').filter(l => l && l !== '@').slice(-3).join(' | ');

// מריצים פקודות ב-ROM ובמודל, ומשווים את הזיכרון בטווח
async function same(name, lines, model, from, to) {
  const r = await runRom(lines, { timeout: 20, wallTimeout: 60000 });
  let bad = -1;
  for (let a = from; a < to; a++) if (r.ram[a] !== model.mem[a]) { bad = a; break; }
  ok(name, bad < 0 && !/ERROR/.test(r.screen), bad < 0 ? tail(r) : `first diff at $${bad.toString(16)}: rom ${r.ram[bad].toString(16)} model ${model.mem[bad].toString(16)} | ${tail(r)}`);
  return r;
}

console.log('graphics: PMODE, PCLS, COLOR, PSET/PRESET');
for (const m of [0, 1, 2, 3, 4]) {
  const g = new Gfx(), L = [];
  g.pmode(m, 1); L.push(`PMODE ${m},1`);
  g.pcls(2); L.push('PCLS 2');
  for (let i = 0; i < 30; i++) {
    const x = rnd(300), y = rnd(200), c = rnd(9), how = rnd(4);
    if (how === 0) { g.pset(x, y); L.push(`PSET(${x},${y})`); }
    else if (how === 1) { g.pset(x, y, c); L.push(`PSET(${x},${y},${c})`); }
    else if (how === 2) { g.pset(x, y, undefined, false); L.push(`PRESET(${x},${y})`); }
    else { const f = rnd(9), b = rnd(9); g.colorSt(f, b); L.push(`COLOR ${f},${b}`); }
  }
  await same(`PMODE ${m}: PCLS, COLOR and 30 random PSET/PRESET match the model`, L, g, g.start, g.end);
}

console.log('graphics: LINE (general, horizontal, vertical, box, filled box)');
for (const m of [0, 1, 2, 3, 4]) for (let k = 0; k < 2; k++) {
  const g = new Gfx(), L = [];
  g.pmode(m, 1); L.push(`PMODE ${m},1`);
  g.pcls(0); L.push('PCLS 0');
  for (let i = 0; i < 24; i++) {
    const p1 = [rnd(260), rnd(200)], p2 = rnd(5) ? [rnd(260), rnd(200)] : [p1[0], rnd(200)];
    if (rnd(6) === 0) p2[1] = p1[1];
    const set = rnd(4) > 0, box = ['', '', '', 'B', 'BF'][rnd(5)], from = rnd(5) ? p1 : null;
    if (rnd(5) === 0) { const f = 1 + rnd(8); g.colorSt(f); L.push(`COLOR ${f}`); }
    g.lineSt(from, p2, set, box);
    L.push(`LINE${from ? `(${from})` : ''}-(${p2}),${set ? 'PSET' : 'PRESET'}${box ? ',' + box : ''}`);
  }
  await same(`PMODE ${m} #${k + 1}: 24 random LINEs match the model`, L, g, g.start, g.end);
}

console.log('graphics: PPOINT');
{
  const g = new Gfx(), L = ['PMODE 3,1', 'PCLS 1', 'SCREEN 0,1'];
  g.pmode(3, 1); g.pcls(1); g.css = 8;
  const pts = [];
  for (let i = 0; i < 8; i++) { const x = rnd(256), y = rnd(192), c = rnd(9); g.pset(x, y, c); L.push(`PSET(${x},${y},${c})`); pts.push([x, y]); }
  L.push('PRINT ' + pts.map(p => `PPOINT(${p})`).join(';'));
  const want = pts.map(p => g.ppoint(...p));
  const r = await runRom(L, { timeout: 10 });
  const got = r.screen.split('\n').filter(l => /^ ?\d/.test(l)).pop() || '';
  ok('PPOINT in PMODE 3 with colour set 1 gives 5-8', got.trim().split(/\s+/).map(Number).join() === want.join(), `rom "${got}" model ${want}`);
  const L2 = ['PMODE 4,1', 'PCLS', 'PSET(10,10)', 'PRINT PPOINT(10,10);PPOINT(11,10)', 'SCREEN 0,1', 'PRINT PPOINT(10,10)'];
  const r2 = await runRom(L2);
  ok('PPOINT in PMODE 4: 1 / 0, and 5 with colour set 1', /\n 1  0\nOK\n[\s\S]*\n 5\nOK/.test(r2.screen), tail(r2));
}

console.log('graphics: PCOPY and PMODE pages');
{
  const g = new Gfx(), L = ['PCLEAR 8', 'PMODE 0,1', 'PCLS 0'];
  g.prog = 0x36; g.pmode(0, 1); g.pcls(0);
  for (let i = 0; i < 10; i++) { const x = rnd(256), y = rnd(192); g.pset(x, y); L.push(`PSET(${x},${y})`); }
  g.pmode(undefined, 2); g.pcls(1); g.pmode(undefined, 3); g.pcls(1); g.pmode(undefined, 4); g.pcls(1); g.pmode(undefined, 5); g.pcls(1); g.pmode(undefined, 6); g.pcls(1);
  L.push('PMODE ,2', 'PCLS 1', 'PMODE ,3', 'PCLS 1', 'PMODE ,4', 'PCLS 1', 'PMODE ,5', 'PCLS 1', 'PMODE ,6', 'PCLS 1');
  g.pcopy(1, 3); g.pcopy(1, 5); L.push('PCOPY 1 TO 3', 'PCOPY 1 TO 5');
  await same('PCOPY 1 TO 3 and 1 TO 5 copy 1536 bytes (pages 1-6)', L, g, 0x600, 0x2a00);
}

console.log('graphics: state and errors');
const st = async (name, lines, test) => { const r = await runRom(lines, { timeout: 10 }); const m = test(r); ok(name, m === true, m === true ? '' : m + ' | ' + tail(r)); };
const w = (r, a) => r.ram[a] * 256 + r.ram[a + 1];
await st('power-on: PMODE 0 page 1, colour 3 on 0, 16 bytes a row, last point (128,96)', [], r =>
  r.ram[0xb6] === 0 && w(r, 0xba) === 0x600 && w(r, 0xb7) === 0xc00 && r.ram[0xb9] === 16 && r.ram[0xb2] === 3 && r.ram[0xb3] === 0 && w(r, 0xc7) === 128 && w(r, 0xc9) === 96
  || [0xb2, 0xb3, 0xb6, 0xb7, 0xb9, 0xba, 0xc7, 0xc9].map(a => r.ram[a].toString(16)).join(' '));
await st('PMODE ,2 after PMODE 4: the page would pass the program → ?FC, nothing changes', ['PMODE 4,1', 'PMODE ,2'], r =>
  /\?FC ERROR/.test(r.screen) && r.ram[0xb6] === 4 && w(r, 0xba) === 0x600 || `mode ${r.ram[0xb6]} start ${w(r, 0xba).toString(16)}`);
await st('PMODE 1,3: start $1200, end $1E00', ['PMODE 1,3'], r => w(r, 0xba) === 0x1200 && w(r, 0xb7) === 0x1e00 || `${w(r, 0xba).toString(16)} ${w(r, 0xb7).toString(16)}`);
await st('PMODE 0,44 wraps to $0800 (8-bit page arithmetic, as in the original)', ['PMODE 0,44'], r => w(r, 0xba) === 0x800 || w(r, 0xba).toString(16));
await st('PMODE 5 / PMODE 0,0 / PCLS 9 / COLOR 9 give ?FC', ['PMODE 5', 'PMODE 0,0', 'PCLS 9', 'COLOR 9'], r => (r.screen.match(/\?FC ERROR/g) || []).length === 4 || 'count');
await st('PSET(-1,0) and PSET(0,256) give ?FC; PSET(0,0,) gives ?SN', ['PSET(-1,0)', 'PSET(0,256)', 'PSET(0,0,)'], r => /\?FC ERROR\n(.*\n)?\?FC ERROR\n(.*\n)?\?SN ERROR/.test(r.screen.replace(/OK\n/g, '')) || 'errs');
await st('LINE needs PSET or PRESET (?SN), but the last point is already set', ['LINE(1,2)-(30,40)', 'PRINT PEEK(200);PEEK(202)'], r => /\?SN ERROR[\s\S]* 30  40/.test(r.screen) || 'last point');
await st('LINE -(x,y) starts from the last point; RUN resets it to (128,96)', ['PMODE 4,1', 'PCLS', 'LINE(0,0)-(9,9),PSET', '10 LINE-(0,0),PSET', 'RUN', 'PRINT PPOINT(128,96);PPOINT(64,48);PPOINT(200,150);PEEK(200)'], r => /\n 1  1  0  0\nOK/.test(r.screen) || 'lp');
await st('SCREEN 1,1 keeps the colour set in RAM; text mode after OK clears only the hardware bit', ['SCREEN 1,1', 'PRINT PEEK(193);PEEK(65314) AND 248'], r => /\n 8  0\nOK/.test(r.screen) || 'css');
await st('PCOPY 1 TO 4 with the program at $1E01 (page 4 = $1800 is free) works; PCOPY 1 TO 5 gives ?FC', ['PCOPY 1 TO 4', 'PCOPY 1 TO 5'], r => (r.screen.match(/\?FC ERROR/g) || []).length === 1 || 'pcopy');

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
