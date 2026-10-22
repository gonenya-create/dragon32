// ניסוי שלב 1: כמו archive/rom-v1/tools/xr.mjs, אבל בונה את rom/src/exp.s (שבב אחד של 16K, בלי שבב הרחבה).
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const source = fileURLToPath(new URL('../src/', import.meta.url));
const testcartSrc = fileURLToPath(new URL('./testcart.s', import.meta.url));

// מספרים באורך משתנה: ביטי הפתיחה קובעים כמה בתים לקרוא.
function reader(data, start = 0) {
  let pos = start;
  const take = size => {
    if (!Number.isSafeInteger(size) || size < 0 || pos + size > data.length)
      throw new Error('Invalid or truncated XRoar snapshot');
    const out = data.subarray(pos, pos + size);
    pos += size;
    return out;
  };
  const uint = () => {
    const first = take(1)[0];
    let count = 1;
    for (let bit = 0x80; count < 5 && (first & bit); bit >>= 1) count++;
    let value = first & (count === 5 ? 0 : (1 << (8 - count)) - 1);
    for (let i = 1; i < count; i++) value = value * 256 + take(1)[0];
    return value;
  };
  const nodes = (depth = 0) => {
    if (depth > 64) throw new Error('Invalid snapshot nesting');
    const result = [];
    for (;;) {
      if (depth === 0 && pos === data.length) return result;
      const tag = uint();
      if (!tag) return result;
      const payload = take(uint());
      result.push({ tag, payload, children: nodes(depth + 1) });
    }
  };
  return { nodes, uint };
}

export function snapshot(data) {
  const header = Buffer.from('#!/usr/bin/env xroar\n# 6809.org.uk\n');
  if (!data.subarray(0, header.length).equals(header)) throw new Error('Unsupported XRoar snapshot header');
  const root = reader(data, header.length).nodes();
  const child = (node, tag) => {
    const found = node.children.find(n => n.tag === tag);
    if (!found) throw new Error(`Missing snapshot field ${tag}`);
    return found;
  };
  const part = (name, type) => {
    const find = nodes => {
      for (const node of nodes) {
        if (node.tag === 1 && node.payload.toString() === name) {
          const found = node.children.find(n => n.tag === 2 && n.payload.toString() === type);
          if (found) return found;
        }
        const found = find(node.children);
        if (found) return found;
      }
    };
    const found = find(root);
    if (!found) throw new Error(`Missing snapshot part ${name}/${type}`);
    return found;
  };
  // RAM/ram: שדה 7 הוא בנק, שדה 1 בתוכו הוא תוכן הזיכרון.
  const bytes = child(child(part('RAM', 'ram'), 7), 1).payload;
  if (bytes.length !== 32768) throw new Error(`Expected 32768 RAM bytes, got ${bytes.length}`);
  const ram = Buffer.from(bytes);
  // PIA1/MC6821: צד B הוא שדה 2, ואוגר הפלט הוא שדה 3.
  const output = child(child(part('PIA1', 'MC6821'), 2), 3).payload;
  const pia1b = reader(output).uint();
  const ch = b => {
    const c = b & 0x3f;
    const asc = String.fromCharCode(c < 0x20 ? c + 0x40 : c);
    return b & 0x40 ? asc : asc.toLowerCase();
  };
  const rows = Array.from({ length: 16 }, (_, r) =>
    [...ram.subarray(0x400 + r * 32, 0x420 + r * 32)].map(ch).join('').replace(/\s+$/, ''));
  const pia = (name, side, tag) => reader(child(child(part(name, 'MC6821'), side), tag).payload).uint();
  // SAM: הערך של 16 הביטים (V0-V2, F0-F6, P, R0-R1, M0-M1, TY), אם נמצא בתמונה
  let sam;
  try { const s = part('SAM', 'SN74LS783'); sam = s.children.map(c => c.tag + ':' + c.payload.toString('hex') + (c.children.length ? '{' + c.children.map(d => d.tag + ':' + d.payload.toString('hex')).join(',') + '}' : '')); } catch (e) { sam = String(e); }
  return { sam, pia1a: pia('PIA1', 1, 3), pia1cra: pia('PIA1', 1, 1), pia1crb: pia('PIA1', 2, 1),
    pia0cra: pia('PIA0', 1, 1), pia0crb: pia('PIA0', 2, 1), ram, screen: rows.join('\n').replace(/\n+$/, ''), pia1b };
}


