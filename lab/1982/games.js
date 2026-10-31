// קטלוג המשחקים של ארון הקלטות (גונן, 27.10: "מחסנית רזה, ממוינת לקטגוריות, וכשבוחרים משחק נפתח דף משחק").
// מגירות לפי סדר כרונולוגי, ובכל מגירה המשחקים לפי השנה. לכל משחק כתובת משלו: /lab/1982/<slug>/ (וגם /en/...).
// הקובץ הוא JSON אחרי השורה הראשונה של הקוד, כדי ש-tools/lab/games-pages.mjs יקרא אותו בלי דפדפן.
window.D32_GAMES = {
  "drawers": [
    {
      "key": "adams",
      "he": "ההרפתקאות של Scott Adams",
      "en": "Scott Adams' adventures",
      "years": "1979–84",
      "note": [
        "Scott Adams הביא את הרפתקאות המילים למחשבים הביתיים. הקלטות האלה הן גרסת ה-Color Computer, ש-Roger Schrag העביר לצבע, והיא רצה גם על ה-Dragon. כאן באישורו.",
        "Scott Adams brought text adventures to home computers. These tapes are the Color Computer versions, converted to colour by Roger Schrag, which also ran on the Dragon. Here with his permission."
      ],
      "link": "https://www.msadams.com/",
      "quote": {
        "text": "Greetings to all those Dragon Players out there, whether you are trying the games for the very first time or just rediscovering them I hope you have a tremendous amount of fun playing them. I know I did in writing them! G-D bless!",
        "sign": "Scott Adams, 10/28/2026, Platteville Wisconsin USA",
        "he": "ברכות לכל שחקני ה-Dragon שם בחוץ, בין אם אתם מנסים את המשחקים בפעם הראשונה ובין אם אתם מגלים אותם מחדש. אני מקווה שתיהנו מהם מאוד. אני יודע שאני נהניתי לכתוב אותם! ה׳ יברך!"
      },
      "fold": 5
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
      "key": "harry",
      "he": "המשחקים של Harry Whitehouse",
      "en": "Harry Whitehouse's games",
      "years": "1983",
      "note": [
        "Harry Whitehouse הקים את Peaksoft, וכתב לה את המשחקים שהיו הלהיטים הגדולים שלה ל-Dragon. כאן ברשותו.",
        "Harry Whitehouse founded Peaksoft and wrote the games that were its biggest Dragon hits. Here with his permission."
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
      "key": "coco",
      "he": "משחקים של ה-CoCo שרצו על ה-Dragon",
      "en": "CoCo games that ran on the Dragon",
      "years": "1982–87",
      "note": [
        "ה-Dragon וה-Tandy CoCo האמריקאי נבנו כמעט מאותם שבבים, עם אותו חריץ מחסניות ואותו BASIC כמעט. הרבה מחסניות וקלטות של ה-CoCo עבדו גם על ה-Dragon, ובעלי Dragon השתמשו בהן. המשחקים כאן לא נכתבו ל-Dragon, אבל רצים עליו בלי שינוי.",
        "The Dragon and the American Tandy CoCo were built from almost the same chips, with the same cartridge slot and almost the same BASIC. Many CoCo cartridges and tapes also worked on the Dragon, and Dragon owners used them. The games here were not written for the Dragon, but run on it unchanged."
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
      ],
      "cover": {
        "src": "/lab/1982/covers/escape.jpg",
        "credit": [
          "העטיפה המקורית של Microdeal. סריקה:",
          "The original Microdeal cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Escape"
      }
    },
    "invrev": {
      "slug": "invaders-revenge",
      "drawer": "period",
      "year": "1982",
      "tag": [
        "יריות",
        "shooter"
      ],
      "players": [
        "שחקן אחד או שניים",
        "1 or 2 players"
      ],
      "load": [
        "כדקה",
        "about a minute"
      ],
      "about": {
        "he": [
          "Ken Kalish כתב אותו, ו-Med Systems מצפון קרוליינה הוציאה אותו ב-1982, אותה חברה שהוציאה אחר כך את Phantom Slayer. ל-Dragon הוציאה אותו Microdeal בבריטניה, ועל העטיפה כתוב \"by K. KALISH\".",
          "הרעיון: Space Invaders הפוך. כל הפולשים כבר הושמדו, ואתם האחרון שנשאר. יורדים אל מתחת לקו ונלחמים בספינות של בני האדם, ונזהרים מבסיס הלייזר שהשמיד את כל החברים שלכם."
        ],
        "en": [
          "Ken Kalish wrote it, and Med Systems of North Carolina published it in 1982, the same company that later published Phantom Slayer. Microdeal brought it out for the Dragon in Britain, and the cover says \"by K. KALISH\".",
          "The idea: Space Invaders turned around. All the invaders have been wiped out, and you are the last one left. You drop below the line and fight the human ships, and keep away from the laser base that destroyed all your companions."
        ]
      },
      "icon": [
        152,
        64,
        48
      ],
      "cover": {
        "src": "/lab/1982/covers/invrev.jpg",
        "credit": [
          "העטיפה המקורית של Microdeal. סריקה:",
          "The original Microdeal cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Invaders_Revenge"
      }
    },
    "diablero": {
      "slug": "el-diablero",
      "drawer": "period",
      "year": "1982",
      "tag": [
        "הרפתקת טקסט",
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
          "Ken Kalish כתב אותו, ו-Computerware הוציאה אותו ב-1982. ל-Dragon הוציאה אותו Dragon Data עצמה, החברה שבנתה את המחשב.",
          "בראיון אצל L. Curtis Boyle סיפר Kalish שכתב אותו אחרי שקרא את הספרים של קרלוס קסטנדה. אין בו גרפיקה: רק מילים, כמו ההרפתקאות של Scott Adams."
        ],
        "en": [
          "Ken Kalish wrote it, and Computerware published it in 1982. For the Dragon it came out from Dragon Data itself, the company that built the computer.",
          "In his interview with L. Curtis Boyle, Kalish said he wrote it after reading Carlos Castaneda's books. There are no graphics: just words, like Scott Adams's adventures."
        ]
      },
      "icon": [
        8,
        8,
        64
      ],
      "cover": {
        "src": "/lab/1982/covers/diablero.jpg",
        "credit": [
          "העטיפה המקורית מ-1983. סריקה:",
          "The original 1983 cover. Scan:"
        ],
        "from": [
          "ארכיון Dragon Data",
          "Dragon Data Archive"
        ],
        "link": "http://dragondata.co.uk/Software/artwork/index.html"
      }
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
      ],
      "cover": {
        "src": "/lab/1982/covers/phantom.jpg",
        "credit": [
          "העטיפה המקורית של Microdeal. סריקה:",
          "The original Microdeal cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Phantom_Slayer"
      }
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
      ],
      "cover": {
        "src": "/lab/1982/covers/ranger.jpg",
        "credit": [
          "העטיפה המקורית של Microdeal. סריקה:",
          "The original Microdeal cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Danger_Ranger"
      }
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
      ],
      "cover": {
        "src": "/lab/1982/covers/cuthbert.jpg",
        "credit": [
          "העטיפה המקורית של Microdeal. סריקה:",
          "The original Microdeal cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/"
      }
    },
    "devil": {
      "slug": "devil-assault",
      "drawer": "period",
      "year": "1983",
      "tag": [
        "יריות",
        "shooter"
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
          "Ken Kalish כתב אותו, ו-Tom Mix Software ממישיגן הוציאה אותו ב-1983. ל-Dragon הוציאה אותו Microdeal, ועל העטיפה השם שלו בראש: \"KEN KALISH'S Devil Assault\".",
          "טנק בתחתית המסך נלחם בשלושה מסכים: עטלפי ערפד שמפציצים, רובוטים מטורפים שצועדים למטה ו-Sproings שקופצים. ברמות הגבוהות מגיע השטן עצמו. \"In true Ken Kalish style\", כתוב על העטיפה."
        ],
        "en": [
          "Ken Kalish wrote it, and Tom Mix Software of Michigan published it in 1983. Microdeal brought it out for the Dragon, with his name at the top of the cover: \"KEN KALISH'S Devil Assault\".",
          "A tank at the bottom of the screen fights through three screens: bombing vampire bats, crazed robots marching down, and bouncing Sproings. On the higher levels the Devil himself turns up. \"In true Ken Kalish style\", says the cover."
        ]
      },
      "icon": [
        96,
        60,
        48
      ],
      "cover": {
        "src": "/lab/1982/covers/devil.jpg",
        "credit": [
          "העטיפה המקורית של Microdeal. סריקה:",
          "The original Microdeal cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Devil_Assault"
      }
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
      ],
      "cover": {
        "src": "/lab/1982/covers/dungeon.jpg",
        "credit": [
          "העטיפה המקורית של Microdeal. סריקה:",
          "The original Microdeal cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/"
      }
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
      ],
      "cover": {
        "src": "/lab/1982/covers/athletyx.jpg",
        "credit": [
          "העטיפה המקורית של Microdeal. סריקה:",
          "The original Microdeal cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Athletyx"
      }
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
      ],
      "cover": {
        "src": "/lab/1982/covers/grabber.jpg",
        "credit": [
          "העטיפה המקורית של Microdeal. סריקה:",
          "The original Microdeal cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Grabber"
      }
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
      ],
      "cover": {
        "src": "/lab/1982/covers/draconian.jpg",
        "credit": [
          "העטיפה המקורית של Microdeal. סריקה:",
          "The original Microdeal cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Draconian"
      }
    },
    "adventureland": {
      "slug": "adventureland",
      "drawer": "adams",
      "year": "1979",
      "num": 1,
      "theme": [
        "יער קסום",
        "enchanted forest"
      ],
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
      ],
      "cover": {
        "src": "/lab/1982/covers/adventureland.jpg",
        "credit": [
          "העטיפה המקורית של Adventure International. סריקה:",
          "The original Adventure International cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Adventureland"
      }
    },
    "pirate": {
      "slug": "pirate-adventure",
      "drawer": "adams",
      "year": "1979",
      "num": 2,
      "theme": [
        "פיראטים",
        "pirates"
      ],
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
      ],
      "cover": {
        "src": "/lab/1982/covers/pirate.jpg",
        "credit": [
          "העטיפה המקורית של Adventure International. סריקה:",
          "The original Adventure International cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Pirate_Adventure"
      }
    },
    "mission": {
      "slug": "secret-mission",
      "drawer": "adams",
      "year": "1979",
      "num": 3,
      "theme": [
        "ריגול",
        "spy"
      ],
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
      ],
      "cover": {
        "src": "/lab/1982/covers/mission.jpg",
        "credit": [
          "העטיפה המקורית של Adventure International. סריקה:",
          "The original Adventure International cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Secret_Mission"
      }
    },
    "voodoo": {
      "slug": "voodoo-castle",
      "drawer": "adams",
      "year": "1979",
      "num": 4,
      "theme": [
        "קללת וודו",
        "voodoo curse"
      ],
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
      ],
      "cover": {
        "src": "/lab/1982/covers/voodoo.jpg",
        "credit": [
          "העטיפה המקורית של Adventure International. סריקה:",
          "The original Adventure International cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Voodoo_Castle"
      }
    },
    "count": {
      "slug": "the-count",
      "drawer": "adams",
      "year": "1979",
      "num": 5,
      "theme": [
        "ערפד",
        "vampire"
      ],
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
    "odyssey": {
      "slug": "strange-odyssey",
      "drawer": "adams",
      "year": "1979",
      "num": 6,
      "theme": [
        "חלל",
        "space"
      ],
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
          "ההרפתקה השישית של Scott Adams, מ-1979. על המסך: ADVENTURE #6, ‏COPYRIGHT ADAMS 1979, והמרה לצבע של Roger Schrag.",
          "מתחילים בחללית קטנה של אדם אחד, שנחתה על אסטרואיד רחוק. בחוץ מחכים שרידים של ציוויליזציה עתיקה."
        ],
        "en": [
          "Scott Adams' sixth adventure, from 1979. The screen says ADVENTURE #6, COPYRIGHT ADAMS 1979, with the colour conversion by Roger Schrag.",
          "You start in a one-man scout ship, landed on a distant asteroid. Outside wait the remains of an ancient civilisation."
        ]
      },
      "icon": [
        0,
        0,
        256
      ],
      "cover": {
        "src": "/lab/1982/covers/odyssey.jpg",
        "credit": [
          "העטיפה המקורית של Adventure International. סריקה:",
          "The original Adventure International cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Strange_Odyssey"
      }
    },
    "funhouse": {
      "slug": "mystery-fun-house",
      "drawer": "adams",
      "year": "1979",
      "num": 7,
      "theme": [
        "לונה פארק",
        "funfair"
      ],
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
          "ההרפתקה השביעית של Scott Adams, מ-1979. על המסך: ADVENTURE #7, ‏COPYRIGHT ADAMS 1979, והמרה לצבע של Roger Schrag.",
          "עומדים מול בית שעשועים בלונה פארק, עם נעליים, שעון ומסטיק יבש בכיס. בפנים: מראות, מבוכים והפתעות."
        ],
        "en": [
          "Scott Adams' seventh adventure, from 1979. The screen says ADVENTURE #7, COPYRIGHT ADAMS 1979, with the colour conversion by Roger Schrag.",
          "You stand in front of a fun house at a fairground, with shoes, a watch and some dry chewing gum. Inside: mirrors, mazes and surprises."
        ]
      },
      "icon": [
        0,
        0,
        256
      ]
    },
    "pyramid": {
      "slug": "pyramid-of-doom",
      "drawer": "adams",
      "year": "1979",
      "num": 8,
      "theme": [
        "מצרים",
        "Egypt"
      ],
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
          "ההרפתקה השמינית בסדרה, מ-1979. על המסך: BY ALVIN FILES & SCOTT ADAMS, ‏COPYRIGHT ADAMS 1979, והמרה לצבע של Roger Schrag.",
          "מתחילים במדבר, עם מימייה ריקה ופנס כבוי. מוט עץ בולט מהחול, ומתחתיו פירמידה מלאה אוצרות ומלכודות."
        ],
        "en": [
          "The eighth adventure in the series, from 1979. The screen says BY ALVIN FILES & SCOTT ADAMS, COPYRIGHT ADAMS 1979, with the colour conversion by Roger Schrag.",
          "You start in a desert with an empty canteen and an unlit flashlight. A wooden pole sticks out of the sand, and below lies a pyramid full of treasure and traps."
        ]
      },
      "icon": [
        0,
        0,
        256
      ],
      "cover": {
        "src": "/lab/1982/covers/pyramid.jpg",
        "credit": [
          "העטיפה המקורית של Adventure International. סריקה:",
          "The original Adventure International cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Pyramid_of_Doom"
      }
    },
    "ghost": {
      "slug": "ghost-town",
      "drawer": "adams",
      "year": "1980",
      "num": 9,
      "theme": [
        "מערב פרוע",
        "Wild West"
      ],
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
          "ההרפתקה התשיעית של Scott Adams, מ-1980. על המסך: ADVENTURE #9, והמרה לצבע של Roger Schrag.",
          "מתחילים ברחוב של עיירת רפאים במערב הפרוע: מספרה, בית כלא ובתים נטושים. האוצרות מחכים למי שיעז להיכנס."
        ],
        "en": [
          "Scott Adams' ninth adventure, from 1980. The screen says ADVENTURE #9, with the colour conversion by Roger Schrag.",
          "You start on the street of a Wild West ghost town: a barber shop, a jail and empty houses. The treasures wait for whoever dares to go in."
        ]
      },
      "icon": [
        0,
        0,
        256
      ],
      "cover": {
        "src": "/lab/1982/covers/ghost.jpg",
        "credit": [
          "העטיפה המקורית של Adventure International. סריקה:",
          "The original Adventure International cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Ghost_Town"
      }
    },
    "savage1": {
      "slug": "savage-island-1",
      "drawer": "adams",
      "year": "1981",
      "num": 10,
      "theme": [
        "אי פראי",
        "savage island"
      ],
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
          "ההרפתקה העשירית של Scott Adams, מ-1981, החלק הראשון מתוך שניים. על המסך: ADVENTURE #10, והמרה לצבע של Roger Schrag.",
          "מתחילים על חוף של אי פראי, ליד ראש אבן ענק וג'ונגל סבוך. סערה מתקרבת. זו הרפתקה קשה, לשחקנים מנוסים."
        ],
        "en": [
          "Scott Adams' tenth adventure, from 1981, part one of two. The screen says ADVENTURE #10, with the colour conversion by Roger Schrag.",
          "You start on the beach of a savage island, beside a huge stone head and an impenetrable jungle. A storm is coming. This one is hard, for experienced players."
        ]
      },
      "icon": [
        0,
        0,
        256
      ],
      "cover": {
        "src": "/lab/1982/covers/savage1.jpg",
        "credit": [
          "העטיפה המקורית של Adventure International. סריקה:",
          "The original Adventure International cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Savage_Island_Part_1"
      }
    },
    "savage2": {
      "slug": "savage-island-2",
      "drawer": "adams",
      "year": "1981",
      "num": 11,
      "theme": [
        "אי פראי, חלק 2",
        "savage island, part 2"
      ],
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
          "ההרפתקה ה-11 בסדרה, מ-1981, החלק השני של Savage Island. על המסך: BY SCOTT ADAMS & RUS WETMORE, והמרה לצבע של Roger Schrag.",
          "ההמשך של חלק 1. בהתחלה קול מתכתי מבקש סיסמה: מקבלים אותה בסוף חלק 1. מי שעונה לא נכון, ההרפתקה נגמרת מיד."
        ],
        "en": [
          "The 11th adventure in the series, from 1981, the second part of Savage Island. The screen says BY SCOTT ADAMS & RUS WETMORE, with the colour conversion by Roger Schrag.",
          "The sequel to part 1. At the start a metallic voice asks for a password: you get it at the end of part 1. A wrong answer ends the adventure at once."
        ]
      },
      "icon": [
        0,
        0,
        256
      ],
      "cover": {
        "src": "/lab/1982/covers/savage2.jpg",
        "credit": [
          "העטיפה המקורית של Adventure International. סריקה:",
          "The original Adventure International cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Savage_Island_Part_2"
      }
    },
    "golden": {
      "slug": "golden-voyage",
      "drawer": "adams",
      "year": "1981",
      "num": 12,
      "theme": [
        "אלף לילה ולילה",
        "Arabian Nights"
      ],
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
          "ההרפתקה ה-12 בסדרה, מ-1981. על המסך: BY WILLIAM DEMAS & SCOTT ADAMS, ‏DEDICATED: BRITISH BAND \"QUEEN\", והמרה לצבע של Roger Schrag.",
          "מתחילים בעיר פרסית, ליד סוחר. מלך זקן מחכה לסוד הנעורים, וצריך להפליג ולמצוא אותו לפני שיהיה מאוחר."
        ],
        "en": [
          "The 12th adventure in the series, from 1981. The screen says BY WILLIAM DEMAS & SCOTT ADAMS, DEDICATED: BRITISH BAND \"QUEEN\", with the colour conversion by Roger Schrag.",
          "You start in a Persian city, beside a merchant. An old king awaits the secret of youth, and you must sail out and find it before it is too late."
        ]
      },
      "icon": [
        0,
        0,
        256
      ],
      "cover": {
        "src": "/lab/1982/covers/golden.jpg",
        "credit": [
          "העטיפה המקורית של Adventure International. סריקה:",
          "The original Adventure International cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Golden_Voyage"
      }
    },
    "claymorgue": {
      "slug": "sorcerer-of-claymorgue-castle",
      "drawer": "adams",
      "year": "1984",
      "num": 13,
      "theme": [
        "כישופים",
        "spells"
      ],
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
          "ההרפתקה ה-13 של Scott Adams, מ-1984. על המסך: ADVENTURE 13 BY SCOTT ADAMS, והמרה לצבע של Roger Schrag. לפי רשימת Lysator, בגרסת ה-Dragon המקורית יש באג שאולי לא מאפשר לסיים את המשחק.",
          "אתם שוליה של קוסם, עם שישה כישופים בכיס: אש, זרע, אור ועוד. צריך למצוא 13 כוכבים בטירה של מכשף רשע."
        ],
        "en": [
          "Scott Adams' 13th adventure, from 1984. The screen says ADVENTURE 13 BY SCOTT ADAMS, with the colour conversion by Roger Schrag. According to the Lysator list, the original Dragon version has a bug that may stop you finishing the game.",
          "You are a wizard's apprentice with six spells in your pocket: fire, seed, light and more. Find the 13 stars in the castle of an evil sorcerer."
        ]
      },
      "icon": [
        0,
        0,
        256
      ],
      "cover": {
        "src": "/lab/1982/covers/claymorgue.jpg",
        "credit": [
          "העטיפה המקורית של Adventure International. סריקה:",
          "The original Adventure International cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Sorcerer_of_Claymorgue_Castle"
      }
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
      ],
      "cover": {
        "src": "/lab/1982/covers/alcatraz.jpg",
        "credit": [
          "העטיפה המקורית של Microdeal. סריקה:",
          "The original Microdeal cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Alcatraz_II"
      }
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
      ],
      "cover": {
        "src": "/lab/1982/covers/cricket.jpg",
        "credit": [
          "העטיפה המקורית של Peaksoft. סריקה:",
          "The original Peaksoft cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Tim_Love%27s_Cricket"
      }
    },
    "spores": {
      "slug": "star-spores",
      "drawer": "more",
      "year": "1984",
      "tag": [
        "יריות",
        "shooter"
      ],
      "players": [
        "שחקן אחד או שניים",
        "1 or 2 players"
      ],
      "load": [
        "כשלוש דקות",
        "about three minutes"
      ],
      "about": {
        "he": [
          "Dave Shadoff כתב אותו ל-Color Computer, ו-Spectral Associates הוציאה אותו ב-1983. ל-Dragon הוציאה אותו Microdeal ב-1984. כאן ברשותו.",
          "על העטיפה: יצורים ממערכת הכוכבים Nastira הגיעו לכדור הארץ, והמשחק \"מאמן\" אתכם להילחם בהם. לכל משפחה של יצורים יש כינוי משלה: Evil Eyes, ‏Qubes, ‏Stompers, ‏Psychlops ועוד."
        ],
        "en": [
          "Dave Shadoff wrote it for the Color Computer, and Spectral Associates published it in 1983. Microdeal brought it out for the Dragon in 1984. Here with his permission.",
          "From the cover: creatures from the star system Nastira have reached Earth, and the game \"trains\" you to fight them. Each family of creatures has its own nickname: Evil Eyes, Qubes, Stompers, Psychlops and more."
        ]
      },
      "icon": [
        120,
        24,
        64
      ],
      "cover": {
        "src": "/lab/1982/covers/spores.jpg",
        "credit": [
          "העטיפה המקורית של Microdeal. סריקה:",
          "The original Microdeal cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Star_Spores"
      }
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
    },
    "digit": {
      "slug": "dig-it",
      "drawer": "more",
      "year": "1986",
      "tag": [
        "חפירה ויהלומים",
        "digging and diamonds"
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
          "Rolf Michelsen כתב אותו ב-1986 ל-Dragon בשם Dig-It, אחרי ששיחק ב-Boulder Dash ב-Commodore 64 ורצה משהו דומה ל-Dragon. Microdeal מכרה אותו בשם Stone Raider II: היא ביקשה לשנות את השם כדי להשתמש בציורים שכבר היו לה, ולהוציא אותו מהר יותר.",
          "Michelsen פרסם את קוד המקור ברישיון BSD, ולכן הוא כאן. הקלטת נבנתה מהקוד שלו בלי שום שינוי. זו הגרסה המקורית שלו, Dig-It: הקוד של הגרסה ש-Microdeal מכרה אבד."
        ],
        "en": [
          "Rolf Michelsen wrote it for the Dragon in 1986 as Dig-It, after playing Boulder Dash on the Commodore 64 and wanting something like it on the Dragon. Microdeal sold it as Stone Raider II: it asked for the new name so it could reuse artwork it already had and get the game out sooner.",
          "Michelsen published the source code under the BSD licence, which is why it is here. The tape was built from his code without any change. This is his original version, Dig-It: the code of the version Microdeal sold has been lost."
        ]
      },
      "icon": [
        104,
        80,
        40
      ]
    },
    "daggorath": {
      "slug": "dungeons-of-daggorath",
      "drawer": "coco",
      "year": "1982",
      "tag": [
        "מבוך בתלת-ממד",
        "3D dungeon"
      ],
      "players": [
        "שחקן אחד",
        "1 player"
      ],
      "load": [
        "מיד: מחסנית",
        "instant: a cartridge"
      ],
      "about": {
        "he": [
          "DynaMicro כתבה אותו: Douglas J. Morgan, ‏Phillip C. Landmeier ו-Keith Kiyohara, עם ציורים של April Landmeier. ‏Tandy מכרה אותו ב-1982 כמחסנית למחשב ה-CoCo, לא ל-Dragon. הוא היה מהמשחקים הראשונים של מבוך בתלת-ממד בזמן אמת, ולהיט גדול.",
          "הוא כאן כי הוא רץ על ה-Dragon בלי שום שינוי, ו-Douglas J. Morgan התיר בפומבי לכל אחד להפיץ אותו, בתנאי שהמשחק נשאר כמו המקור. זו המחסנית המקורית, כמו שהיא."
        ],
        "en": [
          "DynaMicro wrote it: Douglas J. Morgan, Phillip C. Landmeier and Keith Kiyohara, with artwork by April Landmeier. Tandy sold it in 1982 as a cartridge for the CoCo, not for the Dragon. It was one of the first real-time 3D dungeon games, and a big hit.",
          "It is here because it runs on the Dragon without any change, and Douglas J. Morgan publicly allowed anyone to distribute it, on condition that the game stays as the original. This is the original cartridge, as it was."
        ]
      },
      "icon": [
        96,
        24,
        72
      ]
    },
    "snaker": {
      "slug": "snaker",
      "drawer": "coco",
      "year": "1984",
      "tag": [
        "נחש בכביש",
        "snake on a highway"
      ],
      "players": [
        "שחקן אחד",
        "1 player"
      ],
      "load": [
        "פחות מדקה",
        "under a minute"
      ],
      "about": {
        "he": [
          "Gary Ritchie כתב אותו ב-1983 בקנדה ל-Color Computer של Tandy, ושלח אותו בקלטת למגזין The Rainbow. המגזין פרסם אותו בינואר 1984, כתוכנית שהקוראים מקלידים בעצמם.",
          "הטריק שלו: המסך כולו גולל למעלה, וכך המכוניות עולות והנחש משאיר אחריו שובל, יותר ממה ש-BASIC איטי יכול היה לצייר לבד. ב-2026 הוא פרסם את הקוד ברישיון MIT, ולכן הוא כאן. זו התוכנית המקורית מהמגזין, בלי שום שינוי."
        ],
        "en": [
          "Gary Ritchie wrote it in 1983, in Canada, for Tandy's Color Computer, and mailed it on a cassette to The Rainbow magazine. The magazine printed it in January 1984, as a program readers typed in themselves.",
          "His trick: the whole screen scrolls up, so the cars rise and the snake leaves a trail, more than slow BASIC could draw on its own. In 2026 he published the code under the MIT licence, which is why it is here. This is the original program from the magazine, without any change."
        ]
      },
      "icon": [
        32,
        120,
        40
      ]
    },
    "brickout": {
      "slug": "brickout",
      "drawer": "coco",
      "year": "1987",
      "tag": [
        "שבירת לבנים",
        "brick breaker"
      ],
      "players": [
        "שחקן אחד",
        "1 player"
      ],
      "load": [
        "פחות מדקה",
        "under a minute"
      ],
      "about": {
        "he": [
          "Owen Stenseth כתב אותו בשפת מכונה ב-1987, כשהיה בן 15, ל-Color Computer 2 של Tandy, והעלה אותו ללוחות המודעות של אז כתוכנה חינמית. על המסך הוא נקרא SUPER BRICKOUT.",
          "ב-2021 הוא פרסם אותו ברישיון MIT, ולכן הוא כאן. זה הקובץ המקורי שלו מ-1987, בלי שום שינוי. המחבט זז לפי הג'ויסטיק בדיוק כמו ידית, ולכן כאן מזיזים אותו בעכבר."
        ],
        "en": [
          "Owen Stenseth wrote it in machine code in 1987, at 15, for Tandy's Color Computer 2, and uploaded it to the bulletin boards of the time as freeware. On the screen it is called SUPER BRICKOUT.",
          "In 2021 he released it under the MIT licence, which is why it is here. This is his original file from 1987, without any change. The paddle follows the joystick exactly like a paddle controller, so here you move it with the mouse."
        ]
      },
      "icon": [
        200,
        200,
        200
      ]
    },
    "champs": {
      "slug": "champions",
      "drawer": "harry",
      "year": "1983",
      "tag": [
        "ניהול כדורגל",
        "football management"
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
          "Harry Whitehouse כתב אותו, והוא היה הלהיט הגדול של Peaksoft, החברה שהקים: ל-Dragon נמכרו ממנו יותר מ-8,000 עותקים, ובכל הגרסאות כמעט 30,000.",
          "מנהלים בו את כל המועדון: קונים ומוכרים שחקנים, מתמודדים עם פציעות, הרחקות ובעיות קהל, ומשלמים משכורות. העטיפה מבטיחה \"את כל הכיף, הדרמה והתסכול של ניהול קבוצה בליגה\"."
        ],
        "en": [
          "Harry Whitehouse wrote it, and it was the big hit of Peaksoft, the company he founded: more than 8,000 copies sold for the Dragon, and almost 30,000 across all versions.",
          "You run the whole club: buy and sell players, deal with injuries, suspensions and crowd trouble, and pay the wages. The inlay promises \"all the fun, drama and frustration of managing a league club\"."
        ]
      },
      "icon": [
        72,
        0,
        72
      ],
      "cover": {
        "src": "/lab/1982/covers/champs.jpg",
        "credit": [
          "העטיפה המקורית של Peaksoft. סריקה:",
          "The original Peaksoft cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Champions"
      }
    },
    "lionht": {
      "slug": "lionheart",
      "drawer": "harry",
      "year": "1983",
      "tag": [
        "הרפתקה",
        "adventure"
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
          "Harry Whitehouse כתב אותו, ו-Peaksoft הוציאה אותו ב-1983. הוא היה המשחק השני הכי נמכר של Peaksoft ל-Dragon: יותר מ-5,500 עותקים.",
          "\"הרפתקה של אומץ ומיומנות מעברה האצילי של אנגליה\", כתוב במסך הפתיחה. ועל העטיפה ציטוט ממועדון Dragon: \"ממכר, כיף גדול ומשעבד לגמרי\"."
        ],
        "en": [
          "Harry Whitehouse wrote it, and Peaksoft published it in 1983. It was Peaksoft's second best-selling Dragon game: more than 5,500 copies.",
          "\"An adventure of courage and skill from England's noble past\", says the title screen. And the inlay quotes Dragon Club News: \"Compulsive, great fun and totally addictive\"."
        ]
      },
      "icon": [
        56,
        64,
        64
      ],
      "cover": {
        "src": "/lab/1982/covers/lionht.jpg",
        "credit": [
          "העטיפה המקורית של Peaksoft. סריקה:",
          "The original Peaksoft cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=Lionheart"
      }
    },
    "sas": {
      "slug": "sas",
      "drawer": "harry",
      "year": "1983",
      "tag": [
        "פעולה",
        "action"
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
          "Harry Whitehouse כתב אותו, ו-Peaksoft הוציאה אותו. ל-Dragon נמכרו ממנו יותר מ-4,000 עותקים.",
          "\"הדמיית אימון מסווגת\" של ה-SAS: פתיחה שמוקלדת אות אחרי אות, תדריך משימה מלא בתוך התוכנית, ושדה עם מסוקים, סיורים ומוקשים. על העטיפה: \"צליל מדהים\"."
        ],
        "en": [
          "Harry Whitehouse wrote it, and Peaksoft published it. More than 4,000 copies sold for the Dragon.",
          "A \"classified training simulation\" of the SAS: an opening typed out letter by letter, a full mission briefing inside the program, and a field with helicopters, patrols and mines. The inlay promises \"astounding sound\"."
        ]
      },
      "icon": [
        24,
        0,
        64
      ],
      "cover": {
        "src": "/lab/1982/covers/sas.jpg",
        "credit": [
          "העטיפה המקורית של Peaksoft. סריקה:",
          "The original Peaksoft cover. Scan:"
        ],
        "from": [
          "ארכיון World of Dragon",
          "World of Dragon archive"
        ],
        "link": "https://archive.worldofdragon.org/index.php?title=SAS"
      }
    }
  }
};
