; גרפיקה מקורית: מצב, צבעים וציור; כל הקואורדינטות במרחב 256 על 192.
; X נשמר בפקודה לא מוכרת; בפקודה מוכרת מוחזר Z=1 ו-X אחרי הארגומנטים.
g_magic	equ	$0340
g_mode	equ	$0341
g_page	equ	$0342
g_fg	equ	$0343
g_bg	equ	$0344
g_css	equ	$0345
g_visible	equ	$0346
g_ink	equ	$0347
g_px	equ	$0348
g_py	equ	$0349
g_x0	equ	$034a
g_y0	equ	$034b
g_x1	equ	$034c
g_y1	equ	$034d
g_lastx	equ	$034e
g_lasty	equ	$034f
g_box	equ	$0350
g_tmp	equ	$0353
g_base	equ	$0358
g_size	equ	$035a
g_dx	equ	$035c
g_dy	equ	$035e
g_sx	equ	$0360
g_sy	equ	$0362
g_error	equ	$0364
g_twice	equ	$0366
g_cx	equ	$0368
g_cy	equ	$036a
g_radius	equ	$036c
g_ox	equ	$036e
g_oy	equ	$0370
g_decision	equ	$0372

gfx_dispatch
        lbsr g_init
        leau kw_g_pmode,pcr
        lbsr match
        lbeq g_pmode
        leau kw_g_pcls,pcr
        lbsr match
        lbeq g_pcls
        leau kw_g_screen,pcr
        lbsr match
        lbeq g_screen
        leau kw_g_color,pcr
        lbsr match
        lbeq g_color
        leau kw_g_pset,pcr
        lbsr match
        lbeq g_pset
        leau kw_g_preset,pcr
        lbsr match
        lbeq g_preset
        leau kw_g_line,pcr
        lbsr match
        lbeq g_line
        leau kw_g_circle,pcr
        lbsr match
        lbeq g_circle
        leau kw_g_paint,pcr
        lbsr match
        lbeq g_paint
        leau kw_g_draw,pcr
        lbsr match
        lbeq g_draw
        leau kw_g_get,pcr
        lbsr match
        lbeq g_get
        leau kw_g_put,pcr
        lbsr match
        lbeq g_put
        leau kw_g_pcopy,pcr
        lbsr match
        lbeq g_pcopy
        leau kw_g_reset,pcr
        lbsr match
        lbeq g_reset
        leau kw_g_set,pcr
        lbsr match
        lbeq g_set
        andcc #$fb
        rts
g_done  orcc #4
        rts

g_init  lda g_magic
        cmpa #$a7
        beq g_inited
        pshs x
        ldx #g_magic
1       clr ,x+
        cmpx #$0380
        blo 1B
        lda #$a7
        sta g_magic
        lda #1
        sta g_page
        sta g_fg
        ldd #$0600
        std g_base
        std g_size
        lda #4
        sta g_scale
        puls x
g_inited rts

; חזרה לטקסט אינה משנה את מצב הציור הנבחר.
gfx_text
        lbsr g_init
        clr g_visible
        lda PIA1+2
        anda #7
        sta PIA1+2
        clrb
        lbsr g_sam_mode
        ldb #2
        lbra g_offset

; B מכיל את שלושת ביטי V של SAM.
g_sam_mode
        pshs x
        ldx #SAM
        lda #3
1       lsrb
        bcc 2F
        sta 1,x
        bra 3F
2       sta ,x
3       leax 2,x
        deca
        bne 1B
        puls x,pc
; B מכיל כתובת תצוגה ביחידות 512 בתים.
g_offset
        pshs x
        ldx #SAM+6
        lda #7
1       lsrb
        bcc 2F
        sta 1,x
        bra 3F
2       sta ,x
3       leax 2,x
        deca
        bne 1B
        puls x,pc

g_show  lda g_visible
        beq g_show_done
        pshs x
        ldx #g_vdg
        ldb g_mode
        lda b,x
        ldb g_css
        beq 1F
        ora #8
1       pshs a
        lda PIA1+2
        anda #7
        ora ,s+
        sta PIA1+2
        ldx #g_sam
        ldb g_mode
        ldb b,x
        lbsr g_sam_mode
        lda g_base
        lsra
        tfr a,b
        lbsr g_offset
        puls x
