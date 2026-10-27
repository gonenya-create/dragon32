// JUNGLE KING: הציורים, בסגנון PMODE 3 אמיתי (גונן, 27.10: ההשוואה היא ל-Donkey King של Microdeal על ה-Dragon).
// כל אות = פיקסל רחב (על המסך: 2 פיקסלים לרוחב, 1 לגובה). בכל מסך רק ארבעה צבעים, ואחד מהם הוא הרקע. אין שחור.
// האותיות הן תפקידים, והצבע של כל תפקיד נקבע לפי העולם (king.js, colors). נקודה = שקוף.

// ---------- PIP: h כובע ופנים, b שוליים ומגפיים, s חולצה, p מכנסיים, e עין (בצבע הרקע) ----------
const TOP = ['..hhhh..', '.hhhhhh.', 'bbbbbbbb', '..hehh..', '..hhhh..', '...hh...'];
export const PIP = {
  stand: [...TOP, '.ssssss.', 'hssssssh', 'h.ssss.h', '..ssss..', '..pppp..', '..pppp..', '..p..p..', '..p..p..', '.bb..bb.'],
  walk: [
    [...TOP, '.ssssss.', 'hssssss.', '..sssssh', '..ssss..', '..pppp..', '.pp..pp.', 'pp....pp', 'p......p', 'bb....bb'],
    [...TOP, '.ssssss.', '.hssssh.', '..ssss..', '..ssss..', '..pppp..', '...pp...', '..pp.p..', '..p..p..', '.bb.bb..'],
    [...TOP, '.ssssss.', '.sssssh.', 'h.sssss.', '..ssss..', '..pppp..', '.pp..pp.', 'pp....pp', 'p......p', 'bb....bb'],
    [...TOP, '.ssssss.', '.hssssh.', '..ssss..', '..ssss..', '..pppp..', '...pp...', '..p.pp..', '..p..p..', '..bb.bb.']
  ],
  jump: ['h.hhhh.h', 'hhhhhhhh', 'sbbbbbbs', 's.hehh.s', '.shhhhs.', '..ssss..', '..ssss..', '..ssss..', '..pppp..', '.pp..pp.', 'pp....pp', 'bb....bb', '........', '........', '........'],
  climb: [
    ['h......h', 'h.hhhh.h', 'hhhhhhhh', 'sbbbbbbs', '.shhhhs.', '..ssss..', '.ssssss.', '..ssss..', '..ssss..', '..pppp..', '..p..p..', '.pp..pp.', '.p....p.', '.b....b.', '........'],
    ['h......h', 'h.hhhh.h', 'hhhhhhhh', 'sbbbbbbs', '.shhhhs.', '..ssss..', '.ssssss.', '..ssss..', '..ssss..', '..pppp..', '..p..p..', '..p..pp.', '.pp...p.', '.b....b.', '........']
  ],
  swing: ['.....h..', '.....h..', '..hhhh..', '.hhhhhh.', 'bbbbbbbb', '..hehh..', '..hhhh..', '.sssss..', 'ssssss..', '..ssss..', '..pppp..', '.pp..pp.', 'pp....pp', 'bb....bb', '........'],
  hurt: ['........', '........', '.bb..bb.', '..p..p..', '..pppp..', '..ssss..', 'hssssssh', '.ssssss.', '...hh...', '..hhhh..', '..hhe...', 'bbbbbbbb', '.hhhhhh.', '..hhhh..', '........'],
  life: ['.hh.', 'bbbb', '.hh.', '.ss.']
};

// ---------- BIG BONGO, מנדריל מלך: f פרווה, c כתר ופנים, n אף אדום, e עין ----------
export const BONGO = [
  '...c.c.c.c...', '...ccccccc...', '..fffffffff..', '.ffccnnnccff.', '.fcecnnnecf..', '.fcccnnncccf.', '..fccnnnccf..', '...fcccccf...',
  'ff.fffffff.ff', 'f..ffcccff..f', 'c..ffcccff..c', '...fffffff...', '...ff...ff...', '..ccc...ccc..'
];
// הקוף-עוזר: f פרווה, c פנים, n פה, e עין
export const MONKEY = [
  ['.ffff...', 'fccccf..', 'fcecef..', 'fccccf.f', 'fcnncf.f', '.ffff.f.', 'ffccff..', 'f.cc.f..', '..ff....', '.f..f...', 'cc..cc..'],
  ['.ffff...', 'fccccf..', 'fcecef..', 'fccccf.f', 'fcnncf.f', '.ffff.f.', 'ffccfff.', '..cc....', '..ff....', '.f..f...', 'cc..cc..']
];

