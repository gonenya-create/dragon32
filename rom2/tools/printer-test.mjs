// בדיקות המדפסת, TAB(, ההתחלה החמה ונקודות החיבור (שלב 3 חלק 6) מול המפרט (docs/DRAGON-SPEC-PRINTER-DLOAD-HOOKS.md).
// הרצה: node rom2/tools/printer-test.mjs
// מה שהמדפסת מקבלת נאסף בקובץ (XRoar: -lp-file), בית אחרי בית.
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runRom } from './xr2.mjs';

let pass = 0, fail = 0;
const ok = (name, cond, info = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${info}`); }
};
const dir = await mkdtemp(join(tmpdir(), 'dragon32-lp-'));
let n = 0;
// lp: מריץ שורות ומחזיר { screen, out } — out = מה שהגיע למדפסת, כמחרוזת
async function lp(lines) {
  const f = join(dir, `lp${n++}.txt`);
  const s = await runRom(lines, { timeout: 10, xroarArgs: ['-lp-file', f] });
  const out = existsSync(f) ? (await readFile(f)).toString('latin1') : '';
  return { screen: s.screen, out };
}
const show = s => JSON.stringify(s);
const lastNums = s => s.trim().split('\n').filter(l => /^[ \d-]+$/.test(l) && l.trim()).at(-1)?.trim().split(/\s+/).map(Number);

try {
  console.log('PRINT #-2 (1.4, 1.7)');
  let r = await lp(['PRINT #-2,"AB"']);
  ok('PRINT #-2,"AB": A B CR (בלי LF)', r.out === 'AB\r', show(r.out));
  r = await lp(['PRINT #-2']);
  ok('PRINT #-2 ריק: רווח ואז CR', r.out === ' \r', show(r.out));
  r = await lp(['PRINT #-2,1;-2', 'PRINT #-2,1,2']);
  ok('מספרים: רווח אחרי מספר, אבל לא לפני פסיק; הפסיק עד 16', r.out === ' 1 -2 \r 1' + ' '.repeat(14) + ' 2 \r', show(r.out));
  r = await lp(['PRINT #-2,"X";TAB(5);"Y";TAB(2);"Z"']);
  ok('TAB(5) ואז TAB(2) שכבר עבר: כלום', r.out === 'X    YZ\r', show(r.out));
  r = await lp([`PRINT #-2,STRING$(120,"A"),"B"`]);
  ok('פסיק אחרי השדה האחרון (116): סוף שורה', r.out === 'A'.repeat(120) + '\rB\r', show(r.out.slice(110)));
  r = await lp(['PRINT #-2,"A";CHR$(7);"B";:PRINT POS(-2)']);
  ok('תו בקרה נשלח ולא מזיז את המקום (POS(-2) = 2)', r.out === 'A\x07B' && lastNums(r.screen)[0] === 2, show(r.out) + r.screen);
  r = await lp([`PRINT #-2,STRING$(132,"A");:PRINT POS(-2)`, 'PRINT #-2']);
  ok('שורה מלאה (132) עם $0148≠0: המקום חוזר ל-0 בלי CR; אחר כך סוף שורה = רווח ו-CR',
    r.out === 'A'.repeat(132) + ' \r' && lastNums(r.screen)[0] === 0, show(r.out.slice(128)) + r.screen);
  r = await lp(['POKE 328,0', `PRINT #-2,STRING$(133,"A")`]);
  ok('$0148=0: בשורה מלאה נשלח סוף שורה', r.out === 'A'.repeat(132) + '\rA\r', show(r.out.slice(128)));
  r = await lp(['POKE 330,2', 'PRINT #-2,"A"']);
  ok('$014A=2: סוף השורה CR LF', r.out === 'A\r\n', show(r.out));
  r = await lp(['POKE 330,0', 'PRINT #-2,"A"']);
  ok('$014A=0: סוף שורה לא שולח כלום', r.out === 'A', show(r.out));
  r = await lp(['POKE 155,10', 'PRINT #-2,"ABCDEFGHIJKL"']);
  ok('רוחב 10 ($9B)', r.out === 'ABCDEFGHIJKL\r', show(r.out));
  r = await lp(['PRINT #-2,USING "##.#";1.25;3']);
  ok('PRINT #-2,USING', r.out === ' 1.3 3.0\r', show(r.out));

  console.log('LLIST (1.8)');
  r = await lp(['10 PRINT "A"', '20 REM X', 'LLIST']);
  ok('LLIST: כל שורה, CR ביניהן ובסוף', r.out === '10 PRINT "A"\r20 REM X\r', show(r.out));
  ok('LLIST: OK על המסך', /LLIST\nOK$/.test(r.screen.trimEnd()), r.screen);
  r = await lp(['10 PRINT 1', '20 PRINT 2', '30 PRINT 3', 'LLIST 20-']);
  ok('LLIST 20-', r.out === '20 PRINT 2\r30 PRINT 3\r', show(r.out));
  r = await lp(['LLIST']);
  ok('LLIST בלי תוכנית: כלום', r.out === '', show(r.out));
  r = await lp(['PRINT #-2,"AB";', '10 REM', 'LLIST']);
  ok('LLIST כשהראש לא בתחילת שורה: קודם CR', r.out === 'AB\r10 REM\r', show(r.out));

  console.log('שגיאות והתקנים (1.9)');
  r = await lp(['10 INPUT #-2,A', 'RUN']);
  ok('INPUT #-2: ?FM', r.screen.includes('?FM ERROR'), r.screen);
  r = await lp(['PRINT EOF(-2)']);
  ok('EOF(-2): ?FM', r.screen.includes('?FM ERROR'), r.screen);
  r = await lp(['OPEN "O",#-2,"X":CLOSE #-2:PRINT "Y"']);
  ok('OPEN "O" / CLOSE #-2: כלום', r.screen.includes('\nY\n') && r.out === '', r.screen);
  r = await lp(['PRINT #-2,"A";:X=1/0', 'PRINT "B"']);
  ok('שגיאה באמצע: ההודעה למסך, ו-PRINT הבא למסך', r.screen.includes('?/0 ERROR') && r.screen.includes('\nB\n') && r.out === 'A', show(r.out) + r.screen);
  r = await lp(['PRINT PEEK(153);PEEK(154);PEEK(155);PEEK(156);PEEK(328);PEEK(330);PEEK(331);PEEK(332)']);
  ok('ערכי ההדלקה: 16 116 132 0, $0148=255, ‏1 13 10', lastNums(r.screen).join(' ') === '16 116 132 0 255 1 13 10', r.screen);

  console.log('המסך: TAB, LIST (4.2, 1.8)');
  r = await lp(['PRINT TAB(40);"X"']);
  ok('TAB(40) מעמודה 0: הרווחים גולשים לשורה הבאה (X בעמודה 8)', /\n {8}X\n/.test(r.screen), show(r.screen));
  r = await lp(['PRINT "AB";TAB(1);"C"']);
  ok('TAB אחורה: כלום, בלי שורה חדשה', r.screen.includes('\nABC\n'), r.screen);
  r = await lp(['PRINT TAB(300)']);
  ok('TAB(300): ?FC', r.screen.includes('?FC ERROR'), r.screen);
  r = await lp(['PRINT TAB(3']);
  ok('TAB(3 בלי סוגר: ?SN', r.screen.includes('?SN ERROR'), r.screen);
  r = await lp(['10 REM' + 'X'.repeat(26), '20 REM', 'LIST']);
  ok('LIST: שורה של בדיוק 32 תווים בלי שורה ריקה אחריה', r.screen.includes('LIST\n10 REM' + 'X'.repeat(26) + '\n20 REM\nOK'), show(r.screen));
  r = await lp(['10 LIST', '20 PRINT "NO"', 'RUN']);
  ok('LIST בתוכנית: עוצר ב-OK (כמו במקור)', !r.screen.includes('\nNO') && r.screen.trimEnd().endsWith('OK'), r.screen);

  console.log('ההתחלה החמה ונקודות החיבור (3.1-3.6, 7.4)');
  r = await lp(['10 PRINT "KEPT"', 'A=5', 'EXEC PEEK(49150)*256+PEEK(49151)', 'LIST', 'PRINT A']);
  ok('RESET חם: התוכנית והמשתנים נשמרים', r.screen.includes('10 PRINT "KEPT"') && lastNums(r.screen)[0] === 5, r.screen);
  r = await lp(['PRINT PEEK(113);PEEK(PEEK(114)*256+PEEK(115))']);
  ok('$71 = $55 ו-NOP ($12) בכתובת שב-$72', lastNums(r.screen).join(' ') === '85 18', r.screen);
  r = await lp(['S=0:FOR I=350 TO 424:S=S+PEEK(I):NEXT:PRINT S']);
  ok('$015E-$01A8: ‏75 × $39', lastNums(r.screen)[0] === 75 * 57, r.screen);
  r = await lp(['FOR I=49138 TO 49149 STEP 2:PRINT PEEK(I)*256+PEEK(I+1);:NEXT']);
  ok('וקטורי המעבד דרך ה-RAM: $0100 $0103 $010F $010C $0106 $0109', lastNums(r.screen).join(' ') === '256 259 271 268 262 265', r.screen);
  r = await lp(['PRINT PEEK(268);PEEK(271);PEEK(288);PEEK(293);PEEK(298)']);
  ok('$010C/$010F = JMP; מתאר 0: ‏78 מילות פקודה, 34 פונקציות; מתאר 1: 0', lastNums(r.screen).join(' ') === '126 126 78 34 0', r.screen);
} finally {
  await rm(dir, { recursive: true, force: true });
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
