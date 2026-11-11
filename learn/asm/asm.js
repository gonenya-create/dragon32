/* האסמבלר: הדף /learn/asm/ (ו-/en/learn/asm/). עורך, תרגום חי, הרצה וצעד במעבד 6809 מלא, ושליחה למכונת הדראגון.
   The Assembler page. Uses asm6809.js (assembler + CPU) and shared.js (built by tools/learn/build.mjs from the course:
   the send button's tape code and the Dragon screen drawing). Hebrew or English by <html lang>. */
(() => {
  'use strict';
  const A = window.ASM6809, EN = document.documentElement.lang === 'en';
  const tr = (he, en) => EN ? en : he;
  const $ = s => document.querySelector(s);
  const H2 = A.H2, H4 = A.H4;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const LT = s => '<bdi class="ltr">' + esc(s) + '</bdi>';
  const CLK = 894886;                 // cycles per second (the Dragon's 0.89 MHz)
  const POLCAT = 0x8006, POLL_CYC = 180; // the keyboard check in our ROM: [$A000] = $8006 (the same estimate as the course)
  const S0 = 0x7EF0, RET = 0x8B8D;    // the stack and the return address into BASIC when EXEC starts a program
  const FREE_LO = 0x2EE1, FREE_HI = 0x7E00;
  const KEY_SRC = 'd32-asm-src', KEY_NAME = 'd32-asm-name';
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  /* ---------------- examples ---------------- */
  const cm = (he, en) => en;   // comments in the code stay in English, like everything on the Dragon's screen (Hebrew in a left-to-right line gets mixed up)
  const WAIT = ['KEY LDX $A000     ' + cm('* בודקים מקש', '* check for a key'), ' JSR ,X', ' BEQ KEY', ' RTS               ' + cm('* חזרה ל-BASIC', '* back to BASIC')];
  const EX = [
    { id: 'abc', tape: 'ABC', he: 'האלף-בית על המסך (פרקים 7 ו-9)', en: 'The alphabet on the screen (chapters 7 and 9)', src: [
      '* ' + cm('האותיות A עד Z בשורה הראשונה', 'the letters A to Z on the top line'),
      '@ LDX #$0400', " LDA #'A", 'LOOP STA ,X+', ' INCA', " CMPA #'Z+1", ' BNE LOOP'].concat(WAIT) },
    { id: 'dots', tape: 'DOTS', he: 'שלוש נקודות עם תת-תוכנית (פרק 12)', en: 'Three dots with a subroutine (chapter 12)', src: [
      '@ LDY #$0484', ' JSR DOT', ' LDY #$048E', ' JSR DOT', ' LDY #$0498', ' JSR DOT'].concat(WAIT, ['DOT LDA #$BF', ' STA ,Y', ' STA 1,Y', ' RTS']) },
    { id: 'catch', tape: 'CATCH', he: 'התופס: המשחק מפרקים 14 ו-15', en: 'The catcher: the game from chapters 14 and 15', src: ['* ' + cm('חצים זזים, Q יוצא. 5 תפוחים', 'arrows move, Q quits. 5 apples'),
      '@ LDY #$05F0', ' LDU #$0430', ' CLR SCORE', ' LDA #5', ' STA LEFT', ' LDB #16', ' STB SEED', 'LOOP LDA #$AF', ' STA ,Y', ' LDA #$9F', ' STA ,U', ' LDA SCORE', ' ADDA #$70', ' STA $0400',
      ' LDX #800', 'WAIT LEAX -1,X', ' BNE WAIT', ' LDX $A000', ' JSR ,X', ' BEQ FALL', " CMPA #'Q", ' BEQ KEY', ' LDB #$60', ' STB ,Y', ' CMPA #$08', ' BNE NOTL', ' CMPY #$05E0', ' BEQ NOTL', ' LEAY -1,Y',
      'NOTL CMPA #$09', ' BNE FALL', ' CMPY #$05FF', ' BEQ FALL', ' LEAY 1,Y', 'FALL DEC TICK', ' BNE LOOP', ' LDA #25', ' STA TICK', ' LDA #$60', ' STA ,U', ' LEAU 32,U', ' CMPU #$05E0', ' BLO LOOP',
      ' LDA ,U', ' CMPA #$AF', ' BNE MISS', ' INC SCORE', 'MISS LDB SEED', ' ADDB #13', ' ANDB #31', ' STB SEED', ' LDU #$0420', ' LEAU B,U', ' DEC LEFT', ' BNE LOOP', ' LDA SCORE', ' ADDA #$70', ' STA $0400',
      'KEY LDX $A000', ' JSR ,X', ' BEQ KEY', ' RTS', 'SCORE FCB 0', 'LEFT FCB 5', 'TICK FCB 25', 'SEED FCB 16'] },
    { id: 'mul', tape: 'TIMES', he: 'כפל: MUL, ‏TFR ו-LBRA (חדש)', en: 'Times: MUL, TFR and LBRA (new)', src: [
      '* ' + cm('13 כפול 7 = 91 = $005B. מראים את התוצאה בהקסדצימלי', '13 times 7 = 91 = $005B. Shows the answer in hex'),
      'SCREEN EQU $0400', '@ LDA #13', ' LDB #7', ' MUL               ' + cm('* D = A כפול B', '* D = A times B'), ' LDX #SCREEN+68', ' PSHS B', ' TFR A,B', ' BSR HEX2', ' PULS B', ' BSR HEX2', ' LBRA DONE',
      '* ' + cm('בית אחד (ב-B) כשתי ספרות הקסדצימליות', 'one byte (in B) as two hex digits'),
      'HEX2 PSHS B', ' LSRB', ' LSRB', ' LSRB', ' LSRB', ' BSR DIGIT', ' PULS B', ' ANDB #$0F', 'DIGIT LEAU DIGITS,PCR', ' LDA B,U', ' ORA #$40         * normal, not inverse', ' STA ,X+', ' RTS',
      "DIGITS FCC /0123456789/", " FCB 'A,'B,'C,'D,'E,'F",
      'DONE LDY #MSG', 'NEXT LDA ,Y+', ' BEQ WAITK', ' ORA #$40', ' STA ,X+', ' BRA NEXT',
      'WAITK JSR [$A000]     ' + cm('* בודק המקלדת, דרך הכתובת שב-$A000', '* the keyboard check, through the address at $A000'), ' BEQ WAITK', ' RTS',
      "MSG FCC / = 13 X 7/", ' FCB 0'] },
    { id: 'table', tape: 'STARS', he: 'טבלת מקומות: FDB ו-[,X++] (חדש)', en: 'A table of places: FDB and [,X++] (new)', src: [
      '* ' + cm('כוכבים במקומות שבטבלה. הסוגריים: קוראים מהטבלה את מספר הבית, וכותבים לשם', 'stars at the places in the table. Brackets: read the place number from the table, and write there'),
      '@ LDX #PLACES', " LDA #'*+$40       * '*' in normal colours", 'LOOP LDY ,X        ' + cm('* האם זה הסוף (0)?', '* the end (0)?'), ' BEQ COUNT', ' STA [,X++]', ' BRA LOOP',
      '* ' + cm('סופרים כמה כוכבים בעזרת DAA (ספירה עשרונית)', 'count the stars with DAA (decimal counting)'),
      'COUNT CLRA', ' LDB #4', 'MORE ADDA #1', ' DAA', ' DECB', ' BNE MORE', ' TFR A,B', ' LSRA', ' LSRA', ' LSRA', ' LSRA', ' ADDA #$70', ' STA $05E0', ' ANDB #$0F', ' ADDB #$70', ' STB $05E1'].concat(WAIT,
      ['PLACES FDB $0421,$0466,$04AB,$04F0', ' FDB 0']) }
  ];

  /* ---------------- the page ---------------- */
  const root = $('#asm');
  root.innerHTML = `
<div class="asm-ex row"><label for="asm-ex">${tr('דוגמה לטעינה:', 'Load an example:')}</label> <select id="asm-ex"><option value="">${tr('בחר…', 'Choose…')}</option>${EX.map(e => `<option value="${e.id}">${esc(tr(e.he, e.en))}</option>`).join('')}</select>
  <button class="btn ghost" type="button" id="asm-new">${tr('✏️ תוכנית חדשה', '✏️ New program')}</button></div>
<div class="asm-grid">
  <div class="asm-edwrap">
    <div class="asm-ed" dir="ltr"><pre class="asm-gut" aria-hidden="true"></pre><textarea id="asm-src" spellcheck="false" autocapitalize="characters" autocomplete="off" aria-label="${tr('התוכנית', 'The program')}"></textarea></div>
    <div class="asm-sum" id="asm-sum"></div>
    <div class="asm-errs" id="asm-errs" role="status" aria-live="polite"></div>
  </div>
  <div class="asm-side">
    <div class="asm-scr" id="asm-scr" tabindex="0" aria-label="${tr('מסך הדראגון. בזמן ריצה, מקשים כאן הולכים לתוכנית.', 'The Dragon screen. While running, keys here go to the program.')}"><canvas width="256" height="192"></canvas></div>
    <div class="asm-keys row" id="asm-keys">${[['←', 8], ['→', 9], ['↑', 94], ['↓', 10], [tr('רווח', 'SPACE'), 32], ['ENTER', 13], ['Q', 81], ['BREAK', 3]].map(([t, k]) => `<button type="button" class="key9" data-k="${k}">${t}</button>`).join('')}</div>
    <div class="asm-btns row">
      <button class="btn warm" type="button" id="asm-run">▶ ${tr('הרץ', 'Run')}</button>
      <button class="btn" type="button" id="asm-step">${tr('צעד', 'Step')}</button>
      <button class="btn ghost" type="button" id="asm-reset">⟲ ${tr('מההתחלה', 'Restart')}</button>
    </div>
    <div class="asm-send row"><label for="asm-name">${tr('שם הקלטת:', 'Tape name:')}</label> <input id="asm-name" class="num" maxlength="8" autocapitalize="characters" spellcheck="false">
      <button class="btn ghost sendgo" type="button" id="asm-send">${tr('🐉 שלח למכונה', '🐉 Send to the machine')}</button></div>
    <div class="asm-say" id="asm-say" role="status" aria-live="polite"></div>
    <div class="send12"><div class="sendsay" id="asm-sendsay" hidden></div></div>
  </div>
</div>
<div class="asm-cpu" id="asm-cpu"></div>
<h3 class="asm-h">${tr('הרשימה: כל שורה, הבית שלה והמספרים שלה', 'The listing: every line, its address and its numbers')}</h3>
<div class="asm-lst" dir="ltr"><table id="asm-lst"><thead><tr><th>#</th><th>${tr('בית', 'Addr')}</th><th>${tr('מספרים', 'Bytes')}</th><th title="${tr('מחזורי שעון', 'clock cycles')}">~</th><th>${tr('שורה', 'Line')}</th></tr></thead><tbody></tbody></table></div>`;
  const src = $('#asm-src'), gut = root.querySelector('.asm-gut'), lst = $('#asm-lst tbody'), say = $('#asm-say'), errsEl = $('#asm-errs');
  const name = $('#asm-name'), sendBtn = $('#asm-send'), runBtn = $('#asm-run');
  const cv = root.querySelector('#asm-scr canvas'), ctx = cv.getContext('2d');

  /* ---------------- editor ---------------- */
  const start = ls.get(KEY_SRC);
  src.value = start != null ? start : EX[0].src.join('\n') + '\n';
  name.value = ls.get(KEY_NAME) || (start != null ? 'MYPROG' : EX[0].tape);
  const gutter = () => { const n = src.value.split('\n').length; let s = ''; for (let i = 1; i <= n; i++) s += i + '\n'; gut.textContent = s; gut.scrollTop = src.scrollTop; };
  src.addEventListener('scroll', () => { gut.scrollTop = src.scrollTop; });
  let tm = 0;
  src.addEventListener('input', () => { gutter(); ls.set(KEY_SRC, src.value); clearTimeout(tm); tm = setTimeout(() => { build(); reset(); }, 250); });
  // Tab writes a space (a command after a space, like DREAM), not leave the box
  src.addEventListener('keydown', e => { if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); document.execCommand('insertText', false, ' '); } });
  name.addEventListener('input', () => { const v = name.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8); if (v !== name.value) name.value = v; ls.set(KEY_NAME, v); });
  const goLine = n => { const ls_ = src.value.split('\n'); let a = 0; for (let i = 0; i < n - 1 && i < ls_.length; i++) a += ls_[i].length + 1; src.focus(); src.setSelectionRange(a, a + (ls_[n - 1] || '').length); const lh = parseFloat(getComputedStyle(src).lineHeight) || 24; src.scrollTop = Math.max(0, (n - 3) * lh); };
  $('#asm-ex').addEventListener('change', e => { const x = EX.find(t => t.id === e.target.value); if (!x) return; src.value = x.src.join('\n') + '\n'; name.value = x.tape; ls.set(KEY_SRC, src.value); ls.set(KEY_NAME, x.tape); gutter(); build(); reset(); e.target.value = ''; });
  // a blank page: only the start (@) and the usual ending (wait for a key, RTS); the cursor goes to the empty line between them
  $('#asm-new').addEventListener('click', () => {
    const head = '* MY PROGRAM' + '\n@ \n' + '* WRITE YOUR COMMANDS HERE. EACH ONE STARTS WITH A SPACE' + '\n';   // (גונן, 11.11: לא היה ברור איפה כותבים)
    src.value = head + '\n' + WAIT.join('\n') + '\n'; name.value = 'MYPROG'; ls.set(KEY_NAME, 'MYPROG');
    ls.set(KEY_SRC, src.value); gutter(); build(); reset(); src.focus(); src.setSelectionRange(head.length, head.length);
  });

  /* ---------------- assemble (live) ---------------- */
  let img = null;
  function build() {
    img = A.assemble(src.value);
    const errLines = new Set(img.errs.map(e => e.line));
    let html = '';
    for (const L of img.lines) {
      const t = L.text.replace(/\t/g, ' ');
      if (!t.trim()) continue;
      const by = L.bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0'));
      const bs = by.length > 8 ? by.slice(0, 8).join(' ') + ' …(' + by.length + ')' : by.join(' ');
      const ad = L.equ != null ? '=' + H4(L.equ).slice(1) : L.addr != null && (L.bytes.length || L.rmb || L.org || L.op) ? H4(L.addr).slice(1) : '';
      html += `<tr data-n="${L.n}"${L.addr != null && L.bytes.length && L.op ? ` data-a="${L.addr}"` : ''} class="${errLines.has(L.n) ? 'bad' : ''}"><td>${L.n}</td><td>${ad}</td><td>${bs}</td><td>${L.cyc || ''}</td><td>${esc(t)}</td></tr>`;
    }
    lst.innerHTML = html;
    const sum = $('#asm-sum');
    if (img.errs.length) {
      sum.textContent = '';
      errsEl.innerHTML = '<p class="fb no">⚠️ ' + tr(img.errs.length === 1 ? 'שגיאה אחת:' : img.errs.length + ' שגיאות:', img.errs.length === 1 ? 'One error:' : img.errs.length + ' errors:') + '</p><ul>' +
        img.errs.slice(0, 12).map(e => `<li><button type="button" class="asm-eline" data-n="${e.line}">${tr('בשורה', 'Line')} ${e.line}</button>: ${EN ? e.en : e.he}</li>`).join('') + '</ul>';
    } else {
      errsEl.innerHTML = '';
      sum.innerHTML = img.count ? tr(`✓ אין שגיאות · <b>${img.count}</b> בתים · מ-${LT(H4(img.start))} עד ${LT(H4(img.end - 1))} · מתחילים לרוץ ב-${LT(H4(img.entry))}`,
        `✓ No errors · <b>${img.count}</b> bytes · from ${LT(H4(img.start))} to ${LT(H4(img.end - 1))} · starts running at ${LT(H4(img.entry))}`) : tr('עוד אין כאן פקודות.', 'No commands here yet.');
    }
  }
  errsEl.addEventListener('click', e => { const b = e.target.closest('.asm-eline'); if (b) goLine(+b.dataset.n); });
  lst.addEventListener('click', e => { const r = e.target.closest('tr[data-n]'); if (r) goLine(+r.dataset.n); });

  /* ---------------- the machine in the page ---------------- */
  let mem, cpu, polls = 0, keys = [], running = false, done = false, lastLife = 0, lastT = 0, raf = 0, scrDirty = true, stopped = null;
  const sayIt = (h, cls = '') => { say.className = 'asm-say ' + cls; say.innerHTML = h; };
  const seeOnMachine = (he, en) => { throw new A.Stop('machine', he, en); };
  function read(a) {
    if (a >= 0x0400 && a < 0x8000) return mem[a];
    if (a === 0xA000 || a === 0xA001) return mem[a];
    if (a < 0x0400) seeOnMachine('התוכנית קוראת מהבית ' + LT(H4(a)) + ', באזור שבו ה-BASIC שומר את הדברים שלו. מה יש שם תלוי במחשב עצמו.', 'The program reads place ' + LT(H4(a)) + ', in the area where BASIC keeps its own things. What is there depends on the computer itself.');
    if (a >= 0xFF00) seeOnMachine('התוכנית קוראת מהחומרה (' + LT(H4(a)) + ': מקלדת, ג׳ויסטיק או צליל).', 'The program reads the hardware (' + LT(H4(a)) + ': keyboard, joystick or sound).');
    seeOnMachine('התוכנית קוראת מה-ROM (' + LT(H4(a)) + '), הזיכרון הקבוע של ה-BASIC.', 'The program reads the ROM (' + LT(H4(a)) + '), the BASIC\'s fixed memory.');
  }
  function write(a, v) {
    if (a >= 0x0400 && a < 0x8000) { if (a < 0x0600) scrDirty = true, lastLife = cpu ? cpu.r.cyc : 0; mem[a] = v; return; }
    if (a >= 0xFF20 && a <= 0xFF23) seeOnMachine('התוכנית כותבת ל-' + LT(H4(a)) + ': זה הצליל או מצב המסך (גרפיקה, כמו PMODE).', 'The program writes to ' + LT(H4(a)) + ': that is the sound or the screen mode (graphics, like PMODE).');
    if (a >= 0xFFC0 && a <= 0xFFDF) seeOnMachine('התוכנית כותבת ל-' + LT(H4(a)) + ': זה מצב המסך (גרפיקה, כמו PMODE) או מהירות המחשב.', 'The program writes to ' + LT(H4(a)) + ': that is the screen mode (graphics, like PMODE) or the computer\'s speed.');
    if (a >= 0xFF00) seeOnMachine('התוכנית כותבת לחומרה (' + LT(H4(a)) + ').', 'The program writes to the hardware (' + LT(H4(a)) + ').');
    if (a < 0x0400) seeOnMachine('התוכנית כותבת לבית ' + LT(H4(a)) + ', באזור שבו ה-BASIC שומר את הדברים שלו. במחשב זה יכול לשבש את ה-BASIC, אז כאן עוצרים.', 'The program writes to place ' + LT(H4(a)) + ', where BASIC keeps its own things. On the computer this can upset BASIC, so here we stop.');
    throw new A.Stop('error', 'התוכנית כותבת לבית ' + LT(H4(a)) + '. זה ה-ROM, זיכרון קבוע: אי אפשר לשנות בו כלום, וכנראה זו טעות בכתובת.', 'The program writes to place ' + LT(H4(a)) + '. That is the ROM, fixed memory: nothing there can change, so it is probably a wrong address.');
  }
  function reset() {
    stop(true);
    mem = new Uint8Array(65536);
    mem.fill(0x60, 0x0400, 0x0600);       // CLS
    mem[0xA000] = POLCAT >> 8; mem[0xA001] = POLCAT & 255;
    if (img && !img.errs.length) for (let a = 0; a < 65536; a++) if (img.used[a]) mem[a] = img.mem[a];
    cpu = A.cpu(read, write);
    const r = cpu.r; r.PC = img ? img.entry : FREE_LO; r.S = S0; r.CC = 0x50;
    mem[S0] = RET >> 8; mem[S0 + 1] = RET & 255; r.S = S0;
    polls = 0; keys = []; done = false; stopped = null; lastLife = 0; scrDirty = true;
    sendBtn.classList.remove('hot');
    draw(); paintCpu(); markPC();
    if (img && !img.errs.length && img.count) sayIt(tr('מוכן. ▶ מריץ את כל התוכנית, ו"צעד" מריץ פקודה אחת.', 'Ready. ▶ runs the whole program, and "Step" runs one command.'));
    else sayIt('');
  }
  // one command, with the places the page handles itself: the keyboard check, the return to BASIC, the ROM
  function one() {
    const r = cpu.r, pc = r.PC;
    if (pc === RET) { done = true; return 'done'; }
    if (pc === POLCAT) {
      polls++; lastLife = r.cyc;
      const k = keys.length ? keys.shift() : 0;
      r.A = k; r.CC = (r.CC & ~0x0E) | (k ? 0 : 4) | (k & 0x80 ? 8 : 0);
      r.PC = (mem[r.S] << 8) | mem[(r.S + 1) & 0xFFFF]; r.S = (r.S + 2) & 0xFFFF;
      r.cyc += POLL_CYC + 5; r.steps++;
      return 'key';
    }
    if (pc >= 0x8000) seeOnMachine('התוכנית קופצת ל-' + LT(H4(pc)) + ', לתוך ה-ROM של ה-BASIC. כאן בדף יש רק את בודק המקלדת (' + LT('JSR [$A000]') + ').', 'The program jumps to ' + LT(H4(pc)) + ', into the BASIC ROM. This page has only the keyboard check (' + LT('JSR [$A000]') + ').');
    if (!img.used[pc]) throw new A.Stop('error', 'המעבד קפץ לבית ' + LT(H4(pc)) + ', ושם אין פקודות של התוכנית. בדראגון הוא היה קורא את מה שיש שם כאילו היו פקודות, ובדרך כלל נתקע.', 'The processor jumped to ' + LT(H4(pc)) + ', and there are no commands of the program there. On the Dragon it would read whatever is there as commands, and usually hang.');
    const info = cpu.step();
    if (r.S < 0x0600 || (r.S >= img.start && r.S < img.end && info.op.startsWith('P'))) throw new A.Stop('error', 'הערימה (S) הגיעה ל-' + LT(H4(r.S)) + ' ודורכת על ' + (r.S < 0x0600 ? 'המסך וזיכרון ה-BASIC' : 'התוכנית עצמה') + '. אולי יותר מדי ' + LT('PSHS') + ' או ' + LT('JSR') + ' בלי ' + LT('RTS') + '?', 'The stack (S) reached ' + LT(H4(r.S)) + ' and is stepping on ' + (r.S < 0x0600 ? 'the screen and BASIC\'s memory' : 'the program itself') + '. Too many ' + LT('PSHS') + ' or ' + LT('JSR') + ' without ' + LT('RTS') + '?');
    return info;
  }
  function fail(e) {
    if (!(e instanceof A.Stop)) throw e;
    stopped = e; running = false; runBtn.textContent = '▶ ' + tr('הרץ', 'Run');
    if (e.kind === 'machine') {
      sendBtn.classList.add('hot');
      sayIt('<b>' + tr('את זה רואים במכונה.', 'You see this on the machine.') + '</b> ' + (EN ? e.en : e.he) + ' ' + tr('הדף הזה מראה רק את מסך הטקסט, את הזיכרון ואת המקלדת. שלחו את התוכנית למכונת הדראגון בכפתור 🐉, ושם היא תרוץ באמת.', 'This page shows only the text screen, the memory and the keyboard. Send the program to the Dragon machine with the 🐉 button, and it will really run there.'), 'machine');
    } else sayIt('⚠️ ' + (EN ? e.en : e.he), 'bad');
  }
  function finish() {
    running = false; runBtn.textContent = '▶ ' + tr('הרץ', 'Run');
    sayIt(tr(`✓ התוכנית חזרה ל-BASIC (‏${LT('RTS')}). במחשב היה מופיע עכשיו ${LT('OK')}. ${(cpu.r.cyc / CLK).toFixed(2)} שניות של דראגון, ${cpu.r.steps.toLocaleString()} פקודות.`,
      `✓ The program went back to BASIC (${LT('RTS')}). On the computer ${LT('OK')} would appear now. ${(cpu.r.cyc / CLK).toFixed(2)} Dragon seconds, ${cpu.r.steps.toLocaleString()} commands.`), 'ok');
  }
  function ready() {
    if (!img || img.errs.length) { sayIt('⚠️ ' + tr('קודם מתקנים את השגיאות שבתוכנית.', 'First fix the errors in the program.'), 'bad'); return false; }
    if (!img.count) { sayIt(tr('עוד אין כאן פקודות.', 'No commands here yet.')); return false; }
    if (done || stopped) reset();
    return true;
  }
  function frame() {
    raf = 0;
    if (!running) return;
    // the Dragon's real speed: as many cycles as the time since the last picture (at most 1/20 s, so a slow phone doesn't jump)
    const now = performance.now(), dt = Math.min(50, Math.max(1, now - (lastT || now - 16)));
    lastT = now;
    const r = cpu.r, budget = r.cyc + CLK * dt / 1000;
    try {
      while (r.cyc < budget) {
        if (one() === 'done') { draw(); paintCpu(); markPC(); finish(); return; }
        if (r.cyc - lastLife > 30 * CLK) throw new A.Stop('error', 'התוכנית רצה 30 שניות של דראגון בלי לשנות את המסך ובלי לבדוק מקשים. אולי לולאה בלי סוף?', 'The program ran for 30 Dragon seconds without changing the screen or checking the keys. Maybe a loop without end?');
        if (r.cyc > 600 * CLK) throw new A.Stop('error', 'עשר דקות של דראגון. עוצרים כאן.', 'Ten Dragon minutes. Stopping here.');
      }
    } catch (e) { fail(e); }
    draw(); paintCpu(); markPC();
    if (running) raf = requestAnimationFrame(frame);
  }
  function stop(quiet) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; runBtn.textContent = '▶ ' + tr('הרץ', 'Run'); if (!quiet && cpu) { paintCpu(); markPC(); sayIt(tr('עצרתם. ▶ ממשיך מאותו מקום, ו"צעד" מריץ פקודה אחת.', 'Stopped. ▶ goes on from the same place, and "Step" runs one command.')); } }
  runBtn.addEventListener('click', () => {
    if (running) { stop(); return; }
    if (!ready()) return;
    running = true; runBtn.textContent = '■ ' + tr('עצור', 'Stop');
    sayIt(tr('רץ… מקשים: לחצו על המסך והקלידו, או השתמשו בכפתורים שמתחתיו.', 'Running… Keys: click the screen and type, or use the buttons under it.'));
    $('#asm-scr').focus({ preventScroll: true });
    lastLife = cpu.r.cyc; lastT = 0;
    raf = requestAnimationFrame(frame);
  });
  $('#asm-step').addEventListener('click', () => {
    if (running) stop(true);
    if (!ready()) return;
    try {
      const info = one();
      if (info === 'done') { finish(); }
      else if (info === 'key') sayIt(tr(`בודק המקלדת: ${cpu.r.A ? 'נלחץ מקש, ו-A = ' + LT(H2(cpu.r.A)) : 'אין מקש, אז A = 0 ונורת Z דולקת'}. חוזרים לתוכנית.`, `The keyboard check: ${cpu.r.A ? 'a key was pressed, and A = ' + LT(H2(cpu.r.A)) : 'no key, so A = 0 and the Z lamp is on'}. Back to the program.`));
      else sayIt(tr('ביצענו: ', 'Done: ') + LT(lineAt(info.pc) || info.op) + ' · ' + info.cyc + ' ' + tr('מחזורים', 'cycles') + (info.taken === false ? ' · ' + tr('לא קופצים', 'no jump') : info.taken ? ' · ' + tr('קופצים', 'jump') : ''));
    } catch (e) { fail(e); }
    draw(); paintCpu(); markPC();
  });
  $('#asm-reset').addEventListener('click', () => { build(); reset(); });
  const lineAt = a => { const L = img.lines.find(l => l.addr === a && l.op); return L ? L.text.trim().replace(/\s+\*.*$/, '') : null; };

  /* keys: the screen takes the keyboard while it has the focus; the buttons below it work on a phone */
  const KEYMAP = { ArrowLeft: 8, ArrowRight: 9, ArrowUp: 94, ArrowDown: 10, Enter: 13, Escape: 3, Backspace: 8, ' ': 32 };
  $('#asm-scr').addEventListener('keydown', e => {
    let k = KEYMAP[e.key];
    if (k == null && e.key.length === 1) { const c = e.key.toUpperCase().charCodeAt(0); if (c >= 32 && c < 96) k = c; }
    if (k == null || e.metaKey || e.ctrlKey || e.altKey) return;
    e.preventDefault(); if (keys.length < 8) keys.push(k);
  });
  $('#asm-keys').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b && keys.length < 8) keys.push(+b.dataset.k); });

  /* ---------------- pictures: the screen, the drawers, the lamps ---------------- */
  function draw() {
    if (!scrDirty && running) return;
    scrDirty = false;
    for (let i = 0; i < 512; i++) drawCode(ctx, mem[0x400 + i], (i % 32) * 8, Math.floor(i / 32) * 12, 8, 12);
  }
  const cpuBox = $('#asm-cpu');
  let last = {};
  function paintCpu() {
    const r = cpu.r, D = (r.A << 8) | r.B;
    const regs = [['A', H2(r.A)], ['B', H2(r.B)], ['D', H4(D)], ['X', H4(r.X)], ['Y', H4(r.Y)], ['U', H4(r.U)], ['S', H4(r.S)], ['PC', H4(r.PC)], ['DP', H2(r.DP)]];
    const lamps = [['C', 1, tr('נשא', 'carry')], ['Z', 4, tr('אפס', 'zero')], ['N', 8, tr('שלילי', 'negative')], ['V', 2, tr('גלישה', 'overflow')], ['H', 32, tr('חצי נשא', 'half carry')], ['I', 16, 'IRQ'], ['F', 64, 'FIRQ'], ['E', 128, tr('הכול', 'entire')]];
    cpuBox.innerHTML = '<div class="asm-regs" dir="ltr">' + regs.map(([n, v]) => `<div class="asm-reg${last[n] !== undefined && last[n] !== v ? ' chg' : ''}"><b>${n}</b><span>${v}</span></div>`).join('') + '</div>' +
      '<div class="asm-lamps" dir="ltr">' + lamps.map(([n, bit, t], i) => `<span class="asm-lamp${r.CC & bit ? ' on' : ''}${i > 3 ? ' small' : ''}" title="${t}"><i></i>${n}</span>`).join('') +
      `<span class="asm-cyc">${tr('מחזורים', 'cycles')}: ${r.cyc.toLocaleString()} · ${(r.cyc / CLK).toFixed(3)} ${tr('שנ׳', 's')}</span></div>`;
    last = Object.fromEntries(regs);
  }
  function markPC() {
    const pc = cpu ? cpu.r.PC : -1;
    lst.querySelectorAll('tr.pc').forEach(t => t.classList.remove('pc'));
    const row = lst.querySelector(`tr[data-a="${pc}"]`);
    if (row) { row.classList.add('pc'); if (!running) { const box = row.closest('.asm-lst'); const t = row.offsetTop - box.clientHeight / 2; box.scrollTop = Math.max(0, t); } }
  }

  /* ---------------- send to the Dragon machine (the course's send code, shared.js) ---------------- */
  sendImg = g => g.img;   // shared.js's sendTape asks sendImg for {errs, mem, start, end, entry}: here it is our own translation
  sendBtn.addEventListener('click', () => {
    const out = $('#asm-sendsay');
    out.hidden = false;
    build();
    if (img.errs.length) { out.innerHTML = '⚠️ ' + tr('קודם מתקנים את השגיאות שבתוכנית.', 'First fix the errors in the program.'); return; }
    if (!img.count) { out.innerHTML = tr('עוד אין כאן פקודות.', 'No commands here yet.'); return; }
    const nm = (name.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    if (!nm) { out.innerHTML = tr('כתבו שם לקלטת: אותיות באנגלית וספרות, עד 8.', 'Write a name for the tape: English letters and digits, up to 8.'); name.focus(); return; }
    const size = img.end - img.start;
    if (img.start < FREE_LO || img.end > FREE_HI) {
      out.innerHTML = '⚠️ ' + tr(`התוכנית תופסת את הבתים ${LT(H4(img.start))} עד ${LT(H4(img.end - 1))} (${size} בתים). במכונה, המקום הפנוי לתוכנית הוא מ-${LT('$2EE1')} עד ${LT('$7DFF')} (כ-20,000 בתים). מתחת ל-${LT('$2EE1')} יושבים המסך וה-BASIC, ומעל ${LT('$7DFF')} הערימה של ה-BASIC. ${img.start < FREE_LO ? 'שנו את ה-' + LT('ORG') + ', או מחקו אותו (בלי ORG מתחילים ב-' + LT('$2EE1') + ').' : 'קצרו את התוכנית או את ה-' + LT('RMB') + '.'}`,
        `The program takes places ${LT(H4(img.start))} to ${LT(H4(img.end - 1))} (${size} bytes). On the machine, the free room for a program is ${LT('$2EE1')} to ${LT('$7DFF')} (about 20,000 bytes). Below ${LT('$2EE1')} live the screen and BASIC, and above ${LT('$7DFF')} BASIC's stack. ${img.start < FREE_LO ? 'Change the ' + LT('ORG') + ', or delete it (with no ORG the program starts at ' + LT('$2EE1') + ').' : 'Make the program or its ' + LT('RMB') + ' shorter.'}`);
      return;
    }
    sendTape(nm, { img }, out);
    // the course's last step speaks of its fixed ending; here the program is free, so say what RTS does
    const li = out.querySelectorAll('ol li');
    if (li.length === 4) li[3].innerHTML = tr(`כשהתוכנית מגיעה ל-${LT('RTS')} האחרון, ה-BASIC חוזר ומופיע ${LT('OK')}.`, `When the program reaches its last ${LT('RTS')}, BASIC comes back with ${LT('OK')}.`);
    if (!img.lines.some(L => L.op === 'RTS' || L.op === 'PULS' && /PC/i.test(L.text))) out.insertAdjacentHTML('afterbegin', '<p>⚠️ ' + tr(`אין בתוכנית ${LT('RTS')}. בלי ${LT('RTS')} היא לא תחזור ל-BASIC, והמחשב עלול להיתקע. (בעזרה למטה: איך חוזרים.)`, `The program has no ${LT('RTS')}. Without ${LT('RTS')} it won't go back to BASIC, and the computer may hang. (See the help below: how to go back.)`) + '</p>');
  });

  gutter(); build(); reset();
  window.__asm = { get img() { return img; }, get cpu() { return cpu; }, mem: () => mem, EX };
})();
