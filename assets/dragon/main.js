// מחבר את מסך ה-Dragon 32 לדף: מקלדת, הדבקה, כפתורים, מדף הקלטות והסמן המהבהב.
// כל אלמנט עם class="d32" בדף מקבל מחשב משלו (המבנה שלו מתואר ב-docs/DRAGON.md).
import { createMachine, COLORS, SG_BASE } from './machine.js';
import { createSound } from './sound.js';
import { createGfx } from './gfx.js';
import { createCartRunner } from './cart.js';
import { loadTable, loadWorld, worldTables } from './hof.js';
import { createTheater } from './theater.js';
import { createHelper } from './helper.js';
import { createAI } from './ai.js';
import { tr, EN } from './lang.js';

const TAPES_URL = new URL('./tapes/', import.meta.url);

// מדף הקלטות, אותו מדף בכל דף. קלטת חדשה: קובץ .bas בתיקיית tapes ושורה כאן.
const SHELF = [
  ['GUESS', tr('נחש את המספר', 'Guess the number')],
  ['LANDER', tr('נחיתה על הירח', 'Moon lander')],
  ['QUIZ', tr('חידון חשבון', 'Maths quiz')],
  ['RPS', tr('אבן, נייר, מספריים', 'Rock, paper, scissors')],
  ['CAVE', tr('מערת הדרקון', 'Dragon cave')],
  ['DRAW', tr('ציור על המסך', 'Screen drawing')]
];

// מחסניות: משחקים גרפיים. כל אחת נטענת רק כשמכניסים אותה.
const CARTS = [
  ['TOWER', tr('מגדל הדרקון', 'Dragon Tower'), () => import('./carts/tower.js')],
  ['JUNGLE', tr('נדנדת הג\'ונגל', 'Jungle Swing'), () => import('./carts/jungle.js')],
  ['EGGS', tr('ביצי הדרקון', 'Dragon Eggs'), () => import('./carts/eggs.js')],
  ['CASTLE', tr('טירת הדרקון', 'Dragon Castle'), () => import('./carts/castle.js'), 'full']
];
const CART_SLOTS = 0;
// המנוע יודע להיות גם גרסה בסיסית וגם המחשב המלא (data-edition="full": מסך מלא, כלים למתכנת, עוזר AI ומחסניות שיש רק שם).
// באפליקציה הזו הדף הוא תמיד המחשב המלא; הגרסה הבסיסית נשארה באתר האישי (gonenyarom.co.il/dragon/), כעותק קבוע
const FULL = !!document.querySelector('.d32[data-edition="full"]');
const SHOWN = CARTS.filter(c => FULL || c[3] !== 'full');
const APP_URL = '/';

// טבלת היכל התהילה בדף: לכל מחסנית "בעולם" (כל השחקנים, מהשרת) ו"בבית" (השיאים שנשמרו בדפדפן הזה)
function hofList(table) {
  const ol = document.createElement('ol');
  ol.dir = 'ltr';
  for (const e of table) {
    const li = document.createElement('li');
    const n = document.createElement('span'); n.textContent = e.n;
    const v = document.createElement('span'); v.textContent = e.s;
    li.append(n, v);
    ol.appendChild(li);
  }
  return ol;
}
function hofEmpty(text) {
  const p = document.createElement('p');
  p.className = 'd32-hof-empty';
  p.textContent = text;
  return p;
}
function renderHof() {
  const wt = worldTables();
  document.querySelectorAll('[data-hof]').forEach(box => {
    box.textContent = '';
    for (const [id, label] of SHOWN) {
      const card = document.createElement('div');
      card.className = 'd32-hof-card';
      const h = document.createElement('h3');
      h.textContent = label;
      const sub = document.createElement('span');
      sub.className = 'd32-hof-file';
      sub.dir = 'ltr';
      sub.textContent = id;
      h.append(' ', sub);
      card.appendChild(h);
      const key = id.toLowerCase();
      const w = document.createElement('p');
      w.className = 'd32-hof-sub';
      w.textContent = '🌍 ' + tr('בעולם', 'World');
      card.appendChild(w);
      if (!wt) card.appendChild(hofEmpty(tr('ההיכל העולמי לא זמין כרגע.', 'The world table is not available right now.')));
      else if (!(wt[key] || []).length) card.appendChild(hofEmpty(tr('עוד אין שיאים בעולם. תהיו הראשונים.', 'No world scores yet. Be the first.')));
      else card.appendChild(hofList(wt[key]));
      const b = document.createElement('p');
      b.className = 'd32-hof-sub';
      b.textContent = '🏠 ' + tr('בבית (בדפדפן הזה)', 'This browser');
      card.appendChild(b);
      const table = loadTable(key);
      card.appendChild(table.length ? hofList(table) : hofEmpty(tr('עוד אין שיאים. תהיו הראשונים.', 'No scores yet. Be the first.')));
      box.appendChild(card);
    }
  });
}   // חריצים ריקים עם "בקרוב", עד שיגיעו עוד מחסניות

