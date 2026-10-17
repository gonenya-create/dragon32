; Dragon 1982 BASIC: שלד ה-ROM (ניסוי שלב 0, 17.10.2026)
; נטען במקום ה-ROM המקורי של ה-Dragon 32 ($8000-$BFFF, 16K). כל הקוד כאן נכתב מאפס.
; כרגע: אתחול החומרה, מסך טקסט, הודעת פתיחה, ושורת קלט פשוטה.

		org	$8000
		setdp	0

SCREEN		equ	$0400		; מסך הטקסט: 32 על 16
SCREND		equ	$0600
PIA0		equ	$ff00		; מקלדת
PIA1		equ	$ff20		; מצב תצוגה, צליל
SAM		equ	$ffc0
STACK		equ	$7f00		; מחסנית המעבד יורדת מכאן (עד $7E00)

; משתנים בזיכרון (עמוד אפס של ה-DP=0)
CURSOR		equ	$0088		; כתובת הסמן במסך (2 בתים)
LASTKEY		equ	$008a		; (לא בשימוש)
KFOUND		equ	$b0
KNEW		equ	$b1
KROW		equ	$b2
KCOL		equ	$b3
KPREV		equ	$b8		; מצב המקלדת בסריקה הקודמת: 8 עמודות ($B8-$BF)
KEYQ		equ	$0100		; תור קלט לבדיקות: [אורך][תווים]. כלי הבדיקה כותב לכאן במקום ללחוץ מקשים
LINBUF		equ	$0200		; השורה שהוקלדה (עד 249 תווים + 0)
LINMAX		equ	249

reset		orcc	#$50		; בלי פסיקות
		; קודם גודל הזיכרון: אחרי איפוס ה-SAM במצב 4K, והמחסנית לא הייתה עובדת (M0=0, M1=1: שבבי 64K)
		sta	SAM+26		; M0=0
		sta	SAM+29		; M1=1
		lds	#STACK
		clra
		tfr	a,dp
		lbsr	hw_init
		lbsr	cls
		; תור הקלט: מתחיל ממה שבטבלה testq (ריקה ב-ROM הרגיל; כלי הבדיקה בונה עותק עם שורות מוקלדות)
		leax	testq,pcr
		ldu	#KEYQ
		ldb	,x
		incb
1		lda	,x+
		sta	,u+
		decb
		bne	1B
		lbsr	newprog
		clr	$0340		; מצב הגרפיקה (gfx.s) יאותחל בפעם הראשונה
		clr	LASTKEY
		ldd	#0
		std	KPREV
		std	KPREV+2
		std	KPREV+4
		std	KPREV+6
		leax	banner,pcr
		lbsr	puts
		bra	main_ok
; הלולאה הראשית: קוראים שורה ומבצעים אותה
main		lbsr	getline
		lbsr	execute
main_ok		lbsr	gfx_text	; ההודעה OK תמיד על מסך הטקסט
		lda	CURSOR+1	; אם הסמן לא בתחילת שורה (PRINT שנגמר ב-;), קודם שורה חדשה
		anda	#$1f
		beq	1F
		lda	#13
		lbsr	putc
1		leax	ok,pcr
		lbsr	puts
		bra	main
ok		fcc	"OK"
		fcb	13,0

; ---------- חומרה ----------
hw_init
		; PIA0: A = שורות המקלדת (קלט), B = עמודות (פלט)
		clr	PIA0+1		; CRA: גישה ל-DDR
		clr	PIA0		; DDRA: הכול קלט
		lda	#$04
		sta	PIA0+1		; CRA: חזרה לנתונים
		clr	PIA0+3
		lda	#$ff
		sta	PIA0+2		; DDRB: הכול פלט
		lda	#$04
		sta	PIA0+3
		; PIA1: B = מצב ה-VDG (ביטים 3-7 פלט)
		clr	PIA1+3
		lda	#$f8
		sta	PIA1+2
		lda	#$04
		sta	PIA1+3
		clr	PIA1+2		; מצב טקסט, ערכת צבעים 0
		; SAM: מצב תצוגה טקסט (V0-V2=0), תחילת המסך ב-$0400 (F1=1)
		sta	SAM+0		; V0=0
		sta	SAM+2		; V1=0
		sta	SAM+4		; V2=0
		sta	SAM+6		; F0=0
		sta	SAM+9		; F1=1
		sta	SAM+10		; F2=0
		sta	SAM+12		; F3=0
		sta	SAM+14		; F4=0
		sta	SAM+16		; F5=0
		sta	SAM+18		; F6=0
		rts

