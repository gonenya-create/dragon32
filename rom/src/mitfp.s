; Dragon 1982 BASIC — ניסוי שלב 1ב: חשבון נקודה צפה.
; תרגום ל-6809 של שגרות החשבון של BASIC-M6502 (mit, מספרי השורות ב-rom/mit/m6502.asm), בפורמט של 5 בתים:
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

; ---------- העברות (mit: CONUPK 5306, MOVFM 5477, MOVMF 5506, MOVFA 5528, MOVAF 5537) ----------
; conupk: המספר הארוז ב-X → ARG, ו-ARISGN = הסימנים שונים?
conupk		ldu	#ARGEXP
		bsr	unpk
; arisg: ARISGN = הסימן של ARG xor הסימן של FAC
arisg		lda	ARGSGN
		eora	FACSGN
		sta	ARISGN
		rts
; movfm: המספר הארוז ב-X → FAC
movfm		clr	FACOV
		ldu	#FACEXP
; unpk: המספר הארוז ב-X → המצבר ב-U (FAC או ARG: מעריך, 4 בתי מנטיסה, סימן)
unpk		ldd	1,x
		sta	5,u
		ora	#$80
		std	1,u
		ldd	3,x
		std	3,u
		lda	,x
		sta	,u
		rts
; movmf: FAC → מספר ארוז ב-X. ב-Dragon בלי עיגול כאן: כל פעולה כבר מעגלת (קורא; ב-mit מעגלים כאן)
movmf		ldd	FACMO
		std	3,x
		lda	FACSGN
		ora	#$7f
		anda	FACHO
		ldb	FACMOH
		std	1,x
		lda	FACEXP
		sta	,x
		clr	FACOV
		rts
; movfa: ARG → FAC
movfa		ldd	ARGEXP
		std	FACEXP
		ldd	ARGMOH
		std	FACMOH
		ldd	ARGLO		; ARGLO ו-ARGSGN צמודים, כמו FACLO ו-FACSGN
		std	FACLO
		clr	FACOV
		rts
; movaf: FAC → ARG. ב-Dragon בלי עיגול נוסף (קורא)
movaf		ldx	FACEXP		; דרך X: A ו-B נשמרים
		stx	ARGEXP
		ldx	FACMOH
		stx	ARGMOH
		ldx	FACLO		; FACLO ו-FACSGN צמודים, כמו ARGLO ו-ARGSGN
		stx	ARGLO
		clr	FACOV
		rts

; ---------- חיבור וחיסור (mit: FADD 4944, FSUBT 4903) ----------
faddh		leax	fhalf,pcr
fadd		bsr	conupk
		bra	faddt
fsub		bsr	conupk
fsubt		com	FACSGN
finl2		bsr	arisg
; faddt: FAC = ARG + FAC
faddt		tst	FACEXP
		beq	movfa		; FAC=0: התוצאה ARG
		clr	FACOV		; ב-Dragon הבית הנוסף הקודם לא נכנס לחיבור (קורא; ב-mit נשמר ב-OLDOV)
		clr	BITS
		lda	ARGEXP
		beq	9F		; ARG=0: התוצאה FAC
		ldx	#ARGEXP		; X = המוזז (הקטן), Y = הגדול
		ldy	#FACEXP
		suba	FACEXP
		tfr	a,b		; B = ההפרש (tfr לא נוגע בדגלים)
		bls	2F		; FAC גדול יותר או שווה: מזיזים את ARG (0 = בלי הזזה)
		lda	ARGEXP		; ARG גדול יותר: מזיזים את FAC
		sta	FACEXP
		lda	ARGSGN
		sta	FACSGN
		exg	x,y
		fcb	$21		; brn: מדלג על negb
2		negb
		bsr	shiftr
		tst	ARISGN
		bmi	fsubit
		ldd	FACMO		; סימנים שווים: מחברים (הבית הנוסף של השני אפס)
		addd	ARGMO
		std	FACMO
		ldd	FACHO
		adcb	ARGMOH
		adca	ARGHO
		std	FACHO
		lbcc	nround		; ב-Dragon החיבור מעגל בסוף (קורא)
		bsr	incexp		; גלישה: עוד סיבית אחת ימינה (C=1 נכנס למעלה). הסיבית שנפלה קובעת את
					; העיגול, והבית הנוסף לא מתאפס במסלול הזה (קורא)
		ror	FACHO
		ror	FACMOH
		ror	FACMO
		ror	FACLO
		ror	FACOV
