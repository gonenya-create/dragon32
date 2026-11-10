// בודקים מהקהילה (גונן, 10.11): בכל דף משחק כפתור "🐞 בדקתם? ספרו לנו אם עבד", שפותח טופס קצר (<dialog>),
// ושורה "נבדק על ידי" בלשונית "על המשחק". הדיווח נשלח ל-/api/report; השמות מגיעים מ-/api/report?credits=1
// (רק מי שביקש שהשם יופיע, ורק אחרי שגונן אישר). shelf.js קורא ל-d32Testers.button ול-d32Testers.credits בכל דף משחק.
(function () {
  const EN = document.documentElement.lang === 'en';
  const T = (he, en) => EN ? en : he;
  const MAX = { device: 80, note: 1000, name: 40, contact: 80 };

  // המכשיר והדפדפן, לפי מה שהדפדפן מספר על עצמו (אפשר לתקן ביד)
  function detect() {
    const ua = navigator.userAgent || '', touch = navigator.maxTouchPoints > 1;
    let dev = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) || (/Macintosh/.test(ua) && touch) ? 'iPad' : /Android/.test(ua) ? (/Mobile/.test(ua) ? 'Android phone' : 'Android tablet')
      : /CrOS/.test(ua) ? 'Chromebook' : /Macintosh|Mac OS X/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : '';
    if (EN === false && dev === 'Android phone') dev = 'טלפון Android';
    if (EN === false && dev === 'Android tablet') dev = 'טאבלט Android';
    const br = /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /Firefox\/|FxiOS/.test(ua) ? 'Firefox'
      : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : '';
    return [dev, br].filter(Boolean).join(' · ');
  }

  let dlg = null, current = null;
  function build() {
    dlg = document.createElement('dialog');
    dlg.className = 'tst-dlg';
    dlg.setAttribute('aria-labelledby', 'tst-title');
    dlg.innerHTML = `
<form method="dialog" class="tst-form" novalidate>
  <div class="tst-top"><h2 id="tst-title">${T('🐞 בדקתם? ספרו לנו', '🐞 Tried it? Tell us')}</h2>
    <button type="button" class="tst-x" aria-label="${T('סגירה', 'Close')}">✕</button></div>
  <div class="tst-step">
  <p class="tst-game">${T('המשחק:', 'Game:')} <bdi class="tst-gname"></bdi></p>
  <label for="tst-device">${T('מכשיר ודפדפן', 'Device and browser')}</label>
  <input id="tst-device" name="device" type="text" maxlength="${MAX.device}" autocomplete="off" dir="auto">
  <fieldset class="tst-res"><legend>${T('איך היה? (חובה)', 'How did it go? (required)')}</legend>
    <div class="tst-res-row">
    <label><input type="radio" name="result" value="ok" required><span>✅ ${T('עבד', 'Worked')}</span></label>
    <label><input type="radio" name="result" value="partly"><span>🟡 ${T('עבד חלקית', 'Partly')}</span></label>
    <label><input type="radio" name="result" value="no"><span>❌ ${T('לא עבד', 'Didn\'t work')}</span></label>
    </div>
  </fieldset>
  <label for="tst-note">${T('מה קרה? (לא חובה)', 'What happened? (optional)')}</label>
  <textarea id="tst-note" name="note" rows="3" maxlength="${MAX.note}" dir="auto"></textarea>
  <label for="tst-name">${T('השם שלכם (לא חובה)', 'Your name (optional)')}</label>
  <input id="tst-name" name="name" type="text" maxlength="${MAX.name}" autocomplete="nickname" dir="auto">
  <label class="tst-check"><input type="checkbox" name="show_name" id="tst-show"> ${T('להציג את השם שלי כבודק בדף של המשחק הזה', 'Show my name as a tester on this game\'s page')}</label>
  <label for="tst-contact">${T('איך לחזור אליכם (לא חובה)', 'How to reach you (optional)')}</label>
  <input id="tst-contact" name="contact" type="text" maxlength="${MAX.contact}" autocomplete="email" dir="ltr" aria-describedby="tst-contact-note">
  <p class="tst-small" id="tst-contact-note">${T('מייל או כל דרך אחרת. רק אנחנו רואים אותו, והוא לא מופיע באתר אף פעם.', 'Email or any other way. Only we see it, and it never appears on the site.')}</p>
  <p class="tst-err" role="alert" aria-live="assertive"></p>
  <button type="submit" class="tst-send">${T('שליחה', 'Send')}</button>
  </div>
  <div class="tst-done" hidden>
    <p class="tst-thanks" tabindex="-1">${T('תודה רבה! 🙏 הדיווח הגיע אלינו.', 'Thank you! 🙏 Your report reached us.')}</p>
    <button type="button" class="tst-close">${T('סגירה', 'Close')}</button>
  </div>
</form>`;
    document.body.appendChild(dlg);
    const form = dlg.querySelector('form'), err = dlg.querySelector('.tst-err'), send = dlg.querySelector('.tst-send');
    const close = () => dlg.close();
    dlg.querySelector('.tst-x').addEventListener('click', close);
    dlg.querySelector('.tst-close').addEventListener('click', close);
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); });   // לחיצה מחוץ לטופס
    form.querySelectorAll('input[name="result"]').forEach(r => r.addEventListener('change', () => { err.textContent = ''; }));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const f = new FormData(form), result = f.get('result');
      if (!result) { err.textContent = T('בחרו אחת משלוש התשובות: עבד, עבד חלקית או לא עבד.', 'Please pick one of the three answers: worked, partly or didn\'t work.'); form.querySelector('input[name="result"]').focus(); return; }
      const val = k => String(f.get(k) || '').trim().slice(0, MAX[k]);
      const body = { game: current.slug, device: val('device'), result, note: val('note'), name: val('name'), show_name: !!f.get('show_name'), contact: val('contact') };
      if (body.show_name && !body.name) { err.textContent = T('כדי שהשם יופיע, כתבו אותו בשדה "השם שלכם".', 'To show your name, please write it in "Your name".'); form.querySelector('#tst-name').focus(); return; }
      err.textContent = '';
      send.disabled = true;
      send.textContent = T('שולחים…', 'Sending…');
      try {
        const r = await fetch('/api/report', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
        if (!r.ok) throw r.status;
        dlg.querySelector('.tst-step').hidden = true;
        dlg.querySelector('.tst-done').hidden = false;
        dlg.querySelector('.tst-thanks').focus();
      } catch (s) {
        err.textContent = s === 429 ? T('שלחתם הרבה דיווחים בשעה האחרונה. נסו שוב מאוחר יותר.', 'You sent many reports in the last hour. Please try again later.')
          : s === 503 ? T('הדיווחים לא פתוחים כרגע. נסו שוב מאוחר יותר.', 'Reports are closed right now. Please try again later.')
          : T('הדיווח לא נשלח. בדקו את החיבור לאינטרנט ונסו שוב.', 'The report was not sent. Check your internet connection and try again.');
      } finally {
        send.disabled = false;
        send.textContent = T('שליחה', 'Send');
      }
    });
  }
  function open(slug, name) {
    if (!dlg) build();
    current = { slug, name };
    const form = dlg.querySelector('form');
    form.reset();
    dlg.querySelector('.tst-gname').textContent = name;
    dlg.querySelector('#tst-device').value = detect();
    dlg.querySelector('.tst-err').textContent = '';
    dlg.querySelector('.tst-step').hidden = false;
    dlg.querySelector('.tst-done').hidden = true;
    dlg.showModal();
  }

  // שמות הבודקים: בקשה אחת לכל טעינת דף
  let creditsP = null;
  const getCredits = () => (creditsP ||= fetch('/api/report?credits=1').then(r => r.ok ? r.json() : {}).catch(() => ({})));

  window.d32Testers = {
    button(slug, name) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tst-open';
      b.setAttribute('aria-haspopup', 'dialog');
      b.textContent = T('🐞 בדקתם? ספרו לנו אם עבד', '🐞 Tried it? Tell us if it worked');
      b.addEventListener('click', () => open(slug, name));
      return b;
    },
    credits(slug) {
      const p = document.createElement('p');
      p.className = 'tst-credits';
      p.hidden = true;
      getCredits().then(c => {
        const who = c && Array.isArray(c[slug]) ? c[slug].filter(x => typeof x === 'string' && x) : [];
        if (!who.length) return;
        p.append(T('נבדק על ידי: ', 'Tested by: '));
        // לכל היותר שלושת האחרונים (גונן, 10.11), ואחריהם "ועוד N", קישור לרשימה המלאה בדף התודה
        who.slice(0, 3).forEach((x, i) => { if (i) p.append(', '); const b = document.createElement('bdi'); b.textContent = x; p.appendChild(b); });
        const a = document.createElement('a');
        a.href = (EN ? '/en' : '') + '/lab/1982/testers/#' + slug;
        a.className = who.length > 3 ? 'tst-more' : 'tst-thanks-link';
        a.textContent = who.length > 3 ? T('ועוד ' + (who.length - 3) + ' ←', 'and ' + (who.length - 3) + ' more →') : T('תודה! 🐞', 'Thank you! 🐞');
        p.append(who.length > 3 ? ' ' : ' · ', a);
        p.hidden = false;
      });
      return p;
    },
  };

  const css = document.createElement('style');
  css.textContent = `
.tst-open { display: block; margin-top: 8px; padding: 0; background: none; border: 0; font: inherit; font-size: 14px; color: var(--accent, #f2c94c); text-decoration: underline; cursor: pointer; text-align: start; min-height: 32px; }
.tst-open:focus-visible { outline: 3px solid var(--accent, #f2c94c); outline-offset: 2px; border-radius: 4px; }
.tst-credits { margin: 8px 0 0; font-size: 14px; color: var(--muted, #c9bba5); }
.tst-credits a { color: var(--accent, #f2c94c); }
.tst-dlg { width: min(460px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); margin: auto; padding: 0; border: 2px solid #5a4430; border-radius: 14px; background: #1f1712; color: var(--ink, #efe6d2); font: 16px/1.5 'IBM Plex Sans Hebrew', system-ui, sans-serif; overflow: auto; }
.tst-dlg::backdrop { background: rgba(0,0,0,.65); }
.tst-form { padding: 14px 16px 16px; display: flex; flex-direction: column; }
.tst-step { display: flex; flex-direction: column; }
.tst-step[hidden], .tst-done[hidden] { display: none; }
.tst-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.tst-top h2 { margin: 0; font-size: 19px; }
.tst-x { background: none; border: 0; color: var(--muted, #c9bba5); font: inherit; font-size: 20px; min-width: 44px; min-height: 44px; cursor: pointer; }
.tst-game { margin: 4px 0 10px; color: var(--muted, #c9bba5); }
.tst-gname { color: var(--accent, #f2c94c); font-weight: 700; }
.tst-form label { font-size: 14px; color: var(--muted, #c9bba5); margin-top: 8px; }
.tst-form input[type="text"], .tst-form textarea { width: 100%; margin-top: 2px; padding: 9px 10px; border: 1.5px solid #5a4430; border-radius: 8px; background: #0e0b09; color: var(--ink, #efe6d2); font: inherit; font-size: 16px; }
.tst-form textarea { resize: vertical; min-height: 72px; }
.tst-form input:focus-visible, .tst-form textarea:focus-visible, .tst-dlg button:focus-visible { outline: 3px solid var(--accent, #f2c94c); outline-offset: 1px; }
.tst-res { border: 0; padding: 0; margin: 12px 0 0; }
.tst-res legend { font-size: 14px; color: var(--ink, #efe6d2); font-weight: 700; padding: 0; }
.tst-res-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 4px; }
.tst-res label { margin: 0; position: relative; }
.tst-res input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
.tst-res span { display: flex; align-items: center; justify-content: center; text-align: center; min-height: 56px; padding: 6px 4px; border: 1.5px solid #5a4430; border-radius: 10px; background: #1b1511; color: var(--ink, #efe6d2); font-weight: 700; font-size: 15px; line-height: 1.25; }
.tst-res input:checked + span { border-color: var(--accent, #f2c94c); background: #3a2a10; color: var(--accent, #f2c94c); }
.tst-res input:focus-visible + span { outline: 3px solid var(--accent, #f2c94c); outline-offset: 1px; }
.tst-form .tst-check { display: flex; gap: 8px; align-items: flex-start; color: var(--ink, #efe6d2); }
.tst-check input { width: 20px; height: 20px; margin: 2px 0 0; flex: none; accent-color: #f2c94c; }
.tst-small { margin: 2px 0 0; font-size: 13px; color: var(--muted, #c9bba5); }
.tst-err { margin: 10px 0 0; color: #ff9c8c; font-weight: 700; }
.tst-err:empty { display: none; }
.tst-send, .tst-close { margin-top: 14px; border: 0; border-radius: 12px; background: #e0503c; color: #fff; font: inherit; font-weight: 800; font-size: 17px; padding: 11px; box-shadow: 0 4px 0 #6d160b; cursor: pointer; }
.tst-send:disabled { opacity: .6; cursor: wait; }
.tst-thanks { font-size: 18px; margin: 12px 0 0; }
`;
  document.head.appendChild(css);
})();
