// מצב "סלון של פעם" (למחשב בלבד): המסך מתמלא, ה-Dragon יושב בתוך טלוויזיה ישנה עם פסי סריקה,
// ומתחתיו מקלדת Dragon מצוירת שנלחצת יחד עם המקלדת האמיתית. אפשר גם ללחוץ על המקשים המצוירים בעכבר.
// רק תצוגה: כל מקש נשלח לשורת ההקלדה או כאירוע מקלדת, כך שה-BASIC, הגרפיקה והמחסניות עובדים כרגיל.

import { createCoder } from './coder.js';

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

export function createTheater({ root, input, machine, sound, powerOn }) {
  const tv = root.querySelector('.d32-tv');
  const quiet = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // הכפתור שפותח את המצב. CSS מציג אותו רק במחשב עם עכבר ומסך רחב
  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'd32-theater-open';
  open.innerHTML = '<span aria-hidden="true">📺</span> מסך מלא, כמו בסלון של פעם';
  tv.before(open);

  // פס עליון: יציאה וצליל המקשים
  const bar = document.createElement('div');
  bar.className = 'd32-theater-bar';
  bar.innerHTML = '<button type="button" class="d32-theater-exit">→ חזרה לדף</button>'
    + '<p class="d32-theater-hint">מקלידים במקלדת שלכם, או לוחצים על המקשים המצוירים. <bdi dir="ltr">Esc</bdi> הוא <bdi dir="ltr">BREAK</bdi>.</p>'
    + '<span class="d32-theater-btns"><button type="button" class="d32-theater-code" aria-pressed="false">📜 כלים למתכנת</button>'
    + '<button type="button" class="d32-theater-click" aria-pressed="true">🔊 צליל מקשים</button></span>';
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
  kbd.setAttribute('role', 'group');
  kbd.setAttribute('aria-label', 'מקלדת Dragon 32');
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
      b.setAttribute('aria-label', k === 'SPACE' ? 'רווח' : k);
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
  let coding = innerWidth >= 1200;   // במסך צר החלון מכסה חלק מהטלוויזיה, אז מתחילים כשהוא סגור
  const codeBtn = bar.querySelector('.d32-theater-code');
  codeBtn.setAttribute('aria-pressed', String(coding));
  codeBtn.addEventListener('click', () => {
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
    clickBtn.textContent = (clicks ? '🔊' : '🔇') + ' צליל מקשים';
    input.focus({ preventScroll: true });
  });
  const tick = () => { if (clicks) sound.noise(14, 0.03); };

  // הגודל: הטלוויזיה והמקלדת נכנסות יחד לגובה החלון
  function layout() {
    if (!active) return;
    const avail = innerHeight - bar.offsetHeight - 40;
    // חלון התוכנית צריך לפחות 280 פיקסלים בצד; אם אין מקום, הוא נפתח מעל הטלוויזיה
    const room = coding ? innerWidth - 2 * (280 + 32) : innerWidth * 0.94;
    const w = Math.max(560, Math.min(innerWidth * 0.94, room, 1180, (avail - 20) / 1.0));
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
  function down(e) {
    if (!active || !e.isTrusted) return;
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
    active = true;
    toSide();
    root.classList.add('is-theater');
    root.classList.toggle('has-coder', coding);
    if (coding) coder.start();
    document.documentElement.classList.add('d32-theater-on');
    layout();
    powerOn().then(() => { if (!root.classList.contains('is-cart')) input.focus({ preventScroll: true }); });
    root.scrollTop = 0;
  }
  function exit() {
    active = false;
    left = true;
    shift = false;
    kbd.classList.remove('is-shift');
    root.classList.remove('is-theater');
    coder.stop();
    fromSide();
    document.documentElement.classList.remove('d32-theater-on');
    open.scrollIntoView({ block: 'start', behavior: quiet() ? 'auto' : 'smooth' });
    open.focus({ preventScroll: true });
  }
  open.addEventListener('click', enter);
  bar.querySelector('.d32-theater-exit').addEventListener('click', exit);
  addEventListener('resize', layout);

  return { enter, exit, get active() { return active; }, get left() { return left; } };
}
