; Dragon 1982 BASIC — שלב 3, חלק 4: צליל (SOUND, AUDIO; PLAY בהמשך).
; הכול לפי הקורא: docs/DRAGON-SPEC-SOUND.md (עובדות בלבד, בלי קוד). נכתב מאפס.

SNDFRQ		equ	$8c		; SOUND: הטון האחרון (קורא 0.1)
SNDTMR		equ	$8d		; 2 בתים: כמה שדות נשארו (השעון מוריד)

; ---------- עזרים (קורא 4) ----------
; sndsel: A = מקור הצליל (0 = DAC, 1 = קלטת). ביט 0 ל-SEL1 ($FF01 ביט 3) קודם, ואחריו ביט 1 ל-SEL2
; ($FF03 ביט 3). כל כתיבה משנה רק את ביט 3
sndsel		ldx	#PIA0+1
		bsr	1F
		ldx	#PIA0+3
1		ldb	,x
		andb	#$f7
		lsra
		bcc	2F
		orb	#8
2		stb	,x
		rts
; sndon / sndoff: ביט 3 של $FF23 (הצליל לטלוויזיה). B משתנה
sndon		ldb	PIA1+3
		orb	#8
		bra	1F
sndoff		ldb	PIA1+3
		andb	#$f7
1		stb	PIA1+3
		rts
; motoff: מנוע הקלטת כבוי ($FF21 ביט 3), והפסיקות פתוחות (קורא 3, 1.1: גם בכל שגיאה)
motoff		lda	PIA1+1
		anda	#$f7
		sta	PIA1+1
		andcc	#$af
		rts

; evnzb: ביטוי → B בין 1 ל-255. שלילי, 0 או מעל 255: ?FC. השבר נחתך (קורא 1.1)
evnzb		lbsr	evbyte
		tstb
		lbeq	err_fc
		rts

; ---------- SOUND טון,משך (קורא 1) ----------
sound_st	bsr	evnzb
		stb	SNDFRQ		; נשמר מיד, גם אם המשך שגוי
		lbsr	chkcom
		bsr	evnzb
; sound2: כניסה שנייה (קורא 1.6): B = המשך, הטון כבר ב-$8C
sound2		clra
		lslb			; 4 שדות לכל יחידה
		rola
		lslb
		rola
		std	SNDTMR
		lda	PIA0+3		; פסיקת השדה פתוחה
		ora	#1
		sta	PIA0+3
		clra			; DAC
		bsr	sndsel
		bsr	sndon
; הגל: מרכז, למעלה, מרכז, למטה. בין כתיבה לכתיבה 23+5N מחזורים (N = 256 פחות הטון), ואחרי הכתיבה
; התחתונה 31+5N, כולל בדיקת הזמן. סך הכול 100+20N (קורא 1.3)
1		lda	#$7c
		bsr	sseg
		lda	#$fc
		bsr	sseg
		lda	#$7c
		bsr	sseg
		clra
		bsr	sseg
		ldd	SNDTMR
		bne	1B
		bra	sndoff		; הבוררים נשארים על DAC, ו-$FF20 על 0
sseg		sta	PIA1
		ldb	SNDFRQ
1		incb
		bne	1B
		rts

; ---------- AUDIO ON / OFF (קורא 3) ----------
audio_st	pshs	a		; המילה שאחרי AUDIO נקראת קודם
		jsr	<chrget
		puls	a
		cmpa	#$c2		; OFF: רק מכבים. הבוררים לא משתנים
		beq	sndoff
		cmpa	#$88		; ON
		lbne	err_sn
		lda	#1		; כניסת הקלטת
		lbsr	sndsel
		bra	sndon
