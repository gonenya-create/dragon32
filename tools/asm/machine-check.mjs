// End to end on our Dragon machine: each program goes through the Assembler page's 🐉 button (a CSAVEM-style tape in
// "My tapes"), then /lab/1982/?learn=NAME, CLOADM "NAME", CLS:EXEC, exactly as a user would. Then:
//  - the CPU test programs (tools/asm/cpu-progs.mjs): the bytes the machine wrote from $6000 must equal our CPU's.
//    With --save, the machine's bytes are written to tools/asm/cpu-expected.json (used by dragon-test.mjs part 'asm').
//  - the page's examples: the text screen must equal our CPU's screen, and a key must bring back BASIC's OK (RTS is safe).
// Run: cd tools && node asm/machine-check.mjs [--save] [names...]     One Chrome, hard limit 20 minutes.
import { chromium } from 'playwright-core';
import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CPU_PROGS, runOurs } from './cpu-progs.mjs';
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const killer = setTimeout(() => { console.log('HARD TIME LIMIT'); process.exit(2); }, 20 * 60 * 1000);
await import('../../learn/asm/asm6809.js');
const A = globalThis.ASM6809;
const args = process.argv.slice(2), SAVE = args.includes('--save'), only = args.filter(a => !a.startsWith('--'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = normalize(join(ROOT, p)); if (!f.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try { res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }).end(await readFile(f)); } catch { res.writeHead(404).end(); }
}).listen(0);
const base = 'http://localhost:' + server.address().port;
const browser = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const bye = async c => { await browser.close().catch(() => {}); server.close(); clearTimeout(killer); process.exit(c); };
process.on('unhandledRejection', async e => { console.error(e); await bye(1); });

