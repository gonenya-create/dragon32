; ================= הדיבאגר של אסמבלר ה-Dragon / the debugger =================
; נקודות עצירה ב-SWI (הקפיצה ב-RAM ב-$0106, כמו במקור), וצעד אחד: SWI זמני בפקודה הבאה (או בשתיים, בקפיצה עם תנאי).
; ureg: המגירות של התוכנית שעצרה, בסדר שבו SWI שומר אותן: CC A B DP X Y U PC. ‏usp = המחסנית שלה.
; קוד מקורי שלנו (2026).
U_CC		equ	0
U_A		equ	1
U_B		equ	2
U_DP		equ	3
U_X		equ	4
U_Y		equ	6
U_U		equ	8
U_PC		equ	10

; BP LOOP: נקודת עצירה (עד 4). ‏BP לבד: הרשימה. ‏NOBP: מוחקים את כולן
dobp		lbsr	skipsp
		tst	,x
		bne	1F
		tst	nbp
		bne	2F
		ldx	#m_nobp
		lbsr	puts
		lbra	crlf
2		ldx	#bpaddr
		ldb	nbp
3		lda	#'$
		lbsr	putc
		pshs	b
		ldd	,x++
		lbsr	prthex4
		puls	b
		lda	#$20
		lbsr	putc
		decb
		bne	3B
		lbra	crlf
1		lbsr	getaddr
		lbcs	cmderr
		tfr	d,y		; הכתובת
		ldb	nbp
		cmpb	#4
		blo	4F
		ldx	#m_bpful
		lbra	cmderr
4		ldx	#bpaddr
		lslb
		sty	b,x
		inc	nbp
		rts

donobp		clr	nbp
		rts

; REG: המגירות של התוכנית שעצרה, והפקודה הבאה
doreg		tst	stopped
		lbne	showreg
		ldx	#m_nostop
		lbra	cmderr

; TRACE (T): פקודה אחת. ‏T $2EE1, או T כשאין תוכנית עצורה: מתחילים מכתובת, או מההתחלה של התרגום
dotrace		lbsr	skipsp
		tst	,x
		beq	1F
		lbsr	getaddr
		lbcs	cmderr
		bra	2F
1		tst	stopped
		bne	3F
		lbsr	asmall
		ldd	errcnt
		lbne	asmsum
		ldd	entry
2		lbsr	fresh
3		lbsr	planttmp
		lbra	resume

; CONT (C): ממשיכים. קודם פקודה אחת בלי נקודות העצירה (אולי עומדים על אחת), ואז שותלים את כולן ורצים
docont		tst	stopped
		bne	1F
		ldx	#m_nostop
		lbra	cmderr
1		lda	#1
		sta	contp
		lbsr	planttmp
		lbra	resume

; fresh: התוכנית מתחילה ב-D, על המחסנית של BASIC, ו-RTS שלה מגיע ל-runret
fresh		std	ureg+U_PC
		ldx	bassp
		ldd	#runret
		std	,--x
		stx	usp
		clr	ureg+U_CC
		clr	ureg+U_A
		clr	ureg+U_B
		clr	ureg+U_DP
		ldd	#0
		std	ureg+U_X
		std	ureg+U_Y
		std	ureg+U_U
		lda	#1
		sta	stopped
		rts

; resume: חוזרים לתוכנית עם כל המגירות שלה (RTI, עם הדגל E)
resume		lds	usp
		leas	-12,s
		tfr	s,y
		ldx	#ureg
		ldb	#12
1		lda	,x+
		sta	,y+
		decb
		bne	1B
		lda	,s
		ora	#$80
		sta	,s
		rti

; swient: ה-SWI הגיע. שומרים את המגירות, מחזירים את הבתים ששתלנו, ומראים איפה עצרנו
swient		tfr	s,x
		ldy	#ureg
		ldb	#12
1		lda	,x+
		sta	,y+
		decb
		bne	1B
		stx	usp
		lds	#ostktop
		clra
		tfr	a,dp
		ldd	ureg+U_PC	; SWI שלנו? אז התוכנית עצרה על הבית שלפניו
		subd	#1
		lbsr	isplant
		bne	2F
		std	ureg+U_PC
2		lbsr	unplant
		lda	#1
		sta	stopped
		tst	contp
		beq	3F
		clr	contp
		lbsr	plantbp
		lbra	resume
3		lbsr	textmode
		ldx	#SCREND-32
		stx	curpos
		clr	justw
		lbsr	crlf
		lbsr	showreg
		lbra	main

