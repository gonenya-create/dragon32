// פקודות מוכנות (שלב 2 של העיצוב החדש, 17.10): ארגז כלים למי שלא מכיר BASIC.
// כל פקודה היא כרטיס: שם בעברית, מילת ה-BASIC, משפט הסבר וטופס קטן שכותב את השורה.
// "לנסות עכשיו" מקליד אותה במחשב, אות אחרי אות, כמו אדם. "להוסיף לתוכנית" נותן לה מספר שורה ומקליד אותה לתוכנית.
// הכול נבנה מהרשימה CARDS: כרטיס חדש = עוד שורה ברשימה.
// כל טקסט לגולש עובר דרך tr(עברית, אנגלית): הדף /en/ מקבל את האנגלית

import { tr } from './lang.js';

const COLORS4 = [['1', tr('ירוק', 'Green')], ['2', tr('צהוב', 'Yellow')], ['3', tr('כחול', 'Blue')], ['4', tr('אדום', 'Red')]];
const CLS9 = [['0', tr('שחור', 'Black')], ['1', tr('ירוק', 'Green')], ['2', tr('צהוב', 'Yellow')], ['3', tr('כחול', 'Blue')], ['4', tr('אדום', 'Red')], ['5', tr('לבן', 'White')], ['6', tr('תכלת', 'Cyan')], ['7', tr('סגול', 'Magenta')], ['8', tr('כתום', 'Orange')]];
const TUNES = [
  ['T5L4EEFGGFEDCCDEE.L8DL2D', tr('אודה לשמחה', 'Ode to Joy')],
  ['T6L8CDEFGABO3C', tr('סולם עולה', 'Rising scale')],
  ['T4L4CCGGAAL2G', tr('כוכב קטן', 'Twinkle, Twinkle')]
];
// טקסט שהמשתמש כתב: רק אותיות שה-Dragon מכיר, באותיות גדולות, בלי מרכאות שישברו את השורה
const txt = v => String(v ?? '').toUpperCase().replace(/[^A-Z0-9 !?.,:;'()+\-*\/=<>$#%&@]/g, '').slice(0, 40);
const num = (v, lo, hi, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
const GFX = 'PMODE 3,1:PCLS:SCREEN 1,0';

export const CATS = [
  ['text', tr('טקסט וחשבון', 'Text and maths')],
  ['draw', tr('ציור וצבע', 'Drawing and colour')],
  ['sound', tr('צלילים', 'Sounds')],
  ['ask', tr('שאלות ותשובות', 'Questions and answers')],
  ['loop', tr('חזרות ותנועה', 'Loops and motion')],
  ['keep', tr('שמירה וניהול', 'Saving and managing')]
];

// fields: [מפתח, תווית, סוג, ברירת מחדל, אפשרויות]. סוגים: text, num (min,max), pick (רשימה)
// code(v) מחזיר שורות. gfx: מציג את המסך הגרפי (Esc חוזר לטקסט). direct: פקודה למחשב, לא שורה בתוכנית.
// prog: שורות שעובדות רק בתוך תוכנית (GOTO, INPUT). words: מילים נוספות לחיפוש
export const CARDS = [
  { cat: 'text', he: tr('כותבים על המסך', 'Write on the screen'), en: 'PRINT', say: tr('המחשב כותב את מה שבתוך המרכאות.', 'The computer writes whatever is inside the quotes.'),
    fields: [['t', tr('מה לכתוב', 'What to write'), 'text', 'HELLO']], code: v => [`PRINT "${txt(v.t)}"`], words: tr('הדפסה כתיבה טקסט', 'print write text') },
  { cat: 'text', he: tr('מחשבון', 'Calculator'), en: 'PRINT', say: tr('בלי מרכאות, המחשב מחשב ומדפיס את התוצאה. * זה כפול, / זה חילוק.', 'Without quotes, the computer works it out and prints the answer. * means times, / means divide.'),
    fields: [['e', tr('התרגיל', 'The sum'), 'text', '7*6']], code: v => [`PRINT ${txt(v.e).replace(/[^0-9+\-*\/(). ]/g, '') || '2+2'}`], words: tr('חשבון תרגיל כפל חיבור', 'maths sum calculate times plus') },
  { cat: 'text', he: tr('צובעים את המסך', 'Colour the screen'), en: 'CLS', say: tr('מנקה את מסך הטקסט וצובע אותו.', 'Clears the text screen and colours it.'),
    fields: [['c', tr('צבע', 'Colour'), 'pick', '3', CLS9]], code: v => [`CLS ${v.c}`], words: tr('ניקוי צבע מסך', 'clear colour color screen') },
  { cat: 'text', he: tr('כותבים במקום מסוים', 'Write at a spot'), en: 'PRINT @', say: tr('כל שורה במסך היא 32 מקומות. 0 בפינה למעלה, 32 בתחילת השורה השנייה.', 'Each screen row has 32 places. 0 is the top corner, 32 starts the second row.'),
    fields: [['p', tr('מקום (0 עד 511)', 'Place (0 to 511)'), 'num', '236', 0, 511], ['t', tr('מה לכתוב', 'What to write'), 'text', 'HI']], code: v => [`PRINT @ ${num(v.p, 0, 511, 236)},"${txt(v.t)}"`], words: tr('מיקום', 'position place at') },
  { cat: 'text', he: tr('מספר אקראי', 'Random number'), en: 'RND', say: tr('בוחר מספר אקראי מ-1 עד המספר שבחרתם, כמו קובייה.', 'Picks a random number from 1 up to the number you choose, like a dice.'),
    fields: [['n', tr('עד', 'Up to'), 'num', '6', 2, 1000]], code: v => [`PRINT RND(${num(v.n, 2, 1000, 6)})`], words: tr('קובייה אקראי מזל', 'dice random luck') },

  { cat: 'draw', he: tr('מעבר למסך הגרפי', 'Switch to the graphics screen'), en: 'PMODE', say: tr('מסך של 256 על 192 נקודות בארבעה צבעים. זה הצעד הראשון לפני ציור.', 'A screen of 256 by 192 dots in four colours. This is the first step before drawing.'), gfx: true,
    fields: [['c', tr('צבע רקע', 'Background colour'), 'pick', '1', COLORS4]], code: v => [`PMODE 3,1:PCLS ${v.c}:SCREEN 1,0`], words: tr('גרפיקה מסך', 'graphics screen') },
  { cat: 'draw', he: tr('מציירים עיגול', 'Draw a circle'), en: 'CIRCLE', say: tr('מרכז העיגול (מ-0 עד 255, ומ-0 עד 191) והרדיוס.', 'The centre of the circle (0 to 255, and 0 to 191) and its radius.'), gfx: true,
    fields: [['x', tr('מרכז, ימינה', 'Centre, across'), 'num', '128', 0, 255], ['y', tr('מרכז, למטה', 'Centre, down'), 'num', '96', 0, 191], ['r', tr('רדיוס', 'Radius'), 'num', '40', 1, 120], ['c', tr('צבע', 'Colour'), 'pick', '4', COLORS4]],
    code: v => [`${GFX}:COLOR ${v.c}:CIRCLE(${num(v.x, 0, 255, 128)},${num(v.y, 0, 191, 96)}),${num(v.r, 1, 120, 40)}`], words: tr('עיגול מעגל', 'circle round ring') },
  { cat: 'draw', he: tr('מותחים קו או מלבן', 'Draw a line or a box'), en: 'LINE', say: tr('מנקודה לנקודה. "מלבן" מצייר מסגרת, ו"מלבן מלא" ממלא אותו.', 'From point to point. "Box" draws a frame, and "Filled box" fills it in.'), gfx: true,
    fields: [['a', tr('מנקודה', 'From point'), 'text', '20,20'], ['b', tr('עד נקודה', 'To point'), 'text', '200,150'], ['s', tr('צורה', 'Shape'), 'pick', '', [['', tr('קו', 'Line')], [',B', tr('מלבן', 'Box')], [',BF', tr('מלבן מלא', 'Filled box')]]], ['c', tr('צבע', 'Colour'), 'pick', '3', COLORS4]],
    code: v => { const pt = (s, d) => (String(s).match(/\d+/g) || []).slice(0, 2).map(Number).join(',') || d;
      return [`${GFX}:COLOR ${v.c}:LINE(${pt(v.a, '20,20')})-(${pt(v.b, '200,150')}),PSET${v.s}`]; }, words: tr('קו מלבן ריבוע', 'line box rectangle square') },
  { cat: 'draw', he: tr('מציירים בתנועות', 'Draw with moves'), en: 'DRAW', say: tr('U למעלה, D למטה, L שמאלה, R ימינה, עם מספר צעדים. כאן: בית קטן.', 'U up, D down, L left, R right, each with a number of steps. Here: a little house.'), gfx: true,
    fields: [['c', tr('צבע', 'Colour'), 'pick', '4', COLORS4]], code: v => [`${GFX}:DRAW "BM100,140C${v.c}U40R60D40L60BM100,100E30F30"`], words: tr('ציור בית תנועה', 'draw house moves') },
  { cat: 'draw', he: tr('צובעים צורה', 'Fill a shape'), en: 'PAINT', say: tr('ממלא צורה סגורה בצבע, מהנקודה החוצה עד הקו.', 'Fills a closed shape with colour, from the point outwards up to the line.'), gfx: true,
    fields: [['c', tr('צבע', 'Colour'), 'pick', '2', COLORS4]], code: v => [`${GFX}:COLOR 4:CIRCLE(128,96),40:PAINT(128,96),${v.c},4`], words: tr('מילוי צביעה', 'fill paint colour') },

  { cat: 'sound', he: tr('צפצוף', 'Beep'), en: 'SOUND', say: tr('גובה הצליל (1 עד 255) והאורך.', 'The pitch (1 to 255) and how long it lasts.'),
    fields: [['p', tr('גובה', 'Pitch'), 'num', '100', 1, 255], ['d', tr('אורך', 'Length'), 'num', '4', 1, 30]], code: v => [`SOUND ${num(v.p, 1, 255, 100)},${num(v.d, 1, 30, 4)}`], words: tr('צליל צפצוף', 'sound beep tone') },
  { cat: 'sound', he: tr('מנגינה', 'Tune'), en: 'PLAY', say: tr('מנגן תווים: C D E F G A B. מוזיקה מנחלת הכלל בלבד.', 'Plays notes: C D E F G A B. Public-domain music only.'),
    fields: [['m', tr('מנגינה', 'Tune'), 'pick', TUNES[0][0], TUNES]], code: v => [`PLAY "${v.m}"`], words: tr('מוזיקה מנגינה שיר תווים', 'music tune song notes') },
  { cat: 'sound', he: tr('סולם צלילים', 'Sound scale'), en: 'FOR SOUND', say: tr('לולאה שמשמיעה צלילים, מהנמוך לגבוה.', 'A loop that plays sounds, from low to high.'),
    fields: [['n', tr('כמה צלילים', 'How many sounds'), 'num', '12', 2, 30]], code: v => [`FOR I=1 TO ${num(v.n, 2, 30, 12)}:SOUND I*8,1:NEXT I`], words: tr('סולם', 'scale') },

  { cat: 'ask', he: tr('שואלים שאלה', 'Ask a question'), en: 'INPUT', say: tr('המחשב שואל ומחכה לתשובה. עובד רק בתוך תוכנית.', 'The computer asks and waits for an answer. Works only inside a program.'), prog: true,
    fields: [['q', tr('השאלה', 'The question'), 'text', 'WHAT IS YOUR NAME']], code: v => [`INPUT "${txt(v.q)}";N$`, 'PRINT "HELLO ";N$'], words: tr('שאלה קלט שם', 'question input name ask') },
  { cat: 'ask', he: tr('אם… אז', 'If… then'), en: 'IF THEN', say: tr('המחשב בודק תנאי, ועושה משהו רק אם הוא נכון.', 'The computer checks a condition, and does something only if it is true.'),
    fields: [['n', tr('גבול', 'Limit'), 'num', '50', 1, 1000]], code: v => [`A=RND(100):IF A>${num(v.n, 1, 1000, 50)} THEN PRINT A;"IS BIG" ELSE PRINT A;"IS SMALL"`], words: tr('תנאי אם', 'condition if') },
  { cat: 'ask', he: tr('מחכים למקש', 'Wait for a key'), en: 'INKEY$', say: tr('התוכנית עוצרת עד שלוחצים על מקש. ככה כתבו משחקים.', 'The program waits until you press a key. That is how games were written.'), prog: true,
    fields: [], code: () => ['PRINT "PRESS A KEY"', 'IF INKEY$="" THEN GOTO {here}', 'PRINT "THANKS!"'], words: tr('מקש המתנה משחק', 'key wait game press') },

  { cat: 'loop', he: tr('סופרים', 'Count'), en: 'FOR NEXT', say: tr('חוזר על משהו מספר פעמים. I מקבל 1, 2, 3 וכן הלאה.', 'Repeats something a number of times. I becomes 1, 2, 3 and so on.'),
    fields: [['a', tr('מ-', 'From'), 'num', '1', -100, 1000], ['b', tr('עד', 'To'), 'num', '10', -100, 1000]], code: v => [`FOR I=${num(v.a, -100, 1000, 1)} TO ${num(v.b, -100, 1000, 10)}:PRINT I;:NEXT I`], words: tr('לולאה ספירה חזרה', 'loop count repeat') },
  { cat: 'loop', he: tr('לנצח', 'Forever'), en: 'GOTO', say: tr('קופץ חזרה לשורה, שוב ושוב. BREAK או Esc עוצרים.', 'Jumps back to a line, again and again. BREAK or Esc stops it.'), prog: true,
    fields: [['t', tr('מה לכתוב', 'What to write'), 'text', 'DRAGON ']], code: v => [`PRINT "${txt(v.t)}";`, 'GOTO {prev}'], words: tr('לולאה אינסוף קפיצה', 'loop forever jump endless') },
  { cat: 'loop', he: tr('מחכים רגע', 'Wait a moment'), en: 'FOR T', say: tr('לולאה שלא עושה כלום, רק סופרת. ככה עשו "המתנה" אז.', 'A loop that does nothing, just counts. That is how you "waited" back then.'),
    fields: [['n', tr('כמה לחכות', 'How long to wait'), 'num', '500', 10, 5000]], code: v => [`FOR T=1 TO ${num(v.n, 10, 5000, 500)}:NEXT T`], words: tr('המתנה עיכוב זמן', 'wait delay pause time') },

  { cat: 'keep', he: tr('מה יש בתוכנית', 'What is in the program'), en: 'LIST', say: tr('מציג את שורות התוכנית.', 'Shows the lines of the program.'), direct: true, needsProg: true, fields: [], code: () => ['LIST'], words: tr('רשימה הצגה', 'list show') },
  { cat: 'keep', he: tr('מריצים', 'Run it'), en: 'RUN', say: tr('מריץ את התוכנית מההתחלה.', 'Runs the program from the start.'), direct: true, needsProg: true, fields: [], code: () => ['RUN'], words: tr('הרצה התחלה', 'run start') },
  { cat: 'keep', he: tr('מסדרים מספרים', 'Tidy the numbers'), en: 'RENUM', say: tr('ממספר מחדש 10, 20, 30, ומתקן את כל הקפיצות.', 'Renumbers the lines 10, 20, 30, and fixes all the jumps.'), direct: true, needsProg: true, fields: [], code: () => ['RENUM'], words: tr('מספור', 'renumber numbers') },
  { cat: 'keep', he: tr('שומרים לקלטת', 'Save to tape'), en: 'CSAVE', say: tr('שומר את התוכנית על "קלטת" בדפדפן הזה. היא תופיע במדף.', 'Saves the program on a "tape" in this browser. It will appear on the shelf.'), direct: true, needsProg: true,
    fields: [['n', tr('שם (באנגלית)', 'Name (letters and numbers)'), 'text', 'MYPROG']], code: v => [`CSAVE "${txt(v.n).replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'MYPROG'}"`], words: tr('שמירה קלטת', 'save tape cassette') },
  { cat: 'keep', he: tr('מוחקים הכול', 'Delete everything'), en: 'NEW', say: tr('מוחק את התוכנית שבזיכרון. אי אפשר לבטל!', 'Deletes the program in memory. There is no undo!'), direct: true, danger: true, fields: [], code: () => ['NEW'], words: tr('מחיקה חדש', 'delete new clear erase') }
];

export function createCommands({ root, machine, powerOn, input }) {
  const box = document.createElement('div');
  box.className = 'd32-cmds';
  box.innerHTML = `
    <label class="d32-cmds-search"><span class="visually-hidden">${tr('חיפוש פקודה', 'Search commands')}</span>
      <input type="search" placeholder="${tr('חיפוש: עיגול, צליל, מספר אקראי…', 'Search: circle, sound, random number…')}" autocomplete="off"></label>
    <div class="d32-cmds-cats" role="group" aria-label="${tr('קטגוריות', 'Categories')}"></div>
    <p class="d32-cmds-none" hidden>${tr('לא מצאתי פקודה כזו. נסו מילה אחרת, או שאלו את העוזר.', 'No command like that. Try another word, or ask the helper.')}</p>
    <div class="d32-cmds-list"></div>`;
  const search = box.querySelector('input');
  const catsEl = box.querySelector('.d32-cmds-cats');
  const list = box.querySelector('.d32-cmds-list');
  const none = box.querySelector('.d32-cmds-none');
  let cat = 'draw', open = -1;

  for (const [id, name] of CATS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.cat = id;
    b.textContent = name;
    catsEl.appendChild(b);
  }

  const values = CARDS.map(c => Object.fromEntries(c.fields.map(f => [f[0], f[3]])));
  // השורה הבאה בתוכנית: עשר אחרי האחרונה
  const nextLine = () => { const ns = machine.programText().split('\n').map(l => parseInt(l, 10)).filter(Number.isFinite); return (ns.length ? Math.max(...ns) : 0) + 10; };
  function linesOf(i, start) {
    // {here} = השורה הזו, {prev} = השורה הקודמת (בשביל GOTO בתוך תוכנית)
    return CARDS[i].code(values[i]).map((l, k) => l.replace('{here}', start + k * 10).replace('{prev}', start + (k - 1) * 10));
  }

  function card(c, i) {
    const el = document.createElement('article');
    el.className = 'd32-cmd' + (c.danger ? ' is-danger' : '');
    el.dataset.i = i;
    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'd32-cmd-head';
    head.setAttribute('aria-expanded', String(open === i));
    head.innerHTML = '<span class="d32-cmd-he"></span><span class="d32-cmd-en" dir="ltr"></span>';
    head.querySelector('.d32-cmd-he').textContent = c.he;
    head.querySelector('.d32-cmd-en').textContent = c.en;
    el.appendChild(head);
    if (open !== i) return el;
    const body = document.createElement('div');
    body.className = 'd32-cmd-body';
    const say = document.createElement('p');
    say.className = 'd32-cmd-say';
    say.textContent = c.say;
    body.appendChild(say);
    if (c.fields.length) {
      const form = document.createElement('div');
      form.className = 'd32-cmd-form';
      for (const [k, label, type, , a, b] of c.fields) {
        const lab = document.createElement('label');
        lab.textContent = label;
        let f;
        if (type === 'pick') {
          f = document.createElement('select');
          for (const [val, name] of a) { const o = document.createElement('option'); o.value = val; o.textContent = name; f.appendChild(o); }
        } else {
          f = document.createElement('input');
          f.type = type === 'num' ? 'number' : 'text';
          if (type === 'num') { f.min = a; f.max = b; f.inputMode = 'numeric'; }
          f.dir = 'ltr';
          f.autocomplete = 'off';
          f.spellcheck = false;
        }
        f.value = values[i][k];
        f.dataset.k = k;
        lab.appendChild(f);
        form.appendChild(lab);
      }
      body.appendChild(form);
    }
    const code = document.createElement('code');
    code.className = 'd32-cmd-code';
    code.dir = 'ltr';
    code.lang = 'en';
    body.appendChild(code);
    const note = document.createElement('p');
    note.className = 'd32-cmd-note';
    note.textContent = c.gfx ? tr('אחרי הציור: הכפתור "חזרה למסך הטקסט" על המסך (או Esc) מחזיר למסך הטקסט.', 'After drawing: the "Back to text" button on the screen (or Esc) takes you back to the text screen.') : c.prog ? tr('עובד רק בתוך תוכנית, אז הוא נכנס לתוכנית. אחר כך RUN.', 'Works only inside a program, so it goes into the program. Then type RUN.') : c.danger ? tr('זהירות: מוחק את התוכנית שבזיכרון.', 'Careful: this deletes the program in memory.') : '';
    if (note.textContent) body.appendChild(note);
    const row = document.createElement('div');
    row.className = 'd32-cmd-row';
    if (!c.prog) row.innerHTML += `<button type="button" class="d32-cmd-try is-main">${tr('לנסות עכשיו', 'Try it now')}</button>`;
    if (!c.direct) row.innerHTML += `<button type="button" class="d32-cmd-add">${tr('להוסיף לתוכנית', 'Add to program')}</button>`;
    body.appendChild(row);
    el.appendChild(body);
    const preview = () => { code.textContent = c.prog ? linesOf(i, nextLine()).map((l, k) => (nextLine() + k * 10) + ' ' + l).join('\n') : linesOf(i, 0).join('\n'); };
    body.addEventListener('input', e => { const k = e.target.dataset.k; if (k) { values[i][k] = e.target.value; preview(); } });
    preview();
    return el;
  }

  function render() {
    const q = search.value.trim().toLowerCase();
    for (const b of catsEl.children) b.setAttribute('aria-pressed', String(!q && b.dataset.cat === cat));
    list.textContent = '';
    let n = 0;
    CARDS.forEach((c, i) => {
      const hit = q ? (c.he + ' ' + c.en + ' ' + c.say + ' ' + (c.words || '')).toLowerCase().includes(q) : c.cat === cat;
      if (!hit) return;
      list.appendChild(card(c, i));
      n++;
    });
    none.hidden = n > 0;
  }

  // מקלידים במחשב כמו אדם (typeLines מ-main.js). קודם מדליקים, ואם רץ משהו, עוצרים אותו
  // כרטיס שאינו ציור מחזיר קודם למסך הטקסט, אחרת התוצאה נכתבת מאחורי הציור ולא רואים אותה
  // בזמן שהמחשב מקליד, הכפתור אומר "מקליד…" ולא מקבל לחיצה נוספת
  function type(lines, gfx, btn) {
    if (btn) { btn.dataset.label = btn.textContent; btn.textContent = tr('מקליד…', 'Typing…'); btn.setAttribute('aria-busy', 'true'); btn.disabled = true; }
    const done = () => { if (btn) { btn.textContent = btn.dataset.label; btn.removeAttribute('aria-busy'); btn.disabled = false; } input.focus({ preventScroll: true }); };
    powerOn().then(() => {
      if (machine.running || !gfx) machine.brk?.();
      root.d32.typeLines(lines, done);
    });
  }

  catsEl.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cat = b.dataset.cat; search.value = ''; open = -1; render(); });
  search.addEventListener('input', () => { open = -1; render(); });
  list.addEventListener('click', e => {
    const el = e.target.closest('.d32-cmd');
    if (!el) return;
    const i = +el.dataset.i;
    if (e.target.closest('.d32-cmd-head')) { open = open === i ? -1 : i; render(); list.querySelector(`[data-i="${i}"] .d32-cmd-head`)?.focus(); return; }
    // פקודה שעובדת על התוכנית (LIST, RUN, RENUM, CSAVE) כשהזיכרון ריק: מסבירים בכרטיס, במקום שגיאה על המסך
    if (e.target.closest('.d32-cmd-try') && CARDS[i].needsProg && !machine.programText()) {
      let warn = el.querySelector('.d32-cmd-empty');
      if (!warn) { warn = document.createElement('p'); warn.className = 'd32-cmd-empty'; warn.setAttribute('role', 'status'); el.querySelector('.d32-cmd-row').before(warn); }
      warn.textContent = tr('אין עדיין תוכנית בזיכרון. כתבו שורות עם מספרים (למשל 10 PRINT "HI"), או לחצו "להוסיף לתוכנית" בכרטיס אחר, ואז נסו שוב.', 'There is no program in memory yet. Type some numbered lines (for example 10 PRINT "HI"), or press "Add to program" on another card, then try again.');
      return;
    }
    const btn = e.target.closest('.d32-cmd-try, .d32-cmd-add');
    if (e.target.closest('.d32-cmd-try')) type(linesOf(i, 0), CARDS[i].gfx, btn);
    else if (e.target.closest('.d32-cmd-add')) { const s = nextLine(); type(linesOf(i, s).map((l, k) => (s + k * 10) + ' ' + l), CARDS[i].gfx, btn); }
  });
  render();
  return box;
}