// ---------- חביות, חיות וחפצים ----------
export const BARREL = [
  ['..yyy..', '.yrrry.', 'yrryrry', 'yryrrry', 'yrrryry', 'yrryrry', '.yrrry.', '..yyy..'],
  ['..yyy..', '.yryry.', 'yrrrrry', 'yyyyyyy', 'yrrrrry', 'yrrrrry', '.yryry.', '..yyy..']
];
export const SNAKE = [['.......ss.', '......ses.', 's....ss.t.', 'ss..ss....', '.ssss.....'], ['.......ss.', '......ses.', '.....ss.t.', 's..sss....', '.sss......']];
export const SNAKE_UP = ['.ss.', 'sess', '.ss.', '.st.', '..s.', '.s..', '.s..', '..s.', '..s.', '.s..'];
export const MUSH = ['..rrrr..', '.rryrrr.', 'ryrrryrr', 'rrrrrrrr', '.r.r.r..', '...yy...', '...yy...', '..yyyy..'];
export const MUSH_SQ = ['........', '........', '..rrrr..', 'rryrrryr', 'rrrrrrrr', '.r.r.r..', '..yyyy..', '..yyyy..'];
export const TAPE = ['yyyyy', 'yryry', 'yyyyy'];
// תנין: k גוף, t שיניים ובטן, e עין. גב עם קשקשים, ראש מימין; כשהפה פתוח רואים שתי שורות שיניים אדומות (גונן: "מה יש במים? לא כל כך ברור")
export const CROC = [
  ['..k.k.k.k...', '.kkkkkkkkkk.', 'kkkkkkkkkkek', 'kkkkkkkkkkkk', '.ttttttttttt', '............'],
  ['..........k.', '..k.k.k..kek', '.kkkkkkkk.tt', 'kkkkkkkkk...', 'kkkkkkkkkttt', '.ttttttt....']
];
export const BIG_CROC_HEAD = [
  ['...kk...', '..kekk..', '.kkkkkkk', 'kkkkkkkk', 'tttttttt', '.k.k.k..'],
  ['..kk....', '.kekk...', 'kkkk.t.t', 'kkkkttt.', 'kkkk....', 'kkkkttt.', '.kkk.t.t']
];
// צפרדע: עיניים בולטות למעלה, רגליים מקופלות
export const FROG = [['.e..e.', 'kkkkkk', 'kkttkk', 'k.tt.k', 'kk..kk'], ['.e..e.', 'kkkkkk', '.kttk.', 'k....k', 'k....k', '......']];
export const MOSQ = [['m.m', '.n.'], ['...', 'mnm']];
// עלה לוטוס: עגול עם חריץ, ופרח אדום קטן
export const LILY = ['...f....', '.kk.kkk.', 'kkkkkkkk', '.kkkkkk.'];
export const LOG = ['.yyyyyyyyy.', 'yrryrrryrry', '.yyyyyyyyy.'];
export const BEETLE = ['...kkkk..', '.kkhkhkk.', 'kkhkkkhkk', 'kkkkkkkkr', '.k.k.k.k.'];
export const BIG_BARREL = ['..yyyy..', '.yrrrry.', 'yrrrrrry', 'yyyyyyyy', 'yrryrrry', 'yrryrrry', 'yyyyyyyy', 'yrrryrry', 'yrrryrry', 'yyyyyyyy', 'yrrrrrry', '.yrrrry.', '..yyyy..', '........'];
export const SPLASH = ['.c.c', 'c.c.', '.cc.'];

