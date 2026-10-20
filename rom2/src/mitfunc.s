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
		leax	fone,pcr
		lbsr	fadd
		lbra	fint
rnd_seed	ldd	FACHO
		std	RNDX
		ldd	FACMO
		std	RNDX+2
rnd_adv		ldx	#RACC		; המכפלה המלאה, 8 בתים, הגבוה ראשון
		ldb	#8
1		clr	,x+
		decb
		bne	1B
		clr	,-s		; i
2		clr	,-s		; j
3		ldx	#RNDX+3		; a_i (מהנמוך)
		ldb	1,s
		negb
		lda	b,x
		leax	rndmul+3,pcr	; b_j
		ldb	,s
		negb
		ldb	b,x
		mul
		pshs	d
		ldb	2,s		; המקום: i+j
		addb	3,s
		negb
		ldu	#RACC+7
		leau	b,u
		puls	d
		addd	-1,u
		std	-1,u
		bcc	5F
		leau	-2,u		; נשא
4		cmpu	#RACC
		blo	5F
		inc	,u
		bne	5F
		leau	-1,u
		bra	4B
5		inc	,s
		lda	,s
		cmpa	#4
		bne	3B
		leas	1,s
		inc	,s
		lda	,s
		cmpa	#4
		bne	2B
		leas	1,s
		ldd	RACC+6		; + 95446411
		addd	rndadd+2,pcr
		std	RNDX+2
		ldd	RACC+4
		adcb	rndadd+1,pcr
		adca	rndadd,pcr
		std	RNDX
		std	FACHO		; השבר
		ldd	RNDX+2
		std	FACMO
		lda	RACC+2		; בית הדיוק
		sta	FACOV
		lda	#$80
		sta	FACEXP
		clr	FACSGN
		lbra	normal
rndmul		fdb	$40e6,$4dab	; 1088834987 (קורא)
rndadd		fdb	$05b0,$658b	; 95446411 (קורא)

; ---------- FIX: קיטום לכיוון אפס (קורא) ----------
fn_fix		lbsr	chknum
		tst	FACSGN
		lbpl	fint
		lbsr	negop
		lbsr	fint
		lbra	negop

; ---------- STR$, VAL, HEX$, &H/&O ----------
fn_str		lbsr	chknum		; כמו ההדפסה: רווח או מינוס בהתחלה, בלי רווח בסוף (mit: STR)
		lbsr	fout
		ldx	#FBUFFR
		lbra	strlit
; VAL: המספר שבתחילת המחרוזת. אפס זמני אחרי המחרוזת, ו-TXTPTR עליה (mit: VAL)
fn_val		lbsr	frestr
		clr	VALTYP
		tsta
		lbeq	zerofc
		tfr	a,b
		clra
		leau	d,x		; הבית שאחרי
		ldb	,u
		pshs	b,u
		clr	,u
		ldd	TXTPTR
		pshs	d
		leax	-1,x
		stx	TXTPTR
		lbsr	chrget
		bsr	finx
		puls	d
		std	TXTPTR
		puls	b,u
		stb	,u
		rts
; finx: מספר מהטקסט, כולל &H / &O / & בהתחלה (קורא)
finx		cmpa	#'&
		lbne	fin
; radix: &H = בסיס 16, &O או & = בסיס 8. שלם בלי סימן של 16 ביט; גלישה: ?OV (קורא)
radix		ldd	#0
		pshs	d
		ldb	#8
		pshs	b		; [0] = הבסיס, [1-2] = הערך
		lbsr	chrget
		cmpa	#'H
		bne	1F
		ldb	#16
		stb	,s
		bra	2F
1		cmpa	#'O
		bne	3F
2		lbsr	chrget
3		suba	#'0
		blo	9F
		cmpa	#9
		bls	4F
		ldb	,s		; אות: רק A-F בבסיס 16
		cmpb	#16
		bne	9F
		adda	#'0
		cmpa	#'A
		blo	9F
		cmpa	#'F
		bhi	9F
		suba	#'A-10
		bra	5F
4		ldb	,s		; בבסיס 8: 9 נותן ?SN, ו-8 מתקבל (קורא)
		cmpb	#8
		bne	5F
		cmpa	#8
		lbhi	err_sn
5		pshs	a
		ldb	#3
		lda	1,s
		cmpa	#16
		bne	6F
		incb
6		lsl	3,s
		rol	2,s
		lbcs	err_ov
		decb
		bne	6B
		puls	b
		clra
		addd	1,s
		lbcs	err_ov
		std	1,s
		lbsr	chrget
		bra	3B
9		leas	1,s
		puls	d
		lbra	givu
; HEX$: 0-65535 בלי השבר. אותיות גדולות, בלי אפסים מובילים; 0 = "0" (קורא)
fn_hex		lbsr	getadr
		pshs	d
		ldx	#FBUFFR
		ldb	#4
		pshs	b
		clr	,-s		; [0] = כבר התחלנו, [1] = מונה, [2-3] = הערך
