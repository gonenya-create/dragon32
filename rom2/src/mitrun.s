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

; ---------- קריאת תו (mit: CHRGET 961; ה-Dragon: ב-RAM, $9F-$AA — קורא: מפרט הזיכרון) ----------
; chrget ($9F): מתקדמים תו אחד. chrgot ($A5): התו הנוכחי. TXTPTR ($A6) הוא האופרנד של ה-LDA שם.
; 12 הבתים מועתקים ל-RAM בהדלקה; ההמשך כאן ב-ROM. מדלגים על רווחים.
; A = התו, X = TXTPTR. Z=1 בסוף פקודה (0 או :). C=0 אם ספרה
chrget		equ	$9f
chrgot		equ	$a5
chrtpl		fcb	$0c,$a7		; inc <$A7
		fcb	$26,$02		; bne $A5
		fcb	$0c,$a6		; inc <$A6
		fcb	$b6,0,0		; lda >TXTPTR
		fcb	$7e		; jmp chrest
		fdb	chrest
chrest		ldx	TXTPTR
		cmpa	#$20
		bne	3F
		jmp	<chrget
3		cmpa	#':
		bhs	2F
		tsta
		beq	1F
		cmpa	#'0		; מתחת ל-'0': C=1, Z=0
		blo	9F
		andcc	#$fa		; ספרה: C=0, Z=0
9		rts
2		beq	1F
		orcc	#1		; אות וכו': C=1, Z=0
		rts
1		orcc	#5		; סוף פקודה: C=1, Z=1
		rts

; synchk: התו הנוכחי חייב להיות A. אחרת ?SN. אחר כך מתקדמים
; chkrp / chkcom / chklp: ')' / ',' / '(' חייבים להיות כאן (כמו SYNRPR/SYNCOM במקור)
chkrp		lda	#')
		bra	synchk
chkcom		lda	#',
		bra	synchk
chklp		lda	#'(
synchk		pshs	a
		jsr	<chrgot
		cmpa	,s+
		lbne	err_sn
		jmp	<chrget

; ---------- לולאת הפקודות (mit: NEWSTT 2138, GONE 2165) ----------
; TXTPTR מצביע על התו שלפני הפקודה הבאה. 0 = סוף שורה: הקישור שאחריו אומר מה הלאה
newstt		lbsr	brkchk		; BREAK? (mit: ISCNTC)
		ldx	TXTPTR
		stx	TXTBEG		; תחילת הפקודה: לשם חוזרים אחרי קלט שגוי ב-INPUT (קורא: TXTBEG)
		lda	,x
		bne	2F
		ldd	1,x		; הקישור
		lbeq	endcon		; סוף התוכנית (או סוף השורה הישירה)
		ldd	3,x
		std	CURLIN
		leax	4,x
		stx	TXTPTR
		lbsr	trace		; TRON: [n] (קורא)
gone		jsr	<chrget
		bsr	gone3
		bra	newstt
2		cmpa	#':
		beq	gone
		lbra	err_sn
gone3		beq	9F		; פקודה ריקה
		tsta
		lbpl	let		; לא מילה שמורה: השמה
		cmpa	#$ff		; פונקציה בתחילת פקודה: TIMER= (קורא)
		bne	1F
		ldx	TXTPTR
		lda	1,x
		cmpa	#$9e
		lbeq	timset
		cmpa	#$98		; MID$ כפקודה (קורא)
		lbeq	midst
		lbra	err_sn
1		cmpa	#$ba
		bhi	3F
		suba	#$80
		lsla
		leau	stmtbl,pcr
		ldu	a,u
		pshs	u
		jmp	<chrget		; קופצים לפקודה (דרך ה-RTS של chrget), A = התו שאחרי המילה
