# Task for Codex: reliable ROM tests (replace GDB with XRoar snapshots)

## Why
rom/tools/screen.mjs and rom/tools/gfxshot.mjs talk to XRoar's GDB stub, and that is flaky. XRoar 1.12.1 sometimes never answers `?` or a Ctrl-C halt; it fails in roughly 20-50% of runs, also with a plain Python client.
The ROM now supports a reliable alternative:
- rom/src/testq.s holds a table `testq: [length][characters...]`.
- At power-on boot.s copies it into the keyboard queue KEYQ ($0100), as if those keys were typed. Lines are separated by CR (13).
- When the queue is empty, getkey reaches the label `gk_scan`, the real keyboard scan, and waits there.

## Do
1. Write rom/tools/xr.mjs, a module exporting `async function runRom(lines, opts)`. It should:
   - Copy rom/src to a temp dir and write a testq.s with the lines (each + CR) as fcb data. The total must stay ≤ 255 bytes; throw a clear error if longer.
   - Assemble with asm6809, as rom/build.sh does, into a temp ROM plus a .sym file.
   - Run `xroar -ui null -ao null -machine dragon32 -extbas <rom> -no-ratelimit -trap pc=<gk_scan address> -trap-snap <file.sna> -trap-timeout 0 -timeout <N>`. The trap fires the first time the ROM waits for a key after all input is consumed.
   - Option `opts.trapSym` traps at another symbol instead (e.g. main_ok, for graphics state before the return to text). Option `opts.range` picks which hit (XRoar `-trap-range M`).
   - Parse the snapshot (.sna). The RAM chunk follows the bytes "RAM\x02\x03ram". Inside it the 32K RAM data is introduced by a size marker; in a sample it was `00 01 c0 80 00` at offset 0xC8, with data starting right after `c0 80 00`.
   - Also extract the PIA1 port B output ($FF22), which the graphics tests need. Inspect the snapshot chunk layout to find it, document what you found, and use the MC6821 chunk for PIA1.
   - Return `{ ram: Buffer(32768), screen: string (16 rows decoded like screen.mjs), pia1b }`. If no snapshot was written (e.g. an endless program), reject with a clear message.
   - Clean up temp files.
2. Rewrite rom/tools/test.mjs and rom/tools/gfx-test.mjs to use runRom. Keep every existing case and its expectations. screen.mjs and gfxshot.mjs can become thin CLIs over runRom, or be removed; update rom/README.md and rom/GFX-NOTES.md accordingly.
3. Prove reliability: run the whole suite 3 times in a row with 0 failures, and say how long one run takes.

## Rules
- Work only in this folder (git worktree, branch basic-tests). You may edit rom/tools/*, rom/README.md and rom/GFX-NOTES.md.
- Do NOT edit rom/src/*. If something in the ROM blocks you, describe it in your final message instead.
- Do not commit if git refuses (sandbox); just leave the files and list them. Do not push.
- Code comments in Hebrew, short, like the existing files.
- Never use original Dragon/Microsoft ROM images or code.
