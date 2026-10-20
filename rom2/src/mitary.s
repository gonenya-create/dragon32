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
ary		cmpb	#2		; רק DIM נחשב "DIM"; קריאה רגילה יוצרת מערך אוטומטי
		beq	0F
		clrb
0		lda	VALTYP
		ldx	VARNAM
		pshs	a,b,x		; [0]=VALTYP [1]=DIM? [2-3]=VARNAM
		clrb
		pshs	b		; מספר הממדים, למעלה
1		jsr	<chrget		; אחרי ( או ,
		lbsr	frmevl		; האינדקס (אינדקס בתוך אינדקס: רקורסיה)
		lbsr	chknum
		lbsr	ayint
		ldd	FACMO
		lbmi	err_fc		; אינדקס שלילי
		std	IDXTMP
		puls	a
		ldx	IDXTMP
		pshs	x		; האינדקס נכנס מתחת למונה
		inca
		pshs	a
		jsr	<chrgot
		cmpa	#',
		beq	1B
		lbsr	chkrp
		puls	a
		sta	ARYCNT
		lsla			; הבלוק נמצא מתחת לאינדקסים
		leau	a,s
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
		lbne	err_bs		; מספר ממדים אחר: ?BS
		bra	getdef
; ary_new: בונים רשומה ב-STREND (mit: NOTFDD)
ary_new		stx	ARYREC
		ldd	VARNAM
		std	,x
		lda	ARYCNT
		sta	4,x
		leay	5,x		; הגדלים
		ldd	#5		; התוצאה: גודל איבר כפול מכפלת הגדלים
		std	CURTOL
		ldb	ARYCNT
		pshs	b
		leax	,s		; X = מצביע לאינדקסים (מעל המונה הזמני)
		leax	1,x
4		ldd	#11		; ברירת מחדל
		tst	1,u
		beq	5F
		ldd	,x		; DIM: האינדקס ועוד 1
		addd	#1
5		std	,y++
		leax	2,x
		bsr	mulcur		; CURTOL *= D
		dec	,s
		bne	4B
		leas	1,s
		; סוף הרשומה = Y + CURTOL. חייב להשאיר מקום למחסנית (mit: REASON)
		tfr	y,d
		addd	CURTOL
		lbcs	err_om
		pshs	d
		lbsr	reason
		puls	d
		std	STREND
		leax	,y		; מאפסים את האיברים
6		cmpx	STREND
		bhs	7F
		clr	,x+
		bra	6B
7		ldx	ARYREC		; האורך הכולל
		ldd	STREND
		subd	ARYREC
		std	2,x
		tst	1,u
		beq	getdef		; לא DIM: עכשיו ניגשים לאיבר
		lda	ARYCNT		; DIM: מוציאים את האינדקסים, וזהו
		lsla
		leas	a,s
		leas	4,s		; הבלוק
		rts
; getdef: X = הרשומה. ההיסט לפי האינדקסים שבמחסנית: האחרון ראשון (mit: GETDEF/INLPNM)
getdef		stx	ARYREC
		ldd	#0
		std	CURTOL
		leay	5,x		; הגדלים, באותו סדר
		ldb	ARYCNT
		pshs	b
1		ldd	1,s		; האינדקס (מתחת למונה)
		cmpd	,y
		lbhs	err_bs		; גדול מדי: ?BS
		std	IDXTMP
		ldd	,y++
		bsr	mulcur		; CURTOL = CURTOL*גודל + אינדקס
		ldd	CURTOL
		addd	IDXTMP
		std	CURTOL
		puls	b		; מוציאים את האינדקס
		leas	2,s
		pshs	b
		dec	,s
		bne	1B
		leas	1,s
		ldd	CURTOL		; כפול 5
		lslb
		rola
		lslb
		rola
		addd	CURTOL
		leax	d,y		; Y = אחרי הגדלים = האיבר הראשון
		stx	VARPNT
		leas	4,s		; הבלוק
		rts
; mulcur: CURTOL = CURTOL * D (16 ביט, גלישה: ?OM)
mulcur		pshs	d
		lda	CURTOL+1
		ldb	1,s
		mul			; נמוך*נמוך
		pshs	d
		lda	CURTOL
		ldb	3,s
		mul			; גבוה*נמוך
		tsta
		lbne	err_om
		addb	,s
		lbcs	err_om
		stb	,s
		lda	CURTOL+1
		ldb	2,s
		mul			; נמוך*גבוה
		tsta
		lbne	err_om
		addb	,s
		lbcs	err_om
		stb	,s
		lda	CURTOL
		ldb	2,s
		mul			; גבוה*גבוה
		cmpd	#0
		lbne	err_om
		puls	d
		std	CURTOL
		puls	d,pc
; reason: D = כתובת חדשה לסוף האזור. חייבים להישאר 58 בתים מתחת למחסנית (קורא: הרזרבה), אחרת ?OM
reason		addd	#58
		lbcs	err_om
		pshs	d
		tfr	s,d
		subd	#4		; כתובות החזרה
		cmpd	,s++
		lbls	err_om
		rts

; DIM שם(גדלים)[,שם(גדלים)...] (mit: DIM)
dim		ldb	#2
		lbsr	ptrget
		jsr	<chrgot
		cmpa	#',
		bne	1F
		jsr	<chrget
		bra	dim
1		rts
