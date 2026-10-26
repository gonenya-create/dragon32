// מחסנית "DRAGON DEEP" (מעמקי הדרקון): משחק מבוך תלת-ממדי בגוף ראשון, ברוח משחקי המבוך של 1983. משחק מקורי.
// גונן (26.10.2026): "משחק ברמה גבוהה לאפליקציה... רמה טופ", בגבולות של Dragon. התכנון: docs/DRAGON-GAME-DEEP.md.
// קומות (כל אחת מבוך 16×16 שמצויר ביד, בערכת צבעים משלה): 1 אבן, גובלינים, אנשי פטרייה ועכברושים, ובסוף מלך האוגרים;
// 2 ירוקה, רוחות קטנות שעוברות דרך קירות, דלת נעולה ומפתח, ובסוף גולם האבן. ההתקדמות נשמרת בתחילת כל קומה.
// שליטה: ▲ צעד קדימה, ▼ צעד אחורה (גם התחמקות ממכה), ◀ ▶ פנייה, FIRE מכה ויורד במדרגות, P מפה.
import { W, H, PALETTES, BLACK } from '../gfx.js';

let [C0, C1, C2, C3] = PALETTES[1];   // הצבעים של הקומה הנוכחית (שתי הערכות של PMODE 3)
const setPalette = i => { [C0, C1, C2, C3] = PALETTES[i]; };
const VIEW = 150;                         // גובה המבט; מתחתיו פס המידע

// ---- המבוך של קומה 1 (מצויר ביד, כדי שלכל מקום יהיה אופי ושכולם ישחקו באותו מבוך) ----
// # קיר  . רצפה  @ התחלה  S מדרגות  D דלת נעולה  c מטבע  t לפיד  p שיקוי  k מפתח
// r עכברוש  g גובלין  m איש פטרייה  h רוח קטנה  B מלך האוגרים  G גולם האבן
const MAP1 = [
  '################',
  '#@..c#....g....#',
  '#.##.#.####.##.#',
  '#.#..t.#..#..#.#',
  '#g#.####.c#.##.#',
  '#...#r...##....#',
  '###.#.####..#m.#',
  '#c..#....p#.####',
  '#.###.##.##....#',
  '#...#..#..#.##.#',
  '#.#.##.#g.#..#c#',
  '#.#....##.##.#.#',
  '#.####.#....r#.#',
  '#...m#.#.##.##.#',
  '#.c#...t..#..BS#',
  '################'
];
// קומה 2: המפתח בצפון, הדלת בדרום-מזרח, ומאחוריה הגולם והמדרגות
const MAP2 = [
  '################',
  '#@...#...h.....#',
  '#.##.#.###.###.#',
  '#.#k.#...#...#.#',
  '#.#.####.###.#.#',
  '#...#..m...#...#',
  '#.###.####.###.#',
  '#.....#c.....#.#',
  '#####.#.####.#.#',
  '#t..#...#..p.#.#',
  '#.#.#####.##.#.#',
  '#.#...h......#.#',
  '#.####.#####.#.#',
  '#.c..#.#...#.###',
  '#.##...#.r..DGS#',
  '################'
];
// לכל קומה עולם משלו (גונן: "כל הקומות נראות אותו דבר רק בצבע שונה?"): 1 מרתף לבנים עם לפידים, 2 מערה
const FLOORS = [{ map: MAP1, pal: 1, style: 'brick' }, { map: MAP2, pal: 0, style: 'cave' }];
let STYLE = 'brick';
// מספר קבוע לכל משבצת, כדי שהסלעים והלפידים יישארו באותו מקום בכל צעד
const hash = (x, y, k = 0) => { let h = (x * 374761393 + y * 668265263 + k * 2246822519) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const lerp = (a, b, t) => a + (b - a) * t;
const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];   // 0 צפון, 1 מזרח, 2 דרום, 3 מערב
const DIRS = ['NORTH', 'EAST', 'SOUTH', 'WEST'];