3		lbra	err_sn
9		rts
; טבלת הפקודות לפי הטוקן ($80-$BA), כתובת לכל אחת. עוד לא בנויה: ?SN
stmtbl
		fdb	for		; $80 FOR
		fdb	go		; $81 GO
		fdb	rem		; $82 REM
		fdb	rem		; $83 '
		fdb	rem		; $84 ELSE
		fdb	if		; $85 IF
		fdb	data		; $86 DATA
		fdb	print		; $87 PRINT
		fdb	on		; $88 ON
		fdb	input		; $89 INPUT
		fdb	end		; $8A END
		fdb	next		; $8B NEXT
		fdb	dim		; $8C DIM
		fdb	read		; $8D READ
		fdb	let		; $8E LET
		fdb	run		; $8F RUN
		fdb	restore		; $90 RESTORE
		fdb	return		; $91 RETURN
		fdb	stop		; $92 STOP
		fdb	poke		; $93 POKE
		fdb	cont		; $94 CONT
		fdb	list_st		; $95 LIST
		fdb	clear		; $96 CLEAR
		fdb	new_st		; $97 NEW
		fdb	def		; $98 DEF
		fdb	err_sn		; $99 CLOAD
		fdb	err_sn		; $9A CSAVE
		fdb	err_sn		; $9B OPEN
		fdb	err_sn		; $9C CLOSE
		fdb	err_sn		; $9D LLIST
		fdb	set_st		; $9E SET
		fdb	reset_st		; $9F RESET
		fdb	cls_st		; $A0 CLS
		fdb	err_sn		; $A1 MOTOR
		fdb	err_sn		; $A2 SOUND
		fdb	err_sn		; $A3 AUDIO
		fdb	exec		; $A4 EXEC
		fdb	err_sn		; $A5 SKIPF
		fdb	del_st		; $A6 DEL
		fdb	edit_st		; $A7 EDIT
		fdb	tron		; $A8 TRON
		fdb	troff		; $A9 TROFF
		fdb	line_st		; $AA LINE
		fdb	pcls_st		; $AB PCLS
		fdb	pset_st		; $AC PSET
		fdb	preset_st		; $AD PRESET
		fdb	screen_st		; $AE SCREEN
		fdb	pclear		; $AF PCLEAR
		fdb	color_st		; $B0 COLOR
		fdb	circle_st	; $B1 CIRCLE
		fdb	paint_st	; $B2 PAINT
		fdb	err_sn		; $B3 GET
		fdb	err_sn		; $B4 PUT
		fdb	err_sn		; $B5 DRAW
		fdb	pcopy_st		; $B6 PCOPY
		fdb	pmode_st		; $B7 PMODE
		fdb	err_sn		; $B8 PLAY
		fdb	err_sn		; $B9 DLOAD
		fdb	renum		; $BA RENUM

rem		ldx	TXTPTR		; עד סוף השורה
1		tst	,x+
		bne	1B
		leax	-1,x
		stx	TXTPTR
		rts

; RUN [שורה]: משתנים מתאפסים, ומתחילים מהשורה הראשונה (TXTPTR = TXTTAB-1, האפס שב-$1E00) או מהשורה שצוינה
; (mit: RUN — CLEARC ואז GOTO)
run		lbsr	gfxrun		; הנקודה האחרונה, זווית וקנה מידה של DRAW (קורא 0.2)
		lbsr	runc
		lds	STKTOP
		clr	,-s		; סמן תחתית למחסנית ה-FOR (mit: STKINI)
		jsr	<chrgot
		beq	1F
		lbcs	err_sn		; RUN "שם": עם הקלטת, בהמשך
		bsr	goto1
		lbra	newstt
1		ldx	TXTTAB
		leax	-1,x
		stx	TXTPTR
		lbra	newstt

; GO TO / GO SUB (mit: GOTO 2391, GOSUB 2373)
go		cmpa	#$bc		; TO
		beq	1F
		cmpa	#$bd		; SUB
		lbne	err_sn
		jsr	<chrget
; gosub1: TXTPTR על מספר השורה. רשומה של 5 בתים, מהכתובת הנמוכה: $BD, השורה הקוראת, המקום בטקסט —
; לפני מספר השורה; RETURN חוזר לשם ומדלג עד סוף הפקודה (קורא)
gosub1					; כתובת החזרה של הפקודה נשארת מתחת לרשומה, כמו במקור (קורא: 7 בתים)
		ldb	#5
		lbsr	getstk
		ldy	TXTPTR
		ldx	CURLIN
		lda	#$bd
		pshs	y,x,a
		bsr	goto1
		lbra	newstt
1		jsr	<chrget
; goto1: TXTPTR על מספר השורה. שורה גדולה מהנוכחית: מחפשים מהשורה הבאה; אחרת מההתחלה (mit: GOTO)
goto1		bsr	lineget
		cmpd	CURLIN
		bls	2F		; גם במצב ישיר (CURLIN = $FFFF): מההתחלה
		ldy	TXTPTR		; סוף השורה הנוכחית
