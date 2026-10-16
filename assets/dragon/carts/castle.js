// מחסנית "DRAGON CASTLE" (טירת הדרקון): משחק מקורי גדול, ברוח משחקי הפלטפורמה של 1983.
// ארבעה חדרים בטירה של הדרקון. בכל חדר אוספים את כל המפתחות, ואז הדלת נפתחת לחדר הבא.
// בדרך: שומרים שמסתובבים, עטלפים, עכבישים על חוט, רצפות שמתפוררות, קוצים, ובחדר האחרון הדרקון עצמו יורק אש.
// האוויר נגמר עם הזמן, ונפילה גבוהה מדי כואבת. חצים לזוז ולטפס, רווח לקפוץ, P לעצירה.
import { W, PALETTES, BLACK } from '../gfx.js';

const [GREEN, YELLOW, BLUE, RED] = PALETTES[0];
const C = { 0: GREEN, 1: YELLOW, 2: BLUE, 3: RED };
const T = 8, COLS = 32, ROWS = 22, HUD = ROWS * T;   // לוח של 32×22 משבצות, ושורת מידע למטה

// ---------- החדרים ----------
// P: רצפה (מ-עמודה עד-עמודה), '=' רצפה שמתפוררת. L: סולם בעמודה, משורת הרצפה העליונה עד התחתונה.
// K: מפתח. X: קוצים. D: הדלת (2×2 משבצות). S: נקודת ההתחלה (שורת הרצפה שעומדים עליה).
// אויבים: walk (הולך על רצפה), bat (עף הלוך וחזור בגל), spider (יורד ועולה על חוט), dragon (יורק אש לאורך שורה).
const ROOMS = [
  {
    name: 'THE GATE', start: [21, 1], door: [3, 29],
    P: [[21, 0, 31], [17, 0, 12], [17, 18, 31], [13, 4, 27], [9, 0, 10], [9, 16, 31], [5, 20, 31]],
    L: [[10, 17, 21], [28, 17, 21], [6, 13, 17], [24, 13, 17], [8, 9, 13], [20, 9, 13], [26, 5, 9]],
    K: [[20, 15], [16, 2], [12, 16], [8, 2], [18, 25]],
    X: [],
    E: [{ type: 'walk', row: 21, x0: 120, x1: 240, v: 0.6 }, { type: 'walk', row: 13, x0: 40, x1: 200, v: 0.7 },
      { type: 'bat', y: 52, x0: 90, x1: 230, v: 0.6 }]
  },
  {
    name: 'CRUMBLING HALL', start: [21, 1], door: [3, 1],
    P: [[21, 0, 31], [17, 0, 8], [17, 10, 21, '='], [17, 23, 31], [13, 0, 13], [13, 18, 31], [9, 4, 11], [9, 12, 19, '='], [9, 20, 27], [5, 0, 9]],
    L: [[4, 17, 21], [28, 17, 21], [2, 13, 17], [29, 13, 17], [6, 9, 13], [25, 9, 13], [7, 5, 9]],
    K: [[16, 15], [20, 20], [12, 16], [8, 16], [20, 30]],
    X: [[20, 12, 15], [12, 9, 10]],
    E: [{ type: 'spider', x: 160, y0: 80, y1: 128, v: 0.5 }, { type: 'spider', x: 72, y0: 108, y1: 158, v: 0.7 },
      { type: 'walk', row: 21, x0: 136, x1: 240, v: 0.8 }]
  },
  {
    name: 'BAT CAVE', start: [21, 1], door: [4, 29],
    P: [[21, 0, 31], [18, 6, 9], [18, 14, 17], [18, 22, 25], [15, 2, 5], [15, 10, 13], [15, 18, 21], [15, 26, 29],
      [12, 6, 9], [12, 14, 17], [12, 22, 25], [9, 2, 5], [9, 10, 13], [9, 18, 21], [9, 26, 31], [6, 20, 31]],
    L: [[31, 6, 9]],
    K: [[17, 7], [14, 11], [11, 15], [8, 3], [14, 27], [20, 28]],
    X: [[20, 18, 21]],
    E: [{ type: 'bat', y: 130, x0: 20, x1: 230, v: 0.55 }, { type: 'bat', y: 106, x0: 40, x1: 220, v: 0.7 },
      { type: 'bat', y: 82, x0: 10, x1: 200, v: 0.5 }]
  },
  {
    name: "DRAGON'S DEN", start: [21, 1], door: [3, 1],
    P: [[21, 0, 31], [17, 4, 31], [13, 0, 9], [13, 10, 14, '='], [13, 15, 24], [9, 6, 31], [5, 0, 14]],
    L: [[6, 17, 21], [29, 17, 21], [20, 13, 17], [8, 13, 17], [22, 9, 13], [10, 5, 9]],
    K: [[20, 30], [16, 28], [12, 2], [8, 16], [4, 12], [12, 22]],
    X: [[16, 12, 13]],
    E: [{ type: 'walk', row: 13, x0: 0, x1: 64, v: 0.6 }, { type: 'spider', x: 120, y0: 40, y1: 62, v: 0.4 },
      { type: 'dragon', row: 9, x: 224, every: 150 }]
  }
];

