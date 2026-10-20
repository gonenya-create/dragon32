; Dragon 1982 BASIC — שלב 3, חלק 2: PRINT USING. לפי הקורא: docs/DRAGON-SPEC-USING.md. נכתב מאפס.
; המשתנים באזור העבודה המשותף $CF-$DD, כמו במקור (USSCNT $D3, USDPTR $D5, USFLG $D7...). לא ב-$DE-$E9: שם ההגדרות של PLAY ו-DRAW

USDSC		equ	$d5		; 2 בתים: מתאר התבנית (קוראים ממנו כל פעם: איסוף מחרוזות יכול להזיז אותה)
USPOS		equ	$d3		; המקום בתבנית
USANY		equ	$da		; במחזור הזה נצרך ערך?
USEND		equ	$db		; 0: יש עוד ערכים. 1: הרשימה נגמרה בלי מפריד. 2: עם ; או ,
USL		equ	$d9		; השדה המספרי: המקומות לפני הנקודה (כולל + מוביל, ** $$ **$ ופסיקים)
USD		equ	$d8		; ספרות אחרי הנקודה ($FF: אין נקודה)
USFLG		equ	$d7		; 1 פסיקים, 2 כוכביות, 4 דולר, 8 + מוביל, $10 + נגרר, $20 - נגרר, $40 מעריך
USW		equ	$dc		; רוחב שדה מחרוזת (! = 1)
USEPT		equ	$cf		; 2 בתים, רק בזמן הסריקה: סוף התבנית (חופף ל-USSG/USP, שמשמשים אחר כך)

; usstart: אחרי PRINT, כש-A = $CD (USING)
usstart		jsr	<chrget
		lbsr	frmevl
		lbsr	frestr0		; התבנית חייבת להיות מחרוזת
		stx	USDSC
		lda	#';
		lbsr	synchk
		ldx	USDSC
		tst	,x
		lbeq	err_fc		; תבנית ריקה
		clr	USEND
		jsr	<chrgot		; אין ערכים בכלל?
		bne	us_cyc
		inc	USEND
		bra	us_cyc
us_eof		lda	USEND		; סוף התבנית
		beq	1F
		lsra
		bne	9F		; נגמרה במפריד: בלי שורה חדשה
us_cr		lda	#13
		lbsr	chrout
9		ldx	USDSC		; משחררים את התבנית
		lbra	fretms
1		tst	USANY		; עוד ערכים: מתחילים שוב, אם במחזור נצרך משהו (אחרת ?FC)
		lbeq	err_fc
us_cyc		clr	USPOS
		clr	USANY
us_scan		ldu	USDSC		; USEPT = סוף התבנית, X = התו הנוכחי (מחדש כל פעם: איסוף מחרוזות)
		ldx	2,u
		ldb	,u
		abx
		stx	USEPT
		ldx	2,u
		ldb	USPOS
		abx
		cmpx	USEPT
		bhs	us_eof
; שדה? (U = המתאר עד us_ok). כן: us_ok, A = הסוג (0 מספר), X אחריו. לא: us_lit, X לא זז
		lda	,x
		ldb	#1		; !: מחרוזת ברוחב 1
		cmpa	#'!
		beq	4F
		cmpa	#'%		; %, רווחים, %: הרוחב = הרווחים ועוד 2
		bne	us_nf
		pshs	x
		incb
2		leax	1,x
		lbsr	us_ch
		cmpa	#'%
		beq	3F
		incb
		cmpa	#$20
		beq	2B
us_no		puls	x		; לא שדה (גם % בלי % סוגר)
us_lit		lda	,x		; תו רגיל
		lbsr	chrout
		inc	USPOS
		bra	us_scan
3		leas	2,s
4		leax	1,x
		stb	USW		; A = ! או %: לא 0 (סוג מחרוזת)
; us_ok: נמצא שדה. אין עוד ערכים: השדה לא מודפס, ושורה חדשה (קורא: גם אחרי מפריד)
us_ok		tst	USEND
		bne	us_cr
		pshs	a		; הסוג (הבית הזה במחסנית בזמן הביטוי, כמו קודם)
		tfr	x,d		; USPOS = X פחות תחילת התבנית
		subd	2,u
		stb	USPOS
		lbsr	frmevl
		puls	a
		inc	USANY
		tsta
		bne	us_str
		lbsr	chknum
		lbsr	us_numw
