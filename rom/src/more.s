; Dragon 1982 BASIC: עוד פקודות. CLS בצבע, PRINT @ ו-TAB (ב-basic.s), CONT, AUTO, DEL, POKE, EXEC, PEEK. נכתב מאפס.

CONTLN		equ	$d6		; 2 בתים: מאיפה ממשיך CONT (0 = אי אפשר)
CONTX		equ	$d8		; 2 בתים
AUTON		equ	$da		; 2 בתים: מספר השורה הבא ב-AUTO (0 = כבוי)
AUTOS		equ	$dc		; 2 בתים: הקפיצה

; CLS [צבע]: בלי מספר: מסך טקסט ירוק. 0-8: ריבועים מלאים בצבע (0 = שחור)
st_cls		lbsr	skipsp
		beq	1F
		cmpa	#':
		beq	1F
		lbsr	getbyte
		cmpb	#8
		lbhi	err_fc
		lda	#$80		; 0: שחור
		tstb
		beq	2F
		decb
		lslb
		lslb
		lslb
		lslb
		orb	#$8f		; גרפיקה גסה: 4 הרבעים דולקים, בצבע
		tfr	b,a
2		pshs	x
		ldx	#SCREEN
3		sta	,x+
		cmpx	#SCREND
		blo	3B
		ldx	#SCREEN
		stx	CURSOR
		puls	x,pc
1		pshs	x		; cls משתמש ב-X
		lbsr	cls
		puls	x,pc

; CONT: ממשיכים מהמקום שבו BREAK או STOP עצרו
st_cont		ldd	CONTLN
		lbeq	err_cn
		std	CURLN
		ldx	CONTX
		ldd	#0		; רק פעם אחת (עד העצירה הבאה)
		std	CONTLN
		lda	,x		; אחרי STOP: בסוף פקודה. אחרי BREAK: בתחילת פקודה
		beq	1F
		cmpa	#':
		beq	1F
		inc	JUMPED
1		rts

; AUTO [התחלה[,קפיצה]]: הלולאה הראשית כותבת בעצמה את מספר השורה הבא
st_auto		ldd	#10
		std	AUTON
		std	AUTOS
		lbsr	skipsp
		beq	1F
		lbsr	linenum
		std	AUTON
		lbsr	skipsp
		cmpa	#',
		bne	1F
		leax	1,x
		lbsr	skipsp
		lbsr	linenum
		cmpd	#0
		lbeq	err_fc
		std	AUTOS
1		ldd	AUTON
		lbeq	err_fc
		rts

; auto_line: נקרא מהלולאה הראשית. אם AUTO פעיל: כותב את המספר בשורה ומחזיר B = כמה תווים כבר יש. אחרת B=0
auto_line	clrb
		ldd	AUTON
		beq	2F
		pshs	x,u
		lbsr	givd_u
		lbsr	fout		; U = " 10"
		leau	1,u
		ldx	#LINBUF
		clrb
1		lda	,u+
		beq	3F
		sta	,x+
		lbsr	putc
		incb
		bra	1B
3		lda	#$20
		sta	,x+
		lbsr	putc
		incb
		puls	x,u
		rts
2		clrb
		rts
; auto_after: אחרי שהשורה הוקלדה. רק המספר (בלי פקודה)? AUTO נגמר. אחרת המספר הבא
auto_after	ldd	AUTON
		beq	2F
		ldx	#LINBUF
		lbsr	linenum
		lbsr	skipsp
		bne	1F
		ldd	#0		; שורה ריקה: יוצאים מ-AUTO, ולא שומרים כלום
		std	AUTON
		clr	LINBUF
		rts
1		ldd	AUTON
		addd	AUTOS
		bcs	3F
		cmpd	#63999
		bls	4F
3		ldd	#0
4		std	AUTON
2		rts

; DEL א-ב: מוחק את השורות בטווח. גם DEL א (שורה אחת)
st_del		lbsr	skipsp
		lbsr	linenum
		std	LINNUM
		pshs	d		; עד (אם אין מקף: אותה שורה)
		lbsr	skipsp
		cmpa	#'-
		bne	1F
		leax	1,x
		lbsr	skipsp
		lbsr	linenum
		std	,s
1		ldd	LINNUM
		lbsr	findline	; Y = הראשונה ב-LINNUM או אחריה
2		ldd	,y
		beq	3F		; סוף התוכנית
		ldd	2,y
		cmpd	,s
		bhi	3F
		lbsr	delrec		; Y נשאר על הרשומה הבאה (שזזה למקום)
		bra	2B
3		leas	2,s
		lbsr	clrvars
		ldd	#0
		std	CURLN
		lbra	st_rem

; POKE כתובת,ערך
st_poke		lbsr	getint
		pshs	d
		lbsr	comma
		lbsr	getbyte
		stb	[,s++]
		rts
; EXEC כתובת: קפיצה לקוד מכונה (חוזר ב-RTS)
st_exec		lbsr	getint
		pshs	x
		tfr	d,u
		jsr	,u
		puls	x,pc

; PEEK(כתובת)
f_peek		lbsr	getint
		pshs	d
		lbsr	closep
		puls	u
		ldb	,u
		lbra	num_result

err_cn		leau	m_cn,pcr
		lbra	error
m_cn		fcc	"?CN ERROR"
		fcb	0
