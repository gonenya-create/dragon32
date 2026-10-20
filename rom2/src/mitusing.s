; Dragon 1982 BASIC — שלב 3, חלק 2: PRINT USING. לפי הקורא: docs/DRAGON-SPEC-USING.md. נכתב מאפס.
; המשתנים באזור העבודה המשותף $CF-$DD, כמו במקור (USSCNT $D3, USDPTR $D5, USFLG $D7...). לא ב-$DE-$E9: שם ההגדרות של PLAY ו-DRAW

USDSC		equ	$d5		; 2 בתים: מתאר התבנית (קוראים ממנו כל פעם: איסוף מחרוזות יכול להזיז אותה)
USPOS		equ	$d3		; המקום בתבנית
USANY		equ	$da		; במחזור הזה נצרך ערך?
USEND		equ	$db		; 0: יש עוד ערכים. 1: הרשימה נגמרה בלי מפריד. 2: עם ; או ,
USL		equ	$d9		; השדה המספרי: המקומות לפני הנקודה (כולל + מוביל, ** $$ **$ ופסיקים)
USD		equ	$d8		; ספרות אחרי הנקודה ($FF: אין נקודה)
USFLG		equ	$d7		; 1 פסיקים, 2 כוכביות, 4 דולר, 8 + מוביל, $10 + נגרר, $20 - נגרר, $40 מעריך
USW		equ	$dc		; רוחב שדה מחרוזת / עזר

; usstart: אחרי PRINT, כש-A = $CD (USING)
usstart		lbsr	chrget
		lbsr	frmevl
		tst	VALTYP
		lbeq	err_tm		; התבנית חייבת להיות מחרוזת
		ldx	FACMO
		stx	USDSC
		lda	#';
		lbsr	synchk
		ldx	USDSC
		tst	,x
		lbeq	err_fc		; תבנית ריקה
		clr	USEND
		lbsr	chrgot		; אין ערכים בכלל?
		bne	us_cyc
		inc	USEND
us_cyc		clr	USPOS
		clr	USANY
us_scan		ldx	USDSC
		ldb	USPOS
		cmpb	,x
		lbhs	us_eof
		ldx	2,x
		abx			; X = התו הנוכחי
		lbsr	us_field	; שדה? C=1: כן (A = סוג: 0 מספר, 1 !, 2 %)
		bcs	us_fld
		clrb			; תו רגיל (us_field לא הזיז את USPOS)
		lbsr	us_peek
		lbsr	putc
		inc	USPOS
		bra	us_scan
us_fld		tst	USEND		; אין עוד ערכים: השדה לא מודפס, ושורה חדשה (קורא: גם אחרי מפריד)
		lbne	us_cr
		pshs	a
		lbsr	frmevl
		puls	a
		inc	USANY
		tsta
		bne	us_str
		tst	VALTYP
		lbne	err_tm
		lbsr	us_num
		bra	us_sep
us_str		tst	VALTYP
		lbeq	err_tm
		pshs	a
		lbsr	frestr		; A = האורך, X = התווים
		puls	b
		cmpb	#1
		bne	2F
		tsta			; !: התו הראשון, או רווח
		beq	1F
		lda	,x
		lbsr	putc
		bra	us_sep
1		lda	#$20
		lbsr	putc
		bra	us_sep
2		ldb	USW		; %..%: התחלה עד הרוחב, ורווחים מימין
		pshs	b
3		tst	,s
		beq	5F
		tsta
		beq	4F
		pshs	a
		lda	,x+
		lbsr	putc
		puls	a
		deca
		dec	,s
		bra	3B
4		ldb	,s		; חסרים 129 ומעלה: לא משלימים (קורא: בדיקת המונה במקור)
		bmi	5F
41		lda	#$20
		lbsr	putc
		dec	,s
		bne	41B