// ---------- אריחים: 4 פיקסלים רחבים על 8 שורות. r קליפה, y אור וטבעות, g טחב ----------
export const TILES = {
  // עולם השורשים (רקע כחול)
  root: [
    ['yy.y', 'rryr', 'rrrr', 'ryrr', 'rrrr', 'rrry', '.rr.', '....'],
    ['gyyy', 'rgrr', 'rrrr', 'rryr', 'rrrr', 'ryrr', 'rrrr', '.r..'],
    ['yyyg', 'rrrr', 'yrrr', 'rrrr', 'rryr', 'rrrr', '..r.', '....'],
    ['y.yy', 'ryrr', 'rrrr', 'rrry', 'rrrr', 'rrrr', 'r.rr', '..r.']
  ],
  rootEnd: ['..yy', '.yrr', 'yrry', 'rrrr', 'ryrr', '.rrr', '..r.', '....'],
  floor: [['yyyy', 'rrrr', 'ryrr', 'rrrr', 'rrry', 'rrrr', 'ryrr', 'rrrr'], ['ygyy', 'rrrr', 'rrry', 'rrrr', 'ryrr', 'rrrr', 'rrry', 'rrrr']],
  bark: [['rrrr', 'ryrr', 'ryrr', 'rrrr', 'rrrr', 'rrry', 'rrry', 'rrrr'], ['rrrr', 'rrrr', 'rryr', 'rryr', 'rrrr', 'yrrr', 'rrrr', 'rrrr']],
  barkDeep: [['rrrr', 'rrrr', 'ryrr', 'rrrr', 'rrrr', 'rrrr', 'rrrr', 'rrrr'], ['rrrr', 'rrrr', 'rrrr', 'rrrr', 'rrrr', 'rrry', 'rrrr', 'rrrr']],   // קיר עבה: כמעט רק קליפה, כדי שהפיר יבלוט
  // עולם הביצות (רקע ירוק): ענף אדום עם אור צהוב, גדה בוצית, מים כחולים
  branch: [['yyyy', 'rrrr', 'ryrr', 'rrrr', '.r.r', '....', '....', '....'], ['y.yy', 'rrrr', 'rrry', 'rrrr', 'r.r.', '....', '....', '....']],
  branchEnd: ['..yy', '.yrr', 'rrrr', 'rryr', '..r.', '....', '....', '....'],
  bankTop: ['yyyy', 'ryrr', 'rrrr', 'rrry', 'rrrr', 'yrrr', 'rrrr', 'rryr'],
  bank: ['rrrr', 'rrry', 'rrrr', 'yrrr', 'rrrr', 'rryr', 'rrrr', 'rrrr']
};

// ---------- ספרות זעירות (3×5) לשורת המצב, כמו ב-Donkey King ----------
export const TINY = {
  '0': ['yyy', 'y.y', 'y.y', 'y.y', 'yyy'], '1': ['.y.', 'yy.', '.y.', '.y.', 'yyy'], '2': ['yyy', '..y', 'yyy', 'y..', 'yyy'], '3': ['yyy', '..y', '.yy', '..y', 'yyy'],
  '4': ['y.y', 'y.y', 'yyy', '..y', '..y'], '5': ['yyy', 'y..', 'yyy', '..y', 'yyy'], '6': ['yyy', 'y..', 'yyy', 'y.y', 'yyy'], '7': ['yyy', '..y', '..y', '.y.', '.y.'],
  '8': ['yyy', 'y.y', 'yyy', 'y.y', 'yyy'], '9': ['yyy', 'y.y', 'yyy', '..y', 'yyy'], '-': ['...', '...', 'yyy', '...', '...'], ' ': ['...'],
  'T': ['yyy', '.y.', '.y.', '.y.', '.y.'], 'H': ['y.y', 'y.y', 'yyy', 'y.y', 'y.y'], 'U': ['y.y', 'y.y', 'y.y', 'y.y', 'yyy'], 'R': ['yy.', 'y.y', 'yy.', 'y.y', 'y.y'], 'Y': ['y.y', 'y.y', '.y.', '.y.', '.y.']
};

// ---------- עולם 3, הנהרות ----------
// דג קופץ: k גוף, f סנפירים וזנב, e עין. פונה ימינה
export const FISH = [
  ['..kkkk..f', '.kkkkkkff', 'kekkkkkf.', '.kkkkkkff', '..fkkf..f'],
  ['...kkk...', '.kkkkkk.f', 'kekkkkkff', '.kkkkkk.f', '...ff....']
];
// בונה: k פרווה, t שיניים וזנב שטוח, e עין. שתי תמונות: לעיסה
export const BEAVER = [
  ['..kkk...', '.kkekk..', 'kkkkkkt.', 'kkkkkk..', '.kkkkk..', 'kk..kktt', 'k...kttt'],
  ['..kkk...', '.kkekk..', 'kkkkkk.t', 'kkkkkkt.', '.kkkkk..', '.kk.kktt', 'kk..kttt']
];
// רפסודת חבית: חבית שוכבת על המים, עם חישוקים
export const RAFT = ['..yyyyyyyyyy..', '.yrryrrrryrry.', 'yrrryrrrryrrry', 'yrrryrrrryrrry', '.yrryrrrryrry.', '..yyyyyyyyyy..'];

