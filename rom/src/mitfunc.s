; Dragon 1982 BASIC — שלב 2, חלק 5ב: שאר הפונקציות.
; לפי דוח הקורא (docs/DRAGON-SPEC-FUNCTIONS.md). מ-mit: STR$ (STR 4242), VAL (VAL 4763), INSTR/STRING$ לפי אותו מנגנון
; מחרוזות. של ה-Dragon בלבד (אין ב-mit): ה-RND שלו, &H/&O, HEX$, FIX, POS, MEM, VARPTR, TIMER, INKEY$, JOYSTK,
; USR0-9 עם טבלה, POINT.
;
; Portions translated from Microsoft BASIC-M6502, Copyright (c) Microsoft Corporation, MIT License.

RNDX		equ	$0116		; קורא: מצב ה-RND, 32 ביט (ב-$0115 נשאר $80)
RACC		equ	$ea		; פנימי: המכפלה של RND, 8 בתים
CELL		equ	$86		; קורא: מסכת הנקודה של POINT
LPTPOS		equ	$9c		; קורא: עמודת המדפסת
LPTCFW		equ	$99		; המדפסת: רוחב שדה הפסיק, ואחריו ($9A) השדה האחרון (קורא: מדפסת 1.5)
LPTWID		equ	$9b		; רוחב השורה של המדפסת
LPAUTO		equ	$0148		; ≠0: שורה מלאה = ירידת שורה של המדפסת עצמה
LPEOL		equ	$014a		; רצף סוף השורה: כמה, ואחריו עד 6 בתים
USTBAD		equ	$b0		; קורא: הטבלה של USR, $0134
USRTAB		equ	$0134		; קורא: עשר כתובות USR
JOYVAL		equ	$015a		; ספר + קורא: ארבע דגימות הג'ויסטיק

; ---------- RND (קורא: מחולל של ה-Dragon, שונה מ-mit) ----------
; מצב חדש = מצב × 1088834987 + 95446411 (32 ביט). התוצאה: (מצב חדש + e/256) / 2^32, כש-e = ביטים 40-47 של המכפלה
fn_rnd		lbsr	chknum
		lbsr	sign
		beq	rnd_adv		; 0: שבר חדש
		bmi	rnd_seed	; שלילי: זריעה מהמנטיסה
		lbsr	fint		; חיובי: 1 עד INT(n)
		ldx	#TEMPF1
		lbsr	movmf
		bsr	rnd_adv
		ldx	#TEMPF1
		lbsr	fmult
		ldx	#fone
		lbsr	fadd
		lbra	fint
rnd_seed	ldd	FACHO
		std	RNDX
		ldd	FACMO
		std	RNDX+2
rnd_adv		clra			; המכפלה המלאה, 8 בתים, הגבוה ראשון: שורה לכל בית של המצב
		clrb
		std	RACC+4
		std	RACC+6
		ldy	#RNDX+4
		ldx	#RACC+8
1		leay	-1,y		; a_i (מהנמוך)
		clr	,-s		; הנשא
		leau	rndmul+4,pcr
2		lda	,y
		ldb	,-u		; b_j
		mul
		addb	,-x		; ועוד מה שכבר שם ועוד הנשא
		adca	#0
		addb	,s
		adca	#0
		stb	,x
		sta	,s
		cmpu	#rndmul
		bne	2B
		puls	b
		stb	,-x
		leax	4,x		; השורה הבאה: מקום אחד גבוה יותר
		cmpx	#RACC+4
		bne	1B
		ldd	RACC+6		; + 95446411 (קורא)
		addd	#$658b
		std	RNDX+2
		std	FACMO
		ldd	RACC+4
		adcb	#$b0
		adca	#$05
		std	RNDX
		std	FACHO		; השבר
		lda	RACC+2		; בית הדיוק
		sta	FACOV
		lda	#$80
		sta	FACEXP
		clr	FACSGN
		lbra	normal
rndmul		fdb	$40e6,$4dab	; 1088834987 (קורא)

