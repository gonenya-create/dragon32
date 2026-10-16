// המסך הגרפי של ה-Dragon: 256×192 פיקסלים גסים, בצבעי מצב PMODE 3 של המחשב המקורי.
// כל ציור עובר דרך הפונקציות כאן, כדי שהכול יישאר "פיקסלי" (בלי החלקה ובלי חצאי פיקסלים).

export const W = 256, H = 192;

// שתי ערכות הצבעים של PMODE 3. ערכה 0: ירוק, צהוב, כחול, אדום. ערכה 1: בז', תכלת, סגול, כתום.
export const PALETTES = [
  ['#13d613', '#f2f20e', '#2424e0', '#d81e1e'],
  ['#efe4b0', '#16d6d6', '#d61ed6', '#f28a0e']
];
export const BLACK = '#000000';

// גופן 5×7, כמו האותיות שמשחקים ציירו לעצמם על המסך הגרפי. כל שורה = 5 ביטים.
const FONT_ROWS = {
  A: '0e11111f111111', B: '1e11111e11111e', C: '0e11101010110e', D: '1e11111111111e', E: '1f10101e10101f',
  F: '1f10101e101010', G: '0e11101711110f', H: '1111111f111111', I: '0e04040404040e', J: '0702020202120c',
  K: '11121418141211', L: '1010101010101f', M: '111b1515111111', N: '11111915131111', O: '0e11111111110e',
  P: '1e11111e101010', Q: '0e11111115120d', R: '1e11111e141211', S: '0f10100e01011e', T: '1f040404040404',
  U: '1111111111110e', V: '11111111110a04', W: '1111111515150a', X: '11110a040a1111', Y: '11110a04040404',
  Z: '1f01020408101f', '0': '0e11131519110e', '1': '040c040404040e', '2': '0e11010204081f', '3': '1f02040201110e',
  '4': '02060a121f0202', '5': '1f101e0101110e', '6': '0608101e11110e', '7': '1f010204080808', '8': '0e11110e11110e',
  '9': '0e11110f01020c', '!': '04040404040004', ':': '000c0c000c0c00', '-': '0000001f000000', '.': '00000000000c0c',
  '?': '0e110102040004', "'": '0c040800000000', ' ': '00000000000000', '/': '01010204081010', '+': '0004041f040400',
  ',': '000000000c0408', '(': '02040808080402', ')': '08040202020408', '=': '00001f001f0000', '*': '00150e1f0e1500'
};
const FONT = {};
for (const [ch, hex] of Object.entries(FONT_ROWS)) {
  FONT[ch] = [];
  for (let i = 0; i < 7; i++) FONT[ch].push(parseInt(hex.substr(i * 2, 2), 16));
}

export function createGfx(canvas) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  const g = {
    canvas, ctx,
    clear(color) { ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); },
    rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); },
    // ציור "ספרייט" מתוך שורות טקסט: כל תו הוא אינדקס בטבלת הצבעים, ונקודה = שקוף.
    // flip=true מצייר תמונת ראי (דמות שפונה לצד השני).
    sprite(rows, x, y, colors, flip, scale = 1) {
      x = Math.round(x); y = Math.round(y);
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        for (let c = 0; c < row.length; c++) {
          const ch = row[c];
          if (ch === '.' || ch === ' ') continue;
          ctx.fillStyle = colors[ch];
          const cx = flip ? row.length - 1 - c : c;
          ctx.fillRect(x + cx * scale, y + r * scale, scale, scale);
        }
      }
    },
    // טקסט בגופן 5×7. align: 'left' | 'center' | 'right'
    text(str, x, y, color, align = 'left', scale = 1) {
      str = String(str).toUpperCase();
      const adv = 6 * scale, width = str.length * adv - scale;
      if (align === 'center') x -= width / 2;
      else if (align === 'right') x -= width;
      x = Math.round(x); y = Math.round(y);
      ctx.fillStyle = color;
      for (let i = 0; i < str.length; i++) {
        const glyph = FONT[str[i]] || FONT['?'];
        for (let r = 0; r < 7; r++) {
          const bits = glyph[r];
          for (let c = 0; c < 5; c++) if (bits & (16 >> c)) ctx.fillRect(x + i * adv + c * scale, y + r * scale, scale, scale);
        }
      }
    }
  };
  return g;
}
