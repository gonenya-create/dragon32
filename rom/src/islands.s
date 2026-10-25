; שלטי ההפניה בכתובות הקבועות של המקור.
; בגוש עם כמה כניסות: רק jsr/jmp לכתובות רחוקות, כדי שהגודל לא ישתנה (shorten.py ו-fixbr.py לא נוגעים בקובץ הזה) (גונן, 22.10: "מאשר").
; הקובץ הזה לא נכלל ב-exp.s: הכלי tools/islands.py מכניס כל גוש לקוד, בדיוק בכתובת שלו.
; המקור לכתובות ולחוזים: docs/DRAGON-SPEC-ENTRIES.md (הקורא) ו-docs/DRAGON-RESEARCH-ERA.md (הספרים).
; כתובות צמודות (פחות מ-3 בתים) הן גוש אחד: הראשונה פקודה קצרה ש"נופלת" לבאה.

; @island $8342
; ?OM (קוד 12), ונופל לשגיאה הכללית. $8344: שגיאה עם הקוד ב-B
		ldb	#12
		jmp	error

; @island $89A4
; בדיקת תו: $89A4 ')'  $89A7 '('  $89AA ','  $89AC התו שב-B. אחרת ?SN. ‏$89B4: ‏?SN
		ldb	#')
		fcb	$8c
		ldb	#'(
		fcb	$8c
		ldb	#',
		tfr	b,a
		jmp	synchk
		fill	$ff,$89b4-*
		jmp	err_sn

; @island $8B2D
; FAC → מספר שלם עם סימן ב-D (קטיעה לכיוון אפס), ?TM למחרוזת, ?FC מחוץ לטווח
		bsr	chknum
		lda	FACSGN
		pshs	a
		clr	FACSGN
		lda	FACEXP
		cmpa	#144
		blo	isl_8b2d_1
		lda	,s
		sta	FACSGN
		leax	n32768,pcr
		bsr	fcomp
		bne	err_fc
		clr	FACSGN
isl_8b2d_1	bsr	qint
		ldd	FACMO
		tst	,s+
		bpl	isl_8b2d_2
		coma
		comb
		addd	#1
isl_8b2d_2	std	FACMO
		tstb
		rts

; @island $8B8A
; ‏$8B8A: ‏?BS.  $8B8D: ‏?FC
		jmp	err_bs
		jmp	err_fc

; @island $8C36
; ‏$8C36: ‏B בלי סימן → FAC.  $8C37: ‏D עם סימן → FAC (סוף של שגרת USR)
		clra
		clr	VALTYP
		bra	givd

; @island $9D3D
; הפסיקה של המערכת. תוכנה שמוסיפה פסיקה משלה מסיימת בקפיצה לכאן. ‏$9D46: אחרי האישור, מ-TIMER והלאה
		jmp	irq
		fill	$ff,$9d46-*
		jmp	irqtk

; @island $BB26
; ההמשך של "קרא את התו הבא" (קורא 2.1): ה-RAM ב-$9F קופץ לכאן עם A = התו. משתנים רק A ו-CC.
; ':' ומעלה: C=0 (ו-Z=1 על ':'). רווח: חוזרים ל-$9F. ספרה: C=1. ‏0: ‏Z=1. ה-RTS ב-$BB34
		cmpa	#':
		bhs	isl_bb26_9
		cmpa	#$20
		bne	isl_bb26_1
		jmp	<chrget
isl_bb26_1	suba	#'0
		suba	#-'0
isl_bb26_9	rts

; @island $8371
; ‏OK ולולאת הפקודות (קורא 8.14). ‏$837A: בלי OK
		jmp	main_ok
		fill	$ff,$837a-*
		jmp	main

; @island $83ED
; חיבור השורות מחדש (קורא 8.15)
		jmp	lnkprg

; @island $841F
; ניקוי כמו RUN, וחזרה למי שקרא (קורא 8.15)
		ldd	TXTTAB
		subd	#1
		std	TXTPTR
		bra	runstk

; @island $849F
; לולאת הפקודות (קורא 8.16). ‏$84A6: אחרי בדיקת ה-BREAK
		jmp	newstt
		fill	$ff,$84a6-*
		jmp	newst2

; @island $84ED
; משגר פקודות מטבלה (קורא 8.2)
		tfr	a,b
		lslb
		abx
		jsr	<chrget
		jmp	[,x]

; @island $851B
; בדיקת BREAK ו-SHIFT-@ (קורא 2.5)
		jmp	brkchk

; @island $852B
; מחכים למקש בלי סמן, ובודקים אותו (קורא 8.4)
isl_852b	jsr	$bbe5
		beq	isl_852b
		bra	brktst

; @island $85A5
; הפקודה RUN (קורא 8.16)
		jmp	run

; @island $8E4F
; ‏$8E4F: התו הבא ואז בית. ‏$8E51: ביטוי → B. ‏$8E54: ‏FAC → B (קורא 2.2)
		jsr	<chrget
		jsr	frmevl
		jsr	conint
		jmp	<chrgot

