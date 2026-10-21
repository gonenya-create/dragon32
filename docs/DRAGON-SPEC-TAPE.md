# Dragon 32 cassette: reader facts (stage 3 part 5)

> Written 20.10.2026 by the reader (a separate Claude agent) from the original DragonBasic source. Facts only, in its own words: no code, no quotes. The writer builds from this file alone.

**Source studied.** The Dragon 64 BASIC listing (32K-mode build). I read: the OEM I/O driver module (PIA set-up, the default-value table copied into RAM at start-up, motor on/off, bit and byte input, sync acquisition, byte output with its sine table, the leader writer); the 32K-mode machine module (character in/out dispatch, device parameters, line input, open checks, CLOSE, CSAVE, CLOAD, EXEC, the BREAK-check wrapper, filename and device-number parsing, EOF, SKIPF, OPEN, tape search, block read and write, MOTOR); the shared "extension" module (CSAVEM, LINE INPUT, POS, the $A000 vector table); the downloader module (the gapped CLOADM path, shared with DLOADM); the shared core (error handler, READY/MAIN line loop, NEW/CLEAR/RUN/END/STOP, NEWSTT, PRINT, INPUT); the token/error-text module (error-code order, the $8000 jump table); and the community reconstruction of the missing common-equates file for direct-page addresses. I compared the 32K-mode and 64K-mode copies of every cassette routine: they are identical apart from comment typos. I checked the sine table and the default-value table against the page scans; those are marked "(scan-checked)". Cycle counts are my own, from standard 6809 instruction timings. No source text, labels or instruction sequences are reproduced. Where I'm unsure, I say so.

Conventions: `$` = hex. "Cycles" = CPU (E-clock) cycles. As in the SOUND spec, a PAL Dragon (14.218 MHz crystal) runs at **888,625 cycles/s**; multiply Hz by 1.0070 for a 14.31818 MHz machine. "Poll" = one pass of the input-sampling loop (28 cycles, see 1.6). "Direct mode" = the statement was typed, not run from a program line (current-line high byte = $FF).

---

## 0. Global facts

### 0.1 RAM used by the cassette system

