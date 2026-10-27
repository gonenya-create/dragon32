// JUNGLE KING, סבב גרפיקה 2 (גונן, 27.10: "נשקיע ונעשה את המקסימום" במראה של Dragon):
// כל דמות וכל אריח מצוירים ביד, פיקסל אחרי פיקסל, בגודל אמיתי (בלי הגדלה), עם צל ועומק בארבעת הצבעים של PMODE 3 ושחור.
// נטען מ-jungle-art.html?scene=roots
import { createGfx, W, H, PALETTES, BLACK } from '/assets/dragon/gfx.js';

const scene = new URLSearchParams(location.search).get('scene') || 'roots';
const g = createGfx(document.getElementById('c'));
const px = (x, y, c) => g.rect(x, y, 1, 1, c);

// ערכה 1 של PMODE 3: 0 בז', 1 תכלת, 2 סגול, 3 כתום. k = שחור
const [B0, B1, B2, B3] = PALETTES[1];
const COL = { 0: B0, 1: B1, 2: B2, 3: B3, k: BLACK };
const put = (rows, x, y, flip = false, cols = COL) => g.sprite(rows, x, y, cols, flip, 1);

// ---------- אריחים (8×8) ----------
// קליפת הגזע בצדדים: סדקים שחורים, קצוות בהירים
const BARK = [
  ['3k33k323', '3k32k333', '33k3k333', '03k33k30', '3k33k332', '23k3k333', '3k32k303', '3k33k333'],
  ['33k3k333', '3k33k323', '3k30k333', '32k3k333', '3k33k303', '3k32k333', '33k3k323', '03k3k333']
];
// השורש: חלק עליון (קו אור בז' + קליפה כתומה + צל סגול) וחלק תחתון
const ROOT = [
  ['00000000', '03300303', '33333333', '33233323', '32333233', '33332333', '23323232', '2.2.2.2.'],
  ['00000000', '30330330', '33333333', '332kk333', '32k22k33', '332kk323', '32323232', '.2.2..2.'],
  ['00000000', '33003330', '33333333', '33333233', '23323333', '33233332', '32232323', '2..2.2.2']
];
const ROOT_L = ['...00000', '..033033', '.0333333', '03332333', '03233323', '.3332333', '..232323', '...2.2.2'];
const FLOOR2 = ['32323232', '23232323', '32k23232', '2323k323', '3232k232', '23232323', '.2.2.2.2', '2.2.2.2.'];

// ---------- דמויות ----------
// PIP, החוקר: כובע חקר בז' עם פס כתום, חולצה תכלת, מכנסיים סגולים, מגפיים כתומים
const PIP_R = [
  '....0000....', '...000000...', '..33333333..', '.0000000000.', '....0000....', '....00k0....', '....0000....', '.....00.....',
  '...111111...', '..11111111..', '..10111101..', '..00111100..', '....1111....', '...222222...', '...22..22...', '..22....22..', '.22......22.', '.33......33.'
];
const PIP_CLIMB = [
  '.0........0.', '.0..0000..0.', '.0.000000.0.', '.1333333331.', '.1000000001.', '..1.0000.1..', '...111111...', '...111111...',
  '..11111111..', '...111111...', '...111111...', '...222222...', '...22..22...', '...22...22..', '..22....22..', '..33.....33.'
];
// הקוף-עוזר של BIG BONGO: פרווה סגולה, פנים בז', זנב מתולתל
const MONKEY = [
  '...2222.......', '..222222......', '.22000022.....', '.20k00k02.....', '.20000002.....', '..200k02...22.', '..222222..2..2',
  '.2222222222...', '22.2000222....', '2..200022.....', '...222222.....', '...22..22.....', '..000..000....'
];
// חבית מתגלגלת: חישוקים בז', לוחות כתומים, צל סגול
const BARREL = ['...0000...', '.00333300.', '.03333332.', '0000000000', '0332333230', '0332333230', '0000000000', '.03333332.', '.22333322.', '...2222...'];
const BARREL_SIDE = ['..000000..', '.0302302.0', '03023023020'.slice(0, 10), '0302302302', '0302302302', '0302302302', '0302302302', '.030230230'.slice(0, 10), '..000000..'];
// נחש תכלת
const SNAKE = ['...........111..', '..........1k1k1.', '1.........11111.', '11......111..3..', '111...1111......', '.111111110......', '..11111.........'];
// פטרייה קופצת: כובע סגול עם נקודות בז', רגל בז'
const MUSH = ['.....222222.....', '...2220022222...', '..222000222002..', '.22222002222222.', '2220022222200222', '2222222222222222', '.2.2.2.2.2.2.2..', '......0000......', '......0k00......', '.....000000.....'];
// חלק מקלטת הזהב
const TAPE = ['3333333333', '3000000003', '30kk00kk03', '3000000003', '3333333333'];
// תולעת זוהרת
const GLOW = ['.1.', '111', '.1.'];

