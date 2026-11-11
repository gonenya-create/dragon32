// Our assembler against two trusted assemblers on this Mac: lwasm (lwtools, bytes + cycle counts) and asm6809 (bytes).
// Run: node tools/asm/check-ref.mjs   (needs lwasm and asm6809 from Homebrew; not part of npm test)
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { corpus } from './corpus.mjs';
await import('../../learn/asm/asm6809.js');
const A = globalThis.ASM6809;
const lines = corpus(A);
const src = ' ORG $2EE1\n' + lines.join('\n') + '\n';
const mine = A.assemble(src, {});
if (mine.errs.length) { console.log('our errors:', mine.errs.slice(0, 5)); process.exit(1); }
const dir = mkdtempSync(join(tmpdir(), 'asmref-'));
writeFileSync(join(dir, 't.asm'), ' opt c\n' + src.replace(/^ ORG/, ' org'));
const lst = execFileSync('timeout', ['60', 'lwasm', '--6809', '-f', 'raw', '-o', join(dir, 'l.bin'), '-l' + join(dir, 'l.lst'), join(dir, 't.asm')], { encoding: 'utf8' });
const L = readFileSync(join(dir, 'l.lst'), 'utf8').split('\n');
writeFileSync(join(dir, 'a.asm'), src);
execFileSync('timeout', ['60', 'asm6809', '-B', '-o', join(dir, 'a.bin'), join(dir, 'a.asm')]);
const aBin = readFileSync(join(dir, 'a.bin')), lBin = readFileSync(join(dir, 'l.bin'));
const ours = Buffer.from(mine.mem.slice(mine.start, mine.end));
// line by line against lwasm's listing: "ADDR HEXBYTES (file):NNNNN [cyc] ..."
let bad = 0, n = 0, cycBad = 0;
const byLine = {};
for (const l of L) { const m = /^([0-9A-F]{4}) ([0-9A-F]*)\s+\(\s*\S+\):(\d+) (?:\[([^\]]*)\])?/.exec(l); if (m) byLine[+m[3] - 1] = { addr: parseInt(m[1], 16), hex: m[2], cyc: m[4] }; }
for (const ln of mine.lines) {
  if (!ln.bytes.length) continue;
  n++;
  const ref = byLine[ln.n];
  const hex = Buffer.from(ln.bytes).toString('hex').toUpperCase();
  if (!ref || ref.hex !== hex) { if (bad++ < 25) console.log('BYTES', ln.n, JSON.stringify(ln.text), 'ours', hex, 'lwasm', ref && ref.hex); continue; }
  const rc = (ref.cyc || '').replace(/\s/g, '');
  const oc = String(ln.cyc);
  const ok = rc === oc || rc === String(ln.cycN) || (/\(/.test(oc) && rc.startsWith(String(ln.cycN)));
  if (!ok) { if (cycBad++ < 25) console.log('CYCLES', ln.n, JSON.stringify(ln.text), 'ours', oc, 'lwasm', rc); }
}
console.log(`${n} lines with bytes · bytes differ from lwasm: ${bad} · cycles differ: ${cycBad}`);
console.log(`whole image: ours ${ours.length} bytes · lwasm ${lBin.equals(ours) ? 'same' : 'DIFFERENT'} · asm6809 ${aBin.equals(ours) ? 'same' : 'DIFFERENT (' + aBin.length + ')'}`);
if (!aBin.equals(ours)) { for (let i = 0; i < Math.min(aBin.length, ours.length); i++) if (aBin[i] !== ours[i]) { const a = mine.start + i; const ln = mine.lines.find(x => x.addr != null && a >= x.addr && a < x.addr + x.bytes.length); console.log('asm6809 first diff at', a.toString(16), ln && ln.text); break; } }
// the only cycle differences allowed: the interrupt commands, where the datasheet gives a range (lwasm writes "n+?")
const ok = !bad && cycBad <= 4 && aBin.equals(ours) && lBin.equals(ours);
if (ok) {
  const { createHash } = await import('node:crypto');
  const sha = b => createHash('sha256').update(b).digest('hex');
  const ref = { note: 'made by tools/asm/check-ref.mjs: the corpus (tools/asm/corpus.mjs) assembled by lwasm 4.25 and asm6809 2.17 (the same bytes); cycles = lwasm listing, except CWAI/SYNC/RTI (datasheet ranges)', lines: n, bytes: lBin.length, sha256: sha(lBin), cycles: sha(mine.lines.filter(l => l.bytes.length).map(l => l.cyc).join(',')) };
  writeFileSync(new URL('./corpus-ref.json', import.meta.url), JSON.stringify(ref, null, 1) + '\n');
  console.log('saved tools/asm/corpus-ref.json');
}
process.exit(ok ? 0 : 1);
