# Dragon 32 sound: reader facts (stage 3 part 4)

> Written 20.10.2026 by the reader (a separate Claude agent) from the original DragonBasic source. Facts only, in its own words: no code, no quotes. The writer builds from this file alone.

Source studied: the Dragon 64 BASIC listing. I read the 32K-mode machine module (SOUND, AUDIO, the sound-source helpers, the SOUND timer and the cold/warm start code), the shared graphics module (PLAY and its tables, plus the string scanner it shares with DRAW), the shared "extension" module (RUN defaults and the field-interrupt handler), the shared core (error handler, statement loop, byte-argument evaluation) and the OEM I/O module (PIA set-up, motor, joystick, printer). I also used the community reconstruction of the RAM-equate file. The sound part of the 32K-mode and 64K-mode machine modules is identical apart from one comment typo. I checked a few doubtful OCR digits against the page scans; they are marked "(scan-checked)". No source text, labels or instruction sequences are reproduced. Where I'm unsure, I say so.

Conventions: `$` means hex. "Field" means one video field interrupt. The Dragon is PAL, so that's **50 per second** (20 ms). "Cycles" means E-clock (CPU) cycles. CPU clock = SAM crystal ÷ 16. For a Dragon with a 14.218 MHz crystal that's **888,625 Hz**. All Hz figures below use that clock. Multiply by 1.0070 for a 14.31818 MHz machine. "DAC value" means the byte written to $FF20. The 6-bit DAC level is that byte shifted right by 2.

---

## 0. Global facts

### 0.1 Sound RAM variables (direct page)

| Addr | Size | Meaning |
|---|---|---|
| $8C | 1 | SOUND: last tone value (1–255). It's written as soon as the tone argument passes its checks, even if the duration argument then fails. |
| $8D–$8E | 2 | SOUND countdown, in fields (big-endian). It's set to 4 × duration and decremented by the field interrupt while it's non-zero. It's 0 when SOUND returns. |
| $D5–$D6 | 2 | PLAY: per-field "amount to subtract" = note length × tempo (16-bit). It's a temporary shared with DRAW and other graphics/PRINT USING code. It's only meaningful while a note is sounding. |
| $D7 | 1 | PLAY/DRAW number scanner: the digit being added (temporary) |
| $D8 | 1 | PLAY/DRAW: characters left in the current string (shared with DRAW) |
| $D9–$DA | 2 | PLAY/DRAW: pointer to the next character (shared with DRAW) |
| $DE | 1 | PLAY octave, stored as **(O value − 1)**, so 0–4 |
| $DF | 1 | PLAY "high" DAC byte |
| $E0 | 1 | PLAY "low" DAC byte |
| $E1 | 1 | PLAY note length L (1–255) |
| $E2 | 1 | PLAY tempo T (1–255) |
| $E3–$E4 | 2 | PLAY note countdown (16-bit). It's non-zero only while a note or pause is sounding. The field interrupt uses it to tell whether PLAY or SOUND owns the timer. |
| $E5 | 1 | PLAY dot count, set by the dots after an L command |
| $E6–$E7 | – | Not used by PLAY (no equate exists for them) |
| $0112–$0113 | 2 | The TIMER tick counter. The same field interrupt increments it every field, before the sound timing work. |

Nothing outside PLAY writes $DE–$E2 or $E5. The DRAW angle and scale are at $E8/$E9.

### 0.2 Defaults

The "PLAY/DRAW defaults" routine runs at **cold start** and at **every RUN**. That includes RUN with a line number. It runs just after RUN's own RAM hook and before files are closed. It sets:

- $DF = **$B8** (184) and $E0 = **$44** (68). In 6-bit DAC terms that's high 46 and low 17, around a centre of 31. Read back as a volume this counts as **V15**. But it is *not* byte-identical to what an explicit V15 stores (see 2.4).
- $E2 (tempo) = **2**.
- $DE (octave) = **2**, which means **O3**. This is the octave whose C is about 260 Hz (middle C). The comment in the source calls it "the middle C octave". **So the effective default is O3, not O2** (scan-checked).
- $E1 (length) = **4**.
- $E5 (dots) = 0.

What does *not* reset the PLAY settings:

- NEW and CLEAR leave all of them alone.
- The warm-restart (reset button) path also leaves them alone. It only zeroes $E3–$E4, so that a note cut off by reset isn't "still playing", and it re-enables the field interrupt.

At cold start, RAM $0000 up to the screen is zeroed first, so $8C–$8E start at 0.

### 0.3 Hardware bits involved

| Where | Bit | Role in sound |
|---|---|---|
| $FF20 (PIA1 port A data) | 7–2 | 6-bit DAC. Every sound write stores the whole byte. |
| $FF20 | 1 | Printer strobe (inverted externally). The sound code writes this bit too (see 2.4). |
| $FF20 | 0 | Cassette input. It's set as an input, so writes don't affect it. |
| $FF01 (PIA0 CR A) | 3 | CA2 = sound-source select line 1 ("SEL1") |
| $FF03 (PIA0 CR B) | 3 | CB2 = sound-source select line 2 ("SEL2") |
| $FF03 | 0 | Enables the field-sync interrupt (CB1 → IRQ) |
| $FF03 | 7 | Field-sync flag. It's cleared by reading $FF02. |
| $FF23 (PIA1 CR B) | 3 | CB2 = **sound enable** (sound to the TV / speaker) |
| $FF21 (PIA1 CR A) | 3 | CA2 = cassette motor |

