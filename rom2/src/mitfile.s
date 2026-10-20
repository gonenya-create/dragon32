; Dragon 1982 BASIC — שלב 3, חלק 5: קלטת. צעד 2: פקודות הקבצים (CSAVE, CLOAD, CSAVEM, CLOADM, SKIPF, MOTOR).
; הכול לפי הקורא: docs/DRAGON-SPEC-TAPE.md, סעיפים 2-3 (עובדות בלבד, בלי קוד). נכתב מאפס.
; צעד 3: ההתקנים, קובצי נתונים (OPEN, CLOSE, PRINT #, INPUT #, EOF) וקובצי ASCII (סעיפים 3.3-3.13, 4).

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
; getfn (3.1): השם מתמלא ברווחים. אם יש ביטוי: מחרוזת, וכל התווים שלה מועתקים מ-FNAME (שם ארוך גולש לחוצץ)
getfn		ldx	#FNAME
		ldd	#$2020
		std	,x
		std	2,x
		std	4,x
		std	6,x
		clr	FNLEN
		jsr	<chrgot
		beq	9F
		lbsr	frmevl
		lbsr	frestr		; לא מחרוזת: ?TM
		sta	FNLEN
		beq	9F
		ldu	#FNAME
1		ldb	,x+
		stb	,u+
		deca
		bne	1B
9		rts

; rblk: קריאת בלוק שלמה: סנכרון (מנוע + השהיה), בלוק, מנוע כבוי. התוצאה ב-B, עם הדגלים
rblk		jsr	tsync
		jsr	tblkrd
		lbsr	motoff
		ldb	BLKRES
		rts
; wblk: כתיבת בלוק שלמה: מבוא (מנוע + השהיה), בלוק, מנוע כבוי
wblk		jsr	tleader
		jsr	tblkwr
		lbra	motoff

; wrhdr: הכותרת. A = סוג הקובץ, B = הדגלים (ASCII ופערים שווים בכל סוגי השמירה). קובץ פתוח: ?AO.
; רק השם, הסוג והדגלים נכתבים; בתי הביצוע והטעינה נשארים כמו שהם (CSAVEM כותב אותם לפני)
wrhdr		tst	FSTATE
		lbne	err_ao
		sta	HTYPE
		stb	HASCII
		stb	HGAP
		ldx	#FNAME
		ldu	#TBUF
		ldb	#8
1		lda	,x+
		sta	,u+
		decb
		bne	1B
		clr	BLKTYP
		lda	#15
		sta	BLKLEN
		ldx	#TBUF
		stx	BLKADR
		bra	wblk

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
1		ldx	#TBUF
		stx	BLKADR
		lbsr	rblk
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
1		ldx	#TBUF
		stx	BLKADR
		tst	,s
		beq	2F
		lbsr	rblk
		bra	3F
2		jsr	tblkrd
3		lbne	err_io
		lda	BLKTYP
		lbeq	err_io
		inca			; $FF: הסוף
		beq	4F
		cmpa	#$82		; $01-$80: נתונים
		blo	1B
		lbra	err_io
4		leas	1,s
		lbra	motoff

; ---------- CLOAD (3.3) ----------
cload_st	clr	FSTATE		; סוגרים בכוח (מה שחיכה לכתיבה הולך לאיבוד)
		cmpa	#'M
		beq	cloadm
		leas	2,s		; CLOAD לא חוזר לתוכנית
		lbsr	getfn
		jsr	<chrgot
		lbne	err_sn
		lbsr	search
		tst	HGAP
		lbne	cl_asc
		tst	HTYPE		; רציף: רק תוכנית
		lbne	err_fm
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
		lbra	err_io

; ---------- CLOADM (3.4) ----------
cloadm		jsr	<chrget		; ה-M
		lbsr	getfn
		lbsr	search
		tst	HGAP
		lbne	clm_gap
		clra			; ההיסט (אחרי החיפוש)
		clrb
		pshs	d
		jsr	<chrgot
		beq	1F
		lbsr	chkcom
		lbsr	frmevl
		lbsr	getadr
		std	,s
1		lda	HTYPE
		cmpa	#2
		lbne	err_fm
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
		lbne	err_io
		lda	BLKTYP
		lbeq	err_io
		bpl	2B
		lbra	motoff		; ממשיכים לפקודה הבאה

; ---------- CSAVE (3.6) ----------
csave_st	cmpa	#'M
		beq	csavem
		lbsr	getfn
		jsr	<chrgot
		beq	1F
		lbsr	chkcom		; ,A
		lda	#'A
		lbsr	synchk
		lbne	err_sn
		lbra	cs_asc
1		clra			; תוכנית, בינארי, רציף
		clrb
		lbsr	wrhdr
		jsr	tleader
		ldx	TXTTAB		; מתחילת התוכנית עד VARTAB (כולל שני האפסים של הסוף)
		ldd	VARTAB
		lbra	wdata

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
		jsr	<chrgot
		lbne	err_sn
		lda	#2
		clrb
		lbsr	wrhdr
		jsr	tleader
		puls	d,x		; D = הסוף, X = ההתחלה
		addd	#1		; כולל הסוף
		lbra	wdata
cadr		lbsr	chkcom		; ,כתובת
		lbsr	frmevl
		lbra	getadr

; ---------- SKIPF (3.7) ----------
skipf_st	lbsr	getfn
		jsr	<chrgot
		lbne	err_sn
		lbsr	search
		lbra	skipfl

; ---------- MOTOR ON / OFF (3.8) ----------
motor_st	pshs	a
		jsr	<chrget
		puls	a
		cmpa	#$c2		; OFF
		lbeq	motoff
		cmpa	#$88		; ON: המנוע והשהיה; הפסיקות לא נחסמות
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
		ldd	FACMO
		pshs	a
		sex
		cmpa	,s+
		lbne	err_dn
		stb	DEVNUM
		clra			; הדגל של הקלטת
		cmpb	#$ff
		bne	2F
		coma
2		sta	SPCIO
		tstb
		beq	9F
		lbpl	err_dn
		cmpb	#$fe
		lblt	err_dn
9		rts
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
		lbeq	err_fm
		ldb	#1
1		bsr	istape
		bne	9F
		lda	FSTATE
		lbeq	err_no
		pshs	b
		cmpa	,s+
		lbne	err_fm
9		rts

; ---------- פלט תו להתקן ($A002) ----------
; chrout: A להתקן שב-DEVNUM. מסך: putc. קלטת: לחוצץ (פתוח לקריאה או סגור: נזרק); חוצץ מלא (255): קודם
; בלוק. מדפסת: בהמשך. כל האוגרים נשמרים
chrout		tst	DEVNUM
		lbeq	putc
		pshs	a,b,x,y
		bsr	istape
		bne	9F
		ldb	FSTATE
		cmpb	#2
		bne	9F
		ldb	CBFCNT
		cmpb	#255
		bne	1F
		bsr	wbuf
		clrb
1		ldx	#TBUF
		abx
		lda	,s
		sta	,x
		inc	CBFCNT
9		puls	a,b,x,y,pc
; wbuf: החוצץ כבלוק נתונים, עם מבוא ומנוע משלו
wbuf		lda	#1
		sta	BLKTYP
		ldb	CBFCNT
		stb	BLKLEN
		ldx	#TBUF
		stx	BLKADR
		lbsr	wblk
		clr	CBFCNT
		rts

; ---------- קלט תו מהקלטת ----------
; tchin: התו הבא מהחוצץ → A. חוצץ ריק: EOFFLG = $FF. כשהתו האחרון נלקח, ממלאים מיד. B ו-X נשמרים
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
9		puls	b,x,pc
; refill: הבלוק הבא של קובץ עם פערים לחוצץ. סוג 0 או שגיאה: ?IO. $80-$FF: סוף (חוצץ ריק). בלוק ריק: הבא
refill		ldx	#TBUF
		stx	CBFPTR
1		ldx	#TBUF
		stx	BLKADR
		lbsr	rblk
		lbne	err_io
		lda	BLKTYP
		lbeq	err_io
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
		tst	EOFFLG
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
2		clr	,x
		andcc	#$fe
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
		lbsr	getfn
		jsr	<chrgot
		lbne	err_sn
		lda	DEVNUM
		clr	DEVNUM
		puls	b
		cmpb	#'O
		beq	2F
		cmpb	#'I
		lbne	err_fm
		cmpa	#$fe		; "I": מדפסת ?FM, מסך כלום
		lbeq	err_fm
		inca
		bne	9F
		lbsr	search
		tst	HASCII		; רק קובץ ASCII עם פערים
		lbeq	err_fm
		tst	HGAP
		lbeq	err_fm
		lda	#1
		sta	FSTATE
		lbra	refill
2		inca			; "O": מסך ומדפסת כלום
		bne	9F
		lda	#1		; נתונים, ASCII, פערים
		ldb	#$ff
		lbsr	wrhdr
		lda	#2
		sta	FSTATE
		clr	CBFCNT
9		rts

; ---------- CLOSE [#התקן[,#התקן...]] (3.13) ----------
close_st	beq	tclose		; בלי כלום: הקלטת
1		lbsr	getdev
		lbsr	istape
		bne	2F
		bsr	tclose
2		clr	DEVNUM
		jsr	<chrgot
		beq	9F
		lbsr	chkcom
		bra	1B
9		rts
; tclose: קובץ פתוח לכתיבה: מה שנשאר בחוצץ (אם יש) ובלוק סוף, כל אחד עם מנוע ומבוא. תמיד: סגור, התקן 0
tclose		lda	FSTATE
		cmpa	#2
		bne	1F
		tst	CBFCNT
		beq	2F
		lbsr	wbuf
2		lda	#$ff
		sta	BLKTYP
		clr	BLKLEN
		lbsr	wblk
1		clr	FSTATE
		clr	DEVNUM
		rts

; ---------- EOF(התקן) (3.12) ----------
; מקלדת: 0. מדפסת: ?FM. קלטת: פתוחה לקריאה, ו-1- כשהחוצץ ריק. ההתקן הקודם חוזר אחר כך
fn_eof		lda	DEVNUM
		pshs	a
		lbsr	devfac
		clrb
		tst	DEVNUM
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

; ---------- CSAVE "שם",A (3.6) ----------
; כותרת (0, $FF, $FF), הקובץ פתוח לכתיבה, ו-LIST של כל התוכנית לקלטת. בגלל הרוחב האינסופי: CR לפני כל שורה
; ואחרי האחרונה. אחר כך הקובץ נסגר, והתוכנית (אם רצה) נגמרת
cs_asc		clra
		ldb	#$ff
		lbsr	wrhdr
		lda	#2
		sta	FSTATE
		clr	CBFCNT
		lda	#$ff
		sta	DEVNUM
		sta	SPCIO
		lda	#13
		lbsr	chrout
		ldd	#$ffff
		std	LEND
		clra
		clrb
		lbsr	dlist2
		bsr	tclose
		lds	STKTOP
		clr	,-s
		lbra	endcon

; ---------- CLOAD של קובץ ASCII (3.3) ----------
; דגל ASCII חובה (?FM). NEW, הקלטת פתוחה לקריאה, ושורה אחרי שורה כאילו הוקלדה (בלי הד). שורה בלי מספר: ?DS.
; בסוף הקובץ: סגור, ו-OK. שורה שנקטעה בסוף הקובץ הולכת לאיבוד
cl_asc		tst	HASCII
		lbeq	err_fm
		lbsr	scrtch
		lda	#$ff
		sta	DEVNUM
		sta	SPCIO
		lda	#1
		sta	FSTATE
		lbsr	refill
1		lbsr	tgetln
		bcs	3F
		ldx	#LINBUF
		lbsr	skipsp
		beq	1B		; שורה ריקה
		lbsr	isdig
		lbcc	err_ds
		lbsr	storeline
		bra	1B
3		clr	FSTATE
		clr	DEVNUM
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
		clra
		clrb
		pshs	d		; ההיסט
		jsr	<chrgot
		beq	1F
		lbsr	chkcom
		lbsr	frmevl
		lbsr	getadr
		std	,s
		jsr	<chrgot
		lbne	err_sn
1		bsr	trawb		; סוג
		pshs	a
		bsr	trawb		; אורך
		tfr	a,b
		bsr	trawb
		exg	a,b
		tfr	d,y
		bsr	trawb		; כתובת
		tfr	a,b
		bsr	trawb
		exg	a,b
		addd	1,s
		tfr	d,x
		tst	,s+
		bne	3F
2		leay	,y
		beq	1B
		bsr	trawb
		sta	,x
		cmpa	,x+
		lbne	err_io
		leay	-1,y
		bra	2B
3		stx	EXECJP
		leas	2,s
		clr	FSTATE
		clr	DEVNUM
		rts
; trawb: בית מהקלטת. סוף הקובץ באמצע: ?IO
trawb		lbsr	tchin
		tst	EOFFLG
		lbne	err_io
		rts
