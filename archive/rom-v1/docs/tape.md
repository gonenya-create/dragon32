# Cassette support

## Commands

- `CSAVE "NAME"` or `CSAVE "NAME",A`: save the program as ASCII BASIC.
- `CLOAD` or `CLOAD "NAME"`: replace the program with the first matching ASCII
  BASIC file. An empty name matches any filename. The screen prints `S` while
  searching and `F NAME` for each filename block encountered.
- `MOTOR ON` / `MOTOR OFF`: set the cassette relay.
- `AUDIO ON` / `AUDIO OFF`: select cassette audio in the sound multiplexer and
  enable/disable the sound path.

Names are literal, case-sensitive strings of zero to eight characters, padded
with spaces on tape. Closing quotes are required. `CSAVE` can be followed by
another statement with `:`. `CLOAD` performs NEW before searching and ends the
current command line, as replacing the program also invalidates the current
execution position and LINBUF. Variables are cleared. A failed or interrupted
load leaves the successfully received lines; it does not restore the old program.
`SKIPF` is not implemented (it was optional).

BREAK stops a transfer or a search and switches the motor off. Bad block
checksums, malformed block lengths/types, non-printable ASCII, overlong lines,
invalid line numbers, or an incomplete final line produce `?IO ERROR`. A matching
machine-code file, tokenised BASIC file, or ASCII data file produces `?FM ERROR`.
Program/buffer exhaustion produces `?OM ERROR`. Searching past the end of a tape,
or encountering missing signal in a truncated recording, waits for signal or
BREAK; cassette hardware has no end-of-tape sensor.

## On-tape format

Each block contains `55 3C type length payload checksum 55`. The checksum is the
low eight bits of `type + length + sum(payload)`. Types are `00` (filename), `01`
(data) and `FF` (EOF). Payloads contain at most 255 bytes. EOF has length zero.
The receiver searches for sync at bit granularity and verifies the checksum
before consuming any payload. The trailing `55` is skipped during the next
sync search, rather than requiring a subsequent signal edge after EOF.

The **15-byte filename payload** is exactly:

| Offset | Bytes | Value |
| --- | --- | --- |
| 0 | 8 | Name, ASCII, right-padded with spaces |
| 8 | 1 | `00`: BASIC program |
| 9 | 1 | `FF`: ASCII |
| 10 | 1 | `FF`: gapped recording |
| 11 | 2 | `0000`: unused execution address |
| 13 | 2 | `0000`: unused load address |

For example, `TEST` produces
`54 45 53 54 20 20 20 20 00 FF FF 00 00 00 00`.
This is an ASCII BASIC program, not a tokenised program or an ASCII data file.
A data payload is a stream such as `10 PRINT "HELLO"` followed by byte `0D`.
Lines may cross block boundaries. The loader accepts 249 characters, or 250 when
a separator after the number accounts for the extra character. This lets a
maximum-length typed line without a separator survive canonical saving. LINBUF
holds the extra separator and NUL below address `0300`. Every saved line has a decimal line number, a space,
the stored text and a CR. The last line also has a CR. Empty programs have no data
blocks. No memory links, binary line numbers or zero terminators are saved.

The motor starts with about half a second of settling time and 128 leader bytes
of `55`. The filename block is followed by a half-second gap and another 128-byte
leader. Data blocks are also followed by a gap and leader, allowing a gapped
ASCII reader to stop between blocks. EOF ends the file; an extra `55` is emitted
before stopping the motor to complete the final waveform cycle.

Bits go least significant first, without start/stop bits. A zero is one cycle at
about 1200 Hz; a one is one cycle at about 2400 Hz. The 6809 generates a square
wave through DAC bits 2–7 of PIA1 A (`FF20`). The receiver measures successive
rising edges of the comparator on bit 0. At the standard Dragon CPU clock,
the output periods are approximately 747/376 cycles (zero/one), including the
loop overhead; byte boundaries add a little overhead. The input threshold is
36 polling iterations, between the observed short and long periods.
The motor is PIA1 CA2; cassette audio is selected with PIA0 CA2 high and CB2 low,
and enabled using PIA1 CB2. Display bits in PIA1 B are untouched.

