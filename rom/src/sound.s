; צליל מקורי: דגימות קבועות, ללא פסיקות או משתני עמוד ישיר
SNCOUNT equ $03c0
SNPHASE equ $03c2
SNSTEP equ $03c4
SNTICKS equ $03c6
SNVOL equ $03c8
SNLOW equ $03c9
SNOCT equ $03ca
SNLEN equ $03cb
SNTEMPO equ $03cc
SNNOTE equ $03cd
SNCR0 equ $03ce
SNCR2 equ $03cf
SNCR1 equ $03d0
SNDDR equ $03d1
SNOUT equ $03d2
SNCR3 equ $03d3
SNVAL equ $03d4
SNDUR equ $03d5

snd_dispatch pshs x
        leau sn_kw,pcr
        lbsr match
        bne 1F
        lbsr sn_boundary
        beq sn_sound
        ldx ,s
1
        leau sn_playkw,pcr
        lbsr match
        bne 2F
        lbsr sn_boundary
        beq sn_play
2
        puls x
        andcc #$fb
        rts
sn_boundary lda ,x
        cmpa #'0
        blo 1F
        cmpa #'9
        bls 2F
        cmpa #'A
        blo 1F
        cmpa #'Z
        bls 2F
1       orcc #4
        rts
2       andcc #$fb
        rts
sn_kw fcc "SOUND"
        fcb 0
sn_playkw fcc "PLAY"
        fcb 0
sn_sound leas 2,s
        clr SNCOUNT
        clr SNCOUNT+1
        lbsr getbyte
        tstb
        lbeq err_fc
        tfr b,a
        clrb
        lsra
        rorb
        std SNSTEP
        lda #',
        lbsr expect
        lbsr getbyte
        tstb
        lbeq err_fc
        lda #$fc
        sta SNVOL
        stb SNDUR
        ldd #400
        std SNTICKS
        lbsr sn_begin
sn_units lbsr sn_wave
        dec SNDUR
        bne sn_units
        lbsr sn_end
sn_done orcc #4
        rts
sn_play leas 2,s
        lda #'"
        lbsr expect
        lda #2
        sta SNOCT
        lda #4
        sta SNLEN
        lda #2
        sta SNTEMPO
        lda #120
        sta SNVOL
        clr SNCOUNT
        clr SNCOUNT+1
sn_next lbsr skipsp
        lbeq err_sn
        leax 1,x
        cmpa #';
        lbeq sn_next
        cmpa #'"
        beq sn_done
        cmpa #'O
        beq sn_oct
        cmpa #'L
        beq sn_len
        cmpa #'T
        beq sn_tempo
        cmpa #'V
        lbeq sn_volume
        cmpa #'P
        lbeq sn_pause
        cmpa #'N
        lbeq sn_number
        cmpa #'1
        blo sn_letter
        cmpa #'9
        bhi sn_letter
        leax -1,x
        lbra sn_number
sn_letter cmpa #'A
        lblo err_sn
        cmpa #'G
        lbhi err_sn
        suba #'A
        leau sn_letters,pcr
        lda a,u
        sta SNNOTE
        lda ,x
        cmpa #'#
        beq sn_sharp
        cmpa #'+
        beq sn_sharp
        cmpa #'-
        bne sn_note
        dec SNNOTE
        leax 1,x
        bra sn_note
sn_sharp inc SNNOTE
        leax 1,x
        bra sn_note
sn_oct lbsr sn_num
        cmpb #1
        lblo err_fc
        cmpb #5
        lbhi err_fc
        stb SNOCT
        lbra sn_next
sn_len lbsr sn_num
        tstb
        lbeq err_fc
        stb SNLEN
        lbra sn_next
sn_tempo lbsr sn_num
        tstb
        lbeq err_fc
        stb SNTEMPO
        lbra sn_next
sn_volume lbsr sn_num
        cmpb #31
        lbhi err_fc
        lslb
        lslb
        lslb
        stb SNVOL
        lbra sn_next
sn_number lbsr sn_num
        cmpb #1
        lblo err_fc
        cmpb #12
        lbhi err_fc
        decb
        stb SNNOTE
