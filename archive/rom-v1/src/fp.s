; Dragon 1982 BASIC: חבילת המספרים (נקודה צפה)
; הפורמט והאלגוריתמים לפי BASIC-M6502 של Microsoft (רישיון MIT, ראו rom/LICENSE-MSBASIC):
; מעריך עם היסט 128 (0 = אפס), מנטיסה של 32 ביט שהביט העליון שלה תמיד 1, והסימן בנפרד.
; זה אותו פורמט של 5 בתים שבו ה-Dragon שומר מספרים. הקוד עצמו נכתב מחדש ל-6809.
;
; שני "אוגרים" בזיכרון: FAC (הצובר) ו-ARG (הארגומנט). כל אחד: מעריך, 4 בתי מנטיסה, סימן (0 או $FF), ובית עיגול.
; פעולה על שני מספרים: ARG <פעולה> FAC, והתוצאה ב-FAC. השגרות שומרות על X (מצביע הטקסט).

FACEXP		equ	$40
FACM		equ	$41		; 4 בתים, $41-$44
FACSGN		equ	$45
FACOV		equ	$46		; בית העיגול (מתחת למנטיסה)
ARGEXP		equ	$48
ARGM		equ	$49
ARGSGN		equ	$4d
ARGOV		equ	$4e
FPT		equ	$50		; 16 בתים זמניים ($50-$5F)
DEXP		equ	$60		; מעריך עשרוני (FOUT, FIN)
DPT		equ	$61		; FIN: ספרות אחרי הנקודה / יש נקודה
QN		equ	$62		; מספר שלם של 32 ביט ($62-$65)

; ---------- העתקות ----------
; fac2arg: ARG = FAC
fac2arg		pshs	d
		ldd	FACEXP
		std	ARGEXP
		ldd	FACEXP+2
		std	ARGEXP+2
		ldd	FACEXP+4
		std	ARGEXP+4
		puls	d,pc
; arg2fac: FAC = ARG
arg2fac		pshs	d
		ldd	ARGEXP
		std	FACEXP
		ldd	ARGEXP+2
		std	FACEXP+2
		ldd	ARGEXP+4
		std	FACEXP+4
		clr	FACOV
		puls	d,pc
; ldfac / ldarg: טוענים מספר ארוז (5 בתים) מהכתובת ב-U
ldfac		pshs	d
		lda	,u
		sta	FACEXP
		ldd	1,u
		sta	FACSGN
		ora	#$80
		std	FACM
		ldd	3,u
		std	FACM+2
		clr	FACOV
		lda	FACSGN
		anda	#$80
		beq	1F
		lda	#$ff
1		sta	FACSGN
		puls	d,pc
ldarg		pshs	d
		lda	,u
		sta	ARGEXP
		ldd	1,u
		sta	ARGSGN
		ora	#$80
		std	ARGM
		ldd	3,u
		std	ARGM+2
		lda	ARGSGN
		anda	#$80
		beq	1F
		lda	#$ff
1		sta	ARGSGN
		puls	d,pc

; ---------- נרמול ועיגול ----------
; fnorm: מזיזים שמאלה עד שהביט העליון 1 (כולל בית העיגול). מנטיסה אפס = המספר אפס
fnorm		pshs	d
fn_byte		lda	FACM
		bne	fn_bit
		; בית שלם אפס: מזיזים 8 ביטים בבת אחת
		lda	FACEXP
		suba	#8
		bls	fn_zero
		sta	FACEXP
		ldd	FACM+1
		std	FACM
		lda	FACM+3
		ldb	FACOV
		std	FACM+2
		clr	FACOV
		ldd	FACM
		bne	fn_byte
		ldd	FACM+2
		bne	fn_byte
		bra	fn_zero
fn_bit		tst	FACM
		bmi	fn_done
		lsl	FACOV
		rol	FACM+3
		rol	FACM+2
		rol	FACM+1
		rol	FACM
		dec	FACEXP
		bne	fn_bit
fn_zero		clr	FACEXP
		clr	FACSGN
fn_done		puls	d,pc

; fround: מעגלים לפי בית העיגול
fround		pshs	d
		tst	FACEXP
		beq	2F
		lda	FACOV
		bpl	2F
		ldd	FACM+2
		addd	#1
		std	FACM+2
		bcc	2F
		ldd	FACM
		addd	#1
		std	FACM
		bcc	2F
		lda	#$80		; המנטיסה גלשה: 1.000... ומעריך +1
		sta	FACM
		inc	FACEXP
		lbeq	err_ov
