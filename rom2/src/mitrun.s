; Dragon 1982 BASIC — ניסוי שלב 1ב: לולאת הפקודות, ביטויים, משתנים, ופקודות בסיסיות.
; תרגום ל-6809 של המבנה של BASIC-M6502 (mit). ה-6502 משתמש בטריקים של המחסנית שלו
; (כתובות חזרה ב-PHA), ולכן הם תורגמו לפי האלגוריתם: אותה טבלת קדימויות, אותו סדר עבודה.
; הכתובות לפי ה-Dragon (קורא: TXTPTR $A6, CURLIN $68, VARNAM $37, VARPNT $39, FORPNT $3B, VALTYP $06,
; OPMASK $3F, רשומת FOR של 18 בתים).
;
; Portions translated from Microsoft BASIC-M6502, Copyright (c) Microsoft Corporation, MIT License.

VALTYP		equ	$06
VARNAM		equ	$37
VARPNT		equ	$39
FORPNT		equ	$3b
OPMASK		equ	$3f
CURLIN		equ	$68
TXTPTR		equ	$a6

; ---------- קריאת תו (mit: CHRGET 961) ----------
; chrget: מתקדמים תו אחד. chrgot: התו הנוכחי. מדלגים על רווחים.
; A = התו. Z=1 בסוף פקודה (0 או :). C=0 אם ספרה
chrget		ldx	TXTPTR
		leax	1,x
		stx	TXTPTR
chrgot		ldx	TXTPTR
		lda	,x
		cmpa	#$20
		beq	chrget
		cmpa	#':
		beq	1F
		tsta
		beq	1F
		cmpa	#'0
		blo	2F
		cmpa	#'9
		bhi	2F
		andcc	#$fa		; ספרה: C=0, Z=0
		rts
2		orcc	#1		; לא ספרה: C=1, Z=0
		andcc	#$fb
		rts
1		orcc	#5		; סוף פקודה: C=1, Z=1
		rts

; synchk: התו הנוכחי חייב להיות A. אחרת ?SN. אחר כך מתקדמים
synchk		pshs	a
		lbsr	chrgot
		cmpa	,s+
		lbne	err_sn
		lbra	chrget

; ---------- לולאת הפקודות (mit: NEWSTT 2138, GONE 2165) ----------
; TXTPTR מצביע על התו שלפני הפקודה הבאה. 0 = סוף שורה: הקישור שאחריו אומר מה הלאה
newstt		ldx	TXTPTR
		lda	,x
		bne	2F
		ldd	1,x		; הקישור
		lbeq	endcon		; סוף התוכנית (או סוף השורה הישירה)
		ldd	3,x
		std	CURLIN
		leax	4,x
		stx	TXTPTR
gone		lbsr	chrget
		bsr	gone3
		bra	newstt
2		cmpa	#':
		beq	gone
		lbra	err_sn
gone3		beq	9F		; פקודה ריקה
		tsta
		lbpl	let		; לא מילה שמורה: השמה
		leau	stmdsp,pcr
1		ldb	,u
		beq	3F
		cmpa	,u
		beq	2F
		leau	3,u
		bra	1B
2		ldd	1,u
		leau	stmdsp,pcr
		leau	d,u
		pshs	u
		lbra	chrget		; קופצים לפקודה (דרך ה-RTS של chrget), A = התו שאחרי המילה
3		lbra	err_sn
9		rts
; טבלת הפקודות של הניסוי: טוקן, כתובת יחסית
stmdsp		fcb	$80
		fdb	for-stmdsp
		fcb	$81
		fdb	go-stmdsp
		fcb	$82
		fdb	rem-stmdsp
		fcb	$83
		fdb	rem-stmdsp
		fcb	$87
		fdb	print-stmdsp
		fcb	$8a
		fdb	end-stmdsp
		fcb	$8b
		fdb	next-stmdsp
		fcb	$8e
		fdb	let-stmdsp
		fcb	$8f
		fdb	run-stmdsp
		fcb	$95
		fdb	list_st-stmdsp
		fcb	$97
		fdb	new_st-stmdsp
		fcb	0

rem		ldx	TXTPTR		; עד סוף השורה
1		lda	,x
		beq	2F
		leax	1,x
		bra	1B
2		stx	TXTPTR
		rts

end		lbra	endcon

