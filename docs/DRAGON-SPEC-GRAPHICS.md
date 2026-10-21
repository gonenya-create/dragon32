# Dragon 32 graphics: reader facts (stage 3 part 3)

> Written 20.10.2026 by the reader (a separate Claude agent) from the original DragonBasic source. Facts only, in its own words: no code, no quotes. The writer builds from this file alone.
> Note for the writer: the graphics work area $CB-$DD is also used by our PRINT USING and EDIT variables. That is safe only while both stay temporary (used inside one command), which is the case today.


Source studied: the Dragon 64 BASIC listing (shared graphics module, plus the RAM-equate reconstruction and the 32K-mode/64K-mode machine modules). The graphics module is one file assembled unchanged into both the "32K mode" ROM (the Dragon-32-compatible one) and the "64K mode" ROM. No source text, labels or code are reproduced here. Everything is described in my own words. Where I'm unsure, I say so.

Number conventions: `$` means hex. "Logical coordinates" means the 0–255 × 0–191 space that BASIC programs use. "Device coordinates" means the coordinates after scaling to the current PMODE.

---

## 0. Global facts

### 0.1 Graphics RAM variables (direct page)

| Addr | Size | Meaning |
|---|---|---|
| $B2 | 1 | Foreground colour, stored as an *internal* pixel value 0–3 (see COLOR) |
| $B3 | 1 | Background colour, internal 0–3 |
| $B4 | 1 | "Active" colour for the current operation, internal 0–3 |
| $B5 | 1 | Active colour replicated across a byte: internal value × $55 (0→$00, 1→$55, 2→$AA, 3→$FF). Every plot uses this byte. |
| $B6 | 1 | Current PMODE 0–4 |
| $B7–$B8 | 2 | End address (exclusive) of the current graphics page area. Only the high byte is ever written; the low byte stays 0. |
| $B9 | 1 | Bytes per row for the current mode (16 or 32) |
| $BA–$BB | 2 | Start address of the current graphics page. Only the high byte is written; the low byte stays 0. |
| $BC | 1 | Page number (high byte) of the start of graphics RAM. Set to $06 at boot (graphics RAM starts at $0600). |
| $BD–$BE | 2 | Working X coordinate (point 1). Plotting uses only the low byte ($BE). |
| $BF–$C0 | 2 | Working Y coordinate (point 1). Plotting uses only the low byte ($C0). |
| $C1 | 1 | Colour-set select: 0 or 8 (8 = CSS on; the value is bit 3 of $FF22) |
| $C2 | 1 | Set/reset flag: 1 = PSET-type (use foreground), 0 = PRESET-type (use background) |
| $C3–$C4 | 2 | Working X coordinate 2. GET/PUT reuse it as a column count. |
| $C5–$C6 | 2 | Working Y coordinate 2. GET/PUT reuse it as a row count. |
| $C7–$C8 | 2 | Last X, logical (shared by LINE's "-(x,y)" form and DRAW's pen position) |
| $C9–$CA | 2 | Last Y, logical (shared the same way) |
| $CB–$CC | 2 | CIRCLE centre X (device). PAINT temp. |
| $CD–$CE | 2 | CIRCLE centre Y (device). PAINT temp (left-piece count). |
| $CF–$D0 | 2 | CIRCLE radius (device). GET/PUT array pointer (points to the byte *before* the next data byte). |
| $D1–$D2 | 2 | CIRCLE aspect ×256. GET/PUT address just past the array's end. PAINT "remaining count". |
| $D3–$D4 | 2 | Max X in device coordinates (used by CIRCLE and PAINT) |
| $D4 | 1 | GET/PUT graphics-mode flag (0 = byte mode, $FF = bit mode). Overlaps the low byte of max-X, but they aren't used at the same time. |
| $D5–$D6 | 2 | Max Y in device coordinates (CIRCLE/PAINT) |
| $D5 | 1 | DRAW "N" (no-update) flag. Also part of the PUT "action when array bit = 1" vector ($D5–$D6). |
| $D6 | 1 | DRAW "B" (blank move) flag |
| $D7 | 1 | PAINT current scan direction (+1 / −1 / 0) |
| $D8 | 1 | CIRCLE "first point" flag. GET/PUT flag (0 = GET, 1 = PUT). PAINT border colour (replicated byte). DRAW/PLAY string length remaining. |
| $D9–$DA | 2 | CIRCLE end position (octant, point). PAINT address-routine pointer. DRAW/PLAY string pointer. PUT "action when array bit = 0" vector. |
| $DB | 1 | PAINT "something changed" flag. Every plot ORs into it (see 0.4). |
| $DC–$DD | 2 | PAINT saved stack pointer (used to prune the stack) |
| $E8 | 1 | DRAW angle 0–3 |
| $E9 | 1 | DRAW scale 0–62 (0 means "no scaling", the same as 4) |

