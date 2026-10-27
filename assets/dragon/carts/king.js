// מחסנית "JUNGLE KING" (מלך הג'ונגל): המשחק הגדול השני של האפליקציה (גונן, 27.10.2026). תכנון: docs/DRAGON-GAME-JUNGLE.md
// BIG BONGO, מלך הקופים, גנב את קלטת הזהב ועלה לצמרת העץ הגדול. PIP מטפס מהשורשים: 40 מסכים בשבעה עולמות.
// סבב 1: המנוע, ועולמות 1 (שורשים) ו-2 (ביצות), 12 מסכים. מראה של Dragon: ערכה של PMODE 3 לכל עולם ושחור, הכל מצויר ביד.
// שליטה: ◀ ▶ הליכה, ▲ ▼ טיפוס, FIRE קפיצה (על ליאנה: שחרור), P תפריט.
import { W, H, PALETTES, BLACK } from '../gfx.js';
import * as A from './king-art.js';
import { SCREENS } from './king-screens.js';

const OY = 10, T = 8, COLS = 32, ROWS = 21;
const GRAV = 0.22, JUMP = -3.4, WALK = 1.1, CLIMB = 1.0, MAXF = 4, BOUNCE = -5.6, FALL_HURT = 50, WATER = OY + 18 * T;
const DIFF = [
  { name: 'EASY', spd: 0.75, rate: 1.4, time: 1.3, mult: 1 },
  { name: 'NORMAL', spd: 1, rate: 1, time: 1, mult: 2 },
  { name: 'HARD', spd: 1.25, rate: 0.7, time: 0.8, mult: 3 }
];
const WORLDS = [null, { pal: 1, name: 'ROOTS', first: 0 }, { pal: 0, name: 'SWAMPS', first: 6 }];
const ROUND_WORLDS = 2;   // סבב 1: שני עולמות
const SAVE = 'd32-king-save', DIFF_KEY = 'd32-king-diff';
const okDiff = d => (d === 0 || d === 1 || d === 2) ? d : 1;
const D = s => DIFF[okDiff(s.diff)];

// ---------- צבעים לפי עולם ----------
function colors(w) {
  const [c0, c1, c2, c3] = PALETTES[WORLDS[w].pal];
  const k = BLACK;
  if (w === 1) return { c: [c0, c1, c2, c3], pip: { h: c0, b: c3, s: c1, p: c2, k }, monkey: { f: c2, h: c0, k }, barrel: { h: c0, s: c3, p: c2 },
    snake: { c: c1, k, r: c3, h: c1 }, mush: { f: c2, h: c0, k }, tape: { b: c3, h: c0, k }, glow: { c: c1 }, beetle: { c: c1, h: c0, r: c3, k },
    splash: { c: c1 }, hud: [c3, c1, c0, c2], rope: [c0, c3], life: { h: c0, b: c3, s: c1, p: c2 } };
  return { c: [c0, c1, c2, c3], pip: { h: c1, b: c3, s: c3, p: c2, k }, monkey: { f: c3, h: c1, k }, barrel: { h: c1, s: c3, p: c2 },
    snake: { c: c0, k, r: c3, h: c0 }, mush: { f: c3, h: c1, k }, tape: { b: c3, h: c1, k }, glow: { c: c1 }, croc: { g: c0, y: c1, k },
    frog: { g: c0, y: c1, k }, mosq: { b: c2, r: c3 }, lily: { g: c0, y: c1 }, log: { y: c1, r: c3 }, splash: { c: c1 },
    hud: [c3, c1, c0, c2], rope: [c0, c0], life: { h: c1, b: c3, s: c3, p: c2 } };
}