2		clr	FACOV
		puls	d,pc

; ---------- חיבור וחיסור ----------
; fsub: FAC = ARG - FAC
fsub		com	FACSGN
; fadd: FAC = ARG + FAC
fadd		tst	ARGEXP
		bne	1F
		rts
1		tst	FACEXP
		bne	2F
		lbra	arg2fac
2		pshs	d,x
		clr	FACOV
		clr	ARGOV
		lda	FACEXP
		cmpa	ARGEXP
		bhs	fa_noswap
		; ב-FAC תמיד המספר עם המעריך הגדול
		ldx	#FACEXP
		ldb	#6
3		lda	,x
		pshs	a
		lda	8,x
		sta	,x+
		puls	a
		sta	7,x
		decb
		bne	3B
fa_noswap	lda	FACEXP
		suba	ARGEXP		; כמה להזיז את ARG ימינה
		cmpa	#40
		lbhs	fa_round	; ARG קטן מדי, לא משנה כלום
4		cmpa	#8
		blo	5F
		ldb	ARGM+3
		stb	ARGOV
		ldb	ARGM+2
		stb	ARGM+3
		ldb	ARGM+1
		stb	ARGM+2
		ldb	ARGM
		stb	ARGM+1
		clr	ARGM
		suba	#8
		bra	4B
5		tsta
		beq	fa_aligned
6		lsr	ARGM
		ror	ARGM+1
		ror	ARGM+2
		ror	ARGM+3
		ror	ARGOV
		deca
		bne	6B
fa_aligned	lda	FACSGN
		eora	ARGSGN
		bmi	fa_sub
		; אותו סימן: מחברים
		lda	FACOV
		adda	ARGOV
		sta	FACOV
		lda	FACM+3
		adca	ARGM+3
		sta	FACM+3
		lda	FACM+2
		adca	ARGM+2
		sta	FACM+2
		lda	FACM+1
		adca	ARGM+1
		sta	FACM+1
		lda	FACM
		adca	ARGM
		sta	FACM
		bcc	fa_round
		ror	FACM
		ror	FACM+1
		ror	FACM+2
		ror	FACM+3
		ror	FACOV
		inc	FACEXP
		lbeq	err_ov
		bra	fa_round
fa_sub		; סימנים שונים: FAC - ARG (בערך מוחלט)
		lda	FACOV
		suba	ARGOV
		sta	FACOV
		lda	FACM+3
		sbca	ARGM+3
		sta	FACM+3
		lda	FACM+2
		sbca	ARGM+2
		sta	FACM+2
		lda	FACM+1
		sbca	ARGM+1
		sta	FACM+1
		lda	FACM
		sbca	ARGM
		sta	FACM
		bcc	fa_norm
		; התוצאה שלילית: הופכים את המנטיסה ואת הסימן
		com	FACM
		com	FACM+1
		com	FACM+2
		com	FACM+3
		com	FACOV
		inc	FACOV
		bne	7F
		inc	FACM+3
		bne	7F
		inc	FACM+2
		bne	7F
		inc	FACM+1
		bne	7F
		inc	FACM
7		com	FACSGN
fa_norm		lbsr	fnorm
fa_round	lbsr	fround
		puls	d,x,pc

; ---------- מספר שלם ↔ נקודה צפה ----------
; givd: FAC = המספר השלם (עם סימן) שב-D
givd		clr	FACSGN
		clr	FACOV
		clr	FACM+2
		clr	FACM+3
		tsta
		bpl	1F
		com	FACSGN
		coma
		comb
		addd	#1
1		std	FACM
		lda	#$90
		sta	FACEXP
		lbra	fnorm

; qint: FAC חיובי (קטן מ-2^32) → מספר שלם של 32 ביט ב-QN
qint		pshs	d
		ldd	FACM
		std	QN
		ldd	FACM+2
		std	QN+2
		lda	#$a0
		suba	FACEXP
		bls	2F
		cmpa	#32
		blo	1F
		clr	QN
		clr	QN+1
		clr	QN+2
		clr	QN+3
		bra	2F
1		lsr	QN
		ror	QN+1
		ror	QN+2
		ror	QN+3
		deca
		bne	1B
2		puls	d,pc

; ---------- כפל וחילוק ----------
; fmul: FAC = ARG * FAC
fmul		tst	FACEXP
		beq	9F
		tst	ARGEXP
		bne	1F
		clr	FACEXP
		clr	FACSGN
