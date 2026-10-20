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

; ---------- EDIT n (קורא: docs/DRAGON-SPEC-EDIT.md, סעיף 1) ----------
EDLEN		equ	$d7		; קורא: האורך
EDFLG		equ	$d8		; 1: הפלט של LIST הולך למאגר
EDPTR		equ	$d9		; 2 בתים: לאן כותבים במאגר
EDPOS		equ	$db		; המקום בשורה
EDCNT		equ	$dc		; המונה שלפני פקודה
EDNUM		equ	$dd		; 2 בתים: מספר השורה

; lout: התו של LIST למסך, או למאגר (עד 249 תווים)
lout		tst	EDFLG
		lbeq	putc
		pshs	b,x
		ldb	EDLEN
		cmpb	#249
		bhs	1F
		ldx	EDPTR
		sta	,x+
		stx	EDPTR
		inc	EDLEN
1		puls	b,x,pc

; בלי מספר: שורה 0. אחרי המספר רק סוף פקודה (?SN). אין שורה: ?UL. גם בתוך תוכנית (יוצאים ממנה)
edit_st		ldx	TXTPTR
		lbsr	linget
		std	EDNUM
		lbsr	isend
		lbne	err_sn
ed_load		ldd	EDNUM
		lbsr	fndlin
		lbcc	err_ul
		ldx	#LINBUF		; פותחים את השורה לטקסט, במאגר
		stx	EDPTR
		clr	EDLEN
		inc	EDFLG
		leax	4,y
		lbsr	prline
		clr	EDFLG
		lbsr	ed_num		; "n " והשורה כולה, ושורה חדשה
		clr	EDPOS
		lbsr	ed_rest
		lda	#13
		lbsr	putc
ed_head		lbsr	ed_num		; שוב "n ", והעריכה מתחילה בתו הראשון
		clr	EDPOS
ed_cmd		clr	EDCNT
ed_key		lbsr	ed_get
		cmpa	#'0		; ספרות: המונה (מודולו 256, בלי הד)
		blo	1F
		cmpa	#'9
		bhi	1F
		suba	#'0
		pshs	a
		lda	EDCNT
		ldb	#10
		mul
		addb	,s+
		stb	EDCNT
		bra	ed_key
1		leax	ed_tab,pcr	; הפקודה
2		ldb	,x
		beq	ed_cmd		; לא מוכרת: כלום
		cmpa	,x
		beq	3F
		leax	3,x
		bra	2B
3		ldd	1,x
		leax	ed_tab,pcr
		jsr	d,x
		bra	ed_cmd
ed_tab		fcb	$20
		fdb	ed_sp-ed_tab
		fcb	'D
		fdb	ed_d-ed_tab
		fcb	'I
		fdb	ed_ins-ed_tab
		fcb	'X
		fdb	ed_x-ed_tab
		fcb	'H
		fdb	ed_h-ed_tab
		fcb	'L
		fdb	ed_l-ed_tab
		fcb	'A
		fdb	ed_a-ed_tab
		fcb	'E
		fdb	ed_e-ed_tab
		fcb	13
		fdb	ed_ent-ed_tab
		fcb	'S
		fdb	ed_s-ed_tab
		fcb	'K
		fdb	ed_k-ed_tab
		fcb	'C
		fdb	ed_c-ed_tab
		fcb	8
		fdb	ed_bs-ed_tab
		fcb	'Q
		fdb	ed_q-ed_tab
		fcb	0

ed_num		ldd	EDNUM
		lbsr	prnum
		lda	#$20
		lbra	putc
; ed_get: מקש לעורך. BREAK לא נחשב; SHIFT+↑ ($5F) = בריחה ($1B). רק $20-$7E, ENTER, בריחה, ←
ed_get		lbsr	getkey
		cmpa	#$5f
		bne	1F
		lda	#$1b
		rts
1		cmpa	#13
		beq	9F
		cmpa	#8
		beq	9F
		cmpa	#$20
		blo	ed_get
		cmpa	#$7e
		bhi	ed_get
9		rts
; ed_n: B = המונה, 0 = 1
ed_n		ldb	EDCNT
		bne	1F
		incb
1		rts
; ed_adv: מדפיסים את התו שבמקום ומתקדמים. C=1 אם כבר בסוף
ed_adv		ldb	EDPOS
		cmpb	EDLEN
		bhs	8F
		ldx	#LINBUF
		lda	b,x
		lbsr	putc
		inc	EDPOS
		andcc	#$fe
		rts
8		orcc	#1
		rts
ed_rest		lbsr	ed_adv
		bcc	ed_rest
		rts
; ed_del: מוחקים את התו שבמקום (בלי הדפסה). C=1 אם בסוף
ed_del		ldb	EDPOS
		cmpb	EDLEN
		bhs	8B
		ldx	#LINBUF
		abx
