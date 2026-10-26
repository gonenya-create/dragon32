// הדמיות מסך ל-DRAGON DEEP (לא המשחק עצמו): מציירות מסכים לדוגמה באותו מנוע גרפי של המחסניות,
// כדי שגונן יבחר מראה לפני שבונים. נטען מ-deep-mock.html, והמסך נבחר לפי ?scene=
import { createGfx, W, H, PALETTES, BLACK } from '/assets/dragon/gfx.js';

const scene = new URLSearchParams(location.search).get('scene') || 'corridor';
const pal = +(new URLSearchParams(location.search).get('pal') || 0);
const [C0, C1, C2, C3] = PALETTES[pal];   // ערכה 0: ירוק צהוב כחול אדום · ערכה 1: בז' תכלת סגול כתום
const g = createGfx(document.getElementById('c'));
const px = (x, y, c) => g.rect(x, y, 1, 1, c);

// קו בפיקסלים (ברזנהאם), כמו LINE של ה-Dragon
function line(x0, y0, x1, y1, c) {
  x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx + dy;
  for (;;) { px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
// מילוי עמודה-עמודה בין שני קווים (קיר צד בפרספקטיבה). dither: 0 מלא, 1 שחמט (קיר רחוק/מוצל)
function wallSide(xa, xb, ya0, ya1, yb0, yb1, c, dither) {
  const step = xa < xb ? 1 : -1;
  for (let x = xa; x !== xb; x += step) {
    const t = (x - xa) / (xb - xa), top = ya0 + (yb0 - ya0) * t, bot = ya1 + (yb1 - ya1) * t;
    for (let y = Math.round(top); y <= Math.round(bot); y++) if (!dither || (x + y) % 2 === 0) px(x, y, c);
  }
}
function box(x0, y0, x1, y1, c, dither) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!dither || (x + y) % 2 === 0) px(x, y, c);
}
// מסגרות העומק: 0 = הקיר שלידנו, 3 = הכי רחוק שהלפיד מאיר
const VIEW_H = 150;
const F = [[0, 0, 255, VIEW_H - 1], [40, 24, 215, 125], [82, 50, 173, 99], [106, 64, 149, 85], [118, 70, 137, 79]];

