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
CBLCNT		equ	$8f		; מונה ההבהוב של הסמן (קורא: 50 בהדלקה)
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

KQPTR		equ	$f8		; רק לבדיקות: המקש הבא בתור המוקלד (התור עצמו ב-ROM, testq)
KQCNT		equ	$fa		; כמה מקשים נשארו, 2 בתים (באזור הפנוי $EA-$FF, קורא)
LINBUF		equ	$02dd		; מאגר השורה (קורא: BUF ב-$02DD)
LINMAX		equ	249
CRB		equ	$01da		; הניסוי בלבד: השורה המכווצת, בחוצץ הקלטת (255 בתים). במקור הכיווץ נעשה
					; בתוך המאגר; בשלב הקלטת עוברים לשיטה הזו
STACKINI	equ	$7f36		; ספר: STKTOP אחרי ההדלקה

; ---------- הפעלה ----------
reset		orcc	#$50
		sta	SAM+26
		sta	SAM+29
		lds	#STACKINI
		ldx	#$0400		; ניקוי ראשון של $0000-$03FF (קורא: "הניקוי הראשוני")
1		clr	,-x
		leax	,x
		bne	1B
		clr	,-s		; סמן תחתית למחסנית ה-FOR/GOSUB (קורא: ב-STKTOP-1)
		leax	chrtpl,pcr	; קריאת התו ל-RAM ($9F-$AA)
		ldu	#chrget
		ldb	#12
1		lda	,x+
		sta	,u+
		decb
		bne	1B
		lbsr	hw_init		; DP כבר 0 מההדלקה (והקוד לא משנה אותו)
		lda	PIA0+2
		lda	#$35		; פסיקת השדה; CB2 (SEL2) נשאר פלט נמוך (קורא: צליל 0.3)
		sta	PIA0+3
		andcc	#$ef
		lda	#50
		sta	CBLCNT
		lbsr	cls
		leax	testq,pcr	; תור הבדיקות
		ldd	,x++
		std	KQCNT
		stx	KQPTR
		; מצב ההדלקה (ספר): תוכנית ב-$1E01, אפס ב-$1E00, גבולות הזיכרון והמחרוזות
		; (FRETOP ו-TEMPPT: נקבעים ב-scrtch/runc)
		ldx	#$1e01
		stx	TXTTAB
		clr	-1,x
		ldd	#$7ffe		; קורא: גבול ה-RAM
		std	MEMSIZ
		std	ENDMEM
		ldb	#$36		; $7F36
		std	STKTOP
		lda	#$0c		; קורא: מצב הגרפיקה בהדלקה — PMODE 0, דף 1, דפים מ-$0600
		sta	SCTOP		; $0C00 (הבית התחתון כבר 0)
		lsra
		sta	SCRBAS		; $06
		sta	GSTART		; הדף הנוכחי: $0600 (קורא 0.2)
		ldd	#$0310		; כתיבה 3, 16 בתים בשורה (הרקע 0: ה-RAM נוקה)
		sta	GFORE
		stb	GROWB
		lbsr	gfxrun
		ldd	#$804f		; קורא: זרע ה-RND, 80 4F C7 52 59
		std	$0115
		ldd	#$c752
		std	$0117
		lda	#$59
		sta	$0119
		ldx	#USRTAB		; קורא: טבלת USR, עשר כתובות שמובילות ל-?FC
		stx	USTBAD
		leau	err_fc,pcr
		ldb	#10
1		stu	,x++
		decb
		bne	1B
		leax	execrts,pcr	; EXEC בלי כתובת אחרי ההדלקה: אצלנו חוזר מיד (ב-Dragon: פתוח)
		stx	EXECJP
		lbsr	scrtch
		leax	banner,pcr	; הכותרת ומיד אחריה OK (אחרי 13 אין שורה חדשה נוספת)
		bra	mo_puts
; endcon: סוף התוכנית או סוף השורה הישירה (mit: ENDCON). המחסנית לא מתאפסת
endcon
main_ok		bsr	condcr
		leax	m_ok,pcr
