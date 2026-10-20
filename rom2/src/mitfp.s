; Dragon 1982 BASIC — ניסוי שלב 1ב: חשבון נקודה צפה.
; תרגום ל-6809 של שגרות החשבון של BASIC-M6502 (mit, מספרי השורות ב-rom2/mit/m6502.asm), בפורמט של 5 בתים:
; מעריך, ו-4 בתי מנטיסה שהביט העליון שלהם הוא הסימן (ספר: PRG עמ' 98-99).
; במצבר (FAC/ARG) המנטיסה "פתוחה": הביט העליון תמיד 1, והסימן בבית נפרד (mit: הערה לפני FADDH).
; הכתובות של FAC ו-ARG הן של ה-Dragon (קורא: מפרט הזיכרון, $4F-$61).
;
; Portions translated from Microsoft BASIC-M6502, Copyright (c) Microsoft Corporation, MIT License.

FACEXP		equ	$4f
FACHO		equ	$50
FACMOH		equ	$51
FACMO		equ	$52
FACLO		equ	$53
FACSGN		equ	$54
SGNFLG		equ	$55
ARGEXP		equ	$5c
ARGHO		equ	$5d
ARGMOH		equ	$5e
ARGMO		equ	$5f
ARGLO		equ	$60
ARGSGN		equ	$61
ARISGN		equ	$62
FACOV		equ	$63
RESHO		equ	$13		; תוצאת הכפל (קורא: $13-$16)
RESMOH		equ	$14
RESMO		equ	$15
RESLO		equ	$16
BITS		equ	$5b
DECCNT		equ	$45		; קורא: חופף ל-TEMPF2, כמו במקור
DPTFLG		equ	$46
TENEXP		equ	$47
EXPSGN		equ	$48
FBUFPT		equ	$64		; 2 בתים
FBUFFR		equ	$03da		; קורא: מאגר הדפסת מספר
; בלי מקבילה ידועה ב-Dragon: באזור הניסוי
OLDOV		equ	$03fd
DIVCNT		equ	$03fe
NDIG		equ	$03ff

; ---------- העברות (mit: CONUPK 5306, MOVFM 5477, MOVMF 5506, MOVFA 5528, MOVAF 5537) ----------
; conupk: המספר הארוז ב-X → ARG. ARISGN = הסימנים שונים? A = FACEXP (והדגלים שלו)
conupk		ldd	3,x
		std	ARGMO
		lda	2,x
		sta	ARGMOH
		lda	1,x
		sta	ARGSGN
		eora	FACSGN
		sta	ARISGN
		lda	1,x
		ora	#$80
		sta	ARGHO
		lda	,x
		sta	ARGEXP
		lda	FACEXP
		rts
; movfm: המספר הארוז ב-X → FAC
movfm		ldd	3,x
		std	FACMO
		lda	2,x
		sta	FACMOH
		lda	1,x
		sta	FACSGN
		ora	#$80
		sta	FACHO
		clr	FACOV
		lda	,x
		sta	FACEXP
		rts
; movmf: FAC → מספר ארוז ב-X (אחרי עיגול)
movmf		lbsr	round
		lda	FACEXP
		sta	,x
		lda	FACSGN
		ora	#$7f
		anda	FACHO
		sta	1,x
		lda	FACMOH
		sta	2,x
		ldd	FACMO
		std	3,x
		clr	FACOV
		rts
; movfa: ARG → FAC
movfa		ldd	ARGEXP
		std	FACEXP
		ldd	ARGMOH
		std	FACMOH
		lda	ARGLO
		sta	FACLO
		lda	ARGSGN
		sta	FACSGN
		clr	FACOV
		rts
; movaf: FAC → ARG (אחרי עיגול)
movaf		lbsr	round
		ldd	FACEXP
		std	ARGEXP
		ldd	FACMOH
		std	ARGMOH
		ldd	FACLO		; FACLO ו-FACSGN צמודים, כמו ARGLO ו-ARGSGN
		std	ARGLO
		clr	FACOV
		rts

; ---------- עיגול ונרמול (mit: ROUND 5550, NORMAL 5003, NEGFAC 5076) ----------
round		lda	FACEXP
		beq	9F
		lsl	FACOV
		bcc	9F
incrnd		lbsr	incfac
		bne	9F
		bra	rndshf		; C=1 עדיין (inc לא נוגע ב-C)
9		rts
rndshf		inc	FACEXP
		lbeq	err_ov
		ror	FACHO
		ror	FACMOH
		ror	FACMO
		ror	FACLO
		ror	FACOV
		rts
incfac		inc	FACLO
		bne	1F
		inc	FACMO
		bne	1F
		inc	FACMOH
		bne	1F
		inc	FACHO
1		rts
negfac		com	FACSGN
negfch		com	FACHO
		com	FACMOH
		com	FACMO
		com	FACLO
		com	FACOV
		inc	FACOV
		bne	1F
		bra	incfac
1		rts
; normal: מזיזים שמאלה עד שהביט העליון 1, ומקטינים את המעריך. יותר מדי: אפס
normal		clrb
1		lda	FACHO
		bne	3F
		lda	FACMOH		; בית שלם בבת אחת
		sta	FACHO
		lda	FACMO
		sta	FACMOH
		lda	FACLO
		sta	FACMO
		lda	FACOV
		sta	FACLO
		clr	FACOV
		addb	#8
		cmpb	#32
		bne	1B
		bra	zerofc
2		incb
		lsl	FACOV
		rol	FACLO
		rol	FACMO
		rol	FACMOH
		rol	FACHO
3		bpl	2B
		pshs	b
		lda	FACEXP
		suba	,s+
		bls	zerofc		; המעריך נגמר
		sta	FACEXP
		rts
zerofc		clra
		sta	FACEXP
		sta	FACSGN
		rts

; shiftr: מזיז את המנטיסה ב-1..4,X ימינה ב-B סיביות, דרך FACOV. ממלא מלמעלה בביט 7 של BITS
; (mit: SHIFTR/ROLSHF 5100)
shiftr		cmpb	#8
		blo	2F
		lda	4,x
		sta	FACOV
		lda	3,x
		sta	4,x
		lda	2,x
		sta	3,x
		lda	1,x
		sta	2,x
		lda	BITS
		sta	1,x
		subb	#8
		bra	shiftr
2		tstb
		beq	9F
3		lda	BITS
		lsla
		ror	1,x
		ror	2,x
		ror	3,x
		ror	4,x
		ror	FACOV
		decb
		bne	3B
9		rts

; ---------- חיבור וחיסור (mit: FADD 4944, FSUBT 4903) ----------
faddh		leax	fhalf,pcr
fadd		lbsr	conupk
		bra	faddt
fsub		lbsr	conupk
fsubt		com	FACSGN
		lda	FACSGN
		eora	ARGSGN
		sta	ARISGN
; faddt: FAC = ARG + FAC
faddt		tst	FACEXP
		lbeq	movfa		; FAC=0: התוצאה ARG
		lda	FACOV
		sta	OLDOV
		clr	BITS
		lda	ARGEXP
		beq	9F		; ARG=0: התוצאה FAC
		suba	FACEXP
		beq	3F
		blo	2F
		ldb	ARGEXP		; ARG גדול יותר: מזיזים את FAC
		stb	FACEXP
		ldb	ARGSGN
		stb	FACSGN
		clr	OLDOV
		tfr	a,b
		ldx	#FACEXP
		lbsr	shiftr
		ldu	#FACEXP		; U = המוזז (הקטן), Y = הגדול
		ldy	#ARGEXP
		bra	4F
2		nega			; FAC גדול יותר: מזיזים את ARG
		clr	FACOV
		tfr	a,b
		ldx	#ARGEXP
		lbsr	shiftr
		bra	5F
3		clr	FACOV		; בלי הזזה
5		ldu	#ARGEXP
		ldy	#FACEXP
4		tst	ARISGN
		bmi	fsubit
		lda	FACOV		; סימנים שווים: מחברים
		adda	OLDOV
		sta	FACOV
		lda	FACLO
		adca	ARGLO
		sta	FACLO
		lda	FACMO
		adca	ARGMO
		sta	FACMO
		lda	FACMOH
		adca	ARGMOH
		sta	FACMOH
		lda	FACHO
		adca	ARGHO
		sta	FACHO
		lbcs	rndshf		; גלישה: עוד סיבית אחת ימינה
9		rts
fsubit		lda	OLDOV		; סימנים שונים: הגדול פחות הקטן
		suba	FACOV
		sta	FACOV
		lda	4,y
		sbca	4,u
		sta	FACLO
		lda	3,y
		sbca	3,u
		sta	FACMO
		lda	2,y
		sbca	2,u
		sta	FACMOH
		lda	1,y
		sbca	1,u
		sta	FACHO
		lbcc	normal
		lbsr	negfac		; יצא שלילי
		lbra	normal

; ---------- כפל (mit: FMULT 5264, MULDIV 5333) ----------
fmult		lbsr	conupk
fmultt		tst	FACEXP
		beq	9F
		lbsr	muldiv
		clr	RESHO
		clr	RESMOH
		clr	RESMO
		clr	RESLO
		lda	FACOV
		bsr	mltply
		lda	FACLO
		bsr	mltply
		lda	FACMO
		bsr	mltply
		lda	FACMOH
		bsr	mltply
		lda	FACHO
		bsr	mltpl1
		lbra	movfr
9		rts
mltply		bne	mltpl1
		lda	RESLO		; בית אפס: רק הזזה של בית
		sta	FACOV
		lda	RESMO
		sta	RESLO
		lda	RESMOH
		sta	RESMO
		lda	RESHO
		sta	RESMOH
		clr	RESHO
		rts
mltpl1		lsra
		ora	#$80		; סמן: הלולאה נגמרת כשהוא יוצא
1		bcc	2F
		pshs	a
		lda	RESLO
		adda	ARGLO
		sta	RESLO
		lda	RESMO
		adca	ARGMO
		sta	RESMO
		lda	RESMOH
		adca	ARGMOH
		sta	RESMOH
		lda	RESHO
		adca	ARGHO
		sta	RESHO
		puls	a
2		ror	RESHO
		ror	RESMOH
		ror	RESMO
		ror	RESLO
		ror	FACOV
		lsra
		bne	1B
		rts
; muldiv: המעריך של מכפלה. קטן מדי: אפס (ויציאה גם מהשגרה שקראה). גדול מדי: ?OV
muldiv		lda	ARGEXP
		beq	8F
		ldb	FACEXP
		clra
		pshs	d
		ldb	ARGEXP
		addd	,s++
		subd	#128
		ble	8F
		cmpd	#255
		lbgt	err_ov
		stb	FACEXP
		lda	ARISGN
		sta	FACSGN
		rts
8		leas	2,s
		lbra	zerofc
movfr		lda	RESHO
		sta	FACHO
		lda	RESMOH
		sta	FACMOH
		lda	RESMO
		sta	FACMO
		lda	RESLO
		sta	FACLO
		lbra	normal

; ---------- חילוק (mit: FDIVT 5393, DIVIDE 5410) ----------
fdiv		lbsr	conupk
fdivt		tst	FACEXP
		lbeq	err_dv0
		lbsr	round
		lda	ARGEXP
		bne	1F
		lbra	zerofc
1		ldb	FACEXP
		clra
		pshs	d
		ldb	ARGEXP
		subd	,s++
		addd	#128
		lble	8F
		cmpd	#255
		lbgt	err_ov
		incb
		lbeq	err_ov
		stb	FACEXP
		lda	ARISGN
		sta	FACSGN
		ldu	#RESHO
		lda	#4
		sta	DIVCNT
		lda	#1
dvcmp		pshs	a		; ARG >= FAC? אז סיבית 1
		ldd	ARGHO
		cmpd	FACHO
		bne	1F
		ldd	ARGMO
		cmpd	FACMO
1		puls	a
		bcs	2F
		orcc	#1
		bra	savq
2		andcc	#$fe
savq		pshs	cc		; C = סיבית המנה
		rola
		bcc	qshft
		tst	DIVCNT		; בית שלם של מנה
		beq	divnrm
		sta	,u+
		dec	DIVCNT
		bne	3F
		lda	#$40		; עוד שתי סיביות בלבד
		bra	qshft
3		lda	#1
qshft		puls	cc
		bcs	divsub
shfarg		lsl	ARGLO
		rol	ARGMO
		rol	ARGMOH
		rol	ARGHO
		bcs	savq
		bmi	dvcmp
		bra	savq
divsub		pshs	a
		lda	ARGLO
		suba	FACLO
		sta	ARGLO
		lda	ARGMO
		sbca	FACMO
		sta	ARGMO
		lda	ARGMOH
		sbca	FACMOH
		sta	ARGMOH
		lda	ARGHO
		sbca	FACHO
		sta	ARGHO
		puls	a
		bra	shfarg
divnrm		lsla
		lsla
		lsla
		lsla
		lsla
		lsla
		sta	FACOV
		puls	cc
		lbra	movfr
8		lbra	zerofc

; mul10 / div10 (mit: MUL10 5359, DIV10 5378)
mul10		lbsr	movaf
		lda	FACEXP
		beq	9F
		adda	#2
		lbcs	err_ov
		sta	ARGEXP		; ARG = 4*FAC
		clr	ARISGN
		lbsr	faddt		; 5*FAC
		inc	FACEXP		; 10*FAC
		lbeq	err_ov
9		rts
div10		lbsr	movaf
		leax	tenzc,pcr
		clr	ARISGN
		lbsr	movfm
		lbra	fdivt

; ---------- סימן, השוואה, שלמים (mit: SIGN 5562, FLOAT 5575, FCOMP 5602, QINT 5644, INT 5673, AYINT 3804) ----------
sign		lda	FACEXP
		beq	9F
fcsign		lda	FACSGN
fcomps		rola
		lda	#$ff
		bcs	9F
		lda	#1
9		tsta
		rts
; float: המספר עם הסימן ב-A → FAC.  givd: D (עם סימן) → FAC.  givu: D בלי סימן
float		sta	FACHO
		clr	FACMOH
		ldb	#$88
		bra	floats
givu		std	FACHO
		ldb	#$90
		clr	FACMO
		clr	FACLO
		stb	FACEXP
		clr	FACOV
		clr	FACSGN
		lbra	normal
givd		std	FACHO
		ldb	#$90
floats		clr	FACMO
		clr	FACLO
		stb	FACEXP
		clr	FACOV
		clr	FACSGN
		tst	FACHO
		lbpl	normal
		lbsr	negfac
		lbra	normal
; fcomp: A = 1 אם FAC גדול מהמספר ב-X, 0 אם שווים, $FF אם קטן
fcomp		lda	,x
		beq	sign
		lda	1,x
		eora	FACSGN
		bmi	fcsign
		lda	,x
		cmpa	FACEXP
		bne	1F
		lda	1,x
		ora	#$80
		cmpa	FACHO
		bne	1F
		lda	2,x
		cmpa	FACMOH
		bne	1F
		lda	3,x
		cmpa	FACMO
		bne	1F
		lda	#$7f
		cmpa	FACOV		; C=1 אם FACOV מעגל למעלה
		lda	4,x
		sbca	FACLO
		beq	9F
1		lda	FACSGN
		bcs	fcomps		; המספר בזיכרון קטן יותר
		coma
		bra	fcomps
9		rts
; qint: FAC → מספר שלם של 32 ביט עם סימן ב-FACHO..FACLO (מעוגל כלפי מטה)
qint		lda	FACEXP
		beq	clrfac
		ldb	#160
		subb	FACEXP
		clr	BITS
		tst	FACSGN
		bpl	1F
		com	BITS
		pshs	b
		lbsr	negfch
		puls	b
1		ldx	#FACEXP
		lbsr	shiftr
		clr	BITS
		rts
clrfac		clr	FACHO
		clr	FACMOH
		clr	FACMO
		clr	FACLO
		rts
; fint: INT
fint		lda	FACEXP
		cmpa	#160
		bhs	9F
		lda	FACSGN
		pshs	a
		bsr	qint
		ldb	FACLO		; הבית הנמוך: הזוגיות, בשביל ^ (mit: INTEGR)
		stb	INTEGR
		clr	FACOV
		lda	#160
		sta	FACEXP
		clr	FACSGN
		puls	a
		tsta
		lbpl	normal
		lbsr	negfac
		lbra	normal
9		rts
; ayint: בין -32768 ל-32767, אחרת ?FC. התוצאה בשני הבתים FACMO:FACLO
ayint		lda	FACEXP
		cmpa	#144
		blo	qint
		leax	n32768,pcr
		lbsr	fcomp
		lbne	err_fc
		bra	qint
negop		lda	FACEXP
		beq	1F
		com	FACSGN
1		rts

; ---------- קריאת מספר מהטקסט (mit: FIN 5704) ----------
; בכניסה: TXTPTR על התו הראשון. ביציאה: FAC, ו-TXTPTR אחרי המספר
fin		clr	FACEXP
		clr	FACSGN
		clr	FACOV
		clr	DECCNT
		clr	DPTFLG
		clr	TENEXP
		clr	EXPSGN
		clr	SGNFLG
		lbsr	chrgot
		cmpa	#'-		; סימן בהתחלה: רק בקלט וב-DATA (בביטוי הוא טוקן) (mit: FIN)
		beq	1F
		cmpa	#$c4
		bne	2F
1		com	SGNFLG
		bra	3F
2		cmpa	#'+
		beq	3F
		cmpa	#$c3
		bne	fin_lp0
3		lbsr	chrget
fin_lp0		lbsr	chrgot
fin_lp		bcc	fin_dig		; ספרה
		cmpa	#'.
		bne	fin_e
		tst	DPTFLG
		bne	fin_end		; נקודה שנייה: סוף
		com	DPTFLG
		lbsr	chrget
		bra	fin_lp
fin_dig		tst	DPTFLG
		beq	1F
		inc	DECCNT
1		pshs	a
		lbsr	mul10
		puls	a
		suba	#'0
		lbsr	finlog
		lbsr	chrget
		bra	fin_lp
fin_e		cmpa	#'E
		bne	fin_end
		lbsr	chrget
		bcc	fin_ed		; ספרה
		cmpa	#$c4		; - (טוקן)
		beq	1F
		cmpa	#'-
		beq	1F
		cmpa	#$c3		; + (טוקן)
		beq	2F
		cmpa	#'+
		beq	2F
		bra	fin_end
1		com	EXPSGN
2		lbsr	chrget
		bcs	fin_end
fin_ed		ldb	TENEXP		; המעריך כפול 10 ועוד הספרה
		cmpb	#10
		blo	3F
		tst	EXPSGN
		lbeq	err_ov
		ldb	#100
		bra	4F
3		lda	#10
		mul
		lda	[TXTPTR]
		suba	#'0
		pshs	a
		addb	,s+
4		stb	TENEXP
		lbsr	chrget
		bcc	fin_ed
fin_end		lda	TENEXP
		tst	EXPSGN
		beq	5F
		nega
5		suba	DECCNT
		beq	8F
		bpl	7F
6		pshs	a
		lbsr	div10
		puls	a
		inca
		bne	6B
		bra	8F
7		pshs	a
		lbsr	mul10
		puls	a
		deca
		bne	7B
8		tst	SGNFLG
		lbne	negop
		rts
; finlog: FAC = FAC + הספרה ב-A
finlog		pshs	a
		lbsr	movaf
		puls	a
		lbsr	float
		lda	ARGSGN
		eora	FACSGN
		sta	ARISGN
		lbra	faddt

; ---------- הדפסת מספר (mit: FOUT 5852) ----------
; FAC → טקסט ב-FBUFFR (מסתיים ב-0), עם רווח או מינוס בהתחלה
fout		ldy	#FBUFFR
		lda	#$20
		tst	FACSGN
		bpl	1F
		lda	#'-
1		sta	,y+
		clr	FACSGN
		sty	FBUFPT
		lda	FACEXP
		bne	2F
		lda	#'0		; אפס
		sta	,y+
		clr	,y
		rts
2		clra
		ldb	FACEXP
		cmpb	#$80
		beq	3F
		bhi	4F
3		leax	nzmil,pcr	; קטן מ-1: כפול 10^9
		lbsr	fmult
		lda	#-9
4		sta	DECCNT
fout4		leax	nz9999,pcr
		lbsr	fcomp
		beq	bigges
		bpl	fout9		; גדול מדי: חלקי 10
fout3		leax	nz0999,pcr
		lbsr	fcomp
		beq	fout38
		bpl	fout5
fout38		lbsr	mul10
		dec	DECCNT
		bra	fout3
fout9		lbsr	div10
		inc	DECCNT
		bra	fout4
fout5		lbsr	faddh
bigges		lbsr	qint
		ldb	#1		; ספרות לפני הנקודה
		lda	DECCNT
		adda	#10
		bmi	5F		; קטן מ-.01 בערך: כתיב E
		cmpa	#11		; mit: 3*ADDPRC+10 בבסיס 8 = 11
		bhs	5F		; גדול מ-999999999: כתיב E
		deca
		tfr	a,b
		lda	#2
5		suba	#2
		sta	TENEXP
		stb	DECCNT
		ldy	FBUFPT
		tstb
		beq	6F
		bpl	7F
6		lda	#'.		; מספר קטן מ-1: נקודה לפני הספרות
		sta	,y+
		tstb
		beq	7F
		lda	#'0
		sta	,y+
7		leax	foutbl,pcr	; תשע הספרות של המספר השלם
		lda	#9
		sta	NDIG
8		clrb
9		lda	FACLO		; כמה פעמים אפשר להחסיר את החזקה
		suba	3,x
		pshs	a
		lda	FACMO
		sbca	2,x
		pshs	a
		lda	FACMOH
		sbca	1,x
		pshs	a
		lda	FACHO
		sbca	,x
		bcs	10F
		sta	FACHO
		puls	a
		sta	FACMOH
		puls	a
		sta	FACMO
		puls	a
		sta	FACLO
		incb
		bra	9B
10		leas	3,s
		addb	#'0
		stb	,y+
		dec	DECCNT
		bne	11F
		lda	#'.
		sta	,y+
11		leax	4,x
		dec	NDIG
		bne	8B
12		lda	,-y		; אפסים בסוף לא מוצגים, וגם נקודה שנשארה לבד
		cmpa	#'0
		beq	12B
		cmpa	#'.
		beq	13F
		leay	1,y
13		lda	TENEXP
		beq	15F
		ldb	#'E
		stb	,y+
		ldb	#'+
		tsta
		bpl	14F
		nega
		ldb	#'-
14		stb	,y+
		ldb	#'0-1
16		incb
		suba	#10
		bcc	16B
		adda	#'0+10
		stb	,y+
		sta	,y+
15		clr	,y
		rts

; ---------- קבועים ----------
fone		fcb	$81,$00,$00,$00,$00	; 1
fhalf		fcb	$80,$00,$00,$00,$00	; 0.5
tenzc		fcb	$84,$20,$00,$00,$00	; 10
nzmil		fcb	$9e,$6e,$6b,$28,$00	; 10^9            (mit: NZMIL)
nz9999		fcb	$9e,$6e,$6b,$27,$fd	; 999999999.499   (mit: NZ9999)
nz0999		fcb	$9b,$3e,$bc,$1f,$fd	; 99999999.9499   (mit: NZ0999)
n32768		fcb	$90,$80,$00,$00,$00	; -32768
foutbl		fdb	$05f5,$e100		; 10^8 ... 1
		fdb	$0098,$9680
		fdb	$000f,$4240
		fdb	$0001,$86a0
		fdb	$0000,$2710
		fdb	$0000,$03e8
		fdb	$0000,$0064
		fdb	$0000,$000a
		fdb	$0000,$0001
