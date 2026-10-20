; Dragon 1982 BASIC — שלב 3, חלק 5: קלטת. צעד 1: הבסיס (מנוע, כתיבה וקריאה של ביט, בית ובלוק).
; הכול לפי הקורא: docs/DRAGON-SPEC-TAPE.md (עובדות בלבד, בלי קוד). נכתב מאפס.
; התזמון חשוב כאן: כל קפיצה בקוד המתוזמן קצרה (bsr/bra) או jsr מפורש, כדי שהכלים לא ישנו אותה.

BLKTYP		equ	$7c		; סוג הבלוק
BLKLEN		equ	$7d		; אורך הבלוק
BLKADR		equ	$7e		; 2 בתים: כתובת הנתונים
CSUM		equ	$80		; סכום הביקורת
BLKRES		equ	$81		; ספירת הבתים בבלוק, ואחר כך התוצאה: 0 תקין, 1 ביקורת, 2 זיכרון
POLLS		equ	$82		; מונה הדגימות
SYNCNT		equ	$83		; מונה הביטים בבית, ומונה הסנכרון (עם סימן)
PHASE		equ	$84		; 0 = מזמנים מעלייה לעלייה, אחרת מירידה לירידה
HELD		equ	$85		; הערך שנשמר מהביט הקודם ל-DAC
LDRCNT		equ	$90		; 2 בתים: אורך המבוא
BITLIM		equ	$92		; סף הביט, בדגימות
HALFLIM		equ	$93		; סף חצי גל קצר/ארוך (רק בסנכרון)
HALFMAX		equ	$94		; חצי גל מקסימלי (רק בסנכרון)
MOTDLY		equ	$95		; 2 בתים: השהיית המנוע (8 מחזורים לספירה)

; ---------- מנוע (קורא 1.1) ----------
; tmoton: המנוע דולק, ואז השהיה של MOTDLY ספירות (תמיד, גם אם כבר דלק). A ו-X משתנים (X=0)
tmoton		lda	PIA1+1
		ora	#8
		sta	PIA1+1
		ldx	MOTDLY
1		leax	-1,x
		bne	1B
		rts
; motoff: המנוע כבוי, והפסיקות פתוחות. A משתנה
motoff		lda	PIA1+1
		anda	#$f7
		sta	PIA1+1
		andcc	#$af
		rts

; ---------- כתיבת בית (קורא 1.3) ----------
; twbyte: A = הבית, מהביט הנמוך. כל ביט = גל סינוס מדורג: קודם הערך השמור מהביט הקודם, ואז מהטבלה:
; לביט 0 האינדקסים 0-34 (35 נשמר לבא), לביט 1 הזוגיים 0-32 (34 נשמר). המרווחים בין כתיבות:
; ביט 0: 26, אחר כך 22, ובסוף 39 (813). ביט 1: 27, אחר כך 23, ובסוף 40 (435). A נשמר; B ו-Y משתנים
twbyte		pshs	a
		ldb	#1		; המסכה של הביט (הבית במחסנית לא משתנה)
1		lda	HELD
		sta	PIA1		; הערך השמור
		ldy	#tsin
		bitb	,s		; הביט הבא
		nop
		nop
		bne	3F
2		lda	,y+		; ביט 0
		sta	PIA1
		cmpy	#tsin+35
		brn	*
		bne	2B
		brn	*
		lda	,y++		; אינדקס 35
5		sta	HELD
		lslb
		bne	1B
		puls	a,pc
3		lda	,y++		; ביט 1
		sta	PIA1
		cmpy	#tsin+34
		brn	*
		bne	3B
		lda	,y+		; אינדקס 34
		nop
		bra	5B
tsin		fcb	$80,$90,$a8,$b8,$c8,$d8,$e8,$f0,$f8
		fcb	$f8,$f8,$f0,$e8,$d8,$c8,$b8,$a8,$90
		fcb	$78,$68,$50,$40,$30,$20,$10,$08,$00
		fcb	$00,$00,$08,$10,$20,$30,$40,$50,$68

; ---------- מבוא (קורא 1.4) ----------
; tleader: פסיקות חסומות, מנוע (עם ההשהיה), ואז LDRCNT בתים של $55 (0 = 65536). B ו-Y נשמרים
tleader		orcc	#$50
		bsr	tmoton
		pshs	b,y
		ldx	LDRCNT
		lda	#$55
1		bsr	twbyte
		leax	-1,x
		bne	1B
		puls	b,y,pc

; ---------- כתיבת בלוק (קורא 1.5) ----------
; tblkwr: סוג ב-$7C, אורך ב-$7D, נתונים ב-$7E. קודם סכום הביקורת, ואז $55 $3C סוג אורך נתונים סכום $55.
; בלי מנוע ובלי מבוא. הבתים עוברים דרך הכניסה ב-$801E, כמו במקור; ההשהיות בין הבתים מכוונות לפי המפרט
tblkwr		orcc	#$50
		ldx	BLKADR
		lda	BLKTYP
		adda	BLKLEN
		ldb	BLKLEN
		stb	BLKRES
		beq	2F
1		adda	,x+
		decb
		bne	1B
