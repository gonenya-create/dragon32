// JUNGLE KING, הדמיה בסגנון PMODE 3 אמיתי (גונן, 27.10: ההשוואה היא ל-Donkey King של Microdeal על ה-Dragon, 1983).
// הכללים, כמו במחשב: 128×192 פיקסלים רחבים, ורק ארבעה צבעים בכל המסך (ערכה 0: ירוק, צהוב, כחול, אדום), ואחד מהם הוא הרקע. אין שחור.
// הכל מצויר על משטח של 128 פיקסלים, ואז נמתח פי 2 לרוחב. כך אי אפשר "לרמות" בפיקסלים דקים.
// נטען מ-jungle-pm3.html
import { createGfx, PALETTES } from '/assets/dragon/gfx.js';
import { SCREENS } from '/assets/dragon/carts/king-screens.js';

const [G, Y, B, R] = PALETTES[0];
const C = { G, Y, B, R };
const out = document.getElementById('c');
const main = createGfx(out);
const off = document.createElement('canvas');
const g = createGfx(off);                 // מציירים רק ב-128 העמודות השמאליות
const LW = 128, OY = 10;
const px = (x, y, c) => g.rect(x, y, 1, 1, c);
const put = (rows, x, y, flip) => { for (let r = 0; r < rows.length; r++) for (let c = 0; c < rows[r].length; c++) { const ch = rows[r][c]; if (ch !== '.') px(x + (flip ? rows[r].length - 1 - c : c), y + r, C[ch]); } };

// ---------- דמויות (כל אות = פיקסל רחב) ----------
const PIP = ['..YYYY..', '.YYYYYY.', 'RRRRRRRR', '..YBYY..', '..YYYY..', '...YY...', '.RRRRRR.', 'YRRRRRRY', 'Y.RRRR.Y', '..RRRR..', '..GGGG..', '..GGGG..', '..G..G..', '..G..G..', '.RR..RR.'];
const PIP_RUN = ['..YYYY..', '.YYYYYY.', 'RRRRRRRR', '..YBYY..', '..YYYY..', '...YY...', '.RRRRRR.', 'YRRRRRR.', '..RRRRY.', '..RRRR..', '..GGGG..', '.GG..GG.', 'GG....GG', 'G......G', 'RR....RR'];
const MONKEY = ['.GGGG....', 'GYYYYG...', 'GYBYBG..G', 'GYYYYG..G', 'GYRRYG..G', '.GGGG..G.', 'GGYYGGG..', 'G.YY.G...', '..GGG....', '.G...G...', 'YY...YY..'];
const BARREL = [
  ['..YYY..', '.YRRRY.', 'YRRYRRY', 'YRYRRRY', 'YRRRYRY', 'YRRYRRY', '.YRRRY.', '..YYY..'],
  ['..YYY..', '.YRYRY.', 'YRRRRRY', 'YYYYYYY', 'YRRRRRY', 'YRRRRRY', '.YRYRY.', '..YYY..']
];
const SNAKE = ['.......GG.', '......GYGG', 'G....GG.R.', 'GG..GG....', '.GGGG.....'];
const TAPE = ['YYYYY', 'YRYRY', 'YYYYY'];
const LIFE = ['.YY.', 'RRRR', '.YY.', '.GG.'];

