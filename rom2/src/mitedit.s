; Dragon 1982 BASIC — שלב 3, חלק 2: כלי עריכה. TRON/TROFF, DEL, LINE INPUT, RENUM.
; הכול לפי הקורא: docs/DRAGON-SPEC-EDIT.md. נכתב מאפס.

TRCFLG		equ	$af		; קורא: דגל העקיבה ($4F = פועל)
RNSTEP		equ	$cf		; קורא: RENUM — הצעד
RNOLD		equ	$d1		; הסף (השורה הישנה הראשונה שממוספרת)
RNPTR		equ	$d3		; DEL / RENUM: מצביע לשורה
RNNEW		equ	$d5		; המספר החדש הראשון

; ---------- TRON / TROFF ----------
tron		lda	#$4f
		sta	TRCFLG
		rts
troff		clr	TRCFLG
		rts
; trace: בכניסה לשורה בתוכנית: [n] בלי רווחים (קורא)
trace		tst	TRCFLG
		beq	9F
		pshs	d
		lda	#'[
		lbsr	putc
		ldd	CURLIN
		lbsr	prnum
		lda	#']
		lbsr	putc
		puls	d
9		rts

; ---------- LINE INPUT ["הנחיה";] משתנה$ ----------
; בלי "?" ובלי רווח. במצב ישיר: ?ID. כל השורה נשמרת (פסיקים, מירכאות, רווחים). משתנה מספרי: ?TM אחרי הקלט
line_st		cmpa	#$89		; INPUT
		lbne	gline_st	; LINE של הגרפיקה
		jsr	<chrget
		lbsr	errdir		; ?ID, וההנחיה
		clr	IKEYIM
		lbsr	devgetln	; מקלדת או קלטת (קורא: קלטת 3.11)
		lbcs	inbrk		; BREAK (C=1): עצירה, ו-CONT חוזר לפקודה (קורא)
		clrb
		lbsr	ptrget
		tst	VALTYP
		lbeq	err_tm
		ldd	VARPNT
		std	FORPNT
		clr	CHARAC		; רק 0 מסיים
		clr	ENDCHR
		ldx	#LINBUF
		lbsr	strlt2
		lbsr	letasg
		clr	DEVNUM
		rts

; ---------- DEL ----------
; DEL n, n-m, -m, n-, -. בלי כלום: ?FC. שורות שלא קיימות: בלי שגיאה (קורא)
del_st		lbeq	err_fc
		ldx	TXTPTR
		lbsr	lrange
		pshs	d
		bsr	isend		; אחרי הטווח: רק סוף פקודה
		bne	rn_sn
		puls	d
		lbsr	fndlin		; U = השורה הראשונה במחיקה
		tfr	y,u
		ldd	LEND		; X = הראשונה שלא נמחקת: מחפשים מ-U את LEND, ואם יש — זו שאחריה
		lbsr	fndlnc
		bcc	1F
		ldy	,y
1		tfr	y,x
		lbsr	rn_down		; מזיזים את [X..VARTAB) ל-U
; ---------- סיום של DEL / RENUM / EDIT: משתנים מתאפסים, מחסנית חדשה, ו-OK ----------
edfin		lbsr	lnkprg
		lbsr	runc
edok		lds	STKTOP
		clr	,-s
		lbra	main_ok
; isend: Z=1 בסוף פקודה (0 או נקודתיים), A = התו
isend		lbsr	skipsp
		beq	9F
		cmpa	#':
9		rts
; rn_num: מספר שורה (חייבת להיות ספרה, אחרת ?SN)
rn_num		lbsr	skipsp
		suba	#'0
		cmpa	#9
		bhi	rn_sn
		lbra	linget
rn_sn		lbra	err_sn

