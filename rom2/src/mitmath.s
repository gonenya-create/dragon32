; Dragon 1982 BASIC — שלב 2, חלק 5א: פונקציות חשבון ו-^.
; תרגום ל-6809 של BASIC-M6502 (mit: LOG 5235, SQR/FPWRT 6105, EXP 6246, POLYX/POLY 6293, SIN/COS/TAN 6404, ATN 6544).
; הקורא (docs/DRAGON-SPEC-FUNCTIONS.md): אותן שיטות ואותם מקדמים בחמשת הבתים. הבדלים של ה-Dragon:
;   0^שלילי נותן ?/0 (ב-mit: 0); TAN עם קוסינוס מחושב 0 נותן ?OV (ב-mit: ?/0).
; פתוח: הטיפול בבית הדיוק הנוסף ב-EXP שונה ב-Dragon, ולא תואר; כאן כמו ב-mit.
;
; Portions translated from Microsoft BASIC-M6502, Copyright (c) Microsoft Corporation, MIT License.

TEMPF1		equ	$40		; קורא: אזורי עבודה של 5 בתים
TEMPF2		equ	$45
TEMPF3		equ	$4a
INTEGR		equ	$01		; קורא: הבית הנמוך של INT (זוגיות), חופף ל-CHARAC
TANSGN		equ	$0a		; קורא: הסימן של הטנגנס
DEGREE		equ	$55		; קורא: חופף ל-SGNFLG
POLYPT		equ	$64		; קורא: חופף ל-STRNG2

; ---------- פולינומים (mit: POLYX, POLY) ----------
; polyx: X = הטבלה. FAC = x*P(x^2)
polyx		stx	POLYPT
		ldx	#TEMPF1
		lbsr	movmf
		ldx	#TEMPF1
		lbsr	fmult		; x^2
		ldx	POLYPT
		lbsr	poly
		ldx	#TEMPF1
		lbra	fmult
; poly: X = הטבלה: [מעלה][מקדמים של 5 בתים, הגבוה ראשון]. שיטת הורנר
poly		stx	POLYPT
		ldx	#TEMPF2
		lbsr	movmf
		ldx	POLYPT
		lda	,x+
		sta	DEGREE
		stx	POLYPT
1		lbsr	fmult		; בפעם הראשונה: המקדם הראשון
		ldx	POLYPT
		leax	5,x
		stx	POLYPT
		lbsr	fadd
		ldx	#TEMPF2
		dec	DEGREE
		bne	1B
		rts

; ---------- LOG (mit: LOG) ----------
fn_log		lbsr	chknum
log		lbsr	sign
		lbeq	err_fc		; אפס
		lbmi	err_fc		; שלילי
		lda	FACEXP		; המעריך בלי ההטיה
		suba	#$80
		pshs	a
		lda	#$80		; המנטיסה בין חצי לאחד
		sta	FACEXP
		leax	sqrhlf,pcr	; (f-√½)/(f+√½) = 1 - √2/(f+√½)
		lbsr	fadd
		leax	sqrtwo,pcr
		lbsr	fdiv
		leax	fone,pcr
		lbsr	fsub
		leax	logcn2,pcr
		lbsr	polyx
		leax	neghlf,pcr
		lbsr	fadd
		puls	a
		lbsr	finlog		; ועוד המעריך
		leax	log2c,pcr	; כפול ln 2
		lbra	fmult

; ---------- SQR ו-^ (mit: SQR, FPWRT) ----------
; ^: ARG = הבסיס, FAC = המעריך
fn_sqr		lbsr	chknum
		lbsr	movaf
		leax	fhalf,pcr
		lbsr	movfm
fpwrt		tst	FACEXP
		lbeq	exp		; מעריך 0: 1, גם 0^0 (קורא)
		tst	ARGEXP
		bne	1F
		tst	FACSGN		; בסיס 0: מעריך שלילי ?/0 (קורא), אחרת 0
		lbmi	err_dv0
		lbra	zerofc
1		ldx	#TEMPF3		; שומרים את המעריך
		lbsr	movmf
		clrb			; הזוגיות
		lda	ARGSGN
		bpl	3F
		lbsr	fint		; בסיס שלילי: המעריך שלם?
		ldx	#TEMPF3
		lbsr	fcomp
		bne	3F		; לא: LOG של שלילי נותן ?FC
		clra			; כן: הבסיס חיובי, והזוגיות מ-INTEGR
		ldb	INTEGR