g_show_done rts
; PMODE 0,1,2,3,4: RG2,CG3,RG3,CG6,RG6.
g_vdg   fcb $b0,$c0,$d0,$e0,$f0
g_sam   fcb 3,4,5,6,6
g_sizes fdb 1536,3072,3072,6144,6144

g_pmode lbsr getbyte
        cmpb #4
        lbhi err_fc
        pshs b
        lbsr skipsp
        cmpa #',
        bne 1F
        leax 1,x
        lbsr getbyte
        tstb
        lbeq err_fc
        cmpb #4
        lbhi err_fc
        stb g_page
1       puls b
        stb g_mode
        pshs x
        ldx #g_sizes
        lslb
        ldd b,x
        std g_size
        lda g_page
        ldb #6
        mul
        tfr b,a
        clrb
        std g_base
        puls x
        lbsr g_show
        lbra g_done

g_screen lbsr getbyte
        cmpb #1
        lbhi err_fc
        pshs b
        lda #',
        lbsr expect
        lbsr getbyte
        cmpb #1
        lbhi err_fc
        stb g_css
        puls b
        stb g_visible
        beq 1F
        lbsr g_show
        lbra g_done
1       lbsr gfx_text
        tst g_css
        beq 2F
        lda PIA1+2
        ora #8
        sta PIA1+2
2       lbra g_done

; צבע חיצוני ב-B הופך לצבע ארוז לפי המצב.
g_colour
        lda g_mode
        bita #1
        beq 1F
        tstb
        lbeq err_fc
        cmpb #4
        lbhi err_fc
        decb
        rts
1       cmpb #1
        lbhi err_fc
        rts

g_color lbsr getbyte
        lbsr g_colour
        stb g_fg
        lbsr skipsp
        cmpa #',
        bne 1F
        leax 1,x
        lbsr getbyte
        lbsr g_colour
        stb g_bg
1       lbra g_done

g_pcls  ldb g_bg
        stb g_ink
        lbsr skipsp
        beq 1F
        cmpa #':                ; PCLS בלי צבע ואחריו פקודה נוספת (Claude)
        beq 1F
        lbsr getbyte
        lbsr g_colour
        stb g_ink
1       ldb g_ink
        lda g_mode
        bita #1
        bne 2F
        tstb
        beq 3F
        ldb #$ff
        bra 3F
2       lda #$55
        mul
3       pshs x
        ldx g_base
        ; אורך המסך נשמר בנפרד מהצבע.
        ldu g_size
4       stb ,x+
        leau -1,u
        cmpu #0
        bne 4B
        puls x
        lbra g_done

; קריאת זוג קואורדינטות לתוך px,py.
g_pair  lda #'(
        lbsr expect
        lbsr getbyte
        pshs b
        lda #',
        lbsr expect
        lbsr getbyte
        cmpb #191
        lbhi err_fc
        stb g_py
        puls b
        stb g_px
        rts
g_close lda #')
        lbra expect

g_pset  lbsr g_pair
        ldb g_fg
        stb g_ink
        lbsr skipsp
        cmpa #',
        bne 1F
        leax 1,x
        lbsr getbyte
        lbsr g_colour
        stb g_ink
1       lbsr g_close
        lbsr g_remember
        lbsr g_pixel
        lbra g_done
g_preset lbsr g_pair
        lbsr g_close
        ldb g_bg
        stb g_ink
        lbsr g_remember
        lbsr g_pixel
        lbra g_done
g_remember ldd g_px
        std g_lastx
        rts

; כתיבת פיקסל, בלי לפגוע במצביע הטקסט או במשתני האלגוריתם.
g_pixel pshs d,x,y,u
        lbsr g_location
        coma
        anda ,u
        pshs b
        ora ,s+
        sta ,u
        puls d,x,y,u,pc

; מחזיר מסכה ב-A ונתוני צבע ב-B, כתובת ב-U.
g_location
        ldb g_py
        lda g_mode
        cmpa #2
        bhs 1F
        lsrb
1       lda g_mode
        beq 5F
        cmpa #2
        beq 5F
        lda #32
        bra 2F
5       lda #16
2       mul
        addd g_base
        tfr d,u
        ldb g_px
        lda g_mode
        cmpa #4
        beq 3F
        lsrb
