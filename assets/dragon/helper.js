// "מה קרה?": עוזר בלי AI שמסביר בעברית כל שגיאה של ה-Dragon. המחשב עצמו עונה באנגלית קצרה (?SN ERROR IN 30),
// כמו אז, והפתק מתחת למסך מתרגם: מה השגיאה אומרת, מה כתוב בשורה, ומה כנראה לתקן.
// הכול רץ בדפדפן לפי כללים קבועים. שום דבר לא נשלח לשום מקום.
// וגם "🔍 בדיקת התוכנית": עובר על התוכנית בלי להריץ אותה (analyze.js) ונותן עצות, גם כשאין שגיאה.
import { analyze, DEBUG_TIPS } from './analyze.js';
import { EN, tr } from './lang.js';

const KEYWORDS = ['PRINT', 'INPUT', 'LET', 'GOTO', 'GOSUB', 'RETURN', 'IF', 'THEN', 'ELSE', 'FOR', 'TO', 'STEP', 'NEXT', 'END', 'STOP',
  'REM', 'CLS', 'SOUND', 'PLAY', 'DRAW', 'PAINT', 'PMODE', 'SCREEN', 'PCLS', 'COLOR', 'PSET', 'PRESET', 'LINE', 'CIRCLE', 'GET', 'PUT',
  'PCOPY', 'DIM', 'READ', 'DATA', 'RESTORE', 'ON', 'DEF', 'CLEAR', 'TRON', 'TROFF', 'CONT', 'LIST', 'RUN', 'NEW', 'AUTO', 'CLOAD',
  'CSAVE', 'EDIT', 'DEL', 'RENUM', 'SET', 'RESET', 'GO'];

const NAMES = {
  SN: tr('שגיאת כתיב', 'Syntax error'), UL: tr('אין שורה כזאת', 'No such line'), NF: tr('NEXT בלי FOR', 'NEXT without FOR'),
  RG: tr('RETURN בלי GOSUB', 'RETURN without GOSUB'), OD: tr('נגמרו הנתונים', 'Out of DATA'), TM: tr('מילה במקום מספר (או להפך)', 'A word instead of a number (or the other way round)'),
  '/0': tr('חילוק באפס', 'Division by zero'), OM: tr('נגמר הזיכרון', 'Out of memory'), FC: tr('מספר לא מתאים לפקודה', 'A number the command can\'t use'),
  ID: tr('פקודה רק בתוך תוכנית', 'Only works inside a program'), NE: tr('לא נמצא על הקלטת', 'Not found on the tape'),
  IO: tr('הקלטת לא נקראה', 'The tape could not be read'), BS: tr('מחוץ לרשימה', 'Outside the list'), DD: tr('הרשימה כבר הוגדרה', 'The list is already defined'),
  CN: tr('אי אפשר להמשיך', 'Can\'t continue'), OV: tr('מספר גדול מדי', 'Number too big'), UF: tr('נוסחה לא מוגדרת', 'Undefined function')
};

