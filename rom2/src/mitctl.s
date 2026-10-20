; Dragon 1982 BASIC — שלב 2, חלק 3: פקודות בקרה.
; תרגום ל-6809 של BASIC-M6502 (mit: IF 2465, ONGOTO 2480, GOSUB 2373, RETURN 2420, DATA/DATAN 2445,
; READ/INPUT/INLOOP 2905-3105, RESTOR 2196, STOP/END/CONT 2227-2268, DEF/FNDOER 4162-4240, PEEK/POKE 4808).
; התאמות ל-Dragon (קורא: מפרט הזיכרון): רשומת GOSUB של 5 בתים עם $BD, ELSE עם מונה IF מקוננים (IFCNT),
; הכתובות הקבועות של DATA/INPUT/CONT, ושגיאות RG OD ID CN UF.
; התנהגויות שהספרים לא קובעים (הודעות INPUT, ENTER ריק, BREAK בתוך INPUT): כמו ב-mit, ופתוחות לבדיקה
; במחשב אמיתי (docs/DRAGON-STAGE1.md).
;
; Portions translated from Microsoft BASIC-M6502, Copyright (c) Microsoft Corporation, MIT License.

IFCNT		equ	$04		; קורא: עומק IF בחיפוש ELSE
SUBFLG		equ	$08		; קורא: מצב אינדקסים
INPFLG		equ	$09		; קורא: 0 = INPUT, $80 = READ
OLDLIN		equ	$29		; קורא: השורה להמשך
VARTXT		equ	$2b		; קורא: חופף ל-LINNUM
OLDTXT		equ	$2d		; קורא: המקום להמשך (0 = אין)
TXTBEG		equ	$2f		; קורא: תחילת הפקודה, לחזרה אחרי קלט שגוי
DATLIN		equ	$31		; ספר: שורת ה-DATA
DATPTR		equ	$33		; ספר: מצביע ה-DATA
INPPTR		equ	$35		; ספר: מצביע הקלט
DEFPNT		equ	$4b		; קורא: הפונקציה המוגדרת
IKEYIM		equ	$87		; מקש שנלחץ בזמן ריצה, בשביל INKEY$
EXECJP		equ	$9d		; קורא: היעד של EXEC
BUFMIN		equ	LINBUF-1	; קורא: INPUT כותב כאן פסיק

; ---------- IF ... THEN / GOTO ... ELSE (mit: IF) ----------
if		lbsr	frmevl
		lbsr	chknum		; תנאי של מחרוזת: ?TM (ב-Dragon: פתוח)
		jsr	<chrgot
		cmpa	#$81		; IF X GO TO / GO SUB: בלי THEN
		beq	1F
		lda	#$bf		; THEN
		lbsr	synchk
1		tst	FACEXP		; 0 = שקר, כל השאר אמת
		beq	if_no
if_do		jsr	<chrgot
		lbcc	goto1		; מספר: GOTO
		lbra	gone3		; פקודה
; שקר: מחפשים ELSE באותה רמה — כל IF בדרך מוסיף רמה, וכל ELSE סוגר אחת. אין: מדלגים על השורה
if_no		clr	IFCNT
		ldx	TXTPTR
1		lda	,x+
		beq	8F
		cmpa	#'"		; בתוך מרכאות לא מחפשים
		beq	5F
		cmpa	#$ff		; הבית שאחרי $FF הוא פונקציה, לא פקודה
		bne	2F
		leax	1,x
		bra	1B
2		cmpa	#$85		; IF
		bne	3F
		inc	IFCNT
		bra	1B
3		cmpa	#$84		; ELSE
		bne	1B
		tst	IFCNT
		beq	4F
		dec	IFCNT
		bra	1B
4		leax	-1,x		; TXTPTR = ה-ELSE, וממשיכים כמו אחרי THEN
		stx	TXTPTR
		jsr	<chrget
		bra	if_do
5		lda	,x+
		beq	8F
		cmpa	#'"
		bne	5B
		bra	1B
8		leax	-1,x		; על ה-0 של סוף השורה
		stx	TXTPTR
		rts

