// JUNGLE KING: הציורים. כל דמות וכל אריח מצוירים ביד, פיקסל אחרי פיקסל, בגודל אמיתי (גונן, 27.10: "נשקיע ונעשה את המקסימום").
// אותיות הצבע: 0 1 2 3 = ארבעת הצבעים של ערכת PMODE 3 של העולם, k = שחור, נקודה = שקוף.
// ערכה 1 (שורשים): 0 בז', 1 תכלת, 2 סגול, 3 כתום. ערכה 0 (ביצות): 0 ירוק, 1 צהוב, 2 כחול, 3 אדום.

// ---------- PIP ----------
// בשני העולמות PIP באותם צבעים לפי תפקיד: h כובע ופנים, b פס הכובע ומגפיים, s חולצה, p מכנסיים
export const PIP = {
  stand: ['....hhhh....', '...hhhhhh...', '..bbbbbbbb..', '.hhhhhhhhhh.', '....hhhh....', '....hhkh....', '....hhhh....', '.....hh.....',
    '...ssssss...', '..ssssssss..', '..hssssssh..', '..h.ssss.h..', '....ssss....', '...pppppp...', '...pp..pp...', '...pp..pp...', '...pp..pp...', '..bbb..bbb..'],
  walk: [
    ['....hhhh....', '...hhhhhh...', '..bbbbbbbb..', '.hhhhhhhhhh.', '....hhhh....', '....hhkh....', '....hhhh....', '.....hh.....',
      '...ssssss...', '..ssssssss..', '.hssssssss..', '.h..ssss.h..', '....ssss....', '...pppppp...', '..pp...pp...', '.pp.....pp..', '.pp......pp.', 'bbb......bbb'],
    ['....hhhh....', '...hhhhhh...', '..bbbbbbbb..', '.hhhhhhhhhh.', '....hhhh....', '....hhkh....', '....hhhh....', '.....hh.....',
      '...ssssss...', '..ssssssss..', '..ssssssssh.', '..h.ssss..h.', '....ssss....', '...pppppp...', '....pppp....', '....pp.pp...', '....pp.pp...', '...bbb.bbb..'],
    ['....hhhh....', '...hhhhhh...', '..bbbbbbbb..', '.hhhhhhhhhh.', '....hhhh....', '....hhkh....', '....hhhh....', '.....hh.....',
      '...ssssss...', '..ssssssss..', '..hssssssh..', '....ssss....', '....ssss....', '...pppppp...', '...pp.pp....', '...pp..pp...', '..pp...pp...', '..bbb.bbb...'],
    ['....hhhh....', '...hhhhhh...', '..bbbbbbbb..', '.hhhhhhhhhh.', '....hhhh....', '....hhkh....', '....hhhh....', '.....hh.....',
      '...ssssss...', '..ssssssss..', '..ssssssssh.', '.h..ssss....', '....ssss....', '...pppppp...', '....pppp....', '...pp..pp...', '...pp...pp..', '..bbb...bbb.']
  ],
  jump: ['.h..hhhh..h.', '.h.hhhhhh.h.', '.hbbbbbbbbh.', '.hhhhhhhhhh.', '.s..hhhh..s.', '.s..hhkh..s.', '.ss.hhhh.ss.', '..ssshhsss..',
    '...ssssss...', '...ssssss...', '...ssssss...', '...pppppp...', '..pp....pp..', '.pp......pp.', '.bb......bb.', '............', '............', '............'],
  climb: [
    ['.h........h.', '.h..hhhh..h.', '.h.hhhhhh.h.', '.sbbbbbbbbs.', '.shhhhhhhhs.', '..s.hhhh.s..', '...ssssss...', '...ssssss...',
      '..ssssssss..', '...ssssss...', '...ssssss...', '...pppppp...', '...pp..pp...', '...pp...pp..', '..pp....pp..', '..bb.....bb.'],
    ['.h........h.', '.h..hhhh..h.', '.h.hhhhhh.h.', '.sbbbbbbbbs.', '.shhhhhhhhs.', '..s.hhhh.s..', '...ssssss...', '...ssssss...',
      '..ssssssss..', '...ssssss...', '...ssssss...', '...pppppp...', '...pp..pp...', '..pp...pp...', '..pp....pp..', '.bb.....bb..']
  ],
  swing: ['.......h....', '.......h....', '...hhhhh....', '..hhhhhhh...', '.bbbbbbbb...', 'hhhhhhhhhh..', '...hhhh.....', '...hkhh.....',
    '...hhhh.....', '..sssss.....', '.ssssss.....', 'h.ssss......', '..ssss......', '..pppp......', '.pp..pp.....', 'pp....pp....', 'bb.....bb...'],
  hurt: ['............', '...hhhhhh...', '..bbbbbbbb..', '.hhhhhhhhhh.', '....hkkh....', '....hhhh....', '..h.hhhh.h..', '..hssssssh..',
    '...ssssss...', '...ssssss...', '...pppppp...', '..pp....pp..', '.pp......pp.', 'bb........bb', '............', '............', '............', '............'],
  life: ['.hhh.', 'bbbbb', '.hhh.', '.sss.', '.p.p.']
};

