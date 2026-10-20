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
		lda	#',
		lbsr	synchk
		lbsr	frmevl
		lbsr	getadr
		subd	#1		; MEMSIZ = m-1 (קורא)
		lbcs	err_om		; m = 0
		cmpd	ENDMEM		; מעל ה-RAM
		lbhi	err_om
		std	,s
1		ldd	,s
		subd	2,s		; STKTOP = MEMSIZ-n
		lbcs	err_om
		pshs	d
		ldd	VARTAB		; חייב להישאר מקום מעל התוכנית (הרזרבה: קורא, משוחזרת, פתוח)
		addd	#58
		lbcs	err_om
		cmpd	,s
		lbhi	err_om
		puls	d
		std	STKTOP
		puls	d
		std	MEMSIZ
		leas	2,s
clr_go		lbsr	runc		; משתנים, מחרוזות, DATA, אין המשך
		leas	2,s		; בלי החזרה ל-gone: המחסנית מתאפסת (mit: STKINI)
		lds	STKTOP
		clr	,-s
		lbra	newstt

; ---------- PCLEAR n ----------
pclear		lbsr	frmevl
		lbsr	conint		; B = n
		tstb
		lbeq	err_fc		; 0 או מעל 8: ?FC (קורא)
		cmpb	#8
		lbhi	err_fc
		lda	#6		; n*$600: הבית הגבוה הוא n*6
		mul
		addb	SCRBAS
		tfr	b,a
		clrb			; D = בית האפס שלפני התוכנית
		cmpd	SCTOP		; אסור לדרוס את המסך הגרפי הנבחר (קורא)
		lblo	err_fc
		addd	#1
		subd	TXTTAB		; D = ההפרש
		pshs	d
		addd	VARTAB		; הסוף החדש ועוד 200 חייב להיות מתחת ל-STKTOP (קורא)
		addd	#200
		cmpd	STKTOP
		lbhs	err_fc
		; מזיזים את [TXTTAB-1, VARTAB) — כולל בית האפס
		ldx	TXTTAB
		leax	-1,x		; המקור
		ldd	,s
		leau	d,x		; היעד
		ldd	VARTAB
		subd	TXTTAB
		addd	#1		; כמה בתים
		tst	,s		; למעלה או למטה?
		bmi	3F
		leax	d,x		; למעלה: מהסוף להתחלה
		leau	d,u
		tfr	d,y
		beq	5F
2		lda	,-x
		sta	,-u
		leay	-1,y
		bne	2B
		bra	5F
3		tfr	d,y		; למטה: מההתחלה לסוף
		beq	5F
4		lda	,x+
		sta	,u+
		leay	-1,y
		bne	4B
5		puls	d		; מעדכנים את המצביעים בהפרש
		pshs	d
		addd	TXTTAB
		std	TXTTAB
		ldd	,s
		addd	VARTAB
		std	VARTAB
		ldd	CURLIN		; מתוך תוכנית: גם המקום בטקסט, כדי להמשיך (קורא)
		cmpd	#$ffff
		beq	6F
		ldd	,s
		addd	TXTPTR
		std	TXTPTR
6		leas	2,s
		lbsr	lnkprg		; הקישורים
		lbra	clr_go		; ניקוי משתנים ומחסנית (ב-Dragon: פתוח אם גם המחסנית)
