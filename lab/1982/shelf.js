// מדף קלטות במחשב האמיתי: אותן קלטות BASIC כמו באפליקציה. הקלטת נבנית כאן בפורמט של הרשמקול
// (קובץ CAS, תוכנית בטקסט), נכנסת לרשמקול של XRoar, והמקלדת מקלידה CLOAD. את RUN מקלידים בעצמכם, כמו אז.
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
  let busy = false;
  async function load(id, title, button) {
    if (busy) return;
    if (typeof Module === 'undefined' || !window.d32Ready) { status.textContent = EN ? 'The computer is still starting. Try again in a moment.' : 'המחשב עוד נדלק. נסו שוב בעוד רגע.'; return; }
    busy = true;
    try {
      const text = await (await fetch('/assets/dragon/tapes/' + id + '.bas')).text();
      const path = '/tape-' + id + '.cas';
      FS.writeFile(path, cassette(id, text));
      Module.ccall('wasm_load_file', null, ['string', 'number', 'number'], [path, 2, 0]);
      box.querySelectorAll('.tape').forEach(t => t.classList.toggle('in', t === button));
      status.textContent = EN
        ? '"' + title + '" is in the tape player. The computer types CLOAD; when OK appears, type RUN and press ENTER.'
        : '"' + title + '" ברשמקול. המחשב מקליד CLOAD; כשמופיע OK, מקלידים RUN ולוחצים ENTER.';
      document.querySelector('.tv').scrollIntoView({ behavior: 'smooth', block: 'start' });
      await window.d32Type('CLOAD\n');
    } catch (e) {
      status.textContent = EN ? 'The tape did not load. Try again.' : 'הקלטת לא נטענה. נסו שוב.';
    } finally { busy = false; }
  }
})();