; ---------- RENUM [חדש][,[סף][,צעד]] ----------
; ברירות מחדל 10, 0, 10 (קורא). הסדר: ניקוי משתנים, פרמטרים, בדיקות (?FC), הפניות, מספרי השורות, OK.
; הפניות: אחרי GOTO/GO TO, GOSUB/GO SUB, THEN, ELSE, ורשימות עם פסיקים. בכל התוכנית.
; הפניה לשורה שאין: נשארת, ומודפס "UL x IN y" (y = המספר החדש של השורה המפנה)
renum		lbsr	runc
		ldd	#10
		std	RNNEW
		std	RNSTEP
		clr	RNOLD
		clr	RNOLD+1
		ldx	TXTPTR
		ldy	#RNNEW		; קודם החדש, ואחריו הסף (Y: גם לא 0 בשביל rn_map)
1		bsr	isend
		beq	rn_go
		cmpa	#',
		beq	2F
		bsr	rn_num
		std	,y
		bsr	isend
		beq	rn_go
		cmpa	#',
		bne	rn_sn
2		leax	1,x
		leay	-4,y
		cmpy	#RNOLD
		beq	1B
		bsr	rn_num		; אחרי שני פסיקים: הצעד חובה
		std	RNSTEP
		bsr	isend
		bne	rn_sn
rn_go		ldd	#$ffff		; הבדיקות: מעבר על כל השורות (אין שורה $FFFF), בלי לשנות
		lbsr	rn_map
		ldx	TXTTAB		; ההפניות. הולכים לפי ה-0 שבסוף כל שורה (הקישורים מתיישנים כשהטקסט זז)
rl_line		ldd	,x
		beq	rl_hdr
		stx	RNPTR
		leax	4,x
rl_scan		lbsr	tkget		; בלי מרכאות ובלי הבית שאחרי $FF
		beq	rl_line
		cmpa	#$bf		; THEN
		beq	rl_ref
		cmpa	#$84		; ELSE
		beq	rl_ref
		cmpa	#$81		; GO, ואחריו TO או SUB (אולי עם רווחים)
		bne	rl_scan
		lbsr	skipsp
		suba	#$bc
		cmpa	#1
		bhi	rl_scan
		leax	1,x
rl_ref		lbsr	skipsp
		suba	#'0
		cmpa	#9
		bhi	rl_scan
		pshs	x		; P = הספרה הראשונה
		ldu	#0		; הערך (מודולו 65536)
5		lda	,x+
		cmpa	#$20		; רווח בתוך המספר: נעלם (קורא)
		beq	5B
		suba	#'0
		cmpa	#9
		bhi	7F
		tfr	x,y		; Q = אחרי הספרה האחרונה
		pshs	a
		tfr	u,d		; U = U*10 + הספרה
		lslb
		rola
		lslb
		rola
		leau	d,u
		tfr	u,d
		leau	d,u
		puls	a
		leau	a,u
		bra	5B
7		tfr	u,d		; הערך הישן → החדש (Y = Q, לא 0)
		bsr	rn_mapu
		tfr	y,x		; X = Q
		lbsr	numtxt		; הספרות ב-FBUFFR, D = B = כמה
		pshs	b
		addd	1,s		; כמה + P
		pshs	x
		subd	,s++		; ההפרש: כמה - (Q-P)
		bsr	rn_shift
		puls	b,x		; כמה, ו-X = P
		ldu	#FBUFFR
9		lda	,u+
		sta	,x+
		decb
		bne	9B
		lbsr	skipsp
		cmpa	#',
		bne	rl_scan
		leax	1,x
		bra	rl_ref
; rl_hdr: מספרי השורות עצמן (D = 0)
rl_hdr		tfr	d,y		; Y = 0: rn_map כותב את המספרים החדשים
		coma
		comb
		bsr	rn_map
		lbra	edfin