9		rts
1		pshs	d,x,y
		; המעריך: FACEXP + ARGEXP - 128
		clra
		ldb	FACEXP
		addb	ARGEXP
		adca	#0
		subd	#$80
		lble	fm_zero
		cmpd	#$ff
		lbgt	err_ov
		stb	FACEXP
		lda	FACSGN
		eora	ARGSGN
		sta	FACSGN
		; מכפלה של 32x32 ביט: 8 בתים ב-FPT. כל זוג בתים (ARG i, FAC j) נכנס במקום i+j+1
		ldx	#FPT
		ldd	#0
		std	,x
		std	2,x
		std	4,x
		std	6,x
		ldy	#3		; i: בית של ARG (3 = הנמוך)
fm_i		ldx	#3		; j: בית של FAC
fm_j		pshs	x,y
		lda	ARGM,y
		ldb	FACM,x
		mul			; D = ARG[i] * FAC[j]
		; מוסיפים במקום i+j (בייט גבוה) ו-i+j+1 (נמוך), עם העברה כלפי מעלה
		pshs	d
		tfr	y,d
		pshs	b
		tfr	x,d
		addb	,s+		; B = i+j
		ldx	#FPT
		abx			; X = FPT + i + j
		puls	d
		addb	1,x
		stb	1,x
		adca	,x
		sta	,x
		bcc	3F
2		leax	-1,x
		cmpx	#FPT
		blo	3F
		inc	,x
		beq	2B
3		puls	x,y
		leax	-1,x
		cmpx	#0
		bge	fm_j
		leay	-1,y
		cmpy	#0
		bge	fm_i
		ldd	FPT
		std	FACM
		ldd	FPT+2
		std	FACM+2
		lda	FPT+4
		sta	FACOV
		lbsr	fnorm
		lbsr	fround
		puls	d,x,y,pc
fm_zero		clr	FACEXP
		clr	FACSGN
		puls	d,x,y,pc

; fdiv: FAC = ARG / FAC
fdiv		tst	FACEXP
		lbeq	err_div0
		tst	ARGEXP
		bne	1F
		clr	FACEXP
		clr	FACSGN
		rts
1		pshs	d,x
		; המעריך: ARGEXP - FACEXP + 129 (המנה בטווח 0.5 עד 2, והביט הראשון שלה הוא השלם)
		clra
		ldb	ARGEXP
		subb	FACEXP
		sbca	#0
		addd	#$81
		lble	fd_zero
		cmpd	#$ff
		lbgt	err_ov
		pshs	b		; המעריך החדש
		lda	FACSGN
		eora	ARGSGN
		pshs	a		; הסימן החדש
		; R (המחולק, 5 בתים) ב-FPT..FPT+4; המחלק ב-FPT+5..FPT+8
		clr	FPT
		ldd	ARGM
		std	FPT+1
		ldd	ARGM+2
		std	FPT+3
		ldd	FACM
		std	FPT+5
		ldd	FACM+2
		std	FPT+7
		ldd	#0
		std	FACM
		std	FACM+2
		sta	FACOV
		ldb	#40		; 40 ביטים של מנה
fd_loop		pshs	b
		; R - המחלק, לנסיון
		lda	FPT+4
		suba	FPT+8
		sta	FPT+13
		lda	FPT+3
		sbca	FPT+7
		sta	FPT+12
		lda	FPT+2
		sbca	FPT+6
		sta	FPT+11
		lda	FPT+1
		sbca	FPT+5
		sta	FPT+10
		lda	FPT
		sbca	#0
		bcs	fd_no		; קטן מדי: ביט 0
		sta	FPT
		ldd	FPT+10
		std	FPT+1
		ldd	FPT+12
		std	FPT+3
		orcc	#1		; ביט 1
		bra	fd_shift
fd_no		andcc	#$fe
fd_shift	rol	FACOV
		rol	FACM+3
		rol	FACM+2
		rol	FACM+1
		rol	FACM
		lsl	FPT+4
		rol	FPT+3
		rol	FPT+2
		rol	FPT+1
		rol	FPT
		puls	b
		decb
		bne	fd_loop
		puls	a
		sta	FACSGN
		puls	b
		stb	FACEXP
		lbsr	fnorm
		lbsr	fround
		puls	d,x,pc
fd_zero		clr	FACEXP
		clr	FACSGN
		puls	d,x,pc