const TIPS = {
  UL: tr('יש בשורה קפיצה (GOTO, GOSUB או THEN) למספר שורה שלא קיים בתוכנית. בדקו ב-LIST אילו מספרים יש.', 'The line jumps (GOTO, GOSUB or THEN) to a line number that isn\'t in the program. Use LIST to see which numbers there are.'),
  NF: tr('המחשב הגיע ל-NEXT, אבל לא ראה לפניו FOR מתאים. אולי ה-FOR נמחק, או שיש NEXT אחד יותר מדי.', 'The computer reached NEXT but saw no matching FOR before it. Maybe the FOR was deleted, or there is one NEXT too many.'),
  RG: tr('RETURN חוזר למקום שממנו קפצו עם GOSUB. כאן הגיעו אליו בלי GOSUB. הרבה פעמים חסר END לפני השורות של ה-GOSUB, והתוכנית "נופלת" לתוכן.', 'RETURN goes back to where GOSUB jumped from. Here it was reached without a GOSUB. Often an END is missing before the GOSUB lines, and the program "falls" into them.'),
  OD: tr('READ ביקש עוד ערך, אבל כל ה-DATA כבר נקראו. הוסיפו ערכים ב-DATA, או RESTORE כדי להתחיל לקרוא מההתחלה.', 'READ asked for another value, but all the DATA has been read. Add values to DATA, or use RESTORE to start reading from the beginning.'),
  TM: tr('משתנה עם $ (כמו A$) מחזיק מילה, ובלי $ (כמו A) מספר. למשל A$=5 או A="HI" לא עובדים. מילים תמיד בתוך מרכאות.', 'A variable with $ (like A$) holds a word, and without $ (like A) a number. So A$=5 or A="HI" won\'t work. Words always go in quotes.'),
  '/0': tr('בשורה יש חילוק במספר שהוא 0 באותו רגע. בדקו איזה משתנה מופיע אחרי הסימן /.', 'The line divides by a number that is 0 at that moment. Check which variable comes after the / sign.'),
  OM: tr('התוכנית ביקשה יותר זיכרון ממה שיש: רשימה (DIM) ענקית, יותר מדי GOSUB בלי RETURN, או לולאה שלא נגמרת.', 'The program asked for more memory than there is: a huge list (DIM), too many GOSUBs without RETURN, or a loop that never ends.'),
  FC: tr('הפקודה קיבלה מספר שהיא לא יכולה לעבוד איתו. למשל CLS 9 (יש רק 0 עד 8), SOUND 0, או מספר שלילי איפה שאסור.', 'The command got a number it can\'t work with. For example CLS 9 (there are only 0 to 8), SOUND 0, or a negative number where it isn\'t allowed.'),
  ID: tr('INPUT עובד רק בתוך תוכנית. כתבו אותו בשורה עם מספר, למשל 10 INPUT A, ואז RUN.', 'INPUT works only inside a program. Write it on a numbered line, for example 10 INPUT A, then RUN.'),
  BS: tr('ניסיתם לגשת לתא ברשימה שלא קיים. בלי DIM לרשימה יש רק תאים 0 עד 10. עם DIM A(20) יש 0 עד 20.', 'You tried to use a place in a list that doesn\'t exist. Without DIM a list has only places 0 to 10. With DIM A(20) it has 0 to 20.'),
  DD: tr('אותה רשימה הוגדרה פעמיים עם DIM. מגדירים רשימה פעם אחת, בתחילת התוכנית, או CLEAR לפני.', 'The same list was defined twice with DIM. Define a list once, at the start of the program, or use CLEAR first.'),
  CN: tr('CONT ממשיך תוכנית שנעצרה ב-STOP או ב-BREAK. אחרי שינוי בתוכנית, או בלי שהייתה עצירה, אין ממה להמשיך. הקלידו RUN.', 'CONT carries on a program that stopped with STOP or BREAK. After the program was changed, or if nothing stopped, there\'s nothing to carry on. Type RUN.'),
  OV: tr('יצא מספר גדול מדי בשביל המחשב.', 'The result was a number too big for the computer.'),
  UF: tr('נעשה שימוש ב-FN שלא הוגדר. קודם כותבים DEF FNA(X)=..., ורק אחר כך FNA(3).', 'An FN was used that wasn\'t defined. First write DEF FNA(X)=..., and only then FNA(3).')
};
const CTX = {
  tape: tr('אין קלטת בשם הזה. על המדף יש למשל LANDER, GUESS ו-QUIZ: הקלידו CLOAD "LANDER". גם קלטת ששמרתם עם CSAVE מופיעה על המדף.', 'There is no tape with that name. The shelf has, for example, LANDER, GUESS and QUIZ: type CLOAD "LANDER". A tape you saved with CSAVE is on the shelf too.'),
  'csave-name': tr('CSAVE צריך שם במרכאות, למשל CSAVE "SHIR".', 'CSAVE needs a name in quotes, for example CSAVE "SONG".'),
  'csave-bad': tr('השם של קלטת: עד 8 אותיות באנגלית או ספרות, בלי רווחים. למשל CSAVE "GAME1".', 'A tape name: up to 8 letters or digits, no spaces. For example CSAVE "GAME1".'),
  'csave-empty': tr('אין תוכנית בזיכרון לשמור. קודם כותבים שורות עם מספרים.', 'There is no program in memory to save. First write some numbered lines.'),
  csave: tr('יש כבר 6 קלטות שמורות. מחקו אחת על המדף (✕) כדי לפנות מקום.', 'There are already 6 saved tapes. Delete one on the shelf (✕) to make room.'),
  edit: tr('אין שורה עם המספר הזה. LIST מראה אילו שורות יש.', 'There is no line with that number. LIST shows which lines there are.')
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
  if (/▒/.test(line)) hints.push(tr('יש בשורה תווים שהמחשב לא מכיר (הם מופיעים כריבועים). ה-Dragon יודע רק אותיות באנגלית, ספרות וסימנים.', 'The line has characters the computer doesn\'t know (they show as squares). The Dragon only knows English letters, digits and symbols.'));
  if ((line.match(/"/g) || []).length % 2) hints.push(tr('חסרות מרכאות סוגרות: כל מילה שמדפיסים צריכה " בהתחלה וגם בסוף.', 'A closing quote is missing: every word you print needs " at the start and at the end.'));
  const bare = line.replace(/"[^"]*"?/g, '');
  const open = (bare.match(/\(/g) || []).length, close = (bare.match(/\)/g) || []).length;
  if (open !== close) hints.push(open > close ? tr('חסר סוגר ")". לכל "(" צריך ")" משלו.', 'A ")" is missing. Every "(" needs its own ")".') : tr('יש ")" אחד יותר מדי.', 'There is one ")" too many.'));
  if (/==/.test(bare)) hints.push(tr('ב-BASIC משווים עם = אחד, למשל IF A=5 THEN 100.', 'In BASIC you compare with a single =, for example IF A=5 THEN 100.'));
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
    hints.push(best ? tr(`המחשב לא מכיר את המילה ${w}. אולי התכוונתם ל-${best}?`, `The computer doesn't know the word ${w}. Did you mean ${best}?`)
      : tr(`המחשב לא מכיר את המילה ${w}. במדריך יש את כל הפקודות.`, `The computer doesn't know the word ${w}. The guide lists all the commands.`));
    break;
  }
  if (/\bIF\b/.test(bare) && !/\bTHEN\b|\bGOTO\b/.test(bare)) hints.push(tr('אחרי IF והתנאי צריך THEN, למשל IF A>5 THEN PRINT "BIG".', 'After IF and the condition you need THEN, for example IF A>5 THEN PRINT "BIG".'));
  if (/\bFOR\b/.test(bare) && !/\bTO\b/.test(bare)) hints.push(tr('FOR צריך גם TO, למשל FOR I=1 TO 10.', 'FOR also needs TO, for example FOR I=1 TO 10.'));
  if (!hints.length) hints.push(tr('בדקו את הכתיב של כל מילה, את המרכאות ואת הסוגריים. הרבה פעמים זו אות אחת שהתחלפה.', 'Check the spelling of every word, the quotes and the brackets. Often it\'s just one wrong letter.'));
  return hints;
}

// טקסט עברי עם פקודות באנגלית: כל קטע לועזי עטוף ב-bdi, כדי שהמרכאות והנקודות לא יקפצו למקום הלא נכון
export function rich(el, text) {
  // בעברית: כל רצף לטיני הוא קוד (משמאל לימין, בגופן המחשב). באנגלית: רק מה שנראה כמו BASIC (מילים באותיות גדולות, מרכאות, שגיאות)
  const re = EN ? /\?[A-Z/0]{1,2} ERROR(?: IN \d+)?|"[^"]*"|\b\d+ [A-Z]{2,}[A-Z0-9$"=<>()+\-*/,'?# ]*[A-Z0-9$")]|\b[A-Z][A-Z0-9]*\$?(?:\([^)]*\))?(?=[^a-z]|$)(?<=[A-Z0-9$)]{2,})/g
    : /[A-Za-z0-9"(?$✕][A-Za-z0-9$"=<>()+\-*/,.'?# ]*[A-Za-z0-9$")✕]|[A-Za-z0-9$✕]/g;
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
  box.innerHTML = '<button type="button" class="d32-helper-x" aria-label="' + tr('סגירת ההסבר', 'Close the explanation') + '">✕</button><p class="d32-helper-title"></p><pre class="d32-helper-line" dir="ltr"></pre><ul class="d32-helper-tips"></ul>';
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
    b.textContent = tr('💡 מה קרה? ', '💡 What happened? ');
    const err = document.createElement('bdi');
    err.dir = 'ltr';
    err.textContent = '?' + code + ' ERROR';
    // שתי שורות, כדי שהעברית והאנגלית לא יתערבבו: "מה קרה?", ומתחת השם בעברית ואחריו השגיאה עצמה
    title.append(b, document.createElement('br'));
    rich(title, (NAMES[code] || tr('שגיאה', 'Error')) + (lineNo !== undefined ? tr(', בשורה ', ', in line ') + lineNo : '') + ' ');
    title.append('(', err, ')');
    lineBox.hidden = !line;
    lineBox.textContent = line;
    let list;
    if (ctx && CTX[ctx]) list = [CTX[ctx]];
    else if (code === 'SN') list = line ? syntaxHints(line.replace(/^\d+\s*/, '')) : [tr('המחשב לא הבין את הפקודה. בדקו את הכתיב, את המרכאות ואת הסוגריים.', 'The computer didn\'t understand the command. Check the spelling, the quotes and the brackets.')];
    else if (code === 'UL' && line) {
      const miss = [...line.replace(/"[^"]*"?/g, '').matchAll(/(?:GO\s*TO|GO\s*SUB|THEN|ELSE)\s*([\d\s,]+)/g)]
        .flatMap(m => m[1].split(',').map(x => x.trim()).filter(Boolean)).filter(n => !machine.programText().split('\n').some(l => l.startsWith(n + ' ')));
      list = [miss.length ? tr(`השורה קופצת לשורה ${miss[0]}, ואין בתוכנית שורה כזאת.`, `The line jumps to line ${miss[0]}, and there is no such line in the program.`) : TIPS.UL,
        tr('LIST מראה את כל מספרי השורות שיש.', 'LIST shows all the line numbers there are.')];
    } else list = [TIPS[code] || tr('בדקו את השורה, ונסו שוב.', 'Check the line and try again.')];
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
    b.textContent = why === 'break' ? tr('⏸ עצרתם את התוכנית. אולי זה מה שלא עבד:', '⏸ You stopped the program. Maybe this is what went wrong:') : tr('🔍 בדיקת התוכנית', '🔍 Program check');
    title.append(b);
    if (why === 'check' && machine.programText()) {
      const nb = found.filter(f => f.kind === 'bug').length, nt = found.length - nb;
      title.append(' ' + (EN
        ? (nb || nt ? `I found ${nb ? (nb === 1 ? 'one thing that probably won\'t work' : nb + ' things that probably won\'t work') : ''}${nb && nt ? ' and ' : ''}${nt ? (nt === 1 ? 'one tip' : nt + ' tips') : ''}.` : 'No known mistakes found 👍')
        : (nb || nt ? `מצאתי ${nb ? (nb === 1 ? 'דבר אחד שכנראה לא יעבוד' : nb + ' דברים שכנראה לא יעבדו') : ''}${nb && nt ? ', ו' : ''}${nt ? (nt === 1 ? 'עצה אחת' : nt + ' עצות') : ''}.` : 'לא מצאתי טעויות מוכרות 👍')));
    }
    lineBox.hidden = true;
    tips.textContent = '';
    const add = (icon, text, line) => {
      const li = document.createElement('li');
      li.className = 'is-' + icon;
      const tag = document.createElement('b');
      tag.textContent = (icon === 'bug' ? '⚠️ ' : '💡 ') + (line != null ? tr('שורה ', 'Line ') + line + ': ' : '');
      li.append(tag);
      rich(li, text);
      tips.appendChild(li);
    };
    if (!machine.programText()) add('tip', tr('אין עדיין תוכנית בזיכרון. כתבו שורות עם מספרים, ואז לחצו שוב.', 'There is no program in memory yet. Write some numbered lines, then press again.'));
    else if (!found.length) {
      add('tip', tr('אם התוכנית לא עושה מה שרציתם, הנה איך מחפשים את הבאג:', 'If the program doesn\'t do what you wanted, here is how to hunt for the bug:'));
      DEBUG_TIPS.forEach(t => add('tip', t));
    } else found.forEach(f => add(f.kind, f.text, f.line));
    box.hidden = false;
    return true;
  }

  return { show, clear, report };
}
