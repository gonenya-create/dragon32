// מחסנית "JUNGLE KING" (מלך הג'ונגל): המשחק הגדול השני של האפליקציה (גונן, 27.10.2026). תכנון: docs/DRAGON-GAME-JUNGLE.md
// BIG BONGO, מלך הקופים, גנב את קלטת הזהב ועלה לצמרת העץ הגדול. PIP מטפס מהשורשים: 40 מסכים בשבעה עולמות.
// סבב 1: המנוע, ועולמות 1 (שורשים) ו-2 (ביצות), 12 מסכים. סבב 2 (27.10): עולמות 3 (נהרות), 4 (כוורות) ו-5 (מערות), 30 מסכים. מראה של Dragon: ערכה של PMODE 3 לכל עולם ושחור, הכל מצויר ביד.
// שליטה: ◀ ▶ הליכה, ▲ ▼ טיפוס, FIRE קפיצה (על ליאנה: שחרור), P תפריט.
import { W, H, PALETTES, createGfx } from '../gfx.js';
import * as A from './king-art.js';
import { SCREENS } from './king-screens.js';

const OY = 10, T = 8, COLS = 32, ROWS = 21;
// ליאנה מתנדנדת בקביעות עד 43 מעלות לכל צד: בקצה התנופה היא מעל הגדה השנייה, ושם משחררים
const VAMP = 0.75;
const GRAV = 0.22, JUMP = -3.4, WALK = 1.1, CLIMB = 1.0, MAXF = 4, BOUNCE = -5.6, FALL_HURT = 50, WATER = OY + 18 * T;
const DIFF = [
  { name: 'EASY', spd: 0.75, rate: 1.4, time: 1.3, mult: 1 },
  { name: 'NORMAL', spd: 1, rate: 1, time: 1, mult: 2 },
  { name: 'HARD', spd: 1.25, rate: 0.7, time: 0.8, mult: 3 }
];
const WORLDS = [null, { pal: 1, name: 'ROOTS', first: 0 }, { pal: 0, name: 'SWAMPS', first: 6 }, { pal: 1, name: 'RIVERS', first: 12 }, { pal: 0, name: 'HIVES', first: 18 }, { pal: 0, name: 'CAVES', first: 24 }];
const ROUND_WORLDS = 5;   // סבב 2: חמישה עולמות, 30 מסכים
const SAVE = 'd32-king-save', DIFF_KEY = 'd32-king-diff';
const okDiff = d => (d === 0 || d === 1 || d === 2) ? d : 1;
const D = s => DIFF[okDiff(s.diff)];

// ---------- צבעים לפי עולם: ערכה 0 של PMODE 3 (ירוק, צהוב, כחול, אדום), ואחד מהם הוא הרקע ----------
// עולם 1 (שורשים): רקע כחול. עולם 2 (ביצות): רקע ירוק. מסך הפתיחה והמפה: כמו עולם 1
function colors(w) {
  const [G, Y, B, R] = PALETTES[0];
  const tape = { y: Y, r: R }, barrel = { y: Y, r: R }, mush = { r: R, y: Y }, log = { y: Y, r: R };
  if (w === 5) {   // המערות: רקע כחול כהה, והחושך הוא צבע הרקע. סלע באדום וצהוב, האור מהלפיד
    return {
      bg: B, txt: [Y, R, G], pip: { h: Y, b: R, s: R, p: G, e: B }, monkey: { f: G, c: Y, n: R, e: B }, barrel, mush, tape, tapeOff: { y: G, r: G }, log,
      snake: { s: G, e: Y, t: R }, croc: { k: Y, t: R, e: B }, frog: { k: G, t: Y, e: R }, mosq: { m: R, n: Y }, lily: { k: G, f: R }, splash: { c: Y },
      beetle: { k: G, h: Y, r: R }, bongo: { f: G, c: Y, n: R, e: B }, tile: { r: R, y: Y, g: G }, rope: [Y, G], water: G, wave: Y, vine: G, vineLeaf: Y,
      bat: { k: R, w: G, e: Y }, stone: { r: R, y: Y }, torch: { f: R, y: Y, r: G }, worm: { y: Y, g: G }, bear: { k: R, t: Y, e: G }
    };
  }
  if (w === 4) {   // הכוורות: רקע אדום כהה של תוך הכוורת, שעווה ודבש בצהוב
    return {
      bg: R, txt: [Y, G, B], pip: { h: Y, b: G, s: G, p: B, e: R }, monkey: { f: G, c: Y, n: B, e: R }, barrel: { y: Y, r: G }, mush: { r: G, y: Y },
      tape: { y: Y, r: G }, tapeOff: { y: B, r: B }, log: { y: Y, r: G }, snake: { s: G, e: Y, t: B }, croc: { k: G, t: Y, e: B }, frog: { k: G, t: Y, e: B },
      mosq: { m: Y, n: B }, lily: { k: Y, f: G }, splash: { c: Y }, beetle: { k: G, h: Y, r: B }, bongo: { f: G, c: Y, n: B, e: R },
      tile: { r: Y, y: G, g: B }, rope: [Y, G], water: Y, wave: G, vine: G, vineLeaf: Y, bee: { k: Y, s: B, w: G, e: R }, jar: { y: Y, r: G, b: B }, pot: { k: B, r: G }, honey: Y
    };
  }
  if (w === 3) {   // הנהרות: ערכה 1. רקע בז' של חול, מים בתכלת, עץ כתום וסגול
    const [Bf, Cy, Mg, Or] = PALETTES[1];
    return {
      bg: Bf, txt: [Or, Mg, Cy], pip: { h: Or, b: Mg, s: Mg, p: Cy, e: Bf }, monkey: { f: Mg, c: Or, n: Cy, e: Bf }, barrel: { y: Or, r: Mg }, mush: { r: Mg, y: Or },
      tape: { y: Or, r: Mg }, tapeOff: { y: Cy, r: Cy }, log: { y: Or, r: Mg }, snake: { k: Mg, t: Or, e: Bf }, croc: { k: Mg, t: Or, e: Cy }, frog: { k: Mg, t: Or, e: Cy },
      mosq: { m: Mg, n: Or }, lily: { k: Or, f: Mg }, splash: { c: Cy }, beetle: { k: Mg, h: Or, r: Cy }, bongo: { f: Mg, c: Or, n: Cy, e: Bf },
      tile: { r: Mg, y: Or, g: Cy }, rope: [Or, Mg], water: Cy, wave: Bf, vine: Mg, vineLeaf: Or, fish: { k: Or, f: Mg, e: Cy }, beaver: { k: Mg, t: Or, e: Bf }, falls: Cy, foam: Bf
    };
  }
  if (w === 2) return {
    bg: G, txt: [Y, R, B], pip: { h: Y, b: R, s: R, p: B, e: G }, monkey: { f: R, c: Y, n: B, e: G }, barrel, mush, tape, tapeOff: { y: B, r: B }, log,
    snake: { s: B, e: Y, t: R }, croc: { k: Y, t: R, e: B }, frog: { k: R, t: Y, e: B }, mosq: { m: R, n: Y }, lily: { k: Y, f: R }, splash: { c: Y },
    beetle: { k: B, h: Y, r: R }, bongo: { f: B, c: Y, n: R, e: G }, tile: { r: R, y: Y, g: B }, rope: [Y, R], water: B, wave: Y, leaf: B, leafEdge: Y, vine: B, vineLeaf: Y
  };
  return {
    bg: B, txt: [Y, R, G], pip: { h: Y, b: R, s: R, p: G, e: B }, monkey: { f: G, c: Y, n: R, e: B }, barrel, mush, tape, tapeOff: { y: G, r: G }, log,
    snake: { s: G, e: Y, t: R }, croc: { k: Y, t: R, e: B }, frog: { k: G, t: Y, e: R }, mosq: { m: R, n: Y }, lily: { k: G, f: R }, splash: { c: Y },
    beetle: { k: G, h: Y, r: R }, bongo: { f: G, c: Y, n: R, e: B }, tile: { r: R, y: Y, g: G }, rope: [Y, G], water: B, wave: Y, leaf: G, leafEdge: Y, vine: G, vineLeaf: Y
  };
}

// ---------- המפה ----------
const ENT = 'PTKSRMGVCFOLlQJANZDUHYXIWv';
function loadScreen(s, idx) {
  const sc = SCREENS[idx];
  // דמות שעומדת במים (תנין, בול עץ, עלה, השומר בביצות): מתחתיה מים
  const grid = sc.map.map(r => r.split('').map(ch => ch === 'R' ? '|' : 'COLlJA'.includes(ch) || (ch === 'G' && (sc.guard === 'croc' || sc.guard === 'whirl')) ? '~' : ENT.includes(ch) ? '.' : ch));
  // זורק החביות בשורה 0: יושב על מדף משלו בפינה למעלה, ש-PIP לא מגיע אליו (גונן, 27.10: כמו הגורילה ב-Donkey King)
  grid[0].forEach((ch, c) => { if (sc.map[0][c] === 'K') grid[0][c] = grid[0][c - 1] === '#' || grid[0][c + 1] === '#' ? '#' : '='; });
  const L = { idx, sc, grid, world: +sc.id[0], tapes: [], throwers: [], snakes: [], ropeSnakes: [], mush: [], vines: [], crocs: [], frogs: [],
    lilies: [], logs: [], swarms: [], barrels: [], guard: null, fx: [], t: 0, fish: [], beavers: [], raft: null, falls: sc.falls || [],
    bees: [], drips: [], sticky: [], lifts: [], jars: [], pots: [], sleep: 0, bats: [], stones: [], torches: [], worms: [], dark: !!sc.dark };
  let vi = 0, li = 0, fi = 0, ji = 0, zi = 0, ui = 0;
  sc.map.forEach((row, r) => row.split('').forEach((ch, c) => {
    const cx = c * T + 4, fy = OY + (r + 1) * T;
    if (ch === 'P') L.start = { x: cx, y: fy };
    else if (ch === 'T') L.tapes.push({ x: cx, y: OY + r * T + 6, got: false });
    else if (ch === 'K') L.throwers.push({ x: cx, y: r === 0 ? OY : fy, dir: sc.dir ?? -1, cd: 60, anim: 0 });
    else if (ch === 'S') { const [a, b] = span(grid, c, r + 1); L.snakes.push({ x: cx, y: fy, dir: 1, a: a * T + 8, b: b * T, f: 0 }); }
    else if (ch === 'R') { const [a, b] = ropeSpan(grid, c, r); L.ropeSnakes.push({ x: cx, y: OY + r * T, dir: 1, a: OY + a * T + 6, b: OY + (b + 1) * T - 2, top: OY + a * T, rest: 0, f: 0 }); }
    else if (ch === 'M') L.mush.push({ x: cx, y: fy, sq: 0 });
    else if (ch === 'V') L.vines.push({ px: cx, py: OY + r * T, len: (sc.vines || [])[vi++] || 72, amp: VAMP, ph: vi * 1.7 });
    else if (ch === 'C') L.crocs.push({ x: c * T, y: WATER, t: 0 });
    else if (ch === 'F') { const hop = (sc.frogHop || [])[fi++]; L.frogs.push({ x: cx, y: fy, a: hop ? hop[0] * T + 4 : cx - 16, b: hop ? hop[1] * T + 4 : cx, t: 0, dir: 1 }); }
    else if (ch === 'O') L.lilies.push({ x: cx, y: WATER, t: 0, sunk: 0 });
    else if (ch === 'L' || ch === 'l') { const b = (sc.logs || [])[li++] || [c - 3, c + 3]; L.logs.push({ x: cx, y: WATER, a: b[0] * T + 12, b: b[1] * T - 4, vx: sc.current || 0.4, drift: !!sc.current, sink: ch === 'l', t: 0, down: 0 }); }
    // עולם 3: דג קופץ, רפסודת חבית באשדות, ובונה שמכרסם את החבל שמעליו
    else if (ch === 'J') { const f = (sc.fish || [])[ji++] || [48, 56, 150]; L.fish.push({ x0: cx, x: cx, y: WATER + 8, dx: f[0], h: f[1], per: f[2], t: Math.round(f[2] * (ji * 0.37 % 1)) }); }
    else if (ch === 'A') L.raft = { x0: cx, x: cx, y: surface(grid, c), x1: (sc.raftEnd || 28) * T, vx: sc.raftV || 0.6, wait: 0 };
    // עולם 4: דבורה במסלול קבוע, מקור של טיפות דבש, מעלית שעווה, צנצנת דבש (אצל המלכה) ועציץ עשן
    else if (ch === 'Z') { const b = (sc.bees || [])[zi++] || [24, 8, 0.03]; L.bees.push({ bx: cx, by: OY + r * T + 4, x: cx, y: OY + r * T + 4, rx: b[0], ry: b[1], sp: b[2], a: zi * 1.3 }); }
    else if (ch === 'D') L.drips.push({ x: cx, y0: OY + r * T + 4, y: 0, vy: 0, t: 30 + (L.drips.length * 47) % 90, per: sc.drip || 160 });
    else if (ch === 'U') { const u = (sc.lifts || [])[ui++] || [r - 4, r, 0.5]; L.lifts.push({ x: cx, top: OY + u[0] * T, bot: OY + u[1] * T, y: OY + (r + 1) * T, vy: -u[2], sp: u[2], wait: 0 }); }
    else if (ch === 'H') L.jars.push({ x: cx, y: fy, got: false });
    else if (ch === 'Y') L.pots.push({ x: cx, y: fy, got: false });
    // עולם 5: עטלף תלוי, לפיד, תולעת זוהרת, ונטיף שנופל
    else if (ch === 'X') L.bats.push({ hx: cx, hy: OY + r * T, x: cx, y: OY + r * T, mode: 'hang', k: 0, cd: 0 });
    else if (ch === 'I') L.torches.push({ x: cx, y: fy, got: false });
    else if (ch === 'W') L.worms.push({ x: cx, y: fy });
    else if (ch === 'v') L.stones.push({ x: cx, hy: OY + r * T, y: OY + r * T, vy: 0, mode: 'hang', k: 0 });
    else if (ch === 'N') { const rc = [c, c - 1, c + 1].find(k => grid[r - 1] && grid[r - 1][k] === '|' || grid[r][k] === '|'); const r0 = grid[r][rc] === '|' ? r : r - 1; const [a, b] = ropeSpan(grid, rc, r0); L.beavers.push({ x: cx, y: fy, c: rc, a, b, chew: 0, cut: 0, f: 0 }); }
    else if (ch === 'Q') L.swarms.push({ bx: cx, by: OY + r * T, x: cx, y: OY + r * T });
    else if (ch === 'G') L.guard = sc.guard === 'beetle' ? { kind: 'beetle', x: cx - 10, bx: cx + 20, y: fy, dir: 1, side: 0, f: 0, turn: 0, hop: 0 }
      : sc.guard === 'bear' ? { kind: 'bear', x: cx, hx: cx, y: fy, mode: 'sleep', noise: 0, k: 0, dir: 1 }
      : sc.guard === 'queen' ? { kind: 'queen', x: cx, y: OY + r * T, hx: cx, hy: OY + r * T, t: 0, mode: 'hover', tx: cx }
      : sc.guard === 'whirl' ? { kind: 'whirl', x: cx, y: WATER, t: 0, R: sc.whirlR || 56, logs: [{ a: 0 }, { a: Math.PI }] } : { kind: 'croc', x: c * T, y: WATER, t: 0, bx: c * T };
  }));
  s.L = L;
  s.gateOpen = !sc.guard || sc.guard === 'croc' || sc.guard === 'whirl' || sc.guard === 'bear';
  s.torchMax = (sc.torch || 0) * 50; s.torch = s.torchMax;
  s.passes = 0;
  s.time = Math.round(sc.time * 50 * D(s).time);
  s.hurry = false;
  s.got = 0;
  s.p = { x: L.start.x, y: L.start.y, vx: 0, vy: 0, mode: 'walk', face: 1, anim: 0, fallY: L.start.y, vine: null, vd: 0, grabCd: 0, on: null };
  s.static = null;
  return L;
}
// כמה רחוק משתרע משטח (לנחשים): עמודות רצופות שיש מתחתיהן קרקע
function span(grid, c, r) {
  const top = (cc) => { const ch = (grid[r] || [])[cc]; return ch === '=' || ch === '#'; };
  let a = c, b = c;
  while (a > 0 && top(a - 1) && grid[r - 1][a - 1] !== '#') a--;
  while (b < COLS - 1 && top(b + 1) && grid[r - 1][b + 1] !== '#') b++;
  return [a, b];
}
// פני המים בעמודה (באשדות יש כמה גבהים): השורה העליונה של מים
function surface(grid, c) { for (let r = 0; r < ROWS; r++) if (grid[r][c] === '~') return OY + r * T; return WATER; }
function ropeSpan(grid, c, r) { let a = r, b = r; while (a > 0 && grid[a - 1][c] === '|') a--; while (b < ROWS - 1 && grid[b + 1][c] === '|') b++; return [a, b]; }
const col = x => Math.floor(x / T), row = y => Math.floor((y - OY) / T);
function tile(s, c, r) { if (c < 0 || c >= COLS || r >= ROWS) return '#'; if (r < 0) return '.'; return s.L.grid[r][c]; }
const isSolid = ch => ch === '#';
const isTop = ch => ch === '#' || ch === '=' || ch === 'h';
const isRope = ch => ch === '|';

