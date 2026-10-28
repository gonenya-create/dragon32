# מפת הכניסות הפנימיות של ה-ROM המקורי (דוח הקורא, 22.10.2026)

> **מה זה:** דוח של "הקורא" (סוכן Claude נפרד, בשיטת שני החדרים). הוא קרא את הקוד המקורי והחזיר **עובדות בלבד, במילים שלו**: כתובות, מה כל שגרה מקבלת ומחזירה, ואילו אוגרים היא משנה. אין כאן קוד, ציטוטים או העתקה של בתים.
> **בשביל מה:** השלב שבו משחקים בשפת מכונה, שקופצים לכתובות פנימיות ב-ROM, ירוצו במכונת ה-Dragon (גונן: "מאשר", 22.10).
> **שימו לב:** המקור הוא ה-ROM של Dragon 64 במצב 32K, שנשמר בכוונה תואם בכתובות ל-Dragon 32. לכן רוב הכתובות מסומנות "likely" עד שייבדקו במחשב אמיתי.
> **הדוח המשלים מחדר הספרים:** `docs/DRAGON-RESEARCH-ERA.md`. שני החדרים הגיעו לאותן כתובות בנפרד.

# Reader report — internal entry points of the original Dragon 32 BASIC ROM ($8000–$BFFF)

Reader: Claude (clean-room "reader"), 22.10.2026. Facts only, in my own words. No code, no instruction sequences, no quoted comments, no byte dumps.

## 0. Source and method (read first)

- Source read: the published Dragon Data assembler listing (repo davidlinsley/DragonBasic), read in a temp folder that has since been deleted. Nothing was copied into the project.
- **What the listing is:** the Dragon 64's "32K-mode" BASIC ROM, which is the D32-compatible one. It is not a D32 listing. The 64K-mode files were not used.
- **How the addresses were obtained:** the listing gives offsets inside each source module. I worked out absolute addresses by adding the module sizes in build order, starting at $8000. Assembling was not possible.
- **Check against independent D32 documentation:** every address in the project spec that I could test lands exactly on the routine the spec describes. That covers $8B2D, $8C37, $8B8D, $B3B4, $B469, $BD41 and $A00E, plus the 17 entries at $8000 and the 7-word table at $A000. The one exception is $9D93; see 1.4.
- **Why D32 and D64 addresses agree:** the D64 32K source has two places with padding bytes, explicitly marked as kept for address compatibility. One is in the SOUND code, the other at the start of the BIOS module. So the D64 32K ROM was deliberately kept address-compatible with the D32. As a result, routine addresses in $8000–$BE7A are very likely identical on the D32. Behaviour inside a few BIOS routines differs on D64 (patched via jumps), and $BE7B–$BFEF is D64-only code. See §7.
- **OCR typos:** the scanned listing has a few typos in individual line offsets. I checked every address below for instruction-length continuity and in-module cross-references, and corrected three typos: the expression-to-number routine, the syntax-check routine and the sign routine.

### Confidence scale

- **certain** — confirmed by the listing and by an independent D32 document (the project spec).
- **likely** — from the listing in the address-compatible region, but not independently confirmed for the D32.
- **unsure** — D64-specific code is nearby, or the behaviour may differ on the D32.

### Number formats used below

- **Packed number in memory:** 5 bytes. The first byte is the exponent (0 means the value is zero). Then come 4 mantissa bytes, high byte first. The top bit of the first mantissa byte holds the sign (1 = negative); the hidden leading 1 is implied.
- **FAC (floating accumulator), $4F–$54:**
  - $4F: exponent.
  - $50–$53: mantissa, with the top bit really set.
  - $54: sign byte (top bit = negative).
  - $63: rounding/overflow byte.
- **ARG (second operand), $5C–$61:** same layout as FAC.
  - $62: the sign of the result-to-be (FAC sign exclusive-or ARG sign).
- **Variable type flag, $06:** 0 = numeric, nonzero (top bit set) = string.
- **Text pointer, $A6–$A7:** the current position in the BASIC text.

---

## 1. The "extra entries" in the spec — confirmed contracts

| Addr (D32) | What it is | Inputs | Outputs / flags | Registers & RAM | Returns? | Conf. |
|---|---|---|---|---|---|---|
| **$8B2D** | FAC → signed 16-bit integer in D | FAC holds a number; type flag $06 must be numeric | D = integer part (truncated toward zero, not rounded); FAC mantissa bytes $52–$53 also hold it; flags reflect the low byte | Calls the "must be numeric" check (string → TM error). Range is −32768…32767; −32768 is accepted exactly, anything else outside the range gives an FC error. FAC is changed (left integerised, not a valid float). X destroyed (it holds a pointer when the range is exceeded). Uses the compare routine. | RTS; never returns on error | certain |
| **$8C37** | Signed 16-bit integer in D → numeric result in FAC | D = signed integer | FAC = float(D); $06 cleared (numeric) | Writes FAC $4F–$54 and $63; A, B and X destroyed by normalisation. This is where USR, PEEK, POS and similar routines end. | RTS (exits through the normalise routine) | certain |
| $8C36 | Same, with an unsigned byte in B | B = 0…255 | As above, with A cleared first | **1 byte before $8C37: falls straight into it** | RTS | certain |
| **$8B8D** | "Illegal function call" (FC) raiser | none | — | Loads FC error code 8 into B and goes to the general error routine ($8344) | **Never returns** | certain |
| $8B8A | "Bad subscript" (BS) raiser | none | — | Code $10 into B, then skips over the FC load into the error jump. **3 bytes before $8B8D.** | Never returns | likely |
| **$9D93** | Spec says "IRQ target". **Wrong.** $9D93 falls in the middle of an instruction inside the DELETE command. | — | — | — | — | certain (wrong) |
| **$9D3D** | **The real IRQ handler**, the target of the RAM vector at $010C | Entered by IRQ via $010C | — | See §6. Tests the PIA0 port-B frame-sync flag. If clear: RTI at once. If set: reads PIA0 data B to acknowledge, adds 1 to the 16-bit TIMER at $0112–$0113, then goes to the PLAY note timer ($AFD9), which in turn goes to the SOUND timer ($BB02). Both end in RTI. Leaves DP = 0. | RTI | likely (very probably the intended address; the spec value looks like a typo) |
| $9D46 | Second entry, partway into the IRQ handler: the "after acknowledge" point (TIMER increment onward), kept for a disk ROM that has already acknowledged the interrupt | — | — | 9 bytes after $9D3D | RTI | likely |
| **$B469** | FIRQ handler (cartridge line). RAM vector $010F jumps here. | Entered by FIRQ | — | Tests the PIA1 port-B control flag. If clear: RTI. If set: two long software delays (each a 65536-count loop), then hardware init via $8000 with a return address. Afterwards clears the warm-start flag $71 and jumps to $C000. | Never returns (to the cartridge) | certain |
| **$B3B4** | RESET / power-on entry. The CPU reset vector at $BFFE (seen at $FFFE) points here. | none | — | See §2.11 for the full sequence. | Never returns | certain |
| **$BD41** | Analogue multiplexer select (joystick/sound source) | B bits 0–1 = selector. Bit 0 goes to PIA0 control A CA2; bit 1 goes to PIA0 control B CB2. | — | U is advanced by 4 (ends pointing past $FF03). A destroyed; B shifted right twice. Also has a second entry at $BD46 (one control register only). | RTS | certain |
| **$A00E** | HEX$ function body (not an 8th pointer) | Entered as a BASIC function: FAC holds the argument | FAC = string result | Converts the FAC to an unsigned 16-bit value (FC error if negative or ≥ 65536) and builds a string temporary. A direct call outside expression evaluation is not meaningful. | RTS to the evaluator | certain |

