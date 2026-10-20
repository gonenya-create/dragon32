; Dragon 1982 BASIC — ניסוי שלב 1: חומרה, מסך ומקלדת.
; מועתק מ-rom/src/boot.s (קוד שלנו, נכתב מאפס), בלי חלקי המפרש. משתני העבודה הוזזו לאזור $03EA-$03FC,
; שהספרים מסמנים כפנוי, כדי לא לדרוך על הכתובות הקבועות של ה-Dragon.
hw_init
		; PIA0: A = שורות המקלדת (קלט), B = עמודות (פלט)
		ldx	#PIA0
		ldb	#$04		; CR: גישה לנתונים
		clr	1,x		; CRA: גישה ל-DDR
		clr	,x		; DDRA: הכול קלט
		stb	1,x		; CRA: חזרה לנתונים
		clr	3,x
		lda	#$ff
		sta	2,x		; DDRB: הכול פלט
		stb	3,x
		; PIA1: A = ה-DAC בביטים 2-7, ומדפסת בביט 1 (פלט); ביט 0 קלט הקלטת
		ldx	#PIA1
		clr	1,x
		lda	#$fe
		sta	,x
		stb	1,x
		; PIA1: B = מצב ה-VDG (ביטים 3-7 פלט)
		clr	3,x
		lda	#$f8
		sta	2,x
		stb	3,x
		; ממשיכים ב-txtmode: מצב טקסט, ערכת צבעים 0; SAM: מצב 0, המסך ב-$0400
; txtmode: מצב טקסט (קורא: SAMALP). ב-$FF22 נשארים 3 הביטים התחתונים; SAM: מצב 0, המסך ב-$0400
txtmode		pshs	a,x
		lda	PIA1+2
		anda	#$07
		sta	PIA1+2
		ldx	#SAM+20	; לפי הסדר שבמקור: $FFD2 $FFD0 $FFCE $FFCC $FFCA $FFC9 $FFC6 $FFC4 $FFC2 $FFC0
1		leax	-2,x
		cmpx	#SAM+8		; במקום F1=0 ($FFC8): F1=1 ($FFC9)
		bne	2F
		sta	1,x
		bra	3F
2		sta	,x
3		cmpx	#SAM
		bne	1B
		puls	a,x,pc
; ---------- מסך ----------
cls		ldx	#SCREEN
; clrto: הסמן ב-X, ומשם עד סוף המסך רווחים (גם scroll)
clrto		stx	CURSOR
		ldd	#$6060		; רווח (ירוק)
1		std	,x++
		cmpx	#SCREND
		blo	1B
		rts

; putc: התו ב-A למסך במקום הסמן (קורא: docs/DRAGON-SPEC-SCREEN.md, סעיף 3)
; קודם חוזרים למצב טקסט (SAMALP). $20-$3F → $60-$7F; $40-$5F ו-$80-$FF כמו שהם; $60-$7F → $00-$1F (הפוך).
; 13: רווחים עד סוף השורה (כולל התא הנוכחי) ושורה חדשה. 8: תא אחד אחורה ורווח. שאר תווי הבקרה: כלום
putc		pshs	a,b,x
		bsr	txtmode
		ldx	CURSOR
		cmpa	#13
		beq	pc_cr
		cmpa	#8
		beq	pc_bs
		cmpa	#$20
		blo	putc_done
		cmpa	#$40
		blo	1F
		cmpa	#$60
		blo	2F
		cmpa	#$80
		bhs	2F
		adda	#$60		; $60-$7F: יחד עם ה-$40 שאחריו, פחות $60
1		adda	#$40
2		sta	,x+
pc_adv		stx	CURSOR
		cmpx	#SCREND
		blo	putc_done
		; גלילה: כל השורות עולות אחת, והאחרונה מתנקה
		ldx	#SCREEN
4		ldd	32,x
		std	,x++
		cmpx	#SCREND-32
		blo	4B
		bsr	clrto
		bra	putc_done
pc_cr		ldb	CURSOR+1	; כמה תאים עד סוף השורה (1-32)
		orb	#$e0		; 32 פחות העמודה
		negb
		lda	#$60
3		sta	,x+
		decb
		bne	3B
		bra	pc_adv
pc_bs		cmpx	#SCREEN
		beq	putc_done
		lda	#$60
		sta	,-x
		stx	CURSOR
putc_done	puls	a,b,x,pc

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
		bra	gk_got
; gk_pop: התו הבא בתור
gk_pop		pshs	b,x
		ldx	KQCNT
		leax	-1,x
		stx	KQCNT
		ldx	KQPTR
		lda	,x+
		stx	KQPTR
		puls	b,x,pc
; לולאת ההמתנה (קורא): הבהוב (עם השהיה), סריקה, ושוב. מקש: $60 בתא הסמן, ורק אז הוא חוזר
gk_scan		bsr	blink
		lbsr	keyindex	; Z לפי A
		beq	gk_loop
gk_got		ldx	CURSOR
		ldb	#$60
		stb	,x
		puls	b,x,pc
; blink (קורא): CBLCNT יורד; ב-0: ביט $40 בתא הסמן מתהפך, והמונה חוזר ל-50. אחר כך השהיה: 1118 סיבובים של 8 מחזורים
blink		pshs	a,x
		dec	CBLCNT
		bne	1F
		ldx	CURSOR
		lda	,x
		eora	#$40
		sta	,x
		lda	#50
		sta	CBLCNT
1		ldx	#$045e
2		leax	-1,x
		bne	2B
		puls	a,x,pc
