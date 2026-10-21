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
getfne		bsr	getfn
nochr		jsr	<chrgot
		lbne	err_sn
		rts
; getfn (3.1): השם מתמלא ברווחים. אם יש ביטוי: מחרוזת, וכל התווים שלה מועתקים מ-FNAME (שם ארוך גולש לחוצץ)
getfn		ldx	#FNAME
		ldd	#$2008		; 8 רווחים
1		sta	,x+
		decb
		bne	1B
		clr	FNLEN
		jsr	<chrgot
		beq	9F
		lbsr	frmevl
		lbsr	frestr		; לא מחרוזת: ?TM
		sta	FNLEN
		beq	9F
		ldu	#FNAME
; cpy: A בתים מ-X ל-U (A לא 0)
cpy		ldb	,x+
		stb	,u+
		deca
		bne	cpy
9		rts

; rblk: קריאת בלוק שלמה לחוצץ: סנכרון (מנוע + השהיה), בלוק, מנוע כבוי. התוצאה ב-B, עם הדגלים
rblk		ldx	#TBUF
		stx	BLKADR
		jsr	tsync
		jsr	tblkrd
		lbsr	motoff
		ldb	BLKRES
		rts
; wrhdr: הכותרת. A = סוג הקובץ, B = הדגלים (ASCII ופערים שווים בכל סוגי השמירה). קובץ פתוח: ?AO.
; רק השם, הסוג והדגלים נכתבים; בתי הביצוע והטעינה נשארים כמו שהם (CSAVEM כותב אותם לפני)
wrhdr		tst	FSTATE
		lbne	err_ao
		sta	HTYPE
		stb	HASCII
		stb	HGAP
		ldx	#FNAME
		ldu	#TBUF
		lda	#8
		bsr	cpy
		clr	BLKTYP
		lda	#15
		sta	BLKLEN
; wblkt: החוצץ כבלוק. wblk: כתיבת בלוק שלמה: מבוא (מנוע + השהיה), בלוק, מנוע כבוי
wblkt		ldx	#TBUF
		stx	BLKADR
wblk		jsr	tleader
		jsr	tblkwr
		lbra	motoff

; wdata: X = ההתחלה, D = הסוף (לא כולל). בלוקים של 255 (האחרון קצר) ברצף, בלי מבוא ביניהם; אחריהם סוף
; קובץ, ומנוע כבוי. לפני כן: מבוא (tleader)
wdata		pshs	d
1		ldd	,s
		pshs	x
		subd	,s++		; כמה נשארו
		beq	3F
		cmpd	#255
		bls	2F
		ldd	#255
2		stb	BLKLEN
		lda	#1
		sta	BLKTYP
		stx	BLKADR
		jsr	tblkwr		; X מתקדם
		bra	1B
3		lda	#$ff
		sta	BLKTYP
		clr	BLKLEN
		jsr	tblkwr
		leas	2,s
		lbra	motoff

; drct: Z=1 בפקודה ישירה (מספר השורה $FFxx)
drct		lda	CURLIN
		inca
		rts

; search (3.2): קובץ פתוח: ?AO. בפקודה ישירה: מסך נקי, S בפינה, והסמן ב-$0402. קוראים בלוקים עד כותרת
; (שגיאה או בלוק אחר: שוב, בשקט). בפקודה ישירה מציגים את השם. מתאים (או בלי שם): F בפינה. אחרת מדלגים על
; הקובץ ומתחילים שוב
search		tst	FSTATE
		lbne	err_ao
srch2		bsr	drct
		bne	1F
		lbsr	cls
		lda	#$53		; S
		sta	SCREEN
		ldx	#SCREEN+2
		stx	CURSOR
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
2		ldx	#TBUF
		stx	BLKADR
		jsr	tblkrd
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
efm		lbra	err_fm

; ---------- CLOAD (3.3) ----------
cload_st	clr	FSTATE		; סוגרים בכוח (מה שחיכה לכתיבה הולך לאיבוד)
		cmpa	#'M
		beq	cloadm
		leas	2,s		; CLOAD לא חוזר לתוכנית
		lbsr	getfne
		lbsr	search
		tst	HGAP
		lbne	cl_asc
		tst	HTYPE		; רציף: רק תוכנית
		bne	efm
		lbsr	scrtch
		jsr	tsync
		ldx	TXTTAB
