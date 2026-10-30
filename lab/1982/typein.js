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
    ['drawing', 'Drawing', 'W. Slater, Brampton, Chesterfield', ['מאי 1983', 'May 1983'], 45, 'Dragon_User_1983-05_Sunshine_Books_GB', 44,
      ['קו מסתובב מהמרכז כמו מחוג של שעון ומשאיר גלגל של 60 חישורים. במגזין הודפס P MODE עם רווח: מקלידים PMODE צמוד, אחרת יופיע ?SN ERROR.',
        'A line turns around the centre like a clock hand and leaves a wheel of 60 spokes. The magazine printed P MODE with a space: type PMODE as one word, or you get ?SN ERROR.'], false,
      ['התוכנית היא המסגרת באותיות הגדולות למטה מימין, ליד הכותרת Drawing: ‏13 שורות, מ-10 P MODE 4,1: SCREEN1,1: PCLS. ועד 1100 RETURN. הרשימה באותיות הקטנות מעליה, Character generator (שורות 9000 עד 9510), ושורות ה-DATA למעלה בעמוד הן תוכניות אחרות.',
        'The program is the large-type box at the bottom right, next to the Drawing heading: 13 lines, from 10 P MODE 4,1: SCREEN1,1: PCLS. to 1100 RETURN. The small-type listing above it, Character generator (lines 9000 to 9510), and the DATA lines at the top of the page are other programs.']],
    ['lines', 'Lines', 'W J Greenall, Bishop\'s Stortford', ['יולי 1983', 'July 1983'], 41, 'Dragon_User_1983-07_Sunshine_Books_GB', 40,
      ['שתי תוכניות קצרות שמציירות עקומות מקווים ישרים, כמו ציורי חוטים ומסמרים. אחרי הראשונה: BREAK, ‏NEW, ואז השנייה.',
        'Two short programs that draw curves out of straight lines, like string art. After the first one: BREAK, NEW, then the second.'], false,
      ['התוכניות במסגרת שמתחת לכותרת Lines. הראשונה מתחילה ב-1 REM LINES BY ונגמרת ב-100 GOTO 100 (למעלה בטור הימני), 11 שורות. השנייה מתחילה ב-1 REM LINES 2, ‏8 שורות. הרשימה הארוכה למטה, Scoring, היא תוכנית אחרת.',
        'The programs are in the box under the Lines heading. The first starts at 1 REM LINES BY and ends at 100 GOTO 100 (top of the right column), 11 lines. The second starts at 1 REM LINES 2, 8 lines. The long listing below, Scoring, is a different program.']],
    ['reaction', 'Reaction', 'Nicholas Appleyard, Sheffield', ['יולי 1983', 'July 1983'], 47, 'Dragon_User_1983-07_Sunshine_Books_GB', 46,
      ['משחק תגובה קטן שכתב ילד בן 13. המסך נצבע אדום עם מנגינה, ואחרי המתנה אקראית מופיע ריבוע שחור. לוחצים על רווח מהר ככל האפשר. הזמן נמדד בסיבובים של לולאה, לא בשניות. לאט מדי: GRANNY REACTIONS. רווח לחוץ מראש: CHEAT. מקש כלשהו מתחיל שוב.',
        'A small reaction game written by a 13-year-old. The screen turns red with a tune, and after a random wait a black square appears. Press the space bar as fast as you can. The time is counted in loop rounds, not seconds. Too slow: GRANNY REACTIONS. Space held down early: CHEAT. Any key starts again.'], false,
      ['התוכנית במסגרת באותיות הגדולות בחצי התחתון, מתחת לכותרת Reaction, בשני טורים: ‏33 שורות, מ-5 \' * * * FOR THEDRAG ON 32 עד 230 END. בטור הימני היא מתחילה ב-95. השורות 5 עד 12 הן רק הערות (מתחילות ב-\'). הרשימה באותיות הקטנות למעלה, Labelling, היא תוכנית אחרת.',
        'The program is the large-type box in the bottom half, under the Reaction heading, in two columns: 33 lines, from 5 \' * * * FOR THEDRAG ON 32 to 230 END. The right column starts at 95. Lines 5 to 12 are only notes (they start with \'). The small-type listing at the top, Labelling, is a different program.']],
    ['sketch', 'Sketching', 'R Steel, Gwynedd', ['ספטמבר 1983', 'September 1983'], 39, 'Dragon_User_1983-09_Sunshine_Books_GB', 38,
      ['שבע שורות, ואז מציירים על המסך בג\'ויסטיק. הכפתור מנקה את המסך. כאן החיצים הם הג\'ויסטיק ו-Alt הכפתור (בטלפון: ידית וכפתור מתחת למסך).',
        'Seven lines, then you draw on the screen with the joystick. The button clears the screen. Here the arrow keys are the joystick and Alt is the button (on a phone: a stick and a button under the screen).'],
      true,
      ['התוכנית היא המסגרת הקטנה למעלה, ליד הכותרת Sketching: שבע שורות, 10 עד 70. הרשימה הארוכה מתחת, Squash, היא תוכנית אחרת.',
        'The program is the small box at the top, next to the Sketching heading: seven lines, 10 to 70. The long listing below, Squash, is a different program.']],
    ['circles', 'Circles', 'Edwin Aird, Newcastle-upon-Tyne', ['פברואר 1984', 'February 1984'], 53, 'Dragon_User_1984-02_Sunshine_Books_GB', 52,
      ['ארבע שורות בלבד. עיגולים צבעוניים צומחים במקומות אקראיים על המסך, כל אחד עם צליל שעולה. התוכנית לא נגמרת: BREAK עוצר אותה.',
        'Just four lines. Coloured circles grow at random places on the screen, each with a rising tone. It never ends: BREAK stops it.'], false,
      ['התוכנית במסגרת באמצע העמוד, מימין לכותרת Circles: ארבע שורות, מ-10 PMODE 3,1:SCREEN 1,1:PCLS ועד 40 GOTO 20. כל שורה ארוכה ממשיכה בשורה מודפסת שנייה. הרשימה הארוכה למעלה (שורות 980 עד 1300) והרשימה של Drag למטה הן תוכניות אחרות.',
        'The program is the box in the middle of the page, to the right of the Circles heading: four lines, from 10 PMODE 3,1:SCREEN 1,1:PCLS to 40 GOTO 20. Each long line wraps onto a second printed line. The long listing at the top (lines 980 to 1300) and the Drag listing below are other programs.']],
    ['patterns', 'Patterns', 'Iolo ap Gwynn, Aberystwyth', ['מרץ 1984', 'March 1984'], 47, 'Dragon_User_1984-03_Sunshine_Books_GB', 46,
      ['מניפות של קווים אלכסוניים, בצבעים ובמצבי PMODE אקראיים, עם צליל אקראי. PCOPY מעתיק דפי גרפיקה זה על זה, והתמונה משתנה בכל סיבוב. התוכנית לא נגמרת: BREAK עוצר אותה.',
        'Fans of diagonal lines in random colours and random PMODEs, with a random tone. PCOPY copies graphics pages over each other, so the picture changes every round. It never ends: BREAK stops it.'], false,
      ['התוכנית במסגרת ברוחב העמוד, מתחת לכותרת Patterns ולטקסט שלידה: ‏18 שורות, מ-10 \' PATTERNS c I.ap Gwynn, 10/83 ועד 180 GOTO 40. השורות 10 ו-20 הן רק הערות (מתחילות ב-\'). Spelling למטה היא תוכנית אחרת.',
        'The program is the full-width box under the Patterns heading and the text next to it: 18 lines, from 10 \' PATTERNS c I.ap Gwynn, 10/83 to 180 GOTO 40. Lines 10 and 20 are only notes (they start with \'). Spelling, below, is a different program.']],
    ['stitchet', 'Stitchet', 'Graham Smith, Bristol', ['ינואר 1985', 'January 1985'], 33, 'Dragon_User_1985-01_Sunshine_Books_GB', 32,
      ['דוגמת "תפרים" במעגל: 18 נקודות מתחברות קו אחרי קו, עם צליל בכל קו. בין דוגמה לדוגמה מתנגן סולם, וכל דוגמה שונה. במחרוזות PLAY זו האות O ולא אפס (T100O5B...). התוכנית לא נגמרת: BREAK עוצר אותה.',
        'A circular "stitching" pattern: 18 points joined line by line, with a note on each line. A scale plays between patterns, and each pattern is different. In the PLAY strings it is the letter O, not zero (T100O5B...). It never ends: BREAK stops it.'], false,
      ['התוכנית במסגרת מתחת לכותרת Stitchet, בשני טורים: ‏22 שורות, מ-10 DIM X(30),Y(30) ועד 210 REM *80* ADD E AFTER PCLS. בטור הימני היא מתחילה ב-120. השורות 200 ו-210 הן הערות עם שינויים לנסות. הרשימה למטה, Sound (SOUND-TO-LIGHT), היא תוכנית אחרת.',
        'The program is the box under the Stitchet heading, in two columns: 22 lines, from 10 DIM X(30),Y(30) to 210 REM *80* ADD E AFTER PCLS. The right column starts at 120. Lines 200 and 210 are notes with changes to try. The listing below, Sound (SOUND-TO-LIGHT), is a different program.']]
  ];
  const WOD = 'https://archive.worldofdragon.org/browse/?dir=downloads/Magazines/Dragon%20User/';   // ועוד השנה של הגיליון
  const cabinet = document.querySelector('.cabinet'), mine = document.getElementById('drawer-mine');
  if (!cabinet) return;

  // המגירה, כמו המגירות של shelf.js: סגורה בכל כניסה (גונן, 28.10)
  const d = document.createElement('details');
  d.className = 'drawer';
  d.dataset.drawer = 'type';
  d.open = false;
  d.innerHTML = '<summary><span class="drawer-name"></span> <span class="drawer-count"></span></summary><div class="drawer-body"><p class="note typein-note"></p><div class="tapes"></div></div>';
  d.querySelector('.drawer-name').textContent = T('הקלד בעצמך', 'Type it in');
  d.querySelector('.drawer-count').textContent = PAGES.length;
  d.querySelector('.typein-note').textContent = T('בשנות ה-80 מגזינים הדפיסו תוכניות שקוראים שלחו, וכולם הקלידו אותן בעצמם. פותחים את העמוד המקורי, מקלידים ומריצים.',
    'In the 1980s magazines printed programs sent in by readers, and everyone typed them in. Open the original page, type it in and run it.');
  // הסדר הכרונולוגי של הארון (גונן, 27.10): אחרי ההרפתקאות של 1983–84, לפני המשחקים החדשים מהקהילה
  const after = document.querySelector('#tapes [data-drawer="community"]');
  if (after) after.before(d); else cabinet.insertBefore(d, mine);
  const yr = document.createElement('span'); yr.className = 'yr'; yr.dir = 'ltr'; yr.textContent = '1983–85'; d.querySelector('summary').appendChild(yr);
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
    window.d32Joy = !!on;   // גם רווח יורה (shelf.js)
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
    w.href = WOD + (ia.match(/_(\d{4})-/) || [, '1983'])[1]; w.target = '_blank'; w.rel = 'noopener';
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
