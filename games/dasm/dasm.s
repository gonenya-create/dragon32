; האסמבלר של Dragon 1982: עורך שורות ומתרגם 6809 שרצים בתוך ה-Dragon עצמו, כמו בשנות השמונים.
; The Dragon 1982 assembler: a line editor and a 6809 assembler that run inside the Dragon itself.
; קלטת: CLOADM ואז EXEC. כותבים שורות עם מספרים (כמו ב-BASIC), ASM מתרגם, RUN מתרגם ומריץ, CSAVE/CLOAD שומרים בקלטת.
; התחביר כמו באסמבלר של פינת הלמידה (learn/asm/asm6809.js), ואותם בתים לאותה תוכנית.
; (C) 2026 Gonen Yarom. קוד מקורי שלנו, בלי קוד של DREAM.
;
; הזיכרון:  $0600-$1BFF  הטקסט: "D82S", ואז שורות [מספר:2][אורך:1][טקסט], ובסוף $FFFF (אזור דפי הגרפיקה)
;           $1C00-$23FF  טבלת השמות: 16 בתים לשם (שם 10, ערך 2, שורה 2, ידוע 1, ריק 1), עד 128 שמות
;           $2400-$33FF  התוכנית שמתרגמים (ברירת מחדל $2EE1, כמו בפינת הלמידה)
;           $3400-...    האסמבלר עצמו, והמשתנים שלו אחריו. מגיעים אליו עם EXEC 13312
;           המחסנית: של BASIC, כמו שהייתה ב-EXEC

SCREEN		equ	$0400
SCREND		equ	$0600
POLCAT		equ	$a000		; [POLCAT]: מקש, או 0
CSRDON		equ	$a004		; [..]: מנוע, וסנכרון
BLKIN		equ	$a006		; [..]: קריאת בלוק
BLKOUT		equ	$a008		; [..]: כתיבת בלוק
WRLDR		equ	$a00c		; [..]: מנוע, ומבוא
MOTOFF		equ	$8018		; כיבוי המנוע
BLKTYP		equ	$7c
BLKLEN		equ	$7d
BLKADR		equ	$7e
BLKRES		equ	$81
BCURS		equ	$88		; הסמן של BASIC
DEVNUM		equ	$6f
TBUF		equ	$01da		; חוצץ הקלטת של BASIC (255 בתים)
SRC		equ	$0600		; הטקסט: באזור של דפי הגרפיקה (תוכנית שמציירת גרפיקה מוחקת אותו)
SRCTOP		equ	$1c00
SYMTAB		equ	$1c00
SYMTOP		equ	$2400
USERLO		equ	$2400
USERHI		equ	$3400
SRCOLD		equ	$3c00		; קלטות טקסט מגרסה 1.0 נשמרו עם הכתובת הזאת
MAXIN		equ	60
ORG0		equ	$2ee1
SY_V		equ	10
SY_L		equ	12
SY_K		equ	14
SYLEN		equ	16
OP_C		equ	5
OP_O		equ	6
OP_F		equ	7
OPLEN		equ	8
C_INH		equ	0
C_ACC		equ	1
C_MEM		equ	2
C_IMM8		equ	3
C_REL		equ	4
C_LREL		equ	5
C_LEA		equ	6
C_STK		equ	7
C_REG		equ	8
F_P10		equ	1
F_P11		equ	2
F_W		equ	4
F_NOI		equ	8
F_U		equ	16

		org	$3400
start		sts	bassp		; המחסנית של BASIC: BASIC חוזר דרכה, והתוכנית שמריצים רצה עליה
		lds	#ostktop	; לאסמבלר מחסנית משלו, כדי שתוכנית שעצרה באמצע לא תיפגע
		ldx	$0106		; SWI (נקודות עצירה) קופץ דרך ה-RAM ב-$0106, כמו במקור. שומרים את מה שהיה
		stx	oswi
		lda	$0108
		sta	oswi+2
		lda	#$7e
		sta	$0106
		ldx	#swient
		stx	$0107
		clr	stopped
		clr	nbp
		clr	np
		clr	contp
		clr	dquiet
		clra
		tfr	a,dp
		sta	<DEVNUM
		ldd	#SYMTAB		; המשתנים לא על הקלטת: מאפסים את מה שצריך
		std	symend
		ldd	#ORG0
		std	maddr
		std	daddr
		clr	listf
		clr	lstop
		clr	justw
		lbsr	srcchk		; יש כבר טקסט? (EXEC שני שומר אותו)
		lbsr	cls
		ldx	#t_hello
		lbsr	puts
		sts	mainsp
main		lds	mainsp
		clra
		tfr	a,dp
		andcc	#$af		; הפסיקות פתוחות, כמו ב-BASIC
		lda	#'>
		lbsr	putc
		clr	inlen
		lbsr	getline
		bcs	main
		ldx	#inbuf
		lbsr	doline
		bra	main

; ================= העורך / the editor =================
; שורה מהמשתמש: מספר = שורת תוכנית, אחרת פקודה
doline		lbsr	skipsp
		tst	,x
		beq	9F
		lbsr	isdig
		lbcc	enterln
		lbra	command
9		rts

; "120 LOOP LDA #1": השורה נכנסת (או מחליפה). "120" לבד: השורה נמחקת
enterln		lbsr	getnum
		lbcs	badnum
		cmpd	#0
		lbeq	badnum
		cmpd	#63999
		lbhi	badnum
		std	lnum
		lda	,x
		beq	delone
		cmpa	#$20
		lbne	needsp
		leax	1,x
		tst	,x
		beq	delone
		stx	ltext
		lbsr	strlen
		stb	llen
		ldd	lnum
		lbsr	findln
		bne	1F
		lbsr	delrec
1		lbra	insrec
delone		ldd	lnum
		lbsr	findln
		bne	1F
		lbsr	delrec
1		rts

needsp		ldx	#m_needsp
		bra	cmderr
badnum		ldx	#m_badnum
cmderr		lbsr	putmsg
		lbsr	crlf
		lbra	main

; srcchk: אם יש "D82S" בהתחלה ושורות תקינות, הטקסט נשאר. אחרת טקסט ריק
srcchk		ldx	#SRC
		ldd	,x
		cmpd	#$4438		; "D8"
		bne	srcnew
		ldd	2,x
		cmpd	#$3253		; "2S"
		bne	srcnew
		leax	4,x
1		ldd	,x
		cmpd	#$ffff
		beq	2F
		ldb	2,x
		abx
		leax	3,x
		cmpx	#SRCTOP-2
		bhi	srcnew
		bra	1B
2		stx	srcend
		clr	srclost
		rts
srcnew		lda	#1
		sta	srclost
		ldx	#SRC
		ldd	#$4438
		std	,x++
		ldd	#$3253
		std	,x++
		stx	srcend
		ldd	#$ffff
		std	,x
		rts

; findln: D = מספר שורה. X = השורה הראשונה שהמספר שלה גדול או שווה (או הסוף). Z=1: בדיוק
findln		std	ftmp
		ldx	#SRC+4
1		ldd	,x
		cmpd	ftmp
		bhs	2F
		ldb	2,x
		abx
		leax	3,x
		bra	1B
2		rts

; lastln: D = מספר השורה האחרונה, או 0
lastln		ldx	#SRC+4
		ldd	#0
		std	ftmp
1		ldd	,x
		cmpd	#$ffff
		beq	2F
		std	ftmp
		ldb	2,x
		abx
		leax	3,x
		bra	1B
2		ldd	ftmp
		rts

; delrec: מוחקת את השורה ב-X. X נשאר: עכשיו הוא השורה שאחריה
delrec		pshs	x
		ldb	2,x
		clra
		addd	#3
		std	dsize
		leay	d,x
		ldd	srcend
		addd	#2
		pshs	y
		subd	,s++
		lbsr	copyfwd
		ldd	srcend
		subd	dsize
		std	srcend
		puls	x,pc

; insrec: שורה חדשה ב-X: lnum, ltext, llen
insrec		ldb	llen
		clra
		addd	#3
		std	dsize
		addd	srcend
		addd	#2
		cmpd	#SRCTOP
		bhi	memful
		pshs	x
		ldd	srcend
		addd	#2
		subd	,s
		pshs	d
		ldd	srcend
		addd	#2
		tfr	d,y
		addd	dsize
		tfr	d,x
		puls	d
		lbsr	copybwd
		ldd	srcend
		addd	dsize
		std	srcend
		puls	x
		ldd	lnum
		std	,x++
		ldb	llen
		stb	,x+
		ldy	ltext
		tstb
		beq	2F
1		lda	,y+
		sta	,x+
		decb
		bne	1B
2		rts
memful		ldx	#m_memful
		lbra	cmderr

; copyfwd: D בתים מ-Y אל X, מההתחלה. copybwd: מהסוף (X ו-Y אחרי הסוף)
copyfwd		pshs	d
		ldd	,s
		beq	2F
1		lda	,y+
		sta	,x+
		ldd	,s
		subd	#1
		std	,s
		bne	1B
2		puls	d,pc
copybwd		pshs	d
		ldd	,s
		beq	2F
1		lda	,-y
		sta	,-x
		ldd	,s
		subd	#1
		std	,s
		bne	1B
2		puls	d,pc

; ---------- פקודות ----------
command		ldy	#word
		clrb
1		lda	,x
		lbsr	upper
		cmpa	#'A
		blo	2F
		cmpa	#'Z
		bhi	2F
		cmpb	#8
		bhs	3F
		sta	b,y
		incb
3		leax	1,x
		bra	1B
2		clr	b,y
		tstb
		bne	4F
		lda	,x
		cmpa	#'?
		lbeq	dohelp
		bra	unkcmd
4		lbsr	skipsp
		stx	args
		ldx	#word
		ldu	#cmdtab
		ldb	#3
		lbsr	tfind
		bne	5F
		ldx	args
		jmp	[1,u]
5		tst	word+1		; אות אחת: הקיצורים
		bne	unkcmd
		ldu	#cmdtab
6		tst	,u
		beq	unkcmd
7		lda	,u+
		bne	7B
		lda	,u
		cmpa	word
		beq	8F
		leau	3,u
		bra	6B
8		ldx	args
		jmp	[1,u]
unkcmd		ldx	#m_unkcmd
		lbra	cmderr

cmdtab		fcn	"LIST"
		fcb	'L
		fdb	dolist
		fcn	"EDIT"
		fcb	'E
		fdb	doedit
		fcn	"DELETE"
		fcb	'D
		fdb	dodel
		fcn	"INSERT"
		fcb	'I
		fdb	doins
		fcn	"RENUM"
		fcb	0
		fdb	doren
		fcn	"NEW"
		fcb	0
		fdb	donew
		fcn	"ASM"
		fcb	'A
		fdb	doasm
		fcn	"RUN"
		fcb	'R
		fdb	dorun
		fcn	"CSAVE"
		fcb	0
		fdb	dosave
		fcn	"CLOAD"
		fcb	0
		fdb	doload
		fcn	"CSAVEM"
		fcb	0
		fdb	dosavm
		fcn	"SYM"
		fcb	0
		fdb	dosym
		fcn	"MEM"
		fcb	'M
		fdb	domem
		fcn	"UNASM"
		fcb	'U
		fdb	dodis
		fcn	"GO"
		fcb	'G
		fdb	dogo
		fcn	"BP"
		fcb	0
		fdb	dobp
		fcn	"NOBP"
		fcb	0
		fdb	donobp
		fcn	"TRACE"
		fcb	'T
		fdb	dotrace
		fcn	"CONT"
		fcb	'C
		fdb	docont
		fcn	"REG"
		fcb	0
		fdb	doreg
		fcn	"BASIC"
		fcb	0
		fdb	dobasic
		fcn	"HELP"
		fcb	'H
		fdb	dohelp
		fcb	0

; range: "[n][-[m]]" → rlo, rhi. rgiven=1 אם נכתב משהו
range		ldd	#0
		std	rlo
		clr	rgiven
		ldd	#$ffff
		std	rhi
		lbsr	skipsp
		lda	,x
		cmpa	#'-
		beq	2F
		lbsr	isdig
		bcs	9F
		lbsr	getnum
		lbcs	badnum
		std	rlo
		std	rhi
		inc	rgiven
		lbsr	skipsp
		lda	,x
		cmpa	#'-
		bne	9F
2		leax	1,x
		inc	rgiven
		ldd	#$ffff
		std	rhi
		lbsr	skipsp
		lbsr	isdig
		bcs	9F
		lbsr	getnum
		lbcs	badnum
		std	rhi
9		rts

; LIST
dolist		bsr	range
		ldd	rlo
		lbsr	findln
1		lda	,x
		cmpa	#$ff
		beq	9F
		ldd	,x
		cmpd	rhi
		bhi	9F
		lbsr	prtrec
		lbsr	brkchk
		bcc	1B
9		rts

