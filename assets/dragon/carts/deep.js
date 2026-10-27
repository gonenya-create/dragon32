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
// r עכברוש  g גובלין  m איש פטרייה  h רוח קטנה  T טרול  B מלך האוגרים  G גולם האבן  M מלך החפרפרות  W ספר הקסמים  X הדרקון
// סבב 2: % קיר סדוק (FIRE פותח מעבר סודי)  $ אוצר נסתר  b קשת  a חצים  H סורג נעול (נפתח במפתח)  O כורה זקן  J אסיר (ידידים)
// סבב 3: ^ מלכודת ברצפה (קוצים, ובספרייה רונה בוערת)  * תקרה שמתמוטטת  V סוחר (ידיד עם חנות)  N פתק על הקיר (FIRE קורא)
const MAP1 = [
  '################',
  '#@..cN....g....#',
  '#.##.#.####.##.#',
  '#.#..t.%..#..#.#',
  '#g#.####.c#.##.#',
  '#...#r...##....#',
  '###.#.####..#m.#',
  '#c..#....p#.####',
  '#.###.##.##....#',
  '#...#..#..#.##.#',
  '#.#.##.#g.#..#c#',
  '#.#....##.##.#.#',
  '#.####.#....r#.#',
  '#...m#.#.##.#N.#',
  '#.c#...t..#..BS#',
  '################'
];
// קומה 2: המפתח בצפון, הדלת בדרום-מזרח, ומאחוריה הגולם והמדרגות
const MAP2 = [
  '################',
  '#@...#...h..^..#',
  '#.##.#.###.###.#',
  '#.#k.#...#...#.#',
  '#.#.####.###.#.#',
  '#..b#..m...#t..#',
  '#.###.####.###.#',
  '#.....Nc.....#.#',
  '#%###.#.####.#.#',
  '#t^.#...#..p.#.#',
  '#.#.#####.##.#.#',
  '#.#...h......#%#',
  '#.####.#####.#$#',
  '#.c.a#.#.^.#.###',
  '#V##...#.r..DGS#',
  '################'
];
// לכל קומה עולם משלו (גונן: "כל הקומות נראות אותו דבר רק בצבע שונה?"): 1 מרתף לבנים עם לפידים, 2 מערה
// קומה 3: המכרה הישן. טרולים שחוסמים מסדרונות, ובסוף מלך החפרפרות
const MAP3 = [
  '################',
  '#@..T.....#...m#',
  '#.####.##.#.#..#',
  '#.#.V#..N.*.#*##',
  '#.#.c##.####.r.#',
  '#...#...#t...#.#',
  '###.#.#.#.####.#',
  '#p..#.#...#..g.#',
  '#.###.#####.##.#',
  '#.t.#...c...#..#',
  '#.#.###.###.#.##',
  '#.#...#.*.#.T..#',
  '#.###.###.#.##.#',
  '#.c...#%..#.O#.#',
  '#a#####$#...#MS#',
  '################'
];
// קומה 4: ספריית הקוסם. מדפי ספרים ונרות, מפתח ודלת, ובסוף ספר הקסמים המעופף שיורה אותיות
const MAP4 = [
  '################',
  '#@..#....h.....#',
  '#.#.#.##.####..#',
  '#.#...#..#^.#.V#',
  '#.#####.##.g#.##',
  '#...m...#..##..#',
  '###.###.#.###k.#',
  '#t..#c.......#.#',
  '#.###.######.#.#',
  '#..g#.^..h...#.#',
  '##.##.##.##N.#.#',
  '#p.#.t.#...#.#H#',
  '#.##.#.###.#.#J#',
  '#.c^.#...T.#.###',
  '#a####k#####DWS#',
  '################'
];
// קומה 5: מאורת הדרקון. קירות חרוכים, גחלים, עצמות וזהב. המפתח במערב, המאורה מאחורי הדלת, ושם הדרקון וקלטת הזהב
const MAP5 = [
  '################',
  '#@...#..T..^.h.#',
  '#.##.#.####.##.#',
  '#.#..c.%..#..#.#',
  '#.#.####.##.##.#',
  '#.g...#...m....#',
  '####.##.#####.##',
  '#p...#.^..g.#..#',
  '#.####.##.#.#.##',
  '#...h..#a.#.^.t#',
  '#.###.####.###.#',
  '#.t.#....c.#$%.#',
  '###.#.####.#####',
  '#k..N.#....#...#',
  '#.T.....#.D..XS#',
  '################'
];
const FLOORS = [{ map: MAP1, pal: 1, style: 'brick' }, { map: MAP2, pal: 0, style: 'cave' }, { map: MAP3, pal: 1, style: 'mine' }, { map: MAP4, pal: 0, style: 'library' }, { map: MAP5, pal: 0, style: 'lair' }];
const LAST = FLOORS.length;
const PAR = [300, 420, 480, 540, 600];        // שניות יעד לכל קומה: מתחת לזה בונוס מהירות
const TORCH_FRAMES = 12000;                   // לפיד שלם: 4 דקות
// רמה וניסיון (סבב 2): נקודות הניסיון הן הנקודות של כל אויב שמנצחים. כל רמה מוסיפה לב (עד 8), וכל שתי רמות מכה חזקה יותר
const XPL = [0, 60, 160, 320, 560, 900, 1400, 2000];
const levelOf = xp => XPL.filter(v => xp >= v).length;
// רמות קושי (סבב 3): בוחרים במסך הפתיחה. torch = כמה זמן הלפיד מחזיק, wind = כמה זמן אויב מהבהב לפני מכה,
// speed = קצב האויבים (קטן = מהיר), boss = כוח המכה של בוס, mult = מכפיל הניקוד בסוף, retry = לבבות אחרי מוות
const DIFF = [
  { name: 'EASY', torch: 1.4, wind: 56, speed: 1.15, boss: 1, heart: 1, mult: 0.5, retry: 3 },
  { name: 'NORMAL', torch: 1, wind: 40, speed: 1, boss: 2, heart: 0, mult: 1, retry: 3 },
  { name: 'HARD', torch: 0.75, wind: 30, speed: 0.85, boss: 2, heart: 0, mult: 1.5, retry: 2 }
];
const okDiff = d => [0, 1, 2].includes(d) ? d : 1;   // קושי שמור לא תקין (או שמירה מסבב 2) = NORMAL
const D = s => DIFF[okDiff(s.diff)];
const maxHp = s => Math.min(8, 4 + s.lv + D(s).heart);
const spd = (s, K) => Math.round(K.speed * D(s).speed);
const finalScore = s => Math.round(s.score * D(s).mult);
// פתקים על הקירות: חוקר שירד לפניך משאיר סיפור ורמזים. המפתח: קומה,x,y של משבצת N
const NOTES = {
  '1,5,1': ['TO WHOEVER COMES NEXT:', 'THE TORCH WILL NOT LAST.', 'PICK UP EVERY ONE YOU SEE.', '- A LOST KNIGHT'],
  '1,13,13': ['THE OGRE KING IS SLOW,', 'BUT HE HITS HARD.', 'WHEN HE FLASHES, STEP BACK!'],
  '2,6,7': ['THE STONE GOLEM WAITS', 'BEHIND THE LOCKED DOOR.', 'THE KEY IS IN THE NORTH.'],
  '3,8,3': ['THE CEILING HERE IS OLD.', 'IF IT SHAKES, MOVE!', 'THE OLD MINER KNOWS MORE.'],
  '4,11,10': ['TWO KEYS IN THIS LIBRARY:', 'ONE FOR THE DOOR,', 'ONE FOR THE PRISONER.'],
  '5,4,13': ['THE DRAGON BREATHES FIRE.', 'WHEN IT GLOWS, STEP BACK.', 'THE TAPE IS BEHIND IT.', '- THE LOST KNIGHT']
};
// מוזיקה (סבב 3): מנגינה מקורית קצרה לכל קומה, בצליל המרובע של ה-Dragon. n = חצאי טונים מעל base, null = שקט
const TUNES = [
  { step: 16, base: 220, n: [0, null, 3, null, 7, 5, 3, null, 2, null, -2, null, 0, null, null, null] },   // המרתף: איטי ומסתורי
  { step: 14, base: 196, n: [0, 7, null, 5, 3, null, 5, null, 0, null, 10, 8, 7, null, null, null] },      // המערות: טיפות
  { step: 12, base: 165, n: [0, 0, 3, 0, 5, 3, 0, null, 0, 0, 3, 7, 5, 3, 0, null] },                       // המכרה: קצב של עבודה
  { step: 15, base: 247, n: [0, 4, 7, 11, 12, null, 11, 7, 9, null, 5, null, 4, null, null, null] },       // הספרייה: קסם
  { step: 9, base: 110, n: [0, null, 0, 1, 0, null, 0, 3, 0, null, 0, 1, 7, 6, 5, null] }                  // המאורה: מהיר ומאיים
];
const BOSS_TUNE = { step: 8, base: 110, n: [0, 6, 0, 6, 1, 7, 1, 7] };
const MUSIC = 'd32-deep-music', DIFF_KEY = 'd32-deep-diff';
// מלכודות: מחזור של 3 שניות. עד 100 בטוח, 100-129 אזהרה (רואים ושומעים), 130-149 פוגע במי שעומד שם
const TRAP_CYCLE = 150, TRAP_WARN = 100, TRAP_HIT = 130;
const trapPhase = (s, t) => (s.floorT + t.x * 37 + t.y * 11) % TRAP_CYCLE;
const swordDmg = s => 1 + ((s.lv - 1) >> 1);
export const _test = { FLOORS, TORCH_FRAMES, PAR, messages: () => [
  ...[1, 2, 3, 4, 5].map(f => floorMsg(f)), ...Object.keys(KINDS).flatMap(k => [KINDS[k].name + '!', KINDS[k].name.replace(/^AN? /, 'THE ') + ' HITS YOU!', KINDS[k].name.replace(/^AN? /, 'THE ') + ' IS GONE!', KINDS[k].name + ' IS DEFEATED!', guardMsg(k, false), guardMsg(k, true)]),
  'GOLDEN TAPE! FIRE TO TAKE IT', 'STAIRS DOWN. FIRE TO GO DOWN', 'A POTION! P - BAG TO DRINK IT', 'THE KEY TURNS. THE DOOR OPENS!', 'A LOCKED DOOR. FIND THE KEY!', 'YOUR HEARTS ARE FULL', 'AN OLD IRON KEY!', 'A BOW! P - BAG TO TAKE IT', 'FIVE ARROWS!', 'HIDDEN TREASURE! +200', 'THE BARS SWING OPEN!', 'LOCKED BARS. FIND A KEY!', 'A SECRET PASSAGE! +100', 'NO ARROWS LEFT. SWORD!', 'THE GOBLIN STEALS A COIN!', 'SPORES! YOU FEEL SLOW...', 'A GHOST BEHIND YOU!', 'LEVEL UP! NOW LEVEL 8', 'A FRIEND? WALK UP TO TALK', 'MINER: CRACKED WALLS HIDE GOLD', 'FREE AT LAST! TAKE THESE', 'THE MINER WAVES. GOOD LUCK!', 'BOW IN HAND', 'A NEW TORCH!', 'A GOLD COIN!', 'THE TORCH IS DYING...', ...TRAP_MSGS, 'A NOTE! FIRE TO READ IT', 'THANK YOU! COME AGAIN.', 'NOT ENOUGH COINS', 'YOU HAVE NO BOW YET', 'YOUR TORCH IS STILL BRIGHT', 'MUSIC ON', 'MUSIC OFF', ...Object.values(NOTES).flat()], NOTES, DIFF, TUNES, TRAP_CYCLE };   // לבדיקות האוטומטיות