3		tst	,y+
		bne	3B
		lbsr	fndlnc
		bra	4F
2		lbsr	fndlin
4		lbcc	err_ul
		leay	-1,y		; TXTPTR = הבית שלפני השורה (ה-0 של השורה הקודמת)
		sty	TXTPTR
		rts
; lineget: מספר שורה מהטקסט (TXTPTR) ל-D
lineget		ldx	TXTPTR
		lbsr	linget
		stx	TXTPTR
		pshs	d
		jsr	<chrgot
		puls	d,pc

list_st		ldx	TXTPTR		; LIST: אותה שגרה כמו במצב ישיר
		lbsr	do_list
		lbra	rem
new_st		lbsr	scrtch
		lds	STKTOP
		clr	,-s
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
; letasg: FAC → המשתנה ש-FORPNT מצביע עליו (גם READ ו-INPUT) (mit: INPCOM)
letasg		ldx	FORPNT
		tst	VALTYP
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
; כמו במקור: הפקודה קוראת לטיפול ברשימה (עוד רמה במחסנית; MEM תלוי בה — קורא)
print		bsr	prlist
		rts
prlist		beq	pr_cr
		cmpa	#$cd		; PRINT USING (קורא)
		lbeq	usstart
		cmpa	#'@		; PRINT @n (קורא): 0-511, אחרת ?FC; אחריו פסיק אם יש המשך, וסוף = שורה חדשה
		bne	pr_lp
		jsr	<chrget
		lbsr	frmevl
		lbsr	getadr
		cmpd	#511
		lbhi	err_fc
		addd	#SCREEN
		std	CURSOR
		jsr	<chrgot
		beq	pr_cr
		lbsr	chkcom
		beq	pr_cr
		cmpa	#$cd		; PRINT @n,USING
		lbeq	usstart
pr_lp		cmpa	#';
		beq	pr_semi
		cmpa	#',
		beq	pr_comma
		lbsr	frmevl
		tst	VALTYP
		beq	3F
		lbsr	strprt		; מחרוזת
		bra	4F
3		lbsr	fout
		ldx	#FBUFFR
		lbsr	puts
		lda	#$20		; רווח אחרי מספר
		lbsr	putc
4		jsr	<chrgot
		beq	pr_cr
		bra	pr_lp
pr_semi		jsr	<chrget
		bne	pr_lp
		rts			; ; בסוף: בלי שורה חדשה
pr_comma	lda	CURSOR+1	; פסיק: מעמודות 0-15 רווחים עד 16; מ-16-31 שורה חדשה (קורא: מפרט המסך)
		bita	#$10
		bne	2F
1		lda	#$20
		lbsr	putc
		lda	CURSOR+1
		bita	#$0f
		bne	1B
		bra	3F
2		lda	#13
		lbsr	putc
3		jsr	<chrget
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
		bsr	fndfor		; אותו משתנה כבר בלולאה? מוחקים אותה ומה שמעליה
		bne	2F
		leas	18,x		; X = הרשומה
2		ldb	#18
		lbsr	getstk
		lda	#$bc		; TO
		lbsr	synchk
		lbsr	frmevl		; העד
		ldx	#TEMPLIM
		lbsr	movmf
		leax	fone,pcr	; צעד ברירת מחדל 1
		lbsr	movfm
		jsr	<chrgot
		cmpa	#$c1		; STEP
		bne	3F
		jsr	<chrget
		lbsr	frmevl
3		bsr	stmend		; X = סוף פקודת ה-FOR: מכאן ממשיכים אחרי כל NEXT
		ldd	CURLIN
		pshs	x,d		; [16-17] הטקסט, [14-15] השורה
		leas	-14,s
		lbsr	sign
		sta	8,s		; [8] סימן הצעד
		leax	3,s		; [3-7] הצעד
		lbsr	movmf
		ldx	#TEMPLIM	; [9-13] העד
		ldd	,x
		std	9,s
		ldd	2,x
		std	11,s
		lda	4,x
		sta	13,s
		ldd	FORPNT		; [1-2] המשתנה
		std	1,s
		lda	#$80		; [0] FOR
		sta	,s
		lbra	newstt