// buildTest: בונה את ה-ROM מ-src (בלי שינוי), את מחסנית הבדיקות עם השורות, ומפנה את $BBE5 בעותק הבדיקה אל המחסנית.
// מחזיר את קובץ המחסנית ואת כל הסמלים (ROM ומחסנית). משותף ל-runRom ול-sndtrace.mjs
export async function buildTest(src, dir, rom, sym, input, wallTimeout = 20000) {
  // הקלדה: מחסנית הבדיקות (testcart.s) ב-$C000, והשורות אחריה. ב-ROM אין קוד בדיקות: רק בעותק הבדיקה
  // ה-JMP שב-$BBE5 (סריקת המקלדת) מופנה למחסנית
  await exec('asm6809', ['-B', '-o', rom, '-s', sym, 'exp.s'], { cwd: src, timeout: wallTimeout, killSignal: 'SIGKILL' });
  const symbols = new Map([...((await readFile(sym, 'utf8')).matchAll(/^(\w+)\s+equ\s+(\d+)\s*$/gm))].map(m => [m[1], Number(m[2])]));
  const hex = n => '$' + symbols.get(n).toString(16);
  for (const n of ['keyindex', 'gk_r', 'brk_r', 'ink_r', 'CURLIN']) if (!symbols.has(n)) throw new Error(`Missing ROM symbol ${n}`);
  const cartBin = join(dir, 'testcart.bin'), cartSym = join(dir, 'testcart.sym');
  await exec('asm6809', ['-B', '-o', cartBin, '-s', cartSym, '-d', `KEYIDX=${hex('keyindex')}`, '-d', `GKRET=${hex('gk_r')}`,
    '-d', `BRKRET=${hex('brk_r')}`, '-d', `INKRET=${hex('ink_r')}`, '-d', `CURLIN=${hex('CURLIN')}`, testcartSrc], { timeout: wallTimeout, killSignal: 'SIGKILL' });
  for (const m of (await readFile(cartSym, 'utf8')).matchAll(/^(\w+)\s+equ\s+(\d+)\s*$/gm)) symbols.set(m[1], Number(m[2]));
  const code = await readFile(cartBin);
  if (code.length + input.length > 8192) throw new Error(`ROM input is ${input.length} bytes; maximum is ${8192 - code.length}`);
  code.writeUInt16BE(input.length, 2);   // tqlen
  const cart = join(dir, 'testq.rom');
  await writeFile(cart, Buffer.concat([code, input, Buffer.alloc(8192 - code.length - input.length)]));   // 8K מלאים
  const image = await readFile(rom);
  if (image[0x3be5] !== 0x7e) throw new Error('Expected JMP at $BBE5');
  image.writeUInt16BE(symbols.get('tq_pol'), 0x3be6);
  await writeFile(rom, image);
  return { cart, symbols };
}

export async function runRom(lines, opts = {}) {
  if (!Array.isArray(lines) || lines.some(line => typeof line !== 'string' || /[^\x03\x0c\x20-\x7e]/.test(line)))
    throw new Error('ROM input must be an array of printable ASCII lines (\\x03 = BREAK, \\x0c = CLEAR)');
  const input = Buffer.from(lines.map(line => line + '\r').join(''), 'ascii');
  if (input.length > 8192) throw new Error(`ROM input is ${input.length} bytes; maximum is about 8100 bytes including CRs (cartridge at $C000)`);
  const { trapSym = 'tq_idle', range, timeout = 5, wallTimeout = 20000 } = opts;
  if (!Number.isFinite(timeout) || timeout <= 0 || !Number.isFinite(wallTimeout) || wallTimeout <= 0)
    throw new Error('Timeouts must be positive finite numbers');
  if (range !== undefined && !/^[1-9]\d*(?:-[1-9]\d*)?$/.test(String(range)))
    throw new Error('Trap range must be M or M-N, with positive hit numbers');
  if (String(range).includes('-')) {
    const [first, last] = String(range).split('-').map(Number);
    if (last < first) throw new Error('Trap range must end at or after its first hit');
  }
  const dir = await mkdtemp(join(tmpdir(), 'dragon32-test-'));
  try {
    const src = join(dir, 'src'), rom = join(dir, 'test.rom'), sym = join(dir, 'test.sym'), sna = join(dir, 'test.sna');
    await cp(source, src, { recursive: true });
    // חיבור פונקציות רק בעותק הבדיקה; קובצי המפרש המקוריים נשמרים.
    if (opts.gfxFunctions) {
      const basicPath = join(src, 'basic.s');
      const basic = await readFile(basicPath, 'utf8');
      const marker = /([ \t]*lbsr[ \t]+fn_dispatch)/;
      if (!marker.test(basic)) throw new Error('Missing fn_dispatch integration point');
      await writeFile(basicPath, basic.replace(marker,
        '\t\tlbsr\tgfx_fn\n\t\tbeq\t8F\n$1'));
    }
    // בבדיקת BREAK מושכים את שורת המקלדת למטה רק לאחר תחילת ההעברה.
    if (opts.tapeBreak) {
      const path = join(src, 'tape.s');
      const tape = await readFile(path, 'utf8');
      if (!tape.includes('t_check pshs a')) throw new Error('Missing tape BREAK test point');
      await writeFile(path, tape.replace('t_check pshs a', `t_check pshs a
        clr PIA0+1
        lda #$40
        sta PIA0
        lda #4
        sta PIA0+1
        clr PIA0`));
    }
    const { cart, symbols } = await buildTest(src, dir, rom, sym, input, wallTimeout);
    if (!symbols.has(trapSym)) throw new Error(`Unknown trap symbol: ${trapSym}`);
    const args = ['-no-tape-fast', '-no-tape-pad-auto', '-ui', 'null', '-ao', 'null', '-machine', 'dragon32', '-extbas', rom, '-no-ratelimit', '-trap', `pc=0x${symbols.get(trapSym).toString(16)}`];
    args.push('-cart', 'testq', '-cart-type', 'rom', '-cart-rom', cart, '-no-cart-autorun');
    if (opts.tapeLoad) args.push('-load-tape', opts.tapeLoad);
    if (opts.xroarArgs) args.push(...opts.xroarArgs);   // הגדרות נוספות ל-XRoar (למשל -tape-ao-rate)
    if (opts.tapeWrite) args.push('-tape-write', opts.tapeWrite);
    if (range !== undefined) args.push('-trap-range', String(range));
    // כמו במחשב האמיתי, לולאת ההמתנה מהבהבת (עם השהיה של כ-10 אלפיות) לפני כל בדיקת מקש: לכל תו מוקלד מוסיפים זמן
    args.push('-trap-snap', sna, '-trap-timeout', '0', '-timeout', String(timeout + Math.ceil(input.length * 0.012)));
    await exec('xroar', args, { timeout: wallTimeout, killSignal: 'SIGKILL' });
    let data;
    try { data = await readFile(sna); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      throw new Error(`No snapshot: ROM did not reach ${trapSym} (range ${range ?? 1}) within ${timeout} emulated seconds; input may loop forever`);
    }
    return snapshot(data);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
