; Dragon 1982 BASIC — ניסוי שלב 1 (20.10.2026)
;
; מה נבדק: האם הלב של BASIC-M6502 של Microsoft (רישיון MIT, ראו rom2/mit/LICENSE) עובר טוב לשבב 6809,
; ואיך הוא מתאים לסידור הזיכרון של ה-Dragon 32: שמירת שורה מכווצת, המצביעים בכתובות הקבועות, LIST ו-NEW.
;
; יומן מקור (שלב 1):
;   mit  = תרגום ל-6809 של שגרה מ-rom2/mit/m6502.asm (מצוין מספר השורה שם)
;   ספר  = עובדה מהספרים, דרך docs/DRAGON-SPEC-*.md (מפת הזיכרון, טבלת המילים, כללי הכיווץ)
;   קורא = עובדה מהדוח של "הקורא" (Codex) שגונן בדק, בלי קוד
;   שלנו = נכתב כאן
; הכותב (שיחת Dragon) לא ראה את הקוד של ה-Dragon.
;
; Portions of this file are translated from Microsoft BASIC-M6502 (m6502.asm),
; Copyright (c) Microsoft Corporation, licensed under the MIT License (rom2/mit/LICENSE).

		org	$8000
		setdp	0

SCREEN		equ	$0400
SCREND		equ	$0600
PIA0		equ	$ff00
PIA1		equ	$ff20
SAM		equ	$ffc0

; ---------- כתובות קבועות של ה-Dragon (ספר: Companion, PRG) ----------
TXTTAB		equ	$19		; תחילת התוכנית
VARTAB		equ	$1b		; תחילת המשתנים
ARYTAB		equ	$1d		; תחילת המערכים
STREND		equ	$1f		; סוף המערכים
STKTOP		equ	$21		; גבול המחסנית והמחרוזות
FRETOP		equ	$23
MEMSIZ		equ	$27
LINNUM		equ	$2b		; מספר שורה (קורא: שימוש במקור)
CURSOR		equ	$88		; כתובת הסמן (ספר)
TICKS		equ	$0112		; TIMER (ספר: Inside)

; ---------- משתני הניסוי, באזור שהספרים מסמנים כפנוי ----------
KPREV		equ	$03ea		; 8 בתים
KFOUND		equ	$03f2
KNEW		equ	$03f3
KROW		equ	$03f4
KCOL		equ	$03f5
LOWTR		equ	$03f6		; 2 בתים (השם מ-mit)
CRMODE		equ	$03f8		; כיווץ: 0 רגיל, 1 אחרי DATA
KPRE		equ	$03f9		; קידומת המילה שנמצאה: 0 פקודה, $FF פונקציה
LEND		equ	$03fa		; 2 בתים: סוף טווח LIST
LASTKEY		equ	$03fc

KEYQ		equ	$7d00		; רק לבדיקות: תור מקשים מוקלדים. בניסוי מחוץ לאזורים הקבועים של ה-Dragon
LINBUF		equ	$02dd		; מאגר השורה (קורא: BUF ב-$02DD)
LINMAX		equ	249
CRB		equ	$7c00		; הניסוי בלבד: השורה המכווצת. במקור הכיווץ נעשה בתוך המאגר
STACKINI	equ	$7f36		; ספר: STKTOP אחרי ההדלקה

; ---------- הפעלה ----------
reset		orcc	#$50
		sta	SAM+26
		sta	SAM+29
		lds	#STACKINI
		clra
		tfr	a,dp
		lbsr	hw_init
		ldd	#0
		std	TICKS
		lda	PIA0+2
		lda	#$05
		sta	PIA0+3
		andcc	#$ef
		lbsr	cls
		leax	testq,pcr	; תור הבדיקות
		ldu	#KEYQ
		ldb	,x
		incb