2		sta	CSUM
		ldx	BLKADR
		lda	#$55
		jsr	twslot
		lda	#$3c
		brn	*
		jsr	twslot
		lda	BLKTYP
		brn	*
		jsr	twslot
		lda	BLKLEN
		brn	*
		jsr	twslot
		ldb	>BLKRES		; 5 מחזורים
		beq	4F
3		lda	,x+
		jsr	twslot
		brn	*
		dec	BLKRES
		bne	3B
4		lda	CSUM
		jsr	twslot
		lda	#$55		; הבית שאחרי הבלוק: ישירות
		jsr	twbyte
		rts

; ---------- קריאה (קורא 1.6-1.8) ----------
; trbit: ביט ב-C (1 = גל קצר). לפי PHASE: גבוה ואז נמוך, או נמוך ואז גבוה. פחות 1, מול BITLIM
trbit		clr	POLLS
		tst	PHASE
		bne	1F
		bsr	twhi
		bsr	twlo
		bra	2F
1		bsr	twlo
		bsr	twhi
2		ldb	POLLS
		decb
		cmpb	BITLIM
		rts
; trbyte: 8 ביטים, כל אחד נכנס מלמעלה (הראשון נגמר בביט 0) → A. B משתנה, SYNCNT = 0
trbyte		lda	#8
		sta	SYNCNT
1		bsr	trbit
		rora
		dec	SYNCNT
		bne	1B
		rts

; ---------- קריאת בלוק (קורא 1.9) ----------
; tblkrd: הנתונים ל-$7E. מחפשים $3C ביט אחרי ביט, ואז סוג, אורך, נתונים (כל בית נבדק בקריאה חוזרת) וסכום.
; התוצאה ב-$81 וב-A (Z רק ב-0). U ו-Y נשמרים; הפסיקות חסומות והמנוע נשאר דולק
tblkrd		orcc	#$50
		lda	CURLIN		; פקודה ישירה: מהבהבים את התו בפינה
		inca
		bne	1F
		lda	SCREEN
		eora	#$40
		sta	SCREEN
1		clra
2		bsr	trbit
		rora
		cmpa	#$3c
		bne	2B
		bsr	trbyte
		sta	BLKTYP
		bsr	trbyte
		sta	BLKLEN
		adda	BLKTYP
		sta	CSUM
		ldx	BLKADR
		ldb	BLKLEN
		stb	BLKRES
		beq	5F
3		bsr	trbyte
		sta	,x
		cmpa	,x+
		bne	8F
		adda	CSUM
		sta	CSUM
		dec	BLKRES
		bne	3B
5		bsr	trbyte
		suba	CSUM
		beq	7F
		lda	#1
7		sta	BLKRES
		rts
8		lda	#2
		bra	7B

; tpoll: דגימה אחת (28 מחזורים בלולאות ההמתנה): המונה עולה, וביט הקלטת ב-C. B משתנה
tpoll		inc	POLLS
		ldb	PIA1
		lsrb
		rts
twhi		bsr	tpoll		; מחכים כל עוד גבוה
		bcs	twhi
		rts
twlo		bsr	tpoll		; מחכים כל עוד נמוך
		bcc	twlo
		rts

; ---------- סנכרון (קורא 1.7) ----------
; tsync: פסיקות חסומות, מנוע, ואז מכונת ארבעה מצבים על חצאי הגל, עד ±96. U ו-Y נשמרים
tsync		orcc	#$50
		lbsr	tmoton
		clr	SYNCNT
ts2		bsr	twhi		; עלייה
		bsr	twlo
tsA		bsr	thh		; A: חצי גבוה
		cmpa	#2
		beq	tsB
tsC		bsr	thl		; C: חצי נמוך
		cmpa	#1
		beq	tsD
		inc	SYNCNT
		lda	SYNCNT
		cmpa	#96
		bne	ts2
		sta	PHASE		; לא 0: מירידה לירידה
		rts
tsB		bsr	thl		; B: חצי נמוך
		cmpa	#2
		beq	tsA
tsD		bsr	thh		; D: חצי גבוה
		cmpa	#1
		beq	tsC
		dec	SYNCNT
		lda	SYNCNT
		cmpa	#-96
		bne	ts2
		clr	PHASE
		rts
; thh / thl: מזמנים חצי גבוה / נמוך → A: 0 לא זה ולא זה, 1 קצר, 2 ארוך. ארוך מדי: גם SYNCNT = 0
thh		clr	POLLS
		bsr	twhi
		bra	1F
thl		clr	POLLS
		bsr	twlo
1		ldb	POLLS
		clra
		cmpb	HALFLIM
		blo	3F
		beq	9F
		cmpb	HALFMAX
		bhi	2F
		lda	#2
		rts
3		inca
		rts
2		clr	SYNCNT
9		rts

; הערכים של הקלטת בהדלקה (מועתקים ל-$8F): הבהוב הסמן, מבוא 128 (Dragon 32, גונן 20.10: לבדוק במחשב אמיתי),
; ספים $12/$0A/$12, השהיית מנוע $DA5C
tdefs		fcb	50,$00,$80,$12,$0a,$12,$da,$5c
