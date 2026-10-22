// השוואת פלט אמיתי לחישובי הייחוס, כולל תחומים וקינון.
import assert from 'node:assert/strict';
import {runRom} from './xr.mjs';
let count=0;
async function check(expression,expected,tolerance=1e-8, absolute=false) {
 const {screen}=await runRom(['PRINT '+expression]);
 const match=screen.match(/\n ?(-?[\d.E+\-]+)\s*\nOK/);
 assert.ok(match,expression+'\n'+screen);
 const actual=Number(match[1]);
 assert.ok(Math.abs(actual-expected)<=tolerance*(absolute || expected===0 ? 1 : Math.abs(expected)),`${expression}: ${actual} != ${expected}`);
 count++;
}
for(const x of [-10000,-1000,-20,-3.14,-1,-.1,0,.1,.7,1,3.14,20,1000,10000,60000]) {
 await check(`SIN(${x})`,Math.sin(x),2e-8,true);
 await check(`COS(${x})`,Math.cos(x),2e-8,true);
 await check(`ATN(${x})`,Math.atan(x));
}
for(const x of [.001,.5,1,2,100,1e10]) {
 await check(`LOG(${x})`,Math.log(x));
 await check(`SQR(${x})`,Math.sqrt(x));
}
for(const x of [-80,-10,-1,0,1,10,80]) await check(`EXP(${x})`,Math.exp(x),3e-8);
await check('TAN(1)',Math.tan(1));
for(const [e,v] of [['INT(-.1)',-1],['FIX(-.1)',0],['INT(-2)',-2],['FIX(65535.9)',65535],['INT(1E10)',1e10],['SGN(0)',0],['SGN(5)',1],['ABS(SIN(-1))',Math.sin(1)],['SQR(SQR(256))',4],['TIMER*0',0],['EXP(-1000)',0],['SQR(1E-30)',1e-15],['LOG(1E-30)',Math.log(1e-30)]]) await check(e,v,1e-8);
for(const argument of [0,1,6,255]) {
 const lines=['10 FOR I=1 TO 100',`20 A=RND(${argument})`,'30 IF A<=0 THEN B=B+1','40 IF A>=1 THEN B=B+1','50 NEXT I','60 PRINT B','RUN'];
 if(argument>1) {lines[2]='30 IF A<1 THEN B=B+1';lines[3]=`40 IF A>${argument} THEN B=B+1`;lines.splice(4,0,'45 IF FIX(A)<>A THEN B=B+1');}
 const {screen}=await runRom(lines,{timeout:20});
 // מונה שגיאות מצטבר שומר גם כישלון מוקדם שלא היה נשאר במסך.
 const output=screen.split('RUN\n').at(-1);
 assert.match(output,/ 0\nOK/);count++;
}
const {screen}=await runRom(['A=RND(-42):B=RND(0):A=RND(-42):PRINT B=RND(0)']);
assert.match(screen,/\n-1\nOK/);count++;
console.log(`${count} numeric checks passed`);
