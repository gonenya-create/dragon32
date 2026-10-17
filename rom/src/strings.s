; Dragon 1982 BASIC: מחרוזות. משתני מחרוזת (A$), מחרוזות בביטויים, חיבור עם +, השוואה, הפונקציות
; LEN ASC VAL CHR$ STR$ LEFT$ RIGHT$ MID$ STRING$ INSTR INKEY$, והפקודה INPUT. נכתב מאפס.
;
; ערך מחרוזת בביטוי: VALTYP=$FF, האורך ב-SLEN והכתובת ב-SPTR. מחרוזת במשתנה: [אורך][כתובת 2][0][0].
; המחרוזות עצמן בערימה שיורדת מ-STRTOP. איסוף זבל רק בתחילת פקודה (str_check), כשנשאר מעט מקום,
; כדי לא להזיז מחרוזות זמניות באמצע חישוב.

VALTYP		equ	$a8		; 0 = מספר, $FF = מחרוזת
SLEN		equ	$a9
SPTR		equ	$aa		; 2 בתים
STRFREE		equ	$ac		; 2 בתים: תחילת המקום התפוס (הערימה יורדת)
SPTR2		equ	$ae		; 2 בתים, זמני
STRTOP		equ	$7e00
STRBUF		equ	$0330		; 16 בתים זמניים (VAL), אחרי ספרות FOUT
GCLEN		equ	$b4		; 2 בתים
TMPB		equ	$b6

; ---------- ערימה ----------
str_reset	ldd	#STRTOP
		std	STRFREE
		rts

; str_alloc: מקום ל-B בתים. מחזיר Y = הכתובת (X, מצביע הטקסט, לא משתנה). אין מספיק מקום: ?OS ERROR
str_alloc	pshs	d
		clra
		ldb	1,s
		pshs	d
		ldd	STRFREE
		subd	,s++
		cmpd	#STRLOW
		lblo	err_os
		cmpd	ARYEND
		lblo	err_os
		std	STRFREE
		tfr	d,y
		puls	d,pc

; str_save: מעתיק את המחרוזת שב-SLEN/SPTR לערימה. SPTR = העותק
str_save	pshs	d,x,y,u
		ldb	SLEN
		beq	2F
		lbsr	str_alloc	; Y = היעד
		ldu	SPTR
		sty	SPTR
1		lda	,u+
		sta	,y+
		decb
		bne	1B
2		puls	d,x,y,u,pc

; str_check: בתחילת פקודה. פחות מ-300 בתים פנויים? מכווצים את הערימה
str_check	pshs	d
		ldd	STRFREE
		subd	#300
		bcs	1F
		cmpd	#STRLOW
		blo	1F
		cmpd	ARYEND
		blo	1F
		puls	d,pc
1		puls	d
; str_gc: איסוף זבל. כל מחרוזת שמשתנה מצביע עליה עוברת לראש הערימה, מהכתובת הגבוהה לנמוכה
str_gc		pshs	d,x,y,u
		ldd	#STRTOP
		std	SPTR2		; התקרה החדשה
		ldu	#STRTOP		; הגבול: מחפשים מחרוזות מתחתיו
gc_pass		ldx	#0		; התיאור (5 בתים: אורך, כתובת) עם הכתובת הגבוהה ביותר מתחת לגבול
		; משתנים רגילים: התיאור ב-2 בכל רשומה
		ldy	PROGEND
1		cmpy	VARTOP
		bhs	12F
		tst	1,y
		bpl	2F		; לא מחרוזת
		leay	2,y
		lbsr	gc_cand
		leay	-2,y
2		leay	7,y
		bra	1B
12		; מערכי מחרוזות: [שם 2][אורך הרשומה 2][ממדים 1][גדלים 2 או 4][איברים של 5 בתים]
		ldy	VARTOP
13		cmpy	ARYEND
		bhs	3F
		tfr	y,d
		addd	2,y
		pshs	d		; סוף המערך
		tst	1,y
		bpl	15F
		pshs	y
		leay	7,y
		lda	4-7,y
		cmpa	#2
		bne	14F
		leay	2,y
14		cmpy	2,s
		bhs	16F
		lbsr	gc_cand
		leay	5,y
		bra	14B
