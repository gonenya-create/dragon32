// היכל התהילה: חמשת השיאים בכל מחסנית, עם שלוש אותיות של שם, כמו במכונות הארקייד של אז.
// נשמר רק בדפדפן הזה (localStorage). אם אין גישה לאחסון, המשחק עובד כרגיל, פשוט בלי טבלה.
import { W, H, PALETTES } from './gfx.js';

const [GREEN, YELLOW, , RED] = PALETTES[0];
const SIZE = 5;
const TOUCH = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';

export function loadTable(id) {
  try {
    const t = JSON.parse(localStorage.getItem('d32-hof-' + id) || 'null');
    if (Array.isArray(t)) return t.filter(e => e && typeof e.s === 'number').slice(0, SIZE);
    // שיא ישן (לפני שהיה היכל תהילה) נכנס לטבלה בלי שם
    const old = +localStorage.getItem('d32-high-' + id) || 0;
    return old ? [{ n: '???', s: old }] : [];
  } catch { return []; }
}
function saveTable(id, table) {
  try { localStorage.setItem('d32-hof-' + id, JSON.stringify(table.slice(0, SIZE))); } catch { /* בלי טבלה */ }
}
// ההיכל העולמי (api/hof.js): עשרת השיאים של כל השחקנים. אם השרת לא זמין, הכול עובד כרגיל עם הטבלה של הבית
const WORLD = 10;
let world = null;   // { tower: [{n, s}], ... } או null כשלא נטען
export function worldTables() { return world; }
export async function loadWorld() {
  try {
    const r = await fetch('/api/hof/', { cache: 'no-store' });
    if (!r.ok) return world;
    const d = await r.json();
    if (d && d.tables) world = d.tables;
  } catch { /* בלי רשת: נשארים עם מה שיש */ }
  return world;
}
async function sendWorld(id, name, score) {
  try {
    const r = await fetch('/api/hof/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ game: id, name, score }) });
    if (!r.ok) return null;
    const d = await r.json();
    if (d && d.tables) world = Object.assign(world || {}, d.tables);
    return d && d.rank;
  } catch { return null; }
}
function worldQualifies(id, score) {
  if (!world) return false;
  const t = world[id] || [];
  return t.length < WORLD || score > t[t.length - 1].s;
}

export function qualifies(id, score) {
  if (score <= 0) return false;
  const t = loadTable(id);
  return t.length < SIZE || score > t[t.length - 1].s || worldQualifies(id, score);
}
function lastInitials() {
  try { return (localStorage.getItem('d32-initials') || 'AAA').slice(0, 3).padEnd(3, 'A'); } catch { return 'AAA'; }
}

// מסך הכנסת השם והטבלה, מעל המשחק. מחזיר אובייקט עם update/draw/key, ו-done=true כשמסיימים.
export function createEntry(id, score, title) {
  const letters = lastInitials().split('').map(c => Math.max(0, ABC.indexOf(c)));
  const o = { mode: 'enter', pos: 0, t: 0, done: false, rank: -1 };

  function commit() {
    const name = letters.map(i => ABC[i]).join('').replace(/\s+$/, '') || '???';
    try { localStorage.setItem('d32-initials', name.padEnd(3, ' ')); } catch { /* בלי זיכרון */ }
    const table = loadTable(id);
    table.push({ n: name, s: score });
    table.sort((a, b) => b.s - a.s);
    o.rank = table.findIndex(e => e.n === name && e.s === score);
    saveTable(id, table);
    o.table = table.slice(0, SIZE);
    if (o.rank >= SIZE) o.rank = -1;   // נכנס רק לטבלה העולמית
    o.mode = 'table'; o.t = 0;
    // גם להיכל העולמי. התשובה (המקום בעולם) מופיעה מתחת לטבלה כשהיא מגיעה
    o.world = '...';
    sendWorld(id, name, score).then(rank => { o.world = rank ? rank : ''; });
  }

  o.update = api => {
    o.t++;
    if (o.mode === 'enter') {
      const sfx = () => api.sound.tone(880, 30);
      if (api.hit('up')) { letters[o.pos] = (letters[o.pos] + 1) % ABC.length; sfx(); }
      if (api.hit('down')) { letters[o.pos] = (letters[o.pos] + ABC.length - 1) % ABC.length; sfx(); }
      if (api.hit('left') && o.pos > 0) { o.pos--; sfx(); }
      if (api.hit('right') && o.pos < 2) { o.pos++; sfx(); }
      if (api.hit('fire') && o.t > 20) {
        if (o.pos < 2) { o.pos++; sfx(); }
        else { commit(); [523, 659, 784].forEach((f, n) => setTimeout(() => api.sound.tone(f, 100), n * 110)); }
      }
    } else if (api.hit('fire') && o.t > 25) {
      o.done = true;
    }
  };
  // הקלדה ישירה של אות במקלדת של המחשב
  o.key = ch => {
    if (o.mode !== 'enter') return false;
    const i = ABC.indexOf(ch.toUpperCase());
    if (i < 0 || ch === ' ') return false;
    letters[o.pos] = i;
    if (o.pos < 2) o.pos++;
    return true;
  };
  o.draw = api => {
    const g = api.gfx;
    g.rect(24, 22, W - 48, H - 44, '#000');
    g.rect(26, 24, W - 52, 2, YELLOW);
    g.rect(26, H - 26, W - 52, 2, YELLOW);
    if (o.mode === 'enter') {
      g.text('NEW HIGH SCORE!', W / 2, 36, YELLOW, 'center', 2);
      g.text(title + '  ' + score, W / 2, 60, GREEN, 'center');
      g.text('ENTER YOUR INITIALS', W / 2, 78, GREEN, 'center');
      for (let k = 0; k < 3; k++) {
        const x = W / 2 - 33 + k * 24;
        g.text(ABC[letters[k]] === ' ' ? '-' : ABC[letters[k]], x, 96, k === o.pos ? YELLOW : GREEN, 'left', 3);
        if (k === o.pos && (o.t >> 3) & 1) g.rect(x, 120, 15, 2, YELLOW);
      }
      g.text('UP/DOWN = LETTER  OK = NEXT', W / 2, 136, GREEN, 'center');
      // בטלפון אין מקלדת: אומרים מה שומר את השם
      g.text(o.pos === 2 ? 'OK = SAVE' : TOUCH ? 'THIRD OK SAVES' : 'OR JUST TYPE IT', W / 2, 148, o.pos === 2 ? YELLOW : GREEN, 'center');
    } else {
      g.text('HALL OF FAME', W / 2, 34, YELLOW, 'center', 2);
      g.text(title, W / 2, 54, GREEN, 'center');
      o.table.forEach((e, k) => {
        const y = 70 + k * 14, c = k === o.rank && (o.t >> 3) & 1 ? RED : (k === o.rank ? YELLOW : GREEN);
        g.text((k + 1) + '.', 64, y, c);
        g.text(e.n, 84, y, c);
        g.text(String(e.s), W - 64, y, c, 'right');
      });
      if (o.world) g.text(o.world === '...' ? 'WORLD RANK ...' : 'WORLD RANK #' + o.world, W / 2, H - 52, o.world !== '...' && o.world <= WORLD ? YELLOW : GREEN, 'center');
      if ((o.t >> 4) & 1 && o.t > 25) g.text('PRESS OK', W / 2, H - 38, YELLOW, 'center');
    }
  };
  return o;
}