3       lda g_mode
        bita #1
        bne 4F
        tfr b,a
        anda #7
        sta g_tmp
        lsrb
        lsrb
        lsrb
        leau b,u
        lda #$80
        ldb #0
        tst g_ink
        beq 6F
        ldb #$80
        bra 6F
4       tfr b,a
        anda #3
        sta g_tmp
        lsrb
        lsrb
        leau b,u
        lda #$c0
        ldb g_ink
        lslb
        lslb
        lslb
        lslb
        lslb
        lslb
        asl g_tmp
6       tst g_tmp
        beq 8F
7       lsra
        lsrb
        dec g_tmp
        bne 7B
8       rts

; קריאת צבע פנימי, בלי לשנות את מצביע הקלט.
g_read pshs a,x,y,u
        lbsr g_location
        tfr a,b
        andb ,u
1       bita #1
        bne 2F
        lsra
        lsrb
        bra 1B
2       puls a,x,y,u,pc

; קו ברזנהם במרחב הלוגי, כולל שני הקצוות.
g_line  lbsr skipsp
        cmpa #'-
        beq 1F
        lbsr g_pair
        lbsr g_close
        ldd g_px
        std g_x0
        bra 2F
1       ldd g_lastx
        std g_x0
2       lda #'-
        lbsr expect
        lbsr g_pair
        lbsr g_close
        ldd g_px
        std g_x1
        lbsr g_remember
        lda #',
        lbsr expect
        leau kw_g_pset,pcr
        lbsr skipsp
        lbsr match
        bne 3F
        lda g_fg
        bra 4F
3       leau kw_g_preset,pcr
        lbsr match
        lbne err_sn
        lda g_bg
4       sta g_ink
        clr g_box
        lbsr skipsp
        cmpa #',
        bne 6F
        leax 1,x
        lda #'B
        lbsr expect
        inc g_box
        lbsr skipsp
        cmpa #'F
        bne 6F
        leax 1,x
        inc g_box
6       tst g_box
        lbne g_rectangle
        lbsr g_drawline
        lbra g_done

g_drawline
        clra
        ldb g_x1
        subb g_x0
        sbca #0
        ldy #1
        cmpd #0
        bpl 1F
        coma
        comb
        addd #1
        ldy #$ffff
1       std g_dx
        sty g_sx
        clra
        ldb g_y1
        subb g_y0
        sbca #0
        ldy #1
        cmpd #0
        bpl 2F
        coma
        comb
        addd #1
        ldy #$ffff
2       sty g_sy
        coma
        comb
        addd #1
        std g_dy
        addd g_dx
        std g_error
3       ldd g_x0
        std g_px
        lbsr g_pixel
        ldd g_x0
        cmpd g_x1
        beq 9F
        ldd g_error
        lslb
        rola
        std g_twice
        cmpd g_dy
        blt 4F
        ldd g_error
        addd g_dy
        std g_error
        ldb g_x0
        addb g_sx+1
        stb g_x0
4       ldd g_twice
        cmpd g_dx
        bgt 3B
        ldd g_error
        addd g_dx
        std g_error
        ldb g_y0
        addb g_sy+1
        stb g_y0
        bra 3B
9       rts

; מלבן: מיון הקצוות וציור מסגרת או מילוי.
g_rectangle
        lda g_x0
        cmpa g_x1
        bls 1F
        ldb g_x1
        sta g_x1
        stb g_x0
1       lda g_y0
        cmpa g_y1
        bls 2F
        ldb g_y1
        sta g_y1
        stb g_y0
2       ldd g_x0
        std g_px
3       lda g_box
        cmpa #2
        beq 4F
        lda g_px
        cmpa g_x0
        beq 4F
        cmpa g_x1
        beq 4F
        lda g_py
        cmpa g_y0
        beq 4F
        cmpa g_y1
        bne 5F
4       lbsr g_pixel
5       lda g_px
        cmpa g_x1
        beq 6F
        inc g_px
        bra 3B
6       lda g_py
        cmpa g_y1
        lbeq g_done
        inc g_py
        lda g_x0
        sta g_px
        bra 3B

; מעגל אמצע עם חיתוך בקצות המסך.
g_circle
        lbsr g_pair
        lbsr g_close
        clra
        ldb g_px
        std g_cx
        ldb g_py
        std g_cy
        lda #',
        lbsr expect
        lbsr getbyte
        std g_radius
        std g_oy
        ldd #0
        std g_ox
        ldd #1
        subd g_radius
        std g_decision
        lda g_fg
        sta g_ink
        lbsr skipsp
        cmpa #',
        bne 1F
        leax 1,x
        lbsr getbyte
        lbsr g_colour
        stb g_ink
