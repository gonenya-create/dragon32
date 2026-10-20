; Dragon 1982 BASIC — שלב 3, חלק 1: מסך הטקסט. CLS, SET, RESET (ו-POINT דרך sgxy).
; הכול לפי הקורא: docs/DRAGON-SPEC-SCREEN.md. נכתב מאפס.

; CLS: בלי מספר: רווחים ($60). 0-8: ממלאים בצבע (0 = $80, אחרת $8F + 16*(n-1)).
; 9-255: רווחים ושורה משלנו (במקור: הודעה של מיקרוסופט; גונן, 20.10: "The Dragon machine 2026"), ושתי שורות חדשות
cls_st		beq	3F
		lbsr	evbyte
		cmpb	#8
		bhi	4F
		lda	#$80
		tstb
		beq	1F
		decb
		lslb
		lslb
		lslb
		lslb
		orb	#$8f
		tfr	b,a
1		ldx	#SCREEN
2		sta	,x+
		cmpx	#SCREND
		blo	2B
		ldx	#SCREEN
		stx	CURSOR
		rts
3		lbra	cls
4		lbsr	cls
		leax	m_cls,pcr
		lbra	puts
m_cls		fcc	"THE DRAGON MACHINE 2026"
		fcb	13,13,0

; sgxy: x,y עד לפני ')' → X = כתובת התא, CELL = מסכת הנקודה. x 0-63, y 0-31, אחרת ?FC
; המסכה: 8 למעלה-שמאל, 4 למעלה-ימין, 2 למטה-שמאל, 1 למטה-ימין. התא: $0400 + 32*(y/2) + x/2
sgxy		lbsr	evbyte
		cmpb	#63
		lbhi	err_fc
		pshs	b
		lbsr	chkcom
		lbsr	evbyte
		cmpb	#31
		lbhi	err_fc
		pshs	b		; [0] = y, [1] = x
		lda	#8
		ldb	1,s
		lsrb
		bcc	1F
		lsra
1		ldb	,s
		lsrb
		bcc	2F
		lsra
		lsra
2		sta	CELL
		puls	a,b		; A = y, B = x
		lsra
		lsrb
		pshs	b
		ldb	#32
		mul
		addb	,s+
		adca	#0
		addd	#SCREEN
		tfr	d,x
		rts

; SET(x,y,c): c 0-8 חובה. תא גרפי: הנקודות הדולקות נשארות, והצבע (אם c לא 0) לכל התא.
; תא טקסט: נהיה גרפי עם הנקודה הזאת בלבד; c=0 שם = ירוק. ')' נבדק לפני הכתיבה
set_st		lbsr	chklp
		bsr	sgxy
		pshs	x
		lbsr	chkcom
		lbsr	evbyte
		cmpb	#8
		lbhi	err_fc
		pshs	b
		lbsr	chkrp
		puls	b
		puls	x
		lda	,x
		bmi	1F
		lda	CELL		; תא טקסט
		ora	#$80
		tstb
		beq	3F
		bra	2F
1		anda	#$0f		; תא גרפי: הנקודות שדולקות
		ora	CELL
		ora	#$80
		tstb
		bne	2F
		pshs	a		; צבע 0: הצבע של התא נשאר
		lda	,x
		anda	#$70
		ora	,s+
		bra	3F
2		decb			; הצבע פחות 1 בביטים 4-6
		lslb
		lslb
		lslb
		lslb
		pshs	b
		ora	,s+
3		sta	,x
		rts

; RESET(x,y): תא גרפי: רק הנקודה כבה, הצבע נשאר (המסכה ב-CELL נשארת הפוכה, כמו במקור).
; תא טקסט: $80 (גרפי, הכול כבוי)
reset_st	lbsr	chklp
		lbsr	sgxy
		pshs	x
		lbsr	chkrp
		puls	x
		lda	,x
		bmi	1F
		lda	#$80
		bra	2F
1		com	CELL
		anda	CELL
2		sta	,x
		rts
