# Dragon 1982 BASIC ROM (ניסוי)

BASIC משלנו למעבד 6809, שנטען במקום ה-ROM המקורי של ה-Dragon 32 (16K ב-$8000) ורץ באמולטור XRoar.

- **בנייה:** `rom/build.sh` (צריך `asm6809`: `brew install asm6809`).
- **בדיקות:** `node rom/tools/test.mjs` (צריך `xroar`: `brew install xroar`). XRoar רץ בלי חלון, והבדיקה קוראת את המסך דרך ממשק GDB שלו.
- **מסך ידני:** `xroar -machine dragon32 -extbas rom/build/d32.rom`.
- **מקור:** הכול נכתב מאפס. פורמט המספרים והאלגוריתמים לפי BASIC-M6502 של Microsoft (רישיון MIT, `LICENSE-MSBASIC`). אין כאן שום קוד או נתונים מה-ROM המקורי של Dragon Data או Microsoft.
