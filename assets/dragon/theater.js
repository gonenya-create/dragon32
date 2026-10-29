// מצב "סלון של פעם" (למחשב בלבד): המסך מתמלא, ה-Dragon יושב בתוך טלוויזיה ישנה עם פסי סריקה,
// ומתחתיו מקלדת Dragon מצוירת שנלחצת יחד עם המקלדת האמיתית. אפשר גם ללחוץ על המקשים המצוירים בעכבר.
// רק תצוגה: כל מקש נשלח לשורת ההקלדה או כאירוע מקלדת, כך שה-BASIC, הגרפיקה והמחסניות עובדים כרגיל.

import { createCoder } from './coder.js';
import { createCommands } from './commands.js';
import { EN, tr } from './lang.js';

// המקלדת: [תו, תו עם SHIFT, רוחב]. מקשים מיוחדים באותיות גדולות.
const ROWS = [
  [['1', '!'], ['2', '"'], ['3', '#'], ['4', '$'], ['5', '%'], ['6', '&'], ['7', "'"], ['8', '('], ['9', ')'], ['0', ''], [':', '*'], ['-', '='], ['BREAK', '', 1.5]],
  [['UP', '', 1.2], ['Q'], ['W'], ['E'], ['R'], ['T'], ['Y'], ['U'], ['I'], ['O'], ['P'], ['@'], ['CLEAR', '', 1.3]],
  [['DOWN', '', 1.4], ['A'], ['S'], ['D'], ['F'], ['G'], ['H'], ['J'], ['K'], ['L'], [';', '+'], ['ENTER', '', 1.6]],
  [['SHIFT', '', 1.8], ['Z'], ['X'], ['C'], ['V'], ['B'], ['N'], ['M'], [',', '<'], ['.', '>'], ['/', '?'], ['SHIFT', '', 1.8]],
  [['LEFT', '', 1.4], ['SPACE', '', 8], ['RIGHT', '', 1.4]]
];
const LABEL = { UP: '↑', DOWN: '↓', LEFT: '←', RIGHT: '→', SPACE: '' };
// מקש מיוחד → האירוע שהוא שולח
const SEND = { BREAK: 'Escape', ENTER: 'Enter', UP: 'ArrowUp', DOWN: 'ArrowDown', LEFT: 'ArrowLeft', RIGHT: 'ArrowRight', SPACE: ' ' };
// מקש במקלדת האמיתית → המקש המצויר שנדלק
const FROM_KEY = { Escape: 'BREAK', Enter: 'ENTER', ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', Backspace: 'LEFT', ArrowRight: 'RIGHT', ' ': 'SPACE', Shift: 'SHIFT', Home: 'CLEAR' };

// הכניסה למכונת ה-Dragon: ההבדל בין שני המחשבים כבר בקישור (דוח "אינסטינקט", 23.10)
const labText = () => '<span aria-hidden="true">🧪</span> <strong>' + tr('מכונת ה-<bdi dir="ltr">Dragon</bdi>', 'The <bdi dir="ltr">Dragon</bdi> machine') + '</strong>: '
  + tr('הכי קרוב למחשב המקורי. בבנייה: 18 משחקים מקוריים מהתקופה, של <bdi dir="ltr">Ken Kalish</bdi>, <bdi dir="ltr">Scott Adams</bdi>, <bdi dir="ltr">Mike Hughey</bdi> ועוד, כבר רצים עליה בלי שינוי בקוד שלהם, באישור המחברים. עוד לא השווינו אותה מול <bdi dir="ltr">Dragon</bdi> אמיתי. כאן באפליקציה לומדים וכותבים <bdi dir="ltr">BASIC</bdi> בנוחות.',
    'as close to the original computer as we can get. Being built: 18 original games from the period, by Ken Kalish, Scott Adams, Mike Hughey and others, already run on it without any change to their code, with their authors’ permission. It has not yet been compared with a real <bdi dir="ltr">Dragon</bdi>. Here in the app you learn and write <bdi dir="ltr">BASIC</bdi> the easy way.');
export function createTheater({ root, input, machine, sound, powerOn }) {
  const tv = root.querySelector('.d32-tv');

  // הכפתור שפותח את המצב. CSS מציג אותו רק במחשב עם עכבר ומסך רחב
  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'd32-theater-open';
  open.innerHTML = '<span aria-hidden="true">📺</span> ' + tr('מסך מלא, כמו בסלון של פעם', 'Full screen, like the living room in 1982');
  tv.before(open);

  // פס עליון: יציאה וצליל המקשים
  const bar = document.createElement('div');
  bar.className = 'd32-theater-bar';
  bar.innerHTML = '<span class="d32-bar-brand"><b dir="ltr">Dragon 1982</b><span class="d32-status" role="status" data-s="off">' + tr('כבוי', 'Off') + '</span></span>'
    + '<p class="d32-theater-hint">' + tr('מקלידים במקלדת שלכם, או לוחצים על המקשים המצוירים. <bdi dir="ltr">Esc</bdi> הוא <bdi dir="ltr">BREAK</bdi>.', 'Type on your own keyboard, or click the drawn keys. <bdi dir="ltr">Esc</bdi> is <bdi dir="ltr">BREAK</bdi>.') + '</p>'
    + '<span class="d32-theater-btns"><button type="button" class="d32-theater-code" aria-pressed="false">' + tr('ארגז כלים', 'Toolbox') + '</button>'
    + '<button type="button" class="d32-theater-kbd" aria-pressed="true">' + tr('מקלדת מצוירת', 'Drawn keyboard') + '</button>'
    + '<button type="button" class="d32-theater-click" aria-pressed="true">' + tr('צליל מקשים', 'Key clicks') + '</button>'
    + '<button type="button" class="d32-theater-only">' + tr('מסך בלבד', 'Screen only') + ' ⛶</button>'
    // מכונת ה-Dragon (בבנייה): XRoar עם ה-BASIC שכתבנו, בדף נפרד
    // בטלפון רואים רק את 🧪 (אין מקום למילים), ולכן השם גם ב-aria-label
    + '<a class="d32-lab" href="' + (EN ? '/en/lab/1982/' : '/lab/1982/') + '" aria-label="' + tr('מכונת ה-Dragon', 'The Dragon machine') + '"><span aria-hidden="true">🧪</span> <span class="d32-lab-word" aria-hidden="true">' + tr('מכונת ה-Dragon', 'The Dragon machine') + '</span></a>'
    + '<button type="button" class="d32-theater-exit"><span aria-hidden="true">📖</span> ' + tr('מדריך', 'Guide') + '</button>'
    // מעבר שפה: הדף השני (/ או /en/). הבחירה נשמרת (langpick.js)
    + (EN ? '<a class="d32-lang" href="/" lang="he" hreflang="he" data-lang="he">עברית</a>' : '<a class="d32-lang" href="/en/" lang="en" hreflang="en" data-lang="en">English</a>') + '</span>';
  // יציאה ממצב "מסך בלבד": כפתור קטן בפינה (גם Esc של הדפדפן יוצא ממסך מלא)
  const onlyOut = document.createElement('button');
  onlyOut.type = 'button';
  onlyOut.className = 'd32-only-out';
  onlyOut.textContent = tr('יציאה ממסך בלבד', 'Leave screen only');
  tv.before(bar);

  // הצד של הטלוויזיה: רמקול, שני כפתורי סיבוב, ערוץ 36 (שם כיוונו את ה-Dragon) ונורית
  const panel = document.createElement('div');
  panel.className = 'd32-tv-panel';
  panel.setAttribute('aria-hidden', 'true');
  panel.innerHTML = '<span class="d32-tv-ch" dir="ltr">36</span><span class="d32-tv-knob"></span><span class="d32-tv-knob"></span>'
    + '<span class="d32-tv-grille"></span><span class="d32-tv-led"></span>';
  tv.appendChild(panel);
  const crt = document.createElement('div');
  crt.className = 'd32-crt';
  crt.setAttribute('aria-hidden', 'true');
  tv.appendChild(crt);

  // המקלדת המצוירת
  const kbd = document.createElement('div');
  kbd.className = 'd32-kbd';
  kbd.setAttribute('dir', 'ltr');
  kbd.lang = 'en';
  kbd.setAttribute('role', 'group');
  kbd.setAttribute('aria-label', tr('מקלדת Dragon 32', 'Dragon 32 keyboard'));
  kbd.innerHTML = '<div class="d32-kbd-top"><span class="d32-kbd-name">DRAGON 32</span><span class="d32-kbd-led" aria-hidden="true"></span></div>';
  const keys = {};
  for (const row of ROWS) {
    const r = document.createElement('div');
    r.className = 'd32-kbd-row';
    for (const [k, shifted = '', w = 1] of row) {
      const b = document.createElement('button');
      b.type = 'button';
      b.tabIndex = -1;   // מהמקלדת עצמה מקלידים ישר, לא עוברים בין המקשים בטאב
      b.className = 'd32-key' + (k.length > 1 && !(k in LABEL) ? ' is-wide' : '');
      b.style.flexGrow = w;
      b.dataset.k = k;
      b.innerHTML = (shifted ? '<small></small>' : '') + '<span></span>';
      if (shifted) b.querySelector('small').textContent = shifted;
      b.querySelector('span').textContent = k in LABEL ? LABEL[k] : k;
      b.setAttribute('aria-label', k === 'SPACE' ? tr('רווח', 'Space') : k);
      (keys[k] = keys[k] || []).push(b);
      if (shifted) (keys[shifted] = keys[shifted] || []).push(b);
      r.appendChild(b);
    }
    kbd.appendChild(r);
  }
  tv.after(kbd);

  // חלון התוכנית (כלים למתכנת), בצד הטלוויזיה
  const coder = createCoder({ root, input, machine, powerOn });
  root.appendChild(coder.panel);
  // ארגז הכלים: שלוש לשוניות בחלון שמשמאל. "תוכנית" היא חלון התוכנית; לשתי האחרות עוברים, בזמן המסך המלא,
  // הפקודות המוכנות והמדפים מהדף (וחוזרים לדף ביציאה)
  // "עוזר" מופיעה רק בטלפון (במחשב העוזרים בעמודה הימנית)
  // "מקלדת" מופיעה רק בטלפון: המקלדת המצוירת של ה-Dragon במקום מקלדת האייפון (17.10)
  const TABS = [['keys', tr('מקלדת', 'Keyboard')], ['program', tr('תוכנית', 'Program')], ['commands', tr('פקודות', 'Commands')], ['shelf', tr('מדף', 'Shelf')], ['help', tr('עוזר', 'Helper')]];
  const tabbar = document.createElement('div');
  tabbar.className = 'd32-tabs';
  tabbar.setAttribute('role', 'tablist');
  tabbar.setAttribute('aria-label', tr('ארגז הכלים', 'Toolbox'));
  const panes = {};
  for (const [id, name] of TABS) {
    const t = document.createElement('button');
    t.type = 'button';
    t.className = 'd32-tab';
    t.id = 'd32-tab-' + id;
    t.dataset.tab = id;
    t.setAttribute('role', 'tab');
    t.textContent = name;
    tabbar.appendChild(t);
    const pane = document.createElement('div');
    pane.className = 'd32-pane';
    pane.dataset.pane = id;
    pane.setAttribute('role', 'tabpanel');
    pane.setAttribute('aria-labelledby', t.id);
    panes[id] = pane;
  }
  while (coder.panel.firstChild) panes.program.appendChild(coder.panel.firstChild);
  coder.panel.removeAttribute('aria-labelledby');
  coder.panel.setAttribute('aria-label', tr('ארגז הכלים', 'Toolbox'));
  coder.panel.append(tabbar, ...Object.values(panes));
  let tab = 'program', savedTab = false, phone = false, sysKbd = false;
  try { const t = localStorage.getItem('d32-tab'); if (t) { tab = t; savedTab = true; } } catch { /* בלי זיכרון בדפדפן */ }
  function showTab(id, save = true) {
    if (!panes[id]) id = 'program';
    tab = id;
    for (const b of tabbar.children) { const on = b.dataset.tab === id; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; }
    for (const [k, p] of Object.entries(panes)) p.hidden = k !== id;
    // בלשונית המקלדת המצוירת, נגיעה במסך לא פותחת את מקלדת האייפון
    input.inputMode = phone && id === 'keys' && !sysKbd ? 'none' : '';
    if (save && id !== 'help' && id !== 'keys') try { localStorage.setItem('d32-tab', id); savedTab = true; } catch { /* בלי זיכרון בדפדפן */ }
  }
  tabbar.addEventListener('click', e => { const b = e.target.closest('.d32-tab'); if (b) showTab(b.dataset.tab); });
  tabbar.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const ids = TABS.map(t => t[0]);
    let i = ids.indexOf(tab);
    // בעברית החץ שמאלה מתקדם
    i = e.key === 'Home' ? 0 : e.key === 'End' ? ids.length - 1 : (i + (e.key === 'ArrowLeft' ? 1 : -1) + ids.length) % ids.length;
    showTab(ids[i]);
    tabbar.children[i].focus();
  });
  showTab(tab, false);
  // מה עובר לכל לשונית בזמן המסך המלא
  panes.commands.appendChild(createCommands({ root, machine, powerOn, input }));
  // הדפים "יומן המסע" ו"ההיסטוריה של ה-Dragon": שורת קישורים שרואים בטלפון (במסך הפתיחה ובלשונית "מדף")
  const pagesRow = () => {
    const row = document.createElement('nav');
    row.className = 'd32-pages';
    row.setAttribute('aria-label', tr('עוד באתר', 'More on the site'));
    row.innerHTML = '<a href="' + (EN ? '/en/lessons/' : '/lessons/') + '"><span aria-hidden="true">🎓</span> ' + tr('לומדים בייסיק', 'Learn BASIC') + '</a>'
      + '<a href="' + (EN ? '/en/story/' : '/story/') + '"><span aria-hidden="true">📜</span> ' + tr('יומן המסע', 'The journey') + '</a>'
      + '<a href="' + (EN ? '/en/magazine/' : '/magazine/') + '"><span aria-hidden="true">📰</span> ' + tr('מה קראו בעלי <bdi dir="ltr">Dragon</bdi>', 'What Dragon Owners Were Reading') + '</a>'
      + '<a href="' + (EN ? '/en/adverts/' : '/adverts/') + '"><span aria-hidden="true">📺</span> ' + tr('הפרסומות', 'The adverts') + '</a>'
      + '<a href="' + (EN ? '/en/posters/' : '/posters/') + '"><span aria-hidden="true">🖼️</span> ' + tr('פוסטרים', 'Posters') + '</a>'
      + '<a href="' + (EN ? '/en/dragon-history/' : '/dragon-history/') + '"><span aria-hidden="true">🐉</span> ' + tr('ההיסטוריה של ה-<bdi dir="ltr">Dragon</bdi>', 'The history of the <bdi dir="ltr">Dragon</bdi>') + '</a>';
    return row;
  };
  // בטלפון הפס העליון צר: הקישור למכונת ה-Dragon בראש לשונית "מדף"
  const labLink = document.createElement('a');
  labLink.className = 'd32-lab d32-lab-shelf';
  labLink.href = EN ? '/en/lab/1982/' : '/lab/1982/';
  labLink.innerHTML = labText();
  panes.shelf.appendChild(labLink);
  const shelfPages = pagesRow();
  shelfPages.classList.add('d32-pages-shelf');
  panes.shelf.appendChild(shelfPages);
  const MOVE = [['.d32-share-row', 'program'], ['.d32-cabinet', 'shelf']];
  const moved = [];
  function toTabs() {
    for (const [sel, id] of MOVE) {
      const el = root.querySelector(':scope > ' + sel);
      if (!el) continue;
      const mark = document.createComment('d32-tab');
      el.before(mark);
      moved.push([mark, el]);
      panes[id].appendChild(el);
    }
  }
  // בטלפון גם "מה קרה?" והעוזר עוברים ללשונית "עוזר"
  function helpToTab() {
    for (const el of root.querySelectorAll(':scope > .d32-helper, :scope > .d32-ai')) {
      const mark = document.createComment('d32-tab');
      el.before(mark);
      moved.push([mark, el]);
      panes.help.appendChild(el);
    }
  }
  function fromTabs() {
    for (const [mark, el] of moved) mark.replaceWith(el);
    moved.length = 0;
  }
  let coding = innerWidth >= 1200;   // במסך צר החלון מכסה חלק מהטלוויזיה, אז מתחילים כשהוא סגור
  const codeBtn = bar.querySelector('.d32-theater-code');
  codeBtn.setAttribute('aria-pressed', String(coding));
  codeBtn.addEventListener('click', () => {
    if (shop && coding) { setShop(false); }   // סוגרים את הכלים: גם החלון הגדול נסגר
    coding = !coding;
    codeBtn.setAttribute('aria-pressed', String(coding));
    root.classList.toggle('has-coder', coding);
    if (coding) coder.start(); else coder.stop();
    layout();
    input.focus({ preventScroll: true });
  });

  let active = false, clicks = true, shift = false;
  const clickBtn = bar.querySelector('.d32-theater-click');
  clickBtn.addEventListener('click', () => {
    clicks = !clicks;
    clickBtn.setAttribute('aria-pressed', String(clicks));
    clickBtn.textContent = (clicks ? '🔊' : '🔇') + ' ' + tr('צליל מקשים', 'Key clicks');
    input.focus({ preventScroll: true });
  });
  const tick = () => { if (clicks) sound.noise(14, 0.03); };

  // המקלדת המצוירת: אפשר לקפל אותה (רוב האנשים מקלידים במקלדת האמיתית), והטלוויזיה גדלה
  let showKbd = true;
  try { showKbd = localStorage.getItem('d32-kbd') !== 'off'; } catch { /* בלי זיכרון בדפדפן */ }
  const kbdBtn = bar.querySelector('.d32-theater-kbd');
  function setKbd(on) {
    showKbd = on;
    kbdBtn.setAttribute('aria-pressed', String(on));
    root.classList.toggle('kbd-off', !on);
    try { localStorage.setItem('d32-kbd', on ? 'on' : 'off'); } catch { /* בלי זיכרון בדפדפן */ }
    layout();
  }
  // בסדנה המקלדת סגורה כברירת מחדל, אבל הכפתור פותח אותה (בלי לשנות את הבחירה במצב הרגיל)
  let shopKbd = false;
  kbdBtn.addEventListener('click', () => {
    if (shop) {
      shopKbd = !shopKbd;
      root.classList.toggle('shop-kbd', shopKbd);
      kbdBtn.setAttribute('aria-pressed', String(shopKbd));
      layout();
    } else setKbd(!showKbd);
    input.focus({ preventScroll: true });
  });

  // סדנה: מצב לכתיבת תוכניות. אותו מחשב, בתצוגה אחרת
  let shop = false, only = false;
  // הכפתור נמצא בראש לשונית "תוכנית" (במקום כפתור "סדנה" נפרד בפס העליון): מגדיל את חלון התוכנית לכתיבה
  const shopBtn = document.createElement('button');
  shopBtn.type = 'button';
  shopBtn.className = 'd32-theater-shop';
  shopBtn.setAttribute('aria-pressed', 'false');
  const shopLabel = () => { shopBtn.innerHTML = shop ? '<span aria-hidden="true">⤡</span> ' + tr('חלון רגיל', 'Normal window') : '<span aria-hidden="true">⤢</span> ' + tr('חלון גדול לכתיבה', 'Big writing window'); };
  panes.program.prepend(shopBtn);
  function setShop(on) {
    shop = on;
    shopBtn.setAttribute('aria-pressed', String(shop));
    shopLabel();
    root.classList.toggle('is-shop', shop);
    shopKbd = false;
    root.classList.remove('shop-kbd');
    kbdBtn.setAttribute('aria-pressed', String(shop ? false : showKbd));
    if (shop) { coding = true; root.classList.add('has-coder'); codeBtn.setAttribute('aria-pressed', 'true'); coder.start(); showTab('program'); }
    layout();
    input.focus({ preventScroll: true });
  }
  shopLabel();
  shopBtn.addEventListener('click', () => setShop(!shop));
  // מסך בלבד: רק התמונה של המחשב, על כל המסך (Fullscreen API כשיש; אחרת על כל החלון)
  function setOnly(on) {
    if (only === on) return;
    only = on;
    root.classList.toggle('is-only', on);
    if (on) { root.appendChild(onlyOut); if (root.requestFullscreen && !document.fullscreenElement) root.requestFullscreen().catch(() => {}); }
    else { onlyOut.remove(); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); }
    layout();
    if (!root.classList.contains('is-cart')) input.focus({ preventScroll: true });
  }
  bar.querySelector('.d32-theater-only').addEventListener('click', () => setOnly(true));
  onlyOut.addEventListener('click', () => setOnly(false));
  // Esc של הדפדפן יוצא ממסך מלא: אז יוצאים גם ממצב "מסך בלבד"
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && only) setOnly(false); });
  // מחסנית נכנסת או יוצאת: מחשבים מחדש את הגודל (הכלים מתקפלים בזמן משחק)
  let wasCart = false, wasOff = root.classList.contains('is-off');
  new MutationObserver(() => {
    const c = root.classList.contains('is-cart');
    if (c !== wasCart) { wasCart = c; layout(); }
    // בטלפון: המחשב נדלק, אז נפתחת המקלדת המצוירת
    const off = root.classList.contains('is-off');
    if (wasOff && !off && phone) showTab('keys', false);
    wasOff = off;
  }).observe(root, { attributes: true, attributeFilter: ['class'] });

  // שורת המצב בראש המסך: מה המחשב עושה עכשיו
  const status = bar.querySelector('.d32-status');
  let statusTimer = 0;
  function showStatus() {
    const s = root.classList.contains('is-off') ? ['off', tr('כבוי', 'Off')]
      : root.classList.contains('is-cart') ? ['cart', tr('מחסנית במחשב', 'Cartridge in')]
      : machine.running ? ['run', tr('תוכנית רצה', 'Running')]
      : ['ok', tr('מוכן', 'Ready')];
    if (status.dataset.s !== s[0]) { status.dataset.s = s[0]; status.textContent = s[1]; }
  }

  // הגודל: הטלוויזיה והמקלדת נכנסות יחד לגובה החלון
  function layout() {
    if (!active) return;
    const cart = root.classList.contains('is-cart');
    if (only) {
      // רק המסך, ביחס 4:3, על כל החלון. --tvw מחושב כך שהמסך (79% מהטלוויזיה) ממלא את החלון
      // בזמן משחק מחסנית "הוצאת המחסנית" יושב מתחת למסך: שומרים לו מקום, כדי שהמסך לא יידחק למעלה
      const pad = cart ? root.querySelector('.d32-pad') : null;
      const sw = Math.min(innerWidth, (innerHeight - (pad ? pad.offsetHeight + 12 : 0)) * 4 / 3);
      root.style.setProperty('--tvw', sw / 0.79 + 'px');
      root.style.setProperty('--sw', sw + 'px');   // רוחב המסך עצמו: בלי מסגרת העץ, אז הוא בדיוק ברוחב הזה
      root.style.setProperty('--fs', Math.min((sw - 28) / 19.6, (sw * 0.75 - 24) / (16 * 1.12)) + 'px');
      return;
    }
    if (shop && !cart) {
      // סדנה: חלון התוכנית רחב משמאל, העוזרים מימין, והטלוויזיה קטנה ביניהם, בלי מקלדת מצוירת
      const cw = Math.min(400, Math.max(280, innerWidth * 0.2));
      const ww = Math.max(420, innerWidth * 0.4);
      const w = Math.max(360, Math.min(innerWidth - ww - cw - 96, (innerHeight - bar.offsetHeight - 60) / (shopKbd ? 1.0 : 0.7)));
      root.classList.remove('coder-over');
      root.style.setProperty('--cw', cw + 'px');
      root.style.setProperty('--ww', ww + 'px');
      root.style.setProperty('--ctop', bar.offsetHeight + 'px');
      root.style.setProperty('--tvw', w + 'px');
      const sw = w * 0.79;
      root.style.setProperty('--fs', Math.min((sw - 28) / 19.6, (sw * 0.75 - 24) / (16 * 1.12)) + 'px');
      return;
    }
    // בזמן משחק מחסנית יש מתחת למסך "הוצאת המחסנית" ולפעמים "איך משחקים": שומרים להם מקום, כדי שהמסך לא יידחק למעלה
    const cpad = cart ? root.querySelector('.d32-pad') : null;
    const avail = innerHeight - bar.offsetHeight - 40 - (cpad ? cpad.offsetHeight + 12 : 0);
    // חלון התוכנית צריך לפחות 280 פיקסלים בצד; אם אין מקום, הוא נפתח מעל הטלוויזיה
    // בזמן משחק מחסנית הכלים מתקפלים, והטלוויזיה תופסת את כל הרוחב
    const room = coding && !cart ? innerWidth - 2 * (280 + 32) : innerWidth * 0.94;
    // הטלוויזיה גבוהה בערך 0.67 מהרוחב שלה, ועם המקלדת בערך פי 1
    const w = Math.max(560, Math.min(innerWidth * 0.94, room, cart ? 1400 : 1180, (avail - 20) / (showKbd ? 1.0 : 0.7)));
    const side = (innerWidth - w) / 2 - 32;
    root.classList.toggle('coder-over', side < 280);
    root.style.setProperty('--cw', Math.min(400, Math.max(280, side)) + 'px');
    root.style.setProperty('--ctop', bar.offsetHeight + 'px');
    root.style.setProperty('--tvw', w + 'px');
    const sw = w * 0.79;   // רוחב המסך בתוך הטלוויזיה
    root.style.setProperty('--fs', Math.min((sw - 28) / 19.6, (sw * 0.75 - 24) / (16 * 1.12)) + 'px');
  }

  function light(k, on) { (keys[k] || []).forEach(b => b.classList.toggle('is-down', on)); }
  function flash(k) { light(k, true); setTimeout(() => light(k, false), 110); }

  // מקש מצויר נלחץ: כשמקלידים פקודה האות נכנסת לשורה; כשמשהו רץ (תוכנית, גרפיקה, מחסנית) נשלח אירוע מקלדת
  function press(k) {
    tick();
    if (k === 'SHIFT') { shift = !shift; kbd.classList.toggle('is-shift', shift); return; }
    flash(k);
    const busy = machine.running || root.classList.contains('is-cart') || root.classList.contains('is-gfx');
    if (k === 'CLEAR') { if (!busy) { input.value = ''; machine.type('CLS'); input.dispatchEvent(new Event('input')); } return; }
    const b = (keys[k] || [])[0];
    const ch = k.length === 1 ? (shift && b.querySelector('small') ? b.querySelector('small').textContent : k) : (k === 'SPACE' ? ' ' : null);
    if (shift && k.length === 1) { shift = false; kbd.classList.remove('is-shift'); }
    if (!busy && k === 'LEFT') { input.value = input.value.slice(0, -1); input.dispatchEvent(new Event('input')); return; }
    if (!busy && ch !== null) {
      if (input.value.length < 249) input.value += ch;
      input.dispatchEvent(new Event('input'));
      return;
    }
    const key = ch !== null ? ch : SEND[k];
    if (!key) return;
    // נשלח משורת ההקלדה ומבעבע עד window, שם מקשיבים המסך הגרפי והמחסנית
    input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    setTimeout(() => input.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true })), 90);
  }
  kbd.addEventListener('pointerdown', e => {
    const b = e.target.closest('.d32-key');
    if (!b) return;
    e.preventDefault();   // הפוקוס נשאר בשורת ההקלדה
    press(b.dataset.k);
  });

  // המקלדת האמיתית מדליקה את המקש המצויר
  const which = e => FROM_KEY[e.key] || (e.key.length === 1 ? e.key.toUpperCase() : null);
  // לחצו על לשונית או כפתור ואז התחילו להקליד: האותיות הולכות למחשב, לא לכפתור
  const typingField = el => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  function down(e) {
    if (!active || !e.isTrusted) return;
    const onButton = document.activeElement?.closest?.('button, a, [role="tab"]');
    // רווח ו-Enter על כפתור לוחצים עליו (נגישות מקלדת); כל שאר האותיות הולכות לשורת ההקלדה
    const activates = onButton && (e.key === ' ' || e.key === 'Enter');
    if (!typingField(document.activeElement) && !activates && !e.ctrlKey && !e.metaKey && !e.altKey
      && (e.key.length === 1 || e.key === 'Backspace')
      && !root.classList.contains('is-cart') && !root.classList.contains('is-gfx')) {
      input.focus({ preventScroll: true });
    }
    const k = which(e);
    if (!k) return;
    light(k, true);
    if (!e.repeat && k !== 'SHIFT') tick();
  }
  function up(e) {
    if (!active || !e.isTrusted) return;
    const k = which(e);
    if (k) light(k, false);
    if (e.key === 'Shift' || k === 'SHIFT') light('SHIFT', false);
  }
  window.addEventListener('keydown', down, true);
  window.addEventListener('keyup', up, true);
  window.addEventListener('blur', () => kbd.querySelectorAll('.is-down').forEach(b => b.classList.remove('is-down')));

  // הצד הימני במסך המלא: עמודה אחת בגובה מלא, סימטרית לחלון התוכנית שמשמאל.
  // הפתק "מה קרה?" למעלה, והעוזר מתחתיו. ביציאה הם חוזרים למקומם בדף
  const side = document.createElement('div');
  side.className = 'd32-side';
  const spots = [];
  function toSide() {
    for (const el of root.querySelectorAll(':scope > .d32-helper, :scope > .d32-ai')) {
      const mark = document.createComment('d32-side');
      el.before(mark);
      spots.push([mark, el]);
      side.appendChild(el);
    }
    if (spots.length) root.appendChild(side);
  }
  function fromSide() {
    for (const [mark, el] of spots) { mark.replaceWith(el); }
    spots.length = 0;
    side.remove();
  }

  let left = false; // המשתמש יצא בעצמו ("חזרה לדף"), אז לא נכנסים שוב לבד
  function enter() {
    left = false;
    active = true;
    toSide();
    toTabs();
    root.classList.add('is-theater');
    root.classList.toggle('kbd-off', !showKbd);
    kbdBtn.setAttribute('aria-pressed', String(showKbd));
    showStatus();
    clearInterval(statusTimer);
    statusTimer = setInterval(showStatus, 300);
    root.classList.toggle('has-coder', coding);
    if (coding) coder.start();
    document.documentElement.classList.add('d32-theater-on');
    guideInert(true);
    layout();
    powerOn().then(() => { if (!root.classList.contains('is-cart')) input.focus({ preventScroll: true }); welcome(); });
    root.scrollTop = 0;
  }

  // ביקור ראשון במחשב: הצעה קצרה מה לעשות קודם (דוח הגולש העיוור, 17.10). מופיעה פעם אחת בדפדפן
  function welcome() {
    let seen = true;
    try { seen = !!localStorage.getItem('d32-welcome'); } catch { /* בלי זיכרון: לא מציגים */ }
    if (seen || /#p=/.test(location.hash) || root.querySelector('.d32-welcome')) return;
    const card = document.createElement('div');
    card.className = 'd32-welcome';
    card.dir = tr('rtl', 'ltr');
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', tr('ברוכים הבאים', 'Welcome'));
    card.innerHTML = '<p class="d32-welcome-title">' + tr('ברוכים הבאים ל-1982! מה עושים קודם?', 'Welcome to 1982! What first?') + '</p>'
      + '<div class="d32-welcome-btns"><button type="button" data-w="play">🎮 ' + tr('לשחק במשחק', 'Play a game') + '</button>'
      + '<button type="button" data-w="hello">⌨ ' + tr('פקודה ראשונה', 'First command') + '</button>'
      + '<button type="button" data-w="guide">📖 ' + tr('מדריך קצר', 'Quick guide') + '</button></div>'
      + '<button type="button" class="d32-welcome-x" aria-label="' + tr('סגירה', 'Close') + '">✕</button>';
    tv.appendChild(card);
    // נסגר גם כשמתחילים לעבוד בלעדיו: מקלידים, או לוחצים על כל דבר אחר במחשב
    const outside = e => { if (!card.contains(e.target)) close(); };
    const close = () => {
      card.remove();
      try { localStorage.setItem('d32-welcome', '1'); } catch { /* בלי זיכרון */ }
      input.removeEventListener('keydown', close);
      root.removeEventListener('pointerdown', outside, true);
    };
    input.addEventListener('keydown', close);
    root.addEventListener('pointerdown', outside, true);
    card.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      close();
      const w = b.dataset.w;
      if (w === 'play' || w === 'hello') {
        if (!coding) codeBtn.click();
        showTab(w === 'play' ? 'shelf' : 'commands');
        // "לשחק במשחק": המגירות סגורות בכניסה, אז פותחים את מגירת המחסניות
        const carts = w === 'play' && root.querySelector('.d32-drawer[data-drawer="carts"]');
        if (carts) carts.open = true;
      }
      if (w === 'hello') root.d32.typeLines(['PRINT "HELLO, 1982!"'], () => input.focus({ preventScroll: true }));
      else if (w === 'guide') exit();
      else input.focus({ preventScroll: true });
    });
  }
  function exit() {
    active = false;
    left = true;
    shift = false;
    kbd.classList.remove('is-shift');
    root.classList.remove('is-theater');
    coder.stop();
    clearInterval(statusTimer);
    setOnly(false);
    fromSide();
    fromTabs();
    document.documentElement.classList.remove('d32-theater-on');
    toGuide();
  }
  // כשהמחשב פתוח, המדריך שמאחוריו לא נגיש למקלדת ולקורא מסך (inert); כשחוזרים למדריך הוא חוזר
  function guideInert(on) {
    document.querySelectorAll('.page > :not(main), main > :not(.room-machine)').forEach(el => { el.inert = on; });
  }
  // יציאה מהמחשב: המדריך, מלמעלה, והפוקוס על "חזרה למחשב"
  function toGuide() {
    guideInert(false);
    scrollTo(0, 0);
    document.querySelector('.guide-back')?.focus({ preventScroll: true });
  }
  open.addEventListener('click', enter);
  bar.querySelector('.d32-theater-exit').addEventListener('click', () => (phone ? exitPhone() : exit()));
  addEventListener('resize', layout);

  // הטלפון: אפליקציה במסך אחד. המחשב למעלה, לשוניות למטה ומגירה אחת פתוחה.
  // לפני ההדלקה רואים רק את המחשב ואת מתג ההדלקה; אחרי ההדלקה נפתחת המקלדת המצוירת, ורק אז שאר הלשוניות
  const kbdMark = document.createComment('d32-kbd');
  const sysBtn = document.createElement('button');
  sysBtn.type = 'button';
  sysBtn.className = 'd32-syskbd';
  const sysLabel = () => { sysBtn.textContent = sysKbd ? '⌨ ' + tr('חזרה למקלדת של ה-Dragon', 'Back to the Dragon keyboard') : '📱 ' + tr('להקליד במקלדת של הטלפון', 'Use the phone keyboard'); };
  sysLabel();
  sysBtn.addEventListener('click', () => {
    sysKbd = !sysKbd;
    sysLabel();
    root.classList.toggle('sys-kbd', sysKbd);
    input.inputMode = sysKbd ? '' : 'none';
    if (sysKbd) input.focus(); else input.blur();
  });
  panes.keys.appendChild(sysBtn);
  // מסך הפתיחה בטלפון: כמה מילים מעל המחשב הכבוי, כדי שלא יהיה רק מסך שחור (גונן, 17.10)
  const hello = document.createElement('div');
  hello.className = 'd32-hello';
  hello.innerHTML = '<p class="d32-hello-title">' + tr('ברוכים הבאים ל-1982', 'Welcome to 1982') + '</p>'
    + '<p class="d32-hello-text">' + tr('זה <bdi dir="ltr">Dragon 32</bdi>, המחשב הביתי שיצא בוויילס. משחקים במחסניות ובקלטות, כותבים <bdi dir="ltr">BASIC</bdi>, ושואלים את העוזר.', 'This is the <bdi dir="ltr">Dragon 32</bdi>, the home computer from Wales. Play cartridges and tapes, write <bdi dir="ltr">BASIC</bdi>, and ask the helper.') + '</p>'
    + '<p class="d32-hello-go">' + tr('לוחצים על המתג, ומתחילים ↓', 'Press the switch to start ↓') + '</p>';
  tv.before(hello);
  // ובטלפון, מתחת למחשב הכבוי: הדרך למכונת ה-Dragon (גונן, 21.10)
  const helloLab = document.createElement('a');
  helloLab.className = 'd32-hello-lab';
  helloLab.href = EN ? '/en/lab/1982/' : '/lab/1982/';
  helloLab.innerHTML = labText();
  tv.after(helloLab);
  const helloPages = pagesRow();
  helloPages.classList.add('d32-pages-hello');
  helloLab.after(helloPages);
  function enterPhone() {
    if (phone || active) return;
    left = false;
    phone = true;
    toTabs();
    helpToTab();
    kbd.before(kbdMark);
    panes.keys.prepend(kbd);
    // מתחילים במקלדת המצוירת (גם אחרי ההדלקה; ראו המעקב אחרי is-off)
    showTab('keys', false);
    root.classList.add('is-phone');
    document.documentElement.classList.add('d32-theater-on');
    guideInert(true);
    coder.start();
    showStatus();
    clearInterval(statusTimer);
    statusTimer = setInterval(showStatus, 300);
    scrollTo(0, 0);
  }
  // quiet=true: עוברים ישר למסך המלא (החלון התרחב), לא למדריך
  function exitPhone(quiet) {
    if (!phone) return;
    phone = false;
    left = !quiet;
    root.classList.remove('is-phone');
    document.documentElement.classList.remove('d32-theater-on');
    coder.stop();
    clearInterval(statusTimer);
    fromTabs();
    kbdMark.replaceWith(kbd);
    input.inputMode = '';
    if (tab === 'keys') showTab('program', false);
    if (!quiet) toGuide(); else guideInert(false);
  }
  // "מה קרה?" נפתח בזמן שלשונית אחרת פתוחה: עוברים ללשונית העוזר
  const helperBox = root.querySelector('.d32-helper');
  if (helperBox) new MutationObserver(() => { if (phone && !helperBox.hidden) showTab('help'); }).observe(helperBox, { attributes: true, attributeFilter: ['hidden'] });

  return { enter, exit, enterPhone, exitPhone, get active() { return active; }, get left() { return left; }, get phone() { return phone; } };
}