; prtrec: "120 LOOP LDA #1" ושורה חדשה. X עובר לשורה הבאה
prtrec		ldd	,x
		lbsr	prtdec
		lda	#$20
		lbsr	putc
		ldb	2,x
		leax	3,x
		tstb
		beq	2F
1		lda	,x+
		lbsr	putc
		decb
		bne	1B
2		lbra	crlf

; DELETE n / n-m
dodel		lbsr	range
		tst	rgiven
		beq	1F
		ldd	rlo
		lbsr	findln
2		lda	,x
		cmpa	#$ff
		beq	9F
		ldd	,x
		cmpd	rhi
		bhi	9F
		lbsr	delrec
		bra	2B
9		rts
1		ldx	#m_delhow
		lbra	cmderr

; EDIT n: השורה עולה לשורת הקלט, מתקנים, ENTER
doedit		lbsr	isdig
		bcs	1F
		lbsr	getnum
		lbcs	badnum
		std	lnum
		lbsr	findln
		bne	2F
		pshs	x
		ldd	lnum
		ldx	#inbuf
		lbsr	dec2buf
		lda	#$20
		sta	,x+
		puls	y
		ldb	2,y
		leay	3,y
		tstb
		beq	4F
3		lda	,y+
		sta	,x+
		decb
		bne	3B
4		tfr	x,d
		subd	#inbuf
		cmpb	#MAXIN
		bls	5F
		ldb	#MAXIN
5		stb	inlen
		lda	#'>
		lbsr	putc
		lbsr	getline
		bcs	9F
		ldx	#inbuf
		lbra	doline
9		rts
1		ldx	#m_edhow
		lbra	cmderr
2		ldx	#m_noline
		lbra	cmderr

; INSERT [n][,step]: המספרים מופיעים לבד. ENTER על שורה ריקה, או BREAK: סוף
doins		stx	args
		ldd	#10
		std	istep
		lbsr	lastln
		addd	#10
		std	inum
		ldx	args
		lbsr	isdig
		bcs	1F
		lbsr	getnum
		lbcs	badnum
		std	inum
		lbsr	skipsp
		lda	,x
		cmpa	#',
		bne	1F
		leax	1,x
		lbsr	getnum
		lbcs	badnum
		cmpd	#0
		lbeq	badnum
		std	istep
1		ldd	inum
		cmpd	#63999
		bhi	9F
		lbsr	findln
		beq	8F
		ldd	inum
		ldx	#inbuf
		lbsr	dec2buf
		lda	#$20
		sta	,x+
		tfr	x,d
		subd	#inbuf
		stb	inlen
		stb	ipre
		lbsr	getline
		bcs	9F
		ldb	inlen
		cmpb	ipre
		bls	9F
		ldx	#inbuf
		lbsr	doline
		ldd	inum
		addd	istep
		bcs	9F
		std	inum
		bra	1B
8		ldd	inum
		lbsr	numdec
		ldx	#m_exists
		lbsr	putmsg
		lbra	crlf
9		rts

; RENUM: 10, 20, 30...
doren		ldx	#SRC+4
		ldd	#10
1		pshs	d
		ldd	,x
		cmpd	#$ffff
		puls	d
		beq	9F
		std	,x
		addd	#10
		pshs	d
		ldb	2,x
		abx
		leax	3,x
		puls	d
		bra	1B
9		rts

; NEW: אחרי שאלה
donew		ldx	#m_sure
		lbsr	yesno
		bne	9F
		lbsr	srcnew
9		rts

; yesno: X = השאלה. Z=1 אם Y
yesno		lbsr	puts
		lbsr	getkey
		lbsr	upper
		pshs	a
		lbsr	putc
		lbsr	crlf
		puls	a
		cmpa	#'Y
		rts

; BASIC: חזרה ל-BASIC. ‏EXEC מחזיר לכאן, והטקסט עוד כאן
dobasic		lbsr	unplant
		ldx	oswi		; ה-SWI חוזר למה שהיה
		stx	$0106
		lda	oswi+2
		sta	$0108
		ldx	#m_bye
		lbsr	puts
		ldd	curpos
		std	<BCURS
		lds	bassp
		andcc	#$af
		rts

dohelp		ldx	#t_help
		lbsr	puts
		lbsr	getkey
		lbsr	crlf
		ldx	#t_help2
		lbra	puts

; ASM / RUN
doasm		lbsr	skipsp		; ASM L: רשימה עם הכתובות והבתים
		lda	,x
		lbsr	upper
		cmpa	#'L
		bne	1F
		inc	listf
1		lbsr	asmall
		clr	listf
		lbra	asmsum

; SYM: מתרגמים, ואז כל השמות והערכים שלהם, שניים בשורה
dosym		lbsr	asmall
		ldd	errcnt
		lbne	asmsum
		ldu	#SYMTAB
		cmpu	symend
		bne	1F
		ldx	#m_nosym
		lbsr	puts
		lbra	crlf
1		cmpu	symend
		bhs	8F
		ldb	#10
2		lda	,u+
		bne	3F
		lda	#$20
3		lbsr	putc
		decb
		bne	2B
		ldx	#t_spdol
		lbsr	puts
		ldd	,u
		lbsr	prthex4
		lda	#$20
		lbsr	putc
		leau	SYLEN-10,u
		lda	curpos+1
		anda	#31
		bne	1B
		lbsr	brkchk
		bcc	1B
8		lda	curpos+1
		anda	#31
		beq	9F
		lbsr	crlf
9		rts
dorun		lbsr	asmall
		ldd	errcnt
		beq	1F
		lbra	asmsum
1		tst	anyad
		bne	2F
		ldx	#m_empty
		lbsr	puts
		lbra	crlf
2
runat		lbsr	cls			; כמו CLS:EXEC בפינת הלמידה: התוכנית מתחילה במסך נקי
		clr	stopped
		lbsr	plantbp
		lds	bassp			; התוכנית רצה על המחסנית של BASIC, ו-RTS שלה חוזר ל-runret
		ldd	#runret
		pshs	d
		andcc	#$af
		jmp	[entry]
runret		lds	#ostktop
		lbsr	unplant
		clr	stopped
		clra
		tfr	a,dp
		andcc	#$af
		lbsr	textmode
		ldx	#SCREND-32		; מה שהתוכנית כתבה נשאר על המסך עד שלוחצים מקש (הסמן מהבהב למטה)
		stx	curpos
		clr	justw
		lbsr	getkey
		lbsr	crlf
		lbsr	srcchk		; תוכנית שציירה גרפיקה מחקה את הטקסט?
		tst	srclost
		beq	1F
		ldx	#m_lost
		lbsr	putmsg
		lbsr	crlf
1		ldx	#m_back
		lbsr	puts
		lbsr	crlf
		lbra	main

; textmode: מסך הטקסט ב-$0400, כמו אחרי הדלקה
textmode	lda	$ff22
		anda	#$07
		sta	$ff22
		sta	$ffc0
		sta	$ffc2
		sta	$ffc4
		sta	$ffc6
		sta	$ffc9
		sta	$ffca
		sta	$ffcc
		sta	$ffce
		sta	$ffd0
		sta	$ffd2
		rts

; asmsum: מה יצא
asmsum		ldd	errcnt
		beq	3F
		cmpd	#1
		bne	1F
		ldx	#m_err1
		lbsr	puts
		lbra	crlf
1		lbsr	prtdec
		ldx	#m_errs
		lbsr	puts
		lbra	crlf
3		tst	anyad
		bne	4F
		ldx	#m_nobytes
		lbsr	puts
		lbra	crlf
4		ldx	#m_ok
		lbsr	puts
		ldd	minad
		lbsr	prthex4
		lda	#'-
		lbsr	putc
		lda	#'$
		lbsr	putc
		ldd	maxad
		subd	#1
		lbsr	prthex4
		lda	#',
		lbsr	putc
		lda	#$20
		lbsr	putc
		ldd	nbytes
		lbsr	prtdec
		ldx	#m_bytes
		lbsr	puts
		lbsr	crlf
		ldx	#m_start
		lbsr	puts
		ldd	entry
		lbsr	prthex4
		lbra	crlf

; ---------- הקלטת / tape ----------
; getname: X → השם (אפשר במרכאות). fname = 8 תווים עם רווחים. Z=1 אם אין שם
getname		ldy	#fname
		ldb	#8
		lda	#$20
1		sta	,y+
		decb
		bne	1B
		lbsr	skipsp
		lda	,x
		cmpa	#$22
		bne	2F
		leax	1,x
2		ldy	#fname
		clrb
3		lda	,x+
		beq	4F
		cmpa	#$22
		beq	4F
		cmpb	#8
		bhs	3B
		lbsr	upper
		sta	,y+
		incb
		bra	3B
4		tstb
		rts

; CSAVE NAME: הטקסט (סוג 2, נטען ל-SRC, מופעל ב-start). CSAVEM NAME: התוכנית המתורגמת, כמו CSAVEM של BASIC
dosave		bsr	getname
		bne	1F
		ldx	#t_defnm
		lbsr	setfn
1		ldd	#start
		std	wexec
		ldd	#SRC
		std	wfrom
		ldd	srcend
		addd	#2
		std	wto
		bra	tapewr
dosavm		lbsr	getname
		bne	1F
		ldx	#t_defpg
		lbsr	setfn
1		lbsr	asmall
		ldd	errcnt
		lbne	asmsum
		tst	anyad
		bne	2F
		ldx	#m_nobytes
		lbsr	puts
		lbra	crlf
2		ldd	entry
		std	wexec
		ldd	minad
		std	wfrom
		ldd	maxad
		std	wto
; tapewr: כותרת (fname, סוג 2, wexec, wfrom) ואחריה הבתים מ-wfrom עד wto
tapewr		ldx	#m_rec
		lbsr	puts
		lbsr	prtfn
		lbsr	crlf
		ldx	#TBUF
		ldy	#fname
		ldb	#8
2		lda	,y+
		sta	,x+
		decb
		bne	2B
		lda	#2
		sta	,x+
		clr	,x+
		clr	,x+
		ldd	wexec
		std	,x++
		ldd	wfrom
		std	,x
		jsr	[WRLDR]
		ldx	#TBUF
		stx	<BLKADR
		clr	<BLKTYP
		lda	#15
		sta	<BLKLEN
		jsr	[BLKOUT]
		jsr	MOTOFF
		jsr	[WRLDR]
		ldx	wfrom
		stx	sptr
3		ldd	wto
		subd	sptr
		beq	5F
		cmpd	#255
		bls	4F
		ldd	#255
4		stb	<BLKLEN
		lda	#1
		sta	<BLKTYP
		ldx	sptr
		stx	<BLKADR
		abx
		stx	sptr
		jsr	[BLKOUT]
		bra	3B
5		lda	#$ff
		sta	<BLKTYP
		clr	<BLKLEN
		ldx	#TBUF
		stx	<BLKADR
		jsr	[BLKOUT]
		jsr	MOTOFF
		andcc	#$af
		ldx	#m_saved
		lbsr	puts
		lbra	crlf

; setfn: 8 תווים מ-X לשם הקלטת
setfn		ldy	#fname
		ldb	#8
1		lda	,x+
		sta	,y+
		decb
		bne	1B
		rts

; CLOAD [NAME]: מחפשים כותרת (עם השם, אם נכתב), בודקים שזו קלטת של האסמבלר, וקוראים את הטקסט
doload		lbsr	getname
		pshs	cc
		ldx	srcend
		cmpx	#SRC+4
		beq	1F
		ldx	#m_replac
		lbsr	yesno
		beq	1F
		puls	cc,pc
1		puls	cc
		tfr	cc,a
		anda	#4
		sta	anynm		; 4 = בלי שם: כל קלטת
		ldx	#m_search
		lbsr	puts
		lbsr	crlf
2		jsr	[CSRDON]
3		ldx	#TBUF
		stx	<BLKADR
		jsr	[BLKIN]
		tst	<BLKRES
		bne	2B
		lda	<BLKTYP
		bne	3B
		jsr	MOTOFF
		ldx	#m_found
		lbsr	puts
		ldx	#TBUF
		ldb	#8
4		lda	,x+
		lbsr	putc
		decb
		bne	4B
		lbsr	crlf
		tst	anynm
		bne	6F
		ldx	#TBUF
		ldy	#fname
		ldb	#8
5		lda	,x+
		cmpa	,y+
		bne	2B
		decb
		bne	5B
6		lda	TBUF+8
		cmpa	#2
		bne	notsrc
		ldd	TBUF+13
		cmpd	#SRC
		beq	61F
		cmpd	#SRCOLD
		bne	notsrc
61
		ldx	#SRC
		stx	sptr
		jsr	[CSRDON]
7		ldx	sptr
		cmpx	#SRCTOP-255
		bhi	toobig
		stx	<BLKADR
		jsr	[BLKIN]
		tst	<BLKRES
		bne	tperr
		lda	<BLKTYP
		cmpa	#$ff
		beq	8F
		cmpa	#1
		bne	tperr
		ldb	<BLKLEN
		ldx	sptr
		abx
		stx	sptr
		bra	7B