mo_puts		lbsr	puts
main		lbsr	getline
		bcs	main_ok		; BREAK
		ldx	#LINBUF
		lbsr	skipsp
		beq	main		; שורה ריקה
		lbsr	isdig
		bcc	1F
		lbsr	storeline	; שורה עם מספר: נשמרת, בלי OK (כמו במקור)
		lds	STKTOP		; עריכה מנקה את המחסנית (mit: CLEARC/STKINI)
		clr	,-s
		bra	main
1		lbsr	crunch		; פקודה ישירה: מכווצים ומבצעים (mit: MAIN, CRDONE)
		clra			; אחרי השורה: קישור 0000, כמו סוף תוכנית
		clrb
		std	,u
		ldx	#CRB-1
		stx	TXTPTR
		coma
		comb
		std	CURLIN		; $FFFF
		lbra	gone		; המחסנית נשארת: רשומות FOR/GOSUB שמורות עד CONT (mit)

; condcr: שורה חדשה אם הסמן לא בעמודה 0
condcr		lda	CURSOR+1
		anda	#$1f
		bne	prcr
		rts
; prin: " IN n" אם בתוכנית, ושורה חדשה
prin		ldd	CURLIN
		inca			; $FFxx = שורה ישירה (מספרי השורות עד 63999)
		beq	prcr
		deca
		leax	m_in,pcr
		lbsr	puts
		lbsr	prnum
; prcr: שורה חדשה
prcr		lda	#13
		lbra	putc

; ---------- שגיאות (mit: ERROR) ----------
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
err_bs		ldd	#'B*256+'S
		bra	error
err_dd		ldd	#'D*256+'D
		bra	error
err_om		ldd	#'O*256+'M
		bra	error
err_st		ldd	#'S*256+'T
		bra	error
err_os		ldd	#'O*256+'S
		bra	error
err_ls		ldd	#'L*256+'S
		bra	error
err_rg		ldd	#'R*256+'G
		bra	error
err_od		ldd	#'O*256+'D
		bra	error
err_id		ldd	#'I*256+'D
		bra	error
err_cn		ldd	#'C*256+'N
		bra	error
err_uf		ldd	#'U*256+'F
		bra	error
err_dn		ldd	#'D*256+'N
		bra	error
err_no		ldd	#'N*256+'O
		bra	error
err_dv0		ldd	#'/*256+'0
		bra	error
err_sn		ldd	#'S*256+'N
error		lds	STKTOP		; mit: STKINI — מחסנית, זמניים, ואין המשך
		clr	,-s
		pshs	d		; שתי האותיות, ואחריהן ה-0 של הסמן: מחרוזת במחסנית
		lbsr	sndoff		; כל שגיאה: הצליל והמנוע כבויים (קורא: צליל 1.1)
		lbsr	motoff
		lbsr	rcsub
		lbsr	condcr
		lda	#'?
		pshs	a		; "?XY"
		leax	,s
		lbsr	puts
		leas	3,s
		leax	m_err,pcr
		lbsr	puts
		lbsr	prin
		lbra	main_ok
m_err		fcc	" ERROR"
		fcb	0
m_in		fcc	" IN "
		fcb	0

; linget: מספר שורה מ-X ל-D (עד 63999)
linget		clra
		clrb
1		pshs	d
		ldb	,x
		subb	#'0
		cmpb	#9
		bhi	9F
		leax	1,x
		pshs	b
		ldd	1,s
		cmpd	#6399		; מעל 63999: ?SN (קורא: קורא מספרי השורות)
		bhi	err_sn
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

; ---------- שמירת שורה (mit: MAIN1/NODEL/STOLOP, m6502.asm:1567-1641) ----------
storeline	bsr	linget		; D = מספר השורה
		std	LINNUM
storel2					; EDIT נכנס כאן: LINNUM מוכן, X = הטקסט
		lbsr	skipsp		; רווחים אחרי המספר לא נשמרים (mit: CHRGET מדלג עליהם)
		lbsr	crunch		; X = הטקסט → CRB; U = הסוף (אחרי ה-0)
		tfr	u,d
		subd	#CRB-4		; קישור + מספר + טקסט + 0
		pshs	d		; האורך
		ldd	LINNUM
		bsr	fndlin		; Y = השורה (C=1 אם קיימת)
		bcc	1F
		ldx	,y		; קיימת: קודם מוחקים (mit: m6502.asm:1571-1608). X = השורה הבאה
		tfr	y,u
