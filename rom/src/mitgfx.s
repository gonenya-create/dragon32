; Dragon 1982 BASIC — שלב 3, חלק 3: גרפיקה.
; הכול לפי הקורא: docs/DRAGON-SPEC-GRAPHICS.md (עובדות בלבד, בלי קוד). נכתב מאפס.
; כאן: הליבה (קואורדינטות, צבעים, נקודה), PMODE, SCREEN, PCLS, COLOR, PSET, PRESET, PPOINT, LINE, PCOPY.

GFORE		equ	$b2		; צבע הכתיבה, פנימי 0-3 (קורא 0.1)
GBACK		equ	$b3		; צבע הרקע
GACT		equ	$b4		; הצבע של הפעולה הנוכחית
GACTB		equ	$b5		; אותו צבע בכל הבית (פי $55)
GMODE		equ	$b6		; PMODE 0-4
GEND		equ	SCTOP		; $B7: סוף הדף (רק הבית הגבוה נכתב)
GROWB		equ	$b9		; בתים בשורה, 16 או 32
GSTART		equ	$ba		; תחילת הדף (רק הבית הגבוה נכתב)
GX		equ	$bd		; נקודה 1 (2 בתים כל אחד)
GY		equ	$bf
GCSS		equ	$c1		; ערכת הצבעים: 0 או 8
GSETF		equ	$c2		; 1: PSET (צבע הכתיבה), 0: PRESET (הרקע)
GX2		equ	$c3		; נקודה 2
GY2		equ	$c5
GLX		equ	$c7		; הנקודה האחרונה, לפני ההקטנה (LINE -(x,y), DRAW)
GLY		equ	$c9
GMAXX		equ	$d3		; הנקודה הגבוהה ביותר אחרי ההקטנה (CIRCLE, PAINT)
GMAXY		equ	$d5
GCHG		equ	$db		; PAINT: כל נקודה שמשנה בית מדליקה כאן ביטים
GANGLE		equ	$e8		; DRAW: הזווית 0-3
GSCALE		equ	$e9		; DRAW: קנה המידה 0-62

; gfxrun: בהדלקה ובכל RUN (קורא 0.2): הנקודה האחרונה (128,96), זווית וקנה מידה 0
gfxrun		ldd	#128
		std	GLX
		ldb	#96
		std	GLY
		clrb			; A כבר 0: הזווית וקנה המידה (GANGLE, GSCALE צמודים)
		std	GANGLE
		lbra	plyini		; ברירות PLAY (קורא: צליל 0.2)

; ---------- קואורדינטות (קורא 0.4) ----------
; gpar: "(x,y)" ל-U. gcoord: "x,y" ל-U (x ב-U, y ב-U+2, שני בתים כל אחד).
; x: 0-65535 ו-y: 0-255, אחרת ?FC. אחר כך x מעל 255 נהיה 255, ו-y מעל 191 נהיה 191
gpar		lbsr	chklp
		bsr	gcoord
		lbra	chkrp
gcogx		ldu	#GX		; gcogx: ל-GX
gcoord		pshs	u
		lbsr	frmevl
		lbsr	getadr
		tsta
		beq	1F
		ldb	#255
1		pshs	b
		lbsr	chkcom
		lbsr	evbyte
		cmpb	#192
		blo	2F
		ldb	#191
2		puls	a,u
		clr	,u
		sta	1,u
		clra
		std	2,u
		rts

; gscl: מקטינים את הנקודה ש-X מצביע עליה לפי ה-PMODE: 0-1 חצי ו-חצי, 2-3 רק x בחצי, 4 כמו שהיא
gscl2		ldx	#GX2
		bsr	gscl
gsclp		ldx	#GX		; gsclp: רק הנקודה GX
gscl		lda	GMODE
		cmpa	#4
		beq	9F
		lsr	,x
		ror	1,x
		cmpa	#2
		bhs	9F
		lsr	2,x
		ror	3,x
