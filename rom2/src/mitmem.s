; Dragon 1982 BASIC — שלב 2, חלק 4: זיכרון. CLEAR ו-PCLEAR.
; ב-mit יש רק CLEAR בלי מספרים (mit: CLEAR 1925, CLEARC, STKINI). השאר לפי ה-Dragon:
;   CLEAR n: STKTOP = MEMSIZ-n. CLEAR n,m: MEMSIZ = m-1, ואז STKTOP = MEMSIZ-n (קורא)
;   PCLEAR n: 1-8 דפים של 1536 בתים מ-$0600; התוכנית זזה ל-$0601+n*$600 (ספר + קורא)
; שתי הפקודות מנקות משתנים ומחסנית, וממשיכות בפקודה הבאה.

ENDMEM		equ	$74		; קורא: גבול ה-RAM, $7FFE
SCTOP		equ	$b7		; קורא: הבית שאחרי המסך הגרפי, $0C00
SCRBAS		equ	$bc		; קורא: הבית הגבוה של בסיס הדפים, $06

; CLEAR עצמו (clear, clr_go) יושב בסוף mitfunc.s, כדי לנצל את המקום שלפני $A000

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
		; מזיזים את [TXTTAB-1, VARTAB) — כולל בית האפס — בהפרש, ו-VARTAB = הסוף החדש
		ldd	,s		; למעלה או למטה?
		bmi	3F
		ldx	VARTAB		; למעלה: מהסוף להתחלה
		leau	d,x
		stu	VARTAB
2		lda	,-x
		sta	,-u
		cmpx	TXTTAB		; עד בית האפס (TXTTAB-1) כולל
		bhs	2B
		bra	5F
3		ldx	TXTTAB		; למטה: מההתחלה לסוף
		leax	-1,x
		leau	d,x
		lbsr	rn_down
5		ldd	,s		; ו-TXTTAB בהפרש
		addd	TXTTAB
		std	TXTTAB
		ldx	CURLIN		; מתוך תוכנית: גם המקום בטקסט, כדי להמשיך (קורא)
		leax	1,x		; $FFFF: שורה ישירה
		beq	6F
		ldd	,s
		addd	TXTPTR
		std	TXTPTR
6		leas	2,s
		lbsr	lnkprg		; הקישורים
		lbra	clr_go		; ניקוי משתנים ומחסנית (ב-Dragon: פתוח אם גם המחסנית)
mem_fc		lbra	err_fc
