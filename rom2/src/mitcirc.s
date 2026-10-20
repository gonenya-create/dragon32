; Dragon 1982 BASIC — שלב 3, חלק 3: CIRCLE ו-PAINT.
; הכול לפי הקורא: docs/DRAGON-SPEC-GRAPHICS.md (סעיפים 9, 10). נכתב מאפס, על הליבה של mitgfx.s.

GCX		equ	$cb		; CIRCLE: המרכז (אחרי ההקטנה)
GCY		equ	$cd
GR		equ	$cf		; הרדיוס
GASP		equ	$d1		; היחס פי 256
GCPOS		equ	$d7		; המיקום הנוכחי 0-63 (שמינית*8 + צעד)
GCEND		equ	$d9		; מיקום הסוף
GSAV		equ	$cb		; PAINT: ה-X השמור
GLC		equ	$cd		; כמה נצבעו שמאלה
GREM		equ	$d1		; כמה נשארו (עם סימן)
GDIR		equ	$d7		; הכיוון: 1, -1, 0
GBRD		equ	$d8		; צבע הגבול, בכל הבית
GSSP		equ	$dc		; המחסנית אחרי השליפה האחרונה
GRR		equ	$cf		; כמה נצבעו ימינה

; gat: "@" אופציונלי, המקסימום, "(x,y)" ל-U ומוקטן. ברירת המחדל: צבע הכתיבה
gat		cmpa	#'@
		bne	1F
		jsr	<chrget
1		lbsr	gmax
		lbsr	gpar
		lda	#1
		sta	GSETF
		tfr	u,x
		lbra	gscl

; ---------- CIRCLE [@](x,y),r[,c[,יחס[,התחלה[,סוף]]]] (קורא 9) ----------
circle_st	ldu	#GCX
		bsr	gat
		lbsr	chkcom
		lbsr	frmevl
		lbsr	getadr
		std	GR
		ldx	#GR		; הרדיוס מוקטן כמו x (גם GASP זז כאן, וממילא נקבע מיד)
		lbsr	gscl
		lbsr	gocol
		ldd	#256		; יחס 1.0
		std	GASP
		clr	GCPOS
		clr	GCEND
		jsr	<chrgot
		beq	2F
		ldb	#8		; פי 256
		bsr	gcnum
		std	GASP
		jsr	<chrgot
		beq	2F
		bsr	gcpos
		stb	GCPOS
		jsr	<chrgot
		beq	2F
		bsr	gcpos
		stb	GCEND
2		lda	GMODE		; PMODE 2-3: היחס כפול
		lsra
		cmpa	#1
		bne	4F
		lsl	GASP+1
		rol	GASP
; הלולאה: נקודה, ואז קו מהקודמת אליה, עד שמגיעים לסוף (התחלה = סוף: עיגול שלם)
4		ldb	GCPOS
		bsr	gcpt
5		ldd	GX2
		std	GX
		ldd	GY2
		std	GY
		ldb	GCPOS
		incb
		andb	#63
		stb	GCPOS
		bsr	gcpt
		lbsr	gline
		ldb	GCPOS
		cmpb	GCEND
		bne	5B
		rts
; gcpos: התחלה/סוף: פי 64, בית (4.0 ומעלה ?FC), ו-AND 63
gcpos		ldb	#6
		bsr	gcnum
		tsta
		lbne	err_fc
		andb	#63
		rts
; gcnum: פסיק, מספר כפול 2^B (מוסיפים למעריך), ואז 0-65535 ב-D (אחרת ?FC)
gcnum		pshs	b
		lbsr	chkcom
		lbsr	frmevl
		lbsr	chknum
		puls	b
		tst	FACEXP
		beq	1F
		addb	FACEXP
		lbcs	err_fc
		stb	FACEXP
1		lbra	getadr