// ---------- המפה ----------
const ENT = 'PTKSRMGVCFOLlQ';
function loadScreen(s, idx) {
  const sc = SCREENS[idx];
  // דמות שעומדת במים (תנין, בול עץ, עלה, השומר בביצות): מתחתיה מים
  const grid = sc.map.map(r => r.split('').map(ch => ch === 'R' ? '|' : 'COLl'.includes(ch) || (ch === 'G' && sc.guard === 'croc') ? '~' : ENT.includes(ch) ? '.' : ch));
  const L = { idx, sc, grid, world: +sc.id[0], tapes: [], throwers: [], snakes: [], ropeSnakes: [], mush: [], vines: [], crocs: [], frogs: [],
    lilies: [], logs: [], swarms: [], barrels: [], guard: null, fx: [], t: 0 };
  let vi = 0, li = 0, fi = 0;
  sc.map.forEach((row, r) => row.split('').forEach((ch, c) => {
    const cx = c * T + 4, fy = OY + (r + 1) * T;
    if (ch === 'P') L.start = { x: cx, y: fy };
    else if (ch === 'T') L.tapes.push({ x: cx, y: OY + r * T + 6, got: false });
    else if (ch === 'K') L.throwers.push({ x: cx, y: fy, dir: sc.dir ?? -1, cd: 60, anim: 0 });
    else if (ch === 'S') { const [a, b] = span(grid, c, r + 1); L.snakes.push({ x: cx, y: fy, dir: 1, a: a * T + 8, b: b * T, f: 0 }); }
    else if (ch === 'R') { const [a, b] = ropeSpan(grid, c, r); L.ropeSnakes.push({ x: cx, y: OY + r * T, dir: 1, a: OY + a * T + 6, b: OY + (b + 1) * T - 2, top: OY + a * T, rest: 0, f: 0 }); }
    else if (ch === 'M') L.mush.push({ x: cx, y: fy, sq: 0 });
    else if (ch === 'V') L.vines.push({ px: cx, py: OY + r * T, len: (sc.vines || [])[vi++] || 72, amp: 0.5, ph: vi * 1.7 });
    else if (ch === 'C') L.crocs.push({ x: c * T, y: WATER, t: 0 });
    else if (ch === 'F') { const hop = (sc.frogHop || [])[fi++]; L.frogs.push({ x: cx, y: fy, a: hop ? hop[0] * T + 4 : cx - 16, b: hop ? hop[1] * T + 4 : cx, t: 0, dir: 1 }); }
    else if (ch === 'O') L.lilies.push({ x: cx, y: WATER, t: 0, sunk: 0 });
    else if (ch === 'L' || ch === 'l') { const b = (sc.logs || [])[li++] || [c - 3, c + 3]; L.logs.push({ x: cx, y: WATER, a: b[0] * T + 12, b: b[1] * T - 4, vx: 0.4, sink: ch === 'l', t: 0, down: 0 }); }
    else if (ch === 'Q') L.swarms.push({ bx: cx, by: OY + r * T, x: cx, y: OY + r * T });
    else if (ch === 'G') L.guard = sc.guard === 'beetle' ? { kind: 'beetle', x: cx - 10, bx: cx + 20, y: fy, dir: 1, side: 0, f: 0, turn: 0, hop: 0 } : { kind: 'croc', x: c * T, y: WATER, t: 0, bx: c * T };
  }));
  s.L = L;
  s.gateOpen = !sc.guard || sc.guard === 'croc';
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
function ropeSpan(grid, c, r) { let a = r, b = r; while (a > 0 && grid[a - 1][c] === '|') a--; while (b < ROWS - 1 && grid[b + 1][c] === '|') b++; return [a, b]; }
const col = x => Math.floor(x / T), row = y => Math.floor((y - OY) / T);
function tile(s, c, r) { if (c < 0 || c >= COLS || r >= ROWS) return '#'; if (r < 0) return '.'; return s.L.grid[r][c]; }
const isSolid = ch => ch === '#';
const isTop = ch => ch === '#' || ch === '=';
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
  if (p.inv) p.inv--;
  const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
  if (dir) p.face = dir;
  const plats = platforms(s);
  let ev = null;

  if (p.mode === 'swing') {
    const v = p.vine, ox = p.x, oy = p.y;
    if (dir) v.amp = Math.max(0.3, Math.min(0.95, v.amp + 0.003 * dir * Math.sign(Math.cos(v.ph))));   // נדנוד: ◀ ▶ בכיוון התנופה מגדילים אותה
    const a = vineAngle(v);
    p.x = v.px + Math.sin(a) * p.vd; p.y = v.py + Math.cos(a) * p.vd + 14;
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
      p.vx = dir * WALK * sticky;
      if (dir) p.anim++;
      if (ground && ground.vx) p.x += ground.vx;
      if (ground && ground.kind === 'lily') ground.o.t++;
      if (ground && ground.kind === 'log' && ground.o.sink) ground.o.t++;
      if (inp.fire) { p.mode = 'air'; p.vy = JUMP; p.fallY = p.y; p.ropeJump = false; p.realJump = true; snd.tone(300, 80, 600); }
      else if (inp.down && isRope(tile(s, col(p.x), row(p.y) + 1)) && Math.abs(p.x - (col(p.x) * T + 4)) <= 4) { p.mode = 'climb'; p.x = col(p.x) * T + 4; p.y = OY + (row(p.y) + 1) * T + 2; }
    } else {
      // באוויר: שליטה חלקית, ותנופה מהליאנה נשמרת
      if (Math.abs(p.vx) > WALK) p.vx *= 0.99; else p.vx = Math.max(-WALK, Math.min(WALK, p.vx + dir * 0.12));
    }
    if (inp.up && !p.grabCd && !(p.ropeJump && p.vy < 0) && (isRope(tile(s, col(p.x), row(p.y - 8))) || isRope(tile(s, col(p.x), row(p.y - 14))))) { p.ropeJump = false; p.mode = 'climb'; p.x = col(p.x) * T + 4; p.vx = p.vy = 0; }
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
              p.mode = 'walk'; p.vy = 0; p.realJump = false;
              if (ny - p.fallY > FALL_HURT) { p.y = ny; return die(s, snd, 'OUCH!'); }
            }
          }
        }
        p.y = ny;
        // תפיסת ליאנה מתנדנדת
        if (!p.grabCd && p.mode === 'air') for (const v of L.vines) {
          const a = vineAngle(v), hx = p.x, hy = p.y - 14;
          for (let dd = v.len * 0.35; dd <= v.len; dd += 2) {
            if (Math.abs(v.px + Math.sin(a) * dd - hx) < 5 && Math.abs(v.py + Math.cos(a) * dd - hy) < 5) { p.mode = 'swing'; p.vine = v; p.vd = dd; v.amp = Math.max(v.amp, 0.62); snd.tone(250, 40); break; }
          }
          if (p.mode === 'swing') break;
        }
      }
    }
  }
  // מים, ונפילה מחוץ למסך
  if (p.mode !== 'swing' && tile(s, col(p.x), row(p.y - 2)) === '~') { L.fx.push({ k: 'splash', x: p.x, y: WATER - 4, t: 20 }); return die(s, snd, 'SPLASH!'); }
  if (p.y > OY + ROWS * T + 24) return die(s, snd, 'OUCH!');
  // יציאה וסדק סודי
  for (const yy of [p.y - 12, p.y - 3]) {
    const ch = tile(s, col(p.x), row(yy));
    if (ch === 'E' && s.gateOpen) ev = 'exit';
    if (ch === 'c') ev = 'secret';
  }
  // חלקי הקלטת
  for (const tp of L.tapes) if (!tp.got && Math.abs(tp.x - p.x) < 8 && tp.y > p.y - 20 && tp.y < p.y + 4) { tp.got = true; s.got++; s.score += 250; snd.tone(1200, 60, 1600); fx(s, tp.x, tp.y, '250'); }

  if (!s.noEnemies && enemies(s, snd, d)) return 'die';
  movers(s, snd, d);
  return ev;
}
function support(s, p, plats) {
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
  for (const v of L.vines) { v.ph += Math.sqrt(GRAV / v.len) * 0.9; if (s.p.vine !== v) v.amp += (0.5 - v.amp) * 0.01; }
  for (const l of L.logs) {
    if (l.down) { l.down--; if (!l.down) l.t = 0; continue; }
    l.x += l.vx; if (l.x < l.a || l.x > l.b) { l.vx = -l.vx; l.x += l.vx * 2; }
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
      else L.barrels.push({ x: k.x + k.dir * 8, y: k.y, vx: k.dir * 1.0 * d.spd, vy: 0, mode: 'roll', rot: 0 });
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
      for (let r = row(b.y); r <= row(ny); r++) { const ty = OY + r * T; if (ty > b.y && ty <= ny && isTop(tile(s, col(b.x), r))) { b.y = ty; b.mode = 'roll'; b.vx = -b.vx || d.spd; snd.tone(110, 40); break; } }
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
    if (hit(p, f.x - 3, f.y - 4 - f.hop, f.x + 3, f.y - f.hop)) hurt = true;
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
       s.passes++; snd.tone(600 + s.passes * 100, 80); fx(s, p.x, p.y - 24, s.passes + '/3'); if (s.passes >= (s.L.sc.passes || 3)) { s.gateOpen = true; msg(s, 'THE GATE IS OPEN!'); snd.tone(500, 300, 1000); } }
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

// ---------- ציור ----------
let stat = null, statKey = '';
function drawStatic(s) {
  const key = s.L.sc.id;
  if (stat && statKey === key) return stat;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const px = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); };
  const put = (rows, x, y, cols, flip) => { for (let r = 0; r < rows.length; r++) for (let c = 0; c < rows[r].length; c++) { const ch = rows[r][c]; if (ch === '.' || ch === ' ') continue; const cc = cols[ch]; if (!cc) continue; ctx.fillStyle = cc; ctx.fillRect(x + (flip ? rows[r].length - 1 - c : c), y + r, 1, 1); } };
  ctx.fillStyle = BLACK; ctx.fillRect(0, 0, W, H);
  const C = colors(s.L.world), [c0, c1, c2, c3] = C.c, TC = { 0: c0, 1: c1, 2: c2, 3: c3, k: BLACK };
  const g = s.L.grid, at = (c, r) => (r < 0 || r >= ROWS || c < 0 || c >= COLS) ? '#' : g[r][c];
  if (s.L.world === 1) {
    // עורקי עץ עמומים ברקע: מרגישים שנמצאים בתוך הגזע
    for (let x = 6; x < W - 6; x += 9 + (x % 4)) { let xx = x; for (let y = OY; y < OY + ROWS * T; y++) { if ((y + x) % 3 === 0) px(xx, y, c2); if (y % 11 === x % 11) xx += x % 2 ? 1 : -1; } }
    for (const [x, y] of [[40, 50], [200, 84], [96, 150], [170, 20], [30, 118], [120, 70]]) put(A.GLOW, x, y, { c: c1 });
  } else {
    for (let i = 0; i < 50; i++) px((i * 97 + 13) % W, OY + (i * 53 + 7) % 120, c2);
    // חופת עלים למעלה
    for (let x = 0; x < W; x++) for (let y = OY; y < OY + 14; y++) { const d = (y - OY) - 6 - 4 * Math.sin(x / 13); if (d < 0 && ((x * 3 + y * 7) & 3)) px(x, y, (d > -2 && x % 3 === 0) ? c1 : c0); }
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const ch = g[r][c], x = c * T, y = OY + r * T;
    if (ch === '#') {
      const above = at(c, r - 1);
      if (s.L.world === 1) {
        if (!isSolid(above) && above !== 'c') put(A.TILES.rootTop[(c * 7 + r) % 3], x, y, TC);
        else { const thick = isSolid(at(c - 1, r)) && isSolid(at(c + 1, r)); put(A.TILES.bark[(c + r) % 2].map((rw, yy) => thick && (c > 1 && c < 30) ? rw.replace(/3/g, (m, i) => ((i * 2 + yy + c) % 5 ? '.' : '3')) : rw), x, y, TC, (c + r) % 3 === 0); }
      } else put(!isSolid(above) ? A.TILES.mudTop : A.TILES.mud, x, y, TC);
    } else if (ch === '=') {
      const l = at(c - 1, r) === '=' || isSolid(at(c - 1, r)), rr = at(c + 1, r) === '=' || isSolid(at(c + 1, r));
      if (s.L.world === 1) {
        if (!l) put(A.TILES.rootEnd, x, y, TC); else if (!rr) put(A.TILES.rootEnd, x, y, TC, true); else put(A.TILES.rootTop[(c * 7 + r) % 3], x, y, TC);
        if (l && rr && (c % 5 === 2 || c % 5 === 3)) put(A.TILES.rootBody, x, y + 7, TC);
        if (c % 3 === 1) { let xx = x + 3; const len = 4 + ((c * 5 + r) % 6); for (let k = 0; k < len; k++) { px(xx, y + 8 + k, k < 2 ? c3 : c2); if (k % 3 === 2) xx += c % 2 ? 1 : -1; } }
      } else {
        if (!l) put(A.TILES.branchEnd, x, y, TC); else if (!rr) put(A.TILES.branchEnd, x, y, TC, true); else put(A.TILES.branchTop[c % 2], x, y, TC);
      }
    } else if (ch === '|') {
      for (let yy = y; yy < y + T; yy++) {
        if (s.L.world === 1) { const ph = (yy - OY) % 4; px(x + 3, yy, ph === 0 || ph === 3 ? c0 : c3); px(x + 4, yy, ph < 2 ? c0 : c3); px(x + 5, yy, ph === 1 || ph === 2 ? c0 : c3); }
        else { const xx = x + 4 + Math.round(Math.sin(yy / 9)); px(xx, yy, c0); if ((yy - OY) % 8 === 3) { px(xx - 1, yy, c0); px(xx - 2, yy - 1, c0); } if ((yy - OY) % 8 === 7) { px(xx + 1, yy, c0); px(xx + 2, yy - 1, c0); } }
      }
    } else if (ch === 'c') {
      put(s.L.world === 1 ? A.TILES.bark[0] : A.TILES.mud, x, y, TC);
      for (let k = 1; k < 8; k++) px(x + 3 + (k % 2), y + k, BLACK);   // הסדק: רמז קטן
    } else if (ch === '~') {
      ctx.fillStyle = c2; ctx.fillRect(x, y + (at(c, r - 1) === '~' ? 0 : 3), T, T);
    }
  }
  // קני סוף על הגדות בביצות
  if (s.L.world === 2) for (let c = 0; c < COLS; c++) for (let r = 1; r < ROWS; r++) if (g[r][c] === '#' && !isSolid(g[r - 1][c]) && c % 3 === 1) { for (let k = 1; k < 10 + (c % 4); k++) px(c * T + 3 + (k > 8 ? 1 : 0), OY + r * T - k, c1); px(c * T + 3, OY + r * T - 11 - (c % 4), c3); }
  stat = cv; statKey = key;
  return cv;
}

