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
; כמו במקור (קורא 2.1): משתנים רק A ו-CC. Z=1 בסוף פקודה (0 או :). C=1 רק אם ספרה.
; ההמשך ב-ROM יושב בכתובת הקבועה $BB26 (src/islands.s), כי תוכנות של אז מחברות לכאן פקודות משלהן
chrget		equ	$9f
chrgot		equ	$a5
chrtpl		fcb	$0c,$a7		; inc <$A7
		fcb	$26,$02		; bne $A5
		fcb	$0c,$a6		; inc <$A6
		fcb	$b6,0,0		; lda >TXTPTR
		fcb	$7e		; jmp $BB26
		fdb	$bb26

; synchk: התו הנוכחי חייב להיות A. אחרת ?SN. אחר כך מתקדמים
; chkrp / chkcom / chklp: ')' / ',' / '(' חייבים להיות כאן (כמו SYNRPR/SYNCOM במקור)
chkrp		lda	#')
		fcb	$8c		; cmpx #: מדלג על ה-lda הבא (בית אחד במקום bra)
chkcom		lda	#',
		fcb	$8c
chklp		lda	#'(
synchk		pshs	a
		jsr	<chrgot
		cmpa	,s+
		bne	snerr
		jmp	<chrget

; ---------- לולאת הפקודות (mit: NEWSTT 2138, GONE 2165) ----------
; TXTPTR מצביע על התו שלפני הפקודה הבאה. 0 = סוף שורה: הקישור שאחריו אומר מה הלאה
newstt		jsr	HK_NEWS		; 21
		andcc	#$af		; הפסיקות פתוחות בתחילת כל פקודה (קורא: קלטת 5, צליל 1.2)
		lbsr	brkchk		; BREAK? (mit: ISCNTC)
newst2		ldx	TXTPTR		; ($84A6: אחרי בדיקת ה-BREAK)
		stx	TXTBEG		; תחילת הפקודה: לשם חוזרים אחרי קלט שגוי ב-INPUT (קורא: TXTBEG)
		lda	,x
		bne	2F
		ldd	1,x		; הקישור
		lbeq	endcon		; סוף התוכנית (או סוף השורה הישירה)
		ldd	3,x
		std	CURLIN
		leax	4,x
		stx	TXTPTR
		bra	isl_8e4f_e	;@isl
		fill	$ff,$8e4f-*	;@isl
		jsr	<chrget	;@isl
		jsr	frmevl	;@isl
		jsr	conint	;@isl
		jmp	<chrgot	;@isl
isl_8e4f_e	;@isl
		lbsr	trace		; TRON: [n] (קורא)
gone		jsr	<chrget
		bsr	gone3
		bra	newstt
2		cmpa	#':
		beq	gone
snerr		lbra	err_sn		; יציאה משותפת ל-?SN בסביבה
gone3		beq	9F		; פקודה ריקה
		jsr	HK_STMT		; 10, עם A = הבית
		tsta
		lbpl	let		; לא מילה שמורה: השמה
		cmpa	#$ff		; פונקציה בתחילת פקודה: TIMER= (קורא)
		bne	1F
		bra	isl_8e7a_e	;@isl
		fill	$ff,$8e7a-*	;@isl
		jmp	x_adrbyt	;@isl
		fill	$ff,$8e7e-*	;@isl
		jsr	chkcom	;@isl
		bra	$8e51	;@isl
		jsr	frmevl	;@isl
		jsr	getadr	;@isl
		tfr	d,x	;@isl
		rts	;@isl
isl_8e7a_e	;@isl
		ldx	TXTPTR		; (chrget לא משנה את X, כמו במקור)
		lda	1,x
		cmpa	#$9e
		lbeq	timset
		cmpa	#$98		; MID$ כפקודה (קורא)
		lbeq	midst
		jsr	HK_MISC		; 23: השמה לפונקציה לא מוכרת
		bra	snerr
1		cmpa	#$ba
		bls	2F
		cmpa	#$cd		; מילים של מתאר 0 שאינן פקודה (TO, THEN, TAB( ...): ?SN
		bls	snerr
		jmp	[DESC1+3]	; מעבר למתאר 0: דרך $012D, עם A = הטוקן ו-TXTPTR עליו (קורא: מדפסת 7.5)
