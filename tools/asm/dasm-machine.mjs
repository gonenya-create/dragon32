// End to end on our Dragon machine (/lab/1982/): the in-Dragon assembler tape (lab/1982/tapes/dasm.cas) through CLOADM and EXEC,
// then typing like a user: program lines, LIST, ASM with a mistake, EDIT, RUN, CSAVE, NEW, CLOAD, BASIC and back with EXEC.
// Run: cd tools && node asm/dasm-machine.mjs        One Chrome, hard limit 15 minutes. Screenshots: --shots <dir>
import { chromium } from 'playwright-core';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const killer = setTimeout(() => { console.log('HARD TIME LIMIT'); process.exit(2); }, 15 * 60 * 1000);
const shotDir = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = normalize(join(ROOT, p)); if (!f.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try { res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }).end(await readFile(f)); } catch { res.writeHead(404).end(); }
}).listen(0);
const base = 'http://localhost:' + server.address().port;
const browser = await chromium.launch({ channel: 'chrome' });
const bye = async c => { await browser.close().catch(() => {}); server.close(); clearTimeout(killer); process.exit(c); };
process.on('unhandledRejection', async e => { console.error(e); await bye(1); });

const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
const errs = []; page.on('pageerror', e => errs.push(e.message));
let fails = 0, n = 0;
const check = (name, ok, extra = '') => { console.log((ok ? '✓ ' : '✗ ') + name + (ok ? '' : '\n' + extra)); if (!ok) fails++; };
const screen = async () => ((await page.evaluate(() => window.d32Screen && window.d32Screen())) || []).join('\n');
const type = t => page.evaluate(t => window.d32Type(t), t);
async function until(re, ms) {
  const t0 = Date.now(); let s = '';
  while (Date.now() - t0 < ms) { s = await screen(); if (re.test(s)) return s; await page.waitForTimeout(400); }
  return s;
}
const shot = async name => { if (shotDir) await page.locator('canvas').first().screenshot({ path: join(shotDir, (++n) + '-' + name + '.png') }); };

await page.goto(base + '/lab/1982/');
await page.waitForFunction(() => window.d32Ready, null, { timeout: 60000 });
await until(/OK/, 20000);
const cas = [...await readFile(join(ROOT, 'lab/1982/tapes/dasm.cas'))];
await page.evaluate(b => { FS.writeFile('/dasm.cas', new Uint8Array(b)); Module.ccall('wasm_load_file', null, ['string', 'number', 'number'], ['/dasm.cas', 2, 0]); }, cas);
await type('CLOADM\n');
let s = await until(/ASSEMBLR[\s\S]*\nOK/, 240000);
check('CLOADM loads the tape', /ASSEMBLR[\s\S]*\nOK/.test(s), s);
await type('EXEC\n');
s = await until(/DRAGON ASSEMBLER/, 10000);
check('EXEC starts the assembler', /DRAGON ASSEMBLER/.test(s), s);
await shot('hello');

const prog = ['10 * THE ALPHABET', '20 @ LDX #$0400', "30  LDA #'A", '40 LOOP STA ,X+', '50  INCA', "60  CMPA #'Z+1", '70  BNE LOOP', '80 KEY LDX $A000', '90  JSR ,X', '100  BEQ KEY', '110  RTS'];
for (const l of prog) await type(l + '\n');
await type('LIST\n');
s = await until(/110 {2}RTS/, 10000);
check('LIST shows the lines', prog.every(l => s.includes(l)), s);
await shot('list');