Other BASIC pointers involved: $19–$1A start of program text, $1B–$1C start of variables, $1D–$1E start of arrays, $1F–$20 end of arrays, the stack-top/string-space pointer, $68–$69 current line number (high byte $FF = direct mode), and $A6–$A7 the text pointer.

### 0.2 Boot and RUN defaults

- **At cold start (graphics initialisation):**
  - Program-start high byte = $1E, so with the low byte already $01 the program starts at **$1E01**. This is the same as PCLEAR 4. A zero byte is stored at $1E00.
  - Graphics base page = $06, current page start = $0600, end = $0C00. So this source's boot state is **PMODE 0, page 1**.
  - Bytes per row = 16, foreground = 3 (internal), background = 0 (RAM is cleared), CSS = 0.
  - Then NEW is performed.
  - **Caution:** the source clearly says mode 0 at boot. Check this against a real Dragon 32 if you can; I have no ROM dump to compare.
- **At cold start and on every RUN:** DRAW angle = 0, DRAW scale = 0, last point = (128, 96).
- NEW does not reset these.

### 0.3 Memory layout

- Text screen: $0400–$05FF.
- Graphics RAM starts at $0600 in pages of 1536 bytes ($600):
  - page 1 = $0600, page 2 = $0C00, page 3 = $1200, page 4 = $1800,
  - page 5 = $1E00, page 6 = $2400, page 7 = $2A00, page 8 = $3000.
- The BASIC program starts at $0600 + n×$600 + 1, where n = the PCLEAR count. The byte just before it is 0.

### 0.4 Coordinate parsing, clamping and scaling

- **A coordinate pair "x,y":**
  - x is evaluated as an unsigned 16-bit integer, truncated. Negative or ≥ 65536 gives **?FC**.
  - A comma is required, then y is evaluated as a byte. Negative or > 255 gives **?FC**.
  - Then x ≥ 256 is clamped to 255 and y ≥ 192 is clamped to 191. No error for these.
- **Scaling to device coordinates.** Logical shift right, truncating, done on the 16-bit values:
  - PMODE 0 and 1: x = x/2, y = y/2 (device 128×96)
  - PMODE 2 and 3: x = x/2, y unchanged (128×192)
  - PMODE 4: no change (256×192)
  - The same scaling is applied to "max" values: (255,191) becomes max-X/max-Y = (127,95), (127,191) or (255,191).
- **Pixel address:**
  - 1 bit per pixel (modes 0, 2, 4): byte = page start + y_dev × bytes-per-row + x_dev/8. The mask is $80 shifted right by (x_dev mod 8), so the leftmost pixel is bit 7.
  - 2 bits per pixel (modes 1, 3): byte = page start + y_dev × bytes-per-row + x_dev/4. The mask is $C0 shifted right by 2×(x_dev mod 4).
  - Only the low bytes of x and y are used. The multiply is 8×8 to 16 bits.
- **Plotting one pixel:**
  - new = (old AND NOT mask) OR (mask AND replicated-active-colour).
  - The byte is written back.
  - (new − old), which is non-zero exactly when the byte changed, is ORed into the PAINT change flag at $DB.
- **Stepping one pixel right without recomputing:**
  - 1 bpp: shift the mask right by 1. When it falls off, the mask becomes $80 and the address advances by 1.
  - 2 bpp: shift right by 2. When it falls off, the mask becomes $C0 and the address advances by 1.
  - Stepping one row down adds bytes-per-row to the address.

### 0.5 Colour arguments

Any colour argument is a byte. Negative or > 255 gives ?FC; ≥ 9 gives **?FC**.

1. If the value is 5–8, subtract 4 (5→1 … 8→4). The "CSS" meaning of 5–8 is computed internally and then **discarded**. It is never applied. 5–8 behave exactly like 1–4.
2. Then map to the internal pixel value using the **current** PMODE:
   - **Colour modes (1, 3):** 0→3, 1→0, 2→1, 3→2, 4→3.
   - **Black-and-white modes (0, 2, 4):** odd values (1, 3) → 3, even values (0, 2, 4) → 0.
3. The internal value is what gets stored in the foreground/background/active colour bytes. The replicated byte is the internal value × $55.

PMODE (when a mode number is given) resets foreground to 3 and background to 0.

### 0.6 Optional colour after a coordinate (PSET, PRESET, PAINT, CIRCLE)

