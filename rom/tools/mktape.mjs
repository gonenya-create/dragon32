// קלטת בדיקה ל-Dragon 32 אמיתי: תוכניות BASIC בטקסט → קובץ CAS וקובץ WAV שאפשר להשמיע מהמק לכניסת הקלטת.
// כל תוכנית נשמרת כקובץ BASIC בטקסט (ASCII), כמו CSAVE "שם",A, כך שעל המחשב מקלידים CLOAD "שם" ואז RUN.
// הפורמט (בלוקים, כותרת, סיביות של 1200/2400 הרץ, הסיבית הנמוכה ראשונה) לפי הספרים, ראו docs/DRAGON-SPEC-VERIFY.md.
// שימוש: node rom/tools/mktape.mjs out.wav NAME1=file1.bas [NAME2=file2.bas ...]   (נוצר גם out.cas)
import { readFileSync, writeFileSync } from 'node:fs';

const RATE = 44100;
const LEADER = 128;            // Dragon 32 לפי Inside the Dragon (ב-Dragon 64: 256)

function block(type, data) {
  let sum = type + data.length;
  for (const b of data) sum += b;
  return [0x55, 0x3c, type, data.length, ...data, sum & 255, 0x55];
}
const leader = () => new Array(LEADER).fill(0x55);

// קובץ אחד: מבוא, כותרת, ואז בלוקי נתונים עם מבוא לפני כל אחד (קובץ ASCII נשמר "עם פערים")
function file(name, text) {
  const hdr = [...name.toUpperCase().padEnd(8).slice(0, 8)].map(c => c.charCodeAt(0)).concat([0, 0xff, 0xff, 0, 0, 0, 0]);
  const data = [...text.replace(/\r?\n/g, '\r').replace(/\r?$/, '\r')].map(c => c.charCodeAt(0) & 127);
  const parts = [{ bytes: leader().concat(block(0, hdr)), pause: 0.5 }];
  for (let i = 0; i < data.length; i += 255) parts.push({ bytes: leader().concat(block(1, data.slice(i, i + 255))), pause: 0.5 });
  parts.push({ bytes: leader().concat(block(0xff, [])), pause: 2 });
  return parts;
}

// סיבית 0 = מחזור אחד של 1200 הרץ, סיבית 1 = מחזור של 2400 הרץ (גל סינוס, 8 ביט)
function wav(parts) {
  const out = [];
  const silence = s => { for (let i = 0; i < RATE * s; i++) out.push(128); };
  const cycle = hz => { const n = Math.round(RATE / hz); for (let i = 0; i < n; i++) out.push(128 + Math.round(100 * Math.sin(2 * Math.PI * i / n))); };
  silence(1);
  for (const p of parts) {
    for (const b of p.bytes) for (let k = 0; k < 8; k++) cycle((b >> k) & 1 ? 2400 : 1200);
    silence(p.pause);
  }
  const body = Buffer.from(out);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + body.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24); h.writeUInt32LE(RATE, 28); h.writeUInt16LE(1, 32); h.writeUInt16LE(8, 34);
  h.write('data', 36); h.writeUInt32LE(body.length, 40);
  return Buffer.concat([h, body]);
}

const [outWav, ...specs] = process.argv.slice(2);
if (!outWav || !specs.length) { console.error('usage: node mktape.mjs out.wav NAME=file.bas ...'); process.exit(1); }
const parts = specs.flatMap(s => { const [n, f] = s.split('='); return file(n, readFileSync(f, 'utf8')); });
writeFileSync(outWav.replace(/\.wav$/, '') + '.cas', Buffer.from(parts.flatMap(p => p.bytes)));
writeFileSync(outWav, wav(parts));
console.log(`${specs.length} programs → ${outWav} (${(parts.length)} blocks)`);
