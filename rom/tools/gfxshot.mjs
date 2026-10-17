// קורא זיכרון גרפי ו-PIA דרך GDB. עם GFX_ACTIVE עוצר לפני החזרה לטקסט.
// שימוש: node rom/tools/gfxshot.mjs [rom] [שניות] [שורות להקלדה, מופרדות ב-|]
// ההקלדה: כותבים את התווים לתור קלט בזיכרון (KEYQ), שה-ROM קורא כאילו נלחצו מקשים. כך אפשר לבדוק בלי מקלדת.
import { spawn } from 'node:child_process';
import net from 'node:net';
import { readFileSync } from 'node:fs';

const [rom = 'rom/build/d32.rom', secs = '1', typed = ''] = process.argv.slice(2);
export const KEYQ = 0x0100;   // תור הקלט: [אורך][תווים...] (חייב להתאים ל-boot.s)
const port = 65000 + Math.floor(Math.random() * 400);
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
      buf += d.toString('latin1');
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
    const send = c => { let sum = 0; for (const ch of c) sum = (sum + ch.charCodeAt(0)) & 255; s.write('$' + c + '#' + sum.toString(16).padStart(2, '0')); };
    const reply = () => new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('no reply')), 4000);
      waiters.push(value => { clearTimeout(timer); resolve(value); });
    });
    const api = {
      cmd: c => { const p = reply(); send(c); return p.catch(e => { throw new Error(c + ': ' + e.message); }); },
      go: () => { send('c'); },                         // התשובה תגיע רק בעצירה
      halt: () => { const p = reply(); s.write('\x03'); return p; },
      close: () => s.destroy()
    };
    s.on('connect', () => ok(api));
    s.on('error', bad);
  });
}

let g = null;
for (let i = 0; i < 60 && !g; i++) { await sleep(100); g = await connect().catch(() => null); }
if (!g) die('cannot connect to xroar gdb\n' + err);
try {
  await g.cmd('?');
  const lines = typed ? typed.split('|') : [];
  g.go();
  await sleep(400);   // אתחול
  let stopped = false;
  for (const [index, line] of lines.entries()) {
    // עוצרים, כותבים שורה לתור הקלט, וממשיכים
    await g.halt();
    const bytes = [...(line + '\r')].map(c => c.charCodeAt(0));
    const hex = [bytes.length, ...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
    await g.cmd(`M${KEYQ.toString(16)},${bytes.length + 1}:${hex}`);
    if (process.env.GFX_ACTIVE && index === lines.length - 1) {
      const symbols = readFileSync('rom/build/d32.sym', 'utf8');
      const address = Number(/^main_ok\s+equ\s+(\d+)/m.exec(symbols)[1]).toString(16);
      const result = await g.cmd(`Z0,${address},1`);
      if (result !== 'OK') throw new Error('breakpoint: ' + result);
      await g.cmd('c');
      stopped = true;
    } else {
      g.go();
      await sleep(300);
    }
  }
  await sleep(+secs * 1000);
  if (!stopped) await g.halt();
  if (process.env.REGS) console.log('regs', await g.cmd('g'));
  const memory = [];
  for (let address = 0x600; address < 0x3000; address += 256)
    memory.push(await g.cmd(`m${address.toString(16)},100`));
  console.log(JSON.stringify({memory: memory.join(''), pia: await g.cmd('mff22,1'), text: await g.cmd('m400,200')}));
} catch (e) { die(e.message + '\n' + err.slice(-300)); }
g.close();
die('', 0);
