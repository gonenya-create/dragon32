// גלריית הפרסומות של Dragon Data: התוכן של כל פרסומת, בעברית ובאנגלית. tools/adverts/build.mjs בונה ממנו את הדפים.
// הכללים (גונן, 27.10.2026, ~/mac-tools/dragon-rights/gallery-spec.md): שנה רק אם בדקנו אותה, תקציר ותרגום נאמנים לטקסט,
// בלי להוסיף עובדות, וקרדיט + קישור לדף המקורי ב-Dragon Data Archive (הרשות: Richard, 27.10.2026).
// הסדר ברשימה = הסדר בגלריה (לפי זמן: הפרסומות בלי שנה ממוקמות לפי מה שכתוב בהן, למשל המחיר).
// פרסומת חדשה בכל שבוע: מוסיפים כאן רשומה, שמים את התמונות ב-adverts/img/, ומריצים: node tools/adverts/build.mjs
//
// שדות: id (גם הכתובת: /adverts/<id>/), kind (ad / brochure / leaflet / prices), year (null אם לא נבדקה),
// archive (הדף אצל Richard), source (scan = סריקה של Dan, archive = העותק של הארכיון, ia = Internet Archive),
// images (הראשונה גם בכרטיס, כ-<id>-card.jpg), original (הכותרת באנגלית כמו בפרסומת).
// בטקסט העברי: **מודגש** בתחילת פסקה, ומילים באנגלית מבודדות אוטומטית (bdi) בבנייה.