5		leas	1,s
; us_sep: אחרי ערך: סוף פקודה, ; או ,. אחרת ?SN
us_sep		lbsr	chrgot
		bne	1F
		lda	#1		; נגמרה בלי מפריד
		sta	USEND
		lbra	us_scan
1		cmpa	#';
		beq	2F
		cmpa	#',
		lbne	err_sn
2		lbsr	chrget
		lbne	us_scan		; עוד ערך
		lda	#2
		sta	USEND
		lbra	us_scan
us_eof		lda	USEND		; סוף התבנית
		beq	1F
		cmpa	#2
		beq	9F		; נגמרה במפריד: בלי שורה חדשה
us_cr		lda	#13
		lbsr	putc
9		ldx	USDSC		; משחררים את התבנית
		lbsr	fretms
		rts
1		tst	USANY		; עוד ערכים: מתחילים שוב, אם במחזור נצרך משהו (אחרת ?FC)
		lbeq	err_fc
		lbra	us_cyc

; us_field: X = התו בתבנית. שדה? C=1, A = הסוג, USPOS מתקדם אחריו. אחרת C=0
us_field	lda	,x
		cmpa	#'!
		bne	1F
		inc	USPOS
		lda	#1
		orcc	#1
		rts
1		cmpa	#'%
		bne	us_nf
		ldb	USPOS		; %, רווחים, %
		pshs	b
		ldy	USDSC
		ldb	#2
2		inc	USPOS
		pshs	b
		ldb	USPOS
		cmpb	,y
		puls	b
		bhs	3F		; אין % סוגר: % רגיל
		lda	1,x
		leax	1,x
		cmpa	#$20
		bne	4F
		incb
		bra	2B
4		cmpa	#'%
		bne	3F
		inc	USPOS
		stb	USW
		leas	1,s
		lda	#2
		orcc	#1
		rts
3		puls	b		; לא שדה: חוזרים
		stb	USPOS
		andcc	#$fe
		rts

; us_peek: A = התו ב-USPOS+B (0 אחרי הסוף)
us_peek		pshs	b,x
		addb	USPOS
		ldx	USDSC
		cmpb	,x
		bhs	1F
		ldx	2,x
		abx
		lda	,x
		puls	b,x,pc
1		clra
		puls	b,x,pc
; us_isst: A = התו ב-USPOS+B. C=1 אם מכאן מתחיל שדה מספרי: #, .#, **, $$
us_isst		bsr	us_peek
		cmpa	#'#
		beq	8F
		cmpa	#'.
		beq	2F
		cmpa	#'*
		beq	3F
		cmpa	#'$
		bne	9F
3		pshs	a
		incb
		bsr	us_peek
		decb
		cmpa	,s+
		beq	8F
		bra	9F
2		incb
		bsr	us_peek
		decb
		cmpa	#'#
		beq	8F
9		andcc	#$fe
		rts
8		orcc	#1
		rts
us_adv		inc	USPOS
		inc	USL
		rts
