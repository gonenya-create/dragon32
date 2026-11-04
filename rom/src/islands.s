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

; @island $8B27
; ‏$8B27 (קורא 2.11): FAC → מספר שלם לא שלילי ב-D. FAC שלילי: ?FC, ואחר כך כמו $8B2D (במקור: באמצע פקודה)
		tst	<FACSGN
		bmi	isl_8b2d_fc
		fcb	$21,$00		; brn: נופלים ל-$8B2D
; ‏$8B2D: FAC → מספר שלם עם סימן ב-D (קטיעה לכיוון אפס), ?TM למחרוזת, ?FC מחוץ לטווח
		bsr	chknum
		lda	FACSGN
		pshs	a
		clr	FACSGN
		lda	FACEXP
		cmpa	#144
		blo	isl_8b2d_1
		lda	,s
		sta	FACSGN
		ldx	#n32768
		bsr	fcomp
		bne	isl_8b2d_fc
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
isl_8b2d_fc	jmp	err_fc

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
; ‏$837D (קורא 2.11): הפקודה שב-X+1 (מסתיימת ב-0), בלי לקרוא שורה: מכווצים ומבצעים, ולא חוזרים.
; טוענים של Incentive (Ket) ו-Dragon Data (Monsters & Magic) שולחים כך " RUN". הקוד יושב במילוי שבין $8374 ל-$837A
x837d		leax	1,x
		jmp	mainx
		fill	$ff,$837a-*
		jmp	main
		bra	x837d

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
; לולאת הפקודות (קורא 8.16). ‏$84A6: אחרי בדיקת ה-BREAK. מ-$84A6 הקוד עצמו, באותו סדר כמו במקור, כך שב-$84AF
; יושב ה-':' של CMPA #': (28.10). הטוען של Cuthbert in the Jungle מכוון לשם את מצביע הטקסט: BASIC קורא ':',
; וקורא ל"תו הבא" ($9F), שהטוען דרס בעצמו
		jmp	newstt
		fill	$ff,$84a6-*
		ldx	<TXTPTR
		stx	<TXTBEG		; תחילת הפקודה: לשם חוזרים אחרי קלט שגוי ב-INPUT (קורא: TXTBEG)
		lda	,x
		beq	isl_nst3
		cmpa	#':
		lbne	err_sn
		jmp	gone
isl_nst3	jmp	newst3		; סוף שורה: הקישור שאחריו אומר מה הלאה

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
; ‏$85A8 (קורא 2.11): RUN אחרי ה-hook שלו. בלי מספר שורה: כמו $841F, וחוזרים לכתובת שבמחסנית עם מחסנית חדשה
		jmp	run85

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
; הכניסה החמה של BASIC: מתחילה ב-NOP, כי RESET בודק אותו (קורא 2.11). כמו במקור (קורא 3.11): כאן עצמה
; מאפסים את PLYTMR ומדליקים את פסיקת השדה ($FF03 ביט 0), ומ-$B45C ההמשך: ההתקן 0, מחסנית חדשה, הפסיקות
; פתוחות, מסך נקי ו-OK, בלי חזרה. Black Sanctum ו-Calixto Island יוצאים ל-BASIC דרך $B45C. מוצב ביד ב-mitsnd.s
warm		nop
		clra
		clrb
		std	PLYTMR
		lda	PIA0+3
		ora	#1
		sta	PIA0+3
		jmp	warm2

; @island $B469
; ‏FIRQ (המחסנית), דרך $010F
		jmp	firq