8		jsr	MOTOFF
		andcc	#$af
		lbsr	srcchk
		ldx	#m_loaded
		lbsr	puts
		lbra	crlf
notsrc		ldx	#m_notsrc
		bra	9F
toobig		ldx	#m_toobig
		bra	9F
tperr		ldx	#m_tperr
9		pshs	x
		jsr	MOTOFF
		andcc	#$af
		lbsr	srcchk
		puls	x
		lbra	cmderr

prtfn		ldx	#fname
		ldb	#8
1		lda	,x+
		lbsr	putc
		decb
		bne	1B
		rts

; ================= המוניטור / the monitor =================
; getaddr: X → ביטוי עד רווח (כמו באסמבלר: $2EE1, LOOP, LOOP+2). D = הערך. C=1 ו-X = הודעה אם יש שגיאה
getaddr		ldy	#ebuf
1		lda	,x
		beq	2F
		cmpa	#$20
		beq	2F
		sta	,y+
		leax	1,x
		bra	1B
2		clr	,y
		stx	gptr
		lda	#2
		sta	pass
		ldd	#$ffff
		std	curln
		ldx	#ebuf
		lbsr	expr
		bcs	9F
		ldx	gptr
		ldd	tv+1
		andcc	#$fe
9		rts

; MEM $2EE1: שמונה שורות של 8 בתים. MEM לבד: ממשיכים. MEM $2EE1 1 2 $41: כותבים בתים, ומראים את השורה
domem		lbsr	skipsp
		tst	,x
		beq	3F
		lbsr	getaddr
		lbcs	cmderr
		std	maddr
		std	mstart
		lbsr	skipsp
		tst	,x
		beq	3F
1		lbsr	getaddr
		lbcs	cmderr
		lbsr	rng8
		bcc	2F
		ldx	#m_big8
		lbra	cmderr
2		ldy	maddr
		lda	tv+2
		sta	,y+
		sty	maddr
		lbsr	skipsp
		tst	,x
		bne	1B
		ldd	mstart
		std	maddr
		lda	#1
		bra	4F
3		lda	#8
4		sta	dcnt
5		ldd	maddr
		lbsr	prthex4
		ldx	maddr
		ldb	#8
6		lda	#$20
		lbsr	putc
		lda	,x+
		lbsr	prthex2
		decb
		bne	6B
		stx	maddr
		lbsr	crlf
		lbsr	brkchk
		bcs	9F
		dec	dcnt
		bne	5B
9		rts

; GO $2EE1: מריצים מכתובת, בלי לתרגם. GO לבד: מההתחלה של התרגום האחרון
dogo		lbsr	skipsp
		tst	,x
		beq	1F
		lbsr	getaddr
		lbcs	cmderr
		std	entry
1		lbra	runat

; UNASM $2EE1: הבתים בחזרה לפקודות, 12 שורות. UNASM לבד: ממשיכים
dodis		lbsr	skipsp
		tst	,x
		beq	1F
		lbsr	getaddr
		lbcs	cmderr
		std	daddr
1		lda	#12
		sta	dcnt
2		lbsr	disone
		lbsr	brkchk
		bcs	9F
		dec	dcnt
		bne	2B
9		rts

M_INH		equ	0
M_IMM		equ	1
M_DIR		equ	2
M_IDX		equ	3
M_EXT		equ	4
M_REL		equ	5
M_LREL		equ	6
M_STK		equ	7
M_REG		equ	8
clsmode		fcb	M_INH,0,0,M_IMM,M_REL,M_LREL,M_IDX,M_STK,M_REG

; dfind: dop + dpage → dent (הפקודה בטבלה) ו-dmode. Z=1 אם נמצא
dfind		ldu	#optab
1		tst	,u
		beq	8F
		lda	OP_F,u
		anda	#3
		cmpa	dpage
		bne	7F
		lda	OP_C,u
		ldb	OP_O,u
		cmpa	#C_ACC
		bne	3F
		lda	OP_F,u
		bita	#F_NOI
		bne	2F
		cmpb	dop
		beq	fimm
2		addb	#$10
		cmpb	dop
		beq	fdir
		addb	#$10
		cmpb	dop
		beq	fidx
		addb	#$10
		cmpb	dop
		beq	fext
		bra	7F
3		cmpa	#C_MEM
		bne	4F
		cmpb	dop
		beq	fdir
		addb	#$60
		cmpb	dop
		beq	fidx
		addb	#$10
		cmpb	dop
		beq	fext
		bra	7F
4		cmpb	dop
		bne	7F
		ldx	#clsmode
		ldb	a,x
		bra	fset
7		leau	OPLEN,u
		bra	1B
8		andcc	#$fb
		rts
fimm		ldb	#M_IMM
		bra	fset
fdir		ldb	#M_DIR
		bra	fset
fidx		ldb	#M_IDX
		bra	fset
fext		ldb	#M_EXT
fset		stb	dmode
		stu	dent
		orcc	#4
		rts

; הטקסט של הפקודה נבנה ב-dtext
dput		pshs	y
		ldy	dtp
		sta	,y+
		sty	dtp
		puls	y,pc
dputs		lda	,x+
		beq	1F
		bsr	dput
		bra	dputs
1		rts
dhx		anda	#$0f
		adda	#'0
		cmpa	#'9
		bls	1F
		adda	#7
1		bra	dput
dhex2		pshs	a
		lda	#'$
		bsr	dput
		lda	,s
		lsra
		lsra
		lsra
		lsra
		bsr	dhx
		puls	a
		bra	dhx
dhex4		pshs	b
		pshs	a
		lda	#'$
		bsr	dput
		lda	,s
		lsra
		lsra
		lsra
		lsra
		bsr	dhx
		puls	a
		bsr	dhx
		lda	,s
		lsra
		lsra
		lsra
		lsra
		bsr	dhx
		puls	a
		bra	dhx
; ddec: D כמספר עם סימן
ddec		tsta
		bpl	1F
		pshs	d
		lda	#'-
		bsr	dput
		puls	d
		coma
		comb
		addd	#1
1		ldx	#argbuf
		lbsr	dec2buf
		ldx	#argbuf
		bra	dputs
; dbyte: הבית הבא מהזיכרון ל-A. dword: שני בתים ל-D
dbyte		ldx	dptr
		lda	,x+
		stx	dptr
		rts
dword		ldx	dptr
		ldd	,x++
		stx	dptr
		rts

; disone: שורה אחת: כתובת, בתים, פקודה, אופרנד
disone		ldx	daddr
		stx	dstart
		ldy	#dtext
		sty	dtp
		clr	dpage
		lda	,x+
		cmpa	#$10
		bne	1F
		ldb	#1
		bra	2F
1		cmpa	#$11
		bne	3F
		ldb	#2
2		stb	dpage
		lda	,x+
3		sta	dop
		stx	dptr
		lbsr	dfind
		beq	4F
		ldx	dstart		; לא פקודה: FCB של הבית הראשון
		leax	1,x
		stx	dptr
		ldx	#t_fcb
		stx	dname
		lda	[dstart]
		lbsr	dhex2
		lbra	dline
4		ldu	dent
		stu	dname
		lda	dmode
		lsla
		ldx	#dmodes
		jmp	[a,x]
dmodes		fdb	dline,dimm,ddir,didx,dext,drel,dlrel,dstk,dreg

dimm		lda	#'#
		lbsr	dput
		ldu	dent
		lda	OP_C,u
		cmpa	#C_ACC
		bne	1F
		lda	OP_F,u
		bita	#F_W
		beq	1F
		lbsr	dword
		lbsr	dhex4
		lbra	dline
1		lbsr	dbyte
		lbsr	dhex2
		lbra	dline
ddir		lda	#'<
		lbsr	dput
		lbsr	dbyte
		lbsr	dhex2
		lbra	dline
dext		lbsr	dword
		tsta			; מתחת ל-$100: עם > כדי שיתורגם שוב לאותה צורה
		bne	1F
		pshs	d
		lda	#'>
		lbsr	dput
		puls	d
1		lbsr	dhex4
		lbra	dline
drel		lbsr	dbyte
		tfr	a,b
		sex
		addd	dptr
		std	dtgt
		lbsr	dhex4
		lbra	dline
dlrel		lbsr	dword
		addd	dptr
		std	dtgt
		lbsr	dhex4
		lbra	dline
; PSHS/PULS: רשימת המגירות, בסדר הקבוע
dstk		lbsr	dbyte
		sta	dpb
		ldx	#stknm
		ldb	#1
		clr	dcom
1		bitb	dpb
		beq	3F
		tst	dcom
		beq	2F
		lda	#',
		lbsr	dput
2		inc	dcom
		pshs	x,b
		cmpb	#$40		; U או S: הצד השני של הערימה
		bne	21F
		ldu	dent
		lda	OP_F,u
		bita	#F_U
		beq	21F
		ldx	#t_s
21		lbsr	dputs
		puls	x,b
3		leax	3,x
		lslb
		bne	1B
		tst	dcom
		lbne	dline
		lda	#'#
		lbsr	dput
		clra
		lbsr	dhex2
		lbra	dline
stknm		fcn	"CC"
		fcn	"A"
		fcb	0
		fcn	"B"
		fcb	0
		fcn	"DP"
		fcn	"X"
		fcb	0
		fcn	"Y"
		fcb	0
		fcn	"U"
		fcb	0
		fcn	"PC"
t_s		fcn	"S"
; TFR/EXG: שתי מגירות
dreg		lbsr	dbyte
		pshs	a
		lsra
		lsra
		lsra
		lsra
		bsr	rname
		lda	#',
		lbsr	dput
		puls	a
		anda	#$0f
		bsr	rname
		lbra	dline
rname		ldx	#rnames
		lsla
		leax	a,x
		lda	,x+
		lbsr	dput
		lda	,x
		cmpa	#$20
		beq	1F
		lbsr	dput
1		rts
rnames		fcc	"D X Y U S PC? ? A B CCDP? ? ? ? "

; אצבע: הבית שאחרי הפקודה אומר איך
didx		lbsr	dbyte
		sta	dpb
		lsra
		lsra
		lsra
		lsra
		lsra
		anda	#3
		ldx	#t_xyus
		lda	a,x
		sta	dreg_
		lda	dpb
		bmi	1F
		anda	#$1f		; 5 סיביות עם סימן
		bita	#$10
		beq	d5pos
		ora	#$e0
d5pos		tfr	a,b
		sex
		lbsr	ddec
		lbra	dix
1		clr	iind_
		bita	#$10
		beq	2F
		inc	iind_
		lda	#'[
		lbsr	dput
2		lda	dpb
		anda	#$0f
		lsla
		ldx	#ditab
		jmp	[a,x]
ditab		fdb	di0,di1,di2,di3,di4,di5,di6,diq,di8,di9,diq,dib,dic,did,diq,dif
di0		lbsr	dcomr
		lda	#'+
		lbsr	dput
		lbra	dend
di1		lbsr	dcomr
		lda	#'+
		lbsr	dput
		lbsr	dput
		lbra	dend
di2		lda	#',
		lbsr	dput
		lda	#'-
		lbsr	dput
		lda	dreg_
		lbsr	dput
		lbra	dend
di3		lda	#',
		lbsr	dput
		lda	#'-
		lbsr	dput
		lbsr	dput
		lda	dreg_
		lbsr	dput
		lbra	dend
di4		lbsr	dcomr
		lbra	dend
di5		lda	#'B
		bra	diab
di6		lda	#'A
		bra	diab
dib		lda	#'D
diab		lbsr	dput
		lbsr	dcomr
		lbra	dend
di8		lbsr	dbyte
		tfr	a,b
		sex
		cmpd	#0		; 0, או 5 סיביות בלי סוגריים: עם <
		beq	1F
		tst	iind_
		bne	2F
		cmpd	#-16
		blt	2F
		cmpd	#15
		bgt	2F
1		pshs	d
		lda	#'<
		lbsr	dput
		puls	d
2		lbsr	ddec
		lbsr	dcomr
		lbra	dend
di9		lbsr	dword
		cmpd	#-128		; נכנס בבית אחד: עם >
		blt	1F
		cmpd	#127
		bgt	1F
		pshs	d
		lda	#'>
		lbsr	dput
		puls	d
1		lbsr	ddec
		lbsr	dcomr
		lbra	dend
dic		lbsr	dbyte
		tfr	a,b
		sex
		addd	dptr
		bra	dpcr
did		lbsr	dword
		addd	dptr
		pshs	d		; היה נכנס בבית אחד? אז >
		subd	dptr
		addd	#1
		cmpd	#-128
		blt	1F
		cmpd	#127
		bgt	1F
		lda	#'>
		lbsr	dput
1		puls	d
dpcr		lbsr	dhex4
		ldx	#t_pcr
		lbsr	dputs
		lbra	dend
dif		lbsr	dword
		lbsr	dhex4
		lbra	dend
