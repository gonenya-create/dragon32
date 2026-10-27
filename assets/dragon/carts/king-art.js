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
export const CROC = [   // תנין: k גוף, t שיניים ובטן, e עין
  ['.......kk...', '......kekk..', 'kk..kkkkkkk.', 'kkkkkkkkkkkk', '.tttttttttt.'],
  ['.........kk.', '...k....kek.', '..ktk..kkkk.', 'k..t.kkkkkk.', 'kkk.kkkkkkk.', '.kkkttttttt.']
];
export const BIG_CROC_HEAD = [
  ['...kk...', '..kekk..', '.kkkkkkk', 'kkkkkkkk', 'tttttttt', '.k.k.k..'],
  ['..kk....', '.kekk...', 'kkkk.t.t', 'kkkkttt.', 'kkkk....', 'kkkkttt.', '.kkk.t.t']
];
export const FROG = [['e..e', 'kkkk', 'kttk', 'k..k'], ['e..e', 'kkkk', 'kttk', '.kk.', 'k..k']];
export const MOSQ = [['m.m', '.n.'], ['...', 'mnm']];
export const LILY = ['.kkkkk', 'kkkkkk'];
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
