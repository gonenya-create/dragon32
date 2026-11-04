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
; (SOUND, ‏sound2, ‏snddur ו-sseg עברו ב-3.11 לכתובות של המקור, $BAA0-$BADE, ב-mitfile.s)
; ---------- מספר התקן (4.1) ---------- (עבר לכאן מ-mitfile.s ב-3.11, כדי לפנות את $BAA0-$BAF3)
; getdev: [#]ביטוי → DEVNUM. בין -32768 ל-32767 (אחרת ?FC), אחר כך בין -128 ל-127 (אחרת ?DN); נשמר,
; ורק 0, -1, -2 מותרים (אחרת ?DN; השגיאה מאפסת את DEVNUM)
getdev		cmpa	#'#
		bne	1F
		jsr	<chrget
1		lbsr	frmevl
devfac		lbsr	ayint
		ldb	FACLO
		sex
		cmpa	FACMO
		bne	8F
		stb	DEVNUM
		tstb			; 2: B עם הדגלים שלו; Z=1 בחזרה = מקובל (גם התקן של הרחבה)
		jsr	HK_DEVN
		beq	1F
		bpl	8F		; חיובי: ?DN
		cmpb	#$fe		; ‏$FE או $FF; מתחת ל-2-: ?DN
		blo	8F
1		clra			; הדגל של הקלטת: $FF רק כש-B = $FF (אז C=0)
		cmpb	#$ff
		adca	#$ff
		sta	SPCIO
9		rts
8		lbra	err_dn
; csv2b: ההמשך של CSAVEM ($991B): הכותרת, מבוא, ואז מההתחלה עד הסוף, כולל הסוף (עבר לכאן מ-mitfile.s ב-3.11)
csv2b		lbsr	wrhdr
		jsr	tleader
		puls	d,x		; D = הסוף, X = ההתחלה
		addd	#1		; כולל הסוף
		lbra	wdata
		fill	$ff,$b44f-*	;@isl
warm		nop	;@isl
		clra	;@isl
		clrb	;@isl
		std	PLYTMR	;@isl
		lda	PIA0+3	;@isl
		ora	#1	;@isl
		sta	PIA0+3	;@isl
		jmp	warm2	;@isl

; @endnofill
; ---------- AUDIO ON / OFF (קורא 3) ----------
; (3.11: החלק הראשון עבר ל-exp.s, למקום של תחילת warm, שחזרה ל-$B44F כמו במקור, כדי לפנות את $B45C)
aud_b		cmpb	#$88		; ON (המילה ב-B)
		lbne	err_sn
		lda	#1		; כניסת הקלטת
		bra	isl_b469_e	;@isl
		fill	$ff,$b469-*	;@isl
		jmp	firq	;@isl
isl_b469_e	;@isl
; snds: sndsel ואז sndon
snds		lbsr	sndsel
		bra	sndon		; קצרה (בית אחד פחות, בשביל $B4B3: 30.10)

; ---------- PLAY מחרוזת (קורא 2, 9) ----------
; (plyini עבר ל-exp.s, לפני $A000, כדי לפנות מקום לכניסה $B538: 30.10)

; (4.11, חבילה 8: PLAY סודר מחדש, כדי לפנות את $B482 להשהיה. הסמן בתחתית הוא עכשיו רק כתובת 0,
; ובסוף PLAY לא שומרים אותו ב-DLEN/DPTR. שלושה חלקים לפני $B482 נגמרים בקפיצה, כך שאף אחד לא נופל לתוכה)
pend		bra	sndoff		; הסמן: סוף PLAY
; O אוקטבה
p_oct		ldb	OCTAVE
		incb
		lbsr	parg
		decb
		cmpb	#5
		bhs	pfc
		stb	OCTAVE
		bra	ploop
; ‏$B482: השהיה. X סיבובים, ו-X חוזר 0 (קורא: חבילה 8). Junior's Revenge קורא לה ב-JSR
		jmp	dlyx	;@isl
pfc		lbra	err_fc
p_ch		cmpa	#';
		beq	ploop
		cmpa	#''
		beq	ploop
		cmpa	#'O
		beq	p_oct
		bra	p_v
; המחרוזות המקוננות (X) במחסנית: [אורך][כתובת]. הסמן בתחתית: כתובת 0
play_st		lbsr	frmevl
plyx		ldx	#0		; $ADBD נכנס כאן, כשהמחרוזת כבר ב-FPA0
		clra			; DAC והצליל דולק, עוד לפני בדיקת הסוג
		pshs	a,x
		bsr	snds
		lbsr	frestr		; לא מחרוזת: ?TM
pset		sta	DLEN
		stx	DPTR
		beq	pend		; כתובת 0: הסמן, סוף PLAY
ploop		lbsr	dget
		bcc	p_ch
		puls	a,x		; המחרוזת נגמרה: חוזרים לחיצונית
		bra	pset
; ‏$B4B3: שני בתים שתוכנות של אז בודקות כדי לדעת שהן על Dragon ולא על CoCo. Star Spores (Microdeal) קורא שם את
; המילה $2843, ואם היא שם הוא עובר למפת המקלדת של ה-Dragon (החיצים בשורה אחרת). העובדה מהקוד של המשחק עצמו (30.10).
; הם באים אחרי קפיצה, אז אף אחד לא מריץ אותם. entry-test בודק שהם במקום
		fcb	$28,$43
p_v		cmpa	#'V
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
pfc_t		beq	pfc		; (3.11: גם T ו-P קופצים לכאן, Z=1, כדי ש-pfc2 יעבור ליד parg)
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
		beq	pfc_t
		stb	TEMPO
ploop_t		bra	ploop
		fill	$ff,$b505-*	;@isl
		jmp	x_inch7	;@isl
5		cmpa	#'P
		bne	6F
		lbsr	dval		; רק "=שם;" או ספרות
		tstb
		beq	pfc_t
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
		bra	ploop_t		; (3.11: דרך הקפיצה הקרובה, בשביל $B505)
6		cmpa	#'X
		bne	7F
		ldb	#2		; X שם; : מחרוזת אחרת. getstk של 4 בתים (שתי מילים)
		lbsr	dxstr
		bra	ploop_t		; (3.11: דרך הקפיצה הקרובה, בשביל $B505)
		fill	$ff,$b538-*	;@isl
		jmp	getkey	;@isl
7		cmpa	#'N		; N לפני תו: מדלגים
		bne	8F
		lbsr	dgetf
8		cmpa	#'A
		blo	9F
		cmpa	#'G
		bra	isl_b54a_e	;@isl
		fill	$ff,$b54a-*	;@isl
		jmp	chrout	;@isl
isl_b54a_e	;@isl
		bhi	9F
		suba	#'C		; (4.11: חישוב במקום טבלה, כדי לפנות את $B58F) C=1 D=3 E=5 F=6 G=8 A=10 B=12:
		bge	84F		; k = המרחק מ-C (A ו-B: 5 ו-6), והתו = 2k+1 עד E, ‏2k מ-F
		adda	#7
84		cmpa	#3		; C=1 כש-k < 3
		rola
		pshs	a
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
		lbsr	pnote		; (3.11: lbsr, כי pnote עבר אחרי $B663)
		lbra	ploop
		fill	$ff,$b58f-*	;@isl
		jmp	putc	;@isl
pfc2		lbra	err_fc		; (3.11: עבר לכאן מלפני $B538, ליד parg: קפיצות קצרות. 4.11: אחרי $B58F)

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
		fill	$ff,$b5c6-*	;@isl
		jsr	HK_LINE	;@isl
		jmp	x_inlin	;@isl

; הסדר כאן (טבלה, שגרות, טבלה, ואחרי $B663 ההתחלה של pnote) נקבע כך ש-$B663 ייפול בדיוק על קפיצה,
; והקפיצות הקצרות עדיין מגיעות (3.11)
ptab8		fcb	166,156,147,139,131,123,116,109,103,97,91,86
		fcb	81,76,71,67,63,59,55,52,49,46,43,40
		fcb	38,35,33,31,29,27,25,24,22,20,19,18
; @nofill: לולאות מתוזמנות, לפי מחזורים. tools/islands.py לא מכניס כאן גושים
pseg8		sta	PIA1
		ldb	,y
1		decb
		bne	1B
		rts
pn8		leay	ptab8-24,pcr	; אוקטבות 3-5: ספירה של 8 ביט
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
; @endnofill
ptab16		fdb	424,400,378,356,336,317,299,282,266,251,237,223
		fdb	211,199,187,177,166,157,148,139,131,124,117,110
; @endnofill
		fill	$ff,$b663-*	;@isl
		jmp	clsone	;@isl
; pnote: A = התו (0-11), B = האורך. U = המקום של כתובת החזרה: פסיקת השדה חוזרת לשם כשהתו נגמר (קורא 9)
; @nofill
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
		lbhs	pn8		; (3.11: ארוך, pn8 לפני $B663)
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
; @endnofill
