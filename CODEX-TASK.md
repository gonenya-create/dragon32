# Task for Codex: numeric functions and sound for our own Dragon 32 BASIC ROM

Read first: rom/README.md, rom/GFX-NOTES.md, rom/src/boot.s, rom/src/fp.s (the FAC/ARG floating point package and its conventions), rom/src/basic.s (factor → fn_dispatch, getint/getbyte/expect/skipsp, pushfac/poparg), rom/src/interp.s (st_let → snd_dispatch), rom/src/funcs.s, rom/src/sound.s, rom/tools/xr.mjs and rom/tools/test.mjs.

## Rules
Same as before:
- Write everything yourself. Never use or look up the original Dragon/CoCo/Microsoft ROM code or disassemblies.
- You MAY read Microsoft's MIT-licensed BASIC-M6502 source (github.com/microsoft/BASIC-M6502, m6502.asm) for algorithms and polynomial constants. If you use its constants, note that in a comment; the licence file is rom/LICENSE-MSBASIC.
- Edit only rom/src/funcs.s, rom/src/sound.s, rom/tools/* and docs under rom/. If you need a change elsewhere in rom/src, describe it in your final message instead.
- Use direct-page $70-$7F and RAM $0380-$03FF only, and document what you use.
- Code comments in Hebrew, short, like the existing files.
- Work in this folder (worktree, branch basic-fn). Commit if git allows; don't push.

## 1. funcs.s: fn_dispatch
Contract: X points at a name in an expression. If it is a function, evaluate it, leave the result in FAC, return Z=1 with X after it. Otherwise return Z=0 with X unchanged. It runs BEFORE variable lookup: make sure a variable like IN or SQ still works when no function name matches, and match whole function names.
Functions, behaving as in Dragon BASIC:
- INT(x): floor, so INT(-2.5) = -3.
- FIX(x): truncate.
- ABS, SGN.
- SQR (?FC ERROR for negative).
- SIN, COS, TAN, ATN (radians).
- LOG (?FC for ≤0), EXP.
- RND(n):
  - n>1: an integer 1..n.
  - RND(1): a value 0<x<1 (but see the note in the next item).
  - RND(0): a value 0..1.
  - Follow the Dragon manual: RND(0) gives a number between 0 and 1, RND(N) an integer from 1 to N, and RND(-N) reseeds.
  - Use a decent generator, documented.
- TIMER is a pseudo-variable (no brackets). Our ROM has no interrupts yet, so return a counter you increment inside your own routines, or 0, and document the limitation.
Accuracy target: about 8-9 significant digits for the transcendental functions.

## 2. sound.s: snd_dispatch
- `SOUND tone,duration`: tone 1-255, duration 1-255 in units of about 1/20 s (check the Dragon manual's convention and document it).
- `PLAY "string"`: notes A-G with # + -, O octave, L length, T tempo, V volume, P pause, and digits for note numbers 1-12. Implement a sensible subset and list it.
- Hardware, from public docs:
  - The Dragon's 6-bit DAC is PIA1 port A bits 2-7 ($FF20).
  - The sound source is selected by PIA0 CA2/CB2 (CRA bit 3, CRB bit 3).
  - Sound is enabled via PIA1 CB2 ($FF23 bit 3).
  - Generate square waves by timed loops (no interrupts yet).
- Tests: you can't hear in tests. Verify the DAC writes and the timing logic, e.g. count writes via a RAM counter, or check the PIA state in the snapshot (xr.mjs exposes pia1b; extend it to expose what you need). The ROM must return to OK afterwards.

## Tests
Add cases to rom/tools/test.mjs:
- Functions: exact values where meaningful (INT, FIX, ABS, SGN, SQR(16)=4, SQR(2), SIN(0), COS(0)=1, ATN(1)*4 ≈ 3.14159265, LOG(EXP(1))=1, EXP(0)=1), error cases, and RND ranges (e.g. a FOR loop checking 1≤RND(6)≤6 many times).
- Variables named like function prefixes still work.
- SOUND/PLAY return to OK and don't crash.
Run the full suite 2 times in a row with 0 failures. Finish with a short summary: what works, limits, files changed.
