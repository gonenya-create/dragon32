**המסקנה:** תחזית ⁨RND(1)=2⁩ נשארת נכונה למקור Dragon; אבל עבור הבתים ⁨82 49 0F DA A2⁩, גם Dragon מנבא **⁨3.14159266⁩**. אלה תחזיות מקריאת המקור וחישוב מספרי, לא תוצאות ממחשב מקורי. לא שיניתי קבצים.

**א. היכן מתבצע העיגול**

כל השורות בטבלה הן **(ב)**, בענף חמשת הבתים:

| נקודה | Dragon | ⁨BASIC-M6502⁩ | מקור ושורות |
|---|---|---|---|
| חיבור וחיסור | התוצאה מתעגלת בסיום החיבור או דרך הנרמול | הבית הנוסף נשמר; אין עיגול סופי | [Dragon: ‏119–199](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMTH.SA#L119-L199), [MIT: ‏4978–5067](https://github.com/microsoft/BASIC-M6502/blob/main/m6502.asm#L4978-L5067) |
| נרמול | מסיים בעיגול, אם התוצאה אינה אפס עקב תת־זרימה | מסיים בלי עיגול | [Dragon: ‏142–199](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMTH.SA#L142-L199), [MIT: ‏5005–5067](https://github.com/microsoft/BASIC-M6502/blob/main/m6502.asm#L5005-L5067) |
| כפל | מעגל את התוצאה דרך הנרמול | משאיר תוצאה עם בית נוסף | [Dragon: ‏363–402](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMTH.SA#L363-L402), [MIT: ‏5266–5287](https://github.com/microsoft/BASIC-M6502/blob/main/m6502.asm#L5266-L5287) |
| חילוק | מעגל בסוף, דרך הנרמול; אין עיגול נפרד בכניסה | מעגל את המחלק שב־⁨FAC⁩ בכניסה; אינו מעגל את המנה בסיום | [Dragon: ‏508–578](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMTH.SA#L508-L578), [MIT: ‏5394–5461](https://github.com/microsoft/BASIC-M6502/blob/main/m6502.asm#L5394-L5461) |
| לפני ⁨INT/QINT⁩ | אין קריאת עיגול מקדימה | אותו הדבר | [Dragon: ‏780–822](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMTH.SA#L780-L822), [MIT: ‏5646–5694](https://github.com/microsoft/BASIC-M6502/blob/main/m6502.asm#L5646-L5694) |
| שמירה במשתנה | אין עיגול נוסף בשגרת השמירה | מעגל לפני השמירה | [Dragon: ‏629–651](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMTH.SA#L629-L651), [MIT: ‏5501–5529](https://github.com/microsoft/BASIC-M6502/blob/main/m6502.asm#L5501-L5529) |
| העברת ⁨FAC→ARG⁩ | אין עיגול נוסף | הכניסה הרגילה מעגלת; קיימת גם כניסה שעוקפת אותו | [Dragon: ‏673–690](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMTH.SA#L673-L690), [MIT: ‏5542–5550](https://github.com/microsoft/BASIC-M6502/blob/main/m6502.asm#L5542-L5550) |

**(ב) לכן במקרה הזרע:** הזרע הבא הוא ⁨$FFFFFFFF⁩; הבית הנוסף בנרמול הוא ⁨$2B⁩, ולכן הערך האקראי נשאר ⁨1−2⁻³²⁩. אחרי כפל ב־1 והוספת 1 מתקבל אמצע מדויק בין שני ערכים מיוצגים, והוא מתעגל ל־2 **בחיבור**, לפני ⁨INT⁩. ההסבר הקודם אינו מחייב עיגול בתוך ⁨INT⁩. [יצירת המספר: שורות 1344–1388](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMTH.SA#L1344-L1388), [עיגול החיבור: 119–199](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMTH.SA#L119-L199).

**ב. כלל העיגול והבית הנוסף**

**(ב)** במסלול הרגיל, ביט 7 בבית הנוסף קובע אם להגדיל את המנטיסה ביחידה אחת: חצי מעוגל כלפי מעלה **בערך המוחלט**, גם במספר שלילי. אין בחירה בזוגי ואין ביט דביק שמרכז את כל הביטים שאבדו. כאשר חיבור מחייב הזזה ימינה בגלל נשיאה, הביט שנושר מהמנטיסה הוא שקובע. [Dragon: ‏183–199, ‏230–257](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMTH.SA#L183-L257).

**(ב)** ב־Dragon המסלול הרגיל מאפס את הבית הנוסף; **מסלול הנשיאה של החיבור עוקף את האיפוס**, ולכן אסור להניח שהוא תמיד אפס. ב־MIT שגרת העיגול עצמה מזיזה את הבית, ואינה מאפסת אותו באופן כללי; שגרות השמירה וההעברה מאפסות אותו במפורש. [Dragon: ‏183–199](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMTH.SA#L183-L199), [MIT: ‏5508–5559](https://github.com/microsoft/BASIC-M6502/blob/main/m6502.asm#L5508-L5559).

**ג. הדפסה והמרה למחרוזת**

**(ב)** בשניהם ההגדלה וההקטנה נעשות בעיקר בכפל חוזר ב־10 או בחילוק חוזר ב־10. למספר קטן מ־1 יש תחילה כפל יחיד ב־⁨10⁹⁩. טבלת החזקות משמשת בהמשך לחילוץ ספרות באמצעות חיבור וחיסור, ולא לכפל לצורך שינוי הגודל. [Dragon: ‏967–1058, ‏1097–1144](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMTH.SA#L967-L1144), [MIT: ‏5854–5950](https://github.com/microsoft/BASIC-M6502/blob/main/m6502.asm#L5854-L5950).

**(ב)** הגבולות **המדויקים המיוצגים**, בשניהם, הם ⁨99,999,999.90625⁩ ו־⁨999,999,999.25⁩. אין להשתמש במספרים המקורבים שבהערות המקור. Dragon מגדיל עד שעוברים את הגבול התחתון, ומקטין רק כשעוברים את העליון. ב־MIT שוויון לעליון עובר ישירות להמרה לשלֵם, בלי הוספת חצי. [Dragon: ‏931–1001](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMTH.SA#L931-L1001), [MIT: ‏5826–5894](https://github.com/microsoft/BASIC-M6502/blob/main/m6502.asm#L5826-L5894).

**(ב)** ב־Dragon העיגול מתרחש בתוך פעולות החשבון שבשינוי הגודל, וגם בחיבור החצי האחרון. ב־MIT פעולות הכפל/חילוק ב־10 מתחילות בהעברה שמעגלת; החיבור האחרון של חצי אינו מעגל לפני ⁨QINT⁩. [Dragon: ‏479–505, ‏1000–1001](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMTH.SA#L479-L505), [MIT: ‏5368–5397, ‏5893–5894](https://github.com/microsoft/BASIC-M6502/blob/main/m6502.asm#L5368-L5397).

**(ב), תחזית מקור:** עבור הבתים שנתת, אחרי שבע הגדלות מתקבל בדיוק ⁨31,415,926.5546875⁩; אחרי השמינית: ⁨314,159,265.5⁩. הוספת חצי נותנת ⁨314,159,266⁩. לכן תוכן המספר המודפס הוא **⁨3.14159266⁩**, ולא ⁨3.14159265⁩. [מסלול Dragon: ‏479–489, ‏987–1058](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMTH.SA#L987-L1058).

**ד. ההבדל ב־⁨EXP⁩**

**(ב)** Dragon מכפיל ב־⁨log₂(e)⁩, מעגל כרגיל ל־32 ביט, שומר את התוצאה ורק אז מפריד לשלֵם ולשבר. אין תוספת מיוחדת לפני ההפרדה. [שורות 1271–1295](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMTH.SA#L1271-L1295).

**(ב)** MIT מוסיף **80 עשרוני** לבית הדיוק הנוסף — תוספת של ⁨5/16⁩ יחידת המנטיסה האחרונה. נשיאה ממנו מגדילה את המנטיסה; השארית נשמרת ומוחזרת בעת חישוב החלק השברי. זה אינו עיגול רגיל לפי סף 128. [שורות 6248–6279](https://github.com/microsoft/BASIC-M6502/blob/main/m6502.asm#L6248-L6279).

**ה. הבדלים נוספים שניתן לראות בתוכנית**

**(ב)** MIT גם **משתמש בבית הנוסף כקלט לכפל**, ומשמר אותו בחיבור באמצעות בית זמני; Dragon אינו עושה זאת. לכן שרשרת פעולות עשויה להשתנות גם כשלא נשמר משתנה באמצע. [Dragon: ‏100–133, ‏368–396](https://github.com/davidlinsley/DragonBasic/blob/main/src/ECBMTH.SA#L368-L396), [MIT: ‏4948–5028, ‏5275–5285](https://github.com/microsoft/BASIC-M6502/blob/main/m6502.asm#L5275-L5285).

**פתוח:** לא הוכחה כאן זהות מלאה בכל יתר מקרי הקצה של חיסור, חילוק ונרמול. תוכנית בדיקה מוצעת, במילים בלבד: לעבור על מספרים סמוכים לחזקות של 2, בשני הסימנים; לבצע חיבור, חיסור, כפל וחילוק; ולהשוות ⁨INT⁩ ישיר מול ⁨INT⁩ אחרי שמירה במשתנה, לצד חמשת בתי התוצאה. כך בודקים גם ביטול בחיסור וגם את השפעת העיגול שנדחה.