export const ADVERTS = [
  {
    id: 'before-we-made-it-clever',
    kind: 'ad',
    year: null,
    archive: 'http://dragondata.co.uk/adverts/before-we-made-it-clever/before-we.html',
    source: 'scan',
    images: ['before-we-made-it-clever.jpg'],
    original: 'Before we made it clever, we made it simple.',
    he: {
      title: '"לפני שעשינו אותו חכם, עשינו אותו פשוט"',
      summary: 'הפרסומת משווה את ה-Dragon 32 לחשבונייה: הוא חזק ממנה באלפי אחוזים, אבל בנוי על אותו עיקרון של פשטות. היא מציגה אותו כ"מחשב המשפחה הראשון", עם משחקים, תוכנות לימוד ותוכנות לתכנון הכסף של הבית.',
      facts: [
        ['המחיר', '£199.50, בלי הטלוויזיה'],
        ['המעבד', '6809E, "המעבד החזק ביותר בשמונה סיביות שיש"'],
        ['הזיכרון', '32K, "לפחות פי שניים מרוב המחשבים במחיר דומה", ואפשר להרחיב ל-64K'],
        ['המקלדת', 'מקשים אמיתיים, עם אחריות ל-20 מיליון הקשות'],
        ['גרפיקה וצליל', '9 צבעים, 5 רזולוציות, 5 אוקטבות']
      ],
      translation: [
        '**לפני שעשינו אותו חכם, עשינו אותו פשוט.**',
        'חשבונייה היא לא יותר מחתיכות עץ על חוט. ובכל זאת היא הופכת חישובים מסובכים מאוד למשחק ילדים.',
        'נכון, מחשב המשפחה Dragon 32 עולה על היכולות של החשבונייה בכמה אלפי אחוזים. ואפילו יותר.',
        'אבל בלב שלו, ה-Dragon בנוי על אותו עיקרון של פשטות. בגלל זה קל כל כך ללמוד אותו, וכיף כל כך להשתמש בו.',
        '**מחשב המשפחה הראשון.**',
        'ה-Dragon תוכנן במיוחד בשביל המשפחה. כבר מהרגע שתרימו את המדריך למשתמש, אתם והילדים שלכם תתחילו להרגיש בבית עם המחשב החדש.',
        'הדבר הראשון שתראו הוא שבדיוק כמו החשבונייה, ה-Dragon מומחה בחילוק, בכפל ובכל מה שקשור למתמטיקה.',
        'מכאן והלאה, צפו לבלתי צפוי. הגרפיקה הצבעונית, עם המערבולות והדוגמאות המהפנטות שפתאום אתם יכולים לצייר. חמש האוקטבות של המוזיקה. ומבחר התוכנות.',
        '**תוכנה שמתאימה לו.**',
        'התוכנות של Dragon לא מציעות רק מבחר גדול של משחקים. תמצאו תוכנות לימוד. תוכנות שעוזרות לתכנן את הכסף שלכם. ואפילו תוכנות שמלמדות איך לתכנת.',
        'הילדים שלכם ייכנסו מהר מאוד למבחר הגדול של משחקי ארקייד והרפתקאות. ובזמן שהם עסוקים בזה, תהיה לכם ההנאה לדעת שהם מתרגלים לטכנולוגיה החדשה, שנעשית חשובה יותר ויותר, בדרך הכי פחות כואבת שיש.',
        'כמו שאתם רואים, ה-Dragon מציע כוח אמיתי ויכולות מתקדמות. הוא עולה רק £199.50*, ותגלו שזה באמת שווה את הכסף. ובניגוד לחלק מהמתחרים, יש לו מקלדת באיכות מקצועית עם מקשים אמיתיים, עם אחריות ל-20 מיליון הקשות.',
        'אפשר לסמוך עליו. ועל עוד הרבה דברים.',
        '**מפרט.** מעבד 6809E: המעבד החזק ביותר בשמונה סיביות שיש. ‏32K RAM כסטנדרט: לפחות פי שניים מהזיכרון של רוב המחשבים במחיר דומה, ואפשר להרחיב ל-64K RAM. ‏Extended Microsoft Color BASIC כסטנדרט, עם גרפיקה מתקדמת, בפקודות SET, LINE, CIRCLE, PAINT, PRINT, DRAW, ROTATE ו-PRINT USING, ועם צליל מתקדם: 5 אוקטבות, 255 צלילים. שליטה אוטומטית ברשמקול. עריכה מלאה עם INSERT ו-DELETE. יציאה מקבילית למדפסת, מסוג Centronics. תצוגה של 9 צבעים ו-5 רזולוציות. עובד עם כל טלוויזיית UHF ו/או מסך PAL נפרד. מקלדת באיכות מקצועית, בתחושה של מכונת כתיבה, עם אחריות ל-20 מיליון הקשות. יציאות לג\'ויסטיקים.',
        '*הטלוויזיה לא כלולה במחיר. DRAGON 32: מחשב המשפחה הראשון.'
      ]
    },
    en: {
      title: 'Before we made it clever, we made it simple',
      context: 'A Dragon Data advert for the Dragon 32 "Family Computer". It compares the Dragon with an abacus: thousands of per cent more capable, but built on the same principle of simplicity.',
      facts: [
        ['Price', '£199.50, TV not included'],
        ['Processor', '6809E, "the most powerful eight bit processor available"'],
        ['Memory', '32K RAM, "at least twice the memory of most similarly priced machines", expandable to 64K'],
        ['Keyboard', '"Typewriter feel. Guaranteed for 20 million depressions."'],
        ['Display and sound', '9 colours, 5 resolutions; 5 octaves, 255 tones']
      ]
    }
  },
  {
    id: 'at-last',
    kind: 'ad',
    year: null,
    archive: 'http://dragondata.co.uk/adverts/at-last/at-last.html',
    source: 'scan',
    images: ['at-last.jpg'],
    original: "At last. A range of software that's as well designed as the Dragon 32.",
    he: {
      title: '"סוף סוף: מבחר תוכנות שמעוצב טוב כמו ה-Dragon 32"',
      summary: 'פרסומת על שני עמודים. היא נפתחת ב"לפני חצי שנה, רוב משתמשי המחשבים חשבו ש-Dragon זה משהו ממשחק הרפתקאות", וממשיכה למבחר התוכנות של Dragon Data: תשע קלטות ומחסניות, ממשחק שחמט ועד קלטת שגורמת ל-Dragon לדבר.',
      facts: [
        ['התוכנות', 'Graphic Animator, ‏Personal Finance, ‏Ghost Attack, ‏Chess, ‏Typing Tutor, ‏Cave Hunter, ‏Dragon Selection, ‏Starship Chameleon, ‏Computavoice'],
        ['Computavoice', '"הקלטת הזאת גורמת ל-Dragon שלכם לדבר אליכם"'],
        ['Chess', 'תשע רמות, ו"קשה מאוד לנצח אותו"'],
        ['ההבטחה', '"בכל חודש נוסיף עוד ועוד"']
      ],
      translation: [
        '**סוף סוף. מבחר תוכנות שמעוצב טוב כמו ה-Dragon 32.**',
        'לפני חצי שנה, רוב משתמשי המחשבים חשבו ש-Dragon זה משהו ממשחק הרפתקאות.',
        'איך שהזמנים משתנים. היום כמעט אי אפשר לפתוח מגזין מחשבים בלי לקרוא עוד מחמאה חדשה ל-Dragon 32.',
        '**מחשב המשפחה הראשון.**',
        'קראנו לו מחשב המשפחה הראשון. ואנחנו מאמינים שחלק גדול מההצלחה שלו בא מזה שהוא עוצב מצוין בשביל התפקיד שלו.',
        'עיצוב שכולל 32K RAM של זיכרון, במחיר ששווה באמת את הכסף.',
        'עיצוב שמשתמש במעבד המתקדם 6809E.',
        'ועוד יכולות שעוזרות לפתוח את עולם המחשבים בפני מי שמשתמש בו בפעם הראשונה. כמו ציורים בצבע. 5 אוקטבות של מוזיקה.',
        'והרבה כוח וגמישות, כדי שיישאר מעניין גם כשהניסיון שלכם גדל.',
        '**תוכנה שמתאימה לו.**',
        'לעצב מבחר תוכנות שיעשה צדק עם ה-Dragon הייתה משימה שניגשנו אליה באותה זהירות שבה עיצבנו את המחשב עצמו.',
        'התוצאות כבר כאן: משחקים, תוכנות לימוד, טיפים לתכנות. הן נוצרו על ידי כמה מבתי התוכנה הטובים בעולם, כדי לעזור למשתמשים להוציא עוד יותר מהמחשבים שלהם.',
        '**Graphic Animator.** קלטת שמנצלת את היכולת של ה-Dragon לצייר על המסך. היא מראה לכם איך ליצור סרטים מצוירים פשוטים, ואז להחיות אותם.',
        '**Personal Finance.** הקלטת הזאת עוזרת לכם לעקוב אחרי כל הכספים של המשפחה, מחשבונות ועד דפי בנק.',
        '**Ghost Attack.** על מחסנית. אתם במבוך, ואתם חייבים למצוא את הדרך החוצה. אבל אתם לא לבד: רוחות רודפות אחריכם!',
        '**Chess.** שותף נהדר לשחק נגדו שוב ושוב, עם חיסרון גדול אחד: קשה מאוד לנצח אותו. בחנו את עצמכם בתשע רמות שונות. על מחסנית.',
        '**Typing Tutor.** רק מקלדת משוכללת כמו של ה-Dragon יכולה לאפשר תוכנה כזאת. לומדים להקליד על המקלדת של ה-Dragon עצמו. על קלטת.',
        '**Cave Hunter.** למצוא את הזהב החבוי זה קשה. אבל לשרוד את ההתקפות של יצורים מרושעים עלול להתברר כבלתי אפשרי. Cave Hunter הוא על מחסנית.',
        '**Dragon Selection.** קלטת של תוכנות שימושיות: ליצור מאגר מידע משלכם, לכתוב מנגינות משלכם, או ללמוד מילים בשפות אחרות.',
        '**Starship Chameleon.** משחק על מחסנית. אתם מגלים שאתם מותקפים על ידי הגבולטורים (Gabolators) האיומים! המשימה שלהם היא לכבוש את כוכב הלכת שלכם, והמשימה שלכם היא להגן עליו.',
        '**Computavoice.** הקלטת הזאת באמת גורמת ל-Dragon שלכם לדבר אליכם.',
        'אלה רק חלק מהכותרים שלנו, ובכל חודש נוסיף עוד ועוד.',
        'מה שמקבלים ממחשב תלוי במה שמכניסים לו. ועם Dragon 32 והתוכנות של Dragon יש מספיק אתגר וסיפוק לכל אחד. אבל בשביל זה הוא עוצב.',
        'DRAGON 32: מחשב המשפחה הראשון. (*הטלוויזיה לא כלולה במחיר.)'
      ]
    },
    en: {
      title: "At last. A range of software that's as well designed as the Dragon 32",
      context: 'A two-page Dragon Data advert. It opens with "Six months ago, most computer users thought a Dragon was something out of an adventure game" and goes on to nine titles on cassette and cartridge.',
      facts: [
        ['Titles', 'Graphic Animator, Personal Finance, Ghost Attack, Chess, Typing Tutor, Cave Hunter, Dragon Selection, Starship Chameleon, Computavoice'],
        ['Computavoice', '"This cassette actually enables your Dragon to speak to you."'],
        ['Chess', 'Nine levels, and "very hard to beat"'],
        ['The promise', '"Every month, we\'ll be adding more and more."']
      ]
    }
  },
  {
    id: 'fire-your-imagination',
    kind: 'brochure',
    year: null,
    archive: 'http://dragondata.co.uk/adverts/fire-your/index.html',
    source: 'archive',
    images: ['fire-your-imagination.jpg', 'fire-your-imagination-2.jpg', 'fire-your-imagination-3.jpg'],
    original: 'Fire Your Imagination',
    he: {
      title: '"הציתו את הדמיון": חוברת המכירה',
      summary: 'חוברת מתקפלת בגודל A5 שהציגה את ה-Dragon 32 למשפחות: "בעיצוב בריטי, בייצור בריטי", עם 32K זיכרון, מקלדת כמו של מכונת כתיבה, וחיבור לרשמקול ולטלוויזיה רגילים. כאן השער ושני העמודים הראשונים. את כל החוברת אפשר לראות בארכיון.',
      facts: [
        ['מאיפה', '"בעיצוב בריטי, בייצור בריטי, ומתאים לכל המשתמשים"'],
        ['הזיכרון', '"32K RAM עצום", מובנה כסטנדרט'],
        ['החיבור', 'רשמקול רגיל, ושקע האנטנה של טלוויזיית UHF רגילה'],
        ['מה עושים בו', 'משחקים, תקציב משפחתי, לימוד הקלדה ושפות, ותוכניות משלכם ב-BASIC']
      ],
      translation: [
        '**השער: DRAGON. הציתו את הדמיון.**',
        '**מחשב משפחתי שמצית את הדמיון.**',
        'הכירו את ה-Dragon, ה-Dragon 32 החדש. הוא הראשון בדור חדש לגמרי של מיקרו-מחשבים: בעיצוב בריטי, בייצור בריטי, ומתאים לכל המשתמשים.',
        'כשתלמידים לומדים להשתמש במחשבים כמו בדבר טבעי, וההורים צריכים ללמוד טכנולוגיה חדשה לגמרי, עם כוח המחשוב המדהים שהידע הזה שם בקצות האצבעות, ההיגיון הפשוט אומר שהלמידה צריכה להיות קלה ככל האפשר.',
        'וכאן ה-Dragon 32 החדש באמת מראה מה הוא שווה.',
        'יש לו מקלדת רגילה כמו של מכונת כתיבה, כדי שהכל ירגיש מוכר. פשוט מחברים רשמקול רגיל, מחברים לשקע האנטנה של טלוויזיית UHF רגילה, ואתם מוכנים להתחיל הרפתקה מדהימה.',
        'ה-Dragon 32 גם חזק: יש לו 32K RAM עצום (זיכרון גישה אקראית) מובנה כסטנדרט. עם כוח מחשוב כזה ממש בקצות האצבעות, ילדים יכולים להמשיך ללמוד בבית, ההורים יכולים ללמוד איתם, וכל המשפחה יכולה ליהנות במשך שעות מהמבחר הרחב של משחקי המחשב שכבר יש.',
        'או שאפשר ללמוד להקליד עם אחת התוכנות שיש ל-Dragon 32. לסדר את הכספים של המשפחה עם תוכנה מיוחדת לתקציב. אפילו ללמוד שפות חדשות: כמעט הכל אפשרי עם המבחר הרחב של חבילות התוכנה ל-Dragon 32, שנמכרות בנפרד. וכמובן, אפשר גם לכתוב תוכניות משלכם ב-BASIC המובנה, שתוכנן כך שיהיה קל ללמוד אותו. ואז הכיף באמת מתחיל!',
        'קראו על כל היכולות המדהימות שה-Dragon 32 החדש מביא אליכם הביתה, בעמודים הבאים.',
        'לא תמצאו מיקרו-מחשב אחר שיצית את הדמיון שלכם יותר.',
        '(בהמשך החוברת יש עוד עמודים. את כולה אפשר לראות בארכיון.)'
      ]
    },
    en: {
      title: 'Fire Your Imagination: the Dragon 32 brochure',
      context: 'An A5 foldout Dragon Data brochure introducing the Dragon 32 to families: "British designed, British built, and ideal for all users". Shown here: the cover and the opening pages; the whole brochure is in the archive.',
      facts: [
        ['Built', '"British designed, British built"'],
        ['Memory', '"a massive 32K RAM (Random Access Memory) built in as standard"'],
        ['Setting up', 'a standard cassette recorder and the aerial socket of a standard UHF television'],
        ['What for', 'games, family budgeting, typing, languages, and your own programs in BASIC']
      ]
    }
  },
  {
    id: 'price-list-may-1983',
    kind: 'prices',
    year: { he: '23 במאי 1983', en: '23 May 1983' },
    archive: 'http://dragondata.co.uk/adverts/DD-dealer-prices-may-83/DD_Retail_Price_list_May_83.html',
    source: 'archive',
    images: ['price-list-may-1983.jpg'],
    original: 'Hardware. Recommended Price List. 23rd May, 1983.',
    he: {
      title: 'מחירון לחנויות: כמה עלה ה-Dragon במאי 1983',
      summary: 'המחירון ש-Dragon Data שלחה לחנויות: מחיר מומלץ לצרכן, עם מע"מ, ומחיר לחנות, בלי מע"מ, לפי כמות. ה-Dragon 32 עולה כאן £175. בפרסומת "לפני שעשינו אותו חכם" המחיר הוא £199.50. כאן העמוד הראשון מתוך ארבעה.',
      facts: [
        ['Dragon 32', '£175 לצרכן. לחנות: £121.74 (4 עד 20 יחידות), או £117.93 (24 עד 100)'],
        ['זוג ג\'ויסטיקים', '£14.95'],
        ['כונן דיסקים', '£275 עם בקר, £225 בלי בקר'],
        ['כונן נוסף', '£200']
      ],
      translation: [
        '**DRAGON DATA LIMITED.** אזור התעשייה קנפיג, מרגם, פורט טלבוט, מערב גלמורגן. (בלי שורת הטלפון והטלקס, ובלי הכתובת הרשומה שבתחתית הדף.)',
        '**חומרה. מחירון מומלץ. 23 במאי 1983.**',
        'העמודות: מחיר לצרכן, כולל מע"מ. מחיר לחנות, בלי מע"מ: לקנייה של 4 עד 20 יחידות, ולקנייה של 24 עד 100.',
        'DRAGON 32: ‏£175.00. לחנות: £121.74, או £117.93.',
        'ג\'ויסטיק (לזוג): ‏£14.95. לחנות: £10.40, או £10.06.',
        'כונן דיסקים יחיד, עם בקר: ‏£275.00. לחנות: £191.30, או £185.32.',
        'כונן דיסקים יחיד, בלי בקר: ‏£225.00. לחנות: £156.52, או £151.63.',
        'כונן יחיד נוסף: ‏£200.00. לחנות: £139.13, או £134.78.',
        '(במחירון ארבעה עמודים. את כולם אפשר לראות בארכיון.)'
      ]
    },
    en: {
      title: 'Dragon Data hardware price list, 23 May 1983',
      context: 'The recommended price list Dragon Data sent to dealers: retail prices including VAT, and trade prices excluding VAT by quantity. The Dragon 32 is £175 here; the "Before we made it clever" advert gives £199.50. Page 1 of 4.',
      facts: [
        ['Dragon 32', '£175 retail; trade £121.74 (4–20) or £117.93 (24–100)'],
        ['Joysticks (per pair)', '£14.95'],
        ['Single disk drive', '£275 with controller, £225 without'],
        ['Additional single drive', '£200']
      ]
    }
  },
  {
    id: 'earls-court-1984',
    kind: 'ad',
    year: { he: '1984', en: '1984' },
    archive: 'http://dragondata.co.uk/adverts/GEC-Dragon-Eearls-Court-1984/index.html',
    source: 'ia',
    images: ['earls-court-1984.jpg'],
    original: 'GEC Dragon Computers — Grandstand',
    he: {
      title: 'הדוכן של GEC Dragon בתערוכת Earls Court',
      summary: 'פרסומת על שני עמודים מתוך החוברת של תערוכת המחשבים ב-Earls Court: המילה GRANDSTAND (יציע הכבוד) בענק, מפת אולם התערוכה, והזמנה לדוכן ליד הכניסה של West Brompton. מוצגים בה ה-Dragon 32, ה-GEC Dragon 64 "שהוכרז לא מזמן", משחקים חדשים ותוכנות עסקיות.',
      facts: [
        ['המחשבים', 'ה-Dragon 32 "האהוב תמיד" וה-GEC Dragon 64 "שהוכרז לא מזמן"'],
        ['המשחקים', '"המבחר העצום שלנו כאן, כדי לנסות ולקנות"'],
        ['לעסקים', 'תוכנות OS9'],
        ['הדוכנים', '417, ‏419, ‏421, ‏516, ‏518 ו-520']
      ],
      translation: [
        '**GRANDSTAND (יציע הכבוד)**',
        'יש דוכן אחד ב-Earls Court שבאמת יש בו משהו לכל אחד. מהמתחיל ועד המקצוען, תמצאו את הדוכן של GEC Dragon (ליד הכניסה של West Brompton) מלא בדברים טובים. בואו לבקר אותנו, ותזכו לקבלת פנים חמה.',
        '**GEC DRAGON.** ה-Dragon 32 האהוב תמיד, וה-GEC Dragon 64 שהוכרז לא מזמן. שני מחשבים מצוינים, מושלמים לבית ולעסק קטן.',
        '**GEC DRAGON.** המבחר העצום שלנו של משחקים כאן, כדי שתנסו ותקנו. אל תפספסו את המשחקים החדשים לגמרי שאנחנו מציגים כאן בתערוכה.',
        '**GEC DRAGON.** מבחר תוכנות העסקים שלנו ל-OS9, שתוכננו כדי לעזור לעסק שלכם לעבוד ביעילות וברווחיות.',
        '**GEC DRAGON.** אנחנו חושפים כמה מוצרים חדשים לגמרי, שמוצגים כאן לקהל בפעם הראשונה. אל תפספסו אותם.',
        'תמצאו אותנו ליד הכניסה של West Brompton (בדוכנים 417, ‏419, ‏421, ‏516, ‏518 ו-520).',
        'מפת התערוכה. הכניסה של West Brompton. \u200fGEC DRAGON COMPUTERS.'
      ]
    },
    en: {
      title: 'GEC Dragon at the Earls Court Computer Fair, 1984',
      context: 'A two-page GEC Dragon advert from the brochure of the 1984 Earls Court Computer Fair: a giant "GRANDSTAND", a floor plan, and an invitation to the stand near the West Brompton entrance.',
      facts: [
        ['Computers', '"The ever popular Dragon 32 and the recently announced GEC Dragon 64"'],
        ['Games', '"Our vast range of games is here for you to try and buy"'],
        ['Business', 'the OS9 range of business software'],
        ['Stands', 'nos. 417, 419, 421, 516, 518 and 520']
      ]
    }
  },
  {
    id: 'touchmaster',
    kind: 'leaflet',
    year: null,
    archive: 'http://dragondata.co.uk/adverts/touchmaster/new_touchmaster_A5.html',
    source: 'archive',
    images: ['touchmaster.jpg'],
    original: 'New! Touchmaster',
    he: {
      title: 'Touchmaster: לוח מגע למחשב',
      summary: 'עלון בגודל A5 על Touchmaster, "רעיון מהפכני בציוד היקפי למחשב": לוח רגיש למגע בגודל A4 שמתחבר למחשב ועוקף את המקלדת. מציירים עליו באצבע או בעט, והציור מופיע מיד על המסך.',
      facts: [
        ['המחיר', '£149.95, מ-Touchmaster Ltd'],
        ['הלוח', 'משטח עבודה בגודל A4, ברזולוציה של 256 × 256'],
        ['בחבילה', 'הלוח, שנאי, מדריכים, תוכנת Multipaint עם שכבת ציור, ועט'],
        ['גם ל', 'BBC, ‏CBM64, ‏VIC20, ‏SPECTRUM']
      ],
      translation: [
        '**חדש! TOUCHMASTER**',
        'TOUCHMASTER הוא רעיון מהפכני בציוד היקפי למחשב: לוח רגיש למגע שמתחבר בפשטות למחשב, ולמעשה עוקף את המקלדת.',
        'הוא בנוי חזק, עם משטח עבודה בגודל A4 ורזולוציה מעולה של 256 × 256. בחבילת TOUCHMASTER יש כל מה שצריך כדי להתנסות בעצמכם, בלי אפילו לחבר תקע! הטכנולוגיה המיוחדת אומרת שאין בו מתגים שיכולים להישבר, ולכן TOUCHMASTER הוא מכשיר חזק ואמין.',
        'בחבילה: ה-TOUCHMASTER, שנאי, מדריכים, תוכנת Multipaint עם שכבה, ועט (למקרה שלא תרצו להשתמש באצבע!). עם תוכנת Multipaint מציירים מהר ובקלות על השכבה, בעט או באצבע, ברזולוציה שבחרתם, והציור מופיע על המסך מיד. לא בטוחים ביכולת הציור שלכם ביד חופשית? אל דאגה: ב-Multipaint יש גם פעולות לציור ריבועים, עיגולים, משולשים ועוד. את הציור הגמור אפשר לשמור בקלות על קלטת, או על דיסק אם צריך, כי הממשק עדיין מאפשר להשתמש בכוננים.',
        'גרפיקה היא רק צד אחד של TOUCHMASTER, ויש מבחר תוכנות: TOUCHWARE. ילדים קטנים שעוד לא מזהים אותיות על מקלדת יכולים להשתמש ב-TOUCHMASTER, ויש בשבילם כמה חבילות לזיהוי צבעים וצורות. הם יכולים להתאים צורות וצבעים על השכבות שמגיעות עם TOUCHWARE לאלה שמופיעים על המסך, בנגיעה אחת.',
        'קל לכתוב תוכניות ל-TOUCHMASTER: אם אתם מסתדרים עם קלט מג\'ויסטיק, תסתדרו גם עם הקלט של TOUCHMASTER. במדריך יש תוכנית לדוגמה שמראה כמה קל לשלב את TOUCHMASTER, על כל האפשרויות שלו, בתוכניות שלכם.',
        'TOUCHMASTER זמין עכשיו מ-Touchmaster Ltd במחיר £149.95. פשוט משתמשים בטופס ההזמנה שמעבר לדף.',
        'יש גם גרסאות ל-BBC, ‏CBM64, ‏VIC20 ו-SPECTRUM.',
        'פרטים נוספים בשירות הלקוחות של Touchmaster.',
        '(בעמוד השני של העלון יש טופס הזמנה. אפשר לראות אותו בארכיון.)'
      ]
    },
    en: {
      title: 'New! Touchmaster: a touch-sensitive pad',
      context: 'An A5 leaflet for the Touchmaster, "a revolutionary concept in computer peripherals": an A4 touch-sensitive pad that plugs into the computer and bypasses the keyboard. The back page is an order form.',
      facts: [
        ['Price', '£149.95 from Touchmaster Ltd'],
        ['The pad', 'A4 work surface, 256 × 256 resolution'],
        ['In the box', 'the pad, transformer, user guides, Multipaint program and overlay, and a stylus'],
        ['Also for', 'BBC, CBM64, VIC20, Spectrum']
      ]
    }
  }
];
