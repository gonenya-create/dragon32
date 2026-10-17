// מריץ המחסניות: מחליף את מסך הטקסט במסך גרפי, מריץ את המשחק 50 פעמים בשנייה (כמו טלוויזיה אירופאית
// של אז, PAL), ומחבר מקלדת וכפתורי מגע. משחק = מודול עם { title, init(api), update(api), draw(api) }.
import { createGfx } from './gfx.js';
import { loadTable, qualifies, createEntry } from './hof.js';
import { tr } from './lang.js';

const STEP = 1000 / 50;
const KEYS = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  a: 'left', d: 'right', w: 'up', s: 'down', ' ': 'fire', Enter: 'fire', z: 'fire', x: 'fire', p: 'pause'
};
const PAD = [
  ['left', '◀', tr('שמאלה', 'Left')], ['up', '▲', tr('למעלה', 'Up')], ['down', '▼', tr('למטה', 'Down')], ['right', '▶', tr('ימינה', 'Right')], ['fire', 'FIRE', tr('אש / קפיצה', 'Fire / jump')]
];

export function createCartRunner(root, sound, { onEject, onScores }) {
  const tv = root.querySelector('.d32-tv');
  const canvas = document.createElement('canvas');
  canvas.className = 'd32-canvas';
  canvas.setAttribute('role', 'img');
  tv.appendChild(canvas);
  const gfx = createGfx(canvas);

  // כפתורי מגע + הוצאת מחסנית
  const pad = document.createElement('div');
  pad.className = 'd32-pad';
  pad.setAttribute('dir', 'ltr');
  const held = { left: false, right: false, up: false, down: false, fire: false };
  let edges = {};
  const buttons = {};
  for (const [name, label, aria] of PAD) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'd32-pad-btn d32-pad-' + name;
    b.dataset.pad = name;
    b.textContent = label;
    b.setAttribute('aria-label', aria);
    buttons[name] = b;
    pad.appendChild(b);
  }
  function setHeld(name, on) {
    if (on && !held[name]) edges[name] = true;
    held[name] = on;
    buttons[name].classList.toggle('is-down', on);
  }
  // מגע (טלפון): בכל שינוי מחשבים מחדש אילו כפתורים לחוצים, לפי כל האצבעות שעל המסך.
  // כך אפשר להחליק אצבע מ-◀ ל-▶, ושום כפתור לא "נתקע" לחוץ. preventDefault מונע זכוכית מגדלת
  // ובחירת טקסט של הטלפון בלחיצה ארוכה.
  function syncTouches(e) {
    e.preventDefault();
    const on = new Set();
    for (const t of e.touches) {
      const el = document.elementFromPoint(t.clientX, t.clientY);
      const b = el && el.closest('.d32-pad-btn');
      if (b && pad.contains(b)) on.add(b.dataset.pad);
    }
    for (const name in buttons) setHeld(name, on.has(name));
  }
  for (const type of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) {
    pad.addEventListener(type, e => { if (!e.target.closest('.d32-eject')) syncTouches(e); }, { passive: false });
  }
  // עכבר (מחשב): לחיצה רגילה, ושחרור בכל מקום בחלון
  pad.addEventListener('mousedown', e => {
    const b = e.target.closest('.d32-pad-btn');
    if (!b) return;
    e.preventDefault();
    setHeld(b.dataset.pad, true);
  });
  window.addEventListener('mouseup', () => { for (const name in buttons) if (held[name]) setHeld(name, false); });
  pad.addEventListener('contextmenu', e => e.preventDefault());
  const eject = document.createElement('button');
  eject.type = 'button';
  eject.className = 'd32-eject';
  eject.textContent = tr('הוצאת המחסנית', 'Eject cartridge');
  pad.appendChild(eject);
  // הסבר בעברית למסך השם בהיכל התהילה (המסך עצמו באנגלית, כמו אז)
  const hint = document.createElement('p');
  hint.className = 'd32-hof-hint';
  hint.dir = 'rtl';
  hint.hidden = true;
  hint.innerHTML = tr('שיא חדש! בוחרים שם של 3 אותיות: <b>▲ ▼</b> מחליפים את האות המהבהבת, <b>OK</b> עובר לאות הבאה, וה-<b>OK</b> השלישי שומר את השם.', 'New high score! Choose 3 letters: <b>▲ ▼</b> change the blinking letter, <b>OK</b> moves to the next one, and the third <b>OK</b> saves your name.');
  pad.appendChild(hint);
  tv.after(pad);

  let gen = 0, want = [];
  const gameFire = () => game && game.fireLabel === 'JUMP' ? fireLabel('JUMP', tr('קפיצה', 'Jump')) : fireLabel('FIRE', tr('אש', 'Fire'));
  let game = null, state = null, raf = 0, last = 0, acc = 0, frame = 0, overlay = null, gameTitle = '';

  const api = {
    gfx, sound,
    input: held,
    // נלחץ עכשיו (רק בפריים הראשון של הלחיצה)
    hit(name) { return !!edges[name]; },
    // לחיצה מתוכנתת (לבדיקות האוטומטיות)
    press(name) { edges[name] = true; },
    get frame() { return frame; },
    get state() { return state; },
    set state(s) { state = s; },
    // השיא הכי גבוה בהיכל התהילה (נשמר רק בדפדפן הזה)
    loadHigh(id) { const t = loadTable(id); return t.length ? t[0].s : 0; },
    saveHigh() { /* השיאים נשמרים עכשיו דרך submitScore */ },
    // סוף משחק: אם התוצאה נכנסת לחמישייה, מבקשים שלוש אותיות ומראים את הטבלה
    // במסך השם צריך גם למעלה/למטה לבחירת אות, אז בטלפון מראים את כל הכפתורים
    submitScore(id, score) { if (qualifies(id, score)) { overlay = createEntry(id, score, gameTitle); showButtons(PAD.map(x => x[0])); fireLabel('OK', tr('אישור', 'OK')); } },
    get overlay() { return overlay; }
  };

  function onKey(e, isDown) {
    if (isDown && overlay && e.key.length === 1 && /[a-z0-9]/i.test(e.key) && overlay.key(e.key)) { e.preventDefault(); return; }
    const k = KEYS[e.key] || KEYS[e.key.toLowerCase && e.key.toLowerCase()];
    if (e.key === 'Escape' && isDown) { e.preventDefault(); stop(); onEject(); return; }
    if (!k) return;
    e.preventDefault();
    if (isDown && !held[k]) edges[k] = true;
    held[k] = isDown;
  }
  const keydown = e => onKey(e, true), keyup = e => onKey(e, false);

  function loop(now) {
    if (!game) return;
    if (document.hidden) { last = now; raf = requestAnimationFrame(loop); return; }
    acc += Math.min(250, now - last);
    last = now;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      if (overlay) {
        overlay.update(api);
        if (overlay.done) { overlay = null; showButtons(want); gameFire(); onScores && onScores(); }
      } else game.update(api);
      edges = {};
      frame++;
      acc -= STEP;
      steps++;
    }
    game.draw(api);
    if (overlay) overlay.draw(api);
    hint.hidden = !(overlay && overlay.mode === 'enter');
    raf = requestAnimationFrame(loop);
  }

  async function start(loadModule, title) {
    stop();
    root.classList.add('is-cart');
    canvas.setAttribute('aria-label', tr('מסך המשחק ', 'Game screen: ') + title + tr('. שליטה: חצים, ורווח או FIRE לאש או לקפיצה. Esc מוציא את המחסנית.', '. Controls: arrows, and Space or FIRE to fire or jump. Esc ejects the cartridge.'));
    gfx.clear('#000');
    sound.tone(110, 120);
    const my = ++gen;
    const mod = (await loadModule()).default;
    if (my !== gen) return;   // בינתיים הוכנסה מחסנית אחרת או שהמחסנית הוצאה
    gameTitle = mod.title;
    overlay = null;
    game = mod;
    // רק הכפתורים שהמשחק צריך מופיעים בטלפון
    want = mod.buttons || PAD.map(x => x[0]);
    showButtons(want);
    gameFire();
    frame = 0; acc = 0; edges = {};
    releaseAll();
    state = null;
    game.init(api);
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    canvas.focus?.();
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  // הכפתור האדום: במשחקי קפיצה כתוב עליו JUMP, ובמסך השם OK
  function fireLabel(text, aria) { buttons.fire.textContent = text; buttons.fire.setAttribute('aria-label', aria); }
  function showButtons(list) {
    pad.querySelectorAll('.d32-pad-btn').forEach(b => { b.hidden = !list.includes(b.dataset.pad); });
  }
  function releaseAll() { for (const name in buttons) setHeld(name, false); edges = {}; }
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', releaseAll);

  function stop() {
    gen++;
    hint.hidden = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    game = null;
    window.removeEventListener('keydown', keydown);
    window.removeEventListener('keyup', keyup);
    root.classList.remove('is-cart');
  }

  eject.addEventListener('click', () => { stop(); onEject(); });
  // לבדיקות האוטומטיות (tools/dragon-test.mjs): גישה למצב המשחק ולכפתורים
  root.d32Cart = api;

  return { start, stop, get running() { return !!game || root.classList.contains('is-cart'); } };
}