function fillShelf(root) {
  const box = root.querySelector('.d32-tapes');
  if (!box) return;
  box.textContent = '';
  for (const [file, label] of SHELF) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'd32-tape';
    b.dataset.d32 = '1';
    b.dataset.lines = 'CLOAD "' + file + '"|RUN';
    b.innerHTML = '<span class="d32-tape-label"></span><span class="d32-tape-reels" aria-hidden="true"><i></i><i></i></span><span class="d32-tape-file" dir="ltr"></span><span class="d32-made"></span>';
    b.querySelector('.d32-tape-label').textContent = label;
    b.querySelector('.d32-tape-file').textContent = file;
    // במה נכתב: כל הקלטות הן תוכניות BASIC שכתבנו (אפשר לראות את הקוד ב-LIST)
    b.querySelector('.d32-made').textContent = tr('BASIC · נכתב על ידינו', 'BASIC · written by us');
    // מתחת לקלטת: אותה קלטת במכונת ה-Dragon (שם היא נטענת ומתחילה לבד)
    const real = document.createElement('a');
    real.className = 'd32-tape-real';
    real.href = (EN ? '/en' : '') + '/lab/1982/?tape=' + file.toLowerCase();
    real.textContent = tr('🧪 במכונת ה-Dragon', '🧪 On the Dragon machine');
    const wrap = document.createElement('div');
    wrap.className = 'd32-tape-box';
    wrap.append(b, real);
    box.appendChild(wrap);
  }
}

