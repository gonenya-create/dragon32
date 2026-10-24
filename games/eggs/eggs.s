; ביצי הדרקון (DRAGON EGGS) למכונת ה-Dragon: אותו משחק כמו המחסנית שבאפליקציה, כתוב מחדש בשפת המעבד 6809.
; דרקון עף למעלה ומטיל ביצים, ואתם תופסים אותן בסל. מדי פעם הוא יורק כדור אש, ואותו לא תופסים.
; קלטת: CLOADM ואז EXEC. בלי ה-ROM: המשחק מדבר ישר עם החומרה (PIA, SAM, VDG), כמו המשחקים של אז.
; מסך גרפי 128x192 בארבעה צבעים (PMODE 3), בשני דפים: מציירים על אחד בזמן שהשני על המסך, ואז מחליפים.
; שליטה: החיצים, או ג'ויסטיק ימני (מי שמתחיל בכפתור של הג'ויסטיק משחק איתו). BREAK: חזרה ל-BASIC, כמו לחיצה על RESET.
; (C) 2026 Gonen Yarom. קוד מקורי שלנו.

PIA0		equ	$ff00
PIA1		equ	$ff20
SAM		equ	$ffc0
TEXT		equ	$0400		; מסך הטקסט
SCRA		equ	$0c00		; דף גרפי א (6K)
SCRB		equ	$2400		; דף גרפי ב (6K)
GROUND		equ	184		; השורה שבה מתחילה האדמה
BASY		equ	168		; הסל
DRY		equ	14		; הדרקון
ITEMY		equ	34		; מכאן נופלים הביצים והאש
SPLY		equ	179		; ביצה שבורה על האדמה
NITEMS		equ	8
ISIZE		equ	7		; חפץ: פעיל, x, y (8.8), מהירות (8.8), אש?
NSPLAT		equ	4

		org	$4000