1		stx	BLKADR
		tfr	s,d		; מקום לבלוק: הכתובת + 256 + 58 מתחת למחסנית
		subd	#314
		cmpd	BLKADR
		lbls	err_om
		jsr	tblkrd
		bne	7F
		lda	BLKTYP
		beq	7F		; כותרת באמצע
		bpl	1B		; $01-$7F: נתונים. $80-$FF: הסוף
		stx	VARTAB
		lbsr	motoff
		lbsr	prcr
		leax	m_ok,pcr	; OK ושורה חדשה, גם בתוכנית
		lbsr	puts
		lbsr	lnkprg		; קישורים חדשים (תוכנית שנשמרה בכתובת אחרת)
		lbsr	runc
		lds	STKTOP
		clr	,-s
		lbra	main		; לא מריצים, ובלי OK נוסף
7		lbsr	scrtch		; מה שנטען נמחק
		bra	eio

; ---------- CLOADM (3.4) ----------
cloadm		jsr	<chrget		; ה-M
		lbsr	getfn
		lbsr	search
		tst	HGAP
		lbne	clm_gap
		bsr	getofs		; ההיסט (אחרי החיפוש)
		pshs	d
		lda	HTYPE
		cmpa	#2
		bne	efm
		ldd	HEXEC
		addd	,s
		std	EXECJP
		ldd	HLOAD
		addd	,s
		std	,s		; הסנכרון מאפס את X (המנוע)
		jsr	tsync
		puls	x
2		stx	BLKADR
		jsr	tblkrd
		lbsr	chkblk
		bpl	2B
		lbra	motoff		; ממשיכים לפקודה הבאה

; ---------- CSAVE (3.6) ----------
csave_st	cmpa	#'M
		beq	csavem
		lbsr	getfn
		jsr	<chrgot
		bne	1F
		clra			; תוכנית, בינארי, רציף
		clrb
		lbsr	wrhdr
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
		ldd	#$ffff
		std	LEND
		clra
		clrb
		lbsr	dlist2
		lbsr	tclose
		lds	STKTOP
		clr	,-s
		lbra	endcon

; getofs: [,היסט] → D (בלי: 0). cadr: ,כתובת → D
getofs		clrb
		jsr	<chrgot		; סוף: A = 0
		bne	cadr
		rts
cadr		lbsr	chkcom
		lbsr	frmevl
		lbra	getadr

; ---------- CSAVEM (3.14) ----------
csavem		jsr	<chrget		; ה-M
		lbsr	getfn
		bsr	cadr
		std	HLOAD
		pshs	d
		bsr	cadr
		cmpd	,s		; סוף לפני התחלה: ?FC, לפני כתובת הביצוע
		lblo	err_fc
		pshs	d
		bsr	cadr
		std	HEXEC
		lbsr	nochr
		lda	#2
		clrb
		lbsr	wrhdr
		jsr	tleader
		puls	d,x		; D = הסוף, X = ההתחלה
		addd	#1		; כולל הסוף
		lbra	wdata

; ---------- SKIPF (3.7) ----------
skipf_st	lbsr	getfne
		lbsr	search
		lbra	skipfl

; ---------- MOTOR ON / OFF (3.8) ----------
motor_st	tfr	a,b		; chrget לא נוגע ב-B
		jsr	<chrget
		cmpb	#$c2		; OFF
		lbeq	motoff
		cmpb	#$88		; ON: המנוע והשהיה; הפסיקות לא נחסמות
		lbne	err_sn
		jmp	tmoton

; ======================= צעד 3: ההתקנים וקובצי הטקסט =======================

