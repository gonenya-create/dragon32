// דף ההורדות ל-Dragon אמיתי (גונן, 9.11): ▶ מנגן את הקלטת לכבל, ⬇ צליל שומר wav, ⬇ קלטת הוא הקובץ עצמו (קישור רגיל).
// הצליל נוצר כאן בדפדפן מקובץ הקלטת הקטן (tapewav.js). בזמן ההשמעה: פס התקדמות, והמסך לא נכבה
(() => {
  const EN = document.documentElement.lang === 'en';
  let now = null;   // { li, audio, lock, timer }
  const wav = async id => window.D32Wav.casWav(new Uint8Array(await (await fetch('/lab/1982/tapes/' + id + '.cas')).arrayBuffer()));
  const mmss = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
  function stop() {
    if (!now) return;
    now.audio.pause(); clearInterval(now.timer);
    try { now.lock?.release(); } catch (e) {}
    now.li.classList.remove('playing'); now.li.querySelector('.p').textContent = EN ? '▶ Play' : '▶ השמעה';
    now = null;
  }
  // "🔑 הקוד" (Manic Miner, Jet Set Willy): הקודים מ-codecard.js, אותו קובץ שמשמש את כפתור הקוד בדפי המשחק
  const T = (he, en) => (EN ? en : he);
  const L = x => '<bdi dir="ltr">' + x + '</bdi>';   // קבועים בלבד (לא קלט משתמש): אנגלית ומספרים נשארים שלמים בתוך משפט בעברית
  const CB = {
    manic: {
      ask: () => T('המשחק מציג משבצת, למשל ', 'The game shows a square, for example ') + L('ENTER CODE AT LOCATION O7') + '. ' + T('כותבים כאן את המשבצת: אות ', 'Type the square here: a letter ') + L('A–R') + T(' ומספר ', ' and a number ') + L('1–20') + '.',
      ph: 'O7', parse: t => window.D32Codes.parseManic(t),
      bad: r => r.error === 'range' ? T('אין משבצת כזו. האות A–R והמספר 1–20.', 'There is no such square. The letter is A–R and the number 1–20.') : T('לא הבנתי. כותבים אות ומספר, למשל O7.', 'Not understood. Type a letter and a number, for example O7.')
    },
    jsw: {
      ask: () => T('המשחק מציג משבצת ועמוד, למשל ', 'The game shows a square and a page, for example ') + L('ENTER CODE AT LOCATION L 8 ON PAGE NUMBER 3') + '. ' + T('כותבים כאן אות ', 'Type here a letter ') + L('B–Q') + T(', עמודה ', ', a column ') + L('2–10') + T(' ועמוד ', ' and a page ') + L('1–3') + ': ' + L('L 8 3') + '.',
      ph: 'L 8 3', parse: t => window.D32Codes.parseJsw(t),
      bad: r => r.error === 'range' ? T('אין משבצת כזו. אות B–Q, עמודה 2–10, עמוד 1–3.', 'There is no such square. Letter B–Q, column 2–10, page 1–3.') : T('לא הבנתי. כותבים אות, עמודה ועמוד, למשל L 8 3.', 'Not understood. Type a letter, a column and a page, for example L 8 3.')
    }
  };
  function codeBox(li, btn) {
    const old = li.querySelector('.cbox');
    if (old) { old.remove(); btn.setAttribute('aria-expanded', 'false'); return; }
    const c = CB[btn.dataset.code];
    const box = document.createElement('div'); box.className = 'cbox';
    const info = document.createElement('p'); info.innerHTML = c.ask();
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.type = 'text'; input.dir = 'ltr'; input.placeholder = c.ph; input.maxLength = 24;
    input.autocomplete = 'off'; input.autocapitalize = 'characters'; input.spellcheck = false; input.enterKeyHint = 'go';
    input.setAttribute('aria-label', T('המשבצת שהמשחק מבקש', 'The square the game asks for'));
    const go = document.createElement('button'); go.type = 'submit'; go.textContent = T('הצג קוד', 'Show code');
    const res = document.createElement('div'); res.className = 'cres'; res.setAttribute('aria-live', 'polite');
    form.append(input, go);
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      res.textContent = ''; res.classList.remove('err');
      const r = c.parse(input.value);
      if (r.error) { res.classList.add('err'); res.innerHTML = c.bad(r).replace(/[A-Z]–[A-Z]|\d+–\d+|\bO7\b|\bL 8 3\b/g, L); return; }
      const sq = r.row + (btn.dataset.code === 'jsw' ? ' ' + r.col + T(', עמוד ', ', page ') + r.page : r.col);
      const t = document.createElement('span'); t.append(T('הקוד של ', 'The code for '), Object.assign(document.createElement('bdi'), { dir: 'ltr', textContent: sq }), ':');
      const n = document.createElement('bdi'); n.className = 'big'; n.dir = 'ltr'; n.textContent = r.code;
      const note = document.createElement('span');
      note.textContent = T('מקלידים את ארבע הספרות ולוחצים ENTER. בכרטיס המקורי כל ספרה היא צבע: ', 'Type the four digits and press ENTER. On the original card each digit is a colour: ') + window.D32Codes.colours[btn.dataset.code][EN ? 1 : 0] + '.';
      res.append(t, n, note);
    });
    box.append(info, form, res);
    li.appendChild(box); btn.setAttribute('aria-expanded', 'true');
    input.focus();
  }
  document.addEventListener('click', async e => {
    const b = e.target.closest('.real-list button');
    if (!b || b.closest('.cbox')) return;
    const li = b.closest('li'), id = li.dataset.id;
    if (b.classList.contains('k')) { codeBox(li, b); return; }
    if (b.classList.contains('w')) {
      b.disabled = true;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([await wav(id)], { type: 'audio/wav' }));
      a.download = li.dataset.file + '.wav';
      document.body.appendChild(a); a.click(); a.remove();
      b.disabled = false;
      return;
    }
    if (now && now.li === li) { stop(); return; }
    stop();
    b.disabled = true;
    const audio = new Audio(URL.createObjectURL(new Blob([await wav(id)], { type: 'audio/wav' })));
    audio.volume = 1;
    b.disabled = false;
    let lock = null;
    try { lock = await navigator.wakeLock?.request('screen'); } catch (e) {}
    const bar = li.querySelector('.bar i'), txt = li.querySelector('.bar span');
    const tick = () => {
      const d = audio.duration || 0;
      bar.style.width = d ? (100 * audio.currentTime / d) + '%' : '0';
      txt.textContent = (EN ? 'Playing… ' : 'מנגן… ') + mmss(audio.currentTime) + (d ? ' / ' + mmss(d) : '') + (EN ? ' · keep this page open' : ' · לא לסגור את הדף');
    };
    now = { li, audio, lock, timer: setInterval(tick, 500) };
    audio.addEventListener('ended', () => { stop(); li.classList.add('playing'); txt.textContent = EN ? 'Finished. On the Dragon: wait for the game, or type what is shown next to it.' : 'הסתיים. ב-Dragon: המשחק מתחיל, או מקלידים מה שכתוב ליד המשחק.'; bar.style.width = '100%'; });
    li.classList.add('playing'); b.textContent = EN ? '■ Stop' : '■ עצירה'; tick();
    try { await audio.play(); } catch (e) { stop(); }
  });
})();