5		cmpx	VARTAB
		bhs	6F
		lda	,x+
		sta	,u+
		bra	5B
6		stu	VARTAB
1		tst	CRB
		beq	9F		; רק מספר: רק מחיקה
		; מזיזים את [Y..VARTAB) למעלה באורך השורה (mit: BLTU)
		ldd	VARTAB
		addd	,s
		pshs	d,y		; יש מקום? אחרת ?OM לפני שמזיזים משהו (mit: REASON). Y = הגבול התחתון
		lbsr	reason
		ldx	VARTAB
		puls	d
		tfr	d,u
		std	VARTAB
2		cmpx	,s
		bls	3F
		lda	,-x
		sta	,-u
		bra	2B
3		puls	y
		sty	,y		; קישור זמני שאינו אפס; lnkprg מחשב את האמיתי
		ldd	LINNUM
		std	2,y
		leau	4,y
		ldx	#CRB
4		lda	,x+
		sta	,u+
		bne	4B
9		leas	2,s
		bsr	lnkprg
		bra	runc

; fndlin: מחפש את השורה D. Y = הרשומה שלה או הראשונה שגדולה ממנה (או סמן הסוף). C=1 אם נמצאה
; (mit: FNDLIN, m6502.asm:1879)
fndlin		ldy	TXTTAB
fndlnc
1		tst	,y		; סוף התוכנית: קישור 0 (קישור אמיתי תמיד מעל $00FF)
		beq	8F
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
		clr	,x+
		clr	,x+
		stx	VARTAB
; runc: מאפסים משתנים ומערכים (mit: RUNC/CLEARC)
runc		ldd	MEMSIZ
		std	FRETOP
		ldd	VARTAB
		std	ARYTAB
		std	STREND
		ldd	TXTTAB		; RESTORE
		subd	#1
		std	DATPTR
; rcsub: זמניים, ואין המשך (גם error)
rcsub		ldd	#TEMPST
		std	TEMPPT
		clra			; אין המשך
		clrb
		std	OLDTXT
		clr	SUBFLG
		rts

skipsp		lda	,x+
		cmpa	#$20
		beq	skipsp
		leax	-1,x
		tsta
		rts
; isdig: C=1 אם A ספרה
isdig		pshs	a
		suba	#'0
		cmpa	#10
		puls	a,pc


; ---------- כיווץ (mit: CRUNCH, m6502.asm:1785; כללי ה-Dragon: קורא + ספר) ----------
; X = הטקסט (מסתיים ב-0). הפלט ב-CRB, מסתיים ב-0. U = אחרי ה-0
cr_rest		lda	,x+		; השאר כמו שהוא, עד ה-0 (כולל)
		sta	,u+
		bne	cr_rest
cr_ret		rts
crunch		ldu	#CRB
		clr	CRMODE
cr_lp		lda	,x
		beq	cr_rest	; סוף: ה-0 נשמר
		cmpa	#$20		; רווח נשמר (קורא)
		beq	cr_put
		cmpa	#'"
		beq	cr_str
		tst	CRMODE		; אחרי DATA: הכול כמו שהוא, עד : שמחוץ למרכאות
		beq	1F
		cmpa	#':
		bne	cr_put
		clr	CRMODE
		bra	cr_put
1		cmpa	#'?		; ? = PRINT
		bne	2F
		lda	#$87
		bra	cr_put
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
cr_kw		bsr	kwmatch		; מילה שמורה? C=1, B = הטוקן, KPRE = $FF לפונקציה
		bcc	cr_name
		lda	KPRE
		beq	4F
		sta	,u+		; פונקציה: $FF ואחריו הטוקן
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
cr_put		leax	1,x
		sta	,u+
		bra	cr_lp
cr_str		leax	1,x		; מרכאות: עד המרכאות הבאות או סוף השורה
		sta	,u+
