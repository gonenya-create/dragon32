// "🔍 בדיקת התוכנית": קורא את תוכנית ה-BASIC בלי להריץ אותה, ומחפש טעויות נפוצות ועצות, כמו מורה שעובר על הדף.
// בלי AI ובלי שרת: כללים קבועים. מחזיר רשימה של { kind: 'bug' | 'tip', line, text }.
// bug = משהו שכנראה לא יעבד כמו שרציתם. tip = עצה שתעשה את התוכנית טובה או נוחה יותר.

const KEYWORDS = new Set(['PRINT', 'INPUT', 'LET', 'GOTO', 'GOSUB', 'RETURN', 'IF', 'THEN', 'ELSE', 'FOR', 'TO', 'STEP', 'NEXT', 'END',
  'STOP', 'REM', 'CLS', 'SOUND', 'PLAY', 'DRAW', 'PAINT', 'PMODE', 'SCREEN', 'PCLS', 'COLOR', 'PSET', 'PRESET', 'LINE', 'CIRCLE', 'GET',
  'PUT', 'PCOPY', 'DIM', 'READ', 'DATA', 'RESTORE', 'ON', 'DEF', 'CLEAR', 'TRON', 'TROFF', 'CONT', 'AND', 'OR', 'NOT', 'USING', 'TAB',
  'SET', 'RESET', 'POINT', 'PPOINT', 'INKEY$', 'TIMER', 'JOYSTK', 'INT', 'RND', 'ABS', 'LEN', 'CHR$', 'ASC', 'MID$', 'LEFT$', 'RIGHT$',
  'STR$', 'VAL', 'INSTR', 'STRING$', 'HEX$', 'SIN', 'COS', 'TAN', 'ATN', 'SQR', 'LOG', 'EXP', 'SGN', 'FIX', 'FN', 'B', 'BF', 'GO', 'SUB']);