- The default active colour is the foreground when the set/reset flag is 1 (PSET-type), otherwise the background.
- If the next character is end-of-statement or ")", the default stays.
- Otherwise a comma is required. If the character after that comma is another comma, the default stays and parsing stops at that second comma.
- Otherwise a colour expression is read (0.5) and becomes the active colour.
- So "PSET(x,y,)" gives ?SN (an expression is expected before the ")").

### 0.7 Switching between text and graphics display

**Back to text mode.** This happens on **every character sent to the screen device**: PRINT output, the "OK" prompt, error messages, INPUT prompts and echo. It does this:

1. Writes SAM bits in this order: F6 clear ($FFD2), F5 clear ($FFD0), F4 clear ($FFCE), F3 clear ($FFCC), F2 clear ($FFCA), **F1 set ($FFC9)**, F0 clear ($FFC6), V2 clear ($FFC4), V1 clear ($FFC2), V0 clear ($FFC0). The result is display offset $0400 and SAM mode 0.
2. Reads $FF22, keeps bits 0–2, clears bits 3–7 (A/G = 0, GM = 0, **CSS = 0**), and writes it back.

So a program that has entered graphics stays in graphics until something is printed to the screen (for example the OK prompt when it ends, or an error message). CLS by itself does not switch mode, except "CLS n" with n > 8, which prints a message. The CSS bit stored at $C1 is **not** cleared by this; only the hardware bit is.

**Into graphics mode** (SCREEN with a non-zero first argument):

1. $FF22 = (old $FF22 AND 7) OR $80 OR ((PMODE+3) × 16) OR (stored CSS value 0/8). So A/G = 1 and GM2..GM0 = PMODE+3:
   - mode 0 → %011
   - mode 1 → %100
   - mode 2 → %101
   - mode 3 → %110
   - mode 4 → %111
2. SAM display offset: take the high byte of the current page start, shift right 1 (address/512), and write 7 bits F0..F6, LSB first. Starting at $FFC6, each bit pair is (clear-address, set-address): write the odd (set) address for a 1 and the even (clear) address for a 0.
3. SAM V mode = PMODE+3, except that 7 becomes 6. So modes 0..4 give V = 3, 4, 5, 6, 6. Write 3 bits V0, V1, V2, LSB first, starting at $FFC0, with the same even/odd rule.

The values written to the SAM addresses don't matter (it's address-triggered). Order: PIA first, then the SAM F bits, then the SAM V bits.

---

## 1. PCLEAR n

- n is a byte. n = 0 gives **?FC**; n ≥ 9 gives **?FC**. Range 1–8.
- The new program start is (n×6 + base page $06) × 256 + 1. For n=4 this is $1E01; for n=8, $3601.
- If the new start is **lower than the current graphics page end** ($B7–$B8, 16-bit compare), you get **?FC**. The current PMODE page must stay below the program.
- New variables-start = new program start + (old variables-start − old program start).
- If new variables-start + 200 (decimal) ≥ the stack-top/string-space-bottom pointer, you get **?FC** (not ?OM).
- If a program is running (not direct mode), the text pointer is moved by the same amount the program moves, so execution continues at the same place in the moved program.
- The program bytes (old start up to old variables-start) are block-moved to the new location. The copy direction is chosen so the move is safe (copy downward-first when moving up, upward-first when moving down).
- Then:
  - the program start pointer is set to the new value;
  - the byte just before it is set to 0;
  - the line links are rebuilt;
  - a full CLEAR is performed. This frees variables, arrays and string space, restores DATA, and **resets the stack**, so open FOR/GOSUB contexts are lost.
  - Execution continues with the next statement.
- PCLEAR does not change the PMODE variables.

## 2. PMODE [mode][,page]

**Forms:** `PMODE m`, `PMODE m,p`, `PMODE ,p`. With no argument at all, the byte evaluation fails, giving ?SN.

