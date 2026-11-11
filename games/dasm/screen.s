; ================= עורך המסך המלא, חיפוש והחלפה / the full-screen editor, find and change =================
; V [n]: 15 שורות של התוכנית על המסך. ↑ ↓ בין השורות (והמסך גולל), → ימינה, SHIFT+← שמאלה, ← מוחק, הקלדה נכנסת
; במקום הסמן, ENTER שומר ויורד, BREAK חוזר לפקודות. ‏SHIFT+↓ = ‏[ ו-CLEAR = ‏]. שורה שמשתנה נשמרת כשיוצאים ממנה.
; בשורה האחרונה יש שורה חדשה ריקה (המספר האחרון ועוד 10). קוד מקורי שלנו (2026).
VROWS		equ	15

doview		lbsr	skipsp
		ldd	#0
		lbsr	isdig
		bcs	1F
		lbsr	getnum
		lbcs	badnum
1		lbsr	findln
		ldd	,x
		cmpd	#$ffff
		bne	2F
		lbsr	newnum
2		std	vtopn
		clr	vrow
		clr	vcol
		lbsr	vdraw
		lbsr	vload
vloop		lbsr	vcursor
		lbsr	getkey
		cmpa	#13
		lbeq	vkdown
		cmpa	#$0a
		lbeq	vkdn
		cmpa	#$5e
		lbeq	vkup
		cmpa	#$09
		lbeq	vkright
		cmpa	#8
		lbeq	vkleft
		cmpa	#12
		lbeq	vkclr
		cmpa	#3
		lbeq	vkbrk
		cmpa	#$20
		blo	vloop
		cmpa	#$80
		bhs	vloop
		lbra	vins
vkclr		lda	#']
		lbra	vins
vkdn		lbsr	shifted
		lbcc	vkdown
		lda	#'[
vins		ldb	vlen		; הכנסה במקום הסמן
		cmpb	vmax
		bhs	vloop
		ldx	#vbuf
		abx
1		cmpb	vcol
		bls	2F
		pshs	a
		lda	-1,x
		sta	,x
		puls	a
		leax	-1,x
		decb
		bra	1B
2		sta	,x
		inc	vlen
		inc	vcol
		bra	vchg
vkleft		lbsr	shifted
		bcc	1F
		tst	vcol		; SHIFT+←: שמאלה
		beq	vloop
		dec	vcol
		bra	vloop
1		ldb	vcol		; ←: מוחקים את האות שלפני הסמן
		lbeq	vloop
		ldx	#vbuf
		abx
2		cmpb	vlen
		bhs	3F
		lda	,x
		sta	-1,x
		leax	1,x
		incb
		bra	2B
3		dec	vlen
		dec	vcol
vchg		lda	#1
		sta	vdirty
		lbsr	vdrow
		lbra	vloop
vkright		lda	vcol
		cmpa	vlen
		lbhs	vloop
		inc	vcol
		lbra	vloop
vkbrk		lbsr	vcommit
		lbra	cls
vkup		lbsr	vcommit
		tst	vrow
		beq	1F
		dec	vrow
		bra	vnext
1		ldd	vtopn		; גוללים למעלה: השורה שלפני השורה העליונה
		lbsr	prevln
		lbeq	vloop
		std	vtopn
		bra	vredraw
vkdown		lbsr	vcommit
		ldb	vrow
		cmpb	#VROWS-1
		bhs	1F
		incb
		lslb
		ldx	#rownum
		ldd	b,x
		lbeq	vloop
		inc	vrow
		bra	vnext
1		ldd	rownum+2	; גוללים למטה: השורה השנייה עולה למעלה
		std	vtopn
vredraw		lbsr	vdraw
vnext		lbsr	vload
		lbra	vloop

; vcommit: אם השורה השתנתה, היא נשמרת (כמו להקליד "מספר טקסט"), והמסך מצויר מחדש
vcommit		tst	vdirty
		beq	9F
		clr	vdirty
		ldd	vnum
		ldx	#inbuf
		lbsr	dec2buf
		ldb	vlen
		beq	2F		; שורה שהתרוקנה נמחקת
		lda	#$20
		sta	,x+
		ldy	#vbuf
1		lda	,y+
		sta	,x+
		decb
		bne	1B
2		clr	,x
		ldx	#inbuf
		lbsr	doline
		lbsr	vdraw
		lbsr	vload
9		rts

; vdraw: המסך כולו מהשורה vtopn. ‏rownum: מספר השורה בכל שורת מסך (0 = ריקה)
vdraw		lbsr	cls
		clr	vnewr
		clr	vr
		ldd	vtopn
		lbsr	findln
		stx	vrp