1       lbsr g_octants
        ldd g_ox
        addd #1
        std g_ox
        ldd g_decision
        bpl 2F
        ldd g_ox
        lslb
        rola
        addd #1
        addd g_decision
        std g_decision
        bra 3F
2       ldd g_oy
        subd #1
        std g_oy
        ldd g_ox
        subd g_oy
        lslb
        rola
        addd #1
        addd g_decision
        std g_decision
3       ldd g_ox
        cmpd g_oy
        ble 1B
        lbra g_done

g_clip  tsta
        bne 1F
        stb g_px
        tfr y,d
        tsta
        bne 1F
        cmpb #191
        bhi 1F
        stb g_py
        lbsr g_pixel
1       rts

g_octants
        ldd g_cy
        addd g_oy
        tfr d,y
        ldd g_cx
        addd g_ox
        lbsr g_clip
        ldd g_cy
        addd g_oy
        tfr d,y
        ldd g_cx
        subd g_ox
        lbsr g_clip
        ldd g_cy
        subd g_oy
        tfr d,y
        ldd g_cx
        addd g_ox
        lbsr g_clip
        ldd g_cy
        subd g_oy
        tfr d,y
        ldd g_cx
        subd g_ox
        lbsr g_clip
        ldd g_cy
        addd g_ox
        tfr d,y
        ldd g_cx
        addd g_oy
        lbsr g_clip
        ldd g_cy
        addd g_ox
        tfr d,y
        ldd g_cx
        subd g_oy
        lbsr g_clip
        ldd g_cy
        subd g_ox
        tfr d,y
        ldd g_cx
        addd g_oy
        lbsr g_clip
        ldd g_cy
        subd g_ox
        tfr d,y
        ldd g_cx
        subd g_oy
        lbsr g_clip
        rts
kw_g_pmode fcc "PMODE"
        fcb 0
kw_g_pcls fcc "PCLS"
        fcb 0
kw_g_screen fcc "SCREEN"
        fcb 0
kw_g_color fcc "COLOR"
        fcb 0
kw_g_pset fcc "PSET"
        fcb 0
kw_g_preset fcc "PRESET"
        fcb 0
kw_g_line fcc "LINE"
        fcb 0
kw_g_circle fcc "CIRCLE"
        fcb 0

; שטח נוסף; אותם בתים משמשים פקודות שאינן רצות במקביל.
g_qbase equ $0374
g_qtop equ $0376
g_limit equ $0378
g_bits equ $037a
g_border equ $037c
g_scale equ $037d
g_angle equ $037e
g_flags equ $037f

; פונקציות מספריות: בהחמצה X נשמר ו-Z כבוי.
gfx_fn  lbsr g_init
        leau kw_g_ppoint,pcr
        lbsr g_fnword
        beq g_ppoint
        leau kw_g_point,pcr
        lbsr g_fnword
        beq g_point
        andcc #$fb
        rts
g_fnword pshs x
        lbsr match
        bne 3F
        lda ,x
        cmpa #'$
        beq 3F
        cmpa #'0
        blo 2F
        cmpa #'9
        bls 3F
        cmpa #'A
        blo 2F
        cmpa #'Z
        bls 3F
2       leas 2,s
        orcc #4
        rts
3       puls x
        andcc #$fb
        rts
g_ppoint lbsr g_pair
        lbsr g_close
        lbsr g_read
        lda g_mode
        bita #1
        beq 1F
        incb
1       clra
        lbsr givd
        clr VALTYP
        lbra g_done
g_point lbsr g_textpair
        lbsr g_close
        lbsr g_cell
        lda ,u
        bpl 2F
        bita g_box
        beq 1F
        anda #$70
        lsra
        lsra
        lsra
        lsra
        inca
        tfr a,b
        bra 3F
1       clrb
3       clra
        bra 4F
2       ldd #$ffff
4       lbsr givd
        clr VALTYP
        lbra g_done

; ארבעה רבעים: שמאל עליון ביט 3, ימין עליון ביט 2.
g_textpair lbsr g_pair
        ldb g_px
        cmpb #63
        lbhi err_fc
        ldb g_py
        cmpb #31
        lbhi err_fc
        rts