9		rts
; gmax: (255,191) אחרי ההקטנה, ב-GMAXX/GMAXY
gmax		ldx	#GMAXX
		ldd	#255
		std	,x
		ldb	#191
		std	2,x
		bra	gscl

; gaddr: הנקודה (GX,GY) אחרי ההקטנה → X = הבית, A = המסכה. רק הבתים התחתונים נחשבים. U ו-Y לא משתנים.
; ביט לנקודה (0, 2, 4): x/8, והמסכה מטבלה לפי x AND 7. שני ביטים (1, 3): x/4, והמסכה לפי x AND 3 (כמו במקור: טבלה)
gaddr		ldb	GY+1
		lda	GROWB
		mul
		addd	GSTART
		tfr	d,x
		ldb	GX+1
		lda	GMODE
		lsra
		bcs	2F
		lsrb
		lsrb
		lsrb
		abx
		ldb	GX+1
		andb	#7
		bra	3F
2		lsrb
		lsrb
		abx
		ldb	GX+1
		andb	#3
		addb	#8
3		pshs	x
		leax	gmasks,pcr
		lda	b,x
		puls	x,pc
gmasks		fcb	$80,$40,$20,$10,$08,$04,$02,$01,$c0,$30,$0c,$03

; gpset: נקודה בצבע הפעולה ב-(GX,GY). gplot: X = הבית, A = המסכה. U ו-Y לא משתנים
gpset		bsr	gaddr
gplot		pshs	a
		ldb	GACTB
		andb	,s		; הביטים החדשים
		coma
		anda	,x		; הבית בלי הנקודה
		pshs	b
		ora	,s+
		tfr	a,b
		subb	,x		; השתנה? (החדש פחות הישן)
		orb	GCHG
		stb	GCHG
		sta	,x
		puls	a,pc
; gpt1: ')' ואז הנקודה GX מוקטנת → X = הבית, A = המסכה (PSET, PPOINT)
gpt1		lbsr	chkrp
		bsr	gsclp
		bra	gaddr

; ---------- צבעים (קורא 0.5, 0.6) ----------
; evcol: ביטוי → B. gcolor: B = צבע 0-8 (9 ומעלה: ?FC) → B = צבע פנימי לפי ה-PMODE.
; 5-8 כמו 1-4. מצב צבעים: 0→3, 1→0, 2→1, 3→2, 4→3. שחור-לבן: אי-זוגי 3, זוגי 0
evcol		lbsr	evbyte
gcolor		cmpb	#9
		lbhs	err_fc
		cmpb	#5
		blo	1F
		subb	#4
1		lda	GMODE
		lsra
		bcc	2F
		decb
		andb	#3
		rts
2		andb	#1		; אי-זוגי: 1 → -1 → 3, זוגי: 0
		negb
		andb	#3
		rts
; gsetac: B = הצבע הפנימי של הפעולה. gdefc: צבע הכתיבה ל-PSET, הרקע ל-PRESET
gdefc		ldb	GFORE
		tst	GSETF
		bne	gsetac
		ldb	GBACK
gsetac		stb	GACT
		lda	#$55
		mul
		stb	GACTB
9		rts
; gocol: צבע אופציונלי אחרי נקודה (קורא 0.6). בסוף הפקודה או לפני ')': ברירת המחדל.
; אחרת פסיק, ואם אחריו עוד פסיק: ברירת המחדל, ועוצרים על הפסיק השני
gocol		bsr	gdefc
		jsr	<chrgot
		beq	9B
		cmpa	#')
		beq	9B
		lbsr	chkcom
		cmpa	#',
		beq	9B
		bsr	evcol
		bra	gsetac

; ---------- PSET(x,y[,c]) / PRESET(x,y[,c]) (קורא 6) ----------
pset_st		lda	#1
		fcb	$21		; brn: מדלג על ה-clra
preset_st	clra
		sta	GSETF
		lbsr	chklp
		lbsr	gcogx
		bsr	gocol
		bsr	gpt1
		bra	gplot