Source selection by (SEL2, SEL1): **(0,0) = DAC**, (0,1) = cassette input. The other two sources (cartridge sound and the remaining one) are never selected by BASIC's sound commands. Writes to these control registers always read, modify one bit, and write back. All other bits are preserved.

Power-on hardware state comes from the OEM hardware-init routine:

- Both PIAs' control registers are set to $34. That gives CA2/CB2 as outputs held low, so SEL1 = SEL2 = 0, sound disabled, motor off. Interrupt enables are off.
- $FF20 is written 0.
- Later, BASIC sets $FF03 bit 0, which turns on the field interrupt. Both cold start and warm restart do this.
- The IRQ vector in RAM points at BASIC's field-interrupt handler.

---

## 1. SOUND tone,duration

### 1.1 Parsing and errors (all happen before any sound)

1. The tone is evaluated as a numeric expression, then converted to a byte:
   - A negative value gives **?FC**. That includes −0.5, because the test is the sign of the float.
   - Otherwise the value is truncated toward zero. Above 255 gives ?FC. A result of 0 gives ?FC.
   - So the accepted range is 1–255. For example, 0.9 → 0 → ?FC, and 255.9 → 255.
   - A string gives a type-mismatch error.
2. The tone byte is stored in $8C.
3. A comma is required. Without it you get ?SN.
4. The duration is evaluated with exactly the same byte rules: 1–255, truncated, ?FC otherwise.
5. Nothing after the duration is checked by SOUND. Trailing garbage gives ?SN from the main statement loop, *after* the sound has played.

Any error goes through the general error routine. Among other things, that routine:
- turns the **cassette motor off** and re-enables IRQ/FIRQ;
- clears **sound enable** ($FF23 bit 3).

So after SOUND 1,0, for example: $8C = 1, no tone has sounded, sound is disabled, and the motor is off.

### 1.2 Hardware sequence

In this order:

1. $8D–$8E = duration × 4. The maximum is 1020.
2. $FF03 bit 0 is set, which makes sure the field interrupt is enabled. SOUND doesn't touch the CPU's interrupt mask. Interrupts are already enabled, because the statement loop clears both I and F before each statement.
3. SEL1 is cleared ($FF01 bit 3 = 0), then SEL2 is cleared ($FF03 bit 3 = 0). This selects the DAC.
4. Sound enable is set ($FF23 bit 3 = 1).
5. The tone loop runs (1.3) until $8D–$8E reads 0. The check comes after each full waveform cycle.
6. Sound enable is cleared ($FF23 bit 3 = 0). The select lines stay at DAC.

Final state:
- $FF20 = **$00**, because the last level written is the bottom one.
- $8D–$8E = 0 and $8C = tone.
- Select lines = DAC, sound enable = 0, $FF03 bit 0 = 1.

### 1.3 Waveform and frequency

Each cycle is a 4-step wave written to $FF20: **$7C (centre, DAC 31) → $FC (top, DAC 63) → $7C → $00 (bottom, DAC 0)**. That's full amplitude. Bits 0–1 are 0 in all four bytes.

After each write there's a busy loop of N = 256 − tone iterations, at 5 cycles per iteration. The time from each write to the next is:

| Level held | Cycles |
|---|---|
| centre (1st) | 23 + 5N |
| top | 23 + 5N |
| centre (2nd) | 23 + 5N |
| bottom (includes the end-of-cycle timer check) | 31 + 5N |

- **Period = 100 + 20·N cycles = 100 + 20·(256 − tone)**
- **Frequency = clock / period**

| Tone | N | Period (cycles) | Hz @ 888,625 |
|---|---|---|---|
| 1 | 255 | 5200 | 170.9 |
| 89 | 167 | 3440 | 258.3 |
| 100 | 156 | 3220 | 276.0 |
| 128 | 128 | 2660 | 334.1 |
| 200 | 56 | 1220 | 728.4 |
| 255 | 1 | 120 | 7405 |

The field interrupt steals roughly 110–125 cycles once per field from whichever segment is running (my estimate; see section 8). That makes one waveform step per 20 ms slightly longer.

### 1.4 Duration

- It's counted only by the field interrupt, at 4 fields per duration unit. On PAL that's **80 ms per unit**. The source's comments assume 60 Hz, which would be 66.7 ms. No PAL correction exists.
- The tone starts at an arbitrary point within a field. So the real length is between (4d − 1) and 4d fields, plus up to one waveform period, because the loop finishes the current cycle.
- Examples: d = 1 → 60–80 ms. d = 16 → 1.26–1.28 s. d = 255 → about 20.4 s.

### 1.5 BREAK

- Nothing in SOUND reads the keyboard.
- The keyboard isn't scanned by the interrupt either. The field interrupt only does the TIMER tick and the sound/PLAY timing.
- BREAK is only noticed by the normal per-statement keyboard poll *after* SOUND returns. That poll sees a key only if it's still down at that moment, as a new key press.
- So BREAK pressed and released during SOUND is lost. If it's held until the tone ends, the program stops with BREAK before the next statement.

