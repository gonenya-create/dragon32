// "🤖 שאלו את העוזר": חלון שאלות בעברית לעוזר AI אמיתי (Claude), דרך הפונקציה /api/dragon-ai.
// העוזר רואה את התוכנית שבזיכרון ואת השורות האחרונות במסך, מסביר מה לא עובד, ויכול להחזיר תוכנית מתוקנת
// שנטענת למחשב בלחיצה. עד 15 שאלות ביום בדפדפן הזה; התקרה האמיתית (10 דולר בחודש) מוגדרת אצל Anthropic.
import { rich } from './helper.js';

const PER_DAY = 15;
const DAY_KEY = 'd32-ai-day';

function today() { return new Date().toISOString().slice(0, 10); }
function used() {
  try { const d = JSON.parse(localStorage.getItem(DAY_KEY) || '{}'); return d.d === today() ? d.n : 0; } catch { return 0; }
}
function count() { try { localStorage.setItem(DAY_KEY, JSON.stringify({ d: today(), n: used() + 1 })); } catch { /* בלי זיכרון בדפדפן, ממשיכים */ } }

const SAYS = {
  off: 'העוזר נח כרגע, אולי נגמר התקציב החודשי שלו. בינתיים "🔍 בדיקת התוכנית" עובדת תמיד.',
  busy: 'היו הרבה שאלות בזמן קצר. נסו שוב בעוד כמה דקות.',
  fail: 'משהו השתבש בדרך לעוזר. נסו שוב.',
  limit: `זה היה המקסימום להיום (${PER_DAY} שאלות). העוזר יחכה לכם מחר.`
};

export function createAI({ root, machine, input, powerOn }) {
  const box = document.createElement('section');
  box.className = 'd32-ai';
  box.setAttribute('aria-labelledby', 'd32-ai-title');
  box.innerHTML = `
    <h2 id="d32-ai-title">🤖 שאלו את העוזר</h2>
    <p class="d32-ai-note">עוזר AI אמיתי (Claude). הוא רואה את התוכנית ואת המסך, מסביר מה לא עובד, ויכול לכתוב תוכנית. השאלה, התוכנית והמסך נשלחים ל-Anthropic כדי לענות, אז לא לכתוב פרטים אישיים. עד ${PER_DAY} שאלות ביום.</p>
    <div class="d32-ai-log" aria-live="polite"></div>
    <form class="d32-ai-form">
      <label for="d32-ai-q" class="visually-hidden">השאלה לעוזר</label>
      <textarea id="d32-ai-q" rows="2" maxlength="600" placeholder="למשל: רציתי שהתוכנית תדפיס 1 עד 5, למה היא מדפיסה רק 1?"></textarea>
      <button type="submit">שליחה</button>
    </form>`;
  root.querySelector('.d32-helper').after(box);
  const log = box.querySelector('.d32-ai-log');
  const form = box.querySelector('form');
  const area = box.querySelector('textarea');
  const send = box.querySelector('button[type="submit"]');
  const history = [];

  function bubble(role, text, program) {
    const div = document.createElement('div');
    div.className = 'd32-ai-msg is-' + role;
    for (const line of String(text).split('\n')) {
      // שורת קוד (אנגלית בלבד, בלי עברית) מוצגת משמאל לימין בגופן של המחשב
      if (line.trim() && !/[֐-׿]/.test(line) && /^[\sA-Z0-9?"'@(]/.test(line)) {
        const pre = document.createElement('pre');
        pre.dir = 'ltr';
        pre.textContent = line;
        div.appendChild(pre);
      } else if (line.trim()) {
        const p = document.createElement('p');
        rich(p, line);
        div.appendChild(p);
      }
    }
    if (program) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'd32-ai-load';
      b.textContent = '⌨ לטעון את התוכנית למחשב';
      b.addEventListener('click', () => powerOn().then(() => {
        machine.loadText(program, 'HELPER');
        b.textContent = '✓ נטענה. הקלידו RUN';
        input.focus({ preventScroll: true });
      }));
      div.appendChild(b);
    }
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }

  async function ask(question) {
    if (used() >= PER_DAY) { bubble('note', SAYS.limit); return; }
    bubble('user', question);
    const wait = bubble('note', 'העוזר חושב…');
    wait.classList.add('is-wait');
    send.disabled = true;
    const screen = (root.querySelector('.d32-out')?.textContent || '').split('\n').slice(-16).join('\n');
    try {
      const r = await fetch('/api/dragon-ai/', {   // עם לוכסן: האתר מוסיף אותו לכל כתובת (trailingSlash)
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question, program: machine.programText(), screen, history })
      });
      const data = await r.json().catch(() => ({}));
      wait.remove();
      if (!r.ok) { bubble('note', SAYS[data.error] || SAYS.fail); return; }
      count();
      history.push({ role: 'user', text: question }, { role: 'assistant', text: data.reply });
      while (history.length > 6) history.shift();
      bubble('assistant', data.reply, data.program && /^\s*\d+/.test(data.program) ? data.program : '');
    } catch {
      wait.remove();
      bubble('note', SAYS.fail);
    } finally {
      send.disabled = false;
    }
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = area.value.trim();
    if (!q || send.disabled) return;
    area.value = '';
    ask(q);
  });
  // Enter שולח, Shift+Enter יורד שורה
  area.addEventListener('keydown', e => {
    e.stopPropagation();   // המקשים כאן לא מגיעים למחשב או למשחק
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); }
  });
  return { ask };
}
