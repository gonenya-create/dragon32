// בדיקות DRAW, GET ו-PUT (שלב 3, חלק 3): ה-ROM מול המודל שנכתב מהמפרט (gfxmodel-draw.mjs), ובדיקות שגיאה.
// הרצה: node rom2/tools/gfx-test-draw.mjs   (SEED=n לסדרה אחרת)
import { runRom } from './xr2.mjs';
import { GfxD } from './gfxmodel-draw.mjs';

let pass = 0, fail = 0;
const ok = (name, good, detail) => { if (good) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name + (detail ? '\n      ' + detail : '')); } };
let seed = +(process.env.SEED || 1982);
const rnd = n => { seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff; return seed % n; };
const pick = a => a[rnd(a.length)];
const tail = r => r.screen.split('\n').filter(l => l && l !== '@').slice(-4).join(' | ');
const w = (r, a) => r.ram[a] * 256 + r.ram[a + 1];
const hex = n => n.toString(16);

// נתוני מערך מספרי (שם של אות אחת) מתוך ה-RAM של ה-ROM
function aryData(ram, name) {
  let p = w({ ram }, 0x1d);
  const end = w({ ram }, 0x1f);
  while (p < end) {
    const size = w({ ram }, p + 2);
    if (ram[p] === name.charCodeAt(0) && ram[p + 1] === 0) return ram.subarray(p + 5 + 2 * ram[p + 4], p + size);
    p += size;
  }
  return null;
}
function cmpMem(r, g, from, to) {
  for (let a = from; a < to; a++) if (r.ram[a] !== g.mem[a]) return `first diff at $${hex(a)}: rom ${hex(r.ram[a])} model ${hex(g.mem[a])}`;
  return null;
}
// הודעות השגיאה על המסך, לפי הסדר
const errs = r => (r.screen.match(/\?[A-Z]{2} ERROR/g) || []).map(s => s.slice(1, 3));

// ---------- DRAW אקראי ----------
const VARS = { N: 17, Q: 3, 'S$': 'R5D5E3', 'T$': "XS$;L7 XS$;", 'U$': '', 'V$': 'BM+4,-2;C3G2' };
const VARLINE = 'N=17:Q=3:S$="R5D5E3":T$="XS$;L7 XS$;":U$="":V$="BM+4,-2;C3G2"';
function num(max) {
  const n = rnd(max + 1);
  if (rnd(8) === 0) return '=N;';
  if (rnd(10) === 0) return '=Q;';
  if (n >= 10 && rnd(6) === 0) { const s = String(n); return s[0] + ' ' + s.slice(1); }  // רווח בתוך מספר
  return String(n);
}
function cmd() {
  switch (rnd(16)) {
    case 0: case 1: case 2: case 3: case 4: return pick('UDLREFGH') + (rnd(4) ? num(40) : '');
    case 5: return `M${rnd(256)},${rnd(4) ? rnd(256) : '-' + rnd(20)}`;                 // מוחלט (גם y שלילי)
    case 6: return `M${pick(['+', '-'])}${num(40)},${pick(['', '+', '-'])}${num(40)}`; // יחסי
    case 7: return `M${rnd(100)},${pick(['+', '-'])}${rnd(30)}`;                        // סימן רק ב-y: עדיין מוחלט
    case 8: return pick(['B', 'N', 'BB', 'NN', 'BN', 'B N']);
    case 9: return 'A' + rnd(4);
    case 10: return 'S' + pick([0, 1, 2, 4, 4, 8, 12, rnd(63)]);
    case 11: return 'C' + rnd(9);
    case 12: return pick(['XS$;', 'XT$;', 'XU$;', 'XV$;']);
    case 13: return pick([';', "'", ' ', ' ;']);
    default: return pick('UDLREFGH') + num(20);
  }
}
function drawStr() {
  let s = '';
  // אות בלי מספר: אחריה חייבת לבוא אות (אחרת "U;" הוא ?FC)
  let bare = false;
  while (s.length < 60) {
    const c = cmd();
    if (bare && !/^[A-Z]/.test(c)) continue;
    s += c;
    bare = /^[UDLREFGH]$/.test(c);
    if (!bare && rnd(3) === 0) s += pick([';', ' ', "'"]);
    else if (bare && rnd(3) === 0) s += ' ';
  }
  return s;
}

