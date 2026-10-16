// מחסנית "DRAGON EGGS" (ביצי הדרקון): משחק מקורי. דרקון עף למעלה ומטיל ביצים, ואתם תופסים אותן בסל.
// מדי פעם הוא יורק כדור אש, ואותו צריך לא לתפוס. שלושה חיים, והקצב עולה ככל שתופסים יותר.
import { W, H, PALETTES } from '../gfx.js';

const [GREEN, YELLOW, BLUE, RED] = PALETTES[0];
const C = { 1: YELLOW, 2: BLUE, 3: RED, 0: GREEN };

// הדרקון, שני פריימים של כנפיים (1 צהוב, 2 כחול, 3 אדום)
const DRAGON = [
  [
    '...33...........',
    '...333......333.',
    '....333....33133',
    '.....333..3333332',
    '..33333333333....',
    '.3333333333......',
    '33.33333333......',
    '...3333.333......',
    '...3..3...3......'
  ],
  [
    '................',
    '............333.',
    '...........33133',
    '..........3333332',
    '..33333333333....',
    '.3333333333......',
    '33.3333333.......',
    '...3333333.......',
    '...3..3...3......'
  ]
];
for (const f of DRAGON) f.forEach((row, k) => { f[k] = row.padEnd(17, '.'); });   // כל השורות באותו רוחב, כדי שהיפוך יעבוד
const EGG = ['.11.', '1111', '1111', '1111', '.11.'];
const FIRE = ['.33.', '3113', '3113', '.33.'];
const HEART = ['33.33', '33333', '.333.', '..3..'];
const BASKET_W = 30, BASKET_Y = 168, GROUND = 184;
const ITEM = 2;   // הביצים וכדורי האש מצוירים בהגדלה פי 2, כדי שיראו אותם טוב גם בטלפון

function reset(s) {
  s.score = 0; s.lives = 3; s.items = []; s.splats = [];
  s.dx = 1.2; s.x = 120; s.dropIn = 60; s.basket = (W - BASKET_W) / 2; s.hurt = 0;
}

export default {
  title: 'DRAGON EGGS',
  buttons: ['left', 'right', 'fire'],

  init(api) {
    api.state = { mode: 'title', high: api.loadHigh('eggs'), t: 0 };
    reset(api.state);
  },

  update(api) {
    const s = api.state, i = api.input, snd = api.sound;
    s.t++;
    if (s.mode !== 'play') {
      if (api.hit('fire') && s.t > 25) { reset(s); s.mode = 'play'; s.t = 0; snd.tone(440, 80, 880); }
      return;
    }
    const level = Math.min(1, s.score / 40);   // 0 בהתחלה, 1 אחרי 40 ביצים

    // הדרקון: עף ימינה ושמאלה, ולפעמים מסתובב סתם
    s.x += s.dx * (1 + level);
    if (s.x < 4 || s.x > W - 38 || Math.random() < 0.004) s.dx = -s.dx;
    s.x = Math.max(4, Math.min(W - 38, s.x));

    // מטיל: ביצה, או מדי פעם כדור אש
    if (--s.dropIn <= 0) {
      const fire = s.score >= 5 && Math.random() < 0.12 + level * 0.12;
      s.items.push({ x: s.x + 12, y: 34, fire, vy: 0.8 + level * 1.4 + Math.random() * 0.3 });
      s.dropIn = Math.round(70 - level * 42 + Math.random() * 20);
    }

    // הסל
    const speed = 2.6;
    if (i.left) s.basket -= speed;
    if (i.right) s.basket += speed;
    s.basket = Math.max(0, Math.min(W - BASKET_W, s.basket));

    for (const it of s.items) {
      it.y += it.vy;
      const w = 4 * ITEM, h = (it.fire ? 4 : 5) * ITEM;
      if (!it.done && it.y + h >= BASKET_Y && it.y < BASKET_Y + 4 && it.x + w > s.basket && it.x < s.basket + BASKET_W) {
        it.done = true;
        if (it.fire) { s.lives--; s.hurt = 30; snd.noise(300); }
        else { s.score++; snd.tone(660 + (s.score % 5) * 110, 60); }
      } else if (!it.done && it.y + h >= GROUND) {
        it.done = true;
        if (!it.fire) { s.lives--; s.hurt = 30; s.splats.push({ x: it.x - 2, t: 40 }); snd.tone(180, 200, 60); }
      }
    }
    s.items = s.items.filter(it => !it.done);
    for (const sp of s.splats) sp.t--;
    s.splats = s.splats.filter(sp => sp.t > 0);
    if (s.hurt) s.hurt--;

    if (s.lives <= 0) {
      s.mode = 'over'; s.t = 0;
      if (s.score > s.high) { s.high = s.score; api.saveHigh('eggs', s.high); s.newHigh = true; } else s.newHigh = false;
      api.submitScore('eggs', s.score);
      snd.tone(330, 500, 80);
    }
  },

  draw(api) {
    const g = api.gfx, s = api.state;
    g.clear(GREEN);
    g.rect(0, GROUND, W, H - GROUND, BLUE);

    if (s.mode === 'title') {
      g.text('DRAGON EGGS', W / 2, 30, RED, 'center', 3);
      g.sprite(DRAGON[(s.t >> 4) & 1], W / 2 - 24, 64, C, false, 3);
      g.text('CATCH THE EGGS.', W / 2, 108, BLUE, 'center');
      g.text('DO NOT CATCH THE FIRE!', W / 2, 120, BLUE, 'center');
      if ((s.t >> 4) & 1) g.text('PRESS FIRE TO START', W / 2, 146, RED, 'center');
      if (s.high) g.text('HIGH SCORE ' + s.high, W / 2, 162, BLUE, 'center');
      g.text('(C) 2026 GONENYAROM', W / 2, GROUND + 2, YELLOW, 'center');
      return;
    }

    // הדרקון והחפצים
    g.sprite(DRAGON[(api.frame >> 3) & 1], s.x, 14, C, s.dx < 0, 2);
    for (const it of s.items) g.sprite(it.fire ? FIRE : EGG, it.x, it.y, C, false, ITEM);
    for (const sp of s.splats) { g.rect(sp.x, GROUND - 3, 14, 3, YELLOW); g.rect(sp.x + 4, GROUND - 5, 6, 2, YELLOW); }

    // הסל (מהבהב כשנפגעים)
    if (!(s.hurt && (s.hurt >> 2) & 1)) {
      const bx = Math.round(s.basket);
      g.rect(bx, BASKET_Y, BASKET_W, 2, BLUE);
      g.rect(bx + 1, BASKET_Y + 2, BASKET_W - 2, 6, BLUE);
      for (let k = 3; k < BASKET_W - 2; k += 4) g.rect(bx + k, BASKET_Y + 3, 2, 4, YELLOW);
      g.rect(bx, BASKET_Y + 8, BASKET_W, 2, BLUE);
    }

    // ניקוד וחיים
    g.text('SCORE ' + s.score, 4, 4, BLUE);
    for (let k = 0; k < s.lives; k++) g.sprite(HEART, W - 10 - k * 8, 5, C);

    if (s.mode === 'over') {
      g.rect(40, 70, W - 80, 52, BLUE);
      g.text('GAME OVER', W / 2, 76, YELLOW, 'center', 2);
      g.text(s.newHigh ? 'NEW HIGH SCORE ' + s.score + '!' : 'SCORE ' + s.score + '  HIGH ' + s.high, W / 2, 96, YELLOW, 'center');
      if ((s.t >> 4) & 1 && s.t > 25) g.text('PRESS FIRE', W / 2, 108, YELLOW, 'center');
    }
  }
};
