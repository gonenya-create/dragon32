// Runs the assembler that runs inside the Dragon (games/dasm) on our 6809 CPU: run(lines) → bytes, errors, screen.
import { readFileSync } from 'node:fs';
await import('../../learn/asm/asm6809.js');
const A = globalThis.ASM6809;
const root = new URL('../../', import.meta.url);
// the program: from the tape (blocks of type 1)
const cas = readFileSync(new URL('lab/1982/tapes/dasm.cas', root));
const bin = [];
for (let i = 0; i < cas.length - 3; i++) {
  if (cas[i] !== 0x55 || cas[i + 1] !== 0x3c) continue;
  const t = cas[i + 2], n = cas[i + 3];
  if (t === 1) bin.push(...cas.subarray(i + 4, i + 4 + n));
  if (t === 0 || t === 1) i += 4 + n;
}
const LOAD = 0x5000;
const sym = {};
try {
  for (const l of readFileSync(new URL('games/dasm/dasm.sym', root), 'utf8').split('\n')) { const m = /^(\S+)\s+equ\s+(\d+)/.exec(l); if (m) sym[m[1]] = +m[2]; }
} catch { console.log('run: node games/dasm/build.mjs --list (it writes dasm.sym)'); process.exit(2); }
const SRC = 0x3c00, STOP = 0x7f10;

export function run(lines) {
  const mem = new Uint8Array(65536);
  mem.set(bin, LOAD);
  mem[0x7f00] = 0x4f; mem[0x7f01] = 0x39;       // POLCAT: CLRA, RTS (no key)
  mem[0xa000] = 0x7f; mem[0xa001] = 0x00;
  for (let a = 0x400; a < 0x600; a++) mem[a] = 0x60;
  let p = SRC;
  for (const c of 'D82S') mem[p++] = c.charCodeAt(0);
  lines.forEach((t, k) => {
    const n = (k + 1) * 10; mem[p++] = n >> 8; mem[p++] = n & 255; mem[p++] = t.length;
    for (const ch of t) mem[p++] = ch.charCodeAt(0);
  });
  mem[p++] = 0xff; mem[p++] = 0xff;
  if (p > 0x5000) throw new Error('source too big for the buffer: ' + lines.length + ' lines');
  const wr16 = (a, v) => { mem[a] = v >> 8; mem[a + 1] = v & 255; };
  wr16(sym.curpos, 0x400);
  const c = A.cpu(a => mem[a], (a, v) => { mem[a] = v; });
  c.r.S = 0x7e00 - 2; wr16(c.r.S, STOP); c.r.PC = sym.asmall;
  let n = 0;
  while (c.r.PC !== STOP) { c.step(); if (++n > 400e6) throw new Error('did not finish'); }
  const rd16 = a => (mem[a] << 8) | mem[a + 1];
  let screen = '';
  for (let a = 0x400; a < 0x600; a += 32) screen += [...mem.subarray(a, a + 32)].map(v => { v &= 0x7f; return v >= 0x40 && v < 0x60 ? String.fromCharCode(v) : v >= 0x60 ? String.fromCharCode(v - 0x40) : String.fromCharCode(v + 0x40); }).join('') + '\n';
  return { mem, errs: rd16(sym.errcnt), entry: rd16(sym.entry), min: rd16(sym.minad), max: rd16(sym.maxad), steps: n, cyc: c.r.cyc, screen };
}

