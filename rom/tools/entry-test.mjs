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
ok('$8C36: פקודה של בית אחד (CLRA) שנופלת ל-$8C37 (CLR VALTYP)', at(0x8C36) === 0x4F && at(0x8C37) === 0x0F && at(0x8C38) === 0x06);
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

  console.log('"קרא את התו הבא": ‏$9F ב-RAM, וההמשך ב-$BB26');
  s = await run(['PRINT PEEK(&HA8);PEEK(&HA9);PEEK(&HAA)']);
  ok('ב-RAM: ‏JMP $BB26 בסוף השגרה ($A8-$AA)', /^ 126  187  38 ?$/m.test(s), show(tail(s)));
  // LDX #$1234 / JSR <$9F / TFR CC,B / STB $7060 / STX $7062 / JSR <$9F / RTS
  const cg = poke(0x7000, '8E1234 9D9F 1FA9 F77060 BF7062 9D9F 39');
  for (const [arg, c, name] of [['5', 1, 'ספרה: C=1'], [' 7', 1, 'רווחים מדלגים, ספרה: C=1'], ['A', 0, 'אות: C=0'], ['"', 0, 'מרכאות: C=0']]) {
    s = await run([...cg, `EXEC &H7000,${arg}`, 'PRINT PEEK(&H7060) AND 1;PEEK(&H7062)*256+PEEK(&H7063)']);
    ok(`${name}, ו-X לא משתנה`, new RegExp(`^ ${c}  4660 ?$`, 'm').test(s), show(tail(s)));
  }

  console.log('סבב 2: כמו בתוכנות של אז');
  s = await run(['PRINT PEEK(&HBFFE)*256+PEEK(&HBFFF);PEEK(&H72)*256+PEEK(&H73);PEEK(&H10D)*256+PEEK(&H10E);PEEK(&H110)*256+PEEK(&H111)']);
  ok('וקטור RESET = $B3B4, הכניסה החמה = $B44F, ‏IRQ דרך $9D3D, ‏FIRQ דרך $B469', /^ 46004  46159  40253  46185 ?$/m.test(s), show(tail(s)));
  // JSR $BA77 / STX $7062 / RTS
  s = await run([...poke(0x7000, 'BDBA77 BF7062 39'), 'PRINT "XYZ":EXEC &H7000:PRINT PEEK(&H7062)*256+PEEK(&H7063);PEEK(1024)']);
  ok('$BA77: המסך נקי, ‏X=$0600 (וה-PRINT שאחריו מתחיל למעלה, ברווח)', /^ 1536  96 ?$/m.test(s) && !/XYZ/.test(s), show(tail(s)));
  // LDB #$41 / JSR $BA79 / RTS
  s = await run([...poke(0x7000, 'C641 BDBA79 39'), 'EXEC &H7000:PRINT:PRINT PEEK(1500)']);
  ok('$BA79: כל המסך בתו שב-B', /^ 65 ?$/m.test(s), show(tail(s)));
  // JSR $89AA / JSR $8E83 / STX $7062 / JSR $8E7E(פסיק ובית) / STB $7060 / RTS
  const prm = poke(0x7000, 'BD89AA BD8E83 BF7062 BD8E7E F77060 39');
  s = await run([...prm, 'EXEC &H7000,1234,200:PRINT PEEK(&H7062)*256+PEEK(&H7063);PEEK(&H7060)']);
  ok('EXEC עם פרמטרים: ‏$8E83 → X=1234, ‏$8E7E → B=200', /^ 1234  200 ?$/m.test(s), show(tail(s)));
  s = await run([...prm, 'EXEC &H7000,70000,1']);
  ok('$8E83: ‏70000 → ?FC', /\?FC ERROR/.test(s), show(tail(s)));
  s = await run([...prm, 'EXEC &H7000,1,256']);
  ok('$8E7E: ‏256 → ?FC', /\?FC ERROR/.test(s), show(tail(s)));
  // מחרוזת ב-$7080: HELLO 0. ‏LDX #$707F / JSR $90E5 / LDD #54321 / JSR $957A / RTS
  s = await run([...poke(0x7080, '48454C4C4F00'), ...poke(0x7000, '8E707F BD90E5 CCD431 BD957A 39'), 'EXEC &H7000:PRINT']);
  ok('$90E5 מדפיס מחרוזת מהזיכרון, ‏$957A מספר בלי סימן', /HELLO54321/.test(s), show(tail(s)));
  // JSR $A0EA / STA $7060 / RTS — המקש הבא בתור
  s = await run([...poke(0x7000, 'BDA0EA B77060 39'), 'EXEC &H7000', 'Q', 'PRINT PEEK(&H7060)']);
  ok('$A0EA: מחכה למקש ומחזיר אותו, בלי הד', /^ 81 ?$/m.test(s) && !/^Q$/m.test(s), show(tail(s)));
  // JSR $841F / JMP $849F: מריצים את התוכנית מקוד מכונה
  s = await run([...poke(0x7000, 'BD841F 7E849F'), '10 PRINT "RAN";2+3', 'EXEC &H7000']);
  ok('$841F ואז $849F: התוכנית רצה', /^RAN 5 ?$/m.test(s), show(tail(s)));
  // הדרך של אז להוסיף פקודה: ה-JMP שב-RAM ($A9-$AA) מופנה לקוד שלנו, שחוזר ל-$BB26.
  // הקוד סופר תווים: INC $7060 / JMP $BB26. ההתקנה: LDD #$7100 / STD <$A9 / RTS
  s = await run([...poke(0x7100, '7C7060 7EBB26'), ...poke(0x7010, 'CC7100 DDA9 39'),
    'POKE &H7060,0:EXEC &H7010:PRINT "OK2";PEEK(&H7060)>0;2*3']);
  ok('$BB26: קוד שמחובר ל"קרא את התו הבא" רץ, ו-BASIC ממשיך לעבוד', /^OK2-1  6 ?$/m.test(s), show(tail(s)));

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
