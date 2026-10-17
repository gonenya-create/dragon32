; Dragon 1982 BASIC: ביצוע שורה (ניסוי שלב 0): PRINT עם ביטויים חשבוניים
; המפרש עצמו (פקודות, שורות ממוספרות, משתנים) יבוא אחר כך. כאן: ביטוי := איבר {+|- איבר}, איבר := גורם {*|/ גורם}

COL		equ	$0066		; העמודה הנוכחית במסך (בשביל פסיק ב-PRINT)

; skipsp: מדלגים על רווחים. A = התו הבא
skipsp		lda	,x
		cmpa	#$20
		bne	1F
		leax	1,x
		bra	skipsp
1		tsta			; Z=1 בסוף השורה
		rts

; ---------- שגיאות: מדפיסים ?XX ERROR ו-OK, וחוזרים ללולאה הראשית ----------
err_sn		leau	m_sn,pcr
		bra	error
err_ov		leau	m_ov,pcr
		bra	error
err_div0	leau	m_div0,pcr
error		lds	#STACK
		lda	CURSOR+1
		anda	#$1f
		beq	1F
		lda	#13
		lbsr	putc
1		tfr	u,x
		lbsr	puts
		lbra	main_ok
m_sn		fcc	"?SN ERROR"
		fcb	13,0
m_ov		fcc	"?OV ERROR"
		fcb	13,0
m_div0		fcc	"?/0 ERROR"
		fcb	13,0

; ---------- ביטויים ----------
; push/pop של FAC למחסנית: 6 בתים
expr		bsr	term
ex_loop		bsr	skipsp
		cmpa	#'+
		beq	ex_add
		cmpa	#'-
		beq	ex_sub
		rts
ex_add		leax	1,x
		bsr	pushfac
		bsr	term
		lbsr	poparg
		lbsr	fadd
		bra	ex_loop
ex_sub		leax	1,x
		bsr	pushfac
		bsr	term
		bsr	poparg
		lbsr	fsub
		bra	ex_loop

term		bsr	factor
te_loop		bsr	skipsp
		cmpa	#'*
		beq	te_mul
		cmpa	#'/
		beq	te_div
		rts
te_mul		leax	1,x
		bsr	pushfac
		bsr	factor
		bsr	poparg
		lbsr	fmul
		bra	te_loop
te_div		leax	1,x
		bsr	pushfac
		bsr	factor
		bsr	poparg
		lbsr	fdiv
		bra	te_loop

factor		lbsr	skipsp
		cmpa	#'(
		bne	1F
		leax	1,x
		bsr	expr
		lbsr	skipsp
		cmpa	#')
		lbne	err_sn
		leax	1,x
		rts
1		cmpa	#'-
		bne	2F
		leax	1,x
		bsr	factor
		tst	FACEXP
		beq	3F
		com	FACSGN
3		rts
2		cmpa	#'+
		bne	4F
		leax	1,x
		bra	factor
4		cmpa	#'.
		beq	5F
		cmpa	#'0
		lblo	err_sn
		cmpa	#'9
		lbhi	err_sn
5		lbra	fin

; pushfac: שומרים את FAC (6 בתים) במחסנית, מתחת לכתובת החזרה
pushfac		puls	y		; כתובת החזרה
		ldd	FACM+2
		pshs	d
		ldd	FACM
		pshs	d
		lda	FACEXP
		ldb	FACSGN
		pshs	d
		jmp	,y
; poparg: ARG = הערך האחרון שנשמר
poparg		puls	y
		puls	d
		sta	ARGEXP
		stb	ARGSGN
		puls	d
		std	ARGM
		puls	d
		std	ARGM+2
		jmp	,y

; ---------- PRINT ----------
; כמו במקור: מספר מודפס עם רווח או מינוס לפניו ורווח אחריו; ; צמוד, , לעמודה הבאה (16), ובסוף שורה חדשה אלא אם נגמר ב-; או ,
st_print	lbsr	skipsp
		beq	pr_nl		; סוף השורה
pr_item		cmpa	#';
		beq	pr_semi
		cmpa	#',
		beq	pr_comma
		cmpa	#'"
		beq	pr_str
		lbsr	expr
		lbsr	fout		; U = הטקסט
		tfr	u,y
1		lda	,y+
		beq	2F
		lbsr	putc
		bra	1B
2		lda	#$20
		lbsr	putc
		bra	pr_next
pr_str		leax	1,x
3		lda	,x
		beq	pr_next
		leax	1,x
		cmpa	#'"
		beq	pr_next
		lbsr	putc
		bra	3B
pr_semi		leax	1,x
		lbsr	skipsp
		beq	pr_done
		bra	pr_item
pr_comma	leax	1,x
		; לעמודה הבאה שמתחלקת ב-16
4		lda	#$20
		lbsr	putc
		lda	CURSOR+1
		anda	#$0f
		bne	4B
		lbsr	skipsp
		beq	pr_done
		bra	pr_item
pr_next		lbsr	skipsp
		beq	pr_nl
		cmpa	#';
		beq	pr_semi
		cmpa	#',
		beq	pr_comma
		lbra	err_sn
pr_nl		lda	#13
		lbsr	putc
pr_done		rts

; ---------- ביצוע שורה ----------
execute		ldx	#LINBUF
		lbsr	skipsp
		beq	ex_ok
		cmpa	#'?
		bne	1F
		leax	1,x
		bra	2F
1		leau	kw_print,pcr
		bsr	match
		beq	2F
		; פקודות גרפיקה (gfx.s): מחזיר Z=1 אם הפקודה טופלה
		lbsr	gfx_dispatch
		lbne	err_sn
		bra	3F
2		lbsr	st_print
3
		lbsr	skipsp
		lbne	err_sn
ex_ok		rts

; match: האם הטקסט ב-X מתחיל במילה שב-U (מסתיימת ב-0)? אם כן Z=1 ו-X אחריה
match		pshs	x
1		lda	,u+
		beq	2F
		cmpa	,x+
		beq	1B
		puls	x
		andcc	#$fb		; Z=0
		rts
2		leas	2,s
		orcc	#$04		; Z=1
		rts
kw_print	fcc	"PRINT"
		fcb	0

; ---------- עזרים לפקודות ----------
; getint: מחשב ביטוי ומחזיר מספר שלם ב-D (0 עד 65535, החלק השבור נחתך). אחרת ?FC ERROR
getint		lbsr	expr
		tst	FACSGN
		lbmi	err_fc
		lda	FACEXP
		cmpa	#$90
		lbhi	err_fc		; 65536 ומעלה
		lbsr	qint
		ldd	QN+2
		rts
; getbyte: כמו getint, אבל 0 עד 255 (ב-B, ו-A=0)
getbyte		bsr	getint
		tsta
		lbne	err_fc
		rts
; expect: התו הבא (אחרי רווחים) חייב להיות A, ומדלגים עליו. אחרת ?SN ERROR
expect		pshs	a
		lbsr	skipsp
		cmpa	,s+
		lbne	err_sn
		leax	1,x
		rts
err_fc		leau	m_fc,pcr
		lbra	error
m_fc		fcc	"?FC ERROR"
		fcb	13,0
