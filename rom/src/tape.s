; קלטת מקורית: בלוקים תקניים ואות דרך ה-PIA בלבד.
TB      equ $e0                  ; מאגר זמני, 256 בתים
TF      equ $e2                  ; מסגרת שחזור במחסנית
TC      equ $e4                  ; סכום ביקורת
TL      equ $e5                  ; אורך בלוק
TT      equ $e6                  ; סוג בלוק
TN      equ $e7                  ; אורך השם המבוקש
TNAME   equ $e8                  ; שם מרופד, שמונה בתים

tape_dispatch
        leau t_kw_save,pcr
        lbsr match
        lbeq t_save
        leau t_kw_load,pcr
        lbsr match
        lbeq t_load
        leau t_kw_motor,pcr
        lbsr match
        lbeq t_motor
        leau t_kw_audio,pcr
        lbsr match
        lbeq t_audio
        andcc #$fb
        rts
t_kw_save fcc "CSAVE"
        fcb 0
t_kw_load fcc "CLOAD"
        fcb 0
t_kw_motor fcc "MOTOR"
        fcb 0
t_kw_audio fcc "AUDIO"
        fcb 0
t_kw_on fcc "ON"
        fcb 0
t_kw_off fcc "OFF"
        fcb 0
; ללא קיצור מילים או זנב לא תקין.
t_onoff lbsr skipsp
        leau t_kw_on,pcr
        lbsr match
        beq 1F
        leau t_kw_off,pcr
        lbsr match
        lbne err_sn
        clrb
        bra 2F
1       ldb #8
2       pshs b
        lbsr t_eos
        puls b,pc
t_eos   lbsr skipsp
        beq 1F
        cmpa #':
        lbne err_sn
1       rts
t_motor lbsr t_onoff
        lda PIA1+1
        anda #$c7
        ora #$30
        pshs b
        ora ,s+
        sta PIA1+1
        lbra t_done
t_audio lbsr t_onoff
        ; כניסת הקלטת היא בחירה 01 של מרבב הצליל.
        lda PIA0+1
        anda #$c7
        ora #$38
        sta PIA0+1
        lda PIA0+3
        anda #$c7
        ora #$30
        sta PIA0+3
        lda PIA1+3
        anda #$c7
        ora #$30
        pshs b
        ora ,s+
        sta PIA1+3
t_done  orcc #4
        rts
; שם מילולי, עד שמונה תווים; מרכאה סוגרת חובה.
t_name  ldu #TNAME
        ldb #8
        lda #32
1       sta ,u+
        decb
        bne 1B
        clr TN
        lbsr skipsp
        cmpa #'"
        lbne err_sn
        leax 1,x
        ldu #TNAME
2       lda ,x+
        lbeq err_sn
        cmpa #'"
        beq 3F
        inc TN
        ldb TN
        cmpb #8
        lbhi err_fc
        sta ,u+
        bra 2B
3       rts
; הקצאה מתחת לערימת המחרוזות, ללא אזור גרפיקה.
t_alloc ldd STRFREE
        subd #256
        lbcs err_om
        cmpd ARYEND
        lblo err_om
        std TB
        rts
; מסגרת: בקרה A/B, כיוון A, פלט A, בקרה 0A/0B, ואז CC ו-X.
t_hw    ldy TF
        lda PIA1+1
        sta ,y
        anda #$fb
        sta PIA1+1
        lda PIA1
        sta 2,y
        anda #$fe
        ora #$fc
        sta PIA1
        lda ,y
        ora #4
        sta PIA1+1
        lda PIA1
        sta 3,y
        anda #3
        sta PIA1
        lda PIA1+3
        sta 1,y
        anda #$c7
        ora #$30
        sta PIA1+3
        lda PIA0+1
        sta 4,y
        lda PIA0+3
        sta 5,y
        lda ,y
        anda #$c7
        ora #$3c
        sta PIA1+1
        rts
; יציאה מכל עומק קריאות, כולל שגיאה ו-BREAK.
t_success ldu #0
t_cleanup
        lds TF
        lda 3,s
        sta PIA1
        lda ,s
        anda #$fb
        sta PIA1+1
        lda 2,s
        sta PIA1
        lda ,s
        anda #$c7
        ora #$30              ; המנוע תמיד כבוי
        sta PIA1+1
        lda 1,s
        sta PIA1+3
        lda 4,s
        sta PIA0+1
        lda 5,s
        sta PIA0+3
        leas 6,s
        puls cc,x
        cmpu #0
        lbne error
        lbra t_done
t_io    leau t_msg_io,pcr
        bra t_cleanup
t_fm    leau t_msg_fm,pcr
        bra t_cleanup
t_om    leau m_om,pcr
        bra t_cleanup
t_break leau m_break,pcr
        bra t_cleanup
t_msg_io fcc "?IO ERROR"
        fcb 0
