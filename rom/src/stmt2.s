; Dragon 1982 BASIC: GOSUB RETURN ON DATA READ RESTORE DIM ומערכים (יכתוב קודקס). בינתיים: אין
; st2_dispatch: כמו gfx_dispatch. Z=1 אם הפקודה טופלה
st2_dispatch	andcc	#$fb
		rts
; arr_ref: VNAME = שם המערך, X על '('. מחזיר U = כתובת האיבר (5 בתים), X אחרי ')'
arr_ref		lbra	err_sn
