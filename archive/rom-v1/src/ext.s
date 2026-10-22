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
		fcc	"EDIT"
		fcb	0
		fdb	st_edit-extkw
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

; ---------- PRINT USING ----------
; PRINT USING "תבנית"; ביטוי [; ביטוי]...  שדות בתבנית:
;   מספרים: # ספרה, . נקודה, , פסיקים בין אלפים, ** מילוי בכוכביות, $$ דולר צמוד, + בהתחלה או בסוף (סימן),
;   - בסוף (מינוס אחרי המספר). מחרוזות: ! התו הראשון, % % רוחב קבוע. כל השאר נכתב כמו שהוא.
;   התבנית חוזרת מההתחלה אם יש יותר ביטויים משדות. מספר שלא נכנס: % ואז המספר.
PU_P		equ	$03f0		; המקום בתבנית
PU_E		equ	$03f2		; סוף התבנית
PU_W		equ	$03f4		; כמה מקומות לפני הנקודה
PU_D		equ	$03f5		; ספרות אחרי הנקודה ($FF = בלי נקודה)
PU_F		equ	$03f6		; 1 פסיקים, 2 כוכביות, 4 דולר, 8 + בהתחלה, 16 + בסוף, 32 - בסוף
PU_N		equ	$03f7		; כמה ספרות
PU_SG		equ	$03f8		; המספר שלילי
PU_WR		equ	$03f9		; כבר חזרנו להתחלת התבנית
PU_IP		equ	$03fa		; ספרות לפני הנקודה
PU_FAC		equ	$03ea		; עותק של המספר (6 בתים)
PU_S		equ	$03fb		; תחילת התבנית

pr_using	lbsr	rexpr
		lbsr	needstr
		ldb	SLEN
		lbeq	err_fc
		ldu	SPTR
		stu	PU_P
		stu	PU_S
		clra
		leau	d,u
		stu	PU_E
		; תבנית בלי שום שדה: ?FC ERROR (לפני שכותבים משהו)
		ldu	PU_S
2		cmpu	PU_E
		lbeq	err_fc
		lbsr	pu_isfield
		beq	3F
		leau	1,u
		bra	2B
3		lbsr	skipsp
		cmpa	#';
		beq	1F
		cmpa	#',
		lbne	err_sn
1		leax	1,x
pu_item		lbsr	rexpr
		pshs	x
		bsr	pu_lit		; טקסט עד השדה הבא
		ldu	PU_P
		lda	,u
		tst	VALTYP
		bne	pu_str
		cmpa	#'!
		lbeq	err_tm
		cmpa	#'%
		lbeq	err_tm
		lbsr	pu_num
		bra	2F
pu_str		cmpa	#'!
		beq	3F
		cmpa	#'%
		lbne	err_tm
		lbsr	pu_pct
		bra	2F
3		leau	1,u		; ! = התו הראשון
		stu	PU_P
		lda	#$20
		tst	SLEN
		beq	4F
		lda	[SPTR]
4		lbsr	putc
2		puls	x
		lbsr	atend
		beq	pu_nl
		cmpa	#';
		beq	5F
		cmpa	#',
		lbne	err_sn
5		leax	1,x
		lbsr	atend
		bne	pu_item
		bsr	pu_tail		; ; בסוף: בלי שורה חדשה
		rts
pu_nl		bsr	pu_tail
		lda	#13
		lbra	putc

; pu_tail: הטקסט שאחרי השדה האחרון, עד השדה הבא או סוף התבנית
pu_tail		ldu	PU_P
1		cmpu	PU_E
		beq	9F
		bsr	pu_isfield
		beq	9F
		lda	,u+
		lbsr	putc
		bra	1B
9		rts

; pu_lit: כותב טקסט מהתבנית עד תחילת שדה (חוזר להתחלה בסוף התבנית). בלי שום שדה: ?FC ERROR
pu_lit		clr	PU_WR
		ldu	PU_P
1		cmpu	PU_E
		bne	2F
		tst	PU_WR
		lbne	err_fc
		inc	PU_WR
		ldu	PU_S		; חוזרים להתחלת התבנית
		bra	1B
2		bsr	pu_isfield
		beq	9F
		lda	,u+
		lbsr	putc
		bra	1B
9		stu	PU_P
		rts

; pu_isfield: Z=1 אם בכתובת U מתחיל שדה
pu_isfield	pshs	a,b
		lda	,u
		ldb	#0
		pshs	u
		leau	1,u
		cmpu	PU_E
		puls	u
		beq	1F
		ldb	1,u		; התו הבא (0 בסוף התבנית)