g_cell pshs d,x
        ldb g_py
        lsrb
        lda #32
        mul
        addd #$0400
        tfr d,u
        ldb g_px
        lsrb
        leau b,u
        lda #8
        ldb g_px
        bitb #1
        beq 1F
        lsra
1       ldb g_py
        bitb #1
        beq 2F
        lsra
        lsra
2       sta g_box
        puls d,x,pc
g_set   lbsr g_textpair
        lda #',
        lbsr expect
        lbsr getbyte
        cmpb #8
        lbhi err_fc
        stb g_ink
        lbsr g_close
        lbsr g_cell
        tst g_ink
        beq g_cellreset
        lda ,u
        bmi 1F
        clra
1       anda #15
        ora g_box
        pshs a
        ldb g_ink
        decb
        lslb
        lslb
        lslb
        lslb
        orb #$80
        orb ,s+
        stb ,u
        lbra g_done
g_reset lbsr g_textpair
        lbsr g_close
        lbsr g_cell
g_cellreset lda ,u
        bmi 1F
        lda #$80
1       pshs a
        lda g_box
        coma
        anda ,s+
        sta ,u
        lbra g_done

; עמוד העתקה הוא תמיד 1536 בתים, ללא תלות במצב.
g_pageaddr lbsr getbyte
        tstb
        lbeq err_fc
        cmpb #4
        lbhi err_fc
        lda #6
        mul
        tfr b,a
        clrb
        rts
g_pcopy lbsr g_pageaddr
        pshs d
        lbsr skipsp
        leau kw_g_to,pcr
        lbsr match
        lbne err_sn
        lbsr g_pageaddr
        tfr d,y
        puls u
        pshs x
        ldx #1536
1       lda ,u+
        sta ,y+
        leax -1,x
        bne 1B
        puls x
        lbra g_done

; הצפה: מפת ביקור ומחסנית מקטעים בזיכרון הפנוי, בלי רקורסיה.
g_paint lbsr g_pair
        lbsr g_close
        lda g_fg
        sta g_ink
        lbsr skipsp
        cmpa #',
        bne 1F
        leax 1,x
        lbsr getbyte
        lbsr g_colour
        stb g_ink
1       lda g_fg
        sta g_border
        lbsr skipsp
        cmpa #',
        bne 2F
        leax 1,x
        lbsr getbyte
        lbsr g_colour
        stb g_border
2       pshs x
        ldd ARYEND
        cmpd #$3000
        bhs 3F
        ldd #$3000
3       std g_bits
        addd #6144
        lbcs err_om
        std g_qbase
        std g_qtop
        addd #3
        cmpd STRFREE
        lbhi err_om
        ldd STRFREE
        std g_limit
        ldx g_bits
4       clr ,x+
        cmpx g_qbase
        blo 4B
        lda #1
        sta g_sx+1
        sta g_sy+1
        lda g_mode
        cmpa #4
        beq 5F
        inc g_sx+1
        lda g_px
        anda #$fe
        sta g_px
5       lda g_mode
        cmpa #2
        bhs 6F
        inc g_sy+1
        lda g_py
        anda #$fe
        sta g_py
6       lbsr g_seed
7       ldu g_qtop
        cmpu g_qbase
        beq g_paintdone
        lda ,-u
        sta g_radius
        lda ,-u
        sta g_cy
        lda ,-u
        sta g_cx
        stu g_qtop
        lda g_radius
        suba g_sy+1
        bcs 9F
        sta g_oy
        lbsr g_adjacent
9       lda g_radius
        adda g_sy+1
        cmpa #192
        bhs 7B
        sta g_oy
        lbsr g_adjacent
        bra 7B
g_paintdone puls x
        lbra g_done
g_adjacent lda g_cx
        sta g_ox
1       lda g_ox
        sta g_px
        lda g_oy
        sta g_py
        lbsr g_seed
        lda g_ox
        cmpa g_cy
        beq 2F
        adda g_sx+1
        sta g_ox
        bra 1B
2       rts
; ביקור: Z=1 אם הנקודה כבר בוקרה או בצבע הגבול.
g_visit pshs a,x,y,u
        lda g_py
        ldb #32
        mul
        addd g_bits
        tfr d,u
        ldb g_px
        lsrb
        lsrb
        lsrb
        leau b,u
        ldb g_px
        andb #7
        lda #$80
