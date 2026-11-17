// קלטת Dragon לצליל (wav), בדפדפן: אותם בתים שה-ROM מקליט, בצליל שה-Dragon טוען מהרשמקול (29.10, 9.11).
// משותף למכונה ("הקלטות שלי") ולדף ההורדות ל-Dragon אמיתי. window.D32Wav = { segWav, casWav }
(() => {
  // קלטת מהמדף (קובץ .cas) לצליל ל-Dragon אמיתי (גונן, 9.11): אותם בתים בדיוק. אחרי בלוק השם (15 בתים) של קובץ עם הפסקות,
  // חצי שנייה שקט כמו רשמקול שעוצר ומתניע, ושאר הקלטת ברצף, כמו שהיא (גם טוענים מיוחדים ונתונים לא רגילים עוברים בלי שינוי)
  const EXTRA = new Uint8Array(215).fill(0x55);   // כ-1.2 שניות של מבוא נוסף
  function casWav(cas, noGap) {
    const segs = [['quiet', 0.5]];
    if (noGap) return segWav(segs.concat([['bytes', cas]]));
    // רק בקלטות שבהן כמעט כל בלוק בא עם מבוא משלו (טוען שעוצר את המנוע בין בלוקים): 10 ומעלה. בשאר הקלטות לא משנים כלום,
    // גם לא בכמה בלוקים בודדים (Manic Miner, ‏Cuthbert ו-The King כבר נבדקו ב-Dragon אמיתי כמו שהם)
    let inner = 0;
    for (let k = 21; k < cas.length - 1; k++) if (cas[k] === 0x55 && cas[k + 1] === 0x3C && cas[k - 20] === 0x55 && cas[k - 1] === 0x55) { let z = k - 1; while (z > 0 && cas[z] === 0x55) z--; if (cas[z] !== 0x55 && k - 1 - z >= 20) inner++; }
    const pad = inner >= 10;
    let from = 0, i = 0;
    while (i < cas.length - 4) {
      if (cas[i] === 0x55 && cas[i + 1] === 0x3C) {
        const type = cas[i + 2], len = cas[i + 3], end = i + 4 + len + 1;
        if (end > cas.length) break;
        // השקט רק בקובץ שהכותרת שלו מסמנת הפסקות (gap): בקובץ רציף ה-ROM לא מצפה לשקט, ושקט שם מקלקל את הטעינה (The Count, 9.11)
        if (type === 0 && len === 15 && cas[i + 4 + 10]) { segs.push(['bytes', cas.subarray(from, end)], ['quiet', 0.5]); from = end; }
        // בלוק עם מבוא משלו באמצע קובץ (Downland, ‏17.11): הטוען מכבה את המנוע אחרי כל בלוק ומדליק אותו לפני הבא (הטיקים של הממסר).
        // ברשמקול הקלטת נעצרת וממתינה; צליל מהמק או מהטלפון ממשיך לרוץ, וה-Dragon, שמחכה כחצי שנייה אחרי שהמנוע נדלק,
        // פספס את רוב המבוא הקצר (כ-0.7 שניות). לכן מוסיפים לפניו עוד מבוא ($55, שה-Dragon מדלג עליו ממילא): הבתים עצמם לא משתנים
        else if (pad && i > 0) {
          let lead = i;
          while (lead > from && cas[lead - 1] === 0x55) lead--;
          if (i - lead >= 20) { segs.push(['bytes', cas.subarray(from, lead)], ['bytes', EXTRA]); from = lead; }
        }
        i = end;
      } else i++;
    }
    segs.push(['bytes', cas.subarray(from)]);
    return segWav(segs);
  }
  function segWav(segs) {
    const RATE = 44100, CPU = 894886, AMP = 86;
    segs = segs.concat([['quiet', 0.1]]);
    const out = [];
    let t = 0;
    const quiet = sec => { const end = Math.round((t + sec) * RATE); while (out.length < end) out.push(128); t += sec; };
    const bit = one => {
      const len = (one ? 435 : 813) / CPU, from = Math.round(t * RATE), to = Math.round((t + len) * RATE);
      for (let s = from; s < to; s++) out.push(Math.round(128 + AMP * Math.sin(2 * Math.PI * ((s / RATE - t) / len))));
      t += len;
    };
    for (const [kind, v] of segs) {
      if (kind === 'quiet') quiet(v);
      else for (const byte of v) for (let i = 0; i < 8; i++) bit((byte >> i) & 1);
    }
    const head = new DataView(new ArrayBuffer(44)), txt = (o, str) => { for (let i = 0; i < 4; i++) head.setUint8(o + i, str.charCodeAt(i)); };
    txt(0, 'RIFF'); head.setUint32(4, 36 + out.length, true); txt(8, 'WAVE'); txt(12, 'fmt ');
    head.setUint32(16, 16, true); head.setUint16(20, 1, true); head.setUint16(22, 1, true);
    head.setUint32(24, RATE, true); head.setUint32(28, RATE, true); head.setUint16(32, 1, true); head.setUint16(34, 8, true);
    txt(36, 'data'); head.setUint32(40, out.length, true);
    const wav = new Uint8Array(44 + out.length);
    wav.set(new Uint8Array(head.buffer), 0); wav.set(out, 44);
    return wav;
  }
  window.D32Wav = { segWav, casWav };
  window.d32CasWav = casWav;
})();