### 1.1 What the 7 pointers at $A000 contain (left open in the spec)

| Cell | Points to | Routine | Conf. |
|---|---|---|---|
| $A000 | $BBE5 | Keyboard poll (same routine as $8006) | likely |
| $A002 | $B54A | Character output to the current device (DEVNUM $6F): screen, printer or cassette buffer. *Not* the bare screen driver. | likely |
| $A004 | $BDE7 | Cassette on + bit sync | likely |
| $A006 | $B93E | Cassette block read | likely |
| $A008 | $B999 | Cassette block write | likely |
| $A00A | $BD52 | Joystick read (all four) | likely |
| $A00C | $BE68 | Cassette on + leader write | likely |

### 1.2 Targets of the 17 jumps at $8000 (this build)

- $8000 → $BB3C — **unsure for D32**: the start of hardware init is exactly where the D64 changed code.
- $8003 → $BB88
- $8006 → $BBE5
- $8009 → $BBB5
- $800C → $BCAB
- $800F → $BD1A
- $8012 → $BD52
- $8015 → $BDCF
- $8018 → $BDDC
- $801B → $BE68
- $801E → $BE12
- $8021 → $BDE7
- $8024 → $BDAD
- $8027 → $BDA5
- $802A / $802D / $8030 → $BE7B / $BE98 / $BEA6. These are serial (ACIA) routines that **exist only in the D64**. On a D32 these three slots point into a region whose content is unknown (see §7).

---

## 2. Internal routines a machine-code programmer would call

Notes for the whole section:

- "Text pointer" means $A6–$A7.
- Routines that parse BASIC text expect the text pointer at the first character of the argument, with A holding that character (as left by the get-next-character routine).
- They leave the text pointer at the terminator.

### 2.1 Get next character from program text (CHRGET) — lives in RAM

| Addr | What | Contract | Conf. |
|---|---|---|---|
| **$009F** (RAM) | Get next character | Adds 1 to the text pointer, loads the character there into A, then jumps to the ROM tail at $BB26. Spaces are skipped (it loops). On return: A = character; **Z set** if the character is 0 (end of line) or a colon; **C set** if the character is a decimal digit '0'…'9'; C clear for anything ≥ colon. Only A and CC change. | certain (layout) / likely (flags) |
| **$00A5** (RAM) | Get current character again (CHRGOT) | Same, but without the increment. It is the load instruction inside the same RAM routine. | certain |
| $00A6–$00A7 | Text pointer | This **is** the 16-bit operand of the load instruction inside the RAM routine (self-modifying). | certain |
| **$BB26** | ROM tail of the routine (classify character) | Entered by jump from RAM with A = character. Compares with colon and space, then runs the digit test. Ends in RTS to the original caller. | likely |
| $BB34 | Its RTS (shared exit) | — | likely |

**RAM image of the routine:** 12 bytes at $009F–$00AA. It is part of a 14-byte block copied at cold start from ROM **$B487–$B494** to RAM **$009D–$00AA**:

- The first 2 bytes initialise the EXEC default address ($9D–$9E).
- In the D64 build those 2 bytes are the D64's 64K-boot address ($BF49). **The D32 value is not in this source.**

### 2.2 Expression evaluation and argument fetching

