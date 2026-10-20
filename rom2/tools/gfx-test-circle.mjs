// בדיקות CIRCLE ו-PAINT: ה-ROM מול המודל שנכתב מהמפרט (gfxmodel-circle.mjs), ובדיקות שגיאה.
// הרצה: node rom2/tools/gfx-test-circle.mjs   (SEED=n לסדרה אחרת)
import { runRom } from './xr2.mjs';
import { Gfx2 } from './gfxmodel-circle.mjs';

let pass = 0, fail = 0;
const ok = (name, good, detail) => { if (good) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name + (detail ? '\n      ' + detail : '')); } };
let seed = +(process.env.SEED || 1982);
const rnd = n => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
const tail = r => r.screen.split('\n').filter(l => l && l !== '@').slice(-3).join(' | ');
const errs = r => (r.screen.match(/\?\w\w ERROR/g) || []).map(s => s.slice(1, 3));

// מריצים ב-ROM, ומשווים את הזיכרון בטווח ואת רשימת השגיאות (המודל זורק 'FC' וכו')
async function same(name, lines, model, want = []) {
  const r = await runRom(lines, { timeout: 120, wallTimeout: 240000 });
  let bad = -1;
  for (let a = model.start; a < model.end; a++) if (r.ram[a] !== model.mem[a]) { bad = a; break; }
  const e = errs(r).join();
  ok(name, bad < 0 && e === want.join(), bad < 0 ? `errors rom [${e}] model [${want}] | ${tail(r)}` : `first diff at $${bad.toString(16)}: rom ${r.ram[bad].toString(16)} model ${model.mem[bad].toString(16)} | ${tail(r)}`);
  return r;
}
// מריצים פקודה במודל וגם רושמים אותה; שגיאה במודל נרשמת כשגיאה צפויה
const runner = (g, L, want) => (line, fn) => { L.push(line); try { fn(); } catch (e) { if (typeof e !== 'string') throw e; want.push(e); } };
const opt = v => v === undefined ? '' : String(v);
function circleLine(x, y, r, c, a, s, e) {
  const parts = [c, a, s, e];
  while (parts.length && parts[parts.length - 1] === undefined) parts.pop();
  return `CIRCLE(${x},${y}),${r}` + parts.map(p => ',' + opt(p)).join('');
}

console.log('CIRCLE: random circles and arcs in all five PMODEs');
for (const m of [0, 1, 2, 3, 4]) for (let k = 0; k < 2; k++) {
  const g = new Gfx2(), L = [], want = [], run = runner(g, L, want);
  run(`PMODE ${m},1`, () => g.pmode(m, 1));
  run('PCLS 0', () => g.pcls(0));
  for (let i = 0; i < 14; i++) {
    const x = rnd(5) ? rnd(256) : 200 + rnd(100), y = rnd(5) ? rnd(192) : 150 + rnd(100);
    const r = [0, 1, 3, rnd(40), rnd(120), 300 + rnd(2000)][rnd(6)];
    const c = rnd(3) ? undefined : rnd(9);
    let a, s, e;
    if (rnd(2)) {
      a = [0, 0.5, 1, 1.5, 2, 0.25, 3.7, 0.1][rnd(8)];
      if (rnd(2)) { s = rnd(100) / 25; if (rnd(2)) e = rnd(100) / 25; }
    }
    if (r > 255 && a > 1) a = 1;
    run(circleLine(x, y, r, c, a, s, e), () => g.circle(x, y, r, c, a, s, e));
  }
  await same(`PMODE ${m} #${k + 1}: 14 random CIRCLEs match the model`, L, g, want);
}

