; מחסנית הבדיקות (רק לבדיקות, לא חלק מה-ROM): מקלידה את שורות הבדיקה.
; tools/xr2.mjs מפנה את ה-JMP שב-$BBE5 (סריקת המקלדת) לכאן, ומוסיף את השורות אחרי הקוד.
; כמו בתור הישן: getkey ו-INKEY$ (בזמן ריצה) מקבלים את התו הבא; בדיקת ה-BREAK מקבלת רק BREAK
; שעומד ראשון, ורק כשתוכנית רצה. בלי תווים: הסריקה האמיתית. tq_idle: getkey מחכה והתור ריק (נקודת הצילום).
; הכתובות מה-ROM מגיעות מבחוץ (asm6809 -d): KEYIDX, GKRET, BRKRET, INKRET, CURLIN
KQPTR		equ	$f8		; התו הבא (באזור הפנוי $EA-$FF, קורא)
KQCNT		equ	$fa		; כמה נשארו

		org	$c000
		fcc	"TQ"		; לא "DK": בלי הפעלה אוטומטית
tqlen		fdb	0		; xr2.mjs כותב כאן את האורך
tq_pol		pshs	b,x
		ldx	KQPTR		; 0 (ה-RAM מתאפס בהדלקה): עוד לא התחלנו
		bne	1F
		ldx	#tqdata
		stx	KQPTR
		ldx	tqlen
		stx	KQCNT
1		ldx	KQCNT
		beq	tq_real
		ldx	3,s		; מי קרא (כתובת החזרה)
		cmpx	#BRKRET
		beq	2F
		cmpx	#INKRET
		bne	tq_pop
		lda	CURLIN		; INKEY$ במצב ישיר: המקלדת
		inca
		beq	tq_real
		bra	tq_pop
2		lda	CURLIN		; בדיקת BREAK: רק BREAK, ורק כשתוכנית רצה
		inca
		beq	tq_none
		lda	[KQPTR]
		cmpa	#3
		bne	tq_none
tq_pop		ldx	KQCNT
		leax	-1,x
		stx	KQCNT
		ldx	KQPTR
		lda	,x+
		stx	KQPTR
		tsta
		puls	b,x,pc
tq_none		clra
		puls	b,x,pc
tq_real		ldx	3,s
		cmpx	#GKRET
		bne	3F
tq_idle		nop			; getkey מחכה והתור ריק: כאן הבדיקות מצלמות
3		puls	b,x
		jmp	KEYIDX
tqdata