| Addr | Purpose | Contract | Conf. |
|---|---|---|---|
| **$8872** | Evaluate a numeric expression | Evaluates from the text pointer into FAC, then requires numeric (TM error if string). Goes through the eval RAM hook ($018B). | likely (listing typo corrected) |
| $8874 | "Must be numeric" check | Uses $06. TM error (code $18) if it is a string. Returns with registers intact except CC. **2 bytes after $8872.** | likely |
| $8877 | "Must be string" check | Same idea, the opposite test. **3 bytes after $8874.** | likely |
| $8879 | Common type check | Carry in (set = string wanted). **2 bytes after $8877.** | likely |
| **$8887** | Evaluate any expression (numeric or string) | Backs the text pointer up by one, then evaluates. Result in FAC; $06 gives the type. For a string, FAC $52–$53 points to a 5-byte string descriptor. Uses stack space (it checks with the stack-room routine). | likely |
| $8889 | Same, without backing up the text pointer | 2 bytes after $8887 | likely |
| **$8E51** | Get byte argument | Evaluates a numeric expression. Requires 0…255 (FC otherwise). **B = value.** Ends by re-reading the current character, so A and flags describe the terminator. | likely |
| $8E4F | Same, but first steps the text pointer on by one | **2 bytes before $8E51** | likely |
| $8E54 | Convert FAC to byte | FAC → B (0…255), FC error otherwise. A = current text character on exit. | likely |
| **$8E7E** | Comma, then byte | Requires a comma (SN error otherwise), then does the same as $8E51. | likely |
| **$8E83** | Get 16-bit unsigned argument | Evaluates. 0…65535 required (FC otherwise). **X = value.** | likely |
| $8E86 | FAC → X (unsigned 16-bit) | Same, without evaluating (value already in FAC) | likely |
| $8E7A | Get "address, byte" pair | Evaluates an address (stored at $2B–$2C), then a comma and a byte (in B) | likely |
| $8B26 | FAC → D, positive only | Numeric check; FC if negative; then the same as $8B2D | likely |
| $8B23 | Evaluate, then same as $8B26 | 3 bytes before $8B26 | likely |
| **$89AA** | Require a comma | Compares the current text character with comma. SN error if not; otherwise steps on (as $009F). | likely |
| $89A7 | Require "(" | Same pattern. 3 bytes before $89AA. | likely |
| $89A4 | Require ")" | Same pattern. 3 bytes before $89A7. | likely |
| **$89AC** | Require the character in B | Compares B with the character at the text pointer. SN error if different, otherwise jumps to get-next-character. **Only 2 bytes after $89AA:** the comma entry loads B and falls into this one. | likely (listing typo corrected) |
| $899F | Evaluate an expression in parentheses | ( expr ) | likely |
| $8A94 | Find/create variable from the name in text | Returns a pointer to the variable's value in X (and in $39–$3A). | unsure (contract only skimmed) |
| $8ADF | Is A a letter? | C clear if A–Z | unsure |
| $869A | Read a line number from text | Result in $2B–$2C | likely |
| $83FF | Find a program line | Line number in $2B–$2C. C clear if found; the pointer to the line (or to where it would be inserted) is in X and $47–$48. | likely |

### 2.3 Errors

| Addr | Purpose | Contract | Conf. |
|---|---|---|---|
| **$8344** | General error raiser | **B = error code** (an even number, the offset into the 2-character error table, see §3). Steps, in order:<br>1. Calls the RAM hooks $018E and $0191.<br>2. Turns off the cassette motor (which re-enables interrupts) and TV sound.<br>3. Resets the stack and the string temporaries.<br>4. Sets output to the screen.<br>5. Prints a new line, then a question mark, the two-letter code, the error word, and the line number if a program is running.<br>6. Falls into the "OK" prompt and the command loop. | **Never returns** | certain (address via $8B8D) / likely (details) |
| $8342 | Out-of-memory raiser | Code $0C, then falls into $8344. **2 bytes before $8344.** | likely |
| **$89B4** | Syntax error raiser | Code 2 → $8344 | likely |
| $8882 | Type-mismatch raiser | Code $18 → $8344 | likely |
| $91DB | Overflow raiser | Code $0A | likely |
| $93B1 | Division by zero raiser | Code $14 | likely |
| $B848 | Bad file mode raiser | — | likely |
| $B84B | I/O error raiser | — | likely |
| $B84E | Already open raiser | — | likely |
| $B851 | Device number raiser | — | likely |

The four file-error raisers above share one 3-byte-spaced chain ending in a jump to $8344.

| Addr | Purpose | Contract | Conf. |
|---|---|---|---|
| $8335 | Stack-room check | D = an address. OM error unless D + 58 is below the current stack pointer. Saves S at $17–$18. | likely |
| $8331 | Same, but D = (B × 2) + end of arrays ($1F) | 4 bytes before $8335 | likely |

### 2.4 Output (printing)

| Addr | Purpose | Contract | Conf. |
|---|---|---|---|
| **$90E5** | Print a string | **X = address of the string MINUS ONE.** The string ends at a zero byte or a double-quote. It builds a string temporary, then prints it through the current device. A, B, X and U are destroyed. | likely |
| $90E8 | Print the string whose descriptor is in FAC | Frees the temporary, then prints each character. 3 bytes after $90E5. | likely |
| **$90FA** | Output the character in A | Goes to the current-device output ($B54A). All registers preserved (see $B54A). | likely |
| $90F8 | Print "?" | **2 bytes before $90FA, falls into it** | likely |
| $90F5 | Print a space | 3 bytes before $90F8 | likely |
| **$90A1** | Print carriage return | Sends $0D through $90FA | likely |
| $90A5 | New line only if not at column 0 | Asks the device for its parameters first | likely |
| **$957A** | Print unsigned 16-bit number in D | Converts to decimal and prints it **without** the leading sign space. FAC is destroyed. | likely |
| $9573 | Print the IN-line-number suffix for the current line ($68–$69) | 7 bytes before $957A | likely |
| **$9587** | FAC → ASCII text | Writes a zero-terminated decimal text into the buffer at **$03DA** (16 bytes). The first character is a space or a minus sign. **Returns X = $03DA.** FAC is destroyed. | likely |
| $958A | Same, with U already pointing at the buffer | 3 bytes after $9587 | likely |
| **$B54A** | Output A to the current device | DEVNUM $6F: 0 = screen, $FF = cassette (buffered, written in blocks), $FE = printer, $FD = D64 download (absorbed). First calls RAM hook $0167. For the screen it **first forces the SAM/VDG into text mode**, then calls the screen driver. B, X, Y and U are preserved; A is preserved. | certain (via $A002) / likely (details) |
| **$BCAB** | Raw screen driver (same as $800C) | Contract in the spec. Uses the cursor address at $88–$89 and scrolls at the end of the screen. | certain |

### 2.5 Input