// ---- הדמויות (מקוריות, בפרופורציות; realH = גובה אמיתי ביחס לגובה המסדרון) ----
const RAT = ['.........33....', '.......333133..', '..333333333333.', '.33333333333...', '2.3..3...3.3...', '2..............', '.22............'];
const GOBLIN = [
  '1.........1', '11..111..11', '.111111111.', '..1222221..', '..1202021..', '..1222221..', '...11111...', '....111....',
  '..3333333..', '.1.33333.1.', '1..33333..1', '...33.33...', '...3...3...', '..11...11..'
];
const MUSH = [
  '....33333....', '..333133333..', '.33333331133.', '3313333333313', '3333333333333', '....11111....', '....12121....',
  '....11111....', '....1...1....', '.....111.....', '....11111....', '...1.111.1...', '....1...1....', '...11...11...'
];
const OGRE = [
  '..0.............0..', '..00...11111...00..', '...00111111111.00...', '....1111111111111...', '....1122111112211...', '....1122111112211...',
  '....1111111111111...', '....1112222222111...', '.....11121212111....', '......111111111.....', '...333333333333333..', '..13333333333333331.',
  '.113333333333333311.', '.11.3333333333333.110', '.11.3333333333333.000', '.11..33333333333..000', '.11..33333333333...0.', '.....333333.33333....',
  '.....3333....3333....', '.....111......111....', '....1111......1111...', '...11111......11111..'
];
const GHOST = [
  '.....111.....', '...1111111...', '..111111111..', '.11211111211.', '.11211111211.', '.11111111111.', '.11121112111.',
  '..111222111..', '..111111111..', '...1111111...', '....111111...', '.....11111...', '......1111...', '.......111...',
  '........11...', '.......11....'
];
const GOLEM = [
  '......1111111......', '.....111111111.....', '.....1122111221....', '.....1122111221....', '.....111100111.....', '......1111111......',
  '..1111111111111111.', '.11111101111011111.', '1111111111111111111', '1111.111110111.1111', '111..1111111111.111', '111..1101111111..111',
  '11...1111111011..11', '.....1111111111.....', '.....1111..1111.....', '.....1110..0111.....', '....11111..11111....', '...111111..111111...'
];
// הצבעים של כל דמות הם פונקציה, כי בכל קומה ערכת הצבעים אחרת
const KINDS = {
  r: { name: 'A RAT', rows: RAT, h: 0.16, hp: 1, dmg: 1, speed: 60, pts: 10, col: () => ({ 3: C3, 1: C1, 2: C2 }) },
  g: { name: 'A GOBLIN', rows: GOBLIN, h: 0.5, hp: 2, dmg: 1, speed: 75, pts: 25, col: () => ({ 1: C0, 2: BLACK, 0: C1, 3: C3 }) },
  m: { name: 'A MUSHROOM MAN', rows: MUSH, h: 0.55, hp: 3, dmg: 1, speed: 110, pts: 40, col: () => ({ 3: C3, 1: C1, 2: BLACK }) },
  h: { name: 'A LITTLE GHOST', rows: GHOST, h: 0.6, hp: 2, dmg: 1, speed: 70, pts: 35, col: () => ({ 1: C1, 2: C2 }), ghost: true },
  B: { name: 'THE OGRE KING', rows: OGRE, h: 0.88, hp: 12, dmg: 2, speed: 85, pts: 300, col: () => ({ 1: C0, 2: BLACK, 3: C3, 0: C1 }), boss: true },
  G: { name: 'THE STONE GOLEM', rows: GOLEM, h: 0.88, hp: 16, dmg: 2, speed: 95, pts: 450, col: () => ({ 1: C1, 2: C3, 0: BLACK }), boss: true }
};
const COIN = ['.11.', '1221', '1221', '.11.'];
const TORCH = ['.1.', '121', '.1.', '.3.', '.3.', '.3.'];
const POTION = ['.1.', '.1.', '333', '323', '333'];
const HEART = ['33.33', '33333', '33333', '.333.', '..3..'];
const KEY = ['.11....', '1..1111', '.11.1.1'];

