// הדמיות מסך, גרסה 2 (גונן: "הדמויות לא פרופורציונליות", "לא באמת רואים תלת-ממד").
// פרספקטיבה אמיתית: נקודת מגוז אחת, רצפה ותקרה במשבצות שמתכנסות, לבנים בקירות הצד, הצללה לפי מרחק (דיתור),
// ופתחים בצדדים. הדמויות מצוירות בפרופורציות של גוף, עומדות על הרצפה בעומק שלהן, וקטנות עם המרחק.
import { createGfx, W, H, PALETTES, BLACK } from '/assets/dragon/gfx.js';
const q = new URLSearchParams(location.search), scene = q.get('scene') || 'corridor', pal = +(q.get('pal') || 1);
const [C0, C1, C2, C3] = PALETTES[pal];
const g = createGfx(document.getElementById('c'));
const ctx = g.ctx;
const px = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, 1, 1); } };
function line(x0, y0, x1, y1, c, dot) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx + dy, n = 0;
  for (;;) { if (!dot || n++ % 2 === 0) px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
// דיתור לפי עוצמה 0..4 (4 = מלא): דפוס בייר 2×2, כמו שמשחקים של אז הצללו בארבעה צבעים
const BAYER = [[0, 2], [3, 1]];
const lit = (x, y, k) => k >= 4 || BAYER[y & 1][x & 1] < k;
// נקודת המגוז ומישורי העומק. z = מרחק במשבצות; גודל המישור יחסי ל-1/z
const VX = 128, VY = 70, VIEW = 150;
const P = z => { const s = 1 / (0.62 + 0.62 * z); return [VX - 128 * s * 1.0, VY - 92 * s, VX + 128 * s * 1.0, VY + 92 * s]; };
const shadeOf = z => z < 0.8 ? 4 : z < 1.8 ? 3 : z < 2.8 ? 2 : 1;

function polyFill(pts, c, k) {   // מילוי מצולע קמור בשורות, עם דיתור
  let y0 = Math.min(...pts.map(p => p[1])) | 0, y1 = Math.max(...pts.map(p => p[1])) | 0;
  for (let y = Math.max(0, y0); y <= Math.min(VIEW - 1, y1); y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + (y - ay) * (bx - ax) / (by - ay)); }
    if (xs.length < 2) continue;
    const a = Math.round(Math.min(...xs)), b = Math.round(Math.max(...xs));
    for (let x = a; x <= b; x++) if (lit(x, y, k)) px(x, y, c);
  }
}
// קיר צד בין עומק z0 ל-z1 (side -1 שמאל, 1 ימין), עם לבנים שמתכנסות
function sideWall(z0, z1, side, wallC, lineC, light) {
  const a = P(z0), b = P(z1), xa = side < 0 ? a[0] : a[2], xb = side < 0 ? b[0] : b[2];
  const k = Math.min(shadeOf((z0 + z1) / 2), light);
  polyFill([[xa, a[1]], [xb, b[1]], [xb, b[3]], [xa, a[3]]], wallC, k);
  if (k <= 0) return;
  for (let r = 1; r < 6; r++) { const t = r / 6; line(xa, a[1] + (a[3] - a[1]) * t, xb, b[1] + (b[3] - b[1]) * t, lineC); }
  for (let j = 0; j <= 4; j++) { const t = j / 4, zz = z0 + (z1 - z0) * t, pp = P(zz), x = side < 0 ? pp[0] : pp[2]; for (let r = 0; r < 6; r++) { if ((r + j) % 2) continue; const t0 = r / 6, t1 = (r + 1) / 6; line(x, pp[1] + (pp[3] - pp[1]) * t0, x, pp[1] + (pp[3] - pp[1]) * t1, lineC); } }
  line(xa, a[1], xb, b[1], lineC); line(xa, a[3], xb, b[3], lineC); line(xb, b[1], xb, b[3], lineC);
}
// פתח בצד: רואים את קיר המסדרון הצדדי, ישר מול העין (מלבן בעומק z1)
function sideOpening(z0, z1, side, wallC, lineC, light) {
  const a = P(z0), b = P(z1), xa = side < 0 ? a[0] : a[2], xb = side < 0 ? b[0] : b[2];
  const k = Math.min(shadeOf(z1), light);
  polyFill([[Math.min(xa, xb), b[1]], [Math.max(xa, xb), b[1]], [Math.max(xa, xb), b[3]], [Math.min(xa, xb), b[3]]], wallC, Math.max(0, k - 1));
  line(xa, b[1], xb, b[1], lineC); line(xa, b[3], xb, b[3], lineC); line(xb, b[1], xb, b[3], lineC); line(xa, a[1], xa, a[3], lineC);
}
function frontWall(z, wallC, lineC, light) {
  const [x0, y0, x1, y1] = P(z), k = Math.min(shadeOf(z), light);
  polyFill([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], wallC, k);
  if (k <= 0) return;
  const h = (y1 - y0) / 6;
  for (let r = 1; r < 6; r++) line(x0, y0 + h * r, x1, y0 + h * r, lineC);
  for (let r = 0; r < 6; r++) for (let x = x0 + (r % 2 ? h : 2 * h); x < x1 - 1; x += 2 * h) line(x, y0 + h * r, x, y0 + h * (r + 1), lineC);
  line(x0, y0, x1, y0, lineC); line(x0, y1, x1, y1, lineC); line(x0, y0, x0, y1, lineC); line(x1, y0, x1, y1, lineC);
}
// רצפה ותקרה: קווי משבצות שמתכנסות לנקודת המגוז, וקו רוחב בכל עומק
function floorCeil(zmax, c, light) {
  const far = P(zmax);
  for (let i = -6; i <= 6; i++) {
    const xb = VX + i * 52, tFar = far;
    line(xb, VIEW - 1, VX + (xb - VX) * ((tFar[3] - VY) / (VIEW - 1 - VY)), tFar[3], c, true);
    line(xb, 0, VX + (xb - VX) * ((VY - tFar[1]) / (VY)), tFar[1], c, true);
  }
  for (let z = 0.5; z <= zmax; z += 0.5) { const p = P(z); if (shadeOf(z) > light) continue; line(0, p[3], W - 1, p[3], c, z > 1.5); line(0, p[1], W - 1, p[1], c, true); }
}
function view(layout, light, wallC, lineC, floorC) {
  g.clear(BLACK);
  const zmax = Math.min(layout.length, light + 0.2);
  floorCeil(zmax, floorC, light);
  // מהרחוק לקרוב, כדי שהקרוב יכסה
  for (let i = layout.length - 1; i >= 0; i--) {
    const L = layout[i], z0 = i, z1 = i + 1;
    if (shadeOf(z0) > light + 1 && z0 > light) continue;
    if (L.front) frontWall(z1, wallC, lineC, light);
    if (L.left === 1) sideWall(z0, z1, -1, wallC, lineC, light); else if (L.left === 2) sideOpening(z0, z1, -1, wallC, lineC, light);
    if (L.right === 1) sideWall(z0, z1, 1, wallC, lineC, light); else if (L.right === 2) sideOpening(z0, z1, 1, wallC, lineC, light);
  }
}
// דמות שעומדת על הרצפה בעומק z: הרגליים על קו הרצפה, הגובה יחסי ל-1/z
// realH = הגובה האמיתי של הדמות ביחס לגובה המסדרון (שלד 0.8, עכברוש 0.18)
function stand(rows, z, colors, xOff = 0, realH = 0.8) {
  const p = P(z), floorY = p[3], scale = Math.max(1, Math.round((p[3] - p[1]) * realH / rows.length));
  const w = rows[0].length * scale, h = rows.length * scale;
  g.sprite(rows, VX - w / 2 + xOff * (p[2] - p[0]), floorY - h, colors, false, scale);
}
// שלד בפרופורציות של גוף (1 עצם, 2 צל)
const SKEL = [
  '.....1111.....', '....111111....', '....1.11.1....', '....111111....', '.....1..1.....', '.....1111.....', '......11......',
  '...11111111...', '..1..1111..1..', '..1.111111.1..', '.1...1111...1.', '.1..111111..1.', '.1...1111...1.', '1....1111....1',
  '1.....11.....1', '......11......', '....111111....', '....1....1....', '....1....1....', '...11....11...', '...1......1...',
  '...1......1...', '...1......1...', '...1......1...', '..11......11..', '.111......111.'
];
// עכברוש: נמוך וארוך (1 עין, 3 גוף, 2 זנב)
const RAT = ['.........33....', '.......333133..', '..333333333333.', '.33333333333...', '2.3..3...3.3...', '2..............', '.22............'];
// אביר שריון (1 מתכת, 3 נוצה, 2 חרב)
const KNIGHT = [
  '.....3......', '....333.....', '....1111....', '...111111...', '...1.11.1...', '...111111...', '....1111....', '..11111111..',
  '.1111111111.', '11.111111.112', '11.111111.112', '1..111111..12', '...111111...2', '...11..11...2', '...11..11....', '...11..11....',
  '...11..11....', '...11..11....', '..111..111...', '.1111..1111..'
];


