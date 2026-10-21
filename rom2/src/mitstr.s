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
		ldb	#-1
1		incb			; B = כמה תווים לפני הסוף
		lda	,x+
		beq	3F
		cmpa	CHARAC
		beq	2F
		cmpa	ENDCHR
		bne	1B
2		cmpa	#'"
		beq	4F		; מדלגים על המרכאות הסוגרות
3		leax	-1,x
4		stx	STRNG2
		stb	DSCTMP
		jsr	HK_STR		; 20: B = האורך, X = הסוף
		ldx	DSCTMP+2
		cmpx	TXTTAB
		blo	4F
		cmpx	VARTAB
		blo	putnew		; בתוך התוכנית: בלי העתקה
4		tfr	b,a
		stx	STRNG1
		lbsr	strspa		; מקום, והכתובת ב-DSCTMP+2
		ldx	STRNG1
movput		bsr	movstr
; putnew: המתאר שב-DSCTMP → מתאר זמני, ו-FAC מצביע עליו (mit: PUTNEW)
putnew		ldx	TEMPPT
		cmpx	#TEMPEND
		lbeq	err_st
		lda	DSCTMP
		clrb
		std	,x
		stb	4,x
		ldd	DSCTMP+2
		std	2,x
		stx	FACMO
		stx	LASTPT
		clr	FACOV
		lda	#$ff
		sta	VALTYP
		leax	5,x
		stx	TEMPPT
		rts

; movstr: מעתיק A תווים מ-X אל FRESPC, ו-FRESPC מתקדם (mit: MOVSTR/MOVDO)
; movdsc: אותו דבר מהמתאר שב-X
movdsc		lda	,x
		ldx	2,x
movstr		ldu	FRESPC
		tsta
		beq	2F
1		ldb	,x+
		stb	,u+
		deca
		bne	1B
2		stu	FRESPC
		rts

; strprt: מדפיס את המחרוזת שבמתאר של FAC (mit: STRPRT)
strprt		bsr	frefac
		tfr	a,b
		tstb
		beq	9F
1		lda	,x+
		lbsr	chrout		; שומר על B ו-X
		decb
		bne	1B
9		rts

; cat: חיבור מחרוזות. FAC = הראשונה; הימנית כבר חושבה ל-FAC, והשמאלית ב-ARGMO (mit: CAT)
cat		ldx	ARGMO		; השמאלית
		stx	STRNG1
		lda	,x
		ldx	FACMO
		adda	,x
		lbcs	err_ls		; יותר מ-255
		bsr	strini		; DSCPNT = הימנית
		ldx	STRNG1		; מעתיקים את השמאלית
		bsr	movdsc
		ldx	DSCPNT		; ואת הימנית, ומשחררים אותה
		bsr	fretmp
		bsr	movstr
		ldx	STRNG1
		bsr	fretmp
		bra	putnew

; strcmp: השוואת מחרוזות. ARG = השמאלית, FAC = הימנית. A = 1 אם הימנית גדולה, 0 שוות, $FF אם קטנה
; (כמו fcomp: הסימן של FAC פחות ARG) (mit: STRCMP 3557)
strcmp		bsr	frefac		; הימנית: A = אורך, X = כתובת
		pshs	a,x
		ldx	ARGMO
		bsr	fretmp		; השמאלית
		puls	b,u		; U = הימנית, X = השמאלית; B = אורך הימנית, A = אורך השמאלית
1		tsta
		beq	3F
		tstb
		beq	4F
		pshs	a
		lda	,x+
		cmpa	,u+
		puls	a		; הדגלים של ההשוואה נשארים
		bne	5F
		deca
		decb
		bra	1B
3		tstb			; השמאלית נגמרה (A = 0)
		beq	7F		; שוות
8		lda	#1		; הימנית ארוכה יותר: גדולה
		bra	7F
5		bcs	8B		; התו של השמאלית קטן: הימנית גדולה
4		lda	#$ff		; הימנית נגמרה קודם, או התו שלה קטן: קטנה
7		clr	VALTYP
		rts