await type('105  LDZ\n');
await type('A\n');
s = await until(/ERROR/, 20000);
check('ASM reports the mistake with its line', /105 I DON'T KNOW THE COMMAND LDZ/.test(s) && /1 ERROR/.test(s), s);
await shot('error');
await type('105\n');
await type('ASM\n');
s = await until(/START \$/, 20000);
check('ASM after deleting the line: OK, start $2EE1', /OK \$2EE1-\$2EF4, 20 BYTES/.test(s) && /START \$2EE1/.test(s), s);

// [ and ]: the on-screen SHIFT, then ↓ or → (the Dragon has no bracket keys)
const tap = async k => { await page.evaluate(k => { const b = document.querySelector(`[data-k="${k}"]`); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); setTimeout(() => b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })), 120); }, k); await page.waitForTimeout(400); };
await type('120  JSR ');
await tap('SHIFT'); await tap('↓');
await type('$A000');
await tap('SHIFT'); await tap('→');
await type('\nL 120\n');
s = await until(/120 {2}JSR \[\$A000\]/, 8000);
check('SHIFT+↓ and SHIFT+→ type [ and ]', /120 {2}JSR \[\$A000\]/.test(s), s);
await type('A\n');
s = await until(/24 BYTES[\s\S]*START \$/, 20000);
check('JSR [$A000] assembles (4 more bytes)', /OK \$2EE1-\$2EF8, 24 BYTES/.test(s), s);
await type('120\n');
await type('E 30\n');
await page.waitForTimeout(800);
await type('←B\n');
await type('L 30\n');
s = await until(/30 {2}LDA #'B/, 8000);
check('EDIT changes a line (← then B)', /30 {2}LDA #'B/.test(s), s);

await type('RUN\n');
await page.waitForTimeout(3000);
s = await screen();
check('RUN: the program writes B to Z on the top line', s.split('\n')[0].startsWith('BCDEFGHIJKLMNOPQRSTUVWXYZ'), s);
await shot('run');
await type(' ');
await page.waitForTimeout(1500);
s = await screen();
check('the program\'s key ends it, and its screen stays', s.split('\n')[0].startsWith('BCDEFGHIJKLMNOPQRSTUVWXYZ') && !/BACK IN/.test(s), s);
await type(' ');
s = await until(/BACK IN THE ASSEMBLER/, 8000);
check('another key: back in the assembler', /BACK IN THE ASSEMBLER/.test(s), s);

// Gonen's program (11.11): the A it writes at the top left must still be there after the return
await type('NEW\n'); await page.waitForTimeout(600); await type('Y');
for (const l of ["10 @ LDA #'A", '20  STA $0400', '30  RTS', 'R']) await type(l + '\n');
await page.waitForTimeout(2500);
s = await screen();
check('RUN: a clean screen, and what the program wrote stays there (A at the top left) until a key', s.split('\n')[0] === 'A' && !/BACK IN/.test(s), s);
await type(' ');
s = await until(/BACK IN THE ASSEMBLER/, 8000);
check('a key: back in the assembler', /BACK IN THE ASSEMBLER/.test(s), s);
for (const l of prog) await type(l + '\n');
await type('CSAVE "ABC"\n');
s = await until(/SAVED/, 60000);
check('CSAVE writes the text to tape', /RECORDING ABC/.test(s) && /SAVED/.test(s), s);
const out = await page.evaluate(() => Array.from(FS.readFile('/out.cas')));
check('the tape has a header ABC, type 2, load $0600', (() => { for (let i = 0; i < out.length - 20; i++) if (out[i] === 0x55 && out[i + 1] === 0x3c && out[i + 2] === 0 && String.fromCharCode(...out.slice(i + 4, i + 7)) === 'ABC') return out[i + 12] === 2 && out[i + 17] === 0x06 && out[i + 18] === 0; return false; })());
await page.waitForTimeout(1500);
const mine = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('d32-lab-tapes')).map(t => t.n); } catch (e) { return []; } });
check('the saved tape appears in My tapes', mine.includes('ABC'), JSON.stringify(mine));