// ---- המבט התלת-ממדי: מצויר לתוך מאגר פיקסלים, ורק כשמשהו משתנה (צעד, פנייה, לפיד) ----
let img = null, buf = null;
const RGBA = {};
for (const c of [...PALETTES[0], ...PALETTES[1], BLACK]) { const n = parseInt(c.slice(1), 16); RGBA[c] = (255 << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | (n >> 16); }
const px = (x, y, c) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < W && y < VIEW) buf[y * W + x] = RGBA[c]; };
function line(x0, y0, x1, y1, c, dot) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx + dy, n = 0;
  for (;;) { if (!dot || n++ % 2 === 0) px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
// הצללה בדיתור 2×2 (בייר), כמו שמשחקים של אז הצללו בארבעה צבעים: 4 מלא, 1 כמעט חושך
const BAYER = [[0, 2], [3, 1]];
const lit = (x, y, k) => k >= 4 || BAYER[y & 1][x & 1] < k;
// נקודת המגוז ומישורי העומק: גודל המישור יחסי ל-1/z
const VX = 128, VY = 70;
const P = z => { const s = 1 / (0.62 + 0.62 * z); return [VX - 128 * s, VY - 92 * s, VX + 128 * s, VY + 92 * s]; };
const shadeOf = z => z < 0.8 ? 4 : z < 1.8 ? 3 : z < 2.8 ? 2 : 1;
// עוצמת האור בעומק z: גם לפי המרחק וגם לפי כמה הלפיד חזק
const shade = (z, lt) => Math.max(0, Math.min(shadeOf(z), Math.round(4 * (lt - z) / Math.max(lt, 1) + 0.5)));
function polyFill(pts, c, k) {
  if (k <= 0) return;
  const y0 = Math.min(...pts.map(p => p[1])) | 0, y1 = Math.max(...pts.map(p => p[1])) | 0;
  for (let y = Math.max(0, y0); y <= Math.min(VIEW - 1, y1); y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + (y - ay) * (bx - ax) / (by - ay)); }
    if (xs.length < 2) continue;
    const a = Math.max(0, Math.round(Math.min(...xs))), b = Math.min(W - 1, Math.round(Math.max(...xs)));
    for (let x = a; x <= b; x++) if (lit(x, y, k)) px(x, y, c);
  }
}
function sideWall(z0, z1, side, light, cx = 0, cy = 0) {
  const a = P(z0), b = P(z1), xa = side < 0 ? a[0] : a[2], xb = side < 0 ? b[0] : b[2];
  const k = shade((z0 + z1) / 2, light);
  if (k <= 0) return;
  polyFill([[xa, a[1]], [xb, b[1]], [xb, b[3]], [xa, a[3]]], C0, k);
  const at = (t, u) => [lerp(xa, xb, t), lerp(lerp(a[1], b[1], t), lerp(a[3], b[3], t), u)];
  if (STYLE === 'cave') { caveLayers(at, cx * 2 + (side < 0 ? 0 : 1), cy); line(xa, a[1], xb, b[1], C2); line(xa, a[3], xb, b[3], C2); line(xb, b[1], xb, b[3], C2); stalactites(at, cx + side, cy); return; }
  if (hash(cx, cy, side) < 0.3) wallTorch(at, z0 + 0.5, light);
  for (let r = 1; r < 6; r++) { const t = r / 6; line(xa, a[1] + (a[3] - a[1]) * t, xb, b[1] + (b[3] - b[1]) * t, C2); }
  for (let j = 0; j <= 4; j++) {
    const pp = P(z0 + (z1 - z0) * j / 4), x = side < 0 ? pp[0] : pp[2];
    for (let r = 0; r < 6; r++) if ((r + j) % 2 === 0) line(x, pp[1] + (pp[3] - pp[1]) * r / 6, x, pp[1] + (pp[3] - pp[1]) * (r + 1) / 6, C2);
  }
  line(xa, a[1], xb, b[1], C2); line(xa, a[3], xb, b[3], C2); line(xb, b[1], xb, b[3], C2);
}
function sideOpening(z0, z1, side, light) {
  const a = P(z0), b = P(z1), xa = side < 0 ? a[0] : a[2], xb = side < 0 ? b[0] : b[2];
  const k = shade(z1, light) - 1;
  if (k > 0) polyFill([[Math.min(xa, xb), b[1]], [Math.max(xa, xb), b[1]], [Math.max(xa, xb), b[3]], [Math.min(xa, xb), b[3]]], C0, k);
  if (k < 0) return;
  line(xa, b[1], xb, b[1], C2); line(xa, b[3], xb, b[3], C2); line(xb, b[1], xb, b[3], C2); line(xa, a[1], xa, a[3], C2);
}
function frontWall(z, light, door) {
  const [x0, y0, x1, y1] = P(z), k = shade(z, light);
  if (k <= 0) return;
  if (door) {   // דלת עץ עם מסגרת, קרשים וחור מנעול
    polyFill([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], C0, k);
    const dx0 = x0 + (x1 - x0) * 0.22, dx1 = x1 - (x1 - x0) * 0.22, dy0 = y0 + (y1 - y0) * 0.12;
    polyFill([[dx0, dy0], [dx1, dy0], [dx1, y1], [dx0, y1]], C3, Math.max(1, k));
    for (let i = 1; i < 4; i++) { const x = dx0 + (dx1 - dx0) * i / 4; line(x, dy0, x, y1, C2); }
    line(dx0, dy0, dx1, dy0, C1); line(dx0, dy0, dx0, y1, C1); line(dx1, dy0, dx1, y1, C1);
    const kx = (dx0 + dx1) / 2 + (dx1 - dx0) * 0.3, ky = (dy0 + y1) / 2;
    line(kx, ky - 2, kx, ky + 2, C1);
    return;
  }
  polyFill([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], C0, k);
  if (STYLE === 'cave') { const at = (t, u) => [lerp(x0, x1, t), lerp(y0, y1, u)]; caveRock(at, 99, z * 7 | 0); line(x0, y0, x1, y0, C2); line(x0, y1, x1, y1, C2); line(x0, y0, x0, y1, C2); line(x1, y0, x1, y1, C2); stalactites(at, 98, z * 5 | 0); return; }
  const h = (y1 - y0) / 6;
  for (let r = 1; r < 6; r++) line(x0, y0 + h * r, x1, y0 + h * r, C2);
  for (let r = 0; r < 6; r++) for (let x = x0 + (r % 2 ? h : 2 * h); x < x1 - 1; x += 2 * h) line(x, y0 + h * r, x, y0 + h * (r + 1), C2);
  line(x0, y0, x1, y0, C2); line(x0, y1, x1, y1, C2); line(x0, y0, x0, y1, C2); line(x1, y0, x1, y1, C2);
}
// סלע: גושים לא ישרים עם סדקים, במקום לבנים. at(t,u) ממפה נקודה על הקיר (0..1) למסך
function caveRock(at, cx, cy) {
  for (let n = 0; n < 7; n++) {
    const t = hash(cx, cy, n * 3), u = hash(cx, cy, n * 3 + 1), r = 0.08 + hash(cx, cy, n * 3 + 2) * 0.1;
    let prev = null;
    for (let i = 0; i <= 6; i++) {
      const ang = i / 6 * 6.283, rr = r * (0.7 + 0.6 * hash(cx + i, cy, n));
      const pt = at(Math.min(1, Math.max(0, t + Math.cos(ang) * rr)), Math.min(1, Math.max(0, u + Math.sin(ang) * rr * 1.4)));
      if (prev) line(prev[0], prev[1], pt[0], pt[1], C2);
      prev = pt;
    }
  }
  for (let n = 0; n < 3; n++) {   // סדק שיורד באלכסון
    let t = hash(cx, cy, 40 + n), u = hash(cx, cy, 50 + n) * 0.5, prev = at(t, u);
    for (let i = 0; i < 4; i++) { t += (hash(cx, cy, 60 + n * 4 + i) - 0.5) * 0.12; u += 0.1; const pt = at(Math.min(1, Math.max(0, t)), Math.min(1, u)); line(prev[0], prev[1], pt[0], pt[1], C2); prev = pt; }
  }
}
// קיר מערה בצד: שכבות סלע גליות שמתכנסות לעומק (קווים מעטים, כדי שהקיר לא יהיה עמוס)
function caveLayers(at, cx, cy) {
  for (let n = 0; n < 4; n++) {
    const u0 = 0.18 + n * 0.21 + (hash(cx, cy, 20 + n) - 0.5) * 0.08;
    let prev = at(0, u0);
    for (let i = 1; i <= 6; i++) { const t = i / 6, pt = at(t, u0 + Math.sin(t * 6 + n + cx) * 0.04 + (hash(cx, cy, 30 + n * 7 + i) - 0.5) * 0.04); line(prev[0], prev[1], pt[0], pt[1], C2); prev = pt; }
  }
}
// נטיפים שתלויים מהתקרה, לאורך הקצה העליון של הקיר
function stalactites(at, cx, cy) {
  for (let n = 0; n < 5; n++) {
    const t = (n + 0.2 + hash(cx, cy, 70 + n) * 0.6) / 5, len = 0.06 + hash(cx, cy, 80 + n) * 0.14;
    const [x, y] = at(t, 0), [, y2] = at(t, len), [xl] = at(Math.max(0, t - 0.03), 0), [xr] = at(Math.min(1, t + 0.03), 0);
    line(xl, y, x, y2, C1); line(xr, y, x, y2, C1);
  }
}
// לפיד על קיר הלבנים: מוט ולהבה שמהבהבת (הלהבה מצוירת מחדש עם הלפיד שלך, אז היא נראית חיה בכל צעד)
function wallTorch(at, z, light) {
  if (shade(z, light) < 2) return;
  const [x, y] = at(0.5, 0.36), [, y2] = at(0.5, 0.62), h = Math.max(3, y2 - y);
  line(x, y, x, y + h, C3); line(x + 1, y, x + 1, y + h, C3);
  for (let i = 0; i < h * 0.9; i++) { const w = Math.max(0.6, (h * 0.9 - i) * 0.45); line(x - w + 0.5, y - i, x + w + 0.5, y - i, i % 2 ? C1 : C3); }
}
// שלולית מים על רצפת המערה
function puddle(z) {
  const a = P(z), b = P(z + 0.6), y0 = a[3], y1 = b[3], w = (a[2] - a[0]) * 0.18;
  for (let y = Math.round(y1); y <= Math.round(y0); y++) { const t = (y - y1) / Math.max(1, y0 - y1), ww = w * Math.sin(t * Math.PI) * (0.6 + 0.4 * t); for (let x = Math.round(VX - ww); x <= Math.round(VX + ww); x++) if ((x + y) % 2 === 0) px(x + 18, y, C2); }
}
function floorCeil(zmax, light) {
  const far = P(zmax);
  for (let i = -6; i <= 6; i++) {
    const xb = VX + i * 52;
    line(xb, VIEW - 1, VX + (xb - VX) * ((far[3] - VY) / (VIEW - 1 - VY)), far[3], C1, true);
    line(xb, 0, VX + (xb - VX) * ((VY - far[1]) / VY), far[1], C1, true);
  }
  for (let z = 0.5; z <= zmax; z += 0.5) { if (shade(z, light) <= 0) continue; const p = P(z); line(0, p[3], W - 1, p[3], C1, z > 1.5); line(0, p[1], W - 1, p[1], C1, true); }
}
// מדרגות על הרצפה בעומק z (קווים צהובים-תכלת שיורדים)
function stairsAt(z) {
  const a = P(z), b = P(z + 0.8);
  for (let i = 0; i < 5; i++) { const t = i / 5, y = a[3] + (b[3] - a[3]) * t, w = ((a[2] - a[0]) + ((b[2] - b[0]) - (a[2] - a[0])) * t) * 0.32; line(VX - w, y, VX + w, y, C1); }
}

