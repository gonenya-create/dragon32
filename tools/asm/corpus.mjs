// The test corpus: every 6809 command in every addressing mode, every indexed form with every finger.
// Used by tools/asm/check-ref.mjs (against lwasm and asm6809) and by dragon-test.mjs part 'asm'.
export function corpus(A) {
  const L = ['BACK NOP'];
  const IDX = [];
  for (const R of ['X', 'Y', 'U', 'S']) {
    IDX.push(`,${R}`, `,${R}+`, `,${R}++`, `,-${R}`, `,--${R}`, `A,${R}`, `B,${R}`, `D,${R}`, `5,${R}`, `-16,${R}`, `15,${R}`, `-17,${R}`, `16,${R}`, `100,${R}`,
      `-128,${R}`, `127,${R}`, `128,${R}`, `-129,${R}`, `1000,${R}`, `-1000,${R}`, `$7FFF,${R}`, `[,${R}]`, `[,${R}++]`, `[,--${R}]`, `[A,${R}]`, `[B,${R}]`, `[D,${R}]`,
      `[5,${R}]`, `[-100,${R}]`, `[1000,${R}]`, `<5,${R}`, `>5,${R}`);
  }
  IDX.push('[$1234]', 'BACK,PCR', '[BACK,PCR]', '>BACK,PCR', '$3000,PCR', '<*,PCR');
  for (const n of Object.keys(A.OPS).sort()) {
    const o = A.OPS[n];
    if (o.inh) L.push(' ' + n);
    if (o.imm) L.push(' ' + n + ' #' + (o.imm[2] === 2 ? '$1234' : '$12'), ' ' + n + ' #' + (o.imm[2] === 2 ? '-2' : '-1'));
    if (o.dir) L.push(' ' + n + ' <$12');
    if (o.ext) L.push(' ' + n + ' $1234', ' ' + n + ' >$0012');
    if (o.idx) for (const t of IDX) L.push(' ' + n + ' ' + t);
    if (o.rel) L.push(' ' + n + ' *', ' ' + n + ' *-100', ' ' + n + ' *+100');
    if (o.lrel) L.push(' ' + n + ' BACK');
    if (o.stk) { const u = n.endsWith('U'); for (const t of ['A', 'B', 'CC', 'DP', 'X', 'Y', u ? 'S' : 'U', 'PC', 'A,B', 'D', 'A,B,X,Y', 'CC,A,B,DP,X,Y,' + (u ? 'S' : 'U') + ',PC']) L.push(' ' + n + ' ' + t); }
    if (o.reg) for (const a of ['D', 'X', 'Y', 'U', 'S', 'PC']) for (const b of ['D', 'X', 'Y', 'U', 'S', 'PC']) L.push(' ' + n + ' ' + a + ',' + b);
    if (o.reg) for (const a of ['A', 'B', 'CC', 'DP']) for (const b of ['A', 'B', 'CC', 'DP']) L.push(' ' + n + ' ' + a + ',' + b);
  }
  return L;
}
