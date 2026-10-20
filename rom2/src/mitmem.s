; Dragon 1982 BASIC — שלב 2, חלק 4: זיכרון. CLEAR ו-PCLEAR.
; ב-mit יש רק CLEAR בלי מספרים (mit: CLEAR 1925, CLEARC, STKINI). השאר לפי ה-Dragon:
;   CLEAR n: STKTOP = MEMSIZ-n. CLEAR n,m: MEMSIZ = m-1, ואז STKTOP = MEMSIZ-n (קורא)
;   PCLEAR n: 1-8 דפים של 1536 בתים מ-$0600; התוכנית זזה ל-$0601+n*$600 (ספר + קורא)
; שתי הפקודות מנקות משתנים ומחסנית, וממשיכות בפקודה הבאה.

ENDMEM		equ	$74		; קורא: גבול ה-RAM, $7FFE
SCTOP		equ	$b7		; קורא: הבית שאחרי המסך הגרפי, $0C00
SCRBAS		equ	$bc		; קורא: הבית הגבוה של בסיס הדפים, $06

; ---------- CLEAR [n[,m]] ----------
clear		beq	clr_go		; בלי מספרים: רק ניקוי
		lbsr	frmevl
		lbsr	getadr		; n: 0-65535
		pshs	d
		ldd	MEMSIZ
		pshs	d		; [0] = MEMSIZ החדש, [2] = n
		jsr	<chrgot
		beq	1F
		lbsr	chkcom
		lbsr	frmevl
		lbsr	getadr
		subd	#1		; MEMSIZ = m-1 (קורא)
		bcs	mem_om		; m = 0
		cmpd	ENDMEM		; מעל ה-RAM
		bhi	mem_om
		std	,s
1		ldd	,s
		subd	2,s		; STKTOP = MEMSIZ-n
		bcs	mem_om
		std	2,s		; [2] = STKTOP החדש
		ldd	VARTAB		; חייב להישאר מקום מעל התוכנית (הרזרבה: קורא, משוחזרת, פתוח)
		addd	#58
		bcs	mem_om
		cmpd	2,s
		bhi	mem_om
		puls	d,x
		std	MEMSIZ
		stx	STKTOP
clr_go		lbsr	runc		; משתנים, מחרוזות, DATA, אין המשך
		lds	STKTOP		; בלי החזרה ל-gone: המחסנית מתאפסת (mit: STKINI)
		clr	,-s
		lbra	newstt
mem_om		lbra	err_om

; ---------- PCLEAR n ----------
pclear		lbsr	evbyte		; B = n
		decb			; 0 או מעל 8: ?FC (קורא)
		cmpb	#7
		bhi	mem_fc
		incb
		lda	#6		; n*$600: הבית הגבוה הוא n*6
		mul
		addb	SCRBAS
		tfr	b,a
		clrb			; D = בית האפס שלפני התוכנית
		cmpd	SCTOP		; אסור לדרוס את המסך הגרפי הנבחר (קורא)
		blo	mem_fc
		addd	#1
		subd	TXTTAB		; D = ההפרש
		pshs	d
		addd	VARTAB		; הסוף החדש ועוד 200 חייב להיות מתחת ל-STKTOP (קורא)
		addd	#200
		cmpd	STKTOP
		bhs	mem_fc
		; מזיזים את [TXTTAB-1, VARTAB) — כולל בית האפס
		ldx	TXTTAB
		leax	-1,x		; המקור
		ldd	,s
		leau	d,x		; היעד
		ldd	VARTAB
		subd	TXTTAB
		addd	#1		; כמה בתים (לפחות 1)
		tfr	d,y
		tst	,s		; למעלה או למטה?
		bmi	3F
		leax	d,x		; למעלה: מהסוף להתחלה
		leau	d,u
2		lda	,-x
		sta	,-u
		leay	-1,y
		bne	2B
		bra	5F
3		lda	,x+		; למטה: מההתחלה לסוף
		sta	,u+
		leay	-1,y
		bne	3B
5		ldd	,s		; מעדכנים את המצביעים בהפרש
		addd	TXTTAB
		std	TXTTAB
		ldd	,s
		addd	VARTAB
		std	VARTAB
		ldx	CURLIN		; מתוך תוכנית: גם המקום בטקסט, כדי להמשיך (קורא)
		leax	1,x		; $FFFF: שורה ישירה
		beq	6F
		ldd	,s
		addd	TXTPTR
		std	TXTPTR
6		leas	2,s
		lbsr	lnkprg		; הקישורים
		bra	clr_go		; ניקוי משתנים ומחסנית (ב-Dragon: פתוח אם גם המחסנית)
mem_fc		lbra	err_fc