let STYLE = 'brick';
const wallC = () => STYLE === 'mine' || STYLE === 'lair' ? C3 : STYLE === 'library' ? C2 : C0, woodC = () => STYLE === 'mine' ? C0 : C3;
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
const TROLL = [
  '....11111....', '...1111111...', '...1211121...', '...1111111...', '....1...1....', '....11111....', '.11333333311.',
  '1113333333111', '11.33333333.1', '11.33333333.3', '...3333333..3', '...333.333...', '...11...11...', '..111...111..'
];
// מלך החפרפרות: חפרפרת ענקית עם קסדת כורים ופנס, וטפרים גדולים (1 פרווה, 2 עיניים ואף, 3 קסדה, 0 פנס וטפרים)
const MOLE = [
  '.......333333......', '......33300333.....', '.....3333003333....', '....33333333333....', '....11111111111....', '...1112111112111...',
  '...1111111111111...', '...1111122211111...', '....111112111111...', '..1111111111111111.', '.111111111111111111', '00.111111111111.00',
  '000.1111111111.000', '.0..1111111111..0.', '....111111111111...', '....1111...11111...', '...00000...00000...'
];
// ספר הקסמים המעופף: ספר פתוח עם עיניים, דפים שמתנפנפים כמו כנפיים (1 דפים, 3 כריכה, 2 עיניים, 0 אותיות)
const BOOK = [
  '..111111...111111..', '.11111111.11111111.', '1100110011100110011', '1111111111111111111', '1122211111111122211', '1122211111111122211',
  '1111111111111111111', '1100110011100110011', '1111111110111111111', '1100110011100110011', '3333333333333333333', '.33333333.33333333.',
  '...3333.....3333...'
];
// הדרקון: ראש עם קרניים ועיניים זוהרות, פה עם להבה, כנפיים פרושות וטפרים (3 קשקשים, 1 בטן ולהבה, 2 עיניים, 0 קרניים ושיניים)
const DRAGON = [
  '..33...................33..', '.3333.................3333.', '333333......0..0......333333', '3333333....0300030...3333333',
  '33333333..333333333.33333333', '.3333333.33323332333.3333333.', '..3333333333333333333333333..', '...33333333111111113333333...',
  '....333333311111111333333....', '.....33333111010101133333.....', '......333331111111113333......', '...........33111113333........',
  '..........3331111113333.......', '.........33331111111333......', '.........3333111111133333....', '........33333111111133..333...',
  '........3333311111113.....33..', '.........333.....333......3..', '........000.......000.........'
];
const TAPE = ['111111111', '133333331', '131.1.131', '133333331', '111111111'];
const BOW = ['.11..', '1..1.', '1...1', '1...1', '1...1', '1..1.', '.11..'];
const QUIVER = ['1.1.1', '1.1.1', '33333', '33333', '33333'];
const GOLD = ['...1...', '..121..', '.11211.', '1112111'];
// כורה זקן: קסדה עם פנס וזקן לבן (1 עור, 2 עיניים, 3 בגד, 0 פנס וזקן)
const MINER = ['....333....', '...33033...', '...11111...', '...12121...', '...10001...', '....000....', '..3333333..', '.1.33333.1.', '1..33333..1', '...33.33...', '...3...3...', '..11...11..'];
// אסיר: בגד מפוספס (1 עור, 2 עיניים, 3 פסים)
const PRISONER = ['...1111...', '..111111..', '..121121..', '..111111..', '...1111...', '..333333..', '.10000001.', '1.333333.1', '..000000..', '..333333..', '..33..33..', '..11..11..'];
// סוחר (סבב 3): כובע רחב ותרמיל גדול על הגב (1 עור, 2 עיניים, 3 כובע, 0 מעיל)
const MERCHANT = ['...3333...', '.33333333.', '...1111...', '...1212...', '...1111...', '..000000..', '.10000003.', '1.000000.3', '..000000.3', '..000000..', '..00..00..', '..11..11..'];
// הצבעים של כל דמות הם פונקציה, כי בכל קומה ערכת הצבעים אחרת
const KINDS = {
  r: { name: 'A RAT', rows: RAT, h: 0.16, hp: 1, dmg: 1, speed: 40, pts: 10, col: () => ({ 3: C3, 1: C1, 2: C2 }) , blurb: 'QUICK. BITES.' },
  g: { name: 'A GOBLIN', rows: GOBLIN, h: 0.5, hp: 2, dmg: 1, speed: 75, pts: 25, col: () => ({ 1: C0, 2: BLACK, 0: C1, 3: C3 }) , blurb: 'SNEAKY.' },
  m: { name: 'A MUSHROOM MAN', rows: MUSH, h: 0.55, hp: 3, dmg: 1, speed: 110, pts: 40, col: () => ({ 3: C3, 1: C1, 2: BLACK }) , blurb: 'SLOW, TOUGH.' },
  h: { name: 'A LITTLE GHOST', rows: GHOST, h: 0.6, hp: 2, dmg: 1, speed: 70, pts: 35, col: () => ({ 1: C1, 2: C2 }), ghost: true , blurb: 'IN THE WALLS.' },
  T: { name: 'A TROLL', rows: TROLL, h: 0.78, hp: 5, dmg: 2, speed: 130, pts: 80, col: () => ({ 1: C0, 2: BLACK, 3: C3 }) , blurb: 'BLOCKS THE WAY' },
  B: { name: 'THE OGRE KING', rows: OGRE, h: 0.88, hp: 12, dmg: 2, speed: 85, pts: 300, col: () => ({ 1: C0, 2: BLACK, 3: C3, 0: C1 }), boss: true , blurb: 'FLOOR 1 BOSS', trophy: 'OGRE CROWN' },
  G: { name: 'THE STONE GOLEM', rows: GOLEM, h: 0.88, hp: 16, dmg: 2, speed: 95, pts: 450, col: () => ({ 1: C1, 2: C3, 0: BLACK }), boss: true , blurb: 'FLOOR 2 BOSS', trophy: 'GOLEM EYE' },
  W: { name: 'THE SPELL BOOK', rows: BOOK, h: 0.55, hp: 24, dmg: 2, speed: 70, pts: 800, col: () => ({ 1: C1, 3: C3, 2: BLACK, 0: C2 }), boss: true, fly: true , blurb: 'FLOOR 4 BOSS', trophy: 'MAGIC PAGE' },
  X: { name: 'THE DRAGON', rows: DRAGON, h: 0.95, hp: 30, dmg: 2, speed: 75, pts: 2000, col: () => ({ 3: C3, 1: C1, 2: C1, 0: C0 }), boss: true, fire: true , blurb: 'FLOOR 5 BOSS', trophy: 'DRAGON SCALE' },
  O: { name: 'AN OLD MINER', rows: MINER, h: 0.62, hp: 1, dmg: 0, speed: 9999, pts: 0, col: () => ({ 1: C0, 2: BLACK, 3: C2, 0: C1 }), friend: true, blurb: 'A FRIEND' },
  V: { name: 'A MERCHANT', rows: MERCHANT, h: 0.62, hp: 1, dmg: 0, speed: 9999, pts: 0, col: () => ({ 1: C0, 2: BLACK, 3: C3, 0: C1 }), friend: true, blurb: 'SELLS THINGS' },
  J: { name: 'A PRISONER', rows: PRISONER, h: 0.62, hp: 1, dmg: 0, speed: 9999, pts: 0, col: () => ({ 1: C0, 2: BLACK, 3: C2, 0: C1 }), friend: true, blurb: 'A FRIEND' },
  M: { name: 'THE MOLE KING', rows: MOLE, h: 0.85, hp: 20, dmg: 2, speed: 80, pts: 600, col: () => ({ 1: C0, 2: BLACK, 3: C2, 0: C1 }), boss: true , blurb: 'FLOOR 3 BOSS', trophy: 'MINER LAMP' }
};
const COIN = ['.11.', '1221', '1221', '.11.'];
const TORCH = ['.1.', '121', '.1.', '.3.', '.3.', '.3.'];
const POTION = ['.1.', '.1.', '333', '323', '333'];
const HEART = ['33.33', '33333', '33333', '.333.', '..3..'];
const KEY = ['.11....', '1..1111', '.11.1.1'];
const ITEM_ROWS = { c: COIN, t: TORCH, k: KEY, p: POTION, b: BOW, a: QUIVER, $: GOLD };
// מלכודות על הרצפה: קוצים (למטה חורים, באזהרה קצוות, ובמכה קוצים גבוהים), רונה, אבן שנופלת וערימת אבנים
const HOLES = ['1.1.1.1.1', '.........', '1.1.1.1.1'];
const TIPS = ['.1...1...1.', '11111111111'];
const SPIKES = ['..1...1...1..', '..1...1...1..', '.111.111.111.', '.111.111.111.', '1111111111111'];
const RUNE = ['..11111..', '.1..1..1.', '1..111..1', '.1..1..1.', '..11111..'];
const ROCK = ['..111..', '.11111.', '1111211', '1121111', '.11111.'];
const RUBBLE = ['...1..1...', '.1111.11..', '1111111111'];
const NOTE_ICON = ['.111.', '.1.1.', '.1.1.', '11.11', '11.11'];

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
  polyFill([[xa, a[1]], [xb, b[1]], [xb, b[3]], [xa, a[3]]], wallC(), k);
  const at = (t, u) => [lerp(xa, xb, t), lerp(lerp(a[1], b[1], t), lerp(a[3], b[3], t), u)];
  if (STYLE === 'cave') { caveLayers(at, cx * 2 + (side < 0 ? 0 : 1), cy); line(xa, a[1], xb, b[1], C2); line(xa, a[3], xb, b[3], C2); line(xb, b[1], xb, b[3], C2); stalactites(at, cx + side, cy); return; }
  if (STYLE === 'lair') { lairWall(at, cx * 2 + (side < 0 ? 0 : 1), cy); line(xa, a[1], xb, b[1], C1); line(xa, a[3], xb, b[3], C1); line(xb, b[1], xb, b[3], C1); return; }
  if (STYLE === 'library') { shelves(at, cx * 2 + (side < 0 ? 0 : 1), cy, 8); line(xa, a[1], xb, b[1], C1); line(xa, a[3], xb, b[3], C1); line(xb, b[1], xb, b[3], C1); return; }
  if (STYLE === 'mine') { mineWall(at, cx, cy, side); line(xa, a[1], xb, b[1], C2); line(xa, a[3], xb, b[3], C2); return; }
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
  if (k > 0) polyFill([[Math.min(xa, xb), b[1]], [Math.max(xa, xb), b[1]], [Math.max(xa, xb), b[3]], [Math.min(xa, xb), b[3]]], wallC(), k);
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
  polyFill([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], wallC(), k);
  if (STYLE === 'lair') { const at = (t, u) => [lerp(x0, x1, t), lerp(y0, y1, u)]; lairWall(at, 55, z * 3 | 0); line(x0, y0, x1, y0, C1); line(x0, y1, x1, y1, C1); line(x0, y0, x0, y1, C1); line(x1, y0, x1, y1, C1); return; }
  if (STYLE === 'library') { const at = (t, u) => [lerp(x0, x1, t), lerp(y0, y1, u)]; shelves(at, 77, z * 3 | 0, 14); line(x0, y0, x1, y0, C1); line(x0, y1, x1, y1, C1); line(x0, y0, x0, y1, C1); line(x1, y0, x1, y1, C1); if ((z | 0) % 2 === 0) candle(at(0.5, 0.86)[0], at(0.5, 0.86)[1], (y1 - y0) / 14); return; }
  if (STYLE === 'mine') { const at = (t, u) => [lerp(x0, x1, t), lerp(y0, y1, u)]; for (let n = 0; n < 40; n++) { const [x, y] = at(hash(n, z * 9 | 0, 1), hash(n, z * 9 | 0, 2)); px(x, y, C2); } for (const t of [0.04, 0.96]) { const [x] = at(t, 0); beam(x, y0, x, y1, (x1 - x0) / 40); } beam(x0, y0 + 1, x1, y0 + 1, (x1 - x0) / 40); line(x0, y1, x1, y1, C2); return; }
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
// קיר מאורה: סלע אדום עם סימני חריכה שחורים וגחלים צהובות שזוהרות בתוכו
function lairWall(at, cx, cy) {
  for (let n = 0; n < 3; n++) {   // סדק שמתחיל למעלה ומתפצל כלפי מטה
    let t = 0.15 + hash(cx, cy, n) * 0.7, u = 0.05 + hash(cx, cy, n + 9) * 0.25, prev = at(t, u);
    for (let i = 0; i < 6; i++) {
      t += (hash(cx, cy, n * 10 + i + 20) - 0.5) * 0.1; u += 0.1;
      const pt = at(Math.min(1, Math.max(0, t)), Math.min(1, u)); line(prev[0], prev[1], pt[0], pt[1], BLACK);
      if (i === 2) { const br = at(Math.min(1, Math.max(0, t + 0.08)), Math.min(1, u + 0.12)); line(pt[0], pt[1], br[0], br[1], BLACK); }
      prev = pt;
    }
  }
  for (let n = 0; n < 18; n++) { const [x, y] = at(hash(cx, cy, n + 40), hash(cx, cy, n + 60)); px(x, y, C1); px(x + 1, y, C1); }
}
// על רצפת המאורה: עצמות או ערימת זהב
function lairFloor(z, cx, cy) {
  const a = P(z), w = (a[2] - a[0]) / 256, y = a[3] - 2, off = (hash(cx, cy, 5) - 0.5) * 120 * w;
  if (hash(cx, cy, 3) < 0.5) { line(VX + off - 14 * w, y, VX + off + 14 * w, y - 3 * w, C1); for (const e of [-14, 14]) { px(VX + off + e * w, y - 1, C1); px(VX + off + e * w, y + 1, C1); } }
  else for (let i = 0; i < 10 * w + 3; i++) { const ww = (10 * w + 3 - i) * 1.6; line(VX + off - ww, y - i, VX + off + ww, y - i, i % 2 ? C1 : C3); }
}
// מדפי ספרים: ארבעה מדפים, ועליהם גבי ספרים צבעוניים בגבהים שונים. n = כמה ספרים בשורה
function shelves(at, cx, cy, n) {
  const rows = [0.08, 0.31, 0.54, 0.77, 1];
  for (let r = 0; r < 4; r++) {
    for (let i = 0; i < n; i++) {
      const t0 = (i + 0.1) / n, t1 = (i + 0.8) / n, top = rows[r] + 0.04 + hash(cx, cy, r * 20 + i) * 0.08, c = [C0, C1, C3][(hash(cx, cy, r * 31 + i) * 3) | 0];
      for (let k = 0; k <= 2; k++) { const t = lerp(t0, t1, k / 2), [x, y0] = at(t, top), [, y1] = at(t, rows[r + 1] - 0.01); line(x, y0, x, y1, c); }
    }
    const [xa, ya] = at(0, rows[r + 1]), [xb, yb] = at(1, rows[r + 1]);
    line(xa, ya, xb, yb, C1);
  }
}
// נר עם להבה קטנה
function candle(x, y, h) {
  line(x, y, x, y - h * 2, C1); line(x + 1, y, x + 1, y - h * 2, C1);
  for (let i = 0; i < h * 1.4; i++) { const w = Math.max(0.5, (h * 1.4 - i) * 0.3); line(x - w + 0.5, y - h * 2 - i, x + w + 0.5, y - h * 2 - i, i % 2 ? C3 : C1); }
}
// קורת עץ עבה (בצבע עץ, עם קו צל)
function beam(x0, y0, x1, y1, w) {
  const n = Math.max(1, Math.round(w));
  const vert = Math.abs(x1 - x0) < Math.abs(y1 - y0);
  for (let i = 0; i < n; i++) vert ? line(x0 + i, y0, x1 + i, y1, woodC()) : line(x0, y0 + i, x1, y1 + i, woodC());
  vert ? line(x0 + n, y0, x1 + n, y1, C2) : line(x0, y0 + n, x1, y1 + n, C2);
}
// קיר מכרה בצד: אדמה מנוקדת, וקורה שתומכת בתחילת כל קטע
function mineWall(at, cx, cy, side) {
  for (let n = 0; n < 24; n++) { const [x, y] = at(hash(cx, cy, n + side * 50), hash(cx, cy, n + 100 + side * 50)); px(x, y, C2); }
  const [xa, ya] = at(0.02, 0), [, yb] = at(0.02, 1), [xb] = at(0.12, 0);
  beam(xa, ya, xa, yb, Math.abs(xb - xa));
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
// קיר סדוק (סבב 2): סדק שחור מזוגזג באמצע הקיר, רמז שאפשר לפתוח אותו ב-FIRE
function crackFront(z, light) {
  if (shade(z, light) < 1) return;
  const [x0, y0, x1, y1] = P(z), w = x1 - x0, h = y1 - y0;
  let px0 = x0 + w * 0.5, py0 = y0 + h * 0.08;
  for (let i = 1; i <= 7; i++) { const nx = x0 + w * (0.5 + (i % 2 ? 0.08 : -0.06) * (1 + i * 0.15)), ny = y0 + h * (0.08 + i * 0.12); line(px0, py0, nx, ny, BLACK); line(px0 + 1, py0, nx + 1, ny, BLACK); px0 = nx; py0 = ny; }
  line(x0 + w * 0.5, y0 + h * 0.45, x0 + w * 0.68, y0 + h * 0.55, BLACK);
}
function crackSide(z0, z1, side, light) {
  if (shade((z0 + z1) / 2, light) < 1) return;
  const a = P(z0), b = P(z1), xa = side < 0 ? a[0] : a[2], xb = side < 0 ? b[0] : b[2];
  const at = (t, u) => [lerp(xa, xb, t), lerp(lerp(a[1], b[1], t), lerp(a[3], b[3], t), u)];
  let prev = at(0.5, 0.1);
  for (let i = 1; i <= 6; i++) { const pt = at(0.5 + (i % 2 ? 0.12 : -0.1), 0.1 + i * 0.13); line(prev[0], prev[1], pt[0], pt[1], BLACK); prev = pt; }
}
// פתק על הקיר (סבב 3): דף בהיר מוצמד באמצע הקיר, עם שורות כתב
function noteFront(z, light) {
  const k = shade(z, light); if (k < 1) return;
  const [x0, y0, x1, y1] = P(z), w = x1 - x0, h = y1 - y0, a = x0 + w * 0.38, b = x0 + w * 0.62, t = y0 + h * 0.3, u = y0 + h * 0.62;
  polyFill([[a, t], [b, t], [b, u], [a, u]], C0, Math.max(2, k));
  for (let i = 1; i < 5; i++) { const y = t + (u - t) * i / 5; line(a + 2, y, b - 2 - (i === 4 ? (b - a) * 0.3 : 0), y, C2); }
  px((a + b) / 2, t + 1, C3); px((a + b) / 2 + 1, t + 1, C3);   // נעץ
}
function noteSide(z0, z1, side, light) {
  if (shade((z0 + z1) / 2, light) < 1) return;
  const a = P(z0), b = P(z1), xa = side < 0 ? a[0] : a[2], xb = side < 0 ? b[0] : b[2];
  const at = (t, u) => [lerp(xa, xb, t), lerp(lerp(a[1], b[1], t), lerp(a[3], b[3], t), u)];
  const q = [at(0.35, 0.3), at(0.65, 0.3), at(0.65, 0.62), at(0.35, 0.62)];
  polyFill(q, C0, 3);
}
// סורג: מסגרת ומוטות, ומאחוריהם חושך
function barsFront(z, light) {
  if (shade(z, light) < 1) return;
  const [x0, y0, x1, y1] = P(z), w = x1 - x0;
  polyFill([[x0 + 2, y0 + 2], [x1 - 2, y0 + 2], [x1 - 2, y1 - 1], [x0 + 2, y1 - 1]], BLACK, 4);
  for (let i = 1; i < 7; i++) { const x = x0 + w * i / 7; line(x, y0, x, y1, C1); line(x + 1, y0, x + 1, y1, C2); }
  line(x0, y0 + 2, x1, y0 + 2, C1); line(x0, y1 - 2, x1, y1 - 2, C1);
}
function floorCeil(zmax, light) {
  const far = P(zmax);
  if (STYLE === 'mine') {   // מסילה של עגלות מכרה, וקורות תקרה בכל עומק
    for (const off of [-30, 30]) line(VX + off * 2.2, VIEW - 1, VX + off * (far[2] - far[0]) / 256 * 2.2, far[3], C1);
    for (let z = 0.25; z <= zmax; z += 0.5) { if (shade(z, light) <= 0) continue; const p = P(z), w = (p[2] - p[0]) / 256 * 80; line(VX - w, p[3], VX + w, p[3], woodC()); }
    for (let z = 0; z <= zmax; z += 1) { if (shade(z, light) <= 0) continue; const p = P(z); beam(p[0], p[1], p[2], p[1], (p[2] - p[0]) / 50); }
  }
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
const wallAt = (s, x, y) => x < 0 || y < 0 || x > 15 || y > 15 || '#D%HN'.includes(s.map[y][x]);
function newFloor(s) {
  const F = FLOORS[s.floor - 1];
  setPalette(F.pal); STYLE = F.style;
  s.map = F.map.map(r => r.split(''));
  s.keys = 0;
  s.mobs = []; s.items = []; s.seen = new Set(); s.traps = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const ch = s.map[y][x];
    if (ch === '@') { s.x = x; s.y = y; s.map[y][x] = '.'; }
    else if (KINDS[ch]) { s.mobs.push({ k: ch, x, y, hx: x, hy: y, hp: KINDS[ch].hp, cd: 30 + (x * 7 + y * 3) % 40, wind: 0, flash: 0, dust: 0 }); s.map[y][x] = '.'; }
    else if ('ctpkab$'.includes(ch)) { s.items.push({ k: ch, x, y }); s.map[y][x] = '.'; }
    else if (ch === 'S') { s.sx = x; s.sy = y; s.map[y][x] = '.'; }
    else if (ch === '^' || ch === '*') { s.traps.push({ k: ch, x, y, fall: 0, done: false, hitAt: -1 }); s.map[y][x] = '.'; }
  }
  s.dir = 1; s.dirty = true;
  s.secrets = 0; s.secretsTotal = s.map.flat().filter(c => c === '%').length; s.slow = 0; s.moveCd = 0; s.shot = null; s.shop = null; s.note = null; s.mt = 0;
}
function reset(s) {
  s.hp = 5; s.torch = 1; s.coins = 0; s.score = 0; s.floor = 1; s.keys = 0; s.atkCd = 0; s.hurt = 0; s.msg = ''; s.msgT = 0; s.paused = false; s.steps = 0;
  s.potions = 0; s.trophies = []; s.met = new Set(); s.page = 0; s.bagSel = 0; s.floorT = 0; s.times = [];
  s.xp = 0; s.lv = 1; s.hasBow = false; s.arrows = 0; s.weapon = 'sword';
  s.hp = maxHp(s);
  newFloor(s);
}
const say = (s, text, t = 120) => { s.msg = text; s.msgT = t; };
const TRAP_MSGS = ['SPIKES UNDER YOU! MOVE!', 'OUCH! SPIKES!', 'THE RUNE GLOWS! MOVE!', 'THE RUNE BURNS YOU!', 'THE CEILING SHAKES! MOVE!', 'A ROCK HITS YOU!'];
// כל ההודעות קצרות מ-31 תווים, כדי שייכנסו בשורה אחת ולא יגיעו למספר הקומה (tools/dragon-test.mjs בודק)
const floorMsg = f => 'FLOOR ' + f + ' - ' + ['THE CASTLE CELLAR', 'THE CAVES', 'THE OLD MINE', 'THE WIZARD LIBRARY', 'THE DRAGON LAIR'][f - 1];
const guardMsg = (k, last) => SHORT[k] + (last ? ' GUARDS THE TAPE!' : ' GUARDS THE STAIRS');
// ההתקדמות נשמרת בדפדפן בתחילת כל קומה (מקומה 2), כדי שאפשר יהיה להמשיך מחר
const SAVE = 'd32-deep-save';
const loadSave = () => { try { return JSON.parse(localStorage.getItem(SAVE)); } catch (e) { return null; } };
const writeSave = s => { try { localStorage.setItem(SAVE, JSON.stringify({ v: 4, diff: s.diff ?? 1, floor: s.floor, hp: s.hp, coins: s.coins, score: s.score, potions: s.potions, trophies: s.trophies, met: [...s.met], times: s.times, xp: s.xp, hasBow: s.hasBow, arrows: s.arrows, weapon: s.weapon })); } catch (e) {} };
const clearSave = () => { try { localStorage.removeItem(SAVE); } catch (e) {} };
const bossOf = s => s.mobs.find(m => KINDS[m.k].boss && !m.dust);
function startFloor(s, snd) {
  newFloor(s); s.mode = 'play'; s.t = 0; s.torch = 1; s.floorT = 0; s.paused = false; s.intro = 300;
  writeSave(s);   // נשמר בתחילת כל קומה, גם הראשונה
  say(s, floorMsg(s.floor), 180);
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
    cell.lsec = s.map[cy + DY[l]]?.[cx + DX[l]] === '%'; cell.rsec = s.map[cy + DY[r]]?.[cx + DX[r]] === '%';
    cell.lnote = s.map[cy + DY[l]]?.[cx + DX[l]] === 'N'; cell.rnote = s.map[cy + DY[r]]?.[cx + DX[r]] === 'N';
    if (wallAt(s, cx + DX[s.dir], cy + DY[s.dir])) { const f = s.map[cy + DY[s.dir]]?.[cx + DX[s.dir]]; cell.front = 1; cell.door = f === 'D'; cell.secret = f === '%'; cell.bars = f === 'H'; cell.note = f === 'N'; break; }
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
    if (c.front) { frontWall(z1, lt, c.door && !c.bars); if (c.secret) crackFront(z1, lt); if (c.bars) barsFront(z1, lt); if (c.note) noteFront(z1, lt); }
    if (c.left === 1) { sideWall(z0, z1, -1, lt, c.x, c.y); if (c.lsec) crackSide(z0, z1, -1, lt); if (c.lnote) noteSide(z0, z1, -1, lt); } else sideOpening(z0, z1, -1, lt);
    if (c.right === 1) { sideWall(z0, z1, 1, lt, c.x, c.y); if (c.rsec) crackSide(z0, z1, 1, lt); if (c.rnote) noteSide(z0, z1, 1, lt); } else sideOpening(z0, z1, 1, lt);
    if (STYLE === 'cave' && i > 0 && shade(i, lt) > 1 && hash(c.x, c.y, 9) < 0.35) puddle(i);
    if (STYLE === 'lair' && i > 0 && shade(i, lt) > 1 && hash(c.x, c.y, 8) < 0.4) lairFloor(i + 0.5, c.x, c.y);
    if (i > 0 && c.x === s.sx && c.y === s.sy && s.floor < LAST) stairsAt(i);
  }
  s.dirty = false;
}