function spr(g, rows, x, y, cols, flip) { g.sprite(rows, Math.round(x), Math.round(y), cols, flip, 1); }
function drawPlay(g, s) {
  const L = s.L, p = s.p, C = colors(L.world), [c0, c1, c2, c3] = C.c;
  g.ctx.drawImage(drawStatic(s), 0, 0);
  // מים חיים
  if (L.world === 2) for (let x = 0; x < W; x += 2) { const r = row(WATER + 1); if (tile(s, col(x), r) !== '~') continue; const yy = WATER + 3 + Math.round(Math.sin((x + L.t) / 6)); g.rect(x, yy, 2, 1, c1); if ((x + L.t >> 2) % 9 === 0) g.rect(x, yy + 3, 1, 1, c0); }
  // יציאה: חץ מהבהב, והשער נעול עד שהשומר מנוצח
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (L.grid[r][c] === 'E' && (L.grid[r - 1] || [])[c] !== 'E' && (L.grid[r][c - 1] !== 'E')) {
    const x = c * T + 8, y = OY + r * T;
    if (s.gateOpen) { const b = (L.t >> 3) % 2 ? c1 : c0; g.rect(x - 1, y - 2, 2, 10, b); for (let k = 0; k < 4; k++) { g.rect(x - 1 - k, y - 2 + k, 1, 1, b); g.rect(x + k, y - 2 + k, 1, 1, b); } }
    else { for (let k = 0; k < 16; k += 3) g.rect(x - 8 + k, y, 1, 16, c3); g.rect(x - 8, y + 7, 16, 1, c3); }
  }
  // ליאנות מתנדנדות
  for (const v of L.vines) {
    const a = vineAngle(v), ex = v.px + Math.sin(a) * v.len, ey = v.py + Math.cos(a) * v.len;
    for (let t = 0; t <= 1; t += 1 / v.len) { const x = v.px + (ex - v.px) * t, y = v.py + (ey - v.py) * t; g.rect(x, y, 1, 1, c0); }
    for (let t = 0.15; t < 0.95; t += 0.11) { const x = v.px + (ex - v.px) * t, y = v.py + (ey - v.py) * t, sd = (t * 9 | 0) % 2 ? 1 : -1; g.rect(x + sd, y, 1, 1, c0); g.rect(x + 2 * sd, y - 1, 2, 1, c0); }
    g.rect(v.px - 2, v.py - 1, 5, 2, c1);
  }
  for (const m of L.mush) spr(g, m.sq ? A.MUSH_SQ : A.MUSH, m.x - 8, m.y - 10, C.mush);
  for (const tp of L.tapes) if (!tp.got) spr(g, A.TAPE, tp.x - 5, tp.y - 2 + ((L.t >> 4) % 2), C.tape);
  for (const l of L.logs) if (!l.down || (l.down > 100 && l.down % 4 < 2)) spr(g, A.LOG, l.x - 11, l.y - 3 + (l.sink && l.t > 40 ? 1 : 0), C.log);
  for (const pd of L.lilies) if (!pd.sunk) spr(g, A.LILY, pd.x - 6 + (pd.t > 25 && L.t % 4 < 2 ? 1 : 0), pd.y - 2, C.lily);
  for (const c of L.crocs) spr(g, A.CROC[smallCrocOpen(c) ? 1 : 0], c.x, c.y - (smallCrocOpen(c) ? 6 : 5), C.croc);
  const gd = L.guard;
  if (gd && gd.kind === 'croc') {
    const open = crocOpen(gd);
    // הגוף: שורת קשקשים על הגב, עור מנוקד, בטן צהובה, ורגליים קצרות שחותרות
    for (let x = gd.x; x < gd.x + 112; x++) {
      const yy = gd.y - 6, k = x - gd.x;
      g.rect(x, yy, 1, 1, c0);
      for (let r = 1; r < 5; r++) if ((x + r) % 2 === 0 || r === 1) g.rect(x, yy + r, 1, 1, c0);
      g.rect(x, yy + 5, 1, 1, c1);
      if (k % 8 < 3) g.rect(x, yy - 1 - (k % 8 === 1 ? 1 : 0), 1, 1 + (k % 8 === 1 ? 1 : 0), c0);
      if (k % 16 === 5) g.rect(x, yy + 2, 2, 1, BLACK);
    }
    for (let i = 0; i < 4; i++) { const lx = gd.x + 14 + i * 28, ph = Math.sin(L.t / 8 + i) > 0 ? 1 : 0; g.rect(lx + ph, gd.y, 3, 2, c0); g.rect(lx - 1 + ph * 2, gd.y + 2, 2, 1, c0); }
    spr(g, A.BIG_CROC_HEAD[open ? 1 : 0], gd.x + 112, gd.y - (open ? 7 : 6), C.croc);
    for (let k = 0; k < 10; k++) g.rect(gd.x - k * 2, gd.y - 3 + (k % 2), 2, 2, c0);   // זנב
  }
  for (const f of L.frogs) spr(g, A.FROG[f.hop ? 1 : 0], f.x - 3, f.y - 4 - f.hop - (f.hop ? 1 : 0), C.frog, f.to < f.from);
  for (const k of L.throwers) spr(g, A.MONKEY[k.anim ? 1 : 0], k.x - 6, k.y - 13, C.monkey, k.dir > 0);
  for (const n of L.snakes) spr(g, A.SNAKE[(n.f >> 4) % 2], n.x - 8, n.y - 7, C.snake, n.dir < 0);
  for (const n of L.ropeSnakes) { if (n.rest) spr(g, A.SNAKE[(n.f >> 4) % 2], n.x + 4, n.top - 7, C.snake); else spr(g, A.SNAKE_UP, n.x - 3, n.y - 6, C.snake, n.dir > 0); }
  for (const q of L.swarms) for (let i = 0; i < 5; i++) { const a = L.t / 9 + i * 1.3; spr(g, A.MOSQ[(L.t >> 2) % 2], q.x + Math.cos(a) * 7 - 1, q.y + Math.sin(a * 1.3) * 5, C.mosq); }
  if (gd && gd.kind === 'beetle') { spr(g, A.BIG_BARREL, gd.bx - 8, gd.y - 14, C.barrel, !gd.turn && (gd.f >> 3) % 2 === 0); spr(g, A.BEETLE, gd.x - 9, gd.y - 7 - gd.hop, C.beetle, gd.turn ? gd.to < gd.from : gd.dir < 0); }
  for (const b of L.barrels) spr(g, A.BARREL[Math.floor(b.rot) % 4], b.x - 5, b.y - 10 + (b.mode === 'float' ? 2 : 0), C.barrel, b.vx < 0);
  // PIP
  if (s.mode !== 'dying' || s.t % 6 < 4) {
    let rows = A.PIP.stand, oy = 18, flip = p.face < 0;
    if (s.mode === 'dying') rows = A.PIP.hurt;
    else if (p.mode === 'climb') { rows = A.PIP.climb[(p.anim >> 3) % 2]; oy = 16; flip = false; }
    else if (p.mode === 'swing') { rows = A.PIP.swing; oy = 17; }
    else if (p.mode === 'air') rows = A.PIP.jump;
    else if (p.vx) rows = A.PIP.walk[(p.anim >> 2) % 4];
    if (!(p.inv && L.t % 4 < 2)) spr(g, rows, p.x - 6, p.y - oy, C.pip, flip);
  }
  for (const f of L.fx) {
    if (f.k === 'text') g.text(f.text, f.x, f.y - (40 - f.t) / 3, c1, 'center');
    else spr(g, A.SPLASH, f.x - 3, f.y - (20 - f.t) / 4, C.splash);
  }
  drawHud(g, s, C);
  if (s.msgT > 0) { const w = s.msg.length * 6 + 8; g.rect(128 - w / 2, 86, w, 13, BLACK); g.text(s.msg, 128, 89, (s.msgT >> 3) % 2 ? c1 : c3, 'center'); }
  if (s.paused) drawPause(g, s, C);
}
function drawHud(g, s, C) {
  const [cCode, cName, cScore, cTime] = C.hud;
  g.rect(0, 0, W, OY, BLACK); g.rect(0, 180, W, H - 180, BLACK);
  g.text(s.L.sc.id, 3, 2, cCode); g.text(s.L.sc.name, 27, 2, cName); g.text(String(s.score).padStart(6, '0'), W - 3, 2, cScore, 'right');
  for (let i = 0; i < Math.min(6, s.lives); i++) spr(g, A.PIP.life, 3 + i * 8, 184, C.life);
  for (let i = 0; i < 3; i++) { g.rect(104 + i * 8, 185, 6, 4, i < s.got ? cScore : cTime); g.rect(105 + i * 8, 186, 4, 2, i < s.got ? BLACK : BLACK); g.rect(106 + i * 8, 186, 2, 1, i < s.got ? cScore : cTime); }
  const sec = Math.ceil(s.time / 50);
  g.text(s.hurry ? 'HURRY!' : 'TIME ' + sec, W - 3, 185, s.hurry || sec <= 10 ? cCode : cTime, 'right');
}
function drawPause(g, s, C) {
  const [c0, c1, c2, c3] = C.c;
  g.rect(24, 30, 208, 130, BLACK); g.rect(24, 30, 208, 1, c1); g.rect(24, 159, 208, 1, c1);
  if ((s.page || 0) === 0) { g.text('PAUSED', 128, 38, c3, 'center', 2); drawTree(g, s, C, 60, 54, true); }
  else {
    g.text('HOW TO PLAY', 128, 38, c3, 'center', 2);
    [['LEFT RIGHT', 'WALK'], ['UP DOWN', 'CLIMB A ROPE'], ['FIRE', 'JUMP'], ['FIRE ON A VINE', 'LET GO'], ['P', 'THIS MENU']].forEach(([k, t], i) => { g.text(k, 36, 62 + i * 12, c1); g.text(t, 132, 62 + i * 12, c0); });
    g.text('GET TO THE ARROW AT THE TOP.', 128, 128, c2, 'center'); g.text('3 TAPE PIECES IN EVERY SCREEN.', 128, 138, c2, 'center');
  }
  g.text('LEFT RIGHT: PAGE   P: PLAY', 128, 150, c2, 'center');
}
// מפת העץ: שבעה עולמות, מסומן איפה PIP
const WNAMES = ['ROOTS', 'SWAMPS', 'RIVERS', 'HIVES', 'CAVES', 'BRANCHES', 'TREETOP'];
const WCOUNT = [6, 6, 6, 6, 6, 5, 5];
function drawTree(g, s, C, x0, y0, small) {
  const [c0, c1, c2, c3] = C.c, cx = 128, top = y0, bot = y0 + (small ? 88 : 128);
  for (let y = top; y <= bot; y++) for (let x = cx - 8; x <= cx + 8; x++) if ((x + y) % 2 === 0) g.rect(x, y, 1, 1, c1);
  g.rect(cx - 9, top, 1, bot - top, c1); g.rect(cx + 9, top, 1, bot - top, c1);
  for (let i = 0; i < 7; i++) {
    const w = 7 - i, y = top + 4 + i * ((bot - top - 8) / 6), left = i % 2 === 0, done = w < s.world, here = w === s.world;
    const ex = left ? cx - 40 : cx + 40;
    for (let k = 0; k <= 30; k++) g.rect(left ? cx - 9 - k : cx + 9 + k, Math.round(y + 3 - k / 10), 1, 1, c0);
    g.text(w + ' ' + WNAMES[w - 1], left ? ex - 4 : ex + 4, y - 3, done ? c1 : here ? c3 : c2, left ? 'right' : 'left');
    if (here) spr(g, A.PIP.life, cx - 2, y - 2, colors(s.world).life);
  }
}

