// מחסנית "JUNGLE SWING" (נדנדת הג'ונגל): משחק מקורי ברוח משחקי הג'ונגל של תחילת שנות ה-80.
// רצים ימינה דרך הג'ונגל: קופצים על חבל, מתנדנדים, ומשחררים בזמן הנכון כדי לנחות על הגדה שמעבר לביצה.
// כל מסך שונה: ביצה עם חבל, בולי עץ, בריכת תנינים, שתי בורות, ובסוף ביצת לילה רחבה. יוצאים מימין = מסך חדש.
// אחרי שישה מסכים הסיבוב מתחיל שוב, מהר יותר.
import { W, PALETTES } from '../gfx.js';

const [GREEN, YELLOW, BLUE, RED] = PALETTES[0];
const BLACK = '#000000';
const C = { 0: GREEN, 1: YELLOW, 2: BLUE, 3: RED, 4: BLACK };

const GROUND = 150;          // גובה הקרקע
const PIVOT_Y = 24, ROPE = 100, SWING = 0.9;

// המסכים. pits: בורות מים (l עד r), crocs: כמה תנינים בבור; rope: איפה החבל תלוי (או בלי חבל);
// logs: כמה בולי עץ; trees: איפה הגזעים; trunk: צבע הגזעים. כל מסך נבדק שאפשר לעבור אותו.
const LAYOUTS = [
  { name: 'THE SWAMP', pits: [{ l: 92, r: 176 }], rope: 128, logs: 0, trees: [20, 60, 196, 236], trunk: 3 },
  { name: 'ROLLING LOGS', pits: [{ l: 92, r: 176 }], rope: 128, logs: 1, trees: [10, 44, 210, 244], trunk: 3 },
  { name: 'CROCODILE POND', pits: [{ l: 96, r: 176, crocs: 3 }], rope: null, logs: 0, trees: [30, 70, 200, 230], trunk: 2 },
  { name: 'TWIN PITS', pits: [{ l: 40, r: 76 }, { l: 150, r: 186 }], rope: null, logs: 1, trees: [16, 110, 124, 236], trunk: 3 },
  { name: 'CROCS AND ROPE', pits: [{ l: 92, r: 176, crocs: 3 }], rope: 128, logs: 1, trees: [24, 56, 200, 240], trunk: 2 },
  { name: 'NIGHT SWAMP', pits: [{ l: 84, r: 184 }], rope: 134, logs: 2, trees: [12, 40, 220, 246], trunk: 2, night: true }
];
const crocX = (pit, k) => pit.l + 6 + k * 26;

// הרץ (4 שחור, 3 אדום, 1 צהוב): ריצה בשני פריימים, קפיצה, ותלייה על חבל
const RUNNER = {
  run: [
    ['..44....', '.4444...', '..11....', '..11....', '.3333...', '3.333...', '1.333...', '..33.1..', '..2.2...', '.2...2..', '.2....2.', '22.....2'],
    ['..44....', '.4444...', '..11....', '..11....', '.3333...', '.33331..', '.3333...', '1.33....', '..22....', '..2.2...', '..2.2...', '.22.22..']
  ],
  jump: ['..44....', '.4444...', '..11...1', '..11..3.', '.33333..', '3.333...', '1.333...', '..33....', '..2222..', '.2....2.', '22......', '........'],
  hang: ['1.44.1..', '34444.3.', '.3113.3.', '..11.3..', '.3333...', '..333...', '..333...', '..33....', '..22....', '..2.2...', '..2.2...', '.22.22..']
};
// תנינים ירוקים עם עין צהובה, כדי שיבלטו על המים הכחולים
const CROC_OPEN = ['.........00.0.0.', '.0010000000000..', '0000000000000000', '.00000000000000.'];
const CROC_SHUT = ['................', '.0010000000000..', '0000000000000000', '.00000000000000.'];
const LOG = ['.111111.', '13111131', '11111111', '13111131', '.111111.'];