; ---------- מספר התקן (4.1) ----------
; getdev: [#]ביטוי → DEVNUM. בין -32768 ל-32767 (אחרת ?FC), אחר כך בין -128 ל-127 (אחרת ?DN); נשמר,
; ורק 0, -1, -2 מותרים (אחרת ?DN; השגיאה מאפסת את DEVNUM)
getdev		cmpa	#'#
		bne	1F
		jsr	<chrget
1		lbsr	frmevl
devfac		lbsr	ayint
		ldb	FACLO
		sex
		cmpa	FACMO
		bne	8F
		stb	DEVNUM
		clra			; הדגל של הקלטת: $FF רק כש-B = $FF (אז C=0)
		cmpb	#$ff
		adca	#$ff
		sta	SPCIO
		cmpb	#$fe		; $FE, $FF או 0. B = DEVNUM ביציאה
		bhs	9F
		tstb
		bne	8F
9		rts
8		lbra	err_dn
; istape: Z=1 כשההתקן הוא הקלטת. A משתנה
istape		lda	DEVNUM
		inca
		rts
; chkout / chkin (4.2): הקלטת חייבת להיות פתוחה לכתיבה / לקריאה. סגורה: ?NO, בכיוון השני: ?FM.
; קריאה מהמדפסת: ?FM
chkout		ldb	#2
		bra	1F
chkin		lda	DEVNUM
		cmpa	#$fe
		beq	8F
		ldb	#1
1		bsr	istape
		bne	9F
		lda	FSTATE
		lbeq	err_no
		cmpb	FSTATE
		bne	8F
9		rts
8		lbra	err_fm

; ---------- פלט תו להתקן ($A002) ----------
; chrout: A להתקן שב-DEVNUM. מסך: putc. קלטת: לחוצץ (פתוח לקריאה או סגור: נזרק); חוצץ מלא (255): קודם
; בלוק. מדפסת: בהמשך. כל האוגרים נשמרים
chrout		tst	DEVNUM
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
devpar		pshs	a,b
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
		blo	1F
		inc	LPTPOS
1		bsr	lpsend
		lda	LPTPOS
		cmpa	LPTWID
		blo	9F
		tst	LPAUTO
		beq	2F
		clr	LPTPOS
9		puls	a,b,x,pc
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

; wbuf: החוצץ כבלוק נתונים, עם מבוא ומנוע משלו
wbuf		lda	#1
		sta	BLKTYP
		ldb	CBFCNT
		stb	BLKLEN
		lbsr	wblkt
		clr	CBFCNT
		rts

; ---------- קלט תו מהקלטת ----------
; tchin: התו הבא מהחוצץ → A. חוצץ ריק: EOFFLG = $FF (ו-Z=0). כשהתו האחרון נלקח, ממלאים מיד. B ו-X נשמרים
tchin		pshs	b,x
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
tgetln		ldx	#LINBUF
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
		orcc	#1
		rts
; devgetln: שורה מההתקן (INPUT, LINE INPUT): מקלדת, או קלטת (סוף הקובץ: ?IE)
devgetln	lbsr	istape
		lbne	getline
		bsr	tgetln
		lbcs	err_ie
		rts

; ---------- OPEN "I"|"O",#התקן,[שם] (3.9) ----------
open_st		lbsr	frmevl
		lbsr	frestr		; ?TM
		tsta
		lbeq	err_fc
		lda	,x		; רק התו הראשון
		pshs	a
		lbsr	chkcom
		lbsr	getdev
		lbsr	chkcom
		lbsr	getfne
		lda	DEVNUM
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
close_st	beq	tclose		; בלי כלום: הקלטת
1		lbsr	getdev
		incb			; B = DEVNUM: הקלטת?
		bne	2F
		bsr	tclose
2		clr	DEVNUM
		jsr	<chrgot
		beq	9F		; ה-rts של tclose
		lbsr	chkcom
		bra	1B
; tclose: קובץ פתוח לכתיבה: מה שנשאר בחוצץ (אם יש) ובלוק סוף, כל אחד עם מנוע ומבוא. תמיד: סגור, התקן 0
tclose		lda	FSTATE
		cmpa	#2
		bne	tcl1
		tst	CBFCNT
		beq	2F
		lbsr	wbuf
2		lda	#$ff
		sta	BLKTYP
		clr	BLKLEN
		lbsr	wblk
tcl1		clr	FSTATE		; C=0 (END)
		clr	DEVNUM
9		rts

; ---------- EOF(התקן) (3.12) ----------
; מקלדת: 0. מדפסת: ?FM. קלטת: פתוחה לקריאה, ו-1- כשהחוצץ ריק. ההתקן הקודם חוזר אחר כך
fn_eof		lda	DEVNUM
		pshs	a
		lbsr	devfac		; B = DEVNUM
		tstb
		beq	1F
		lbsr	chkin
		clrb
		tst	CBFCNT
		bne	1F
		decb
1		puls	a
		sta	DEVNUM
		sex
		lbra	givd

; ---------- CLOAD של קובץ ASCII (3.3) ----------
; דגל ASCII חובה (?FM). NEW, הקלטת פתוחה לקריאה, ושורה אחרי שורה כאילו הוקלדה (בלי הד). שורה בלי מספר: ?DS.
; בסוף הקובץ: סגור, ו-OK. שורה שנקטעה בסוף הקובץ הולכת לאיבוד
cl_asc		tst	HASCII
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
3		bsr	tcl1
		lds	STKTOP
		clr	,-s
		lbra	main_ok

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
		bsr	trawd		; אורך
		tfr	d,y
		bsr	trawd		; כתובת
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
; trawd: שני בתים מהקלטת → D (הגבוה קודם)
trawd		bsr	trawb
		tfr	a,b
		bsr	trawb
		exg	a,b
		rts
; trawb: בית מהקלטת. סוף הקובץ באמצע: ?IO
trawb		lbsr	tchin
		bne	eio2
		rts
eio2		lbra	err_io