function drawTitle(g, s) {
  const C = colors(2), [c0, c1, c2, c3] = C.c;
  g.clear(BLACK);
  for (let i = 0; i < 60; i++) g.rect((i * 97 + 13) % W, (i * 53 + 7) % H, 1, 1, c2);
  const pg = s.titleP || 0;
  if (pg === 0) {
    // העץ, BIG BONGO בצמרת עם קלטת הזהב, ו-PIP מטפס
    for (let y = 96; y < 192; y++) for (let x = 202; x < 230; x++) if ((x + y) % 2 === 0) g.rect(x, y, 1, 1, c1);
    g.rect(201, 96, 1, 96, c1); g.rect(230, 96, 1, 96, c1);
    for (let y = -22; y <= 22; y++) for (let x = -46; x <= 46; x++) { const dd = x * x / 2116 + y * y / 484; if (dd < 1 && ((x * 3 + y * 7) & 3)) g.rect(216 + x, 84 + y, 1, 1, dd > 0.6 && (x + y) % 3 === 0 ? c1 : c0); }
    g.sprite(A.BONGO, 196, 26, { y: c1, g: c0, b: c2, r: c3, k: BLACK }, false, 2);
    spr(g, A.TAPE, 234, 48, C.tape);
    g.text('JUNGLE', 88, 16, c1, 'center', 4); g.text('KING', 88, 50, c3, 'center', 4);
    g.text('BIG BONGO HAS STOLEN', 88, 92, c0, 'center'); g.text('THE GOLDEN TAPE.', 88, 102, c0, 'center');
    for (let y = 0; y < 150; y++) { const xx = 176 + Math.round(Math.sin(y / 9)); g.rect(xx, y, 1, 1, c0); if (y % 8 === 3) g.rect(xx - 2, y - 1, 2, 1, c0); if (y % 8 === 7) g.rect(xx + 1, y - 1, 2, 1, c0); }
    spr(g, A.PIP.climb[(s.t >> 4) % 2], 170, 104 - ((s.t >> 2) % 40), C.pip);
  } else if (pg === 1) {
    g.text('THE STORY', 128, 12, c3, 'center', 2);
    ['BIG BONGO, THE KING OF THE', 'MONKEYS, STOLE THE GOLDEN TAPE', 'AND TOOK IT TO THE TOP OF', 'THE GREAT TREE.', '', 'PIP IS A SMALL EXPLORER', 'WITH A BIG HAT.', '', '40 SCREENS. 7 WORLDS.', 'CLIMB AND BRING IT BACK!'].forEach((t, i) => g.text(t, 128, 32 + i * 9, i < 4 ? c0 : i < 7 ? c1 : c3, 'center'));
  } else if (pg === 2) {
    g.text('HOW TO PLAY', 128, 12, c3, 'center', 2);
    [['LEFT RIGHT', 'WALK'], ['UP DOWN', 'CLIMB'], ['FIRE', 'JUMP'], ['FIRE ON A VINE', 'LET GO'], ['P', 'MAP AND HELP']].forEach(([k, t], i) => { g.text(k, 22, 34 + i * 12, c1); g.text(t, 120, 34 + i * 12, c0); });
    g.text('JUMP OVER THE BARRELS!', 128, 100, c3, 'center');
  } else {
    g.text('MEET THE JUNGLE', 128, 12, c3, 'center', 2);
    const W1 = colors(1);
    spr(g, A.PIP.stand, 20, 36, C.pip); g.text('PIP', 26, 58, c1, 'center');
    g.sprite(A.BONGO, 46, 30, { y: c1, g: c0, b: c2, r: c3, k: BLACK }, false, 1); g.text('BONGO', 54, 58, c1, 'center');
    spr(g, A.MONKEY[0], 80, 38, C.monkey); g.text('MONKEY', 88, 58, c1, 'center');
    spr(g, A.SNAKE[0], 112, 44, W1.snake); g.text('SNAKE', 120, 58, c1, 'center');
    spr(g, A.CROC[0], 142, 44, C.croc); g.text('CROC', 154, 58, c1, 'center');
    spr(g, A.FROG[0], 184, 46, C.frog); g.text('FROG', 187, 58, c1, 'center');
    spr(g, A.BARREL[0], 216, 40, C.barrel); g.text('BARREL', 221, 58, c1, 'center');
    g.text('AND A GUARD AT THE END', 128, 80, c0, 'center'); g.text('OF EVERY WORLD...', 128, 90, c0, 'center');
  }
  if (s.save) {
    if (s.save.world > ROUND_WORLDS) { g.text(s.soon ? 'STILL GROWING...' : 'WORLD ' + s.save.world + ' SOON', 128, 122, c3, 'center', 2); g.text('YOUR GAME IS SAVED FOR IT', 128, 140, c1, 'center'); }
    else { if ((s.t >> 4) % 2) g.text('FIRE: GO ON', 128, 122, c3, 'center', 2); g.text('WORLD ' + s.save.world + ', ' + DIFF[okDiff(s.save.diff)].name, 128, 140, c1, 'center'); }
  } else {
    if ((s.t >> 4) % 2) g.text('PRESS FIRE', 128, 122, c3, 'center', 2);
    g.text('LEFT RIGHT: ' + DIFF[okDiff(s.diff)].name, 128, 140, s.diff === 2 ? c3 : c1, 'center');
  }
  g.text('HIGH ' + s.high + '   DOWN: MORE', 128, 152, c2, 'center');
  if (s.save) g.text('P: NEW GAME', 128, 166, c0, 'center');
  g.text('(C) 2026 GONEN YAROM', 128, 182, c3, 'center');
}
function drawAsk(g, s) {
  const C = colors(2), [c0, c1, c2, c3] = C.c;
  g.clear(BLACK);
  g.text('NEW GAME?', 128, 30, c3, 'center', 3);
  g.text('YOUR SAVE ON WORLD ' + s.save.world + ' WILL BE LOST', 128, 72, c0, 'center');
  g.text('LEFT RIGHT: ' + DIFF[okDiff(s.diff)].name, 128, 96, s.diff === 2 ? c3 : c1, 'center');
  if (s.askT > 30 && (s.askT >> 4) % 2) g.text('FIRE: YES, NEW GAME', 128, 124, c3, 'center');
  g.text('UP: NO, KEEP MY SAVE', 128, 142, c1, 'center');
}
function drawMap(g, s) {
  const C = colors(s.world), [c0, c1, c2, c3] = C.c;
  g.clear(BLACK);
  for (let i = 0; i < 40; i++) g.rect((i * 97 + 13) % W, (i * 53 + 7) % H, 1, 1, c2);
  g.text('THE GREAT TREE', 128, 6, c1, 'center', 2);
  drawTree(g, s, C, 0, 30, false);
  g.text('WORLD ' + s.world + ': ' + WNAMES[s.world - 1], 128, 166, c3, 'center');
  if (s.t > 30 && (s.t >> 4) % 2) g.text('FIRE: GO', 128, 178, c1, 'center');
}
function drawCard(g, s) {
  const C = colors(s.L.world), [c0, c1, c2, c3] = C.c, sc = s.L.sc;
  g.clear(BLACK);
  g.text('WORLD ' + s.L.world + ': ' + WNAMES[s.L.world - 1], 128, 50, c2, 'center');
  g.text(sc.id, 128, 66, c3, 'center', 3);
  g.text(sc.name, 128, 98, c1, 'center', sc.name.length > 15 ? 1 : 2);
  g.text('TIME ' + Math.ceil(s.time / 50) + '   LIVES ' + s.lives, 128, 126, c0, 'center');
  spr(g, A.PIP.stand, 122, 140, C.pip);
}
function drawEnd(g, s) {
  const C = colors(s.world || 2), [c0, c1, c2, c3] = C.c;
  g.clear(BLACK);
  if (s.mode === 'clear') {
    g.text(s.secretGot ? 'SECRET PASSAGE!' : 'SCREEN CLEAR!', 128, 40, c1, 'center', 2);
    if (s.secretGot) g.text('+1 LIFE   +1000', 128, 60, c3, 'center');
    g.text('TAPE PIECES ' + s.got + '/3', 128, 76, c0, 'center');
    g.text('TIME BONUS ' + s.bonusShown, 128, 92, c0, 'center');
    g.text('SCORE ' + s.score, 128, 120, c3, 'center', 2);
    return;
  }
  if (s.mode === 'over') {
    g.text('GAME OVER', 128, 50, c3, 'center', 3);
    g.text('SCORE ' + s.score, 128, 96, c1, 'center', 2);
    if (D(s).mult !== 1) g.text(D(s).name + ' X' + D(s).mult + ' = ' + finalScore(s), 128, 118, c3, 'center');
    g.text('YOUR WORLD STAYS SAVED', 128, 140, c2, 'center');
  } else {
    g.text('WELL DONE, PIP!', 128, 30, c1, 'center', 2);
    g.text('YOU CLIMBED THROUGH', 128, 60, c0, 'center'); g.text('THE ROOTS AND THE SWAMPS.', 128, 70, c0, 'center');
    g.text('THE RIVERS ARE STILL GROWING...', 128, 90, c2, 'center'); g.text('MORE OF THE GREAT TREE SOON!', 128, 100, c2, 'center');
    g.text('SCORE ' + s.score, 128, 122, c3, 'center', 2);
    if (D(s).mult !== 1) g.text(D(s).name + ' X' + D(s).mult + ' = ' + finalScore(s), 128, 142, c3, 'center');
    g.text('YOUR GAME IS SAVED FOR WORLD 3', 128, 154, c2, 'center');
  }
  if (s.t > 50 && (s.t >> 4) % 2) g.text('FIRE: TITLE', 128, 166, c1, 'center');
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
      'עכשיו יש שני עולמות, 12 מסכים. שאר העץ בדרך.',
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
      'Two worlds, 12 screens, for now. The rest of the tree is coming.',
      'P pauses and shows the map and help. Esc or "Eject cartridge" leaves.']
  },

  init(api) {
    let diff = 1;
    try { diff = okDiff(parseInt(localStorage.getItem(DIFF_KEY), 10)); } catch (e) {}
    api.state = { mode: 'title', t: 0, titleP: 0, titleT: 0, high: api.loadHigh('king'), save: loadSave(), diff, world: 1, score: 0, lives: 3 };
    stat = null;
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
export const _test = { SCREENS, loadScreen, step, platforms, OY, T, WATER, newState: (diff = 1) => ({ diff, score: 0, lives: 3, world: 1, mode: 'play' }) };
