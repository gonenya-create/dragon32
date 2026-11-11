// Checks the assembler that runs inside the Dragon (games/dasm) against the learning corner's assembler (learn/asm/asm6809.js):
// the Dragon program runs on our 6809 CPU (the same CPU the /learn/asm/ page uses, checked against the machine), assembles
// the same source, and the bytes it writes must be the same, byte for byte.
// Usage: node tools/asm/dasm-check.mjs            (the whole command corpus + the CPU test programs + small programs)
//        node tools/asm/dasm-check.mjs --quick    (fewer chunks)
import { readFileSync } from 'node:fs';
import { corpus } from './corpus.mjs';
await import('../../learn/asm/asm6809.js');
const A = globalThis.ASM6809;
const root = new URL('../../', import.meta.url);

import { run, dis } from './dasm-run.mjs';

function compare(name, lines, unasm) {
  const js = A.assemble(lines.join('\n'));
  const d = run(lines);
  const bad = [];
  if (!js.ok) bad.push('JS errors: ' + js.errs.slice(0, 3).map(e => e.line + ' ' + e.en).join(' | '));
  if (d.errs) bad.push('Dragon errors: ' + d.errs + '\n' + d.screen);
  for (let a = 0x2400; a < 0x3400 && bad.length < 4; a++) {
    const want = js.used[a] ? js.mem[a] : 0;
    if (d.mem[a] !== want) bad.push(`$${a.toString(16)}: Dragon ${d.mem[a].toString(16)} JS ${want.toString(16)}`);
  }
  if (!d.errs && js.ok && d.entry !== js.entry) bad.push(`entry Dragon $${d.entry.toString(16)} JS $${js.entry.toString(16)}`);
  // UNASM: every command the Dragon turns back into text assembles again to the same bytes (commands only, not data)
  if (unasm && !bad.length) {
    for (const x of dis(d.mem, js.start, js.end)) {
      const back = A.assemble(' ' + x.text, { org: x.a });
      const want = [...js.mem.subarray(x.a, x.a + x.len)], got = back.ok ? back.lines[0].bytes : null;
      if (!got || got.join() !== want.join()) { bad.push(`UNASM $${x.a.toString(16)}: "${x.text}" → ${got ? got.map(b => b.toString(16)).join(' ') : back.errs[0].en} (want ${want.map(b => b.toString(16)).join(' ')})`); if (bad.length > 3) break; }
    }
  }
  console.log((bad.length ? '✗ ' : '✓ ') + name + ` (${lines.length} lines, ${js.count} bytes, ${(d.cyc / 894886).toFixed(1)} s on a Dragon)` + (bad.length ? '\n   ' + bad.join('\n   ') : ''));
  return !bad.length;
}

let ok = 0, all = 0;
const quick = process.argv.includes('--quick');
const L = corpus(A);
const head = L[0];
const size = 120;
for (let i = 1; i < L.length; i += size) {
  if (quick && (i - 1) / size % 8) continue;
  all++; if (compare('corpus ' + i + '-' + Math.min(i + size - 1, L.length - 1), [head, ...L.slice(i, i + size)], true)) ok++;
}
// the Assembler page's examples (learn/asm/asm.js), with their comments, like a user would type them
const page = readFileSync(new URL('learn/asm/asm.js', root), 'utf8');
const exSrc = page.slice(page.indexOf('  const cm ='), page.indexOf('\n  ];', page.indexOf('  const EX =')) + 5);
const EX = new Function(exSrc + '\nreturn EX;')();
for (const e of EX) { all++; if (compare('example ' + e.id, e.src)) ok++; }
// small programs with forward names, ORG, EQU, RMB, FCC, SETDP and END
const SMALL = {
  forward: ['@ LDX #TEXT', ' LDA COUNT', ' STA 5,X', ' LDB FAR,PCR', ' BRA DONE', 'TEXT FCC /HELLO/', 'COUNT FCB 3', 'FAR RMB 10', 'DONE RTS'],
  org: [' ORG $3000', 'START LDA #1', ' STA $10', 'V EQU $20', ' STA V', ' STA <V', ' STA >V', ' SETDP $30', ' STA $3010', ' LDD #START+2', ' END START'],
  equlater: ['N EQU M+1', 'M EQU 5', ' LDA #N', ' LDA N,X', ' LEAX M,Y', ' RTS'],
  neg: [' LDA #-1', ' LDX #-2', ' LDA -1,X', ' LDA -16,Y', ' LDA -17,U', ' LDA -129,S', ' FCB -128,255,0', ' FDB -1,$FFFF', ' LDA #%1010', ' LDA #@17', " LDA #'A", ' RTS'],
};
for (const [k, src] of Object.entries(SMALL)) { all++; if (compare('small ' + k, src)) ok++; }
console.log(`${ok}/${all}`);
process.exit(ok === all ? 0 : 1);