// דמויות פחות מפחידות (גונן: "לא אוהב שלד, שיהיה דמות פחות מפחידה")
// גובלין קטן ושובב: אוזניים גדולות, עיניים עגולות (1 עור, 2 עיניים, 3 בגד)
const GOBLIN = [
  '1.........1', '11..111..11', '.111111111.', '..1222221..', '..1202021..', '..1222221..', '...11111...', '....111....',
  '..3333333..', '.1.33333.1.', '1..33333..1', '...33.33...', '...3...3...', '..11...11..'
];
// איש פטרייה: כובע מנוקד, פנים חייכניות (3 כובע, 1 נקודות ופנים, 2 עיניים)
const MUSH = [
  '....33333....', '..333133333..', '.33333331133.', '3313333333313', '3333333333333', '....11111....', '....12121....',
  '....11111....', '....1...1....', '.....111.....', '....11111....', '...1.111.1...', '....1...1....', '...11...11...'
];
// רוח רפאים: טיפה מרחפת עם זנב מתפתל וחיוך (לא בצורת הרוחות של Pac-Man) (1 גוף, 2 עיניים ופה)
const GHOST = [
  '.....111.....', '...1111111...', '..111111111..', '.11211111211.', '.11211111211.', '.11111111111.', '.11121112111.',
  '..111222111..', '..111111111..', '...1111111...', '....111111...', '.....11111...', '......1111...', '.......111...',
  '........11...', '.......11....'
];
// טרול שומר שמנמן עם אלה (1 עור, 2 עיניים, 3 בגד)
const TROLL = [
  '....11111....', '...1111111...', '...1211121...', '...1111111...', '....1...1....', '....11111....', '.11333333311.',
  '1113333333111', '11.33333333.1', '11.33333333.3', '...3333333..3', '...333.333...', '...11...11...', '..111...111..'
];