// ---- מצב המשחק ----
const wallAt = (s, x, y) => x < 0 || y < 0 || x > 15 || y > 15 || s.map[y][x] === '#' || s.map[y][x] === 'D';
function newFloor(s) {
  const F = FLOORS[s.floor - 1];
  setPalette(F.pal); STYLE = F.style;
  s.map = F.map.map(r => r.split(''));
  s.keys = 0;
  s.mobs = []; s.items = []; s.seen = new Set();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const ch = s.map[y][x];
    if (ch === '@') { s.x = x; s.y = y; s.map[y][x] = '.'; }
    else if (KINDS[ch]) { s.mobs.push({ k: ch, x, y, hx: x, hy: y, hp: KINDS[ch].hp, cd: 30 + (x * 7 + y * 3) % 40, wind: 0, flash: 0, dust: 0 }); s.map[y][x] = '.'; }
    else if ('ctpk'.includes(ch)) { s.items.push({ k: ch, x, y }); s.map[y][x] = '.'; }
    else if (ch === 'S') { s.sx = x; s.sy = y; s.map[y][x] = '.'; }
  }
  s.dir = 1; s.dirty = true;
}
function reset(s) {
  s.hp = 5; s.torch = 1; s.coins = 0; s.score = 0; s.floor = 1; s.keys = 0; s.atkCd = 0; s.hurt = 0; s.msg = ''; s.msgT = 0; s.paused = false; s.steps = 0;
  newFloor(s);
}
const say = (s, text, t = 120) => { s.msg = text; s.msgT = t; };
// ההתקדמות נשמרת בדפדפן בתחילת כל קומה (מקומה 2), כדי שאפשר יהיה להמשיך מחר
const SAVE = 'd32-deep-save';
const loadSave = () => { try { return JSON.parse(localStorage.getItem(SAVE)); } catch (e) { return null; } };
const writeSave = s => { try { localStorage.setItem(SAVE, JSON.stringify({ floor: s.floor, hp: s.hp, coins: s.coins, score: s.score })); } catch (e) {} };
const clearSave = () => { try { localStorage.removeItem(SAVE); } catch (e) {} };
const bossOf = s => s.mobs.find(m => KINDS[m.k].boss && !m.dust);
function startFloor(s, snd) {
  newFloor(s); s.mode = 'play'; s.t = 0; s.torch = 1;
  if (s.floor > 1) writeSave(s);
  say(s, 'FLOOR ' + s.floor + (s.floor === 2 ? ' - FIND THE KEY' : ' - FIND THE STAIRS DOWN'), 180);
  snd.tone(220, 120, 440);
}
const mobAt = (s, x, y) => s.mobs.find(m => !m.dust && m.x === x && m.y === y);
const light = s => s.torch > 0 ? 1.2 + s.torch * 3 : 1;   // כמה עומקים הלפיד מאיר (לפיד גוסס: צעד אחד)

