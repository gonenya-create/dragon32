// Programs that test the 6809 CPU of /learn/asm/ against the Dragon machine (XRoar's 6809).
// Each writes its results from $6000 on, then RTS back to BASIC. tools/asm/cpu-expected.json holds what the machine wrote
// (made by running each program on /lab/1982/: CLOADM, EXEC, read memory). dragon-test.mjs part 'asm' runs them on our CPU.
const V8 = [0x00, 0x01, 0x0F, 0x10, 0x7F, 0x80, 0x81, 0xFE, 0xFF, 0x99];
const V16 = [0x0000, 0x0001, 0x7FFF, 0x8000, 0x8001, 0xFFFF, 0x1234];
const hx = v => '$' + v.toString(16).toUpperCase();
const fcb = vs => { const o = []; for (let i = 0; i < vs.length; i += 12) o.push(' FCB ' + vs.slice(i, i + 12).map(hx).join(',')); return o; };
const fdb = vs => { const o = []; for (let i = 0; i < vs.length; i += 8) o.push(' FDB ' + vs.slice(i, i + 8).map(hx).join(',')); return o; };
let k = 0;
const lbl = () => 'L' + (++k);

// 1. the arithmetic: every 8-bit two-number command, every pair, with the carry lamp off and on; then the one-number commands
function alu() {
  k = 0;
  const pairs = []; for (const a of V8) for (const b of V8) pairs.push(a, b);
  const L = ['* ALU: results from $6000', '@ PSHS CC', ' ORCC #$50', ' ANDCC #$50', ' LDU #$6000'];
  for (const op of ['ADDA', 'ADCA', 'SUBA', 'SBCA', 'CMPA', 'ANDA', 'ORA', 'EORA', 'BITA', 'ADDB', 'SBCB'])
    for (const cin of (/^(ADC|SBC)/.test(op) ? [0x50, 0x51] : [0x50, 0x5F])) {
      const l = lbl(), B = op.endsWith('B');
      L.push(' LDX #PAIRS', l + ' LDA #' + hx(cin), ' TFR A,CC', B ? ' LDB ,X' : ' LDA ,X', ' ' + op + ' 1,X', B ? ' TFR CC,A' : ' TFR CC,B', ' STA ,U+', ' STB ,U+', ' LEAX 2,X', ' CMPX #PAIRS+' + pairs.length, ' BNE ' + l);
    }
  for (const op of ['NEGA', 'COMA', 'LSRA', 'RORA', 'ASRA', 'ASLA', 'ROLA', 'DECA', 'INCA', 'TSTA', 'CLRA', 'DAA', 'NEG', 'ROL', 'ROR', 'INC'])
    for (const cin of [0x50, 0x51, 0x70, 0x71]) {
      const l = lbl(), mem = !op.endsWith('A') && op !== 'DAA';
      L.push(' LDX #VALS', l + ' LDA #' + hx(cin), ' TFR A,CC', ' LDA ,X', mem ? ' STA TMP' : null, mem ? ' ' + op + ' TMP' : ' ' + op, mem ? ' LDA TMP' : null, ' TFR CC,B', ' STA ,U+', ' STB ,U+', ' LEAX 1,X', ' CMPX #VALS+' + V8.length, ' BNE ' + l);
    }
  // DAA after an add (the way it is used)
  { const l = lbl(); L.push(' LDX #PAIRS', l + ' LDA #$50', ' TFR A,CC', ' LDA ,X', ' ADDA 1,X', ' DAA', ' TFR CC,B', ' STA ,U+', ' STB ,U+', ' LEAX 2,X', ' CMPX #PAIRS+' + pairs.length, ' BNE ' + l); }
  L.push(' PULS CC', ' RTS', 'TMP RMB 1', 'VALS FCB ' + V8.map(hx).join(','), 'PAIRS EQU *', ...fcb(pairs));
  return L.filter(x => x != null).join('\n') + '\n';
}

