# Dragon 32 printer, DLOAD and RAM hooks: reader facts

> Written 21.10.2026 by the reader (a separate Claude agent) from the original DragonBasic source. Facts only, in my own words: no code, no quotes, no original labels. The writer builds from this file alone.

**Source studied.** The Dragon 64 BASIC listing (32K-mode build), plus the 64K-mode copies for comparison. Files read: the OEM I/O driver (hardware init, default table, printer driver, serial host routines, the "patch" area, the D64 IRQ wedge, the vector table at the top of the ROM); the 32K-mode machine module (power-up/cold/warm start, the RAM-init tables, character in/out, device parameters, open checks, CLOSE, CLOAD/CLOADM, device-number parsing, EOF, CLS, the sound clock); the RAM-allocation module (vector and hook layout); the downloader module (DLOAD, DLOADM, gapped CLOADM); the shared core (error handler, READY/MAIN, NEWSTT, statement dispatch, RUN, CLEARC, INPUT/READ, LET, string literals, EVAL); the LIST/LLIST, crunch and PRINT module; PRINT USING; POS, TIMER and the clock IRQ in the extension module; the PLAY clock in the graphics module; the $8000 jump table; and the community reconstruction of the missing equates file (direct-page addresses). Cycle counts are my own, from standard 6809 timings. Marked "(scan-checked)" = I compared it with the page scans.

Conventions: `$` = hex. "Cycles" = CPU E-clock cycles; a PAL Dragon runs at **888,625 cycles/s** (as in the TAPE and SOUND specs). "Hook" = one of the 25 three-byte RAM hooks. "D64 patch" = code that this listing itself labels as a patch added to the 32K-mode ROM; I treat it as **probably not in the Dragon 32** (see 1.9).

---

## 0. Things that matter most

1. **The printer** is a parallel port: data on **$FF02** (PIA0 port B, the same lines as the keyboard columns), strobe on **$FF20 bit 1**, busy on **$FF22 bit 0** (1 = busy). The ROM waits for "not busy" **forever**: no timeout, no keyboard check, no BREAK.
2. **Printer RAM:** comma width $99 = 16, last comma field $9A = 116, width $9B = 132, position $9C = 0; auto-LF flag $0148 = $FF; end-of-line sequence at $014A (count 1, then $0D, $0A, 0,0,0,0). **A CR is never sent as such**: it is replaced by the EOL sequence (default: just $0D), preceded by a space if the line is empty.
3. **There is no SPC(** in this BASIC (no token). Only TAB(.
4. **DLOAD/DLOADM** in this source talk to a **6551 ACIA at $FF04–$FF07**, which only the D64 has. The host routines behind them are not in the D32. By my reading, the D64 code here **can never complete a transfer** (see 2.8). For the D32 the behaviour stays open.
5. **All 25 hooks** start as three RTS bytes ($39 $39 $39) at cold start. Warm start doesn't touch them. The IRQ RAM vector ($010C) is a jump to the ROM's 50/60 Hz clock routine; FIRQ ($010F) is a jump to the cartridge handler. SWI, SWI2, SWI3 and NMI RAM vectors are **left at zero** by the ROM.
6. **CLOADM of a continuous file does not check for extra characters before loading.** The extra text gives ?SN only **after** the whole file has loaded (via the statement loop). The gapped path checks before loading.

---

## 1. Part A: the printer (device −2, $FE)

### 1.1 Hardware (scan-checked)

| Where | Bit(s) | Role |
|---|---|---|
| $FF02 (PIA0 B data) | 7–0 | Printer data byte (all outputs). Shared with the keyboard column drive. |
| $FF20 (PIA1 A data) | 1 | Strobe, as written by the CPU: 1 then 0. A NOR gate on the board inverts it, so the printer sees a **low-going** pulse. |
| $FF20 | 7–2 | DAC. **The printer writes the whole byte**: $02, then $00. So every printed character sets the DAC to 0. Bit 0 is the cassette input, so the writes don't affect it. |
| $FF22 (PIA1 B data) | 0 | Busy input. Read, shifted into carry: **1 = busy, wait.** |

Hardware init (cold and warm start) writes $00 to $FF20, so the strobe starts low. PIA1 port B DDR is $F8 (PB0–PB2 inputs).

### 1.2 Sending one byte (the low-level "transmit" routine)

In order:
1. Save B.
2. **D64 only:** test the serial/parallel flag $03FF; if non-zero, send the byte to the 6551 instead (wait for transmit-empty, write $FF04) and return. Default 0 = parallel.
3. **Busy wait:** read $FF22 repeatedly until bit 0 = 0. Each poll is 10 cycles. No limit.
4. **D64 patch only (keyboard-interference wait):** write $00 to $FF02 (all columns low), read $FF00, force bit 7 to 1, and loop while the result isn't $FF. So while **any key or either joystick fire button** is held, printing stalls. Each pass is 19 cycles. (In the D64 this sits between the busy test and the data write; busy isn't re-checked afterwards.)
5. Write the character to $FF02.
6. Write $02 to $FF20 (strobe on), then clear $FF20 (strobe off, DAC 0).
7. Restore B and return. A, X, Y are unchanged.

**Timing (D64 path, not busy, no key held), my count.** From the data write to the strobe going high: **7 cycles** (≈7.9 µs). Strobe high time: **7 cycles** (≈7.9 µs; the clear is a read-modify-write that writes on its last cycle). The whole printable-character path through the character-output routine (not counting the BASIC dispatcher above it) is **≈134 cycles**. The busy poll happens ≈77 cycles after entry, and the data write at ≈90 cycles.

Interrupts are **not** masked anywhere in the printer driver. (The original has a comment wondering whether they should be.) The 50/60 Hz IRQ can fall anywhere, including between the data write and the strobe; that's harmless.

**Dragon 32 (inference):** the D64 reaches step 2 through a 6-byte "test flag, jump to patch" pair. That is exactly the size of a "read $FF22, shift, branch if busy" loop. So I believe the D32 does the busy wait in place there, followed directly by steps 5–7, with **no serial option and no keyboard-interference wait**. This is not visible in this source. Verify with the D32 ROM as a black box in XRoar (hold a key while LLISTing: on a D32 printing should not stall).

### 1.3 Printer not connected, or busy forever

- The busy loop never gives up. Nothing polls the keyboard inside it, so **BREAK does nothing**. Only reset gets out (warm start: RESET with a valid restart vector returns to OK; see 3.5).
- IRQ is not masked, so TIMER keeps counting and PLAY/SOUND timing continue.
- No error is ever raised by the printer.
- What a D32 reads on $FF22 bit 0 with **nothing plugged in** isn't in the source (it's hardware). If the line floats high, LLIST hangs at once; if it reads 0, characters go nowhere and BASIC carries on. **Open: check on a real D32, or see what XRoar does with no printer attached.**

