// מודל הצליל, נכתב מהמפרט בלבד (docs/DRAGON-SPEC-SOUND.md), בלי לראות את ה-ROM.
// כל גל: ארבע כתיבות ל-$FF20, ולכל אחת כמה מחזורי מעבד עד הכתיבה הבאה (בלי פסיקת השדה).

// SOUND (סעיף 1.3): N = 256 פחות הטון
export function soundWave(tone) {
  const n = 256 - tone;
  return [
    { v: 0x7c, cycles: 23 + 5 * n },
    { v: 0xfc, cycles: 23 + 5 * n },
    { v: 0x7c, cycles: 23 + 5 * n },
    { v: 0x00, cycles: 31 + 5 * n },
  ];
}
export const soundPeriod = tone => 100 + 20 * (256 - tone);
// משך (סעיף 1.4): 4 שדות לכל יחידה; השבר נחתך
export const soundFields = d => 4 * Math.trunc(d);
// שגיאות (סעיף 1.1): טווח 1-255 אחרי חיתוך; שלילי תמיד ?FC
export function soundArgOk(x) {
  if (x < 0) return false;
  const t = Math.trunc(x);
  return t >= 1 && t <= 255;
}
