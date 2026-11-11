// בונה את האסמבלר שרץ בתוך ה-Dragon: מייצר את טבלת הפקודות (ops.s), מרכיב את dasm.s עם asm6809,
// ועוטף את התוצאה בקלטת של שפת מכונה (CLOADM), כמו קלטת של אז: lab/1982/tapes/dasm.cas
// Builds the assembler that runs inside the Dragon: the command table (ops.s), dasm.s through asm6809, and a CLOADM tape.
// הרצה: node games/dasm/build.mjs           (בונה)
//        node games/dasm/build.mjs --check   (בודק שהקלטת מעודכנת)
//        node games/dasm/build.mjs --list    (שומר גם dasm.lst ו-dasm.sym ליד המקור)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = fileURLToPath(new URL('../../lab/1982/tapes/dasm.cas', import.meta.url));
const LOAD = 0x3400;

// ---- the command table: the same commands as the learning corner's assembler (learn/asm/asm6809.js) ----
// each entry: name (5 bytes, zero-padded), class, code, flags
const C = { INH: 0, ACC: 1, MEM: 2, IMM8: 3, REL: 4, LREL: 5, LEA: 6, STK: 7, REG: 8 };
const F = { P10: 1, P11: 2, W: 4, NOI: 8, U: 16 };
const T = [];
const add = (n, c, code, f = 0) => T.push([n, c, code, f]);
for (const [n, c] of [['NEG', 0], ['COM', 3], ['LSR', 4], ['ROR', 6], ['ASR', 7], ['ASL', 8], ['ROL', 9], ['DEC', 0xA], ['INC', 0xC], ['TST', 0xD], ['JMP', 0xE], ['CLR', 0xF]]) {
  add(n, C.MEM, c);
  if (n !== 'JMP') { add(n + 'A', C.INH, 0x40 + c); add(n + 'B', C.INH, 0x50 + c); }
}
for (const [n, c, f] of [['NOP', 0x12], ['SYNC', 0x13], ['DAA', 0x19], ['SEX', 0x1D], ['RTS', 0x39], ['ABX', 0x3A], ['RTI', 0x3B], ['MUL', 0x3D], ['SWI', 0x3F], ['SWI2', 0x3F, F.P10], ['SWI3', 0x3F, F.P11]]) add(n, C.INH, c, f);
add('ORCC', C.IMM8, 0x1A); add('ANDCC', C.IMM8, 0x1C); add('CWAI', C.IMM8, 0x3C);
add('EXG', C.REG, 0x1E); add('TFR', C.REG, 0x1F);
const BR = ['BRA', 'BRN', 'BHI', 'BLS', 'BHS', 'BLO', 'BNE', 'BEQ', 'BVC', 'BVS', 'BPL', 'BMI', 'BGE', 'BLT', 'BGT', 'BLE'];
BR.forEach((n, c) => { add(n, C.REL, 0x20 + c); if (n === 'BRA') add('LBRA', C.LREL, 0x16); else add('L' + n, C.LREL, 0x20 + c, F.P10); });
add('BSR', C.REL, 0x8D); add('LBSR', C.LREL, 0x17);
[['LEAX', 0x30], ['LEAY', 0x31], ['LEAS', 0x32], ['LEAU', 0x33]].forEach(([n, c]) => add(n, C.LEA, c));
add('PSHS', C.STK, 0x34); add('PULS', C.STK, 0x35); add('PSHU', C.STK, 0x36, F.U); add('PULU', C.STK, 0x37, F.U);
for (const [n, c] of [['SUB', 0], ['CMP', 1], ['SBC', 2], ['AND', 4], ['BIT', 5], ['LD', 6], ['ST', 7], ['EOR', 8], ['ADC', 9], ['OR', 0xA], ['ADD', 0xB]]) {
  const f = n === 'ST' ? F.NOI : 0;
  add(n + 'A', C.ACC, 0x80 + c, f); add(n + 'B', C.ACC, 0xC0 + c, f);
}
for (const [n, c, f] of [['SUBD', 0x83, 0], ['ADDD', 0xC3, 0], ['CMPX', 0x8C, 0], ['LDX', 0x8E, 0], ['STX', 0x8F, F.NOI], ['LDD', 0xCC, 0], ['STD', 0xCD, F.NOI],
  ['LDU', 0xCE, 0], ['STU', 0xCF, F.NOI], ['CMPD', 0x83, F.P10], ['CMPY', 0x8C, F.P10], ['LDY', 0x8E, F.P10], ['STY', 0x8F, F.P10 | F.NOI],
  ['LDS', 0xCE, F.P10], ['STS', 0xCF, F.P10 | F.NOI], ['CMPU', 0x83, F.P11], ['CMPS', 0x8C, F.P11]]) add(n, C.ACC, c, f | F.W);