; ---------- PPOINT(x,y) (קורא 7) ----------
; שחור-לבן: 0, או 1 (5 בערכה 8). צבעים: הערך 0-3 ועוד 1 (ועוד 4 בערכה 8)
fn_ppoint	lbsr	chklp		; "(" (כמו במקור: השגרה קוראת את הארגומנטים בעצמה)
		lbsr	gcogx
		bsr	gpt1
		pshs	a
		ldb	,x
		andb	,s
2		lsr	,s		; מורידים את הנקודה לביט 0 (או לביטים 0-1)
		bcs	3F
		lsrb
		bra	2B
3		lda	GMODE
		lsra
		bcs	4F
		tstb			; שחור-לבן: 0 או 1
		beq	8F
		decb
4		incb
		tst	GCSS
		beq	8F
		addb	#4
8		leas	1,s
		lbra	givb

; ---------- PCLS [c] (קורא 4) ----------
pcls_st		beq	1F
		lbsr	evcol
		fcb	$8c		; cmpx: מדלג על ה-ldb
1		ldb	GBACK
		lda	#$55
		mul
		ldx	GSTART
2		stb	,x+
		cmpx	GEND
		blo	2B
		rts

; ---------- COLOR [f][,b] (קורא 5) ----------
color_st	cmpa	#',
		beq	1F
		lbsr	evcol
		stb	GFORE
		jsr	<chrgot
		beq	9F
1		lbsr	chkcom
		lbsr	evcol
		stb	GBACK
9		rts

; ---------- PMODE [m][,p] (קורא 2) ----------
; m: 0-4. הדף חוזר ל-1 עוד לפני בדיקת הזיכרון; אם סוף הדף אחרי תחילת התוכנית: ?FC.
; p: 1 ומעלה, בחשבון של 8 ביטים (מספרים גדולים מתגלגלים, כמו במקור)
pmode_st	cmpa	#',
		beq	2F
		lbsr	evbyte
		cmpb	#5
		bhs	pmfc
		pshs	b
		leax	pmtab,pcr
		lslb
		abx
		lda	SCRBAS
		sta	GSTART
		adda	,x
		cmpa	TXTTAB
		bhi	pmfc
		sta	GEND
		lda	1,x
		sta	GROWB
		puls	a
		sta	GMODE
		ldd	#$0300		; כתיבה 3, רקע 0
		std	GFORE
		jsr	<chrgot
		beq	9F
2		lbsr	chkcom
		bsr	gpg0
		pshs	b		; תחילת הדף החדש
		ldb	GEND
		subb	GSTART
		addb	,s		; הסוף החדש
		cmpb	TXTTAB
		bhi	pmfc
		stb	GEND
		puls	a
		sta	GSTART
9		rts
pmfc		lbra	err_fc
; gpg0: מספר דף (0 → ?FC) → B = הבית הגבוה של הדף (8 ביטים). גם PCOPY
gpg0		lbsr	evbyte
		tstb
		beq	pmfc
		decb
		lda	#6
		mul			; רק הבית התחתון נחשב
		addb	SCRBAS
		rts
pmtab		fcb	6,16,12,32,12,16,24,32,24,32	; לכל מצב: דפים של 256 בתים, בתים בשורה

; ---------- SCREEN [t][,c] (קורא 3, 0.7) ----------
screen_st	cmpa	#',
		beq	2F
		lbsr	evbyte
		tstb
		bne	1F
		lbsr	txtmode
		fcb	$8c		; cmpx: מדלג על ה-bsr
1		bsr	gfxmode
3		jsr	<chrgot
		beq	9F
2		lbsr	chkcom
		lbsr	evbyte
x_css		tstb			; ($AA10: ערכת הצבעים מ-B; קורא 8.12)
		beq	4F
		ldb	#8
x_css2
4		stb	GCSS
		lda	PIA1+2
		anda	#$f7
		ora	GCSS
		sta	PIA1+2