; ---------- ON n GO TO / GO SUB (mit: ONGOTO) ----------
on		lbsr	evbyte		; B = 0-255
		pshs	b
		jsr	<chrgot
		cmpa	#$81		; GO
		lbne	err_sn
		jsr	<chrget
		cmpa	#$bc		; TO
		beq	1F
		cmpa	#$bd		; SUB
		lbne	err_sn
1		pshs	a		; [0] = TO/SUB, [1] = n
2		dec	1,s
		bne	3F
		jsr	<chrget		; זה המספר שנבחר
		puls	a,b
		cmpa	#$bc
		lbeq	goto1
		lbra	gosub1
3		jsr	<chrget		; מדלגים על מספר
		lbsr	lineget
		jsr	<chrgot
		cmpa	#',
		beq	2B
		leas	2,s		; אין כזה ברשימה (או 0): ממשיכים אחרי הפקודה
		rts

; ---------- RETURN (mit: RETURN) ----------
; מחפשים את רשומת ה-GOSUB העליונה; רשומות FOR שמעליה נמחקות. אין: ?RG
return		leas	2,s
		leax	,s
1		lda	,x
		cmpa	#$80
		bne	2F
		leax	18,x
		bra	1B
2		cmpa	#$bd
		lbne	err_rg
		ldd	1,x
		std	CURLIN
		ldd	3,x
		std	TXTPTR
		leas	7,x		; הרשומה ועוד כתובת החזרה שמתחתיה (קורא)
		bsr	data		; מדלגים עד סוף הפקודה שקראה (GOSUB או ON)
		lbra	newstt

; ---------- DATA, RESTORE ----------
; data: עד סוף הפקודה, בלי לעצור על נקודתיים בתוך מרכאות (mit: DATA/DATAN)
data		lbsr	stmend
		stx	TXTPTR
		rts
restore		ldd	TXTTAB		; mit: RESTOR — לפני התוכנית (בלי מספר שורה)
		subd	#1
		std	DATPTR
		rts

; ---------- READ / INPUT (mit: READ, INPUT, INLOOP) ----------
; הנתונים: מצביע אחד על רשימת המשתנים (TXTPTR, נשמר ב-VARTXT) ואחד על הנתונים (INPPTR),
; שתמיד מצביע על מפריד: פסיק, נקודתיים או סוף שורה.
read		ldx	DATPTR
		lda	#$80
		sta	INPFLG
		bra	inloop0
input		lbsr	errdir		; לא במצב ישיר: ?ID
		jsr	<chrgot
		cmpa	#'"		; הנחיה: "טקסט";
		bne	1F
		ldx	TXTPTR
		leax	1,x
		lbsr	strlit
		ldx	STRNG2
		stx	TXTPTR
		lda	#';
		lbsr	synchk
		lbsr	strprt
1		lda	#',
		sta	BUFMIN
		lbsr	qinlin
		tst	LINBUF
		bne	2F
		; ENTER בלי כלום: התוכנית נעצרת בשקט, ו-CONT חוזר ל-INPUT (mit: STPEND)
		leas	2,s
		ldx	TXTBEG
		stx	TXTPTR
		andcc	#$fe
		lbra	stpend
2		ldx	#BUFMIN
		clr	INPFLG
inloop0		stx	INPPTR
inloop		clrb			; המשתנה (נוצר אם אין)
		lbsr	ptrget
		ldd	VARPNT
		std	FORPNT
		ldd	TXTPTR
		std	VARTXT
		ldx	INPPTR
		stx	TXTPTR
		jsr	<chrgot
		bne	datbk1
		tst	INPFLG		; הנתונים נגמרו
		lbne	datlop		; READ: ה-DATA הבא
		lda	#'?		; INPUT: "??" ועוד שורה
		lbsr	putc
		lbsr	qinlin
		ldx	#BUFMIN
		stx	TXTPTR
datbk1		jsr	<chrget
		tst	VALTYP
		bpl	numins
		; מחרוזת: במרכאות — עד המרכאות. בלי — עד פסיק או נקודתיים
		sta	CHARAC
		cmpa	#'"
		beq	1F
		lda	#':
		sta	CHARAC
		lda	#',
		sta	ENDCHR
		ldx	TXTPTR
		bra	2F
1		sta	ENDCHR
		ldx	TXTPTR
		leax	1,x