1       tstb
        beq 2F
        lsra
        decb
        bra 1B
2       bita ,u
        bne 3F
        pshs a
        lbsr g_read
        cmpb g_border
        puls a
        beq 3F
        ora ,u
        sta ,u
        lbsr g_pixel
        andcc #$fb
        puls a,x,y,u,pc
3       orcc #4
        puls a,x,y,u,pc
; מקטע מתרחב לשני הצדדים ונכנס למחסנית בשלושה בתים.
g_seed  lbsr g_visit
        beq 9F
        lda g_px
        sta g_x0
        sta g_x1
1       lda g_px
        suba g_sx+1
        bcs 2F
        sta g_px
        lbsr g_visit
        beq 2F
        lda g_px
        sta g_x0
        bra 1B
2       lda g_x1
        sta g_px
3       lda g_px
        adda g_sx+1
        bcs 4F
        sta g_px
        lbsr g_visit
        beq 4F
        lda g_px
        sta g_x1
        bra 3B
4       ldu g_qtop
        leau 3,u
        cmpu g_limit
        lbhi err_om
        ldd g_x0
        sta -3,u
        lda g_x1
        sta -2,u
        lda g_py
        sta -1,u
        stu g_qtop
9       rts

kw_g_paint fcc "PAINT"
        fcb 0
kw_g_draw fcc "DRAW"
        fcb 0
kw_g_get fcc "GET"
        fcb 0
kw_g_put fcc "PUT"
        fcb 0
kw_g_pcopy fcc "PCOPY"
        fcb 0
kw_g_set fcc "SET"
        fcb 0
kw_g_reset fcc "RESET"
        fcb 0
kw_g_ppoint fcc "PPOINT"
        fcb 0
kw_g_point fcc "POINT"
        fcb 0
kw_g_to fcc "TO"
        fcb 0

; מלבן משתמש בבתים גולמיים בתוך איברי המערך המספרי.
g_get   clr g_flags
        bra g_transfer
g_put   lda #1
        sta g_flags
g_transfer lbsr g_pair
        lbsr g_close
        ldd g_px
        std g_x0
        lda #'-
        lbsr expect
        lbsr g_pair
        lbsr g_close
        ldd g_px
        std g_x1
        lda g_x1
        cmpa g_x0
        lblo err_fc
        lda g_y1
        cmpa g_y0
        lblo err_fc
        lda #',
        lbsr expect
        lbsr g_array
        stu g_qtop
        ; מעבר על פיקסלים פיזיים מונע היפוך כפול במצבים מוקטנים.
        lda #1
        sta g_sx+1
        sta g_sy+1
        lda g_mode
        cmpa #4
        beq 4F
        inc g_sx+1
        lda g_x0
        anda #$fe
        sta g_x0
        lda g_x1
        anda #$fe
        sta g_x1
4       lda g_mode
        cmpa #2
        bhs 5F
        inc g_sy+1
        lda g_y0
        anda #$fe
        sta g_y0
        lda g_y1
        anda #$fe
        sta g_y1
5       clra
        ldb g_x1
        subb g_x0
        lda g_mode
        cmpa #4
        beq 7F
        lsrb
7       clra
        addd #1
        std g_dx
        ldb g_y1
        subb g_y0
        lda g_mode
        cmpa #2
        bhs 8F
        lsrb
8       clra
        addd #1
        std g_dy
        ldd #0
6       addd g_dx
        lbcs err_fc
        dec g_dy+1
        bne 6B
        addd g_qtop
        lbcs err_fc
        cmpd g_limit
        lbhi err_fc
        clr g_box
        tst g_flags
        beq 9F
        lbsr skipsp
        cmpa #',
        bne 9F
        leax 1,x
        lbsr skipsp
        leau kw_g_pset,pcr
        lbsr match
        beq 9F
        inc g_box
        leau kw_g_preset,pcr
        lbsr match
        beq 9F
        inc g_box
        leau kw_g_and,pcr
        lbsr match
        beq 9F
        inc g_box
        leau kw_g_or,pcr
        lbsr match
        beq 9F
        inc g_box
        leau kw_g_not,pcr
        lbsr match
        lbne err_sn
9       ldd g_x0
        std g_px
        ldu g_qtop