### 1.4 Character output to the printer (the routine at $800F in the jump table)

Entry: A = character. It saves A, B and X. **D64:** Y is destroyed when an end-of-line is sent (see the delay below; Y ends at 0). This breaks the "all registers preserved" promise of the BASIC output routine. On the D32, Y is probably preserved (open).

1. **If A = $0D (CR):** go to "end of line" (step 4). The $0D itself is **not** sent.
2. **If A ≥ $20** (unsigned, so $80–$FF count too): add 1 to the position $9C. Control characters other than CR are sent but **don't** move the position.
3. Send the character (1.2). Then compare position with width ($9B). If position < width: done. If position ≥ width:
   - if the auto-LF flag $0148 is non-zero (default $FF): **just reset the position to 0**. Nothing extra is sent; the printer is assumed to wrap by itself.
   - if $0148 = 0: fall into "end of line".
4. **End of line:** if the position is 0, first send one **space** ($20) through the low-level routine. The position isn't changed. Then send the EOL sequence: the count byte at $014A, then that many bytes from $014B onward (up to 6). A count of 0 sends nothing. Then **reset the position to 0**.
5. **D64 patch only:** after the **last** EOL byte (only if the count ≥ 1), wait $03FD–$03FE × ≈10 ms (each unit = a 1118-count delay loop ≈ 8,970 cycles ≈ 10.1 ms). The default is 0 = no wait. Not in the D32 (inference).

Consequences:
- `PRINT #-2` (empty) sends **space, CR**.
- `PRINT #-2,"AB"` sends A, B, CR (no LF unless the user sets $014A to 2).
- Width 0 (by POKE) makes the position ≥ width after every character. That means a reset (auto-LF on) or an EOL after every character (auto-LF off).
- A width of 132 with auto-LF on: the 132nd printable character resets the position to 0 with no CR sent. A CR arriving just after that sends **space + CR** (the position is 0). With most printers that gives one blank line.

### 1.5 Printer RAM and defaults (scan-checked)

| Addr | Size | Meaning | Cold-start value |
|---|---|---|---|
| $99 | 1 | Comma field width | $10 (16) |
| $9A | 1 | Last comma field start | $74 (116) = width − 16 |
| $9B | 1 | Line width | $84 (132) |
| $9C | 1 | Current print position | 0 (RAM clear; not in the table) |
| $0148 | 1 | Auto-LF-on-full-line flag | $FF |
| $0149 | 1 | (Alpha lock: not printer) | $FF |
| $014A | 1 | EOL sequence length | 1 |
| $014B–$0150 | 6 | EOL sequence bytes | $0D, $0A, 0, 0, 0, 0 |
| $03FD–$03FE | 2 | **D64 only:** EOL delay in 10 ms units | 0 |
| $03FF | 1 | **D64 only:** 0 = parallel, non-zero = serial printer | 0 |

How they get there: the software-init routine copies a 13-byte ROM table into $8F–$9B (the cursor blink, tape and keyboard-debounce constants, then the three printer bytes). It then copies a second 9-byte table into $0148–$0150. On the D64, between the two copies, a patch clears $03FF and $03FD–$03FE and sets the destination pointer. On the D32 that 3-byte call is presumably just the "set destination to $0148" (inference: same size).

