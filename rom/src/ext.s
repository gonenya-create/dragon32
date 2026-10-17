; Dragon 1982 BASIC: חלק ההרחבה, בשבב השני במקום המחסנית ($C000), כמו מחסניות ההרחבה של Dragon ב-1982.
; ה-BASIC הראשי פונה לכאן כשמילה לא נמצאה אצלו. נכתב מאפס.

ext_sig		fcc	"DX"		; ה-BASIC בודק את החתימה לפני שקורא לכאן
ext_dispatch	; פקודות ההרחבה: Z=1 אם הפקודה טופלה
		leau	extkw,pcr
1		tst	,u
		beq	9F		; לא כאן
		pshs	u
		lbsr	match
		puls	u
		beq	3F
2		tst	,u+
		bne	2B
		leau	2,u
		bra	1B
3		tst	,u+
		bne	3B
		ldd	,u
		leau	extkw,pcr
		jsr	d,u
		orcc	#$04
		rts
9		andcc	#$fb
		rts

; טבלת המילים של ההרחבה: שם, 0, כתובת (יחסית ל-extkw)
extkw		fcc	"RENUM"
		fcb	0
		fdb	st_renum-extkw
		fcb	0

; זיכרון של ההרחבה
RN_NEW		equ	$03f0		; המספר החדש הראשון
RN_OLD		equ	$03f2		; מאיזו שורה מתחילים
RN_INC		equ	$03f4		; הקפיצה
RN_FIRST	equ	$03f6		; הרשומה הראשונה שמשתנה
RN_CUR		equ	$03f8		; המספר החדש הבא
RN_SRC		equ	$03fa		; הרשומה שמעתיקים
RN_T		equ	$03fc
RN_PL		equ	$03fe		; התו הקודם היה אות

; RENUM [חדש][,[ישן][,קפיצה]]: מספור מחדש מהשורה "ישן" והלאה (ברירת מחדל: 10, מההתחלה, 10),
; ומתקן את ההפניות: GOTO, GOSUB, THEN, ELSE, RUN, RESTORE (גם רשימות של ON)
st_renum	ldd	#10
		std	RN_NEW
		std	RN_INC
		clra
		clrb
		std	RN_OLD
		lbsr	atend
		beq	1F
		cmpa	#',
		beq	2F
		lbsr	linenum
		std	RN_NEW
2		lbsr	skipsp
		cmpa	#',
		bne	1F
		leax	1,x
		lbsr	skipsp
		cmpa	#',
		beq	3F
		lbsr	linenum
		std	RN_OLD
3		lbsr	skipsp
		cmpa	#',
		bne	1F
		leax	1,x
		lbsr	skipsp
		lbsr	linenum
		std	RN_INC
		lbeq	err_fc
1		pshs	x
		ldd	RN_OLD
		lbsr	findline
		sty	RN_FIRST
		; השורה שלפני הטווח חייבת להיות קטנה מהמספר החדש הראשון
		ldx	#PROGST
4		cmpx	RN_FIRST
		beq	5F
		ldd	2,x
		ldx	,x
		cmpx	RN_FIRST
		bne	4B
		cmpd	RN_NEW
		lbhs	err_fc
		; המספרים החדשים לא עוברים את 63999
5		ldd	RN_NEW
		ldy	RN_FIRST
6		ldx	,y
		beq	7F
		cmpd	#63999
		lbhi	err_fc
		tfr	x,y
		addd	RN_INC
		bcc	6B
		ldd	#$ffff
		bra	6B
		; בונים עותק חדש של התוכנית אחרי הסוף שלה (המשתנים נמחקים, כמו במקור), ואז מעתיקים אותו למקום
7		lbsr	clrvars
		ldd	RN_NEW
		std	RN_CUR
		ldx	#PROGST
		stx	RN_SRC
		ldy	PROGEND
8		ldx	RN_SRC
		ldd	,x
		beq	9F
		ldd	2,x
		cmpx	RN_FIRST
		blo	10F
		ldd	RN_CUR
		pshs	d
		addd	RN_INC
		std	RN_CUR
		puls	d