// ---------- משטחים זזים (בולי עץ, עלי לוטוס, גב התנין, פטריות, חביות צפות) ----------
function platforms(s) {
  const L = s.L, out = [];
  for (const m of L.mush) out.push({ x0: m.x - 7, x1: m.x + 7, y: m.y - 9, o: m, kind: 'mush' });
  for (const l of L.logs) if (!l.down) out.push({ x0: l.x - 11, x1: l.x + 11, y: l.y - 3, o: l, kind: 'log', vx: l.vx });
  for (const p of L.lilies) if (!p.sunk) out.push({ x0: p.x - 6, x1: p.x + 6, y: p.y - 2, o: p, kind: 'lily' });
  for (const c of L.crocs) out.push({ x0: c.x + 2, x1: c.x + 15, y: c.y - 3, o: c, kind: 'croc' });
  const g = L.guard;
  if (g && g.kind === 'croc') out.push({ x0: g.x + 6, x1: g.x + (crocOpen(g) ? 112 : 132), y: g.y - 6, o: g, kind: 'bigcroc', vx: g.vx || 0 });
  for (const b of L.barrels) if (b.mode === 'float') out.push({ x0: b.x - 5, x1: b.x + 5, y: b.y - 8, o: b, kind: 'barrel', vx: b.vx });
  for (const u of L.lifts) out.push({ x0: u.x - 11, x1: u.x + 11, y: u.y, o: u, kind: 'lift', vy: u.vy });
  const r = L.raft; if (r && !r.wait) out.push({ x0: r.x - 13, x1: r.x + 13, y: r.y - 5, o: r, kind: 'raft', vx: r.vx });
  if (g && g.kind === 'whirl') for (const w of g.logs) out.push({ x0: w.x - 11, x1: w.x + 11, y: g.y - 3, o: w, kind: 'log', vx: w.vx || 0 });
  return out;
}
const crocOpen = g => g.kind === 'croc' ? (g.t % 140) > 90 : false;
const smallCrocOpen = c => (c.t % 180) > 110;

