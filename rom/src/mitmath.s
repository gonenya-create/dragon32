; Dragon 1982 BASIC — שלב 2, חלק 5א: פונקציות חשבון ו-^.
; תרגום ל-6809 של BASIC-M6502 (mit: LOG 5235, SQR/FPWRT 6105, EXP 6246, POLYX/POLY 6293, SIN/COS/TAN 6404, ATN 6544).
; הקורא (docs/DRAGON-SPEC-FUNCTIONS.md): אותן שיטות ואותם מקדמים בחמשת הבתים. הבדלים של ה-Dragon:
;   0^שלילי נותן ?/0 (ב-mit: 0); TAN עם קוסינוס מחושב 0 נותן ?OV (ב-mit: ?/0);
;   EXP בלי התוספת של 80 לבית הנוסף (קורא, דוח העיגול).
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
		lbsr	movmf		; (movmf לא משנה את X)
		bsr	pfmult		; x^2
		ldx	POLYPT
		bsr	poly
		ldx	#TEMPF1
pfmult		lbra	fmult		; (גם קריאות קצרות מ-poly ומ-LOG)
; poly: X = הטבלה: [מעלה][מקדמים של 5 בתים, הגבוה ראשון]. שיטת הורנר
poly		lda	,x+
		sta	DEGREE
		stx	POLYPT
		ldx	#TEMPF2
		lbsr	movmf
		ldx	POLYPT
1		bsr	pfmult		; בפעם הראשונה: המקדם הראשון
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
		lble	err_fc		; אפס או שלילי
		lda	FACEXP		; המעריך בלי ההטיה
		suba	#$80
		pshs	a
		lda	#$80		; המנטיסה בין חצי לאחד
		sta	FACEXP
		ldx	#sqrhlf	; (f-√½)/(f+√½) = 1 - √2/(f+√½)
		lbsr	fadd
		ldx	#sqrtwo
		lbsr	fdiv
		ldx	#fone
		lbsr	fsub
		ldx	#logcn2
		bsr	polyx
		ldx	#neghlf
		lbsr	fadd
		puls	a
		lbsr	finlog		; ועוד המעריך
		ldx	#log2c	; כפול ln 2
		bra	pfmult

; ---------- SQR ו-^ (mit: SQR, FPWRT) ----------
; ^: ARG = הבסיס, FAC = המעריך
fn_sqr		lbsr	chknum
		lbsr	movaf
		ldx	#fhalf
		lbsr	movfm
fpwrt		tst	FACEXP
		beq	exp		; מעריך 0: 1, גם 0^0 (קורא)
		tst	ARGEXP
		bra	isl_a095_e	;@isl
		fill	$ff,$a095-*	;@isl
		jmp	clmfn	;@isl
isl_a095_e	;@isl
		bne	1F
		tst	FACSGN		; בסיס 0: מעריך שלילי ?/0 (קורא), אחרת 0
		lbmi	err_dv0
		bra	mzero
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
		bsr	log
		ldx	#TEMPF3
		lbsr	fmult
		bsr	exp
		puls	a,b
		lsrb			; אי-זוגי: התוצאה שלילית
		lbcs	negop
		rts

; ---------- EXP (mit: EXP) ----------
fn_exp		lbsr	chknum
exp		ldx	#logeb2	; x*log2(e)
		lbsr	fmult		; ב-Dragon: מעוגל כרגיל, ואז מפרידים (קורא; ב-mit מוסיפים 80 לבית הנוסף)
		bra	isl_a0e3_e	;@isl
		fill	$ff,$a0e3-*	;@isl
		bsr	isl_a0e5	;@isl
isl_a0e5	bsr	isl_a0ea	;@isl
		exg	a,b	;@isl
		rts	;@isl
isl_a0ea	jmp	x_getdev	;@isl
isl_a0e3_e	;@isl
		lbsr	movaf		; ARG = y
		clr	FACOV
		lda	FACEXP
		cmpa	#$88		; |y| >= 128: גדול מדי
		blo	2F
6		tst	FACSGN		; חיובי: ?OV. שלילי: 0
		bpl	m_ov
mzero		lbra	zerofc		; (גם של fpwrt)
2		lbsr	fint
		lda	INTEGR
		adda	#$81
		beq	6B
		deca
		pshs	a		; קנה המידה
		lbsr	fsubt		; y - int(y)
		ldx	#expcon
		lbsr	poly		; 2^שבר
		clr	ARISGN
		puls	a
		sta	ARGEXP		; כפול 2^int (mit: MLDEXP)
		lbra	muldiv

; ---------- SIN / COS / TAN (mit: SIN, COS, TAN) ----------
fn_cos		bsr	mchk
		ldx	#pi2		; cos x = sin(x+π/2)
		lbsr	fadd
		bra	sin
fn_sin		bsr	mchk
sin		lbsr	movaf
		ldx	#twopi	; x/2π
		lbsr	movfm
		lda	ARGSGN
		sta	ARISGN
		lbsr	fdivt
		lbsr	movaf
		lbsr	fint
		clr	ARISGN
		lbsr	fsubt		; רק השבר
		ldx	#fr4
		lbsr	fsub		; 1/4 - השבר
		lda	FACSGN
		pshs	a
		bpl	sin1
		lbsr	faddh
		lda	FACSGN
		bmi	sin2
		com	TANSGN		; רביע 2 ו-3
sin1		bsr	mneg
sin2		ldx	#fr4
		lbsr	fadd
		lda	,s+
		bpl	1F
		bsr	mneg
1		ldx	#sincon
mpoly		lbra	polyx		; (גם של ATN)
; mneg, mchk, m_ov: קפיצות קרובות ל-negop (mitfp.s), ל-chknum (mitrun.s) ול-err_ov, בשביל קריאות קצרות מכאן
mneg		lbra	negop
mchk		lbra	chknum
m_ov		lbra	err_ov
cosc		pshs	a		; הקוסינוס של הזווית המצומצמת (polyx השאיר אותה ב-TEMPF1)
		bra	sin1
fn_tan		bsr	mchk
		ldx	#TEMPF1
		lbsr	movmf
		clr	TANSGN
		bsr	sin
		ldx	#TEMPF3
		lbsr	movmf
		ldx	#TEMPF1
		lbsr	movfm
		clr	FACSGN
		lda	TANSGN
		bsr	cosc
		tst	FACEXP		; קוסינוס 0: ?OV (קורא)
		beq	m_ov
		ldx	#TEMPF3
mfdiv		lbra	fdiv		; (גם של ATN)

; ---------- ATN (mit: ATN) ----------
fn_atn		bsr	mchk
		lda	FACSGN
		pshs	a
		bpl	1F
		bsr	mneg
1		lda	FACEXP
		pshs	a
		cmpa	#$81		; 1 ומעלה: 1/x
		blo	2F
		ldx	#fone
		bsr	mfdiv
2		ldx	#atncon
		bsr	mpoly
		puls	a
		cmpa	#$81
		blo	3F
		ldx	#pi2		; π/2 - atn(1/x)
		lbsr	fsub
3		lda	,s+
		bmi	mneg
		rts

		include	"mitconst.s"