g_transferloop tst g_flags
        bne 1F
        lbsr g_read
        stb ,u+
        bra 6F
1       ldb ,u+
        stb g_ink
        lda g_box
        beq 5F
        cmpa #1
        beq 4F
        cmpa #4
        bne 10F
        lbsr g_read
        stb g_ink
        bra 4F
10      lbsr g_read
        lda g_box
        cmpa #2
        bne 3F
        andb g_ink
        bra 2F
3       orb g_ink
2       stb g_ink
        bra 5F
4       com g_ink
5       lda g_mode
        bita #1
        beq 7F
        lda #3
        bra 8F
7       lda #1
8       anda g_ink
        sta g_ink
        lbsr g_pixel
6       lda g_px
        cmpa g_x1
        beq 9F
        adda g_sx+1
        sta g_px
        bra g_transferloop
9       lda g_py
        cmpa g_y1
        lbeq g_done
        adda g_sy+1
        sta g_py
        lda g_x0
        sta g_px
        bra g_transferloop
; שם מערך קיים בלבד; בדיקה לפני arr_ref מונעת הקצאה אוטומטית.
g_array lbsr skipsp
        cmpa #'A
        lblo err_sn
        cmpa #'Z
        lbhi err_sn
        sta VNAME
        clr VNAME+1
        leax 1,x
        lbsr g_namechar
        bne 2F
        sta VNAME+1
1       leax 1,x
        lbsr g_namechar
        beq 1B
2       lbsr skipsp
        cmpa #'(
        lbeq err_sn
        cmpa #'$
        lbeq err_tm
        ldu VARTOP
3       cmpu ARYEND
        lbhs err_fc
        ldd ,u
        cmpd VNAME
        beq 4F
        ldd 2,u
        leau d,u
        bra 3B
4       ldd 2,u
        leay d,u
        sty g_limit
        ; אינדקס אפס זמני קורא את אותה כתובת נתונים דרך ממשק המערכים.
        lda 4,u
        pshs x
        ldx #g_cx
        ldd #$2830
        std ,x
        lda 4,u
        cmpa #2
        bne 5F
        ldd #$2c30
        std 2,x
        lda #')
        sta 4,x
        clr 5,x
        bra 6F
5       lda #')
        sta 2,x
        clr 3,x
6       lbsr arr_ref
        puls x,pc
; Z=1 לאות או ספרה, בלי להזיז את הקלט.
g_namechar lda ,x
        cmpa #'0
        blo 1F
        cmpa #'9
        bls 2F
        cmpa #'A
        blo 1F
        cmpa #'Z
        bls 2F
1       andcc #$fb
        rts
2       orcc #4
        rts
kw_g_and fcc "AND"
        fcb 0
kw_g_or fcc "OR"
        fcb 0
kw_g_not fcc "NOT"
        fcb 0

; שפת הציור נקראת ישירות מהמחרוזת, ללא שינוי שלה.
g_draw  lbsr strexpr
        pshs x
        ldx SPTR
        clra
        ldb SLEN
        leau d,x
        stu g_limit
        clr g_flags
g_drawnext cmpx g_limit
        lbhs g_drawdone
        lda ,x+
        cmpa #$20
        beq g_drawnext
        cmpa #';
        beq g_drawnext
        anda #$df
        cmpa #'B
        beq g_drawblank
        cmpa #'N
        beq g_drawreturn
        cmpa #'C
        beq g_drawcolour
        cmpa #'S
        beq g_drawscale
        cmpa #'A
        lbeq g_drawangle
        cmpa #'M
        lbeq g_drawmove
        sta g_box
        leau g_directions,pcr
1       cmpa ,u
        beq 2F
        leau 3,u
        tst ,u
        bne 1B
        lbra err_sn
2       pshs u
        lbsr g_drawnumber
        tst g_border
        lbne err_fc
        ; מספר צעדים כפול קנה המידה, ביחידות רבע.
        lda g_scale
        mul
        lsra
        rorb
        lsra
        rorb
        std g_twice
        puls u
        lda 1,u
        lbsr g_drawcomponent
        std g_dx
        lda 2,u
        lbsr g_drawcomponent
        std g_dy
        lbra g_drawrelative
g_drawblank lda g_flags
        ora #1
        sta g_flags
        lbra g_drawnext
g_drawreturn lda g_flags
        ora #2
        sta g_flags
        lbra g_drawnext