; ---------- FIX: קיטום לכיוון אפס (קורא) ----------
fn_fix		lbsr	chknum
		tst	FACSGN
		lbpl	fint
		lbsr	negop
		lbsr	fint
		lbra	negop

; ---------- STR$, VAL, HEX$, &H/&O ----------
; VAL: המספר שבתחילת המחרוזת. אפס זמני אחרי המחרוזת, ו-TXTPTR עליה (mit: VAL)
fn_val		lbsr	frestr
		clr	VALTYP
		tsta
		lbeq	zerofc
		tfr	a,b
		clra
		leau	d,x		; הבית שאחרי
		ldb	,u
		ldy	TXTPTR
		pshs	b,y,u
		clr	,u
		leax	-1,x
		stx	TXTPTR
		jsr	<chrget
		bsr	finx
		puls	b,y,u
		sty	TXTPTR
		stb	,u
		rts
; finx: מספר מהטקסט, כולל &H / &O / & בהתחלה (קורא)
finx		cmpa	#'&
		lbne	fin
; radix: &H = בסיס 16, &O או & = בסיס 8. שלם בלי סימן של 16 ביט; גלישה: ?OV (קורא)
radix		ldx	#0
		ldb	#8
		pshs	b,x		; [0] = הבסיס, [1-2] = הערך
		jsr	<chrget
		cmpa	#'H
		bne	1F
		lsl	,s		; בסיס 16
		bra	2F
1		cmpa	#'O
		bne	3F
2		jsr	<chrget
3		suba	#'0
		blo	9F
		cmpa	#9
		bls	4F
		suba	#7		; אות: רק A-F, ורק בבסיס 16
		cmpa	#10
		blo	9F
		cmpa	,s
		bhs	9F		; אות כשרה ממשיכה: 10-15 < 16
4		cmpa	,s		; בבסיס 8: 9 נותן ?SN, ו-8 מתקבל (קורא)
		lbhi	err_sn
		ldb	,s		; כפול הבסיס: 3 או 4 הזזות
6		lsl	2,s
		rol	1,s
		bcs	8F
		lsrb
		cmpb	#1
		bne	6B
		tfr	a,b
		clra
		addd	1,s
		bcs	8F
		std	1,s
		jsr	<chrget
		bra	3B
8		lbra	err_ov
9		leas	1,s
		puls	d
		lbra	givu
; HEX$: 0-65535 בלי השבר. אותיות גדולות, בלי אפסים מובילים; 0 = "0" (קורא)
fn_hex		lbsr	getadr
		ldx	#FBUFFR
		pshs	d
		ldb	#4
		pshs	b		; [0] = מונה, [1-2] = הערך
1		clra			; הספרה הבאה ל-A
		ldb	#4
2		lsl	2,s
		rol	1,s
		rola
		decb
		bne	2B
		tsta
		bne	3F
		cmpx	#FBUFFR		; כבר התחלנו?
		bne	3F
		ldb	,s
		decb
		bne	4F		; אפס מוביל: מדלגים (חוץ מהספרה האחרונה)
3		adda	#'0
		cmpa	#'9
		bls	5F
		adda	#7
5		sta	,x+
4		dec	,s
		bne	1B
		clr	,x
		leas	3,s
		bra	strfb
fn_str		lbsr	chknum		; כמו ההדפסה: רווח או מינוס בהתחלה, בלי רווח בסוף (mit: STR)
		lbsr	fout
strfb		ldx	#FBUFFR
		lbra	strlit

; ---------- INSTR([p,]s$,t$) (קורא) ----------
; מקום מעבר לסוף: 0, גם כש-t$ ריקה. t$ ריקה: p. אחרת: המקום הראשון מ-p, או 0
IT_SA		equ	$ea		; פנימי
IT_SL		equ	$ec
IT_TA		equ	$ed
IT_TL		equ	$ef
fn_instr	lbsr	chklp		; "(" (כמו במקור: השגרה קוראת את הארגומנטים בעצמה)
		lbsr	frmevl
		ldb	#1		; בלי מקום: מ-1
		tst	VALTYP
		pshs	b
		bne	1F
		lbsr	conint
		tstb
		lbeq	err_fc
		stb	,s
		lbsr	chkcom
		lbsr	frmevl