start		orcc	#$50		; בלי פסיקות: הזמן מגיע מהמסך (FS), לא מה-ROM
		lds	#$7f00
		lda	PIA0+1		; הבוררים על ה-DAC (ערוץ 0 גם לג'ויסטיק הימני, ציר X)
		anda	#$f7
		sta	PIA0+1
		lda	PIA0+3
		anda	#$f7
		sta	PIA0+3
		lda	PIA1+3		; הצליל לטלוויזיה
		ora	#8
		sta	PIA1+3
		clr	PIA1
		ldd	#0
		std	high
		clr	sndon
		clr	joymode
		ldd	#$ace1
		std	seed

; ---------- מסך הפתיחה ----------
title		lbsr	textmode
		ldx	#t_title
		lbsr	prtall
		ldd	high
		beq	1F
		ldx	#t_high
		lbsr	prtall
		ldd	high
		lbsr	prtnum
1		lbsr	waitstart

; ---------- משחק ----------
play		lbsr	gfxinit
		ldd	#0
		std	score
		lda	#3
		sta	lives
		ldd	#60*256
		std	drx
		clr	drdir
		lda	#50
		sta	dropin
		ldd	#56*256
		std	basx
		clr	hurt
		ldx	#items
		ldb	#NITEMS*ISIZE+NSPLAT*2
1		clr	,x+
		decb
		bne	1B
		ldx	#s_start
		lbsr	snd
loop		lbsr	update
		lbsr	draw
		lbsr	vwait
		lbsr	flip
		tst	lives
		bne	loop

; ---------- סוף המשחק ----------
over		clr	newhi
		ldd	score
		cmpd	high
		bls	1F
		std	high
		inc	newhi
1		ldx	#s_over
		lbsr	snd
		lbsr	textmode
		ldx	#t_over
		lbsr	prtall
		ldd	score
		lbsr	prtnum
		tst	newhi
		beq	2F
		ldx	#t_newhi
		lbsr	prtall
		bra	3F
2		ldx	#t_high2
		lbsr	prtall
		ldd	high
		lbsr	prtnum
3		lda	#50		; שנייה של מנוחה, שלא יתחיל שוב בטעות
		sta	tmp
4		lbsr	vwait
		dec	tmp
		bne	4B
		lbsr	waitstart
		lbra	play

; waitstart: מחכה שישחררו, ואז לרווח (מקלדת) או לכפתור הג'ויסטיק. גם מערבב את המספרים האקראיים
waitstart
1		lbsr	vwait
		lbsr	keys
		lda	kfire
		ora	kjfire
		bne	1B
2		lbsr	vwait
		lbsr	rnd
		lbsr	keys
		clr	joymode
		tst	kjfire
		beq	3F
		inc	joymode
		rts
3		tst	kfire
		beq	2B
		rts

; ---------- צעד אחד של המשחק ----------
update		lbsr	keys
		ldd	score		; lvl = הניקוד, עד 40 (אז הקצב בשיא)
		tsta
		bne	1F
		cmpb	#40
		bls	2F
1		ldb	#40
2		stb	lvl
; הדרקון: מהירות 184 + 4.5 לכל רמה (חלקי 256 נקודות לפריים)
		clra
		lslb
		rola
		lslb
		rola
		addd	#184
		std	tmp
		ldb	lvl
		lsrb
		clra
		addd	tmp
		std	tmp
		ldd	drx
		tst	drdir
		bne	3F
		addd	tmp
		bra	4F
3		subd	tmp
4		cmpd	#2*256
		bge	5F
		ldd	#2*256
		clr	drdir
		bra	6F
5		cmpd	#108*256
		ble	6F
		ldd	#108*256
		ldb	#1
		stb	drdir
		clrb
6		std	drx
		lbsr	rnd		; לפעמים הוא מסתובב סתם
		tsta
		bne	7F
		lda	drdir
		eora	#1
		sta	drdir
; מטיל: ביצה, או מדי פעם כדור אש
7		dec	dropin
		lbne	20F
		ldy	#items
8		tst	,y
		beq	9F
		leay	ISIZE,y
		cmpy	#items+NITEMS*ISIZE
		bne	8B
		bra	19F
9		lda	#1
		sta	,y
		clr	6,y
		ldd	score		; אש רק מ-5 ביצים, בסיכוי 31 + 3/4 רמה מתוך 256
		cmpd	#5
		blo	10F
		ldb	lvl
		lsrb
		lsrb
		pshs	b
		ldb	lvl
		subb	,s+
		addb	#31
		stb	tmp
		lbsr	rnd
		cmpa	tmp
		bhs	10F
		inc	6,y
10		lda	drx
		adda	#6
		sta	1,y
		lda	#ITEMY
		sta	2,y
		clr	3,y
		lda	lvl		; מהירות הנפילה: 246 + 11 לכל רמה + קצת מזל
		ldb	#11
		mul
		addd	#246
		std	tmp
		lbsr	rnd
		anda	#$5f
		tfr	a,b
		clra
		addd	tmp
		std	4,y
19		ldb	lvl		; עד הביצה הבאה: 58 פריימים, פחות 7/8 רמה, ועוד 0-15
		lsrb
		lsrb
		lsrb
		pshs	b
		ldb	lvl
		subb	,s+
		pshs	b
		lda	#58
		suba	,s+
		sta	tmp
		lbsr	rnd
		anda	#15
		adda	tmp
		sta	dropin
; הסל
20		ldd	basx
		tst	kleft
		beq	21F
		subd	#$0190
21		tst	kright
		beq	22F
		addd	#$0190
22		cmpd	#0
		bge	23F
		ldd	#0
23		cmpd	#112*256
		ble	24F
		ldd	#112*256
24		std	basx
; החפצים נופלים
		ldy	#items
30		tst	,y
		lbeq	39F
		ldd	2,y
		addd	4,y
		std	2,y
		ldb	#10		; הגובה: ביצה 10, אש 8
		tst	6,y
		beq	31F
		ldb	#8
31		addb	2,y
		stb	tmp		; התחתית
		cmpb	#BASY
		blo	35F
		lda	2,y
		cmpa	#BASY+4
		bhs	35F
		lda	1,y		; לרוחב: x+3 >= הסל, ו-x < הסל+15
		adda	#3
		cmpa	basx
		blo	35F
		lda	basx
		adda	#15
		cmpa	1,y
		bls	35F
		clr	,y		; נתפס
		tst	6,y
		beq	32F
		lbsr	hurtme		; אש!
		ldx	#s_fire
		lbsr	snd
		bra	39F
32		ldd	score
		addd	#1
		std	score
		ldb	score+1		; צליל שעולה עם כל ביצה, במחזור של 5
33		cmpb	#5
		blo	34F
		subb	#5
		bra	33B
34		lda	#3
		mul
		negb
		addb	#37
		stb	sndper
		stb	sndcnt
		lda	#3
		sta	sndon
		clr	sndsld
		clr	sndnoi
		bra	39F
35		ldb	tmp		; הגיע לאדמה
		cmpb	#GROUND
		blo	39F
		clr	,y
		tst	6,y
		bne	39F		; אש שנופלת לאדמה: בסדר
		lbsr	hurtme
		ldx	#s_splat
		lbsr	snd
		ldx	#splats
36		tst	,x
		beq	37F
		leax	2,x
		cmpx	#splats+NSPLAT*2
		bne	36B
		bra	39F
37		lda	#33
		sta	,x
		lda	1,y
		deca
		sta	1,x
39		leay	ISIZE,y
		cmpy	#items+NITEMS*ISIZE
		lbne	30B
; ביצים שבורות נעלמות, והסל מפסיק להבהב
		ldx	#splats
40		tst	,x
		beq	41F
		dec	,x
41		leax	2,x
		cmpx	#splats+NSPLAT*2
		bne	40B
		tst	hurt
		beq	42F
		dec	hurt
42		rts

hurtme		dec	lives
		lda	#25
		sta	hurt
		rts

; ---------- ציור הפריים בדף האחורי ----------
draw		tst	page
		bne	1F
		ldd	#SCRA
		ldx	#dirta
		ldy	enda
		bra	2F
1		ldd	#SCRB
		ldx	#dirtb
		ldy	endb
2		std	back
		stx	dstart
		sty	dend
3		cmpx	dend		; מוחקים את מה שצויר בדף הזה בפעם הקודמת
		beq	5F
		ldu	,x
		ldd	2,x
		leax	4,x
		sta	bw
		stb	rows
		lda	#32
		suba	bw
		sta	skip
4		ldb	bw
		clra
41		sta	,u+
		decb
		bne	41B
		ldb	skip
		leau	b,u
		dec	rows
		bne	4B
		bra	3B
5		ldx	dstart
		stx	dptr
; הדרקון: כיוון ומשק כנפיים
		lda	frame
		lsra
		lsra
		lsra
		anda	#1
		ldb	drdir
		lslb
		pshs	b
		adda	,s+
		ldb	#8
		mul
		ldx	#sp_drag
		abx
		lda	drx
		ldb	#DRY
		lbsr	spr
; ביצים ואש
		ldy	#items
6		tst	,y
		beq	8F
		ldx	#sp_egg
		tst	6,y
		beq	7F
		ldx	#sp_fire
7		lda	1,y
		ldb	2,y
		lbsr	spr
8		leay	ISIZE,y
		cmpy	#items+NITEMS*ISIZE
		bne	6B
; ביצים שבורות
		ldy	#splats
9		tst	,y
		beq	10F
		ldx	#sp_splat
		lda	1,y
		ldb	#SPLY
		lbsr	spr
10		leay	2,y
		cmpy	#splats+NSPLAT*2
		bne	9B
; הסל (מהבהב כשנפגעים)
		lda	hurt
		anda	#4
		bne	11F
		ldx	#sp_bask
		lda	basx
		ldb	#BASY
		lbsr	spr
; הניקוד
11		ldd	score
		lbsr	todec
		ldy	#digs
		lda	#2
		sta	tx
12		ldb	,y+
		lda	#8
		mul
		ldx	#sp_dig
		abx
		lda	tx
		ldb	#2
		lbsr	spr
		lda	tx
		adda	#4
		sta	tx
		dec	ndig
		bne	12B
; הלבבות
		lda	#122
		sta	tx
		ldb	lives
		stb	tmp
		beq	14F
13		ldx	#sp_heart
		lda	tx
		ldb	#3
		lbsr	spr
		lda	tx
		suba	#7
		sta	tx
		dec	tmp
		bne	13B
14		ldx	dptr
		tst	page
		bne	15F
		stx	enda
		rts
15		stx	endb
		rts

; spr: דמות. X = 4 המצביעים שלה, A = x (0-127), B = y. מצייר ב-OR על הרקע (ירוק = 0),
; ורושם את המלבן ברשימת המחיקה של הדף. Y נשמר
spr		pshs	y,a
		anda	#3		; ההזזה בתוך הבית
		lsla
		ldx	a,x
		lda	#32
		mul
		addd	back
		tfr	d,u
		lda	,s
		lsra
		lsra
		leau	a,u
		ldy	dptr
		stu	,y
		ldd	,x++		; A = רוחב בבתים, B = גובה
		std	2,y
		leay	4,y
		sty	dptr
		sta	bw
		stb	rows
		lda	#32
		suba	bw
		sta	skip
1		ldb	bw
2		lda	,x+
		ora	,u
		sta	,u+
		decb
		bne	2B
		ldb	skip
		leau	b,u
		dec	rows
		bne	1B
		puls	a,y,pc

; ---------- מסך ----------
; gfxinit: שני הדפים ריקים (ירוק, ואדמה כחולה), מצב PMODE 3, ודף ב על המסך
gfxinit		ldx	#SCRA
		bsr	clrscr
		ldx	#SCRB
		bsr	clrscr
		ldd	#dirta
		std	enda
		ldd	#dirtb
		std	endb
		clr	page
		lda	PIA1+2		; VDG: גרפיקה, GM = 6 (128x192, 4 צבעים), ערכת צבעים 0
		anda	#7
		ora	#$e0
		sta	PIA1+2
		sta	SAM		; SAM: מצב 6 (V0=0, V1=1, V2=1)
		sta	SAM+3
		sta	SAM+5
		lda	#SCRB/512
		bra	setf
clrscr		ldd	#0
		ldy	#GROUND*16
1		std	,x++
		leay	-1,y
		bne	1B
		ldd	#$aaaa		; כחול
		ldy	#(192-GROUND)*16
2		std	,x++
		leay	-1,y
		bne	2B
		rts

; textmode: מסך הטקסט, ריק
textmode	ldx	#TEXT
		ldd	#$6060
1		std	,x++
		cmpx	#TEXT+512
		bne	1B
		lda	PIA1+2
		anda	#7
		sta	PIA1+2
		sta	SAM
		sta	SAM+2
		sta	SAM+4
		lda	#TEXT/512
; setf: כתובת המסך חלקי 512 (ב-A) לשבעת הביטים של ה-SAM
setf		ldx	#SAM+6
		ldb	#7
1		lsra
		bcc	2F
		sta	1,x
		bra	3F
2		sta	,x
3		leax	2,x
		decb
		bne	1B
		rts

; flip: הדף שציירנו עולה למסך, והשני נהיה האחורי
flip		lda	back
		lsra
		bsr	setf
		lda	page
		eora	#1
		sta	page
		rts

; ---------- טקסט ----------
; prtall: רשומות של מקום במסך (2 בתים; ביט 15 = הפוך), ואז תווים עד 0. $FFFF = סוף.
; פס: מקום ואז $FE = שורה שלמה של ריבועי צבע
prtall		ldd	,x++
		cmpd	#$ffff
		beq	9F
		clr	inv
		bita	#$80
		beq	1F
		inc	inv
		anda	#$7f
1		addd	#TEXT
		tfr	d,u
2		lda	,x+
		beq	prtall
		cmpa	#$fe
		beq	3F
		bsr	chout
		bra	2B
3		ldd	#$bf9f		; אדום, צהוב
		ldy	#16
4		std	,u++
		leay	-1,y
		bne	4B
		bra	2B
9		rts

; chout: תו ASCII ב-A למסך ב-U, כמו שה-VDG מציג: רגיל (כהה על ירוק) או הפוך
chout		tsta
		bmi	3F
		cmpa	#$40
		bhs	1F
		tst	inv
		bne	3F
		adda	#$40
		bra	3F
1		tst	inv
		beq	3F
		suba	#$40
3		sta	,u+
		rts

; prtnum: D כמספר עשרוני, למסך ב-U
prtnum		bsr	todec
		ldx	#digs
		clr	inv
1		lda	,x+
		adda	#'0
		bsr	chout
		dec	ndig
		bne	1B
		rts

; todec: D לספרות (0-9) ב-digs, בלי אפסים מובילים. ndig = כמה
todec		std	num
		ldx	#digs
		ldy	#pow10
1		clr	cnt
2		ldd	num
		subd	,y
		bcs	3F
		std	num
		inc	cnt
		bra	2B
3		lda	cnt
		bne	4F
		cmpx	#digs
		bne	4F
		cmpy	#pow10+8	; גם 0 צריך ספרה אחת
		bne	5F
4		sta	,x+
5		leay	2,y
		cmpy	#pow10+10
		bne	1B
		tfr	x,d
		subd	#digs
		stb	ndig
		rts
pow10		fdb	10000,1000,100,10,1

; ---------- קלט ----------
; keys: החיצים והרווח (שורה 5 במטריצה: ← עמודה 5, → 6, רווח 7), כפתורי הג'ויסטיק (ביטים 0-1 כשאף
; עמודה לא נסרקת), ובמצב ג'ויסטיק גם הציר: משווים את המוט הימני ל-16 ול-48 (מתוך 63) דרך ה-DAC
keys		lda	#$fb		; BREAK (שורה 6, עמודה 2): כמו לחיצה על RESET
		sta	PIA0+2
		lda	PIA0
		anda	#$40
		bne	keys1
		clr	PIA1
		jmp	[$fffe]