; showreg: שתי שורות של מגירות, ואז הפקודה הבאה
showreg		ldx	#t_rpc
		lbsr	puts
		ldd	ureg+U_PC
		lbsr	prthex4
		ldx	#t_ra
		lbsr	puts
		lda	ureg+U_A
		lbsr	prthex2
		ldx	#t_rb
		lbsr	puts
		lda	ureg+U_B
		lbsr	prthex2
		ldx	#t_rx
		lbsr	puts
		ldd	ureg+U_X
		lbsr	prthex4
		ldx	#t_ry
		lbsr	puts
		ldd	ureg+U_Y
		lbsr	prthex4
		lbsr	crlf
		ldx	#t_ru
		lbsr	puts
		ldd	ureg+U_U
		lbsr	prthex4
		ldx	#t_rs
		lbsr	puts
		ldd	usp
		lbsr	prthex4
		ldx	#t_rdp
		lbsr	puts
		lda	ureg+U_DP
		lbsr	prthex2
		ldx	#t_rcc
		lbsr	puts
		ldx	#t_flags	; EFHINZVC: אות כשהנורה דולקת, נקודה כשכבויה
		ldb	ureg+U_CC
		lda	#8
		sta	dcnt
1		lslb
		lda	,x+
		bcs	2F
		lda	#'.
2		lbsr	putc
		dec	dcnt
		bne	1B
		lbsr	crlf
		ldd	daddr
		pshs	d
		ldd	ureg+U_PC
		std	daddr
		lbsr	disone
		puls	d
		std	daddr
		rts

; ---------- שתילה / planting SWI ----------
; plant: SWI ב-D (רק ב-RAM, מתחת ל-$8000). שומרים את הבית שהיה שם
plant		cmpd	#$8000
		bhs	9F
		pshs	d
		ldb	np
		cmpb	#6
		bhs	8F
		ldx	#paddr
		lslb
		ldy	,s
		sty	b,x
		lda	,y
		ldb	np
		ldx	#pval
		sta	b,x
		lda	#$3f
		sta	,y
		inc	np
8		puls	d
9		rts

; unplant: מחזירים את הבתים, מהאחרון לראשון
unplant		ldb	np
		beq	9F
1		decb
		ldx	#pval
		lda	b,x
		pshs	a
		ldx	#paddr
		lslb
		ldx	b,x
		lsrb
		puls	a
		sta	,x
		tstb
		bne	1B
		clr	np
9		rts

; isplant: Z=1 אם D היא כתובת ששתלנו בה (D נשמר)
isplant		pshs	d
		ldx	#paddr
		ldb	np
		beq	8F
1		ldy	,x++
		cmpy	,s
		beq	9F
		decb
		bne	1B
8		andcc	#$fb
		puls	d,pc
9		orcc	#4
		puls	d,pc

; plantbp: כל נקודות העצירה
plantbp		ldb	nbp
		beq	9F
		ldx	#bpaddr
1		pshs	b,x
		ldd	,x
		lbsr	plant
		puls	b,x
		leax	2,x
		decb
		bne	1B
9		rts

; planttmp: SWI אחרי הפקודה שב-PC: בפקודה הבאה, ביעד של קפיצה, או לאן ש-RTS/RTI/PULS PC/JSR/JMP הולכים.
; JSR אל ה-ROM: עוברים מעליה (SWI אחריה). לא שותלים בתוך הפקודה עצמה
planttmp	ldd	daddr
		pshs	d
		ldd	ureg+U_PC
		std	daddr
		ldd	#$ffff
		std	dtgt
		lda	#1
		sta	dquiet
		lbsr	disone
		clr	dquiet
		puls	d
		std	daddr
		ldd	dptr
		std	nxt1
		ldd	dtgt
		std	nxt2
		tst	dpage
		lbne	8F
		ldx	ureg+U_PC
		lda	dop
		cmpa	#$39		; RTS
		bne	1F
		ldd	[usp]
		std	nxt1
		lbra	8F
1		cmpa	#$3b		; RTI
		bne	2F
		ldx	usp
		lda	,x
		bmi	11F
		ldd	1,x
		bra	12F
11		ldd	10,x
12		std	nxt1
		lbra	8F
2		cmpa	#$35		; PULS
		beq	21F
		cmpa	#$37		; PULU
		bne	3F
		ldy	ureg+U_U
		bra	22F