diq		lda	#'?
		lbsr	dput
dend		lda	dpb
		bita	#$10
		lbeq	dline
		lda	#']
		lbsr	dput
		lbra	dline
dix		lbsr	dcomr
		lbra	dline
dcomr		lda	#',
		lbsr	dput
		lda	dreg_
		lbra	dput
t_xyus		fcc	"XYUS"
t_pcr		fcn	",PCR"
t_fcb		fcn	"FCB"

; dline: מדפיסים את השורה: כתובת, עד 4 בתים, השם, האופרנד
dline		tst	dquiet		; הדיבאגר רק רוצה את האורך ואת היעד
		beq	dline2
		ldx	dptr
		stx	daddr
		rts
dline2		ldd	dstart
		lbsr	prthex4
		lda	#$20
		lbsr	putc
		ldd	dptr
		subd	dstart
		stb	dlen
		ldx	dstart
		ldb	#4
1		tst	dlen
		beq	2F
		lda	,x+
		lbsr	prthex2
		dec	dlen
		decb
		bne	1B
		tst	dlen
		beq	3F
		lda	#'+
		lbsr	putc
		bra	4F
2		lda	#$20		; ריפוד: 2 רווחים לבית חסר
		lbsr	putc
		lbsr	putc
		decb
		bne	2B
3		lda	#$20
		lbsr	putc
4		ldx	dname
		ldb	#5
5		lda	,x+
		beq	6F
		lbsr	putc
		decb
		bne	5B
6		incb			; עד 6 עמודות לשם
7		lda	#$20
		lbsr	putc
		decb
		bne	7B
		ldx	#dtext
8		cmpx	dtp
		bhs	9F
		lda	,x+
		lbsr	putc
		bra	8B
9		ldx	dptr
		stx	daddr
		lbra	crlf

; ================= המתרגם / the assembler =================
; asmall: מעבר ראשון, מעברים עד שהמקומות לא זזים, ומעבר אחרון שכותב לזיכרון ומדווח על שגיאות
asmall		ldd	#SYMTAB
		std	symend
		clr	lstop
		lda	#1
		sta	pass
		clr	emit
		lbsr	apass
		lda	#2
		sta	pass
		lda	#9
		sta	iter
1		clr	changed
		lbsr	apass
		tst	changed
		beq	2F
		dec	iter
		bne	1B
2		inc	emit
		lbsr	apass
		; ההתחלה: השם @ אם יש, אחרת הכתובת שאחרי END, אחרת הבית הראשון
		ldx	#sname
		lbsr	clrnm
		lda	#'@
		sta	sname
		lbsr	symfind
		bne	3F
		ldd	SY_V,u
		bra	5F
3		tst	entset
		beq	4F
		ldd	entry
		bra	5F
4		ldd	minad
5		std	entry
		rts

; apass: מעבר אחד על כל השורות
apass		ldd	#ORG0
		std	apc
		std	minad
		std	maxad
		clr	adp
		clr	ended
		clr	entset
		clr	anyad
		ldd	#0
		std	errcnt
		std	nbytes
		ldx	#SRC+4
		stx	recp
1		ldx	recp
		ldd	,x
		cmpd	#$ffff
		beq	9F
		std	curln
		ldb	2,x
		leay	3,x
		ldu	#lbuf
		tstb
		beq	3F
2		lda	,y+
		sta	,u+
		decb
		bne	2B
3		clr	,u
		sty	recp
		ldd	apc
		std	lpc
		clr	obn
		lbsr	aline
		tst	emit
		beq	1B
		tst	listf
		beq	1B
		lbsr	prtlst
		bra	1B
9		rts

; prtlst: שורה ברשימה (ASM L): הכתובת, עד 3 בתים, ואז השורה עצמה
prtlst		tst	lstop
		bne	9F
		ldd	lpc
		lbsr	prthex4
		lda	#$20
		lbsr	putc
		ldb	obn
		cmpb	#3
		bls	1F
		ldb	#3
1		stb	ltmp
		ldx	#obuf
		tstb
		beq	3F
2		lda	,x+
		lbsr	prthex2
		decb
		bne	2B
3		ldb	#4		; ריפוד: 2 רווחים לכל בית חסר, ועוד 1
		subb	ltmp
		lslb
		decb
4		lda	#$20
		lbsr	putc
		decb
		bne	4B
		ldd	curln
		lbsr	prtdec
		lda	#$20
		lbsr	putc
		ldx	#lbuf
		lbsr	puts
		lbsr	crlf
		lbsr	brkchk
		bcc	9F
		inc	lstop
9		rts

; lerr: שגיאה בשורה. במעבר האחרון: מספר השורה וההודעה (X, עם % = errarg). ואז השורה נגמרת
lerr		tst	emit
		beq	1F
		ldd	errcnt
		addd	#1
		std	errcnt
		pshs	x
		ldd	curln
		lbsr	prtdec
		lda	#$20
		lbsr	putc
		puls	x
		lbsr	putmsg
		lbsr	crlf
		lbsr	brkchk
1		lds	lsp
		rts

; aline: שורה אחת
aline		sts	lsp
		tst	ended
		lbne	9F
		ldx	#lbuf
		lbsr	skipsp
		lda	,x
		lbeq	9F
		cmpa	#'*
		lbeq	9F
		cmpa	#';
		lbeq	9F
		clr	haslab
		ldx	#lbuf
		lda	,x
		cmpa	#$20
		lbeq	alrest
		; שם של מקום: עד הרווח הראשון
		ldy	#labx
		clrb
1		lda	,x
		beq	2F
		cmpa	#$20
		beq	2F
		lbsr	upper
		cmpb	#32
		bhs	11F
		sta	b,y
		incb
11		leax	1,x
		bra	1B
2		clr	b,y
		stx	argp
		decb
		lda	b,y
		cmpa	#':
		bne	21F
		clr	b,y
		bra	22F
21		incb
22		stb	lablen
		; השם הוא פקודה, והמילה שאחריו לא? אז חסר רווח בהתחלה
		ldx	#labx
		lbsr	isopdir
		bne	3F
		ldx	argp
		lbsr	skipsp
		ldy	#tok
		lbsr	getword
		ldx	#tok
		lbsr	isopdir
		beq	3F
		ldx	#m_space
		ldd	#labx
		std	errarg
		lbra	lerr
3		ldx	#labx
		lda	,x+
		lbsr	isnst
		bcs	badnm
4		lda	,x+
		beq	5F
		lbsr	isnch
		bcs	badnm
		bra	4B
5		ldx	#labx
		ldu	#resv
		clrb
		lbsr	tfind
		beq	resnm
		lda	lablen
		cmpa	#10
		bhi	longnm
		ldx	#lab
		lbsr	clrnm
		ldy	#labx
6		lda	,y+
		beq	7F
		sta	,x+
		bra	6B
7		inc	haslab
		ldx	argp
		bra	alrest
badnm		ldx	#m_badnm
		bra	8F
resnm		ldx	#m_resnm
		bra	8F
longnm		ldx	#m_long
8		ldd	#labx
		std	errarg
		lbra	lerr
alrest		lbsr	skipsp
		ldy	#opn
		lbsr	getword
		lbsr	skipsp
		stx	argp
		tst	opn
		bne	1F
		ldd	apc
		lbra	defk		; רק שם: המקום שלו כאן
1		ldx	#opn
		ldu	#dirtab
		ldb	#3
		lbsr	tfind
		lbeq	adir
		ldd	apc
		lbsr	defk
		ldx	#opn
		lbsr	opfind
		lbeq	ainst
		ldx	#m_unkop
		ldd	#opn
		std	errarg
		lbra	lerr
9		rts

; ---------- השמות / names ----------
; symfind: X = שם של 10 בתים (מרופד באפסים). U = הרשומה, Z=1 אם נמצא
symfind		ldu	#SYMTAB
1		cmpu	symend
		bhs	8F
		lda	,x
		cmpa	,u
		bne	3F
		ldb	#1
2		lda	b,x
		cmpa	b,u
		bne	3F
		incb
		cmpb	#10
		blo	2B
		orcc	#4
		rts
3		leau	SYLEN,u
		bra	1B
8		andcc	#$fb
		rts

; define: השם שבתחילת השורה מקבל את D. defk: ערך ידוע. defu: לא ידוע עדיין (0)
defk		pshs	a
		lda	#1
		sta	dkn
		puls	a
		bra	define
defu		clr	dkn
		ldd	#0
define		tst	haslab
		lbeq	9F
		std	dval
		pshs	x,y,u
		ldx	#lab
		lbsr	symfind
		bne	5F
		lda	pass
		cmpa	#1
		beq	8F		; מעבר ראשון, שם שכבר יש: המעבר האחרון ידווח
		ldd	SY_L,u
		cmpd	curln
		bne	6F
		ldd	SY_V,u
		cmpd	dval
		beq	4F
		inc	changed
		ldd	dval
		std	SY_V,u
4		lda	#1
		sta	SY_K,u
		bra	8F
5		lda	pass
		cmpa	#1
		bne	7F
		ldu	symend
		cmpu	#SYMTOP
		bhs	7F
		ldb	#10
		ldx	#lab
51		lda	,x+
		sta	,u+
		decb
		bne	51B
		ldd	dval
		std	,u++
		ldd	curln
		std	,u++
		lda	dkn
		sta	,u+
		clr	,u+
		stu	symend
		bra	8F
6		tst	emit
		beq	8F
		ldx	#m_twice
		ldd	#labx
		std	errarg
		lbra	lerr
7		tst	emit
		beq	8F
		ldx	#m_full
		lbra	lerr
8		puls	x,y,u
9		rts

; ---------- טבלאות / tables ----------
; tfind: X = מילה, U = טבלה של [שם, 0, B בתים]. U = הבתים, Z=1 אם נמצא
tfind		pshs	b
1		tst	,u
		beq	8F
		pshs	x
2		lda	,u
		cmpa	,x
		bne	3F
		leau	1,u
		leax	1,x
		tsta
		bne	2B
		puls	x
		puls	b
		orcc	#4
		rts
3		puls	x
4		lda	,u+
		bne	4B
		ldb	,s
		leau	b,u
		bra	1B
8		puls	b
		andcc	#$fb
		rts

; opfind: X = מילה. U = הפקודה בטבלה, Z=1 אם נמצא
opfind		ldu	#optab
1		tst	,u
		beq	8F
		pshs	x
		clrb
2		lda	,x
		cmpa	b,u
		bne	3F
		tsta
		beq	4F
		leax	1,x
		incb
		cmpb	#5
		blo	2B
		tst	,x
		bne	3F
4		puls	x
		stu	opp
		orcc	#4
		rts
3		puls	x
		leau	OPLEN,u
		bra	1B
8		andcc	#$fb
		rts

; isopdir: Z=1 אם המילה ב-X היא פקודה או הוראה
isopdir		lbsr	opfind
		beq	9F
		ldu	#dirtab
		ldb	#3
		lbsr	tfind
9		rts

; הוראות: שם, האם להגדיר את השם כאן קודם (1), והכתובת
dirtab		fcn	"ORG"
		fcb	0
		fdb	d_org
		fcn	"EQU"
		fcb	0
		fdb	d_equ
		fcn	"SET"
		fcb	0
		fdb	d_equ
		fcn	"FCB"
		fcb	1
		fdb	d_fcb
		fcn	"FDB"
		fcb	1
		fdb	d_fdb
		fcn	"FCC"
		fcb	1
		fdb	d_fcc
		fcn	"RMB"
		fcb	1
		fdb	d_rmb
		fcn	"END"
		fcb	1
		fdb	d_end
		fcn	"SETDP"
		fcb	1
		fdb	d_setdp
		fcn	"NAM"
		fcb	1
		fdb	d_skip
		fcn	"TTL"
		fcb	1
		fdb	d_skip
		fcn	"OPT"
		fcb	1
		fdb	d_skip
		fcn	"PAGE"
		fcb	1
		fdb	d_skip
		fcn	"SPC"
		fcb	1
		fdb	d_skip
		fcb	0

resv		fcn	"A"
		fcn	"B"
		fcn	"D"
		fcn	"X"
		fcn	"Y"
		fcn	"U"
		fcn	"S"
		fcn	"PC"
		fcn	"PCR"
		fcn	"CC"
		fcn	"DP"
		fcb	0

stktab		fcn	"CC"
		fcb	1
		fcn	"A"
		fcb	2
		fcn	"B"
		fcb	4
		fcn	"D"
		fcb	6
		fcn	"DP"
		fcb	8
		fcn	"X"
		fcb	$10
		fcn	"Y"
		fcb	$20
		fcn	"U"
		fcb	$40
		fcn	"S"
		fcb	$40
		fcn	"PC"
		fcb	$80
		fcb	0