g_drawcolour lbsr g_drawrequired
        tst g_border
        lbne err_fc
        lbsr g_colour
        stb g_fg
        lbra g_drawnext
g_drawscale lbsr g_drawrequired
        tst g_border
        lbne err_fc
        tstb
        lbeq err_fc
        cmpb #62
        lbhi err_fc
        stb g_scale
        lbra g_drawnext
g_drawangle lbsr g_drawrequired
        tst g_border
        lbne err_fc
        cmpb #3
        lbhi err_fc
        stb g_angle
        lbra g_drawnext
; רכיב כיוון כפול אורך מחושב.
g_drawcomponent tsta
        beq 1F
        bmi 2F
        ldd g_twice
        rts
1       ldd #0
        rts
2       ldd #0
        subd g_twice
        rts
; מספר עשרוני קטן; אורך חסר הוא אחד.
g_drawrequired lbsr g_drawnumber
        tst g_tmp
        lbeq err_sn
        rts
g_drawnumber clr g_border
        clr g_tmp
1       cmpx g_limit
        bhs 7F
        lda ,x
        cmpa #$20
        bne 2F
        leax 1,x
        bra 1B
2       cmpa #'+
        beq 3F
        cmpa #'-
        bne 4F
        inc g_border
3       leax 1,x
4       ldd #0
        clr g_tmp
5       cmpx g_limit
        bhs 6F
        lda ,x
        cmpa #'0
        blo 6F
        cmpa #'9
        bhi 6F
        suba #'0
        pshs a
        lda #10
        mul
        tsta
        lbne err_fc
        addb ,s+
        lbcs err_fc
        leax 1,x
        inc g_tmp
        bra 5B
6       tst g_tmp
        bne 8F
7       ldb #1
8       clra
        tst g_border
        beq 9F
        coma
        comb
        addd #1
9       rts
g_drawmove lbsr g_drawspaces
        lda ,x
        cmpa #'+
        beq 1F
        cmpa #'-
        beq 1F
        clr g_box
        bra 2F
1       lda #1
        sta g_box
2       lbsr g_drawrequired
        std g_dx
        lbsr g_drawspaces
        lda #',
        lbsr expect
        lbsr g_drawrequired
        std g_dy
        tst g_box
        beq g_drawabsolute
        ; מעבר יחסי כפוף לקנה המידה ולזווית.
        ldd g_dx
        lbsr g_drawscalevalue
        std g_dx
        ldd g_dy
        lbsr g_drawscalevalue
        std g_dy
g_drawrelative lda g_angle
        sta g_tmp
1       tst g_tmp
        beq 2F
        ldd g_dx
        pshs d
        ldd g_dy
        std g_dx
        ldd #0
        subd ,s++
        std g_dy
        dec g_tmp
        bra 1B
2       clra
        ldb g_lastx
        addd g_dx
        std g_dx
        clra
        ldb g_lasty
        addd g_dy
        std g_dy
g_drawabsolute ldd g_dx
        bpl 1F
        ldd #0
1       cmpd #255
        bls 2F
        ldd #255
2       stb g_x1
        ldd g_dy
        bpl 3F
        ldd #0
3       cmpd #191
        bls 4F
        ldd #191
4       stb g_y1
        ldd g_lastx
        std g_x0
        std g_cx
        lda g_fg
        sta g_ink
        lda g_flags
        bita #1
        bne 5F
        lbsr g_drawline
5       lda g_flags
        bita #2
        bne 6F
        ldd g_x1
        std g_lastx
6       clr g_flags
        lbra g_drawnext
g_drawscalevalue pshs a
        tsta
        bpl 1F
        coma
        comb
        addd #1
1       tsta
        lbne err_fc
        lda g_scale
        mul
        lsra
        rorb
        lsra
        rorb
        tst ,s+
        bpl 2F
        coma
        comb
        addd #1
2       rts
g_drawspaces cmpx g_limit
        lbhs err_sn
        lda ,x
        cmpa #$20
        bne 1F
        leax 1,x
        bra g_drawspaces
1       rts
g_drawdone puls x
        lbra g_done
g_directions fcb 'U,0,-1,'D,0,1,'L,-1,0,'R,1,0
        fcb 'E,1,-1,'F,1,1,'G,-1,1,'H,-1,-1,0
