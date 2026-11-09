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
    now.li.classList.remove('playing'); now.li.querySelector('.p').textContent = '▶';
    now = null;
  }
  document.addEventListener('click', async e => {
    const b = e.target.closest('.real-list button');
    if (!b) return;
    const li = b.closest('li'), id = li.dataset.id;
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
    li.classList.add('playing'); b.textContent = '■'; tick();
    try { await audio.play(); } catch (e) { stop(); }
  });
})();