1		lda	,x+
		sta	,u+
		decb
		bne	1B
		ldd	#0
		std	KPREV
		std	KPREV+2
		std	KPREV+4
		std	KPREV+6
		; מצב ההדלקה (ספר): תוכנית ב-$1E01, אפס ב-$1E00, גבולות הזיכרון והמחרוזות
		clr	$1e00
		ldd	#$1e01
		std	TXTTAB
		ldd	#$7ffe
		std	MEMSIZ
		std	FRETOP
		ldd	#$7f36
		std	STKTOP
		lbsr	scrtch
		leax	banner,pcr
		lbsr	puts
main_ok		lda	CURSOR+1
		anda	#$1f
		beq	1F
		lda	#13
		lbsr	putc
1		leax	m_ok,pcr
		lbsr	puts
main		lbsr	getline
		bcs	main_ok		; BREAK
		ldx	#LINBUF
		lbsr	skipsp
		beq	main		; שורה ריקה
		cmpa	#'0
		blo	1F
		cmpa	#'9
		bhi	1F
		lbsr	storeline	; שורה עם מספר: נשמרת, בלי OK (כמו במקור)
		bra	main
1		lbsr	crunch		; פקודה ישירה: מכווצים ומבצעים (mit: MAIN, CRDONE)
		clr	,u+		; אחרי השורה: קישור 0000, כמו סוף תוכנית
		clr	,u+
		ldx	#CRB-1
		stx	TXTPTR
		ldd	#$ffff
		std	CURLIN
		lds	#STACKINI
		clr	,-s		; סמן תחתית למחסנית ה-FOR
		lbra	gone

; endcon: סוף התוכנית או סוף השורה הישירה (mit: ENDCON)
endcon		lds	#STACKINI
		lbra	main_ok

; ---------- שגיאות (mit: ERROR) ----------
err_sn		ldd	#'S*256+'N
		bra	error
err_ov		ldd	#'O*256+'V
		bra	error
err_fc		ldd	#'F*256+'C
		bra	error
err_tm		ldd	#'T*256+'M
		bra	error
err_nf		ldd	#'N*256+'F
		bra	error
err_ul		ldd	#'U*256+'L
		bra	error
err_dv0		ldd	#'/*256+'0
error		lds	#STACKINI
		pshs	d
		lda	CURSOR+1
		anda	#$1f
		beq	1F
		lda	#13
		lbsr	putc
1		lda	#'?
		lbsr	putc
		puls	d
		lbsr	putc
		tfr	b,a
		lbsr	putc
		leax	m_err,pcr
		lbsr	puts
		ldd	CURLIN
		cmpd	#$ffff
		beq	2F
		leax	m_in,pcr
		lbsr	puts
		lbsr	prnum
2		lda	#13
		lbsr	putc
		leax	m_ok,pcr
		lbsr	puts
		lbra	main
m_err		fcc	" ERROR"
		fcb	0
m_in		fcc	" IN "
		fcb	0

; ---------- שמירת שורה (mit: MAIN1/NODEL/STOLOP, m6502.asm:1567-1641) ----------
storeline	lbsr	linget		; D = מספר השורה
		std	LINNUM
		lbsr	skipsp		; רווחים אחרי המספר לא נשמרים (mit: CHRGET מדלג עליהם)
		lbsr	crunch		; X = הטקסט → CRB; U = הסוף (אחרי ה-0)
		tfr	u,d
		subd	#CRB
		addd	#4		; קישור + מספר + טקסט + 0
		pshs	d		; האורך
		ldd	LINNUM
		lbsr	fndlin		; Y = השורה (C=1 אם קיימת)
		bcc	1F
		lbsr	dellin		; קיימת: קודם מוחקים
1		tst	CRB
		beq	9F		; רק מספר: רק מחיקה
		; מזיזים את [Y..VARTAB) למעלה באורך השורה (mit: BLTU)
		ldx	VARTAB
		ldd	VARTAB
		addd	,s
		tfr	d,u
		std	VARTAB
		sty	LOWTR
2		cmpx	LOWTR
		bls	3F
		lda	,-x
		sta	,-u
		bra	2B
