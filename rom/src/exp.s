; Dragon 1982 BASIC — ניסוי שלב 1 (20.10.2026)
;
; מה נבדק: האם הלב של BASIC-M6502 של Microsoft (רישיון MIT, ראו rom/mit/LICENSE) עובר טוב לשבב 6809,
; ואיך הוא מתאים לסידור הזיכרון של ה-Dragon 32: שמירת שורה מכווצת, המצביעים בכתובות הקבועות, LIST ו-NEW.
;
; יומן מקור (שלב 1):
;   mit  = תרגום ל-6809 של שגרה מ-rom/mit/m6502.asm (מצוין מספר השורה שם)
;   ספר  = עובדה מהספרים, דרך docs/DRAGON-SPEC-*.md (מפת הזיכרון, טבלת המילים, כללי הכיווץ)
;   קורא = עובדה מהדוח של "הקורא" (Codex) שגונן בדק, בלי קוד
;   שלנו = נכתב כאן
; הכותב (שיחת Dragon) לא ראה את הקוד של ה-Dragon.
;
; Portions of this file are translated from Microsoft BASIC-M6502 (m6502.asm),
; Copyright (c) Microsoft Corporation, licensed under the MIT License (rom/mit/LICENSE).

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
CRB		equ	$02dc		; השורה המכווצת: במקום, בתוך מאגר השורה, בית אחד לפני הקלט (קורא: קלטת 11).
					; הגרש (1 → 2 בתים) קורה פעם אחת לכל היותר, ובית הפתיחה מספיק