21		ldy	usp
22		ldb	1,x
		bpl	8F		; בלי PC: הפקודה הבאה
		clra			; המקום של PC: אחרי כל המגירות שלפניו
		bitb	#1
		beq	23F
		inca
23		bitb	#2
		beq	24F
		inca
24		bitb	#4
		beq	25F
		inca
25		bitb	#8
		beq	26F
		inca
26		bitb	#$10
		beq	27F
		adda	#2
27		bitb	#$20
		beq	28F
		adda	#2
28		bitb	#$40
		beq	29F
		adda	#2
29		ldd	a,y
		std	nxt1
		bra	8F
3		ldb	dmode		; JSR או JMP
		cmpa	#$9d
		beq	31F
		cmpa	#$ad
		beq	31F
		cmpa	#$bd
		beq	31F
		cmpa	#$0e
		beq	32F
		cmpa	#$6e
		beq	32F
		cmpa	#$7e
		bne	8F
32		lda	#1		; JMP
		bra	33F
31		clra			; JSR
33		sta	isjmp
		cmpb	#M_DIR
		bne	34F
		lda	ureg+U_DP
		ldb	1,x
		bra	36F
34		cmpb	#M_EXT
		bne	35F
		ldd	1,x
		bra	36F
35		leax	1,x
		lbsr	eaidx
36		cmpd	#$8000
		bhs	37F
		std	nxt1		; ב-RAM: נכנסים
		bra	8F
37		tst	isjmp		; ב-ROM: JSR עוברת מעליה, JMP רצה חופשי
		beq	8F
		ldd	#$ffff
		std	nxt1
8		ldd	nxt1
		bsr	pltok
		ldd	nxt2
		bsr	pltok
		rts
; pltok: שותלים ב-D, אם זו כתובת ולא בתוך הפקודה הנוכחית
pltok		cmpd	#$ffff
		beq	9F
		cmpd	ureg+U_PC
		blo	1F
		cmpd	dptr
		blo	9F
1		lbsr	plant
9		rts

; eaidx: X = הבית שאחרי הפקודה (איך מגיעים). D = הכתובת, לפי המגירות של התוכנית
eaidx		lda	,x+
		sta	epb
		stx	eptr
		lsra
		lsra
		lsra
		lsra
		lsra
		anda	#3
		cmpa	#3
		bne	1F
		ldd	usp
		bra	2F
1		lsla
		ldy	#ureg+U_X
		ldd	a,y
2		std	er
		lda	epb
		bmi	3F
		anda	#$1f		; 5 סיביות
		bita	#$10
		beq	21F
		ora	#$e0
21		tfr	a,b
		sex
		addd	er
		rts
3		anda	#$0f
		lsla
		ldx	#eatab
		jsr	[a,x]
		pshs	d
		lda	epb		; בסוגריים: הכתובת שבמקום הזה
		bita	#$10
		puls	d
		beq	9F
		tfr	d,x
		ldd	,x
9		rts
eatab		fdb	ear,ear,eam1,eam2,ear,eab,eaa,ear,ea8,ea16,ear,ead,eap8,eap16,ear,eaext
ear		ldd	er
		rts
eam1		ldd	er
		subd	#1
		rts
eam2		ldd	er
		subd	#2
		rts
eab		ldb	ureg+U_B
		sex
		addd	er
		rts
eaa		ldb	ureg+U_A
		sex
		addd	er
		rts
ead		ldd	ureg+U_A
		addd	er
		rts
ea8		ldb	[eptr]
		sex
		addd	er
		rts
ea16		ldd	[eptr]
		addd	er
		rts
eap8		ldb	[eptr]
		sex
		addd	eptr
		addd	#1
		rts
eap16		ldd	[eptr]
		addd	eptr
		addd	#2
		rts
eaext		ldd	[eptr]
		rts

t_rpc		fcn	"PC="
t_ra		fcn	" A="
t_rb		fcn	" B="
t_rx		fcn	" X="
t_ry		fcn	" Y="
t_ru		fcn	"U="
t_rs		fcn	" S="
t_rdp		fcn	" DP="
t_rcc		fcn	" CC="
t_flags		fcc	"EFHINZVC"
m_nobp		fcn	"NO STOP POINTS. BP LOOP SETS ONE"
m_bpful		fcn	"4 STOP POINTS AT MOST. NOBP CLEARS THEM"
m_nostop	fcn	"NO PROGRAM IS STOPPED. T STARTS ONE STEP BY STEP"