console.log('DRAW: random strings against the model, all five PMODEs');
for (const m of [0, 1, 2, 3, 4]) for (let k = 0; k < 2; k++) {
  const g = new GfxD(), L = [VARLINE];
  g.pmode(m, 1); L.push(`PMODE ${m},1`);
  g.pcls(0); L.push('PCLS 0');
  for (let i = 0; i < 12; i++) {
    const s = drawStr();
    try { g.draw(s, VARS); } catch (e) { console.log("model error", e, s); throw e; } L.push(`DRAW "${s}"`);
  }
  const p = [rnd(256), rnd(192)];
  g.pset(...p); L.push(`PSET(${p})`);   // הצבע של C נשאר אחרי DRAW
  const r = await runRom(L, { timeout: 20, wallTimeout: 60000 });
  const bad = cmpMem(r, g, g.start, g.end);
  const st = `last (${w(r, 0xc7)},${w(r, 0xc9)}) fore ${r.ram[0xb2]} A${r.ram[0xe8]} S${r.ram[0xe9]}`;
  const want = `last (${g.lx},${g.ly}) fore ${g.fore} A${g.angle} S${g.scl}`;
  ok(`PMODE ${m} #${k + 1}: 12 random DRAWs match the model (page, last point, colour, angle, scale)`,
    !bad && st === want && !errs(r).length, `${bad || ''} rom ${st} model ${want} | ${tail(r)}`);
}

console.log('DRAW: fixed cases');
async function drawCase(name, mode, lines, modelFn) {
  const g = new GfxD(); g.pmode(mode, 1); g.pcls(0);
  const want = [];
  for (const f of modelFn) { try { f(g); } catch (e) { if (typeof e !== 'string') throw e; want.push(e); } }
  const r = await runRom([`PMODE ${mode},1`, 'PCLS 0', ...lines], { timeout: 20, wallTimeout: 60000 });
  const bad = cmpMem(r, g, g.start, g.end), got = errs(r);
  const st = `(${w(r, 0xc7)},${w(r, 0xc9)})`, wst = `(${g.lx},${g.ly})`;
  ok(name, !bad && got.join() === want.join() && st === wst, `${bad || ''} errors rom [${got}] model [${want}] last rom ${st} model ${wst} | ${tail(r)}`);
}
await drawCase('M10,-5 is absolute: y $FFFB clamps to 191; M+300 is ?FC', 4, ['DRAW "BM50,50M10,-5"', 'DRAW "M+300,0"'],
  [g => g.draw('BM50,50M10,-5'), g => g.draw('M+300,0')]);
await drawCase('M-60,-80 from (20,30) clamps at 0,0; R300 is ?FC; S62 R255 clamps to 255', 4,
  ['DRAW "BM20,30M-60,-80"', 'DRAW "R300"', 'DRAW "S62BM0,100R255D200"'],
  [g => g.draw('BM20,30M-60,-80'), g => g.draw('R300'), g => g.draw('S62BM0,100R255D200')]);
await drawCase('A1..A3 rotate U clockwise; S1 quarter, S8 double; scale and angle stay after DRAW', 4,
  ['DRAW "BM128,96A1U20A2U20A3U20A0S1U40S8L10"', 'DRAW "U5"'],
  [g => g.draw('BM128,96A1U20A2U20A3U20A0S1U40S8L10'), g => g.draw('U5')]);
await drawCase('N keeps the pen, B moves without drawing, NN and BB cancel', 1, ['DRAW "BM60,60NR30NU30NNR10BBD10BD20L5"'],
  [g => g.draw('BM60,60NR30NU30NNR10BBD10BD20L5')]);