; rnd1: עיגול לפי ביט 7 של הבית הנוסף (חצי למעלה, בערך המוחלט)
rnd1		tst	FACOV
		bpl	9F
		bsr	incfac
		bne	9F
		lda	#$80		; 1.111… + 1 = 10.000…
		sta	FACHO
; incexp: המעריך ועוד 1. גלישה: ?OV
incexp		inc	FACEXP
		beq	ovf
9		rts
ovf		lbra	err_ov
fsubit		neg	FACOV		; סימנים שונים: הגדול פחות הקטן (0 פחות הבית הנוסף של הקטן)
		ldd	3,y
		sbcb	4,x
		sbca	3,x
		std	FACMO
		ldd	1,y
		sbcb	2,x
		sbca	1,x
		std	FACHO
		rora			; C = יצא שלילי → ביט 7 של A
		bra	fltst

; shiftr: מזיז את המנטיסה ב-1..4,X ימינה ב-B סיביות, דרך FACOV. ממלא מלמעלה בביט 7 של BITS
; (mit: SHIFTR/ROLSHF 5100)
shiftr		cmpb	#8
		blo	2F
		pshs	b		; בית שלם בבת אחת
		lda	4,x
		sta	FACOV
		ldd	2,x
		std	3,x
		ldb	1,x
		lda	BITS
		std	1,x
		puls	b
		subb	#8
		bra	shiftr
2		decb
		bmi	9F
		lda	BITS
		lsla
		ror	1,x
		ror	2,x
		ror	3,x
		ror	4,x
		ror	FACOV
		bra	2B
9		rts

; ---------- עיגול ונרמול (mit: NORMAL 5003, NEGFAC 5076) ----------
incfac		inc	FACLO
		bne	1F
		inc	FACMO
		bne	1F
		inc	FACMOH
		bne	1F
		inc	FACHO
1		rts
; negfac: FAC = -FAC (המנטיסה במשלים ל-2, עם הבית הנוסף). negfch לא נוגע ב-A וב-B
negfac		com	FACSGN
negfch		com	FACHO
		com	FACMOH
		com	FACMO
		com	FACLO
		neg	FACOV
		beq	incfac
		rts
; float: המספר עם הסימן ב-A → FAC.  givd: D (עם סימן) → FAC.  givu: D בלי סימן
float		sta	FACHO
		clr	FACMOH
		ldb	#$88
		bra	floats
; givb: B (בלי סימן) → FAC
givb		clra
givu		std	FACHO
		clra			; A = 0: חיובי
		fcb	$8c		; cmpx #: מדלג על השורה הבאה
givd		std	FACHO
		ldb	#$90
floats		clr	FACMO
		clr	FACLO
; fltail: B = המעריך, A שלילי = להפוך סימן
fltail		stb	FACEXP
		clr	FACOV
		clr	FACSGN
fltst		tsta
		bpl	normal
negnrm		bsr	negfac
; normal: מזיזים שמאלה עד שהביט העליון 1, ומקטינים את המעריך. יותר מדי: אפס
normal		clrb
1		lda	FACHO
		bne	3F
		ldu	FACMOH		; בית שלם בבת אחת (B = המונה: לא לגעת)
		stu	FACHO
		lda	FACLO
		sta	FACMO
		lda	FACOV
		sta	FACLO
		clr	FACOV
		addb	#8
		cmpb	#32
		bne	1B
zerofc		clra
		sta	FACEXP
		sta	FACSGN
		rts
2		incb
		lsl	FACOV
		rol	FACLO
		rol	FACMO
		rol	FACMOH
		rol	FACHO
3		bpl	2B
		subb	FACEXP		; המעריך נגמר (B >= FACEXP): אפס
		bcc	zerofc
		negb
		stb	FACEXP
; nround: עיגול לפי ביט 7 של הבית הנוסף, והבית מתאפס (קורא: כך מסתיים
; הנרמול ב-Dragon, ולכן גם כפל, חילוק וחיבור; ב-mit הבית נשמר בלי עיגול)
nround		lbsr	rnd1
		clr	FACOV
		rts

