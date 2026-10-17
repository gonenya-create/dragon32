; Dragon 1982 BASIC: המפרש. שורות ממוספרות, משתנים, ופקודות: PRINT LET GOTO IF..THEN FOR..NEXT END STOP REM
; LIST RUN NEW CLS. נכתב מאפס.
;
; התוכנית בזיכרון, מ-PROGST: רשומות [קישור 2][מספר שורה 2][טקסט][0], ובסוף קישור 0000.
; בניסוי הזה הטקסט נשמר כמו שהוקלד (בלי קיצור למילים שמורות). המשתנים אחרי התוכנית: [שם 2][ערך 5].

STRLOW		equ	$6000		; מכאן ומעלה (עד $7E00): מחרוזות. מתחת: תוכנית, משתנים ומערכים
PROGST		equ	$1e00		; אחרי 4 עמודי הגרפיקה ($0600-$1DFF), כמו במקור
FORBASE		equ	$7f00		; מחסנית ה-FOR (עולה מ-$7F00; מחסנית המעבד יורדת ממנו)
FORLEN		equ	16		; [שם 2][עד 5][צעד 5][רשומה 2][טקסט 2]
PROGEND		equ	$90		; אחרי הקישור 0000 שבסוף התוכנית
VARTOP		equ	$92		; סוף טבלת המשתנים
CURLN		equ	$94		; הרשומה שרצה עכשיו (0 = פקודה ישירה)
FORSP		equ	$96
LINNUM		equ	$98		; מספר שורה זמני
VARPTR		equ	$9a		; כתובת הערך של המשתנה האחרון
VNAME		equ	$9c		; שם המשתנה האחרון (2 תווים)
TMPP		equ	$9e
ARYEND		equ	$a6		; סוף המערכים (המערכים מ-VARTOP עד ARYEND; ראו stmt2.s)
LINPTR		equ	$a0
FORNAME		equ	$a3
JUMPED		equ	$a2		; קפיצה (GOTO, RUN): ממשיכים מתחילת פקודה, בלי לבדוק : או סוף שורה

; ---------- אתחול ----------
newprog		ldd	#0
		std	PROGST
		ldd	#PROGST+2
		std	PROGEND
clrvars		ldd	PROGEND
		std	VARTOP
		std	ARYEND
		ldd	#FORBASE
		std	FORSP
		lbra	str_reset

; ---------- ביצוע שורה מהמקלדת ----------
execute		ldx	#LINBUF
		lbsr	skipsp
		lbeq	ex_done
		cmpa	#'0
		blo	1F
		cmpa	#'9
		lbls	storeline	; שורה עם מספר: נשמרת בתוכנית
1		ldd	#0
		std	CURLN
		; מצב ישיר: מבצעים את הפקודות שבשורה
		lbra	run_stmts

; ---------- הרצה ----------
; run_stmts: X = תחילת פקודה, CURLN = הרשומה (או 0)
run_stmts	lbsr	chkbreak
		lbsr	str_check
		clr	JUMPED
		lbsr	statement
		tst	JUMPED
		bne	run_stmts
		lbsr	skipsp
		beq	rs_eol
		cmpa	#':
		lbne	err_sn
		leax	1,x
		bra	run_stmts
rs_eol		ldy	CURLN
		beq	ex_done		; מצב ישיר: סיימנו
		ldy	,y		; הרשומה הבאה
		ldd	,y
		beq	ex_done		; זה הקישור 0000: סוף התוכנית
		sty	CURLN
		leax	4,y
		bra	run_stmts
ex_done		rts

; goline: ממשיכים מהשורה שמספרה ב-D (ומשם מבצעים). אחרת ?UL ERROR
goline		lbsr	findline
		lbne	err_ul
		sty	CURLN
		leax	4,y
		inc	JUMPED
		rts

; findline: מחפש את השורה ב-D. Y = הרשומה (או הראשונה שגדולה ממנה, או הקישור 0000). Z=1 אם נמצאה בדיוק
findline	ldy	#PROGST
1		pshs	d
		ldd	,y
		puls	d
		beq	2F		; הגענו לסוף
		cmpd	2,y
		beq	3F
		blo	2F
		ldy	,y
		bra	1B
2		andcc	#$fb
3		rts

; chkbreak: BREAK (שורה 6, עמודה 2) עוצר
chkbreak	pshs	a
		lda	#$fb
		sta	PIA0+2
		lda	PIA0
		bita	#$40
		puls	a
		bne	1F
		lbra	do_break