// 2. 16 bits, MUL, SEX, and every branch with every lamp mix
function wide() {
  k = 0;
  const pairs = []; for (const a of V16) for (const b of V16) pairs.push(a, b);
  const L = ['* 16 bits and branches: results from $6000', '@ PSHS CC', ' ORCC #$50', ' ANDCC #$50', ' LDU #$6000'];
  for (const op of ['ADDD', 'SUBD', 'CMPD', 'CMPX', 'CMPY', 'CMPU']) {
    const l = lbl();
    if (op === 'CMPU') L.push(' PSHS U', ' LDX #P16', l + ' LDU ,X', ' CMPU 2,X', ' TFR CC,A', ' LDU ,S', ' STA ,U+', ' STU ,S', ' LEAX 4,X', ' CMPX #P16+' + pairs.length * 2, ' BNE ' + l, ' PULS U');
    else if (op === 'CMPX') L.push(' LDY #P16', l + ' LDX ,Y', ' CMPX 2,Y', ' TFR CC,A', ' STA ,U+', ' LEAY 4,Y', ' CMPY #P16+' + pairs.length * 2, ' BNE ' + l);
    else if (op === 'CMPY') L.push(' LDX #P16', l + ' LDY ,X', ' CMPY 2,X', ' TFR CC,A', ' STA ,U+', ' LEAX 4,X', ' CMPX #P16+' + pairs.length * 2, ' BNE ' + l);
    else L.push(' LDX #P16', l + ' LDA #$51', ' TFR A,CC', ' LDD ,X', ' ' + op + ' 2,X', ' STD ,U++', ' TFR CC,A', ' STA ,U+', ' LEAX 4,X', ' CMPX #P16+' + pairs.length * 2, ' BNE ' + l);
  }
  { const l = lbl(); L.push(' LDX #P8', l + ' LDA ,X', ' LDB 1,X', ' MUL', ' STD ,U++', ' TFR CC,A', ' STA ,U+', ' LEAX 2,X', ' CMPX #P8+200', ' BNE ' + l); }
  { const l = lbl(); L.push(' LDX #P8', l + ' LDB ,X+', ' SEX', ' STD ,U++', ' TFR CC,A', ' STA ,U+', ' CMPX #P8+10', ' BNE ' + l); }
  for (const br of ['BRA', 'BRN', 'BHI', 'BLS', 'BHS', 'BLO', 'BNE', 'BEQ', 'BVC', 'BVS', 'BPL', 'BMI', 'BGE', 'BLT', 'BGT', 'BLE', 'LBHI', 'LBGE', 'LBLE', 'LBVS']) {
    const l = lbl(), s = lbl();
    L.push(' CLRA', l + ' LDB #1', ' PSHS A', ' ORA #$50', ' TFR A,CC', ' ' + br + ' ' + s, ' CLRB', s + ' STB ,U+', ' PULS A', ' INCA', ' CMPA #16', ' BNE ' + l);
  }
  L.push(' PULS CC', ' RTS', 'P16 EQU *', ...fdb(pairs), 'P8 EQU *', ...fcb([0x00, 0x01, 0x0F, 0x10, 0x7F, 0x80, 0x81, 0xFE, 0xFF, 0x99, 0x0C, 0xC0, 0x40, 0x02, 0x55, 0xAA, 0x33, 0x08, 0x64, 0xC8].flatMap((a, i, arr) => arr.slice(0, 5).map(b => [a, b]).flat())));
  return L.join('\n') + '\n';
}

