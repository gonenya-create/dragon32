; Dragon 1982 BASIC: קלטת (יכתוב קודקס). בינתיים: אין
; tape_dispatch: כמו gfx_dispatch, לפקודות CSAVE CLOAD SKIPF MOTOR AUDIO. Z=1 אם טופלה
tape_dispatch	andcc	#$fb
		rts