16		puls	y
15		puls	y		; למערך הבא
		bra	13B
3		cmpx	#0
		beq	gc_done
		; מזיזים את המחרוזת של הרשומה X אל מתחת לתקרה החדשה. היעד תמיד מעל המקור, אז מעתיקים מהסוף
		ldu	1,x		; המקור
		pshs	u		; הוא גם הגבול של הסיבוב הבא
		clra
		ldb	,x
		std	GCLEN
		ldd	SPTR2
		subd	GCLEN
		std	SPTR2		; היעד
		std	1,x
		addd	GCLEN
		tfr	d,y		; סוף היעד
		tfr	u,d
		addd	GCLEN
		tfr	d,u		; סוף המקור
		ldb	GCLEN+1
5		tstb
		beq	6F
		lda	,-u
		sta	,-y
		decb
		bra	5B
6		puls	u
		lbra	gc_pass
gc_done		ldd	SPTR2
		std	STRFREE
		puls	d,x,y,u,pc

; gc_cand: התיאור ב-Y מועמד? (בערימה, מתחת לגבול U, ומעל הטוב ביותר עד עכשיו ב-X)
gc_cand		tst	,y
		beq	1F		; ריקה
		ldd	1,y
		cmpd	STRFREE
		blo	1F		; לא בערימה
		pshs	u
		cmpd	,s++
		bhs	1F		; כבר טופלה
		cmpx	#0
		beq	2F
		cmpd	1,x
		bls	1F
2		tfr	y,x
1		rts

; ---------- ערכים ----------
; str_lit: X על '"'. SLEN/SPTR = התוכן (מצביע לטקסט עצמו), X אחרי המרכאה הסוגרת
str_lit		leax	1,x
		stx	SPTR
		clrb
1		lda	,x
		beq	2F
		leax	1,x
		cmpa	#'"
		beq	2F
		incb
		bra	1B
2		stb	SLEN
		lda	#$ff
		sta	VALTYP
		rts

; needstr / neednum: בודקים את סוג הערך האחרון. אחרת ?TM ERROR
needstr		tst	VALTYP
		lbeq	err_tm
		rts
neednum		tst	VALTYP
		lbne	err_tm
		rts

; strexpr: ביטוי שחייב להיות מחרוזת
strexpr		lbsr	rexpr
		bra	needstr

; pushstr / popstr: SLEN/SPTR במחסנית (3 בתים, מתחת לכתובת החזרה)
pushstr		puls	y
		ldd	SPTR
		pshs	d
		lda	SLEN
		pshs	a
		jmp	,y
; str_concat: הערך שבמחסנית (שמאל) + SLEN/SPTR (ימין). התוצאה בערימה
str_concat	puls	y		; כתובת החזרה
		puls	a		; אורך שמאל
		puls	u		; כתובת שמאל
		pshs	y
		pshs	a
		adda	SLEN
		lbcs	err_ls		; יותר מ-255
		tfr	a,b
		lbsr	str_alloc	; Y = מקום לתוצאה
		pshs	y
		; שמאל
		ldb	2,s
		beq	2F
1		lda	,u+
		sta	,y+
		decb
		bne	1B
2		ldu	SPTR		; ימין
		ldb	SLEN
		beq	4F
3		lda	,u+
		sta	,y+
		decb
		bne	3B
4		puls	y
		sty	SPTR
		puls	a
		adda	SLEN
		sta	SLEN
		lda	#$ff
		sta	VALTYP
		rts

; str_cmp: משווה את המחרוזת שבמחסנית (שמאל) עם SLEN/SPTR (ימין). A = -1/0/1 כמו fcmp (ימין מול שמאל)
str_cmp		puls	y
		puls	a		; אורך שמאל
		puls	u		; כתובת שמאל
		pshs	y
		ldy	SPTR
		ldb	SLEN
		pshs	a,b		; [s]=אורך שמאל, [s+1]=אורך ימין
1		tst	,s
		beq	2F
		tst	1,s
		beq	3F
		lda	,y+		; ימין
		cmpa	,u+		; שמאל
		bhi	4F		; ימין גדול
		blo	5F
		dec	,s
		dec	1,s
		bra	1B
2		tst	1,s		; שמאל נגמר
		beq	6F		; שווים