// מבנה המסדרון מול השחקן: לכל עומק, האם יש קיר משמאל/מימין (1), פתח (2), וקיר מלפנים
function layout(s) {
  const out = [], l = (s.dir + 3) % 4, r = (s.dir + 1) % 4;
  for (let i = 0; i < 5; i++) {
    const cx = s.x + DX[s.dir] * i, cy = s.y + DY[s.dir] * i;
    const cell = { x: cx, y: cy, left: wallAt(s, cx + DX[l], cy + DY[l]) ? 1 : 2, right: wallAt(s, cx + DX[r], cy + DY[r]) ? 1 : 2 };
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s.seen.add((cx + dx) + ',' + (cy + dy));
    if (cell.left === 2) s.seen.add((cx + DX[l]) + ',' + (cy + DY[l]));
    if (cell.right === 2) s.seen.add((cx + DX[r]) + ',' + (cy + DY[r]));
    out.push(cell);
    if (wallAt(s, cx + DX[s.dir], cy + DY[s.dir])) { cell.front = 1; cell.door = s.map[cy + DY[s.dir]]?.[cx + DX[s.dir]] === 'D'; break; }
  }
  return out;
}
function render(s) {
  buf.fill(RGBA[BLACK]);
  const L = layout(s), lt = light(s);
  s.view = L;
  floorCeil(Math.min(L.length, lt + 0.2), lt);
  for (let i = L.length - 1; i >= 0; i--) {
    const c = L[i], z0 = i, z1 = i + 1;
    if (z0 > lt) continue;
    if (c.front) frontWall(z1, lt, c.door);
    if (c.left === 1) sideWall(z0, z1, -1, lt, c.x, c.y); else sideOpening(z0, z1, -1, lt);
    if (c.right === 1) sideWall(z0, z1, 1, lt, c.x, c.y); else sideOpening(z0, z1, 1, lt);
    if (STYLE === 'cave' && i > 0 && shade(i, lt) > 1 && hash(c.x, c.y, 9) < 0.35) puddle(i);
    if (i > 0 && c.x === s.sx && c.y === s.sy) stairsAt(i);
  }
  s.dirty = false;
}

// BFS: הצעד הבא של אויב לכיוון השחקן, והמרחק (-1 אם רחוק מדי)
function stepToward(s, m, maxD) {
  const key = (x, y) => y * 16 + x, prev = new Map([[key(m.x, m.y), -1]]), q = [[m.x, m.y, 0]];
  while (q.length) {
    const [x, y, d] = q.shift();
    if (x === s.x && y === s.y) {
      let k = key(x, y), last = k;
      while (prev.get(k) !== key(m.x, m.y) && prev.get(k) !== -1) { last = prev.get(k); k = last; }
      return { d, nx: k % 16, ny: (k / 16) | 0 };
    }
    if (d >= maxD) continue;
    for (let i = 0; i < 4; i++) { const nx = x + DX[i], ny = y + DY[i], nk = key(nx, ny); if (!wallAt(s, nx, ny) && !prev.has(nk)) { prev.set(nk, key(x, y)); q.push([nx, ny, d + 1]); } }
  }
  return null;
}