1		lda	vr		; תחילת שורת המסך
		ldb	#32
		mul
		addd	#SCREEN
		std	curpos
		ldb	vr
		lslb
		ldy	#rownum
		leay	b,y
		ldx	vrp
		lda	,x
		cmpa	#$ff
		bne	3F
		tst	vnewr		; אחרי השורה האחרונה: שורה חדשה, פעם אחת
		bne	2F
		inc	vnewr
		lbsr	newnum
		std	,y
		lbsr	prtdec
		lda	#$20
		lbsr	putc
		bra	4F
2		ldd	#0
		std	,y
		bra	4F
3		ldd	,x
		std	,y
		lbsr	vrec
		stx	vrp
4		inc	vr
		lda	vr
		cmpa	#VROWS
		blo	1B
		ldx	#SCREEN+VROWS*32
		stx	curpos
		ldx	#m_vhelp
		lbra	puts

; vrec: שורה מהתוכנית על המסך, עד 31 תווים. X עובר לשורה הבאה
vrec		ldd	,x
		lbsr	prtdec
		lda	#$20
		lbsr	putc
		ldb	2,x
		leax	3,x
1		tstb
		beq	9F
		lda	curpos+1
		anda	#31
		cmpa	#31
		bhs	2F
		lda	,x
		lbsr	putc
2		leax	1,x
		decb
		bra	1B
9		rts

; vload: השורה של הסמן אל vbuf
vload		ldb	vrow		; שורת מסך ריקה (אחרי גלילה)? עולים עד שורה עם מספר
		beq	vl0
		lslb
		ldx	#rownum
		ldd	b,x
		bne	vl0
		dec	vrow
		bra	vload
vl0		ldb	vrow
		lslb
		ldx	#rownum
		ldd	b,x
		std	vnum
		ldx	#argbuf
		lbsr	dec2buf
		tfr	x,d
		subd	#argbuf-1
		stb	vwid		; הספרות ורווח
		lda	#31
		suba	vwid
		cmpa	#MAXIN-8
		bls	1F
		lda	#MAXIN-8
1		sta	vmax
		clr	vlen
		clr	vdirty
		ldd	vnum
		lbsr	findln
		bne	3F
		ldb	2,x
		cmpb	vmax		; שורה ארוכה: רק מה שנכנס במסך (לשורות ארוכות יש E)
		bls	11F
		ldb	vmax
11		stb	vlen
		leax	3,x
		ldy	#vbuf
		tstb
		beq	3F
2		lda	,x+
		sta	,y+
		decb
		bne	2B
3		lda	vcol
		cmpa	vlen
		bls	9F
		lda	vlen
		sta	vcol
9		rts

; vdrow: מציירים מחדש את שורת הסמן
vdrow		ldb	vrow
		lda	#32
		mul
		addd	#SCREEN
		tfr	d,x
		stx	curpos
		lda	#16
		pshs	a
		ldd	#$6060
1		std	,x++
		dec	,s
		bne	1B
		leas	1,s
		ldd	vnum
		lbsr	prtdec
		lda	#$20
		lbsr	putc
		ldx	#vbuf
		ldb	vlen
		beq	9F
2		lda	,x+
		lbsr	putc
		decb
		bne	2B
9		rts

; vcursor: הסמן במקום שלו על המסך
vcursor		ldb	vrow
		lda	#32
		mul
		addd	#SCREEN
		addb	vwid
		adca	#0
		addb	vcol
		adca	#0
		std	curpos
		clr	justw
		rts

; newnum: D = המספר של שורה חדשה בסוף (האחרונה ועוד 10, או 10)
newnum		lbsr	lastln
		addd	#10
		rts

; prevln: D = מספר שורה. D = המספר של השורה שלפניה, Z=1 אם אין
prevln		std	ftmp
		ldx	#SRC+4
		ldd	#0
		pshs	d
1		ldd	,x
		cmpd	ftmp
		bhs	2F
		std	,s
		ldb	2,x
		abx
		leax	3,x
		bra	1B
2		puls	d
		cmpd	#0
		rts

; ---------- FIND / CHANGE ----------
; FIND LDA: כל השורות שיש בהן את הטקסט
dofind		lbsr	skipsp
		tst	,x
		bne	1F
		ldx	#m_findhow
		lbra	cmderr
1		stx	fpat
		lbsr	strlen
		stb	fplen
		clr	fcount
		ldx	#SRC+4
