; Dragon 1982 BASIC — שלב 2, חלק 1: מחרוזות.
; תרגום ל-6809 של שגרות המחרוזות של BASIC-M6502 (mit: STRLIT 4271, PUTNEW 4312, GETSPA 4344, GARBAG 4362,
; CAT 4522, MOVSTR 4560, FRETMP 4590, COPY/GETSPT 2620, STRPRT 2789, STRCMP 3557).
; התאמות ל-Dragon (קורא: מפרט הזיכרון):
;   מתאר מחרוזת 5 בתים: [אורך][לא בשימוש][כתובת 2][לא בשימוש] (ב-mit: 3 בתים)
;   8 מתארים זמניים ב-$01A9-$01D0, TEMPPT ב-$0B, LASTPT ב-$0D
;   FRETOP מצביע על הבית שמתחת למחרוזת האחרונה; מחרוזת חדשה באורך L: FRETOP יורד ב-L, והכתובת היא FRETOP+1
;   המחרוזות מעל STKTOP ($21) ועד MEMSIZ ($27)
;
; Portions translated from Microsoft BASIC-M6502, Copyright (c) Microsoft Corporation, MIT License.

TEMPPT		equ	$0b
LASTPT		equ	$0d
FRESPC		equ	$25
DSCPNT		equ	$4d
DSCTMP		equ	$56		; 5 בתים
STRNG1		equ	$62
STRNG2		equ	$64
TEMPST		equ	$01a9		; 8 מתארים זמניים
TEMPEND		equ	TEMPST+40
GCLIM		equ	$ea		; פנימי: הגבול של האיסוף
GCBEST		equ	$ec		; פנימי: המתאר הנבחר
GCADR		equ	$ee		; פנימי: הכתובת שלו
INDEX		equ	$f0		; פנימי: כתובת המחרוזת אחרי frestr

; strlit: מחרוזת במרכאות. X = התו הראשון אחרי המרכאות. בונה מתאר זמני (FAC), ו-STRNG2 = התו שאחרי.
; strlt2: אותו דבר, אבל המחרוזת נגמרת ב-0, ב-CHARAC או ב-ENDCHR (READ/INPUT). אם נגמרה במרכאות, מדלגים עליהן.
; מחרוזת שבתוך התוכנית נשארת שם; אחרת (שורה ישירה, שורת קלט) מועתקת לשטח המחרוזות (mit: STRLT2/STRCP)
CHARAC		equ	$01		; קורא: מפריד מחרוזת
ENDCHR		equ	$02
strlit		lda	#'"
		sta	CHARAC
		sta	ENDCHR
strlt2		stx	DSCTMP+2
		clrb
1		lda	,x
		beq	3F
		cmpa	CHARAC
		beq	2F
		cmpa	ENDCHR
		beq	2F
		leax	1,x
		incb
		bra	1B
2		cmpa	#'"
		bne	3F
		leax	1,x		; מדלגים על המרכאות הסוגרות
3		stx	STRNG2
		stb	DSCTMP
		ldx	DSCTMP+2
		cmpx	TXTTAB
		blo	4F
		cmpx	VARTAB
		blo	putnew		; בתוך התוכנית: בלי העתקה
4		tfr	b,a
		stx	STRNG1
		lbsr	strspa		; מקום, והכתובת ב-DSCTMP+2
		ldx	STRNG1
		lbsr	movstr
; putnew: המתאר שב-DSCTMP → מתאר זמני, ו-FAC מצביע עליו (mit: PUTNEW)
putnew		ldx	TEMPPT
		cmpx	#TEMPEND
		lbeq	err_st
		lda	DSCTMP
		sta	,x
		clr	1,x
		ldd	DSCTMP+2
		std	2,x
		clr	4,x
		stx	FACMO
		stx	LASTPT
		clr	FACOV
		lda	#$ff
		sta	VALTYP
		leax	5,x
		stx	TEMPPT
		rts

; strini / strspa: מקום ל-A תווים. DSCTMP = [A][0][הכתובת] (mit: STRINI/STRSPA)
strini		ldx	FACMO
		stx	DSCPNT
strspa		bsr	getspa
		stx	DSCTMP+2
		sta	DSCTMP
		rts