// our CPU, the way the page runs a program: CLS, the keyboard check answers "no key", stop at the first wait for a key
function ourScreen(src) {
  const img = A.assemble(src), mem = new Uint8Array(65536);
  for (let a = 0; a < 65536; a++) if (img.used[a]) mem[a] = img.mem[a];
  mem.fill(0x60, 0x400, 0x600); mem[0xA000] = 0x80; mem[0xA001] = 0x06;
  const cpu = A.cpu(a => mem[a], (a, v) => { mem[a] = v; });
  cpu.r.PC = img.entry; cpu.r.S = 0x7EF0; mem[0x7EF0] = 0xFF; mem[0x7EF1] = 0xF0;
  for (let n = 0; n < 2e6; n++) {
    if (cpu.r.PC === 0x8006) break;                       // waiting for a key: the screen is final
    if (cpu.r.PC === 0xFFF0) break;
    cpu.step();
  }
  return { img, screen: mem.slice(0x400, 0x600) };
}
const EXAMPLES = ['abc', 'dots', 'mul', 'table'];
const progs = [];
for (const k of Object.keys(CPU_PROGS)) progs.push({ name: k.toUpperCase(), src: CPU_PROGS[k](), kind: 'cpu', key: k });
{ // the page's examples, as the page itself loads them
  const p = await browser.newPage(); await p.goto(base + '/learn/asm/');
  const ex = await p.evaluate(() => window.__asm.EX.map(e => ({ id: e.id, tape: e.tape, src: e.src.join('\n') + '\n' })));
  await p.close();
  for (const e of ex) if (EXAMPLES.includes(e.id)) progs.push({ name: e.tape, src: e.src, kind: 'screen', key: e.id });
}
const expected = {};
let bad = 0;
for (const P of progs) {
  if (only.length && !only.includes(P.key)) continue;
  const t0 = Date.now();
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  await ctx.addInitScript(() => { window.open = u => { window.__opened = u; return null; }; });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  // 1. the Assembler page: write the program, name the tape, 🐉
  await p.goto(base + '/learn/asm/');
  await p.evaluate(({ src, name }) => { const t = document.getElementById('asm-src'); t.value = src; t.dispatchEvent(new Event('input')); const n = document.getElementById('asm-name'); n.value = name; n.dispatchEvent(new Event('input')); }, { src: P.src, name: P.name });
  await p.waitForTimeout(400);
  await p.click('#asm-send');
  const sent = await p.evaluate(() => ({ opened: window.__opened, tapes: JSON.parse(localStorage.getItem('d32-lab-tapes') || '[]').map(t => t.n) }));
  if (sent.opened !== '/lab/1982/?learn=' + P.name || sent.tapes[0] !== P.name) { console.log('✗', P.name, 'send', JSON.stringify(sent), errs.join(';')); bad++; await ctx.close(); continue; }
  // 2. the machine: CLOADM "NAME", then CLS:EXEC
  await p.goto(base + sent.opened);
  await p.waitForFunction(() => window.d32Ready && typeof HEAPU8 !== 'undefined' && window.d32Screen && window.d32Screen(), null, { timeout: 60000 });
  await p.waitForTimeout(2500);
  const ram0 = await p.evaluate(() => { const sc = c => { const n = c.charCodeAt(0); return n >= 0x40 ? n : n + 0x40; }, sig = [...'DRAGON 1982 BASIC'].map(sc), h = HEAPU8;
    for (let i = 0x400; i < h.length - sig.length; i++) { if (h[i] !== sig[0]) continue; let k = 1; while (k < sig.length && h[i + k] === sig[k]) k++; if (k === sig.length) return i - 0x400; } return -1; });
  await p.evaluate(n => window.d32Type('CLOADM "' + n + '"\n'), P.name);
  const loaded = await p.waitForFunction(n => { const s = (window.d32Screen() || []).join('\n'); return (s.includes(n) && /\nOK\s*$/.test(s)) || /ERROR/.test(s); }, P.name, { timeout: 240000, polling: 500 }).then(() => true, () => false);
  const scr1 = (await p.evaluate(() => (window.d32Screen() || []).filter(Boolean).join(' | ')));
  if (!loaded || /ERROR/.test(scr1)) { console.log('✗', P.name, 'CLOADM', scr1); bad++; await ctx.close(); continue; }
  await p.evaluate(() => window.d32Type('CLS:EXEC\n'));
  const ours = P.kind === 'cpu' ? null : ourScreen(P.src);
  const img = A.assemble(P.src);
  // where the Dragon's memory sits inside XRoar's (found before CLOADM, from the start-up line at $0400), and the program must be there
  const head = Array.from(img.mem.slice(img.start, img.start + Math.min(24, img.count)));
  const ram = await p.evaluate(({ ram, head, start }) => head.every((v, k) => HEAPU8[ram + start + k] === v) ? ram : -1, { ram: ram0, head, start: img.start });
  if (ram < 0) { console.log('✗', P.name, 'the loaded program is not in the machine\'s memory at', img.start.toString(16)); bad++; await ctx.close(); continue; }
  if (P.kind === 'cpu') {
    const W = written(P.src), n = 0x1800;
    await p.waitForFunction(() => /(^|\n)OK\s*(\n|$)/.test((window.d32Screen() || []).join('\n')), null, { timeout: 60000, polling: 300 }).catch(() => {});
    const all = await p.evaluate(({ ram, n }) => Array.from(HEAPU8.slice(ram + 0x6000, ram + 0x6000 + n)), { ram, n });
    const ourAll = Array.from(runOurs(A, P.src, n).bytes);
    const got = W.map(a => all[a - 0x6000]), ourBytes = W.map(a => ourAll[a - 0x6000]);
    let diff = -1; for (let i = 0; i < W.length; i++) if (got[i] !== ourBytes[i]) { diff = i; break; }
    expected[P.key] = { n: W.length, hex: Buffer.from(got).toString('hex') };
    const back = /(^|\n)OK\s*(\n|$)/.test((await p.evaluate(() => (window.d32Screen() || []).join('\n'))));
    if (diff < 0 && back) console.log('✓', P.name, `${img.count} bytes · all ${W.length} result bytes it wrote from $6000 equal our CPU's · back to OK · ${Math.round((Date.now() - t0) / 1000)} s`);
    else { bad++; console.log('✗', P.name, diff >= 0 ? `first difference at $${W[diff].toString(16)}: machine ${got.slice(diff, diff + 11).map(v => v.toString(16)).join(' ')} · ours ${ourBytes.slice(diff, diff + 11).map(v => v.toString(16)).join(' ')}` : 'did not return to OK'); }
  } else {
    await p.waitForTimeout(2500);
    const got = await p.evaluate(ram => Array.from(HEAPU8.slice(ram + 0x400, ram + 0x600)), ram);
    let diff = -1; for (let i = 0; i < 512; i++) if (got[i] !== ours.screen[i]) { diff = i; break; }
    await p.evaluate(() => window.d32Type(' '));
    const back = await p.waitForFunction(() => /(^|\n)OK\s*(\n|$)/.test((window.d32Screen() || []).join('\n')), null, { timeout: 15000, polling: 300 }).then(() => true, () => false);
    if (diff < 0 && back && ram >= 0) console.log('✓', P.name, `${img.count} bytes · the screen equals our CPU's (${got.filter(v => v !== 0x60).length} cells drawn) · a key → back to OK · ${Math.round((Date.now() - t0) / 1000)} s`);
    else { bad++; console.log('✗', P.name, diff >= 0 ? `screen differs at $${(0x400 + diff).toString(16)}: machine ${got[diff].toString(16)} ours ${ours.screen[diff].toString(16)}` : '', back ? '' : 'no OK after a key', 'ram', ram); }
  }
  if (errs.length) { bad++; console.log('  page errors:', errs.join('; ')); }
  await ctx.close();
}
// the places a CPU program writes from $6000 to $77FF, in order (run on our CPU)
function written(src) {
  const img = A.assemble(src), mem = new Uint8Array(65536), w = new Set();
  for (let a = 0; a < 65536; a++) if (img.used[a]) mem[a] = img.mem[a];
  const cpu = A.cpu(a => mem[a], (a, v) => { mem[a] = v; if (a >= 0x6000 && a < 0x7800) w.add(a); });
  cpu.r.PC = img.entry; cpu.r.S = 0x7EF0; mem[0x7EF0] = 0xFF; mem[0x7EF1] = 0xF0;
  while (cpu.r.PC !== 0xFFF0) cpu.step();
  return [...w].sort((a, b) => a - b);
}
if (SAVE && Object.keys(expected).length) {
  const f = join(ROOT, 'tools/asm/cpu-expected.json');
  let old = {}; try { old = JSON.parse(await readFile(f, 'utf8')); } catch {}
  await writeFile(f, JSON.stringify(Object.assign(old, expected), null, 1) + '\n');
  console.log('saved', Object.keys(expected).join(', '), '→ tools/asm/cpu-expected.json');
}
console.log(bad ? `${bad} problem(s)` : 'all good');
await bye(bad ? 1 : 0);