; frestr: הביטוי חייב להיות מחרוזת. משחרר את המתאר הזמני. A = האורך, X = הכתובת (וגם INDEX) (mit: FRESTR)
frestr		tst	VALTYP
		lbeq	err_tm
frefac		ldx	FACMO
fretmp		bsr	fretms		; Z=1 אם זה היה הזמני האחרון
		bne	9F
		ldd	2,x		; זה היה הזמני האחרון; אם המחרוזת שלו היא הנמוכה בשטח, משחררים גם אותה
		subd	#1
		cmpd	FRETOP
		bne	9F
		addb	,x		; D = FRETOP
		adca	#0
		std	FRETOP
9		lda	,x
		ldx	2,x
		stx	INDEX
		rts
; fretms: אם X הוא המתאר הזמני האחרון, משחררים אותו. Z=1 אם שוחרר. X לא משתנה
fretms		cmpx	LASTPT
		bne	9F
		stx	TEMPPT
		leax	-5,x
		stx	LASTPT
		leax	5,x
		orcc	#4
9		rts

; strini / strspa: מקום ל-A תווים. DSCTMP = [A][0][הכתובת] (mit: STRINI/STRSPA)
strini		ldx	FACMO
		stx	DSCPNT
; X = הכתובת, וגם FRESPC. אין מקום: איסוף, ואם עדיין אין: ?OS
strspa		sta	DSCTMP
		clr	GARBFL
1		ldd	FRETOP
		subb	DSCTMP
		sbca	#0
		bcs	2F
		cmpd	STKTOP
		blo	2F
		std	FRETOP
		tfr	d,x
		leax	1,x
		stx	FRESPC
		stx	DSCTMP+2
		lda	DSCTMP
		rts
2		tst	GARBFL		; כבר אספנו: אין מקום
		lbne	err_os
		inc	GARBFL
		lbsr	garba2
		bra	1B
GARBFL		equ	$07

; ---------- פונקציות מחרוזת בסיסיות (mit: LEN 4730, ASC 4741, CHR 4627, LEFT 4642, RIGHT 4672, MID 4677) ----------
fn_asc		bsr	frestr
		clr	VALTYP
		tsta
		beq	str_fc
		ldb	,x
		bra	1F
fn_len		bsr	frestr
		clr	VALTYP
		tfr	a,b
1		lbra	givb
fn_chr		lbsr	conint		; B = 0-255
		pshs	b
		lda	#1
		bsr	strspa
		puls	b
		stb	,x		; X = הכתובת (strspa)
		lbra	putnew
; left$/right$/mid$: X = מתאר המחרוזת, B = התחלה (0..), A = כמה תווים. מעתיקים לזמני חדש
substr		pshs	a,b,x
		bsr	strspa		; מקום ל-A תווים (עלול לאסוף: מחשבים את המקור אחר כך)
		ldx	2,s
		lbsr	fretmp		; X = כתובת המקור
		puls	d,u		; A = כמה, B = התחלה (U סתם)
		abx
		lbra	movput
str_fc		lbra	err_fc

; ---------- MID$ כפקודה: MID$(A$,n[,m])=B$ (קורא, docs/DRAGON-SPEC-FUNCTIONS.md) ----------
; היעד שלא בשטח המחרוזות (למשל בתוך התוכנית) מועתק לשם קודם, כולו. n=0: ?FC לפני צד ימין.
; n גדול מהאורך: ?FC אחרי צד ימין. מוחלפים min(m, אורך B$, מה שנשאר מ-n); האורך של A$ לא משתנה.
; m=0 עם B$ לא ריק: מועתקים 256 בתים, כמו במקור (קורא: מונה שיורד אחרי ההעתקה הראשונה)
midst		jsr	<chrget		; אחרי $FF
		jsr	<chrget		; אחרי $98
		lbsr	chklp
		clrb			; יוצרים משתנה אם אין
		lbsr	ptrget
		tst	VALTYP
		lbeq	err_tm
		ldx	VARPNT
		pshs	x		; המתאר
		ldd	2,x
		cmpd	STKTOP
		bls	1F
		cmpd	MEMSIZ
		bls	2F		; כבר בשטח המחרוזות: משנים במקום