4		lda	#1		; ימין גדול
		bra	7F
3		; ימין נגמר, שמאל לא: ימין קטן
5		lda	#$ff
		bra	7F
6		clra
7		leas	2,s
		rts

; ---------- פונקציות מחרוזת ----------
; sfn_dispatch: X על שם. אם זו פונקציית מחרוזת: מחשבים, Z=1. אחרת Z=0 ו-X לא משתנה
sfn_dispatch	leau	sfn_table,pcr
1		tst	,u
		beq	3F
		pshs	u
		lbsr	match
		puls	u
		beq	2F
4		tst	,u+
		bne	4B
		leau	2,u
		bra	1B
2		tst	,u+
		bne	2B
		ldd	,u
		leau	sfn_base,pcr
		jsr	d,u
		orcc	#$04		; Z=1
		rts
3		andcc	#$fb
		rts

sfn_base
sfn_table	fcc	"LEN("
		fcb	0
		fdb	f_len-sfn_base
		fcc	"ASC("
		fcb	0
		fdb	f_asc-sfn_base
		fcc	"VAL("
		fcb	0
		fdb	f_val-sfn_base
		fcc	"CHR$("
		fcb	0
		fdb	f_chr-sfn_base
		fcc	"STR$("
		fcb	0
		fdb	f_str-sfn_base
		fcc	"LEFT$("
		fcb	0
		fdb	f_left-sfn_base
		fcc	"RIGHT$("
		fcb	0
		fdb	f_right-sfn_base
		fcc	"MID$("
		fcb	0
		fdb	f_mid-sfn_base
		fcc	"STRING$("
		fcb	0
		fdb	f_string-sfn_base
		fcc	"INSTR("
		fcb	0
		fdb	f_instr-sfn_base
		fcc	"INKEY$"
		fcb	0
		fdb	f_inkey-sfn_base
		fcc	"PEEK("
		fcb	0
		fdb	f_peek-sfn_base
		fcb	0

closep		lda	#')
		lbra	expect
comma		lda	#',
		lbra	expect
; num_result: B (0-255) כמספר ב-FAC
num_result	clra
		lbsr	givd
		clr	VALTYP
		rts

f_len		lbsr	strexpr
		bsr	closep
		ldb	SLEN
		bra	num_result
f_asc		lbsr	strexpr
		bsr	closep
		ldb	SLEN
		lbeq	err_fc
		ldb	[SPTR]
		bra	num_result
f_val		lbsr	strexpr
		bsr	closep
		; מעתיקים למאגר עם 0 בסוף, וקוראים מספר
		pshs	x
		ldx	#STRBUF
		ldu	SPTR
		ldb	SLEN
		cmpb	#15
		bls	1F
		ldb	#15
1		tstb
		beq	2F
		lda	,u+
		sta	,x+
		decb
		bra	1B
2		clr	,x
		ldx	#STRBUF
		lbsr	skipsp
		clr	,-s		; שלילי?
		cmpa	#'-
		bne	3F
		com	,s
		leax	1,x
3		lbsr	fin
		tst	,s+
		beq	4F
		tst	FACEXP
		beq	4F
		com	FACSGN
4		clr	VALTYP
		puls	x,pc
f_chr		lbsr	getbyte		; B = קוד התו
		pshs	b
		bsr	closep
		ldb	#1
		lbsr	str_alloc
		puls	b
		stb	,y
		sty	SPTR
		lda	#1
		sta	SLEN
		lda	#$ff
		sta	VALTYP
		rts
f_str		lbsr	rexpr
		lbsr	neednum
		lbsr	closep
		pshs	x
		lbsr	fout		; U = הטקסט (עם רווח או מינוס לפניו, כמו במקור)
		stu	SPTR
		clrb
1		tst	,u+
		beq	2F
		incb
		bra	1B
2		stb	SLEN
		lda	#$ff
		sta	VALTYP
		lbsr	str_save	; הטקסט ב-FBUF זמני: מעתיקים
		puls	x,pc
f_left		lbsr	strexpr
		lbsr	pushstr		; [s]=אורך, [s+1]=כתובת
		lbsr	comma
		lbsr	getbyte
		pshs	b
		lbsr	closep
		puls	b
		cmpb	,s
		bls	1F
		ldb	,s		; יותר מהאורך: כולה