1		rts

; ---------- פקודה אחת ----------
statement	lbsr	skipsp
		beq	st_none
		cmpa	#'?
		bne	1F
		leax	1,x
		lbra	st_print
1		cmpa	#''
		lbeq	st_rem
		leau	kwtab,pcr
st_try		tst	,u
		beq	st_let		; לא מילה שמורה: אולי השמה
		pshs	u
		lbsr	match
		puls	u
		beq	st_found
		; המילה הבאה בטבלה: מדלגים על השם (עד 0) ועל הכתובת (2)
2		tst	,u+
		bne	2B
		leau	2,u
		bra	st_try
st_found	tst	,u+
		bne	st_found
		ldd	,u
		leau	kwbase,pcr
		jmp	d,u		; כתובת יחסית לטבלה
st_none		rts
st_let		; גרפיקה? (gfx.s)
		lbsr	gfx_dispatch
		beq	st_none
		; צליל? (sound.s)
		lbsr	snd_dispatch
		beq	st_none
		; GOSUB, RETURN, ON, DATA, READ, RESTORE, DIM? (stmt2.s)
		lbsr	st2_dispatch
		beq	st_none
		lbsr	skipsp
		cmpa	#'A
		lblo	err_sn
		cmpa	#'Z
		lbhi	err_sn
		lbra	do_let

; טבלת המילים: שם, 0, כתובת (יחסית ל-kwbase). מילים ארוכות לפני קצרות שמתחילות כמותן
kwbase
kwtab		fcc	"PRINT"
		fcb	0
		fdb	st_print-kwbase
		fcc	"LET"
		fcb	0
		fdb	do_letkw-kwbase
		fcc	"INPUT"
		fcb	0
		fdb	st_input-kwbase
		fcc	"GOTO"
		fcb	0
		fdb	st_goto-kwbase
		fcc	"IF"
		fcb	0
		fdb	st_if-kwbase
		fcc	"FOR"
		fcb	0
		fdb	st_for-kwbase
		fcc	"NEXT"
		fcb	0
		fdb	st_next-kwbase
		fcc	"END"
		fcb	0
		fdb	st_end-kwbase
		fcc	"STOP"
		fcb	0
		fdb	st_stop-kwbase
		fcc	"REM"
		fcb	0
		fdb	st_rem-kwbase
		fcc	"LIST"
		fcb	0
		fdb	st_list-kwbase
		fcc	"RUN"
		fcb	0
		fdb	st_run-kwbase
		fcc	"NEW"
		fcb	0
		fdb	st_new-kwbase
		fcc	"CLS"
		fcb	0
		fdb	st_cls-kwbase
		fcb	0

; ---------- הפקודות ----------
st_rem		; עד סוף השורה
1		lda	,x
		beq	2F
		leax	1,x
		bra	1B
2		rts

st_end		; סוף התוכנית: כמו הגעה לסוף
		ldd	#0
		std	CURLN
		bra	st_rem
st_stop		leau	m_break,pcr
		lbra	brk_msg

do_letkw	lbsr	skipsp
do_let		lbsr	getvar		; U = כתובת הערך
		lda	VNAME+1
		pshs	a,u		; [s] = סוג המשתנה (ביט 7 = מחרוזת)
		lda	#'=
		lbsr	expect
		lbsr	rexpr
		tst	,s
		bmi	1F
		lbsr	neednum
		puls	a,u
		lbra	stfac		; שומרים את FAC במשתנה
1		lbsr	needstr
		lbsr	str_save	; עותק בערימה (המקור יכול להיות בטקסט או זמני)
		puls	a,u
		lda	SLEN
		sta	,u
		ldd	SPTR
		std	1,u
		rts

st_goto		lbsr	getint
		lbra	goline

st_if		lbsr	rexpr
		lbsr	skipsp
		leau	kw_then,pcr
		lbsr	match
		beq	1F
		leau	kw_goto,pcr
		lbsr	match
		lbne	err_sn
		tst	FACEXP
		lbeq	st_rem
		lbsr	getint
		lbra	goline
1		tst	FACEXP		; תנאי לא נכון: מדלגים על כל השאר בשורה
		lbeq	st_rem
		lbsr	skipsp
		cmpa	#'0
		blo	2F
		cmpa	#'9
		bhi	2F
		lbsr	getint		; THEN 100 = GOTO 100
		lbra	goline
