// כיתת הלימוד "לומדים בייסיק עם הדרקון": 30 שיעורים בתשע רמות (lessons/lessons.json, הטקסטים של המנהל העליון כמו שהם),
// לצד המחשב של האפליקציה. כל שורה: "הקלד בשבילי" (המחשב מקליד אותה) ו"העתקה". התקדמות: כוכב לכל שיעור שסיימתם,
// נשמר בדפדפן הזה. השיעור הנוכחי בכתובת: #3 = שיעור 3.
const EN = (document.documentElement.lang || '').startsWith('en');
const T = (he, en) => (EN ? en : he);
const L = EN ? 'en' : 'he';
const DONE_KEY = 'd32-lessons-done';
const app = document.getElementById('lesson-app');
const computer = document.getElementById('lesson-computer');

function done() { try { return new Set(JSON.parse(localStorage.getItem(DONE_KEY)) || []); } catch { return new Set(); } }
function setDone(n, on) {
  const s = done();
  on ? s.add(n) : s.delete(n);
  try { localStorage.setItem(DONE_KEY, JSON.stringify([...s])); } catch { /* בלי זיכרון בדפדפן */ }
}

// טקסט עם מילים באנגלית: כל רצף לטיני מבודד (bdi), ופקודות BASIC באותיות גדולות בכתב מכונה
function rich(text) {
  const frag = document.createDocumentFragment();
  if (EN) { frag.append(text); return frag; }   // באנגלית אין מה לבודד
  // רצף של "מילים" לטיניות (עם ספרות וסימני קוד), מופרדות ברווח אחד
  const re = /[$"*;:@()=<>+\-\/.?!'#&%]*[A-Za-z0-9][A-Za-z0-9$"*;:@()=<>+\-\/.?!'#&%]*(?: [$"*;:@()=<>+\-\/.?!'#&%]*[A-Za-z0-9][A-Za-z0-9$"*;:@()=<>+\-\/.?!'#&%]*)*/g;   // כל מילה חייבת אות או ספרה, כדי שסוגר לבד לא ייגרר
  let at = 0, m;
  while ((m = re.exec(text))) {
    let w = m[0];
    if (!/[A-Za-z]/.test(w)) continue;   // מספר בלבד: נשאר בטקסט
    // סימני פיסוק בסוף שייכים למשפט העברי
    const tail = /[.?!]+$/.exec(w);
    if (tail && !/"/.test(w)) w = w.slice(0, -tail[0].length);
    if (m.index > at) frag.append(text.slice(at, m.index));
    const kw = /[A-Z]/.test(w) && !/[a-z]/.test(w);
    const el = document.createElement(kw ? 'code' : 'bdi');
    if (kw) el.dir = 'ltr';
    el.textContent = w;
    frag.append(el);
    at = m.index + w.length;
  }
  if (at < text.length) frag.append(text.slice(at));
  return frag;
}
const el = (tag, cls, kids) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const k of [].concat(kids || [])) e.append(k);
  return e;
};

// המחשב: מחכים שהאפליקציה תתחבר אליו, מדליקים, ומקלידים
function whenReady() {
  return new Promise(ok => { const t = setInterval(() => { if (computer.d32) { clearInterval(t); ok(computer.d32); } }, 100); });
}
async function type(lines) {
  const d = await whenReady();
  const r = computer.getBoundingClientRect();
  if (r.top < 0 || r.bottom > innerHeight) computer.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  await d.powerOn();
  d.typeLines(lines);
}
function codeButtons(lines, { run = false, label } = {}) {
  const row = el('p', 'lesson-actions');
  const typeB = el('button', 'lesson-btn lesson-type', label || (run ? T('▶ הקלד הכול והרץ', '▶ Type it all and RUN') : T('⌨️ הקלד בשבילי', '⌨️ Type it for me')));
  typeB.type = 'button';
  typeB.addEventListener('click', () => type(run ? ['NEW', ...lines, 'RUN'] : lines));
  const copyB = el('button', 'lesson-btn lesson-copy', T('📋 העתקה', '📋 Copy'));
  copyB.type = 'button';
  const note = el('span', 'lesson-copied');
  note.setAttribute('role', 'status');
  copyB.addEventListener('click', async () => {
    let ok = true;
    try { await navigator.clipboard.writeText(lines.join('\n') + '\n'); } catch { ok = false; }
    note.textContent = ok ? T('הועתק ✓', 'Copied ✓') : T('לא הצלחתי להעתיק', 'Could not copy');
    setTimeout(() => { note.textContent = ''; }, 3000);
  });
  row.append(typeB, ' ', copyB, ' ', note);
  return row;
}
const printout = lines => { const p = el('pre', 'printout'); p.dir = 'ltr'; p.lang = 'en'; p.textContent = lines.join('\n'); return p; };

