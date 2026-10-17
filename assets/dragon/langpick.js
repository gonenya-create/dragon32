// קישור "English" / "עברית": שומר את הבחירה, כדי שבביקור הבא האתר ייפתח בשפה הזו (ראו הסקריפט בראש index.html ו-en/index.html)
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('[data-lang]');
  if (a) try { localStorage.setItem('d32-lang', a.dataset.lang); } catch { /* בלי זיכרון */ }
});
