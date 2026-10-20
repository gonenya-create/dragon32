; Dragon 1982 BASIC — ניסוי שלב 1: חומרה, מסך ומקלדת.
; מועתק מ-rom/src/boot.s (קוד שלנו, נכתב מאפס), בלי חלקי המפרש. משתני העבודה הוזזו לאזור $03EA-$03FC,
; שהספרים מסמנים כפנוי, כדי לא לדרוך על הכתובות הקבועות של ה-Dragon.
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
		; PIA1: A = ה-DAC בביטים 2-7, ומדפסת בביט 1 (פלט); ביט 0 קלט הקלטת
		clr	PIA1+1
		lda	#$fe
		sta	PIA1
		lda	#$04
		sta	PIA1+1
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
		blo	1F
		cmpa	#$5e		; SHIFT+↑ = $5F (ב-EDIT: יציאה ממצב הוספה)
		bne	ki_out
		inca
		bra	ki_out
1		ldx	#SHIFTED
		lda	b,x
		bra	ki_out
ki_none		clra
ki_out		puls	b,x,y,pc

; inkey: מקש בלי לחכות (INKEY$): מהתור, או מקש שנלחץ עכשיו. אין: A=0
inkey		ldd	KQCNT
		bne	gk_pop
		lbra	keyindex

; getkey: מחכה למקש, מחזיר את התו ב-A. קודם תור הבדיקות (KEYQ), אחר כך המקלדת
getkey		pshs	b,x
gk_loop		ldd	KQCNT
		beq	gk_scan
		bsr	gk_pop
		puls	b,x,pc
; gk_pop: התו הבא בתור
gk_pop		pshs	b,x
		ldd	KQCNT
		subd	#1
		std	KQCNT
		ldx	KQPTR
		lda	,x+
		stx	KQPTR
		puls	b,x,pc
gk_scan		lbsr	keyindex
		tsta
		bne	1F
		; הסמן מהבהב: ריבוע שחור ורווח, בערך פעמיים בשנייה (לפי השעון)
		ldx	CURSOR
		lda	TICKS+1
		anda	#$10
		beq	2F
		lda	#$60
		bra	3F
2		lda	#$80
3		sta	,x
		bra	gk_loop
1
		puls	b,x,pc