; gcpt: הנקודה של המיקום B → GX2, GY2. שמינית o = B/8, צעד b. k = b, או 8-b בשמינית אי-זוגית.
; a = r*cos, bb = r*sin. בשמיניות 1,2,5,6 מחליפים. V = Vr*יחס/256 (2^24 ומעלה: ?FC).
; X: שמיניות 0,1,6,7 מוסיפים (עד המקסימום), אחרות מחסירים (עד 0). Y: 0-3 מוסיפים, 4-7 מחסירים
gcpt		tfr	b,a
		lsra
		lsra
		lsra
		andb	#7
		bita	#1
		beq	1F
		negb
		addb	#8
1		pshs	a
		leau	gctab,pcr
		lslb
		lslb
		leau	b,u
		ldd	2,u
		bsr	gcmr
		pshs	d		; bb
		ldd	,u
		bne	2F
		ldd	GR		; הערך 0 בטבלה הוא 1.0
		bra	3F
2		bsr	gcmr
3		pshs	d		; a. עכשיו [0] a, [2] bb, [4] o
		lda	4,s
		inca
		bita	#2
		beq	4F
		ldd	,s
		ldx	2,s
		std	2,s
		stx	,s		; [0] H, [2] Vr
4		ldd	2,s
		ldx	GASP
		bsr	umul
		tst	FACHO
		lbne	err_fc
		ldu	FACMOH		; V
		ldx	#GCY
		lda	4,s
		bsr	gcxy
		std	GY2
		ldu	,s
		ldx	#GCX
		lda	4,s
		adda	#2
		bsr	gcxy
		std	GX2
		leas	5,s
		rts
; gcxy: X → המרכז, U = ההפרש. ביט 2 של A: 0 מוסיפים (גלישה או מקסימום ומעלה: המקסימום), 1 מחסירים (מתחת ל-0: 0)
gcxy		bita	#4
		tfr	u,d
		bne	2F
		addd	,x
		bcs	1F
		cmpd	8,x		; GMAXX / GMAXY
		blo	9F
1		ldd	8,x
9		rts
2		pshs	u
		ldd	,x
		subd	,s++
		bcc	9B
		clra
		clrb
		rts
; gcmr: D = r * D / 65536
gcmr		ldx	GR
		bsr	umul
		ldd	FACHO
		rts
; umul: D * X → 32 ביט ב-FACHO..FACLO
umul		pshs	d,x
		lda	1,s
		ldb	3,s
		mul
		std	FACMO
		lda	,s
		ldb	2,s
		mul
		std	FACHO
		lda	,s
		ldb	3,s
		bsr	1F
		lda	1,s
		ldb	2,s
		bsr	1F
		puls	d,x,pc
1		mul
		addd	FACMOH
		std	FACMOH
		bcc	2F
		inc	FACHO
2		rts
; לכל k = 0..8: cos ו-sin של k*5.625 מעלות, פי 65536 (cos של 0 הוא 1.0, כאן 0)
gctab		fdb	0,0,65220,6424,64277,12785,62714,19024,60547,25080
		fdb	57798,30893,54491,36410,50660,41576,46341,46341

; ---------- PAINT [@](x,y)[,צבע[,גבול]] (קורא 10) ----------
paint_st	ldu	#GX
		lbsr	gat
		lbsr	gocol
		ldb	GACT
		pshs	b
		jsr	<chrgot
		beq	2F		; בלי גבול: הגבול = צבע הצביעה
		lbsr	gocol
2		ldb	GACTB
		stb	GBRD
		puls	b
		lbsr	gsetac
; רשימת העבודה במחסנית, 6 בתים לרשומה: כיוון, y, x (משמאל לקטע), כמה. קודם רשומה עם כיוון 0
		clra
		bsr	gpush
		lbsr	gsl		; הזרע: שמאלה, ואם צבענו משהו גם ימינה
		beq	gpop
		bsr	gext
		tfr	d,u
		ldx	GSAV
		lda	#1
		bsr	gpush
		lda	#-1
		bsr	gpush
		bra	gpop		; בפעם הראשונה לא זורקים כלום
