// מודל JS של CIRCLE ו-PAINT, נכתב ישר מ-docs/DRAGON-SPEC-GRAPHICS.md (סעיפים 9, 10), בנפרד מקוד ה-ROM.
// מרחיב את Gfx מ-gfxmodel.mjs.
import { Gfx } from './gfxmodel.mjs';

const COS = [65536, 65220, 64277, 62714, 60547, 57798, 54491, 50660, 46341];
const SIN = [0, 6424, 12785, 19024, 25080, 30893, 36410, 41576, 46341];

export class Gfx2 extends Gfx {
  max() { return this.scale(255, 191); }
  // מספר עם ×2^k → 0..65535 (ההמרה של getadr: קיטוע; שלילי או גדול מדי: ?FC)
  static u16(v) { if (v < 0) throw 'FC'; const n = Math.floor(v); if (n > 65535) throw 'FC'; return n; }

  // CIRCLE: x,y,r מספרים; c, asp, start, end: undefined אם חסרים
  circle(x, y, r, c, asp, start, end) {
    const [mx, my] = this.max();
    [x, y] = this.scale(...this.clamp(x, y));
    r = Gfx2.u16(r); if (this.mode < 4) r >>= 1;
    const col = c === undefined ? this.fore : this.color(c);
    let a = asp === undefined ? 256 : Gfx2.u16(asp * 256);
    const pos = v => { if (v === undefined) return 0; const n = Gfx2.u16(v * 64); if (n > 255) throw 'FC'; return n & 63; };
    const s = pos(start), e = pos(end);
    if (this.mode === 2 || this.mode === 3) a = (a * 2) & 0xffff;
    const pt = p => {
      const o = p >> 3, b = p & 7, k = o & 1 ? 8 - b : b;
      const ca = k === 0 ? r : Math.floor(r * COS[k] / 65536), sb = Math.floor(r * SIN[k] / 65536);
      let H = ca, Vr = sb;
      if ([1, 2, 5, 6].includes(o)) { H = sb; Vr = ca; }
      const prod = Vr * a; if (prod >= 2 ** 24) throw 'FC';
      const V = Math.floor(prod / 256);
      let X, Y;
      if ([0, 1, 6, 7].includes(o)) { X = x + H; if (X >= mx) X = mx; } else { X = x - H; if (X < 0) X = 0; }
      if (o < 4) { Y = y + V; if (Y >= my) Y = my; } else { Y = y - V; if (Y < 0) Y = 0; }
      return [X, Y];
    };
    let p = s, prev = pt(p);
    for (;;) {
      p = (p + 1) & 63;
      const cur = pt(p);
      this.line(prev[0], prev[1], cur[0], cur[1], col);
      prev = cur;
      if (p === e) break;
    }
  }

  // PAINT: c, b undefined אם חסרים (b === undefined ו-hasB false: הגבול = צבע הצביעה)
  paint(x, y, c, b, hasB = b !== undefined) {
    const [mx, my] = this.max();
    [x, y] = this.scale(...this.clamp(x, y));
    const col = c === undefined ? this.fore : this.color(c);
    const brd = (hasB ? (b === undefined ? this.fore : this.color(b)) : col) * 0x55;
    const pc = col * 0x55;
    let X = x, Y = y, sav = 0, changed = true;
    const border = () => { const [ad, m] = this.addr(X, Y); return (this.mem[ad] & m) === (brd & m); };
    const plot = () => { const [ad, m] = this.addr(X, Y); const old = this.mem[ad]; this.mem[ad] = (old & ~m) | (m & pc); if (this.mem[ad] !== old) changed = true; };
    const scan = step => { let n = 0; while (X <= mx && !border()) { plot(); n++; X = (X + step) & 0xffff; } return n; };
    const sl = () => { sav = X; return scan(-1); };
    const sr = () => { X = (X + 1) & 0xffff; return scan(1); };
    const swap = () => { [X, sav] = [sav, X]; };
    const stack = [];
    const push = (dir, x, cnt) => { stack.push({ dir, y: Y, x: x & 0xffff, cnt: cnt & 0xffff }); if (stack.length > 4000) throw 'OM'; };
    push(0, 0, 0);
    const L0 = sl();
    if (L0) { swap(); const R = sr(); push(1, sav, L0 + R); push(-1, sav, L0 + R); }
    let first = true, savedLen = 0;
    const s16 = v => (v << 16) >> 16;
    for (;;) {
      if (!first && !changed) stack.length = savedLen;
      first = false;
      const e = stack.pop();
      changed = false; savedLen = stack.length;
      if (e.dir === 0) break;
      X = (e.x + 1) & 0xffff;
      let rem = e.cnt;
      const dir = e.dir;
      let ny = e.y;
      if (dir > 0) { if (ny + 1 > my) continue; ny++; } else { if (ny === 0) continue; ny--; }
      Y = ny;
      const L = sl();
      if (L > 0) {
        if (L >= 3) push(-dir, X, L - 2);
        swap();
        const R = sr();
        push(dir, sav, L + R);
        rem = s16(rem - R - 2);
      } else rem = s16(rem - 1);
      while (rem > 0) {
        X = (X + 1) & 0xffff;
        if (border()) rem--;
        else { X = (X - 1) & 0xffff; sav = X; const C = sr(); push(dir, sav, C); rem = s16(rem - C - 1); }
      }
      const stop = X;
      X = (stop + 1 + rem) & 0xffff;
      const ov = s16(-rem - 2);
      if (ov > 0) push(-dir, X, ov);
    }
  }
}