1		lbsr	frestr0		; s$
		pshs	x
		lbsr	chkcom
		lbsr	frmevl
		lbsr	frestr0		; t$
		pshs	x
		lbsr	chkrp
		puls	x		; משחררים: קודם t$, אחר כך s$
		lbsr	fretmp
		sta	IT_TL
		stx	IT_TA
		puls	x
		lbsr	fretmp
		sta	IT_SL
		stx	IT_SA
		clr	VALTYP
		puls	b		; p
		cmpb	IT_SL
		bhi	8F
		tst	IT_TL
		beq	9F
		pshs	b
2		lda	IT_SL		; נשאר מ-k: SL-k+1
		suba	,s
		inca
		cmpa	IT_TL
		blo	7F
		ldx	IT_SA
		ldb	,s
		decb
		abx
		ldu	IT_TA
		ldb	IT_TL
3		lda	,x+
		cmpa	,u+
		bne	4F
		decb
		bne	3B
		puls	b		; נמצא
		bra	9F
4		inc	,s
		bra	2B
7		leas	1,s
8		clrb
9		lbra	givb

; ---------- STRING$(n,c) (קורא) ----------
fn_strng	lbsr	chklp		; "(" (כמו במקור: השגרה קוראת את הארגומנטים בעצמה)
		lbsr	evbyte
		pshs	b		; n
		lbsr	chkcom
		lbsr	frmevl
		tst	VALTYP
		bne	1F
		lbsr	conint
		bra	2F
1		lbsr	frestr		; מחרוזת: התו הראשון; ריקה ?FC גם כש-n=0
		tsta
		lbeq	err_fc
		ldb	,x
2		pshs	b
		lbsr	chkrp
		lda	1,s
		lbsr	strspa		; X = המקום, A = n
		puls	b
		leas	1,s
		tsta
		beq	4F
3		stb	,x+
		deca
		bne	3B
4		lbra	putnew

; ---------- POS, MEM, VARPTR, TIMER (קורא) ----------
; POS(n) (קורא: מדפסת 1.9): ההתקן כמו ב-PRINT #, בדיקת "פתוח לכתיבה", והמקום מפרמטרי ההתקן.
; ההתקן הקודם חוזר אחר כך
fn_pos		lbsr	chknum
		lda	DEVNUM
		pshs	a
		lbsr	devfac
		lbsr	chkout
		lbsr	devpar
		puls	a
		sta	DEVNUM
		ldb	DEVPOS
		lbra	givb
fn_mem		tfr	s,d		; S בכניסה פחות STREND, בלי סימן (קורא)
		subd	STREND
		lbra	givu
fn_varptr	lbsr	chklp		; "(" (כמו במקור: השגרה קוראת את הארגומנטים בעצמה)
		ldd	STREND		; משתנה שלא היה: נוצר, ואז ?FC (קורא)
		pshs	d
		clrb
		lbsr	ptrget
		bra	isl_9d3d_e	;@isl
		fill	$ff,$9d3d-*	;@isl
		jmp	irq	;@isl
		fill	$ff,$9d46-*	;@isl
		jmp	irqtk	;@isl
isl_9d3d_e	;@isl
		puls	d
		cmpd	STREND
		lbne	err_fc
		lbsr	chkrp
		clr	VALTYP
		ldd	VARPNT		; מספר: בית המעריך; מחרוזת: המתאר; מערך: האיבר
		lbra	givu
fn_timer	ldd	TICKS
		lbra	givu
; TIMER=n (פקודה): 0-65535, בלי השבר
timset		jsr	<chrget		; אחרי $FF
		jsr	<chrget		; אחרי $9E
		bsr	eqadr
		std	TICKS
		rts
; eqadr: '=' ואחריו כתובת 0-65535 ב-D
eqadr		lda	#$cb		; =
		lbsr	synchk
