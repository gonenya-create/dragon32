// מנוע הביטויים של ה-BASIC: מפרק שורה למילים ומחשב ביטויים (חשבון, השוואות, AND/OR/NOT, מחרוזות).
// שגיאות נזרקות כקוד קצר ('SN', 'TM', '/0'), והמכונה הופכת אותן ל-?SN ERROR וכו'.

const FUNCS = ['INT', 'RND', 'ABS', 'LEN', 'SIN', 'COS', 'TAN', 'ATN', 'SQR', 'LOG', 'EXP', 'SGN', 'FIX', 'ASC', 'VAL', 'INSTR',
  'CHR$', 'MID$', 'LEFT$', 'RIGHT$', 'STR$', 'STRING$', 'HEX$', 'JOYSTK', 'PPOINT', 'POINT'];
const KW = /^(AND|OR|NOT|TIMER|TAB|USING|FN[A-Z][A-Z0-9]*|INT|RND|ABS|LEN|SIN|COS|TAN|ATN|SQR|LOG|EXP|SGN|FIX|ASC|VAL|INSTR|CHR\$|MID\$|LEFT\$|RIGHT\$|STR\$|STRING\$|HEX\$|JOYSTK|PPOINT|POINT)(?![A-Z0-9$])/;

// ב-Dragon רק שתי האותיות הראשונות של שם משתנה נחשבות: SNAKE ו-SNAP הם אותו משתנה
export function vname(n) { return n === 'INKEY$' ? n : n.replace(/^([A-Z][A-Z0-9]?)[A-Z0-9]*(\$?)$/, '$1$2'); }
// AND/OR/NOT עובדים על ביטים של מספר שלם, כמו במקור (אמת = -1, שקר = 0)
function int16(v) { if (typeof v !== 'number') throw 'TM'; return Math.trunc(v) | 0; }

export function tokenize(src) {
  const t = [];
  let i = 0, m;
  while (i < src.length) {
    const rest = src.slice(i);
    if ((m = /^\s+/.exec(rest))) { i += m[0].length; continue; }
    if ((m = /^"([^"]*)"?/.exec(rest))) { t.push({ k: 'str', v: m[1] }); i += m[0].length; continue; }
    if ((m = /^(\d+\.?\d*|\.\d+)/.exec(rest))) { t.push({ k: 'num', v: parseFloat(m[1]) }); i += m[0].length; continue; }
    if ((m = /^(<>|<=|>=|[-+*/^()=<>;,])/.exec(rest))) { t.push({ k: 'op', v: m[1] }); i += m[0].length; continue; }
    if ((m = KW.exec(rest))) { t.push({ k: 'kw', v: m[1] }); i += m[0].length; continue; }
    if ((m = /^[A-Z][A-Z0-9]*\$?/.exec(rest))) { t.push({ k: 'var', v: m[0] }); i += m[0].length; continue; }
    throw 'SN';
  }
  return t;
}

export class Parser {
  constructor(tokens, vars) { this.t = tokens; this.p = 0; this.vars = vars; }
  peek() { return this.t[this.p]; }
  is(k, v) { const x = this.t[this.p]; return !!x && x.k === k && (v === undefined || x.v === v); }
  take() { return this.t[this.p++]; }
  expect(k, v) { if (!this.is(k, v)) throw 'SN'; return this.take(); }
  done() { return this.p >= this.t.length; }

