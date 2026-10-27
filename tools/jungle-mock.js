// הדמיות מסך ל-JUNGLE KING (לא המשחק עצמו): מסכים לדוגמה באותו מנוע גרפי של המחסניות, בגבולות של ה-Dragon
// (256×192, ערכות הצבעים של PMODE 3 ושחור; הדמויות בפיקסל כפול, כמו הפיקסלים הרחבים של ה-Dragon).
// נטען מ-jungle-mock.html?scene=title|map|roots|swamp|hives|boss
import { createGfx, W, H, PALETTES, BLACK } from '/assets/dragon/gfx.js';

const scene = new URLSearchParams(location.search).get('scene') || 'roots';
const g = createGfx(document.getElementById('c'));
const px = (x, y, c) => g.rect(x, y, 1, 1, c);
const box = (x0, y0, x1, y1, c, dither) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!dither || (x + y) % 2 === 0) px(x, y, c); };
function line(x0, y0, x1, y1, c) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx + dy;
  for (;;) { px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
const S = 2;   // הדמויות בפיקסל כפול
const spr = (rows, x, y, cols, flip) => g.sprite(rows, x, y, cols, flip, S);

// שורש או ענף מתעקל: f(x) נותן את הגובה העליון. קו עליון בהיר, גוף מנוקד, קשרים, ושורשונים שמשתלשלים
function limb(x0, x1, f, top, body, knot, thick = 7, hang = true) {
  for (let x = x0; x <= x1; x++) {
    const y = Math.round(f(x)), t = thick - (x === x0 || x === x1 ? 3 : 0);
    px(x, y, top); px(x, y + 1, top);
    for (let k = 2; k < t; k++) if ((x + y + k) % 2 === 0 || k === t - 1) px(x, y + k, body);
    if (x % 23 === 7) { px(x, y + 3, knot); px(x + 1, y + 3, knot); px(x, y + 4, knot); }
    if (hang && x % 17 === 4) for (let k = t; k < t + 3 + (x % 4); k++) px(x + ((k >> 1) % 2), y + k, body);
  }
}
const wave = (x0, y0, x1, y1, amp, per, ph = 0) => x => y0 + (y1 - y0) * (x - x0) / (x1 - x0) + amp * Math.sin((x + ph) / per);
// חבל מטפס (ליאנה או שורשון תלוי): קו עם עלים לסירוגין. torn = עם קרע באמצע
function vine(x, ya, yb, c, torn = false) {
  for (let y = ya; y <= yb; y++) {
    if (torn && y > ya + (yb - ya) * 0.42 && y < ya + (yb - ya) * 0.58) continue;
    const xx = x + Math.round(Math.sin(y / 9));
    px(xx, y, c);
    if ((y - ya) % 8 === 3) { px(xx - 1, y, c); px(xx - 2, y - 1, c); px(xx - 3, y - 1, c); }
    if ((y - ya) % 8 === 7) { px(xx + 1, y, c); px(xx + 2, y - 1, c); px(xx + 3, y - 1, c); }
  }
}
function swingVine(cx, cy, len, ang, c) {
  const ex = cx + Math.sin(ang) * len, ey = cy + Math.cos(ang) * len;
  line(cx, cy, ex, ey, c);
  for (let t = 0.12; t < 0.95; t += 0.11) { const x = cx + (ex - cx) * t, y = cy + (ey - cy) * t, s = (t * 9 | 0) % 2 ? 1 : -1; px(x + s, y, c); px(x + 2 * s, y - 1, c); px(x + 3 * s, y - 1, c); }
  return [ex, ey];
}
// גוש עלים
function leaves(cx, cy, rx, ry, c, c2) {
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
    if (d < 1 && ((x * 3 + y * 7) & 3) !== 0) px(cx + x, cy + y, (d > 0.6 && c2 && (x + y) % 3 === 0) ? c2 : c);
  }
}
// קיר גזע (קליפה): פסים אנכיים לא סדירים
function bark(x0, x1, c, c2) {
  for (let x = x0; x <= x1; x++) for (let y = 10; y < 180; y++) {
    const v = (x * 7 + ((y / 6) | 0) * 3) % 5;
    if (v === 0) px(x, y, c); else if (v === 2 && (x + y) % 2 === 0) px(x, y, c2);
  }
}