console.log('CIRCLE: fixed cases');
{
  const g = new Gfx2(), L = [], want = [], run = runner(g, L, want);
  run('PMODE 4,1', () => g.pmode(4, 1)); run('PCLS', () => g.pcls());
  run('CIRCLE@(128,96),0', () => g.circle(128, 96, 0));
  run('CIRCLE(250,5),40', () => g.circle(250, 5, 40));
  run('CIRCLE(0,190),60,1,2', () => g.circle(0, 190, 60, 1, 2));
  run('CIRCLE(100,100),50,,.5,.25,.75', () => g.circle(100, 100, 50, undefined, 0.5, 0.25, 0.75));
  run('CIRCLE(60,60),30,1,1,.75,.25', () => g.circle(60, 60, 30, 1, 1, 0.75, 0.25));
  run('CIRCLE(60,60),20,1,1,.5,.5', () => g.circle(60, 60, 20, 1, 1, 0.5, 0.5));
  run('CIRCLE(128,96),65535,1,0', () => g.circle(128, 96, 65535, 1, 0));
  run('CIRCLE(30,150),20,0,255.99', () => g.circle(30, 150, 20, 0, 255.99));
  await same('PMODE 4: radius 0, edges, arcs (incl. start > end), aspect 0, huge radius', L, g, want);
}
{
  const g = new Gfx2(), L = [], want = [], run = runner(g, L, want);
  run('PMODE 3,1', () => g.pmode(3, 1)); run('PCLS 1', () => g.pcls(1));
  run('CIRCLE(128,96),60,2', () => g.circle(128, 96, 60, 2));
  run('CIRCLE(128,96),40,3,.5', () => g.circle(128, 96, 40, 3, 0.5));
  run('CIRCLE(128,96),200,4,200', () => g.circle(128, 96, 200, 4, 200));
  await same('PMODE 3: aspect doubled (default too), V overflow → ?FC after a partial arc', L, g, want);
}

console.log('CIRCLE: errors');
const st = async (name, lines, test) => { const r = await runRom(lines, { timeout: 60, wallTimeout: 120000 }); const m = test(r); ok(name, m === true, m === true ? '' : m + ' | ' + tail(r)); };
await st('aspect ",," → ?SN; start 4 → ?FC; aspect -1 / 256 → ?FC',
  ['CIRCLE(10,10),5,1,,1', 'CIRCLE(10,10),5,1,1,4', 'CIRCLE(10,10),5,1,-1', 'CIRCLE(10,10),5,1,256'],
  r => errs(r).join() === 'SN,FC,FC,FC' || errs(r).join());
await st('radius -1 / 65536 → ?FC; end 4 → ?FC; ",,," (empty aspect before start) → ?SN',
  ['CIRCLE(10,10),-1', 'CIRCLE(10,10),65536', 'CIRCLE(10,10),5,1,1,0,4', 'CIRCLE(10,10),5,,,1'],
  r => errs(r).join() === 'FC,FC,FC,SN' || errs(r).join());
await st('CIRCLE(10,10) (no radius) → ?SN; colour 9 → ?FC; CIRCLE 10,10,5 → ?SN; CIRCLE(10,10),5,1,1,0,1X → ?SN',
  ['CIRCLE(10,10)', 'CIRCLE(10,10),5,9', 'CIRCLE 10,10,5', 'CIRCLE(10,10),5,1,1,0,1X'],
  r => errs(r).join() === 'SN,FC,SN,SN' || errs(r).join());
await st('CIRCLE start 3.99 and end 0 are fine; CIRCLE doesn\'t move the last point',
  ['CIRCLE(10,10),5,1,1,3.99,0', 'PRINT PEEK(200);PEEK(202)'], r => errs(r).length === 0 && /\n 128  96\nOK/.test(r.screen) || 'lp');