1		cmpa	#'#
		beq	8F
		cmpa	#'!
		beq	8F
		cmpa	#'%
		beq	5F
		cmpa	#'.
		bne	2F
		cmpb	#'#
		bra	9F
2		cmpa	#'*
		bne	3F
		cmpb	#'*
		bra	9F
3		cmpa	#'$
		bne	4F
		cmpb	#'$
		bra	9F
4		cmpa	#'+
		bne	9F		; Z=0
		cmpb	#'#
		beq	8F
		cmpb	#'.
		beq	8F
		cmpb	#'$
		beq	8F
		cmpb	#'*
		bra	9F
5		; % ואחריו רק רווחים ו-% סוגר
		pshs	u
6		leau	1,u
		cmpu	PU_E
		beq	10F
		lda	,u
		cmpa	#$20
		beq	6B
		cmpa	#'%
		bra	7F
10		andcc	#$fb		; אין % סוגר
7		puls	u
		bra	9F
8		orcc	#$04
9		puls	a,b,pc

; pu_pct: % % : המחרוזת ברוחב קבוע (חותכים או מוסיפים רווחים)
pu_pct		ldb	#1
1		leau	1,u
		incb
		lda	,u
		cmpa	#'%
		bne	1B
		leau	1,u
		stu	PU_P
		ldu	SPTR
		lda	SLEN
2		tstb
		beq	9F
		pshs	a
		lda	#$20
		tst	,s
		beq	3F
		dec	,s
		lda	,u+
3		lbsr	putc
		puls	a
		decb
		bra	2B
9		rts

; pu_num: המספר שב-FAC, לפי השדה שב-U
pu_num		clr	PU_W
		clr	PU_F
		lda	#$ff
		sta	PU_D
		lda	,u
		cmpa	#'+
		bne	1F
		lda	#8
		sta	PU_F
		inc	PU_W
		leau	1,u
1		ldd	,u
		cmpd	#$2a2a		; **
		bne	2F
		lda	PU_F
		ora	#2
		sta	PU_F
		inc	PU_W
		inc	PU_W
		leau	2,u
		lda	,u
		cmpa	#'$
		bne	3F
		lda	PU_F
		ora	#4
		sta	PU_F
		inc	PU_W
		leau	1,u
		bra	3F
2		cmpd	#$2424		; $$
		bne	3F
		lda	PU_F
		ora	#4
		sta	PU_F
		inc	PU_W
		inc	PU_W
		leau	2,u
3		cmpu	PU_E
		beq	6F
		lda	,u
		cmpa	#'#
		beq	4F
		cmpa	#',
		bne	5F
		lda	PU_F
		ora	#1
		sta	PU_F
4		inc	PU_W
		leau	1,u
		bra	3B
5		cmpa	#'.
		bne	6F
		clr	PU_D
		leau	1,u
7		cmpu	PU_E
		beq	6F
		lda	,u
		cmpa	#'#
		bne	6F
		inc	PU_D
		leau	1,u
		bra	7B
6		lda	PU_F		; + או - בסוף (אם אין + בהתחלה)
		bita	#8
		bne	8F
		cmpu	PU_E
		beq	8F
		lda	,u
		ldb	#16
		cmpa	#'+
		beq	10F
		ldb	#32
		cmpa	#'-
		bne	8F
10		orb	PU_F
		stb	PU_F
		leau	1,u
8		stu	PU_P
		; עותק של המספר (למקרה שלא נכנס), ואז ערך מוחלט כפול 10 בחזקת מספר הספרות אחרי הנקודה, ועיגול
		ldd	FACEXP
		std	PU_FAC
		ldd	FACEXP+2
		std	PU_FAC+2
		ldd	FACEXP+4
		std	PU_FAC+4
		lda	FACSGN
		sta	PU_SG
		clr	FACSGN
		ldb	PU_D
		cmpb	#$ff
		beq	2F
1		tstb
		beq	2F
		pshs	b
		lbsr	fmul10
		puls	b
		decb
		bra	1B
2		leau	c_half,pcr
		lbsr	ldarg
		lbsr	fadd
		lda	FACEXP
		cmpa	#$a0
		lbhi	pu_over
		lbsr	qint
		; הספרות, מהסוף להתחלה, ב-FBUF
		ldx	#FBUF+24
		clr	PU_N
