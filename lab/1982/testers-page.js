// דף התודה לבודקים (/lab/1982/testers/ ו-/en/...): כל שמות הבודקים שאושרו, לפי משחק (החדש ראשון), מ-/api/report?credits=1.
// שמות המשחקים בסדר הארון: D32_TESTER_GAMES שבדף (נבנה ב-tools/lab/testers.mjs).
(function () {
  const EN = document.documentElement.lang === 'en';
  const list = document.getElementById('tst-list'), empty = document.getElementById('tst-empty');
  const names = window.D32_TESTER_GAMES || {};
  fetch('/api/report?credits=1').then(r => r.ok ? r.json() : {}).catch(() => ({})).then(c => {
    let n = 0;
    for (const slug of Object.keys(names)) {
      const who = Array.isArray(c[slug]) ? c[slug].filter(x => typeof x === 'string' && x) : [];
      if (!who.length) continue;
      const li = document.createElement('li');
      li.id = slug;
      const a = document.createElement('a');
      a.className = 'gn';
      a.href = (EN ? '/en' : '') + '/lab/1982/' + slug + '/';
      const b = document.createElement('bdi'); b.textContent = names[slug]; a.appendChild(b);
      const w = document.createElement('span');
      w.className = 'who';
      w.append(EN ? 'Tested by: ' : 'נבדק על ידי: ');
      who.forEach((x, i) => { if (i) w.append(', '); const bd = document.createElement('bdi'); bd.textContent = x; w.appendChild(bd); });
      li.append(a, w);
      list.appendChild(li);
      n++;
    }
    empty.hidden = n > 0;
    // קישור "ועוד N" מדף משחק: גוללים לשורה של המשחק (היא נוספה רק עכשיו)
    const t = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (t) t.scrollIntoView();
  });
})();