console.log('PAINT: shapes drawn with LINE and CIRCLE');
const paintCases = [
  [4, ['LINE(20,20)-(200,150),PSET,B'], [[100, 100]]],
  [4, ['CIRCLE(128,96),70', 'CIRCLE(128,96),30', 'LINE(40,40)-(220,160),PSET'], [[128, 40], [128, 96]]],
  [4, ['LINE(10,10)-(100,10),PSET', 'LINE(100,10)-(100,100),PSET', 'LINE(100,100)-(10,100),PSET', 'LINE(10,100)-(10,20),PSET'], [[50, 50]]],
  [0, ['CIRCLE(128,96),60', 'LINE(70,96)-(190,96),PSET', 'PSET(128,40,0)'], [[128, 70]]],
  [1, ['PCLS 2', 'CIRCLE(128,96),60,3', 'CIRCLE(100,96),20,4', 'PSET(150,96,4)', 'PSET(152,96,4)'], [[128, 96, 4, 3]]],
  [3, ['PCLS 1', 'CIRCLE(128,96),80,2,.6', 'LINE(128,20)-(140,180),PSET'], [[100, 96, 3, 2], [160, 96, 4]]],
  [2, ['CIRCLE(64,64),40', 'CIRCLE(190,120),50'], [[64, 64], [190, 120, 1, 1]]],
  [4, [], [[5, 5]]],
  [4, ['LINE(0,0)-(255,191),PSET', 'LINE(255,0)-(0,191),PSET', 'LINE(128,0)-(128,191),PSET'], [[30, 96], [128, 96]]],
  [1, ['PCLS 3', 'LINE(10,10)-(240,180),PRESET,B', 'CIRCLE(128,96),50'], [[20, 20, 2, 1], [128, 96, 3, 4]]],
  [4, ['CIRCLE(128,96),50'], [[128, 46]]],
  [4, ['LINE(50,50)-(150,150),PSET,B', 'LINE(100,50)-(100,60),PRESET'], [[120, 120]]],
];
let ci = 0;
for (const [m, draws, paints] of paintCases) {
  const g = new Gfx2(), L = [], want = [], run = runner(g, L, want);
  run(`PMODE ${m},1`, () => g.pmode(m, 1));
  if (!draws.some(d => d.startsWith('PCLS'))) run('PCLS', () => g.pcls());
  for (const d of draws) {
    let mm;
    if ((mm = d.match(/^PCLS (\d)$/))) run(d, () => g.pcls(+mm[1]));
    else if ((mm = d.match(/^CIRCLE\((\d+),(\d+)\),(\d+)(?:,(\d+))?(?:,([\d.]+))?$/))) run(d, () => g.circle(+mm[1], +mm[2], +mm[3], mm[4] && +mm[4], mm[5] && +mm[5]));
    else if ((mm = d.match(/^LINE\((\d+),(\d+)\)-\((\d+),(\d+)\),(PSET|PRESET)(?:,(B))?$/))) run(d, () => g.lineSt([+mm[1], +mm[2]], [+mm[3], +mm[4]], mm[5] === 'PSET', mm[6]));
    else if ((mm = d.match(/^PSET\((\d+),(\d+),(\d)\)$/))) run(d, () => g.pset(+mm[1], +mm[2], +mm[3]));
    else throw new Error(d);
  }
  for (const [x, y, c, b] of paints) {
    const parts = [c, b]; while (parts.length && parts[parts.length - 1] === undefined) parts.pop();
    run(`PAINT(${x},${y})` + parts.map(p => ',' + opt(p)).join(''), () => g.paint(x, y, c, b));
  }
  await same(`PAINT #${++ci} (PMODE ${m}): ${paints.map(p => `(${p})`).join(' ')} after ${draws.join(' : ') || 'PCLS'}`, L, g, want);
}
{
  const g = new Gfx2(), L = [], want = [], run = runner(g, L, want);
  run('PMODE 4,1', () => g.pmode(4, 1)); run('PCLS', () => g.pcls());
  for (let i = 0; i < 6; i++) { const x = rnd(256), y = rnd(192), r = 5 + rnd(60); run(`CIRCLE(${x},${y}),${r}`, () => g.circle(x, y, r)); }
  for (let i = 0; i < 6; i++) { const a = [rnd(256), rnd(192)], b = [rnd(256), rnd(192)]; run(`LINE(${a})-(${b}),PSET`, () => g.lineSt(a, b, true)); }
  for (let i = 0; i < 3; i++) { const x = rnd(256), y = rnd(192); run(`PAINT(${x},${y}),0,1`, () => g.paint(x, y, 0, 1)); run(`PAINT(${x},${y})`, () => g.paint(x, y)); }
  await same('PAINT on random circles and lines (PMODE 4), with paint ≠ border and back', L, g, want);
}
{
  const g = new Gfx2(), L = [], want = [], run = runner(g, L, want);
  run('PMODE 1,1', () => g.pmode(1, 1)); run('PCLS 1', () => g.pcls(1));
  for (let i = 0; i < 8; i++) { const x = rnd(256), y = rnd(192), r = 5 + rnd(60), c = 1 + rnd(4); run(`CIRCLE(${x},${y}),${r},${c}`, () => g.circle(x, y, r, c)); }
  for (let i = 0; i < 4; i++) { const x = rnd(256), y = rnd(192), c = 1 + rnd(4), b = 1 + rnd(4); run(`PAINT(${x},${y}),${c},${b}`, () => g.paint(x, y, c, b)); }
  run('PAINT(0,0),,3', () => g.paint(0, 0, undefined, 3));
  await same('PAINT on random colour circles (PMODE 1), leaking shapes, ",,3"', L, g, want);
}

