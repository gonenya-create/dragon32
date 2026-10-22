; פקודות נוספות ומערכים מספריים. נכתב מאפס.
; $C0-$CF: עבודה זמנית למערכים, רק אחרי הערכת האינדקסים.
; $03E0-$03E4: מצביע נתונים, רשומת שורה, ודגל בתוך DATA.
; $03E5-$03E8: זיהוי תוכנית ומצב האתחול. היתר פנוי.
S2NAME equ $c0
S2DIMS equ $c2
S2MODE equ $c3
S2SIZE1 equ $c4
S2SIZE2 equ $c6
S2IDX1 equ $c8
S2IDX2 equ $ca
S2LEN equ $cc
S2PTR equ $ce
DATAP equ $03e0
DATAL equ $03e2
DATAIN equ $03e4
DATAEND equ $03e5
DATAMAG equ $03e7
S2WANT equ $03e9             ; READ: 0 = מספר, $80 = מחרוזת

; Z=1 אם טופל; אחרת X נשמר ו-Z=0.
st2_dispatch pshs x
        leau s2tab,pcr
s2try  tst ,u
        lbeq s2miss
        pshs u
        lbsr match
        puls u
        lbeq s2found
s2next tst ,u+
        lbne s2next
        leau 2,u
        lbra s2try
s2found leas 2,s
1       tst ,u+
        lbne 1B
        ldd ,u
        leau s2tab,pcr
        leau d,u
        jsr ,u
        orcc #4
        rts
s2miss puls x
        andcc #$fb
        rts
s2tab  fcc "GOSUB"
        fcb 0
        fdb s2gosub-s2tab
        fcc "RETURN"
        fcb 0
        fdb s2return-s2tab
        fcc "ON"
        fcb 0
        fdb s2on-s2tab
        fcc "DATA"
        fcb 0
        fdb s2skip-s2tab
        fcc "READ"
        fcb 0
        fdb s2read-s2tab
        fcc "RESTORE"
        fcb 0
        fdb s2restore-s2tab
        fcc "DIM"
        fcb 0
        fdb s2dim-s2tab
        fcb 0
s2gosub lbsr getint
s2call pshs d
        ldy FORSP
        cmpy #FORBASE+16*FORLEN
        lbhs err_om
        ldd #0
        std ,y
        ldd CURLN
        std 12,y
        stx 14,y
        leay FORLEN,y
        sty FORSP
        puls d
        lbra goline
s2return ldy FORSP
1       cmpy #FORBASE
        lbls s2rg
        leay -FORLEN,y
        ldd ,y
        lbne 1B
        sty FORSP
        ldd 12,y
        std CURLN
        ldx 14,y
        rts
s2on   lbsr getbyte
        leas -5,s
        stb 3,s
        clr 4,s
        lbsr skipsp
        leau kw_goto,pcr
        lbsr match
        lbeq 1F
        leau s2kwsub,pcr
        lbsr match
        lbne err_sn
        lda #1
        lbra 2F
1       clra
2       sta 2,s
3       lbsr skipsp
        cmpa #'0
        lblo err_sn
        cmpa #'9
        lbhi err_sn
        lbsr linenum
        tst 3,s
        lbeq 4F
        dec 3,s
        lbne 4F
        std ,s
        inc 4,s
4       lbsr skipsp
        cmpa #',
        lbne 5F
        leax 1,x
        lbra 3B
5       tst 4,s
        lbeq 6F
        tst 2,s
        lbne 7F
        ldd ,s
        leas 5,s
        lbra goline
7       ldd ,s
        leas 5,s
        lbra s2call
6       leas 5,s
        rts
s2kwsub fcc "GOSUB"
        fcb 0
; מדלגים עד מפריד מחוץ למירכאות.
s2skip clrb
1       lda ,x
        lbeq 3F
        cmpa #'"
        lbne 2F
        eorb #1
2       tstb
        lbne 4F
        cmpa #':
        lbeq 3F
4       leax 1,x
        lbra 1B
3       tsta
        rts

; נקודת איפוס שניתן לקרוא מתוך clrvars, בלי שינוי X.
st2_reset clr DATAP
        clr DATAP+1
        clr DATAIN
        ldd PROGEND
        std DATAEND
        ldd #$dada
        std DATAMAG
        rts
s2restore lbsr skipsp
        lbeq 1F
        cmpa #':
        lbeq 1F
        lbsr getint
        lbsr findline
        ; RESTORE מתחיל מהשורה הראשונה שמספרה אינו קטן מהמבוקש.
        pshs y
        lbsr st2_reset
        puls y
        sty DATAL
        leay 4,y
        sty DATAP
        rts