// ---------- BIG BONGO (מנדריל מלך) והקופים שלו ----------
export const BONGO = ['....y.y.y.y.....', '....yyyyyyy.....', '...ggggggggg....', '..ggbbrrrbbgg...', '..gbbkrrrkbbg...', '..gbbbrrrbbbg...', '..ggbbrrrbbgg...', '...gyyrrryyg....',
  '....yykkkyy.....', '.gggggyyyggggg..', 'gg.ggyyyyyygg.gg', 'g..ggyyyyyygg..g', 'y..gggyyyyggg..y', '...gggggggggg...', '...ggg....ggg...', '..yyy......yyy..'];
export const MONKEY = [
  ['...ffff.......', '..ffffff......', '.ffhhhhff.....', '.fhkhhkhf.....', '.fhhhhhhf.....', '..fhhkhf...ff.', '..ffffff..f..f',
    '.ffffffffff...', 'ff.fhhhfff....', 'f..fhhhff.....', '...ffffff.....', '...ff..ff.....', '..hhh..hhh....'],
  ['...ffff.......', '..ffffff......', '.ffhhhhff.....', '.fhkhhkhf.....', '.fhhhhhhf.....', '..fhkkhf...ff.', 'f.ffffff..f..f',
    'ffffffffff....', '...fhhhfff....', '...fhhhff.....', '...ffffff.....', '...ff..ff.....', '..hhh..hhh....']
];

// ---------- חביות, חיות וחפצים ----------
export const BARREL = [
  ['...hhhh...', '.hhsssshh.', '.hssssssp.', 'hhhhhhhhhh', 'hsspsssphh', 'hsspssssph', 'hhhhhhhhhh', '.hssssssp.', '.ppssssp..', '...pppp...'],
  ['...hhhh...', '.hhsssshh.', '.hhssssshh', 'hhssshhssh', 'hssshhsssh', 'hsshhssssh', 'hshhsssssh', '.hssssshh.', '.pppsshh..', '...pppp...'],
  ['...hhhh...', '.hhsssshh.', '.hpssssshh', 'hhhhhhhhhh', 'hpsssspssh', 'hpssssspsh', 'hhhhhhhhhh', '.hssssssh.', '..ppsspp..', '...pppp...'],
  ['...hhhh...', '.hhsssshh.', 'hhssssshh.', 'hsshhsssh.', 'hsssshhssh', 'hssssshhsh', 'hsssssshhh', '.hhsssssh.', '..hhsspp..', '...pppp...']
];
export const SNAKE = [
  ['...........ccc..', '..........ckckc.', 'c.........ccccc.', 'cc......ccc..r..', 'ccc...cccc......', '.cccccccch......', '..ccccc.........'],
  ['...........ccc..', '..........ckckc.', '..........ccccc.', 'c.......ccc..r..', 'cc....cccc......', '.ccccccccc......', '..cccccch.......']
];
export const SNAKE_UP = ['..ccc.', '.ckckc', '.ccccc', '..rcc.', '...cc.', '..cc..', '.cc...', '.cc...', '..cc..', '...cc.', '...cc.', '..cc..'];
export const MUSH = ['.....ffffff.....', '...fffhhfffff...', '..fffhhhfffhhf..', '.ffffffhhffffff.', 'fffhhfffffffhhff', 'ffffffffffffffff', '.f.f.f.f.f.f.f..', '......hhhh......', '......hkhh......', '.....hhhhhh.....'];
export const MUSH_SQ = ['................', '................', '................', '.....ffffff.....', '..ffffhhfffhhf..', 'ffhhffffffffhhff', 'ffffffffffffffff', '.f.f.f.f.f.f.f..', '.....hhkhhh.....', '....hhhhhhhh....'];
export const TAPE = ['bbbbbbbbbb', 'bhhhhhhhhb', 'bhkkhhkkhb', 'bhhhhhhhhb', 'bbbbbbbbbb'];
export const GLOW = ['.c.', 'ccc', '.c.'];
export const CROC = [   // תנין, פה סגור ופה פתוח. g ירוק, y שיניים ובטן, k עין
  ['............gggg........', '..........ggkggggg......', 'gg......ggggggggggggggg.', 'gggggggggggggggggggggggg', '.yyyyyyyyyyyyyyyyyyyyyy.', '..g...g...g...g...g.....'],
  ['................gggg....', '......ggg......ggkggg...', '.....gyyyg....ggggggg...', 'gg....y.y.ggggggggggg...', '.ggg...gggggggggggggggg.', '..ggggyyyyyyyyyyyyyyyy..', '...g...g...g...g...g....']
];
export const FROG = [['.k..k.', 'gggggg', 'gyyyyg', 'g.gg.g'], ['.k..k.', 'gggggg', 'gyyyyg', '.g..g.', 'g....g']];
export const MOSQ = [['b.b', '.r.'], ['...', 'brb']];
export const LILY = ['..gggggggg..', '.gggyggggggg', 'ggggggggg.gg', '.gggggggggg.'];
export const LOG = ['.yyyyyyyyyyyyyyyyyyyyy.', 'yrryrrrryrrrrryrrrrrryy', 'yrrrrryrrrrrryrrrryrrry', '.yyyyyyyyyyyyyyyyyyyyy.'];
export const BEETLE = ['.....ccccccc......', '...ccchhchhccc....', '..cchhhchhhhhcc...', '.cchhhhchhhhhhcc..', '.cchhhhchhhhhhccrr', 'cccccccccccccccckr', '.c.c.c.c.c.c.c.c..'];
export const BIG_BARREL = ['.....hhhhhh.....', '...hhssssssshh..', '..hssssssssssph.', '.hhhhhhhhhhhhhhh', 'hssspssssspssssh', 'hssspssssspssssh', 'hhhhhhhhhhhhhhhh', 'hsssspsssssspssh',
  'hsssspsssssspssh', 'hhhhhhhhhhhhhhhh', '.hssssssssssssh.', '..hssssssssssp..', '...ppssssssspp..', '.....pppppp.....'];
