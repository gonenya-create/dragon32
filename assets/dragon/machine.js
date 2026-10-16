// המכונה: מסך הטקסט, התוכנית, הריצה ופקודות המערכת של ה-Dragon 32. אין כאן נגיעה בדף עצמו:
// כל מה שצריך להופיע על המסך עובר דרך view, וכל צליל דרך sound. כך אפשר להציב כמה מסכים בכמה דפים.
//
// מכיר: PRINT (?), INPUT, LET, GOTO, IF..THEN, FOR..NEXT (STEP), END/STOP, REM, CLS [צבע], SOUND, INKEY$,
// גרפיקה: PMODE, SCREEN, PCLS, COLOR, PSET, PRESET, LINE (גם B ו-BF), CIRCLE, DRAW, PAINT. מוזיקה: PLAY. PRINT @,
// GOSUB/RETURN, ON..GOTO/GOSUB, DIM (מערכים), READ/DATA/RESTORE, DEF FN, CLEAR, TRON/TROFF, IF..THEN..ELSE,
// INPUT כמה משתנים, LINE INPUT, PRINT TAB() / USING, GET/PUT, PPOINT, PCOPY, PMODE 0..4, SET/RESET/POINT,
// פקודות עריכה: EDIT, RENUM, DEL, CONT.
// כמה פקודות בשורה עם ":". פקודות מערכת: LIST, RUN, NEW, AUTO, CLOAD "שם", CSAVE "שם".
// שגיאות כמו במקור: ?SN ERROR, ?UL ERROR IN 20, ?NE ERROR, BREAK IN 20.
import { Parser, tokenize, evalExpr, fmt, split, vname, makeArray, arrayCell } from './basic.js';
import { PALETTES } from './gfx.js';

export const COLS = 32, ROWS = 16;
// צבעי CLS של ה-Dragon: 0 שחור, 1 ירוק, 2 צהוב, 3 כחול, 4 אדום, 5 בז', 6 תכלת, 7 סגול, 8 כתום
export const COLORS = ['#000000', '#13d613', '#f2f20e', '#2424e0', '#d81e1e', '#efe4b0', '#16d6d6', '#d61ed6', '#f28a0e'];
const DARK_BG = new Set([0, 3, 4, 7]);
const KNOWN_ERRORS = new Set(['SN', 'TM', 'UL', 'NF', '/0', 'OM', 'FC', 'ID', 'NE', 'IO', 'BS', 'DD', 'OD', 'RG', 'UF', 'CN', 'OV']);
const SYSTEM = /^(RUN|LIST|NEW|AUTO|CLOAD|CSAVE|EDIT|RENUM|DEL|CONT)\b/;
// SET/RESET: גרפיקה גסה בתוך מסך הטקסט. כל תו מחולק ל-4 ריבועים, וצבע אחד לכל התו.
// התו נשמר בשורה כתו פרטי (U+E000 + צבע*16 + אילו ריבועים דולקים), והתצוגה מציירת אותו
export const SG_BASE = 0xE000;

