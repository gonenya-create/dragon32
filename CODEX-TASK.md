# Task for Codex: graphics for our own Dragon 32 BASIC ROM

Read first: rom/README.md, rom/src/boot.s, rom/src/basic.s (the end: getint/getbyte/expect), rom/src/gfx.s, rom/tools/screen.mjs, rom/tools/test.mjs.

## Context
We are writing our own BASIC ROM for the Dragon 32 (6809), from scratch, loaded by the XRoar emulator in place of the original ROM.
RULE: never copy or look up code/data from the original Dragon/CoCo ROMs (Microsoft/Dragon Data/Tandy copyrighted) or any disassembly of them.
Use only public hardware documentation (MC6847 VDG, MC6883 SAM, PIA behaviour, Dragon memory map) and the documented BASIC behaviour (manuals).
Write everything yourself.

## Your job: rom/src/gfx.s
Implement `gfx_dispatch` (the contract is in gfx.s) with these statements:
- `PMODE m[,p]`: graphics mode 0-4 and start page 1-4. Pages are 1536 bytes each, starting at $0600 (page 1).
- `PCLS [c]`: clear the current PMODE screen to colour c (default: the background).
- `SCREEN s,c`: s=0 text, s=1 graphics. c=0/1 is the colour set (CSS).
- `COLOR f[,b]`: foreground and background colour.
- `PSET(x,y[,c])` and `PRESET(x,y)`.
- `LINE(x1,y1)-(x2,y2),PSET|PRESET[,B|,BF]`, and also the form `LINE -(x2,y2),...` from the last point.
- `CIRCLE(x,y),r[,c]`.
Coordinates are always 0-255 by 0-191, as in Dragon BASIC; scale them for lower-resolution modes.
Colours follow the Dragon: in 4-colour modes c=1..4 (0..3 internally); in 2-colour modes 0/1.
The VDG mode bits go in PIA1 B ($FF22: bit 7 A/G, bits 6-4 GM2-GM0, bit 3 CSS). The SAM V0-V2 bits are at $FFC0-$FFC5, and the display offset F0-F6 is at $FFC6-$FFD3.

Keep the text screen working:
- `SCREEN 0,0` returns to text.
- When the "OK" prompt is printed, go back to the text screen. You may add one call in boot.s's main_ok to a routine `gfx_text`; that is the only line you may change outside gfx.s.

Use direct-page variables $70-$7F only, plus RAM you document, and no other DP addresses. Use the existing getint/getbyte/expect/skipsp/err_fc/err_sn helpers. Preserve the contract of gfx_dispatch.

## Tests
- Add cases to rom/tools/test.mjs, or add a tool rom/tools/gfxshot.mjs that reads graphics memory over GDB, like screen.mjs reads $0400.
- Check pixels: PSET sets the right bits, LINE endpoints, PCLS fills, CIRCLE points, mode/page addressing.
- The register state ($FF22 and SAM) is checkable over GDB too: SAM state isn't readable, so check that $FF22 and the memory are right.
- Build with rom/build.sh, then run `node rom/tools/test.mjs`. All old cases must still pass.

## Working rules
- Work only in this folder (a separate git worktree on branch basic-gfx).
- You may commit to branch basic-gfx with clear messages. Do NOT push and do not touch other branches.
- Do not edit boot.s, fp.s or basic.s, except the single main_ok line allowed above.
- Comments: write code comments in Hebrew, like the existing files, short.
- At the end, write rom/GFX-NOTES.md: what works, what doesn't, the RAM/DP used, and how it was tested.
