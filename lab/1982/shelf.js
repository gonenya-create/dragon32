// מדף קלטות במחשב האמיתי: אותן קלטות BASIC כמו באפליקציה. הקלטת נבנית כאן בפורמט של הרשמקול
// (קובץ CAS, תוכנית בטקסט), נכנסת לרשמקול של XRoar, והמקלדת מקלידה CLOAD, וכשעל המסך מופיע OK, גם RUN.
(function () {
  const EN = document.documentElement.lang === 'en';
  const TAPES = [
    ['guess', 'נחש את המספר', 'Guess the number'],
    ['lander', 'נחיתה על הירח', 'Moon lander'],
    ['quiz', 'חידון חשבון', 'Maths quiz'],
    ['rps', 'אבן, נייר, מספריים', 'Rock, paper, scissors'],
    ['cave', 'מערת הדרקון', 'Dragon cave'],
    ['draw', 'ציור על המסך', 'Screen drawing'],
    ['derby', 'מרוץ סוסים', 'Horse race']
  ];
  // בלוק בקלטת: 55 3C סוג אורך נתונים סכום 55
  function block(type, data) {
    let sum = type + data.length;
    for (const b of data) sum += b;
    return [0x55, 0x3c, type, data.length, ...data, sum & 255, 0x55];
  }
  function cassette(name, text) {
    const leader = new Array(128).fill(0x55);
    const header = [...name.toUpperCase().padEnd(8).slice(0, 8)].map(c => c.charCodeAt(0)).concat([0, 255, 255, 0, 0, 0, 0]);
    const data = [...text.replace(/\r?\n/g, '\r')].map(c => c.charCodeAt(0) & 127);
    let out = leader.concat(block(0, header), leader);
    for (let i = 0; i < data.length; i += 255) out = out.concat(block(1, data.slice(i, i + 255)));
    return new Uint8Array(out.concat(block(255, [])));
  }
  const box = document.getElementById('tapes');
  const status = document.getElementById('tape-status');
  if (!box) return;
  for (const [id, he, en] of TAPES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tape';
    b.innerHTML = '<span></span><small dir="ltr"></small>';
    b.querySelector('span').textContent = EN ? en : he;
    b.querySelector('small').textContent = id.toUpperCase();
    b.addEventListener('click', () => load(id, EN ? en : he, b));
    box.appendChild(b);
  }
  // הגיעו מהאפליקציה עם ?tape=guess: הקלטת נטענת לבד, ברגע שהמחשב מוכן
  const want = new URLSearchParams(location.search).get('tape');
  const wanted = TAPES.findIndex(t => t[0] === want);
  if (wanted >= 0) {
    const go = setInterval(() => {
      if (!window.d32Ready) return;
      clearInterval(go);
      setTimeout(() => box.children[wanted].click(), 2000);
    }, 300);
  }
  let busy = false;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  // זיכרון המחשב המדומה נמצא בתוך הזיכרון של XRoar. מוצאים אותו פעם אחת לפי שורת הפתיחה שעל המסך
  // (המסך מתחיל ב-$0400), וכך אפשר לקרוא מה כתוב על המסך ולדעת מתי הטעינה נגמרה
  const scr = c => { const n = c.charCodeAt(0); return n >= 0x40 ? n : n + 0x40; };
  let ram = -1;
  function findRam() {
    if (ram >= 0 || typeof HEAPU8 === 'undefined') return ram;
    const sig = [...'DRAGON 1982 BASIC'].map(scr), h = HEAPU8;
    for (let i = 0x400; i < h.length - sig.length; i++) {
      if (h[i] !== sig[0]) continue;
      let k = 1;
      while (k < sig.length && h[i + k] === sig[k]) k++;
      if (k === sig.length) { ram = i - 0x400; break; }
    }
    return ram;
  }
  window.d32Screen = () => (findRam() >= 0 ? screenRows() : null);
  function screenRows() {
    const rows = [];
    for (let r = 0; r < 16; r++) {
      let t = '';
      for (let c = 0; c < 32; c++) { const b = HEAPU8[ram + 0x400 + r * 32 + c]; t += b >= 0x80 ? ' ' : String.fromCharCode(b >= 0x60 ? b - 0x40 : b); }   // ריבועי צבע = רווח
      rows.push(t.trimEnd());
    }
    return rows;
  }
  // מחפשים מיד אחרי ההדלקה, כשמשפט הפתיחה עוד על המסך
  const early = setInterval(() => { if (window.d32Ready) { clearInterval(early); setTimeout(findRam, 1500); } }, 300);
  // אחרי CLOAD: מחכים ל-OK (נטען) או לשגיאה. בלי גישה לזיכרון: לפי האורך של הקלטת
  async function loaded(bytes) {
    if (ram < 0) { await wait(3000 + bytes * 9 + 2000); return true; }
    const start = Date.now();
    while (Date.now() - start < 90000) {
      await wait(250);
      const rows = screenRows();
      const at = rows.map(r => r.startsWith('CLOAD')).lastIndexOf(true);
      if (at < 0) continue;
      const after = rows.slice(at + 1);
      if (after.some(r => /ERROR/.test(r))) return false;
      if (after.includes('OK')) return true;
    }
    return false;
  }
  async function load(id, title, button) {
    if (busy) return;
    if (typeof Module === 'undefined' || !window.d32Ready) { status.textContent = EN ? 'The computer is still starting. Try again in a moment.' : 'המחשב עוד נדלק. נסו שוב בעוד רגע.'; return; }
    busy = true;
    findRam();
    try {
      const text = await (await fetch('/assets/dragon/tapes/' + id + '.bas')).text();
      const path = '/tape-' + id + '.cas';
      FS.writeFile(path, cassette(id, text));
      Module.ccall('wasm_load_file', null, ['string', 'number', 'number'], [path, 2, 0]);
      box.querySelectorAll('.tape').forEach(t => t.classList.toggle('in', t === button));
      status.textContent = EN ? 'Loading "' + title + '" from the tape…' : 'טוען את "' + title + '" מהקלטת…';
      if (innerWidth < 1000) document.querySelector('.tv').scrollIntoView({ behavior: 'smooth', block: 'start' });
      // עוצרים תוכנית שרצה (פעמיים: תוכנית שמחכה למקש עלולה לבלוע את הראשון), ומנקים את המסך,
      // כדי שהמילים CLOAD ו-OK שנבדוק יהיו של הטעינה הזאת ולא של קודמת
      await window.d32Type('\x1b');
      await wait(400);
      await window.d32Type('\x1b');
      await wait(400);
      await window.d32Type('CLS\n');
      await wait(300);
      await window.d32Type('CLOAD\n');
      if (await loaded(text.length)) {
        await window.d32Type('RUN\n');
        status.textContent = EN ? '"' + title + '" is running. To stop: BREAK.' : '"' + title + '" רץ. לעצירה: BREAK.';
      } else status.textContent = EN ? 'The tape did not load. Try again.' : 'הקלטת לא נטענה. נסו שוב.';
    } catch (e) {
      status.textContent = EN ? 'The tape did not load. Try again.' : 'הקלטת לא נטענה. נסו שוב.';
    } finally { busy = false; }
  }
})();