1       lbra st2_reset
s2read ldd DATAMAG
        cmpd #$dada
        lbne 1F
        ldd DATAEND
        cmpd PROGEND
        lbeq 2F
1       lbsr st2_reset
2       lbsr getvar
        lda VNAME+1             ; משתנה מחרוזת? אז קוראים פריט כמחרוזת (Claude, 17.10)
        anda #$80
        sta S2WANT
        pshs x,u
        lbsr s2datum
        puls x,u
        tst S2WANT
        lbeq 5F
        lbsr str_save
        lda SLEN
        sta ,u
        ldd SPTR
        std 1,u
        lbra 6F
5       lbsr stfac
6       lbsr skipsp
        cmpa #',
        lbne 3F
        leax 1,x
        lbra 2B
3       rts
; מקום לקריאת מחרוזת: כרגע מירכאות מחזירות TM.
s2datum ldx DATAP
        lbeq 1F
        ldy DATAL
        ldd ,y
        lbeq s2od
        lbra sdscan
1       ldy #PROGST
sdline ldd ,y
        lbeq s2od
        sty DATAL
        leax 4,y
sdscan tst DATAIN
        lbne sditem
sdstmt lbsr skipsp
        lbeq sdnext
        leau s2kwdata,pcr
        lbsr match
        lbeq sdfound
        leau s2kwrem,pcr
        lbsr match
        lbeq sdnext
        lda ,x
        cmpa #''
        lbeq sdnext
        lbsr s2skip
        lbeq sdnext
        leax 1,x
        lbra sdstmt
sdnext ldy DATAL
        ldy ,y
        lbra sdline
sdfound lda ,x
        cmpa #'A
        lblo 1F
        cmpa #'Z
        lbls sdscanword
1       inc DATAIN
sditem lbsr skipsp
        lbeq sdend
        cmpa #':
        lbeq sdend
        tst S2WANT
        lbne sdstr
        cmpa #'"
        lbeq s2tm
        clrb
        cmpa #'-
        lbne 1F
        incb
        leax 1,x
        lbra 2F
1       cmpa #'+
        lbne 2F
        leax 1,x
2       pshs b
        lbsr skipsp
        cmpa #'.
        lbeq 3F
        cmpa #'0
        lblo err_sn
        cmpa #'9
        lbhi err_sn
3       lbsr fin
        puls b
        tstb
        lbeq 4F
        tst FACEXP
        lbeq 4F
        com FACSGN
sdtail
4       lbsr skipsp
        cmpa #',
        lbeq sdcomma
        tsta
        lbeq sdlast
        cmpa #':
        lbne err_sn
sdlast clr DATAIN
        stx DATAP
        rts
sdcomma leax 1,x
        stx DATAP
        rts
sdend  clr DATAIN
        lbra sdstmtend
sdscanword lbsr s2skip
sdstmtend lda ,x
        lbeq sdnext
        leax 1,x
        lbra sdstmt
; פריט מחרוזת: במירכאות, או עד פסיק / נקודתיים / סוף השורה
sdstr  cmpa #'"
        lbne 1F
        lbsr str_lit
        lbra sdtail
1       stx SPTR
        clrb
2       lda ,x
        lbeq 3F
        cmpa #',
        lbeq 3F
        cmpa #':
        lbeq 3F
        leax 1,x
        incb
        lbra 2B
3       stb SLEN
        lda #$ff
        sta VALTYP
        lbra sdtail
s2kwdata fcc "DATA"
        fcb 0
s2kwrem fcc "REM"
        fcb 0

; DIM קורא שם בלי ליצור משתנה סקלרי.
s2dim  lbsr skipsp
        cmpa #'A
        lblo err_sn
        cmpa #'Z
        lbhi err_sn
        leax 1,x
        clrb
        pshs a,b
1       lda ,x
        cmpa #'0
        lblo 3F
        cmpa #'9
        lbls 2F
        cmpa #'A
        lblo 3F
        cmpa #'Z
        lbhi 3F
2       tst 1,s
        lbne 4F
        sta 1,s
4       leax 1,x
        lbra 1B
3       puls d
        pshs a                  ; DIM A$(n): מערך מחרוזות (ביט 7 בשם, כמו ב-getvar)
        lda ,x
        cmpa #'$
        puls a
        lbne 6F
        leax 1,x
        orb #$80