for (const m of [4, 0, 3]) {
  const g = new Gfx2(), L = [], want = [], run = runner(g, L, want);
  run(`PMODE ${m},1`, () => g.pmode(m, 1)); run('PCLS', () => g.pcls());
  const n = m === 4 ? 30 : 20;
  for (let i = 0; i < n; i++) { const a = [rnd(256), rnd(192)], b = [a[0] + rnd(41) - 20, a[1] + rnd(41) - 20].map((v, j) => Math.max(0, Math.min(j ? 191 : 255, v))); run(`LINE(${a})-(${b}),PSET`, () => g.lineSt(a, b, true)); }
  for (let i = 0; i < 25; i++) { const x = rnd(256), y = rnd(192); run(`PSET(${x},${y},${m & 1 ? 2 : 1})`, () => g.pset(x, y, m & 1 ? 2 : 1)); }
  for (let i = 0; i < 2; i++) { const x = rnd(256), y = rnd(192), c = m & 1 ? 3 : 1, b = m & 1 ? 4 : 1; run(`PAINT(${x},${y}),${c},${b}`, () => g.paint(x, y, c, b)); }
  await same(`PAINT on a maze of short lines and dots (PMODE ${m})`, L, g, want);
}

console.log('PAINT: errors and syntax');
await st('PAINT(x,y),2, → ?SN; PAINT(x,y),9 → ?FC; PAINT x,y → ?SN; PAINT(x,y),,9 → ?FC',
  ['PAINT(10,10),2,', 'PAINT(10,10),9', 'PAINT 10,10', 'PAINT(10,10),,9'], r => errs(r).join() === 'SN,FC,SN,FC' || errs(r).join());
await st('PAINT(300,100) is clamped to x 255 (on the box: border 0 → nothing new); PAINT(10,192) is clamped to y 191 (on the border)',
  ['PMODE 4,1', 'PCLS', 'LINE(0,0)-(255,191),PSET,B', 'PAINT(300,100),1,0', 'PAINT(10,192)', 'PRINT PPOINT(100,100);PPOINT(255,100)'],
  r => errs(r).length === 0 && /\n 0  1\nOK/.test(r.screen) || errs(r).join());
await st('PAINT seed on the border paints nothing', ['PMODE 4,1', 'PCLS', 'PSET(10,10)', 'PAINT(10,10)', 'PRINT PPOINT(11,10);PPOINT(10,10)'], r => /\n 0  1\nOK/.test(r.screen) || 'seed');
await st('PAINT ?OM when the stack runs out (a comb of 128 columns, 600 bytes free)',
  ['DIM A(4850)', 'PMODE 4,1', 'PCLS', 'FOR I=0 TO 254 STEP 2:LINE(I,0)-(I,190),PSET:NEXT', 'PAINT(1,191)'], r => errs(r).join() === 'OM' || errs(r).join());
await st('…and the same comb with DIM A(4400) has room: no error, all filled',
  ['DIM A(4400)', 'PMODE 4,1', 'PCLS', 'FOR I=0 TO 254 STEP 2:LINE(I,0)-(I,190),PSET:NEXT', 'PAINT(1,191)', 'PRINT PPOINT(1,0);PPOINT(255,0)'], r => errs(r).length === 0 && /\n 1  1\nOK/.test(r.screen) || errs(r).join());

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