await drawCase('C2 in PMODE 1 sets the foreground; a later PSET uses it', 1, ['DRAW "C2R30"', 'PSET(10,10)', 'DRAW "C7D10C0D10"', 'PSET(12,10)'],
  [g => g.draw('C2R30'), g => g.pset(10, 10), g => g.draw('C7D10C0D10'), g => g.pset(12, 10)]);
await drawCase('=var; arguments, X var; nesting, null X, spaces inside numbers', 3,
  ['N=12:A$="R=N;D 1 2;":B$="XA$;XA$;E4":C$=""', 'DRAW "BM9,9XB$; XC$; L=N;"'],
  [g => g.draw('BM9,9XB$; XC$; L=N;', { N: 12, 'A$': 'R=N;D 1 2;', 'B$': 'XA$;XA$;E4', 'C$': '' })]);

console.log('DRAW: errors (and what was drawn before them)');
const derr = [
  ['S63', 'FC'], ['A4', 'FC'], ['C9', 'FC'], ['R10U;', 'FC'], ['U-5', 'FC'], ['U256', 'FC'], ['R5XA$', 'FC'], ['X1;', 'FC'],
  ['M5', 'FC'], ['M5;6', 'FC'], ['D', ''], ['L4Z', 'FC'], ['U=A$;', 'TM'], ['XN;', 'TM'], ['=N;', 'FC'], ['U=M;', 'FC'],
];
for (let i = 0; i < derr.length; i += 4) {
  const part = derr.slice(i, i + 4);
  const vars = { N: 3, M: 300, 'A$': 'R2' };
  await drawCase(`DRAW ${part.map(p => `"${p[0]}"→${p[1] || 'ok'}`).join(' ')}`, 4,
    ['N=3:M=300:A$="R2"', ...part.map(p => `DRAW "${p[0]}"`)], part.map(p => g => g.draw(p[0], vars)));
}
{
  const r = await runRom(['DRAW 5', 'DRAW CHR$(117)+"5"', 'A$="XA$;":DRAW A$', 'DRAW "U5"+"R5"', 'PRINT PEEK(200);PEEK(202)'], { timeout: 20 });
  ok('DRAW 5 → ?TM; lowercase u → ?FC; endless X recursion → ?OM; a joined string draws', errs(r).join() === 'TM,FC,OM' && /\n 133  91\nOK/.test(r.screen), `[${errs(r)}] ${tail(r)}`);
}

// ---------- GET / PUT ----------
const ACTS = ['PSET', 'PRESET', 'AND', 'OR', 'NOT'];
function scribble(g, L, n) {
  for (let i = 0; i < n; i++) {
    const p1 = [rnd(256), rnd(192)], p2 = [rnd(256), rnd(192)], c = 1 + rnd(8);
    g.colorSt(c); g.lineSt(p1, p2, true); L.push(`COLOR ${c}:LINE(${p1})-(${p2}),PSET`);
  }
}
console.log('GET/PUT: round trips against the model');
for (const m of [0, 1, 2, 3, 4]) for (const bits of [false, true]) {
  const g = new GfxD(), L = [];
  g.pmode(m, 1); L.push(`PMODE ${m},1`); g.pcls(0); L.push('PCLS 0');
  L.push('DIM A(60),B(60)');
  const A = new Uint8Array(61 * 5), B = new Uint8Array(61 * 5);
  scribble(g, L, 10);
  const acts = [];
  for (let i = 0; i < 4; i++) {
    const w0 = 4 + rnd(40), h0 = 2 + rnd(30);
    const p1 = [rnd(256 - w0), rnd(192 - h0)], p2 = [p1[0] + w0, p1[1] + h0];
    const flip = rnd(2) ? [p2, p1] : [p1, p2];
    const arr = rnd(2) ? ['A', A] : ['B', B];
    g.getput(false, ...flip, arr[1], bits ? 'G' : undefined);
    L.push(`GET(${flip[0]})-(${flip[1]}),${arr[0]}${bits ? ',G' : ''}`);
    const q1 = [rnd(256 - w0), rnd(192 - h0)], q2 = [q1[0] + w0, q1[1] + h0];
    const act = bits ? ACTS[(i + m) % 5] : undefined;
    acts.push(act || 'bytes');
    g.getput(true, q1, q2, arr[1], act);
    L.push(`PUT(${q1})-(${q2}),${arr[0]}${act ? ',' + act : ''}`);
  }
  // PUT מהנקודה האחרונה (הנקודה הראשונה חסרה), עם @
  g.getput(true, null, [g.lx + 3, g.ly + 3], A, bits ? 'NOT' : undefined);
  L.push(`PUT@-(${g.lx + 3},${g.ly + 3}),A${bits ? ',NOT' : ''}`);
  const r = await runRom(L, { timeout: 30, wallTimeout: 60000 });
  const bad = cmpMem(r, g, g.start, g.end);
  const ra = aryData(r.ram, 'A'), rb = aryData(r.ram, 'B');
  const ab = !ra || !rb ? 'array missing' : [...A].findIndex((v, i) => v !== ra[i]) >= 0 ? 'array A differs' : [...B].findIndex((v, i) => v !== rb[i]) >= 0 ? 'array B differs' : null;
  ok(`PMODE ${m} ${bits ? 'bit mode' : 'byte mode'} (${acts.join(' ')}): page and arrays match the model`, !bad && !ab && !errs(r).length, `${bad || ''} ${ab || ''} | ${tail(r)}`);
}

