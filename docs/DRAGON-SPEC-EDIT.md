# מפרט כלי העריכה (שלב 3, חלק 2) — דוח הקורא, 20.10.2026

הדוח מבוסס על קריאה בלבד; לא שיניתי קבצים ולא הרצתי ROM. **(ב)** פירושו עובדה שנמצאה במקור ⁨Dragon 64⁩ במצב ⁨32K⁩; אין בכך אימות על ⁨Dragon 32⁩. **(פתוח)** מציין פרט שעדיין דורש בדיקה. אין כאן ממצאים חדשים מסוג **(א)**, כלומר אימות מספר של ⁨Dragon 32⁩.

כתובות שמקורן בקובץ ההגדרות המשוחזר מסומנות במפורש. תבניות הפלט שלהלן הן תיאור התנהגות, לא ציטוט של קוד המקור.

## ‏1. עריכת שורה — ⁨EDIT⁩

**כניסה ושמירה**

- **(ב)** הפקודה קוראת מספר שורה ובודקת שאחריו סוף פקודה. שורה חסרה נותנת ⁨`?UL ERROR`⁩. ללא מספר, המספר הנקרא הוא **0**: אם קיימת שורה 0, עורכים אותה; אחרת מתקבלת ⁨UL⁩. מספר לא תקין או תוספת שאינה מסיימת פקודה נותנים ⁨SN⁩. [⁨ECBEXT.SA:150–161⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L150-L161), [⁨ECBBAS.SA:761–790⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L761-L790), [בדיקת סיום](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMOD.SA#L961-L964).
- **(ב)** תחילה השורה נפתחת מטוקנים לטקסט. מודפסים מספר השורה, רווח אחד וכל תוכנה; אחריהם מעבר שורה. בשורה החדשה מודפסים שוב המספר ורווח, ומיקום העריכה נמצא לפני התו הראשון בתוכן. מספר השורה עצמו אינו חלק מהטקסט הנערך. [⁨ECBEXT.SA:158–193⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L158-L193).
- **(ב)** אין בדיקה שאוסרת ⁨EDIT⁩ בתוך תוכנית, ואין עבורה שגיאת ⁨ID⁩. הפקודה יוצאת ממסלול ההרצה אל העורך; לאחר סיום העריכה חוזרים לקלט פקודות, ולא לפקודה הבאה בתוכנית. [⁨ECBEXT.SA:150–209⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L150-L209).
- **(ב)** בשמירה, הטקסט מכווץ מחדש במסלול הרגיל של הכנסת שורה ממוספרת. השורה הישנה מוחלפת, יתר התוכנית זז לפי הצורך והקישורים נבנים מחדש. תוכן ריק מוחק את השורה. גם שמירה ללא שינוי מנקה משתנים, מערכים, מחרוזות והקשר ⁨FOR/GOSUB⁩, מאתחלת את קריאת ⁨DATA⁩ ומבטלת ⁨CONT⁩. אין הדפסת ⁨OK⁩ במסלול השמירה הרגיל. [⁨ECBBAS.SA:200–237⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L200-L237), [האיפוס](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L295-L329).

**פקודות העורך**

**(ב)** ספרות לפני פקודה מצטברות למונה של בית אחד: החישוב נגלל מודולו 256. מונה חסר או תוצאה 0 פירושם חזרה אחת. הספרות ואות הפקודה אינן מהדהדות למסך. המונה משפיע רק על הפקודות שמשתמשות בו בטבלה. [⁨ECBEXT.SA:170–183⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L170-L183).

| סיווג | מקש | התנהגות |
|---|---|---|
| (ב) | רווח / ⁨`n`⁩ ורווח | מדפיס ומדלג על תו אחד או ⁨n⁩ תווים. נעצר בסוף השורה. |
| (ב) | ⁨`D` / `nD`⁩ | מוחק מהמיקום הנוכחי תו אחד או ⁨n⁩ תווים. המיקום אינו מתקדם; אין הדפסת התווים שנמחקו. |
| (ב) | ⁨`I`⁩ | נכנס להוספה לפני התו הנוכחי. כל תו נוסף מודפס והמיקום מתקדם. יתר השורה נדחק קדימה. |
| (ב) | ⁨`X`⁩ | מדפיס את יתר השורה ומתחיל הוספה בסופה. |
| (ב) | ⁨`H`⁩ | מסיר את התו הנוכחי ואת כל מה שאחריו, ומתחיל הוספה במקום זה. |
| (ב) | ⁨`L`⁩ | מדפיס את יתר השורה הערוכה; יורד שורה, מדפיס מספר ורווח ומחזיר את מיקום העריכה להתחלה. השינויים נשמרים בחוצץ. |
| (ב) | ⁨`A`⁩ | זונח את השינויים בחוצץ וטוען שוב את השורה השמורה בתוכנית, כולל תצוגת הכניסה המלאה. |
| (ב) | ⁨`E`⁩ | שומר ויוצא, בלי להדפיס תחילה את יתר השורה. |
| (ב) | ⁨ENTER⁩ | מדפיס את יתר השורה, יורד שורה, שומר ויוצא. בהוספה הוא מסיים גם את ההוספה וגם את העריכה. |
| (ב) | ⁨`S` / `nS`⁩ ואחריהם תו | מחפש את המופע הראשון או ה־⁨n⁩ של התו **אחרי המיקום הנוכחי**. מדפיס את התווים שעליהם עבר; נעצר לפני התו שנמצא. אם לא נמצא, מגיע לסוף בלי שגיאה. |
| (ב) | ⁨`C` / `nC`⁩ | קורא תו חלופי אחד או ⁨n⁩ תווים חלופיים, מחליף ומדפיס אותם. אינו מאריך שורה ונעצר בסופה. בזמן ההחלפה ⁨ENTER⁩, בריחה ו־backspace נזרקים, ואינם מסיימים אותה. |
| (ב) | ⁨`K` / `nK`⁩ ואחריהם תו | מוחק מהמיקום הנוכחי עד לפני המופע המבוקש של תו החיפוש. המופע שנמצא נשאר; בחיפוש כמה מופעים, המופעים הקודמים נמחקים. אם אין התאמה, נמחק כל ההמשך. |
| (ב) | חץ שמאלה / backspace, עם מונה אפשרי | במצב פקודות: נסוג תו אחד או ⁨n⁩ תווים, בלי למחוק אותם מהשורה שבחוצץ. אינו עובר את תחילת התוכן. |
| (ב) | backspace בזמן הוספה | נסוג ומוחק את התו שלפני המיקום הנוכחי. יכול למחוק גם תו שהיה בשורה לפני הכניסה להוספה. |
| (ב) | ⁨SHIFT+↑⁩ או בריחה | בזמן הוספה: חוזר למצב פקודות, בלי לשמור ובלי לצאת מהעורך. |
| (ב) | ⁨`Q`⁩ | פקודה נוספת שנמצאת במקור: יוצאת בלי לשמור ומגיעה ל־⁨OK⁩. |

מקורות לכל שורות הטבלה: [תנועה, סיום וטעינה מחדש — ⁨ECBEXT.SA:181–241⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L181-L241), [הוספה והחלפה — שורות ⁨243–298⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L243-L298), [נסיגה, חיפוש ומחיקה — שורות ⁨300–356⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L300-L356).

- **(ב)** **⁨K⁩ לבדה אינה פקודת “מחק עד סוף השורה”.** היא ממתינה לתו חיפוש. אם התו הבא הוא ⁨ENTER⁩, הוא נצרך כתו החיפוש; מאחר שאינו נמצא בתוכן, ההמשך נמחק, אך דרוש ⁨ENTER⁩ נוסף כדי לשמור. [⁨ECBEXT.SA:316–339⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L316-L339).
- **(ב)** העורך מקבל תווים מודפסים בטווח ⁨`$20–$7E`⁩ ושלושה תווי בקרה: ⁨ENTER⁩, בריחה ו־backspace. התו ⁨`$5F`⁩, שמתקבל מ־⁨SHIFT+↑⁩, מומר לבריחה. ⁨BREAK⁩, שקודו ⁨`$03`⁩, מסונן בעורך; הוא אינו מבטל הוספה או עריכה. פקודה לא מוכרת נזנחת בלי שגיאה. [⁨ECBEXT.SA:316–356⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L316-L356).
- **(ב)** זהו עורך שמציג את ההתקדמות באמצעות הדפסה: הוא אינו מצייר מחדש את כל השורה לאחר כל שינוי. backspace מוחק חזותית את התא שאליו נסוג הסמן, גם כאשר במצב פקודות התו נשאר בחוצץ. הסמן מהבהב בזמן ההמתנה למקש. [שגרות העורך](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L213-L339), [המתנה למקש](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMOD.SA#L375-L383), [נסיגה במסך](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBOEM.SA#L367-L376).

**אורך, שגיאות וזיכרון**

- **(ב)** פתיחת שורה מטוקנים מוגבלת ל־**249 תווי תוכן**; הרחבה מעבר לכך נחתכת בחוצץ. לכן שמירה לאחר פתיחה כזאת עלולה לאבד את ההמשך. [⁨ECBBS2.SA:185–199⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBS2.SA#L185-L199), [קבועי האורך המשוחזרים](https://github.com/davidlinsley/DragonBasic/blob/main/lwtools/ecbcom-0.sa#L221-L222).
- **(ב), מסקנה מקריאת הפעולות:** מונה אורך העריכה מאותחל ל־“אורך התוכן פחות אחד”, אך ההוספה נעצרת כשהמונה מגיע ל־249. לכן מסלול ההוספה מאפשר לכאורה **250 תווי תוכן**, ולא 249. אותו הפרש קיים אחרי ⁨H⁩. אין כאן שגיאת “שורה ארוכה”; תווים נוספים נזנחים בגבול. [אתחול המונה](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L158-L161), [⁨H⁩ והגבלת ההוספה](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L247-L298).
- **(ב)** השגיאות העיקריות הן ⁨UL⁩ לשורה חסרה, ⁨SN⁩ למספר או תחביר לא תקינים, ו־⁨OM⁩ אם אין מקום בעת הכנסת השורה הערוכה. השמירה אינה עסקה מוגנת: השורה הישנה נמחקת לפני ניסיון ההרחבה. [כניסה](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L150-L157), [מסלול ההחלפה](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L200-L235).
- **(ב)** בתי העבודה הייעודיים: ⁨`$D7`⁩ — אורך; ⁨`$D8`⁩ — דגל תצוגת פתיחה. כתובות אלה נראות בפלט האסמבלר המקורי. [⁨ECBEXT.SA.txt:160–170⁩](https://github.com/davidlinsley/DragonBasic/blob/main/listing/ECBEXT.SA.txt#L160-L170).
- **(ב; מיפוי הכתובות לפי מפרט הפרויקט וההגדרות המשוחזרות)** נוספים: חוצץ ⁨`$02DD–$03D8`⁩, מספר השורה בחוצץ ⁨`$02DA–$02DB`⁩, מספר העבודה ⁨`$2B–$2C`⁩ ומצביע הטקסט ⁨`$A6–$A7`⁩. בשמירה משתנים גם התוכנית, מצביעי האחסון ⁨`$1B–$20`⁩, גבול המחרוזות ⁨`$23–$24`⁩ ומצביע ההמשך ⁨`$2D–$2E`⁩. [מפת החוצץ בפרויקט](/Users/goneny/Projects/dragon32/docs/DRAGON-SPEC-MEMORY.md:292), [מיפוי משוחזר](https://github.com/davidlinsley/DragonBasic/blob/main/lwtools/ecbcom-0.sa#L25-L42), [פעולות האיפוס](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L295-L329).

**פתוח:** אימות חומרה של גבול 249/250 תווים, ובייחוד לאחר ⁨H⁩ בתחילת השורה; שגרת הדפסת “כל ההמשך” עצמה מוגבלת ל־249 תווים בכל הפעלה. התאמה ל־⁨Dragon 32⁩ ותמליל מסך מדויק לאחר גלילה עדיין פתוחים. [הגבלת ההדפסה](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L213-L224).

## ‏2. מחיקת שורות — ⁨DEL⁩

| סיווג | צורה | תוצאה |
|---|---|---|
| (ב) | ⁨`DEL n`⁩ | מוחקת רק את שורה ⁨n⁩ אם קיימת. |
| (ב) | ⁨`DEL n-m`⁩ | מוחקת את השורות בטווח הסגור, כולל שני הקצוות. |
| (ב) | ⁨`DEL -m`⁩ | מוחקת מתחילת התוכנית ועד ⁨m⁩, כולל. הגבול התחתון הוא 0. |
| (ב) | ⁨`DEL n-`⁩ | מוחקת מ־⁨n⁩ ועד סוף התוכנית. |
| (ב) | ⁨`DEL -`⁩ | מוחקת את כל השורות. |
| (ב) | ⁨`DEL`⁩ ללא ארגומנטים | נותנת ⁨`?FC ERROR`⁩. |

מקור לכל צורות הפקודה: [⁨ECBEXT.SA:949–999⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L949-L999).

- **(ב)** אין צורך ששורות הגבול יתקיימו. שורה בודדת חסרה, טווח שאין בו שורות, או טווח הפוך אינם נותנים ⁨UL⁩ או ⁨FC⁩; פשוט לא נמחקת שורה. גם במקרה זה מתבצע ניקוי המשתנים. [⁨ECBEXT.SA:974–999⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L974-L999).
- **(ב)** מספר לא תקין או מבנה תחבירי לא תקין נותנים ⁨SN⁩. בדיקות המספר והתחביר קודמות להזזת התוכנית; שגיאת תחביר אינה מוחקת שורות. [פענוח הפקודה](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L950-L967), [פענוח מספר](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L770-L790).
- **(ב)** מותר להפעיל מתוך תוכנית: אין בדיקת איסור. הפעולה מפסיקה את ההרצה, מנקה משתנים ומערכים, מאפסת את המחסנית ואת קריאת ⁨DATA⁩, מבטלת ⁨CONT⁩ ומגיעה ל־⁨OK⁩. גם פקודה שאחרי נקודתיים אינה ממשיכה לאחר המחיקה. [⁨ECBEXT.SA:995–999⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L995-L999), [האיפוס המשותף](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L295-L329).
- **(ב)** אין רשימה של השורות שנמחקו ואין הודעת אישור מיוחדת; מופיע ⁨OK⁩ במסלול החזרה הרגיל. [⁨ECBEXT.SA:995–999⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L995-L999), [⁨READY⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L171-L179).
- **(ב)** הזיכרון שמעל הטווח מועתק מטה, סוף התוכנית מתעדכן והקישורים מתוקנים. בית העבודה הייעודי הוא המצביע ⁨`$D3–$D4`⁩. בנוסף נוגעים במספר העבודה ⁨`$2B–$2C`⁩, במצביעי האחסון והאיפוס שתוארו בסעיף 1 ובשטח התוכנית עצמו. [פעולת ההזזה](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L984-L1015), [כתובת המצביע בפלט המקורי](https://github.com/davidlinsley/DragonBasic/blob/main/listing/ECBEXT.SA.txt#L1005-L1008).

**פתוח:** אימות ההתנהגות על ⁨Dragon 32⁩. לא בוצעה כאן מדידת כל בתי העבודה הזמניים שנכתבים בעקיפין בידי הפלט, המקלדת והפסיקות.

## ‏3. מספור מחדש — ⁨RENUM⁩

**פרמטרים וסדר העבודה**

- **(ב)** ברירות המחדל הן מספר ראשון חדש **10**, סף שורות ישנות **0**, וצעד **10**. שדה שהושמט שומר את ברירת המחדל שלו; פסיקים משמשים גם כמצייני מקום לשדות חסרים. הסף אינו חייב להיות מספר של שורה קיימת: מתחילים מהשורה הראשונה שמספרה שווה לו או גדול ממנו. [⁨ECBEXT.SA:1188–1218⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1188-L1218).
- **(ב)** סדר הפעולות בפועל הוא: **ניקוי משתנים וביטול ⁨CONT⁩; קריאת פרמטרים; בדיקת חפיפה; בדיקת כל המספרים העתידיים; טיפול בהפניות; שינוי מספרי השורות; כתיבת ההפניות המעודכנות כטקסט; איפוס מצביעים ותיקון קישורים; חזרה ל־⁨OK⁩**. לכן כישלון בבדיקת הפרמטרים משאיר את מספרי התוכנית הישנים, אך המשתנים כבר נמחקו. [⁨ECBEXT.SA:1188–1252⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1188-L1252).
- **(ב)** אין איסור על הפעלה מתוך תוכנית; הפקודה מסיימת בחזרה למצב פקודות, ולא ממשיכה בהרצה. [⁨ECBEXT.SA:1188–1252⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1188-L1252).

**אילו הפניות משתנות**

| סיווג | מקום ההפניה | האם מתעדכן |
|---|---|---|
| (ב) | ⁨GOTO⁩, לרבות ⁨GO TO⁩ | כן. |
| (ב) | ⁨GOSUB⁩, לרבות ⁨GO SUB⁩ | כן. |
| (ב) | מספר מיד אחרי ⁨THEN⁩ או ⁨ELSE⁩ | כן. |
| (ב) | רשימות ⁨ON…GOTO / ON…GOSUB⁩ | כן, כל המספרים המופרדים בפסיקים. |
| (ב) | ⁨RUN n⁩ | לא. |
| (ב) | ⁨LIST / LLIST⁩ וטווחי השורות שלהן | לא. |
| (ב) | מספר אחרי ⁨RESTORE⁩ | לא; הסריקה אינה מטפלת בו כהפניה. |
| (ב) | ⁨DEL⁩ וטווחיה, ⁨EDIT n⁩, פרמטרים של ⁨RENUM⁩ | לא. |

מקור לכל הטבלה: זיהוי ההפניות מוגבל ל־⁨THEN⁩, ⁨ELSE⁩ ולצירופי ⁨GO+TO/SUB⁩; אחריהם נבדקים מספרים ופסיקים. [⁨ECBEXT.SA:1377–1426⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1377-L1426), [המשך רשימה](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1482-L1485).

- **(ב)** סריקת ההפניות נעשית **בכל התוכנית**, גם בשורות שמספריהן אינם משתנים. לכן הפניה משורה שלפני סף המספור לשורה שמעליו מתעדכנת. [⁨ECBEXT.SA:1233–1249⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1233-L1249), [תחילת סריקת התוכנית](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1377-L1385).

**הפניות חסרות ופלט**

- **(ב)** הפניה לשורה שאינה קיימת נשארת עם המספר המקורי שלה. מודפסת הודעה בתבנית ⁨`UL x IN y`⁩, כאשר ⁨x⁩ הוא היעד החסר ו־⁨y⁩ הוא **מספרה החדש** של השורה המפנה. יש רווח יחיד בין החלקים; אין סימן שאלה ואין המילה ⁨ERROR⁩. כל הודעה מסתיימת במעבר שורה. המספור ממשיך, ובסופו מופיע ⁨OK⁩. [⁨ECBEXT.SA:1493–1553⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1493-L1553), [הדפסת מספר ומיקום](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMTH.SA#L955-L965), [מפריד המיקום](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBTAB.SA#L549-L551).
- **(ב)** ההודעה מופקת לכל הפניה חסרה שנמצאת; אין איחוד של כמה הפניות לאותו יעד. בהיעדר הפניות חסרות, אין רשימת מספור או הודעת הצלחה נוספת. [⁨ECBEXT.SA:1493–1550⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1493-L1550).

**שגיאות, מקום פנוי ושינוי הטקסט**

- **(ב)** מתקבלת ⁨FC⁩ אם הצעד הוא 0; אם המספר החדש הראשון קטן או שווה למספר השורה הגבוה ביותר שאינה ממוספרת מחדש; או אם המספור ייצור שורה מעל **63999**, לרבות גלישת חיבור. [⁨ECBEXT.SA:1211–1232⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1211-L1232), [בדיקת המספרים](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1258-L1276).
- **(ב)** יש להבחין בין מספר עתידי גדול מדי, שנותן ⁨FC⁩, לבין ארגומנט מילולי מחוץ לטווח של קורא מספרי השורות, שנותן ⁨SN⁩. גם מבנה פרמטרים לא תקין נותן ⁨SN⁩. [פענוח הפרמטרים](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1197-L1215), [קורא המספרים](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L770-L790).
- **(ב)** הפעולה זקוקה לעיתים לזיכרון נוסף: כל הפניה מוכרת מקבלת זמנית **חמישה בתים**, גם אם נכתבה בספרה אחת. התוכנית מוזזת כדי לפנות מקום. ⁨OM⁩ באמצע השלב הזה עלולה להשאיר תוכנית פגומה; אין שחזור אוטומטי של המצב הקודם. [⁨ECBEXT.SA:1102–1116⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1102-L1116), [בדיקת המקום וההזזה](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1433-L1463).
- **(ב)** בהחזרה לטקסט, המספר נכתב בספרות עשרוניות בלי רווח מקדים ובלי אפסים מובילים. רווחים **בתוך** מספר שנקרא נעלמים; רווחים לפני הספרה הראשונה ואחרי הספרה האחרונה נשמרים. שינוי האורך מזיז את המשך הטקסט, את המשך התוכנית ואת סוף התוכנית. גם הפניה חסרה עוברת נרמול זה. [גבולות הטקסט המוחלף](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1424-L1449), [כתיבת הספרות והצמצום](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1518-L1550).

**זיכרון**

- **(ב)** בתי העבודה הייעודיים: ⁨`$CF–$D0`⁩ — צעד; ⁨`$D1–$D2`⁩ — סף ישן; ⁨`$D3–$D4`⁩ — מצביע לשורה הראשונה; ⁨`$D5–$D6`⁩ — מספר חדש; ⁨`$D8`⁩ — דגל מעבר בדיקה. הכתובות מאומתות בפלט האסמבלר. [⁨ECBEXT.SA.txt:1257–1286⁩](https://github.com/davidlinsley/DragonBasic/blob/main/listing/ECBEXT.SA.txt#L1257-L1286), [דגל הבדיקה](https://github.com/davidlinsley/DragonBasic/blob/main/listing/ECBEXT.SA.txt#L1331-L1334).
- **(ב; הכתובות הנוספות לפי המיפוי המשוחזר)** נכתבים גם שטח התוכנית, מצביעי האחסון והאיפוס, ⁨`$2B–$2C`⁩, ⁨`$68–$69`⁩ — השורה הנוכחית, ⁨`$A6–$A7`⁩, מצביעי הזזה באזור ⁨`$41–$48`⁩, שטח העבודה המספרי וחוצץ המרת המספר ⁨`$03DA–$03E9`⁩. [המיפוי](https://github.com/davidlinsley/DragonBasic/blob/main/lwtools/ecbcom-0.sa#L25-L119), [פעולות ההמרה](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1424-L1550), [חוצץ המספר בפרויקט](/Users/goneny/Projects/dragon32/docs/DRAGON-SPEC-MEMORY.md:296).

**פתוח:** אימות חומרה של מצב התוכנית לאחר ⁨OM⁩ באמצע המספור ושל מקרי קצה עם טקסט חריג או תוכנית ששונתה ב־⁨POKE⁩. הדוח מתייחס למערכת הבסיסית; הרחבה יכולה לשנות את זיהוי ההפניות באמצעות נקודת ההרחבה הקיימת במקור. [נקודת ההרחבה](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1393-L1404).

## ‏4. עקיבה — ⁨TRON / TROFF⁩

- **(ב)** הפלט הוא בדיוק ⁨`[n]`⁩: מספר עשרוני בתוך סוגריים מרובעים, **ללא רווח לפני המספר, ללא רווח אחרי המספר, ללא רווח מפריד וללא מעבר שורה מטעם העקיבה**. שני סימוני עקיבה רצופים יכולים להופיע צמודים, למשל ⁨`[10][20]`⁩. פלט התוכנית עצמה יכול להופיע מיד אחרי הסוגר הסוגר. [⁨ECBBAS.SA:418–425⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L418-L425), [המרת מספר](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMTH.SA#L955-L974), [מסלול הדפסת המחרוזת](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBS2.SA#L556-L569).
- **(ב)** הסימון מודפס בכניסה לשורה ממוספרת, לפני הפקודה הראשונה בה. מעבר לפקודה אחרי נקודתיים באותה שורה אינו מדפיס אותו שוב. כניסה מחודשת לשורה דרך העברת שליטה מדפיסה סימון נוסף. אין סימון עבור פקודות ישירות. [⁨ECBBAS.SA:398–428⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L398-L428).
- **(ב)** אם העקיבה הייתה כבויה, שורה שמפעילה ⁨TRON⁩ אינה מסומנת בדיעבד. שורה שמבצעת ⁨TROFF⁩ כן מסומנת אם העקיבה הייתה פעילה בכניסה אליה. [בדיקת הדגל לפני ביצוע השורה](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L414-L428), [שינוי הדגל](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L367-L373).
- **(ב)** הדגל נמצא ב־⁨`$00AF`⁩. ⁨TRON⁩ כותבת בו ⁨`$4F`⁩; ⁨TROFF⁩ כותבת 0. בדיקת העקיבה מסתפקת בערך שאינו אפס. [הפעולה](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L367-L373), [הכתובת בפלט המקורי](https://github.com/davidlinsley/DragonBasic/blob/main/listing/ECBEXT.SA.txt#L389-L394).
- **(ב)** ⁨RUN⁩, ⁨NEW⁩ ומסלול השגיאה הרגיל **אינם מאפסים את הדגל**. גם ניקוי המשתנים אינו מכבה עקיבה. [⁨RUN⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L583-L590), [⁨NEW⁩ והאיפוס](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L288-L329), [מסלול השגיאה](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L139-L170).
- **(ב)** אין שגיאה ייעודית לפקודות האלה. תוספת שאינה סוף פקודה נבדקת במסלול הפקודה הבא ויכולה לתת ⁨SN⁩, **אחרי** שהדגל כבר השתנה. [פעולת הדגל](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L367-L373), [בדיקת המשך](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L402-L408).

**(ב)** מבחינת RAM, הפעולה הייעודית משנה רק את ⁨`$AF`⁩. בעת הדפסת עקיבה נוגעים גם בשטח ההמרה המספרית, בחוצץ הפלט, במצביע הסמן ⁨`$88–$89`⁩ ובמסך הטקסט ⁨`$0400–$05FF`⁩. [הדפסת המספר](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMTH.SA#L955-L974), [כתובות המסך והסמן](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBOEM.SA#L59-L100).

**פתוח:** אימות על ⁨Dragon 32⁩ ותמליל גלישה בקצה המסך. התבנית הלוגית והרווחים נקבעו מקריאת השגרות, ולא מצילום מחשב פועל.

## ‏5. קלט שורה — ⁨LINE INPUT⁩

**תחביר ופלט**

- **(ב)** עבור קלט מקלדת אפשר למסור משתנה מחרוזת בלבד, או מחרוזת הנחיה במירכאות ואחריה נקודה־פסיק ומשתנה המחרוזת. ההנחיה היא מחרוזת מילולית, לא ביטוי מחרוזת כללי. אחרי ההנחיה נדרש ⁨`;`⁩; פסיק אינו תחליף. [⁨ECBEXT.SA:1027–1044⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1027-L1044).
- **(ב)** מודפס רק תוכן ההנחיה. **אין סימן שאלה אוטומטי ואין רווח אוטומטי אחריה.** בלי הנחיה מתחילה המתנה לקלט במיקום המסך הנוכחי. התווים המוקלדים מהדהדים למסך; ⁨ENTER⁩ מסיים במעבר שורה. [הקריאה הישירה לקלט](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1039-L1051), [ההבדל ממסלול סימן השאלה](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L902-L905), [סיום הקלט](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMOD.SA#L564-L589).
- **(ב)** במצב ישיר מתקבלת ⁨`?ID ERROR`⁩. הבדיקה נעשית ראשונה, לפני הדפסת הנחיה ולפני קריאת הקלט. [⁨ECBEXT.SA:1027–1030⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1027-L1030), [בדיקת המצב](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L744-L749).

**התוכן שנשמר**

- **(ב)** כל תוכן השורה נשמר כמחרוזת אחת: פסיקים אינם מפרידים שדות, מירכאות נשמרות כתווים, וגם רווחים בתחילת השורה ובסופה נשמרים. נקודתיים אינם מסיימים את הקלט. שורה ריקה נותנת מחרוזת ריקה. [⁨ECBEXT.SA:1054–1061⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1054-L1061), [סיום רק בתו אפס](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L1859-L1877).
- **(ב)** קלט המקלדת מוגבל ל־**249 תווים**. לאחר מכן תווים רגילים נוספים נזנחים, בלי שגיאה ובלי הדהוד; עדיין אפשר למחוק או לסיים. הסינון הרגיל מקבל תווים מ־רווח ועד ⁨`z`⁩, נוסף למקשי העריכה המיוחדים. [⁨ECBMOD.SA:532–589⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMOD.SA#L532-L589), [קבוע האורך](https://github.com/davidlinsley/DragonBasic/blob/main/lwtools/ecbcom-0.sa#L221-L222).
- **(ב)** backspace מוחק את התו האחרון שנקלט; מקש מחיקת שורה מנקה את הקלט הנוכחי; ⁨CLEAR⁩ מנקה את המסך ומתחיל את הקלט מחדש. אין הדפסה מחדש של ההנחיה במסלולים האלה. [⁨ECBMOD.SA:530–558⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMOD.SA#L530-L558).

**⁨BREAK⁩ ושגיאות**

- **(ב)** ⁨BREAK⁩ מסיים את ההמתנה בלי לבצע השמה למשתנה. הוא עובר למסלול עצירת התוכנית ומדפיס הודעת ⁨BREAK⁩ עם מספר השורה, ואחריה ⁨OK⁩. המשתנים הקיימים אינם מנוקים. [⁨ECBBAS.SA:905–908⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L905-L908), [מסלול העצירה](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L510-L527).
- **(ב)** נשמר מיקום המשך שמאפשר ל־⁨CONT⁩ לחזור אל פקודת הקלט. הקלט החלקי אינו מוקצה למשתנה; בחידוש נדרש קלט חדש. [שמירת מיקום העצירה ו־⁨CONT⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L514-L542), [מיקום תחילת הפקודה](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L398-L404).
- **(ב)** יעד מספרי נותן ⁨`?TM ERROR`⁩, אבל **רק אחרי שהמשתמש סיים להזין את השורה**. גם איתור משתנה היעד נעשה לאחר הקלט, ולא לפניו. [⁨ECBEXT.SA:1049–1056⁩](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1049-L1056), [בדיקת סוג](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L1090-L1099).
- **(ב)** נוסף ל־⁨ID/TM⁩, תחביר הנחיה לא תקין נותן ⁨SN⁩; הקצאת המחרוזת יכולה לתת ⁨OS⁩ מחוסר שטח מחרוזות. יעד מערך עובר דרך בדיקות המשתנים והמערכים הרגילות. חריגה ממגבלת הקלט כשלעצמה אינה שגיאה. [פענוח ההנחיה והיעד](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1039-L1061), [העתקה והקצאת מחרוזת](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L1875-L1915).

**זיכרון**

- **(ב; כתובות לפי המיפוי המשוחזר ומפרט הפרויקט)** הקלט משתמש בחוצץ ⁨`$02DD–$03D8`⁩, מאפס את תו המקלדת הממתין ב־⁨`$87`⁩, ומשתמש ב־⁨`$6F`⁩ לבחירת התקן וב־⁨`$70`⁩ לדגל סוף קלט. אחרי הקליטה הוא משתמש במצביע יעד ההשמה ⁨`$3B–$3C`⁩ ובמצביע המשתנה ⁨`$39–$3A`⁩, יוצר מתאר מחרוזת ומעתיק את התוכן לשטח המחרוזות. [פעולות הקלט](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMOD.SA#L532-L571), [ההשמה](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1053-L1061), [המיפוי](https://github.com/davidlinsley/DragonBasic/blob/main/lwtools/ecbcom-0.sa#L35-L119).
- **(ב)** הפעולה אינה מנקה את כלל המשתנים. יצירת יעד חדש עשויה להרחיב את טבלת המשתנים; הקצאת המחרוזת משנה את שטח המחרוזות, ויכולה להפעיל איסוף מחרוזות. פלט ההנחיה והדהוד הקלט משנים גם את המסך והסמן. [איתור היעד והעתקה](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBEXT.SA#L1054-L1061), [הקצאת מחרוזות](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBBAS.SA#L1908-L1918).

**פתוח:** אימות על ⁨Dragon 32⁩, תמליל חומרה של ⁨BREAK→CONT⁩, ורשימה מלאה של כל בתי העזר שנכתבים בעקיפין בהקצאת יעד מערך או באיסוף מחרוזות. גרסת ⁨`LINE INPUT #`⁩ כוללת מסלולי התקן וקלט מקובץ מעבר להיקף קלט המקלדת שתואר כאן.