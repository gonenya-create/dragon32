; Dragon 1982 BASIC — שלב 3, חלק 3: DRAW, GET, PUT.
; הכול לפי הקורא: docs/DRAGON-SPEC-GRAPHICS.md, סעיפים 11-12 (עובדות בלבד, בלי קוד). נכתב מאפס.

DN		equ	$d5		; DRAW: N (בלי עדכון הנקודה האחרונה)
DB		equ	$d6		; DRAW: B (תנועה בלי ציור)
DSIGN		equ	$d7		; DRAW M: הסימן שנקרא (0, + או -)
DLEN		equ	$d8		; DRAW: כמה תווים נשארו במחרוזת
DPTR		equ	$d9		; DRAW: התו הבא
GPPTR		equ	$cf		; GET/PUT: הבית שלפני הנתון הבא במערך
GPEND		equ	$d1		; GET/PUT: הכתובת שאחרי המערך
GPBIT		equ	$d4		; GET/PUT: 0 = בתים, $FF = ביטים
GPACT		equ	$d5		; PUT: הפעולה (ביטים 0-1 לביט מערך 0, ביטים 2-3 לביט 1; בכל זוג: 2 = מחיקה, 1 = היפוך)
GPFLG		equ	$d8		; 0 = GET, 1 = PUT
GPRADR		equ	$cb		; תחילת השורה במסך
GPRMSK		equ	$cd		; המסכה של תחילת השורה

; ---------- DRAW מחרוזת (קורא 11) ----------
; dxstr: "X שם;" של DRAW ושל PLAY. חייבת להיות מחרוזת (?TM), ואז בדיקת מקום (?OM): B = הבתים
; פחות 2, כי כאן המחסנית עמוקה ב-2. מחרוזת ריקה: חוזרים. אחרת המחרוזת הנוכחית נדחפת למחסנית של
; הקורא ([אורך][כתובת]), ועוברים לחדשה. Y משתנה
dxstr		pshs	b
		bsr	dvar
		tst	VALTYP
		lbeq	err_tm
		puls	b
		lbsr	getstk
		ldx	VARPNT
		lda	,x
		beq	9F		; ריקה או לא קיימת
		puls	y		; כתובת החזרה
		ldu	DPTR
		ldb	DLEN
		pshs	b,u
		sta	DLEN
		ldx	2,x
		stx	DPTR
		jmp	,y
dfc		lbra	err_fc

; dget: התו הבא בלי רווחים → A. בסוף המחרוזת: C=1. X משתנה
dget		tst	DLEN
		beq	8F
		dec	DLEN
		ldx	DPTR
		lda	,x+
		stx	DPTR
		cmpa	#$20
		beq	dget
		andcc	#$fe
9		rts
8		coma			; C=1 (אף קורא לא משתמש ב-A בסוף המחרוזת)
		rts
; dgetf: כמו dget, אבל בסוף המחרוזת: ?FC
dgetf		bsr	dget
		bcs	dfc
9		rts
; dback: מחזירים את התו האחרון
dback		inc	DLEN
		ldx	DPTR
		leax	-1,x
		stx	DPTR
		rts

; dvar: "שם;" → VARPNT ו-VALTYP, דרך ptrget הרגיל. האות הראשונה A-Z, וחייב ';' (אחרת ?FC).
; TXTPTR מצביע בינתיים על השם, ואחר כך חוזר
dvar		bsr	dgetf
		suba	#'A		; A-Z (A לא נחוץ אחר כך)
		cmpa	#'Z-'A
		bhi	dfc
		ldu	TXTPTR
		pshs	u
		ldx	DPTR
		leax	-1,x
		stx	TXTPTR
1		bsr	dgetf
		cmpa	#';
		bne	1B
		ldb	#1		; כמו בביטוי: משתנה שלא קיים לא נוצר (0 או מחרוזת ריקה; קורא: צליל 9.3)
		lbsr	ptrget
		puls	x
		stx	TXTPTR
		rts

; darg: המספר אחרי אות → B. בסוף המחרוזת, או כשבא אחריה אות גדולה: 1
darg		bsr	dget
		bcs	1F
		bsr	dback
		suba	#'A		; לא אות גדולה: dval קורא מחדש
		cmpa	#'Z-'A
		bhi	dval