// שיתוף תוכנית: הטקסט נשמר בתוך הקישור עצמו (אחרי #, כך שהוא לא נשלח לשום שרת)
const SHARE_MAX = 4000;
function encodeProgram(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodeProgram(code) {
  try {
    const bin = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
    return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))).slice(0, SHARE_MAX);
  } catch { return null; }
}
// קישור למכונת ה-Dragon עם התוכנית בתוכו
const labLink = text => (EN ? '/en' : '') + '/lab/1982/#p=' + encodeProgram(text);
const sharedCode = (/[#&]p=([A-Za-z0-9_-]+)/.exec(location.hash) || [])[1];
let sharedTaken = false;

// קלטת = קובץ טקסט בתיקיית tapes. 404 = אין קלטת כזו (null); בעיית רשת = זריקה, והמכונה מציגה ?IO ERROR
// הקלטות שלכם (CSAVE): נשמרות רק בדפדפן הזה. עד 6 קלטות; קלטת חדשה מעבר לזה מפנה את הישנה ביותר
const MINE_KEY = 'd32-mytapes', MINE_MAX = 6;
function myTapes() {
  try {
    const t = JSON.parse(localStorage.getItem(MINE_KEY) || '[]');
    return Array.isArray(t) ? t.filter(x => x && typeof x.n === 'string' && typeof x.t === 'string') : [];
  } catch { return []; }
}
function saveMyTape(name, text) {
  try {
    const list = myTapes().filter(x => x.n !== name);
    list.push({ n: name, t: text });
    while (list.length > MINE_MAX) list.shift();
    localStorage.setItem(MINE_KEY, JSON.stringify(list));
    return true;
  } catch { return false; }
}
function deleteMyTape(name) {
  try { localStorage.setItem(MINE_KEY, JSON.stringify(myTapes().filter(x => x.n !== name))); } catch { /* בלי אחסון */ }
}
// הקלטות שלכם על המדף, אחרי הקלטות הקבועות. bind מחבר לכל קלטת את הלחיצה שטוענת אותה.
// ליד כל קלטת כפתור מחיקה קטן: לחיצה ראשונה שואלת "למחוק?", השנייה מוחקת
function renderMine(root, bind) {
  const box = root.querySelector('.d32-tapes');
  if (!box) return;
  box.querySelectorAll('.d32-tape-wrap').forEach(w => w.remove());
  for (const { n } of myTapes()) {
    const wrap = document.createElement('div');
    wrap.className = 'd32-tape-wrap';
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'd32-tape d32-tape-mine';
    b.dataset.d32 = '1';
    b.dataset.lines = 'CLOAD "' + n + '"|LIST';
    b.innerHTML = '<span class="d32-tape-label">' + tr('הקלטת שלי', 'My tape') + '</span><span class="d32-tape-reels" aria-hidden="true"><i></i><i></i></span><span class="d32-tape-file" dir="ltr"></span>';
    b.querySelector('.d32-tape-file').textContent = n;
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'd32-tape-del';
    del.textContent = '✕';
    del.setAttribute('aria-label', tr('מחיקת הקלטת ', 'Delete tape ') + n);
    let armed = 0;
    del.addEventListener('click', () => {
      if (!armed) {
        del.textContent = tr('למחוק?', 'Delete?');
        del.classList.add('is-armed');
        armed = setTimeout(() => { armed = 0; del.textContent = '✕'; del.classList.remove('is-armed'); }, 3000);
        return;
      }
      clearTimeout(armed);
      deleteMyTape(n);
      renderMine(root, bind);
    });
    // מתחת לקלטת: אותה תוכנית במכונת ה-Dragon (שם היא נטענת מקלטת טקסט, כמו CSAVE "X",A, ומתחילה לבד)
    const real = document.createElement('a');
    real.className = 'd32-tape-real';
    real.href = (EN ? '/en' : '') + '/lab/1982/?mine=' + n;
    real.textContent = tr('🧪 במכונת ה-Dragon', '🧪 On the Dragon machine');
    wrap.append(b, del, real);
    box.appendChild(wrap);
    if (bind) bind(b);
  }
}

async function loadTape(name) {
  if (!/^[A-Z0-9]{1,8}$/.test(name)) return null;
  const mine = myTapes().find(x => x.n === name);
  if (mine) return mine.t;
  const res = await fetch(new URL(name.toLowerCase() + '.bas', TAPES_URL));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('tape ' + res.status);
  return res.text();
}

function mount(root) {
  fillShelf(root);
  const screen = root.querySelector('.d32-screen');
  const out = root.querySelector('.d32-out');
  const input = root.querySelector('.d32-input');
  const prompt = root.querySelector('.d32-prompt');
  const sound = createSound();

  function syncCursor() { prompt.classList.toggle('has-text', input.value !== ''); }

  // המסך הגרפי של ה-BASIC (PMODE/SCREEN): קנבס שמחליף את מסך הטקסט בזמן שתוכנית מציירת
  const gcanvas = document.createElement('canvas');
  gcanvas.className = 'd32-gcanvas';
  gcanvas.setAttribute('role', 'img');
  gcanvas.setAttribute('aria-label', tr('המסך הגרפי של התוכנית. Esc או BREAK עוצרים.', 'The program\'s graphics screen. Esc or BREAK stops it.'));
  root.querySelector('.d32-tv').appendChild(gcanvas);
  const gfx = createGfx(gcanvas);
  gfx.clear('#13d613');

  const ARROWS = { ArrowUp: '^', ArrowDown: '\n', ArrowLeft: '\b', ArrowRight: '\t' };
  function gfxKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); userBreak(); return; }
    if ((e.key.length === 1 || ARROWS[e.key]) && machine.key(ARROWS[e.key] || e.key.toUpperCase())) e.preventDefault();
  }

  // קורא מסך: המסך עצמו לא מוקרא כל הזמן (aria-live="off"), אבל השורות החדשות שהמחשב הדפיס
  // מוקראות פעם אחת, בקצרה, אחרי שהוא נרגע (נגישות לפי ת"י 5568)
  const sr = document.createElement('div');
  sr.className = 'visually-hidden';
  sr.setAttribute('role', 'status');
  sr.setAttribute('aria-live', 'polite');
  sr.lang = 'en';
  root.appendChild(sr);
  let srPrev = [], srNew = [], srTimer = 0;
  function announce(rows) {
    const cur = rows.map(r => r.replace(/[\uE000-\uE08F]/g, '').trimEnd());
    // המסך גולל למעלה: מוצאים איפה השורות הקודמות נגמרות, וכל מה שאחריהן חדש
    let j = Math.min(cur.length, srPrev.length);
    while (j > 0 && cur.slice(0, j).join('\n') !== srPrev.slice(srPrev.length - j).join('\n')) j--;
    srNew.push(...cur.slice(j).filter(Boolean));
    srPrev = cur;
    clearTimeout(srTimer);
    srTimer = setTimeout(() => {
      const say = srNew.slice(-4).join('. ');
      srNew = [];
      if (say && !root.classList.contains('is-gfx') && !root.classList.contains('is-cart')) sr.textContent = say;
    }, 600);
  }

  const view = {
    gfx,
    graphics(on) {
      root.classList.toggle('is-gfx', on);
      // כשהמסך הגרפי מוצג, שורת ההקלדה מוסתרת, אז המקשים נקלטים מכל הדף
      if (on) window.addEventListener('keydown', gfxKey); else window.removeEventListener('keydown', gfxKey);
    },
    show(rows) {
      announce(rows);
      const txt = rows.join('\n');
      if (!/[\uE000-\uE08F]/.test(txt)) { out.textContent = txt; return; }
      // SET/RESET: תו של גרפיקה גסה מצויר כריבוע עם 4 רבעים
      out.textContent = '';
      let buf = '';
      for (const ch of txt) {
        const v = ch.charCodeAt(0) - SG_BASE;
        if (v < 0 || v >= 144) { buf += ch; continue; }
        if (buf) { out.append(buf); buf = ''; }
        const sp = document.createElement('span'), c = COLORS[v >> 4];
        sp.className = 'd32-sg';
        const q = ['0 0', '100% 0', '0 100%', '100% 100%'].filter((pos, k) => v & (1 << k));
        sp.style.background = q.map(pos => `linear-gradient(${c},${c}) ${pos}/50% 50% no-repeat`).concat('#000').join(',');
        out.appendChild(sp);
      }
      if (buf) out.append(buf);
    },
    color(index, isDark) {
      screen.style.background = index === undefined ? '' : COLORS[index];
      screen.classList.toggle('is-dark', isDark);
    },
    busy(isBusy) {
      root.classList.toggle('is-running', isBusy);
      // כפתור "עצירה" על המסך: רק כשתוכנית באמת רצה (לא בזמן טעינת קלטת)
      let can = false;
      try { can = isBusy && machine.running; } catch { /* המכונה עוד נבנית */ }
      root.classList.toggle('is-stoppable', can);
    },
    // תוכנית רצה: המסך מראה 16 שורות, ושורת ההקלדה מתכווצת (נשארת בפוקוס בשביל INKEY$)
    full(on) { root.classList.toggle('is-full', on); },
    prefill(text) { input.value = text; syncCursor(); },
    // התוכנית שבזיכרון שמורה (נטענה מקלטת או מקובץ, או נשמרה): טעינת קלטת לא צריכה להזהיר
    kept() { kept = machine.programText(); }
  };
  let kept = '';
  root.addEventListener('d32-kept', () => { kept = machine.programText(); });
  const unsaved = () => { const t = machine.programText(); return t !== '' && t !== kept; };

  // ג'ויסטיק: החיצים במקלדת (מחזיקים = קצה, עוזבים = אמצע), או נגיעה/עכבר על המסך
  const joy = { x: 31, y: 31 }, held = {};
  const JOY_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
  function joyKey(e, down) {
    if (!JOY_KEYS.includes(e.key)) return;
    held[e.key] = down;
    joy.x = held.ArrowLeft ? 0 : held.ArrowRight ? 63 : 31;
    joy.y = held.ArrowUp ? 0 : held.ArrowDown ? 63 : 31;
  }
  window.addEventListener('keydown', e => joyKey(e, true));
  window.addEventListener('keyup', e => joyKey(e, false));
  const tvBox = root.querySelector('.d32-tv');
  function joyPoint(e) {
    if (e.pointerType === 'mouse' && !e.buttons) return;
    if (e.target.closest('button')) return;   // לחיצה על כפתור (למשל ההדלקה) לא מזיזה את הג'ויסטיק
    const r = (root.classList.contains('is-gfx') ? gcanvas : screen).getBoundingClientRect();
    if (!r.width || !r.height) return;
    joy.x = Math.max(0, Math.min(63, Math.round((e.clientX - r.left) / r.width * 63)));
    joy.y = Math.max(0, Math.min(63, Math.round((e.clientY - r.top) / r.height * 63)));
  }
  tvBox.addEventListener('pointerdown', joyPoint);
  tvBox.addEventListener('pointermove', joyPoint);

  const machine = createMachine({ view, sound, loadTape, joy: () => joy, saveTape(name, text) {
    if (!saveMyTape(name, text)) return false;
    kept = text;
    renderMine(root, bindPress);
    return true;
  } });
  // "מה קרה?": הסבר בעברית מתחת למסך לכל שגיאה. נסגר כשמקלידים את הפקודה הבאה
  const helper = createHelper({ root, machine });
  view.error = (code, lineNo, ctx) => helper.show(code, lineNo, ctx);
  // BREAK שהמשתמש לחץ בזמן שתוכנית רצה: אם הבדיקה מוצאת חשד, מסבירים מה כנראה לא עבד
  const userBreak = () => { const was = machine.running; machine.brk(); if (was) helper.report('break'); };
  // כפתור על המסך, גם בטלפון (שם אין Esc): עוצר תוכנית שרצה, או חוזר מציור למסך הטקסט
  root.querySelector('.d32-stop')?.addEventListener('click', () => { userBreak(); input.focus({ preventScroll: true }); });
  // כפתור "בדיקת התוכנית" ליד כפתור השיתוף
  const shareRow = root.querySelector('.d32-share-row');
  if (shareRow) {
    const check = document.createElement('button');
    check.type = 'button';
    check.className = 'd32-check';
    check.textContent = '🔍 ' + tr('בדיקת התוכנית', 'Check the program');
    check.addEventListener('click', () => { helper.report('check'); root.querySelector('.d32-helper').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
    shareRow.prepend(check, ' ');
    // "פתח במכונה": התוכנית שבזיכרון, כמו שהיא, נפתחת במכונת ה-Dragon (בלשונית חדשה, כדי שהיא לא תאבד כאן).
    // התוכנית נוסעת בתוך הקישור (#p=, כמו בשיתוף), והמכונה טוענת אותה מקלטת טקסט ומריצה
    const toLab = document.createElement('button');
    toLab.type = 'button';
    toLab.className = 'd32-tolab';
    toLab.textContent = '🧪 ' + tr('פתח במכונה', 'Open on the machine');
    toLab.addEventListener('click', () => {
      const text = machine.programText();
      const say = msg => { const n = root.querySelector('.d32-share-note'); if (n) n.textContent = msg; };
      if (!text) { say(tr('אין עדיין תוכנית. כתבו שורות עם מספרים (או טענו קלטת), ואז פתחו במכונה.', 'No program yet. Type numbered lines (or load a tape), then open it on the machine.')); return; }
      if (text.length > SHARE_MAX) { say(tr('התוכנית ארוכה מדי לקישור. שמרו אותה עם CSAVE "NAME", ופתחו אותה מהמדף, מהקישור שמתחת לקלטת.', 'The program is too long for a link. Save it with CSAVE "NAME" and open it from the shelf, with the link under the tape.')); return; }
      say('');
      window.open(labLink(text), '_blank', 'noopener');
    });
    shareRow.append(' ', toLab);
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      helper.clear();
      const v = input.value;
      input.value = '';
      machine.type(v);
      syncCursor();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      userBreak();
    } else if (machine.running && e.key.length === 1 || machine.running && /^Arrow/.test(e.key)) {
      // בזמן שתוכנית רצה, מקשים הולכים ל-INKEY$ (חצים נשלחים כמו במקור: למעלה=^ וכו')
      if (machine.key(ARROWS[e.key] || e.key.toUpperCase())) e.preventDefault();
    }
  });
  // הדבקה של כמה שורות בבת אחת: כל שורה נשלחת בנפרד, כאילו הוקלדה
  input.addEventListener('paste', e => {
    const text = (e.clipboardData || window.clipboardData).getData('text') || '';
    if (!/[\r\n]/.test(text)) return;
    e.preventDefault();
    input.value = '';
    machine.queue(text.split(/\r?\n/).filter(l => l.trim() !== ''));
  });
  input.addEventListener('input', syncCursor);
  input.addEventListener('blur', syncCursor);
  screen.addEventListener('click', () => input.focus({ preventScroll: true }));

  // הדלקת המחשב: בחדר ה-Dragon המסך מתחיל כבוי (data-power="off"), ולוחצים כדי להדליק
  let on = root.dataset.power !== 'off';
  let booting = null;
  function powerOn() {
    if (on) return Promise.resolve();
    if (booting) return booting;
    booting = new Promise(resolve => {
      root.classList.remove('is-off');
      root.classList.add('is-warming');
      sound.noise(160, 0.05);
      sound.tone(60, 700, 50, 0.03);   // זמזום הטלוויזיה שמתחממת
      const quick = matchMedia('(prefers-reduced-motion: reduce)').matches;
      setTimeout(() => {
        on = true;
        root.classList.remove('is-warming');
        machine.boot();
        resolve();
      }, quick ? 50 : 1000);
    });
    return booting;
  }
  const whenOn = fn => () => powerOn().then(fn);
  let stopCart = () => {};
  const power = root.querySelector('.d32-power');
  if (!on) {
    root.classList.add('is-off');
    power?.addEventListener('click', whenOn(() => input.focus({ preventScroll: true })));
  }

  // אחרי לחיצה על פקודה או קלטת: בטלפון המסך נמצא למעלה והמקלדת מסתירה, אז מגלגלים אל המסך בלי לפתוח מקלדת
  const touch = matchMedia('(pointer: coarse)').matches;
  function showTv() {
    if (!touch) { input.focus({ preventScroll: true }); return; }
    input.blur();
    const tv = root.querySelector('.d32-tv');
    if (tv.getBoundingClientRect().top < 0 || tv.getBoundingClientRect().bottom > innerHeight) {
      tv.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }

  // קלטת מחליפה את התוכנית שבזיכרון. אם כתבתם משהו ולא שמרתם: חלונית ליד הקלטת, עם שתי בחירות:
  // "לשמור קודם" (מכין CSAVE "" בשורת ההקלדה) או "להחליף" (טוען). גם לחיצה נוספת על הקלטת טוענת
  let armed = null;
  function tapeGuard(b) {
    if (!/^CLOAD/.test(b.getAttribute('data-lines') || '') || !unsaved() || armed === b) { disarm(); return true; }
    disarm();
    armed = b;
    b.classList.add('is-armed');
    const box = document.createElement('div');
    box.className = 'd32-tape-warn';
    box.setAttribute('role', 'alertdialog');
    box.setAttribute('aria-label', tr('תוכנית שלא נשמרה', 'Unsaved program'));
    const msg = document.createElement('p');
    msg.textContent = tr('⚠️ יש בזיכרון תוכנית שלא נשמרה, והקלטת תמחק אותה.', '⚠️ There is an unsaved program in memory, and the tape will erase it.');
    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'd32-warn-save';
    save.textContent = '💾 ' + tr('לשמור קודם', 'Save first');
    save.addEventListener('click', () => {
      disarm();
      view.prefill('CSAVE "');
      showTv();
      input.focus({ preventScroll: true });
    });
    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'd32-warn-go';
    go.textContent = tr('להחליף', 'Replace');
    go.addEventListener('click', () => { armed = b; b.click(); });
    const row = document.createElement('p');
    row.append(save, go);
    box.append(msg, row);
    (b.closest('.d32-tape-wrap, .d32-tape-box') || b).after(box);
    box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    save.focus({ preventScroll: true });
    return false;
  }
  function disarm() {
    if (armed) armed.classList.remove('is-armed');
    armed = null;
    root.querySelectorAll('.d32-tape-warn').forEach(n => n.remove());
  }

  function bindPress(b) {
    b.addEventListener('click', whenOn(() => {
      if (!tapeGuard(b)) return;
      stopCart();   // קלטת או BREAK בזמן משחק: קודם מוציאים את המחסנית
      if (b.getAttribute('data-d32') === 'break') userBreak();
      else machine.press(b.getAttribute('data-lines').split('|'));
      showTv();
    }));
  }
  root.querySelectorAll('[data-d32]').forEach(bindPress);
  renderMine(root, bindPress);
  screen.addEventListener('click', whenOn(() => {}));

  // שיתוף: קישור לחדר ה-Dragon עם התוכנית בתוכו. בטלפון נפתח תפריט השיתוף, במחשב הקישור מועתק
  const shareBtn = root.querySelector('.d32-share');
  const shareNote = root.querySelector('.d32-share-note');
  shareBtn?.addEventListener('click', whenOn(async () => {
    const text = machine.programText();
    const say = msg => { if (shareNote) shareNote.textContent = msg; };
    if (!text) { say(tr('אין עדיין תוכנית לשתף. כתבו שורות עם מספרים (או טענו קלטת), ואז שתפו.', 'No program to share yet. Type numbered lines (or load a tape), then share.')); return; }
    if (text.length > SHARE_MAX) { say(tr('התוכנית ארוכה מדי לקישור.', 'The program is too long for a link.')); return; }
    const url = new URL(EN ? '/en/' : '/', location.href);
    url.hash = 'p=' + encodeProgram(text);
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: tr('תוכנית BASIC ל-Dragon 32', 'A BASIC program for the Dragon 32'), text: tr('כתבתי תוכנית ל-Dragon 32. פתחו והקלידו RUN:', 'I wrote a program for the Dragon 32. Open it and type RUN:'), url: url.href });
        say('');
      } else {
        await navigator.clipboard.writeText(url.href);
        say(tr('הקישור הועתק. מי שיפתח אותו יקבל את התוכנית, ויקליד RUN.', 'Link copied. Whoever opens it gets the program and types RUN.'));
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      say(tr('לא הצלחתי להעתיק. זה הקישור: ', 'Could not copy. Here is the link: ') + url.href);
    }
  }));

  // מדף המחסניות קיים רק בחדר ה-Dragon
  const carts = root.querySelector('.d32-carts');
  if (carts) {
    const runner = createCartRunner(root, sound, { onEject() { input.focus({ preventScroll: true }); renderHof(); }, onScores: renderHof });
    stopCart = () => { if (runner.running) { runner.stop(); renderHof(); } };
    for (const [id, label, load] of SHOWN) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'd32-cart';
      b.innerHTML = '<span class="d32-cart-label"></span><span class="d32-cart-file" dir="ltr"></span><span class="d32-made"></span>';
      b.querySelector('.d32-cart-label').textContent = label;
      b.querySelector('.d32-cart-file').textContent = id;
      // במה נכתב: המחסניות הן משחקים חדשים שכתבנו ב-JavaScript (לא שפת מכונה של ה-Dragon)
      b.querySelector('.d32-made').textContent = tr('JavaScript · משחק חדש', 'JavaScript · new game');
      b.addEventListener('click', () => {
        machine.brk();
        input.blur();
        root.querySelector('.d32-tv').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        // כמו במחשב האמיתי: מכניסים מחסנית, ואם המחשב כבוי, הוא נדלק ישר לתוך המשחק
        if (on) runner.start(load, label);
        else { on = true; root.classList.remove('is-off'); runner.start(load, label); setTimeout(() => machine.boot(), 0); }
      });
      carts.appendChild(b);
    }
    // בגרסה הבסיסית: המחסניות של המחשב המלא מופיעות על המדף כקישור אליו
    if (!FULL) for (const [id, label] of CARTS.filter(c => c[3] === 'full')) {
      const a = document.createElement('a');
      a.className = 'd32-cart is-more';
      a.href = APP_URL;
      a.innerHTML = '<span class="d32-cart-label"></span><span class="d32-cart-file">' + tr('במחשב המלא ←', 'In the full computer →') + '</span>';
      a.querySelector('.d32-cart-label').textContent = label;
      carts.appendChild(a);
    }
    for (let k = 0; k < CART_SLOTS; k++) {
      const d = document.createElement('div');
      d.className = 'd32-cart is-empty';
      d.setAttribute('aria-hidden', 'true');
      d.innerHTML = '<span class="d32-cart-label">' + tr('בקרוב', 'Soon') + '</span>';
      carts.appendChild(d);
    }
  }

  // הקלדה "אמיתית" של תוכנית מעיתון: אות אחרי אות בשורת ההקלדה, ו-Enter בסוף כל שורה
  let typing = null;
  let typingDone = null;
  function typeLines(lines, done) {
    if (typing) clearTimeout(typing);
    // הקלדה קודמת נקטעה: מודיעים לה שהסתיימה (למשל כדי שהכפתור שלה יחזור לעצמו)
    if (typingDone) { const d = typingDone; typingDone = null; d(); }
    typingDone = done || null;
    let li = 0, ci = 0;
    const quick = matchMedia('(prefers-reduced-motion: reduce)').matches;
    machine.press([]);
    input.focus({ preventScroll: true });
    const stepType = () => {
      if (li >= lines.length) { typing = null; syncCursor(); typingDone = null; done && done(); return; }
      const line = lines[li];
      if (ci < line.length && !quick) {
        input.value = line.slice(0, ++ci);
        syncCursor();
        if (ci % 3 === 0) sound.tone(1800, 8, null, 0.015);   // תקתוק המקלדת
        typing = setTimeout(stepType, 28);
      } else {
        input.value = '';
        machine.type(line);
        li++; ci = 0;
        typing = setTimeout(stepType, quick ? 30 : 160);
      }
    };
    stepType();
  }
  root.d32 = { powerOn, typeLines, stopTyping() { if (typing) clearTimeout(typing); typing = null; if (typingDone) { const d = typingDone; typingDone = null; d(); } } };
  input.addEventListener('keydown', e => { if (typing && e.key !== 'Escape') root.d32.stopTyping(); });

  // במחשב: מצב "סלון של פעם" (מסך מלא, טלוויזיה ומקלדת מצוירת). רק בחדר ה-Dragon
  // רק במחשב המלא: מסך מלא, כלים למתכנת ועוזר AI. במחשב שולחני הוא נפתח ישר במסך המלא
  let theater = null;
  if (FULL && root.classList.contains('d32-room')) {
    theater = createTheater({ root, input, machine, sound, powerOn });
    createAI({ root, machine, input, powerOn });
  }

  root.classList.add('is-ready');
  // תוכנית מקישור ששיתפו: המחשב הראשון בדף נדלק וטוען אותה
  if (sharedCode && !sharedTaken) {
    sharedTaken = true;
    const text = decodeProgram(sharedCode);
    if (text) {
      powerOn().then(() => { machine.loadText(text, 'LINK'); });
      // מי שקיבל קישור: אפשר להריץ את אותה תוכנית גם במכונת ה-Dragon
      const a = document.createElement('a');
      a.className = 'd32-link-lab';
      a.href = labLink(text);
      a.textContent = tr('🧪 התוכנית מהקישור, במכונת ה-Dragon', '🧪 The program from the link, on the Dragon machine');
      root.querySelector('.d32-tv')?.after(a);
    }
  }
  if (on && !sharedTaken) machine.boot();
  // במחשב שולחני נכנסים לבד למסך המלא: בטעינה, כשהחלון מקבל את גודלו רק אחרי הטעינה,
  // וכשחוזרים לעמוד בכפתור "חזרה" של הדפדפן. אם המשתמש יצא בעצמו, לא נכנסים שוב.
  if (theater) {
    const desk = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)');
    // בטלפון (מסך מגע, לא מחשב): האפליקציה נפתחת במסך אחד עם לשוניות למטה
    const touchPhone = matchMedia('(pointer: coarse)');
    // המחשב: במחשב שולחני רחב מסך מלא, ובכל השאר (טלפון, חלון צר) מסך האפליקציה. הדף עצמו הוא רק המדריך
    const toComputer = () => {
      if (desk.matches && !touchPhone.matches) { if (!theater.active) theater.enter(); }
      else if (!theater.phone) theater.enterPhone();
    };
    root.d32.toComputer = toComputer;
    const auto = () => {
      if (theater.left) return;
      if (desk.matches && theater.phone) theater.exitPhone(true);   // החלון התרחב: עוברים למסך המלא
      toComputer();
    };
    auto();
    document.documentElement.classList.remove('d32-booting');
    desk.addEventListener('change', auto);
    addEventListener('pageshow', e => { if (e.persisted) auto(); });
    document.querySelector('.guide-back')?.addEventListener('click', toComputer);
    // הדבקה כשהמחשב פתוח (⌘V / Ctrl+V), גם בלי ללחוץ קודם על המסך: הקוד נכנס למחשב
    document.addEventListener('paste', e => {
      if (!theater.active && !theater.phone) return;
      const t = e.target;
      if (t === input || (t && t.closest && t.closest('input, textarea, [contenteditable="true"]'))) return;
      const text = (e.clipboardData || window.clipboardData).getData('text') || '';
      if (!text.trim()) return;
      e.preventDefault();
      powerOn().then(() => {
        if (/[\r\n]/.test(text.trim())) machine.queue(text.split(/\r?\n/).filter(l => l.trim() !== ''));
        else { input.value += text.trim(); input.dispatchEvent(new Event('input')); }
        input.focus({ preventScroll: true });
      });
    });
  }
}