  expr() { return this.or(); }
  or() {
    let a = this.and();
    while (this.is('kw', 'OR')) { this.take(); const b = this.and(); a = int16(a) | int16(b); }
    return a;
  }
  and() {
    let a = this.not();
    while (this.is('kw', 'AND')) { this.take(); const b = this.not(); a = int16(a) & int16(b); }
    return a;
  }
  not() {
    if (this.is('kw', 'NOT')) { this.take(); return ~int16(this.not()); }
    return this.cmp();
  }
  cmp() {
    const a = this.add(), x = this.peek();
    if (x && x.k === 'op' && /^(=|<>|<|>|<=|>=)$/.test(x.v)) {
      this.take();
      const b = this.add();
      if (typeof a !== typeof b) throw 'TM';
      const r = { '=': a === b, '<>': a !== b, '<': a < b, '>': a > b, '<=': a <= b, '>=': a >= b }[x.v];
      return r ? -1 : 0;
    }
    return a;
  }
  add() {
    let a = this.mul();
    while (this.is('op', '+') || this.is('op', '-')) {
      const op = this.take().v, b = this.mul();
      if (op === '+') {
        if (typeof a !== typeof b) throw 'TM';
        a = a + b;
      } else {
        if (typeof a !== 'number' || typeof b !== 'number') throw 'TM';
        a = a - b;
      }
    }
    return a;
  }
  mul() {
    let a = this.unary();
    while (this.is('op', '*') || this.is('op', '/')) {
      const op = this.take().v, b = this.unary();
      if (typeof a !== 'number' || typeof b !== 'number') throw 'TM';
      if (op === '/' && b === 0) throw '/0';
      a = op === '*' ? a * b : a / b;
    }
    return a;
  }
  // מינוס בא אחרי החזקה, כמו במקור: -2^2 = -4
  unary() {
    if (this.is('op', '-')) { this.take(); const v = this.unary(); if (typeof v !== 'number') throw 'TM'; return -v; }
    if (this.is('op', '+')) { this.take(); return this.unary(); }
    return this.pow();
  }
  pow() {
    let a = this.atom();
    while (this.is('op', '^')) {
      this.take();
      const b = this.is('op', '-') || this.is('op', '+') ? this.unary() : this.atom();
      if (typeof a !== 'number' || typeof b !== 'number') throw 'TM';
      a = Math.pow(a, b);
    }
    return a;
  }
  atom() {
    const x = this.take();
    if (!x) throw 'SN';
    if (x.k === 'num' || x.k === 'str') return x.v;
    if (x.k === 'var') {
      // A(3) או B$(1,2): תא במערך
      if (this.is('op', '(')) {
        this.take();
        const idx = [this.expr()];
        while (this.is('op', ',')) { this.take(); idx.push(this.expr()); }
        this.expect('op', ')');
        const [data, k] = arrayCell(this.vars, x.v, idx);
        return data[k];
      }
      const n = vname(x.v);
      if (n in this.vars) return this.vars[n];
      return /\$$/.test(x.v) ? '' : 0;
    }
    if (x.k === 'op' && x.v === '(') { const v = this.expr(); this.expect('op', ')'); return v; }
    if (x.k === 'kw' && x.v === 'TIMER') return env(this.vars).timer();
    if (x.k === 'kw' && /^FN/.test(x.v)) {
      // DEF FNA(X)=X*2: מציבים את הערך במשתנה של הפונקציה, מחשבים, ומחזירים את המשתנה לקדמותו
      const fn = this.vars['FN:' + x.v.slice(2)];
      if (!fn) throw 'UF';
      this.expect('op', '(');
      const a = this.expr();
      this.expect('op', ')');
      if ((typeof a === 'string') !== /\$$/.test(fn.param)) throw 'TM';
      const key = vname(fn.param), had = Object.prototype.hasOwnProperty.call(this.vars, key), old = this.vars[key];
      if (++fnDepth > 50) { fnDepth = 0; throw 'OM'; }
      this.vars[key] = a;
      try { return evalExpr(fn.body, this.vars); }
      finally { fnDepth--; if (had) this.vars[key] = old; else delete this.vars[key]; }
    }
    if (x.k === 'kw' && FUNCS.includes(x.v)) {
      this.expect('op', '(');
      const a = [this.expr()];
      while (this.is('op', ',')) { this.take(); a.push(this.expr()); }
      this.expect('op', ')');
      return callFunc(x.v, a, this.vars);
    }
    throw 'SN';
  }
}

// מערכים (DIM): נשמרים בתוך vars תחת "A(" כדי שלא יתנגשו במשתנה A הרגיל.
// בלי DIM, מערך נוצר אוטומטית בגודל 10 (אינדקס 0 עד 10), כמו במקור
export function makeArray(name, dims) {
  if (dims.some(d => typeof d !== 'number' || d < 0 || !isFinite(d))) throw 'FC';
  dims = dims.map(Math.floor);
  const n = dims.reduce((s, d) => s * (d + 1), 1);
  if (n > 20000) throw 'OM';
  return { dims, data: new Array(n).fill(/\$$/.test(name) ? '' : 0) };
}
export function arrayCell(vars, name, idx) {
  const key = vname(name) + '(';
  if (!vars[key]) vars[key] = makeArray(name, idx.map(() => 10));
  const a = vars[key];
  if (idx.length !== a.dims.length) throw 'BS';
  let off = 0;
  idx.forEach((v, k) => {
    if (typeof v !== 'number') throw 'TM';
    v = Math.floor(v);
    if (v < 0 || v > a.dims[k]) throw 'BS';
    off = off * (a.dims[k] + 1) + v;
  });
  return [a.data, off];
}