## Memory and integration

Only `E0–EF` is used for persistent tape scratch: buffer pointer (2), saved stack
frame pointer (2), checksum, block length, block type, name length, and name (8).
The 256-byte block buffer is chosen at `STRFREE - 256`, checked against `ARYEND`.
It is temporary workspace, not a permanent extension of either heap; no routine
that allocates strings or arrays is called while a transfer uses it. Loading
calls NEW first, placing the buffer at `7D00`. Before storeline, the loader checks
both the interpreter's existing `7B00` program limit and the buffer boundary.
`storeline` resets the variable/string heaps after each line; the buffer remains
at its checked address. No RAM in the graphics area, including `0700–07FF`, is
used. Hardware save state and the command continuation are on the CPU stack.

IRQ/FIRQ are masked during transfers to keep signal timing stable. Consequently
TIMER/TICKS pauses during cassette I/O. PIA data direction, DAC output and sound
control state are restored on success, errors and BREAK, and the motor ends off.
The receiver stops the motor after a checked block while the CPU processes its
payload, then resumes for the next block. Loading calls the existing `storeline`
with each complete numbered line in LINBUF, preserving normal insertion,
replacement and relinking behavior. No changes elsewhere in the ROM are needed.

## Validation

Run `node rom/tools/tape-test.mjs` for cassette tests, or
`node rom/tools/test.mjs` for the complete suite including cassette tests.
The helper accepts `tapeLoad` and `tapeWrite` paths, emulated-second `timeout`
and millisecond `wallTimeout`. It always passes `-no-tape-fast` and
`-no-tape-pad-auto`; neither original-ROM interception nor automatic leader repair
is involved. CAS and WAV round trips use separate XRoar processes. Independent
CAS fixtures test loading without depending on our encoder. The BREAK test
fixture pulls keyboard row 6 low through the PIA only after tape I/O starts;
this instrumentation is confined to the temporary source copy.

Tests cover multiple blocks and split lines, name skipping, corruption, empty
programs, unsupported formats, syntax, line numbers 0/63999, memory exhaustion,
BREAK, MOTOR/AUDIO, and preservation of graphics pages. The 20-line timing case
contains 602 ASCII bytes; measured save time is **9.45 emulated seconds** and load
time is **14.06 emulated seconds**, within approximately 0.02 seconds. Measurement
bisects XRoar's emulated timeout at entry and completion traps, rather than using
TICKS (which pauses) or host elapsed time. The load measurement uses our saved
CAS including its timing/gap metadata; shorter synthetic CAS files load faster.
The final full suite passed twice with zero failures: 96 interpreter cases,
65 graphics cases, 83 numeric checks, 21 sound cases, 6 runner cases and 31
cassette cases per run (302 checks total). The ROM builds and `git diff --check`
also passes. Real Dragon hardware and tapes written by an original ROM have
not been tested.

On this Mac, the default `node` executable currently references a missing
`libsimdutf.36.dylib`. Validation uses the already installed
`/opt/homebrew/Cellar/node/26.12.0/bin/node`. The full suite launches subprocesses
with `process.execPath`, so this choice also applies to child tests.

## Sources and clean-room boundary

Only format/hardware documentation and XRoar infrastructure were consulted.
No original Dragon/CoCo/Microsoft ROM code or disassembly was used.

- [Dragon Archive: cassette block format](https://archive.worldofdragon.org/index.php?title=Tape%5CDisk_Preservation)
- [Dragon hardware memory map: PIA pins](https://dragon32.info/info/memmap.html)
- [Inside the Dragon: cassette signal and hardware description](https://www.dragondata.co.uk/Publications/InsideTheDragon.pdf)
- [XRoar manual: cassette formats and options](https://www.6809.org.uk/xroar/doc/xroar.shtml)
