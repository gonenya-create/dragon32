const { runRom } = await import(process.env.XR || './xr2.mjs');
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const sub = ['999 END','1000 P=VARPTR(R):POKE M,PEEK(P):POKE M+1,PEEK(P+1):POKE M+2,PEEK(P+2):POKE M+3,PEEK(P+3):POKE M+4,PEEK(P+4):M=M+5:RETURN'];
const progs = {
 rnd: ['10 M=12288:R=RND(-1234567):GOSUB 1000:FOR I=0 TO 250:R=RND(0):GOSUB 1000:NEXT',
       '20 FOR K=1 TO 40:R=RND(-K*7919.123):GOSUB 1000:R=RND(0):GOSUB 1000:R=RND(6):GOSUB 1000:R=RND(1E6):GOSUB 1000:R=RND(65537):GOSUB 1000:NEXT',
       '30 FOR K=1 TO 30:R=RND(-K^5):GOSUB 1000:R=RND(0):GOSUB 1000:R=RND(1):GOSUB 1000:R=RND(2.7):GOSUB 1000:NEXT', ...sub, 'RUN','PRINT M'],
 math: ['10 M=12288:FOR X=-9.3 TO 9.5 STEP .173',
        '20 R=SIN(X):GOSUB 1000:R=COS(X):GOSUB 1000:R=TAN(X):GOSUB 1000:R=ATN(X):GOSUB 1000:R=ATN(X*X*X):GOSUB 1000',
        '30 R=LOG(ABS(X)+.001):GOSUB 1000:R=EXP(X*9):GOSUB 1000:R=SQR(ABS(X)*X*X):GOSUB 1000:R=(ABS(X)+.1)^(X/3):GOSUB 1000',
        '40 R=FIX(X*3):GOSUB 1000:R=(-2)^INT(X):GOSUB 1000:NEXT',
        '50 R=0^0:GOSUB 1000:R=0^2:GOSUB 1000:R=(-3)^3:GOSUB 1000:R=EXP(-100):GOSUB 1000:R=SQR(0):GOSUB 1000:R=TAN(0):GOSUB 1000:R=ATN(1):GOSUB 1000:R=ATN(-1):GOSUB 1000',
        ...sub, 'RUN','PRINT M'],
 exp: ['10 M=12288:FOR I=1 TO 1400:X=(RND(0)-.5)*170:IF I>700 THEN X=X/50', '20 R=EXP(X):GOSUB 1000:NEXT', '30 FOR I=-20 TO 20:R=EXP(I*LOG(2)):GOSUB 1000:R=EXP(I):GOSUB 1000:R=2^I:GOSUB 1000:R=EXP(I/8):GOSUB 1000:R=EXP(-I/8):GOSUB 1000:R=(-2)^I:GOSUB 1000:R=10^I:GOSUB 1000:NEXT', ...sub, 'RUN','PRINT M'],
 pw: ['10 M=12288:FOR I=1 TO 700:X=RND(0)*20:Y=(RND(0)-.5)*14:R=X^Y:GOSUB 1000:R=(-INT(X)-1)^INT(Y/3):GOSUB 1000:NEXT', ...sub, 'RUN','PRINT M'],
 str: ['PRINT HEX$(0);HEX$(15);HEX$(16);HEX$(255);HEX$(4096);HEX$(43981);HEX$(65535);HEX$(1.9)',
       'PRINT &HABCD;&O177777;&777;&H;&O;&H0F;VAL("&HFF");VAL("&O17");VAL("12.5E3");VAL("")',
       'PRINT INSTR("HELLO","L");INSTR(4,"HELLO","L");INSTR(5,"HELLO","LO");INSTR("AB","ABC");INSTR(255,"A","")',
       'PRINT STRING$(5,42);STRING$(0,"A");STR$(-1.5);STR$(1E10);FIX(-0);POS(0);',
       ],
 str2: ['PRINT POS(0):PRINT TIMER>=0;:TIMER=500:PRINT TIMER<600;MEM;VARPTR(R)',
       'X$="AB":DEF USR5=1536:POKE 1536,57:PRINT USR5(3);USR(4);USR5(X$)',
       'SET(3,3,4):PRINT POINT(3,3);POINT(2,3);POINT(2,2);POINT(63,31)',
       ],
 str3: ['PRINT &H10000', 'PRINT &O200000', 'PRINT HEX$(-1)', 'PRINT INSTR(0,"A","A")', 'PRINT STRING$(2,"")', 'PRINT JOYSTK(4)', 'PRINT POS(3)','PRINT USR9(1)', 'PRINT &HG'],
 str5: ['PRINT LOG(0)','PRINT LOG(-1)','PRINT SQR(-1)','PRINT 0^-1','PRINT EXP(89)','PRINT EXP(-89);EXP(88)','PRINT TAN(1.5707963);ATN(0);-ATN(-0);LOG(1)','PRINT (-8)^(1/3)','PRINT RND(-1);RND(0);RND(1);RND(100)','X=RND(0):PRINT PEEK(234);PEEK(235);PEEK(236);PEEK(241)','PRINT FIX(1E10);FIX(-1E10);STR$(-0)'],
 str4: ['PRINT VAL("&H1@");VAL("&H1:");VAL("&O78");VAL("&O7A");VAL("&H7a");VAL("&");VAL("&HFFF")', 'PRINT VAL("&O177770");&O17777', 'PRINT &O177777+1', 'PRINT VAL("&H10000")', 'PRINT &O377777','PRINT VAL("&O1777778")','PRINT &H8000;&O100000;&HAbC'],

};
const out = {};
for (const [k, lines] of Object.entries(progs)) {
  const r = await runRom(lines, { timeout: 200, wallTimeout: 120000 });
  out[k] = { screen: r.screen, ram: Buffer.from(r.ram.subarray(0x3000, 0x6000)).toString('hex') };
}
const f = process.argv[2];
if (process.argv[3] === 'save') { writeFileSync(f, JSON.stringify(out)); console.log('saved'); }
else { const b = JSON.parse(readFileSync(f)); let ok = true;
  for (const k in out) { if (out[k].screen !== b[k].screen) { ok = false; console.log(k, 'SCREEN DIFF\n', out[k].screen, '\n---\n', b[k].screen); }
    if (out[k].ram !== b[k].ram) { ok = false; console.log(k, 'RAM DIFF'); } }
  console.log(ok ? 'REG OK' : 'REG FAIL'); }