3		lbsr	div10q
		adda	#'0
		sta	,-x
		inc	PU_N
		ldd	QN
		bne	3B
		ldd	QN+2
		bne	3B
		; לפחות ספרה אחת לכל מקום אחרי הנקודה
		ldb	PU_D
		cmpb	#$ff
		bne	4F
		clrb
4		pshs	b
5		lda	PU_N
		cmpa	,s
		bhs	6F
		lda	#'0
		sta	,-x
		inc	PU_N
		bra	5B
6		lda	PU_N
		suba	,s+
		bne	7F
		tst	PU_W		; אין ספרות שלמות: 0 לפני הנקודה, אם יש מקום
		beq	7F
		lda	#'0
		sta	,-x
		inc	PU_N
		lda	#1
7		sta	PU_IP
		; האורך: ספרות + פסיקים + דולר + סימן
		ldb	PU_IP
		lda	PU_F
		bita	#1
		beq	11F
		lda	PU_IP
12		suba	#3		; פסיק אחרי כל 3 ספרות (חוץ מהראשונות)
		bls	11F
		incb
		bra	12B
11		lda	PU_F
		bita	#4
		beq	13F
		incb
13		lbsr	pu_signin
		beq	14F
		incb
14		; ריפוד: W - האורך. שלילי: % ובלי ריפוד
		pshs	b
		lda	PU_W
		suba	,s+
		bge	15F
		lda	#'%
		lbsr	putc
		clra
15		ldb	#$20
		pshs	a
		lda	PU_F
		bita	#2
		puls	a
		beq	16F
		ldb	#'*
16		tsta
		beq	17F
		exg	a,b
		lbsr	putc
		exg	a,b
		deca
		bra	16B
17		bsr	pu_signin
		beq	18F
		lbsr	putc
18		lda	PU_F
		bita	#4
		beq	19F
		lda	#'$
		lbsr	putc
19		ldb	PU_IP		; הספרות השלמות, עם פסיקים
20		tstb
		beq	22F
		lda	,x+
		lbsr	putc
		decb
		beq	22F
		lda	PU_F
		bita	#1
		beq	20B
		tfr	b,a
21		suba	#3
		bhi	21B
		bne	20B
		lda	#',
		lbsr	putc
		bra	20B
22		ldb	PU_D		; הנקודה והספרות שאחריה
		cmpb	#$ff
		beq	24F
		lda	#'.
		lbsr	putc
23		tstb
		beq	24F
		lda	,x+
		lbsr	putc
		decb
		bra	23B
24		lda	PU_F		; סימן בסוף
		bita	#16
		beq	25F
		lda	#'+
		tst	PU_SG
		bpl	26F
		lda	#'-
		bra	26F
25		bita	#32
		beq	27F
		lda	#$20
		tst	PU_SG
		bpl	26F
		lda	#'-
26		lbsr	putc
27		rts

; pu_signin: Z=0 ו-A = הסימן אם כותבים סימן לפני המספר (+ בהתחלה, או מינוס בלי סימן בסוף)
pu_signin	lda	PU_F
		bita	#8
		bne	2F
		bita	#48
		bne	1F
		tst	PU_SG
		bpl	1F
		lda	#'-
		andcc	#$fb
		rts
1		orcc	#$04
		rts
2		lda	#'+
		tst	PU_SG
		bpl	3F
		lda	#'-
3		andcc	#$fb
		rts

; pu_over: מספר גדול מדי לשדה: % ואז המספר כרגיל
pu_over		ldd	PU_FAC
		std	FACEXP
		ldd	PU_FAC+2
		std	FACEXP+2
		ldd	PU_FAC+4
		std	FACEXP+4
		lda	#'%
		lbsr	putc
		lbsr	fout
		lda	,u
		cmpa	#$20
		bne	1F
		leau	1,u		; בלי הרווח של מספר חיובי
1		lda	,u+
		beq	2F
		lbsr	putc
		bra	1B
2		rts

; div10q: QN (32 ביט) = QN / 10, ו-A = השארית
div10q		clra
		ldb	#32
1		lsl	QN+3
		rol	QN+2
		rol	QN+1
		rol	QN
		rola
		cmpa	#10
		blo	2F
		suba	#10
		inc	QN+3
2		decb
		bne	1B
		rts