add('JSR', C.ACC, 0x8D, F.NOI);
// other names for the same commands
for (const [a, b] of [['LSL', 'ASL'], ['LSLA', 'ASLA'], ['LSLB', 'ASLB'], ['BCC', 'BHS'], ['BCS', 'BLO'], ['LBCC', 'LBHS'], ['LBCS', 'LBLO']]) {
  const e = T.find(x => x[0] === b); add(a, e[1], e[2], e[3]);
}
const hx = v => '$' + v.toString(16).padStart(2, '0');
let ops = '; נוצר אוטומטית על ידי build.mjs. לא לערוך ביד. / Made by build.mjs, do not edit.\n; name (5 bytes), class, code, flags\noptab\n';
for (const [n, c, code, f] of T) {
  const nb = [...n].map(ch => ch.charCodeAt(0)); while (nb.length < 5) nb.push(0);
  ops += `\t\tfcb\t${nb.map(hx).join(',')},${c},${hx(code)},${f}\t; ${n}\n`;
}
ops += '\t\tfcb\t0\t\t; end\n';

const dir = mkdtempSync(join(tmpdir(), 'dasm-'));
let bin;
try {
  writeFileSync(join(dir, 'ops.s'), ops);
  writeFileSync(join(dir, 'dasm.s'), readFileSync(join(here, 'dasm.s')));
  writeFileSync(join(dir, 'debug.s'), readFileSync(join(here, 'debug.s')));
  execFileSync('asm6809', ['-B', '-o', join(dir, 'dasm.bin'), '-l', join(dir, 'dasm.lst'), '-s', join(dir, 'dasm.sym'), 'dasm.s'], { cwd: dir, stdio: 'inherit' });
  bin = readFileSync(join(dir, 'dasm.bin'));
  if (process.argv.includes('--list')) {
    writeFileSync(join(here, 'dasm.lst'), readFileSync(join(dir, 'dasm.lst')));
    writeFileSync(join(here, 'dasm.sym'), readFileSync(join(dir, 'dasm.sym')));
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

// הקלטת: כותרת (שם, סוג 2 = שפת מכונה, כתובת הפעלה, כתובת טעינה), ואז בלוקים של 255
function block(type, data) {
  let sum = type + data.length;
  for (const b of data) sum += b;
  return [0x55, 0x3c, type, data.length, ...data, sum & 255, 0x55];
}
const leader = () => Array(218).fill(0x55);
const name = [...'ASSEMBLR'].map(c => c.charCodeAt(0));
const head = [...name, 2, 0, 0, LOAD >> 8, LOAD & 255, LOAD >> 8, LOAD & 255];
const cas = [...leader(), ...block(0, head), ...leader()];
for (let i = 0; i < bin.length; i += 255) cas.push(...block(1, [...bin.subarray(i, i + 255)]));
cas.push(...block(0xff, []));
const bytes = Buffer.from(cas);

if (process.argv.includes('--check')) {
  let old = null;
  try { old = readFileSync(out); } catch {}
  const same = old && Buffer.compare(old, bytes) === 0;
  console.log(same ? '✓ dasm.cas is up to date' : '✗ dasm.cas is out of date: node games/dasm/build.mjs');
  process.exit(same ? 0 : 1);
}
writeFileSync(out, bytes);
console.log(`dasm.cas: ${bin.length} bytes of code, $${LOAD.toString(16)}-$${(LOAD + bin.length - 1).toString(16)}`);
