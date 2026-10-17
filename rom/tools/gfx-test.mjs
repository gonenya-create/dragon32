// בדיקות מול זיכרון האמולטור: הציפיות מחושבות במרחב הפיקסלים.
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const shot = (lines, active=false) => {
  const result = JSON.parse(execFileSync('node', ['rom/tools/gfxshot.mjs', 'rom/build/d32.rom', '.05', lines.join('|')], {encoding:'utf8', env:{...process.env,...(active?{GFX_ACTIVE:'1'}:{})}}));
  return {...result, memory:Buffer.from(result.memory,'hex')};
};
let passed=0, failed=0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ '+name); }
  catch (e) {failed++; console.error('  ✗ '+name+'\n'+e.stack);}
}
function pixel(memory,mode,page,x,y) {
  if(mode<4)x>>=1;
  if(mode<2)y>>=1;
  const colour=mode%2, stride=mode===0||mode===2?16:32;
  const b=memory[(page-1)*1536+y*stride+(x>>(colour?2:3))];
  return colour?(b>>(6-2*(x%4)))&3:(b>>(7-x%8))&1;
}
for(let mode=0;mode<5;mode++) test(`PMODE ${mode}: page, PCLS, PSET, PRESET and scaling`,()=>{
  const colour=mode%2, page=mode%4+1;
  const {memory,pia,text}=shot([`PMODE ${mode},${page}`,`PCLS ${colour?1:0}`,`PSET(0,0,${colour?4:1})`,`PSET(255,191,${colour?3:1})`,`PSET(8,8,${colour?2:1})`,'PRESET(8,8)']);
  assert.equal(pixel(memory,mode,page,0,0),colour?3:1);
  assert.equal(pixel(memory,mode,page,255,191),colour?2:1);
  assert.equal(pixel(memory,mode,page,8,8),0);
  assert.equal(pixel(memory,mode,page,32,32),0);
  assert.equal(parseInt(pia,16)&0xf8,0);
  assert.ok(!Buffer.from(text,'hex').includes(Buffer.from([0x7f,0x53,0x4e])),'no syntax error');
});
test('PCLS fills full screen and uses COLOR background',()=>{
  const {memory}=shot(['PMODE 3,4','COLOR 3,2','PCLS']);
  assert.ok(memory.subarray(4608,4608+6144).every(x=>x===0x55));
});
test('LINE all octants, continued line, zero length',()=>{
  const lines=['PMODE 4,1','PCLS 0'];
  const endpoints=[[160,110],[140,140],[100,140],[80,110],[80,80],[100,60],[140,60],[160,80],[120,100]];
  for(const [x,y] of endpoints) lines.push(`LINE(120,100)-(${x},${y}),PSET`);
  lines.push('LINE -(200,100),PSET');
  const {memory}=shot(lines);
  for(const [x,y] of endpoints) assert.equal(pixel(memory,4,1,x,y),1,`${x},${y}`);
  for(let x=120;x<=200;x++) assert.equal(pixel(memory,4,1,x,100),1);
});
test('LINE B/BF and PRESET',()=>{
  const {memory}=shot(['PMODE 4,1','PCLS 0','LINE(20,20)-(10,10),PSET,B','LINE(30,30)-(35,35),PSET,BF','LINE(32,32)-(33,33),PRESET,BF']);
  for(let y=10;y<=20;y++)for(let x=10;x<=20;x++)assert.equal(pixel(memory,4,1,x,y), +(x===10||x===20||y===10||y===20));
  for(let y=30;y<=35;y++)for(let x=30;x<=35;x++)assert.equal(pixel(memory,4,1,x,y),+(x<32||x>33||y<32||y>33));
});
test('CIRCLE cardinal points, symmetry, radius zero and edge clipping',()=>{
  const {memory}=shot(['PMODE 4,1','PCLS 0','CIRCLE(100,90),20','CIRCLE(255,191),8','CIRCLE(0,0),0']);
  for(const [x,y] of [[80,90],[120,90],[100,70],[100,110],[255,183],[247,191],[0,0]])assert.equal(pixel(memory,4,1,x,y),1,`${x},${y}`);
  for(let y=70;y<=110;y++)for(let x=80;x<=120;x++)assert.equal(pixel(memory,4,1,x,y),pixel(memory,4,1,200-x,180-y));
});
test('LINE diagonal raster and default colour',()=>{
  const {memory}=shot(['PMODE 4,1','PCLS 0','COLOR 1,0','LINE(255,191)-(0,0),PSET']);
  for(let x=0;x<256;x++) {
    const expected=Math.round(x*191/255);
    for(let y=0;y<192;y++) assert.equal(pixel(memory,4,1,x,y),+(y===expected),`${x},${y}`);
  }
});
test('Explicit PCLS colour repeats packed pattern',()=>{
  const {memory}=shot(['PMODE 1,1','PCLS 3']);
  assert.ok(memory.subarray(0,3072).every(x=>x===0xaa));
});
test('CIRCLE colour in a scaled mode',()=>{
  const {memory}=shot(['PMODE 1,1','PCLS 1','CIRCLE(80,80),20,4']);
  for(const [x,y] of [[60,80],[100,80],[80,60],[80,100]])assert.equal(pixel(memory,1,1,x,y),3);
  assert.equal(pixel(memory,1,1,80,80),0);
});
for(let mode=0;mode<5;mode++) for(let css=0;css<2;css++) test(`SCREEN hardware mode ${mode}, CSS ${css}`,()=>{
  const {pia}=shot([`PMODE ${mode},1`,`SCREEN 1,${css}`],true);
  assert.equal(parseInt(pia,16)&0xf8,[0xb0,0xc0,0xd0,0xe0,0xf0][mode]|css*8);
});
test('SCREEN text CSS',()=>{
  const {pia}=shot(['SCREEN 0,1'],true);
  assert.equal(parseInt(pia,16)&0xf8,8);
});
test('SCREEN 0,0 restores text and drawing survives prompt',()=>{
  const {pia,memory}=shot(['PMODE 4,1','PCLS 0','PSET(42,42)','SCREEN 1,1','SCREEN 0,0'],true);
  assert.equal(parseInt(pia,16)&0xf8,0);
  assert.equal(pixel(memory,4,1,42,42),1);
});
console.log(`${passed} graphics passed, ${failed} failed`);
process.exitCode=failed?1:0;
