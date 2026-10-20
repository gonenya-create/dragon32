// בדיקות PLAY (שלב 3 חלק 4) מול המודל שנכתב מהמפרט (sndmodel.mjs).
// הרצה: node rom2/tools/snd-play-test.mjs   (SEED=n לסדרה אחרת של מחרוזות אקראיות, COUNT=n כמה)
// כל תו נמדד מיומן הריצה: הערכים שנכתבו ל-$FF20, המרווחים במחזורים (בלי פסיקת השדה), וכמה פסיקות נמשך.
import { runRom } from './xr2.mjs';
import { traceDac } from './sndtrace.mjs';
import { playBoot, playRun, playWave } from './sndmodel.mjs';

let pass = 0, fail = 0;
const ok = (name, cond, info = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${info}`); }
};
const hex = n => '$' + n.toString(16).toUpperCase().padStart(2, '0');
const lastNums = s => s.trim().split('\n').at(-2).trim().split(/\s+/).map(Number);
const STATE = 'PRINT PEEK(222);PEEK(223);PEEK(224);PEEK(225);PEEK(226);PEEK(229)';
const stArr = st => [st.oct, st.hi, st.lo, st.len, st.tempo, st.dots];

// compareNotes: התווים מהיומן מול האירועים של המודל. מחזיר '' אם הכול זהה, אחרת תיאור
function compareNotes(notes, events) {
  if (notes.length !== events.length) return `notes ${notes.length} != model ${events.length}`;
  for (let i = 0; i < events.length; i++) {
    const e = events[i], n = notes[i];
    const wave = playWave(e.oct, e.note, e.hi, e.lo);
    if (n.irqs !== e.fields) return `note ${i}: ${n.irqs} fields != ${e.fields}`;
    if (!n.writes.length) return `note ${i}: no writes`;
    for (let j = 0; j < n.writes.length; j++) {
      const w = wave[j % 4];
      if (n.writes[j].v !== w.v) return `note ${i} write ${j}: ${hex(n.writes[j].v)} != ${hex(w.v)}`;
      if (j + 1 < n.writes.length) {
        const gap = n.writes[j + 1].t - n.writes[j].t - n.writes[j + 1].irq;
        if (gap !== w.cycles) return `note ${i} gap ${j}: ${gap} != ${w.cycles}`;
      }
    }
  }
  return '';
}
const fieldsOf = events => events.reduce((a, e) => a + e.fields, 0);

// playCase: הקדמה (פקודות BASIC בלי PLAY), ואז PLAY של המחרוזת. בודק את התווים, השגיאה והמצב בסוף
async function playCase(name, pre, str, vars = {}, st = playBoot()) {
  const model = playRun(str, st, vars);
  const cmd = `${pre}PLAY "${str}"`;
  const secs = Math.max(1, fieldsOf(model.events) * 0.02 + 0.5);
  const tr = await traceDac([cmd], 'play_st', secs, { noteOn: 'pgo', noteOff: 'ploop' });
  const bad = compareNotes(tr.notes, model.events);
  const s = await runRom([cmd, STATE], { timeout: secs + 2, wallTimeout: 120000 });
  const err = (s.screen.match(/\?(\S\S) ERROR/) || [])[1] || null;
  const got = lastNums(s.screen);
  const stOk = JSON.stringify(got) === JSON.stringify(stArr(st));
  ok(`${name}: ${model.events.length} תווים${model.error ? ', ?' + model.error : ''}`,
    !bad && err === model.error && stOk,
    `${bad} err=${err}/${model.error} state=${got}/${stArr(st)}`);
  return tr;
}

// ---------- בדיקות קבועות ----------
console.log('PLAY: ברירות מחדל ותווים (S-05, S-06, S-07)');
await playCase('S-05 CDE בהדלקה (O3)', '', 'CDE');
await playCase('S-05 O2L4T2V15CDE', '', 'O2L4T2V15CDE');
await playCase('S-06 חצאי טון', '', 'O2L4T8V15C;C#;D-;D;O3C');
await playCase('S-06 O2B#', '', 'T8O2CB#');
await playCase('S-06 O2C-', '', 'T8O2C-');
await playCase('S-07 נקודות', '', 'O2T8V15L4C;L4.C;L8C;L4..C');
console.log('PLAY: קצב, עוצמה, שתיקה, מספרים (S-08)');
await playCase('S-08 T1 ו-T4', '', 'O2L4T1V15CT4C');
await playCase('S-08 V1 ו-V31', '', 'T16V1CV31C');
const tr = await playCase('S-08 שתיקה', '', 'T8CP4C');
await playCase('S-08 תווים לפי מספר', '', 'T64O4 1;2;3;4;5;6;7;8;9;10;11;12;N5;NC#');
await playCase('S-08 + - > <', '', 'T64O+CO-CL>CL<CV-CV+CT>CT<C');
await playCase('אוקטבות 1-5', '', 'T64L8O1CGBO2CGBO3CGBO4CGBO5CGB');
console.log('PLAY: משתנים (S-09)');
await playCase('S-09 XA$;', 'A$="CDE":', 'T32O2L4V15XA$;', { A$: 'CDE' });
await playCase('S-09 =A; ו-=B;', 'A=4:B=7:', 'T32O=A;V=B;C', { A: 4, B: 7 });
await playCase('X מקונן', 'A$="CXB$;E":B$="D":', 'T32XA$;F', { A$: 'CXB$;E', B$: 'D' });
await playCase('X ריק ולא קיים', 'A$="":', 'T32XA$;XZZ$;C', { A$: '' });
await playCase('=שם; עם מחרוזת: ?TM', 'A$="X":', 'T32C=A$;');
await playCase('X עם מספר: ?TM', 'A=1:', 'T32CXA;');
console.log('PLAY: חריגים (S-11)');
for (const bad of ['O0C', 'O6C', 'L0C', 'T0C', 'V32C', 'T155C', 'T156C', 'T255C', 'V0C', 'O2L4T2CQD',
  'C.', 'L', 'X', 'Xa;', 'XA', 'N', 'c', 'P0', 'P+', 'T64 13', 'T64 0', 'O5O+', 'V31V+', 'T200T>', 'L1L-L-', 'T64L4 . .C'])
  await playCase(`"${bad}"`, '', bad);

console.log('PLAY: מצב (S-10)');
{
  let s = await runRom([STATE]);
  ok('בהדלקה: 2 184 68 4 2 0', lastNums(s.screen).join(' ') === '2 184 68 4 2 0', s.screen);
  s = await runRom(['PLAY "T255O3L8T4V7C"', 'NEW', 'CLEAR', STATE]);
  ok('NEW ו-CLEAR לא מאפסים: 2 154 96 8 4 0', lastNums(s.screen).join(' ') === '2 154 96 8 4 0', s.screen);
  s = await runRom(['10 ' + STATE, 'PLAY "T255O5L8.C"', 'RUN']);
  ok('RUN מאפס', lastNums(s.screen).join(' ') === '2 184 68 4 2 0', s.screen);
  s = await runRom(['PLAY ""', 'PRINT PEEK(216);PEEK(217);PEEK(218);PEEK(227);PEEK(228)']);
  ok('PLAY "": $D8=1, $D9-$DA=0, $E3-$E4=0', lastNums(s.screen).join(' ') === '1 0 0 0 0', s.screen);
  s = await runRom(['PLAY 1']);
  ok('PLAY 1: ?TM, הצליל כבוי', s.screen.includes('?TM ERROR') && !(s.pia1crb & 8), hex(s.pia1crb));
  s = await runRom(['AUDIO ON', 'PLAY "T255C"']);
  ok('בסוף PLAY: DAC, צליל כבוי', !(s.pia0cra & 8) && !(s.pia0crb & 8) && !(s.pia1crb & 8), hex(s.pia0cra) + ' ' + hex(s.pia1crb));
  const vt = 'PRINT PEEK(29)*256+PEEK(30)-PEEK(27)*256-PEEK(28)';
  s = await runRom(['PLAY "XZZ$;T255C=QQ;"', vt]);
  ok('PLAY: משתנה שלא קיים לא נוצר', lastNums(s.screen)[0] === 0, s.screen);
  s = await runRom(['PMODE 4:DRAW "XZZ$;U=QQ;"', vt]);
  ok('DRAW: משתנה שלא קיים לא נוצר', lastNums(s.screen)[0] === 0, s.screen);
  s = await runRom(['A$="XA$;"', 'PLAY A$'], { timeout: 30, wallTimeout: 120000 });
  ok('X שקורא לעצמו: ?OM', s.screen.includes('?OM ERROR'), s.screen);
  s = await runRom(['T=TIMER:SOUND 1,1:PLAY "T255C":PRINT TIMER-T']);
  const n = lastNums(s.screen)[0];
  ok(`SOUND ואחריו PLAY: ${n} שדות`, n >= 5 && n <= 6, s.screen);
}

// ---------- מחרוזות אקראיות ----------
let seed = Number(process.env.SEED || 1);
const rnd = n => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return (seed >>> 8) % n; };
const pick = a => a[rnd(a.length)];
function genArg() {
  switch (rnd(8)) {
    case 0: return pick(['+', '-', '>', '<']);
    case 1: return '=A;';
    default: return String(rnd(10) ? rnd(40) : rnd(300));
  }
}
function genStr() {
  let s = 'T' + (60 + rnd(196));
  const n = 3 + rnd(10);
  for (let i = 0; i < n; i++) {
    switch (rnd(12)) {
      case 0: s += 'O' + (rnd(6) ? 1 + rnd(5) : genArg()); break;
      case 1: s += 'V' + genArg(); break;
      case 2: s += 'L' + genArg() + '.'.repeat(rnd(3) ? 0 : rnd(3)); break;
      case 3: s += 'T' + (rnd(3) ? 30 + rnd(226) : genArg()); break;
      case 4: s += 'P' + (rnd(4) ? 1 + rnd(255) : '=A;'); break;
      case 5: s += ';'; break;
      case 6: s += ' '; break;
      case 7: s += 'XB$;'; break;
      case 8: s += String(1 + rnd(rnd(8) ? 12 : 14)) + ';'; break;
      case 9: s += 'N' + pick('ABCDEFG'); break;
      case 10: if (!rnd(6)) { s += pick(['Q', '.', '#', 'c', 'H']); break; }
      default: s += pick('ABCDEFG') + pick(['', '', '#', '+', '-']);
    }
  }
  return s;
}
const COUNT = Number(process.env.COUNT || 30);
console.log(`PLAY: ${COUNT} מחרוזות אקראיות (SEED=${process.env.SEED || 1})`);
for (let i = 0; i < COUNT; i++) {
  const a = 1 + rnd(12);
  const vars = { A: a, B$: 'T200CD' };
  let str, model;
  do { str = genStr(); model = playRun(str, playBoot(), vars); } while (fieldsOf(model.events) > 80);
  await playCase(`#${i} "${str}"`, `A=${a}:B$="T200CD":`, str, vars);
}

// ---------- פסיקת השדה ----------
const lens = [...new Set(tr.irqLens)].sort((a, b) => a - b);
console.log(`\n(פסיקת השדה בזמן PLAY: ${lens.join('/')} מחזורים; הקורא מעריך במקור 105-125)`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