2		lbsr	strlt2
		ldx	STRNG2
		stx	TXTPTR
		lbsr	letasg
		bra	strdn2
numins		lbsr	fin
		ldx	FORPNT
		lbsr	movmf
strdn2		jsr	<chrgot		; אחרי הנתון: רק סוף או פסיק
		beq	trmok
		cmpa	#',
		bne	trmnok
trmok		ldd	TXTPTR
		std	INPPTR
		ldd	VARTXT
		std	TXTPTR
		jsr	<chrgot
		beq	varend
		lbsr	chkcom
		bra	inloop
varend		ldd	INPPTR
		tst	INPFLG
		beq	1F
		std	DATPTR		; READ: ממשיכים מכאן בפעם הבאה
		rts
1		tst	[INPPTR]	; INPUT: נשאר עוד משהו בשורה?
		beq	9F
		leax	m_extra,pcr
		lbsr	puts
9		rts
; נתון שלא מתאים: ב-READ ?SN בשורת ה-DATA; ב-INPUT מבקשים שוב את כל הפקודה
trmnok		tst	INPFLG
		beq	1F
		ldd	DATLIN
		std	CURLIN
		lbra	err_sn
1		leax	m_redo,pcr
		lbsr	puts
		ldx	TXTBEG
		stx	TXTPTR
		rts			; newstt מריץ את הפקודה מחדש
; datlop: ה-DATA הבא, מהמקום הנוכחי. אין עוד: ?OD
datlop		lbsr	data
		lda	,x
		bne	1F		; נקודתיים: הפקודה הבאה באותה שורה
		ldd	1,x
		lbeq	err_od
		ldd	3,x
		std	DATLIN
		leax	4,x
		stx	TXTPTR
1		jsr	<chrget
		cmpa	#$86		; DATA
		bne	datlop
		lbra	datbk1
; qinlin: "? " ושורה מהמקלדת. BREAK: עוצרים, ו-CONT חוזר ל-INPUT
qinlin		lda	#'?
		lbsr	putc
		lda	#$20
		lbsr	putc
		lbsr	getline
		bcs	1F
		rts
1		leas	4,s		; qinlin ו-input
		ldx	TXTBEG
		stx	TXTPTR
		orcc	#1
		bra	stpend
m_redo		fcc	"?REDO"
		fcb	13,0
m_extra		fcc	"?EXTRA IGNORED"
		fcb	13,0

; ---------- STOP / END / CONT, ו-BREAK (mit: STOP, END, STOPC, CONT, ISCNTC) ----------
stop		bne	9F		; משהו אחרי STOP: ?SN ב-newstt
		orcc	#1
		bra	1F
end		bne	9F
		andcc	#$fe
1		leas	2,s		; בלי החזרה ל-gone
; stpend: TXTPTR = המקום להמשך. C=1: הודעת BREAK. המחסנית (FOR/GOSUB) נשמרת עד CONT
stpend		pshs	cc
		ldd	CURLIN
		cmpd	#$ffff
		beq	2F		; במצב ישיר אין מה להמשיך
		std	OLDLIN
		ldx	TXTPTR
		stx	OLDTXT
2		puls	cc
		lbcc	endcon
		lbsr	condcr
		leax	m_brk,pcr
		lbsr	puts
		lbsr	prin
		lbra	endcon
9		rts
m_brk		fcc	"BREAK"
		fcb	0
cont		bne	9B
		ldd	OLDTXT		; 0: אחרי RUN, עריכה, שגיאה או NEW (mit: STKINI)
		lbeq	err_cn
		std	TXTPTR
		ldd	OLDLIN
		std	CURLIN
		rts
; brkchk: בין פקודות. BREAK עוצר; מקש אחר נשמר בשביל INKEY$. קודם בדיקה מהירה: אף מקש לא לחוץ
brkchk		ldd	KQCNT		; תור הבדיקות: רק BREAK שעומד ראשון, ורק כשתוכנית רצה (כדי לבדוק
		beq	1F		; BREAK גם ב-INPUT, אחרי RUN שהוקלד מראש)
		ldd	CURLIN
		cmpd	#$ffff
		beq	9F
		lda	[KQPTR]
		cmpa	#3
		bne	9F
		lbsr	gk_pop
		bra	2F