// ---------- אריחים: 4 פיקסלים רחבים על 8 שורות ----------
// שורש: קו אור צהוב, קליפה אדומה עם טבעות צהובות שחוזרות, ומתחת שורשונים
const ROOT = [
  ['YY.Y', 'RRYR', 'RRRR', 'RYRR', 'RRRR', 'RRRY', '.RR.', '....'],
  ['GYYY', 'RGRR', 'RRRR', 'RRYR', 'RRRR', 'RYRR', 'RRRR', '.R..'],
  ['YYYG', 'RRRR', 'YRRR', 'RRRR', 'RRYR', 'RRRR', '..R.', '....'],
  ['Y.YY', 'RYRR', 'RRRR', 'RRRY', 'RRRR', 'RRRR', 'R.RR', '..R.']
];
const ROOT_L = ['..YY', '.YRR', 'YRRY', 'RRRR', 'RYRR', '.RRR', '..R.', '....'];
const FLOOR = [['YYYY', 'RRRR', 'RYRR', 'RRRR', 'RRRY', 'RRRR', 'RYRR', 'RRRR'], ['YYYY', 'RRRR', 'RRRY', 'RRRR', 'RYRR', 'RRRR', 'RRRY', 'RRRR']];
const BARK = [['RRRR', 'RYRR', 'RYRR', 'RRRR', 'RRRR', 'RRRY', 'RRRY', 'RRRR'], ['RRRR', 'RRRR', 'RRYR', 'RRYR', 'RRRR', 'YRRR', 'RRRR', 'RRRR']];

function scene() {
  const sc = SCREENS.find(s => s.id === '1-3'), map = sc.map;
  g.clear(B);
  // ירח קטן של טחב ירוק בצדדים הפנימיים של הגזע (קישוט עדין, בלי רעש)
  for (let r = 0; r < 21; r++) for (let c = 0; c < 32; c++) {
    const ch = map[r][c], x = c * 4, y = OY + r * 8, above = r ? map[r - 1][c] : '.';
    if (ch === '#') {
      if (c < 2 || c > 29) put(BARK[(r + c) % 2], x, y);
      else put(FLOOR[c % 2], x, y);
    } else if (ch === '=') {
      const l = map[r][c - 1] === '=' || map[r][c - 1] === '#', rr = map[r][c + 1] === '=' || map[r][c + 1] === '#';
      if (!l) put(ROOT_L, x, y); else if (!rr) put(ROOT_L, x, y, true); else put(ROOT[(c * 5 + r * 3) % 4], x, y);
      if ((c * 7 + r) % 5 === 1) for (let k = 7; k < 10 + (c % 4); k++) px(x + 1 + ((k >> 1) % 2), y + k, R);   // שורשון
    } else if (ch === '|') {
      for (let k = 0; k < 8; k++) { px(x + 1, y + k, Y); if ((y + k) % 4 === 0) px(x + 2, y + k, G); }   // חבל עם קשרים ירוקים
    }
    void above;
  }
  // יציאה: חץ צהוב
  const ex = 28 * 4 + 2, ey = OY + 2 * 8;
  for (let k = 0; k < 9; k++) px(ex, ey + k, Y); for (let k = 1; k < 4; k++) { px(ex - k, ey + k, Y); px(ex + k, ey + k, Y); }
  // דמויות במקומות שלהן במסך 1-3
  const top = r => OY + r * 8;
  put(PIP_RUN, 22, top(16) - 15);
  put(BARREL[0], 54, top(16) - 8); put(BARREL[1], 76, top(12) - 8); put(BARREL[0], 30, top(8) - 8);
  put(MONKEY, 98, top(4) - 11); put(BARREL[1], 108, top(4) - 8); put(BARREL[0], 108, top(4) - 16);
  put(SNAKE, 66, top(12) - 5);
  put(TAPE, 15, top(16) - 6); put(TAPE, 107, top(12) - 6); put(TAPE, 11, top(8) - 6);
  // שורות מצב
  g.rect(0, 0, LW, OY, B); g.rect(0, 180, LW, 12, B);
  g.text('1-3', 1, 2, R); g.text('ROOTS', 22, 2, Y); g.text('4250', LW - 1, 2, G, 'right');
  for (let i = 0; i < 3; i++) put(LIFE, 2 + i * 6, 184);
  g.text('T 59', LW - 1, 184, Y, 'right');
  // מתיחה פי 2 לרוחב: פיקסלים רחבים, כמו PMODE 3 של ה-Dragon
  main.ctx.imageSmoothingEnabled = false;
  main.ctx.drawImage(off, 0, 0, LW, 192, 0, 0, 256, 192);
}
scene();
