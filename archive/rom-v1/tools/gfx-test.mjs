// בדיקות מול זיכרון האמולטור: הציפיות מחושבות במרחב הפיקסלים.
import { runRom } from './xr.mjs';
import assert from 'node:assert/strict';
const shot = async (lines, active=false) => {
  const {ram,pia1b,screen}=await runRom(lines, active ? {trapSym:'main_ok',range:lines.length+1} : {});
  assert.doesNotMatch(screen,/\?\S+ ERROR/);
  return {memory:ram.subarray(0x600,0x3000),pia:pia1b.toString(16),text:ram.subarray(0x400,0x600).toString('hex')};
};
let passed=0, failed=0;
async function test(name, fn) {
  try { await fn(); passed++; console.log('  ✓ '+name); }
  catch (e) {failed++; console.error('  ✗ '+name+'\n'+e.stack);}
}
function pixel(memory,mode,page,x,y) {
  if(mode<4)x>>=1;
  if(mode<2)y>>=1;
  const colour=mode%2, stride=mode===0||mode===2?16:32;
  const b=memory[(page-1)*1536+y*stride+(x>>(colour?2:3))];
  return colour?(b>>(6-2*(x%4)))&3:(b>>(7-x%8))&1;
}
for(let mode=0;mode<5;mode++) await test(`PMODE ${mode}: page, PCLS, PSET, PRESET and scaling`,async()=>{
  const colour=mode%2, page=mode%4+1;
  const {memory,pia,text}=await shot([`PMODE ${mode},${page}`,`PCLS ${colour?1:0}`,`PSET(0,0,${colour?4:1})`,`PSET(255,191,${colour?3:1})`,`PSET(8,8,${colour?2:1})`,'PRESET(8,8)']);
  assert.equal(pixel(memory,mode,page,0,0),colour?3:1);
  assert.equal(pixel(memory,mode,page,255,191),colour?2:1);
  assert.equal(pixel(memory,mode,page,8,8),0);
  assert.equal(pixel(memory,mode,page,32,32),0);
  assert.equal(parseInt(pia,16)&0xf8,0);
  assert.ok(!Buffer.from(text,'hex').includes(Buffer.from([0x7f,0x53,0x4e])),'no syntax error');
});
await test('PCLS fills full screen and uses COLOR background',async()=>{
  const {memory}=await shot(['PMODE 3,4','COLOR 3,2','PCLS']);
  assert.ok(memory.subarray(4608,4608+6144).every(x=>x===0x55));
});
await test('LINE all octants, continued line, zero length',async()=>{
  const endpoints=[[160,110],[140,140],[100,140],[80,110],[80,80],[100,60],[140,60],[160,80],[120,100]];
  // כל הרצה נכנסת לתור; כל נקודות הקצה והמשך הקו נבדקים.
  for(let i=0;i<endpoints.length;i+=4) {
    const group=endpoints.slice(i,i+4);
    const lines=['PMODE 4,1','PCLS 0'];
    for(const [x,y] of group) lines.push(`LINE(120,100)-(${x},${y}),PSET`);
    if(i+4>=endpoints.length)lines.push('LINE -(200,100),PSET');
    const {memory}=await shot(lines);
    for(const [x,y] of group)assert.equal(pixel(memory,4,1,x,y),1,`${x},${y}`);
    if(i+4>=endpoints.length)
      for(let x=120;x<=200;x++)assert.equal(pixel(memory,4,1,x,100),1);
  }
});
await test('LINE B/BF and PRESET',async()=>{
  const {memory}=await shot(['PMODE 4,1','PCLS 0','LINE(20,20)-(10,10),PSET,B','LINE(30,30)-(35,35),PSET,BF','LINE(32,32)-(33,33),PRESET,BF']);
  for(let y=10;y<=20;y++)for(let x=10;x<=20;x++)assert.equal(pixel(memory,4,1,x,y), +(x===10||x===20||y===10||y===20));
  for(let y=30;y<=35;y++)for(let x=30;x<=35;x++)assert.equal(pixel(memory,4,1,x,y),+(x<32||x>33||y<32||y>33));
});
await test('CIRCLE cardinal points, symmetry, radius zero and edge clipping',async()=>{
  const {memory}=await shot(['PMODE 4,1','PCLS 0','CIRCLE(100,90),20','CIRCLE(255,191),8','CIRCLE(0,0),0']);
  for(const [x,y] of [[80,90],[120,90],[100,70],[100,110],[255,183],[247,191],[0,0]])assert.equal(pixel(memory,4,1,x,y),1,`${x},${y}`);
  for(let y=70;y<=110;y++)for(let x=80;x<=120;x++)assert.equal(pixel(memory,4,1,x,y),pixel(memory,4,1,200-x,180-y));
});
await test('LINE diagonal raster and default colour',async()=>{
  const {memory}=await shot(['PMODE 4,1','PCLS 0','COLOR 1,0','LINE(255,191)-(0,0),PSET']);
  for(let x=0;x<256;x++) {
    const expected=Math.round(x*191/255);
    for(let y=0;y<192;y++) assert.equal(pixel(memory,4,1,x,y),+(y===expected),`${x},${y}`);
  }
});
await test('Explicit PCLS colour repeats packed pattern',async()=>{
  const {memory}=await shot(['PMODE 1,1','PCLS 3']);
  assert.ok(memory.subarray(0,3072).every(x=>x===0xaa));
});
await test('CIRCLE colour in a scaled mode',async()=>{
  const {memory}=await shot(['PMODE 1,1','PCLS 1','CIRCLE(80,80),20,4']);
  for(const [x,y] of [[60,80],[100,80],[80,60],[80,100]])assert.equal(pixel(memory,1,1,x,y),3);
  assert.equal(pixel(memory,1,1,80,80),0);
});
for(let mode=0;mode<5;mode++) for(let css=0;css<2;css++) await test(`SCREEN hardware mode ${mode}, CSS ${css}`,async()=>{
  const {pia}=await shot([`PMODE ${mode},1`,`SCREEN 1,${css}`],true);
  assert.equal(parseInt(pia,16)&0xf8,[0xb0,0xc0,0xd0,0xe0,0xf0][mode]|css*8);
});
await test('SCREEN text CSS',async()=>{
  const {pia}=await shot(['SCREEN 0,1'],true);
  assert.equal(parseInt(pia,16)&0xf8,8);
});
await test('SCREEN 0,0 restores text and drawing survives prompt',async()=>{
  const {pia,memory}=await shot(['PMODE 4,1','PCLS 0','PSET(42,42)','SCREEN 1,1','SCREEN 0,0'],true);
  assert.equal(parseInt(pia,16)&0xf8,0);
  assert.equal(pixel(memory,4,1,42,42),1);
});
await test('PAINT box and circle',async()=>{
  const {memory}=await shot(['PMODE 4,1','PCLS 0','LINE(10,10)-(30,30),PSET,B','PAINT(20,20)','CIRCLE(70,70),10','PAINT(70,70)']);
  for(let y=0;y<40;y++)for(let x=0;x<40;x++)assert.equal(pixel(memory,4,1,x,y),+(x>=10&&x<=30&&y>=10&&y<=30));
  assert.equal(pixel(memory,4,1,70,70),1);assert.equal(pixel(memory,4,1,70,58),0);
});
await test('DRAW movement and modifiers',async()=>{
  const {memory}=await shot(['PMODE 4,1','PCLS 0','DRAW "BM20,20R10D10L10U10BR20NR5D5"']);
  for(let x=20;x<=30;x++)assert.equal(pixel(memory,4,1,x,20),1);
  assert.equal(pixel(memory,4,1,40,25),1);assert.equal(pixel(memory,4,1,45,20),1);
});
await test('GET PUT rectangle round trip',async()=>{
  const {memory}=await shot(['PMODE 4,1','PCLS 0','DIM A(30)','LINE(10,10)-(15,15),PSET,B','GET(10,10)-(15,15),A','PUT(30,30)-(35,35),A,PSET']);
  for(let y=0;y<6;y++)for(let x=0;x<6;x++)assert.equal(pixel(memory,4,1,30+x,30+y),+(x===0||y===0||x===5||y===5));
});
await test('PCOPY copies one 1536-byte page',async()=>{
  const {memory}=await shot(['PMODE 0,1','PCLS 1','PCOPY 1 TO 3']);
  assert.ok(memory.subarray(3072,4608).every(v=>v===255));
});
await test('SET RESET semigraphics',async()=>{
  const {ram}=await runRom(['10 SET(60,28,3):SET(61,28,3):RESET(60,28):GOTO 20','20 GOTO 20','RUN'],{trapSym:'st_goto',range:2});
  assert.equal(ram[0x400+14*32+30],0xa4);
});
await test('SCREEN remains graphics in running loop',async()=>{
  const {pia1b}=await runRom(['10 PMODE 4,1:PCLS 0:SCREEN 1,1:PSET(20,20)','20 GOTO 20','RUN'],{trapSym:'st_goto'});
  assert.equal(pia1b&0xf8,0xf8);
});
await test('graphics functions inside expressions',async()=>{
  const {screen}=await runRom(['PMODE 3,1:PCLS 1:PSET(20,20,4)','PRINT PPOINT(20,20)+2;PPOINT(0,0)','PRINT POINT(0,0);POINT(60,30)','PP=7:PO=8:PRINT PPOINTX;POINTX'],{gfxFunctions:true});
  assert.match(screen,/\n 6  1\n/);
  assert.match(screen,/\n-1 -1\n/);
  assert.match(screen,/\n 7  8\n/);
});
await test('POINT off, on and reset inside program',async()=>{
  const {screen}=await runRom(['10 SET(60,28,3):PRINT POINT(60,28);POINT(61,28);','20 RESET(60,28):PRINT POINT(60,28)','RUN'],{gfxFunctions:true});
  assert.match(screen,/ 3  0  0/);
});
await test('PAINT omitted border uses foreground, not explicit fill',async()=>{
  const {memory}=await shot(['PMODE 3,1','PCLS 1','COLOR 4','LINE(10,10)-(30,30),PSET,B','PAINT(20,20),2']);
  assert.equal(pixel(memory,3,1,20,20),1);
  assert.equal(pixel(memory,3,1,40,20),0);
  assert.equal(pixel(memory,3,1,10,20),3);
});
await test('DRAW lengths reject overflow',async()=>{
  assert.match((await runRom(['DRAW "R256"'])).screen,/\?FC ERROR/);
});
for(let mode=0;mode<5;mode++)await test(`PAINT mode ${mode}: fills screen without CPU recursion`,async()=>{
  const {ram,screen}=await runRom([`PMODE ${mode},1`,`PCLS ${mode%2?1:0}`,`PAINT(127,95),${mode%2?3:1},${mode%2?4:1}`],{timeout:90});
  assert.doesNotMatch(screen,/\?\w+ ERROR/);
  const size=[1536,3072,3072,6144,6144][mode];
  assert.ok(ram.subarray(0x600,0x600+size).every(v=>v===(mode%2?0xaa:255)));
});
await test('PAINT crosses pre-existing fill-colour islands',async()=>{
  const {memory}=await shot(['PMODE 3,1','PCLS 1','COLOR 4','LINE(10,10)-(30,30),PSET,B','COLOR 2','LINE(20,12)-(20,28),PSET','PAINT(12,20),2,4']);
  for(let y=12;y<=28;y+=2)for(let x=12;x<=28;x+=2)assert.equal(pixel(memory,3,1,x,y),1);
});
await test('PAINT out of memory fails cleanly and preserves variables',async()=>{
  const {screen}=await runRom(['DIM A(3300)','FOR I=1 TO 10:A$=STRING$(255,88):NEXT','PAINT(10,10)','PRINT LEN(A$);I']);
  assert.match(screen,/\?OM ERROR/);assert.match(screen,/ 255  11/);
});
for(const op of ['PSET','PRESET','AND','OR','NOT'])await test(`PUT ${op} pixel operations`,async()=>{
  const {memory}=await shot(['PMODE 3,1','PCLS 1','DIM A(5)','PSET(10,10,3)','GET(10,10)-(11,10),A','PSET(30,30,2)',`PUT(30,30)-(31,30),A,${op}`]);
  assert.equal(pixel(memory,3,1,30,30),{PSET:2,PRESET:1,AND:0,OR:3,NOT:2}[op]);
});
await test('GET PUT checks declared array capacity',async()=>{
  for(const cmd of ['GET','PUT']){
    const {screen}=await runRom(['DIM A(0)',`${cmd}(0,0)-(5,5),A`]);
    assert.match(screen,/\?FC ERROR/);
  }
  assert.match((await runRom(['GET(0,0)-(1,1),A'])).screen,/\?FC ERROR/);
});
await test('GET PUT accepts two dimensional arrays',async()=>{
  const {memory}=await shot(['PMODE 4,1','PCLS 0','DIM AB(2,2)','PSET(4,4)','GET(4,4)-(5,5),AB','PUT(40,40)-(41,41),AB']);
  assert.equal(pixel(memory,4,1,40,40),1);assert.equal(pixel(memory,4,1,41,41),0);
});
await test('DRAW all eight directions, default lengths, string expressions',async()=>{
  const {memory}=await shot(['PMODE 4,1','PCLS 0','A$="BM50,50"','DRAW A$+"NU ND NL NR NE NF NG NH"']);
  for(let y=49;y<=51;y++)for(let x=49;x<=51;x++)assert.equal(pixel(memory,4,1,x,y),1);
});
await test('DRAW scale, angles, relative signed M and persistent settings',async()=>{
  const {memory}=await shot(['PMODE 4,1','PCLS 0','DRAW "BM40,40S8A1R5"','DRAW "M+5,-5"']);
  for(let y=30;y<=40;y++)assert.equal(pixel(memory,4,1,40,y),1);
  assert.equal(pixel(memory,4,1,30,20),1);
});
await test('DRAW colour, blank prefix, return prefix and continuation',async()=>{
  const {memory}=await shot(['PMODE 3,1','PCLS 1','DRAW "C3BM40,40NR8D8"','LINE -(48,48),PSET']);
  assert.equal(pixel(memory,3,1,44,40),2);
  assert.equal(pixel(memory,3,1,40,44),2);
  assert.equal(pixel(memory,3,1,44,44),0);
  assert.equal(pixel(memory,3,1,44,48),2);
});
await test('nested PPOINT leaves outer coordinate intact',async()=>{
  const {ram}=await runRom(['PMODE 4,1:PCLS 0:PSET(10,PPOINT(0,0)+20)','PRINT PPOINT(10,20)'],{gfxFunctions:true});
  assert.equal(pixel(ram.subarray(0x600),4,1,10,20),1);
});
await test('DRAW rejects missing arguments and invalid scale',async()=>{
  for(const arg of ['C','S','A','M,2','M1,','S63']) {
    const {screen}=await runRom([`DRAW "${arg}"`]);
    assert.match(screen,/\?(SN|FC) ERROR/,arg);
  }
});
await test('GET rejects subscript syntax without allocating an array',async()=>{
  const {screen,ram}=await runRom(['GET(0,0)-(1,1),A(0)','PRINT 42']);
  assert.match(screen,/\?(SN|FC) ERROR/);
  assert.equal(ram.readUInt16BE(0xa6),0x1e02);
});
for(let colour=1;colour<=8;colour++)await test(`semigraphics quadrants and colour ${colour}`,async()=>{
  const lines=[`10 SET(60,28,${colour}):SET(61,28,${colour}):SET(60,29,${colour}):SET(61,29,${colour})`,'20 GOTO 20','RUN'];
  const {ram}=await runRom(lines,{trapSym:'st_goto'});
  assert.equal(ram[0x5de],0x80+((colour-1)<<4)+15);
});
await test('SET colour zero and RESET clear only selected quadrant',async()=>{
  const {ram}=await runRom(['10 SET(60,28,8):SET(61,29,8):SET(60,28,0)','20 GOTO 20','RUN'],{trapSym:'st_goto'});
  assert.equal(ram[0x5de],0xf1);
});
await test('PPOINT all modes and edge coordinates',async()=>{
  for(let mode=0;mode<5;mode++) {
    const c=mode%2?4:1;
    const {screen}=await runRom([`PMODE ${mode},1:PCLS ${mode%2?1:0}:PSET(255,191,${c})`,'PRINT PPOINT(255,191);PPOINT(0,0)'],{gfxFunctions:true});
    assert.match(screen,new RegExp(`\\n ${c}  ${mode%2?1:0}\\n`));
  }
});
await test('PAINT highest page preserves framebuffer outside fill',async()=>{
  const {memory}=await shot(['PMODE 4,4','PCLS 0','LINE(10,10)-(30,30),PSET,B','PAINT(20,20)']);
  for(let y=0;y<192;y++)for(let x=0;x<256;x++)assert.equal(pixel(memory,4,4,x,y),+(x>=10&&x<=30&&y>=10&&y<=30));
});
console.log(`${passed} graphics passed, ${failed} failed`);
process.exitCode=failed?1:0;