// מפלצת קומה: יצור מערות גדול עם קרניים וטפרים (גונן: "גם מפלצת, קרב, ולהרוג אותה"). 3 גוף, 1 קרניים וציפורניים, 2 עיניים
const BEAST = [
  '..1...............1..', '..11.............11..', '...11...33333...11...', '....11333333333.11...', '.....333333333333....',
  '....33332333233333...', '....33322333223333...', '....333333333333333..', '.....33311111113333..', '.....3331.1.1.1333...',
  '......33333333333....', '...3333333333333333..', '..33.3333333333333.33', '.33..333333333333..33', '33...333333333333...3',
  '1.1..333333333333..1.1', '1.1..3333333333333.1.1', '.....33333.333333.....', '.....3333...33333.....', '.....333.....3333.....',
  '....3333.....3333.....', '...11111....111111....'
];
// גל של מכה: קשת של קווים מול השחקן
function slash(c) { for (let i = 0; i < 4; i++) line(150 + i * 3, 30 + i * 2, 90 + i * 3, 120 + i * 2, c); }
// פס חיים של המפלצת למעלה
function bossBar(name, f, c, frame) { g.rect(0, 0, W, 20, BLACK); g.text(name, 128, 3, c, 'center'); g.rect(64, 12, 128, 5, frame); g.rect(64, 12, 128 * f, 5, c); }


