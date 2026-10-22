// בדיקות הכתובות הקבועות של המקור (src/islands.s), מול docs/DRAGON-SPEC-ENTRIES.md ו-docs/DRAGON-RESEARCH-ERA.md.
// כל בדיקה מכניסה לזיכרון תוכנית מכונה קטנה שלנו (לא מהמקור), שקוראת לכתובת, ובודקת מה BASIC מראה.
// הרצה: node rom/tools/entry-test.mjs
import { readFile } from 'node:fs/promises';
import { runRom } from './xr2.mjs';

let pass = 0, fail = 0;
const ok = (name, cond, info = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${info}`); }
};
const show = s => JSON.stringify(s);

// poke(addr, hex): שורות BASIC שמכניסות את הבתים לזיכרון
const poke = (addr, hex) => {
  const b = hex.replace(/\s+/g, '').match(/../g).map(x => parseInt(x, 16));
  return [`POKE ${addr},${b[0]}`, ...b.slice(1).map((v, i) => `POKE ${addr + i + 1},${v}`)]
    .reduce((acc, p) => { const l = acc.at(-1); if (l && l.length + p.length < 200) acc[acc.length - 1] = l + ':' + p; else acc.push(p); return acc; }, []);
};
const run = async (lines, opts = {}) => (await runRom(['CLEAR 200,&H6FFF', ...lines], { timeout: 10, ...opts })).screen;
const tail = s => s.trimEnd().split('\n').slice(-3).join('\n');

// כל הגושים יושבים בדיוק בכתובת שלהם
const rom = await readFile(new URL('../build/s1.rom', import.meta.url));
const src = await readFile(new URL('../src/islands.s', import.meta.url), 'utf8');
const at = a => rom[a - 0x8000];
console.log('המקום של הגושים');
ok('$8342: ‏LDB #12, ואחריו JMP ב-$8344', at(0x8342) === 0xC6 && at(0x8343) === 12 && at(0x8344) === 0x7E);
ok('$89A4-$89B4: ‏LDB, דילוג, LDB, דילוג, LDB, ובדיקה ב-$89AC', at(0x89A4) === 0xC6 && at(0x89A6) === 0x8C && at(0x89A7) === 0xC6 && at(0x89A9) === 0x8C && at(0x89AA) === 0xC6 && at(0x89AB) === 0x2C && at(0x89B4) === 0x7E);
ok('$8C36: פקודה של בית אחד (CLRA) שנופלת ל-$8C37', at(0x8C36) === 0x4F && at(0x8C37) === 0x7E);
for (const a of [...src.matchAll(/@island \$([0-9A-F]{4})/gi)].map(m => parseInt(m[1], 16)))
  ok(`$${a.toString(16).toUpperCase()}: לא ריק`, at(a) !== 0xFF && at(a) !== 0x00);

try {
  console.log('USR: ‏$8B2D (מספר מ-BASIC) ו-$8C37 (תוצאה ל-BASIC)');
  // JSR $8B2D / ADDD #1 / JMP $8C37
  const usr1 = [...poke(0x7000, 'BD8B2D C30001 7E8C37'), 'DEFUSR0=&H7000'];
  let s = await run([...usr1, 'PRINT USR(5);USR(-1.5);USR(-32768);USR(32767.9)']);
  ok('USR(5)=6, ‏-1.5 נקטע ל-1- (לכיוון אפס), ‏-32768 מותר, 32767.9 → 32767', /^ 6  0 -32767 -32768 ?$/m.test(s), show(tail(s)));
  s = await run([...usr1, 'PRINT USR(32768)']);
  ok('USR(32768): ?FC', /\?FC ERROR/.test(s), show(tail(s)));
  s = await run([...usr1, 'PRINT USR(-32768.5)']);
  ok('USR(-32768.5): ?FC', /\?FC ERROR/.test(s), show(tail(s)));
  s = await run([...usr1, 'PRINT USR("A")']);
  ok('USR עם מחרוזת: ‏$8B2D נותן ?TM', /\?TM ERROR/.test(s), show(tail(s)));
  // LDB #200 / JMP $8C36
  s = await run([...poke(0x7000, 'C6C8 7E8C36'), 'DEFUSR0=&H7000', 'PRINT USR(0)+1']);
  ok('$8C36: ‏B=200 → ‏200 (ואפשר לחשב איתו)', /^ 201 ?$/m.test(s), show(tail(s)));
  // LDD #-5 / JMP $8C37, עם מחרוזת: התוצאה מספר
  s = await run([...poke(0x7000, 'CCFFFB 7E8C37'), 'DEFUSR0=&H7000', 'PRINT USR("X")*2']);
  ok('$8C37 אחרי USR עם מחרוזת: התוצאה מספר (‎-10)', /^-10 ?$/m.test(s), show(tail(s)));

  console.log('בדיקת תו: ‏$89A4 ‏")"  ‏$89A7 ‏"("  ‏$89AA ","  ‏$89B4 ‏?SN');
  const chk = poke(0x7010, 'BD89AA39 BD89A439 BD89A739 7E89B4');
  s = await run([...chk, 'EXEC &H7010,:PRINT "Y"']);
  ok('EXEC &H7010, — הפסיק נבלע וממשיכים', /^Y$/m.test(s) && !/ERROR/.test(s), show(tail(s)));
  s = await run([...chk, 'EXEC &H7010:PRINT "N"']);
  ok('בלי פסיק: ?SN', /\?SN ERROR/.test(s) && !/^N$/m.test(s), show(tail(s)));
  s = await run([...chk, 'EXEC &H7014):PRINT "Y"']);
  ok('$89A4: סוגר', /^Y$/m.test(s) && !/ERROR/.test(s), show(tail(s)));
  s = await run([...chk, 'EXEC &H7018(:PRINT "Y"']);
  ok('$89A7: פותח', /^Y$/m.test(s) && !/ERROR/.test(s), show(tail(s)));
  s = await run([...chk, 'EXEC &H701C']);
  ok('$89B4: ‏?SN', /\?SN ERROR/.test(s), show(tail(s)));

  console.log('שגיאות: ‏$8B8D ‏?FC, ‏$8B8A ‏?BS, ‏$8342 ‏?OM, ‏$8344 עם הקוד ב-B');
  for (const [hex, err] of [['7E8B8D', 'FC'], ['7E8B8A', 'BS'], ['7E8342', 'OM'], ['C6027E8344', 'SN'], ['C6147E8344', '/0']]) {
    s = await run([...poke(0x7000, hex), 'EXEC &H7000']);
    ok(`${hex} → ?${err}`, s.includes(`?${err} ERROR`), show(tail(s)));
  }

  console.log('הפסיקה: ‏$9D3D');
  // פסיקה של המשתמש: INC $7060 / JMP $9D3D. ההתקנה במכונה, עם פסיקות חסומות:
  // ORCC #$50 / LDX #$7040 / STX $010D / ANDCC #$AF / RTS
  s = await run([...poke(0x7040, '7C7060 7E9D3D'), ...poke(0x7030, '1A50 8E7040 BF010D 1CAF 39'),
    'POKE &H7060,0:EXEC &H7030:T=TIMER:FOR I=1 TO 400:NEXT:D=TIMER-T:C=PEEK(&H7060)',
    'PRINT D>10;ABS(D-C)<=1']);
  ok('הפסיקה של המשתמש רצה בכל שדה, ו-TIMER ממשיך לספור', /^-1 -1 ?$/m.test(s), show(tail(s)));
} catch (e) {
  fail++; console.log('  ✗ ' + e.message);
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