; RUN: משתנים מתאפסים, ומתחילים מהשורה הראשונה (TXTPTR = TXTTAB-1, האפס שב-$1E00)
run		lbsr	runc
		lds	#STACKINI
		clr	,-s		; סמן תחתית למחסנית ה-FOR (mit: STKINI)
		ldx	TXTTAB
		leax	-1,x
		stx	TXTPTR
		lbra	newstt

; GO TO / GO SUB (mit: GOTO 2391). בניסוי רק GOTO
go		cmpa	#$bc		; TO
		lbne	err_sn
		lbsr	chrget
		lbsr	lineget
		lbsr	fndlin
		lbcc	err_ul
		leay	-1,y		; TXTPTR = הבית שלפני השורה (ה-0 של השורה הקודמת)
		sty	TXTPTR
		rts
; lineget: מספר שורה מהטקסט (TXTPTR) ל-D
lineget		ldx	TXTPTR
		lbsr	linget
		stx	TXTPTR
		pshs	d
		lbsr	chrgot
		puls	d,pc

list_st		ldx	TXTPTR		; LIST: אותה שגרה כמו במצב ישיר
		lbsr	do_list
		lbra	rem
new_st		lbsr	scrtch
		lbra	endcon

; ---------- LET (mit: LET 2540) ----------
let		ldb	#0		; יוצרים משתנה אם אין
		lbsr	ptrget
		ldd	VARPNT
		std	FORPNT
		lda	VALTYP
		pshs	a
		lda	#$cb		; =
		lbsr	synchk
		lbsr	frmevl
		puls	a
		cmpa	VALTYP
		lbne	err_tm
		ldx	FORPNT
		tsta
		lbeq	movmf
; מחרוזת: מעתיקים אותה לשטח המחרוזות אם היא לא שם ולא בתוך התוכנית (mit: GETSPT/COPY)
		ldx	FACMO
		ldd	2,x
		cmpd	FRETOP
		bhi	2F		; כבר בשטח המחרוזות
		cmpd	VARTAB
		blo	2F		; בתוך התוכנית
		lda	,x
		lbsr	strini
		ldx	DSCPNT
		lda	,x
		ldx	2,x
		lbsr	movstr
		ldx	#DSCTMP
		bra	3F
2		ldx	FACMO
3		stx	DSCPNT
		lbsr	fretms		; משחררים את הזמני (בלי לשחרר את המקום)
		ldx	DSCPNT
		ldu	FORPNT
		lda	,x		; רק האורך והכתובת מתעדכנים (קורא)
		sta	,u
		ldd	2,x
		std	2,u
		rts


; ---------- PRINT (mit: PRINT 2669), בניסוי: מספרים, מחרוזות במרכאות, ; ו-, ----------
print		beq	pr_cr
pr_lp		cmpa	#';
		beq	pr_semi
		cmpa	#',
		beq	pr_comma
		lbsr	frmevl
		tst	VALTYP
		beq	3F
		lbsr	strprt		; מחרוזת
		lbsr	chrgot
		lbeq	pr_cr
		lbra	pr_lp
3		lbsr	fout
		ldx	#FBUFFR
1		lda	,x+
		beq	2F
		lbsr	putc
		bra	1B
2		lda	#$20		; רווח אחרי מספר
		lbsr	putc
		lbsr	chrgot
		beq	pr_cr
		bra	pr_lp
pr_semi		lbsr	chrget
		bne	pr_lp
		rts			; ; בסוף: בלי שורה חדשה
pr_comma	lda	CURSOR+1	; לעמודה הבאה שמתחלקת ב-16
		anda	#$0f
		pshs	a
		lda	#$20
		lbsr	putc
		puls	a
		lda	CURSOR+1
		anda	#$0f
		bne	pr_comma
		lbsr	chrget
		bne	pr_lp
		rts
pr_cr		lda	#13
		lbra	putc

; ---------- FOR / NEXT (mit: FOR 2081, NEXT 3110) ----------
; רשומה במחסנית, מהכתובת הנמוכה: $80, כתובת המשתנה (2), הצעד (5), סימן הצעד (1), העד (5),
; מספר השורה (2), המקום בטקסט אחרי ה-FOR (2) — 18 בתים (קורא)
for		lbsr	let		; המשתנה מקבל את ערך ההתחלה
		ldd	VARPNT
		std	FORPNT
		leas	2,s		; בלי החזרה ל-gone: הרשומה נכנסת מתחתיה (mit: NOTOL)
		lbsr	fndfor		; אותו משתנה כבר בלולאה? מוחקים אותה ומה שמעליה
		bne	2F
		leas	18,x		; X = הרשומה