10		std	2,y
		leay	4,y
		leax	4,x
		bsr	rn_text
		cmpy	#FORBASE-$400
		lbhs	err_om
		ldx	[RN_SRC]
		stx	RN_SRC
		bra	8B
9		ldx	PROGEND
		ldu	#PROGST
		sty	RN_T
13		cmpx	RN_T
		bhs	14F
		lda	,x+
		sta	,u+
		bra	13B
14		clra
		clrb
		std	,u++		; הקישור 0000 שבסוף
		stu	PROGEND
		lbsr	relink
		lbsr	clrvars
		puls	x
		ldd	#0
		std	CURLN
		lbra	st_rem

; rn_text: מעתיק טקסט של שורה מ-X אל Y (עד 0 כולל), ומחליף מספרי שורות אחרי המילים של rnkw
rn_text		clr	RN_PL
1		lda	,x
		beq	9F
		cmpa	#'"
		beq	rn_str
		cmpa	#''
		beq	rn_rest
		tst	RN_PL
		bne	5F		; באמצע מילה
		stx	RN_T
		leau	rn_rem,pcr
		lbsr	match
		beq	rn_rest0	; REM: השאר כמו שהוא
		leau	rnkw,pcr
2		tst	,u
		beq	5F
		pshs	u
		lbsr	match
		puls	u
		beq	4F
3		tst	,u+
		bne	3B
		bra	2B
4		pshs	x		; מעתיקים את המילה, ואז את המספרים שאחריה
		ldx	RN_T
6		cmpx	,s
		beq	7F
		lda	,x+
		sta	,y+
		bra	6B
7		puls	x
		bsr	rn_nums
		bra	1B
5		lda	,x+
		sta	,y+
		clr	RN_PL
		cmpa	#'A
		blo	1B
		cmpa	#'Z
		bhi	1B
		inc	RN_PL
		bra	1B
rn_rest0	ldx	RN_T
rn_rest		lda	,x+
		sta	,y+
		bne	rn_rest
		rts
rn_str		sta	,y+
		leax	1,x
8		lda	,x
		beq	9F
		sta	,y+
		leax	1,x
		cmpa	#'"
		bne	8B
		bra	1B
9		clr	,y+
		rts

; rn_nums: אחרי מילה: רווחים, מספר שורה, ועוד ", מספר" (ON ... GOTO 10,20)
rn_nums		lda	,x
		cmpa	#$20
		bne	1F
		sta	,y+
		leax	1,x
		bra	rn_nums
1		cmpa	#'0
		blo	9F
		cmpa	#'9
		bhi	9F
		lbsr	linenum
		bsr	rn_map
		pshs	x		; כותבים את המספר החדש
		sty	RN_T
		lbsr	givd_u
		lbsr	fout		; U = " 123"
		ldy	RN_T
		leau	1,u
2		lda	,u+
		beq	3F
		sta	,y+
		bra	2B
3		puls	x
4		lda	,x
		cmpa	#$20
		bne	5F
		sta	,y+
		leax	1,x
		bra	4B
5		cmpa	#',
		bne	9F
		sta	,y+
		leax	1,x
		bra	rn_nums
9		clr	RN_PL
		rts

; rn_map: D = מספר ישן. אם השורה בטווח, D = המספר החדש שלה
rn_map		pshs	d,x,y
		ldy	RN_FIRST
		ldx	RN_NEW
1		ldd	,y
		beq	9F
		ldd	2,y
		cmpd	,s
		beq	7F
		bhi	9F
		tfr	x,d
		addd	RN_INC
		tfr	d,x
		ldy	,y
		bra	1B
7		stx	,s
9		puls	d,x,y,pc

rn_rem		fcc	"REM"
		fcb	0
rnkw		fcc	"GOTO"
		fcb	0
		fcc	"GOSUB"
		fcb	0
		fcc	"THEN"
		fcb	0
		fcc	"ELSE"
		fcb	0
		fcc	"RUN"
		fcb	0
		fcc	"RESTORE"
		fcb	0
		fcb	0