| Addr | Size | Meaning |
|---|---|---|
| $6A–$6D | 4 | Current device parameters (comma-field width, last comma field, position, width). For the tape they're set to 1, 0, 0, 0 (width 0 = infinite). |
| $6E | 1 | "Special I/O" flag. Set (non-zero) whenever device parameters are fetched for the tape; zero for screen and printer. See 4.3/4.4. |
| $6F | 1 | Device number: $00 screen/keyboard, $FF tape, $FE printer, $FD = host download (internal only; a user can't select it). |
| $70 | 1 | End-of-file flag, set by character input when the tape buffer is empty. Cleared at the start of every character input. |
| $78 | 1 | Tape-file state: **0 closed, 1 open for input, 2 open for output.** |
| $79 | 1 | Number of characters in the tape buffer (0–255). |
| $7A–$7B | 2 | Pointer to the next character in the tape buffer. |
| $7C | 1 | Block type of the block being read/written. |
| $7D | 1 | Block length (0–255). |
| $7E–$7F | 2 | Block data address (where a block is read into / written from). Also reused as the host-download block number. |
| $80 | 1 | Running checksum. |
| $81 | 1 | Shared: byte countdown during a block, then the block-read result: **0 OK, 1 checksum error, 2 memory error.** |
| $82 | 1 | Poll counter used when timing half-cycles and cycles (wraps at 256). |
| $83 | 1 | Bit counter inside byte input (8→0); also the signed sync counter during sync acquisition. |
| $84 | 1 | Bit-phase flag: 0 = time bit cycles rising-edge to rising-edge; non-zero = falling-edge to falling-edge. Set by sync acquisition. |
| $85 | 1 | The DAC value held back from the previous bit (see 1.3). |
| $8A–$8B | 2 | Always zero (used as a source of zero). |
| $90–$91 | 2 | Leader length in bytes (big-endian). |
| $92 | 1 | Bit decision threshold, in polls (a cycle whose poll count minus 1 is below this is a "1"). |
| $93 | 1 | Half-cycle short/long threshold, in polls (used only during sync). |
| $94 | 1 | Half-cycle maximum, in polls (used only during sync). |
| $95–$96 | 2 | Motor spin-up delay count (8 cycles per count). |
| $9D–$9E | 2 | Default EXEC address (set by CLOADM, used by EXEC with no argument). |
| $D3–$D4 | 2 | Load offset during the gapped CLOADM path (shared with graphics temporaries). |
| $01D1 | 1 | Length of the filename string given in the statement (0 = no name). |
| $01D2–$01D9 | 8 | Filename buffer (wanted name, or name to save). Space-filled first. |
| $01DA–$02D8 | 255 | Tape buffer. Holds a block's data; the first 15 bytes double as the header when a header is built or read. |

Header field addresses inside the buffer: name $01DA–$01E1, file type $01E2, ASCII flag $01E3, gap flag $01E4, exec address $01E5–$01E6, load address $01E7–$01E8.

### 0.2 Hardware bits

| Where | Bit | Role |
|---|---|---|
| $FF20 (PIA1 A data) | 7–2 | 6-bit DAC. Tape output writes the whole byte; the table values all have bits 1–0 clear. |
| $FF20 | 1 | Printer strobe. Tape output always writes it as 0. |
| $FF20 | 0 | **Cassette input** (set as an input). Read by polling; the level goes into the carry. |
| $FF21 (PIA1 A control) | 3 | **Motor relay** (CA2 as an output). 1 = motor on. Motor on/off is read-modify-write: only bit 3 changes. |
| CPU CC | I and F | Both masked during all tape timing. Unmasked by "motor off" (and at the start of every statement, see 5). |

The tape code **never writes** $FF01, $FF03 (sound-source select) or $FF23 (sound enable). So writing a tape doesn't change what the TV speaker plays; that depends on AUDIO/SOUND state (see DRAGON-SPEC-SOUND.md). (Hardware knowledge, not from the source: the DAC output feeds the cassette output connector directly.)

### 0.3 Defaults

At cold start, low RAM below the screen is cleared first. So all of $78–$85 start at 0, including the held-back DAC value ($85 = 0) and the whole tape buffer and filename area. Then a ROM table is copied into $8F onward. The tape part of it, as in this source (scan-checked):

| Addr | Value | Meaning |
|---|---|---|
| $90–$91 | **$0100** (256) | Leader bytes — **this is the D64 (32K-mode) value; the Dragon 32 value is not in this source** (see 7) |
| $92 | $12 (18) | Bit threshold |
| $93 | $0A (10) | Half-cycle short/long threshold |
| $94 | $12 (18) | Half-cycle maximum |
| $95–$96 | $DA5C (55,900) | Motor delay = 10 ms constant ($045E = 1118) × 50 |

Hardware init writes $34 to $FF21 (motor off, CA2 output) and $00 to $FF20 (DAC 0, strobe low).

The warm restart (reset button with a valid restart vector) re-initialises the PIAs, so **the motor goes off**. But it **does not change $78** (an open file stays "open") or the buffer. It clears the device number.

---

## 1. Low level

### 1.1 Motor

- **Motor on:** set $FF21 bit 3, then busy-wait $95–$96 counts. Each count is 8 cycles. The default 55,900 counts = 447,200 cycles ≈ **0.503 s**. Interrupts are not touched. The wait happens **every time**, even if the motor was already on. A count of 0 means 65,536 (≈0.59 s). Exits with A and X changed (X = 0).
- **Motor off:** clear $FF21 bit 3, then **unmask IRQ and FIRQ**. Exits with A changed. This is the only place in the tape system where interrupts are re-enabled.

### 1.2 Interrupt masking

These all mask IRQ and FIRQ: sync acquisition, block read, block write and the leader writer. Nothing in them unmasks again; only "motor off" does. So for the whole of a continuous load or save, interrupts stay masked from the first motor-on to the final motor-off. Consequence: the field interrupt doesn't run, so **TIMER doesn't advance**, and SOUND/PLAY timing and keyboard auto-repeat freeze during tape I/O.

### 1.3 Output: waveform per bit

A byte goes out **low bit first**, 8 bits, with no start or stop bits. Each bit is **one full cycle** of a stepped sine. It's taken from a 36-entry table (scan-checked):

| Index | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| value | $80 | $90 | $A8 | $B8 | $C8 | $D8 | $E8 | $F0 | $F8 |
| index | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 |
| value | $F8 | $F8 | $F0 | $E8 | $D8 | $C8 | $B8 | $A8 | $90 |
| index | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 |
| value | $78 | $68 | $50 | $40 | $30 | $20 | $10 | $08 | $00 |
| index | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 |
| value | $00 | $00 | $08 | $10 | $20 | $30 | $40 | $50 | $68 |

So the cycle starts at mid-level, goes **high first** (indices 0–17), then low (18–35).

Order of DAC writes for one bit:
1. Write the value **held back** from the previous bit (RAM $85).
2. For a **0**: write indices 0,1,2,…,34 in turn (35 writes). Index 35 ($68) is *not* written; it's stored in $85 for the next bit.
3. For a **1**: write the even indices 0,2,4,…,32 (17 writes). Index 34 ($50) is *not* written; it's stored in $85.

So a 0 is 36 DAC steps and a 1 is 18. Each bit's first step is the previous bit's held-back value. This is meant to smooth the join between bits. At cold start $85 = 0, so the very first bit after power-on starts with DAC $00. The held value carries over between separate saves.

Between bytes and between blocks, the DAC simply **holds the last value written**. That's index 34 ($50) after a final 0 bit, or index 32 ($30) after a final 1 bit.

**Exact timing (cycles), my count, confirmed against Ciaran Anscomb's figures:**

| | Cycles between successive DAC writes | Whole bit |
|---|---|---|
| 0 bit | first gap 26, then 22 each, last gap (to next bit's first write) 39 | **813** |
| 1 bit | first gap 27, then 23 each, last gap 40 | **435** |

At 888,625 Hz that's **1093.0 Hz** (0) and **2042.8 Hz** (1). At 894,886 Hz it's 1100.7 / 2057.2 Hz. **Ciaran's 813/435 are exactly right** for bits inside a byte. The "1200/2400 Hz" in the books is nominal only.

**Extra time at byte boundaries.** The last bit of each byte is stretched by the caller's overhead. Extra cycles added to the last bit of the *earlier* byte:

| Boundary | Extra cycles |
|---|---|
| leader byte → leader byte (leader writer) | 31 |
| block's first $55 → sync $3C | 33 |
| sync → type | 35 |
| type → length | 35 |
| length → first data byte | 42 |
| length → checksum (empty block) | 40 |
| data → data | 46 |
| last data → checksum | 44 |
| checksum → trailing $55 | 26 |

(These assume the block writer is reached through the $8000 jump table, as in the original: two extra jumps per byte. A leader byte of $55 = bits 1,0,1,0,1,0,1,0 takes 4×435 + 4×813 + 31 = **5,023 cycles ≈ 5.65 ms**. So 256 leader bytes ≈ 1.45 s and 128 ≈ 0.72 s.)

Before the first byte of each block, the writer first adds up the checksum over the data in memory. That's about 11 cycles per data byte (≈2,800 cycles ≈ 3.2 ms for 255 bytes), plus a few dozen cycles of set-up. The DAC holds steady during this. It's a short flat gap between the previous byte and the block's first $55.

### 1.4 Leader writer

The leader writer masks interrupts and does a motor-on (with the 0.5 s wait, during which the DAC holds steady: a silent stretch on the tape). It then writes the number of bytes in $90–$91, each **$55**. A count of 0 means 65,536 bytes. It keeps B and Y. It changes A (= $55), X (= 0) and CC. It does **not** write the sync byte; the block writer adds its own $55 + $3C.

### 1.5 Block writer

Input: type in $7C, length in $7D, data address in $7E–$7F. It masks interrupts. It works out the checksum = (length + type + all data bytes) mod 256 and puts it in $80. Then it writes **$55, $3C, type, length, data…, checksum, $55**. It does **not** turn the motor on, write a leader or turn the motor off. On exit X = data address + length, A = $55, B = 0, $81 = 0, and interrupts are still masked. The usual wrapper "write block" = leader writer (motor on + wait + leader) + block writer + motor off.

### 1.6 Input: sampling

One **poll** = add 1 to the poll counter ($82), read $FF20, take bit 0. It costs **28 cycles** per poll (31.5 µs) in the wait loops. "Wait while high" polls until it reads low. "Wait while low" polls until it reads high. The counter includes the poll that sees the change. There is **no timeout anywhere**. A steady input makes the counter wrap silently and the wait goes on forever.

### 1.7 Input: sync acquisition (the "$A004" entry)

1. Mask IRQ/FIRQ, motor on (with the 0.5 s wait), set the signed sync counter ($83) to 0.
2. **Wait for a rising edge:** wait while high, then wait while low.
3. Time half-cycles. Each one is the polls from one edge to the next. Classify it: **short** if below $93 (10); **long** if above $93 and at most $94 (18); **too long** if above $94. A too-long half resets the sync counter to 0. It then counts as neither short nor long. A half of exactly 10 also counts as neither.
4. It's a four-state machine:
   - **A** (time a high half): long → B; otherwise → C.
   - **B** (time a low half): long → A; otherwise → D.
   - **C** (time a low half): short → D; otherwise → counter +1. If the counter is now **+96**, finish with the phase flag $84 **non-zero**. Otherwise go back to step 2.
   - **D** (time a high half): short → C; otherwise → counter −1. If the counter is now **−96**, finish with $84 = **0**. Otherwise go back to step 2.
   Start in A after each step 2.
5. On a $55 leader with the "high half first" polarity, every 1-to-0 bit boundary gives one −1. That's 4 per leader byte, so sync needs at least **24 clean leader bytes**. With the input inverted, the +1 path does the same job. Flag 0 means bit cycles are later timed rising-edge to rising-edge. Non-zero means falling-edge to falling-edge. This is how the reader copes with either polarity.

On exit: A, B, X and CC are changed. **U and Y are kept.** $82–$84 are changed. Interrupts stay masked and the motor stays on.

### 1.8 Input: one bit, one byte

- **Bit:** reset the poll counter. Then, by the phase flag, wait through one high half then one low half (flag 0), or low then high (flag ≠ 0). Take the poll count, **subtract 1**, compare with $92 (18). **Less than 18 → bit 1, otherwise → bit 0.** So 18 or fewer polls is a 1; 19 or more is a 0. (≈ 532 cycles of polling, plus about 70 cycles between bits that aren't counted. The effective boundary is a cycle of roughly 600 cycles ≈ 1.5 kHz. That's an estimate, not a measured figure.) It changes B and $82. The result is in the carry.
- **Byte:** 8 bits, each shifted in **from the top**, so the first bit read ends up as bit 0 (low bit first). It changes A (result) and B, and leaves $83 = 0.

Half-cycle thresholds ($93/$94) are used **only during sync**. During data, only the full-cycle threshold $92 matters.

### 1.9 Block reader (the "$A006" entry)

Input: data address in $7E–$7F. Steps:
1. Mask IRQ/FIRQ. "Blink" the screen's top-left character (only in direct mode, see 3.2).
2. Start a shift register at 0. Read bits one at a time, shifting each into the top. After every bit, compare with **$3C**. Keep going until it matches. This is bit-aligned: there's no byte framing before the sync byte, and no limit on how long it hunts.
3. Read type → $7C. Read length → $7D. Checksum = type + length.
4. For each data byte: read it, store it at the data address, **read it back**. If the read-back differs (ROM or missing RAM), stop at once with result **2**. The rest of the block isn't read, and X points one past the bad address. Otherwise add the byte to the checksum and move on.
5. Read the checksum byte. If it equals the running sum, the result is **0**; otherwise **1**.
6. Store the result in $81 and A. Z is set only on 0. X = data address + length (unless result 2). U and Y are kept. **Interrupts stay masked and the motor stays on.** The trailing $55 is not read.

Note: between blocks of a continuous file, the reader doesn't redo bit sync. It just hunts for the next $3C through the trailing $55 of the previous block, the short flat gap and the next block's $55.

The usual wrapper "read block" = sync acquisition (motor on + 0.5 s + sync) + block reader + motor off (unmasks). It returns the result code in B with flags set.

### 1.10 Entry points

| Address | Does | Notes |
|---|---|---|
| $8015 | motor on + wait | A, X, CC change |
| $8018 | motor off + unmask | A, CC change |
| $801B | leader writer | |
| $801E | write one byte (A) | A kept; B, Y, CC change (Y ends at table end) |
| $8021 | sync acquisition | |
| $8024 | read one byte → A | B, CC change |
| $8027 | read one bit → carry | B, CC change |
| $A004 (vector) | → $8021 | |
| $A006 (vector) | → block reader (1.9) | |
| $A008 (vector) | → block writer (1.5) | no leader, no motor |
| $A00C (vector) | → $801B | |

---

## 2. Block and file format

### 2.1 Block

| Order | Bytes | Content |
|---|---|---|
| 1 | 1 | $55 |
| 2 | 1 | $3C (sync) |
| 3 | 1 | type: $00 header, $01 data, $FF end of file |
| 4 | 1 | length 0–255 |
| 5 | length | data |
| 6 | 1 | (type + length + data) mod 256 |
| 7 | 1 | $55 |

The end-of-file block is always `55 3C FF 00 FF 55`.

How readers treat **unexpected type values** (for robustness; the writer only ever makes 0, 1 and FF):
- Binary CLOAD and continuous CLOADM: 0 → error; $01–$7F → data; $80–$FF → end.
- Reading a gapped file's buffer: 0 → error; $80–$FF → end; $01–$7F → data. A data block of length 0 is skipped.
- Skipping a file: 0 → error; $FF → end; $01–$80 → data; $81–$FE → error.

### 2.2 Header (type 0, length 15)

| Offset | Size | Meaning |
|---|---|---|
| 0–7 | 8 | name |
| 8 | 1 | file type: 0 BASIC program, 1 data, 2 machine code |
| 9 | 1 | ASCII flag: 0 binary, $FF ASCII |
| 10 | 1 | gap flag: 0 continuous, $FF gapped |
| 11–12 | 2 | exec address, high byte first |
| 13–14 | 2 | load address, high byte first |

The header is built in place in the tape buffer. Only the name, type and the two flags are written each time. **Bytes 11–14 are written only by CSAVEM.** For every other kind of save they hold whatever was in the buffer: zeros after power-on, else old file data, or the overflow of a long filename (see 3.1).

### 2.3 Layout on tape

| Kind | Made by | Header (type/ASCII/gap) | Body |
|---|---|---|---|
| **Continuous** | CSAVE (binary), CSAVEM | 0/0/0 or 2/0/0 | Header written as: motor on, 0.5 s, leader, header block, motor off. Then right away: motor on, 0.5 s, leader, then data blocks **back to back** (255 bytes each, last one shorter), then the EOF block, then motor off. No leader or motor change between blocks. |
| **Gapped** | CSAVE ,A and OPEN "O" | 0/FF/FF or 1/FF/FF | Header as above. Then **each** data block, and the EOF block, is written separately: motor on, 0.5 s, full leader, block, motor off. The time between blocks is whatever the program takes. |

"0.5 s" is the motor wait. The DAC is steady then, so it's silence on the tape. The motor-off/motor-on between header and body happens within microseconds, so on tape it shows up as ≈0.5 s of silence. So a header block is preceded by (leader count + 1) $55 bytes before its $3C.

---

## 3. Statements

### 3.1 Filenames (shared)

- First the 8-byte filename buffer is filled with spaces and the length byte ($01D1) is set to 0.
- If the statement ends here, there's no name.
- Otherwise a **string expression** is evaluated (a number → ?TM). Its length goes in $01D1. If the length is 0, it means "no name". Otherwise **all** its characters are copied into the name buffer, starting at its first byte. So a short name is padded with spaces (they were pre-filled). A name **longer than 8 overflows into the tape buffer**: up to 247 more bytes. Only the first 8 count as the name. (A 20–23-character name leaves its 20th–23rd characters in the exec/load bytes of a CSAVE header.)
- **Matching:** all 8 bytes are compared exactly, with no case folding. If the wanted name's length is 0, the first header found is taken.

### 3.2 Search (CLOAD, CLOADM, SKIPF, OPEN "I")

1. If the cassette is already open (state ≠ 0) → **?AO**. (CLOAD and CLOADM force it closed first, so they never give AO here.)
2. In **direct mode only**: clear the screen (all 512 cells to $60, cursor home). Put the character code $53 ("S", normal video) at $0400, and move the cursor to $0402.
3. Read blocks (each read: motor on, 0.5 s, sync, block, motor off). Skip any block that fails its checksum or isn't a header, silently and endlessly.
4. For a header: in direct mode, print its 8 name bytes through the normal screen output from the cursor ($0402–$0409). That means the usual character mapping; control characters print nothing. Compare with the wanted name.
5. **Match, or no wanted name** → in direct mode put $46 ("F", normal) at $0400. Then return. The header stays in the buffer ($01DA…). The motor is off.
6. **No match** → skip the file (3.7). A read error, or a header found in the middle of it → **?IO**. Then go back to step 2 (screen cleared again, new "S").

**Blink:** at the start of every block read, in direct mode, bit 6 of the byte at $0400 is flipped. So the S, or later the F, alternates between normal and inverse video, once per block attempt. In program mode, **nothing at all** is shown: no clear, no S/F, no name, no blink.

### 3.3 CLOAD ["name"]

1. Force the cassette closed ($78 = 0). If it was open for output, the last partial buffer and the EOF block are **lost**.
2. If the next character is "M" → CLOADM. (The check is on the next non-space character, so `CLOAD M…` is taken as CLOADM.)
3. Drop the return to the statement loop: **CLOAD never continues a program.**
4. Read the filename. The statement must end → else **?SN** (before any tape action).
5. Search (3.2).
6. **Gapped file:** the ASCII flag must be non-zero, else **?FM** (the program is kept). The file type isn't checked, so a data file loads as program text. Then:
   - NEW: the program is wiped and variables cleared.
   - Set the device to tape, mark the file open for input, and load the first data block into the buffer.
   - Go to the line-entry loop. Each line is read from tape as if typed:
     - echo is suppressed;
     - bit 7 is stripped;
     - characters below $20 or above "z" are dropped;
     - at most 249 characters are kept;
     - CR ends the line.
   - Numbered lines are stored as if typed: each insert clears the variables and re-links. Blank lines are ignored. **A line without a line number → ?DS.**
   - At end of file (when a line read hits the end): close the file (state 0) and print "OK" via the normal ready path. A partial line cut off by end of file is discarded.
7. **Continuous file:** the file type must be 0, else **?FM** (the program is kept). The ASCII flag isn't checked. Then:
   - NEW.
   - Motor on and sync.
   - Load blocks one after another, starting at the start-of-program address. Before each block: the block address + 256 + 58 must be below the stack pointer, else **?OM**.
   - Block read error, or a header block in the middle → NEW again (whatever loaded is wiped) and **?IO**.
   - At the EOF block: end-of-program = the address after the last byte. Motor off.
   - Print CR, "OK", CR, even in program mode. Clear variables, rebuild every line link (so a program saved at another start address loads correctly), and go to the line-entry loop.
   - The variables are cleared and the program is **not** run.
   - After ?OM the motor is off. The loaded bytes are left in memory but end-of-program is just past an empty program. What LIST then shows is not analysed.

### 3.4 CLOADM ["name"][,offset]

1. Force closed; skip the "M"; read the filename (no end-of-statement check yet); search.
2. **Continuous file:**
   - If something follows: a comma (else ?SN), then an address expression. A negative value or one ≥ 65,536 → ?FC. Note this is parsed **after** the tape search.
   - The file type must be 2, else **?FM**.
   - EXEC address ($9D–$9E) = header exec + offset. Load address = header load + offset. Both wrap at 16 bits.
   - Motor on and sync. Read blocks into memory one after another. Read error or a header in the middle → **?IO**: bytes already stored stay, and $9D is already set.
   - EOF block → motor off and continue with the next statement. Trailing junk after the offset gives ?SN only **after** the load.
3. **Gapped file:**
   - Set the device to tape (the file state stays 0) and load the first data block.
   - The header must be type 2 **and** ASCII flag 0, else **?FM**. (This test happens after the first data block is read.)
   - Optional ",offset" as above. The statement must end now, else ?SN.
   - Then the data is a stream of records: 1 record-type byte, a 2-byte length, a 2-byte address (high byte first). EXEC address = address + offset.
     - Record type 0: the next "length" bytes are stored from that address, each read back. A mismatch → ?IO.
     - Any non-zero record type: close the file and finish. Its address + offset is the EXEC address; its length is ignored.
   - Running out of file mid-way → **?IO**.
4. CLOADM never runs the code. In a program, execution continues.

### 3.5 EXEC [address]

With an address: it's evaluated (negative or ≥ 65,536 → ?FC) and stored in $9D–$9E, then a jump there. Without an address: jump to the address in $9D–$9E. In this D64 source, $9D starts as the 64K-mode boot address. **The Dragon 32 power-on value is not in this source.**

### 3.6 CSAVE ["name"][,A]

- If the next character is "M" → CSAVEM.
- Read the filename. If the statement ends → **binary save**. Otherwise it needs a comma (else ?SN), then the letter A (else ?SN), then end of statement (else ?SN).
- **Binary:**
  - Write the header (type 0, ASCII 0, gap 0). Open state 0 → ?AO.
  - Then motor on, 0.5 s and leader.
  - Then the bytes from the start of the program up to (not including) end-of-program, in 255-byte blocks. This includes the two zero bytes that end the program.
  - Then the EOF block and motor off.
  - Variables aren't saved. The statement continues normally (a program carries on).
  - An empty program (start = end) gives header, leader and EOF block only.
- **ASCII (,A):**
  - Write the header (type 0, $FF, $FF) and mark the file open for output.
  - Set the device to tape and run the whole-program LIST. Each line goes out as LIST would print it. Because the tape has infinite width, **a CR comes before every line and after the last one**, so the file starts with a CR.
  - LIST then closes the file: last data block + EOF block, each with its own motor on, 0.5 s and leader.
  - It returns to the ready prompt: **CSAVE ,A ends a running program.**
  - There's no BREAK check while listing to tape.

### 3.7 SKIPF ["name"]

Read the filename; the statement must end (else ?SN). Search (3.2): ?AO if a file is open. Then skip the found file:
- **Gapped:** read block after block, each with its own motor cycle.
- **Continuous:** motor on and sync once, then read blocks.

A data block → keep going. The EOF block → done. A read error or a header block → **?IO**. The motor is off at the end.

### 3.8 MOTOR ON / MOTOR OFF

The next token must be OFF or ON, else **?SN**.
- **MOTOR ON:** relay on, then the 0.5 s wait (the statement takes ≈0.5 s). Interrupts aren't masked.
- **MOTOR OFF:** relay off and IRQ/FIRQ unmasked.

Note that **every BASIC error turns the motor off** (see 6). So `MOTOR ON` followed by any error leaves the motor off.

### 3.9 OPEN "I"|"O", #dev, ["name"]

1. Evaluate the mode string. It must be a string (else ?TM) and not empty (else ?FC). Only its **first character** counts.
2. Then a comma and the device number (4.1). Then a **mandatory comma** (else ?SN). Then an optional filename, and end of statement (else ?SN). So `OPEN "I",#-1,` with no name is legal and takes the first file.
3. The device number is cleared before going on.
4. The first character must be uppercase "I" or "O". Anything else → **?FM**, after everything else has been parsed.
5. **"I"** cases:
   - printer → ?FM;
   - screen/keyboard → nothing happens;
   - tape → ?AO if open; search; the file must have **both** the ASCII and gap flags non-zero, else **?FM**. (The file stays closed and the motor is off.) Then mark it open for input (state 1) and read the first data block into the buffer. If the file is empty, the buffer stays empty and EOF(-1) is true at once.
6. **"O"** cases:
   - screen or printer → nothing happens;
   - tape → ?AO if open; write the header (type 1, $FF, $FF; exec/load bytes stale). That means motor on, 0.5 s, leader, header block, motor off. Mark it open for output (state 2) with an empty buffer.

### 3.10 PRINT #-1 (and output to an open tape file)

- The tape must be open for output: closed → **?NO**; open for input → **?FM**.
- Characters go into the 255-byte buffer. When a character arrives and the buffer already holds 255, the buffer is first written as a type-1 block of 255 (motor on, 0.5 s, leader, block, motor off). So blocks are always exactly 255 until the last one.
- Because the tape has the "special I/O" flag:
  - **every printed item is followed by a CR** (a string, or a number in its usual format with its leading sign position);
  - **commas, TAB( ) and SPC( ) produce nothing** (but they're still parsed);
  - **numbers get no trailing space**;
  - a trailing ";" doesn't suppress the CR;
  - `PRINT #-1` with no list writes one CR.
- Examples:
  - `PRINT #-1,"A,B"` → bytes `41 2C 42 0D`.
  - `PRINT #-1,"A";CHR$(13);"B,C";CHR$(34);"D"` → `41 0D 0D 0D 42 2C 43 0D 22 0D 44 0D`.
- After the statement, the device number goes back to 0.

### 3.11 INPUT #-1 and LINE INPUT #-1

- Both give **?ID** in direct mode, even with #-1.
- The tape must be open for input: closed → **?NO**; open for output → **?FM**. Then a comma (else ?SN).
- A prompt string, the "?" and "??" prompts, and "?EXTRA IGNORED" all go to the tape device. **They're thrown away** because the file is open for input.
- A line is read as in CLOAD ASCII:
  - bit 7 stripped;
  - characters below $20 or above "z" dropped;
  - at most 249 kept;
  - CR ends the line.
- If the end of file is hit while reading a line → **?IE**, even if some characters were read.
- **INPUT** item rules with the tape flag set:
  - An **unquoted string ends only at the end of the line**: commas and colons belong to the string.
  - A quoted string ends at the closing quote.
  - A number must be followed by end of line, ":" or ",", else **?FD**. (?FD is used instead of "?REDO" for any non-keyboard device.)
  - When the line runs out and more variables remain, the next line is read.
  - So `INPUT #-1,A$,B$` on the file "A,B" gives A$ = "A,B", then **?IE** for B$.
- **LINE INPUT** takes the whole line (to CR) into the string variable. A non-string variable → ?TM.

### 3.12 EOF(dev)

The device is parsed like a device number (4.1), and the old device number is restored afterwards. Then:
- 0 (keyboard) → 0;
- the printer → **?FM**;
- the tape → must be open for input (closed → ?NO; open for output → ?FM). The result is **−1 if the buffer is empty, else 0**.

The buffer is refilled as soon as its last character is taken. So EOF(-1) turns −1 **right after the last character of the file has been read**, and also straight after OPEN for an empty file.

### 3.13 CLOSE [#dev[,#dev…]]

- With no argument: close the tape.
- With arguments: each is a device number (4.1). "#" is optional and they're separated by commas.
- Closing the screen or printer does nothing.
- Closing the tape:
  - if open for output: write any characters left in the buffer as a final data block (if there are any), then the EOF block (each with its own motor cycle and leader);
  - in every case set the state to 0.
- Closing an already-closed tape is **not** an error.
- The device number is cleared.

### 3.14 CSAVEM "name",start,end,exec

- Skip the "M" and read the filename. A name is needed in practice: a leading comma is evaluated as a string and gives ?SN.
- Then, each after a comma (else ?SN), three address expressions (negative or ≥ 65,536 → ?FC). The start goes straight into header bytes 13–14. **end < start → ?FC** (before exec is parsed). Exec goes into header bytes 11–12.
- The statement must end, else ?SN.
- Then: write the header (type 2, 0, 0; ?AO if a file is open). Then motor on, 0.5 s and leader. Then the bytes from start to end **inclusive**, in blocks of 255 (the last block is end − address + 1). Then the EOF block and motor off.
- Example: `CSAVEM "M",1536,1538,1537` → one data block of 3 bytes, and a header with exec $0601 and load $0600.

### 3.15 RUN "name"

There's **no load-and-run path** in this ROM. RUN closes files first. The string is then not a line number, so RUN looks for line 0: if there isn't one → **?UL**, and if there is, it runs from line 0. The only load paths are CLOAD, CLOADM and DLOAD/DLOADM. DLOAD uses the serial host; it closes the cassette properly first and shares the gapped CLOADM record reader.

---

## 4. Device numbers

### 4.1 Parsing a device number (OPEN, CLOSE, PRINT #, INPUT #, LINE INPUT #, EOF, POS)

- "#" is optional.
- The number is converted to a signed 16-bit integer: outside −32768…32767 → ?FC.
- It must then fit −128…127, else **?DN**.
- The value is stored in $6F *before* the next checks, but any error clears $6F again. 0 → OK; any positive → **?DN**; below −2 → **?DN**.
- So the only legal values are 0, −1 and −2.

### 4.2 Dispatch

| | 0 (screen/kbd) | −1 (tape) | −2 (printer) |
|---|---|---|---|
| Output allowed? | always | must be open for output (closed ?NO, input ?FM) | always |
| Input allowed? | always | must be open for input (closed ?NO, output ?FM) | **?FM** |
| OPEN "I" | no-op | search + open | ?FM |
| OPEN "O" | no-op | header + open | no-op |
| CLOSE | no-op | flush/close | no-op |
| EOF | 0 | buffer-empty test | ?FM |
| Character output | screen (switches the display to text mode) | buffer, or discarded if open for input | printer driver |
| Device parameters | width 32, field 16 | infinite width, special I/O | printer RAM values |

### 4.3 When $6F goes back to 0

$6F is set to 0 in all these places:
- at the end of PRINT, INPUT and LINE INPUT;
- in OPEN, before the mode check;
- by every CLOSE;
- by every error;
- by STOP, END and BREAK reaching the ready prompt;
- by warm restart.

It's therefore 0 at the start of every statement. LLIST sets it to −2. CSAVE ,A and ASCII CLOAD set it to −1 for their duration.

### 4.4 The "special I/O" flag

It's set whenever device parameters are fetched while the device is the tape. Its effects are those in 3.10 and 3.11.

---

## 5. BREAK during tape operations

- Inside every tape routine (search, sync, block read and write, leader, skip) **the keyboard isn't polled and interrupts are masked**. BREAK can't work. A blank or missing tape hangs the machine until reset.
- The "BREAK check" used by LIST is **skipped when the device is the tape**. So no BREAK during CSAVE ,A.
- During an ASCII CLOAD, lines come through the line-entry loop with the tape as input. The keyboard isn't read, so there's no BREAK.
- **Between statements** of a running program, the statement loop does unmask interrupts and polls for BREAK as usual. So BREAK works between `PRINT #-1` / `INPUT #-1` statements. It doesn't close the file and doesn't change the motor; the state stays 1 or 2.
- After a reset: the motor is off (PIA re-init) and the file state is **unchanged**.

---

## 6. State effects of other actions

| Action | Motor | File state ($78) | Interrupts | Other |
|---|---|---|---|---|
| Cold start | off | 0 | — | defaults per 0.3 |
| Warm restart (reset) | off | **unchanged** | enabled | device 0 |
| Any error (?xx) | **off** | **unchanged** (an open file stays open) | **enabled** | device 0; sound off |
| NEW | unchanged | **unchanged** | — | |
| CLEAR | unchanged | **unchanged** | — | |
| RUN (with or without line) | unchanged | **closed**; an output file is flushed + EOF written to tape | — | PLAY/DRAW defaults first |
| END | unchanged | **closed** (flushed as above) | — | |
| STOP / BREAK / running off the end | unchanged | **unchanged** | — | device 0 |
| CLOAD / CLOADM | off at end | **forced 0 without flushing** | enabled at end | |
| DLOAD | — | closed properly first | — | |
| Start of every statement | — | — | **IRQ/FIRQ unmasked** | |

---

## 7. Dragon 32 vs Dragon 64

- In this source, every cassette routine (low-level and BASIC-level) is **byte-for-byte the same logic** in the 32K-mode and 64K-mode builds. The 64K mode doesn't re-copy the default table.
- **Leader length ($90–$91):** this source sets **256** (it's the D64 32K-mode ROM). Ciaran Anscomb says the D32 default differs, and secondary maps give **128** for the D32. **I can't confirm the D32 value from this source; it stays open.** Everything else in the default table (thresholds $12/$0A/$12, motor delay $DA5C) is also from the D64 ROM. Whether the D32 differs there too is open.
- **Ciaran's other points:**
  - The leader count lives at $0090 — confirmed.
  - The reader waits as long as it takes for the sync byte — confirmed: no timeout anywhere.
  - About 813/435 cycles per bit — **confirmed exactly** by my cycle count of this code, for bits inside a byte. Byte-boundary bits are 26–46 cycles longer (1.3).
- The power-on EXEC address ($9D) in this source is a D64-only boot routine. The D32 value is open.
- The serial download (DLOAD/DLOADM) uses a 6551 that only the D64 has. On a D32, the gapped CLOADM path is the same code, but DLOAD hardware behaviour is out of scope.

---

## 8. Sizes in the original ROM (32K-mode build; for budgeting)

| Part | Bytes (approx.) |
|---|---|
| Low-level tape driver: poll, cycle/half timing, bit, byte, motor on/off, sync, byte output, **36-byte sine table**, leader writer | 241 |
| Tape entries in the default-value table ($90–$96) | 7 |
| Jump-table slots for 7 tape routines (3 each) | 21 |
| $A000 vector words for the 4 tape routines | 8 |
| Character input from the tape buffer + refill | ~46 |
| Character output to tape + buffer dump (in the shared output dispatcher) | ~40 |
| Tape device parameters | ~12 |
| Open-for-input/output checks | ~34 |
| CLOSE | ~54 |
| CSAVE (ASCII + binary + end-of-save) | 82 |
| CLOAD (ASCII, binary, continuous CLOADM) | 156 |
| EXEC | 11 |
| BREAK-check wrapper | 11 |
| Filename reading + 8-byte copy | 42 |
| Device-number parsing + end-of-statement check | 44 |
| EOF function | 30 |
| SKIPF | 10 |
| OPEN + error stubs + buffer refill + open-input/open-output helpers + header writer | 139 |
| Search + skip-file + screen blink/mark | 128 |
| Read-block wrapper + block reader | 78 |
| MOTOR statement | 16 |
| Write-block wrapper + block writer + leader/trailer byte | 65 |
| CSAVEM (+ address-stacking helper) | 86 |
| Gapped CLOADM record reader (shared with DLOADM) | ~102 |
| **Total cassette-related** | **≈ 1,460** |

Error texts (2 bytes each) are in the shared table.

---

## 9. Answers to the tape items in DRAGON-SPEC-INTERFACES.md

**Error codes** (offsets in the error table): FC 8, OM 12, ID 22, TM 24, FD 36, **AO 38, DN 40, IO 42, FM 44, NO 46, IE 48, DS 50**, NE 52 (DLOAD only). There's **no ?BM**: the "bad mode" error prints **?FM**.

**Contract conflicts:**
- $A004 (sync): per this source, **U and Y are kept**; A, B, X and CC change. Companion is right, Inside is wrong.
- $A00C (leader): A, X and CC change; **B and Y kept**.
- $A006: U and Y kept; A = result; X advances; masks stay set.
- $A008: no motor or leader; A = $55, B = 0, X = end of data, Y kept; masks stay set.

| Test | Answer from the source |
|---|---|
| C-01 | Confirmed path: binary CLOAD loads, relinks, prints "OK", doesn't run. |
| C-02 | ASCII CSAVE writes the LIST text, with a CR before every line and one at the end. CLOAD after PCLEAR 1 re-enters each line through normal line entry, so links and pointers are built fresh at the new start address. (A binary load also works at a new address: links are rebuilt after loading.) |
| C-03 | Data block length 3 = `11 22 33`. Header: type 2, flags 0/0, exec $0601, load $0600. |
| C-04 | Loads `11 22 33` at $0600–$0602; EXEC address = $0601. |
| C-05 | Loads at $0610–$0612; $9D–$9E = $0611. |
| C-06 | "ABCDEFGH" and "ABCDEFGHI" both save as name ABCDEFGH. The 9th character spills into the tape buffer and is overwritten by the header. Searching with either matches. An empty name saves 8 spaces; CLOAD "" or CLOAD takes the first file. CLOAD "        " (8 spaces) matches only a blank-named file. |
| C-07 | SKIPF "T" finds and skips T; then CLOAD "U" loads U. In direct mode the screen shows S/F + name for each. |
| C-08 | $78 = 2 while writing, 0 after CLOSE, 1 while reading; CLOSE with no number closes the tape. |
| C-09 | Path 1: `0`, then `A,B`, then `-1`. Path 2: A$ = "A,B", then **?IE ERROR IN 20**. |
| C-10 | Each `PRINT #-1,"X";` writes "X"+CR, so N items → 2N bytes. N=254 → blocks 255+253; N=255 → 255+255; N=256 → 255+255+2; N=510 → 4×255. An empty file (OPEN then CLOSE) → header + EOF block only. Every block is gapped (own leader and motor cycle). |
| C-11 | Bytes `41 0D 0D 0D 42 2C 43 0D 22 0D 44 0D`. Read back with LINE INPUT: "A", "", "", "B,C", the line `"`, "D". INPUT on the 5th line (a lone quote) gives an empty quoted string. I didn't trace that last case in full. |
| C-12 | Frame and checksum confirmed (2.1). |
| C-13 | T tokenized: name "T"+7 spaces, 00 00 00, exec/load stale. T ASCII: 00 FF FF, stale. M: 02 00 00 0601 0600. D: 01 FF FF, stale. "Stale" means zeros after power-on if the buffer was never used. |
| C-14 | Leader = $90–$91 count (D64 256; D32 open). The header gets one extra $55. Bit timing per 1.3. The silence after each motor-on is ≈0.50 s. |
| C-15 | Second OPEN → ?AO (nothing written). INPUT # on an output file → ?FM. PRINT # on an input file → ?FM. CLOSE when closed → no error. Reading past the end → ?IE. $78 doesn't change on any of these errors. |
| C-16 | A bad data-block checksum → ?IO. Bytes of that block and earlier ones are already in memory, and $9D is already header exec + offset. No EOF block → the loader keeps hunting for $3C. If a later file's header comes along → ?IO; if the tape is blank → it hangs (no BREAK). |
| C-17 | CLOAD "M" → ?FM, program kept. CLOADM "T" → ?FM, nothing loaded. A file with a **bad header** before T is silently skipped. A file with a good header but a **bad data block** before T → ?IO while skipping it. |
| C-18 | No BREAK is possible during search or load. After `CLEAR 200,8192`, a big load gives ?OM (motor off, program area left as described in 3.3). |
| M-08 | After sync + block read: $7C = type, $7D = length, $80 = computed sum, $81 = 0/1/2; interrupts are still masked and the motor is still on. |
| M-09 | After the leader, the block writer gives `55 3C 01 03 11 22 33 6A 55`. The checksum is $01 + $03 + $11 + $22 + $33 = $6A. X = buffer + 3; masks stay set; the motor stays on (the caller must turn it off). |
| S-12 | MOTOR ON = relay + 0.5 s wait; MOTOR OFF = relay off + unmask. Neither touches the sound path. |

---

## 10. Things I'm unsure of

1. **The Dragon 32's default table values**: the leader count (256 here; 128 is reported) and whether the thresholds and motor delay match. This source is the D64 ROM.
2. The D32 power-on value of the EXEC address ($9D–$9E).
3. The exact effective cycle-length boundary between a 0 and a 1 (≈600 cycles). The poll arithmetic is exact, but the uncounted overhead between bits varies a little by caller. A real machine or exact emulation of the code is the true reference.
4. What LIST shows after a ?OM part-way through a binary CLOAD.
5. PRINT #-1,USING: I didn't trace how PRINT USING interacts with the tape's special-I/O flag.
6. INPUT #-1 on a line that is a single quote character (C-11, 5th line): not traced in full.
7. That the DAC feeds the cassette output connector regardless of the sound-source select is hardware knowledge, not from this source.
8. Cycle extras at byte boundaries assume the original layout: the BASIC-level block writer calls the byte writer through the $8000 jump table, and the leader writer calls it directly. A different layout changes only those 26–46-cycle stretches.

---

## 11. Follow-up: line buffer and crunch (writer's question)

### 11.0 Memory layout from the tape buffer up to the line buffer

| Addr | Size | Use |
|---|---|---|
| $01D1 | 1 | filename length |
| $01D2–$01D9 | 8 | filename |
| $01DA–$02D8 | 255 | tape buffer (header / block data) |
| $02D9 | 1 | a byte that is always non-zero. Cold start sets it non-zero (the start-up code writes the RTS opcode value $39 there) and nothing else writes it. It works as a fake non-zero link byte (see 11.3). |
| $02DA–$02DB | 2 | line number of the line being entered (big-endian) |
| $02DC | 1 | one byte just before the line buffer. **Crunch output starts here.** INPUT also puts a comma or zero here as a terminator before the data. |
| $02DD–$03D8 | 252 | line buffer: 250 + 2 spare bytes for the trailing zero link |
| $03D9 | 1 | one byte below the number-to-text buffer, used as a string-build start |
| $03DA–$03E9 | 16 | number-to-text conversion buffer |

So the crunched line **never touches the tape buffer** ($01DA–$02D8). The tape buffer and the line buffer don't overlap.

### 11.1 Where crunch reads and writes

- **Input:** crunch reads from wherever the text pointer is. Typed lines are collected at $02DD onward (at most 249 characters), with a zero at the end.
  - Direct-mode line: the main loop points the text pointer one byte before the buffer ($02DC), then fetches one character. That skips leading spaces, so crunch starts at the first non-space character at or after $02DD.
  - Numbered line: the line-number digits are read first, so crunch starts right after them (spaces after the number are kept as text).
- **Output:** always starts at **$02DC**, one byte **before** the line buffer. So it's done in place in the same buffer, with the output running one byte behind where the input starts.
- **Why that's enough:** almost every change makes the text shorter or keeps it the same length:
  - a keyword becomes a 1-byte token (or 2 bytes for a function);
  - ELSE (4 characters) becomes colon + ELSE token (2 bytes);
  - "?" becomes a 1-byte PRINT token;
  - numbers, ":", ";", spaces, quoted strings, DATA text and REM text are copied byte for byte.

  The only change that adds a byte is the apostrophe (a remark): 1 character becomes colon + remark token (2 bytes). After it, the rest of the line is copied unchanged, so this happens at most once per line. The output therefore never gets ahead of the next unread input character. There's no other trick.
- **End of output:** after the line's zero, two more zeros are added. They look like a zero link, so a direct line acts as the end of the program.

### 11.2 Where a direct line starts running

After crunching, the text pointer is set to **$02DB**. The first character fetch moves it to $02DC, the first crunched byte, and the statement runs from there. Crunch also hands back a length in B (11.3). The direct-mode path doesn't use it.

### 11.3 Storing a numbered line

- The line number goes into $02DA–$02DB before crunching.
- Crunch returns a length = (address after the two extra zeros) − $02DA. That equals 4 + the crunched text including its end zero, i.e. 2 link bytes + 2 line-number bytes + text. This fits in one byte; the maximum is 255 (11.5). The length is kept in a one-byte counter.
- If the line already exists, it's deleted first.
- If the first crunched byte ($02DC) is zero (just a number), nothing is inserted: typing only a line number deletes that line.
- Otherwise room is made at the insert point by moving the rest of the program up by that length (with the usual out-of-memory check). Then the bytes are copied **starting at $02D8**, until the insert point plus that length is reached:
  - first $02D8 and $02D9, as a dummy link (its high byte is the last tape-buffer byte, its low byte the always-non-zero byte);
  - then the line number at $02DA–$02DB;
  - then the crunched text from $02DC, up to and including its end zero.
- After the copy: end-of-program is updated, variables are cleared (as RUN would), and **all links are rebuilt** by scanning for each line's end zero. So the dummy link is overwritten. Its only job is to be non-zero during the rebuild.

So $02D8 (the tape buffer's last byte) is **read** during line storage, but its value doesn't matter. Nothing is written there.

### 11.4 Other users of the tape buffer $01DA–$02D8

Searching the whole source, the only users are:
- cassette I/O: header build/read, block data, the character buffer for open files;
- the filename reader: a name longer than 8 characters spills into $01DA onward, at most up to $02D0;
- DLOAD/DLOADM: host blocks of 128 bytes are read into $01DA–$0259;
- (D64 only) the 64K-mode boot routine copies a small loader into $01DA and runs it there.

INPUT, LINE INPUT, EDIT, PRINT USING and the string functions do **not** use it:
- INPUT and LINE INPUT use the line buffer at $02DD (hence "illegal direct" for INPUT and LINE INPUT);
- EDIT decrunches into the line buffer and re-enters through crunch with the text pointer at $02DD;
- number output and HEX$ use $03D9–$03E9;
- strings use string space. A string whose text lies below $03D9 (e.g. a literal in the line buffer) is copied into string space when it becomes a value.

The temporary stack used while the machine resets starts at $03D7, inside the line buffer, not the tape buffer.

Consequence for CSAVE/CLOAD typed in direct mode:
- The statement text is at $02DC onward, and the tape code uses only $01D1–$02D8, so they never clash.
- The filename string is evaluated (and copied to string space) before the header is built or read.

### 11.5 Maximum lengths

- Typed or read lines are capped at **249 characters** (extra characters are ignored), plus the end zero.
- Crunched text is at most 249 + 1 (one apostrophe) = **250 bytes + end zero + 2 zeros**. That's 253 bytes from $02DC to $03D8 — exactly the end of the line buffer (250 + 2 spare). The returned length is then at most 255.
- So the original **can't overflow**. There's no "too long after crunch" error and no truncation after crunch; the 249-character input cap is the only limit.
- A program line can't hold more than that. (The decruncher used by LIST/EDIT has its own buffer-full stop.)