// מבט במסדרון: walls[d] = { left, right, front } לכל עומק. light = כמה עומקים הלפיד מאיר
function view(walls, light, wallC, edgeC) {
  g.clear(BLACK);
  // רצפה מנוקדת עד גבול האור
  const far = F[Math.min(light, 4)];
  for (let y = far[3]; y < VIEW_H; y += 3) for (let x = (y % 6 ? 1 : 0); x < W; x += 6) if (y > far[3]) px(x, y, edgeC);
  for (let d = 0; d < Math.min(light, 4); d++) {
    const [ax0, ay0, ax1, ay1] = F[d], [bx0, by0, bx1, by1] = F[d + 1];
    const w = walls[d] || {}, shade = d >= light - 1 ? 1 : 0;
    if (w.left) { wallSide(ax0, bx0, ay0, ay1, by0, by1, wallC, 1); line(ax0, ay0, bx0, by0, edgeC); line(ax0, ay1, bx0, by1, edgeC); line(bx0, by0, bx0, by1, edgeC); }
    else { box(ax0, by0, bx0 - 1, by1, wallC, shade); line(ax0, by0, bx0, by0, edgeC); line(ax0, by1, bx0, by1, edgeC); line(bx0, by0, bx0, by1, edgeC); }
    if (w.right) { wallSide(ax1, bx1, ay0, ay1, by0, by1, wallC, 1); line(ax1, ay0, bx1, by0, edgeC); line(ax1, ay1, bx1, by1, edgeC); line(bx1, by0, bx1, by1, edgeC); }
    else { box(bx1 + 1, by0, ax1, by1, wallC, shade); line(bx1, by0, ax1, by0, edgeC); line(bx1, by1, ax1, by1, edgeC); line(bx1, by0, bx1, by1, edgeC); }
    if (w.front) { box(bx0, by0, bx1, by1, wallC, shade); line(bx0, by0, bx1, by0, edgeC); line(bx0, by1, bx1, by1, edgeC); line(bx0, by0, bx0, by1, edgeC); line(bx1, by0, bx1, by1, edgeC); return d + 1; }
  }
  return 9;
}
// לבנים על קיר קדמי (מרקם)
function bricks(d, c) {
  const [x0, y0, x1, y1] = F[d];
  const h = Math.max(3, (y1 - y0) / 6 | 0);
  for (let y = y0 + h; y < y1; y += h) { line(x0 + 1, y, x1 - 1, y, c); for (let x = x0 + ((y / h | 0) % 2 ? h : 2 * h); x < x1; x += 2 * h) line(x, y, x, Math.min(y + h, y1), c); }
}
// פס תחתון: כוח, לפיד, חפץ ביד, קומה
const HEART = ['33.33', '33333', '33333', '.333.', '..3..'];
const FLAME = ['..1..', '.11..', '.121.', '12221', '.121.', '..4..', '..4..'];
const SWORD = ['.....1', '....1.', '...1..', '2.1...', '.2....', '2.2...'];
const COIN = ['.11.', '1221', '1221', '.11.'];
function hud(hp, torch, item, floor, coins) {
  g.rect(0, VIEW_H, W, H - VIEW_H, BLACK);
  line(0, VIEW_H + 1, W - 1, VIEW_H + 1, C2);
  for (let i = 0; i < 5; i++) g.sprite(HEART, 6 + i * 9, 158, { 3: i < hp ? C3 : C2 }, false);
  g.sprite(FLAME, 60, 156, { 1: C1, 2: C3, 4: C2 }, false);
  g.rect(70, 160, 50, 5, C2); g.rect(70, 160, 50 * torch, 5, C1);
  g.sprite(SWORD, 132, 156, { 1: C1, 2: C2 }, false, 2);
  g.text(item, 148, 160, C0);
  g.sprite(COIN, 6, 174, { 1: C1, 2: C3 }, false, 2); g.text(String(coins).padStart(4, '0'), 18, 176, C1);
  g.text('LEVEL ' + floor, 250, 176, C0, 'right');
}
// ספרייטים של מפלצות (מקוריים). 1 צהוב, 2 כחול, 3 אדום, 0 ירוק
const SKEL = ['...111...', '..11111..', '..1.1.1..', '..11111..', '...1.1...', '....1....', '.1111111.', '1..111..1', '1..1.1..1', '...111...', '...1.1...', '..11.11..', '..1...1..', '..1...1..', '.11...11.'];
const RAT = ['......33.', '.....3133', '33333333.', '3.33333..', '..3.3.3..'];
const SLIME = ['...000...', '..00000..', '.0010100.', '000000000', '000000000', '.0000000.'];
const DRAGON = ['.......33........', '......3333.......', '...33331333......', '..3333333333.....', '.33.33333333.333.', '3...3333333333333', '....33333333..33.', '...3333333333....', '..333.3333.333...', '..33..3..3..33...', '.33...3..3...33..'];
const CHEST = ['.111111.', '13333331', '11111111', '13311331', '13333331', '11111111'];
const STAIRS = (d, c) => { const [x0, , x1, y1] = F[d]; const w = (x1 - x0) / 3 | 0, cx = (x0 + x1) / 2 | 0; for (let i = 0; i < 4; i++) { const yy = y1 - 2 - i * (d === 1 ? 7 : 4); line(cx - w + i * 4, yy, cx + w - i * 4, yy, c); } };

