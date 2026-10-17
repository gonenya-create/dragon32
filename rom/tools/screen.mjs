// מריץ את ה-ROM שלנו ב-XRoar (בלי חלון), וקורא את מסך הטקסט ($0400-$05FF) דרך ממשק GDB של XRoar.
// שימוש: node rom/tools/screen.mjs [rom] [שניות] [שורות להקלדה, מופרדות ב-|]
// ההקלדה: כותבים את התווים לתור קלט בזיכרון (KEYQ), שה-ROM קורא כאילו נלחצו מקשים. כך אפשר לבדוק בלי מקלדת.
import { spawn } from 'node:child_process';
import net from 'node:net';

const [rom = 'rom/build/d32.rom', secs = '1', typed = ''] = process.argv.slice(2);
export const KEYQ = 0x0100;   // תור הקלט: [אורך][תווים...] (חייב להתאים ל-boot.s)
// פורט מחוץ לטווח הזמני של macOS (49152-65535), שם תוכנות אחרות כבר מאזינות לפעמים
const port = 21000 + Math.floor(Math.random() * 4000);
const xr = spawn('xroar', ['-ui', 'null', '-ao', 'null', '-machine', 'dragon32', '-extbas', rom, '-no-ratelimit', '-gdb', '-gdb-port', String(port)], { stdio: ['ignore', 'ignore', 'pipe'] });
let err = '';
xr.stderr.on('data', d => { err += d; });
const die = (msg, code = 1) => { if (msg) console.error(msg); try { xr.kill('SIGKILL'); } catch { /* */ } process.exit(code); };
setTimeout(() => die('watchdog\n' + err.slice(-300), 2), 20000).unref();
const sleep = ms => new Promise(r => setTimeout(r, ms));

function connect() {
  return new Promise((ok, bad) => {
    const s = net.connect(port, '127.0.0.1');
    let buf = '';
    const waiters = [];
    s.on('data', d => {
      buf += d.toString('latin1'); if (process.env.GDBLOG) console.error('<<', JSON.stringify(d.toString('latin1')));
      buf = buf.replace(/^\++/, '');
      for (;;) {
        const m = /\$([^#]*)#[0-9a-fA-F]{2}/.exec(buf);
        if (!m) break;
        buf = buf.slice(m.index + m[0].length);
        s.write('+');
        const w = waiters.shift();
        if (w) w(m[1]);
      }
    });
    const send = c => { if (process.env.GDBLOG) console.error('>>', JSON.stringify(c)); let sum = 0; for (const ch of c) sum = (sum + ch.charCodeAt(0)) & 255; s.write('$' + c + '#' + sum.toString(16).padStart(2, '0')); };
    const reply = () => new Promise((r, j) => { waiters.push(r); setTimeout(() => j(new Error('no reply')), 4000); });
    const api = {
      cmd: c => { const p = reply(); send(c); return p.catch(e => { throw new Error(e.message + ' to ' + c.slice(0, 8)); }); },
      go: () => { send('c'); },                         // התשובה תגיע רק בעצירה
      // עצירה: Ctrl-C גולמי. לפעמים XRoar מפספס אותו, אז שולחים שוב כל חצי שנייה עד שעונה
      halt: () => { const p = reply(); s.write('\x03'); const t = setInterval(() => s.write('\x03'), 500); return p.finally(() => clearInterval(t)).catch(e => { throw new Error(e.message + ' to halt'); }); },
      close: () => s.destroy()
    };
    s.on('connect', () => ok(api));
    s.on('error', bad);
  });
}

let g = null;
// XRoar פותח את הפורט מוקדם, אבל עונה רק אחרי שהמחשב המדומה מוכן: מחכים קצת קודם
await sleep(700);
for (let i = 0; i < 60 && !g; i++) { g = await connect().catch(() => null); if (!g) await sleep(100); }
if (!g) die('cannot connect to xroar gdb\n' + err);
try {
  await g.cmd('?');
  const lines = typed ? typed.split('|') : [];
  g.go();
  await sleep(400);   // אתחול
  for (const line of lines) {
    // עוצרים, כותבים שורה לתור הקלט, וממשיכים
    await g.halt();
    const bytes = [...(line + '\r')].map(c => c.charCodeAt(0));
    const hex = [bytes.length, ...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
    await g.cmd(`M${KEYQ.toString(16)},${bytes.length + 1}:${hex}`);
    g.go();
    await sleep(300);
  }
  await sleep(+secs * 1000);
  await g.halt();
  if (process.env.REGS) console.log('regs', await g.cmd('g'));
  const hex = await g.cmd('m400,200');
  const bytes = hex.match(/../g).map(h => parseInt(h, 16));
  const ch = b => { const c = b & 0x3f; const asc = c < 0x20 ? c + 0x40 : c; return b & 0x40 ? String.fromCharCode(asc) : String.fromCharCode(asc).toLowerCase(); };
  const rows = [];
  for (let r = 0; r < 16; r++) rows.push(bytes.slice(r * 32, r * 32 + 32).map(ch).join('').replace(/\s+$/, ''));
  console.log(rows.join('\n').replace(/\n+$/, ''));
} catch (e) { die(e.message + '\n' + err.slice(-300)); }
g.close();
die('', 0);