// פגיעה בדמות: אויב מאבד חיים, ובניצחון נותן נקודות וניסיון. בידיד אי אפשר לפגוע (גונן, 27.10: FIRE מול ידיד = שיחה)
function hit(s, m, dmg, snd, api) {
  const K = KINDS[m.k];
  if (K.friend) return;
  m.hp -= dmg; m.flash = 8; snd.noise(60, 0.07); snd.tone(260, 60, 120);
  if (m.hp > 0.01) return;
  m.dust = 45; m.wind = 0; s.score += K.pts; snd.tone(600, 200, 100);
  if (K.trophy) s.trophies.push(K.trophy);
  say(s, K.boss ? K.name + ' IS DEFEATED!' : K.name.replace(/^AN? /, 'THE ') + ' IS GONE!');
  s.xp += K.pts;
  const lv = levelOf(s.xp);
  if (lv > s.lv) { s.hp = Math.min(maxHp({ lv, diff: s.diff }), s.hp + lv - s.lv); s.lv = lv; say(s, 'LEVEL UP! NOW LEVEL ' + lv, 150); snd.tone(523, 120, 1046); }
}
// ידיד: בפעם הראשונה נותן מתנה ורמז
function talk(s, m, snd) {
  if (m.k === 'V') { s.shop = { sel: 0 }; snd.tone(660, 80, 880); return; }   // סוחר: נפתחת החנות
  if (m.given) { say(s, m.k === 'O' ? 'THE MINER WAVES. GOOD LUCK!' : 'THANK YOU, FRIEND!'); return; }
  m.given = true; snd.tone(660, 150, 990);
  if (m.k === 'O') { s.torch = 1; s.dirty = true; say(s, 'MINER: CRACKED WALLS HIDE GOLD', 200); }
  else { s.potions++; s.arrows += 5; say(s, 'FREE AT LAST! TAKE THESE', 200); }
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
  buttons: ['left', 'up', 'down', 'right', 'fire', 'pause'],
  help: {
    he: ['הסיפור: הדרקון לקח את קלטת הזהב, הקלטת הראשונה שהוקלטה אי פעם על Dragon, וירד איתה חמש קומות מתחת לטירה. צריך להחזיר אותה.',
      'הליכה: ▲ צעד קדימה, ▼ צעד אחורה, ◀ ▶ פנייה.',
      'קרב: FIRE מכה בחרב. אויב שמהבהב עומד להכות: צעד אחורה ב-▼, והוא יחטיא.',
      'תפריט: P עוצר את המשחק ופותח מפה, תרמיל (שם שותים שיקוי), אלבום דמויות והוראות. ◀ ▶ מחליפים דף.',
      'הלפיד דועך עם הזמן, וכשהוא חלש רואים פחות. בכל קומה יש לפידים חדשים.',
      'קשת: בקומה 2 מחכה קשת. בתרמיל בוחרים חרב או קשת, ואז FIRE יורה חץ לאורך המסדרון. לבוסים יש מגן מפני חצים.',
      'ידידים: הכורה הזקן והאסיר לא תוקפים. הולכים אליהם כדי לדבר, ומקבלים מתנה. גם FIRE מולם פותח שיחה, ואי אפשר לפגוע בהם.',
      'סודות: קיר עם סדק אפשר לפתוח ב-FIRE. מאחוריו יש אוצר או קיצור דרך.',
      'מלכודות: קוצים ורונות עולים כל כמה שניות, ולפני כן יש אזהרה. כשהתקרה רועדת, זזים מהר.',
      'סוחר: בקומות 2 עד 4 יש סוחר. הולכים אליו, ובחנות קונים שיקוי, חצים או לפיד במטבעות.',
      'פתקים: על חלק מהקירות יש פתק. FIRE מול הקיר קורא אותו.',
      'קושי: במסך הפתיחה ◀ ▶ בוחרים EASY, NORMAL או HARD. בסוף הניקוד מוכפל לפי הקושי. את המוזיקה מכבים בתרמיל.',
      'רמה: כל ניצחון נותן ניסיון. ברמה חדשה מקבלים עוד לב (עד 8 לבבות), ובכל שתי רמות המכה חזקה יותר.',
      'בכל קומה יש בוס ששומר על המדרגות. על המדרגות, FIRE יורד קומה. בקומות 2, 4 ו-5 צריך קודם מפתח לדלת נעולה.',
      'שמירה: ההתקדמות נשמרת בתחילת כל קומה. אחרי מוות, FIRE מנסה שוב את הקומה, ו-▼ מוותר ושומר את התוצאה.',
      'יציאה: Esc, או "הוצאת המחסנית".'],
    en: ['The dragon took the Golden Tape, the first tape ever recorded on a Dragon, five floors down under the castle. Bring it back.',
      '▲ step forward, ▼ step back, ◀ ▶ turn. FIRE strikes with the sword; on the stairs FIRE goes down.',
      'An enemy that flashes is about to hit: step back with ▼ and it misses.',
      'P pauses and opens a menu: map, bag (drink potions there), the creature album and help. ◀ ▶ change page.',
      'The torch fades with time, and a weak torch shows less. Each floor has new torches.',
      'Bow: a bow waits on floor 2. In the bag choose sword or bow; then FIRE shoots an arrow down the corridor. Bosses are shielded against arrows.',
      'Friends: the old miner and the prisoner never attack. Walk up to them to talk and get a gift. FIRE in front of them also talks; friends cannot be hurt.',
      'Secrets: a wall with a crack opens with FIRE. Behind it is treasure or a shortcut.',
      'Traps: spikes and runes rise every few seconds, with a warning first. When the ceiling shakes, move fast.',
      'Merchant: floors 2 to 4 have a merchant. Walk up to him and buy a potion, arrows or a torch with coins.',
      'Notes: some walls have a note. FIRE at the wall reads it.',
      'Difficulty: on the title screen ◀ ▶ choose EASY, NORMAL or HARD; the final score is multiplied by it. Music can be turned off in the bag.',
      'Level: every win gives experience. A new level gives another heart (up to 8), and every two levels a stronger blow.',
      'Each floor has a boss guarding the stairs. On floors 2, 4 and 5 you need a key for a locked door first.',
      'Progress is saved at the start of each floor. After a death FIRE tries the floor again, ▼ gives up and keeps the score. Esc or "Eject cartridge" leaves.']
  },

  init(api) {
    if (!img) { img = api.gfx.ctx.createImageData(W, VIEW); buf = new Uint32Array(img.data.buffer); }
    let diff = 1, music = true;
    try { diff = okDiff(parseInt(localStorage.getItem(DIFF_KEY), 10)); music = localStorage.getItem(MUSIC) !== 'off'; } catch (e) {}
    api.state = { mode: 'title', high: api.loadHigh('deep'), t: 0, save: loadSave(), titleP: 0, titleT: 0, diff, music };
    reset(api.state);
  },

  update(api) {
    const s = api.state, snd = api.sound;
    s.t++;
    if (s.mode === 'next') { if (api.hit('fire') && s.t > 40) { s.floor++; startFloor(s, snd); } return; }
    if (s.mode === 'title' && (api.hit('left') || api.hit('right'))) {   // רמת קושי
      s.diff = (s.diff + (api.hit('right') ? 1 : 2)) % 3; snd.tone(440 + s.diff * 110, 40);
      try { localStorage.setItem(DIFF_KEY, String(s.diff)); } catch (e) {}
    }
    if (s.mode === 'title') { if (api.hit('down')) { s.titleP = ((s.titleP || 0) + 1) % 4; s.titleT = 0; snd.tone(330, 30); } else if (++s.titleT > 300) { s.titleP = ((s.titleP || 0) + 1) % 4; s.titleT = 0; } }
    if (s.mode === 'over' && s.t > 40) {
      const v = loadSave();
      if (api.hit('fire') && v) {   // מנסים שוב את הקומה: הכל חוזר למה שהיה בתחילתה, ולפחות 3 לבבות
        reset(s); Object.assign(s, { diff: okDiff(v.diff), floor: v.floor, hp: Math.max(DIFF[okDiff(v.diff)].retry, v.hp), coins: v.coins, score: v.score, potions: v.potions || 0, trophies: v.trophies || [], met: new Set(v.met || []), times: v.times || [], xp: v.xp || 0, lv: levelOf(v.xp || 0), hasBow: !!v.hasBow, arrows: v.arrows || 0, weapon: v.hasBow && v.weapon === 'bow' ? 'bow' : 'sword' });
        startFloor(s, snd); return;
      }
      if (api.hit('down') || (api.hit('fire') && !v)) {   // מוותרים: התוצאה נכנסת להיכל התהילה והשמירה נמחקת
        clearSave(); s.mode = 'title'; s.t = 0; s.save = null; setPalette(1); STYLE = 'brick'; api.submitScore('deep', finalScore(s)); s.high = api.loadHigh('deep'); return;
      }
      return;
    }
    if (s.mode === 'title' || s.mode === 'over' || s.mode === 'won') {
      if (s.mode === 'title' && s.save && api.hit('up') && s.t > 40) {   // ממשיכים מהקומה שנשמרה
        const v = s.save; reset(s);
        Object.assign(s, { diff: okDiff(v.diff), floor: v.floor, hp: v.hp, coins: v.coins, score: v.score, potions: v.potions || 0, trophies: v.trophies || [], met: new Set(v.met || []), times: v.times || [], xp: v.xp || 0, lv: levelOf(v.xp || 0), hasBow: !!v.hasBow, arrows: v.arrows || 0, weapon: v.hasBow && v.weapon === 'bow' ? 'bow' : 'sword' });
        startFloor(s, snd); return;
      }
      if (api.hit('fire') && s.t > 40) {
        if (s.mode !== 'title') { s.mode = 'title'; s.t = 0; s.save = loadSave(); s.high = api.loadHigh('deep'); setPalette(1); STYLE = 'brick'; return; }
        reset(s); startFloor(s, snd);
      }
      return;
    }
    if (s.intro > 0) {
      if (['up', 'down', 'left', 'right', 'fire', 'pause'].some(b => api.hit(b))) { s.intro = 0; return; } else { s.intro--; return; }
    }
    if (s.note) {   // קוראים פתק: כל מקש סוגר
      if (['up', 'down', 'left', 'right', 'fire', 'pause'].some(b => api.hit(b))) { s.note = null; snd.tone(300, 30); }
      return;
    }
    if (s.shop) {   // החנות של הסוחר: ▲ ▼ בוחרים, FIRE קונה, P או LEAVE יוצאים
      if (api.hit('down')) s.shop.sel = Math.min(SHOP.length - 1, s.shop.sel + 1);
      if (api.hit('up')) s.shop.sel = Math.max(0, s.shop.sel - 1);
      const it = SHOP[s.shop.sel];
      if (api.hit('pause') || (api.hit('fire') && !it.cost)) { s.shop = null; say(s, 'THANK YOU! COME AGAIN.'); snd.tone(500, 60, 700); return; }
      if (api.hit('fire')) {
        if (it.bow && !s.hasBow) { say(s, 'YOU HAVE NO BOW YET'); snd.tone(120, 60); }
        else if (it.full && it.full(s)) { say(s, 'YOUR TORCH IS STILL BRIGHT'); snd.tone(120, 60); }
        else if (s.coins < it.cost) { say(s, 'NOT ENOUGH COINS'); snd.tone(120, 60); }
        else { s.coins -= it.cost; it.buy(s); say(s, it.got); snd.tone(880, 60, 1320); }
      }
      return;
    }
    if (api.hit('pause')) { s.paused = !s.paused; s.page = 0; s.bagSel = 0; snd.tone(330, 40); }
    if (s.paused) {   // תפריט עצירה: מפה, תרמיל, אלבום, הוראות. הלפיד לא דועך והאויבים לא זזים
      if (api.hit('right')) { s.page = (s.page + 1) % 4; snd.tone(300, 20); }
      if (api.hit('left')) { s.page = (s.page + 3) % 4; snd.tone(300, 20); }
      if (s.page === 1) {
        const n = bagItems(s).length;
        if (api.hit('down')) s.bagSel = Math.min(n - 1, s.bagSel + 1);
        if (api.hit('up')) s.bagSel = Math.max(0, s.bagSel - 1);
        const it = bagItems(s)[s.bagSel];
        if (api.hit('fire') && it && it.use) it.use(s, snd);
      }
      return;
    }
    s.floorT++;
    if (s.msgT) s.msgT--;
    if (s.hurt) s.hurt--;
    if (s.atkCd) s.atkCd--;

    // הלפיד דועך: לפיד שלם מחזיק 4 דקות (סבב 1: מאוזן לפי זמני הקומות, tools/dragon-test.mjs בודק)
    const before = Math.round(light(s) * 2);
    if (s.torch > 0) s.torch = Math.max(0, s.torch - 1 / (TORCH_FRAMES * D(s).torch));
    if (Math.round(light(s) * 2) !== before) s.dirty = true;
    if (s.torch > 0 && s.torch < 0.2 && s.t % 600 === 0) say(s, 'THE TORCH IS DYING...');

    // תנועה וקרב
    if (s.slow) s.slow--;
    if (s.moveCd) s.moveCd--;
    const fx = s.x + DX[s.dir], fy = s.y + DY[s.dir], front = mobAt(s, fx, fy);
    const move = (nx, ny) => {
      const cell = s.map[ny]?.[nx];
      if (cell === 'D' || cell === 'H') {   // דלת או סורג: נפתחים במפתח
        if (s.keys) { s.keys--; s.map[ny][nx] = '.'; s.dirty = true; say(s, cell === 'H' ? 'THE BARS SWING OPEN!' : 'THE KEY TURNS. THE DOOR OPENS!'); snd.tone(300, 300, 600); }
        else { say(s, cell === 'H' ? 'LOCKED BARS. FIND A KEY!' : 'A LOCKED DOOR. FIND THE KEY!'); snd.tone(90, 80); }
        return;
      }
      const who = mobAt(s, nx, ny);
      if (who && KINDS[who.k].friend) { talk(s, who, snd); return; }   // הולכים אל ידיד = מדברים איתו
      if (wallAt(s, nx, ny) || who) { snd.tone(90, 40); return; }
      if (s.slow && s.moveCd) return;   // נבגים: צעד רק פעם בכמה רגעים
      if (s.slow) s.moveCd = 22;
      s.x = nx; s.y = ny; s.steps++; s.dirty = true; snd.noise(25, 0.025);
      const it = s.items.findIndex(i => i.x === nx && i.y === ny);
      if (it >= 0) {
        const k = s.items[it].k; s.items.splice(it, 1);
        if (k === 'c') { s.coins++; s.score += 50; say(s, 'A GOLD COIN!'); snd.tone(880, 60, 1320); }
        if (k === 't') { s.torch = 1; s.dirty = true; say(s, 'A NEW TORCH!'); snd.tone(440, 120, 880); }
        if (k === 'p') { s.potions++; say(s, 'A POTION! P - BAG TO DRINK IT'); snd.tone(500, 150, 900); }
        if (k === 'k') { s.keys++; say(s, 'AN OLD IRON KEY!'); snd.tone(660, 200, 990); }
        if (k === 'b') { s.hasBow = true; s.arrows += 10; say(s, 'A BOW! P - BAG TO TAKE IT'); snd.tone(520, 220, 1040); }
        if (k === 'a') { s.arrows += 5; say(s, 'FIVE ARROWS!'); snd.tone(700, 80, 900); }
        if (k === '$') { s.coins += 3; s.score += 200; say(s, 'HIDDEN TREASURE! +200'); snd.tone(880, 300, 1760); }
      }
      const rock = s.traps.find(t => t.k === '*' && t.x === nx && t.y === ny && !t.done && !t.fall);
      if (rock) { rock.fall = 50; say(s, 'THE CEILING SHAKES! MOVE!', 60); snd.noise(300, 0.05); }
      if (nx === s.sx && ny === s.sy) say(s, bossOf(s) ? guardMsg(bossOf(s).k, s.floor === LAST) : s.floor === LAST ? 'GOLDEN TAPE! FIRE TO TAKE IT' : 'STAIRS DOWN. FIRE TO GO DOWN', 200);
    };
    if (api.hit('left')) { s.dir = (s.dir + 3) % 4; s.dirty = true; snd.tone(300, 20); }
    if (api.hit('right')) { s.dir = (s.dir + 1) % 4; s.dirty = true; snd.tone(300, 20); }
    if (api.hit('up')) move(fx, fy);
    if (api.hit('down')) move(s.x - DX[s.dir], s.y - DY[s.dir]);
    if (s.shot) {   // חץ באוויר: פוגע כשהוא מגיע
      if (++s.shot.t >= s.shot.dist * 4) {
        const sh = s.shot; s.shot = null; let x = sh.x, y = sh.y, m = null;
        for (let d = 1; d <= sh.dist + 1 && !m; d++) { x += DX[sh.dir]; y += DY[sh.dir]; if (wallAt(s, x, y)) break; m = mobAt(s, x, y); }
        if (m && !KINDS[m.k].friend) hit(s, m, KINDS[m.k].boss ? 0.5 : 1, snd, api);
      }
    }
    if (api.hit('fire') && !s.atkCd) {
      s.atkCd = 18;
      const onStairs = s.x === s.sx && s.y === s.sy && !bossOf(s), crack = s.map[fy]?.[fx] === '%', note = s.map[fy]?.[fx] === 'N';
      if (front && KINDS[front.k].friend) { talk(s, front, snd); s.atkCd = 0; }   // ידיד מולך: FIRE מדבר איתו
      else if (s.weapon === 'bow' && s.arrows > 0 && !s.shot && !onStairs && !crack && !note) {   // קשת: החץ טס לאורך המסדרון אל הראשון שבדרך
        s.arrows--; snd.tone(900, 60, 400);
        let d = 1, x = s.x, y = s.y, target = null;
        for (; d <= 5; d++) { x += DX[s.dir]; y += DY[s.dir]; if (wallAt(s, x, y)) break; const m = mobAt(s, x, y); if (m) { target = m; break; } }
        s.shot = { t: 0, dist: Math.max(1, target ? d : d - 1), x: s.x, y: s.y, dir: s.dir };
        if (!s.arrows) { s.weapon = 'sword'; say(s, 'NO ARROWS LEFT. SWORD!'); }
      } else if (front && !onStairs) hit(s, front, swordDmg(s), snd, api);
      else if (note) { s.note = NOTES[s.floor + ',' + fx + ',' + fy] || ['...']; s.atkCd = 0; snd.tone(700, 40, 900); }   // קוראים את הפתק
      else if (crack) {   // קיר סדוק: מעבר סודי
        s.map[fy][fx] = '.'; s.secrets++; s.score += 100; s.dirty = true; say(s, 'A SECRET PASSAGE! +100'); snd.noise(200, 0.08); snd.tone(200, 400, 800);
      } else if (onStairs) {
        const secs = Math.round(s.floorT / 50); s.lastTime = secs; s.times.push(secs);
        s.speedBonus = Math.max(0, (PAR[s.floor - 1] - secs) * 2); s.score += 500 + s.hp * 100 + s.speedBonus; s.t = 0; snd.tone(440, 400, 1760);
        if (s.floor < LAST) s.mode = 'next';
        else { s.mode = 'won'; s.score += s.trophies.length * 300; clearSave(); api.submitScore('deep', finalScore(s)); }
      } else snd.tone(200, 30, 160);
    }

    // פתק מולך: הודעה פעם אחת לכל מקום ומבט
    if (s.map[s.y + DY[s.dir]]?.[s.x + DX[s.dir]] === 'N') { const k = s.x + ',' + s.y + ',' + s.dir; if (s.noteHint !== k) { s.noteHint = k; say(s, 'A NOTE! FIRE TO READ IT'); } }
    // מלכודות (סבב 3)
    for (const t of s.traps) {
      const on = t.x === s.x && t.y === s.y, near = Math.abs(t.x - s.x) + Math.abs(t.y - s.y) <= 3;
      if (t.k === '*') {   // תקרה רעועה: רועדת 50 תמונות ואז נופלת
        if (!t.fall) continue;
        if (--t.fall % 12 === 0 && t.fall) snd.noise(80, 0.03);
        if (!t.fall) { t.done = true; snd.noise(250, 0.09); if (on) { s.hp--; s.hurt = 12; say(s, 'A ROCK HITS YOU!', 80); } }
        continue;
      }
      const ph = trapPhase(s, t), cycle = Math.floor((s.floorT + t.x * 37 + t.y * 11) / TRAP_CYCLE), rune = STYLE === 'library';
      if (ph === TRAP_WARN && near) snd.tone(rune ? 900 : 180, 60, rune ? 1400 : 120, 0.02);   // שומעים את המלכודת מתכוננת
      if (ph === TRAP_WARN && on) say(s, rune ? 'THE RUNE GLOWS! MOVE!' : 'SPIKES UNDER YOU! MOVE!', 60);
      if (ph >= TRAP_HIT && on && t.hitAt !== cycle) { t.hitAt = cycle; s.hp--; s.hurt = 12; snd.noise(100, 0.08); snd.tone(260, 150, 90); say(s, rune ? 'THE RUNE BURNS YOU!' : 'OUCH! SPIKES!', 80); }
    }
    // מוזיקה: מנגינה של הקומה, ומנגינה אחרת כשהבוס קרוב
    if (s.music) {
      const b = bossOf(s), tune = b && Math.abs(b.x - s.x) + Math.abs(b.y - s.y) <= 5 ? BOSS_TUNE : TUNES[s.floor - 1];
      if (s.mt++ % tune.step === 0) { const n = tune.n[((s.mt / tune.step) | 0) % tune.n.length]; if (n !== null) snd.tone(tune.base * Math.pow(2, n / 12), tune.step * 17, 0, 0.012); }
    }

    // האויבים: מתקרבים, מתכוננים למכה (מהבהבים ונוהמים), ומכים אם השחקן לא התרחק
    for (const m of s.mobs) {
      const K = KINDS[m.k];
      if (m.flash) m.flash--;
      if (m.dust) { if (--m.dust === 0) m.gone = true; continue; }
      if (K.friend) continue;
      const adj = Math.abs(m.x - s.x) + Math.abs(m.y - s.y) === 1 && !wallAt(s, m.x, m.y);
      if (m.wind) {
        if (--m.wind === 0) {
          if (adj && m.k === 'g' && s.coins) { s.coins--; m.flee = 8; say(s, 'THE GOBLIN STEALS A COIN!', 90); snd.tone(1200, 120, 600); }   // גובלין: גונב ובורח
          else if (adj) {
            s.hp -= K.boss ? D(s).boss : K.dmg; s.hurt = 12; snd.noise(120, 0.09); snd.tone(300, 200, 80); say(s, K.name.replace(/^AN? /, 'THE ') + ' HITS YOU!', 60);
            if (m.k === 'm') { s.slow = 300; say(s, 'SPORES! YOU FEEL SLOW...', 120); }   // פטרייה: ענן נבגים מאט
          }
          else snd.tone(120, 60, 80);   // החטיא: השחקן נסוג בזמן
          m.cd = spd(s, K);
        }
        continue;
      }
      if (m.cd > 0) { m.cd--; continue; }
      if (m.flee > 0) {   // בורח מהשחקן
        const opts = [0, 1, 2, 3].map(d => [m.x + DX[d], m.y + DY[d]]).filter(([x, y]) => !wallAt(s, x, y) && !mobAt(s, x, y) && !(x === s.x && y === s.y));
        opts.sort((a, b) => (Math.abs(b[0] - s.x) + Math.abs(b[1] - s.y)) - (Math.abs(a[0] - s.x) + Math.abs(a[1] - s.y)));
        if (opts.length) { [m.x, m.y] = opts[0]; s.dirty = true; }
        m.flee--; m.cd = spd(s, K) >> 1; continue;
      }
      if (adj) { m.wind = D(s).wind; snd.tone(150, 160, 95); continue; }
      if (m.k === 'T') { m.cd = spd(s, K); continue; }   // טרול: לא זז, רק חוסם
      if (K.ghost) {   // רוח קטנה: מרחפת דרך קירות, ישר אל השחקן כשהוא קרוב
        const ddx = s.x - m.x, ddy = s.y - m.y, far = Math.abs(ddx) + Math.abs(ddy);
        let nx = m.x, ny = m.y;
        const bx = s.x - DX[s.dir], by = s.y - DY[s.dir];
        if (far <= 6 && far > 1 && hash(m.x, m.y, s.t) < 0.18 && !wallAt(s, bx, by) && !mobAt(s, bx, by)) { nx = bx; ny = by; say(s, 'A GHOST BEHIND YOU!', 70); snd.tone(500, 200, 1000, 0.04); }   // רוח: מופיעה מאחור
        else if (far <= 9) { if (Math.abs(ddx) >= Math.abs(ddy)) nx += Math.sign(ddx); else ny += Math.sign(ddy); }
        else { const d = (s.t + m.x * 5 + m.y * 11) % 4; nx += DX[d]; ny += DY[d]; }
        if (nx >= 1 && ny >= 1 && nx <= 14 && ny <= 14 && !(nx === s.x && ny === s.y) && !mobAt(s, nx, ny)) { m.x = nx; m.y = ny; s.dirty = true; }
        if (far <= 4 && s.t % 4 === 0) snd.tone(700, 60, 500, 0.02);   // צחקוק דק
        m.cd = spd(s, K); continue;
      }
      // רודפים מ-12 צעדים; רחוק יותר מסיירים במסדרונות, כדי שהקומה לא תהיה ריקה
      const path = stepToward(s, m, K.boss ? 3 : 12);
      if (!path && !K.boss) {
        const opts = [0, 1, 2, 3].filter(d => !wallAt(s, m.x + DX[d], m.y + DY[d]) && !mobAt(s, m.x + DX[d], m.y + DY[d]) && !(m.x + DX[d] === s.x && m.y + DY[d] === s.y));
        const fwd = opts.filter(d => d !== ((m.face ?? 0) + 2) % 4);
        const pick = (fwd.length ? fwd : opts)[(s.t + m.x * 7 + m.y * 13) % (fwd.length || opts.length || 1)];
        if (pick !== undefined) { m.face = pick; m.x += DX[pick]; m.y += DY[pick]; s.dirty = true; }
        m.cd = spd(s, K) * 2;
        continue;
      }
      if (path && path.d > 1) {
        const away = Math.abs(path.nx - m.hx) + Math.abs(path.ny - m.hy);
        if ((!K.boss || away <= 2) && !mobAt(s, path.nx, path.ny)) { m.x = path.nx; m.y = path.ny; s.dirty = true; }
        if (path.d <= 4 && s.t % 3 === 0) snd.tone(m.k === 'r' ? 900 : 110, 40, m.k === 'r' ? 1200 : 90, 0.03);   // שומעים אותו מתקרב
      }
      m.cd = spd(s, K);
    }
    s.mobs = s.mobs.filter(m => !m.gone);
    if (s.hp <= 0) { s.mode = 'over'; s.t = 0; snd.tone(300, 600, 60); }   // היכל התהילה רק כשמסיימים או מוותרים (גונן, 26.10, אפשרות ב)
    if (s.dirty) render(s);
    const seenNow = [];
    if (s.view) for (let i = 1; i < s.view.length && i <= light(s); i++) { const m = mobAt(s, s.view[i].x, s.view[i].y); if (m) seenNow.push(m); }
    for (const m of s.mobs) if (!m.dust && Math.abs(m.x - s.x) + Math.abs(m.y - s.y) === 1) seenNow.push(m);
    for (const m of seenNow) if (!s.met.has(m.k)) { s.met.add(m.k); if (s.msgT < 60) say(s, KINDS[m.k].friend ? 'A FRIEND? WALK UP TO TALK' : KINDS[m.k].name + '!', 120); snd.tone(520, 80, 780); }
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
      const tr = s.traps.find(o => o.x === c.x && o.y === c.y);
      if (tr) drawTrap(g, s, tr, i + 0.45);
      const it = s.items.find(o => o.x === c.x && o.y === c.y);
      if (it) stand(g, ITEM_ROWS[it.k], i + 0.4, { 1: C1, 2: C3, 3: it.k === 't' ? C2 : C3 }, it.k === 'k' ? 0.06 : it.k === 'b' ? 0.16 : 0.12);
      const m = mobAt(s, c.x, c.y) || s.mobs.find(o => o.dust && o.x === c.x && o.y === c.y);
      if (!m) continue;
      const K = KINDS[m.k], z = i + 0.15;
      if (m.dust) { const p = P(z); for (let n = 0; n < 60; n++) { const a = n * 2.4 + m.dust * 0.3, r = (45 - m.dust) * 0.9 * ((n % 7) / 7 + 0.3); g.rect(VX + Math.cos(a) * r, p[3] - (p[3] - p[1]) * K.h * 0.5 + Math.sin(a) * r * 0.7, 1, 1, n % 3 ? C1 : C0); } continue; }
      const base = K.col(), cols = m.flash ? Object.fromEntries(Object.keys(base).map(k => [k, C1])) : m.wind && (m.wind >> 2) % 2 ? Object.fromEntries(Object.keys(base).map(k => [k, k === '2' ? BLACK : C3])) : base;
      const p0 = P(z), lift = K.fly ? -(p0[3] - p0[1]) * 0.28 + Math.sin(s.t / 6) * 3 : 0;
      stand(g, K.rows, z - (m.wind ? 0.05 : 0), cols, K.h, ((Math.sin(s.t / 9 + m.x) * 1.2) | 0) + lift);
      if (K.fire && m.wind && m.wind < 24) { const t = (24 - m.wind) / 24; for (let y = VIEW - 1; y > VIEW - 1 - t * 110; y -= 2) for (let x = (y >> 1) % 3; x < W; x += 3) if (hash(x, y, s.t >> 2) < 0.55) g.rect(x, y, 2, 2, hash(x, y, 7) < 0.5 ? C1 : C3); }
      if (K.fly && m.wind) for (let n = 0; n < 6; n++) { const t = ((40 - m.wind) / 40 + n / 6) % 1; g.text('ABCDEFGHJKLMNPRSTW'[(n * 5 + (s.t >> 3)) % 18], VX + (n - 2.5) * 30 * t, lerp(p0[1] + 30, VIEW - 20, t), n % 2 ? C1 : C3, 'center', 1 + Math.round(t)); }
    }
    if (s.floor === LAST && !bossOf(s)) { const i = s.view.findIndex((c, n) => n && c.x === s.sx && c.y === s.sy); if (i > 0 && i <= lt) stand(g, TAPE, i + 0.4, { 1: C1, 3: C3 }, 0.14, (Math.sin(s.t / 7) * 2) | 0); }
    if (s.shot) { const z = 0.3 + s.shot.dist * s.shot.t / (s.shot.dist * 4), p = P(z), y = p[3] - (p[3] - p[1]) * 0.45, w = Math.max(2, (p[2] - p[0]) / 30); g.rect(VX - w, y, w * 2, 1, C1); g.rect(VX - w, y - 1, 1, 3, C3); }
    if (s.hurt) for (let y = 0; y < VIEW; y += 2) for (let x = (y >> 1) % 2; x < W; x += 6) g.rect(x, y, 1, 1, C3);
    // אויב שעומד לידנו אבל לא מלפנים: חץ שמראה מאיפה הוא מגיע
    for (const m of s.mobs) {
      if (m.dust || Math.abs(m.x - s.x) + Math.abs(m.y - s.y) !== 1) continue;
      const rel = ([0, 1, 2, 3].find(d => s.x + DX[d] === m.x && s.y + DY[d] === m.y) - s.dir + 4) % 4;
      if (rel === 1) g.sprite(ARROW[1], 236, 64, { 1: C3 }, false, 3); else if (rel === 3) g.sprite(ARROW[3], 6, 64, { 1: C3 }, false, 3); else if (rel === 2) { g.rect(92, 131, 72, 11, BLACK); g.text('BEHIND YOU!', 128, 133, C3, 'center'); }
    }
    // הבוס: פס חיים למעלה כשהוא בטווח הראייה
    const boss = s.mobs.find(m => KINDS[m.k].boss && !m.dust && s.view.some((c, i) => i && c.x === m.x && c.y === m.y));
    if (boss) { const K = KINDS[boss.k]; g.rect(0, 0, W, 20, BLACK); g.text(K.name, 128, 3, C3, 'center'); g.rect(64, 12, 128, 5, C2); g.rect(64, 12, 128 * boss.hp / K.hp, 5, C3); }
    drawHud(g, s);
    if (s.paused) drawPause(g, s);
    else if (s.intro > 0) drawIntro(g, s);
    else if (s.shop) drawShop(g, s);
    else if (s.note) drawNote(g, s);
    // עומדים על מלכודת שמתכוננת: אזהרה בתחתית המבט
    const under = !s.paused && s.traps.find(t => t.x === s.x && t.y === s.y && (t.k === '*' ? t.fall > 0 : trapPhase(s, t) >= TRAP_WARN));
    if (under && (s.t >> 2) % 2) { g.rect(92, 131, 72, 11, BLACK); g.text('MOVE!', 128, 133, C3, 'center'); }
  }
};