; rn_mapu: כמו rn_map; שורה שאין: מודפס "UL x IN y"
rn_mapu		bsr	rn_map
		bcs	9F
		pshs	d
		ldx	#m_ul
		lbsr	puts		; puts משנה את A
		ldd	,s
		lbsr	prnum
		ldx	#m_in
		lbsr	puts
		ldx	RNPTR
		ldd	2,x
		bsr	rn_map
		lbsr	prnum
		lbsr	ed_cr
		puls	d
9		rts
m_ul		fcc	"UL "
		fcb	0
; rn_shift: מזיזים את [X..VARTAB) ב-D בתים (עם סימן; הדגלים לפי D). למעלה: ?OM אם אין מקום
rn_shift	pshs	d,x
		beq	9F
		leau	d,x
		bmi	5F
		addd	VARTAB
		tfr	d,u
		lbsr	reason
		ldx	VARTAB
		stu	VARTAB
1		cmpx	2,s
		bls	9F
		lda	,-x
		sta	,-u
		bra	1B
5		bsr	rn_down
9		puls	d,x,pc
; rn_down: מזיזים את [X..VARTAB) ל-U (למטה), ו-VARTAB = הסוף החדש
rn_down		cmpx	VARTAB
		bhs	3F
		lda	,x+
		sta	,u+
		bra	rn_down
3		stu	VARTAB
		rts
; rn_map: D = מספר ישן → D = החדש, C=1 אם השורה קיימת (אחרת D לא משתנה). משנה את X ו-U.
; בדרך גם הבדיקות (?FC): שורה מתחת לסף חייבת להיות מתחת לחדש הראשון, ומספר חדש עד 63999.
; Y = 0: גם כותבים את המספרים החדשים בשורות
rn_map		pshs	d
		ldd	RNSTEP		; צעד 0: ?FC (נבדק כבר בקריאה הראשונה)
		beq	rn_fc
		ldx	TXTTAB
		ldu	RNNEW		; המספר החדש הבא (מעל 63999 אחרי גלישה)
1		ldd	,x
		beq	8F
		ldd	2,x
		cmpd	RNOLD
		blo	3F
		cmpd	,s		; ממוספרת מחדש: החדש
		beq	5F
		cmpu	#63999
		bhi	rn_fc
		leay	,y
		bne	2F
		stu	2,x
2		tfr	u,d
		addd	RNSTEP
		bcc	21F
		ora	#$fa		; גלישה: מעל 63999
21		tfr	d,u
		bra	4F
3		cmpd	,s		; מתחת לסף: נשאר
		beq	6F
		cmpd	RNNEW
		bhs	rn_fc
4		leax	4,x
41		tst	,x+
		bne	41B
		bra	1B
5		tfr	u,d
6		std	,s
		coma			; C=1
		puls	d,pc
8		clra			; C=0
		puls	d,pc
rn_fc		lbra	err_fc

; ---------- EDIT n (קורא: docs/DRAGON-SPEC-EDIT.md, סעיף 1) ----------
EDLEN		equ	$d7		; קורא: האורך
EDFLG		equ	$d8		; 1: הפלט של LIST הולך למאגר
EDPTR		equ	$d9		; 2 בתים: לאן כותבים במאגר
EDPOS		equ	$db		; המקום בשורה
EDCNT		equ	$dc		; המונה שלפני פקודה
EDCH		equ	$dd		; התו של S / K
EDNUM		equ	$d1		; 2 בתים: מספר השורה (לא $DE: שם OCTAVE של PLAY)

; lout: התו של LIST למסך, או למאגר (עד 249 תווים)
lout		tst	EDFLG
		lbeq	chrout
		pshs	b,x
		ldb	EDLEN
		cmpb	#249
		bhs	1F
		ldx	EDPTR
		sta	,x+
		stx	EDPTR
		inc	EDLEN
1		puls	b,x,pc

; בלי מספר: שורה 0. אחרי המספר רק סוף פקודה (?SN). אין שורה: ?UL. גם בתוך תוכנית (יוצאים ממנה)
edit_st		ldx	TXTPTR
		lbsr	linget
		std	EDNUM
		lbsr	isend
		lbne	err_sn