; ---------- כפל וחילוק ב-10 ----------
fmul10		tst	FACEXP
		beq	1F
		lbsr	fac2arg		; ARG = FAC
		lda	FACEXP
		adda	#2		; FAC * 4
		lbcs	err_ov
		sta	FACEXP
		lbsr	fadd		; = FAC * 5
		inc	FACEXP		; * 2
		lbeq	err_ov
1		rts
fdiv10		pshs	u
		lbsr	fac2arg
		leau	c_ten,pcr
		lbsr	ldfac
		lbsr	fdiv
		puls	u,pc

; ---------- השוואה ----------
; fcmp: משווה FAC עם ARG. מחזיר ב-A: $FF אם FAC < ARG, 0 אם שווים, 1 אם FAC > ARG
fcmp		pshs	b,x
		lda	FACEXP
		bne	1F
		lda	ARGEXP
		beq	fc_eq
		lda	ARGSGN		; FAC=0: הסימן ההפוך של ARG
		bra	fc_sgnneg
1		lda	ARGEXP
		bne	2F
		lda	FACSGN		; ARG=0: הסימן של FAC
		bra	fc_sgn
2		lda	FACSGN
		cmpa	ARGSGN
		bne	fc_sgn		; סימנים שונים: הסימן של FAC קובע
		; אותו סימן: משווים ערך מוחלט, ואם שליליים הופכים
		ldx	#0
3		lda	FACEXP,x
		cmpa	ARGEXP,x
		bne	4F
		leax	1,x
		cmpx	#5
		blo	3B
fc_eq		clra
		puls	b,x,pc
4		lda	#1
		bhi	5F
		lda	#$ff
5		tst	FACSGN
		bpl	6F
		nega
6		puls	b,x,pc
fc_sgnneg	coma
fc_sgn		tsta
		bmi	7F
		lda	#1
		puls	b,x,pc
7		lda	#$ff
		puls	b,x,pc

; ---------- קבועים (ארוזים: מעריך, ואז מנטיסה כשהביט העליון הוא הסימן) ----------
c_half		fcb	$80,$00,$00,$00,$00	; 0.5
c_ten		fcb	$84,$20,$00,$00,$00	; 10
c_1e9		fcb	$9e,$6e,$6b,$27,$fe	; 999999999.5
c_1e8		fcb	$9b,$3e,$bc,$1f,$f0	; 99999999.5

; ---------- מחרוזת → מספר ----------
; fin: קורא מספר מהטקסט ב-X (ספרות, נקודה, E), ומשאיר אותו ב-FAC. X אחרי המספר
fin		pshs	d
		clr	FACEXP
		clr	FACSGN
		clr	DEXP
		clr	DPT
fi_loop		lda	,x
		cmpa	#'.
		bne	1F
		tst	DPT
		bmi	fi_end		; נקודה שנייה: סוף המספר
		lda	#$80
		sta	DPT
		leax	1,x
		bra	fi_loop
1		cmpa	#'E
		beq	fi_exp
		suba	#'0
		bcs	fi_end
		cmpa	#9
		bhi	fi_end
		leax	1,x
		; FAC = FAC * 10 + הספרה
		pshs	a
		lbsr	fmul10
		lbsr	fac2arg
		puls	b
		clra
		lbsr	givd
		lbsr	fadd
		tst	DPT
		bpl	fi_loop
		dec	DEXP		; ספרה אחרי הנקודה
		bra	fi_loop
fi_exp		leax	1,x
		clrb			; B = המעריך שנכתב, [s] = שלילי?
		lda	,x
		clr	,-s
		cmpa	#'+
		beq	2F
		cmpa	#'-
		bne	3F
		com	,s
2		leax	1,x
3		lda	,x
		suba	#'0
		bcs	4F
		cmpa	#9
		bhi	4F
		leax	1,x
		pshs	a
		lda	#10
		mul
		addb	,s+
		bra	3B
4		tst	,s+
		beq	5F
		negb
5		addb	DEXP
		stb	DEXP
fi_end		; FAC = FAC * 10^DEXP
		ldb	DEXP
6		beq	8F
		bmi	7F
		lbsr	fmul10
		decb
		bra	6B
7		lbsr	fdiv10
		incb
		bra	6B
8		puls	d,pc