2		lsla			; (טוקן-$80)*2
		ldu	$0123		; טבלת הכתובות של מתאר 0, מה-RAM (כמו במקור: הרחבה יכולה להחליף אותה; קורא 8.2)
		ldu	a,u
		pshs	u
		jmp	<chrget		; קופצים לפקודה (דרך ה-RTS של chrget), A = התו שאחרי המילה
9		rts

; LIST: אותה שגרה כמו במצב ישיר
; LLIST: אותו LIST, למדפסת (קורא: מדפסת 1.8). בסוף שניהם: סוף שורה מותנה, חזרה למסך, ו-OK
llist		ldb	#$fe
		stb	DEVNUM
list_st		ldx	TXTPTR
		leas	2,s		; בלי החזרה ל-gone, כמו במקור: BREAK בין השורות לא משאיר כלום במחסנית (קורא)
		lbra	do_list		; והסוף: clsone ו-OK (שם)
rem		ldx	TXTPTR		; עד סוף השורה
1		tst	,x+
		bne	1B
		leax	-1,x
		stx	TXTPTR
		rts

; RUN [שורה]: משתנים מתאפסים, ומתחילים מהשורה הראשונה (TXTPTR = TXTTAB-1, האפס שב-$1E00) או מהשורה שצוינה
; (mit: RUN — CLEARC ואז GOTO)
run		jsr	HK_RUN		; 19
		lbsr	gfxrun		; הנקודה האחרונה, זווית וקנה מידה של DRAW (קורא 0.2)
		lbsr	tclose		; הקבצים נסגרים (קורא: קלטת 6)
		lbsr	runstk		; ומחסנית חדשה, עם סמן תחתית ל-FOR (mit: STKINI)
		jsr	<chrgot
		beq	1F
		bcc	gosn		; RUN "שם": עם הקלטת, בהמשך (Z=0 כאן, אז ה-lbne שם קופץ)
		bra	gogo
1		ldx	TXTTAB
		leax	-1,x
		stx	TXTPTR
		bra	gonew

; GO TO / GO SUB (mit: GOTO 2391, GOSUB 2373)
go		cmpa	#$bc		; TO
		beq	1F
		cmpa	#$bd		; SUB
gosn		lbne	err_sn
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
gogo		bsr	goto1		; גם RUN n
gonew		lbra	newstt
1		jsr	<chrget
; goto1: TXTPTR על מספר השורה. שורה גדולה מהנוכחית: מחפשים מהשורה הבאה; אחרת מההתחלה (mit: GOTO)
goto1		bsr	lineget
		ldy	TXTTAB		; מההתחלה (fndlin)
		cmpd	CURLIN
		bls	4F		; גם במצב ישיר (CURLIN = $FFFF): מההתחלה
		ldy	TXTPTR		; סוף השורה הנוכחית
3		tst	,y+
		bne	3B
4		lbsr	fndlnc
		lbcc	err_ul
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

new_st		lbsr	scrtch
		lds	STKTOP
		clr	,-s
		lbra	endcon

; ---------- LET (mit: LET 2540) ----------
let		clrb			; יוצרים משתנה אם אין
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
		jsr	HK_SASG		; 22
		ldx	FACMO
		ldd	2,x
		cmpd	FRETOP
		bhi	3F		; כבר בשטח המחרוזות (X = FACMO)
		cmpd	VARTAB
		blo	3F		; בתוך התוכנית
		lda	,x
		lbsr	strini
		ldx	DSCPNT
		lda	,x
		ldx	2,x
		lbsr	movstr
		ldx	#DSCTMP
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
		clr	DEVNUM		; בסוף PRINT: חזרה למסך
		rts
; prsep: אחרי #n או @n: סוף (Z=1), או פסיק חובה ואחריו התו הבא (Z=1 אם סוף)
prsep		jsr	<chrgot
		beq	9F
		lbsr	chkcom
9		rts
prspc		lda	#$20		; רווח (גם LIST)
		fcb	$8c		; cmpx #: מדלג על ה-lda הבא
pr_cr		lda	#13		; כאן, באמצע: כל הקפיצות אליו קצרות
		lbra	chrout
prlist		beq	pr_cr
		cmpa	#'#		; PRINT #התקן[,רשימה] (קורא: קלטת 3.10)
		bne	1F
		lbsr	getdev
		lbsr	chkout
		bsr	prsep
		beq	pr_cr
1
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
		bsr	prsep
		beq	pr_cr
		cmpa	#$cd		; PRINT @n,USING
		lbeq	usstart