2		lda	#$bc		; TO
		lbsr	synchk
		lbsr	frmevl		; העד
		ldx	#TEMPLIM
		lbsr	movmf
		leax	fone,pcr	; צעד ברירת מחדל 1
		lbsr	movfm
		lbsr	chrgot
		cmpa	#$c1		; STEP
		bne	3F
		lbsr	chrget
		lbsr	frmevl
3		lbsr	sign
		pshs	a		; סימן הצעד (זמני)
		ldx	#TEMPSTP
		lbsr	movmf
		puls	a
		sta	TEMPSGN
		; הסוף של פקודת ה-FOR: מכאן ממשיכים אחרי כל NEXT
		lbsr	stmend		; X = המקום
		; בונים את הרשומה: דוחפים מהסוף להתחלה
		pshs	x		; [16-17] הטקסט
		ldd	CURLIN
		pshs	d		; [14-15] השורה
		ldx	#TEMPLIM	; [9-13] העד
		ldb	#5
		abx
4		lda	,-x
		pshs	a
		cmpx	#TEMPLIM
		bhi	4B
		lda	TEMPSGN
		pshs	a		; [8] סימן הצעד
		ldx	#TEMPSTP+5	; [3-7] הצעד
5		lda	,-x
		pshs	a
		cmpx	#TEMPSTP
		bhi	5B
		ldd	FORPNT
		pshs	d		; [1-2] המשתנה
		lda	#$80
		pshs	a		; [0] FOR
		ldx	TXTPTR		; ממשיכים מסוף ה-FOR
		lbra	newstt
TEMPLIM		equ	$03e0		; זמני: העד, בתוך FBUFFR שלא בשימוש כאן
TEMPSTP		equ	$03ea-5
TEMPSGN		equ	$03df
RELSAV		equ	$03da		; זמני: המקום לפני סימן יחס

; stmend: X = הסוף של הפקודה הנוכחית (: או 0), בלי להזיז את TXTPTR (mit: DATAN)
stmend		ldx	TXTPTR
1		lda	,x
		beq	9F
		cmpa	#':
		beq	9F
		cmpa	#'"
		bne	2F
3		leax	1,x
		lda	,x
		beq	9F
		cmpa	#'"
		bne	3B
2		leax	1,x
		bra	1B
9		rts			; X על ה-: או ה-0 (שם newstt ממשיך)

; fndfor: מחפש במחסנית (מ-S, אחרי כתובת החזרה של fndfor עצמה) רשומת FOR של המשתנה FORPNT.
; Z=1 ו-X = הרשומה אם נמצאה. FORPNT=0: הרשומה העליונה
fndfor		leax	2,s
1		lda	,x
		cmpa	#$80
		bne	8F
		ldd	FORPNT
		beq	9F
		cmpd	1,x
		beq	9F
		leax	18,x
		bra	1B
8		andcc	#$fb
		rts
9		orcc	#4
		rts

; NEXT [משתנה[,משתנה]]
next		leas	2,s
nx_one		ldd	#0
		std	FORPNT
		lbsr	chrgot
		beq	1F
		ldb	#1		; לא יוצרים
		lbsr	ptrget
		ldd	VARPNT
		std	FORPNT
1		lbsr	fndfor
		lbne	err_nf
		leas	,x		; S = הרשומה (מה שמעליה נמחק)
		ldx	1,s		; המשתנה += הצעד
		lbsr	movfm
		leax	3,s
		lbsr	fadd
		ldx	1,s
		lbsr	movmf
		leax	9,s		; משווים לעד
		lbsr	fcomp
		suba	8,s		; אותו סימן כמו הצעד: עברנו את העד
		beq	2F
		ldd	14,s		; עוד סיבוב
		std	CURLIN
		ldx	16,s
		stx	TXTPTR
		lbra	newstt
2		leas	18,s		; הלולאה נגמרה
		lbsr	chrgot
		cmpa	#',
		bne	3F
		lbsr	chrget
		bra	nx_one
3		lbra	newstt