console.log('GET/PUT: errors');
{
  // מערך קטן מדי: ?FC, ומה שכבר הועבר נשאר
  const g = new GfxD(); g.pmode(4, 1); g.pcls(0);
  const L = ['PMODE 4,1', 'PCLS 0', 'DIM A(2)'];
  scribble(g, L, 6);
  const A = new Uint8Array(15), want = [];
  for (const f of [() => g.getput(false, [0, 0], [255, 10], A), () => g.getput(true, [0, 100], [255, 110], A),
    () => g.getput(false, [16, 20], [200, 30], A, 'G'), () => g.getput(true, [16, 120], [200, 130], A, 'OR')])
    try { f(); } catch (e) { want.push(e); }
  L.push('GET(0,0)-(255,10),A', 'PUT(0,100)-(255,110),A', 'GET(16,20)-(200,30),A,G', 'PUT(16,120)-(200,130),A,OR');
  const r = await runRom(L, { timeout: 20 });
  const bad = cmpMem(r, g, g.start, g.end), ra = aryData(r.ram, 'A');
  ok('array too small → ?FC after a partial transfer (byte and bit mode), page and array match', !bad && want.join() === 'FC,FC,FC,FC' && errs(r).join() === want.join() && ra && [...A].every((v, i) => v === ra[i]), `${bad || ''} [${errs(r)}] model [${want}] | ${tail(r)}`);
}
{
  const r = await runRom(['DIM A$(5),B(5)', 'GET(0,0)-(8,8),A$', 'GET(0,0)-(8,8),A', 'PUT(0,0)-(8,8),Z'], { timeout: 20 });
  ok('string array / unknown array → ?FC', errs(r).join() === 'FC,FC,FC', `[${errs(r)}] ${tail(r)}`);
  const r2 = await runRom(['DIM B(5)', 'GET(0,0)-(8,8),B,X', 'PUT(0,0)-(8,8),B,G', 'PUT(0,0)-(8,8),B,PSET', 'GET(0,0)-(8,8),B,G'], { timeout: 20 });
  ok('GET needs G, PUT needs an action (?SN)', errs(r2).join() === 'SN,SN', `[${errs(r2)}] ${tail(r2)}`);
}
{
  const r = await runRom(['LINE(1,2)-(3,4),PSET', 'DIM A(9)', 'GET(50,60)-(70,80),A,G', 'PUT(5,6)-(20,30),A', 'PRINT PEEK(200);PEEK(202)'], { timeout: 20 });
  ok('GET/PUT do not change the last point', /\n 3  4\nOK/.test(r.screen), tail(r));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
