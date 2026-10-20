// מודל JS של הגרפיקה, נכתב ישר מ-docs/DRAGON-SPEC-GRAPHICS.md (עובדות הקורא), בנפרד מקוד ה-ROM.
// משמש לבדיקות: אותן פקודות במודל וב-ROM, ומשווים את זיכרון המסך בית אחרי בית.
export const PMTAB = [[6, 16], [12, 32], [12, 16], [24, 32], [24, 32]];

export class Gfx {
  constructor() {
    this.mem = new Uint8Array(0x8000);
    this.mode = 0; this.start = 0x0600; this.end = 0x0c00; this.rowb = 16;
    this.fore = 3; this.back = 0; this.css = 0; this.lx = 128; this.ly = 96; this.prog = 0x1e;
  }
  scale(x, y) {
    if (this.mode < 4) x >>= 1;
    if (this.mode < 2) y >>= 1;
    return [x, y];
  }
  clamp(x, y) { return [Math.min(x, 255), Math.min(y, 191)]; }
  color(c) {
    if (c >= 9 || c < 0) throw 'FC';
    if (c >= 5) c -= 4;
    if (this.mode & 1) return (c - 1) & 3;
    return c & 1 ? 3 : 0;
  }
  addr(x, y) {
    x &= 255; y &= 255;
    const base = this.start + y * this.rowb;
    if (this.mode & 1) return [base + (x >> 2), 0xc0 >> (2 * (x & 3))];
    return [base + (x >> 3), 0x80 >> (x & 7)];
  }
  plot(x, y, c) {
    const [a, m] = this.addr(x, y);
    this.mem[a] = (this.mem[a] & ~m) | (m & (c * 0x55));
  }
  pmode(m, p) {
    if (m !== undefined) {
      if (m >= 5) throw 'FC';
      this.start = 0x600;
      const e = 6 + PMTAB[m][0];
      if (e > this.prog) throw 'FC';
      this.end = e << 8; this.rowb = PMTAB[m][1]; this.mode = m; this.fore = 3; this.back = 0;
    }
    if (p !== undefined) {
      if (p === 0) throw 'FC';
      const s = (((p - 1) * 6) & 255) + 6 & 255;
      const e = (s + ((this.end >> 8) - (this.start >> 8))) & 255;
      if (e > this.prog) throw 'FC';
      this.end = e << 8; this.start = s << 8;
    }
  }
  pcls(c) {
    const v = (c === undefined ? this.back : this.color(c)) * 0x55;
    this.mem.fill(v, this.start, this.end);
  }
  colorSt(f, b) { if (f !== undefined) this.fore = this.color(f); if (b !== undefined) this.back = this.color(b); }
  pset(x, y, c, set = true) {
    [x, y] = this.clamp(x, y);
    const col = c === undefined ? (set ? this.fore : this.back) : this.color(c);
    [x, y] = this.scale(x, y);
    this.plot(x, y, col);
  }
  ppoint(x, y) {
    [x, y] = this.scale(...this.clamp(x, y));
    const [a, m] = this.addr(x, y);
    let v = this.mem[a] & m;
    if (this.mode & 1) { let mm = m; while (!(mm & 1)) { mm >>= 1; v >>= 1; } return v + 1 + (this.css ? 4 : 0); }
    return v ? (this.css ? 5 : 1) : 0;
  }
  // קו אחרי ההקטנה, בצבע c (קורא 8)
  line(x1, y1, x2, y2, c) {
    if (y1 === y2) { for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) this.plot(x, y1, c); return; }
    if (x1 === x2) { for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) this.plot(x1, y, c); return; }
    const dx = Math.abs(x2 - x1), sx = x2 >= x1 ? 1 : -1, dy = Math.abs(y2 - y1), sy = y2 >= y1 ? 1 : -1;
    const xMajor = dx >= dy, M = xMajor ? dx : dy, m = xMajor ? dy : dx, smaj = xMajor ? sx : sy;
    let acc = M >> 1; if (M % 2 === 0 && smaj < 0) acc--;
    let x = x1, y = y1;
    for (let left = M; ; left--) {
      this.plot(x, y, c);
      if (left === 0) break;
      if (xMajor) x += sx; else y += sy;
      acc += m;
      if (acc >= M) { acc -= M; if (xMajor) y += sy; else x += sx; }
    }
  }
  lineSt(p1, p2, set, box) {
    const [x1, y1] = p1 ? this.clamp(...p1) : [this.lx, this.ly];
    const [x2, y2] = this.clamp(...p2);
    this.lx = x2; this.ly = y2;
    const c = set ? this.fore : this.back;
    const [a, b] = this.scale(x1, y1), [d, e] = this.scale(x2, y2);
    if (!box) return this.line(a, b, d, e, c);
    if (box === 'B') { this.line(a, b, d, b, c); this.line(a, b, a, e, c); this.line(d, b, d, e, c); this.line(a, e, d, e, c); return; }
    for (let y = b; ; y += e > b ? 1 : -1) { this.line(a, y, d, y, c); if (y === e) break; }
  }
  pcopy(s, d) {
    const pg = p => { if (p === 0) throw 'FC'; const h = (6 + (((p - 1) * 6) & 255)) & 255; if (h >= this.prog) throw 'FC'; return h << 8; };
    const a = pg(s), b = pg(d);
    for (let i = 0; i < 1536; i++) this.mem[b + i] = this.mem[a + i];
  }
}