; ---------- משתנים (mit: PTRGET 3626, NOTFNS 3709) ----------
; משתנה פשוט: [שם 2][ערך 5] בין VARTAB ל-ARYTAB. B=1: לא יוצרים (קריאה בביטוי מחזירה 0)
ptrget		pshs	b
		clr	VALTYP
		lbsr	chrgot
		cmpa	#'A
		lblo	err_sn
		cmpa	#'Z
		lbhi	err_sn
		sta	VARNAM
		clr	VARNAM+1
		lbsr	chrget
		bcc	1F		; ספרה
		cmpa	#'A
		blo	3F
		cmpa	#'Z
		bhi	3F
1		sta	VARNAM+1
2		lbsr	chrget		; שאר האותיות והספרות לא נחשבות
		bcc	2B
		cmpa	#'A
		blo	3F
		cmpa	#'Z
		bls	2B
3		cmpa	#'$		; מחרוזת: ביט 7 בתו השני של השם (ספר)
		bne	11F
		lda	VARNAM+1
		ora	#$80
		sta	VARNAM+1
		com	VALTYP
		lbsr	chrget
11		ldx	VARTAB
4		cmpx	ARYTAB
		beq	5F
		ldd	,x
		cmpd	VARNAM
		beq	6F
		leax	7,x
		bra	4B
5		tst	,s+		; לא נמצא
		beq	7F
		leax	zero5,pcr	; קריאה בביטוי: אפס, בלי ליצור (קורא)
		stx	VARPNT
		rts
7		ldx	STREND		; יוצרים: מזיזים את המערכים 7 בתים למעלה
		leay	7,x
		sty	STREND
8		cmpx	ARYTAB
		bls	9F
		lda	,-x
		sta	,-y
		bra	8B
9		ldx	ARYTAB
		leay	7,x
		sty	ARYTAB
		ldd	VARNAM
		std	,x
		clr	2,x
		clr	3,x
		clr	4,x
		clr	5,x
		clr	6,x
		bra	10F
6		leas	1,s
10		leax	2,x
		stx	VARPNT
		rts
zero5		fcb	0,0,0,0,0

; ---------- ביטויים (mit: FRMEVL 3195, EVAL 3323, OPTAB 1084) ----------
; frmevl: ביטוי מ-TXTPTR (התו הנוכחי) → FAC. מטפס לפי קדימויות, כמו טבלת OPTAB של mit
frmevl		clrb
fexpr		pshs	b		; הקדימות המינימלית
		lbsr	eval
fe_lp		clr	OPMASK
		ldx	TXTPTR
		stx	RELSAV
		lbsr	chrgot
1		cmpa	#$ca		; > = < : בונים מסכה (mit: LOPREL)
		blo	3F
		cmpa	#$cc
		bhi	3F
		suba	#$ca
		ldb	#1
		tsta
		beq	2F
		ldb	#2
		deca
		beq	2F
		ldb	#4
2		pshs	b
		orb	OPMASK
		cmpb	OPMASK		; אותו סימן פעמיים
		puls	a
		lbls	err_sn
		stb	OPMASK
		lbsr	chrget
		bra	1B
3		ldb	OPMASK
		beq	4F
		ldb	#100		; יחס: קדימות 100 (mit: PTDORL)
		cmpb	,s
		bhi	5F
		ldx	RELSAV		; לא עכשיו: מחזירים את הסימנים לטקסט
		stx	TXTPTR
		lbra	9F
5		leau	dorel,pcr
		bra	7F
4		cmpa	#$c3		; + - * / ^ AND OR
		lblo	9F
		cmpa	#$c9
		lbhi	9F
		cmpa	#$c7		; ^: לא בניסוי
		lbeq	err_sn
		suba	#$c3
		ldb	#3
		mul
		leax	optab,pcr
		abx
		ldb	,x		; הקדימות
		cmpb	,s		; לא גבוהה מהמינימלית: מסיימים כאן
		bls	9F
		pshs	b
		ldd	1,x
		leau	optab,pcr
		leau	d,u
		lbsr	chrget		; מדלגים על הסימן
		puls	b
7		pshs	b		; שומרים את הצד השמאלי, מחשבים את הימני, ומפעילים
		tst	VALTYP
		bne	71F		; מחרוזת: אין מה לעגל
		lbsr	round