// ---------- עזרים ----------
// רקע: עורקי עץ אנכיים, עמומים (כל פיקסל שני), שנותנים עומק לתוך הגזע
function grain(x0, x1) {
  for (let x = x0; x < x1; x += 9 + (x % 4)) {
    let xx = x;
    for (let y = 10; y < 182; y++) {
      if ((y + x) % 3 === 0) px(xx, y, B2);
      if (y % 11 === (x % 11)) xx += (x % 2 ? 1 : -1);
      if (y % 37 === (x % 37)) { px(xx + 1, y, B2); px(xx + 2, y + 1, B2); }   // ענף קטן ברקע
    }
  }
}
function barkWall(x0) {
  for (let ty = 1; ty < 23; ty++) for (let tx = 0; tx < 2; tx++) put(BARK[(tx + ty) % 2][0].length ? BARK[(tx + ty) % 2] : BARK[0], x0 + tx * 8, 2 + ty * 8, (tx + ty) % 3 === 0);
}
// שורש לאורך מסלול: offs[i] = גובה האריח ה-i. קצוות מעוגלים, ושורשונים שמשתלשלים מלמטה
function rootPath(x0, offs, hang = true) {
  offs.forEach((y, i) => {
    const x = x0 + i * 8;
    if (i === 0) put(ROOT_L, x, y);
    else if (i === offs.length - 1) put(ROOT_L, x, y, true);
    else put(ROOT[(i * 7 + y) % 3], x, y);
    if (hang && (i % 5 === 2 || i % 5 === 3)) put(FLOOR2, x, y + 7);
    if (hang && i % 3 === 1) {   // שורשון קטן שמתפתל למטה
      let xx = x + 3; const len = 4 + ((i * 5 + y) % 6);
      for (let k = 0; k < len; k++) { px(xx, y + 8 + k, k < 2 ? B3 : B2); if (k % 3 === 2) xx += (i % 2 ? 1 : -1); }
    }
  });
}
// חבל לטיפוס (שורשון עבה תלוי): קלוע, בז' וכתום לסירוגין. torn = קרוע באמצע, עם קצוות פרומים
function rope(x, y0, y1, torn = false) {
  const gapA = y0 + Math.round((y1 - y0) * 0.42), gapB = y0 + Math.round((y1 - y0) * 0.62);
  for (let y = y0; y <= y1; y++) {
    if (torn && y > gapA && y < gapB) continue;
    const ph = (y - y0) % 4;   // שלושה גדילים קלועים
    px(x - 1, y, ph === 0 || ph === 3 ? B0 : B3); px(x, y, ph < 2 ? B0 : B3); px(x + 1, y, ph === 1 || ph === 2 ? B0 : B3);
    if (torn && (y === gapA || y === gapB)) { px(x - 1, y + (y === gapA ? 1 : -1), B0); px(x + 2, y + (y === gapA ? 1 : -1), B3); }
  }
}
function slopeY(offs, x0, x) { const i = Math.max(0, Math.min(offs.length - 1, Math.floor((x - x0) / 8))); return offs[i]; }