| Addr | Purpose | Contract | Conf. |
|---|---|---|---|
| **$B505** | Get a character from the current device, top bit cleared | Keyboard: waits, blinking the cursor (the blink routine includes a ~10 ms delay per pass) until the poll returns a key; then writes a green space at the cursor. Cassette: takes the next byte from the buffer (and reloads the buffer). B and X preserved; A = character. Clears $70 (EOF flag). For the cassette, $70 is set at end of file. | likely |
| $B50A | Same, without clearing bit 7 | **5 bytes after $B505.** Calls RAM hook $016A first. | likely |
| **$B5C6** | Read a line of input | Into the line buffer **$02DD** (at most 249 characters accepted). Handles backspace, ctrl-U line delete, the CLEAR key (clear screen and restart) and BREAK. **On return: X = $02DC (buffer − 1), the line is zero-terminated, C set if BREAK was pressed.** Clears $87 (the INKEY$ single-character buffer). Calls RAM hook $0182. | likely |
| $B5C3 | Same, but clears the screen first | 3 bytes before $B5C6 | likely |
| $8760 | Print "?" then read a line | Prompt variant | likely |
| **$851B** | BREAK / pause check | Polls the keyboard:<br>• BREAK → STOP (never returns);<br>• SHIFT-@ (code $13) → waits for another key, then re-tests it;<br>• any other key → stored in $87 for INKEY$. | likely |
| **$BBE5** | Keyboard poll (same as $8006) | Details in §5 | certain |

### 2.6 Number conversion and floating point

| Addr | Purpose | Contract | Conf. |
|---|---|---|---|
| **$94BD** | ASCII → number (FIN) | Reads a decimal number from the text pointer (using get-next-character). Expects A = the first character, as just returned by get-next-character / get-current-character. Result in FAC. Text pointer left on the first non-number character. **To convert a string in memory:** point the text pointer at it minus one … or do as VAL does: point at the string, put a zero after it, re-read the current character, call this. | likely |
| $8E5C | VAL function body | Shows that usage pattern | likely |
| **$9427** | Signed byte in B → FAC | — | likely |
| $942D | Signed 24/32-bit mantissa already in FAC $50–$53 → normalised float | B = exponent to apply | likely |
| $9425 | SGN (BASIC function) | **2 bytes before $9427, falls into it** | likely |
| **$9418** | Sign of FAC | **Returns B = 0 if FAC is zero, 1 if positive, $FF if negative**, with flags set accordingly | likely (listing typo corrected) |
| **$9473** | Integer part of FAC, into the mantissa bytes | Signed. Assumes the value is below 2^31. No float result: FAC is left as an integer, not normalised. | likely |
| $9499 | INT() | Floor; result is a normalised float | likely |
| **$9441** | Compare FAC with a packed number at X | Returns **B = 0** (equal), **1** (FAC greater) or **$FF** (FAC smaller), flags set from B | likely |
| **$93BF** | Load FAC from a packed number at X | A preserved; X destroyed | likely |
| **$93E0** | Store FAC as a packed number at X | B preserved; A and U destroyed | likely |
| $93DE | Store FAC at the variable pointed to by $3B–$3C | **2 bytes before $93E0** | likely |
| $93DA | Store FAC to temp 1 ($40) | 4 bytes before $93DE | likely |
| $93D5 | Store FAC to temp 2 ($45) | 5 bytes before $93DA | likely |
| **$93F5** | ARG → FAC | A = sign on exit; B preserved | likely |
| $93F7 | Same, with the sign already in A | 2 bytes after $93F5 | likely |
| **$940A** | FAC → ARG | B preserved; A = exponent with flags set | likely |
| **$92DA** | Load ARG from a packed number at X | Also sets the result-sign byte $62; ends with B = FAC exponent, flags set | likely |
| **$910B** | FAC = (packed number at X) + FAC | Destroys A, B, X | likely |
| $9102 | FAC = (packed number at X) − FAC | **Note the operand order** | likely |
| $90FD | FAC = FAC + 0.5 | 5 bytes before $9102 | likely |
| $9105 | FAC = ARG − FAC | ARG and $62 already set up | likely |
| $910E | FAC = ARG + FAC | Internal entry: ARG loaded via $92DA, B = FAC exponent with flags | likely |
| **$9273** | FAC = (packed number at X) × FAC | — | likely |
| $9275 | FAC = ARG × FAC | Internal entry; **2 bytes after $9273** | likely |
| **$933A** | FAC = (packed number at X) ÷ FAC | Division-by-zero error if FAC = 0 | likely |
| $933C | FAC = ARG ÷ FAC | Internal entry; **2 bytes after $933A** | likely |
| $96DE | Negate FAC | — | likely |
| $943E | ABS | — | likely |
| $9182 | Set FAC to zero | — | likely |
| $9315 | FAC × 10 | — | likely |
| $932D | FAC ÷ 10 | — | likely |
| $9697 | SQR | — | likely |
| $96A0 | Power: ARG ^ FAC | — | likely |
| $9713 | EXP | — | likely |
| $923C | LOG | — | likely |
| $97CB | COS | — | likely |
| $97D1 | SIN | — | likely |
| $9816 | TAN | — | likely |
| $9877 | ATN | — | likely |
| $9743 | Polynomial evaluator (odd powers) | X = coefficient table: a count byte (degree − 1), then packed numbers | likely |
| $9752 | Polynomial evaluator (all powers) | Same table format | likely |
| **$9772** | RND (BASIC function) | Argument in FAC:<br>• 0 → fraction between 0 and 1;<br>• positive n → integer 1…n;<br>• negative → reseed, then return a fraction.<br>The generator state lives in RAM **$0116–$0119** ($0115 exists but is unused by this version). Multiplier and additive constant are in ROM (see §3). | likely |
| $978E | RND fraction from the current seed | Internal entry | likely |

### 2.7 Screen, graphics and sound