2		lbra	statement	; THEN פקודה
kw_then		fcc	"THEN"
		fcb	0
kw_goto		fcc	"GOTO"
		fcb	0

; FOR V = א TO ב [STEP צ]: רשומה במחסנית ה-FOR. אם כבר יש לולאה עם אותו משתנה, היא מוחלפת
st_for		lbsr	skipsp
		lbsr	getvar
		tst	VNAME+1
		lbmi	err_tm
		ldd	VNAME
		std	FORNAME		; ביטויים אחר כך יכולים לשנות את VNAME
		pshs	u
		lda	#'=
		lbsr	expect
		lbsr	rexpr
		ldu	,s
		lbsr	stfac
		; מוחקים לולאה קודמת עם אותו שם (וכל מה שמעליה)
		ldy	#FORBASE
1		cmpy	FORSP
		bhs	2F
		ldd	,y
		cmpd	FORNAME
		beq	3F
		leay	FORLEN,y
		bra	1B
3		sty	FORSP
2		ldy	FORSP
		cmpy	#FORBASE+FORLEN*16
		lbhs	err_om
		ldd	FORNAME
		std	,y
		leau	kw_to,pcr
		lbsr	skipsp
		lbsr	match
		lbne	err_sn
		pshs	y
		lbsr	rexpr
		puls	y
		leau	2,y
		lbsr	stfac		; העד
		lbsr	skipsp
		leau	kw_step,pcr
		pshs	y
		lbsr	match
		bne	4F
		lbsr	rexpr
		bra	5F
4		ldd	#1
		lbsr	givd
5		puls	y
		leau	7,y
		lbsr	stfac		; הצעד
		ldd	CURLN
		std	12,y
		stx	14,y		; ממשיכים מכאן (אחרי ה-FOR)
		leay	FORLEN,y
		sty	FORSP
		puls	u,pc
kw_to		fcc	"TO"
		fcb	0
kw_step		fcc	"STEP"
		fcb	0

; NEXT [V]: מוסיפים את הצעד; אם לא עברנו את העד, חוזרים לתחילת הלולאה
st_next		ldy	FORSP
		cmpy	#FORBASE
		lbls	err_nf
		leay	-FORLEN,y	; הלולאה האחרונה
		lbsr	skipsp
		cmpa	#'A
		blo	1F
		cmpa	#'Z
		bhi	1F
		pshs	y
		lbsr	getvar		; NEXT I: חייב להתאים
		puls	y
2		ldd	,y
		lbeq	err_nf		; רשומת GOSUB: NEXT לא עובר אותה
		cmpd	VNAME
		beq	3F
		leay	-FORLEN,y	; אולי לולאה פנימית נגמרה בלי NEXT
		cmpy	#FORBASE
		lblo	err_nf
		sty	FORSP
		bra	2B
1		; NEXT בלי שם: הלולאה האחרונה
		ldd	,y
		lbeq	err_nf		; רשומת GOSUB
		std	VNAME
		pshs	x,y
		lbsr	findvar
		puls	x,y
3		; V = V + צעד
		pshs	x,y
		ldu	VARPTR
		lbsr	ldfac
		leau	7,y
		lbsr	ldarg
		lbsr	fadd
		ldu	VARPTR
		lbsr	stfac
		; נגמר? צעד חיובי: V > עד. שלילי: V < עד
		leau	2,y
		lbsr	ldarg
		lbsr	fcmp		; A = סימן (V - עד)
		ldb	8,y		; הבית הראשון של הצעד: הביט העליון = הסימן
		bpl	4F
		nega
4		puls	x,y
		tsta
		bgt	5F		; עברנו: הלולאה נגמרה
		ldd	12,y
		std	CURLN
		ldx	14,y
		leay	FORLEN,y
		sty	FORSP
		rts
5		sty	FORSP		; מוציאים את הלולאה
		lbsr	skipsp
		cmpa	#',
		bne	6F
		leax	1,x		; NEXT I,J
		lbra	st_next
6		rts

st_run		lbsr	clrvars
		ldy	#PROGST
		ldd	,y
		beq	1F
		sty	CURLN
		leax	4,y
		inc	JUMPED
		rts
1		ldd	#0
		std	CURLN
		rts

st_new		lbsr	newprog
		ldd	#0
		std	CURLN
		lbra	st_rem

st_cls		lbsr	cls
		rts

; LIST: כל השורות
st_list		pshs	x
		ldy	#PROGST