// מפלצות קומה בסגנון של ארבע הדמויות (גונן הצביע על הגובלין, הפטרייה, הרוח והטרול: "מקודם הצגת משהו יפה יותר")
// אוגר עם קרניים ואלה גדולה (1 עור, 2 עיניים ופה, 3 בגד, 0 קרניים ואלה)
const OGRE = [
  '..0.............0..', '..00...11111...00..', '...00111111111.00...', '....1111111111111...', '....1122111112211...', '....1122111112211...',
  '....1111111111111...', '....1112222222111...', '.....11121212111....', '......111111111.....', '...333333333333333..', '..13333333333333331.',
  '.113333333333333311.', '.11.3333333333333.110', '.11.3333333333333.000', '.11..33333333333..000', '.11..33333333333...0.', '.....333333.33333....',
  '.....3333....3333....', '.....111......111....', '....1111......1111...', '...11111......11111..'
];
// גולם אבן: גוש סלעים עם עיניים זוהרות (1 סלע, 2 עיניים, 0 סדקים)
const GOLEM = [
  '......1111111......', '.....111111111.....', '.....1122111221....', '.....1122111221....', '.....111100111.....', '......1111111......',
  '..1111111111111111.', '.11111101111011111.', '1111111111111111111', '1111.111110111.1111', '111..1111111111.111', '111..1101111111..111',
  '11...1111111011..11', '.....1111111111.....', '.....1111..1111.....', '.....1110..0111.....', '....11111..11111....', '...111111..111111...'
];

