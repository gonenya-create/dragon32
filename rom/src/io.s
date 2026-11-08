; Dragon 1982 BASIC — ניסוי שלב 1: חומרה, מסך ומקלדת.
; מועתק מ-rom/src/boot.s (קוד שלנו, נכתב מאפס), בלי חלקי המפרש. משתני העבודה הוזזו לאזור $03EA-$03FC,
; שהספרים מסמנים כפנוי, כדי לא לדרוך על הכתובות הקבועות של ה-Dragon.
hw_init
		; PIA0: A = שורות המקלדת (קלט), B = עמודות (פלט)
		ldx	#PIA0
		bra	isl_bde7_e	;@isl
		fill	$ff,$bde7-*	;@isl
		jmp	tsync	;@isl
isl_bde7_e	;@isl
		ldb	#$34		; CR: גישה לנתונים; CA2/CB2 פלט נמוך — בוררי הצליל, הצליל והמנוע כבויים (קורא: צליל 0.3)
		clra
		bsr	piaddr		; DDRA: הכול קלט
		lda	#$ff
		bsr	piaddr2		; DDRB: הכול פלט
		; PIA1: A = ה-DAC בביטים 2-7, ומדפסת בביט 1 (פלט); ביט 0 קלט הקלטת
		leax	PIA1-PIA0-2,x
		lda	#$fe
		bsr	piaddr
		clr	,x		; $FF20 = 0
		; PIA1: B = מצב ה-VDG (ביטים 3-7 פלט)
		lda	#$f8
		bsr	piaddr2
		bsr	txtmode		; מצב טקסט, ערכת צבעים 0; SAM: מצב 0, המסך ב-$0400
		jmp	,y		; חוזרים דרך Y (קורא: ממשקים, הכניסה ב-$8000)
; piaddr: CR (1,x) לגישה ל-DDR, DDR (,x) = A, ו-CR = B. piaddr2: אותו דבר לצד B (X עולה ב-2)
piaddr2		leax	2,x
piaddr		clr	1,x
		sta	,x
		stb	1,x
		rts
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
		fcb	$8c		; cmpx #: מדלג על השורה הבאה
2		sta	,x
		cmpx	#SAM
		bne	1B
		puls	a,x,pc
; noserv: המדפסת (בהמשך) וכניסות התקשורת שאין ב-Dragon 32
noserv		rts
; ---------- מסך ----------
cls		ldx	#SCREEN
; clrto: הסמן ב-X, ומשם עד סוף המסך רווחים (גם scroll). clrxd: אותו דבר עם התא שב-D (CLS n)
clrto		ldd	#$6060		; רווח (ירוק)
clrxd		stx	CURSOR
1		std	,x++
		cmpx	#SCREND
		blo	1B
		rts

; putc: התו ב-A למסך במקום הסמן (קורא: docs/DRAGON-SPEC-SCREEN.md, סעיף 3)
; קודם חוזרים למצב טקסט (SAMALP). $20-$3F → $60-$7F; $40-$5F ו-$80-$FF כמו שהם; $60-$7F → $00-$1F (הפוך).
; 13: רווחים עד סוף השורה (כולל התא הנוכחי) ושורה חדשה. 8: תא אחד אחורה ורווח. שאר תווי הבקרה: כלום
putc		bsr	txtmode
; putcr ($BCAB, ו-$800C): אותו דבר בלי לחזור למצב טקסט (קורא 10.6): A, ‏B ו-X נשמרים
putcr		pshs	a,b,x
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

; puts ($99E6): מחרוזת ב-X שמסתיימת ב-0, להתקן שב-DEVNUM. כמו במקור (קורא 10.5): X נעצר על ה-0, ‏A = 0 ו-Z = 1.
; (במקור יש גם תקרה של 249 תווים ו-B סופר; אצלנו B לא משתנה, ואין תקרה)
puts		lda	,x
		beq	1F
		lbsr	chrout
		leax	1,x
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
; הטבלה ($0151-$0159) שומרת את מה שנקרא מ-PIA0 כמו במקור: מקש לחוץ = 0, וביט 7 דולק (29.10). תוכנות קוראות אותה ישר:
; SAS (Peaksoft) בודק PEEK(341)=223 לחץ למעלה, והטוען של Cricket כותב לשם $FF ו-$BF
keyindex	pshs	b,x
		ldx	#KPREV		; KALL ($0151) צמוד לפניו: גישה דרך X חוסכת שני בתים (28.10)
; כפתור ג'ויסטיק לחוץ: אין מקש, כמו במקור (DRAGON-SPEC-ENTRIES, $BBE5). בלי אף עמודה, שורה נמוכה היא כפתור, לא מקש.
; Starman Jones (Blaby) עוצר את המשחק כש-$BBE5 מחזיר מקש, אז הירי עצר אותו מיד (8.11)
		lda	#$ff
		sta	PIA0+2
		lda	PIA0
		ora	#$80
		inca			; $FF (אין כפתור) → 0, וכך A כבר 0 לשורה הבאה
		bne	ki_none
					; כל העמודות למטה, קריאה אחת. בלי שינוי מהפעם הקודמת: יוצאים מהר (קורא 2.10)
		sta	PIA0+2		; כתיבה בלי קריאה: CLR קורא קודם את $FF02, והקריאה מוחקת את דגל פסיקת השדה (Phantom Slayer קפא). אותם 7 מחזורים
		lda	PIA0
		ora	#$80		; כמו במקור: מה שנקרא, וביט 7 דולק
		cmpa	-1,x		; KALL
		beq	ki_none
		sta	-1,x
		clr	,-s		; KFOUND, במחסנית: 0 = אין; אחרת האינדקס בטבלה + 1
