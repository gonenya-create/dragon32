// מחסנית "DRAGON TOWER" (מגדל הדרקון): משחק מקורי ברוח משחקי הסולמות והחביות של תחילת שנות ה-80.
// הדרקון יושב בראש המגדל ומגלגל חביות במורד הקורות. אתם ילד עם כובע מצחייה, שמטפס בסולמות, קופץ מעל
// החביות, ומנסה להגיע לקלטת האבודה שלמעלה. כל קלטת שמחזירים = שלב חדש, מהיר יותר.
import { W, PALETTES } from '../gfx.js';

const [BUFF, CYAN, MAGENTA, ORANGE] = PALETTES[1];
const C = { 0: BUFF, 1: CYAN, 2: MAGENTA, 3: ORANGE };

// ---------- המגדל ----------
// קורות: מ-x0 עד x1, הגובה בקצה השמאלי yL ובימני yR (השיפוע קובע לאן החביות מתגלגלות)
const GIRDERS = [
  { x0: 0, x1: 256, yL: 184, yR: 184 },
  { x0: 0, x1: 232, yL: 150, yR: 157 },
  { x0: 24, x1: 256, yL: 127, yR: 120 },
  { x0: 0, x1: 232, yL: 90, yR: 97 },
  { x0: 24, x1: 256, yL: 67, yR: 60 },
  { x0: 0, x1: 150, yL: 34, yR: 34 }
];
const LADDERS = [
  { x: 200, lower: 0, upper: 1 },
  { x: 48, lower: 1, upper: 2 }, { x: 140, lower: 1, upper: 2 },
  { x: 204, lower: 2, upper: 3 },
  { x: 60, lower: 3, upper: 4 }, { x: 156, lower: 3, upper: 4 },
  { x: 120, lower: 4, upper: 5 }
];
const TOP = GIRDERS.length - 1;
const GOAL_X = 134;

function gy(g, x) {
  const G = GIRDERS[g];
  return G.yL + (G.yR - G.yL) * (x - G.x0) / (G.x1 - G.x0);
}
function onGirder(g, x) { const G = GIRDERS[g]; return x >= G.x0 && x <= G.x1; }
function downhill(g) { const G = GIRDERS[g]; return G.yR > G.yL ? 1 : -1; }   // הרצפה שטוחה: החביות יוצאות שמאלה

// ---------- ציורים (0 בז', 1 תכלת, 2 סגול, 3 כתום) ----------
const KID = {
  walk: [
    ['..2222..', '.222222.', '..3333..', '..3.33..', '...33...', '.111111.', '1.1111.1', '3.1111.3', '..2222..', '..2..2..', '.22..22.', '.22..22.'],
    ['..2222..', '.222222.', '..3333..', '..3.33..', '...33...', '.111111.', '1.1111.1', '3.1111.3', '..2222..', '..2.2...', '..22.2..', '..22.22.']
  ],
  climb: [
    ['3.2222.3', '12222221', '1.3333.1', '..3333..', '...33...', '.111111.', '..1111..', '..1111..', '..2222..', '..2..2..', '..2..22.', '.22.....'],
    ['3.2222.3', '12222221', '1.3333.1', '..3333..', '...33...', '.111111.', '..1111..', '..1111..', '..2222..', '..2..2..', '.22..2..', '.....22.']
  ]
};
const BARREL = [
  ['..3333..', '.322223.', '33333333', '32222223', '33333333', '.322223.', '..3333..'],
  ['..3333..', '.333333.', '32222223', '33333333', '32222223', '.333333.', '..3333..']
];
const DRAGON = [
  ['...33...........', '...333......333.', '....333....33133', '.....333..333333', '..33333333333...', '.3333333333.....', '33.33333333.....', '...3333.333.....', '...3..3...3.....'],
  ['................', '............333.', '...........33133', '..........333333', '..33333333333...', '.3333333333.....', '33.3333333......', '...3333333......', '...3..3...3.....']
];
const TAPE = ['222222222222', '211111111112', '213312213312', '211111111112', '222222222222'];
const LIFE = ['.22.', '2222', '.33.', '.11.'];

