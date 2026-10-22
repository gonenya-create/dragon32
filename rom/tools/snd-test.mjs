// בדיקות הצליל (שלב 3 חלק 4) מול המודל שנכתב מהמפרט (sndmodel.mjs).
// הרצה: node rom/tools/snd-test.mjs
// הגל נמדד מיומן הריצה של XRoar (-trace -trace-timing): כל כתיבה ל-$FF20 והזמן שלה במחזורי מעבד.
import { runRom } from './xr2.mjs';
import { traceDac } from './sndtrace.mjs';
import { soundWave, soundPeriod, soundFields, soundArgOk } from './sndmodel.mjs';

let pass = 0, fail = 0;
const ok = (name, cond, info = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${info}`); }
};
const hex = n => '$' + n.toString(16).toUpperCase().padStart(2, '0');
const peek = s => s.trim().split('\n');

// 1. הגל והתדר (S-01): כל מרווח בלי פסיקה זהה למודל; מרווח עם פסיקה ארוך בדיוק בזמן הפסיקה
console.log('SOUND: הגל והתדר');
const irqCosts = new Set();
for (const tone of [1, 89, 100, 128, 200, 255]) {
  const { writes } = await traceDac([`SOUND ${tone},2`], 'sound_st', 0.5);
  const wave = soundWave(tone);
  let bad = '', checked = 0;
  for (let i = 0; i + 1 < writes.length; i++) {
    const want = wave[i % 4];
    if (writes[i].v !== want.v) { bad = `write ${i}: ${hex(writes[i].v)} != ${hex(want.v)}`; break; }
    const gap = writes[i + 1].t - writes[i].t - writes[i + 1].irq;
    if (gap !== want.cycles) { bad = `gap ${i}: ${gap} != ${want.cycles}`; break; }
    if (writes[i + 1].irq) irqCosts.add(writes[i + 1].irq);
    checked++;
  }
  const last = writes[writes.length - 1];
  if (!bad && (writes.length % 4 !== 0 || last.v !== 0)) bad = `ends after ${writes.length} writes on ${hex(last.v)}`;
  const hz = (888625 / soundPeriod(tone)).toFixed(1);
  ok(`SOUND ${tone},2: ${writes.length / 4} גלים, מחזור ${soundPeriod(tone)} (${hz} הרץ), ${checked} מרווחים`, !bad, bad);
}
console.log(`  (פסיקת השדה אצלנו: ${[...irqCosts].join('/')} מחזורים; במקור הקורא מעריך 105-125)`);

// 2. המשך (S-02): הפרש TIMER סביב הפקודה = 4×d שדות (ועוד אחד לכל היותר, מהפקודות שמסביב)
console.log('SOUND: המשך');
for (const d of [1, 1.5, 16, 255]) {
  const s = await runRom([`T=TIMER:SOUND 100,${d}:PRINT TIMER-T`], { timeout: 30, wallTimeout: 120000 });
  const got = Number(peek(s.screen).at(-2));
  const want = soundFields(d);
  ok(`SOUND 100,${d}: ${got} שדות (מודל ${want})`, got >= want && got <= want + 1, s.screen);
}

// 3. מצב אחרי SOUND
console.log('SOUND: המצב בסוף');
{
  const s = await runRom(['SOUND 77,1:PRINT PEEK(140);PEEK(141);PEEK(142)']);
  ok('$8C=77, $8D-$8E=0', peek(s.screen).at(-2).trim() === '77  0  0', s.screen);
  ok('$FF20=0', s.pia1a === 0, hex(s.pia1a));
  ok('הצליל כבוי ($FF23 ביט 3)', !(s.pia1crb & 8), hex(s.pia1crb));
  ok('הבוררים על DAC, פסיקת השדה פתוחה', !(s.pia0cra & 8) && !(s.pia0crb & 8) && (s.pia0crb & 1), hex(s.pia0cra) + ' ' + hex(s.pia0crb));
}

// 4. שגיאות (S-03)
console.log('SOUND: שגיאות');
for (const [t, d] of [[0, 1], [256, 1], [-1, 1], [-0.5, 1], [0.9, 1], [1, 0], [1, 256], [255.9, 1], [1, 0.5]]) {
  const want = soundArgOk(t) && soundArgOk(d);
  const s = await runRom(['POKE 140,9', `SOUND ${t},${d}`, 'PRINT PEEK(140)']);
  const L = peek(s.screen);
  const err = L.some(l => l.startsWith('?FC ERROR'));
  const f = Number(L.at(-2));
  const wantF = soundArgOk(t) ? Math.trunc(t) : 9;
  ok(`SOUND ${t},${d}: ${want ? 'בסדר' : '?FC'}, $8C=${wantF}`, err === !want && f === wantF, s.screen);
}
{
  const s = await runRom(['SOUND 1']);
  ok('SOUND 1 (בלי פסיק): ?SN', s.screen.includes('?SN ERROR'), s.screen);
  const t = await runRom(['SOUND 100,1X']);
  ok('SOUND 100,1X: ?SN אחרי הצליל', t.screen.includes('?SN ERROR'), t.screen);
  const u = await runRom(['SOUND "A",1']);
  ok('SOUND "A",1: ?TM', u.screen.includes('?TM ERROR'), u.screen);
}

// 5. AUDIO (S-12)
console.log('AUDIO');
{
  let s = await runRom(['AUDIO ON']);
  ok('AUDIO ON: SEL1=1, SEL2=0, צליל דולק', (s.pia0cra & 8) && !(s.pia0crb & 8) && (s.pia1crb & 8), hex(s.pia0cra) + ' ' + hex(s.pia0crb) + ' ' + hex(s.pia1crb));
  s = await runRom(['AUDIO ON', 'AUDIO OFF']);
  ok('AUDIO OFF: SEL1 נשאר 1, צליל כבוי', (s.pia0cra & 8) && !(s.pia0crb & 8) && !(s.pia1crb & 8), hex(s.pia0cra) + ' ' + hex(s.pia1crb));
  s = await runRom(['AUDIO ON', 'SOUND 200,1']);
  ok('AUDIO ON ואז SOUND: חזרה ל-DAC, צליל כבוי', !(s.pia0cra & 8) && !(s.pia0crb & 8) && !(s.pia1crb & 8), hex(s.pia0cra) + ' ' + hex(s.pia1crb));
  s = await runRom(['AUDIO ON', 'X=1/0']);
  ok('AUDIO ON ואז שגיאה: צליל כבוי', !(s.pia1crb & 8) && s.screen.includes('?/0 ERROR'), hex(s.pia1crb));
  for (const bad of ['AUDIO', 'AUDIO 1', 'AUDIO ONX']) {
    s = await runRom([bad]);
    ok(`${bad}: ?SN`, s.screen.includes('?SN ERROR'), s.screen);
  }
}

// 6. ההדלקה
console.log('הדלקה');
{
  const s = await runRom(['PRINT PEEK(140);PEEK(141);PEEK(142)']);
  ok('$8C-$8E = 0', peek(s.screen).at(-2).trim() === '0  0  0', s.screen);
  ok('בוררים 0, צליל ומנוע כבויים', !(s.pia0cra & 8) && !(s.pia0crb & 8) && !(s.pia1crb & 8) && !(s.pia1cra & 8),
    [s.pia0cra, s.pia0crb, s.pia1cra, s.pia1crb].map(hex).join(' '));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