// 3. addressing modes, the stack, TFR/EXG, LEA, direct page: after each command the whole state (CC A B DP X Y U) is written
function modes() {
  const L = ['* modes: after each command CC,A,B,DP,X,Y,U go to the buffer at $6000', '@ PSHS CC,DP', ' ORCC #$50', ' ANDCC #$50', ' LDX #$6000', ' STX BP',
    ' LDD #$8001', ' LDX #TBL', ' LDY #TBL+8', ' LDU #$7000'];
  const t = [
    'LDA 5,X', 'LDB -3,Y', 'LDA #3', 'LDA A,X', 'LDB #-2', 'LDB B,Y', 'LDD #4', 'LDD D,X', 'LEAX 2,X', 'LDA ,X+', 'LDB ,X++', 'LDA ,-X', 'LDB ,--X', 'LEAY 1000,Y', 'LEAY -1000,Y', 'LEAU -16,U', 'LEAU 15,U',
    'LDX #PTRS', 'LDD [,X]', 'LDD [2,X]', 'LDA [,X++]', 'LDB [,--X]', 'LDY #PTRS', 'LDA #0', 'LDD [A,Y]', 'LDA #2', 'LDD [A,Y]', 'LDX [PTRS]', 'LDD [PTRS+2]', 'LEAX TBL,PCR', 'LDA TBL+3,PCR', 'LDD [PTRS,PCR]',
    'LDX #TBL', 'LDB #4', 'ABX', 'LDB #$FF', 'ABX', 'LDB #$80', 'SEX', 'LDB #$7F', 'SEX',
    'LDD #$1234', 'EXG A,B', 'TFR A,DP', 'TFR DP,B', 'LDX #$1111', 'LDY #$2222', 'EXG X,Y', 'TFR X,U', 'EXG D,U', 'TFR Y,D', 'LDA #0', 'TFR A,DP',
    'LDA #$60', 'TFR A,DP', 'LDA #$5A', 'STA <$10', 'CLR <$11', 'INC <$11', 'LDB <$10', 'LDX <$10', 'LDA #0', 'TFR A,DP', 'LDD $6010',
    'LDD #$1122', 'LDX #$3344', 'LDY #$5566', 'PSHS A,B,X,Y', 'PULS D', 'PULS X,Y', 'PSHS D', 'PULS A', 'PULS B', 'LEAS -4,S', 'LEAS 4,S',
    'LDU #$7000', 'LDD #$ABCD', 'PSHU A,B,X,Y', 'LDX ,U', 'LDY 2,U', 'LDD 4,U', 'PULU A,B,X,Y', 'LDA #$5F', 'TFR A,CC', 'TFR CC,B', 'ANDCC #$F0', 'ORCC #$05',
    'LDX #TBL', 'NEG ,X', 'COM 1,X', 'LDD ,X', 'LSR 2,X', 'ASL 3,X', 'LDD 2,X', 'TST 4,X', 'CLR 4,X', 'LDA 4,X',
    'JSR SUB1', 'BSR SUB1', 'LBSR SUB1', 'LDX #SUB1', 'JSR ,X', 'LDY #PSUB', 'JSR [,Y]', 'LDX #TBL', 'JMP NEXT1', 'LDA #$EE', '>NEXT1 LDA #$77'];
  for (const c of t) L.push(c[0] === '>' ? c.slice(1) : ' ' + c, ' JSR DUMP');   // '>' = a line with a place name
  L.push(' PULS CC,DP', ' RTS',
    'SUB1 LDA #$42', ' RTS',
    'DUMP PSHS U,Y,X,DP,B,A,CC', ' LDY BP', ' LEAX ,S', ' LDB #11', 'DL LDA ,X+', ' STA ,Y+', ' DECB', ' BNE DL', ' STY BP', ' PULS CC,A,B,DP,X,Y,U', ' RTS',
    'BP RMB 2', 'TBL FCB $10,$20,$30,$40,$50,$60,$70,$80', ' FCB 1,2,3,4,5,6,7,8', 'PTRS FDB TBL+1,TBL+4,TBL+9', 'PSUB FDB SUB1');
  return L.join('\n') + '\n';
}

export const CPU_PROGS = { alu, wide, modes };
// run a program on our CPU with plain RAM; returns the bytes it wrote from $6000 (n bytes)
export function runOurs(A, src, n) {
  const img = A.assemble(src);
  if (img.errs.length) throw new Error('asm: line ' + img.errs[0].line + ' ' + img.errs[0].en);
  const mem = new Uint8Array(65536);
  for (let a = 0; a < 65536; a++) if (img.used[a]) mem[a] = img.mem[a];
  const cpu = A.cpu(a => mem[a], (a, v) => { mem[a] = v; });
  cpu.r.PC = img.entry; cpu.r.S = 0x7EF0; mem[0x7EF0] = 0xFF; mem[0x7EF1] = 0xF0;
  let guard = 0;
  while (cpu.r.PC !== 0xFFF0) { cpu.step(); if (++guard > 5e6) throw new Error('runaway'); }
  return { bytes: mem.slice(0x6000, 0x6000 + n), img, cpu };
}