const KID_W = 8, KID_H = 12, BAR = 8;

function newLevel(s) {
  s.kid = { x: 28, y: gy(0, 32) - KID_H, g: 0, vx: 0, vy: 0, air: false, climb: null, face: 1, step: 0, fallFrom: 0 };
  s.barrels = [];
  s.throwIn = 60;
  s.bonus = 3000;
  s.phase = 'play';
  s.t = 0;
  s.dragonAnim = 0;
}

function die(s, snd) {
  if (s.phase !== 'play') return;
  s.phase = 'dead'; s.t = 0;
  snd.noise(400);
  snd.tone(400, 700, 60);
}

export default {
  title: 'DRAGON TOWER',
  fireLabel: 'JUMP',
  buttons: ['left', 'up', 'down', 'right', 'fire'],

  init(api) {
    api.state = { mode: 'title', high: api.loadHigh('tower'), t: 0, score: 0, lives: 3, level: 1 };
    newLevel(api.state);
  },

  update(api) {
    const s = api.state, i = api.input, snd = api.sound;
    s.t++;

    if (s.mode !== 'play') {
      if (api.hit('fire') && s.t > 25) {
        s.mode = 'play'; s.score = 0; s.lives = 3; s.level = 1;
        newLevel(s);
        snd.tone(330, 90, 660);
      }
      return;
    }

    if (s.phase === 'dead') {
      if (s.t > 90) {
        s.lives--;
        if (s.lives <= 0) {
          s.mode = 'over'; s.t = 0;
          s.newHigh = s.score > s.high;
          if (s.newHigh) { s.high = s.score; api.saveHigh('tower', s.high); }
          api.submitScore('tower', s.score);
        } else newLevel(s);
      }
      return;
    }
    if (s.phase === 'won') {
      if (s.t > 120) { s.level++; newLevel(s); }
      return;
    }

    // שעון הבונוס: יורד ב-100 כל שתי שניות. נגמר = נפילה
    if (s.t % 100 === 0) { s.bonus -= 100; if (s.bonus <= 0) { s.bonus = 0; die(s, snd); return; } }

    const k = s.kid;
    const cx = () => k.x + KID_W / 2;

    // ---------- הילד ----------
    if (k.climb) {
      const L = k.climb;
      const top = gy(L.upper, L.x), bottom = gy(L.lower, L.x);
      if (i.up) { k.y -= 0.8; k.step++; }
      if (i.down) { k.y += 0.8; k.step++; }
      if (k.y + KID_H <= top) { k.y = top - KID_H; k.g = L.upper; k.climb = null; }
      else if (k.y + KID_H >= bottom) { k.y = bottom - KID_H; k.g = L.lower; k.climb = null; }
    } else if (k.air) {
      k.x = Math.max(0, Math.min(W - KID_W, k.x + k.vx));
      const before = k.y + KID_H;
      k.vy += 0.18;
      k.y += k.vy;
      const feet = k.y + KID_H;
      // נוחתים על הקורה הראשונה שחוצים כלפי מטה
      if (k.vy > 0) {
        for (let g = TOP; g >= 0; g--) {
          if (!onGirder(g, cx())) continue;
          const y = gy(g, cx());
          if (before <= y + 0.5 && feet >= y) {
            k.y = y - KID_H; k.g = g; k.air = false; k.vy = 0;
            if (y - k.fallFrom > 30) die(s, snd);   // נפילה גבוהה מדי
            break;
          }
        }
      }
      // מעל ראש החביות בזמן קפיצה: 100 נקודות לכל חבית
      for (const b of s.barrels) {
        if (!b.scored && b.x + BAR > k.x && b.x < k.x + KID_W && b.y > k.y + KID_H - 2 && b.y - (k.y + KID_H) < 22) {
          b.scored = true; s.score += 100; snd.tone(1200, 50, 1600);
        }
      }
      if (k.y > 200) die(s, snd);
    } else {
      // הולכים על הקורה
      k.vx = 0;
      if (i.left) { k.vx = -1; k.face = -1; }
      if (i.right) { k.vx = 1; k.face = 1; }
      if (k.vx) { k.x = Math.max(0, Math.min(W - KID_W, k.x + k.vx)); k.step++; if (k.step % 8 === 0) snd.tone(90, 25); }
      if (!onGirder(k.g, cx())) {
        k.air = true; k.vy = 0; k.vx = 0; k.fallFrom = k.y + KID_H;   // הלכו מעבר לקצה
      } else {
        k.y = gy(k.g, cx()) - KID_H;
        // סולם: למעלה מהתחתית, או למטה מהראש
        const near = L => Math.abs(cx() - L.x) <= 3;
        const up = LADDERS.find(L => L.lower === k.g && near(L));
        const down = LADDERS.find(L => L.upper === k.g && near(L));
        if (i.up && up) { k.climb = up; k.x = up.x - KID_W / 2; }
        else if (i.down && down) { k.climb = down; k.x = down.x - KID_W / 2; k.y += 1; }
        else if (api.hit('fire')) {
          k.air = true; k.vy = -2.4; k.vx = k.vx * 1.1; k.fallFrom = k.y + KID_H;
          snd.tone(300, 120, 700);
        }
      }
    }

    // הגעתם לקלטת!
    if (!k.climb && !k.air && k.g === TOP && Math.abs(cx() - GOAL_X - 6) < 7) {
      s.phase = 'won'; s.t = 0;
      s.score += s.bonus;
      [523, 659, 784, 1047].forEach((f, n) => setTimeout(() => snd.tone(f, 140), n * 150));
      return;
    }

    // ---------- הדרקון והחביות ----------
    if (--s.throwIn <= 0) {
      s.barrels.push({ x: 22, y: gy(TOP, 26) - 7, g: TOP, dir: 1, mode: 'roll', vy: 0, turn: 0 });
      s.throwIn = Math.max(70, 150 - s.level * 20) + Math.floor(Math.random() * 50);
      s.dragonAnim = 20;
      snd.tone(150, 80);
    }
    if (s.dragonAnim) s.dragonAnim--;

    const speed = 0.9 + 0.25 * Math.min(s.level - 1, 4);
    const ladderChance = 0.12 + 0.06 * Math.min(s.level - 1, 3);
    for (const b of s.barrels) {
      const bc = b.x + BAR / 2;
      if (b.mode === 'roll') {
        b.x += b.dir * speed;
        b.turn += speed;
        const c = b.x + BAR / 2;
        if (!onGirder(b.g, c)) { b.mode = 'fall'; b.vy = 0.5; }
        else {
          b.y = gy(b.g, c) - 7;
          // לפעמים חבית מתגלגלת במורד סולם
          const L = LADDERS.find(L => L.upper === b.g && Math.abs(c - L.x) < speed / 2 + 0.01);
          if (L && Math.random() < ladderChance) { b.mode = 'ladder'; b.ladder = L; b.x = L.x - BAR / 2; }
        }
      } else if (b.mode === 'ladder') {
        b.y += 1.1;
        const bottom = gy(b.ladder.lower, b.ladder.x) - 7;
        if (b.y >= bottom) { b.y = bottom; b.g = b.ladder.lower; b.dir = downhill(b.g); b.mode = 'roll'; }
      } else {
        // נופלת לקורה שמתחת
        b.vy += 0.15;
        b.y += b.vy;
        for (let g = b.g - 1; g >= 0; g--) {
          if (onGirder(g, bc) && b.y + 7 >= gy(g, bc)) {
            b.g = g; b.mode = 'roll'; b.dir = downhill(g); b.y = gy(g, bc) - 7;
            snd.tone(70, 40);
            break;
          }
        }
      }
      // פגיעה בילד (קופסאות קצת קטנות מהציור, כדי שזה ירגיש הוגן)
      if (b.x + BAR - 2 > k.x + 1 && b.x + 2 < k.x + KID_W - 1 && b.y + 6 > k.y + 2 && b.y + 1 < k.y + KID_H - 1) die(s, snd);
    }
    s.barrels = s.barrels.filter(b => b.x > -12 && b.x < W + 12 && b.y < 200);
  },

  draw(api) {
    const g = api.gfx, s = api.state;
    g.clear(BUFF);

    if (s.mode === 'title') {
      g.text('DRAGON TOWER', W / 2, 24, MAGENTA, 'center', 3);
      g.sprite(DRAGON[(s.t >> 4) & 1], 52, 58, C, false, 3);
      g.sprite(TAPE, 150, 78, C, false, 3);
      g.text('CLIMB THE LADDERS, JUMP THE', W / 2, 118, MAGENTA, 'center');
      g.text('BARRELS, AND BRING BACK', W / 2, 128, MAGENTA, 'center');
      g.text('THE LOST TAPE!', W / 2, 138, MAGENTA, 'center');
      if ((s.t >> 4) & 1) g.text('PRESS JUMP TO START', W / 2, 158, ORANGE, 'center');
      if (s.high) g.text('HIGH SCORE ' + s.high, W / 2, 172, CYAN, 'center');
      return;
    }

    // קורות: פסים עם מסמרות
    GIRDERS.forEach((G, n) => {
      for (let x = G.x0; x < G.x1; x += 2) {
        const y = Math.round(gy(n, x + 1));
        g.rect(x, y, 2, 1, MAGENTA);
        g.rect(x, y + 3, 2, 1, MAGENTA);
        if (x % 8 === 0) g.rect(x, y + 1, 1, 2, MAGENTA);
      }
    });
    // סולמות
    for (const L of LADDERS) {
      const top = Math.round(gy(L.upper, L.x)) + 4, bottom = Math.round(gy(L.lower, L.x));
      g.rect(L.x - 4, top, 1, bottom - top, CYAN);
      g.rect(L.x + 3, top, 1, bottom - top, CYAN);
      for (let y = top + 2; y < bottom; y += 4) g.rect(L.x - 3, y, 6, 1, CYAN);
    }

    // הדרקון, הקלטת
    g.sprite(DRAGON[s.dragonAnim ? 1 : (s.t >> 5) & 1], 2, 25, C);
    g.sprite(TAPE, GOAL_X, 28, C);
    if ((s.t >> 3) & 1 && s.phase === 'play') g.text('!', GOAL_X + 5, 18, ORANGE);

    // חביות
    for (const b of s.barrels) g.sprite(BARREL[(Math.floor(b.turn / 4) + (b.mode === 'ladder' ? 1 : 0)) & 1], b.x, b.y, C);

    // הילד
    const k = s.kid;
    if (s.phase === 'dead') {
      if ((s.t >> 2) & 1) g.sprite(KID.walk[0], k.x, k.y, C, (s.t >> 3) & 1);
    } else if (k.climb) {
      g.sprite(KID.climb[(k.step >> 3) & 1], k.x, k.y, C);
    } else {
      g.sprite(KID.walk[k.air ? 1 : (k.step >> 3) & 1], k.x, k.y, C, k.face < 0);
    }

    // ניקוד, בונוס, חיים, שלב
    g.text('SCORE ' + s.score, 4, 2, MAGENTA);
    g.text('BONUS ' + s.bonus, W - 4, 2, MAGENTA, 'right');
    for (let n = 0; n < s.lives; n++) g.sprite(LIFE, 160 + n * 6, 30, C);
    g.text('L' + s.level, 160, 40, CYAN);

    if (s.phase === 'won') {
      g.rect(48, 80, W - 96, 34, MAGENTA);
      g.text('YOU GOT THE TAPE!', W / 2, 86, BUFF, 'center');
      g.text('BONUS ' + s.bonus, W / 2, 100, ORANGE, 'center');
    }
    if (s.mode === 'over') {
      g.rect(36, 74, W - 72, 52, MAGENTA);
      g.text('GAME OVER', W / 2, 80, BUFF, 'center', 2);
      g.text(s.newHigh ? 'NEW HIGH SCORE ' + s.score + '!' : 'SCORE ' + s.score + '  HIGH ' + s.high, W / 2, 100, ORANGE, 'center');
      if ((s.t >> 4) & 1 && s.t > 25) g.text('PRESS JUMP', W / 2, 112, BUFF, 'center');
    }
  }
};