**Mode part** (when the first character isn't a comma):

- m is a byte; m ≥ 5 gives **?FC**.
- The page start is reset to graphics base page 1 ($0600). This is stored **before** the memory check.
- End page = start page + pages needed by the mode:

| PMODE | Device resolution | Colours | Bytes/row | Bytes (256-byte pages) |
|---|---|---|---|---|
| 0 | 128×96 | 2 | 16 | 1536 (6) |
| 1 | 128×96 | 4 | 32 | 3072 (12) |
| 2 | 128×192 | 2 | 16 | 3072 (12) |
| 3 | 128×192 | 4 | 32 | 6144 (24) |
| 4 | 256×192 | 2 | 32 | 6144 (24) |

- If end page > program-start high byte, you get **?FC**. The start has already been reset to page 1 at this point.
- Otherwise the end, bytes/row and mode are stored, and foreground = 3, background = 0 (internal values).
- If the statement ends here, done.

**Page part** (`,p`):

- p is a byte; p = 0 gives **?FC**.
- Candidate start page = (p−1)×6, keeping **only the low 8 bits** of the product, plus base page $06, again in 8-bit arithmetic.
- Candidate end = candidate start + (current end page − current start page), 8-bit.
- If candidate end > program-start high byte, you get **?FC**. Otherwise end, then start, are stored.
- Quirk: because the arithmetic is 8-bit, large page numbers wrap. For example (p−1)×6 = 258 gives 2, so "PMODE 0,44" is accepted and gives start $0800. Copy this if you want byte-exact behaviour.

**Side effects:**

- If the page part fails, the mode part has already been applied.
- PMODE does **not** touch the hardware or clear the screen. The display changes only at the next SCREEN 1.
- `PMODE ,p` keeps the mode and colours.

## 3. SCREEN [type][,colourset]

**Forms:** `SCREEN t`, `SCREEN t,c`, `SCREEN ,c`.

- t is a byte (> 255 gives ?FC). 0 selects text (0.7). Non-zero selects graphics (0.7), using the PMODE, page start and stored CSS at that moment.
- c is a byte. Non-zero stores 8 as the CSS value, zero stores 0.
- Then the hardware CSS bit is updated: $FF22 = ($FF22 AND NOT $08) OR value. This happens in text mode too, but the next character printed clears the hardware bit again (0.7).

## 4. PCLS [colour]

- **No argument:** the fill colour is the background (internal value).
- **With an argument:** colour per 0.5 (≥ 9 gives ?FC).
- Every byte from the current page start up to (not including) the current page end is filled with internal colour × $55.
- No display switch. Foreground and background are not changed.

## 5. COLOR [fore][,back]

**Forms:** `COLOR f`, `COLOR f,b`, `COLOR ,b`.

- Each value is converted per 0.5 using the current PMODE and stored as the internal foreground or background.
- If the statement continues after f, a comma is required.

## 6. PSET(x,y[,c]) and PRESET(x,y[,c])

- Syntax: "(" is required, then the coordinate pair (0.4), the optional colour (0.6), then ")" is required.
- PSET's default colour is the foreground; PRESET's is the background.
- PRESET **accepts an explicit colour too** and uses it, exactly like PSET would.
- Plots one pixel at the scaled coordinate (0.4).
- Doesn't change the last-point variables.

## 7. PPOINT(x,y) (function)

- "(" x,y ")" with the same parse and clamping as 0.4, then scaled.
- Reads the pixel bits under the mask.
- **Colour modes:** shift the pixel value down to v = 0..3. The result is v + 1 + (4 if stored CSS = 8 else 0), so the range is 1–4 or 5–8. It never returns 0 in colour modes.
- **Black-and-white modes:** an unset bit returns 0. A set bit returns 1, or 5 when stored CSS = 8.
- The result is returned as a number.

## 8. LINE

**Syntax:** `LINE [@][(x1,y1)]-(x2,y2),PSET|PRESET[,B|,BF]`

- If the token after LINE is INPUT, this is LINE INPUT instead.
- If the next character is "(" or the minus token, parsing proceeds directly. Otherwise an "@" is required (else ?SN).

**Start point:**

- First, point 1 defaults to the stored last point ($C7/$C9), which is logical and already clamped.
- If the next character isn't the minus token, "(x1,y1)" is parsed (0.4) and replaces the default.
- Then the minus token is required (?SN), then "(x2,y2)".

**Then:**

1. The last point is set to (x2,y2), logical and clamped. This happens **before** the PSET/PRESET check, so it sticks even if a later ?SN occurs.
2. A comma is **required** (?SN). The next token must be PSET or PRESET (else ?SN).
3. Both points are scaled.
4. The set/reset flag is set to 1 or 0. The active colour = foreground for PSET, background for PRESET. LINE has **no colour argument**.
5. End of statement → general line from (x1,y1) to (x2,y2).
6. Otherwise a comma, then "B" is required (?SN):
   - Statement ends after B → **box**.
   - Otherwise the next character must be "F" (?SN) → **filled box**.

**Box:** four lines in this order:

1. Top: y1, from x1 to x2.
2. Left: x1, from y1 to y2.
3. Right: x2, from y1 to y2.
4. Bottom: y2, from x1 to x2.

**Filled box:** horizontal lines at y = y1, then step y by ±1 toward y2, a line each time, ending with y2. Each row is a horizontal line from x1 to x2.

**Horizontal line** (both y equal):

- Count = |x2−x1| + 1.
- Start at the smaller x and step right by pixel.
- The working X is restored afterwards.

**Vertical line:** start at the smaller y, step down by rows, count = |dy|+1.

**General line algorithm** (also used by DRAW and CIRCLE). Endpoints are (X1,Y1) = working point 1 and (X2,Y2) = working point 2, in device coordinates.

1. dy = |Y2−Y1|. If dy = 0, do the horizontal-line routine instead. The Y step is +1 if Y2 ≥ Y1, else −1.
2. dx = |X2−X1|. If dx = 0, do the vertical-line routine. The X step is +1 if X2 ≥ X1, else −1.
3. If dx ≥ dy (unsigned), X is the major axis. Otherwise Y is major.
   - "Major delta" M = the larger delta; "minor delta" m = the other.
4. Accumulator = floor(M/2). If M is **even** and the major-axis step is **−1**, subtract 1 from the accumulator. This makes a line drawn in either direction produce the same pixels.
5. Points remaining = M. The working position starts at (X1,Y1).
6. Loop:
   1. Plot the working position.
   2. If points remaining = 0, stop. Otherwise decrement it.
   3. Step the major axis.
   4. accumulator += m. If accumulator ≥ M (unsigned): accumulator −= M and step the minor axis.
   5. Repeat.

   Total pixels = M+1. Both endpoints are included. The start is plotted first, walking toward the end.
7. The working point 1 variables are left modified (at the end point).

## 9. CIRCLE

**Syntax:** `CIRCLE [@](x,y),r[,colour[,aspect[,start[,end]]]]`

Parse order and effects:

1. Optional "@".
2. Max-X/max-Y for the current mode are computed (0.4).
3. "(x,y)" is parsed (0.4) and scaled. This is the centre.
4. A comma is required. r is an unsigned 16-bit integer (negative or ≥ 65536 gives ?FC). It is scaled like an X value: halved, truncated, in modes 0–3; unchanged in mode 4.
5. Set/reset flag = 1. Optional colour per 0.6 (default foreground).
6. **Aspect:**
   - Default 1.0. It is stored internally as 256.
   - If more follows: a comma, then a numeric expression multiplied by 256, converted to an unsigned 16-bit integer, truncated. Negative or ≥ 256.0 gives ?FC.
   - An empty aspect field (",,") is ?SN, because an expression is required once the comma is consumed.
   - In **PMODE 2 and 3 only**, the stored aspect is doubled (16-bit, wraps silently).
7. **Start**, then **end** (each optional, but end requires start):
   - Absent → 0.
   - Otherwise a comma, then a number multiplied by 64, converted to a byte (negative or ≥ 256 after ×64, i.e. ≥ 4.0, gives ?FC), then ANDed with 63.
   - So positions run 0–63, with 1.0 wrapping to 0.
   - Position p splits into octant = p/8 (0–7) and step = p mod 8 (0–7).
8. There is **no fill option** in this source. "F" isn't supported.

**Point generation:**

- There are 9 table entries k = 0..8, one per angle k × 5.625° (π/32). Each holds:
  - c_k = round(65536·cos(kπ/32)), except entry 0, which is treated as exactly 1.0;
  - s_k = round(65536·sin(kπ/32)).
- Values for reference (k = 0..8):
  - cos: 1.0, 65220, 64277, 62714, 60547, 57798, 54491, 50660, 46341
  - sin: 0, 6424, 12785, 19024, 25080, 30893, 36410, 41576, 46341
- "Radius × factor" = floor(r × factor / 65536) using a 16×16→32-bit multiply. For the 1.0 entry it is r itself.

For position (octant o, step b):

1. Index k = b for even octants, or 8 − b for odd octants (1, 3, 5, 7).
2. a = r×cos-factor(k), bb = r×sin-factor(k).
3. Horizontal offset H and vertical raw offset Vr: for octants 1, 2, 5, 6 these are swapped (H = bb, Vr = a). Otherwise H = a, Vr = bb.
4. Vertical offset V = floor(Vr × aspect / 256). If Vr × aspect ≥ 2^24, you get **?FC**.
5. **X:**
   - Octants 0, 1, 6, 7: X = centreX + H. If it overflows 16 bits or is ≥ max-X, X = max-X.
   - Octants 2–5: X = centreX − H. If negative, X = 0.
6. **Y:**
   - Octants 0–3: Y = centreY + V. If it overflows or is ≥ max-Y, Y = max-Y.
   - Octants 4–7: Y = centreY − V. If negative, Y = 0.
7. **Net effect:** position p is at angle p × 5.625° measured **clockwise on screen from 3 o'clock** (y grows downward). 0 = right, 16 = bottom, 32 = left, 48 = top. Points off-screen are clamped to the edge, not dropped; the circle is flattened against the edge.

**Drawing loop:**

1. Begin at the start position with a "first point" flag set.
2. Each iteration computes the point for the current position. Unless it's the first, draw a general line (section 8) from the previously computed point to this one, in the active colour.
3. Then, unless this was the first iteration, stop if the current position equals the end position.
4. Advance: step+1. When the step reaches 8, it becomes 0 and the octant increments (mod 8).

Consequences:

- start = end (including the default 0,0) draws the full circle: 64 segments, ending back at the start point.
- Otherwise it draws (end − start) mod 64 segments, clockwise.
- The joint pixels are plotted twice.
- Radius 0 just re-plots the centre.
- CIRCLE doesn't change the last-point variables.

## 10. PAINT

**Syntax:** `PAINT [@](x,y)[,paint colour[,border colour]]`

1. "(x,y)" is parsed (0.4) and scaled.
2. Set/reset flag = 1. Paint colour per 0.6 (default foreground).
3. If the statement continues: border colour per 0.6 again (default foreground). If the statement ends after the paint colour, **border = paint colour**.
   - "PAINT(x,y),,3" gives the default paint colour and border 3.
   - "PAINT(x,y),2," is ?SN.
4. The border is stored as a replicated byte. The active colour is the paint colour.

**Border test** at a position: (screen byte AND pixel mask) == (border byte AND pixel mask). So a pixel is a border only if its bits exactly equal the border colour. Pixels already in the paint colour, when it differs from the border, are not borders. They get repainted, which is a "no change" event (see the pruning rule).

**Scan primitives:**

- **Scan-left from a position:**
  1. Remember the start position as the "saved X".
  2. Repeatedly: stop if X has gone negative (wrapped to $FFFF) or X > max-X, or the pixel is a border. Otherwise paint it, count it, and X−1.
  3. It returns the count (pixels painted). The working X is left at the stop position: the border pixel, or −1.
- **Scan-right:** first X+1, then the same loop stepping +1. The stop is a border or max-X+1.
- Edges count as borders. Y never leaves 0..max-Y (see below).

**Work list:**

- Entries are 6 bytes pushed on the CPU stack: direction (signed byte), y (byte), x (16-bit), count (16-bit).
- **x is the position just LEFT of a span**, and the span is x+1 .. x+count.
- Before every push there is a free-memory check. ?OM is raised if the end of arrays + 4 + 58 would reach the stack pointer.
- A sentinel entry with direction 0 is pushed first.

**Seed:**

1. At the seed row, scan-left from the seed. If the count is 0 (the seed is a border), go straight to the main loop, which pops the sentinel and ends.
2. Otherwise:
   1. Set the saved X to the left stop.
   2. Scan-right from the seed (starting at seed+1). Total = left count + right count.
   3. Push (dir +1, y, left stop, total), then push (dir −1, y, left stop, total).

**Main loop:**

1. If the change flag ($DB) is zero, restore the stack pointer to the value saved at the last pop. This discards every entry pushed while processing the previous entry, because that entry painted nothing new. The flag is not initialised before the first test; this is harmless in practice.
2. Pop an entry. Clear the change flag. Save the stack pointer.
3. Working X = entry x + 1. Remaining = entry count. Current dir = entry dir.
4. If dir = 0, PAINT ends.
5. New y = y+1 for dir > 0, or y−1 for dir < 0. If y+1 > max-Y, or y is already 0 for an upward move, skip this entry (back to step 1).
6. **Left extension:** scan-left from the working X (the first column of the parent span). Let L = the count.
   - If L > 0:
     1. If L ≥ 3, push a **reverse-direction** entry (−dir, this y, x = left stop, count = L−2). This covers the left overhang, which is everything left of parent_start−1.
     2. Then set the saved X to the left stop and scan-right from parent_start+1.
     3. Push (dir, y, left stop, L + R), where R = the right count.
     4. Remaining −= R + 2.
   - If L = 0: remaining −= 1.
   - Invariant from here on: remaining = parent_last − current working X.
7. **Walk:** while remaining > 0 (signed):
   1. X+1.
   2. If the pixel is a border: remaining −= 1.
   3. Otherwise:
      1. Back up X by 1 and set saved X = X.
      2. Scan-right from X+1 with count C. Push (dir, y, saved X, C).
      3. Remaining −= C + 1.
8. **Right overhang** (when remaining ≤ 0):
   1. X = (last stop + 1) + remaining. This equals parent_last + 1.
   2. Overhang count = (stop − parent_last) − 2. If it is > 0, push a reverse-direction entry (−dir, y, x = parent_last+1, count). This covers parent_last+2 .. stop−1.
9. Back to the main loop.

## 11. DRAW string

**General:**

- The argument must be a string; otherwise you get the type-mismatch error from string checking.
- At start: N flag = B flag = 0. Set/reset flag = 1. Active colour = foreground.
- A sentinel is pushed for substring nesting.
- Characters are fetched one at a time. **Spaces are skipped everywhere**, including inside numbers. ';' and the single-quote character are ignored between commands.
- Fetching past the end of the string inside a command gives **?FC**.
- When a string ends, the previous (outer) string resumes. The sentinel ends DRAW.

**Commands:**

- **N:** toggles the no-update flag (two N's cancel).
- **B:** toggles the blank flag.
- Both flags are cleared after every movement (U D L R E F G H M). They survive C, A, S and X.
- **X name;** executes a substring:
  - The first character must be an uppercase letter A–Z (else ?FC). Characters are skipped up to a ';', which is required (running off the end gives ?FC).
  - The text between is evaluated as a variable reference by the normal variable parser. It must be a string (else type mismatch).
  - There is a free-stack check (?OM). The current string position is saved, and the substring runs.
  - A null substring returns immediately.
- **M:** move, described below.
- **Any other letter** takes an argument:
  - At end of string, the argument defaults to 1.
  - Otherwise peek at the next character. If it is an uppercase letter, the argument is 1 and the letter is left for the next command.
  - Otherwise read a value:
    - "=name;" gives a variable's value. The name rules are as for X. The value is converted to a byte (0–255, else ?FC).
    - Or decimal digits. The first character must be a digit (else **?FC**). Accumulate in a byte; going over 255 gives ?FC. Stop at the first non-digit, which is put back.
  - So "U;" or "U-5" is ?FC.
  - Then dispatch:
    - **C n:** n < 9 (else ?FC). Mapped per 0.5 for the current mode and stored as the **global foreground**; it persists after DRAW. It also becomes the active colour.
    - **A n:** n < 4 (else ?FC). Sets the angle.
    - **S n:** n < 63 (else ?FC). Sets the scale. Note that 63 is rejected even though the docs say up to 63.
    - **U** (0,−n) **D** (0,+n) **L** (−n,0) **R** (+n,0) **E** (+n,−n) **F** (+n,+n) **G** (−n,+n) **H** (−n,−n). Screen y grows downward.
    - Any other letter (including lowercase) gives **?FC**, raised after the argument is read.

**Relative movement (dx, dy as signed 16-bit):**

1. **Scale:**
   - If scale = 0, the values are unchanged.
   - Otherwise each component = sign × floor((|v| × scale mod 65536) / 4). The low 16 bits of the product are shifted right 2, unsigned.
   - So S4 = ×1, S1 = ¼, S8 = ×2, and so on.
2. **Rotate:** repeat "angle" times: (dx, dy) → (−dy, dx). That is 90° **clockwise on screen** each time; A1 turns U into R.
3. **Target:**
   - tx = last X + dx; if negative (signed), tx = 0.
   - ty = last Y + dy; if negative, ty = 0.
   - Then clamp, unsigned: tx ≥ 256 → 255, ty ≥ 192 → 191.
4. **Draw:**
   1. Working point 1 = last point; working point 2 = target, both logical.
   2. If the N flag is off, last point = target.
   3. Both points are scaled to device coordinates.
   4. If the B flag is off, draw a general line (section 8) in the active colour.
   5. Clear the N and B flags.

**M x,y:**

1. Read the first character after M.
2. If it is '+' or '−', that is the sign of x. Otherwise put it back.
3. Read the value (same value rules: digits or =var;, 0–255) and negate it if '−'.
4. The next character must be ',' (else **?FC**).
5. y is read the same way, with its own optional sign.
6. If x had an explicit '+' or '−', this is a **relative** move: (x, y) goes through the relative-movement steps above, so scale and angle apply. The sign of y alone does not make the move relative.
7. Otherwise it is **absolute**:
   - The target is (x, y) directly. No scale, no rotation, no negative test.
   - Only the unsigned clamps apply (≥ 256 → 255, ≥ 192 → 191).
   - So "M10,−5" (absolute with negative y) gives y = $FFFB, clamped to 191.
   - Then step 4 of relative movement, with the N/B flags as usual.

## 12. GET / PUT

**Syntax:**

- `GET [@](x1,y1)-(x2,y2),array[,G]`
- `PUT [@](x1,y1)-(x2,y2),array[,action]`, where action is one of PSET, PRESET, AND, OR, NOT (tokens).

**Parsing:**

1. A RAM hook is called first. It is shared with CLS; the disk system uses it. It is a no-op normally.
2. Optional "@". The coordinates are parsed like LINE (first point optional, defaulting to the stored last point). GET/PUT do **not** update the last point.
3. A comma, then the array name:
   - It is looked up by its two-character name in the array table. Not found gives **?FC**.
   - Looking it up via the simple-variable parser may create a same-named simple variable as a side effect.
   - A string array gives **?FC**.
   - The "end" pointer = the address just past the array block. The data pointer starts at the byte before the first data byte (after the header: name 2, size 2, dimension count 1, 2 bytes per dimension).
4. If nothing follows, this is **byte mode**. Otherwise **bit mode** is on and a comma is required:
   - **GET:** "G" is required (?SN).
   - **PUT:** an action token is required (?SN otherwise). The actions for (array bit 0 / array bit 1) are:
     - PSET: clear / set
     - PRESET: set / clear
     - OR: leave / set
     - AND: clear / leave
     - NOT: invert / invert (the screen bit is inverted whatever the array bit is)

**Geometry** (all logical, before scaling):

1. **Byte mode only:** first, the low byte of both x values is ANDed with $F8 (black-and-white modes) or $FC (colour modes).
2. dx = |x2−x1|; the working x becomes the smaller one. dy = |y2−y1|; the working y becomes the smaller one.
3. In colour modes, dx is doubled.
4. The working point and (dx, dy) are both scaled per 0.4, with the deltas treated as coordinates.
5. Row count = scaled dy + 1. Only its low byte is used.
6. **Byte mode:** bytes per row = (scaled dx / 8) + 1.
   - The start address is the byte containing the working point.
   - For each row: for each byte, advance the array pointer first. If it now equals the end pointer, you get **?FC**, and earlier bytes have already been transferred.
   - PUT copies the array byte to the screen. GET copies the screen byte to the array.
   - Then the next row starts at the row's start address + bytes-per-row.
7. **Bit mode:** bits per row = scaled dx + 1.
   - **GET:** first zero the whole array data area.
   - Start mask = the pixel mask of the working point. In colour modes it is ANDed with $AA, which keeps the high bit of the 2-bit pair.
   - The array bit mask starts as "before bit 7" and the pointer at the byte before the data. Each bit first moves the array bit mask right; when it wraps, it becomes bit 7 of the next array byte, checked against end (?FC).
   - **Array bits are packed MSB-first, continuously across rows. There is no padding at the end of a row.**
   - For each screen bit:
     - GET sets the array bit if the screen bit is 1.
     - PUT performs the 0-action or the 1-action on that single screen bit.
   - The screen mask always advances **one bit** (1-bpp stepping), even in colour modes. Colour pixels are transferred as their two bits separately.
   - At each row end, return to the row's start address + bytes-per-row, with the row's start mask.
   - Note: because dx is doubled and then scaled separately from x, the bit count in colour modes can be one less than "2 × pixels". Example: mode 3, x 0..10 gives 11 bits. Reproduce the arithmetic exactly.

## 13. PCOPY s TO d

- Each page number is a byte. 0 gives **?FC**.
- Page address high byte = base page $06 + (p−1)×6, with the same 8-bit wrap quirk as PMODE.
- If that high byte ≥ the program-start high byte, you get **?FC**. Only the start is checked.
- The "TO" token is required (?SN).
- 1536 bytes are copied from source to destination as 768 16-bit words, ascending.
- No mode or display change.

## 14. Dragon 32 vs Dragon 64 notes

- The graphics module is a single source file assembled into both the 32K-mode ROM (Dragon 32 compatible) and the 64K-mode ROM. I found no conditional assembly that changes graphics behaviour between them.
- Its only conditional is in boot initialisation, where the program start is forced to $1E01.
- The 32K-mode start-up code calls the graphics initialisation (section 0.2) during cold start. The 64K-mode start-up code doesn't call it. In 64K mode the graphics state is presumably inherited or set up elsewhere; I didn't trace that.
- I can't verify from this source that the shipped Dragon 32 ROM is byte-identical in the graphics area. The repo author says it is about 99% the same. Treat details like the S<63 limit and the 8-bit page-wrap quirks as "as in the D64 32K-mode listing".
- Hardware addresses used:
  - SAM at $FFC0–$FFD3 (V0–V2 at $FFC0–$FFC5, F0–F6 at $FFC6–$FFD3)
  - VDG control via PIA1 port B data at $FF22 (bits 3–7). Bits 0–2 are preserved on every write.

## 15. Things I'm unsure of

- **The boot PMODE:** the source shows 0, page 1 (the CoCo manuals often say otherwise). The value of the program-start low byte ($01) at boot is inferred from the cold-start code that zeroes the byte after the text screen and points just past it.
- **The trailing-character check after GET/PUT/CIRCLE/PAINT:** I believe garbage at the end gives ?SN from the normal statement dispatcher's end-of-statement check. This isn't explicit in the graphics module.
- **Exact error codes:** I've called them ?FC, ?SN, ?OM and type mismatch. They are the standard BASIC function-call, syntax, out-of-memory and type-mismatch errors, raised through the interpreter's normal error routines.
