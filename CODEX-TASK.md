# Task for Codex: cassette tape (CSAVE / CLOAD) for our own Dragon 32 BASIC ROM

Read first:
- rom/README.md and rom/src/boot.s: hardware init, the 50 Hz IRQ that drives TICKS, getline, BREAK.
- rom/src/interp.s: program storage, PROGST/PROGEND, relink, newprog/clrvars, findline, errors. Note that the program is stored as plain text lines: [link 2][line number 2][text][0].
- rom/src/strings.s (str_lit etc.), rom/src/tape.s (your file and its hook), rom/src/sound.s (DAC/PIA use for sound, so you don't fight it), rom/tools/xr.mjs, rom/tools/test.mjs.

## Rules
Same as before:
- Write everything yourself. NEVER use or look up the original Dragon/CoCo/Microsoft ROM code or disassemblies.
- You MAY use public documentation of the Dragon cassette FORMAT (block types, leader, sync byte, checksum, filename block, bit timing) and of the hardware (PIA lines for motor, DAC output, cassette input comparator).
- Edit ONLY rom/src/tape.s, rom/tools/* and docs under rom/. Describe any change needed elsewhere in your final message.
- RAM: $0700-$07FF is NOT free (graphics pages start at $0600). Use the direct page $E0-$EF, plus a 256-byte block buffer you allocate between ARYEND and STRFREE at run time (check it fits, otherwise ?OM). Or ask for a fixed area in your final message.
- Code comments in Hebrew, short. Work in this folder (worktree, branch basic-tape). Commit if git allows; don't push.

## Goal
Tapes that XRoar can write and read with its real tape emulation (not ROM-call interception, which only works with the original ROM). Use the documented Dragon cassette signal and block format, so XRoar's .cas/.wav handling works.
Our programs are stored as text, so save them as an ASCII BASIC file: the format the original uses for `CSAVE "NAME",A`, with the file type and ASCII flag set accordingly. That keeps our tapes loadable by a real Dragon in principle. Document exactly what the filename block contains.

Statements, through tape_dispatch:
1. `CSAVE "NAME"`:
   - Motor on, a leader, a filename block, data blocks of up to 255 bytes holding the program as ASCII lines "10 PRINT ..." separated by CR, an EOF block, motor off.
   - NAME has up to 8 characters.
   - Also accept `,A`, which means the same thing here.
2. `CLOAD ["NAME"]`:
   - Motor on. Search, and while searching show "S" then "F NAME" on the text screen, like the original.
   - Skip files with other names. Read the data blocks, check checksums (?IO ERROR on a bad checksum), and rebuild the program:
     - Do NEW first.
     - Parse each received line like a typed numbered line. storeline in interp.s does that from LINBUF, so you can copy each line into LINBUF and call storeline.
   - BREAK aborts.
   - Loading a binary (machine-code) file, or a tokenised BASIC file from an original tape: give ?FM ERROR, and document it.
3. `MOTOR ON|OFF` and `AUDIO ON|OFF`, for completeness.
4. `SKIPF ["NAME"]`, optional.

## Tests
- In rom/tools/tape-test.mjs, using xr.mjs: run a ROM that types a program and `CSAVE "TEST"` with `xroar -tape-write out.cas`, then a second run with `-load-tape out.cas` that types `CLOAD "TEST"` and `LIST`, and compare.
- Also test a wrong name being skipped, a corrupted byte giving ?IO, and an empty program.
- You will probably need to extend xr.mjs with tape options and enough emulated time. Tape is slow: the timeouts must allow real-time loading.
- Report how long save/load of a 20-line program takes in emulated seconds.
- Run the full suite twice with 0 failures. Finish with a short summary.