keys1		clr	kleft
		clr	kright
		clr	kfire
		clr	kjfire
		lda	#$df
		bsr	krow5
		bne	1F
		inc	kleft
1		lda	#$bf
		bsr	krow5
		bne	2F
		inc	kright
2		lda	#$7f
		bsr	krow5
		bne	3F
		inc	kfire
3		lda	#$ff
		sta	PIA0+2
		lda	PIA0
		coma
		anda	#3
		beq	4F
		inc	kjfire
4		tst	joymode
		beq	9F
		lda	#16*4
		sta	PIA1
		bsr	settle
		lda	PIA0		; ביט 7: המוט מעל ה-DAC
		bmi	5F
		inc	kleft
5		lda	#48*4
		sta	PIA1
		bsr	settle
		lda	PIA0
		bpl	9F
		inc	kright
9		rts
krow5		sta	PIA0+2
		lda	PIA0
		anda	#$20
settle		rts

; ---------- זמן וצליל ----------
; vwait: מחכה לתחילת התמונה הבאה (FS, דגל בביט 7 של $FF03). בינתיים מנגן: כל sndper סיבובים
; הופכים את ה-DAC (צליל) או כותבים בו מספר אקראי (רעש). בכל פריים הגובה זז ב-sndsld
vwait		tst	sndon
		beq	5F