// ---- הדמויות (8 על 11 בערך, מצוירות בפיקסל כפול) ----
const PIP = ['..hhhh..', '.hhhhhh.', 'hhhhhhhh', '..fkfk..', '..ffff..', '.ssssss.', 'f.ssss.f', '..ssss..', '..pppp..', '..p..p..', '.kk..kk.'];
const PIP_RUN = ['..hhhh..', '.hhhhhh.', 'hhhhhhhh', '..fkfk..', '..ffff..', 'fssssss.', '..sssssf', '..ssss..', '..pppp..', '.pp..pp.', 'kk....kk'];
const PIP_CLIMB = ['f......f', 'f.hhhh.f', 'fhhhhhhf', '.shhhhs.', '.ssssss.', '..ssss..', '..pppp..', '..p..p..', '.pp..pp.', '.k....k.'];
const PIP_SWING = ['......f.', '..hhhhf.', '.hhhhhh.', 'hhhhhhhh', '..fkfk..', '.sssss..', 'ssssss..', '..ssss..', '..pppp..', '.pp..pp.', 'kk....kk'];
// BIG BONGO: מנדריל מלך. פרווה ירוקה, פנים כחולות עם פס אדום, זקן צהוב, כתר
const BONGO = ['....y.y.y.y.....', '....yyyyyyy.....', '...ggggggggg....', '..ggbbrrrbbgg...', '..gbbkrrrkbbg...', '..gbbbrrrbbbg...', '..ggbbrrrbbgg...', '...gyyrrryyg....', '....yykkkyy.....', '.gggggyyyggggg..', 'gg.ggyyyyyygg.gg', 'g..ggyyyyyygg..g', 'y..gggyyyyggg..y', '...gggggggggg...', '...ggg....ggg...', '..yyy......yyy..'];
const BONGO_THROW = ['y..y.y.y.y.....y', 'g..yyyyyyy.....g', 'g.ggggggggg...g.', '.gggbbrrrbbgggg.', '..gbbkrrrkbbg...', '..gbbbrrrbbbg...', '..ggbbrrrbbgg...', '...gyyrkryyg....', '....yykkkyy.....', '....gyyyyyg.....', '...ggyyyyyygg...', '...ggyyyyyygg...', '...gggyyyyggg...', '...gggggggggg...', '...ggg....ggg...', '..yyy......yyy..'];
const MONKEY = ['.gggg...', 'gyyyyg..', 'gykykg.g', 'gyyyyg.g', '.gggg.g.', 'ggyygg..', 'g.gg.g..', '.y..y...'];
const BARREL = ['.yyyyy.', 'yrrrrry', 'yyyyyyy', 'yrrrrry', 'yyyyyyy', 'yrrrrry', '.yyyyy.'];
const SNAKE = ['.....gg.', '....gkgg', 'g..g..r.', 'gggg....'];
const CROC = ['...........ggg..', 'gg.......ggkggg.', 'ggggg..gggggggg.', '.yyyyyy.........', 'yyyyyyyy........', '.ggggggggggggggg', 'gggggggggggggggg'];
const FROG = ['.k..k.', 'gggggg', 'gyyyyg', 'g.gg.g'];
const BEE = ['bb..', 'ykyk', 'ykyk', '.y..'];
const TAPE = ['yyyyyyyy', 'yrrrrrry', 'yr.yy.ry', 'yrrrrrry', 'yyyyyyyy'];
const MUSH = ['.rrrrrr.', 'rryrryrr', 'rrrrrrrr', '..yyyy..', '..yyyy..'];
const FLY = ['b.b', '.y.'];

