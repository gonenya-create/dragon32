# Task for Codex: GOSUB/RETURN, ON, DATA/READ/RESTORE, DIM and numeric arrays

Read first: rom/README.md, rom/src/boot.s, rom/src/basic.s, rom/src/interp.s (the whole interpreter: run_stmts, JUMPED, goline/findline, FOR stack layout FORBASE/FORSP/FORLEN, getvar/findvar, VARTOP/ARYEND, stfac/ldfac, errors), rom/src/stmt2.s (your file and its contract), rom/tools/test.mjs and rom/tools/xr.mjs.

## Rules
Same as before:
- Write everything yourself. Never use the original Dragon/CoCo/Microsoft ROM code or disassemblies.
- Edit ONLY rom/src/stmt2.s, rom/tools/* and docs under rom/. If you need a change elsewhere in rom/src, describe it precisely in your final message and do NOT make it. Claude is editing basic.s and interp.s at the same time (strings).
- RAM you may use: $03E0-$03FF and direct page $C0-$CF. Document it.
- Code comments in Hebrew, short. Work in this folder (worktree, branch basic-stmt2). Commit if git allows; don't push.

## Implement in stmt2.s
st2_dispatch (contract in the file) handles these statements:
1. `GOSUB n` and `RETURN`.
   - GOSUB pushes a frame on the FOR stack (FORSP/FORBASE, FORLEN-byte records). Name 0000 marks a GOSUB frame; FOR names are never 0.
   - The frame stores the CURLN and X to continue from.
   - Then it jumps like goline: set JUMPED, so the interpreter starts a statement at the new X.
   - RETURN discards FOR records above the nearest GOSUB frame and continues after the GOSUB, at the end of the GOSUB statement, so that ":" or end of line is processed normally. Do not set JUMPED there.
   - ?RG ERROR if there is no frame. ?OM ERROR on overflow.
   - It works in programs and in direct mode (CURLN=0), like the rest.
2. `ON expr GOTO a,b,c` and `ON expr GOSUB a,b,c`. Out of range (0 or > count) continues with the next statement. Negative or >255 gives ?FC.
3. `DATA` (skipped when executed), `READ var[,var...]` and `RESTORE [n]`.
   - READ walks the program text for DATA items.
   - Items are numbers now; strings come later. Claude will add string variables, so keep a clear spot where a string item would be read; a quoted item may simply be skipped or raise ?TM for now.
   - ?OD ERROR when out of data.
   - The program is stored as plain text, not tokens: find DATA by matching the word at statement starts. Beware of "DATA" inside string literals.
4. `DIM name(n[,m])[,name2(...)]` and array access through `arr_ref` (the contract is in the file; getvar calls it when a name is followed by "("):
   - Numeric arrays with 1 or 2 dimensions, indices 0..n.
   - Undeclared use auto-dimensions to 10, as in the original.
   - ?BS ERROR for an index out of range; ?DD ERROR for re-DIM.
   - Storage goes between VARTOP and ARYEND: [name 2][total length 2][dims 1][size of each dim 2 each][elements 5 bytes each, zero].
   - Expanding ARYEND must stay below STRLOW, otherwise ?OM ERROR.
   - Note: findvar shifts the arrays up 7 bytes when a new scalar is created, so never cache array addresses across statements.
   - Arrays must work as LET targets (A(3)=5), in expressions (PRINT A(3)*2), in FOR loops (FOR I=1 TO 10:A(I)=I*I:NEXT) and with READ.
   - Index expressions may themselves contain arrays.
   - VNAME is a global scratch value: save it before evaluating index expressions.
5. Add error messages ?RG ?OD ?BS ?DD as needed, using the existing error routine; see how err_ul is done in interp.s.

## Tests
Add cases to rom/tools/test.mjs, including:
- Nested GOSUB.
- RETURN without GOSUB.
- GOSUB inside a FOR loop.
- ON with out-of-range values.
- READ across several DATA lines, RESTORE, and ?OD.
- DIM 1D and 2D, auto-DIM, ?BS, ?DD, and arrays mixed with new scalar variables created after the array (the shift).
Run the full suite twice in a row with 0 failures. Finish with a short summary.
