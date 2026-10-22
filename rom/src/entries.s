; ---------- מתאמים לכתובות הקבועות של המקור (src/islands.s, docs/DRAGON-SPEC-ENTRIES.md) ----------
; x_givabf ($8C37): D עם סימן → FAC, והתוצאה מספר (VALTYP = 0, גם אחרי USR עם מחרוזת)
x_givabf	clr	VALTYP
		lbra	givd
; x_intcnv ($8B2D): FAC → D עם סימן, קטיעה לכיוון אפס (קורא 1). ‏-32768 בדיוק מותר, השאר מחוץ לטווח ?FC.
; גם FACMO:FACLO מחזיקים את התוצאה, והדגלים לפי הבית הנמוך
x_intcnv	lbsr	chknum
		lda	FACSGN
		pshs	a
		clr	FACSGN
		lda	FACEXP
		cmpa	#144
		blo	1F
		lda	,s
		sta	FACSGN
		leax	n32768,pcr
		lbsr	fcomp
		lbne	err_fc
		clr	FACSGN
1		lbsr	qint
		ldd	FACMO
		tst	,s+
		bpl	2F
		coma
		comb
		addd	#1
2		std	FACMO
		tstb
		rts
; x_clrrun ($841F): כמו RUN בלי לרוץ: המשתנים מתאפסים, המחסנית מתחילה מחדש, TXTPTR לפני התוכנית,
; וחוזרים לכתובת החזרה שהייתה למעלה (כל השאר במחסנית הולך, כמו במקור; קורא 8.15)
x_clrrun	puls	x
		ldd	TXTTAB
		subd	#1
		std	TXTPTR
		lbsr	runc
		lds	STKTOP
		clr	,-s
		jmp	,x
; x_disp ($84ED): A = טוקן, X = טבלת כתובות: X+2A, התו הבא, ומשם לפקודה (קורא 8.2)
x_disp		tfr	a,b
		lslb
		abx
		jsr	<chrget
		jmp	[,x]
; מספרים מהטקסט (קורא 2.2): ‏$8E51 ביטוי → B (0-255), ‏$8E54 FAC → B, ‏$8E7E פסיק ואז בית,
; ‏$8E7A כתובת (ל-LINNUM), פסיק ובית. ביציאה A = התו הנוכחי. ‏$8E83 ביטוי → X (0-65535), ‏$8E86 FAC → X
x_adrbyt	lbsr	frmadr
		std	LINNUM
x_combyt	lbsr	chkcom
x_getbyt	lbsr	frmevl
x_conbyt	lbsr	conint
		jmp	<chrgot
x_getx		lbsr	frmevl
x_fac2x		lbsr	getadr
		tfr	d,x
		rts
; x_strout ($90E5): X = הכתובת שלפני המחרוזת. נגמרת ב-0 או במרכאות (קורא 2.4)
x_strout	leax	1,x
		lbsr	strlit
		lbra	strprt
; x_inch ($B50A): תו מההתקן הנוכחי. מקלדת: מחכים עם סמן מהבהב, ובסוף רווח במקום הסמן, בלי הד.
; קלטת: הבית הבא מהחוצץ, ו-EOFFLG בסוף. ‏$B505: אותו דבר בלי ביט 7. ‏$A0EA: בסוף הקובץ ?IO (קורא 8.1)
x_inch7		bsr	x_inch
		anda	#$7f
		rts
x_inch		tst	DEVNUM
		lbne	tchin
		jsr	HK_CIN
		clr	EOFFLG
		lbra	getkey
x_getdev	bsr	x_inch
		tst	EOFFLG
		lbne	err_io
		rts
; x_css ($AA10): ‏B=0 ערכה 0, אחרת ערכה 1. ‏$AA15: B כמו שהוא. מיד גם על המסך (קורא 8.12)
x_css		tstb
		beq	x_css2
		ldb	#8
x_css2		stb	GCSS
		lda	PIA1+2
		anda	#$f7
		ora	GCSS
		sta	PIA1+2
		rts
; x_mux ($BD41): B = מקור הצליל (0-3). ‏x_audon ($BAEC): ‏B+1, ואז הצליל דולק (קורא 8.11)
x_audon		incb
		bsr	x_mux
		lbra	sndon
x_mux		pshs	x
		tfr	b,a
		lbsr	sndsel
		puls	x,pc
