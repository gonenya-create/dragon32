// מסך מלא במכונת ה-Dragon: רק המחשב והמקלדת. במחשב שולחני גם מסך מלא של הדפדפן.
// באייפון ספארי לא נותן לדף מסך מלא אמיתי, אז רק מסתירים את כל השאר
(function () {
  const he = document.documentElement.lang === 'he';
  const open = document.getElementById('full-open');
  const close = document.createElement('button');
  close.type = 'button';
  close.id = 'full-close';
  close.textContent = he ? '✕ יציאה ממסך מלא' : '✕ Exit full screen';
  document.body.appendChild(close);
  const root = document.documentElement;
  const canvas = document.getElementById('canvas');
  function enter() {
    document.body.classList.add('full');
    if (root.requestFullscreen) root.requestFullscreen().catch(() => {});
    else if (root.webkitRequestFullscreen) root.webkitRequestFullscreen();
    window.scrollTo(0, 0);
    canvas.focus({ preventScroll: true });
  }
  function leave() {
    document.body.classList.remove('full');
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
    open.focus({ preventScroll: true });
  }
  open.addEventListener('click', enter);
  close.addEventListener('click', leave);
  // הדפדפן יצא בעצמו ממסך מלא (למשל Esc במק): חוזרים גם לדף הרגיל
  function changed() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement && document.body.classList.contains('full')) leave();
  }
  document.addEventListener('fullscreenchange', changed);
  document.addEventListener('webkitfullscreenchange', changed);
})();