export default {
  title: 'DRAGON DEEP',
  buttons: ['left', 'up', 'down', 'right', 'fire'],

  init(api) {
    if (!img) { img = api.gfx.ctx.createImageData(W, VIEW); buf = new Uint32Array(img.data.buffer); }
    api.state = { mode: 'title', high: api.loadHigh('deep'), t: 0, save: loadSave() };
    reset(api.state);
  },

  update(api) {
    const s = api.state, snd = api.sound;
    s.t++;
    if (s.mode === 'next') { if (api.hit('fire') && s.t > 40) { s.floor++; startFloor(s, snd); } return; }
    if (s.mode === 'title' || s.mode === 'over' || s.mode === 'won') {
      if (s.mode === 'title' && s.save && api.hit('up') && s.t > 40) {   // ממשיכים מהקומה שנשמרה
        reset(s); Object.assign(s, { floor: s.save.floor, hp: s.save.hp, coins: s.save.coins, score: s.save.score }); startFloor(s, snd); return;
      }
      if (api.hit('fire') && s.t > 40) {
        if (s.mode !== 'title') { s.mode = 'title'; s.t = 0; s.save = loadSave(); setPalette(1); STYLE = 'brick'; return; }
        reset(s); startFloor(s, snd);
      }
      return;
    }
    if (api.hit('pause')) { s.paused = !s.paused; snd.tone(330, 40); }
    if (s.paused) return;
    if (s.msgT) s.msgT--;
    if (s.hurt) s.hurt--;
    if (s.atkCd) s.atkCd--;

    // הלפיד דועך: לפיד שלם מחזיק בערך שלוש דקות
    const before = Math.round(light(s) * 2);
    if (s.torch > 0) s.torch = Math.max(0, s.torch - 1 / 9000);
    if (Math.round(light(s) * 2) !== before) s.dirty = true;
    if (s.torch > 0 && s.torch < 0.2 && s.t % 600 === 0) say(s, 'THE TORCH IS DYING...');

    // תנועה וקרב
    const fx = s.x + DX[s.dir], fy = s.y + DY[s.dir], front = mobAt(s, fx, fy);
    const move = (nx, ny) => {
      if (s.map[ny]?.[nx] === 'D') {
        if (s.keys) { s.keys--; s.map[ny][nx] = '.'; s.dirty = true; say(s, 'THE KEY TURNS. THE DOOR OPENS!'); snd.tone(300, 300, 600); }
        else { say(s, 'A LOCKED DOOR. FIND THE KEY!'); snd.tone(90, 80); }
        return;
      }
      if (wallAt(s, nx, ny) || mobAt(s, nx, ny)) { snd.tone(90, 40); return; }
      s.x = nx; s.y = ny; s.steps++; s.dirty = true; snd.noise(25, 0.025);
      const it = s.items.findIndex(i => i.x === nx && i.y === ny);
      if (it >= 0) {
        const k = s.items[it].k; s.items.splice(it, 1);
        if (k === 'c') { s.coins++; s.score += 50; say(s, 'A GOLD COIN!'); snd.tone(880, 60, 1320); }
        if (k === 't') { s.torch = 1; s.dirty = true; say(s, 'A NEW TORCH!'); snd.tone(440, 120, 880); }
        if (k === 'p') { s.hp = Math.min(5, s.hp + 2); say(s, 'A HEALING POTION!'); snd.tone(500, 150, 900); }
        if (k === 'k') { s.keys++; say(s, 'AN OLD IRON KEY!'); snd.tone(660, 200, 990); }
      }
      if (nx === s.sx && ny === s.sy) say(s, bossOf(s) ? KINDS[bossOf(s).k].name + ' GUARDS THE STAIRS!' : 'STAIRS DOWN. FIRE TO GO DOWN', 200);
    };
    if (api.hit('left')) { s.dir = (s.dir + 3) % 4; s.dirty = true; snd.tone(300, 20); }
    if (api.hit('right')) { s.dir = (s.dir + 1) % 4; s.dirty = true; snd.tone(300, 20); }
    if (api.hit('up')) move(fx, fy);
    if (api.hit('down')) move(s.x - DX[s.dir], s.y - DY[s.dir]);
    if (api.hit('fire') && !s.atkCd) {
      s.atkCd = 18;
      if (front) {
        front.hp--; front.flash = 8; snd.noise(60, 0.07); snd.tone(260, 60, 120);
        if (front.hp <= 0) {
          front.dust = 45; front.wind = 0; s.score += KINDS[front.k].pts; snd.tone(600, 200, 100);
          say(s, KINDS[front.k].boss ? KINDS[front.k].name + ' IS DEFEATED!' : KINDS[front.k].name.replace(/^AN? /, 'THE ') + ' IS GONE!');
        }
      } else if (s.x === s.sx && s.y === s.sy && !bossOf(s)) {
        s.score += 500 + s.hp * 100; s.t = 0; snd.tone(440, 400, 1760);
        if (s.floor < FLOORS.length) s.mode = 'next';
        else { s.mode = 'won'; clearSave(); api.submitScore('deep', s.score); }
      } else snd.tone(200, 30, 160);
    }

    // האויבים: מתקרבים, מתכוננים למכה (מהבהבים ונוהמים), ומכים אם השחקן לא התרחק
    for (const m of s.mobs) {
      const K = KINDS[m.k];
      if (m.flash) m.flash--;
      if (m.dust) { if (--m.dust === 0) m.gone = true; continue; }
      const adj = Math.abs(m.x - s.x) + Math.abs(m.y - s.y) === 1 && !wallAt(s, m.x, m.y);
      if (m.wind) {
        if (--m.wind === 0) {
          if (adj) { s.hp -= K.dmg; s.hurt = 12; snd.noise(120, 0.09); snd.tone(300, 200, 80); say(s, K.name.replace(/^AN? /, 'THE ') + ' HITS YOU!', 60); }
          else snd.tone(120, 60, 80);   // החטיא: השחקן נסוג בזמן
          m.cd = K.speed;
        }
        continue;
      }
      if (m.cd > 0) { m.cd--; continue; }
      if (adj) { m.wind = 40; snd.tone(150, 160, 95); continue; }
      if (K.ghost) {   // רוח קטנה: מרחפת דרך קירות, ישר אל השחקן כשהוא קרוב
        const ddx = s.x - m.x, ddy = s.y - m.y, far = Math.abs(ddx) + Math.abs(ddy);
        let nx = m.x, ny = m.y;
        if (far <= 9) { if (Math.abs(ddx) >= Math.abs(ddy)) nx += Math.sign(ddx); else ny += Math.sign(ddy); }
        else { const d = (s.t + m.x * 5 + m.y * 11) % 4; nx += DX[d]; ny += DY[d]; }
        if (nx >= 1 && ny >= 1 && nx <= 14 && ny <= 14 && !(nx === s.x && ny === s.y) && !mobAt(s, nx, ny)) { m.x = nx; m.y = ny; s.dirty = true; }
        if (far <= 4 && s.t % 4 === 0) snd.tone(700, 60, 500, 0.02);   // צחקוק דק
        m.cd = K.speed; continue;
      }
      // רודפים מ-12 צעדים; רחוק יותר מסיירים במסדרונות, כדי שהקומה לא תהיה ריקה
      const path = stepToward(s, m, K.boss ? 3 : 12);
      if (!path && !K.boss) {
        const opts = [0, 1, 2, 3].filter(d => !wallAt(s, m.x + DX[d], m.y + DY[d]) && !mobAt(s, m.x + DX[d], m.y + DY[d]) && !(m.x + DX[d] === s.x && m.y + DY[d] === s.y));
        const fwd = opts.filter(d => d !== ((m.face ?? 0) + 2) % 4);
        const pick = (fwd.length ? fwd : opts)[(s.t + m.x * 7 + m.y * 13) % (fwd.length || opts.length || 1)];
        if (pick !== undefined) { m.face = pick; m.x += DX[pick]; m.y += DY[pick]; s.dirty = true; }
        m.cd = K.speed * 2;
        continue;
      }
      if (path && path.d > 1) {
        const away = Math.abs(path.nx - m.hx) + Math.abs(path.ny - m.hy);
        if ((!K.boss || away <= 2) && !mobAt(s, path.nx, path.ny)) { m.x = path.nx; m.y = path.ny; s.dirty = true; }
        if (path.d <= 4 && s.t % 3 === 0) snd.tone(m.k === 'r' ? 900 : 110, 40, m.k === 'r' ? 1200 : 90, 0.03);   // שומעים אותו מתקרב
      }
      m.cd = K.speed;
    }
    s.mobs = s.mobs.filter(m => !m.gone);
    if (s.hp <= 0) { s.mode = 'over'; s.t = 0; snd.tone(300, 600, 60); api.submitScore('deep', s.score); }
    if (s.dirty) render(s);
  },

  draw(api) {
    const g = api.gfx, s = api.state;
    if (s.mode === 'title') return drawTitle(g, s);
    if (s.mode === 'over' || s.mode === 'won' || s.mode === 'next') return drawEnd(g, s);
    if (s.dirty || !s.view) render(s);
    g.ctx.putImageData(img, 0, 0);
    // חפצים ואויבים לאורך המסדרון, מהרחוק לקרוב
    const lt = light(s);
    for (let i = s.view.length - 1; i >= 1; i--) {
      const c = s.view[i];
      if (i > lt) continue;
      const it = s.items.find(o => o.x === c.x && o.y === c.y);
      if (it) stand(g, it.k === 'c' ? COIN : it.k === 't' ? TORCH : it.k === 'k' ? KEY : POTION, i + 0.4, { 1: C1, 2: C3, 3: it.k === 't' ? C2 : C3 }, it.k === 'k' ? 0.06 : 0.12);
      const m = mobAt(s, c.x, c.y) || s.mobs.find(o => o.dust && o.x === c.x && o.y === c.y);
      if (!m) continue;
      const K = KINDS[m.k], z = i + 0.15;
      if (m.dust) { const p = P(z); for (let n = 0; n < 60; n++) { const a = n * 2.4 + m.dust * 0.3, r = (45 - m.dust) * 0.9 * ((n % 7) / 7 + 0.3); g.rect(VX + Math.cos(a) * r, p[3] - (p[3] - p[1]) * K.h * 0.5 + Math.sin(a) * r * 0.7, 1, 1, n % 3 ? C1 : C0); } continue; }
      const base = K.col(), cols = m.flash ? Object.fromEntries(Object.keys(base).map(k => [k, C1])) : m.wind && (m.wind >> 2) % 2 ? Object.fromEntries(Object.keys(base).map(k => [k, k === '2' ? BLACK : C3])) : base;
      stand(g, K.rows, z - (m.wind ? 0.05 : 0), cols, K.h, (Math.sin(s.t / 9 + m.x) * 1.2) | 0);
    }
    if (s.hurt) for (let y = 0; y < VIEW; y += 2) for (let x = (y >> 1) % 2; x < W; x += 6) g.rect(x, y, 1, 1, C3);
    // אויב שעומד לידנו אבל לא מלפנים: חץ שמראה מאיפה הוא מגיע
    for (const m of s.mobs) {
      if (m.dust || Math.abs(m.x - s.x) + Math.abs(m.y - s.y) !== 1) continue;
      const rel = ([0, 1, 2, 3].find(d => s.x + DX[d] === m.x && s.y + DY[d] === m.y) - s.dir + 4) % 4;
      if (rel === 1) g.text('>>', 250, 70, C3, 'right'); else if (rel === 3) g.text('<<', 6, 70, C3); else if (rel === 2) g.text('BEHIND YOU!', 128, 134, C3, 'center');
    }
    // הבוס: פס חיים למעלה כשהוא בטווח הראייה
    const boss = s.mobs.find(m => KINDS[m.k].boss && !m.dust && s.view.some((c, i) => i && c.x === m.x && c.y === m.y));
    if (boss) { const K = KINDS[boss.k]; g.rect(0, 0, W, 20, BLACK); g.text(K.name, 128, 3, C3, 'center'); g.rect(64, 12, 128, 5, C2); g.rect(64, 12, 128 * boss.hp / K.hp, 5, C3); }
    drawHud(g, s);
    if (s.paused) drawMap(g, s);
  }
};