9		rts
; gfxmode: מצב גרפי לפי ה-PMODE, הדף וערכת הצבעים. קודם $FF22: שלושת הביטים התחתונים נשארים,
; ביט 7 דולק, GM = PMODE+3, ו-CSS. אחר כך SAM: כתובת המסך/512 (7 ביטים מ-$FFC6), ואז המצב (3 ביטים
; מ-$FFC0): PMODE+3, ו-7 נהיה 6. לכל ביט כותבים לכתובת הזוגית (0) או האי-זוגית (1)
gfxmode		ldb	GMODE
		addb	#3
		pshs	b
		lslb
		lslb
		lslb
		lslb
		orb	#$80
		orb	GCSS
		lda	PIA1+2
		anda	#7
		pshs	b
		ora	,s+
		sta	PIA1+2
		lda	GSTART
		lsra
		ldx	#SAM+6
		ldb	#7
		bsr	samset
		puls	a
		cmpa	#7
		bne	1F
		deca
1		ldx	#SAM
		ldb	#3
samset		lsra
		bcc	2F
		sta	1,x
		fcb	$8c		; cmpx: מדלג על ה-sta ,x
2		sta	,x
		leax	2,x
		decb
		bne	samset
		rts

; ---------- LINE [@][(x1,y1)]-(x2,y2),PSET|PRESET[,B|,BF] (קורא 8) ----------
; נכנסים מ-line_st (LINE INPUT שם). הנקודה הראשונה: ברירת המחדל היא האחרונה.
; הנקודה האחרונה מתעדכנת לפני הבדיקה של PSET/PRESET
; g2pt: "[@][(x1,y1)]-(x2,y2)" → GX/GY ו-GX2/GY2 (לפני ההקטנה). גם GET/PUT (קורא 12)
g2pt		cmpa	#'(
		beq	1F
		cmpa	#$c4		; -
		beq	1F
		lda	#'@
		lbsr	synchk
1		bsr	glgx
		jsr	<chrgot
		cmpa	#$c4
		beq	2F
		ldu	#GX
		lbsr	gpar
2		lda	#$c4
		lbsr	synchk
		ldu	#GX2
		lbra	gpar
; glgx: הנקודה האחרונה → נקודה 1. g2gl: נקודה 2 → הנקודה האחרונה (גם DRAW)
glgx		ldd	GLX
		std	GX
		ldd	GLY
		std	GY
		rts
g2gl		ldd	GX2
		std	GLX
		ldd	GY2
		std	GLY
		rts
gline_st	bsr	g2pt
		bsr	g2gl
		lbsr	chkcom
		suba	#$ac		; PSET = 0, PRESET = 1
		cmpa	#1
		lbhi	err_sn
		eora	#1
		sta	GSETF
		jsr	<chrget
		lbsr	gscl2
		lbsr	gdefc
		jsr	<chrgot
		lbeq	gline
		lbsr	chkcom
		lda	#'B
		lbsr	synchk
		beq	gbox
		lda	#'F
		lbsr	synchk
; gbfill: קווים אופקיים מ-y1 עד y2, צעד אחרי צעד
gbfill		bsr	ghlx
		lda	GY+1
		cmpa	GY2+1
		beq	9F
		blo	1F
		dec	GY+1
		fcb	$8c		; cmpx: מדלג על ה-inc
1		inc	GY+1
		bra	gbfill
; gbox: למעלה, שמאל, ימין, למטה
gbox		bsr	ghlx
		bsr	gvly
		lda	GX+1		; x1 נשמר במחסנית (gpset משנה את X)
		pshs	a
		ldb	GX2+1
		stb	GX+1
		bsr	gvly
		puls	a
		sta	GX+1
		ldb	GY2+1
		stb	GY+1
; ghl / gvl: קו אופקי / אנכי מ-A עד B (בכל סדר), מהקטן לגדול. הערך של הציר חוזר בסוף
; ghlx / gvly: אותו דבר מ-x1 עד x2 / מ-y1 עד y2
ghlx		lda	GX+1
		ldb	GX2+1
ghl		ldu	#GX+1
		bra	gseg
gvly		lda	GY+1
		ldb	GY2+1