function newScreen(s) {
  const n = s.screen;
  s.L = LAYOUTS[n % LAYOUTS.length];
  s.speedUp = 1 + Math.floor(n / LAYOUTS.length) * 0.2;   // כל סיבוב מהיר יותר
  s.logs = [];
  for (let k = 0; k < s.L.logs; k++) s.logs.push({ x: W + 30 + k * 90, spin: 0 });
  s.crocT = 0;
  s.ropeT = 0;
  s.banner = 70;             // שם המסך מופיע לרגע למעלה
}

function reset(s) {
  s.score = 0; s.lives = 3; s.screen = 0; s.time = 0;
  s.p = { x: 12, y: GROUND - 12, vx: 0, vy: 0, mode: 'run', step: 0, face: 1 };
  s.phase = 'play'; s.t = 0;
  newScreen(s);
}

function ropeEnd(s) {
  return { x: s.L.rope + Math.sin(s.angle) * ROPE, y: PIVOT_Y + Math.cos(s.angle) * ROPE };
}
function pitAt(s, x) { return s.L.pits.find(pit => x + 5 > pit.l && x + 3 < pit.r); }

function die(s, snd, why) {
  if (s.phase !== 'play') return;
  s.phase = 'dead'; s.t = 0; s.why = why;
  if (why === 'swamp') { snd.tone(300, 600, 50); } else { snd.noise(300); snd.tone(200, 400, 60); }
}

