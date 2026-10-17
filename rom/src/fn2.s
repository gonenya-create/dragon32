; Dragon 1982 BASIC: DEF FN, LINE INPUT, CLEAR, TRON/TROFF. נכתב מאפס.

TRONF		equ	$de		; מעקב TRON פעיל?
LASTTR		equ	$df		; (לא בשימוש כרגע)

; ---------- DEF FN ----------
; DEF FNA(X)=ביטוי. נשמר כמו משתנה: השם [$80|אות]['F'], והערך [כתובת הביטוי 2][שם הפרמטר 2][0]
st_def		ldd	CURLN
		lbeq	err_id		; רק בתוך תוכנית, כמו במקור
		lbsr	skipsp
		leau	kw_fn,pcr
		lbsr	match
		lbne	err_sn
		lda	,x+
		cmpa	#'A
		lblo	err_sn
		cmpa	#'Z
		lbhi	err_sn
		ora	#$80
		ldb	#'F
		pshs	d		; שם הפונקציה
		lda	#'(
		lbsr	expect
		lbsr	getvar		; הפרמטר (רק השם חשוב)
		ldd	VNAME
		pshs	d
		lda	#')
		lbsr	expect
		lda	#'=
		lbsr	expect
		lbsr	skipsp
		ldd	2,s
		std	VNAME
		pshs	x
		lbsr	findvar		; רשומה לפונקציה (יוצר אם אין)
		puls	x
		ldu	VARPTR
		stx	,u		; הביטוי מתחיל כאן
		puls	d
		std	2,u		; שם הפרמטר
		leas	2,s
		; מדלגים על הביטוי עד סוף הפקודה (בלי להתבלבל ממרכאות)
1		lda	,x
		beq	3F
		cmpa	#':
		beq	3F
		leax	1,x
		cmpa	#'"
		bne	1B
2		lda	,x
		beq	3F
		leax	1,x
		cmpa	#'"
		bne	2B
		bra	1B
3		rts
kw_fn		fcc	"FN"
		fcb	0

; do_fn: בביטוי, X על "FN". מחשבים את הארגומנט, שמים אותו בפרמטר, מחשבים את הגוף, ומחזירים את הפרמטר למה שהיה
do_fn		leax	2,x
		lda	,x+
		ora	#$80
		ldb	#'F
		pshs	d		; שם הפונקציה
		lda	#'(
		lbsr	expect
		lbsr	rexpr
		lbsr	neednum
		lda	#')
		lbsr	expect
		puls	d
		std	VNAME
		pshs	x
		lbsr	findvar
		puls	x
		ldu	VARPTR
		ldd	,u
		lbeq	err_uf		; לא הוגדרה (רשומה חדשה ריקה)
		pshs	x		; [s+..] המקום בביטוי הקורא
		pshs	d		; כתובת הגוף
		ldd	2,u
		std	VNAME		; הפרמטר
		lbsr	findvar
		ldu	VARPTR
		; שומרים את הערך הישן של הפרמטר (5 בתים) ושמים את הארגומנט
		ldd	3,u
		pshs	d
		ldd	1,u
		pshs	d
		lda	,u
		pshs	a,u
		lbsr	stfac
		ldx	7,s		; הגוף: מתחת ל-a,u (3 בתים) ולערך הישן (4)
		lbsr	rexpr
		lbsr	neednum
		; מחזירים את הפרמטר
		puls	a,u
		sta	,u
		puls	d
		std	1,u
		puls	d
		std	3,u
		leas	2,s		; כתובת הגוף
		puls	x,pc
err_uf		leau	m_uf,pcr
		lbra	error
m_uf		fcc	"?UF ERROR"
		fcb	0

; ---------- LINE INPUT ["הודעה";] משתנה$: כל השורה, כולל פסיקים ומרכאות ----------
st_lineinput	ldd	CURLN
		lbeq	err_id
		lbsr	skipsp
		cmpa	#'"
		bne	1F
		lbsr	str_lit
		lbsr	prtstr
		lda	#';
		lbsr	expect
1		lbsr	getvar
		tst	VNAME+1
		lbpl	err_tm
		pshs	x,u
		lbsr	getline
		lbcs	in_break
		ldx	#LINBUF
		stx	SPTR
		clrb
2		tst	,x+
		beq	3F
		incb
		bra	2B
3		stb	SLEN
		lbsr	str_save
		puls	x,u
		lda	SLEN
		sta	,u
		ldd	SPTR
		std	1,u
		rts

; ---------- CLEAR [n[,m]]: מאפס את כל המשתנים (המספרים לא משנים כאן) ----------
st_clear	lbsr	clrvars
1		lda	,x
		beq	2F
		cmpa	#':
		beq	2F
		leax	1,x
		bra	1B
2		rts

; ---------- TRON / TROFF: מראה את מספר כל שורה שמתחילה לרוץ, בסוגריים ----------
st_tron		lda	#1
		sta	TRONF
		rts
st_troff	clr	TRONF
		rts
; trace_ln: נקרא כשמתחילים שורה חדשה בתוכנית
trace_ln	tst	TRONF
		beq	1F
		pshs	d,y
		ldy	CURLN
		beq	2F
		lda	#'[
		lbsr	putc
		ldd	2,y
		lbsr	prtint
		lda	#']
		lbsr	putc
2		puls	d,y
1		rts