1		stb	SLEN
		ldu	1,s
		stu	SPTR
		leas	3,s
		lda	#$ff
		sta	VALTYP
		rts
f_right		lbsr	strexpr
		lbsr	pushstr
		lbsr	comma
		lbsr	getbyte
		pshs	b
		lbsr	closep
		puls	b
		cmpb	,s
		bls	1F
		ldb	,s
1		stb	SLEN
		lda	,s		; מתחילים ב-אורך - n
		suba	SLEN
		tfr	a,b
		clra
		ldu	1,s
		leau	d,u
		stu	SPTR
		leas	3,s
		lda	#$ff
		sta	VALTYP
		rts
f_mid		lbsr	strexpr
		lbsr	pushstr
		lbsr	comma
		lbsr	getbyte		; ההתחלה (מ-1)
		tstb
		lbeq	err_fc
		pshs	b
		ldb	#255		; בלי אורך: עד הסוף
		lbsr	skipsp
		cmpa	#',
		bne	1F
		leax	1,x
		lbsr	getbyte
1		pshs	b
		lbsr	closep
		; [s]=אורך מבוקש [s+1]=התחלה [s+2]=אורך המחרוזת [s+3..4]=כתובת
		ldb	1,s
		decb
		stb	TMPB		; ההתחלה מאפס
		lda	2,s
		suba	TMPB		; כמה נשאר
		bhi	2F
		clra			; ההתחלה אחרי הסוף: ריקה
2		cmpa	,s
		bls	3F
		lda	,s
3		sta	SLEN
		ldb	TMPB
		clra
		ldu	3,s
		leau	d,u
		stu	SPTR
		leas	5,s
		lda	#$ff
		sta	VALTYP
		rts
f_string	lbsr	getbyte		; כמה פעמים
		pshs	b
		lbsr	comma
		lbsr	rexpr
		tst	VALTYP
		beq	1F
		lda	SLEN
		lbeq	err_fc
		lda	[SPTR]		; התו הראשון של המחרוזת
		bra	2F
1		lbsr	getbyte_fac
		tfr	b,a
2		pshs	a
		lbsr	closep
		puls	a
		ldb	,s
		pshs	a
		lbsr	str_alloc
		puls	a
		sty	SPTR
		ldb	,s
		stb	SLEN
3		tstb
		beq	4F
		sta	,y+
		decb
		bra	3B
4		leas	1,s
		lda	#$ff
		sta	VALTYP
		rts
; getbyte_fac: FAC (שכבר חושב) → B, 0-255
getbyte_fac	tst	FACSGN
		lbmi	err_fc
		lda	FACEXP
		cmpa	#$88
		lbhi	err_fc
		lbsr	qint
		ldb	QN+3
		rts
f_instr		; INSTR([התחלה,] מחרוזת, מחפשים)
		lbsr	rexpr
		ldb	#1
		tst	VALTYP
		bne	1F
		lbsr	getbyte_fac	; התחלה
		pshs	b
		lbsr	comma
		lbsr	strexpr
		puls	b
1		pshs	b		; [s] = התחלה
		lbsr	pushstr		; המחרוזת
		lbsr	comma
		lbsr	strexpr		; מה מחפשים: SLEN/SPTR
		lbsr	closep
		; [s]=אורך [s+1..2]=כתובת [s+3]=התחלה
		ldb	3,s
		beq	8F
		decb			; i מאפס
9		; האם יש מקום?
		tfr	b,a
		adda	SLEN
		bcs	8F
		cmpa	,s
		bhi	8F
		; משווים במקום i
		ldu	1,s
		leau	b,u
		tstb
		bpl	5F
		leau	256,u
5		ldy	SPTR
		pshs	b
		ldb	SLEN
		beq	7F		; מחפשים ריקה: נמצאה במקום ההתחלה
6		lda	,u+
		cmpa	,y+
		bne	10F
		decb
		bne	6B
7		puls	b
		incb			; המקום מ-1
		leas	4,s
		lbra	num_result
10		puls	b
		incb
		bra	9B
8		leas	4,s
		clrb
		lbra	num_result