let LESSONS = [];
// שני משחקים נבנים שיעור אחרי שיעור: "דרקון הזהב" (15-20) ו-DRAGFLY (27-30). כל שיעור מוסיף שורות או מחליף שורות
// (לפי מספר השורה). "הקלד הכול והרץ" מקליד את כל המשחק עד עכשיו, והפתרון של האתגר נכנס לתוכו
const GAMES = [[15, 20], [27, 30]];
const gameOf = n => GAMES.find(([a, b]) => n >= a && n <= b);
const lineNo = s => parseInt(s, 10);
function merge(base, add) {
  const m = new Map(base.map(x => [lineNo(x), x]));
  for (const x of add) m.set(lineNo(x), x);
  return [...m.keys()].sort((a, b) => a - b).map(k => m.get(k));
}
const stepLines = l => l[L].steps.flatMap(s => s.code.split('\n').filter(Boolean));
function program(n) {
  const own = stepLines(LESSONS[n - 1]);
  const g = gameOf(n);
  return g && n > g[0] ? merge(program(n - 1), own) : own;
}
function current() {
  const n = parseInt(location.hash.slice(1), 10);
  if (n >= 1 && n <= LESSONS.length) return n;
  const d = done();
  const next = LESSONS.find(l => !d.has(l.n));
  return next ? next.n : 1;
}

// סולם הרמות (המנהל העליון, 25.10): צבע, שם, ואילו שיעורים
const LEVELS = [
  ['🟢', 'צעדים ראשונים', 'First steps', 1, 2],
  ['🟡', 'החלטות ולולאות', 'Decisions and loops', 3, 4],
  ['🟠', 'צליל, צבע וציור', 'Sound, colour and drawing', 5, 7],
  ['🔴', 'משחקים קטנים', 'Little games', 8, 10],
  ['🟣', 'מתכנתים', 'Programmers', 11, 14],
  ['⚫', 'בונים משחק: דרקון הזהב', 'Building a game: Dragon Gold', 15, 19],
  ['🏆', 'הפרויקט הגמור', 'The finished project', 20, 20],
  ['🔷', 'גרפיקה וצלילים', 'Graphics and sound', 21, 26],
  ['🐉', 'בונים משחק גרפי: DRAGFLY', 'Building a graphics game: DRAGFLY', 27, 30]
];
function renderProgress(n) {
  const bar = document.getElementById('lesson-progress');
  bar.textContent = '';
  const d = done();
  for (const [icon, he, en, from, to] of LEVELS) {
    const ls = LESSONS.filter(l => l.n >= from && l.n <= to);
    if (!ls.length) continue;
    const row = el('div', 'level' + (n >= from && n <= to ? ' is-here' : ''));
    const name = el('p', 'level-name', [el('span', 'level-icon', icon), ' ', T(he, en)]);
    const range = el('bdi', 'level-range', from === to ? String(from) : from + '–' + to);
    range.dir = 'ltr';
    name.append(' ', range);
    const tiles = el('div', 'level-tiles');
    row.append(name, tiles);
    bar.append(row);
    for (const l of ls) tiles.append(tile(l, n, d));
  }
  const count = document.getElementById('lesson-count');
  count.textContent = T(`סיימתם ${d.size} מתוך ${LESSONS.length}`, `${d.size} of ${LESSONS.length} done`);
}
function tile(l, n, d) {
    const a = el('a', 'tile' + (l.n === n ? ' is-current' : '') + (d.has(l.n) ? ' is-done' : ''));
    a.href = '#' + l.n;
    a.setAttribute('aria-label', T('שיעור ', 'Lesson ') + l.n + (d.has(l.n) ? T(' (סיימתם)', ' (done)') : ''));
    if (l.n === n) a.setAttribute('aria-current', 'step');
    a.append(el('span', 'tile-n', String(l.n)));
    if (d.has(l.n)) a.append(el('span', 'tile-star', '★'));
    return a;
}

