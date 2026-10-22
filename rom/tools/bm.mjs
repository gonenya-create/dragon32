// מדידת מהירות: תוכניות הבדיקה BM1-BM8 (Rugg/Feldman, כמו ב-PCW וב-Computing Today ב-1982). הרצה: node rom/tools/bm.mjs [BM3]
// מודד ב-TIMER (50 בשנייה). הזמנים שפורסמו: docs/DRAGON-RESEARCH-ERA.md
import { runRom } from './xr2.mjs';
const head = ['NEW', '10 T=TIMER'];
const tail = ['900 PRINT "T";TIMER-T', 'RUN'];
const B = {
 BM1: ['300 FOR K=1 TO 1000', '400 NEXT K'],
 BM2: ['300 K=0', '400 K=K+1', '500 IF K<1000 THEN 400'],
 BM3: ['300 K=0', '400 K=K+1', '410 A=K/K*K+K-K', '500 IF K<1000 THEN 400'],
 BM4: ['300 K=0', '400 K=K+1', '410 A=K/2*3+4-5', '500 IF K<1000 THEN 400'],
 BM5: ['300 K=0', '400 K=K+1', '410 A=K/2*3+4-5', '420 GOSUB 820', '500 IF K<1000 THEN 400', '510 GOTO 900', '820 RETURN'],
 BM6: ['300 K=0', '310 DIM M(5)', '400 K=K+1', '410 A=K/2*3+4-5', '420 GOSUB 820', '430 FOR L=1 TO 5', '440 NEXT L', '500 IF K<1000 THEN 400', '510 GOTO 900', '820 RETURN'],
 BM7: ['300 K=0', '310 DIM M(5)', '400 K=K+1', '410 A=K/2*3+4-5', '420 GOSUB 820', '430 FOR L=1 TO 5', '435 M(L)=A', '440 NEXT L', '500 IF K<1000 THEN 400', '510 GOTO 900', '820 RETURN'],
 BM8: ['300 K=0', '400 K=K+1', '410 A=K^2', '420 B=LOG(K)', '430 C=SIN(K)', '500 IF K<100 THEN 400'],
};
const only = process.argv[2];
await Promise.all(Object.entries(B).filter(([n]) => !only || n === only).map(async ([n, body]) => {
  const r = await runRom([...head, ...body, ...tail], { timeout: 150, wallTimeout: 300000 });
  const scr = Array.isArray(r.screen) ? r.screen : String(r.screen).split("\n"); const line = scr.find(l => /T\s*-?\d/.test(l)) ?? scr.join("|");
  const ticks = parseFloat(line.replace(/[^0-9.\-]/g, ''));
  console.log(n, line.trim(), '=>', (ticks / 50).toFixed(2), 's');
}));
