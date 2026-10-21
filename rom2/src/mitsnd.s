; Dragon 1982 BASIC — שלב 3, חלק 4: צליל (SOUND, AUDIO, PLAY).
; הכול לפי הקורא: docs/DRAGON-SPEC-SOUND.md (עובדות בלבד, בלי קוד). נכתב מאפס.

SNDFRQ		equ	$8c		; SOUND: הטון האחרון (קורא 0.1)
SNDTMR		equ	$8d		; 2 בתים: כמה שדות נשארו (השעון מוריד)
PSTEP		equ	$d5		; PLAY: 2 בתים, כמה להוריד בכל שדה (אורך × קצב)
OCTAVE		equ	$de		; PLAY: האוקטבה פחות 1 (0-4)
VOLHI		equ	$df		; PLAY: הערך הגבוה ל-DAC
VOLLO		equ	$e0		; PLAY: הערך הנמוך
NOTELN		equ	$e1		; PLAY: L
TEMPO		equ	$e2		; PLAY: T
PLYTMR		equ	$e3		; PLAY: 2 בתים, הספירה של התו (0 = אין תו)
DOTVAL		equ	$e5		; PLAY: מספר הנקודות אחרי L

; ---------- עזרים (קורא 4) ----------
; sndsel: A = מקור הצליל (0 = DAC, 1 = קלטת). ביט 0 ל-SEL1 ($FF01 ביט 3) קודם, ואחריו ביט 1 ל-SEL2
; ($FF03 ביט 3). כל כתיבה משנה רק את ביט 3
sndsel		ldx	#PIA0+1
		bsr	1F
		ldx	#PIA0+3
1		ldb	,x
		andb	#$f7
		lsra
		bcc	2F
		orb	#8
2		stb	,x
		rts
; sndon / sndoff: ביט 3 של $FF23 (הצליל לטלוויזיה). B משתנה
sndon		ldb	PIA1+3
		orb	#8
		bra	1F
sndoff		ldb	PIA1+3
		andb	#$f7
1		stb	PIA1+3
		rts

; evnzb: ביטוי → B בין 1 ל-255. שלילי, 0 או מעל 255: ?FC. השבר נחתך (קורא 1.1)
evnzb		lbsr	evbyte
		tstb
		beq	pfc
		rts

; ---------- SOUND טון,משך (קורא 1) ----------
sound_st	bsr	evnzb
		stb	SNDFRQ		; נשמר מיד, גם אם המשך שגוי
		lbsr	chkcom
		bsr	evnzb
; sound2: כניסה שנייה (קורא 1.6): B = המשך, הטון כבר ב-$8C
sound2		clra
		lslb			; 4 שדות לכל יחידה
		rola
		lslb
		rola
		std	SNDTMR
		lda	PIA0+3		; פסיקת השדה פתוחה
		ora	#1
		sta	PIA0+3
		clra			; DAC
		bsr	sndsel
		bsr	sndon
; הגל: מרכז, למעלה, מרכז, למטה. בין כתיבה לכתיבה 23+5N מחזורים (N = 256 פחות הטון), ואחרי הכתיבה
; התחתונה 31+5N, כולל בדיקת הזמן. סך הכול 100+20N (קורא 1.3)
1		lda	#$7c
		bsr	sseg
		lda	#$fc
		bsr	sseg
		lda	#$7c
		bsr	sseg
		clra
		bsr	sseg
		ldd	SNDTMR
		bne	1B
		bra	sndoff		; הבוררים נשארים על DAC, ו-$FF20 על 0
sseg		sta	PIA1
		ldb	SNDFRQ
1		incb
		bne	1B
		rts

; ---------- AUDIO ON / OFF (קורא 3) ----------
audio_st	pshs	a		; המילה שאחרי AUDIO נקראת קודם
		jsr	<chrget
		puls	a
		cmpa	#$c2		; OFF: רק מכבים. הבוררים לא משתנים
		beq	sndoff
		cmpa	#$88		; ON
		lbne	err_sn
		lda	#1		; כניסת הקלטת