// החנות של הסוחר (סבב 3): סוף סוף יש למטבעות שימוש
const SHOP = [
  { name: 'POTION', cost: 3, got: 'A POTION! P - BAG TO DRINK IT', buy: s => { s.potions++; } },
  { name: 'FIVE ARROWS', cost: 2, bow: true, got: 'FIVE ARROWS!', buy: s => { s.arrows += 5; } },
  { name: 'A NEW TORCH', cost: 2, got: 'A NEW TORCH!', full: s => s.torch > 0.9, buy: s => { s.torch = 1; s.dirty = true; } },
  { name: 'LEAVE', cost: 0 }
];
function drawShop(g, s) {
  g.rect(24, 22, 208, 106, BLACK); g.rect(24, 22, 208, 1, C2); g.rect(24, 127, 208, 1, C2); g.rect(24, 22, 1, 106, C2); g.rect(231, 22, 1, 106, C2);
  g.sprite(MERCHANT, 32, 28, KINDS.V.col(), false);
  g.text('THE MERCHANT', 50, 30, C1); g.text('WHAT WILL IT BE?', 50, 40, C0);
  g.sprite(COIN, 196, 30, { 1: C1, 2: C3 }, false); g.text(String(s.coins), 204, 31, C1);
  SHOP.forEach((it, i) => {
    const y = 56 + i * 13, sel = i === s.shop.sel;
    if (sel) g.rect(32, y - 2, 192, 11, C1);
    g.text(it.name, 38, y, sel ? BLACK : C0);
    if (it.cost) { g.text(it.cost + ' COINS', 218, y, sel ? BLACK : (s.coins >= it.cost ? C2 : C3), 'right'); }
  });
  g.text('UP DOWN: CHOOSE  FIRE: BUY', 128, 114, C2, 'center');
}
// פתק על הקיר, פתוח לקריאה
function drawNote(g, s) {
  const n = s.note.length, h = 24 + n * 11;
  g.rect(28, 30, 200, h, C0); g.rect(30, 32, 196, h - 4, BLACK);
  s.note.forEach((t, i) => g.text(t, 128, 40 + i * 11, i === n - 1 && t[0] === '-' ? C2 : C1, 'center'));
  if ((s.t >> 4) % 2) g.text('ANY KEY', 128, 30 + h - 11, C2, 'center');
}
// התרמיל: מה אספנו, כמה, ולמה זה משמש. use = מה FIRE עושה כשהשורה נבחרת
function bagItems(s) {
  const take = w => (s, snd) => { s.weapon = w; snd.tone(400, 60, 600); say(s, w === 'bow' ? 'BOW IN HAND' : 'SWORD IN HAND'); };
  const out = [{ icon: 'sword', name: 'SWORD', what: s.weapon === 'sword' ? 'IN YOUR HAND' : 'FIRE: TAKE IT', use: take('sword') }];
  if (s.hasBow) out.push({ icon: 'bow', name: 'BOW, ARROWS ' + s.arrows, what: s.weapon === 'bow' ? 'IN YOUR HAND' : s.arrows ? 'FIRE: TAKE IT' : 'NO ARROWS', use: (s, snd) => { if (s.arrows) take('bow')(s, snd); else snd.tone(120, 60); } });
  out.push({ icon: 'potion', name: 'POTION X' + s.potions, what: s.potions ? 'FIRE: DRINK, +2 HEARTS' : 'FIND THEM IN THE DEEP',
    use: (s, snd) => { if (!s.potions) return; if (s.hp >= maxHp(s)) { say(s, 'YOUR HEARTS ARE FULL'); snd.tone(120, 60); return; } s.potions--; s.hp = Math.min(maxHp(s), s.hp + 2); snd.tone(500, 150, 900); } });
  if (s.keys) out.push({ icon: 'key', name: 'KEY X' + s.keys, what: 'OPENS A LOCKED DOOR' });
  out.push({ icon: 'coin', name: 'COINS ' + s.coins, what: '50 POINTS EACH' });
  if (s.trophies.length) out.push({ icon: 'trophy', name: 'KEEPSAKES X' + s.trophies.length, what: '+300 EACH IF YOU WIN' });
  out.push({ icon: 'level', name: 'LEVEL ' + s.lv, what: s.lv >= XPL.length ? 'TOP LEVEL!' : 'XP ' + s.xp + ' / ' + XPL[s.lv] });
  out.push({ icon: 'music', name: s.music ? 'MUSIC ON' : 'MUSIC OFF', what: s.music ? 'FIRE: TURN IT OFF' : 'FIRE: TURN IT ON',
    use: (s, snd) => { s.music = !s.music; s.mt = 0; snd.tone(600, 40); try { localStorage.setItem(MUSIC, s.music ? 'on' : 'off'); } catch (e) {} } });
  return out;
}
// מלכודת בעומק z: קוצים או רונה לפי השלב במחזור, תקרה רעועה עם סדק ואבן שנופלת
function drawTrap(g, s, t, z) {
  const p = P(z), H = p[3] - p[1];
  if (t.k === '*') {
    if (t.done) { stand(g, RUBBLE, z, { 1: C2 }, 0.07); return; }
    const sh = t.fall ? ((s.t >> 1) % 2 ? 1 : -1) : 0;   // רועד
    for (let i = -2; i <= 2; i++) line(VX + i * H / 18 + sh, p[1] + 1, VX + i * H / 14 + sh, p[1] + 3 + Math.abs(i) * H / 40, C2);
    if (t.fall && t.fall < 16) stand(g, ROCK, z, { 1: C0, 2: C2 }, 0.1, -H * 0.85 * t.fall / 16);
    return;
  }
  const ph = trapPhase(s, t);
  if (STYLE === 'library') {   // רונה: עמומה, מהבהבת באזהרה, ובוערת במכה
    const c = ph >= TRAP_HIT ? C3 : ph >= TRAP_WARN ? ((s.t >> 2) % 2 ? C1 : C3) : C2;
    stand(g, RUNE, z, { 1: c }, 0.08);
    if (ph >= TRAP_HIT) for (let n = 0; n < 12; n++) g.rect(VX + (hash(n, s.t >> 1, 3) - 0.5) * H * 0.3, p[3] - hash(n, s.t >> 1, 4) * H * 0.35, 1, 1, n % 2 ? C1 : C3);
    return;
  }
  if (ph >= TRAP_HIT) stand(g, SPIKES, z, { 1: C0 }, 0.12);
  else if (ph >= TRAP_WARN) stand(g, TIPS, z, { 1: C0 }, 0.05);
  else stand(g, HOLES, z, { 1: C2 }, 0.05);
}
function stand(g, rows, z, colors, realH, bob = 0) {
  const p = P(z), scale = Math.max(1, Math.round((p[3] - p[1]) * realH / rows.length));
  const w = rows[0].length * scale, h = rows.length * scale;
  g.sprite(rows, VX - w / 2, p[3] - h + bob, colors, false, scale);
}
// מצפן: חץ שמראה לאן פונים (המפה תמיד צפון למעלה)
const ARROW = [['..1..', '.111.', '11111', '..1..', '..1..'], ['..1..', '..11.', '11111', '..11.', '..1..'], ['..1..', '..1..', '11111', '.111.', '..1..'], ['..1..', '.11..', '11111', '.11..', '..1..']];
function drawHud(g, s) {
  g.rect(0, VIEW, W, H - VIEW, BLACK);
  g.rect(0, VIEW + 1, W, 1, C2);
  for (let i = 0; i < maxHp(s); i++) g.sprite(HEART, 4 + i * 7, 157, { 3: i < s.hp ? C3 : C2 }, false);
  g.sprite(TORCH, 62, 155, { 1: C1, 2: C3, 3: C2 }, false);
  g.rect(68, 159, 26, 5, C2); g.rect(68, 159, 26 * s.torch, 5, C1);
  if (s.weapon === 'bow') { g.sprite(BOW, 99, 155, { 1: C1 }, false); g.text(String(s.arrows), 106, 158, C1); }
  else g.sprite(['.....1', '....1.', '...1..', '2.1...', '.2....', '2.2...'], 99, 156, { 1: C1, 2: C2 }, false);
  g.text('LV' + s.lv, 118, 158, C0);
  if (s.slow) g.text('SLOW', 118, 166, C3);
  if (s.potions) { g.sprite(POTION, 138, 156, { 1: C1, 2: C3, 3: C3 }, false); g.text(String(s.potions), 144, 158, C1); }
  g.sprite(COIN, 155, 157, { 1: C1, 2: C3 }, false); g.text(String(s.coins), 161, 158, C1);
  if (s.keys) g.sprite(KEY, 178, 158, { 1: C1 }, false);
  // מצפן ומספר קומה
  g.sprite(ARROW[s.dir], 197, 155, { 1: C1 }, false); g.text(DIRS[s.dir][0], 199, 163, C2, 'center');
  g.text('F' + s.floor, 199, 176, C0, 'center');
  // מיני-מפה: 5×5 משבצות סביב השחקן, רק מה שכבר ראינו
  const MX = 212, MY = 155, CS = 7;
  g.rect(MX - 1, MY - 1, CS * 5 + 2, CS * 5 + 2, C2); g.rect(MX, MY, CS * 5, CS * 5, BLACK);
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const x = s.x + dx, y = s.y + dy, X = MX + (dx + 2) * CS, Y = MY + (dy + 2) * CS;
    if (x < 0 || y < 0 || x > 15 || y > 15 || !s.seen.has(x + ',' + y)) continue;
    const ch = s.map[y][x];
    if ('#%N'.includes(ch)) g.rect(X, Y, CS, CS, C2); else if (ch === 'D' || ch === 'H') g.rect(X + 1, Y + 1, CS - 2, CS - 2, C1); else if (x === s.sx && y === s.sy) g.rect(X + 1, Y + 1, CS - 2, CS - 2, C3);
  }
  g.sprite(ARROW[s.dir], MX + 2 * CS + 1, MY + 2 * CS + 1, { 1: C1 }, false);
  const text = s.msgT ? s.msg : 'P: MAP, BAG AND HELP';
  g.text(text.slice(0, 30), 98, 176, s.msgT ? C1 : C2, 'center');
}
// תפריט עצירה: ארבעה דפים, ◀ ▶ עוברים ביניהם
const PAGES = ['MAP', 'BAG', 'CREATURES', 'HOW TO PLAY'];
const SHORT = { V: 'MERCHANT', r: 'RAT', g: 'GOBLIN', m: 'MUSHROOM', h: 'GHOST', T: 'TROLL', B: 'OGRE KING', G: 'STONE GOLEM', M: 'MOLE KING', W: 'SPELL BOOK', X: 'DRAGON', O: 'OLD MINER', J: 'PRISONER' };
function frame(g, title, s) {
  g.rect(0, 0, W, VIEW + 1, BLACK);
  g.rect(8, 4, 240, 1, C2); g.rect(8, 146, 240, 1, C2); g.rect(8, 4, 1, 143, C2); g.rect(247, 4, 1, 143, C2);
  g.text(title, 128, 9, C1, 'center');
  g.rect(9, 136, 238, 10, BLACK); g.text('LEFT RIGHT: PAGES   P: PLAY ON', 128, 138, C2, 'center');
  for (let i = 0; i < 4; i++) g.rect(110 + i * 10, 19, 6, 2, i === s.page ? C1 : C2);
}
function drawPause(g, s) {
  frame(g, PAGES[s.page], s);
  if (s.page === 0) {
    g.text('FLOOR ' + s.floor, 20, 30, C0);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      if (!s.seen.has(x + ',' + y)) continue;
      const X = 68 + x * 7.5, Y = 26 + y * 7.4;
      if ('#%N'.includes(s.map[y][x])) g.rect(X, Y, 7.5, 7.4, C2); else if ('DH'.includes(s.map[y][x])) g.rect(X + 1, Y + 1, 5, 5, C1); else g.rect(X + 3, Y + 3, 2, 2, C0);
      if (x === s.sx && y === s.sy) g.rect(X + 1, Y + 1, 5, 5, C3);
    }
    g.sprite(ARROW[s.dir], 68 + s.x * 7.5 + 1, 26 + s.y * 7.4 + 1, { 1: C1 }, false);
    g.text('YOU', 20, 60, C1); g.text('STAIRS', 20, 72, C3); g.text('DOOR', 20, 84, C1);
  } else if (s.page === 1) {
    const items = bagItems(s);
    items.slice(0, 8).forEach((it, i) => {
      const y = 28 + i * 12, sel = i === s.bagSel;
      if (sel) g.rect(14, y - 2, 228, 11, C1);
      const icon = { sword: [['.....1', '....1.', '...1..', '2.1...', '.2....', '2.2...'], { 1: C1, 2: C2 }], potion: [POTION, { 1: C1, 2: C3, 3: C3 }], key: [KEY, { 1: C1 }], coin: [COIN, { 1: C1, 2: C3 }], trophy: [['1.1.1', '11111', '.111.', '..1..', '.111.'], { 1: C1 }], bow: [BOW, { 1: C1 }], level: [['..1..', '.111.', '11111', '..1..', '..1..'], { 1: C3 }], music: [['..111', '..1.1', '..1.1', '111.1', '11.11'], { 1: C1 }] }[it.icon];
      g.sprite(icon[0], 18, y, icon[1], false);
      g.text(it.name, 30, y, sel ? BLACK : C0); g.text(it.what, 240, y, sel ? BLACK : C2, 'right');
    });
    g.text('UP DOWN: CHOOSE   FIRE: USE', 128, 124, C2, 'center');
  } else if (s.page === 2) {
    // עשרה אויבים ובוסים בשני טורים, ומתחתם שורה של שלושת הידידים
    const ks = ['r', 'g', 'm', 'h', 'T', 'B', 'G', 'M', 'W', 'X'];
    ['O', 'J', 'V'].forEach((k, i) => {
      const K = KINDS[k], x = 14 + i * 78, y = 118, known = s.met.has(k);
      if (known) g.sprite(K.rows, x, y, K.col(), false); else g.text('?', x + 4, y + 3, C2);
      g.text(known ? SHORT[k] : '???', x + 14, y + 3, known ? C1 : C2);
    });
    ks.forEach((k, i) => {
      const K = KINDS[k], col = i % 2, row = i >> 1, x = 14 + col * 118, y = 25 + row * 18, known = s.met.has(k);
      if (known) { const sk = K.rows.length > 16 ? K.rows.filter((_, i) => i % 2 === 0) : K.rows; g.sprite(sk, x, y, K.col(), false); }
      else g.text('?', x + 6, y + 5, C2);
      g.text(known ? SHORT[k] : '???', x + 30, y + (known ? 1 : 5), known ? C1 : C2);
      if (known) g.text(K.blurb, x + 30, y + 10, K.friend ? C1 : C0);
    });
  } else {
    const L = [['UP', 'STEP FORWARD'], ['DOWN', 'STEP BACK - DODGE A BLOW!'], ['LEFT RIGHT', 'TURN'], ['FIRE', 'STRIKE. ON STAIRS: GO DOWN'], ['P', 'THIS MENU, AND BACK'], ['ESC', 'LEAVE. SAVED EACH FLOOR'], ['WALK UP', 'TALK TO A FRIEND']];
    L.forEach(([k, t], i) => { g.text(k, 20, 28 + i * 12, C1); g.text(t, 90, 28 + i * 12, C0); });
    g.text('CRACKED WALL OR A NOTE? FIRE!', 128, 114, C3, 'center');
    g.text('SPIKES SHOW? STEP OFF!', 128, 125, C3, 'center');
  }
}
// לפני כל קומה: שם הקומה ומשפט אווירה, על רקע המבט הראשון
const INTRO = [
  ['THE CASTLE CELLAR', 'COLD BRICKS AND OLD TORCHES.', 'SOMETHING SCRATCHES IN THE DARK.'],
  ['THE CAVES', 'WATER DRIPS FROM THE STONE.', 'A KEY WAS LOST HERE LONG AGO.'],
  ['THE OLD MINE', 'THE MINERS LEFT IN A HURRY.', 'NOBODY SAYS WHY.'],
  ['THE WIZARD LIBRARY', 'THE BOOKS ARE STILL WHISPERING.', 'ONE OF THEM IS AWAKE.'],
  ['THE DRAGON LAIR', 'THE AIR IS HOT. GOLD EVERYWHERE.', 'THE GOLDEN TAPE IS CLOSE.']
];
function drawIntro(g, s) {
  const [name, a, b] = INTRO[s.floor - 1];
  g.rect(20, 34, 216, 76, BLACK); g.rect(20, 34, 216, 1, C2); g.rect(20, 109, 216, 1, C2); g.rect(20, 34, 1, 76, C2); g.rect(235, 34, 1, 76, C2);
  g.text('FLOOR ' + s.floor, 128, 42, C3, 'center');
  g.text(name, 128, 54, C1, 'center', 2);
  g.text(a, 128, 76, C0, 'center'); g.text(b, 128, 88, C0, 'center');
  if ((s.t >> 4) % 2) g.text('ANY KEY TO GO ON', 128, 100, C2, 'center');
}
function drawTitle(g, s) {
  g.clear(BLACK);
  for (let i = 0; i < 60; i++) g.rect(hash(i, 1) * W, hash(i, 2) * 20 + (i % 2 ? 0 : 130), 1, 1, i % 3 ? C2 : C1);
  const p = s.titleP || 0;
  if (p === 0) {
    g.text('DRAGON', 128, 24, C3, 'center', 4);
    g.text('DEEP', 128, 56, C0, 'center', 4);
    g.text('THE DRAGON HAS TAKEN THE GOLDEN TAPE', 128, 96, C1, 'center');
    g.text('DOWN INTO THE DEEP. GO AND FIND IT.', 128, 108, C1, 'center');
  } else if (p === 1) {   // הסיפור המלא
    g.text('THE STORY', 128, 12, C3, 'center', 2);
    ['IN 1982 THE VERY FIRST TAPE', 'EVER MADE ON A DRAGON', 'WAS RECORDED IN GOLD.', '', 'LAST NIGHT THE OLD DRAGON WOKE,', 'TOOK THE GOLDEN TAPE AND WENT', 'DOWN, FIVE FLOORS UNDER THE CASTLE.', '', 'TAKE A TORCH AND A SWORD.', 'BRING IT BACK.']
      .forEach((t, i) => g.text(t, 128, 32 + i * 9, i < 3 ? C0 : i < 7 ? C1 : C3, 'center'));
  } else if (p === 2) {
    g.text('HOW TO PLAY', 128, 12, C3, 'center', 2);
    const L = [['UP', 'STEP FORWARD'], ['DOWN', 'STEP BACK - DODGE!'], ['LEFT RIGHT', 'TURN'], ['FIRE', 'STRIKE / GO DOWN'], ['P', 'MAP, BAG AND HELP'], ['ESC', 'LEAVE THE GAME']];
    L.forEach(([k, t], i) => { g.text(k, 30, 34 + i * 12, C1); g.text(t, 104, 34 + i * 12, C0); });
    g.text('IT FLASHES? STEP BACK!', 128, 110, C3, 'center');
  } else {
    g.text('MEET THE DEEP', 128, 12, C3, 'center', 2);
    const show = ['r', 'g', 'm', 'h', 'T'];
    show.forEach((k, i) => { const K = KINDS[k], x = 14 + i * 48; g.sprite(K.rows, x, 34 + (16 - K.rows.length) * 2, K.col(), false, 2); g.text(SHORT[k], x + 12, 74, C1, 'center'); });
    g.text('AND FIVE BOSSES...', 128, 92, C0, 'center');
    for (let i = 0; i < 5; i++) g.text('?', 64 + i * 32, 104, C2, 'center', 2);
  }
  if ((s.t >> 4) % 2) g.text('PRESS FIRE', 128, 122, C3, 'center', 2);
  g.text('LEFT RIGHT: ' + DIFF[s.diff ?? 1].name, 128, 140, s.diff === 2 ? C3 : C1, 'center');
  g.text('HIGH ' + s.high + '   DOWN: MORE', 128, 152, C2, 'center');
  if (s.save) g.text('UP: GO ON, FLOOR ' + s.save.floor + ', ' + DIFF[okDiff(s.save.diff)].name, 128, 166, C0, 'center');   // המשך = הרמה שנשמרה; ◀ ▶ רק למשחק חדש
  g.text('(C) 2026 GONEN YAROM', 128, 182, C2, 'center');
}
function drawEnd(g, s) {
  g.clear(BLACK);
  if (s.mode === 'next') {
    g.text('FLOOR ' + s.floor + ' CLEARED!', 128, 40, C1, 'center', 2);
    g.text('THE STAIRS LEAD DEEPER...', 128, 70, C0, 'center');
    const m = (s.lastTime / 60) | 0, sec = String(s.lastTime % 60).padStart(2, '0');
    g.text('TIME ' + m + ':' + sec + (s.speedBonus ? '   SPEED BONUS ' + s.speedBonus : ''), 128, 88, C1, 'center');
    if (s.secretsTotal) g.text('SECRETS ' + s.secrets + '/' + s.secretsTotal, 128, 100, s.secrets === s.secretsTotal ? C1 : C2, 'center');
    g.text('SCORE ' + s.score, 128, 118, C1, 'center', 2);
    if (s.t > 40 && (s.t >> 4) % 2) g.text('FIRE: DOWN TO FLOOR ' + (s.floor + 1), 128, 150, C2, 'center');
    return;
  }
  if (s.mode === 'won') {   // הסוף: קלטת הזהב חוזרת הביתה
    for (let i = 0; i < 50; i++) g.rect((i * 97) % W, (i * 53 + s.t) % H, 1, 1, i % 2 ? C1 : C3);
    g.text('THE DRAGON IS DEFEATED!', 128, 16, C3, 'center');
    g.sprite(TAPE, 101, 34, { 1: C1, 3: C3 }, false, 6);
    g.text('YOU BROUGHT BACK', 128, 78, C1, 'center', 2);
    g.text('THE GOLDEN TAPE!', 128, 96, C1, 'center', 2);
    if (s.trophies.length) g.text('KEEPSAKES: ' + s.trophies.length + ' X 300', 128, 140, C0, 'center');
    if ((s.diff ?? 1) !== 1) g.text(D(s).name + ' X' + D(s).mult + ' = ' + finalScore(s), 128, 150, C3, 'center');
  } else {
    g.text('THE DEEP', 128, 30, C3, 'center', 3);
    g.text('HAS WON', 128, 60, C3, 'center', 3);
    g.text('SCORE ' + s.score, 128, 100, C1, 'center', 2);
    if ((s.diff ?? 1) !== 1) g.text(D(s).name + ' X' + D(s).mult + ' = ' + finalScore(s), 128, 120, C3, 'center');
    if (s.t > 40) { g.text('FIRE: TRY FLOOR ' + s.floor + ' AGAIN', 128, 140, (s.t >> 4) % 2 ? C1 : C0, 'center'); g.text('DOWN: GIVE UP AND SAVE THE SCORE', 128, 156, C2, 'center'); }
    return;
  }
  g.text('SCORE ' + s.score, 128, 118, C1, 'center', 2);
  if (s.t > 40 && (s.t >> 4) % 2) g.text('PRESS FIRE', 128, 160, C2, 'center');
}