// ---------- המסך ----------
function roots() {
  g.clear(BLACK);
  grain(20, 238);
  barkWall(0); barkWall(240);
  // שורשים (כל מספר = גובה אריח; השינויים הקטנים יוצרים קימור)
  const P = {
    floor: { x: 16, o: Array(28).fill(166) },
    a: { x: 16, o: [136, 135, 134, 134, 133, 132, 132, 131, 131, 130, 130, 129, 129, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138] },
    b: { x: 48, o: [100, 101, 102, 103, 103, 104, 104, 104, 103, 102, 101, 100, 99, 98, 97, 97, 96, 96, 96, 97, 98, 99, 100, 101] },
    c: { x: 16, o: [66, 65, 64, 63, 62, 62, 61, 61, 61, 62, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73] },
    d: { x: 112, o: [36, 35, 34, 34, 33, 33, 33, 34, 34, 35, 35, 36, 37, 38, 38, 39] }
  };
  rootPath(P.floor.x, P.floor.o, false); P.floor.o.forEach((y, i) => put(FLOOR2, P.floor.x + i * 8, y + 8));
  rootPath(P.a.x, P.a.o); rootPath(P.b.x, P.b.o); rootPath(P.c.x, P.c.o); rootPath(P.d.x, P.d.o);
  // חבלים בין השורשים
  rope(206, slopeY(P.a.o, P.a.x, 206) + 8, 166);
  rope(60, slopeY(P.b.o, P.b.x, 60) + 8, slopeY(P.a.o, P.a.x, 60));
  rope(178, slopeY(P.c.o, P.c.x, 178) + 8, slopeY(P.b.o, P.b.x, 178), true);
  rope(132, slopeY(P.d.o, P.d.x, 132) + 8, slopeY(P.c.o, P.c.x, 132));
  // דמויות ועצמים
  put(PIP_R, 92, slopeY(P.a.o, P.a.x, 96) - 18);
  put(BARREL, 124, slopeY(P.a.o, P.a.x, 128) - 10);
  put(BARREL, 150, slopeY(P.b.o, P.b.x, 154) - 10);
  put(BARREL, 44, slopeY(P.c.o, P.c.x, 48) - 10);
  put(MONKEY, 118, slopeY(P.d.o, P.d.x, 122) - 13);
  put(BARREL, 136, slopeY(P.d.o, P.d.x, 140) - 10); put(BARREL, 141, slopeY(P.d.o, P.d.x, 140) - 20);
  put(SNAKE, 84, slopeY(P.b.o, P.b.x, 90) - 6);
  put(MUSH, 218, slopeY(P.b.o, P.b.x, 226) - 10);
  put(TAPE, 214, slopeY(P.d.o, P.d.x, 218) - 6);
  for (const [x, y] of [[40, 50], [200, 84], [96, 150], [170, 20], [30, 118]]) put(GLOW, x, y);
  // שורת מצב
  g.rect(0, 0, W, 10, BLACK); g.rect(0, 182, W, 10, BLACK);
  g.text('1-3', 3, 2, B3); g.text('THE TANGLED ROOTS', 27, 2, B1); g.text('004250', W - 3, 2, B0, 'right');
  const LIFE = ['.000.', '33333', '.000.', '.111.', '.2.2.'];
  for (let i = 0; i < 3; i++) put(LIFE, 3 + i * 8, 184);
  for (let i = 0; i < 3; i++) put(['3333', '3kk3', '3333'], 104 + i * 7, 186, false, i < 2 ? COL : { 3: B2, k: BLACK });
  g.text('TIME 72', W - 3, 185, B2, 'right');
}

