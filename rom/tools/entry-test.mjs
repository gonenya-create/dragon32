// בדיקות הכתובות הקבועות של המקור (src/islands.s), מול docs/DRAGON-SPEC-ENTRIES.md ו-docs/DRAGON-RESEARCH-ERA.md.
// כל בדיקה מכניסה לזיכרון תוכנית מכונה קטנה שלנו (לא מהמקור), שקוראת לכתובת, ובודקת מה BASIC מראה.
// הרצה: node rom/tools/entry-test.mjs
import { readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
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
ok('כניסות באמצע גוש: ‏$8E51 $8E54 $8E7E $8E83 $8E86 מתחילות בפקודה (JSR), ‏$8E81 BRA', [0x8E51, 0x8E54, 0x8E7E, 0x8E83, 0x8E86].every(a => at(a) === 0xBD) && at(0x8E81) === 0x20);
for (const a of [...src.matchAll(/@island \$([0-9A-F]{4})/gi)].map(m => parseInt(m[1], 16)))
  ok(`$${a.toString(16).toUpperCase()}: לא ריק`, at(a) !== 0xFF && at(a) !== 0x00);

console.log('הטבלאות במקום של המקור (קורא 3)');
const word = (a, s) => [...s].every((c, i) => at(a + i) === (c.charCodeAt(0) | (i === s.length - 1 ? 0x80 : 0)));
const w16 = a => at(a) * 256 + at(a + 1);
ok('$8033: שמות הפקודות, מ-FOR', word(0x8033, 'FOR') && word(0x8036, 'GO'));
ok('$8154: כתובות הפקודות (59)', w16(0x8154) >= 0x8000 && w16(0x8154 + 58 * 2) >= 0x8000 && !word(0x81CA - 1, 'X'));
ok('$81CA: שמות הפונקציות, מ-SGN, ו-USR אחרון', word(0x81CA, 'SGN') && word(0x824D, 'USR'));
ok('$8250: כתובות הפונקציות (34), כתובות רגילות', [...Array(34).keys()].every(i => w16(0x8250 + 2 * i) >= 0x8000 && w16(0x8250 + 2 * i) < 0xC000));
ok('$8294: טבלת הפעולות: 121 121 123 123 127 80 70', [121, 121, 123, 123, 127, 80, 70].every((p, i) => at(0x8294 + 3 * i) === p));
ok('$82A9: קודי השגיאה, מ-NF עד NE', String.fromCharCode(...rom.subarray(0x02A9, 0x02DF)) === 'NFSNRGODFCOVOMULBSDD/0IDTMOSLSSTCNUFFDAODNIOFMNOIEDSNE');
ok('$82DF " ERROR" ו-$82E6 " IN "', String.fromCharCode(...rom.subarray(0x02DF, 0x02EB)) === ' ERROR\0 IN \0');

let s;
try {
  s = await run(['PRINT PEEK(&H120);PEEK(&H121)*256+PEEK(&H122);PEEK(&H123)*256+PEEK(&H124);PEEK(&H125);PEEK(&H126)*256+PEEK(&H127);PEEK(&H128)*256+PEEK(&H129)']);
  ok('המתאר ב-$0120 מצביע על הטבלאות: 78 $8033 $8154, ‏34 $81CA $8250', s.replace(/\n/g, '').includes(' 78  32819  33108  34  33226  33360'), show(tail(s)));
  console.log('USR: ‏$8B2D (מספר מ-BASIC) ו-$8C37 (תוצאה ל-BASIC)');
  // JSR $8B2D / ADDD #1 / JMP $8C37
  const usr1 = [...poke(0x7000, 'BD8B2D C30001 7E8C37'), 'DEFUSR0=&H7000'];
  s = await run([...usr1, 'PRINT USR(5);USR(-1.5);USR(-32768);USR(32767.9)']);
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

  // הרחבה שמחליפה את טבלת הפקודות דרך המתאר ב-RAM (כמו במקור): עותק של $8154 ב-$7000, PRINT מופנה לשגרה
  // שמדפיסה "!" (LDA #$21 / JMP $B54A), ו-$0123 מצביע לעותק (LDD #$7000 / STD $0123 / RTS)
  s = await run(['FOR I=0 TO 117:POKE &H7000+I,PEEK(&H8154+I):NEXT', ...poke(0x7100, '8621 7EB54A'), 'POKE &H700E,&H71:POKE &H700F,0',
    ...poke(0x7200, 'CC7000 FD0123 39'), 'EXEC &H7200:PRINT:PRINT'], { timeout: 20 });
  ok('הרחבה מחליפה את טבלת הפקודות דרך $0123: ‏PRINT מדפיס "!"', /^!! ?$/m.test(s), show(tail(s)));

  console.log('הפסיקה: ‏$9D3D');
  // פסיקה של המשתמש: INC $7060 / JMP $9D3D. ההתקנה במכונה, עם פסיקות חסומות:
  // ORCC #$50 / LDX #$7040 / STX $010D / ANDCC #$AF / RTS
  s = await run([...poke(0x7040, '7C7060 7E9D3D'), ...poke(0x7030, '1A50 8E7040 BF010D 1CAF 39'),
    'POKE &H7060,0:EXEC &H7030:T=TIMER:FOR I=1 TO 400:NEXT:D=TIMER-T:C=PEEK(&H7060)',
    'PRINT D>10;ABS(D-C)<=1']);
  ok('הפסיקה של המשתמש רצה בכל שדה, ו-TIMER ממשיך לספור', /^-1 -1 ?$/m.test(s), show(tail(s)));

  console.log('טעינה מכתובת: ‏$B75B');
  // כמו הטוען של Athletyx: LDX #$7100 / JSR $B75B / RTS. על הקלטת: שני בלוקי נתונים בלי כותרת, ואז בלוק סוף
  // שיש בו נתונים (ההמשך שלהם נטען גם הוא), ואחריו עוד בלוק שלא אמור להיטען
  const blk = (type, data) => { const b = Buffer.from([0x55, 0x3C, type, data.length, ...data]); return Buffer.concat([b, Buffer.from([(type + data.length + data.reduce((a, c) => a + c, 0)) & 255])]); };
  const lead = n => Buffer.alloc(n, 0x55);
  const cas = join(tmpdir(), `b75b-${process.pid}.cas`);
  await writeFile(cas, Buffer.concat([lead(128), blk(1, [11, 22]), lead(15), blk(1, [33]), lead(15), blk(255, [44]), lead(128), blk(1, [99]), lead(16)]));
  try {
    s = await run([...poke(0x7000, '8E7100 BDB75B 39'), 'POKE &H7104,7:EXEC &H7000', 'PRINT PEEK(&H7100);PEEK(&H7101);PEEK(&H7102);PEEK(&H7103);PEEK(&H7104)'], { tapeLoad: cas, timeout: 20 });
  } finally { await rm(cas, { force: true }); }
  ok('הבלוקים נטענים ברצף לכתובת שב-X, עד בלוק הסוף (כולל הנתונים שבו), והבלוק שאחריו לא', /^ 11 {2}22 {2}33 {2}44 {2}7 ?$/m.test(s), show(tail(s)));

  console.log('נקודתיים ב-‏$84AF');
  // הטוען של Microdeal (Cuthbert in the Jungle) מפנה את מצביע הטקסט ל-$84AF, ושם יש במקור ':' (האופרנד של CMPA #':)
  s = await run(['PRINT PEEK(&H84AF)']);
  ok('$84AF מכיל את התו נקודתיים (58), כמו במקור', /^ 58 ?$/m.test(s), show(tail(s)));

  console.log('שורה מהמקלדת: ‏$B5C9, ומקש: ‏$B538');
  // כמו El Diablero (Ken Kalish): JSR $B5C9, ואז שומרים את CC, B, X והתווים $02DD ו-$02E2 (לפני שהשורה הבאה דורסת את המאגר).
  // השורה HELLO מוקלדת לתוכנית
  s = await run([...poke(0x7000, 'BDB5C9 1FA8 B77083 F77080 BF7081 B602DD B77084 B602E2 B77085 39'), 'EXEC &H7000', 'HELLO',
    'PRINT PEEK(&H7084);PEEK(&H7085);PEEK(&H7080);PEEK(&H7081)*256+PEEK(&H7082);PEEK(&H7083) AND 5']);
  ok('$B5C9 קורא שורה ל-$02DD עם אפס בסוף, ומחזיר B = התווים + 1, X = $02DC, Z=1 ו-C=0 (קורא 30.10)', /^ 72 {2}0 {2}6 {2}732 {2}4 ?$/m.test(s), show(tail(s)));
  // JSR $B538 / STA $7080 / RTS: מחכה למקש ומחזיר אותו ב-A
  s = await run([...poke(0x7000, 'BDB538 B77080 39'), 'EXEC &H7000', 'Q', 'PRINT PEEK(&H7080)']);
  ok('$B538 מחכה למקש ומחזיר אותו ב-A (קורא 30.10)', /^ 81 ?$/m.test(s), show(tail(s)));

  console.log('Black Sanctum ו-Calixto Island (3.11): ‏$B505, ‏$B5C6, ‏$BA6B, ‏$B45C');
  // JSR $B505 / STA $7080 / STX $7081 / RTS: מקש בלי ביט 7, בלי הד, X נשמר (X = $1234 לפני)
  s = await run([...poke(0x7000, '8E1234 BDB505 B77080 BF7081 39'), 'EXEC &H7000', 'Q', 'PRINT PEEK(&H7080);PEEK(&H7081)*256+PEEK(&H7082)']);
  ok('$B505 מחכה למקש ומחזיר אותו ב-A, ו-X נשמר (קורא 3.11)', /^ 81  4660 ?$/m.test(s), show(tail(s)));
  // JSR $B5C6: כמו $B5C9, אחרי ה-hook של $0182 (בהדלקה: RTS)
  s = await run([...poke(0x7000, 'BDB5C6 F77080 B602DD B77084 39'), 'EXEC &H7000', 'HELLO', 'PRINT PEEK(&H7084);PEEK(&H7080)']);
  ok('$B5C6 קורא שורה ל-$02DD ומחזיר B = התווים + 1 (קורא 3.11)', /^ 72  6 ?$/m.test(s), show(tail(s)));
  // LDB #n / JSR $BA6B / STX $7062 / RTS: המסך כולו בצבע, X = $0600. התא האחרון: 1 = ירוק ($8F), 0 = שחור ($80), 5 = $CF
  for (const [n, v] of [[1, 143], [0, 128], [5, 207]]) {
    s = await run([...poke(0x7000, `C6${n.toString(16).padStart(2, '0')} BDBA6B BF7062 39`), 'EXEC &H7000:PRINT PEEK(&H7062)*256+PEEK(&H7063);PEEK(1535)']);
    ok(`$BA6B עם B=${n}: המסך בצבע (${v}), ‏X=$0600 (קורא 3.11)`, new RegExp(`^ 1536  ${v} ?$`, 'm').test(s), show(tail(s)));
  }
  // JMP $B45C: מסך נקי, OK, ו-BASIC ממשיך (התוכנית נשמרת)
  s = await run([...poke(0x7000, '7EB45C'), '10 PRINT "KEPT"', 'PRINT "XYZ":EXEC &H7000', 'RUN']);
  ok('$B45C: חזרה ל-BASIC עם מסך נקי, והתוכנית נשמרת (קורא 3.11)', /^KEPT ?$/m.test(s) && !/XYZ/.test(s), show(tail(s)));

  console.log('סימן ה-Dragon ב-‏$B4B3');
  // Star Spores (Microdeal) קורא את המילה ב-$B4B3: $2843 אומר Dragon (ואז מפת המקלדת של ה-Dragon). אחרת הוא חושב שזה CoCo
  s = await run(['PRINT PEEK(&HB4B3);PEEK(&HB4B4)']);
  ok('$B4B3 מכיל $28,$43 (40 67), כמו שתוכנות של אז מצפות ב-Dragon', /^ 40 {2}67 ?$/m.test(s), show(tail(s)));
  // PLAY עדיין עובד אחרי השינוי שם (O, V, L, T, P, X והתו עצמו)
  s = await run(['PLAY "T200O2V20L8CDEP8;O3V31L16.C;O+C;O-V-V+T-T+L4C"', 'PRINT "PLAYOK"']);
  ok('PLAY רץ ונגמר אחרי השינוי באזור $B4B3', /^PLAYOK ?$/m.test(s) && !/ERROR/.test(s), show(tail(s)));

  console.log('הקבוצה הראשונה של כתובות המקור החסרות (קורא 2.11)');
  // $837D: הפקודה שב-X+1, בלי לקרוא שורה (Monsters & Magic ו-Ket שולחים כך " RUN"). כאן " ?123"
  s = await run([...poke(0x7000, '8E700A 4F 7E837D 000000 203F313233 00'), 'EXEC &H7000']);
  ok('$837D מבצע את הפקודה שב-X+1 (" ?123" מדפיס 123)', /^ 123 ?$/m.test(s), show(tail(s)));
  // $BDCF: המנוע דולק (ביט 3 של $FF21), ואז השהיה, וחוזרים (Galactic Gus, Crazy Foota 2)
  s = await run([...poke(0x7000, 'BDBDCF 39'), 'EXEC &H7000:PRINT PEEK(&HFF21) AND 8', 'MOTOR OFF']);
  ok('$BDCF מדליק את המנוע וחוזר', /^ 8 ?$/m.test(s), show(tail(s)));
  // $BAA5: צליל כשהטון ב-$8C והמשך ב-$8D/$8E, עם הפסיקות פתוחות (Dragon Invaders, Katerpillar Attack). חוזר כשהמשך נגמר
  s = await run([...poke(0x7000, '8680 978C CC000A DD8D 1CEF 5F BDBAA5 39'), 'EXEC &H7000:PRINT PEEK(&H8D)*256+PEEK(&H8E);"END"']);
  ok('$BAA5 מנגן את הצליל וחוזר כשהמשך ב-$8D/$8E נגמר', /^ 0 END ?$/m.test(s), show(tail(s)));

  console.log('הקבוצה השנייה (קורא 2.11)');
  // $8B27: ‏D → FAC דרך $8C37, ואז $8B27 מחזיר את המספר ב-D (Ket, Immortal Strain). שלילי: ?FC
  s = await run([...poke(0x7000, 'CC04D2 BD8C37 BD8B27 FD7080 39'), 'EXEC &H7000:PRINT PEEK(&H7080)*256+PEEK(&H7081)']);
  ok('$8B27 מחזיר את המספר החיובי ב-D (1234)', /^ 1234 ?$/m.test(s), show(tail(s)));
  s = await run([...poke(0x7000, 'CCFFFB BD8C37 BD8B27 39'), 'EXEC &H7000']);
  ok('$8B27 עם מספר שלילי: ?FC', /\?FC ERROR/.test(s), show(tail(s)));
  // $85A8: ‏RUN בלי מספר שורה חוזר לקורא עם מחסנית חדשה ו-TXTPTR לפני התוכנית; הקורא קופץ ל-$849F והתוכנית רצה (Ket, Eddie Steady Go!)
  s = await run(['10 PRINT "RUN85"', ...poke(0x7000, 'BD85A8 7E849F'), 'EXEC &H7000']);
  ok('$85A8 ואחריו $849F מריצים את התוכנית מההתחלה', /^RUN85 ?$/m.test(s) && !/ERROR/.test(s), show(tail(s)));
  // $991B: ‏CSAVEM אחרי הארגומנטים: השם ב-$01D2, הכתובות בכותרת, ההתחלה ב-S+4 והסוף ב-S+2; חוזר דרך המילה שב-S+6 (ישר ל-BASIC)
  const cas2 = join(tmpdir(), "d32-991b.cas");
  await rm(cas2, { force: true });
  s = await run([...poke(0x7100, '01020304'), ...poke(0x01D2, '4142432020202020'), ...poke(0x01E5, '7100 7100'),
    ...poke(0x7000, '8E7100 3410 8E7103 3410 BD991B 39'), 'EXEC &H7000:PRINT "SAVED"'], { tapeWrite: cas2, timeout: 20 });
  const tb = await readFile(cas2).catch(() => Buffer.alloc(0));
  const h = tb.indexOf(Buffer.from([0x3c, 0x00, 0x0f, 0x41, 0x42, 0x43]));
  const d = tb.indexOf(Buffer.from([0x3c, 0x01, 0x04, 0x01, 0x02, 0x03, 0x04]));
  ok('$991B כותב כותרת ABC (סוג 2, ‏$7100) ובלוק עם 1 2 3 4, וחוזר ל-BASIC', /^SAVED ?$/m.test(s) && h >= 0 && tb[h + 11] === 2 && tb[h + 14] === 0x71 && tb[h + 16] === 0x71 && d > h, show(tail(s)) + ' ' + h + ' ' + d);
  // $A08E: ‏CLOADM מהטקסט שב-TXTPTR: מדלג על ה-M וקורא "ABC" (Java Star, Music Maker). ‏$A092: בלי הדילוג (המצביע כבר על המרכאות)
  const ld = (entry, ptr) => [...poke(0x7080, '4D2241424322 00'), 'POKE &H7100,0:POKE &H7103,0',
    ...poke(0x7000, `9EA6 3410 8E${ptr} 9FA6 BD${entry} 3510 9FA6 39`), 'EXEC &H7000:PRINT PEEK(&H7100);PEEK(&H7103)'];
  s = await run(ld('A08E', '7080'), { tapeLoad: cas2, timeout: 30 });
  ok('$A08E טוען את ABC מהקלטת (1 ו-4 ב-$7100 וב-$7103)', /F ABC +1 {2}4 ?$/m.test(s), show(tail(s)));
  s = await run(ld('A092', '7081'), { tapeLoad: cas2, timeout: 30 });
  ok('$A092 טוען את ABC כשהמצביע כבר על המרכאות', /F ABC +1 {2}4 ?$/m.test(s), show(tail(s)));
  await rm(cas2, { force: true });

  console.log('שמירה וטעינה של משחק, כמו ב-Black Sanctum וב-Calixto Island (3.11): ‏$B7C2, ‏$B6A8, ‏$B87A');
  // LDX #$7080 / LDB #3 / JSR $B7C2: ‏FNLEN = 3 והשם XYZ ב-$01D2. בסוף B = 0
  s = await run([...poke(0x7080, '58595A'), ...poke(0x7000, '8E7080 C603 BDB7C2 F77090 39'), 'EXEC &H7000:PRINT PEEK(&H1D1);PEEK(&H1D2);PEEK(&H1D4);PEEK(&H7090)']);
  ok('$B7C2 מעתיק B בתים מ-X לשם ($01D2) וקובע את האורך ($01D1), ו-B = 0 בסוף', /^ 3  88  90  0 ?$/m.test(s), show(tail(s)));
  // $B6A8: הסוג ב-A (2), הדגלים ב-X (0), השם GAME, ושומר מ-[$19] עד [$1B] בלי הסוף. TXTTAB ו-VARTAB חוזרים אחר כך
  const cas3 = join(tmpdir(), "d32-b6a8.cas");
  await rm(cas3, { force: true });
  s = await run([...poke(0x7100, '01020304'), ...poke(0x01D2, '47414D4520202020'), ...poke(0x01E5, '7100 7100'),
    ...poke(0x7000, '9E19 3410 9E1B 3410 8E7100 9F19 8E7104 9F1B 8602 8E0000 BDB6A8 3510 9F1B 3510 9F19 39'), 'EXEC &H7000:PRINT "SAVED"'], { tapeWrite: cas3, timeout: 20 });
  const tg = await readFile(cas3).catch(() => Buffer.alloc(0));
  const hg = tg.indexOf(Buffer.from([0x3c, 0x00, 0x0f, 0x47, 0x41, 0x4d, 0x45]));
  const dg = tg.indexOf(Buffer.from([0x3c, 0x01, 0x04, 0x01, 0x02, 0x03, 0x04]));
  ok('$B6A8 כותב כותרת GAME (סוג 2, בלי ASCII ובלי פערים) ובלוק של 4 בתים, בלי הסוף ($7104), וחוזר', /^SAVED ?$/m.test(s) && hg >= 0 && tg[hg + 11] === 2 && tg[hg + 12] === 0 && tg[hg + 13] === 0 && dg > hg, show(tail(s)) + ' ' + hg + ' ' + dg);
  // $B87A ואחריו $B75B, כמו בטעינת משחק שמור: מוצאים את GAME, ואז הבלוקים ל-$7200. ‏$79 = 0 ו-$7A = $01DA
  s = await run(['POKE &H7200,0:POKE &H7203,0', ...poke(0x01D1, '04 47414D4520202020'), ...poke(0x7000, 'BDB87A 8E7200 BDB75B 39'),
    'EXEC &H7000:PRINT PEEK(&H7200);PEEK(&H7203);PEEK(&H79);PEEK(&H7A)*256+PEEK(&H7B)'], { tapeLoad: cas3, timeout: 30 });
  ok('$B87A מוצא את GAME בקלטת ($79 = 0, ‏$7A = $01DA), ו-$B75B טוען אחריו את הבלוקים ל-$7200', / 1  4  0  474 ?$/m.test(s), show(tail(s)));
  await rm(cas3, { force: true });

  console.log('Cave Hunter (3.11): ‏$BAF1, ‏$BAD4, ‏$BAD6');
  // LDB #1 / JSR $BAF1: ביט 3 של $FF01 דולק, של $FF03 כבוי. אחר כך LDB #4 / JSR $BAF1: שניהם כבויים (ה-DAC)
  s = await run([...poke(0x7000, 'C601 BDBAF1 B6FF01 B77080 B6FF03 B77081 C604 BDBAF1 B6FF01 B77082 B6FF03 B77083 39'), 'EXEC &H7000:PRINT PEEK(&H7080) AND 8;PEEK(&H7081) AND 8;PEEK(&H7082) AND 8;PEEK(&H7083) AND 8']);
  ok('$BAF1 בוחר את מקור הצליל מ-B (ביט 0 ל-$FF01, ביט 1 ל-$FF03; B=4: שניהם כבויים) (קורא 3.11)', /^ 8  0  0  0 ?$/m.test(s), show(tail(s)));
  // טון $F0 ב-$8C / LDA #$55 / JSR $BAD6 / STA $7080 / JSR $BAD4 / STA $7081: חוזרות עם A = 0, ו-B נשמר ($33)
  s = await run([...poke(0x7000, '86F0 978C C633 8655 BDBAD6 B77080 BDBAD4 B77081 F77082 39'), 'EXEC &H7000:PRINT PEEK(&H7080);PEEK(&H7081);PEEK(&H7082)']);
  ok('$BAD6 ו-$BAD4 כותבים ל-DAC, מחכים לפי הטון, וחוזרים עם A = 0 ו-B שמור (קורא 3.11)', /^ 0  0  51 ?$/m.test(s), show(tail(s)));

  console.log('Synther 7 (3.11): ‏$B663');
  // $6F = 5 (לא קלטת), ‏$78 = 1: ‏JSR $B663 מאפס רק את $6F, ו-X ו-B נשמרים. אחר כך $6F = $FF (קלטת לקריאה): גם $78 מתאפס
  s = await run([...poke(0x7000, '8605 976F 8601 9778 8E1234 C656 BDB663 BF7080 F77082 966F B77083 9678 B77084 86FF 976F BDB663 9678 B77085 966F B77086 39'),
    'EXEC &H7000:PRINT PEEK(&H7080)*256+PEEK(&H7081);PEEK(&H7082);PEEK(&H7083);PEEK(&H7084);PEEK(&H7085);PEEK(&H7086)']);
  ok('$B663 סוגר את ההתקן שב-$6F: ‏$6F = 0 תמיד, ‏$78 מתאפס רק בקלטת, ו-X ו-B נשמרים (קורא 3.11)', /^ 4660  86  0  1  0  0 ?$/m.test(s), show(tail(s)));

  console.log('Telewriter (4.11): ‏$B58F');
  // ‏$6F = $FE (מדפסת): ‏$B58F כותב למסך בכל זאת, ו-U נשמר
  s = await run([...poke(0x7000, '86FE 976F CE1234 8648 BDB58F FF7080 0F6F 39'),
    'CLS:EXEC &H7000:A=PEEK(1024):PRINT A;PEEK(&H7080)*256+PEEK(&H7081)']);
  ok('$B58F כותב את התו למסך גם כשההתקן הוא המדפסת, ו-U נשמר (קורא 4.11)', /^H 72  4660 ?$/m.test(s), show(tail(s)));

  console.log('Airball (4.11): ‏$978E');
  // ‏Y ו-U נשמרים, והתוצאה ב-FAC קטנה מ-1 (המעריך עד $80)
  s = await run([...poke(0x7000, '108E1234 CE5678 BD978E 10BF7080 FF7082 964F B77084 39'),
    'EXEC &H7000:PRINT PEEK(&H7080)*256+PEEK(&H7081);PEEK(&H7082)*256+PEEK(&H7083);-(PEEK(&H7084)<=128)']);
  ok('$978E נותן שבר חדש ב-FAC, ו-Y ו-U נשמרים (קורא 4.11)', /^ 4660  22136  1 ?$/m.test(s), show(tail(s)));
  console.log("Junior's Revenge (4.11): ‏$B482");
  // השהיה: X סיבובים, X חוזר 0, ו-A, ‏B ו-Y נשמרים
  s = await run([...poke(0x7000, '8E1234 861F C6FF 108E5678 BDB482 BF7080 B77082 F77083 10BF7084 39'),
    'EXEC &H7000:PRINT PEEK(&H7080)*256+PEEK(&H7081);PEEK(&H7082);PEEK(&H7083);PEEK(&H7084)*256+PEEK(&H7085)']);
  ok('$B482 משהה: X חוזר 0, ו-A, ‏B ו-Y נשמרים (קורא 4.11)', /^ 0  31  255  22136 ?$/m.test(s), show(tail(s)));
  console.log("Junior's Revenge (5.11): ‏$B480");
  // חצי שנייה: X נטען מ-$8A (תמיד 0) ונופל ל-$B482. גם כש-X = $1234 לפני: X חוזר 0, ‏Z = 1 (נשמר ב-PSHS CC), ו-A, ‏B ו-Y נשמרים
  s = await run([...poke(0x7000, '8E1234 861F C6FF 108E5678 BDB480 3401 BF7080 B77082 F77083 10BF7084 3502 B77086 39'),
    'EXEC &H7000:PRINT PEEK(&H7080)*256+PEEK(&H7081);PEEK(&H7082);PEEK(&H7083);PEEK(&H7084)*256+PEEK(&H7085);PEEK(&H7086) AND 4']);
  ok('$B480 משהה חצי שנייה: X חוזר 0, ‏Z = 1, ו-A, ‏B ו-Y נשמרים (קורא 5.11)', /^ 0  31  255  22136  4 ?$/m.test(s), show(tail(s)));
  console.log('Picture Maker (6.11): ‏$99E6 $BCAB $A95D $A749 $AC87 $B238');
  // $99E6: מחרוזת שמסתיימת ב-0 (ב-X) למסך. X נעצר על ה-0, ו-A = 0
  s = await run([...poke(0x7100, '484900'), ...poke(0x7000, '8E7100 BD99E6 BF7080 B77082 39'),
    'CLS:EXEC &H7000:PRINT:PRINT PEEK(&H7080)*256+PEEK(&H7081);PEEK(&H7082)']);
  ok('$99E6 מדפיס עד ה-0: X על ה-0, ‏A = 0 (קורא 10.5)', /^HI\n 28930  0 ?$/m.test(s), show(tail(s)));
  // $A95D: מצב גרפי לפי PMODE (4 = GM 7), ו-A, ‏B ו-X נשמרים. ‏$BCAB: תו למסך הטקסט בלי לחזור למצב טקסט
  s = await run(['PMODE 4,1', ...poke(0x7000, '8E1234 CC5678 BDA95D BF7080 FD7082 B6FF22 B77084 8641 BDBCAB B6FF22 B77085 BF7086 39'),
    'CLS:EXEC &H7000:PRINT:PRINT PEEK(&H7080)*256+PEEK(&H7081);PEEK(&H7082)*256+PEEK(&H7083);PEEK(&H7084) AND 240;PEEK(&H7085) AND 240;PEEK(&H7086)*256+PEEK(&H7087)']);
  ok('$A95D עובר לגרפיקה ושומר A, ‏B ו-X; ‏$BCAB כותב A למסך ונשאר בגרפיקה, X נשמר (קורא 10.1, 10.6)', /^A\n 4660  22136  240  240  4660 ?$/m.test(s), show(tail(s)));
  // LINE, PAINT ו-CIRCLE מהכניסה של המפזר: $A6 על הטקסט (עם האסימונים), A = התו הראשון. ‏$A6 נשמר מסביב, כמו ב-Picture Maker
  const stmt = (a, text) => [...poke(0x7100, text), ...poke(0x7000, `DCA6 3406 8E7100 9FA6 A684 BD${a} 3510 9FA6 39`)];
  s = await run(['PMODE 4,1:PCLS', ...stmt('A749', '28302C3029 C4 2832302C323029 2C AC 00'), 'EXEC &H7000:A=PPOINT(10,10):B=PPOINT(10,0):PRINT A;B']);
  ok('$A749 (LINE) מצייר קו מ-(0,0) ל-(20,20) (קורא 10.4)', /^ 1  0 ?$/m.test(s), show(tail(s)));
  s = await run(['PMODE 4,1:PCLS', ...stmt('B238', '283132382C393629 2C 3230 00'), 'EXEC &H7000:A=PPOINT(148,96):B=PPOINT(128,96):PRINT A;B']);
  ok('$B238 (CIRCLE) מצייר עיגול ברדיוס 20 סביב (128,96) (קורא 10.3)', /^ 1  0 ?$/m.test(s), show(tail(s)));
  s = await run(['PMODE 3,1:PCLS:COLOR 4,1:LINE(10,10)-(30,30),PSET,B', ...stmt('AC87', '2832302C323029 2C 32 2C 34 00'), 'EXEC &H7000:A=PPOINT(20,20):B=PPOINT(40,40):PRINT A;B']);
  ok('$AC87 (PAINT) צובע בצבע 2 בתוך מלבן בצבע 4 (קורא 10.2)', /^ 2  1 ?$/m.test(s), show(tail(s)));
  // $B051 (13.11): DRAW מהכניסה של המפזר, כמו ש-Tanglewood מצייר את הטירה. המחרוזת: "BM50,150R146U104L146D104".
  // בלי שטח מחרוזות (CLEAR 0), כמו במשחק: המחרוזת לא מועתקת (strlit, ‏13.11)
  s = await run(['CLEAR 0,&H6FFF:PMODE 4,1:PCLS', ...stmt('B051', '22424D35302C31353052313436553130344C3134364431303422 00'), 'EXEC &H7000:A=PPOINT(120,150):B=PPOINT(196,100):C=PPOINT(120,46):D=PPOINT(50,100):E=PPOINT(120,100):PRINT A;B;C;D;E']);
  ok('$B051 (DRAW) מצייר מלבן מהמחרוזת שב-$A6 וחוזר (Tanglewood)', /^ 1  1  1  1  0 ?$/m.test(s), show(tail(s)));
} catch (e) {
  fail++; console.log('  ✗ ' + e.message);
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