3		ldd	#$ffff		; קישור זמני שאינו אפס; lnkprg מחשב את האמיתי
		std	,y
		ldd	LINNUM
		std	2,y
		leau	4,y
		ldx	#CRB
4		lda	,x+
		sta	,u+
		bne	4B
9		leas	2,s
		lbsr	lnkprg
		lbra	runc

; dellin: מוחק את השורה ב-Y (mit: m6502.asm:1571-1608)
dellin		pshs	d,x,y,u
		ldx	,y		; השורה הבאה
		tfr	y,u
1		cmpx	VARTAB
		bhs	2F
		lda	,x+
		sta	,u+
		bra	1B
2		stu	VARTAB
		puls	d,x,y,u,pc

; fndlin: מחפש את השורה D. Y = הרשומה שלה או הראשונה שגדולה ממנה (או סמן הסוף). C=1 אם נמצאה
; (mit: FNDLIN, m6502.asm:1879)
fndlin		ldy	TXTTAB
1		pshs	d
		ldd	,y
		puls	d
		beq	8F		; סוף התוכנית
		cmpd	2,y
		beq	9F
		blo	8F
		ldy	,y
		bra	1B
8		andcc	#$fe
		rts
9		orcc	#1
		rts

; lnkprg: מחשב מחדש את כל הקישורים. סוף כל שורה = ה-0 שבסופה; סוף התוכנית = קישור $0000
; (mit: LNKPRG/CHEAD, m6502.asm:1642)
lnkprg		ldx	TXTTAB
1		ldd	,x
		beq	9F
		leay	4,x
2		tst	,y+
		bne	2B
		sty	,x
		tfr	y,x
		bra	1B
9		rts

; scrtch (NEW): שני אפסים בתחילת התוכנית, והמשתנים אחריהם (mit: SCRTCH, m6502.asm:1919)
scrtch		ldx	TXTTAB
		clr	,x
		clr	1,x
		leax	2,x
		stx	VARTAB
; runc: מאפסים משתנים ומערכים (mit: RUNC/CLEARC)
runc		ldd	MEMSIZ
		std	FRETOP
		ldd	VARTAB
		std	ARYTAB
		std	STREND
		rts

; ---------- כיווץ (mit: CRUNCH, m6502.asm:1785; כללי ה-Dragon: קורא + ספר) ----------
; X = הטקסט (מסתיים ב-0). הפלט ב-CRB, מסתיים ב-0. U = אחרי ה-0
crunch		ldu	#CRB
		clr	CRMODE
cr_lp		lda	,x
		lbeq	cr_end
		cmpa	#$20		; רווח נשמר (קורא)
		lbeq	cr_put
		cmpa	#'"
		lbeq	cr_str
		tst	CRMODE		; אחרי DATA: הכול כמו שהוא, עד : שמחוץ למרכאות
		beq	1F
		cmpa	#':
		bne	cr_put
		clr	CRMODE
		bra	cr_put
1		cmpa	#'?		; ? = PRINT
		bne	2F
		lda	#$87
		leax	1,x
		bra	cr_put1
2		cmpa	#''		; ' = נקודתיים ו-$83, ואז השאר כמו שהוא (קורא)
		bne	3F
		leax	1,x
		ldd	#$3a83
		std	,u++
		bra	cr_rest
3		cmpa	#'0		; ספרות, : ו-; נשמרים ישר (mit: KLOOP1)
		blo	cr_kw
		cmpa	#';
		bls	cr_put
cr_kw		lbsr	kwmatch		; מילה שמורה? C=1, B = הטוקן, KPRE = $FF לפונקציה
		bcc	cr_name
		tst	KPRE
		beq	4F
		lda	#$ff		; פונקציה: $FF ואחריו הטוקן
		sta	,u+
		stb	,u+
		bra	cr_lp
4		cmpb	#$84		; ELSE: לפניו נקודתיים, גם אם כבר היו (קורא)
		bne	5F
		lda	#':
		sta	,u+