t_msg_fm fcc "?FM ERROR"
        fcb 0
; BREAK אינו צורך את תור ההקלדה.
t_check pshs a
        lda #$fb
        sta PIA0+2
        lda PIA0
        bita #$40
        lbeq t_break
        puls a,pc
; כל ביט הוא מחזור אחד; 1 קצר, 0 ארוך. בית בסדר LSB.
; חצאי המחזור בקירוב 186/373 מחזורים במעבד 0.895MHz.
t_byteout pshs d,x
        ldb #8
        pshs a
1       lsr ,s
        ldx #21
        bcs 2F
        ldx #44
2       lda #$fc
        sta PIA1
3       leax -1,x
        bne 3B
        ldx #21
        bcs 4F
        ldx #44
4       clr PIA1
5       leax -1,x
        bne 5B
        decb
        bne 1B
        leas 1,s
        puls d,x,pc
; מרווח שקט של כחצי שנייה, גם להתנעת המנוע.
t_gap   pshs d,x
        ldx #900
1       lbsr t_check
        ldb #90
2       decb
        bne 2B
        leax -1,x
        bne 1B
        puls d,x,pc
t_leader pshs d
        ldb #128
1       lbsr t_check
        lda #$55
        lbsr t_byteout
        decb
        bne 1B
        puls d,pc
; כתיבת בלוק מהמאגר: TT סוג, TL אורך.
t_blockout pshs d,x
        lbsr t_check
        lda #$55
        lbsr t_byteout
        lda #$3c
        lbsr t_byteout
        lda TT
        sta TC
        lbsr t_byteout
        lda TL
        adda TC
        sta TC
        lda TL
        lbsr t_byteout
        ldx TB
        ldb TL
        beq 2F
1       lda ,x+
        adda TC
        sta TC
        lda -1,x
        lbsr t_byteout
        decb
        bne 1B
2       lda TC
        lbsr t_byteout
        lda #$55
        lbsr t_byteout
        puls d,x,pc
; צבירת טקסט, ופליטה בכל 255 בתים.
t_emit  pshs b,x
        ldx TB
        ldb TL
        abx
        sta ,x
        inc TL
        lda TL
        cmpa #255
        bne 1F
        lbsr t_dataout
        clr TL
1       puls b,x,pc

t_save  lbsr t_name
        lbsr skipsp
        cmpa #',
        bne 1F
        leax 1,x
        lda #'A
        lbsr expect
1       lbsr t_eos
        lbsr t_alloc
        pshs x,cc
        orcc #$50
        leas -6,s
        sts TF
        lbsr t_hw
        ldx TB
        ldu #TNAME
        ldb #8
2       lda ,u+
        sta ,x+
        decb
        bne 2B
        ; BASIC, ASCII, מרווחים; כתובות הרצה וטעינה אינן בשימוש.
        clra
        sta ,x+
        lda #$ff
        sta ,x+
        sta ,x+
        clra
        clrb
        std ,x++
        std ,x
        clr TT
        lda #15
        sta TL
        lbsr t_gap
        lbsr t_leader
        lbsr t_blockout
        lbsr t_gap
        lbsr t_leader
        lda #1
        sta TT
        clr TL
        ldy #PROGST
3       ldd ,y
        beq 6F
        ldd 2,y
        leax t_divisors,pcr
        clrb                    ; דגל ספרה מובילה נשמר בנפרד
        pshs b
        ldd 2,y
4       ldu ,x++
        clr ,-s
5       cmpd -2,x
        blo 7F
        subd -2,x
        inc ,s
        bra 5B
7       pshs d
        lda 2,s
        bne 8F
        tst 3,s
        bne 8F
        cmpu #1
        bne 9F
8       inc 3,s
        adda #'0
        lbsr t_emit
9       puls d
        leas 1,s
        cmpu #1
        bne 4B
        leas 1,s
        lda #32
        lbsr t_emit
        leau 4,y
10      lda ,u+
        beq 11F
        lbsr t_emit
        bra 10B
11      lda #13
        lbsr t_emit
        ldy ,y
        bra 3B
6       tst TL
        lbeq 12F
        lbsr t_dataout
12      lda #$ff
        sta TT
        clr TL
        lbsr t_blockout
        ; מסיימים מחזור לפני כיבוי המנוע.
        lda #$55
        lbsr t_byteout
        lbra t_success
; בזרם ASCII עם מרווחים נותנים זמן לעצירת המנוע בין בלוקים.
t_dataout lbsr t_blockout
        lbsr t_gap
        lbra t_leader
t_divisors fdb 10000,1000,100,10,1

; מודדים מחזור בין שני קצוות עולים. B סופר לולאות של 15 מחזורים.
; גם בשקט או בסוף קלטת ממשיכים לבדוק BREAK.
t_rise  lbsr t_check
1       lda PIA1
        bita #1
        beq 2F
        lbsr t_check
        bra 1B
