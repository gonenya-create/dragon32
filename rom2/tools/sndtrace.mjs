// יומן הצליל: מריץ שורות ב-XRoar עם -trace -trace-timing, ומחזיר כל כתיבה ל-$FF20 והזמן שלה במחזורי מעבד.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const source = fileURLToPath(new URL('../src/', import.meta.url));

// traceDac: היומן מתחיל כשהמעבד מגיע ל-startSym.
// writes: { v, t, irq } — t במחזורים, irq = כמה מחזורים של פסיקת השדה היו מאז הכתיבה הקודמת.
// notes (אם נתנו noteOn/noteOff): לכל תו, מהמעבר ב-noteOn ועד המעבר הבא ב-noteOff:
//   { writes, irqs } — הכתיבות בתוך התו, וכמה פסיקות שדה נלקחו בזמנו.
// irqLens: האורך של כל פסיקה (במחזורים)
export async function traceDac(lines, startSym, seconds = 1, { noteOn, noteOff } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'dragon32-snd-'));
  try {
    const src = join(dir, 'src'), rom = join(dir, 't.rom'), sym = join(dir, 't.sym'), log = join(dir, 'trace.txt');
    await cp(source, src, { recursive: true });
    const input = Buffer.from(lines.map(l => l + '\r').join(''), 'ascii');
    const cart = join(dir, 'testq.rom');            // התור המוקלד במחסנית ב-$C000 (כמו ב-xr2.mjs)
    await writeFile(cart, Buffer.concat([input, Buffer.alloc(8192 - input.length)]));   // 8K מלאים (קובץ קטן משתקף)
    await writeFile(join(src, 'testq.s'), `testq\t\tfdb\t${input.length},$c000\n`);
    await exec('asm6809', ['-B', '-o', rom, '-s', sym, 'exp.s'], { cwd: src });
    const symtext = await readFile(sym, 'utf8');
    const addr = name => {
      const m = symtext.match(new RegExp(`^${name}\\s+equ\\s+(\\d+)`, 'm'));
      if (!m) throw new Error(`Unknown symbol ${name}`);
      return Number(m[1]).toString(16).padStart(4, '0');
    };
    const pc = addr(startSym), on = noteOn && addr(noteOn), off = noteOff && addr(noteOff);
    await exec('sh', ['-c', `xroar -ui null -ao null -machine dragon32 -extbas ${rom} -cart testq -cart-type rom -cart-rom ${cart} -no-cart-autorun -no-ratelimit -trap pc=0x${pc} -trap-trace -trace-timing -timeout ${seconds} > ${log} 2>&1`],
      { timeout: 300000, maxBuffer: 1 << 20 });
    const text = await readFile(log, 'utf8');
    const writes = [], notes = [], irqLens = [];
    let t = 0, inIrq = false, irqCycles = 0, cur = null, irqStart = 0;
    for (const line of text.split('\n')) {
      const mm = line.match(/^([0-9a-f]{4})\| \S+\s+(.*?)\s+(?:cc=.*)?dt=(\d+)/);
      if (!mm) continue;
      const c = Number(mm[3]) / 16;
      if (mm[2].startsWith('[IRQ]')) { inIrq = true; irqStart = t; if (cur) cur.irqs++; }
      t += c;
      if (inIrq) irqCycles += c;
      if (inIrq && mm[2].startsWith('RTI')) { inIrq = false; irqLens.push(t - irqStart); }
      if (!inIrq && on && mm[1] === on) { cur = { writes: [], irqs: 0 }; notes.push(cur); }
      if (!inIrq && off && mm[1] === off) cur = null;
      const st = line.match(/STA\s+\$ff20\s+cc=\S+ a=([0-9a-f]{2})/);
      if (st) {
        const w = { v: parseInt(st[1], 16), t, irq: irqCycles };
        writes.push(w);
        if (cur) cur.writes.push(w);
        irqCycles = 0;
      }
    }
    return { writes, notes, irqLens };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
