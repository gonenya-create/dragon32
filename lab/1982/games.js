// קטלוג המשחקים של ארון הקלטות (גונן, 27.10: "מחסנית רזה, ממוינת לקטגוריות, וכשבוחרים משחק נפתח דף משחק").
// מגירות לפי סדר כרונולוגי, ובכל מגירה המשחקים לפי השנה. לכל משחק כתובת משלו: /lab/1982/<slug>/ (וגם /en/...).
// הקובץ הוא JSON אחרי השורה הראשונה של הקוד, כדי ש-tools/lab/games-pages.mjs יקרא אותו בלי דפדפן.
window.D32_GAMES = {
  "drawers": [
    {
      "key": "adams",
      "he": "ההרפתקאות של Scott Adams",
      "en": "Scott Adams' adventures",
      "years": "1979",
      "note": [
        "Scott Adams הביא את הרפתקאות המילים למחשבים הביתיים. הקלטות האלה הן גרסת ה-Color Computer, ש-Roger Schrag העביר לצבע, והיא רצה גם על ה-Dragon. כאן באישורו.",
        "Scott Adams brought text adventures to home computers. These tapes are the Color Computer versions, converted to colour by Roger Schrag, which also ran on the Dragon. Here with his permission."
      ],
      "link": "https://www.msadams.com/",
      "quote": {
        "text": "Greetings to all those Dragon Players out there, whether you are trying the games for the very first time or just rediscovering them I hope you have a tremendous amount of fun playing them. I know I did in writing them! G-D bless!",
        "sign": "Scott Adams, 10/28/2026, Platteville Wisconsin USA",
        "he": "ברכות לכל שחקני ה-Dragon שם בחוץ, בין אם אתם מנסים את המשחקים בפעם הראשונה ובין אם אתם מגלים אותם מחדש. אני מקווה שתיהנו מהם מאוד. אני יודע שאני נהניתי לכתוב אותם! ה׳ יברך!"
      }
    },
    {
      "key": "period",
      "he": "המשחקים של Ken Kalish",
      "en": "Ken Kalish's games",
      "years": "1982–85",
      "note": [
        "Ken Kalish כתב משחקים ל-Dragon ול-Color Computer, ו-Microdeal מקורנוול הוציאה אותם בזמנו, על קלטות. כאן באישורו.",
        "Ken Kalish wrote games for the Dragon and the Color Computer, and Microdeal of Cornwall published them at the time, on tape. Here with his permission."
      ]
    },
    {
      "key": "hughey",
      "he": "המשחקים של Mike Hughey",
      "en": "Mike Hughey's games",
      "years": "1982–84",
      "note": [
        "Mike Hughey כתב משחקים בשפת מכונה ל-Color Computer, ו-Tom Mix Software ממישיגן הוציאה אותם. ל-Dragon הוציאה אותם Microdeal בבריטניה. ב-1997 הוא כתב שהוא ישמח שיפיצו אותם בחופשיות, בכל צורה. כאן ברשותו.",
        "Mike Hughey wrote machine-code games for the Color Computer, and Tom Mix Software of Michigan published them. Microdeal brought them out for the Dragon in Britain. In 1997 he wrote that he would be thrilled for them to be distributed freely, in whatever format. Here with his permission."
      ]
    },
    {
      "key": "more",
      "he": "עוד משחקים מאותה תקופה",
      "en": "More games from the time",
      "years": "1984–86",
      "note": [
        "משחקים של מחברים שיש לנו מהם משחק אחד. כאן באישורם, או ברישיון פתוח שהם עצמם נתנו.",
        "Games by authors we have one game from. Here with their permission, or under an open licence they gave themselves."
      ]
    },
    {
      "key": "type",
      "he": "הקלד בעצמך",
      "en": "Type it in",
      "years": "1983"
    },
    {
      "key": "community",
      "he": "משחקים חדשים מהקהילה",
      "en": "New games from the community",
      "years": "2021–2025",
      "note": [
        "מתכנתים מכל העולם עדיין כותבים משחקים ל-Dragon. כאן באישורם.",
        "Programmers around the world still write games for the Dragon. Here with their permission."
      ]
    },
    {
      "key": "ours",
      "he": "מתוצרת Dragon 1982",
      "en": "Made by Dragon 1982",
      "years": "2026",
      "note": [
        "כתבנו בעצמנו, למכונה הזאת.",
        "We wrote these ourselves, for this machine."
      ],
      "groups": [
        [
          "mc",
          "משחקים",
          "Games"
        ],
        [
          "basic",
          "תוכניות BASIC קצרות: לשחק, לקרוא את הקוד ולשנות",
          "Short BASIC programs: play them, read the code, change it"
        ]
      ]
    }
  ],
  "games": {
    "escape": {
      "slug": "escape",
      "drawer": "period",
      "year": "1982",
      "tag": [
        "מבוך חידות",
        "puzzle maze"
      ],
      "players": [
        "שחקן אחד",
        "1 player"
      ],
      "load": [
        "כחצי דקה",
        "about half a minute"
      ],
      "about": {
        "he": [
          "המשחק הראשון של Ken Kalish: הוא כתב אותו בסוף 1981, ו-Color Software Services מטקסס הוציאה אותו ב-1982. בבריטניה הוציאה אותו Microdeal, גם ל-Dragon.",
          "המנוע התלת-ממדי שלו הוא אותו מנוע ש-Kalish השתמש בו אחר כך ב-Phantom Slayer. אבל כאן אין רוחות ואין ירי: זה משחק חידות."
        ],
        "en": [
          "Ken Kalish's first game: he wrote it at the end of 1981, and Color Software Services of Texas published it in 1982. In Britain Microdeal published it, for the Dragon too.",
          "Its 3D engine is the one Kalish later used for Phantom Slayer. But here there are no phantoms and no shooting: it is a puzzle game."
        ]
      },
      "icon": [
        24,
        8,
        96
      ]
    },
    "phantom": {
      "slug": "phantom-slayer",
      "drawer": "period",
      "year": "1983",
      "tag": [
        "מבוך תלת-ממדי",
        "3D maze"
      ],
      "players": [
        "שחקן אחד",
        "1 player"
      ],
      "load": [
        "כדקה וחצי",
        "about a minute and a half"
      ],
      "about": {
        "he": [
          "Ken Kalish כתב אותו ב-1982 למחשב CoCo של Tandy, וחברת Med Systems הוציאה אותו. Microdeal הוציאה את גרסת ה-Dragon ב-1983.",
          "מבוך בתלת-ממד: צדים רוחות רפאים לפני שהן תופסות אתכם."
        ],
        "en": [
          "Ken Kalish wrote it in 1982 for the Tandy Color Computer, published by Med Systems. Microdeal brought out the Dragon version in 1983.",
          "A 3D maze: hunt the phantoms before they catch you."
        ]
      },
      "icon": [
        0,
        0,
        256
      ]
    },
    "ranger": {
      "slug": "danger-ranger",
      "drawer": "period",
      "year": "1983",
      "tag": [
        "ג'ויסטיק",
        "joystick"
      ],
      "players": [
        "שחקן אחד",
        "1 player"
      ],
      "load": [
        "כשלוש דקות",
        "about three minutes"
      ],
      "about": {
        "he": [
          "עוד משחק של Ken Kalish, ש-Microdeal הוציאה ל-Dragon ב-1983.",
          "רצים בין קומות של מבוך, קופצים, יורים ואוספים מפתחות ואוצרות, בזמן שעטלפים ועיניים יורות מהצדדים."
        ],
        "en": [
          "Another Ken Kalish game, brought out for the Dragon by Microdeal in 1983.",
          "Run through the floors of a maze, jump, shoot and collect keys and treasure, while bats fly and eyes shoot from the sides."
        ]
      },
      "icon": [
        26,
        26,
        48
      ]
    },
    "cuthbert": {
      "slug": "cuthbert-in-the-jungle",
      "drawer": "period",
      "year": "1983",
      "tag": [
        "ג'ויסטיק",
        "joystick"
      ],
      "players": [
        "שחקן אחד",
        "1 player"
      ],
      "load": [
        "כשתי דקות",
        "about two minutes"
      ],
      "about": {
        "he": [
          "Ken Kalish כתב אותו בשם Trapfall, ו-Tom Mix Software הוציאה אותו ב-1983 ל-Color Computer. בבריטניה הוציאה אותו Microdeal מקורנוול בשם Cuthbert in the Jungle, והוא רץ גם על ה-Dragon.",
          "הטוען של Microdeal מריץ את עצמו בעזרת תו נקודתיים שיושב בכתובת קבועה בשבב של ה-Dragon. סידרנו את השבב שלנו כמו במקור, כדי שהתו יישב שם גם אצלנו. ההמתנה הארוכה במסך הרישיון היא של המשחק עצמו."
        ],
        "en": [
          "Ken Kalish wrote it as Trapfall, and Tom Mix Software published it in 1983 for the Color Computer. In Britain Microdeal of Cornwall published it as Cuthbert in the Jungle, and it ran on the Dragon too.",
          "Microdeal's loader starts itself with a colon character that sits at a fixed address in the Dragon's chip. We laid out our chip like the original, so the colon sits there in ours too. The long wait on the licence screen is the game's own."
        ]
      },
      "icon": [
        28,
        84,
        48
      ]
    },
    "dungeon": {
      "slug": "dungeon-raid",
      "drawer": "period",
      "year": "1983–84",
      "tag": [
        "ג'ויסטיק",
        "joystick"
      ],
      "players": [
        "שחקן אחד",
        "1 player"
      ],
      "load": [
        "כארבע דקות",
        "about four minutes"
      ],
      "about": {
        "he": [
          "Ken Kalish כתב אותו רק ל-Dragon, ו-Microdeal מקורנוול הוציאה אותו. על מסך הפתיחה כתוב 1983, ועל המסך של Microdeal כתוב 1984.",
          "בספטמבר 1984 הוא היה רביעי ברשימת המשחקים הנמכרים ל-Dragon."
        ],
        "en": [
          "Ken Kalish wrote it for the Dragon only, and Microdeal of Cornwall published it. The title screen says 1983, and Microdeal's screen says 1984.",
          "In September 1984 it was number four in the Dragon best-seller list."
        ]
      },
      "icon": [
        118,
        56,
        48
      ]
    },
    "athletyx": {
      "slug": "athletyx",
      "drawer": "period",
      "year": "1984–85",
      "tag": [
        "ג'ויסטיק",
        "joystick"
      ],
      "players": [
        "1–2 שחקנים",
        "1–2 players"
      ],
      "load": [
        "כשתי דקות",
        "about two minutes"
      ],
      "about": {
        "he": [
          "Ken Kalish כתב אותו רק ל-Dragon, ו-Microdeal מקורנוול הוציאה אותו. על מסך הפתיחה כתוב 1984, ועל המסך של Microdeal כתוב 1985.",
          "תחרות אתלטיקה בכמה מקצועות, שמתחילה בריצת 100 מטר. הטוען של Microdeal טוען אותו בשלבים, דרך כתובת קבועה בשבב של ה-Dragon, ולכן הוספנו אותה גם לשבב שלנו."
        ],
        "en": [
          "Ken Kalish wrote it for the Dragon only, and Microdeal of Cornwall published it. The title screen says 1984, and Microdeal's screen says 1985.",
          "An athletics contest in several events, starting with the 100 metres. Microdeal's loader loads it in stages through a fixed address in the Dragon's chip, so we added that address to our chip too."
        ]
      },
      "icon": [
        160,
        100,
        48
      ]
    },
    "grabber": {
      "slug": "grabber",
      "drawer": "hughey",
      "year": "1983",
      "tag": [
        "מבוך",
        "maze"
      ],
      "players": [
        "שחקן אחד או שניים",
        "1 or 2 players"
      ],
      "load": [
        "כשלוש וחצי דקות",
        "about three and a half minutes"
      ],
      "about": {
        "he": [
          "Mike Hughey כתב אותו ל-Color Computer, ו-Tom Mix Software הוציאה אותו ביולי 1983. Microdeal הוציאה אותו ל-Dragon.",
          "שני מבוכים על המסך בבת אחת, והכפתור מעביר ביניהם. היה בו דבר נדיר אז: מוזיקה שמתנגנת לאורך כל המשחק. Hughey כתב עליו: \"משחק קטן ונהדר\"."
        ],
        "en": [
          "Mike Hughey wrote it for the Color Computer, and Tom Mix Software published it in July 1983. Microdeal brought it out for the Dragon.",
          "Two mazes on the screen at once, and the button moves you between them. It had something rare then: music that plays all through the game. Hughey called it \"a great little game\"."
        ]
      },
      "icon": [
        80,
        8,
        128
      ]
    },
    "draconian": {
      "slug": "draconian",
      "drawer": "hughey",
      "year": "1984",
      "tag": [
        "יריות בחלל",
        "space shooter"
      ],
      "players": [
        "שחקן אחד או שניים",
        "1 or 2 players"
      ],
      "load": [
        "כשלוש וחצי דקות",
        "about three and a half minutes"
      ],
      "about": {
        "he": [
          "Mike Hughey כתב אותו ל-Color Computer, ו-Tom Mix Software הוציאה אותו ב-1984. Microdeal הוציאה אותו ל-Dragon.",
          "טסים בחלל לכל כיוון ומשמידים בסיסים, ומצילים אסטרונאוטים שכלואים בהם. מי שמתעכב, דרקון ענק רודף אחריו. יש מוזיקה בכמה קולות בפתיחה ובין השלבים."
        ],
        "en": [
          "Mike Hughey wrote it for the Color Computer, and Tom Mix Software published it in 1984. Microdeal brought it out for the Dragon.",
          "Fly through space in any direction, destroy the bases and rescue the astronauts held in them. Take too long and a giant dragon comes after you. There is music in several voices at the start and between levels."
        ]
      },
      "icon": [
        72,
        48,
        104
      ]
    },
    "adventureland": {
      "slug": "adventureland",
      "drawer": "adams",
      "year": "1979",
      "tag": [
        "הרפתקת מילים",
        "text adventure"
      ],
      "players": [
        "שחקן אחד",
        "1 player"
      ],
      "load": [
        "קצת פחות משתי דקות",
        "a little under two minutes"
      ],
      "about": {
        "he": [
          "ההרפתקה הראשונה של Scott Adams, מ-1978: אחד ממשחקי ההרפתקה הראשונים שנמכרו למחשבים ביתיים. על המסך: COPYRIGHT ADAMS 1979, והמרה לצבע של Roger Schrag.",
          "כותבים פקודות קצרות באנגלית, ומחפשים 13 אוצרות בארץ של קסמים."
        ],
        "en": [
          "Scott Adams' first adventure, from 1978: one of the first adventure games sold for home computers. The screen says COPYRIGHT ADAMS 1979, with the colour conversion by Roger Schrag.",
          "Type short commands in English and hunt for 13 treasures in a land of magic."
        ]
      },
      "icon": [
        0,
        0,
        256
      ]
    },
    "pirate": {
      "slug": "pirate-adventure",
      "drawer": "adams",
      "year": "1979",
      "tag": [
        "הרפתקת מילים",
        "text adventure"
      ],
      "players": [
        "שחקן אחד",
        "1 player"
      ],
      "load": [
        "קצת פחות משתי דקות",
        "a little under two minutes"
      ],
      "about": {
        "he": [
          "ההרפתקה השנייה בסדרה. Alexis Adams כתבה אותה יחד עם Scott, וכך כתוב במשחק. על המסך: COPYRIGHT ADAMS 1979, והמרה לצבע של Roger Schrag.",
          "מדירה בלונדון לאי של פיראטים, בחיפוש אחרי אוצר."
        ],
        "en": [
          "The second adventure in the series. Alexis Adams wrote it with Scott, as the game says. The screen says COPYRIGHT ADAMS 1979, with the colour conversion by Roger Schrag.",
          "From a London flat to a pirates' island, hunting for treasure."
        ]
      },
      "icon": [
        0,
        0,
        256
      ]
    },
    "mission": {
      "slug": "secret-mission",
      "drawer": "adams",
      "year": "1979",
      "tag": [
        "הרפתקת מילים",
        "text adventure"
      ],
      "players": [
        "שחקן אחד",
        "1 player"
      ],
      "load": [
        "כשתי דקות",
        "about two minutes"
      ],
      "about": {
        "he": [
          "ההרפתקה השלישית של Scott Adams, מ-1979. בהתחלה נקראה Mission Impossible. המרה לצבע של Roger Schrag.",
          "סוכן חשאי צריך לעצור פצצת זמן בכור גרעיני."
        ],
        "en": [
          "Scott Adams' third adventure, from 1979. At first it was called Mission Impossible. Colour conversion by Roger Schrag.",
          "A secret agent must stop a time bomb in a nuclear reactor."
        ]
      },
      "icon": [
        0,
        0,
        256
      ]
    },
    "voodoo": {
      "slug": "voodoo-castle",
      "drawer": "adams",
      "year": "1979",
      "tag": [
        "הרפתקת מילים",
        "text adventure"
      ],
      "players": [
        "שחקן אחד",
        "1 player"
      ],
      "load": [
        "קצת פחות משתי דקות",
        "a little under two minutes"
      ],
      "about": {
        "he": [
          "ההרפתקה הרביעית בסדרה, מ-1979. Alexis Adams כתבה אותה, וכך כתוב במשחק. Scott Adams מספר שהרעיון היה שלה, ושהיא הביאה הרבה מהסיפור וכמה מהחידות. המרה לצבע של Roger Schrag.",
          "מסירים קללת וודו מהרוזן כריסטו, בטירה מלאת סודות."
        ],
        "en": [
          "The fourth adventure in the series, from 1979. Alexis Adams wrote it, as the game says. Scott Adams says it was her idea, and that she brought much of the story and a number of the puzzles. Colour conversion by Roger Schrag.",
          "Lift a voodoo curse from Count Cristo, in a castle full of secrets."
        ]
      },
      "icon": [
        0,
        0,
        256
      ]
    },
    "count": {
      "slug": "the-count",
      "drawer": "adams",
      "year": "1979",
      "tag": [
        "הרפתקת מילים",
        "text adventure"
      ],
      "players": [
        "שחקן אחד",
        "1 player"
      ],
      "load": [
        "קצת פחות משתי דקות",
        "a little under two minutes"
      ],
      "about": {
        "he": [
          "ההרפתקה החמישית של Scott Adams, מ-1979. על המסך: COPYRIGHT ADAMS 1979, והמרה לצבע של Roger Schrag.",
          "מתעוררים במיטה זרה, אחר הצהריים, בארץ של רוזן מסתורי."
        ],
        "en": [
          "Scott Adams' fifth adventure, from 1979. The screen says COPYRIGHT ADAMS 1979, with the colour conversion by Roger Schrag.",
          "Wake up in a strange bed, in the afternoon, in the land of a mysterious Count."
        ]
      },
      "icon": [
        0,
        0,
        256
      ]
    },
    "blockdown": {
      "slug": "blockdown",
      "drawer": "community",
      "year": "2021",
      "tag": [
        "קוביות",
        "blocks"
      ],
      "players": [
        "1–2 שחקנים",
        "1–2 players"
      ],
      "load": [
        "כדקה",
        "about a minute"
      ],
      "about": {
        "he": [
          "Ciaran Anscomb, שכתב את XRoar (האמולטור שעליו המכונה שלנו רצה), כתב גם את המשחק הזה ל-Dragon ב-2021.",
          "קוביות נופלות: משלימים שורות. אפשר לשחק לבד או שניים."
        ],
        "en": [
          "Ciaran Anscomb, who wrote XRoar (the emulator our machine runs on), also wrote this game for the Dragon in 2021.",
          "Falling blocks: complete the lines. Play alone or with a friend."
        ]
      },
      "icon": [
        92,
        40,
        48
      ]
    },
    "dragontet": {
      "slug": "dragontet",
      "drawer": "community",
      "year": "2025",
      "tag": [
        "קוביות",
        "blocks"
      ],
      "players": [
        "1–2 שחקנים",
        "1–2 players"
      ],
      "load": [
        "כדקה וחצי",
        "about a minute and a half"
      ],
      "about": {
        "he": [
          "Salva Kantero כתב אותו ב-2025, בשפת C, בקוד פתוח (GPL v3).",
          "קוביות נופלות: משלימים שורות. לשחקן אחד או לשניים."
        ],
        "en": [
          "Salva Kantero wrote it in 2025, in C, as open source (GPL v3).",
          "Falling blocks: complete the lines. 1 or 2 players."
        ]
      },
      "icon": [
        60,
        12,
        64
      ]
    },
    "eggs": {
      "slug": "dragon-eggs",
      "drawer": "ours",
      "group": "mc",
      "year": "2026",
      "tag": [
        "פעולה",
        "action"
      ],
      "players": [
        "שחקן אחד",
        "1 player"
      ],
      "load": [
        "כחצי דקה",
        "about half a minute"
      ],
      "about": {
        "he": [
          "המשחק הראשון שכתבנו בשפת מכונה למכונה הזאת, ב-2026. הקוד פתוח, ב-GitHub.",
          "הדרקון מטיל ביצים, ואתם תופסים אותן בסל."
        ],
        "en": [
          "The first game we wrote in machine code for this machine, in 2026. The code is open, on GitHub.",
          "The dragon lays eggs, and you catch them in a basket."
        ]
      },
      "icon": [
        116,
        0,
        48
      ]
    },
    "guess": {
      "slug": "guess-the-number",
      "drawer": "ours",
      "group": "basic",
      "year": "2026",
      "tag": [
        "BASIC",
        "BASIC"
      ],
      "players": [
        "שחקן אחד",
        "1 player"
      ],
      "load": [
        "שניות",
        "seconds"
      ],
      "about": {
        "he": [
          "המחשב חושב על מספר בין 1 ל-100, ואתם מנחשים. אחרי כל ניחוש הוא אומר גבוה יותר או נמוך יותר.",
          "11 שורות של BASIC. אחרי שמשחקים, LIST מראה את כל הקוד."
        ],
        "en": [
          "The computer thinks of a number from 1 to 100, and you guess. After each guess it says higher or lower.",
          "11 lines of BASIC. After playing, LIST shows the whole program."
        ]
      },
      "icon": [
        0,
        0,
        256
      ]
    },
    "lander": {
      "slug": "moon-lander",
      "drawer": "ours",
      "group": "basic",
      "year": "2026",
      "tag": [
        "BASIC",
        "BASIC"
      ],
      "players": [
        "שחקן אחד",
        "1 player"
      ],
      "load": [
        "שניות",
        "seconds"
      ],
      "about": {
        "he": [
          "נוחתים על הירח: בכל תור מחליטים כמה דלק לשרוף, ומנסים לנחות במהירות קטנה מ-5.",
          "18 שורות של BASIC."
        ],
        "en": [
          "Land on the Moon: each turn you decide how much fuel to burn, and try to touch down at a speed under 5.",
          "18 lines of BASIC."
        ]
      },
      "icon": [
        0,
        0,
        256
      ]
    },
    "quiz": {
      "slug": "maths-quiz",
      "drawer": "ours",
      "group": "basic",
      "year": "2026",
      "tag": [
        "BASIC",
        "BASIC"
      ],
      "players": [
        "שחקן אחד",
        "1 player"
      ],
      "load": [
        "שניות",
        "seconds"
      ],
      "about": {
        "he": [
          "עשר שאלות חיבור וחיסור, ובסוף הציון.",
          "14 שורות של BASIC."
        ],
        "en": [
          "Ten addition and subtraction questions, and your score at the end.",
          "14 lines of BASIC."
        ]
      },
      "icon": [
        0,
        0,
        256
      ]
    },
    "rps": {
      "slug": "rock-paper-scissors",
      "drawer": "ours",
      "group": "basic",
      "year": "2026",
      "tag": [
        "BASIC",
        "BASIC"
      ],
      "players": [
        "שחקן אחד",
        "1 player"
      ],
      "load": [
        "שניות",
        "seconds"
      ],
      "about": {
        "he": [
          "אבן, נייר, מספריים נגד המחשב. מי שמגיע ראשון ל-3 ניצחונות.",
          "19 שורות של BASIC."
        ],
        "en": [
          "Rock, paper, scissors against the computer. First to 3 wins.",
          "19 lines of BASIC."
        ]
      },
      "icon": [
        0,
        0,
        256
      ]
    },
    "cave": {
      "slug": "dragon-cave",
      "drawer": "ours",
      "group": "basic",
      "year": "2026",
      "tag": [
        "BASIC",
        "BASIC"
      ],
      "players": [
        "שחקן אחד",
        "1 player"
      ],
      "load": [
        "שניות",
        "seconds"
      ],
      "about": {
        "he": [
          "הרפתקה קטנה: מערה חשוכה, עשן יוצא ממנה, ואתם בוחרים מה לעשות.",
          "31 שורות של BASIC."
        ],
        "en": [
          "A little adventure: a dark cave with smoke coming out, and you choose what to do.",
          "31 lines of BASIC."
        ]
      },
      "icon": [
        0,
        0,
        256
      ]
    },
    "draw": {
      "slug": "screen-drawing",
      "drawer": "ours",
      "group": "basic",
      "year": "2026",
      "tag": [
        "BASIC",
        "BASIC"
      ],
      "players": [
        "",
        ""
      ],
      "load": [
        "שניות",
        "seconds"
      ],
      "about": {
        "he": [
          "ציור בצבעים על מסך הגרפיקה: שמש, שמיים ועוד, עם PMODE, CIRCLE ו-LINE.",
          "21 שורות של BASIC. משנים מספר, ורואים מה משתנה בציור."
        ],
        "en": [
          "A colour drawing on the graphics screen: a sun, the sky and more, with PMODE, CIRCLE and LINE.",
          "21 lines of BASIC. Change a number and see what changes in the picture."
        ]
      },
      "icon": [
        0,
        0,
        256
      ]
    },
    "derby": {
      "slug": "horse-race",
      "drawer": "ours",
      "group": "basic",
      "year": "2026",
      "tag": [
        "BASIC",
        "BASIC"
      ],
      "players": [
        "שחקן אחד",
        "1 player"
      ],
      "load": [
        "שניות",
        "seconds"
      ],
      "about": {
        "he": [
          "מהמרים על אחד משלושה סוסים, ורואים את המרוץ על המסך.",
          "18 שורות של BASIC."
        ],
        "en": [
          "Bet on one of three horses, and watch the race on the screen.",
          "18 lines of BASIC."
        ]
      },
      "icon": [
        0,
        0,
        256
      ]
    },
    "alcatraz": {
      "slug": "alcatraz-ii",
      "drawer": "hughey",
      "year": "1982",
      "tag": [
        "בריחה מהכלא",
        "prison escape"
      ],
      "players": [
        "שחקן אחד",
        "1 player"
      ],
      "load": [
        "כדקה",
        "about a minute"
      ],
      "about": {
        "he": [
          "Mike Hughey כתב אותו ל-Color Computer, ו-Spectral Associates הוציאה אותו. Microdeal הוציאה אותו ל-Dragon.",
          "הוא כתוב ב-BASIC, ובצד השני של הקלטת יש תוכנית הוראות משלו, שמוצגת כמכתב מאסיר אחר: \"אף אחד עוד לא הגיע לחופש מהכלא הזה\"."
        ],
        "en": [
          "Mike Hughey wrote it for the Color Computer, and Spectral Associates published it. Microdeal brought it out for the Dragon.",
          "It is written in BASIC, and the other side of the tape has its own instructions program, told as a letter from a fellow inmate: \"no one has ever actually reached freedom from this prison\"."
        ]
      },
      "icon": [
        128,
        0,
        64
      ]
    },
    "cricket": {
      "slug": "tim-loves-cricket",
      "drawer": "more",
      "year": "1984",
      "tag": [
        "ספורט",
        "sport"
      ],
      "players": [
        "שחקן אחד או שניים",
        "1 or 2 players"
      ],
      "load": [
        "כשלוש דקות, ועוד כמה דקות הכנה",
        "about three minutes, then a few minutes of preparing"
      ],
      "about": {
        "he": [
          "Tim Love כתב אותו, ו-Peaksoft הוציאה אותו ב-1984. הוא היה מהנמכרים של ה-Dragon: במרץ 1985 הוא היה במקום 3 במצעד של חנות Microbyte.",
          "משחק של 40 אוברים בין שתי קבוצות, מקבוצת כפר ועד משחק מבחן, עם הגשה, חבטה ושדה בג'ויסטיק, ובאנימציה. אפשר גם לבחור קבוצות משלכם."
        ],
        "en": [
          "Tim Love wrote it, and Peaksoft published it in 1984. It sold well on the Dragon: in March 1985 it was number 3 in the Microbyte shop chart.",
          "A 40-over match between two teams, from village green to test match, with bowling, batting and fielding by joystick, in animation. You can also pick your own teams."
        ]
      },
      "icon": [
        0,
        96,
        96
      ]
    },
    "tangle": {
      "slug": "tanglewood",
      "drawer": "more",
      "year": "1986",
      "tag": [
        "הרפתקה",
        "adventure"
      ],
      "players": [
        "שחקן אחד",
        "1 player"
      ],
      "load": [
        "כשתי דקות וחצי",
        "about two and a half minutes"
      ],
      "about": {
        "he": [
          "Ian Murray-Watson כתב אותו, עם גרפיקה של Pete Lyon, ו-Microdeal הוציאה אותו ל-Dragon ול-Tandy. אחר כך יצא גם ל-Amiga ול-Atari ST.",
          "ב-2018 Murray-Watson, ‏Lyon ומייסד Microdeal, ‏John Symes, שחררו אותו כקוד פתוח ברישיון MIT, ולכן הוא כאן."
        ],
        "en": [
          "Ian Murray-Watson wrote it, with graphics by Pete Lyon, and Microdeal published it for the Dragon and the Tandy. It later came out for the Amiga and the Atari ST too.",
          "In 2018 Murray-Watson, Lyon and Microdeal's founder John Symes released it as open source under the MIT licence, which is why it is here."
        ]
      },
      "icon": [
        0,
        36,
        32
      ]
    }
  }
};
