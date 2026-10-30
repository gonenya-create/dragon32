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
    // המשחק הראשון של Ken Kalish: נכתב ב-1981 ויצא ב-1982 (Color Software Services, ובבריטניה Microdeal). אותו מנוע תלת-ממדי כמו Phantom Slayer
    ['escape', 'Escape', 'Escape', 'm',
      ['Ken Kalish · Color Software Services / Microdeal, 1982', 'http://www.lcurtisboyle.com/nitros9/interview.html', null, null, 'kalish']],
    // Invaders Revenge של Ken Kalish (Med Systems, 1982; ל-Dragon מ-Microdeal): על העטיפה "by K. KALISH", ובמסך הפתיחה "BY KENNETH KALISH".
    // CLOADM ואז EXEC; הקלטת מהארכיון כמו שהיא. בחיצים ו[רווח] (בשאלה JOYSTICKS עונים N)
    ['invrev', 'Invaders Revenge', 'Invaders Revenge', 'm',
      ['Ken Kalish · Med Systems / Microdeal, 1982', 'http://www.lcurtisboyle.com/nitros9/interview.html', null, null, 'kalish']],
    // El Diablero של Ken Kalish (Computerware, 1982; ל-Dragon מ-Dragon Data): במסך הפתיחה "BY KENNETH KALISH". הרפתקת טקסט.
    // CLOADM ואז EXEC; הקלטת מהארכיון כמו שהיא. קורא פקודות דרך הכניסה המקורית $B5C9, שנוספה ל-ROM בשבילו (30.10)
    ['diablero', 'El Diablero', 'El Diablero', 'm',
      ['Ken Kalish · Computerware / Dragon Data, 1982', 'http://www.lcurtisboyle.com/nitros9/interview.html', null, null, 'kalish']],
    ['phantom', 'Phantom Slayer', 'Phantom Slayer', 'm',
      ['Ken Kalish · Med Systems / Microdeal, 1983', 'http://www.lcurtisboyle.com/nitros9/interview.html', null, null, 'kalish']],
    ['ranger', 'Danger Ranger', 'Danger Ranger', 'a',
      ['Ken Kalish · Med Systems / Microdeal, 1983', 'http://www.lcurtisboyle.com/nitros9/interview.html', null, null, 'kalish']],
    // Trapfall של Ken Kalish (Tom Mix Software, 1983), שבבריטניה יצא אצל Microdeal בשם Cuthbert in the Jungle (Kalish בראיון אצל Curtis Boyle)
    ['cuthbert', 'Cuthbert in the Jungle', 'Cuthbert in the Jungle', 'a',
      ['Ken Kalish · Microdeal, 1983', 'http://www.lcurtisboyle.com/nitros9/interview.html', null, null, 'kalish']],
    // Devil Assault של Ken Kalish (Tom Mix, 1983; ל-Dragon מ-Microdeal): על העטיפה השם שלו מעל שם המשחק, ובמסך הפתיחה "by Ken Kalish".
    // חלק אחד שמתחיל לבד אחרי CLOADM; הקלטת מהארכיון כמו שהיא. משחק עם ידית
    ['devil', 'Devil Assault', 'Devil Assault', 'a',
      ['Ken Kalish · Tom Mix / Microdeal, 1983', 'http://www.lcurtisboyle.com/nitros9/interview.html', null, null, 'kalish']],
    // נכתב רק ל-Dragon (לפי Curtis Boyle). על המסך: (C)1983, ו-COPYRIGHT 1984 של Microdeal
    ['dungeon', 'Dungeon Raid', 'Dungeon Raid', 'a',
      ['Ken Kalish · Microdeal, 1983–84', 'http://www.lcurtisboyle.com/nitros9/interview.html', null, null, 'kalish']],
    // נכתב רק ל-Dragon (Curtis Boyle, כמו Dungeon Raid). על מסך הפתיחה: (C) 1984, ועל המסך של Microdeal: 1985.
    // הקלטת: הבלוקים בדיוק כמו בקובץ ה-CAS שבארכיון, עם אורכי המבוא של ההקלטה המקורית (ה-WAV): הטוען צריך מבוא ארוך בין השלבים
    ['athletyx', 'Athletyx', 'Athletyx', 'a',
      ['Ken Kalish · Microdeal, 1984–85', 'http://www.lcurtisboyle.com/nitros9/interview.html', null, null, 'kalish']],
    // ההרפתקאות של Scott Adams: אישור בכתב (מייל 25.10.2026). קרדיט מלא וקישור ל-msadams.com, בלי שינויים, יורד לפי בקשה
    ['adventureland', 'Adventureland', 'Adventureland', 'a',
      ['Scott Adams · Adventure International, 1979 · color: Roger Schrag', 'https://www.msadams.com/', null, null, 'adams']],
    // על המסך: "BY ALEXIS AND SCOTT ADAMS"
    ['pirate', 'Pirate Adventure', 'Pirate Adventure', 'a',
      ['Alexis Adams & Scott Adams · Adventure International, 1979 · color: Roger Schrag', 'https://www.msadams.com/', null, null, 'adams']],
    ['mission', 'Secret Mission', 'Secret Mission', 'a',
      ['Scott Adams · Adventure International, 1979 · color: Roger Schrag', 'https://www.msadams.com/', null, null, 'adams']],
    // על המסך: "BY ALEXIS ADAMS". היא כתבה אותו עם Scott, והוא בסדרה שלו
    ['voodoo', 'Voodoo Castle', 'Voodoo Castle', 'a',
      ['Alexis Adams & Scott Adams · Adventure International, 1979 · color: Roger Schrag', 'https://www.msadams.com/', null, null, 'adams']],
    ['count', 'The Count', 'The Count', 'a',
      ['Scott Adams · Adventure International, 1979 · color: Roger Schrag', 'https://www.msadams.com/', null, null, 'adams']],
    // משחקי Mike Hughey: במכתב מ-19.6.1997 נתן רשות להפיץ אותם "as desired, in whatever format" (ארכיון CLEAR). קרדיט מלא, יורד לפי בקשה.
    // הקלטות: הגרסאות ל-Dragon ש-Microdeal מכרה בבריטניה (Tom Mix Software הוציאה אותם בארה"ב)
    ['grabber', 'Grabber', 'Grabber', 'a',
      ['Mike Hughey · Tom Mix Software / Microdeal, 1983', 'https://web.archive.org/web/20040604130844/http://ds.dial.pipex.com/town/estate/dh69/clear/rights.html', null, null, 'hughey']],
    ['draconian', 'Draconian', 'Draconian', 'a',
      ['Mike Hughey · Tom Mix Software / Microdeal, 1984', 'https://web.archive.org/web/20040604130844/http://ds.dial.pipex.com/town/estate/dh69/clear/rights.html', null, null, 'hughey']],
    // Alcatraz II של Mike Hughey (Spectral Associates, ול-Dragon מ-Microdeal): תוכנית BASIC, באותו מכתב מ-1997. בקלטת מהארכיון היו
    // 15 בתי מבוא לפני כל בלוק, והמכונה צריכה מבוא ארוך כמו בקלטת אמיתית: המבוא הוארך, הנתונים כמו שהם (29.10)
    ['alcatraz', 'Alcatraz II', 'Alcatraz II', null,
      ['Mike Hughey · Spectral Associates / Microdeal, 1982', 'https://web.archive.org/web/20040604130844/http://ds.dial.pipex.com/town/estate/dh69/clear/rights.html', null, null, 'hughey']],
    // Tim Love's Cricket (Peaksoft, 1984): רשות מ-Tim Love במייל, 29.10.2026. שלושה חלקים בקלטת: טוען, BASIC וקוד מכונה.
    // שורה 10 שלו, CLOADM"":GOTO280, חשפה באג ב-ROM שלנו (תוקן 29.10). המבוא הוארך כמו ב-Alcatraz
    ['cricket', 'Tim Love\'s Cricket', 'Tim Love\'s Cricket', 'a',
      ['Tim Love · Peaksoft, 1984', 'https://timlovescricket.blogspot.com/', null, null, 'love']],
    // Tanglewood (Microdeal, 1986): קוד פתוח ברישיון MIT מ-2018 (Ian Murray-Watson, Pete Lyon, ובהסכמת John Symes).
    // הקלטת מהמאגר הרשמי נגמרת בביט האחרון, אז נוספו אחריה 16 בתי מבוא (כמו בקלטת אמיתית); הנתונים כמו שהם
    // Champions! של Harry Whitehouse (Peaksoft, 1983), משחק ניהול כדורגל: הרשות שלו במייל, 29.10.2026.
    // תוכנית BASIC; הקלטת מהארכיון רצה כמו שהיא
    ['champs', 'Champions!', 'Champions!', null,
      ['Harry Whitehouse · Peaksoft, 1983', 'http://www.peaksoft.uk/peaksoftstory', null, null, 'love']],
    // Lionheart של Harry Whitehouse (Peaksoft, 1983): הרשות שלו במייל, 29.10.2026. BASIC, הקלטת כמו שהיא
    ['lionht', 'Lionheart', 'Lionheart', null,
      ['Harry Whitehouse · Peaksoft, 1983', 'http://www.peaksoft.uk/peaksoftstory', null, null, 'love']],
    // SAS של Harry Whitehouse (Peaksoft, 1983): אותה רשות. BASIC עם קוד מכונה קטן. קורא את החיצים ישר מטבלת המקלדת (PEEK(341)=223),
    // וזה חשף שהטבלה שלנו נשמרה הפוך מהמקור (תוקן ב-ROM, 29.10). הקלטת כמו שהיא
    ['sas', 'SAS', 'SAS', null,
      ['Harry Whitehouse · Peaksoft, 1983', 'http://www.peaksoft.uk/peaksoftstory', null, null, 'love']],
    // Star Spores של Dave Shadoff (Spectral Associates, 1983; ל-Dragon מ-Microdeal): הרשות שלו במייל, 25.10.2026. הקלטת מהארכיון כמו שהיא.
    // הטוען של Microdeal בשלבים (כמו Athletyx). המשחק בודק את המילה ב-$B4B3 כדי לדעת שהוא על Dragon (נוסף ל-ROM, 30.10)
    ['spores', 'Star Spores', 'Star Spores', 'a',
      ['Dave Shadoff · Spectral Associates / Microdeal, 1984', 'https://archive.worldofdragon.org/index.php?title=Star_Spores', null, null, 'love']],
    ['tangle', 'Tanglewood', 'Tanglewood', 'm',
      ['Ian Murray-Watson · Microdeal, 1986', '/lab/1982/tapes/tanglewood-license.txt', 'https://gitlab.com/amigasourcecodepreservation/tanglewood', null, 'mit']]
  ];
  // משחקים שצריכים ג'ויסטיק: כשהקלטת נטענת, החיצים במקלדת הופכים לג'ויסטיק הימני ו-Alt (Option במק) לכפתור שלו
  const JOY = new Set(['ranger', 'devil', 'dungeon', 'athletyx', 'cuthbert', 'grabber', 'draconian', 'alcatraz', 'cricket']);
  // ב-Cricket החובט משתמש בג'ויסטיק השמאלי והמגיש בימני (המדריך של Peaksoft): החיצים מזיזים את שניהם יחד
  const BOTH = new Set(['cricket']);
  function setJoy(on, both) {
    try { Module.ccall('wasm_set_joystick_by_name', null, ['number', 'string'], [0, on ? 'kjoy0' : '']); } catch (e) {}
    try { Module.ccall('wasm_set_joystick_by_name', null, ['number', 'string'], [1, on && both ? 'kjoy0' : '']); } catch (e) {}
    window.d32Joy = !!on;
  }
  // גם רווח יורה במשחקי ג'ויסטיק (גונן, 27.10): במק, לחיצה כפולה על Option פותחת לפעמים תוכנה אחרת (למשל החלון המהיר של Claude).
  // כשהג'ויסטיק מהמקלדת פעיל, רווח לא מגיע למחשב כרווח: הוא נשלח ככפתור הג'ויסטיק (Alt), בדיוק כמו בלוח המשחק בטלפון
  window.addEventListener('keydown', e => spaceFire(e, 'keydown'), true);
  window.addEventListener('keyup', e => spaceFire(e, 'keyup'), true);
  function spaceFire(e, type) {
    if (!window.d32Joy || e.code !== 'Space' || !e.isTrusted) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (type === 'keydown' && e.repeat) return;
    const canvas = document.getElementById('canvas');
    if (canvas) canvas.dispatchEvent(new KeyboardEvent(type, { key: 'Alt', code: 'AltLeft', bubbles: true, cancelable: true }));
  }
  // כל קלטת שנכנסת לרשמקול: ג'ויסטיק מהמקלדת רק למשחקי ג'ויסטיק, ולוח המשחק לטלפון (joypad.js) רק למשחקים שיש להם מקשים שם
  function gameKeys(id) {
    setJoy(JOY.has(id), BOTH.has(id));
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
    // נבדק במכונה (28.10): הטעינה (CLOADM ואז EXEC), מסך הפתיחה וההקדמה, ההליכה, דלת של דמות (POET) ומסך הרמז, [↓] חזרה למסדרון,
    // צלילי הספרות, והמעלית (מקש לא נכון: נפילה וסוף). מהקוד ($20E5): חיצים, BREAK, X, והספרות 1–9 שמנגנות צליל. לא מגלים כאן את הפתרון
    escape: {
      he: ['אחרי הטעינה מקלידים EXEC ו-[ENTER]. מופיעים מסך הפתיחה וההקדמה, ואז המסדרון.',
        '[↑] צעד קדימה, [↓] צעד אחורה, [←] [→] מסתובבים. מקיר רגיל לא עוברים.',
        'על הקירות יש דלתות אדומות, ועל חלק מהן שלט עם שם. נכנסים אליהן ב-[↑], ושם מחכה דמות עם רמז. [↓] חוזר למסדרון.',
        'כשמופיע סמן מהבהב, עונים במקלדת ולוחצים [ENTER].',
        'המטרה: לפענח מהרמזים "מפתח" של 5 צלילים, ולהקיש אותו במעלית. כל ספרה, [1] עד [9], מנגנת צליל. מפתח לא נכון במעלית מפיל אתכם לתחתית הפיר, וזה סוף המשחק.',
        'כדאי לצייר מפה על דף, כמו שעשו ב-1982.'],
      en: ['After loading type EXEC and [ENTER]. The title screen and the introduction appear, then the corridor.',
        '[↑] step forward, [↓] step back, [←] [→] turn. You cannot walk through a plain wall.',
        'The walls have red doors, and some have a sign with a name. Go in with [↑], and a character with a clue is waiting. [↓] takes you back to the corridor.',
        'When a cursor flashes, answer on the keyboard and press [ENTER].',
        'The goal: work out from the clues a "key" of 5 notes, and play it in the elevator. Each digit, [1] to [9], plays a note. The wrong key in the elevator drops you to the bottom of the shaft, and the game is over.',
        'Draw a map on paper, as people did in 1982.']
    },
    // נבדק במכונה (28.10): הטעינה דרך $B75B והנקודתיים ב-$84AF, מסך הרישיון (512 קריאות ל-$BBC5, כמו במקור), הפתיחה, הליכה, קפיצה, סולם, בול עץ (2000 ל-1900) והשעון.
    // מהקוד של המשחק: X של הג'ויסטיק הימני ($015A) עד $0A שמאלה, מ-$36 ימינה; Y ($015B) מעל $36 למטה, עד $19 למעלה. הכפתור הימני קופץ
    cuthbert: {
      he: ['במשחק הזה החיצים הם ג\'ויסטיק, ו-[רווח] הוא הכפתור שלו (אפשר גם [Alt], במק [Option]). בטלפון יש מתחת למסך ידית וכפתור אש.',
        'אחרי הכפתור האדום מקלידים CLOADM ו-[ENTER]. קודם מופיע הציור של Microdeal, והמשחק ממשיך להיטען מאחוריו.',
        'אחר כך מופיע LICENSED BY MICRODEAL ונשאר כחמש עד שבע דקות. זה לא תקוע: המשחק עצמו מחכה כך, ובאותה לולאת המתנה של השבב המקורי.',
        'במסך הג\'ונגל לוחצים [רווח] כדי להתחיל. [←] [→] הולכים, [רווח] קופץ מעל בורות ובולי עץ, ו-[↑] [↓] מטפסים בסולם אל המנהרה שמתחת.',
        'מתחילים עם 2000 נקודות, וכל בול עץ שפוגע בכם מוריד נקודות. למעלה משמאל רץ השעון: 20 דקות למסע.'],
      en: ['In this game the arrow keys are a joystick and [Space] is its button (or [Alt], [Option] on a Mac). On a phone there is a stick and a fire button under the screen.',
        'After the red button type CLOADM and [ENTER]. The Microdeal picture comes first, and the game goes on loading behind it.',
        'Then LICENSED BY MICRODEAL appears and stays for about five to seven minutes. It is not stuck: the game itself waits like this, using the same delay loop as the original chip.',
        'On the jungle screen press [Space] to start. [←] [→] walk, [Space] jumps over pits and logs, and [↑] [↓] climb the ladder to the tunnel below.',
        'You start with 2000 points, and every log that hits you takes some away. The clock at the top left runs: 20 minutes for the trip.']
    },
    // נבדק במכונה (28.10): הטעינה בשלבים דרך $B75B, המסכים, בחירת שחקנים, ריצת 100 מטר (FOUL על זינוק מוקדם, זמן ותוצאה), והמקצוע הבא.
    // מהקוד של המשחק: X של הג'ויסטיק הימני ($015A) מעל $25 או מתחת ל-$1C, וכל החלפת כיוון היא צעד. הכפתור הימני: לחיצה, או החזקה שנספרת
    athletyx: {
      he: ['במשחק הזה החיצים הם ג\'ויסטיק, ו-[רווח] הוא הכפתור שלו (אפשר גם [Alt], במק [Option]). בטלפון יש מתחת למסך ידית וכפתור אש.',
        'אחרי הכפתור האדום מקלידים CLOADM ו-[ENTER]. הטעינה לוקחת כשתי דקות: קודם מופיע הציור של Microdeal, והמשחק ממשיך להיטען מאחוריו.',
        'במסך LICENSED BY MICRODEAL לוחצים [רווח], ובמסך הפתיחה שוב [רווח]. ב-SELECT PLAYERS לוחצים [1] לשחקן אחד או [2] לשניים, והריצה מתחילה מיד.',
        'ריצת 100 מטר: מחכים ל-GO!!!!, ואז מנענעים את הג\'ויסטיק ימינה ושמאלה בקצב: [←] [→] [←] [→]. כל החלפת כיוון היא צעד, והפסים למטה משמאל מראים את המהירות. מי שזז לפני GO מקבל FOUL.',
        'ליד NEED כתוב הזמן שצריך להשיג. במקצועות האחרים משתמשים גם בכפתור: לוחצים עליו, או מחזיקים אותו כדי לצבור כוח.'],
      en: ['In this game the arrow keys are a joystick and [Space] is its button (or [Alt], [Option] on a Mac). On a phone there is a stick and a fire button under the screen.',
        'After the red button type CLOADM and [ENTER]. Loading takes about two minutes: the Microdeal picture comes first, and the game goes on loading behind it.',
        'On the LICENSED BY MICRODEAL screen press [Space], and on the title screen [Space] again. At SELECT PLAYERS press [1] for one player or [2] for two, and the race starts at once.',
        '100 metres: wait for GO!!!!, then rock the joystick left and right in rhythm: [←] [→] [←] [→]. Every change of direction is a step, and the bars at the bottom left show your speed. Move before GO and you get a FOUL.',
        'NEED shows the time you have to beat. In the other events you also use the button: press it, or hold it down to build up power.']
    },
    // נבדק במכונה (30.10): הטעינה, מסך הצבעים, מסך הפתיחה, SELECT LEVEL, האש שמתחילה, העטלפים והפצצות, הבסיס שמתפוצץ והחיים שיורדים
    devil: {
      he: ['במשחק הזה החיצים הם ג\'ויסטיק, ו-[רווח] הוא הכפתור שלו (אפשר גם [Alt], במק [Option]). בטלפון יש מתחת למסך ידית וכפתור אש.',
        'הטעינה לוקחת כשתי דקות וחצי, והמשחק מתחיל לבד. קודם מופיע הציור של Microdeal, והמשחק ממשיך להיטען מאחוריו.',
        'בוחרים צבע: [1] שחור, [2] בהיר, [3] ירוק. אחרי מסך הפתיחה, ב-SELECT LEVEL בוחרים רמה, [0] עד [5]: ברמות הזוגיות הטיל עף ישר למעלה, ובאי-זוגיות אפשר לכוון אותו בג\'ויסטיק תוך כדי מעוף.',
        'לוחצים על הכפתור כדי להתחיל. [←] [→] מזיזים את הבסיס בתחתית המסך, והכפתור יורה.',
        'שלושה מסכים: עטלפי ערפד שמפציצים ומתפצלים כשפוגעים בהם, רובוטים שצועדים למטה ויורים, ו-Sproings שקופצים לרמוס את הבסיס. ברמות הגבוהות השטן עצמו עף למעלה ומפיל קדרה בוערת.',
        'כל 10,000 נקודות מקבלים בסיס נוסף. [R] מתחיל מחדש.'],
      en: ['In this game the arrow keys are a joystick and [Space] is its button (or [Alt], [Option] on a Mac). On a phone there is a stick and a fire button under the screen.',
        'Loading takes about two and a half minutes, and the game starts by itself. The Microdeal picture comes first, and the game goes on loading behind it.',
        'Pick a colour: [1] black, [2] buff, [3] green. After the title screen, at SELECT LEVEL pick a level, [0] to [5]: on even levels the missile flies straight up, and on odd levels you can steer it with the joystick as it flies.',
        'Press the button to start. [←] [→] move your base along the bottom of the screen, and the button fires.',
        'Three screens: vampire bats that bomb you and split in two when hit, robots that march down firing, and Sproings that bounce in to stomp your base. On the higher levels the Devil himself flies across the top and drops a flaming cauldron.',
        'A bonus base every 10,000 points. [R] starts again.']
    },
    // נבדק במכונה (27.10): צבע, רמה, המנגינה ואחריה FIRE, תנועה, ירי ונקודות, פגיעה ביצור וגל ההדף, החיים. סוף החיים (בקוד, $2BBB): מחכה למקש דרך POLCAT; C ממשיך ($2FED), כל מקש אחר מתחיל מחדש ($2FDD)
    dungeon: {
      he: ['במשחק הזה החיצים הם ג\'ויסטיק, ו-[רווח] הוא הכפתור שלו (אפשר גם [Alt], במק [Option]). בטלפון יש מתחת למסך ידית וכפתור אש.',
        'הטעינה ארוכה, כארבע דקות, והמשחק מתחיל לבד. אחרי הלוגו של Microdeal בוחרים צבע: [1] שחור, [2] בהיר, [3] ירוק.',
        'במסך הפתיחה לוחצים [רווח]. ב-SELECT LEVEL בוחרים רמה: [1] הכי קלה, עד [3].',
        'מתנגנת מנגינה קצרה. כשהיא נגמרת לוחצים [רווח] כדי לצאת לדרך. גם אחרי שנפגעים לוחצים [רווח] כדי להמשיך.',
        '[←] [→] זזים לצדדים, [↓] רצים מהר יותר במסדרון, [↑] לאט יותר. [רווח] יורה למטה, אל היצורים ואל הדלתות הנעולות.',
        'נזהרים מהנחשים, מה-OAFS ומה-SNAPPERS, ומגל ההדף של יצור שמתפוצץ. אל תירו בכפילים שנראים כמוכם: זה עולה בחיים. הכוכביות למעלה הן החיים, והמספר מימין הוא הזמן.',
        'כשנגמרים החיים המשחק נעצר ומחכה למקש: [C] ממשיך מאותו מקום במבוך (הניקוד מתחיל מאפס), וכל מקש אחר מתחיל מההתחלה. אין מסך סיום: כך Ken Kalish בנה אותו.'],
      en: ['In this game the arrow keys are a joystick and [Space] is its button (or [Alt], [Option] on a Mac). On a phone there is a stick and a fire button under the screen.',
        'Loading is long, about four minutes, and the game starts by itself. After the Microdeal logo pick a colour: [1] black, [2] buff, [3] green.',
        'On the title screen press [Space]. At SELECT LEVEL pick a level: [1] is the easiest, up to [3].',
        'A short tune plays. When it ends, press [Space] to set off. After you are hit, press [Space] again to go on.',
        '[←] [→] move sideways, [↓] run faster down the corridor, [↑] slower. [Space] fires downwards, at the creatures and at locked doors.',
        'Watch out for the snakes, oafs and snappers, and for the shock wave of a creature that blows up. Don\'t shoot the clones that look like you: that costs a life. The stars at the top are your lives, and the number on the right is the time.',
        'When the last life is gone the game stops and waits for a key: [C] carries on from the same place in the dungeon (the score starts again from zero), and any other key starts again from the beginning. There is no end screen: that is how Ken Kalish made it.']
    },
    // נבדק במכונה (30.10): הטעינה, JOYSTICKS, ההוראות במשחק, מסך הפתיחה, שחקנים, יריות ומהירות, הספינות שזזות ובסיס הלייזר
    invrev: {
      he: ['אחרי הטעינה מקלידים EXEC ו-[ENTER]. כשהמשחק שואל JOYSTICKS (Y/N)? לוחצים [N], ומשחקים בחיצים.',
        'ב-NEED INSTRUCTIONS (Y/N)? לוחצים [Y] כדי לקרוא את ההוראות (מקש לכל עמוד), או [N]. אחר כך בוחרים [1] או [2] שחקנים, כמה יריות, [1] עד [5], ומהירות, [1] עד [5].',
        'הפעם אתם הפולש: החללית האחרונה שנשארה, נגד ספינות בני האדם. החלליות שלכם מחכות למעלה משמאל, מעל הקו.',
        'החיצים מזיזים את החללית לכל הכיוונים. מורידים אותה אל מתחת לקו כדי להתחיל, ו-[רווח] יורה.',
        'ספינה רגילה שווה 100 נקודות, ספינת הדגל 1000. בסיס הלייזר למטה יורה עליכם, ואותו אי אפשר להשמיד. ב-10,000 נקודות מקבלים חללית נוספת.'],
      en: ['After loading type EXEC and [ENTER]. When the game asks JOYSTICKS (Y/N)? press [N], and play with the arrow keys.',
        'At NEED INSTRUCTIONS (Y/N)? press [Y] to read the instructions (a key for each page), or [N]. Then choose [1] or [2] players, how many shots, [1] to [5], and the speed, [1] to [5].',
        'This time you are the invader: the last ship left, against the human ships. Your ships wait at the top left, above the line.',
        'The arrow keys move your ship in every direction. Bring it below the line to start, and [Space] fires.',
        'A normal ship is worth 100 points, the flagship 1000. The laser base at the bottom fires at you, and it cannot be destroyed. A bonus ship at 10,000 points.']
    },
    // נבדק במכונה (30.10): הטעינה בשלבים, הצבע, מסך הפתיחה, טבלת השיאים, K ו-1, תנועה בחיצים לשני הצדדים, ומצב ג'ויסטיק
    spores: {
      he: ['הטעינה לוקחת כשלוש דקות, והמשחק מתחיל לבד. קודם מופיע הציור של Microdeal, והמשחק ממשיך להיטען מאחוריו.',
        'בוחרים צבע: [1] שחור, [2] בהיר, [3] ירוק. במסך הפתיחה לוחצים מקש כלשהו.',
        'בטבלת השיאים המשחק שואל JOYSTICK OR KEYBOARD? לוחצים [K] למקלדת, ואז ב-1 OR 2 PLAYERS? לוחצים [1] או [2]. אם מחכים, הוא מראה הדגמה.',
        '[←] [→] מזיזים את החללית, ו-[רווח] יורה. [P] עוצר, ו-[ENTER] ממשיך.',
        'הנבגים מגיעים בקבוצות של שמונה, ישנים. צריך לפגוע בכל אחד פעמיים: פעם כדי להעיר אותו, ופעם כדי להשמיד אותו לפני שהוא מתאושש. נבג שמתבגר כבר אי אפשר להרוג.',
        'הפס למעלה הוא הדלק: כשהוא נגמר, כל הנבגים מתעוררים ותוקפים. שש משפחות של יצורים, ואחריהן סבב בונוס.'],
      en: ['Loading takes about three minutes, and the game starts by itself. The Microdeal picture comes first, and the game goes on loading behind it.',
        'Pick a colour: [1] black, [2] buff, [3] green. On the title screen press any key.',
        'On the high-score table the game asks JOYSTICK OR KEYBOARD? Press [K] for the keyboard, then at 1 OR 2 PLAYERS? press [1] or [2]. If you wait, it shows a demo.',
        '[←] [→] move your ship, and [Space] fires. [P] pauses, and [ENTER] carries on.',
        'The spores arrive in groups of eight, asleep. Each needs two hits: one to wake it, and one to destroy it while it is still dazed. Once a spore matures it cannot be killed.',
        'The bar at the top is your fuel: when it runs out, every spore wakes up and attacks. Six families of creatures, then a bonus round.']
    },
    // נבדק במכונה (30.10): הטעינה, מסך הפתיחה, תיאור המקום, LOOK, INVENTORY, GO NORTH (CAN'T GO)
    diablero: {
      he: ['אחרי הטעינה מקלידים EXEC ו-[ENTER]. במסך הפתיחה לוחצים על מקש כלשהו.',
        'זו הרפתקת טקסט, כמו של Scott Adams: המחשב מתאר איפה אתם, מה אתם רואים ולאן אפשר ללכת, ושואל WHAT DO I DO NOW?',
        'עונים בשתי מילים באנגלית ולוחצים [ENTER]: למשל GO WEST, ‏GET ROCK, ‏LOOK. ‏INVENTORY מראה מה יש לכם.',
        'מתחילים במדבר, ליד בריכה קטנה של מים צהובים, על שפת קניון עמוק. כדאי לצייר מפה על דף.'],
      en: ['After loading type EXEC and [ENTER]. On the title screen press any key.',
        'It is a text adventure, like Scott Adams\'s: the computer describes where you are, what you see and where you can go, and asks WHAT DO I DO NOW?',
        'Answer in two English words and press [ENTER]: for example GO WEST, GET ROCK, LOOK. INVENTORY shows what you carry.',
        'You start in the desert, next to a small pool of yellow water, at the edge of a deep canyon. Draw a map on paper.']
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
    // נבדק במכונה (28.10): טעינה (כשלוש וחצי דקות, מסך הטעינה של Microdeal), בחירת צבע, מסך הפתיחה, NUMBER OF PLAYERS?, הליכה במבוך,
    // והכפתור שמעביר בין שני המבוכים. המטרה לפי Curtis Boyle (lcurtisboyle.com/nitros9/grabber.html)
    grabber: {
      he: ['במשחק הזה החיצים הם ג\'ויסטיק, ו-[רווח] הוא הכפתור שלו (אפשר גם [Alt], במק [Option]). בטלפון יש מתחת למסך ידית וכפתור אש.',
        'הטעינה ארוכה, כשלוש וחצי דקות. כשהיא נגמרת בוחרים צבע רקע: [1] שחור, [2] בהיר, [3] ירוק.',
        'מופיע מסך הפתיחה, ואחריו NUMBER OF PLAYERS?. לוחצים [1] לשחקן אחד, או [2] לשניים בתורות.',
        'על המסך שני מבוכים. החיצים מזיזים אתכם, ו-[רווח] מעביר אתכם למבוך השני.',
        'המטרה: לאסוף את המטילים מהפינות ולהחזיר אותם לתאים שבמרכז. שתי מפלצות אפשר לנצח רק כשאתם בצבע שלהן, והשלישית גונבת מטילים מהמרכז.'],
      en: ['In this game the arrow keys are a joystick and [Space] is its button (or [Alt], [Option] on a Mac). On a phone there is a stick and a fire button under the screen.',
        'Loading is long, about three and a half minutes. When it ends pick a background colour: [1] black, [2] buff, [3] green.',
        'The title screen appears, then NUMBER OF PLAYERS?. Press [1] for one player, or [2] for two taking turns.',
        'There are two mazes on the screen. The arrows move you, and [Space] moves you to the other maze.',
        'The goal: collect the bars from the corners and bring them back to the holds in the middle. Two monsters can be beaten only when you are their colour, and the third steals bars from the middle.']
    },
    // נבדק במכונה (28.10): טעינה, בחירת צבע, מסך הפתיחה, NUMBER OF PLAYERS? (המקש נקלט רק כשהשאלה כבר על המסך), טיסה לכל כיוון וירי.
    // המטרה לפי Curtis Boyle (lcurtisboyle.com/nitros9/draconian.html)
    draconian: {
      he: ['במשחק הזה החיצים הם ג\'ויסטיק, ו-[רווח] הוא הכפתור שלו (אפשר גם [Alt], במק [Option]). בטלפון יש מתחת למסך ידית וכפתור אש.',
        'הטעינה ארוכה, כשלוש וחצי דקות. כשהיא נגמרת בוחרים צבע רקע: [1] שחור, [2] בהיר, [3] ירוק.',
        'מופיע מסך הפתיחה. לוחצים [רווח], או מחכים, ומופיע NUMBER OF PLAYERS?. כשהשאלה על המסך לוחצים [1] לשחקן אחד, או [2] לשניים.',
        'החיצים מכוונים את החללית, והיא טסה לכיוון הזה. [רווח] יורה. המפה מימין מראה את הבסיסים.',
        'המטרה: להשמיד את כל הבסיסים בשלב ולהציל את האסטרונאוטים שכלואים בהם. נזהרים ממוקשים, מאסטרואידים ומהירי של הבסיסים. מי שמתעכב, דרקון ענק רודף אחריו.'],
      en: ['In this game the arrow keys are a joystick and [Space] is its button (or [Alt], [Option] on a Mac). On a phone there is a stick and a fire button under the screen.',
        'Loading is long, about three and a half minutes. When it ends pick a background colour: [1] black, [2] buff, [3] green.',
        'The title screen appears. Press [Space], or wait, and NUMBER OF PLAYERS? appears. When the question is on the screen press [1] for one player, or [2] for two.',
        'The arrows point your ship, and it flies that way. [Space] fires. The map on the right shows the bases.',
        'The goal: destroy all the bases in the sector and rescue the astronauts held in them. Watch out for mines, asteroids and fire from the bases. Take too long and a giant dragon comes after you.']
    },
    // נבדק במכונה (29.10): CLOAD, ‏RUN, ‏DRAGON OR TANDY, ‏JOYSTICKS?, השומרים זזים במבוך. ההוראות מהתוכנית INSTRUCT שבצד השני של הקלטת
    alcatraz: {
      he: ['במשחק הזה החיצים הם ג\'ויסטיק, ו-[רווח] הוא הכפתור שלו (אפשר גם [Alt], במק [Option]). בטלפון יש מתחת למסך ידית וכפתור אש.',
        'אחרי RUN המשחק שואל DRAGON OR TANDY COLOR?: לוחצים [D]. ל-JOYSTICKS? (Y OR N) לוחצים [Y].',
        'אתם אסיר בכלא Alcatraz II, ומזיזים את עצמכם בחיצים. אי אפשר לעבור דרך קירות ודרך שערים סגורים.',
        'השומרים מסתובבים בכלא. אם הם תופסים אתכם, חוזרים לתא. הם פותחים שערים כשהם עוברים בהם, וכך משאירים לכם דרך החוצה.'],
      en: ['In this game the arrow keys are a joystick and [Space] is its button (or [Alt], [Option] on a Mac). On a phone there is a stick and a fire button under the screen.',
        'After RUN the game asks DRAGON OR TANDY COLOR?: press [D]. At JOYSTICKS? (Y OR N) press [Y].',
        'You are a prisoner in Alcatraz II, and the arrows move you. You cannot pass through walls or closed gates.',
        'Guards walk the prison. If they catch you, you go back to your cell. They open gates as they pass through, leaving you a way out.']
    },
    // נבדק במכונה (29.10): שלושת החלקים נטענים, מסך הפתיחה, התפריטים (רמה, עזרה בחבטה, בחירת קבוצות) וטבלת הקבוצה.
    // ההוראות לפי המדריך של Peaksoft (ארכיון World of Dragon)
    cricket: {
      he: ['במשחק הזה החיצים הם ג\'ויסטיק, ו-[רווח] הוא הכפתור שלו (אפשר גם [Alt], במק [Option]). החובט משתמש בג\'ויסטיק השמאלי והמגיש בימני, ולכן כאן החיצים מזיזים את שניהם.',
        'הטעינה בשלושה חלקים, ואחרי מסך הפתיחה המשחק מכין את הדמויות עוד כמה דקות. זה לא תקוע.',
        'המשחק שואל כמה שאלות, ועונים במקלדת: [Y] או [N], ורמה: [1] מבחן, [2] מחוז, [3] כפר.',
        'הגשה: לפני הזריקה מזיזים את החץ שמסמן מאיפה המגיש זורק. בצליל השני מזיזים את הג\'ויסטיק כדי לקבוע איזה כדור זה.',
        'חבטה: קודם הג\'ויסטיק קובע את גובה המחבט, אחרי [רווח] את הזווית והמקום. ריצה: ג\'ויסטיק שמאלה רצים, ימינה נשארים.'],
      en: ['In this game the arrow keys are a joystick and [Space] is its button (or [Alt], [Option] on a Mac). The batter uses the left joystick and the bowler the right one, so here the arrows move both.',
        'It loads in three parts, and after the title screen it prepares its figures for a few more minutes. It is not stuck.',
        'The game asks a few questions, answered on the keyboard: [Y] or [N], and a level: [1] test match, [2] county, [3] village green.',
        'Bowling: before the delivery move the arrow that marks where the bowler releases. At the second tone move the joystick to choose the ball.',
        'Batting: first the joystick sets the height of the bat, after [Space] its angle and position. Running: joystick left to run, right to stay.']
    },
    // נבדק במכונה (29.10): CLOAD, ‏RUN, שם הקבוצה, ההקדמה, מסך הקבוצה והתפריט. ההוראות לפי העטיפה המקורית של Peaksoft
    champs: {
      he: ['אתם המנהלים של קבוצה בליגה הרביעית. המטרה: להביא אותה לאליפות הליגה הראשונה, ומשם לגביע אירופה.',
        'קודם כותבים את שם הקבוצה, עד 10 אותיות, ולוחצים [ENTER]. אחר כך מופיעים השחקנים: ליד כל אחד רמת הכישרון שלו, ובצד הדירוג של הקבוצה והכסף בבנק.',
        'בכל שבוע בוחרים: [C] בודקים קבוצות אחרות, את שוק ההעברות ואת המילואים, וקונים שחקנים. [S] מוכרים שחקן. [U] מחליפים עם המחליף. [P] משחקים את משחקי השבוע.',
        'שחקן עולה 10,000 ליש"ט לכל נקודת כישרון, ומכירה מחזירה 5,000. אחרי כל מחזור מופיעים התוצאות, הטבלה, הכנסות מהקהל, משכורות וחדשות: פציעות, הרחקות וחסויות.'],
      en: ['You manage a club in the 4th Division. The goal: take it to the championship of the 1st Division, and on into the European Cup.',
        'First type your team\'s name, up to 10 letters, and press [ENTER]. Then your players appear: beside each one his skill rating, and at the side the team\'s rating and the money in the bank.',
        'Each week choose: [C] check other teams, the transfer market and the reserves, and buy players. [S] sell a player. [U] use the substitute. [P] play the week\'s games.',
        'A player costs £10,000 for each point of skill, and selling brings back £5,000. After each round come the results, the table, gate money, wages and news: injuries, suspensions and sponsorship.']
    },
    // נבדק במכונה (29.10): CLOAD, ‏RUN, מסך הפתיחה, SKILL LEVEL, מפת היער עם האותיות. ההוראות לפי העטיפה המקורית של Peaksoft
    lionht: {
      he: ['אתם ריצ\'רד לב הארי, ובונים צבא למסע הצלב השלישי. האנשים שלכם מפוזרים ביער של אנגליה, והצבא של הנסיך ג\'ון רודף אחריכם.',
        'אחרי מסך הפתיחה בוחרים רמה, [1] עד [5], ולוחצים [ENTER]. [1] הכי קשה.',
        'המשבצות עם האותיות הן הצלבנים. זזים בחיצים אל המשבצת שלהם כדי לאסוף אותם. אות מאוחרת יותר באלף-בית היא קבוצה גדולה יותר.',
        'כדי להמשיך לארץ הקודש יוצאים מהפינה הימנית התחתונה עם לפחות 450 איש. המספר מופיע למעלה משמאל.',
        'הצבא של הנסיך שורף את היער בדרכו אליכם. אפשר להשתמש בזה כדי לפתוח דרך לאנשים שתקועים בין העצים. אם הוא מגיע למשבצת שליד שלכם, הוא מנצח.'],
      en: ['You are Richard the Lionheart, building his forces for the Third Crusade. Your men are scattered through the forest of England, and Prince John\'s army is tracking you down.',
        'After the title screen choose a skill level, [1] to [5], and press [ENTER]. [1] is the hardest.',
        'The lettered squares are your crusaders. Move onto a square with the arrows to collect them. A later letter means a bigger group.',
        'To go on to the Holy Land, leave by the bottom right corner with at least 450 men. The number is shown at the top left.',
        'Prince John\'s army burns the forest as it comes for you. You can use that to open a way to men trapped among the trees. If it reaches the square next to yours, it wins.']
    },
    // נבדק במכונה (29.10): CLOAD, ‏RUN, הפתיחה המוקלדת, ‏BRIEFING?, ‏WHO DARES, WINS, השדה, והחייל זז בחיצים. לפי העטיפה ולפי התוכנית
    sas: {
      he: ['אימון של יחידת ה-SAS: חוצים שדות מוקשים, נזהרים מסיורים ומהמסוקים, ומשמידים את בסיס האויב. תשעה שדות מוקשים, והם נעשים קשים יותר.',
        'אחרי RUN המחשב מקליד את הפתיחה, אות אחרי אות. ל-DO YOU REQUIRE BRIEFING? לוחצים [Y] כדי לקרוא את התדריך המלא (מקש לכל עמוד), או [N] כדי להתחיל.',
        'מחזיקים את החיצים לחוצים כדי לזוז, לא מקישים: המשחק בודק את המקלדת פעם בסיבוב, ולחיצה קצרה לא נקלטת.',
        '[G] זורק רימון: מפוצץ מוקשים ומשמיד בסיס אויב סמוך. [F] יורה טיל מונחה על המסוק הקרוב, רק אחרי שהשמדת בסיס ונכנסת אליו.',
        'התדריך בתוך המשחק מסביר את הכול: מה עושים בכל שדה, ואיך מגיעים לבסיס.'],
      en: ['An SAS training simulation: cross minefields, keep away from patrols and helicopter gunships, and destroy the enemy base. Nine minefields, getting harder.',
        'After RUN the computer types out its opening, letter by letter. At DO YOU REQUIRE BRIEFING? press [Y] to read the full briefing (a key for each page), or [N] to start.',
        'Hold the arrow keys down to move, don\'t tap them: the game checks the keyboard once a round, and a quick tap is missed.',
        '[G] throws a grenade: it blows up mines and knocks out an enemy base next to you. [F] fires a wire-guided missile at the nearest helicopter, only after you have knocked out a base and moved into it.',
        'The briefing inside the game explains everything: what to do on each field, and how to reach the base.']
    },
    // נבדק במכונה (29.10): CLOADM, ‏EXEC, מסך הפתיחה, התפריט, Extra time? ובחירת דמות. ההוראות לפי המדריך המקורי ל-Dragon (המאגר של Tanglewood)
    tangle: {
      he: ['הרפתקה ביער: Schark, יזם עם כוחות קסם, רוצה לכרות את Tanglewood ולבנות משרדים. יש לכם עשרה ימים לעצור אותו.',
        'אחרי מסך הפתיחה לוחצים [1] למשחק חדש. אחר כך בוחרים דמות במספר: [1] עד [5]. אפשר להחליף ביניהן ביער.',
        'החיצים מזיזים את הדמות. פקודות כותבים באנגלית, פועל ושם עצם, ולוחצים [ENTER]: למשל GET, ‏DROP, ‏LOOK או ?.',
        'פקודות מיוחדות: TIME מחליף בין יום ללילה, SLEEP מחזיר כוח בלילה, TRANSFER מעביר חפץ לדמות שלידכם.'],
      en: ['An adventure in the woods: Schark, a property developer with magic powers, wants to cut down Tanglewood and build offices. You have ten days to stop him.',
        'After the title screen press [1] for a new game. Then pick a character by number: [1] to [5]. You can switch between them in the woods.',
        'The arrows move your character. Type commands in English, verb and noun, and press [ENTER]: for example GET, DROP, LOOK or ?.',
        'Special commands: TIME switches between day and night, SLEEP restores energy at night, TRANSFER gives an object to a character next to you.']
    },
    // נבדק במכונה (25.10): צבע, רמה, ריצה, קפיצה, ירי, ניקוד, סוף משחק ושיא
    ranger: {
      he: ['במשחק הזה החיצים הם ג\'ויסטיק, ו-[רווח] הוא הכפתור שלו (אפשר גם [Alt], במק [Option]). בטלפון יש מתחת למסך ידית וכפתור אש.',
        'הטעינה ארוכה, כשלוש דקות, וכשהיא נגמרת המשחק מתחיל לבד. בוחרים צבע רקע: [1] שחור, [2] בהיר, [3] ירוק.',
        'במסך הפתיחה לוחצים [רווח]. ב-SELECT LEVEL בוחרים שלב, [1] הכי קל, והמשחק מתחיל מיד. לא לוחצים [P], כי הוא עוצר את המשחק.',
        '[←] [→] רצים, [↑] קופצים, [↓] מתכופפים, [רווח] או [Alt] יורה. [P] עוצר, ו-[רווח] ממשיך.',
        'אוספים את כל המפתחות ונזהרים מהעטלפים ומהעיניים שיורות מהצדדים. הכרית באמצע הקומה התחתונה מקפיצה חזרה למעלה.'],
      en: ['In this game the arrow keys are a joystick and [Space] is its button (or [Alt], [Option] on a Mac). On a phone there is a stick and a fire button under the screen.',
        'Loading takes about three minutes, and the game starts by itself when it ends. Pick a background colour: [1] black, [2] buff, [3] green.',
        'On the title screen press [Space]. At SELECT LEVEL pick a level, [1] is the easiest, and the game starts at once. Don\'t press [P]: it pauses the game.',
        '[←] [→] run, [↑] jump, [↓] duck, [Space] or [Alt] fires. [P] pauses, and [Space] carries on.',
        'Collect all the keys and watch out for the bats and the eyes that shoot from the sides. The pad in the middle of the bottom floor bounces you back to the top.']
    },
    // נבדק במכונה (25.10): טעינה, שאלות הפתיחה, תנועה בין מקומות, טיפוס, מלאי וניקוד
    adventureland: {
      he: ['הטעינה לוקחת קצת פחות משתי דקות, והמשחק מתחיל לבד.',
        'בהתחלה שלוש שאלות. על {DO YOU HAVE LOWERCASE?} עונים [N] ו[ENTER].',
        'על {PRESS ENTER} לוחצים [ENTER], ועל {RESTORE A PREVIOUSLY SAVED GAME?} עונים [N] ו[ENTER].',
        'משחק מילים באנגלית: כותבים פועל ושם עצם ולוחצים [ENTER]. למשל {CLIMB TREE} (לטפס על העץ), {GET AXE} (להרים את הגרזן), {LIGHT LAMP} (להדליק את המנורה).',
        'שלוש האותיות הראשונות מספיקות: {LIG LAM}. הולכים בשש דרכים: {N S E W UP DOWN} (צפון, דרום, מזרח, מערב, למעלה, למטה).',
        'תיאור המקום תמיד מופיע למעלה במסך. {INVENTORY} מראה מה בידיים, {HELP} נותן רמז, {SCORE} מראה כמה אוצרות נאספו.',
        'המטרה: למצוא 13 אוצרות, שמסומנים בכוכביות כמו {*GOLDEN FISH*}, ולהביא אותם למקום שבו שומרים אותם.'],
      en: ['Loading takes a little under two minutes, and the game starts by itself.',
        'Three questions first. At DO YOU HAVE LOWERCASE? answer [N] and [ENTER].',
        'At PRESS ENTER press [ENTER], and at RESTORE A PREVIOUSLY SAVED GAME? answer [N] and [ENTER].',
        'A word game: type a verb and a noun, then [ENTER]. For example CLIMB TREE, GET AXE, LIGHT LAMP.',
        'The first three letters are enough: LIG LAM. There are six ways to go: N S E W UP DOWN.',
        'The description of the place always stays at the top of the screen. INVENTORY shows what you carry, HELP gives a hint, SCORE shows your treasures.',
        'The goal: find the 13 treasures, marked with stars like *GOLDEN FISH*, and bring them to where they are stored.']
    },
    // נבדק במכונה (26.10): טעינה, שאלות הפתיחה, הרמת חפץ, מלאי, עלייה במדרגות, HELP וניקוד
    pirate: {
      he: ['הטעינה לוקחת קצת פחות משתי דקות, והמשחק מתחיל לבד.',
        'בהתחלה שלוש שאלות. על {DO YOU HAVE LOWERCASE?} עונים [N] ו[ENTER].',
        'על {PRESS ENTER} לוחצים [ENTER], ועל {RESTORE A PREVIOUSLY SAVED GAME?} עונים [N] ו[ENTER].',
        'מתחילים בדירה בלונדון. כותבים פועל ושם עצם באנגלית ולוחצים [ENTER]. למשל {GET RUM} (לקחת את הרום), או {GO STAIRS} (לעלות במדרגות).',
        'שלוש האותיות הראשונות מספיקות. הולכים בשש דרכים: {N S E W UP DOWN}.',
        'תיאור המקום תמיד מופיע למעלה במסך. {INVENTORY} מראה מה בידיים, {HELP} נותן רמז, {SCORE} מראה כמה אוצרות נאספו.',
        'המטרה: להגיע לאי של הפיראטים, למצוא את האוצרות ולהביא אותם לדירה, כמו שכתוב על השלט שם.'],
      en: ['Loading takes a little under two minutes, and the game starts by itself.',
        'Three questions first. At DO YOU HAVE LOWERCASE? answer [N] and [ENTER].',
        'At PRESS ENTER press [ENTER], and at RESTORE A PREVIOUSLY SAVED GAME? answer [N] and [ENTER].',
        'You start in a flat in London. Type a verb and a noun, then [ENTER]. For example GET RUM or GO STAIRS.',
        'The first three letters are enough. There are six ways to go: N S E W UP DOWN.',
        'The description of the place always stays at the top of the screen. INVENTORY shows what you carry, HELP gives a hint, SCORE shows your treasures.',
        'The goal: reach the pirates\' island, find the treasures and bring them back to the flat, as the sign there says.']
    },
    // נבדק במכונה (26.10): טעינה, שאלות הפתיחה, מלאי, HELP, תנועה למסדרון, LOOK ו-SCORE
    mission: {
      he: ['הטעינה לוקחת קצת פחות משתי דקות, והמשחק מתחיל לבד.',
        'בהתחלה שלוש שאלות. על {DO YOU HAVE LOWERCASE?} עונים [N] ו[ENTER].',
        'על {PRESS ENTER} לוחצים [ENTER], ועל {RESTORE A PREVIOUSLY SAVED GAME?} עונים [N] ו[ENTER].',
        'אתם סוכן חשאי בכור גרעיני אוטומטי, ומישהו הטמין בו פצצת זמן. מתחילים בחדר תדריך.',
        'כותבים פועל ושם עצם באנגלית ולוחצים [ENTER]. למשל {GO WEST} (ללכת מערבה). שלוש האותיות הראשונות מספיקות. הולכים בשש דרכים: {N S E W UP DOWN}.',
        'תיאור המקום תמיד מופיע למעלה במסך. {INVENTORY} מראה מה בידיים, ו-{HELP} נותן רמז. כאן אין ניקוד: או שמצליחים, או ש...',
        'יש לחץ של זמן: אל תתעכבו. הגלאי שבידיים זוהר בירוק כל עוד הפצצה לא עומדת להתפוצץ.'],
      en: ['Loading takes a little under two minutes, and the game starts by itself.',
        'Three questions first. At DO YOU HAVE LOWERCASE? answer [N] and [ENTER].',
        'At PRESS ENTER press [ENTER], and at RESTORE A PREVIOUSLY SAVED GAME? answer [N] and [ENTER].',
        'You are a secret agent in an automated nuclear reactor, and someone has planted a time bomb. You start in a briefing room.',
        'Type a verb and a noun, then [ENTER]. For example GO WEST. The first three letters are enough. There are six ways to go: N S E W UP DOWN.',
        'The description of the place always stays at the top of the screen. INVENTORY shows what you carry, and HELP gives a hint. There is no score here: either you make it, or...',
        'Time is short, so don\'t dawdle. The detector you carry glows green while the bomb is still safe.']
    },
    // נבדק במכונה (26.10): טעינה, שאלות הפתיחה, פתיחת הארון, תנועה, הרמת הסכין ומלאי
    voodoo: {
      he: ['הטעינה לוקחת קצת פחות משתי דקות, והמשחק מתחיל לבד.',
        'בהתחלה שלוש שאלות. על {DO YOU HAVE LOWERCASE?} עונים [N] ו[ENTER].',
        'על {PRESS ENTER} לוחצים [ENTER], ועל {RESTORE A PREVIOUSLY SAVED GAME?} עונים [N] ו[ENTER].',
        'הרוזן כריסטו קולל בקללת וודו, ואתם צריכים להסיר אותה. מתחילים בקפלה של הטירה, ליד ארון מתים סגור.',
        'כותבים פועל ושם עצם באנגלית ולוחצים [ENTER]. למשל {OPEN COFFIN} (לפתוח את הארון), {GO EAST} (ללכת מזרחה), {GET KNIFE} (להרים את הסכין). שלוש האותיות הראשונות מספיקות.',
        'תיאור המקום תמיד מופיע למעלה במסך. הולכים בשש דרכים: {N S E W UP DOWN}, ו-{INVENTORY} מראה מה בידיים.',
        'כאן אין ניקוד ו-{HELP} לא עוזר: בודקים כל חפץ ומנסים דברים.'],
      en: ['Loading takes a little under two minutes, and the game starts by itself.',
        'Three questions first. At DO YOU HAVE LOWERCASE? answer [N] and [ENTER].',
        'At PRESS ENTER press [ENTER], and at RESTORE A PREVIOUSLY SAVED GAME? answer [N] and [ENTER].',
        'Count Cristo has been cursed with a voodoo hex, and you must lift it. You start in the castle chapel, next to a closed coffin.',
        'Type a verb and a noun, then [ENTER]. For example OPEN COFFIN, GO EAST, GET KNIFE. The first three letters are enough.',
        'The description of the place always stays at the top of the screen. There are six ways to go: N S E W UP DOWN, and INVENTORY shows what you carry.',
        'There is no score here and HELP doesn\'t help: examine everything and try things out.']
    },
    // נבדק במכונה (28.10, גם ב-WebKit): טעינה, שתי שאלות פתיחה (אין כאן שאלה על אותיות קטנות), HELP, מלאי, LOOK, SCORE (אין ניקוד) ושמירה לקלטת
    count: {
      he: ['הטעינה לוקחת קצת פחות משתי דקות, והמשחק מתחיל לבד.',
        'בהתחלה שתי שאלות: על {PRESS ENTER} לוחצים [ENTER], ועל {RESTORE A PREVIOUSLY SAVED GAME?} עונים [N] ו[ENTER].',
        'מתעוררים במיטת נחושת גדולה: מישהו השכיב אתכם לישון, כבר אחר הצהריים ואיחרתם לקום. איפה אתם, ומי הרוזן?',
        'כותבים פועל ושם עצם באנגלית ולוחצים [ENTER]. למשל {LOOK} (להסתכל), {GO NORTH} (ללכת צפונה), {INVENTORY} (מה בידיים). שלוש האותיות הראשונות מספיקות.',
        'תיאור המקום תמיד מופיע למעלה במסך. הולכים בשש דרכים: {N S E W UP DOWN}. כשנתקעים, {HELP} נותן רמז.',
        'כאן אין ניקוד. {SAVE GAME} שומר את המשחק לקלטת, ואפשר להמשיך אחר כך.'],
      en: ['Loading takes a little under two minutes, and the game starts by itself.',
        'Two questions first: at PRESS ENTER press [ENTER], and at RESTORE A PREVIOUSLY SAVED GAME? answer [N] and [ENTER].',
        'You wake up in a large brass bed: someone put you to bed, it is already afternoon and you overslept. Where are you, and who is the Count?',
        'Type a verb and a noun, then [ENTER]. For example LOOK, GO NORTH, INVENTORY. The first three letters are enough.',
        'The description of the place always stays at the top of the screen. There are six ways to go: N S E W UP DOWN. When stuck, HELP gives a hint.',
        'There is no score here. SAVE GAME saves the game to tape, so you can carry on later.']
    }
  };
  // מה קורה אחרי הטעינה ומה לוחצים: השורה האחרונה של "איך טוענים", וגם ההודעה מתחת לכפתור האדום
  // (גונן, 28.10: נתקע במסכים שמחכים למקש, כי "איך טוענים" אמר רק שהמשחק מתחיל לבד)
  const ADVQ = ['כשהטעינה נגמרת המשחק שואל שלוש שאלות: עונים [N] ו-[ENTER], אחר כך [ENTER], ושוב [N] ו-[ENTER].',
    'When loading ends the game asks three questions: answer [N] and [ENTER], then [ENTER], then [N] and [ENTER] again.'];
  const AFTER = {
    eggs: ['המשחק מופיע. מתחילים ב[רווח].', 'The game appears. Press [Space] to start.'],
    blockdown: ['כשהטעינה נגמרת המשחק מתחיל לבד. מתחילים ב[רווח].', 'When loading ends the game starts by itself. Press [Space] to start.'],
    dragontet: ['מופיע תפריט: בוחרים ב[↑] [↓] ומאשרים ב[ENTER].', 'A menu appears: choose with [↑] [↓] and confirm with [ENTER].'],
    escape: ['מופיעים מסך הפתיחה וההקדמה, ואז המסדרון: [↑] קדימה, [←] [→] מסתובבים.', 'The title screen and the introduction appear, then the corridor: [↑] forward, [←] [→] turn.'],
    spores: ['כשהטעינה נגמרת בוחרים צבע: [1], [2] או [3]. במסך הפתיחה לוחצים מקש, ב-JOYSTICK OR KEYBOARD? לוחצים [K], וב-1 OR 2 PLAYERS? לוחצים [1].', 'When loading ends pick a colour: [1], [2] or [3]. On the title screen press a key, at JOYSTICK OR KEYBOARD? press [K], and at 1 OR 2 PLAYERS? press [1].'],
    diablero: ['מופיע מסך הפתיחה: לוחצים מקש, ומקלידים פקודות באנגלית, למשל LOOK ו-[ENTER].', 'The title screen appears: press a key, then type commands in English, for example LOOK and [ENTER].'],
    invrev: ['ב-JOYSTICKS? לוחצים [N], ב-NEED INSTRUCTIONS? לוחצים [N], ואז בוחרים שחקנים, יריות ומהירות במספרים.', 'At JOYSTICKS? press [N], at NEED INSTRUCTIONS? press [N], then choose players, shots and speed with the number keys.'],
    devil: ['כשהטעינה נגמרת בוחרים צבע: [1], [2] או [3]. ב-SELECT LEVEL בוחרים רמה, [0] עד [5], ומתחילים בכפתור.', 'When loading ends pick a colour: [1], [2] or [3]. At SELECT LEVEL pick a level, [0] to [5], and start with the button.'],
    phantom: ['המשחק שואל על ההוראות: [N] מדלג, [Y] מציג אותן.', 'The game asks about the instructions: [N] skips them, [Y] shows them.'],
    grabber: ['כשהטעינה נגמרת בוחרים צבע: [1], [2] או [3]. אחרי מסך הפתיחה, ב-NUMBER OF PLAYERS? לוחצים [1].', 'When loading ends pick a colour: [1], [2] or [3]. After the title screen, at NUMBER OF PLAYERS? press [1].'],
    draconian: ['כשהטעינה נגמרת בוחרים צבע: [1], [2] או [3]. במסך הפתיחה לוחצים [רווח], וכשמופיע NUMBER OF PLAYERS? לוחצים [1].', 'When loading ends pick a colour: [1], [2] or [3]. On the title screen press [Space], and when NUMBER OF PLAYERS? appears press [1].'],
    alcatraz: ['כשמופיע OK מקלידים {RUN}. ל-DRAGON OR TANDY COLOR? לוחצים [D], ול-JOYSTICKS? לוחצים [Y].', 'When OK appears type {RUN}. At DRAGON OR TANDY COLOR? press [D], and at JOYSTICKS? press [Y].'],
    lionht: ['כשמופיע OK מקלידים {RUN}. אחרי מסך הפתיחה, ב-SKILL LEVEL (1-5)? מקלידים מספר ו-[ENTER].', 'When OK appears type {RUN}. After the title screen, at SKILL LEVEL (1-5)? type a number and [ENTER].'],
    sas: ['כשמופיע OK מקלידים {RUN}. הפתיחה מוקלדת לאט, כמו במכונת כתיבה. ל-BRIEFING? לוחצים [Y] או [N].', 'When OK appears type {RUN}. The opening types out slowly, like a typewriter. At BRIEFING? press [Y] or [N].'],
    champs: ['כשמופיע OK מקלידים {RUN}. המשחק שואל WHICH TEAM WOULD YOU LIKE TO BE?: כותבים שם ולוחצים [ENTER].', 'When OK appears type {RUN}. The game asks WHICH TEAM WOULD YOU LIKE TO BE?: type a name and press [ENTER].'],
    cricket: ['מופיע מסך הפתיחה של Cricket, והמשחק ממשיך לטעון ולהתכונן עוד כמה דקות. אחר כך עונים על השאלות במקלדת.', 'The Cricket title screen appears, and the game goes on loading and preparing for a few minutes. Then answer the questions on the keyboard.'],
    tangle: ['כשמופיע OK מקלידים {EXEC}. אחרי מסך הפתיחה לוחצים [1] למשחק חדש.', 'When OK appears type {EXEC}. After the title screen press [1] for a new game.'],
    ranger: ['כשהטעינה נגמרת בוחרים צבע: [1], [2] או [3]. במסך הפתיחה לוחצים [רווח], וב-SELECT LEVEL בוחרים שלב.', 'When loading ends pick a colour: [1], [2] or [3]. On the title screen press [Space], and at SELECT LEVEL pick a level.'],
    cuthbert: ['אחרי הטעינה מופיע LICENSED BY MICRODEAL ונשאר כחמש עד שבע דקות. זה לא תקוע: כך המשחק בנוי. כשמופיע הג\'ונגל, לוחצים [רווח].', 'After loading, LICENSED BY MICRODEAL appears and stays for about five to seven minutes. It is not stuck: the game is built that way. When the jungle appears, press [Space].'],
    dungeon: ['בסוף הטעינה בוחרים צבע: [1], [2] או [3]. במסך הפתיחה לוחצים [רווח], וב-SELECT LEVEL בוחרים רמה, [1] עד [3].', 'At the end of loading pick a colour: [1], [2] or [3]. On the title screen press [Space], and at SELECT LEVEL pick a level, [1] to [3].'],
    athletyx: ['במסך LICENSED BY MICRODEAL ובמסך הפתיחה לוחצים [רווח]. כשמופיע SELECT PLAYERS לוחצים [1] (או [2] לשני שחקנים), והריצה מתחילה.', 'On the LICENSED BY MICRODEAL screen and the title screen press [Space]. When SELECT PLAYERS appears press [1] (or [2] for two players), and the race begins.'],
    adventureland: ADVQ, pirate: ADVQ, mission: ADVQ, voodoo: ADVQ,
    count: ['כשהטעינה נגמרת המשחק שואל שתי שאלות: לוחצים [ENTER], ואחר כך [N] ו-[ENTER].', 'When loading ends the game asks two questions: press [ENTER], then [N] and [ENTER].']
  };
  // מה המשחק, בשורה אחת מתחת לשם (גונן, 25.10: "לא מבינים מה זה המשחק"). השם עצמו נשאר כמו שהמחבר כתב
  const DESC = {
    eggs: ['תופסים בסל את הביצים שהדרקון מטיל. לשחקן אחד.', 'Catch the dragon\'s eggs in a basket. 1 player.'],
    blockdown: ['קוביות נופלות: משלימים שורות. לשחקן אחד או לשניים.', 'Falling blocks: complete the lines. 1 or 2 players.'],
    dragontet: ['קוביות נופלות: משלימים שורות. לשחקן אחד או לשניים.', 'Falling blocks: complete the lines. 1 or 2 players.'],
    escape: ['מבוך תלת-ממדי של חידות: מוצאים דמויות עם רמזים, ומפענחים את הקוד של המעלית כדי לצאת מהבניין. לשחקן אחד.', 'A 3D puzzle maze: find characters with clues, and work out the elevator code to get out of the building. 1 player.'],
    phantom: ['מבוך תלת-ממדי: צדים רוחות רפאים לפני שהן תופסות אתכם. לשחקן אחד.', '3D maze: hunt the phantoms before they catch you. 1 player.'],
    cuthbert: ['רצים בג\'ונגל, קופצים מעל בורות ובולי עץ ויורדים בסולמות למנהרה, נגד השעון. בג\'ויסטיק.', 'Run through the jungle, jump pits and logs and climb down ladders to the tunnel, against the clock. Joystick.'],
    athletyx: ['תחרות אתלטיקה: ריצה ועוד מקצועות, נגד השעון. בג\'ויסטיק. נכתב רק ל-Dragon.', 'An athletics contest: a sprint and more events, against the clock. Joystick. Written only for the Dragon.'],
    spores: ['נבגים מהחלל ישנים בקבוצות של שמונה: פוגעים בכל אחד פעמיים, לפני שהדלק נגמר והם מתעוררים. בחיצים.', 'Space spores sleep in groups of eight: hit each one twice, before your fuel runs out and they wake. Arrow keys.'],
    diablero: ['הרפתקת טקסט במדבר: מקלידים פקודות באנגלית ומגלים לאן הדרך מובילה. לשחקן אחד.', 'A text adventure in the desert: type commands in English and find out where the trail leads. 1 player.'],
    invrev: ['Space Invaders הפוך: אתם הפולש האחרון, ונלחמים בספינות של בני האדם. בחיצים, לאחד או לשניים.', 'Space Invaders turned around: you are the last invader, fighting the human ships. Arrow keys, 1 or 2 players.'],
    devil: ['טנק בתחתית המסך נגד עטלפי ערפד, רובוטים ו-Sproings, ובסוף גם השטן עצמו. בג\'ויסטיק.', 'A tank at the bottom of the screen against vampire bats, robots and Sproings, and in the end the Devil himself. Joystick.'],
    dungeon: ['רצים במסדרונות של מבוך ויורים ביצורים ובדלתות, נגד השעון. בג\'ויסטיק. נכתב רק ל-Dragon.', 'Race down dungeon corridors, shooting creatures and doors against the clock. Joystick. Written only for the Dragon.'],
    grabber: ['שני מבוכים בבת אחת: אוספים מטילים ומחזירים אותם למרכז, ובורחים ממפלצות. בג\'ויסטיק.', 'Two mazes at once: collect the bars, bring them back to the middle and escape the monsters. Joystick.'],
    draconian: ['טסים בחלל לכל כיוון, משמידים בסיסים ומצילים אסטרונאוטים, לפני שהדרקון מגיע. בג\'ויסטיק.', 'Fly through space in any direction, destroy bases and rescue astronauts before the dragon arrives. Joystick.'],
    alcatraz: ['בורחים מכלא Alcatraz II ונזהרים מהשומרים. בג\'ויסטיק.', 'Escape from the prison of Alcatraz II and keep away from the guards. Joystick.'],
    lionht: ['ריצ\'רד לב הארי אוסף את הצלבנים שלו ביער, ובורח מהצבא של הנסיך ג\'ון. בחיצים.', 'Richard the Lionheart gathers his crusaders in the forest and escapes Prince John\'s army. Arrow keys.'],
    sas: ['אימון SAS: חוצים שדות מוקשים, נזהרים מסיורים וממסוקים, ומשמידים את בסיס האויב. בחיצים.', 'SAS training: cross minefields, dodge patrols and gunships, and destroy the enemy base. Arrow keys.'],
    champs: ['מנהלים קבוצת כדורגל מהליגה הרביעית עד גביע אירופה: קונים, מוכרים ומשחקים. לשחקן אחד.', 'Manage a football club from the 4th Division to the European Cup: buy, sell and play. 1 player.'],
    cricket: ['משחק קריקט של 40 אוברים: מגישים, חובטים ורצים. נגד המחשב או בשניים. בג\'ויסטיק.', 'A 40-over cricket match: bowl, bat and run. Against the computer or for two. Joystick.'],
    tangle: ['הרפתקה ביער עם חמש דמויות: עוצרים את Schark לפני שהוא כורת את היער. בחיצים ובפקודות.', 'A woodland adventure with five characters: stop Schark before he cuts down the woods. Arrows and typed commands.'],
    ranger: ['רצים, קופצים ויורים: אוספים מפתחות ואוצרות בין עטלפים ועיניים. בג\'ויסטיק.', 'Run, jump and shoot: collect keys and treasure past bats and eyes. Joystick.'],
    count: ['הרפתקת מילים: מתעוררים במיטה זרה, בארץ של רוזן מסתורי. ההרפתקה החמישית של Scott Adams.', 'A text adventure: wake up in a strange bed, in the land of a mysterious Count. Scott Adams\' fifth adventure.'],
    voodoo: ['הרפתקת מילים: מסירים קללת וודו מהרוזן כריסטו, בטירה מלאת סודות. ההרפתקה הרביעית בסדרה.', 'A text adventure: lift a voodoo curse from Count Cristo in a castle full of secrets. The fourth adventure in the series.'],
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
  // ארון הקלטות (גונן, 27.10): ארון רזה, מגירות לפי סדר כרונולוגי, ובכל מגירה המשחקים לפי השנה. לחיצה על משחק פותחת
  // את דף המשחק ליד המכונה (המכונה נשארת על המסך, קטנה יותר), ולכל משחק כתובת משלו: /lab/1982/<slug>/.
  // הנתונים בקטלוג (games.js). מה פתוח נזכר בדפדפן הזה. המגירה של "הקלטות שלי" כתובה בדף עצמו.
  // XRoar כותב "XRoar" בכותרת הדף כשהוא נדלק. הכותרת נשארת שלנו (בדף של משחק: שם המשחק, גם כשמשתפים קישור)
  { const td = Object.getOwnPropertyDescriptor(Document.prototype, 'title');
    if (td && td.set) Object.defineProperty(document, 'title', { configurable: true, get() { return td.get.call(document); }, set(v) { if (v !== 'XRoar') td.set.call(document, v); } }); }
  const G = window.D32_GAMES || { drawers: [], games: {} };
  const BASE = EN ? '/en/lab/1982/' : '/lab/1982/';
  const meta = id => G.games[id] || {};
  const L2 = (pair) => pair ? pair[EN ? 1 : 0] : '';
  // כל המגירות סגורות בכל כניסה, בלי זיכרון (גונן, 28.10); מנקים את מה שנשמר פעם
  try { localStorage.removeItem('d32-lab-drawers'); } catch (e) {}
  // שנה או טווח שנים: תגית משמאל לימין, כדי שבעברית "1983–84" לא יתהפך (גונן, 27.10)
  const yearChip = y => { const s = document.createElement('span'); s.className = 'yr'; s.dir = 'ltr'; s.textContent = y; return s; };
  const yearKey = id => parseInt(meta(id).year, 10) || 9999;
  const grids = {};
  for (const dr of G.drawers) {
    if (dr.key === 'type') continue;   // typein.js בונה אותה, ושם אותה במקום שלה בסדר
    const ids = TAPES.filter(t => meta(t[0]).drawer === dr.key).map(t => t[0]);
    const d = document.createElement('details');
    d.className = 'drawer';
    d.dataset.drawer = dr.key;
    d.open = false;
    d.innerHTML = '<summary><span class="drawer-name"></span> <span class="drawer-count"></span></summary><div class="drawer-body"></div>';
    d.querySelector('.drawer-name').textContent = EN ? dr.en : dr.he;
    d.querySelector('.drawer-count').textContent = ids.length;
    if (dr.years) d.querySelector('summary').appendChild(yearChip(dr.years));
    const body = d.querySelector('.drawer-body');
    if (dr.note) {
      const p = document.createElement('p');
      p.className = 'drawer-note';
      p.textContent = L2(dr.note);
      if (dr.link) { const a = document.createElement('a'); a.href = dr.link; a.rel = 'noopener'; a.textContent = dr.link.replace(/^https?:\/\/(www\.)?|\/$/g, ''); p.append(' ', a); }
      body.appendChild(p);
    }
    // ברכה של המחבר, במילים שלו ובאנגלית שלו, עם חתימה; בדף העברי גם תרגום קטן (Scott Adams, 28.10; גונן: "מאשר הכל")
    if (dr.quote) {
      const q = document.createElement('blockquote');
      q.className = 'drawer-quote';
      q.lang = 'en'; q.dir = 'ltr';
      const t = document.createElement('p'); t.textContent = '\u201C' + dr.quote.text + '\u201D';
      const c = document.createElement('footer'); c.textContent = '\u2014 ' + dr.quote.sign;
      q.append(t, c);
      body.appendChild(q);
      if (!EN && dr.quote.he) { const h = document.createElement('p'); h.className = 'drawer-note drawer-quote-he'; h.textContent = 'בעברית: ' + dr.quote.he; body.appendChild(h); }
    }
    for (const [g, he, en] of dr.groups || [[null]]) {
      if (g) { const h = document.createElement('p'); h.className = 'drawer-group'; h.textContent = EN ? en : he; body.appendChild(h); }
      const list = document.createElement('div');
      list.className = 'rows';
      body.appendChild(list);
      grids[dr.key + (g ? ':' + g : '')] = list;
    }
    box.appendChild(d);
  }
  // עוד משחק טוב שלא על המדף: ב-Dunjunz יש חלקים מהמשחק המקורי של Bug-Byte בלי רשות, אז רק קישור לאתר של המחבר
  if (grids.community) {
    const more = document.createElement('p');
    more.className = 'drawer-note drawer-more';
    const a = document.createElement('a');
    a.href = 'https://www.6809.org.uk/dunjunz/';
    a.rel = 'noopener';
    a.textContent = 'Dunjunz';
    more.append(EN ? 'More to play: ' : 'עוד משחק: ', a, EN ? ' by Ciaran Anscomb, on his own site.' : ' של Ciaran Anscomb, באתר שלו.');
    grids.community.after(more);
  }
  const mineDrawer = document.getElementById('drawer-mine');
  const openDrawerOf = b => { const d = b && b.closest('details.drawer'); if (d) d.open = true; };
  // צלמית: חלק קטן מצילום המסך של המשחק (מהמכונה שלנו), מוגדל בפיקסלים חדים
  function icon(id) {
    const m = meta(id), s = document.createElement('span');
    s.className = 'ic';
    if (m.icon) { const [x, y, w] = m.icon, k = 32 / w; s.style.backgroundImage = 'url(/lab/1982/shots/' + id + '.png)'; s.style.backgroundSize = (256 * k) + 'px ' + (192 * k) + 'px'; s.style.backgroundPosition = (-x * k) + 'px ' + (-y * k) + 'px'; }
    return s;
  }
  // הקרדיט: מי כתב, והרשות (או התיעוד והרישיון)
  function creditLine(id, credit) {
    const by = document.createElement('p');
    by.className = 'tape-credit';
    if (!credit) {   // שלנו: תוכנית BASIC מתוך האפליקציה
      const a = document.createElement('a');
      a.href = 'https://github.com/gonenya-create/dragon32/blob/main/assets/dragon/tapes/' + id + '.bas';
      a.rel = 'noopener';
      a.textContent = EN ? 'the program on GitHub' : 'התוכנית ב-GitHub';
      by.append(EN ? 'By Dragon 1982 (Gonen Yarom), 2026 · ' : 'מאת Dragon 1982 (גונן ירום), 2026 · ', a);
      return by;
    }
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
      by.append(EN ? 'By ' : 'מאת ', who, ' · ', docs, EN ? ' · removed on request' : ' · יוסר לפי בקשה');
    } else if (credit[4] === 'adams') {
      docs.textContent = 'msadams.com';
      docs.rel = 'noopener';
      by.append(EN ? 'By ' : 'מאת ', who, ' · ', EN ? 'with his permission · ' : 'באישורו · ', docs, EN ? ' · removed on request' : ' · יוסר לפי בקשה');
    } else if (credit[4] === 'hughey') {
      // הרשות במכתב שלו מ-1997 (ארכיון CLEAR): "distribute them as desired, in whatever format"
      docs.textContent = EN ? 'his permission' : 'הרשות שלו';
      docs.rel = 'noopener';
      by.append(EN ? 'By ' : 'מאת ', who, ' · ', docs, EN ? ' · removed on request' : ' · יוסר לפי בקשה');
    } else if (credit[4] === 'love') {
      // הרשות במייל מהמחבר (Tim Love, ‏Harry Whitehouse, 29.10.2026). הקישור: הדף שלו על המשחק
      docs.textContent = EN ? 'with his permission' : 'באישורו';
      docs.rel = 'noopener';
      by.append(EN ? 'By ' : 'מאת ', who, ' · ', docs, EN ? ' · removed on request' : ' · יוסר לפי בקשה');
    } else if (credit[4] === 'mit') {
      // קוד פתוח: הרישיון (MIT) והמאגר הרשמי
      docs.textContent = EN ? 'MIT licence' : 'רישיון MIT';
      site.textContent = EN ? 'source code' : 'קוד המקור';
      by.append(EN ? 'By ' : 'מאת ', who, ' · ', docs, ' · ', site);
      return by;
    } else by.append(EN ? 'By ' : 'מאת ', who, ' · ', docs);
    if (credit[2]) by.append(' · ', site);
    if (credit[3]) { const lic = document.createElement('a'); lic.href = credit[3]; lic.textContent = 'GPL v3'; by.append(' · ', lic); }
    return by;
  }
  // שורה בארון: צלמית, שם, תגית אחת ושנה
  const buttons = [];
  const order = TAPES.map((t, i) => [t, i]).sort((a, b) => (yearKey(a[0][0]) - yearKey(b[0][0])) || (a[1] - b[1]));
  for (const [t, i] of order) {
    const [id, he, en, kind] = t, m = meta(id);
    const list = grids[m.drawer + (m.group ? ':' + m.group : '')];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tape row';
    b.dataset.id = id;
    const nm = document.createElement('bdi');
    nm.className = 'nm';
    nm.textContent = EN ? en : he;
    const tg = document.createElement('span');
    tg.className = 'tg';
    tg.textContent = L2(m.tag);
    const txt = document.createElement('span');
    txt.className = 'txt';
    const line = document.createElement('span');
    line.className = 'meta';
    line.append(tg);
    if (m.year) line.appendChild(yearChip(m.year));
    txt.append(nm, line);
    b.append(icon(id), txt);
    b.addEventListener('click', () => openGame(id, true));
    buttons[i] = b;
    if (list) list.appendChild(b);
  }
  // ---------- דף המשחק: נפתח במקום הארון, והמכונה נשארת ----------
  const shelfSec = box.closest('.shelf');
  const view = document.createElement('div');
  view.className = 'game-view';
  view.hidden = true;
  shelfSec.appendChild(view);
  const statusHome = status && status.parentNode, statusNext = status && status.nextSibling;
  const baseTitle = document.title;
  const T2 = (he, en) => EN ? en : he;
  let viewId = null, inTape = null;   // המשחק שהדף שלו פתוח, והקלטת שברשמקול (null: "הקלטות שלי" או כלום)
  // הקלידו CLOAD/CLOADM בדף של משחק, בלי שהקלטת שלו ברשמקול: המכונה עושה מה שהייתה עושה (קוראת את מה שיש ברשמקול),
  // ומתחת לכפתור האדום מופיעה תזכורת (גונן, 28.10: ?FM ERROR כשהקליד CLOADM לפני הכפתור)
  window.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !viewId || inTape === viewId || view.hidden || !status || findRam() < 0) return;
    const last = (screenRows().filter(r => r.trim()).pop() || '').trim();
    if (!/^CLOAD/.test(last)) return;
    status.textContent = T2('הקלטת של המשחק עוד לא ברשמקול. קודם לוחצים על הכפתור האדום, ואחר כך מקלידים שוב ' + (last.startsWith('CLOADM') ? 'CLOADM' : 'CLOAD') + '.',
      'The game\'s tape is not in the recorder yet. First press the red button, then type ' + (last.startsWith('CLOADM') ? 'CLOADM' : 'CLOAD') + ' again.');
    const go = view.querySelector('.gv-go');
    if (go) { go.classList.remove('nudge'); void go.offsetWidth; go.classList.add('nudge'); }
    // בטלפון הכפתור מתחת למקלדת: מגללים אליו, כדי שיראו את התזכורת
    if (go) { const r = go.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) go.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }, true);
  function loadSteps(id, kind) {
    const m = meta(id), steps = [];
    steps.push(T2('לוחצים על הכפתור האדום, והקלטת נכנסת לרשמקול.', 'Press the red button, and the tape goes into the recorder.'));
    if (!kind) steps.push(T2('מקלידים {CLOAD} ו-[ENTER]. אחרי כמה שניות מופיע OK.', 'Type {CLOAD} and [ENTER]. After a few seconds OK appears.'), T2('מקלידים {RUN} ו-[ENTER].', 'Type {RUN} and [ENTER].'));
    else if (kind === 'm') steps.push(T2('מקלידים {CLOADM} ו-[ENTER]. כשמופיע OK, מקלידים {EXEC} ו-[ENTER].', 'Type {CLOADM} and [ENTER]. When OK appears, type {EXEC} and [ENTER].'));
    else steps.push(T2('מקלידים {CLOADM} ו-[ENTER]. קודם מופיע S, ואחר כך F ושם הקלטת.', 'Type {CLOADM} and [ENTER]. First S appears, then F and the tape\'s name.'));
    if (m.load && L2(m.load)) steps.push(T2('הטעינה לוקחת ' + m.load[0] + ', כמו קלטת אמיתית.', 'Loading takes ' + m.load[1] + ', like a real tape.'));
    if (AFTER[id]) steps.push(T2(...AFTER[id]));
    else if (kind === 'a') steps.push(T2('כשהטעינה נגמרת, המשחק מתחיל לבד.', 'When loading ends, the game starts by itself.'));
    return steps;
  }
  function playLines(id, kind) {
    if (HOWTO[id]) return EN ? HOWTO[id].en : HOWTO[id].he;
    // תוכניות ה-BASIC שלנו: עונים במקלדת, ואחר כך קוראים את הקוד
    return [T2('התוכנית שואלת, ואתם עונים במקלדת ולוחצים [ENTER].', 'The program asks, and you answer on the keyboard and press [ENTER].'),
      T2('[BREAK] עוצר. {LIST} מראה את כל הקוד, ו-{RUN} מריץ שוב.', '[BREAK] stops it. {LIST} shows the whole program, and {RUN} runs it again.'),
      T2('אפשר לשנות שורה: מקלידים אותה מחדש עם אותו מספר, ומריצים.', 'You can change a line: type it again with the same number, and run it.')];
  }
  function openGame(id, push) {
    const t = TAPES.find(x => x[0] === id), m = meta(id);
    if (!t) return;
    viewId = id;
    const [, he, en, kind, credit] = t, name = EN ? en : he, b = buttons[TAPES.indexOf(t)];
    view.textContent = '';
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'gv-back';
    back.textContent = T2('→ חזרה לארון', '← Back to the cabinet');
    back.addEventListener('click', () => closeGame(true));
    const top = document.createElement('div');
    top.className = 'gv-top';
    const info = document.createElement('div');
    info.className = 'gv-info';
    const h = document.createElement('h3');
    h.className = 'gv-title';
    h.innerHTML = '<bdi></bdi>';
    h.firstChild.textContent = name;
    const desc = document.createElement('p');
    desc.className = 'gv-desc';
    desc.textContent = DESC[id] ? DESC[id][EN ? 1 : 0] : L2(m.about && [m.about.he[0], m.about.en[0]]);
    const tags = document.createElement('p');
    tags.className = 'gv-tags';
    for (const x of [L2(m.tag), L2(m.players)]) if (x) { const s = document.createElement('span'); s.textContent = x; tags.appendChild(s); }
    if (m.year) tags.appendChild(yearChip(m.year));
    if (m.load && L2(m.load)) { const s = document.createElement('span'); s.textContent = T2('טעינה: ', 'Loading: ') + L2(m.load); tags.appendChild(s); }
    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'gv-go';
    go.textContent = T2('▶ הכנס את הקלטת לרשמקול', '▶ Put the tape in the recorder');
    go.addEventListener('click', () => load(id, name, b, false, kind));
    info.append(h, desc, tags, go);
    if (status) info.appendChild(status);
    const pic = document.createElement('img');
    pic.className = 'gv-shot';
    pic.src = '/lab/1982/shots/' + id + '.png';
    pic.alt = T2('צילום מסך מהמשחק, מהמכונה שלנו', 'A screenshot of the game, from our machine');
    pic.width = 256; pic.height = 192;
    top.append(info, pic);
    // שלוש לשוניות: איך טוענים, איך משחקים, על המשחק
    const tabs = document.createElement('div');
    tabs.className = 'gv-tabs';
    tabs.setAttribute('role', 'tablist');
    const panes = [];
    const mk = (label, fill) => {
      const tb = document.createElement('button');
      tb.type = 'button';
      tb.setAttribute('role', 'tab');
      tb.textContent = label;
      const pane = document.createElement('div');
      pane.className = 'gv-pane';
      pane.setAttribute('role', 'tabpanel');
      fill(pane);
      tb.addEventListener('click', () => { tabs.querySelectorAll('button').forEach(x => x.setAttribute('aria-selected', x === tb ? 'true' : 'false')); panes.forEach(p => { p.hidden = p !== pane; }); });
      tabs.appendChild(tb);
      panes.push(pane);
    };
    mk(T2('איך טוענים', 'How to load'), pane => { const ol = document.createElement('ol'); for (const s of loadSteps(id, kind)) ol.appendChild(keyLine(s)); pane.appendChild(ol); });
    mk(T2('איך משחקים', 'How to play'), pane => {
      const ul = document.createElement('ul');
      ul.className = 'howto-list';
      for (const s of playLines(id, kind)) ul.appendChild(keyLine(s));
      const always = document.createElement('li');
      always.className = 'howto-always';
      always.textContent = T2('נתקעתם? טעינה מחדש של הדף תמיד מפעילה את המחשב מחדש.', 'Stuck? Reloading the page always restarts the computer.');
      ul.appendChild(always);
      pane.appendChild(ul);
    });
    mk(T2('על המשחק', 'About'), pane => {
      // העטיפה המקורית (גונן, 30.10), רק כשיש עליה רשות: תמונה קטנה עם קרדיט וקישור למקור, ולחיצה פותחת אותה בגדול
      if (m.cover) {
        const fig = document.createElement('figure');
        fig.className = 'gv-cover';
        const a = document.createElement('a');
        a.href = m.cover.src; a.target = '_blank'; a.rel = 'noopener';
        const im = document.createElement('img');
        im.src = m.cover.src; im.loading = 'lazy'; im.alt = T2('העטיפה המקורית של ', 'The original cover of ') + name;
        a.appendChild(im);
        const cap = document.createElement('figcaption');
        cap.append(L2(m.cover.credit) + ' ');
        const src = document.createElement('a');
        src.href = m.cover.link; src.target = '_blank'; src.rel = 'noopener';
        const bd = document.createElement('bdi'); bd.textContent = L2(m.cover.from); src.appendChild(bd);
        cap.appendChild(src);
        fig.append(a, cap);
        pane.appendChild(fig);
      }
      for (const s of (m.about ? m.about[EN ? 'en' : 'he'] : [])) { const p = document.createElement('p'); p.textContent = s; pane.appendChild(p); }
    });
    view.append(back, top, tabs, ...panes, creditLine(id, credit));
    tabs.firstChild.click();
    view.hidden = false;
    document.body.classList.add('game-open');
    buttons.forEach(x => x && x.classList.toggle('sel', x === b));
    document.title = name + ' — Dragon 1982';
    if (push && m.slug) history.pushState({ game: id }, '', BASE + m.slug + '/');
    if (innerWidth < 1100 && push) view.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function closeGame(push) {
    view.hidden = true;
    viewId = null;
    document.body.classList.remove('game-open');
    if (status && statusHome) statusHome.insertBefore(status, statusNext);
    document.title = baseTitle;
    if (push) history.pushState({}, '', BASE);
    const sel = buttons.find(x => x && x.classList.contains('sel'));
    if (sel) { openDrawerOf(sel); sel.focus({ preventScroll: true }); }
  }
  const slugNow = () => { const p = location.pathname; return p.startsWith(BASE) ? p.slice(BASE.length).replace(/\/.*$/, '') : ''; };
  const idOfSlug = s => Object.keys(G.games).find(k => G.games[k].slug === s);
  window.addEventListener('popstate', () => { const id = idOfSlug(slugNow()); if (id) openGame(id, false); else if (!view.hidden) closeGame(false); });
  { const id = document.body.dataset.game || idOfSlug(slugNow()); if (id) openGame(id, false); }
  window.d32OpenGame = id => openGame(id, true);
  // העיצוב של הארון ושל דף המשחק (פעם אחת לשני הדפים, עברית ואנגלית)
  const css = document.createElement('style');
  css.textContent = `
.drawer summary .yr { margin-inline-start: auto; }
.yr { direction: ltr; unicode-bidi: isolate; font: 700 12px/1.6 'Courier New', monospace; color: var(--accent, #f2d23a); border: 1px solid #6a5434; border-radius: 999px; padding: 0 8px; white-space: nowrap; }
.drawer-note { margin: 2px 4px 8px; font-size: 14px; color: #b9a98f; line-height: 1.5; }
.drawer-note a { color: var(--accent, #f2d23a); }
.drawer-quote { margin: 4px 4px 10px; padding: 8px 12px; border-inline-start: 3px solid var(--accent, #f2d23a); background: #221b14; border-radius: 6px; font-size: 14px; line-height: 1.55; color: #e6d8bc; text-align: left; }
.drawer-quote p { margin: 0 0 6px; font-style: italic; }
.drawer-quote footer { font-size: 13px; color: #b9a98f; }
.drawer-quote-he { font-size: 13px; }
.drawer-group { margin: 10px 4px 4px; font-size: 13px; font-weight: 700; color: #d8c8a8; }
.rows { display: grid; gap: 2px; }
.tape.row { display: flex; flex-direction: row; align-items: center; justify-content: flex-start; gap: 10px; width: 100%; text-align: start; padding: 6px 8px; min-height: 44px; border-radius: 8px; border: 1px solid transparent; background: transparent; box-shadow: none; }
.tape.row:hover, .tape.row.sel { background: #2a2119; border-color: #4a3a2a; }
.tape.row .txt { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; min-width: 0; flex: 1; }
.tape.row .nm { font-weight: 700; line-height: 1.25; }
.tape.row .meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.tape.row .tg { font-size: 12px; color: #b9a98f; }
.ic { flex: 0 0 32px; width: 32px; height: 24px; border-radius: 4px; background: #2b2a26 no-repeat; image-rendering: pixelated; box-shadow: 0 0 0 1px #00000080; }
.game-view { margin-top: 8px; border: 2px solid #5a4430; border-radius: 14px; background: linear-gradient(#2b2018, #1f1712); padding: 12px 14px; }
.gv-back { background: none; border: 0; color: var(--accent, #f2d23a); font: inherit; font-size: 15px; padding: 4px 0; cursor: pointer; min-height: 36px; }
.gv-top { display: flex; gap: 14px; align-items: flex-start; flex-wrap: wrap-reverse; }
.gv-info { flex: 1 1 240px; min-width: 0; }
.gv-title { margin: 0; font-size: 26px; line-height: 1.2; }
.gv-desc { margin: 4px 0 8px; color: #d8c8a8; }
.gv-tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 10px; }
.gv-tags > span:not(.yr) { font-size: 12px; color: #b9a98f; border: 1px solid #4a3a2a; border-radius: 999px; padding: 0 8px; }
.gv-go { display: block; width: 100%; border: 0; border-radius: 12px; background: #e0503c; color: #fff; font: inherit; font-weight: 800; font-size: 18px; padding: 12px; box-shadow: 0 4px 0 #6d160b; cursor: pointer; }
.gv-go:active { transform: translateY(2px); box-shadow: 0 2px 0 #6d160b; }
.gv-go.nudge { animation: gv-nudge 0.5s ease-in-out 3; }
@keyframes gv-nudge { 50% { box-shadow: 0 4px 0 #6d160b, 0 0 0 5px #f2d23a; } }
.gv-info #tape-status { margin: 8px 0 0; }
.gv-shot { flex: 0 1 300px; width: 300px; max-width: 100%; height: auto; image-rendering: pixelated; border-radius: 6px; border: 1px solid #4a3a2a; background: #000; }
.gv-tabs { display: flex; gap: 6px; margin-top: 14px; border-bottom: 1px solid #4a3a2a; flex-wrap: wrap; }
.gv-tabs button { font: inherit; font-size: 14px; font-weight: 700; color: #b9a98f; background: transparent; border: 1px solid #4a3a2a; border-bottom: 0; border-radius: 8px 8px 0 0; padding: 6px 12px; cursor: pointer; min-height: 36px; }
.gv-tabs button[aria-selected="true"] { background: #2a2119; color: var(--accent, #f2d23a); }
.gv-pane { padding: 10px 2px 4px; line-height: 1.7; }
.gv-pane:not([hidden]) { display: flow-root; }   /* העטיפה הצפה נשארת בתוך הלשונית */
.gv-pane ol, .gv-pane ul { margin: 0; padding-inline-start: 22px; display: grid; gap: 6px; }
.gv-pane p { margin: 0 0 8px; }
.gv-cover { float: inline-end; width: 168px; margin-block: 2px 10px; margin-inline-start: 14px; }
.gv-cover img { display: block; width: 100%; height: auto; border-radius: 6px; box-shadow: 0 3px 12px rgba(0,0,0,.45); }
.gv-cover figcaption { font-size: 12px; line-height: 1.45; margin-top: 6px; color: var(--muted, #b9a98f); }
.gv-cover figcaption a { color: var(--accent, #f2d23a); }
@media (max-width: 520px) { .gv-cover { float: none; width: 60%; margin: 4px auto 12px; } }
.game-view .tape-credit { margin: 10px 0 0; padding-top: 8px; border-top: 1px solid #4a3a2a; }
body.game-open .shelf > :not(.game-view) { display: none; }
@media (min-width: 1100px) {
  body.game-open .info, body.game-open main > p.note:first-child { display: none; }
  /* חצי חצי (גונן, 28.10): חצי דף המשחק, חצי המכונה, שבאמצע החצי שלה ובגודל הכי גדול שנכנס בגובה */
  body.game-open main { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 0; }
  body.game-open .shelf { grid-column: 1; }
  body.game-open .machine { justify-self: center; width: min(100%, calc((100vh - 370px) * 4 / 3 + 28px)); }
  body.game-open .gv-shot { flex: 0 1 46%; width: 46%; max-width: 512px; }
}
`;
  document.head.appendChild(css);
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
    const id = (/^\/tape-(.+)\.cas$/.exec(path) || [])[1] || null;
    inTape = id;
    try {
      FS.writeFile(path, bytes);
      Module.ccall('wasm_load_file', null, ['string', 'number', 'number'], [path, 2, 0]);
      document.querySelectorAll('.tape').forEach(t => t.classList.toggle('in', t === button));
      const [LOADW, RUNW] = mc ? ['CLOADM', 'EXEC'] : ['CLOAD', 'RUN'];
      if (!auto) {
        inTape = id;
        const next = AFTER[id] ? ' ' + T2(...AFTER[id]).replace(/[\[\]{}]/g, '') : '';
        status.textContent = (mc === 'a'
          ? (EN ? 'The tape "' + title + '" is in the recorder. Type CLOADM. Loading can take a few minutes: first S, then F and the tape\'s name' + (next ? '.' : ', and the game starts by itself.')
            : 'הקלטת "' + title + '" ברשמקול. הקלידו CLOADM. הטעינה יכולה לקחת כמה דקות: קודם S, אחר כך F ושם הקלטת' + (next ? '.' : ', ואז המשחק מתחיל לבד.'))
          : EN ? 'The tape "' + title + '" is in the recorder. Type ' + LOADW + ', and after OK type ' + RUNW + '.'
          : 'הקלטת "' + title + '" ברשמקול. הקלידו ' + LOADW + ', ואחרי ה-OK הקלידו ' + RUNW + '.') + next;
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
  // קלטת קול ל-Dragon אמיתי (29.10): אותם בתים שה-ROM הקליט, בצליל שה-Dragon טוען מהרשמקול.
  // כמו ההקלטה של המכונה עצמה: 44100 דגימות בשנייה, 8 ביט, חצי שנייה שקט בהתחלה, ועוד חצי שנייה אחרי הכותרת
  // (הרשמקול עוצר ומתניע). כל ביט הוא גל סינוס אחד שמתחיל בעלייה, הביט הנמוך קודם. האורך לפי מחזורי המעבד
  // (0.894886 מגה-הרץ): ביט 0 = 813 מחזורים, ביט 1 = 435 (Ciaran Anscomb, 20.10).
  function tapeWav(f) {
    const RATE = 44100, CPU = 894886, AMP = 86;
    const leader = new Array(128).fill(0x55), gap = f.b[0][11];
    const parts = [['quiet', 0.5], ['bytes', leader.concat(block(0, f.b[0].slice(1)))]];
    if (!gap) parts.push(['quiet', 0.5], ['bytes', leader.concat(...f.b.slice(1).map(b => block(b[0], b.slice(1))))]);
    else for (const b of f.b.slice(1)) parts.push(['quiet', 0.5], ['bytes', leader.concat(block(b[0], b.slice(1)))]);
    parts.push(['quiet', 0.1]);
    const out = [];
    let t = 0;
    const quiet = sec => { const end = Math.round((t + sec) * RATE); while (out.length < end) out.push(128); t += sec; };
    const bit = one => {
      const len = (one ? 435 : 813) / CPU, from = Math.round(t * RATE), to = Math.round((t + len) * RATE);
      for (let s = from; s < to; s++) out.push(Math.round(128 + AMP * Math.sin(2 * Math.PI * ((s / RATE - t) / len))));
      t += len;
    };
    for (const [kind, v] of parts) {
      if (kind === 'quiet') quiet(v);
      else for (const byte of v) for (let i = 0; i < 8; i++) bit((byte >> i) & 1);
    }
    const head = new DataView(new ArrayBuffer(44)), txt = (o, str) => { for (let i = 0; i < 4; i++) head.setUint8(o + i, str.charCodeAt(i)); };
    txt(0, 'RIFF'); head.setUint32(4, 36 + out.length, true); txt(8, 'WAVE'); txt(12, 'fmt ');
    head.setUint32(16, 16, true); head.setUint16(20, 1, true); head.setUint16(22, 1, true);
    head.setUint32(24, RATE, true); head.setUint32(28, RATE, true); head.setUint16(32, 1, true); head.setUint16(34, 8, true);
    txt(36, 'data'); head.setUint32(40, out.length, true);
    const wav = new Uint8Array(44 + out.length);
    wav.set(new Uint8Array(head.buffer), 0); wav.set(out, 44);
    return wav;
  }
  window.d32TapeWav = tapeWav;
  function saveFile(bytes, name, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([bytes], { type }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
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
      inTape = null;
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
      down.addEventListener('click', () => saveFile(tapeBytes([f]), (f.n || 'TAPE') + '.cas', 'application/octet-stream'));
      const sound = document.createElement('button');
      sound.type = 'button';
      sound.className = 'mini';
      sound.textContent = '🔊';
      sound.setAttribute('aria-label', (EN ? 'Download as sound for a real Dragon: ' : 'הורדה כצליל ל-Dragon אמיתי: ') + f.n);
      sound.title = EN ? 'Download as sound (.wav) for a real Dragon' : 'הורדה כצליל (wav) ל-Dragon אמיתי';
      sound.addEventListener('click', () => saveFile(tapeWav(f), (f.n || 'TAPE') + '.wav', 'audio/wav'));
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
      row.append(b, down, sound, del);
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
  // קלטת אמיתית דרך המיקרופון (גונן, 30.10: "כולם"): מקליטים את הצליל של רשמקול או טלפון שמנגן ליד המחשב.
  // הקורא (tapedecode.js, גונן 30.10: "רכיב ... שיהיה עמיד") לומד מההקלטה איך הרמקול והמיקרופון משנים את הצליל,
  // קורא את הבלוקים עם בדיקת הסכום שלהם, ומכניס לרשמקול של המכונה קלטת נקייה עם אותם בתים בדיוק. המכונה טוענת
  // אותה כמו כל קלטת: CLOAD או CLOADM. אם חלק לא נקלט, מנגנים שוב: החלקים הטובים נשמרים וההקלטה החדשה משלימה.
  // אם הקורא לא מצא קלטת רגילה בכלל (למשל טוען מיוחד של משחק), ההקלטה נכנסת לרשמקול כמו שהיא, אחרי ניקוי
  const micBtn = document.getElementById('tape-mic');
  // ההודעות מופיעות מתחת לכפתור (גונן, 30.10: "לא הופיעה הודעה": שורת המצב הכללית למעלה, רחוק מהכפתור), וגם בשורת המצב הכללית
  const micMsg = document.getElementById('mic-status');
  const say = t => { status.textContent = t; if (micMsg) micMsg.textContent = t; };
  if (micBtn) {
    let rec = null;
    const micLabel = micBtn.textContent;
    // מסנן: זמזום נמוך (מתחת ל-400 הרץ) החוצה, ואז השוואה עם היסטרזיס לפי עוצמת הצליל באזור (עשירית מאית שנייה)
    function cleanTape(x, sr) {
      const out = new Int16Array(x.length);
      const a = Math.exp(-2 * Math.PI * 400 / sr), win = Math.max(1, Math.round(sr * 0.01)), sq = new Float32Array(win);
      let py = 0, px = 0, s2 = 0, st = 1;
      for (let i = 0; i < x.length; i++) {
        py = a * (py + x[i] - px); px = x[i];
        const v = py, k = i % win;
        s2 += v * v - sq[k]; sq[k] = v * v;
        const th = 0.3 * Math.sqrt(Math.max(s2, 1e-12) / win);
        if (st > 0 && v < -th) st = -1; else if (st < 0 && v > th) st = 1;
        out[i] = st * 26000;
      }
      return out;
    }
    function wav16(samples, sr) {
      const b = new ArrayBuffer(44 + samples.length * 2), d = new DataView(b);
      const w = (o, s) => { for (let i = 0; i < s.length; i++) d.setUint8(o + i, s.charCodeAt(i)); };
      w(0, 'RIFF'); d.setUint32(4, 36 + samples.length * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
      d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true); d.setUint32(24, sr, true);
      d.setUint32(28, sr * 2, true); d.setUint16(32, 2, true); d.setUint16(34, 16, true); w(36, 'data'); d.setUint32(40, samples.length * 2, true);
      new Int16Array(b, 44).set(samples);
      return new Uint8Array(b);
    }
    async function micStart() {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } });
      } catch (e) {
        say(EN ? 'No microphone: the browser did not allow it.' : 'אין מיקרופון: הדפדפן לא אישר.');
        return;
      }
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream), proc = ctx.createScriptProcessor(4096, 1, 1), mute = ctx.createGain();
      mute.gain.value = 0;
      const chunks = []; let n = 0, peak = 0;
      proc.onaudioprocess = ev => {
        const d = ev.inputBuffer.getChannelData(0); chunks.push(new Float32Array(d)); n += d.length;
        for (let i = 0; i < d.length; i += 64) peak = Math.max(peak, Math.abs(d[i]));
      };
      src.connect(proc); proc.connect(mute); mute.connect(ctx.destination);
      const t0 = Date.now();
      const tick = setInterval(() => {
        const s = Math.round((Date.now() - t0) / 1000), bar = '▮'.repeat(Math.min(10, Math.round(peak * 14))) || '·';
        peak = 0;
        say((EN ? '🔴 Recording ' : '🔴 מקליט ') + s + (EN ? ' s. Play the cassette now, then press the button again to stop. Level: ' : ' שניות. מנגנים עכשיו את הקלטת, ובסוף לוחצים שוב על הכפתור. עוצמה: ') + bar);
        if (s >= 600) micStop();
      }, 500);
      rec = { stream, ctx, proc, src, chunks, tick, get n() { return n; } };
      micBtn.textContent = EN ? '⏹ Stop recording' : '⏹ לעצור את ההקלטה';
      micBtn.classList.add('on');
    }
    function micStop() {
      if (!rec) return;
      const { stream, ctx, proc, src, chunks, tick } = rec, n = rec.n, sr = ctx.sampleRate;
      rec = null;
      clearInterval(tick);
      try { src.disconnect(); proc.disconnect(); } catch (e) {}
      stream.getTracks().forEach(t => t.stop());
      ctx.close();
      micBtn.textContent = micLabel;
      micBtn.classList.remove('on');
      if (n < sr) { say(EN ? 'The recording is too short.' : 'ההקלטה קצרה מדי.'); return; }
      const x = new Float32Array(n); let o = 0;
      for (const c of chunks) { x.set(c, o); o += c.length; }
      readMic(x, sr);
    }
    // ההקלטה כמו שהיא, אחרי ניקוי, כשהקורא לא מצא בה קלטת רגילה
    function rawToRecorder(x, sr, why) {
      try {
        FS.writeFile('/mic.wav', wav16(cleanTape(x, sr), sr));
        Module.ccall('wasm_load_file', null, ['string', 'number', 'number'], ['/mic.wav', 2, 0]);
        say(why + (EN ? ' The recording went into the tape recorder as it is: you can still try CLOAD. If it doesn\'t load: louder on the phone, closer to the microphone, a quiet room, and start recording before you press play.'
          : ' ההקלטה נכנסה לרשמקול כמו שהיא: אפשר בכל זאת לנסות CLOAD. אם לא נטען: עוצמה גבוהה יותר בטלפון, קרוב יותר למיקרופון, שקט בחדר, ולהתחיל להקליט לפני שמנגנים.'));
      } catch (e) { say(EN ? 'The machine is not ready yet.' : 'המכונה עוד לא מוכנה.'); }
    }
    let micPrev = null, reader = null;
    function readMic(x, sr) {
      if (typeof Worker === 'undefined') { rawToRecorder(x, sr, ''); return; }
      reader = reader || new Worker('/lab/1982/tapedecode.js');
      micBtn.disabled = true;
      say(EN ? '⏳ Reading the tape…' : '⏳ קורא את הקלטת…');
      reader.onerror = () => { micBtn.disabled = false; rawToRecorder(x, sr, ''); };
      reader.onmessage = e => {
        const m = e.data;
        if (m.progress !== undefined) { say((EN ? '⏳ Reading the tape… ' : '⏳ קורא את הקלטת… ') + Math.round(m.progress * 100) + '%'); return; }
        micBtn.disabled = false;
        const files = (m.result && m.result.files) || [], good = files.filter(f => f.ok);
        if (good.length) {
          micPrev = null;
          try {
            FS.writeFile('/mic.cas', tapeBytes(good.map(f => ({ n: f.n, b: f.b }))));
            Module.ccall('wasm_load_file', null, ['string', 'number', 'number'], ['/mic.cas', 2, 0]);
          } catch (err) { say(EN ? 'The machine is not ready yet.' : 'המכונה עוד לא מוכנה.'); return; }
          const mc = good[0].b[0][9] === 2, names = good.map(f => '"' + f.n + '"').join(', ');
          const [LOADW, RUNW] = mc ? ['CLOADM', 'EXEC'] : ['CLOAD', 'RUN'];
          say(EN ? '✅ Read ' + names + ' with no errors. It is in the tape recorder: click the machine\'s screen and type ' + LOADW + ' and ENTER. When OK appears, type ' + RUNW + '.'
            : '✅ נקראה הקלטת ' + names + ', בלי שגיאות. היא ברשמקול: לוחצים על מסך המכונה ומקלידים ' + LOADW + ' ו-ENTER. כשמופיע OK, מקלידים ' + RUNW + '.');
          document.getElementById('canvas')?.focus({ preventScroll: true });
        } else if (files.length) {
          // חלק מהבלוקים נקראו: שומרים אותם, והקלטה נוספת של אותה קלטת תשלים
          micPrev = files;
          const f = files[0], have = f.b.length, all = f.parts.length + (f.end ? 0 : 1);
          say(EN ? '⚠️ Read ' + have + ' of ' + (f.end ? all : 'at least ' + all) + ' parts of "' + f.n + '"; something is missing. Play the tape again from the start and press record again: the parts already read are kept, and the new recording fills in the rest.'
            : '⚠️ נקראו ' + have + ' מתוך ' + (f.end ? all : 'לפחות ' + all) + ' חלקים של "' + f.n + '", וחסר חלק. מנגנים את הקלטת שוב מההתחלה ולוחצים שוב להקליט: מה שכבר נקרא נשמר, וההקלטה החדשה משלימה.');
        } else rawToRecorder(x, sr, EN ? 'No ordinary Dragon tape found in the recording.' : 'לא מצאתי בהקלטה קלטת Dragon רגילה.');
      };
      reader.postMessage({ x, sr, prev: micPrev });
    }
    micBtn.addEventListener('click', () => { if (rec) micStop(); else micStart(); });
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