; (1.11: המשתנים הזמניים עברו מ-$03F2-$03F5 למחסנית. הטוען של Donkey King (Microdeal) שומר שם נתונים,
; והסריקה שלנו דרסה אותם: המקשים נקלטו רק לפעמים. סימן שהמקור לא משתמש בכתובות האלה)
		ldd	#$fe00		; A = מסכת העמודה (0 = נסרקת), B = העמודה
ki_col		sta	PIA0+2
		pshs	a		; המסכה
		lda	b,x		; הקודם
		pshs	a
		lda	PIA0
		ora	#$80
		sta	b,x		; לסריקה הבאה, כמו במקור (לחוץ = 0)
		coma			; השורות הלחוצות עכשיו = 1 (ביט 7 = 0)
		anda	,s+		; חדש = עכשיו וגם לא קודם (בקודם, לא לחוץ = 1)
		cmpb	#3
		blo	3F
		anda	#$3f		; שורה 6 היא תו רק בעמודות 0-2 (ENTER, CLEAR, BREAK). SHIFT לא
3		tst	1,s		; KFOUND (מעליו במחסנית: המסכה)
		bne	ki_next
		tsta
		beq	ki_next
		pshs	b		; העמודה
		incb			; האינדקס + 1 = 8*שורה + עמודה + 1
4		lsra
		bcs	5F
		addb	#8
		bra	4B
5		stb	2,s		; KFOUND
		puls	b
ki_next		puls	a		; המסכה של העמודה הבאה
		lsla
		inca
		incb
		cmpb	#8
		blo	ki_col
		ldb	,s+		; KFOUND
		beq	ki_none
		decb
		lda	7,x		; SHIFT לחוץ? (KPREV+7, שורה 6) → C = 0 כשהוא לחוץ (לחוץ = 0 בטבלה)
		lsla
		lsla
		ldx	#KEYMAP		; (LD לא משנה את C)
		lda	b,x		; התו
		beq	ki_none
		bcs	ki_low		; בלי SHIFT
		cmpb	#16
		blo	1F
		cmpa	#$5e		; SHIFT+↑ = $5F (ב-EDIT: יציאה ממצב הוספה)
		bne	ki_out
		inca
		bra	ki_out
1		leax	SHIFTED-KEYMAP,x	; b < 16
		lda	b,x
		bra	ki_out
ki_none		clra
ki_out		tsta			; Z לפי התו
		puls	b,x,pc
; אות בלי SHIFT כשהנעילה ($0149, ALLOCK) כבויה = 0: אות קטנה, כמו במקור (מפרט המסך 3א). בהדלקה $FF: אותיות גדולות.
; ‏Donkey King (Microdeal) כותב 0 ל-$0149 ומחכה ל-'y' או 'n' קטנות (1.11)
ki_low		cmpa	#'A
		blo	ki_out
		cmpa	#'Z
		bhi	ki_out
		tst	$0149
		bne	ki_out
		ora	#$20
		bra	ki_out

; getkey: מחכה למקש, ומחזיר את התו ב-A. כמו במקור: הבהוב (עם השהיה), ואז סריקה דרך $BBE5, ושוב.
; מקש: $60 בתא הסמן, ורק אז הוא חוזר (קורא 2.5, 8.1)
getkey		pshs	b,x
gk_loop		bsr	blink
		jsr	$bbe5		; סריקת המקלדת, דרך הכניסה הקבועה (כמו במקור)
gk_r		beq	gk_loop
gk_got		ldx	CURSOR
		ldb	#$60
		stb	,x
		puls	b,x,pc
; blink (קורא): CBLCNT יורד; ב-0: ביט $40 בתא הסמן מתהפך, והמונה חוזר ל-50. אחר כך השהיה: 1118 סיבובים של 8 מחזורים
; @nofill: לולאות מתוזמנות, לפי מחזורים. tools/islands.py לא מכניס כאן גושים
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
; @endnofill

; ---- בסוף ה-ROM (31.10): מה שהועבר לכאן כדי לפנות מקום לכניסות $B748, $B87E ו-$BBC8 ----
; הערכים של הקלטת בהדלקה (מועתקים ל-$8F): הבהוב הסמן, מבוא 128 (Dragon 32, גונן 20.10: לבדוק במחשב אמיתי),
; ספים $12/$0A/$12, השהיית מנוע $DA5C
tdefs		fcb	50,$00,$80,$12,$0a,$12,$da,$5c
		fdb	$045e		; $97: השהיית המקלדת (קורא: מדפסת 7.1)
		fcb	16,116,132	; $99-$9B המדפסת: רוחב שדה הפסיק, שדה הפסיק האחרון, רוחב השורה (קורא 1.5)

; srchq ($B87E): החיפוש הרגיל (search), כשהשורה הנוכחית אינה "פקודה ישירה": בלי ניקוי, בלי S/F ובלי השם.
; בלוקים עד כותרת, ואם יש שם בפקודה, עד שהשם מתאים. השורה הנוכחית חוזרת בסוף
; (8.11: srchq עבר לשני רווחים, לפני $9D3D וב-mitrun.s, כדי לפנות מקום בסוף ה-ROM לבדיקת כפתורי הג'ויסטיק)

; (dlyx עבר ב-3.11 לרווח שלפני $BAD4, ב-mitfile.s, כדי לפנות מקום בסוף ה-ROM לפסיקה)
