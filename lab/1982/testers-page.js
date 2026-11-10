// דף התודה לבודקים, בטבלה (/lab/1982/testers/ ו-/en/...): כל שמות הבודקים שאושרו, לפי משחק (החדש ראשון), מ-/api/report?credits=1.
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
      const li = document.createElement('tr');
      li.id = slug;
      const td1 = document.createElement('td'), td2 = document.createElement('td');
      const a = document.createElement('a');
      a.className = 'gn';
      a.href = (EN ? '/en' : '') + '/lab/1982/' + slug + '/';
      const b = document.createElement('bdi'); b.textContent = names[slug]; a.appendChild(b);
      who.forEach((x, i) => { if (i) td2.append(', '); const bd = document.createElement('bdi'); bd.textContent = x; td2.appendChild(bd); });
      td1.appendChild(a);
      li.append(td1, td2);
      list.appendChild(li);
      n++;
    }
    // שורת הדוגמה (גונן, 10.11): נשארת עד שמופיע הבודק האמיתי הראשון, ואז נמחקת
    const ex = document.getElementById('tst-example');
    if (n > 0 && ex) ex.remove();
    empty.hidden = n > 0;
    // קישור "ועוד N" מדף משחק: גוללים לשורה של המשחק (היא נוספה רק עכשיו)
    const t = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (t) t.scrollIntoView();
  });
})();