function pal(n, over = {}) {
  const [C0, C1, C2, C3] = PALETTES[n];
  return Object.assign({ C0, C1, C2, C3 }, { cols: Object.assign({ h: C1, f: C1, s: C3, p: C2, k: BLACK, y: C1, r: C3, g: C0, b: C2 }, over) });
}
// שורת מצב עליונה ותחתונה (קבועה בכל המסכים)
function hud(P, code, name, tape = 2) {
  box(0, 0, W - 1, 9, BLACK); box(0, 182, W - 1, H - 1, BLACK);
  g.text(code, 3, 2, P.C3); g.text(name, 33, 2, P.C1);
  g.text('004250', W - 3, 2, P.C0, 'right');
  for (let i = 0; i < 3; i++) g.sprite(['.hhh.', 'hhhhh', '.fff.', '.sss.'], 3 + i * 8, 185, P.cols, false, 1);
  for (let i = 0; i < 3; i++) g.sprite(['yyyy', 'yrry', 'yyyy'], 110 + i * 7, 186, i < tape ? P.cols : { y: P.C2, r: P.C2 }, false, 1);
  g.text('TIME 72', W - 3, 185, P.C2, 'right');
}
const dots = (c, n, y0 = 12, y1 = 180, x0 = 0, x1 = W) => { for (let i = 0; i < n; i++) px(x0 + (i * 97 + 13) % (x1 - x0), y0 + (i * 53 + 7) % (y1 - y0), c); };

// ---- 1. מסך הפתיחה ----
function title() {
  const P = pal(0); g.clear(BLACK); dots(P.C2, 60, 0, 192);
  box(200, 92, 228, 191, P.C1, true); line(199, 92, 199, 191, P.C1); line(229, 92, 229, 191, P.C1);
  for (let x = 180; x < 240; x += 5) line(210, 185, x, 191, P.C1);
  leaves(210, 82, 44, 20, P.C0, P.C1); leaves(178, 96, 18, 9, P.C0); leaves(244, 98, 16, 9, P.C0);
  spr(BONGO, 194, 24, P.cols); spr(TAPE, 230, 46, P.cols);
  g.text('JUNGLE', 88, 18, P.C1, 'center', 4);
  g.text('KING', 88, 52, P.C3, 'center', 4);
  g.text('BIG BONGO HAS STOLEN', 88, 94, P.C0, 'center');
  g.text('THE GOLDEN TAPE.', 88, 104, P.C0, 'center');
  g.text('CLIMB THE GREAT TREE', 88, 118, P.C2, 'center');
  g.text('AND BRING IT BACK!', 88, 128, P.C2, 'center');
  vine(176, 0, 150, P.C0); spr(PIP_CLIMB, 168, 110, P.cols);
  g.text('PRESS FIRE', 88, 150, P.C1, 'center', 2);
  g.text('(C) 2026 GONEN YAROM', 88, 180, P.C3, 'center');
}

// ---- 2. מפת העץ: 7 עולמות, 40 מסכים, ושמירה בתחילת כל עולם ----
function map() {
  const P = pal(0); g.clear(BLACK); dots(P.C2, 40, 0, 192);
  g.text('THE GREAT TREE', 128, 2, P.C1, 'center', 2);
  box(116, 36, 140, 174, P.C1, true); line(115, 36, 115, 174, P.C1); line(141, 36, 141, 174, P.C1);
  for (let x = 96; x < 162; x += 5) line(128, 172, x, 178, P.C1);
  leaves(128, 38, 40, 10, P.C0, P.C1);
  const W7 = [['TREETOP', 5], ['BRANCHES', 5], ['CAVES', 6], ['HIVES', 6], ['RIVERS', 6], ['SWAMPS', 6], ['ROOTS', 6]];
  W7.forEach(([n, k], i) => {
    const y = 44 + i * 20, left = i % 2 === 0, w = 7 - i, done = w < 2, here = w === 2;
    const xe = left ? 80 : 176;
    line(left ? 115 : 141, y + 4, xe, y, P.C0); leaves(xe, y, 6, 3, P.C0);
    g.text(w + ' ' + n, left ? 70 : 186, y - 4, done ? P.C1 : here ? P.C3 : P.C2, left ? 'right' : 'left');
    g.text(k + ' SCREENS', left ? 70 : 186, y + 5, done ? P.C1 : P.C0, left ? 'right' : 'left');
  });
  spr(PIP_CLIMB, 120, 138, P.cols);
  g.sprite(BONGO, 120, 20, P.cols, false, 1);
  g.text('SAVED: WORLD 2   FIRE: GO', 128, 184, P.C3, 'center');
}