; ---------- מספר → מחרוזת ----------
; fout: כותב את FAC כטקסט ל-FBUF (מסתיים ב-0), כמו ב-BASIC: רווח או מינוס, ספרות, ו-E לגדולים/קטנים. U = FBUF
FBUF		equ	$0300
FDIG		equ	$0320		; 9 הספרות
fout		pshs	d,x,y
		ldu	#FBUF
		lda	#$20
		tst	FACSGN
		bpl	1F
		lda	#'-
1		sta	,u+
		clr	FACSGN
		tst	FACEXP
		bne	fo_scale
		lda	#'0
		sta	,u+
		lbra	fo_end
fo_scale	clr	DEXP
fo_big		pshs	u
		leau	c_1e9,pcr
		lbsr	ldarg
		puls	u
		lbsr	fcmp
		tsta
		bmi	fo_small
		lbsr	fdiv10
		inc	DEXP
		bra	fo_big
fo_small	pshs	u
		leau	c_1e8,pcr
		lbsr	ldarg
		puls	u
		lbsr	fcmp
		tsta
		bpl	fo_int
		lbsr	fmul10
		dec	DEXP
		bra	fo_small
fo_int		; מעגלים (+0.5) והופכים למספר שלם של 9 ספרות
		pshs	u
		leau	c_half,pcr
		lbsr	ldarg
		puls	u
		lbsr	fadd
		lbsr	qint
		; 9 ספרות, בחיסור חוזר של חזקות 10
		leay	pow10,pcr
		ldx	#FDIG
fo_dig		lda	#'0
		sta	,x
2		ldd	QN+2		; QN - החזקה
		subd	2,y
		pshs	d
		ldd	QN
		sbcb	1,y
		sbca	,y
		bcs	3F
		std	QN
		puls	d
		std	QN+2
		inc	,x
		bra	2B
3		leas	2,s
		leax	1,x
		leay	4,y
		cmpx	#FDIG+9
		blo	fo_dig
		; 10 ספרות בגלל העיגול (1000000000)? אז זה 1 עם מעריך גדול באחד
		lda	FDIG
		cmpa	#'9
		bls	4F
		lda	#'1
		sta	FDIG
		inc	DEXP
4		; E = DEXP + 8: החזקה של הספרה הראשונה. Y = הספרה האחרונה שאינה אפס
		ldy	#FDIG+8
5		lda	,y
		cmpa	#'0
		bne	6F
		cmpy	#FDIG
		beq	6F
		leay	-1,y
		bra	5B
6		ldb	DEXP
		addb	#8		; B = E
		bmi	fo_neg
		cmpb	#8
		bgt	fo_sci
		; 0..8: ספרות, ואם צריך נקודה וספרות אחריה
		ldx	#FDIG
7		lda	,x+
		sta	,u+
		decb
		bpl	7B
		; X אחרי החלק השלם
		leax	-1,x
		pshs	x
		cmpy	,s++
		lbls	fo_end
		lda	#'.
		sta	,u+
		leax	1,x
8		lda	,x+
		sta	,u+
		pshs	x
		leax	-1,x
		pshs	x
		cmpy	,s++
		puls	x
		bhi	8B
		bra	fo_end
fo_neg		cmpb	#-2
		blt	fo_sci
		; -1 או -2: נקודה, אפסים, ספרות
		lda	#'.
		sta	,u+
		lda	#'0
		cmpb	#-2
		bne	9F
		sta	,u+
9		ldx	#FDIG
10		lda	,x+
		sta	,u+
		pshs	x
		leax	-1,x
		pshs	x
		cmpy	,s++
		puls	x
		bhi	10B
		bra	fo_end
fo_sci		; d.ddddE+xx
		lda	FDIG
		sta	,u+
		cmpy	#FDIG
		beq	11F
		lda	#'.
		sta	,u+
		ldx	#FDIG+1
12		lda	,x+
		sta	,u+
		pshs	x
		leax	-1,x
		pshs	x
		cmpy	,s++
		puls	x
		bhi	12B
11		lda	#'E
		sta	,u+
		lda	#'+
		tstb
		bpl	13F
		lda	#'-
		negb
13		sta	,u+
		clra
		pshs	b
		ldb	#'0-1
14		incb
		lda	,s
		suba	#10
		sta	,s
		bcc	14B
		adda	#10+'0
		stb	,u+
		sta	,u+
		leas	1,s
fo_end		clr	,u
		ldu	#FBUF
		puls	d,x,y,pc

pow10		fqb	100000000,10000000,1000000,100000,10000,1000,100,10,1
