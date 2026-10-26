// מדף קלטות במכונת ה-Dragon: אותן תוכניות BASIC כמו באפליקציה, על קלטות שהמכונה עצמה שמרה עם CSAVE
// (lab/1982/tapes, בפורמט המכווץ של המחשב). הקלטת נכנסת לרשמקול של XRoar, המקלדת מקלידה CLOAD, וכשעל המסך מופיע OK, גם RUN.
(function () {
  const EN = document.documentElement.lang === 'en';
  const TAPES = [
    ['guess', 'נחש את המספר', 'Guess the number'],
    ['lander', 'נחיתה על הירח', 'Moon lander'],
    ['quiz', 'חידון חשבון', 'Maths quiz'],
    ['rps', 'אבן, נייר, מספריים', 'Rock, paper, scissors'],
    ['cave', 'מערת הדרקון', 'Dragon cave'],
    ['draw', 'ציור על המסך', 'Screen drawing'],
    ['derby', 'מרוץ סוסים', 'Horse race'],
    // שפת מכונה (CLOADM ואז EXEC): נבנה מ-games/eggs (node games/eggs/build.mjs)
    ['eggs', 'ביצי הדרקון', 'Dragon Eggs', 'm',
      ['Gonen Yarom, 2026', 'https://github.com/gonenya-create/dragon32/tree/main/games/eggs', null]],
    // משחקים של אחרים, באישור המחבר ועם קרדיט (CLAUDE.md). 'a' = שפת מכונה שמתחילה לבד אחרי CLOADM.
    // [מחבר, תיעוד (חובה לפי הרישיון), אתר המחבר או קוד המקור, רישיון נפרד אם יש]
    ['blockdown', 'Blockdown', 'Blockdown', 'a',
      ['Ciaran Anscomb, 2021', '/lab/1982/tapes/blockdown.html', 'https://www.6809.org.uk/blockdown/']],
    ['dragontet', 'DragonTet', 'DragonTet', 'm',
      ['Salva Kantero, 2025', '/lab/1982/tapes/dragontet-readme.txt', 'https://github.com/salvakantero/Dragontet', '/lab/1982/tapes/dragontet-license.txt']],
    // משחקי Ken Kalish: הוא רצה שהמשחקים שלו יהיו זמינים לכולם (L. Curtis Boyle, מייל 24.10.2026). קרדיט מלא, יורד לפי בקשה
    ['phantom', 'Phantom Slayer', 'Phantom Slayer', 'm',
      ['Ken Kalish · Med Systems / Microdeal, 1983', 'http://www.lcurtisboyle.com/nitros9/interview.html', null, null, 'kalish']],
    ['ranger', 'Danger Ranger', 'Danger Ranger', 'a',
      ['Ken Kalish · Med Systems / Microdeal, 1983', 'http://www.lcurtisboyle.com/nitros9/interview.html', null, null, 'kalish']],
    // ההרפתקאות של Scott Adams: אישור בכתב (מייל 25.10.2026). קרדיט מלא וקישור ל-msadams.com, בלי שינויים, יורד לפי בקשה
    ['adventureland', 'Adventureland', 'Adventureland', 'a',
      ['Scott Adams · Adventure International, 1983', 'https://www.msadams.com/', null, null, 'adams']],
    ['pirate', 'Pirate Adventure', 'Pirate Adventure', 'a',
      ['Scott Adams · Adventure International, 1984', 'https://www.msadams.com/', null, null, 'adams']],
    ['mission', 'Secret Mission', 'Secret Mission', 'a',
      ['Scott Adams · Adventure International', 'https://www.msadams.com/', null, null, 'adams']]
  ];
  // משחקים שצריכים ג'ויסטיק: כשהקלטת נטענת, החיצים במקלדת הופכים לג'ויסטיק הימני ו-Alt (Option במק) לכפתור שלו
  const JOY = new Set(['ranger']);
  function setJoy(on) {
    try { Module.ccall('wasm_set_joystick_by_name', null, ['number', 'string'], [0, on ? 'kjoy0' : '']); } catch (e) {}
  }
  // כל קלטת שנכנסת לרשמקול: ג'ויסטיק מהמקלדת רק למשחקי ג'ויסטיק, ולוח המשחק לטלפון (joypad.js) רק למשחקים שיש להם מקשים שם
  function gameKeys(id) {
    setJoy(JOY.has(id));
    if (window.d32Pad) window.d32Pad(id);
  }
  // איך משחקים (גונן, 25.10: "לא בטוח שהמשתמשים יבינו איך משחקים"): תיבה נפתחת מתחת לכל משחק בשפת מכונה.
  // [מקש] נהיה מקש מצויר. המקשים לפי התיעוד של המחבר, ונבדקו במכונה. במק: BREAK הוא Esc, ו-CLEAR הוא Home (fn+←).
  const HOWTO = {
    eggs: {
      he: ['מתחילים ב[רווח], או בכפתור של ג\'ויסטיק ימני.',
        '[←] [→] מזיזים את הסל. תופסים את הביצים, אבל לא את כדורי האש.',
        'ביצה שנשברת על האדמה, או אש בסל, עולות לב. יש 3 לבבות.',
        'יציאה: [BREAK] (במק: [Esc]).'],
      en: ['Start with [SPACE], or the right joystick\'s button.',
        '[←] [→] move the basket. Catch the eggs, but not the fireballs.',
        'An egg that breaks on the ground, or fire in the basket, costs a heart. You have 3.',
        'Quit: [BREAK] (on a Mac: [Esc]).']
    },
    blockdown: {
      he: ['מתחילים ב[רווח]. במסך הפתיחה [←] [→] מחליפים מסכים, ושם בוחרים שחקן אחד או שניים.',
        '[Z] [C] שמאלה וימינה. [S] או [1] מסובבים. [X] מוריד מהר, [3] מפיל, [2] שומר חלק בצד.',
        'שחקן שני: [M] [>] זזים, [K] או [7] מסובבים, [<] מוריד, [9] מפיל, [8] שומר.',
        'הפסקה: [CLEAR]+[ENTER], ו[רווח] ממשיך. סיום משחק: [CLEAR]+[BREAK] (במק: [Home]+[Esc]).'],
      en: ['Start with [SPACE]. On the title screens, [←] [→] switch pages; one or two players is chosen there.',
        '[Z] [C] move. [S] or [1] turn. [X] soft drop, [3] hard drop, [2] hold a piece.',
        'Player two: [M] [>] move, [K] or [7] turn, [<] soft drop, [9] hard drop, [8] hold.',
        'Pause: [CLEAR]+[ENTER], [SPACE] resumes. End the game: [CLEAR]+[BREAK] (on a Mac: [Home]+[Esc]).']
    },
    dragontet: {
      he: ['בתפריט בוחרים ב[↑] [↓] ומאשרים ב[ENTER].',
        '[←] [→] מזיזים, [↑] מסובב, [↓] מוריד מהר. אפשר גם [W] [A] [S] [D].',
        'שחקן שני: [I] [J] [K] [L].',
        '[H] עוצר, וכל מקש ממשיך. [X] יוצא לתפריט.'],
      en: ['In the menu, choose with [↑] [↓] and confirm with [ENTER].',
        '[←] [→] move, [↑] turns, [↓] drops faster. [W] [A] [S] [D] work too.',
        'Player two: [I] [J] [K] [L].',
        '[H] pauses, any key resumes. [X] goes back to the menu.']
    },
    // נבדק במכונה (25.10): בחירות, תנועה, כיוון וירי, רוחות שזזות, וסוף משחק עם הניקוד
    phantom: {
      he: ['אחרי הטעינה: [N] מדלג על ההוראות, [Y] מציג אותן (באנגלית). המשחק מתחיל בהדגמה, ואז מגיע מסך הבחירה.',
        'במסך SELECT MAZE TYPE: [1] מבוך פתוח, [2] מבוך צפוף. אם המקש לא נקלט, לוחצים שוב.',
        'במסך SELECT SPEED: [1] [2] [3] מהירות הרוחות, או [T] לאימון בלי רוחות. אחרי מנגינה קצרה מופיעה מפת המבוך.',
        '[↑] צעד קדימה, [↓] צעד אחורה, [←] [→] מסתובבים.',
        'מחזיקים [רווח] כדי לכוון, ומשחררים כדי לירות. האקדח נטען כ-2 שניות.',
        '[1] עד [6] קובעים את טווח גלאי הרוחות, שמצפצף כשרוח קרובה. רוח שנוגעת בכם, המשחק נגמר.'],
      en: ['After loading: [N] skips the instructions, [Y] shows them. A demo plays first, then the choices appear.',
        'At SELECT MAZE TYPE: [1] open maze, [2] dense maze. If a key is missed, press it again.',
        'At SELECT SPEED: [1] [2] [3] phantom speed, or [T] to practise without phantoms. A short tune plays, then the maze map.',
        '[↑] step forward, [↓] step back, [←] [→] turn.',
        'Hold [SPACE] to aim, release to fire. The pistol takes about 2 seconds to recharge.',
        '[1]–[6] set the phantom detector range; it beeps when one is near. If a phantom touches you, the game is over.']
    },
    // נבדק במכונה (25.10): צבע, רמה, ריצה, קפיצה, ירי, ניקוד, סוף משחק ושיא
    ranger: {
      he: ['במשחק הזה החיצים הם ג\'ויסטיק, ו-[Alt] הוא הכפתור שלו (במק: [Option]). בטלפון יש מתחת למסך ידית וכפתור אש.',
        'הטעינה ארוכה, כשלוש דקות, וכשהיא נגמרת המשחק מתחיל לבד. בוחרים צבע רקע: [1] שחור, [2] בהיר, [3] ירוק.',
        'במסך הפתיחה לוחצים [Alt]. ב-SELECT LEVEL בוחרים שלב, [1] הכי קל, והמשחק מתחיל מיד. לא לוחצים [P], כי הוא עוצר את המשחק.',
        '[←] [→] רצים, [↑] קופצים, [↓] מתכופפים, [Alt] יורה. [P] עוצר, ו-[Alt] ממשיך.',
        'אוספים את כל המפתחות ונזהרים מהעטלפים ומהעיניים שיורות מהצדדים. הכרית באמצע הקומה התחתונה מקפיצה חזרה למעלה.'],
      en: ['In this game the arrow keys are a joystick and [Alt] is its button ([Option] on a Mac). On a phone there is a stick and a fire button under the screen.',
        'Loading takes about three minutes, and the game starts by itself when it ends. Pick a background colour: [1] black, [2] buff, [3] green.',
        'On the title screen press [Alt]. At SELECT LEVEL pick a level, [1] is the easiest, and the game starts at once. Don\'t press [P]: it pauses the game.',
        '[←] [→] run, [↑] jump, [↓] duck, [Alt] fires. [P] pauses, and [Alt] carries on.',
        'Collect all the keys and watch out for the bats and the eyes that shoot from the sides. The pad in the middle of the bottom floor bounces you back to the top.']
    },
    // נבדק במכונה (25.10): טעינה, שאלות הפתיחה, תנועה בין מקומות, טיפוס, מלאי וניקוד
    adventureland: {
      he: ['הטעינה לוקחת קצת פחות משתי דקות, והמשחק מתחיל לבד.',
        'בהתחלה שלוש שאלות. על {DO YOU HAVE LOWERCASE?} עונים [N] ו[ENTER].',
        'על {PRESS ENTER} לוחצים [ENTER], ועל {RESTORE A PREVIOUSLY SAVED GAME?} עונים [N] ו[ENTER].',
        'משחק מילים באנגלית: כותבים פועל ושם עצם ולוחצים [ENTER]. למשל {CLIMB TREE} (לטפס על העץ), {GET AXE} (להרים את הגרזן), {LIGHT LAMP} (להדליק את המנורה).',
        'שלוש האותיות הראשונות מספיקות: {LIG LAM}. הולכים בשש דרכים: {N S E W UP DOWN} (צפון, דרום, מזרח, מערב, למעלה, למטה).',
        '{LOOK} מתאר שוב את המקום, {INVENTORY} מראה מה בידיים, {HELP} נותן רמז, {SCORE} מראה כמה אוצרות נאספו.',
        'המטרה: למצוא 13 אוצרות, שמסומנים בכוכביות כמו {*GOLDEN FISH*}, ולהביא אותם למקום שבו שומרים אותם.'],
      en: ['Loading takes a little under two minutes, and the game starts by itself.',
        'Three questions first. At DO YOU HAVE LOWERCASE? answer [N] and [ENTER].',
        'At PRESS ENTER press [ENTER], and at RESTORE A PREVIOUSLY SAVED GAME? answer [N] and [ENTER].',
        'A word game: type a verb and a noun, then [ENTER]. For example CLIMB TREE, GET AXE, LIGHT LAMP.',
        'The first three letters are enough: LIG LAM. There are six ways to go: N S E W UP DOWN.',
        'LOOK describes the place again, INVENTORY shows what you carry, HELP gives a hint, SCORE shows your treasures.',
        'The goal: find the 13 treasures, marked with stars like *GOLDEN FISH*, and bring them to where they are stored.']
    },
    // נבדק במכונה (26.10): טעינה, שאלות הפתיחה, הרמת חפץ, מלאי, עלייה במדרגות, HELP וניקוד
    pirate: {
      he: ['הטעינה לוקחת קצת פחות משתי דקות, והמשחק מתחיל לבד.',
        'בהתחלה שלוש שאלות. על {DO YOU HAVE LOWERCASE?} עונים [N] ו[ENTER].',
        'על {PRESS ENTER} לוחצים [ENTER], ועל {RESTORE A PREVIOUSLY SAVED GAME?} עונים [N] ו[ENTER].',
        'מתחילים בדירה בלונדון. כותבים פועל ושם עצם באנגלית ולוחצים [ENTER]. למשל {GET RUM} (לקחת את הרום), או {GO STAIRS} (לעלות במדרגות).',
        'שלוש האותיות הראשונות מספיקות. הולכים בשש דרכים: {N S E W UP DOWN}.',
        '{LOOK} מתאר שוב את המקום, {INVENTORY} מראה מה בידיים, {HELP} נותן רמז, {SCORE} מראה כמה אוצרות נאספו.',
        'המטרה: להגיע לאי של הפיראטים, למצוא את האוצרות ולהביא אותם לדירה, כמו שכתוב על השלט שם.'],
      en: ['Loading takes a little under two minutes, and the game starts by itself.',
        'Three questions first. At DO YOU HAVE LOWERCASE? answer [N] and [ENTER].',
        'At PRESS ENTER press [ENTER], and at RESTORE A PREVIOUSLY SAVED GAME? answer [N] and [ENTER].',
        'You start in a flat in London. Type a verb and a noun, then [ENTER]. For example GET RUM or GO STAIRS.',
        'The first three letters are enough. There are six ways to go: N S E W UP DOWN.',
        'LOOK describes the place again, INVENTORY shows what you carry, HELP gives a hint, SCORE shows your treasures.',
        'The goal: reach the pirates\' island, find the treasures and bring them back to the flat, as the sign there says.']
    },
    // נבדק במכונה (26.10): טעינה, שאלות הפתיחה, מלאי, HELP, תנועה למסדרון, LOOK ו-SCORE
    mission: {
      he: ['הטעינה לוקחת קצת פחות משתי דקות, והמשחק מתחיל לבד.',
        'בהתחלה שלוש שאלות. על {DO YOU HAVE LOWERCASE?} עונים [N] ו[ENTER].',
        'על {PRESS ENTER} לוחצים [ENTER], ועל {RESTORE A PREVIOUSLY SAVED GAME?} עונים [N] ו[ENTER].',
        'אתם סוכן חשאי בכור גרעיני אוטומטי, ומישהו הטמין בו פצצת זמן. מתחילים בחדר תדריך.',
        'כותבים פועל ושם עצם באנגלית ולוחצים [ENTER]. למשל {GO WEST} (ללכת מערבה). שלוש האותיות הראשונות מספיקות. הולכים בשש דרכים: {N S E W UP DOWN}.',
        '{LOOK} מתאר שוב את המקום, {INVENTORY} מראה מה בידיים, ו-{HELP} נותן רמז. כאן אין ניקוד: או שמצליחים, או ש...',
        'יש לחץ של זמן: אל תתעכבו. הגלאי שבידיים זוהר בירוק כל עוד הפצצה לא עומדת להתפוצץ.'],
      en: ['Loading takes a little under two minutes, and the game starts by itself.',
        'Three questions first. At DO YOU HAVE LOWERCASE? answer [N] and [ENTER].',
        'At PRESS ENTER press [ENTER], and at RESTORE A PREVIOUSLY SAVED GAME? answer [N] and [ENTER].',
        'You are a secret agent in an automated nuclear reactor, and someone has planted a time bomb. You start in a briefing room.',
        'Type a verb and a noun, then [ENTER]. For example GO WEST. The first three letters are enough. There are six ways to go: N S E W UP DOWN.',
        'LOOK describes the place again, INVENTORY shows what you carry, and HELP gives a hint. There is no score here: either you make it, or...',
        'Time is short, so don\'t dawdle. The detector you carry glows green while the bomb is still safe.']
    }
  };
  // מה המשחק, בשורה אחת מתחת לשם (גונן, 25.10: "לא מבינים מה זה המשחק"). השם עצמו נשאר כמו שהמחבר כתב
  const DESC = {
    eggs: ['תופסים בסל את הביצים שהדרקון מטיל. לשחקן אחד.', 'Catch the dragon\'s eggs in a basket. 1 player.'],
    blockdown: ['קוביות נופלות: משלימים שורות. לשחקן אחד או לשניים.', 'Falling blocks: complete the lines. 1 or 2 players.'],
    dragontet: ['קוביות נופלות: משלימים שורות. לשחקן אחד או לשניים.', 'Falling blocks: complete the lines. 1 or 2 players.'],
    phantom: ['מבוך תלת-ממדי: צדים רוחות רפאים לפני שהן תופסות אתכם. לשחקן אחד.', '3D maze: hunt the phantoms before they catch you. 1 player.'],
    ranger: ['רצים, קופצים ויורים: אוספים מפתחות ואוצרות בין עטלפים ועיניים. בג\'ויסטיק.', 'Run, jump and shoot: collect keys and treasure past bats and eyes. Joystick.'],
    mission: ['הרפתקת מילים: סוכן חשאי צריך לעצור פצצת זמן בכור גרעיני. ההרפתקה השלישית של Scott Adams.', 'A text adventure: a secret agent must stop a time bomb in a nuclear reactor. Scott Adams\' third adventure.'],
    pirate: ['הרפתקת מילים: מדירה בלונדון לאי של פיראטים, בחיפוש אחרי אוצר. ההרפתקה השנייה של Scott Adams.', 'A text adventure: from a London flat to a pirates\' island, hunting for treasure. Scott Adams\' second adventure.'],
    adventureland: ['הרפתקת מילים: כותבים פקודות באנגלית ומחפשים 13 אוצרות. ההרפתקה הראשונה של Scott Adams.', 'A text adventure: type commands and hunt for 13 treasures. Scott Adams\' first adventure.']
  };
  // שורה עם [מקשים]: כל מקש בתוך kbd. צירוף כמו [CLEAR]+[BREAK] נשאר יחד בשורה אחת
  function key(name) {
    const k = document.createElement('kbd');
    k.textContent = name === 'רווח' && EN ? 'SPACE' : name;
    if (/[\u0590-\u05ff]/.test(k.textContent)) k.className = 'he';
    return k;
  }
  function keyLine(text) {
    const li = document.createElement('li');
    for (const part of text.split(/((?:\[[^\]]+\]\+)*\[[^\]]+\]|\{[^}]+\})/)) {
      if (!part) continue;
      if (part[0] === '{') {   // {GET AXE}: פקודה באנגלית, נשארת שלמה ובסדר שלה גם בשורה בעברית
        const en = document.createElement('bdi');
        en.dir = 'ltr';
        en.className = 'cmd';
        en.textContent = part.slice(1, -1);
        li.append(en);
        continue;
      }
      if (part[0] !== '[') { li.append(part); continue; }
      const keys = part.slice(1, -1).split(']+[');
      if (keys.length === 1) { li.append(key(keys[0])); continue; }
      const combo = document.createElement('span');
      combo.className = 'combo';
      combo.dir = EN ? 'ltr' : 'rtl'; // בעברית קוראים מימין: קודם CLEAR ואז BREAK
      keys.forEach((n, i) => { if (i) combo.append('+'); combo.append(key(n)); });
      li.append(combo);
    }
    return li;
  }
  // בלוק בקלטת: 55 3C סוג אורך נתונים סכום 55
  function block(type, data) {
    let sum = type + data.length;
    for (const b of data) sum += b;
    return [0x55, 0x3c, type, data.length, ...data, sum & 255, 0x55];
  }
  const box = document.getElementById('tapes');
  const status = document.getElementById('tape-status');
  if (!box) return;
  // ארון הקלטות (גונן, 24.10: "ככל שיהיו יותר משחקים אי אפשר יהיה להציג את כולם"): מגירה לכל סוג,
  // עם מספר הקלטות, ונפתחת בלחיצה. מה פתוח נזכר בדפדפן הזה. המגירה של "הקלטות שלי" כתובה בדף עצמו.
  const DRAWERS = [['basic', 'תוכניות BASIC', 'BASIC programs'], ['mc', 'משחקים בשפת מכונה', 'Machine-code games'], ['adv', 'משחקי הרפתקאות', 'Adventure games']];
  // הרפתקאות המילים במגירה משלהן (גונן, 26.10: "קטגוריית משחקי הרפתקאות"). הן עדיין קלטות של שפת מכונה
  const ADV = new Set(['adventureland', 'pirate', 'mission']);
  const drawerOf = t => ADV.has(t[0]) ? 'adv' : t[3] ? 'mc' : 'basic';
  const DKEY = 'd32-lab-drawers';
  let drawerState = {};
  try { drawerState = JSON.parse(localStorage.getItem(DKEY)) || {}; } catch (e) {}
  const remember = d => d.addEventListener('toggle', () => {
    drawerState[d.dataset.drawer] = d.open;
    try { localStorage.setItem(DKEY, JSON.stringify(drawerState)); } catch (e) {}
  });
  const grids = {};
  for (const [key, he, en] of DRAWERS) {
    const d = document.createElement('details');
    d.className = 'drawer';
    d.dataset.drawer = key;
    d.open = !!drawerState[key]; // סגורות בכניסה הראשונה (גונן, 25.10), ונזכרות אחר כך
    d.innerHTML = '<summary><span class="drawer-name"></span> <span class="drawer-count"></span></summary><div class="drawer-body"><div class="tapes"></div></div>';
    d.querySelector('.drawer-name').textContent = EN ? en : he;
    d.querySelector('.drawer-count').textContent = TAPES.filter(t => drawerOf(t) === key).length;
    grids[key] = d.querySelector('.tapes');
    remember(d);
    box.appendChild(d);
  }
  // עוד משחק טוב שלא על המדף: ב-Dunjunz יש חלקים מהמשחק המקורי של Bug-Byte בלי רשות, אז רק קישור לאתר של המחבר
  {
    const more = document.createElement('p');
    more.className = 'tape-credit drawer-more';
    const a = document.createElement('a');
    a.href = 'https://www.6809.org.uk/dunjunz/';
    a.rel = 'noopener';
    a.textContent = 'Dunjunz';
    more.append(EN ? 'More to play: ' : 'עוד משחק: ', a, EN ? ' by Ciaran Anscomb, on his own site.' : ' של Ciaran Anscomb, באתר שלו.');
    grids.mc.after(more);
  }
  const mineDrawer = document.getElementById('drawer-mine');
  if (mineDrawer) { if ('mine' in drawerState) mineDrawer.open = drawerState.mine; remember(mineDrawer); }
  const openDrawerOf = b => { const d = b && b.closest('details.drawer'); if (d) d.open = true; };
  const buttons = [];
  for (const t of TAPES) {
    const [id, he, en, kind, credit] = t;
    const shelf = grids[drawerOf(t)];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tape';
    b.innerHTML = '<span></span><small dir="ltr"></small>';
    b.querySelector('span').textContent = EN ? en : he;
    b.querySelector('small').textContent = id.toUpperCase() + (kind ? ' · CLOADM' : '');
    if (DESC[id]) {
      const t = document.createElement('span');
      t.className = 'tape-desc';
      t.textContent = DESC[id][EN ? 1 : 0];
      b.querySelector('small').before(t);
    }
    b.addEventListener('click', () => load(id, EN ? en : he, b, false, kind));
    buttons.push(b);
    if (!credit) { shelf.appendChild(b); continue; }
    // קרדיט: מי כתב, התיעוד והרישיון שלו, והאתר שלו
    const wrap = document.createElement('div');
    wrap.className = 'tape-box';
    const by = document.createElement('p');
    by.className = 'tape-credit';
    const docs = document.createElement('a'), site = document.createElement('a');
    docs.href = credit[1];
    docs.textContent = credit[3] ? (EN ? 'docs' : 'תיעוד') : (EN ? 'docs & licence' : 'תיעוד ורישיון');
    site.href = credit[2];
    site.textContent = credit[3] ? (EN ? 'source code' : 'קוד המקור') : (EN ? 'author' : 'המחבר');
    site.rel = 'noopener';
    const who = document.createElement('bdi');
    who.textContent = credit[0];
    if (!credit[2]) docs.textContent = EN ? 'source code' : 'קוד המקור';
    if (credit[4] === 'kalish') {
      // בלי תיעוד ורישיון: הרשות מהמחבר, והקישור לראיון שבו הוא אומר שירצה שישחקו בהם שוב
      docs.textContent = EN ? 'with his permission' : 'באישורו';
      docs.rel = 'noopener';
      by.append(EN ? 'By ' : 'מאת ', who, document.createElement('br'), docs, EN ? ' · removed on request' : ' · יוסר לפי בקשה');
    } else if (credit[4] === 'adams') {
      // הרשות של Scott Adams: קרדיט מלא וקישור לאתר שלו
      docs.textContent = 'msadams.com';
      docs.rel = 'noopener';
      by.append(EN ? 'By ' : 'מאת ', who, document.createElement('br'), EN ? 'With his permission · ' : 'באישורו · ', docs, EN ? ' · removed on request' : ' · יוסר לפי בקשה');
    } else by.append(EN ? 'By ' : 'מאת ', who, document.createElement('br'), docs);
    if (credit[2]) by.append(' · ', site);
    if (credit[3]) {
      const lic = document.createElement('a');
      lic.href = credit[3];
      lic.textContent = 'GPL v3';
      by.append(' · ', lic);
    }
    wrap.append(b, by);
    const how = HOWTO[id];
    if (how) {
      const d = document.createElement('details');
      d.className = 'howto';
      const sm = document.createElement('summary');
      sm.textContent = EN ? 'How to play' : 'איך משחקים';
      const ul = document.createElement('ul');
      for (const line of EN ? how.en : how.he) ul.appendChild(keyLine(line));
      const always = document.createElement('li');
      always.className = 'howto-always';
      always.textContent = EN ? 'Stuck? Reloading the page always restarts the computer.' : 'נתקעתם? טעינה מחדש של הדף תמיד מפעילה את המחשב מחדש.';
      ul.appendChild(always);
      d.append(sm, ul);
      wrap.appendChild(d);
    }
    shelf.appendChild(wrap);
  }
  // הגיעו מהאפליקציה עם ?tape=guess: הקלטת נטענת לבד, ברגע שהמחשב מוכן
  const want = new URLSearchParams(location.search).get('tape');
  const wanted = TAPES.findIndex(t => t[0] === want);
  if (wanted >= 0) {
    const go = setInterval(() => {
      if (!window.d32Ready) return;
      clearInterval(go);
      openDrawerOf(buttons[wanted]);
      setTimeout(() => load(TAPES[wanted][0], EN ? TAPES[wanted][2] : TAPES[wanted][1], buttons[wanted], true, TAPES[wanted][3]), 2000);
    }, 300);
  }
  let busy = false;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  // זיכרון המחשב המדומה נמצא בתוך הזיכרון של XRoar. מוצאים אותו פעם אחת לפי שורת הפתיחה שעל המסך
  // (המסך מתחיל ב-$0400), וכך אפשר לקרוא מה כתוב על המסך ולדעת מתי הטעינה נגמרה
  const scr = c => { const n = c.charCodeAt(0); return n >= 0x40 ? n : n + 0x40; };
  let ram = -1;
  function findRam() {
    if (ram >= 0 || typeof HEAPU8 === 'undefined') return ram;
    const sig = [...'DRAGON 1982 BASIC'].map(scr), h = HEAPU8;
    for (let i = 0x400; i < h.length - sig.length; i++) {
      if (h[i] !== sig[0]) continue;
      let k = 1;
      while (k < sig.length && h[i + k] === sig[k]) k++;
      if (k === sig.length) { ram = i - 0x400; break; }
    }
    return ram;
  }
  window.d32Screen = () => (findRam() >= 0 ? screenRows() : null);
  function screenRows() {
    const rows = [];
    for (let r = 0; r < 16; r++) {
      let t = '';
      for (let c = 0; c < 32; c++) { const b = HEAPU8[ram + 0x400 + r * 32 + c]; t += b >= 0x80 ? ' ' : String.fromCharCode(b >= 0x60 ? b - 0x40 : b); }   // ריבועי צבע = רווח
      rows.push(t.trimEnd());
    }
    return rows;
  }
  // מחפשים מיד אחרי ההדלקה, כשמשפט הפתיחה עוד על המסך
  // השורה שממנה מחפשים את סוף הטעינה: שורת ה-CLOAD (ה-ROM הישן), או S/F בפינה (ה-ROM החדש מנקה את המסך
  // בחיפוש, כמו המחשב האמיתי, ומראה S ואחר כך F ושם הקובץ)
  function cloadRow(rows) {
    const at = rows.map(r => r.startsWith('CLOAD')).lastIndexOf(true);
    const c = (rows[0].charCodeAt(0) | 0x40), sf = (c === 0x53 || c === 0x46) && rows[0][1] === ' ';   // גם הפוך (מהבהב)
    return at >= 0 ? at : (sf ? 0 : -1);
  }
  const early = setInterval(() => { if (window.d32Ready) { clearInterval(early); setTimeout(findRam, 1500); } }, 300);
  // אחרי CLOAD: מחכים ל-OK (נטען) או לשגיאה. בלי גישה לזיכרון: לפי האורך של הקלטת
  async function loaded(bytes) {
    if (ram < 0) { await wait(3000 + bytes * 9 + 2000); return true; }
    const start = Date.now();
    while (Date.now() - start < 90000) {
      await wait(250);
      const rows = screenRows();
      const at = cloadRow(rows);
      if (at < 0) continue;
      const after = rows.slice(at + 1);
      if (after.some(r => /ERROR/.test(r))) return false;
      if (after.includes('OK')) return true;
    }
    return false;
  }
  const failed = () => EN ? 'The tape did not load. Try again.' : 'הקלטת לא נטענה. נסו שוב.';
  // auto: מהאפליקציה (?tape=), שם הנוחות: המחשב מקליד CLOAD ו-RUN. לחיצה במכונה: רק מכניסים את הקלטת לרשמקול,
  // ומקלידים בעצמנו, כמו ב-1982 (גונן, 22.10: "מכונת דראגון תהיה המקור... בלי הטבות")
  // mc: קלטת של שפת מכונה: 'm' = CLOADM ואחרי ה-OK גם EXEC; 'a' = CLOADM, והמשחק מתחיל לבד
  async function load(id, title, button, auto, mc) {
    if (busy) return;
    try {
      // הקלטת כמו קלטת אמיתית: מה שהמכונה עצמה כתבה עם CSAVE, בפורמט המכווץ (rom/tools/mktapes.mjs)
      const bytes = new Uint8Array(await (await fetch('/lab/1982/tapes/' + id + '.cas')).arrayBuffer());
      gameKeys(id);
      await play(bytes, '/tape-' + id + '.cas', title, button, true, auto, mc);
    } catch (e) { status.textContent = failed(); }
  }
  // מכניסים קלטת לרשמקול. auto: גם מקלידים CLOAD, ואם run גם RUN כשהטעינה נגמרת
  async function play(bytes, path, title, button, run, auto, mc) {
    if (busy) return;
    if (typeof Module === 'undefined' || !window.d32Ready) { status.textContent = EN ? 'The computer is still starting. Try again in a moment.' : 'המחשב עוד נדלק. נסו שוב בעוד רגע.'; return; }
    busy = true;
    findRam();
    try {
      FS.writeFile(path, bytes);
      Module.ccall('wasm_load_file', null, ['string', 'number', 'number'], [path, 2, 0]);
      document.querySelectorAll('.tape').forEach(t => t.classList.toggle('in', t === button));
      const [LOADW, RUNW] = mc ? ['CLOADM', 'EXEC'] : ['CLOAD', 'RUN'];
      if (!auto) {
        status.textContent = mc === 'a'
          ? (EN ? 'The tape "' + title + '" is in the recorder. Type CLOADM. The game starts by itself when it has loaded.'
            : 'הקלטת "' + title + '" ברשמקול. הקלידו CLOADM. המשחק מתחיל לבד כשהטעינה נגמרת.')
          : EN ? 'The tape "' + title + '" is in the recorder. Type ' + LOADW + ', and after OK type ' + RUNW + '.'
          : 'הקלטת "' + title + '" ברשמקול. הקלידו ' + LOADW + ', ואחרי ה-OK הקלידו ' + RUNW + '.';
        document.getElementById('canvas')?.focus({ preventScroll: true });
        return;
      }
      status.textContent = EN ? 'Loading "' + title + '" from the tape…' : 'טוען את "' + title + '" מהקלטת…';
      if (innerWidth < 1000) document.querySelector('.tv').scrollIntoView({ behavior: 'smooth', block: 'start' });
      // עוצרים תוכנית שרצה (פעמיים: תוכנית שמחכה למקש עלולה לבלוע את הראשון), ומנקים את המסך,
      // כדי שהמילים CLOAD ו-OK שנבדוק יהיו של הטעינה הזאת ולא של קודמת
      await window.d32Type('\x1b');
      await wait(400);
      await window.d32Type('\x1b');
      await wait(400);
      await window.d32Type('CLS\n');
      await wait(300);
      await window.d32Type(LOADW + '\n');
      if (mc === 'a') {   // אין OK: המשחק תופס את המחשב
        status.textContent = EN ? 'Loading "' + title + '" from the tape. It starts by itself.' : 'טוען את "' + title + '" מהקלטת. הוא מתחיל לבד.';
        return;
      }
      if (await loaded(bytes.length / 1.3)) {
        if (run) {
          await window.d32Type(RUNW + '\n');
          status.textContent = mc ? (EN ? '"' + title + '" is running. To leave: BREAK, or reload the page.' : '"' + title + '" רץ. ליציאה: BREAK, או טעינה מחדש של הדף.')
            : (EN ? '"' + title + '" is running. To stop: BREAK.' : '"' + title + '" רץ. לעצירה: BREAK.');
        } else status.textContent = EN ? '"' + title + '" is loaded. RUN starts it, LIST shows the code.' : '"' + title + '" נטען. RUN מפעיל, LIST מראה את הקוד.';
      } else status.textContent = failed();
    } catch (e) {
      status.textContent = failed();
    } finally { busy = false; if (auto && mc !== 'a') insertLibrary(); }   // משחק שמתחיל לבד עוד קורא מהקלטת
  }

  // ---- הקלטות שלי: CSAVE מקליט לקובץ /out.cas (XRoar כותב אותו), ומכאן כל תוכנית נשמרת בדפדפן ----
  const KEY = 'd32-lab-tapes', MAX = 20;
  const mineBox = document.getElementById('mytapes');
  function myTapes() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function keep(list) { try { localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX))); return true; } catch (e) { return false; } }
  // קובץ CAS → תוכניות שלמות: [{ n: שם, b: [[סוג, ...נתונים], ...] }]. מדלגים על רעש ועל סיכום שגוי
  function parseCas(bytes) {
    const files = [];
    let cur = null;
    for (let i = 0; i + 4 < bytes.length; i++) {
      if (bytes[i] !== 0x55 || bytes[i + 1] !== 0x3c) continue;
      const type = bytes[i + 2], len = bytes[i + 3];
      if (i + 5 + len > bytes.length) break;
      const data = Array.from(bytes.slice(i + 4, i + 4 + len));
      let sum = type + len;
      for (const b of data) sum += b;
      if ((sum & 255) !== bytes[i + 4 + len]) continue;
      if (type === 0 && len >= 15) cur = { n: String.fromCharCode(...data.slice(0, 8)).trim(), b: [[0, ...data]] };
      else if (cur && type === 1) cur.b.push([1, ...data]);
      else if (cur && type === 255) { cur.b.push([255]); files.push(cur); cur = null; }
      i += 4 + len;
    }
    return files;
  }
  // לפי הכותרת: קובץ עם פערים (בית 10 שלה) — מבוא לפני כל בלוק; רציף — מבוא אחד והבלוקים ברצף
  function tapeBytes(files) {
    const leader = new Array(128).fill(0x55);
    let out = [];
    for (const f of files) {
      const gap = f.b[0][11];
      out = out.concat(leader, block(0, f.b[0].slice(1)));
      if (!gap) out = out.concat(leader);
      for (const b of f.b.slice(1)) out = out.concat(gap ? leader : [], block(b[0], b.slice(1)));
    }
    return new Uint8Array(out);
  }
  function addTapes(files) {
    const list = myTapes();
    for (const f of files) {
      const at = list.findIndex(t => t.n === f.n);
      if (at >= 0) list.splice(at, 1);
      list.push(f);
    }
    if (!keep(list)) status.textContent = EN ? 'No room left to keep the tape in this browser.' : 'אין מקום לשמור את הקלטת בדפדפן הזה.';
    renderMine();
    insertLibrary();
  }
  // הרשמקול: כל הקלטות שלי ברצף, מתחילת הקלטת. מכניסים מחדש אחרי כל טעינה, כמו להריץ אחורה
  function insertLibrary() {
    if (busy || !window.d32Ready) return;
    const list = myTapes();
    if (!list.length) return;
    try {
      FS.writeFile('/mytapes.cas', tapeBytes(list));
      Module.ccall('wasm_load_file', null, ['string', 'number', 'number'], ['/mytapes.cas', 2, 0]);
    } catch (e) {}
  }
  function renderMine() {
    if (!mineBox) return;
    mineBox.textContent = '';
    const list = myTapes();
    const count = document.getElementById('mine-count');
    if (count) count.textContent = list.length;
    if (!list.length) {
      const p = document.createElement('p');
      p.className = 'note';
      p.textContent = EN ? 'No tapes yet.' : 'עוד אין קלטות.';
      mineBox.appendChild(p);
    }
    for (const f of list.slice().reverse()) {
      const row = document.createElement('div');
      row.className = 'mytape';
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tape';
      b.innerHTML = '<span></span><small dir="ltr"></small>';
      b.querySelector('span').textContent = EN ? 'My tape' : 'הקלטת שלי';
      b.querySelector('small').textContent = f.n;
      b.addEventListener('click', () => { gameKeys(null); play(tapeBytes([f]), '/mine.cas', f.n, b, false, false); });
      const down = document.createElement('button');
      down.type = 'button';
      down.className = 'mini';
      down.textContent = '⬇';
      down.setAttribute('aria-label', (EN ? 'Download tape ' : 'הורדת הקלטת ') + f.n);
      down.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([tapeBytes([f])], { type: 'application/octet-stream' }));
        a.download = (f.n || 'TAPE') + '.cas';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      });
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'mini';
      del.textContent = '✕';
      del.setAttribute('aria-label', (EN ? 'Delete tape ' : 'מחיקת הקלטת ') + f.n);
      let armed = 0;
      del.addEventListener('click', () => {
        if (!armed) {
          del.textContent = EN ? 'Delete?' : 'למחוק?';
          del.classList.add('armed');
          armed = setTimeout(() => { armed = 0; del.textContent = '✕'; del.classList.remove('armed'); }, 3000);
          return;
        }
        clearTimeout(armed);
        keep(myTapes().filter(t => t.n !== f.n));
        renderMine();
        insertLibrary();
      });
      row.append(b, down, del);
      mineBox.appendChild(row);
    }
  }
  renderMine();
  // קלטת מקובץ (למשל אחת שהורדתם במכשיר אחר)
  const upload = document.getElementById('tape-upload'), file = document.getElementById('tape-file');
  if (upload && file) {
    upload.addEventListener('click', () => file.click());
    file.addEventListener('change', async () => {
      const f = file.files[0];
      file.value = '';
      if (!f) return;
      const found = parseCas(new Uint8Array(await f.arrayBuffer()));
      if (found.length) { addTapes(found); if (mineDrawer) mineDrawer.open = true; status.textContent = (EN ? 'Added to my tapes: ' : 'נוסף לקלטות שלי: ') + found.map(t => t.n).join(', '); }
      else status.textContent = EN ? 'No program found in this file.' : 'לא נמצאה תוכנית בקובץ הזה.';
    });
  }
  // שמירה: כל שנייה בודקים אם CSAVE הקליט תוכנית שלמה חדשה ל-/out.cas
  let outSize = 0, outDone = 0;
  setInterval(() => {
    if (!window.d32Ready) return;
    let bytes;
    try { if (FS.stat('/out.cas').size === outSize) return; bytes = FS.readFile('/out.cas'); } catch (e) { return; }
    outSize = bytes.length;
    const files = parseCas(bytes);
    if (files.length <= outDone) return;
    const fresh = files.slice(outDone);
    outDone = files.length;
    addTapes(fresh);
    status.textContent = (EN ? 'Saved to my tapes: ' : 'נשמר בקלטות שלי: ') + fresh.map(t => t.n).join(', ');
    if (mineDrawer) mineDrawer.open = true;
  }, 1000);
  // אחרי כל CLOAD שהסתיים (OK או שגיאה): מריצים את הרשמקול אחורה, כדי ש-CLOAD הבא ימצא כל קלטת
  let lastDone = '';
  setInterval(() => {
    if (busy || ram < 0 || !window.d32Ready) return;
    const rows = screenRows();
    const at = cloadRow(rows);
    if (at < 0) return;
    const end = rows.findIndex((r, i) => i > at && (r === 'OK' || /ERROR/.test(r)));
    if (end < 0) return;
    const sig = rows.slice(at, end + 1).join('\n') + at;
    if (sig === lastDone) return;
    lastDone = sig;
    insertLibrary();
  }, 700);
  const ready = setInterval(() => { if (window.d32Ready) { clearInterval(ready); setTimeout(insertLibrary, 2000); } }, 300);
  // הגיעו מהאפליקציה עם תוכנית בטקסט: ?mine=NAME (תוכנית שנשמרה ב"קלטות שלי" באפליקציה, בדפדפן הזה),
  // או #p=... (קישור שיתוף, או הכפתור "פתח במכונה" בלשונית "תוכנית": התוכנית בתוך הקישור עצמו).
  // הופכים אותה לקלטת טקסט, כמו ש-CSAVE "X",A כותב במחשב האמיתי (כותרת: סוג 0, ASCII ו"פערים";
  // לפני כל שורה CR), שומרים אותה גם בקלטות שלי של המכונה, וטוענים עם CLOAD רגיל. ה-ROM עושה את השאר.
  function textTape(name, text) {
    const body = Array.from('\r' + text.split(/\r?\n/).filter(l => l.trim()).join('\r') + '\r', c => c.charCodeAt(0)).filter(c => c === 13 || (c >= 32 && c < 127));
    const hdr = [...name.padEnd(8)].map(c => c.charCodeAt(0)).concat([0, 0xff, 0xff, 0, 0, 0, 0]);
    const f = { n: name, b: [[0, ...hdr]] };
    for (let i = 0; i < body.length; i += 255) f.b.push([1, ...body.slice(i, i + 255)]);
    f.b.push([255]);
    const go = setInterval(() => {
      if (!window.d32Ready) return;
      clearInterval(go);
      setTimeout(() => { addTapes([f]); if (mineDrawer) mineDrawer.open = true; gameKeys(null); play(tapeBytes([f]), '/mine.cas', name, null, true, true); }, 2000);
    }, 300);
  }
  const mineName = new URLSearchParams(location.search).get('mine');
  const linkCode = (/[#&]p=([A-Za-z0-9_-]+)/.exec(location.hash) || [])[1];
  if (mineName && /^[A-Z0-9]{1,8}$/.test(mineName)) {
    let text = null;
    try { const t = (JSON.parse(localStorage.getItem('d32-mytapes')) || []).find(x => x && x.n === mineName); if (t) text = String(t.t); } catch (e) {}
    if (text === null) status.textContent = EN ? 'The tape ' + mineName + ' is not saved in this browser.' : 'הקלטת ' + mineName + ' לא שמורה בדפדפן הזה.';
    else textTape(mineName, text);
  } else if (linkCode) {
    let text = null;
    try {
      const bin = atob(linkCode.replace(/-/g, '+').replace(/_/g, '/'));
      text = new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))).slice(0, 4000);
    } catch (e) {}
    if (!text || !text.trim()) status.textContent = EN ? 'The program in this link could not be read.' : 'לא הצלחתי לקרוא את התוכנית שבקישור.';
    else textTape('PROGRAM', text);
  }
})();