// view: { show(rows), color(index | undefined, isDark), busy(isBusy), prefill(text) }
// sound: { beep(tone, dur), tapeNoise(seconds) }
// loadTape(name): Promise שמחזיר את טקסט התוכנית, או null אם אין קלטת כזו
// saveTape(name, text): שומר תוכנית (CSAVE). מחזיר false אם אי אפשר לשמור
// joy(): {x, y} של הג'ויסטיק (0 עד 63), מהחצים או מנגיעה במסך
export function createMachine({ view, sound, loadTape, saveTape, joy }) {
  let lines = [];          // מה שמוצג על המסך
  let program = {};        // מספר שורה -> טקסט השורה
  let vars = {};
  let running = null;      // מצב ריצה של תוכנית
  let busy = false;        // בזמן "טעינה מהקלטת"
  let queue = [];          // שורות שמחכות לתורן (מכפתורים או מהדבקה)
  let auto = null;         // מצב AUTO: {n: המספר הבא, step: הקפיצה}
  let data = null, dataPos = 0;   // READ/DATA: כל הנתונים של התוכנית לפי הסדר, ואיפה אנחנו
  let playing = 0;         // PLAY בלי תוכנית: הטיימר שמסיים את המנגינה
  let cont = null;         // אחרי BREAK או STOP: מאיפה CONT ממשיך
  let trace = false;       // TRON: מראים כל מספר שורה שרץ
  let editText = '';       // EDIT: השורה שמחכה בשורת ההקלדה
  let timerBase = Date.now();
  const pages = {};        // PCOPY: עמודים גרפיים שמורים (העמוד המוצג הוא הקנבס עצמו)
  let keys = [];           // מקשים שנלחצו בזמן ריצה, בשביל INKEY$
  // מצב גרפי: PMODE 3 (4 צבעים, פיקסלים ברוחב 2) או 4 (2 צבעים), ערכת צבעים 0 או 1, צבע ציור ורקע
  // lx/ly: המקום האחרון שצוייר (DRAW מתחיל באמצע המסך), ds/da: הגודל והסיבוב של DRAW
  const G = { pmode: 3, set: 0, fg: 4, bg: 1, on: false, lx: 128, ly: 96, ds: 4, da: 0, page: 1 };
  // PLAY: אוקטבה, אורך תו, קצב ועוצמה. נשמרים בין פקודה לפקודה, כמו במקור
  const M = { o: 2, l: 4, t: 2, v: 15 };
  function freshVars() {
    const v = {};
    Object.defineProperty(v, 'INKEY$', { get: () => keys.shift() || '', enumerable: false });
    Object.defineProperty(v, '__env', { value: ENV, enumerable: false });
    return v;
  }
  // מה שהפונקציות של ה-BASIC צריכות מהמכונה (TIMER, JOYSTK, PPOINT, POINT)
  const ENV = {
    timer: () => Math.floor((Date.now() - timerBase) / 20) % 65536,   // 50 פעמים בשנייה, כמו במקור
    joystk(n) {
      const j = joy ? joy() : { x: 31, y: 31 };
      return n === 1 ? j.y : n === 0 ? j.x : 31;   // 0/1 = הג'ויסטיק הימני. לשמאלי אין כאן חיבור
    },
    ppoint(x, y) { return colorIndexAt(coord(x), coord(y)); },
    point(x, y) { return sgPoint(x, y); }
  };
  vars = freshVars();

  // ---------- מסך ----------
  // כשתוכנית רצה ולא מחכה להקלדה, שורת ההקלדה מוסתרת ורואים את כל 16 השורות, כמו במסך המקורי
  const visRows = () => (running && !running.waiting ? ROWS : ROWS - 1);
  // תווים 128..255 הם ריבועי הגרפיקה של ה-Dragon (CHR$(143) וכו'); תווי בקרה מוצגים כ-▒
  const SG_DRAGON = [0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15];   // סדר הביטים במקור -> הסדר שלנו
  function displayRow(row) {
    return row.replace(/[\x00-\x1f\x7f-\xff]/g, ch => {
      const c = ch.charCodeAt(0);
      if (c < 128) return '▒';
      const v = c - 128;
      return String.fromCharCode(SG_BASE + ((v >> 4) + 1) * 16 + SG_DRAGON[v & 15]);
    });
  }
  function render() {
    const shown = running && running.pending ? lines.concat(running.pending) : lines;
    if (view.full) view.full(visRows() === ROWS);
    view.show(shown.slice(-visRows()).map(displayRow));
  }
  function print(text) {
    String(text).split('\n').forEach(row => {
      if (row === '') { lines.push(''); return; }
      for (let i = 0; i < row.length; i += COLS) lines.push(row.slice(i, i + COLS));
    });
    if (lines.length > 200) lines = lines.slice(-ROWS);
    render();
  }
  function cls(color) {
    lines = [];
    view.color(color, color !== undefined && DARK_BG.has(color));
    render();
  }
  function setBusy(b) { view.busy(b); }
  // ה-Dragon לא הכיר עברית: כל תו שאינו ASCII הופך לריבוע
  function dragonize(s) { return s.toUpperCase().replace(/[^\x20-\x7e]/g, '▒'); }

  // ctx: רמז לעוזר שמסביר את השגיאה בעברית (למשל 'tape' כשהקלטת לא נמצאה)
  function errorText(code, lineNo, ctx) {
    const c = KNOWN_ERRORS.has(code) ? code : 'SN';
    if (view.error) view.error(c, lineNo, ctx);
    return '?' + c + ' ERROR' + (lineNo !== undefined ? ' IN ' + lineNo : '');
  }

  // ---------- גרפיקה ----------
  // מפרק "a,b,c" לפי פסיקים שמחוץ לסוגריים ולמרכאות
  function args(src) {
    const out = [];
    let depth = 0, q = false, cur = '';
    for (const c of src) {
      if (c === '"') q = !q;
      if (!q && c === '(') depth++;
      if (!q && c === ')') depth--;
      if (!q && depth === 0 && c === ',') { out.push(cur.trim()); cur = ''; continue; }
      cur += c;
    }
    if (cur.trim() !== '' || out.length) out.push(cur.trim());
    return out;
  }
  // קורא "(...)" שמתחיל במקום i, ומחזיר [התוכן, המקום שאחרי הסוגר]
  function paren(src, i) {
    while (src[i] === ' ') i++;
    if (src[i] !== '(') throw 'SN';
    let depth = 0;
    for (let j = i; j < src.length; j++) {
      if (src[j] === '(') depth++;
      if (src[j] === ')' && --depth === 0) return [src.slice(i + 1, j), j + 1];
    }
    throw 'SN';
  }
  const num = e => { const v = evalExpr(e, vars); if (typeof v !== 'number') throw 'TM'; return v; };
  // מצבי PMODE: 1 ו-3 עם 4 צבעים, 0, 2 ו-4 עם 2 צבעים. הנקודה גסה יותר במצבים הנמוכים
  const twoColor = () => G.pmode !== 1 && G.pmode !== 3;
  // הצבעים של המצב הנוכחי, לפי הסדר: במצב של 4 צבעים מספר הצבע 1..4, במצב של 2 צבעים 0 = רקע שחור
  function modePalette() { return twoColor() ? ['#000000', PALETTES[G.set][0]] : PALETTES[G.set]; }
  function colorOf(c) {
    if (twoColor()) return c === G.bg ? '#000000' : PALETTES[G.set][0];
    return PALETTES[G.set][((Math.round(c) - 1) % 4 + 4) % 4];
  }
  function plot(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || x > 255 || y < 0 || y > 191) return;
    const w = G.pmode < 4 ? 2 : 1, h = G.pmode < 2 ? 2 : 1;
    view.gfx.rect(x & ~(w - 1), y & ~(h - 1), w, h, colorOf(c));
  }
  // PPOINT: איזה צבע יש בנקודה (מספר כמו ב-COLOR)
  function colorIndexAt(x, y) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || x > 255 || y < 0 || y > 191) throw 'FC';
    const ctx = view.gfx.ctx;
    if (!ctx) return 0;
    const d = ctx.getImageData(x, y, 1, 1).data;
    const hex = '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('');
    const pal = modePalette(), k = pal.indexOf(hex);
    // מספר הצבע לפי ערכת הצבעים: ערכה 0 = 1..4, ערכה 1 = 5..8. נקודה כבויה במצב של 2 צבעים = 0
    if (twoColor()) return k === 1 ? 1 + 4 * G.set : 0;
    return k < 0 ? 0 : k + 1 + 4 * G.set;
  }
  // מספר לא סופי או ענק בפקודה גרפית היה תוקע את הדף: במקור זה ?FC ERROR
  const coord = v => { if (!isFinite(v) || Math.abs(v) > 65535) throw 'FC'; return v; };
  function line(x1, y1, x2, y2, c) {
    [x1, y1, x2, y2].forEach(coord);
    const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
    for (let k = 0; k <= n; k++) plot(x1 + (x2 - x1) * k / n, y1 + (y2 - y1) * k / n, c);
  }
  // מחזיר false אם זו לא פקודה גרפית
  function graphics(up) {
    let m;
    if ((m = /^PMODE\s*(.+)$/.exec(up))) {
      const a = args(m[1]), mode = Math.floor(num(a[0]));
      if (mode < 0 || mode > 4) throw 'FC';
      G.pmode = mode;
      if (a[1] !== undefined && a[1] !== '') showPage(Math.floor(num(a[1])));
      return;
    }
    if ((m = /^PCOPY\s*(.+?)\s+TO\s+(.+)$/.exec(up))) {
      const from = Math.floor(num(m[1])), to = Math.floor(num(m[2]));
      if (from < 1 || from > 8 || to < 1 || to > 8) throw 'FC';
      const ctx = view.gfx.ctx;
      if (!ctx) return;
      const img = from === G.page ? ctx.getImageData(0, 0, 256, 192) : pages[from];
      if (to === G.page) { if (img) ctx.putImageData(img, 0, 0); else view.gfx.clear('#000000'); }
      else pages[to] = img ? new ImageData(new Uint8ClampedArray(img.data), 256, 192) : null;
      return;
    }
    if ((m = /^GET\s*(\(.*)$/.exec(up))) {
      const [x1, y1, x2, y2, rest] = box(m[1]);
      const name = /^\s*,\s*([A-Z][A-Z0-9]*)\s*(,.*)?$/.exec(rest);
      if (!name) throw 'SN';
      const key = vname(name[1]) + '(';
      if (!vars[key]) vars[key] = makeArray(name[1], [10]);
      const ctx = view.gfx.ctx;
      if (!ctx) return;
      vars[key].img = ctx.getImageData(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1) + 1, Math.abs(y2 - y1) + 1);
      return;
    }
    if ((m = /^PUT\s*(\(.*)$/.exec(up))) {
      const [x1, y1, x2, y2, rest] = box(m[1]);
      const pm = /^\s*,\s*([A-Z][A-Z0-9]*)\s*(?:,\s*(PSET|PRESET|AND|OR|NOT))?\s*$/.exec(rest);
      if (!pm) throw 'SN';
      const a = vars[vname(pm[1]) + '('];
      if (!a || !a.img) throw 'FC';
      put(a.img, Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1) + 1, Math.abs(y2 - y1) + 1, pm[2] || 'PSET');
      return;
    }
    if ((m = /^SCREEN\s*(.+)$/.exec(up))) {
      const a = args(m[1]);
      G.set = a[1] !== undefined ? (num(a[1]) ? 1 : 0) : G.set;
      G.on = !!num(a[0]);
      view.graphics(G.on);
      return;
    }
    if ((m = /^PCLS\s*(.*)$/.exec(up))) {
      const c = m[1].trim() ? num(m[1]) : G.bg;
      view.gfx.clear(colorOf(c));
      return;
    }
    if ((m = /^COLOR\s*(.+)$/.exec(up))) {
      const a = args(m[1]);
      G.fg = num(a[0]);
      if (a[1] !== undefined) G.bg = num(a[1]);
      return;
    }
    if ((m = /^(PSET|PRESET)\s*(\(.*)$/.exec(up))) {
      const [inner] = paren(m[2], 0), a = args(inner);
      const x = num(a[0]), y = num(a[1]);
      plot(x, y, m[1] === 'PRESET' ? G.bg : a[2] !== undefined ? num(a[2]) : G.fg);
      G.lx = x; G.ly = y;
      return;
    }
    if ((m = /^LINE\s*(.*)$/.exec(up))) {
      let rest = m[1].trim(), x1 = G.lx, y1 = G.ly, i = 0;
      if (rest[0] === '(') { const [a, j] = paren(rest, 0); [x1, y1] = args(a).map(num); i = j; }
      while (rest[i] === ' ') i++;
      if (rest[i] !== '-') throw 'SN';
      const [b, j2] = paren(rest, i + 1);
      const [x2, y2] = args(b).map(num);
      const opts = args(rest.slice(j2).replace(/^\s*,/, '')).map(o => o.toUpperCase());
      const c = opts[0] === 'PRESET' ? G.bg : G.fg;
      if (opts[1] === 'BF') {
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) line(x1, y, x2, y, c);
      } else if (opts[1] === 'B') {
        line(x1, y1, x2, y1, c); line(x2, y1, x2, y2, c); line(x2, y2, x1, y2, c); line(x1, y2, x1, y1, c);
      } else line(x1, y1, x2, y2, c);
      G.lx = x2; G.ly = y2;
      return;
    }
    if ((m = /^CIRCLE\s*(\(.*)$/.exec(up))) {
      const [inner, j] = paren(m[1], 0), [cx, cy] = args(inner).map(num);
      const a = args(m[1].slice(j).replace(/^\s*,/, ''));
      const r = coord(num(a[0])), c = a[1] !== undefined && a[1] !== '' ? num(a[1]) : G.fg;
      const steps = Math.min(4000, Math.max(24, Math.round(r * 6)));
      for (let k = 0; k < steps; k++) {
        const t = k / steps * Math.PI * 2;
        plot(cx + Math.cos(t) * r, cy + Math.sin(t) * r, c);
      }
      return;
    }
    if ((m = /^PAINT\s*(\(.*)$/.exec(up))) {
      const [inner, j] = paren(m[1], 0), [x, y] = args(inner).map(num).map(coord);
      const a = args(m[1].slice(j).replace(/^\s*,/, ''));
      const c = a[0] !== undefined && a[0] !== '' ? num(a[0]) : G.fg;
      const b = a[1] !== undefined && a[1] !== '' ? num(a[1]) : c;
      paint(Math.round(x), Math.round(y), colorOf(c), colorOf(b));
      return;
    }
    if ((m = /^DRAW\s*(.+)$/.exec(up))) {
      const v = evalExpr(m[1], vars);
      if (typeof v !== 'string') throw 'TM';
      draw(v);
      return;
    }
    return false;
  }

  // "(x1,y1)-(x2,y2)" בתחילת המחרוזת: מחזיר את ארבעת המספרים ואת מה שנשאר אחרי
  function box(src) {
    const [a, i] = paren(src, 0);
    let j = i;
    while (src[j] === ' ') j++;
    if (src[j] !== '-') throw 'SN';
    const [b, k] = paren(src, j + 1);
    const [x1, y1] = args(a).map(num).map(coord).map(Math.round), [x2, y2] = args(b).map(num).map(coord).map(Math.round);
    if ([x1, x2].some(v => v < 0 || v > 255) || [y1, y2].some(v => v < 0 || v > 191)) throw 'FC';
    return [x1, y1, x2, y2, src.slice(k)];
  }
  // PUT: מדביק מה ש-GET שמר. PSET כמו שהוא, PRESET הפוך, AND/OR משלבים עם מה שיש, NOT הופך את מה שיש
  function put(img, x, y, w, h, action) {
    const ctx = view.gfx.ctx;
    if (!ctx) return;
    w = Math.min(w, img.width); h = Math.min(h, img.height);
    const pal = modePalette().map(hx => [1, 3, 5].map(k => parseInt(hx.substr(k, 2), 16)));
    const top = pal.length - 1;
    const idx = (d, p) => { const k = pal.findIndex(c => c[0] === d[p] && c[1] === d[p + 1] && c[2] === d[p + 2]); return k < 0 ? 0 : k; };
    const dst = ctx.getImageData(x, y, w, h);
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
      const sp = (r * img.width + c) * 4, dp = (r * w + c) * 4;
      const si = idx(img.data, sp), di = idx(dst.data, dp);
      const v = action === 'PSET' ? si : action === 'PRESET' ? top - si : action === 'AND' ? si & di : action === 'OR' ? (si | di) & top : top - di;
      [dst.data[dp], dst.data[dp + 1], dst.data[dp + 2]] = pal[v];
      dst.data[dp + 3] = 255;
    }
    ctx.putImageData(dst, x, y);
  }
  // PMODE n,עמוד: העמוד המוצג נשמר בצד, והעמוד החדש עולה למסך
  function showPage(p) {
    if (p < 1 || p > 8) throw 'FC';
    if (p === G.page) return;
    const ctx = view.gfx.ctx;
    if (ctx) {
      pages[G.page] = ctx.getImageData(0, 0, 256, 192);
      if (pages[p]) ctx.putImageData(pages[p], 0, 0); else view.gfx.clear('#000000');
    }
    G.page = p;
  }

  // ---------- SET / RESET / POINT ----------
  // רשת של 64 על 30 ריבועים על מסך הטקסט (15 שורות שרואים, 2 ריבועים בגובה לכל שורה)
  function sgCell(x, y) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || x > 63 || y < 0 || y > 31) throw 'FC';
    const VIS = visRows(), r = y >> 1;
    if (r >= VIS) return null;
    const k = Math.max(0, lines.length - VIS) + r;
    return { k, c: x >> 1, bit: 1 << ((y & 1) * 2 + (x & 1)) };   // 1 שמאל-למעלה, 2 ימין-למעלה, 4 שמאל-למטה, 8 ימין-למטה
  }
  function sgSet(x, y, color, on) {
    const cell = sgCell(x, y);
    if (!cell) return;
    if (running && running.pending) { const row = running.pending; running.pending = ''; print(row); }
    while (lines.length <= cell.k) lines.push('');
    const row = lines[cell.k].padEnd(cell.c + 1), ch = displayRow(row[cell.c]).charCodeAt(0);   // גם ריבוע של CHR$(128..255)
    const was = ch >= SG_BASE && ch < SG_BASE + 144 ? ch - SG_BASE : 0;
    let mask = was & 15, col = was >> 4;
    if (on) { mask |= cell.bit; col = color; } else mask &= ~cell.bit;
    lines[cell.k] = row.slice(0, cell.c) + String.fromCharCode(SG_BASE + col * 16 + mask) + row.slice(cell.c + 1);
    render();
  }
  function sgPoint(x, y) {
    const cell = sgCell(x, y);
    if (!cell || cell.k >= lines.length) return 0;
    const raw = lines[cell.k][cell.c], ch = raw === undefined ? NaN : displayRow(raw).charCodeAt(0);
    if (!(ch >= SG_BASE && ch < SG_BASE + 144)) return isNaN(ch) || raw === ' ' ? 0 : -1;   // אות רגילה: -1, כמו במקור
    const v = ch - SG_BASE;
    return v & cell.bit ? v >> 4 : 0;
  }

  // PAINT: צובע מהנקודה החוצה, עד שנתקלים בקו בצבע הגבול (בלי גבול: עד קו בצבע הצביעה עצמו)
  function paint(x, y, fill, border) {
    if (x < 0 || x > 255 || y < 0 || y > 191) return;
    const ctx = view.gfx.ctx;
    if (!ctx) return;
    const img = ctx.getImageData(0, 0, 256, 192), d = img.data;
    const rgb = h => [1, 3, 5].map(k => parseInt(h.substr(k, 2), 16));
    const [fr, fg, fb] = rgb(fill), [br, bg, bb] = rgb(border);
    const stop = p => (d[p] === br && d[p + 1] === bg && d[p + 2] === bb) || (d[p] === fr && d[p + 1] === fg && d[p + 2] === fb);
    const stack = [y * 256 + x];
    while (stack.length) {
      const i = stack.pop(), p = i * 4;
      if (stop(p)) continue;
      d[p] = fr; d[p + 1] = fg; d[p + 2] = fb; d[p + 3] = 255;
      const px = i & 255;
      if (px > 0) stack.push(i - 1);
      if (px < 255) stack.push(i + 1);
      if (i >= 256) stack.push(i - 256);
      if (i < 256 * 191) stack.push(i + 256);
    }
    ctx.putImageData(img, 0, 0);
  }

  // מספר שמופיע במקום i במחרוזת של DRAW או PLAY. sign: מותר + או - לפניו (תנועה יחסית ב-M)
  function reader(str) {
    const s = str.toUpperCase().replace(/\s+/g, '');
    const r = { s, i: 0 };
    r.num = (sign) => {
      const m = (sign ? /^[-+]?\d+/ : /^\d+/).exec(s.slice(r.i));
      if (!m) return null;
      r.i += m[0].length;
      return +m[0];
    };
    return r;
  }

  // DRAW "U20R20D20L20": מצייר בתנועות. U/D/L/R למעלה/למטה/שמאלה/ימינה, E/F/G/H באלכסון,
  // M x,y קפיצה למקום (עם + או - היא יחסית), B לפני תנועה = בלי לצייר, N = לחזור למקום אחרי הקו,
  // C צבע, S גודל (4 = רגיל), A סיבוב ברבעים (0 עד 3)
  const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0], E: [1, -1], F: [1, 1], G: [-1, 1], H: [-1, -1] };
  function draw(str) {
    const r = reader(str), s = r.s;
    while (r.i < s.length) {
      let c = s[r.i++], blank = false, keep = false;
      if (c === ';' || c === ',') continue;
      while (c === 'B' || c === 'N') { if (c === 'B') blank = true; else keep = true; c = s[r.i++]; }
      if (c === 'C') { const n = r.num(); if (n === null || n > 8) throw 'FC'; G.fg = n; continue; }
      if (c === 'S') { const n = r.num(); if (n === null || n < 1 || n > 62) throw 'FC'; G.ds = n; continue; }
      if (c === 'A') { const n = r.num(); if (n === null || n > 3) throw 'FC'; G.da = n; continue; }
      let nx, ny;
      if (c === 'M') {
        const rel = s[r.i] === '+' || s[r.i] === '-';
        const x = r.num(true);
        if (x === null || s[r.i++] !== ',') throw 'FC';
        const y = r.num(true);
        if (y === null) throw 'FC';
        if (rel) { nx = G.lx + x * G.ds / 4; ny = G.ly + y * G.ds / 4; } else { nx = x; ny = y; }
      } else if (DIRS[c]) {
        const n = r.num(), len = (n === null ? 1 : n) * G.ds / 4;
        let [dx, dy] = DIRS[c];
        for (let k = 0; k < G.da; k++) [dx, dy] = [-dy, dx];   // כל רבע: סיבוב של 90 מעלות עם כיוון השעון
        nx = G.lx + dx * len; ny = G.ly + dy * len;
      } else throw 'FC';
      coord(nx); coord(ny);
      if (!blank) line(G.lx, G.ly, nx, ny, G.fg);
      if (!keep) { G.lx = nx; G.ly = ny; }
    }
  }

  // PLAY "CDEFGAB": מנגן תווים. אחרי תו: # או + חצי טון למעלה, - חצי טון למטה, נקודה = ארוך פי 1.5.
  // מספר 1 עד 12 הוא תו לפי המספר שלו. O אוקטבה (1 עד 5), L אורך (4 = רבע), T קצב, V עוצמה, P הפסקה.
  // מחזיר כמה שניות המנגינה נמשכת, כדי שהתוכנית תחכה לה כמו במקור
  const NOTES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function play(str) {
    const r = reader(str), s = r.s;
    let at = 0;
    const length = l => 2.4 / M.t / l;   // תו שלם בקצב 2 נמשך 1.2 שניות
    const dots = () => { let k = 1; while (s[r.i] === '.') { r.i++; k *= 1.5; } return k; };
    const want = (lo, hi) => { const n = r.num(); if (n === null || n < lo || n > hi) throw 'FC'; return n; };
    while (r.i < s.length) {
      const c = s[r.i++];
      if (c === ';') continue;
      if (c === 'O') { M.o = want(1, 5); continue; }
      if (c === 'L') { M.l = want(1, 255); continue; }
      if (c === 'T') { M.t = want(1, 255); continue; }
      if (c === 'V') { M.v = want(0, 31); continue; }
      if (c === 'P') { at += length(want(1, 255)) * dots(); continue; }
      let semi;
      if (c in NOTES) {
        semi = NOTES[c];
        if (s[r.i] === '#' || s[r.i] === '+') { semi++; r.i++; } else if (s[r.i] === '-') { semi--; r.i++; }
      } else if (/\d/.test(c)) {
        r.i--;
        semi = want(1, 12) - 1;
      } else throw 'FC';
      const dur = length(M.l) * dots();
      sound.note(261.63 * Math.pow(2, M.o - 2 + semi / 12), at, dur, Math.min(0.1, 0.05 * M.v / 15));
      at += dur;
      if (at > 120) throw 'FC';
    }
    return at;
  }

  // ---------- פקודות ----------
  // מחזיר: undefined (המשך), {jump: n}, {end: true}, {skip: true} (דילוג על שאר השורה),
  // {goto: pc} (חזרה ללולאה), {wait: true} (INPUT מחכה לתשובה)
  function statement(up, pc) {
    let m;
    if (/^REM\b|^'/.test(up)) return { skip: true };
    if (up === '') return;
    if ((m = /^(PRINT\b|\?)(.*)$/.exec(up))) return doPrint(m[2]);
    if ((m = /^CLS\s*(.*)$/.exec(up))) {
      if (m[1].trim() === '') { cls(); return; }
      const c = evalExpr(m[1], vars);
      if (typeof c !== 'number' || c < 0 || c > 8) throw 'FC';
      cls(Math.floor(c));
      return;
    }
    if (up === 'END') return { end: true };
    if (up === 'STOP') return { stop: true };
    if (up === 'TRON') { trace = true; return; }
    if (up === 'TROFF') { trace = false; return; }
    if (/^CLEAR\b/.test(up)) {
      vars = freshVars(); data = null; dataPos = 0;
      if (running) { running.fors = []; running.stack = running.stack.filter(f => f.end); }
      return;
    }
    if ((m = /^DEF\s*FN\s*([A-Z][A-Z0-9]*)\s*\(\s*([A-Z][A-Z0-9]*\$?)\s*\)\s*=\s*(.+)$/.exec(up))) {
      if (!running) throw 'ID';
      vars['FN:' + m[1]] = { param: m[2], body: m[3] };
      return;
    }
    if ((m = /^(SET|RESET)\s*(\(.*)$/.exec(up))) {
      const [inner, j] = paren(m[2], 0), a = args(inner).map(num);
      if (m[2].slice(j).trim() !== '') throw 'SN';
      if (m[1] === 'SET') {
        if (a.length !== 3) throw 'SN';
        if (a[2] < 0 || a[2] > 8) throw 'FC';
        sgSet(a[0], a[1], Math.floor(a[2]), true);
      } else {
        if (a.length !== 2) throw 'SN';
        sgSet(a[0], a[1], 0, false);
      }
      return;
    }
    if ((m = /^GOTO\s*(\d+)$/.exec(up))) return { jump: +m[1] };
    if ((m = /^\u0001IFNOT (-?\d+) (.+)$/.exec(up))) {
      if (evalExpr(m[2], vars)) return;
      return +m[1] < 0 ? { skip: true } : { goto: { i: pc.i, s: +m[1] } };
    }
    if (up === '\u0001ENDLINE') return { skip: true };
    if ((m = /^(LINE\s+)?INPUT\s*(?:"([^"]*)"\s*;\s*)?(.+)$/.exec(up))) {
      if (!running) throw 'ID';   // כמו במקור: INPUT רק בתוך תוכנית
      const targets = args(m[3]);
      if (!targets.length || targets.some(t => !/^[A-Z][A-Z0-9]*\$?\s*(\(.*\))?$/.test(t))) throw 'SN';
      if (m[1] && (targets.length !== 1 || !/\$/.test(targets[0]))) throw 'TM';   // LINE INPUT: משתנה מילים אחד
      running.waiting = { targets, all: targets.slice(), line: !!m[1] };
      running.pending += (m[2] || '') + (m[1] ? '' : '? ');
      render();
      return { wait: true };
    }
    if ((m = /^FOR\s+([A-Z][A-Z0-9]*)\s*=\s*(.+?)\s+TO\s+(.+?)(?:\s+STEP\s+(.+))?$/.exec(up))) {
      if (!running) throw 'SN';
      const fv = vname(m[1]);
      vars[fv] = evalExpr(m[2], vars);
      running.fors = running.fors.filter(f => f.v !== fv);
      running.fors.push({ v: fv, to: evalExpr(m[3], vars), step: m[4] ? evalExpr(m[4], vars) : 1, pc: { i: pc.i, s: pc.s + 1 } });
      return;
    }
    if ((m = /^NEXT\s*([A-Z][A-Z0-9]*)?$/.exec(up))) {
      if (!running || !running.fors.length) throw 'NF';
      const f = running.fors[running.fors.length - 1];
      if (m[1] && vname(m[1]) !== f.v) throw 'NF';
      vars[f.v] += f.step;
      if ((f.step >= 0 && vars[f.v] <= f.to) || (f.step < 0 && vars[f.v] >= f.to)) return { goto: f.pc };
      running.fors.pop();
      return;
    }
    if ((m = /^GOSUB\s*(\d+)$/.exec(up))) {
      if (!running) return { gosub: +m[1] };
      if (running.stack.length >= 100) throw 'OM';
      running.stack.push({ i: pc.i, s: pc.s + 1, fors: running.fors.length });
      return { jump: +m[1] };
    }
    if (up === 'RETURN') {
      if (!running || !running.stack.length) throw 'RG';
      const back = running.stack.pop();
      if (back.end) return { end: true };   // GOSUB שהוקלד ישירות: חוזרים ל-OK
      running.fors.length = Math.min(running.fors.length, back.fors);
      return { goto: { i: back.i, s: back.s } };
    }
    if ((m = /^ON\s+(.+?)\s*(GOTO|GOSUB)\s*([\d\s,]+)$/.exec(up))) {
      const k = Math.floor(num(m[1])), targets = m[3].split(',').map(t => t.trim());
      if (k < 0 || k > 255) throw 'FC';
      if (k === 0 || k > targets.length) return;   // מחוץ לרשימה: ממשיכים הלאה, כמו במקור
      if (targets[k - 1] === '' || !/^\d+$/.test(targets[k - 1])) throw 'SN';
      return statement(m[2] + ' ' + targets[k - 1], pc);
    }
    if ((m = /^DIM\s+(.+)$/.exec(up))) {
      for (const d of args(m[1])) {
        const dm = /^([A-Z][A-Z0-9]*\$?)\s*(\(.*)$/.exec(d);
        if (!dm) throw 'SN';
        const [inner, j] = paren(dm[2], 0);
        if (dm[2].slice(j).trim() !== '') throw 'SN';
        const key = vname(dm[1]) + '(';
        if (vars[key]) throw 'DD';
        vars[key] = makeArray(dm[1], args(inner).map(num));
      }
      return;
    }
    if (/^DATA\b/.test(up)) return;   // שורת DATA לא עושה כלום כשמגיעים אליה, READ קורא ממנה
    if (up === 'RESTORE') { dataPos = 0; return; }
    if ((m = /^READ\s+(.+)$/.exec(up))) {
      if (!data) data = collectData();
      for (const target of args(m[1])) {
        if (dataPos >= data.length) throw 'OD';
        const item = data[dataPos++];
        if (/\$\s*(\(|$)/.test(target)) assign(target, item);
        else {
          const v = item.trim() === '' ? 0 : Number(item);
          if (isNaN(v)) throw 'SN';
          assign(target, v);
        }
      }
      return;
    }
    if ((m = /^PLAY\s*(.+)$/.exec(up))) {
      const v = evalExpr(m[1], vars);
      if (typeof v !== 'string') throw 'TM';
      const secs = play(v);
      return secs > 0 ? { pause: Math.round(secs * 1000) } : undefined;
    }
    const gr = graphics(up);
    if (gr !== false) return gr;
    if ((m = /^SOUND\s+(.+?)\s*,\s*(.+)$/.exec(up))) { sound.beep(evalExpr(m[1], vars), evalExpr(m[2], vars)); return; }
    if ((m = /^(?:LET\s+)?TIMER\s*=\s*(.+)$/.exec(up))) {
      const t = num(m[1]);
      if (t < 0 || t > 65535) throw 'FC';
      timerBase = Date.now() - Math.floor(t) * 20;
      return;
    }
    if ((m = /^(?:LET\s+)?([A-Z][A-Z0-9]*\$?)\s*=\s*(.+)$/.exec(up))) {
      assign(m[1], evalExpr(m[2], vars));
      return;
    }
    if ((m = /^(?:LET\s+)?([A-Z][A-Z0-9]*\$?\s*\(.*)$/.exec(up))) {
      const [, j] = paren(m[1], m[1].indexOf('('));
      const eq = /^\s*=\s*(.+)$/.exec(m[1].slice(j));
      if (!eq) throw 'SN';
      assign(m[1].slice(0, j), evalExpr(eq[1], vars));
      return;
    }
    throw 'SN';
  }

  // IF..THEN..ELSE: השורה הופכת לרשימה שטוחה של פקודות, עם שתי פקודות פנימיות:
  // "\u0001IFNOT k תנאי" (אם התנאי לא נכון, קופצים לפקודה k בשורה, או לשורה הבאה כש-k=-1) ו-"\u0001ENDLINE".
  // ככה THEN ו-ELSE לוקחים איתם את כל הפקודות שאחריהם עם ":", ו-IF בתוך IF מוצא את ה-ELSE שלו
  const compiled = new Map();
  function compileLine(text) {
    let c = compiled.get(text);
    if (!c) {
      c = flatten(goWords(text), 0);
      if (compiled.size > 500) compiled.clear();
      compiled.set(text, c);
    }
    return c;
  }
  // ב-Dragon האמיתי GO היה מילה בפני עצמה, ולכן GO TO ו-GO SUB (עם רווח) עבדו כמו GOTO ו-GOSUB.
  // מחליפים רק מחוץ למרכאות, ולא בתוך הערה (REM או ')
  function goWords(src) {
    let out = '', q = false;
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (ch === '"') { q = !q; out += ch; continue; }
      if (!q) {
        const word = i === 0 || !/[A-Z0-9$]/.test(src[i - 1]);
        if (ch === "'" || (word && src.startsWith('REM', i))) return out + src.slice(i);
        const m = word && /^GO\s+(TO|SUB)(?![A-Z0-9$])/.exec(src.slice(i, i + 12));
        if (m) { out += 'GO' + m[1]; i += m[0].length - 1; continue; }
      }
      out += ch;
    }
    return out;
  }
  // מילה שלמה מחוץ למרכאות, מהמקום from. מחזיר את המקום שלה או -1
  function findWord(src, word, from = 0) {
    let q = false;
    for (let i = 0; i < src.length; i++) {
      if (src[i] === '"') { q = !q; continue; }
      if (q || i < from) continue;
      if (src.startsWith(word, i) && (i === 0 || !/[A-Z0-9$]/.test(src[i - 1])) && !/[A-Z0-9$]/.test(src[i + word.length] || '')) return i;
    }
    return -1;
  }
  // ה-ELSE ששייך ל-IF הזה: מדלגים על ELSE של IF פנימי
  function matchingElse(src) {
    let q = false, depth = 0;
    for (let i = 0; i < src.length; i++) {
      if (src[i] === '"') { q = !q; continue; }
      if (q) continue;
      if (src[i] === "'") return -1;   // מכאן הערה
      if (i > 0 && /[A-Z0-9$]/.test(src[i - 1])) continue;
      if (src.startsWith('REM', i) && !/[A-Z0-9$]/.test(src[i + 3] || '')) return -1;
      const after = src[i + 4] || '';
      if (src.startsWith('IF', i) && !/[A-Z0-9$]/.test(src[i + 2] || '')) depth++;
      else if (src.startsWith('ELSE', i) && !/[A-Z0-9$]/.test(after)) { if (depth === 0) return i; depth--; }
    }
    return -1;
  }
  // base: איפה הרשימה הזו מתחילה בתוך הרשימה של כל השורה (בשביל IF בתוך IF)
  function flatten(text, base) {
    const pieces = split(text), out = [];
    for (let n = 0; n < pieces.length; n++) {
      const st = pieces[n];
      if (!/^IF\b/.test(st)) { out.push(st); continue; }
      const rest = [st].concat(pieces.slice(n + 1)).join(':');
      let t = findWord(rest, 'THEN'), g = -1, cond, body;
      if (t < 0) { g = findWord(rest, 'GOTO'); if (g < 0) throw 'SN'; }
      if (t >= 0) { cond = rest.slice(2, t); body = rest.slice(t + 4); }
      else { cond = rest.slice(2, g); body = rest.slice(g); }
      cond = cond.trim();
      if (!cond) throw 'SN';
      const e = matchingElse(body);
      let thenPart = (e >= 0 ? body.slice(0, e) : body).trim(), elsePart = e >= 0 ? body.slice(e + 4).trim() : null;
      // THEN 30 (גם אם אחריו ":" ועוד פקודות, שאליהן לא מגיעים) = GOTO 30
      const toGoto = part => part.replace(/^(\d+)(?=\s*(:|$))/, 'GOTO $1');
      thenPart = toGoto(thenPart);
      if (elsePart !== null) elsePart = toGoto(elsePart);
      const at = out.length;
      out.push(null);
      out.push(...flatten(thenPart, base + out.length));
      if (elsePart !== null) {
        out.push('\u0001ENDLINE');
        const k = base + out.length;
        out.push(...flatten(elsePart, k));
        out[at] = '\u0001IFNOT ' + k + ' ' + cond;
      } else out[at] = '\u0001IFNOT -1 ' + cond;
      return out;
    }
    return out;
  }

  // השמה למשתנה או לתא במערך: "A", "N$", "A(3)", "B$(1,2)"
  function assign(target, v) {
    const m = /^([A-Z][A-Z0-9]*(\$?))\s*(\(.*\))?$/.exec(target.trim());
    if (!m) throw 'SN';
    if ((typeof v === 'string') !== (m[2] === '$')) throw 'TM';
    if (!m[3]) { vars[vname(m[1])] = v; return; }
    const [inner] = paren(m[3], 0);
    const [arr, k] = arrayCell(vars, m[1], args(inner).map(num));
    arr[k] = v;
  }

  // כל הערכים בשורות DATA, לפי סדר השורות. מחרוזת במרכאות נשמרת כמו שהיא
  function collectData() {
    const out = [];
    for (const n of sortedLines()) {
      for (const st of split(program[n])) {
        const dm = /^DATA\s*(.*)$/.exec(st);
        if (!dm) continue;
        for (const it of args(dm[1])) out.push(/^".*"$/.test(it) ? it.slice(1, -1) : it);
      }
    }
    return out;
  }

  // PRINT @ מקום, "טקסט": כותב במקום מסוים על המסך. 0 = פינה שמאלית למעלה, כל שורה 32 מקומות
  function topComma(src, i) {
    let depth = 0, q = false;
    for (; i < src.length; i++) {
      const c = src[i];
      if (c === '"') q = !q;
      if (q) continue;
      if (c === '(') depth++;
      if (c === ')') depth--;
      if (c === ',' && depth === 0) return i;
    }
    return -1;
  }
  function printAt(pos, text) {
    if (running && running.pending) { const row = running.pending; running.pending = ''; print(row); }
    // כשהמסך עוד לא מלא, השורות מתחילות למעלה; כשהוא מלא, רואים את השורות האחרונות
    const VIS = visRows();
    let r = Math.min(Math.floor(pos / COLS), VIS - 1), c = pos % COLS;
    for (const ch of text) {
      if (c >= COLS) { c = 0; r++; if (r >= VIS) { lines.push(''); r = VIS - 1; } }
      const k = Math.max(0, lines.length - VIS) + r;
      while (lines.length <= k) lines.push('');
      const row = lines[k].padEnd(c + 1);
      lines[k] = row.slice(0, c) + ch + row.slice(c + 1);
      c++;
    }
    render();
  }

  // PRINT USING "##.##": מספרים מיושרים. # ספרה, . נקודה עשרונית, , פסיקים של אלפים, + סימן, - בסוף למינוס,
  // $ סימן דולר, ** כוכביות במקום רווחים, ! האות הראשונה של מילה, % % מילה ברוחב קבוע
  function using(f, vals) {
    if (!vals.length) throw 'FC';
    let out = '', vi = 0, i = 0, used = false;
    const NUM = /^(\+)?(\*\*\$|\*\*|\$\$|\$)?([#,]*)(\.#*)?(\^\^\^\^)?(-|\+)?/;
    while (vi < vals.length) {
      if (i >= f.length) { if (!used) throw 'FC'; i = 0; }
      const rest = f.slice(i);
      const m = NUM.exec(rest);
      const isNum = m && (m[3].includes('#') || (m[2] && m[2].length >= 2) || (m[4] && m[4].length > 1)) && (m[0].length > 0);
      if (isNum) {
        used = true;
        const v = vals[vi++];
        if (typeof v !== 'number') throw 'TM';
        const lead = m[1] === '+', fill = m[2] && m[2].startsWith('**'), dollar = !!m[2] && m[2].includes('$');
        const comma = m[3].includes(','), dec = m[4] ? m[4].length - 1 : 0, trail = m[6];
        let width = m[3].length + (m[2] ? m[2].length : 0) + (m[4] ? m[4].length : 0) + (lead ? 1 : 0);
        let body = Math.abs(v).toFixed(dec);
        if (m[5]) {
          // ^^^^: כתיב מדעי, למשל 1.23E+05. מקום אחד לפני הנקודה שמור לסימן
          const ints = Math.max(1, m[3].replace(/,/g, '').length - (lead || trail ? 0 : 1));
          let e = v === 0 ? 0 : Math.floor(Math.log10(Math.abs(v))) - (ints - 1);
          let mant = Math.abs(v) / Math.pow(10, e);
          if (+mant.toFixed(dec) >= Math.pow(10, ints)) { mant /= 10; e++; }
          body = mant.toFixed(dec) + 'E' + (e < 0 ? '-' : '+') + String(Math.abs(e)).padStart(2, '0');
          width += 4;
        } else if (comma) { const [ip, fp] = body.split('.'); body = ip.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (fp !== undefined ? '.' + fp : ''); }
        if (dollar) body = '$' + body;
        if (lead) body = (v < 0 ? '-' : '+') + body;
        else if (!trail && v < 0) body = '-' + body;
        let field = body.length > width ? '%' + body : body.padStart(width, fill ? '*' : ' ');
        if (trail) field += v < 0 ? '-' : (trail === '+' ? '+' : ' ');
        out += field;
        i += m[0].length;
        continue;
      }
      if (rest[0] === '!') { used = true; const v = vals[vi++]; if (typeof v !== 'string') throw 'TM'; out += (v[0] || ' '); i++; continue; }
      const sm = /^%( *)%/.exec(rest);
      if (sm) { used = true; const v = vals[vi++]; if (typeof v !== 'string') throw 'TM'; out += v.slice(0, sm[0].length).padEnd(sm[0].length); i += sm[0].length; continue; }
      out += rest[0];
      i++;
    }
    // טקסט קבוע שנשאר אחרי השדה האחרון
    while (i < f.length && !NUM.exec(f.slice(i))[3].includes('#') && f[i] !== '!' && f[i] !== '%') out += f[i++];
    return out;
  }

  function doPrint(rest) {
    let at = null;
    const am = /^\s*@/.exec(rest);
    if (am) {
      const k = topComma(rest, am[0].length);
      if (k < 0) throw 'SN';
      at = Math.floor(num(rest.slice(am[0].length, k)));
      if (at < 0 || at > 511) throw 'FC';
      rest = rest.slice(k + 1);
    }
    const p = new Parser(tokenize(rest), vars);
    let s = '', newline = true;
    if (p.is('kw', 'USING')) {
      p.take();
      const f = p.expr();
      if (typeof f !== 'string') throw 'TM';
      if (!p.is('op', ';')) throw 'SN';
      p.take();
      const vals = [];
      newline = true;
      while (!p.done()) {
        if (p.is('op', ';') || p.is('op', ',')) { p.take(); newline = false; continue; }
        vals.push(p.expr()); newline = true;
      }
      s = using(f, vals);
      return finishPrint(s, newline, at);
    }
    while (!p.done()) {
      if (p.is('kw', 'TAB')) {
        p.take(); p.expect('op', '(');
        const tv = p.expr(); p.expect('op', ')');
        if (typeof tv !== 'number') throw 'TM';
        const n = Math.floor(tv);
        if (n < 0 || n > 255) throw 'FC';
        const col = ((running ? running.pending.length : 0) + s.length) % COLS;
        if (n > col) s += ' '.repeat(Math.min(n, COLS - 1) - col);
        newline = false;
        continue;
      }
      if (p.is('op', ';')) { p.take(); newline = false; continue; }
      if (p.is('op', ',')) { p.take(); s += '                '.slice(((running ? running.pending.length : 0) + s.length) % COLS % 16); newline = false; continue; }
      s += fmt(p.expr()); newline = true;
    }
    return finishPrint(s, newline, at);
  }
  function finishPrint(s, newline, at) {
    if (at !== null) { printAt(at, s); return; }
    if (running) {
      running.pending += s;
      while (running.pending.length >= COLS) {   // שורה התמלאה: יורדת למסך מיד
        const row = running.pending.slice(0, COLS); running.pending = running.pending.slice(COLS); print(row); running.printed++;
      }
      // קודם מרוקנים את השורה הממתינה, ורק אז מדפיסים, אחרת היא מוצגת פעמיים עד הציור הבא
      if (newline) { const row = running.pending; running.pending = ''; print(row); running.printed++; }
      else render();
    } else {
      print(s);
    }
  }

  // ---------- ריצה ----------
  function sortedLines() { return Object.keys(program).map(Number).sort((a, b) => a - b); }

  function run(fromLine, gosubFrom) {
    const order = sortedLines();
    if (!order.length) { print('OK'); pump(); return; }
    if (fromLine === undefined) { vars = freshVars(); Object.assign(M, { o: 2, l: 4, t: 2, v: 15 }); G.ds = 4; G.da = 0; }
    keys = [];
    const start = fromLine === undefined ? 0 : order.indexOf(fromLine);
    clearTimeout(tickTimer);
    running = { order, pc: { i: start, s: 0 }, fors: [], stack: gosubFrom ? [{ end: true }] : [], pending: '', steps: 0, printed: 0, waiting: null };
    if (fromLine === undefined) { data = null; dataPos = 0; }
    cont = null;
    setBusy(true);
    tick();
  }

  // keep=true (BREAK או STOP): שומרים איפה עצרנו, כדי ש-CONT ימשיך משם
  function stop(message, keep) {
    if (!running) return;
    cont = keep ? { order: running.order, pc: running.pc, fors: running.fors, stack: running.stack } : null;
    clearTimeout(tickTimer);   // אחרת טיימר ישן ממשיך להריץ את ההרצה הבאה פעמיים
    if (G.on) { G.on = false; view.graphics(false); }   // כמו במקור: כשהתוכנית נעצרת, חוזרים למסך הטקסט
    if (running.pending) { const row = running.pending; running.pending = ''; print(row); }
    running = null;
    setBusy(false);
    if (message) print(message);
    print('OK');
    pump();
  }

  let tickTimer = 0;
  function tick() {
    if (!running || running.waiting) return;
    // בכל "פריים" עד 40 פקודות ועד 2 שורות הדפסה, כדי שהמסך יגלול לאט כמו פעם
    let budget = 40;
    running.printed = 0;
    while (running && !running.waiting && budget-- > 0 && running.printed < 2) {
      const pc = running.pc;
      if (pc.i >= running.order.length) { stop(); return; }
      const lineNo = running.order[pc.i];
      let stmts;
      try { stmts = compileLine(program[lineNo]); } catch (e) { stop(errorText(e, lineNo)); return; }
      if (pc.s >= stmts.length) { running.pc = { i: pc.i + 1, s: 0 }; continue; }
      if (trace && pc.s === 0) { running.pending += '[' + lineNo + ']'; render(); }
      let r;
      try {
        r = statement(stmts[pc.s], pc);
      } catch (e) {
        stop(errorText(e, lineNo));
        return;
      }
      if (!running) return;
      if (r && r.end) { stop(); return; }
      if (r && r.stop) { running.pc = { i: pc.i, s: pc.s + 1 }; stop('BREAK IN ' + lineNo, true); return; }
      if (r && r.jump !== undefined) {
        const idx = running.order.indexOf(r.jump);
        if (idx < 0) { stop(errorText('UL', lineNo)); return; }
        running.pc = { i: idx, s: 0 };
      } else if (r && r.goto) {
        running.pc = { i: r.goto.i, s: r.goto.s };
      } else if (r && r.skip) {
        running.pc = { i: pc.i + 1, s: 0 };
      } else {
        running.pc = { i: pc.i, s: pc.s + 1 };
      }
      if (++running.steps > 200000) { stop(errorText('OM', lineNo)); return; }
      // PLAY: התוכנית מחכה עד שהמנגינה נגמרת
      if (r && r.pause) { tickTimer = setTimeout(tick, r.pause); return; }
    }
    if (running && running.waiting) { pump(); return; }
    tickTimer = setTimeout(tick, 30);
  }

  // תשובה ל-INPUT: כמה ערכים מופרדים בפסיקים. חסרים? המחשב שואל שוב עם ??. LINE INPUT לוקח את כל השורה
  function answer(text) {
    const w = running.waiting;
    const row = running.pending + text;
    running.pending = '';
    print(row);
    const parts = w.line ? [text] : splitAnswer(text);
    try {
      while (parts.length && w.targets.length) {
        const t = w.targets[0], raw = parts.shift();
        if (/\$\s*(\(|$)/.test(t)) assign(t, w.line ? raw : raw.trim().replace(/^"(.*)"$/, '$1'));
        else {
          const v = raw.trim() === '' ? 0 : Number(raw.trim());
          if (isNaN(v)) { print('?REDO'); w.targets = w.all.slice(); running.pending = '? '; render(); return; }
          assign(t, v);
        }
        w.targets.shift();
      }
    } catch (e) {
      const n = running.order[running.pc.i];
      running.waiting = null;
      stop(errorText(e, n));
      return;
    }
    if (w.targets.length) { running.pending = '?? '; render(); return; }
    if (parts.length) print('?EXTRA IGNORED');
    running.waiting = null;
    tick();
  }
  function splitAnswer(text) {
    const out = [];
    let cur = '', q = false;
    for (const c of text) {
      if (c === '"') q = !q;
      if (c === ',' && !q) { out.push(cur); cur = ''; continue; }
      cur += c;
    }
    out.push(cur);
    return out;
  }

  function list() {
    sortedLines().forEach(n => print(n + ' ' + program[n]));
  }

  // CLOAD: "S" (מחפש), רעש קלטת, ואז "F שם" (נמצא). כמו במקור, בלי שם נטען הקובץ הראשון: GUESS
  function cload(name) {
    name = name || 'GUESS';
    busy = true;
    setBusy(true);
    print('S');
    sound.tapeNoise(3);
    const started = Date.now();
    Promise.resolve(loadTape(name)).catch(() => undefined).then(text => {
      setTimeout(() => {
        if (text === undefined) {
          print(errorText('IO', undefined, 'tape'));   // הקלטת לא נקראה (למשל בלי רשת)
        } else if (text === null) {
          print(errorText('NE', undefined, 'tape'));   // הקובץ לא נמצא על הקלטת
        } else {
          program = parseProgram(text);
          data = null; cont = null;
          print('F ' + name);
        }
        print('OK');
        busy = false;
        setBusy(false);
        pump();
      }, Math.max(0, 3000 - (Date.now() - started)));
    });
  }

  // RENUM חדש,מאיפה,קפיצה: ממספר מחדש את השורות ומתקן את כל ה-GOTO/GOSUB/THEN/ELSE/RESTORE שמצביעים עליהן
  function renum(start, from, step) {
    if (step < 1 || start > 63999) throw 'FC';
    const order = sortedLines(), map = {};
    let n = start;
    for (const old of order) {
      if (old < from) { map[old] = old; continue; }
      map[old] = n; n += step;
    }
    const kept = order.filter(o => o < from).map(o => map[o]);
    // המספרים החדשים חייבים להישאר אחרי השורות שלא זזות, ולא לעבור את 63999
    if (n - step > 63999 || (kept.length && order.some(o => o >= from) && start <= Math.max(...kept))) throw 'FC';
    const fixCode = code => code.split('"').map((part, k) => k % 2 ? part : part
      .replace(/(GO\s*TO|GO\s*SUB)(\s*)([\d\s,]+)/g, (all, kw, sp, list) => kw + sp + list.replace(/\d+/g, d => (d in map ? map[d] : d)))
      .replace(/(THEN|ELSE|RESTORE)(\s*)(\d+)/g, (all, kw, sp, d) => kw + sp + (d in map ? map[d] : d))).join('"');
    // פקודה אחרי פקודה: DATA נשארת כמו שהיא, ו-REM (או ') משאירה את כל שאר השורה
    const fix = text => {
      const parts = [];
      let cur = '', q = false;
      for (const ch of text) { if (ch === '"') q = !q; if (ch === ':' && !q) { parts.push(cur); cur = ''; continue; } cur += ch; }
      parts.push(cur);
      for (let k = 0; k < parts.length; k++) {
        const body = parts[k].replace(/^\s+/, '');
        if (/^(REM\b|')/.test(body)) return parts.slice(0, k).concat(parts.slice(k).join(':')).join(':');
        if (/^DATA\b/.test(body)) continue;
        // הערה באמצע הפקודה (למשל אחרי THEN): מתקנים רק את מה שלפניה
        const up = parts[k].toUpperCase();
        let c = findWord(up, 'REM');
        let qq = false;
        for (let x = 0; x < up.length && (c < 0 || x < c); x++) { if (up[x] === '"') qq = !qq; else if (up[x] === "'" && !qq) { c = x; break; } }
        if (c >= 0) {
          parts[k] = fixCode(parts[k].slice(0, c)) + parts[k].slice(c);
          return parts.join(':');   // שאר השורה הוא חלק מההערה, ונשאר כמו שהוא
        }
        parts[k] = fixCode(parts[k]);
      }
      return parts.join(':');
    };
    const next = {};
    for (const old of order) next[map[old]] = fix(program[old]);
    program = next;
    data = null; cont = null;
  }

  // CSAVE "שם": שומר את התוכנית על "קלטת" בדפדפן הזה. אחר כך CLOAD "שם" מחזיר אותה, גם מחר
  function csave(name) {
    if (!name) { print(errorText('FC', undefined, 'csave-name')); print('OK'); return; }
    if (!/^[A-Z0-9]{1,8}$/.test(name)) { print(errorText('FC', undefined, 'csave-bad')); print('OK'); return; }
    if (!sortedLines().length) { print(errorText('FC', undefined, 'csave-empty')); print('OK'); return; }
    const text = sortedLines().map(n => n + ' ' + program[n]).join('\n');
    busy = true;
    setBusy(true);
    sound.tapeNoise(2);
    setTimeout(() => {
      const ok = saveTape ? saveTape(name, text) : false;
      if (!ok) print(errorText('IO', undefined, 'csave'));
      print('OK');
      busy = false;
      setBusy(false);
      pump();
    }, 2000);
  }

  // ביצה נסתרת: מי שמקליד את השם של בעל האתר (הנוסח אושר על ידו, 13.10.2026)
  function hello() {
    print('HI, IT\'S GONEN.');
    print('I TYPED MY FIRST LINES ON ONE');
    print('OF THESE, AS A KID.');
    print('TODAY I BUILD WITH AI.');
    print('SAME CURIOSITY, NEW MACHINE.');
    sound.beep(150, 2);
    setTimeout(() => sound.beep(190, 3), 160);
  }

  function enter(raw) {
    let text = dragonize(raw.replace(/\s+$/, ''));
    if (running && running.waiting) { answer(running.waiting.line ? dragonize(raw) : text.trim()); return; }
    if (auto && !running && !busy) {
      const a = /^\s*(\d+)?\s*(.*)$/.exec(text);
      if (SYSTEM.test(a[2])) {
        // פקודת מערכת בתוך AUTO (למשל RUN): יוצאים מ-AUTO ומבצעים אותה, במקום לשמור אותה כשורה
        auto = null;
        text = a[2];
      } else if (!a[1] && a[2] !== '') {
        text = auto.n + ' ' + a[2];   // שורה שהודבקה בלי מספר מקבלת את המספר הבא
      }
    }
    print(text);
    if (running || busy) return;
    let m = /^\s*(\d+)\s*(.*)$/.exec(text);
    if (auto) {
      // שורה ריקה (רק המספר) יוצאת ממצב AUTO, כמו במקור
      if (text.trim() === '' || (m && m[2] === '')) { auto = null; print('OK'); return; }
      program[+m[1]] = m[2]; data = null; cont = null;
      auto.n = +m[1] + auto.step;
      return;
    }
    if (m) {
      const n = +m[1];
      if (m[2] === '') delete program[n]; else program[n] = m[2];
      data = null; cont = null;
      return;   // בדיוק כמו במקור: שורה עם מספר נשמרת בשקט
    }
    const cmd = text.trim();
    if (cmd === '') return;
    if (/^RUN$/.test(cmd)) { run(); return; }
    if (/^LIST$/.test(cmd)) { list(); print('OK'); return; }
    if (/^NEW$/.test(cmd)) { program = {}; vars = freshVars(); data = null; cont = null; print('OK'); return; }
    if (/^CONT$/.test(cmd)) {
      if (!cont) { print(errorText('CN')); print('OK'); return; }
      running = { order: cont.order, pc: cont.pc, fors: cont.fors, stack: cont.stack, pending: '', steps: 0, printed: 0, waiting: null };
      cont = null;
      setBusy(true);
      tick();
      return;
    }
    if ((m = /^EDIT\s*(\d+)$/.exec(cmd))) {
      if (!(+m[1] in program)) { print(errorText('UL', undefined, 'edit')); print('OK'); return; }
      editText = m[1] + ' ' + program[+m[1]];
      return;
    }
    if ((m = /^DEL\s*(\d*)\s*(-?)\s*(\d*)$/.exec(cmd)) && (m[1] || m[3])) {
      const from = m[1] ? +m[1] : 0, to = m[3] ? +m[3] : m[2] ? Infinity : from;
      sortedLines().forEach(n => { if (n >= from && n <= to) delete program[n]; });
      data = null; cont = null;
      print('OK');
      return;
    }
    if ((m = /^RENUM\s*(\d*)\s*,?\s*(\d*)\s*,?\s*(\d*)$/.exec(cmd))) {
      try { renum(m[1] ? +m[1] : 10, m[2] ? +m[2] : 0, m[3] ? +m[3] : 10); print('OK'); }
      catch (e) { print(errorText(e)); print('OK'); }
      return;
    }
    if ((m = /^CSAVE\s*(?:"([^"]*)"?)?$/.exec(cmd))) { csave(m[1] && m[1].trim()); return; }
    if ((m = /^CLOAD\s*(?:"([^"]*)"?)?$/.exec(cmd))) { cload(m[1] && m[1].trim()); return; }
    if ((m = /^AUTO\s*(\d+)?\s*(?:,\s*(\d+))?$/.exec(cmd))) {
      auto = { n: m[1] ? +m[1] : 10, step: m[2] ? Math.max(1, +m[2]) : 10 };
      return;
    }
    if (/^(GONEN|HELLO GONEN)$/.test(cmd)) { hello(); print('OK'); return; }
    try {
      const stmts = compileLine(cmd);
      let wait = 0;
      for (let i = 0; i < stmts.length; i++) {
        const r = statement(stmts[i], { i: -1, s: i });
        if (r && r.goto && r.goto.i === -1) { i = r.goto.s - 1; continue; }   // IF..ELSE בשורה ישירה
        if (r && r.pause) wait += r.pause;
        if (r && r.jump !== undefined) {
          if (!(r.jump in program)) throw 'UL';
          run(r.jump);
          return;
        }
        if (r && r.gosub !== undefined) {
          if (!(r.gosub in program)) throw 'UL';
          run(r.gosub, true);
          return;
        }
        if (r && (r.skip || r.end)) break;
      }
      if (wait) {
        // PLAY בלי תוכנית: OK מופיע רק כשהמנגינה נגמרת
        busy = true; setBusy(true);
        playing = setTimeout(() => { playing = 0; busy = false; setBusy(false); print('OK'); pump(); }, wait);
        return;
      }
      print('OK');
    } catch (e) {
      print(errorText(e));
      print('OK');
    }
  }

  // במצב AUTO השורה הבאה כבר מתחילה במספר שלה
  function prefill() {
    if (editText) { view.prefill(editText); editText = ''; return; }
    view.prefill(auto && !running && !busy ? auto.n + ' ' : '');
  }

  // מריץ את השורה הבאה שמחכה בתור, כשהמחשב פנוי
  function pump() {
    if (!queue.length || busy) return;
    if (running && !running.waiting) return;
    setTimeout(() => {
      if (!queue.length || busy || (running && !running.waiting)) return;
      enter(queue.shift());
      prefill();
      pump();
    }, 120);
  }

  function brk() {
    queue = [];
    if (sound.hush) sound.hush();
    if (playing) { clearTimeout(playing); playing = 0; busy = false; setBusy(false); print('BREAK'); print('OK'); }
    if (auto) { auto = null; view.prefill(''); print('BREAK'); print('OK'); }
    if (running) {
      const n = running.order[Math.min(running.pc.i, running.order.length - 1)];
      running.waiting = null;
      stop('BREAK IN ' + n, true);
    }
  }

  function parseProgram(text) {
    const prog = {};
    text.split('\n').forEach(l => {
      const m = /^\s*(\d+)\s+(.*)$/.exec(l);
      if (m) prog[+m[1]] = m[2];
    });
    return prog;
  }

  return {
    // מקש שנלחץ בזמן שתוכנית רצה (בשביל INKEY$)
    key(ch) { if (running && !running.waiting) { keys.push(ch); if (keys.length > 16) keys.shift(); return true; } return false; },
    get running() { return !!running; },
    // התוכנית כטקסט (לשיתוף בקישור)
    programText() { return sortedLines().map(n => n + ' ' + program[n]).join('\n'); },
    // טוען תוכנית מקישור ששיתפו: כמו קלטת, בלי רעש
    loadText(text, label) {
      if (running || busy) brk();
      auto = null;
      program = parseProgram(text.split('\n').map(dragonize).join('\n'));
      data = null;
      print('F ' + label);
      print('OK');
    },
    // שורה שהמשתמש שלח מהמקלדת
    type(raw) { enter(raw); prefill(); },
    // כמה שורות (הדבקה) נכנסות לתור ונשלחות אחת אחרי השנייה
    queue(rows) { queue = queue.concat(rows); pump(); },
    // כפתור מוכן: עוצר מה שרץ, יוצא מ-AUTO ושולח את השורות שלו
    press(rows) {
      if (running || busy) brk();
      if (auto) { auto = null; view.prefill(''); }
      queue = rows.slice();
      pump();
    },
    brk,
    boot() {
      print('(C) 1982 DRAGON DATA LTD');
      print('16K BASIC INTERPRETER 1.0');
      print('(C) 1982 BY MICROSOFT');
      print('');
      print('OK');
    }
  };
}