let fnDepth = 0;
// מה שהמכונה נותנת לפונקציות: שעון, ג'ויסטיק, צבע של נקודה במסך
function env(vars) { const e = vars.__env; if (!e) throw 'FC'; return e; }
const numArg = v => { if (typeof v !== 'number') throw 'TM'; return v; };
const strArg = v => { if (typeof v !== 'string') throw 'TM'; return v; };
function argCount(a, lo, hi) { if (a.length < lo || a.length > hi) throw 'SN'; }
function callFunc(f, a, vars) {
  const one = () => { argCount(a, 1, 1); return a[0]; };
  switch (f) {
    case 'LEN': return strArg(one()).length;
    case 'INT': return Math.floor(numArg(one()));
    case 'ABS': return Math.abs(numArg(one()));
    case 'RND': { const n = numArg(one()); if (n < 1) return Math.random(); return Math.floor(Math.random() * Math.floor(n)) + 1; }   // RND(6) = 1..6
    case 'SIN': return Math.sin(numArg(one()));
    case 'COS': return Math.cos(numArg(one()));
    case 'TAN': return Math.tan(numArg(one()));
    case 'ATN': return Math.atan(numArg(one()));
    case 'SQR': { const n = numArg(one()); if (n < 0) throw 'FC'; return Math.sqrt(n); }
    case 'LOG': { const n = numArg(one()); if (n <= 0) throw 'FC'; return Math.log(n); }
    case 'EXP': { const n = numArg(one()); if (n > 88) throw 'OV'; return Math.exp(n); }
    case 'SGN': return Math.sign(numArg(one()));
    case 'FIX': return Math.trunc(numArg(one()));
    case 'ASC': { const s = strArg(one()); if (!s) throw 'FC'; return s.charCodeAt(0); }
    case 'VAL': { const m = /^\s*[-+]?(\d+\.?\d*|\.\d+)(E[-+]?\d+)?/i.exec(strArg(one())); return m ? parseFloat(m[0]) : 0; }
    case 'CHR$': { const n = Math.floor(numArg(one())); if (n < 0 || n > 255) throw 'FC'; return String.fromCharCode(n); }   // התצוגה מחליטה איך להראות תו מיוחד
    case 'STR$': return fmt(numArg(one())).replace(/ $/, '');
    case 'HEX$': { const n = Math.floor(numArg(one())); if (n < 0 || n > 65535) throw 'FC'; return n.toString(16).toUpperCase(); }
    case 'LEFT$': { argCount(a, 2, 2); const n = Math.floor(numArg(a[1])); if (n < 0 || n > 255) throw 'FC'; return strArg(a[0]).slice(0, n); }
    case 'RIGHT$': { argCount(a, 2, 2); const s = strArg(a[0]), n = Math.floor(numArg(a[1])); if (n < 0 || n > 255) throw 'FC'; return n ? s.slice(-n) : ''; }
    case 'MID$': {
      argCount(a, 2, 3);
      const s = strArg(a[0]), st = Math.floor(numArg(a[1])), n = a.length > 2 ? Math.floor(numArg(a[2])) : 255;
      if (st < 1 || st > 255 || n < 0 || n > 255) throw 'FC';
      return s.substr(st - 1, n);
    }
    case 'STRING$': {
      argCount(a, 2, 2);
      const n = Math.floor(numArg(a[0])), c = typeof a[1] === 'string' ? a[1][0] : callFunc('CHR$', [a[1]], vars);
      if (n < 0 || n > 255 || !c) throw 'FC';
      return c.repeat(n);
    }
    case 'INSTR': {
      argCount(a, 2, 3);
      let st = 1;
      if (a.length === 3) st = Math.floor(numArg(a.shift()));
      if (st < 1 || st > 255) throw 'FC';
      const s = strArg(a[0]), t = strArg(a[1]);
      if (st > s.length) return 0;
      return s.indexOf(t, st - 1) + 1;
    }
    case 'JOYSTK': { const n = Math.floor(numArg(one())); if (n < 0 || n > 3) throw 'FC'; return env(vars).joystk(n); }
    case 'PPOINT': { argCount(a, 2, 2); return env(vars).ppoint(numArg(a[0]), numArg(a[1])); }
    case 'POINT': { argCount(a, 2, 2); return env(vars).point(numArg(a[0]), numArg(a[1])); }
  }
  throw 'SN';
}

export function evalExpr(src, vars) {
  const p = new Parser(tokenize(src), vars), v = p.expr();
  if (!p.done()) throw 'SN';
  return v;
}

// מספרים מודפסים עם רווח לפניהם (או מינוס) ורווח אחריהם, כמו במקור
export function fmt(v) {
  if (typeof v === 'string') return v;
  const s = String(Math.round(v * 1e8) / 1e8);
  return (v >= 0 ? ' ' : '') + s + ' ';
}

// מפצל שורה לפקודות לפי ":" שמחוץ למרכאות, ומעביר לאותיות גדולות את מה שמחוץ למרכאות
export function split(text) {
  const parts = [];
  let cur = '', q = false;
  for (const c of text) {
    if (c === '"') q = !q;
    if (c === ':' && !q) { parts.push(cur); cur = ''; continue; }
    cur += q || c === '"' ? c : c.toUpperCase();
  }
  parts.push(cur);
  return parts.map(s => s.trim());
}