// ---------- ציורים (0 ירוק, 1 צהוב, 2 כחול, 3 אדום) ----------
const KID = {
  walk: [
    ['..3333..', '.333333.', '..1111..', '..1.11..', '...11...', '.222222.', '2.2222.2', '1.2222.1', '..0000..', '..0..0..', '.00..00.', '.00..00.'],
    ['..3333..', '.333333.', '..1111..', '..1.11..', '...11...', '.222222.', '2.2222.2', '1.2222.1', '..0000..', '..0.0...', '..00.0..', '..00.00.']
  ],
  climb: [
    ['1.3333.1', '23333332', '2.1111.2', '..1111..', '...11...', '.222222.', '..2222..', '..2222..', '..0000..', '..0..0..', '..0..00.', '.00.....'],
    ['1.3333.1', '23333332', '2.1111.2', '..1111..', '...11...', '.222222.', '..2222..', '..2222..', '..0000..', '..0..0..', '.00..0..', '.....00.']
  ]
};
const GUARD = [['.3333...', '333333..', '3.1.13..', '333333..', '.2222...', '222222..', '.2..2...', '.2..2...'],
  ['.3333...', '333333..', '3.1.13..', '333333..', '.2222...', '222222..', '..22....', '.2..2...']];
const BAT = [['2......2', '22.11.22', '22211222', '.222222.', '..2..2..'], ['........', '...11...', '.221122.', '22222222', '2.2..2.2']];
const SPIDER = ['.3....3.', '..3333..', '3331133.', '..3333..', '.3....3.', '3......3'];
const FIRE = [['..33....', '.3113...', '311113..', '.3113...', '..33....'], ['...33...', '..3113..', '.311113.', '..3113..', '...33...']];
const DRAGON = ['...33...........', '...333......333.', '....333....33133', '.....333..333333', '..33333333333...', '.3333333333.....', '33.33333333.....', '...3333.333.....', '...3..3...3.....'];
const KEY = ['.11.', '1..1', '.11.', '.1..', '.11.', '.1..', '.11.'];
const LIFE = ['.33.', '3333', '.11.', '.22.'];

const AIR = 2000;        // 40 שניות לכל חדר
const FALL_MAX = 52;     // נפילה גבוהה מזה = נפגעים
const JUMP_V = 3.2, GRAV = 0.18, WALK = 1.2;

