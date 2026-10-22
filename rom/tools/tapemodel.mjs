// מודל הקלטת, נכתב מהמפרט בלבד (docs/DRAGON-SPEC-TAPE.md), בלי לראות את ה-ROM.

// טבלת הסינוס (1.3)
export const TSIN = [0x80, 0x90, 0xa8, 0xb8, 0xc8, 0xd8, 0xe8, 0xf0, 0xf8, 0xf8, 0xf8, 0xf0, 0xe8, 0xd8, 0xc8, 0xb8, 0xa8, 0x90,
  0x78, 0x68, 0x50, 0x40, 0x30, 0x20, 0x10, 0x08, 0x00, 0x00, 0x00, 0x08, 0x10, 0x20, 0x30, 0x40, 0x50, 0x68];

// התוספת לביט האחרון של בית, לפי הגבול שאחריו (1.3)
export const EXTRA = { leader: 31, syncA: 33, sync: 35, type: 35, len: 42, lenEmpty: 40, data: 46, lastData: 44, csum: 26 };

// writeBytes: הכתיבות ל-$FF20 של רצף בתים. items = [{ b, extra }] (extra = null: הזמן אחרי הבית לא ידוע).
// מחזיר [{ v, after }] — after = כמה מחזורים עד הכתיבה הבאה (null אם לא ידוע), והערך השמור בסוף
export function writeBytes(items, held = 0) {
  const out = [];
  for (const { b, extra } of items) {
    for (let k = 0; k < 8; k++) {
      const bit = (b >> k) & 1;
      const idx = bit ? Array.from({ length: 17 }, (_, i) => 2 * i) : Array.from({ length: 35 }, (_, i) => i);
      const [first, mid, last] = bit ? [27, 23, 40] : [26, 22, 39];
      out.push({ v: held, after: first });
      idx.forEach((i, j) => out.push({ v: TSIN[i], after: j === idx.length - 1 ? last : mid }));
      held = TSIN[bit ? 34 : 35];
      if (k === 7) out[out.length - 1].after = extra === null ? null : last + extra;
    }
  }
  return { writes: out, held };
}

// בלוק (2.1): $55 $3C סוג אורך נתונים סכום $55
export function blockBytes(type, data) {
  let sum = type + data.length;
  for (const d of data) sum += d;
  return [0x55, 0x3c, type, data.length, ...data, sum & 255, 0x55];
}
// הגבולות שאחרי כל בית בבלוק, כפי שכותב הבלוק מייצר אותם
export function blockItems(type, data) {
  const bytes = blockBytes(type, data);
  return bytes.map((b, i) => {
    let extra;
    if (i === 0) extra = EXTRA.syncA;
    else if (i === 1) extra = EXTRA.sync;
    else if (i === 2) extra = EXTRA.type;
    else if (i === 3) extra = data.length ? EXTRA.len : EXTRA.lenEmpty;
    else if (i < 4 + data.length) extra = i === 3 + data.length ? EXTRA.lastData : EXTRA.data;
    else if (i === 4 + data.length) extra = EXTRA.csum;
    else extra = null;
    return { b, extra };
  });
}
// צפצוף + בלוק, כמו "כתיבת בלוק" המלאה: המבוא, ואחריו הבלוק (הזמן ביניהם — חישוב הסכום — לא נבדק)
export function leaderAndBlock(n, type, data, held = 0) {
  const items = Array.from({ length: n }, (_, i) => ({ b: 0x55, extra: i === n - 1 ? null : EXTRA.leader }));
  return writeBytes(items.concat(blockItems(type, data)), held);
}

// קובץ CAS: מבוא של n בתים ואחריו הבלוק
export const casBlock = (n, type, data) => [...new Array(n).fill(0x55), ...blockBytes(type, data)];