regtab		fcn	"D"
		fcb	0
		fcn	"X"
		fcb	1
		fcn	"Y"
		fcb	2
		fcn	"U"
		fcb	3
		fcn	"S"
		fcb	4
		fcn	"PC"
		fcb	5
		fcn	"A"
		fcb	8
		fcn	"B"
		fcb	9
		fcn	"CC"
		fcb	10
		fcn	"DP"
		fcb	11
		fcb	0

; ---------- הוראות / directives ----------
adir		lda	,u+
		beq	1F
		pshs	u
		ldd	apc
		lbsr	defk
		puls	u
1		jmp	[,u]

d_skip		rts

d_equ		tst	haslab
		bne	1F
		ldx	#m_neednm
		lbra	lerr
1		lbsr	getopnd
		ldx	#opnd
		lbsr	expr
		bcc	2F
		pshs	x
		ldd	#0
		lbsr	defk
		puls	x
		lbra	lerr
2		tst	eknown
		bne	3F
		lbra	defu
3		ldd	tv+1
		lbra	defk

d_org		lbsr	getopnd
		ldx	#opnd
		lbsr	expr
		bcs	1F
		tst	eknown
		beq	2F
		tst	efwd
		bne	2F
		ldd	tv+1
		std	apc
		lbra	defk
2		ldx	#m_org
1		pshs	x
		ldd	apc
		lbsr	defk
		puls	x
		lbra	lerr

d_setdp		lbsr	getopnd
		ldx	#opnd
		lbsr	exprj
		lda	tv+2
		sta	adp
		rts

d_end		inc	ended
		lbsr	getopnd
		tst	opnd
		beq	9F
		ldx	#opnd
		lbsr	exprj
		ldd	tv+1
		std	entry
		inc	entset
9		rts

d_rmb		lbsr	getopnd
		ldx	#opnd
		lbsr	expr
		lbcs	lerr
		tst	eknown
		beq	1F
		tst	efwd
		bne	1F
		lda	tv
		bmi	1F
		ldd	tv+1
		beq	9F
		lbsr	track
		ldd	tv+1
		addd	apc
		std	apc
9		rts
1		ldx	#m_rmb
		lbra	lerr

d_fcb		clr	isfdb
		bra	1F
d_fdb		lda	#1
		sta	isfdb
1		lbsr	getopnd
		tst	opnd
		bne	2F
		ldx	#m_fcbhow
		ldd	#opn
		std	errarg
		lbra	lerr
2		clr	obn
		ldx	#opnd
3		ldy	#ebuf
4		lda	,x
		beq	5F
		leax	1,x
		cmpa	#',
		beq	5F
		sta	,y+
		bra	4B
5		clr	,y
		sta	sterm
		stx	fptr
		ldx	#ebuf
		lbsr	exprj
		tst	isfdb
		bne	7F
		lbsr	rng8
		bcc	6F
		ldx	#m_fcbbig
		lbra	lerr
6		lda	tv+2
		lbsr	obput
		bra	8F
7		lda	tv+1
		lbsr	obput
		lda	tv+2
		lbsr	obput
8		lda	sterm
		beq	9F
		ldx	fptr
		bra	3B
9		lbra	aemit

d_fcc		clr	obn
		ldx	argp
		lda	,x+
		beq	8F
		sta	fdelim
		pshs	x
1		lda	,x+
		beq	7F
		cmpa	fdelim
		bne	1B
		puls	x
2		lda	,x+
		cmpa	fdelim
		beq	3F
		lbsr	obput
		bra	2B
3		lbra	aemit
7		puls	x
8		ldx	#m_fcc
		lbra	lerr