sn_note lda SNNOTE
        ; סמוך לגבול האוקטבה: חצי טון אחד מעבר לטבלה
        inca
        lsla
        leau sn_steps,pcr
        ldd a,u
        std SNSTEP
        lda #5
        suba SNOCT
1       tsta
        beq 2F
        lsr SNSTEP
        ror SNSTEP+1
        deca
        bra 1B
2       lbsr sn_duration
        lbsr sn_begin
        lbsr sn_wave
        lbsr sn_end
        lbra sn_next
sn_pause lbsr sn_num
        tstb
        lbeq err_fc
        pshs b
        lda SNLEN
        pshs a
        stb SNLEN
        lbsr sn_duration
        puls a
        sta SNLEN
        puls b
        clra
        clrb
        std SNSTEP
        lbsr sn_begin
        lbsr sn_wave
        lbsr sn_end
        lbra sn_next
; מספר עשרוני בתוך המחרוזת, ללא ביטויים
sn_num clr SNVAL
        lda ,x
        cmpa #'0
        lblo err_sn
        cmpa #'9
        lbhi err_sn
1       lda ,x
        cmpa #'0
        blo 2F
        cmpa #'9
        bhi 2F
        suba #'0
        pshs a
        lda SNVAL
        ldb #10
        mul
        addb ,s+
        adca #0
        tsta
        lbne err_fc
        stb SNVAL
        leax 1,x
        bra 1B
2       ldb SNVAL
        rts
; תו שלם הוא 8/T שניות; חלוקה שלמה בשני המחלקים
sn_duration ldd #63920
        ldu #0
1       subb SNLEN
        sbca #0
        bcs 2F
        leau 1,u
        bra 1B
2       tfr u,d
        ldu #0
3       subb SNTEMPO
        sbca #0
        bcs 4F
        leau 1,u
        bra 3B
4       cmpu #0
        bne 5F
        ldu #1
5       stu SNTICKS
        rts
; בקרה ידנית של CA2/CB2 דורשת גם ביטים 4 ו-5
sn_begin lda PIA0+1
        sta SNCR0
        anda #$c7
        ora #$30
        sta PIA0+1
        lda PIA0+3
        sta SNCR2
        anda #$c7
        ora #$30
        sta PIA0+3
        lda PIA1+1
        sta SNCR1
        anda #$fb
        sta PIA1+1
        lda PIA1
        sta SNDDR
        ora #$fc
        sta PIA1
        lda SNCR1
        ora #4
        sta PIA1+1
        lda PIA1
        sta SNOUT
        anda #3
        sta SNLOW
        lda PIA1+3
        sta SNCR3
        anda #$c7
        ora #$38
        sta PIA1+3
        clr SNPHASE
        clr SNPHASE+1
        rts
; 112 מחזורי מעבד לדגימה, פרט ליציאה האחרונה
sn_wave pshs u
        ldu SNTICKS
sn_sample ldd SNPHASE
        addd SNSTEP
        std SNPHASE
        lda SNPHASE
        asra
        asra
        asra
        asra
        asra
        asra
        asra
        anda SNVOL
        ora SNLOW
        sta PIA1
        ldd SNCOUNT
        addd #1
        std SNCOUNT
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        nop
        brn sn_sample
        leau -1,u
        cmpu #0
        bne sn_sample
        puls u,pc
; משחזרים כיוונים ובקרה, ללא שינוי בביטי התצוגה
sn_end lda SNOUT
        sta PIA1
        lda SNCR3
        sta PIA1+3
        lda SNCR1
        anda #$fb
        sta PIA1+1
        lda SNDDR
        sta PIA1
        lda SNCR1
        sta PIA1+1
        lda SNCR0
        sta PIA0+1
        lda SNCR2
        sta PIA0+3
        rts
sn_letters fcb 9,11,0,2,4,5,7
; חצאי טון מאוקטבה חמש, כולל שני קצוות לצלילים מסומנים
sn_steps fdb 16204,17167,18188,19270,20415,21629,22916,24278,25722,27251,28872,30589,32407,34334
