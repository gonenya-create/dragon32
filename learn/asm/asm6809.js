/* האסמבלר של פינת הלמידה: מתרגם 6809 מלא ומעבד 6809 מלא, בלי DOM. כתבנו אותו בעצמנו (11.11.2026).
   The learning corner's assembler: a full 6809 assembler and a full 6809 CPU, no DOM. Our own code (11.11.2026).
   - Syntax like DREAM (1983): a label in column 0, a space before the command, ORG/EQU/FCB/FDB/FCC/RMB/END/SETDP,
     $hex, %binary, decimal, 'c, simple sums (LABEL+1, *-2), comments after the operand, or a line that starts with *.
   - Every 6809 command and addressing mode, the $10/$11 pages, cycle counts from the Motorola datasheet.
   - Two passes like DREAM: a name that is defined later (a forward reference) takes the long form (16 bits / extended).
   - Messages in Hebrew and English: each error is {line, he, en}.
   Used by /learn/asm/ (browser) and by tools/dragon-test.mjs (node, part 'asm'). */
(function (G) {
  'use strict';
  const ORG0 = 0x2EE1;
  const H2 = v => '$' + (v & 255).toString(16).toUpperCase().padStart(2, '0');
  const H4 = v => '$' + (v & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');

  /* ---------------- the opcode table ----------------
     OPS[name] = { inh:[code,cyc], imm:[code,cyc,bytes], dir:[code,cyc], idx:[code,cyc], ext:[code,cyc], rel:[code,cyc], lrel:[code,cyc,cycTaken], stk:[code,cyc], reg:[code,cyc] } */
  const OPS = {};
  const add = (n, m, v) => { (OPS[n] = OPS[n] || {})[m] = v; };
  // memory commands: direct $0x, indexed $6x, extended $7x; on A $4x, on B $5x
  [['NEG', 0], ['COM', 3], ['LSR', 4], ['ROR', 6], ['ASR', 7], ['ASL', 8], ['ROL', 9], ['DEC', 0xA], ['INC', 0xC], ['TST', 0xD], ['JMP', 0xE], ['CLR', 0xF]].forEach(([n, c]) => {
    const j = n === 'JMP';
    add(n, 'dir', [c, j ? 3 : 6]); add(n, 'idx', [0x60 + c, j ? 3 : 6]); add(n, 'ext', [0x70 + c, j ? 4 : 7]);
    if (!j) { add(n + 'A', 'inh', [0x40 + c, 2]); add(n + 'B', 'inh', [0x50 + c, 2]); }
  });
  [['NOP', 0x12, 2], ['SYNC', 0x13, 4], ['DAA', 0x19, 2], ['SEX', 0x1D, 2], ['RTS', 0x39, 5], ['ABX', 0x3A, 3], ['RTI', 0x3B, 6], ['MUL', 0x3D, 11], ['SWI', 0x3F, 19], ['SWI2', 0x103F, 20], ['SWI3', 0x113F, 20]]
    .forEach(([n, c, y]) => add(n, 'inh', [c, y]));
  add('ORCC', 'imm', [0x1A, 3, 1]); add('ANDCC', 'imm', [0x1C, 3, 1]); add('CWAI', 'imm', [0x3C, 20, 1]);
  add('EXG', 'reg', [0x1E, 8]); add('TFR', 'reg', [0x1F, 6]);
  const BR = [['BRA', 0], ['BRN', 1], ['BHI', 2], ['BLS', 3], ['BHS', 4], ['BLO', 5], ['BNE', 6], ['BEQ', 7], ['BVC', 8], ['BVS', 9], ['BPL', 0xA], ['BMI', 0xB], ['BGE', 0xC], ['BLT', 0xD], ['BGT', 0xE], ['BLE', 0xF]];
  BR.forEach(([n, c]) => { add(n, 'rel', [0x20 + c, 3]); add('L' + n, 'lrel', n === 'BRA' ? [0x16, 5, 5] : [0x1020 + c, 5, 6]); });
  add('BSR', 'rel', [0x8D, 7]); add('LBSR', 'lrel', [0x17, 9, 9]);
  [['LEAX', 0x30], ['LEAY', 0x31], ['LEAS', 0x32], ['LEAU', 0x33]].forEach(([n, c]) => add(n, 'idx', [c, 4]));
  [['PSHS', 0x34], ['PULS', 0x35], ['PSHU', 0x36], ['PULU', 0x37]].forEach(([n, c]) => add(n, 'stk', [c, 5]));
  // the accumulator commands: A from $80, B from $C0; +$00 immediate, +$10 direct, +$20 indexed, +$30 extended
  const acc = (n, base, cyc, wide, noImm) => {
    if (!noImm) add(n, 'imm', [base, cyc[0], wide ? 2 : 1]);
    add(n, 'dir', [base + 0x10, cyc[1]]); add(n, 'idx', [base + 0x20, cyc[2]]); add(n, 'ext', [base + 0x30, cyc[3]]);
  };
  const C8 = [2, 4, 4, 5];
  [['SUB', 0], ['CMP', 1], ['SBC', 2], ['AND', 4], ['BIT', 5], ['LD', 6], ['ST', 7], ['EOR', 8], ['ADC', 9], ['OR', 0xA], ['ADD', 0xB]].forEach(([n, c]) => {
    acc(n + 'A', 0x80 + c, C8, false, n === 'ST'); acc(n + 'B', 0xC0 + c, C8, false, n === 'ST');
  });
  const C16a = [4, 6, 6, 7], C16l = [3, 5, 5, 6], C16p = [5, 7, 7, 8], C16y = [4, 6, 6, 7];
  acc('SUBD', 0x83, C16a, true); acc('ADDD', 0xC3, C16a, true); acc('CMPX', 0x8C, C16a, true);
  acc('LDX', 0x8E, C16l, true); acc('STX', 0x8F, C16l, true, true);
  acc('LDD', 0xCC, C16l, true); acc('STD', 0xCD, C16l, true, true);
  acc('LDU', 0xCE, C16l, true); acc('STU', 0xCF, C16l, true, true);
  add('JSR', 'dir', [0x9D, 7]); add('JSR', 'idx', [0xAD, 7]); add('JSR', 'ext', [0xBD, 8]);
  acc('CMPD', 0x1083, C16p, true); acc('CMPY', 0x108C, C16p, true);
  acc('LDY', 0x108E, C16y, true); acc('STY', 0x108F, C16y, true, true);
  acc('LDS', 0x10CE, C16y, true); acc('STS', 0x10CF, C16y, true, true);
  acc('CMPU', 0x1183, C16p, true); acc('CMPS', 0x118C, C16p, true);
  const ALIAS = { LSL: 'ASL', LSLA: 'ASLA', LSLB: 'ASLB', BCC: 'BHS', BCS: 'BLO', LBCC: 'LBHS', LBCS: 'LBLO' };
  const DIRS = ['ORG', 'EQU', 'FCB', 'FDB', 'FCC', 'RMB', 'END', 'SETDP', 'NAM', 'TTL', 'OPT', 'PAGE', 'SPC'];
  const isOp = n => !!(OPS[n] || ALIAS[n]);
  const opOf = n => OPS[ALIAS[n] || n];
  // the decoder: code (with $10/$11) -> {op, mode, cyc, ...}
  const DEC = {};
  for (const n in OPS) for (const m in OPS[n]) { const v = OPS[n][m]; DEC[v[0]] = { op: n, mode: m, cyc: v[1], imm: m === 'imm' ? v[2] : 0, taken: v[2] }; }

  const REG8 = { A: 8, B: 9, CC: 10, DP: 11 }, REG16 = { D: 0, X: 1, Y: 2, U: 3, S: 4, PC: 5 };
  const RNAME = { 0: 'D', 1: 'X', 2: 'Y', 3: 'U', 4: 'S', 5: 'PC', 8: 'A', 9: 'B', 10: 'CC', 11: 'DP' };
  const IXR = { X: 0, Y: 1, U: 2, S: 3 };
  const STK = { CC: 1, A: 2, B: 4, D: 6, DP: 8, X: 0x10, Y: 0x20, U: 0x40, S: 0x40, PC: 0x80 };
  const RESERVED = new Set(['A', 'B', 'D', 'X', 'Y', 'U', 'S', 'PC', 'PCR', 'CC', 'DP']);

  /* ---------------- messages ---------------- */
  const E = (he, en) => ({ he, en });
  const B = s => '<bdi class="ltr">' + String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</bdi>';

  /* ---------------- numbers and sums ---------------- */
  // returns {v, known, fwd} or {err}. + - * / with the usual order (* and / first), ( ), and a sign before a number.
  // Division is whole numbers, towards zero. The Dragon Assembler (games/dasm) does the same, in 24 bits (11.11.2026)
  function expr(t, sym, here, pass) {
    t = t.trim();
    if (!t) return { err: E('חסר מספר.', 'A number is missing.') };
    let i = 0, known = true, fwd = false;
    const fail = e => { throw e; };
    const dunno = r => ({ err: E('אני לא מבין את ' + B(r || t) + '. בחשבון כאן יש ' + B('+ - * /') + ' וסוגריים, למשל ' + B('LOOP+2') + ' או ' + B('(SIZE+1)*2') + '.', 'I don\'t understand ' + B(r || t) + '. Sums here use ' + B('+ - * /') + ' and brackets, for example ' + B('LOOP+2') + ' or ' + B('(SIZE+1)*2') + '.') });
    function term() {
      const r = t.slice(i);
      let m, v = null, len = 0;
      if ((m = /^\$([0-9A-F]+)/i.exec(r))) { v = parseInt(m[1], 16); len = m[0].length; }
      else if ((m = /^%([01]+)/.exec(r))) { v = parseInt(m[1], 2); len = m[0].length; }
      else if ((m = /^@([0-7]+)/.exec(r))) { v = parseInt(m[1], 8); len = m[0].length; }
      else if ((m = /^[0-9]+/.exec(r))) {
        if (/^[0-9]+[A-Z_]/i.test(r)) fail({ err: E('אני לא מבין את המספר ' + B(r) + '. מספר הקסדצימלי מתחיל ב-' + B('$') + ', למשל ' + B('$' + r) + '.', 'I don\'t understand the number ' + B(r) + '. A hex number starts with ' + B('$') + ', for example ' + B('$' + r) + '.') });
        v = parseInt(m[0], 10); len = m[0].length;
      }
      else if (r[0] === "'" && r.length >= 2) { v = r.charCodeAt(1) & 255; len = 2; }
      else if (r[0] === '*') { v = here; len = 1; }
      else if ((m = /^[A-Z_.@][A-Z0-9_.@$]*/i.exec(r))) {
        const n = m[0].toUpperCase(); len = m[0].length;
        const sy = sym[n];
        if (!sy || (pass === 1 && !sy.known)) {
          if (pass === 1) { known = false; fwd = true; v = 0; }
          else fail({ err: E('אין בתוכנית מקום בשם ' + B(n) + '. (שם של מקום כותבים צמוד לתחילת השורה.)', 'There is no place called ' + B(n) + ' in the program. (A place name is written at the very start of a line.)'), sym: n });
        } else { v = sy.v; if (sy.line > sym.__line) fwd = true; }
      }
      else fail(dunno(r));
      i += len;
      return v;
    }
    function unary() {
      if (t[i] === '-') { i++; return -unary(); }
      if (t[i] === '+') { i++; return unary(); }
      if (t[i] === '(') {
        i++; const v = sum();
        if (t[i] !== ')') fail({ err: E('חסר ' + B(')') + ' בחשבון.', 'A ' + B(')') + ' is missing in the sum.') });
        i++; return v;
      }
      return term();
    }
    function prod() {
      let v = unary();
      while (t[i] === '*' || t[i] === '/') {
        const op = t[i++], w = unary();
        if (op === '*') v *= w;
        else if (w === 0) { if (known) fail({ err: E('אי אפשר לחלק באפס.', 'You can\'t divide by zero.') }); v = 0; }
        else v = Math.trunc(v / w);
      }
      return v;
    }
    function sum() {
      let v = prod();
      while (t[i] === '+' || t[i] === '-') { const op = t[i++], w = prod(); v = op === '+' ? v + w : v - w; }
      return v;
    }
    try {
      const v = sum();
      if (i < t.length) return dunno(t);
      return { v, known, fwd };
    } catch (e) { return e; }
  }

  /* split the operand from the comment: the operand ends at the first space (outside 'c) */
  function operandOf(rest) {
    let i = 0;
    while (i < rest.length && rest[i] !== ' ') { if (rest[i] === "'" && i + 1 < rest.length) i++; i++; }
    return rest.slice(0, i);
  }

  /* ---------------- the indexed postbyte ---------------- */
  // returns {pb, extra:[bytes], cyc, size} or {err}; o = {reg, kind, off, offKnown, force, ind}
  function idxEncode(o, nextAddr) {
    const rr = (IXR[o.reg] || 0) << 5, ind = o.ind ? 0x10 : 0;
    const no = E('הצורה ' + B(o.text) + ' לא קיימת עם סוגריים מרובעים.', 'The form ' + B(o.text) + ' does not exist inside square brackets.');
    switch (o.kind) {
      case 'zero': return { pb: 0x84 | rr | ind, extra: [], cyc: ind ? 3 : 0 };
      case 'inc1': if (ind) return { err: no }; return { pb: 0x80 | rr, extra: [], cyc: 2 };
      case 'inc2': return { pb: 0x81 | rr | ind, extra: [], cyc: ind ? 6 : 3 };
      case 'dec1': if (ind) return { err: no }; return { pb: 0x82 | rr, extra: [], cyc: 2 };
      case 'dec2': return { pb: 0x83 | rr | ind, extra: [], cyc: ind ? 6 : 3 };
      case 'A': return { pb: 0x86 | rr | ind, extra: [], cyc: ind ? 4 : 1 };
      case 'B': return { pb: 0x85 | rr | ind, extra: [], cyc: ind ? 4 : 1 };
      case 'D': return { pb: 0x8B | rr | ind, extra: [], cyc: ind ? 7 : 4 };
      case 'ext': return { pb: 0x9F, extra: [(o.off >> 8) & 255, o.off & 255], cyc: 5 };
      case 'off': {
        const v = o.off;
        if (!o.force && o.offKnown && v === 0) return { pb: 0x84 | rr | ind, extra: [], cyc: ind ? 3 : 0 }; // 0,X is ,X (as DREAM does)
        if (o.force !== '>' && o.offKnown && !ind && o.force !== '<' && v >= -16 && v <= 15) return { pb: rr | (v & 31), extra: [], cyc: 1 };
        if (o.force === '<' || (o.force !== '>' && o.offKnown && v >= -128 && v <= 127)) {
          if (v < -128 || v > 255) return { err: E('ההזזה ' + B(v) + ' לא נכנסת בבית אחד.', 'The offset ' + B(v) + ' does not fit in one byte.') };
          return { pb: 0x88 | rr | ind, extra: [v & 255], cyc: ind ? 4 : 1 };
        }
        return { pb: 0x89 | rr | ind, extra: [(v >> 8) & 255, v & 255], cyc: ind ? 7 : 4 };
      }
      case 'pcr': case 'pc': {
        // ,PCR: the number is a place, the offset is counted from the end of the command; ,PC: the number is the offset itself
        let size = o.force === '<' ? 1 : o.force === '>' ? 2 : 0;
        if (!size) {
          if (!o.offKnown) size = 2;
          else { const d8 = o.kind === 'pcr' ? o.off - (nextAddr + 1) : o.off; size = d8 >= -128 && d8 <= 127 ? 1 : 2; }
        }
        const d = o.kind === 'pcr' ? o.off - (nextAddr + size) : o.off;
        if (size === 1) {
          if (o.offKnown && (d < -128 || d > 127)) return { err: E('המקום רחוק מדי להזזה של בית אחד.', 'The place is too far for a one-byte offset.') };
          return { pb: 0x8C | ind, extra: [d & 255], cyc: ind ? 4 : 1 };
        }
        return { pb: 0x8D | ind, extra: [(d >> 8) & 255, d & 255], cyc: ind ? 8 : 5 };
      }
    }
    return { err: E('אני לא מבין את ' + B(o.text) + '.', 'I don\'t understand ' + B(o.text) + '.') };
  }

  /* parse an indexed operand: ',X' 'n,Y+' '[,X++]' 'A,U' '[$1234]' 'LOOP,PCR' ... -> o or {err} or null (not indexed) */
  function idxParse(t, sym, here, pass) {
    let ind = false, s = t;
    if (s[0] === '[') { if (s[s.length - 1] !== ']') return { err: E('חסר ' + B(']') + ' בסוף.', 'A ' + B(']') + ' is missing at the end.') }; ind = true; s = s.slice(1, -1).trim(); }
    if (!ind && !s.includes(',')) return null;
    const o = { ind, text: t };
    if (!s.includes(',')) { // [address]
      const e = expr(s.replace(/^[<>]/, ''), sym, here, pass); if (e.err) return e;
      o.kind = 'ext'; o.off = e.v & 0xFFFF; o.fwd = e.fwd; return o;
    }
    const k = s.lastIndexOf(',');
    let left = s.slice(0, k).trim(), right = s.slice(k + 1).trim().toUpperCase();
    let m;
    if ((m = /^(-{1,2})([XYUS])$/.exec(right))) { if (left) return { err: E('לפני ' + B(',' + right) + ' לא כותבים כלום.', 'Nothing goes before ' + B(',' + right) + '.') }; o.reg = m[2]; o.kind = m[1].length === 1 ? 'dec1' : 'dec2'; return o; }
    if ((m = /^([XYUS])(\+{1,2})$/.exec(right))) { if (left) return { err: E('לפני ' + B(',' + right) + ' לא כותבים כלום.', 'Nothing goes before ' + B(',' + right) + '.') }; o.reg = m[1]; o.kind = m[2].length === 1 ? 'inc1' : 'inc2'; return o; }
    if (right === 'PCR' || right === 'PC') {
      o.reg = 'PC'; o.kind = 'pcr';   // n,PC is the same as n,PCR: the place n, counted from the end of the command (DREAM does this, checked 11.11)
      if (/^[<>]/.test(left)) { o.force = left[0]; left = left.slice(1); }
      const e = expr(left || '0', sym, here, pass); if (e.err) return e; o.off = e.v; o.offKnown = e.known; o.fwd = e.fwd; return o;
    }
    if (!/^[XYUS]$/.test(right)) return { err: E('אחרי הפסיק בא שם של אצבע: ' + B('X') + ', ' + B('Y') + ', ' + B('U') + ' או ' + B('S') + ' (או ' + B('PCR') + ').', 'After the comma comes a finger: ' + B('X') + ', ' + B('Y') + ', ' + B('U') + ' or ' + B('S') + ' (or ' + B('PCR') + ').') };
    o.reg = right;
    const L = left.toUpperCase();
    if (!left) { o.kind = 'zero'; return o; }
    if (L === 'A' || L === 'B' || L === 'D') { o.kind = L; return o; }
    if (/^[<>]/.test(left)) { o.force = left[0]; left = left.slice(1); }
    const e = expr(left, sym, here, pass); if (e.err) return e;
    o.kind = 'off'; o.off = e.v; o.offKnown = e.known; o.fwd = e.fwd;
    if (o.offKnown && (o.off < -32768 || o.off > 65535)) return { err: E('ההזזה גדולה מדי.', 'The offset is too big.') };
    if (o.off > 32767) o.off -= 65536;
    return o;
  }

  /* ---------------- the assembler ---------------- */
  function assemble(src, opt = {}) {
    const lines = String(src).replace(/\r/g, '').split('\n');
    const org0 = opt.org != null ? opt.org : ORG0;
    let sym = {}, out, errs;
    // passes: the first does not know names defined further down (it takes the long form); the next ones use the places
    // found by the pass before, until nothing moves. Like DREAM: a later name in an offset (5,X / LOOP,PCR) gets the shortest
    // form that fits; a later name as a plain address stays extended (3 bytes), even if it is below $0100.
    let prev = null;
    for (let iter = 0; iter < 10; iter++) {
      const pass = iter === 0 ? 1 : 2;
      out = []; errs = [];
      let pc = org0, dp = 0, entry = null, ended = false;
      const err = (n, m) => errs.push({ line: n + 1, he: m.he, en: m.en });
      for (let n = 0; n < lines.length; n++) {
        const raw = lines[n].replace(/\t/g, ' ');
        const L = { n: n + 1, text: lines[n], addr: pc, bytes: [], cyc: '' };
        out.push(L);
        if (ended || !raw.trim() || /^\s*[*;]/.test(raw)) continue;
        let label = null, rest = raw;
        if (raw[0] !== ' ') {
          const m = /^(\S+)\s*(.*)$/.exec(raw); label = m[1].replace(/:$/, '').toUpperCase(); rest = m[2];
          const next = (rest.split(/\s+/)[0] || '').toUpperCase();
          if ((isOp(label) || DIRS.includes(label)) && !(isOp(next) || DIRS.includes(next))) {
            err(n, E('השורה מתחילה בלי רווח, אז ' + B(label) + ' נקרא כאן <b>שם של מקום</b>, ולא פקודה. הוסף רווח בתחילת השורה.', 'The line starts without a space, so ' + B(label) + ' is read as a <b>place name</b>, not a command. Add a space at the start of the line.'));
            continue;
          }
          if (!/^[A-Z_.@][A-Z0-9_.@$]*$/.test(label)) { err(n, E('השם ' + B(label) + ' לא מתאים. שם של מקום: אות, ואחריה אותיות או ספרות, צמוד לתחילת השורה.', 'The name ' + B(label) + ' won\'t do. A place name is a letter followed by letters or digits, at the very start of the line.')); continue; }
          if (RESERVED.has(label)) { err(n, E('השם ' + B(label) + ' תפוס: זה שם של מגירה או אצבע. בחר שם אחר.', 'The name ' + B(label) + ' is taken: it is the name of a drawer or finger. Choose another name.')); continue; }
          if (label.length > 8) { /* DREAM kept 6; we allow longer and say nothing */ }
        }
        rest = rest.trim();
        const m = /^(\S+)\s*(.*)$/.exec(rest);
        const op = m ? m[1].toUpperCase() : '';
        let arg = m ? m[2] : '';
        // the label's value: EQU sets it, everything else = here
        const define = (v, known = true) => {
          if (!label) return;
          if (pass === 1) {
            if (sym[label]) { err(n, E('השם ' + B(label) + ' מופיע פעמיים. לכל מקום צריך שם משלו.', 'The name ' + B(label) + ' appears twice. Each place needs its own name.')); return; }
            sym[label] = { v, line: n, known };
          } else if (sym[label] && sym[label].line === n) { sym[label].v = v; sym[label].known = true; }
        };
        sym.__line = n;
        if (!op) { define(pc); continue; }
        if (op === 'EQU' || op === 'SET') {
          if (!label) { err(n, E(B('EQU') + ' צריך שם בתחילת השורה, למשל ' + B('SCREEN EQU $0400') + '.', B('EQU') + ' needs a name at the start of the line, for example ' + B('SCREEN EQU $0400') + '.')); continue; }
          const e = expr(operandOf(arg), sym, pc, pass);
          if (e.err) { err(n, e.err); define(0); continue; }
          if (!e.known) { define(0, false); L.addr = null; continue; }
          define(e.v & 0xFFFF); L.equ = e.v & 0xFFFF; L.addr = null; continue;
        }
        if (op === 'ORG') {
          const e = expr(operandOf(arg), sym, pc, pass);
          if (e.err || !e.known || e.fwd) { err(n, e.err || E(B('ORG') + ' צריך מספר, או שם שכבר הוגדר למעלה.', B('ORG') + ' needs a number, or a name defined above it.')); define(pc); continue; }
          pc = e.v & 0xFFFF; L.addr = pc; L.org = true; define(pc); continue;
        }
        define(pc);
        if (op === 'SETDP') { const e = expr(operandOf(arg), sym, pc, pass); if (e.err) { err(n, e.err); continue; } dp = e.v & 255; continue; }
        if (op === 'END') { const a = operandOf(arg); if (a) { const e = expr(a, sym, pc, pass); if (e.err) err(n, e.err); else entry = e.v & 0xFFFF; } ended = true; continue; }
        if (['NAM', 'TTL', 'OPT', 'PAGE', 'SPC'].includes(op)) continue;
        if (op === 'RMB') {
          const e = expr(operandOf(arg), sym, pc, pass);
          if (e.err || !e.known || e.fwd || e.v < 0) { err(n, e.err || E(B('RMB') + ' צריך מספר שכבר ידוע: כמה בתים לשמור.', B('RMB') + ' needs a known number: how many bytes to keep.')); continue; }
          L.rmb = e.v; pc = (pc + e.v) & 0xFFFF; continue;
        }
        if (op === 'FCB' || op === 'FDB') {
          const a = operandOf(arg);
          if (!a) { err(n, E('אחרי ' + B(op) + ' כותבים מספרים, למשל ' + B(op + ' 1,2,3') + '.', 'After ' + B(op) + ' come numbers, for example ' + B(op + ' 1,2,3') + '.')); continue; }
          const parts = a.split(','), w = op === 'FDB';
          for (const p of parts) {
            const e = expr(p, sym, pc, pass);
            if (e.err) { err(n, e.err); break; }
            if (!w && (e.v < -128 || e.v > 255)) { err(n, E('במשבצת אחת נכנס רק מספר בין 0 ל-255 (כאן ' + e.v + '). למספר גדול יותר: ' + B('FDB') + '.', 'One byte holds only 0 to 255 (here ' + e.v + '). For a bigger number: ' + B('FDB') + '.')); break; }
            if (w) L.bytes.push((e.v >> 8) & 255, e.v & 255); else L.bytes.push(e.v & 255);
          }
          pc = (pc + L.bytes.length) & 0xFFFF; continue;
        }
        if (op === 'FCC') {
          const s = arg.trimStart(); const d = s[0]; const j = s.indexOf(d, 1);
          if (!d || j < 0) { err(n, E('ב-' + B('FCC') + ' כותבים טקסט בין שני סימנים זהים, למשל ' + B('FCC /HELLO/') + '.', 'With ' + B('FCC') + ' the text goes between two equal marks, for example ' + B('FCC /HELLO/') + '.')); continue; }
          for (const ch of s.slice(1, j)) L.bytes.push(ch.charCodeAt(0) & 255);
          pc = (pc + L.bytes.length) & 0xFFFF; continue;
        }
        const ops = opOf(op);
        if (!ops) {
          err(n, E('אני לא מכיר את הפקודה ' + B(op) + '. אולי טעות הקלדה? (אם זה שם של מקום, הוא צריך להיות צמוד לתחילת השורה.)', 'I don\'t know the command ' + B(op) + '. A typo? (If it is a place name, it must be at the very start of the line.)'));
          continue;
        }
        const name = ALIAS[op] || op;
        L.op = name;
        let mode = null, o = null, bytes = [], cyc = 0, cycNote = '';
        const a = ops.inh ? '' : operandOf(arg);
        const fail = msg => { err(n, msg); };
        if (ops.inh) { mode = 'inh'; bytes = code(ops.inh[0]); cyc = ops.inh[1]; if (name === 'RTI') cycNote = '6/15'; if (name === 'SYNC') cycNote = '≥4'; }
        else if (!a) { fail(E('אחרי ' + B(op) + ' חסר משהו: ' + (ops.rel || ops.lrel ? 'שם של מקום.' : ops.stk ? 'שמות של מגירות, למשל ' + B(op + ' A,B') + '.' : ops.reg ? 'שתי מגירות, למשל ' + B(op + ' A,B') + '.' : 'מספר או מקום.'), 'Something is missing after ' + B(op) + ': ' + (ops.rel || ops.lrel ? 'a place name.' : ops.stk ? 'drawer names, for example ' + B(op + ' A,B') + '.' : ops.reg ? 'two drawers, for example ' + B(op + ' A,B') + '.' : 'a number or a place.'))); continue; }
        else if (ops.rel || ops.lrel) {
          const e = expr(a, sym, pc, pass); if (e.err) { fail(e.err); continue; }
          if (ops.rel) {
            mode = 'rel'; bytes = code(ops.rel[0]); const d = e.v - (pc + 2); cyc = ops.rel[1];
            if (pass === 2 && (d < -128 || d > 127)) { fail(E('המקום ' + B(a.toUpperCase()) + ' רחוק מדי: ' + B(name) + ' קופצת רק עד 128 בתים אחורה או 127 קדימה (כאן ' + Math.abs(d) + '). אפשר להשתמש ב-' + B('L' + name) + ', הקפיצה הארוכה.', 'The place ' + B(a.toUpperCase()) + ' is too far: ' + B(name) + ' jumps only up to 128 bytes back or 127 forward (here ' + Math.abs(d) + '). Use ' + B('L' + name) + ', the long jump.')); continue; }
            bytes.push(d & 255);
          } else {
            mode = 'lrel'; bytes = code(ops.lrel[0]); const d = e.v - (pc + bytes.length + 2); cyc = ops.lrel[1];
            if (ops.lrel[2] !== ops.lrel[1]) cycNote = ops.lrel[1] + '(' + ops.lrel[2] + ')';
            bytes.push((d >> 8) & 255, d & 255);
          }
        }
        else if (ops.stk) {
          mode = 'stk'; let pb = 0; const u = name.endsWith('U');
          if (a[0] === '#') { const e = expr(a.slice(1), sym, pc, pass); if (e.err) { fail(e.err); continue; } pb = e.v & 255; }
          else {
            let bad = null;
            for (const r0 of a.split(',')) {
              const r = r0.trim().toUpperCase();
              if (!(r in STK) || (u && r === 'U') || (!u && r === 'S')) { bad = r; break; }
              if (pb & STK[r]) { bad = r; break; }
              pb |= STK[r];
            }
            if (bad != null) { fail(E('אחרי ' + B(name) + ' כותבים מגירות: ' + B('A') + ', ' + B('B') + ', ' + B('D') + ', ' + B('CC') + ', ' + B('DP') + ', ' + B('X') + ', ' + B('Y') + ', ' + B(u ? 'S' : 'U') + ' או ' + B('PC') + ', כל אחת פעם אחת, עם פסיק ביניהן. ' + (bad ? B(bad) + ' לא מתאים כאן.' : ''), 'After ' + B(name) + ' come drawers: ' + B('A') + ', ' + B('B') + ', ' + B('D') + ', ' + B('CC') + ', ' + B('DP') + ', ' + B('X') + ', ' + B('Y') + ', ' + B(u ? 'S' : 'U') + ' or ' + B('PC') + ', each once, with commas between. ' + (bad ? B(bad) + ' doesn\'t fit here.' : ''))); continue; }
          }
          bytes = code(ops.stk[0]); bytes.push(pb); cyc = ops.stk[1] + stkBytes(pb);
        }
        else if (ops.reg) {
          const rs = a.toUpperCase().split(',').map(x => x.trim());
          const r1 = rs[0] in REG16 ? REG16[rs[0]] : REG8[rs[0]], r2 = rs[1] in REG16 ? REG16[rs[1]] : REG8[rs[1]];
          if (rs.length !== 2 || r1 == null || r2 == null) { fail(E('אחרי ' + B(name) + ' כותבים שתי מגירות עם פסיק, למשל ' + B(name + ' X,Y') + ' או ' + B(name + ' A,B') + '.', 'After ' + B(name) + ' come two drawers with a comma, for example ' + B(name + ' X,Y') + ' or ' + B(name + ' A,B') + '.')); continue; }
          if ((r1 & 8) !== (r2 & 8)) { fail(E(B(rs[0]) + ' ו-' + B(rs[1]) + ' בגדלים שונים: מגירה של בית אחד ומגירה של שני בתים. ' + B(name) + ' עובדת רק בין שתיים באותו גודל.', B(rs[0]) + ' and ' + B(rs[1]) + ' are different sizes: a one-byte drawer and a two-byte drawer. ' + B(name) + ' works only between two of the same size.')); continue; }
          mode = 'reg'; bytes = code(ops.reg[0]); bytes.push((r1 << 4) | r2); cyc = ops.reg[1];
        }
        else if (a[0] === '#') {
          if (!ops.imm) { fail(E(name.startsWith('ST') ? 'ל-' + B(name) + ' לא שמים ' + B('#') + ': היא תמיד כותבת לבית בזיכרון.' : B(name) + ' לא עובדת עם ' + B('#') + '.', name.startsWith('ST') ? B(name) + ' takes no ' + B('#') + ': it always writes to a place in memory.' : B(name) + ' does not work with ' + B('#') + '.')); continue; }
          const e = expr(a.slice(1), sym, pc, pass); if (e.err) { fail(e.err); continue; }
          mode = 'imm'; bytes = code(ops.imm[0]); cyc = ops.imm[1]; if (name === 'CWAI') cycNote = '≥20';
          if (ops.imm[2] === 2) { if (e.v < -32768 || e.v > 65535) { fail(E('המספר ' + B(a.slice(1)) + ' גדול מדי גם למגירה של שני בתים (עד 65535).', 'The number ' + B(a.slice(1)) + ' is too big even for a two-byte drawer (up to 65535).')); continue; } bytes.push((e.v >> 8) & 255, e.v & 255); }
          else { if (e.v < -128 || e.v > 255) { fail(E('המספר ' + B(a.slice(1)) + ' (' + e.v + ') גדול מדי למגירה של בית אחד: נכנס רק 0 עד 255.', 'The number ' + B(a.slice(1)) + ' (' + e.v + ') is too big for a one-byte drawer: only 0 to 255 fit.')); continue; } bytes.push(e.v & 255); }
        }
        else if (/^(A|B)$/i.test(a) && ops.dir && opOf(name + a.toUpperCase())) {
          fail(E('כדי לעבוד על המגירה ' + a.toUpperCase() + ' כותבים את השם צמוד: ' + B(name + a.toUpperCase()) + ', בלי רווח.', 'To work on drawer ' + a.toUpperCase() + ' write it joined: ' + B(name + a.toUpperCase()) + ', with no space.')); continue;
        }
        else if ((o = idxParse(a, sym, pc, pass))) {
          if (o.err) { fail(o.err); continue; }
          if (!ops.idx) { fail(E(B(name) + ' לא עובדת עם אצבע (' + B(a) + ').', B(name) + ' does not work with a finger (' + B(a) + ').')); continue; }
          mode = 'idx'; bytes = code(ops.idx[0]);
          const r = idxEncode(o, pc + bytes.length + 1);
          if (r.err) { fail(r.err); continue; }
          bytes.push(r.pb, ...r.extra); cyc = ops.idx[1] + r.cyc;
          if (name.startsWith('LEA') || name === 'JSR' || name === 'JMP') L.ea = true;
        }
        else {
          let s = a, force = null;
          if (s[0] === '<' || s[0] === '>') { force = s[0]; s = s.slice(1); }
          const e = expr(s, sym, pc, pass); if (e.err) { fail(e.err); continue; }
          if (e.v < -32768 || e.v > 0xFFFF) { fail(E('מספר הבית ' + B(s) + ' גדול מדי: הבתים הם 0 עד 65535 (' + B('$FFFF') + ').', 'The place number ' + B(s) + ' is too big: places are 0 to 65535 (' + B('$FFFF') + ').')); continue; }
          const v = e.v & 0xFFFF;
          let useDir = force === '<' || (force !== '>' && e.known && !e.fwd && (v >> 8) === dp && !!ops.dir);
          if (useDir && !ops.dir) { fail(E(B(name) + ' לא עובדת בצורה הקצרה (' + B('<') + ').', B(name) + ' has no short form (' + B('<') + ').')); continue; }
          if (!useDir && !ops.ext) { fail(E(B(name) + ' צריכה כאן משהו אחר. למשל ' + B(name + ' 1,X') + '.', B(name) + ' needs something else here. For example ' + B(name + ' 1,X') + '.')); continue; }
          if (useDir && force === '<' && e.known && (v >> 8) !== dp && pass === 2) { fail(E('הבית ' + B(H4(v)) + ' לא בדף ' + B(H2(dp)) + ', אז אין לו צורה קצרה.', 'Place ' + B(H4(v)) + ' is not on page ' + B(H2(dp)) + ', so it has no short form.')); continue; }
          if (useDir) { mode = 'dir'; bytes = code(ops.dir[0]); bytes.push(v & 255); cyc = ops.dir[1]; }
          else { mode = 'ext'; bytes = code(ops.ext[0]); bytes.push(v >> 8, v & 255); cyc = ops.ext[1]; }
        }
        L.mode = mode; L.bytes = bytes; L.cyc = cycNote || String(cyc); L.cycN = cyc;
        pc = (pc + bytes.length) & 0xFFFF;
      }
      out.entry = entry;
      const now = JSON.stringify(Object.keys(sym).filter(k => k !== '__line').map(k => [k, sym[k].v]));
      if (pass === 2 && now === prev) break;
      prev = now;
    }
    delete sym.__line;
    // memory picture
    const mem = new Uint8Array(65536), used = new Uint8Array(65536);
    let start = null, end = null;
    for (const L of out) {
      if (L.addr == null) continue;
      L.bytes.forEach((b, k) => { const a = (L.addr + k) & 0xFFFF; mem[a] = b; used[a] = 1; });
      const len = L.bytes.length + (L.rmb || 0);
      if (len) { if (start == null || L.addr < start) start = L.addr; if (end == null || L.addr + len > end) end = L.addr + len; }
    }
    if (start == null) start = end = org0;
    const labels = {}; for (const k in sym) labels[k] = sym[k].v;
    const entryAddr = labels['@'] != null ? labels['@'] : out.entry != null ? out.entry : start;
    let count = 0; for (const L of out) count += L.bytes.length;
    return { ok: !errs.length, errs, lines: out, mem, used, start, end, entry: entryAddr, labels, count };
  }
  const code = c => c > 0xFF ? [c >> 8, c & 255] : [c];
  const stkBytes = pb => { let n = 0; for (const [bit, w] of [[1, 1], [2, 1], [4, 1], [8, 1], [0x10, 2], [0x20, 2], [0x40, 2], [0x80, 2]]) if (pb & bit) n += w; return n; };

  /* ---------------- the CPU ----------------
     A full 6809. Memory and the outside world come through hooks: read(a), write(a,v), and onPC(pc) (called before each command;
     it can return 'stop' to stop). Cycles from the datasheet, as in the listing (+1 when a long conditional branch is taken). */
  class Stop extends Error { constructor(kind, he, en, extra) { super(en); this.kind = kind; this.he = he; this.en = en; Object.assign(this, extra || {}); } }
  function cpu(read, write) {
    const r = { A: 0, B: 0, X: 0, Y: 0, U: 0, S: 0, PC: 0, DP: 0, CC: 0, cyc: 0, steps: 0 };
    const rd16 = a => (read(a & 0xFFFF) << 8) | read((a + 1) & 0xFFFF);
    const wr16 = (a, v) => { write(a & 0xFFFF, (v >> 8) & 255); write((a + 1) & 0xFFFF, v & 255); };
    const fetch = () => { const v = read(r.PC); r.PC = (r.PC + 1) & 0xFFFF; return v; };
    const fetch16 = () => { const v = rd16(r.PC); r.PC = (r.PC + 2) & 0xFFFF; return v; };
    const getD = () => (r.A << 8) | r.B, setD = v => { r.A = (v >> 8) & 255; r.B = v & 255; };
    const F = { C: 1, V: 2, Z: 4, N: 8, I: 16, H: 32, F: 64, E: 128 };
    const set = (f, on) => { if (on) r.CC |= f; else r.CC &= ~f; };
    const nz8 = v => { set(F.N, v & 0x80); set(F.Z, !(v & 255)); };
    const nz16 = v => { set(F.N, v & 0x8000); set(F.Z, !(v & 0xFFFF)); };
    const s8 = v => v & 0x80 ? v - 256 : v, s16 = v => v & 0x8000 ? v - 65536 : v;
    const regGet = c => { switch (c) { case 0: return getD(); case 1: return r.X; case 2: return r.Y; case 3: return r.U; case 4: return r.S; case 5: return r.PC; case 8: return r.A; case 9: return r.B; case 10: return r.CC; case 11: return r.DP; } return 0xFF; };
    const regSet = (c, v) => { switch (c) { case 0: setD(v & 0xFFFF); break; case 1: r.X = v & 0xFFFF; break; case 2: r.Y = v & 0xFFFF; break; case 3: r.U = v & 0xFFFF; break; case 4: r.S = v & 0xFFFF; break; case 5: r.PC = v & 0xFFFF; break; case 8: r.A = v & 255; break; case 9: r.B = v & 255; break; case 10: r.CC = v & 255; break; case 11: r.DP = v & 255; break; } };
    const IR = ['X', 'Y', 'U', 'S'];
    // effective address of an indexed operand; returns [ea, extraCycles]
    function idxEA() {
      const pb = fetch(), R = IR[(pb >> 5) & 3];
      if (!(pb & 0x80)) { const o = pb & 0x10 ? (pb & 31) - 32 : pb & 31; return [(r[R] + o) & 0xFFFF, 1]; }
      let ea, x;
      switch (pb & 0x0F) {
        case 0x0: ea = r[R]; r[R] = (r[R] + 1) & 0xFFFF; x = 2; break;
        case 0x1: ea = r[R]; r[R] = (r[R] + 2) & 0xFFFF; x = 3; break;
        case 0x2: r[R] = (r[R] - 1) & 0xFFFF; ea = r[R]; x = 2; break;
        case 0x3: r[R] = (r[R] - 2) & 0xFFFF; ea = r[R]; x = 3; break;
        case 0x4: ea = r[R]; x = 0; break;
        case 0x5: ea = (r[R] + s8(r.B)) & 0xFFFF; x = 1; break;
        case 0x6: ea = (r[R] + s8(r.A)) & 0xFFFF; x = 1; break;
        case 0x8: { const o = s8(fetch()); ea = (r[R] + o) & 0xFFFF; x = 1; break; }
        case 0x9: { const o = s16(fetch16()); ea = (r[R] + o) & 0xFFFF; x = 4; break; }
        case 0xB: ea = (r[R] + s16(getD())) & 0xFFFF; x = 4; break;
        case 0xC: { const o = s8(fetch()); ea = (r.PC + o) & 0xFFFF; x = 1; break; }
        case 0xD: { const o = s16(fetch16()); ea = (r.PC + o) & 0xFFFF; x = 5; break; }
        case 0xF: if (pb === 0x9F) { ea = fetch16(); x = 2; break; } /* falls through */
        default: throw new Stop('bad', 'בבית ' + B(H4(r.PC - 1)) + ' יש בית אצבע ' + B(H2(pb)) + ' שהמעבד לא מכיר.', 'At ' + B(H4(r.PC - 1)) + ' there is an index byte ' + B(H2(pb)) + ' the processor doesn\'t know.');
      }
      if (pb & 0x10) { if ([0, 2].includes(pb & 0x0F)) throw new Stop('bad', 'בית אצבע ' + B(H2(pb)) + ' לא קיים.', 'Index byte ' + B(H2(pb)) + ' does not exist.'); ea = rd16(ea); x += 3; }
      return [ea, x];
    }
    // one command. Returns info {pc, op, mode, ea, cyc}
    function step() {
      const pc0 = r.PC;
      let c = fetch(); if (c === 0x10 || c === 0x11) c = (c << 8) | fetch();
      const d = DEC[c];
      if (!d) throw new Stop('bad', 'בבית ' + B(H4(pc0)) + ' יש ' + B(c > 255 ? H4(c) : H2(c)) + ', וזו לא פקודה של המעבד 6809. אולי התוכנית קפצה לתוך מספרים (נתונים) ולא לתוך פקודות?', 'At ' + B(H4(pc0)) + ' there is ' + B(c > 255 ? H4(c) : H2(c)) + ', and that is not a 6809 command. Did the program jump into data instead of commands?', { pc: pc0 });
      let cyc = d.cyc, ea = null, x = 0;
      const op = d.op, mode = d.mode;
      if (mode === 'dir') ea = (r.DP << 8) | fetch();
      else if (mode === 'ext') ea = fetch16();
      else if (mode === 'idx') { [ea, x] = idxEA(); cyc += x; }
      const imm8 = () => fetch(), imm16 = () => fetch16();
      const m8 = () => mode === 'imm' ? imm8() : read(ea);
      const m16 = () => mode === 'imm' ? imm16() : rd16(ea);
      const push = (sp, v, w) => { if (w === 2) { r[sp] = (r[sp] - 1) & 0xFFFF; write(r[sp], v & 255); r[sp] = (r[sp] - 1) & 0xFFFF; write(r[sp], (v >> 8) & 255); } else { r[sp] = (r[sp] - 1) & 0xFFFF; write(r[sp], v & 255); } };
      const pull = (sp, w) => { let v = read(r[sp]); r[sp] = (r[sp] + 1) & 0xFFFF; if (w === 2) { v = (v << 8) | read(r[sp]); r[sp] = (r[sp] + 1) & 0xFFFF; } return v; };
      const cc = f => !!(r.CC & f);
      const R8 = op.slice(-1) === 'A' ? 'A' : 'B';
      const base = op.length === 4 && /[AB]$/.test(op) && !['BITA', 'BITB'].includes(op) ? op.slice(0, 3) : op.length === 3 && /^(LD|ST|OR)[AB]$/.test(op) ? op.slice(0, 2) : op;
      const add8 = (a, b, cin) => { const s = a + b + cin; set(F.H, ((a & 15) + (b & 15) + cin) & 16); set(F.V, (~(a ^ b) & (a ^ s)) & 0x80); set(F.C, s & 0x100); nz8(s); return s & 255; };
      const sub8 = (a, b, cin) => { const s = a - b - cin; set(F.V, ((a ^ b) & (a ^ s)) & 0x80); set(F.C, s & 0x100); nz8(s); return s & 255; };
      const sub16 = (a, b) => { const s = a - b; set(F.V, ((a ^ b) & (a ^ s)) & 0x8000); set(F.C, s & 0x10000); nz16(s); return s & 0xFFFF; };
      // memory/accumulator commands (NEG ... CLR) on A, B or memory
      const rmw = (name, v) => {
        let res;
        switch (name) {
          case 'NEG': res = (-v) & 255; set(F.V, v === 0x80); set(F.C, v !== 0); nz8(res); break;
          case 'COM': res = (~v) & 255; set(F.V, 0); set(F.C, 1); nz8(res); break;
          case 'LSR': res = v >> 1; set(F.C, v & 1); nz8(res); break;
          case 'ROR': res = (v >> 1) | (cc(F.C) ? 0x80 : 0); set(F.C, v & 1); nz8(res); break;
          case 'ASR': res = (v >> 1) | (v & 0x80); set(F.C, v & 1); nz8(res); break;
          case 'ASL': res = (v << 1) & 255; set(F.C, v & 0x80); set(F.V, (v ^ (v << 1)) & 0x80); nz8(res); break;
          case 'ROL': res = ((v << 1) | (cc(F.C) ? 1 : 0)) & 255; set(F.C, v & 0x80); set(F.V, (v ^ (v << 1)) & 0x80); nz8(res); break;
          case 'DEC': res = (v - 1) & 255; set(F.V, v === 0x80); nz8(res); break;
          case 'INC': res = (v + 1) & 255; set(F.V, v === 0x7F); nz8(res); break;
          case 'TST': res = v; set(F.V, 0); nz8(v); return null;
          case 'CLR': res = 0; r.CC &= ~(F.N | F.V | F.C); r.CC |= F.Z; break;
        }
        return res;
      };
      const RMW = ['NEG', 'COM', 'LSR', 'ROR', 'ASR', 'ASL', 'ROL', 'DEC', 'INC', 'TST', 'CLR'];
      const info = { pc: pc0, op, mode, ea, code: c };
      const branch = (n) => {
        const N = cc(F.N), Z = cc(F.Z), V = cc(F.V), C = cc(F.C);
        switch (n.replace(/^L/, '')) {
          case 'BRA': return true; case 'BRN': return false; case 'BHI': return !C && !Z; case 'BLS': return C || Z;
          case 'BHS': return !C; case 'BLO': return C; case 'BNE': return !Z; case 'BEQ': return Z; case 'BVC': return !V; case 'BVS': return V;
          case 'BPL': return !N; case 'BMI': return N; case 'BGE': return N === V; case 'BLT': return N !== V; case 'BGT': return !Z && N === V; case 'BLE': return Z || N !== V;
        }
        return false;
      };
      if (mode === 'rel' || mode === 'lrel') {
        const o = mode === 'rel' ? s8(fetch()) : s16(fetch16());
        const t = (r.PC + o) & 0xFFFF; info.target = t;
        if (op === 'BSR' || op === 'LBSR') { push('S', r.PC, 2); r.PC = t; }
        else { const take = branch(op); info.taken = take; if (take) { r.PC = t; if (mode === 'lrel' && d.taken !== d.cyc) cyc = d.taken; } }
      }
      else if (mode === 'inh' && RMW.includes(op.slice(0, -1)) && /[AB]$/.test(op)) {
        const v = rmw(op.slice(0, -1), r[R8]); if (v != null) r[R8] = v;
      }
      else if (RMW.includes(op)) { const v = rmw(op, read(ea)); if (v != null) write(ea, v); }
      else switch (op) {
        case 'JMP': r.PC = ea; break;
        case 'JSR': push('S', r.PC, 2); r.PC = ea; break;
        case 'RTS': r.PC = pull('S', 2); break;
        case 'NOP': break;
        case 'SYNC': case 'CWAI': case 'SWI': case 'SWI2': case 'SWI3': case 'RTI':
          r.PC = pc0; throw new Stop('irq', 'הפקודה ' + B(op) + ' עובדת עם פסיקות (interrupts) של המחשב.', 'The command ' + B(op) + ' works with the computer\'s interrupts.', { pc: pc0, machine: true });
        case 'DAA': {
          const a = r.A, lo = a & 15, hi = a >> 4; let cf = 0;
          if (lo > 9 || cc(F.H)) cf |= 0x06;
          if (hi > 9 || cc(F.C) || (hi > 8 && lo > 9)) cf |= 0x60;
          const s = a + cf; r.A = s & 255; set(F.C, cc(F.C) || (s & 0x100)); nz8(r.A); set(F.V, !!(r.A & 0x80) !== cc(F.C)); break; // V = N xor C, as XRoar's 6809 does (the datasheet: undefined)
        }
        case 'SEX': r.A = r.B & 0x80 ? 0xFF : 0; nz16(getD()); break;
        case 'ABX': r.X = (r.X + r.B) & 0xFFFF; break;
        case 'MUL': { const p = r.A * r.B; setD(p); set(F.Z, !p); set(F.C, p & 0x80); break; }
        case 'ORCC': r.CC |= imm8(); break;
        case 'ANDCC': r.CC &= imm8(); break;
        case 'EXG': case 'TFR': {
          const pb = fetch(), s = pb >> 4, t = pb & 15;
          const w = q => q < 8;
          let vs = regGet(s), vt = regGet(t);
          const conv = (v, from, to) => w(from) === w(to) ? v : w(to) ? (0xFF00 | (v & 255)) : v & 255;
          if (op === 'TFR') regSet(t, conv(vs, s, t)); else { regSet(t, conv(vs, s, t)); regSet(s, conv(vt, t, s)); }
          break;
        }
        case 'LEAX': r.X = ea; set(F.Z, !ea); break;
        case 'LEAY': r.Y = ea; set(F.Z, !ea); break;
        case 'LEAS': r.S = ea; break;
        case 'LEAU': r.U = ea; break;
        case 'PSHS': case 'PSHU': {
          const sp = op[3] === 'S' ? 'S' : 'U', other = sp === 'S' ? 'U' : 'S', pb = fetch(); cyc += stkBytes(pb);
          if (pb & 0x80) push(sp, r.PC, 2); if (pb & 0x40) push(sp, r[other], 2); if (pb & 0x20) push(sp, r.Y, 2); if (pb & 0x10) push(sp, r.X, 2);
          if (pb & 8) push(sp, r.DP, 1); if (pb & 4) push(sp, r.B, 1); if (pb & 2) push(sp, r.A, 1); if (pb & 1) push(sp, r.CC, 1);
          break;
        }
        case 'PULS': case 'PULU': {
          const sp = op[3] === 'S' ? 'S' : 'U', other = sp === 'S' ? 'U' : 'S', pb = fetch(); cyc += stkBytes(pb);
          if (pb & 1) r.CC = pull(sp, 1); if (pb & 2) r.A = pull(sp, 1); if (pb & 4) r.B = pull(sp, 1); if (pb & 8) r.DP = pull(sp, 1);
          if (pb & 0x10) r.X = pull(sp, 2); if (pb & 0x20) r.Y = pull(sp, 2); if (pb & 0x40) r[other] = pull(sp, 2); if (pb & 0x80) r.PC = pull(sp, 2);
          break;
        }
        // 16 bits
        case 'LDD': { const v = m16(); setD(v); nz16(v); set(F.V, 0); break; }
        case 'LDX': case 'LDY': case 'LDU': case 'LDS': { const v = m16(); r[op[2]] = v; nz16(v); set(F.V, 0); break; }
        case 'STD': { const v = getD(); wr16(ea, v); nz16(v); set(F.V, 0); break; }
        case 'STX': case 'STY': case 'STU': case 'STS': { const v = r[op[2]]; wr16(ea, v); nz16(v); set(F.V, 0); break; }
        case 'ADDD': { const a = getD(), b = m16(), s = a + b; set(F.V, (~(a ^ b) & (a ^ s)) & 0x8000); set(F.C, s & 0x10000); nz16(s); setD(s & 0xFFFF); break; }
        case 'SUBD': setD(sub16(getD(), m16())); break;
        case 'CMPD': sub16(getD(), m16()); break;
        case 'CMPX': case 'CMPY': case 'CMPU': case 'CMPS': sub16(r[op[3]], m16()); break;
        default: {
          // 8-bit accumulator commands
          const R = R8;
          switch (base) {
            case 'LD': r[R] = m8(); nz8(r[R]); set(F.V, 0); break;
            case 'ST': write(ea, r[R]); nz8(r[R]); set(F.V, 0); break;
            case 'ADD': r[R] = add8(r[R], m8(), 0); break;
            case 'ADC': r[R] = add8(r[R], m8(), cc(F.C) ? 1 : 0); break;
            case 'SUB': r[R] = sub8(r[R], m8(), 0); break;
            case 'SBC': r[R] = sub8(r[R], m8(), cc(F.C) ? 1 : 0); break;
            case 'CMP': sub8(r[R], m8(), 0); break;
            case 'AND': r[R] &= m8(); nz8(r[R]); set(F.V, 0); break;
            case 'OR': r[R] |= m8(); nz8(r[R]); set(F.V, 0); break;
            case 'EOR': r[R] ^= m8(); nz8(r[R]); set(F.V, 0); break;
            case 'BITA': case 'BITB': { const v = r[op[3]] & m8(); nz8(v); set(F.V, 0); break; }
            default: throw new Stop('bad', 'פקודה ' + B(op) + ' בלי ביצוע.', 'Command ' + B(op) + ' has no action.');
          }
        }
      }
      r.cyc += cyc; r.steps++;
      info.cyc = cyc; info.len = (r.PC - pc0) & 0xFFFF;
      return info;
    }
    return { r, step, F };
  }

  /* one line back from bytes (for a jump into the middle of numbers): "LDA #$41" */
  function disasm(read, pc) {
    let a = pc, c = read(a++); if (c === 0x10 || c === 0x11) c = (c << 8) | read(a++);
    const d = DEC[c]; if (!d) return { text: 'FCB ' + H2(c > 255 ? c >> 8 : c), len: 1 };
    let t = d.op;
    if (d.mode === 'imm') { if (d.imm === 2) { t += ' #' + H4((read(a) << 8) | read(a + 1)); a += 2; } else t += ' #' + H2(read(a++)); }
    else if (d.mode === 'dir') t += ' <' + H2(read(a++));
    else if (d.mode === 'ext') { t += ' ' + H4((read(a) << 8) | read(a + 1)); a += 2; }
    else if (d.mode === 'rel') { const o = read(a++); t += ' ' + H4(a + (o & 0x80 ? o - 256 : o)); }
    else if (d.mode === 'lrel') { const o = (read(a) << 8) | read(a + 1); a += 2; t += ' ' + H4(a + (o & 0x8000 ? o - 65536 : o)); }
    else if (d.mode === 'stk' || d.mode === 'reg') { const pb = read(a++); t += d.mode === 'reg' ? ' ' + RNAME[pb >> 4] + ',' + RNAME[pb & 15] : ' #' + H2(pb); }
    else if (d.mode === 'idx') { const pb = read(a++); if ((pb & 0x8F) === 0x88 || (pb & 0x8F) === 0x8C) a++; else if ((pb & 0x8F) === 0x89 || (pb & 0x8F) === 0x8D || pb === 0x9F) a += 2; t += ' (' + H2(pb) + ')'; }
    return { text: t, len: a - pc };
  }

  const API = { assemble, cpu, disasm, Stop, OPS, DEC, ALIAS, ORG0, H2, H4, stkBytes };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  G.ASM6809 = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