1		lda	PIA0+3
		bmi	6F
		dec	sndcnt
		bne	1B
		lda	sndper
		sta	sndcnt
		tst	sndnoi
		bne	2F
		lda	snddac
		eora	#$fc
		sta	snddac
		sta	PIA1
		bra	1B
2		bsr	rnd
		anda	#$fc
		sta	PIA1
		bra	1B
5		lda	PIA0+3
		bpl	5B
6		lda	PIA0+2		; מנקה את הדגל
		inc	frame
		tst	sndon
		beq	9F
		dec	sndon
		lda	sndper
		adda	sndsld
		tst	sndsld
		bmi	7F
		bcc	8F
		lda	#255
		bra	8F
7		bcs	8F
		lda	#4
8		cmpa	#4
		bhs	81F
		lda	#4
81		sta	sndper
9		rts

; snd: צליל לפי X: גובה (סיבובים לחצי גל), פריימים, שינוי לכל פריים, רעש?
snd		ldd	,x
		sta	sndper
		sta	sndcnt
		stb	sndon
		ldd	2,x
		sta	sndsld
		stb	sndnoi
		rts
s_start		fcb	56,4,-7,0	; 440 עד 880
s_fire		fcb	6,15,0,1	; רעש
s_splat		fcb	137,10,11,0	; 180 עד 60
s_over		fcb	75,25,7,0	; 330 עד 80