; gext: אחרי סריקה שמאלה (D = L): ימינה מהתחלת הקטע. GLC = L, GRR = R, D = L+R, ו-GSAV = העצירה משמאל
gext		std	GLC
		ldd	GX
		ldx	GSAV
		std	GSAV
		stx	GX
		lbsr	gsr
		std	GRR
		addd	GLC
9		rts
; gpushs: D = כמה, X = ה-X השמור, בכיוון הנוכחי. gpushr: X, U, בכיוון ההפוך. gpush: A = כיוון
gpushs		tfr	d,u
		ldx	GSAV
		lda	GDIR
		bra	gpush
gpushr		lda	GDIR
		nega
; gpush: בדיקת זיכרון (?OM) לפני כל דחיפה. הרשומה: A כיוון, y, X, U
gpush		pshs	a
		ldb	#4
		lbsr	getstk
		puls	a
		puls	y
		ldb	GY+1
		pshs	d,x,u
		jmp	,y
; הלולאה: אם הרשומה הקודמת לא שינתה כלום, זורקים את כל מה שהיא דחפה
gmain		tst	GCHG
		bne	gpop
		lds	GSSP
gpop		puls	a,b,x,u
		clr	GCHG
		sts	GSSP
		sta	GDIR
		beq	9B		; הרשומה של כיוון 0: סיום
		leax	1,x
		stx	GX
		stu	GREM
		addb	GDIR		; השורה החדשה; מתחת ל-0 או מעל המקסימום: מדלגים
		cmpb	GMAXY+1
		bhi	gmain
		stb	GY+1
		bsr	gsl		; הרחבה שמאלה
		beq	5F
		bsr	gext
		ldd	GLC
		subd	#2		; L 3 ומעלה: מה שמשמאל לקטע, בכיוון ההפוך
		ble	4F
		tfr	d,u
		ldx	GSAV
		bsr	gpushr
4		ldd	GLC
		addd	GRR
		bsr	gpushs
		ldd	#-2
		subd	GRR
		bra	6F
5		ldd	#-1
6		addd	GREM		; נשארו פחות
		std	GREM
		ble	8F
		ldd	GX		; הליכה ימינה על הקטע של ההורה
		addd	#1
		std	GX
		bsr	gbord
		beq	5B
		ldd	GX
		subd	#1
		std	GX
		std	GSAV
		bsr	gsr
		std	GRR
		bsr	gpushs
		ldd	#-1
		subd	GRR
		bra	6B
8		ldd	GX		; מה שמימין לקטע: בכיוון ההפוך
		addd	#1
		addd	GREM
		std	GX
		tfr	d,x
		ldd	#-2
		subd	GREM
		ble	gmain
		tfr	d,u
		lbsr	gpushr
		lbra	gmain
; gsl: סריקה שמאלה מ-GX (שומרים אותו ב-GSAV). gsr: ימינה מ-GX+1.
; עוצרים בגבול או מחוץ למסך (X מתחת ל-0 או מעל המקסימום). D = כמה נצבעו, Z=1 אם 0
gsl		ldd	GX
		std	GSAV
		ldd	#-1
		bra	1F
gsr		ldd	GX
		addd	#1
		std	GX
		ldd	#1
1		pshs	d
		ldu	#0
2		ldd	GX
		cmpd	GMAXX
		bhi	3F
		bsr	gbord
		beq	3F
		lbsr	gplot
		leau	1,u
		ldd	GX
		addd	,s
		std	GX
		bra	2B
3		puls	d
		tfr	u,d
		leax	,u
		rts
; gbord: X = הבית, A = המסכה של (GX,GY). Z=1 אם הנקודה בצבע הגבול בדיוק
gbord		lbsr	gaddr
		pshs	a
		ldb	,x
		eorb	GBRD
		andb	,s+
		rts