; getspa: מקום ל-A תווים. X = הכתובת, וגם FRESPC. אין מקום: איסוף, ואם עדיין אין: ?OS
getspa		pshs	a
		clr	GARBFL
1		ldb	,s
		clra
		pshs	d
		ldd	FRETOP
		subd	,s++
		bcs	2F
		cmpd	STKTOP
		blo	2F
		std	FRETOP
		addd	#1
		tfr	d,x
		stx	FRESPC
		puls	a,pc
2		tst	GARBFL		; כבר אספנו: אין מקום
		lbne	err_os
		inc	GARBFL
		lbsr	garba2
		bra	1B
GARBFL		equ	$07

; garba2: איסוף. בכל סיבוב בוחרים את המחרוזת עם הכתובת הגבוהה ביותר שעוד לא הוזזה (מעל STREND,
; כלומר לא בתוך התוכנית), ומעבירים אותה לראש השטח. התוצאה: כל המחרוזות צמודות, מתחת ל-MEMSIZ (mit: GARBA2)
garba2		ldx	MEMSIZ
		stx	GCLIM		; המחרוזות שמעל GCLIM כבר במקום
gc_pass		ldx	#0
		stx	GCBEST
		ldd	STREND
		std	GCADR		; צריך כתובת גבוהה מזו
		ldx	#TEMPST		; מתארים זמניים
1		cmpx	TEMPPT
		beq	2F
		bsr	gc_cand
		leax	5,x
		bra	1B
2		ldx	VARTAB		; משתנים פשוטים: רק מחרוזות (ביט 7 בתו השני)
3		cmpx	ARYTAB
		beq	4F
		tst	1,x
		bpl	5F
		leax	2,x
		bsr	gc_cand
		leax	-2,x
5		leax	7,x
		bra	3B
4		ldx	ARYTAB		; מערכים של מחרוזות
6		cmpx	STREND
		beq	gc_move
		pshs	x
		ldd	2,x		; אורך הרשומה
		addd	,s
		pshs	d		; הרשומה הבאה
		tst	1,x
		bpl	8F		; לא מחרוזות
		ldb	4,x		; מספר ממדים
		lslb
		addb	#5
		abx			; האיברים
7		cmpx	,s
		beq	8F
		bsr	gc_cand
		leax	5,x
		bra	7B
8		puls	x
		leas	2,s
		bra	6B
gc_move		ldx	GCBEST
		beq	9F		; אין עוד: סיימנו
		ldb	,x		; האורך
		clra
		pshs	d
		ldd	GCLIM
		subd	,s		; היעד מתחיל ב-GCLIM-L+1
		addd	#1
		tfr	d,u
		ldx	2,x		; המקור
		puls	d
		pshs	u
		leau	d,u		; מעתיקים מהסוף להתחלה (היעד גבוה מהמקור)
		leax	d,x
		tstb
		beq	11F
10		lda	,-x
		sta	,-u
		decb
		bne	10B
11		puls	u		; עדכון המתאר
		ldx	GCBEST
		stu	2,x
		leau	-1,u
		stu	GCLIM
		lbra	gc_pass
9		ldx	GCLIM
		stx	FRETOP
		rts
; gc_cand: המתאר ב-X מועמד? אורך לא 0, כתובת מעל GCADR (הטובה ביותר עד עכשיו) ולא מעל GCLIM
gc_cand		tst	,x
		beq	9F
		ldd	2,x
		cmpd	GCADR
		bls	9F
		cmpd	GCLIM
		bhi	9F
		std	GCADR
		stx	GCBEST
9		rts

; movstr: מעתיק A תווים מ-X אל FRESPC, ו-FRESPC מתקדם (mit: MOVSTR/MOVDO)
movstr		ldu	FRESPC
		tsta
		beq	2F
1		ldb	,x+
		stb	,u+
		deca
		bne	1B
2		stu	FRESPC
		rts

; frestr: הביטוי חייב להיות מחרוזת. משחרר את המתאר הזמני. A = האורך, X = הכתובת (וגם INDEX) (mit: FRESTR)
frestr		tst	VALTYP
		lbeq	err_tm
