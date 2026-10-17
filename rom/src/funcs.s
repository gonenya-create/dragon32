; פונקציות מקוריות; שטח עבודה $0380-$03bf, ללא משתני עמוד ישיר.
; קבועים מחושבים מתמטית, ללא מקור ROM או קבועי מיקרוסופט.
FNX equ $0380
FNY equ $0385
FNT equ $038a
FNS equ $038f
FNK equ $0394
FNN equ $0396
FNSIGN equ $0398
FNFLAGS equ $0399
FNSEED equ $039c

fn_dispatch pshs x
 leau fn_table,pcr
fn_try tst ,u
 beq fn_miss
 pshs u
 lbsr match
 puls u
 beq fn_boundary
fn_next tst ,u+
 bne fn_next
 leau 2,u
 bra fn_try
fn_boundary lda ,x
 cmpa #'0
 blo fn_found
 cmpa #'9
 bls fn_restore
 cmpa #'A
 blo fn_found
 cmpa #'Z
 bhi fn_found
fn_restore ldx ,s
 bra fn_next
fn_miss puls x
 andcc #$fb
 rts
fn_found tst ,u+
 bne fn_found
 ldd ,u
 leau fn_base,pcr
 leau d,u
 leas 2,s
 pshs u
 leau fn_timer,pcr
 cmpu ,s
 beq fn_noarg
 lda #'(
 lbsr expect
 lbsr expr
 lda #')
 lbsr expect
fn_noarg puls u
 jsr ,u
 orcc #4
 rts
fn_base
fn_table
 fcc "INT"
 fcb 0
 fdb fn_int-fn_base
 fcc "FIX"
 fcb 0
 fdb fn_fix-fn_base
 fcc "ABS"
 fcb 0
 fdb fn_abs-fn_base
 fcc "SGN"
 fcb 0
 fdb fn_sgn-fn_base
 fcc "SQR"
 fcb 0
 fdb fn_sqr-fn_base
 fcc "SIN"
 fcb 0
 fdb fn_sin-fn_base
 fcc "COS"
 fcb 0
 fdb fn_cos-fn_base
 fcc "TAN"
 fcb 0
 fdb fn_tan-fn_base
 fcc "ATN"
 fcb 0
 fdb fn_atn-fn_base
 fcc "LOG"
 fcb 0
 fdb fn_log-fn_base
 fcc "EXP"
 fcb 0
 fdb fn_exp-fn_base
 fcc "RND"
 fcb 0
 fdb fn_rnd-fn_base
 fcc "TIMER"
 fcb 0
 fdb fn_timer-fn_base
 fcb 0
fn_timer ldd #0
 lbra givd
fn_abs clr FACSGN
 rts
fn_sgn tst FACEXP
 beq fn_timer
 ldd #1
 tst FACSGN
 bpl 1F
 ldd #-1
1 lbra givd
; חיתוך המנטיסה במקום, גם למספרים גדולים מ-65535.
fn_fix lda FACEXP
 beq fn_fixdone
 cmpa #$81
 blo fn_clear
 cmpa #$a0
 bhs fn_fixdone
 pshs x
 suba #$80
 ldx #FACM
1 cmpa #8
 blo 2F
 suba #8
 leax 1,x
 bra 1B
2 ldb #$ff
3 tsta
 beq 4F
 lsrb
 deca
 bra 3B
4 comb
 andb ,x
 stb ,x+
5 cmpx #FACM+4
 bhs 6F
 clr ,x+
 bra 5B
6 puls x
fn_fixdone clr FACOV
 rts
fn_clear clr FACEXP
 clr FACSGN
 clr FACOV
 rts
fn_int lbsr pushfac
 lbsr fn_fix
 lbsr poparg
 lbsr fcmp
 tsta
 beq 1F
 tst FACSGN
 bmi 2F
 tst ARGSGN
 bpl 1F
2 leau fn_one,pcr
 lbsr ldarg
 com ARGSGN
 lbsr fadd
1 rts
fn_sqr tst FACEXP
 beq 9F
 tst FACSGN
 lbmi err_fc
 ldu #FNX
 lbsr stfac
 lda FACEXP
 suba #$80
 asra
 adda #$81
 sta FACEXP
 lda #$80
 sta FACM
 clr FACM+1
 clr FACM+2
 clr FACM+3
 lda #7
 sta FNN
1 ldu #FNY
 lbsr stfac
 ldu #FNX
 lbsr ldarg
 lbsr fdiv
 ldu #FNY
 lbsr ldarg
 lbsr fadd
 dec FACEXP
 dec FNN
 bne 1B
9 rts
; טור אקספוננט לאחר הפחתת כפולה של לוג שתיים.
fn_exp ldu #FNX
 lbsr stfac
 leau fn_ln2,pcr
 lbsr ldarg
 lbsr fn_swap
 lbsr fdiv
 lbsr fn_fix
 lda FACEXP
 cmpa #$88
 bls 8F
 tst FACSGN
 lbmi fn_clear
 lbra err_ov