; ---------- מסך ----------
cls		ldx	#SCREEN
		ldd	#$6060		; רווח (ירוק)
1		std	,x++
		cmpx	#SCREND
		blo	1B
		ldx	#SCREEN
		stx	CURSOR
		rts

; putc: התו ב-A (ASCII) למסך במקום הסמן. 13 = שורה חדשה
putc		pshs	a,b,x
		cmpa	#13
		beq	newline
		cmpa	#$40
		bhs	1F
		adda	#$40		; ASCII $20-$3F → קוד VDG $60-$7F
		bra	2F
1		cmpa	#$60
		blo	2F
		cmpa	#$80
		bhs	2F
		suba	#$20		; אותיות קטנות → גדולות
2		ldx	CURSOR
		sta	,x+
		stx	CURSOR
		cmpx	#SCREND
		blo	putc_done
		lbsr	scroll
		bra	putc_done
newline		ldd	CURSOR
		addd	#32
		andb	#$e0
		std	CURSOR
		cmpd	#SCREND
		blo	putc_done
		lbsr	scroll
putc_done	puls	a,b,x,pc

; scroll: כל השורות עולות אחת, והאחרונה מתנקה
scroll		pshs	d,x
		ldx	#SCREEN
1		ldd	32,x
		std	,x++
		cmpx	#SCREND-32
		blo	1B
		ldd	#$6060
2		std	,x++
		cmpx	#SCREND
		blo	2B
		ldx	#SCREND-32
		stx	CURSOR
		puls	d,x,pc

; puts: מחרוזת ב-X שמסתיימת ב-0
puts		lda	,x+
		beq	1F
		bsr	putc
		bra	puts
1		rts

banner		fcc	"DRAGON 1982 BASIC 1.0"
		fcb	13
		fcc	"(C) 2026 GONEN YAROM"
		fcb	13,13,0

; ---------- מקלדת ----------
; מטריצת המקלדת של ה-Dragon: עמודה = ביט ב-PIA0 B (פלט, 0 = נסרקת), שורה = ביט ב-PIA0 A (קלט, 0 = לחוץ)
; שורה 0: 0-7, שורה 1: 8 9 : ; , - . /, שורה 2: @ A-G, שורה 3: H-O, שורה 4: P-W,
; שורה 5: X Y Z ↑ ↓ ← → רווח, שורה 6: ENTER CLEAR BREAK, ו-SHIFT בעמודה 7
KEYMAP		fcc	"01234567"
		fcc	"89:;,-./"
		fcc	"@ABCDEFG"
		fcc	"HIJKLMNO"
		fcc	"PQRSTUVW"
		fcb	'X,'Y,'Z,$5e,$0a,$08,$09,$20
		fcb	13,12,3,0,0,0,0,0
SHIFTED		fcc	"0!\"#$%&'"		; SHIFT על 0-7
		fcc	"()*+<=>?"			; SHIFT על השורה השנייה

; keyindex: סריקה מלאה. מחזיר ב-A את התו של מקש שנלחץ עכשיו (לא היה לחוץ בסריקה הקודמת), או 0.
; משווים כל עמודה לסריקה הקודמת (KPREV), כך שמקש חדש נקלט גם כשהקודם עדיין לחוץ (הקלדה מהירה)
keyindex	pshs	b,x,y
		ldy	#KEYMAP
		clr	KFOUND		; 0 = אין; אחרת האינדקס בטבלה + 1
		clrb			; עמודה
ki_col		lda	#1
		pshs	b
		tstb
		beq	2F
1		lsla
		decb
		bne	1B
