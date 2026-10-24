// בונה את "ביצי הדרקון" למכונת ה-Dragon: מצייר את הדמויות (gfx.s), מרכיב את eggs.s עם asm6809,
// ועוטף את התוצאה בקלטת של שפת מכונה (CLOADM), כמו קלטת של אז: lab/1982/tapes/eggs.cas
// הרצה: node games/eggs/build.mjs           (בונה)
//        node games/eggs/build.mjs --check   (בודק שהקלטת מעודכנת)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = fileURLToPath(new URL('../../lab/1982/tapes/eggs.cas', import.meta.url));
const LOAD = 0x4000;

// הדמויות, אותן כמו במחסנית שבאפליקציה. 1 צהוב, 2 כחול, 3 אדום, נקודה = שקוף.
// במסך של 128 נקודות לרוחב כל נקודה רחבה פי 2, ולכן כל שורה מצוירת פעמיים לגובה (double).
const DRAGON = [
  ['...33............', '...333......333..', '....333....33133.', '.....333..3333332',
   '..33333333333....', '.3333333333......', '33.33333333......', '...3333.333......', '...3..3...3......'],
  ['.................', '............333..', '...........33133.', '..........3333332',
   '..33333333333....', '.3333333333......', '33.3333333.......', '...3333333.......', '...3..3...3......']
];
const flip = rows => rows.map(r => [...r].reverse().join(''));
const SPRITES = [
  ['drag', [DRAGON[0], DRAGON[1], flip(DRAGON[0]), flip(DRAGON[1])], true],   // ימינה (2 כנפיים), שמאלה (2)
  ['egg', [['.11.', '1111', '1111', '1111', '.11.']], true],
  ['fire', [['.33.', '3113', '3113', '.33.']], true],
  ['heart', [['33.33', '33333', '.333.', '..3..']], true],
  ['bask', [['222222222222222', '222222222222222', ...Array(6).fill('221212121212122'),
    '222222222222222', '222222222222222']], false],
  ['splat', [['..111..', '..111..', '1111111', '1111111', '1111111']], false],
  // ספרות הניקוד: גופן משלנו, 3 על 5
  ['dig', ['111101101101111', '010110010010111', '111001111100111', '111001011001111', '101101111001001',
    '111100111001111', '111100111101111', '111001010010010', '111101111101111', '111101111001111']
    .map(d => d.match(/.../g).map(r => r.replace(/1/g, '2').replace(/0/g, '.'))), true]
];

function packed(rows, shift) {
  const w = rows[0].length, bw = Math.ceil((w + shift) / 4), bytes = [];
  for (const r of rows) {
    const p = Array(bw * 4).fill(0);
    for (let i = 0; i < w; i++) p[shift + i] = r[i] === '.' ? 0 : Number(r[i]);
    for (let j = 0; j < bw; j++) bytes.push((p[4 * j] << 6) | (p[4 * j + 1] << 4) | (p[4 * j + 2] << 2) | p[4 * j + 3]);
  }
  return { bw, h: rows.length, bytes };
}

let gfx = '; נוצר אוטומטית על ידי build.mjs. לא לערוך ביד.\n; לכל דמות: 4 מצביעים (לפי הזזה של 0-3 נקודות בתוך הבית), ובכל אחד: רוחב בבתים, גובה, ואז הבתים\n';
for (const [name, frames, dbl] of SPRITES) {
  gfx += `sp_${name}\n`;
  frames.forEach((_, f) => { gfx += `\t\tfdb\t${[0, 1, 2, 3].map(s => `${name}_${f}_${s}`).join(',')}\n`; });
  frames.forEach((rows, f) => {
    const tall = dbl ? rows.flatMap(r => [r, r]) : rows;
    for (let s = 0; s < 4; s++) {
      const { bw, h, bytes } = packed(tall, s);
      gfx += `${name}_${f}_${s}\tfcb\t${bw},${h}\n`;
      for (let i = 0; i < bytes.length; i += 16) gfx += `\t\tfcb\t${bytes.slice(i, i + 16).map(b => '$' + b.toString(16).padStart(2, '0')).join(',')}\n`;
    }
  });
}

const dir = mkdtempSync(join(tmpdir(), 'eggs-'));
let bin;
try {
  writeFileSync(join(dir, 'gfx.s'), gfx);
  writeFileSync(join(dir, 'eggs.s'), readFileSync(join(here, 'eggs.s')));
  execFileSync('asm6809', ['-B', '-o', join(dir, 'eggs.bin'), '-l', join(dir, 'eggs.lst'), '-s', join(dir, 'eggs.sym'), 'eggs.s'], { cwd: dir, stdio: 'inherit' });
  bin = readFileSync(join(dir, 'eggs.bin'));
  if (process.argv.includes('--list')) writeFileSync(join(here, 'eggs.lst'), readFileSync(join(dir, 'eggs.lst')));
} finally {
  rmSync(dir, { recursive: true, force: true });
}

// הקלטת: כמו הקלטות של המדף. כותרת (שם, סוג 2 = שפת מכונה, כתובת הפעלה, כתובת טעינה), ואז בלוקים של 255
function block(type, data) {
  let sum = type + data.length;
  for (const b of data) sum += b;
  return [0x55, 0x3c, type, data.length, ...data, sum & 255, 0x55];
}
const leader = () => Array(218).fill(0x55);
const name = [...'EGGS    '].map(c => c.charCodeAt(0));
const head = [...name, 2, 0, 0, LOAD >> 8, LOAD & 255, LOAD >> 8, LOAD & 255];
const cas = [...leader(), ...block(0, head), ...leader()];
for (let i = 0; i < bin.length; i += 255) cas.push(...block(1, [...bin.subarray(i, i + 255)]));
cas.push(...block(0xff, []));
const bytes = Buffer.from(cas);

if (process.argv.includes('--check')) {
  let old = null;
  try { old = readFileSync(out); } catch {}
  const same = old && Buffer.compare(old, bytes) === 0;
  console.log(same ? '✓ eggs.cas מעודכנת' : '✗ eggs.cas לא מעודכנת: node games/eggs/build.mjs');
  process.exit(same ? 0 : 1);
}
writeFileSync(out, bytes);
console.log(`eggs.cas: ${bin.length} בתים של קוד, $${LOAD.toString(16)}-$${(LOAD + bin.length - 1).toString(16)}`);