// ---------- בניית חדר ----------
function build(n, loop) {
  const R = ROOMS[n];
  const grid = [];
  for (let r = 0; r < ROWS; r++) grid.push(new Array(COLS).fill(''));
  for (const [r, c0, c1, t] of R.P) for (let c = c0; c <= c1; c++) grid[r][c] = t || '#';
  for (const [r, c0, c1] of R.X) for (let c = c0; c <= c1; c++) grid[r][c] = '^';
  const ladder = [];
  for (let r = 0; r < ROWS; r++) ladder.push(new Array(COLS).fill(false));
  for (const [c, top, bottom] of R.L) for (let r = top; r < bottom; r++) ladder[r][c] = true;
  const speed = 1 + loop * 0.25;
  return {
    n, name: R.name, grid, ladder, crumble: {},
    keys: R.K.map(([r, c]) => ({ x: c * T + 2, y: r * T, got: false })),
    door: { x: R.door[1] * T, y: R.door[0] * T },
    enemies: R.E.map(e => ({ ...e, v: (e.v || 0) * speed, x: e.x0 !== undefined ? e.x0 : e.x, y: e.y0 !== undefined ? e.y0 : e.y, t: 0, every: e.every ? Math.round(e.every / speed) : 0 })),
    shots: [],
    start: { x: R.start[1] * T, y: R.start[0] * T }
  };
}

const cell = (room, c, r) => (r >= 0 && r < ROWS && c >= 0 && c < COLS ? room.grid[r][c] : '');
const isLadder = (room, c, r) => r >= 0 && r < ROWS && c >= 0 && c < COLS && room.ladder[r][c];
// אפשר לעמוד על רצפה, רצפה מתפוררת, או על ראש של סולם
const standable = (room, c, r) => cell(room, c, r) === '#' || cell(room, c, r) === '=' || (isLadder(room, c, r) && !isLadder(room, c, r - 1));

function footCols(p) { return [Math.floor((p.x + 2) / T), Math.floor((p.x + 5) / T)]; }
function onGround(room, p) {
  if (p.y % T) return false;
  const r = p.y / T;
  return footCols(p).some(c => standable(room, c, r));
}

function spawn(s) {
  s.room = build(s.n, s.loop);
  s.p = { x: s.room.start.x, y: s.room.start.y, vx: 0, vy: 0, mode: 'walk', face: 1, step: 0, fallFrom: 0 };
  s.air = AIR;
  s.dying = 0;
  s.paused = false;
}

function die(s, snd) {
  if (s.dying) return;
  s.dying = 60;
  snd.noise(260, 0.07);
  snd.tone(400, 500, 60);
}