export default {
  title: 'JUNGLE SWING',
  fireLabel: 'JUMP',
  buttons: ['left', 'right', 'fire'],

  init(api) {
    api.state = { mode: 'title', high: api.loadHigh('jungle'), t: 0 };
    reset(api.state);
  },

  update(api) {
    const s = api.state, i = api.input, snd = api.sound;
    s.t++;
    if (s.mode !== 'play') {
      if (api.hit('fire') && s.t > 25) { s.mode = 'play'; reset(s); snd.tone(392, 90, 784); }
      return;
    }

    // החבל מתנדנד כמו מטוטלת, בקצב קבוע (מהיר יותר בשלבים מתקדמים)
    const omega = 2 * Math.PI / (150 / s.speedUp);
    s.ropeT++;
    s.angle = SWING * Math.sin(omega * s.ropeT - Math.PI / 2);
    s.av = SWING * omega * Math.cos(omega * s.ropeT - Math.PI / 2);

    if (s.phase === 'dead') {
      if (s.t > 80) {
        s.lives--;
        if (s.lives <= 0) {
          s.mode = 'over'; s.t = 0;
          s.newHigh = s.score > s.high;
          if (s.newHigh) { s.high = s.score; api.saveHigh('jungle', s.high); }
          api.submitScore('jungle', s.score);
        } else {
          s.p = { x: 12, y: GROUND - 12, vx: 0, vy: 0, mode: 'run', step: 0, face: 1 };
          s.phase = 'play';
          newScreen(s);
        }
      }
      return;
    }

    s.crocT++;
    if (s.banner) s.banner--;
    const p = s.p;
    const overPit = () => !!pitAt(s, p.x);
    const crocUnder = () => {
      const pit = pitAt(s, p.x);
      if (!pit || !pit.crocs) return false;
      for (let k = 0; k < pit.crocs; k++) if (Math.abs(p.x + 4 - (crocX(pit, k) + 8)) < 9) return true;
      return false;
    };
    if (p.noGrab) p.noGrab--;
    if (p.mode === 'run') {
      p.vx = 0;
      if (i.left) { p.vx = -1.3; p.face = -1; }
      if (i.right) { p.vx = 1.3; p.face = 1; }
      p.x += p.vx;
      if (p.vx) { p.step++; if (p.step % 10 === 0) snd.tone(110, 20); }
      if (api.hit('fire')) { p.mode = 'air'; p.vy = -2.5; p.vx = p.vx * 1.15; p.onCroc = false; snd.tone(330, 100, 660); }
      else if (p.onCroc) {
        // עומדים על גב תנין: אם הוא פותח את הפה, או שירדנו ממנו למים, נופלים
        p.y = GROUND - 15;
        if (!overPit()) p.onCroc = false;
        else if (!crocUnder() || crocOpen(s)) { p.onCroc = false; p.mode = 'air'; p.vy = 0.5; }
      } else {
        p.y = GROUND - 12;
        if (overPit()) { p.mode = 'air'; p.vy = 0; }   // נכנסים לביצה בהליכה
      }
    } else if (p.mode === 'air') {
      p.x += p.vx;
      p.vy += 0.15;
      p.y += p.vy;
      // תופסים את החבל אם עוברים לידו
      const e = s.L.rope ? ropeEnd(s) : { x: -99, y: -99 };
      if (!p.noGrab && Math.abs(p.x + 4 - e.x) < 8 && Math.abs(p.y + 2 - e.y) < 10) { p.mode = 'rope'; snd.tone(520, 60); }
      // נחיתה: על הקרקע, על גב תנין סגור, או למים
      else if (p.vy > 0 && overPit() && crocUnder() && !crocOpen(s) && p.y >= GROUND - 15 && p.y < GROUND - 10) {
        p.y = GROUND - 15; p.mode = 'run'; p.vy = 0; p.onCroc = true;
      } else if (p.y >= GROUND - 12 && !overPit()) {
        p.y = GROUND - 12; p.mode = 'run'; p.vy = 0;
      } else if (p.y > GROUND - 4) {
        die(s, snd, 'swamp');
      }
    } else if (p.mode === 'rope') {
      const e = ropeEnd(s);
      p.x = e.x - 4; p.y = e.y - 2;
      p.face = s.av >= 0 ? 1 : -1;
      if (api.hit('fire')) {
        // משחררים: התנופה של החבל ממשיכה לאוויר
        p.mode = 'air';
        p.vx = s.av * ROPE * Math.cos(s.angle) * 1.1;
        p.vy = -s.av * ROPE * Math.sin(s.angle) * 0.6 - 1.2;
        p.noGrab = 25;
        snd.tone(660, 80, 330);
      }
    }
    // בולי עץ מתגלגלים משמאל לימין (מגיעים מימין)
    for (const l of s.logs) {
      l.x -= 0.9 * s.speedUp;
      l.spin++;
      if (l.x < -10) { l.x = W + 20; l.scored = false; }
      // בול עץ שצף מעל הביצה לא פוגע (אפשר לראות אותו שט)
      const onGround = !s.L.pits.some(pit => l.x + 8 > pit.l && l.x < pit.r);
      if (onGround && p.mode !== 'rope' && p.x + 6 > l.x + 1 && p.x + 2 < l.x + 7 && p.y + 12 > GROUND - 5) die(s, snd, 'log');
      if (!l.scored && p.mode === 'air' && p.x + 4 > l.x && p.x + 4 < l.x + 8 && p.y + 12 < GROUND - 5) { l.scored = true; s.score += 50; snd.tone(990, 40); }
    }

    // מסך הבא: יוצאים מימין. חזרה שמאלה מקצה המסך לא אפשרית
    if (p.x > W - 4) {
      s.screen++; s.score += 200; p.x = 4; p.onCroc = false;
      newScreen(s);
      snd.tone(784, 60); setTimeout(() => snd.tone(1046, 90), 70);
    }
    if (p.x < 0) p.x = 0;
    s.time++;
  },

  draw(api) {
    const g = api.gfx, s = api.state;
    // שמיים, עלווה, גזעים
    g.clear(BLACK);
    if (s.mode === 'title') {
      g.text('JUNGLE SWING', W / 2, 26, GREEN, 'center', 3);
      g.rect(W / 2, 54, 1, 52, YELLOW);
      g.sprite(RUNNER.hang, W / 2 - 12, 100, C, false, 3);
      g.text('SWING ON THE ROPE OVER THE', W / 2, 146, GREEN, 'center');
      g.text('SWAMP. MIND THE CROCODILES!', W / 2, 156, GREEN, 'center');
      if ((s.t >> 4) & 1) g.text('PRESS JUMP TO START', W / 2, 172, YELLOW, 'center');
      if (s.high) g.text('HIGH SCORE ' + s.high, W / 2, 182, BLUE, 'center');
      return;
    }
    const L = s.L, leaf = L.night ? BLUE : GREEN;
    for (let x = 0; x < W; x += 16) g.rect(x, 12 + ((x * 7 + s.screen * 5) % 9), 16, 8, leaf);
    g.rect(0, 0, W, 14, leaf);
    if (L.night) for (let k = 0; k < 12; k++) g.rect((k * 53 + 17) % W, 30 + (k * 29) % 70, 1, 1, YELLOW);   // כוכבים
    for (const tx of L.trees) g.rect(tx, 14, 6, GROUND - 14, C[L.trunk]);
    // קרקע ובורות
    g.rect(0, GROUND, W, 42, YELLOW);
    for (const pit of L.pits) {
      g.rect(pit.l, GROUND, pit.r - pit.l, 14, BLUE);
      for (let x = pit.l + 2; x < pit.r - 4; x += 8) g.rect(x + ((s.t >> 3) % 4), GROUND + 3, 3, 1, leaf === BLUE ? YELLOW : GREEN);
      for (let k = 0; k < (pit.crocs || 0); k++) g.sprite(crocOpen(s) ? CROC_OPEN : CROC_SHUT, crocX(pit, k), GROUND - 3, C);
    }
    // החבל
    if (L.rope) {
      const e = ropeEnd(s);
      for (let k = 0; k <= 40; k++) g.rect(L.rope + (e.x - L.rope) * k / 40, PIVOT_Y + (e.y - PIVOT_Y) * k / 40, 1, 2, YELLOW);
    }
    // בולי עץ
    for (const l of s.logs) {
      const inPit = s.L.pits.some(pit => l.x + 8 > pit.l && l.x < pit.r);
      g.sprite(LOG, l.x, inPit ? GROUND - 2 : GROUND - 5, C, (l.spin >> 3) & 1);
    }
    // הרץ
    const p = s.p;
    if (!(s.phase === 'dead' && (s.t >> 2) & 1)) {
      const spr = p.mode === 'rope' ? RUNNER.hang : p.mode === 'air' ? RUNNER.jump : RUNNER.run[(p.step >> 3) & 1];
      if (!(s.phase === 'dead' && s.why === 'swamp')) g.sprite(spr, p.x, p.y, C, p.face < 0);
    }
    // ניקוד
    g.rect(0, GROUND + 18, W, 24, BLACK);
    g.text('SCORE ' + s.score, 4, GROUND + 22, YELLOW);
    g.text('SCREEN ' + (s.screen + 1), W - 4, GROUND + 22, GREEN, 'right');
    for (let n = 0; n < s.lives; n++) g.rect(4 + n * 8, GROUND + 33, 5, 5, RED);
    // שם המסך החדש, ואחרי שעוברים את כל הבורות: חץ מהבהב ימינה
    if (s.banner && s.phase === 'play') g.text(L.name, W / 2, 30, YELLOW, 'center', 2);
    const lastPit = L.pits[L.pits.length - 1];
    if (s.phase === 'play' && p.mode === 'run' && p.x > lastPit.r && (s.t >> 3) & 1) {
      for (let k = 0; k < 5; k++) g.rect(W - 18 + k, GROUND - 22 + k, 1, 11 - 2 * k, YELLOW);
      g.rect(W - 26, GROUND - 17, 8, 1, YELLOW);
    }

    if (s.mode === 'over') {
      g.rect(36, 60, W - 72, 52, BLUE);
      g.text('GAME OVER', W / 2, 66, YELLOW, 'center', 2);
      g.text(s.newHigh ? 'NEW HIGH SCORE ' + s.score + '!' : 'SCORE ' + s.score + '  HIGH ' + s.high, W / 2, 86, YELLOW, 'center');
      if ((s.t >> 4) & 1 && s.t > 25) g.text('PRESS JUMP', W / 2, 98, GREEN, 'center');
    }
  }
};

// התנינים פותחים פה לשנייה וחצי, וסוגרים לשתי שניות
function crocOpen(s) { return (s.crocT % 175) < 75; }