pr_lp		cmpa	#';
		lbeq	pr_semi
		cmpa	#$bb		; TAB(
		lbeq	pr_tab
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
		lbsr	istape		; לקלטת: בלי רווח אחרי מספר
		beq	4F
		jsr	<chrgot		; ולפני פסיק גם לא (קורא: מדפסת 1.7)
		cmpa	#',
		beq	4F
		bsr	prspc		; רווח אחרי מספר
4		lbsr	istape		; לקלטת: CR אחרי כל פריט, וזה גם הסוף
		bne	5F
		bsr	pr_cr
		jsr	<chrgot
		bne	pr_lp
		rts
5		jsr	<chrgot
		beq	pr_cr
		bra	pr_lp
; פסיק (קורא: מדפסת 1.7, 7.2): לפני השדה האחרון, רווחים עד הכפולה הבאה של רוחב השדה; אחרת סוף שורה.
; מסך 16/16/32, מדפסת 16/116/132. לקלטת: כלום
pr_comma	lbsr	istape
		beq	pr_semi
		lbsr	devpar
		ldd	DEVLCF		; A = השדה האחרון, B = המקום
		pshs	a
		cmpb	,s+
		bhs	2F
		bra	isl_903d_e	;@isl
		fill	$ff,$903d-*	;@isl
		jmp	print	;@isl
isl_903d_e	;@isl
		tfr	b,a
1		suba	DEVCFW
		bhs	1B
		nega			; 1 עד רוחב השדה
		bsr	prspcs
		bra	pr_semi
2		lbsr	pr_cr
pr_semi		jsr	<chrget		; גם הפסיק ממשיך כאן
		lbne	pr_lp
		rts			; ; בסוף: בלי שורה חדשה
; TAB(n) (קורא: מדפסת 4.2): n בין 0 ל-255, ואחריו ')'. רווחים עד העמודה n; אם כבר שם או אחריה: כלום
; (בלי שורה חדשה). לקלטת: כלום. אחרי TAB אין שורה חדשה בסוף, כמו ';'
pr_tab		jsr	<chrget
		lbsr	evbyte
		lbsr	chkrp
		lbsr	devpar
		tst	SPCIO
		bne	3F
		subb	DEVPOS
		bls	3F
		tfr	b,a
		bsr	prspcs
3		jsr	<chrgot
		lbne	pr_lp
		rts
; prspcs: A רווחים (A > 0)
prspcs		pshs	b
		tfr	a,b
1		lbsr	prspc
		decb
		bne	1B
		puls	b,pc

; ---------- FOR / NEXT (mit: FOR 2081, NEXT 3110) ----------
; רשומה במחסנית, מהכתובת הנמוכה: $80, כתובת המשתנה (2), הצעד (5), סימן הצעד (1), העד (5),
; מספר השורה (2), המקום בטקסט אחרי ה-FOR (2) — 18 בתים (קורא)
for		lbsr	let		; המשתנה מקבל את ערך ההתחלה; let שם ב-FORPNT את המשתנה של הלולאה
				; (לא VARPNT: הביטוי של ההתחלה כבר דרס אותו — FOR I=J TO 3)
		leas	2,s		; בלי החזרה ל-gone: הרשומה נכנסת מתחתיה (mit: NOTOL)
		lbsr	fndfor		; אותו משתנה כבר בלולאה? מוחקים אותה ומה שמעליה
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
		lbra	nxnew
TEMPLIM		equ	$03e0		; זמני: העד, בתוך FBUFFR שלא בשימוש כאן
RELSAV		equ	$03da		; זמני: המקום לפני סימן יחס

; stmend: X = הסוף של הפקודה הנוכחית (: או 0), בלי להזיז את TXTPTR (mit: DATAN)
stmend		ldx	TXTPTR
1		lda	,x
		beq	9F
		bra	isl_90e5_e	;@isl
		fill	$ff,$90e5-*	;@isl
		jmp	x_strout	;@isl
		jmp	strprt	;@isl
isl_90e5_e	;@isl
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
		bne	9F		; Z=0: לא נמצאה
		ldd	FORPNT
		beq	9F		; Z=1: נמצאה
		cmpd	1,x
		beq	9F
		leax	18,x
		bra	1B
9		rts

; NEXT [משתנה[,משתנה]]
next		leas	2,s
nx_one		clra
		clrb
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
nxnew
3		lbra	newstt
2		leas	18,s		; הלולאה נגמרה
		jsr	<chrgot
		cmpa	#',
		bne	3B
		jsr	<chrget
		bra	nx_one