TEMPLIM		equ	$03e0		; זמני: העד, בתוך FBUFFR שלא בשימוש כאן
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
		jsr	<chrgot
		beq	1F
		ldb	#1		; לא יוצרים
		bsr	ptrget
		ldd	VARPNT
		std	FORPNT
1		bsr	fndfor
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
		jsr	<chrgot
		cmpa	#',
		bne	3F
		jsr	<chrget
		bra	nx_one
3		lbra	newstt

; ---------- משתנים (mit: PTRGET 3626, NOTFNS 3709) ----------
; משתנה פשוט: [שם 2][ערך 5] בין VARTAB ל-ARYTAB. B=1: לא יוצרים (קריאה בביטוי מחזירה 0)
ptrget		pshs	b
		clr	VALTYP
		jsr	<chrgot
		cmpa	#'A
		lblo	err_sn
		cmpa	#'Z
		lbhi	err_sn
		sta	VARNAM
		clr	VARNAM+1
		jsr	<chrget
		bcc	1F		; ספרה
		cmpa	#'A
		blo	3F
		cmpa	#'Z
		bhi	3F
1		sta	VARNAM+1
2		jsr	<chrget		; שאר האותיות והספרות לא נחשבות
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
		jsr	<chrget
11		lda	SUBFLG		; ביט 6: שם של DEF FN — ביט 7 בתו הראשון (mit: GETFNM)
		bita	#$40
		beq	13F
		lda	VARNAM
		ora	#$80
		sta	VARNAM