8		lda	,x+
		sta	,u+
		beq	cr_ret		; סוף השורה: ה-0 נשמר
		cmpa	#'"
		bne	8B
cr_lp2		bra	cr_lp
cr_name		lda	,x		; לא מילה שמורה. אות: שם, וכל האותיות והספרות שאחריה נשמרות כמו שהן (קורא)
		cmpa	#'A
		blo	cr_put
		cmpa	#'Z
		bhi	cr_put
7		sta	,u+
		leax	1,x
		lda	,x
		lbsr	isdig
		bcs	7B
		cmpa	#'A
		blo	cr_lp2
		cmpa	#'Z
		bls	7B
		bra	cr_lp2

; kwmatch: האם בתחילת X יש מילה שמורה? קודם הפקודות ($80-$CD), אחר כך הפונקציות ($FF $80-$A1).
; התאמה מדויקת, בלי דרישה לגבול מילה (קורא). כן: C=1, B = הטוקן, X אחרי המילה. לא: C=0, X לא זז
; (mit: RESER/RESCON/NTHIS, m6502.asm:1810)
kwmatch		pshs	x
		clr	KPRE
		leay	stmtab,pcr
km_tab		ldb	#$80
km_word		tst	,y
		bne	1F
		tst	KPRE		; סוף הטבלה
		bne	km_no
		com	KPRE		; עוברים לפונקציות (fntab מיד אחרי ה-0)
		leay	1,y
		bra	km_tab
1		ldx	,s
km_ch		lda	,y+		; שווה בלי ביט 7: Z. ביט 7 (התו האחרון) עובר ל-C
		eora	,x+
		lsla
		bne	km_skip
		bcc	km_ch		; עוד לא התו האחרון
		leas	2,s		; נמצאה (C=1)
		rts
km_skip		leay	-1,y		; לסוף המילה
3		lda	,y+
		bpl	3B
		incb
		bra	km_word
km_no		puls	x
		andcc	#$fe
		rts

; ---------- LIST [מ][-[עד]] (mit: LIST, m6502.asm:1975) ----------
; lrange: טווח שורות מ-X: [n][-[m]]. D = ההתחלה (0 אם אין), LEND = הסוף ($FFFF אם אין; מספר בודד: הוא עצמו)
lrange		clra
		clrb
		pshs	d		; מ
		bsr	lnum
		bcc	1F
		std	,s		; מספר אחד = שורה אחת
1		lbsr	skipsp
		cmpa	#$c4		; - (טוקן)
		bne	2F
		leax	1,x
		bsr	lnum
2		puls	d,pc
; lnum: LEND = $FFFF, ואם יש מספר: D = LEND = המספר, C=1
lnum		lbsr	skipsp
		lbsr	isdig
		ldd	#$ffff
		std	LEND
		bcc	9F
		lbsr	linget
		std	LEND
		orcc	#1
9		rts
do_list		bsr	lrange
		lbsr	fndlin
3		ldd	,y
		beq	9F
		ldd	2,y
		cmpd	LEND
		bhi	9F
		bsr	prnum		; מספר השורה
		lda	#$20
		lbsr	putc
		leax	4,y
		pshs	y
		bsr	prline
		lbsr	prcr
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
2		tsta
		bpl	5F
		tfr	a,b
		leay	stmtab,pcr
		cmpa	#$ff
		bne	3F
		ldb	,x+		; פונקציה
		leay	fntab,pcr
; המילה מספר B-$80 בטבלה Y
3		subb	#$80
7		beq	8F
4		lda	,y+
		bpl	4B
		decb
		bra	7B
8		lda	,y		; lout שומר על X ועל Y
		anda	#$7f
		lbsr	lout
		lda	,y+
		bpl	8B
		bra	1B
5		cmpa	#'"
		bne	6F
		com	CRMODE
6		lbsr	lout
		bra	1B
9		rts


; ---------- עזרים (שלנו) ----------
; prnum: D כמספר עשרוני בלי אפסים מובילים
prnum		pshs	d,x		; D כמספר עשרוני בלי אפסים מובילים
		bsr	numtxt
		ldx	#FBUFFR
		lbsr	puts
		puls	d,x,pc
