; Dragon 1982 BASIC — שלב 3, חלק 5: קלטת. צעד 2: פקודות הקבצים (CSAVE, CLOAD, CSAVEM, CLOADM, SKIPF, MOTOR).
; הכול לפי הקורא: docs/DRAGON-SPEC-TAPE.md, סעיפים 2-3 (עובדות בלבד, בלי קוד). נכתב מאפס.
; קובצי ASCII (CSAVE ,A, CLOAD של קובץ עם פערים, CLOADM עם פערים) צריכים קלט-פלט של תווים, ונבנים בצעד 3.

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
		lbne	err_fm		; ASCII עם פערים: בצעד 3
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
		lbne	err_fm		; עם פערים: בצעד 3
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
		lbsr	chkcom		; ,A: בצעד 3
		lda	#'A
		lbsr	synchk
		lbra	err_fm
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