; @island $8E7A
; ‏$8E7A כתובת, פסיק ובית. ‏$8E7E פסיק ובית. ‏$8E83 ביטוי → X. ‏$8E86 ‏FAC → X (קורא 2.2)
		jmp	x_adrbyt
		fill	$ff,$8e7e-*
		jsr	chkcom
		bra	$8e51
		jsr	frmevl
		jsr	getadr
		tfr	d,x
		rts

; @island $903D
; הפקודה PRINT (קורא 8.3)
		jmp	print

; @island $90E5
; ‏$90E5 הדפסת מחרוזת מהזיכרון (X = הכתובת שלפניה). ‏$90E8 המחרוזת שב-FAC (קורא 2.4)
		jmp	x_strout
		jmp	strprt

; @island $957A
; הדפסת D כמספר בלי סימן (קורא 2.4)
		jmp	prnum

; @island $A0E3
; ‏$A0E3 שני בתים מההתקן ל-D. ‏$A0E5 בית אחד, ואז A ו-B מתחלפים. ‏$A0E9 RTS משותף.
; ‏$A0EA "חכה למקש": תו מההתקן, ‏?IO בסוף קובץ (קורא 8.1; הכתובת הנפוצה ביותר בתוכנות של אז)
		bsr	isl_a0e5
isl_a0e5	bsr	isl_a0ea
		exg	a,b
		rts
isl_a0ea	jmp	x_getdev

; @island $A93A
; מצב טקסט, כל האוגרים נשמרים (קורא 8.13)
		jmp	txtmode

; @island $AA10
; ערכת הצבעים מ-B (קורא 8.12)
		jmp	x_css

; @island $B3B4
; ‏RESET: וקטור המעבד מצביע לכאן, כמו במקור
		jmp	reset

; @island $B44F
; הכניסה החמה של BASIC: מתחילה ב-NOP, כי RESET בודק אותו (קורא 2.11)
		nop
		jmp	warm

; @island $B469
; ‏FIRQ (המחסנית), דרך $010F
		jmp	firq

; @island $B54A
; תו להתקן הנוכחי (היעד של $A002)
		jmp	chrout

; @island $B6A5
; ‏CSAVE של התוכנית, אחרי שהשם כבר במקום (קורא 8.9)
		jmp	csavp

; @island $B6D4
; הפקודה CLOAD (קורא 8.8)
		jmp	cload_st

; @island $BA77
; ‏$BA77 מסך נקי. ‏$BA79 המסך כולו בתו שב-B. ‏$BA7C מ-X עד הסוף. הסמן בהתחלה, X=$0600 (קורא 8.10)
		ldb	#$60
		ldx	#$0400
		stx	CURSOR
isl_ba7e	stb	,x+
		cmpx	#$0600
		blo	isl_ba7e
		rts

; @island $9772
; RND כפונקציה: הארגומנט ב-FAC, התוצאה ב-FAC (קורא 2.x). Phantom Slayer קורא לה ישר
		jmp	fn_rnd

; @island $B93E
; קריאת בלוק מהקלטת, כמו $A006 (Dungeon Raid קורא לה ישר)
		jmp	tblkrd

; @island $BDDC
; מנוע הקלטת כבוי, כמו $8018 (Dungeon Raid ו-Phantom Slayer)
		jmp	motoff

; @island $BDE7
; מנוע דולק וסנכרון קריאה, כמו $8021 / $A004 (Dungeon Raid)
		jmp	tsync

; @island $BAA0
; SOUND מאוגרים: B = המשך, הטון כבר ב-$8C (קורא 2.7). תוכנות בשפת מכונה קוראות לה ישר (למשל DragonTet, דרך CMOC)
		jmp	sound2

; @island $BAC3
; ‏$BAC3 הצליל כבוי. ‏$BAC5 דולק (קורא 2.7)
		bra	isl_bac8
		jmp	sndon
isl_bac8	jmp	sndoff

; @island $BAEC
; מקור הצליל B+1, והצליל דולק (קורא 8.11)
		jmp	x_audon

; @island $BBB5
; הבהוב הסמן (היעד של $8009)
		jmp	blink

; @island $BBC5
; לולאת ההשהיה שבסוף ההבהוב: X סיבובים של 8 מחזורים, ו-X חוזר 0 (DRAGON-SPEC-ENTRIES 6: ‏1118 סיבובים = כ-10 אלפיות;
; XRoar קורא לה delay_1ms, כמו $A7D3 ב-CoCo). Danger Ranger קורא לה ישר, עם X משלו
isl_bbc5	leax	-1,x
		bne	isl_bbc5
		rts

; @island $BBE5
; (בבדיקות בלבד, tools/xr2.mjs מפנה את ה-JMP הזה למחסנית הבדיקות, שמקלידה את השורות. ב-ROM עצמו אין קוד בדיקות)
; סריקת המקלדת (היעד של $8006 ו-$A000)
		jmp	keyindex

; @island $BCF5
; תו למדפסת, בלי טיפול בסוף שורה (קורא 8.6)
		jmp	lpsend

; @island $BD1A
; תו למדפסת עם סוף שורה (היעד של $800F; קורא 8.7)
		jmp	prtout

; @island $BD41
; בחירת מקור הצליל מ-B (קורא 1)
		jmp	x_mux

; @island $BD52
; קריאת הג'ויסטיקים (היעד של $8012 ו-$A00A)
		jmp	joyrd
