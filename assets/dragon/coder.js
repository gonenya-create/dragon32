import { tr } from './lang.js';
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
      <h2 id="d32-coder-title">${tr('התוכנית בזיכרון', 'Program in memory')}</h2>
      <span class="d32-coder-count" role="status"></span>
    </div>
    <div class="d32-coder-tools">
      <button type="button" data-act="save">💾 ${tr('שמירה לקובץ', 'Save to file')}</button>
      <button type="button" data-act="load">📂 ${tr('טעינה מקובץ', 'Load from file')}</button>
      <button type="button" data-act="paste">📋 ${tr('הדבקת תוכנית', 'Paste a program')}</button>
      <button type="button" data-act="check">🔍 ${tr('בדיקת התוכנית', 'Check the program')}</button>
    </div>
    <div class="d32-coder-paste" hidden>
      <label for="d32-coder-text">${tr('מדביקים כאן תוכנית BASIC, אפילו ארוכה. אם אין לה מספרי שורות, אמספר אותן.', 'Paste a BASIC program here, even a long one. If it has no line numbers, I will number it.')}</label>
      <textarea id="d32-coder-text" dir="ltr" rows="8" spellcheck="false" autocomplete="off"></textarea>
      <div class="d32-coder-row">
        <button type="button" data-act="paste-go" class="is-main">${tr('לטעון לזיכרון', 'Load into memory')}</button>
        <button type="button" data-act="paste-cancel">${tr('ביטול', 'Cancel')}</button>
      </div>
    </div>
    <p class="d32-coder-note" role="status"></p>
    <ol class="d32-coder-list" dir="ltr" lang="en"></ol>
    <p class="d32-coder-empty">${tr('אין עדיין תוכנית. כתבו שורה עם מספר, למשל <bdi dir="ltr">10 PRINT "HI"</bdi>, והיא תופיע כאן. לחיצה על שורה מעלה אותה לתיקון.', 'No program yet. Type a numbered line, e.g. <bdi dir="ltr">10 PRINT "HI"</bdi>, and it will appear here. Click a line to edit it.')}</p>
    <input type="file" class="d32-coder-file" accept=".bas,.txt,text/plain" hidden>`;

  const list = panel.querySelector('.d32-coder-list');
  const count = panel.querySelector('.d32-coder-count');
  const note = panel.querySelector('.d32-coder-note');
  const paste = panel.querySelector('.d32-coder-paste');
  const area = panel.querySelector('textarea');
  const file = panel.querySelector('.d32-coder-file');
  let saidAt = 0;
  const say = msg => { note.textContent = msg; saidAt = Date.now(); };
  const back = () => input.focus({ preventScroll: true });

  // התוכנית מוצגת מחדש רק כשהיא משתנה
  let shown = null;
  function refresh() {
    const text = machine.programText();
    if (text === shown) return;
    // התוכנית השתנתה: הודעות ישנות ("נטען", "הקישור הועתק") כבר לא נכונות
    if (shown !== null && Date.now() - saidAt > 2000) {
      note.textContent = '';
      const sn = root.querySelector('.d32-share-note');
      if (sn) sn.textContent = '';
    }
    shown = text;
    list.textContent = '';
    const lines = text ? text.split('\n') : [];
    for (const line of lines) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = line;
      b.title = tr('לתקן את השורה', 'Edit this line');
      li.appendChild(b);
      list.appendChild(li);
    }
    panel.classList.toggle('is-empty', !lines.length);
    count.textContent = lines.length === 1 ? tr('שורה אחת', '1 line') : lines.length ? lines.length + tr(' שורות', ' lines') : '';
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
    if (!text) { say(tr('אין מה לשמור: הזיכרון ריק.', 'Nothing to save: memory is empty.')); back(); return; }
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
    say(tr('נשמר בהורדות בשם ', 'Saved to Downloads as ') + name + tr('. אפשר לטעון אותו בחזרה מתי שרוצים.', '. You can load it back any time.'));
    root.dispatchEvent(new CustomEvent('d32-kept'));
    back();
  }

  function load(text, label) {
    const prog = numbered(text);
    if (!prog) { say(tr('לא מצאתי שורות BASIC בטקסט.', 'No BASIC lines found in that text.')); return false; }
    input.value = '';   // שורה חצי מוקלדת לא נדבקת לפקודה הבאה
    input.dispatchEvent(new Event('input'));
    powerOn().then(() => { machine.loadText(prog, label); refresh(); back(); });
    return true;
  }

  file.addEventListener('change', async () => {
    const f = file.files && file.files[0];
    file.value = '';
    if (!f) return;
    if (f.size > MAX_FILE) { say(tr('הקובץ גדול מדי. ב-Dragon היו 32 קילובייט בסך הכול.', 'The file is too big. The Dragon only had 32 kilobytes in total.')); return; }
    if (load(await f.text(), tapeName(f.name))) say(tr('נטען: ', 'Loaded: ') + f.name + tr('. הקלידו RUN.', '. Type RUN.'));
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
      if (area.value.length > MAX_FILE) { say(tr('התוכנית ארוכה מדי.', 'The program is too long.')); return; }
      if (load(area.value, 'PASTE')) { paste.hidden = true; area.value = ''; say(tr('התוכנית בזיכרון. הקלידו RUN.', 'The program is in memory. Type RUN.')); }
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