// ---------- עולם 4, הכוורות ----------
// דבורה: k גוף, s פסים, w כנפיים (שתי תמונות של משק כנפיים)
export const BEE = [['.ww.', 'wwkks', '.kskk', '..k..'], ['....', '.kks', 'wkskk', 'ww.k.']].map(f => f.map(r => r.padEnd(5, '.')));
// מלכת הדבורים: גדולה, עם כתר
export const QUEEN = [
  ['....w.w.w.....', '....wwwww.....', '.ww.kkkkk.ww..', 'wwwkkeekkkwww.', 'ww.kkkkkkk.ww.', '...kssskkkk...', '...kkkkssskk..', '....kssskkkk..', '.....kkkk.kk..', '.......k....k.'],
  ['....w.w.w.....', '....wwwww.....', '....kkkkk.....', '.wwkkeekkkww..', 'wwwkkkkkkkwww.', 'ww.sssskkkk.w.', '...kkkkssskk..', '....kssskkkk..', '.....kkkk.kk..', '.......k....k.']
];
// צנצנת דבש: y דבש, r מכסה, b זכוכית
export const JAR = ['.rrr.', 'b...b', 'byyyb', 'byyyb', '.bbb.'];
// עציץ עשן
export const SMOKE_POT = ['.k.k..', '..k.k.', 'rrrrrr', '.rrrr.', '.rrrr.', '..rr..'];
export const DROP = ['y', 'y', 'y'];

// ---------- עולם 5, המערות ----------
// עטלף: תלוי (מקופל), ובמעוף (שתי תמונות של כנפיים). k גוף, w כנפיים, e עיניים
export const BAT_HANG = ['.kk.', 'wkkw', 'wekw', '.ww.', '..w.'];
export const BAT_FLY = [['w......w', 'ww.kk.ww', '.wkekww.', '...ww...'], ['........', '..wkkw..', 'wwkekkww', 'w......w']];
// נטיף: r סלע, y קצה
export const STALAC = ['rrr', 'rrr', '.r.', '.r.', '.y.'];
// לפיד: f להבה, y אור, r מקל
export const TORCH = [['.f.', 'fyf', '.y.', '.r.', '.r.', '.r.'], ['f..', 'yf.', '.yf', '.r.', '.r.', '.r.']];
export const WORM = ['yyy', 'g.g'];
// דוב ישן ודוב ער: k פרווה, t אף ובטן, e עין
export const BEAR = [
  ['....kk....kk..', '...kkkkkkkkkk.', '..kkkkkkkkkkkk', '.kkkkkkkkkkkkk', 'kkkkkkkkkkkttk', 'kkkkkkkkkkkkk.', '.kk.kk..kk.kk.'],
  ['..........kk.k', '.........kkkkk', '..kkkkkkkkekkt', '.kkkkkkkkkkktt', 'kkkkkkkkkkkkk.', 'kkkkkkkkkkkk..', 'kkkkkkkkkkkk..', '.kk..kk..kk...', '.kk..kk..kk...']
];

// ---------- עולם 6, ענפי הקופים ----------
export const COCONUT = ['.kk.', 'kktk', 'kkkk', '.kk.'];
// קוף גדול (השומרים של BONGO): f פרווה, c פנים, n פה, e עין
export const APE = [
  ['...ffff...', '..fccccf..', '..fcecef..', '..fcnncf..', 'ff.ffff.ff', 'f.ffccff.f', 'c.ffccff.c', '..ffffff..', '..ff..ff..', '..ff..ff..', '.ccc..ccc.'],
  ['...ffff...', '..fccccf..', '..fcecef..', 'f.fcnncf.f', 'ff.ffff.ff', '..ffccff..', '..ffccff..', '..ffffff..', '..ff..ff..', '.ff....ff.', 'ccc....ccc']
];
// ---------- עולם 7, הצמרת ----------
// תוכי: k גוף, w כנף, e עין, b מקור
export const PARROT = [['....kk..', '...kekb.', 'wwwkkkbb', '.wwkkk..', '...kk...', '...k.k..'], ['..ww.kk.', '.wwwkekb', '..wkkkbb', '...kkk..', '...kk...', '...k.k..']];
export const NEST = ['.k.kk.k.k.', 'kkkkkkkkkk', '.kkkkkkkk.'];
// BIG BONGO לקרב בצמרת: מנדריל עם כתר. f פרווה, c פנים וכתר, n אף, e עיניים
export const BIG_BONGO = [
  '....c.c.c.c.....', '....ccccccc.....', '....cfcfcfc.....', '...fffffffff....', '..fffcccccfff...', '..ffcccccccff...', '..fcecccccecf...', '..fccccnccccf...',
  '..fcccnnncccf...', '..ffccnnnccff...', '...fcccccccf....', '..fffcccccfff...', '.fffffffffffff..', 'ffffcfffffcffff.', 'fffccffffffccfff', 'ff.ccffffffcc.ff',
  'ff..cffffffc..ff', 'cc..ffffffff..cc', 'cc..ffffffff..cc', '....fff..fff....', '....fff..fff....', '...cccc..cccc...'
];