8
 lbsr qint
 ldd QN+2
 tst FACSGN
 bpl 1F
 coma
 comb
 addd #1
1 std FNK
 lbsr givd
 leau fn_ln2,pcr
 lbsr ldarg
 lbsr fmul
 ldu #FNX
 lbsr ldarg
 lbsr fsub
 ldu #FNX
 lbsr stfac
 leau fn_one,pcr
 lbsr ldfac
 ldu #FNT
 lbsr stfac
 ldu #FNS
 lbsr stfac
 ldd #1
 std FNN
2 ldu #FNT
 lbsr ldfac
 ldu #FNX
 lbsr ldarg
 lbsr fmul
 lbsr fac2arg
 ldd FNN
 lbsr givd
 lbsr fdiv
 ldu #FNT
 lbsr stfac
 ldu #FNS
 lbsr ldarg
 lbsr fadd
 ldu #FNS
 lbsr stfac
 ldd FNN
 addd #1
 std FNN
 cmpd #16
 blo 2B
 clra
 ldb FACEXP
 addd FNK
 lble fn_clear
 cmpd #255
 lbgt err_ov
 stb FACEXP
 rts
; החלפת FAC ו-ARG באמצעות המחסנית.
fn_swap lbsr pushfac
 lbsr arg2fac
 lbsr poparg
 rts
fn_log tst FACEXP
 lbeq err_fc
 tst FACSGN
 lbmi err_fc
 clra
 ldb FACEXP
 subd #$81
 std FNK
 lda #$81
 sta FACEXP
 ldu #FNX
 lbsr stfac
 leau fn_one,pcr
 lbsr ldarg
 lbsr fadd
 ldu #FNY
 lbsr stfac
 ldu #FNX
 lbsr ldfac
 leau fn_one,pcr
 lbsr ldarg
 lbsr fn_swap
 lbsr fsub
 ldu #FNY
 lbsr ldarg
 lbsr fn_swap
 lbsr fdiv
 lbsr fn_oddseries
 tst FACEXP
 beq 7F
 inc FACEXP
7
 ldu #FNS
 lbsr stfac
 ldd FNK
 lbsr givd
 leau fn_ln2,pcr
 lbsr ldarg
 lbsr fmul
 ldu #FNS
 lbsr ldarg
 lbra fadd
; סכום z+z^3/3+...+z^43/43; z קטן משליש בלוגריתם.
fn_oddseries ldu #FNT
 lbsr stfac
 ldu #FNS
 lbsr stfac
 lbsr fac2arg
 lbsr fmul
 ldu #FNY
 lbsr stfac
 ldd #3
 std FNN
1 ldu #FNT
 lbsr ldfac
 ldu #FNY
 lbsr ldarg
 lbsr fmul
 ldu #FNT
 lbsr stfac
 lbsr fac2arg
 ldd FNN
 lbsr givd
 lbsr fdiv
 ldu #FNS
 lbsr ldarg
 lbsr fadd
 ldu #FNS
 lbsr stfac
 ldd FNN
 addd #2
 std FNN
 cmpd #45
 blo 1B
 rts
fn_atn leau fn_one,pcr
 lbsr ldarg
 lbsr fcmp
 tsta
 bne 8F
 leau fn_pi4,pcr
 lbra ldfac
8 lda FACSGN
 pshs a
 clr FACSGN
 clr FNFLAGS
 leau fn_one,pcr
 lbsr ldarg
 lbsr fcmp
 cmpa #1
 bne 1F
 inc FNFLAGS
 lbsr fdiv
1 leau fn_tan8,pcr
 lbsr ldarg
 lbsr fcmp
 cmpa #1
 bne 2F
 lda #1
 sta FNFLAGS+1
 ldu #FNX
 lbsr stfac
 leau fn_one,pcr
 lbsr ldarg
 lbsr fadd
 ldu #FNY
 lbsr stfac
 ldu #FNX
 lbsr ldfac
 leau fn_one,pcr
 lbsr ldarg
 lbsr fn_swap
 lbsr fsub
 ldu #FNY
 lbsr ldarg
 lbsr fn_swap
 lbsr fdiv
 bra 3F
2 clr FNFLAGS+1
3 ldu #FNT
 lbsr stfac
 ldu #FNS
 lbsr stfac
 lbsr fac2arg
 lbsr fmul
 com FACSGN
 ldu #FNY
 lbsr stfac
 ldd #3
 std FNN
4 ldu #FNT
 lbsr ldfac
 ldu #FNY
 lbsr ldarg
 lbsr fmul
 ldu #FNT
 lbsr stfac
 lbsr fac2arg
 ldd FNN
 lbsr givd
 lbsr fdiv
 ldu #FNS
 lbsr ldarg
 lbsr fadd
 ldu #FNS
 lbsr stfac
 ldd FNN
 addd #2
 std FNN
 cmpd #49
 blo 4B
 tst FNFLAGS+1
 beq 5F
 leau fn_pi4,pcr
 lbsr ldarg
 lbsr fadd