; getopnd: האופרנד, עד הרווח הראשון (לא בתוך 'c), לתוך opnd
getopnd		ldx	argp
		ldy	#opnd
1		lda	,x+
		beq	2F
		cmpa	#$20
		beq	2F
		sta	,y+
		cmpa	#''
		bne	1B
		lda	,x
		beq	2F
		sta	,y+
		leax	1,x
		bra	1B
2		clr	,y
		rts

; ---------- פקודות המעבד / instructions ----------
ainst		clr	obn
		ldu	opp
		lda	OP_C,u
		cmpa	#C_INH
		bne	1F
		lda	OP_O,u
		lbsr	opc
		lbra	aemit
1		lbsr	getopnd
		tst	opnd
		bne	2F
		ldx	#m_miss
		bra	opnerr
2		ldu	opp
		lda	OP_C,u
		cmpa	#C_REL
		lbeq	irel
		cmpa	#C_LREL
		lbeq	ilrel
		cmpa	#C_STK
		lbeq	istk
		cmpa	#C_REG
		lbeq	itfr
		lda	opnd
		cmpa	#'#
		lbeq	iimm
		; "NEG A": כותבים NEGA
		ldu	opp
		lda	OP_C,u
		cmpa	#C_MEM
		bne	3F
		lda	OP_O,u
		cmpa	#$0e
		beq	3F
		tst	opnd+1
		bne	3F
		lda	opnd
		lbsr	upper
		cmpa	#'A
		beq	ijoin
		cmpa	#'B
		beq	ijoin
3		lbsr	idxparse
		lbcs	aemit
		lbra	idirext
opnerr		ldd	#opn
		std	errarg
		lbra	lerr

ijoin		ldy	#ebuf
		ldx	#opn
1		ldb	,x+
		beq	2F
		stb	,y+
		bra	1B
2		sta	,y+
		clr	,y
		ldd	#ebuf
		std	errarg
		ldx	#m_join
		lbra	lerr

; opc: קוד הפקודה (A), עם $10 או $11 לפניו אם צריך
opc		pshs	a
		ldu	opp
		lda	OP_F,u
		bita	#F_P10
		beq	1F
		lda	#$10
		bsr	obput
1		lda	OP_F,u
		bita	#F_P11
		beq	2F
		lda	#$11
		bsr	obput
2		puls	a
obput		pshs	b,x
		ldx	#obuf
		ldb	obn
		cmpb	#63
		bhs	1F
		sta	b,x
		inc	obn
1		puls	b,x,pc

; oplen: B = אורך הקוד (1 או 2)
oplen		ldu	opp
		ldb	OP_F,u
		andb	#F_P10+F_P11
		beq	1F
		ldb	#2
		rts
1		ldb	#1
		rts

; aemit: הבתים של השורה לזיכרון (במעבר האחרון), והמקום מתקדם
aemit		ldb	obn
		beq	8F
		tst	emit
		beq	5F
		ldx	apc
		ldy	#obuf
1		cmpx	#USERLO
		blo	memerr
		cmpx	#USERHI
		bhs	memerr
		lda	,y+
		sta	,x+
		decb
		bne	1B
5		ldb	obn
		clra
		addd	nbytes
		std	nbytes
		ldb	obn
		clra
		lbsr	track
		ldb	obn
		clra
		addd	apc
		std	apc
8		rts
memerr		tfr	x,d
		lbsr	numhex
		ldx	#m_mem
		lbra	lerr

; track: D = אורך מ-apc: ההתחלה והסוף של מה שנכתב
track		addd	apc
		std	ttmp
		tst	anyad
		bne	1F
		ldd	apc
		std	minad
		ldd	ttmp
		std	maxad
		inc	anyad
		rts
1		ldd	apc
		cmpd	minad
		bhs	2F
		std	minad
2		ldd	ttmp
		cmpd	maxad
		bls	3F
		std	maxad
3		rts

; קוד לכל צורה: ישיר, אצבע, מורחב
dircode		ldu	opp
		lda	OP_O,u
		ldb	OP_C,u
		cmpb	#C_ACC
		bne	1F
		adda	#$10
1		rts
idxcode		ldu	opp
		lda	OP_O,u
		ldb	OP_C,u
		cmpb	#C_ACC
		bne	1F
		adda	#$20
		rts
1		cmpb	#C_MEM
		bne	2F
		adda	#$60
2		rts
extcode		ldu	opp
		lda	OP_O,u
		ldb	OP_C,u
		cmpb	#C_ACC
		bne	1F
		adda	#$30
		rts
1		adda	#$70
		rts

; # מספר
iimm		ldu	opp
		lda	OP_C,u
		cmpa	#C_IMM8
		beq	2F
		cmpa	#C_ACC
		bne	noimm
		lda	OP_F,u
		bita	#F_NOI
		bne	noimm
2		ldx	#opnd+1
		lbsr	exprj
		ldu	opp
		lda	OP_O,u
		lbsr	opc
		ldu	opp
		lda	OP_F,u
		bita	#F_W
		beq	3F
		lbsr	rng16
		bcs	big16
		lda	tv+1
		lbsr	obput
		lda	tv+2
		lbsr	obput
		lbra	aemit
3		lbsr	rng8
		bcs	big8
		lda	tv+2
		lbsr	obput
		lbra	aemit
noimm		ldx	#m_noimm
		lbra	opnerr
big8		ldx	#m_big8
		lbra	lerr
big16		ldx	#m_big16
		lbra	lerr

; קפיצה קצרה: עד 128 אחורה או 127 קדימה
irel		ldx	#opnd
		lbsr	exprj
		ldu	opp
		lda	OP_O,u
		lbsr	opc
		ldd	apc
		addd	#2
		lbsr	subpc
		lda	pass
		cmpa	#2
		blo	1F
		lbsr	rngs8
		bcc	1F
		ldx	#m_far
		lbra	opnerr
1		lda	tv+2
		lbsr	obput
		lbra	aemit

; קפיצה ארוכה
ilrel		ldx	#opnd
		lbsr	exprj
		ldu	opp
		lda	OP_O,u
		lbsr	opc
		ldb	obn
		clra
		addd	#2
		addd	apc
		lbsr	subpc
		lda	tv+1
		lbsr	obput
		lda	tv+2
		lbsr	obput
		lbra	aemit

; PSHS/PULS/PSHU/PULU
istk		clr	pbv
		lda	opnd
		cmpa	#'#
		bne	1F
		ldx	#opnd+1
		lbsr	exprj
		lda	tv+2
		sta	pbv
		bra	8F
1		ldx	#opnd
2		ldy	#tok
		lbsr	getreg
		stx	sptr
		ldx	#tok
		ldu	#stktab
		ldb	#1
		lbsr	tfind
		bne	badstk
		lda	,u
		sta	sbit
		ldu	opp
		lda	OP_F,u
		bita	#F_U
		beq	3F
		lda	#'U
		bra	4F
3		lda	#'S
4		cmpa	tok
		bne	5F
		tst	tok+1
		beq	badstk
5		lda	sbit
		bita	pbv
		bne	badstk
		ora	pbv
		sta	pbv
		ldx	sptr
		tst	sterm
		bne	2B
8		ldu	opp
		lda	OP_O,u
		lbsr	opc
		lda	pbv
		lbsr	obput
		lbra	aemit
badstk		ldx	#m_stk
		lbra	opnerr

; TFR/EXG
itfr		ldx	#opnd
		ldy	#tok
		lbsr	getreg
		tst	sterm
		beq	badreg
		stx	sptr
		ldx	#tok
		ldu	#regtab
		ldb	#1
		lbsr	tfind
		bne	badreg
		lda	,u
		sta	r1
		ldx	sptr
		ldy	#tok
		lbsr	getreg
		tst	sterm
		bne	badreg
		ldx	#tok
		ldu	#regtab
		ldb	#1
		lbsr	tfind
		bne	badreg
		lda	,u
		sta	r2
		eora	r1
		anda	#8
		bne	badsiz
		ldu	opp
		lda	OP_O,u
		lbsr	opc
		lda	r1
		lsla
		lsla
		lsla
		lsla
		ora	r2
		lbsr	obput
		lbra	aemit
badreg		ldx	#m_reg
		lbra	opnerr
badsiz		ldx	#m_size
		lbra	lerr

; getreg: X → מילה עד פסיק או סוף, באותיות גדולות, ל-Y (עד 8). sterm = מה עצר (פסיק או 0)
getreg		clrb
1		lda	,x
		beq	3F
		leax	1,x
		cmpa	#',
		beq	3F
		lbsr	upper
		cmpb	#8
		bhs	1B
		sta	b,y
		incb
		bra	1B
3		clr	b,y
		sta	sterm
		rts

; ישיר או מורחב: LDA $12 / LDA $1234 / LDA <X / LDA >X
idirext		ldx	#opnd
		clr	force
		lda	,x
		cmpa	#'<
		beq	1F
		cmpa	#'>
		bne	2F
1		sta	force
		leax	1,x
2		lbsr	exprj
		lbsr	rng16
		bcc	3F
		ldx	#m_bigad
		lbra	lerr
3		clr	hasde
		ldu	opp
		lda	OP_C,u
		cmpa	#C_ACC
		beq	4F
		cmpa	#C_MEM
		bne	5F
4		inc	hasde
5		clr	usedir
		lda	force
		cmpa	#'<
		beq	6F
		cmpa	#'>
		beq	7F
		tst	eknown
		beq	7F
		tst	efwd
		bne	7F
		lda	tv+1
		cmpa	adp
		bne	7F
		tst	hasde
		beq	7F
6		inc	usedir
7		tst	usedir
		beq	8F
		tst	hasde
		bne	71F
		ldx	#m_noshrt
		lbra	opnerr
71		lda	force
		cmpa	#'<
		bne	72F
		tst	eknown
		beq	72F
		lda	tv+1
		cmpa	adp
		beq	72F
		lda	pass
		cmpa	#2
		blo	72F
		ldd	tv+1
		lbsr	numhex
		ldx	#m_nopage
		lbra	lerr
72		lbsr	dircode
		lbsr	opc
		lda	tv+2
		lbsr	obput
		lbra	aemit
8		tst	hasde
		bne	81F
		ldx	#m_noext
		lbra	opnerr
81		lbsr	extcode
		lbsr	opc
		lda	tv+1
		lbsr	obput
		lda	tv+2
		lbsr	obput
		lbra	aemit

; ---------- אצבע / indexed ----------
; idxparse: C=0 אם האופרנד לא עם אצבע. C=1: הבתים כבר ב-obuf
idxparse	clr	iind
		clr	iindb
		ldx	#opnd
		ldy	#ibuf
		lda	,x
		cmpa	#'[
		bne	2F
		inc	iind
		lda	#$10
		sta	iindb
		leax	1,x
1		lda	,x+
		sta	,y+
		bne	1B
		leay	-2,y
		cmpy	#ibuf
		blo	nobr
		lda	,y
		cmpa	#']
		bne	nobr
		clr	,y
		lbsr	lastcom
		bne	4F
		; [כתובת]
		ldx	#ibuf
		lda	,x
		cmpa	#'<
		beq	11F
		cmpa	#'>
		bne	12F
11		leax	1,x
12		lbsr	exprj
		lda	#$9f
		sta	ipb
		lda	tv+1
		sta	ix1
		lda	tv+2
		sta	ix2
		lda	#2
		sta	ixn
		lbra	iout
nobr		ldx	#m_nobr
		lbra	lerr
2		lda	,x+
		sta	,y+
		bne	2B
		lbsr	lastcom
		bne	4F
		andcc	#$fe
		rts
4		clr	,x		; ibuf = מה שלפני הפסיק
		leax	1,x
		ldy	#tok
		lbsr	getword		; tok = מה שאחרי הפסיק
		lda	tok
		cmpa	#'-
		bne	5F
		; ,-X / ,--X
		lda	tok+1
		cmpa	#'-
		beq	41F
		lda	tok+1
		lbsr	ixreg
		bcs	42F
		tst	tok+2
		bne	42F
		lbsr	noleft
		tst	iind
		bne	noform
		lda	#$82
		bra	44F
41		lda	tok+2
		lbsr	ixreg
		bcs	42F
		tst	tok+3
		bne	42F
		lbsr	noleft
		lda	#$83
		ora	iindb
44		ora	ireg
		sta	ipb
		clr	ixn
		lbra	iout
42		lbra	comerr
5		; ,X+ / ,X++
		lda	tok+1
		cmpa	#'+
		bne	6F
		lda	tok
		lbsr	ixreg
		bcs	6F
		lda	tok+2
		beq	51F
		cmpa	#'+
		bne	6F
		tst	tok+3
		bne	6F
		lbsr	noleft
		lda	#$81
		ora	iindb
		bra	44B
51		lbsr	noleft
		tst	iind
		bne	noform
		lda	#$80
		bra	44B
noform		ldx	#m_noform
		lbra	lerr
6		; ,PCR / ,PC
		ldx	#tok
		ldu	#pctab
		clrb
		lbsr	tfind
		lbeq	ipcr
		; ,X ,Y ,U ,S
		lda	tok
		lbsr	ixreg
		lbcs	comerr
		tst	tok+1
		lbne	comerr
		lda	ibuf
		bne	7F
		lda	#$84
		bra	73F
7		tst	ibuf+1
		bne	8F
		lbsr	upper
		cmpa	#'A
		bne	71F
		lda	#$86
		bra	73F
71		cmpa	#'B
		bne	72F
		lda	#$85
		bra	73F
72		cmpa	#'D
		bne	8F
		lda	#$8b
73		ora	iindb
		lbra	44B
8		; הזזה: n,X
		clr	force
		ldx	#ibuf
		lda	,x
		cmpa	#'<
		beq	81F
		cmpa	#'>
		bne	82F
81		sta	force
		leax	1,x
82		lbsr	exprj
		tst	eknown
		beq	84F
		lbsr	rng16
		bcc	83F
		ldx	#m_offbig
		lbra	lerr
83		lda	tv
		bne	84F
		lda	tv+1
		bpl	84F
		lda	#$ff		; מעל 32767: מספר שלילי
		sta	tv
84		; 0,X כמו ,X
		tst	force
		bne	85F
		tst	eknown
		beq	85F
		lbsr	tvzero
		bne	85F
		lda	#$84
		bra	73B
85		; 5 סיביות
		tst	force
		bne	86F
		tst	eknown
		beq	86F
		tst	iind
		bne	86F
		lbsr	rng5
		bcs	86F
		lda	tv+2
		anda	#$1f
		ora	ireg
		sta	ipb
		clr	ixn
		bra	iout
86		; בית אחד
		lda	force
		cmpa	#'<
		beq	87F
		cmpa	#'>
		beq	88F
		tst	eknown
		beq	88F
		lbsr	rngs8
		bcs	88F
87		lbsr	rng8
		bcc	871F
		ldx	#m_offb1
		lbra	lerr
871		lda	#$88
		ora	ireg
		ora	iindb
		sta	ipb
		lda	tv+2
		sta	ix1
		lda	#1
		sta	ixn
		bra	iout
88		lda	#$89
		ora	ireg
		ora	iindb
		sta	ipb
		lda	tv+1
		sta	ix1
		lda	tv+2
		sta	ix2
		lda	#2
		sta	ixn
iout		lbsr	needidx
		lbsr	idxcode
		lbsr	opc
		lda	ipb
		lbsr	obput
		ldb	ixn
		beq	2F
		lda	ix1
		lbsr	obput
		decb
		beq	2F
		lda	ix2
		lbsr	obput
2		orcc	#1
		rts
comerr		ldx	#m_comma
		lbra	lerr

; n,PCR: המקום n, נמדד מסוף הפקודה
ipcr		clr	force
		ldx	#ibuf
		lda	,x
		cmpa	#'<
		beq	1F
		cmpa	#'>
		bne	2F
1		sta	force
		leax	1,x
2		tst	,x
		bne	3F
		ldx	#t_zero
3		lbsr	exprj
		lbsr	needidx
		lbsr	oplen
		clra
		addd	apc
		addd	#1
		std	inext
		lda	force
		cmpa	#'<
		beq	5F
		cmpa	#'>
		beq	6F
		tst	eknown
		beq	6F
		ldd	tv+1		; בית אחד מספיק?
		std	tsave+1
		lda	tv
		sta	tsave
		ldd	inext
		addd	#1
		lbsr	subpc
		lbsr	rngs8
		pshs	cc
		ldd	tsave+1
		std	tv+1
		lda	tsave
		sta	tv
		puls	cc
		bcs	6F
5		ldd	inext
		addd	#1
		lbsr	subpc
		tst	eknown
		beq	51F
		lbsr	rngs8
		bcc	51F
		ldx	#m_pcfar
		lbra	lerr
51		lda	#$8c
		ora	iindb
		sta	ipb
		lda	tv+2
		sta	ix1
		lda	#1
		sta	ixn
		lbra	iout
6		ldd	inext
		addd	#2
		lbsr	subpc
		lda	#$8d
		ora	iindb
		sta	ipb
		lda	tv+1
		sta	ix1
		lda	tv+2
		sta	ix2
		lda	#2
		sta	ixn
		lbra	iout

pctab		fcn	"PCR"
		fcn	"PC"
		fcb	0

; needidx: לפקודה יש צורה עם אצבע?
needidx		ldu	opp
		lda	OP_C,u
		cmpa	#C_ACC
		beq	9F
		cmpa	#C_MEM
		beq	9F
		cmpa	#C_LEA
		beq	9F
		ldx	#m_noidx
		lbra	opnerr
9		rts

; noleft: לפני ,X+ או ,-X לא כותבים כלום
noleft		tst	ibuf
		beq	9F
		ldd	#tok
		std	errarg
		ldx	#m_nothng
		lbra	lerr
9		rts

; ixreg: A = X/Y/U/S → ireg = הסיביות שלו. C=1 אם לא
ixreg		clrb
		cmpa	#'X
		beq	1F
		ldb	#$20
		cmpa	#'Y
		beq	1F
		ldb	#$40
		cmpa	#'U
		beq	1F
		ldb	#$60
		cmpa	#'S
		beq	1F
		orcc	#1
		rts
1		stb	ireg
		andcc	#$fe
		rts

; lastcom: הפסיק האחרון ב-ibuf. X = הכתובת שלו, Z=1 אם אין
lastcom		ldx	#ibuf
		ldy	#0
1		lda	,x
		beq	2F
		cmpa	#',
		bne	3F
		tfr	x,y
3		leax	1,x
		bra	1B
2		tfr	y,x
		cmpx	#0
		rts

; ---------- מספרים וחשבון / expressions ----------
; exprj: כמו expr, ובשגיאה השורה נגמרת
exprj		lbsr	expr
		lbcs	lerr
		rts

; expr: X → טקסט. התוצאה ב-tv (3 בתים, עם סימן), eknown, efwd. C=1 ושגיאה ב-X
expr		sts	esp
		lbsr	skipsp
		tst	,x
		bne	1F
		ldx	#m_nonum
		lbra	eerr
1		clr	tot
		clr	tot+1
		clr	tot+2
		lda	#1
		sta	eknown
		sta	efirst
		clr	efwd
		stx	estr
2		tst	,x
		beq	edone
		clr	eneg
		lda	,x
		tst	efirst
		beq	3F
		cmpa	#'+
		beq	3F
		cmpa	#'-
		bne	4F
3		cmpa	#'+
		beq	31F
		cmpa	#'-
		bne	esyn
		inc	eneg
31		leax	1,x
4		clr	efirst
		lbsr	term
		tst	eneg
		bne	5F
		ldd	tot+1
		addd	tv+1
		std	tot+1
		lda	tot
		adca	tv
		sta	tot
		bra	2B
5		ldd	tot+1
		subd	tv+1
		std	tot+1
		lda	tot
		sbca	tv
		sta	tot
		bra	2B
edone		ldd	tot+1
		std	tv+1
		lda	tot
		sta	tv
		andcc	#$fe
		rts
esyn		ldd	estr
		std	errarg
		ldx	#m_syntx
eerr		lds	esp
		orcc	#1
		rts

; term: מספר אחד, או שם. X מתקדם
term		clr	tv
		clr	tv+1
		clr	tv+2
		lda	,x
		cmpa	#'$
		beq	thex
		cmpa	#'%
		beq	tbin
		cmpa	#'@
		bne	1F
		lda	1,x
		cmpa	#'0
		lblo	tsym
		cmpa	#'7
		lbhi	tsym
		lbra	toct
1		cmpa	#'0
		blo	2F
		cmpa	#'9
		lbls	tdec
2		cmpa	#''
		bne	3F
		tst	1,x
		beq	3F
		ldb	1,x
		stb	tv+2
		leax	2,x
		rts
3		cmpa	#'*
		bne	4F
		ldd	apc
		std	tv+1
		leax	1,x
		rts
4		lbsr	upper
		lbsr	isnst
		lbcc	tsym
		bra	esyn

thex		leax	1,x
		lda	,x
		lbsr	hexval
		bcs	esyn
1		lda	,x
		lbsr	hexval
		bcs	9F
		pshs	a
		lbsr	tvx2
		lbsr	tvx2
		lbsr	tvx2
		lbsr	tvx2
		puls	a
		ora	tv+2
		sta	tv+2
		leax	1,x
		bra	1B
9		rts

tbin		leax	1,x
		lda	,x
		suba	#'0
		cmpa	#1
		lbhi	esyn
1		lda	,x
		suba	#'0
		cmpa	#1
		bhi	9F
		pshs	a
		lbsr	tvx2
		puls	a
		ora	tv+2
		sta	tv+2
		leax	1,x
		bra	1B
9		rts

toct		leax	1,x
1		lda	,x
		suba	#'0
		cmpa	#7
		bhi	9F
		pshs	a
		lbsr	tvx2
		lbsr	tvx2
		lbsr	tvx2
		puls	a
		ora	tv+2
		sta	tv+2
		leax	1,x
		bra	1B
9		rts

; tdec: מספר עשרוני. ספרות ואחריהן אות: "מספר הקסדצימלי מתחיל ב-$"
tdec		pshs	x
1		lda	,x+
		cmpa	#'0
		blo	2F
		cmpa	#'9
		bls	1B
2		lbsr	upper
		cmpa	#'_
		beq	3F
		cmpa	#'A
		blo	4F
		cmpa	#'Z
		bhi	4F
3		puls	x
		stx	errarg
		ldx	#m_hexn
		lbra	eerr
4		puls	x
5		lda	,x
		suba	#'0
		bcs	9F
		cmpa	#9
		bhi	9F
		pshs	a		; tv = tv*8 + tv*2 + הספרה
		lbsr	tvx2
		ldd	tv+1
		std	tsave+1
		lda	tv
		sta	tsave
		lbsr	tvx2
		lbsr	tvx2
		ldd	tv+1
		addd	tsave+1
		std	tv+1
		lda	tv
		adca	tsave
		sta	tv
		puls	a
		adda	tv+2
		sta	tv+2
		bcc	6F
		inc	tv+1
		bne	6F
		inc	tv
6		leax	1,x
		bra	5B
9		rts

; tvx2: tv כפול 2
tvx2		lsl	tv+2
		rol	tv+1
		rol	tv
		rts

; tsym: שם של מקום
tsym		ldy	#sname
		pshs	x
		tfr	y,x
		lbsr	clrnm
		puls	x
		clrb
1		lda	,x
		lbsr	upper
		lbsr	isnch
		bcs	2F
		cmpb	#11
		bhs	11F
		sta	b,y
		incb
11		leax	1,x
		bra	1B
2		stx	tptr
		cmpb	#10
		bhi	nfound
		ldx	#sname
		lbsr	symfind
		bne	nfound
		lda	pass
		cmpa	#1
		bne	3F
		tst	SY_K,u
		beq	unk
3		ldd	SY_V,u
		std	tv+1
		ldd	SY_L,u
		cmpd	curln
		bls	4F
		inc	efwd
4		ldx	tptr
		rts
nfound		lda	pass
		cmpa	#1
		bne	5F
unk		clr	eknown
		inc	efwd
		ldd	#0
		std	tv+1
		ldx	tptr
		rts
5		ldd	#sname
		std	errarg
		ldx	#m_noplc
		lbra	eerr

; subpc: tv = tv - D
subpc		std	stmp
		ldd	tv+1
		subd	stmp
		std	tv+1
		lda	tv
		sbca	#0
		sta	tv
		rts

; טווחים: C=0 אם tv בתוכם
rng8		lda	tv		; -128..255
		bne	1F
		tst	tv+1
		bne	bad
		bra	ok
1		cmpa	#$ff
		bne	bad
		ldd	tv+1
		cmpd	#$ff80
		bhs	ok
bad		orcc	#1
		rts
ok		andcc	#$fe
		rts
rngs8		lda	tv		; -128..127
		bne	1F
		ldd	tv+1
		cmpd	#127
		bls	ok
		bra	bad
1		cmpa	#$ff
		bne	bad
		ldd	tv+1
		cmpd	#$ff80
		bhs	ok
		bra	bad
rng5		lda	tv		; -16..15
		bne	1F
		ldd	tv+1
		cmpd	#15
		bls	ok
		bra	bad
1		cmpa	#$ff
		bne	bad
		ldd	tv+1
		cmpd	#$fff0
		bhs	ok
		bra	bad
rng16		lda	tv		; -32768..65535
		beq	ok
		cmpa	#$ff
		bne	bad
		ldd	tv+1
		cmpd	#$8000
		bhs	ok
		bra	bad
tvzero		lda	tv
		ora	tv+1
		ora	tv+2
		rts

; ================= עזרים / helpers =================
skipsp		lda	,x
		cmpa	#$20
		bne	1F
		leax	1,x
		bra	skipsp
1		rts

; isdig: C=0 אם ,X ספרה
isdig		lda	,x
		cmpa	#'0
		blo	1F
		cmpa	#'9
		bhi	1F
		andcc	#$fe
		rts
1		orcc	#1
		rts

; isnst: אות שמתחילה שם (A-Z _ . @). isnch: אות בתוך שם (גם 0-9 ו-$). C=0 כן
isnst		cmpa	#'A
		blo	1F
		cmpa	#'Z
		bls	yes
1		cmpa	#'_
		beq	yes
		cmpa	#'.
		beq	yes
		cmpa	#'@
		beq	yes
no		orcc	#1
		rts
yes		andcc	#$fe
		rts
isnch		bsr	isnst
		bcc	yes
		cmpa	#'$
		beq	yes
		cmpa	#'0
		blo	no
		cmpa	#'9
		bhi	no
		bra	yes

; hexval: A = ספרה הקסדצימלית → A = הערך. C=1 אם לא
hexval		lbsr	upper
		suba	#'0
		bcs	9F
		cmpa	#9
		bls	8F
		suba	#7
		cmpa	#10
		blo	9F
		cmpa	#15
		bhi	9F
8		andcc	#$fe
		rts
9		orcc	#1
		rts

upper		cmpa	#'a
		blo	1F
		cmpa	#'z
		bhi	1F
		suba	#32
1		rts

strlen		pshs	x
		clrb
1		tst	,x+
		beq	2F
		incb
		bra	1B
2		puls	x,pc

; clrnm: 12 אפסים ב-X
clrnm		pshs	b,x
		ldb	#12
1		clr	,x+
		decb
		bne	1B
		puls	b,x,pc

; getword: X → מילה עד רווח או סוף, באותיות גדולות, ל-Y (עד 9). X נעצר ברווח
getword		clrb
1		lda	,x
		beq	2F
		cmpa	#$20
		beq	2F
		lbsr	upper
		cmpb	#9
		bhs	11F
		sta	b,y
		incb
11		leax	1,x
		bra	1B
2		clr	b,y
		rts

; getnum: X → ספרות. D = המספר, C=1 אם אין ספרות או יותר מ-65535
getnum		lbsr	isdig
		bcs	9F
		ldd	#0
		std	ntmp
1		lda	,x
		suba	#'0
		bcs	8F
		cmpa	#9
		bhi	8F
		sta	ndig
		ldd	ntmp
		lslb
		rola
		bcs	9F
		std	n2
		lslb
		rola
		bcs	9F
		lslb
		rola
		bcs	9F
		addd	n2
		bcs	9F
		addb	ndig
		adca	#0
		bcs	9F
		std	ntmp
		leax	1,x
		bra	1B
8		ldd	ntmp
		andcc	#$fe
		rts
9		orcc	#1
		rts

; dec2buf: D → ספרות עשרוניות ב-X (ואפס בסוף). X נעצר על האפס
dec2buf		pshs	y
		std	dtmp
		ldy	#divs
		clr	lzf
1		lda	#'0
		sta	dchr
		ldd	dtmp
2		subd	,y
		bcs	3F
		inc	dchr
		bra	2B
3		addd	,y
		std	dtmp
		lda	dchr
		cmpa	#'0
		bne	4F
		tst	lzf
		bne	4F
		cmpy	#divs+8
		bne	5F
4		sta	,x+
		inc	lzf
5		leay	2,y
		cmpy	#divs+10
		blo	1B
		clr	,x
		puls	y,pc
divs		fdb	10000,1000,100,10,1

prtdec		pshs	x
		ldx	#numbuf
		bsr	dec2buf
		ldx	#numbuf
		lbsr	puts
		puls	x,pc

; numdec / numhex: D → מחרוזת ב-numbuf, ו-errarg מצביע עליה
numdec		ldx	#argbuf
		bsr	dec2buf
		bra	1F
numhex		ldx	#argbuf
		pshs	b
		ldb	#'$
		stb	,x+
		pshs	a
		lsra
		lsra
		lsra
		lsra
		bsr	hexch
		puls	a
		bsr	hexch
		lda	,s
		lsra
		lsra
		lsra
		lsra
		bsr	hexch
		puls	a
		bsr	hexch
		clr	,x
1		ldd	#argbuf
		std	errarg
		rts
hexch		anda	#$0f
		adda	#'0
		cmpa	#'9
		bls	1F
		adda	#7
1		sta	,x+
		rts

prthex4		pshs	b
		bsr	prthex2
		puls	a
prthex2		pshs	a
		lsra
		lsra
		lsra
		lsra
		bsr	hexdig
		puls	a
hexdig		anda	#$0f
		adda	#'0
		cmpa	#'9
		bls	1F
		adda	#7
1		lbra	putc

; ---------- המסך והמקלדת / screen and keyboard ----------
cls		ldx	#SCREEN
		ldd	#$6060
1		std	,x++
		cmpx	#SCREND
		blo	1B
		ldx	#SCREEN
		stx	curpos
		clr	justw
		rts

; putc: A למסך. 13 = שורה חדשה, 8 = אחורה
putc		pshs	a,b,x
		ldx	curpos
		cmpa	#13
		beq	nl
		cmpa	#8
		beq	bsp
		cmpa	#$20
		blo	pdone
		cmpa	#$80
		bhs	pdone
		cmpa	#$40
		bhs	1F
		adda	#$40		; $20-$3F → $60-$7F
		bra	2F
1		cmpa	#$60
		blo	2F
		suba	#$60		; אותיות קטנות: הפוכות, כמו ב-BASIC
2		sta	,x+
		tfr	x,d
		andb	#31
		bne	21F
		lda	#1
		sta	justw		; השורה התמלאה, והסמן כבר בשורה הבאה
		bra	chk
21		clr	justw
		bra	chk
nl		tst	justw
		beq	1F
		clr	justw
		bra	pdone
1		tfr	x,d
		andb	#$e0
		addd	#32
		tfr	d,x
chk		cmpx	#SCREND
		blo	pset
		lbsr	scroll
		ldx	#SCREND-32
pset		stx	curpos
pdone		puls	a,b,x,pc
bsp		clr	justw
		cmpx	#SCREEN
		bls	pdone
		leax	-1,x
		lda	#$60
		sta	,x
		bra	pset

scroll		ldx	#SCREEN
1		ldd	32,x
		std	,x++
		cmpx	#SCREND-32
		blo	1B
		ldd	#$6060
2		std	,x++
		cmpx	#SCREND
		blo	2B
		rts

crlf		lda	#13
		lbra	putc

puts		lda	,x+
		beq	1F
		lbsr	putc
		bra	puts
1		rts

; putmsg: הודעה, ו-% מוחלף ב-errarg. השורות נשברות בין מילים, לא באמצע מילה
putmsg		ldy	#mbuf
1		lda	,x+
		beq	3F
		cmpa	#'%
		bne	2F
		pshs	x
		ldx	errarg
11		lda	,x+
		beq	12F
		cmpy	#mbuf+126
		bhs	11B
		sta	,y+
		bra	11B
12		puls	x
		bra	1B
2		cmpy	#mbuf+126
		bhs	1B
		sta	,y+
		bra	1B
3		clr	,y
		ldx	#mbuf
4		lda	,x
		beq	9F
		cmpa	#$20
		bne	6F
		leax	1,x
		bsr	wlen
		lda	curpos+1
		anda	#31
		beq	4B		; תחילת שורה: בלי רווח
		pshs	b
		adda	,s+
		cmpa	#31
		bhi	5F
		lda	#$20
		lbsr	putc
		bra	4B
5		lbsr	crlf
		bra	4B
6		lbsr	putc
		leax	1,x
		bra	4B
9		rts
; wlen: B = אורך המילה ב-X
wlen		pshs	x
		clrb
1		lda	,x+
		beq	2F
		cmpa	#$20
		beq	2F
		incb
		bra	1B
2		puls	x,pc

; getkey: מחכה למקש, עם סמן מהבהב
getkey		pshs	b,x
		ldx	curpos
		lda	,x
		sta	under
		clr	blink
		lda	#1
		sta	blinkc
1		dec	blinkc
		bne	2F
		lda	#24
		sta	blinkc
		com	blink
		lda	under
		tst	blink
		beq	3F
		lda	#$8f
3		sta	,x
2		jsr	[POLCAT]
		tsta
		beq	1B
		ldb	under
		stb	,x
		puls	b,x,pc

; brkchk: מקש באמצע רשימה. BREAK: C=1. מקש אחר: עוצרים עד המקש הבא
brkchk		jsr	[POLCAT]
		tsta
		beq	1F
		cmpa	#3
		beq	2F
		lbsr	getkey
		cmpa	#3
		beq	2F
1		andcc	#$fe
		rts
2		orcc	#1
		rts

; getline: שורת קלט ב-inbuf (inlen תווים כבר בפנים). ENTER: C=0. BREAK: C=1
getline		ldx	#inbuf
		ldb	inlen
		beq	2F
1		lda	,x+
		lbsr	putc
		decb
		bne	1B
2		lbsr	getkey
		cmpa	#13
		beq	5F
		cmpa	#3
		beq	6F
		cmpa	#8
		beq	3F
		cmpa	#$15
		beq	4F
		cmpa	#$0a
		beq	7F
		cmpa	#$09
		beq	7F
8		cmpa	#$20
		blo	2B
		cmpa	#$80
		bhs	2B
		ldb	inlen
		cmpb	#MAXIN
		bhs	2B
		ldx	#inbuf
		sta	b,x
		inc	inlen
		lbsr	putc
		bra	2B
3		tst	inlen
		beq	2B
		dec	inlen
		lda	#8
		lbsr	putc
		bra	2B
4		tst	inlen
		beq	2B
		dec	inlen
		lda	#8
		lbsr	putc
		bra	4B
5		ldx	#inbuf
		ldb	inlen
		clr	b,x
		lbsr	crlf
		andcc	#$fe
		rts
6		lbsr	crlf
		orcc	#1
		rts
7		lbsr	shifted		; SHIFT+↓ = [ ו-SHIFT+→ = ] (אין במקלדת של ה-Dragon מקשים לסוגריים)
		bcc	2B
		cmpa	#$0a
		bne	71F
		lda	#'[
		bra	8B
71		lda	#']
		bra	8B

; shifted: C=1 אם SHIFT לחוץ עכשיו (עמודה 7, שורה 6 במטריצה)
shifted		pshs	a,b
		ldb	#$7f
		stb	$ff02
		ldb	$ff00
		lda	#$ff
		sta	$ff02
		andb	#$40
		bne	1F
		puls	a,b
		orcc	#1
		rts
1		puls	a,b
		andcc	#$fe
		rts

; ================= טקסטים / texts =================
t_hello		fcc	"DRAGON ASSEMBLER 1.0"
		fcb	13
		fcc	"(C) 2026 GONEN YAROM"
		fcb	13
		fcc	"TYPE HELP FOR THE COMMANDS"
		fcb	13,0
t_help		fcc	"100  LDA #1  TYPE A LINE"
		fcb	13
		fcc	"100          DELETE LINE 100"
		fcb	13
		fcc	"NO PLACE NAME? START WITH SPACE"
		fcb	13
		fcc	"LIST (L)     L 100-200"
		fcb	13
		fcc	"EDIT (E)     E 100: CHANGE IT"
		fcb	13
		fcc	"INSERT (I)   I 100: NUMBERS"
		fcb	13
		fcc	"DELETE (D)   D 100-200"
		fcb	13
		fcc	"RENUM        10, 20, 30..."
		fcb	13
		fcc	"ASM (A)      ASSEMBLE"
		fcb	13
		fcc	"RUN (R)      ASSEMBLE AND RUN"
		fcb	13
		fcc	"CSAVE NAME   SAVE ON TAPE"
		fcb	13
		fcc	"CLOAD NAME   LOAD FROM TAPE"
		fcb	13
		fcc	"NEW          START AGAIN"
		fcb	13
		fcc	"BASIC        BACK TO BASIC"
		fcb	13
		fcc	"ANY KEY: MORE"
		fcb	0
t_help2		fcc	"MEM $2EE1    SEE MEMORY (M)"
		fcb	13
		fcc	"MEM $2EE1 1 2  WRITE BYTES"
		fcb	13
		fcc	"UNASM $2EE1  BYTES TO COMMANDS"
		fcb	13
		fcc	"GO $2EE1     RUN FROM THERE (G)"
		fcb	13
		fcc	"BP LOOP      STOP THERE (NOBP)"
		fcb	13
		fcc	"T            ONE STEP (TRACE)"
		fcb	13
		fcc	"C   REG      GO ON, DRAWERS"
		fcb	13
		fcc	"ASM L        LIST WITH BYTES"
		fcb	13
		fcc	"SYM          THE NAMES"
		fcb	13
		fcc	"CSAVEM NAME  SAVE THE PROGRAM"
		fcb	13
		fcc	"             (CLOADM, EXEC)"
		fcb	13
		fcc	"[ ]  SHIFT+DOWN, SHIFT+RIGHT"
		fcb	13,0
t_defnm		fcc	"SOURCE  "
t_defpg		fcc	"PROGRAM "
t_spdol		fcn	"$"
t_zero		fcn	"0"

m_needsp	fcn	"PUT A SPACE AFTER THE LINE NUMBER"
m_badnum	fcn	"LINE NUMBERS ARE 1 TO 63999"
m_memful	fcn	"OUT OF MEMORY"
m_unkcmd	fcn	"UNKNOWN COMMAND. TYPE HELP"
m_delhow	fcn	"WHICH LINES? LIKE D 100-200"
m_edhow		fcn	"WHICH LINE? LIKE E 100"
m_noline	fcn	"THERE IS NO SUCH LINE"
m_exists	fcn	"LINE % EXISTS. INSERT STOPPED"
m_sure		fcn	"DELETE THE WHOLE PROGRAM? (Y/N) "
m_bye		fcc	"BACK TO BASIC."
		fcb	13
		fcc	"TO COME BACK: EXEC 13312"
		fcb	13,0
m_back		fcn	"BACK IN THE ASSEMBLER"
m_lost		fcn	"THE PROGRAM WROTE OVER YOUR TEXT ($0600-$1BFF, WHERE GRAPHICS GO). SAVE THE TEXT WITH CSAVE BEFORE RUNNING GRAPHICS"
m_empty		fcn	"NOTHING TO RUN"
m_nosym		fcn	"NO NAMES"
m_err1		fcn	"1 ERROR"
m_errs		fcn	" ERRORS"
m_nobytes	fcn	"OK. NOTHING WENT INTO MEMORY"
m_ok		fcn	"OK $"
m_bytes		fcn	" BYTES"
m_start		fcn	"START $"
m_rec		fcn	"RECORDING "
m_saved		fcn	"SAVED"
m_replac	fcn	"THIS REPLACES YOUR PROGRAM. SURE? (Y/N) "
m_search	fcn	"SEARCHING"
m_found		fcn	"FOUND "
m_loaded	fcn	"LOADED"
m_notsrc	fcn	"NOT AN ASSEMBLER TAPE"
m_toobig	fcn	"TOO BIG FOR MEMORY"
m_tperr		fcn	"TAPE ERROR"

m_unkop		fcn	"I DON'T KNOW THE COMMAND %"
m_noplc		fcn	"THERE IS NO PLACE CALLED %"
m_miss		fcn	"SOMETHING IS MISSING AFTER %"
m_nonum		fcn	"A NUMBER IS MISSING"
m_syntx		fcn	"I DON'T UNDERSTAND %"
m_hexn		fcn	"A HEX NUMBER STARTS WITH $, LIKE $%"
m_far		fcn	"TOO FAR FOR %. USE THE LONG JUMP: L%"
m_big8		fcn	"TOO BIG FOR ONE BYTE: ONLY 0 TO 255"
m_big16		fcn	"TOO BIG EVEN FOR TWO BYTES"
m_bigad		fcn	"ADDRESSES GO UP TO $FFFF"
m_space		fcn	"% IS A COMMAND: START THE LINE WITH A SPACE"
m_badnm		fcn	"THE NAME % WON'T DO: A LETTER, THEN LETTERS OR DIGITS"
m_resnm		fcn	"THE NAME % IS TAKEN: IT IS A DRAWER OR A FINGER"
m_long		fcn	"THE NAME % IS TOO LONG: 10 LETTERS AT MOST"
m_twice		fcn	"THE NAME % APPEARS TWICE"
m_full		fcn	"TOO MANY NAMES"
m_neednm	fcn	"EQU NEEDS A NAME AT THE START OF THE LINE"
m_org		fcn	"ORG NEEDS A NUMBER, OR A NAME DEFINED ABOVE IT"
m_rmb		fcn	"RMB NEEDS A KNOWN NUMBER"
m_fcbhow	fcn	"AFTER % COME NUMBERS, LIKE % 1,2,3"
m_fcbbig	fcn	"ONE BYTE HOLDS ONLY 0 TO 255. FOR MORE: FDB"
m_fcc		fcn	"FCC: TEXT BETWEEN TWO EQUAL MARKS, LIKE FCC /HI/"
m_stk		fcn	"AFTER % COME DRAWERS, EACH ONCE, WITH COMMAS"
m_reg		fcn	"AFTER % COME TWO DRAWERS, LIKE % X,Y"
m_size		fcn	"THE TWO DRAWERS ARE NOT THE SAME SIZE"
m_noimm		fcn	"% TAKES NO #"
m_join		fcn	"WRITE IT JOINED: %"
m_noidx		fcn	"% DOES NOT WORK WITH A FINGER"
m_nobr		fcn	"A ] IS MISSING AT THE END"
m_noform	fcn	"THIS FORM DOES NOT EXIST IN [ ]"
m_comma		fcn	"AFTER THE COMMA COMES A FINGER: X, Y, U OR S (OR PCR)"
m_nothng	fcn	"NOTHING GOES BEFORE ,%"
m_offbig	fcn	"THE OFFSET IS TOO BIG"
m_offb1		fcn	"THE OFFSET DOES NOT FIT IN ONE BYTE"
m_pcfar		fcn	"THE PLACE IS TOO FAR FOR A ONE-BYTE OFFSET"
m_noshrt	fcn	"% HAS NO SHORT FORM"
m_nopage	fcn	"% IS NOT ON THE DIRECT PAGE"
m_noext		fcn	"% NEEDS SOMETHING ELSE HERE, LIKE % 1,X"
m_mem		fcn	"% IS THE ASSEMBLER'S. USE $2400-$33FF"

		include	"debug.s"
		include	"ops.s"

; ================= משתנים / variables =================
bassp		rmb	2
mainsp		rmb	2
runsp		rmb	2
curpos		rmb	2
under		rmb	1
justw		rmb	1
blinkc		rmb	1
blink		rmb	1
inlen		rmb	1
inbuf		rmb	MAXIN+2
lnum		rmb	2
ltext		rmb	2
llen		rmb	1
ftmp		rmb	2
dsize		rmb	2
srcend		rmb	2
word		rmb	10
args		rmb	2
rlo		rmb	2
rhi		rmb	2
rgiven		rmb	1
istep		rmb	2
inum		rmb	2
ipre		rmb	1
dtmp		rmb	2
lzf		rmb	1
dchr		rmb	1
ntmp		rmb	2
n2		rmb	2
ndig		rmb	1
numbuf		rmb	8
argbuf		rmb	8
mbuf		rmb	128
fname		rmb	8
anynm		rmb	1
sptr		rmb	2
errarg		rmb	2
oswi		rmb	3
stopped		rmb	1
nbp		rmb	1
bpaddr		rmb	8
np		rmb	1
paddr		rmb	12
pval		rmb	6
contp		rmb	1
dquiet		rmb	1
dtgt		rmb	2
nxt1		rmb	2
nxt2		rmb	2
isjmp		rmb	1
usp		rmb	2
ureg		rmb	12
epb		rmb	1
eptr		rmb	2
er		rmb	2
gptr		rmb	2
maddr		rmb	2
mstart		rmb	2
daddr		rmb	2
dstart		rmb	2
dptr		rmb	2
dtp		rmb	2
dname		rmb	2
dent		rmb	2
dcnt		rmb	1
dpage		rmb	1
dop		rmb	1
dmode		rmb	1
dpb		rmb	1
dcom		rmb	1
dreg_		rmb	1
iind_		rmb	1
dlen		rmb	1
dtext		rmb	32
wexec		rmb	2
wfrom		rmb	2
wto		rmb	2
listf		rmb	1
srclost		rmb	1
lstop		rmb	1
lpc		rmb	2
ltmp		rmb	1
pass		rmb	1
emit		rmb	1
changed		rmb	1
iter		rmb	1
apc		rmb	2
adp		rmb	1
entry		rmb	2
entset		rmb	1
ended		rmb	1
errcnt		rmb	2
curln		rmb	2
lsp		rmb	2
esp		rmb	2
symend		rmb	2
minad		rmb	2
maxad		rmb	2
ttmp		rmb	2
anyad		rmb	1
nbytes		rmb	2
recp		rmb	2
lbuf		rmb	MAXIN+4
haslab		rmb	1
lab		rmb	12
labx		rmb	34
lablen		rmb	1
tok		rmb	10
opn		rmb	10
opp		rmb	2
argp		rmb	2
opnd		rmb	MAXIN+4
ebuf		rmb	MAXIN+4
ibuf		rmb	MAXIN+4
sname		rmb	12
tptr		rmb	2
tot		rmb	3
tv		rmb	3
tsave		rmb	3
stmp		rmb	2
eknown		rmb	1
efwd		rmb	1
eneg		rmb	1
efirst		rmb	1
estr		rmb	2
dval		rmb	2
dkn		rmb	1
obuf		rmb	64
obn		rmb	1
isfdb		rmb	1
sterm		rmb	1
fptr		rmb	2
fdelim		rmb	1
pbv		rmb	1
sbit		rmb	1
r1		rmb	1
r2		rmb	1
force		rmb	1
hasde		rmb	1
usedir		rmb	1
iind		rmb	1
iindb		rmb	1
ireg		rmb	1
ipb		rmb	1
ix1		rmb	1
ix2		rmb	1
ixn		rmb	1
inext		rmb	2
ostk		rmb	320		; המחסנית של האסמבלר
ostktop		equ	*
vend		equ	*
