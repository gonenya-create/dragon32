; שלטי ההפניה בכתובות הקבועות של המקור (גונן, 22.10: "מאשר").
; הקובץ הזה לא נכלל ב-exp.s: הכלי tools/islands.py מכניס כל גוש לקוד, בדיוק בכתובת שלו.
; המקור לכתובות ולחוזים: docs/DRAGON-SPEC-ENTRIES.md (הקורא) ו-docs/DRAGON-RESEARCH-ERA.md (הספרים).
; כתובות צמודות (פחות מ-3 בתים) הן גוש אחד: הראשונה פקודה קצרה ש"נופלת" לבאה.

; @island $8342
; ?OM (קוד 12), ונופל לשגיאה הכללית. $8344: שגיאה עם הקוד ב-B
		ldb	#12
		jmp	error

; @island $89A4
; בדיקת תו: $89A4 ')'  $89A7 '('  $89AA ','  $89AC התו שב-B. אחרת ?SN. ‏$89B4: ‏?SN
		ldb	#')
		fcb	$8c
		ldb	#'(
		fcb	$8c
		ldb	#',
		tfr	b,a
		jmp	synchk
		fill	$ff,$89b4-*
		jmp	err_sn

; @island $8B2D
; FAC → מספר שלם עם סימן ב-D (קטיעה לכיוון אפס), ?TM למחרוזת, ?FC מחוץ לטווח
		jmp	x_intcnv

; @island $8B8A
; ‏$8B8A: ‏?BS.  $8B8D: ‏?FC
		jmp	err_bs
		jmp	err_fc

; @island $8C36
; ‏$8C36: ‏B בלי סימן → FAC.  $8C37: ‏D עם סימן → FAC (סוף של שגרת USR)
		clra
		jmp	x_givabf

; @island $9D3D
; הפסיקה של המערכת. תוכנה שמוסיפה פסיקה משלה מסיימת בקפיצה לכאן. ‏$9D46: אחרי האישור, מ-TIMER והלאה
		jmp	irq
		fill	$ff,$9d46-*
		jmp	irqtk