ed_load		ldd	EDNUM
		lbsr	fndlin
		lbcc	err_ul
		ldx	#LINBUF		; פותחים את השורה לטקסט, במאגר
		stx	EDPTR
		clr	EDLEN
		inc	EDFLG
		leax	4,y
		lbsr	prline
		clr	EDFLG
		bsr	ed_num		; "n " והשורה כולה, ושורה חדשה
		clr	EDPOS
		lbsr	ed_rest
		lda	#13
		lbsr	putc
ed_head		bsr	ed_num		; שוב "n ", והעריכה מתחילה בתו הראשון
		clr	EDPOS
ed_cmd		clr	EDCNT
ed_key		bsr	ed_get
		suba	#'0		; ספרות: המונה (מודולו 256, בלי הד)
		cmpa	#9
		bhi	1F
		pshs	a
		lda	EDCNT
		ldb	#10
		mul
		addb	,s+
		stb	EDCNT
		bra	ed_key
1		adda	#'0		; הפקודה
		leax	ed_keys,pcr
		clrb
2		tst	,x
		beq	ed_cmd		; לא מוכרת: כלום
		cmpa	,x+
		beq	3F
		incb
		bra	2B
3		leax	ed_offs,pcr
		ldb	b,x
		leax	ed_sp,pcr
		abx
		jsr	,x
		bra	ed_cmd
ed_keys		fcc	" DIXHLAE"
		fcb	13
		fcc	"SKC"
		fcb	8
		fcc	"Q"
		fcb	0
ed_offs		fcb	ed_sp-ed_sp,ed_d-ed_sp,ed_ins-ed_sp,ed_x-ed_sp,ed_h-ed_sp,ed_l-ed_sp,ed_a-ed_sp,ed_e-ed_sp
		fcb	ed_ent-ed_sp,ed_s-ed_sp,ed_k-ed_sp,ed_c-ed_sp,ed_bs-ed_sp,ed_q-ed_sp

ed_num		ldd	EDNUM
		lbsr	prnum
		lda	#$20
		lbra	putc
; ed_get: מקש לעורך. BREAK לא נחשב; SHIFT+↑ ($5F) = בריחה ($1B). רק $20-$7E, ENTER, בריחה, ←
ed_get		lbsr	getkey
		cmpa	#$5f
		bne	1F
		lda	#$1b
		rts
1		cmpa	#13
		beq	9F
		cmpa	#8
		beq	9F
		cmpa	#$20
		blo	ed_get
		cmpa	#$7e
		bhi	ed_get
9		rts
; ed_px: X = התו שבמקום, B = המקום; "bhs" = בסוף
ed_px		ldx	#LINBUF
		ldb	EDPOS
		abx
		cmpb	EDLEN
		rts
ed_end		orcc	#1
		rts
; ed_adv: מדפיסים את התו שבמקום ומתקדמים. C=1 אם כבר בסוף
ed_adv		bsr	ed_px
		bhs	ed_end
		lda	,x
		lbsr	putc
		inc	EDPOS
		andcc	#$fe
		rts
; ed_del: מוחקים את התו שבמקום (בלי הדפסה). C=1 אם בסוף
ed_del		bsr	ed_px
		bhs	ed_end
1		lda	1,x
		sta	,x+
		incb
		cmpb	EDLEN
		blo	1B
		dec	EDLEN
		andcc	#$fe
		rts
ed_rest		bsr	ed_adv
		bcc	ed_rest
		rts
; ed_loop: השגרה ב-U, n פעמים (המונה; 0 = 1). C=1 מהשגרה: עוצרים
ed_loop		ldb	EDCNT
		bne	1F
		incb
1		pshs	b,u
		jsr	,u
		puls	b,u
		bcs	9F
		decb
		bne	1B