### 1.6 Second entry point

The routine has a second public entry point just after argument parsing. It takes the duration in a register and uses whatever tone is already in $8C. BASIC itself never uses it in this listing. It may exist for external software, because the 32K-mode ROM pads one byte "for address compatibility" right in this routine. The writer may want to keep entry addresses compatible if that's a goal (I can't give the absolute address).

---

## 2. PLAY string

### 2.1 Statement flow

1. A dummy "outer level" record is pushed on the CPU stack: length 1, pointer 0. Each nesting record is 3 bytes, a length byte plus a pointer.
2. The argument expression is evaluated.
3. **SEL1 and SEL2 are cleared (DAC selected) and sound enable is set**, *before* the result is checked as a string.
4. If the result isn't a string, you get a type-mismatch error. The error handler then turns sound off again.
5. The string's temporary descriptor is released. Its length and pointer become the current scan state ($D8, $D9–$DA).
6. A zero-length string just pops one level. When the popped record is the dummy (pointer 0), PLAY ends: sound enable is cleared and the statement returns. So PLAY "" does nothing audible.
7. Final RAM after a normal end: $D8 = 1 and $D9–$DA = 0 (the dummy record), $E3–$E4 = 0, and $D5–$D6 = the last length × tempo.
8. Sound enable stays **on for the whole PLAY**, including parsing between notes. Notes follow each other with no gap other than parsing time.
9. $FF20 is left at whatever level was being output when the last note was cut (see 2.6), or $7C after a pause.

### 2.2 Character scanner (shared with DRAW)

- Fetching a character always skips spaces, everywhere, including inside numbers. So "T1 2" means T12, and "C #" means C#.
- Fetching when nothing is left gives **?FC**. That's how "L" at the very end of the string, "X" without a name, and so on, fail.
- Between commands, **`;` and `'` (single quote) are ignored**. Anywhere else they're just unexpected characters.
- There's no case folding. Lower-case letters give ?FC.
- When the current string ends, the scanner pops back to the enclosing X level.
- The following are shared with DRAW: the character fetch and put-back, the numeric-argument reader (2.3), the variable-name reader used by "=" and X, and the X nesting mechanism (DRAW has its own copy of the X push logic, but it uses the same name reader).

### 2.3 Numeric arguments

For O, V, L and T, the character after the command letter decides the form:

| Form | Meaning | Error |
|---|---|---|
| `+` | current value + 1 | ?FC if that wraps 255 → 0 |
| `-` | current value − 1 | ?FC if the current value is 0 |
| `>` | current value × 2 | ?FC if the current value ≥ 128 |
| `<` | current value ÷ 2 (truncated) | ?FC if the current value is 0 |
| `=name;` | value of a numeric variable (2.7) | – |
| digits | decimal constant | – |

- A decimal constant is read digit by digit. ?FC is given as soon as the value would exceed 255.
- The number ends at the first non-digit, which is put back for the next command. It also ends at the end of the string.
- Anything else after the command letter (for example `;`, a letter, or nothing) gives **?FC**.
- After this the command applies its own range check (2.4).
- "Current value" means the user-visible value: octave + 1, the volume read back from $DF, L, or T.

P and note numbers accept **only** `=name;` or digits. There's no + − < >.

### 2.4 Commands

- **O n**: octave 1–5. The value is stored minus 1 in $DE. Out of range (0, or 6 and up) gives ?FC, and the octave is unchanged.
- **V n**: volume 0–31.
  - Above 31 gives ?FC.
  - The stored bytes are **high = 126 + 4·V** and **low = 124 − 4·V**.
  - In 6-bit DAC terms that's centre 31, high 31 + V, low 31 − V.
  - Because high = 126 + 4V, the high byte always has **bit 1 set**. That bit is the printer strobe line on $FF20, so every high step of every note played after an explicit V command toggles the printer strobe. The boot default high byte ($B8) has bit 1 clear.
  - When V+/V−/V</V> need the current volume, it's read back as (high byte ÷ 4) − 31.
  - Examples:

    | V | high byte | low byte |
    |---|---|---|
    | 0 | $7E | $7C (silent in DAC terms) |
    | 7 | $9A | $60 |
    | 15 | $BA | $40 |
    | 31 | $FA | $00 |
    | boot default | $B8 | $44 |

- **L n**: length 1–255. 0 gives ?FC.
  - After the number, any run of `.` characters is counted. The **dot count is reset to 0 by every L** and then incremented once per dot. Spaces between dots are skipped.
  - Dots are accepted **only** right after an L argument. A `.` anywhere else (for example "C.") gives ?FC.
  - The dot count persists: it applies to every following note until the next L.
- **T n**: tempo 1–255. 0 gives ?FC. 155, 156 and 255 are all fine.
- **P n**: pause 1–255.
  - P0, P with + − < >, or P with nothing after it gives ?FC.
  - The pause is played as a silent "note C" in the current octave: high = low = $7C, so the DAC holds 31 throughout. The dot count is treated as 0.
  - The length is the pause value in place of L, at the current tempo.
  - Afterwards the volume bytes and dot count are restored. L is not changed by P.