1		lda	2,s
		lsra
		lsra
		lsra
		lsra
		ldb	#4
2		lsl	3,s
		rol	2,s
		decb
		bne	2B
		tsta
		bne	3F
		tst	,s
		bne	3F
		ldb	1,s
		cmpb	#1
		bne	4F		; אפס מוביל: מדלגים (חוץ מהספרה האחרונה)
3		inc	,s
		adda	#'0
		cmpa	#'9
		bls	5F
		adda	#7
5		sta	,x+
4		dec	1,s
		bne	1B
		clr	,x
		leas	4,s
		ldx	#FBUFFR
		lbra	strlit

; ---------- INSTR([p,]s$,t$) (קורא) ----------
; מקום מעבר לסוף: 0, גם כש-t$ ריקה. t$ ריקה: p. אחרת: המקום הראשון מ-p, או 0
IT_SA		equ	$ea		; פנימי
IT_SL		equ	$ec
IT_TA		equ	$ed
IT_TL		equ	$ef
fn_instr	lbsr	frmevl
		ldb	#1		; בלי מקום: מ-1
		tst	VALTYP
		bne	1F
		lbsr	conint
		tstb
		lbeq	err_fc
		pshs	b
		lda	#',
		lbsr	synchk
		lbsr	frmevl
		puls	b
1		pshs	b
		lbsr	frestr0		; s$
		pshs	x
		lda	#',
		lbsr	synchk
		lbsr	frmevl
		lbsr	frestr0		; t$
		pshs	x
		lda	#')
		lbsr	synchk
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
9		clra
		lbra	givu

; ---------- STRING$(n,c) (קורא) ----------
fn_strng	lbsr	frmevl
		lbsr	conint
		pshs	b		; n
		lda	#',
		lbsr	synchk
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
		lda	#')
		lbsr	synchk
		lda	1,s
		lbsr	strspa
		puls	b
		leas	1,s
		ldx	DSCTMP+2
		lda	DSCTMP
		beq	4F
3		stb	,x+
		deca
		bne	3B
4		lbra	putnew

; ---------- POS, MEM, VARPTR, TIMER (קורא) ----------
fn_pos		lbsr	chknum
		lbsr	ayint		; INT, בין -32768 ל-32767
		ldd	FACMO
		beq	1F
		cmpd	#-2
		beq	2F
		cmpd	#-1		; קלטת: בשלב הקלטת
		lbeq	err_no
		lbra	err_dn
1		ldb	CURSOR+1	; המסך: העמודה 0-31
		andb	#$1f
		bra	3F
2		ldb	LPTPOS		; מדפסת
3		clra
		lbra	givu
fn_mem		tfr	s,d		; S בכניסה פחות STREND, בלי סימן (קורא)
		subd	STREND
		lbra	givu
fn_varptr	ldd	STREND		; משתנה שלא היה: נוצר, ואז ?FC (קורא)
		pshs	d
		clrb
		lbsr	ptrget
		puls	d
		cmpd	STREND
		lbne	err_fc
		lda	#')
		lbsr	synchk
		clr	VALTYP
		ldd	VARPNT		; מספר: בית המעריך; מחרוזת: המתאר; מערך: האיבר
		lbra	givu
fn_timer	ldd	TICKS
		lbra	givu
; TIMER=n (פקודה): 0-65535, בלי השבר
timset		lbsr	chrget		; אחרי $FF
		lbsr	chrget		; אחרי $9E
		lda	#$cb		; =
		lbsr	synchk
		lbsr	frmevl
		lbsr	getadr
		std	TICKS
		rts

; ---------- INKEY$ (קורא) ----------
; המקש השמור ב-$87 (נשמר בין פקודות), אחרת סריקה. $87 מתאפס. אין מקש: מחרוזת ריקה
fn_inkey	lda	IKEYIM
		bne	1F
		ldd	CURLIN		; תור הבדיקות רק בזמן שתוכנית רצה (כמו BREAK); אחרת המקלדת
		cmpd	#$ffff
		bne	0F
		lbsr	keyindex
		bra	1F
0		lbsr	inkey
1		clr	IKEYIM
		sta	FACLO
		tsta
		beq	2F
		pshs	a
		lda	#1
		lbsr	strspa
		puls	a
		sta	[DSCTMP+2]
		lbra	putnew
2		lbsr	strspa		; A = 0: ריקה
		lbra	putnew

; ---------- JOYSTK(n) (קורא + ספר) ----------
; 0 מרענן את ארבע הדגימות ($015A-$015D, בסדר 3,2,1,0); 1-3 מחזירים את השמורה
fn_joy		lbsr	conint
		cmpb	#3
		lbhi	err_fc
		pshs	b
		tstb
		bne	1F
		bsr	joyrd
