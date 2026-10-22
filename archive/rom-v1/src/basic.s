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
error		ldd	#0		; שגיאה אמיתית: אי אפשר CONT
		std	CONTLN
error2		lds	#STACK
		lda	CURSOR+1
		anda	#$1f
		beq	1F
		lda	#13
		lbsr	putc
1		tfr	u,x
		lbsr	puts
		; בזמן הרצה: גם מספר השורה ("?SN ERROR IN 30")
		ldy	CURLN
		beq	2F
		leax	m_in,pcr
		lbsr	puts
		ldd	2,y
		lbsr	prtint
2		lda	#13
		lbsr	putc
		ldd	#0
		std	CURLN
		ldd	#FORBASE
		std	FORSP
		lbra	main_ok
m_in		fcc	" IN "
		fcb	0
m_sn		fcc	"?SN ERROR"
		fcb	0
m_ov		fcc	"?OV ERROR"
		fcb	0
m_div0		fcc	"?/0 ERROR"
		fcb	0

; ---------- ביטויים ----------
; push/pop של FAC למחסנית: 6 בתים
expr		bsr	term
ex_loop		lbsr	skipsp
		cmpa	#'+
		beq	ex_add
		cmpa	#'-
		beq	ex_sub
		rts
ex_add		leax	1,x
		tst	VALTYP
		bne	ex_cat		; מחרוזת + מחרוזת: חיבור מחרוזות
		lbsr	pushfac
		bsr	term
		lbsr	neednum
		lbsr	poparg
		lbsr	fadd
		bra	ex_loop
ex_cat		lbsr	pushstr
		bsr	term
		lbsr	needstr
		lbsr	str_concat
		bra	ex_loop
ex_sub		leax	1,x
		lbsr	neednum
		lbsr	pushfac
		bsr	term
		lbsr	neednum
		lbsr	poparg
		lbsr	fsub
		bra	ex_loop

term		bsr	factor
te_loop		lbsr	skipsp
		cmpa	#'*
		beq	te_mul
		cmpa	#'/
		beq	te_div
		rts
te_mul		leax	1,x
		lbsr	neednum
		lbsr	pushfac
		bsr	factor
		lbsr	neednum
		lbsr	poparg
		lbsr	fmul
		bra	te_loop
te_div		leax	1,x
		lbsr	neednum
		lbsr	pushfac
		bsr	factor
		lbsr	neednum
		lbsr	poparg
		lbsr	fdiv
		bra	te_loop

; factor: מספר, משתנה, מחרוזת במרכאות, פונקציה, סוגריים, או מינוס. VALTYP אומר אם התוצאה מחרוזת
factor		clr	VALTYP
		lbsr	skipsp
		cmpa	#'(
		bne	1F
		leax	1,x
		lbsr	rexpr
		lbsr	skipsp
		cmpa	#')
		lbne	err_sn
		leax	1,x
		rts
1		cmpa	#'-
		bne	2F
		leax	1,x
		bsr	factor
		lbsr	neednum
		tst	FACEXP
		beq	3F
		com	FACSGN
3		rts
2		cmpa	#'+
		bne	9F
		leax	1,x
		bra	factor
9		cmpa	#'"
		lbeq	str_lit
4		cmpa	#'A
		blo	6F
		cmpa	#'Z
		bhi	6F
		; קודם פונקציית מחרוזת (strings.s), אחר כך פונקציה מספרית (funcs.s), ואם לא, משתנה.
		; קיצור: שם שאחריו אין '(' או '$' (ואינו TIMER) הוא בטוח משתנה, וחוסכים עשרות השוואות
		ldd	,x		; FN + אות: פונקציה שהוגדרה ב-DEF FN
		cmpd	#$464e		; "FN"
		bne	11F
		lda	2,x
		cmpa	#'A
		blo	11F
		cmpa	#'Z
		lbls	do_fn
11		lbsr	fnlike
		bne	7F
		lbsr	sfn_dispatch
		beq	8F
		lbsr	gfx_fn		; PPOINT, POINT (gfx.s)
		beq	8F
		lbsr	fn_dispatch
		bne	7F
		clr	VALTYP