1		ldd	,y
		beq	3F
		lbsr	chkbreak
		ldd	2,y
		lbsr	prtint
		lda	#$20
		lbsr	putc
		leax	4,y
2		lda	,x+
		beq	4F
		lbsr	putc
		bra	2B
4		lda	#13
		lbsr	putc
		ldy	,y
		bra	1B
3		puls	x
		lbra	st_rem

; prtint: מדפיס את המספר השלם (בלי סימן) שב-D
prtint		pshs	d,x,y,u
		lbsr	givd_u
		lbsr	fout
		leau	1,u		; בלי הרווח של הסימן
1		lda	,u+
		beq	2F
		lbsr	putc
		bra	1B
2		puls	d,x,y,u,pc
; givd_u: כמו givd אבל בלי סימן (0-65535)
givd_u		clr	FACSGN
		clr	FACOV
		clr	FACM+2
		clr	FACM+3
		std	FACM
		lda	#$90
		sta	FACEXP
		lbra	fnorm

; ---------- שמירת שורה בתוכנית ----------
storeline	lbsr	linenum		; D = מספר השורה, X אחריו
		std	LINNUM
		lda	,x
		cmpa	#$20
		bne	1F
		leax	1,x		; רווח אחד אחרי המספר לא נשמר
1		stx	TMPP		; הטקסט
		ldd	LINNUM
		lbsr	findline
		bne	2F
		lbsr	delrec		; שורה קיימת: קודם מוחקים
2		ldx	TMPP
		tst	,x
		beq	9F		; רק מספר: מחיקה
		; אורך הרשומה: 4 + טקסט + 0
		ldd	#5
3		tst	,x+
		beq	4F
		addd	#1
		bra	3B
4		pshs	d		; האורך
		addd	PROGEND
		cmpd	#FORBASE-$400
		lbhs	err_om
		tfr	d,u		; U = הסוף החדש
		ldx	PROGEND		; X = הסוף הישן
		sty	LINPTR
		; מזיזים את [Y..PROGEND) קדימה באורך הרשומה, מהסוף להתחלה
6		cmpx	LINPTR
		bls	7F
		lda	,-x
		sta	,-u
		bra	6B
7		ldd	PROGEND
		addd	,s++
		std	PROGEND
		ldy	LINPTR
		ldd	LINNUM
		std	2,y
		leau	4,y
		ldx	TMPP
8		lda	,x+
		sta	,u+
		bne	8B
9		lbsr	relink
		lbra	clrvars

; delrec: מוחק את הרשומה ב-Y
delrec		pshs	x,y
		ldx	,y		; הרשומה הבאה
		; מזיזים את [הבאה..PROGEND) אל Y
1		cmpx	PROGEND
		bhs	2F
		lda	,x+
		sta	,y+
		bra	1B
2		sty	PROGEND
		lbsr	relink
		puls	x,y,pc

; relink: מחשב מחדש את כל הקישורים (אחרי הזזה)
relink		pshs	d,x,y
		ldy	#PROGST
1		tfr	y,d
		addd	#2
		cmpd	PROGEND
		bhs	3F		; זה הקישור האחרון
		leax	4,y
2		tst	,x+
		bne	2B
		stx	,y
		tfr	x,y
		bra	1B
3		ldd	#0
		std	,y
		puls	d,x,y,pc

; linenum: קורא מספר שורה (0-63999) מ-X ל-D
linenum		ldd	#0
1		pshs	d		; הסכום עד עכשיו
		lda	,x
		suba	#'0
		bcs	2F
		cmpa	#9
		bhi	2F
		leax	1,x
		pshs	a		; הספרה
		ldd	1,s
		cmpd	#6399
		lbhi	err_sn
		lslb
		rola			; *2
		pshs	d
		lslb
		rola
		lslb
		rola			; *8
		addd	,s++		; *10
		addb	,s+		; + הספרה
		adca	#0
		leas	2,s
		cmpd	#63999
		lbhi	err_sn
		bra	1B
2		puls	d,pc

; ---------- משתנים ----------
; getvar: קורא שם משתנה מ-X, מוצא אותו (או יוצר), ומחזיר U = כתובת הערך. VNAME = השם
getvar		lbsr	skipsp
		cmpa	#'A
		lblo	err_sn
		cmpa	#'Z
		lbhi	err_sn
		leax	1,x
		ldb	,x		; תו שני: אות או ספרה
		cmpb	#'A
		blo	1F
		cmpb	#'Z
		bls	2F
