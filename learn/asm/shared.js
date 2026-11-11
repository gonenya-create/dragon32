// Built by tools/learn/build.mjs from the course script (do not edit): the send button's tape code and the Dragon screen drawing.
"use strict";
const T12 = {};
/* ---------------- send to the Dragon machine (11.11.2026) ----------------
   The program in a window becomes a machine-code tape, exactly like CSAVEM writes it (header: name, type 2, binary, no gaps,
   exec address, load address; then blocks of up to 255 bytes; then the end block). It goes into "My tapes" of the Dragon
   machine on the site (localStorage 'd32-lab-tapes', the same list the machine's CSAVE fills), and the machine opens.
   There: CLOADM "NAME", then CLS:EXEC. The fixed ending ends with RTS, so after a key the program goes back to BASIC's OK.
   The bytes are the ones asm12 makes, the same DREAM makes (checked byte by byte on our machine).
   Works only on the site (same origin as /lab/1982/); from a file on the computer the button says so. Hebrew and English. */
const EN_SEND=document.documentElement.lang==='en';
const SEND_TX=EN_SEND?{
  btn:'🐉 Send to the Dragon machine', gap:'First choose the missing line, then send.', err:'This program can\'t be sent yet: ',
  file:'The button works on the site, dragon1982.com/learn. From a file on your computer it can\'t reach the Dragon machine.',
  full:'The browser has no room left to keep the tape.', open:'Open the Dragon machine →',
  done:(n,b)=>'✓ The tape <b class="ltr">'+n+'</b> ('+b+' bytes) is in "My tapes" of the Dragon machine, and the machine opens in a new tab. There:',
  steps:n=>['Wait until the machine is on and shows <code>OK</code>.','Type <code class="ltr">CLOADM "'+n+'"</code> and ENTER. The tape loads, and <code>OK</code> appears again.','Type <code class="ltr">CLS:EXEC</code> and ENTER. <code>CLS</code> clears the screen, and <code>EXEC</code> runs the program from the address the tape remembers.','When the program ends, it waits for a key (the fixed ending). One more key, and you are back at BASIC\'s <code>OK</code>.']
}:{
  btn:'🐉 שלח למכונת הדראגון', gap:'קודם בחר את השורה החסרה, ואז שולחים.', err:'את התוכנית הזאת עוד אי אפשר לשלוח: ',
  file:'הכפתור עובד באתר, dragon1982.com/learn. מקובץ במחשב הוא לא מגיע למכונת הדראגון.',
  full:'בדפדפן אין מקום לשמור את הקלטת.', open:'לפתוח את מכונת הדראגון ←',
  done:(n,b)=>'✓ הקלטת <b class="ltr">'+n+'</b> ('+b+' בתים) נמצאת ב"הקלטות שלי" של מכונת הדראגון, והמכונה נפתחת בלשונית חדשה. שם:',
  steps:n=>['מחכים שהמכונה תידלק ויופיע <code>OK</code>.','מקלידים <code class="ltr">CLOADM "'+n+'"</code> ו-ENTER. הקלטת נטענת, ושוב מופיע <code>OK</code>.','מקלידים <code class="ltr">CLS:EXEC</code> ו-ENTER. ‏<code>CLS</code> מנקה את המסך, ו-<code>EXEC</code> מריצה את התוכנית מהבית שהקלטת זוכרת.','כשהתוכנית נגמרת, היא מחכה למקש (הסוף הקבוע). עוד מקש, וחוזרים ל-<code>OK</code> של BASIC.']
};
const SEND_KEY='d32-lab-tapes', SEND_MAX=40, SEND_LAB=EN_SEND?'/en/lab/1982/':'/lab/1982/';
/* a line as DREAM wants it: a command that is not a name of a place starts with a space */
const sendLine=l=>{ if(l==null) return l; const t=(l.trim().split(/\s+/)[0]||'').toUpperCase(); return (l[0]!==' '&&(T12[t]||t==='FCB'))?' '+l:l; };
function sendImg(g){
  if(!g||!g.lines) return null;
  if(g.lines.includes(null)) return {gap:true};
  const lines=g.lines.map(sendLine), img=g.user?asm12({user:lines,tail:g.tail||'real'}):asm12({pre:lines,tail:g.tail||'real',post:(g.sub||[]).map(sendLine)});
  if(g.edits) for(const a in g.edits) img.mem[a]=g.edits[a];
  return img;
}
/* the tape, in the form "My tapes" keeps it: {n:name, b:[[0,...header],[1,...data]…,[255]]} */
function sendTapeFile(name,bytes,load,exec){
  const hdr=Array.from(name.padEnd(8),c=>c.charCodeAt(0)).concat([2,0,0,exec>>8,exec&255,load>>8,load&255]);
  const f={n:name,b:[[0].concat(hdr)]};
  for(let i=0;i<bytes.length;i+=255) f.b.push([1].concat(bytes.slice(i,i+255)));
  f.b.push([255]);
  return f;
}
function sendTape(name,g,say){
  say.hidden=false;
  const img=sendImg(g);
  if(!img) return;
  if(img.gap){ say.innerHTML=SEND_TX.gap; return; }
  if(img.errs.length){ say.innerHTML='⚠️ '+SEND_TX.err+img.errs[0]; return; }
  if(location.protocol==='file:'){ say.innerHTML=SEND_TX.file; return; }
  const bytes=Array.from(img.mem.slice(img.start,img.end)), f=sendTapeFile(name,bytes,img.start,img.entry);
  // first in the list: the machine puts "My tapes" on one tape, so this one is near the start. The oldest go out at 40, like the machine does
  let list=[]; try{ list=JSON.parse(localStorage.getItem(SEND_KEY))||[]; }catch(e){}
  if(!Array.isArray(list)) list=[];
  list=[f].concat(list.filter(t=>t&&t.n!==name).slice(0,SEND_MAX-1));
  try{ localStorage.setItem(SEND_KEY,JSON.stringify(list)); }catch(e){ say.innerHTML='⚠️ '+SEND_TX.full; return; }
  const url=SEND_LAB+'?learn='+encodeURIComponent(name);
  say.innerHTML=SEND_TX.done(name,bytes.length)+'<ol>'+SEND_TX.steps(name).map(s=>'<li>'+s+'</li>').join('')+'</ol><a class="btn warm" href="'+url+'" target="dragon-machine">'+SEND_TX.open+'</a>';
  try{ window.open(url,'dragon-machine'); }catch(e){}
}
/* the button, under a program window (or the translator). The tape's name: cfg.tape, or the window's id (pw121 → PW121) */
function sendBtn(P,host,cfg,get){
  if(!P||!host) return;
  const name=String(cfg.tape||host.id||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
  if(!name) return;
  const d=document.createElement('div'); d.className='send12';
  d.innerHTML='<button class="btn ghost sendgo" type="button"></button><div class="sendsay" hidden></div>';
  d.querySelector('.sendgo').textContent=SEND_TX.btn;
  d.querySelector('.sendgo').onclick=()=>sendTape(name,get(),d.querySelector('.sendsay'));
  P.appendChild(d);
}
const VDG = { green:'#1daa1d', dark:'#001000', black:'#050505',
  sg:['#1daa1d','#ffff83','#1b166b','#6b0f1b','#ffffff','#1d9871','#ff46ff','#ff5c1d'] };
const CHARS = "@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]↑← !\"#$%&'()*+,-./0123456789:;<=>?";
/* our own 5x7 letters: 64 glyphs x 7 rows, each row 5 bits (drawn for this course) */
const FONT_HEX="0e11171517100e040a11111f11111e11111e11111e0e11101010110e1e11111111111e1f10101e10101f1f10101e1010100f10101311110f1111111f1111110e04040404040e0101010111110e111214181412111010101010101f111b1515111111111119151311110e11111111110e1e11111e1010100e11111115120d1e11111e1412110e11080402110e1f0404040404041111111111110e1111110a0a040411111115151b1111110a040a111111110a040404041f01020408101f0e08080808080e001008040201000e02020202020e040e15040404040004081f08040000000000000000040404040400040a0a0a000000000a0a1f0a1f0a0a040f140e051e04191902040813130814140815120d0404080000000002040808080402080402020204080004150e1504000004041f040400000000000c04080000001f00000000000000000c0c000102040810000e11131519110e040c040404040e0e11010608101f0e11010601110e02060a121f02021f101e0101110e0e10101e11110e1f0102040808080e11110e11110e0e11110f01010e000c0c000c0c000c0c000c0c04080204081008040200001f001f0000080402010204080e110102040004";
const FONT=[]; for(let g=0;g<64;g++){ const r=[]; for(let y=0;y<7;y++) r.push(parseInt(FONT_HEX.substr((g*7+y)*2,2),16)); FONT.push(r); }

/* draw one character cell (8x12 Dragon pixels) into a rectangle */
function drawCode(ctx, code, x, y, w, h){
  const px=w/8, py=h/12;
  if(code>=0x80){
    const col = VDG.sg[(code>>4)&7], b=code&15;
    const q=[[8,0,0],[4,1,0],[2,0,1],[1,1,1]];
    for(const [bit,qx,qy] of q){ ctx.fillStyle = (b&bit)?col:VDG.black; ctx.fillRect(x+qx*w/2, y+qy*h/2, w/2+0.5, h/2+0.5); }
    return;
  }
  const inv = code<0x40;
  ctx.fillStyle = inv?VDG.dark:VDG.green; ctx.fillRect(x,y,w+0.5,h+0.5);
  ctx.fillStyle = inv?VDG.green:VDG.dark;
  const g = FONT[code&63];
  for(let r=0;r<7;r++) for(let c=0;c<5;c++) if(g[r]&(1<<(4-c))) ctx.fillRect(x+(c+2)*px, y+(r+3)*py, px+0.3, py+0.3);
}
