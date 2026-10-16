// הצלילים של ה-Dragon: צפצוף מרובע (SOUND) והרעש של קלטת שנטענת. בלי צליל, הכול ממשיך לעבוד.
export function createSound() {
  let audio = null;

  function ctx() {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    return audio;
  }

  // SOUND 1..255, משך ביחידות של 1/16 שנייה (בערך כמו במקור)
  function beep(tone, dur) {
    try {
      const a = ctx(), o = a.createOscillator(), g = a.createGain();
      o.type = 'square';
      o.frequency.value = 110 * Math.pow(2, Math.max(1, Math.min(255, tone)) / 48);
      g.gain.value = 0.05;
      o.connect(g); g.connect(a.destination);
      o.start(); o.stop(a.currentTime + Math.min(Math.max(dur, 1), 64) / 16);
    } catch (e) { /* בלי צליל, זה בסדר */ }
  }

  // ציוצים מהירים בשני גבהים, כמו הביטים על סרט הקלטת
  function tapeNoise(seconds) {
    try {
      const a = ctx(), o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
      o.type = 'square';
      g.gain.value = 0.035;
      o.frequency.setValueAtTime(1200, t);
      for (let x = 0.6; x < seconds; x += 1 / 120) o.frequency.setValueAtTime(Math.random() < 0.5 ? 1200 : 2400, t + x);
      o.connect(g); g.connect(a.destination);
      o.start(t); o.stop(t + seconds);
    } catch (e) { /* בלי צליל, זה בסדר */ }
  }

  // צליל בתדר מדויק (למשחקי המחסניות): freq בהרץ, ms באלפיות שנייה. slideTo: גלישה לתדר אחר.
  function tone(freq, ms, slideTo, vol = 0.05) {
    try {
      const a = ctx(), o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
      o.type = 'square';
      o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.linearRampToValueAtTime(slideTo, t + ms / 1000);
      g.gain.setValueAtTime(vol, t);
      g.gain.linearRampToValueAtTime(0, t + ms / 1000);
      o.connect(g); g.connect(a.destination);
      o.start(t); o.stop(t + ms / 1000);
    } catch (e) { /* בלי צליל, זה בסדר */ }
  }

  // רעש לבן קצר: פיצוץ, נפילה, התנגשות
  function noise(ms, vol = 0.06) {
    try {
      const a = ctx(), len = Math.floor(a.sampleRate * ms / 1000), buf = a.createBuffer(1, len, a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = a.createBufferSource(), g = a.createGain();
      src.buffer = buf; g.gain.value = vol;
      src.connect(g); g.connect(a.destination);
      src.start();
    } catch (e) { /* בלי צליל, זה בסדר */ }
  }

  // תו של PLAY: מתוזמן מראש על השעון של הצליל. at = בעוד כמה שניות מתחיל, dur = כמה שניות
  let notes = [];
  function note(freq, at, dur, vol = 0.05) {
    try {
      const a = ctx(), o = a.createOscillator(), g = a.createGain(), t = a.currentTime + at;
      o.type = 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.setValueAtTime(0, t + dur * 0.92);   // רווח קטן בין תווים, כדי ששני תווים זהים לא יתמזגו
      o.connect(g); g.connect(a.destination);
      o.start(t); o.stop(t + dur);
      notes.push(o);
      o.onended = () => { notes = notes.filter(n => n !== o); };
    } catch (e) { /* בלי צליל, זה בסדר */ }
  }
  // BREAK באמצע מנגינה: משתיקים את כל התווים שעוד מחכים
  function hush() { notes.forEach(o => { try { o.stop(); } catch (e) { /* כבר נעצר */ } }); notes = []; }

  return { beep, tapeNoise, tone, noise, note, hush };
}