// ---- 3. עולם 1, השורשים (ערכה 1: אדמה כתומה): שורשים מתעקלים, שורשונים לטיפוס, פטרייה קופצת, חביות ----
function roots() {
  const P = pal(1, { s: PALETTES[1][3], p: PALETTES[1][2], h: PALETTES[1][0], f: PALETTES[1][0], y: PALETTES[1][0], r: PALETTES[1][3], g: PALETTES[1][1], b: PALETTES[1][2] });
  g.clear(BLACK);
  bark(0, 14, P.C3, P.C2); bark(241, 255, P.C3, P.C2); dots(P.C2, 40, 12, 178, 16, 240);
  const T = [wave(10, 168, 246, 170, 2, 14), wave(14, 134, 214, 124, 4, 19, 5), wave(40, 96, 246, 104, 4, 17, 11), wave(14, 64, 200, 58, 3, 21), wave(110, 30, 246, 34, 3, 15)];
  limb(10, 246, T[0], P.C0, P.C3, P.C2, 10, false);
  limb(14, 214, T[1], P.C0, P.C3, P.C2); limb(40, 246, T[2], P.C0, P.C3, P.C2); limb(14, 200, T[3], P.C0, P.C3, P.C2); limb(110, 246, T[4], P.C0, P.C3, P.C2);
  vine(204, T[1](204) + 6, T[0](204), P.C0); vine(56, T[2](56) + 6, T[1](56), P.C0); vine(186, T[3](186) + 6, T[2](186), P.C0, true); vine(130, T[4](130) + 6, T[3](130), P.C0);
  spr(MUSH, 226, T[2](226) - 10, P.cols);
  spr(PIP_RUN, 92, T[1](92) - 22, P.cols);
  spr(BARREL, 124, T[1](124) - 14, P.cols); spr(BARREL, 150, T[2](150) - 14, P.cols); spr(BARREL, 60, T[3](60) - 14, P.cols);
  spr(MONKEY, 120, T[4](120) - 16, P.cols); spr(BARREL, 140, T[4](140) - 14, P.cols); spr(BARREL, 140, T[4](140) - 27, P.cols);
  spr(SNAKE, 76, T[2](76) - 8, P.cols);
  spr(TAPE, 214, T[4](214) - 10, P.cols);
  hud(P, '1-3', 'THE TANGLED ROOTS');
}

// ---- 4. עולם 2, הביצות: נדנוד מעל מים, תנין פתוח-פה, בול עץ צף, צפרדע ----
function swamp() {
  const P = pal(0); g.clear(BLACK); dots(P.C2, 40, 12, 120);
  limb(0, 255, wave(0, 16, 255, 22, 2, 23), P.C1, P.C0, P.C3, 7, true);
  leaves(30, 20, 26, 8, P.C0); leaves(150, 22, 20, 7, P.C0); leaves(236, 18, 22, 8, P.C0);
  box(0, 164, W - 1, 181, P.C2); for (let x = 0; x < W; x += 8) { px(x, 164, P.C0); px(x + 1, 164, P.C0); px(x + 4, 166, BLACK); }
  for (let x = 0; x < 52; x++) { const y = 140 + Math.round(2 * Math.sin(x / 6)); px(x, y, P.C1); for (let k = y + 1; k < 164; k++) if ((x + k) % 2 === 0) px(x, k, P.C0); }
  for (let x = 204; x < W; x++) { const y = 118 + Math.round(2 * Math.sin(x / 7)); px(x, y, P.C1); for (let k = y + 1; k < 164; k++) if ((x + k) % 2 === 0) px(x, k, P.C0); }
  for (const x of [8, 14, 40, 214, 230, 246]) for (let k = 0; k < 14; k++) px(x + (k > 9 ? 1 : 0), (x < 100 ? 140 : 118) - k, P.C1);
  const [ex, ey] = swingVine(96, 22, 86, -0.6, P.C0); spr(PIP_SWING, ex - 6, ey - 2, P.cols);
  swingVine(168, 22, 74, 0.25, P.C0);
  spr(CROC, 108, 150, P.cols);
  box(150, 160, 180, 163, P.C1); for (let x = 152; x < 180; x += 6) px(x, 161, P.C3);
  box(70, 163, 82, 164, P.C0); spr(FROG, 218, 110, P.cols);
  spr(FLY, 120, 60, P.cols); spr(FLY, 60, 90, P.cols);
  hud(P, '2-2', 'CROC CREEK');
}