5		stb	,u+
		cmpb	#$86		; DATA
		bne	6F
		inc	CRMODE
6		cmpb	#$82		; REM: השאר כמו שהוא
		beq	cr_rest
		bra	cr_lp
cr_name		lda	,x		; לא מילה שמורה. אות: שם, וכל האותיות והספרות שאחריה נשמרות כמו שהן (קורא)
		cmpa	#'A
		blo	cr_put
		cmpa	#'Z
		bhi	cr_put
7		sta	,u+
		leax	1,x
		lda	,x
		cmpa	#'0
		blo	cr_lp
		cmpa	#'9
		bls	7B
		cmpa	#'A
		lblo	cr_lp
		cmpa	#'Z
		bls	7B
		lbra	cr_lp
cr_put		leax	1,x
cr_put1		sta	,u+
		lbra	cr_lp
cr_str		sta	,u+		; מרכאות: עד המרכאות הבאות או סוף השורה
		leax	1,x
8		lda	,x
		beq	cr_end
		sta	,u+
		leax	1,x
		cmpa	#'"
		bne	8B
		lbra	cr_lp
cr_rest		lda	,x+
		sta	,u+
		bne	cr_rest
		rts
cr_end		clr	,u+
		rts

; kwmatch: האם בתחילת X יש מילה שמורה? קודם הפקודות ($80-$CD), אחר כך הפונקציות ($FF $80-$A1).
; התאמה מדויקת, בלי דרישה לגבול מילה (קורא). כן: C=1, B = הטוקן, X אחרי המילה. לא: C=0, X לא זז
; (mit: RESER/RESCON/NTHIS, m6502.asm:1810)
kwmatch		pshs	x
		clr	KPRE
		leay	stmtab,pcr
		ldb	#$80
km_word		tst	,y
		bne	1F
		tst	KPRE		; סוף הטבלה
		bne	km_no
		com	KPRE		; עוברים לפונקציות
		leay	fntab,pcr
		ldb	#$80
		bra	km_word
1		ldx	,s
km_ch		lda	,y+
		pshs	a
		anda	#$7f
		cmpa	,x+
		puls	a
		bne	km_skip
		tsta
		bpl	km_ch		; עוד לא התו האחרון
		leas	2,s		; נמצאה
		orcc	#1
		rts
km_skip		tsta
		bmi	2F
3		lda	,y+
		bpl	3B
2		incb
		bra	km_word
km_no		puls	x
		andcc	#$fe
		rts

; ---------- LIST [מ][-[עד]] (mit: LIST, m6502.asm:1975) ----------
do_list		lbsr	skipsp
		ldd	#0
		pshs	d		; מ
		ldd	#$ffff
		std	LEND
		lda	,x
		cmpa	#'0
		blo	1F
		cmpa	#'9
		bhi	1F
		lbsr	linget
		std	,s
		std	LEND		; מספר אחד = שורה אחת
1		lbsr	skipsp
		cmpa	#$c4		; - (טוקן)
		bne	2F
		leax	1,x
		ldd	#$ffff
		std	LEND
		lbsr	skipsp
		cmpa	#'0
		blo	2F
		cmpa	#'9
		bhi	2F
		lbsr	linget
		std	LEND
2		puls	d
		lbsr	fndlin
3		ldd	,y
		beq	9F
		ldd	2,y
		cmpd	LEND
		bhi	9F
		lbsr	prnum		; מספר השורה
		lda	#$20
		lbsr	putc
		leax	4,y
		pshs	y
		lbsr	prline
		lda	#13
		lbsr	putc
		puls	y
		ldy	,y
		bra	3B
9		rts

; prline: טקסט מכווץ ב-X עד 0. נקודתיים לפני ELSE ו-' לא מוצגים (קורא)
prline		clr	CRMODE		; כאן: בתוך מרכאות
1		lda	,x+
		beq	9F
		tst	CRMODE
		bne	5F
		cmpa	#':
		bne	2F
		ldb	,x
		cmpb	#$84
		beq	1B
		cmpb	#$83
		beq	1B