2		coma
		sta	PIA0+2
		puls	b
		lda	PIA0
		coma
		anda	#$7f		; השורות הלחוצות עכשיו
		ldx	#KPREV
		pshs	a
		lda	b,x
		coma
		anda	,s		; חדש = עכשיו וגם לא קודם
		sta	KNEW
		puls	a
		sta	b,x		; לסריקה הבאה
		cmpb	#3
		blo	3F
		lda	KNEW		; שורה 6 היא תו רק בעמודות 0-2 (ENTER, CLEAR, BREAK). SHIFT לא
		anda	#$3f
		sta	KNEW
3		tst	KFOUND
		bne	ki_next
		lda	KNEW
		beq	ki_next
		clr	KROW		; השורה הנמוכה שנלחצה
4		lsra
		bcs	5F
		inc	KROW
		bra	4B
5		stb	KCOL
		lda	KROW
		ldb	#8
		mul
		addb	KCOL
		incb
		stb	KFOUND
		ldb	KCOL
ki_next		incb
		cmpb	#8
		blo	ki_col
		ldb	KFOUND
		beq	ki_none
		decb
		lda	b,y		; התו
		beq	ki_none
		pshs	a
		lda	KPREV+7		; SHIFT לחוץ? (עמודה 7, שורה 6)
		bita	#$40
		puls	a
		beq	ki_out
		cmpb	#16
		bhs	ki_out
		ldx	#SHIFTED
		lda	b,x
		bra	ki_out
ki_none		clra
ki_out		puls	b,x,y,pc

; inkey: מקש בלי לחכות (INKEY$): מהתור, או מקש שנלחץ עכשיו. אין: A=0
inkey		ldb	KEYQ
		bne	gk_pop
		lbra	keyindex

; getkey: מחכה למקש, מחזיר את התו ב-A. קודם תור הבדיקות (KEYQ), אחר כך המקלדת
getkey		pshs	b,x
gk_loop		ldb	KEYQ
		beq	gk_scan
		bsr	gk_pop
		puls	b,x,pc
; gk_pop: התו הראשון בתור, ומזיזים את השאר
gk_pop		pshs	b,x
		lda	KEYQ+1		; התו הראשון בתור, ומזיזים את השאר
		ldx	#KEYQ+1
1		ldb	1,x
		stb	,x+
		cmpx	#KEYQ+250
		blo	1B
		dec	KEYQ
		puls	b,x,pc
gk_scan		lbsr	keyindex
		tsta
		beq	gk_loop
		puls	b,x,pc

; getline: קורא שורה למאגר LINBUF (מסתיים ב-0). ← מוחק, ENTER מסיים
getline		pshs	b,x
		ldx	#LINBUF
		ldb	#0
gl_key		lbsr	cursor_on
		bsr	getkey
		lbsr	cursor_off
		cmpa	#13
		beq	gl_done
		cmpa	#8
		beq	gl_back
		cmpa	#$20
		blo	gl_key		; מקשים מיוחדים אחרים: מתעלמים בינתיים
		cmpb	#LINMAX
		bhs	gl_key
		sta	b,x
		incb
		lbsr	putc
		bra	gl_key
gl_back		tstb
		beq	gl_key
		decb
		pshs	x
		ldx	CURSOR
		leax	-1,x
		lda	#$60
		sta	,x
		stx	CURSOR
		puls	x
		bra	gl_key
gl_done		clr	b,x
		lda	#13
		lbsr	putc
		puls	b,x,pc

; הסמן: ריבוע מלא במקום הבא במסך
cursor_on	pshs	a,x
		ldx	CURSOR
		lda	#$8f
		sta	,x
		puls	a,x,pc
cursor_off	pshs	a,x
		ldx	CURSOR
		lda	#$60
		sta	,x
		puls	a,x,pc

		include	"fp.s"
		include	"basic.s"
		include	"interp.s"
		include	"gfx.s"
		include	"funcs.s"
		include	"sound.s"
		include	"stmt2.s"
		include	"strings.s"
		include	"testq.s"

; ---------- וקטורים ----------
; ה-SAM ממפה את $FFF2-$FFFF אל $BFF2-$BFFF
		org	$bff2
		fdb	reset,reset,reset,reset,reset,reset,reset