; us_nf: שדה מספרי (קורא, סעיף 2): [+] [** / $$ / **$] [# ,]... [. #...] [^^^^] [+ / -]
us_nf		ldb	USPOS
		pshs	b
		clr	USL
		clr	USFLG
		lda	#$ff
		sta	USD
		clrb
		bsr	us_peek
		cmpa	#'+
		bne	1F
		incb			; + מוביל: רק אם אחריו מתחיל שדה
		bsr	us_isst
		lbcc	us_no
		lda	#8
		sta	USFLG
		bsr	us_adv
		clrb
1		bsr	us_isst
		lbcc	us_no
		bsr	us_peek
		cmpa	#'*
		bne	2F
		bsr	us_adv		; **
		bsr	us_adv
		lda	USFLG
		ora	#2
		sta	USFLG
		clrb
		bsr	us_peek
		cmpa	#'$
		bne	3F
		bsr	us_adv		; **$
		bra	21F
2		cmpa	#'$
		bne	3F
		bsr	us_adv		; $$
		bsr	us_adv
21		lda	USFLG
		ora	#4
		sta	USFLG
3		clrb			; לפני הנקודה: # ופסיקים
		lbsr	us_peek
		cmpa	#'#
		bne	4F
		bsr	us_adv
		bra	3B
4		cmpa	#',
		bne	5F
		bsr	us_adv
		lda	USFLG
		ora	#1
		sta	USFLG
		bra	3B
5		cmpa	#'.
		bne	7F
		inc	USPOS
		clr	USD
6		clrb
		lbsr	us_peek
		cmpa	#'#
		bne	7F
		inc	USPOS
		inc	USD
		bra	6B
7		ldb	#3		; ^^^^
8		lbsr	us_peek
		cmpa	#'^
		bne	81F
		decb
		bpl	8B
		lda	USPOS
		adda	#4
		sta	USPOS
		lda	USFLG
		ora	#$40
		sta	USFLG
81		lda	USFLG		; סימן נגרר: רק בלי + מוביל
		bita	#8
		bne	us_yes
		clrb
		lbsr	us_peek
		cmpa	#'+
		bne	82F
		lda	#$10
		bra	83F
82		cmpa	#'-
		bne	us_yes
		lda	#$20
83		ora	USFLG
		sta	USFLG
		inc	USPOS
us_yes		leas	1,s
		clra			; סוג 0: מספר
		orcc	#1
		rts
us_no		puls	b
		stb	USPOS
		andcc	#$fe
		rts

; ---------- השדה המספרי (קורא: docs/DRAGON-SPEC-USING.md, השלמה: ההמרה) ----------
USE		equ	$dd		; המעריך העשרוני e
USSG		equ	$cf	; תו הסימן המוביל / הנגרר
USP		equ	$d0	; כמה ספרות לפני הנקודה (עם סימן)
USN		equ	$d1	; N במעריכי
USX		equ	$d2	; המעריך להדפסה
USF		equ	$d4	; תו המילוי (רווח או *)
USDG		equ	LINBUF		; תשע הספרות
UST		equ	LINBUF+16	; החלק השלם (עם פסיקים)
USO		equ	LINBUF+64	; הפלט שלפני הנקודה

us_num		ldb	USL		; שדה רחב מ-17 (עם הנקודה): ?FC
		lda	USD
		inca
		pshs	a
		addb	,s+
		cmpb	#17
		lbhi	err_fc
		lda	#$20		; המילוי
		ldb	USFLG
		bitb	#2
		beq	1F
		lda	#'*
1		sta	USF
		lda	#'-		; הסימן, לפני כל חישוב (קורא)
		tst	FACSGN
		bmi	2F
		lda	#'+
		bitb	#$18
		bne	2F
		lda	USF
2		sta	USSG
		clr	FACSGN
		bitb	#$40
		bne	us_exp
		leax	nzmil,pcr	; מיליארד ומעלה: % וההמרה הרגילה (הסימן כבר הוסר)
		lbsr	fcomp
		cmpa	#$ff
		beq	3F
		lda	#'%
		lbsr	putc
		lbsr	fout
		ldx	#FBUFFR
		lbra	puts
3		lbsr	us_norm
		bsr	us_dd		; B = D
		lda	USE		; e<0: עוד max(0,-D-e) חלוקות בעשר, אחת-אחת
		bpl	5F
		nega
		pshs	b
		suba	,s+
		ble	5F
4		pshs	a
		lbsr	div10
		inc	USE
		puls	a
		deca
		bne	4B
5		lbsr	us_dig
		lda	USE		; הנקודה אחרי 9+e ספרות
		adda	#9
		sta	USP
		lbra	us_out

us_exp		bsr	us_norm		; מעריכי (אפס: e=0)
		bsr	us_dd
		pshs	b
		lda	USL
		adda	,s+		; N = L+D-s (s=1 בסימן מוביל)
		ldb	USFLG
		bitb	#$30
		bne	1F
		deca
1		sta	USN
		suba	#9
		bge	3F
		nega			; N<9: 9-N חלוקות (e לא משתנה)
2		pshs	a
		lbsr	div10
		puls	a
		deca
		bne	2B
3		lda	FACEXP		; אפס? המעריך 0
		pshs	a
		bsr	us_dig
		lda	USL		; הנקודה אחרי L-s+max(9-N,0)
		ldb	USFLG
		bitb	#$30
		bne	4F
		deca
4		ldb	#9
		subb	USN
		bmi	5F
		pshs	b
		adda	,s+
5		sta	USP
		lda	USE		; המעריך: e+9-L+s
		adda	#9
		suba	USL
		ldb	USFLG
		bitb	#$30
		bne	6F
		inca
6		tst	,s+
		bne	7F
		clra
7		sta	USX
		lbra	us_out

; us_dd: B = D (0 בלי נקודה)
us_dd		ldb	USD
		cmpb	#$ff
		bne	1F
		clrb
1		rts
; us_norm: FAC חיובי → בין הגבולות (99999999.90625, 999999999.25], USE = e. אפס: e=0
us_norm		clr	USE
		lda	FACEXP
		beq	9F
1		lda	FACEXP		; קטן מ-1: כפול מיליארד
		cmpa	#$80
		bhi	2F
		leax	nzmil,pcr
		lbsr	fmult
		lda	USE
		suba	#9
		sta	USE
		bra	1B
2		leax	nz9999,pcr	; מעל העליון: חלקי 10
		lbsr	fcomp
		cmpa	#1
		bne	3F
		lbsr	div10
		inc	USE
		bra	2B
3		leax	nz0999,pcr	; עד התחתון (כולל): כפול 10
		lbsr	fcomp
		cmpa	#1
		beq	9F
		lbsr	mul10
		dec	USE
		bra	3B
9		rts
; us_dig: חצי (בחיבור של ה-Dragon), החלק השלם, ותשע ספרות עם אפסים מובילים ב-USDG
us_dig		lbsr	faddh
		lbsr	qint
		ldy	#USDG
		leax	foutbl,pcr
1		clrb
2		lda	FACLO
		suba	3,x
		pshs	a
		lda	FACMO
		sbca	2,x
		pshs	a
		lda	FACMOH
		sbca	1,x
		pshs	a
		lda	FACHO
		sbca	,x
		bcs	3F
		sta	FACHO
		puls	a
		sta	FACMOH
		puls	a
		sta	FACMO
		puls	a
		sta	FACLO
		incb
		bra	2B
3		leas	3,s
		addb	#'0
		stb	,y+
		leax	4,x
		cmpy	#USDG+9
		blo	1B
		rts
; us_digi: A = הספרה במקום B (עם סימן): מחוץ ל-0..8 = '0'
us_digi		lda	#'0
		tstb
		bmi	1F
		cmpb	#9
		bhs	1F
		pshs	x
		ldx	#USDG
		lda	b,x
		puls	x
1		rts
; us_out: מהספרות לפלט: החלק השלם (פסיקים), מילוי, סימן ו-$, התאמה לרוחב (%), נקודה, שבר, מעריך, סימן נגרר
us_out		ldy	#UST
		ldb	USP
		bgt	1F
		lda	#'0		; אין ספרות לפני הנקודה: "0"
		sta	,y+
		bra	3F
1		clrb			; i = 0 .. P-1
2		cmpb	USP
		bge	3F
		lda	USFLG		; פסיק לפני ספרה כשנשארו כפולה של 3 (לא במעריכי)
		anda	#$41
		cmpa	#1
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
		sta	,y+
		incb
		bra	2B
3		pshs	y		; ,s = הסוף
		ldx	#UST		; אפסים ופסיקים מובילים → מילוי; אם הכול: האחרון חוזר ל-0
4		cmpx	,s
		bhs	5F
		lda	,x
		cmpa	#'0
		beq	41F
		cmpa	#',
		bne	6F
41		lda	USF
		sta	,x+
		bra	4B
5		lda	#'0
		sta	,-x
6		pshs	x		; ,s = הספרה הראשונה, 2,s = הסוף
		ldy	#USO
		ldu	#UST
7		cmpu	,s		; המילוי
		bhs	8F
		lda	,u+
		sta	,y+
		bra	7B
8		lda	USFLG
		bita	#$30
		bne	9F		; סימן נגרר: לא כאן
		lda	USSG
		sta	,y+
9		lda	USFLG		; $ צף
		bita	#4
		beq	10F
		lda	#'$
		sta	,y+
10		cmpu	2,s
		bhs	11F
		lda	,u+
		sta	,y+
		bra	10B
11		leas	4,s
		ldx	#USO		; התאמה לרוחב L
12		lbsr	us_cnt
		bls	us_fit
		lda	,x		; מסירים מילוי מוביל
		cmpa	#$20
		beq	13F
		cmpa	#'*
		bne	14F
13		leax	1,x
		bra	12B
14		ldb	USD		; אפס לפני נקודה וספרת שבר: מסירים, הסימן וה-$ נשארים
		incb
		beq	us_pct
		decb
		beq	us_pct
		lda	-1,y
		cmpa	#'0
		bne	us_pct
		leau	-1,y
		pshs	x
		cmpu	,s
		beq	16F
		lda	-1,u
		cmpa	#'0
		blo	15F
		cmpa	#'9
		bls	17F
15		lda	-1,u
		sta	,u
		leau	-1,u
		cmpu	,s
		bhi	15B
16		puls	x
		leax	1,x
		lbsr	us_cnt
		bls	us_fit
		bra	us_pct
17		puls	x
us_pct		lda	#'%		; עדיין רחב: % לפני
		lbsr	putc
us_fit		lda	,x+		; מה שלפני הנקודה
		lbsr	putc
		pshs	x
		cmpy	,s++
		bhi	us_fit
		ldb	USD		; נקודה ו-D ספרות שבר
		cmpb	#$ff
		beq	2F
		lda	#'.
		lbsr	putc
		pshs	b
		ldb	USP
1		tst	,s
		beq	11F
		lbsr	us_digi
		lbsr	putc
		incb
		dec	,s
		bra	1B
11		leas	1,s
2		lda	USFLG		; מעריך: E, סימן, שתי ספרות
		bita	#$40
		beq	4F
		lda	#'E
		lbsr	putc
		ldb	#'+
		lda	USX
		bpl	3F
		nega
		ldb	#'-
3		pshs	a
		tfr	b,a
		lbsr	putc
		puls	a
		ldb	#'0-1
31		incb
		suba	#10
		bcc	31B
		adda	#'0+10
		pshs	a
		tfr	b,a
		lbsr	putc
		puls	a
		lbsr	putc
4		lda	USFLG		; סימן נגרר
		bita	#$30
		beq	9F
		ldb	USSG
		cmpb	#'-
		beq	8F
		bita	#$10
		bne	6F
		lda	USFLG		; - נגרר בחיובי: רווח (בכוכביות: כלום, קורא)
		bita	#2
		bne	9F
		lda	#$20
		bra	8F
6		ldb	#'+
8		tfr	b,a
		cmpa	#$20
		beq	81F
		bra	putc
81		bra	putc
9		rts
; us_cnt: Y-X מול L (C/Z לפי cmp: bls = נכנס)
us_cnt		pshs	x
		tfr	y,d
		subd	,s++
		tsta
		bne	1F
		cmpb	USL
		rts
1		lda	#1		; יותר מ-255: לא נכנס
		cmpa	#0
		rts