export const BIG_CROC_HEAD = [
  ['......gggg......', '....ggkggggg....', '..gggggggggggggg', 'gggggggggggggggg', 'yyyyyyyyyyyyyyy.', '.g...g...g...g..'],
  ['....gggg........', '..ggkgggg.......', '.gggggggg.y.y.y.', 'ggggggggyyyyyyy.', 'gggggggg........', 'ggggggggyyyyyyy.', '.ggggggg.y.y.y..']
];
export const SPLASH = ['.c...c.', 'c.c.c.c', '.c.c.c.', '..ccc..'];

// ---------- אריחים (8×8) ----------
export const TILES = {
  // עולם השורשים
  rootTop: [
    ['00000000', '03300303', '33333333', '33233323', '32333233', '33332333', '23323232', '2.2.2.2.'],
    ['00000000', '30330330', '33333333', '332kk333', '32k22k33', '332kk323', '32323232', '.2.2..2.'],
    ['00000000', '33003330', '33333333', '33333233', '23323333', '33233332', '32232323', '2..2.2.2']
  ],
  rootEnd: ['...00000', '..033033', '.0333333', '03332333', '03233323', '.3332333', '..232323', '...2.2.2'],
  rootBody: ['32323232', '23232323', '32k23232', '2323k323', '3232k232', '23232323', '.2.2.2.2', '2.2.2.2.'],
  bark: [
    ['3..3k3.3', '3k3..3.3', '.3k3k3..', '03..3k30', '3k3.3..3', '.3k3k3.3', '3k3..303', '3.33k3..'],
    ['33k3.3.3', '3..3k3.3', '3k30k..3', '.2k3k3.3', '3k3..303', '3.32k3.3', '.3k3k3.3', '03k3..33']
  ],
  // עולם הביצות
  branchTop: [
    ['11111111', '10011001', '00000000', '00300000', '00000300', '0.0.0.0.', '.0...0..', '........'],
    ['11111111', '01100110', '00000000', '00000030', '03000000', '.0.0.0.0', '..0...0.', '........']
  ],
  branchEnd: ['...11111', '..100110', '.0000000', '00003000', '.0000000', '..0.0.0.', '........', '........'],
  mudTop: ['11111111', '00100010', '0.0.0.0.', '.0.0.0.0', '0.0.0.0.', '.0.0.0.0', '0.0.0.0.', '.0.0.0.0'],
  mud: ['0.0.0.0.', '.0.0.0.0', '0.0.2.0.', '.0.0.0.0', '0.0.0.0.', '.2.0.0.0', '0.0.0.0.', '.0.0.0.0']
};