; @island $B482
; השהיה: X סיבובים (Junior's Revenge, חבילה 8)
		jmp	dlyx

; @island $B54A
; תו להתקן הנוכחי (היעד של $A002)
		jmp	chrout

; @island $B6A5
; ‏CSAVE של התוכנית, אחרי שהשם כבר במקום (קורא 8.9). ‏$B6A6, בית אחד אחרי: אותו דבר עם הסוג שב-A
; (קורא 30.10: El Diablero שומר משחק עם A=2), לכן כאן clra ומיד אחריו הקפיצה
		clra
		ldx	<DBLZER
		jmp	csavx

; @island $B505
; ‏$B505 (קורא 3.11): תו מההתקן הנוכחי, בלי ביט 7. מקלדת: מחכים עם סמן מהבהב, בלי הד, ואז B ו-X נשמרים.
; Black Sanctum ו-Calixto Island קוראים כך כל מקש. מוצב ביד ב-PLAY (mitsnd.s)
		jmp	x_inch7

; @island $B538
; מקש מהמקלדת: מחכים עם סמן מהבהב, ובסוף רווח ירוק במקום הסמן. בלי הד, A = המקש, B ו-X נשמרים (קורא 30.10)
		jmp	getkey

; @island $B58F
; ‏$B58F (קורא 4.11): תו למסך, תמיד, בלי ה-hook של $0167 ובלי לבדוק את $6F. קודם מצב טקסט ($A93A), וכל האוגרים
; נשמרים חוץ מ-CC. ‏Telewriter כותב כך את ההודעה הראשונה שלו. מוצב ביד ב-PLAY (mitsnd.s), במקום הטבלה של התווים
		jmp	putc

; @island $B5C6
; ‏$B5C6 (קורא 3.11): שורה מהמקלדת, קודם ה-hook של $0182 (Black Sanctum ו-Calixto Island: שם הקלטת לשמירה)
		jsr	HK_LINE
; ‏$B5C9: שורה מהמקלדת ל-$02DD, בלי ה-hook (קורא 30.10: El Diablero קורא כך את הפקודות)
		jmp	x_inlin

; @island $B663
; ‏$B663 (קורא 3.11): סגירת ההתקן שב-$6F, קודם ה-hook של $0176, ו-$6F = 0. קלטת פתוחה לכתיבה: החוצץ ובלוק סוף.
; Synther 7 קורא כך בסוף הטעינה שלו. מוצב ביד ב-PLAY (mitsnd.s): השגרות והטבלאות לפניו, ההמשך של pnote אחריו
		jmp	clsone

; @island $991B
; ‏$991B (קורא 2.11): CSAVEM אחרי הארגומנטים. ההתחלה ב-S+4, הסוף ב-S+2, ‏S+0 לא נקרא; השם ($01D2) והכתובות
; שבכותרת ($01E5, ‏$01E7) כבר במקום. הסוג 2, בלי ASCII ובלי רווחים; חוזרים דרך המילה שב-S+6
		leas	2,s
		jmp	csv2

; @island $A08E
; ‏$A08E (קורא 2.11): CLOADM: הקובץ נסגר ($78 = 0), מדלגים על תו אחד (ה-M), ואז השם, החיפוש והטעינה.
; ‏$A092: אותו דבר בלי שני הצעדים האלה, כשהמצביע כבר על התו שלפני השם. ‏A לא משנה
		clr	<FSTATE
		jsr	<chrget
		jmp	clmnm
; ‏$A095: CLOADM אחרי השם: השם כבר ב-$01D1-$01D9 (קורא 30.10: El Diablero טוען כך משחק שמור)
		jmp	clmfn

; @island $B7C2
; ‏$B7C2 (קורא 3.11): ‏FNLEN = B, ואם B לא 0, מעתיקים B בתים מ-X ל-$01D2. Black Sanctum ו-Calixto Island קובעים כך
; את שם הקלטת של משחק שמור. מוצב ביד ב-mittape.s, באזור המתוזמן: tleader לפניו, והטבלה tsin אחריו
		jmp	x_fnb

; @island $B6D4
; הפקודה CLOAD (קורא 8.8). מ-3.11 הקוד שלה מתחיל כאן עצמו (mittape.s), בלי קפיצה
		clr	FSTATE
		cmpa	#'M

; @island $B75B
; ‏CLOADM מהכתובת שב-X: מנוע, בלוקים לשם עד בלוק הסוף, מנוע כבוי (המקביל של $A529 ב-CoCo. הטוען של Athletyx קורא לה ישר).
; מ-3.11 הקוד של clmx מתחיל כאן עצמו (mittape.s), ו-clm748 נופל לתוכו
clmx		pshs	x

; @island $BA6B
; ‏$BA6B (קורא 3.11): CLS עם הצבע ב-B, אחרי בדיקת הטווח: 0 שחור, 1-8 גוש מלא בצבע B-1, והסמן בהתחלה.
; Black Sanctum ו-Calixto Island מנקים כך (B=1) לפני כל מסך טקסט. מוצב ביד ב-csavem (mitfile.s)
		jmp	x_clsb

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

; @island $978E
; ‏$978E (קורא 4.11): שבר אקראי חדש, מ-0 עד 1 (לא כולל), ב-FAC. ‏Y ו-U נשמרים, A, B ו-X לא. הזרע ב-$0116.
; ‏Airball קורא כך. מוצב ביד במערכים (mitary.s); ‏nz0999 עבר ל-$9D40 כדי לפנות לו מקום
		jmp	rnd_adv

; @island $B87A
; ‏$B87A (קורא 3.11): פתיחת הקלטת לקריאה (החיפוש, $79 = 0, ‏$7A = $01DA). מוצב ביד ב-mittape.s, באזור המתוזמן
		lbra	opnin

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
; ‏SOUND מאוגרים: B = המשך, הטון כבר ב-$8C (קורא 2.7). מ-3.11 הצליל כולו בכתובות של המקור (mitfile.s): ‏$BAA0 ‏sound2,
; ‏$BAA5 הצליל כשהמשך כבר ב-$8D/$8E (קורא 2.11), ‏$BAD4/$BAD6 צעד של ה-DAC עם השהיה (קורא 3.11). מוצב ביד
sound2		lda	#4
		mul
		std	SNDTMR

; @island $BAA5
; ‏$BAA5: הצליל כשהמשך כבר במקום (התחלת snddur, ב-mitfile.s)
snddur		lda	PIA0+3

; @island $BAC3
; ‏$BAC3 הצליל כבוי. ‏$BAC5 דולק (קורא 2.7)
		bra	isl_bac8
		jmp	sndon
isl_bac8	jmp	sndoff

; @island $BAD4
; ‏$BAD4 (קורא 3.11): ה-DAC במרכז (124) ונופלים ל-$BAD6: ‏A ל-$FF20 והשהיה לפי הטון ב-DP:$8C. ‏Cave Hunter. מוצב ביד ב-mitfile.s
isl_bad4	lda	#$7c
isl_bad6	sta	PIA1

; @island $BAEC
; מקור הצליל B+1, והצליל דולק (קורא 8.11)
		jmp	x_audon

; @island $BAF1
; ‏$BAF1 (קורא 3.11): מקור הצליל מ-B (ביט 0 ל-$FF01, ביט 1 ל-$FF03; B=4: ה-DAC). ‏Cave Hunter. מוצב ביד ב-mitfile.s
isl_baf1	jmp	x_mux

; @island $BBB5
; הבהוב הסמן (היעד של $8009)
		jmp	blink

; @island $BBC5
; לולאת ההשהיה שבסוף ההבהוב: X סיבובים של 8 מחזורים, ו-X חוזר 0 (DRAGON-SPEC-ENTRIES 6: ‏1118 סיבובים = כ-10 אלפיות;
; XRoar קורא לה delay_1ms, כמו $A7D3 ב-CoCo). $BBC5 טוענת את X בעצמה ($045E), ו-$BBC8 היא הלולאה עם X של הקורא:
; הטוען של Microdeal ל-Donkey King (31.10) קורא ל-$BBC8 עם X משלו, כדי שהמוזיקה שבקלטת תתנגן. Danger Ranger ו-Cuthbert
; קוראים ל-$BBC5 (ההמתנה במסך הרישיון של Cuthbert, 512 קריאות, נהיית כ-5 שניות ולא 5 דקות).
; $B748, $B87E, $8C5B, $ADBD ו-$B3B9 מוצבים ביד, לא בכלי: הסביבה שלהם צפופה מדי. כל אחד עם fill שבודק את הכתובת
; ($BBC8 = X משלכם: הלולאה עצמה, dlyx בסוף ה-ROM, ב-io.s)
isl_bbc5	ldx	#$045e
isl_bbc8	lbra	dlyx

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