const D = { 1: C1, 2: C2, 3: C3, 0: C0 };
if (scene === 'ogre') {
  view([{ left: 1, right: 1 }, { left: 1, right: 1 }, { left: 1, right: 1, front: 1 }], 4, C0, C2, C1);
  stand(OGRE, 1.7, { 1: C0, 2: BLACK, 3: C3, 0: C1 }, 0, 0.88);
  bossBar('THE OGRE KING', 0.7, C3, C2);
} else if (scene === 'golem') {
  view([{ left: 1, right: 1 }, { left: 1, right: 1 }, { left: 1, right: 1, front: 1 }], 4, C0, C2, C1);
  stand(GOLEM, 1.7, { 1: C1, 2: C3, 0: BLACK }, 0, 0.88);
  bossBar('THE STONE GOLEM', 0.5, C3, C2);
} else if (scene === 'beast') {
  view([{ left: 1, right: 1 }, { left: 1, right: 1 }, { left: 1, right: 1, front: 1 }], 4, C0, C2, C1);
  stand(BEAST, 1.15, { 3: C3, 1: C1, 2: BLACK }, 0, 0.95);
  slash(C1);
  bossBar('THE CAVE BEAST', 0.4, C3, C2);
} else if (scene === 'beastwin') {
  view([{ left: 1, right: 1 }, { left: 1, right: 1 }, { left: 1, right: 1, front: 1 }], 4, C0, C2, C1);
  for (let i = 0; i < 160; i++) px(80 + (i * 37) % 96, 40 + (i * 53) % 90, i % 3 ? C1 : C2);
  g.text('THE BEAST IS DEFEATED!', 128, 3, C1, 'center');
} else if (scene === 'cast') {
  view([{ left: 1, right: 1 }, { left: 1, right: 1 }, { left: 1, right: 1 }, { left: 1, right: 1, front: 1 }], 4, C0, C2, C1);
} else if (scene === 'goblin') {
  view([{ left: 1, right: 1 }, { left: 1, right: 2 }, { left: 1, right: 1 }, { left: 1, right: 1, front: 1 }], 4, C0, C2, C1);
  stand(GOBLIN, 1.3, { 1: C0, 2: BLACK, 0: C1, 3: C3 }, 0, 0.5);
} else if (scene === 'mushroom') {
  view([{ left: 1, right: 1 }, { left: 2, right: 1 }, { left: 1, right: 1 }, { left: 1, right: 1, front: 1 }], 4, C0, C2, C1);
  stand(MUSH, 1.3, { 3: C3, 1: C1, 2: BLACK }, 0, 0.55);
} else if (scene === 'ghost') {
  view([{ left: 1, right: 1 }, { left: 1, right: 1 }, { left: 2, right: 1 }, { left: 1, right: 1, front: 1 }], 4, C0, C2, C1);
  stand(GHOST, 1.4, { 1: C1, 2: C2 }, 0, 0.6);
} else if (scene === 'troll') {
  view([{ left: 1, right: 1 }, { left: 1, right: 1 }, { left: 1, right: 1, front: 1 }], 4, C0, C2, C1);
  stand(TROLL, 1.25, { 1: C0, 2: BLACK, 3: C3 }, 0, 0.8);
} else if (scene === 'corridor') {
  view([{ left: 1, right: 1 }, { left: 2, right: 1 }, { left: 1, right: 2 }, { left: 1, right: 1, front: 1 }], 4, C0, C2, C1);
} else if (scene === 'skeleton') {
  view([{ left: 1, right: 1 }, { left: 1, right: 2 }, { left: 1, right: 1 }, { left: 1, right: 1, front: 1 }], 4, C0, C2, C1);
  stand(SKEL, 1.3, { 1: C1, 2: C2 });
} else if (scene === 'far') {
  view([{ left: 1, right: 1 }, { left: 1, right: 1 }, { left: 2, right: 1 }, { left: 1, right: 1, front: 1 }], 4, C0, C2, C1);
  stand(SKEL, 3.2, { 1: C1 });
  stand(RAT, 1.1, { 3: C3, 1: C1, 2: C2 }, 0.18, 0.16);
} else if (scene === 'knight') {
  view([{ left: 1, right: 1 }, { left: 1, right: 1 }, { left: 1, right: 1, front: 1 }], 4, C0, C2, C1);
  stand(KNIGHT, 1.25, { 1: C1, 2: C2, 3: C3 }, 0, 0.85);
} else if (scene === 'dark') {
  view([{ left: 1, right: 1 }, { left: 2, right: 1 }, { left: 1, right: 1 }, { left: 1, right: 1, front: 1 }], 1.6, C0, C2, C1);
  stand(RAT, 1.0, { 3: C3, 1: C1, 2: C2 }, -0.1, 0.16);
}
// פס מידע
const HEART = ['33.33', '33333', '33333', '.333.', '..3..'];
g.rect(0, VIEW, W, H - VIEW, BLACK); line(0, VIEW + 1, W - 1, VIEW + 1, C2);
for (let i = 0; i < 5; i++) g.sprite(HEART, 6 + i * 9, 158, { 3: i < (scene === 'dark' ? 2 : 4) ? C3 : C2 }, false);
g.rect(60, 160, 60, 5, C2); g.rect(60, 160, scene === 'dark' ? 10 : 45, 5, C1);
g.text('SWORD', 132, 158, C0); g.text('LEVEL 1', 250, 158, C0, 'right');
g.text(scene === 'ogre' || scene === 'golem' ? 'FIRE STRIKES. DODGE ITS CLUB!' : scene === 'beast' ? 'FIRE TO STRIKE - DODGE ITS CLAWS!' : scene === 'beastwin' ? 'THE WAY DOWN IS OPEN' : scene === 'goblin' ? 'A GOBLIN!' : scene === 'mushroom' ? 'A MUSHROOM MAN!' : scene === 'ghost' ? 'A LITTLE GHOST!' : scene === 'troll' ? 'A TROLL GUARD!' : scene === 'skeleton' ? 'A SKELETON!' : scene === 'knight' ? 'A KNIGHT BLOCKS THE WAY' : scene === 'dark' ? 'THE TORCH IS DYING...' : 'NORTH', 128, 176, C1, 'center');
window.mockDone = true;