; ---------- כפל (mit: FMULT 5264, MULDIV 5333) ----------
mltply		bne	mltpl1
		lda	RESLO		; בית אפס: רק הזזה של בית
		sta	FACOV
		ldd	RESMOH
		std	RESMO
		clra
		ldb	RESHO
		std	RESHO
9		rts
mltpl1		lsra
		ora	#$80		; סמן: הלולאה נגמרת כשהוא יוצא
1		bcc	2F
		pshs	a
		ldd	RESMO
		addd	ARGMO
		std	RESMO
		ldd	RESHO
		adcb	ARGMOH
		adca	ARGHO
		std	RESHO
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
; muldv2: D = המעריך השני (בחילוק: 256 פחות המעריך של FAC)
muldiv		ldb	FACEXP
		clra
muldv2		tst	ARGEXP
		beq	8F
		addb	ARGEXP
		rola
		subd	#128
		ble	8F
		tsta
		lbne	ovf
		stb	FACEXP
		lda	ARISGN
		sta	FACSGN
fprts		rts
8		leas	2,s
		bra	zerofc
fmult		lbsr	conupk
fmultt		tst	FACEXP
		beq	fprts
		bsr	muldiv
		clra
		clrb
		std	RESHO
		std	RESMO			; ב-Dragon הבית הנוסף לא נכנס לכפל (קורא; ב-mit כן)
		bsr	mltply
		ldx	#FACLO+1	; FACLO, FACMO, FACMOH, FACHO
1		lda	,-x
		bsr	mltply
		cmpx	#FACHO
		bne	1B
movfr		ldd	RESHO
		std	FACHO
		ldd	RESMO
		std	FACMO
		lbra	normal

; ---------- חילוק (mit: FDIVT 5393, DIVIDE 5410) ----------
fdiv		lbsr	conupk
fdivt		ldb	FACEXP
		lbeq	err_dv0		; ב-Dragon בלי עיגול בכניסה; המנה מתעגלת בסוף (קורא)
		negb
		clra
		bsr	muldv2		; ARG - FAC + 128
		lbsr	incexp		; ועוד 1
		ldu	#RESHO
		lda	#1
dvcmp		ldx	FACHO		; ARG >= FAC? אז סיבית 1
		cmpx	ARGHO
		bne	savq		; C = FAC < ARG
		ldx	FACMO
		cmpx	ARGMO
		bne	savq
		orcc	#1		; שווים
savq		pshs	cc		; C = סיבית המנה
		rola
		bcc	qshft
		cmpu	#RESHO+4	; בית שלם של מנה
		beq	divnrm
		sta	,u+
		lda	#1
		cmpu	#RESHO+4
		bne	qshft
		lda	#$40		; עוד שתי סיביות בלבד
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
		ldd	ARGMO
		subd	FACMO
		std	ARGMO
		ldd	ARGHO
		sbcb	FACMOH
		sbca	FACHO
		std	ARGHO
		puls	a
		bra	shfarg
divnrm		ldb	#64		; שתי הסיביות לראש הבית הנוסף
		mul
		stb	FACOV
		puls	cc
		bra	movfr

; ---------- קריאת מספר מהטקסט (mit: FIN 5704) ----------
; בכניסה: TXTPTR על התו הראשון. ביציאה: FAC, ו-TXTPTR אחרי המספר
fin		clra
		clrb
		sta	FACEXP
		std	FACSGN		; וגם SGNFLG
		sta	FACOV
		std	DECCNT		; וגם DPTFLG
		std	TENEXP		; וגם EXPSGN
		jsr	<chrgot		; (chrgot משנה את X)
		ldx	#SGNFLG		; סימן בהתחלה: רק בקלט וב-DATA (בביטוי הוא טוקן) (mit: FIN)
		bsr	fsgn
fin_lp		bcc	fin_dig		; ספרה
		cmpa	#'.
		bne	fin_e
		tst	DPTFLG
		bne	fin_end		; נקודה שנייה: סוף
		com	DPTFLG
		bra	fin_nx
fin_dig		tst	DPTFLG
		beq	1F
		inc	DECCNT
1		pshs	a
		bsr	mul10
		puls	a
		suba	#'0
		bsr	finlog
fin_nx		jsr	<chrget
		bra	fin_lp