frefac		ldx	FACMO
fretmp		pshs	x
		bsr	fretms		; Z=1 אם זה היה הזמני האחרון
		puls	x
		pshs	cc
		lda	,x
		ldx	2,x
		puls	cc
		bne	9F
		pshs	a		; זה היה הזמני האחרון; אם המחרוזת שלו היא הנמוכה בשטח, משחררים גם אותה
		tfr	x,d
		subd	#1
		cmpd	FRETOP
		puls	a
		bne	9F
		pshs	a
		ldb	,s
		clra
		addd	FRETOP
		std	FRETOP
		puls	a
9		stx	INDEX
		rts
; fretms: אם X הוא המתאר הזמני האחרון, משחררים אותו. Z=1 אם שוחרר
fretms		cmpx	LASTPT
		bne	9F
		stx	TEMPPT
		leax	-5,x
		stx	LASTPT
		orcc	#4
9		rts

; strprt: מדפיס את המחרוזת שבמתאר של FAC (mit: STRPRT)
strprt		bsr	frefac
		tsta
		beq	9F
1		ldb	,x+
		exg	a,b
		lbsr	putc
		exg	a,b
		deca
		bne	1B
9		rts

; cat: חיבור מחרוזות. FAC = הראשונה; הימנית כבר חושבה ל-FAC, והשמאלית ב-ARGMO (mit: CAT)
cat		ldx	ARGMO		; השמאלית
		stx	STRNG1
		lda	,x
		ldx	FACMO
		adda	,x
		lbcs	err_ls		; יותר מ-255
		lbsr	strini		; DSCPNT = הימנית
		ldx	STRNG1		; מעתיקים את השמאלית
		lda	,x
		ldx	2,x
		lbsr	movstr
		ldx	DSCPNT		; ואת הימנית, ומשחררים אותה
		lbsr	fretmp
		lbsr	movstr
		ldx	STRNG1
		lbsr	fretmp
		lbra	putnew

; strcmp: השוואת מחרוזות. ARG = השמאלית, FAC = הימנית. A = 1 אם הימנית גדולה, 0 שוות, $FF אם קטנה
; (כמו fcomp: הסימן של FAC פחות ARG) (mit: STRCMP 3557)
strcmp		lbsr	frefac		; הימנית: A = אורך, X = כתובת
		sta	DSCTMP
		stx	DSCTMP+2
		ldx	ARGMO
		lbsr	fretmp		; השמאלית
		stx	STRNG1
		ldu	DSCTMP+2	; U = הימנית, X = השמאלית
		ldb	DSCTMP		; B = אורך הימנית, A = אורך השמאלית
1		tsta
		beq	3F
		tstb
		beq	4F
		pshs	a,b
		lda	,x+
		cmpa	,u+
		puls	a,b
		bne	5F
		deca
		decb
		bra	1B
3		tstb			; השמאלית נגמרה
		beq	6F		; שוות
		lda	#1		; הימנית ארוכה יותר: גדולה
		bra	7F
4		lda	#$ff		; הימנית נגמרה קודם: קטנה
		bra	7F
5		lda	-1,x		; התו של השמאלית
		cmpa	-1,u
		lda	#1
		blo	7F		; השמאלית קטנה: הימנית גדולה
		lda	#$ff
		bra	7F
6		clra
7		clr	VALTYP
		rts

; ---------- פונקציות מחרוזת בסיסיות (mit: LEN 4730, ASC 4741, CHR 4627, LEFT 4642, RIGHT 4672, MID 4677) ----------
fn_len		lbsr	frestr
		clr	VALTYP
		tfr	a,b
		clra
		lbra	givu
fn_asc		lbsr	frestr
		clr	VALTYP
		tsta
		lbeq	err_fc
		ldb	,x
		clra
		lbra	givu
fn_chr		lbsr	conint		; B = 0-255
		pshs	b
		lda	#1
		lbsr	strspa
		puls	b
		stb	[DSCTMP+2]
		lbra	putnew
; left$/right$/mid$: X = מתאר המחרוזת, B = התחלה (0..), A = כמה תווים. מעתיקים לזמני חדש
substr		pshs	a,b,x
		lbsr	strspa		; מקום ל-A תווים (עלול לאסוף: מחשבים את המקור אחר כך)
		ldx	2,s
		lbsr	fretmp		; X = כתובת המקור
		ldb	1,s
		abx
		lda	,s
		lbsr	movstr
		leas	4,s
		lbra	putnew