| Addr | Purpose | Contract | Conf. |
|---|---|---|---|
| **$BA77** | Clear the text screen to green spaces | Fills $0400–$05FF and puts the cursor ($88–$89) at $0400. **Leaves X = $0600.** B destroyed. Called by RESET, the CLEAR key and tape search. | likely |
| $BA7C | Fill from X to the end of the screen with B; cursor = X | 5 bytes after $BA77 | likely |
| $BA5F | CLS statement | Parses an optional colour, then calls RAM hook $01A0 | likely |
| $B786 | PRINT@ helper | Sets the cursor from an argument (0…511) | likely |
| $B9D2 | SET statement | Parses its arguments | likely |
| $BA03 | RESET statement | Parses its arguments | likely |
| $BA44 | POINT function | Parses its arguments | likely |
| $BA13 / $BA16 | Parse "(x,y" for semigraphics | Returns X = screen byte address and $86 = cell mask | likely |
| **$A93A** | Force text display mode | Writes the 10 SAM video/offset bits (display at $0400, alphanumeric mode) and clears the VDG bits of PIA1 port B. **All registers preserved.** Does **not** touch the SAM speed bits. | likely |
| $A95D | Force graphics display mode | Uses the graphics mode $B6, colour set $C1 and graphics base $BA. All registers preserved. | likely |
| $A989 | Set SAM display-mode bits from A (3 bits) | — | likely |
| $A99D | Set SAM display offset from A (7 bits, in 512-byte units) | — | likely |
| **$A626** | Pixel address | Inputs: x in $BD–$BE, y in $BF–$C0, mode $B6, bytes per row $B9, graphics base $BA–$BB. **Returns X = screen byte, A = pixel mask** (1 bit in 2-colour modes, 2 bits in 4-colour modes). B and U preserved. | likely |
| $A61D | Pick the pixel-address routine for the current mode | Into U | likely |
| **$A705** | Plot the pixel at X with mask A | Uses the working colour byte $B5. Also sets the PAINT "changed" flag $DB. A and B destroyed. | likely |
| $A6EF / $A6F3 | PSET / PRESET statements | Parse their arguments | likely |
| **$A8C4** | Fill the graphics screen | B = colour code (0–3, replicated into every pixel of the byte) from $BA to $B7. X destroyed. | likely |
| $A8C0 | PCLS statement | 4 bytes before $A8C4 | likely |
| $A8D0 | PCLS with the background colour ($B3) | — | likely |
| $AA81 | Graphics init (power-on) | — | likely |
| **$BA9A** | SOUND statement | Parses its arguments | likely |
| $BAA0 | SOUND from registers | **B = duration**, frequency already in $8C. It multiplies the duration by 4 into $8D–$8E (counted down by the IRQ), enables the frame interrupt, selects the DAC, enables TV sound, and plays a square-ish wave until the counter reaches zero. Then falls into sound-off. | likely |
| $BAC3 | TV sound off | **2 bytes before $BAC5** | likely |
| $BAC5 | TV sound on | Uses the PIA1 port-B control CB2 bit | likely |
| $BAD6 | Output A to the DAC and hold it for a frequency-dependent time | Uses $8C | likely |
| $BAF1 | Select the sound source from B (0…3) | Same mechanism as $BD41 but entered differently: B is shifted with the sign kept. **Not identical to $BD41.** | likely |

### 2.8 Cassette, block level (beyond the tables)

| Addr | Purpose | Contract | Conf. |
|---|---|---|---|
| $B933 | Read one block | Motor on and sync, read the block, motor off. **B = error status** (from $81); flags set. | likely |
| $B991 | Write one block | Motor on, leader, write the block, motor off | likely |
| $B994 | Write a block, then motor off | No leader | likely |
| $B8B3 | Search the tape for the file named at $01D2 | 8 characters, blank-padded. Shows "S" and the file names on screen if in direct mode. Z clear on error. | likely |
| $B7AA | Parse a filename from text into $01D1 (length) / $01D2 | — | likely |
| $B903 | Skip the current file | — | likely |
| **$B75B** | CLOADM's load loop, from X | **X = load address.** Motor on and sync (through $BDE7), then blocks to X one after another until the end block (its data is stored too). A header block or a read error gives ?IO. Motor off, returns. The Dragon twin of CoCo $A529 (Color BASIC Unravelled). Microdeal's Athletyx loader calls it directly, once per stage (28.10). | likely |

Block layout used by these routines:

- **Header block buffer:** $01DA–$02D8 (255 bytes).
- **Header fields:** filename at +0..+7, file type at +8, ASCII flag at +9, gap flag at +10. The load and exec addresses follow; their exact offsets were not traced.

### 2.9 Program-level entry points (seen used by loaders and utilities)

| Addr | Purpose | Notes | Conf. |
|---|---|---|---|
| **$8371** | "OK" prompt, then the command loop | Never returns. Prints a new line and OK, then reads lines. | likely |
| $837A | Command loop without printing OK | — | likely |
| $849F | Execute the next statement (interpreter main loop entry) | — | likely |
| $84D6 | Execute the statement at the text pointer | — | likely |
| $841F | RUN-style reset | Text pointer to the start, then CLEAR | likely |
| $8424 | CLEAR variables | — | likely |
| $8434 | Reset the stack and string temporaries | Uses the return address on the stack | likely |
| $8417 | NEW | Erase the program | likely |
| $83ED | Rebuild the line links | After loading machine-level BASIC text | likely |
| $8F67 | Tokenise the line in the buffer | Calls RAM hook $01A3 | likely |
| $8EAA | LIST | — | likely |
| $B770 / $B777 | EXEC with an argument / jump through $9D–$9E | — | likely |
| $9D00 | DEF USR | — | likely |
| $9D26 | Point inside the USR function where X is set to the FAC address (A = type) before dispatch | mid-routine | unsure |

### 2.10 Keyboard internals (BIOS)

| Addr | Purpose | Contract | Conf. |
|---|---|---|---|
| $BBEC | Full keyboard scan and encode, without the outer wrapper | Uses the rollover table $0151–$0159 and debounce ($97–$98). | likely |
| $BBCD | Read rows with SHIFT masked in | — | likely |
| $BBDA | Test SHIFT | Z clear if pressed | likely |
| $BC84 | Special-key code table | See §3 | likely |

**The keyboard poll at $BBE5:**

- Pushes B and X, then calls the scan.
- **Quick no-key path:** all columns low, one row read, compared with the first rollover byte. If equal, it exits at once with A = 0 and Z set.
- **On the D64 the exit is patched** to go through an auto-repeat routine. On the D32 it ends directly. Same entry address; the register contract is the same as in the spec.