; numtxt: D → ספרות עשרוניות ב-FBUFFR (מסתיים ב-0, בלי אפסים מובילים). B = כמה (גם RENUM)
numtxt		pshs	x,u
		ldu	#FBUFFR
		leax	pow10,pcr
0		cmpd	,x		; מדלגים על החזקות שגדולות מהמספר (לא על 1): בלי אפסים מובילים
		bhs	6F
		tst	3,x
		beq	6F
		leax	2,x
		bra	0B
6		pshs	d
1		lda	#'0-1
		pshs	a		; ,s הספרה  1,s הערך
2		inc	,s
		ldd	1,s
		subd	,x
		bcs	3F
		std	1,s
		bra	2B
3		puls	a
		sta	,u+
		leax	2,x
		tst	1,x		; 0 = סוף הטבלה
		bne	1B
		clr	,u
		leas	2,s
		tfr	u,d
		subd	#FBUFFR
		puls	x,u,pc
pow10		fdb	10000,1000,100,10,1,0

; getline: שורה ל-LINBUF (מסתיים ב-0). ← מוחק, ENTER מסיים, BREAK: C=1. (שלנו, עם מצביע ולא B,X)
getline		pshs	b,x
gl_new		ldx	#LINBUF
gl_key		lbsr	getkey		; הסמן מהבהב בתוך getkey (קורא)
		cmpa	#13
		beq	gl_done
		cmpa	#8
		beq	gl_back
		cmpa	#3
		beq	gl_brk
		cmpa	#12		; CLEAR: מסך נקי, השורה מתחילה מחדש, בלי ההנחיה (קורא)
		bne	1F
		lbsr	cls
		clr	IKEYIM
		bra	gl_new
1
		cmpa	#$20
		blo	gl_key
		cmpx	#LINBUF+LINMAX
		bhs	gl_key
		sta	,x+
2		lbsr	putc
		bra	gl_key
gl_back		cmpx	#LINBUF
		beq	gl_key
		leax	-1,x
		lda	#8		; תא אחד אחורה ורווח (הסמן אחרי התווים שהוקלדו)
		bra	2B
gl_brk		ldx	#LINBUF
gl_done		clr	,x
		cmpa	#4		; C=1 ב-BREAK
		pshs	cc
		lbsr	prcr
		puls	cc,b,x,pc
banner		fcc	"DRAGON 1982 BASIC STAGE 1"
		fcb	13,13		; ממשיך ב-m_ok
m_ok		fcc	"OK"
		fcb	13,0

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
		include	"mitstr.s"
		include	"mitary.s"
		include	"mitctl.s"
		include	"mitmem.s"
		include	"mitmath.s"
		include	"mitfunc.s"
		include	"mitscr.s"
		include	"mitedit.s"
		include	"mitusing.s"
		include	"mitgfx.s"
		include	"mitcirc.s"
		include	"mitdraw.s"
		include	"mitsnd.s"
		include	"io.s"
		include	"testq.s"

; פסיקת השדה (קורא: צליל 4, 9.5): רק כשהדגל ב-$FF03 דולק. TIMER, ואחריו התו של PLAY, ורק אם אין תו: SOUND
irq		lda	PIA0+3
		bpl	9F
		lda	PIA0+2
		ldx	TICKS
		leax	1,x
		stx	TICKS
		ldd	PLYTMR
		beq	5F
		subd	PSTEP
		bls	6F
		std	PLYTMR
		rti
; התו נגמר (קורא 9.1): חוזרים ישר למי שקרא לתו. U השמור במסגרת מצביע על כתובת החזרה; ה-CC מהמסגרת,
; בלי ביט 7, כך ש-RTI מחזיר רק CC ו-PC (והפסיקות פתוחות)
6		clra
		clrb
		std	PLYTMR
		lda	,s
		anda	#$7f
		lds	8,s
		pshs	a
		rti
5		ldx	SNDTMR
		beq	9F
		leax	-1,x
		stx	SNDTMR
9		rti

		org	$bff2
		fdb	reset,reset,reset,irq,reset,reset,reset