1		lda	,x		; מעתיקים את כל המחרוזת לשטח המחרוזות
		lbsr	strspa
		ldx	,s
		lbsr	movdsc
		ldx	,s
		ldd	DSCTMP+2
		std	2,x
2		lbsr	chkcom
		lbsr	evbyte
		tstb
		beq	str_fc		; אין מקום 0
		pshs	b		; ההתחלה
		ldb	#255		; ברירת מחדל
		jsr	<chrgot
		cmpa	#',
		bne	3F
		jsr	<chrget
		lbsr	evbyte
3		pshs	b		; כמה
		lbsr	chkrp
		lda	#$cb		; =
		lbsr	synchk
		lbsr	frmevl
		lbsr	frestr		; A = האורך, X = הכתובת
		pshs	a,x		; 0=אורך B$, 1=כתובת, 3=כמה, 4=התחלה, 5=המתאר
		ldu	5,s
		ldb	4,s
		cmpb	,u
		bhi	str_fc		; התחלה מעבר לסוף
		ldx	2,u		; לאן: הכתובת ועוד n-1
		abx
		leax	-1,x
		ldb	,u
		subb	4,s
		incb			; מה שנשאר מ-n
		cmpb	3,s
		bls	4F
		ldb	3,s
4		cmpb	,s
		bls	5F
		ldb	,s
5		tst	,s
		beq	7F		; B$ ריק: אין העתקה
		ldu	1,s		; מאין
6		lda	,u+
		sta	,x+
		decb
		bne	6B
7		leas	7,s
		rts

; garba2: איסוף. בכל סיבוב בוחרים את המחרוזת עם הכתובת הגבוהה ביותר שעוד לא הוזזה (מעל STREND,
; כלומר לא בתוך התוכנית), ומעבירים אותה לראש השטח. התוצאה: כל המחרוזות צמודות, מתחת ל-MEMSIZ (mit: GARBA2)
garba2		ldx	MEMSIZ
		stx	GCLIM		; המחרוזות שמעל GCLIM כבר במקום
gc_pass		clr	GCBEST
		clr	GCBEST+1
		ldd	STREND
		std	GCADR		; צריך כתובת גבוהה מזו
		ldx	#TEMPST		; מתארים זמניים
1		cmpx	TEMPPT
		beq	2F
		bsr	gc_cand
		bra	1B
2		ldx	VARTAB		; משתנים פשוטים: רק מחרוזות (ביט 7 בתו השני)
3		cmpx	ARYTAB
		beq	4F
		ldb	1,x
		leax	2,x
		bsr	gc_cv
		bra	3B
4		ldx	ARYTAB		; מערכים של מחרוזות
6		cmpx	STREND
		beq	gc_move
		tfr	x,d
		addd	2,x		; ועוד אורך הרשומה
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
		bra	7B
8		puls	x
		bra	6B
gc_move		ldx	GCBEST
		beq	9F		; אין עוד: סיימנו
		ldu	GCLIM		; היעד נגמר ב-GCLIM
		leau	1,u
		ldb	,x		; האורך (לא 0: gc_cand)
		ldx	2,x		; המקור
		abx
10		lda	,-x		; מעתיקים מהסוף להתחלה (היעד גבוה מהמקור)
		sta	,-u
		decb
		bne	10B
		ldx	GCBEST		; עדכון המתאר
		stu	2,x
		leau	-1,u
		stu	GCLIM
		bra	gc_pass
9		ldx	GCLIM
		stx	FRETOP
		rts
; gc_cand: המתאר ב-X מועמד? אורך לא 0, כתובת מעל GCADR (הטובה ביותר עד עכשיו) ולא מעל GCLIM. X מתקדם ב-5
; gc_cv: אותו דבר למשתנה, רק אם B שלילי (מחרוזת)
gc_cv		tstb
		bpl	9F
gc_cand		tst	,x
		beq	9F
		ldd	2,x
		cmpd	GCADR
		bls	9F
		cmpd	GCLIM
		bhi	9F
		std	GCADR
		stx	GCBEST
9		leax	5,x
		rts