if (scene === 'title') {
  g.clear(BLACK);
  for (let i = 0; i < 70; i++) px((i * 97) % W, (i * 53) % 90, i % 3 ? C2 : C1);
  g.sprite(DRAGON, 76, 18, { 3: C3, 1: C1 }, false, 6);
  g.text('DRAGON DEEP', 128, 100, C1, 'center', 3);
  g.text('FIVE FLOORS DOWN. ONE TORCH.', 128, 132, C0, 'center');
  g.text('BRING BACK THE GOLDEN TAPE', 128, 144, C0, 'center');
  g.text('PRESS FIRE', 128, 168, C3, 'center', 2);
  g.text('(C) 2026 GONEN YAROM', 128, 184, C2, 'center');
} else if (scene === 'corridor') {
  const fd = view([{ left: 1, right: 1 }, { left: 1, right: 0 }, { left: 1, right: 1 }, { left: 1, right: 1, front: 1 }], 4, C2, C0);
  bricks(4, C0);
  g.sprite(COIN, 122, 112, { 1: C1, 2: C3 }, false, 2);
  hud(5, 0.9, 'SWORD', 1, 120);
} else if (scene === 'monster') {
  view([{ left: 1, right: 1 }, { left: 1, right: 1 }, { left: 0, right: 1 }, { left: 1, right: 1, front: 1 }], 4, C2, C0);
  bricks(4, C0);
  g.sprite(SKEL, 101, 38, { 1: C1 }, false, 6);
  g.text('A SKELETON BLOCKS THE WAY!', 128, 4, C3, 'center');
  hud(3, 0.7, 'SWORD', 2, 340);
} else if (scene === 'dark') {
  view([{ left: 1, right: 1 }, { left: 0, right: 1 }, { left: 1, right: 1 }], 2, C2, C0);
  g.sprite(RAT, 116, 104, { 3: C3, 1: C1 }, false, 3);
  g.text('THE TORCH IS DYING...', 128, 4, C1, 'center');
  hud(2, 0.15, 'AXE', 3, 610);
} else if (scene === 'room') {
  view([{ left: 0, right: 0 }, { left: 1, right: 1, front: 1 }], 4, C2, C0);
  bricks(1, C0);
  g.sprite(CHEST, 96, 92, { 1: C1, 3: C3 }, false, 8);
  g.sprite(SLIME, 30, 118, { 0: C0, 1: C1 }, false, 3);
  hud(4, 0.6, 'SWORD', 2, 455);
} else if (scene === 'stairs') {
  view([{ left: 1, right: 1 }, { left: 1, right: 1, front: 1 }], 4, C2, C0);
  bricks(1, C0);
  STAIRS(1, C1);
  g.text('STAIRS DOWN. FIRE TO DESCEND', 128, 4, C1, 'center');
  hud(4, 0.5, 'SWORD', 1, 210);
} else if (scene === 'dragon') {
  view([{ left: 0, right: 0 }, { left: 0, right: 0 }, { left: 1, right: 1, front: 1 }], 4, C2, C3);
  bricks(2, C3);
  g.sprite(DRAGON, 26, 16, { 3: C3, 1: C1 }, false, 12);
  for (let i = 0; i < 26; i++) px(110 + (i * 7) % 40, 110 + (i * 5) % 30, C1);
  g.text('THE DRAGON WAKES!', 128, 4, C1, 'center');
  hud(2, 0.4, 'AXE', 5, 1990);
} else if (scene === 'map') {
  g.clear(BLACK);
  g.text('LEVEL 2 - MAP', 128, 4, C1, 'center');
  const M = ['################', '#....#.....#...#', '#.##.#.###.#.#.#', '#.#..#...#...#.#', '#.#.####.#####.#', '#.#......#.....#', '#.######.#.###.#', '#......#...#...#', '######.#####.###', '#....#.......#.#', '#.##.#######.#.#', '#.#..........#.#', '#.#.########.#.#', '#.#.#......#...#', '#...#.####...#.#', '################'];
  const seen = (x, y) => x + y < 20 || (x > 8 && y < 6);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (!seen(x, y)) continue;
    const X = 64 + x * 8, Y = 16 + y * 8;
    if (M[y][x] === '#') box(X, Y, X + 7, Y + 7, C2, 1); else g.rect(X + 3, Y + 3, 2, 2, C0);
  }
  g.sprite(['..1..', '.111.', '11111', '..1..', '..1..'], 64 + 6 * 8 + 1, 16 + 7 * 8 + 1, { 1: C1 }, false);
  g.sprite(['1111', '1..1', '1111'], 64 + 3 * 8 + 2, 16 + 9 * 8 + 2, { 1: C3 }, false);
  g.text('YOU', 4, 60, C1); g.text('STAIRS', 4, 72, C3); g.text('PAUSED', 252, 60, C0, 'right');
  g.text('P TO PLAY ON', 128, 182, C0, 'center');
}
window.mockDone = true;