; rnd: מספר אקראי ב-A (LFSR של 16 ביט)
rnd		lsr	seed
		ror	seed+1
		bcc	1F
		lda	seed
		eora	#$b4
		sta	seed
1		lda	seed+1
		rts

; ---------- המסכים של הטקסט ----------
t_title		fdb	0*32
		fcb	$fe,0
		fdb	$8000+2*32+10
		fcc	"DRAGON EGGS"
		fcb	0
		fdb	4*32+8
		fcc	"CATCH THE EGGS."
		fcb	0
		fdb	5*32+5
		fcc	"DO NOT CATCH THE FIRE!"
		fcb	0
		fdb	7*32+6
		fcc	"KEYBOARD: ARROW KEYS"
		fcb	0
		fdb	8*32+6
		fcc	"JOYSTICK: RIGHT PORT"
		fcb	0
		fdb	10*32+5
		fcc	"SPACE = PLAY WITH KEYS"
		fcb	0
		fdb	11*32+3
		fcc	"FIRE  = PLAY WITH JOYSTICK"
		fcb	0
		fdb	14*32+6
		fcc	"(C) 2026 GONEN YAROM"
		fcb	0
		fdb	15*32
		fcb	$fe,0
		fdb	$ffff
t_high		fdb	13*32+9
		fcc	"HIGH SCORE "
		fcb	0
		fdb	$ffff
