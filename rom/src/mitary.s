; Dragon 1982 BASIC — שלב 2, חלק 2: מערכים ו-DIM.
; תרגום ל-6809 של BASIC-M6502 (mit: ISARY 3826, NOTFDD 3925, GETDEF 4016, DIM 3613).
; רשומת מערך (ספר: Anatomy עמ' 116-117; קורא): [שם 2][אורך הרשומה כולה 2][מספר ממדים 1]
;   [גודל כל ממד 2 — הממד האחרון ראשון][איברים של 5 בתים]. גודל ממד = הגבול העליון ועוד 1.
;   האינדקס הראשון משתנה הכי מהר. בלי DIM: 11 בכל ממד.
;
; Portions translated from Microsoft BASIC-M6502, Copyright (c) Microsoft Corporation, MIT License.

ARYCNT		equ	$03		; מספר הממדים (קורא: COUNT)
IDXTMP		equ	$f2		; פנימי
CURTOL		equ	$f4		; פנימי: ההיסט המצטבר
ARYREC		equ	$f6		; פנימי: הרשומה

; ary: נקרא מ-ptrget כש-TXTPTR על '('. VARNAM ו-VALTYP כבר מוכנים. B: 0 = רגיל, 2 = DIM
ary		andb	#2		; רק DIM (2) נחשב "DIM"; 0 ו-1: קריאה רגילה יוצרת מערך אוטומטי
		lda	VALTYP
		ldx	VARNAM
		pshs	a,b,x		; [0]=VALTYP [1]=DIM? [2-3]=VARNAM
		clr	,-s		; מספר הממדים, למעלה
1		lbsr	getfrm		; אחרי ( או ,: האינדקס (אינדקס בתוך אינדקס: רקורסיה)
		lbsr	chknum
		lbsr	ayint
		ldx	FACMO
		lbmi	err_fc		; אינדקס שלילי
		puls	a
		inca
		pshs	a,x		; האינדקס נכנס מתחת למונה
		jsr	<chrgot
		cmpa	#',
		beq	1B
		lbsr	chkrp
		puls	a
		sta	ARYCNT
		lsla			; הבלוק נמצא מתחת לאינדקסים
		leau	a,s
		stu	IDXTMP		; סוף האינדקסים
		ldd	2,u
		std	VARNAM
		lda	,u
		sta	VALTYP
		; מחפשים את המערך (mit: LOPFDA)
		ldx	ARYTAB
2		cmpx	STREND
		beq	ary_new
		ldd	,x
		cmpd	VARNAM
		beq	3F
		ldd	2,x
		leax	d,x
		bra	2B
3		tst	1,u		; קיים ו-DIM שוב: ?DD
		lbne	err_dd
		lda	4,x
		cmpa	ARYCNT
		beq	getdef
ary_bs		lbra	err_bs		; מספר ממדים אחר: ?BS
; ary_new: בונים רשומה ב-STREND (mit: NOTFDD)
ary_new		stx	ARYREC
		ldd	VARNAM
		std	,x
		leay	5,x		; הגדלים
		ldd	#5		; התוצאה: גודל איבר כפול מכפלת הגדלים
		std	CURTOL
		ldb	ARYCNT
		stb	4,x
		leax	,s		; X = האינדקסים, עד הבלוק (U)
4		ldd	,x++		; DIM: האינדקס ועוד 1
		addd	#1
		bra	isl_9772_e	;@isl
		fill	$ff,$9772-*	;@isl
		jmp	fn_rnd	;@isl
isl_9772_e	;@isl
		tst	1,u
		bne	5F
		ldd	#11		; ברירת מחדל
5		std	,y++
		bsr	mulcur		; CURTOL *= D
		cmpx	IDXTMP
		bne	4B
		; סוף הרשומה = Y + CURTOL. חייב להשאיר מקום למחסנית (mit: REASON)
		tfr	y,d
		addd	CURTOL
		bcs	ary_om
		pshs	d
		bsr	reason
		puls	d
		std	STREND
		subd	ARYREC		; האורך הכולל
		ldx	ARYREC
		std	2,x
6		clr	,y+		; מאפסים את האיברים (תמיד יש לפחות 5 בתים)
		cmpy	STREND
		blo	6B
		tst	1,u
		beq	getdef		; לא DIM: עכשיו ניגשים לאיבר
		bra	ary_x		; DIM: מוציאים את האינדקסים ואת הבלוק, וזהו
; getdef: X = הרשומה. ההיסט לפי האינדקסים שבמחסנית: האחרון ראשון (mit: GETDEF/INLPNM)
getdef		clr	CURTOL
		clr	CURTOL+1
		leay	5,x		; הגדלים, באותו סדר
		leax	,s		; X = האינדקסים
1		ldd	,x++		; האינדקס
		cmpd	,y
		bhs	ary_bs		; גדול מדי: ?BS
		ldd	,y++
		bsr	mulcur		; CURTOL = CURTOL*גודל + אינדקס
		addd	-2,x
		std	CURTOL
		cmpx	IDXTMP
		bne	1B
		lslb			; כפול 5
		rola
		lslb
		rola
		addd	CURTOL
		leax	d,y		; Y = אחרי הגדלים = האיבר הראשון
		stx	VARPNT
ary_x		leas	4,u		; האינדקסים והבלוק
		rts
ary_om		lbra	err_om
; mulcur: CURTOL = CURTOL * D, וגם D = התוצאה (16 ביט, גלישה: ?OM). X, Y, U לא משתנים
; אחד הבתים הגבוהים חייב להיות 0, ואז יש רק מכפלה "צולבת" אחת
mulcur		pshs	d		; [0] = גבוה, [1] = נמוך
		lda	CURTOL
		beq	1F
		tst	,s
		bne	ary_om		; שניהם מעל 255
		ldb	1,s		; גבוה*נמוך
		bra	2F
1		lda	CURTOL+1	; נמוך*גבוה
		ldb	,s
2		mul
		tsta
		bne	ary_om
		stb	,s
		lda	CURTOL+1
		ldb	1,s
		mul			; נמוך*נמוך
		adda	,s
		bcs	ary_om
		std	CURTOL
		leas	2,s
		rts
; reason: D = כתובת חדשה לסוף האזור. חייבים להישאר 58 בתים מתחת למחסנית (קורא: הרזרבה), אחרת ?OM
; (S אחרי pshs, פחות 4 של כתובות החזרה, מול D+58: כמו S מול D+62)
reason		addd	#62
		bcs	ary_om
		pshs	d
		tfr	s,d
		cmpd	,s++
		bls	ary_om
		rts

; DIM שם(גדלים)[,שם(גדלים)...] (mit: DIM)
1		jsr	<chrget
dim		ldb	#2
		lbsr	ptrget
		jsr	<chrgot
		cmpa	#',
		beq	1B
		rts