13		tst	SUBFLG		; ביט 7: בלי מערכים (הפרמטר והשם של DEF FN)
		bmi	12F
		lda	[TXTPTR]	; ( = מערך (mit: ISARY)
		cmpa	#'(
		bne	12F
		puls	b
		lbra	ary
12		ldx	VARTAB
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
		pshs	x,y		; יש מקום? (mit: REASON)
		tfr	y,d
		lbsr	reason
		puls	x,y
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
		clra
		clrb
		std	2,x
		std	4,x
		sta	6,x
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
		jsr	<chrgot
1		cmpa	#$ca		; > = < : בונים מסכה (mit: LOPREL)
		blo	3F
		cmpa	#$cc
		bhi	3F
		suba	#$c9		; > = <: 1 2 3 → מסכה 1 2 4
		ldb	#1
21		deca
		beq	2F
		lslb
		bra	21B
2		bitb	OPMASK		; אותו סימן פעמיים
		lbne	err_sn
		orb	OPMASK
		stb	OPMASK
		jsr	<chrget
		bra	1B
3		ldb	OPMASK
		beq	4F
		ldb	#100		; יחס: קדימות 100 (mit: PTDORL)
		cmpb	,s
		bhi	5F
		ldx	RELSAV		; לא עכשיו: מחזירים את הסימנים לטקסט
		stx	TXTPTR
		bra	9F
5		ldu	#dorel
		bra	7F
4		cmpa	#$c3		; + - * / ^ AND OR
		blo	9F
		cmpa	#$c9
		bhi	9F
		suba	#$c3
		ldb	#3
		mul
		leax	optab,pcr
		abx
		ldb	,x		; הקדימות
		cmpb	,s		; לא גבוהה מהמינימלית: מסיימים כאן
		bls	9F
		ldu	1,x
		pshs	b
		jsr	<chrget		; מדלגים על הסימן
		puls	b
; שומרים את הצד השמאלי, מחשבים את הימני, ומפעילים. ב-Dragon בלי עיגול לפני השמירה (קורא; ב-mit יש)
7		lda	OPMASK		; בית אחד: המסכה, וביט 7 = השמאלי מחרוזת (כמו במקור: מסגרת של 13 בתים — קורא)
		tst	VALTYP
		beq	73F
		ora	#$80
73		pshs	u,a
		ldx	FACHO		; B = הקדימות: לא לגעת
		ldy	FACMO
		lda	FACSGN
		pshs	y,x,a
		lda	FACEXP
		pshs	a
		bsr	fexpr		; הצד הימני, עם הקדימות של הסימן
		puls	a
		sta	ARGEXP
		puls	a,x,y
		stx	ARGHO
		sty	ARGMO
		sta	ARGSGN
		eora	FACSGN
		sta	ARISGN
		puls	a,u
		tfr	a,b
		anda	#$7f
		sta	OPMASK
		clra			; הסוג של השמאלי
		tstb
		bpl	74F
		deca
74		cmpa	VALTYP		; שני הצדדים מאותו סוג (mit: CHKVAL)
		lbne	err_tm
		tsta
		beq	72F
		cmpu	#dorel		; מחרוזות: רק יחס או +
		beq	72F
		cmpu	#faddt
		lbne	err_tm
		lbsr	cat
		lbra	fe_lp
72		jsr	,u		; FAC = ARG op FAC
		lbra	fe_lp
9		puls	b,pc
; טבלת הסימנים: קדימות, כתובת (mit: OPTAB)
optab		fcb	121
		fdb	faddt
		fcb	121
		fdb	fsubt
		fcb	123
		fdb	fmultt
		fcb	123
		fdb	fdivt
		fcb	127
		fdb	fpwrt
		fcb	80
		fdb	andop
		fcb	70
		fdb	orop

; eval: איבר אחד → FAC
eval		clr	VALTYP
		jsr	<chrgot
		lbcc	fin		; מספר
		cmpa	#'.
		lbeq	fin
		cmpa	#'&		; &H / &O / & (קורא)
		lbeq	radix
		cmpa	#$c4		; - חד-מקומי: קדימות 125
		bne	1F
		jsr	<chrget
		ldb	#125
		pshs	b		; בית בקרה שלא בשימוש (קורא: עומק המחסנית כמו במקור)
		lbsr	fexpr
		leas	1,s
		lbra	negop
1		cmpa	#$c3		; +
		bne	2F
		jsr	<chrget
		bra	eval
2		cmpa	#$c0		; NOT: קדימות 90
		bne	3F
		jsr	<chrget
		ldb	#90
		pshs	b		; בית בקרה שלא בשימוש (קורא)
		lbsr	fexpr
		leas	1,s
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
31		cmpa	#$be		; FN
		lbeq	fndoer
		cmpa	#'(
		bne	4F
		jsr	<chrget
		lbsr	frmevl
		lbra	chkrp
4		cmpa	#$ff		; פונקציה: טבלה לפי הטוקן (mit: ISFUN)
		bne	5F
		ldx	TXTPTR
		lda	1,x
		leax	1,x
		stx	TXTPTR
		cmpa	#$a1
		lbhi	err_sn
		suba	#$80
		lsla
		leau	fntbl,pcr
		ldx	a,u		; ביטים 14-15: הסוג; השאר: הכתובת פחות $8000
		tfr	x,d
		anda	#$3f
		ora	#$80
		pshs	d		; הכתובת
		tfr	x,d
		rola
		rola
		rola
		anda	#3		; 0: ארגומנט אחד בסוגריים; 1: השגרה קוראת בעצמה אחרי '('; 2: בלי סוגריים
		pshs	a
		jsr	<chrget
		puls	b
		cmpb	#2
		beq	43F		; A = התו שאחרי המילה
		pshs	b
		lbsr	chklp
		puls	a
		tsta
		bne	43F
		pshs	a		; מקום למזהה הפונקציה, שנשאר במחסנית בזמן הארגומנט (קורא)
		lbsr	frmevl
		leas	1,s
		lbsr	chkrp
43		jsr	[,s++]		; קוראים לשגרה וחוזרים דרכה, כמו משגר הפונקציות במקור (MEM תלוי בעומק — קורא)
		rts
5		ldb	#1		; משתנה: בלי ליצור (ptrget בודק שזו אות: ?SN)
		lbsr	ptrget
		ldx	VARPNT
		tst	VALTYP
		lbeq	movfm
		stx	FACMO		; מחרוזת: FAC מצביע על המתאר שבמשתנה (mit: ISVRET)
		rts

; טבלת הפונקציות לפי הטוקן ($80-$A1): הכתובת פחות $8000, והסוג בשני הביטים העליונים. עוד לא בנויה: ?SN
fntbl
		fdb	fn_sgn-$8000+0*$4000	; $80 SGN
		fdb	fn_int-$8000+0*$4000	; $81 INT
		fdb	fn_abs-$8000+0*$4000	; $82 ABS
		fdb	fn_pos-$8000+0*$4000	; $83 POS
		fdb	fn_rnd-$8000+0*$4000	; $84 RND
		fdb	fn_sqr-$8000+0*$4000	; $85 SQR
		fdb	fn_log-$8000+0*$4000	; $86 LOG
		fdb	fn_exp-$8000+0*$4000	; $87 EXP
		fdb	fn_sin-$8000+0*$4000	; $88 SIN
		fdb	fn_cos-$8000+0*$4000	; $89 COS
		fdb	fn_tan-$8000+0*$4000	; $8A TAN
		fdb	fn_atn-$8000+0*$4000	; $8B ATN
		fdb	fn_peek-$8000+0*$4000	; $8C PEEK
		fdb	fn_len-$8000+0*$4000	; $8D LEN
		fdb	fn_str-$8000+0*$4000	; $8E STR$
		fdb	fn_val-$8000+0*$4000	; $8F VAL
		fdb	fn_asc-$8000+0*$4000	; $90 ASC
		fdb	fn_chr-$8000+0*$4000	; $91 CHR$
		fdb	err_sn-$8000+2*$4000	; $92 EOF
		fdb	fn_joy-$8000+0*$4000	; $93 JOYSTK
		fdb	fn_fix-$8000+0*$4000	; $94 FIX
		fdb	fn_hex-$8000+0*$4000	; $95 HEX$
		fdb	fn_left-$8000+1*$4000	; $96 LEFT$
		fdb	fn_right-$8000+1*$4000	; $97 RIGHT$
		fdb	fn_mid-$8000+1*$4000	; $98 MID$
		fdb	fn_point-$8000+1*$4000	; $99 POINT
		fdb	fn_inkey-$8000+2*$4000	; $9A INKEY$
		fdb	fn_mem-$8000+2*$4000	; $9B MEM
		fdb	fn_varptr-$8000+1*$4000	; $9C VARPTR
		fdb	fn_instr-$8000+1*$4000	; $9D INSTR
		fdb	fn_timer-$8000+2*$4000	; $9E TIMER
		fdb	fn_ppoint-$8000+1*$4000	; $9F PPOINT
		fdb	fn_strng-$8000+1*$4000	; $A0 STRING$
		fdb	fn_usr-$8000+2*$4000	; $A1 USR
fn_sgn		bsr	chknum
		lbsr	sign
		lbra	float
fn_int		bsr	chknum
		lbra	fint
fn_abs		bsr	chknum
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
		bsr	frestr0
		pshs	x		; המתאר
		lbsr	chkcom
		bsr	evbyte
		tstb
		lbeq	err_fc		; אין מקום 0
		decb
		pshs	b		; ההתחלה
		ldb	#255		; ברירת מחדל: עד הסוף
		jsr	<chrgot
		cmpa	#',
		bne	1F
		jsr	<chrget
		bsr	evbyte
1		pshs	b
		lbsr	chkrp
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
		lbsr	chkcom
		bsr	evbyte
		pshs	b
		lbsr	chkrp
		puls	b
		puls	x,pc
frestr0		tst	VALTYP		; מחרוזת? X = המתאר (בלי לשחרר עדיין)
		lbeq	err_tm
		ldx	FACMO
		rts
; conint: FAC → B בין 0 ל-255, אחרת ?FC (mit: CONINT)
; evbyte: ביטוי → B (0-255)
evbyte		lbsr	frmevl
conint		lbsr	chknum
		lbsr	ayint
		ldd	FACMO
		tsta
		lbne	err_fc
		rts

; AND / OR (mit: ANDOP 3520, OROP 3518): על מספרים שלמים בין -32768 ל-32767
andop		bsr	logpre
		anda	,s+
		andb	,s+
		lbra	givd
orop		bsr	logpre
		ora	,s+
		orb	,s+
		lbra	givd
; logpre: שני הצדדים כשלמים: D = הימני (FAC), והשמאלי (ARG) נשאר במחסנית מתחת לכתובת החזרה
logpre		lbsr	ayint
		ldd	FACMO
		ldx	,s
		std	,s
		pshs	x
		lbsr	movfa
		lbsr	ayint
		ldd	FACMO
		rts

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
2		inca			; ARG ? FAC: -1 0 1 → מסכה 1 (ARG > FAC) 2 (שווים) 4 (ARG < FAC)
		ldb	#1
1		deca
		bmi	3F
		lslb
		bra	1B
3		andb	OPMASK
		beq	4F
		ldb	#$ff
4		tfr	b,a
		lbra	float
