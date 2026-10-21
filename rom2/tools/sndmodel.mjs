// מודל הצליל, נכתב מהמפרט בלבד (docs/DRAGON-SPEC-SOUND.md), בלי לראות את ה-ROM.
// כל גל: ארבע כתיבות ל-$FF20, ולכל אחת כמה מחזורי מעבד עד הכתיבה הבאה (בלי פסיקת השדה).

// SOUND (סעיף 1.3): N = 256 פחות הטון
export function soundWave(tone) {
  const n = 256 - tone;
  return [
    { v: 0x7c, cycles: 23 + 5 * n },
    { v: 0xfc, cycles: 23 + 5 * n },
    { v: 0x7c, cycles: 23 + 5 * n },
    { v: 0x00, cycles: 31 + 5 * n },
  ];
}
export const soundPeriod = tone => 100 + 20 * (256 - tone);
// משך (סעיף 1.4): 4 שדות לכל יחידה; השבר נחתך
export const soundFields = d => 4 * Math.trunc(d);
// שגיאות (סעיף 1.1): טווח 1-255 אחרי חיתוך; שלילי תמיד ?FC
export function soundArgOk(x) {
  if (x < 0) return false;
  const t = Math.trunc(x);
  return t >= 1 && t <= 255;
}

// ---------- PLAY (סעיף 2) ----------
// טבלאות (2.5): אוקטבות 1-2 ספירה של 16 ביט, 3-5 של 8 ביט
export const PLAY_TAB = [
  [424, 400, 378, 356, 336, 317, 299, 282, 266, 251, 237, 223],
  [211, 199, 187, 177, 166, 157, 148, 139, 131, 124, 117, 110],
  [166, 156, 147, 139, 131, 123, 116, 109, 103, 97, 91, 86],
  [81, 76, 71, 67, 63, 59, 55, 52, 49, 46, 43, 40],
  [38, 35, 33, 31, 29, 27, 25, 24, 22, 20, 19, 18],
];
// הגל של תו (2.6): מרכז, גבוה, מרכז, נמוך, ולכל כתיבה המחזורים עד הבאה
export function playWave(oct, note, hi, lo) {
  const n = PLAY_TAB[oct][note];
  const [a, b] = oct < 2 ? [26 + 8 * n, 29 + 8 * n] : [25 + 5 * n, 28 + 5 * n];
  return [{ v: 0x7c, cycles: a }, { v: hi, cycles: a }, { v: 0x7c, cycles: a }, { v: lo, cycles: b }];
}
// כמה פסיקות שדה נמשך תו (2.8): התחלה 255, או ⌊(k+2)·255/2⌋ עם k נקודות; כל פסיקה מורידה L·T
export function playStart(dots) { return dots ? Math.floor((dots + 2) * 255 / 2) : 255; }
export function playFields(len, tempo, dots) { return Math.ceil(playStart(dots) / (len * tempo)); }

// מצב ההתחלה (0.2): אוקטבה (שמורה פחות 1), גבוה, נמוך, אורך, קצב, נקודות
export const playBoot = () => ({ oct: 2, hi: 0xb8, lo: 0x44, len: 4, tempo: 2, dots: 0 });

// playRun: מריץ מחרוזת PLAY על המצב st (משתנה אותו). vars: שם → מספר או מחרוזת (שני תווים ראשונים).
// מחזיר { events: [{pause, oct, note, hi, lo, fields}], error: null | 'FC' | 'TM' | 'OM' }
export function playRun(str, st, vars = {}) {
  const events = [];
  const stack = [];
  let s = str, p = 0;
  const FC = () => { throw 'FC'; };
  // תו הבא בלי רווחים (2.2); בסוף המחרוזת: null
  const get = () => { while (p < s.length && s[p] === ' ') p++; return p < s.length ? s[p++] : null; };
  const getf = () => { const c = get(); if (c === null) FC(); return c; };
  const back = () => { p--; };
  const varName = () => {
    const c = getf();
    if (c < 'A' || c > 'Z') FC();
    const start = p - 1;
    while (getf() !== ';');
    let m = s.slice(start).match(/^([A-Z][A-Z0-9]*)(\$?)/);
    const key = m[1].slice(0, 2) + m[2];
    return { key, isStr: m[2] === '$' };
  };
  const value = () => { // "=שם;" או ספרות
    const c = getf();
    if (c === '=') {
      const { key, isStr } = varName();
      if (isStr) throw 'TM';
      const v = vars[key] ?? 0;
      if (v < 0 || Math.trunc(v) > 255) FC();
      return Math.trunc(v);
    }
    if (c < '0' || c > '9') FC();
    let v = c.charCodeAt(0) - 48;
    for (;;) {
      const d = get();
      if (d === null) return v;
      if (d < '0' || d > '9') { back(); return v; }
      v = v * 10 + d.charCodeAt(0) - 48;
      if (v > 255) FC();
    }
  };
  const arg = cur => { // 2.3
    const c = getf();
    if (c === '+') { if (cur === 255) FC(); return cur + 1; }
    if (c === '-') { if (cur === 0) FC(); return cur - 1; }
    if (c === '>') { if (cur >= 128) FC(); return cur * 2; }
    if (c === '<') { if (cur === 0) FC(); return cur >> 1; }
    back();
    return value();
  };
  const note = (n, pause = false) => {
    const len = pause ? pause : st.len;
    events.push({ pause: !!pause, oct: st.oct, note: n, hi: pause ? 0x7c : st.hi, lo: pause ? 0x7c : st.lo,
      fields: playFields(len, st.tempo, pause ? 0 : st.dots) });
  };
  try {
    for (;;) {
      const c = get();
      if (c === null) {
        if (!stack.length) break;
        [s, p] = stack.pop();
        continue;
      }
      if (c === ';' || c === "'") continue;
      if (c === 'O') { const v = arg(st.oct + 1); if (v < 1 || v > 5) FC(); st.oct = v - 1; continue; }
      if (c === 'V') {
        const v = arg((st.hi >> 2) - 31);
        if (v > 31) FC();
        st.hi = 126 + 4 * v; st.lo = 124 - 4 * v;
        continue;
      }
      if (c === 'L') {
        const v = arg(st.len);
        if (v === 0) FC();
        st.len = v; st.dots = 0;
        for (;;) { const d = get(); if (d === null) break; if (d !== '.') { back(); break; } st.dots = (st.dots + 1) & 255; }
        continue;
      }
      if (c === 'T') { const v = arg(st.tempo); if (v === 0) FC(); st.tempo = v; continue; }
      if (c === 'P') { const v = value(); if (v === 0) FC(); note(0, v); continue; }
      if (c === 'X') {
        const { key, isStr } = varName();
        if (!isStr) throw 'TM';
        const sub = vars[key] ?? '';
        if (stack.length > 500) throw 'OM';
        if (sub.length) { stack.push([s, p]); s = sub; p = 0; }
        continue;
      }
      let k = c;
      if (k === 'N') k = getf();
      if (k >= 'A' && k <= 'G') {
        let n = { C: 1, D: 3, E: 5, F: 6, G: 8, A: 10, B: 12 }[k];
        const d = get();
        if (d === '#' || d === '+') n++;
        else if (d === '-') n--;
        else if (d !== null) back();
        if (n - 1 < 0 || n - 1 > 11) FC();
        note(n - 1);
        continue;
      }
      back();
      const v = value();
      if (v < 1 || v > 12) FC();
      note(v - 1);
    }
    return { events, error: null };
  } catch (e) {
    if (typeof e !== 'string') throw e;
    return { events, error: e };
  }
}
