# שלב 0: נקודת הפתיחה של המכונה הנוכחית מול רשימת הבדיקות

> **20.10.2026, שיחת Dragon.** על מכונת ה-Dragon הנוכחית (ה-BASIC שלנו, ענף main) הורצו 74 הבדיקות מ-`DRAGON-TESTS-BASIC.md` שהתוצאה שלהן ידועה מהספרים.
> **מה נבדק:** רק גוף הפלט. התאמה מלאה של המסך, תו אחרי תו, תיבדק מול מחשב אמיתי.

**התוצאה: 66 עוברות ו-8 נכשלות, מתוך 74.**

## נכשלות

- **L-RUN-01:** `RUN 20` מתחיל מההתחלה
- **L-FLOW-04:** `GO TO` עם רווח: `?SN`
- **L-FLOW-05:** `GO SUB` עם רווח: `?SN`
- **L-F-HEX:** `HEX$` חסר (`?BS`)
- **L-OP-03:** `^` חסר (`?SN`)
- **L-NPARSE-01:** `&H` חסר (`?SN`)
- **L-NPARSE-02:** `&O` חסר (`?SN`)
- **L-ERR-DN:** `PRINT #-3` נותן `?SN` במקום `?DN`

## עוברות

L-FOR-01, L-GO-01, L-REM-01, L-APOS-01, L-ELSE-01, L-IF-01, L-PRINT-01, L-ON-01, L-END-01, L-NEXT-01, L-DIM-01, L-READ-01, L-LET-01, L-RESTORE-01, L-RETURN-01, L-DEF-01, L-FLOW-01, L-FLOW-02, L-FLOW-06, L-FLOW-07, L-FLOW-09, L-FLOW-10, L-FLOW-13, L-F-SGN, L-F-INT, L-F-ABS, L-F-LEN, L-F-VAL, L-F-ASC, L-F-CHR, L-F-FIX, L-F-LEFT, L-F-RIGHT, L-F-MID, L-F-INSTR, L-F-STRING, L-OP-01, L-OP-02, L-OP-06, L-OP-07, L-OP-12, L-OP-13, L-NPARSE-03, L-STR-01, L-STR-02, L-STR-03, L-STR-06, L-STR-07, L-VAR-01, L-VAR-02, L-VAR-03, L-VAR-05, L-ERR-NF, L-ERR-SN, L-ERR-RG, L-ERR-OD, L-ERR-FC, L-ERR-OV, L-ERR-UL, L-ERR-BS, L-ERR-DD, L-ERR-DIV0, L-ERR-TM, L-ERR-LS, L-ERR-CN, L-ERR-UF

**הערה:** כל הכישלונות כבר מופיעים ברשימת החסרים של המצאי (`DRAGON-RESEARCH-INVENTORY.md`). הכלי שהריץ את הבדיקות נמצא ב-`archive/rom-v1/tools/` (ה-ROM הראשון, בארכיון) (ראו בהמשך).
