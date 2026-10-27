// "🤖 שאלו את העוזר": חלון שאלות בעברית לעוזר AI אמיתי (Claude), דרך הפונקציה /api/dragon-ai.
// העוזר רואה את התוכנית שבזיכרון ואת השורות האחרונות במסך, מסביר מה לא עובד, ויכול להחזיר תוכנית מתוקנת
// שנטענת למחשב בלחיצה. עד 15 שאלות ביום בדפדפן הזה; התקרה האמיתית (50 דולר בחודש) מוגדרת אצל Anthropic.
import { rich } from './helper.js';
import { tr, EN } from './lang.js';

const PER_DAY = 15;
const DAY_KEY = 'd32-ai-day';

function today() { return new Date().toISOString().slice(0, 10); }
function used() {
  try { const d = JSON.parse(localStorage.getItem(DAY_KEY) || '{}'); return d.d === today() ? d.n : 0; } catch { return 0; }
}
function count() { try { localStorage.setItem(DAY_KEY, JSON.stringify({ d: today(), n: used() + 1 })); } catch { /* בלי זיכרון בדפדפן, ממשיכים */ } }

const SAYS = {
  off: tr('העוזר נח כרגע, אולי נגמר התקציב החודשי שלו. בינתיים "🔍 בדיקת התוכנית" עובדת תמיד.', 'The helper is resting right now, maybe its monthly budget ran out. "🔍 Check the program" always works.'),
  busy: tr('היו הרבה שאלות בזמן קצר. נסו שוב בעוד כמה דקות.', 'Lots of questions in a short time. Try again in a few minutes.'),
  resting: tr('העוזר נח להיום: היו היום הרבה שאלות מכל העולם. הוא חוזר מחר. בינתיים "🔍 בדיקת התוכנית" עובדת תמיד.', 'The helper is resting for today: lots of questions from around the world. It will be back tomorrow. "🔍 Check the program" always works.'),
  fail: tr('משהו השתבש בדרך לעוזר. נסו שוב.', 'Something went wrong on the way to the helper. Try again.'),
  limit: tr(`זה היה המקסימום להיום (${PER_DAY} שאלות). העוזר יחכה לכם מחר.`, `That's today's maximum (${PER_DAY} questions). The helper will be here tomorrow.`)
};

export function createAI({ root, machine, input, powerOn }) {
  const box = document.createElement('section');
  box.className = 'd32-ai';
  box.setAttribute('aria-labelledby', 'd32-ai-title');
  box.innerHTML = `
    <h2 id="d32-ai-title">🤖 ${tr('שאלו את העוזר', 'Ask the helper')}</h2>
    <details class="d32-ai-note"><summary>${tr('עוזר AI (Claude) שרואה את התוכנית ואת המסך. בלי פרטים אישיים.', 'An AI helper (Claude) that sees your program and the screen. No personal details, please.')}</summary>
      <p>${tr(`הוא מסביר מה לא עובד, עונה על שאלות, ויכול לכתוב תוכנית. השאלה, התוכנית והמסך נשלחים ל-Anthropic כדי לענות. עד ${PER_DAY} שאלות ביום.`, `It explains what isn't working, answers questions, and can write a program. The question, the program and the screen are sent to Anthropic to answer. Up to ${PER_DAY} questions a day.`)}</p></details>
    <form class="d32-ai-form">
      <label for="d32-ai-q" class="visually-hidden">${tr('השאלה לעוזר', 'Your question')}</label>
      <textarea id="d32-ai-q" rows="3" maxlength="600" placeholder="${tr('שאלו בעברית, למשל: למה יש שגיאה?', 'Ask anything, e.g. why is there an error?')}"></textarea>
      <button type="submit">${tr('שליחה', 'Send')}</button>
    </form>
    <label class="d32-ai-quick"><span class="visually-hidden">${tr('שאלה מוכנה', 'Ready-made question')}</span><select><option value="">💬 ${tr('שאלות מוכנות…', 'Ready-made questions…')}</option></select></label>
    <div class="d32-ai-log" aria-live="polite"></div>
    <nav class="d32-pages d32-pages-side" aria-label="${tr('עוד באתר', 'More on the site')}"><a href="${tr('/lessons/', '/en/lessons/')}"><span aria-hidden="true">🎓</span> ${tr('לומדים בייסיק', 'Learn BASIC')}</a><a href="${tr('/story/', '/en/story/')}"><span aria-hidden="true">📜</span> ${tr('יומן המסע', 'The journey')}</a><a href="${tr('/magazine/', '/en/magazine/')}"><span aria-hidden="true">📰</span> ${tr('מה קראו בעלי <bdi dir="ltr">Dragon</bdi>', 'What Dragon Owners Were Reading')}</a><a href="${tr('/adverts/', '/en/adverts/')}"><span aria-hidden="true">📺</span> ${tr('הפרסומות', 'The adverts')}</a><a href="${tr('/dragon-history/', '/en/dragon-history/')}"><span aria-hidden="true">🐉</span> ${tr('ההיסטוריה של ה-<bdi dir="ltr">Dragon</bdi>', 'The history of the <bdi dir="ltr">Dragon</bdi>')}</a></nav>
    <p class="d32-legal"><a href="${tr('/accessibility/', '/en/accessibility/')}">${tr('נגישות', 'Accessibility')}</a> · <a href="${tr('/privacy/', '/en/privacy/')}">${tr('פרטיות', 'Privacy')}</a></p>`;
  root.querySelector('.d32-helper').after(box);
  const log = box.querySelector('.d32-ai-log');
  const form = box.querySelector('form');
  const area = box.querySelector('textarea');
  const send = box.querySelector('button[type="submit"]');
  const history = [];
  // שאלות מוכנות ברשימה נפתחת (שורה אחת), כדי שלתשובות יישאר מקום. בחירה שולחת מיד
  const QUICK = tr(['למה יש שגיאה?', 'מה התוכנית שלי עושה?', 'תכתוב לי משחק קטן', 'איך מציירים עיגול?', 'איך משמיעים מנגינה?'],
    ['Why is there an error?', 'What does my program do?', 'Write me a small game', 'How do I draw a circle?', 'How do I play a tune?']);
  const pick = box.querySelector('.d32-ai-quick select');
  for (const q of QUICK) pick.add(new Option(q, q));
  pick.addEventListener('change', () => {
    const q = pick.value;
    pick.value = '';
    if (q && !send.disabled) ask(q);
  });

  function bubble(role, text, program) {
    const div = document.createElement('div');
    div.className = 'd32-ai-msg is-' + role;
    for (const line of String(text).split('\n')) {
      // שורת קוד (אנגלית בלבד, בלי עברית) מוצגת משמאל לימין בגופן של המחשב
      // באנגלית משפט רגיל מתחיל גם הוא באות גדולה: שורת קוד היא רק שורה בלי אותיות קטנות (ה-BASIC כאן באותיות גדולות בלבד)
      if (line.trim() && !/[֐-׿]/.test(line) && /^[\sA-Z0-9?"'@(]/.test(line) && !(EN && /[a-z]/.test(line))) {
        const pre = document.createElement('pre');
        pre.dir = 'ltr';
        pre.lang = 'en';
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
      b.textContent = '⌨ ' + tr('לטעון את התוכנית למחשב', 'Load the program into the computer');
      b.addEventListener('click', () => powerOn().then(() => {
        machine.loadText(program, 'HELPER');
        b.textContent = '✓ ' + tr('נטענה. הקלידו RUN', 'Loaded. Type RUN');
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
    const wait = bubble('note', tr('העוזר חושב…', 'The helper is thinking…'));
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