// ---- 5. עולם 4, הכוורות: מדפי שעווה, שלולית דבש דביקה, נחיל דבורים במסלול ----
function hives() {
  const P = pal(0); g.clear(BLACK);
  for (let r = 0; r < 15; r++) for (let q = 0; q < 23; q++) {   // חלת דבש עמומה ברקע
    const x = q * 12 + (r % 2) * 6, y = 12 + r * 11;
    line(x, y + 2, x + 3, y, P.C2); line(x + 3, y, x + 7, y, P.C2); line(x + 7, y, x + 10, y + 2, P.C2);
  }
  const SH = [[0, 168, 255], [26, 134, 214], [44, 100, 250], [8, 66, 196], [104, 34, 230]];
  SH.forEach(([a, y, b]) => { box(a, y, b, y + 4, P.C1); line(a, y, b, y, P.C3); for (let x = a + 5; x < b; x += 13) for (let k = 5; k < 8 + (x % 5); k++) px(x, y + k, P.C1); });
  for (let x = 92; x < 150; x++) for (let k = -3; k < 0; k++) if ((x + k) % 2 === 0) px(x, 134 + k, P.C3);
  vine(196, 140, 168, P.C0); vine(60, 106, 134, P.C0); vine(176, 72, 100, P.C0); vine(140, 40, 66, P.C0);
  for (let i = 0; i < 5; i++) { const a = i * 1.25; spr(BEE, 146 + Math.cos(a) * 32, 80 + Math.sin(a) * 9, P.cols); }
  spr(PIP, 66, 78, P.cols);
  spr(BARREL, 112, 52, P.cols);
  box(226, 12, 250, 33, P.C3); for (let y = 14; y < 32; y += 4) box(228, y, 248, y + 1, P.C1);
  box(234, 26, 240, 33, BLACK);
  hud(P, '4-4', 'THE STICKY HALL');
}

// ---- 6. עולם 7, הצמרת: הקרב ב-BIG BONGO ----
function boss() {
  const P = pal(0); g.clear(BLACK);
  for (let y = 10; y < 100; y++) for (let x = 0; x < W; x++) if ((x + y) % 4 === 0 && y < 50 + 20 * Math.sin(x / 30)) px(x, y, P.C2);
  leaves(16, 50, 20, 14, P.C0, P.C1); leaves(242, 70, 18, 16, P.C0, P.C1); leaves(10, 130, 14, 18, P.C0); leaves(248, 150, 12, 14, P.C0);
  const B = [wave(64, 66, 196, 66, 1, 20), wave(20, 104, 172, 112, 3, 18), wave(84, 146, 236, 138, 3, 16), wave(0, 170, 255, 170, 2, 25)];
  limb(64, 196, B[0], P.C1, P.C0, P.C3); limb(20, 172, B[1], P.C1, P.C0, P.C3); limb(84, 236, B[2], P.C1, P.C0, P.C3); limb(0, 255, B[3], P.C1, P.C0, P.C3, 10, false);
  spr(BONGO_THROW, 100, 34, P.cols); spr(BARREL, 108, 20, P.cols);
  spr(TAPE, 172, 56, P.cols);
  vine(186, 72, 104, P.C0); vine(40, 110, 146, P.C0); vine(212, 144, 170, P.C0);
  spr(BARREL, 120, B[1](120) - 14, P.cols); spr(BARREL, 160, B[2](160) - 14, P.cols);
  spr(PIP_RUN, 60, B[3](60) - 22, P.cols);
  hud(P, '7-5', 'THE KING\'S CROWN', 3);
  box(70, 12, 186, 20, BLACK); g.text('BIG BONGO', 96, 13, P.C3, 'center');
  for (let i = 0; i < 5; i++) box(130 + i * 11, 14, 137 + i * 11, 18, i < 3 ? P.C3 : P.C2);
}

({ title, map, roots, swamp, hives, boss })[scene]();
