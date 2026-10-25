// לוח משחק לטלפון (גונן, 25.10: "באייפון מאוד קשה לשחק"): ידית משמאל וכפתור גדול מימין, מתחת למסך.
// מקש במקלדת המצוירת נלחץ לרגע ומשתחרר, ואי אפשר להחזיק אותו. בלוח הזה מקש נשאר לחוץ כל עוד האצבע עליו,
// כמו ידית וכפתור של ג'ויסטיק אמיתי. מופיע רק במסך מגע, ורק אחרי שמכניסים לרשמקול קלטת של משחק שיש לו מקשים כאן.
// גונן: "לפתוח אותם רק כשפותחים משחק ולהשאיר אותם סגורים כשלא משחקים": ✕ או BREAK סוגרים, ו-🎮 פותח שוב.
(function () {
  const EN = document.documentElement.lang === 'en';
  const K = { up: ['ArrowUp', 'ArrowUp'], down: ['ArrowDown', 'ArrowDown'], left: ['ArrowLeft', 'ArrowLeft'], right: ['ArrowRight', 'ArrowRight'],
    space: [' ', 'Space'], enter: ['Enter', 'Enter'], alt: ['Alt', 'AltLeft'], Z: ['Z', 'KeyZ'], C: ['C', 'KeyC'], S: ['S', 'KeyS'], X: ['X', 'KeyX'] };
  const ARROWS = { up: 'up', down: 'down', left: 'left', right: 'right' };
  // המקשים של כל משחק, לפי תיבת "איך משחקים" שלו. במשחקי ג'ויסטיק (shelf.js, ‏JOY) החיצים הם הידית ו-Alt הכפתור
  const GAMES = {
    eggs: { dir: ARROWS, fire: 'space', label: ['רווח', 'SPACE'] },
    blockdown: { dir: { up: 'S', down: 'X', left: 'Z', right: 'C' }, fire: 'space', label: ['רווח', 'SPACE'] },
    dragontet: { dir: ARROWS, fire: 'enter', label: ['ENTER', 'ENTER'] },
    phantom: { dir: ARROWS, fire: 'space', label: ['רווח', 'SPACE'] },
    ranger: { dir: ARROWS, fire: 'alt', label: ['אש', 'FIRE'] }
  };
  const css = document.createElement('style');
  css.textContent = `
.joypad { display: none; position: relative; direction: ltr; justify-content: space-between; align-items: center; margin-top: 12px; padding: 10px 18px; border-radius: 12px; background: linear-gradient(180deg, #2a221c, #15110e); user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; touch-action: none; }
@media (pointer: coarse) { .joypad.on.open { display: flex; } .jp-toggle.on:not(.open) { display: block; } }
.jp-close { position: absolute; top: 6px; left: 50%; width: 34px; height: 34px; margin-left: -17px; border: 1px solid #4d4238; border-radius: 50%; background: #1b1511; color: #b9a98f; font: 700 16px/1 sans-serif; touch-action: manipulation; }
.jp-toggle { display: none; margin: 12px 0 0 auto; padding: 8px 14px; border: 1.5px solid #5a4430; border-radius: 999px; background: #1b1511; color: #f4efe4; font: inherit; font-size: 15px; touch-action: manipulation; }
.jp-stick { position: relative; width: 136px; height: 136px; border-radius: 50%; background: radial-gradient(circle, #3a332d 0 58%, #241e19 60%); box-shadow: inset 0 0 0 2px #4d4238; touch-action: none; }
.jp-stick i { position: absolute; color: #8a7b68; font: 700 14px/1 'Courier New', monospace; font-style: normal; }
.jp-knob { position: absolute; left: 50%; top: 50%; width: 58px; height: 58px; margin: -29px 0 0 -29px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #5b524a, #1a1613); box-shadow: 0 4px 0 #050505; pointer-events: none; }
.jp-fire { width: 104px; height: 104px; border: 0; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #e0503c, #8c1f12); color: #fff3e8; font: 700 16px/1 'Courier New', monospace; box-shadow: 0 5px 0 #3d0c06; touch-action: none; }
.jp-fire.he { font-family: inherit; font-size: 18px; }
.jp-fire.down { transform: translateY(3px); box-shadow: 0 2px 0 #3d0c06; }
`;
  document.head.appendChild(css);
  const pad = document.createElement('div');
  pad.className = 'joypad';
  pad.setAttribute('aria-hidden', 'true'); // בקורא מסך משתמשים במקלדת המצוירת
  pad.innerHTML = '<div class="jp-stick"><i style="left:50%;top:6px;margin-left:-5px">▲</i><i style="left:50%;bottom:6px;margin-left:-5px">▼</i>' +
    '<i style="top:50%;left:6px;margin-top:-7px">◀</i><i style="top:50%;right:6px;margin-top:-7px">▶</i><div class="jp-knob"></div></div>' +
    '<button type="button" class="jp-close" aria-label="close">✕</button><button type="button" class="jp-fire"></button>';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'jp-toggle';
  toggle.textContent = EN ? '🎮 Game pad' : '🎮 ג\'ויסטיק';
  const kbdEl = document.getElementById('kbd');
  kbdEl.parentNode.insertBefore(pad, kbdEl);
  kbdEl.parentNode.insertBefore(toggle, kbdEl);
  const canvas = document.getElementById('canvas');
  const stick = pad.querySelector('.jp-stick'), knob = pad.querySelector('.jp-knob'), fireBtn = pad.querySelector('.jp-fire');
  let game = null, held = new Set(), fireDown = false;
  function send(type, name) {
    const [key, code] = K[name];
    canvas.dispatchEvent(new KeyboardEvent(type, { key, code, bubbles: true, cancelable: true }));
  }
  // מחזיקים בדיוק את המקשים שבקבוצה: משחררים את מה שיצא ולוחצים את מה שנכנס
  function hold(names) {
    for (const n of held) if (!names.has(n)) send('keyup', n);
    for (const n of names) if (!held.has(n)) send('keydown', n);
    held = names;
  }
  // הידית: 8 כיוונים לפי הזווית, ובאמצע אזור מת. אלכסון = שני מקשים יחד, כמו בג'ויסטיק
  function move(e) {
    const r = stick.getBoundingClientRect(), R = r.width / 2;
    let dx = e.clientX - r.left - R, dy = e.clientY - r.top - R;
    const d = Math.hypot(dx, dy), max = R - 29;
    if (d > max) { dx = dx * max / d; dy = dy * max / d; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    const names = new Set();
    if (d > R * 0.22) {
      const a = Math.atan2(dy, dx) * 180 / Math.PI; // 0 = ימינה, 90 = למטה
      const dir = game.dir;
      if (a > -67.5 && a < 67.5) names.add(dir.right);
      if (a > 112.5 || a < -112.5) names.add(dir.left);
      if (a > 22.5 && a < 157.5) names.add(dir.down);
      if (a < -22.5 && a > -157.5) names.add(dir.up);
    }
    hold(names);
  }
  function center() { knob.style.transform = ''; hold(new Set()); }
  stick.addEventListener('pointerdown', e => { if (!game) return; e.preventDefault(); stick.setPointerCapture(e.pointerId); move(e); canvas.focus({ preventScroll: true }); });
  stick.addEventListener('pointermove', e => { if (game && stick.hasPointerCapture(e.pointerId)) move(e); });
  stick.addEventListener('pointerup', center);
  stick.addEventListener('pointercancel', center);
  function fireOff() { if (fireDown) { fireDown = false; fireBtn.classList.remove('down'); send('keyup', game.fire); } }
  fireBtn.addEventListener('pointerdown', e => {
    if (!game) return; e.preventDefault(); fireBtn.setPointerCapture(e.pointerId);
    if (!fireDown) { fireDown = true; fireBtn.classList.add('down'); send('keydown', game.fire); }
    canvas.focus({ preventScroll: true });
  });
  fireBtn.addEventListener('pointerup', fireOff);
  fireBtn.addEventListener('pointercancel', fireOff);
  fireBtn.addEventListener('contextmenu', e => e.preventDefault());
  // כשעוברים לאפליקציה אחרת באמצע לחיצה, לא משאירים מקש תקוע
  document.addEventListener('visibilitychange', () => { if (document.hidden && game) { center(); fireOff(); } });
  function show(open) {
    if (!open && game) { center(); fireOff(); }
    pad.classList.toggle('open', open);
    toggle.classList.toggle('open', open);
  }
  pad.querySelector('.jp-close').addEventListener('click', () => show(false));
  toggle.addEventListener('click', () => show(true));
  // BREAK (גם מהמקלדת המצוירת) יוצא מהמשחק, אז גם הלוח נסגר
  canvas.addEventListener('keydown', e => { if (e.key === 'Escape') show(false); });
  // shelf.js קורא לזה כשמכניסים קלטת לרשמקול: משחק עם מקשים כאן מדליק את הלוח, וכל קלטת אחרת מכבה אותו
  window.d32Pad = function (id) {
    if (game) { center(); fireOff(); }
    game = GAMES[id] || null;
    pad.classList.toggle('on', !!game);
    toggle.classList.toggle('on', !!game);
    show(!!game);
    if (game) { fireBtn.textContent = game.label[EN ? 1 : 0]; fireBtn.classList.toggle('he', /[א-ת]/.test(fireBtn.textContent)); }
  };
})();
