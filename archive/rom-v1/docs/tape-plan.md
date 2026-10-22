# Cassette implementation plan

The task brief is the design: original 6809 code, PIA cassette signalling,
ASCII BASIC name/data/EOF blocks, and real XRoar tape tests. No original ROM
source or disassembly is used. Work stays on basic-tape in the supplied folder.

- [x] Add failing end-to-end tests and tape input/output options to xr.mjs.
- [x] Implement MOTOR/AUDIO and strict command parsing in tape.s.
- [x] Implement cycle-timed 1200/2400 Hz output and buffered ASCII saving.
- [x] Implement comparator pulse input, sync search, checksums, name selection,
      and numbered-line loading through storeline.
- [x] Verify CAS and WAV, corruption, unsupported formats, BREAK, memory limits,
      empty programs, and 20-line timing.
- [x] Run the entire existing suite plus tape tests twice and document results.
- [x] Commit allowed files if repository permissions permit; never push.

The 256-byte buffer is allocated below STRFREE, above ARYEND. Only E0–EF
are used as persistent tape scratch. Hardware control state and the command
continuation live on the CPU stack. The transfer disables interrupts for timing
and restores hardware and CC on success, errors and BREAK. The checked buffer address remains valid across storeline, whose clrvars resets
STRFREE.
EOF ends loading only at an ASCII line boundary. Malformed records report IO;
non-ASCII BASIC headers report FM. Optional SKIPF is omitted unless useful.

Completed verification: both final full-suite runs exited 0, with 302 checks and
zero failures per run. ROM build and whitespace checks passed. The commit was
attempted, but Git could not create the worktree index.lock in the parent
repository (Operation not permitted). All work remains in the working tree;
nothing was pushed.