; ---------- EDIT ----------
; EDIT מספר: עורכים שורה במקום, כמו ב-1982. מספר לפני פקודה = כמה פעמים.
;   רווח: תו קדימה   ←: תו אחורה   D: מחיקה   C: החלפה   I: הוספה (SHIFT+↑ יוצא)   X: הוספה בסוף
;   H: מחיקת הסוף והוספה   S תו: חיפוש   K תו: מחיקה עד התו   L: הצגת השורה   A: מההתחלה
;   ENTER: שמירה   E: שמירה בלי להציג את הסוף   BREAK: ביטול
ED_REC		equ	$03f0		; הרשומה של השורה
ED_L		equ	$03f2		; אורך הטקסט
ED_P		equ	$03f3		; המקום בטקסט
ED_N		equ	$03f4		; כמה פעמים
ED_INS		equ	$03f5		; במצב הוספה
EBUF		equ	LINBUF+8	; הטקסט (לפניו מקום למספר השורה)
EDMAX		equ	LINMAX-8

st_edit		lbsr	skipsp
		cmpa	#'0
		lblo	err_fc
		cmpa	#'9
		lbhi	err_fc
		lbsr	linenum
		lbsr	findline
		lbne	err_ul
		sty	ED_REC
ed_start	; מעתיקים את השורה מהתוכנית ומציגים את המספר שלה
		ldy	ED_REC
		leax	4,y
		ldu	#EBUF
		clrb
1		lda	,x+
		sta	,u+
		beq	2F
		incb
		bra	1B
2		stb	ED_L
ed_restart	clr	ED_P
		lda	#13
		lbsr	ed_nl
		ldy	ED_REC
		ldd	2,y
		lbsr	givd_u
		lbsr	fout
		leau	1,u
3		lda	,u+
		beq	ed_cmd
		lbsr	putc
		bra	3B
ed_cmd		lda	#$20
		lbsr	putc
ed_next		clr	ED_N
ed_key		lbsr	ed_get
		cmpa	#'0		; מספר חזרות
		blo	1F
		cmpa	#'9
		bhi	1F
		suba	#'0
		pshs	a
		lda	ED_N
		ldb	#10
		mul
		addb	,s+
		stb	ED_N
		bra	ed_key
1		tst	ED_N
		bne	2F
		inc	ED_N
2		cmpa	#$20
		beq	ed_space
		cmpa	#8
		beq	ed_left
		cmpa	#13
		lbeq	ed_enter
		cmpa	#3
		lbeq	ed_break
		cmpa	#'D
		beq	ed_del
		cmpa	#'C
		lbeq	ed_chg
		cmpa	#'I
		lbeq	ed_ins
		cmpa	#'X
		lbeq	ed_ext
		cmpa	#'H
		lbeq	ed_hack
		cmpa	#'S
		lbeq	ed_srch
		cmpa	#'K
		lbeq	ed_kill
		cmpa	#'L
		lbeq	ed_list
		cmpa	#'A
		lbeq	ed_start
		cmpa	#'E
		lbeq	ed_save
		bra	ed_next		; מקש אחר: מתעלמים

; רווח: מציגים את התו הבא וממשיכים
ed_space	bsr	ed_fwd
		dec	ED_N
		bne	ed_space
		bra	ed_next
; ed_fwd: אם לא בסוף, מציג את התו ב-P ומתקדם
ed_fwd		ldb	ED_P
		cmpb	ED_L
		bhs	1F
		ldx	#EBUF
		lda	b,x
		lbsr	putc
		inc	ED_P
1		rts
; ←: תו אחורה
ed_left		lbsr	ed_back
		dec	ED_N
		bne	ed_left
		lbra	ed_next
; D: מוחקים תווים ב-P, ומציגים אותם בין \ ל-\
ed_del		lda	#'\
		lbsr	putc
1		ldb	ED_P
		cmpb	ED_L
		bhs	2F
		ldx	#EBUF
		lda	b,x
		lbsr	putc
		lbsr	ed_cut
		dec	ED_N
		bne	1B
2		lda	#'\
		lbsr	putc
		lbra	ed_next
; C: מחליפים את התווים הבאים במה שמקלידים
ed_chg		ldb	ED_P
		cmpb	ED_L
		bhs	2F
		lbsr	ed_get
		cmpa	#$20
		blo	2F
		ldb	ED_P
		ldx	#EBUF
		sta	b,x
		lbsr	putc
		inc	ED_P
		dec	ED_N
		bne	ed_chg
2		lbra	ed_next
; X: מציגים עד הסוף, ואז הוספה. H: מוחקים את הסוף, ואז הוספה
ed_ext		lbsr	ed_rest
		bra	ed_ins
ed_hack		lda	ED_P
		sta	ED_L