document.querySelectorAll('.d32').forEach(mount);
renderHof();
loadWorld().then(renderHof);

// "אז והיום" במדריך: מתחת לכל קטע קוד, "הקלד במחשב" ו"העתקה" (גונן, 17.10)
document.querySelectorAll('.room-then .d32-code').forEach((pre, i) => {
  pre.id = pre.id || 'then-code-' + (i + 1);
  const row = document.createElement('p');
  row.className = 'mag-actions then-actions';
  row.innerHTML = `<button type="button" class="mag-typein" data-typein="#${pre.id}" data-target="#dragon-room" data-run="1">⌨ ${tr('הקלד במחשב', 'Type it in')}</button> <button type="button" class="mag-copy" data-copy="#${pre.id}">📋 ${tr('העתקה', 'Copy')}</button> <span class="mag-copied" role="status"></span>`;
  pre.after(row);
});

// "תקליד בשבילי": כפתור ליד תוכנית מודפסת (data-typein="#מזהה-של-pre", data-target="#מזהה-של-מחשב")
document.querySelectorAll('[data-typein]').forEach(b => {
  b.addEventListener('click', () => {
    const pre = document.querySelector(b.dataset.typein);
    const root = document.querySelector(b.dataset.target);
    if (!pre || !root || !root.d32) return;
    const lines = ['NEW'].concat(pre.textContent.split('\n').map(l => l.trim()).filter(Boolean), b.dataset.run ? ['RUN'] : []);
    // חוזרים למחשב, ושם הוא מקליד את התוכנית
    if (root.d32.toComputer) root.d32.toComputer();
    else root.querySelector('.d32-tv').scrollIntoView({ block: 'center', behavior: 'smooth' });
    root.d32.powerOn().then(() => root.d32.typeLines(lines));
  });
});

// "העתקה": כל התוכנית ללוח, כדי לשמור אותה או להדביק במחשב
document.querySelectorAll('[data-copy]').forEach(b => {
  const done = b.parentElement.querySelector('.mag-copied');
  b.addEventListener('click', async () => {
    const pre = document.querySelector(b.dataset.copy);
    if (!pre) return;
    let ok = true;
    try { await navigator.clipboard.writeText(pre.textContent.trim() + '\n'); } catch { ok = false; }
    if (done) {
      done.textContent = ok ? tr('הועתק ✓ עכשיו אפשר לחזור למחשב ולהדביק.', 'Copied ✓ Now go back to the computer and paste.') : tr('לא הצלחתי להעתיק. אפשר לפתוח את הקוד ולסמן אותו.', 'Could not copy. Open the code and select it.');
      clearTimeout(b._t);
      b._t = setTimeout(() => { done.textContent = ''; }, 5000);
    }
  });
});
