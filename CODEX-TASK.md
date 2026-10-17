# Task for Codex: graphics round 2 (your own gfx.s)

Read first: rom/README.md, rom/GFX-NOTES.md, rom/src/gfx.s (your module), rom/src/basic.s, rom/src/interp.s, rom/src/strings.s (VALTYP/SLEN/SPTR string values, strexpr/needstr), rom/src/fp.s, rom/tools/xr.mjs, rom/tools/gfx-test.mjs.

## Rules
Same as before:
- Write everything yourself. Never use the original ROM code or disassemblies; public hardware docs and the documented BASIC behaviour only.
- Edit ONLY rom/src/gfx.s, rom/tools/* and docs under rom/. If you need changes elsewhere, describe them precisely in your final message. Claude is editing interp.s, basic.s and strings.s right now.
- Keep using gfx's RAM area. If you need more, use $0374-$037F and document it.
- Code comments in Hebrew, short. Work in this folder (worktree, branch basic-gfx2). Commit if git allows; don't push.

## Implement (Dragon BASIC behaviour)
1. `PAINT(x,y)[,c[,b]]`: flood fill with colour c, up to border colour b. Defaults as in Dragon BASIC.
   - Must not overflow the CPU stack: the stack is only about 256 bytes ($7E00-$7F00). Use a scanline algorithm with a bounded explicit queue in RAM, or a stack in a RAM area you document. The program can be large, so if you need a big buffer, compute free memory between ARYEND and STRFREE (strings.s), and fall back gracefully with ?OM ERROR.
2. `DRAW "string"`:
   - Commands U D L R E F G H with lengths.
   - M x,y absolute, and M+x,-y relative.
   - B (move without drawing), N (return after drawing), C colour, S scale (S4 = 1:1), A angle (0-3).
   - Lengths may be omitted (default 1).
   - You may skip the substring-variable syntax (X and =var;), but document that.
3. `PPOINT(x,y)`: a numeric function returning the pixel colour.
   - It is a FUNCTION, so it needs to be reachable from expressions. funcs.s owns fn_dispatch, and you may NOT edit funcs.s.
   - Export a routine `gfx_fn` (contract like fn_dispatch: Z=1 if handled, result in FAC) and say in your final message where Claude should call it.
4. `GET(x1,y1)-(x2,y2),A` and `PUT(x1,y1)-(x2,y2),A[,PSET|PRESET|AND|OR|NOT]`:
   - They store and restore a rectangle of pixels in a numeric array A, which must be DIMmed large enough.
   - Use arr_ref/getvar to find the array: the array data region holds 5-byte elements, and you may store raw bytes there.
   - ?FC ERROR if the array is too small.
5. `PCOPY a TO b`: copy graphics page a to page b.
6. Text-mode semigraphics:
   - `SET(x,y,c)` with x 0-63, y 0-31, c 0-8, and `RESET(x,y)` draw on the TEXT screen ($0400) using semigraphics-4 characters (bit 7 set, colour in bits 4-6, quadrant bits 0-3).
   - `POINT(x,y)` is a function (through gfx_fn): 0 if off, the colour if on, -1 if the cell holds a text character.
7. `SCREEN 1,c` in a running program keeps graphics visible while the program runs; the OK prompt returns to text, as now. Check that this works: a program that draws and then loops `GOTO` shows the picture (check pia1b in a trap at a known address, as your existing tests do).

## Tests
Add tests in gfx-test.mjs for each feature, with pixel-level checks:
- PAINT fills a circle and a box and stops at the border.
- DRAW moves and draws.
- GET/PUT round trip.
- PCOPY.
- SET/RESET/POINT.
Run the full suite twice with 0 failures. Finish with a short summary, including the exact place to call gfx_fn.