71		puls	b
		pshs	u
		lda	VALTYP
		pshs	a
		lda	OPMASK
		pshs	a
		lda	FACSGN
		pshs	a
		ldx	FACMO
		pshs	x
		ldx	FACHO
		pshs	x
		lda	FACEXP
		pshs	a
		lbsr	fexpr		; הצד הימני, עם הקדימות של הסימן
		puls	a
		sta	ARGEXP
		puls	x
		stx	ARGHO
		puls	x
		stx	ARGMO
		puls	a
		sta	ARGSGN
		eora	FACSGN
		sta	ARISGN
		puls	a
		sta	OPMASK
		puls	a		; הסוג של השמאלי
		puls	u
		cmpa	VALTYP		; שני הצדדים מאותו סוג (mit: CHKVAL)
		lbne	err_tm
		tsta
		beq	72F
		leax	dorel,pcr	; מחרוזות: רק יחס או +
		pshs	x
		cmpu	,s++
		beq	72F
		leax	faddt,pcr
		pshs	x
		cmpu	,s++
		lbne	err_tm
		lbsr	cat
		lbra	fe_lp
72		jsr	,u		; FAC = ARG op FAC
		lbra	fe_lp
9		puls	b,pc
; טבלת הסימנים: קדימות, כתובת יחסית ל-optab (mit: OPTAB)
optab		fcb	121
		fdb	faddt-optab
		fcb	121
		fdb	fsubt-optab
		fcb	123
		fdb	fmultt-optab
		fcb	123
		fdb	fdivt-optab
		fcb	127
		fdb	0
		fcb	80
		fdb	andop-optab
		fcb	70
		fdb	orop-optab

; eval: איבר אחד → FAC
eval		clr	VALTYP
		lbsr	chrgot
		lbcc	fin		; מספר
		cmpa	#'.
		lbeq	fin
		cmpa	#$c4		; - חד-מקומי: קדימות 125
		bne	1F
		lbsr	chrget
		ldb	#125
		lbsr	fexpr
		lbra	negop
1		cmpa	#$c3		; +
		bne	2F
		lbsr	chrget
		bra	eval
2		cmpa	#$c0		; NOT: קדימות 90
		bne	3F
		lbsr	chrget
		ldb	#90
		lbsr	fexpr
		lbsr	ayint
		ldd	FACMO
		coma
		comb
		lbra	givd
3		cmpa	#'"		; מחרוזת במרכאות (mit: STRTXT)
		bne	31F
		ldx	TXTPTR
		leax	1,x
		lbsr	strlit
		ldx	STRNG2
		stx	TXTPTR
		rts
31		cmpa	#'(
		bne	4F
		lbsr	chrget
		lbsr	frmevl
		lda	#')
		lbra	synchk
4		cmpa	#$ff		; פונקציה: טבלה לפי הטוקן (mit: ISFUN)
		bne	5F
		ldx	TXTPTR
		lda	1,x
		leax	1,x
		stx	TXTPTR
		leau	fndsp,pcr
41		ldb	,u
		lbeq	err_sn
		cmpa	,u
		beq	42F
		leau	4,u
		bra	41B
42		ldd	2,u
		leax	fndsp,pcr
		leax	d,x
		pshs	x		; הכתובת
		lda	1,u		; 0: ארגומנט אחד בסוגריים; 1: השגרה קוראת בעצמה
		pshs	a
		lbsr	chrget
		lda	#'(
		lbsr	synchk
		puls	a
		tsta
		bne	43F
		lbsr	frmevl
		lda	#')
		lbsr	synchk
43		rts			; קופצים לשגרה
5		cmpa	#'A
		lblo	err_sn
		cmpa	#'Z
		lbhi	err_sn
		ldb	#1		; משתנה: בלי ליצור
		lbsr	ptrget
		ldx	VARPNT
		tst	VALTYP
		lbeq	movfm
		stx	FACMO		; מחרוזת: FAC מצביע על המתאר שבמשתנה (mit: ISVRET)
		rts

; טבלת הפונקציות: טוקן, סוג, כתובת יחסית
fndsp		fcb	$80,0
		fdb	fn_sgn-fndsp
		fcb	$81,0
		fdb	fn_int-fndsp
		fcb	$82,0
		fdb	fn_abs-fndsp
		fcb	$8d,0
		fdb	fn_len-fndsp
		fcb	$90,0
		fdb	fn_asc-fndsp
		fcb	$91,0
		fdb	fn_chr-fndsp
		fcb	$96,1
		fdb	fn_left-fndsp
		fcb	$97,1
		fdb	fn_right-fndsp
		fcb	$98,1
		fdb	fn_mid-fndsp
		fcb	0
