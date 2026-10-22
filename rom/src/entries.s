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
