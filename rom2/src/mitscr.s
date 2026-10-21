; Dragon 1982 BASIC — שלב 3, חלק 1: מסך הטקסט. CLS, SET, RESET (ו-POINT דרך sgxy).
; הכול לפי הקורא: docs/DRAGON-SPEC-SCREEN.md. נכתב מאפס.

; CLS עצמו (cls_st) יושב בסוף mitfunc.s, כדי לנצל את המקום שלפני $A000

; sgxy: x,y עד לפני ')' → X = כתובת התא, CELL = מסכת הנקודה. x 0-63, y 0-31, אחרת ?FC
; המסכה: 8 למעלה-שמאל, 4 למעלה-ימין, 2 למטה-שמאל, 1 למטה-ימין. התא: $0400 + 32*(y/2) + x/2
sgxyp		lbsr	chklp		; SET/RESET: '(' לפני
sgxy		lbsr	evbyte
		cmpb	#63
		lbhi	mem_fc
		pshs	b		; x
		lbsr	chkcom
		lbsr	evbyte
		cmpb	#31
sg_fc		lbhi	mem_fc		; (גם SET קופץ לכאן, עם אותם דגלים)
		lda	#8		; B = y
		lsrb			; y אי-זוגי: השורה התחתונה
		bcc	1F
		lsra
		lsra
1		lsr	,s		; x אי-זוגי: ימין
		bcc	2F
		lsra
2		sta	CELL
		lda	#32		; 32*(y/2) + x/2 (בלי נשא: x/2 עד 31)
		mul
		addb	,s+
		addd	#SCREEN
		tfr	d,x
		rts

; sgxyr: sgxy ואחריו ')' (POINT, RESET). sgrp: ')' בלבד. X נשמר; A = התא, ותא טקסט: $80 (כמו תא גרפי ריק)
sgxyr		bsr	sgxy
sgrp		pshs	x
		lbsr	chkrp
		puls	x
		lda	,x
		bmi	1F
		lda	#$80
1		rts

; SET(x,y,c): c 0-8 חובה. תא גרפי: הנקודות הדולקות נשארות, והצבע (אם c לא 0) לכל התא.
; תא טקסט: נהיה גרפי עם הנקודה הזאת בלבד; c=0 שם = ירוק. ')' נבדק לפני הכתיבה
set_st		bsr	sgxyp
		pshs	x
		lbsr	chkcom
		lbsr	evbyte
		cmpb	#8
		bhi	sg_fc
		puls	x
		bsr	sgrp		; B נשמר
		tstb
		beq	2F		; צבע 0: הצבע של התא נשאר
		anda	#$8f		; הצבע פחות 1 בביטים 4-6
		decb
		lslb
		lslb
		lslb
		lslb
		pshs	b
		ora	,s+
2		ora	CELL
		bra	rs_st

; RESET(x,y): תא גרפי: רק הנקודה כבה, הצבע נשאר (המסכה ב-CELL נשארת הפוכה, כמו במקור).
; תא טקסט: $80 (גרפי, הכול כבוי)
reset_st	lbsr	chklp
		bsr	sgxyr
		tst	,x
		bpl	rs_st
		com	CELL
		anda	CELL
rs_st		sta	,x
		rts