2		cmpa	#$ff
		bne	3F
		ldb	,x+		; פונקציה
		leay	fntab,pcr
		bra	4F
3		tsta
		bpl	5F
		tfr	a,b
		leay	stmtab,pcr
4		lbsr	prword
		bra	1B
5		cmpa	#'"
		bne	6F
		com	CRMODE
6		lbsr	putc
		bra	1B
9		rts

; prword: מדפיס את המילה מספר B-$80 בטבלה Y
prword		pshs	x
		subb	#$80
1		tstb
		beq	3F
2		lda	,y+
		bpl	2B
		decb
		bra	1B
3		lda	,y+
		pshs	a
		anda	#$7f
		lbsr	putc
		puls	a
		tsta
		bpl	3B
		puls	x,pc

; ---------- עזרים (שלנו) ----------
skipsp		lda	,x
		cmpa	#$20
		bne	1F
		leax	1,x
		bra	skipsp
1		tsta
		rts

; linget: מספר שורה מ-X ל-D (עד 63999)
linget		ldd	#0
1		pshs	d
		lda	,x
		cmpa	#'0
		blo	9F
		cmpa	#'9
		bhi	9F
		leax	1,x
		suba	#'0
		pshs	a
		ldd	1,s
		lslb
		rola
		std	1,s		; *2
		lslb
		rola
		lslb
		rola			; *8
		addd	1,s		; *10
		addb	,s+
		adca	#0
		leas	2,s
		bra	1B
9		puls	d,pc

; prnum: D כמספר עשרוני בלי אפסים מובילים
prnum		pshs	d,x,y
		leax	pow10,pcr
		clr	KPRE		; כבר הודפסה ספרה?
1		ldy	,x++
		beq	9F
		clr	LASTKEY		; הספרה
2		pshs	y
		cmpd	,s++
		blo	3F
		pshs	y
		subd	,s++
		inc	LASTKEY
		bra	2B
3		pshs	a
		lda	LASTKEY
		bne	4F
		tst	KPRE
		bne	4F
		cmpy	#1
		bne	5F
4		adda	#'0
		lbsr	putc
		inc	KPRE
5		puls	a
		bra	1B
9		puls	d,x,y,pc
pow10		fdb	10000,1000,100,10,1,0

; getline: שורה ל-LINBUF (מסתיים ב-0). ← מוחק, ENTER מסיים, BREAK: C=1. (שלנו, עם מצביע ולא B,X)
getline		pshs	b,x
		ldx	#LINBUF
gl_key		lbsr	cursor_on
		lbsr	getkey
		lbsr	cursor_off
		cmpa	#13
		beq	gl_done
		cmpa	#8
		beq	gl_back
		cmpa	#3
		beq	gl_brk
		cmpa	#$20
		blo	gl_key
		cmpx	#LINBUF+LINMAX
		bhs	gl_key
		sta	,x+
		lbsr	putc
		bra	gl_key
gl_back		cmpx	#LINBUF
		beq	gl_key
		leax	-1,x
		pshs	x
		ldx	CURSOR
		leax	-1,x
		lda	#$60
		sta	,x
		stx	CURSOR
		puls	x
		bra	gl_key
gl_brk		lda	#13
		lbsr	putc
		clr	LINBUF
		orcc	#1
		puls	b,x,pc
gl_done		clr	,x
		lda	#13
		lbsr	putc
		andcc	#$fe
		puls	b,x,pc
cursor_on	pshs	a,x
		ldx	CURSOR
		lda	#$80
		sta	,x
		puls	a,x,pc
cursor_off	pshs	a,x
		ldx	CURSOR
		lda	#$60
		sta	,x
		puls	a,x,pc

m_ok		fcc	"OK"
		fcb	13,0
m_sn		fcc	"?SN ERROR"
		fcb	13,0