// ---------- מסך 1-5: הפיר העמוק (אותו עולם, מבנה אחר: פיר צר, מטפסים רק בחבלים, חביות נופלות ישר) ----------
const LEDGE_L = ['00000000', '33033033', '33333333', '3233323.', '33323...', '2323....', '.2......', '........'];
// קיר עבה: קליפה כהה (רוב הפיקסלים שחורים), כדי שהפיר יבלוט ולא יהיה רעש
const dim = t => t.map((r, y) => r.split('').map((c, x) => c === '3' ? (((x * 2 + y) % 5) ? '.' : '3') : c === '0' ? '2' : c === '2' ? (((x + y) % 2) ? '.' : '2') : c).join(''));
const BARK_DIM = BARK.map(dim);
function bigBark(x0, x1) {
  for (let ty = 1; ty < 23; ty++) for (let tx = 0; x0 + tx * 8 < x1; tx++) put(BARK_DIM[(tx * 3 + ty) % 2], x0 + tx * 8, 2 + ty * 8, (tx + ty) % 3 === 0);
  for (let i = 0; i < 9; i++) { const cx = x0 + 10 + (i * 37) % Math.max(1, x1 - x0 - 20), cy = 24 + (i * 53) % 150; for (let a = 0; a < 6.3; a += 0.5) px(cx + Math.cos(a) * 4, cy + Math.sin(a) * 2, B3); px(cx, cy, B2); }   // קשרים בעץ
}
function shaft() {
  g.clear(BLACK);
  grain(80, 176);
  bigBark(0, 80); bigBark(176, 256);
  // קו אור על שפת הקירות, כדי שהפיר ייראה עמוק
  for (let y = 10; y < 182; y++) { px(79, y, (y % 3) ? B0 : B3); px(176, y, (y % 3) ? B3 : B2); }
  // מדפי שורש שבולטים מהקירות, לסירוגין
  const L = [[80, 150, 4, false], [136, 124, 5, true], [80, 98, 3, false], [128, 72, 6, true], [80, 46, 5, false]];
  for (const [x, y, n, right] of L) for (let i = 0; i < n; i++) {
    const xx = right ? 176 - (i + 1) * 8 : x + i * 8;
    if (i === n - 1) put(LEDGE_L, xx, y, !right); else put(ROOT[(i + y) % 3], xx, y);
    if (i === 1) { put(FLOOR2, xx, y + 7); }
  }
  // חבלים תלויים באמצע הפיר
  rope(112, 10, 140); rope(150, 30, 176, true); rope(100, 56, 92);
  // דמויות
  put(PIP_CLIMB, 106, 100);
  put(SNAKE, 140, 86);
  put(MONKEY, 132, 58);
  put(BARREL_SIDE, 116, 26); for (let k = 0; k < 3; k++) px(120, 18 - k * 3, B2);   // חבית נופלת, עם קווי תנועה
  put(BARREL_SIDE, 140, 154);
  put(MUSH, 82, 88);
  put(TAPE, 90, 140);
  // מעבר סודי: סדק בקיר השמאלי
  for (let y = 112; y < 132; y++) { const w = 3 - Math.abs(y - 122) / 4; for (let x = 74 - w; x < 80; x++) px(x, y, BLACK); }
  for (let y = 114; y < 130; y += 3) px(72, y, B1);
  // גושי אדמה נושרים
  for (const [x, y] of [[126, 40], [128, 46], [158, 120], [96, 166]]) { px(x, y, B3); px(x + 1, y, B2); }
  for (const [x, y] of [[96, 30], [160, 60], [150, 110], [90, 170]]) put(GLOW, x, y);
  hudBar('1-5', 'THE DEEP SHAFT', B3, B1, B0, B2, COL);
}

