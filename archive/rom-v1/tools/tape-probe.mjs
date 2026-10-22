// מריץ קלטת מהמדף על המחשב האמיתי: CLOAD, RUN, ותשובות. מציג את המסך.
// שימוש: node rom/tools/tape-probe.mjs <שם> [תשובות מופרדות ב-|] [שניות]
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runRom } from './xr.mjs';
const [name, answers = '', secs = '60'] = process.argv.slice(2);
const block = (type, data = Buffer.alloc(0)) => Buffer.from([0x55, 0x3c, type, data.length, ...data,
  (type + data.length + [...data].reduce((a, b) => a + b, 0)) & 255, 0x55]);
const text = (await readFile(new URL(`../../assets/dragon/tapes/${name}.bas`, import.meta.url), 'utf8'))
  .replace(/\r?\n/g, '\r');
const data = Buffer.from(text, 'ascii');
const parts = [Buffer.alloc(128, 0x55), block(0, Buffer.from([...Buffer.from('T'.padEnd(8)), 0, 255, 255, 0, 0, 0, 0])), Buffer.alloc(128, 0x55)];
for (let i = 0; i < data.length; i += 255) parts.push(block(1, data.subarray(i, i + 255)));
parts.push(block(255));
const dir = await mkdtemp(join(tmpdir(), 'probe-'));
try {
  const tape = join(dir, 't.cas');
  await writeFile(tape, Buffer.concat(parts));
  const r = await runRom(['CLOAD', 'RUN', ...(answers ? answers.split('|') : [])], { timeout: Number(secs), wallTimeout: 60000, tapeLoad: tape });
  console.log(r.screen);
} catch (e) { console.log('FAIL', e.message); } finally { await rm(dir, { recursive: true, force: true }); }