banner		fcc	"DRAGON 1982 BASIC STAGE 1"
		fcb	13,13,0

; ---------- טבלת המילים, בסדר הטוקנים של ה-Dragon (ספר: Companion עמ' 39-40) ----------
; הפורמט כמו ב-mit (RESLST): התו האחרון של כל מילה עם ביט 7 דלוק, ו-0 בסוף הטבלה
stmtab		fcs	"FOR"
		fcs	"GO"
		fcs	"REM"
		fcs	"'"
		fcs	"ELSE"
		fcs	"IF"
		fcs	"DATA"
		fcs	"PRINT"
		fcs	"ON"
		fcs	"INPUT"
		fcs	"END"
		fcs	"NEXT"
		fcs	"DIM"
		fcs	"READ"
		fcs	"LET"
		fcs	"RUN"
		fcs	"RESTORE"
		fcs	"RETURN"
		fcs	"STOP"
		fcs	"POKE"
		fcs	"CONT"
		fcs	"LIST"
		fcs	"CLEAR"
		fcs	"NEW"
		fcs	"DEF"
		fcs	"CLOAD"
		fcs	"CSAVE"
		fcs	"OPEN"
		fcs	"CLOSE"
		fcs	"LLIST"
		fcs	"SET"
		fcs	"RESET"
		fcs	"CLS"
		fcs	"MOTOR"
		fcs	"SOUND"
		fcs	"AUDIO"
		fcs	"EXEC"
		fcs	"SKIPF"
		fcs	"DEL"
		fcs	"EDIT"
		fcs	"TRON"
		fcs	"TROFF"
		fcs	"LINE"
		fcs	"PCLS"
		fcs	"PSET"
		fcs	"PRESET"
		fcs	"SCREEN"
		fcs	"PCLEAR"
		fcs	"COLOR"
		fcs	"CIRCLE"
		fcs	"PAINT"
		fcs	"GET"
		fcs	"PUT"
		fcs	"DRAW"
		fcs	"PCOPY"
		fcs	"PMODE"
		fcs	"PLAY"
		fcs	"DLOAD"
		fcs	"RENUM"
		fcs	"TAB("
		fcs	"TO"
		fcs	"SUB"
		fcs	"FN"
		fcs	"THEN"
		fcs	"NOT"
		fcs	"STEP"
		fcs	"OFF"
		fcs	"+"
		fcs	"-"
		fcs	"*"
		fcs	"/"
		fcs	"^"
		fcs	"AND"
		fcs	"OR"
		fcs	">"
		fcs	"="
		fcs	"<"
		fcs	"USING"
		fcb	0
fntab		fcs	"SGN"
		fcs	"INT"
		fcs	"ABS"
		fcs	"POS"
		fcs	"RND"
		fcs	"SQR"
		fcs	"LOG"
		fcs	"EXP"
		fcs	"SIN"
		fcs	"COS"
		fcs	"TAN"
		fcs	"ATN"
		fcs	"PEEK"
		fcs	"LEN"
		fcs	"STR$"
		fcs	"VAL"
		fcs	"ASC"
		fcs	"CHR$"
		fcs	"EOF"
		fcs	"JOYSTK"
		fcs	"FIX"
		fcs	"HEX$"
		fcs	"LEFT$"
		fcs	"RIGHT$"
		fcs	"MID$"
		fcs	"POINT"
		fcs	"INKEY$"
		fcs	"MEM"
		fcs	"VARPTR"
		fcs	"INSTR"
		fcs	"TIMER"
		fcs	"PPOINT"
		fcs	"STRING$"
		fcs	"USR"
		fcb	0

		include	"mitfp.s"
		include	"mitrun.s"
		include	"io.s"
		include	"testq.s"

irq		lda	PIA0+2
		ldd	TICKS
		addd	#1
		std	TICKS
		rti

		org	$bff2
		fdb	reset,reset,reset,irq,reset,reset,reset