1		lda	1,x
		sta	,x+
		incb
		cmpb	EDLEN
		blo	1B
		dec	EDLEN
		andcc	#$fe
		rts
; ed_char: B = התו שבמקום (C=1 אם בסוף)
ed_char		pshs	x
		ldb	EDPOS
		cmpb	EDLEN
		bhs	1F
		ldx	#LINBUF
		ldb	b,x
		andcc	#$fe
		puls	x,pc
1		orcc	#1
		puls	x,pc

ed_sp		lbsr	ed_n		; רווח: n תווים קדימה, מודפסים
1		pshs	b
		lbsr	ed_adv
		puls	b
		decb
		bne	1B
		rts
ed_d		lbsr	ed_n		; D: מוחקים n תווים
1		pshs	b
		lbsr	ed_del
		puls	b
		decb
		bne	1B
		rts
ed_x		lbsr	ed_rest		; X: לסוף, והוספה
		bra	ed_ins
ed_h		lda	EDPOS		; H: מוחקים עד הסוף, והוספה
		sta	EDLEN
; ed_ins: הוספה. ENTER: היתר, שורה חדשה, שמירה. בריחה: חזרה לפקודות. ←: מוחקים את התו שלפני
ed_ins		lbsr	ed_get
		cmpa	#13
		beq	ed_ent
		cmpa	#$1b
		beq	9F
		cmpa	#8
		bne	2F
		lda	EDPOS
		beq	ed_ins
		dec	EDPOS
		lbsr	ed_del
		lda	#8
		lbsr	putc
		bra	ed_ins
2		ldb	EDLEN		; עד 250 תווים (קורא)
		cmpb	#250
		bhs	ed_ins
		ldx	#LINBUF		; מזיזים ימינה, מהסוף עד המקום
		abx
		pshs	a
3		cmpb	EDPOS
		bls	31F
		lda	-1,x
		sta	,x
		leax	-1,x
		decb
		bra	3B
31		puls	a
4		sta	,x
		inc	EDLEN
		inc	EDPOS
		lbsr	putc
		bra	ed_ins
9		rts
ed_l		lbsr	ed_rest		; L: היתר, שורה חדשה, "n " ומההתחלה (השינויים נשמרים)
		lda	#13
		lbsr	putc
		leas	2,s
		lbra	ed_head
ed_a		lda	#13		; A: מבטלים את השינויים וטוענים מחדש
		lbsr	putc
		leas	2,s
		lbra	ed_load
ed_ent		lbsr	ed_rest		; ENTER: היתר, שורה חדשה, שמירה
ed_e		lda	#13		; E: שמירה בלי להדפיס את היתר
		lbsr	putc
		ldb	EDLEN		; שומרים כמו שורה שהוקלדה: מכווצים, מחליפים, משתנים מתאפסים
		ldx	#LINBUF
		clr	b,x
		ldd	EDNUM
		std	LINNUM
		lbsr	storel2
		lds	STKTOP
		clr	,-s
		lbra	main		; בלי OK (קורא)
ed_q		lds	STKTOP		; Q: יציאה בלי שמירה
		clr	,-s
		lbra	main_ok
ed_s		lbsr	ed_get		; S c: עד לפני המופע ה-n של c אחרי המקום
		pshs	a
		lbsr	ed_n
1		pshs	b
		lbsr	ed_adv
		bcs	3F
2		lbsr	ed_char
		bcs	3F
		cmpb	1,s
		beq	3F
		lbsr	ed_adv
		bra	2B
3		puls	b
		decb
		bne	1B
		puls	a,pc
ed_k		lbsr	ed_get		; K c: מוחקים עד לפני המופע ה-n של c (אין: עד הסוף)
		pshs	a
		lbsr	ed_n
1		pshs	b
		lbsr	ed_del
		bcs	3F
2		lbsr	ed_char
		bcs	3F
		cmpb	1,s
		beq	3F
		lbsr	ed_del
		bra	2B
3		puls	b
		decb
		bne	1B
		puls	a,pc
ed_c		lbsr	ed_n		; C: n תווים חדשים במקום הקיימים; לא מאריך
1		pshs	b
		lbsr	ed_char
		bcs	3F
2		lbsr	ed_get
		cmpa	#$20		; ENTER, בריחה ו-← לא נחשבים כאן
		blo	2B
		ldb	EDPOS
		ldx	#LINBUF
		sta	b,x
		lbsr	ed_adv
		puls	b
		decb
		bne	1B
		rts
3		puls	b,pc
ed_bs		lbsr	ed_n		; ←: n תווים אחורה, בלי למחוק מהמאגר (במסך התא נמחק)
1		lda	EDPOS
		beq	9F
		dec	EDPOS
		lda	#8
		lbsr	putc
		decb
		bne	1B
9		rts