1		ldb	#1
		rts
; dval: ערך 0-255 → B: "=שם;" או ספרות (הראשונה חייבת להיות ספרה). מעל 255: ?FC
dval		bsr	dgetf
		cmpa	#'=
		bne	1F
		bsr	dvar
		ldx	VARPNT
		lbsr	movfm
		lbra	conint		; מחרוזת: ?TM, מחוץ ל-0-255: ?FC
1		clrb
		suba	#'0
		cmpa	#9
		bhi	dfc
2		pshs	a		; B = B*10 + הספרה
		lda	#10
		mul
		tsta
		bne	dfc
		addb	,s+
		bcs	dfc
		pshs	b
		bsr	dget
		puls	b		; puls לא נוגע בדגלים
		bcs	9B		; סוף המחרוזת: המספר נגמר
		suba	#'0
		cmpa	#9
		bls	2B
		bra	dback		; לא ספרה: חוזר למחרוזת

; dmval: [+|-]ערך → D עם סימן. DSIGN = התו של הסימן (0 אם אין)
dmval		bsr	dgetf
		cmpa	#'+
		beq	1F
		cmpa	#'-
		beq	1F
		bsr	dback
		clra
1		pshs	a
		bsr	dval
		puls	a
		sta	DSIGN
		suba	#'-
		lbeq	dneg		; A = 0
		clra
		rts

; המחרוזות המקוננות (X) נשמרות במחסנית: [אורך][כתובת]. הסמן בתחתית: כתובת 0
draw_st		lbsr	frmevl
		lbsr	frestr		; לא מחרוזת: ?TM
		sta	DLEN
		stx	DPTR
		clra
		clrb
		std	DN		; N ו-B כבויים
		inca
		sta	GSETF
		ldb	GFORE
		lbsr	gsetac
		ldx	#0
		pshs	a,x		; הסמן
dloop		lbsr	dget
		bcc	1F
		puls	a,x		; המחרוזת נגמרה: חוזרים לחיצונית
		sta	DLEN
		stx	DPTR
		bne	dloop
		rts			; הסמן: סוף DRAW
1		cmpa	#';
		beq	dloop
		cmpa	#''
		beq	dloop
		cmpa	#'N
		bne	2F
		com	DN
		bra	dloop
2		cmpa	#'B
		bne	3F
		com	DB
		bra	dloop
3		cmpa	#'X
		bne	4F
		ldb	#1		; X שם; : מחרוזת אחרת. getstk של 3 בתים
		lbsr	dxstr
		bra	dloop
4		cmpa	#'M
		beq	dmcmd
		pshs	a		; כל אות אחרת: קודם המספר
		lbsr	darg
		puls	a
		cmpa	#'C
		bne	5F
		lbsr	gcolor		; 9 ומעלה: ?FC. נשאר צבע הכתיבה גם אחרי DRAW
		stb	GFORE
		lbsr	gsetac
		bra	dloop
5		ldx	#GANGLE
		cmpa	#'A
		bne	6F
		cmpb	#4
		bra	61F
6		cmpa	#'S
		bne	7F
		leax	1,x		; GSCALE
		cmpb	#63		; 63 נדחה (כמו במקור)
61		bhs	dfc2
		stb	,x
		bra	dloop
; U R D L הם U מסובב 0-3 פעמים, ו-E F G H הם E (n,-n) מסובב
7		leax	dlet,pcr
		pshs	b
		clrb
8		cmpa	b,x
		beq	9F
		incb
		cmpb	#8
		blo	8B
		bra	dfc2		; אות לא מוכרת (גם קטנה)
9		puls	a
		exg	a,b		; A = המקום בטבלה, B = n
		pshs	a
		clra
		std	GX2
		lbsr	dneg
		std	GY2		; (n,-n)
		puls	a
		bita	#4
		bne	10F
		clr	GX2+1		; U: (0,-n). הבית הגבוה כבר 0
10		anda	#3
		bra	drel
dlet		fcc	"URDLEFGH"
dfc2		lbra	err_fc

