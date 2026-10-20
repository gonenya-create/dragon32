; Dragon 1982 BASIC — שלב 3, חלק 2: כלי עריכה. TRON/TROFF, DEL, LINE INPUT, RENUM.
; הכול לפי הקורא: docs/DRAGON-SPEC-EDIT.md. נכתב מאפס.

TRCFLG		equ	$af		; קורא: דגל העקיבה ($4F = פועל)
RNSTEP		equ	$cf		; קורא: RENUM — הצעד
RNOLD		equ	$d1		; הסף (השורה הישנה הראשונה שממוספרת)
RNPTR		equ	$d3		; DEL / RENUM: מצביע לשורה
RNNEW		equ	$d5		; המספר החדש הראשון

; ---------- TRON / TROFF ----------
tron		lda	#$4f
		sta	TRCFLG
		rts
troff		clr	TRCFLG
		rts
; trace: בכניסה לשורה בתוכנית: [n] בלי רווחים (קורא)
trace		tst	TRCFLG
		beq	9F
		pshs	d
		lda	#'[
		lbsr	putc
		ldd	CURLIN
		lbsr	prnum
		lda	#']
		lbsr	putc
		puls	d
9		rts

; ---------- סיום של DEL / RENUM / EDIT: משתנים מתאפסים, מחסנית חדשה, ו-OK ----------
edfin		lbsr	lnkprg
		lbsr	runc
		lds	STKTOP
		clr	,-s
		lbra	main_ok

; ---------- DEL ----------
; DEL n, n-m, -m, n-, -. בלי כלום: ?FC. שורות שלא קיימות: בלי שגיאה (קורא)
del_st		lbeq	err_fc
		ldx	TXTPTR
		lbsr	lrange
		pshs	d
		lbsr	skipsp		; אחרי הטווח: רק סוף פקודה
		beq	1F
		cmpa	#':
		lbne	err_sn
1		puls	d
		lbsr	fndlin		; Y = השורה הראשונה במחיקה
		tfr	y,x
2		ldd	,x		; X = הראשונה שלא נמחקת
		beq	3F
		ldd	2,x
		cmpd	LEND
		bhi	3F
		ldx	,x
		bra	2B
3		cmpx	VARTAB		; מזיזים את [X..VARTAB) ל-Y
		bhs	4F
		lda	,x+
		sta	,y+
		bra	3B
4		sty	VARTAB
		bra	edfin

; ---------- LINE INPUT ["הנחיה";] משתנה$ ----------
; בלי "?" ובלי רווח. במצב ישיר: ?ID. כל השורה נשמרת (פסיקים, מירכאות, רווחים). משתנה מספרי: ?TM אחרי הקלט
line_st		cmpa	#$89		; INPUT
		lbne	err_sn		; LINE של הגרפיקה: בחלק 3
		lbsr	errdir
		lbsr	chrget
		cmpa	#'"
		bne	1F
		ldx	TXTPTR
		leax	1,x
		lbsr	strlit
		ldx	STRNG2
		stx	TXTPTR
		lda	#';
		lbsr	synchk
		lbsr	strprt
1		clr	IKEYIM
		lbsr	getline
		bcc	2F
		leas	2,s		; BREAK: עצירה, ו-CONT חוזר לפקודה (קורא)
		ldx	TXTBEG
		stx	TXTPTR
		orcc	#1
		lbra	stpend
2		clrb
		lbsr	ptrget
		tst	VALTYP
		lbeq	err_tm
		ldd	VARPNT
		std	FORPNT
		clr	CHARAC		; רק 0 מסיים
		clr	ENDCHR
		ldx	#LINBUF
		lbsr	strlt2
		lbra	letasg