9		rts
; ed_bk: תא אחד אחורה, בלי למחוק מהמאגר (במסך התא נמחק). C=1 בהתחלה
ed_bk		lda	EDPOS
		beq	ed_end
		dec	EDPOS
		lda	#8
		lbsr	putc
		andcc	#$fe
		rts
; ed_sk1: S/K: פעולה אחת (Y: הדפסה או מחיקה), ועוד עד לפני התו EDCH. C=1 בסוף
ed_sk1		jsr	,y
		bcs	9F
1		bsr	ed_px
		bhs	ed_end
		lda	,x
		cmpa	EDCH
		beq	9F
		jsr	,y
		bra	1B
9		rts
; ed_c1: C: תו חדש במקום הקיים (ENTER, בריחה ו-← לא נחשבים); לא מאריך
ed_c1		bsr	ed_px
		bhs	ed_end
1		lbsr	ed_get
		cmpa	#$20
		blo	1B
		sta	,x
		bra	ed_adv

ed_sp		leau	ed_adv,pcr	; רווח: n תווים קדימה, מודפסים
		bra	ed_loop
ed_d		leau	ed_del,pcr	; D: מוחקים n תווים
		bra	ed_loop
ed_bs		leau	ed_bk,pcr	; ←: n אחורה
		bra	ed_loop
ed_c		leau	ed_c1,pcr	; C: n תווים חדשים
		bra	ed_loop
ed_s		leay	ed_adv,pcr	; S c: עד לפני המופע ה-n של c אחרי המקום
		bra	1F
ed_k		leay	ed_del,pcr	; K c: מוחקים עד לפני המופע ה-n של c (אין: עד הסוף)
1		lbsr	ed_get
		sta	EDCH
		leau	ed_sk1,pcr
		bra	ed_loop
ed_x		bsr	ed_rest		; X: לסוף, והוספה
		bra	ed_ins
ed_h		lda	EDPOS		; H: מוחקים עד הסוף, והוספה
		sta	EDLEN
; ed_ins: הוספה. ENTER: היתר, שורה חדשה, שמירה. בריחה: חזרה לפקודות. ←: מוחקים את התו שלפני
ed_ins		lbsr	ed_get
		cmpa	#13
		beq	ed_ent
		cmpa	#$1b
		beq	9F
		cmpa	#8
		bne	2F
		bsr	ed_bk
		bcs	ed_ins
		lbsr	ed_del
		bra	ed_ins
2		ldb	EDLEN		; עד 250 תווים (קורא)
		cmpb	#250
		bhs	ed_ins
		ldx	#LINBUF		; מזיזים ימינה, מהסוף עד המקום
		abx
		pshs	a
3		cmpb	EDPOS
		bls	4F
		lda	,-x
		sta	1,x
		decb
		bra	3B
4		puls	a
		sta	,x
		inc	EDLEN
		inc	EDPOS
		lbsr	putc
		bra	ed_ins
9		rts
ed_l		lbsr	ed_rest		; L: היתר, שורה חדשה, "n " ומההתחלה (השינויים נשמרים)
		bsr	ed_cr
		leas	2,s
		lbra	ed_head
ed_a		bsr	ed_cr		; A: מבטלים את השינויים וטוענים מחדש
		leas	2,s
		lbra	ed_load
ed_ent		lbsr	ed_rest		; ENTER: היתר, שורה חדשה, שמירה
ed_e		bsr	ed_cr		; E: שמירה בלי להדפיס את היתר
		ldb	EDLEN		; שומרים כמו שורה שהוקלדה: מכווצים, מחליפים, משתנים מתאפסים
		ldx	#LINBUF
		abx
		clr	,x
		ldx	#LINBUF
		ldd	EDNUM
		std	LINNUM
		lbsr	storel2
		lds	STKTOP
		clr	,-s
		lbra	main		; בלי OK (קורא)
ed_q		lbra	edok		; Q: יציאה בלי שמירה
ed_cr		lda	#13
		lbra	putc