// ---------- הצעד של המשחק (פיזיקה וחיות) ----------
// inp = { left, right, up, down, fire } (fire = רק בפריים של הלחיצה). מחזיר אירוע: 'die' | 'exit' | 'secret' | null
function step(s, inp, snd) {
  const L = s.L, p = s.p, d = D(s);
  L.t++;
  if (s.time > 0) { s.time--; if (s.time === 0) { s.hurry = true; msg(s, 'HURRY UP!'); snd.tone(880, 200, 440); } }
  if (p.grabCd) p.grabCd--;
  if (p.landed) p.landed--;
  if (p.inv) p.inv--;
  const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
  if (dir) p.face = dir;
  const plats = platforms(s);
  let ev = null;

  if (p.mode === 'swing') {
    const v = p.vine, ox = p.sx, oy = p.sy;
    if (dir) v.amp = Math.max(0.5, Math.min(0.95, v.amp + 0.003 * dir * Math.sign(Math.cos(v.ph))));   // נדנוד: ◀ ▶ בכיוון התנופה מגדילים אותה
    const a = vineAngle(v);
    p.x = v.px + Math.sin(a) * p.vd; p.y = v.py + Math.cos(a) * p.vd + 14; p.sx = p.x; p.sy = p.y;
    p.face = Math.cos(v.ph) >= 0 ? 1 : -1;
    if (inp.fire) { p.mode = 'air'; p.vx = (p.x - ox) * 1.05; p.vy = (p.y - oy) * 1.05 - 0.6; p.fallY = p.y; p.grabCd = 18; p.vine = null; snd.tone(500, 60, 700); }
  } else if (p.mode === 'climb') {
    const c = col(p.x);
    if (inp.fire) { p.mode = 'air'; p.vy = -2.7; p.vx = dir * WALK; p.fallY = p.y; p.grabCd = 6; p.ropeJump = true; snd.tone(400, 50, 600); }
    else if (inp.up) {
      // עולים כל עוד הידיים על החבל, או שמעליהן השורש שהחבל תלוי ממנו. כשהרגליים מגיעות לשורש: עומדים עליו
      const ny = p.y - CLIMB, r = row(ny - 1), feet = tile(s, c, r), hands = tile(s, c, row(ny - 14));
      if (isTop(feet) && !isRope(feet)) { p.y = OY + r * T; p.mode = 'walk'; }
      else if ((isRope(feet) || isRope(hands)) && (isRope(hands) || isTop(hands) || isTop(tile(s, c, row(ny - 8))))) { p.y = ny; p.anim++; }
    } else if (inp.down) {
      const ny = p.y + CLIMB, r = row(ny - 1);
      if (isRope(tile(s, c, r)) || isRope(tile(s, c, row(ny - 14))) && !isTop(tile(s, c, r))) { p.y = ny; p.anim++; }
      else if (isTop(tile(s, c, r))) { p.y = OY + r * T; p.mode = 'walk'; }
      else { p.mode = 'air'; p.vy = 0; p.fallY = p.y; }
    }
  } else {
    // הליכה ואוויר
    const ground = p.mode === 'walk' ? support(s, p, plats) : null;
    if (p.mode === 'walk' && !ground) { p.mode = 'air'; p.vy = 0; p.fallY = p.y; }
    const sticky = 1;
    if (p.mode === 'walk') {
      const goo = honeyAt(s, p.x, p.y);
      p.vx = dir * WALK * sticky * (goo ? 0.45 : 1);
      if (dir) p.anim++;
      if (ground && ground.vx) p.x += ground.vx;
      if (ground && ground.kind === 'lily') ground.o.t++;
      if (ground && ground.kind === 'log' && ground.o.sink) ground.o.t++;
      if (inp.fire) { p.mode = 'air'; p.vy = JUMP * (goo ? 0.72 : 1); p.fallY = p.y; p.ropeJump = false; p.realJump = true; snd.tone(goo ? 200 : 300, 80, 600); }
      else if (inp.down && isRope(tile(s, col(p.x), row(p.y) + 1)) && Math.abs(p.x - (col(p.x) * T + 4)) <= 4) { p.mode = 'climb'; p.x = col(p.x) * T + 4; p.y = OY + (row(p.y) + 1) * T + 2; }
    } else {
      // באוויר: שליטה חלקית, ותנופה מהליאנה נשמרת
      if (Math.abs(p.vx) > WALK) p.vx *= 0.99; else p.vx = Math.max(-WALK, Math.min(WALK, p.vx + dir * 0.12));
    }
    if (inp.up && !p.grabCd && !(p.ropeJump && p.vy < 0) && (isRope(tile(s, col(p.x), row(p.y - 8))) || isRope(tile(s, col(p.x), row(p.y - 14)))) && (p.mode === 'walk' || p.ropeJump || freeRope(s, col(p.x), row(p.y - 14)))) { p.ropeJump = false; p.mode = 'climb'; p.x = col(p.x) * T + 4; p.vx = p.vy = 0; }
    if (p.mode !== 'climb') {
      // תזוזה לצדדים, וקירות עוצרים
      let nx = p.x + p.vx;
      for (let r = row(p.y - 15); r <= row(p.y - 1); r++) {
        if (isSolid(tile(s, col(nx - 4), r))) nx = (col(nx - 4) + 1) * T + 4;
        if (isSolid(tile(s, col(nx + 3), r))) nx = col(nx + 3) * T - 4;
      }
      p.x = Math.max(4, Math.min(W - 4, nx));
      if (p.mode === 'air') {
        p.vy = Math.min(MAXF, p.vy + GRAV);
        let ny = p.y + p.vy;
        if (p.vy < 0) {
          const hr = row(ny - 16);
          if (isSolid(tile(s, col(p.x - 3), hr)) || isSolid(tile(s, col(p.x + 3), hr))) { ny = OY + (hr + 1) * T + 16; p.vy = 0; }
        } else {
          // נחיתה: על אריח, או על משטח זז
          let land = null;
          for (let r = row(p.y); r <= row(ny); r++) {
            const ty = OY + r * T;
            if (ty > p.y && ty <= ny + 0.001 && (isTop(tile(s, col(p.x - 3), r)) || isTop(tile(s, col(p.x + 3), r)))) { land = { y: ty }; break; }
          }
          for (const pl of plats) if (pl.y >= p.y - 0.5 && pl.y <= ny + 0.001 && p.x + 3 >= pl.x0 && p.x - 3 <= pl.x1 && (!land || pl.y < land.y)) land = pl;
          if (land) {
            ny = land.y;
            if (land.kind === 'mush') { p.vy = BOUNCE; p.fallY = ny; land.o.sq = 8; p.realJump = false; snd.tone(200, 120, 900); ny -= 0.01; }
            else {
              p.mode = 'walk'; p.vy = 0; p.realJump = false; p.landed = 2;
              if (ny - p.fallY > FALL_HURT) { p.y = ny; return die(s, snd, 'OUCH!'); }
            }
          }
        }
        p.y = ny;
        // תפיסת ליאנה מתנדנדת
        if (!p.grabCd && p.mode === 'air') for (const v of L.vines) {
          const a = vineAngle(v), hx = p.x, hy = p.y - 14;
          for (let dd = v.len * 0.35; dd <= v.len; dd += 2) {
            if (Math.abs(v.px + Math.sin(a) * dd - hx) < 5 && Math.abs(v.py + Math.cos(a) * dd - hy) < 5) { p.mode = 'swing'; p.vine = v; p.vd = dd; p.x = v.px + Math.sin(a) * dd; p.y = v.py + Math.cos(a) * dd + 14; p.sx = p.x; p.sy = p.y; snd.tone(250, 40); break; }
          }
          if (p.mode === 'swing') break;
        }
      }
    }
  }
  // המפל (עולם 3): מי שנשאר במקום על חבל בתוך המפל, המים מורידים אותו. על מדף בתוך המפל הולכים לאט
  if (inFalls(L, p.x, p.y - 8)) {
    if (p.mode === 'climb' && !inp.up) {
      const ny = p.y + 0.8, c = col(p.x);
      if (isRope(tile(s, c, row(ny - 1))) || isRope(tile(s, c, row(ny - 14)))) p.y = ny;
      else if (isTop(tile(s, c, row(ny - 1)))) { p.y = OY + row(ny - 1) * T; p.mode = 'walk'; }
      else { p.mode = 'air'; p.vy = 0.5; p.fallY = p.y; }
    } else if (p.mode === 'walk') p.x -= p.vx * 0.45;
    else if (p.mode === 'air' && p.vy > 0) p.vy += 0.06;
  }
  // המערבולת (השומר של עולם 3) מושכת אליה את מי שבאוויר מעל המים
  if (L.guard && L.guard.kind === 'whirl' && p.mode === 'air' && Math.abs(p.x - L.guard.x) < L.guard.R + 24) p.vx += Math.sign(L.guard.x - p.x) * 0.035;
  // מים, ונפילה מחוץ למסך
  if (p.mode !== 'swing' && tile(s, col(p.x), row(p.y - 2)) === '~') { L.fx.push({ k: 'splash', x: p.x, y: surface(L.grid, col(p.x)) - 4, t: 20 }); return die(s, snd, 'SPLASH!'); }
  if (p.y > OY + ROWS * T + 24) return die(s, snd, 'OUCH!');
  // יציאה וסדק סודי
  for (const yy of [p.y - 12, p.y - 3]) {
    const ch = tile(s, col(p.x), row(yy));
    if (ch === 'E' && s.gateOpen) ev = 'exit';
    if (ch === 'c') ev = 'secret';
  }
  // חלקי הקלטת
  for (const j of L.jars) if (!j.got && Math.abs(j.x - p.x) < 8 && Math.abs(j.y - p.y) < 10) {
    j.got = true; s.score += 300; snd.tone(900, 80, 1300); fx(s, j.x, j.y - 10, '300');
    if (L.jars.every(k => k.got)) { s.gateOpen = true; msg(s, 'GATE OPEN!'); snd.tone(500, 300, 1000); }
  }
  for (const k of L.pots) if (!k.got && Math.abs(k.x - p.x) < 8 && Math.abs(k.y - p.y) < 10) { k.got = true; L.sleep = 360; msg(s, 'SLEEPY BEES'); snd.tone(200, 300, 120); }
  if (L.sleep) L.sleep--;
  if (s.torch > 0) s.torch--;   // הלפיד נשרף, והאור קטן
  for (const t of L.torches) if (!t.got && Math.abs(t.x - p.x) < 8 && Math.abs(t.y - p.y) < 12) { t.got = true; s.torch = s.torchMax; s.score += 50; snd.tone(600, 80, 900); fx(s, t.x, t.y - 12, 'TORCH'); }
  for (const tp of L.tapes) if (!tp.got && Math.abs(tp.x - p.x) < 8 && tp.y > p.y - 20 && tp.y < p.y + 4) { tp.got = true; s.got++; s.score += 250; snd.tone(1200, 60, 1600); fx(s, tp.x, tp.y, '250'); }

  if (!s.noEnemies && enemies(s, snd, d)) return 'die';
  movers(s, snd, d);
  return ev;
}
// חבל שתלוי חופשי (בלי שורש מתחתיו) אפשר לתפוס בקפיצה. חבל שעומד על שורש עולים רק כשעומדים מתחתיו, כדי שלא ידלגו על קומה
function freeRope(s, c, r) { if (!isRope(tile(s, c, r))) r = row(s.p.y - 8); let b = r; while (b < ROWS - 1 && isRope(tile(s, c, b + 1))) b++; return !isTop(tile(s, c, b + 1)); }
// דבש מתחת לרגליים: שלולית דבש (h), או כתם שטיפה השאירה
function honeyAt(s, x, y) { if (tile(s, col(x), row(y + 0.5)) === 'h' && Math.abs(y - (OY + row(y + 0.5) * T)) < 0.6) return true; return s.L.sticky.some(k => Math.abs(k.y - y) < 0.6 && Math.abs(k.x - x) < 9); }
// האור במערות (בפיקסלים של המסך): הלפיד מאיר פחות ופחות כשהוא נשרף. בלי לפיד רואים רק קרוב מאוד
const lightR = s => !s.L.dark ? 999 : s.torchMax ? 18 + 46 * (s.torch / s.torchMax) : 16;
const inFalls = (L, x, y) => L.falls.some(f => x >= f[0] * T && x < (f[1] + 1) * T && y >= OY + f[2] * T && y < OY + (f[3] + 1) * T);
function support(s, p, plats) {
  // מעלית שעווה קודמת לרצפה: כשהיא מתחילה לעלות מגובה המדף, PIP עולה איתה
  for (const pl of plats) if (pl.kind === 'lift' && Math.abs(p.y - pl.y) < 1.2 && p.x + 3 >= pl.x0 && p.x - 3 <= pl.x1) { p.y = pl.y; return pl; }
  const r = row(p.y + 0.5);
  if (Math.abs(p.y - (OY + r * T)) < 0.6 && (isTop(tile(s, col(p.x - 3), r)) || isTop(tile(s, col(p.x + 3), r)))) { p.y = OY + r * T; return { kind: 'tile' }; }
  for (const pl of plats) if (Math.abs(p.y - pl.y) < 1.2 && p.x + 3 >= pl.x0 && p.x - 3 <= pl.x1) { p.y = pl.y; return pl; }
  return null;
}
const vineAngle = v => v.amp * Math.sin(v.ph);
function msg(s, m) { s.msg = m; s.msgT = 90; }
function fx(s, x, y, text) { s.L.fx.push({ k: 'text', x, y, text, t: 40 }); }
function die(s, snd, why) { s.p.mode = 'hurt'; s.why = why; snd.tone(400, 500, 60); return 'die'; }
const hit = (p, x0, y0, x1, y1) => p.x + 3 > x0 && p.x - 3 < x1 && p.y - 1 > y0 && p.y - 15 < y1;

// עצמים שזזים לבד (גם כשהאויבים כבויים בבדיקה): ליאנות, בולי עץ, עלים, פטריות
function movers(s, snd, d) {
  const L = s.L;
  for (const v of L.vines) { v.ph += Math.sqrt(GRAV / v.len) * 0.9; if (s.p.vine !== v) v.amp += (VAMP - v.amp) * 0.01; }
  for (const l of L.logs) {
    if (l.down) { l.down--; if (!l.down) l.t = 0; continue; }
    l.x += l.vx;
    if (l.drift) { if (l.x > l.b || l.x < l.a) { l.down = 50; l.x = l.vx > 0 ? l.a : l.b; } }   // הזרם: בסוף הנהר הבול שוקע, וחוזר מההתחלה
    else if (l.x < l.a || l.x > l.b) { l.vx = -l.vx; l.x += l.vx * 2; }
    if (l.sink && l.t > 60) { l.down = 120; snd.tone(150, 200, 80); }
  }
  for (const pd of L.lilies) {
    if (pd.sunk) { pd.sunk--; if (!pd.sunk) pd.t = 0; continue; }
    if (pd.t > 45) { pd.sunk = 90; snd.tone(180, 150, 90); }
    else if (pd.t && !onPlat(s, pd)) pd.t = Math.max(0, pd.t - 1);
  }
  for (const m of L.mush) if (m.sq) m.sq--;
  for (const c of L.crocs) c.t++;
  for (const f of L.fx) f.t--;
  L.fx = L.fx.filter(f => f.t > 0);
  for (const u of L.lifts) {   // מעלית שעווה: עולה ויורדת, ועוצרת רגע בכל קצה
    if (u.wait) { if (!--u.wait) u.vy = u.y <= u.top ? u.sp : -u.sp; continue; }
    u.y += u.vy; if (u.y <= u.top) { u.y = u.top; u.wait = 50; u.vy = 0; } else if (u.y >= u.bot) { u.y = u.bot; u.wait = 50; u.vy = 0; }
  }
  for (const dr of L.drips) {   // טיפת דבש: נופלת מהתקרה, ובמקום שנחתה המשטח דביק לזמן מה
    if (!dr.y) { if (--dr.t <= 0) { dr.y = dr.y0; dr.vy = 0; } continue; }
    dr.vy = Math.min(3, dr.vy + 0.12); const ny = dr.y + dr.vy, c = col(dr.x);
    let land = null; for (let r = row(dr.y); r <= row(ny); r++) { const ty = OY + r * T; if (ty > dr.y && ty <= ny && isTop(tile(s, c, r))) { land = ty; break; } }
    if (land !== null) { L.sticky = L.sticky.filter(k => !(k.y === land && Math.abs(k.x - dr.x) < 8)); L.sticky.push({ x: dr.x, y: land, t: 420 }); dr.y = 0; dr.t = dr.per; snd.tone(90, 30); }
    else if (ny > OY + ROWS * T) { dr.y = 0; dr.t = dr.per; } else dr.y = ny;
  }
  for (const k of L.sticky) k.t--;
  L.sticky = L.sticky.filter(k => k.t > 0);
  const rf = L.raft;
  if (rf) {   // רפסודת החבית יורדת עם הזרם, ונופלת במדרגות של האשדות. בסוף היא נעלמת וחוזרת להתחלה
    if (rf.wait) { if (!--rf.wait) { rf.x = rf.x0; rf.y = surface(L.grid, col(rf.x0)); } }
    else { rf.x += rf.vx; const ty = surface(L.grid, col(rf.x)); rf.y += Math.max(-2, Math.min(2.5, ty - rf.y)); if (rf.x > rf.x1) { rf.wait = 90; L.fx.push({ k: 'splash', x: rf.x, y: rf.y - 4, t: 16 }); } }
  }
  const gw = L.guard;
  if (gw && gw.kind === 'whirl') { gw.t++; for (const w of gw.logs) { w.a += 0.011; const nx = gw.x + gw.R * Math.cos(w.a); w.vx = w.x === undefined ? 0 : nx - w.x; w.x = nx; } }
  if (s.L.guard && s.L.guard.kind === 'croc') { const g = s.L.guard, ox = g.x; g.t++; g.x = g.bx + Math.round(10 * Math.sin(g.t / 80)); g.vx = g.x - ox; }
}
const onPlat = (s, o) => s.p.mode === 'walk' && Math.abs(s.p.y - (o.y - 2)) < 1.5 && Math.abs(s.p.x - o.x) < 9;