; I: הוספה. כל תו נכנס ב-P. ← מוחק את התו שלפני. SHIFT+↑ יוצא, ENTER שומר
ed_ins		lbsr	ed_get
		cmpa	#$5f
		lbeq	ed_next
		cmpa	#13
		beq	ed_enter
		cmpa	#3
		beq	ed_break
		cmpa	#8
		bne	1F
		tst	ED_P
		beq	ed_ins
		lbsr	ed_back
		lbsr	ed_cut
		bra	ed_ins
1		cmpa	#$20
		blo	ed_ins
		ldb	ED_L
		cmpb	#EDMAX
		bhs	ed_ins
		; מזיזים את [P..L) תו אחד ימינה
		pshs	a
		ldx	#EBUF
		ldb	ED_L
		abx
2		cmpb	ED_P
		beq	3F
		lda	-1,x
		sta	,x
		leax	-1,x
		decb
		bra	2B
3		puls	a
		sta	,x
		lbsr	putc
		inc	ED_P
		inc	ED_L
		bra	ed_ins
; ENTER: מציגים את הסוף ושומרים. E: שומרים מיד. BREAK: יוצאים בלי לשמור
ed_enter	lbsr	ed_rest
ed_save		lda	#13
		lbsr	putc
		; "מספר טקסט" ב-LINBUF, ואז כמו שורה שהוקלדה
		ldb	ED_L
		ldx	#EBUF
		clr	b,x
		ldy	ED_REC
		ldd	2,y
		lbsr	givd_u
		lbsr	fout		; U = " 10"
		leau	1,u
		ldx	#EBUF-1
		lda	#$20
		sta	,x
1		tst	,u+		; לסוף המספר
		bne	1B
		leau	-1,u
2		cmpu	#FBUF+1
		bls	3F
		lda	,-u
		sta	,-x
		bra	2B
3		lbsr	storeline
		bra	ed_out
ed_break	lda	#13
		lbsr	putc
ed_out		leax	ed_zero,pcr	; אין עוד פקודות בשורה
		ldd	#0
		std	CURLN
		rts
ed_zero		fcb	0
; L: מציגים את כל השורה (עם השינויים) ומתחילים מחדש מתחילתה
ed_list		lbsr	ed_rest
		lbra	ed_restart
; S תו: מתקדמים עד התו (פעם N). K תו: מוחקים עד התו
ed_srch		lbsr	ed_get
		pshs	a
1		lbsr	ed_fwd		; לפחות תו אחד
2		ldb	ED_P
		cmpb	ED_L
		bhs	3F
		ldx	#EBUF
		lda	b,x
		cmpa	,s
		beq	4F
		lbsr	ed_fwd
		bra	2B
4		dec	ED_N
		bne	1B
3		leas	1,s
		lbra	ed_next
ed_kill		lbsr	ed_get
		pshs	a
		lda	#'\
		lbsr	putc
1		ldb	ED_P
		cmpb	ED_L
		bhs	3F
		ldx	#EBUF
		lda	b,x
		lbsr	putc
		lbsr	ed_cut
		ldb	ED_P
		cmpb	ED_L
		bhs	3F
		lda	b,x
		cmpa	,s
		bne	1B
		dec	ED_N
		bne	1B
3		leas	1,s
		lda	#'\
		lbsr	putc
		lbra	ed_next

; ed_rest: מציגים את מה שנשאר עד הסוף
ed_rest		ldb	ED_P
		cmpb	ED_L
		bhs	1F
		lbsr	ed_fwd
		bra	ed_rest
1		rts
; ed_cut: מוחקים את התו ב-P
ed_cut		pshs	b,x
		ldx	#EBUF
		ldb	ED_P
		abx
1		lda	1,x
		sta	,x+
		incb
		cmpb	ED_L
		blo	1B
		dec	ED_L
		puls	b,x,pc
; ed_back: P אחורה, וגם הסמן במסך
ed_back		tst	ED_P
		beq	1F
		dec	ED_P
		pshs	x
		ldx	CURSOR
		leax	-1,x
		lda	#$60
		sta	,x
		stx	CURSOR
		puls	x
1		rts
; ed_get: מחכים למקש, עם סמן
ed_get		lbsr	cursor_on
		lbsr	getkey
		lbra	cursor_off
; ed_nl: שורה חדשה רק אם הסמן לא בתחילת שורה
ed_nl		pshs	a
		lda	CURSOR+1
		anda	#$1f
		puls	a
		beq	1F
		lbra	putc
1		rts
