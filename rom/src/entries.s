; ---------- מתאמים לכתובות הקבועות של המקור (src/islands.s, docs/DRAGON-SPEC-ENTRIES.md) ----------
; runstk: משתנים מתאפסים, והמחסנית מתחילה מחדש (סמן 0 בתחתית). חוזרים לכתובת החזרה שהייתה למעלה;
; כל השאר במחסנית הולך. X משתנה. (גם RUN, CLEAR, CLOAD; ‏$841F מוסיף לפני זה TXTPTR, קורא 8.15)
runstk		puls	x
		lbsr	runc
		lds	STKTOP
		clr	,-s
		jmp	,x
; x_adrbyt ($8E7A): כתובת (ל-LINNUM), פסיק ובית (קורא 2.2). השאר יושב ב-src/islands.s
x_adrbyt	lbsr	frmadr
		std	LINNUM
		jmp	$8e7e		; פסיק ובית (src/islands.s)
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
; x_mux ($BD41): B = מקור הצליל (0-3). ‏x_audon ($BAEC): ‏B+1, ואז הצליל דולק (קורא 8.11)
x_audon		incb
		bsr	x_mux
		lbra	sndon
x_mux		pshs	x
		tfr	b,a
		lbsr	sndsel
		puls	x,pc