function stand(g, rows, z, colors, realH, bob = 0) {
  const p = P(z), scale = Math.max(1, Math.round((p[3] - p[1]) * realH / rows.length));
  const w = rows[0].length * scale, h = rows.length * scale;
  g.sprite(rows, VX - w / 2, p[3] - h + bob, colors, false, scale);
}
function drawHud(g, s) {
  g.rect(0, VIEW, W, H - VIEW, BLACK);
  g.rect(0, VIEW + 1, W, 1, C2);
  for (let i = 0; i < 5; i++) g.sprite(HEART, 6 + i * 9, 157, { 3: i < s.hp ? C3 : C2 }, false);
  g.sprite(TORCH, 52, 155, { 1: C1, 2: C3, 3: C2 }, false);
  g.rect(58, 159, 50, 5, C2); g.rect(58, 159, 50 * s.torch, 5, C1);
  g.text('SWORD', 116, 158, C0);
  if (s.keys) g.sprite(KEY, 146, 168, { 1: C1 }, false);
  g.sprite(COIN, 156, 157, { 1: C1, 2: C3 }, false);
  g.text(String(s.coins), 164, 158, C1);
  g.text(DIRS[s.dir][0] + ' LEVEL ' + s.floor, 250, 158, C0, 'right');
  const text = s.msgT ? s.msg : 'FIRE STRIKES  DOWN STEPS BACK';
  g.text(text, 128, 176, s.msgT ? C1 : C2, 'center');
}
function drawMap(g, s) {
  g.rect(40, 8, 176, 140, BLACK);
  g.rect(40, 8, 176, 1, C2); g.rect(40, 147, 176, 1, C2); g.rect(40, 8, 1, 140, C2); g.rect(215, 8, 1, 140, C2);
  g.rect(0, 0, W, 8, BLACK);
  g.text('FLOOR ' + s.floor + ' - MAP', 128, 12, C1, 'center');
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (!s.seen.has(x + ',' + y)) continue;
    const X = 64 + x * 8, Y = 22 + y * 7.5;
    if (s.map[y][x] === '#') g.rect(X, Y, 8, 7, C2); else if (s.map[y][x] === 'D') g.rect(X + 1, Y + 1, 6, 5, C1); else g.rect(X + 3, Y + 3, 2, 2, C0);
    if (x === s.sx && y === s.sy) g.rect(X + 1, Y + 1, 6, 5, C3);
  }
  g.rect(64 + s.x * 8 + 2, 22 + s.y * 7.5 + 2, 4, 4, C1);
  g.rect(0, 168, W, 24, BLACK);
  g.text('P TO PLAY ON', 128, 176, C1, 'center');
}
function drawTitle(g, s) {
  g.clear(BLACK);
  for (let i = 0; i < 60; i++) g.rect((i * 97) % W, (i * 53) % 70, 1, 1, i % 3 ? C2 : C1);
  g.text('DRAGON', 128, 28, C3, 'center', 4);
  g.text('DEEP', 128, 62, C0, 'center', 4);
  g.text('THE DRAGON HAS TAKEN THE GOLDEN TAPE', 128, 104, C1, 'center');
  g.text('DOWN INTO THE DEEP. GO AND FIND IT.', 128, 116, C1, 'center');
  if ((s.t >> 4) % 2) g.text('PRESS FIRE', 128, 140, C3, 'center', 2);
  g.text('HIGH ' + s.high, 128, 156, C2, 'center');
  if (s.save) g.text('UP: GO ON FROM FLOOR ' + s.save.floor, 128, 168, C0, 'center');
  g.text('(C) 2026 GONEN YAROM', 128, 182, C2, 'center');
}
function drawEnd(g, s) {
  g.clear(BLACK);
  if (s.mode === 'next') {
    g.text('FLOOR ' + s.floor + ' CLEARED!', 128, 40, C1, 'center', 2);
    g.text('THE STAIRS LEAD DEEPER...', 128, 74, C0, 'center');
    g.text('SCORE ' + s.score, 128, 110, C1, 'center', 2);
    if (s.t > 40 && (s.t >> 4) % 2) g.text('FIRE: DOWN TO FLOOR ' + (s.floor + 1), 128, 150, C2, 'center');
    return;
  }
  if (s.mode === 'won') {
    g.text('FLOOR ' + s.floor + ' CLEARED!', 128, 40, C1, 'center', 2);
    g.text('THE STAIRS LEAD DEEPER...', 128, 74, C0, 'center');
    g.text('MORE FLOORS ARE COMING SOON', 128, 88, C0, 'center');
  } else {
    g.text('THE DEEP', 128, 40, C3, 'center', 3);
    g.text('HAS WON', 128, 70, C3, 'center', 3);
  }
  g.text('SCORE ' + s.score, 128, 118, C1, 'center', 2);
  if (s.t > 40 && (s.t >> 4) % 2) g.text('PRESS FIRE', 128, 160, C2, 'center');
}
