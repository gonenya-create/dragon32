// "מה קרה?": עוזר בלי AI שמסביר בעברית כל שגיאה של ה-Dragon. המחשב עצמו עונה באנגלית קצרה (?SN ERROR IN 30),
// כמו אז, והפתק מתחת למסך מתרגם: מה השגיאה אומרת, מה כתוב בשורה, ומה כנראה לתקן.
// הכול רץ בדפדפן לפי כללים קבועים. שום דבר לא נשלח לשום מקום.
// וגם "🔍 בדיקת התוכנית": עובר על התוכנית בלי להריץ אותה (analyze.js) ונותן עצות, גם כשאין שגיאה.
import { analyze, DEBUG_TIPS } from './analyze.js';

const KEYWORDS = ['PRINT', 'INPUT', 'LET', 'GOTO', 'GOSUB', 'RETURN', 'IF', 'THEN', 'ELSE', 'FOR', 'TO', 'STEP', 'NEXT', 'END', 'STOP',
  'REM', 'CLS', 'SOUND', 'PLAY', 'DRAW', 'PAINT', 'PMODE', 'SCREEN', 'PCLS', 'COLOR', 'PSET', 'PRESET', 'LINE', 'CIRCLE', 'GET', 'PUT',
  'PCOPY', 'DIM', 'READ', 'DATA', 'RESTORE', 'ON', 'DEF', 'CLEAR', 'TRON', 'TROFF', 'CONT', 'LIST', 'RUN', 'NEW', 'AUTO', 'CLOAD',
  'CSAVE', 'EDIT', 'DEL', 'RENUM', 'SET', 'RESET', 'GO'];

const NAMES = {
  SN: 'שגיאת כתיב', UL: 'אין שורה כזאת', NF: 'NEXT בלי FOR', RG: 'RETURN בלי GOSUB', OD: 'נגמרו הנתונים', TM: 'מילה במקום מספר (או להפך)',
  '/0': 'חילוק באפס', OM: 'נגמר הזיכרון', FC: 'מספר לא מתאים לפקודה', ID: 'פקודה רק בתוך תוכנית', NE: 'לא נמצא על הקלטת',
  IO: 'הקלטת לא נקראה', BS: 'מחוץ לרשימה', DD: 'הרשימה כבר הוגדרה', CN: 'אי אפשר להמשיך', OV: 'מספר גדול מדי', UF: 'נוסחה לא מוגדרת'
};

const TIPS = {
  UL: 'יש בשורה קפיצה (GOTO, GOSUB או THEN) למספר שורה שלא קיים בתוכנית. בדקו ב-LIST אילו מספרים יש.',
  NF: 'המחשב הגיע ל-NEXT, אבל לא ראה לפניו FOR מתאים. אולי ה-FOR נמחק, או שיש NEXT אחד יותר מדי.',
  RG: 'RETURN חוזר למקום שממנו קפצו עם GOSUB. כאן הגיעו אליו בלי GOSUB. הרבה פעמים חסר END לפני השורות של ה-GOSUB, והתוכנית "נופלת" לתוכן.',
  OD: 'READ ביקש עוד ערך, אבל כל ה-DATA כבר נקראו. הוסיפו ערכים ב-DATA, או RESTORE כדי להתחיל לקרוא מההתחלה.',
  TM: 'משתנה עם $ (כמו A$) מחזיק מילה, ובלי $ (כמו A) מספר. למשל A$=5 או A="HI" לא עובדים. מילים תמיד בתוך מרכאות.',
  '/0': 'בשורה יש חילוק במספר שהוא 0 באותו רגע. בדקו איזה משתנה מופיע אחרי הסימן /.',
  OM: 'התוכנית ביקשה יותר זיכרון ממה שיש: רשימה (DIM) ענקית, יותר מדי GOSUB בלי RETURN, או לולאה שלא נגמרת.',
  FC: 'הפקודה קיבלה מספר שהיא לא יכולה לעבוד איתו. למשל CLS 9 (יש רק 0 עד 8), SOUND 0, או מספר שלילי איפה שאסור.',
  ID: 'INPUT עובד רק בתוך תוכנית. כתבו אותו בשורה עם מספר, למשל 10 INPUT A, ואז RUN.',
  BS: 'ניסיתם לגשת לתא ברשימה שלא קיים. בלי DIM לרשימה יש רק תאים 0 עד 10. עם DIM A(20) יש 0 עד 20.',
  DD: 'אותה רשימה הוגדרה פעמיים עם DIM. מגדירים רשימה פעם אחת, בתחילת התוכנית, או CLEAR לפני.',
  CN: 'CONT ממשיך תוכנית שנעצרה ב-STOP או ב-BREAK. אחרי שינוי בתוכנית, או בלי שהייתה עצירה, אין ממה להמשיך. הקלידו RUN.',
  OV: 'יצא מספר גדול מדי בשביל המחשב.',
  UF: 'נעשה שימוש ב-FN שלא הוגדר. קודם כותבים DEF FNA(X)=..., ורק אחר כך FNA(3).'
};
const CTX = {
  tape: 'אין קלטת בשם הזה. על המדף יש למשל LANDER, GUESS ו-QUIZ: הקלידו CLOAD "LANDER". גם קלטת ששמרתם עם CSAVE מופיעה על המדף.',
  'csave-name': 'CSAVE צריך שם במרכאות, למשל CSAVE "SHIR".',
  'csave-bad': 'השם של קלטת: עד 8 אותיות באנגלית או ספרות, בלי רווחים. למשל CSAVE "GAME1".',
  'csave-empty': 'אין תוכנית בזיכרון לשמור. קודם כותבים שורות עם מספרים.',
  csave: 'יש כבר 6 קלטות שמורות. מחקו אחת על המדף (✕) כדי לפנות מקום.',
  edit: 'אין שורה עם המספר הזה. LIST מראה אילו שורות יש.'
};