8		rts
7		pshs	y
		lbsr	getvar		; משתנה: הערך שלו
		tst	VNAME+1
		bmi	10F
		lbsr	ldfac
		clr	VALTYP
		puls	y,pc
10		lda	,u		; משתנה מחרוזת: האורך והכתובת
		sta	SLEN
		ldd	1,u
		std	SPTR
		lda	#$ff
		sta	VALTYP
		puls	y,pc
6		cmpa	#'.
		beq	5F
		cmpa	#'0
		lblo	err_sn
		cmpa	#'9
		lbhi	err_sn
5		lbra	fin

; fnlike: Z=1 אם השם ב-X יכול להיות פונקציה: אחרי האותיות/ספרות בא '(' או '$', או שזה TIMER
fnlike		pshs	x
		leau	kw_timer,pcr
		lbsr	match
		beq	3F
1		lda	,x+
		cmpa	#'0
		blo	2F
		cmpa	#'9
		bls	1B
		cmpa	#'A
		blo	2F
		cmpa	#'Z
		bls	1B
2		cmpa	#'(
		beq	3F
		cmpa	#'$
3		puls	x,pc

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
st_print	lbsr	atend		; סוף הפקודה (סוף שורה, : או ELSE)
		lbeq	pr_nl
		leau	kw_using,pcr	; PRINT USING: בשבב ההרחבה
		lbsr	match
		lbeq	pr_using
		lda	,x
		cmpa	#'@
		bne	pr_item
		; PRINT @ מקום,: מתחילים לכתוב במקום הזה במסך (0-511)
		leax	1,x
		lbsr	getint
		cmpd	#511
		lbhi	err_fc
		addd	#SCREEN
		std	CURSOR
		lbsr	skipsp
		cmpa	#',
		lbne	pr_next
		leax	1,x
		lbsr	atend
		lbeq	pr_done
pr_item		cmpa	#';
		beq	pr_semi
		; TAB(n): רווחים עד העמודה n
		leau	kw_tab,pcr
		lbsr	match
		bne	6F
		lbsr	getbyte
		lbsr	closep
7		lda	CURSOR+1
		anda	#$1f
		pshs	b
		cmpa	,s+
		lbhs	pr_next
		lda	#$20
		lbsr	putc
		bra	7B
6		lbsr	skipsp
		cmpa	#',
		beq	pr_comma
		lbsr	rexpr
		tst	VALTYP
		beq	5F
		lbsr	prtstr		; מחרוזת: כמו שהיא, בלי רווחים
		bra	pr_next
5		lbsr	fout		; U = הטקסט
		tfr	u,y
1		lda	,y+
		beq	2F
		lbsr	putc
		bra	1B
2		lda	#$20
		lbsr	putc
		bra	pr_next
pr_semi		leax	1,x
		lbsr	atend
		beq	pr_done
		bra	pr_item
pr_comma	leax	1,x
		; לעמודה הבאה שמתחלקת ב-16
4		lda	#$20
		lbsr	putc
		lda	CURSOR+1
		anda	#$0f
		bne	4B
		lbsr	atend
		beq	pr_done
		bra	pr_item
pr_next		lbsr	atend
		beq	pr_nl
		cmpa	#';
		beq	pr_semi
		cmpa	#',
		beq	pr_comma
		lbra	err_sn
pr_nl		lda	#13
		lbsr	putc
pr_done		rts
kw_tab		fcc	"TAB("
		fcb	0
kw_using	fcc	"USING"
		fcb	0

; atend: סוף פקודה? Z=1 בסוף השורה, ב-: או ב-ELSE (בלי להתקדם). A = התו
atend		lbsr	skipsp
		beq	9F
		cmpa	#':
		beq	9F
		cmpa	#'E
		bne	9F
		pshs	d
		ldd	1,x
		cmpd	#$4c53		; LS
		bne	8F
		lda	3,x
		cmpa	#'E
8		puls	d
9		rts

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
getint		lbsr	rexpr
		lbsr	neednum
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
		fcb	0
