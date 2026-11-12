; Dragon 1982 BASIC — שלב 3, חלק 5: קלטת. צעד 2: פקודות הקבצים (CSAVE, CLOAD, CSAVEM, CLOADM, SKIPF, MOTOR).
; הכול לפי הקורא: docs/DRAGON-SPEC-TAPE.md, סעיפים 2-3 (עובדות בלבד, בלי קוד). נכתב מאפס.
; צעד 3: ההתקנים, קובצי נתונים (OPEN, CLOSE, PRINT #, INPUT #, EOF) וקובצי ASCII (סעיפים 3.3-3.13, 4).

DEVCFW		equ	$6a		; פרמטרי ההתקן (קורא: מדפסת 1.6, 7.2): רוחב שדה הפסיק
DEVLCF		equ	$6b		; תחילת שדה הפסיק האחרון
DEVPOS		equ	$6c		; המקום בשורה
DEVWID		equ	$6d		; רוחב השורה (0 = אין סוף)
SPCIO		equ	$6e		; קלט-פלט מיוחד: $FF כשההתקן הוא הקלטת (קורא 4.4)
DEVNUM		equ	$6f		; ההתקן: 0 מסך/מקלדת, $FF קלטת, $FE מדפסת
EOFFLG		equ	$70		; סוף קובץ: נדלק כשהחוצץ ריק בקריאת תו
CBFCNT		equ	$79		; כמה תווים בחוצץ הקלטת
CBFPTR		equ	$7a		; 2 בתים: התו הבא בחוצץ (קריאה)
FSTATE		equ	$78		; הקובץ: 0 סגור, 1 פתוח לקריאה, 2 פתוח לכתיבה
FNLEN		equ	$01d1		; אורך השם שבפקודה (0 = בלי שם)
FNAME		equ	$01d2		; 8 בתים: השם
TBUF		equ	$01da		; חוצץ הקלטת (255 בתים); 15 הראשונים הם גם הכותרת
HTYPE		equ	$01e2		; בכותרת: סוג הקובץ (0 תוכנית, 1 נתונים, 2 קוד מכונה)
HASCII		equ	$01e3		; 0 בינארי, $FF ASCII
HGAP		equ	$01e4		; 0 רציף, $FF עם פערים
HEXEC		equ	$01e5		; 2 בתים: כתובת הביצוע
HLOAD		equ	$01e7		; 2 בתים: כתובת הטעינה

; ---------- עזרים ----------
; getfne: השם, ואחריו סוף הפקודה. nochr: סוף הפקודה, אחרת ?SN
; (10.11: הסדר כאן מכוון: wrhdr עד wblk ו-drct נגמרים בדיוק לפני הגוש של $B93E, בלי קפיצה מעליו;
;  ‏rblk ו-search אחריו, בטווח bsr של drct ושל $B93E)
; wrhdr: הכותרת. A = סוג הקובץ, B = הדגלים (ASCII ופערים שווים בכל סוגי השמירה). קובץ פתוח: ?AO.
; רק השם, הסוג והדגלים נכתבים; בתי הביצוע והטעינה נשארים כמו שהם (CSAVEM כותב אותם לפני)
wrhdr		stb	HASCII
		stb	HGAP
wrhdx		tst	FSTATE		; ‏csavx נכנס כאן, כשהדגלים כבר במקום
		lbne	err_ao
		sta	HTYPE
		ldx	#FNAME
		ldu	#TBUF
		ldb	#8
		lbsr	cpy
		ldd	#15		; סוג 0, אורך 15 (3.11: בבת אחת, בית אחד פחות)
		std	BLKTYP
; wblkt: החוצץ כבלוק. wblk: כתיבת בלוק שלמה: מבוא (מנוע + השהיה), בלוק, מנוע כבוי
wblkt		ldx	#TBUF
		stx	BLKADR
wblk		jsr	tleader
		jsr	tblkwr
		lbra	motoff

; drct: Z=1 בפקודה ישירה (מספר השורה $FFxx)
drct		lda	CURLIN
		inca
		rts
		fill	$ff,$b93e-*	;@isl
; ‏$B93E קריאת בלוק ($A006). ‏$B944 (קורא 13): קריאת בלוק ל-X, כשהפסיקות כבר חסומות והסנכרון נעשה; DREAM קורא כך
; (X נשמר ב-$7E, ומשם כמו $B93E אחרי ההבהוב. במקור $7E לא נוגעים בו: הבדל קטן, ‏DREAM לא קורא אותו)
isl_b93e	jmp	tblkrd	;@isl
isl_b941	jmp	tbhunt	;@isl
		stx	<BLKADR	;@isl
		bra	isl_b941	;@isl

; rblk: קריאת בלוק שלמה לחוצץ: סנכרון (מנוע + השהיה), בלוק, מנוע כבוי. התוצאה ב-B, עם הדגלים
rblk		ldx	#TBUF
		stx	BLKADR
		jsr	tsync
		bsr	isl_b93e	; ‏$B93E: קריאת הבלוק (2 בתים במקום jsr)
		lbsr	motoff
		ldb	BLKRES
		rts


; search (3.2): קובץ פתוח: ?AO. בפקודה ישירה: מסך נקי, S בפינה, והסמן ב-$0402. קוראים בלוקים עד כותרת
; (שגיאה או בלוק אחר: שוב, בשקט). בפקודה ישירה מציגים את השם. מתאים (או בלי שם): F בפינה. אחרת מדלגים על
; הקובץ ומתחילים שוב
search		tst	FSTATE
		lbne	err_ao
srch2		bsr	drct
		bne	1F
		lbsr	cls
		lda	#$53		; S בתא הראשון (המסך נקי, הסמן בהתחלה), והסמן עוד תא ימינה: ב-$0402
		lbsr	putc
		inc	CURSOR+1
1		lbsr	rblk
		bne	1B
		lda	BLKTYP
		bne	1B
		bsr	drct
		bne	2F
		ldx	#TBUF
		ldb	#8
3		lda	,x+
		lbsr	putc
		decb
		bne	3B
2		tst	FNLEN
		beq	4F
		ldx	#FNAME
		ldu	#TBUF
		ldb	#8
5		lda	,x+
		cmpa	,u+
		bra	isl_b999_e	;@isl
		fill	$ff,$b999-*	;@isl
; ‏$B999 כתיבת בלוק ($A008, קורא 13): בלי מנוע ובלי מבוא. ‏DREAM שומר כך: ‏$801B ואז $B999
		jmp	tblkwr	;@isl
isl_b999_e	;@isl
		bne	6F
		decb
		bne	5B
4		bsr	drct
		bne	7F
		lda	#$46		; F
		sta	SCREEN
7		rts
6		bsr	skipfl
		bra	srch2


; wdata: X = ההתחלה, D = הסוף (לא כולל). בלוקים של 255 (האחרון קצר) ברצף, בלי מבוא ביניהם; אחריהם סוף
; קובץ, ומנוע כבוי. לפני כן: מבוא (tleader)
wdata		pshs	d
1		ldd	,s
		pshs	x
		subd	,s++		; כמה נשארו
		beq	3F
		tsta			; יותר מ-255 (3.11: בבדיקה של A, 4 בתים פחות)
		beq	2F
		ldb	#255
2		lda	#1		; סוג 1, והאורך מ-B (10.11: ‏std אחד, 2 בתים פחות)
		std	BLKTYP
		stx	BLKADR
		jsr	tblkwr		; X מתקדם
		bra	1B
3		ldd	#$ff00		; סוף: סוג $FF, אורך 0
		std	BLKTYP
		jsr	tblkwr
		leas	2,s
		lbra	motoff

; evstr: ביטוי שחייב להיות מחרוזת (לא מחרוזת: ?TM), ומשחררים אותה: A = האורך, X = התווים. 6.11: ארבעה מקומות
; קוראים לכאן במקום שתי קריאות, וכך התפנו 6 בתים לכתובות של Picture Maker
evstr		lbsr	frmevl
		lbra	frestr

; skipfl (3.7): מדלגים על הקובץ שהכותרת שלו בחוצץ. עם פערים: כל בלוק עם מנוע משלו. רציף: סנכרון פעם אחת.
; סוג 0 או $81-$FE, או שגיאת קריאה: ?IO. $FF: הסוף. המנוע כבוי בסוף
skipfl		ldb	HGAP		; החוצץ יידרס: הדגל נשמר במחסנית
		pshs	b
		bne	1F
		jsr	tsync
1		tst	,s
		beq	2F
		lbsr	rblk
		bra	3F
2		jsr	tblkrd		; ‏$7E כבר החוצץ (search קרא דרך rblk; 10.11: 5 בתים פחות)
3		bsr	chkblk
		inca			; $FF: הסוף
		beq	4F
		cmpa	#$82		; $01-$80: נתונים
		blo	1B
		bra	eio
4		leas	1,s
		lbra	motoff

; chkblk: אחרי קריאת בלוק: שגיאה (Z=0) או כותרת (סוג 0): ?IO. אחרת A = הסוג, עם הדגלים
chkblk		bne	eio
		lda	BLKTYP
		beq	eio
		rts
eio		lbra	err_io

; ---------- CSAVE (3.6) ----------
csave_st	cmpa	#'M
		beq	csavem
		lbsr	getfn
		jsr	<chrgot
		bne	1F
csavp		clra			; תוכנית, בינארי, רציף ($B6A5: אחרי השם)
		ldx	<DBLZER
; csavx ($B6A8, קורא 3.11): הסוג ב-A, הדגלים ב-X (הגבוה ASCII, הנמוך פערים). מ-[$19] עד [$1B], בלי הסוף
csavx		stx	HASCII
		lbsr	wrhdx
		jsr	tleader
		ldx	TXTTAB		; מתחילת התוכנית עד VARTAB (כולל שני האפסים של הסוף)
		ldd	VARTAB
		lbra	wdata
1		lbsr	chkcom		; ,A
		lda	#'A
		lbsr	synchk
		lbsr	nochr
; ---------- CSAVE "שם",A (3.6) ----------
; כותרת (0, $FF, $FF), הקובץ פתוח לכתיבה, ו-LIST של כל התוכנית לקלטת. בגלל הרוחב האינסופי: CR לפני כל שורה
; ואחרי האחרונה. אחר כך הקובץ נסגר, והתוכנית (אם רצה) נגמרת
cs_asc		clra
		lbsr	wopen
		lda	#$ff
		sta	DEVNUM
		sta	SPCIO
		ldb	#$ff		; A כבר $FF (3.11: בית אחד פחות, בשביל $BA6B)
		std	LEND
		clra
		clrb
		lbsr	dlist2
		lbsr	clsone
		lbra	newstk		; מחסנית חדשה ו-END

; getofs: [,היסט] → D (בלי: 0). cadr: ,כתובת → D
getofs		clrb
		jsr	<chrgot		; סוף הפקודה: 0 או ':'
		bne	cadr
		clra			; גם אחרי ':' (למשל CLOADM"":GOTO 280 ב-Tim Love's Cricket): ההיסט 0, לא $3A00
		rts
cadr		lbsr	comfrm
		lbra	getadr

; ---------- CSAVEM (3.14) ----------
csavem		jsr	<chrget		; ה-M
		lbsr	getfn
		bra	isl_ba6b_e	;@isl
; csv2c: סוף ההמשך של CSAVEM: כולל הסוף, וכותבים (11.11: ברווח שלפני $BA6B, כדי לפנות מקום ל-$B409)
csv2c		addd	#1
		lbra	wdata
		fill	$ff,$ba6b-*	;@isl
		jmp	x_clsb	;@isl
isl_ba6b_e	;@isl
		bsr	cadr
		std	HLOAD
		pshs	d
		bra	isl_ba77_e	;@isl
		fill	$ff,$ba77-*	;@isl
		ldb	#$60	;@isl
		ldx	#$0400	;@isl
		jmp	clrxd	;@isl
isl_ba77_e	;@isl
		bsr	cadr
		cmpd	,s		; סוף לפני התחלה: ?FC, לפני כתובת הביצוע
		lblo	err_fc
		pshs	d
		bsr	cadr
		std	HEXEC
		lbsr	nochr
csv2		lda	#2		; ‏$991B נכנס כאן (בלי השורה של ה-pshs: הכתובות כבר במחסנית)
		clrb
		lbsr	wrhdr		; ההמשך של CSAVEM: הכותרת, מבוא, ואז מההתחלה עד הסוף (11.11: כאן, ברווח שלפני $BAA0)
		jsr	tleader
		puls	d,x		; D = הסוף, X = ההתחלה
		bra	csv2c
		fill	$ff,$baa0-*	;@isl
; ---------- הצליל, בכתובות של המקור (3.11) ----------
; ‏$BAA0 (קורא 2.7): ‏SOUND מאוגרים: B = המשך, הטון כבר ב-$8C. ‏SNDTMR = 4B שדות
sound2		lda	#4	;@isl
		mul	;@isl
		std	SNDTMR	;@isl
; ‏$BAA5 (קורא 2.11): הצליל כשהמשך כבר ב-$8D/$8E. פסיקת השדה פתוחה, ה-DAC (דרך $BAF1), הצליל דולק, ואז הגל: מרכז,
; למעלה, מרכז, למטה. בין כתיבה לכתיבה 23+5N מחזורים (N = 256 פחות הטון), ואחרי הכתיבה התחתונה 31+5N (קורא 1.3)
snddur		lda	PIA0+3	;@isl
		ora	#1	;@isl
		sta	PIA0+3	;@isl
		clrb	;@isl
		bsr	isl_baf1	;@isl
		bsr	isl_bac5	;@isl
isl_bab4	bsr	isl_bad4	;@isl
		lda	#$fc	;@isl
		bsr	isl_bad6	;@isl
		bsr	isl_bad4	;@isl
		clra	;@isl
		bsr	isl_bad6	;@isl
		ldd	SNDTMR	;@isl
		bne	isl_bab4	;@isl
		bra	isl_bac8	;@isl
		fill	$ff,$bac3-*	;@isl
; ‏$BAC3 הצליל כבוי. ‏$BAC5 דולק (קורא 2.7)
		bra	isl_bac8	;@isl
isl_bac5	jmp	sndon	;@isl
isl_bac8	jmp	sndoff	;@isl
; dlyx ($BBC8): X סיבובים של 8 מחזורים, ו-X חוזר 0 (עבר לכאן מסוף ה-ROM ב-3.11)
dlyx		leax	-1,x
		bne	dlyx
		rts
		fill	$ff,$bad4-*	;@isl
; ‏$BAD4 (קורא 3.11): ה-DAC במרכז (124), ונופלים ל-$BAD6: ‏A ל-$FF20, ואז השהיה: הטון מ-DP:$8C עולה עד 256.
; בסוף A = 0 ו-Z=1, והשאר נשמר. ‏Cave Hunter (מחסנית, DP=$04) מנגן כך את הצלילים שלו
isl_bad4	lda	#$7c	;@isl
isl_bad6	sta	PIA1	;@isl
		lda	<SNDFRQ	;@isl
isl_badb	inca	;@isl
		bne	isl_badb	;@isl
		rts	;@isl
; SOUND (3.13): הטון ואז המשך, כל אחד 1-255 (עבר לכאן מ-mitsnd.s ב-3.11, ליד $BAA0)
sound_st	lbsr	evnzb
		stb	SNDFRQ		; נשמר מיד, גם אם המשך שגוי
		lbsr	chkcom
		lbsr	evnzb
		bra	sound2
		fill	$ff,$baec-*	;@isl
		jmp	x_audon	;@isl
		fill	$ff,$baf1-*	;@isl
; ‏$BAF1 (קורא 3.11): מקור הצליל מ-B (ביט 0 ל-$FF01, ביט 1 ל-$FF03; B=4: ה-DAC). ‏Cave Hunter קורא לה
isl_baf1	jmp	x_mux	;@isl

; ---------- MOTOR ON / OFF (3.8) ----------
motor_st	tfr	a,b		; chrget לא נוגע ב-B
		jsr	<chrget
		cmpb	#$c2		; OFF
		lbeq	motoff
		cmpb	#$88		; ON: המנוע והשהיה; הפסיקות לא נחסמות
		lbne	err_sn
		jmp	tmoton

; istape: Z=1 כשההתקן הוא הקלטת. A משתנה
istape		lda	DEVNUM
		inca
		rts
; chkout / chkin (4.2): הקלטת חייבת להיות פתוחה לכתיבה / לקריאה. סגורה: ?NO, בכיוון השני: ?FM.
; קריאה מהמדפסת: ?FM
chkout		jsr	HK_CKOUT	; 7
		ldb	#2
		bra	1F
chkin		jsr	HK_CKIN		; 6
		lda	DEVNUM
		cmpa	#$fe
		beq	8F
		ldb	#1
1		bsr	istape
		bne	9F
		bra	isl_bb26_e	;@isl
		fill	$ff,$bb26-*	;@isl
		cmpa	#':	;@isl
		bhs	isl_bb26_9	;@isl
		cmpa	#$20	;@isl
		bne	isl_bb26_1	;@isl
		jmp	<chrget	;@isl
isl_bb26_1	suba	#'0	;@isl
		suba	#-'0	;@isl
isl_bb26_9	rts	;@isl
isl_bb26_e	;@isl
		lda	FSTATE
		lbeq	err_no
		cmpb	FSTATE
		bne	8F
9		rts
8		lbra	err_fm

; ---------- פלט תו להתקן ($A002) ----------
; chrout: A להתקן שב-DEVNUM. מסך: putc. קלטת: לחוצץ (פתוח לקריאה או סגור: נזרק); חוצץ מלא (255): קודם
; בלוק. מדפסת: בהמשך. כל האוגרים נשמרים
chrout		jsr	HK_COUT		; 4
		tst	DEVNUM
		lbeq	putc
		pshs	a,b,x,y
		bsr	istape
		beq	0F
		lda	,s		; לא קלטת: המדפסת ($FE)
		bsr	prtout
		bra	9F
0
		ldb	FSTATE
		cmpb	#2
		bne	9F
		ldb	CBFCNT
		cmpb	#255
		bne	1F
		lbsr	wbuf
		clrb
1		ldx	#TBUF
		abx
		lda	,s
		sta	,x
		inc	CBFCNT
9		puls	a,b,x,y,pc
; devpar: פרמטרי ההתקן שב-DEVNUM ל-$6A-$6E (קורא: מדפסת 1.6, 7.2). Z=1 כשהרוחב 0. האוגרים נשמרים
; מסך: 16, 16, העמודה, 32. קלטת: 1, 0, 0, 0 (ו-SPCIO=$FF). מדפסת: $99, $9A, $9C, $9B
devpar		jsr	HK_DEVP		; 3
		pshs	a,b
		ldb	DEVNUM
		beq	1F
		incb
		beq	2F
		ldd	LPTCFW		; $99/$9A
		std	DEVCFW
		lda	LPTPOS
		ldb	LPTWID
		bra	3F
1		ldd	#$1010
		std	DEVCFW
		lda	CURSOR+1
		anda	#$1f
		ldb	#32
3		std	DEVPOS
		clr	SPCIO
		bra	9F
2		ldd	#$0100
		std	DEVCFW
		clra
		std	DEVPOS
		coma
		sta	SPCIO
9		tst	DEVWID
		puls	a,b,pc

; ---------- המדפסת ($800F; קורא: מדפסת 1.2-1.4) ----------
; prtout: התו ב-A למדפסת. 13 לא נשלח: במקומו רצף סוף השורה ($014A), ולפניו רווח אם השורה ריקה.
; תו מ-$20 מקדם את המקום ($9C); כשהמקום מגיע לרוחב: עם $0148 ≠ 0 המקום חוזר ל-0 (המדפסת יורדת שורה
; לבד), ועם 0 נשלח סוף שורה. A, B ו-X נשמרים
prtout		pshs	a,b,x
		cmpa	#13
		beq	2F
		cmpa	#$20
		bra	isl_bbb5_e	;@isl
		fill	$ff,$bbb5-*	;@isl
		jmp	blink	;@isl
isl_bbb5_e	;@isl
		blo	1F
		inc	LPTPOS
1		bsr	lpsend
		lda	LPTPOS
		cmpa	LPTWID
		bra	isl_bbc5_e	;@isl
		fill	$ff,$bbc5-*	;@isl
isl_bbc5	ldx	#$045e	;@isl
isl_bbc8	lbra	dlyx	;@isl
isl_bbc5_e	;@isl
		blo	9F
		tst	LPAUTO
		beq	2F
		clr	LPTPOS
9		puls	a,b,x,pc
; (6.11: wbuf עבר לכאן, לפני $BBE5, וסוף השורה של המדפסת עבר אחרי הכניסה. כך אין קפיצה מעליה, והתפנו בתים
; ל-$BCAB של Picture Maker)
wbuf		lda	#1		; wbuf: החוצץ כבלוק נתונים, עם מבוא ומנוע משלו
		sta	BLKTYP
		ldb	CBFCNT
		stb	BLKLEN
		lbsr	wblkt
		clr	CBFCNT
		rts
		fill	$ff,$bbe5-*	;@isl
		jmp	keyindex	;@isl
2		tst	LPTPOS		; סוף שורה
		bne	3F
		lda	#$20
		bsr	lpsend
3		ldx	#LPEOL
		ldb	,x+		; כמה בתים (עד 6)
		beq	5F
4		lda	,x+
		bsr	lpsend
		decb
		bne	4B
5		clr	LPTPOS
		puls	a,b,x,pc
; lpsend: בית אחד. מחכים לסוף ה"עסוק" ($FF22 ביט 0) בלי הגבלה ובלי BREAK; הנתון ל-$FF02, ופעימה
; בביט 1 של $FF20 (1 ואז 0; גם ה-DAC מתאפס). ב-Dragon 32 בלי המתנה למקלדת (קורא 1.2: הסקה)
lpsend		pshs	b
1		ldb	PIA1+2
		lsrb
		bcs	1B
		sta	PIA0+2
		ldb	#2
		stb	PIA1
		clr	PIA1
		puls	b,pc

; ---------- קלט תו מהקלטת ----------
; tchin: התו הבא מהחוצץ → A. חוצץ ריק: EOFFLG = $FF (ו-Z=0). כשהתו האחרון נלקח, ממלאים מיד. B ו-X נשמרים
tchin		jsr	HK_CIN		; 5
		pshs	b,x
		clr	EOFFLG
		ldb	CBFCNT
		bne	1F
		com	EOFFLG
		bra	9F
1		ldx	CBFPTR
		lda	,x+
		stx	CBFPTR
		dec	CBFCNT
		bne	9F
		pshs	a
		bsr	refill
		puls	a
9		tst	EOFFLG
		puls	b,x,pc
; refill: הבלוק הבא של קובץ עם פערים לחוצץ. סוג 0 או שגיאה: ?IO. $80-$FF: סוף (חוצץ ריק). בלוק ריק: הבא
; ropen: הקלטת פתוחה לקריאה, והבלוק הראשון
ropen		lda	#1
		sta	FSTATE
refill		ldx	#TBUF
		stx	CBFPTR
1		lbsr	rblk
		lbsr	chkblk
		bmi	2F
		ldb	BLKLEN
		beq	1B
		stb	CBFCNT
		rts
2		clr	CBFCNT
		rts
; tgetln: שורה מהקלטת ל-LINBUF (מסתיימת ב-0): ביט 7 נמחק, תווים מתחת ל-$20 או מעל z נזרקים, עד 249, CR
; מסיים. סוף הקובץ: C=1
tgetln		jsr	HK_LINE		; 13
		ldx	#LINBUF
		clrb
1		bsr	tchin
		bne	8F
		anda	#$7f
		cmpa	#13
		beq	2F
		cmpa	#$20
		blo	1B
		cmpa	#'z
		bhi	1B
		cmpb	#249
		bhs	1B
		sta	,x+
		incb
		bra	1B
2		clr	,x		; C=0
		rts
8		clr	,x
		coma			; C=1 (6.11: במקום orcc #1, בית אחד פחות; A לא בשימוש בסוף הקובץ)
		rts
; devgetln: שורה מההתקן (INPUT, LINE INPUT): מקלדת, או קלטת (סוף הקובץ: ?IE)
devgetln	lbsr	istape
		lbne	getline
		bsr	tgetln
		lbcs	err_ie
		rts

; ---------- OPEN "I"|"O",#התקן,[שם] (3.9) ----------
open_st		jsr	HK_OPEN		; 1
		lbsr	evstr		; ?TM
		tsta
		lbeq	err_fc
		lda	,x		; רק התו הראשון
		pshs	a
		lbsr	chkcom
		lbsr	getdev
		lbsr	chkcom
		lbsr	getfne
		lda	DEVNUM
		bra	isl_bcab_e	;@isl
		fill	$ff,$bcab-*	;@isl
		jmp	putcr	;@isl
isl_bcab_e	;@isl
		clr	DEVNUM
		puls	b
		cmpb	#'O
		beq	2F
		cmpb	#'I
		bne	efmo
		cmpa	#$fe		; "I": מדפסת ?FM, מסך כלום
		beq	efmo
		inca
		bne	9F
		lbsr	search
		tst	HASCII		; רק קובץ ASCII עם פערים
		beq	efmo
		tst	HGAP
		beq	efmo
		lbra	ropen
2		inca			; "O": מסך ומדפסת כלום
		bne	9F
		lda	#1		; נתונים, ASCII, פערים
; wopen: כותרת (A = הסוג, ASCII ופערים), הקלטת פתוחה לכתיבה, והחוצץ ריק
wopen		ldb	#$ff
		lbsr	wrhdr
		lda	#2
		sta	FSTATE
		clr	CBFCNT
9		rts
efmo		lbra	err_fm		; ?FM קרוב (OPEN, CLOAD של ASCII)

; ---------- CLOSE [#התקן[,#התקן...]] (3.13) ----------
close_st	beq	tclose		; בלי כלום: הכול
1		lbsr	getdev
		bsr	clsone
		jsr	<chrgot
		beq	9F		; ה-rts של tclose
		lbsr	chkcom
		bra	1B
		fill	$ff,$bcf5-*	;@isl
		jmp	lpsend	;@isl
; tclose: סגירת הכול (END, RUN, CLOSE; קורא: מדפסת 3.6 נקודות 8-9): הקלטת, דרך סגירת התקן אחד
tclose		jsr	HK_CLALL	; 8
		lda	#$ff
		sta	DEVNUM
; clsone: סגירת ההתקן שב-DEVNUM, ו-DEVNUM = 0. קלטת פתוחה לכתיבה: מה שנשאר בחוצץ (אם יש) ובלוק סוף,
; כל אחד עם מנוע ומבוא; הקלטת סגורה
clsone		jsr	HK_CLONE	; 9
		lda	DEVNUM
		clr	DEVNUM
		inca
		bne	9F
		lda	FSTATE
		cmpa	#2
		bne	tcl1
		tst	CBFCNT
		beq	2F
		lbsr	wbuf
2		lda	#$ff
		bra	isl_bd1a_e	;@isl
		fill	$ff,$bd1a-*	;@isl
		jmp	prtout	;@isl
isl_bd1a_e	;@isl
		sta	BLKTYP
		clr	BLKLEN
		lbsr	wblk
tcl1		clr	FSTATE		; C=0 (END)
		clr	DEVNUM
9		rts

; ---------- EOF(התקן) (3.12) ----------
; מקלדת: 0. מדפסת: ?FM. קלטת: פתוחה לקריאה, ו-1- כשהחוצץ ריק. ההתקן הקודם חוזר אחר כך
fn_eof		jsr	HK_EOF		; 15
		lda	DEVNUM
		pshs	a
		lbsr	devfac		; B = DEVNUM
		tstb
		beq	1F
		lbsr	chkin
		clrb
		tst	CBFCNT
		bne	1F
		decb
		bra	isl_bd41_e	;@isl
		fill	$ff,$bd41-*	;@isl
		jmp	x_mux	;@isl
isl_bd41_e	;@isl
1		puls	a
		sta	DEVNUM
		sex
		lbra	givd

; ---------- CLOAD של קובץ ASCII (3.3) ----------
; דגל ASCII חובה (?FM). NEW, הקלטת פתוחה לקריאה, ושורה אחרי שורה כאילו הוקלדה (בלי הד). שורה בלי מספר: ?DS.
; בסוף הקובץ: סגור, ו-OK. שורה שנקטעה בסוף הקובץ הולכת לאיבוד
cl_asc		tst	HASCII
		bra	isl_bd52_e	;@isl
		fill	$ff,$bd52-*	;@isl
		jmp	joyrd	;@isl
isl_bd52_e	;@isl
		beq	efmo
		lbsr	scrtch
		lda	#$ff
		sta	DEVNUM
		sta	SPCIO
		lbsr	ropen
1		lbsr	tgetln
		bcs	3F
		ldx	#LINBUF
		lbsr	skipsp
		beq	1B		; שורה ריקה
		lbsr	isdig
		lbcc	err_ds
		lbsr	storeline
		bra	1B
3		jsr	HK_AEOF		; 14
		bsr	tcl1
		lbra	edok		; מחסנית חדשה ו-OK

; ---------- CLOADM של קובץ עם פערים (3.4) ----------
; ההתקן הוא הקלטת (הקובץ נשאר "סגור"), והבלוק הראשון נקרא. אחר כך: סוג 2 ו-ASCII 0 (אחרת ?FM), היסט, סוף
; הפקודה. רשומות: סוג, אורך (2), כתובת (2). סוג 0: הבתים, כל אחד נבדק. אחר: כתובת הביצוע, והסוף
clm_gap		ldd	HTYPE		; הכותרת תידרס בחוצץ: הסוג וה-ASCII נשמרים
		pshs	d
		lda	#$ff
		sta	DEVNUM
		lbsr	refill
		puls	d
		cmpd	#$0200
		lbne	err_fm
		lbsr	getofs		; ההיסט
		pshs	d
		lbsr	nochr
1		bsr	trawb		; סוג
		pshs	a
		lbsr	trawd		; אורך
		tfr	d,y
		lbsr	trawd		; כתובת
		addd	1,s
		tfr	d,x
		tst	,s+
		bne	3F
2		leay	,y
		beq	1B
		bsr	trawb
		sta	,x
		cmpa	,x+
		bne	eio2
		leay	-1,y
		bra	2B
3		stx	EXECJP
		leas	2,s
		lbra	tcl1
		fill	$ff,$bdcf-*	; בדיקה: אם $BDCF זז, ההרכבה נכשלת
; ‏$BDCF (קורא 2.11): המנוע דולק, ואז השהיה של $95/$96 ספירות (A ו-X משתנים). טוענים של Quickbeam (Galactic Gus)
; ו-Computape (Crazy Foota 2) קוראים לה לפני קריאת בלוק. ‏trawd עבר ל-entries.s כדי לפנות לה מקום
		jmp	tmoton
; trawb: בית מהקלטת. סוף הקובץ באמצע: ?IO
trawb		lbsr	tchin
		bne	eio2
		rts
eio2		lbra	err_io
; noserv: המדפסת (בהמשך) וכניסות התקשורת שאין ב-Dragon 32 (10.11: עבר לכאן מ-io.s, לרווח שלפני $BDDC)
noserv		rts
		fill	$ff,$bddc-*	;@isl
		jmp	motoff	;@isl