2       lda PIA1
        bita #1
        bne 3F
        lbsr t_check
        bra 2B
3       rts
t_bit   pshs b
        clrb
1       incb
        beq 4F
        lda PIA1
        bita #1
        bne 1B
2       incb
        beq 4F
        lda PIA1
        bita #1
        beq 2B
        cmpb #36                ; גבול בין 373 ל-746 מחזורים
        puls b,pc               ; C=1 הוא ביט קצר
4       lbsr t_rise
        clrb
        bra 1B
; שמונה ביטים ללא סיביות התחלה או עצירה.
t_bytein pshs b
        ldb #8
        clr ,-s
1       lbsr t_bit
        ror ,s
        decb
        bne 1B
        puls a,b,pc
; מסנכרנים בחלון ביטים, כך שאין תלות ביישור תחילת הקלטת.
t_blockin pshs d,x,u
        lda PIA1+1
        ora #8
        sta PIA1+1
        lbsr t_rise
        clrb
1       lbsr t_bit
        rorb
        cmpb #$3c
        bne 1B
        lbsr t_bytein
        sta TT
        sta TC
        lbsr t_bytein
        sta TL
        adda TC
        sta TC
        ldu TB
        ldb TL
        beq 3F
2       lbsr t_bytein
        sta ,u+
        adda TC
        sta TC
        decb
        bne 2B
3       lbsr t_bytein
        cmpa TC
        lbne t_io
        ; הסיומת אינה מידע: החיפוש הבא ידלג עליה.
        lda PIA1+1
        anda #$f7
        sta PIA1+1
        puls d,x,u,pc

t_load  clr TN
        lbsr skipsp
        beq 1F
        cmpa #':
        beq 1F
        lbsr t_name
1       lbsr t_eos
        lbsr newprog
        ldd #0
        std CURLN
        lbsr t_alloc
        leax t_empty,pcr         ; הטעינה מחליפה גם את שורת הפקודה
        pshs x,cc
        orcc #$50
        leas -6,s
        sts TF
        lbsr t_hw
        lda #'S
        lbsr putc
        lda #13
        lbsr putc
2       lbsr t_blockin
        tst TT
        bne 2B
        lda TL
        cmpa #15
        lbne t_io
        lda #'F
        lbsr putc
        lda #32
        lbsr putc
        ldx TB
        ldb #8
3       lda ,x+
        lbsr putc
        decb
        bne 3B
        lda #13
        lbsr putc
        tst TN
        beq 5F
        ldx TB
        ldu #TNAME
        ldb #8
4       lda ,x+
        cmpa ,u+
        bne 2B
        decb
        bne 4B
5       ldx TB
        tst 8,x
        lbne t_fm
        lda 9,x
        cmpa #$ff
        lbne t_fm
        ldu #LINBUF
6       lbsr t_blockin
        lda TT
        cmpa #$ff
        lbeq 12F
        cmpa #1
        lbne t_io
        ldx TB
        ldb TL
        beq 6B
7       lda ,x+
        cmpa #13
        beq 9F
        cmpa #32
        lblo t_io
        cmpa #126
        lbhi t_io
        cmpu #LINBUF+LINMAX+1
        lbhs t_io
        sta ,u+
8       decb
        bne 7B
        bra 6B
9       clr ,u
        pshs b,x
        ; מוודאים מספר חוקי לפני כניסה לשגרה שעלולה להציג שגיאה.
        ldx #LINBUF
        lda ,x
        cmpa #'0
        lblo t_io
        cmpa #'9
        lbhi t_io
        ldd #0
10      pshs d
        lda ,x+
        suba #'0
        cmpa #9
        bhi 11F
        puls d
        cmpd #6399
        lbhi t_io
        pshs d
        lslb
        rola
        lslb
        rola
        addd ,s
        lslb
        rola
        leas 2,s
        pshs d
        ldb -1,x
        subb #'0
        clra
        addd ,s++
        cmpd #63999
        lbhi t_io
        bra 10B
11      puls d
        ; תו נוסף מותר רק לרווח שהשמירה מוסיפה אחרי המספר.
        cmpu #LINBUF+LINMAX+1
        blo 13F
        lda -1,x
        cmpa #32
        lbne t_io
13      ; מקום גם לרשומה החדשה, לפני שהיא מזיזה את זיכרון התוכנית.
        tfr u,d
        subd #LINBUF
        addd #5
        addd PROGEND
        cmpd #FORBASE-$400
        lbhs t_om
        cmpd TB
        lbhs t_om
        ldx #LINBUF
        lbsr storeline
        puls b,x
        ldu #LINBUF
        lbra 8B
12      tst TL
        lbne t_io
        cmpu #LINBUF
        lbne t_io
        lbra t_success
t_empty fcb 0