fin_e		cmpa	#'E
		bne	fin_end
		jsr	<chrget
		ldx	#EXPSGN
		bsr	fsgn
		bcs	fin_end
fin_ed		suba	#'0		; המעריך כפול 10 ועוד הספרה
		ldb	TENEXP
		cmpb	#10
		blo	3F
		tst	EXPSGN
		beq	ovf2
		ldb	#100
		bra	4F
3		pshs	a
		lda	#10
		mul
		addb	,s+
4		stb	TENEXP
		jsr	<chrget
		bcc	fin_ed
fin_end		lda	TENEXP
		tst	EXPSGN
		beq	5F
		nega
5		suba	DECCNT
6		beq	8F
		bmi	7F
		deca
		pshs	a
		bsr	mul10
		bra	9F
7		inca
		pshs	a
		bsr	div10
9		lda	,s+		; (גם הדגלים)
		bra	6B
8		tst	SGNFLG
		beq	1F
negop		lda	FACEXP
		beq	1F
		com	FACSGN
1		rts
; fsgn: + או - (תו או טוקן) ב-A: מדלגים עליו, ומינוס הופך את הדגל ב-X. ביציאה: כמו chrget/chrgot
fsgn		cmpa	#'-
		beq	1F
		cmpa	#$c4
		bne	2F
1		com	,x
3		jmp	<chrget
2		cmpa	#'+
		beq	3B
		cmpa	#$c3
		beq	3B
		jmp	<chrgot
; finlog: FAC = FAC + הספרה ב-A
finlog		lbsr	movaf		; (movaf לא נוגע ב-A)
		lbsr	float
		lbra	finl2

; mul10 / div10 (mit: MUL10 5359, DIV10 5378)
mul10		lbsr	movaf
		lda	FACEXP
		beq	9F
		adda	#2
		bcs	ovf2
		sta	ARGEXP		; ARG = 4*FAC
		clr	ARISGN
		lbsr	faddt		; 5*FAC
		lbra	incexp		; 10*FAC
9		rts
ovf2		lbra	err_ov		; עוד עותק של ovf, קרוב (קפיצות קצרות)
div10		lbsr	movaf
		leax	tenzc,pcr
		clr	ARISGN
		lbsr	movfm
		lbra	fdivt

; ---------- סימן, השוואה, שלמים (mit: SIGN 5562, FLOAT 5575, FCOMP 5602, QINT 5644, INT 5673, AYINT 3804) ----------
; ayint: בין -32768 ל-32767, אחרת ?FC. התוצאה בשני הבתים FACMO:FACLO
ayint		lda	FACEXP
		cmpa	#144
		blo	qint
		leax	n32768,pcr
		bsr	fcomp
		lbne	err_fc
; qint: FAC → מספר שלם של 32 ביט עם סימן ב-FACHO..FACLO (מעוגל כלפי מטה)
qint		ldb	FACEXP
		beq	clrfac
		negb
		addb	#160		; B = 160 - FACEXP
		clra
		tst	FACSGN
		bpl	1F
		coma
		lbsr	negfch
1		sta	BITS
		ldx	#FACEXP
		lbsr	shiftr
		clr	BITS
		rts
clrfac		clra
		clrb
		std	FACHO
		std	FACMO
9		rts
; fint: INT
fint		lda	FACEXP
		cmpa	#160
		bhs	9B
		bsr	qint		; (qint לא נוגע ב-FACSGN)
		ldb	FACLO		; הבית הנמוך: הזוגיות, בשביל ^ (mit: INTEGR)
		stb	INTEGR
		ldb	#160
		lda	FACSGN
		lbra	fltail
; sign: A = 1, 0 או $FF לפי הסימן של FAC (וגם הדגלים)
sign		lda	FACEXP
		beq	sgnr
fcsign		lda	FACSGN
fcomps		rola
		lda	#$ff
		bcs	sgnr
		lda	#1
sgnr		tsta
		rts
; fcomp: A = 1 אם FAC גדול מהמספר ב-X, 0 אם שווים, $FF אם קטן
fcomp		ldb	,x
		beq	sign
		lda	1,x
		eora	FACSGN
		bmi	fcsign
		cmpb	FACEXP
		bne	1F
		ldd	1,x
		ora	#$80
		cmpd	FACHO
		bne	1F
		ldd	3,x		; Dragon: הבית הנוסף לא משתתף בהשוואה (קורא; ב-mit הוא כן)
		subd	FACMO
		beq	sgnr		; A = 0
