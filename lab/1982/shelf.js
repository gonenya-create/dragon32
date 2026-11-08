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
    // Starship Chameleon של Ken Kalish (Computerware, 1982; ל-Dragon: מחסנית של Dragon Data ב-1983, וקלטת של Microdeal ב-1985).
    // הקלטת של Microdeal מ-World of Dragon, כמו שהיא (גונן אישר 6.11). הטוען נכנס לנקודות החיבור ($017F) ומתחיל לבד. משחק עם ידית
    ['chameleon', 'Starship Chameleon', 'Starship Chameleon', 'a',
      ['Ken Kalish · Computerware / Dragon Data / Microdeal, 1983', 'http://www.lcurtisboyle.com/nitros9/interview.html', null, null, 'kalish']],
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
    ['odyssey', 'Strange Odyssey', 'Strange Odyssey', 'a',
      ['Scott Adams · Adventure International, 1979 · color: Roger Schrag', 'https://www.msadams.com/', null, null, 'adams']],
    ['funhouse', 'Mystery Fun House', 'Mystery Fun House', 'a',
      ['Scott Adams · Adventure International, 1979 · color: Roger Schrag', 'https://www.msadams.com/', null, null, 'adams']],
    ['pyramid', 'Pyramid of Doom', 'Pyramid of Doom', 'm',
      ['Alvin Files & Scott Adams · Adventure International, 1979 · color: Roger Schrag', 'https://www.msadams.com/', null, null, 'adams']],
    ['ghost', 'Ghost Town', 'Ghost Town', 'a',
      ['Scott Adams · Adventure International, 1980 · color: Roger Schrag', 'https://www.msadams.com/', null, null, 'adams']],
    ['savage1', 'Savage Island Part 1', 'Savage Island Part 1', 'a',
      ['Scott Adams · Adventure International, 1981 · color: Roger Schrag', 'https://www.msadams.com/', null, null, 'adams']],
    ['savage2', 'Savage Island Part 2', 'Savage Island Part 2', 'a',
      ['Scott Adams & Rus Wetmore · Adventure International, 1981 · color: Roger Schrag', 'https://www.msadams.com/', null, null, 'adams']],
    ['golden', 'The Golden Voyage', 'The Golden Voyage', 'a',
      ['William Demas & Scott Adams · Adventure International, 1981 · color: Roger Schrag', 'https://www.msadams.com/', null, null, 'adams']],
    ['claymorgue', 'Sorcerer of Claymorgue Castle', 'Sorcerer of Claymorgue Castle', 'a',
      ['Scott Adams · Adventure International, 1984 · color: Roger Schrag', 'https://www.msadams.com/', null, null, 'adams']],
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
    // Williamsburg Adventure של Mike Hughey (Chromasette, 1981; ל-Dragon מ-Microdeal, 1982; בתוכנית: AUTHOR :MIKE HUGHEY): אותו מכתב מ-1997,
    // שמזכיר אותה בשם. BASIC: ‏CLOAD ואז RUN. הקלטת מ-World of Dragon כמו שהיא (גונן, 7.11: "אני רוצה את כולם")
    ['williamsburg', 'Williamsburg Adventure', 'Williamsburg Adventure', null,
      ['Mike Hughey · Chromasette / Microdeal, 1981–82', 'https://web.archive.org/web/20040604130844/http://ds.dial.pipex.com/town/estate/dh69/clear/rights.html', null, null, 'hughey']],
    // Ninja Warrior של Charles Forsythe (The Programmer's Guild, 1983): הרשות שלו באתר של L. Curtis Boyle (3.4.2005: "Yes, please do!").
    // הקלטת מ-World of Dragon כמו שהיא (גונן אישר 6.11). CLOADM ואז EXEC. במקלדת: [K] ואז מספר השחקנים; [K] קפיצה, [O] בעיטה (העטיפה), [N] קדימה, [M] אחורה (קוד המשחק, $1658)
    ['ninja', 'Ninja Warrior', 'Ninja Warrior', 'm',
      ['Charles Forsythe · The Programmer\'s Guild, 1983', 'https://www.lcurtisboyle.com/nitros9/approvals/charles_forsythe_approval.txt', null, null, 'love']],
    // Tim Love's Cricket (Peaksoft, 1984): רשות מ-Tim Love במייל, 29.10.2026. שלושה חלקים בקלטת: טוען, BASIC וקוד מכונה.
    // שורה 10 שלו, CLOADM"":GOTO280, חשפה באג ב-ROM שלנו (תוקן 29.10). המבוא הוארך כמו ב-Alcatraz
    ['cricket', 'Tim Love\'s Cricket', 'Tim Love\'s Cricket', 'a',
      ['Tim Love · Peaksoft, 1984', 'https://timlovescricket.blogspot.com/', null, null, 'love']],
    // שלושת המשחקים של Paul Garner (Blaby Computer Games, 1984–85): המכתב שלו בארכיון CLEAR (26.2.1998: "you have my permission"),
    // שמונה את שלושתם. הקלטות כמו שהן (גונן, 7.11). נטענות לתוך $00A6 ומתחילות לבד. The Sword and the Sorcerer מכוון את ה-hook של $019A
    // לדלג 4 בתים: לכן לולאת הפקודות מתחילה ב-$849F כמו במקור (ROM, 7.11). Starman Jones ו-The Wizard's Lair בג'ויסטיק
    ['starman', 'Starman Jones', 'Starman Jones', 'a',
      ['Paul Garner (landscape: P. L. Thomas) · Blaby Computer Games, 1984', 'https://web.archive.org/web/20040604130844/http://ds.dial.pipex.com/town/estate/dh69/clear/rights.html', null, null, 'hughey']],
    ['sword', 'The Sword and the Sorcerer', 'The Sword and the Sorcerer', 'a',
      ['Paul Garner (graphics: B. M. Burrows) · Blaby Computer Games, 1985', 'https://web.archive.org/web/20040604130844/http://ds.dial.pipex.com/town/estate/dh69/clear/rights.html', null, null, 'hughey']],
    ['wizlair', 'The Wizard\'s Lair', 'The Wizard\'s Lair', 'a',
      ['Paul Garner · Blaby Computer Games, 1985', 'https://web.archive.org/web/20040604130844/http://ds.dial.pipex.com/town/estate/dh69/clear/rights.html', null, null, 'hughey']],
    // Tanglewood (Microdeal, 1986): קוד פתוח ברישיון MIT מ-2018 (Ian Murray-Watson, Pete Lyon, ובהסכמת John Symes).
    // הקלטת מהמאגר הרשמי נגמרת בביט האחרון, אז נוספו אחריה 16 בתי מבוא (כמו בקלטת אמיתית); הנתונים כמו שהם
    // Hang It! של Harry Whitehouse (1983), המשחק הראשון שלו: איש תלוי עם 1,000 שמות של ערים וכפרים בבריטניה. הרשות שלו במייל, 29.10.2026
    // ("Yes that's fine by me"); גונן החליט להעלות 6.11. BASIC, הקלטת מהארכיון כמו שהיא
    ['hangit', 'Hang It!', 'Hang It!', null,
      ['Harry Whitehouse · Peaksoft, 1983', 'http://www.peaksoft.uk/peaksoftstory', null, null, 'love']],
    // Death's Head Hole של Harry Whitehouse (1983), הצלה במערה. אותה רשות. BASIC, הקלטת המקורית [!] (לא הגרסה ש"תוקנה" בארכיון)
    ['dhh', 'Death\'s Head Hole', 'Death\'s Head Hole', null,
      ['Harry Whitehouse · Peaksoft, 1983', 'http://www.peaksoft.uk/peaksoftstory', null, null, 'love']],
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
    // Tea Time של Adrian Eddleston (גרפיקה: Stephen Eddleston-McGrath; ‏Pocket Money Software, 1984): הרשות שלו באתר של L. Curtis Boyle (#42).
    // הקלטת מ-World of Dragon כמו שהיא (גונן, 7.11). מתחילה לבד. ג'ויסטיק
    ['teatime', 'Tea Time', 'Tea Time', 'a',
      ['Adrian Eddleston · Pocket Money Software, 1984', 'https://www.lcurtisboyle.com/nitros9/approvals/adrian_eddleston_approval.txt', null, null, 'love']],
    // Star Spores של Dave Shadoff (Spectral Associates, 1983; ל-Dragon מ-Microdeal): הרשות שלו במייל, 25.10.2026. הקלטת מהארכיון כמו שהיא.
    // הטוען של Microdeal בשלבים (כמו Athletyx). המשחק בודק את המילה ב-$B4B3 כדי לדעת שהוא על Dragon (נוסף ל-ROM, 30.10)
    ['spores', 'Star Spores', 'Star Spores', 'a',
      ['Dave Shadoff · Spectral Associates / Microdeal, 1984', 'https://archive.worldofdragon.org/index.php?title=Star_Spores', null, null, 'love']],
    // Downland של Michael Aichlmayr (Spectral Associates ו-Tandy, 1983; ל-Dragon מ-Microdeal, 1984): הרשות שלו באתר של L. Curtis Boyle (4.5.2002),
    // ו-Curtis במייל 2.11.2026: כל האישורים שם הם שיתוף מלא של כל מה שהמחברים עשו. גונן אישר 2.11. מתחיל לבד אחרי CLOADM.
    // הקלטת: הבלוקים כמו בארכיון, ולפני בלוק עם מבוא קצר נוסף מבוא (כמו ב"הקלטות שלי"); הנתונים לא השתנו
    ['downland', 'Downland', 'Downland', 'a',
      ['Michael Aichlmayr · Spectral Associates / Microdeal, 1983–84', 'https://www.lcurtisboyle.com/nitros9/approvals/approvals.html', null, null, 'love']],
    // The King של Chris Latham (Tom Mix Software, 1983), ל-Dragon מ-Microdeal בשם Donkey King (כך כתוב על המסך): הרשות שלו באתר של Curtis,
    // ומייל Curtis מ-2.11.2026. גונן אישר 2.11 ("עכשיו"). שני חלקים: טוען, ואחריו המשחק בלי שם. ה-ROM צריך את $B748, $B87E ו-$BBC8 (31.10)
    ['king', 'The King', 'The King', 'a',
      ['Chris Latham · Tom Mix Software / Microdeal, 1983', 'https://www.lcurtisboyle.com/nitros9/approvals/approvals.html', null, null, 'love']],
    // Nerble Force של David Crandall (Computerware, 1983; ל-Dragon מ-Microdeal, 1985): הרשות שלו באתר של L. Curtis Boyle (26.3.2001),
    // בתנאי שהקובץ נשאר כמו שהוא, ומייל Curtis מ-2.11.2026. גונן אישר 2.11. בקובץ הארכיון כל הביטים היו מוזזים ב-7 ביטים
    // (ההקלטה התחילה באמצע בית): יישרנו את הגבול בין הבתים, והאותות בקלטת עצמם לא השתנו. הטוען של Microdeal בכותרת, מתחיל לבד
    // Buzzard Bait של The Rugby Circle (‏Rob Lech ו-Troy Dahlman; ‏Tom Mix Software, 1983; ל-Dragon מ-Microdeal, 1984): הרשות שלהם
    // באתר של L. Curtis Boyle (5.2.2001). הקלטת של Microdeal מ-World of Dragon, כמו שהיא (גונן אישר את ההורדה 3.11).
    // הטוען נכנס לנקודות החיבור של BASIC ($017F) ומתחיל לבד. המפתח החומרתי: dongle() למעלה
    ['buzzard', 'Buzzard Bait', 'Buzzard Bait', 'a',
      ['Rob Lech & Troy Dahlman (The Rugby Circle) · Tom Mix Software / Microdeal, 1983–84', 'https://www.lcurtisboyle.com/nitros9/approvals/the_rugby_circle.txt', null, null, 'love']],
    ['nerble', 'Nerble Force', 'Nerble Force', 'a',
      ['David Crandall · Computerware / Microdeal, 1983–85', 'https://www.lcurtisboyle.com/nitros9/approvals/approvals.html', null, null, 'love']],
    // שלושת המשחקים של John Morrison (J. Morrison Micros, 1983): המכתב של בנו Robert Morrison בארכיון CLEAR (11.5.1996:
    // "We have no objections to you distributing our software"). הקלטות כמו שהן (גונן, 7.11). Bonka ו-Vultures נכנסים ב-$016A, ה-hook של קלט התו:
    // בגללם getline קורא לו לפני כל מקש, כמו במקור (ROM, 7.11). Maurice Minor ו-Vultures בג'ויסטיק הימני, Bonka במקלדת
    ['bonka', 'Bonka', 'Bonka', 'a',
      ['John Morrison · J. Morrison (Micros), 1983', 'https://web.archive.org/web/20040604130844/http://ds.dial.pipex.com/town/estate/dh69/clear/rights.html', null, null, 'hughey']],
    ['vultures', 'Vultures', 'Vultures', 'a',
      ['John Morrison · J. Morrison (Micros), 1983', 'https://web.archive.org/web/20040604130844/http://ds.dial.pipex.com/town/estate/dh69/clear/rights.html', null, null, 'hughey']],
    ['maurice', 'Maurice Minor', 'Maurice Minor', 'a',
      ['John Morrison · J. Morrison (Micros), 1983', 'https://web.archive.org/web/20040604130844/http://ds.dial.pipex.com/town/estate/dh69/clear/rights.html', null, null, 'hughey']],
    // Shenanigans,‏ Sea Search ו-Trekboer של Bob Withers ו-Stephen O'Dea (Mark Data Products, 1983–84; ל-Dragon מ-Dragon Data ומ-Microdeal):
    // אותו מכתב של Withers בארכיון CLEAR, שמונה את שלושתם (גונן, 7.11: "מאשר את שלושתם"). הקלטות כמו שהן. Sea Search יצא ב-Dragon בשמו
    // הראשון, Sea Quest (כך כתוב במסך הפתיחה, ובקרדיטים Stephen ו-Kathy O'Dea, ‏Bob ו-Dollie Withers); השם הוחלף בגלל משחק של Activision.
    // שניים הראשונים: CLOADM ואז EXEC. ‏Trekboer מתחיל לבד. שמירה וטעינה של משחק נבדקו במכונה (7.11)
    ['shenan', 'Shenanigans', 'Shenanigans', 'm',
      ['Bob Withers & Stephen O\'Dea · Mark Data Products / Dragon Data, 1983', 'https://web.archive.org/web/20040604130844/http://ds.dial.pipex.com/town/estate/dh69/clear/rights.html', null, null, 'hughey']],
    ['seasearch', 'Sea Search', 'Sea Search', 'm',
      ['Stephen & Kathy O\'Dea, Bob & Dollie Withers · Mark Data Products / Dragon Data, 1983', 'https://web.archive.org/web/20040604130844/http://ds.dial.pipex.com/town/estate/dh69/clear/rights.html', null, null, 'hughey']],
    ['trekboer', 'Trekboer', 'Trekboer', 'a',
      ['Stephen O\'Dea & Bob Withers · Mark Data Products / Microdeal, 1984–85', 'https://web.archive.org/web/20040604130844/http://ds.dial.pipex.com/town/estate/dh69/clear/rights.html', null, null, 'hughey']],
    // The Vortex Factor של Bob Withers ו-Stephen O'Dea (Mark Data Products, 1985; ל-Dragon מ-Microdeal): הרשות של Withers במכתב שבארכיון CLEAR
    // (23.1.1996: "you have my permission to distribute them"; גונן קיבל את מכתבי CLEAR כמקור 6.11). הקלטת של Microdeal כמו שהיא. מתחילה לבד
    ['vortex', 'The Vortex Factor', 'The Vortex Factor', 'a',
      ['Bob Withers & Stephen O\'Dea · Mark Data Products / Microdeal, 1985', 'https://web.archive.org/web/20040604130844/http://ds.dial.pipex.com/town/estate/dh69/clear/rights.html', null, null, 'hughey']],
    // Black Sanctum ו-Calixto Island של Ron Krebs (Mark Data Products, 1981; ל-Dragon: Dragon Data). הרשות שלו באתר של L. Curtis Boyle
    // (15.12.2000: "Please feel free"; "I modified all of our games to run on the Dragon Data version"). הקלטות של Dragon Data
    // מ-World of Dragon, כמו שהן (גונן אישר את ההורדה 3.11). CLOADM ואז EXEC. ה-ROM צריך את $B505, ‏$BA6B, ‏$B45C ו-$B5C6 (3.11).
    // שמירה וטעינה של משחק (3.11, סבב 4): ‏$B7C2, ‏$B6A8 ו-$B87A. המשחק השמור נכנס ל"הקלטות שלי", ומשם נטען
    ['sanctum', 'Black Sanctum', 'Black Sanctum', 'm',
      ['Ron Krebs · Mark Data Products / Dragon Data, 1981', 'https://www.lcurtisboyle.com/nitros9/approvals/ron_krebs_approval.txt', null, null, 'love']],
    ['calixto', 'Calixto Island', 'Calixto Island', 'm',
      ['Ron Krebs · Mark Data Products / Dragon Data, 1981', 'https://www.lcurtisboyle.com/nitros9/approvals/ron_krebs_approval.txt', null, null, 'love']],
    // Cave Hunter של Ron Krebs (Mark Data Products; מחסנית של Dragon Data, 1981): אותה רשות. המחסנית המקורית מ-World of Dragon,
    // כמו שהיא (4K). ה-ROM צריך את $BAF1, ‏$BAD4 ו-$BAD6 (3.11: הצליל חזר לכתובות של המקור)
    ['cavehunter', 'Cave Hunter', 'Cave Hunter', 'c',
      ['Ron Krebs · Mark Data Products / Dragon Data, 1981', 'https://www.lcurtisboyle.com/nitros9/approvals/ron_krebs_approval.txt', null, null, 'love']],
    ['tangle', 'Tanglewood', 'Tanglewood', 'm',
      ['Ian Murray-Watson · Microdeal, 1986', '/lab/1982/tapes/tanglewood-license.txt', 'https://gitlab.com/amigasourcecodepreservation/tanglewood', null, 'mit']],
    // Dig-It של Rolf Michelsen (1986), ש-Microdeal מכרה בשם Stone Raider II: קוד פתוח ברישיון BSD (המאגר שלו ב-GitHub).
    // הקלטת נבנתה מקוד המקור בלי שום שינוי (lwasm), ועטופה בקלטת CLOADM רגילה. משתמש ב-$BD41 וב-$BBE5 של ה-ROM. ג'ויסטיק בלבד
    ['digit', 'Dig-It', 'Dig-It', 'm',
      ['Rolf Michelsen · Microdeal (as Stone Raider II), 1986', '/lab/1982/tapes/digit-license.txt', 'https://github.com/rolfmichelsen/StoneRaiderII', null, 'bsd']],
    // מחסניות של ה-CoCo שרצו על ה-Dragon (גונן, 31.10: "זה חלק מהדראגון כי זה היה ככה באמת"; מגירה קטנה). 'c' = מחסנית:
    // הקובץ המקורי נכנס לחריץ, המחשב נדלק מחדש והמשחק מתחיל לבד; "הוצא" מחזיר ל-BASIC.
    // Dungeons of Daggorath (DynaMicro / Tandy, 1982): רשות פומבית של Douglas J. Morgan לכל אחד, בתנאי שהמשחק נשאר כמו המקור
    ['daggorath', 'Dungeons of Daggorath', 'Dungeons of Daggorath', 'c',
      ['DynaMicro (Douglas J. Morgan, Phillip C. Landmeier, Keith Kiyohara) · Tandy, 1982', '/lab/1982/carts/daggorath-license.txt', null, null, 'grant']],
    // Snaker של Gary Ritchie (נכתב במרץ 1983, פורסם ב-The Rainbow בינואר 1984): תוכנית BASIC ל-CoCo, והמחבר פרסם אותה ברישיון MIT.
    // הרישום המקורי שלו (src/snaker.bas) כמו שהוא, בקלטת טקסט כמו ש-CSAVE "SNAKER",A כותב, ו-CLOAD רגיל קורא אותה
    ['snaker', 'Snaker', 'Snaker', null,
      ['Gary Ritchie · The Rainbow, January 1984', '/lab/1982/tapes/snaker-license.txt', 'https://github.com/gtritchie/snaker', null, 'mit']],
    // Brickout של Owen Stenseth (1987; על המסך SUPER BRICKOUT): הופץ בחינם בלוחות המודעות, וב-2021 שוחרר ברישיון MIT.
    // הקובץ המקורי שלו (BRICKOUT.BIN, קטע אחד ב-$6000, הפעלה ב-$6B25) עטוף בקלטת CLOADM, בלי שום שינוי. ידית: PADDLE
    ['brickout', 'Brickout', 'Brickout', 'm',
      ['Owen Stenseth · freeware, 1987', '/lab/1982/tapes/brickout-license.txt', 'https://github.com/digitalbytes/super-brickout', null, 'mit']]
  ];
  // משחקים שצריכים ג'ויסטיק: כשהקלטת נטענת, החיצים במקלדת הופכים לג'ויסטיק הימני ו-Alt (Option במק) לכפתור שלו
  const JOY = new Set(['teatime', 'vultures', 'maurice', 'starman', 'wizlair', 'chameleon', 'downland', 'king', 'buzzard', 'cavehunter', 'nerble', 'ranger', 'devil', 'dungeon', 'athletyx', 'cuthbert', 'grabber', 'draconian', 'alcatraz', 'cricket', 'digit', 'snaker']);
  // ב-Cricket החובט משתמש בג'ויסטיק השמאלי והמגיש בימני (המדריך של Peaksoft): החיצים מזיזים את שניהם יחד.
  // ב-Snaker הימני מכוון (JOYSTK(0)) והשמאלי קובע מהירות (JOYSTK(3)): למעלה מהר, למטה לאט
  const BOTH = new Set(['cricket', 'snaker']);
  function setJoy(on, both) {
    paddle = false; padDir = 0;
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
  // משחקי ידית (Brickout): המחבט הולך בדיוק למקום של הג'ויסטיק, כמו ידית אמיתית, ולכן חיצים של ג'ויסטיק מהמקלדת היו מקפיצים אותו
  // רק לקצוות. כאן הג'ויסטיק הימני הוא הג'ויסטיק הווירטואלי של XRoar (-joy-wasm-virtual): העכבר או האצבע על המסך מזיזים את המחבט
  // בדיוק למקום שלהם, החיצים (גם מלוח המשחק בטלפון) מזיזים אותו בהדרגה, ו-Alt, רווח או לחיצה בעכבר על המסך הם הכפתור
  const PADDLE = new Set(['brickout']);
  let paddle = false, padX = 32768, padDir = 0, padT = 0;
  function padAxis(v) {
    padX = Math.max(0, Math.min(65535, Math.round(v)));
    try { Module.ccall('wasm_js_set_axis', null, ['number', 'number'], [0, padX]); } catch (e) {}
  }
  function padButton(on) { try { Module.ccall('wasm_js_set_button', null, ['number', 'number'], [0, on ? 1 : 0]); } catch (e) {} }
  function setPaddle(on) {
    paddle = on; padDir = 0; padButton(false);
    const canvas = document.getElementById('canvas');
    if (canvas) canvas.style.touchAction = on ? 'none' : '';
    if (!on) return;
    try { Module.ccall('wasm_set_joystick_by_name', null, ['number', 'string'], [0, 'wasm']); } catch (e) {}
    padAxis(32768);
  }
  // חץ לחוץ: המחבט נע בקצב קבוע, מקצה לקצה בכשנייה
  function padRun(t) {
    if (!paddle || !padDir) return;
    if (padT) padAxis(padX + padDir * 65535 * Math.min(t - padT, 50) / 1000);
    padT = t;
    requestAnimationFrame(padRun);
  }
  const PAD_KEYS = { ArrowLeft: -1, ArrowRight: 1 };
  function padKey(e, down) {
    if (!paddle) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key in PAD_KEYS) {
      const d = PAD_KEYS[e.key];
      if (down && padDir !== d) { padDir = d; padT = 0; requestAnimationFrame(padRun); }
      if (!down && padDir === d) padDir = 0;
    } else if (e.key === 'Alt' || e.code === 'Space') {
      if (!(down && e.repeat)) padButton(down);
    } else return;
    e.preventDefault(); e.stopImmediatePropagation();
  }
  window.addEventListener('keydown', e => padKey(e, true), true);
  window.addEventListener('keyup', e => padKey(e, false), true);
  // העכבר או האצבע: המקום על המסך הוא המקום של המחבט. שטח המשחק הוא בערך 80% מרוחב המסך, בלי המסגרת
  (function () {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;
    const at = e => { const r = canvas.getBoundingClientRect(); padAxis(((e.clientX - r.left) / r.width - 0.1) / 0.8 * 65535); };
    canvas.addEventListener('pointermove', e => { if (paddle && (e.pointerType === 'mouse' || e.buttons)) at(e); });
    canvas.addEventListener('pointerdown', e => { if (!paddle) return; at(e); if (e.pointerType === 'mouse') padButton(true); });
    const up = e => { if (paddle && e.pointerType === 'mouse') padButton(false); };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
  })();
  // כל קלטת שנכנסת לרשמקול: ג'ויסטיק מהמקלדת רק למשחקי ג'ויסטיק, ולוח המשחק לטלפון (joypad.js) רק למשחקים שיש להם מקשים שם
  // קלטת שלי (id = null): ג'ויסטיק מהמקלדת לפי המתג במגירה "הקלטות שלי" (גונן, 31.10: "אני לא יכול לשחק")
  let mineIn = false, myJoy = false;
  try { myJoy = localStorage.getItem('d32-myjoy') === '1'; } catch (e) {}
  // mc: קלטת שלי בשפת מכונה. בטלפון מקבלת את לוח המשחק (חיצים ורווח), כי מקש במקלדת המצוירת אי אפשר להחזיק
  // (גונן, 1.11, על Donkey King באייפון). המתג קובע אם החיצים הם מקשים או הג'ויסטיק
  // המפתח החומרתי (dongle) של Buzzard Bait (3.11): במקור תקע קטן בשקע הג'ויסטיק השמאלי, ובלעדיו המשחק כותב
  // INSERT DONGLE & RELOAD ונעצר. אחרי הלוגו המשחק קורא את הג'ויסטיק השמאלי ומחכה לארבעה מצבים, אחד אחרי השני:
  // Y בין 7 ל-15, ‏X בין 0 ל-6, ‏X בין 45 ל-55, ‏Y בין 25 ל-35 (מתוך 63). התקע המקורי משתנה עם הזמן, אז כאן הג'ויסטיק הווירטואלי
  // של XRoar בשקע השמאלי עובר בין ארבעה מצבים שמכסים את כולם, כל 30 אלפיות. המשחק עצמו לא משתנה. כשהוא מבקש
  // REMOVE DONGLE, מסך הפתיחה (SELECT COLOUR) מופיע, והתקע יוצא, כמו שהמשחק מבקש
  const DONGLE = new Set(['buzzard']);
  let dongleT = 0, dongleW = 0;
  function dongle(on) {
    clearInterval(dongleT); clearInterval(dongleW); dongleT = dongleW = 0;
    if (!on) return;
    try { Module.ccall('wasm_set_joystick_by_name', null, ['number', 'string'], [1, 'wasm']); } catch (e) { return; }
    const v = n => n * 1024 + 512, S = [[3, 11], [50, 11], [50, 30], [3, 30]];
    let i = 0;
    dongleT = setInterval(() => {
      const [x, y] = S[i++ % 4];
      try { Module.ccall('wasm_js_set_axis', null, ['number', 'number'], [0, v(x)]); Module.ccall('wasm_js_set_axis', null, ['number', 'number'], [1, v(y)]); } catch (e) {}
    }, 30);
    dongleW = setInterval(() => {
      if (!/SELECT COLOUR/.test((window.d32Screen?.() || []).join('\n'))) return;
      dongle(false);
      // שחקן 1 משחק בג'ויסטיק השמאלי (נבדק 3.11): אחרי שהתקע יוצא, החיצים ו-Alt (או רווח) הם הג'ויסטיק בשני השקעים
      try { Module.ccall('wasm_set_joystick_by_name', null, ['number', 'string'], [1, 'kjoy0']); } catch (e) {}
    }, 1000);
  }
  function gameKeys(id, mc) {
    mineIn = id === null;
    setJoy(JOY.has(id) || (mineIn && myJoy), BOTH.has(id));
    setPaddle(PADDLE.has(id));
    dongle(DONGLE.has(id));
    if (window.d32Pad) window.d32Pad(mineIn && mc ? 'mine' : id);
    hintButton(id);
  }
  // איך משחקים (גונן, 25.10: "לא בטוח שהמשתמשים יבינו איך משחקים"): תיבה נפתחת מתחת לכל משחק בשפת מכונה.
  // [מקש] נהיה מקש מצויר. המקשים לפי התיעוד של המחבר, ונבדקו במכונה. במק: BREAK הוא Esc, ו-CLEAR הוא Home (fn+←).
  // משחקים שיש להם רמזים (lab/1982/hints/<id>.json): רק אחרי שעברנו אותם עד הסוף במכונה
  const HINTS = new Set(['adventureland', 'pirate', 'voodoo', 'mission', 'count', 'odyssey', 'pyramid']);
  const hintData = {};
  const hintsFor = id => (hintData[id] = hintData[id] || fetch('/lab/1982/hints/' + id + '.json').then(r => { if (!r.ok) throw 0; return r.json(); }).catch(e => { delete hintData[id]; throw e; }));
  // שאלה אחת: נפתחת לרמז קטן, ובתוכו הרמז הברור, ובתוכו הפתרון. כל מדרגה מופיעה רק אחרי שפותחים את הקודמת
  function hintBlock(item) {
    const LV = [T2('רמז קטן', 'Small hint'), T2('רמז ברור יותר', 'Clearer hint'), T2('הפתרון המלא', 'Full solution')];
    const q = document.createElement('details');
    q.className = 'hint-q';
    const sm = document.createElement('summary');
    sm.append(...keyLine(item.q).childNodes);   // {CHIGGERS}: מילה באנגלית בכיוון שלה
    q.appendChild(sm);
    let host = q;
    item.h.forEach((t, i) => {
      const lv = document.createElement('details');
      lv.className = 'hint-lv hint-lv' + i;
      const ls = document.createElement('summary');
      ls.textContent = LV[i];
      const ul = document.createElement('ul');
      ul.appendChild(keyLine(t));
      lv.append(ls, ul);
      host.appendChild(lv);
      host = lv;
    });
    return q;
  }
  // כפתור "💡 רמז" ליד המסך (גונן, 7.11: "רמז ליד המסך שמלווה את השלב"): מופיע כשקלטת של משחק עם רמזים בפנים.
  // הוא קורא את ראש המסך (בהרפתקאות של Scott Adams שם תמיד כתוב איפה השחקן) ומראה רק את השאלות של המקום הזה.
  // כל השאלות נשארות בלשונית "רמזים" שמתחת למקלדת
  let hintId = null, hintUI = null, hintKey = '', hintTimer = 0;
  function roomText() {
    const rows = (window.d32Screen?.() || []).map(r => r.replace(/[\x00-\x1f]/g, ' '));
    const sep = rows.findIndex(r => r.includes('<----'));
    return (sep > 0 ? rows.slice(0, sep) : rows.slice(0, 4)).join(' ').replace(/\s+/g, ' ');
  }
  async function hintFill(force) {
    if (!hintUI || hintUI.pop.hidden || !hintId) return;
    let d;
    try { d = await hintsFor(hintId); } catch (e) { hintUI.title.textContent = T2('הרמזים לא נטענו. נסו שוב.', 'The hints did not load. Try again.'); return; }
    const text = roomText();
    const idx = d.at.map((a, i) => a.some(w => text.includes(w)) ? i : -1).filter(i => i >= 0);
    const key = idx.join(',');
    if (!force && key === hintKey) return;   // אותו מקום: לא נוגעים, כדי שרמז שנפתח יישאר פתוח
    hintKey = key;
    hintUI.title.textContent = idx.length ? T2('רמזים למקום שבו אתם עכשיו', 'Hints for where you are now')
      : T2('לא זיהיתי איפה אתם במשחק. הנה כל השאלות:', "I can't tell where you are in the game. Here are all the questions:");
    const items = d[EN ? 'en' : 'he'];
    hintUI.list.replaceChildren(...(idx.length ? idx : items.map((x, i) => i)).map(i => hintBlock(items[i])));
  }
  function hintPop(open) {
    if (!hintUI) return;
    hintUI.pop.hidden = !open;
    hintUI.btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    clearInterval(hintTimer); hintTimer = 0;
    if (open) { hintKey = null; hintFill(true); hintTimer = setInterval(() => hintFill(false), 2000); }
  }
  function hintButton(id) {
    hintId = HINTS.has(id) ? id : null;
    if (!hintId) { if (hintUI) { hintPop(false); hintUI.btn.hidden = true; } return; }
    if (!hintUI) {
      const kbd = document.getElementById('kbd');
      if (!kbd) return;
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'hint-btn';
      btn.textContent = T2('💡 רמז', '💡 Hint');
      const pop = document.createElement('div');
      pop.className = 'hint-pop'; pop.hidden = true;
      pop.setAttribute('role', 'dialog');
      const head = document.createElement('div'); head.className = 'hint-pop-head';
      const title = document.createElement('b');
      const x = document.createElement('button'); x.type = 'button'; x.className = 'hint-pop-x'; x.textContent = '✕';
      x.setAttribute('aria-label', T2('סגירה', 'Close'));
      head.append(title, x);
      const list = document.createElement('div');
      const all = document.createElement('button');
      all.type = 'button'; all.className = 'hint-pop-all';
      all.textContent = T2('כל השאלות, בלשונית "רמזים" למטה ↓', 'All the questions, in the Hints tab below ↓');
      all.addEventListener('click', () => {
        hintPop(false);
        const tab = [...document.querySelectorAll('.game-view .gv-tabs button')].find(b => /^(רמזים|Hints)$/.test(b.textContent));
        if (tab) { if (document.body.classList.contains('full')) document.getElementById('full-close')?.click(); tab.click(); tab.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
      pop.append(head, list, all);
      kbd.parentNode.insertBefore(btn, kbd);
      kbd.parentNode.insertBefore(pop, kbd);
      btn.addEventListener('click', () => hintPop(pop.hidden));
      x.addEventListener('click', () => hintPop(false));
      hintUI = { btn, pop, title, list };
    }
    hintUI.btn.hidden = false;
    hintPop(false);
  }
  const HOWTO = {
    // Cave Hunter נבדק במכונה (3.11): המחסנית המקורית, מסכי הפתיחה, המבוך, הג'ויסטיק מכניס את הצייד למבוך, היצורים והזהב.
    // מה המשחק: לפי הדף של L. Curtis Boyle
    cavehunter: {
      he: ['במשחק הזה החיצים הם ג\'ויסטיק. בטלפון יש מתחת למסך ידית.',
        'המחסנית נכנסת לחריץ והמשחק מתחיל לבד: קודם המסך של Dragon Data ו-Mark Data, אחר כך CAVE HUNTER, ואז המבוך.',
        'אתם הצייד, למעלה בכניסה למבוך. הזהב (המטילים הצהובים) בתחתית. מביאים מטיל אחד בכל פעם בחזרה לכניסה.',
        'היצורים במבוך מסוכנים. הכדורים האדומים נותנים כוח לזמן קצר, ואז אפשר להכות את היצורים.',
        'למעלה משמאל: הנקודות. למעלה מימין: כמה חיים נשארו.'],
      en: ['In this game the arrow keys are a joystick. On a phone there is a stick under the screen.',
        'The cartridge goes in the slot and the game starts by itself: first the Dragon Data and Mark Data screen, then CAVE HUNTER, then the maze.',
        'You are the hunter, at the entrance at the top of the maze. The gold (the yellow bars) is at the bottom. Bring one bar at a time back to the entrance.',
        'The creatures in the maze are dangerous. The red pills give you power for a short time, and then you can knock the creatures out.',
        'Top left: the score. Top right: the lives you have left.']
    },
    // Buzzard Bait נבדק במכונה (3.11): הקלטת המקורית של Microdeal, המפתח הווירטואלי עובר את הבדיקה, מסך הפתיחה עם REMOVE DONGLE,
    // בחירת צבע, 1 OR 2 PLAYERS, ‏PREPARE TO JOUST ‏WAVE 1, והמשחק
    buzzard: {
      he: ['במשחק הזה החיצים הם ג\'ויסטיק, ו-[רווח] הוא הכפתור שלו (אפשר גם [Alt], במק [Option]). בטלפון יש מתחת למסך ידית וכפתור אש.',
        'במקור המשחק עבד רק עם מפתח חומרתי (dongle) בשקע הג\'ויסטיק השמאלי. כאן המכונה מחברת מפתח וירטואלי בזמן הטעינה, ומוציאה אותו כשהמשחק כותב {REMOVE DONGLE}.',
        'הטעינה לוקחת כארבע דקות, והמשחק מתחיל לבד: קודם הלוגו של Tom Mix, ואחר כך מסך הפתיחה. בוחרים צבע: [1], [2] או [3].',
        'על {1 OR 2 PLAYERS?} לוחצים [1] או [2].',
        'רוכבים על ציפור מעופפת בין צוקים. הכפתור מנפנף בכנפיים, ו-[←] [→] מכוונים. מפילים רוכב אויב כשפוגעים בו מלמעלה.',
        'בתחתית המסך: הנקודות של שני השחקנים.'],
      en: ['In this game the arrow keys are a joystick and [Space] is its button (or [Alt], [Option] on a Mac). On a phone there is a stick and a fire button under the screen.',
        'The original only worked with a hardware dongle in the left joystick port. Here the machine plugs in a virtual dongle while loading, and takes it out when the game says REMOVE DONGLE.',
        'Loading takes about four minutes, and the game starts by itself: first the Tom Mix logo, then the title screen. Pick a colour: [1], [2] or [3].',
        'At 1 OR 2 PLAYERS? press [1] or [2].',
        'You ride a flying bird between the ledges. The button flaps its wings, and [←] [→] steer. Knock an enemy rider off by hitting him from above.',
        'At the bottom of the screen: the scores of both players.']
    },
    // שתי ההרפתקאות של Ron Krebs נבדקו במכונה (3.11): טעינה, EXEC, מסך הפתיחה, השאלה על משחק שמור, LOOK, GO, TAKE INVENTORY,
    // HELP, ו-QUIT שחוזר ל-BASIC דרך $B45C. ובסבב 4: SAVE GAME ל"הקלטות שלי", וטעינה עם Y באותו מקום (שני המשחקים)
    sanctum: {
      he: ['הטעינה לוקחת כדקה וחצי. כשמופיע OK מקלידים {EXEC} ו-[ENTER].',
        'במסך הפתיחה לוחצים מקש. על {WANT TO PLAY A "SAVED" GAME?} לוחצים [N] (או [Y], כדי להמשיך משחק שמור).',
        'מתחילים בהרים, ליד בקתה, ושלג יורד. מעבר להם מנזר ישן, ובו כוחות של כישוף שחור. צריך למצוא אותם ולהשמיד אותם.',
        'כותבים פועל ושם עצם באנגלית ולוחצים [ENTER]. למשל {LOOK} (להסתכל), {OPEN DOOR} (לפתוח את הדלת), {TAKE LANTERN} (לקחת את הפנס). ארבע האותיות הראשונות מספיקות.',
        'הולכים עם {GO} וכיוון: {GO NORTH} (צפונה), {GO SOUTH}, {GO EAST}, {GO WEST}, {GO UP}, {GO DOWN}. {TAKE INVENTORY} מראה מה בידיים.',
        'שמירה: {SAVE GAME}. על {PRESS ENTER WHEN READY} לוחצים [ENTER], ועל {ENTER DATA FILE NAME:} כותבים שם ו-[ENTER]. המשחק נשמר ב"הקלטות שלי", ונגמר.',
        'כדי להמשיך מאותו מקום: טוענים את המשחק שוב, ועל השאלה על משחק שמור לוחצים [Y], אחר כך [ENTER] ואותו שם. {QUIT} מסיים, ועל {HOW ABOUT ANOTHER (Y OR N)?} לוחצים [N] כדי לחזור ל-BASIC.'],
      en: ['Loading takes about a minute and a half. When OK appears, type EXEC and [ENTER].',
        'On the title screen press a key. At WANT TO PLAY A "SAVED" GAME? press [N] (or [Y] to carry on a saved game).',
        'You start in the mountains, by a cabin, with snow falling. Beyond them stands an old monastery, where the forces of black magic are at work. Find them and destroy them.',
        'Type a verb and a noun, then [ENTER]. For example LOOK, OPEN DOOR, TAKE LANTERN. The first four letters are enough.',
        'Move with GO and a direction: GO NORTH, GO SOUTH, GO EAST, GO WEST, GO UP, GO DOWN. TAKE INVENTORY shows what you carry.',
        'Saving: SAVE GAME. At PRESS ENTER WHEN READY press [ENTER], and at ENTER DATA FILE NAME: type a name and [ENTER]. The game is saved to My tapes, and ends.',
        'To carry on from the same place: load the game again, and at the question about a saved game press [Y], then [ENTER] and the same name. QUIT ends the game, and at HOW ABOUT ANOTHER (Y OR N)? press [N] to go back to BASIC.']
    },
    calixto: {
      he: ['הטעינה לוקחת כדקה וחצי. כשמופיע OK מקלידים {EXEC} ו-[ENTER].',
        'במסך הפתיחה לוחצים מקש. על {WANT TO PLAY A \'SAVED\' GAME?} לוחצים [N] (או [Y], כדי להמשיך משחק שמור).',
        'מתחילים בחדר העבודה של פרופסור Lagarto. משם מגיעים לאי טרופי ולפירמידה של המאיה. צריך למצוא אוצר ולהחזיר אותו למקום שלו.',
        'כותבים פועל ושם עצם באנגלית ולוחצים [ENTER]. למשל {LOOK} (להסתכל), {OPEN DESK} (לפתוח את השולחן), {READ MESSAGE} (לקרוא את הפתק). ארבע האותיות הראשונות מספיקות.',
        'הולכים עם {GO} וכיוון: {GO NORTH} (צפונה), {GO SOUTH}, {GO EAST}, {GO WEST}, {GO UP}, {GO DOWN}. {TAKE INVENTORY} מראה מה בידיים, ו-{SCORE} את הניקוד.',
        'שמירה: {SAVE GAME}. על {PRESS ENTER WHEN READY} לוחצים [ENTER], ועל {ENTER DATA FILE NAME:} כותבים שם ו-[ENTER]. המשחק נשמר ב"הקלטות שלי", ונגמר.',
        'כדי להמשיך מאותו מקום: טוענים את המשחק שוב, ועל השאלה על משחק שמור לוחצים [Y], אחר כך [ENTER] ואותו שם. {QUIT} מסיים, ועל {HOW ABOUT ANOTHER (Y OR N)?} לוחצים [N] כדי לחזור ל-BASIC.'],
      en: ['Loading takes about a minute and a half. When OK appears, type EXEC and [ENTER].',
        'On the title screen press a key. At WANT TO PLAY A \'SAVED\' GAME? press [N] (or [Y] to carry on a saved game).',
        'You start in Professor Lagarto\'s study. From there you reach a tropical island and a Mayan pyramid. Find a treasure and return it to its proper place.',
        'Type a verb and a noun, then [ENTER]. For example LOOK, OPEN DESK, READ MESSAGE. The first four letters are enough.',
        'Move with GO and a direction: GO NORTH, GO SOUTH, GO EAST, GO WEST, GO UP, GO DOWN. TAKE INVENTORY shows what you carry, and SCORE shows your score.',
        'Saving: SAVE GAME. At PRESS ENTER WHEN READY press [ENTER], and at ENTER DATA FILE NAME: type a name and [ENTER]. The game is saved to My tapes, and ends.',
        'To carry on from the same place: load the game again, and at the question about a saved game press [Y], then [ENTER] and the same name. QUIT ends the game, and at HOW ABOUT ANOTHER (Y OR N)? press [N] to go back to BASIC.']
    },
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
    // נבדק במכונה (2.11): הטעינה, הצבע, החדר הראשון (CHAMBER 0), הדמות זזה בג'ויסטיק, ונופלים ומאבדים חיים
    downland: {
      he: ['במשחק הזה החיצים הם ג\'ויסטיק, ו-[רווח] הוא הכפתור שלו (אפשר גם [Alt], במק [Option]). בטלפון יש מתחת למסך ידית וכפתור אש.',
        'הטעינה לוקחת כשלוש דקות, והמשחק מתחיל לבד. בוחרים צבע: [1] שחור, [2] בהיר, [3] ירוק. אחר כך לוחצים על הכפתור.',
        'אתם בחדר הראשון של המערה (CHAMBER 0). [←] [→] הולכים, [↑] [↓] מטפסים על חבלים וסולמות, והכפתור קופץ.',
        'אוספים את האוצרות ואת המפתחות: מפתח פותח דלת לחדר הבא. הטיפות שנופלות מהתקרה ונפילה מגובה עולות חיים.',
        'המספר למטה מימין הוא הבונוס, והוא יורד עם הזמן. למעלה מופיעים החיים שנשארו ומספר החדר.'],
      en: ['In this game the arrow keys are a joystick and [Space] is its button (or [Alt], [Option] on a Mac). On a phone there is a stick and a fire button under the screen.',
        'Loading takes about three minutes, and the game starts by itself. Pick a colour: [1] black, [2] buff, [3] green. Then press the button.',
        'You are in the first chamber of the cave (CHAMBER 0). [←] [→] walk, [↑] [↓] climb ropes and ladders, and the button jumps.',
        'Collect the treasure and the keys: a key opens a door to the next chamber. The drops falling from the ceiling, and a fall from a height, cost a life.',
        'The number at the bottom right is the bonus, and it runs down with time. At the top are the lives you have left and the chamber number.']
    },
    // נבדק במכונה (2.11): הטעינה, הצבע, מסך הפתיחה עם הרמות, החללית מסתובבת לשני הצדדים ויורה, המכ"ם
    nerble: {
      he: ['במשחק הזה החיצים הם ג\'ויסטיק, ו-[רווח] הוא הכפתור שלו (אפשר גם [Alt], במק [Option]). בטלפון יש מתחת למסך ידית וכפתור אש.',
        'הטעינה לוקחת כשתי דקות, והמשחק מתחיל לבד: קודם TAPE NOW LOADING, ואחר כך המסך של Microdeal. בוחרים צבע: [1], [2] או [3].',
        'במסך הפתיחה של NERBLE FORCE בוחרים רמה בג\'ויסטיק, מ-SPACE CADET (הכי קלה) עד STARFLEET ADMIRAL, ולוחצים על הכפתור.',
        '[←] [→] מפנים את החללית וטסים, [↑] [↓] עולים ויורדים, והכפתור יורה. הפס התחתון הוא מכ"ם של כל העולם.',
        'בתחתית המסך: הנקודות של שחקן שמאל (L) ושל שחקן ימין (R).'],
      en: ['In this game the arrow keys are a joystick and [Space] is its button (or [Alt], [Option] on a Mac). On a phone there is a stick and a fire button under the screen.',
        'Loading takes about two minutes, and the game starts by itself: first TAPE NOW LOADING, then the Microdeal screen. Pick a colour: [1], [2] or [3].',
        'On the NERBLE FORCE title screen choose a level with the joystick, from SPACE CADET (the easiest) to STARFLEET ADMIRAL, and press the button.',
        '[←] [→] turn the ship and fly, [↑] [↓] climb and dive, and the button fires. The strip at the bottom is a radar of the whole world.',
        'At the bottom of the screen: the score of the left player (L) and the right player (R).']
    },
    // נבדק במכונה (2.11): הטעינה בשני חלקים, מסך הפתיחה (DONKEY KING), השאלות וההוראות. המשחק מתעלם ממקשים כמה שניות אחרי כל שאלה
    king: {
      he: ['במשחק הזה החיצים הם ג\'ויסטיק, ו-[רווח] הוא הכפתור שלו (אפשר גם [Alt], במק [Option]). בטלפון יש מתחת למסך ידית וכפתור אש.',
        'הטעינה לוקחת כשלוש דקות, והמשחק מתחיל לבד. על המסך כתוב DONKEY KING: זה השם שבו Microdeal מכרה אותו ל-Dragon.',
        'המשחק שואל כמה שאלות, ואחרי כל אחת הוא לא מקשיב כמה שניות. מחכים רגע ועונים: [N] מהירות רגילה ([S] איטית), [N] בלי הוראות, [1] שחקן אחד, [N] בלי משחק אימון.',
        'המטרה: לטפס על הרמפות ועל הסולמות ולהציל את הנערה. [←] [→] הולכים, [↑] [↓] מטפסים, והכפתור קופץ מעל החביות.',
        'שחקן 1 משתמש בג\'ויסטיק הימני, ושחקן 2 בשמאלי.'],
      en: ['In this game the arrow keys are a joystick and [Space] is its button (or [Alt], [Option] on a Mac). On a phone there is a stick and a fire button under the screen.',
        'Loading takes about three minutes, and the game starts by itself. The screen says DONKEY KING: the name Microdeal sold it under for the Dragon.',
        'The game asks a few questions, and after each one it ignores the keys for a few seconds. Wait a moment, then answer: [N] normal speed ([S] slow), [N] no instructions, [1] one player, [N] no practice game.',
        'The aim: climb the ramps and ladders and rescue the maiden. [←] [→] walk, [↑] [↓] climb, and the button jumps over the barrels.',
        'Player 1 uses the right joystick, and player 2 the left.']
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
    // נבדק במכונה (7.11): CLOAD, ‏RUN, ההקדמה והמקום הראשון. ההוראות מתוך ההקדמה של המשחק
    williamsburg: {
      he: ['הרפתקת טקסט ב-Williamsburg הקולוניאלית שבווירג\'יניה, עם מקומות לפי העיר האמיתית. המטרה: למצוא את פרסת הזהב המפורסמת, שמוסתרת אי שם בעיר, ולהביא אותה הביתה. בדרך יש שוטרים, קצב, מבוך ורוחות.',
        'כשמופיע OK מקלידים {RUN}. ל-INTRODUCTION (Y/N)? לוחצים [Y] כדי לקרוא את ההקדמה, ובכל מסך לוחצים מקש או [ENTER].',
        'כותבים פקודה של שתי מילים באנגלית ולוחצים [ENTER], למשל {GET BOOK}, {OPEN DOOR} או {SHUT WINDOW}. אם המחשב לא מבין, מנסים מילים אחרות.',
        'הולכים בכיוונים עם {N}, ‏{S}, ‏{E} ו-{W}. בראש המסך כתוב איפה אתם, מה רואים ולאן אפשר ללכת. נתקעתם? {HELP}.'],
      en: ['A text adventure in colonial Williamsburg, Virginia, with places from the real town. The goal: find the famous Golden Horseshoe, hidden somewhere in the city, and bring it home. On the way there are police, a butcher, a maze and ghosts.',
        'When OK appears type {RUN}. At INTRODUCTION (Y/N)? press [Y] to read the introduction, and press a key or [ENTER] on each screen.',
        'Type a two-word command in English and press [ENTER], for example {GET BOOK}, {OPEN DOOR} or {SHUT WINDOW}. If the computer does not understand, try other words.',
        'Move with {N}, {S}, {E} and {W}. The top of the screen shows where you are, what you see and where you can go. Stuck? {HELP}.']
    },
    // נבדק במכונה (7.11): הטעינה, בחירת הצבע, הפתיחה, בחירת הרמה והמסך הראשון. הקומקום זז בג'ויסטיק. המסכים לפי האתר של L. Curtis Boyle
    teatime: {
      he: ['במשחק הזה החיצים הם ג\'ויסטיק, ו-[רווח] הוא הכפתור שלו (אפשר גם [Alt], במק [Option]). בטלפון יש מתחת למסך ידית וכפתור אש.',
        'הטעינה מתחילה לבד. במסך הפתיחה בוחרים צבע: [1] שחור, [2] צהבהב, [3] ירוק. אחרי ההסבר מופיע SELECT START LEVEL: מקלידים מספר מ-[1] עד [8] ולוחצים [ENTER].',
        'משחק פעולה במטבח, בשלושה מסכים. במסך הראשון תופסים את טיפות התה בקומקום, וממלאים את הספל הצמא שבפינה. מזיזים את הקומקום בחיצים.',
        'במסך השני מתחמקים מקוביות סוכר שנופלות: פגיעה אחת עוד אפשר לשרוד, השנייה הורגת. במסך השלישי, במזווה, עולים במעליות ואוספים ערמות של תה, ובסוף מחברים את הקומקום לכיסוי שלו.'],
      en: ['In this game the arrow keys are a joystick and [Space] is its button (or [Alt], [Option] on a Mac). On a phone there is a stick and a fire button under the screen.',
        'Loading starts by itself. On the title screen choose a colour: [1] black, [2] buff, [3] green. After the explanation, SELECT START LEVEL appears: type a number from [1] to [8] and press [ENTER].',
        'An action game in a kitchen, in three screens. On the first, catch the tea drops in your teapot and fill the thirsty mug in the corner. Move the teapot with the arrows.',
        'On the second, dodge falling sugar cubes: you can survive one hit, the second kills. On the third, in the pantry, ride lifts to collect piles of tea, and at the end bring the teapot to its cosy.']
    },
    // נבדק במכונה (7.11): הטעינה (מתחילה ב-hook של $016A), ההוראות, השם, המהירות, מספר המפלצות והקומות. ההוראות מהמסך של המשחק
    bonka: {
      he: ['משחק סולמות וקומות: מפלצות כחולות מסתובבות בקומות. חופרים בור, וכשמפלצת נופלת לתוכו, נותנים לה מכה בראש. כמה שהיא נופלת יותר רחוק, מקבלים יותר נקודות.',
        'הטעינה מתחילה לבד. מופיע הסבר: לוחצים מקש. המשחק שואל NAME PLEASE (כותבים שם ו-[ENTER]), ‏SPEED (מהירות, [1] עד [4]) ו-MEANIES (כמה מפלצות, [1] עד [9]).',
        'במשחק הזה משחקים במקלדת: החיצים מזיזים את האיש ומעלים ומורידים אותו בסולמות, ו-[רווח] חופר או נותן מכה.'],
      en: ['A game of ladders and floors: blue meanies roam the floors. Dig a hole, and when a meanie falls into it, bonk it on the head. The further it falls, the more points you get.',
        'Loading starts by itself. An explanation appears: press a key. The game asks NAME PLEASE (type a name and [ENTER]), SPEED ([1] to [4]) and MEANIES (how many, [1] to [9]).',
        'This game is played on the keyboard: the arrows move your man and take him up and down the ladders, and [Space] digs or bonks.']
    },
    // נבדק במכונה (7.11): הטעינה (מתחילה ב-hook של $016A), בחירת המהירות, הלהקה ויריות. ג'ויסטיק ימני
    vultures: {
      he: ['במשחק הזה החיצים הם ג\'ויסטיק, ו-[רווח] הוא הכפתור שלו (אפשר גם [Alt], במק [Option]). בטלפון יש מתחת למסך ידית וכפתור אש.',
        'הטעינה מתחילה לבד. במסך הפתיחה בוחרים מהירות, SLOW, ‏MEDIUM או FAST, בחץ ימינה או שמאלה, ולוחצים על הכפתור כדי להתחיל.',
        'משחק יריות: להקת נשרים מעליכם, והם צוללים ומפילים דברים. אתם בתחתית המסך: זזים ימינה ושמאלה בחיצים ויורים בכפתור.'],
      en: ['In this game the arrow keys are a joystick and [Space] is its button (or [Alt], [Option] on a Mac). On a phone there is a stick and a fire button under the screen.',
        'Loading starts by itself. On the title screen choose a speed, SLOW, MEDIUM or FAST, with the right or left arrow, and press the button to start.',
        'A shooting game: a flock of vultures above you dives and drops things. You are at the bottom of the screen: move left and right with the arrows and fire with the button.']
    },
    // נבדק במכונה (7.11): הטעינה, שם הנהג, רמת הקושי והנסיעה במסלול. ג'ויסטיק ימני: הכפתור הוא דוושת הגז
    maurice: {
      he: ['במשחק הזה החיצים הם ג\'ויסטיק, ו-[רווח] הוא הכפתור שלו (אפשר גם [Alt], במק [Option]). בטלפון יש מתחת למסך ידית וכפתור אש.',
        'הטעינה מתחילה לבד. במסך הפתיחה לוחצים מקש. ל-DRIVERS NAME PLEASE? כותבים שם ולוחצים [ENTER], ואז בוחרים רמת קושי מ-[1] (KINGPIN, הכי קשה) עד [6] (SUNDAY DRIVER).',
        'מכונית Morris Minor קטנה נכנסה בטעות למסלול של מרוץ גרנד פרי. הכפתור הוא הגז: לוחצים כדי לנסוע. החיצים למעלה ולמטה מזיזים את המכונית בין הנתיבים, ועוקפים את מכוניות המרוץ.',
        'למעלה מוצג מד הנזק (100% כשהמכונית שלמה), ולמטה הזמן והמיילים. כל התנגשות פוגעת במכונית. בסוף יש טבלת שיאים.'],
      en: ['In this game the arrow keys are a joystick and [Space] is its button (or [Alt], [Option] on a Mac). On a phone there is a stick and a fire button under the screen.',
        'Loading starts by itself. On the title screen press a key. At DRIVERS NAME PLEASE? type a name and press [ENTER], then choose a skill level from [1] (KINGPIN, the hardest) to [6] (SUNDAY DRIVER).',
        'A little Morris Minor has wandered onto a Grand Prix track. The button is the accelerator: hold it to drive. The up and down arrows move the car between lanes, past the racing cars.',
        'At the top is the damage meter (100% when the car is whole), and at the bottom the time and the miles. Every crash damages the car. At the end there is a hall of fame.']
    },
    // נבדק במכונה (7.11): הטעינה, התמונה, הקרדיטים, טבלת השיאים והטיסה מעל הנוף. ג'ויסטיק
    starman: {
      he: ['במשחק הזה החיצים הם ג\'ויסטיק, ו-[רווח] הוא הכפתור שלו (אפשר גם [Alt], במק [Option]). בטלפון יש מתחת למסך ידית וכפתור אש.',
        'הטעינה ארוכה, כשלוש וחצי דקות: קודם מופיעה תמונה של Starman Jones, ואחר כך הקרדיטים עם Press fire to continue. לוחצים על הכפתור, ובטבלת השיאים שוב.',
        'Starman Jones, החוקר מהמשחק Caverns of Chaos, טס בחללית מעל נוף של כוכב. מזיזים את החללית בחיצים ויורים בכפתור.',
        'בתחתית המסך מוצגים הדלק (FUEL), מספר החיים (שלושה בהתחלה), הניקוד והשיא.'],
      en: ['In this game the arrow keys are a joystick and [Space] is its button (or [Alt], [Option] on a Mac). On a phone there is a stick and a fire button under the screen.',
        'The load is long, about three and a half minutes: first a picture of Starman Jones appears, then the credits with Press fire to continue. Press the button, and again at the high-score table.',
        'Starman Jones, the explorer from the game Caverns of Chaos, flies his ship over a planet\'s landscape. Move the ship with the arrows and fire with the button.',
        'The bottom of the screen shows the FUEL, the lives (three to start), the score and the high score.']
    },
    // נבדק במכונה (7.11): הטעינה (ה-hook של $019A, שמדלג על בדיקת ה-BREAK), המבוך, התפריט, ‏INVENTORY. המבוך לפי הביקורת ב-Dragon User
    sword: {
      he: ['הרפתקה במבוך של 225 מקומות, עם תמונה של המסדרון שלפניכם. עוברים מקום אחרי מקום, נלחמים במי שפוגשים, ומנסים לצאת בחיים.',
        'הטעינה, כשלוש דקות, מתחילה לבד. מופיע מסך השם, ואחריו התמונה של המבוך והתפריט.',
        'החיצים מזיזים אתכם במבוך. כל צעד עולה בכוח: YOUR STRENGTH IS מראה כמה נשאר.',
        'הפעולות במקשי המספרים: [1] להתקיף, [2] לסחור, [3] לשחד, [4] להחליף נשק, [5] לברוח, [6] לאכול או לשתות, [7] מה אתם נושאים, [8] לקחת. בהתחלה יש לכם חרב קסם, מגן רומי, אוכל ושיקוי קסם.'],
      en: ['An adventure in a maze of 225 places, with a picture of the corridor ahead of you. Go from place to place, fight whatever you meet, and try to get out alive.',
        'Loading, about three minutes, starts by itself. The title screen appears, then the picture of the maze and the menu.',
        'The arrows move you through the maze. Every step costs strength: YOUR STRENGTH IS shows how much is left.',
        'The actions are on the number keys: [1] attack, [2] trade, [3] bribe, [4] change weapon, [5] run, [6] eat or drink, [7] inventory, [8] take. You start with a magic sword, a Roman shield, food and a magic potion.']
    },
    // נבדק במכונה (7.11): הטעינה, ההוראות ([I]), טבלת השיאים והמבוך. ההוראות מהמסך של המשחק. ג'ויסטיק
    wizlair: {
      he: ['במשחק הזה החיצים הם ג\'ויסטיק, ו-[רווח] הוא הכפתור שלו (אפשר גם [Alt], במק [Option]). בטלפון יש מתחת למסך ידית וכפתור אש.',
        'הטעינה ארוכה, כשלוש וחצי דקות. במסך הפתיחה [I] מראה הוראות, והכפתור ממשיך. בטבלת השיאים לוחצים שוב על הכפתור.',
        'שדים גנבו חפצים מהמקדש שלכם. אוספים את כל החלקים של ארבעת החפצים שמפוזרים במבוך: כדי לקחת חפץ פשוט עוברים עליו. מפתחות פותחים דלתות, ושרביטים יורים כדורי אש בלי לבזבז כוח.',
        'אם פס הכוח למטה יורד מתחת לאפס, מתים. כדי למלא אותו, חוזרים למקדש ועוברים על המשבצת המסומנת ב-X אדום. כשעומדים על המקום הנכון, החיצים למעלה ולמטה מעלים ומורידים בין הקומות של המבוך.'],
      en: ['In this game the arrow keys are a joystick and [Space] is its button (or [Alt], [Option] on a Mac). On a phone there is a stick and a fire button under the screen.',
        'The load is long, about three and a half minutes. On the title screen [I] shows instructions, and the button carries on. At the high-score table press the button again.',
        'Demons have stolen artifacts from your sanctuary. Collect all the pieces of the four artifacts scattered about the maze: to take an item, just pass over it. Keys open doors, and wands cast fireballs at no cost.',
        'If the power bar at the bottom falls below zero, you die. To refill it, return to your sanctuary and pass over the square marked with a red X. On the right spot, the up and down arrows take you between the levels of the maze.']
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
    // נבדק במכונה (6.11): CLOAD, ‏RUN, ‏SOLO?, ניחוש אותיות והתלייה. ההוראות לפי דף ההוראות המקורי
    hangit: {
      he: ['איש תלוי: המחשב בוחר שם של עיר או כפר בבריטניה (יש לו 1,000 כאלה), ומראה כוכבית במקום כל אות. מנחשים אות אחרי אות.',
        'כל אות נכונה מופיעה במקום שלה. על כל טעות מתווסף עוד חלק לאיש שעל הגרדום. אם הוא נשלם לפני שגיליתם את השם, מופיע YOU\'RE HANGED!.',
        'ל-DO YOU WANT TO PLAY SOLO? לוחצים [Y] כדי לשחק נגד המחשב. יש המתנה של כמה שניות, רק בפעם הראשונה, בזמן שהמחשב קורא את רשימת המילים.',
        'אפשר גם לשחק בשניים: לוחצים [N], ואחד מקליד מילה או משפט בשביל השני. בסוף לוחצים [@], ועל טעות לוחצים [^].'],
      en: ['Hangman: the computer picks the name of a town or village in Britain (it knows 1,000 of them), and shows an asterisk for each letter. Guess one letter at a time.',
        'A right letter appears in its place. Each wrong one adds another part to the man on the gallows. If he is finished before you find the name, YOU\'RE HANGED! appears.',
        'At DO YOU WANT TO PLAY SOLO? press [Y] to play the computer. There is a wait of a few seconds, only the first time, while it reads its word lists.',
        'You can also play in pairs: press [N], and one player types a word or phrase for the other. Press [@] when finished, and [^] to fix a mistake.']
    },
    // נבדק במכונה (6.11): CLOAD, ‏RUN, הפתיחה, NOVICE/EXPERT, ציוד רגיל, מסך המערה, צפונה, הקשבה ואזור לא נחקר. ההוראות לפי העטיפה ודף ההוראות המקוריים
    dhh: {
      he: ['שלושה חוקרי מערות אבדו עמוק ב-Death\'s Head Hole, ליד הכפר Priddy שבסומרסט. אתם וחבריכם בצוות ההצלה יורדים להציל את שלושתם, לפני שהגשם מציף את המעברים.',
        'רוב הזמן משחקים בארבעה מקשים: [N] [S] [E] [W] לצפון, דרום, מזרח ומערב. על המסך כתוב לאן אפשר ללכת. כיוון שלא כתוב הוא אזור לא נחקר: מסוכן, ומעייף יותר.',
        '[L] מקשיבים: שומעים אם יש חוקר אבוד בקרבת מקום. [F] אוכלים מנת מזון. [P] הניקוד, רק בכניסה ובחלק הראשון של המערה. [G] מוותרים.',
        'שמרו על הכוח (FITNESS) ועל הפנסים (LIGHTS): הם יורדים כל הזמן. בעזרת סולם יורדים בירידה תלולה, בעזרת חבל מטפסים, בעזרת אֵת פותחים מעבר סתום, וציוד הצלילה מעביר מעבר מוצף. לתהום לא נכנסים אף פעם.'],
      en: ['Three cavers are lost deep in Death\'s Head Hole, near the village of Priddy in Somerset. You and your rescue team go down to save all three, before the rain floods the passages.',
        'Most of the time you play with four keys: [N] [S] [E] [W] for north, south, east and west. The screen tells you which ways are open. A way it doesn\'t name is unexplored: dangerous, and more tiring.',
        '[L] listens for a lost caver nearby. [F] eats a food pack. [P] gives the score, only at the entrance and in the first part of the cave. [G] gives up.',
        'Watch your FITNESS and your LIGHTS: they run down all the time. A ladder gets you down a pitch, a rope up a climb, a shovel through a choked passage, and the sub-aqua set through a sump. Never step into a chasm.']
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
    // נבדק במכונה (31.10): CLOADM, ‏EXEC, מסך הפתיחה וטבלת השיאים, CAN YOU ESCAPE CAVE NO 01??, המערה, והאיש חופר בחיצים.
    // ההוראות לפי ה-README של המחבר וקוד המקור (כפתור לחוץ + כיוון = חופרים בלי לזוז; BREAK = מוותרים על חיים; Q = חזרה לפתיחה)
    // נבדק במכונה (31.10): המחסנית המקורית, מסך הפתיחה, EXAMINE (בתרמיל: WOODEN SWORD ו-PINE TORCH), PULL, ‏USE, ‏LOOK, ‏MOVE, ‏TURN, והמסדרון בתלת-ממד
    daggorath: {
      he: ['משחק פקודות: כותבים פקודה באנגלית ולוחצים [ENTER]. למטה רואים מה ביד שמאל ומה ביד ימין (EMPTY: ריקה), ובאמצע את הלב.',
        'בהתחלה חושך. בתרמיל יש חרב עץ ולפיד: {PULL RIGHT TORCH} ואחר כך {USE RIGHT} מדליקים את הלפיד, ו-{PULL LEFT SWORD} שם את החרב ביד שמאל.',
        'הולכים ב-{MOVE} (או {MOVE BACK}), ומסתובבים ב-{TURN LEFT}, ‏{TURN RIGHT} או {TURN AROUND}. ‏{LOOK} מראה שוב את המסדרון, ו-{EXAMINE} מה יש בחדר ובתרמיל.',
        'כשיצור מתקרב, תוקפים ב-{ATTACK LEFT} (ביד עם החרב). ‏{GET RIGHT} מרים חפץ מהרצפה ליד ימין, ‏{STOW RIGHT} מכניס את מה שביד לתרמיל, ‏{DROP RIGHT} זורק אותו, ו-{CLIMB UP} או {CLIMB DOWN} בסולם.',
        'שמים לב ללב: הוא דופק מהר יותר כשמתאמצים או נפגעים. כשהוא מהיר מדי, מתעלפים, אז נחים רגע לפני שממשיכים. המטרה: לרדת עד הקומה החמישית ולנצח את הקוסם.'],
      en: ['A command game: type a command in English and press [ENTER]. At the bottom you see what is in your left and right hands (EMPTY when nothing), and the heart in the middle.',
        'At first it is dark. Your backpack holds a wooden sword and a torch: {PULL RIGHT TORCH} and then {USE RIGHT} light the torch, and {PULL LEFT SWORD} puts the sword in your left hand.',
        'Walk with {MOVE} (or {MOVE BACK}), and turn with {TURN LEFT}, {TURN RIGHT} or {TURN AROUND}. {LOOK} shows the corridor again, and {EXAMINE} what is in the room and in your backpack.',
        'When a creature comes near, fight with {ATTACK LEFT} (the hand with the sword). {GET RIGHT} picks something up from the floor into your right hand, {STOW RIGHT} puts what it holds in the backpack, {DROP RIGHT} drops it, and {CLIMB UP} or {CLIMB DOWN} use a ladder.',
        'Watch the heart: it beats faster when you work hard or get hurt. If it gets too fast you faint, so rest a moment before going on. The goal: go down to the fifth level and defeat the wizard.']
    },
    // נבדק במכונה (31.10): CLOADM, ‏EXEC, מסך הפתיחה (INPUT LEVEL 0-9), המחבט הולך למקום של העכבר, והכפתור משחרר את הכדור.
    // ההוראות לפי ה-README המקורי של המחבר מ-1987 וקוד המקור (25 שלבים; המחבט קורא את הג'ויסטיק הימני, כמו ידית)
    brickout: {
      he: ['שוברים את כל הלבנים בכדור. המחבט הולך למקום של העכבר על המסך, כמו ידית של פעם. אפשר גם בחיצים [←] [→], ובטלפון בידית או בגרירת אצבע על המסך.',
        'במסך הפתיחה, ב-INPUT LEVEL 0-9, לוחצים על מספר כדי לבחור באיזה שלב מתחילים, או על הכפתור כדי להתחיל מיד. יש 25 שלבים.',
        'יש לבנים שאפשר לשבור רק מלמעלה, רק מהצד או רק מלמטה. ליד SCORE רואים כמה מחבטים נשארו.',
        'מלבנים נופלות אותיות. תופסים אותן במחבט: E מאריך את המחבט, P נותן מחבט נוסף, B מקפיץ לשלב הבא, S מאט את הכדור, ו-C מדביק את הכדור למחבט עד שלוחצים על הכפתור.',
        'הכפתור: לחיצה בעכבר על המסך, [רווח] או [Alt] (במק [Option]). בטלפון: כפתור האש.'],
      en: ['Break all the bricks with the ball. The paddle goes where the mouse is on the screen, like a paddle controller of the time. The arrows [←] [→] work too, and on a phone the stick or dragging a finger on the screen.',
        'On the title screen, at INPUT LEVEL 0-9, press a number to choose the starting level, or the button to start at once. There are 25 levels.',
        'Some bricks can only be broken from the top, the side or the bottom. Next to SCORE you see how many paddles are left.',
        'Letters fall from the bricks. Catch them with the paddle: E expands the paddle, P gives an extra paddle, B breaks through to the next level, S slows the ball, and C makes the ball stick to the paddle until you press the button.',
        'The button: a mouse click on the screen, [Space] or [Alt] ([Option] on a Mac). On a phone: the fire button.']
    },
    // נבדק במכונה (31.10): CLOAD, ‏RUN, מסך הפתיחה עם המנגינה, והנחש זז בחיצים. ההוראות לפי קוד המקור ו-GAMEPLAY.md של המחבר
    snaker: {
      he: ['נחש יורד בכביש, ומכוניות צבעוניות עולות מולו מלמטה. מגיעים עד למטה בלי להתנגש, שלוש פעמים. הזמן הוא הניקוד: כמה שפחות, יותר טוב.',
        'במשחק הזה החיצים הם ג\'ויסטיק: [←] [→] מכוונים את הנחש. [↑] מאיץ ו-[↓] מאט. בטלפון: הידית שמתחת למסך.',
        'במסך הפתיחה, כש-press ANY key TO START מופיע, לוחצים [ENTER].',
        'התנגשות במכונית מחזירה את הנחש שורה אחת למעלה, וממשיכים משם.',
        'שיא חדש? המשחק שואל WHAT IS YOUR NAME: כותבים שם ולוחצים [ENTER]. ב-ANOTHER GAME (Y/N) עונים [Y] או [N].'],
      en: ['A snake goes down a highway while coloured cars rise towards it from the bottom. Reach the bottom without crashing, three times. Your time is the score: the lower, the better.',
        'In this game the arrows are the joystick: [←] [→] steer the snake. [↑] speeds up and [↓] slows down. On a phone: the stick under the screen.',
        'On the title screen, when press ANY key TO START appears, press [ENTER].',
        'Hitting a car sends the snake back up one row, and you go on from there.',
        'A new best time? The game asks WHAT IS YOUR NAME: type a name and press [ENTER]. At ANOTHER GAME (Y/N) answer [Y] or [N].']
    },
    // נבדק במכונה (6.11): הטעינה, מסך הפתיחה, 1 OR 2 PLAYERS, ‏SELECT LEVEL, החללית זזה בחיצים ומחליפה צבע בכפתור
    chameleon: {
      he: ['אתם החללית Chameleon, ושומרים על הכוכב שלכם: האויב מפיל עליו פצצות מלמעלה, ואתם עוצרים אותן לפני שהן נוחתות.',
        'יש פצצות כחולות, של חומר, ופצצות צהובות, של אנטי-חומר. משמידים פצצה כשנוגעים בה, אבל רק כשהחללית באותו צבע שלה. כפתור הג\'ויסטיק מחליף את הצבע של החללית.',
        'פצצה עם חור באמצע היא פצצת-על: שווה יותר, ומורידה יותר אם היא נוחתת. המוקשים האדומים רודפים אחרי החללית, בכל צבע. שלוש חלליות בהתחלה, ועוד אחת כל 10,000 נקודות.',
        'כשהטעינה נגמרת מופיעים שם המשחק ומסך הדגמה. ל-SELECT 1 OR 2 PLAYERS לוחצים [1] או [2], ול-SELECT LEVEL לוחצים מספר מ-[1] עד [4].'],
      en: ['You are the Starship Chameleon, guarding your planet: the enemy drops bombs on it from above, and you stop them before they land.',
        'There are blue bombs, of matter, and yellow ones, of anti-matter. You destroy a bomb by running into it, but only when your ship is the same colour. The joystick button switches your ship\'s colour.',
        'A bomb with a hole in the middle is a super-bomb: worth more, and costs more if it lands. The red mines chase your ship whatever its colour. Three ships to start, and another every 10,000 points.',
        'When loading ends the title and a demo appear. At SELECT 1 OR 2 PLAYERS press [1] or [2], and at SELECT LEVEL a number from [1] to [4].']
    },
    // נבדק במכונה (6.11): CLOADM, ‏EXEC, מסך הפתיחה, תפריט השליטה, ‏READY PLAYER ONE, וסלע נשבר. המקשים לפי העטיפה המקורית ולפי קוד המשחק
    ninja: {
      he: ['לוחם נינג\'ה בדרך: סלעים מתגלגלים אליו, ובהמשך גם כדורי אש, חיצים ונינג\'ות אחרים. בועטים בסלעים כדי לשבור אותם, וקופצים מעל בורות ומכשולים.',
        'כל שלב הוא חגורה בצבע אחר, מהחגורה הלבנה והלאה, וכל אחד קשה יותר מהקודם. עד שישה שחקנים, בתורות.',
        'במסך הפתיחה לוחצים מקש. כתוב JOYSTICK CONTROL SET: לוחצים [K] כדי לשחק במקלדת, ואחר כך את מספר השחקנים, [1] עד [6].',
        'במקלדת: [K] קופצים, [O] בועטים, [N] מתקדמים ו-[M] נסוגים. העצה מהעטיפה: הכי הרבה נקודות מקבלים על בעיטה בסלעים, והתזמון הוא הכול.'],
      en: ['A ninja on the road: rocks roll towards him, and later fireballs, arrows and other ninjas. Kick the rocks to break them, and jump over holes and obstacles.',
        'Each level is a belt of another colour, from the white belt up, each harder than the last. Up to six players, taking turns.',
        'On the title screen press a key. It says JOYSTICK CONTROL SET: press [K] to play on the keyboard, then the number of players, [1] to [6].',
        'On the keyboard: [K] jumps, [O] kicks, [N] advances and [M] retreats. The inlay\'s advice: kicking the rocks scores most, and timing is everything.']
    },
    // נבדק במכונה (7.11): הטעינה, מסך הפתיחה, הדירה, ‏SCORE,‏ SAVE GAME ו-LOAD GAME. העלילה לפי האתר של L. Curtis Boyle, הפקודות כמו בשאר הסדרה
    shenan: {
      he: ['הרפתקה מצחיקה עם תמונה לכל מקום: מחפשים את סיר הזהב שבקצה הקשת. מתחילים בדירה קטנה, עם מיטה ישנה, שידה וחלון סגור.',
        'כשמופיע OK מקלידים {EXEC}. מופיע מסך הפתיחה של Mark Data Products: לוחצים מקש, ומופיעה הדירה.',
        'כותבים פועל ושם עצם באנגלית ולוחצים [ENTER], למשל {GET BED} או {EXAMINE DRESSER}. יש קיצורים: [N] [S] [E] [W] לכיוונים, [U] למעלה, [D] למטה, [I] מה בידיים, ו-[L] להסתכל.',
        'מתחת לתמונה כתוב מה רואים. בודקים כל חפץ: לא הכול מופיע בתמונה, והרבה רמזים מסתתרים בתיאורים.',
        '{SAVE GAME} שומר את המשחק על הקלטת, ו-{LOAD GAME} ממשיך ממנו. {SCORE} מראה כמה מהלכים עשיתם.'],
      en: ['A funny adventure with a picture for every place: you are after the pot of gold at the end of the rainbow. You start in a small flat, with an old bed, a dresser and a closed window.',
        'When OK appears type {EXEC}. The Mark Data Products title screen appears: press a key, and the flat appears.',
        'Type a verb and a noun in English and press [ENTER], for example {GET BED} or {EXAMINE DRESSER}. There are short forms: [N] [S] [E] [W] for directions, [U] up, [D] down, [I] inventory and [L] look.',
        'Under the picture it says what you see. Examine everything: not all of it shows in the picture, and many clues hide in the descriptions.',
        '{SAVE GAME} saves your game on tape, and {LOAD GAME} carries on from it. {SCORE} shows how many moves you have made.']
    },
    // נבדק במכונה (7.11): הטעינה, מסך הפתיחה (Sea Quest), החוף, ‏INVENTORY. העלילה לפי האתר של L. Curtis Boyle
    seasearch: {
      he: ['הרפתקה מתחת לים ולידו, עם תמונה לכל מקום: אוספים אוצרים ועוברים מכשולים. יש בה מפלים וכרישים שזזים על המסך. מתחילים על חוף חולי.',
        'כשמופיע OK מקלידים {EXEC}. מסך הפתיחה, עם השם Sea Quest, מצטייר לאט: מחכים לו ולוחצים מקש, ואחר כך [ENTER].',
        'כותבים פועל ושם עצם באנגלית ולוחצים [ENTER], למשל {READ SIGN} או {GO EAST}. יש קיצורים: [N] [S] [E] [W] לכיוונים, [U] למעלה, [D] למטה, [I] מה בידיים, ו-[L] להסתכל.',
        'מתחת לתמונה כתוב לאן אפשר ללכת ומה רואים. בודקים כל חפץ, וקוראים כל שלט.',
        '{SAVE GAME} שומר את המשחק על הקלטת, ו-{LOAD GAME} ממשיך ממנו. {SCORE} מראה כמה מהלכים עשיתם.'],
      en: ['An adventure by and under the sea, with a picture for every place: collect treasures and get past obstacles. It has waterfalls and sharks that move on the screen. You start on a sandy beach.',
        'When OK appears type {EXEC}. The title screen, named Sea Quest, draws slowly: wait for it and press a key, then [ENTER].',
        'Type a verb and a noun in English and press [ENTER], for example {READ SIGN} or {GO EAST}. There are short forms: [N] [S] [E] [W] for directions, [U] up, [D] down, [I] inventory and [L] look.',
        'Under the picture it says where you can go and what you see. Examine everything, and read every sign.',
        '{SAVE GAME} saves your game on tape, and {LOAD GAME} carries on from it. {SCORE} shows how many moves you have made.']
    },
    // נבדק במכונה (7.11): הטעינה, מסך הפתיחה, חדר הבקרה, ‏LOOK ו-INVENTORY. הפקודות והעלילה לפי ההוראות המקוריות
    trekboer: {
      he: ['הרפתקה בחלל עם תמונה לכל מקום. המאה ה-21: וירוס קטלני מאיים על כדור הארץ, ואתם על החללית Trekboer, בדרך לחפש תרופה בקצוות החלל. לפי ההוראות, שם החללית הוא הרמז הראשון.',
        'הטעינה לוקחת כארבע דקות ומתחילה לבד. במסך הפתיחה לוחצים מקש, ומופיע חדר הבקרה.',
        'כותבים פועל ושם עצם באנגלית ולוחצים [ENTER], למשל {GET BOX}, {EXAMINE BOX}, {UNLOCK DOOR} או {GO NORTH}. {GET ALL} לוקח את כל מה שאפשר, ו-{PUT ALL} מניח הכול.',
        'יש קיצורים: [N] [S] [E] [W] לכיוונים, [U] למעלה, [D] למטה, [G] לקחת, [P] להניח, [I] מה בידיים, ו-[L] להסתכל. לא תמיד הכיוונים הם הדרך היחידה: בודקים כל חפץ, וגם מה שלא מופיע בתמונה.',
        '{SAVE GAME} שומר את המשחק על הקלטת, ו-{LOAD GAME} ממשיך ממנו. {SCORE} מראה כמה מהלכים עשיתם.'],
      en: ['A space adventure with a picture for every place. The 21st century: a deadly virus threatens Earth, and you are aboard the starship Trekboer, off to search the far reaches of space for a cure. The instructions say the ship\'s name is the first clue.',
        'Loading takes about four minutes and starts by itself. On the title screen press a key, and the control room appears.',
        'Type a verb and a noun in English and press [ENTER], for example {GET BOX}, {EXAMINE BOX}, {UNLOCK DOOR} or {GO NORTH}. {GET ALL} picks up everything you can carry, and {PUT ALL} puts it all down.',
        'There are short forms: [N] [S] [E] [W] for directions, [U] up, [D] down, [G] get, [P] put, [I] inventory and [L] look. Compass directions are not always the only way: examine everything, including what is not in the picture.',
        '{SAVE GAME} saves your game on tape, and {LOAD GAME} carries on from it. {SCORE} shows how many moves you have made.']
    },
    // נבדק במכונה (6.11): הטעינה, מסך הפתיחה, המסדרון במוזיאון, ‏GO SOUTH ו-TAKE INVENTORY. הפקודות לפי העטיפה המקורית, העלילה לפי Solution Archive
    vortex: {
      he: ['הרפתקה של מסע בזמן, עם תמונה לכל מקום. מתחילים במוזיאון גדול עם הרבה תצוגות. צריך למצוא תשעה אוצרים, הפזורים בתקופות שונות, ולהחזיר אותם לחדר העבודה של אוצר המוזיאון.',
        'הטעינה ארוכה: כארבע דקות, ובסופה מופיע מסך של Mark Data Products. לוחצים מקש, ומופיע המסדרון הראשון.',
        'כותבים פועל ושם עצם באנגלית ולוחצים [ENTER], למשל {GET BOX} (לקחת את הקופסה), {EXAMINE BOX} (לבדוק אותה), {UNLOCK DOOR} (לפתוח את המנעול). {GET ALL} לוקח את כל מה שאפשר, ו-{PUT ALL} מניח הכול.',
        'יש קיצורים: [N] [S] [E] [W] לכיוונים, [U] למעלה, [D] למטה, [G] לקחת, [P] להניח, [I] מה בידיים, ו-[L] להסתכל. מתחת לתמונה כתוב לאן אפשר ללכת ומה רואים, אבל לא כל חפץ מופיע בתמונה: קוראים את הטקסט, ובודקים כל חפץ.',
        '{SAVE} שומר את המשחק, ו-{LOAD} ממשיך ממנו בפעם אחרת. {SCORE} מראה כמה מהלכים עשיתם.'],
      en: ['A time-travel adventure, with a picture for every place. You start in a large museum with many exhibits. Find nine treasures scattered through time, and bring them back to the museum curator\'s work room.',
        'The load is long: about four minutes, and at the end a Mark Data Products screen appears. Press a key, and the first hallway appears.',
        'Type a verb and a noun in English and press [ENTER], for example {GET BOX}, {EXAMINE BOX}, {UNLOCK DOOR}. {GET ALL} picks up everything you can carry, and {PUT ALL} puts it all down.',
        'There are short forms: [N] [S] [E] [W] for directions, [U] up, [D] down, [G] get, [P] put, [I] inventory and [L] look. Under the picture it says where you can go and what you see, but not every object shows in the picture: read the text, and examine everything.',
        '{SAVE} saves your game, and {LOAD} carries on from it another time. {SCORE} shows how many moves you have made.']
    },
    digit: {
      he: ['במשחק הזה החיצים הם ג\'ויסטיק, ו-[רווח] הוא הכפתור שלו (אפשר גם [Alt], במק [Option]). בטלפון יש מתחת למסך ידית וכפתור אש.',
        'במסך הפתיחה, עם טבלת השיאים, לוחצים על הכפתור. מופיע CAN YOU ESCAPE CAVE NO 01??, ואחריו המערה הראשונה. יש 25 מערות.',
        'חופרים באדמה ואוספים יהלומים. LEFT למעלה מראה כמה יהלומים עוד חסרים. כשאוספים מספיק, נפתחת היציאה, וצריך להגיע אליה לפני שה-BONUS נגמר.',
        'אבנים נופלות כשחופרים מתחתן, ומפלצות מסתובבות במנהרות: שתיהן הורגות. מפלצת הגולגולת הופכת ליהלומים כשהיא מתה, והחייזר מתפוצץ. גם הרפש מתפשט וסוגר דרכים.',
        'כפתור לחוץ יחד עם כיוון חופר את המשבצת שלידכם בלי לזוז אליה. נתקעתם? [BREAK] מוותר על החיים האלה ומתחיל את המערה מחדש, ו-[Q] חוזר למסך הפתיחה.'],
      en: ['In this game the arrows are the joystick, and [Space] is its button (or [Alt], [Option] on a Mac). On a phone there is a stick and a fire button under the screen.',
        'On the title screen, with the high scores, press the button. CAN YOU ESCAPE CAVE NO 01?? appears, then the first cave. There are 25 caves.',
        'Dig through the earth and collect diamonds. LEFT at the top shows how many diamonds are still missing. Collect enough and the exit opens; reach it before the BONUS runs out.',
        'Stones fall when you dig under them, and monsters roam the tunnels: both kill. The skull monster turns into diamonds when it dies, and the alien explodes. Slime spreads too and closes off paths.',
        'Holding the button while pushing a direction digs the square next to you without moving into it. Trapped? [BREAK] gives up this life and restarts the cave, and [Q] goes back to the title screen.']
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
    },
    // שמונה ההרפתקאות הבאות נבדקו במכונה (30.10): טעינה, שאלות הפתיחה, LOOK, INVENTORY, SCORE
    odyssey: {
      he: ['הטעינה לוקחת קצת פחות משתי דקות, והמשחק מתחיל לבד.',
        'בהתחלה שלוש שאלות. על {DO YOU HAVE LOWERCASE?} עונים [N] ו[ENTER], על {PRESS ENTER} לוחצים [ENTER], ועל {RESTORE A PREVIOUSLY SAVED GAME?} עונים [N] ו[ENTER].',
        'מתחילים בחללית קטנה של אדם אחד, שנחתה על אסטרואיד רחוק. בחוץ מחכים שרידים של ציוויליזציה עתיקה.',
        'כותבים פועל ושם עצם באנגלית ולוחצים [ENTER]. למשל {OPEN DOOR} (לפתוח את הדלת), {GO DOWN} (לרדת), {GET CONSOLE} (להרים את הלוח). שלוש האותיות הראשונות מספיקות.',
        'תיאור המקום תמיד מופיע למעלה במסך. הולכים בשש דרכים: {N S E W UP DOWN}. {INVENTORY} מראה מה בידיים, ו-{HELP} נותן רמז.',
        '{SAVE GAME} שומר את המשחק לקלטת, ואפשר להמשיך אחר כך.'],
      en: ['Loading takes a little under two minutes, and the game starts by itself.',
        'Three questions first. At DO YOU HAVE LOWERCASE? answer [N] and [ENTER], at PRESS ENTER press [ENTER], and at RESTORE A PREVIOUSLY SAVED GAME? answer [N] and [ENTER].',
        'You start in a one-man scout ship, landed on a distant asteroid. Outside wait the remains of an ancient civilisation.',
        'Type a verb and a noun, then [ENTER]. For example OPEN DOOR, GO DOWN, LOOK CONSOLE. The first three letters are enough.',
        'The description of the place always stays at the top of the screen. There are six ways to go: N S E W UP DOWN. INVENTORY shows what you carry, and HELP gives a hint.',
        'SAVE GAME saves the game to tape, so you can carry on later.']
    },
    funhouse: {
      he: ['הטעינה לוקחת קצת פחות משתי דקות, והמשחק מתחיל לבד.',
        'בהתחלה שתי שאלות: על {PRESS ENTER} לוחצים [ENTER], ועל {RESTORE A PREVIOUSLY SAVED GAME?} עונים [N] ו[ENTER].',
        'עומדים מול בית שעשועים בלונה פארק, עם נעליים, שעון ומסטיק יבש בכיס. בפנים: מראות, מבוכים והפתעות.',
        'כותבים פועל ושם עצם באנגלית ולוחצים [ENTER]. למשל {READ SIGN} (לקרוא את השלט), {GO EAST} (ללכת מזרחה), {LOOK COUNTER} (להסתכל על הדלפק). שלוש האותיות הראשונות מספיקות.',
        'תיאור המקום תמיד מופיע למעלה במסך. הולכים בשש דרכים: {N S E W UP DOWN}. {INVENTORY} מראה מה בידיים, ו-{HELP} נותן רמז.',
        '{SAVE GAME} שומר את המשחק לקלטת, ואפשר להמשיך אחר כך.'],
      en: ['Loading takes a little under two minutes, and the game starts by itself.',
        'Two questions first: at PRESS ENTER press [ENTER], and at RESTORE A PREVIOUSLY SAVED GAME? answer [N] and [ENTER].',
        'You stand in front of a fun house at a fairground, with shoes, a watch and some dry chewing gum. Inside: mirrors, mazes and surprises.',
        'Type a verb and a noun, then [ENTER]. For example READ SIGN, GO EAST, LOOK COUNTER. The first three letters are enough.',
        'The description of the place always stays at the top of the screen. There are six ways to go: N S E W UP DOWN. INVENTORY shows what you carry, and HELP gives a hint.',
        'SAVE GAME saves the game to tape, so you can carry on later.']
    },
    pyramid: {
      he: ['הטעינה לוקחת קצת פחות משתי דקות. כשמופיע OK מקלידים {EXEC} ו-[ENTER].',
        'בהתחלה שלוש שאלות. על {DO YOU HAVE LOWERCASE?} עונים [N] ו[ENTER], על {PRESS ENTER} לוחצים [ENTER], ועל {RESTORE A PREVIOUSLY SAVED GAME?} עונים [N] ו[ENTER].',
        'מתחילים במדבר, עם מימייה ריקה ופנס כבוי. מוט עץ בולט מהחול, ומתחתיו פירמידה מלאה אוצרות ומלכודות.',
        'כותבים פועל ושם עצם באנגלית ולוחצים [ENTER]. למשל {DIG SAND} (לחפור בחול), {GET POLE} (להרים את המוט), {GO NORTH} (ללכת צפונה). שלוש האותיות הראשונות מספיקות.',
        'תיאור המקום תמיד מופיע למעלה במסך. הולכים בשש דרכים: {N S E W UP DOWN}. {INVENTORY} מראה מה בידיים, ו-{HELP} נותן רמז.',
        '{SCORE} מראה כמה אוצרות נאספו. {SAVE GAME} שומר את המשחק לקלטת.'],
      en: ['Loading takes a little under two minutes. When OK appears, type EXEC and [ENTER].',
        'Three questions first. At DO YOU HAVE LOWERCASE? answer [N] and [ENTER], at PRESS ENTER press [ENTER], and at RESTORE A PREVIOUSLY SAVED GAME? answer [N] and [ENTER].',
        'You start in a desert with an empty canteen and an unlit flashlight. A wooden pole sticks out of the sand, and below lies a pyramid full of treasure and traps.',
        'Type a verb and a noun, then [ENTER]. For example DIG SAND, GET POLE, GO NORTH. The first three letters are enough.',
        'The description of the place always stays at the top of the screen. There are six ways to go: N S E W UP DOWN. INVENTORY shows what you carry, and HELP gives a hint.',
        'SCORE shows your treasures. SAVE GAME saves the game to tape.']
    },
    ghost: {
      he: ['הטעינה לוקחת קצת פחות משתי דקות, והמשחק מתחיל לבד.',
        'בהתחלה שלוש שאלות. על {DO YOU HAVE LOWERCASE?} עונים [N] ו[ENTER], על {PRESS ENTER} לוחצים [ENTER], ועל {RESTORE A PREVIOUSLY SAVED GAME?} עונים [N] ו[ENTER].',
        'מתחילים ברחוב של עיירת רפאים במערב הפרוע: מספרה, בית כלא ובתים נטושים. האוצרות מחכים למי שיעז להיכנס.',
        'כותבים פועל ושם עצם באנגלית ולוחצים [ENTER]. למשל {GO JAIL} (להיכנס לכלא), {GO BARBERSHOP} (להיכנס למספרה), {GO EAST} (ללכת מזרחה). שלוש האותיות הראשונות מספיקות.',
        'תיאור המקום תמיד מופיע למעלה במסך. הולכים בשש דרכים: {N S E W UP DOWN}. {INVENTORY} מראה מה בידיים, ו-{HELP} נותן רמז.',
        '{SCORE} מראה כמה אוצרות נאספו. {SAVE GAME} שומר את המשחק לקלטת.'],
      en: ['Loading takes a little under two minutes, and the game starts by itself.',
        'Three questions first. At DO YOU HAVE LOWERCASE? answer [N] and [ENTER], at PRESS ENTER press [ENTER], and at RESTORE A PREVIOUSLY SAVED GAME? answer [N] and [ENTER].',
        'You start on the street of a Wild West ghost town: a barber shop, a jail and empty houses. The treasures wait for whoever dares to go in.',
        'Type a verb and a noun, then [ENTER]. For example GO JAIL, GO BARBERSHOP, GO EAST. The first three letters are enough.',
        'The description of the place always stays at the top of the screen. There are six ways to go: N S E W UP DOWN. INVENTORY shows what you carry, and HELP gives a hint.',
        'SCORE shows your treasures. SAVE GAME saves the game to tape.']
    },
    savage1: {
      he: ['הטעינה לוקחת קצת פחות משתי דקות, והמשחק מתחיל לבד.',
        'בהתחלה שתי שאלות: על {PRESS ENTER} לוחצים [ENTER], ועל {RESTORE A PREVIOUSLY SAVED GAME?} עונים [N] ו[ENTER].',
        'מתחילים על חוף של אי פראי, ליד ראש אבן ענק וג\'ונגל סבוך. סערה מתקרבת. זו הרפתקה קשה, לשחקנים מנוסים.',
        'כותבים פועל ושם עצם באנגלית ולוחצים [ENTER]. למשל {GO JUNGLE} (להיכנס לג\'ונגל), {LOOK HEAD} (להסתכל על הראש), {GO EAST} (ללכת מזרחה). שלוש האותיות הראשונות מספיקות.',
        'תיאור המקום תמיד מופיע למעלה במסך. הולכים בשש דרכים: {N S E W UP DOWN}. {INVENTORY} מראה מה בידיים, ו-{HELP} נותן רמז.',
        '{SCORE} מראה כמה אוצרות נאספו. {SAVE GAME} שומר את המשחק לקלטת.'],
      en: ['Loading takes a little under two minutes, and the game starts by itself.',
        'Two questions first: at PRESS ENTER press [ENTER], and at RESTORE A PREVIOUSLY SAVED GAME? answer [N] and [ENTER].',
        'You start on the beach of a savage island, beside a huge stone head and an impenetrable jungle. A storm is coming. This one is hard, for experienced players.',
        'Type a verb and a noun, then [ENTER]. For example GO JUNGLE, LOOK HEAD, GO EAST. The first three letters are enough.',
        'The description of the place always stays at the top of the screen. There are six ways to go: N S E W UP DOWN. INVENTORY shows what you carry, and HELP gives a hint.',
        'SCORE shows your treasures. SAVE GAME saves the game to tape.']
    },
    savage2: {
      he: ['הטעינה לוקחת קצת פחות משתי דקות, והמשחק מתחיל לבד.',
        'בהתחלה שתי שאלות: על {PRESS ENTER} לוחצים [ENTER], ועל {RESTORE A PREVIOUSLY SAVED GAME?} עונים [N] ו[ENTER].',
        'ההמשך של חלק 1. בהתחלה קול מתכתי מבקש סיסמה: מקבלים אותה בסוף חלק 1. מי שעונה לא נכון, ההרפתקה נגמרת מיד.',
        'כותבים פועל ושם עצם באנגלית ולוחצים [ENTER]. שלוש האותיות הראשונות מספיקות.',
        'תיאור המקום תמיד מופיע למעלה במסך. הולכים בשש דרכים: {N S E W UP DOWN}. {INVENTORY} מראה מה בידיים, ו-{HELP} נותן רמז.',
        '{SCORE} מראה כמה אוצרות נאספו. {SAVE GAME} שומר את המשחק לקלטת.'],
      en: ['Loading takes a little under two minutes, and the game starts by itself.',
        'Two questions first: at PRESS ENTER press [ENTER], and at RESTORE A PREVIOUSLY SAVED GAME? answer [N] and [ENTER].',
        'The sequel to part 1. At the start a metallic voice asks for a password: you get it at the end of part 1. A wrong answer ends the adventure at once.',
        'Type a verb and a noun, then [ENTER]. The first three letters are enough.',
        'The description of the place always stays at the top of the screen. There are six ways to go: N S E W UP DOWN. INVENTORY shows what you carry, and HELP gives a hint.',
        'SCORE shows your treasures. SAVE GAME saves the game to tape.']
    },
    golden: {
      he: ['הטעינה לוקחת קצת פחות משתי דקות, והמשחק מתחיל לבד.',
        'בהתחלה שתי שאלות: על {PRESS ENTER} לוחצים [ENTER], ועל {RESTORE A PREVIOUSLY SAVED GAME?} עונים [N] ו[ENTER].',
        'מתחילים בעיר פרסית, ליד סוחר. מלך זקן מחכה לסוד הנעורים, וצריך להפליג ולמצוא אותו לפני שיהיה מאוחר.',
        'כותבים פועל ושם עצם באנגלית ולוחצים [ENTER]. למשל {GET SANDALS} (להרים את הסנדלים), {TALK MERCHANT} (לדבר עם הסוחר), {GO WEST} (ללכת מערבה). שלוש האותיות הראשונות מספיקות.',
        'תיאור המקום תמיד מופיע למעלה במסך. הולכים בשש דרכים: {N S E W UP DOWN}. {INVENTORY} מראה מה בידיים, ו-{HELP} נותן רמז.',
        '{SCORE} מראה כמה אוצרות נאספו. {SAVE GAME} שומר את המשחק לקלטת.'],
      en: ['Loading takes a little under two minutes, and the game starts by itself.',
        'Two questions first: at PRESS ENTER press [ENTER], and at RESTORE A PREVIOUSLY SAVED GAME? answer [N] and [ENTER].',
        'You start in a Persian city, beside a merchant. An old king awaits the secret of youth, and you must sail out and find it before it is too late.',
        'Type a verb and a noun, then [ENTER]. For example GET SANDALS, TALK MERCHANT, GO WEST. The first three letters are enough.',
        'The description of the place always stays at the top of the screen. There are six ways to go: N S E W UP DOWN. INVENTORY shows what you carry, and HELP gives a hint.',
        'SCORE shows your treasures. SAVE GAME saves the game to tape.']
    },
    claymorgue: {
      he: ['הטעינה לוקחת קצת פחות משתי דקות, והמשחק מתחיל לבד.',
        'בהתחלה שלוש שאלות. על {DO YOU HAVE LOWERCASE?} עונים [N] ו[ENTER], על {PRESS ENTER} לוחצים [ENTER], ועל {RESTORE A PREVIOUSLY SAVED GAME?} עונים [N] ו[ENTER].',
        'אתם שוליה של קוסם, עם שישה כישופים בכיס: אש, זרע, אור ועוד. צריך למצוא 13 כוכבים בטירה של מכשף רשע.',
        'כותבים פועל ושם עצם באנגלית ולוחצים [ENTER]. למשל {CAST FIRE} (להטיל את כישוף האש), {GO NORTH} (ללכת צפונה), {LOOK MOAT} (להסתכל על החפיר). שלוש האותיות הראשונות מספיקות.',
        'תיאור המקום תמיד מופיע למעלה במסך. הולכים בשש דרכים: {N S E W UP DOWN}. {INVENTORY} מראה מה בידיים, ו-{HELP} נותן רמז.',
        '{SCORE} מראה כמה אוצרות נאספו. {SAVE GAME} שומר את המשחק לקלטת.'],
      en: ['Loading takes a little under two minutes, and the game starts by itself.',
        'Three questions first. At DO YOU HAVE LOWERCASE? answer [N] and [ENTER], at PRESS ENTER press [ENTER], and at RESTORE A PREVIOUSLY SAVED GAME? answer [N] and [ENTER].',
        'You are a wizard\'s apprentice with six spells in your pocket: fire, seed, light and more. Find the 13 stars in the castle of an evil sorcerer.',
        'Type a verb and a noun, then [ENTER]. For example CAST FIRE, GO NORTH, LOOK MOAT. The first three letters are enough.',
        'The description of the place always stays at the top of the screen. There are six ways to go: N S E W UP DOWN. INVENTORY shows what you carry, and HELP gives a hint.',
        'SCORE shows your treasures. SAVE GAME saves the game to tape.']
    }
  };
  // מה קורה אחרי הטעינה ומה לוחצים: השורה האחרונה של "איך טוענים", וגם ההודעה מתחת לכפתור האדום
  // (גונן, 28.10: נתקע במסכים שמחכים למקש, כי "איך טוענים" אמר רק שהמשחק מתחיל לבד)
  const ADVQ = ['כשהטעינה נגמרת המשחק שואל שלוש שאלות: עונים [N] ו-[ENTER], אחר כך [ENTER], ושוב [N] ו-[ENTER].',
    'When loading ends the game asks three questions: answer [N] and [ENTER], then [ENTER], then [N] and [ENTER] again.'];
  const AFTER = {
    cavehunter: ['המשחק מתחיל לבד. כשמופיע המבוך, החיצים מכניסים את הצייד פנימה.', 'The game starts by itself. When the maze appears, the arrows take the hunter inside.'],
    buzzard: ['אחרי הלוגו מופיע מסך הפתיחה: בוחרים צבע ב-[1], [2] או [3], ועל 1 OR 2 PLAYERS? לוחצים [1].', 'After the logo the title screen appears: pick a colour with [1], [2] or [3], and at 1 OR 2 PLAYERS? press [1].'],
    sanctum: ['אחרי EXEC מופיע מסך הפתיחה: לוחצים מקש, ועל השאלה על משחק שמור לוחצים [N].', 'After EXEC the title screen appears: press a key, and at the question about a saved game press [N].'],
    calixto: ['אחרי EXEC מופיע מסך הפתיחה: לוחצים מקש, ועל השאלה על משחק שמור לוחצים [N].', 'After EXEC the title screen appears: press a key, and at the question about a saved game press [N].'],
    eggs: ['המשחק מופיע. מתחילים ב[רווח].', 'The game appears. Press [Space] to start.'],
    blockdown: ['כשהטעינה נגמרת המשחק מתחיל לבד. מתחילים ב[רווח].', 'When loading ends the game starts by itself. Press [Space] to start.'],
    dragontet: ['מופיע תפריט: בוחרים ב[↑] [↓] ומאשרים ב[ENTER].', 'A menu appears: choose with [↑] [↓] and confirm with [ENTER].'],
    escape: ['מופיעים מסך הפתיחה וההקדמה, ואז המסדרון: [↑] קדימה, [←] [→] מסתובבים.', 'The title screen and the introduction appear, then the corridor: [↑] forward, [←] [→] turn.'],
    spores: ['כשהטעינה נגמרת בוחרים צבע: [1], [2] או [3]. במסך הפתיחה לוחצים מקש, ב-JOYSTICK OR KEYBOARD? לוחצים [K], וב-1 OR 2 PLAYERS? לוחצים [1].', 'When loading ends pick a colour: [1], [2] or [3]. On the title screen press a key, at JOYSTICK OR KEYBOARD? press [K], and at 1 OR 2 PLAYERS? press [1].'],
    diablero: ['מופיע מסך הפתיחה: לוחצים מקש, ומקלידים פקודות באנגלית, למשל LOOK ו-[ENTER].', 'The title screen appears: press a key, then type commands in English, for example LOOK and [ENTER].'],
    invrev: ['ב-JOYSTICKS? לוחצים [N], ב-NEED INSTRUCTIONS? לוחצים [N], ואז בוחרים שחקנים, יריות ומהירות במספרים.', 'At JOYSTICKS? press [N], at NEED INSTRUCTIONS? press [N], then choose players, shots and speed with the number keys.'],
    downland: ['כשהטעינה נגמרת בוחרים צבע: [1], [2] או [3]. אחר כך לוחצים על הכפתור, והחדר הראשון מתחיל.', 'When loading ends pick a colour: [1], [2] or [3]. Then press the button, and the first chamber starts.'],
    nerble: ['כשהטעינה נגמרת בוחרים צבע: [1], [2] או [3]. במסך הפתיחה בוחרים רמה בג\'ויסטיק, ומתחילים בכפתור.', 'When loading ends pick a colour: [1], [2] or [3]. On the title screen choose a level with the joystick, and start with the button.'],
    king: ['כשהטעינה נגמרת עונים על השאלות: [N] למהירות רגילה, [N] בלי הוראות, [1] לשחקן אחד ו-[N] בלי משחק אימון. מחכים שתיים-שלוש שניות לפני כל תשובה.', 'When loading ends answer the questions: [N] for normal speed, [N] for no instructions, [1] for one player and [N] for no practice game. Wait two or three seconds before each answer.'],
    devil: ['כשהטעינה נגמרת בוחרים צבע: [1], [2] או [3]. ב-SELECT LEVEL בוחרים רמה, [0] עד [5], ומתחילים בכפתור.', 'When loading ends pick a colour: [1], [2] or [3]. At SELECT LEVEL pick a level, [0] to [5], and start with the button.'],
    phantom: ['המשחק שואל על ההוראות: [N] מדלג, [Y] מציג אותן.', 'The game asks about the instructions: [N] skips them, [Y] shows them.'],
    grabber: ['כשהטעינה נגמרת בוחרים צבע: [1], [2] או [3]. אחרי מסך הפתיחה, ב-NUMBER OF PLAYERS? לוחצים [1].', 'When loading ends pick a colour: [1], [2] or [3]. After the title screen, at NUMBER OF PLAYERS? press [1].'],
    draconian: ['כשהטעינה נגמרת בוחרים צבע: [1], [2] או [3]. במסך הפתיחה לוחצים [רווח], וכשמופיע NUMBER OF PLAYERS? לוחצים [1].', 'When loading ends pick a colour: [1], [2] or [3]. On the title screen press [Space], and when NUMBER OF PLAYERS? appears press [1].'],
    williamsburg: ['כשמופיע OK מקלידים {RUN}. ל-INTRODUCTION (Y/N)? לוחצים [Y] או [N].', 'When OK appears type {RUN}. At INTRODUCTION (Y/N)? press [Y] or [N].'],
    teatime: ['המשחק מתחיל לבד. בוחרים צבע, [1] עד [3], ואחר כך רמה, [1] עד [8], ו-[ENTER].', 'The game starts by itself. Choose a colour, [1] to [3], then a level, [1] to [8], and [ENTER].'],
    bonka: ['המשחק מתחיל לבד. לוחצים מקש, ועונים על השם, המהירות ומספר המפלצות.', 'The game starts by itself. Press a key, and answer the name, the speed and the number of meanies.'],
    vultures: ['המשחק מתחיל לבד. בוחרים מהירות בחיצים ולוחצים על הכפתור.', 'The game starts by itself. Choose a speed with the arrows and press the button.'],
    maurice: ['המשחק מתחיל לבד. לוחצים מקש, כותבים שם, ובוחרים רמה מ-[1] עד [6].', 'The game starts by itself. Press a key, type a name, and choose a level from [1] to [6].'],
    starman: ['המשחק מתחיל לבד. ב-Press fire to continue ובטבלת השיאים לוחצים על הכפתור.', 'The game starts by itself. At Press fire to continue and at the high-score table press the button.'],
    sword: ['המשחק מתחיל לבד, ומופיע המבוך עם התפריט.', 'The game starts by itself, and the maze appears with the menu.'],
    wizlair: ['המשחק מתחיל לבד. [I] להוראות, ואחר כך הכפתור, וגם בטבלת השיאים.', 'The game starts by itself. [I] for instructions, then the button, and again at the high-score table.'],
    alcatraz: ['כשמופיע OK מקלידים {RUN}. ל-DRAGON OR TANDY COLOR? לוחצים [D], ול-JOYSTICKS? לוחצים [Y].', 'When OK appears type {RUN}. At DRAGON OR TANDY COLOR? press [D], and at JOYSTICKS? press [Y].'],
    hangit: ['כשמופיע OK מקלידים {RUN}. ל-DO YOU WANT TO PLAY SOLO? לוחצים [Y], ומחכים כמה שניות עד PLEASE GUESS A LETTER.', 'When OK appears type {RUN}. At DO YOU WANT TO PLAY SOLO? press [Y], and wait a few seconds for PLEASE GUESS A LETTER.'],
    dhh: ['כשמופיע OK מקלידים {RUN}. ל-ADDITIONAL INSTRUCTIONS? לוחצים [Y] או [N]. אחר כך [N] למתחילים (NOVICE), ול-STANDARD RANGE OF EQUIPMENT? לוחצים [Y].', 'When OK appears type {RUN}. At ADDITIONAL INSTRUCTIONS? press [Y] or [N]. Then [N] for NOVICE, and at STANDARD RANGE OF EQUIPMENT? press [Y].'],
    lionht: ['כשמופיע OK מקלידים {RUN}. אחרי מסך הפתיחה, ב-SKILL LEVEL (1-5)? מקלידים מספר ו-[ENTER].', 'When OK appears type {RUN}. After the title screen, at SKILL LEVEL (1-5)? type a number and [ENTER].'],
    sas: ['כשמופיע OK מקלידים {RUN}. הפתיחה מוקלדת לאט, כמו במכונת כתיבה. ל-BRIEFING? לוחצים [Y] או [N].', 'When OK appears type {RUN}. The opening types out slowly, like a typewriter. At BRIEFING? press [Y] or [N].'],
    champs: ['כשמופיע OK מקלידים {RUN}. המשחק שואל WHICH TEAM WOULD YOU LIKE TO BE?: כותבים שם ולוחצים [ENTER].', 'When OK appears type {RUN}. The game asks WHICH TEAM WOULD YOU LIKE TO BE?: type a name and press [ENTER].'],
    cricket: ['מופיע מסך הפתיחה של Cricket, והמשחק ממשיך לטעון ולהתכונן עוד כמה דקות. אחר כך עונים על השאלות במקלדת.', 'The Cricket title screen appears, and the game goes on loading and preparing for a few minutes. Then answer the questions on the keyboard.'],
    tangle: ['כשמופיע OK מקלידים {EXEC}. אחרי מסך הפתיחה לוחצים [1] למשחק חדש.', 'When OK appears type {EXEC}. After the title screen press [1] for a new game.'],
    chameleon: ['הטעינה מתחילה לבד. ל-SELECT 1 OR 2 PLAYERS לוחצים [1], ול-SELECT LEVEL מספר מ-[1] עד [4].', 'The game starts by itself. At SELECT 1 OR 2 PLAYERS press [1], and at SELECT LEVEL a number from [1] to [4].'],
    ninja: ['כשמופיע OK מקלידים {EXEC}. במסך הפתיחה לוחצים מקש, אחר כך [K] (מקלדת) ו-[1] לשחקן אחד.', 'When OK appears type {EXEC}. On the title screen press a key, then [K] (keyboard) and [1] for one player.'],
    shenan: ['כשמופיע OK מקלידים {EXEC}. במסך הפתיחה של Mark Data Products לוחצים מקש.', 'When OK appears type {EXEC}. On the Mark Data Products title screen press a key.'],
    seasearch: ['כשמופיע OK מקלידים {EXEC}. מסך הפתיחה מצטייר לאט: מחכים לו, לוחצים מקש ואחר כך [ENTER].', 'When OK appears type {EXEC}. The title screen draws slowly: wait for it, press a key, then [ENTER].'],
    trekboer: ['המשחק מתחיל לבד בסוף הטעינה. במסך הפתיחה לוחצים מקש.', 'The game starts by itself when loading ends. On the title screen press a key.'],
    vortex: ['המשחק מתחיל לבד בסוף הטעינה. במסך של Mark Data Products לוחצים מקש.', 'The game starts by itself when loading ends. On the Mark Data Products screen press a key.'],
    digit: ['הטעינה לוקחת כשתי דקות. כשמופיע OK מקלידים {EXEC}. במסך הפתיחה לוחצים על כפתור הג\'ויסטיק, [רווח].', 'Loading takes about two minutes. When OK appears type {EXEC}. On the title screen press the joystick button, [Space].'],
    brickout: ['כשמופיע OK מקלידים {EXEC}. במסך הפתיחה לוחצים על מספר, 0 עד 9, או על הכפתור.', 'When OK appears type {EXEC}. On the title screen press a number, 0 to 9, or the button.'],
    snaker: ['כשמופיע OK מקלידים {RUN}. כשהמנגינה נגמרת לוחצים [ENTER].', 'When OK appears type {RUN}. When the tune ends press [ENTER].'],
    daggorath: ['אחרי מסך הפתיחה, עם הקוסם, מופיע מסך המשחק. מתחילים להקליד פקודות, למשל {EXAMINE}.', 'After the opening screen with the wizard, the game screen appears. Start typing commands, for example {EXAMINE}.'],
    ranger: ['כשהטעינה נגמרת בוחרים צבע: [1], [2] או [3]. במסך הפתיחה לוחצים [רווח], וב-SELECT LEVEL בוחרים שלב.', 'When loading ends pick a colour: [1], [2] or [3]. On the title screen press [Space], and at SELECT LEVEL pick a level.'],
    cuthbert: ['אחרי הטעינה מופיע LICENSED BY MICRODEAL ונשאר כחמש עד שבע דקות. זה לא תקוע: כך המשחק בנוי. כשמופיע הג\'ונגל, לוחצים [רווח].', 'After loading, LICENSED BY MICRODEAL appears and stays for about five to seven minutes. It is not stuck: the game is built that way. When the jungle appears, press [Space].'],
    dungeon: ['בסוף הטעינה בוחרים צבע: [1], [2] או [3]. במסך הפתיחה לוחצים [רווח], וב-SELECT LEVEL בוחרים רמה, [1] עד [3].', 'At the end of loading pick a colour: [1], [2] or [3]. On the title screen press [Space], and at SELECT LEVEL pick a level, [1] to [3].'],
    athletyx: ['במסך LICENSED BY MICRODEAL ובמסך הפתיחה לוחצים [רווח]. כשמופיע SELECT PLAYERS לוחצים [1] (או [2] לשני שחקנים), והריצה מתחילה.', 'On the LICENSED BY MICRODEAL screen and the title screen press [Space]. When SELECT PLAYERS appears press [1] (or [2] for two players), and the race begins.'],
    adventureland: ADVQ, pirate: ADVQ, mission: ADVQ, voodoo: ADVQ,
    count: ['כשהטעינה נגמרת המשחק שואל שתי שאלות: לוחצים [ENTER], ואחר כך [N] ו-[ENTER].', 'When loading ends the game asks two questions: press [ENTER], then [N] and [ENTER].'],
    odyssey: ['כשהטעינה נגמרת המשחק שואל שתי שאלות: לוחצים [ENTER], ואחר כך [N] ו-[ENTER].', 'When loading ends the game asks two questions: press [ENTER], then [N] and [ENTER].'],
    funhouse: ['כשהטעינה נגמרת המשחק שואל שתי שאלות: לוחצים [ENTER], ואחר כך [N] ו-[ENTER].', 'When loading ends the game asks two questions: press [ENTER], then [N] and [ENTER].'],
    pyramid: ['אחרי EXEC המשחק שואל שלוש שאלות: עונים [N] ו-[ENTER], אחר כך [ENTER], ושוב [N] ו-[ENTER].', 'After EXEC the game asks three questions: answer [N] and [ENTER], then [ENTER], then [N] and [ENTER] again.'],
    ghost: ADVQ,
    savage1: ADVQ,
    savage2: ADVQ,
    golden: ADVQ,
    claymorgue: ADVQ
  };
  // מה המשחק, בשורה אחת מתחת לשם (גונן, 25.10: "לא מבינים מה זה המשחק"). השם עצמו נשאר כמו שהמחבר כתב
  const DESC = {
    cavehunter: ['מבוך עם יצורים: מביאים את מטילי הזהב מהתחתית אל הכניסה, ובכדורים האדומים מכים את היצורים. בג\'ויסטיק.', 'A maze with creatures: bring the gold bars from the bottom up to the entrance, and use the red pills to knock the creatures out. Joystick.'],
    buzzard: ['רוכבים על ציפור מעופפת ומפילים רוכבי אויב מלמעלה. היה צריך מפתח חומרתי, וכאן המכונה מחברת מפתח וירטואלי. בג\'ויסטיק.', 'Ride a flying bird and knock enemy riders off from above. It needed a hardware dongle, and here the machine plugs in a virtual one. Joystick.'],
    sanctum: ['הרפתקת מילים: בקתה בהרים המושלגים, מנזר ישן, וכוחות של כישוף שחור שצריך להשמיד.', 'A text adventure: a cabin in the snowy mountains, an old monastery, and forces of black magic to destroy.'],
    calixto: ['הרפתקת מילים: מחדר העבודה של פרופסור אל אי טרופי ופירמידה של המאיה, בחיפוש אחרי אוצר.', 'A text adventure: from a professor\'s study to a tropical island and a Mayan pyramid, after a treasure.'],
    eggs: ['תופסים בסל את הביצים שהדרקון מטיל. לשחקן אחד.', 'Catch the dragon\'s eggs in a basket. 1 player.'],
    blockdown: ['קוביות נופלות: משלימים שורות. לשחקן אחד או לשניים.', 'Falling blocks: complete the lines. 1 or 2 players.'],
    dragontet: ['קוביות נופלות: משלימים שורות. לשחקן אחד או לשניים.', 'Falling blocks: complete the lines. 1 or 2 players.'],
    escape: ['מבוך תלת-ממדי של חידות: מוצאים דמויות עם רמזים, ומפענחים את הקוד של המעלית כדי לצאת מהבניין. לשחקן אחד.', 'A 3D puzzle maze: find characters with clues, and work out the elevator code to get out of the building. 1 player.'],
    phantom: ['מבוך תלת-ממדי: צדים רוחות רפאים לפני שהן תופסות אתכם. לשחקן אחד.', '3D maze: hunt the phantoms before they catch you. 1 player.'],
    cuthbert: ['רצים בג\'ונגל, קופצים מעל בורות ובולי עץ ויורדים בסולמות למנהרה, נגד השעון. בג\'ויסטיק.', 'Run through the jungle, jump pits and logs and climb down ladders to the tunnel, against the clock. Joystick.'],
    athletyx: ['תחרות אתלטיקה: ריצה ועוד מקצועות, נגד השעון. בג\'ויסטיק. נכתב רק ל-Dragon.', 'An athletics contest: a sprint and more events, against the clock. Joystick. Written only for the Dragon.'],
    downland: ['יורדים במערות בחבלים ובסולמות, אוספים אוצרות ומפתחות, ונזהרים מהטיפות שנופלות מהתקרה. בג\'ויסטיק.', 'Climb down through the caves on ropes and ladders, collect treasure and keys, and keep clear of the drops falling from the ceiling. Joystick.'],
    nerble: ['טסים בחללית מעל הרים ויורים באויבים. המכ"ם למטה מראה את כל העולם. בג\'ויסטיק.', 'Fly a ship over the hills and shoot the enemies. The radar below shows the whole world. Joystick.'],
    king: ['קופצים מעל חביות ומטפסים על רמפות וסולמות, כדי להציל את הנערה מהקוף הענק. בג\'ויסטיק, לאחד או לשניים.', 'Jump the barrels and climb the ramps and ladders to rescue the maiden from the giant ape. Joystick, 1 or 2 players.'],
    spores: ['נבגים מהחלל ישנים בקבוצות של שמונה: פוגעים בכל אחד פעמיים, לפני שהדלק נגמר והם מתעוררים. בחיצים.', 'Space spores sleep in groups of eight: hit each one twice, before your fuel runs out and they wake. Arrow keys.'],
    diablero: ['הרפתקת טקסט במדבר: מקלידים פקודות באנגלית ומגלים לאן הדרך מובילה. לשחקן אחד.', 'A text adventure in the desert: type commands in English and find out where the trail leads. 1 player.'],
    invrev: ['Space Invaders הפוך: אתם הפולש האחרון, ונלחמים בספינות של בני האדם. בחיצים, לאחד או לשניים.', 'Space Invaders turned around: you are the last invader, fighting the human ships. Arrow keys, 1 or 2 players.'],
    devil: ['טנק בתחתית המסך נגד עטלפי ערפד, רובוטים ו-Sproings, ובסוף גם השטן עצמו. בג\'ויסטיק.', 'A tank at the bottom of the screen against vampire bats, robots and Sproings, and in the end the Devil himself. Joystick.'],
    dungeon: ['רצים במסדרונות של מבוך ויורים ביצורים ובדלתות, נגד השעון. בג\'ויסטיק. נכתב רק ל-Dragon.', 'Race down dungeon corridors, shooting creatures and doors against the clock. Joystick. Written only for the Dragon.'],
    grabber: ['שני מבוכים בבת אחת: אוספים מטילים ומחזירים אותם למרכז, ובורחים ממפלצות. בג\'ויסטיק.', 'Two mazes at once: collect the bars, bring them back to the middle and escape the monsters. Joystick.'],
    draconian: ['טסים בחלל לכל כיוון, משמידים בסיסים ומצילים אסטרונאוטים, לפני שהדרקון מגיע. בג\'ויסטיק.', 'Fly through space in any direction, destroy bases and rescue astronauts before the dragon arrives. Joystick.'],
    williamsburg: ['הרפתקת טקסט בעיר הקולוניאלית Williamsburg: מחפשים את פרסת הזהב. בפקודות באנגלית.', 'A text adventure in colonial Williamsburg: find the Golden Horseshoe. English commands.'],
    teatime: ['משחק פעולה במטבח: תופסים טיפות תה, מתחמקים מסוכר ואוספים תה במזווה. בג\'ויסטיק.', 'Action in a kitchen: catch tea drops, dodge sugar and collect tea in the pantry. Joystick.'],
    bonka: ['חופרים בורות בקומות ונותנים מכה למפלצות שנופלות לתוכם. במקלדת.', 'Dig holes on the floors and bonk the meanies that fall in. Keyboard.'],
    vultures: ['משחק יריות נגד להקה של נשרים שצוללים ומפילים דברים. בג\'ויסטיק.', 'A shooter against a flock of diving, bombing vultures. Joystick.'],
    maurice: ['Morris Minor קטנה במרוץ גרנד פרי: עוקפים, נזהרים מהתנגשויות. בג\'ויסטיק.', 'A little Morris Minor in a Grand Prix: overtake and avoid crashes. Joystick.'],
    starman: ['החוקר Starman Jones טס בחללית מעל נוף של כוכב, ושומר על הדלק. בג\'ויסטיק.', 'Explorer Starman Jones flies over a planet\'s landscape, watching his fuel. Joystick.'],
    sword: ['הרפתקה במבוך של 225 מקומות: נלחמים, סוחרים ומנסים לצאת בחיים. במקלדת.', 'An adventure in a maze of 225 places: fight, trade and try to get out alive. Keyboard.'],
    wizlair: ['אוספים במבוך את החפצים שהשדים גנבו ומחזירים אותם למקדש. בג\'ויסטיק.', 'Collect the artifacts the demons stole from the maze and return them to your sanctuary. Joystick.'],
    alcatraz: ['בורחים מכלא Alcatraz II ונזהרים מהשומרים. בג\'ויסטיק.', 'Escape from the prison of Alcatraz II and keep away from the guards. Joystick.'],
    hangit: ['איש תלוי עם 1,000 שמות של ערים וכפרים בבריטניה. נגד המחשב או בשניים.', 'Hangman with 1,000 British towns and villages. Against the computer or for two.'],
    dhh: ['הצלה במערה: מוצאים שלושה חוקרי מערות אבודים לפני שהכוח והפנסים נגמרים. במקשי הכיוונים.', 'A cave rescue: find three lost cavers before your fitness and lights run out. Direction keys.'],
    lionht: ['ריצ\'רד לב הארי אוסף את הצלבנים שלו ביער, ובורח מהצבא של הנסיך ג\'ון. בחיצים.', 'Richard the Lionheart gathers his crusaders in the forest and escapes Prince John\'s army. Arrow keys.'],
    sas: ['אימון SAS: חוצים שדות מוקשים, נזהרים מסיורים וממסוקים, ומשמידים את בסיס האויב. בחיצים.', 'SAS training: cross minefields, dodge patrols and gunships, and destroy the enemy base. Arrow keys.'],
    champs: ['מנהלים קבוצת כדורגל מהליגה הרביעית עד גביע אירופה: קונים, מוכרים ומשחקים. לשחקן אחד.', 'Manage a football club from the 4th Division to the European Cup: buy, sell and play. 1 player.'],
    cricket: ['משחק קריקט של 40 אוברים: מגישים, חובטים ורצים. נגד המחשב או בשניים. בג\'ויסטיק.', 'A 40-over cricket match: bowl, bat and run. Against the computer or for two. Joystick.'],
    tangle: ['הרפתקה ביער עם חמש דמויות: עוצרים את Schark לפני שהוא כורת את היער. בחיצים ובפקודות.', 'A woodland adventure with five characters: stop Schark before he cuts down the woods. Arrows and typed commands.'],
    chameleon: ['חללית שמחליפה צבע תופסת פצצות של חומר ושל אנטי-חומר לפני שהן נוחתות. בג\'ויסטיק.', 'A colour-changing ship catches bombs of matter and anti-matter before they land. Joystick.'],
    ninja: ['לוחם נינג\'ה בועט בסלעים וקופץ מעל בורות, כדורי אש וחיצים, חגורה אחרי חגורה. במקלדת.', 'A ninja kicks rocks and jumps holes, fireballs and arrows, belt after belt. Keyboard.'],
    shenan: ['הרפתקה מצחיקה עם תמונות: מחפשים את סיר הזהב שבקצה הקשת. בפקודות באנגלית.', 'A funny adventure with pictures: find the pot of gold at the end of the rainbow. English commands.'],
    seasearch: ['הרפתקה עם תמונות ליד הים ומתחתיו: אוצרים, מפלים וכרישים. בפקודות באנגלית.', 'An adventure with pictures by and under the sea: treasures, waterfalls and sharks. English commands.'],
    trekboer: ['הרפתקה עם תמונות בחלל: מחפשים תרופה לווירוס שמאיים על כדור הארץ. בפקודות באנגלית.', 'An adventure with pictures in space: find a cure for a virus that threatens Earth. English commands.'],
    vortex: ['הרפתקה עם תמונות: מסע בזמן מתוך מוזיאון, ותשעה אוצרים להחזיר. בפקודות באנגלית.', 'An adventure with pictures: time travel from a museum, and nine treasures to bring back. English commands.'],
    digit: ['חופרים במערות, אוספים יהלומים ובורחים מאבנים נופלות וממפלצות: 25 מערות. בג\'ויסטיק.', 'Dig through caves, collect diamonds and escape falling stones and monsters: 25 caves. Joystick.'],
    brickout: ['שוברים לבנים בכדור ובמחבט, ותופסים אותיות שנופלות: 25 שלבים. בעכבר, כמו ידית.', 'Break bricks with a ball and paddle, and catch the falling letters: 25 levels. Mouse, like a paddle.'],
    snaker: ['נחש יורד בכביש בין מכוניות שעולות מולו: שלוש ירידות, נגד השעון. בג\'ויסטיק.', 'A snake goes down a highway between cars rising towards it: three runs, against the clock. Joystick.'],
    daggorath: ['מבוך בתלת-ממד, בזמן אמת: יורדים חמש קומות במבוך, נלחמים ביצורים ומנצחים את הקוסם. בפקודות באנגלית.', 'A real-time 3D maze: go down five levels, fight the creatures and defeat the wizard. Typed English commands.'],
    ranger: ['רצים, קופצים ויורים: אוספים מפתחות ואוצרות בין עטלפים ועיניים. בג\'ויסטיק.', 'Run, jump and shoot: collect keys and treasure past bats and eyes. Joystick.'],
    count: ['הרפתקת מילים: מתעוררים במיטה זרה, בארץ של רוזן מסתורי. ההרפתקה החמישית של Scott Adams.', 'A text adventure: wake up in a strange bed, in the land of a mysterious Count. Scott Adams\' fifth adventure.'],
    odyssey: ['הרפתקת מילים בחלל: חללית קטנה, אסטרואיד רחוק ואוצרות של ציוויליזציה עתיקה. ההרפתקה השישית של Scott Adams.', 'A text adventure in space: a small scout ship, a distant asteroid and the treasures of an ancient civilisation. Scott Adams\' sixth adventure.'],
    funhouse: ['הרפתקת מילים בלונה פארק: נכנסים לבית שעשועים מלא מראות ומבוכים. ההרפתקה השביעית של Scott Adams.', 'A text adventure at a fairground: into a fun house full of mirrors and mazes. Scott Adams\' seventh adventure.'],
    pyramid: ['הרפתקת מילים במצרים: פירמידה קבורה בחול, מלאה אוצרות ומלכודות. ההרפתקה השמינית בסדרה.', 'A text adventure in Egypt: a pyramid buried in the sand, full of treasure and traps. The eighth adventure in the series.'],
    ghost: ['הרפתקת מילים במערב הפרוע: עיירת רפאים נטושה, מלאה סודות ואוצרות. ההרפתקה התשיעית של Scott Adams.', 'A text adventure in the Wild West: an empty ghost town full of secrets and treasure. Scott Adams\' ninth adventure.'],
    savage1: ['הרפתקת מילים על אי פראי, עם סערה מתקרבת. החלק הראשון מתוך שניים, וקשה במיוחד. ההרפתקה העשירית של Scott Adams.', 'A text adventure on a savage island, with a storm coming. Part one of two, and especially hard. Scott Adams\' tenth adventure.'],
    savage2: ['הרפתקת מילים: ההמשך של Savage Island. מתחילים עם הסיסמה שמקבלים בסוף החלק הראשון. ההרפתקה ה-11 בסדרה.', 'A text adventure: the sequel to Savage Island. You start with the password from the end of part one. The 11th adventure in the series.'],
    golden: ['הרפתקת מילים בסגנון אלף לילה ולילה: מפליגים לחפש את סוד הנעורים בשביל מלך זקן. ההרפתקה ה-12 בסדרה.', 'A text adventure in the style of the Arabian Nights: sail out to find the secret of youth for an old king. The 12th adventure in the series.'],
    claymorgue: ['הרפתקת מילים עם כישופים: שוליה של קוסם מחפש 13 כוכבים בטירה של מכשף. ההרפתקה ה-13 של Scott Adams.', 'A text adventure with spells: a wizard\'s apprentice hunts for 13 stars in a sorcerer\'s castle. Scott Adams\' 13th adventure.'],
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
  const openDrawerOf = b => { const d = b && b.closest('details.drawer'); if (d) d.open = true; if (b && b.classList.contains('folded') && b.parentNode.unfold) b.parentNode.unfold(); };
  // צלמית: חלק קטן מצילום המסך של המשחק (מהמכונה שלנו), מוגדל בפיקסלים חדים
  function icon(id) {
    const m = meta(id), s = document.createElement('span');
    s.className = 'ic';
    if (m.icon) { const [x, y, w] = m.icon, k = 32 / w; s.style.backgroundImage = 'url(/lab/1982/shots/' + id + '.png)'; s.style.backgroundSize = (256 * k) + 'px ' + (192 * k) + 'px'; s.style.backgroundPosition = (-x * k) + 'px ' + (-y * k) + 'px'; }
    return s;
  }
  // בסדרה של Scott Adams הצלמית היא העטיפה המקורית: מסכי הטקסט נראים כולם אותו דבר
  function coverIcon(src) {
    const s = document.createElement('span');
    s.className = 'ic cv';
    s.style.backgroundImage = 'url(' + src + ')';
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
    } else if (credit[4] === 'grant') {
      // רשות פומבית של המחבר לכל אחד (Daggorath: Douglas J. Morgan): הקישור לנוסח שלה
      docs.textContent = EN ? 'public licence' : 'רשות פומבית';
      by.append(EN ? 'By ' : 'מאת ', who, ' · ', docs, EN ? ' · removed on request' : ' · יוסר לפי בקשה');
    } else if (credit[4] === 'mit' || credit[4] === 'bsd') {
      // קוד פתוח: הרישיון (MIT או BSD) והמאגר הרשמי
      docs.textContent = credit[4] === 'mit' ? (EN ? 'MIT licence' : 'רישיון MIT') : (EN ? 'BSD licence' : 'רישיון BSD');
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
    // בסדרה של Scott Adams: מספר ההרפתקה ונושא קצר, כדי שאפשר יהיה להבדיל בין 13 השורות (גונן, 31.10: "המדף של סקוט מלא")
    tg.textContent = m.num ? '\u2066#' + m.num + '\u2069 · ' + L2(m.theme) : L2(m.tag);   // המספר מבודד, כדי שיופיע ראשון גם מימין לשמאל
    const txt = document.createElement('span');
    txt.className = 'txt';
    const line = document.createElement('span');
    line.className = 'meta';
    line.append(tg);
    if (m.year) line.appendChild(yearChip(m.year));
    txt.append(nm, line);
    b.append(m.num && m.cover ? coverIcon(m.cover.src) : icon(id), txt);
    b.addEventListener('click', () => openGame(id, true));
    buttons[i] = b;
    if (list) list.appendChild(b);
  }
  // מגירה ארוכה: מראים את הראשונים, והשאר מאחורי "עוד" (גונן, 31.10)
  for (const dr of G.drawers) {
    const list = grids[dr.key];
    if (!dr.fold || !list || list.children.length <= dr.fold) continue;
    const rest = [...list.children].slice(dr.fold);
    rest.forEach(r => r.classList.add('folded'));
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'rows-more';
    more.textContent = EN ? '+ ' + rest.length + ' more adventures (' + (dr.fold + 1) + '–' + (dr.fold + rest.length) + ')' : '+ עוד ' + rest.length + ' הרפתקאות (' + (dr.fold + 1) + '–' + (dr.fold + rest.length) + ')';
    more.addEventListener('click', () => { list.classList.add('unfolded'); more.remove(); });
    list.after(more);
    list.unfold = () => { list.classList.add('unfolded'); more.remove(); };
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
    if (kind === 'c') {
      steps.push(T2('לוחצים על הכפתור האדום, והמחסנית נכנסת לחריץ. המחשב נדלק מחדש, והמשחק מתחיל לבד: בלי CLOAD, כמו מחסנית אמיתית.', 'Press the red button, and the cartridge goes into the slot. The computer restarts and the game starts by itself: no CLOAD, like a real cartridge.'),
        T2('כדי לחזור ל-BASIC לוחצים ⏏ הוצא את המחסנית. גם קלטת אחרת מוציאה אותה לפני שהיא נכנסת לרשמקול.', 'To go back to BASIC press ⏏ Take the cartridge out. Another tape also takes it out before going into the recorder.'));
      if (AFTER[id]) steps.push(T2(...AFTER[id]));
      return steps;
    }
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
    // דף המשחק בפריסה אחת קבועה (גונן, 30.10: "לא סימטרית ... חלק ארוך חלק קצר"): הטקסט בטור אחד, ובטור שליד המכונה
    // צילום המסך ומתחתיו העטיפה המקורית, שרואים מיד (גונן: "צריך להראות מייד כשפותחים את דף המשחק"). במחשב הדף
    // בגובה המכונה, והלשוניות נגללות בתוכן. בטלפון הכול בטור אחד, הצילום והעטיפה זה לצד זה
    const head = document.createElement('div');
    head.className = 'gv-head';
    const info = document.createElement('div');
    info.className = 'gv-info gv-act';
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
    head.append(h, desc, tags);
    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'gv-go';
    go.textContent = kind === 'c' ? T2('▶ הכנס את המחסנית לחריץ', '▶ Put the cartridge in the slot') : T2('▶ הכנס את הקלטת לרשמקול', '▶ Put the tape in the recorder');
    go.addEventListener('click', () => load(id, name, b, false, kind));
    info.append(go);
    if (kind === 'c') {
      const out = document.createElement('button');
      out.type = 'button';
      out.className = 'gv-eject';
      out.textContent = T2('⏏ הוצא את המחסנית', '⏏ Take the cartridge out');
      out.addEventListener('click', () => window.d32EjectCart());
      info.append(out);
    }
    if (status) info.appendChild(status);
    const media = document.createElement('figure');
    media.className = 'gv-media';
    const pic = document.createElement('img');
    pic.className = 'gv-shot';
    pic.src = '/lab/1982/shots/' + id + '.png';
    pic.alt = T2('צילום מסך מהמשחק, מהמכונה שלנו', 'A screenshot of the game, from our machine');
    pic.width = 256; pic.height = 192;
    media.appendChild(pic);
    if (m.cover) {
      // העטיפה המקורית, רק כשיש עליה רשות. לחיצה פותחת אותה בגדול. קרדיט וקישור למקור מתחת
      const a = document.createElement('a');
      a.className = 'gv-cover';
      a.href = m.cover.src; a.target = '_blank'; a.rel = 'noopener';
      const im = document.createElement('img');
      im.src = m.cover.src; im.alt = T2('העטיפה המקורית של ', 'The original cover of ') + name;
      a.appendChild(im);
      const cap = document.createElement('figcaption');
      cap.append(L2(m.cover.credit) + ' ');
      const src = document.createElement('a');
      src.href = m.cover.link; src.target = '_blank'; src.rel = 'noopener';
      const bd = document.createElement('bdi'); bd.textContent = L2(m.cover.from); src.appendChild(bd);
      cap.appendChild(src);
      media.append(a, cap);
    } else {
      // בלי עטיפה (התוכניות שלנו): מדבקת קלטת שלנו, כדי שהצורה תהיה אותה צורה בכל משחק
      const lab = document.createElement('div');
      lab.className = 'gv-cover gv-label';
      lab.setAttribute('aria-hidden', 'true');
      const n = document.createElement('bdi'); n.className = 'gv-label-name'; n.textContent = name;
      const holes = document.createElement('span'); holes.className = 'gv-label-holes';
      const by = document.createElement('span'); by.className = 'gv-label-by'; by.textContent = 'DRAGON 1982';
      lab.append(n, holes, by);
      media.appendChild(lab);
    }
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
      for (const s of (m.about ? m.about[EN ? 'en' : 'he'] : [])) { const p = document.createElement('p'); p.textContent = s; pane.appendChild(p); }
    });
    // רמזים (גונן, 7.11: "יפה"): במשחקים שעברנו עד הסוף במכונה. כל שאלה נפתחת לשלוש מדרגות, וכל מדרגה רק בלחיצה,
    // כדי שאף אחד לא יראה פתרון בטעות. התוכן ב-/lab/1982/hints/<id>.json
    if (HINTS.has(id)) mk(T2('רמזים', 'Hints'), pane => {
      const intro = document.createElement('p');
      intro.textContent = T2('נתקעתם? בחרו שאלה. קודם רמז קטן, אחר כך רמז ברור יותר, ורק בסוף הפתרון המלא.',
        'Stuck? Pick a question. First a small hint, then a clearer one, and only at the end the full solution.');
      pane.appendChild(intro);
      hintsFor(id).then(d => { for (const item of d[EN ? 'en' : 'he']) pane.appendChild(hintBlock(item)); })
        .catch(() => { intro.textContent = T2('הרמזים לא נטענו. נסו שוב.', 'The hints did not load. Try again.'); });
    });
    const paneBox = document.createElement('div');
    paneBox.className = 'gv-panes';
    paneBox.append(...panes);
    const body = document.createElement('div');
    body.className = 'gv-body';
    body.append(head, media, info, tabs, paneBox);
    view.append(back, body, creditLine(id, credit));
    tabs.firstChild.click();
    view.hidden = false;
    document.body.classList.add('game-open');
    requestAnimationFrame(fitView);
    buttons.forEach(x => x && x.classList.toggle('sel', x === b));
    document.title = name + ' — Dragon 1982';
    if (push && m.slug) history.pushState({ game: id }, '', BASE + m.slug + '/');
    if (innerWidth < 1100 && push) view.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  // במחשב (רוחב 1100 ומעלה): דף המשחק נגמר בדיוק בתחתית המקלדת, בכל משחק ובכל לשונית
  function fitView() {
    if (view.hidden || innerWidth < 1100) { view.style.height = ''; return; }
    const kb = document.querySelector('.machine'), bottom = kb ? kb.getBoundingClientRect().bottom : innerHeight - 8;
    view.style.height = Math.max(420, Math.round(bottom - view.getBoundingClientRect().top)) + 'px';
  }
  addEventListener('resize', fitView);
  if (window.ResizeObserver && document.querySelector('.machine')) new ResizeObserver(fitView).observe(document.querySelector('.machine'));
  function closeGame(push) {
    view.hidden = true;
    view.style.height = '';
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
.rows .folded { display: none; }
.rows.unfolded .folded { display: flex; }
.rows-more { display: block; width: 100%; margin: 4px 0 2px; min-height: 40px; border-radius: 8px; border: 1px dashed #5a4430; background: transparent; color: var(--accent, #f2d23a); font: inherit; font-size: 14px; cursor: pointer; }
.rows-more:hover { background: #2a2119; }
.ic.cv { flex-basis: 24px; width: 24px; height: 32px; margin-inline: 4px; background-size: cover; background-position: center top; image-rendering: auto; }
.ic { flex: 0 0 32px; width: 32px; height: 24px; border-radius: 4px; background: #2b2a26 no-repeat; image-rendering: pixelated; box-shadow: 0 0 0 1px #00000080; }
.game-view { margin-top: 8px; border: 2px solid #5a4430; border-radius: 14px; background: linear-gradient(#2b2018, #1f1712); padding: 12px 14px; }
.gv-back { background: none; border: 0; color: var(--accent, #f2d23a); font: inherit; font-size: 15px; padding: 4px 0; cursor: pointer; min-height: 36px; }
.gv-body { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-areas: "head" "media" "act" "tabs" "panes"; }
.gv-head { grid-area: head; min-width: 0; }
.gv-act { grid-area: act; min-width: 0; }
.gv-tabs { grid-area: tabs; }
.gv-panes { grid-area: panes; min-width: 0; }
.gv-title { margin: 0; font-size: 26px; line-height: 1.2; }
.gv-desc { margin: 4px 0 8px; color: #d8c8a8; }
.gv-tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 10px; }
.gv-tags > span:not(.yr) { font-size: 12px; color: #b9a98f; border: 1px solid #4a3a2a; border-radius: 999px; padding: 0 8px; }
.gv-go { display: block; width: 100%; border: 0; border-radius: 12px; background: #e0503c; color: #fff; font: inherit; font-weight: 800; font-size: 18px; padding: 12px; box-shadow: 0 4px 0 #6d160b; cursor: pointer; }
.gv-go:active { transform: translateY(2px); box-shadow: 0 2px 0 #6d160b; }
.gv-eject { display: none; width: 100%; margin-top: 8px; border: 1.5px solid #5a4430; border-radius: 12px; background: #1b1511; color: #f4efe4; font: inherit; font-weight: 700; font-size: 16px; padding: 10px; cursor: pointer; }
body.cart-in .gv-eject { display: block; }
.gv-go.nudge { animation: gv-nudge 0.5s ease-in-out 3; }
@keyframes gv-nudge { 50% { box-shadow: 0 4px 0 #6d160b, 0 0 0 5px #f2d23a; } }
.gv-info #tape-status { margin: 8px 0 0; }
/* הצילום והעטיפה: בטלפון זה לצד זה באותו גובה */
.gv-media { grid-area: media; margin: 4px 0 12px; display: flex; flex-wrap: wrap; justify-content: center; align-items: flex-start; gap: 10px; }
.gv-shot { display: block; height: calc((100vw - 90px) * 0.36); max-height: 220px; width: auto; aspect-ratio: 4 / 3; image-rendering: pixelated; border-radius: 6px; border: 1px solid #4a3a2a; background: #000; }
.gv-cover { display: block; height: calc((100vw - 90px) * 0.36); max-height: 220px; }
.gv-cover img { display: block; height: 100%; width: auto; border-radius: 6px; box-shadow: 0 3px 12px rgba(0,0,0,.45); }
.gv-media figcaption { flex-basis: 100%; text-align: center; font-size: 12px; line-height: 1.45; color: var(--muted, #b9a98f); }
.gv-media figcaption a { color: var(--accent, #f2d23a); }
/* מדבקת קלטת שלנו, למשחק בלי עטיפה */
.gv-label { aspect-ratio: 0.68; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; align-items: center; padding: 12% 8% 8%; border-radius: 6px;
  border-top: 12px solid #c8402c; background: #efe3c6; color: #2b2018; box-shadow: 0 3px 12px rgba(0,0,0,.45); text-align: center; }
.gv-label-name { font: 700 clamp(14px, 1.6vw, 22px)/1.15 'Courier New', monospace; text-transform: uppercase; overflow-wrap: anywhere; }
.gv-label-holes { width: 70%; height: 16%; border-radius: 999px; background: radial-gradient(circle at 22% 50%, #2b2018 0 18%, transparent 19%), radial-gradient(circle at 78% 50%, #2b2018 0 18%, transparent 19%), #d6c7a4; }
.gv-label-by { font: 700 11px/1 'Courier New', monospace; letter-spacing: 1px; }
.gv-tabs { display: flex; gap: 6px; margin-top: 14px; border-bottom: 1px solid #4a3a2a; flex-wrap: wrap; }
.gv-tabs button { font: inherit; font-size: 14px; font-weight: 700; color: #b9a98f; background: transparent; border: 1px solid #4a3a2a; border-bottom: 0; border-radius: 8px 8px 0 0; padding: 6px 12px; cursor: pointer; min-height: 36px; }
.gv-tabs button[aria-selected="true"] { background: #2a2119; color: var(--accent, #f2d23a); }
.gv-pane { padding: 10px 2px 4px; line-height: 1.7; }
.gv-pane ol, .gv-pane ul { margin: 0; padding-inline-start: 22px; display: grid; gap: 6px; }
.gv-pane p { margin: 0 0 8px; }
.hint-q { border: 1px solid #4a3a2a; border-radius: 10px; margin: 6px 0; background: #1b1511; }
.hint-q > summary { cursor: pointer; padding: 10px 12px; font-weight: 700; color: var(--accent, #f2d23a); min-height: 40px; display: block; }
.hint-lv { margin: 0 12px 8px; }
.hint-lv > summary { cursor: pointer; display: inline-block; font-size: 14px; font-weight: 700; padding: 4px 12px; border-radius: 999px; border: 1px solid #5a4430; color: #d8c8a8; min-height: 32px; }
.hint-lv[open] > summary { background: #2a2119; }
.hint-lv2 > summary { border-color: #8c1f12; color: #ffb3a6; }
.hint-lv > ul { list-style: none; padding: 6px 4px 2px; margin: 0; }
.hint-lv .cmd, .hint-q > summary .cmd { white-space: nowrap; font-weight: 700; }
.hint-btn { display: block; margin: 12px 0 0 auto; padding: 8px 14px; border: 1.5px solid #5a4430; border-radius: 999px; background: #1b1511; color: #f4efe4; font: inherit; font-size: 15px; cursor: pointer; touch-action: manipulation; }
.hint-btn[hidden], .hint-pop[hidden] { display: none; }
.hint-btn[aria-expanded="true"] { background: #2a2119; color: var(--accent, #f2d23a); }
.hint-pop { margin-top: 8px; padding: 10px 12px; border: 1.5px solid #5a4430; border-radius: 12px; background: #15110e; color: #f4efe4; max-height: 50vh; overflow-y: auto; font-size: 15px; line-height: 1.6; }
.hint-pop-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
.hint-pop-x { flex: none; width: 34px; height: 34px; border: 1px solid #4d4238; border-radius: 50%; background: #1b1511; color: #b9a98f; font: 700 16px/1 sans-serif; cursor: pointer; }
.hint-pop-all { display: block; margin: 8px 0 2px; padding: 6px 0; border: 0; background: none; color: var(--accent, #f2d23a); font: inherit; font-size: 14px; text-decoration: underline; cursor: pointer; }
.game-view .tape-credit { margin: 10px 0 0; padding-top: 8px; border-top: 1px solid #4a3a2a; }
body.game-open .shelf > :not(.game-view) { display: none; }
@media (min-width: 1100px) {
  body.game-open .info, body.game-open main > p.note:first-child { display: none; }
  /* חצי חצי (גונן, 28.10): חצי דף המשחק, חצי המכונה, שבאמצע החצי שלה ובגודל הכי גדול שנכנס בגובה */
  body.game-open main { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 0; }
  body.game-open .shelf { grid-column: 1; }
  body.game-open .machine { justify-self: center; width: min(100%, calc((100vh - 370px) * 4 / 3 + 28px)); }
  /* דף המשחק בגובה המכונה (הגובה נקבע ב-fitView): טור טקסט, וליד המכונה טור של צילום ועטיפה. רק הלשוניות נגללות */
  body.game-open .shelf { overflow: hidden; }
  body.game-open .game-view { display: flex; flex-direction: column; box-sizing: border-box; }
  .gv-body { flex: 1; min-height: 0; gap: 0 18px; grid-template-columns: minmax(0, 1fr) clamp(190px, 38%, 300px);
    grid-template-rows: auto auto auto minmax(0, 1fr); grid-template-areas: "head media" "act media" "tabs media" "panes media"; }
  .gv-panes { overflow-y: auto; overscroll-behavior: contain; padding-inline-end: 4px; }
  .gv-media { margin: 0; flex-direction: column; flex-wrap: nowrap; justify-content: flex-start; align-items: stretch; min-height: 0; overflow: hidden; }
  .gv-shot { width: 100%; height: auto; max-height: none; flex: none; }
  .gv-cover { flex: 0 1 auto; min-height: 0; height: auto; max-height: none; display: flex; justify-content: center; }
  .gv-cover img { height: auto; width: auto; max-width: 100%; max-height: 100%; object-fit: contain; }
  .gv-label { width: 78%; height: auto; max-height: none; aspect-ratio: 0.68; flex: 0 1 auto; min-height: 0; align-self: center; }
  .gv-media figcaption { flex: none; text-align: start; }
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
  // ---- מחסניות: כמו במחשב האמיתי, מכניסים מחסנית לחריץ, המחשב נדלק מחדש והמשחק מתחיל לבד. מוציאים, וחוזרים ל-BASIC ----
  let cartIn = null;
  async function insertCart(id, title, button) {
    if (typeof Module === 'undefined' || !window.d32Ready) { status.textContent = EN ? 'The computer is still starting. Try again in a moment.' : 'המחשב עוד נדלק. נסו שוב בעוד רגע.'; return; }
    busy = true;
    try {
      const bytes = new Uint8Array(await (await fetch('/lab/1982/carts/' + id + '.ccc')).arrayBuffer());
      gameKeys(id);
      FS.writeFile('/cart-' + id + '.ccc', bytes);
      Module.ccall('wasm_load_file', null, ['string', 'number', 'number'], ['/cart-' + id + '.ccc', 0, 0]);
      cartIn = id; inTape = id; ram = -1;
      document.querySelectorAll('.tape').forEach(t => t.classList.toggle('in', t === button));
      document.body.classList.add('cart-in');
      status.textContent = EN ? 'The cartridge "' + title + '" is in the slot. The computer restarts, and the game starts by itself.'
        : 'המחסנית "' + title + '" בחריץ. המחשב נדלק מחדש, והמשחק מתחיל לבד.';
      document.getElementById('canvas')?.focus({ preventScroll: true });
      if (innerWidth < 1000) document.querySelector('.tv').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) { status.textContent = failed(); }
    finally { busy = false; }
  }
  async function ejectCart() {
    try { Module.ccall('wasm_set_machine_cart', null, ['string', 'string', 'string', 'string'], ['dragon32', '', '', '']); } catch (e) {}
    cartIn = null; inTape = null; ram = -1;
    setJoy(false);
    document.body.classList.remove('cart-in');
    document.querySelectorAll('.tape').forEach(t => t.classList.remove('in'));
    await wait(1500);   // המחשב נדלק מחדש בלי המחסנית, עם ה-BASIC שלנו
  }
  window.d32EjectCart = async () => { if (!cartIn) return; await ejectCart(); status.textContent = EN ? 'The cartridge is out. The computer is back in BASIC.' : 'המחסנית בחוץ. המחשב חזר ל-BASIC.'; };
  async function load(id, title, button, auto, mc) {
    if (busy) return;
    if (mc === 'c') return insertCart(id, title, button);
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
    if (cartIn) await ejectCart();
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
          : EN ? 'The tape "' + title + '" is in the recorder. Type ' + LOADW + ', and after OK type ' + RUNW + '.' + (mc === 'mine' ? ' Some games start by themselves.' : '')
          : 'הקלטת "' + title + '" ברשמקול. הקלידו ' + LOADW + ', ואחרי ה-OK הקלידו ' + RUNW + '.' + (mc === 'mine' ? ' יש משחקים שמתחילים לבד.' : '')) + next;
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
      const name = String.fromCharCode(...data.slice(0, 8)).trim();
      // כותרת בלי שם אחרי קובץ = החלק השני של אותה קלטת (Donkey King של Microdeal: הטוען, ואחריו המשחק בלי שם).
      // נשמרים יחד, כדי שהטעינה תביא את שניהם (גונן, 1.11: "לא נטען כבר מלא זמן")
      if (type === 0 && len >= 15 && !name && !cur && files.length) { cur = files.pop(); cur.b.push([0, ...data]); }
      else if (type === 0 && len >= 15) cur = { n: name, b: [[0, ...data]] };
      else if (cur && type === 1) cur.b.push([1, ...data]);
      else if (cur && type === 255) { cur.b.push([255]); files.push(cur); cur = null; }
      i += 4 + len;
    }
    return files;
  }
  // לפי הכותרת: קובץ עם פערים (בית 10 שלה) — מבוא לפני כל בלוק; רציף — מבוא אחד והבלוקים ברצף
  // קלטת "כמו שהיא" (גונן, 1.11: Manic Miner): טוען מיוחד נגד העתקה, שאחרי הכותרת כותב בלוקים בפורמט משלו, בלי בלוק סוף.
  // parseCas לא מוצא בה תוכנית שלמה, אז שומרים את כל הבתים של הקובץ כמו שהם (r, ב-base64), ואת הכותרת הראשונה לשם ולסוג
  function rawTape(bytes) {
    for (let i = 0; i + 4 < bytes.length; i++) {
      if (bytes[i] !== 0x55 || bytes[i + 1] !== 0x3c || bytes[i + 2] !== 0 || bytes[i + 3] < 15) continue;
      const len = bytes[i + 3];
      if (i + 5 + len > bytes.length) break;
      const data = Array.from(bytes.slice(i + 4, i + 4 + len));
      let sum = len;
      for (const b of data) sum += b;
      if ((sum & 255) !== bytes[i + 4 + len]) continue;
      let bin = '';
      for (let k = 0; k < bytes.length; k += 8192) bin += String.fromCharCode(...bytes.subarray(k, k + 8192));
      return { n: String.fromCharCode(...data.slice(0, 8)).trim() || 'TAPE', b: [[0, ...data]], r: btoa(bin) };
    }
    return null;
  }
  // טוען שמושך בלוקים בעצמו (גונן, 2.11: Time Bandit של Microdeal, Mr. Dig של Computerware): CLOADM טוען רק בלוק קטן שמשתלט
  // על המחשב, והוא קורא את שאר הבלוקים מהקלטת, ובין בלוק לבלוק עוצר ומדליק את המנוע. בקלטת אמיתית יש לפני כל בלוק מבוא,
  // אבל בקבצי הארכיון חלק מהבלוקים צמודים זה לזה בלי מבוא, והטוען מפספס אותם. כאן: כל הקובץ כמו שהוא,
  // ולפני כל בלוק שהמבוא שלפניו קצר נוסף מבוא (256 בתים של $55, כמו שהמקור כותב). הנתונים עצמם לא משתנים.
  // 5.11, Junior's Revenge: הטוען שלו מדליק את המנוע פעמיים ברצף, וכל הדלקה מחכה חצי שנייה כשהקלטת זזה (כמו במקור).
  // עם 128 בתים המבוא נגמר באמצע ההמתנה השנייה, והבלוקים הראשונים נקראו עם שגיאה
  function blockAt(bytes, j) {
    if (j + 3 >= bytes.length || bytes[j] !== 0x3c) return -1;
    const type = bytes[j + 1], len = bytes[j + 2];
    if (type !== 0 && type !== 1 && type !== 255) return -1;
    if ((type === 0 && len < 15) || (type === 255 && len) || j + 3 + len >= bytes.length) return -1;
    let sum = type + len;
    for (let k = 0; k < len; k++) sum += bytes[j + 3 + k];
    return (sum & 255) === bytes[j + 3 + len] ? j + 4 + len : -1;
  }
  function gapTape(bytes, used) {
    const out = [], cuts = [];
    let n = 0, prev = -1, other = false;
    for (let i = bytes.indexOf(0x3c); i >= 0 && i < bytes.length; ) {
      const end = blockAt(bytes, i);
      if (end < 0 || (!n && bytes[i - 1] !== 0x55)) { i++; continue; }
      let k = i;
      while (k > 0 && bytes[k - 1] === 0x55) k--;
      if (i - k < 64) cuts.push(i);   // גם לפני הכותרת הראשונה: בקבצים האלה יש לפניה רק 5 עד 35 בתי מבוא
      // 5.11, Lunar Rover Patrol: בין הבלוקים יש נתונים בפורמט של המשחק עצמו (הטוען שלו מצייר אותם על המסך).
      // בנייה מחדש מהבלוקים בלבד זורקת אותם, והטעינה נתקעת: שומרים את כל הקלטת כמו שהיא
      if (prev >= 0 && k - prev >= 16) other = true;
      n++; prev = end; i = end;
    }
    if (!other && (n <= used || !cuts.length)) return null;   // אין בלוקים מעבר לתוכנית, או שלכולם יש מבוא: הדרך הרגילה
    if (!cuts.length) return rawTape(bytes);
    let last = 0;
    for (const c of cuts) { out.push(bytes.subarray(last, c), new Uint8Array(256).fill(0x55)); last = c; }
    out.push(bytes.subarray(last));
    const all = new Uint8Array(out.reduce((a, b) => a + b.length, 0));
    let o = 0;
    for (const b of out) { all.set(b, o); o += b.length; }
    return rawTape(all);
  }
  function rawBytes(f) {
    const bin = atob(f.r), out = new Array(bin.length);
    for (let k = 0; k < bin.length; k++) out[k] = bin.charCodeAt(k);
    return out.concat(new Array(64).fill(0x55));   // סוף הקובץ: מבוא קצר, כדי שהבית האחרון ייקרא עד הסוף
  }
  function tapeBytes(files) {
    const leader = new Array(128).fill(0x55);
    let out = [];
    for (const f of files) if (f.r) out = out.concat(rawBytes(f)); else for (const part of parts(f)) {
      const gap = part[0][11];
      out = out.concat(leader, block(0, part[0].slice(1)));
      if (!gap) out = out.concat(leader);
      for (const b of part.slice(1)) out = out.concat(gap ? leader : [], block(b[0], b.slice(1)));
    }
    return new Uint8Array(out);
  }
  // קלטת אחת יכולה להכיל כמה קבצים (כותרת לכל אחד): מחלקים לפי הכותרות
  function parts(f) {
    const out = [];
    for (const b of f.b) if (b[0] === 0 || !out.length) out.push([b]); else out[out.length - 1].push(b);
    return out;
  }
  // קלטת קול ל-Dragon אמיתי (29.10): אותם בתים שה-ROM הקליט, בצליל שה-Dragon טוען מהרשמקול.
  // כמו ההקלטה של המכונה עצמה: 44100 דגימות בשנייה, 8 ביט, חצי שנייה שקט בהתחלה, ועוד חצי שנייה אחרי הכותרת
  // (הרשמקול עוצר ומתניע). כל ביט הוא גל סינוס אחד שמתחיל בעלייה, הביט הנמוך קודם. האורך לפי מחזורי המעבד
  // (0.894886 מגה-הרץ): ביט 0 = 813 מחזורים, ביט 1 = 435 (Ciaran Anscomb, 20.10).
  function tapeWav(f) {
    const RATE = 44100, CPU = 894886, AMP = 86;
    const leader = new Array(128).fill(0x55), segs = [];
    if (f.r) segs.push(['quiet', 0.5], ['bytes', rawBytes(f)]);
    else for (const part of parts(f)) {
      const gap = part[0][11];
      segs.push(['quiet', 0.5], ['bytes', leader.concat(block(0, part[0].slice(1)))]);
      if (!gap) segs.push(['quiet', 0.5], ['bytes', leader.concat(...part.slice(1).map(b => block(b[0], b.slice(1))))]);
      else for (const b of part.slice(1)) segs.push(['quiet', 0.5], ['bytes', leader.concat(block(b[0], b.slice(1)))]);
    }
    segs.push(['quiet', 0.1]);
    const out = [];
    let t = 0;
    const quiet = sec => { const end = Math.round((t + sec) * RATE); while (out.length < end) out.push(128); t += sec; };
    const bit = one => {
      const len = (one ? 435 : 813) / CPU, from = Math.round(t * RATE), to = Math.round((t + len) * RATE);
      for (let s = from; s < to; s++) out.push(Math.round(128 + AMP * Math.sin(2 * Math.PI * ((s / RATE - t) / len))));
      t += len;
    };
    for (const [kind, v] of segs) {
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
  // קלטת חדשה מחליפה קלטות קודמות עם אותו שם, אבל כל הקבצים שבה נשארים, גם כשיש בה כמה קבצים עם אותו שם
  // (4.11: ב-Telewriter יש DEMO אחרי כל אחת מארבע הגרסאות. נשאר רק האחרון, ו-READ IN מ-TELE/G חיפש אותו דקות)
  function addTapes(files) {
    const names = new Set(files.map(f => f.n));
    const list = myTapes().filter(t => !names.has(t.n)).concat(files);
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
    // שתי קבוצות (גונן, 31.10: "להפריד את הקלטות שהם משחקים לבין קלטות שהם תכניות בייסיק"): שפת מכונה, ואחריה BASIC ונתונים
    const recent = list.slice().reverse();
    const groups = [[recent.filter(f => f.b[0][9] === 2), EN ? '🎮 Games and machine code' : '🎮 משחקים ושפת מכונה'],
      [recent.filter(f => f.b[0][9] !== 2), EN ? '📝 BASIC programs' : '📝 תוכניות BASIC']];
    for (const [items, label] of groups) {
      if (!items.length) continue;
      const h = document.createElement('h3');
      h.className = 'mine-group';
      h.textContent = label;
      mineBox.appendChild(h);
      for (const f of items) addRow(f);
    }
  }
  function addRow(f) {
    {
      const row = document.createElement('div');
      row.className = 'mytape';
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tape';
      // השם גדול, ולידו מה יש בקלטת לפי הכותרת שלה (גונן, 31.10: "איך נבחין בין משחק שהורדתי לתכנית כתובה"):
      // 🎮 שפת מכונה (סוג 2) נטענת ב-CLOADM, 📝 תוכנית BASIC (סוג 0) ב-CLOAD, 📄 קובץ נתונים (סוג 1) נקרא מתוך תוכנית
      const kind = f.b[0][9];
      const [icon, how] = kind === 2 ? ['🎮', 'CLOADM'] : kind === 0 ? ['📝', 'CLOAD'] : ['📄', ''];
      b.innerHTML = '<span class="kind" aria-hidden="true"></span><span class="tname" dir="ltr"></span><span class="how" dir="ltr"></span>';
      b.querySelector('.kind').textContent = icon;
      b.querySelector('.tname').textContent = f.n;
      b.querySelector('.how').textContent = how;
      b.setAttribute('aria-label', f.n + (kind === 2 ? (EN ? ', machine code: CLOADM' : ', שפת מכונה: CLOADM')
        : kind === 0 ? (EN ? ', BASIC program: CLOAD' : ', תוכנית BASIC: CLOAD') : (EN ? ', data file' : ', קובץ נתונים')));
      b.addEventListener('click', () => { gameKeys(null, kind === 2); play(tapeBytes([f]), '/mine.cas', f.n, b, false, false, kind === 2 ? 'mine' : false); });
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
  // המתג: משחק מקלטת שלי שקורא ג'ויסטיק לא זז בלי ג'ויסטיק. כשהוא דלוק, החיצים הם הג'ויסטיק הימני, ו-Alt או רווח הכפתור,
  // כמו במשחקי הג'ויסטיק שעל המדף. נזכר בדפדפן הזה
  if (upload) {
    const joyBtn = document.createElement('button');
    joyBtn.type = 'button';
    joyBtn.className = 'mini upload';
    joyBtn.id = 'mine-joy';
    const showJoy = () => {
      joyBtn.setAttribute('aria-pressed', myJoy ? 'true' : 'false');
      joyBtn.textContent = '🕹 ' + (EN ? 'Arrows as joystick: ' + (myJoy ? 'on' : 'off') : 'ג\'ויסטיק מהמקלדת: ' + (myJoy ? 'דלוק' : 'כבוי'));
    };
    joyBtn.title = EN ? 'For my tapes: the arrows move the right joystick, Alt or Space is its button'
      : 'לקלטות שלי: החיצים מזיזים את הג\'ויסטיק הימני, ו-Alt או רווח הם הכפתור שלו';
    showJoy();
    joyBtn.addEventListener('click', () => {
      myJoy = !myJoy;
      try { localStorage.setItem('d32-myjoy', myJoy ? '1' : '0'); } catch (e) {}
      showJoy();
      if (mineIn) setJoy(myJoy, false);
    });
    upload.after(joyBtn);
    // מחסנית מקובץ (גונן, 5.11: Logo): קובץ מחסנית (.ccc / .rom) נכנס לחריץ, המחשב נדלק מחדש והמחסנית מתחילה לבד.
    // לחיצה נוספת מוציאה אותה. המחסנית לא נשמרת בדפדפן: בוחרים את הקובץ בכל פעם, כמו להכניס מחסנית ביד
    const cartBtn = document.createElement('button'), cartFile = document.createElement('input');
    cartBtn.type = 'button';
    cartBtn.className = 'mini upload';
    cartBtn.id = 'cart-upload';
    cartFile.type = 'file';
    cartFile.id = 'cart-file';
    cartFile.accept = '.ccc,.rom,.bin';
    cartFile.hidden = true;
    const showCart = () => { cartBtn.textContent = cartIn === 'mine' ? (EN ? '⏏ Take the cartridge out' : '⏏ להוציא את המחסנית') : (EN ? '🎴 Load a cartridge from a file' : '🎴 טעינת מחסנית מקובץ'); };
    showCart();
    cartBtn.addEventListener('click', async () => {
      if (cartIn === 'mine') { await window.d32EjectCart(); showCart(); return; }
      cartFile.click();
    });
    cartFile.addEventListener('change', async () => {
      const f = cartFile.files[0];
      cartFile.value = '';
      if (!f || busy) return;
      if (typeof Module === 'undefined' || !window.d32Ready) { status.textContent = EN ? 'The computer is still starting. Try again in a moment.' : 'המחשב עוד נדלק. נסו שוב בעוד רגע.'; return; }
      const bytes = new Uint8Array(await f.arrayBuffer());
      // חריץ המחסניות של ה-Dragon: עד 16K, מ-$C000
      if (!bytes.length || bytes.length > 16384) { status.textContent = EN ? 'This file is not a Dragon cartridge.' : 'הקובץ הזה לא מחסנית של Dragon.'; return; }
      busy = true;
      try {
        if (cartIn) await ejectCart();
        FS.writeFile('/cart-mine.ccc', bytes);
        Module.ccall('wasm_load_file', null, ['string', 'number', 'number'], ['/cart-mine.ccc', 0, 0]);
        cartIn = 'mine'; inTape = null; ram = -1;
        document.querySelectorAll('.tape').forEach(t => t.classList.remove('in'));
        document.body.classList.add('cart-in');
        const name = f.name.replace(/\.[^.]*$/, '');
        status.textContent = EN ? 'The cartridge "' + name + '" is in the slot. The computer restarts, and the cartridge starts by itself.'
          : 'המחסנית "' + name + '" בחריץ. המחשב נדלק מחדש, והמחסנית מתחילה לבד.';
        document.getElementById('canvas')?.focus({ preventScroll: true });
      } catch (e) { status.textContent = failed(); }
      finally { busy = false; showCart(); }
    });
    joyBtn.after(cartBtn, cartFile);
  }
  if (upload && file) {
    upload.addEventListener('click', () => file.click());
    file.addEventListener('change', async () => {
      const f = file.files[0];
      file.value = '';
      if (!f) return;
      const bytes = new Uint8Array(await f.arrayBuffer());
      let found = parseCas(bytes);
      const gapped = gapTape(bytes, found.reduce((a, t) => a + t.b.length, 0));
      if (gapped) found = [gapped];
      if (!found.length) { const raw = rawTape(bytes); if (raw) found = [raw]; }
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
  // ההודעות מופיעות רק מתחת לכפתור, בתיבה (גונן, 30.10: ההודעה הופיעה פעמיים, גם מעל הארון). בלי התיבה: בשורת המצב הכללית
  const micMsg = document.getElementById('mic-status');
  const say = t => { if (micMsg) micMsg.textContent = t; else status.textContent = t; };
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
      if (saveBtn) saveBtn.hidden = true;
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
    // הקריאה לא הצליחה: כפתור ששומר את ההקלטה כמו שהיא, כדי לשלוח אותה ולבדוק מה המיקרופון שמע (גונן, 30.10)
    let saveBtn = null;
    function offerSave(x, sr) {
      if (!saveBtn) {
        saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'mini mic-save';
        saveBtn.textContent = EN ? '💾 Save the recording' : '💾 לשמור את ההקלטה';
        micMsg.after(saveBtn);
      }
      saveBtn.hidden = false;
      saveBtn.onclick = () => {
        const q = new Int16Array(x.length); for (let i = 0; i < x.length; i++) q[i] = Math.max(-32767, Math.min(32767, Math.round(x[i] * 32767)));
        const d = new Date(), two = v => String(v).padStart(2, '0');
        saveFile(wav16(q, sr), 'dragon-mic-' + d.getFullYear() + two(d.getMonth() + 1) + two(d.getDate()) + '-' + two(d.getHours()) + two(d.getMinutes()) + '.wav', 'audio/wav');
      };
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
        if (m.progress !== undefined) {
          say(m.phase === 2 ? (EN ? '⏳ Reading the hard parts again… ' + Math.round(m.progress) + ' s (up to a minute and a half)' : '⏳ קורא שוב את החלקים הקשים… ' + Math.round(m.progress) + ' שניות (עד דקה וחצי)')
            : (EN ? '⏳ Reading the tape… ' : '⏳ קורא את הקלטת… ') + Math.min(99, Math.round(m.progress * 100)) + '%');
          return;
        }
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
        if (!good.length) offerSave(x, sr);
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
    // 5.11, Junior's Revenge: התוכנית שנטענה שמה קפיצה בנקודת החיבור של קלט שורה ($0182, אחרי ההדלקה RTS).
    // כש-OK מופיע, הקפיצה מפעילה טוען שממשיך לקרוא מהקלטת מאותו מקום, כמו ברשמקול אמיתי. לא מריצים אחורה
    if (HEAPU8[ram + 0x182] !== 0x39) return;
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