; evadr: ביטוי → כתובת 0-65535 ב-D
evadr		lbsr	frmevl
		lbra	getadr

; ---------- INKEY$ (קורא) ----------
; המקש השמור ב-$87 (נשמר בין פקודות), אחרת סריקה. $87 מתאפס. אין מקש: מחרוזת ריקה
fn_inkey	lda	IKEYIM
		bne	1F
		jsr	$bbe5		; סריקה דרך הכניסה הקבועה (כמו במקור)
ink_r
1		clr	IKEYIM
		sta	FACLO
		pshs	a
		beq	2F		; אין מקש: ריקה
		lda	#1
2		lbsr	strspa		; X = המקום, A = האורך
		puls	b
		tsta
		beq	3F
		stb	,x
3		lbra	putnew

; ---------- JOYSTK(n) (קורא + ספר) ----------
; 0 מרענן את ארבע הדגימות ($015A-$015D, בסדר 3,2,1,0); 1-3 מחזירים את השמורה
fn_joy		lbsr	conint
		cmpb	#3
		lbhi	err_fc
		tstb
		bne	1F
		bsr	joyrd
		clrb
1		ldx	#JOYVAL
		ldb	b,x
		lbra	givb
; joyrd (קורא): לכל ערוץ, 3 עד 0: הבורר (ביט 3 ב-$FF01 = ביט 0 של הערוץ, ב-$FF03 = ביט 1), ואז מדידה:
; DAC מתחיל ב-128 עם צעד 64; כל השוואה (ביט 7 של $FF00) מוסיפה או מורידה את הצעד, והצעד נחצה; 6 השוואות
; (64 עד 2), והתוצאה חלקי 4 = 0-63. אם היא שונה מהערך השמור של הערוץ, מודדים שוב, עד 10 פעמים בסך הכול.
; אין שחזור: הבורר נשאר על ערוץ 0, וה-DAC על הניסיון האחרון שנכתב
joyrd		ldb	#3
1		lda	#10		; [0] = ניסיונות, [1] = הערוץ
		pshs	a,b
		ldx	#PIA0+1		; ביט 0 של הערוץ → CA2 ($FF01), ביט 1 → CB2 ($FF03)
2		lda	,x
		ora	#$38		; ביטים 4-5 דולקים, וביט 3 = ביט הערוץ
		lsrb
		bcs	3F
		anda	#$f7
3		sta	,x++
		cmpx	#PIA0+5
		bne	2B
4		ldd	#$8040		; A = הקירוב, B = הצעד
5		sta	PIA1		; הניסיון ל-DAC
		pshs	b
		tst	PIA0
		bmi	6F		; המוט מעל ה-DAC: מוסיפים, אחרת מורידים
		neg	,s
6		adda	,s+
		lsrb
		cmpb	#1
		bne	5B
		lsra			; 0-63
		lsra
		ldb	1,s		; הערוץ
		ldx	#JOYVAL
		cmpa	b,x
		beq	8F		; כמו הערך השמור: מסיימים
		dec	,s
		bne	4B
8		sta	b,x
		puls	a,b
		decb
		bpl	1B
		rts

; ---------- USR0-USR9, DEF USR (קורא) ----------
; ספרה אחת אחרי USR (בלעדיה 0). מספר: A=0, X=$004F (FAC). מחרוזת: A=$FF, X=המתאר (משוחרר).
; ב-Dragon 32 צורת המילה שונה מ-Dragon 64 (David Linsley, 20.10): פתוח, נבדוק במחשב אמיתי
fn_usr		bsr	usrdig
		pshs	b
		lbsr	chklp
		lbsr	frmevl
		lbsr	chkrp
		puls	b
		ldx	USTBAD
		abx
		ldu	,x		; הכתובת
		tst	VALTYP
		bne	2F
		ldx	#FACEXP
		clra
		jmp	,u		; השגרה חוזרת ב-RTS ישר למי שקרא לפונקציה