// אויבים: חביות, נחשים, צפרדעים, יתושים, תנינים והשומרים. מחזיר true אם PIP נפגע
function enemies(s, snd, d) {
  const L = s.L, p = s.p;
  let hurt = false;
  // הקופים זורקים חביות
  for (const k of L.throwers) {
    if (k.anim) k.anim--;
    if (--k.cd <= 0) {
      k.cd = Math.round((s.L.sc.rate || 200) * d.rate * (s.hurry ? 0.5 : 1)); k.anim = 20;
      if (k.dir === 0) L.barrels.push({ x: s.L.sc.dropX || k.x, y: OY + 4, vx: 0, vy: 0, mode: 'drop', rot: 0 });
      else L.barrels.push({ x: k.x + k.dir * 8, y: k.y, vx: k.dir * 1.0 * d.spd, vy: 0, mode: 'roll', rot: 0, keep: true });
      snd.tone(160, 60);
    }
  }
  for (const b of L.barrels) {
    b.rot += Math.abs(b.vx) > 0 ? 0.25 : 0.15;
    if (b.mode === 'roll') {
      b.x += b.vx;
      const r = row(b.y + 0.5);
      if (isSolid(tile(s, col(b.x + Math.sign(b.vx) * 5), row(b.y - 4)))) {
        if (r >= ROWS - 1) b.gone = true; else { b.vx = -b.vx; }
      }
      if (!isTop(tile(s, col(b.x), r))) { b.mode = 'fall'; b.vy = 0.5; }
    } else if (b.mode === 'fall') {
      b.vy = Math.min(MAXF, b.vy + GRAV); const ny = b.y + b.vy;
      for (let r = row(b.y); r <= row(ny); r++) { const ty = OY + r * T; if (ty > b.y && ty <= ny && isTop(tile(s, col(b.x), r))) { b.y = ty; b.mode = 'roll'; b.vx = b.keep ? b.vx : (-b.vx || d.spd); b.keep = false; snd.tone(110, 40); break; } }
      if (b.mode === 'fall') b.y = ny;
      if (b.mode === 'fall' && tile(s, col(b.x), row(b.y - 2)) === '~') {
        if (s.L.sc.id === '2-5') { b.mode = 'float'; b.y = WATER + 2; b.vx = -0.3; b.life = 900; } else b.gone = true;
        L.fx.push({ k: 'splash', x: b.x, y: WATER - 4, t: 16 });
      }
      if (b.y > OY + ROWS * T + 10) b.gone = true;
    } else if (b.mode === 'drop') {
      b.y += 2.2 * d.spd; if (b.y > OY + 20 * T) b.gone = true;
    } else if (b.mode === 'float') {
      b.x += b.vx; if (tile(s, col(b.x + Math.sign(b.vx) * 6), row(WATER - 1)) === '#') b.vx = -b.vx;
      if (--b.life <= 0) b.gone = true;
    }
    if (b.mode !== 'float' && !b.gone) {
      if (hit(p, b.x - 4, b.y - 9, b.x + 4, b.y)) hurt = true;
      else if (!b.jumped && p.mode === 'air' && p.realJump && !s.hurry && Math.abs(b.x - p.x) < 9 && b.y - p.y > 1 && b.y - p.y < 26) { b.jumped = true; s.score += 100; fx(s, b.x, b.y - 14, '100'); snd.tone(900, 40); }
    }
  }
  L.barrels = L.barrels.filter(b => !b.gone);
  // נחשים
  for (const n of L.snakes) {
    n.x += n.dir * 0.45 * d.spd; n.f++;
    if (n.x < n.a || n.x > n.b) { n.dir = -n.dir; n.x += n.dir * 2; }
    if (hit(p, n.x - 7, n.y - 6, n.x + 7, n.y)) hurt = true;
  }
  // נחש על חבל: יורד ועולה, ובראש החבל נח קצת על השורש, ליד החבל. אז אפשר לטפס
  for (const n of L.ropeSnakes) {
    n.f++;
    if (n.rest) { n.rest--; if (hit(p, n.x + 5, n.top - 6, n.x + 19, n.top)) hurt = true; continue; }
    n.y += n.dir * 0.5 * d.spd;
    if (n.y > n.b) { n.dir = -1; n.y = n.b; }
    if (n.y < n.a) { n.dir = 1; n.y = n.a; n.rest = Math.round(130 / d.spd); }
    if (hit(p, n.x - 3, n.y - 6, n.x + 3, n.y + 6)) hurt = true;
  }
  // תנינים קטנים: הראש נושך כשהפה פתוח
  for (const c of L.crocs) if (smallCrocOpen(c) && hit(p, c.x + 15, c.y - 9, c.x + 24, c.y)) hurt = true;
  // צפרדעים קופצות
  for (const f of L.frogs) {
    f.t++;
    const cyc = f.t % 120;
    if (cyc === 80) f.from = f.x, f.to = f.x === f.a ? f.b : f.a;
    if (cyc >= 80 && f.from !== undefined) { const k = (cyc - 80) / 40; f.x = f.from + (f.to - f.from) * k; f.hop = Math.sin(k * Math.PI) * 14; if (cyc === 119) f.x = f.to; } else f.hop = 0;
    if (hit(p, f.x - 5, f.y - 5 - f.hop, f.x + 5, f.y - f.hop)) hurt = true;
  }
  // דבורים במסלולים קבועים. אחרי עציץ העשן הן ישנות ולא עוקצות
  for (const b of L.bees) {
    if (!L.sleep) { b.a += b.sp * d.spd; b.x = b.bx + b.rx * Math.cos(b.a); b.y = b.by + b.ry * Math.sin(b.a * (b.ry > b.rx ? 1 : 2)); }
    if (!L.sleep && Math.abs(b.x - p.x) < 7 && Math.abs(b.y - (p.y - 8)) < 9) hurt = true;
  }
  // עטלפים: תלויים בשקט עד שהאור של הלפיד מגיע אליהם, ואז מזנקים אל PIP וחוזרים
  const lr = lightR(s);
  for (const b of L.bats) {
    if (b.cd) b.cd--;
    if (b.mode === 'hang') { if (!b.cd && Math.hypot(b.x - p.x, (b.y - (p.y - 8)) * 2) < lr * 2) { b.mode = 'dive'; b.k = 0; b.tx = p.x; b.ty = p.y - 8; snd.tone(1500, 40, 2000); } }
    else if (b.mode === 'dive') { b.k += 0.022 * d.spd; const k = Math.min(1, b.k); b.x = b.hx + (b.tx - b.hx) * k; b.y = b.hy + (b.ty - b.hy) * Math.sin(k * Math.PI / 2) + Math.sin(k * 12) * 3; if (k >= 1) { b.mode = 'back'; b.k = 0; } }
    else { b.k += 0.015; const k = Math.min(1, b.k); b.x = b.tx + (b.hx - b.tx) * k; b.y = b.ty + (b.hy - b.ty) * k; if (k >= 1) { b.mode = 'hang'; b.cd = 120; b.x = b.hx; b.y = b.hy; } }
    if (b.mode !== 'hang' && Math.abs(b.x - p.x) < 8 && Math.abs(b.y - (p.y - 8)) < 8) hurt = true;
  }
  // נטיפים: כש-PIP עובר מתחת, הנטיף רועד רגע ונופל. אחר כך צומח מחדש
  for (const st of L.stones) {
    if (st.mode === 'hang') { if (Math.abs(st.x - p.x) < 14 && p.y > st.y) { st.mode = 'shake'; st.k = Math.round(22 / d.spd); snd.tone(80, 60); } }
    else if (st.mode === 'shake') { if (--st.k <= 0) { st.mode = 'fall'; st.vy = 0; } }
    else if (st.mode === 'fall') {
      st.vy = Math.min(MAXF, st.vy + GRAV); const ny = st.y + st.vy; let land = null;
      for (let r = row(st.y + 5); r <= row(ny + 5); r++) { const ty = OY + r * T; if (ty > st.y + 5 && ty <= ny + 5 && isTop(tile(s, col(st.x), r))) { land = ty; break; } }
      if (land !== null || ny > OY + ROWS * T) { st.mode = 'gone'; st.k = 240; L.fx.push({ k: 'splash', x: st.x, y: (land || ny) - 4, t: 14 }); snd.tone(60, 80); } else st.y = ny;
      if (hit(p, st.x - 3, st.y, st.x + 3, st.y + 5)) hurt = true;
    } else if (--st.k <= 0) { st.mode = 'hang'; st.y = st.hy; }
  }
  // הדוב הישן (השומר של עולם 5): הליכה לידו עושה רעש, ועמידה במקום מרגיעה. קפיצה ונחיתה רועשות. רעש גדול מדי מעיר אותו
  const br = L.guard;
  if (br && br.kind === 'bear') {
    const near = Math.abs(p.x - br.x) < 110 && Math.abs(p.y - br.y) < 40;
    if (br.mode === 'sleep') {
      if (near) { if (p.mode === 'walk' && p.vx) br.noise += 1.5 * d.spd; else if (p.mode === 'walk') br.noise -= 2.2; if (p.mode === 'walk' && p.landed) br.noise += 22; }
      else br.noise -= 1;
      br.noise = Math.max(0, br.noise);
      if (br.noise > 60) { br.mode = 'awake'; br.k = 170; br.noise = 0; msg(s, 'GRRR!'); snd.tone(70, 400, 50); }
    } else if (br.mode === 'awake') {
      br.dir = Math.sign(p.x - br.x) || br.dir; br.x += br.dir * 1.05 * d.spd;
      if (--br.k <= 0) br.mode = 'home';
      if (hit(p, br.x - 13, br.y - 9, br.x + 13, br.y)) hurt = true;
    } else { br.dir = Math.sign(br.hx - br.x); br.x += br.dir * 0.8; if (Math.abs(br.x - br.hx) < 1) { br.x = br.hx; br.mode = 'sleep'; } }
  }
  // מלכת הדבורים: מרחפת למעלה, מסמנת את המקום של PIP, וצוללת אליו. אחרי שלוש צנצנות השער נפתח
  const q = L.guard;
  if (q && q.kind === 'queen') {
    q.t++;
    if (q.mode === 'hover') { q.x = q.hx + 40 * Math.sin(q.t / 60); q.y = q.hy + 4 * Math.sin(q.t / 15); if (q.t % Math.round(200 / d.spd) === 0) { q.mode = 'aim'; q.tx = p.x; q.ty = p.y - 8; q.k = 0; snd.tone(700, 120, 900); } }
    else if (q.mode === 'aim') { if (++q.k > 40) { q.mode = 'dive'; q.k = 0; q.sx = q.x; q.sy = q.y; } }
    else if (q.mode === 'dive') { q.k += 0.02 * d.spd; const k = Math.min(1, q.k); q.x = q.sx + (q.tx - q.sx) * k; q.y = q.sy + (q.ty - q.sy) * Math.sin(k * Math.PI / 2); if (k >= 1) { q.mode = 'back'; q.k = 0; } }
    else if (q.mode === 'back') { q.k += 0.015; const k = Math.min(1, q.k); q.x = q.tx + (q.hx - q.tx) * k; q.y = q.ty + (q.hy - q.ty) * k; if (k >= 1) { q.mode = 'hover'; q.t = 1; } }
    if (Math.abs(q.x - p.x) < 11 && Math.abs(q.y - (p.y - 8)) < 11) hurt = true;
  }
  // דגים קופצים בקשת מהמים
  for (const f of L.fish) {
    f.t++; const k = (f.t % f.per) / 56;
    if (k < 1) { f.x = f.x0 + f.dx * k; f.y = WATER + 2 - f.h * Math.sin(Math.PI * k); if (k > 0.05 && k < 0.95 && hit(p, f.x - 7, f.y - 7, f.x + 7, f.y)) hurt = true; if (f.t % f.per === 1) L.fx.push({ k: 'splash', x: f.x0, y: WATER - 4, t: 12 }); }
    else { f.x = f.x0; f.y = WATER + 8; }
  }
  // בונים (לא פוגעים): מי שמטפס על החבל של הבונה, הבונה מכרסם, ואחרי רגע החבל נקרע. אחר כך הוא צומח בחזרה
  for (const b of L.beavers) {
    b.f++;
    if (b.cut) { if (!--b.cut) { for (let r = b.a; r <= b.b; r++) L.grid[r][b.c] = '|'; stat = null; b.chew = 0; } continue; }
    const on = p.mode === 'climb' && col(p.x) === b.c && row(p.y - 8) >= b.a - 1 && row(p.y - 8) <= b.b + 1;
    if (on) { b.chew++; if (b.chew % 12 === 0) snd.tone(120 + (b.chew % 24) * 4, 20); } else b.chew = Math.max(0, b.chew - 2);
    if (b.chew > (L.sc.chew || 90) / d.spd) {
      for (let r = b.a; r <= b.b; r++) L.grid[r][b.c] = '.'; stat = null; b.cut = 360; snd.tone(300, 150, 80); msg(s, 'SNAP!');
      if (on) { p.mode = 'air'; p.vy = 0; p.fallY = p.y; p.grabCd = 20; }
    }
  }
  // נחילי יתושים
  for (const q of L.swarms) {
    q.x = q.bx + 24 * Math.sin(L.t / 90); q.y = q.by + 10 * Math.sin(L.t / 50);
    if (Math.abs(q.x - p.x) < 9 && Math.abs(q.y - (p.y - 8)) < 12) hurt = true;
  }
  // השומרים
  const g = L.guard;
  if (g && g.kind === 'beetle') {
    g.f++;
    if (g.turn) {   // בקיר: החבית עוצרת, והחיפושית קופצת מעליה לצד השני
      g.turn--; const k = 1 - g.turn / 30; g.x = g.from + (g.to - g.from) * k; g.hop = Math.sin(k * Math.PI) * 22;
      if (!g.turn) g.hop = 0;
    } else {
      g.bx += g.dir * 0.9 * d.spd; g.x = g.bx - g.dir * 30;
      if (g.bx < 26 || g.bx > W - 26) { g.dir = -g.dir; g.turn = 30; g.from = g.x; g.to = g.bx - g.dir * 30; snd.tone(90, 80); }
    }
    const bx = g.bx;
    const side = Math.sign(bx - p.x);
    if (g.side && side && side !== g.side && !s.gateOpen && p.y > OY + 16 * T && p.mode !== 'climb') {   // נספר רק כש-PIP למטה, בדרך של החבית (גם בקפיצה מעליה)
       s.passes++; snd.tone(600 + s.passes * 100, 80); fx(s, p.x, p.y - 24, s.passes + '/3'); if (s.passes >= (s.L.sc.passes || 3)) { s.gateOpen = true; msg(s, 'GATE OPEN!'); snd.tone(500, 300, 1000); } }
    if (side) g.side = side;
    if (hit(p, bx - 6, g.y - 11, bx + 6, g.y) || hit(p, g.x - 9, g.y - 7 - g.hop, g.x + 9, g.y - g.hop)) hurt = true;
  }
  if (g && g.kind === 'croc' && crocOpen(g) && hit(p, g.x + 112, g.y - 12, g.x + 136, g.y)) hurt = true;
  if (hurt && !p.inv) { die(s, snd, 'OUCH!'); return true; }
  return false;
}