1		cmpb	#'0
		blo	4F
		cmpb	#'9
		bhi	4F
2		leax	1,x
		; שאר האותיות והספרות לא נחשבות (כמו במקור: SCORE = SC)
3		pshs	a
		lda	,x
		cmpa	#'0
		blo	5F
		cmpa	#'9
		bls	6F
		cmpa	#'A
		blo	5F
		cmpa	#'Z
		bhi	5F
6		leax	1,x
		puls	a
		bra	3B
5		puls	a
		bra	11F
4		clrb
11		pshs	a
		lda	,x
		cmpa	#'$
		puls	a
		bne	7F
		leax	1,x
		orb	#$80		; מחרוזת
7		std	VNAME
		; מערך? (שם ואחריו סוגריים): stmt2.s מחזיר U = הכתובת של האיבר
		pshs	a
		lda	,x
		cmpa	#'(
		puls	a
		lbeq	arr_ref
		pshs	x
		bsr	findvar
		puls	x
		ldu	VARPTR
		rts
; findvar: מחפש את VNAME בטבלה, ואם אין, מוסיף (ערך 0). VARPTR = הכתובת של הערך
findvar		ldy	PROGEND
1		cmpy	VARTOP
		bhs	2F
		ldd	,y
		cmpd	VNAME
		beq	3F
		leay	7,y
		bra	1B
2		; חדש. אם יש מערכים אחרי המשתנים, מזיזים אותם 7 בתים קדימה
		pshs	x,u
		ldx	ARYEND
		leau	7,x
		cmpu	#STRLOW
		lbhs	err_om
		stu	ARYEND
9		cmpx	VARTOP
		bls	10F
		lda	,-x
		sta	,-u
		bra	9B
10		puls	x,u
		ldd	VNAME
		std	,y
		ldd	#0
		std	2,y
		std	4,y
		sta	6,y
		leay	7,y
		sty	VARTOP
		leay	-7,y
3		leay	2,y
		sty	VARPTR
		rts

; stfac: שומר את FAC (ארוז) בכתובת U
stfac		pshs	d
		lda	FACEXP
		sta	,u
		lda	FACM
		anda	#$7f
		tst	FACSGN
		bpl	1F
		ora	#$80
1		sta	1,u
		lda	FACM+1
		sta	2,u
		ldd	FACM+2
		std	3,u
		puls	d,pc

; ---------- ביטוי עם השוואה ----------
; rexpr: ביטוי [< = > <= >= <>] ביטוי. אמת = -1, שקר = 0, כמו במקור
rexpr		lbsr	expr
		lbsr	skipsp
		clrb			; B: 1 = קטן, 2 = שווה, 4 = גדול
1		cmpa	#'<
		bne	2F
		orb	#1
		bra	4F
2		cmpa	#'=
		bne	3F
		orb	#2
		bra	4F
3		cmpa	#'>
		bne	5F
		orb	#4
4		leax	1,x
		lda	,x
		bra	1B
5		tstb
		beq	6F
		pshs	b
		tst	VALTYP
		bne	12F
		lbsr	pushfac
		lbsr	expr
		lbsr	neednum
		lbsr	poparg		; ARG = השמאלי, FAC = הימני
		lbsr	fcmp		; A: FAC מול ARG
		bra	13F
12		lbsr	pushstr		; השוואת מחרוזות, לפי סדר האותיות
		lbsr	expr
		lbsr	needstr
		lbsr	str_cmp		; A: הימני מול השמאלי
		clr	VALTYP
13
		; השמאלי מול הימני הפוך מ-FAC מול ARG
		ldb	#2		; שווה
		tsta
		beq	7F
		ldb	#1		; השמאלי קטן (הימני גדול)
		tsta
		bpl	7F
		ldb	#4
7		andb	,s+
		beq	8F
		ldd	#-1
		lbra	givd
8		ldd	#0
		lbra	givd
6		rts

; ---------- שגיאות נוספות ----------
err_ul		leau	m_ul,pcr
		lbra	error
err_nf		leau	m_nf,pcr
		lbra	error
err_om		leau	m_om,pcr
		lbra	error
m_ul		fcc	"?UL ERROR"
		fcb	0
m_nf		fcc	"?NF ERROR"
		fcb	0
m_om		fcc	"?OM ERROR"
		fcb	0
m_break		fcc	"BREAK"
		fcb	0
do_break	leau	m_break,pcr
brk_msg		lbra	error