1		lda	FACSGN
		bcs	fcomps		; המספר בזיכרון קטן יותר
		coma
		bra	fcomps

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
		ldd	#'0*256		; אפס
		std	,y
		rts
2		clrb
		cmpa	#$80
		bhi	4F
		leax	nzmil,pcr	; קטן מ-1: כפול 10^9
		lbsr	fmult
		ldb	#-9
4		stb	DECCNT
fout4		leax	nz9999,pcr
		bsr	fcomp
		bgt	fout9		; גדול מהגבול העליון: חלקי 10 (ב-Dragon שוויון לא נחשב, קורא)
fout3		leax	nz0999,pcr
		bsr	fcomp
		bgt	fout5
		lbsr	mul10
		dec	DECCNT
		bra	fout3
fout9		lbsr	div10
		inc	DECCNT
		bra	fout4
fout5		lbsr	faddh
		lbsr	qint
		ldb	#1		; ספרות לפני הנקודה
		lda	DECCNT
		adda	#10
		cmpa	#11		; mit: 3*ADDPRC+10 בבסיס 8 = 11. שלילי (קטן מ-.01 בערך) או גדול מ-999999999: כתיב E
		bhs	5F
		tfr	a,b
		decb
		lda	#2
5		suba	#2
		sta	TENEXP
		ldy	FBUFPT
		stb	DECCNT		; (גם הדגלים של B)
		beq	6F
		bpl	7F
6		lda	#'.		; מספר קטן מ-1: נקודה לפני הספרות
		sta	,y+
		tstb
		beq	7F
		lda	#'0
		sta	,y+
7		leax	foutbl,pcr	; תשע הספרות של המספר השלם
8		bsr	fdig
		stb	,y+
		dec	DECCNT
		bne	11F
		lda	#'.
		sta	,y+
11		cmpx	#foutbl+36
		bne	8B
12		lda	,-y		; אפסים בסוף לא מוצגים, וגם נקודה שנשארה לבד
		cmpa	#'0
		beq	12B
		cmpa	#'.
		beq	13F
		leay	1,y
13		lda	#'+
		ldb	TENEXP
		beq	15F
		bpl	14F		; (הדגלים של ldb)
		negb
		lda	#'-
14		sta	1,y		; הסימן אחרי ה-E
		lda	#'E
		sta	,y++
		lda	#'0-1
16		inca
		subb	#10
		bcc	16B
		addb	#'0+10
		std	,y++
15		clr	,y
		rts

; fdig: הספרה הבאה של המספר השלם FACHO..FACLO: כמה פעמים החזקה ב-X נכנסת (והיא מוחסרת).
; B = הספרה כתו, X עובר לחזקה הבאה (גם FOUT וגם PRINT USING)
fdig		lda	#'0
		pshs	a
1		ldd	FACMO
		subd	2,x
		pshs	d
		ldd	FACHO
		sbcb	1,x
		sbca	,x
		bcs	2F
		std	FACHO
		puls	d
		std	FACMO
		inc	,s
		bra	1B
2		leas	2,s
		leax	4,x
		puls	b,pc

; ---------- קבועים ----------
fone		equ	expcon+36		; 1: המקדם האחרון של expcon (mitconst.s), אותם 5 בתים
tenzc		fcb	$84,$20,$00,$00,$00	; 10
nzmil		fcb	$9e,$6e,$6b,$28,$00	; 10^9            (mit: NZMIL)
nz9999		fcb	$9e,$6e,$6b,$27,$fd	; 999999999.499   (mit: NZ9999)
nz0999		fcb	$9b,$3e,$bc,$1f,$fd	; 99999999.9499   (mit: NZ0999)
n32768		fcb	$90			; -32768
fhalf		fcb	$80,$00,$00,$00,$00	; 0.5 (גם הסוף של -32768)
foutbl		fdb	$05f5,$e100		; 10^8 ... 1
		fdb	$0098,$9680
		fdb	$000f,$4240
		fdb	$0001,$86a0
		fdb	$0000,$2710
		fdb	$0000,$03e8
		fdb	$0000,$0064
		fdb	$0000,$000a
		fdb	$0000,$0001