// ---------- שמירה ----------
const loadSave = () => { try { return JSON.parse(localStorage.getItem(SAVE)); } catch (e) { return null; } };
const writeSave = s => { try { localStorage.setItem(SAVE, JSON.stringify({ v: 1, diff: okDiff(s.diff), world: s.world, lives: s.lives, score: s.score, tapes: s.tapes, sub: s.sub || 0 })); } catch (e) {} };
const clearSave = () => { try { localStorage.removeItem(SAVE); } catch (e) {} };
const finalScore = s => s.score * D(s).mult;

function newGame(s) {
  Object.assign(s, { world: 1, lives: 3, score: 0, tapes: 0, sub: 0, nextLife: 10000 });
  startWorld(s);
}
function startWorld(s) {
  s.idx = WORLDS[s.world].first;
  writeSave(s);
  s.mode = 'map'; s.t = 0;
}
function startScreen(s) {
  loadScreen(s, s.idx);
  s.mode = 'intro'; s.t = 0;
}

// ---------- ציור, בסגנון PMODE 3 אמיתי (גונן, 27.10) ----------
// הכל מצויר על משטח של 128 פיקסלים רחבים, ואז נמתח פי 2 לרוחב. בכל מסך רק ארבעה צבעים של ערכה 0, ואחד מהם הוא הרקע. אין שחור.
// הפיזיקה נשארת ב-256 פיקסלים: מיקום על המסך x נהיה x/2 בציור.
const LW = 128;
let off = null, lg = null, stat = null, statKey = '';
function L() { if (!lg) { off = document.createElement('canvas'); lg = createGfx(off); } return lg; }
function flush(g) { g.ctx.imageSmoothingEnabled = false; g.ctx.drawImage(off, 0, 0, LW, H, 0, 0, W, H); }
const lx = x => Math.round(x / 2);
// דמות: מרכז על המסך (cx) ורגליים (fy); או פינה שמאלית עליונה על המסך (sx, sy)
function sprC(l, rows, cx, fy, cols, flip) { l.sprite(rows, Math.round(cx / 2 - rows[0].length / 2), Math.round(fy - rows.length), cols, flip, 1); }
function sprAt(l, rows, sx, sy, cols, flip) { l.sprite(rows, lx(sx), Math.round(sy), cols, flip, 1); }

// המשטחים בסגנון העדין (גונן, 27.10: "הכל גס וגדול מדי"; המידות כמו ב-Donkey King על ה-Dragon): קווים ברוחב פיקסל,
// ורוב השטח נשאר רקע. שורש: קו אור צהוב, שפה אדומה, שני שורשים דקים קלועים, ושורשונים שמשתלשלים. ענף בביצה: זרד דק עם עלים.
// גוש (גדה, קיר הפיר): קו מתאר ומרקם דליל, לא מילוי מלא.
function drawStatic(s) {
  const key = s.L.sc.id;
  if (stat && statKey === key) return stat;
  const cv = document.createElement('canvas'); cv.width = LW; cv.height = H;
  const ctx = cv.getContext('2d');
  const px = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); };
  const w = s.L.world, C = colors(w), TC = C.tile, g = s.L.grid;
  const at = (c, r) => (r < 0) ? '.' : (r >= ROWS || c < 0 || c >= COLS) ? '#' : g[r][c];
  const top = ch => ch === '=' || ch === '#';
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, LW, H);
  // שורש או ענף דק לאורך אריח אחד (4 פיקסלים רחבים), y = ראש האריח
  const thin = (c, r) => {
    const y = OY + r * T, l = top(at(c - 1, r)) || c === 0, rr = top(at(c + 1, r)) || c === COLS - 1;
    for (let i = 0; i < 4; i++) {
      const x = c * 4 + i;
      if (w === 4) {   // מדף שעווה: שתי שורות שעווה ומתחתן שרשרת של תאי חלה קטנים, וטיפות דבש
        px(x, y, x % 7 === 2 ? TC.y : TC.r); px(x, y + 1, TC.r);
        const m = x % 6; if (m === 0 || m === 3) { px(x, y + 2, TC.r); px(x, y + 4, TC.r); } else if (m === 1 || m === 2) px(x, y + 3, TC.r); else px(x, y + 5, TC.r);
        if (x % 11 === 5) { const n = 1 + (x % 3); for (let j = 1; j <= n; j++) px(x, y + 5 + j, TC.r); }
      } else if (w === 1 || w === 5) {
        px(x, y, x % 9 === 3 ? TC.g : TC.y); px(x, y + 1, TC.r);
        const k = Math.sin(x / 2.2), a1 = Math.round(1.5 + 1.5 * k), a2 = Math.round(1.5 - 1.5 * k);
        px(x, y + 2 + a1, TC.r); px(x, y + 2 + a2, TC.r);
        if (x % 5) px(x, y + 5, TC.r);
        if (x % 13 === 7) { const n = 2 + (x % 3); for (let j = 1; j <= n; j++) px(x, y + 5 + j, TC.r); px(x, y + 6 + n, TC.y); }
      } else {
        px(x, y, TC.y); px(x, y + 1, TC.r); if ((x + 1) % 3) px(x, y + 2, TC.r);
        if (x % 11 === 5) { px(x, y + 3, TC.r); px(x - 1, y + 4, TC.y); px(x + 1, y + 4, TC.y); px(x, y + 5, TC.y); }
        if (x % 7 === 2 && r > 0) { px(x, y - 1, TC.r); px(x + 1, y - 2, TC.y); }
      }
    }
    const endH = w === 1 || w === 5 || w === 4 ? 6 : 3;
    if (!l) for (let k = 0; k < endH; k++) px(c * 4, y + k, TC.r);   // קצה מסוקס
    if (!rr) for (let k = 0; k < endH; k++) px(c * 4 + 3, y + k, TC.r);
  };
  // גוש: קו מתאר בצדדים החשופים, ומרקם דליל בפנים
  const mass = (c, r) => {
    const y0 = OY + r * T, upOpen = !top(at(c, r - 1)) && at(c, r - 1) !== 'c', lOpen = !(at(c - 1, r) === '#' || at(c - 1, r) === 'c'), rOpen = !(at(c + 1, r) === '#' || at(c + 1, r) === 'c');
    for (let j = 0; j < T; j++) for (let i = 0; i < 4; i++) {
      const x = c * 4 + i, y = y0 + j;
      if (upOpen && j === 0) px(x, y, TC.y);
      else if ((upOpen && j === 1) || (lOpen && i === 0) || (rOpen && i === 3)) px(x, y, TC.r);
      else if ((x + y * 2) % 9 === 0 && y % 2) px(x, y, TC.r);
      else if ((x * 5 + y * 3) % 29 === 0) px(x, y, TC.y);
    }
  };
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const ch = g[r][c], x = c * 4, y = OY + r * T;
    if (ch === '#') {
      // קרקע של שורה אחת (רצפת השורשים): שורש דק כמו כל קומה. אחרת: גוש
      if (r === ROWS - 1 && !top(at(c, r - 1))) thin(c, r); else mass(c, r);
    } else if (ch === '=') thin(c, r);
    else if (ch === 'h') {   // שלולית דבש: משטח שאפשר לעמוד עליו, דביק
      for (let i = 0; i < 4; i++) { const xx = x + i; px(xx, y + ((xx >> 1) % 2), TC.r); px(xx, y + 1, TC.r); px(xx, y + 2, TC.r); if (xx % 3) px(xx, y + 3, TC.r); if (xx % 7 === 3) for (let j = 4; j < 7; j++) px(xx, y + j, TC.r); }
    }
    else if (ch === '|') {
      for (let k = 0; k < T; k++) { px(x + 1, y + k, C.rope[0]); if ((y + k) % 4 === 0) px(x + ((y + k) % 8 ? 2 : 0), y + k, C.rope[1]); }
    } else if (ch === 'c') {
      mass(c, r);
      for (let k = 1; k < 8; k++) px(x + 1 + (k % 2), y + k, TC.r);   // הסדק: רמז קטן
    } else if (ch === '~') {
      ctx.fillStyle = C.water; ctx.fillRect(x, y + (at(c, r - 1) === '~' ? 0 : 1), 4, T);
    }
  }
  if (w === 2) for (let c = 0; c < COLS; c++) for (let r = 1; r < ROWS; r++) if (g[r][c] === '#' && !top(g[r - 1][c]) && c % 3 === 1) { for (let k = 1; k < 6 + (c % 3); k++) px(c * 4 + 1, OY + r * T - k, C.tile.y); px(c * 4 + 1, OY + r * T - 7 - (c % 3), C.tile.r); }   // קני סוף דקים
  stat = cv; statKey = key;
  return cv;
}