5 tst FNFLAGS
 beq 6F
 leau fn_pi2,pcr
 lbsr ldarg
 lbsr fsub
6 puls a
 sta FACSGN
 rts
fn_cos lbsr fn_reduce
 leau fn_pi2,pcr
 lbsr ldarg
 lbsr fadd
 lbra fn_sin
fn_tan lbsr pushfac
 lbsr fn_sin
 lbsr poparg
 lbsr pushfac
 lbsr arg2fac
 lbsr fn_cos
 lbsr poparg
 lbra fdiv
; זוויות עצומות חורגות מדיוק צמצום הטווח בן 32 הביטים.
fn_reduce lda FACEXP
 cmpa #$90
 lbhi err_fc
 ldu #FNX
 lbsr stfac
 leau fn_twopi,pcr
 lbsr ldarg
 lbsr fn_swap
 lbsr fdiv
 lbsr fn_fix
 ldu #FNT
 lbsr stfac
 leau fn_tauhi,pcr
 lbsr ldarg
 lbsr fmul
 ldu #FNX
 lbsr ldarg
 lbsr fsub
 ldu #FNS
 lbsr stfac
 ldu #FNT
 lbsr ldfac
 leau fn_taulo,pcr
 lbsr ldarg
 lbsr fmul
 ldu #FNS
 lbsr ldarg
 lbsr fsub
 leau fn_pi,pcr
 lbsr ldarg
 lbsr fcmp
 cmpa #1
 bne 1F
 leau fn_twopi,pcr
 lbsr ldarg
 lbsr fn_swap
 lbsr fsub
1 leau fn_pi,pcr
 lbsr ldarg
 com ARGSGN
 lbsr fcmp
 cmpa #$ff
 bne 2F
 leau fn_twopi,pcr
 lbsr ldarg
 lbsr fadd
2 rts
fn_sin lbsr fn_reduce
 ldu #FNT
 lbsr stfac
 ldu #FNS
 lbsr stfac
 lbsr fac2arg
 lbsr fmul
 com FACSGN
 ldu #FNY
 lbsr stfac
 ldd #2
 std FNN
3 ldu #FNT
 lbsr ldfac
 ldu #FNY
 lbsr ldarg
 lbsr fmul
 lbsr fac2arg
 ldd FNN
 tfr b,a
 incb
 mul
 lbsr givd
 lbsr fdiv
 ldu #FNT
 lbsr stfac
 ldu #FNS
 lbsr ldarg
 lbsr fadd
 ldu #FNS
 lbsr stfac
 ldd FNN
 addd #2
 std FNN
 cmpd #28
 blo 3B
 rts
; מולד LFSR בן 32 ביט, פולינום $80200003, מחזור 2^32-1.
fn_rnd tst FACSGN
 bpl 1F
 lbsr qint
 ldd QN
 std FNSEED
 ldd QN+2
 std FNSEED+2
1 lbsr pushfac
 ldd FNSEED
 bne 2F
 ldd FNSEED+2
 bne 2F
 ldd #$1357
 std FNSEED
 ldd #$9bdf
 std FNSEED+2
2 ldb #32
3 lsr FNSEED
 ror FNSEED+1
 ror FNSEED+2
 ror FNSEED+3
 bcc 4F
 lda FNSEED
 eora #$80
 sta FNSEED
 lda FNSEED+1
 eora #$20
 sta FNSEED+1
 lda FNSEED+3
 eora #3
 sta FNSEED+3
4 decb
 bne 3B
 ldd FNSEED
 std FACM
 ldd FNSEED+2
 std FACM+2
 lda #$80
 sta FACEXP
 clr FACSGN
 clr FACOV
 lbsr fnorm
 lbsr poparg
 tst ARGSGN
 bmi 9F
 lda ARGEXP
 cmpa #$81
 blo 9F
 bhi 5F
 ldd ARGM
 cmpd #$8000
 bne 5F
 ldd ARGM+2
 beq 9F
5 lbsr fn_swap
 lbsr fn_fix
 lbsr fn_swap
 lbsr fmul
 lbsr fn_fix
 leau fn_one,pcr
 lbsr ldarg
 lbsr fadd
9 rts
fn_one fcb $81,$00,$00,$00,$00
fn_ln2 fcb $80,$31,$72,$17,$f8
fn_pi fcb $82,$49,$0f,$da,$a2
fn_pi2 fcb $81,$49,$0f,$da,$a2
fn_pi4 fcb $80,$49,$0f,$da,$a2
fn_twopi fcb $83,$49,$0f,$da,$a2
fn_tan8 fcb $7f,$54,$13,$cc,$d0
fn_tauhi fcb $83,$49,$00,$00,$00
fn_taulo fcb $77,$7d,$aa,$22,$17