f_inkey		; המקש שנלחץ עכשיו, בלי לחכות. אין: ""
		lbsr	inkey
		tsta
		beq	1F
		pshs	a
		ldb	#1
		lbsr	str_alloc
		puls	a
		sta	,y
		sty	SPTR
		lda	#1
		bra	2F
1		clra
2		sta	SLEN
		lda	#$ff
		sta	VALTYP
		rts

; ---------- INPUT ----------
; INPUT ["הודעה";] משתנה[,משתנה...]
st_input	ldd	CURLN
		lbeq	err_id		; רק בתוך תוכנית, כמו במקור
		lbsr	skipsp
		cmpa	#'"
		bne	1F
		lbsr	str_lit
		lbsr	prtstr
		lda	#';
		lbsr	expect
1		stx	INPX		; תחילת רשימת המשתנים
in_ask		lda	#'?
		lbsr	putc
		lda	#$20
		lbsr	putc
in_more		pshs	x
		lbsr	getline		; התשובה ב-LINBUF
		puls	x
		ldy	#LINBUF
in_var		; המשתנה הבא (getvar משתמש ב-Y, ששומר את המקום בתשובה)
		pshs	y
		lbsr	getvar		; U = הערך, VNAME[1] ביט 7 = מחרוזת
		puls	y
		pshs	x,u
		tfr	y,x
		lbsr	skipsp
		tst	VNAME+1
		bmi	in_str
		; מספר
		clr	,-s		; שלילי?
		cmpa	#'-
		bne	2F
		com	,s
		leax	1,x
2		lda	,x
		cmpa	#',
		beq	in_redo0
		tsta
		beq	in_redo0
		lbsr	fin
		tst	,s+
		beq	3F
		tst	FACEXP
		beq	3F
		com	FACSGN
3		lbsr	skipsp
		beq	4F
		cmpa	#',
		bne	in_redo
4		ldu	2,s
		lbsr	stfac
		bra	in_next
in_redo0	leas	1,s
in_redo		leas	4,s
		leax	m_redo,pcr
		lbsr	puts
		ldx	INPX
		bra	in_ask
in_str		; מחרוזת: עד פסיק או סוף (במרכאות: עד המרכאה)
		cmpa	#'"
		bne	5F
		lbsr	str_lit
		bra	6F
5		stx	SPTR
		clrb
7		lda	,x
		beq	8F
		cmpa	#',
		beq	8F
		leax	1,x
		incb
		bra	7B
8		stb	SLEN
6		lbsr	str_save
		ldu	2,s
		lda	SLEN
		sta	,u
		ldd	SPTR
		std	1,u
in_next		tfr	x,y		; ההמשך בתשובה
		puls	x,u
		lbsr	skipsp
		cmpa	#',
		bne	in_done
		leax	1,x		; עוד משתנה ברשימה
		lda	,y
		cmpa	#',
		bne	9F
		leay	1,y
		lbra	in_var
9		; נגמרו התשובות: "??" ושורה נוספת
		pshs	x
		leax	m_qq,pcr
		lbsr	puts
		puls	x
		lbra	in_more
in_done		; תשובות מיותרות?
		lda	,y
		beq	1F
		pshs	x
		leax	m_extra,pcr
		lbsr	puts
		puls	x
1		rts
INPX		equ	$d0		; 2 בתים
m_redo		fcc	"?REDO"
		fcb	13,0
m_qq		fcc	"?? "
		fcb	0
m_extra		fcc	"?EXTRA IGNORED"
		fcb	13,0

; prtstr: מדפיס את SLEN/SPTR
prtstr		pshs	b,u
		ldu	SPTR
		ldb	SLEN
1		beq	2F
		lda	,u+
		lbsr	putc
		decb
		bra	1B
2		puls	b,u,pc

; ---------- שגיאות ----------
err_tm		leau	m_tm,pcr
		lbra	error
err_os		leau	m_os,pcr
		lbra	error
err_ls		leau	m_ls,pcr
		lbra	error
err_id		leau	m_id,pcr
		lbra	error
m_tm		fcc	"?TM ERROR"
		fcb	0
m_os		fcc	"?OS ERROR"
		fcb	0
m_ls		fcc	"?LS ERROR"
		fcb	0
m_id		fcc	"?ID ERROR"
		fcb	0