// ---------- מסך 5-2: מערת העטלפים (עולם אחר: ערכה 0, חושך, רואים רק סביב הלפיד של PIP) ----------
const [G0, G1, G2, G3] = PALETTES[0];   // ירוק, צהוב, כחול, אדום
const C5 = { 0: G1, 1: G3, 2: G2, 3: G3, k: BLACK, g: G0, y: G1, b: G2, r: G3 };
const ROCK = [
  ['11111111'.replace(/1/g, 'y'), 'ybbybbby', 'bbbbbbbb', 'bkbbbkbb', 'bbbbbbbb', 'bbkbbbbk', 'b.b.b.b.', '.b.b.b.b'],
  ['yyyyyyyy', 'bybbbybb', 'bbbbbbbb', 'bbbkbbbb', 'kbbbbbkb', 'bbbbbbbb', '.b.b.b.b', 'b.b.b.b.']
];
const STALAC = ['bbbbbb', 'bbkbbb', '.bbbb.', '.bbb..', '..bb..', '..b...', '..b...'];
const BATW = ['r.......r', 'rr.....rr', 'rrr.k.rrr', '.rrrrrrr.', '..r.r.r..'];
const PIP_TORCH = [
  '..........y.', '....yyyy.yry', '...yyyyyy.r.', '..rrrrrrrr.r', '.yyyyyyyyyyr', '....yyyy...r', '....yyky...r', '....yyyy..r.',
  '.....yy...r.', '...rrrrrrrr.', '..rrrrrr....', '..ryrrrr....', '....rrrr....', '...bbbbbb...', '...bb..bb...', '..bb....bb..', '.bb......bb.', '.rr......rr.'
];
function rockRow(x0, n, y) { for (let i = 0; i < n; i++) put(ROCK[(i + y) % 2], x0 + i * 8, y, false, C5); }
function cave() {
  g.clear(BLACK);
  // רקע: סלע מנוקד עמום
  for (let y = 10; y < 182; y++) for (let x = 0; x < W; x++) if ((((x * 73856093) ^ (y * 19349663)) >>> 0) % 41 === 0) px(x, y, G2);
  // תקרה עם נטיפים, רצפה ומדפי סלע
  rockRow(0, 32, 10); for (let x = 6; x < 250; x += 19 + (x % 7)) put(STALAC, x, 18, false, C5);
  rockRow(0, 32, 170);
  rockRow(16, 9, 138); rockRow(152, 10, 118); rockRow(24, 8, 88); rockRow(128, 12, 58);
  // ליאנות בתוך המערה (שורשים שחדרו מלמעלה)
  for (const [x, a, b] of [[96, 146, 170], [176, 126, 170], [60, 96, 138], [200, 66, 118], [140, 18, 58]]) {
    for (let y = a; y <= b; y++) { px(x, y, G0); if ((y - a) % 8 === 3) { px(x - 1, y, G0); px(x - 2, y - 1, G0); } if ((y - a) % 8 === 7) { px(x + 1, y, G0); px(x + 2, y - 1, G0); } }
  }
  put(PIP_TORCH, 70, 120, false, C5);
  put(BATW, 120, 104, false, C5); put(BATW, 40, 66, false, C5); put(BATW, 214, 36, false, C5); put(BATW, 170, 90, true, C5);
  put(BARREL, 180, 108, false, { 0: G1, 2: G2, 3: G3 });
  put(['yyyyyyyyyy', 'y........y'.replace(/\./g, 'r'), 'yrkkrrkkry', 'yrrrrrrrry', 'yyyyyyyyyy'], 210, 52, false, C5);
  // אבן נופלת
  put(['.bb.', 'bbbb', 'bkbb', '.bb.'], 104, 40, false, C5); px(105, 34, G2); px(106, 30, G2);
  // החושך: רואים רק סביב הלפיד. טבעת מנוקדת בשוליים
  const LX = 84, LY = 120, R1 = 58, R2 = 76;
  const img = g.ctx.getImageData(0, 0, W, H);
  for (let y = 10; y < 182; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - LX, (y - LY) * 1.1);
    if (d > R2 || (d > R1 && (x + y) % 2)) { const i = (y * W + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = 0; }
  }
  g.ctx.putImageData(img, 0, 0);
  // בחושך רואים רק עיניים של עטלפים רחוקים
  for (const [x, y] of [[44, 68], [46, 68], [218, 38], [220, 38], [174, 92], [176, 92], [140, 150], [142, 150]]) px(x, y, G1);
  hudBar('5-2', 'THE BAT CAVE', G3, G1, G0, G2, C5);
}

function hudBar(code, name, cCode, cName, cScore, cTime, cols) {
  g.rect(0, 0, W, 10, BLACK); g.rect(0, 182, W, 10, BLACK);
  g.text(code, 3, 2, cCode); g.text(name, 27, 2, cName); g.text('004250', W - 3, 2, cScore, 'right');
  const LIFE = ['.000.', '33333', '.000.', '.111.', '.2.2.'];
  for (let i = 0; i < 3; i++) put(LIFE, 3 + i * 8, 184, false, cols);
  for (let i = 0; i < 3; i++) g.rect(104 + i * 7, 186, 5, 3, i < 2 ? cScore : cTime);
  g.text('TIME 72', W - 3, 185, cTime, 'right');
}

({ roots, shaft, cave })[scene]();