gvl		ldu	#GY+1
; כמו במקור: המקום והמסכה מחושבים פעם אחת, ואז רק צועדים. אנכי: עוד שורה (GROWB בתים). אופקי: המסכה זזה
; ימינה (שני ביטים במצב צבעים), וכשהיא נגמרת עוברים לבית הבא, למסכה השמאלית
gseg		pshs	a
		cmpb	,s+
		bhs	1F
		exg	a,b		; A = הקטן, B = הגדול
1		pshs	b
		ldb	,u
		pshs	b		; [0] הערך של הציר, [1] הסוף
		sta	,u
		lbsr	gaddr
2		lbsr	gplot
		ldb	,u
		cmpb	1,s
		bhs	3F
		inc	,u
		cmpu	#GY+1
		beq	5F
		ldb	GMODE
		lsrb			; C = מצב צבעים
		bcc	4F
		lsra
4		lsra
		bne	2B
		leax	1,x
		rora			; הביט שיצא חוזר משמאל: $80
		ldb	GMODE
		lsrb
		bcc	2B
		asra			; מצב צבעים: $C0
		bra	2B
5		ldb	GROWB
		abx
		bra	2B
3		puls	a,b
		sta	,u
9		rts

; gline: קו מ-(GX,GY) ל-(GX2,GY2), אחרי ההקטנה (קורא 8, גם ל-DRAW ול-CIRCLE).
; הציר הארוך M צועד כל פעם; המצבר מתחיל ב-M/2 (ועוד -1 אם M זוגי והצעד שלילי, כדי שקו לשני
; הכיוונים יצא אותו דבר), ועולה ב-m; כשהוא מגיע ל-M, צעד גם בציר השני. M+1 נקודות, מההתחלה לסוף
gline		lda	GY+1
		cmpa	GY2+1
		beq	ghlx
		lda	GX+1
		cmpa	GX2+1
		beq	gvly
		lda	GX2+1
		suba	GX+1
		bsr	gdl
		pshs	d		; dx, הצעד של x
		lda	GY2+1
		suba	GY+1
		bsr	gdl
		pshs	d		; dy, הצעד של y
		ldu	#GY+1
		ldy	#GX+1
		lda	2,s
		cmpa	,s
		blo	5F		; y ארוך יותר
		ldd	,s		; x ארוך יותר: מחליפים, כדי שהארוך יהיה למעלה
		ldx	2,s
		std	2,s
		stx	,s
		exg	u,y
5		ldb	,s		; [0] M, [1] הצעד שלו, [2] m, [3] הצעד שלו
		lsrb
		bcs	6F
		tst	1,s
		bpl	6F
		decb
6		lda	,s
		pshs	d		; [0] נשארו, [1] המצבר
7		lbsr	gpset
		tst	,s
		beq	9F
		dec	,s
		lda	,u
		adda	3,s
		sta	,u
		ldb	1,s
		addb	4,s
		bcs	8F
		cmpb	2,s
		blo	10F
8		subb	2,s
		lda	,y
		adda	5,s
		sta	,y
10		stb	1,s
		bra	7B
9		leas	6,s
		rts
; gdl: אחרי suba: A = המרחק בערך מוחלט, B = הצעד (1 או -1)
gdl		ldb	#1		; ldb לא נוגע ב-C
		bcc	1F
		nega
		ldb	#-1
1		rts

; ---------- PCOPY s TO d (קורא 13) ----------
; כל דף: 0 → ?FC, ומתחיל אחרי תחילת התוכנית → ?FC (חשבון של 8 ביטים). 1536 בתים, מלמטה למעלה
pcopy_st	bsr	gpage
		pshs	d
		lda	#$bc		; TO
		lbsr	synchk
		bsr	gpage
		tfr	d,u
		puls	x
		ldy	#768
1		ldd	,x++
		std	,u++
		leay	-1,y
		bne	1B
		rts
; gpage: מספר דף → D = כתובת הדף (gpg0 ליד PMODE)
gpage		lbsr	gpg0
		cmpb	TXTTAB
		lbhs	err_fc
		tfr	b,a
		clrb
		rts