; snds: sndsel ואז sndon
snds		bsr	sndsel
		bra	sndon

; ---------- PLAY מחרוזת (קורא 2, 9) ----------
; plyini: ברירות המחדל, בהדלקה ובכל RUN (קורא 0.2): O3 (נשמר 2), עוצמה $B8/$44, L4, T2, בלי נקודות
plyini		ldd	#$4404
		std	VOLLO
		ldd	#$02b8
		std	OCTAVE
		sta	TEMPO		; A = 2
		clr	DOTVAL
		rts

pfc		lbra	err_fc
; המחרוזות המקוננות (X) במחסנית: [אורך][כתובת]. הסמן בתחתית: אורך 1, כתובת 0
play_st		ldx	#0
		lda	#1
		pshs	a,x
		lbsr	frmevl
		clra			; DAC והצליל דולק, עוד לפני בדיקת הסוג
		bsr	snds
		lbsr	frestr		; לא מחרוזת: ?TM
		sta	DLEN
		stx	DPTR
ploop		lbsr	dget
		bcc	1F
		puls	a,x		; המחרוזת נגמרה: חוזרים לחיצונית
		sta	DLEN
		stx	DPTR
		bne	ploop
		lbra	sndoff		; הסמן: סוף PLAY
1		cmpa	#';
		beq	ploop
		cmpa	#''
		beq	ploop
		cmpa	#'O
		bne	2F
		ldb	OCTAVE
		incb
		lbsr	parg
		decb
		cmpb	#5
		bhs	pfc
		stb	OCTAVE
		bra	ploop
2		cmpa	#'V
		bne	3F
		ldb	VOLHI		; העוצמה הנוכחית: הגבוה חלקי 4, פחות 31
		lsrb
		lsrb
		subb	#31
		lbsr	parg
		cmpb	#31
		bhi	pfc
		lslb
		lslb
		tfr	b,a		; גבוה = 126+4V, נמוך = 124-4V
		adda	#126
		negb
		addb	#124
		std	VOLHI
		bra	ploop
3		cmpa	#'L
		bne	4F
		ldb	NOTELN
		lbsr	parg
		tstb
		beq	pfc
		stb	NOTELN
		clr	DOTVAL
31		lbsr	dget		; הנקודות: רק מיד אחרי L
		bcs	ploop
		cmpa	#'.
		bne	32F
		inc	DOTVAL
		bra	31B
32		lbsr	dback
		bra	ploop
4		cmpa	#'T
		bne	5F
		ldb	TEMPO
		lbsr	parg
		tstb
		beq	pfc2
		stb	TEMPO
		bra	ploop
5		cmpa	#'P
		bne	6F
		lbsr	dval		; רק "=שם;" או ספרות
		tstb
		beq	pfc2
		ldx	VOLHI		; השתיקה: תו C בעוצמה $7C/$7C, בלי נקודות, ואחר כך חזרה
		lda	DOTVAL
		pshs	a,x
		ldx	#$7c7c
		stx	VOLHI
		clr	DOTVAL
		clra
		lbsr	pnote
		puls	a,x
		stx	VOLHI
		sta	DOTVAL
		lbra	ploop
6		cmpa	#'X
		bne	7F
		ldb	#2		; X שם; : מחרוזת אחרת. getstk של 4 בתים (שתי מילים)
		lbsr	dxstr
		lbra	ploop
pfc2		lbra	err_fc
7		cmpa	#'N		; N לפני תו: מדלגים
		bne	8F
		lbsr	dgetf
