// בדיקה ל"בדיקת התוכנית" (assets/dragon/analyze.js): תוכניות קטנות עם טעות ידועה, ומה הבודק צריך למצוא. רצה ב-node.
import { analyze } from '../assets/dragon/analyze.js';
let bad = 0;
const t = (name, prog, want, kind = 'bug') => {
  const f = analyze(prog), hit = f.find(x => x.kind === kind && want.test(x.text));
  if (!hit) bad++;
  console.log((hit ? '  ✓ ' : '  ✗ ') + name + (hit ? '' : '\n      | ' + f.map(x => x.kind + ': ' + x.text).join('\n      | ')));
};
const none = (name, prog) => { const f = analyze(prog).filter(x => x.kind === 'bug'); if (f.length) bad++; console.log((f.length ? '  ✗ ' : '  ✓ ') + name + (f.length ? ' | ' + f[0].text : '')); };
console.log('analyze (בדיקת התוכנית)');
t('FOR + GOTO back instead of NEXT', '10 FOR I=1 TO 5\n20 PRINT I\n30 GOTO 10\n40 END', /30 NEXT I/);
t('FOR without NEXT', '10 FOR I=1 TO 5\n20 PRINT I', /אין NEXT/);
t('NEXT without FOR', '10 PRINT 1\n20 NEXT I', /אין לפניו FOR/);
t('crossed loops', '10 FOR I=1 TO 3\n20 FOR J=1 TO 3\n30 NEXT I\n40 NEXT J', /משתלבות/);
t('jump to a missing line', '10 GOTO 99', /שורה 99/);
t('GOSUB without RETURN', '10 GOSUB 100\n20 END\n100 PRINT "X"', /אין RETURN/);
t('falls into a subroutine', '10 GOSUB 100\n20 PRINT "BACK"\n100 PRINT "SUB"\n110 RETURN', /END/, 'tip');
t('string compare without quotes', '10 INPUT "Y/N";A$\n20 IF A$=YES THEN 10', /מרכאות/);
t('number into a string variable', '10 A$=5', /\$/);
t('endless loop advice', '10 CLS\n20 PRINT "HI"\n30 GOTO 20', /לא תיגמר/, 'tip');
t('two names, same first letters', '10 SCORE=1\n20 SCALE=2\n30 PRINT SCORE', /SCORE ו-SCALE/, 'tip');
none('a correct program has no bugs', '10 CLS\n20 FOR I=1 TO 5\n30 PRINT I\n40 NEXT I\n50 END');
none('the guess game has no bugs', '10 CLS\n20 N=RND(100):T=0\n30 INPUT "GUESS";G\n40 T=T+1\n50 IF G<N THEN PRINT "UP":GOTO 30\n60 IF G>N THEN PRINT "DOWN":GOTO 30\n70 PRINT "YES";T');
console.log(bad ? `\n${bad} analyze checks failed` : '\nanalyze ok');
process.exit(bad ? 1 : 0);