function render() {
  const n = current();
  const lesson = LESSONS[n - 1], x = lesson[L];
  renderProgress(n);
  document.title = x.title.replace(/^(שיעור|Lesson) \d+: /, '') + T(' — לומדים בייסיק עם הדרקון', ' — BASIC with the Dragon');
  app.textContent = '';

  const head = el('header', 'lesson-head');
  head.append(el('p', 'lesson-no', T('שיעור ', 'Lesson ') + n), el('h2', 'lesson-title', rich(x.title.replace(/^(שיעור|Lesson) \d+: /, ''))));
  app.append(head, el('p', 'lesson-intro', rich(x.intro)));

  // השלבים: כל שורה מודפסת על נייר מחשב, עם הסבר וכפתורים
  const steps = el('ol', 'lesson-steps');
  const all = [];
  for (const s of x.steps) {
    const lines = s.code.split('\n').filter(Boolean);
    all.push(...lines);
    steps.append(el('li', 'step', [printout(lines), codeButtons(lines), el('p', 'step-explain', rich(s.explain))]));
  }
  app.append(el('h3', 'lesson-h', T('מקלידים שורה אחרי שורה', 'Type it line by line')), steps);

  // מריצים: מה יופיע על המסך (שורות באותיות גדולות = פלט המחשב)
  const run = el('section', 'lesson-run');
  run.append(el('h3', 'lesson-h', T('מריצים', 'Run it')));
  let screen = null;
  for (const line of x.run.split('\n')) {
    if (/^[A-Z0-9 !?.,:;=*"'#$%&()+\-\/<>@]+$/.test(line.trim()) && /[A-Z0-9]/.test(line)) {
      if (!screen) { screen = el('pre', 'mini-screen'); screen.dir = 'ltr'; screen.lang = 'en'; run.append(screen); }
      screen.textContent += (screen.textContent ? '\n' : '') + line;
    } else { screen = null; run.append(el('p', '', rich(line))); }
  }
  const g = gameOf(n), builds = !!g && n > g[0];
  if (builds) {
    // הלוח מראה רק את השורות החדשות; כאן כל המשחק עד עכשיו
    const whole = el('details', 'whole-program');
    whole.append(el('summary', '', T('📜 כל התוכנית עד עכשיו', '📜 The whole program so far')), printout(program(n)));
    run.append(el('p', '', rich(T('השורות של השיעור הזה נכנסות לתוכנית מהשיעור הקודם. הכפתור מקליד את כל המשחק מההתחלה.', 'This lesson\'s lines go into the program from the last lesson. The button types the whole game from the start.'))), whole);
  }
  run.append(codeButtons(builds ? program(n) : all, { run: true }));
  app.append(run);

  app.append(el('aside', 'sticky-note', [el('strong', '', T('טיפ', 'Tip')), el('p', '', rich(x.tip))]));

  // שיעורי בית: אתגר, והפתרון מוסתר
  const hw = el('section', 'homework');
  hw.append(el('h3', 'lesson-h', T('אתגר', 'Challenge')), el('p', '', rich(x.challenge)));
  const sol = el('details', 'solution');
  const solution = g ? merge(program(n), x.challengeCode) : x.challengeCode;
  sol.append(el('summary', '', T('הצגת פתרון', 'Show a solution')), printout(x.challengeCode), codeButtons(solution, { run: true }));
  hw.append(sol);
  app.append(hw);

  // סיום: כוכב, והשיעור הבא
  const end = el('footer', 'lesson-end');
  const isDone = done().has(n);
  const mark = el('button', 'lesson-btn lesson-done' + (isDone ? ' is-done' : ''), isDone ? T('★ סיימתם את השיעור', '★ Lesson done') : T('☆ סיימתי את השיעור', '☆ I finished this lesson'));
  mark.type = 'button';
  mark.setAttribute('aria-pressed', String(isDone));
  mark.addEventListener('click', () => { setDone(n, !done().has(n)); render(); });
  end.append(mark);
  if (n < LESSONS.length) {
    end.append(el('p', 'next-teaser', rich(x.nextTeaser)));
    const next = el('a', 'lesson-btn lesson-next', T('לשיעור הבא ←', 'Next lesson →'));
    next.href = '#' + (n + 1);
    end.append(next);
  } else end.append(el('p', 'next-teaser', rich(x.nextTeaser)));
  if (n > 1) { const prev = el('a', 'lesson-prev', T('→ לשיעור הקודם', '← Previous lesson')); prev.href = '#' + (n - 1); end.append(prev); }
  app.append(end);
}

fetch('/lessons/lessons.json').then(r => r.json()).then(d => {
  LESSONS = d;
  render();
  addEventListener('hashchange', () => { render(); document.getElementById('lesson-progress').scrollIntoView({ block: 'nearest' }); });
}).catch(() => { app.textContent = T('לא הצלחתי לטעון את השיעורים. נסו לרענן את הדף.', 'Could not load the lessons. Try reloading the page.'); });