// בלי מה שבתוך מרכאות (המילים שמדפיסים לא נחשבות קוד), ובלי הערות
function code(text) {
  let out = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') { q = !q; out += ' '; continue; }
    if (q) { out += ' '; continue; }
    if (ch === "'" || (/^REM(?![A-Z0-9$])/.test(text.slice(i)) && (i === 0 || !/[A-Z0-9$]/.test(text[i - 1])))) break;
    if (/^DATA(?![A-Z0-9$])/.test(text.slice(i)) && (i === 0 || /[\s:]/.test(text[i - 1]))) { out += 'DATA'; break; }
    out += ch;
  }
  return out;
}
// הפקודות בשורה (מופרדות ב-:), וגם החלקים שאחרי THEN ו-ELSE
function parts(c) { return c.split(':').flatMap(s => s.split(/\bTHEN\b|\bELSE\b/)).map(s => s.trim()).filter(Boolean); }
// כל מספרי השורות שהשורה קופצת אליהם
function targets(c) {
  const out = [];
  for (const m of c.matchAll(/\b(?:GO\s*TO|GO\s*SUB)\s*([\d\s,]+)/g)) m[1].split(',').forEach(x => x.trim() && out.push(+x.trim()));
  for (const m of c.matchAll(/\b(?:THEN|ELSE)\s*(\d+)/g)) out.push(+m[1]);
  return out;
}
// שמות משתנים (A, SC, N$, A(…)). ב-Dragon רק שתי האותיות הראשונות קובעות: SCORE ו-SCALE הם אותו משתנה
function names(expr) {
  const out = [];
  for (const m of expr.matchAll(/\b([A-Z][A-Z0-9]*\$?)(\s*\()?/g)) {
    const w = m[1];
    if (KEYWORDS.has(w) || /^FN[A-Z]/.test(w)) continue;
    out.push({ name: w, array: !!m[2] });
  }
  return out;
}
const key = n => n.replace(/\$$/, '').slice(0, 2) + (n.endsWith('$') ? '$' : '');

export function analyze(programText) {
  const lines = (programText || '').split('\n').map(l => /^(\d+)\s+(.*)$/.exec(l)).filter(Boolean).map(m => ({ n: +m[1], text: m[2], c: code(m[2]) }));
  const out = [];
  const bug = (line, text) => out.push({ kind: 'bug', line, text });
  const tip = (line, text) => out.push({ kind: 'tip', line, text });
  if (!lines.length) return out;
  const nums = new Set(lines.map(l => l.n));
  const jumps = lines.flatMap(l => targets(l.c).map(t => ({ from: l.n, to: t, sub: /GO\s*SUB/.test(l.c) })));

  // ---------- לולאות FOR ו-NEXT ----------
  const open = [];
  for (const l of lines) {
    for (const p of parts(l.c)) {
      let m;
      if ((m = /^FOR\s+([A-Z][A-Z0-9]*)\s*=(.*?)\bTO\b/.exec(p))) open.push({ v: m[1], n: l.n, from: m[2].trim() });
      else if (/^FOR\b/.test(p) && !/\bTO\b/.test(p)) bug(l.n, 'ל-FOR חסר TO. למשל: FOR I=1 TO 10.');
      else if ((m = /^NEXT\s*([A-Z0-9, ]*)$/.exec(p))) {
        const vars = m[1].split(',').map(x => x.trim()).filter(Boolean);
        if (!vars.length) { if (!open.pop()) bug(l.n, 'יש כאן NEXT, אבל לפניו אין FOR פתוח. אולי FOR נמחק, או שיש NEXT אחד יותר מדי.'); continue; }
        for (const v of vars) {
          const at = open.map(f => key(f.v)).lastIndexOf(key(v));
          if (at < 0) { bug(l.n, `NEXT ${v} סוגר לולאה של ${v}, אבל אין לפניו FOR ${v}.`); continue; }
          if (at !== open.length - 1) { bug(l.n, `לולאות שמשתלבות זו בזו: NEXT ${v} מגיע לפני NEXT ${open[open.length - 1].v}. הלולאה הפנימית (FOR ${open[open.length - 1].v}) צריכה להיסגר קודם.`); open.splice(at, 1); continue; }
          open.splice(at);
        }
      }
    }
  }
  for (const f of open) {
    const back = jumps.find(j => j.to <= f.n && j.from > f.n && !j.sub);
    if (back) bug(f.n, `ל-FOR ${f.v} שבשורה ${f.n} אין NEXT. במקום NEXT יש בשורה ${back.from} קפיצה חזרה (GOTO ${back.to}), אז הלולאה מתחילה מחדש בכל פעם, ו-${f.v} תמיד חוזר ל-${f.from || 'ההתחלה'}. התיקון: ${back.from} NEXT ${f.v}.`);
    else bug(f.n, `ל-FOR ${f.v} שבשורה ${f.n} אין NEXT, אז הלולאה רצה רק פעם אחת. הוסיפו NEXT ${f.v} אחרי השורות שצריכות לחזור.`);
  }

  // ---------- קפיצות ----------
  for (const j of jumps) if (!nums.has(j.to)) bug(j.from, `השורה קופצת לשורה ${j.to}, ואין בתוכנית שורה כזאת. התוכנית תיעצר שם עם ?UL ERROR.`);
  const hasReturn = lines.some(l => parts(l.c).some(p => p === 'RETURN'));
  const subs = jumps.filter(j => j.sub && nums.has(j.to));
  if (subs.length && !hasReturn) bug(subs[0].from, `יש GOSUB ${subs[0].to}, אבל בתוכנית אין RETURN. בסוף השורות של ה-GOSUB צריך RETURN, כדי לחזור לאן שהיינו.`);
  if (subs.length && hasReturn) {
    // התוכנית "נופלת" לתוך שגרה: השורה שלפני השגרה הראשונה לא מסתיימת ב-END או GOTO
    const first = Math.min(...subs.map(j => j.to));
    const before = lines.filter(l => l.n < first).pop();
    if (before && !/\b(END|GO\s*TO\s*\d+|STOP|RETURN)\s*$/.test(before.c.trim())) {
      tip(before.n, `אחרי שורה ${before.n} התוכנית תמשיך לבד לשורה ${first}, שהיא שגרה של GOSUB, ותגיע ל-RETURN בלי GOSUB (?RG ERROR). שימו END בסוף החלק הראשי, לפני השגרות.`);
    }
  }

  // ---------- לולאה בלי סוף ----------
  for (const l of lines) {
    const p = parts(l.c), last = p[p.length - 1] || '';
    const m = /^GO\s*TO\s*(\d+)$/.exec(last);
    if (!m || +m[1] > l.n || p.some(x => /^IF\b/.test(x))) continue;
    const body = lines.filter(x => x.n >= +m[1] && x.n <= l.n);
    const exits = body.some(x => /\b(IF|INPUT|INKEY\$|END|STOP|ON)\b/.test(x.c) || targets(x.c).some(t => t > l.n || t < +m[1]));
    if (exits || open.some(f => f.n >= +m[1] && f.n <= l.n)) continue;
    tip(l.n, +m[1] === l.n
      ? `שורה ${l.n} קופצת לעצמה: המחשב יחכה כאן לנצח. זה בסדר כשרוצים לעצור את התמונה, ו-BREAK יוצא.`
      : `GOTO ${m[1]} בשורה ${l.n} חוזר לאחור בלי שום תנאי, אז התוכנית לא תיגמר לבד (BREAK עוצר). אם רציתם שזה ייגמר, הוסיפו תנאי, למשל IF N>10 THEN END.`);
  }

  // ---------- משתנים ----------
  const set = new Map(), used = new Map(), full = new Map();
  for (const l of lines) {
    for (const p of parts(l.c)) {
      let m;
      if ((m = /^(?:LET\s+)?([A-Z][A-Z0-9]*\$?)\s*(\([^=]*\))?\s*=(.*)$/.exec(p)) && !KEYWORDS.has(m[1])) {
        set.set(key(m[1]), l.n);
        names(m[3]).forEach(x => used.has(key(x.name)) || used.set(key(x.name), { n: l.n, name: x.name }));
        if (m[2]) names(m[2]).forEach(x => used.has(key(x.name)) || used.set(key(x.name), { n: l.n, name: x.name }));
        const isStr = m[1].endsWith('$'), val = m[3].trim();
        if (isStr && /^-?\d/.test(val)) bug(l.n, `${m[1]} הוא משתנה של מילים (יש לו $), ומנסים לשים בו מספר. מילים כותבים במרכאות: ${m[1]}="..." (אחרת ?TM ERROR).`);
        if (!isStr && /^"/.test(p.slice(p.indexOf('=') + 1).trim())) bug(l.n, `${m[1]} הוא משתנה של מספרים, ומנסים לשים בו מילה. למילים צריך $: ${m[1]}$="..." (אחרת ?TM ERROR).`);
        [m[1]].forEach(n => { const k = key(n); if (!full.has(k)) full.set(k, new Set()); full.get(k).add(n); });
        continue;
      }
      if ((m = /^FOR\s+([A-Z][A-Z0-9]*)\s*=(.*)$/.exec(p))) { set.set(key(m[1]), l.n); names(m[2].replace(/\bTO\b|\bSTEP\b/g, ' ')).forEach(x => used.has(key(x.name)) || used.set(key(x.name), { n: l.n, name: x.name })); continue; }
      if ((m = /^(?:LINE\s+)?INPUT\s*(?:[^;]*;)?\s*(.*)$/.exec(p)) && /^(LINE\s+)?INPUT\b/.test(p)) {
        names(m[1]).forEach(x => set.set(key(x.name), l.n));
        const prev = lines[lines.indexOf(l) - 1];
        // שאלה שהודפסה רגע לפני (PRINT ...) היא גם בסדר
        if (!/INPUT\s*"/.test(l.text) && !/PRINT/.test(l.c.split(/INPUT/)[0] + (prev ? prev.c : ''))) tip(l.n, 'INPUT בלי שאלה מראה רק "?". כדאי לכתוב מה מבקשים, למשל: INPUT "YOUR NAME";N$.');
        continue;
      }
      if ((m = /^READ\s+(.*)$/.exec(p))) { names(m[1]).forEach(x => set.set(key(x.name), l.n)); continue; }
      if ((m = /^DIM\s+(.*)$/.exec(p))) { names(m[1]).forEach(x => x.array && set.set(key(x.name), l.n)); continue; }
      if ((m = /^DEF\s*FN[A-Z]*\s*\(([A-Z][A-Z0-9]*)\)\s*=(.*)$/.exec(p))) { set.set(key(m[1]), l.n); continue; }
      if (/^(DATA|GET|PUT)\b/.test(p)) continue;
      names(p.replace(/^[A-Z$]+/, ' ')).forEach(x => used.has(key(x.name)) || used.set(key(x.name), { n: l.n, name: x.name }));
      // IF A$=YES: מילה בלי מרכאות בהשוואה
      if ((m = /^IF\s+([A-Z][A-Z0-9]*\$)\s*=\s*([A-Z][A-Z0-9]*)\b(?!\$)/.exec(p)) && !KEYWORDS.has(m[2])) {
        set.set(key(m[2]), l.n);   // כבר הסברנו עליו, לא צריך גם "משתנה בלי ערך"
        bug(l.n, `בהשוואה של מילים צריך מרכאות: IF ${m[1]}="${m[2]}". בלי מרכאות המחשב חושב ש-${m[2]} הוא משתנה של מספרים.`);
      }
    }
  }
  for (const [k, u] of used) {
    if (!set.has(k)) tip(u.n, `המשתנה ${u.name} אף פעם לא מקבל ערך בתוכנית, אז הוא תמיד ${u.name.endsWith('$') ? 'ריק' : '0'}. אולי טעות הקלדה בשם?`);
  }
  for (const [k, s] of full) if (s.size > 1) tip(null, `ה-Dragon מסתכל רק על שתי האותיות הראשונות בשם: ${[...s].join(' ו-')} הם בשבילו אותו משתנה (${k}). תנו להם שמות שמתחילים אחרת.`);

  // ---------- שורות שאי אפשר להגיע אליהן ----------
  const targeted = new Set(jumps.map(j => j.to));
  for (const m of (programText.match(/\bRESTORE\s*(\d+)/g) || [])) targeted.add(+m.replace(/\D/g, ''));
  for (let i = 1; i < lines.length; i++) {
    const prev = parts(lines[i - 1].c), last = prev[prev.length - 1] || '';
    if (prev.some(p => /^IF\b/.test(p))) continue;
    if (/^(END|GO\s*TO\s*\d+|STOP|RETURN)$/.test(last) && !targeted.has(lines[i].n) && !/^(DATA|REM|END)/.test(lines[i].c.trim()) && lines[i].c.trim()) {
      tip(lines[i].n, `אי אפשר להגיע לשורה ${lines[i].n}: השורה שלפניה נגמרת ב-${last.split(/\s/)[0]}, ושום GOTO או GOSUB לא קופץ אליה.`);
    }
  }

  // ---------- עצות כלליות ----------
  const ns = lines.map(l => l.n);
  if (ns.length >= 4 && ns.slice(1).some((n, i) => n - ns[i] === 1)) tip(null, 'מספרי שורות צמודים (1, 2, 3) לא משאירים מקום להוסיף שורה באמצע. מקובל 10, 20, 30, ו-RENUM מסדר את זה בשבילכם.');
  if (lines.some(l => /\bPRINT\b/.test(l.c)) && !/^\s*(CLS|PMODE|PCLS|REM)/.test(lines[0].c || 'REM') && lines.length >= 3) tip(lines[0].n, 'כדאי להתחיל ב-CLS: המסך מתנקה, והתוכנית לא מתערבבת עם מה שהיה עליו.');
  if (lines.length >= 15 && !lines.some(l => /\bREM\b|'/.test(l.text))) tip(null, 'תוכנית ארוכה בלי REM קשה לקרוא אחרי שבוע. שורת REM קצרה לפני כל חלק עוזרת, למשל 100 REM *** SCORE ***.');
  // קודם הטעויות, ואחריהן עד 4 עצות, כדי לא להציף
  // אותה עצה פעם אחת בלבד
  const seen = new Set();
  const uniq = out.filter(f => (seen.has(f.text) ? false : seen.add(f.text)));
  const bugs = uniq.filter(f => f.kind === 'bug'), tips = uniq.filter(f => f.kind === 'tip');
  return bugs.concat(tips.slice(0, 4));
}

// עצות כלליות לחיפוש באג, כשהבדיקה לא מצאה כלום
export const DEBUG_TIPS = [
  'TRON מראה בסוגריים את מספר כל שורה שרצה. כך רואים לאן התוכנית באמת הולכת. TROFF מכבה.',
  'STOP באמצע התוכנית עוצר אותה. אז אפשר לכתוב PRINT A כדי לראות מה יש במשתנה, ו-CONT ממשיך.',
  'LIST 20-50 מראה רק חלק מהתוכנית. קראו את השורות לאט, כאילו אתם המחשב.'
];