function drawPlay(g, s) {
  const l = L(), Lv = s.L, p = s.p, C = colors(Lv.world);
  l.ctx.drawImage(drawStatic(s), 0, 0);
  // מים חיים: קו גלים צהוב
  if (Lv.world === 2 || Lv.world === 3) for (let x = 0; x < LW; x++) { const sy = surface(Lv.grid, col(x * 2)); if (tile(s, col(x * 2), row(sy + 1)) !== '~') continue; if (x % 3) l.rect(x, sy + 1 + Math.round(Math.sin((x * 2 + Lv.t * (Lv.sc.current ? 2 : 1)) / 6)), 1, 1, C.wave); }
  // יציאה: חץ מהבהב, ושער סגור עד שהשומר מנוצח
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (Lv.grid[r][c] === 'E' && (Lv.grid[r - 1] || [])[c] !== 'E' && Lv.grid[r][c - 1] !== 'E') {
    const x = c * 4 + 4, y = OY + r * T;
    if (s.gateOpen) { const b = (Lv.t >> 3) % 2 ? C.txt[0] : C.txt[1]; l.rect(x, y - 1, 1, 11, b); for (let k = 1; k < 4; k++) { l.rect(x - k, y - 1 + k, 1, 1, b); l.rect(x + k, y - 1 + k, 1, 1, b); } }
    else { for (let k = 0; k < 8; k += 2) l.rect(x - 4 + k, y, 1, 16, C.txt[1]); l.rect(x - 4, y + 7, 8, 1, C.txt[1]); }
  }
  // ליאנות מתנדנדות
  for (const v of Lv.vines) {
    const a = vineAngle(v), ex = v.px + Math.sin(a) * v.len, ey = v.py + Math.cos(a) * v.len;
    for (let t = 0; t <= 1; t += 1 / v.len) l.rect(lx(v.px + (ex - v.px) * t), Math.round(v.py + (ey - v.py) * t), 1, 1, C.vine);
    for (let t = 0.15; t < 0.95; t += 0.12) { const x = lx(v.px + (ex - v.px) * t), y = Math.round(v.py + (ey - v.py) * t), sd = (t * 9 | 0) % 2 ? 1 : -1; l.rect(x + sd, y, 1, 1, C.vineLeaf); }
    for (let k = -4; k <= 4; k++) { l.rect(lx(v.px) + k, v.py - 2, 1, 1, C.tile.y); l.rect(lx(v.px) + k, v.py - 1, 1, 1, C.tile.r); }   // הענף שהליאנה תלויה ממנו
  }
  // המפל: פסים של מים נופלים, והחבלים שבתוכו מעליהם
  for (const f of Lv.falls) {
    const x0 = f[0] * 4, x1 = (f[1] + 1) * 4, y0 = OY + f[2] * T, y1 = OY + (f[3] + 1) * T;
    for (let x = x0; x < x1; x++) for (let y = y0; y < y1; y++) { const k = (y - Lv.t * 2 + x * 7) % 12; if ((x % 3 === 0 && k < 7) || (x % 3 === 1 && k === 3)) l.rect(x, y, 1, 1, x % 3 ? C.foam : C.falls); }
    for (let r = f[2]; r <= f[3]; r++) for (let c = f[0]; c <= f[1]; c++) if (Lv.grid[r][c] === '|') for (let k = 0; k < T; k++) l.rect(c * 4 + 1, OY + r * T + k, 1, 1, C.rope[0]);
    for (let x = x0 - 2; x < x1 + 2; x++) if ((x + (Lv.t >> 2)) % 3) l.rect(x, y1 + ((x + (Lv.t >> 1)) % 2), 1, 1, C.foam);   // קצף בתחתית
  }
  const gw = Lv.guard;
  if (gw && gw.kind === 'whirl') {   // המערבולת: ספירלה שמסתובבת, ושני בולי עץ שמקיפים אותה
    for (let i = 0; i < 70; i++) { const a = i * 0.32 - Lv.t * 0.08, r = 2 + i * 0.6; const x = lx(gw.x) + Math.round(Math.cos(a) * r / 2), y = WATER + 4 + Math.round(Math.sin(a) * r / 6); if (y > WATER) l.rect(x, y, 1, 1, i % 4 ? C.foam : C.tile.r); }
    for (const w of gw.logs) if (w.x !== undefined) sprC(l, A.LOG, w.x, gw.y, C.log);
  }
  for (const m of Lv.mush) sprC(l, m.sq ? A.MUSH_SQ : A.MUSH, m.x, m.y, C.mush);
  // עולם 4: כתמי דבש, טיפות, מעליות, צנצנות, עציצים, דבורים והמלכה
  for (const k of Lv.sticky) for (let i = -3; i <= 3; i++) if (k.t > 60 || Lv.t % 4 < 2) { l.rect(lx(k.x) + i, k.y - 1, 1, 1, C.honey); if (i % 3 === 0) l.rect(lx(k.x) + i, k.y + 2, 1, 2, C.honey); }
  for (const dr of Lv.drips) { l.rect(lx(dr.x), dr.y0 - 4, 1, 2 + (dr.t < 30 ? 1 : 0), C.honey); if (dr.y) sprC(l, A.DROP, dr.x, dr.y, { y: C.honey }); }
  for (const u of Lv.lifts) {
    for (let y = u.top - 12; y < u.y; y += 2) l.rect(lx(u.x), y, 1, 1, C.tile.y);   // חוט השעווה
    for (let i = -5; i <= 5; i++) { l.rect(lx(u.x) + i, u.y, 1, 1, C.tile.r); l.rect(lx(u.x) + i, u.y + 1, 1, 1, i % 2 ? C.tile.y : C.tile.r); if (Math.abs(i) < 4) l.rect(lx(u.x) + i, u.y + 2, 1, 1, C.tile.r); }
  }
  for (const j of Lv.jars) if (!j.got) sprC(l, A.JAR, j.x, j.y, C.jar);
  for (const k of Lv.pots) if (!k.got) sprC(l, A.SMOKE_POT, k.x, k.y, C.pot);
  for (const b of Lv.bees) { sprC(l, A.BEE[Lv.sleep ? 0 : (Lv.t >> 1) % 2], b.x, b.y + 3, C.bee, Math.sin(b.a) > 0); if (Lv.sleep && (Lv.t >> 4) % 2) l.rect(lx(b.x) + 3, b.y - 5, 2, 1, C.txt[0]); }
  if (gw && gw.kind === 'queen') { sprC(l, A.QUEEN[(Lv.t >> 2) % 2], gw.x, gw.y + 6, C.bee, gw.x < (gw.tx || gw.x)); if (gw.mode === 'aim' && Lv.t % 6 < 3) { l.rect(lx(gw.tx) - 3, gw.ty + 9, 7, 1, C.txt[1]); } }
  // עולם 5: תולעים, לפידים, נטיפים, עטלפים והדוב
  for (const w of Lv.worms) sprC(l, A.WORM, w.x, w.y, C.worm);
  for (const t of Lv.torches) if (!t.got) sprC(l, A.TORCH[(Lv.t >> 3) % 2], t.x, t.y, C.torch);
  for (const st of Lv.stones) if (st.mode !== 'gone') sprC(l, A.STALAC, st.x + (st.mode === 'shake' ? (Lv.t % 4 < 2 ? 1 : -1) : 0), st.y + 5, C.stone);
  for (const b of Lv.bats) { if (b.mode === 'hang') sprC(l, A.BAT_HANG, b.x, b.y + 5, C.bat); else sprC(l, A.BAT_FLY[(Lv.t >> 2) % 2], b.x, b.y + 2, C.bat); }
  if (gw && gw.kind === 'bear') { sprC(l, A.BEAR[gw.mode === 'sleep' ? 0 : 1], gw.x, gw.y, C.bear, gw.dir < 0); if (gw.mode === 'sleep') { const z = (Lv.t >> 3) % 12; l.text('Z', lx(gw.x) + 6 + (z >> 2), gw.y - 14 - z, C.txt[2]); if (gw.noise > 35 && Lv.t % 10 < 5) l.text('!', lx(gw.x) - 2, gw.y - 18, C.txt[1]); } }
  for (const f of Lv.fish) if (f.y < WATER + 4) sprC(l, A.FISH[(Lv.t >> 3) % 2], f.x, f.y, C.fish, f.dx < 0);
  for (const b of Lv.beavers) sprC(l, A.BEAVER[b.chew > 0 && (Lv.t >> 2) % 2 ? 1 : 0], b.x, b.y, C.beaver, b.x > b.c * T + 4);
  if (Lv.raft && !Lv.raft.wait) sprC(l, A.RAFT, Lv.raft.x, Lv.raft.y + 1, C.barrel);
  for (const tp of Lv.tapes) if (!tp.got) sprC(l, A.TAPE, tp.x, tp.y + 2 + ((Lv.t >> 4) % 2), C.tape);
  for (const lg2 of Lv.logs) if (!lg2.down || (lg2.down > 100 && lg2.down % 4 < 2)) sprC(l, A.LOG, lg2.x, lg2.y + (lg2.sink && lg2.t > 40 ? 1 : 0), C.log);
  for (const pd of Lv.lilies) if (!pd.sunk) sprC(l, A.LILY, pd.x + (pd.t > 25 && Lv.t % 4 < 2 ? 2 : 0), pd.y, C.lily);
  for (const c of Lv.crocs) sprAt(l, A.CROC[smallCrocOpen(c) ? 1 : 0], c.x, c.y - (smallCrocOpen(c) ? 5 : 4), C.croc);
  const gd = Lv.guard;
  if (gd && gd.kind === 'croc') {
    const open = crocOpen(gd), x0 = lx(gd.x), x1 = lx(gd.x + 112);
    for (let x = x0; x < x1; x++) { const k = x - x0; for (let r = 0; r < 5; r++) l.rect(x, gd.y - 6 + r, 1, 1, r === 4 ? C.croc.t : C.croc.k); if (k % 4 < 2) l.rect(x, gd.y - 7, 1, 1, C.croc.k); if (k % 8 === 3) l.rect(x, gd.y - 4, 1, 1, C.croc.t); }
    sprAt(l, A.BIG_CROC_HEAD[open ? 1 : 0], gd.x + 112, gd.y - (open ? 7 : 6), C.croc);
    for (let k = 0; k < 6; k++) l.rect(x0 - 1 - k, gd.y - 3 + (k % 2), 1, 2, C.croc.k);   // זנב
    for (let i = 0; i < 4; i++) { const fx2 = x0 + 7 + i * 14 + (Math.sin(Lv.t / 8 + i) > 0 ? 1 : 0); l.rect(fx2, gd.y - 1, 2, 2, C.croc.k); }
  }
  for (const f of Lv.frogs) sprC(l, A.FROG[f.hop ? 1 : 0], f.x, f.y - f.hop, C.frog, f.to < f.from);
  for (const k of Lv.throwers) sprC(l, A.MONKEY[k.anim ? 1 : 0], k.x, k.y, C.monkey, k.dir > 0);
  for (const n of Lv.snakes) { if (Lv.world === 3) sprC(l, A.BEAVER[(n.f >> 3) % 2], n.x, n.y, C.beaver, n.dir < 0); else sprC(l, A.SNAKE[(n.f >> 4) % 2], n.x, n.y, C.snake, n.dir < 0); }
  for (const n of Lv.ropeSnakes) { if (n.rest) sprC(l, A.SNAKE[(n.f >> 4) % 2], n.x + 12, n.top, C.snake); else sprC(l, A.SNAKE_UP, n.x, n.y + 6, C.snake, n.dir > 0); }
  for (const q of Lv.swarms) for (let i = 0; i < 5; i++) { const a = Lv.t / 9 + i * 1.3; sprAt(l, A.MOSQ[(Lv.t >> 2) % 2], q.x + Math.cos(a) * 7 - 2, q.y + Math.sin(a * 1.3) * 5, C.mosq); }
  if (gd && gd.kind === 'beetle') { sprC(l, A.BIG_BARREL, gd.bx, gd.y, C.barrel, !gd.turn && (gd.f >> 3) % 2 === 0); sprC(l, A.BEETLE, gd.x, gd.y - gd.hop, C.beetle, gd.turn ? gd.to < gd.from : gd.dir < 0); }
  for (const b of Lv.barrels) sprC(l, A.BARREL[Math.floor(b.rot) % 2], b.x, b.y + (b.mode === 'float' ? 2 : 0), C.barrel, b.vx < 0);
  // PIP
  if (s.mode !== 'dying' || s.t % 6 < 4) {
    let rows = A.PIP.stand, flip = p.face < 0, fy = p.y;
    if (s.mode === 'dying') rows = A.PIP.hurt;
    else if (p.mode === 'climb') { rows = A.PIP.climb[(p.anim >> 3) % 2]; flip = false; fy = p.y + 1; }
    else if (p.mode === 'swing') { rows = A.PIP.swing; fy = p.y + 1; }
    else if (p.mode === 'air') rows = A.PIP.jump;
    else if (p.vx) rows = A.PIP.walk[(p.anim >> 2) % 4];
    if (!(p.inv && Lv.t % 4 < 2)) sprC(l, rows, p.x, fy, C.pip, flip);
  }
  for (const f of Lv.fx) {
    if (f.k === 'text') l.text(f.text, lx(f.x), Math.round(f.y - (40 - f.t) / 3), C.txt[0], 'center');
    else sprC(l, A.SPLASH, f.x, f.y - (20 - f.t) / 4, C.splash);
  }
  if (Lv.dark) darkness(l, s, C);
  drawHud(l, s, C);
  if (s.msgT > 0) { const w = s.msg.length * 6 + 4; l.rect(64 - w / 2, 86, w, 11, C.bg); l.text(s.msg, 64, 88, (s.msgT >> 3) % 2 ? C.txt[0] : C.txt[1], 'center'); }
  if (s.paused) drawPause(l, s, C);
  flush(g);
}
// החושך במערות: מכסים בצבע הרקע כל מה שמחוץ לאור (הלפיד של PIP, תולעים זוהרות, והחץ של היציאה). בשוליים פס מנוקד
function darkness(l, s, C) {
  const Lv = s.L, p = s.p, lights = [{ x: p.x, y: p.y - 8, r: lightR(s) }];
  for (const w of Lv.worms) lights.push({ x: w.x, y: w.y - 4, r: 22 + Math.sin((Lv.t + w.x) / 20) * 2 });
  for (const t of Lv.torches) if (!t.got) lights.push({ x: t.x, y: t.y - 6, r: 10 });
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (Lv.grid[r][c] === 'E' && Lv.grid[r][c - 1] !== 'E' && (Lv.grid[r - 1] || [])[c] !== 'E') lights.push({ x: c * T + 8, y: OY + r * T + 6, r: 12 });
  for (let y = 0; y < 180; y++) {
    const spans = [];
    for (const g of lights) { const dy = y - g.y; if (Math.abs(dy) >= g.r + 4) continue; const h = Math.sqrt(Math.max(0, (g.r + 4) * (g.r + 4) - dy * dy)) / 2, hi = Math.sqrt(Math.max(0, g.r * g.r - dy * dy)) / 2; spans.push([g.x / 2 - h, g.x / 2 + h, g.x / 2 - hi, g.x / 2 + hi]); }
    let x = 0;
    spans.sort((a, b) => a[0] - b[0]);
    for (const sp of spans) { const a = Math.max(0, Math.floor(sp[0])); if (a > x) l.rect(x, y, a - x, 1, C.bg); x = Math.max(x, Math.ceil(sp[1])); }
    if (x < LW) l.rect(x, y, LW - x, 1, C.bg);
    for (const sp of spans) for (let xx = Math.floor(sp[0]); xx < Math.ceil(sp[1]); xx++) { if (xx >= sp[2] && xx <= sp[3]) continue; if (spans.some(o => o !== sp && xx >= o[2] && xx <= o[3])) continue; if ((xx + y) % 2) l.rect(xx, y, 1, 1, C.bg); }
  }
}
// שורת המצב: ספרות זעירות (3×5) בשורה התחתונה, כמו ב-Donkey King. למעלה יושב זורק החביות
function tiny(l, str, x, y, color, align = 'left') {
  const w = str.length * 4 - 1; let cx = align === 'right' ? x - w + 1 : x;
  for (const ch of str) { const rows = A.TINY[ch]; if (rows) l.sprite(rows, cx, y, { y: color }, false, 1); cx += 4; }
}
function drawHud(l, s, C) {
  l.rect(0, 180, LW, H - 180, C.bg);
  for (let i = 0; i < Math.min(5, s.lives); i++) l.sprite(A.PIP.life, 1 + i * 5, 185, C.pip, false, 1);
  tiny(l, s.L.sc.id, 28, 185, C.txt[1]);
  for (let i = 0; i < 3; i++) l.sprite(A.TAPE, 44 + i * 7, 186, i < s.got ? C.tape : C.tapeOff, false, 1);
  tiny(l, String(s.score).padStart(6, '0'), 70, 185, C.txt[0]);
  const sec = Math.ceil(s.time / 50);
  tiny(l, s.hurry ? 'HURRY' : 'T ' + sec, LW - 1, 185, s.hurry || sec <= 10 ? C.txt[1] : C.txt[0], 'right');
}
function drawPause(l, s, C) {
  l.rect(6, 28, 116, 134, C.bg); l.rect(6, 28, 116, 1, C.txt[0]); l.rect(6, 161, 116, 1, C.txt[0]);
  if ((s.page || 0) === 0) { l.text('PAUSED', 64, 32, C.txt[1], 'center', 2); drawTree(l, s, C, 50, 104); }
  else {
    l.text('HOW TO PLAY', 64, 34, C.txt[1], 'center');
    ['ARROWS: WALK, CLIMB', 'FIRE: JUMP', 'ON A VINE, FIRE', 'LETS GO', '', 'REACH THE ARROW', 'AT THE TOP.', '3 TAPE PIECES', 'IN EVERY SCREEN.'].forEach((t, i) => l.text(t, 64, 50 + i * 10, i < 4 ? C.txt[0] : C.txt[2], 'center'));
  }
  l.text('LR: PAGE  P: PLAY', 64, 152, C.txt[2], 'center');
}
// מפת העץ: שבעה עולמות מלמטה למעלה, ו-PIP בעולם הנוכחי
const WNAMES = ['ROOTS', 'SWAMPS', 'RIVERS', 'HIVES', 'CAVES', 'BRANCHES', 'TREETOP'];
function drawTree(l, s, C, top, bot) {
  const cx = 64, T0 = colors(1).tile;
  for (let y = top; y <= bot; y++) for (let x = cx - 4; x <= cx + 3; x++) l.rect(x, y, 1, 1, (x + (y >> 2)) % 4 === 0 ? T0.y : T0.r);
  for (let i = 0; i < 7; i++) {
    const w = 7 - i, y = Math.round(top + 3 + i * ((bot - top - 6) / 6)), left = i % 2 === 0, done = w < s.world, here = w === s.world;
    for (let k = 0; k < 10; k++) l.rect(left ? cx - 5 - k : cx + 4 + k, y + 3 - (k >> 2), 1, 1, C.txt[2]);
    l.text(WNAMES[w - 1], left ? cx - 14 : cx + 14, y - 1, done ? C.txt[0] : here ? C.txt[1] : C.txt[2], left ? 'right' : 'left');
    if (here) l.sprite(A.PIP.life, cx - 2, y - 1, colors(1).pip, false, 1);
  }
}
const TITLE_C = () => colors(1);
function drawTitle(g, s) {
  const l = L(), C = TITLE_C(), [Y, R, G2] = C.txt;
  l.clear(C.bg);
  const pg = s.titleP || 0;
  if (pg === 0) {
    // העץ, BIG BONGO בצמרת עם קלטת הזהב, ו-PIP מטפס על ליאנה
    for (let y = 92; y < 112; y++) for (let x = 102; x < 116; x++) l.rect(x, y, 1, 1, (x + (y >> 2)) % 4 === 0 ? Y : R);
    for (let k = 0; k < 6; k++) { l.rect(100 - k, 111 - k % 2, 3, 1, R); l.rect(115 + k, 111 - k % 2, 3, 1, R); }   // שורשים
    for (let y = -16; y <= 16; y++) for (let x = -24; x <= 24; x++) { const d = x * x / 576 + y * y / 256; if (d < 1) l.rect(108 + x, 80 + y, 1, 1, d > 0.7 && (x + y) % 3 === 0 ? Y : G2); }
    l.sprite(A.BONGO, 95, 33, C.bongo, false, 2);
    l.sprite(A.TAPE, 122, 50, C.tape, false, 1);
    l.text('JUNGLE', 46, 12, Y, 'center', 2); l.text('KING', 46, 32, R, 'center', 3);
    ['BIG BONGO HAS', 'STOLEN THE', 'GOLDEN TAPE.'].forEach((t, i) => l.text(t, 46, 62 + i * 9, G2, 'center'));
    for (let y = 0; y < 112; y++) { const xx = 88 + Math.round(Math.sin(y / 9)); l.rect(xx, y, 1, 1, G2); if (y % 8 === 3) l.rect(xx - 1, y, 1, 1, Y); }
    l.sprite(A.PIP.climb[(s.t >> 4) % 2], 84, 92 - ((s.t >> 2) % 40), C.pip, false, 1);
  } else if (pg === 1) {
    l.text('THE STORY', 64, 10, R, 'center', 2);
    ['BIG BONGO, KING OF', 'THE MONKEYS, TOOK', 'THE GOLDEN TAPE TO', 'THE TOP OF THE', 'GREAT TREE.', '', 'PIP IS A SMALL', 'EXPLORER WITH A', 'BIG HAT. 7 WORLDS.', 'CLIMB AND BRING', 'IT BACK!'].forEach((t, i) => l.text(t, 64, 30 + i * 8, i < 5 ? Y : i < 9 ? G2 : R, 'center'));
  } else if (pg === 2) {
    l.text('HOW TO PLAY', 64, 10, R, 'center', 2);
    ['ARROWS: WALK, CLIMB', 'FIRE: JUMP', 'ON A VINE, FIRE', 'LETS GO', 'P: MAP AND HELP', '', 'JUMP OVER', 'THE BARRELS!'].forEach((t, i) => l.text(t, 64, 32 + i * 10, i < 5 ? Y : R, 'center'));
  } else {
    l.text('MEET THE JUNGLE', 64, 8, R, 'center');
    const W1 = colors(1), W2 = colors(2);
    const who = [[A.PIP.stand, W1.pip, 'PIP'], [A.BONGO, W1.bongo, 'BONGO'], [A.MONKEY[0], W1.monkey, 'MONKEY'], [A.BARREL[0], W1.barrel, 'BARREL'],
      [A.SNAKE[0], W1.snake, 'SNAKE'], [A.CROC[0], { ...W2.croc, k: G2 }, 'CROC'], [A.FROG[0], { ...W2.frog, k: G2 }, 'FROG'], [A.MUSH, W1.mush, 'BOING!']];
    who.forEach(([rows, cols, name], i) => { const cx = [22, 64, 106][i % 3], fy = 34 + Math.floor(i / 3) * 23; l.sprite(rows, Math.round(cx - rows[0].length / 2), fy - rows.length, cols, false, 1); l.text(name, cx, fy + 2, Y, 'center'); });
    l.text('+ A GUARD IN EVERY', 64, 92, G2, 'center'); l.text('WORLD...', 64, 101, G2, 'center');
  }
  if (s.save) {
    if (s.save.world > ROUND_WORLDS) { l.text(s.soon ? 'STILL GROWING...' : 'WORLD ' + s.save.world + ' SOON', 64, 122, R, 'center'); l.text('YOUR GAME IS SAVED', 64, 136, Y, 'center'); }
    else { if ((s.t >> 4) % 2) l.text('FIRE: GO ON', 64, 120, R, 'center', 2); l.text('WORLD ' + s.save.world + ', ' + DIFF[okDiff(s.save.diff)].name, 64, 138, Y, 'center'); }
  } else {
    if ((s.t >> 4) % 2) l.text('PRESS FIRE', 64, 120, R, 'center', 2);
    l.text('LR: ' + DIFF[okDiff(s.diff)].name, 64, 138, s.diff === 2 ? R : Y, 'center');
  }
  l.text('HIGH ' + s.high + '  DOWN: MORE', 64, 150, G2, 'center');
  if (s.save) l.text('P: NEW GAME', 64, 163, Y, 'center');
  l.text('(C) 2026 GONEN YAROM', 64, 182, R, 'center');
  flush(g);
}
function drawAsk(g, s) {
  const l = L(), C = TITLE_C(), [Y, R, G2] = C.txt;
  l.clear(C.bg);
  l.text('NEW GAME?', 64, 26, R, 'center', 2);
  l.text('YOUR SAVE ON', 64, 60, Y, 'center'); l.text('WORLD ' + s.save.world + ' WILL BE LOST', 64, 70, Y, 'center');
  l.text('LR: ' + DIFF[okDiff(s.diff)].name, 64, 92, s.diff === 2 ? R : G2, 'center');
  if (s.askT > 30 && (s.askT >> 4) % 2) l.text('FIRE: YES, NEW GAME', 64, 120, R, 'center');
  l.text('UP: NO, KEEP SAVE', 64, 138, Y, 'center');
  flush(g);
}
function drawMap(g, s) {
  const l = L(), C = TITLE_C();
  l.clear(C.bg);
  l.text('THE GREAT TREE', 64, 6, C.txt[0], 'center');
  for (let y = -8; y <= 8; y++) for (let x = -22; x <= 22; x++) { const d = x * x / 484 + y * y / 64; if (d < 1) l.rect(64 + x, 26 + y, 1, 1, d > 0.7 && (x + y) % 3 === 0 ? C.txt[0] : C.txt[2]); }
  l.sprite(A.BONGO, 58, 12, C.bongo, false, 1);
  drawTree(l, s, C, 34, 156);
  l.text('WORLD ' + s.world + ': ' + WNAMES[s.world - 1], 64, 166, C.txt[1], 'center');
  if (s.t > 30 && (s.t >> 4) % 2) l.text('FIRE: GO', 64, 178, C.txt[0], 'center');
  flush(g);
}
function drawCard(g, s) {
  const l = L(), C = colors(s.L.world), sc = s.L.sc;
  l.clear(C.bg);
  l.text('WORLD ' + s.L.world + ': ' + WNAMES[s.L.world - 1], 64, 46, C.txt[2], 'center');
  l.text(sc.id, 64, 62, C.txt[1], 'center', 3);
  l.text(sc.name, 64, 94, C.txt[0], 'center');
  l.text('TIME ' + Math.ceil(s.time / 50) + '  LIVES ' + s.lives, 64, 114, C.txt[2], 'center');
  l.sprite(A.PIP.stand, 60, 134, C.pip, false, 1);
  flush(g);
}
function drawEnd(g, s) {
  const l = L(), C = colors(Math.min(ROUND_WORLDS, s.world || 1)), [Y, R, G2] = C.txt;
  l.clear(C.bg);
  if (s.mode === 'clear') {
    l.text(s.secretGot ? 'SECRET!' : 'WELL DONE!', 64, 36, Y, 'center', 2);
    if (s.secretGot) l.text('+1 LIFE  +1000', 64, 58, R, 'center');
    l.text('TAPE PIECES ' + s.got + '/3', 64, 76, G2, 'center');
    l.text('TIME BONUS ' + s.bonusShown, 64, 90, G2, 'center');
    l.text('SCORE ' + s.score, 64, 116, R, 'center');
  } else if (s.mode === 'over') {
    l.text('GAME OVER', 64, 44, R, 'center', 2);
    l.text('SCORE ' + s.score, 64, 84, Y, 'center');
    if (D(s).mult !== 1) l.text(D(s).name + ' X' + D(s).mult + ' = ' + finalScore(s), 64, 100, R, 'center');
    l.text('YOUR WORLD IS SAVED', 64, 124, G2, 'center');
  } else {
    l.text('WELL DONE, PIP!', 64, 26, Y, 'center');
    ['YOU CLIMBED ROOTS,', 'SWAMPS, RIVERS,', 'HIVES AND CAVES.', '', 'THE BRANCHES ARE', 'STILL GROWING...'].forEach((t, i) => l.text(t, 64, 44 + i * 10, i < 3 ? Y : G2, 'center'));
    l.text('SCORE ' + s.score, 64, 112, R, 'center');
    if (D(s).mult !== 1) l.text(D(s).name + ' X' + D(s).mult + ' = ' + finalScore(s), 64, 124, R, 'center');
    l.text('SAVED FOR WORLD ' + (ROUND_WORLDS + 1), 64, 140, G2, 'center');
  }
  if (s.mode !== 'clear' && s.t > 50 && (s.t >> 4) % 2) l.text('FIRE: TITLE', 64, 164, Y, 'center');
  flush(g);
}