1		puls	b
		ldx	#JOYVAL
		ldb	b,x
		clra
		lbra	givu
; joyrd (קורא): לכל ערוץ, 3 עד 0: הבורר (ביט 3 ב-$FF01 = ביט 0 של הערוץ, ב-$FF03 = ביט 1), ואז מדידה:
; DAC מתחיל ב-128 עם צעד 64; כל השוואה (ביט 7 של $FF00) מוסיפה או מורידה את הצעד, והצעד נחצה; 6 השוואות
; (64 עד 2), והתוצאה חלקי 4 = 0-63. אם היא שונה מהערך השמור של הערוץ, מודדים שוב, עד 10 פעמים בסך הכול.
; אין שחזור: הבורר נשאר על ערוץ 0, וה-DAC על הניסיון האחרון שנכתב
joyrd		ldb	#3
1		pshs	b
		lda	PIA0+1		; ביט 0 של הערוץ → CA2
		anda	#$f7
		ora	#$30
		bitb	#1
		beq	2F
		ora	#$08
2		sta	PIA0+1
		lda	PIA0+3		; ביט 1 → CB2
		anda	#$f7
		ora	#$30
		bitb	#2
		beq	3F
		ora	#$08
3		sta	PIA0+3
		lda	#10		; ניסיונות
		pshs	a
4		ldd	#$8040		; A = הקירוב, B = הצעד
5		sta	PIA1		; הניסיון ל-DAC
		pshs	b
		tst	PIA0
		bmi	6F		; המוט מעל ה-DAC: מוסיפים
		suba	,s+
		bra	7F
6		adda	,s+
7		lsrb
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
		leas	1,s
		puls	b
		decb
		bpl	1B
		rts

; ---------- USR0-USR9, DEF USR (קורא) ----------
; ספרה אחת אחרי USR (בלעדיה 0). מספר: A=0, X=$004F (FAC). מחרוזת: A=$FF, X=המתאר (משוחרר).
; ב-Dragon 32 צורת המילה שונה מ-Dragon 64 (David Linsley, 20.10): פתוח, נבדוק במחשב אמיתי
fn_usr		clrb
		cmpa	#'0
		blo	1F
		cmpa	#'9
		bhi	1F
		suba	#'0
		pshs	a
		lbsr	chrget
		puls	b
1		pshs	b
		lda	#'(
		lbsr	synchk
		lbsr	frmevl
		lda	#')
		lbsr	synchk
		puls	b
		lslb
		ldx	USTBAD
		abx
		ldu	,x		; הכתובת
		pshs	u
		tst	VALTYP
		bne	2F
		ldx	#FACEXP
		clra
		jmp	[,s++]		; השגרה חוזרת ב-RTS ישר למי שקרא לפונקציה
2		ldx	FACMO
		pshs	x
		lbsr	fretms
		puls	x
		lda	#$ff
		jmp	[,s++]
; defusr: אחרי DEF, כש-TXTPTR על ה-$FF של USR
defusr		ldx	TXTPTR
		lda	1,x
		cmpa	#$a1
		lbne	err_sn
		lbsr	chrget
		lbsr	chrget
		clrb
		cmpa	#'0
		blo	1F
		cmpa	#'9
		bhi	1F
		suba	#'0
		pshs	a
		lbsr	chrget
		puls	b
1		pshs	b
		lda	#$cb		; =
		lbsr	synchk
		lbsr	frmevl
		lbsr	getadr
		tfr	d,u
		puls	b
		lslb
		ldx	USTBAD
		abx
		stu	,x
		rts

; ---------- POINT(x,y): מסך הטקסט (קורא + ה-VDG) ----------
; x 0-63, y 0-31. תא שאינו גרפי: -1. נקודה כבויה: 0. דולקת: הצבע 1-8
fn_point	lbsr	frmevl
		lbsr	conint
		cmpb	#63
		lbhi	err_fc
		pshs	b
		lda	#',
		lbsr	synchk
		lbsr	frmevl
		lbsr	conint
		cmpb	#31
		lbhi	err_fc
		pshs	b		; [0] = y, [1] = x
		lda	#')
		lbsr	synchk
		lda	#8		; המסכה: 8 למעלה-שמאל, 4 למעלה-ימין, 2 למטה-שמאל, 1 למטה-ימין
		ldb	1,s
		lsrb
		bcc	1F
		lsra
1		ldb	,s
		lsrb
		bcc	2F
		lsra
		lsra
2		sta	CELL
		puls	a,b		; A = y, B = x
		lsra			; השורה: (y/2)*32
		lsrb			; העמודה: x/2
		pshs	b
		ldb	#32
		mul
		addb	,s+
		adca	#0
		addd	#SCREEN
		tfr	d,x
		clr	VALTYP
		ldb	,x
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
5		clra
		lbra	givu