3		pshs	a,b
		lbsr	movfa		; FAC = הבסיס, עם הסימן ב-A (mit: MOVFA1)
		lda	,s
		sta	FACSGN
		lbsr	log
		ldx	#TEMPF3
		lbsr	fmult
		lbsr	exp
		puls	a,b
		lsrb			; אי-זוגי: התוצאה שלילית
		lbcs	negop
		rts

; ---------- EXP (mit: EXP) ----------
fn_exp		lbsr	chknum
exp		leax	logeb2,pcr	; x*log2(e)
		lbsr	fmult
		lda	FACOV
		adda	#$50
		bcc	1F
		lbsr	incrnd
1		sta	OLDOV
		ldd	FACEXP		; FAC → ARG בלי עיגול (mit: MOVEF)
		std	ARGEXP
		ldd	FACMOH
		std	ARGMOH
		ldd	FACLO
		std	ARGLO
		clr	FACOV
		lda	FACEXP
		cmpa	#$88		; |y| >= 128: גדול מדי
		blo	2F
6		tst	FACSGN		; חיובי: ?OV. שלילי: 0
		lbpl	err_ov
		lbra	zerofc
2		lbsr	fint
		lda	INTEGR
		adda	#$81
		beq	6B
		deca
		pshs	a		; קנה המידה
		ldx	#FACEXP		; מחליפים בין FAC ל-ARG (6 בתים)
		ldu	#ARGEXP
		ldb	#6
3		lda	,x
		pshs	a
		lda	,u
		sta	,x+
		puls	a
		sta	,u+
		decb
		bne	3B
		lda	OLDOV
		sta	FACOV
		lbsr	fsubt		; int(y) - y
		lbsr	negop		; y - int(y)
		leax	expcon,pcr
		lbsr	poly		; 2^שבר
		clr	ARISGN
		puls	a
		sta	ARGEXP		; כפול 2^int (mit: MLDEXP)
		lbra	muldiv

; ---------- SIN / COS / TAN (mit: SIN, COS, TAN) ----------
fn_cos		lbsr	chknum
		leax	pi2,pcr		; cos x = sin(x+π/2)
		lbsr	fadd
		bra	sin
fn_sin		lbsr	chknum
sin		lbsr	movaf
		leax	twopi,pcr	; x/2π
		lbsr	movfm
		lda	ARGSGN
		sta	ARISGN
		lbsr	fdivt
		lbsr	movaf
		lbsr	fint
		clr	ARISGN
		lbsr	fsubt		; רק השבר
		leax	fr4,pcr
		lbsr	fsub		; 1/4 - השבר
		lda	FACSGN
		pshs	a
		bpl	sin1
		lbsr	faddh
		lda	FACSGN
		bmi	sin2
		com	TANSGN		; רביע 2 ו-3
sin1		lbsr	negop
sin2		leax	fr4,pcr
		lbsr	fadd
		puls	a
		tsta
		bpl	1F
		lbsr	negop
1		leax	sincon,pcr
		lbra	polyx
cosc		pshs	a		; הקוסינוס של הזווית המצומצמת (polyx השאיר אותה ב-TEMPF1)
		bra	sin1
fn_tan		lbsr	chknum
		ldx	#TEMPF1
		lbsr	movmf
		clr	TANSGN
		lbsr	sin
		ldx	#TEMPF3
		lbsr	movmf
		ldx	#TEMPF1
		lbsr	movfm
		clr	FACSGN
		lda	TANSGN
		lbsr	cosc
		tst	FACEXP		; קוסינוס 0: ?OV (קורא)
		lbeq	err_ov
		ldx	#TEMPF3
		lbra	fdiv

; ---------- ATN (mit: ATN) ----------
fn_atn		lbsr	chknum
		lda	FACSGN
		pshs	a
		bpl	1F
		lbsr	negop
1		lda	FACEXP
		pshs	a
		cmpa	#$81		; 1 ומעלה: 1/x
		blo	2F
		leax	fone,pcr
		lbsr	fdiv
2		leax	atncon,pcr
		lbsr	polyx
		puls	a
		cmpa	#$81
		blo	3F
		leax	pi2,pcr		; π/2 - atn(1/x)
		lbsr	fsub
3		puls	a
		tsta
		lbmi	negop
		rts

		include	"mitconst.s"