await type('NEW\n');
await page.waitForTimeout(600);
await type('Y');
await type('LIST\n');
await page.waitForTimeout(1500);
s = await screen();
check('NEW empties the text', !/\d+ /.test(s.slice(s.lastIndexOf('>LIST') + 5)), s);
await page.evaluate(b => { FS.writeFile('/in.cas', new Uint8Array(b)); Module.ccall('wasm_load_file', null, ['string', 'number', 'number'], ['/in.cas', 2, 0]); }, out);
await type('CLOAD "ABC"\n');
s = await until(/LOADED|ERROR|NOT AN/, 240000);
check('CLOAD reads it back', /FOUND ABC/.test(s) && /LOADED/.test(s), s);
await page.waitForTimeout(1500);
await type('LIST\n');
s = await until(/110 {2}RTS/, 10000);
check('the text is back after CLOAD', /30 {2}LDA #'A/.test(s) && /110 {2}RTS/.test(s), s);
await shot('cload');

// stage A: a listing with bytes, the names, and the program as its own tape
await type('ASM L\n');
s = await until(/START \$2EE1/, 30000);
check('ASM L lists address, bytes and line', /2EE1 8E0400 20 @ LDX #\$0400/.test(s) && /2EE6 A780 {3}40 LOOP STA ,X\+/.test(s), s);
await type('SYM\n');
s = await until(/KEY {7}\$2EED/, 20000);
check('SYM shows each name and its place, two in a row', /@ {9}\$2EE1 LOOP {6}\$2EE6/.test(s) && /KEY {7}\$2EED/.test(s), s);
// stage B: the monitor
await type('M $2EE1\n');
s = await until(/2EE1 8E 04 00 86 41 A7 80 4C/, 15000);
check('MEM shows memory, 8 bytes a line', /2EE1 8E 04 00 86 41 A7 80 4C/.test(s), s);
await type('M $2400 $41 66 %01000011\n');
s = await until(/2400 41 42 43/, 15000);
check('MEM writes bytes ($41, 66, %01000011) and shows the line', /2400 41 42 43/.test(s), s);
await type('U LOOP\n');
s = await until(/2EF4 39 +RTS/, 15000);
check('UNASM turns the bytes back into commands, from a name', /2EE6 A780 +STA +,X\+/.test(s) && /2EEB 26F9 +BNE +\$2EE6/.test(s) && /2EED BEA000 +LDX +\$A000/.test(s), s);
await page.waitForTimeout(2000);   // the listing ends first (a key during a listing pauses it)
await type('G $2EE1\n');
await page.waitForTimeout(2500);
s = await screen();
check('GO runs from an address', s.split('\n')[0].startsWith('ABCDEFGHIJKLMNOPQRSTUVWXYZ'), s);
await type(' ');
await page.waitForTimeout(800);
await type(' ');
s = await until(/BACK IN THE ASSEMBLER/, 8000);
await type('CSAVEM "ABCP"\n');
s = await until(/RECORDING ABCP[\s\S]*SAVED/, 60000);
const out2 = await page.evaluate(() => Array.from(FS.readFile('/out.cas')));
check('CSAVEM writes the program as a CLOADM tape: ABCP, type 2, load and start $2EE1', (() => { for (let i = 0; i < out2.length - 20; i++) if (out2[i] === 0x55 && out2[i + 1] === 0x3c && out2[i + 2] === 0 && String.fromCharCode(...out2.slice(i + 4, i + 8)) === 'ABCP') return out2[i + 12] === 2 && out2[i + 15] === 0x2e && out2[i + 16] === 0xe1 && out2[i + 17] === 0x2e && out2[i + 18] === 0xe1; return false; })(), s);

await type('BASIC\n');
s = await until(/EXEC 13312\s*\nOK/, 8000);
check('BASIC goes back to BASIC', /EXEC 13312\s*\nOK/.test(s), s);
// the program tape runs by itself in BASIC: CLOADM, EXEC
await page.evaluate(b => { FS.writeFile('/p.cas', new Uint8Array(b)); Module.ccall('wasm_load_file', null, ['string', 'number', 'number'], ['/p.cas', 2, 0]); }, out2);
await type('CLOADM "ABCP"\n');
s = await until(/ABCP[\s\S]*\nOK/, 240000);
await type('EXEC\n');
await page.waitForTimeout(2500);
s = await screen();
check('in BASIC, CLOADM and EXEC run the saved program (the alphabet on the top line)', s.split('\n')[0].startsWith('ABCDEFGHIJKLMNOPQRSTUVWXYZ'), s);
await type(' ');
await until(/\nOK\s*$/, 8000);
await type('EXEC 13312\n');
await page.waitForTimeout(1500);
await type('L 20\n');
s = await until(/20 @ LDX #\$0400/, 8000);
check('EXEC 13312 comes back, and the text is still there', /20 @ LDX #\$0400/.test(s), s);
await type('HELP\n');
s = await until(/BASIC {8}BACK TO BASIC/, 8000);
check('HELP lists the commands', /CSAVE NAME/.test(s) && /RUN \(R\)/.test(s), s);
await shot('help');
check('no page errors', !errs.length, errs.join('\n'));
console.log(fails ? fails + ' failed' : 'all passed');
await bye(fails ? 1 : 0);