; ---------- משתנים (mit: PTRGET 3626, NOTFNS 3709) ----------
; משתנה פשוט: [שם 2][ערך 5] בין VARTAB ל-ARYTAB. B=1: לא יוצרים (קריאה בביטוי מחזירה 0)
ptrget		pshs	b
		clr	VALTYP
		jsr	<chrgot
		lbsr	islet
		lbcc	err_sn
		sta	VARNAM
		clr	VARNAM+1
		jsr	<chrget
		bcs	1F		; ספרה
		lbsr	islet
		bcc	3F
1		sta	VARNAM+1
2		jsr	<chrget		; שאר האותיות והספרות לא נחשבות
		bcs	2B
		lbsr	islet
		bcs	2B
3		cmpa	#'$		; מחרוזת: ביט 7 בתו השני של השם (ספר)
		bne	11F
		lda	VARNAM+1
		ora	#$80
		sta	VARNAM+1
		com	VALTYP
		jsr	<chrget
11		ldb	SUBFLG		; ביט 6: שם של DEF FN — ביט 7 בתו הראשון (mit: GETFNM)
		bitb	#$40
		beq	13F
		lda	VARNAM
		ora	#$80
		sta	VARNAM
13		tstb			; ביט 7: בלי מערכים (הפרמטר והשם של DEF FN)
		bmi	12F
		lda	[TXTPTR]	; ( = מערך (mit: ISARY). (chrget לא משנה את X, כמו במקור)
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
		leax	zero5-2,pcr	; קריאה בביטוי: אפס, בלי ליצור (קורא)
		bra	10F
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
		leax	msktab-$ca+256,pcr	; > = < ($CA-$CC, שלילי ב-a,x) → מסכה 1 2 4
		ldb	a,x
		bitb	OPMASK		; אותו סימן פעמיים
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
		jsr	<chrget		; מדלגים על הסימן (chrget לא נוגע ב-B וב-U)
; שומרים את הצד השמאלי, מחשבים את הימני, ומפעילים. ב-Dragon בלי עיגול לפני השמירה (קורא; ב-mit יש)
7		lda	OPMASK		; בית אחד: המסכה, וביט 7 = השמאלי מחרוזת (כמו במקור: מסגרת של 13 בתים — קורא)
		tst	VALTYP
		beq	73F
		ora	#$80
73		pshs	u,a
		ldx	FACEXP		; B = הקדימות: לא לגעת. FAC (6 בתים, לפי הסדר בזיכרון) במחסנית
		ldy	FACMOH
		ldu	FACLO
		pshs	x,y,u
		bsr	fexpr		; הצד הימני, עם הקדימות של הסימן
		puls	x,y,u		; → ARG (אותו סדר)
		stx	ARGEXP
		sty	ARGMOH
		stu	ARGLO
		lda	ARGSGN
		eora	FACSGN
		sta	ARISGN
		puls	a,u
		tfr	a,b
		anda	#$7f
		sta	OPMASK
		sex			; הסוג של השמאלי: A = 0 או $FF לפי ביט 7
		cmpa	VALTYP		; שני הצדדים מאותו סוג (mit: CHKVAL)
75		lbne	err_tm
		tsta
		beq	72F
		cmpu	#dorel		; מחרוזות: רק יחס או +
		beq	72F
		cmpu	#faddt
		bne	75B
		ldu	#cat		; חיבור מחרוזות
72		jsr	,u		; FAC = ARG op FAC
		lbra	fe_lp
9		puls	b,pc
; טבלת הסימנים: קדימות, כתובת (mit: OPTAB)

; eval: איבר אחד → FAC
eval		jsr	HK_OPND		; 16
		clr	VALTYP
		jsr	<chrgot
1		lbcs	fin		; מספר
		cmpa	#'.
		lbeq	fin		; נקודה: גם מספר
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
		lbhi	fnext
		lsla			; (טוקן-$80)*2: אותו דבר כמו suba #$80 ואז lsla
		ldu	$0128		; טבלת הפונקציות של מתאר 0, מה-RAM (כמו במקור)
		ldu	a,u		; הכתובת (טבלה רגילה, כמו במקור)
		pshs	u
		cmpa	#($96-$80)*2	; מ-LEFT$ והלאה: השגרה קוראת בעצמה את מה שאחרי המילה
		bhs	42F
		jsr	<chrget		; עד HEX$: ארגומנט אחד בסוגריים
		lbsr	chklp
		clr	,-s		; מקום למזהה הפונקציה, שנשאר במחסנית בזמן הארגומנט (קורא)
		lbsr	frmevl
		leas	1,s
		lbsr	chkrp
		fcb	$8c		; cmpx #: מדלג על ה-chrget
42		jsr	<chrget		; A = התו שאחרי המילה
43		jsr	[,s++]		; קוראים לשגרה וחוזרים דרכה, כמו משגר הפונקציות במקור (MEM תלוי בעומק — קורא)
		rts
5		ldb	#1		; משתנה: בלי ליצור (ptrget בודק שזו אות: ?SN)
		lbsr	ptrget
		ldx	VARPNT
		tst	VALTYP
		lbeq	movfm
		stx	FACMO		; מחרוזת: FAC מצביע על המתאר שבמשתנה (mit: ISVRET)
		rts

fn_sgn		bsr	chknum
		lbsr	sign
		lbra	float
fn_int		bsr	chknum
		lbra	fint
fn_abs		bsr	chknum
		clr	FACSGN
		rts
chknum		tst	VALTYP
		bne	tmerr
		rts
tmerr		lbra	err_tm
; left$ / right$ / mid$: (מחרוזת,מספר[,מספר]) (mit: LEFT, RIGHT, MID, PREAM)
fn_left		lbsr	chklp		; "(" (כמו במקור: השגרה קוראת את הארגומנטים בעצמה)
		bsr	strarg		; A = B = כמה
		clrb
		bra	subs
fn_right	lbsr	chklp		; "(" (כמו במקור: השגרה קוראת את הארגומנטים בעצמה)
		bsr	strarg		; A = כמה
		negb
		addb	,x		; התחלה = אורך - כמה
subs		lbra	substr
fn_mid		lbsr	chklp		; "(" (כמו במקור: השגרה קוראת את הארגומנטים בעצמה)
		lbsr	frmevl
		bsr	frestr0
		pshs	x		; המתאר
		lbsr	chkcom
		bsr	evbyte
		tstb
		beq	fcerr		; אין מקום 0
		decb
		pshs	b		; ההתחלה
		ldb	#255		; ברירת מחדל: עד הסוף
		jsr	<chrgot
		cmpa	#',
		bne	1F
		jsr	<chrget
		bsr	evbyte
1		lbsr	chkrp		; לא נוגע ב-B
		tfr	b,a		; כמה
		puls	b,x		; התחלה, המתאר
		pshs	a
		lda	,x
		pshs	b
		suba	,s+		; נשאר = אורך - התחלה
		bhi	2F
		clra			; התחלה מעבר לסוף: מחרוזת ריקה
		bra	3F
2		cmpa	,s
		bls	3F
		lda	,s
3		leas	1,s
		bra	subs
; strarg: (מחרוזת,מספר) → X = המתאר, A = B = המספר (0-255), לא יותר מאורך המחרוזת (רק LEFT$ ו-RIGHT$)
strarg		lbsr	frmevl
		bsr	frestr0
		pshs	x
		lbsr	chkcom
		bsr	evbyte
		lbsr	chkrp		; לא נוגע ב-B
		puls	x
		cmpb	,x		; לא יותר מהאורך
		bls	1F
		ldb	,x
1		tfr	b,a
		rts
frestr0		tst	VALTYP		; מחרוזת? X = המתאר (בלי לשחרר עדיין)
		beq	tmerr
		ldx	FACMO
		rts
; conint: FAC → B בין 0 ל-255, אחרת ?FC (mit: CONINT)
; evbyte: ביטוי → B (0-255)
evbyte		lbsr	frmevl
conint		bsr	chknum
		lbsr	ayint
		ldd	FACMO
		tsta
		bne	fcerr
		rts
fcerr		lbra	err_fc

; AND / OR (mit: ANDOP 3520, OROP 3518): על מספרים שלמים בין -32768 ל-32767
andop		bsr	logpre
		anda	,s+
		andb	,s+
		bra	1F
orop		bsr	logpre
		ora	,s+
		orb	,s+
1		lbra	givd
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
2		leax	msktab+1,pcr	; ARG ? FAC: -1 0 1 → מסכה 1 (ARG > FAC) 2 (שווים) 4 (ARG < FAC)
		lda	a,x
		anda	OPMASK
		beq	4F
		lda	#$ff
4		lbra	float		; float משתמש רק ב-A
msktab		fcb	1,2,4