; M x,y: סימן לפני x = יחסי (קנה מידה וזווית). אחרת מוחלט: בלי בדיקת שלילי, רק החיתוך
dmcmd		lbsr	dmval
		std	GX2
		lda	DSIGN
		pshs	a
		lbsr	dgetf
		cmpa	#',
		bne	dfc2
		lbsr	dmval
		std	GY2
		puls	a
		tsta
		beq	dabs
		clra
; drel: (GX2,GY2) = תזוזה. קנה מידה: |v|*S/4; ואז סיבוב (dx,dy) → (-dy,dx), A ועוד הזווית פעמים;
; מהנקודה האחרונה, ושלילי → 0
drel		adda	GANGLE
		pshs	a
		tst	GSCALE
		beq	4F
		ldx	#GX2
		bsr	dscl
		ldx	#GY2
		bsr	dscl
4		dec	,s
		bmi	5F
		ldd	GY2
		bsr	dneg
		ldx	GX2
		std	GX2
		stx	GY2
		bra	4B
5		leas	1,s
		ldd	GLX
		addd	GX2
		bpl	6F
		clra
		clrb
6		std	GX2
		ldd	GLY
		addd	GY2
		bpl	7F
		clra
		clrb
7		std	GY2
; dabs: חיתוך (x מעל 255 → 255, y מעל 191 → 191, בלי סימן), ואז קו מהנקודה האחרונה
dabs		ldd	GX2
		tsta
		beq	1F
		ldb	#255
1		clra
		std	GX2
		ldd	GY2
		cmpd	#191
		bls	2F
		ldd	#191
2		std	GY2
		lbsr	glgx
		tst	DN
		bne	3F
		lbsr	g2gl
3		lbsr	gscl2
		tst	DB
		bne	4F
		lbsr	gline
4		clra
		clrb
		std	DN
		lbra	dloop
; dscl: המספר עם הסימן ב-X כפול קנה המידה, חלקי 4 (16 ביט, בלי סימן)
dscl		ldd	,x
		pshs	a
		bpl	1F
		bsr	dneg
1		lda	GSCALE
		mul
		lsra
		rorb
		lsra
		rorb
		tst	,s+
		bpl	2F
		bsr	dneg
2		std	,x
		rts
; dneg: D = -D
dneg		nega
		negb
		sbca	#0
		rts

gfc		lbra	err_fc
; gmin: X = נקודה 1, X+6 = נקודה 2 (הבית התחתון) → בנקודה 1 הקטן, בנקודה 2 ההפרש
gmin		lda	1,x
		ldb	7,x
		subb	1,x
		bcc	1F
		negb
		lda	7,x
1		sta	1,x
		stb	7,x
		rts

; ---------- GET / PUT [@](x1,y1)-(x2,y2),מערך[,G | ,פעולה] (קורא 12) ----------
; הנקודה האחרונה לא משתנה. בלי המשך: העתקת בתים; עם המשך: ביט אחרי ביט
get_st		clrb
		fcb	$8c		; cmpx: מדלג על ה-ldb
put_st		ldb	#1
		jsr	HK_MISC		; 23: B = 0 GET / 1 PUT
		stb	GPFLG
		lbsr	g2pt
		lbsr	chkcom
		clrb
		lbsr	ptrget		; כמו במקור: יכול ליצור משתנה פשוט באותו שם
		tst	VALTYP
		bne	gfc		; מערך מחרוזות: ?FC
		ldx	ARYTAB
1		cmpx	STREND
		beq	gfc		; אין מערך כזה: ?FC
		ldd	2,x
		leay	d,x
		ldd	,x
		cmpd	VARNAM
		beq	2F
		tfr	y,x
		bra	1B
2		sty	GPEND
		ldb	4,x
		lslb
		addb	#4
		abx
		stx	GPPTR		; הבית שלפני הנתונים
		clr	GPBIT
		jsr	<chrgot
		beq	5F
		com	GPBIT
		lbsr	chkcom
		tst	GPFLG
		bne	3F
		lda	#'G
		lbsr	synchk
		bra	5F
3		leax	gpatab,pcr	; הפעולה: טוקן, ואחריו הקוד שלה
4		ldb	,x++
		lbeq	err_sn
		cmpa	-2,x
		bne	4B
		ldb	-1,x
		stb	GPACT
		jsr	<chrget
