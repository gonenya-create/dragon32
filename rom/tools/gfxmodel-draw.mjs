// מודל JS של DRAW ו-GET/PUT, נכתב ישר מ-docs/DRAGON-SPEC-GRAPHICS.md (סעיפים 11-12), בנפרד מקוד ה-ROM.
// מרחיב את Gfx של gfxmodel.mjs. שגיאות נזרקות כמחרוזת: 'FC', 'TM', 'SN', 'OM'.
import { Gfx } from './gfxmodel.mjs';

// שם משתנה כמו ב-BASIC: שתי האותיות/ספרות הראשונות, ו-$ למחרוזת (רווחים לא נחשבים)
const varKey = n => { n = n.replace(/ /g, ''); const m = /^([A-Z][A-Z0-9]*)(\$?)/.exec(n); return m[1].slice(0, 2) + m[2]; };

export class GfxD extends Gfx {
  constructor() { super(); this.angle = 0; this.scl = 0; }

  // DRAW (קורא 11). vars: { 'N': 20, 'S$': 'R5' }
  draw(str, vars = {}) {
    if (typeof str !== 'string') throw 'TM';
    let dn = false, db = false, act = this.fore;
    const stack = [];
    let cur = { s: str, i: 0 };
    const get = () => { while (cur.i < cur.s.length) { const c = cur.s[cur.i++]; if (c !== ' ') return c; } return null; };
    const getf = () => { const c = get(); if (c === null) throw 'FC'; return c; };
    const back = () => { cur.i--; };
    const name = () => {
      const c = getf();
      if (!/[A-Z]/.test(c)) throw 'FC';
      let n = c;
      for (;;) { const d = getf(); if (d === ';') break; n += d; }
      const k = varKey(n);
      return k in vars ? vars[k] : (k.endsWith('$') ? '' : 0);
    };
    const val = () => {
      const c = getf();
      if (c === '=') {
        const v = name();
        if (typeof v === 'string') throw 'TM';
        const t = Math.trunc(v);
        if (t < 0 || t > 255) throw 'FC';
        return t;
      }
      if (!/[0-9]/.test(c)) throw 'FC';
      let n = +c;
      for (;;) {
        const d = get();
        if (d === null) break;
        if (!/[0-9]/.test(d)) { back(); break; }
        n = n * 10 + +d;
        if (n > 255) throw 'FC';
      }
      return n;
    };
    const arg = () => { const c = get(); if (c === null) return 1; back(); if (/[A-Z]/.test(c)) return 1; return val(); };
    const move = (tx, ty) => {
      tx &= 0xffff; ty &= 0xffff;
      if (tx >= 256) tx = 255;
      if (ty >= 192) ty = 191;
      const x1 = this.lx, y1 = this.ly;
      if (!dn) { this.lx = tx; this.ly = ty; }
      const [a, b] = this.scale(x1, y1), [c, d] = this.scale(tx, ty);
      if (!db) this.line(a, b, c, d, act);
      dn = db = false;
    };
    const rel = (dx, dy) => {
      if (this.scl) {
        const f = v => { const r = ((Math.abs(v) * this.scl) & 0xffff) >> 2; return v < 0 ? -r : r; };
        dx = f(dx); dy = f(dy);
      }
      for (let k = 0; k < this.angle; k++) [dx, dy] = [-dy, dx];
      let tx = this.lx + dx, ty = this.ly + dy;
      if (tx < 0) tx = 0;
      if (ty < 0) ty = 0;
      move(tx, ty);
    };
    const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0], E: [1, -1], F: [1, 1], G: [-1, 1], H: [-1, -1] };
    for (;;) {
      const c = get();
      if (c === null) { if (!stack.length) break; cur = stack.pop(); continue; }
      if (c === ';' || c === "'") continue;
      if (c === 'N') { dn = !dn; continue; }
      if (c === 'B') { db = !db; continue; }
      if (c === 'X') {
        const v = name();
        if (typeof v !== 'string') throw 'TM';
        if (stack.length > 2000) throw 'OM';
        if (v.length) { stack.push(cur); cur = { s: v, i: 0 }; }
        continue;
      }
      if (c === 'M') {
        const sval = () => { const s = getf(); let sg = 0; if (s === '+' || s === '-') sg = s; else back(); const v = val(); return [sg === '-' ? -v : v, sg]; };
        const [x, sx] = sval();
        if (getf() !== ',') throw 'FC';
        const [y] = sval();
        if (sx) rel(x, y); else move(x, y);
        continue;
      }
      const n = arg();
      if (c === 'C') { this.fore = this.color(n); act = this.fore; }
      else if (c === 'A') { if (n >= 4) throw 'FC'; this.angle = n; }
      else if (c === 'S') { if (n >= 63) throw 'FC'; this.scl = n; }
      else if (DIRS[c]) rel(DIRS[c][0] * n, DIRS[c][1] * n);
      else throw 'FC';
    }
  }

  // GET / PUT (קורא 12). arr = הבתים של נתוני המערך (Uint8Array, משתנה במקום).
  // how: undefined = בתים; 'G' (GET) או 'PSET'|'PRESET'|'AND'|'OR'|'NOT' (PUT) = ביטים
  getput(isPut, p1, p2, arr, how) {
    let [x1, y1] = p1 ? this.clamp(...p1) : [this.lx, this.ly];
    let [x2, y2] = this.clamp(...p2);
    const colour = this.mode & 1, bits = how !== undefined;
    if (!bits) { const m = colour ? 0xfc : 0xf8; x1 &= m; x2 &= m; }
    let dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
    const wx = Math.min(x1, x2), wy = Math.min(y1, y2);
    if (colour) dx *= 2;
    const [sx, sy] = this.scale(wx, wy), [sdx, sdy] = this.scale(dx, dy);
    const rows = (sdy + 1) & 255;
    let [addr, mask] = this.addr(sx, sy);
    let p = -1;
    if (!bits) {
      const bpr = (sdx >> 3) + 1;
      for (let r = 0; r < rows; r++, addr += this.rowb)
        for (let b = 0; b < bpr; b++) {
          if (++p >= arr.length) throw 'FC';
          if (isPut) this.mem[addr + b] = arr[p]; else arr[p] = this.mem[addr + b];
        }
      return;
    }
    const ACT = { PSET: ['clr', 'set'], PRESET: ['set', 'clr'], OR: ['keep', 'set'], AND: ['clr', 'keep'], NOT: ['inv', 'inv'] }[how];
    if (!isPut) arr.fill(0);
    if (colour) mask &= 0xaa;
    let am = 0x01;   // "לפני ביט 7"
    for (let r = 0; r < rows; r++, addr += this.rowb) {
      let a = addr, m = mask;
      for (let k = 0; k <= sdx; k++) {
        am >>= 1;
        if (!am) { am = 0x80; if (++p >= arr.length) throw 'FC'; }
        if (!isPut) { if (this.mem[a] & m) arr[p] |= am; }
        else {
          const op = ACT[arr[p] & am ? 1 : 0];
          if (op === 'clr') this.mem[a] &= ~m; else if (op === 'set') this.mem[a] |= m; else if (op === 'inv') this.mem[a] ^= m;
        }
        m >>= 1;
        if (!m) { m = 0x80; a++; }
      }
    }
  }
}