t_over		fdb	0*32
		fcb	$fe,0
		fdb	$8000+4*32+10
		fcc	" GAME OVER "
		fcb	0
		fdb	12*32+2
		fcc	"SPACE OR FIRE TO PLAY AGAIN"
		fcb	0
		fdb	15*32
		fcb	$fe,0
		fdb	7*32+11
		fcc	"SCORE "
		fcb	0
		fdb	$ffff
t_newhi		fdb	9*32+8
		fcc	"NEW HIGH SCORE!"
		fcb	0
		fdb	$ffff
t_high2		fdb	9*32+10
		fcc	"HIGH "
		fcb	0
		fdb	$ffff

		include	"gfx.s"

; ---------- משתנים ----------
high		rmb	2
score		rmb	2
lives		rmb	1
newhi		rmb	1
lvl		rmb	1
drx		rmb	2
drdir		rmb	1
dropin		rmb	1
basx		rmb	2
hurt		rmb	1
frame		rmb	1
tmp		rmb	2
tx		rmb	1
seed		rmb	2
joymode		rmb	1
kleft		rmb	1
kright		rmb	1
kfire		rmb	1
kjfire		rmb	1
sndon		rmb	1
sndper		rmb	1
sndcnt		rmb	1
sndsld		rmb	1
sndnoi		rmb	1
snddac		rmb	1
inv		rmb	1
num		rmb	2
cnt		rmb	1
digs		rmb	5
ndig		rmb	1
page		rmb	1
back		rmb	2
dstart		rmb	2
dend		rmb	2
dptr		rmb	2
enda		rmb	2
endb		rmb	2
bw		rmb	1
rows		rmb	1
skip		rmb	1
items		rmb	NITEMS*ISIZE
splats		rmb	NSPLAT*2
dirta		rmb	32*4
dirtb		rmb	32*4