// מרחק עריכה קטן: כמה אותיות צריך לשנות כדי לקבל מילה אחרת (PRNT → PRINT = 1)
function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
}

// הפקודות בשורה, מופרדות בנקודתיים (מחוץ למרכאות)
function statements(line) {
  const out = [];
  let q = false, cur = '';
  for (const ch of line) {
    if (ch === '"') q = !q;
    if (ch === ':' && !q) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map(x => x.trim()).filter(Boolean);
}

// שגיאת כתיב: מחפשים את הסיבות הנפוצות
function syntaxHints(line) {
  const hints = [];
  if (/▒/.test(line)) hints.push('יש בשורה תווים שהמחשב לא מכיר (הם מופיעים כריבועים). ה-Dragon יודע רק אותיות באנגלית, ספרות וסימנים.');
  if ((line.match(/"/g) || []).length % 2) hints.push('חסרות מרכאות סוגרות: כל מילה שמדפיסים צריכה " בהתחלה וגם בסוף.');
  const bare = line.replace(/"[^"]*"?/g, '');
  const open = (bare.match(/\(/g) || []).length, close = (bare.match(/\)/g) || []).length;
  if (open !== close) hints.push(open > close ? 'חסר סוגר ")". לכל "(" צריך ")" משלו.' : 'יש ")" אחד יותר מדי.');
  if (/==/.test(bare)) hints.push('ב-BASIC משווים עם = אחד, למשל IF A=5 THEN 100.');
  for (const st of statements(line)) {
    const w = (/^[A-Z]+/.exec(st) || [''])[0];
    if (!w || /^[A-Z][A-Z0-9]?\$?\s*(\(.*\))?\s*=/.test(st)) continue;   // השמה, כמו A=5
    if (KEYWORDS.some(k => st.startsWith(k))) continue;
    let best = null, bd = 3;
    for (const k of KEYWORDS) {
      if (k.length < 3) continue;
      const dd = distance(w.slice(0, k.length + 1), k);
      if (dd < bd) { bd = dd; best = k; }
    }
    hints.push(best ? `המחשב לא מכיר את המילה ${w}. אולי התכוונתם ל-${best}?` : `המחשב לא מכיר את המילה ${w}. במדריך שמתחת למחשב יש את כל הפקודות.`);
    break;
  }
  if (/\bIF\b/.test(bare) && !/\bTHEN\b|\bGOTO\b/.test(bare)) hints.push('אחרי IF והתנאי צריך THEN, למשל IF A>5 THEN PRINT "BIG".');
  if (/\bFOR\b/.test(bare) && !/\bTO\b/.test(bare)) hints.push('FOR צריך גם TO, למשל FOR I=1 TO 10.');
  if (!hints.length) hints.push('בדקו את הכתיב של כל מילה, את המרכאות ואת הסוגריים. הרבה פעמים זו אות אחת שהתחלפה.');
  return hints;
}

// טקסט עברי עם פקודות באנגלית: כל קטע לועזי עטוף ב-bdi, כדי שהמרכאות והנקודות לא יקפצו למקום הלא נכון
export function rich(el, text) {
  const re = /[A-Za-z0-9"(?$✕][A-Za-z0-9$"=<>()+\-*/,.'?# ]*[A-Za-z0-9$")✕]|[A-Za-z0-9$✕]/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) el.append(text.slice(last, m.index));
    const b = document.createElement('bdi');
    b.dir = 'ltr';
    b.textContent = m[0];
    el.append(b);
    last = m.index + m[0].length;
  }
  el.append(text.slice(last));
}

export function createHelper({ root, machine }) {
  const tv = root.querySelector('.d32-tv');
  const box = document.createElement('div');
  box.className = 'd32-helper';
  box.hidden = true;
  box.setAttribute('role', 'status');
  box.innerHTML = '<button type="button" class="d32-helper-x" aria-label="סגירת ההסבר">✕</button><p class="d32-helper-title"></p><pre class="d32-helper-line" dir="ltr"></pre><ul class="d32-helper-tips"></ul>';
  tv.after(box);
  const title = box.querySelector('.d32-helper-title');
  const lineBox = box.querySelector('.d32-helper-line');
  const tips = box.querySelector('.d32-helper-tips');

  function clear() { box.hidden = true; }
  box.querySelector('.d32-helper-x').addEventListener('click', clear);

  function show(code, lineNo, ctx) {
    // השורה שבה הייתה השגיאה (בתוך תוכנית), כדי להראות אותה ולנתח אותה
    let line = '';
    if (lineNo !== undefined) {
      const found = (machine.programText() || '').split('\n').find(l => l.startsWith(lineNo + ' '));
      line = found || '';
    }
    title.textContent = '';
    const b = document.createElement('b');
    b.textContent = '💡 מה קרה? ';
    const err = document.createElement('bdi');
    err.dir = 'ltr';
    err.textContent = '?' + code + ' ERROR';
    // שתי שורות, כדי שהעברית והאנגלית לא יתערבבו: "מה קרה?", ומתחת השם בעברית ואחריו השגיאה עצמה
    title.append(b, document.createElement('br'));
    rich(title, (NAMES[code] || 'שגיאה') + (lineNo !== undefined ? ', בשורה ' + lineNo : '') + ' ');
    title.append('(', err, ')');
    lineBox.hidden = !line;
    lineBox.textContent = line;
    let list;
    if (ctx && CTX[ctx]) list = [CTX[ctx]];
    else if (code === 'SN') list = line ? syntaxHints(line.replace(/^\d+\s*/, '')) : ['המחשב לא הבין את הפקודה. בדקו את הכתיב, את המרכאות ואת הסוגריים.'];
    else if (code === 'UL' && line) {
      const miss = [...line.replace(/"[^"]*"?/g, '').matchAll(/(?:GO\s*TO|GO\s*SUB|THEN|ELSE)\s*([\d\s,]+)/g)]
        .flatMap(m => m[1].split(',').map(x => x.trim()).filter(Boolean)).filter(n => !machine.programText().split('\n').some(l => l.startsWith(n + ' ')));
      list = [miss.length ? `השורה קופצת לשורה ${miss[0]}, ואין בתוכנית שורה כזאת.` : TIPS.UL, 'LIST מראה את כל מספרי השורות שיש.'];
    } else list = [TIPS[code] || 'בדקו את השורה, ונסו שוב.'];
    tips.textContent = '';
    for (const t of list) { const li = document.createElement('li'); rich(li, t); tips.appendChild(li); }
    box.hidden = false;
  }

  // דוח של בדיקת התוכנית. why: 'check' (לחצו על הכפתור) או 'break' (עצרו תוכנית שרצה)
  function report(why) {
    const found = analyze(machine.programText());
    if (why === 'break' && !found.some(f => f.kind === 'bug')) return false;   // אחרי BREAK מראים רק כשיש חשד אמיתי
    title.textContent = '';
    const b = document.createElement('b');
    b.textContent = why === 'break' ? '⏸ עצרתם את התוכנית. אולי זה מה שלא עבד:' : '🔍 בדיקת התוכנית';
    title.append(b);
    if (why === 'check' && machine.programText()) {
      const nb = found.filter(f => f.kind === 'bug').length, nt = found.length - nb;
      title.append(' ' + (nb || nt ? `מצאתי ${nb ? (nb === 1 ? 'דבר אחד שכנראה לא יעבוד' : nb + ' דברים שכנראה לא יעבדו') : ''}${nb && nt ? ', ו' : ''}${nt ? (nt === 1 ? 'עצה אחת' : nt + ' עצות') : ''}.` : 'לא מצאתי טעויות מוכרות 👍'));
    }
    lineBox.hidden = true;
    tips.textContent = '';
    const add = (icon, text, line) => {
      const li = document.createElement('li');
      li.className = 'is-' + icon;
      const tag = document.createElement('b');
      tag.textContent = (icon === 'bug' ? '⚠️ ' : '💡 ') + (line != null ? 'שורה ' + line + ': ' : '');
      li.append(tag);
      rich(li, text);
      tips.appendChild(li);
    };
    if (!machine.programText()) add('tip', 'אין עדיין תוכנית בזיכרון. כתבו שורות עם מספרים, ואז לחצו שוב.');
    else if (!found.length) {
      add('tip', 'אם התוכנית לא עושה מה שרציתם, הנה איך מחפשים את הבאג:');
      DEBUG_TIPS.forEach(t => add('tip', t));
    } else found.forEach(f => add(f.kind, f.text, f.line));
    box.hidden = false;
    return true;
  }

  return { show, clear, report };
}