### 2.11 RESET, cold start and warm start

1. RESET → **$B3B4**. Puts a return address in Y and jumps to $8000 (hardware init). Hardware init returns through Y, not through the stack.
2. **$B39B** (start of the module) runs next:
   - sets a temporary stack at $03D7 (top of the line buffer);
   - enables the cartridge interrupt at PIA1;
   - **warm-start test:** if $71 = $55 **and** the byte at the address in $72–$73 is the 6809 NOP opcode, it jumps there.
3. Otherwise cold start at **$B3BA**:
   - clears $0000–$03FF;
   - clears the screen;
   - puts a zero byte at $0600; the program start is $0601;
   - **memory probe** upward from $0601 (complement-write-compare) to find the RAM top;
   - sets $74, $27 and $23 to that top, then reserves 200 bytes of string space ($21 and S set below it);
   - calls software init ($8003);
   - copies the 14-byte image ($B487) to $9D–$AA and the 30-byte image ($B495) to $010C–$0129;
   - fills the 25 RAM hooks ($015E–$01A8) with RTS opcodes (all 3 bytes of each);
   - NEW;
   - PLAY/DRAW defaults;
   - sets the USR table address ($B0 = $0134) and fills its 10 entries with the FC error address $8B8D;
   - graphics init;
   - enables the frame IRQ (PIA0 CRB bit 0);
   - **cartridge check:** if $C000–$C001 holds ASCII "DK", it jumps to $C002;
   - otherwise unmasks IRQ and FIRQ, prints the banner, sets the warm vector to **$B44F** and the flag $71 = $55, then goes to OK.
4. **$B44F** — BASIC's own warm entry (it starts with the required NOP):
   - clears the PLAY duration ($E3–$E4) and re-enables the frame IRQ;
   - sets DEVNUM = 0;
   - resets the stack and temporaries;
   - unmasks interrupts;
   - clears the screen;
   - OK.

- Software init ($BB88) copies 22 bytes of constants from ROM $BB9F into RAM $8F–$9B (13 bytes) and $0148–$0150 (9 bytes); see §3. On the D64 it also calls a serial-printer patch in between.
- **Unsure for D32:** the exact D32 hardware-init sequence. The D64's sets up the ACIA and has a 64K-boot branch.

---

## 3. Fixed data in ROM

| Addr | Size | What | Notes | Conf. |
|---|---|---|---|---|
| $8033–$8153 | 289 | Statement keyword names | 78 tokens, $80–$CD, in token order. Each name is stored with **bit 7 set on its last letter.** | likely |
| $8154–$81C9 | 118 | Statement dispatch | 59 addresses (2 bytes each), for tokens $80 up to the last executable statement ($BA). Tokens after that ($BB–$CD) are secondary words like THEN, TO, STEP, operators — no dispatch entry. | likely |
| $81CA–$824F | 134 | Function names | 34 functions, second byte $80–$A1 after a $FF prefix. Same last-letter rule. | likely |
| $8250–$8293 | 68 | Function dispatch | 34 addresses | likely |
| $8294–$82A8 | 21 | Operator table | 7 entries of 3 bytes: precedence, then routine address. Order: + − × ÷ ^ AND OR. | likely |
| $82A9–$82DE | 54 | Error code table | 27 two-letter codes. Error number = 2 × index:<br>0 NF, 2 SN, 4 RG, 6 OD, 8 FC, $0A OV, $0C OM, $0E UL, $10 BS, $12 DD, $14 /0, $16 ID, $18 TM, $1A OS, $1C LS, $1E ST, $20 CN, $22 UF, $24 FD, $26 AO, $28 DN, $2A IO, $2C FM, $2E NO, $30 IE, $32 DS, $34 NE | likely |
| $82DF | 7 | The word ERROR, preceded by a space; zero-terminated | — | likely |
| $82E6 | 5 | The word IN, between spaces; zero-terminated | — | likely |
| $82EB | 4 | CR, then OK, zero-terminated | The error and load code points at the byte before it ($82EA); see the printing routine contract. | likely |
| $82F0 | 7 | CR, then BREAK, zero-terminated | — | likely |
| $8B1C | 5 | Packed constant −32768 | — | likely |
| $920E | 5 | Packed constant 1.0 | — | likely |
| $9213–$9236 | — | Log-series coefficients | — | likely |
| $9232 | 5 | Packed constant −0.5 | — | likely |
| $9237 | 5 | Packed constant ln 2 | — | likely |
| $9569 | 5 | Packed constant just under 10^9 | Number-output range limit | likely |
| $966E | 5 | Packed constant 0.5 | — | likely |
| $9673–$9696 | 36 | Powers-of-ten table for number output | 4-byte integers, alternating signs | likely |
| $96E5 | 5 | Packed constant log₂ e | — | likely |
| $96EA–$9712 | — | EXP series coefficients | — | likely |
| $97C7 | 4 | RND multiplier | — | likely |
| $983F | 5 | Packed constant π/2 | — | likely |
| $9844 | 5 | Packed constant 2π | — | likely |
| $9849 | 5 | Packed constant 1/4 | — | likely |
| $984E–$9876 | — | SIN series coefficients | — | likely |
| $98A6–$98E2 | — | ATN series coefficients | — | likely |
| $A000–$A00D | 14 | I/O pointer table | See 1.1. Preceded by 39 unused padding bytes ($9FD9–$9FFF) that align it. | certain |
| $A66B / $A673 | 8 / 4 | Pixel bit-mask tables | 2-colour / 4-colour | likely |
| $AAA1 | — | Bytes per row for each PMODE | — | likely |
| $AFF6 | 7 | PLAY note-letter → semitone table | — | likely |
| **$B487–$B494** | 14 | Cold-start image → RAM **$009D–$00AA** | EXEC default (D64-specific value) + the get-next-character routine | likely |
| **$B495–$B4B2** | 30 | Cold-start image → RAM **$010C–$0129** | Contents in order:<br>• IRQ vector jump to $9D3D<br>• FIRQ vector jump to $B469<br>• TIMER = 0 (3 bytes, $0112–$0114)<br>• RND seed (5 bytes, $0115–$0119)<br>• 5 bytes $011A–$011E zero (D64 uses them)<br>• $011F = 5 (a D64 auto-repeat delay; **the D32 value is unknown**)<br>• 10-byte keyword-table descriptor at $0120–$0129: 78, statement-name address, statement-dispatch address, 34, function-name address, function-dispatch address | likely |
| **$B4B3–$B504** | 82 | Power-on banner | Printed via the string printer with X = $B4B2. Three text lines (Dragon Data copyright; interpreter name and version; Microsoft copyright), then an extra blank line, zero-terminated. The Microsoft line alone starts at $B4ED. CLS with an argument above 8 prints it (a hidden message). | likely |
| $BB9F–$BBB4 | 22 | BIOS constants → RAM | 13 bytes to $8F–$9B:<br>• cursor blink reload 50 ($8F)<br>• leader count $0100 ($90–$91)<br>• cassette bit-width limits 18/10/18 ($92–$94)<br>• motor delay 50 × 10 ms ($95–$96)<br>• debounce 10 ms ($97–$98)<br>• printer comma width 16, last comma field 116, width 132 ($99–$9B)<br><br>Then 9 bytes to $0148–$0150:<br>• printer auto-LF flag on<br>• alpha-lock on<br>• printer end-of-line sequence: count 1, CR, LF, 4 spare bytes | likely; **note the leader count of 256 here vs the 128 documented for D32** (see open questions) |
| $BC84–$BC9F | 28 | Special keys: unshifted/shifted code pairs | 0 (with SHIFT-0 = case toggle), punctuation, @, the arrows, space, ENTER, CLEAR, BREAK | likely |
| $BE44–$BE67 | 36 | Cassette output sine table | One full cycle | likely |