STACKINI	equ	$7f36
RSTFLG		equ	$71		; $55: ‏RESET חוזר ל-BASIC (קורא: מדפסת 3.5)
RSTVEC		equ	$72		; לאן חוזרים ב-RESET
HOOKS		equ	$015e		; 25 נקודות חיבור, 3 בתים כל אחת (קורא: מדפסת 3.6)
DESC1		equ	$012a		; מתאר הפקודות השני (קורא 3.2)
; נקודות החיבור לפי הסדר (קורא: מדפסת 3.6). כל אחת נקראת ב-JSR, ובהדלקה חוזרת מיד
HK_OPEN		equ	$015e		; 1 OPEN
HK_DEVN		equ	$0161		; 2 בדיקת מספר ההתקן (Z=1 מקבל)
HK_DEVP		equ	$0164		; 3 פרמטרי ההתקן
HK_COUT		equ	$0167		; 4 פלט תו
HK_CIN		equ	$016a		; 5 קלט תו
HK_CKIN		equ	$016d		; 6 פתוח לקריאה?
HK_CKOUT	equ	$0170		; 7 פתוח לכתיבה?
HK_CLALL	equ	$0173		; 8 סגירת הכול
HK_CLONE	equ	$0176		; 9 סגירת התקן
HK_STMT		equ	$0179		; 10 משגר הפקודות
HK_INPQ		equ	$017c		; 11 INPUT לפני "??"
HK_LBRK		equ	$017f		; 12 BREAK ב-LIST
HK_LINE		equ	$0182		; 13 קלט שורה
HK_AEOF		equ	$0185		; 14 סוף קובץ בטעינת ASCII
HK_EOF		equ	$0188		; 15 EOF(
HK_OPND		equ	$018b		; 16 ערך בביטוי
HK_ERR1		equ	$018e		; 17 שגיאה (B = הקוד)
HK_ERR2		equ	$0191		; 18 שגיאה, השנייה
HK_RUN		equ	$0194		; 19 RUN
HK_STR		equ	$0197		; 20 מחרוזת קבועה / ניקוי המשתנים
HK_NEWS		equ	$019a		; 21 לפני כל פקודה
HK_SASG		equ	$019d		; 22 השמת מחרוזת
HK_MISC		equ	$01a0		; 23 CLS, RENUM, GET/PUT, השמה לפונקציה
HK_CRUN		equ	$01a3		; 24 כיווץ
HK_DECR		equ	$01a6		; 25 פתיחת שורה (LIST, EDIT)		; ספר: STKTOP אחרי ההדלקה

; ---------- הכניסות הקבועות ב-$8000 (docs/DRAGON-SPEC-INTERFACES.md 3ג, DRAGON-SPEC-TAPE.md 1.10) ----------
		jmp	hw_init		; $8000 אתחול חומרה (חוזר דרך Y)
		jmp	swinit		; $8003 אתחול תוכנה
		jmp	inkey		; $8006 מקלדת
		jmp	blink		; $8009 הבהוב הסמן
		jmp	putc		; $800C פלט למסך
		jmp	prtout		; $800F פלט למדפסת
		jmp	joyrd		; $8012 ג'ויסטיקים
		jmp	tmoton		; $8015 מנוע דולק
		jmp	motoff		; $8018 מנוע כבוי
		jmp	tleader		; $801B מבוא קלטת
twslot		jmp	twbyte		; $801E בית לקלטת
		jmp	tsync		; $8021 סנכרון קריאה
		jmp	trbyte		; $8024 בית מהקלטת
		jmp	trbit		; $8027 ביט מהקלטת
		jmp	noserv		; $802A-$8030 תקשורת: אין ב-Dragon 32
		jmp	noserv
		jmp	noserv

; ---------- הפעלה ----------
reset		orcc	#$50
		sta	SAM+26
		sta	SAM+29
		lds	#STACKINI
		leay	rst2,pcr
		lbra	hw_init
; rst2: אחרי אתחול החומרה, בכל הדלקה ואיפוס: פסיקת המחסנית דולקת ($FF23 = $37). אחר כך התחלה חמה, אם
; RSTFLG = $55 והבית בכתובת שב-RSTVEC הוא NOP ($12); אחרת התחלה קרה (קורא: מדפסת 3.5, 7.3, 7.4)
rst2		lda	#$37
		sta	PIA1+3
		lda	RSTFLG
		cmpa	#$55
		bne	swinit
		ldx	RSTVEC
		lda	,x
		cmpa	#$12
		bne	swinit
		jmp	,x
swinit		orcc	#$50
		lds	#STACKINI
		ldx	#$0400		; ניקוי ראשון של $0000-$03FF (קורא: "הניקוי הראשוני")
1		clr	,-x
		leax	,x
		bne	1B
		clr	,-s		; סמן תחתית למחסנית ה-FOR/GOSUB (קורא: ב-STKTOP-1)
		lda	#$39		; קורא (קלטת 11): $02D9 לא אפס, קישור דמה לפני מספר השורה
		sta	$02d9
		leay	initab,pcr	; טבלת ההעתקות: קריאת התו, הסמן והקלטת, זרע ה-RND
1		ldb	,y+		; כמה (0 = סוף)
		beq	3F
		ldx	,y++		; מאיפה
		ldu	,y++		; לאן
2		lda	,x+
		sta	,u+
		decb
		bne	2B
		bra	1B
3		ldx	#HOOKS		; 25 נקודות החיבור: RTS RTS RTS (קורא: מדפסת 3.6)
		lda	#$39
4		sta	,x+
		cmpx	#HOOKS+75
		bne	4B
		leax	err_sn,pcr	; מתאר הפקודות השני: בלי מילים, והקפיצות שלו ל-?SN (קורא 3.2)
		stx	DESC1+3
		stx	DESC1+8
		lda	PIA0+2
		lda	#$35		; פסיקת השדה; CB2 (SEL2) נשאר פלט נמוך (קורא: צליל 0.3)
		sta	PIA0+3
		lbsr	cls
		leax	testq,pcr	; תור הבדיקות: אורך וכתובת. ב-ROM האמיתי 0; בבדיקות התור במחסנית ב-$C000
		ldd	,x
		std	KQCNT
		ldx	2,x
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
		lda	#$55		; מעכשיו RESET חוזר ל-OK והתוכנית נשמרת
		sta	RSTFLG
		leax	warm,pcr
		stx	RSTVEC
		andcc	#$af		; IRQ ו-FIRQ פתוחות, ממש לפני הכותרת (קורא 7.3)
		leax	banner,pcr	; הכותרת ומיד אחריה OK (אחרי 13 אין שורה חדשה נוספת)
		bra	mo_puts
; initab: [כמה][מאיפה][לאן], 0 בסוף. אזורי ה-RAM האלה לא נוגעים זה בזה ולא בפסיקה, אז הסדר לא משנה
initab		fcb	12		; קריאת התו ל-RAM ($9F-$AA)
		fdb	chrtpl,chrget
		fcb	13		; הסמן, הקלטת, המקלדת והמדפסת: ל-$8F-$9B (קורא: קלטת 0.3, מדפסת 1.5, 7.1)
		fdb	tdefs,CBLCNT
		fcb	30		; $010C-$0129: הפסיקות, TIMER, זרע ה-RND, מתאר הפקודות (קורא: מדפסת 3.2)
		fdb	lowtab,$010c
		fcb	9		; $0148-$0150: שורה חדשה אוטומטית, נעילה, ורצף סוף השורה למדפסת (קורא 1.5)
		fdb	lptab,$0148
		fcb	0
lowtab		jmp	irq		; $010C IRQ
		jmp	firq		; $010F FIRQ
		fcb	0,0,0		; $0112 TIMER
		fcb	$80,$4f,$c7,$52,$59	; $0115 זרע ה-RND
		fcb	0,0,0,0,0	; $011A-$011E
		fcb	0		; $011F: ב-Dragon 64 ‏5 (קצב חזרת מקש); ב-32 פתוח, כנראה 0 (קורא 3.2)
		fcb	78		; $0120 מתאר 0: מילות הפקודה ($80-$CD)
		fdb	stmtab,stmtbl
		fcb	34		; מילות הפונקציה ($FF $80-$A1)
		fdb	fntab,fntbl
lptab		fcb	$ff,$ff,1,13,10,0,0,0,0
; warm: ההתחלה החמה (קורא 7.4): התוכנית, המשתנים, TRON, הקבצים, המדפסת ו-$0100-$01FF נשמרים
warm		nop			; ה-NOP שהאיפוס בודק
		clra
		clrb
		std	PLYTMR
		lda	PIA0+3		; פסיקת השדה
		ora	#1
		sta	PIA0+3
		clr	DEVNUM
		lds	STKTOP		; המחסנית והזמניים; אין CONT
		clr	,-s
		lbsr	rcsub
		andcc	#$af
		lbsr	cls
		bra	main_ok
; firq (קורא 3.4): רק כשקו המחסנית דלק ($FF23 ביט 7). כ-1.2 שניות המתנה, אתחול חומרה (שמכבה את
; פסיקת המחסנית), ואין חזרה ל-BASIC ב-RESET. ואז $C000
firq		tst	PIA1+3
		bmi	1F
		rti
1		ldb	#2
2		ldx	<$8a		; תמיד 0: ‏65,536 סיבובים
3		leax	-1,x
		bne	3B
		decb
		bne	2B
		clr	RSTFLG
		leay	4F,pcr
		lbra	hw_init
4		jmp	$c000
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
; לפי ההתקן: המקום מפרמטרי ההתקן; לקלטת תמיד (כך LIST לקלטת מתחיל כל שורה ב-CR)
condcr		lbsr	devpar
		tst	SPCIO
		bne	prcr
		tst	DEVPOS
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
		lbra	chrout

; ---------- שגיאות (mit: ERROR; קורא: מדפסת, טבלת השגיאות) ----------
; כל שגיאה: B = הקוד (ההיסט בטבלה, 2 לכל שגיאה), ונופלים דרך ה-cmpx עד error
err_nf		ldb	#0
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_sn		ldb	#2
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_rg		ldb	#4
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_od		ldb	#6
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_fc		ldb	#8
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_ov		ldb	#10
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_om		ldb	#12
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_ul		ldb	#14
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_bs		ldb	#16
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_dd		ldb	#18
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_dv0		ldb	#20
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_id		ldb	#22
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_tm		ldb	#24
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_os		ldb	#26
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_ls		ldb	#28
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_st		ldb	#30
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_cn		ldb	#32
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_uf		ldb	#34
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_fd		ldb	#36
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_ao		ldb	#38
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_dn		ldb	#40
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_io		ldb	#42
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_fm		ldb	#44
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_no		ldb	#46
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_ie		ldb	#48
		fcb	$8c		; cmpx #: מדלג על ה-ldb הבא
err_ds		ldb	#50
error		jsr	HK_ERR1		; נקודות החיבור 17 ו-18, עם B = הקוד
		jsr	HK_ERR2
		lds	STKTOP		; mit: STKINI — מחסנית, זמניים, ואין המשך
		clr	DEVNUM		; כל שגיאה: חזרה למסך (קורא: קלטת 4.3)
		clr	,-s
		pshs	b
		lbsr	sndoff		; כל שגיאה: הצליל והמנוע כבויים (קורא: צליל 1.1)
		lbsr	motoff
		lbsr	rcsub
		lbsr	condcr
		lda	#'?
		lbsr	chrout
		puls	b
		leax	errtab,pcr	; שתי האותיות מהטבלה, לפי B
		abx
		lda	,x+
		lbsr	chrout
		lda	,x
		lbsr	chrout
		leax	m_err,pcr
		lbsr	puts
		lbsr	prin
		lbra	main_ok
errtab		fcc	"NFSNRGODFCOVOMULBSDD/0IDTMOSLSSTCNUFFDAODNIOFMNOIEDS"
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
		lbhi	err_sn
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
		puls	u
		stu	VARTAB
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
runc		jsr	HK_STR		; 20 (ניקוי המשתנים)
		ldd	MEMSIZ
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
crunch		jsr	HK_CRUN		; 24
		ldu	#CRB
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
		std	,u++		; פונקציה: $FF ואחריו הטוקן
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
; islet: C=1 אם A אות A-Z (שלנו)
islet		pshs	a
		suba	#'A
		cmpa	#26
		puls	a,pc
cr_name		lda	,x		; לא מילה שמורה. אות: שם, וכל האותיות והספרות שאחריה נשמרות כמו שהן (קורא)
		bsr	islet
		bcc	cr_put
7		sta	,u+
		leax	1,x
		lda	,x
		lbsr	isdig
		bcs	7B
		bsr	islet
		bcs	7B
		bra	cr_lp2

; kwmatch: האם בתחילת X יש מילה שמורה? קודם מילות הפקודה של כל המתארים ב-RAM ($0120, כל 10 בתים),
; אחר כך מילות הפונקציה. הטוקנים ממשיכים לספור ממתאר למתאר (קורא: מדפסת 7.5). התאמה מדויקת, בלי דרישה
; לגבול מילה (קורא). כן: C=1, B = הטוקן, X אחרי המילה, KPRE = $FF לפונקציה. לא: C=0, X לא זז
; (mit: RESER/RESCON/NTHIS, m6502.asm:1810)
kwmatch		pshs	x,u		; U נשמר (crunch כותב דרכו)
		clr	KPRE
		ldu	#$0120		; הפקודות: המונה ב-+0
		bsr	km_scan
		bcs	1F
		com	KPRE
		ldu	#$0125		; הפונקציות: המונה ב-+5
		bsr	km_scan
		bcs	1F
		puls	x,u,pc		; C=0
1		leas	2,s
		puls	u,pc
; km_scan: U = המונה של המתאר הראשון; ממשיכים כל 10 בתים עד מונה 0
km_scan		ldb	#$80
1		lda	,u
		beq	8F
		ldy	1,u		; רשימת המילים
		pshs	a
2		ldx	3,s		; [מונה][חזרה][X]
3		lda	,y+		; שווה בלי ביט 7: Z. ביט 7 (התו האחרון) עובר ל-C
		eora	,x+
		lsla
		bne	4F
		bcc	3B		; עוד לא התו האחרון
		leas	1,s		; נמצאה (C=1)
		rts
4		leay	-1,y		; לסוף המילה
5		lda	,y+
		bpl	5B
		incb
		dec	,s
		bne	2B
		leas	1,s
		leau	10,u
		bra	1B
8		andcc	#$fe
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
dlist2		lbsr	fndlin		; D = השורה הראשונה, LEND = האחרונה (CSAVE ,A נכנס כאן)
3		ldd	,y
		beq	9F
		ldd	2,y
		cmpd	LEND
		bhi	9F
		jsr	HK_LBRK		; 12
		lbsr	istape		; בין השורות: BREAK (לא לקלטת; קורא: מדפסת 1.8)
		beq	1F
		lbsr	brkchk
1		lbsr	condcr		; כל שורה מתחילה בסוף שורה מותנה (קורא: מדפסת 1.8)
		ldd	2,y
		lbsr	prnum		; מספר השורה
		lbsr	prspc
		leax	4,y
		pshs	y
		bsr	prline
		puls	y
		ldy	,y
		bra	3B
9		lbsr	condcr		; והאחרונה נגמרת בסוף שורה מותנה
		lbsr	istape
		beq	8F		; קלטת (CSAVE ,A): חזרה למי שקרא
		lbsr	clsone		; LIST / LLIST: סוגרים, ו-OK
		lbra	main_ok
8		rts

; prline: טקסט מכווץ ב-X עד 0. נקודתיים לפני ELSE ו-' לא מוצגים (קורא)
prline		leax	-4,x		; 25: עם X = הקישור של השורה
		jsr	HK_DECR
		leax	4,x
		pshs	u
		clr	CRMODE		; כאן: בתוך מרכאות
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
		ldu	#$0120		; המילה דרך המתארים ב-RAM (קורא: מדפסת 7.5)
		cmpa	#$ff
		bne	3F
		ldb	,x+		; פונקציה
		ldu	#$0125
3		subb	#$80
31		lda	,u		; המונה של המתאר: 0 = אין עוד מתארים, טוקן לא מוכר: "!"
		beq	33F
		cmpb	,u
		blo	32F
		subb	,u
		leau	10,u
		bra	31B
33		lda	#'!
		bra	6F
; המילה מספר B ברשימה של המתאר
32		ldy	1,u
		tstb
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
9		puls	u,pc


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
getline		jsr	HK_LINE		; 13
		pshs	b,x
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
banner		fcc	"DRAGON 1982 BASIC 1.0"	; כמו במחשב הראשי של האתר
		fcb	13
		fcc	"(C) 2026 GONEN YAROM"
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
		include	"mitfunc.s"

; ---------- שבעת המצביעים ב-$A000 (docs/DRAGON-SPEC-INTERFACES.md 3ב, DRAGON-SPEC-TAPE.md 1.10) ----------
; הקוד שלפני הטבלה חייב להיגמר לפני $A000 (אחרת האסמבלר נותן שגיאה). המקום שנשאר פנוי מתמלא ב-$FF
		fill	$ff,$a000-*
		fdb	$8006		; $A000 מקלדת (דרך הכניסה הקבועה)
		fdb	chrout		; $A002 תו להתקן שב-$6F
		fdb	$8021		; $A004 סנכרון קלטת (כמו במקור: דרך הכניסה)
		fdb	tblkrd		; $A006 קריאת בלוק
		fdb	tblkwr		; $A008 כתיבת בלוק
		fdb	$8012		; $A00A ג'ויסטיקים
		fdb	$801b		; $A00C מבוא קלטת (כמו במקור: דרך הכניסה)
		include	"mitmem.s"		; אחרי הטבלה: הקוד שלפניה צריך להיכנס עד $A000
		include	"mitmath.s"		; גם הוא אחרי הטבלה (המקום שלפני $A000 התמלא)
		include	"mitscr.s"
		include	"mitedit.s"
		include	"mitusing.s"
		include	"mitgfx.s"
		include	"mitcirc.s"
		include	"mitdraw.s"
		include	"mitsnd.s"
		include	"mittape.s"
		include	"mitfile.s"
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
		fdb	$0100,$0103,$010f,$010c,$0106,$0109,reset	; SWI3 SWI2 FIRQ IRQ SWI NMI דרך ה-RAM (קורא 3.1)