; ---------- RENUM [חדש][,[סף][,צעד]] ----------
; ברירות מחדל 10, 0, 10 (קורא). הסדר: ניקוי משתנים, פרמטרים, בדיקות (?FC), הפניות, מספרי השורות, OK.
; הפניות: אחרי GOTO/GO TO, GOSUB/GO SUB, THEN, ELSE, ורשימות עם פסיקים. בכל התוכנית.
; הפניה לשורה שאין: נשארת, ומודפס "UL x IN y" (y = המספר החדש של השורה המפנה)
renum		lbsr	runc
		ldd	#10
		std	RNNEW
		std	RNSTEP
		clra
		clrb
		std	RNOLD
		ldx	TXTPTR
		bsr	isend
		beq	rn_go
		cmpa	#',
		beq	1F
		bsr	rn_num
		std	RNNEW
		bsr	isend
		beq	rn_go
1		cmpa	#',
		lbne	err_sn
		leax	1,x
		bsr	isend
		beq	rn_go
		cmpa	#',
		beq	2F
		bsr	rn_num
		std	RNOLD
		bsr	isend
		beq	rn_go
2		cmpa	#',
		lbne	err_sn
		leax	1,x
		bsr	rn_num
		std	RNSTEP
		bsr	isend
		lbne	err_sn
		bra	rn_go
; isend: Z=1 בסוף פקודה (0 או נקודתיים), A = התו
isend		lbsr	skipsp
		beq	9F
		cmpa	#':
9		rts
; rn_num: מספר שורה (חייבת להיות ספרה, אחרת ?SN)
rn_num		lbsr	skipsp
		cmpa	#'0
		lblo	err_sn
		cmpa	#'9
		lbhi	err_sn
		lbra	linget

rn_go		ldd	RNSTEP
		lbeq	err_fc
		ldd	#$ffff		; השורה הגבוהה שמתחת לסף ($FFFF: אין)
		pshs	d
		ldy	#0		; כמה שורות ממוספרות (Y: ל-LEAU אין דגל Z)
		ldx	TXTTAB
1		ldd	,x
		beq	3F
		ldd	2,x
		cmpd	RNOLD
		bhs	2F
		std	,s
		ldx	,x
		bra	1B
2		leay	1,y
		ldx	,x
		bra	1B
3		puls	d
		cmpd	#$ffff
		beq	4F
		cmpd	RNNEW		; החדש חייב להיות מעל מה שלא זז
		lbhs	err_fc
4		cmpy	#0
		beq	6F
		ldd	RNNEW
5		leay	-1,y
		beq	51F
		addd	RNSTEP
		lbcs	err_fc
		bra	5B
51		cmpd	#63999
		lbhi	err_fc
6		ldx	TXTTAB		; ההפניות. הולכים לפי ה-0 שבסוף כל שורה (הקישורים מתיישנים כשהטקסט זז)
rl_line		ldd	,x
		lbeq	rl_hdr
		stx	RNPTR
		leax	4,x
rl_scan		lda	,x+
		beq	rl_line
		cmpa	#$ff		; פונקציה: הבית הבא הוא חלק ממנה
		bne	1F
		leax	1,x
		bra	rl_scan
1		cmpa	#'"
		bne	2F
11		lda	,x+
		beq	rl_line
		cmpa	#'"
		bne	11B
		bra	rl_scan
2		cmpa	#$bf		; THEN
		beq	rl_ref
		cmpa	#$84		; ELSE
		beq	rl_ref
		cmpa	#$81		; GO, ואחריו TO או SUB (אולי עם רווחים)
		bne	rl_scan
		lbsr	skipsp
		cmpa	#$bc
		beq	3F
		cmpa	#$bd
		bne	rl_scan
3		leax	1,x
rl_ref		lbsr	skipsp
		cmpa	#'0
		blo	rl_scan
		cmpa	#'9
		bhi	rl_scan
		pshs	x		; P = הספרה הראשונה
		clra
		clrb
		pshs	d		; הערך
		tfr	x,y		; Q = אחרי הספרה האחרונה
5		lda	,x
		cmpa	#$20		; רווח בתוך המספר: נעלם (קורא)
		beq	6F
		cmpa	#'0
		blo	7F
		cmpa	#'9
		bhi	7F
		suba	#'0
		pshs	a
		ldd	1,s
		lslb
		rola
		std	1,s
		lslb
		rola
		lslb
		rola
		addd	1,s
		addb	,s+
		adca	#0
		std	,s
		leax	1,x
		tfr	x,y
		bra	5B