8		cmpa	#'A
		blo	9F
		cmpa	#'G
		bhi	9F
		leax	pletr-'A,pcr	; C=1 D=3 E=5 F=6 G=8 A=10 B=12
		ldb	a,x
		pshs	b
		lbsr	dget		; # או + מעלים, - מוריד. בלי מעבר אוקטבה
		bcs	83F
		cmpa	#'#
		beq	81F
		cmpa	#'+
		beq	81F
		cmpa	#'-
		beq	82F
		lbsr	dback
		bra	83F
82		dec	,s
		fcb	$8c		; cmpx: מדלג על ה-inc
81		inc	,s
83		puls	a
		bra	91F
9		lbsr	dback		; תו לפי מספר, 1-12 (כל תו אחר: ?FC)
		lbsr	dval
		tfr	b,a
91		deca
		cmpa	#11
		bhi	pfc2
		ldb	NOTELN
		bsr	pnote
		lbra	ploop
pletr		fcb	10,12,1,3,5,6,8

; parg: הארגומנט של O V L T → B. B = הערך הנוכחי. + - > < משנים אותו, אחרת "=שם;" או ספרות
parg		pshs	b
		lbsr	dgetf
		puls	b
		cmpa	#'+
		bne	1F
		incb
		beq	pfc2
		rts
1		cmpa	#'-
		bne	2F
		tstb
		beq	pfc2
		decb
		rts
2		cmpa	#'>
		bne	3F
		cmpb	#128
		bhs	pfc2
		lslb
		rts
3		cmpa	#'<
		bne	4F
		tstb
		beq	pfc2
		lsrb
		rts
4		lbsr	dback
		lbra	dval

; pnote: A = התו (0-11), B = האורך. U = המקום של כתובת החזרה: פסיקת השדה חוזרת לשם כשהתו נגמר (קורא 9)
pnote		pshs	a
		lda	TEMPO
		mul
		std	PSTEP		; כל שדה מוריד אורך × קצב
		leau	1,s
		lda	OCTAVE		; המקום בטבלה: אוקטבה × 12 + התו
		ldb	#12
		mul
		addb	,s+
		cmpb	#24
		bhs	1F
		lslb			; אוקטבות 1-2: ספירה של 16 ביט
		leay	ptab16,pcr
		leay	b,y
		bsr	pstart
		lda	#$7c
		pshs	a
2		lda	,s		; מרכז, גבוה, מרכז, נמוך: 26+8n מחזורים, ואחרי הנמוך 29+8n
		bsr	pseg16
		lda	VOLHI
		bsr	pseg16
		lda	,s
		bsr	pseg16
		lda	VOLLO
		bsr	pseg16
		bra	2B
1		leay	ptab8-24,pcr	; אוקטבות 3-5: ספירה של 8 ביט
		leay	b,y
		bsr	pstart
		lda	#$7c
		pshs	a
3		lda	,s		; 25+5m, ואחרי הנמוך 28+5m
		bsr	pseg8
		lda	VOLHI
		bsr	pseg8
		lda	,s
		bsr	pseg8
		lda	VOLLO
		bsr	pseg8
		bra	3B
; pstart: הספירה של התו: 255, או עם k נקודות (k+2, 8 ביט) × 255 חלקי 2
pstart		ldb	DOTVAL
		bne	1F
		ldd	#255
		bra	pgo
1		addb	#2
		lda	#255
		mul
		lsra
		rorb
pgo		std	PLYTMR		; מכאן התו רץ (התווית: לבדיקות)
		rts
pseg16		sta	PIA1
		ldx	,y
1		leax	-1,x
		bne	1B
		rts
pseg8		sta	PIA1
		ldb	,y
1		decb
		bne	1B
		rts
ptab16		fdb	424,400,378,356,336,317,299,282,266,251,237,223
		fdb	211,199,187,177,166,157,148,139,131,124,117,110
ptab8		fcb	166,156,147,139,131,123,116,109,103,97,91,86
		fcb	81,76,71,67,63,59,55,52,49,46,43,40
		fcb	38,35,33,31,29,27,25,24,22,20,19,18