1		clr	PIA0+2
		lda	PIA0
		coma
		anda	#$7f
		beq	9F
		lbsr	keyindex
		cmpa	#3
		beq	2F
		tsta
		beq	9F
		sta	IKEYIM
9		rts
2		leas	2,s		; בלי החזרה ל-newstt
		orcc	#1
		lbra	stpend

; errdir: במצב ישיר: ?ID (mit: ERRDIR)
errdir		ldd	CURLIN
		cmpd	#$ffff
		lbeq	err_id
		rts
; getstk: יש מקום במחסנית ל-B בתים, ועוד רזרבה? אחרת ?OM (mit: GETSTK; הרזרבה 58 — קורא, משוחזר, פתוח)
getstk		clra
		addd	STREND
		addd	#58
		pshs	d
		tfr	s,d
		subd	,s++
		lblo	err_om
		rts

; ---------- PEEK / POKE / EXEC (mit: PEEK, POKE, GETADR) ----------
; getadr: FAC → כתובת 0-65535 ב-D, אחרת ?FC
getadr		lbsr	chknum
		lda	FACEXP
		beq	1F
		tst	FACSGN
		lbmi	err_fc
		cmpa	#145
		lbhs	err_fc
1		lbsr	qint
		ldd	FACMO
		rts
fn_peek		bsr	getadr
		tfr	d,x
		ldb	,x
		lbra	givb
poke		lbsr	frmevl
		bsr	getadr
		pshs	d
		lbsr	chkcom
		lbsr	evbyte
		stb	[,s++]
		rts
exec		beq	1F		; בלי כתובת: האחרונה
		lbsr	frmevl
		bsr	getadr
		std	EXECJP
1		jmp	[EXECJP]	; קוד המכונה חוזר ב-RTS ישר ל-gone
execrts		rts

; ---------- DEF FN (mit: DEF, GETFNM, FNDOER) ----------
; הפונקציה נשמרת כמשתנה ששמו עם ביט 7 בתו הראשון: [המקום בטקסט 2][הפרמטר 2][0]
; (המבנה ב-Dragon: פתוח; כאן כמו ב-mit)
def		cmpa	#$ff		; DEF USRn=
		lbeq	defusr
		cmpa	#$be		; FN
		lbne	err_sn
		bsr	errdir
		bsr	getfnm
		lbsr	chklp
		lda	#$80		; הפרמטר: משתנה פשוט
		sta	SUBFLG
		clrb
		lbsr	ptrget
		clr	SUBFLG
		lbsr	chknum
		lbsr	chkrp
		lda	#$cb		; =
		lbsr	synchk
		ldx	DEFPNT
		ldd	TXTPTR
		std	,x
		ldd	VARPNT
		std	2,x
		clr	4,x
		lbra	data
; getfnm: FN ושם → DEFPNT (נוצר אם אין)
getfnm		lda	#$be
		lbsr	synchk
		lda	#$c0
		sta	SUBFLG
		clrb
		lbsr	ptrget
		clr	SUBFLG
		ldd	VARPNT
		std	DEFPNT
		lbra	chknum
; fndoer: FNx(ביטוי) בתוך ביטוי. ערך הפרמטר נשמר במחסנית ומוחזר בסוף (רקורסיה מותרת)
fndoer		bsr	getfnm
		ldx	DEFPNT
		pshs	x
		lbsr	chklp
		lbsr	frmevl
		lbsr	chkrp
		lbsr	chknum
		puls	x
		ldd	,x
		lbeq	err_uf		; לא הוגדרה
		ldu	2,x		; הפרמטר
		lda	4,u
		pshs	a
		ldd	2,u
		pshs	d
		ldd	,u
		pshs	d
		pshs	u
		ldd	,x		; הגוף
		ldx	TXTPTR
		pshs	x
		std	TXTPTR
		ldx	2,s		; הארגומנט → הפרמטר
		lbsr	movmf
		lbsr	frmevl
		lbsr	chknum
		jsr	<chrgot
		lbne	err_sn
		puls	x
		stx	TXTPTR
		puls	u
		puls	d
		std	,u
		puls	d
		std	2,u
		puls	a
		sta	4,u
		rts