6		leax	1,x
		bra	5B
7		tfr	y,x		; X = Q
		puls	d		; הערך הישן
		lbsr	rn_map
		bcs	8F
		bsr	rn_ul
8		lbsr	numtxt		; הספרות ב-LINBUF, B = כמה
		pshs	b
		tfr	x,d
		subd	1,s		; האורך הישן: Q-P
		pshs	d
		clra
		ldb	2,s
		subd	,s++		; ההפרש
		lbsr	rn_shift
		puls	b
		puls	x		; P
		ldu	#LINBUF
9		lda	,u+
		sta	,x+
		decb
		bne	9B
		lbsr	skipsp
		cmpa	#',
		lbne	rl_scan
		leax	1,x
		lbra	rl_ref
; rn_ul: "UL x IN y" (D = x)
rn_ul		pshs	d,x
		leax	m_ul,pcr
		lbsr	puts		; puts משנה את A
		ldd	,s
		lbsr	prnum
		leax	m_in,pcr
		lbsr	puts
		ldx	RNPTR
		ldd	2,x
		bsr	rn_map
		lbsr	prnum
		lda	#13
		lbsr	putc
		puls	d,x,pc
m_ul		fcc	"UL "
		fcb	0
; rn_map: D = מספר ישן → D = החדש, C=1 אם השורה קיימת (אחרת D לא משתנה)
rn_map		pshs	d,x,u
		ldx	TXTTAB
		ldu	RNNEW
1		ldd	,x
		beq	8F
		ldd	2,x
		cmpd	,s
		beq	5F
		cmpd	RNOLD
		blo	2F
		tfr	u,d
		addd	RNSTEP
		tfr	d,u
2		leax	4,x
3		tst	,x+
		bne	3B
		bra	1B
5		cmpd	RNOLD
		blo	6F
		tfr	u,d
6		std	,s
		orcc	#1
		puls	d,x,u,pc
8		andcc	#$fe
		puls	d,x,u,pc
; numtxt: D → ספרות עשרוניות ב-LINBUF (בלי אפסים מובילים). B = כמה
numtxt		pshs	y,u
		ldu	#LINBUF
		leay	pow10,pcr
		pshs	d
1		ldd	,y++
		beq	4F
		pshs	d
		lda	#'0
		pshs	a		; ,s ספרה  1,s החזקה  3,s הערך
2		ldd	3,s
		subd	1,s
		bcs	3F
		std	3,s
		inc	,s
		bra	2B
3		puls	a
		leas	2,s
		cmpa	#'0
		bne	31F
		cmpu	#LINBUF
		beq	1B
31		sta	,u+
		bra	1B
4		leas	2,s
		cmpu	#LINBUF
		bne	5F
		lda	#'0
		sta	,u+
5		tfr	u,d
		subd	#LINBUF
		puls	y,u,pc
; rn_shift: מזיזים את [X..VARTAB) ב-D בתים (עם סימן). למעלה: ?OM אם אין מקום
rn_shift	pshs	d,x
		ldd	,s
		beq	9F
		bmi	5F
		addd	VARTAB
		lbsr	reason
		ldx	VARTAB
		ldd	VARTAB
		addd	,s
		tfr	d,u
		std	VARTAB
1		cmpx	2,s
		bls	9F
		lda	,-x
		sta	,-u
		bra	1B
5		ldx	2,s
		tfr	x,d
		addd	,s
		tfr	d,u
2		cmpx	VARTAB
		bhs	3F
		lda	,x+
		sta	,u+
		bra	2B
3		stu	VARTAB
9		puls	d,x,pc
; rl_hdr: מספרי השורות עצמן
rl_hdr		ldx	TXTTAB
		ldu	RNNEW
1		ldd	,x
		beq	9F
		ldd	2,x
		cmpd	RNOLD
		blo	2F
		stu	2,x
		tfr	u,d
		addd	RNSTEP
		tfr	d,u
2		leax	4,x
3		tst	,x+
		bne	3B
		bra	1B
9		lbra	edfin