---

## 4. Packing: where a 3-byte jump will not fit

The original is densely packed. Many useful entries fall through into each other, sit 1–2 bytes apart, or start in the middle of another routine using "skip next instruction" filler bytes.

**Two neighbouring entries closer than 3 bytes cannot both be a JMP.** The lower one must be built as a 1- or 2-byte instruction that falls into the upper one.

| Group (ascending) | Gaps | Problem |
|---|---|---|
| $8342 → $8344 | 2 | OM raiser falls into the error raiser |
| $8872 → $8874 → $8877 → $8879 | 2, 3, 2 | Evaluate-numeric falls into the numeric check. The string check and the common check are shared code entered at offsets. |
| $89A4 → $89A7 → $89AA → $89AC | 3, 3, **2** | ")", "(" and "," checks, then "check character in B". The comma check must be a 2-byte load falling into $89AC. |
| $89AC → $89B4 | 8 | OK |
| $8B23 → $8B26 → $8B2D | 3, 7 | OK |
| $8B8A → $8B8D | 3 | OK (but BS skips over the FC load: shared tail) |
| **$8C36 → $8C37** | **1** | Byte-to-float is a single instruction before D-to-float. Only a 1-byte instruction fits at $8C36. |
| $8E4F → $8E51 → $8E54 | **2**, 3 | "Step on, then get byte" is 2 bytes before "get byte" |
| $8E7A → $8E7E → $8E83 → $8E86 | 4, 5, 3 | OK |
| $90A1 → $90A5 | 4 | OK |
| $90E5 → $90E8 | 3 | OK |
| $90F5 → $90F8 → $90FA | 3, **2** | "Print ?" falls into "output A" |
| $90FD → $9102 → $9105 → $910B → $910E | 5, 3, 6, 3 | OK |
| $9273 → $9275 | **2** | Multiply-memory falls into multiply-ARG |
| $92DA | — | Unpack-to-ARG. Also entered internally by the mul/div routines. |
| $933A → $933C | **2** | Same pattern for divide |
| $93D5 → $93DA → $93DE → $93E0 | 5, 4, **2** | The store-to-temp entries share the store routine |
| $93F5 → $93F7 | **2** | ARG→FAC with/without sign |
| $940A → $9418 → $941C | 14, 4 | OK |
| $9425 → $9427 → $942D | **2**, 6 | SGN falls into byte-to-float |
| $9441 → $944B | 10 | OK (compare also has a second entry) |
| $9573 → $957A | 7 | OK |
| $9587 → $958A | 3 | OK |
| $9D3D → $9D46 | 9 | OK |
| $A61D → $A626 | 9 | OK |
| $A8C0 → $A8C4 → $A8D0 | 4, 12 | OK |
| $A93A … $A95D | — | OK. The entry at $A938 is 2 bytes before $A93A. |
| $B505 → $B50A | 5 | OK |
| $B5C3 → $B5C6 | 3 | OK |
| $B848 → $B84B → $B84E → $B851 | 3, 3, 3 | OK but chained |
| $BA77 → $BA7C | 5 | OK |
| $BAC3 → $BAC5 | **2** | Sound off falls into sound on |
| $BD41 → $BD46 | 5 | Second entry partway in |
| $BB26 → $BB34 | — | CHRGET tail. It is jumped to from RAM, so it is effectively a fixed entry. |

### Entered mid-routine (multiple entry points into one body)

- The error raiser: all raisers are "load the code, then go to $8344". $8371 (OK) also lies inside the error routine.
- Type checks: $8874, $8877 and $8879.
- Integer conversion: $8B23, $8B26 and $8B2D.
- Float-from-integer: $8C36 and $8C37.
- Add/subtract: $90FD, $9102, $9105, $910B and $910E.
- Multiply and divide: two entries each.
- FAC stores: $93D5, $93DA, $93DE and $93E0.
- SGN / float: $9425 and $9427.
- Number output: $9573 and $957A.
- Clear screen: $BA77 and $BA7C. The CLS statement also enters this body.
- Sound on/off: $BAC3 and $BAC5.
- Character input: $B505 and $B50A.
- The IRQ handler: $9D3D and $9D46.

---

## 5. BIOS details useful for compatibility

