// "הקלד בעצמך" (גונן, 26.10): עמוד אמיתי מהמגזין Dragon User עם תוכנית של קורא, ליד המכונה. מקלידים ומריצים, כמו ב-1983.
// התוכנית לא מועתקת לכאן ולא עולה כקלטת: היא מופיעה רק בסריקה, שנטענת ישר מ-archive.org (תמונת העמוד, לא עותק אצלנו), עם קרדיט לכותב ולגיליון.
// הקורא המוטמע של archive.org מקטין את העמוד לגובה החלון, ואז אי אפשר לקרוא את השורות; לכן תמונת העמוד ברוחב מלא, ולחיצה מגדילה.
// מגירה בארון הקלטות (אחרי שלוש המגירות של shelf.js); לחיצה על "פתח את העמוד" פותחת את הסריקה ליד המסך (בטלפון: מעליו).
(function () {
  const EN = document.documentElement.lang === 'en';
  const T = (he, en) => EN ? en : he;
  // [id, שם, כותב ומקומו, גיליון (he/en), עמוד מודפס, מזהה ב-archive.org, עמוד בקורא, תיאור (he/en), ג'ויסטיק?, איפה בעמוד (he/en)]
  // איפה בעמוד: בכל עמוד יש כמה תוכניות, ותוכנית ארוכה של קורא אחר נראית כמו חלק מהמשימה (גונן, 26.10: "הרבה יותר שורות ממה שציינת")
  const PAGES = [
    ['lines', 'Lines', 'W J Greenall, Bishop\'s Stortford', ['יולי 1983', 'July 1983'], 41, 'Dragon_User_1983-07_Sunshine_Books_GB', 40,
      ['שתי תוכניות קצרות שמציירות עקומות מקווים ישרים, כמו ציורי חוטים ומסמרים. אחרי הראשונה: BREAK, ‏NEW, ואז השנייה.',
        'Two short programs that draw curves out of straight lines, like string art. After the first one: BREAK, NEW, then the second.'], false,
      ['התוכניות במסגרת שמתחת לכותרת Lines. הראשונה מתחילה ב-1 REM LINES BY ונגמרת ב-100 GOTO 100 (למעלה בטור הימני), 11 שורות. השנייה מתחילה ב-1 REM LINES 2, ‏8 שורות. הרשימה הארוכה למטה, Scoring, היא תוכנית אחרת.',
        'The programs are in the box under the Lines heading. The first starts at 1 REM LINES BY and ends at 100 GOTO 100 (top of the right column), 11 lines. The second starts at 1 REM LINES 2, 8 lines. The long listing below, Scoring, is a different program.']],
    ['sketch', 'Sketching', 'R Steel, Gwynedd', ['ספטמבר 1983', 'September 1983'], 39, 'Dragon_User_1983-09_Sunshine_Books_GB', 38,
      ['שבע שורות, ואז מציירים על המסך בג\'ויסטיק. הכפתור מנקה את המסך. כאן החיצים הם הג\'ויסטיק ו-Alt הכפתור (בטלפון: ידית וכפתור מתחת למסך).',
        'Seven lines, then you draw on the screen with the joystick. The button clears the screen. Here the arrow keys are the joystick and Alt is the button (on a phone: a stick and a button under the screen).'],
      true,
      ['התוכנית היא המסגרת הקטנה למעלה, ליד הכותרת Sketching: שבע שורות, 10 עד 70. הרשימה הארוכה מתחת, Squash, היא תוכנית אחרת.',
        'The program is the small box at the top, next to the Sketching heading: seven lines, 10 to 70. The long listing below, Squash, is a different program.']]
  ];
  const WOD = 'https://archive.worldofdragon.org/browse/?dir=downloads/Magazines/Dragon%20User/1983';
  const cabinet = document.querySelector('.cabinet'), mine = document.getElementById('drawer-mine');
  if (!cabinet) return;

  // המגירה, כמו המגירות של shelf.js: סגורה בכניסה הראשונה, ונזכרת אחר כך (אותו מפתח בדפדפן)
  const DKEY = 'd32-lab-drawers';
  let state = {};
  try { state = JSON.parse(localStorage.getItem(DKEY)) || {}; } catch (e) {}
  const d = document.createElement('details');
  d.className = 'drawer';
  d.dataset.drawer = 'type';
  d.open = !!state.type;
  d.innerHTML = '<summary><span class="drawer-name"></span> <span class="drawer-count"></span></summary><div class="drawer-body"><p class="note typein-note"></p><div class="tapes"></div></div>';
  d.querySelector('.drawer-name').textContent = T('הקלד בעצמך', 'Type it in');
  d.querySelector('.drawer-count').textContent = PAGES.length;
  d.querySelector('.typein-note').textContent = T('ב-1983 מגזינים הדפיסו תוכניות שקוראים שלחו, וכולם הקלידו אותן בעצמם. פותחים את העמוד המקורי, מקלידים ומריצים.',
    'In 1983 magazines printed programs sent in by readers, and everyone typed them in. Open the original page, type it in and run it.');
  d.addEventListener('toggle', () => {
    try { state = JSON.parse(localStorage.getItem(DKEY)) || {}; state.type = d.open; localStorage.setItem(DKEY, JSON.stringify(state)); } catch (e) {}
  });
  cabinet.insertBefore(d, mine);
  const grid = d.querySelector('.tapes');

  // חלון העמוד: הסריקה מהקורא של archive.org, הקרדיט, וקישורים אם הקורא לא נטען
  const view = document.createElement('section');
  view.className = 'typein-view';
  view.hidden = true;
  view.innerHTML = '<div class="tv-head"><b></b><button type="button" class="mini tv-close"></button></div><p class="tape-credit tv-credit"></p><p class="note tv-where"></p><div class="tv-scan"><img alt=""></div><p class="note tv-fail" hidden></p><p class="tape-credit tv-links"></p>';
  const machine = document.querySelector('.machine');
  machine.parentNode.insertBefore(view, machine);
  const scan = view.querySelector('.tv-scan'), img = scan.querySelector('img'), fail = view.querySelector('.tv-fail');
  img.addEventListener('click', () => scan.classList.toggle('zoom'));
  img.addEventListener('error', () => { scan.hidden = true; fail.hidden = false; });
  fail.textContent = T('הסריקה לא נטענה כרגע. אפשר לפתוח אותה בקישורים שלמטה.', 'The scan did not load right now. You can open it with the links below.');
  view.querySelector('.tv-close').textContent = T('✕ סגירה', '✕ Close');
  view.querySelector('.tv-close').setAttribute('aria-label', T('סגירת העמוד', 'Close the page'));
  view.querySelector('.tv-close').addEventListener('click', close);

  function joy(on, id) {
    try { Module.ccall('wasm_set_joystick_by_name', null, ['number', 'string'], [0, on ? 'kjoy0' : '']); } catch (e) {}
    if (window.d32Pad) window.d32Pad(on ? id : null);
  }
  let open = null;
  function close() {
    if (open && open[8]) joy(false);
    open = null;
    img.removeAttribute('src');
    view.hidden = true;
    document.body.classList.remove('typein-open');
  }
  function show(p) {
    const [id, name, by, issue, page, ia, n, , stick, where] = p;
    open = p;
    view.querySelector('.tv-head b').textContent = name;
    const credit = view.querySelector('.tv-credit');
    credit.textContent = '';
    const who = document.createElement('bdi');
    who.textContent = by;
    credit.append(T('מאת ', 'By '), who, ' · Dragon User, ' + issue[EN ? 1 : 0] + T(', עמ\' ', ', page ') + page);
    view.querySelector('.tv-where').textContent = '👉 ' + where[EN ? 1 : 0];
    // תמונת העמוד מ-archive.org, ברוחב מלא. לחיצה מגדילה ומקטינה
    scan.hidden = false; fail.hidden = true; scan.classList.remove('zoom'); scan.scrollTop = 0;
    img.src = 'https://archive.org/download/' + ia + '/page/n' + n + '_w1600.jpg';
    img.alt = 'Dragon User, ' + issue[1] + ', page ' + page;
    img.title = T('לחיצה מגדילה ומקטינה', 'Click to zoom in and out');
    const links = view.querySelector('.tv-links');
    links.textContent = '';
    const a = document.createElement('a');
    a.href = 'https://archive.org/details/' + ia + '/page/n' + n + '/mode/1up';
    a.target = '_blank'; a.rel = 'noopener';
    a.textContent = T('העמוד בקורא של archive.org', 'The page in the archive.org reader');
    const w = document.createElement('a');
    w.href = WOD; w.target = '_blank'; w.rel = 'noopener';
    w.textContent = T('הגיליון גם בארכיון World of Dragon', 'The issue is also in the World of Dragon archive');
    links.append(T('הסריקה מ-', 'Scan from '), 'archive.org', T('. לחיצה על העמוד מגדילה אותו. ', '. Click the page to zoom. '), a, ' · ', w);
    view.hidden = false;
    document.body.classList.add('typein-open');
    joy(!!stick, id);
    if (innerWidth < 1100) view.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else document.getElementById('canvas')?.focus({ preventScroll: true });
  }

  for (const p of PAGES) {
    const [id, name, by, issue, page, , , desc] = p;
    const box = document.createElement('div');
    box.className = 'tape-box';
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tape';
    b.dataset.page = id;
    b.innerHTML = '<span></span><span class="tape-desc"></span><small dir="ltr"></small>';
    b.querySelector('span').textContent = name;
    b.querySelector('.tape-desc').textContent = desc[EN ? 1 : 0];
    b.querySelector('small').textContent = 'DRAGON USER · ' + issue[1].toUpperCase();
    b.addEventListener('click', () => show(p));
    const cr = document.createElement('p');
    cr.className = 'tape-credit';
    const who = document.createElement('bdi');
    who.textContent = by;
    const go = document.createElement('a');
    go.href = '#';
    go.textContent = T('📖 פתח את העמוד', '📖 Open the page');
    go.addEventListener('click', e => { e.preventDefault(); show(p); });
    cr.append(T('מאת ', 'By '), who, document.createElement('br'), 'Dragon User, ' + issue[EN ? 1 : 0] + T(', עמ\' ', ', page ') + page, ' · ', go);
    box.append(b, cr);
    grid.appendChild(box);
  }
})();