5		tst	GPBIT		; בתים: x מעוגל לבית (שחור-לבן $F8, צבעים $FC)
		bne	6F
		lda	#$f8
		ldb	GMODE
		lsrb
		bcc	7F
		lda	#$fc
7		tfr	a,b
		anda	GX+1
		sta	GX+1
		andb	GX2+1
		stb	GX2+1
6		ldx	#GX		; x = הקטן, GX2 = המרחק (בצבעים כפול 2)
		lbsr	gmin
		lda	GMODE
		lsra
		bcc	8F
		lsl	GX2+1
		rol	GX2
8		ldx	#GY		; y = הקטן, GY2 = המרחק
		lbsr	gmin
		lbsr	gscl2		; גם המרחקים מוקטנים כמו נקודה
		inc	GY2+1		; מספר השורות (רק הבית התחתון)
		lbsr	gaddr		; X = הבית, A = המסכה
		ldu	GPPTR
		tst	GPBIT
		bne	gpbits
		ldb	GX2+1		; בתים בשורה: dx/8+1
		lsrb
		lsrb
		lsrb
		incb
		stb	GX2
gprow		pshs	x
		ldb	GX2
1		leau	1,u		; קודם מתקדמים; הגענו לסוף המערך: ?FC
		cmpu	GPEND
		beq	dfc3
		tst	GPFLG
		bne	2F
		lda	,x		; GET: מהמסך למערך
		sta	,u
		bra	3F
2		lda	,u		; PUT: מהמערך למסך
		sta	,x
3		leax	1,x
		decb
		bne	1B
		puls	x
		ldb	GROWB
		abx
		dec	GY2+1
		bne	gprow
		rts
dfc3		lbra	err_fc
; ביטים: dx+1 ביטים בשורה, ברצף במערך (בלי ריפוד בסוף שורה). המסכה במסך תמיד זזה ביט אחד
gpbits		ldb	GMODE
		lsrb
		bcc	1F
		anda	#$aa		; צבעים: הביט העליון של הזוג
1		tst	GPFLG
		bne	3F
		leay	,u		; GET: קודם מאפסים את כל הנתונים (Y נקבע מחדש בהמשך)
2		leay	1,y
		cmpy	GPEND
		beq	3F
		clr	,y
		bra	2B
3		ldb	#1		; מסכת המערך: "לפני ביט 7"
gpbrow		stx	GPRADR
		sta	GPRMSK
		ldy	GX2
		leay	1,y
gpbit		lsrb
		bcc	1F
		rorb			; בית חדש במערך: ביט 7
		leau	1,u
		cmpu	GPEND
		beq	dfc3
1		pshs	a,b
		tst	GPFLG
		bne	3F
		bita	,x		; GET: ביט דלוק במסך → דלוק במערך
		lbeq	5F
		orb	,u
		stb	,u
		lbra	5F
3		ldb	GPACT		; PUT: הפעולה לפי הביט במערך
		lda	1,s
		anda	,u
		beq	4F
		lsrb
		lsrb
4		lda	,x
		bitb	#2		; מחיקה
		beq	41F
		ora	,s
		eora	,s
41		bitb	#1		; היפוך
		bra	isl_b3b4_e	;@isl
		fill	$ff,$b3b4-*	;@isl
		jmp	reset	;@isl
isl_b3b4_e	;@isl
		beq	42F
		eora	,s
42		sta	,x
5		puls	a,b
		lsra			; ביט אחד ימינה במסך
		bcc	6F
		rora
		leax	1,x
6		leay	-1,y
		lbne	gpbit
		ldx	GPRADR		; השורה הבאה, מאותה מסכה
		lda	GROWB
		leax	a,x
		lda	GPRMSK
		dec	GY2+1
		lbne	gpbrow
		rts
; הפעולות של PUT: מחיקה = 2, הדלקה = 3, היפוך = 1, בלי שינוי = 0 (לביט 1 בביטים 2-3)
gpatab		fcb	$ac,$0e		; PSET: מחיקה / הדלקה
		fcb	$ad,$0b		; PRESET: הדלקה / מחיקה
		fcb	$c8,$02		; AND: מחיקה / בלי שינוי
		fcb	$c9,$0c		; OR: בלי שינוי / הדלקה
		fcb	$c0,$05		; NOT: היפוך / היפוך
		fcb	0
