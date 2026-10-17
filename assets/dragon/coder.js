// כלים למתכנת (שלב ב של גרסת המחשב): חלון בצד הטלוויזיה במסך המלא, שמראה את התוכנית שבזיכרון כל הזמן.
// לחיצה על שורה מעלה אותה לתיקון. שמירה לקובץ .bas במחשב, טעינה מקובץ, והדבקה של תוכנית ארוכה מהאינטרנט.
// הכול בדפדפן: שום דבר לא נשלח לשרת.

const MAX_FILE = 64 * 1024;

// תוכנית בלי מספרי שורות (כמו שמעתיקים לפעמים מאתר): ממספרים 10, 20, 30
function numbered(text) {
  const lines = text.replace(/\r/g, '').split('\n').map(l => l.replace(/\s+$/, '')).filter(l => l.trim() !== '');
  if (lines.some(l => /^\s*\d+/.test(l))) return lines.join('\n');
  return lines.map((l, i) => (i + 1) * 10 + ' ' + l.trim()).join('\n');
}
const tapeName = file => (file.replace(/\.[^.]*$/, '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'FILE');

export function createCoder({ root, input, machine, powerOn }) {
  const panel = document.createElement('aside');
  panel.className = 'd32-coder';
  panel.setAttribute('aria-labelledby', 'd32-coder-title');
  panel.innerHTML = `
    <div class="d32-coder-head">
      <h2 id="d32-coder-title">התוכנית בזיכרון</h2>
      <span class="d32-coder-count" role="status"></span>
    </div>
    <div class="d32-coder-tools">
      <button type="button" data-act="save">💾 שמירה לקובץ</button>
      <button type="button" data-act="load">📂 טעינה מקובץ</button>
      <button type="button" data-act="paste">📋 הדבקת תוכנית</button>
      <button type="button" data-act="check">🔍 בדיקת התוכנית</button>
    </div>
    <div class="d32-coder-paste" hidden>
      <label for="d32-coder-text">מדביקים כאן תוכנית BASIC, אפילו ארוכה. אם אין לה מספרי שורות, אמספר אותן.</label>
      <textarea id="d32-coder-text" dir="ltr" rows="8" spellcheck="false" autocomplete="off"></textarea>
      <div class="d32-coder-row">
        <button type="button" data-act="paste-go" class="is-main">לטעון לזיכרון</button>
        <button type="button" data-act="paste-cancel">ביטול</button>
      </div>
    </div>
    <p class="d32-coder-note" role="status"></p>
    <ol class="d32-coder-list" dir="ltr"></ol>
    <p class="d32-coder-empty">אין עדיין תוכנית. כתבו שורה עם מספר, למשל <bdi dir="ltr">10 PRINT "HI"</bdi>, והיא תופיע כאן. לחיצה על שורה מעלה אותה לתיקון.</p>
    <input type="file" class="d32-coder-file" accept=".bas,.txt,text/plain" hidden>`;

  const list = panel.querySelector('.d32-coder-list');
  const count = panel.querySelector('.d32-coder-count');
  const note = panel.querySelector('.d32-coder-note');
  const paste = panel.querySelector('.d32-coder-paste');
  const area = panel.querySelector('textarea');
  const file = panel.querySelector('.d32-coder-file');
  const say = msg => { note.textContent = msg; };
  const back = () => input.focus({ preventScroll: true });

  // התוכנית מוצגת מחדש רק כשהיא משתנה
  let shown = null;
  function refresh() {
    const text = machine.programText();
    if (text === shown) return;
    shown = text;
    list.textContent = '';
    const lines = text ? text.split('\n') : [];
    for (const line of lines) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = line;
      b.title = 'לתקן את השורה';
      li.appendChild(b);
      list.appendChild(li);
    }
    panel.classList.toggle('is-empty', !lines.length);
    count.textContent = lines.length ? lines.length + ' שורות' : '';
  }

  // לחיצה על שורה: היא עולה לשורת ההקלדה, מתקנים ולוחצים Enter (כמו EDIT)
  list.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || machine.running) return;
    input.value = b.textContent;
    input.dispatchEvent(new Event('input'));
    back();
    input.setSelectionRange(input.value.length, input.value.length);
  });

  function save() {
    const text = machine.programText();
    if (!text) { say('אין מה לשמור: הזיכרון ריק.'); back(); return; }
    const d = new Date(), pad = n => String(n).padStart(2, '0');
    const name = `dragon-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.bas`;
    const url = URL.createObjectURL(new Blob([text + '\n'], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    say('נשמר בהורדות בשם ' + name + '. אפשר לטעון אותו בחזרה מתי שרוצים.');
    root.dispatchEvent(new CustomEvent('d32-kept'));
    back();
  }

  function load(text, label) {
    const prog = numbered(text);
    if (!prog) { say('לא מצאתי שורות BASIC בטקסט.'); return false; }
    input.value = '';   // שורה חצי מוקלדת לא נדבקת לפקודה הבאה
    input.dispatchEvent(new Event('input'));
    powerOn().then(() => { machine.loadText(prog, label); refresh(); back(); });
    return true;
  }

  file.addEventListener('change', async () => {
    const f = file.files && file.files[0];
    file.value = '';
    if (!f) return;
    if (f.size > MAX_FILE) { say('הקובץ גדול מדי. ב-Dragon היו 32 קילובייט בסך הכול.'); return; }
    if (load(await f.text(), tapeName(f.name))) say('נטען: ' + f.name + '. הקלידו RUN.');
  });

  panel.addEventListener('click', e => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    if (act === 'save') save();
    else if (act === 'load') file.click();
    else if (act === 'check') { root.querySelector('.d32-check')?.click(); back(); }
    else if (act === 'paste') { paste.hidden = false; area.focus(); say(''); }
    else if (act === 'paste-cancel') { paste.hidden = true; area.value = ''; back(); }
    else if (act === 'paste-go') {
      if (area.value.length > MAX_FILE) { say('התוכנית ארוכה מדי.'); return; }
      if (load(area.value, 'PASTE')) { paste.hidden = true; area.value = ''; say('התוכנית בזיכרון. הקלידו RUN.'); }
    }
  });

  let timer = 0;
  return {
    panel,
    // החלון מתעדכן רק כשהוא פתוח, פעמיים וחצי בשנייה
    start() { refresh(); clearInterval(timer); timer = setInterval(refresh, 400); },
    stop() { clearInterval(timer); timer = 0; }
  };
}