- **N**: an optional prefix before a note (letter or number). It's skipped, and the next character is taken as the note. "N" at the end of the string gives ?FC.
- **A–G**: note letters. They map to semitone numbers C=1, D=3, E=5, F=6, G=8, A=10, B=12.
  - If anything follows, one character is looked at: `#` or `+` = sharp (+1), `-` = flat (−1). Anything else is put back.
  - The result minus 1 must be 0–11, otherwise ?FC. So **B# and C- give ?FC** in every octave (there's no octave carry). E# = F and F- = E.
- **Numbered notes 1–12** (1 = C … 12 = B):
  - Digits, or `=name;` (also reached with no N prefix, since `=` isn't a command letter).
  - 0 or 13+ gives ?FC.
  - No sharp/flat suffix is examined, so a following `#` is treated as the next command and gives ?FC.
- **X name;**: run a string variable as a sub-string (2.7).
- Any other character gives ?FC. It goes through the numeric reader, which rejects it.

**The errors are only noticed as the scan reaches them.** All earlier commands have already taken effect: notes before the error have already sounded, and settings changed before it stay changed. The error routine then clears sound enable and turns the motor off.

### 2.5 Pitch tables

A note's index is 0–11 (C … B).

For **octaves 1–2** there's a table of 16-bit loop counts, 12 per octave:

| | C | C# | D | D# | E | F | F# | G | G# | A | A# | B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| O1 | 424 | 400 | 378 | 356 | 336 | 317 | 299 | 282 | 266 | 251 | 237 | 223 |
| O2 | 211 | 199 | 187 | 177 | 166 | 157 | 148 | 139 | 131 | 124 | 117 | 110 |

For **octaves 3–5** there's a table of 8-bit loop counts, 12 per octave:

| | C | C# | D | D# | E | F | F# | G | G# | A | A# | B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| O3 | 166 | 156 | 147 | 139 | 131 | 123 | 116 | 109 | 103 | 97 | 91 | 86 |
| O4 | 81 | 76 | 71 | 67 | 63 | 59 | 55 | 52 | 49 | 46 | 43 | 40 |
| O5 | 38 | 35 | 33 | 31 | 29 | 27 | 25 | 24 | 22 | 20 | 19 | 18 |

(The note-letter map is 7 bytes, the low table is 48 bytes and the high table is 36 bytes.)

### 2.6 Tone generation

Each note has the same 4-step shape as SOUND: **$7C → high byte → $7C → low byte**, repeated. Each write is followed by a delay loop using the table count.

**Octaves 1–2 (16-bit count n, 8 cycles per iteration):**

| Level held | Cycles |
|---|---|
| centre | 26 + 8n |
| high | 26 + 8n |
| centre | 26 + 8n |
| low | 29 + 8n |

**Period = 107 + 32·n cycles.**

**Octaves 3–5 (8-bit count m, 5 cycles per iteration):**

| Level held | Cycles |
|---|---|
| centre | 25 + 5m |
| high | 25 + 5m |
| centre | 25 + 5m |
| low | 28 + 5m |

**Period = 103 + 20·m cycles.**

Resulting frequencies (Hz at 888,625 Hz; field-interrupt stealing ignored):

| | C | C# | D | D# | E | F | F# | G | G# | A | A# | B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| O1 | 65.0 | 68.8 | 72.8 | 77.3 | 81.8 | 86.7 | 91.8 | 97.3 | 103.1 | 109.2 | 115.5 | 122.7 |
| O2 | 129.6 | 137.2 | 145.9 | 154.0 | 164.0 | 173.2 | 183.5 | 195.1 | 206.7 | 218.1 | 230.8 | 245.0 |
| O3 | 259.6 | 275.7 | 292.0 | 308.2 | 326.3 | 346.7 | 366.7 | 389.2 | 410.8 | 435.0 | 462.1 | 487.5 |
| O4 | 515.7 | 547.5 | 583.5 | 615.8 | 652.0 | 692.6 | 738.7 | 777.4 | 820.5 | 868.6 | 922.8 | 984.1 |
| O5 | 1029.7 | 1106.6 | 1164.6 | 1229.1 | 1301.1 | 1382.0 | 1473.7 | 1524.2 | 1636.5 | 1766.7 | 1839.8 | 1919.3 |

These are roughly equal-tempered, a little flat. O3 C ≈ middle C, O3 A ≈ 435 Hz.

The tone loop never ends by itself. The field interrupt ends it (2.8), so a note is cut at an arbitrary point in its waveform. The next note always starts with a centre write.

### 2.7 Variables in the string: "=name;" and "X name;"

- The name must start with a letter, otherwise ?FC.
- The scanner then skips forward to the next `;`. A missing `;` gives ?FC, from running off the end of the string.
- The variable is then looked up by the interpreter's normal name parser, starting at the name's first character in the string. The usual rules apply: two significant characters, and `$` for strings. Anything between the parsed name and the `;` is skipped and ignored.
- An undefined variable is **not created**. It reads as 0, or as the empty string.
- **=name;** must be numeric. A string gives type-mismatch. The value goes through the same byte conversion as SOUND: negative or above 255 gives ?FC, and fractions are truncated. Then the command's own range check applies.
- **X name;** must be a string variable. A numeric one gives type-mismatch.
  - There must be stack room for 2 more words above a 58-byte safety margin, otherwise **?OM**.
  - The current remaining length and pointer (3 bytes) are pushed on the CPU stack, and scanning switches to the variable's string.
  - When that string is used up, the saved position is popped and scanning resumes after the `;`.
  - An empty or undefined string just returns immediately.
  - **Nesting has no fixed limit.** It's bounded only by free memory. Self-recursion (A$ containing "XA$;") ends in ?OM.

### 2.8 Note timing

1. The per-field step is $D5–$D6 = **L × T** (a 16-bit product; for a pause, P × T).
2. The starting count in $E3–$E4 is **255** for an undotted note. With k dots it's **⌊(k + 2) × 255 / 2⌋**: 382 for one dot, 510 for two, 637 for three. So two dots doubles the note; it doesn't make it 1.75 times as long. (The 255 is scan-checked; the OCR hex column was wrong.)
3. Every field interrupt subtracts the step from the count, as a 16-bit unsigned subtraction. While the result is still above 0, the note continues. When it would reach 0 or go below, the count is set to 0 and the note ends.
4. So **a note lasts n = ⌈start ÷ (L·T)⌉ fields**. The first field is partial, so the real length is between n − 1 and n fields.
5. The minimum is 1 field. Any L·T of 255 or more gives a single-field blip (0–20 ms).

The end of a note is forced from inside the interrupt:
- The note routine records, before it starts, where its caller's return address is on the stack.
- When the count expires, the interrupt handler discards the interrupted registers and returns straight to that caller. Only the condition codes and program counter are kept, and DP is forced to 0.
- The writer can do this any way that gives the same result: the tone stops at the field interrupt, and parsing resumes.

Durations at 50 Hz:

| Note | Fields | Time |
|---|---|---|
| L4 T2 | ⌈255/8⌉ = 32 | ≈0.64 s |
| L4. | 48 | ≈0.96 s |
| L4.. | 64 | ≈1.28 s |
| L8 | 16 | ≈0.32 s |
| L1 T1 | 255 | 5.1 s |
| T1 L4 | 64 | – |
| T4 L4 | 16 | – |

The source's comments assume 60 fields per second. There's no PAL compensation, so everything is 20% longer than on an NTSC machine.

### 2.9 BREAK and interrupts during PLAY

- PLAY never checks the keyboard. A long PLAY can only be stopped by reset, or by an error in the string.
- BREAK is seen afterwards only if still held (as in 1.5).
- PLAY does **not** set $FF03 bit 0 itself; it relies on the field interrupt already being on. If a program had switched it off (by POKE), the first note would never end.
- PLAY relies on IRQ being unmasked too. The statement loop guarantees that.

---

## 3. AUDIO ON / AUDIO OFF

- The token after AUDIO is consumed first.
- **OFF**: sound enable is cleared ($FF23 bit 3 = 0). **The select lines are not changed.**
- **ON**: SEL1 is set ($FF01 bit 3 = 1) and SEL2 is cleared ($FF03 bit 3 = 0), which selects the cassette input. Then sound enable is set.
- Anything else, including nothing, gives **?SN**. Trailing text after ON/OFF gives ?SN from the statement loop, after the action.
- AUDIO never touches the motor bit, and MOTOR never touches the select lines or sound enable.
  - MOTOR ON sets $FF21 bit 3 and then waits about half a second (a RAM-held delay count) for the motor to spin up.
  - MOTOR OFF clears $FF21 bit 3 and unmasks IRQ/FIRQ.
- Interaction with SOUND/PLAY:
  - Both force the select lines back to the DAC and clear sound enable when they finish.
  - So after "AUDIO ON : SOUND …" or "… PLAY …", the cassette audio is **no longer** routed to the TV.
  - Any BASIC error also clears sound enable and switches the motor off.
- Reading the joysticks (JOYSTK(0) reads all four) rewrites both select lines and writes trial values to the DAC. It finishes with joystick 0's selection, (0,0) = DAC. So after AUDIO ON, a JOYSTK(0) call silently swaps the audio source to the DAC while sound enable stays on.
- The cassette read and write routines don't change the select lines or sound enable. Cassette output is written to the DAC directly.

---

## 4. Shared helpers, initialisation and interrupts

- **Select helper**: takes a 2-bit source number. Bit 0 goes to SEL1 ($FF01 bit 3) and is written first; bit 1 goes to SEL2 ($FF03 bit 3) and is written second. Each is a read-modify-write that changes only bit 3.
- **Sound on/off helper**: read-modify-write of $FF23 that changes only bit 3.
- **Field interrupt (IRQ)**:
  1. If $FF03 bit 7 isn't set, it returns at once.
  2. Otherwise it reads $FF02, which clears the flag.
  3. It increments the TIMER counter ($0112–$0113, wrapping).
  4. If the PLAY countdown $E3–$E4 is non-zero, it does the PLAY step (2.8).
  5. Otherwise, if the SOUND countdown $8D–$8E is non-zero, it decrements that.
  6. Then it returns.
  So PLAY and SOUND never run together. A SOUND countdown is frozen while a PLAY note is sounding.
- **FIRQ** is the cartridge interrupt only. It's not used for sound.
- **Interrupt mask**: nothing in SOUND or PLAY masks or unmasks interrupts. They run with IRQ and FIRQ enabled, because the statement loop clears both masks before each statement. Cassette I/O masks them while it runs, and unmasks them when the motor is switched off.
- **Boot**: the hardware init sets both PIAs to $34 and $FF20 = 0. BASIC init then runs the PLAY defaults (0.2) and sets $FF03 bit 0. The warm restart zeroes $E3–$E4 and sets $FF03 bit 0 again.
- **DAC sharing**: the DAC at $FF20 bits 2–7 is shared by SOUND, PLAY, cassette output and joystick reading. $FF20 bit 1 (printer strobe) is written by every one of them. SOUND, pauses and the default volume write it as 0. Explicit V volumes write it as 1 on high steps.

---

## 5. Dragon 32 vs Dragon 64, and PAL

- The sound code in the 32K-mode module and the 64K-mode module is identical.
- The PLAY code sits in the shared graphics module, assembled unchanged into both ROMs.
- The only nearby difference is in the warm-restart path. The 32K-mode version adds a leading no-op and a final screen clear. Both clear the PLAY countdown and re-enable the field interrupt.
- All timing is counted in video fields. The Dragon's field interrupt is 50 Hz, but the code and comments assume 60 Hz, so durations come out 1.2 times the NTSC values:
  - SOUND: one unit is 80 ms, not 66.7 ms.
  - PLAY: L4 T2 is 0.64 s, not 0.53 s.
- The pitch loops are pure CPU-cycle counts. They scale with the CPU clock: 888.6 kHz on the Dragon versus 894.9 kHz on the CoCo, about 0.7% lower.
- I can't confirm from this listing that the real 1982 Dragon 32 ROM is byte-identical here. I'd expect the behaviour to match (see 8).

---

## 6. Sizes in the original ROM

| Part | Bytes |
|---|---|
| SOUND + AUDIO + select helper + sound on/off + SOUND timer step (one block, includes the non-zero-byte argument helper) | **127** |
| PLAY code (statement, scanner, argument reader, variable/X handling, tone loops, interrupt note step) | **569** |
| PLAY tables (7 + 48 + 36) | **91** |
| PLAY total | **660** |
| PLAY share of the RUN/cold-start defaults routine | ~16 |
| Hook in the field-interrupt routine | 3 |
| Warm-restart countdown clear | 4 |
| Value-reader entry used by P (shared with DRAW) | 6 |

Token-table entries and dispatch addresses are extra.

---

## 7. Answers to the open test items (per the source)

**S-01** (tone, waveform, duration):
- All three use the 4-step full-amplitude wave $7C/$FC/$7C/$00.

| Command | Frequency | Duration |
|---|---|---|
| SOUND 1,16 | 5200-cycle period, ≈170.9 Hz | 64 fields ≈ 1.26–1.28 s |
| SOUND 89,16 | 3440 cycles, ≈258.3 Hz | same |
| SOUND 255,16 | 120 cycles, ≈7.4 kHz | same |

**S-02** (SOUND 100,d — 3220-cycle period, ≈276 Hz):

| d | Fields | Time |
|---|---|---|
| 1 | 4 | 60–80 ms |
| 16 | 64 | ≈1.28 s |
| 255 | 1020 | ≈20.4 s |
| 1.5 | truncated to 1, so the same as d = 1 | 60–80 ms |

**S-03** (SOUND argument errors):
- SOUND 0,1, 256,1 and −1,1 all give ?FC before any sound. $8C is unchanged.
- SOUND 1,0 and 1,256 give ?FC after $8C has been set to 1. There's no sound.
- In every case, after the error: sound enable is 0, the motor is off, and the select lines are unchanged.

**S-04** (BREAK during SOUND 100,64):
- The tone plays its full 256 fields (≈5.1 s) regardless of BREAK.
- If BREAK was released early, it's ignored and line 20 prints AFTER.
- If it's still held when the tone ends, the program breaks before line 20. The message shows the line just finished, which I believe is 10.

**S-05** (default settings vs explicit):
- PLAY "CDE" at power-on plays **O3** C/D/E: 259.6/292.0/326.3 Hz, 32 fields each. DAC levels are high $B8, centre $7C, low $44.
- PLAY "O2L4T2V15CDE" plays an octave lower: 129.6/145.9/164.0 Hz, same lengths. The bytes are high $BA and low $40, a tiny level difference, plus the printer-strobe bit on high steps.
- **These are not the same sound.**

**S-06** (sharps, flats, edges):

| Note | Frequency |
|---|---|
| O2 C | 129.6 Hz |
| C# | 137.2 Hz |
| D- (same count as C#) | 137.2 Hz |
| D | 145.9 Hz |
| O3 C | 259.6 Hz |

- O2B# and O2C- both give ?FC; there's no wrap into the next octave. Anything earlier in the string has already played.

**S-07** (L4, L4., L8, L4.. at T2):

| Length | Fields | Time |
|---|---|---|
| L4 | 32 | 0.64 s |
| L4. | 48 | 0.96 s |
| L8 | 16 | 0.32 s |
| L4.. | 64 | 1.28 s (twice L4) |

**S-08** (tempo, volume, pause):
- O2L4T1V15C: 64 fields.
- …T4…C: 16 fields.
- V1: high $82, low $78 (DAC 32/30).
- V31: $FA/$00 (DAC 62/0).
- CP4C: the pause is 32 fields of steady $7C, and no sound in between.
- Numbered notes "1"–"12" equal C–B in the current octave.

**S-09** (variables and X):
- A$="CDE":PLAY A$ is the same as PLAY "CDE".
- PLAY "O2L4T2V15XA$;" plays O2 C D E. Afterwards the settings are O2/L4/T2/V15 (explicit-V bytes) and $D8/$D9–$DA end as 1/0.

**S-10** (persistence):
- After PLAY "O3L8T4V7C": $DE = 2, $DF = $9A, $E0 = $60, $E1 = 8, $E2 = 4, $E5 = 0.
- PLAY "D" then plays O3 D (292 Hz) for 8 fields at V7.
- **The same happens after NEW or CLEAR** in between. Only RUN or a cold start brings back the defaults.

**S-11** (range limits and errors):
- O0, O6, L0, T0 and V32 each give ?FC before the C, so no C sounds.
- T155, T156, T255 and V0 are all accepted.
  - T255 makes the C a single-field blip.
  - V0 makes it silent on the DAC, though bit 1 still toggles.
- PLAY "O2CQD": the C plays in full (32 fields with L4 T2), then **?FC** at Q. D never plays.
- After any of these errors: sound enable is off, the motor is off, and any settings changed before the error stay changed.

**S-12** (AUDIO and MOTOR):

| After | SEL1 | SEL2 | Enable | Motor |
|---|---|---|---|---|
| AUDIO ON | 1 | 0 | 1 | unchanged |
| AUDIO OFF | 1 (stays) | 0 | 0 | unchanged |
| MOTOR ON | – | – | – | 1 (after a ~0.5 s wait) |
| MOTOR OFF | – | – | – | 0 |

- MOTOR doesn't touch the select lines or sound enable.
- AUDIO ON followed by SOUND or PLAY: the sound plays from the DAC. At the end the select lines are DAC (0,0) and enable is 0, so the cassette audio is off.
- The 1 kHz test-tone path (cassette in → TV) is heard only between AUDIO ON and the next SOUND, PLAY, JOYSTK(0), error or AUDIO OFF.

---

## 8. Things I'm unsure of

- **Interrupt overhead:** the exact cycles each field interrupt steals. My estimate is about 105–125 cycles per field: the IRQ entry and exit, the jump through the RAM vector, the TIMER increment, and the PLAY or SOUND step. It lengthens one waveform step every 20 ms, so measured pitch is slightly lower than the tables above, mostly at high notes and high SOUND values.
- **CPU clock:** I've assumed SAM crystal ÷ 16 with a 14.218 MHz crystal. If a given Dragon 32 uses 14.31818 MHz, all frequencies are 0.7% higher.
- **The real 1982 Dragon 32 ROM:** I assume it matches this 32K-mode listing for sound. The byte "wasted for address compatibility" in SOUND suggests the layout was kept deliberately.
- **Default volume:** that the boot bytes ($B8/$44) really differ from an explicit V15 ($BA/$40) is clear in the source (scan-checked $B8/$44). The audible effect is a one-step difference in the low level, and I can't say whether it's measurable.
- **Printer strobe:** bit 1 of $FF20 is described in the OEM code as the printer strobe. What a connected printer does when PLAY toggles it, I can't tell from the source.
- **BREAK message:** whether the line reported after BREAK at the end of SOUND is the SOUND line or the next one. It's raised at the start of the next statement, and I believe it names the line just finished.
- **Arrays in "=name;" and "X name;":** the normal name parser is used, so an array element like `=A(1);` may evaluate the subscript from the PLAY string. I didn't trace that path.
- **RUN "file":** whether RUN with a file name reaches the defaults routine depends on RUN's RAM hook (the DOS). Plain RUN always does.

---

## 9. Follow-up answers (writer's questions)

### 9.1 How a note is aborted

**Where the caller's position is recorded:**
- **No RAM address is used.** The note routine keeps the position in the CPU's **U register**.
- Just before the note starts, U is set to point at the stack slot holding the return address to the routine that called the note. That caller is the command dispatcher for a note, or the P handler for a pause.
- Nothing else in RAM holds this value. The tone loops never touch U.
- When the field interrupt arrives, the CPU saves the full register set, so the saved U sits inside the interrupt frame. The frame order from the lowest address up is CC, A, B, DP, X (2 bytes), Y (2), U (2), PC (2).

**What the interrupt handler does when the count expires:**
1. It sets the count $E3–$E4 to 0.
2. It removes the saved CC byte from the frame and keeps it.
3. It loads the stack pointer from the saved U value in the frame. This throws away the rest of the frame and every intermediate return address, so the stack now points at the caller's return address.
4. It takes the **CC from the interrupt frame**, clears only bit 7 (the "entire state saved" flag), and pushes that one byte just below the return address.
5. It executes a return-from-interrupt. Because bit 7 is now clear, the CPU restores only CC and PC. PC is the caller's return address.

**State when the caller resumes:**
- **IRQ is unmasked.** The saved CC had I = 0, because the interrupt could only be taken with I clear. F is as it was, normally 0.
- The arithmetic flags are whatever they were when the interrupt hit. Neither caller depends on them: both continue unconditionally.
- A, B, X, Y and U are left as the handler had them, which is garbage. Neither caller relies on them.
- DP is 0, because the handler set DP to 0 on entry and DP isn't restored. BASIC's normal DP is 0 anyway.

### 9.2 Dot-count arithmetic

- The dot count ($E5) is **8-bit**. Each dot increments it, wrapping 255 → 0.
- **k = 0:** a separate path gives exactly 255. There's no multiply.
- **k ≥ 1, in this order:**
  1. An **8-bit** add: (k + 2) mod 256.
  2. An unsigned 8×8 multiply by 255, giving a 16-bit result.
  3. A **16-bit** logical shift right by 1.
- The result is the 16-bit start count.

| k | (k+2) mod 256 | Start count |
|---|---|---|
| 0 | – | 255 |
| 1 | 3 | 382 |
| 2 | 4 | 510 |
| 3 | 5 | 637 |
| 100 | 102 | 13005 |
| 253 | 255 | 32512 |
| 254 | 0 | **0** |
| 255 | 1 | 127 |
| 256 (wraps to 0) | – | 255 |

**What a start count of 0 does:** the interrupt treats a 0 count as "no note playing" and never ends the note. The tone would sound forever, until reset.

**In practice k ≥ 254 can't be reached:**
- Dots are counted only from the string that holds the L command. The dot scan stops at the end of the current string; it doesn't continue into the enclosing X level.
- A string is at most 255 characters. "L" plus one digit leaves room for at most 253 dots, and spaces use up characters too.
- So the real maximum is k = 253, giving 32512.

### 9.3 Variable lookup in "=name;" and "X name;"

- Both use the interpreter's **expression-side lookup**: the one the expression evaluator uses for a plain variable reference.
- In the general name search, the "not found" branch checks who called it. When the caller is that expression-side path, it returns a pointer to a shared two-byte zero constant in low RAM ($8A–$8B).
  - That zero reads as numeric 0 (exponent byte 0), or as an empty string (length byte 0).
  - **The variable table isn't touched. A missing simple variable leaves no trace.**
- The only side effects are in the parser's own scratch area, where the parsed name is held.
- Exception, which I haven't traced through PLAY: if the name is followed by "(", the array path is taken instead. A missing array may then be auto-dimensioned, as normal BASIC does for an undeclared array.
- **DRAW's "=name;" and "X name;"** call the very same shared name-reading routine, so the behaviour is identical: no creation, missing means 0 or empty.
- For X with a missing string, the zero constant is treated as an empty string, so it returns at once. Releasing the "temporary" is harmless, because that address isn't a temporary string.

### 9.4 Order of work inside a note

**For a note (letter or number):**
1. The 0–11 note index is checked and pushed on the stack. If it's out of range you get ?FC, and nothing below happens.
2. The step **L × T is computed and stored to $D5–$D6**. For a pause it's P × T.
3. **U is set** to the caller-return position (9.1).
4. The octave is examined, the table entry is located, and the note index is popped off the stack.
5. The start count is computed from the dot count (9.2) and **stored to $E3–$E4** with a single 16-bit store, high byte first. One instruction, so an interrupt can't split it.
6. The **first waveform write** follows immediately: the centre value $7C to $FF20.

Nothing else happens between these steps: no DAC write, and no change to sound enable or the select lines. Sound enable and the DAC selection were set once, at the start of the PLAY statement.

Any field interrupt that arrives before step 5 sees the count still 0. It treats that as "no note" and only services the SOUND countdown, which is normally 0. So a note's countdown starts with the first interrupt after step 5.

**For a pause:**
1. The current volume bytes and dot count are saved on the stack.
2. Both volume bytes are set to $7C and the dot count is set to 0.
3. Index 0 (C) is pushed.
4. Then it's the same as steps 2–6 above.
5. After the pause returns, the volume bytes and dot count are restored.

### 9.5 The field interrupt in detail

**Order in every field interrupt:**
1. Check the field flag. If it isn't set, return.
2. Read $FF02 to clear the flag.
3. **Increment TIMER.**
4. Set DP to 0.
5. Check the PLAY count.

**Confirmed: TIMER is already incremented for that field** before the PLAY step runs, including in the interrupt where the PLAY count expires.

**What happens at step 5:**
- **If the count is non-zero:** the step is subtracted.
  - If the count is still above 0, return.
  - Otherwise do the abort of 9.1.
  - In either case **the SOUND countdown isn't looked at in that interrupt.**
- **If the count is zero when the interrupt is entered:** the SOUND countdown ($8D–$8E) is decremented if it's non-zero, then return.

So the SOUND countdown never moves while a PLAY note or pause is sounding, and that includes the interrupt in which the note ends.