// ---------- המחסנית ----------
export default {
  title: 'JUNGLE KING',
  fireLabel: 'JUMP',
  buttons: ['left', 'up', 'down', 'right', 'fire', 'pause'],
  help: {
    he: ['הסיפור: BIG BONGO, מלך הקופים, גנב את קלטת הזהב ועלה איתה לצמרת העץ הגדול. PIP, חוקר קטן עם כובע חקר, מטפס כדי להחזיר אותה.',
      'הליכה: ◀ ▶. טיפוס בחבל: ▲ ▼. קפיצה: FIRE (גם מהחבל, עם ◀ או ▶).',
      'ליאנה מתנדנדת: קופצים אליה והיא תופסת את PIP. FIRE משחרר, והתנופה ממשיכה. משחררים ברגע הנכון.',
      'בכל מסך: מגיעים לחץ המהבהב למעלה. בדרך יש 3 חלקים של קלטת הזהב (לא חובה, אבל שווים נקודות).',
      'חביות: הקופים מגלגלים אותן. קפיצה מעל חבית נותנת 100. פטרייה מקפיצה גבוה. נפילה גבוהה מדי כואבת.',
      'חבל קרוע: קופצים מהחבל (FIRE), ותופסים שוב מעל הקרע עם ▲.',
      'נחש על חבל: הוא נח קצת למעלה, ליד החבל. זה הזמן לטפס. אפשר גם לקפוץ מהשורש ולתפוס את החבל מעליו.',
      'בסוף כל עולם יש שומר. בשורשים: רצים לעבר החבית הענקית וקופצים מעליה, שלוש פעמים, והשער נפתח.',
      'הזמן: כשהוא נגמר לא מתים, אבל החביות מגיעות מהר יותר. מי שמסיים מהר מקבל בונוס.',
      'שמירה: בתחילת כל עולם. במסך הפתיחה FIRE ממשיך. משחק חדש: P, ואז FIRE לאישור.',
      'קושי: במסך הפתיחה ◀ ▶ בוחרים EASY, NORMAL או HARD. הניקוד מוכפל לפי הקושי.',
      'הנהרות: הזרם סוחף את בולי העץ, ובסוף הנהר בול שוקע. במפל: מי שעוצר על החבל, המים מורידים אותו. בונה מכרסם את החבל שמטפסים עליו: לא לעצור.',
      'הכוורות: דבש דביק מאט ומנמיך את הקפיצה. מעליות שעווה עולות ויורדות. עציץ עשן מרדים את הדבורים לכמה שניות. אצל המלכה: אוספים 3 צנצנות דבש.',
      'המערות: רואים רק את מה שהלפיד מאיר, והוא נשרף. לפיד חדש מאיר שוב. עטלפים מזנקים כשהאור מגיע אליהם. נטיפים נופלים כשעוברים מתחתם. ליד הדוב הישן: הולכים, עוצרים, הולכים.',
      'עכשיו יש חמישה עולמות, 30 מסכים. הענפים והצמרת בדרך.',
      'P עוצר ופותח מפה והוראות. Esc או "הוצאת המחסנית" יוצאים.'],
    en: ['BIG BONGO, the king of the monkeys, stole the Golden Tape and took it to the top of the Great Tree. PIP, a small explorer, climbs to bring it back.',
      'Walk: ◀ ▶. Climb a rope: ▲ ▼. Jump: FIRE (also off a rope, with ◀ or ▶).',
      'Swinging vine: jump to it and PIP holds on. FIRE lets go and the swing carries on. Let go at the right moment.',
      'In every screen: reach the blinking arrow at the top. On the way are 3 pieces of the Golden Tape (not required, but worth points).',
      'Barrels: the monkeys roll them. Jumping over one gives 100. A mushroom bounces you high. Falling too far hurts.',
      'Torn rope: jump off the rope (FIRE) and grab it again above the gap with ▲.',
      'Snake on a rope: it rests for a while at the top, beside the rope. That is the time to climb. You can also jump from the root and grab the rope above it.',
      'Each world ends with a guard. In the roots: run at the giant barrel and jump over it, three times, and the gate opens.',
      'Time: when it runs out you do not die, but the barrels come faster. A fast finish gives a bonus.',
      'Saving: at the start of each world. On the title, FIRE goes on. New game: P, then FIRE to confirm.',
      'Difficulty: on the title ◀ ▶ choose EASY, NORMAL or HARD. The score is multiplied by it.',
      'Rivers: the current carries the logs, and at the end of the river a log sinks. In the waterfall, stop on a rope and the water pushes you down. A beaver gnaws the rope you climb: do not stop.',
      'Hives: honey is sticky, slower and a lower jump. Wax lifts go up and down. A smoke pot puts the bees to sleep for a few seconds. In the queen\'s room, take the 3 honey jars.',
      'Caves: you only see what the torch lights, and it burns down. A new torch lights it up again. Bats dive when the light reaches them. Stalactites fall when you pass under. By the sleeping bear: walk, stop, walk.',
      'Five worlds, 30 screens, for now. The branches and the treetop are coming.',
      'P pauses and shows the map and help. Esc or "Eject cartridge" leaves.']
  },

  init(api) {
    let diff = 1;
    try { diff = okDiff(parseInt(localStorage.getItem(DIFF_KEY), 10)); } catch (e) {}
    api.state = { mode: 'title', t: 0, titleP: 0, titleT: 0, high: api.loadHigh('king'), save: loadSave(), diff, world: 1, score: 0, lives: 3 };
    stat = null; statKey = '';
  },

  update(api) {
    const s = api.state, snd = api.sound;
    s.t++;
    if (s.mode === 'title') {
      if (s.askNew) {
        s.askT++;
        if (api.hit('left') || api.hit('right')) { s.diff = (s.diff + (api.hit('right') ? 1 : 2)) % 3; snd.tone(440 + s.diff * 110, 40); try { localStorage.setItem(DIFF_KEY, String(s.diff)); } catch (e) {} return; }
        if (api.hit('fire') && s.askT > 30) { s.askNew = false; clearSave(); s.save = null; newGame(s); return; }
        if (['up', 'down', 'pause'].some(b => api.hit(b)) || api.hit('fire')) { s.askNew = false; snd.tone(300, 40); }
        return;
      }
      if (api.hit('down')) { s.titleP = (s.titleP + 1) % 4; s.titleT = 0; snd.tone(330, 30); } else if (++s.titleT > 300) { s.titleP = (s.titleP + 1) % 4; s.titleT = 0; }
      if (s.save && api.hit('pause') && s.t > 40) { s.askNew = true; s.askT = 0; try { s.diff = okDiff(parseInt(localStorage.getItem(DIFF_KEY), 10)); } catch (e) {} snd.tone(250, 60); return; }
      if (!s.save && (api.hit('left') || api.hit('right'))) { s.diff = (s.diff + (api.hit('right') ? 1 : 2)) % 3; snd.tone(440 + s.diff * 110, 40); try { localStorage.setItem(DIFF_KEY, String(s.diff)); } catch (e) {} }
      if (s.t > 40 && s.save && s.save.world > ROUND_WORLDS && (api.hit('fire') || api.hit('up'))) { s.soon = 120; snd.tone(200, 120); return; }
      if (s.soon) s.soon--;
      if (s.t > 40 && s.save && (api.hit('fire') || api.hit('up'))) {   // ממשיכים מהעולם השמור
        const v = s.save;
        Object.assign(s, { diff: okDiff(v.diff), world: Math.min(ROUND_WORLDS, Math.max(1, v.world | 0)), lives: Math.max(3, v.lives | 0), score: v.score | 0, tapes: v.tapes | 0, sub: v.sub | 0, nextLife: (Math.floor((v.score | 0) / 10000) + 1) * 10000 });
        s.idx = WORLDS[s.world].first; s.mode = 'map'; s.t = 0; return;
      }
      if (s.t > 40 && !s.save && api.hit('fire')) { newGame(s); return; }
      return;
    }
    if (s.mode === 'map') { if (s.t > 30 && api.hit('fire')) startScreen(s); return; }
    if (s.mode === 'intro') { if (s.t > 75 || (s.t > 15 && api.hit('fire'))) { s.mode = 'play'; s.t = 0; snd.tone(523, 60); } return; }
    if (s.mode === 'play') {
      if (api.hit('pause')) { s.paused = !s.paused; s.page = 0; snd.tone(600, 40); return; }
      if (s.paused) { if (api.hit('left') || api.hit('right')) s.page = ((s.page || 0) + 1) % 2; if (api.hit('fire')) s.paused = false; return; }
      if (s.msgT > 0) s.msgT--;
      const inp = { left: api.input.left, right: api.input.right, up: api.input.up, down: api.input.down, fire: api.hit('fire') };
      const ev = step(s, inp, snd);
      if (s.score >= s.nextLife) { s.lives++; s.nextLife += 10000; msg(s, 'EXTRA LIFE!'); snd.tone(700, 200, 1400); }
      if (ev === 'die') { s.mode = 'dying'; s.t = 0; }
      else if (ev === 'exit' || ev === 'secret') {
        s.secretGot = ev === 'secret';
        if (ev === 'secret') { s.lives++; s.score += 1000; }
        s.tapes += s.got; s.bonus = Math.ceil(s.time / 50) * 10; s.bonusShown = 0; s.mode = 'clear'; s.t = 0;
        [523, 659, 784, 1046].forEach((f, i) => snd.note && snd.note(f, i * 0.09, 0.09));
      }
      return;
    }
    if (s.mode === 'dying') {
      if (s.t > 70) {
        s.lives--;
        if (s.lives <= 0) { s.mode = 'over'; s.t = 0; endScore(api, s); }
        else startScreen(s);
      }
      return;
    }
    if (s.mode === 'clear') {
      if (s.bonusShown < s.bonus) { const k = Math.min(10, s.bonus - s.bonusShown); s.bonusShown += k; s.score += k; if (s.t % 3 === 0) snd.tone(1000, 15); }
      else if (s.t > 60 && (s.t > 140 || api.hit('fire'))) {
        const next = s.idx + 1;
        if (next >= SCREENS.length) { s.mode = 'end'; s.t = 0; endScore(api, s); return; }
        const nw = +SCREENS[next].id[0];
        if (nw !== s.world) { s.world = nw; startWorld(s); } else { s.idx = next; startScreen(s); }
      }
      return;
    }
    if (s.mode === 'over' || s.mode === 'end') {
      if (s.t > 50 && api.hit('fire')) { s.mode = 'title'; s.t = 0; s.titleP = 0; s.save = loadSave(); s.high = api.loadHigh('king'); }
    }
  },

  draw(api) {
    const g = api.gfx, s = api.state;
    if (s.mode === 'title') return s.askNew ? drawAsk(g, s) : drawTitle(g, s);
    if (s.mode === 'map') return drawMap(g, s);
    if (s.mode === 'intro') return drawCard(g, s);
    if (s.mode === 'play' || s.mode === 'dying') return drawPlay(g, s);
    return drawEnd(g, s);
  }
};
// סוף משחק (גם אחרי שהמשחק נגמר וגם בסוף הסבב): לתוצאות. אותה ריצה לא נכנסת פעמיים להיכל התהילה
function endScore(api, s) {
  const fs = finalScore(s), v = loadSave();
  if (fs > ((v && v.sub) || s.sub || 0)) { api.submitScore('king', fs); s.sub = fs; if (v) try { localStorage.setItem(SAVE, JSON.stringify({ ...v, sub: fs })); } catch (e) {} }
  if (s.mode === 'end') { s.world = ROUND_WORLDS + 1; writeSave(s); }   // העולם הבא עוד בבנייה: השמירה מחכה לו
}

// לבדיקות: הפיזיקה בלי ציור
export const _test = { SCREENS, loadScreen, step, platforms, lightR, OY, T, WATER, newState: (diff = 1) => ({ diff, score: 0, lives: 3, world: 1, mode: 'play' }) };