2		lda	,x
		cmpa	#$ff
		beq	8F
		lbsr	hasstr
		bne	3F
		inc	fcount
		lbsr	prtrec
		lbsr	brkchk
		bcc	2B
		rts
3		ldb	2,x
		abx
		leax	3,x
		bra	2B
8		tst	fcount
		bne	9F
		ldx	#m_nofind
		lbsr	puts
		lbra	crlf
9		rts

; hasstr: Z=1 אם בשורה ב-X יש את fpat (באורך fplen). X נשמר
hasstr		pshs	x
		ldb	2,x
		subb	fplen
		bcs	8F
		incb			; כמה מקומות התחלה
		leax	3,x
1		pshs	b,x
		ldy	fpat
		ldb	fplen
2		lda	,x+
		cmpa	,y+
		bne	3F
		decb
		bne	2B
		puls	b,x		; נמצא
		puls	x
		orcc	#4
		rts
3		puls	b,x
		leax	1,x
		decb
		bne	1B
8		puls	x
		andcc	#$fb
		rts

; CHANGE /LDA/LDB/: מחליפים בכל השורות. הסימן הראשון מפריד
dochg		lbsr	skipsp
		lda	,x+
		lbeq	chow
		sta	fdelim
		stx	fpat
		clrb
1		lda	,x+
		lbeq	chow
		cmpa	fdelim
		beq	2F
		incb
		bra	1B
2		tstb
		beq	chow
		stb	fplen
		stx	cnew
		clrb
3		lda	,x+
		beq	4F
		cmpa	fdelim
		beq	4F
		incb
		bra	3B
4		stb	cnlen
		ldx	fpat		; הישן והחדש עוברים לחוצצים משלהם: שורת הקלט נכתבת מחדש בכל שורה שמשתנה
		ldy	#fold
		ldb	fplen
41		lda	,x+
		sta	,y+
		decb
		bne	41B
		ldd	#fold
		std	fpat
		ldx	cnew
		ldy	#fnew
		ldb	cnlen
		beq	43F
42		lda	,x+
		sta	,y+
		decb
		bne	42B
43		ldd	#fnew
		std	cnew
		clr	fcount
		ldd	#0
		std	cline
5		ldd	cline		; השורה הבאה, לפי המספר (השמירה מזיזה את השורות בזיכרון)
		addd	#1
		lbsr	findln
		ldd	,x
		cmpd	#$ffff
		beq	9F
		std	cline
		lbsr	hasstr
		bne	5B
		lbsr	chline
		bra	5B
9		ldb	fcount
		clra
		lbsr	prtdec
		ldx	#m_chg
		lbsr	puts
		lbra	crlf
chow		ldx	#m_chghow
		lbra	cmderr

; chline: השורה ב-X עם ההחלפות, אל inbuf, ונשמרת
chline		ldd	cline
		pshs	x
		ldx	#inbuf
		lbsr	dec2buf
		lda	#$20
		sta	,x+
		tfr	x,y
		puls	x
		ldb	2,x
		stb	cleft
		leax	3,x
1		tst	cleft
		beq	6F
		ldb	cleft		; כאן מתחיל fpat?
		cmpb	fplen
		blo	4F
		pshs	x,y
		ldy	fpat
		ldb	fplen
2		lda	,x+
		cmpa	,y+
		bne	3F
		decb
		bne	2B
		puls	x,y		; כן: החדש במקום הישן
		ldb	fplen
		abx
		lda	cleft
		suba	fplen
		sta	cleft
		pshs	x
		ldx	cnew
		ldb	cnlen
		beq	21F
20		lda	,x+
		sta	,y+
		decb
		bne	20B
21		puls	x
		bra	5F
3		puls	x,y
4		lda	,x+
		sta	,y+
		dec	cleft
5		cmpy	#inbuf+MAXIN
		bhs	7F
		bra	1B
6		clr	,y
		inc	fcount
		ldx	#inbuf
		lbra	doline
7		ldx	#m_chlong	; ארוכה מדי: לא משנים אותה
		lbsr	puts
		ldd	cline
		lbsr	prtdec
		lbra	crlf

m_vhelp		fcn	"BREAK: BACK. SHIFT+LEFT: MOVE"
m_findhow	fcn	"FIND WHAT? LIKE FIND LDA"
m_nofind	fcn	"NOT FOUND"
m_chghow	fcn	"LIKE CHANGE /LDA/LDB/"
m_chg		fcn	" LINES CHANGED"
m_chlong	fcn	"TOO LONG, NOT CHANGED: "