6       std VNAME
        lbsr skipsp
        lda #1
        lbsr arparse
        lbsr skipsp
        cmpa #',
        lbne 5F
        leax 1,x
        lbra s2dim
5       rts
; X על '('; אינדקסים נשמרים במחסנית כדי לאפשר מערכים מקוננים.
arr_ref clra
arparse leas -8,s
        sta 2,s
        ldd VNAME
        std ,s
        lda #1
        sta 3,s
        clr 6,s
        clr 7,s
        lda #'(
        lbsr expect
        lbsr arint
        std 4,s
        lbsr skipsp
        cmpa #',
        lbne 1F
        leax 1,x
        inc 3,s
        lbsr arint
        std 6,s
1       lda #')
        lbsr expect
        ldd ,s
        std S2NAME
        std VNAME
        ldd 2,s
        sta S2MODE
        stb S2DIMS
        ldd 4,s
        std S2IDX1
        ldd 6,s
        std S2IDX2
        leas 8,s
        ; אין שמירת כתובות לאורך הערכת ביטויים.
        ldu VARTOP
arfind cmpu ARYEND
        lbhs arnew
        ldd ,u
        cmpd S2NAME
        lbeq arfound
        ldd 2,u
        leau d,u
        lbra arfind
arfound tst S2MODE
        lbne s2dd
        lda 4,u
        cmpa S2DIMS
        lbne s2bs
        lbra arindex
arnew  ldd S2IDX1
        tst S2MODE
        lbne 1F
        ldd #10
1       addd #1
        lbcs err_om
        std S2SIZE1
        ldd #1
        std S2SIZE2
        lda S2DIMS
        cmpa #2
        lbne 3F
        ldd S2IDX2
        tst S2MODE
        lbne 2F
        ldd #10
2       addd #1
        lbcs err_om
        std S2SIZE2
3       ldd S2SIZE1
        ldy S2SIZE2
        lbsr armul
        ldy #5
        lbsr armul
        addd #7
        lbcs err_om
        pshs d
        lda S2DIMS
        cmpa #2
        puls d
        lbne 4F
        addd #2
4       std S2LEN
        ; אף הקצאה אינה נוגעת באזור המחרוזות.
        addd ARYEND
        lbcs err_om
        cmpd #STRLOW
        lbhs err_om
        std S2PTR
        ldu ARYEND
        pshs x,u
        tfr u,x
5       clr ,x+
        cmpx S2PTR
        lblo 5B
        puls x,u
        ldd S2PTR
        std ARYEND
        ldd S2NAME
        std ,u
        ldd S2LEN
        std 2,u
        lda S2DIMS
        sta 4,u
        ldd S2SIZE1
        std 5,u
        lda S2DIMS
        cmpa #2
        lbne 6F
        ldd S2SIZE2
        std 7,u
6       tst S2MODE
        lbne ardone
arindex ldd S2IDX1
        cmpd 5,u
        lbhs s2bs
        lda S2DIMS
        cmpa #2
        lbne 1F
        ldd S2IDX2
        cmpd 7,u
        lbhs s2bs
        ldd S2IDX1
        ldy 7,u
        lbsr armul
        addd S2IDX2
        leau 2,u
        lbra 2F
1       ldd S2IDX1
2       ldy #5
        lbsr armul
        leau 7,u
        leau d,u
ardone stu VARPTR
        rts
; אינדקס שלילי או גדול מדי הוא שגיאת תחום.
arint  lbsr expr
        tst FACSGN
        lbmi s2bs
        lda FACEXP
        cmpa #$90
        lbhi s2bs
        lbsr qint
        ldd QN+2
        rts
; כפל קטן ובדוק: D כפול Y, בלי לשנות X או U.
armul  pshs d
        ldd #0
1       cmpy #0
        lbeq 2F
        addd ,s
        lbcs err_om
        cmpd #STRLOW-PROGST
        lbhs err_om
        leay -1,y
        lbra 1B
2       leas 2,s
        rts
s2rg   leau s2mrg,pcr
        lbra error
s2od   leau s2mod,pcr
        lbra error
s2bs   leau s2mbs,pcr
        lbra error
s2dd   leau s2mdd,pcr
        lbra error
s2tm   leau s2mtm,pcr
        lbra error
s2mrg  fcc "?RG ERROR"
        fcb 0
s2mod  fcc "?OD ERROR"
        fcb 0
s2mbs  fcc "?BS ERROR"
        fcb 0
s2mdd  fcc "?DD ERROR"
        fcb 0
s2mtm  fcc "?TM ERROR"
        fcb 0