**Warm start keeps all of these**, including the position $9C (the init routine isn't re-run). Errors, NEW, CLEAR, RUN and END don't touch them either.

### 1.6 Device parameters for −2

When BASIC asks for device parameters with device $FE (and also $FD; see 2), it copies $99 → $6A (comma width), $9A → $6B (last comma field), $9C → $6C (position) and $9B → $6D (width). It clears the "special I/O" flag $6E. The Z flag on exit = (width is 0). Because the position is read from $9C each time, it always reflects what the driver has really sent.

### 1.7 PRINT #-2

- `#` is optional. The device number is parsed as in the TAPE spec 4.1. The output-open check always passes for −2. $6F = $FE for the statement, and it's set back to 0 at the end of PRINT.
- **End of PRINT:** if the list doesn't end in `;` or `,`, a CR goes out, which the driver turns into the EOL sequence.
- **Comma:** get the parameters. If position < last comma field (116), output spaces up to the next multiple of 16: count = 16 − (position mod 16), 1–16 spaces. Otherwise output a CR (EOL) and don't add spaces. The same logic on the screen uses 16/16/32. With an infinite-width device (tape) the comma always pads (but tape ignores it; TAPE spec 3.10).
- **Number items** get a trailing space unless the next character is a comma (same as the screen).
- **TAB(n):** see 4.2.
- **PRINT #-2, USING:** the USING output goes through the normal character output, so it reaches the printer the same way. In the value list, comma and semicolon both just separate (no comma tabbing). The final CR is sent unless the list ended with `,` or `;`.
- **PRINT @ with #-2** isn't possible: the `@` test comes before the `#` test. `PRINT #-2,@…` gives ?SN in the item evaluator (I didn't trace further).
- Output to the printer **doesn't switch the display** to text mode (only screen output does).

### 1.8 LLIST

LLIST = "set $6F to $FE", then the LIST code **unchanged**. That means the same line-range syntax and ?SN rules, and lines decrunched into the line buffer the same way. Differences that follow from the device:
- Each line starts with a "conditional CR": a CR is sent only if the printer position ≠ 0. So the first line has no CR before it if the head is at the left. After the last line, the loop's conditional CR ends the final line.
- An empty program prints nothing.
- The BREAK check between lines **is done** for the printer (it's skipped only for the tape). BREAK and SHIFT-@ pause work between lines. They can't work inside a busy wait. Keyboard scanning writes $FF02, but that doesn't matter because the printer latches data on the strobe.
- At the end: close (a no-op for −2), $6F = 0, then the READY path. "OK" appears on the screen.
- An error stops the listing; the message goes to the screen (the error handler clears $6F first). The printer position is left wherever it was.

### 1.9 POS(-2) and other printer users

- `POS(-2)` saves $6F, parses the argument, runs the output-open check (always OK for −2), reads the parameters and returns $6C (= $9C, 0–255). Then it restores $6F.
- `EOF(-2)`, `INPUT #-2`, `LINE INPUT #-2` and `OPEN "I",#-2` give **?FM**. `OPEN "O",#-2` and `CLOSE #-2` do nothing.
- Nothing else in the ROM prints to the printer: errors, BREAK, "OK" and TRON brackets all go to the screen after $6F is cleared. (TRON output during a PRINT #-2 statement could in theory go to the printer, because it's printed at the start of a line when $6F is already 0. I didn't find a case.)
- $6F reset rules are the same as in TAPE spec 4.3; LLIST is the one place that sets −2 outside a PRINT #.

### 1.10 Dragon 32 vs Dragon 64 for the printer

| Item | D64 (this source) | D32 |
|---|---|---|
| Ports, bits, strobe polarity, busy polarity | as 1.1 | same hardware (the D64 is D32-compatible here) |
| Busy wait | in a patch, after a serial/parallel test | inferred: in place, no serial test |
| Keyboard-interference wait | yes (patch) | inferred: **no** |
| EOL delay $03FD | yes (patch) | inferred: no; $03FD–$03FF free |
| Defaults $99–$9B, $0148–$0150 | as 1.5 | believed the same (the memory maps in the books agree on $0148–$0150); **not provable from this source** |

---

## 2. Part B: DLOAD / DLOADM and the $FD device

### 2.1 Does it exist on the Dragon 32?

The DLOAD keyword and the downloader module are Microsoft-common code. In this source the downloader calls three jump-table entries: read a byte from the host ($802A), send a byte to the host ($802D) and set the baud rate ($8030). These go to **6551 ACIA routines** that only the D64 has. The downloader module still declares (but doesn't use) the PIA1 data registers, the joystick reader and the keyboard poller. That suggests an older, bit-banged version once used PIA1 lines; on a Dragon those are the printer strobe and busy lines.

**For the D32 this source doesn't show what the three host routines do.** Whether D32 DLOAD bit-bangs, hangs or does nothing is open. Recommendation: run DLOAD on the real D32 ROM in XRoar as a black box (no source involved) before deciding. Given 2.8, a faithful copy may be a "does-nothing-useful" command.

### 2.2 Hardware (D64)

| Addr | Use |
|---|---|
| $FF04 | Transmit data (write) / receive data (read) |
| $FF05 | Status: bit 3 = receive full, bit 4 = transmit empty, bit 7 = interrupt |
| $FF06 | Command register. Init $0A: no parity, no echo, RTS on, transmit IRQ off, receive IRQ off, **DTR off**. |
| $FF07 | Control register. Init $98: **8 data bits, 2 stop bits, internal baud clock, 1200 baud.** |

Hardware init writes these two values and then reads $FF04 once to empty the receiver. Bit timing is the ACIA's, not the CPU's. There's no software bit timing at all.

**Baud argument** (the 6551 rate code goes into the low 4 bits of $FF07; the top 4 bits are kept):

| Arg | 0 | 1 | 2 | 3 | 4 | 5 | 6 | ≥7 |
|---|---|---|---|---|---|---|---|---|
| Baud | 110 | 300 | 600 | 1200 | 2400 | 4800 | 9600 | ?FC |

The rate persists until changed; hardware init rewrites $98, so **any reset (warm or cold) restores 1200 baud**.

**Receive one byte:** save B and CC, mask IRQ+FIRQ, set DTR (command bit 0 = 1), wait **forever** until status bit 3 is set, clear DTR, read $FF04, then restore B and **the caller's CC**. So DTR is raised only while the Dragon is actually waiting for a byte (per-byte flow control). Interrupts are masked during the wait, so BREAK can't work and TIMER stops.

**Send one byte:** save B and CC, wait forever until status bit 4 is set, write $FF04, restore B and **the caller's CC**. Interrupts aren't touched.

No timeout exists in either routine (scan-checked: both restore the full CC on exit).

### 2.3 Syntax

- `DLOAD ["name"] [, baud]`
- `DLOADM ["name"] [, [baud] [, offset]]`

Parsing, in order:
1. **Close the cassette first** (as CLOSE: an output file gets flushed and an EOF block written). This is because the downloader uses the tape buffer and tape RAM.
2. If the next character is `M`, it's DLOADM (skip the M).
3. Read the filename as for tape (8 bytes, space-filled, at $01D1–$01D9). It can be any string expression or nothing.
4. If the statement ends: keep the current baud. Otherwise a comma is required (else ?SN). If the next character is another comma: keep the baud and don't consume it. Otherwise evaluate a byte (0–255, else ?FC); a code ≥7 gives ?FC.
5. Open the file on the host and fetch block 0 (2.4, 2.5).
6. Set $6F = $FD.
7. **DLOAD:** the statement must end now (else ?SN; this happens after the host exchange). The ASCII flag must be non-zero (else **?FM**; the file type isn't checked). Then NEW, and the main line loop reads the program lines from the $FD device, exactly like an ASCII CLOAD (TAPE spec 3.3). Echo to $FD is thrown away. A line without a number gives ?DS.
8. **DLOADM:** go to 2.6.

### 2.4 Protocol: opening a file

Control codes: **$8A file request, $97 block request, $C8 ACK, $DE NAK (defined but never sent or tested by this code), $BC abort.** "LRC" = XOR of the bytes concerned.

1. Send **$8A**; read one byte. It must be **$8A** (an echo); anything else = failure.
2. Send the 8 filename bytes and keep an LRC of them. Send the LRC. Read one byte; it must be **$C8**.
3. Read the **file type**, the **ASCII flag**, then an **LRC byte**. The XOR of all three must be 0.
4. On success: if the type is **$FF**, give **?NE**. Otherwise return type and flag.

**Retries:** every failure in steps 1–3 adds 1 to an error count and restarts from step 1. On the **5th** failure, send **$BC** and give **?IO**.

### 2.5 Protocol: one block (128-byte blocks)

The block number (14 bits) is held in $7E–$7F (the next number to ask for). The first request is block 0, made immediately after the open.
1. Send **$97**; the echo must be **$97**.
2. Send the block number as two 7-bit bytes, **high 7 bits first, then low 7 bits** (bit 7 of each always 0), keeping an LRC. Send the LRC; the reply must be **$C8**.
3. Read the **length** byte, then **exactly 128 data bytes** (always, into $01DA–$0259), then an **LRC** byte. The XOR of length, 128 data bytes and LRC must be 0.
4. Same retry rule (fresh count per block; the 5th failure sends $BC and gives ?IO).
5. On success the tape-buffer count $79 = length and the pointer $7A = $01DA. **Length 0 = end of file.** The length isn't range-checked; a value above 128 would read stale bytes.

**When blocks are fetched:** the character-input routine for $FD works like the tape one. It takes a byte from the buffer, and if that **empties** the buffer it immediately requests the next block (prefetch), not the host loader. Reading a character with the count already 0 sets the EOF flag.

ASCII and binary files use the same blocks. The only difference is how the receiving statement uses the bytes.

### 2.6 DLOADM and the shared record loader (also gapped CLOADM)

- The file type must be 2 **and** the ASCII flag 0, else **?FM**.
- An optional `,offset` (evaluated by the ROM's usual 16-bit address evaluator, as for the CLOADM offset) is saved in $D3–$D4. Then the statement **must end** (?SN), checked **before** any data is loaded.
- Then repeat: read 1 byte = record type; 2 bytes = length (big-endian); 2 bytes = address (big-endian). Add the offset to the address and store it in $9D–$9E (the EXEC default) **for every record**.
  - Type ≠ 0: end. Close (only $6F → 0) and return. So EXEC uses the last record's address + offset.
  - Type 0: read `length` bytes into memory from that address. After each store, read it back; a mismatch gives **?IO**. **A length of 0 loads 65,536 bytes** (a quirk: the count is decremented after each byte).
- Running out of data in the middle of a record (EOF) gives **?IO**.
- Each byte comes through normal character input, so with $6F = $FF (gapped CLOADM) the bytes come from tape blocks, and with $FD from host blocks.

**Gapped CLOADM** enters this same loader after: force the cassette closed (no flush), skip M, read the filename, search the tape, set $6F = $FF, read the first block, then type/flag check (?FM) and offset/terminator check as above.

### 2.7 RAM used by DLOAD

| Addr | Use |
|---|---|
| $6F | $FD during DLOAD/DLOADM |
| $70 | EOF flag |
| $79, $7A–$7B | Buffer count / pointer (shared with tape) |
| $7E–$7F | Next block number (shared with the tape "block address") |
| $9D–$9E | EXEC address |
| $D3–$D4 | Load offset (shared with graphics/PRINT USING temporaries) |
| $01D1–$01D9 | Filename |
| $01DA–$0259 | 128-byte receive buffer (start of the tape buffer) |
| Stack | 4–8 bytes: error count, LRC, saved type/flag, block number |

**Errors:** ?SN (syntax/terminator), ?FC (baud), ?NE (file not found; error offset 52), ?FM (wrong type), ?IO (5 failures, memory verify, early EOF), ?DS (unnumbered line in a DLOAD file).

**$FD as a device:** a user can't select it (device parsing allows only 0, −1, −2). Inside the ROM: character output to $FD is discarded; character input reads the buffer and refills from the host; device parameters for $FD fall into the printer branch (harmless). An error resets $6F to 0, ending the transfer without telling the host (except after 5 failures, when $BC is sent).

### 2.8 Problem in this listing: the "time-out" flag

The downloader treats **Z = 0 after a host read** as "timed out". But the host read routine restores the **caller's** CC (scan-checked), so Z after a read is just whatever Z was before it. Tracing the code:
- Opening a file: the ASCII-flag read happens just after the file type is stored, so Z = (type = 0). The LRC read happens just after the ASCII flag is stored, so Z = (flag = 0). So the open only succeeds for type 0 with flag 0. DLOAD then rejects that with ?FM (it needs ASCII), and DLOADM also rejects it (it needs type 2). A "not found" reply ($FF) gives a retry, not ?NE.
- Fetching a block: the first data byte is read straight after loading the 128 count, so Z = 0 and the read is always treated as a time-out. Every block fails, and after 5 tries the Dragon sends $BC and gives ?IO.

**So, by my reading, D64 DLOAD/DLOADM in this listing can never succeed.** It either hangs (silent host: no real time-out exists) or ends in ?IO (or ?FM). The gapped CLOADM path isn't affected: it never calls the host routines. Uncertain: the shipped D64 ROM may differ from this listing. Check on a real D64 or in XRoar before relying on this.

---

## 3. Part C: low RAM vectors, the IRQ/FIRQ handlers, and the 25 hooks

### 3.1 CPU vectors

The top 14 bytes of the ROM ($BFF2–$BFFF, seen by the CPU at $FFF2–$FFFF) point at:

| CPU vector | Goes to |
|---|---|
| SWI3 | $0100 |
| SWI2 | $0103 |
| FIRQ | $010F |
| IRQ | $010C |
| SWI | $0106 |
| NMI | $0109 |
| RESET | the ROM power-up entry |

### 3.2 $0100–$0149 at cold start (listing bytes checked)

| Addr | Size | Content at cold start |
|---|---|---|
| $0100–$0102 | 3 | SWI3 RAM vector: **00 00 00** (only the RAM clear) |
| $0103–$0105 | 3 | SWI2: 00 00 00 |
| $0106–$0108 | 3 | SWI: 00 00 00 |
| $0109–$010B | 3 | NMI: 00 00 00 |
| $010C–$010E | 3 | IRQ: **JMP to the ROM clock routine** (3.3) |
| $010F–$0111 | 3 | FIRQ: **JMP to the ROM cartridge handler** (3.4) |
| $0112–$0114 | 3 | TIMER counter ($0112–$0113 live, big-endian) + 1 spare: 0, 0, 0 |
| $0115–$0119 | 5 | RND seed: $80 $4F $C7 $52 $59 |
| $011A | 1 | 0 (alpha lock in the CoCo; **D64 64K boot flag**) |
| $011B–$011C | 2 | 0 (debounce in the CoCo; **D64 boot checksum**) |
| $011D–$011E | 2 | 0, 0 (**D64:** last key, repeat countdown) |
| $011F | 1 | **$05 in this source (D64 key-repeat rate). D32 value open** (probably 0; nothing on the D32 uses it as far as I know) |
| $0120–$0129 | 10 | Table descriptor 0: count of statement words, statement word list, statement dispatch table, count of function words, function word list, function dispatch table (ROM addresses) |
| $012A–$0133 | 10 | Descriptor 1 (the "stopper"): counts 0. **The two dispatch words ($012D–$012E and $0132–$0133) = the ?SN error entry.** The list pointers ($012B, $0130) are left at 0. |
| $0134–$0147 | 20 | USR table: 10 words, **all = the ?FC error entry**. The direct-page pointer $B0–$B1 = $0134. |

The block $010C–$0129 (30 bytes) is one ROM table copied in one go. Then descriptor 1 and the hooks are set, then the USR table.

**Cold-start order** (for anything that depends on it): clear $0000–$03FF → clear the screen → size the RAM → set the memory pointers and stack → software init (the default tables, 1.5) → copy the direct-page block (the EXEC default and the CHRGET routine at $9D) → copy the $010C block → descriptor 1 → **fill $015E–$01A8 with $39** → set $02D9 non-zero → NEW-style clear → PLAY/DRAW defaults → USR table → graphics init → enable the 50/60 Hz IRQ at PIA0 (CRB bit 0) → if $C000–$C001 = "DK", jump to $C002 (disk ROM) → unmask IRQ/FIRQ → sign-on → restart vector $72–$73 = warm entry, restart flag $71 = $55 → OK.

### 3.3 The ROM IRQ handler (via $010C)

1. If PIA0 CRB ($FF03) bit 7 (field-sync flag) is **clear**: RTI at once (not ours).
2. Read $FF02 to clear the flag.
3. Add 1 to $0112–$0113 (wraps at 65536).
4. PLAY timing: set DP = 0. If the PLAY note counter $E3–$E4 ≠ 0, subtract the step at $D5–$D6. If the result is still > 0, RTI. If it reached ≤ 0: clear $E3–$E4, then **reshape the stacked state** so the RTI returns into the interrupted PLAY's wait. It takes the stacked CC, pulls the stack back to a mark left by PLAY, clears the E bit (so RTI pops only PC/CC), pushes the CC and does RTI. (See SOUND spec for PLAY's side.)
5. If no note is playing: if the SOUND countdown $8D–$8E ≠ 0, decrement it. RTI.

**D64:** the 64K mode wedges $010C to a handler that services the 6551 (on receive-full it drops DTR) and key repeat, then continues to the same clock routine. **The 32K-mode table in this listing points $010C straight at the clock routine**, which is what the D32 needs (no 6551, no auto-repeat).

### 3.4 The ROM FIRQ handler (via $010F)

1. If PIA1 CRB ($FF23) bit 7 (cartridge CART line) is clear: RTI.
2. Otherwise wait two "half-second" delays. Each one is a 65,536-count empty loop (the count comes from the always-zero word $8A–$8B): ≈524,288 cycles ≈ 0.59 s each, ≈1.18 s together. Interrupts stay masked.
3. Re-run hardware init (which leaves the cartridge interrupt disabled), clear the restart flag $71 (so RESET won't return to BASIC), and jump to $C000.

### 3.5 Warm start (RESET) versus cold start

On RESET the ROM always re-runs **hardware init** (PIAs, SAM, 6551 on the D64) first. Then, if $71 = $55 **and** the byte at the address in $72–$73 is $12 (a NOP opcode), it jumps there. BASIC's own warm entry then clears the PLAY counter $E3–$E4, re-enables the 50/60 Hz IRQ, sets $6F = 0, resets the stack (strings, FOR/GOSUB, CONT), unmasks interrupts, clears the screen and prints OK.

**Kept by warm start:** all of $0100–$01FF (RAM vectors, TIMER, RND seed, descriptors, USR table, auto-LF/EOL, joystick values, **hooks**), and the printer variables $99–$9C. **Re-initialised:** PIA/SAM state (so the motor goes off, the strobe goes low, the screen mode resets), the stack, $6F, the PLAY counter. Otherwise ($71 ≠ $55 or no NOP at the target), RESET does a full cold start.

### 3.6 The 25 RAM hooks

**Common contract:** every hook is called with a 3-byte extended JSR (opcode + 16-bit address $01xx; it pushes a 2-byte return address) **at the very top of its routine**, before the routine has pushed anything (unless noted). Its initial content is three RTS bytes, so it returns at once with **all registers and CC unchanged**. A replacement normally either (a) does its job and returns, letting the ROM routine carry on with the registers as the hook left them, or (b) discards its own return address (2 bytes) and finishes the job itself, returning straight to the ROM routine's caller. The ROM never checks a return value except where noted ("flags used"). Inputs listed are what the ROM has in registers/RAM at the call.

| # | Addr | Called from | At the call | Notes / effect of what the hook returns |
|---|---|---|---|---|
| 1 | $015E | OPEN, first thing | A = first character after OPEN, CC from fetching it | ROM then evaluates the mode string |
| 2 | $0161 | Device-number check (OPEN, CLOSE, PRINT #, INPUT #, LINE INPUT #, EOF, POS), after the number is stored in $6F | B = device number (signed byte), **N and Z from B** | **Flags used:** the ROM then accepts on Z = 1, gives ?DN on positive (N = 0, Z = 0), and ?DN below −2. A hook can accept extra devices by returning Z = 1 |
| 3 | $0164 | Device-parameter fetch, before anything is saved | caller's registers | ROM then sets $6A–$6E for 0/−1/other |
| 4 | $0167 | Character output, first thing | A = character | ROM continues with A; must preserve registers |
| 5 | $016A | Character input, first thing | — | ROM then clears EOF and reads per $6F (so a hook must take over to supply a character) |
| 6 | $016D | "Must be open for input" check | — | ROM then checks $6F/$78 |
| 7 | $0170 | "Must be open for output" check | — | as above |
| 8 | $0173 | Close-all (END, RUN, CLOSE with no argument) | — | ROM then closes the tape (sets $6F = −1 and falls into close-one) |
| 9 | $0176 | Close-one (CLOSE #n, close-all, end of LIST/LLIST/CSAVE,A, end of ASCII load, DLOADM end) | $6F = device | ROM then clears $6F and flushes/closes the tape if −1 |
| 10 | $0179 | Statement dispatch, after fetching the statement's first byte (known not to be a terminator) | A = token or first character | ROM then tests A (implicit LET if bit 7 = 0) |
| 11 | $017C | INPUT (not READ) when the typed line runs out before all variables are filled, just before "??" | X = input pointer | Meant for disk-file INPUT; ROM then prints "??" and reads another line |
| 12 | $017F | The BREAK check used by LIST/LLIST/CSAVE,A (once per line) | — | ROM then skips the keyboard poll if $6F = −1 |
| 13 | $0182 | Line input (the main prompt, INPUT, LINE INPUT, ASCII load), first thing | — | ROM then clears the INKEY$ holding byte and reads a line into $02DD |
| 14 | $0185 | Main loop sees EOF while loading an ASCII program (CLOAD/DLOAD) | — | ROM then closes the device and goes to OK |
| 15 | $0188 | EOF( function, first thing | FAC = argument (already evaluated) | |
| 16 | $018B | Operand evaluation, first thing (before the next character is fetched) | TXTPTR before the operand | Lets an extension add operand types |
| 17 | $018E | Error handler, first thing | **B = error code** (offset into the 2-letter table) | "User trap" |
| 18 | $0191 | Error handler, second thing | B = error code | ROM then: motor off + interrupts on, sound off, stack reset, $6F = 0, print "?xx ERROR [IN n]" |
| 19 | $0194 | RUN, first thing | A = character after RUN, Z = end of statement | ROM then sets PLAY/DRAW defaults, closes all, and runs |
| 20 | $0197 | **Two callers:** (a) building a string literal, after the length is known; (b) the variable-clear routine (NEW, RUN, CLEAR, RENUM, PCLEAR, program-line entry) | (a) B = length, X = end of literal; (b) — | (a) ROM then decides whether to copy the literal into string space |
| 21 | $019A | Statement loop, before interrupts are unmasked and the keyboard is polled | — | Called before **every** statement |
| 22 | $019D | String assignment (LET/INPUT/READ), before deciding whether to copy | $52–$53 = descriptor pointer | |
| 23 | $01A0 | **Four callers:** CLS (first thing; A = character after, **Z = no argument, and the ROM branches on Z afterwards**); RENUM's token scan (A = token); PUT/GET (B = 0 GET / 1 PUT, A = next character); assignment to an unknown function (A = second token byte; after return the ROM gives ?SN) | see left | The hook tells the callers apart by its return address |
| 24 | $01A3 | Crunch (tokenise), first thing | TXTPTR = line start | |
| 25 | $01A6 | Decrunch (LIST/EDIT), first thing | X = line's link field | |

Byte layout: hook n is at $015E + 3·(n−1). The last ends at $01A8. The fill loop writes $39 into all 75 bytes (so each hook is RTS, RTS, RTS).

---

## 4. Part D: small items

### 4.1 CLOADM of a continuous (non-gapped) file: extra characters

Order: force the cassette closed → skip M → read the filename (an expression) → **search the tape and read the header** → (continuous file) if the statement doesn't end here, **a comma is required** (else ?SN, raised after the search) and the offset is evaluated → type check (≠2 gives ?FM) → set the EXEC address and load address → **load the whole file** → motor off → back to the statement loop.

There's **no terminator check** in this path. Anything after the offset (e.g. `CLOADM "X",&H100,5`) is seen by the statement loop **after loading**: the memory is already written and the EXEC address already set, then **?SN**. A non-comma character straight after the filename gives ?SN **before** loading, but after the tape search.

For comparison: gapped CLOADM and DLOADM check the terminator **before** loading; CLOAD checks it **before** the search.

### 4.2 TAB( (and the missing SPC()

- **SPC(** isn't a keyword in this BASIC (the conditional code for it is absent). `SPC` would be read as a variable name.
- **TAB(n)**: n is evaluated as 0–255 (negative or >255 gives ?FC). The next character must be `)` (else ?SN). Then the current position for the device ($6C) is fetched, and count = n − position as an **unsigned byte subtraction**:
  - if n ≤ position: **nothing happens**: no spaces, **no new line**, no wrap.
  - otherwise, if the special-I/O flag is set (**tape**), nothing happens;
  - otherwise, send `count` spaces ($20) through normal character output.
- After TAB, a statement end gives **no CR** (like `;`).
- **Screen:** the position = cursor column 0–31. Targets beyond 31 just keep printing spaces, which **wrap** to the next line by the screen driver (TAB(40) from column 0 = 40 spaces: the cursor ends at column 8 of the next line; at the bottom it scrolls).
- **Printer:** the position = $9C. Each space adds 1. If the position reaches the width (132) with auto-LF on, it silently resets to 0 and the remaining spaces count from 0 (no CR sent). With auto-LF off, an EOL is sent at that point.
- **Tape:** ignored entirely (and items are separated by CRs anyway; TAPE spec 3.10).
- The padding character is always a space $20 on every device.

---

## 5. Sizes in the original (for ROM planning)

Taken from the listing's assembled addresses (32K-mode build).

| Part | Item | Bytes |
|---|---|---|
| **A printer** | transmit + EOL sender + character-output driver (OEM) | 76 |
| | D64 patches: serial/parallel select + busy + keyboard wait (22), EOL delay (20), init patch (13) | 55 |
| | Defaults: 3 printer bytes + 8 auto-LF/EOL bytes (of the 9-byte block) | 11 |
| | Device-parameter printer branch | 6 |
| | LLIST entry | 6 |
| | Output-dispatch branch + jump-table slot | 7 |
| | **Total D64 ≈ 161; estimated D32 (no patches, busy loop in place) ≈ 110** | |
| **B DLOAD** | DLOAD statement + host open/block protocol (downloader module minus the shared part) | ≈ 285 |
| | Record loader shared with gapped CLOADM (counted in the TAPE spec already) | 75 |
| | 6551 receive (29), send (14), baud select + 7-byte table (31), 6551 init (≈8) | ≈ 82 |
| | $FD branches in character in/out | ≈ 15 |
| | 3 jump-table slots | 9 |
| | **Total DLOAD-only ≈ 390** (plus the keyword text and dispatch word) | |
| **C hooks & vectors** | Hook fill loop | 11 |
| | 29 hook call sites × 3 | 87 |
| | IRQ clock routine (20) + PLAY clock (≈27) + SOUND clock (≈10) | ≈ 57 |
| | FIRQ cartridge handler + delay | ≈ 25 |
| | RAM-init table for $010C–$0129 (30) + its copy call (≈8) + descriptor-1 setup (≈7) + USR fill (≈14) | ≈ 59 |
| | CPU vector table | 14 |
| | **Total ≈ 250; the hooks alone ≈ 100** | |

---

## 6. Things I'm unsure of

1. **The D32 printer code.** The busy-wait placement and the absence of the keyboard wait and EOL delay are inferred from patch sizes, not seen. The defaults ($99–$9B, $0148–$0150) are believed identical but unproven from this source.
2. **The busy line with no printer** on a real D32 (hang or not): hardware fact, not in the source.
3. **D32 DLOAD:** what the three host routines ($802A/$802D/$8030) do on a D32, and whether those jump-table slots exist at all.
4. **The D64 DLOAD "Z flag" problem (2.8):** my reading of this listing is firm, but the shipped D64 ROM may be different.
5. **$011F:** 5 in this source (a D64 repeat rate); the D32 value is unknown.
6. **D64 32K-mode key repeat:** in this listing the 32K-mode IRQ vector skips the D64 repeat/serial wedge, so the repeat countdown would never run in 32K mode. That's odd and may mean the listing predates the shipped ROM. It doesn't affect the D32.
7. TRON output landing on the printer during PRINT #-2 (1.9): theoretical; not traced.

---

## 7. Follow-up (writer's questions)

### 7.1 The 13-byte table copied to $8F–$9B (scan-checked)

| Addr | Value | Meaning |
|---|---|---|
| $8F | $32 (50) | Cursor blink counter reload. The keyboard-wait loop calls "blink" once per pass. Each call decrements $8F. When it hits 0 it reloads 50 and toggles bit 6 of the character at the cursor. Every call then waits ≈10 ms (a 1118-count delay loop) |
| $90–$91 | **$01, $00** (256) | Leader length. **This source has 256, not 0,128.** Your "0,128" ($0080 = 128) is the assumed D32 value; it isn't in this source (TAPE spec 7) |
| $92 | $12 (18) | Bit threshold |
| $93 | $0A (10) | Half-cycle short/long threshold |
| $94 | $12 (18) | Half-cycle maximum |
| $95–$96 | $DA, $5C (218, 92) | Motor delay (55,900) |
| **$97–$98** | **$04, $5E (1118)** | **Keyboard debounce delay count.** When the keyboard scan sees a change in a column, it waits this many counts of a delay loop (8 cycles per count ≈ 8,944 cycles ≈ **10.1 ms**). Then it re-reads that column; if the rows differ from the first reading, the key is ignored |
| $99 | $10 | Printer comma width |
| $9A | $74 | Printer last comma field |
| $9B | $84 | Printer width |

So $8F–$96 = 50, **1, 0**, 18, 10, 18, 218, 92 in this source. Everything else matches yours.

### 7.2 Device parameters for the screen and the tape

Device-parameter routine. Entry: any registers. A, B and X are preserved; CC changes. Steps: clear $6E, then branch on $6F.

| | $6A comma width | $6B last comma field | $6C position | $6D width | $6E | Z on exit |
|---|---|---|---|---|---|---|
| 0 screen | 16 | 16 | **low byte of the cursor address ($89) AND 31**, i.e. the cursor column 0–31 | 32 | 0 | **0** (width ≠ 0) |
| −1 tape | 1 | 0 | 0 | 0 | **$FF** | **1** (width = 0, "infinite") |
| −2 / $FD printer | ($99) | ($9A) | ($9C) | ($9B) | 0 | 1 only if $9B = 0 |

The screen position always comes from the cursor address ($88–$89), even when a graphics mode is displayed. Z is set by storing the width (the last store), so Z = (width = 0).

**PRINT comma on the screen, step by step:**
1. Fetch the parameters: comma width 16, last field 16, position = column, width 32 (Z = 0).
2. If the column is **< 16**: count = 16 − (column mod 16). The ROM repeatedly subtracts 16 until it borrows, then negates; for columns 0–15 that gives 16 − column, so column 0 gives **16 spaces**. If $6E isn't set (on the screen it isn't), output that many spaces, so the cursor ends at column 16.
3. If the column is **≥ 16**: output a CR (on the screen the CR clears to the end of the line and moves to column 0 of the next line). **No spaces are added**; the next item starts at column 0.
4. Then fetch the next character and continue the list. A statement end straight after the comma gives no CR.

With an infinite-width device (tape) step 2 always runs with the raw position, and then the tape ignores the spaces because $6E is set.

### 7.3 Hardware init values and interrupt enabling

Hardware init (run on **every** power-up and RESET, and by the cartridge handler):
- **PIA0:** write $00 to $FF01 and $FF03 (selects the DDRs, interrupts off). DDRA $FF00 = $00 (all inputs). DDRB $FF02 = $FF (all outputs). Then $34 to **$FF01** and **$FF03**. $34 means: data register selected, CA2/CB2 = output held **low**, IRQ input on the **falling** edge, **IRQ disabled**. So the horizontal-sync (CRA) and field-sync (CRB) interrupts are both off, and the sound source select lines (CA2/CB2) are 0,0.
- **PIA1:** write $00 to $FF21 and $FF23. DDRA $FF20 = $FE (bit 0 input). DDRB $FF22 = $F8 (bits 0–2 inputs). Then $34 to **$FF21** (motor off) and **$FF23** (sound-enable CB2 low = off, cartridge interrupt disabled). Then $00 to $FF20 and $00 to $FF22 (VDG text mode).
- SAM: all 16 control bits cleared, then the display base is set to $0400 (F1). **D64 only:** the 64K memory bit is set, and the 6551 is set up.

**Cartridge interrupt:** enabled straight after hardware init, still in the power-up/reset path **before** the restart test. That means **at both cold and warm start**: **$37** is written to **$FF23**. $37 means: CB1 interrupt **enabled**, active on the **rising** edge, data register selected, CB2 output low (sound still off). It's only effective once the F bit is cleared.

**Field-sync (50/60 Hz) IRQ:** enabled by OR-ing bit 0 into **$FF03** (so it becomes $35). In the cold path this happens after the graphics init and before the disk-ROM test. In the warm entry it happens as the second step (7.4).

**Unmask:** "AND CC with $AF", which **clears bit 6 (F) and bit 4 (I)** together. At cold start this happens after the "DK" disk-ROM test, just **before the sign-on message is printed**. (If a cartridge is plugged in, its FIRQ can fire right here; see 3.4.) At warm start it's step 5 of 7.4. The statement loop and "motor off" do the same AND before every statement.

### 7.4 Warm start

- **$72–$73** points to BASIC's warm entry; the cold start sets it just after the sign-on. The **first byte there is $12** (the NOP opcode). The reset code checks that $71 = $55 and that the target's first byte is $12 before jumping. It jumps with a temporary stack at $03D7 (top of the line buffer) and **after** hardware init and the $FF23 = $37 write.
- **BASIC's warm entry, in order:**
  1. Clear the PLAY note counter $E3–$E4 (so the IRQ doesn't think a note is playing).
  2. Enable the field-sync IRQ (OR bit 0 into $FF03).
  3. $6F = 0.
  4. Stack reset: the temporary-string pointer $0B–$0C goes back to the start of the descriptor area ($01A9), and S = the stack top ($21–$22). A zero byte is pushed (bottom-of-stack marker, so FOR/GOSUB records are gone). CONT is forbidden ($2D–$2E = 0), and the subscript flag $08 = 0.
  5. Unmask IRQ and FIRQ (CC AND $AF).
  6. **Clear the screen** (green-space fill $60 over $0400–$05FF, cursor to $0400).
  7. Go to the READY path. Its conditional CR prints nothing (column 0), then "OK" and the line loop.
- **Kept:** the program, variables and string space (only the string temporaries are reset). The DATA pointer, **TRON** ($AF isn't touched), the tape-file state $78 and buffer, the printer state, all of $0100–$01FF, TIMER.
- **Sound and motor:** not stopped by the warm entry itself, but by the hardware init just before it. The motor relay goes off (CA2 low), the sound enable goes off (CB2 low), the sound source goes back to the DAC, and the DAC = 0. A SOUND or PLAY in progress is simply abandoned (RESET interrupts it). The SOUND countdown $8D–$8E isn't cleared; it just runs down in the IRQ.

### 7.5 The command-table descriptors

**Layout of each 10-byte descriptor:**

| Offset | Size | Content |
|---|---|---|
| 0 | 1 | Number of statement-type words in this list (0 = end of active lists) |
| 1 | 2 | Address of that word list |
| 3 | 2 | Descriptor 0: address of the statement **jump table**. Other descriptors: address of a statement **dispatch routine** |
| 5 | 1 | Number of function words (0 = end) |
| 6 | 2 | Address of the function word list |
| 8 | 2 | Descriptor 0: address of the function jump table. Others: a function dispatch routine |

Descriptor 0 = $0120–$0129, descriptor 1 = $012A–$0133 (counts 0, both routine words = the ?SN entry, list pointers 0). "Descriptor 2" would start at $0134, which **is the USR table**. So if an extension makes descriptor 1 active, the walk then reads $0134 as a count. That's the high byte of the ?FC address, which is non-zero, so it reads garbage. The original comments say a user of descriptor 1 must move the USR table first (it's reached through the pointer at $B0–$B1).

**Do the routines walk the RAM descriptors?** Yes, all of them read these RAM copies:
- **Crunch:** walks descriptors 0, 1, … for statement-type words, stopping at the first with a zero count. If there's no match, it walks again for function words (fields 5–6). The token number **starts at 0 and keeps counting across descriptors**, adding 1 for every word skipped. So descriptor-1 statement words get tokens **$80 + (descriptor-0 statement count) + index**, and descriptor-1 function words get **$FF, then $80 + (descriptor-0 function count) + index**. Words are matched in list order, descriptor 0 first, and a word matches if its letters equal the input with the last letter flagged by bit 7. There are at most 127 statement-type and 127 function tokens in total.
- **Decrunch (LIST):** takes the token with bit 7 removed (for $FF tokens, the second byte). It subtracts each descriptor's count in turn until the result goes negative; the word list of that descriptor is used. A token beyond all active lists (it reaches a descriptor with count 0) is listed as **"!"**.
- **Statement dispatch:** a statement token ≤ the last descriptor-0 **statement** token is dispatched through the jump table whose address is in **RAM $0123–$0124**. A token above that but ≤ the last descriptor-0 **normal** token (the non-statement words such as TO, THEN, TAB() gives ?SN. A token above that **jumps indirect through $012D–$012E** (descriptor-1 routine; ?SN by default). At that jump: A = the token, TXTPTR still points **at** the token (the next character hasn't been fetched), and the statement loop's return address is on the stack. A $FF prefix in statement position goes to the function-assignment path instead (MID$, TIME, then hook 23, then ?SN).
- **Function dispatch:** the second token byte is doubled, dropping bit 7. If the result is > twice the last descriptor-0 function number, it **jumps indirect through $0132–$0133** (descriptor-1 function routine; ?SN by default). At that jump: **B = 2 × (token − $80) (mod 256)**, A = the character after the token (already fetched), and the expression evaluator's return is on the stack. Otherwise the descriptor-0 table address is read from **RAM $0128–$0129**.

### 7.6 Hook call size

Yes: each hook call is a **3-byte extended JSR** (opcode $BD + the 16-bit address $015E…$01A6). "2-byte" in 3.6 was the size of the return address it pushes; I've fixed 3.6. A hook that wants to take over discards those 2 bytes.

### 7.7 Exact placement of hooks 21 and 10

**Statement loop, per statement, in order:**
1. **Hook 21 ($019A)**: the very first thing, with interrupts still in whatever state the previous statement left them.
2. Unmask IRQ+FIRQ (CC AND $AF).
3. Keyboard poll: BREAK → STOP; SHIFT-@ → pause until another key; any other key is saved in $87 for INKEY$.
4. Save TXTPTR in $2F–$30 and look at the current character: ":" → go to the dispatcher. 0 → end of line: if the next link is zero, the program has finished; otherwise load the new line number into $68–$69. **If TRON is on ($AF ≠ 0), print "[", the line number, "]" here**, at the start of each new line only, not for statements after ":". Then go to the dispatcher. Anything else → ?SN.
5. **Dispatcher:** fetch the first byte of the statement. A terminator (empty statement) returns to step 1 without calling hook 10. Otherwise **hook 10 ($0179)**, with A = that byte. Then the token test and dispatch.

So hook 10 comes **after** the TRON output, and it's skipped for empty statements. The dispatcher (step 5) is also entered directly by IF…THEN/ELSE for a statement after THEN/ELSE, so hook 10 runs for those statements too, while hook 21 doesn't run again until the next statement boundary. Those are the only two callers of the dispatcher (the statement loop and the THEN/ELSE path; the extension module names it but never calls it).