export default {
  title: 'DRAGON CASTLE',
  fireLabel: 'JUMP',

  init(api) {
    api.state = { mode: 'title', high: api.loadHigh('castle'), t: 0 };
  },

  update(api) {
    const s = api.state, i = api.input, snd = api.sound;
    s.t++;
    if (s.mode === 'title' || s.mode === 'over') {
      if (api.hit('fire') && s.t > 25) {
        Object.assign(s, { mode: 'play', t: 0, score: 0, lives: 3, n: 0, loop: 0, paused: false });
        spawn(s);
        snd.tone(330, 90, 660);
      }
      return;
    }
    if (s.mode === 'clear') {
      // ספירת האוויר שנשאר לנקודות, ואז החדר הבא
      if (s.air > 0) { const d = Math.min(25, s.air); s.air -= d; s.score += d; if (s.t % 3 === 0) snd.tone(900 + (s.air % 200), 20); return; }
      if (s.t > 60) {
        s.n++;
        if (s.n >= ROOMS.length) { s.n = 0; s.loop++; }
        spawn(s);
        s.mode = 'play'; s.t = 0;
      }
      return;
    }
    if (api.hit('pause')) { s.paused = !s.paused; snd.tone(s.paused ? 300 : 500, 60); }
    if (s.paused) return;

    const room = s.room, p = s.p;
    if (s.dying) {
      if (--s.dying === 0) {
        s.lives--;
        if (s.lives <= 0) {
          s.mode = 'over'; s.t = 0;
          if (s.score > s.high) { s.high = s.score; s.newHigh = true; } else s.newHigh = false;
          api.submitScore('castle', s.score);
        } else spawn(s);
      }
      return;
    }

    // האוויר
    if (--s.air <= 0) { die(s, snd); return; }

    // ---------- השחקן ----------
    const cx = Math.floor((p.x + 4) / T);
    if (p.mode === 'walk') {
      p.vx = (i.right ? 1 : 0) - (i.left ? 1 : 0);
      if (p.vx) { p.face = p.vx; p.x += p.vx * WALK; p.step++; }
      p.x = Math.max(0, Math.min(W - 8, p.x));
      if (i.up && isLadder(room, cx, Math.floor((p.y - 1) / T))) { p.mode = 'climb'; p.x = cx * T; }
      else if (i.down && isLadder(room, cx, p.y / T)) { p.mode = 'climb'; p.x = cx * T; }
      else if (api.hit('fire')) { p.mode = 'air'; p.vy = -JUMP_V; p.vx *= WALK; p.fallFrom = p.y; snd.tone(300, 120, 600, 0.04); }
      else if (!onGround(room, p)) { p.mode = 'air'; p.vy = 0; p.vx = 0; p.fallFrom = p.y; }
    } else if (p.mode === 'climb') {
      if (i.up && isLadder(room, cx, Math.floor((p.y - 1) / T))) { p.y -= 1; p.step++; }
      else if (i.down && isLadder(room, cx, Math.floor(p.y / T))) { p.y += 1; p.step++; }
      // יורדים מהסולם הצידה, רק כשהרגליים על רצפה
      if ((i.left || i.right) && onGround(room, p)) { p.mode = 'walk'; }
      else if (!isLadder(room, cx, Math.floor((p.y - 1) / T)) && !isLadder(room, cx, Math.floor(p.y / T))) p.mode = onGround(room, p) ? 'walk' : 'air';
    } else {
      // באוויר: קשת קבועה, כמו במשחקים של אז
      const prevY = p.y;
      p.vy = Math.min(3.5, p.vy + GRAV);
      p.y += p.vy;
      p.x += p.vx;
      if (p.x < 0 || p.x > W - 8) { p.x = Math.max(0, Math.min(W - 8, p.x)); p.vx = 0; }
      if (p.vy < 0) p.fallFrom = Math.min(p.fallFrom, p.y);
      if (p.vy > 0) {
        const r = Math.floor(p.y / T);
        if (prevY <= r * T && footCols(p).some(c => standable(room, c, r))) {
          p.y = r * T; p.vy = 0; p.mode = 'walk';
          if (p.y - p.fallFrom > FALL_MAX) die(s, snd); else snd.noise(30, 0.03);
        }
      }
      if (p.y > HUD + 12) { die(s, snd); return; }
    }

    // רצפה שמתפוררת מתחת לרגליים
    if (p.mode === 'walk' && p.y % T === 0) {
      const r = p.y / T;
      for (const c of footCols(p)) {
        if (cell(room, c, r) !== '=') continue;
        const k = r + ',' + c;
        room.crumble[k] = (room.crumble[k] || 0) + 1;
        if (room.crumble[k] > 24) { room.grid[r][c] = ''; snd.noise(20, 0.02); }
      }
    }

    // קוצים: נוגעים = נפגעים
    const box = { x0: p.x + 1, x1: p.x + 7, y0: p.y - 11, y1: p.y - 1 };
    for (let r = Math.floor(box.y0 / T); r <= Math.floor(box.y1 / T); r++) {
      for (let c = Math.floor(box.x0 / T); c <= Math.floor(box.x1 / T); c++) {
        if (cell(room, c, r) === '^' && box.y1 > r * T + 3) { die(s, snd); return; }
      }
    }

    // מפתחות
    for (const k of room.keys) {
      if (!k.got && box.x1 > k.x && box.x0 < k.x + 4 && box.y1 > k.y - 7 && box.y0 < k.y) {
        k.got = true; s.score += 100; snd.tone(1200, 50); snd.tone(1600, 80);
      }
    }
    const open = room.keys.every(k => k.got);
    if (open && box.x1 > room.door.x + 2 && box.x0 < room.door.x + 14 && box.y1 > room.door.y && box.y0 < room.door.y + 16) {
      s.mode = 'clear'; s.t = 0; s.score += 500;
      snd.tone(523, 120); setTimeout(() => snd.tone(659, 120), 130); setTimeout(() => snd.tone(784, 220), 260);
      return;
    }

    // ---------- האויבים ----------
    for (const e of room.enemies) {
      e.t++;
      if (e.type === 'walk') {
        e.x += e.v;
        if (e.x < e.x0 || e.x > e.x1) { e.v = -e.v; e.x = Math.max(e.x0, Math.min(e.x1, e.x)); }
        e.box = [e.x + 1, e.row * T - 8, e.x + 6, e.row * T];
      } else if (e.type === 'bat') {
        e.x += e.v;
        if (e.x < e.x0 || e.x > e.x1) { e.v = -e.v; e.x = Math.max(e.x0, Math.min(e.x1, e.x)); }
        e.yy = e.y + Math.sin(e.t / 12) * 8;
        e.box = [e.x + 1, e.yy, e.x + 7, e.yy + 5];
      } else if (e.type === 'spider') {
        e.y += e.v;
        if (e.y < e.y0 || e.y > e.y1) { e.v = -e.v; e.y = Math.max(e.y0, Math.min(e.y1, e.y)); }
        e.box = [e.x + 1, e.y, e.x + 7, e.y + 6];
      } else if (e.type === 'dragon') {
        e.box = [e.x + 4, e.row * T - 16, e.x + 30, e.row * T];   // לגעת בדרקון עצמו = נפגעים
        if (e.t % e.every === 0) { room.shots.push({ x: e.x - 6, y: e.row * T - 6, v: -1.6 * (1 + s.loop * 0.25) }); snd.noise(120, 0.04); }
      }
      if (e.box && box.x1 > e.box[0] && box.x0 < e.box[2] && box.y1 > e.box[1] && box.y0 < e.box[3]) { die(s, snd); return; }
    }
    for (const f of room.shots) {
      f.x += f.v;
      if (box.x1 > f.x + 1 && box.x0 < f.x + 6 && box.y1 > f.y && box.y0 < f.y + 5) { die(s, snd); return; }
    }
    room.shots = room.shots.filter(f => f.x > -10);
  },

  draw(api) {
    const g = api.gfx, s = api.state, F = api.frame;
    g.clear(BLACK);

    if (s.mode === 'title') {
      g.text('DRAGON', W / 2, 18, RED, 'center', 3);
      g.text('CASTLE', W / 2, 44, YELLOW, 'center', 3);
      g.sprite(DRAGON, W / 2 - 24, 74, C, false, 3);
      g.text('4 ROOMS. FIND EVERY KEY,', W / 2, 110, GREEN, 'center');
      g.text('THEN THE DOOR OPENS.', W / 2, 120, GREEN, 'center');
      g.text('ARROWS MOVE AND CLIMB', W / 2, 136, BLUE, 'center');
      g.text('SPACE JUMPS   P PAUSES', W / 2, 146, BLUE, 'center');
      if ((s.t >> 4) & 1) g.text('PRESS JUMP TO START', W / 2, 164, RED, 'center');
      if (s.high) g.text('HIGH SCORE ' + s.high, W / 2, 178, YELLOW, 'center');
      return;
    }
    if (!s.room) return;
    const room = s.room;

    // הלוח
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = room.grid[r][c], x = c * T, y = r * T;
        if (room.ladder[r][c]) {
          g.rect(x + 1, y, 1, T, BLUE); g.rect(x + 6, y, 1, T, BLUE);
          g.rect(x + 1, y + 2, 6, 1, BLUE); g.rect(x + 1, y + 6, 6, 1, BLUE);
        }
        if (t === '#') { g.rect(x, y, 8, 5, GREEN); g.rect(x, y + 1, 8, 1, BLACK); g.rect(x + 3, y + 2, 1, 3, BLACK); }
        else if (t === '=') {
          const k = room.crumble[r + ',' + c] || 0;
          g.rect(x, y, 8, 5 - Math.floor(k / 6), RED);
          g.rect(x + 1, y + 1, 1, 1, BLACK); g.rect(x + 5, y + 2, 1, 1, BLACK);
        } else if (t === '^') {
          for (let k = 0; k < 2; k++) { g.rect(x + k * 4 + 1, y + 7, 3, 1, RED); g.rect(x + k * 4 + 2, y + 4, 1, 3, RED); }
        }
      }
    }

    // הדלת: סגורה עם סורגים, פתוחה מהבהבת
    const open = room.keys.every(k => k.got), d = room.door;
    g.rect(d.x, d.y, 16, 16, BLUE);
    if (open) g.rect(d.x + 2, d.y + 2, 12, 14, (F >> 3) & 1 ? YELLOW : GREEN);
    else { g.rect(d.x + 2, d.y + 2, 12, 14, BLACK); for (let k = 0; k < 3; k++) g.rect(d.x + 3 + k * 4, d.y + 2, 2, 14, RED); }

    for (const k of room.keys) if (!k.got) g.sprite(KEY, k.x, k.y - 7, (F >> 3) & 1 ? C : { 1: GREEN });

    for (const e of room.enemies) {
      if (e.type === 'walk') g.sprite(GUARD[(e.t >> 3) & 1], e.x, e.row * T - 8, C, e.v < 0);
      else if (e.type === 'bat') g.sprite(BAT[(e.t >> 3) & 1], e.x, e.yy, C);
      else if (e.type === 'spider') { g.rect(e.x + 4, e.y0 - 8, 1, e.y - e.y0 + 8, GREEN); g.sprite(SPIDER, e.x, e.y, C); }
      else if (e.type === 'dragon') g.sprite(DRAGON, e.x, e.row * T - 18, C, true, 2);
    }
    for (const f of room.shots) g.sprite(FIRE[(F >> 2) & 1], f.x, f.y, C, true);

    // השחקן (מהבהב כשנפגע)
    const p = s.p;
    if (!(s.dying && (s.dying >> 2) & 1)) {
      const frames = p.mode === 'climb' ? KID.climb : KID.walk;
      g.sprite(frames[(p.step >> 3) & 1], p.x, p.y - 12, C, p.face < 0);
    }

    // שורת המידע
    g.rect(0, HUD, W, 16, BLUE);
    g.text(room.name, 4, HUD + 1, YELLOW);
    g.text(String(s.score).padStart(6, '0'), W - 4, HUD + 1, YELLOW, 'right');
    g.text('AIR', 4, HUD + 9, GREEN);
    g.rect(24, HUD + 10, Math.round(140 * Math.max(0, s.air) / AIR), 4, s.air < AIR / 5 && (F >> 3) & 1 ? RED : GREEN);
    for (let k = 0; k < s.lives; k++) g.sprite(LIFE, W - 10 - k * 7, HUD + 10, C);

    if (s.paused) { g.rect(78, 80, 100, 20, BLUE); g.text('PAUSED', W / 2, 87, YELLOW, 'center'); }
    if (s.mode === 'clear') {
      g.rect(40, 70, W - 80, 40, BLUE);
      g.text('ROOM CLEAR!', W / 2, 76, YELLOW, 'center', 2);
      g.text(s.n + 1 >= ROOMS.length ? 'THE DRAGON WAKES. AGAIN!' : 'ON TO THE NEXT ROOM', W / 2, 96, GREEN, 'center');
    }
    if (s.mode === 'over') {
      g.rect(40, 66, W - 80, 52, BLUE);
      g.text('GAME OVER', W / 2, 72, YELLOW, 'center', 2);
      g.text(s.newHigh ? 'NEW HIGH SCORE ' + s.score + '!' : 'SCORE ' + s.score + '  HIGH ' + s.high, W / 2, 92, YELLOW, 'center');
      if ((s.t >> 4) & 1 && s.t > 25) g.text('PRESS JUMP', W / 2, 104, YELLOW, 'center');
    }
  }
};

// לבדיקות: החדרים ופונקציות התנועה
export const __test = { ROOMS, build, standable, isLadder };