fn_sgn		lbsr	chknum
		lbsr	sign
		lbra	float
fn_int		lbsr	chknum
		lbra	fint
fn_abs		lbsr	chknum
		clr	FACSGN
		rts
chknum		tst	VALTYP
		lbne	err_tm
		rts
; left$ / right$ / mid$: (מחרוזת,מספר[,מספר]) (mit: LEFT, RIGHT, MID, PREAM)
fn_left		bsr	strarg
		cmpb	,x
		bls	1F
		ldb	,x
1		tfr	b,a
		clrb
		lbra	substr
fn_right	bsr	strarg
		cmpb	,x
		bls	1F
		ldb	,x
1		pshs	b
		lda	,x
		suba	,s
		tfr	a,b		; התחלה = אורך - כמה
		puls	a
		lbra	substr
fn_mid		lbsr	frmevl
		lbsr	frestr0
		pshs	x		; המתאר
		lda	#',
		lbsr	synchk
		lbsr	frmevl
		lbsr	conint
		tstb
		lbeq	err_fc		; אין מקום 0
		decb
		pshs	b		; ההתחלה
		ldb	#255		; ברירת מחדל: עד הסוף
		lbsr	chrgot
		cmpa	#',
		bne	1F
		lbsr	chrget
		lbsr	frmevl
		lbsr	conint
1		pshs	b
		lda	#')
		lbsr	synchk
		puls	a		; כמה
		puls	b		; התחלה
		puls	x
		pshs	a
		lda	,x
		pshs	b
		suba	,s+		; נשאר = אורך - התחלה
		bhi	2F
		clra			; התחלה מעבר לסוף: מחרוזת ריקה
		leas	1,s
		lbra	substr
2		cmpa	,s
		bls	3F
		lda	,s
3		leas	1,s
		lbra	substr
; strarg: (מחרוזת,מספר) → X = המתאר, B = המספר (0-255)
strarg		lbsr	frmevl
		bsr	frestr0
		pshs	x
		lda	#',
		lbsr	synchk
		lbsr	frmevl
		lbsr	conint
		pshs	b
		lda	#')
		lbsr	synchk
		puls	b
		puls	x,pc
frestr0		tst	VALTYP		; מחרוזת? X = המתאר (בלי לשחרר עדיין)
		lbeq	err_tm
		ldx	FACMO
		rts
; conint: FAC → B בין 0 ל-255, אחרת ?FC (mit: CONINT)
conint		lbsr	chknum
		lbsr	ayint
		ldd	FACMO
		tsta
		lbne	err_fc
		rts

; AND / OR (mit: ANDOP 3520, OROP 3518): על מספרים שלמים בין -32768 ל-32767
andop		clra
		bra	1F
orop		lda	#$ff
1		sta	OPMASK		; כאן: המשלים (דה-מורגן, כמו ב-mit)
		lbsr	ayint
		ldd	FACMO
		eora	OPMASK
		eorb	OPMASK
		pshs	d
		lbsr	movfa
		lbsr	ayint
		ldd	FACMO
		eora	OPMASK
		eorb	OPMASK
		anda	,s+
		andb	,s+
		eora	OPMASK
		eorb	OPMASK
		lbra	givd

; dorel: יחס (mit: DOREL 3547, DOCMP 3590). OPMASK: 1 = >, 2 = =, 4 = <. התוצאה -1 או 0
dorel		tst	VALTYP
		beq	1F
		lbsr	strcmp		; מחרוזות (A כמו של fcomp)
		bra	2F
1		lda	ARGSGN		; אורזים את ARG ומשווים
		ora	#$7f
		anda	ARGHO
		sta	ARGHO
		ldx	#ARGEXP
		lbsr	fcomp		; A = הסימן של FAC פחות ARG
2		; ARG ? FAC: אם FAC < ARG אז ARG > FAC
		ldb	#1		; ARG > FAC
		cmpa	#$ff
		beq	1F
		ldb	#2		; שווים
		tsta
		beq	1F
		ldb	#4		; ARG < FAC
1		andb	OPMASK
		beq	3F
		lda	#$ff
		lbra	float
3		clra
		lbra	float