; us_sep: אחרי ערך: סוף פקודה, ; או ,. אחרת ?SN
us_sep		jsr	<chrgot
		beq	3F		; נגמרה בלי מפריד: 1
		cmpa	#';
		beq	2F
		cmpa	#',
		lbne	err_sn
2		jsr	<chrget
		bne	us_scan		; עוד ערך
		inc	USEND		; נגמרה במפריד: 2
3		inc	USEND
		bra	us_scan

us_str		lbsr	frestr		; A = האורך, X = התווים
		sta	USN
		ldb	USW		; התחלה עד הרוחב, ורווחים מימין
1		tst	USN
		beq	2F
		dec	USN
		lda	,x+
		lbsr	chrout
		decb
		bne	1B
2		tstb			; חסרים 129 ומעלה: לא משלימים (קורא: בדיקת המונה במקור)
		ble	us_sep
		lda	#$20
3		lbsr	chrout
		decb
		bne	3B
		bra	us_sep

; us_nf: שדה מספרי (קורא, סעיף 2): [+] [** / $$ / **$] [# ,]... [. #...] [^^^^] [+ / -]
us_nf		pshs	x
		clr	USFLG
		ldd	#$ff00		; USD = $FF, USL = 0
		std	USD
		bsr	us_ch
		cmpa	#'+		; + מוביל: רק אם אחריו מתחיל שדה
		bne	1F
		lda	#8
		bsr	us_pre1
1		bsr	us_isst
		bne	us_no
		bsr	us_ch
		cmpa	#'*
		bne	2F
		lda	#2		; **
		bsr	us_pre2
		bsr	us_ch
		cmpa	#'$
		bne	3F
		leax	-1,x		; **$: כמו $$ מהכוכבית השנייה, בלי לספור אותה שוב
		dec	USL
2		cmpa	#'$
		bne	3F
		lda	#4		; $$
		bsr	us_pre2
3		bsr	us_ch		; לפני הנקודה: # ופסיקים
		cmpa	#'#
		beq	31F
		cmpa	#',
		bne	5F
31		suba	#'+		; פסיק: 1, #: 0
		anda	#1
		bsr	us_pre1
		bra	3B

; us_ch: A = התו ב-X (0 אחרי הסוף)
us_ch		clra
		cmpx	USEPT
		bhs	1F
		lda	,x
1		rts
; us_isst: Z=1 אם ב-X מתחיל שדה מספרי: #, .#, **, $$
us_isst		bsr	us_ch
		cmpa	#'#
		beq	9F
		ldb	#'#
		cmpa	#'.
		beq	1F
		tfr	a,b
		cmpa	#'*
		beq	1F
		cmpa	#'$
		bne	9F
1		leax	1,x
		bsr	us_ch
		leax	-1,x
		pshs	b
		cmpa	,s+
9		rts
us_pre2		bsr	us_pre1		; תחילית של שני תווים
us_pre1		leax	1,x		; תו אחד בשדה
		inc	USL
us_orf		ora	USFLG
		sta	USFLG
		rts

5		cmpa	#'.
		bne	7F
		clr	USD
6		leax	1,x
		bsr	us_ch
		cmpa	#'#
		bne	7F
		inc	USD
		bra	6B
7		ldb	#4		; ^^^^
		pshs	x
8		bsr	us_ch
		cmpa	#'^
		bne	81F
		leax	1,x
		decb
		bne	8B
		lda	#$40
		bsr	us_orf
		stx	,s
81		puls	x
		lda	USFLG		; סימן נגרר: רק בלי + מוביל
		bita	#8
		bne	us_yes
		bsr	us_ch
		ldb	#$10
		cmpa	#'+
		beq	83F
		aslb
		cmpa	#'-
		bne	us_yes
83		leax	1,x
		tfr	b,a
		bsr	us_orf
us_yes		leas	2,s
		clra			; סוג 0: מספר
		lbra	us_ok

; ---------- השדה המספרי (קורא: docs/DRAGON-SPEC-USING.md, השלמה: ההמרה) ----------
USE		equ	$dd		; המעריך העשרוני e
USSG		equ	$cf	; תו הסימן המוביל / הנגרר
USP		equ	$d0	; כמה ספרות לפני הנקודה (עם סימן)
USN		equ	$d1	; מונה (במחרוזת: האורך. במעריכי: N-9. בשבר: הספרות)
USX		equ	$d2	; המעריך להדפסה
USF		equ	$d4	; תו המילוי (רווח או *)
USBASE		equ	$fc		; 2 בתים: מקום העבודה במחסנית (הכתובת $FC-$FD פנויה גם במקור)
; מקום העבודה: 9 הספרות בהתחלה, והחלק שלפני הנקודה מ-+16 (שלושה תאים לפניו: %, הסימן וה-$).
; במחסנית, כי מאגר השורה מחזיק עכשיו את השורה שרצה (קורא: קלטת 11)
USSZ		equ	48

us_numw		leas	-USSZ,s
		sts	USBASE
		bsr	us_num
		leas	USSZ,s
		rts
us_num		lda	USD		; שדה רחב מ-17 (עם הנקודה): ?FC
		inca
		adda	USL
		cmpa	#17
		lbhi	err_fc
		lda	#$20		; המילוי
		ldb	USFLG
		bitb	#2
		beq	1F
		lda	#'*
1		sta	USF		; הסימן, לפני כל חישוב (קורא): מילוי, + (מוביל או נגרר), - בשלילי
		bitb	#$18
		beq	11F
		lda	#'+
11		tst	FACSGN
		bpl	2F
		lda	#'-
2		sta	USSG
		clr	FACSGN
		bitb	#$40
		bne	us_exp
		ldx	#nzmil	; מיליארד ומעלה: % וההמרה הרגילה (הסימן כבר הוסר)
		lbsr	fcomp
		bmi	3F
		lda	#'%
		lbsr	chrout
		lbsr	fout
		ldx	#FBUFFR
		lbra	puts
3		bsr	us_norm
4		bsr	us_dd		; e+D<0: עוד חלוקה בעשר
		addb	USE
		bpl	5F
		lbsr	div10
		inc	USE
		bra	4B
5		lda	USE		; הנקודה אחרי 9+e ספרות
		adda	#9
		sta	USP
		bra	us_dg

; us_dd: B = D (0 בלי נקודה)
us_dd		ldb	USD
		bpl	1F
		clrb
1		rts
; us_norm: FAC חיובי → בין הגבולות (99999999.90625, 999999999.25], USE = e. אפס: e=0
us_norm		clr	USE
1		lda	FACEXP		; קטן מ-1: כפול מיליארד
		beq	9F
		cmpa	#$80
		bhi	2F
		ldx	#nzmil
		lbsr	fmult
		lda	USE
		suba	#9
		sta	USE
		bra	1B
2		ldx	#nz9999	; מעל העליון: חלקי 10
		lbsr	fcomp
		ble	3F
		lbsr	div10
		inc	USE
		bra	2B
3		ldx	#nz0999	; עד התחתון (כולל): כפול 10
		lbsr	fcomp
		bgt	9F
		lbsr	mul10
		dec	USE
		bra	3B
9		rts

us_exp		bsr	us_norm		; מעריכי (אפס: e=0)
		lda	USL		; LS = L-s (s=1 בסימן מוביל)
		ldb	USFLG
		bitb	#$30
		bne	1F
		deca
1		sta	USP		; הנקודה אחרי LS+max(9-N,0)
		nega			; המעריך: e+9-LS
		adda	USE
		adda	#9
		sta	USX
		bsr	us_dd		; N = LS+D
		addb	USP
		subb	#9
		bge	3F
		stb	USN		; N<9: 9-N חלוקות (e לא משתנה)
2		lbsr	div10
		inc	USP
		inc	USN
		bne	2B
3		lda	FACEXP		; אפס? המעריך 0
		bne	us_dg
		clr	USX
; us_dg: חצי (בחיבור של ה-Dragon), החלק השלם, ותשע ספרות עם אפסים מובילים ב-USDG
us_dg		lbsr	faddh
		lbsr	qint
		ldy	USBASE
		ldx	#foutbl
1		lbsr	fdig
		stb	,y+
		cmpx	#foutbl+36	; תשע החזקות
		blo	1B
; us_out: מהספרות לפלט: החלק השלם (פסיקים), מילוי, סימן ו-$, התאמה לרוחב (%), נקודה, שבר, מעריך, סימן נגרר
us_out		ldy	USBASE
		leay	16,y
		ldb	USP		; i = 0 .. P-1. אין ספרות לפני הנקודה: i = P-1 בלבד ("0")
		decb
		bmi	2F
		clrb
2		cmpb	USP
		bge	3F
		lda	USFLG		; פסיק לפני ספרה כשנשארו כפולה של 3 (לא במעריכי)
		anda	#$41
		deca
		bne	22F
		tstb
		beq	22F
		pshs	b
		lda	USP
		suba	,s+
21		suba	#3
		bhi	21B
		bne	22F
		lda	#',
		sta	,y+
22		bsr	us_digi
		bra	2B
3		clr	,y		; Y = הסוף (0 אחריו)
		ldu	USBASE
		leau	16,u		; אפסים ופסיקים מובילים → מילוי, חוץ מהתו האחרון
		lda	USF
		sta	-1,u
		sta	-2,u
4		tst	1,u
		beq	5F
		ldb	,u
		cmpb	#'0
		beq	41F
		cmpb	#',
		bne	5F
41		sta	,u+
		bra	4B
5		ldx	USBASE
		leax	16,x		; לפני הספרה הראשונה (U): $ צף, ולפניו הסימן. X = ההתחלה
		ldb	USFLG
		bitb	#4
		beq	6F
		lda	#'$
		sta	,-u
		leax	-1,x
6		bitb	#$30
		bne	us_ft		; סימן נגרר: לא כאן
		lda	USSG
		sta	,-u
		leax	-1,x
us_ft		tfr	y,d		; התאמה לרוחב L. B = האורך
		pshs	x
		subd	,s++
		cmpb	USL
		bls	us_fit
		lda	,x		; מסירים מילוי מוביל (רווח או *: רק תו המילוי יכול להופיע)
		cmpa	USF
		bne	8F
		leax	1,x
		bra	us_ft
8		lda	USD		; אפס לפני נקודה וספרת שבר: מסירים, הסימן וה-$ נשארים
		deca
		bmi	us_pct
		lda	-1,y
		cmpa	#'0
		bne	us_pct
		lda	-2,y		; לפניו ספרה: לא (שאר התווים האפשריים קטנים מ-'0')
		cmpa	#'0
		bhs	us_pct
		leay	-1,y
		bra	us_ft
; us_digi: הספרה במקום B לתור ב-Y, ו-B עולה. מחוץ ל-0..8 = '0' (X נשאר)
us_digi		lda	#'0
		cmpb	#9
		bhs	1F
		ldu	USBASE
		lda	b,u
1		sta	,y+
		incb
		rts
us_pct		lda	#'%		; עדיין רחב: % לפני
		sta	,-x
; us_fit: מוסיפים לתור: נקודה ו-D ספרות שבר, מעריך (E, סימן, שתי ספרות), סימן נגרר. ואז הכול למסך
us_fit		ldb	USD
		bmi	3F
		lda	#'.
		sta	,y+
		stb	USN
		ldb	USP
2		dec	USN
		bmi	3F
		bsr	us_digi
		bra	2B
3		lda	USFLG
		bita	#$40
		beq	5F
		lda	#'E
		sta	,y+
		lda	#'+
		ldb	USX
		bpl	4F
		negb
		lda	#'-
4		sta	,y+
		lda	#'0-1
41		inca
		subb	#10
		bcc	41B
		addb	#'0+10
		std	,y++		; עשרות ואחדות
5		lda	USFLG		; סימן נגרר. - נגרר בחיובי: רווח (בכוכביות: כלום, קורא)
		bita	#$30
		beq	6F
		lda	USSG
		cmpa	#'*
		beq	6F
		sta	,y+
6		clr	,y
		lbra	puts