- **Keyboard poll $BBE5 (contract):** A = key code, or 0 with Z set if no new key. B and X preserved.
  - SHIFT-0 toggles the alpha-lock flag at $0149; the toggle code itself is returned.
  - Joystick buttons pressed abort the scan (no key).
- **Joystick read $BD52:**
  - Stores four 6-bit values (0–63) at $015A–$015D.
  - Readings run from joystick 3 down to 0, filling from $015D down to $015A.
  - Each reading is a 6-step successive-approximation search through the DAC and comparator.
  - Up to 10 retries until two readings agree.
  - Uses 3 bytes of stack as workspace and pulls them back into A and X, so A, B, X and U are destroyed; only Y is preserved.
- **Cassette (bit level):**
  - Bit read ($BDA5): times one cycle by counting loop passes in $82. C = 1 for a short (2400 Hz) cycle.
  - Byte read ($BDAD): 8 bits, least significant first.
  - Byte write ($BE12): 8 bits, LSB first. A 0 bit = one 1200 Hz cycle (the 36-sample sine table played once); a 1 bit = one 2400 Hz cycle (every other sample).
  - Leader ($BE68): writes the byte $55, count taken from $90–$91.
  - Sync ($BDE7): counts transitions in $83 until 96 consistent half-bits, then stores the phase in $84.
  - Block format: leader byte, sync byte $3C, type, length, data, checksum (sum of type + length + data), trailer byte. Block types: 0 = header, 1 = data, $FF = EOF.
  - Block read errors in $81: 1 = checksum, 2 = memory.

---

## 6. Timing facts

- **CPU clock assumed:** about 0.89 MHz (SAM slow rate). The 10 ms delay constant is 1118 passes of an 8-cycle loop (≈ 8,940 cycles). The cassette routines also rely on fixed cycle counts:
  - one 1200 Hz output cycle is 36 samples at about 22 cycles each (≈ 790 cycles per 0-bit);
  - bit-width thresholds are loop counts.

  This agrees with the "~813 / ~435 cycles per bit" figures in the spec.
- **SAM speed:**
  - The ROM **never** sets the rate bits.
  - Hardware init (on RESET) clears **all 16** SAM control bits (rate slow, display mode, offset), then sets display offset bit F1 (screen at $0400) and memory-size bit M1.
  - The text-mode routine called before every screen character rewrites only the display-mode and offset bits.

  So a user "speed poke" survives normal BASIC operation and is undone only by RESET (hardware init). The ROM does not compensate its delays when the machine is fast, so cassette and delay timing break at the fast rate.
- **IRQ:**
  - Source: the VDG field sync on PIA0 CB1, so once per TV field. The source comments say 60 per second (inherited from the US machine); on a PAL Dragon it is 50 per second.
  - Enabled at cold start, at warm start, and again by SOUND.
  - Work per tick: test the flag, acknowledge, TIMER +1. Then, if a PLAY note is active, subtract the tempo step from $E3–$E4. When the note ends, the handler clears the "entire state" flag in the stacked CC and drops the inner stack frame — PLAY relies on this to return early. Otherwise it decrements the SOUND counter $8D–$8E if nonzero.
  - Interrupts are not masked by ordinary BASIC code.
  - **No cursor blink and no keyboard scan in the IRQ (D32).**
- **Interpreter overhead per statement:**
  - unmask interrupts;
  - a full keyboard poll for BREAK/pause (fast when no key changes: about 10 instructions);
  - two RAM-hook calls (each a call to an RTS);
  - the trace-flag test at the start of each line;
  - dispatch through the table.
- **Screen output:** every character sent to the screen first forces text mode (10 SAM writes, plus a read-modify-write of PIA1 port B), then the driver. Scrolling copies 480 bytes, 2 bytes at a time.
- **Keyboard wait:** each pass of the wait loop includes the 10 ms delay; the cursor toggles every 50 passes (~0.5 s plus scan time). The debounce adds 10 ms when a key change is seen.
- **Other fixed delays:**
  - cassette motor-on wait: 0.5 s;
  - cartridge FIRQ: two 65536-pass delays (≈ 1 s) before starting the cartridge.

---

## 7. Where D32 may differ from this D64-32K source

1. **$BE7B–$BFEF is D64-only:** serial in/out, baud rate, printer selection, auto-repeat, a patch for the end-of-line delay, and the 64K boot loader. On the D32 this area holds something else or is unused. Unknown.
2. **Hardware init ($8000 target, around $BB35–$BB87):**
   - the D64 adds ACIA setup and a 64K-boot entry at $BB80;
   - the start is preceded by 7 padding bytes;
   - the D32 entry address of the internal routine is uncertain. Use $8000.
3. **Keyboard poll exit** (patched to auto-repeat on D64), **software init** (patched call) and **printer output** (patched end-of-line) behave differently on D32, at the same entry addresses.
4. **RAM image differences:**
   - EXEC default at $9D–$9E (D64-specific value);
   - $011A–$011F;
   - the leader count of $0100 vs the D32's documented 128.
5. **Version-specific fixes:** the USR-number parsing bug described for D32 in the spec may be fixed in this D64 source. I did not verify the USR parsing code.

---

## Open questions

1. **IRQ target:** confirm that the D32 value at $010C–$010E is a jump to $9D3D, not $9D93 (the spec figure looks like transposed digits).
2. **$A000 contents:** confirm the seven pointer values in 1.1 on a real D32 or in a D32 memory dump.
3. **Leader length:** this source initialises the leader count to 256 bytes ($90–$91). The spec says 128 for D32. This needs a D32 measurement; the D32 BIOS constants may differ here.
4. **Hardware init on D32:** the exact address and behaviour of the internal routine, and whether the D32 sets M1 (memory size) the same way.
5. **Serial slots $802A/$802D/$8030 on D32:** where do they point, and what does the D32 do there?
6. **EXEC default address** ($9D–$9E) at D32 cold start.
7. **RAM $011A–$011F** initial values on D32.
8. **RND:** whether the D32 uses the same generator variant (this source has the "new" generator selected). The addresses match, so the size is the same, but this is not proven.
9. **USR parsing:** whether the D32-documented USR1–9 bug is present in this source (not checked).