2		ldx	FACMO
		lbsr	fretms
		ldx	FACMO
		lda	#$ff
		jmp	,u
; usrdig: ספרה אופציונלית אחרי USR → B = פעמיים הספרה, המקום בטבלה (בלעדיה 0)
usrdig		suba	#'0
		cmpa	#9
		bhi	1F
		lsla
		pshs	a
		jsr	<chrget
		puls	b,pc
1		clrb
		rts
; defusr: אחרי DEF, כש-TXTPTR על ה-$FF של USR
defusr		ldx	TXTPTR
		lda	1,x
		cmpa	#$a1
		lbne	err_sn
		jsr	<chrget
		jsr	<chrget
		bsr	usrdig
		pshs	b
		lbsr	eqadr
		tfr	d,u
		puls	b
		ldx	USTBAD
		abx
		stu	,x
		rts

; ---------- POINT(x,y): מסך הטקסט (קורא + ה-VDG) ----------
; x 0-63, y 0-31. תא שאינו גרפי: -1. נקודה כבויה: 0. דולקת: הצבע 1-8
fn_point	lbsr	chklp		; "(" (כמו במקור: השגרה קוראת את הארגומנטים בעצמה)
		lbsr	sgxyr
		ldb	,x		; VALTYP כבר 0 (evbyte)
		bmi	3F
		ldd	#-1		; לא גרפי
		lbra	givd
3		bitb	CELL
		bne	4F
		clrb
		bra	5F
4		lsrb			; הצבע: ביטים 4-6, ועוד 1
		lsrb
		lsrb
		lsrb
		andb	#7
		incb
5		lbra	givb

; ===== הועברו לכאן מ-mitmem.s ומ-mitscr.s, כדי לנצל את המקום שלפני טבלת $A000 =====
; ---------- CLEAR [n[,m]] ----------
clear		beq	clr_go		; בלי מספרים: רק ניקוי
		lbsr	evadr		; n: 0-65535
		pshs	d
		ldd	MEMSIZ
		pshs	d		; [0] = MEMSIZ החדש, [2] = n
		jsr	<chrgot
		beq	1F
		lbsr	cadr		; ,m
		subd	#1		; MEMSIZ = m-1 (קורא)
		bcs	mem_om		; m = 0
		cmpd	ENDMEM		; מעל ה-RAM
		bhi	mem_om
		std	,s
1		ldd	,s
		subd	2,s		; STKTOP = MEMSIZ-n
		bcs	mem_om
		std	2,s		; [2] = STKTOP החדש
		ldd	VARTAB		; חייב להישאר מקום מעל התוכנית (הרזרבה: קורא, משוחזרת, פתוח)
		addd	#58
		bcs	mem_om
		cmpd	2,s
		bhi	mem_om
		puls	d,x
		std	MEMSIZ
		stx	STKTOP
clr_go		bsr	runstk		; משתנים, מחרוזות, DATA, אין המשך, ומחסנית חדשה (mit: STKINI)
		lbra	newstt
mem_om		lbra	err_om

; CLS: בלי מספר: רווחים ($60). 0-8: ממלאים בצבע (0 = $80, אחרת $8F + 16*(n-1)).
; 9-255: רווחים ושורה משלנו (במקור: הודעה של מיקרוסופט; גונן, 20.10: "The Dragon machine 2026"), ושתי שורות חדשות
cls_st		jsr	HK_MISC		; 23 (Z נשמר)
		lbeq	cls
		lbsr	evbyte
		cmpb	#8
		bhi	4F
		lda	#16		; הצבע: 16n+$7F, ול-0: $80
		mul
		addb	#$7f
		bmi	1F
		incb
1		tfr	b,a		; כל המסך בצבע, והסמן בהתחלה (כמו אחרי cls)
		ldx	#SCREEN
		lbra	clrxd
4		lbsr	cls		; קודם רווחים
		leax	m_cls,pcr
		lbra	puts
m_cls		fcc	"THE DRAGON MACHINE 2026"
		fcb	13,13,0

