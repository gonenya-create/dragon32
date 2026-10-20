; Dragon 1982 BASIC — שלב 3, חלק 1: מסך הטקסט. CLS, SET, RESET (ו-POINT דרך sgxy).
; הכול לפי הקורא: docs/DRAGON-SPEC-SCREEN.md. נכתב מאפס.

; CLS: בלי מספר: רווחים ($60). 0-8: ממלאים בצבע (0 = $80, אחרת $8F + 16*(n-1)).
; 9-255: רווחים ושורה משלנו (במקור: הודעה של מיקרוסופט; גונן, 20.10: "The Dragon machine 2026"), ושתי שורות חדשות
cls_st		lbeq	cls
		lbsr	evbyte
		pshs	b		; קודם רווחים
		lbsr	cls
		puls	b
		cmpb	#8
		bhi	4F
		lda	#16		; הצבע: 16n+$7F, ול-0: $80
		mul
		addb	#$7f
		bmi	1F
		incb
1		ldx	#SCREEN		; cls משאיר את X בסוף המסך
2		stb	,x+
		cmpx	#SCREND
		blo	2B
		rts
4		leax	m_cls,pcr
		lbra	puts
m_cls		fcc	"THE DRAGON MACHINE 2026"
		fcb	13,13,0

; sgxy: x,y עד לפני ')' → X = כתובת התא, CELL = מסכת הנקודה. x 0-63, y 0-31, אחרת ?FC
; המסכה: 8 למעלה-שמאל, 4 למעלה-ימין, 2 למטה-שמאל, 1 למטה-ימין. התא: $0400 + 32*(y/2) + x/2
sgxyp		lbsr	chklp		; SET/RESET: '(' לפני
sgxy		lbsr	evbyte
		cmpb	#63
		lbhi	err_fc
		pshs	b		; x
		lbsr	chkcom
		lbsr	evbyte
		cmpb	#31
		lbhi	err_fc
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

; SET(x,y,c): c 0-8 חובה. תא גרפי: הנקודות הדולקות נשארות, והצבע (אם c לא 0) לכל התא.
; תא טקסט: נהיה גרפי עם הנקודה הזאת בלבד; c=0 שם = ירוק. ')' נבדק לפני הכתיבה
set_st		bsr	sgxyp
		pshs	x
		lbsr	chkcom
		lbsr	evbyte
		cmpb	#8
		lbhi	err_fc
		pshs	b
		lbsr	chkrp
		puls	b,x
		lda	,x
		bmi	1F
		lda	#$80		; תא טקסט: כמו תא גרפי ריק
1		tstb
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
reset_st	bsr	sgxyp
		pshs	x
		lbsr	chkrp
		puls	x
		lda	,x
		bmi	1F
		lda	#$80
		bra	rs_st
1		com	CELL
		anda	CELL
rs_st		sta	,x
		rts
