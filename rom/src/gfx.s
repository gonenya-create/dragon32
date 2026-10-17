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
        cmpx #g_decision+2
        blo 1B
        lda #$a7
        sta g_magic
        lda #1
        sta g_page
        sta g_fg
        ldd #$0600
        std g_base
        std g_size
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
        stb g_px
        lda #',
        lbsr expect
        lbsr getbyte
        cmpb #191
        lbhi err_fc
        stb g_py
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
8       coma
        anda ,u
        pshs b
        ora ,s+
        sta ,u
        puls d,x,y,u,pc

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
