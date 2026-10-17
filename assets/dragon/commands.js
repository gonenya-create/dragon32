// פקודות מוכנות (שלב 2 של העיצוב החדש, 17.10): ארגז כלים למי שלא מכיר BASIC.
// כל פקודה היא כרטיס: שם בעברית, מילת ה-BASIC, משפט הסבר וטופס קטן שכותב את השורה.
// "לנסות עכשיו" מקליד אותה במחשב, אות אחרי אות, כמו אדם. "להוסיף לתוכנית" נותן לה מספר שורה ומקליד אותה לתוכנית.
// הכול נבנה מהרשימה CARDS: כרטיס חדש = עוד שורה ברשימה.

const COLORS4 = [['1', 'ירוק'], ['2', 'צהוב'], ['3', 'כחול'], ['4', 'אדום']];
const CLS9 = [['0', 'שחור'], ['1', 'ירוק'], ['2', 'צהוב'], ['3', 'כחול'], ['4', 'אדום'], ['5', 'לבן'], ['6', 'תכלת'], ['7', 'סגול'], ['8', 'כתום']];
const TUNES = [
  ['T5L4EEFGGFEDCCDEE.L8DL2D', 'אודה לשמחה'],
  ['T6L8CDEFGABO3C', 'סולם עולה'],
  ['T4L4CCGGAAL2G', 'כוכב קטן']
];
// טקסט שהמשתמש כתב: רק אותיות שה-Dragon מכיר, באותיות גדולות, בלי מרכאות שישברו את השורה
const txt = v => String(v ?? '').toUpperCase().replace(/[^A-Z0-9 !?.,:;'()+\-*\/=<>$#%&@]/g, '').slice(0, 40);
const num = (v, lo, hi, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
const GFX = 'PMODE 3,1:PCLS:SCREEN 1,0';

export const CATS = [
  ['text', 'טקסט וחשבון'],
  ['draw', 'ציור וצבע'],
  ['sound', 'צלילים'],
  ['ask', 'שאלות ותשובות'],
  ['loop', 'חזרות ותנועה'],
  ['keep', 'שמירה וניהול']
];

// fields: [מפתח, תווית, סוג, ברירת מחדל, אפשרויות]. סוגים: text, num (min,max), pick (רשימה)
// code(v) מחזיר שורות. gfx: מציג את המסך הגרפי (Esc חוזר לטקסט). direct: פקודה למחשב, לא שורה בתוכנית.
// prog: שורות שעובדות רק בתוך תוכנית (GOTO, INPUT). words: מילים נוספות לחיפוש
export const CARDS = [
  { cat: 'text', he: 'כותבים על המסך', en: 'PRINT', say: 'המחשב כותב את מה שבתוך המרכאות.',
    fields: [['t', 'מה לכתוב', 'text', 'HELLO']], code: v => [`PRINT "${txt(v.t)}"`], words: 'הדפסה כתיבה טקסט' },
  { cat: 'text', he: 'מחשבון', en: 'PRINT', say: 'בלי מרכאות, המחשב מחשב ומדפיס את התוצאה. * זה כפול, / זה חילוק.',
    fields: [['e', 'התרגיל', 'text', '7*6']], code: v => [`PRINT ${txt(v.e).replace(/[^0-9+\-*\/(). ]/g, '') || '2+2'}`], words: 'חשבון תרגיל כפל חיבור' },
  { cat: 'text', he: 'צובעים את המסך', en: 'CLS', say: 'מנקה את מסך הטקסט וצובע אותו.',
    fields: [['c', 'צבע', 'pick', '3', CLS9]], code: v => [`CLS ${v.c}`], words: 'ניקוי צבע מסך' },
  { cat: 'text', he: 'כותבים במקום מסוים', en: 'PRINT @', say: 'כל שורה במסך היא 32 מקומות. 0 בפינה למעלה, 32 בתחילת השורה השנייה.',
    fields: [['p', 'מקום (0 עד 511)', 'num', '236', 0, 511], ['t', 'מה לכתוב', 'text', 'HI']], code: v => [`PRINT @ ${num(v.p, 0, 511, 236)},"${txt(v.t)}"`], words: 'מיקום' },
  { cat: 'text', he: 'מספר אקראי', en: 'RND', say: 'בוחר מספר אקראי מ-1 עד המספר שבחרתם, כמו קובייה.',
    fields: [['n', 'עד', 'num', '6', 2, 1000]], code: v => [`PRINT RND(${num(v.n, 2, 1000, 6)})`], words: 'קובייה אקראי מזל' },

  { cat: 'draw', he: 'מעבר למסך הגרפי', en: 'PMODE', say: 'מסך של 256 על 192 נקודות בארבעה צבעים. זה הצעד הראשון לפני ציור.', gfx: true,
    fields: [['c', 'צבע רקע', 'pick', '1', COLORS4]], code: v => [`PMODE 3,1:PCLS ${v.c}:SCREEN 1,0`], words: 'גרפיקה מסך' },
  { cat: 'draw', he: 'מציירים עיגול', en: 'CIRCLE', say: 'מרכז העיגול (מ-0 עד 255, ומ-0 עד 191) והרדיוס.', gfx: true,
    fields: [['x', 'מרכז, ימינה', 'num', '128', 0, 255], ['y', 'מרכז, למטה', 'num', '96', 0, 191], ['r', 'רדיוס', 'num', '40', 1, 120], ['c', 'צבע', 'pick', '4', COLORS4]],
    code: v => [`${GFX}:COLOR ${v.c}:CIRCLE(${num(v.x, 0, 255, 128)},${num(v.y, 0, 191, 96)}),${num(v.r, 1, 120, 40)}`], words: 'עיגול מעגל' },
  { cat: 'draw', he: 'מותחים קו או מלבן', en: 'LINE', say: 'מנקודה לנקודה. "מלבן" מצייר מסגרת, ו"מלבן מלא" ממלא אותו.', gfx: true,
    fields: [['a', 'מנקודה', 'text', '20,20'], ['b', 'עד נקודה', 'text', '200,150'], ['s', 'צורה', 'pick', '', [['', 'קו'], [',B', 'מלבן'], [',BF', 'מלבן מלא']]], ['c', 'צבע', 'pick', '3', COLORS4]],
    code: v => { const pt = (s, d) => (String(s).match(/\d+/g) || []).slice(0, 2).map(Number).join(',') || d;
      return [`${GFX}:COLOR ${v.c}:LINE(${pt(v.a, '20,20')})-(${pt(v.b, '200,150')}),PSET${v.s}`]; }, words: 'קו מלבן ריבוע' },
  { cat: 'draw', he: 'מציירים בתנועות', en: 'DRAW', say: 'U למעלה, D למטה, L שמאלה, R ימינה, עם מספר צעדים. כאן: בית קטן.', gfx: true,
    fields: [['c', 'צבע', 'pick', '4', COLORS4]], code: v => [`${GFX}:DRAW "BM100,140C${v.c}U40R60D40L60BM100,100E30F30"`], words: 'ציור בית תנועה' },
  { cat: 'draw', he: 'צובעים צורה', en: 'PAINT', say: 'ממלא צורה סגורה בצבע, מהנקודה החוצה עד הקו.', gfx: true,
    fields: [['c', 'צבע', 'pick', '2', COLORS4]], code: v => [`${GFX}:COLOR 4:CIRCLE(128,96),40:PAINT(128,96),${v.c},4`], words: 'מילוי צביעה' },

  { cat: 'sound', he: 'צפצוף', en: 'SOUND', say: 'גובה הצליל (1 עד 255) והאורך.',
    fields: [['p', 'גובה', 'num', '100', 1, 255], ['d', 'אורך', 'num', '4', 1, 30]], code: v => [`SOUND ${num(v.p, 1, 255, 100)},${num(v.d, 1, 30, 4)}`], words: 'צליל צפצוף' },
  { cat: 'sound', he: 'מנגינה', en: 'PLAY', say: 'מנגן תווים: C D E F G A B. מוזיקה מנחלת הכלל בלבד.',
    fields: [['m', 'מנגינה', 'pick', TUNES[0][0], TUNES]], code: v => [`PLAY "${v.m}"`], words: 'מוזיקה מנגינה שיר תווים' },
  { cat: 'sound', he: 'סולם צלילים', en: 'FOR SOUND', say: 'לולאה שמשמיעה צלילים, מהנמוך לגבוה.',
    fields: [['n', 'כמה צלילים', 'num', '12', 2, 30]], code: v => [`FOR I=1 TO ${num(v.n, 2, 30, 12)}:SOUND I*8,1:NEXT I`], words: 'סולם' },

  { cat: 'ask', he: 'שואלים שאלה', en: 'INPUT', say: 'המחשב שואל ומחכה לתשובה. עובד רק בתוך תוכנית.', prog: true,
    fields: [['q', 'השאלה', 'text', 'WHAT IS YOUR NAME']], code: v => [`INPUT "${txt(v.q)}";N$`, 'PRINT "HELLO ";N$'], words: 'שאלה קלט שם' },
  { cat: 'ask', he: 'אם… אז', en: 'IF THEN', say: 'המחשב בודק תנאי, ועושה משהו רק אם הוא נכון.',
    fields: [['n', 'גבול', 'num', '50', 1, 1000]], code: v => [`A=RND(100):IF A>${num(v.n, 1, 1000, 50)} THEN PRINT A;"IS BIG" ELSE PRINT A;"IS SMALL"`], words: 'תנאי אם' },
  { cat: 'ask', he: 'מחכים למקש', en: 'INKEY$', say: 'התוכנית עוצרת עד שלוחצים על מקש. ככה כתבו משחקים.', prog: true,
    fields: [], code: () => ['PRINT "PRESS A KEY"', 'IF INKEY$="" THEN GOTO {here}', 'PRINT "THANKS!"'], words: 'מקש המתנה משחק' },

  { cat: 'loop', he: 'סופרים', en: 'FOR NEXT', say: 'חוזר על משהו מספר פעמים. I מקבל 1, 2, 3 וכן הלאה.',
    fields: [['a', 'מ-', 'num', '1', -100, 1000], ['b', 'עד', 'num', '10', -100, 1000]], code: v => [`FOR I=${num(v.a, -100, 1000, 1)} TO ${num(v.b, -100, 1000, 10)}:PRINT I;:NEXT I`], words: 'לולאה ספירה חזרה' },
  { cat: 'loop', he: 'לנצח', en: 'GOTO', say: 'קופץ חזרה לשורה, שוב ושוב. BREAK או Esc עוצרים.', prog: true,
    fields: [['t', 'מה לכתוב', 'text', 'DRAGON ']], code: v => [`PRINT "${txt(v.t)}";`, 'GOTO {prev}'], words: 'לולאה אינסוף קפיצה' },
  { cat: 'loop', he: 'מחכים רגע', en: 'FOR T', say: 'לולאה שלא עושה כלום, רק סופרת. ככה עשו "המתנה" אז.',
    fields: [['n', 'כמה לחכות', 'num', '500', 10, 5000]], code: v => [`FOR T=1 TO ${num(v.n, 10, 5000, 500)}:NEXT T`], words: 'המתנה עיכוב זמן' },

  { cat: 'keep', he: 'מה יש בתוכנית', en: 'LIST', say: 'מציג את שורות התוכנית.', direct: true, needsProg: true, fields: [], code: () => ['LIST'], words: 'רשימה הצגה' },
  { cat: 'keep', he: 'מריצים', en: 'RUN', say: 'מריץ את התוכנית מההתחלה.', direct: true, needsProg: true, fields: [], code: () => ['RUN'], words: 'הרצה התחלה' },
  { cat: 'keep', he: 'מסדרים מספרים', en: 'RENUM', say: 'ממספר מחדש 10, 20, 30, ומתקן את כל הקפיצות.', direct: true, needsProg: true, fields: [], code: () => ['RENUM'], words: 'מספור' },
  { cat: 'keep', he: 'שומרים לקלטת', en: 'CSAVE', say: 'שומר את התוכנית על "קלטת" בדפדפן הזה. היא תופיע במדף.', direct: true, needsProg: true,
    fields: [['n', 'שם (באנגלית)', 'text', 'MYPROG']], code: v => [`CSAVE "${txt(v.n).replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'MYPROG'}"`], words: 'שמירה קלטת' },
  { cat: 'keep', he: 'מוחקים הכול', en: 'NEW', say: 'מוחק את התוכנית שבזיכרון. אי אפשר לבטל!', direct: true, danger: true, fields: [], code: () => ['NEW'], words: 'מחיקה חדש' }
];

export function createCommands({ root, machine, powerOn, input }) {
  const box = document.createElement('div');
  box.className = 'd32-cmds';
  box.innerHTML = `
    <label class="d32-cmds-search"><span class="visually-hidden">חיפוש פקודה</span>
      <input type="search" placeholder="חיפוש: עיגול, צליל, מספר אקראי…" autocomplete="off"></label>
    <div class="d32-cmds-cats" role="group" aria-label="קטגוריות"></div>
    <p class="d32-cmds-none" hidden>לא מצאתי פקודה כזו. נסו מילה אחרת, או שאלו את העוזר.</p>
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
    body.appendChild(code);
    const note = document.createElement('p');
    note.className = 'd32-cmd-note';
    note.textContent = c.gfx ? 'אחרי הציור: הכפתור "חזרה למסך הטקסט" על המסך (או Esc) מחזיר למסך הטקסט.' : c.prog ? 'עובד רק בתוך תוכנית, אז הוא נכנס לתוכנית. אחר כך RUN.' : c.danger ? 'זהירות: מוחק את התוכנית שבזיכרון.' : '';
    if (note.textContent) body.appendChild(note);
    const row = document.createElement('div');
    row.className = 'd32-cmd-row';
    if (!c.prog) row.innerHTML += '<button type="button" class="d32-cmd-try is-main">לנסות עכשיו</button>';
    if (!c.direct) row.innerHTML += '<button type="button" class="d32-cmd-add">להוסיף לתוכנית</button>';
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
  function type(lines, gfx) {
    powerOn().then(() => {
      if (machine.running || !gfx) machine.brk?.();
      root.d32.typeLines(lines, () => input.focus({ preventScroll: true }));
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
      warn.textContent = 'אין עדיין תוכנית בזיכרון. כתבו שורות עם מספרים (למשל 10 PRINT "HI"), או לחצו "להוסיף לתוכנית" בכרטיס אחר, ואז נסו שוב.';
      return;
    }
    if (e.target.closest('.d32-cmd-try')) type(linesOf(i, 0), CARDS[i].gfx);
    else if (e.target.closest('.d32-cmd-add')) { const s = nextLine(); type(linesOf(i, s).map((l, k) => (s + k * 10) + ' ' + l), CARDS[i].gfx); }
  });
  render();
  return box;
}
