(()=>{ const real=document.getElementById.bind(document); let sink=null;
document.getElementById=id=>real(id)||(()=>{ if(!sink){ sink=document.createElement('div'); sink.hidden=true; document.body.appendChild(sink); } const d=document.createElement('div'); d.id=id; sink.appendChild(d); return d; })();
window.__courseLoaded=()=>{ document.getElementById=real; if(sink) sink.remove(); sink=null; };
})();

"use strict";
/* ---------------- storage (optional) ---------------- */
const store = {
  get(k){ try{ return JSON.parse(localStorage.getItem('mc-course-'+k)); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem('mc-course-'+k, JSON.stringify(v)); }catch(e){} }
};
function markDone(ch){
  const d = store.get('done') || {}; d[ch]=1; store.set('done', d); paintDone();
}
function paintDone(){
  const d = store.get('done') || {};
  document.querySelectorAll('[data-done]').forEach(s=>{ s.textContent = d[s.dataset.done] ? ' ✓' : ''; });
}

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

/* ---------------- Dragon screen colours (sampled from our machine) ---------------- */
const VDG = { green:'#1daa1d', dark:'#001000', black:'#050505',
  sg:['#1daa1d','#ffff83','#1b166b','#6b0f1b','#ffffff','#1d9871','#ff46ff','#ff5c1d'] };
const SGNAME = ['green','yellow','blue','red','white','cyan','magenta','orange'];
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
function describe(code){
  if(code>=0x80){
    const c=SGNAME[(code>>4)&7], b=code&15;
    const SH={15:'full '+c+' block',0:'black block',12:'top half '+c,3:'bottom half '+c,10:'left half '+c,5:'right half '+c,9:'diagonal '+c+' (top left, bottom right)',6:'diagonal '+c+' (top right, bottom left)',8:'quarter '+c+' top left',4:'quarter '+c+' top right',2:'quarter '+c+' bottom left',1:'quarter '+c+' bottom right'}; const shape = SH[b]||'three quarters '+c;
    return shape + (code===0x8f?' (green on green: you can’t see it!)':'');
  }
  if(code===0x60) return 'empty square (green space)';
  if(code===0x20) return 'black square';
  const ch = CHARS[code&63];
  return (code<0x40? 'the character ' + ch + ' inverted (light on dark)' : 'the character ' + ch);
}
const hex2 = v => '$'+v.toString(16).toUpperCase().padStart(2,'0');
const hex4 = v => '$'+v.toString(16).toUpperCase().padStart(4,'0');
const L = s => '<bdi class="ltr">'+s+'</bdi>';

/* ---------------- Screen component ---------------- */
class Screen{
  constructor(host, o={}){
    this.o=Object.assign({labels:true, interactive:false},o);
    this.mem=new Uint8Array(512).fill(0x60);
    this.host=host; host.classList.add('scr-wrap');
    this.cv=document.createElement('canvas'); host.appendChild(this.cv);
    this.ctx=this.cv.getContext('2d');
    this.sel=-1; this.hover=-1; this.marks={}; this.fx=[];
    new ResizeObserver(()=>this.layout()).observe(host);
    if(this.o.interactive){
      this.cv.addEventListener('mousemove',e=>{ const i=this.hit(e); if(i!==this.hover){ this.hover=i; this.draw(); this.o.onHover&&this.o.onHover(i);} });
      this.cv.addEventListener('mouseleave',()=>{ this.hover=-1; this.draw(); this.o.onHover&&this.o.onHover(-1); });
      this.cv.addEventListener('click',e=>{ const i=this.hit(e); if(i>=0){ this.o.onClick&&this.o.onClick(i); } });
      this.cv.style.cursor='pointer';
    }
    this.layout();
  }
  layout(){
    const W=this.host.clientWidth||320, dpr=window.devicePixelRatio||1;
    this.LW=this.o.labels?(W<480?40:56):0; this.TH=this.o.labels?16:0;
    this.cw=(W-this.LW)/32; this.chh=this.cw*1.5;
    const H=this.TH+16*this.chh;
    this.W=W; this.H=H; this.cv.width=Math.round(W*dpr); this.cv.height=Math.round(H*dpr);
    this.cv.style.height=H+'px'; this.dpr=dpr; this.draw();
  }
  hit(e){ const r=this.cv.getBoundingClientRect(); const x=e.clientX-r.left-this.LW, y=e.clientY-r.top-this.TH; if(x<0||y<0) return -1; const c=Math.floor(x/this.cw), rr=Math.floor(y/this.chh); if(c>31||rr>15) return -1; return rr*32+c; }
  cellRect(i){ const r=this.cv.getBoundingClientRect(); return {left:r.left+this.LW+(i%32)*this.cw, top:r.top+this.TH+Math.floor(i/32)*this.chh, width:this.cw, height:this.chh}; }
  set(i,v,anim){ this.mem[i]=v&255; if(anim){ this.fx.push({i,t0:performance.now()}); this.loop(); } else this.draw(); }
  clear(){ this.mem.fill(0x60); this.marks={}; this.draw(); }
  loop(){ if(this._raf) return; const f=()=>{ this.draw(); const now=performance.now(); this.fx=this.fx.filter(x=>now-x.t0<900); if(this.fx.length) this._raf=requestAnimationFrame(f); else { this._raf=0; this.draw(); } }; this._raf=requestAnimationFrame(f); }
  draw(){
    const c=this.ctx, d=this.dpr; c.setTransform(d,0,0,d,0,0);
    c.fillStyle=getComputedStyle(document.body).backgroundColor; c.fillRect(0,0,this.W,this.H);
    if(this.o.labels){
      c.fillStyle=getComputedStyle(document.body).color; c.font=(this.W<480?9:11)+'px Menlo,Consolas,monospace'; c.textBaseline='middle';
      c.textAlign='right';
      for(let r=0;r<16;r++){ c.globalAlpha=0.75; c.fillText(hex4(0x400+r*32), this.LW-4, this.TH+r*this.chh+this.chh/2); }
      c.textAlign='center';
      const every = this.cw<14?4:(this.cw<20?2:1);
      for(let k=0;k<32;k++) if(k%every===0||k===31) c.fillText(this.o.hexcols?k.toString(16).toUpperCase().padStart(2,'0'):String(k), this.LW+k*this.cw+this.cw/2, this.TH/2);
      c.globalAlpha=1;
    }
    if(!this.off){ this.off=document.createElement('canvas'); this.off.width=256; this.off.height=192; this.octx=this.off.getContext('2d'); }
    for(let i=0;i<512;i++) drawCode(this.octx,this.mem[i],(i%32)*8,Math.floor(i/32)*12,8,12);
    c.imageSmoothingEnabled=false; c.drawImage(this.off,this.LW,this.TH,32*this.cw,16*this.chh);
    if(this.o.labels){ c.strokeStyle='rgba(0,0,0,.16)'; c.lineWidth=1; c.beginPath(); for(let k=1;k<32;k++){ const x=Math.round(this.LW+k*this.cw)+.5; c.moveTo(x,this.TH); c.lineTo(x,this.TH+16*this.chh);} for(let r=1;r<16;r++){ const y=Math.round(this.TH+r*this.chh)+.5; c.moveTo(this.LW,y); c.lineTo(this.LW+32*this.cw,y);} c.stroke(); }
    const now=performance.now();
    for(const f of this.fx){ const t=(now-f.t0)/900; const {x,y}=this.xy(f.i);
      if(t<0.35){ // erase sweep
        const k=t/0.35; c.fillStyle='rgba(255,255,255,.85)'; c.fillRect(x,y,this.cw*k,this.chh);
      }
      c.strokeStyle='rgba(255,210,63,'+(1-t)+')'; c.lineWidth=3; c.strokeRect(x-2,y-2,this.cw+4,this.chh+4); }
    for(const k in this.marks){ const m=this.marks[k]; const {x,y}=this.xy(+k); c.strokeStyle=m; c.lineWidth=2.5; c.setLineDash(m==='#c0392b'?[]:[3,2]); c.strokeRect(x-1.5,y-1.5,this.cw+3,this.chh+3); c.setLineDash([]); }
    if(this.sel>=0){ const {x,y}=this.xy(this.sel); c.strokeStyle='#ffd23f'; c.lineWidth=3; c.strokeRect(x-1.5,y-1.5,this.cw+3,this.chh+3); }
    if(this.hover>=0&&this.hover!==this.sel){ const {x,y}=this.xy(this.hover); c.strokeStyle='#ffffff'; c.lineWidth=2; c.strokeRect(x-1,y-1,this.cw+2,this.chh+2); }
  }
  xy(i){ return {x:this.LW+(i%32)*this.cw, y:this.TH+Math.floor(i/32)*this.chh}; }
}
function tile(code, scale=4){ const cv=document.createElement('canvas'); cv.width=8*scale; cv.height=12*scale; drawCode(cv.getContext('2d'),code,0,0,8*scale,12*scale); return cv; }

/* ---------------- flying token ---------------- */
function fly(fromRect, toRect, text){
  return new Promise(res=>{
    const t=document.createElement('div'); t.className='token'; t.textContent=text; document.body.appendChild(t);
    const fx=fromRect.left+fromRect.width/2, fy=fromRect.top+fromRect.height/2;
    t.style.left=(fx - t.offsetWidth/2)+'px'; t.style.top=(fy - t.offsetHeight/2)+'px';
    const dx=toRect.left+toRect.width/2-fx, dy=toRect.top+toRect.height/2-fy;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ t.style.transform='translate('+dx+'px,'+dy+'px)'; }));
    setTimeout(()=>{ t.style.opacity='0'; setTimeout(()=>{t.remove(); res();},200); }, 720);
  });
}
const sleep = ms => new Promise(r=>setTimeout(r,ms));

/* ---------------- mascot ---------------- */
const MASCOT = `<defs><clipPath id="mcl"><circle cx="60" cy="60" r="54"/></clipPath></defs>
<circle cx="60" cy="60" r="56" fill="#f6ecd6" stroke="#1daa1d" stroke-width="4"/>
<g clip-path="url(#mcl)">
<path d="M82 74 C96 50 112 50 118 62 C110 62 106 68 108 78 C100 72 94 76 94 86 C90 80 84 80 80 84 Z" fill="#1daa1d" stroke="#0d5c0d" stroke-width="1.5"/>
<path d="M50 34 C56 24 64 18 76 15 C68 22 62 28 57 37 Z" fill="#7d1820"/>
<path d="M57 37 C67 23 81 17 96 15 C84 23 74 31 66 42 Z" fill="#9c1f28"/>
<path d="M70 120 C66 92 84 76 75 56 C70 44 62 34 50 34 L41 36 C33 38 27 42 19 47 C14 50 14 56 20 58 L38 59 C34 62 30 64 27 67 C31 71 43 71 50 67 C55 78 50 96 42 120 Z" fill="#b3262f" stroke="#6e141b" stroke-width="2" stroke-linejoin="round"/>
<path d="M75 56 L88 60 L77 66 Z M77 70 L90 75 L77 80 Z M74 86 L86 92 L72 96 Z" fill="#7d1820"/>
<path d="M51 72 Q60 74 66 70 M50 82 Q60 84 67 80 M48 92 Q58 94 67 90 M46 102 Q56 104 67 100" stroke="#e8a23a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
<path d="M39 42 Q46 38 55 42" stroke="#6e141b" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<ellipse cx="47" cy="46.5" rx="4.6" ry="3" fill="#ffd23f"/><ellipse cx="46.6" cy="46.5" rx="1.1" ry="2.6" fill="#1a1a1a"/>
<path d="M20.5 50.5 q2 -1.6 4 0" stroke="#6e141b" stroke-width="1.8" fill="none" stroke-linecap="round"/>
<path d="M21 57.5 Q30 60 39 58.6" stroke="#6e141b" stroke-width="1.6" fill="none" stroke-linecap="round"/>
</g>`;
let mascotN=0;
document.querySelectorAll('svg.m, #mascotBig').forEach(s=>{ s.setAttribute('viewBox','0 0 120 120'); s.innerHTML=MASCOT.replace(/mcl/g,'mcl'+(++mascotN)); });

/* ---------------- SVG helpers / figures ---------------- */
const NS='http://www.w3.org/2000/svg';
function svg(w,h,inner,maxw){ return `<svg viewBox="0 0 ${w} ${h}" style="max-width:${maxw||w}px;direction:ltr" xmlns="${NS}" role="img">${inner}</svg>`; }
const FT = 'font-family="Rubik,system-ui,sans-serif"';
const FM = 'font-family="Menlo,Consolas,monospace"';
function heb(x,y,txt,size=15,fill='currentColor',weight=400){ return `<text x="${x}" y="${y}" text-anchor="middle" direction="ltr" ${FT} font-size="${size}" font-weight="${weight}" fill="${fill}">${txt}</text>`; }
function mono(x,y,txt,size=14,fill='currentColor',anchor='middle',weight=400){ return `<text x="${x}" y="${y}" text-anchor="${anchor}" ${FM} font-size="${size}" font-weight="${weight}" fill="${fill}">${txt}</text>`; }
/* a house with a sign and a slate */
function house(x,y,addr,val,opt={}){
  const w=84;
  const sel = opt.sel?`<rect x="${x-4}" y="${y-6}" width="${w+8}" height="134" rx="10" fill="none" stroke="#ffd23f" stroke-width="4"/>`:'';
  return `<g ${opt.id?'data-i="'+opt.id+'" style="cursor:pointer"':''}>${sel}
  <polygon points="${x},${y+38} ${x+w/2},${y+2} ${x+w},${y+38}" fill="#e08a3c" stroke="#9c5420" stroke-width="2"/>
  <rect x="${x+6}" y="${y+38}" width="${w-12}" height="84" fill="#f4e4c8" stroke="#9c5420" stroke-width="2"/>
  <rect x="${x+16}" y="${y+18}" width="${w-32}" height="22" rx="3" fill="#fff" stroke="#555" stroke-width="1"/>
  ${mono(x+w/2,y+33,addr,13,'#222','middle',700)}
  ${mono(x+w/2,y+52,hex4(addr),10,'#7a5a3a')}
  <rect x="${x+14}" y="${y+60}" width="${w-28}" height="44" rx="4" fill="#2f3a2c" stroke="#7b5b2a" stroke-width="4"/>
  <text class="chalk" x="${x+w/2}" y="${y+92}" text-anchor="middle" ${FT} font-size="24" fill="#f1f1e6" ${opt.fade?'opacity="'+opt.fade+'"':''}>${val}</text>
  </g>`;
}
function arrow(x1,y1,x2,y2,col='#ff9b2f',w=3){ const a=Math.atan2(y2-y1,x2-x1), L=10; return `<line x1="${x1}" y1="${y1}" x2="${x2-Math.cos(a)*4}" y2="${y2-Math.sin(a)*4}" stroke="${col}" stroke-width="${w}"/><polygon points="${x2},${y2} ${x2-L*Math.cos(a-0.45)},${y2-L*Math.sin(a-0.45)} ${x2-L*Math.cos(a+0.45)},${y2-L*Math.sin(a+0.45)}" fill="${col}"/>`; }
function sponge(x,y){ return `<g transform="translate(${x},${y}) rotate(-12)"><rect x="0" y="0" width="34" height="20" rx="5" fill="#ffd23f" stroke="#b8901a" stroke-width="2"/><circle cx="9" cy="7" r="2" fill="#e0b52a"/><circle cx="22" cy="12" r="2.4" fill="#e0b52a"/><circle cx="28" cy="5" r="1.6" fill="#e0b52a"/></g>`; }
function camera(x,y){ return `<g transform="translate(${x},${y})"><rect x="-16" y="-10" width="32" height="22" rx="4" fill="#3b3f46"/><rect x="-8" y="-15" width="12" height="6" rx="2" fill="#3b3f46"/><circle cx="0" cy="1" r="7" fill="#9fc6ff" stroke="#fff" stroke-width="2"/></g>`; }
function note(x,y,val,label){ return `<g><rect x="${x}" y="${y}" width="70" height="60" rx="4" fill="#fff7b0" stroke="#c8b24a" stroke-width="2" transform="rotate(-4 ${x+35} ${y+30})"/>${heb(x+35,y+20,label||'note',12,'#6b5d14')}<text x="${x+35}" y="${y+48}" text-anchor="middle" ${FT} font-size="22" fill="#333">${val}</text></g>`; }

function fig01(){
  const vals=[65,7,0,255,12,96,3,140];
  let s=''; for(let k=0;k<7;k++) s+=house(10+k*92,10,1024+k,vals[k]);
  s+=`<text x="${10+7*92+8}" y="96" ${FT} font-size="28" fill="currentColor">…</text>`;
  s+=heb(690,124,'and 65,000 more houses',13,'currentColor');
  return svg(760,150,s);
}
function fig02(){
  let s='';
  s+=house(10,10,1027,5);
  s+=arrow(104,80,154,80);
  s+=house(160,10,1027,5,{fade:0.25}); s+=sponge(185,68);
  s+=arrow(254,80,304,80);
  s+=house(310,10,1027,7);
  s+=heb(52,148,'It was 5',14); s+=heb(202,148,'Wipe',14); s+=heb(352,148,'Write 7',14);
  return svg(410,160,s,520);
}
function fig03(){
  let s='';
  s+=house(10,10,1025,65);
  s+=camera(140,50); s+=arrow(104,80,196,80);
  s+=note(202,52,65,'note in hand');
  s+=heb(52,148,'In the house: still 65',14); s+=heb(237,148,'On the note: a copy',14); s+=heb(140,26,'Take a photo',13,'#ff9b2f',700);
  return svg(300,160,s,420);
}
function fig11(){
  // one long street, cut into pieces of 32, pieces stacked = the screen
  const cols=['#1daa1d','#57c957','#11801a','#8fdc8f'];
  let s='';
  // the street: 3 pieces in one line, each piece = 5 houses … 2 houses
  const segW=236;
  for(let p=0;p<3;p++){
    const x0=8+p*(segW+10);
    for(let k=0;k<7;k++){ const x=x0+k*26+(k>=5?28:0); s+=`<rect x="${x}" y="30" width="22" height="16" rx="2" fill="${cols[p]}"/>`; }
    s+=`<text x="${x0+5*26+4}" y="44" font-size="14" fill="currentColor">…</text>`;
    s+=mono(x0+11,22,1024+p*32,11,'currentColor');
    s+=mono(x0+6*26+28+11,22,1024+p*32+31,11,'currentColor');
    if(p<2) s+=`<line x1="${x0+segW+3}" y1="24" x2="${x0+segW+3}" y2="54" stroke="#ff9b2f" stroke-width="2" stroke-dasharray="4 3"/>`;
  }
  s+=`<text x="${8+3*(segW+10)-6}" y="44" font-size="14" fill="currentColor">…</text>`;
  s+=heb(380,76,'Cut every 32 houses (at the orange lines), and lay the pieces one under the other',14);
  s+=arrow(380,86,380,108);
  const gx=90, gy=116, gw=19, gh=14;
  for(let r=0;r<4;r++){ for(let c=0;c<32;c++) s+=`<rect x="${gx+c*gw}" y="${gy+r*(gh+2)}" width="${gw-2}" height="${gh}" rx="1.5" fill="${cols[r]}"/>`;
    s+=mono(gx-6,gy+r*(gh+2)+11,1024+r*32,10,'currentColor','end'); s+=mono(gx+32*gw+4,gy+r*(gh+2)+11,1024+r*32+31,10,'currentColor','start'); }
  s+=`<text x="${gx+16*gw-4}" y="${gy+4*(gh+2)+16}" font-size="16" fill="currentColor">⋮</text>`;
  s+=heb(gx+16*gw,gy+4*(gh+2)+38,'And so on to 16 rows: 16 × 32 = 512 squares',13);
  return svg(760,236,s);
}
function fig12(){
  const cw=20, ch=26, gx=96, gy=34;
  let s='';
  for(let r=0;r<16;r++){
    s+=mono(gx-8,gy+r*ch+17,hex4(0x400+r*32)+' · '+(1024+r*32),10.5,'currentColor','end');
    for(let c=0;c<32;c++){
      const i=r*32+c; let f='#1daa1d';
      if(i===0||i===511) f='#ffd23f';
      if(i===0x10f) f='#6b0f1b';
      if(i===0x110||i===0x12f) f='#7fd67f';
      s+=`<rect x="${gx+c*cw}" y="${gy+r*ch}" width="${cw-1.5}" height="${ch-1.5}" fill="${f}"/>`;
    }
  }
  for(let c=0;c<32;c+=1) if(c%4===0||c===31) s+=mono(gx+c*cw+cw/2,gy-8,c,10,'currentColor');
  // arrows from red cell (row 8,col 15)
  const rx=gx+15*cw+cw/2, ry=gy+8*ch+ch/2;
  s+=arrow(rx+6,ry,rx+cw-2,ry,'#fff',2.5);
  s+=arrow(rx,ry+6,rx,ry+ch-4,'#fff',2.5);
  s+=`<rect x="${gx+17*cw}" y="${gy+7*ch+2}" width="120" height="22" rx="5" fill="#fff" stroke="#333"/>`+heb(gx+17*cw+60,gy+7*ch+18,'Right: plus 1',12,'#222');
  s+=`<rect x="${gx+9*cw}" y="${gy+10*ch+2}" width="128" height="22" rx="5" fill="#fff" stroke="#333"/>`+heb(gx+9*cw+64,gy+10*ch+18,'Down: plus 32',12,'#222');
  s+=`<rect x="${gx+2*cw}" y="${gy+1*ch+2}" width="170" height="22" rx="5" fill="#ffd23f"/>`+heb(gx+2*cw+85,gy+1*ch+18,'1024: the screen starts here',12,'#222');
  s+=`<rect x="${gx+22*cw}" y="${gy+14*ch+2}" width="196" height="22" rx="5" fill="#ffd23f"/>`+heb(gx+22*cw+98,gy+14*ch+18,'1535 ($05FF): it ends here',12,'#222');
  s+=arrow(gx+2*cw+6,gy+1*ch+6,gx+cw-2,gy+ch-6,'#ffd23f',2);
  s+=arrow(gx+31*cw-4,gy+15*ch-22+0,gx+31*cw+cw/2,gy+15*ch+2,'#ffd23f',2);
  s+=`<text x="${gx+15*cw+cw/2}" y="${gy+8*ch+17}" text-anchor="middle" ${FM} font-size="12" fill="#fff" font-weight="700">A</text>`;
  return svg(760,gy+16*ch+10,s);
}
function cpuBox(opts={}){
  // drawer A front; others under a cloth
  const v = opts.val; const vtxt = v==null?'?':hex2(v);
  return `<rect x="10" y="10" width="300" height="190" rx="16" fill="#3b4048" stroke="#22252a" stroke-width="3"/>
  <rect x="24" y="22" width="272" height="26" rx="6" fill="#2a2e34"/>
  <text x="160" y="40" text-anchor="middle" ${FT} font-size="14" fill="#cfd6df" direction="ltr">The 6809 processor</text>
  <g class="drawerA">
   <rect x="28" y="62" width="150" height="74" rx="8" fill="#c99a5b" stroke="#7a5428" stroke-width="3"/>
   <rect x="78" y="124" width="50" height="8" rx="4" fill="#7a5428"/>
   <circle cx="48" cy="80" r="14" fill="#ffd23f"/><text x="48" y="86" text-anchor="middle" ${FM} font-size="17" font-weight="700" fill="#222">A</text>
   <rect class="aval-bg" x="70" y="70" width="98" height="44" rx="5" fill="#2f3a2c"/>
   <text class="aval" x="119" y="98" text-anchor="middle" ${FM} font-size="22" fill="#f1f1e6">${vtxt}</text>
   <text class="adec" x="119" y="111" text-anchor="middle" ${FM} font-size="10" fill="#b9c8b0">${v==null?'':v}</text>
  </g>
  <path d="M190 58 Q220 52 250 60 Q280 54 298 62 L298 190 Q270 184 245 192 Q215 186 190 192 Z" fill="#8c7aa8" stroke="#5e4f78" stroke-width="2"/>
  <path d="M200 80 Q240 90 290 78 M200 120 Q240 132 290 118 M200 160 Q240 170 290 158" stroke="#a796c2" stroke-width="2" fill="none"/>
  <text x="244" y="112" text-anchor="middle" ${FT} font-size="12" fill="#fff" direction="ltr">More drawers</text>
  <text x="244" y="130" text-anchor="middle" ${FT} font-size="12" fill="#fff" direction="ltr">under the cloth:</text>
  <text x="244" y="148" text-anchor="middle" ${FT} font-size="12" fill="#fff" direction="ltr">later in the course</text>
  <text x="104" y="164" text-anchor="middle" ${FT} font-size="12.5" fill="#cfd6df" direction="ltr">In the drawer: one number</text>
  <text x="104" y="182" text-anchor="middle" ${FT} font-size="12.5" fill="#cfd6df" direction="ltr">just like a house’s board</text>`;
}
function fig21(){ return svg(320,210,cpuBox({val:0x41}),360); }
function drawerMini(x,y,val,label){ return `<g><rect x="${x}" y="${y}" width="110" height="56" rx="7" fill="#c99a5b" stroke="#7a5428" stroke-width="3"/><circle cx="${x+18}" cy="${y+18}" r="11" fill="#ffd23f"/>${mono(x+18,y+23,'A',14,'#222','middle',700)}<rect x="${x+36}" y="${y+8}" width="66" height="38" rx="4" fill="#2f3a2c"/>${mono(x+69,y+33,val,18,'#f1f1e6')}${label?heb(x+55,y+74,label,12):''}</g>`; }
function vdgCell(x,y,code,w=36){ // svg version of a cell (only for simple cases)
  const h=w*1.5; let s=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${code>=0x80?VDG.sg[(code>>4)&7]:(code<0x40?VDG.dark:VDG.green)}" stroke="#0a3a0a"/>`;
  if(code<0x80&&code!==0x60&&code!==0x20){ s+=`<text x="${x+w/2}" y="${y+h*0.7}" text-anchor="middle" ${FM} font-size="${w*0.7}" font-weight="700" fill="${code<0x40?VDG.green:VDG.dark}">${CHARS[code&63]}</text>`; }
  return s; }
function fig22(){
  let s='';
  // left: LDA
  s+=`<rect x="8" y="8" width="352" height="200" rx="14" fill="none" stroke="currentColor" stroke-opacity=".25"/>`;
  s+=`<rect x="22" y="36" width="130" height="34" rx="6" fill="#1d211b"/>`+mono(87,58,'LDA #$41',15,'#e8f5df');
  s+=arrow(152,53,214,80); s+=camera(184,48);
  s+=drawerMini(222,62,'$41');
  s+=heb(184,132,'The number goes into the drawer',13);
  s+=heb(184,150,'what was in it before is wiped out',13);
  s+=mono(184,26,'LDA',13,'#ff9b2f','middle',700);
  s+=heb(184,186,'$41 = 65 = the code of A',12,'currentColor');
  // right: STA
  s+=`<rect x="380" y="8" width="372" height="200" rx="14" fill="none" stroke="currentColor" stroke-opacity=".25"/>`;
  s+=mono(566,26,'STA $0400',13,'#ff9b2f','middle',700);
  s+=drawerMini(396,52,'$41','In the drawer: still $41');
  s+=camera(546,62); s+=arrow(508,80,598,80);
  s+=vdgCell(606,40,0x60,36); s+=sponge(600,90); s+=arrow(646,72,676,72,'#ff9b2f',2);
  s+=vdgCell(682,40,0x41,36);
  s+=mono(662,112,'$0400 · 1024',11,'currentColor');
  s+=heb(660,140,'The house is wiped and written',13);
  s+=heb(566,186,'Reading takes a photo. Writing wipes and writes.',13,'currentColor',700);
  return svg(760,216,s);
}
function fig23(){
  let s='';
  s+=`<rect x="150" y="54" width="460" height="56" rx="10" fill="#1d211b"/>`;
  s+=mono(200,92,'␣',26,'#7f8a78'); s+=mono(268,92,'LDA',26,'#9df09d','middle',700); s+=mono(356,92,'#',26,'#ffd59a','middle',700); s+=mono(436,92,'$41',26,'#ffd59a','middle',700);
  s+=arrow(200,40,200,58,'#ff9b2f',2); s+=heb(200,30,'SPACE at the start',12);
  s+=arrow(268,128,268,108,'#ff9b2f',2); s+=heb(268,146,'The command',12); s+=heb(268,162,'meaning: put in drawer A',12);
  s+=arrow(356,40,356,58,'#ff9b2f',2); s+=heb(356,30,'Hash sign = the number itself',12);
  s+=arrow(436,128,436,108,'#ff9b2f',2); s+=heb(436,146,'The number: 65',12); s+=heb(436,162,'(the code of A)',12);
  s+=heb(680,82,'In DREAM',11); s+=heb(680,98,'the SPACE is a must',11);
  return svg(760,172,s);
}

/* ---------------- quizzes ---------------- */
const QUIZ = {
  q0a:{q:'House 1027 holds 5. We write 7 in it, and then 9. What is on the board now?', opts:['9','7','79','5, 7 and 9'], a:0,
       why:['Right! Every write wipes out what was there. Only the last one stays: 9.','The 7 was wiped out when we wrote 9. Every write wipes out the one before.','The board has no room for two numbers. 79 is a completely different number.','A board holds only one number. Never two.']},
  q0b:{q:'We take a photo of house 1025, which holds 65, onto the note. What is left in house 1025?', opts:['65','0','The board is empty','The house is gone'], a:0,
       why:['Right! A photo doesn’t touch the original. 65 is both in the house and on the note.','A photo doesn’t wipe. The original stays as it was.','There is no empty board: a number is always written. And a photo doesn’t change it.','The houses are always there. A photo only copies.']},
  q1a:{q:'The A is in house 1295. What is the house number of the square below it?', opts:['1296','1327','1328'], a:1,
       why:['1296 is a step to the right (plus 1).','Right! Down is plus 32: 1295 + 32 = 1327.','That is down and one step to the right, on the diagonal (plus 33).']},
  q1b:{q:'What will appear if we write 143 in a square?', opts:['A green block you can’t see','The letter O','A black square'], a:0,
       why:['Right! 143 is a full green block, on a green background. It is there, but the eye can’t see it. Try it on the live screen.','143 is bigger than 127, so it is a colour block, not a letter.','A black square is 32 or 128.']}
};
function makeQuiz(el,cfg,onRight){
  el.innerHTML=`<div class="q">🤔 ${cfg.q}</div><div class="opts"></div><div class="fb"></div>`;
  const box=el.querySelector('.opts'), fb=el.querySelector('.fb');
  cfg.opts.forEach((o,i)=>{ const b=document.createElement('button'); b.className='opt'; b.innerHTML=o; b.onclick=()=>{
    box.querySelectorAll('.opt').forEach(x=>x.classList.remove('right','wrong'));
    b.classList.add(i===cfg.a?'right':'wrong'); fb.className='fb '+(i===cfg.a?'ok':'no'); fb.innerHTML=cfg.why[i]; if(i===cfg.a&&onRight) onRight(); };
    box.appendChild(b); });
}
document.querySelectorAll('[data-quiz]').forEach(el=>{ if(QUIZ[el.dataset.quiz]) makeQuiz(el,QUIZ[el.dataset.quiz]); });

/* ---------------- figures in place ---------------- */
const put=(id,html)=>{ const e=document.getElementById(id); if(e) e.innerHTML=html; };
put('fig01',fig01()); put('fig02',fig02()); put('fig03',fig03()); put('fig11',fig11()); put('fig12',fig12());
put('fig21',fig21()); put('fig22',fig22()); put('fig23',fig23());

/* ---------------- interactive street ---------------- */
class Street{
  constructor(host, o){
    this.o=o; this.host=host; this.base=o.base; this.vals=o.vals.slice(); this.sel=o.sel??-1; this.note=null; this.log=[];
    host.innerHTML=`<div class="street-scroll"></div><div class="street-ctrl">
      <div class="row"><span class="sel-l"></span></div>
      <div class="row" style="margin-top:6px">
        ${o.typing!==false?'<input class="num" inputmode="numeric" placeholder="0–255"><button class="btn w">Write (wipe and write)</button>':''}
        <button class="btn ghost c">📷 Photo to the note</button>
        <button class="btn ghost p">Write from the note</button>
        <span class="chip nt">Note: empty</span>
      </div><div class="fb msg"></div></div>`;
    this.sc=host.querySelector('.street-scroll'); this.msg=host.querySelector('.msg');
    const inp=host.querySelector('input');
    host.querySelector('.c').onclick=()=>{ if(this.sel<0) return this.say('First choose a house: click it.'); this.note=this.vals[this.sel]; this.log.push(['copy',this.sel]); this.flashCopy(); this.update(); this.say('You took a photo of house '+(this.base+this.sel)+'. The house still holds '+this.vals[this.sel]+', and the note holds a copy.'); };
    host.querySelector('.p').onclick=()=>{ if(this.sel<0) return this.say('First choose a house: click it.'); if(this.note==null) return this.say('The note is empty. First take a photo of a house.'); this.write(this.note,'note'); };
    if(inp){ const go=()=>{ const t=inp.value.trim(); if(this.sel<0) return this.say('First choose a house: click it.'); if(!/^\d+$/.test(t)) return this.say('Write a whole number, for example 7.'); const v=+t; if(v>255) return this.say('⚠️ '+v+' doesn’t fit on the board! Only a number from 0 to 255 fits on a board. (On the Dragon: POKE answers ?FC ERROR.)', true); this.write(v,'type'); };
      host.querySelector('.w').onclick=go; inp.addEventListener('keydown',e=>{ if(e.key==='Enter') go(); }); }
    this.render();
  }
  say(t,bad){ this.msg.className='fb msg msg '+(bad?'no':'ok'); this.msg.innerHTML=t; }
  write(v,how){
    const i=this.sel, old=this.vals[i];
    this.log.push([how,i,v]);
    this.anim=i; this.animOld=old; this.vals[i]=v; this.render(true);
    this.say('House '+(this.base+i)+' held '+old+'. It was wiped, and '+v+' was written.');
    this.o.onChange&&this.o.onChange(this);
  }
  flashCopy(){ const g=this.sc.querySelector('[data-i="'+this.sel+'"]'); if(!g) return; const r=g.getBoundingClientRect(); const n=this.host.querySelector('.nt').getBoundingClientRect(); fly(r,n,String(this.vals[this.sel])); }
  update(){ this.host.querySelector('.nt').textContent='Note: '+(this.note==null?'empty':this.note); this.host.querySelector('.sel-l').innerHTML=this.sel<0?'No house chosen':'You chose: house <b>'+(this.base+this.sel)+'</b>, and on its board: <b>'+this.vals[this.sel]+'</b>'; }
  render(anim){
    const n=this.vals.length; let s='';
    for(let k=0;k<n;k++) s+=house(8+k*92,8,this.base+k,this.vals[k],{sel:k===this.sel,id:String(k)});
    this.sc.innerHTML=svg(16+n*92,140,s,16+n*92);
    this.sc.querySelector('svg').style.minWidth=Math.min(16+n*92,560)+'px';
    this.sc.querySelectorAll('[data-i]').forEach(g=>g.addEventListener('click',()=>{ this.sel=+g.dataset.i; this.render(); }));
    if(anim){ // sponge wipe animation on the slate
      const g=this.sc.querySelector('[data-i="'+this.anim+'"]'); const t=g.querySelector('.chalk');
      t.textContent=this.animOld; const sp=document.createElementNS(NS,'g'); const x=8+this.anim*92;
      sp.innerHTML=sponge(0,0); g.appendChild(sp); let k=0; const new_=this.vals[this.anim];
      const step=()=>{ k++; sp.setAttribute('transform','translate('+(x+14+(k%10)*4)+','+(8+66)+')'); t.setAttribute('opacity',String(Math.max(0,1-k/14)));
        if(k<16) requestAnimationFrame(step); else { sp.remove(); t.textContent=new_; t.setAttribute('opacity','1'); } };
      requestAnimationFrame(step);
    }
    this.update();
  }
}
const m0 = [
  {t:'Choose house 1027 and write 7 in it. Then write 9 in it. What is left?', ok:s=>s.log.some(l=>l[0]==='type'&&l[1]===3&&l[2]===7)&&s.vals[3]===9},
  {t:'Take a photo of house 1025 onto the note, and then write the note in house 1030.', ok:s=>s.log.some(l=>l[0]==='copy'&&l[1]===1)&&s.vals[6]===s.vals[1]&&s.log.some(l=>l[0]==='note'&&l[1]===6)},
  {t:'Try to write 300 in any house. What happened?', ok:s=>s.tried300}
];
function missions(ul,list,state){
  ul.innerHTML=list.map((m,i)=>`<li data-k="${i}"><span class="box"></span><span>${i+1}. ${m.t}</span></li>`).join('');
  return ()=>{ list.forEach((m,i)=>{ const li=ul.children[i]; const ok=!!m.ok(state()); li.classList.toggle('ok',ok); li.querySelector('.box').textContent=ok?'✓':''; }); };
}
let st1; const chk0=missions(document.getElementById('m0'),m0,()=>st1);
st1=new Street(document.getElementById('street1'),{base:1024,vals:[65,65,0,5,12,96,3,140],onChange:()=>chk0()});
// detect a 300 attempt
document.querySelector('#street1 .w').addEventListener('click',()=>{ const v=+document.querySelector('#street1 input').value; if(v>255){ st1.tried300=true; chk0(); } });
document.querySelector('#street1 input').addEventListener('keydown',e=>{ if(e.key==='Enter'&&+e.target.value>255){ st1.tried300=true; setTimeout(chk0); } });
chk0();
// puzzle 0.1
document.getElementById('t1go').onclick=()=>{
  const a=+document.getElementById('t1a').value, b=+document.getElementById('t1b').value, fb=document.getElementById('t1fb');
  if(a===2&&b===8){ fb.className='fb ok'; fb.innerHTML='Right! House 1030 is left with 2 (the last write wiped out the 8). But the note still has the copy of 8, so house 1031 holds 8. <span class="badge">★ Solved</span>'; }
  else if(a===8){ fb.className='fb no'; fb.innerHTML='Almost. What did action 3 do to house 1030? Writing wipes out what was there.'; }
  else if(b===2){ fb.className='fb no'; fb.innerHTML='Hint: the photo was taken <b>before</b> we wrote 2. What was in the house at the moment of the photo?'; }
  else { fb.className='fb no'; fb.innerHTML='Try going slowly, one action after another. You can also try it on the street above.'; }
};
// puzzle 0.2
const st2=new Street(document.getElementById('street2'),{base:1028,vals:[9,173,40,0,22,96],typing:false,onChange:s=>{
  const fb=document.getElementById('s2fb');
  if(s.vals[5]===173&&s.log.some(l=>l[0]==='note'&&l[1]===5)){ fb.className='fb ok'; fb.innerHTML='Excellent! You took a photo, and then wrote from the note. That is exactly how the computer copies: in Chapter 2 we’ll see that this note is a drawer inside the processor. <span class="badge">★ You finished Chapter 0</span>'; markDone(0); }
  else if(s.vals[1]!==173){ fb.className='fb no'; fb.innerHTML='Oops, house 1029 changed. Refresh the page to start again.'; }
}});

/* ---------------- teaser game (auto-play) ---------------- */
(function(){
  const host=document.getElementById('teaser'); if(host.closest('[hidden]')) return; const sc=new Screen(host,{labels:false});
  let bx=14, ax=Math.floor(Math.random()*32), ay=1, score=0, seed=5;
  setInterval(()=>{
    sc.mem.fill(0x60);
    if(bx<ax) bx++; else if(bx>ax) bx--;
    ay++; if(ay>15){ if(Math.abs(bx-ax)<=0) score=(score+1)%10; seed=(seed+13)&31; ax=seed; ay=1; }
    sc.mem[0]=0x70+score;
    if(ay<15) sc.mem[ay*32+ax]=0x9f;
    sc.mem[15*32+bx]=0xaf; if(ay===15&&ax!==bx) sc.mem[15*32+ax]=0x9f;
    sc.draw();
  },160);
})();

/* ---------------- chapter 1: live screen explorer ---------------- */
function explorer(host,o={}){
  host.innerHTML=`<div class="scrhost"></div><div class="info">Hover or tap a square</div>
   <div class="row" style="margin-top:8px"><span>Write in the chosen square:</span><input class="num" inputmode="numeric" placeholder="0–255"><button class="btn w">Write</button></div>
   <div class="row quick" style="margin-top:6px"></div><div class="fb msg"></div>`;
  const info=host.querySelector('.info'), inp=host.querySelector('input'), msg=host.querySelector('.msg');
  const showInfo=i=>{ if(i<0){ info.innerHTML=sc.sel>=0?txt(sc.sel):'Hover or tap a square'; return; } info.innerHTML=txt(i); };
  const txt=i=>{ const a=1024+i, v=sc.mem[i]; return `House <b>${a}</b> ${L('('+hex4(a)+')')} · row ${Math.floor(i/32)}, column ${i%32} · on the board: <b>${v}</b> = ${describe(v)}`; };
  const sc=new Screen(host.querySelector('.scrhost'),{labels:true,interactive:true,onHover:showInfo,onClick:i=>{ sc.sel=i; sc.draw(); showInfo(i); o.onSelect&&o.onSelect(i); inp.focus({preventScroll:true}); }});
  const write=v=>{ if(sc.sel<0){ msg.className='fb msg no'; msg.textContent='First click a square to choose it.'; return; }
    if(!(v>=0&&v<=255)){ msg.className='fb msg no'; msg.textContent='Only a number from 0 to 255 fits on a board.'; return; }
    const old=sc.mem[sc.sel]; sc.set(sc.sel,v,true); showInfo(sc.sel); msg.className='fb msg ok'; msg.innerHTML=`House ${1024+sc.sel} held ${old}. It was wiped, and ${v} was written: ${describe(v)}.`; o.onChange&&o.onChange(sc); };
  host.querySelector('.w').onclick=()=>{ if(!/^\d+$/.test(inp.value.trim())) { msg.className='fb msg no'; msg.textContent='Write a number, for example 65.'; return; } write(+inp.value); };
  inp.addEventListener('keydown',e=>{ if(e.key==='Enter') host.querySelector('.w').click(); });
  const q=host.querySelector('.quick');
  (o.quick||[65,66,1,96,191,175,143]).forEach(v=>{ const b=document.createElement('button'); b.className='chip'; b.style.display='inline-flex'; b.style.gap='6px'; b.style.alignItems='center';
    const t=tile(v,2); t.style.width='12px'; t.style.height='18px'; b.appendChild(t); b.appendChild(document.createTextNode(String(v))); b.onclick=()=>{ inp.value=v; write(v); }; q.appendChild(b); });
  sc.writeAt=(i,v)=>{ sc.sel=i; sc.draw(); write(v); };
  return sc;
}
const m1=[
  {t:'Tap the top left square. What is its house number?', ok:s=>s.seen0},
  {t:'Write 65 in it. What appeared?', ok:s=>s.mem[0]===65, show:s=>s.writeAt(0,65)},
  {t:'Put an A (65) in the middle of the screen: house 1295.', ok:s=>s.mem[271]===65, show:s=>s.writeAt(271,65)},
  {t:'And now in the bottom right corner: house 1535, the last house of the screen.', ok:s=>s.mem[511]===65, show:s=>s.writeAt(511,65)},
  {t:'Write a word: 72 in house 1100, and 73 in house 1101. A word is simply letters in houses next to each other.', ok:s=>s.mem[76]===72&&s.mem[77]===73, show:s=>{s.writeAt(76,72); setTimeout(()=>s.writeAt(77,73),500);}},
  {t:'Put a B (66) to the right of the A in the middle, and a C (67) below it.', ok:s=>s.mem[272]===66&&s.mem[303]===67, show:s=>{s.writeAt(272,66); setTimeout(()=>s.writeAt(303,67),500);}},
  {t:'Wipe the A from the top corner. Hint: “empty” is a number too: 96.', ok:s=>s.seen0&&s.wrote0&&s.mem[0]===96, show:s=>s.writeAt(0,96)}
];
let ex1; const ulm1=document.getElementById('m1'); const chk1=missions(ulm1,m1,()=>ex1);
m1.forEach((m,i)=>{ if(m.show){ const b=document.createElement('button'); b.className='chip show'; b.textContent='Show me'; b.onclick=()=>{ m.show(ex1); }; ulm1.children[i].appendChild(b);} });
ex1=explorer(document.getElementById('ex1'),{onSelect:i=>{ if(i===0) ex1.seen0=true; chk1(); }, onChange:s=>{ if(s.mem[0]===65) s.wrote0=true; chk1(); }});
chk1();

/* code table */
(function(){
  const rows=[[65,'65','A (every letter: A=65 … Z=90)'],[72,'72','H'],[1,'1','inverted A (inverted letters: 1 to 26)'],[96,'96','empty: an ordinary green square'],[32,'32','black square'],[112,'112','the digit 0 (113 = 1, 114 = 2 …)'],[191,'191','red block'],[175,'175','blue block'],[159,'159','yellow block'],[207,'207','white block'],[255,'255','orange block'],[143,'143','green block… on a green background']];
  const t=document.getElementById('codes');
  rows.forEach(([c,n,d])=>{ const tr=document.createElement('tr'); const a=document.createElement('td'); a.appendChild(tile(c,4)); tr.appendChild(a); tr.insertAdjacentHTML('beforeend',`<td><b class="ltr">${n}</b></td><td>${d}</td>`); t.appendChild(tr); });
})();

/* ---------------- screen puzzles (chapter 1) ---------------- */
function screenPuzzle(host,cfg){
  host.innerHTML=`<span class="tag">${cfg.tag}</span><p>${cfg.q}</p>
   <div class="pz-grid"><div><div class="lbl">This is how it should look:</div><div class="tgt"></div></div><div><div class="lbl">Your screen (click a square and write):</div><div class="mine"></div></div></div>
   <details><summary>Hint</summary><p>${cfg.hint}</p></details><div class="fb res"></div>`;
  const tg=new Screen(host.querySelector('.tgt'),{labels:false}); cfg.target.forEach(([i,v])=>tg.mem[i]=v); tg.draw();
  const res=host.querySelector('.res'); let done=false;
  const ex=explorer(host.querySelector('.mine'),{quick:cfg.quick,onChange:s=>{ if(done) return; if(cfg.check(s.mem)){ done=true; res.className='fb res ok'; res.innerHTML=cfg.win+' <span class="badge">★ Solved</span>'; cfg.onWin&&cfg.onWin(); } }});
  return ex;
}
let won1=0; const win1=()=>{ if(++won1>=3) markDone(1); };
screenPuzzle(document.getElementById('pz11'),{tag:'Puzzle 1',q:'Put an X in the top right corner. The code of X is 88.',target:[[31,88]],quick:[88,96],
  hint:'The top row starts at house 1024, and it has 32 houses: 1024, 1025, … What is the 32nd house?',check:m=>m[31]===88,win:'Exactly: house 1055. 1024 plus 31.',onWin:win1});
screenPuzzle(document.getElementById('pz12'),{tag:'Puzzle 2',q:'Write HI in the third row, wherever you like in the row. H is 72, I is 73.',target:[[64+10,72],[64+11,73]],quick:[72,73,96],
  hint:'The first row starts at 1024, and every row starts 32 after the one before. So the third starts at 1024 + 32 + 32. You can also peek at the numbers at the side of the live screen.',
  check:m=>{ for(let c=0;c<31;c++) if(m[64+c]===72&&m[64+c+1]===73) return true; return false; },win:'Nice! The third row starts at house 1088.',onWin:win1});
screenPuzzle(document.getElementById('pz13'),{tag:'Puzzle 3',q:'Draw a big blue block: 2 by 2 blue squares (175), wherever you like.',target:[[0x10f,175],[0x110,175],[0x12f,175],[0x130,175]],quick:[175,96],
  hint:'Choose a square. The next one to the right: plus 1. Below it: plus 32. And the last one: plus 33.',
  check:m=>{ for(let i=0;i<512-33;i++) if(i%32!==31&&m[i]===175&&m[i+1]===175&&m[i+32]===175&&m[i+33]===175) return true; return false; },win:'Excellent! Right is plus 1, down is plus 32. That is the whole secret of the screen.',onWin:win1});

/* ---------------- mini assembler: LDA #n, LDA addr (from chapter 5), STA addr ----------------
   Same meaning as on the 6809: LDA #n puts n in A; LDA addr copies the byte at addr into A (the cell is unchanged);
   STA addr writes A to addr (A is unchanged). Flags are not shown in these chapters. */
function parseNum(t){
  t=t.trim();
  if(/^\$[0-9A-F]+$/i.test(t)) return parseInt(t.slice(1),16);
  if(/^\d+$/.test(t)) return parseInt(t,10);
  if(/^'.$/.test(t)) { const ch=t[1].toUpperCase(); const k=CHARS.indexOf(ch); return k>=0? (ch>='@'&&ch<='Z'? 0x40+k : k) : null; }
  return null;
}
const TAIL_RE=/^\s*(KEY\s+)?(LDX\s+\$A000|JSR\s+,X|BEQ\s+KEY|RTS)\s*$/i;
function assemble(src,opt={}){
  const out=[], errs=[];
  src.split('\n').forEach((raw,n)=>{
    let line=raw.replace(/;.*$/,'').replace(/\t/g,' ');
    if(!line.trim()||/^\s*\*/.test(line)) return;
    if(TAIL_RE.test(line)) return;
    line=line.replace(/^\s*@/,' ');
    const m=line.trim().match(/^([A-Za-z]+)\s*(.*)$/);
    const N='Line '+(n+1+(opt.lineBase||0))+': ';
    if(!m){ errs.push(N+'I don’t understand this line.'); return; }
    const op=m[1].toUpperCase(), arg=m[2].trim();
    if(op!=='LDA'&&op!=='STA'){ errs.push(N+'So far we have only learnt LDA and STA. We’ll learn '+L(op)+' later (or is it a typo?).'); return; }
    if(!arg){ errs.push(N+'A number is missing after '+L(op)+'.'); return; }
    if(op==='LDA'){
      if(arg[0]!=='#'){
        const a=parseNum(arg);
        if(!opt.read){ errs.push(N+'The '+L('#')+' is missing. Without the hash sign, LDA goes to house '+L(arg)+(a!=null?' ('+a+')':'')+' and copies it. Here we wanted the number itself: '+L('LDA #'+arg)+'. (Chapter 5 is all about this.)'); return; }
        if(a==null){ errs.push(N+'I don’t understand the house number '+L(arg)+'.'); return; }
        if(a<0x400||a>0x5ff){ errs.push(N+'House '+L(arg)+' ('+a+') is not on the screen. On this page we only read from screen squares ('+L('$0400')+' to '+L('$05FF')+'), because only those can we see.'); return; }
        out.push({op,mode:'ext',a,line:n,text:raw.trim()}); return;
      }
      const v=parseNum(arg.slice(1)); if(v==null){ errs.push(N+'I don’t understand the number '+L(arg.slice(1))+'. You write, for example, '+L('#$41')+' or '+L('#65')+'.'); return; }
      if(v>255){ errs.push(N+'The number '+L(arg.slice(1))+' ('+v+') is too big for the drawer: only 0 to 255 fits. (DREAM would quietly keep only '+L(hex2(v&255))+', and that is probably not what you wanted.)'); return; }
      out.push({op,mode:'imm',v,line:n,text:raw.trim()});
    } else {
      if(arg[0]==='#'){ errs.push(N+'STA doesn’t take a '+L('#')+'. It needs the number of a house, not a number to write.'); return; }
      const a=parseNum(arg); if(a==null){ errs.push(N+'I don’t understand the house number '+L(arg)+'. You write, for example, '+L('$0400')+' or '+L('1024')+'.'); return; }
      if(a<0x400||a>0x5ff){ errs.push(N+'House '+L(arg)+' ('+a+') is not on the screen. The screen is from 1024 to 1535 ('+L('$0400')+' to '+L('$05FF')+'). Writing to another house can break the computer, so we don’t run it here.'); return; }
      out.push({op,a,line:n,text:raw.trim()});
    }
  });
  return {prog:out,errs};
}
const charNote = v => (v>=0x40&&v<0x5b?', the code of '+CHARS[v&63]:'');

/* ---------------- program window with STEP ---------------- */
function progWindow(host,cfg){
  host.innerHTML=`<div class="prog"><div class="prog-title"><span>${cfg.title}</span><span>✓ Checked in DREAM on our Dragon machine</span></div>
    ${cfg.predict?'<div class="predict"><div class="q">🤔 Guess first: '+cfg.predict.q+'</div><div class="opts"></div><div class="fb pfb"></div></div>':''}
    ${cfg.gap?'<div class="gapopts"><div class="q">'+(cfg.gapq||'Which line is missing?')+'</div><div class="opts gopts"></div><div class="fb gfb"></div></div>':''}
    <div class="prog-body"><ol class="code"></ol><div class="cpu">${svg(320,210,cpuBox({val:null}),300)}</div><div class="scr-cell"><div class="scr"></div></div></div>
    <div class="stepsay"><div class="box">Press <b>Step</b> to carry out the first line.</div></div>
    <div class="ctrls"><button class="btn st">Step ▶</button><button class="btn ghost run">Run all</button><button class="btn ghost rs">From the start ↺</button></div></div>`;
  const P=host.querySelector('.prog'), pfb=P.querySelector(".pfb")||document.createElement('div'), ol=P.querySelector('ol.code'), sayb=P.querySelector('.stepsay .box');
  const sc=new Screen(P.querySelector('.scr'),{labels:true,hexcols:!!cfg.hexcols,interactive:!!(cfg.predict&&cfg.predict.cell),onClick:i=>pickCell(i),onHover:()=>{}});
  const aval=P.querySelector('.aval'), adec=P.querySelector('.adec'), drawer=P.querySelector('.drawerA');
  let lines=cfg.lines.slice(), pc=0, A=null, guess=null, busy=false, gapOk=!cfg.gap, stopped=false;
  sendBtn(P,host,cfg,()=>({lines,tail:'real'}));
  const btnS=P.querySelector('.st'), btnR=P.querySelector('.run');
  function renderCode(){
    ol.innerHTML='';
    lines.forEach((l,k)=>{ const li=document.createElement('li');
      if(l===null){ li.className='gap'; li.textContent=(k===0?'@ ':'  ')+' ???'; }
      else { const m=l.match(/^(@?\s*)(\w+)\s+(.*)$/); li.innerHTML=(k===0?'@ ':' ')+'<span class="op">'+m[2]+'</span> <span class="arg">'+m[3]+'</span>'; }
      if(k===pc) li.classList.add('cur'); if(k<pc) li.classList.add('done'); ol.appendChild(li); });
    const t=document.createElement('li'); t.className='tail'; t.textContent='… the fixed ending (4 lines that wait for a key)'; if(pc>=lines.length) t.classList.add('cur'); ol.appendChild(t);
  }
  function setA(v){ A=v; aval.textContent=v==null?'?':hex2(v); adec.textContent=v==null?'':v+(v>=0x40&&v<0x5b?'  '+CHARS[v&63]:''); }
  function reset(){ pc=0; stopped=false; setA(null); sc.clear(); renderCode(); sayb.innerHTML=lines.includes(null)?'First choose the missing line.':'The screen is clean, like in DREAM before a run. Drawer A holds a number we don’t know, so “?”. Press <b>Step</b>.'; lock(); }
  function lock(){ const need=(cfg.predict&&guess==null)||!gapOk; btnS.disabled=need||busy||pc>lines.length; btnR.disabled=need||busy||pc>lines.length; if(need&&cfg.predict&&guess==null) sayb.innerHTML='👆 Guess first, then we run.'; }
  async function step(){
    if(busy) return; busy=true; lock();
    const items=ol.querySelectorAll('li');
    if(pc>=lines.length){ sayb.innerHTML='The program has reached the fixed ending and is waiting for a key. On the Dragon: you look, press a key, and go back to the editor.'; pc++; renderCode(); busy=false; lock(); reveal(); return; }
    const l=lines[pc]; const asm=assemble(l,{read:true});
    if(asm.errs.length||!asm.prog.length){ sayb.innerHTML='⚠️ The processor can’t carry out this line the way we wanted: '+(asm.errs[0]||'').replace(/^Line \d+: /,''); items[pc].style.background='#5a1d18'; busy=false; stopped=true; btnS.disabled=true; btnR.disabled=true; return; }
    const r=asm.prog[0];
    if(r.op==='LDA'&&r.mode==='imm'){
      sayb.innerHTML=`${L('LDA #'+hex2(r.v))}: put the number ${L(hex2(r.v))} (${r.v}${charNote(r.v)}) in drawer A. ${A!=null&&A!==r.v?'The '+L(hex2(A))+' that was in the drawer is wiped out.':''}`;
      await fly(items[pc].getBoundingClientRect(), P.querySelector('.aval-bg').getBoundingClientRect(), hex2(r.v));
      setA(r.v); drawer.style.filter='brightness(1.25)'; setTimeout(()=>drawer.style.filter='',300);
    } else if(r.op==='LDA'){
      const i=r.a-0x400, v=sc.mem[i];
      sayb.innerHTML=`${L('LDA '+hex4(r.a))}: no hash sign! Go to house ${L(hex4(r.a))} (${r.a}), take a photo of what is written there: ${L(hex2(v))} (${v}, ${describe(v)}), and put it in drawer A. 📷 The house itself hasn’t changed.${A!=null&&A!==v?' The '+L(hex2(A))+' that was in the drawer is wiped out.':''}`;
      sc.marks={}; sc.marks[i]='#9fc6ff'; sc.draw();
      await fly(sc.cellRect(i), P.querySelector('.aval-bg').getBoundingClientRect(), hex2(v));
      sc.marks={}; sc.draw();
      setA(v); drawer.style.filter='brightness(1.25)'; setTimeout(()=>drawer.style.filter='',300);
    } else {
      const i=r.a-0x400, old=sc.mem[i];
      sayb.innerHTML=`${L('STA '+hex4(r.a))}: take a photo of what is in drawer A (${L(hex2(A))}) and write it in house ${L(hex4(r.a))} (${r.a}). What was there (${old===0x60?'empty':describe(old)}) is wiped out. Drawer A <b>still</b> holds ${L(hex2(A))}.`;
      await fly(P.querySelector('.aval-bg').getBoundingClientRect(), sc.cellRect(i), hex2(A));
      sc.set(i,A,true);
    }
    pc++; renderCode(); busy=false; lock();
  }
  async function runAll(){ stopped=false; while(pc<=lines.length&&!stopped){ await step(); await sleep(300); } }
  function pickCell(i){ if(!cfg.predict||!cfg.predict.cell||pc>0) return; guess=i; sc.marks={}; sc.marks[i]='#ff9b2f'; sc.draw(); pfb.className='fb pfb'; pfb.innerHTML='Your guess is marked with an orange frame (house '+L(hex4(0x400+i))+', '+(1024+i)+'). Now run it.'; lock(); sayb.innerHTML='Great. Now press <b>Step</b>.'; }
  function reveal(){
    if(!cfg.predict||guess==null) return; const fb=pfb;
    const right=cfg.predict.cell? cfg.predict.check(guess): guess===cfg.predict.a;
    fb.className='fb pfb '+(right?'ok':'no'); fb.innerHTML=(right?'✓ You were right! ':'✗ Not quite. ')+cfg.predict.why;
    if(cfg.predict.cell){ sc.marks={}; sc.draw(); }
  }
  if(cfg.predict){
    const po=P.querySelector('.predict .opts');
    if(cfg.predict.cell){ po.innerHTML='<span class="chip">Click the square on the screen below</span>'; }
    else cfg.predict.opts.forEach((o,k)=>{ const b=document.createElement('button'); b.className='opt'; b.innerHTML=o; b.onclick=()=>{ if(pc>0) return; guess=k; po.querySelectorAll('.opt').forEach(x=>x.style.borderColor=''); b.style.borderColor='var(--warm)'; pfb.innerHTML='You’ve chosen. Now run it and we’ll see.'; lock(); sayb.innerHTML='Press <b>Step</b>.'; }; po.appendChild(b); });
  }
  if(cfg.gap){
    const gi=lines.indexOf(null), go=P.querySelector('.gopts'), gfb=P.querySelector('.gfb');
    cfg.gap.forEach((g,k)=>{ const b=document.createElement('button'); b.className='opt'; b.innerHTML=L(g.t); b.onclick=()=>{
      go.querySelectorAll('.opt').forEach(x=>x.classList.remove('right','wrong')); b.classList.add(g.ok?'right':'wrong');
      gfb.className='fb '+(g.ok?'ok':'no'); gfb.innerHTML=g.why; lines[gi]=g.t; gapOk=true; reset(); sayb.innerHTML=g.ok?'The line is in place. Press <b>Step</b> and you’ll see.':'This line is in place. Run it and see what comes out, then try another line.'; if(g.ok&&cfg.onWin) cfg.onWin(); }; go.appendChild(b); });
  }
  btnS.onclick=step; btnR.onclick=runAll; P.querySelector('.rs').onclick=()=>reset();
  reset();
}

progWindow(document.getElementById('pw1'),{title:'Example 1 · One letter',lines:['@ LDA #$41','STA $0400'],
  predict:{cell:true,q:'Which square will the A appear on? Click it on the screen.',check:i=>i===0,why:'<bdi class="ltr">$0400</bdi> is 1024: the top left corner, the first house of the screen.'}});
progWindow(document.getElementById('pw2'),{title:'Example 2 · The same letter twice',lines:['@ LDA #$41','STA $0400','STA $05FF'],
  predict:{q:'We put A in the drawer once, and wrote twice. How many A’s will appear?',opts:['One','Two','None'],a:1,why:'STA takes a photo of the drawer and doesn’t empty it. After the first write it still holds <bdi class="ltr">$41</bdi>, so we can write it again. <bdi class="ltr">$05FF</bdi> is 1535: the bottom right corner.'}});
progWindow(document.getElementById('pw3'),{title:'Example 3 · A word: HI',lines:['@ LDA #$48','STA $040F','LDA #$49','STA $0410'],
  predict:{q:'What will be in drawer A at the end of the program?',opts:['<bdi class="ltr">$48</bdi> (H)','<bdi class="ltr">$49</bdi> (I)','Both H and I'],a:1,why:'The drawer, like the board, holds one number. The second LDA wiped out the H and put I. But on the screen the H stayed, because it was already written to house <bdi class="ltr">$040F</bdi>.'}});
progWindow(document.getElementById('pw4'),{title:'Example 4 · Writing over the same house',lines:['@ LDA #$41','STA $0500','LDA #$42','STA $0500'],
  predict:{q:'What will we see at the end in house <bdi class="ltr">$0500</bdi> (1280)?',opts:['A','B','AB'],a:1,why:'STA wipes out what was in the house and writes. The A appeared for a moment, and was wiped out when the B was written. (Press Step again and again to see it happen.)'}});
progWindow(document.getElementById('pw5'),{title:'Example 5 · A tower of colours',lines:['@ LDA #$BF','STA $04CF','LDA #$9F','STA $04EF','LDA #$AF','STA $050F'],
  predict:{q:'The houses are <bdi class="ltr">$04CF</bdi>, <bdi class="ltr">$04EF</bdi>, <bdi class="ltr">$050F</bdi> (1231, 1263, 1295). How will the three blocks be arranged?',opts:['Side by side','One under the other','Scattered'],a:1,why:'Each house is 32 more than the one before (1231, 1263, 1295). Plus 32 is one row down. <bdi class="ltr">$BF</bdi> red, <bdi class="ltr">$9F</bdi> yellow, <bdi class="ltr">$AF</bdi> blue.'}});
progWindow(document.getElementById('pw6'),{title:'Missing example · OK in the middle',lines:['@ LDA #$4F','STA $050F','LDA #$4B',null],
  gap:[{t:'STA $0510',ok:true,why:'Right! <bdi class="ltr">$0510</bdi> is the house to the right of <bdi class="ltr">$050F</bdi> (plus 1). Run it and you’ll see OK.'},
       {t:'STA $050F',ok:false,why:'That is the same house where we already wrote O. The K will wipe out the O, and only K will be left. Run it and see.'},
       {t:'LDA #$0510',ok:false,why:'LDA only puts a number in the drawer, and doesn’t write anything on the screen. And also: <bdi class="ltr">$0510</bdi> is too big for the drawer (more than 255).'}]});

/* broken program picture: what we saw on the machine */
(function(){ const s=new Screen(document.getElementById('broken'),{labels:true}); s.mem[0]=0x00; s.draw(); })();

/* ---------------- write-it-yourself puzzles ---------------- */
function cellInfo(mem,i){ const a=0x400+i, v=mem[i]; return `House <b>${L(hex4(a))}</b> (${a}) · row ${Math.floor(i/32)}, column ${i%32} ${L('($'+(i%32).toString(16).toUpperCase().padStart(2,'0')+')')} · <b>${L(hex2(v))}</b> = ${v} = ${describe(v)}`; }
function codePuzzle(host,cfg){
  const pre=cfg.pre||[];
  const preHtml=pre.length?`<ol class="code locked">${pre.map((l,k)=>{ const m=l.match(/^(@?\s*)(\w+)\s+(.*)$/); return '<li>'+(k===0?'@ ':' ')+'<span class="op">'+m[2]+'</span> <span class="arg">'+m[3]+'</span></li>'; }).join('')}<li class="tail">🔒 These lines are already written. Carry on below them:</li></ol>`:'';
  host.innerHTML=`<span class="tag">${cfg.tag}</span><p>${cfg.q}</p>
   <div class="pz-grid"><div><div class="lbl">This is how it should look:</div><div class="tgt"></div><div class="info tinfo">Hover or tap the picture to see numbers</div></div>
   <div><div class="lbl">Your program:</div>${preHtml}<textarea class="src" spellcheck="false" autocapitalize="characters" autocomplete="off">${cfg.start||''}</textarea>
   <div class="row" style="margin-top:6px"><button class="btn go">Run and check</button><button class="btn ghost sol">Solution</button></div></div></div>
   <div class="lbl" style="margin-top:8px">Your screen after the run:</div><div class="mine"></div>
   <details><summary>Hint 1</summary><p>${cfg.hint1}</p></details><details><summary>Hint 2</summary><p>${cfg.hint2}</p></details>
   <div class="fb res"></div>`;
  const T=new Uint8Array(512).fill(0x60); cfg.target.forEach(([i,v])=>T[i]=v);
  const ti=host.querySelector('.tinfo');
  const tg=new Screen(host.querySelector('.tgt'),{labels:!!cfg.hexcols,hexcols:!!cfg.hexcols,interactive:true,onHover:i=>{ ti.innerHTML=i<0?'Hover or tap the picture to see numbers':cellInfo(tg.mem,i); },onClick:i=>{ ti.innerHTML=cellInfo(tg.mem,i); }});
  tg.mem.set(T); tg.draw();
  const mine=new Screen(host.querySelector('.mine'),{labels:true,hexcols:!!cfg.hexcols});
  const ta=host.querySelector('textarea'), res=host.querySelector('.res');
  host.querySelector('.sol').onclick=()=>{ ta.value=cfg.solution; res.className='fb res'; res.innerHTML='This is one solution. If you wrote a different one that works, it is right too. Press “Run and check”.'; };
  host.querySelector('.go').onclick=async ()=>{
    const P0=assemble(pre.join('\n'),{read:true});
    const {prog,errs}=assemble(ta.value,{read:!!cfg.read,lineBase:pre.length});
    if(errs.length){ res.className='fb res no'; res.innerHTML=errs.map(e=>'⚠️ '+e).join('<br>'); return; }
    if(!prog.length){ res.className='fb res no'; res.innerHTML='No lines yet. Start with LDA.'; return; }
    const ruleMsg=cfg.rule&&cfg.rule(prog); if(ruleMsg){ res.className='fb res no'; res.innerHTML='⚠️ '+ruleMsg; return; }
    mine.clear(); let A=null, warnA=false;
    for(const p of P0.prog.concat(prog)){
      if(p.op==='LDA') A = p.mode==='imm'? p.v : mine.mem[p.a-0x400];
      else { if(A==null){ warnA=true; continue; } mine.set(p.a-0x400,A,true); await sleep(140); }
    }
    let diff=0; mine.marks={}; for(let i=0;i<512;i++) if(mine.mem[i]!==T[i]){ diff++; mine.marks[i]='#c0392b'; } mine.draw();
    const nl=prog.length;
    if(warnA){ res.className='fb res no'; res.innerHTML='There is an STA before any LDA: we haven’t put anything in the drawer yet. On the Dragon a random number would come out there.'; return; }
    if(!diff){ res.className='fb res ok'; res.innerHTML='✓ The screen matches the picture! '+(nl<=cfg.best?'And in the shortest way too: '+nl+' lines.':'You did it in '+nl+' lines. Challenge: it can also be done in '+cfg.best+'.')+' <span class="badge">★ Solved</span>'; if(!host._won){ host._won=1; cfg.onWin&&cfg.onWin(); } }
    else { res.className='fb res no'; res.innerHTML='Almost! '+diff+' squares are not like the picture. I marked them in red on your screen.'+(cfg.diffHint?' '+cfg.diffHint(mine.mem):''); }
  };
}

let won2=0; const win2=()=>{ if(++won2>=2) markDone(2); };
codePuzzle(document.getElementById('pz21'),{tag:'Puzzle 1 · Four corners',q:'Colour the four corners of the screen red (<bdi class="ltr">$BF</bdi>).',
  target:[[0,0xbf],[31,0xbf],[480,0xbf],[511,0xbf]],start:'@ LDA #$BF\n STA $0400\n',best:5,
  hint1:'The corners: you have already seen <bdi class="ltr">$0400</bdi> (1024) and <bdi class="ltr">$05FF</bdi> (1535). The top right one is 1024 plus 31. The bottom left one is the start of the last row (the number at the side of the screen).',
  hint2:'You need only one LDA! The drawer doesn’t empty, so you can write from it four times.',
  solution:'@ LDA #$BF\n STA $0400\n STA $041F\n STA $05E0\n STA $05FF\n',onWin:win2});
codePuzzle(document.getElementById('pz22'),{tag:'Puzzle 2 · A face',q:'Draw the face: two yellow eyes (<bdi class="ltr">$9F</bdi>) and a red mouth (<bdi class="ltr">$BF</bdi>).',
  target:[[0x8d,0x9f],[0x92,0x9f],[0xee,0xbf],[0xef,0xbf],[0xf0,0xbf],[0xf1,0xbf]],start:'@ LDA #$9F\n',best:8,
  hint1:'The eyes are in row 4 (which starts at <bdi class="ltr">$0480</bdi>), in columns 13 and 18. The mouth is in row 7 (<bdi class="ltr">$04E0</bdi>), columns 14 to 17. Hover over the picture’s screen in Chapter 1 if you need to check a number.',
  hint2:'Column 13 in row 4 is 1152 + 13 = 1165, that is <bdi class="ltr">$048D</bdi>. Two LDAs are enough: one for yellow and one for red.',
  solution:'@ LDA #$9F\n STA $048D\n STA $0492\n LDA #$BF\n STA $04EE\n STA $04EF\n STA $04F0\n STA $04F1\n',onWin:win2});

/* =================== chapters 3–5 =================== */
const HEXD='0123456789ABCDEF';
const winner=(ch,need)=>{ const got=new Set(); return key=>{ got.add(key); if(got.size>=need) markDone(ch); }; };

/* quizzes */
Object.assign(QUIZ,{
  q3a:{q:'The computer’s odometer shows <bdi class="ltr">$0019</bdi>. What will it show after +1?',opts:['<bdi class="ltr">$001A</bdi>','<bdi class="ltr">$0020</bdi>','<bdi class="ltr">$0110</bdi>'],a:0,
       why:['Right! After 9 it doesn’t roll over: it carries on to A. The right wheel only rolls over after F.','That is what would happen in ordinary counting (19 plus 1). Here A comes after 9.','Only one wheel moves on a +1 step, unless it rolls over.']},
  q3b:{q:'How much is <bdi class="ltr">$0500</bdi> in ordinary counting?',opts:['1280','500','1024'],a:0,
       why:['Right! 5 × 256 = 1280. And that is exactly the middle of the screen: 1024 + 256.','The $ says this is not five hundred. Each place is worth 16 times more, not 10 times.','1024 is <bdi class="ltr">$0400</bdi>. Here there is a 5 in the 256 place.']},
  q3c:{q:'What is the house of the square just below <bdi class="ltr">$050F</bdi>?',opts:['<bdi class="ltr">$052F</bdi>','<bdi class="ltr">$051F</bdi>','<bdi class="ltr">$0510</bdi>'],a:0,
       why:['Right! Down is +$20: the second digit from the right goes up by 2.','+$10 is only 16 squares to the right, half a row.','<bdi class="ltr">$0510</bdi> is the square to the right (+1).']},
  q4a:{q:'Which number gives a square with only its right half magenta?',opts:['<bdi class="ltr">$E5</bdi>','<bdi class="ltr">$EA</bdi>','<bdi class="ltr">$5E</bdi>'],a:0,
       why:['Right! Magenta = E. The right half = lamp 4 (top right) plus lamp 1 (bottom right) = 5.','A = 8+2: those are the two left lamps.','The order is back to front: the left digit is the colour. <bdi class="ltr">$5E</bdi> is even less than 128, so it is a character, not a colour square.']},
  q5a:{q:'Drawer A holds <bdi class="ltr">$41</bdi>, and house <bdi class="ltr">$0400</bdi> holds <bdi class="ltr">$9F</bdi>. What will be in the drawer after <bdi class="ltr">LDA $0400</bdi>?',opts:['<bdi class="ltr">$9F</bdi>','<bdi class="ltr">$0400</bdi>','<bdi class="ltr">$41</bdi>'],a:0,
       why:['Right! No hash sign: go to house <bdi class="ltr">$0400</bdi> and copy it. The $41 that was in the drawer is wiped out.','<bdi class="ltr">$0400</bdi> is the address, not what is in it. And it wouldn’t fit anyway: it is bigger than 255.','LDA always replaces what is in the drawer.']},
  q5b:{q:'Which line is wrong?',opts:['<bdi class="ltr">STA #$0400</bdi>','<bdi class="ltr">LDA $0400</bdi>','<bdi class="ltr">LDA #$04</bdi>'],a:0,
       why:['Right! STA always writes to a house, and has nothing to do with a hash sign.','This is a good line: copy house <bdi class="ltr">$0400</bdi>.','This is a good line: put 4 in the drawer. (On the screen 4 is an inverse D.)']}
});
['q3a','q3b','q3c','q4a','q5a','q5b'].forEach(k=>{ const el=document.querySelector('[data-quiz="'+k+'"]'); if(el) makeQuiz(el,QUIZ[k]); });

/* ---------- chapter 3 figures ---------- */
function fig31(){
  let s='';
  for(let k=0;k<16;k++){ const x=12+k*46, let_=k>9;
    s+=`<rect x="${x}" y="14" width="40" height="46" rx="7" fill="${let_?'#ff9b2f':'#1d211b'}"/>`+mono(x+20,46,HEXD[k],24,let_?'#fff':'#e8f5df','middle',700);
    s+=heb(x+20,80,String(k),13); }
  s+=heb(12+12*46+20,104,'A to F are 10 to 15',13,'#c06a10',700);
  return svg(760,112,s);
}
function wheelRow(x,y,str,hot=[],dark=true,w=34){
  let s=''; const n=str.length;
  for(let k=0;k<n;k++){ const xx=x+k*(w+4), d=str[k], base=dark?HEXD:'0123456789', idx=base.indexOf(d);
    const prev=base[(idx-1+base.length)%base.length], next=base[(idx+1)%base.length];
    s+=`<rect x="${xx}" y="${y}" width="${w}" height="58" rx="5" fill="${dark?'#1d211b':'#3b4048'}" stroke="${hot.includes(k)?'#ffd23f':'#000'}" stroke-width="${hot.includes(k)?3:1}"/>`;
    s+=mono(xx+w/2,y+14,prev,11,'#7f8a78')+mono(xx+w/2,y+38,d,22,'#fff','middle',700)+mono(xx+w/2,y+53,next,11,'#7f8a78');
  }
  return s;
}
function fig32(){
  let s='';
  const st=[['00FE','00254'],['00FF','00255'],['0100','00256']];
  st.forEach(([h,d],k)=>{ const x=20+k*250;
    s+=mono(x-4,46,'$',22,'currentColor','end',700)+wheelRow(x,16,h,k===2?[1,2,3]:(k===1?[3]:[]),true);
    s+=wheelRow(x-18,104,d,k>0?[4]:[],false,28);
    s+=heb(x+76,182,k===0?'254':(k===1?'255':'256'),14,'currentColor',700);
    if(k<2){ s+=arrow(x+160,46,x+232,46); s+=mono(x+196,36,'+1',13,'#ff9b2f','middle',700); s+=arrow(x+160,134,x+232,134); }
  });
  s+=`<rect x="520" y="190" width="236" height="36" rx="10" fill="#fff7b0" stroke="#c8b24a"/>`+heb(638,213,'F plus 1 = 0, and carry 1 to the next wheel',13,'#333');
  s+=heb(150,213,'Top: counting by 16 · Bottom: ordinary counting',12,'currentColor');
  return svg(760,232,s);
}
function fig33(){
  let s=''; const dg=['0','4','2','0'], wt=['4096','256','16','1'], pr=['0','1024','32','0'];
  s+=mono(150,62,'$',30,'currentColor','end',700);
  dg.forEach((d,k)=>{ const x=160+k*120;
    s+=`<rect x="${x}" y="22" width="70" height="60" rx="8" fill="#1d211b"/>`+mono(x+35,64,d,32,'#ffd59a','middle',700);
    s+=mono(x+35,108,'×'+wt[k],15)+arrow(x+35,116,x+35,140,'#ff9b2f',2)+mono(x+35,162,pr[k],18,'currentColor','middle',700);
    if(k<3) s+=mono(x+95,162,'+',18,'currentColor');
  });
  s+=mono(380,206,'= 1056',22,'#1daa1d','middle',700);
  return svg(760,220,s);
}
/* nicer row starts: colour the two changing digits */
function fig34b(){
  let s='';
  for(let r=0;r<16;r++){ const col=r<8?0:1, rr=r%8, x=30+col*370, y=10+rr*30;
    const a=0x400+r*32, h=hex4(a).slice(1);
    s+=`<text x="${x+92}" y="${y+18}" text-anchor="end" ${FM} font-size="16" fill="currentColor">$0<tspan fill="#ff9b2f" font-weight="700">${h[1]}</tspan><tspan fill="#1daa1d" font-weight="700">${h[2]}</tspan>0</text>`;
    s+=mono(x+142,y+18,'('+a+')',11,'currentColor');
    s+=`<rect x="${x+176}" y="${y+4}" width="150" height="18" rx="3" fill="${r===8?'#ff9b2f':'#1daa1d'}" opacity=".85"/>`+heb(x+251,y+18,'Row '+r,11,'#fff');
  }
  s+=heb(380,262,'Each row adds $20. After $04E0 the green wheel rolls over, and the orange one goes up to 5',13);
  return svg(760,272,s);
}
put('fig31',fig31()); put('fig32',fig32()); put('fig33',fig33()); put('fig34',fig34b());

/* hex key numbers */
(function(){
  const t=document.getElementById('hexkeys');
  [['$10','16','one wheel to the left'],['$20','32','one row on the screen'],['$FF','255','the biggest that fits in a house'],['$0100','256','one after $FF'],['$0400','1024','start of the screen'],['$0500','1280','middle of the screen (row 8)'],['$05FF','1535','end of the screen'],['$0600','1536','not the screen any more']]
  .forEach(([h,d,w])=>t.insertAdjacentHTML('beforeend',`<tr><td><b class="ltr">${h}</b></td><td class="ltr">${d}</td><td>${w}</td></tr>`));
})();

/* ---------- odometer toy ---------- */
function odometer(host,onEvt){
  host.innerHTML=`<div class="odo-wrap"><div class="odo-row"><span class="odo-d">$</span><div class="odo h"></div></div>
    <div class="odo-row small"><span class="odo-lbl">Ordinary:</span><div class="odo d"></div></div>
    <div class="odo-where info"></div>
    <div class="row" style="justify-content:center;margin-top:8px"><button class="btn" data-k="1"><bdo dir="ltr">+1</bdo></button><button class="btn" data-k="16"><bdo dir="ltr">+$10</bdo></button><button class="btn warm" data-k="32"><bdo dir="ltr">+$20</bdo> row</button><button class="btn" data-k="256"><bdo dir="ltr">+$100</bdo></button><button class="btn ghost" data-k="-1"><bdo dir="ltr">−1</bdo></button><button class="btn ghost" data-k="0">↺ <bdi dir="ltr">$0400</bdi></button></div></div>`;
  const H=host.querySelector('.odo.h'), D=host.querySelector('.odo.d'), where=host.querySelector('.odo-where');
  const mk=(el,n,base)=>{ el.innerHTML=''; const ws=[]; for(let k=0;k<n;k++){ const w=document.createElement('div'); w.className='wheel'; const s=document.createElement('div'); s.className='strip'; for(let j=0;j<=base;j++){ const d=document.createElement('div'); d.textContent=HEXD[j%base]; s.appendChild(d);} w.appendChild(s); el.appendChild(w); ws.push({w,s,base,cur:0}); } return ws; };
  const hw=mk(H,4,16), dw=mk(D,5,10);
  let v=0x400;
  const setW=(ws,val,base,anim)=>{ const n=ws.length; for(let k=0;k<n;k++){ const d=Math.floor(val/Math.pow(base,n-1-k))%base, W=ws[k];
      if(d===W.cur) continue;
      const hgt=W.w.clientHeight||44;
      if(anim&&d===0&&W.cur===base-1){ W.s.style.transition='transform .45s'; W.s.style.transform=`translateY(${-base*hgt}px)`; W.w.classList.add('flip'); setTimeout(()=>{ W.s.style.transition='none'; W.s.style.transform=`translateY(${-W.cur*hgt}px)`; W.w.classList.remove('flip'); },470); }
      else { W.s.style.transition=anim?'transform .45s':'none'; W.s.style.transform=`translateY(${-d*hgt}px)`; if(anim){ W.w.classList.add('flip'); setTimeout(()=>W.w.classList.remove('flip'),470);} }
      W.cur=d; } };
  const show=(anim)=>{ setW(hw,v,16,anim); setW(dw,v,10,anim);
    const inScr=v>=0x400&&v<=0x5ff, i=v-0x400;
    where.innerHTML=`<b class="ltr">${hex4(v)}</b> = <b>${v}</b> · `+(inScr?`On the screen: row ${Math.floor(i/32)}, column ${i%32}`+(i%32===0?' (start of a row)':''):(v<0x400?'before the screen':'after the screen: not a square any more'));
  };
  host.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{ const k=+b.dataset.k; const old=v; v = k===0?0x400:Math.max(0,Math.min(0xFFFF,v+k)); show(true); onEvt&&onEvt(old,v); });
  new ResizeObserver(()=>{ hw.concat(dw).forEach(W=>{ W.s.style.transition='none'; W.s.style.transform=`translateY(${-W.cur*(W.w.clientHeight||44)}px)`; }); }).observe(host);
  show(false);
}
(function(){
  const st={carry:false,row:false,double:false,last:false};
  const ms=[
    {t:'Press +1 until the right wheel passes F. What happened to the wheel next to it?',ok:()=>st.carry},
    {t:'Get to <bdi class="ltr">$0420</bdi>, the start of the second row on the screen.',ok:()=>st.row},
    {t:'Get to <bdi class="ltr">$04FF</bdi>, then press +1. How many wheels moved together?',ok:()=>st.double},
    {t:'Get to <bdi class="ltr">$05FF</bdi>, the last square of the screen. How much is that in ordinary counting?',ok:()=>st.last}];
  const chk=missions(document.getElementById('m3'),ms,()=>st);
  odometer(document.getElementById('odo'),(o,v)=>{ if((o&15)===15&&v===o+1) st.carry=true; if(v===0x420) st.row=true; if(o===0x4ff&&v===0x500) st.double=true; if(v===0x5ff) st.last=true; chk(); });
  chk();
})();

/* hex → decimal puzzle */
document.getElementById('h1go').onclick=()=>{
  const a=+document.getElementById('h1a').value, b=+document.getElementById('h1b').value, c=+document.getElementById('h1c').value, fb=document.getElementById('h1fb');
  const bad=[]; if(a!==1056) bad.push('<bdi class="ltr">$0420</bdi>: that is <bdi class="ltr">$0400</bdi> (1024) plus <bdi class="ltr">$20</bdi> (32).'); if(b!==1535) bad.push('<bdi class="ltr">$05FF</bdi>: this is the last corner of the screen. You saw it in Chapter 1.'); if(c!==255) bad.push('<bdi class="ltr">$FF</bdi>: 15 × 16 + 15.');
  if(!bad.length){ fb.className='fb ok'; fb.innerHTML='All three are right: 1056, 1535, 255. <span class="badge">★ Solved</span>'; win3('h'); }
  else { fb.className='fb no'; fb.innerHTML='Not yet. '+bad.join(' '); }
};
const win3=winner(3,4);

/* program windows, chapter 3 */
progWindow(document.getElementById('pw31'),{title:'Example 1 · one row down',hexcols:true,lines:['@ LDA #$58','STA $0420'],
  predict:{cell:true,q:'Which square will the X appear on? Click it on the screen.',check:i=>i===32,why:'<bdi class="ltr">$0420</bdi> = <bdi class="ltr">$0400</bdi> plus <bdi class="ltr">$20</bdi>: one row down, column 0.'}});
progWindow(document.getElementById('pw32'),{title:'Example 2 · middle of the screen',hexcols:true,lines:['@ LDA #$4F','STA $0510'],
  predict:{cell:true,q:'Where will the O appear? Click the square.',check:i=>i===0x110,why:'<bdi class="ltr">$0500</bdi> is the start of row 8, halfway down. Plus <bdi class="ltr">$10</bdi> = column 16, halfway across.'}});
progWindow(document.getElementById('pw33'),{title:'Example 3 · two corners',hexcols:true,lines:['@ LDA #$BF','STA $041F','STA $05E0'],
  predict:{q:'Which two corners will be red?',opts:['top right and bottom left','both top corners','top left and bottom right'],a:0,
  why:'<bdi class="ltr">$041F</bdi> = the first row plus <bdi class="ltr">$1F</bdi> (31): the last column. <bdi class="ltr">$05E0</bdi> = the start of the last row, row 15.'}});
progWindow(document.getElementById('pw34'),{title:'Missing line · A with B under it',hexcols:true,lines:['@ LDA #$41','STA $0510','LDA #$42',null],
  gap:[{t:'STA $0530',ok:true,why:'Right! Down is +$20: <bdi class="ltr">$0510</bdi> + <bdi class="ltr">$20</bdi> = <bdi class="ltr">$0530</bdi>.'},
       {t:'STA $0520',ok:false,why:'<bdi class="ltr">$0520</bdi> is the start of row 9, at the left edge. You added <bdi class="ltr">$10</bdi>, not <bdi class="ltr">$20</bdi>.'},
       {t:'STA $0511',ok:false,why:'+1 is to the right, not down. The B will be next to the A.'}]});

codePuzzle(document.getElementById('pz31'),{tag:'Puzzle 2 · above the corner',hexcols:true,q:'Put Z (<bdi class="ltr">$5A</bdi>) in house <bdi class="ltr">$05FF</bdi>, and another Z in the square above it.',
  target:[[511,0x5a],[479,0x5a]],start:'@ LDA #$5A\n',best:3,
  hint1:'Up is <b>minus</b> <bdi class="ltr">$20</bdi>. You can turn the odometer backwards in your head.',hint2:'<bdi class="ltr">$05FF</bdi> minus <bdi class="ltr">$20</bdi>: the second digit from the right goes down from F to D. So <bdi class="ltr">$05DF</bdi>.',
  solution:'@ LDA #$5A\n STA $05FF\n STA $05DF\n',onWin:()=>win3('a')});
codePuzzle(document.getElementById('pz32'),{tag:'Puzzle 3 · diagonal',hexcols:true,q:'Draw a diagonal of 4 red blocks (<bdi class="ltr">$BF</bdi>), from the top left corner, going down and to the right.',
  target:[[0,0xbf],[33,0xbf],[66,0xbf],[99,0xbf]],start:'@ LDA #$BF\n STA $0400\n',best:5,
  hint1:'A diagonal step = one row down (+$20) plus one step to the right (+1).',hint2:'Each time +$21: <bdi class="ltr">$0400</bdi>, <bdi class="ltr">$0421</bdi>, <bdi class="ltr">$0442</bdi>, and…?',
  solution:'@ LDA #$BF\n STA $0400\n STA $0421\n STA $0442\n STA $0463\n',onWin:()=>win3('b')});
codePuzzle(document.getElementById('pz33'),{tag:'Puzzle 4 · yellow column',hexcols:true,q:'Draw a column of 4 yellow blocks (<bdi class="ltr">$9F</bdi>) in column <bdi class="ltr">$10</bdi>, from row 4 to row 7.',
  target:[[144,0x9f],[176,0x9f],[208,0x9f],[240,0x9f]],start:'',best:5,
  hint1:'Row 4 starts at <bdi class="ltr">$0480</bdi> (Figure 12). Column <bdi class="ltr">$10</bdi>: add <bdi class="ltr">$10</bdi>.',hint2:'The first is <bdi class="ltr">$0490</bdi>. Each one below it: +$20.',
  solution:'@ LDA #$9F\n STA $0490\n STA $04B0\n STA $04D0\n STA $04F0\n',onWin:()=>win3('c')});

/* ---------- chapter 4 ---------- */
const QV=[[8,0,0],[4,1,0],[2,0,1],[1,1,1]];
function bigCell(x,y,w,code,opt={}){
  const h=w*1.5, col=VDG.sg[(code>>4)&7], b=code&15; let s='';
  QV.forEach(([bit,qx,qy])=>{ const on=b&bit;
    s+=`<rect ${opt.click?'data-bit="'+bit+'" style="cursor:pointer"':''} x="${x+qx*w/2}" y="${y+qy*h/2}" width="${w/2}" height="${h/2}" fill="${on?col:VDG.black}" stroke="#555" stroke-width="${opt.grid===false?0:1}"/>`;
    if(opt.nums) s+=`<text x="${x+qx*w/2+w/4}" y="${y+qy*h/2+h/4+w*0.07}" text-anchor="middle" ${FM} font-size="${w*0.2}" font-weight="700" fill="${on?(col==='#ffffff'||col==='#ffff83'?'#222':'#fff'):'#888'}" pointer-events="none">${bit}</text>`;
  });
  return s;
}
function fig41(){
  let s=bigCell(30,20,130,0xbf,{nums:true});
  s+=mono(95,236,'8+4+2+1 = 15 = F',14,'currentColor','middle',700);
  [[0xbc,'8+4 = 12 = C','top half'],[0xb3,'2+1 = 3','bottom half'],[0xb9,'8+1 = 9','diagonal'],[0xb0,'0','all off']].forEach(([c,t,n],k)=>{
    const x=220+k*135; s+=bigCell(x,40,70,c,{nums:true}); s+=mono(x+35,166,t,12,'currentColor'); s+=heb(x+35,186,n,13,'currentColor',700); s+=mono(x+35,206,hex2(c),13,'#ff9b2f','middle',700); });
  return svg(760,246,s);
}
function fig42(){
  let s='';
  for(let c=0;c<8;c++){ const x=14+c*92; s+=`<rect x="${x}" y="14" width="80" height="54" rx="6" fill="${VDG.sg[c]}" stroke="#333"/>`;
    s+=mono(x+40,50,HEXD[8+c],26,(c===1||c===4)?'#222':'#fff','middle',700); s+=heb(x+40,90,SGNAME[c],14); s+=mono(x+40,110,'$'+HEXD[8+c]+'F',12,'currentColor'); }
  return svg(760,120,s);
}
function fig43(){
  let s='';
  s+=`<rect x="300" y="14" width="160" height="70" rx="10" fill="#1d211b"/>`+mono(380,62,'$BC',38,'#ffd59a','middle',700);
  s+=arrow(366,86,250,130)+arrow(410,86,520,130);
  s+=`<rect x="170" y="134" width="110" height="60" rx="6" fill="${VDG.sg[3]}"/>`+heb(225,170,'B = red',15,'#fff',700);
  s+=bigCell(530,128,50,0xbc,{nums:true}); s+=heb(640,160,'C = 8+4',15,'currentColor',700); s+=heb(640,180,'top half',13);
  s+=mono(380,232,'=',22,'currentColor'); s+=bigCell(356,244,48,0xbc,{grid:false});
  return svg(760,322,s);
}
put('fig41',fig41()); put('fig42',fig42()); put('fig43',fig43());

/* lamp toy */
(function(){
  const host=document.getElementById('lamp'); let col=3, b=12; const seen=new Set();
  host.innerHTML=`<div class="lamp-grid"><div class="lamp-cell"></div><div class="lamp-out"></div></div><div class="row sw" style="justify-content:center;margin-top:8px"></div>`;
  const cellH=host.querySelector('.lamp-cell'), out=host.querySelector('.lamp-out'), sw=host.querySelector('.sw');
  for(let c=0;c<8;c++){ const k=document.createElement('button'); k.className='swatch'; k.style.background=VDG.sg[c]; k.title=SGNAME[c]; k.innerHTML='<span>'+SGNAME[c]+'</span>'; k.onclick=()=>{ col=c; draw(); }; sw.appendChild(k); }
  const st={seen};
  const ms=[
    {t:'Turn on only the two top lamps, in red. What number did you get?',ok:()=>seen.has(0xbc)},
    {t:'Now only the bottom half: <bdi class="ltr">$B3</bdi>.',ok:()=>seen.has(0xb3)},
    {t:'Diagonal: top left and bottom right.',ok:()=>seen.has(0xb9)},
    {t:'Find 175 from Chapter 1 (a full blue block).',ok:()=>seen.has(0xaf)},
    {t:'Turn off all the lamps, and try different colours. Does it matter which colour you chose?',ok:()=>[...seen].filter(v=>(v&15)===0).length>=2}];
  const chk=missions(document.getElementById('m4'),ms,()=>st);
  function draw(){
    const code=0x80+col*16+b; seen.add(code);
    cellH.innerHTML=svg(140,210,bigCell(10,0,120,code,{nums:true,click:true}),170);
    cellH.querySelectorAll('[data-bit]').forEach(r=>r.onclick=()=>{ b^=+r.dataset.bit; draw(); });
    const on=QV.filter(([bit])=>b&bit).map(([bit])=>bit);
    const bits=[8,4,2,1].map(x=>b&x?'<span class="lmp on">●</span>':'<span class="lmp">○</span>').join('');
    out.innerHTML=`<div>Colour: <b>${SGNAME[col]}</b> → left digit <b class="ltr">${HEXD[8+col]}</b> <span class="soft">(8 + ${col})</span></div>
      <div>Lamps: <b class="ltr">${on.length?on.join(' + ')+' = '+b:'none = 0'}</b> → right digit <b class="ltr">${HEXD[b]}</b></div>
      <div class="bitsrow">The four lamps in a row: ${bits} <span class="ltr soft" style="white-space:nowrap">(8 4 2 1)</span></div>
      <div class="big"><span class="ltr">$${HEXD[8+col]}${HEXD[b]}</span> = <span>${code}</span></div>
      <div class="soft"><span class="ltr">${code} = 128 + ${col}×16 + ${b}</span></div>
      <div class="row" style="gap:6px;margin-top:4px"><span class="soft">On the screen:</span></div>`;
    const t=tile(code,5); t.style.width='40px'; t.style.height='60px'; t.style.borderRadius='3px'; out.lastElementChild.appendChild(t);
    sw.querySelectorAll('.swatch').forEach((k,i)=>k.classList.toggle('on',i===col)); chk();
  }
  draw();
})();

/* byte toy: 8 lamps */
(function(){
  const host=document.getElementById('byte'); let v=0; const seen=new Set();
  const W=[128,64,32,16,8,4,2,1];
  host.innerHTML=`<div class="byte-row"></div><div class="byte-out info"></div>`;
  const row=host.querySelector('.byte-row'), out=host.querySelector('.byte-out');
  W.forEach((w,k)=>{ const b=document.createElement('button'); b.className='blamp'+(k===3?' gapr':''); b.dataset.w=w; b.innerHTML='<span class="bulb"></span><span class="w">'+w+'</span>'; b.onclick=()=>{ v^=w; draw(); }; row.appendChild(b); });
  const ms=[{t:'Turn on all eight lamps. What do you get?',ok:()=>seen.has(255)},{t:'Build 65, the code of the letter A.',ok:()=>seen.has(65)},{t:'Build <bdi class="ltr">$BC</bdi> from the last section: the four on the left are B, the four on the right are C.',ok:()=>seen.has(0xbc)}];
  const chk=missions(document.getElementById('m4b'),ms,()=>({}));
  function draw(){ seen.add(v);
    row.querySelectorAll('.blamp').forEach(b=>b.classList.toggle('on',!!(v&+b.dataset.w)));
    const on=W.filter(w=>v&w);
    out.innerHTML=`<b>${on.length?on.join(' + '):'0'}</b> = <b>${v}</b> · in the computer’s way of writing: <b class="ltr">${hex2(v)}</b> <span class="soft">(left four = ${HEXD[v>>4]}, right four = ${HEXD[v&15]})</span>${v===255?' · all on: there is no bigger number!':''}${v===65?' · that’s A!':''}`;
    chk(); }
  draw();
})();

const win4=winner(4,3);
progWindow(document.getElementById('pw41'),{title:'Example 1 · three shapes in red',hexcols:true,lines:['@ LDA #$BF','STA $050E','LDA #$BC','STA $0510','LDA #$B3','STA $0512'],
  predict:{q:'What will appear, from left to right?',opts:['full, top half, bottom half','full, bottom half, top half','three full blocks'],a:0,why:'F = all the lamps. C = 8+4, the two top ones. 3 = 2+1, the two bottom ones. The digit B in all of them: red.'}});
progWindow(document.getElementById('pw42'),{title:'Example 2 · the eight colours',hexcols:true,lines:['@ LDA #$8F','STA $050C','LDA #$9F','STA $050D','LDA #$AF','STA $050E','LDA #$BF','STA $050F','LDA #$CF','STA $0510','LDA #$DF','STA $0511','LDA #$EF','STA $0512','LDA #$FF','STA $0513'],
  predict:{q:'Eight squares, but one of them won’t be seen. Which one?',opts:['the green one (<bdi class="ltr">$8F</bdi>)','the yellow one (<bdi class="ltr">$9F</bdi>)','the white one (<bdi class="ltr">$CF</bdi>)'],a:0,why:'Full green on a green background. It is there (hover over it), but the eye can’t tell it apart. That’s why there are only seven colours you can “see” on a green background.'}});
progWindow(document.getElementById('pw43'),{title:'Example 3 · a little house of six squares',hexcols:true,lines:['@ LDA #$B1','STA $04EF','LDA #$BF','STA $04F0','LDA #$B2','STA $04F1','LDA #$CF','STA $050F','STA $0511','LDA #$CC','STA $0510'],
  predict:{q:'In the middle square at the bottom we put <bdi class="ltr">$CC</bdi>. What will it be?',opts:['a door: white on top, black below','a wall: all white','a window: only a quarter white'],a:0,why:'C = white, and another C = 8+4: only the two top lamps. The bottom ones are off: a black opening, a door. And the roof? 1 = only bottom right, 2 = only bottom left. Together with F in the middle you get a sloping roof.'}});
progWindow(document.getElementById('pw44'),{title:'Missing line · left half blue',hexcols:true,lines:[null,'STA $050F'],gapq:'Which line is missing?',
  gap:[{t:'LDA #$AA',ok:true,why:'Right! A = blue. And A = 8+2: top left and bottom left.'},
       {t:'LDA #$A5',ok:false,why:'5 = 4+1: the two right lamps. That is the right half.'},
       {t:'LDA #$AC',ok:false,why:'C = 8+4: the two top ones. That is the top half.'}]});

codePuzzle(document.getElementById('pz41'),{tag:'Puzzle 1 · thin line',hexcols:true,q:'Draw a thin blue line along 8 squares in row 8, from column <bdi class="ltr">$0C</bdi> to <bdi class="ltr">$13</bdi>. The line is only the bottom half of each square.',
  target:[...Array(8)].map((_,k)=>[256+12+k,0xa3]),start:'',best:9,
  hint1:'Blue = A. Bottom half = 2+1.',hint2:'<bdi class="ltr">LDA #$A3</bdi> once, then STA 8 times, from <bdi class="ltr">$050C</bdi> to <bdi class="ltr">$0513</bdi>.',
  solution:'@ LDA #$A3\n STA $050C\n STA $050D\n STA $050E\n STA $050F\n STA $0510\n STA $0511\n STA $0512\n STA $0513\n',onWin:()=>win4('a')});
codePuzzle(document.getElementById('pz42'),{tag:'Puzzle 2 · smooth stairs',hexcols:true,q:'Draw a thin red diagonal line that passes through three squares. Hover over the picture to find the houses.',
  target:[[141,0xb9],[174,0xb9],[207,0xb9]],start:'',best:4,
  hint1:'In each square only two lamps are on: top left (8) and bottom right (1).',hint2:'<bdi class="ltr">$B9</bdi>, in houses <bdi class="ltr">$048D</bdi>, <bdi class="ltr">$04AE</bdi>, <bdi class="ltr">$04CF</bdi>. Each step +$21.',
  solution:'@ LDA #$B9\n STA $048D\n STA $04AE\n STA $04CF\n',onWin:()=>win4('b')});
codePuzzle(document.getElementById('pz43'),{tag:'Puzzle 3 · rainbow',hexcols:true,q:'Draw four bottom halves in row 10: red, orange, yellow, green, starting at column <bdi class="ltr">$0E</bdi>.',
  target:[[334,0xb3],[335,0xf3],[336,0x93],[337,0x83]],start:'',best:8,
  hint1:'Bottom half = 3 in all of them. The left digit changes: red B, orange F, yellow 9, green 8. The green one shows here, because the top half is black.',hint2:'Row 10 starts at <bdi class="ltr">$0540</bdi>. Column <bdi class="ltr">$0E</bdi>: <bdi class="ltr">$054E</bdi>.',
  solution:'@ LDA #$B3\n STA $054E\n LDA #$F3\n STA $054F\n LDA #$93\n STA $0550\n LDA #$83\n STA $0551\n',onWin:()=>win4('c')});

/* ---------- chapter 5 ---------- */
function fig51(){
  let s='';
  s+=`<rect x="8" y="8" width="360" height="226" rx="14" fill="none" stroke="currentColor" stroke-opacity=".25"/>`;
  s+=`<rect x="24" y="30" width="150" height="34" rx="6" fill="#1d211b"/>`+mono(99,52,'LDA #$41',15,'#e8f5df');
  s+=heb(188,96,'With a hash sign: here is the number',14,'currentColor',700);
  s+=note(40,112,'$41','in hand'); s+=arrow(116,142,214,142); s+=drawerMini(222,116,'$41');
  s+=heb(188,220,'The number itself goes into the drawer',13);
  s+=`<rect x="384" y="8" width="368" height="226" rx="14" fill="none" stroke="currentColor" stroke-opacity=".25"/>`;
  s+=`<rect x="400" y="30" width="150" height="34" rx="6" fill="#1d211b"/>`+mono(475,52,'LDA $0400',15,'#e8f5df');
  s+=heb(660,52,'Without a hash sign: go to the house',14,'currentColor',700);
  s+=house(404,76,1024,'$9F'); s+=camera(530,130); s+=arrow(490,150,618,150); s+=drawerMini(626,124,'$9F');
  s+=heb(568,224,'What is in the house now goes into the drawer',13);
  return svg(760,242,s);
}
function fig52(){
  let s='';
  s+=`<rect x="8" y="8" width="360" height="200" rx="14" fill="none" stroke="currentColor" stroke-opacity=".25"/>`+mono(188,28,'LDA $0400',14,'#ff9b2f','middle',700);
  s+=house(20,40,1024,65); s+=camera(150,92); s+=arrow(106,112,236,112); s+=drawerMini(242,86,'65','In the drawer: 65');
  s+=heb(62,192,'In the house: still 65',12);
  s+=`<rect x="380" y="8" width="372" height="200" rx="14" fill="none" stroke="currentColor" stroke-opacity=".25"/>`+mono(566,28,'STA $0401',14,'#ff9b2f','middle',700);
  s+=drawerMini(392,86,'65','In the drawer: still 65'); s+=arrow(504,112,560,112);
  s+=house(566,40,1025,12,{fade:.25}); s+=sponge(588,98); s+=arrow(652,112,668,112,'#ff9b2f',2);
  s+=`<g transform="translate(672,40) scale(.88)">${house(0,0,1025,65)}</g>`;
  s+=heb(566,196,'Reading takes a photo. Writing rubs out and writes.',13,'currentColor',700);
  return svg(760,216,s);
}
put('fig51',fig51()); put('fig52',fig52());

const win5=winner(5,3);
progWindow(document.getElementById('pw51'),{title:'Example 1 · copying a letter',hexcols:true,lines:['@ LDA #$48','STA $0400','LDA #$49','LDA $0400','STA $050F'],
  predict:{q:'What will appear in the middle of the screen (<bdi class="ltr">$050F</bdi>)?',opts:['H','I','both H and I'],a:0,why:'In line 3 an I went into the drawer. But line 4, without a hash sign, went to house <bdi class="ltr">$0400</bdi>, copied the H that was there, and replaced the I.'}});
progWindow(document.getElementById('pw52'),{title:'Example 2 · rubbing out by copying',hexcols:true,lines:['@ LDA #$41','STA $050F','LDA $0400','STA $050F'],
  predict:{q:'We wrote nothing in house <bdi class="ltr">$0400</bdi>. What will be in <bdi class="ltr">$050F</bdi> at the end?',opts:['A','an empty square','an inverse @'],a:1,why:'An empty square holds <bdi class="ltr">$60</bdi> (96), a “space”. LDA copied it, and STA wrote it over the A. That’s how you copy “nothing”.'}});
progWindow(document.getElementById('pw53'),{title:'Example 3 · mirror',hexcols:true,lines:['@ LDA #$41','STA $050E','LDA #$42','STA $050F','LDA $050F','STA $0511','LDA $050E','STA $0512'],
  predict:{q:'What will be written in the middle of the screen at the end?',opts:['AB BA','AB AB','AB'],a:0,why:'Lines 5–6 copy the B (<bdi class="ltr">$050F</bdi>) first, and lines 7–8 the A. The order you copy in decides the order on the screen.'}});
progWindow(document.getElementById('pw54'),{title:'Missing line · copying the corner',hexcols:true,lines:['@ LDA #$BF','STA $0400','LDA #$41','STA $0510',null,'STA $05FF'],
  gap:[{t:'LDA $0400',ok:true,why:'Right! No hash sign: copy the corner. The drawer had A in it, and now it holds <bdi class="ltr">$BF</bdi> again.'},
       {t:'LDA #$0400',ok:false,why:'With a hash sign, $0400 is a number, not a house. And it is too big for the drawer as well. Run it and see what the processor says.'},
       {t:'STA $0400',ok:false,why:'This writes what is in the drawer (A) over the corner, instead of copying it. At the end there will be an A in both corners.'}]});
(function(){ const s=new Screen(document.getElementById('broken5'),{labels:true,hexcols:true}); s.mem[0]=0x00; s.draw(); })();

const NOHASH=prog=>prog.some(p=>p.mode==='imm')?'Your lines have a <bdi class="ltr">#</bdi>. In this puzzle you may only copy: LDA without a hash sign, and STA.':null;
codePuzzle(document.getElementById('pz51'),{tag:'Puzzle 1 · four corners in a mystery colour',hexcols:true,read:true,rule:NOHASH,
  q:'The locked lines colour the top left corner, then put A in the drawer. Colour the other three corners the same colour, without a hash sign.',
  pre:['@ LDA #$E5','STA $0400','LDA #$41'],target:[[0,0xe5],[31,0xe5],[480,0xe5],[511,0xe5]],start:'',best:4,
  hint1:'First you need to get the colour back into the drawer. Where can you copy it from?',hint2:'<bdi class="ltr">LDA $0400</bdi>, then three STAs: <bdi class="ltr">$041F</bdi>, <bdi class="ltr">$05E0</bdi>, <bdi class="ltr">$05FF</bdi>.',
  solution:' LDA $0400\n STA $041F\n STA $05E0\n STA $05FF\n',onWin:()=>win5('a')});
codePuzzle(document.getElementById('pz52'),{tag:'Puzzle 2 · mirror of three letters',hexcols:true,read:true,rule:NOHASH,
  q:'The locked lines write ABC. Write CBA next to them, like in the picture, without a hash sign.',
  pre:['@ LDA #$41','STA $0508','LDA #$42','STA $0509','LDA #$43','STA $050A'],target:[[264,0x41],[265,0x42],[266,0x43],[277,0x43],[278,0x42],[279,0x41]],start:'',best:6,
  hint1:'Hover over the picture to see where the CBA goes: <bdi class="ltr">$0515</bdi> to <bdi class="ltr">$0517</bdi>.',hint2:'The C (<bdi class="ltr">$050A</bdi>) goes to <bdi class="ltr">$0515</bdi>, the B to <bdi class="ltr">$0516</bdi>, the A to <bdi class="ltr">$0517</bdi>.',
  solution:' LDA $050A\n STA $0515\n LDA $0509\n STA $0516\n LDA $0508\n STA $0517\n',onWin:()=>win5('b')});
codePuzzle(document.getElementById('pz53'),{tag:'Puzzle 3 · swap (hard)',hexcols:true,read:true,rule:NOHASH,
  q:'The locked lines write BA. Turn them into AB, without a hash sign. And at the end the screen must be clear of everything else.',
  pre:['@ LDA #$42','STA $050F','LDA #$41','STA $0510'],target:[[271,0x41],[272,0x42]],start:'',best:8,
  hint1:'If you copy the A straight over the B, the B is gone for good. First keep a copy of it to one side, in any empty house on the screen.',hint2:'At the end, a copy is left in the house you used. Rub it out like in example 2: copy an empty square over it.',
  solution:' LDA $050F\n STA $0400\n LDA $0510\n STA $050F\n LDA $0400\n STA $0510\n LDA $0401\n STA $0400\n',onWin:()=>win5('c')});

/* =================== chapters 9–11: loops, keys, motion — a small 6809 with time and keys ===================
   Written against the course helpers (Screen, svg, heb, mono, arrow, L, hex2, hex4, CHARS, describe, fly, sleep, put,
   makeQuiz, QUIZ, missions, markDone, winner, cellInfo, FT, FM, VDG). Self-contained: does not need cpu.js
   (names end in 9 so nothing clashes with chapters 6–8).
   Effects follow the 6809 programming manual:
   LDA/LDB/STA/STB: N,Z from the byte, V=0.    ADDA/SUBA/CMPA/CMPB: N,Z,V,C (C = carry / borrow).
   INCA/DECA/INCB/DECB/INC/DEC: N,Z,V (C unchanged).   CLRA/CLRB: N0 Z1 V0 C0.
   LDX/LDY: N,Z (16 bit), V=0.   CMPX/CMPY: N,Z,V,C (16 bit).   LEAX/LEAY: only Z.   Branches change nothing.
   B,X / B,Y: B counts as a signed number (-128..127), like on the real 6809.
   Time: every instruction adds its real 6809 clock cycles; the Dragon's clock is 894,886 per second.
   Keys: LDX $A000 puts $8006 in X (seen on our machine). JSR ,X with X=$8006 = the keyboard check:
   A = the code of a key that was pressed since the last check (then forgotten), or 0 with Z lit.
   Memory: only the screen ($0400–$05FF) is simulated; anything else stops with an explanation. */
const CLK9=894886, KEYVEC9=0x8006, POLL_CYC9=180;   // POLL_CYC9: an estimate of one keyboard check in our ROM
const OPS9={LDA:'imm ext idx',LDB:'imm ext idx',STA:'ext idx',STB:'ext idx',ADDA:'imm ext idx',SUBA:'imm ext idx',CMPA:'imm ext idx',CMPB:'imm ext idx',
  INCA:'inh',DECA:'inh',CLRA:'inh',INCB:'inh',DECB:'inh',CLRB:'inh',INC:'ext idx',DEC:'ext idx',
  LDX:'imm ext',LDY:'imm',CMPX:'imm',CMPY:'imm',LEAX:'idx',LEAY:'idx',
  BEQ:'rel',BNE:'rel',BLO:'rel',BHS:'rel',BRA:'rel',JSR:'idx',RTS:'inh'};
const WIDE9={LDX:1,LDY:1,CMPX:1,CMPY:1};
const TAIL9=['KEY LDX $A000',' JSR ,X',' BEQ KEY',' RTS'];
const KEYS9={'←':0x08,'→':0x09,'↑':0x5E,'↓':0x0A,'SPACE':0x20,'ENTER':0x0D};
const keyCode9=k=> KEYS9[k]!=null?KEYS9[k]:k.charCodeAt(0);
const keyName9=c=>{ for(const k in KEYS9) if(KEYS9[k]===c) return k; return c>=0x41&&c<=0x5A?String.fromCharCode(c):hex2(c); };
function num9(t){
  t=t.trim(); let neg=false; if(t[0]==='-'){ neg=true; t=t.slice(1); }
  let v=null;
  if(/^\$[0-9A-F]+$/i.test(t)) v=parseInt(t.slice(1),16);
  else if(/^\d+$/.test(t)) v=parseInt(t,10);
  else if(/^'.$/.test(t)&&!neg){ const ch=t[1].toUpperCase(); const k=CHARS.indexOf(ch); v=k<0?null:(ch>='@'&&ch<='Z'?0x40+k:k); }
  return v==null?null:(neg?-v:v);
}
/* idx extra cycles (6809): ,R 0 · ,R+ 2 · 5/8-bit offset 1 · 16-bit offset 4 · B,R 1 */
function idxCyc9(P){ if(P.acc) return 1; if(P.post) return 2; if(P.off===0&&!P.offText) return 0; return (P.off>=-128&&P.off<=127)?1:4; }
function cyc9(P){
  const op=P.op, m=P.mode;
  if(m==='rel') return 3;
  if(op==='RTS') return 5;
  if(op==='JSR') return 7;
  if(m==='inh') return 2;
  if(op==='LEAX'||op==='LEAY') return 4+idxCyc9(P);
  if(op==='INC'||op==='DEC') return m==='ext'?7:6+idxCyc9(P);
  if(op==='LDX') return m==='imm'?3:6;
  if(op==='LDY') return 4;
  if(op==='CMPX') return 4;
  if(op==='CMPY') return 5;
  if(m==='imm') return 2; if(m==='ext') return 5; return 4+idxCyc9(P);
}
/* opt: {tail:'hide'|'real'|'none', base:n (locked lines before the user's), ops:[allowed]} */
function asm9(src,opt={}){
  const prog=[], errs=[], labels={}, refs=[], tailMode=opt.tail||'hide';
  let lines=src.replace(/\r/g,'').split('\n');
  // a typed fixed ending at the end is the same as the automatic one
  const norm=lines.map(l=>l.replace(/\s+/g,' ').trim().toUpperCase());
  for(let k=norm.length-1;k>=0&&!norm[k];k--) norm.pop();
  const tl=TAIL9.map(l=>l.replace(/\s+/g,' ').trim());
  if(tailMode!=='none'&&norm.length>=4&&tl.every((t,i)=>norm[norm.length-4+i]===t)) lines=lines.slice(0,norm.length-4);
  const user=lines.length;
  if(tailMode==='real') lines=lines.concat(TAIL9);
  lines.forEach((raw,n)=>{
    const N='Line '+(n+1-(opt.base||0))+': ';
    const line=raw.replace(/\t/g,' ').replace(/\s+$/,'');
    if(!line.trim()||/^\s*\*/.test(line)) return;
    let label=null, rest=line;
    if(line[0]!==' '){
      const m=line.match(/^(\S+)\s*(.*)$/); label=m[1].toUpperCase(); rest=m[2];
      if(OPS9[label]&&!/^[A-Za-z]{3,4}\b/.test(rest)){ errs.push(N+'The line starts without a space, so DREAM will think '+L(label)+' is a <b>place name</b>, not a command. Add a space at the start of the line.'); return; }
      if(!/^(@|[A-Z][A-Z0-9]{0,5})$/.test(label)){ errs.push(N+'The name '+L(label)+' doesn’t fit. A place name is a letter, then letters or digits, up to 6 characters, right at the start of the line.'); return; }
      if(label==='KEY'&&n<user&&tailMode!=='none'){ errs.push(N+'The name KEY is already taken: it is the name of the fixed ending.'); return; }
      if(labels[label]!=null){ errs.push(N+'The name '+L(label)+' appears twice. Each place needs its own name.'); return; }
      labels[label]=prog.length;
      if(!rest.trim()){ errs.push(N+'After the name '+L(label)+', the command is missing on the same line.'); return; }
    }
    const m=rest.trim().match(/^([A-Za-z]+)\s*(.*)$/);
    if(!m){ errs.push(N+'I don’t understand this line.'); return; }
    const op=m[1].toUpperCase(), arg=m[2].trim().toUpperCase(), modes=OPS9[op];
    if(!modes||(opt.ops&&n<user&&!opt.ops.includes(op))){ errs.push(N+(modes?'This puzzle doesn’t use '+L(op)+'.':'We haven’t learnt '+L(op)+' yet (or is it a typo?).')); return; }
    const P={op,label,line:n,tail:n>=user,text:raw,argText:arg};
    if(modes==='inh'){ if(arg){ errs.push(N+L(op)+' doesn’t need anything after it.'); return; } P.mode='inh'; }
    else if(!arg){ errs.push(N+'After '+L(op)+', a '+(modes==='rel'?'place name is missing.':'number is missing.')); return; }
    else if(modes==='rel'){
      if(!/^(@|[A-Z][A-Z0-9]{0,5})$/.test(arg)){ errs.push(N+'After '+L(op)+' you write the name of a place in the program, for example '+L('LOOP')+'.'); return; }
      P.mode='rel'; P.target=arg; refs.push([P,N]);
    }
    else if(arg[0]==='#'){
      if(!modes.includes('imm')){ errs.push(N+(op[0]==='S'?L(op)+' takes no '+L('#')+'. It always writes to a house.':L(op)+' doesn’t work with '+L('#')+'.')); return; }
      const v=num9(arg.slice(1)); if(v==null){ errs.push(N+'I don’t understand the number '+L(arg.slice(1))+'.'); return; }
      if(WIDE9[op]){ if(v<0||v>65535){ errs.push(N+'The number is too big even for a wide drawer.'); return; } P.v=v; }
      else { if(v>255){ errs.push(N+'The number '+L(arg.slice(1))+' ('+v+') is too big for drawer '+(op.slice(-1)==='B'?'B':'A')+': only 0 to 255 fits.'); return; } if(v<-128){ errs.push(N+'The number is too small.'); return; } P.v=v&255; }
      P.mode='imm';
    }
    else if(arg.includes(',')){
      const mx=arg.match(/^(.*),\s*([XY])(\+?)$/);
      if(!mx){ errs.push(N+'After the comma comes the name of a finger: '+L(',X')+', '+L(',Y+')+' or for example '+L('32,X')+'.'); return; }
      if(!modes.includes('idx')){ errs.push(N+L(op)+' doesn’t work with a finger.'); return; }
      P.reg=mx[2]; P.post=!!mx[3]; P.off=0; P.offText=mx[1].trim();
      if(op==='JSR'&&!(P.reg==='X'&&!P.offText&&!P.post)){ errs.push(N+'On this page '+L('JSR')+' only works as '+L('JSR ,X')+', to call the keyboard checker.'); return; }
      if(P.offText==='B') P.acc=true;
      else if(P.offText){ const o=num9(P.offText); if(o==null){ errs.push(N+'I don’t understand the '+L(P.offText)+' before the comma.'); return; } if(o<-32768||o>32767){ errs.push(N+'The move is too big.'); return; } P.off=o; }
      if(P.post&&(P.offText||op==='LEAX'||op==='LEAY')){ errs.push(N+'With '+L('+')+' after the finger, you write nothing before the comma. Either '+L(',X+')+', or for example '+L('1,X')+'.'); return; }
      if((op==='LEAX'&&P.reg!=='X')||(op==='LEAY'&&P.reg!=='Y')){ errs.push(N+L(op)+' moves the finger '+op.slice(-1)+'. You write, for example, '+L(op+' 1,'+op.slice(-1))+'.'); return; }
      P.mode='idx';
    }
    else {
      if(!modes.includes('ext')){ errs.push(N+(WIDE9[op]?'Here you write '+L(op)+' with '+L('#')+': '+L(op+' #'+arg)+'.':(op.startsWith('LEA')?'With '+L(op)+' you write how far to move, then the name of the finger, for example '+L(op+' 32,'+op.slice(-1))+'.':L(op)+' needs something else here.'))); return; }
      const a=num9(arg); if(a==null||a<0){ errs.push(N+'I don’t understand the house number '+L(arg)+'.'); return; }
      if(op==='LDX'){ if(a!==0xA000){ errs.push(N+'On this page '+L('LDX')+' without the hash sign only works with '+L('$A000')+' (the address of the keyboard checker).'); return; } }
      else if(a<0x400||a>0x5ff){ errs.push(N+'House '+L(arg)+' ('+a+') is not on the screen. On this page we only work with the screen squares ('+L('$0400')+' to '+L('$05FF')+').'); return; }
      P.mode='ext'; P.a=a;
    }
    P.cyc=cyc9(P); prog.push(P);
  });
  if(tailMode==='hide') labels.KEY=prog.length;
  refs.forEach(([P,N])=>{ if(labels[P.target]==null) errs.push(N+'The program has no place called '+L(P.target)+'. (A place name is written right at the start of the line.)'); });
  return {prog,errs,labels};
}
function cpuNew9(){ return {A:null,B:null,X:null,Y:null,N:null,Z:null,V:null,C:null,mem:new Uint8Array(512).fill(0x60),pc:0,steps:0,cyc:0,laps:0,done:false,key:null}; }
class CpuStop9 extends Error{}
/* one instruction. io.poll() -> key code or 0 (only when JSR ,X runs). returns an event for the narration */
function cpuStep9(st,prog,labels,io){
  const p=prog[st.pc], ev={p,old:{A:st.A,B:st.B,X:st.X,Y:st.Y,N:st.N,Z:st.Z,V:st.V,C:st.C}};
  const stop=m=>{ throw new CpuStop9(m); };
  const need=r=>{ if(st[r]==null) stop(r==='A'||r==='B'?'Drawer '+r+' holds a number we don’t know (we haven’t put anything in it yet). On the Dragon you would get something random here.':'The finger '+r+' doesn’t point anywhere yet. First '+L('LD'+r+' #…')+'.'); };
  const s8=v=>v>127?v-256:v;
  const ea=()=>{ if(p.mode==='ext') return p.a; need(p.reg); let o=p.off; if(p.acc){ need('B'); o=s8(st.B); } return (st[p.reg]+(p.post?0:o))&0xFFFF; };
  const chk=(a,w)=>{ if(a<0x400||a>0x5ff) stop((w?'Writing to':'Reading from')+' house '+L(hex4(a))+' ('+a+'): it is not on the screen. '+(w?'On the Dragon this would write somewhere else in memory, and might break something.':'On this page you only see the screen.')); };
  const rd=a=>{ chk(a,false); return st.mem[a-0x400]; };
  const nz=(r,w)=>{ st.N=!!(r&(w?0x8000:0x80)); st.Z=(r===0); };
  const post=()=>{ if(p.post) st[p.reg]=(st[p.reg]+1)&0xFFFF; };
  const opnd=()=>{ if(p.mode==='imm') return p.v; const a=ea(); ev.ea=a; const v=rd(a); post(); return v; };
  let next=st.pc+1;
  switch(p.op){
    case 'LDA': case 'LDB': { const r=p.op[2]; const v=opnd(); st[r]=v; nz(v); st.V=false; ev.v=v; break; }
    case 'STA': case 'STB': { const r=p.op[2]; need(r); const a=ea(); chk(a,true); ev.ea=a; ev.prev=st.mem[a-0x400]; st.mem[a-0x400]=st[r]; post(); nz(st[r]); st.V=false; break; }
    case 'ADDA': { need('A'); const m=opnd(), r=st.A+m; st.V=!!((st.A^r)&(m^r)&0x80); st.C=r>255; ev.m=m; ev.raw=r; st.A=r&255; nz(st.A); break; }
    case 'SUBA': case 'CMPA': case 'CMPB': { const R=p.op==='CMPB'?'B':'A'; need(R); const x=st[R], m=opnd(), r=(x-m)&255; st.C=x<m; st.V=!!((x^m)&(x^r)&0x80); ev.m=m; ev.r=r; nz(r); if(p.op==='SUBA') st.A=r; break; }
    case 'INCA': case 'INCB': case 'DECA': case 'DECB': { const R=p.op[3], up=p.op[0]==='I'; need(R); const o=st[R]; st.V=up?o===0x7F:o===0x80; st[R]=(o+(up?1:255))&255; nz(st[R]); break; }
    case 'CLRA': case 'CLRB': { st[p.op[3]]=0; st.N=false; st.Z=true; st.V=false; st.C=false; break; }
    case 'INC': case 'DEC': { const a=ea(); chk(a,true); ev.ea=a; const o=st.mem[a-0x400]; ev.prev=o; const r=(o+(p.op==='INC'?1:255))&255; st.V=(p.op==='INC'?o===0x7F:o===0x80); st.mem[a-0x400]=r; post(); nz(r); break; }
    case 'LDX': case 'LDY': { const R=p.op[2]; const v=p.mode==='ext'?KEYVEC9:p.v; st[R]=v; nz(v,1); st.V=false; break; }
    case 'CMPX': case 'CMPY': { const R=p.op[3]; need(R); const m=p.v, r=(st[R]-m)&0xFFFF; st.C=st[R]<m; st.V=!!((st[R]^m)&(st[R]^r)&0x8000); nz(r,1); ev.m=m; break; }
    case 'LEAX': case 'LEAY': { const R=p.op[3]; need(R); let o=p.off; if(p.acc){ need('B'); o=s8(st.B); } ev.off=o; st[R]=(st[R]+o)&0xFFFF; st.Z=(st[R]===0); break; }
    case 'JSR': { need('X'); if(st.X!==KEYVEC9) stop('The finger X points at '+L(hex4(st.X))+', not at the keyboard checker. '+L('JSR ,X')+' would jump there, and the computer would probably freeze. First '+L('LDX $A000')+'.');
      const k=io&&io.poll?io.poll():0; st.A=k&255; st.Z=(st.A===0); st.N=!!(st.A&0x80); st.V=false; ev.key=st.A; st.cyc+=POLL_CYC9+5; break; }
    case 'RTS': { st.done=true; next=st.pc; break; }
    default: { // branches
      const f={BEQ:'Z',BNE:'Z',BLO:'C',BHS:'C'}[p.op];
      if(f&&st[f]==null) stop('Lamp '+f+' hasn’t come on or gone off since the program started, so we can’t know which way to turn.');
      const take= p.op==='BRA'||(p.op==='BEQ'&&st.Z)||(p.op==='BNE'&&!st.Z)||(p.op==='BLO'&&st.C)||(p.op==='BHS'&&!st.C);
      ev.take=take; if(take){ next=labels[p.target]; if(next<=st.pc){ st.laps++; ev.back=true; } }
    }
  }
  st.cyc+=p.cyc; st.steps++; st.pc=next; return ev;
}
/* headless run with a list of keys. Keys are handed out one per two checks (a check without a key in between),
   like a person pressing keys while the program asks again and again. Stops when the program waits for a key
   and none are left, at RTS, or at the hidden fixed ending. */
function cpuRun9(prog,labels,o={}){
  const st=cpuNew9(); const keys=(o.keys||[]).map(keyCode9); let polls=0, waiting=false;
  const io={poll:()=>{ polls++; if(polls%2===0&&keys.length) return keys.shift(); if(!keys.length&&polls>2){ waiting=true; } return 0; }};
  const limit=o.limit||6000000;
  try{
    while(st.pc<prog.length&&!st.done){
      if(st.steps>=limit) return {st,err:'The program ran '+limit.toLocaleString()+' steps and didn’t finish. Maybe a loop without end?'};
      cpuStep9(st,prog,labels,io);
      if(waiting) return {st,err:null,waiting:true,keysLeft:keys.length};
    }
    return {st,err:null,keysLeft:keys.length};
  }catch(e){ if(e instanceof CpuStop9) return {st,err:e.message}; throw e; }
}
const secs9=c=>{ const s=c/CLK9; return s<0.001?'less than a thousandth of a second':s<0.1?(s*1000).toFixed(s<0.01?1:0)+' thousandths of a second':s.toFixed(s<10?2:1)+' seconds'; };

/* ---------------- CPU picture: A, B, X, Y and lamps ---------------- */
function hand9(x,y,s,col){ return `<g transform="translate(${x},${y}) scale(${s})"><rect x="-5" y="-30" width="10" height="27" rx="5" fill="#f6c99a" stroke="#7a4a1c" stroke-width="1.6"/><rect x="-13" y="-52" width="28" height="26" rx="8" fill="#f6c99a" stroke="#7a4a1c" stroke-width="1.6"/><path d="M-7 -44 v10 M1 -46 v10 M9 -44 v9" stroke="#c98a5a" stroke-width="1.4" stroke-linecap="round"/><rect x="-11" y="-62" width="24" height="12" rx="3" fill="${col}"/></g>`; }
const LAMP9={N:'lamp 128',Z:'zero / equal',C:'carry wheel'};
const FINGER9={X:'#2f6fd0',Y:'#c0392b'};
function cpuBox9(show){
  const wide=(show.x||show.y), lamps=show.lamps||[];
  const H=40+74+(wide?84:0)+(lamps.length?72:0)+8;
  let s=`<rect x="6" y="6" width="308" height="${H-12}" rx="16" fill="#3b4048" stroke="#22252a" stroke-width="3"/>
  <rect x="20" y="16" width="280" height="24" rx="6" fill="#2a2e34"/><text x="160" y="33" text-anchor="middle" ${FT} font-size="13.5" fill="#cfd6df" direction="ltr">The 6809 processor</text>`;
  const small=(x,r,col)=>`<g class="drawer${r}"><rect x="${x}" y="50" width="136" height="66" rx="8" fill="#c99a5b" stroke="#7a5428" stroke-width="3"/><rect x="${x+45}" y="108" width="46" height="6" rx="3" fill="#7a5428"/>
   <circle cx="${x+18}" cy="68" r="12" fill="${col}"/><text x="${x+18}" y="74" text-anchor="middle" ${FM} font-size="15" font-weight="700" fill="#222">${r}</text>
   <rect class="${r.toLowerCase()}val-bg" x="${x+34}" y="57" width="94" height="44" rx="5" fill="#2f3a2c"/>
   <text class="${r.toLowerCase()}val" x="${x+81}" y="84" text-anchor="middle" ${FM} font-size="20" fill="#f1f1e6">?</text>
   <text class="${r.toLowerCase()}dec" x="${x+81}" y="97" text-anchor="middle" ${FM} font-size="9.5" fill="#b9c8b0"></text></g>`;
  s+=small(18,'A','#ffd23f');
  s+= show.b? small(166,'B','#7fe0a0') : `<path d="M166 50 Q200 44 236 52 Q272 46 302 54 L302 116 Q268 110 232 118 Q196 112 166 118 Z" fill="#8c7aa8" stroke="#5e4f78" stroke-width="2"/>`+heb(234,90,'Drawers under the cloth',11.5,'#fff');
  let y=124;
  if(wide){
    const big=(x,r)=>`<g class="drawer${r}"><rect x="${x}" y="${y}" width="136" height="72" rx="8" fill="#b7895a" stroke="#6e4a22" stroke-width="3"/>
     <circle cx="${x+18}" cy="${y+18}" r="12" fill="${FINGER9[r]}"/><text x="${x+18}" y="${y+24}" text-anchor="middle" ${FM} font-size="15" font-weight="700" fill="#fff">${r}</text>
     <rect class="${r.toLowerCase()}val-bg" x="${x+36}" y="${y+7}" width="92" height="44" rx="5" fill="#2f3a2c"/>
     <text class="${r.toLowerCase()}val" x="${x+82}" y="${y+34}" text-anchor="middle" ${FM} font-size="19" fill="#f1f1e6">?</text>
     <text class="${r.toLowerCase()}dec" x="${x+82}" y="${y+47}" text-anchor="middle" ${FM} font-size="9.5" fill="#b9c8b0"></text>
     ${hand9(x+18,y+66,0.36,FINGER9[r])}<text class="${r.toLowerCase()}what" x="${x+82}" y="${y+65}" text-anchor="middle" ${FT} font-size="10" fill="#f6e7c8" direction="ltr"></text></g>`;
    if(show.x) s+=big(18,'X'); if(show.y) s+=big(166,'Y');
    y+=84;
  }
  if(lamps.length){
    s+=`<rect x="20" y="${y}" width="280" height="62" rx="10" fill="#23262b"/>`;
    const gap=280/lamps.length;
    lamps.forEach((f,k)=>{ const cx=20+gap*k+gap/2;
      s+=`<g class="lamp lamp${f}"><circle class="bulb" cx="${cx}" cy="${y+22}" r="12" fill="#4a4f57" stroke="#15171a" stroke-width="2"/>
      <text class="lq" x="${cx}" y="${y+27}" text-anchor="middle" ${FM} font-size="12" font-weight="700" fill="#cfd6df">?</text>
      <text x="${cx-19}" y="${y+27}" text-anchor="end" ${FM} font-size="14" font-weight="700" fill="#ffd23f">${f}</text>
      <text x="${cx}" y="${y+52}" text-anchor="middle" ${FT} font-size="10.5" fill="#aab3bd" direction="ltr">${LAMP9[f]}</text></g>`; });
  }
  return {s,H};
}
function paintCpu9(root,st,show){
  const q=s=>root.querySelector(s);
  const small=(r)=>{ const v=st[r]; q('.'+r.toLowerCase()+'val').textContent=v==null?'?':hex2(v); q('.'+r.toLowerCase()+'dec').textContent=v==null?'':v+(r==='B'&&v>127?' / '+(v-256):'')+(r==='A'&&v>=0x40&&v<0x5b?'  '+CHARS[v&63]:''); };
  small('A'); if(show.b) small('B');
  ['X','Y'].forEach(r=>{ if(!show[r.toLowerCase()]) return; const v=st[r]; q('.'+r.toLowerCase()+'val').textContent=v==null?'?':hex4(v); q('.'+r.toLowerCase()+'dec').textContent=v==null?'':String(v);
    q('.'+r.toLowerCase()+'what').textContent=v==null?'':(v===KEYVEC9?'keyboard checker':(v>=0x400&&v<=0x5ff?'row '+((v-0x400)>>5)+', column '+((v-0x400)&31):'')); });
  (show.lamps||[]).forEach(f=>{ const g=q('.lamp'+f); if(!g) return; const v=st[f]; const b=g.querySelector('.bulb');
    b.setAttribute('fill',v==null?'#4a4f57':(v?'#ffb020':'#1b1d21')); b.style.filter=v?'drop-shadow(0 0 6px #ffb020)':''; g.querySelector('.lq').textContent=v==null?'?':''; });
}
function blink9(el){ if(!el) return; el.style.transition='filter .15s'; el.style.filter='brightness(1.35)'; setTimeout(()=>el.style.filter='',300); }

/* a screen that shows where the fingers X and Y point */
class Screen9 extends Screen{
  draw(){ super.draw(); if(!this.ctx||!this.fingers) return; const c=this.ctx;
    for(const f of this.fingers){ if(f.i<0||f.i>511) continue; const {x,y}=this.xy(f.i), w=this.cw, h=this.chh;
      c.strokeStyle=f.col; c.lineWidth=2.5; c.setLineDash([]); c.strokeRect(x-1.5,y-1.5,w+3,h+3);
      c.save(); c.translate(x+w/2,y-1); const s=Math.max(w,10)/10*0.5; c.scale(s,s); c.fillStyle='#f6c99a'; c.strokeStyle='#7a4a1c'; c.lineWidth=2;
      const rr=(X,Y,W,H,R)=>{ c.beginPath(); c.moveTo(X+R,Y); c.arcTo(X+W,Y,X+W,Y+H,R); c.arcTo(X+W,Y+H,X,Y+H,R); c.arcTo(X,Y+H,X,Y,R); c.arcTo(X,Y,X+W,Y,R); c.closePath(); c.fill(); c.stroke(); };
      rr(-5,-30,10,28,5); rr(-13,-52,28,26,8); c.fillStyle=f.col; c.fillRect(-11,-62,24,11); c.restore(); }
  }
}

/* ---------------- the race track (the loop picture), also used live in a window ---------------- */
function track9(stations,o={}){
  const W=o.w||640, cx=W/2-20, cy=118, rx=W/2-150, ry=78, n=stations.length;
  let s=`<ellipse cx="${cx}" cy="${cy}" rx="${rx+22}" ry="${ry+22}" fill="#4b5a3a"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#2b2f2b" stroke-width="34"/>
   <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#f5f1e6" stroke-width="2" stroke-dasharray="10 9"/><ellipse cx="${cx}" cy="${cy}" rx="${rx-36}" ry="${ry-36}" fill="#6c8a4a"/>`;
  s+=`<line x1="${cx+rx+10}" y1="${cy}" x2="${W-6}" y2="${cy}" stroke="#2b2f2b" stroke-width="22"/>`;
  // clockwise in the picture = forward in the program; the first station is at the top
  const pt=k=>{ const a=(k-(n-1))*2*Math.PI/n; return [cx+rx*Math.cos(a), cy+ry*Math.sin(a)]; }; // the branch (last station) sits at the right, next to the exit
  stations.forEach((t,k)=>{ const [x,y]=pt(k); const hot=o.cur===k;
    s+=`<rect x="${x-62}" y="${y-14}" width="124" height="28" rx="7" fill="${hot?'#ffd23f':'#1d211b'}" stroke="${hot?'#b8901a':'#000'}" stroke-width="2"/>`+mono(x,y+5,t,13,hot?'#222':'#e8f5df','middle',700); });
  // exit gate after the last station (the branch)
  const open=!!o.open;
  s+=`<rect x="${W-58}" y="${cy-30}" width="52" height="22" rx="5" fill="#1daa1d"/>`+heb(W-32,cy-14,'End',12,'#fff',700);
  s+=`<rect x="${W-72}" y="${cy-16}" width="8" height="32" fill="${open?'#1daa1d':'#c0392b'}" transform="rotate(${open?-70:0} ${W-68} ${cy-16})"/>`;
  s+=heb(W-32,cy+30,open?'Gate open':'Gate closed',11,'currentColor');
  // the car
  if(o.car!=null){ const [x,y]=o.car==='out'?[W-36,cy+4]:pt(o.car-0.22); s+=`<g transform="translate(${x},${y})"><rect x="-13" y="-8" width="26" height="14" rx="5" fill="#ff5c1d" stroke="#7a2a0a" stroke-width="1.5"/><circle cx="-7" cy="7" r="3.5" fill="#222"/><circle cx="7" cy="7" r="3.5" fill="#222"/><rect x="-5" y="-6" width="10" height="6" rx="2" fill="#bfe3ff"/></g>`; }
  // the lap board
  if(o.board){ s+=`<rect x="${cx-90}" y="${cy-24}" width="180" height="48" rx="8" fill="#1d211b" stroke="#000"/>`+heb(cx,cy-4,o.board[0],13,'#ffd23f',700)+mono(cx,cy+16,o.board[1],12,'#e8f5df'); }
  return svg(W,250,s);
}

/* ---------------- program window (chapters 9+) ----------------
   cfg: title, lines, show:{b,x,y,lamps}, tail:'hide'|'real'|'none', keys:[...] (key pad), predict, gap, variants,
        track:true (live race track), speed: start speed index, onWin, note */
const SPEEDS9=[{n:'1 step a second',ms:1000},{n:'4 a second',ms:250},{n:'20 a second',ms:50},{n:'200 a second',ms:5},{n:'Dragon speed',real:true}];
function progWindow9(host,cfg){
  const show=Object.assign({lamps:['Z']},cfg.show||{}), tail=cfg.tail||'hide', variants=cfg.variants||null;
  const box=cpuBox9(show);
  host.innerHTML=`<div class="prog p9" tabindex="0"><div class="prog-title"><span>${cfg.title}</span><span>✓ Checked in DREAM on our Dragon machine</span></div>
    ${cfg.predict?'<div class="predict"><div class="q">🤔 Guess first: '+cfg.predict.q+'</div><div class="opts"></div><div class="fb pfb"></div></div>':''}
    ${cfg.gap?'<div class="gapopts"><div class="q">'+(cfg.gapq||'Which line is missing?')+'</div><div class="opts gopts"></div><div class="fb gfb"></div></div>':''}
    ${variants?'<div class="variants"><div class="q">'+(cfg.varq||'Choose:')+'</div><div class="opts vopts"></div></div>':''}
    <div class="prog-body"><ol class="code"></ol><div class="cpu">${svg(320,box.H,box.s,300)}</div>
      ${cfg.track?'<div class="track9"></div>':''}<div class="scr-cell"><div class="scr"></div>${cfg.keys?'<div class="keypad9"><span class="kp-l">Keyboard:</span></div>':''}</div></div>
    <div class="stepsay"><div class="box"></div></div>
    <div class="ctrls"><button class="btn st">Step ▶</button><button class="btn ghost run">Run ▶▶</button><button class="btn ghost rs">From the start ↺</button><button class="btn ghost skip" hidden>⏩ Skip the wait</button>
      <label class="spd9">Speed: <input type="range" min="0" max="4" step="1" value="${cfg.speed!=null?cfg.speed:1}"><span class="spdn"></span></label></div>
    <div class="clock9"></div></div>`;
  const P=host.querySelector('.prog'), pfb=P.querySelector('.pfb')||document.createElement('div'), ol=P.querySelector('ol.code'), sayb=P.querySelector('.stepsay .box'), cpuEl=P.querySelector('.cpu'), clk=P.querySelector('.clock9');
  const sc=new Screen9(P.querySelector('.scr'),{labels:true,hexcols:true,interactive:!!(cfg.predict&&cfg.predict.cell),onClick:i=>pickCell(i),onHover:()=>{}});
  const btnS=P.querySelector('.st'), btnR=P.querySelector('.run'), btnK=P.querySelector('.skip'), rng=P.querySelector('input[type=range]'), spdn=P.querySelector('.spdn'), trk=P.querySelector('.track9');
  let lines=(variants?variants[0].lines:cfg.lines).slice(), guess=null, busy=false, gapOk=!cfg.gap, stopped=false, ended=false, running=false, st, prog, labels, lastKey=null, lastExit=false;
  sendBtn(P,host,cfg,()=>({lines,tail:tail==='none'?'none':'real'}));
  const io={poll:()=>{ const k=st.key; st.key=null; showKey(); return k||0; }};
  function build(){ const r=asm9(lines.filter(l=>l!=null).join('\n'),{tail}); prog=r.prog; labels=r.labels; if(r.errs.length) console.warn(cfg.title,r.errs); }
  function renderCode(){
    ol.innerHTML=''; let k=0;
    const all=lines.concat(tail==='real'?TAIL9:[]);
    all.forEach((l,j)=>{ const li=document.createElement('li');
      if(l===null){ li.className='gap'; li.textContent='  ???'; }
      else { li.innerHTML=codeLine9(l); li.dataset.k=k; if(j>=lines.length) li.classList.add('tl9'); if(st&&!ended&&k===st.pc) li.classList.add('cur'); k++; }
      ol.appendChild(li); });
    if(tail==='hide'){ const t=document.createElement('li'); t.className='tail'; t.innerHTML='<span class="ltr">KEY</span> … the fixed ending (waits for a key)'; if(st&&st.pc>=prog.length) t.classList.add('cur'); ol.appendChild(t); }
  }
  let tailSaid=false;
  function atTail(){ const p=prog[st.pc]; if(p&&p.tail&&!tailSaid&&!ended){ tailSaid=true; sayb.innerHTML='We’ve reached <b>KEY</b>, the fixed ending: the program asks the keyboard again and again, and waits. Look at the screen, then press a key (below) to go back to DREAM.'; reveal(); } }
  function curLine(){ ol.querySelectorAll('li.cur').forEach(x=>x.classList.remove('cur')); const li=ol.querySelector('li[data-k="'+st.pc+'"]'); if(li&&!ended) li.classList.add('cur'); else if(tail==='hide'&&st.pc>=prog.length){ const t=ol.querySelector('li.tail'); if(t) t.classList.add('cur'); } }
  function fingers(){ const f=[]; ['X','Y'].forEach(r=>{ if(show[r.toLowerCase()]&&st[r]!=null&&st[r]>=0x400&&st[r]<=0x5ff) f.push({i:st[r]-0x400,col:FINGER9[r]}); }); return f; }
  function paint(){ paintCpu9(cpuEl,st,show); sc.fingers=fingers(); sc.draw(); clock(); if(trk) drawTrack(); skipBtn(); }
  function clock(){ clk.innerHTML='⏱ Time on the Dragon so far: <b>'+secs9(st.cyc)+'</b> <span class="soft">('+st.cyc.toLocaleString()+' clock ticks)</span> · commands: <b>'+st.steps.toLocaleString()+'</b> · jumps back: <b>'+st.laps.toLocaleString()+'</b>'; }
  function loopBody(){ // the stations of the loop for the race track: from the first backward target to the branch
    const back=prog.findIndex((p,i)=>p.mode==='rel'&&labels[p.target]<=i&&!p.tail); if(back<0) return null;
    return {a:labels[prog[back].target],b:back}; }
  function drawTrack(){ const lb=loopBody(); if(!lb) return; const names=prog.slice(lb.a,lb.b+1).map(p=>p.op+(p.argText?' '+p.argText:''));
    const inLoop=st.pc>=lb.a&&st.pc<=lb.b, out=st.pc>lb.b||ended;
    trk.innerHTML=track9(names,{cur:inLoop?st.pc-lb.a:null,car:out?'out':(inLoop?st.pc-lb.a:0),open:out,board:['Lap '+(st.laps+1),(show.x&&st.X!=null?'X = '+hex4(st.X):show.y&&st.Y!=null?'Y = '+hex4(st.Y):'')+(show.b&&st.B!=null?'  B = '+hex2(st.B):'')]}); }
  function delayAt(){ const p=prog[st.pc]; if(!p) return null; // a 2-line countdown: LEAX -1,X / BNE back
    const isD=(i)=>{ const a=prog[i], b=prog[i+1]; return a&&b&&(a.op==='LEAX'||a.op==='LEAY')&&a.off===-1&&!a.acc&&b.op==='BNE'&&labels[b.target]===i; };
    if(isD(st.pc)) return st.pc; if(st.pc>0&&isD(st.pc-1)) return st.pc-1; return null; }
  function skipBtn(){ const d=delayAt(); btnK.hidden=!(d!=null&&!ended&&!stopped&&!running&&(st[prog[d].op[3]]||0)>2); }
  function showKey(){ const e=P.querySelector('.kp-wait'); if(e) e.innerHTML=st.key?'Key waiting: <b class="ltr">'+keyName9(st.key)+'</b> (the processor will see it at the next check)':''; }
  function reset(){ running=false; tailSaid=false; revealed=false; build(); st=cpuNew9(); stopped=false; ended=false; sc.clear(); paint(); renderCode(); showKey();
    sayb.innerHTML=lines.includes(null)?'First choose the missing line.':'The screen is clear, as in DREAM before a run. The drawers hold numbers we don’t know, so “?”. Press <b>Step</b>, or <b>Run</b>.'; lock(); }
  function lock(){ const need=(cfg.predict&&guess==null)||!gapOk; const fin=ended||stopped; btnS.disabled=need||busy||fin||running; btnR.disabled=need||fin&&!running; btnR.textContent=running?'Stop ⏸':'Run ▶▶';
    if(need&&cfg.predict&&guess==null) sayb.innerHTML='👆 Guess first, then we run it.'; skipBtn(); }
  function finish(msg){ ended=true; running=false; sayb.innerHTML=msg; renderCode(); paint(); lock(); reveal(); }
  function endMsg(){ return tail==='hide'?'The program has reached <b>KEY</b>, the fixed ending, and waits for a key. On the Dragon: you look, press a key, and go back to the editor.':'<b class="ltr">RTS</b>: the program has ended, and we go back to DREAM. In DREAM the editor would redraw itself on the screen.'; }
  function exec(quick){ // one instruction; returns the event or null when finished/stopped
    if(st.done||st.pc>=prog.length){ finish(endMsg()); return null; }
    try{ return cpuStep9(st,prog,labels,io); }
    catch(e){ if(!(e instanceof CpuStop9)) throw e; const li=ol.querySelector('li[data-k="'+st.pc+'"]'); if(li) li.style.background='#5a1d18'; sayb.innerHTML='⚠️ '+e.message; stopped=true; running=false; lock(); return null; }
  }
  async function step(quick){
    if(busy) return; busy=true; lock();
    const li=ol.querySelector('li[data-k="'+st.pc+'"]'); const fr=li?li.getBoundingClientRect():null;
    const ev=exec(quick); if(!ev){ busy=false; lock(); return; }
    const p=ev.p;
    if(!quick&&fr){
      const R=r=>{ const e=P.querySelector('.'+r+'val-bg'); return e?e.getBoundingClientRect():fr; };
      if((p.op==='LDA'||p.op==='LDB')&&p.mode==='imm') await fly(fr,R(p.op[2].toLowerCase()),hex2(st[p.op[2]]));
      else if((p.op==='LDA'||p.op==='LDB')){ await fly(sc.cellRect(ev.ea-0x400),R(p.op[2].toLowerCase()),hex2(st[p.op[2]])); }
      else if(p.op==='STA'||p.op==='STB') await fly(R(p.op[2].toLowerCase()),sc.cellRect(ev.ea-0x400),hex2(st[p.op[2]]));
      else if((p.op==='LDX'||p.op==='LDY')) await fly(fr,R(p.op[2].toLowerCase()),hex4(st[p.op[2]]));
      else if(p.op==='JSR') await fly(R('x'),R('a'),ev.key?keyName9(ev.key):'0');
    }
    if(ev.ea!=null&&(p.op[0]==='S'||p.op==='INC'||p.op==='DEC')) sc.set(ev.ea-0x400,st.mem[ev.ea-0x400],!quick);
    paint(); if(!quick) blink9(P.querySelector('.drawer'+drawerOf9(p.op)));
    sayb.innerHTML=stepText9(ev,st,show);
    curLine(); busy=false; lock(); if(prog[st.pc]&&prog[st.pc].tail&&!tailSaid){ tailSaid=true; sayb.innerHTML+='<br>➜ Now the fixed ending starts: it will wait for a key.'; reveal(); }
    if(st.done) finish(endMsg()); else if(tail==='hide'&&st.pc>=prog.length) finish(endMsg());
  }
  async function run(){
    if(running){ running=false; lock(); return; }
    running=true; lock();
    const sp=SPEEDS9[+rng.value];
    if(sp.real){ let last=performance.now(), budget=0;
      sayb.innerHTML='Running at the Dragon’s speed: about 890,000 clock ticks a second.'+(cfg.keys?' Press the keys under the screen (or on your own keyboard, when the window is selected).':'');
      while(running&&!ended&&!stopped){
        await new Promise(r=>requestAnimationFrame(r)); const now=performance.now(); budget+=Math.min(60,now-last)*CLK9/1000; last=now;
        const c0=st.cyc; while(running&&st.cyc-c0<budget&&!ended&&!stopped){ const ev=exec(true); if(!ev) break; if(ev.ea!=null&&(ev.p.op[0]==='S'||ev.p.op==='INC'||ev.p.op==='DEC')) sc.mem[ev.ea-0x400]=st.mem[ev.ea-0x400]; if(st.done||(tail==='hide'&&st.pc>=prog.length)){ finish(endMsg()); break; } }
        budget-=st.cyc-c0; if(!ended&&!stopped){ paint(); curLine(); atTail(); }
      }
      if(!ended&&!stopped) sayb.innerHTML='We stopped in the middle. You can carry on step by step, or run it again.';
    } else {
      while(running&&!ended&&!stopped){ const t0=performance.now(); await step(sp.ms<1000); const w=sp.ms-(performance.now()-t0); if(w>0) await sleep(w); }
    }
    running=false; lock();
  }
  async function skip(){ const d=delayAt(); if(d==null) return; const R=prog[d].op[3]; const n0=st[R];
    while(!ended&&!stopped&&(st.pc===d||st.pc===d+1)){ if(!exec(true)) break; }
    paint(); curLine(); sayb.innerHTML='⏩ Skipped: the processor counted down '+n0.toLocaleString()+' times ('+(2*n0).toLocaleString()+' commands), until the finger '+R+' reached 0. That took it '+secs9(n0*(prog[d].cyc+prog[d+1].cyc))+'.'; lock(); }
  function pickCell(i){ if(!cfg.predict||!cfg.predict.cell||st.steps>0) return; guess=i; sc.marks={}; sc.marks[i]='#ff9b2f'; sc.draw(); pfb.className='fb pfb'; pfb.innerHTML='Your guess is marked with an orange frame (house '+L(hex4(0x400+i))+'). Now run it.'; lock(); sayb.innerHTML='Good. Now press <b>Step</b> or <b>Run</b>.'; }
  let revealed=false;
  function reveal(){ if(!cfg.predict||guess==null||revealed) return; revealed=true; const right=cfg.predict.cell?cfg.predict.check(guess):guess===cfg.predict.a;
    pfb.className='fb pfb '+(right?'ok':'no'); pfb.innerHTML=(right?'✓ You were right! ':'✗ Not quite. ')+cfg.predict.why; if(cfg.predict.cell){ sc.marks={}; sc.draw(); } if(right&&cfg.onWin) cfg.onWin(); }
  if(cfg.predict){ const po=P.querySelector('.predict .opts');
    if(cfg.predict.cell) po.innerHTML='<span class="chip">Click the square on the screen below</span>';
    else cfg.predict.opts.forEach((o,k)=>{ const b=document.createElement('button'); b.className='opt'; b.innerHTML=o; b.onclick=()=>{ if(st.steps>0) return; guess=k; po.querySelectorAll('.opt').forEach(x=>x.style.borderColor=''); b.style.borderColor='var(--warm)'; pfb.innerHTML='Chosen. Now run it and see.'; lock(); sayb.innerHTML='Press <b>Step</b> or <b>Run</b>.'; }; po.appendChild(b); }); }
  if(cfg.gap){ const gi=lines.indexOf(null), go=P.querySelector('.gopts'), gfb=P.querySelector('.gfb');
    cfg.gap.forEach(g=>{ const b=document.createElement('button'); b.className='opt'; b.innerHTML=L(g.t.trim()); b.onclick=()=>{
      go.querySelectorAll('.opt').forEach(x=>x.classList.remove('right','wrong')); b.classList.add(g.ok?'right':'wrong');
      gfb.className='fb '+(g.ok?'ok':'no'); gfb.innerHTML=g.why; lines[gi]=g.t; gapOk=true; reset(); sayb.innerHTML=g.ok?'The line is in place. Run it and see.':'This line is in place. Run it and see what comes out, then try another line.'; if(g.ok&&cfg.onWin) cfg.onWin(); }; go.appendChild(b); }); }
  if(variants){ const vo=P.querySelector('.vopts');
    variants.forEach((v,k)=>{ const b=document.createElement('button'); b.className='opt'+(k===0?' sel':''); b.innerHTML=v.label; b.onclick=()=>{ vo.querySelectorAll('.opt').forEach(x=>x.classList.remove('sel')); b.classList.add('sel'); lines=v.lines.slice(); reset(); if(cfg.onVariant) cfg.onVariant(k); }; vo.appendChild(b); }); }
  if(cfg.keys){ const kp=P.querySelector('.keypad9');
    cfg.keys.forEach(k=>{ const b=document.createElement('button'); b.className='key9'; b.textContent=k; b.onclick=()=>{ st.key=keyCode9(k); showKey(); }; kp.appendChild(b); });
    const w=document.createElement('div'); w.className='kp-wait'; kp.appendChild(w);
    P.addEventListener('keydown',e=>{ const map={ArrowLeft:'←',ArrowRight:'→',ArrowUp:'↑',ArrowDown:'↓',' ':'SPACE'}; let k=map[e.key]||(/^[a-z]$/i.test(e.key)?e.key.toUpperCase():null);
      if(!k) return; e.preventDefault(); st.key=keyCode9(k); showKey(); }); }
  const spd=()=>{ spdn.textContent=SPEEDS9[+rng.value].n; }; rng.oninput=spd; spd();
  btnS.onclick=()=>step(false); btnR.onclick=run; P.querySelector('.rs').onclick=()=>reset(); btnK.onclick=skip;
  reset();
}
const drawerOf9=op=>WIDE9[op]||op.startsWith('LEA')?op.slice(-1):(op==='JSR'||op==='RTS'||op.startsWith('B')?'A':(/^(LDB|STB|CMPB|INCB|DECB|CLRB)$/.test(op)?'B':'A'));
function codeLine9(l){ const m=l.match(/^(\S*)\s+(\w+)\s*(.*)$/); if(!m) return l; return (m[1]?'<span class="lbl">'+m[1]+'</span>':'')+' <span class="op">'+m[2]+'</span> <span class="arg">'+m[3]+'</span>'; }
function stepText9(ev,st,show){
  const p=ev.p, o=ev.old;
  const nm=v=>L(hex2(v))+' ('+v+(v>=0x40&&v<0x5b?', '+CHARS[v&63]:'')+')';
  const where=()=> p.mode==='ext'?'in house '+L(hex4(ev.ea)):(p.acc?'in house '+p.reg+' plus B = '+L(hex4(ev.ea)):p.off?'in the house next to the finger: '+p.reg+(p.off>0?' plus ':' minus ')+Math.abs(p.off)+' = '+L(hex4(ev.ea)):'in the house the finger '+p.reg+' points at ('+L(hex4(ev.ea))+')');
  const post=p.post?' Then the finger '+p.reg+' moves one step right: '+L(hex4(st[p.reg]))+'.':'';
  const head=L(p.op+(p.argText?' '+p.argText:''))+': ';
  const R=p.op.slice(-1);
  let t='';
  switch(p.op){
    case 'LDA': case 'LDB': t=p.mode==='imm'?'Put '+nm(st[p.op[2]])+' in drawer '+p.op[2]+'.':'Copy what is written '+where()+': '+nm(st[p.op[2]])+', and put it in drawer '+p.op[2]+'.'+post; break;
    case 'STA': case 'STB': t='Write what is in drawer '+p.op[2]+' ('+L(hex2(st[p.op[2]]))+') '+where()+'.'+post; break;
    case 'ADDA': t=L(hex2(o.A))+' plus '+L(hex2(ev.m))+' = '+L(hex2(st.A))+(st.C?'. The wheel came out: lamp C comes on.':'.'); break;
    case 'SUBA': t=L(hex2(o.A))+' minus '+L(hex2(ev.m))+' = '+L(hex2(st.A))+'.'; break;
    case 'CMPA': case 'CMPB': t='Compare '+R+' ('+L(hex2(st[R]))+') with '+L(hex2(ev.m))+(ev.m>=0x41&&ev.m<=0x5A?' ('+String.fromCharCode(ev.m)+')':ev.m===0x09?' (right arrow)':ev.m===0x08?' (left arrow)':ev.m===0x5E?' (up arrow)':ev.m===0x0A?' (down arrow)':ev.m===0x20?' (SPACE)':'')+'. '+(st.Z?'<b>Equal</b>: lamp Z comes on.':(st.C?R+' is <b>smaller</b>: lamp Z is off.':R+' is <b>bigger</b>: lamp Z is off.')); break;
    case 'INCA': case 'INCB': t='Drawer '+R+' goes up by 1: '+L(hex2(o[R]))+' → '+L(hex2(st[R]))+'.'; break;
    case 'DECA': case 'DECB': t='Drawer '+R+' goes down by 1: '+L(hex2(o[R]))+' → '+L(hex2(st[R]))+'. '+(st.Z?'We reached 0: lamp Z <b>comes on</b>.':'Not 0 yet: lamp Z is off.'); break;
    case 'CLRA': case 'CLRB': t='Put 0 in drawer '+R+'.'; break;
    case 'INC': case 'DEC': t=(p.op==='INC'?'Add 1 to':'Take 1 off')+' the number '+where()+': '+L(hex2(ev.prev))+' → '+L(hex2(st.mem[ev.ea-0x400]))+'.'; break;
    case 'LDX': case 'LDY': t=p.mode==='ext'?'No hash sign: copy the two houses <span class="ltr">$A000</span> and <span class="ltr">$A001</span>. Written there is '+L(hex4(KEYVEC9))+': the house of the <b>keyboard checker</b>, in the permanent memory. The finger X now points at it.':'Put '+L(hex4(st[p.op[2]]))+' in drawer '+p.op[2]+'. The finger now points at this house'+(st[p.op[2]]>=0x400&&st[p.op[2]]<=0x5ff?' (row '+((st[p.op[2]]-0x400)>>5)+', column '+((st[p.op[2]]-0x400)&31)+').':'. It is not on the screen: here it is just a number for counting.'); break;
    case 'CMPX': case 'CMPY': t='Compare '+R+' ('+L(hex4(st[R]))+') with '+L(hex4(ev.m))+'. '+(st.Z?'<b>Equal</b>: lamp Z comes on.':(st.C?R+' is still <b>smaller</b> (lamp C is on).':R+' is <b>bigger</b> (lamps Z and C are off).')); break;
    case 'LEAX': case 'LEAY': { const d=ev.off; t=(p.acc?'Move the finger '+R+' by what is in drawer B ('+L(hex2(o.B))+' = '+d+'): ':'Move the finger '+R+' ')+(d===1?'one step right':d===-1?(st[R]<0x400||o[R]<0x400?'back by one':'one step left'):d===32?'one row down':d===-32?'one row up':d===33?'one step on the diagonal, down and right':d===-33?'one step on the diagonal, up and left':(d>=0?'forward ':'back ')+Math.abs(d))+': '+L(hex4(o[R]))+' → '+L(hex4(st[R]))+'.'+(p.off===-1&&!p.acc&&st[R]<0x400?' '+(st.Z?'We reached 0: lamp Z <b>comes on</b>.':'Not 0 yet: lamp Z is off.'):''); break; }
    case 'JSR': t='Go to the keyboard checker and come back. '+(ev.key?'A key was pressed! Drawer A gets its code: '+L(hex2(ev.key))+' ('+keyName9(ev.key)+'), and lamp Z is <b>off</b>.':'No key was pressed: drawer A holds '+L('$00')+', and lamp Z is <b>on</b>.'); break;
    case 'RTS': t='Go back to whoever ran the program: to DREAM.'; break;
    case 'BRA': t='Always turn: jump to '+L(p.target)+'.'+(ev.back?' ↩ Back: another lap.':''); break;
    default: { const f={BEQ:'Z',BNE:'Z',BLO:'C',BHS:'C'}[p.op], on=st[f];
      const cond={BEQ:'If lamp Z is on',BNE:'If lamp Z is off',BLO:'If lamp C is on (smaller)',BHS:'If lamp C is off (bigger or equal)'}[p.op];
      t=cond+', turn to '+L(p.target)+'. Lamp '+f+' is '+(on?'on':'off')+', so '+(ev.take?(ev.back?'we <b>go back</b>: another lap. ↩':'we <b>turn</b>. ↪'):'we <b>carry straight on</b>. ↓'); }
  }
  return head+t;
}

/* ---------------- write-it-yourself puzzles (chapters 9+) ----------------
   cfg: tag, q, cases:[{name, pre:[locked lines], keys:[...], target:[[i,v],...]}], tail, ops, best, minTime (seconds), maxLines,
        hint1, hint2, solution, onWin, preNote */
function codePuzzle9(host,cfg){
  const cases=cfg.cases, multi=cases.length>1, tail=cfg.tail||'hide';
  const preShow=cases[0].pre||[];
  const preHtml=preShow.length?`<ol class="code locked">${preShow.map(l=>'<li>'+codeLine9(l)+'</li>').join('')}<li class="tail">🔒 ${cfg.preNote||'These lines are already written. Carry on below them:'}</li></ol>`:'';
  host.innerHTML=`<span class="tag">${cfg.tag}</span><p>${cfg.q}</p>
   <div class="lbl">Your program${cfg.ops?' · allowed: '+cfg.ops.map(o=>'<bdi class="ltr">'+o+'</bdi>').join(', '):''}</div>${preHtml}
   <textarea class="src" spellcheck="false" autocapitalize="characters" autocomplete="off">${cfg.start||''}</textarea>
   <div class="row" style="margin-top:6px"><button class="btn go">Run and check</button><button class="btn ghost sol">Solution</button><span class="soft">A line without a name starts with a space.${tail==='real'?' You don’t need to type the fixed ending: it is added by itself.':''}</span></div>
   <div class="cases"></div>
   <details><summary>Hint 1</summary><p>${cfg.hint1}</p></details><details><summary>Hint 2</summary><p>${cfg.hint2}</p></details>
   <div class="fb res"></div>`;
  const box=host.querySelector('.cases');
  const views=cases.map(c=>{
    const d=document.createElement('div'); d.className='case';
    const kk=c.keys?'<div class="keys9">Keys pressed: '+(c.keys.length?c.keys.map(k=>'<kbd>'+k+'</kbd>').join(' '):'no keys')+'</div>':'';
    d.innerHTML=(multi?'<div class="case-h">'+c.name+'</div>':'')+kk+`<div class="pz-grid"><div><div class="lbl">This is how it should look at the end:</div><div class="tgt"></div><div class="info tinfo">Hover or tap the picture to see numbers</div></div><div><div class="lbl">Your screen at the end of the run:</div><div class="mine"></div></div></div>`;
    box.appendChild(d);
    const T=new Uint8Array(512).fill(0x60); c.target.forEach(([i,v])=>T[i]=v);
    const ti=d.querySelector('.tinfo');
    const tg=new Screen(d.querySelector('.tgt'),{labels:true,hexcols:true,interactive:true,onHover:i=>{ ti.innerHTML=i<0?'Hover or tap the picture to see numbers':cellInfo(tg.mem,i); },onClick:i=>{ ti.innerHTML=cellInfo(tg.mem,i); }});
    tg.mem.set(T); tg.draw();
    const mine=new Screen(d.querySelector('.mine'),{labels:true,hexcols:true});
    return {T,mine,c};
  });
  const ta=host.querySelector('textarea'), res=host.querySelector('.res');
  host.querySelector('.sol').onclick=()=>{ ta.value=cfg.solution; res.className='fb res'; res.innerHTML='That’s one solution. If you wrote a different one that works, it’s right too. Press “Run and check”.'; };
  host.querySelector('.go').onclick=async ()=>{
    const userLines=ta.value.replace(/\r/g,'').split('\n');
    const msgs=[]; let allOk=true, nUser=0, tmax=0;
    for(const v of views){
      const pre=v.c.pre||[];
      const r=asm9(pre.concat(userLines).join('\n'),{base:pre.length,tail,ops:cfg.ops});
      if(r.errs.length){ res.className='fb res no'; res.innerHTML=r.errs.map(e=>'⚠️ '+e).join('<br>'); return; }
      const mineProg=r.prog.filter(p=>p.line>=pre.length&&!p.tail); nUser=mineProg.length;
      if(!mineProg.length){ res.className='fb res no'; res.innerHTML='You haven’t written any lines yet.'; return; }
      if(cfg.maxLines&&nUser>cfg.maxLines){ res.className='fb res no'; res.innerHTML='⚠️ '+nUser+' lines is a lot. In this puzzle you may use up to '+cfg.maxLines+': use a loop.'; return; }
      const ruleMsg=cfg.rule&&cfg.rule(mineProg); if(ruleMsg){ res.className='fb res no'; res.innerHTML='⚠️ '+ruleMsg; return; }
      const out=cpuRun9(r.prog,r.labels,{keys:v.c.keys||[]});
      v.mine.mem.set(out.st.mem); v.mine.marks={};
      let diff=0; for(let i=0;i<512;i++) if(v.mine.mem[i]!==v.T[i]){ diff++; v.mine.marks[i]='#c0392b'; } v.mine.draw();
      tmax=Math.max(tmax,out.st.cyc);
      const pfx=multi?v.c.name+': ':'';
      if(out.err){ allOk=false; msgs.push(pfx+'⚠️ '+out.err); continue; }
      if(out.keysLeft){ allOk=false; msgs.push(pfx+'The program ended before all the keys were pressed ('+out.keysLeft+' left). Maybe a loop that goes back to ask is missing?'); continue; }
      if(diff){ allOk=false; msgs.push(pfx+diff+' squares are not as in the picture (marked in red).'); continue; }
      if(cfg.minTime&&out.st.cyc/CLK9<cfg.minTime){ allOk=false; msgs.push(pfx+'The screen is right, but on the Dragon all this is over in '+secs9(out.st.cyc)+'. The eye won’t have time to see any movement. You need a wait (at least '+cfg.minTime+' second in total).'); continue; }
      await sleep(100);
    }
    if(allOk){ res.className='fb res ok'; res.innerHTML='✓ '+(multi?'In every case the screen matches the picture!':'The screen matches the picture!')+(cfg.minTime?' On the Dragon this takes about '+secs9(tmax)+'.':'')+' '+(nUser<=cfg.best?'And short too: '+nUser+' lines.':'You did it in '+nUser+' lines. Challenge: it can also be done in '+cfg.best+'.')+' <span class="badge">★ Solved</span>'; if(!host._won){ host._won=1; cfg.onWin&&cfg.onWin(); } }
    else { res.className='fb res no'; res.innerHTML='Almost! '+msgs.join('<br>'); }
  };
}

/* =================== chapters 9–11: content =================== */
const TL9=['KEY LDX $A000',' JSR ,X',' BEQ KEY',' RTS'];
const win9=winner(9,3), win10=winner(10,3), win11=winner(11,3);
Object.assign(QUIZ,{
  q9a:{q:'We put three in B (<bdi class="ltr">LDB #3</bdi>), and then a loop that ends with <bdi class="ltr">DECB</bdi> and <bdi class="ltr">BNE</bdi>. How many times will the body of the loop run?',opts:['3','2','4'],a:0,
       why:['Right! B goes 3 → 2 → 1 → 0. Only after the third lap does it reach 0, lamp Z comes on, and BNE lets you out.','After the second lap B is 1, not 0. Lamp Z is off, so BNE goes back once more.','At 0 you leave. There is no fourth lap.']},
  q9b:{q:'The blocks in the window fill the row in about 2.4 seconds, with <bdi class="ltr">LDX #$2000</bdi>. How do you make it twice as slow?',opts:['<bdi class="ltr">LDX #$4000</bdi>','<bdi class="ltr">LDX #$1000</bdi>','<bdi class="ltr">LDX #$2001</bdi>'],a:0,
       why:['Right! <bdi class="ltr">$4000</bdi> = 16,384, twice 8,192. Twice as many waiting laps.','<bdi class="ltr">$1000</bdi> is half: that makes it twice as <b>fast</b>.','One more lap out of 8,192. Nobody will notice.']},
  q10a:{q:'In the program above, what would happen if we wrote <bdi class="ltr">LDA #$BF</bdi> and <bdi class="ltr">STA $0510</bdi> instead of LDB and STB?',opts:['The key’s code would be wiped out, and the next question (is it B?) would get the wrong answer','Nothing, it is exactly the same','The Dragon would get stuck'],a:0,
       why:['Right! LDA replaces what is in drawer A. After R, A would hold <bdi class="ltr">$BF</bdi>, and <bdi class="ltr">CMPA #\'B</bdi> would compare the colour, not the key.','The square would show the same colour, but A would no longer be holding the key.','It doesn’t get stuck. It just “forgets” which key was pressed.']},
  q11a:{q:'In the ball bouncing along the row, what must be in B for the ball to move left?',opts:['<bdi class="ltr">-1</bdi> (that is, <bdi class="ltr">$FF</bdi>)','<bdi class="ltr">0</bdi>','<bdi class="ltr">31</bdi>'],a:0,
       why:['Right! <bdi class="ltr">LEAY B,Y</bdi> adds B to Y. And adding -1 = one step left.','With 0 the ball stays where it is: Y plus 0.','31 is almost a whole row forward: the ball would jump down and to the left.']}
});
['q9a','q9b','q10a','q11a'].forEach(k=>{ const el=document.querySelector('[data-quiz="'+k+'"]'); if(el) makeQuiz(el,QUIZ[k]); });

/* ---------- chapter 9 ---------- */
put('fig91',track9(['STA ,X+','CMPX #$0520','BLO LOOP'],{cur:0,car:0,board:['Lap number 17','X = $0510']}));
function fig92(){
  let s='';
  [5,4,3,2,1,0].forEach((b,k)=>{ const x=20+k*122, on=b===0;
    s+=`<rect x="${x}" y="14" width="96" height="58" rx="8" fill="#c99a5b" stroke="#7a5428" stroke-width="3"/><rect x="${x+30}" y="22" width="58" height="40" rx="5" fill="#2f3a2c"/>`;
    s+=`<circle cx="${x+16}" cy="32" r="10" fill="#7fe0a0"/>`+mono(x+16,37,'B',13,'#222','middle',700)+mono(x+59,50,'$0'+b,18,'#f1f1e6','middle',700);
    s+=`<circle cx="${x+48}" cy="100" r="12" fill="${on?'#ffb020':'#1b1d21'}" stroke="#15171a" stroke-width="2" ${on?'style="filter:drop-shadow(0 0 6px #ffb020)"':''}/>`+mono(x+28,105,'Z',14,'#c8a000','end',700);
    s+=heb(x+48,136,k===0?'LDB #5':(on?'Out!':'Back'),12,on?'#1daa1d':'currentColor',700);
    if(k<5){ s+=arrow(x+98,43,x+120,43); s+=mono(x+109,32,'DECB',9,'#ff9b2f'); }
  });
  return svg(760,150,s);
}
put('fig92',fig92());

progWindow9(document.getElementById('pw91'),{title:'Example 1 · A whole row in a loop',track:true,show:{x:true,lamps:['Z','C']},
  lines:['@ LDX #$0500',' LDA #$BF','LOOP STA ,X+',' CMPX #$0520',' BLO LOOP'],
  predict:{q:'How many times will the line <bdi class="ltr">STA ,X+</bdi> run?',opts:['32','31','Once'],a:0,why:'The finger starts at <bdi class="ltr">$0500</bdi> and moves one step every lap. After 32 laps it is on <bdi class="ltr">$0520</bdi>: no longer lower, and the gate opens. 32 squares, a whole row.'},onWin:()=>win9('a')});
progWindow9(document.getElementById('pw92'),{title:'Example 2 · The whole screen blue',show:{x:true,lamps:['Z','C']},speed:3,
  lines:['@ LDX #$0400',' LDA #$AF','LOOP STA ,X+',' CMPX #$0600',' BLO LOOP'],
  predict:{q:'How long does the Dragon take to fill all 512 squares?',opts:['About a minute','About a second','Less than the blink of an eye'],a:2,why:'512 laps × 13 ticks = 6,656 ticks. At about 890,000 a second: 0.0074 of a second. The eye only sees the result. (Move the slider to “Dragon speed” and you’ll see.)'}});
progWindow9(document.getElementById('pw93'),{title:'Example 3 · Five blocks, B counts',show:{b:true,x:true,lamps:['Z']},
  lines:['@ LDX #$0508',' LDA #$BF',' LDB #5','LOOP STA ,X+',' DECB',' BNE LOOP'],
  predict:{q:'How many red blocks will there be at the end?',opts:['5','4','6'],a:0,why:'B goes down 5 → 4 → 3 → 2 → 1 → 0. A block on every lap, and five laps. At the end drawer B is left holding 0.'}});
progWindow9(document.getElementById('pw94'),{title:'Example 4 · From 0 to 9',show:{x:true,lamps:['Z','C']},
  lines:['@ LDX #$0400',' LDA #$70','LOOP STA ,X+',' INCA',' CMPA #$7A',' BLO LOOP'],
  predict:{q:'What will be written in the top row?',opts:['0123456789','012345678','0123456789:'],a:0,why:'After writing 9 (<bdi class="ltr">$79</bdi>), INCA raises it to <bdi class="ltr">$7A</bdi>. <bdi class="ltr">CMPA #$7A</bdi>: equal, not lower, so BLO doesn’t go back. The <bdi class="ltr">$7A</bdi> is never written.'}});
progWindow9(document.getElementById('pw95'),{title:'Missing line · A yellow column',show:{b:true,x:true,lamps:['Z']},
  lines:['@ LDX #$0410',' LDA #$9F',' LDB #8','LOOP STA ,X',null,' DECB',' BNE LOOP'],gapq:'Which line is missing?',
  gap:[{t:' LEAX 32,X',ok:true,why:'Right! +32 is one row down. Eight laps, eight rows.'},
       {t:' LEAX 1,X',ok:false,why:'+1 is a step to the right. You get a line lying down, not a column.'},
       {t:' LEAX 33,X',ok:false,why:'33 = a row down and a step to the right: a diagonal.'}],onWin:()=>win9('b')});
progWindow9(document.getElementById('pw96'),{title:'Example 5 · A rectangle: a loop inside a loop',show:{b:true,x:true,lamps:['Z','C']},speed:2,
  lines:['@ LDX #$048A',' LDA #$CF','ROW LDB #6','COL STA ,X+',' DECB',' BNE COL',' LEAX 26,X',' CMPX #$0500',' BLO ROW'],
  predict:{q:'What will come out?',opts:['A white rectangle: 6 squares wide, 4 rows','One row of 24 squares','A rectangle: 4 squares wide, 6 rows'],a:0,why:'On every big lap, the small lap writes 6 squares. After 4 rows X reaches <bdi class="ltr">$050A</bdi>, which is no longer lower than <bdi class="ltr">$0500</bdi>.'}});
const DELAY9=d=>['@ LDY #$0500',' LDA #$BF','LOOP STA ,Y+',' LDX #$'+d,'WAIT LEAX -1,X',' BNE WAIT',' CMPY #$0520',' BLO LOOP'];
progWindow9(document.getElementById('pw97'),{title:'Example 6 · A slow row',show:{x:true,y:true,lamps:['Z','C']},speed:4,
  varq:'How long to wait on each square?',variants:[{label:'<bdi class="ltr">$2000</bdi> (about 0.07 of a second)',lines:DELAY9('2000')},{label:'<bdi class="ltr">$0400</bdi> (short)',lines:DELAY9('0400')},{label:'<bdi class="ltr">$8000</bdi> (long)',lines:DELAY9('8000')}]});

const LOOPRULE=prog=>prog.some(p=>p.mode==='rel'&&p.op!=='BRA')?null:'There is no loop here. You need a crossroads that goes back.';
codePuzzle9(document.getElementById('pz91'),{tag:'Puzzle 1 · Half an orange screen',q:'Paint the whole bottom half of the screen (rows 8 to 15) full orange, <bdi class="ltr">$FF</bdi>.',
  cases:[{target:[...Array(256)].map((_,k)=>[256+k,0xff])}],maxLines:8,rule:LOOPRULE,best:5,
  hint1:'It is like “the whole screen blue”, only the finger starts in the middle.',hint2:'The bottom half starts at <bdi class="ltr">$0500</bdi>. The gate: <bdi class="ltr">$0600</bdi>.',
  solution:'@ LDX #$0500\n LDA #$FF\nLOOP STA ,X+\n CMPX #$0600\n BLO LOOP\n',onWin:()=>win9('c')});
codePuzzle9(document.getElementById('pz92'),{tag:'Puzzle 2 · A dotted line',q:'In row 4: a yellow block (<bdi class="ltr">$9F</bdi>), an empty square, a yellow block, an empty square... all across the row: 16 blocks.',
  cases:[{target:[...Array(16)].map((_,k)=>[128+2*k,0x9f])}],maxLines:8,rule:LOOPRULE,best:7,
  hint1:'On every lap the finger jumps 2 squares. You can count 16 laps with B, or ask X whether it has reached the end of the row.',hint2:'<bdi class="ltr">LDX #$0480</bdi>, <bdi class="ltr">LDB #16</bdi>, and in the loop: <bdi class="ltr">STA ,X</bdi>, <bdi class="ltr">LEAX 2,X</bdi>, DECB, BNE.',
  solution:'@ LDX #$0480\n LDA #$9F\n LDB #16\nLOOP STA ,X\n LEAX 2,X\n DECB\n BNE LOOP\n',onWin:()=>win9('d')});
(function(){ const t=[]; for(let c=0;c<32;c++){ t.push([c,0xcf],[480+c,0xcf]); } for(let r=1;r<15;r++){ t.push([r*32,0xcf],[r*32+31,0xcf]); }
codePuzzle9(document.getElementById('pz93'),{tag:'Puzzle 3 · A frame (hard)',q:'A white frame (<bdi class="ltr">$CF</bdi>) all round the screen: the top row, the bottom row, and the first and last columns.',
  cases:[{target:t}],maxLines:14,rule:LOOPRULE,best:12,
  hint1:'Two loops. The first runs along the top row, and on every lap also writes in the bottom row: it is <bdi class="ltr">480</bdi> houses further on (15 × 32). <bdi class="ltr">STA 480,X</bdi> writes there without moving the finger.',
  hint2:'The second goes down the columns, row by row (<bdi class="ltr">LEAX 32,X</bdi>), and on every row writes at <bdi class="ltr">,X</bdi> and also at <bdi class="ltr">31,X</bdi>.',
  solution:'@ LDX #$0400\n LDA #$CF\nTOP STA 480,X\n STA ,X+\n CMPX #$0420\n BLO TOP\n LDX #$0400\nSIDE STA ,X\n STA 31,X\n LEAX 32,X\n CMPX #$0600\n BLO SIDE\n',onWin:()=>win9('e')}); })();

/* ---------- chapter 10 ---------- */
function fig101(){
  let s='';
  const key=(x,y,w,t,hot)=>`<rect x="${x}" y="${y}" width="${w}" height="34" rx="6" fill="${hot?'#ffd23f':'#2a2e34'}" stroke="#000" stroke-width="1.5"/>`+mono(x+w/2,y+23,t,15,hot?'#222':'#e8e8e8','middle',700);
  s+=`<rect x="10" y="20" width="250" height="150" rx="12" fill="#5a4636"/>`;
  s+=key(26,36,40,'Q')+key(72,36,40,'R')+key(118,36,40,'B')+key(164,36,40,'G');
  s+=key(118,80,40,'↑')+key(72,124,40,'←')+key(118,124,40,'↓')+key(164,124,40,'→',true);
  s+=key(26,80,86,'SPACE');
  s+=`<path d="M260 95 C300 95 300 70 340 70" stroke="#222" stroke-width="5" fill="none"/>`;
  s+=`<rect x="340" y="40" width="140" height="62" rx="10" fill="#3b4048"/>`+heb(410,64,'Keyboard checker',13,'#fff',700)+mono(410,86,'$8006',13,'#cfd6df');
  s+=arrow(482,70,530,70);
  s+=`<rect x="532" y="34" width="150" height="72" rx="8" fill="#c99a5b" stroke="#7a5428" stroke-width="3"/><circle cx="550" cy="52" r="11" fill="#ffd23f"/>`+mono(550,57,'A',14,'#222','middle',700);
  s+=`<rect x="566" y="42" width="106" height="44" rx="5" fill="#2f3a2c"/>`+mono(619,72,'$09',22,'#f1f1e6','middle',700);
  s+=`<circle cx="720" cy="70" r="13" fill="#1b1d21" stroke="#15171a" stroke-width="2"/>`+mono(700,75,'Z',14,'#c8a000','end',700)+heb(720,100,'off',11);
  s+=heb(610,128,'Right arrow pressed: A = $09',13,'currentColor',700);
  s+=`<rect x="340" y="150" width="400" height="44" rx="10" fill="none" stroke="currentColor" stroke-opacity=".3"/>`;
  s+=heb(560,177,'Nothing pressed: A = $00',13)+`<circle cx="400" cy="172" r="11" fill="#ffb020" style="filter:drop-shadow(0 0 5px #ffb020)"/>`+mono(382,177,'Z',13,'#c8a000','end',700)+heb(440,177,'on',11);
  return svg(760,204,s);
}
put('fig101',fig101());
progWindow9(document.getElementById('pw101'),{title:'Example 1 · What is in A when nothing is pressed?',tail:'real',show:{x:true,lamps:['Z']},keys:['A','G','→','SPACE'],
  lines:['@ LDX $A000',' JSR ,X',' STA $0510'],
  predict:{q:'We run it and don’t touch the keyboard. What will appear in square <bdi class="ltr">$0510</bdi>?',opts:['An inverse @ (that is what the number 0 draws)','An empty square','The letter A'],a:0,why:'The checker came back with no key: A holds 0, and <bdi class="ltr">STA</bdi> wrote 0 in the square. Code 0 on the screen is an inverse @. (And at the end, the fixed ending waits for you to press a key.)'}});
progWindow9(document.getElementById('pw102'),{title:'Example 2 · Wait for a key, and show it',tail:'real',show:{x:true,lamps:['Z']},keys:['A','G','Q','→','SPACE'],speed:3,
  lines:["@ LDA #'?",' STA $0400','WAIT LDX $A000',' JSR ,X',' BEQ WAIT',' STA $0401'],onWin:()=>{}});
(function(){ // key explorer
  const host=document.getElementById('keys10'); const seen=new Set();
  const K=['A','G','Q','Z','←','→','↑','↓','SPACE'];
  host.innerHTML='<div class="kx"><div class="keypad9"></div><div class="kx-out info">Press a key</div></div>';
  const pad=host.querySelector('.keypad9'), out=host.querySelector('.kx-out');
  const ms=[{t:'What is the code for the up arrow?',ok:()=>seen.has(0x5E)},{t:'And for SPACE?',ok:()=>seen.has(0x20)},{t:'Press G: is it the same code as <bdi class="ltr">LDA #\'G</bdi> (<bdi class="ltr">$47</bdi>)?',ok:()=>seen.has(0x47)},{t:'Press all four arrows.',ok:()=>[8,9,0x0a,0x5e].every(c=>seen.has(c))}];
  const chk=missions(document.getElementById('m10'),ms,()=>({}));
  K.forEach(k=>{ const b=document.createElement('button'); b.className='key9'; b.textContent=k; b.onclick=()=>{ const c=keyCode9(k); seen.add(c);
    out.innerHTML='Pressed <b>'+k+'</b> → in drawer A: <b class="ltr">'+hex2(c)+'</b> ('+c+'), and lamp Z is off. If we write it to the screen: '; out.appendChild(tile(c,3)); chk(); if(seen.size>=6) win10('k'); }; pad.appendChild(b); });
  chk();
  const t=document.getElementById('keytab');
  [['↑','$5E','94'],['↓','$0A','10'],['←','$08','8'],['→','$09','9'],['SPACE','$20','32'],['A to Z','$41 to $5A','65 to 90'],['No key','$00','0 (and lamp Z is on)']]
   .forEach(([k,h,d])=>t.insertAdjacentHTML('beforeend',`<tr><td><b>${k}</b></td><td><b class="ltr">${h}</b></td><td>${d}</td></tr>`));
})();
progWindow9(document.getElementById('pw103'),{title:'Example 3 · A typewriter',tail:'real',show:{x:true,y:true,lamps:['Z']},keys:['H','I','Q','←','→','↑','↓','SPACE'],speed:4,
  lines:['@ LDY #$0500','LOOP LDX $A000',' JSR ,X',' BEQ LOOP'," CMPA #'Q",' BEQ KEY',' STA ,Y+',' BRA LOOP'],
  predict:{q:'We press the right arrow. What will be written on the screen?',opts:['An inverse I','A right arrow','Nothing'],a:0,why:'The code of the right arrow is <bdi class="ltr">$09</bdi>. On the screen, a number below <bdi class="ltr">$40</bdi> is an inverse letter, and 9 is I (A=1, B=2, ...). The screen doesn’t know it is an “arrow”. It just draws a number.'}});
progWindow9(document.getElementById('pw104'),{title:'Example 4 · A key picks a colour',tail:'real',show:{b:true,x:true,lamps:['Z']},keys:['R','B','Q','G'],speed:4,
  lines:['@ LDB #$CF',' STB $0510','LOOP LDX $A000',' JSR ,X',' BEQ LOOP'," CMPA #'Q",' BEQ KEY'," CMPA #'R",' BNE NOTR',' LDB #$BF',' STB $0510',"NOTR CMPA #'B",' BNE LOOP',' LDB #$AF',' STB $0510',' BRA LOOP'],
  predict:{q:'We press R, then B, then R, and finally Q. What colour will the square stay?',opts:['Red','Blue','White'],a:0,why:'Every key paints it again. The last one before Q was R: red. Q only goes to the fixed ending and doesn’t touch the square.'}});

const POLL9=['LOOP LDX $A000',' JSR ,X',' BEQ LOOP'];
codePuzzle9(document.getElementById('pz101'),{tag:'Puzzle 1 · The last key',tail:'real',q:'The locked lines put a <b>?</b> in the middle of the screen. Write a loop that waits for keys: every key pressed appears in place of the ?, and Q goes to the fixed ending (without appearing).',
  cases:[{name:'Case 1',pre:['@ LDA #$3F',' STA $0510'],keys:['A','B','C','Q'],target:[[272,0x43]]},{name:'Case 2',pre:['@ LDA #$3F',' STA $0510'],keys:['Z','Q'],target:[[272,0x5a]]},{name:'Case 3',pre:['@ LDA #$3F',' STA $0510'],keys:['Q'],target:[[272,0x3f]]}],best:7,
  hint1:'First the three lines of the question (like <bdi class="ltr">WAIT</bdi> in Example 2). Then: Q? Go to KEY. Otherwise: write, and go back to asking.',hint2:'<bdi class="ltr">CMPA #\'Q</bdi>, <bdi class="ltr">BEQ KEY</bdi>, <bdi class="ltr">STA $0510</bdi>, <bdi class="ltr">BRA LOOP</bdi>.',
  solution:"LOOP LDX $A000\n JSR ,X\n BEQ LOOP\n CMPA #'Q\n BEQ KEY\n STA $0510\n BRA LOOP\n",onWin:()=>win10('a')});
codePuzzle9(document.getElementById('pz102'),{tag:'Puzzle 2 · Counting SPACEs',tail:'real',q:'Every press of <b>SPACE</b> adds a red block to row 8, from left to right. Other keys do nothing. Q leaves.',
  cases:[{name:'Case 1',pre:['@ LDY #$0500'],keys:['SPACE','SPACE','SPACE','Q'],target:[[256,0xbf],[257,0xbf],[258,0xbf]]},{name:'Case 2',pre:['@ LDY #$0500'],keys:['SPACE','A','SPACE','B','Q'],target:[[256,0xbf],[257,0xbf]]},{name:'Case 3',pre:['@ LDY #$0500'],keys:['Q'],target:[]}],best:10,
  hint1:'After the question, two checks: Q? Go to KEY. Not SPACE (<bdi class="ltr">$20</bdi>)? Go back to asking.',hint2:'Only if you got past both checks: <bdi class="ltr">LDA #$BF</bdi> and <bdi class="ltr">STA ,Y+</bdi>. You may put a colour in A here, because you no longer need the key’s code.',
  solution:"LOOP LDX $A000\n JSR ,X\n BEQ LOOP\n CMPA #'Q\n BEQ KEY\n CMPA #$20\n BNE LOOP\n LDA #$BF\n STA ,Y+\n BRA LOOP\n",onWin:()=>win10('b')});
codePuzzle9(document.getElementById('pz103'),{tag:'Puzzle 3 · A counter on the arrows',tail:'real',q:'The digit 0 is written in the corner. The up arrow raises it by 1, the down arrow lowers it by 1. Q leaves.',
  cases:[{name:'Case 1',pre:['@ LDA #$70',' STA $0400'],keys:['↑','↑','↑','Q'],target:[[0,0x73]]},{name:'Case 2',pre:['@ LDA #$70',' STA $0400'],keys:['↑','↑','↓','Q'],target:[[0,0x71]]},{name:'Case 3',pre:['@ LDA #$70',' STA $0400'],keys:['↑','↓','↑','↑','Q'],target:[[0,0x72]]}],best:12,
  hint1:'Remember <bdi class="ltr">INC</bdi> and <bdi class="ltr">DEC</bdi> from Chapter 6? They add and take away 1 straight in the house, without touching A. That way the key’s code stays in A for the next question.',hint2:'<bdi class="ltr">CMPA #$5E</bdi>, <bdi class="ltr">BNE NOTU</bdi>, <bdi class="ltr">INC $0400</bdi>. And then <bdi class="ltr">NOTU CMPA #$0A</bdi> ...',
  solution:"LOOP LDX $A000\n JSR ,X\n BEQ LOOP\n CMPA #'Q\n BEQ KEY\n CMPA #$5E\n BNE NOTU\n INC $0400\nNOTU CMPA #$0A\n BNE LOOP\n DEC $0400\n BRA LOOP\n",onWin:()=>win10('c')});

/* ---------- chapter 11 ---------- */
function fig111(){
  let s='';
  for(let f=0;f<4;f++){ const x=14+f*186;
    s+=`<rect x="${x}" y="10" width="174" height="76" rx="6" fill="#222"/>`;
    for(let k=0;k<4;k++) s+=`<circle cx="${x+18+k*46}" cy="18" r="3" fill="#888"/><circle cx="${x+18+k*46}" cy="78" r="3" fill="#888"/>`;
    s+=`<rect x="${x+8}" y="26" width="158" height="44" fill="${VDG.green}"/>`;
    for(let c=0;c<6;c++) s+=`<rect x="${x+12+c*25}" y="34" width="22" height="30" fill="${c===f+1?VDG.sg[3]:VDG.green}" stroke="rgba(0,0,0,.15)"/>`;
    s+=heb(x+87,104,'Picture '+(f+1),12);
  }
  const cx=380, cy=184, r=52, st=[['Draw',-90],['Wait',0],['Erase',90],['Move',180]];
  s+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ff9b2f" stroke-width="3" stroke-dasharray="6 5"/>`;
  st.forEach(([t,a])=>{ const x=cx+(r+38)*Math.cos(a*Math.PI/180), y=cy+(r+22)*Math.sin(a*Math.PI/180); s+=`<rect x="${x-34}" y="${y-14}" width="68" height="26" rx="13" fill="#1d211b"/>`+heb(x,y+5,t,13,'#e8f5df',700); });
  s+=arrow(cx+r*0.7,cy-r*0.72,cx+r*0.74,cy-r*0.66)+arrow(cx+r*0.7,cy+r*0.72,cx+r*0.64,cy+r*0.78)+arrow(cx-r*0.7,cy+r*0.72,cx-r*0.74,cy+r*0.66)+arrow(cx-r*0.7,cy-r*0.72,cx-r*0.64,cy-r*0.78);
  s+=heb(620,190,'On the Dragon: dozens of laps a second',12)+heb(140,190,'Each lap = one picture',12);
  return svg(760,290,s);
}
put('fig111',fig111());
const MOVE11=(d,erase)=>['@ LDY #$0500','LOOP LDA #$BF',' STA ,Y',' LDX #$'+d,'WAIT LEAX -1,X',' BNE WAIT',' CMPY #$051F',' BEQ KEY'].concat(erase?[' LDA #$60',' STA ,Y']:[]).concat([' LEAY 1,Y',' BRA LOOP']);
progWindow9(document.getElementById('pw111'),{title:'Example 1 · Driving to the wall',tail:'real',show:{x:true,y:true,lamps:['Z','C']},speed:4,keys:['SPACE'],
  varq:'Version:',variants:[{label:'With a wait (<bdi class="ltr">$3000</bdi>)',lines:MOVE11('3000',true)},{label:'Without a wait (<bdi class="ltr">$0001</bdi>)',lines:MOVE11('0001',true)},{label:'Without erasing',lines:MOVE11('3000',false)}],
  predict:{cell:true,q:'Where will the block stand at the end? Click on the square.',check:i=>i===0x11f,why:'<bdi class="ltr">$051F</bdi>: the last square in row 8. There <bdi class="ltr">CMPY</bdi> answers “equal”, and <bdi class="ltr">BEQ KEY</bdi> stops before the erasing.'},onWin:()=>win11('p')});
progWindow9(document.getElementById('pw112'),{title:'Example 2 · A block on the arrows',tail:'real',show:{b:true,x:true,y:true,lamps:['Z']},keys:['←','→','Q'],speed:4,
  lines:['@ LDY #$0510','DRAW LDA #$BF',' STA ,Y','WAIT LDX $A000',' JSR ,X',' BEQ WAIT'," CMPA #'Q",' BEQ KEY',' LDB #$60',' STB ,Y',' CMPA #$09',' BNE NOTR',' LEAY 1,Y','NOTR CMPA #$08',' BNE DRAW',' LEAY -1,Y',' BRA DRAW']});
const BOUNCE11=(start,dir,wall)=>['@ LDY #$'+start,' LDB #'+dir,'LOOP LDA #$BF',' STA ,Y',' LDX #$1800','WAIT LEAX -1,X',' BNE WAIT',' LDA #$60',' STA ,Y',' LEAY B,Y',' CMPY #$'+start,' BNE NOTL',' LDB #'+dir,'NOTL CMPY #$'+wall,' BNE NOTR',' LDB #-'+dir,'NOTR LDX $A000',' JSR ,X',' BEQ LOOP',' RTS'];
progWindow9(document.getElementById('pw113'),{title:'Example 3 · A bouncing ball',tail:'none',show:{b:true,x:true,y:true,lamps:['Z']},keys:['SPACE'],speed:4,
  varq:'Where does the ball bounce? (only four numbers are different)',variants:[{label:'In row 8',lines:BOUNCE11('0500','1','051F')},{label:'On a diagonal',lines:BOUNCE11('0400','33','05EF')}]});

codePuzzle9(document.getElementById('pz111'),{tag:'Puzzle 1 · A falling apple',tail:'real',q:'A yellow block (<bdi class="ltr">$9F</bdi>) falls slowly from top to bottom in column <bdi class="ltr">$10</bdi>, and stops on the bottom row. No trail.',
  cases:[{target:[[0x1f0,0x9f]]}],minTime:1,best:12,
  hint1:'Like “driving to the wall”, only the step is one row down: <bdi class="ltr">LEAY 32,Y</bdi>. Start at <bdi class="ltr">$0410</bdi>.',hint2:'The wall is the bottom row, in the same column: <bdi class="ltr">$05F0</bdi>. For a long enough wait, try <bdi class="ltr">LDX #$4000</bdi>.',
  solution:"@ LDY #$0410\nLOOP LDA #$9F\n STA ,Y\n LDX #$4000\nWAIT LEAX -1,X\n BNE WAIT\n CMPY #$05F0\n BEQ KEY\n LDA #$60\n STA ,Y\n LEAY 32,Y\n BRA LOOP\n",onWin:()=>win11('a')});
codePuzzle9(document.getElementById('pz112'),{tag:'Puzzle 2 · Four arrows, and no escaping',tail:'real',q:'A blue block (<bdi class="ltr">$AF</bdi>) moves with the four arrows, and Q leaves. And it must not escape from the screen: if a step up or down would take it out, it stays where it is.',
  cases:[{name:'Case 1',pre:['@ LDY #$0410'],keys:['↑','←','←','Q'],target:[[14,0xaf]]},{name:'Case 2',pre:['@ LDY #$0410'],keys:['↓','↓','→','→','Q'],target:[[0x52,0xaf]]},{name:'Case 3',pre:['@ LDY #$0410'],keys:[...Array(16)].map(()=>'↓').concat(['Q']),target:[[0x1f0,0xaf]]}],best:28,
  hint1:'Start from “a block on the arrows” (Example 2) and add ↑ (<bdi class="ltr">$5E</bdi>, <bdi class="ltr">LEAY -32,Y</bdi>) and ↓ (<bdi class="ltr">$0A</bdi>, <bdi class="ltr">LEAY 32,Y</bdi>).',
  hint2:'After moving, before drawing: if Y is lower than <bdi class="ltr">$0400</bdi> (<bdi class="ltr">CMPY #$0400</bdi>, <bdi class="ltr">BHS</bdi> skips), put it back a row: <bdi class="ltr">LEAY 32,Y</bdi>. And if Y is not lower than <bdi class="ltr">$0600</bdi>, <bdi class="ltr">LEAY -32,Y</bdi>.',
  solution:"DRAW LDA #$AF\n STA ,Y\nWAIT LDX $A000\n JSR ,X\n BEQ WAIT\n CMPA #'Q\n BEQ KEY\n LDB #$60\n STB ,Y\n CMPA #$09\n BNE NOTR\n LEAY 1,Y\nNOTR CMPA #$08\n BNE NOTL\n LEAY -1,Y\nNOTL CMPA #$5E\n BNE NOTU\n LEAY -32,Y\nNOTU CMPA #$0A\n BNE NOTD\n LEAY 32,Y\nNOTD CMPY #$0400\n BHS INTOP\n LEAY 32,Y\nINTOP CMPY #$0600\n BLO DRAW\n LEAY -32,Y\n BRA DRAW\n",onWin:()=>win11('b')});
codePuzzle9(document.getElementById('pz113'),{tag:'Puzzle 3 · One bounce (hard)',tail:'real',q:'A cyan ball (<bdi class="ltr">$DF</bdi>) sets off from <bdi class="ltr">$0410</bdi>, goes slowly down to the bottom row, bounces back up, and stops when it gets back to <bdi class="ltr">$0410</bdi>.',
  cases:[{target:[[0x10,0xdf]]}],minTime:1,best:17,
  hint1:'The direction is in B: <bdi class="ltr">LDB #32</bdi> down, <bdi class="ltr">LDB #-32</bdi> up. <bdi class="ltr">LEAY B,Y</bdi> moves.',
  hint2:'After moving, two questions: have we reached <bdi class="ltr">$05F0</bdi>? Flip B. Are we back at <bdi class="ltr">$0410</bdi>? Draw the ball one last time, and carry on to the fixed ending.',
  solution:"@ LDY #$0410\n LDB #32\nLOOP LDA #$DF\n STA ,Y\n LDX #$2000\nWAIT LEAX -1,X\n BNE WAIT\n LDA #$60\n STA ,Y\n LEAY B,Y\n CMPY #$05F0\n BNE NOTB\n LDB #-32\nNOTB CMPY #$0410\n BNE LOOP\n LDA #$DF\n STA ,Y\n",onWin:()=>win11('c')});

/* ---------- "on the real Dragon" notes (what we saw on our machine) ---------- */
const OKM='<span class="verified">✓ Checked on our Dragon machine</span>';
put('mach9','<b>What we saw on our Dragon machine:</b> every program in the chapter, including the three answers of “A line is missing”, the three waits of Example 6 and the puzzle solutions, was typed into DREAM, assembled with no errors (<code>0000</code>) and run. The screen was checked square by square, and it is identical to what the windows here show. In DREAM you write exactly as here: <code>LDB</code>, <code>DECB</code>, <code>LDY</code>, <code>STA ,Y+</code>, <code>CMPY</code>.<br>The clock was checked too: in Example 6 with <code>$2000</code> our Dragon machine filled about 13.5 squares a second (the window works out 13.6), and with <code>$8000</code> about 3.4 squares a second (the window: 3.4). '+OKM);
put('mach10','<b>What we saw on our Dragon machine:</b> all the programs and solutions were typed into DREAM and run, and the keys were really pressed, one after another. The checker gave back: H <code>$48</code>, I <code>$49</code>, SPACE <code>$20</code>, → <code>$09</code>, ← <code>$08</code>, ↑ <code>$5E</code>, ↓ <code>$0A</code>. No key: <code>$00</code>, and the inverse @ appeared. <code>LDX $A000</code> put <code>$8006</code> in X. And we checked that the checker doesn’t touch B and Y: we put something in them before the question, and read them after. <br>One more thing worth knowing: a key that is held down counts <b>once</b>. We held the right arrow for a second and a half in the program of the block on the arrows (Chapter 11), and the block moved only one step. To move three steps, you press three times. '+OKM);
put('mach11','<b>What we saw on our Dragon machine:</b> all the examples (including the three versions of Example 1 and the two versions of the ball) and the solutions were typed into DREAM and run, and the screen at the end was checked square by square. The time was checked too: in Example 1 the block on our Dragon machine moved one step about every 0.11 of a second (the window works out 0.113), and reached the wall after about 3.5 seconds. The ball in the row bounced between <code>$0500</code> and <code>$051F</code>, one step about every 0.055 of a second, and on the diagonal between <code>$0400</code> and <code>$05EF</code>. A key stopped it and we were back in DREAM. In Puzzle 2 we also checked the edges: the up arrow from the top row, and 16 presses of the down arrow. The block stayed on the screen. '+OKM);

/* =================== chapters 12–15: plates, the program in memory, the game — a 6809 that reads its own bytes ===================
   Needs the chapters 9–11 engine already on the page (Screen9, hand9, LAMP9, fly, blink9, secs9, CLK9, KEYVEC9, POLL_CYC9,
   keyCode9, keyName9, num9, codeLine9, SPEEDS9, TAIL9, stepText9) and the course helpers (svg, heb, mono, L, hex2, hex4, CHARS, FT, FM, sleep).
   New names end in 12.
   What is new here: the program is translated into the same bytes DREAM makes and put in memory from $2EE1 (where DREAM put it
   on our machine after CLEAR 200,12000). The processor really reads its commands from those bytes (so changing a byte changes
   the program), and JSR / RTS / PSHS / PULS really use the stack. Measured on our machine (DREAM, X): S = $2E05 when the program
   starts, and the plate DREAM put there says $6DD0 (where DREAM continues after your RTS).
   Memory: the screen, the program's own cells, the stack area and $A000/$A001 are simulated; other places stop with an explanation. */
const ORG12=0x2EE1, S0_12=0x2E05, BACK12=0x6DD0, STKLO12=0x2D00;
const RR12=['X','Y','U','S'], FINGER12={X:'#2f6fd0',Y:'#c0392b',U:'#8e44ad'};
const T12=(()=>{ const t={}, add=(op,m,c,cy)=>{ (t[op]=t[op]||{})[m]=[c,cy]; };
  [['LD',0x86],['ADD',0x8B],['SUB',0x80],['CMP',0x81],['AND',0x84]].forEach(([n,c])=>{
    add(n+'A','imm',c,2); add(n+'A','idx',c+0x20,4); add(n+'A','ext',c+0x30,5);
    add(n+'B','imm',c+0x40,2); add(n+'B','idx',c+0x60,4); add(n+'B','ext',c+0x70,5); });
  add('STA','idx',0xA7,4); add('STA','ext',0xB7,5); add('STB','idx',0xE7,4); add('STB','ext',0xF7,5);
  [['INCA',0x4C],['DECA',0x4A],['CLRA',0x4F],['INCB',0x5C],['DECB',0x5A],['CLRB',0x5F]].forEach(([o,c])=>add(o,'inh',c,2));
  [['INC',0x6C],['DEC',0x6A],['CLR',0x6F]].forEach(([o,c])=>{ add(o,'idx',c,6); add(o,'ext',c+0x10,7); });
  add('LDX','imm',0x8E,3); add('LDX','idx',0xAE,5); add('LDX','ext',0xBE,6);
  add('LDU','imm',0xCE,3); add('LDU','idx',0xEE,5); add('LDU','ext',0xFE,6);
  add('LDY','imm',0x108E,4); add('LDY','idx',0x10AE,6); add('LDY','ext',0x10BE,7);
  add('STX','idx',0xAF,5); add('STX','ext',0xBF,6); add('STU','idx',0xEF,5); add('STU','ext',0xFF,6);
  add('STY','idx',0x10AF,6); add('STY','ext',0x10BF,7);
  add('CMPX','imm',0x8C,4); add('CMPX','idx',0xAC,6); add('CMPX','ext',0xBC,7);
  add('CMPY','imm',0x108C,5); add('CMPY','idx',0x10AC,7); add('CMPY','ext',0x10BC,8);
  add('CMPU','imm',0x1183,5); add('CMPU','idx',0x11A3,7); add('CMPU','ext',0x11B3,8);
  add('LEAX','idx',0x30,4); add('LEAY','idx',0x31,4); add('LEAU','idx',0x33,4);
  [['BRA',0x20],['BHS',0x24],['BLO',0x25],['BNE',0x26],['BEQ',0x27]].forEach(([o,c])=>add(o,'rel',c,3)); add('BSR','rel',0x8D,7);
  add('JSR','idx',0xAD,7); add('JSR','ext',0xBD,8); add('RTS','inh',0x39,5); add('PSHS','stk',0x34,5); add('PULS','stk',0x35,5);
  return t; })();
const DEC12=(()=>{ const d={}; for(const op in T12) for(const m in T12[op]) d[T12[op][m][0]]={op,mode:m,cyc:T12[op][m][1]}; return d; })();
const WIDE12={LDX:'X',LDY:'Y',LDU:'U',CMPX:'X',CMPY:'Y',CMPU:'U',STX:'X',STY:'Y',STU:'U'};
const STKBIT12={A:0x02,B:0x04,X:0x10,Y:0x20,U:0x40};
const STKORD12=['U','Y','X','B','A'];           // push order (the 6809 pushes U first, A last; PULS takes them back the other way)
const isLbl12=t=>/^(@|[A-Z][A-Z0-9]{0,5})$/.test(t);
const opBytes12=c=>c>0xFF?[c>>8,c&255]:[c];
function idxCode12(P){ // the indexed postbyte (+ offset bytes) and the extra cycles, like DREAM
  const rr=RR12.indexOf(P.reg)<<5;
  if(P.post) return {b:[0x80|rr],x:2};
  if(P.acc) return {b:[(P.acc==='A'?0x86:0x85)|rr],x:1};
  if(!P.offText) return {b:[0x84|rr],x:0};
  const o=P.off;
  if(o>=-16&&o<=15) return {b:[rr|(o&31)],x:1};
  if(o>=-128&&o<=127) return {b:[0x88|rr,o&255],x:1};
  return {b:[0x89|rr,(o>>8)&255,o&255],x:4};
}
/* parts: {pre:[locked], user:[…], tail:'real'|'none', post:[locked, after the fixed ending]}, opt:{ops,userAt:'main'|'sub'} */
function asm12(parts,opt={}){
  const errs=[], labels={}, items=[];
  let user=(parts.user||[]).slice();
  const norm=user.map(l=>l.replace(/\s+/g,' ').trim().toUpperCase()); while(norm.length&&!norm[norm.length-1]){ norm.pop(); user.pop(); }
  const tl=TAIL9.map(l=>l.replace(/\s+/g,' ').trim());
  if(parts.tail==='real'&&norm.length>=4&&tl.every((t,i)=>norm[norm.length-4+i]===t)) user=user.slice(0,norm.length-4);
  const L0=(parts.pre||[]).map(t=>({t,k:'lock'})), U=user.map((t,i)=>({t,k:'user',n:i+1})), TL=parts.tail==='real'?TAIL9.map(t=>({t,k:'tail'})):[], P0=(parts.post||[]).map(t=>({t,k:'lock'}));
  const all=opt.userAt==='sub'?L0.concat(TL,U,P0):L0.concat(U,TL,P0);
  let addr=ORG12;
  all.forEach((ln,li)=>{
    const N=ln.k==='user'?'In line '+ln.n+': ':'In the locked line “'+ln.t.trim()+'”: ';
    const line=ln.t.replace(/\t/g,' ').replace(/\s+$/,'');
    if(!line.trim()||/^\s*\*/.test(line)) return;
    let label=null, rest=line;
    if(line[0]!==' '){
      const m=line.match(/^(\S+)\s*(.*)$/); label=m[1].toUpperCase(); rest=m[2];
      if((T12[label]||label==='FCB')&&!/^[A-Za-z]{3,4}\b/.test(rest)){ errs.push(N+'the line starts without a space, so DREAM will think '+L(label)+' is a <b>place name</b>, not a command. Add a space at the start of the line.'); return; }
      if(!isLbl12(label)){ errs.push(N+'the name '+L(label)+' does not fit. A place name is: a letter, then letters or digits, up to 6 characters, right at the start of the line.'); return; }
      if(label==='KEY'&&ln.k==='user'&&parts.tail==='real'){ errs.push(N+'the name KEY is already taken: it is the name of the fixed ending.'); return; }
      if(labels[label]!=null){ errs.push(N+'the name '+L(label)+' appears twice. Every place needs its own name.'); return; }
      labels[label]=addr;
      if(!rest.trim()){ errs.push(N+'after the name '+L(label)+' a command is missing on the same line.'); return; }
    }
    const m=rest.trim().match(/^([A-Za-z]+)\s*(.*)$/);
    if(!m){ errs.push(N+'I don’t understand this line.'); return; }
    const op=m[1].toUpperCase(), arg=m[2].trim().toUpperCase();
    const P={op,label,li,kind:ln.k,text:ln.t,argText:arg,addr,N};
    if(op==='FCB'){
      const vs=arg.split(',').map(x=>num9(x)); if(!arg||vs.some(v=>v==null||v<-128||v>255)){ errs.push(N+'after '+L('FCB')+' you write numbers from 0 to 255, for example '+L('FCB 0')+'.'); return; }
      P.mode='data'; P.data=vs.map(v=>v&255); P.len=vs.length; items.push(P); addr+=P.len; return;
    }
    const modes=T12[op];
    if(!modes||(opt.ops&&ln.k==='user'&&!opt.ops.includes(op))){ errs.push(N+(modes?'this puzzle doesn’t use '+L(op)+'.':'we haven’t learned '+L(op)+' yet (or is it a typing mistake?).')); return; }
    if(modes.inh){ if(arg){ errs.push(N+L(op)+' doesn’t need anything after it.'); return; } P.mode='inh'; }
    else if(!arg){ errs.push(N+'after '+L(op)+' there is a missing '+(modes.rel?'place name.':modes.stk?'drawer name, for example '+L(op+' A')+'.':'number.')); return; }
    else if(modes.rel){ if(!isLbl12(arg)){ errs.push(N+'after '+L(op)+' you write the name of a place in the program, for example '+L('LOOP')+'.'); return; } P.mode='rel'; P.target=arg; }
    else if(modes.stk){
      const rs=arg.split(',').map(x=>x.trim()); if(rs.some(r=>!STKBIT12[r])||new Set(rs).size!==rs.length){ errs.push(N+'after '+L(op)+' you write drawers: '+L('A')+', '+L('B')+', '+L('X')+', '+L('Y')+' or '+L('U')+', with a comma between them, for example '+L(op+' A,B')+'.'); return; }
      P.mode='stk'; P.regs=rs; P.pb=rs.reduce((s,r)=>s|STKBIT12[r],0);
    }
    else if(arg[0]==='#'){
      if(!modes.imm){ errs.push(N+(op[0]==='S'?L(op)+' never takes '+L('#')+'. It always writes to a house.':L(op)+' doesn’t work with '+L('#')+'.')); return; }
      const v=num9(arg.slice(1)); if(v==null){ errs.push(N+'I don’t understand the number '+L(arg.slice(1))+'.'); return; }
      if(WIDE12[op]){ if(v<0||v>65535){ errs.push(N+'the number is too big even for a wide drawer.'); return; } P.v=v; }
      else { if(v>255){ errs.push(N+'the number '+L(arg.slice(1))+' ('+v+') is too big for drawer '+op.slice(-1)+': only 0 to 255 fits.'); return; } if(v<-128){ errs.push(N+'the number is too small.'); return; } P.v=v&255; }
      P.mode='imm';
    }
    else if(arg.includes(',')){
      const mx=arg.match(/^(.*),\s*([XYUS])(\+?)$/);
      if(!mx){ errs.push(N+'after the comma comes a finger name: '+L(',X')+', '+L(',Y+')+' or, for example, '+L('32,U')+'.'); return; }
      if(!modes.idx){ errs.push(N+L(op)+' doesn’t work with a finger.'); return; }
      P.reg=mx[2]; P.post=!!mx[3]; P.off=0; P.offText=mx[1].trim();
      if(P.offText==='A'||P.offText==='B') P.acc=P.offText;
      else if(P.offText){ const o=num9(P.offText); if(o==null){ errs.push(N+'I don’t understand the '+L(P.offText)+' before the comma.'); return; } if(o<-32768||o>32767){ errs.push(N+'the move is too big.'); return; } P.off=o; }
      if(P.post&&(P.offText||op.startsWith('LEA'))){ errs.push(N+'with '+L('+')+' after the finger you write nothing before the comma. Either '+L(',X+')+', or, for example, '+L('1,X')+'.'); return; }
      if(op.startsWith('LEA')&&P.reg!==op[3]){ errs.push(N+L(op)+' moves the finger '+op[3]+'. Write, for example, '+L(op+' 1,'+op[3])+'.'); return; }
      P.mode='idx';
    }
    else {
      if(!modes.ext){ errs.push(N+(op.startsWith('LEA')?'with '+L(op)+' you write how far to move, then the finger name, for example '+L(op+' 32,'+op[3])+'.':L(op)+' needs something else here.')); return; }
      if(isLbl12(arg)&&!/^\$/.test(arg)) P.sym=arg;
      else { const a=num9(arg); if(a==null||a<0||a>0xFFFF){ errs.push(N+'I don’t understand the house number '+L(arg)+'.'); return; } if(a<0x100){ errs.push(N+'a house below '+L('$0100')+'? On this page we work with houses from '+L('$0400')+' upwards.'); return; } P.a=a; }
      P.mode='ext';
    }
    const [code,cyc]=modes[P.mode]; P.code=code; P.cyc=cyc; P.ob=opBytes12(code);
    if(P.mode==='idx'){ const ic=idxCode12(P); P.ib=ic.b; P.cyc+=ic.x; }
    P.len=P.ob.length+(P.mode==='inh'?0:P.mode==='imm'?(WIDE12[op]?2:1):P.mode==='ext'?2:P.mode==='idx'?P.ib.length:1);
    items.push(P); addr+=P.len;
  });
  const end=addr, mem=new Uint8Array(65536), known=new Uint8Array(65536);
  for(const P of items){
    let b;
    if(P.mode==='data') b=P.data;
    else { b=P.ob.slice();
      if(P.mode==='imm') b.push(...(WIDE12[P.op]?[P.v>>8,P.v&255]:[P.v]));
      else if(P.mode==='ext'){ if(P.sym){ if(labels[P.sym]==null){ errs.push(P.N+'there is no place called '+L(P.sym)+' in the program.'); continue; } P.a=labels[P.sym]; } b.push(P.a>>8,P.a&255); }
      else if(P.mode==='idx') b.push(...P.ib);
      else if(P.mode==='stk') b.push(P.pb);
      else if(P.mode==='rel'){ const t=labels[P.target]; if(t==null){ errs.push(P.N+'there is no place called '+L(P.target)+' in the program. (A place name is written right at the start of the line.)'); continue; }
        const d=t-(P.addr+2); if(d<-128||d>127){ errs.push(P.N+'the place '+L(P.target)+' is too far away: '+L(P.op)+' can only jump up to 128 houses back or 127 forward (here '+Math.abs(d)+'). DREAM would have answered with an error here.'); continue; }
        b.push(d&255); P.rel=d; }
    }
    P.bytes=b; b.forEach((v,k)=>{ mem[P.addr+k]=v; known[P.addr+k]=1; });
  }
  for(let a=0x400;a<0x600;a++){ mem[a]=0x60; known[a]=1; }
  mem[0xA000]=KEYVEC9>>8; mem[0xA001]=KEYVEC9&255; known[0xA000]=known[0xA001]=1;
  mem[S0_12]=BACK12>>8; mem[S0_12+1]=BACK12&255; known[S0_12]=known[S0_12+1]=1;
  const byAddr={}; items.forEach(P=>byAddr[P.addr]=P);
  const names={}; for(const k in labels) names[labels[k]]=k;
  return {items,labels,names,byAddr,errs,start:ORG12,end,mem,known,entry:labels['@']!=null?labels['@']:ORG12};
}
const sx16=v=>v>32767?v-65536:v, s8_12=v=>v>127?v-256:v;
/* read the command that sits at pc, from the bytes in memory */
function decode12(st,pc,img){
  const m=st.mem; let a=pc; let c=m[a++]; if(c===0x10||c===0x11) c=(c<<8)|m[a++];
  const d=DEC12[c]; if(!d) return {bad:true,code:c,pc};
  const P={op:d.op,mode:d.mode,cyc:d.cyc,addr:pc};
  if(d.mode==='imm'){ if(WIDE12[d.op]){ P.v=(m[a]<<8)|m[a+1]; a+=2; } else P.v=m[a++]; }
  else if(d.mode==='ext'){ P.a=(m[a]<<8)|m[a+1]; a+=2; }
  else if(d.mode==='rel'){ P.rel=s8_12(m[a++]); P.t=(a+P.rel)&0xFFFF; }
  else if(d.mode==='stk'){ P.pb=m[a++]; P.regs=STKORD12.filter(r=>P.pb&STKBIT12[r]).reverse(); if(P.pb&~0x76) return {bad:true,code:c,pc}; }
  else if(d.mode==='idx'){ const pb=m[a++]; P.reg=RR12[(pb>>5)&3]; P.off=0;
    if(!(pb&0x80)){ P.off=(pb&0x10)?(pb&31)-32:(pb&31); P.offText=String(P.off); P.cyc+=1; }
    else switch(pb&0x1F){
      case 0x00: P.post=true; P.cyc+=2; break; case 0x04: break; case 0x05: P.acc='B'; P.cyc+=1; break; case 0x06: P.acc='A'; P.cyc+=1; break;
      case 0x08: P.off=s8_12(m[a++]); P.offText=String(P.off); P.cyc+=1; break; case 0x09: P.off=sx16((m[a]<<8)|m[a+1]); a+=2; P.offText=String(P.off); P.cyc+=4; break;
      default: return {bad:true,code:c,pc}; }
  }
  P.len=a-pc;
  // the words: the line as the user wrote it when the bytes are still the same, else rebuilt from the bytes
  const src=img&&img.byAddr[pc];
  if(src&&src.mode!=='data'&&src.len===P.len&&src.bytes&&src.bytes.every((v,k)=>m[pc+k]===v)){ P.argText=src.argText; P.target=src.target; P.label=src.label; P.src=src; P.sym=src.sym; }
  else { const nm=x=>img&&img.names[x]!=null?img.names[x]:hex4(x);
    P.argText=d.mode==='imm'?'#'+(WIDE12[d.op]?hex4(P.v):hex2(P.v)):d.mode==='ext'?nm(P.a):d.mode==='rel'?nm(P.t):d.mode==='stk'?P.regs.join(','):d.mode==='idx'?(P.acc||(P.offText||''))+','+P.reg+(P.post?'+':''):'';
    if(d.mode==='rel') P.target=nm(P.t); if(img&&d.mode==='ext'&&img.names[P.a]) P.sym=img.names[P.a]; }
  if(d.mode==='rel'&&!P.target) P.target=hex4(P.t);
  return P;
}
function cpuNew12(img){ return {A:null,B:null,X:null,Y:null,U:null,S:S0_12,PC:img.entry,N:null,Z:null,V:null,C:null,
  mem:img.mem.slice(),known:img.known.slice(),steps:0,cyc:0,laps:0,done:false,key:null,plates:[{who:'dream',v:BACK12,n:2}]}; }
/* plates: a picture-list of what is on the stack, top first. The bytes themselves are in mem. */
function popBytes12(st,n){ // take n bytes off the picture; say what they were
  const took=[]; let left=n;
  while(left>0&&st.plates.length){ const p=st.plates[0]; if(p.n<=left){ took.push(p); left-=p.n; st.plates.shift(); } else { took.push({who:p.who,v:p.v,n:left,part:true}); p.n-=left; p.cut=true; left=0; } }
  return took;
}
function cpuStep12(st,img,io){
  const pc=st.PC, stop=m=>{ throw new CpuStop9(m); };
  const where=a=>a>=0x400&&a<=0x5ff?'(on the screen)':a>=img.start&&a<img.end?'(inside the program)':'';
  if(pc===BACK12){ st.done=true; return null; }
  if(!(pc>=img.start&&pc<img.end)) stop('The processor jumped to house '+L(hex4(pc))+'. That is not in our program, and not a return to DREAM. What is there? Numbers belonging to something else, and the processor will read them as if they were commands. On the Dragon this usually ends in a hang: the screen freezes, and the keys don’t help.');
  const p=decode12(st,pc,img);
  if(p.bad) stop('In house '+L(hex4(pc))+' there is '+L(p.code>0xFF?hex4(p.code):hex2(p.code))+'. The 6809 processor has many more commands we haven’t learned, and this is one of them (or it is not a command at all). On this page we stop here.');
  const ev={p,old:{A:st.A,B:st.B,X:st.X,Y:st.Y,U:st.U,S:st.S,N:st.N,Z:st.Z,V:st.V,C:st.C}};
  const need=r=>{ if(st[r]==null) stop(r==='A'||r==='B'?'Drawer '+r+' holds a number we don’t know (we haven’t put anything in it yet). On the Dragon you would get something random here.':'The finger '+r+' doesn’t point anywhere yet. First '+L('LD'+r+' #…')+'.'); };
  const rd=a=>{ a&=0xFFFF; if(!st.known[a]) stop('Reading from house '+L(hex4(a))+' ('+a+'): on this page you can only see the screen, the program itself and the pile of plates.'); return st.mem[a]; };
  const wr=(a,v)=>{ a&=0xFFFF; const ok=(a>=0x400&&a<=0x5ff)||(a>=img.start&&a<img.end)||(a>=STKLO12&&a<=S0_12+1);
    if(!ok) stop('Writing to house '+L(hex4(a))+' ('+a+'): it is not on the screen and not inside the program. On the Dragon this would write somewhere else in memory, and might spoil something.'); st.mem[a]=v&255; st.known[a]=1; };
  const ea=()=>{ if(p.mode==='ext') return p.a; need(p.reg); let o=p.off; if(p.acc){ need(p.acc); o=s8_12(st[p.acc]); } return (st[p.reg]+(p.post?0:o))&0xFFFF; };
  const nz=(r,w)=>{ st.N=!!(r&(w?0x8000:0x80)); st.Z=(r===0); };
  const post=()=>{ if(p.post) st[p.reg]=(st[p.reg]+1)&0xFFFF; };
  const opnd=()=>{ if(p.mode==='imm') return p.v; const a=ea(); ev.ea=a; const v=rd(a); post(); return v; };
  const opnd16=()=>{ if(p.mode==='imm') return p.v; const a=ea(); ev.ea=a; const v=(rd(a)<<8)|rd(a+1); return v; };
  const push=(v,who,n)=>{ if(n===2){ st.S=(st.S-1)&0xFFFF; wr(st.S,v&255); st.S=(st.S-1)&0xFFFF; wr(st.S,v>>8); } else { st.S=(st.S-1)&0xFFFF; wr(st.S,v); } st.plates.unshift({who,v,n}); };
  const pull=n=>{ let v=0; for(let k=0;k<n;k++){ v=(v<<8)|rd(st.S); st.S=(st.S+1)&0xFFFF; } return v; };
  let next=(pc+p.len)&0xFFFF;
  switch(p.op){
    case 'LDA': case 'LDB': { const r=p.op[2]; const v=opnd(); st[r]=v; nz(v); st.V=false; ev.v=v; break; }
    case 'STA': case 'STB': { const r=p.op[2]; need(r); const a=ea(); ev.ea=a; ev.prev=st.mem[a]; wr(a,st[r]); post(); nz(st[r]); st.V=false; break; }
    case 'ADDA': case 'ADDB': { const R=p.op[3]; need(R); const x=st[R], m=opnd(), r=x+m; st.V=!!((x^r)&(m^r)&0x80); st.C=r>255; ev.m=m; st[R]=r&255; nz(st[R]); break; }
    case 'SUBA': case 'SUBB': case 'CMPA': case 'CMPB': { const R=p.op[3]; need(R); const x=st[R], m=opnd(), r=(x-m)&255; st.C=x<m; st.V=!!((x^m)&(x^r)&0x80); ev.m=m; nz(r); if(p.op[0]==='S') st[R]=r; break; }
    case 'ANDA': case 'ANDB': { const R=p.op[3]; need(R); const m=opnd(); ev.m=m; ev.o=st[R]; st[R]&=m; nz(st[R]); st.V=false; break; }
    case 'INCA': case 'INCB': case 'DECA': case 'DECB': { const R=p.op[3], up=p.op[0]==='I'; need(R); const o=st[R]; st.V=up?o===0x7F:o===0x80; st[R]=(o+(up?1:255))&255; nz(st[R]); break; }
    case 'CLRA': case 'CLRB': { st[p.op[3]]=0; st.N=false; st.Z=true; st.V=false; st.C=false; break; }
    case 'INC': case 'DEC': case 'CLR': { const a=ea(); ev.ea=a; const o=p.op==='CLR'?0:rd(a); ev.prev=st.known[a]?st.mem[a]:null; const r=p.op==='CLR'?0:(o+(p.op==='INC'?1:255))&255; wr(a,r); post();
      if(p.op==='CLR'){ st.N=false; st.Z=true; st.V=false; st.C=false; } else { st.V=(p.op==='INC'?o===0x7F:o===0x80); nz(r); } break; }
    case 'LDX': case 'LDY': case 'LDU': { const R=p.op[2]; const v=opnd16(); st[R]=v; nz(v,1); st.V=false; ev.v=v; break; }
    case 'STX': case 'STY': case 'STU': { const R=p.op[2]; need(R); const a=ea(); ev.ea=a; wr(a,st[R]>>8); wr(a+1,st[R]); nz(st[R],1); st.V=false; break; }
    case 'CMPX': case 'CMPY': case 'CMPU': { const R=p.op[3]; need(R); const m=opnd16(), r=(st[R]-m)&0xFFFF; st.C=st[R]<m; st.V=!!((st[R]^m)&(st[R]^r)&0x8000); nz(r,1); ev.m=m; break; }
    case 'LEAX': case 'LEAY': case 'LEAU': { const R=p.op[3]; need(p.reg); let o=p.off; if(p.acc){ need(p.acc); o=s8_12(st[p.acc]); } ev.off=o; st[R]=(st[p.reg]+o)&0xFFFF; if(R!=='U') st.Z=(st[R]===0); break; }
    case 'JSR': case 'BSR': {
      const t=p.op==='BSR'?p.t:ea(); ev.to=t;
      if(t===KEYVEC9){ const k=io&&io.poll?io.poll():0; st.A=k&255; st.Z=(st.A===0); st.N=!!(st.A&0x80); st.V=false; ev.key=st.A; ev.kbd=true; st.cyc+=POLL_CYC9+5; break; }
      if(p.op==='JSR'&&p.mode==='idx'&&!(t>=img.start&&t<img.end)) stop('The finger '+p.reg+' points at '+L(hex4(t))+', not at the keyboard checker. '+L('JSR ,'+p.reg)+' would jump there, and the computer would probably hang. First '+L('LDX $A000')+'.');
      push(next,'ret',2); ev.ret=next; next=t; break; }
    case 'RTS': { const took=popBytes12(st,2); const t=pull(2); ev.took=took; ev.to=t; next=t;
      if(t===BACK12){ st.done=true; st.PC=t; st.cyc+=p.cyc; st.steps++; return ev; } break; }
    case 'PSHS': { for(const r of STKORD12) if(p.pb&STKBIT12[r]){ need(r); const w=r==='A'||r==='B'?1:2; push(st[r],r,w); st.cyc+=w; } break; }
    case 'PULS': { for(const r of STKORD12.slice().reverse()) if(p.pb&STKBIT12[r]){ const w=r==='A'||r==='B'?1:2; const took=popBytes12(st,w); (ev.took=ev.took||[]).push(...took); st[r]=pull(w); st.cyc+=w; } break; }
    default: { const f={BEQ:'Z',BNE:'Z',BLO:'C',BHS:'C'}[p.op];
      if(f&&st[f]==null) stop('Lamp '+f+' has not come on or gone off since the program started, so there is no way to know which way to turn.');
      const take=p.op==='BRA'||(p.op==='BEQ'&&st.Z)||(p.op==='BNE'&&!st.Z)||(p.op==='BLO'&&st.C)||(p.op==='BHS'&&!st.C);
      ev.take=take; if(take){ next=p.t; if(next<=pc){ st.laps++; ev.back=true; } } }
  }
  st.cyc+=p.cyc; st.steps++; st.PC=next; return ev;
}
/* headless run. keys: one per two checks (as in chapters 10–11). keysAt: [[seconds,key],…] — a key that is pressed at that moment
   of Dragon time and waits for the next check (used to compare with the machine, where keys were pressed at known times). */
function cpuRun12(img,o={}){
  const st=cpuNew12(img); const keys=(o.keys||[]).map(keyCode9), at=(o.keysAt||[]).map(([s,k])=>[s*CLK9,keyCode9(k)]); let polls=0, waiting=false;
  const io={poll:()=>{ polls++;
    if(o.keysAt){ if(at.length&&st.cyc>=at[0][0]) return at.shift()[1]; if(!at.length&&st.cyc>(o.waitEnd||0)*CLK9) waiting=true; return 0; }
    if(polls%2===0&&keys.length) return keys.shift(); if(!keys.length&&polls>2) waiting=true; return 0; }};
  const limit=o.limit||20000000;
  try{
    while(!st.done){
      if(st.steps>=limit) return {st,err:'The program ran '+limit.toLocaleString()+' steps and did not finish. Maybe a loop without end?'};
      const atKey=img.labels.KEY!=null&&st.PC===img.labels.KEY;
      if(waiting&&atKey) return {st,err:null,waiting:true,keysLeft:keys.length+at.length};
      if(!cpuStep12(st,img,io)) break;
    }
    return {st,err:null,keysLeft:keys.length+at.length,back:true};
  }catch(e){ if(e instanceof CpuStop9) return {st,err:e.message}; throw e; }
}
/* screen 512 bytes out of the 64K */
const scr12=st=>st.mem.subarray(0x400,0x600);

/* ---------------- pictures: the CPU box (A B, then the fingers X Y U two by two, then lamps) ---------------- */
function cpuBox12(show){
  const wide=show.wide||[], lamps=show.lamps||[], rows=Math.ceil(wide.length/2);
  const H=40+74+rows*84+(lamps.length?72:0)+8;
  let s=`<rect x="6" y="6" width="308" height="${H-12}" rx="16" fill="#3b4048" stroke="#22252a" stroke-width="3"/>
  <rect x="20" y="16" width="280" height="24" rx="6" fill="#2a2e34"/><text x="160" y="33" text-anchor="middle" ${FT} font-size="13.5" fill="#cfd6df" direction="ltr">The 6809 processor</text>`;
  const small=(x,r,col)=>`<g class="drawer${r}"><rect x="${x}" y="50" width="136" height="66" rx="8" fill="#c99a5b" stroke="#7a5428" stroke-width="3"/><rect x="${x+45}" y="108" width="46" height="6" rx="3" fill="#7a5428"/>
   <circle cx="${x+18}" cy="68" r="12" fill="${col}"/><text x="${x+18}" y="74" text-anchor="middle" ${FM} font-size="15" font-weight="700" fill="#222">${r}</text>
   <rect class="${r.toLowerCase()}val-bg" x="${x+34}" y="57" width="94" height="44" rx="5" fill="#2f3a2c"/>
   <text class="${r.toLowerCase()}val" x="${x+81}" y="84" text-anchor="middle" ${FM} font-size="20" fill="#f1f1e6">?</text>
   <text class="${r.toLowerCase()}dec" x="${x+81}" y="97" text-anchor="middle" ${FM} font-size="9.5" fill="#b9c8b0"></text></g>`;
  s+=small(18,'A','#ffd23f');
  s+=show.b?small(166,'B','#7fe0a0'):`<path d="M166 50 Q200 44 236 52 Q272 46 302 54 L302 116 Q268 110 232 118 Q196 112 166 118 Z" fill="#8c7aa8" stroke="#5e4f78" stroke-width="2"/>`+heb(234,90,'More drawers under the cloth',11.5,'#fff');
  let y=124;
  wide.forEach((r,k)=>{ const x=k%2?166:18; if(k&&k%2===0) y+=84;
    s+=`<g class="drawer${r}"><rect x="${x}" y="${y}" width="136" height="72" rx="8" fill="#b7895a" stroke="#6e4a22" stroke-width="3"/>
     <circle cx="${x+18}" cy="${y+18}" r="12" fill="${FINGER12[r]}"/><text x="${x+18}" y="${y+24}" text-anchor="middle" ${FM} font-size="15" font-weight="700" fill="#fff">${r}</text>
     <rect class="${r.toLowerCase()}val-bg" x="${x+36}" y="${y+7}" width="92" height="44" rx="5" fill="#2f3a2c"/>
     <text class="${r.toLowerCase()}val" x="${x+82}" y="${y+34}" text-anchor="middle" ${FM} font-size="19" fill="#f1f1e6">?</text>
     <text class="${r.toLowerCase()}dec" x="${x+82}" y="${y+47}" text-anchor="middle" ${FM} font-size="9.5" fill="#b9c8b0"></text>
     ${hand9(x+18,y+66,0.36,FINGER12[r])}<text class="${r.toLowerCase()}what" x="${x+82}" y="${y+65}" text-anchor="middle" ${FT} font-size="10" fill="#f6e7c8" direction="ltr"></text></g>`; });
  if(wide.length) y+=84;
  if(lamps.length){
    s+=`<rect x="20" y="${y}" width="280" height="62" rx="10" fill="#23262b"/>`;
    const gap=280/lamps.length;
    lamps.forEach((f,k)=>{ const cx=20+gap*k+gap/2;
      s+=`<g class="lamp lamp${f}"><circle class="bulb" cx="${cx}" cy="${y+22}" r="12" fill="#4a4f57" stroke="#15171a" stroke-width="2"/>
      <text class="lq" x="${cx}" y="${y+27}" text-anchor="middle" ${FM} font-size="12" font-weight="700" fill="#cfd6df">?</text>
      <text x="${cx-19}" y="${y+27}" text-anchor="end" ${FM} font-size="14" font-weight="700" fill="#ffd23f">${f}</text>
      <text x="${cx}" y="${y+52}" text-anchor="middle" ${FT} font-size="10.5" fill="#aab3bd" direction="ltr">${LAMP9[f]}</text></g>`; });
  }
  return {s,H};
}
function paintCpu12(root,st,show,img){
  const q=s=>root.querySelector(s);
  const small=r=>{ const v=st[r]; q('.'+r.toLowerCase()+'val').textContent=v==null?'?':hex2(v); q('.'+r.toLowerCase()+'dec').textContent=v==null?'':v+(r==='B'&&v>127?' / '+(v-256):'')+(v>=0x40&&v<0x5b?'  '+CHARS[v&63]:''); };
  small('A'); if(show.b) small('B');
  (show.wide||[]).forEach(r=>{ const v=st[r], l=r.toLowerCase(); q('.'+l+'val').textContent=v==null?'?':hex4(v); q('.'+l+'dec').textContent=v==null?'':String(v);
    q('.'+l+'what').textContent=v==null?'':(v===KEYVEC9?'the keyboard checker':(v>=0x400&&v<=0x5ff?'row '+((v-0x400)>>5)+', column '+((v-0x400)&31):(img&&img.names[v]?'house '+img.names[v]:''))); });
  (show.lamps||[]).forEach(f=>{ const g=q('.lamp'+f); if(!g) return; const v=st[f]; const b=g.querySelector('.bulb');
    b.setAttribute('fill',v==null?'#4a4f57':(v?'#ffb020':'#1b1d21')); b.style.filter=v?'drop-shadow(0 0 6px #ffb020)':''; g.querySelector('.lq').textContent=v==null?'?':''; });
}
/* the pile of plates (the stack). top plate first. S = the hand that holds the top plate */
function plateName12(p){ // {he: Hebrew words, lt: number (left to right)}
  if(p.who==='dream') return {he:'Back to DREAM',lt:''};
  if(p.who==='ret') return {he:'Back to house',lt:hex4(p.v)};
  return {he:'',lt:p.who+' = '+(p.n===2?hex4(p.v):hex2(p.v))};
}
function plateTxt12(cx,y,nm,size,col){ // words on the left, the number on the right (English reading order)
  if(nm.he&&nm.lt) return heb(cx-34,y,nm.he,size,col,700)+mono(cx+46,y,nm.lt,size,col,'middle',700);
  return nm.he?heb(cx,y,nm.he,size,col,700):mono(cx,y,nm.lt,size,col,'middle',700);
}
function stackSvg12(st,img,o={}){
  const W=300, plates=st.plates.slice(0,6), more=st.plates.length-plates.length;
  const ph=p=>p.n===2?34:22; let H=78+plates.reduce((s,p)=>s+ph(p)+6,0)+(more?18:0)+24;
  let s=`<rect x="4" y="4" width="${W-8}" height="${H-8}" rx="14" fill="#2b2f36" stroke="#1b1e22" stroke-width="2"/>`+heb(W/2,26,'The pile of plates (the stack)',13,'#cfd6df',700);
  let y=58;
  // the hand S on top
  s+=`<g transform="translate(46,${y+4}) rotate(90)">${hand9(0,0,0.42,'#e67e22')}</g>`;
  s+=mono(20,y-10,'S',15,'#ffd23f','middle',700)+mono(W-14,y-10,'S = '+hex4(st.S),12.5,'#ffd23f','end',700);
  plates.forEach((p,k)=>{ const h=ph(p), mine=p.who!=='dream', col=p.who==='ret'?'#f3e7c6':p.who==='dream'?'#9aa3ad':'#cde8ff';
    s+=`<rect x="60" y="${y}" width="${W-80}" height="${h}" rx="${h/2}" fill="${col}" stroke="${p.cut?'#c0392b':'#5d646d'}" stroke-width="${p.cut?3:2}" ${p.cut?'stroke-dasharray="6 4"':''}/>`;
    s+=plateTxt12(W/2+10,y+h/2+(p.n===2?-2:4.5),plateName12(p),12,'#222');
    if(p.n===2) s+=mono(W/2+10,y+h-5,hex2(p.v>>8)+' '+hex2(p.v&255),10,'#555');
    y+=h+6; });
  if(more){ s+=heb(W/2,y+8,'and '+more+' more below',11,'#aab3bd'); y+=18; }
  s+=`<rect x="44" y="${y}" width="${W-48}" height="8" rx="3" fill="#6b5a45"/>`;
  return svg(W,H,s,300);
}
/* the program's memory: rows of 8 bytes. groups = commands (alternating colours). PC = an orange frame + "PC" tag */
function memHtml12(st,img,o={}){
  const from=img.start, to=Math.max(img.end,from+1), rows=[]; const grp={}; let g=0;
  img.items.forEach(P=>{ for(let k=0;k<P.len;k++) grp[P.addr+k]=g+(P.mode==='data'?1000:0); g++; });
  for(let a=from&~7;a<to;a+=8){
    let r=`<div class="m12row"><span class="m12a ltr">${hex4(a)}</span>`;
    for(let k=0;k<8;k++){ const x=a+k; if(x<from||x>=to){ r+='<span class="m12c m12x"></span>'; continue; }
      const v=st.mem[x], cls=['m12c', grp[x]>=1000?'m12d':(grp[x]%2?'m12o':'m12e')];
      if(o.changed&&o.changed.has(x)) cls.push('m12ch'); if(x===st.PC&&!o.noPC) cls.push('m12pc');
      r+=`<button class="${cls.join(' ')}" data-a="${x}" ${o.edit?'':'tabindex="-1"'} title="${hex4(x)}">${hex2(v).slice(1)}</button>`; }
    rows.push(r+'</div>'); }
  return rows.join('');
}
/* ---------------- what each command did, in words (chapters 12+) ---------------- */
function stepText12(ev,st,img,show){
  const p=ev.p, o=ev.old, head=L(p.op+(p.argText?' '+p.argText:''))+': ';
  const nm=v=>L(hex2(v))+' ('+v+(v>=0x40&&v<0x5b?', '+CHARS[v&63]:'')+')';
  const cell=a=>img.names[a]&&!(a>=0x400&&a<0x600)?'in the house <b class="ltr">'+img.names[a]+'</b> ('+L(hex4(a))+', inside the program)':null;
  const plate=t=>t.map(x=>x.who==='ret'||x.who==='dream'?(x.part?'half of the return plate ('+L(hex2(x.v>>8))+')':(x.who==='dream'?'DREAM’s plate':'the plate “Back to house '+L(hex4(x.v))+'”')):(x.part?'half of '+x.who+'’s plate':x.who+'’s plate ('+L(x.n===2?hex4(x.v):hex2(x.v))+')')).join(' and ');
  let t=null;
  switch(p.op){
    case 'JSR': case 'BSR':
      if(ev.kbd){ t='Go to the keyboard checker and come back (it is a subroutine too: a plate went on, and came off when it returned). '+(ev.key?'A key was pressed! Drawer A holds its code: '+L(hex2(ev.key))+' ('+keyName9(ev.key)+'), and lamp Z is <b>off</b>.':'No key was pressed: A holds '+L('$00')+', and lamp Z is <b>on</b>.'); break; }
      t='Put a plate on the pile: “Back to house '+L(hex4(ev.ret))+'” (the house of the line after the JSR). S goes down by 2, to '+L(hex4(st.S))+'. Now jump to '+L(img.names[ev.to]||hex4(ev.to))+'.'; break;
    case 'RTS': {
      const ok=ev.took.length===1&&!ev.took[0].part;
      if(ok&&ev.to===BACK12) t='Take the top plate: DREAM’s plate. The program has ended, and we go back to DREAM.';
      else if(ok) t='Take the top plate: “Back to house '+L(hex4(ev.to))+'”. S goes up by 2, to '+L(hex4(st.S))+'. We go back to the line after the JSR.';
      else t='RTS always takes <b>two houses</b> from the top of the pile, and trusts them to be a return address. But on top there was '+plate(ev.took)+'. Together they make '+L(hex4(ev.to))+', and that is where the processor jumps.';
      break; }
    case 'PSHS': t='Put on the pile a copy of '+p.regs.map(r=>r+' ('+L(r==='A'||r==='B'?hex2(st[r]):hex4(st[r]))+')').join(' and of ')+'. The drawer itself doesn’t change. S goes down to '+L(hex4(st.S))+'.'; break;
    case 'PULS': t='Take from the top of the pile '+plate(ev.took)+', and put it '+(p.regs.length>1?'in drawers '+p.regs.join(' and '):'in drawer '+p.regs[0])+': '+p.regs.map(r=>r+' = '+L(r==='A'||r==='B'?hex2(st[r]):hex4(st[r]))).join(', ')+'. S goes up to '+L(hex4(st.S))+'. The lamps don’t change.'; break;
    case 'ANDA': case 'ANDB': { const R=p.op[3]; t=(ev.m===31?'Cut '+R+' down to a number from 0 to 31: keep only what is left after taking away 32 again and again. ':'Keep in '+R+' only the lamps that are also on in '+L(hex2(ev.m))+'. ')+ev.o+' → '+st[R]+'.'; break; }
    case 'ADDB': t=L(hex2(o.B))+' plus '+L(hex2(ev.m))+' = '+L(hex2(st.B))+(st.C?'. The wheel went over: lamp C comes on.':'.'); break;
    case 'SUBB': t=L(hex2(o.B))+' minus '+L(hex2(ev.m))+' = '+L(hex2(st.B))+'.'; break;
    case 'LDU': t='Put '+L(hex4(st.U))+' in drawer U. The purple finger now points at this house'+(st.U>=0x400&&st.U<=0x5ff?' (row '+((st.U-0x400)>>5)+', column '+((st.U-0x400)&31)+').':'.'); break;
    case 'CMPU': t='Compare U ('+L(hex4(st.U))+') with '+L(hex4(ev.m))+'. '+(st.Z?'<b>Equal</b>: lamp Z comes on.':(st.C?'U is still <b>smaller</b> (lamp C is on).':'U is <b>bigger or equal</b> (lamp C is off).')); break;
    case 'LEAU': { const d=ev.off; t='Move the finger U '+(p.acc?'by what is in drawer '+p.acc+' ('+d+')':d===32?'one row down':d===1?'one step right':(d>=0?'forward ':'back ')+Math.abs(d))+': '+L(hex4(o.U))+' → '+L(hex4(st.U))+'.'; break; }
    case 'CLR': t='Put 0 '+(cell(ev.ea)||'in house '+L(hex4(ev.ea)))+'.'; break;
    case 'STX': case 'STY': case 'STU': t='Write '+p.op[2]+' ('+L(hex4(st[p.op[2]]))+') into two houses: '+L(hex4(ev.ea))+' and '+L(hex4(ev.ea+1))+'.'; break;
  }
  if(t==null&&p.mode==='ext'&&cell(ev.ea)){
    const c=cell(ev.ea);
    if(p.op==='LDA'||p.op==='LDB') t='Copy what is written '+c+': '+nm(st[p.op[2]])+', and put it in drawer '+p.op[2]+'.';
    else if(p.op==='STA'||p.op==='STB') t='Write what is in drawer '+p.op[2]+' ('+L(hex2(st[p.op[2]]))+') '+c+'.';
    else if(p.op==='INC'||p.op==='DEC') t=(p.op==='INC'?'Add 1 to':'Take 1 from')+' the number '+c+': '+L(hex2(ev.prev))+' → '+L(hex2(st.mem[ev.ea]))+'. '+(p.op==='DEC'?(st.Z?'We reached 0: lamp Z <b>comes on</b>.':'Not 0 yet: lamp Z is off.'):'');
  }
  if(t!=null) return head+t;
  return stepText9(ev,st,show);
}

/* ---------------- program window (chapters 12+) ----------------
   cfg: title, lines (the program), sub (lines after the fixed ending: subroutines, cells), tail:'real'|'none',
        show:{b, wide:['X','Y','U'], lamps, stack, mem, listing, edit}, keys, predict, gap(+gapq), variants(+varq), speed, onWin, onEnd(st,w) */
function progWindow12(host,cfg){
  const show=Object.assign({lamps:['Z'],wide:['X']},cfg.show||{}), tail=cfg.tail||'real', variants=cfg.variants||null;
  const box=cpuBox12(show);
  host.innerHTML=`<div class="prog p9 p12" tabindex="0"><div class="prog-title"><span>${cfg.title}</span><span>✓ Checked in DREAM on our Dragon machine</span></div>
    ${cfg.predict?'<div class="predict"><div class="q">🤔 Guess first: '+cfg.predict.q+'</div><div class="opts"></div><div class="fb pfb"></div></div>':''}
    ${cfg.gap?'<div class="gapopts"><div class="q">'+(cfg.gapq||'Which line is missing?')+'</div><div class="opts gopts"></div><div class="fb gfb"></div></div>':''}
    ${variants?'<div class="variants"><div class="q">'+(cfg.varq||'Choose:')+'</div><div class="opts vopts"></div></div>':''}
    <div class="prog-body"><ol class="code${show.listing?' lst12':''}"></ol><div class="cpu">${svg(320,box.H,box.s,300)}</div>
      ${show.stack?'<div class="stk12"></div>':''}
      ${show.mem?'<div class="mem12"><div class="m12h"></div><div class="m12g"></div>'+(show.edit?'<div class="m12e-say soft">Click a number to change it (two digits, for example <span class="ltr">AF</span>).</div>':'')+'</div>':''}
      <div class="scr-cell"><div class="scr"></div>${cfg.keys?'<div class="keypad9"><span class="kp-l">The keyboard:</span></div>':''}</div></div>
    <div class="stepsay"><div class="box"></div></div>
    <div class="ctrls"><button class="btn st">Step ▶</button><button class="btn ghost run">Run ▶▶</button><button class="btn ghost rs">From the start ↺</button><button class="btn ghost skip" hidden>⏩ Skip the wait</button>${show.edit?'<button class="btn ghost orig" hidden>Put back the original numbers</button>':''}
      <label class="spd9">Speed: <input type="range" min="0" max="4" step="1" value="${cfg.speed!=null?cfg.speed:1}"><span class="spdn"></span></label></div>
    <div class="clock9"></div></div>`;
  const P=host.querySelector('.prog'), pfb=P.querySelector('.pfb')||document.createElement('div'), ol=P.querySelector('ol.code'), sayb=P.querySelector('.stepsay .box'), cpuEl=P.querySelector('.cpu'), clk=P.querySelector('.clock9');
  const stk=P.querySelector('.stk12'), memEl=P.querySelector('.m12g'), memH=P.querySelector('.m12h');
  const sc=new Screen9(P.querySelector('.scr'),{labels:true,hexcols:true,interactive:!!(cfg.predict&&cfg.predict.cell),onClick:i=>pickCell(i),onHover:()=>{}});
  const btnS=P.querySelector('.st'), btnR=P.querySelector('.run'), btnK=P.querySelector('.skip'), btnO=P.querySelector('.orig'), rng=P.querySelector('input[type=range]'), spdn=P.querySelector('.spdn');
  let lines=(variants?variants[0].lines:cfg.lines).slice(), sub=(variants&&variants[0].sub||cfg.sub||[]).slice(), guess=null, busy=false, gapOk=!cfg.gap, stopped=false, ended=false, running=false, st, img, edits={};
  sendBtn(P,host,cfg,()=>({lines,sub,tail,edits}));
  const io={poll:()=>{ const k=st.key; st.key=null; showKey(); return k||0; }};
  const w={get st(){ return st; }, get img(){ return img; }, edits, P};
  function build(){ img=asm12({pre:lines.filter(l=>l!=null),tail,post:sub}); if(img.errs.length) console.warn(cfg.title,img.errs);
    for(const a in edits){ img.mem[a]=edits[a]; } }
  function renderCode(){
    ol.innerHTML='';
    const rows=[]; lines.forEach(l=>rows.push(l===null?{gap:true}:{t:l})); if(tail==='real') TAIL9.forEach(t=>rows.push({t,tl:true})); sub.forEach(t=>rows.push({t,sub:true}));
    let k=0; const its=img.items;
    rows.forEach(r=>{ const li=document.createElement('li');
      if(r.gap){ li.className='gap'; li.textContent='  ???'; ol.appendChild(li); return; }
      if(!r.t.trim()){ ol.appendChild(li); return; }
      const P=its[k++]; li.innerHTML=(show.listing&&P?'<span class="ad12">'+hex4(P.addr).slice(1)+'</span><span class="by12">'+(P.bytes||[]).map(v=>hex2(v).slice(1)).join('')+'</span>':'')+codeLine9(r.t);
      if(P){ li.dataset.a=P.addr; } if(r.tl) li.classList.add('tl9'); if(r.sub) li.classList.add('sub12'); ol.appendChild(li); });
    curLine();
  }
  let tailSaid=false;
  const inTail=()=>tail==='real'&&img.labels.KEY!=null&&st.PC>=img.labels.KEY&&st.PC<img.labels.KEY+8;
  function curLine(){ ol.querySelectorAll('li.cur').forEach(x=>x.classList.remove('cur')); if(!st||ended) return; const li=ol.querySelector('li[data-a="'+st.PC+'"]'); if(li) li.classList.add('cur'); }
  function fingers(){ const f=[]; (show.wide||[]).forEach(r=>{ if(st[r]!=null&&st[r]>=0x400&&st[r]<=0x5ff) f.push({i:st[r]-0x400,col:FINGER12[r]}); }); return f; }
  function paint(){ paintCpu12(cpuEl,st,show,img); sc.mem.set(scr12(st)); sc.fingers=fingers(); sc.draw(); clock(); if(stk) stk.innerHTML=stackSvg12(st,img); if(memEl) paintMem(); skipBtn(); }
  function paintMem(){ const ch=new Set(Object.keys(edits).map(Number)); memEl.innerHTML=memHtml12(st,img,{edit:show.edit,changed:ch,noPC:ended});
    memH.innerHTML='The program’s memory, from '+L(hex4(img.start))+' to '+L(hex4(img.end-1))+': <b>'+(img.end-img.start)+' houses</b>. '+(ended?'':'<b>PC</b> = '+L(hex4(st.PC))+' (the orange frame): the processor will read the next command from there.')+(ch.size?' <span class="chg12">You changed '+ch.size+' '+(ch.size===1?'number':'numbers')+'.</span>':''); }
  function clock(){ clk.innerHTML='⏱ Time gone by on the Dragon so far: <b>'+secs9(st.cyc)+'</b> <span class="soft">('+st.cyc.toLocaleString()+' clock ticks)</span> · commands: <b>'+st.steps.toLocaleString()+'</b> · jumps back: <b>'+st.laps.toLocaleString()+'</b>'; }
  function delayAt(){ const isD=a=>{ const p=img.byAddr[a]; if(!p||!/^LEA[XY]$/.test(p.op)||p.off!==-1||p.acc||st.mem[a]!==p.bytes[0]) return false; const b=img.byAddr[a+p.len]; return b&&b.op==='BNE'&&img.labels[b.target]===a; };
    if(isD(st.PC)) return st.PC; const prev=img.items.find(p=>p.addr+p.len===st.PC); if(prev&&isD(prev.addr)) return prev.addr; return null; }
  function skipBtn(){ const d=delayAt(); btnK.hidden=!(d!=null&&!ended&&!stopped&&!running&&(st[img.byAddr[d].op[3]]||0)>2); }
  function showKey(){ const e=P.querySelector('.kp-wait'); if(e) e.innerHTML=st.key?'Key waiting: <b class="ltr">'+keyName9(st.key)+'</b> (the processor will see it at the next check)':''; }
  function reset(){ running=false; tailSaid=false; revealed=false; build(); st=cpuNew12(img); stopped=false; ended=false; renderCode(); paint(); showKey();
    if(btnO) btnO.hidden=!Object.keys(edits).length;
    sayb.innerHTML=lines.includes(null)?'First choose the missing line.':(img.errs.length?'⚠️ '+img.errs[0]:'The screen is clean, as in DREAM before a run. Drawers we haven’t put anything in show “?”. Press <b>Step</b>, or <b>Run</b>.'); lock(); }
  function lock(){ const need=(cfg.predict&&guess==null)||!gapOk||img.errs.length; const fin=ended||stopped; btnS.disabled=!!need||busy||fin||running; btnR.disabled=!!need||fin&&!running; btnR.textContent=running?'Stop ⏸':'Run ▶▶';
    if(need&&cfg.predict&&guess==null) sayb.innerHTML='👆 Guess first, then we run.'; skipBtn(); }
  function finish(msg){ ended=true; running=false; sayb.innerHTML=msg; curLine(); paint(); lock(); reveal(); if(cfg.onEnd) cfg.onEnd(st,w); }
  const endMsg=()=>'<b class="ltr">RTS</b> took DREAM’s plate: the program has ended, and we go back to DREAM. In DREAM the editor would redraw itself on the screen.';
  function exec(){ if(st.done){ finish(endMsg()); return null; }
    try{ const ev=cpuStep12(st,img,io); if(!ev){ finish(endMsg()); return null; } return ev; }
    catch(e){ if(!(e instanceof CpuStop9)) throw e; const li=ol.querySelector('li[data-a="'+st.PC+'"]'); if(li) li.style.background='#5a1d18'; sayb.innerHTML='⚠️ '+e.message; stopped=true; running=false; paint(); lock(); reveal(); if(cfg.onEnd) cfg.onEnd(st,w,true); return null; } }
  const R=r=>{ const e=P.querySelector('.'+r+'val-bg'); return (e||cpuEl).getBoundingClientRect(); };
  const stkR=()=>{ const e=stk&&stk.querySelector('svg'); return e?e.getBoundingClientRect():null; };
  async function step(quick){
    if(busy) return; busy=true; lock();
    const li=ol.querySelector('li[data-a="'+st.PC+'"]'); const fr=li?li.getBoundingClientRect():null;
    const ev=exec(); if(!ev){ busy=false; lock(); return; }
    const p=ev.p;
    if(!quick&&fr){
      const sR=stkR();
      if((p.op==='LDA'||p.op==='LDB')&&p.mode==='imm') await fly(fr,R(p.op[2].toLowerCase()),hex2(st[p.op[2]]));
      else if((p.op==='LDA'||p.op==='LDB')&&ev.ea>=0x400&&ev.ea<0x600) await fly(sc.cellRect(ev.ea-0x400),R(p.op[2].toLowerCase()),hex2(st[p.op[2]]));
      else if((p.op==='STA'||p.op==='STB')&&ev.ea>=0x400&&ev.ea<0x600) await fly(R(p.op[2].toLowerCase()),sc.cellRect(ev.ea-0x400),hex2(st[p.op[2]]));
      else if(/^LD[XYU]$/.test(p.op)&&p.mode==='imm') await fly(fr,R(p.op[2].toLowerCase()),hex4(st[p.op[2]]));
      else if(p.op==='JSR'&&ev.kbd) await fly(R('x'),R('a'),ev.key?keyName9(ev.key):'0');
      else if((p.op==='JSR'||p.op==='BSR')&&sR) await fly(fr,sR,'↩ '+hex4(ev.ret));
      else if(p.op==='RTS'&&sR){ const to=ol.querySelector('li[data-a="'+ev.to+'"]'); await fly(sR,to?to.getBoundingClientRect():fr,hex4(ev.to)); }
      else if(p.op==='PSHS'&&sR) await fly(R(p.regs[0].toLowerCase())||fr,sR,p.regs.map(r=>r==='A'||r==='B'?hex2(st[r]):hex4(st[r])).join(' '));
      else if(p.op==='PULS'&&sR) await fly(sR,R(p.regs[0].toLowerCase())||fr,p.regs.map(r=>r==='A'||r==='B'?hex2(st[r]):hex4(st[r])).join(' '));
    }
    paint(); if(!quick){ const d=P.querySelector('.drawer'+(p.op.match(/^(LD|ST|CMP|LEA)([XYU])$/)||p.op.match(/^(LEA)([XYU])/)||[])[2]); blink9(d||P.querySelector('.drawer'+(/B$/.test(p.op)?'B':'A'))); }
    sayb.innerHTML=stepText12(ev,st,img,show);
    curLine(); busy=false; lock();
    if(img.labels.KEY!=null&&st.PC===img.labels.KEY&&!tailSaid&&tail==='real'){ tailSaid=true; sayb.innerHTML+='<br>➜ Now the fixed ending starts: it will wait for a key.'; reveal(); if(cfg.onEnd) cfg.onEnd(st,w); }
    if(st.done) finish(endMsg());
  }
  async function run(){
    if(running){ running=false; lock(); return; }
    running=true; lock();
    const sp=SPEEDS9[+rng.value];
    if(sp.real){ let last=performance.now(), budget=0;
      sayb.innerHTML='Running at the Dragon’s speed: about 890,000 clock ticks a second.'+(cfg.keys?' Press the keys under the screen (or on your own keyboard, when the window is selected).':'');
      while(running&&!ended&&!stopped){
        await new Promise(r=>requestAnimationFrame(r)); const now=performance.now(); budget+=Math.min(60,now-last)*CLK9/1000; last=now;
        const c0=st.cyc; while(running&&st.cyc-c0<budget&&!ended&&!stopped){ if(!exec()) break; }
        budget-=st.cyc-c0; if(!ended&&!stopped){ paint(); curLine(); if(inTail()&&!tailSaid){ tailSaid=true; sayb.innerHTML='We reached <b>KEY</b>, the fixed ending: the program asks the keyboard again and again, and waits. Look at the screen, then press a key (below) to go back to DREAM.'; reveal(); if(cfg.onEnd) cfg.onEnd(st,w); } }
      }
      if(!ended&&!stopped) sayb.innerHTML='We stopped in the middle. You can go on step by step, or run again.';
    } else {
      while(running&&!ended&&!stopped){ const t0=performance.now(); await step(sp.ms<1000); const w=sp.ms-(performance.now()-t0); if(w>0) await sleep(w); }
    }
    running=false; lock();
  }
  async function skip(){ const d=delayAt(); if(d==null) return; const p=img.byAddr[d], Rg=p.op[3], n0=st[Rg], bne=img.byAddr[d+p.len];
    while(!ended&&!stopped&&(st.PC===d||st.PC===bne.addr)){ if(!exec()) break; }
    paint(); curLine(); sayb.innerHTML='⏩ We skipped: the processor counted down '+n0.toLocaleString()+' times ('+(2*n0).toLocaleString()+' commands), until the finger '+Rg+' reached 0. That took it '+secs9(n0*(p.cyc+bne.cyc))+'.'; lock(); }
  function pickCell(i){ if(!cfg.predict||!cfg.predict.cell||st.steps>0) return; guess=i; sc.marks={}; sc.marks[i]='#ff9b2f'; sc.draw(); pfb.className='fb pfb'; pfb.innerHTML='Your guess is marked with an orange frame (house '+L(hex4(0x400+i))+'). Now run.'; lock(); sayb.innerHTML='Good. Now press <b>Step</b> or <b>Run</b>.'; }
  let revealed=false;
  function reveal(){ if(!cfg.predict||guess==null||revealed) return; revealed=true; const right=cfg.predict.cell?cfg.predict.check(guess):guess===cfg.predict.a;
    pfb.className='fb pfb '+(right?'ok':'no'); pfb.innerHTML=(right?'✓ You were right! ':'✗ Not quite. ')+cfg.predict.why; if(cfg.predict.cell){ sc.marks={}; sc.draw(); } if(right&&cfg.onWin) cfg.onWin(); }
  w.reveal=()=>{ revealed=false; reveal(); };
  if(cfg.predict){ const po=P.querySelector('.predict .opts');
    if(cfg.predict.cell) po.innerHTML='<span class="chip">Click the square on the screen below</span>';
    else cfg.predict.opts.forEach((o,k)=>{ const b=document.createElement('button'); b.className='opt'; b.innerHTML=o; b.onclick=()=>{ if(st.steps>0) return; guess=k; po.querySelectorAll('.opt').forEach(x=>x.style.borderColor=''); b.style.borderColor='var(--warm)'; pfb.innerHTML='You chose. Now run and we’ll see.'; lock(); sayb.innerHTML='Press <b>Step</b> or <b>Run</b>.'; }; po.appendChild(b); }); }
  if(cfg.gap){ const gi=lines.indexOf(null), go=P.querySelector('.gopts'), gfb=P.querySelector('.gfb');
    cfg.gap.forEach(g=>{ const b=document.createElement('button'); b.className='opt'; b.innerHTML=L(g.t.trim()); b.onclick=()=>{
      go.querySelectorAll('.opt').forEach(x=>x.classList.remove('right','wrong')); b.classList.add(g.ok?'right':'wrong');
      gfb.className='fb '+(g.ok?'ok':'no'); gfb.innerHTML=g.why; lines[gi]=g.t; gapOk=true; reset(); sayb.innerHTML=g.ok?'The line is in place. Run it and see.':'This line is in place. Run it and see what comes out, then try another line.'; if(g.ok&&cfg.onWin) cfg.onWin(); }; go.appendChild(b); }); }
  if(variants){ const vo=P.querySelector('.vopts');
    variants.forEach((v,k)=>{ const b=document.createElement('button'); b.className='opt'+(k===0?' sel':''); b.innerHTML=v.label; b.onclick=()=>{ vo.querySelectorAll('.opt').forEach(x=>x.classList.remove('sel')); b.classList.add('sel'); lines=v.lines.slice(); sub=(v.sub||cfg.sub||[]).slice(); guess=cfg.predict?guess:null; reset(); if(cfg.onVariant) cfg.onVariant(k); }; vo.appendChild(b); }); }
  if(cfg.keys){ const kp=P.querySelector('.keypad9');
    cfg.keys.forEach(k=>{ const b=document.createElement('button'); b.className='key9'; b.textContent=k; b.onclick=()=>{ st.key=keyCode9(k); showKey(); }; kp.appendChild(b); });
    const wt=document.createElement('div'); wt.className='kp-wait'; kp.appendChild(wt);
    P.addEventListener('keydown',e=>{ if(e.target.tagName==='INPUT') return; const map={ArrowLeft:'←',ArrowRight:'→',ArrowUp:'↑',ArrowDown:'↓',' ':'SPACE'}; let k=map[e.key]||(/^[a-z]$/i.test(e.key)?e.key.toUpperCase():null);
      if(!k) return; e.preventDefault(); st.key=keyCode9(k); showKey(); }); }
  if(show.edit){ // click a byte, type two hex digits
    memEl.addEventListener('click',e=>{ const b=e.target.closest('.m12c[data-a]'); if(!b||running||busy) return; const a=+b.dataset.a;
      const inp=document.createElement('input'); inp.className='m12in ltr'; inp.maxLength=2; inp.value=hex2(st.mem[a]).slice(1); b.replaceWith(inp); inp.focus(); inp.select();
      let done=false; const commit=ok=>{ if(done) return; done=true; const v=parseInt(inp.value,16);
        if(ok&&/^[0-9A-Fa-f]{1,2}$/.test(inp.value.trim())){ const orig=asm12({pre:lines.filter(l=>l!=null),tail,post:sub}).mem[a]; if(v===orig) delete edits[a]; else edits[a]=v; reset(); sayb.innerHTML='House '+L(hex4(a))+' now holds '+L(hex2(v))+'. Run it and see what happened.'; if(cfg.onEdit) cfg.onEdit(w); }
        else paint(); };
      inp.addEventListener('keydown',ev=>{ if(ev.key==='Enter') commit(true); if(ev.key==='Escape') commit(false); }); inp.addEventListener('blur',()=>commit(true)); });
    btnO.onclick=()=>{ for(const a in edits) delete edits[a]; reset(); if(cfg.onEdit) cfg.onEdit(w); };
  }
  const spd=()=>{ spdn.textContent=SPEEDS9[+rng.value].n; }; rng.oninput=spd; spd();
  btnS.onclick=()=>step(false); btnR.onclick=run; P.querySelector('.rs').onclick=()=>reset(); btnK.onclick=skip;
  reset();
  return w;
}

/* ---------------- write-it-yourself puzzles (chapters 12+) ----------------
   cfg: tag, q, cases:[{name, keys, target:[[i,v],…]}], pre (locked, before), post (locked, after the fixed ending), userAt:'main'|'sub',
        tail, ops, best, minTime, maxLines, rule, start, hint1, hint2, solution, onWin */
function codePuzzle12(host,cfg){
  const cases=cfg.cases, multi=cases.length>1, tail=cfg.tail||'real', at=cfg.userAt||'main';
  const lock=(ls,note)=>ls.length?`<ol class="code locked">${ls.map(l=>'<li'+(TAIL9.includes(l)?' class="tl9"':'')+'>'+codeLine9(l)+'</li>').join('')}${note?'<li class="tail">🔒 '+note+'</li>':''}</ol>`:'';
  const above=(cfg.pre||[]).concat(at==='sub'&&tail==='real'?TAIL9:[]), below=(at==='main'&&tail==='real'?TAIL9:[]).concat(cfg.post||[]);
  host.innerHTML=`<span class="tag">${cfg.tag}</span><p>${cfg.q}</p>
   <div class="lbl">Your program${cfg.ops?' · allowed: '+cfg.ops.map(o=>'<bdi class="ltr">'+o+'</bdi>').join(', '):''}</div>${lock(above,cfg.preNote||(above.length?'These lines are already written. Carry on below them:':''))}
   <textarea class="src" spellcheck="false" autocapitalize="characters" autocomplete="off" rows="${cfg.rows||8}">${cfg.start||''}</textarea>
   ${below.length?'<div class="lbl soft">And after your lines, already written (locked):</div>'+lock(below):''}
   <div class="row" style="margin-top:6px"><button class="btn go">Run and check</button><button class="btn ghost sol">Solution</button><span class="soft">A line without a name starts with a space.</span></div>
   <div class="cases"></div>
   <details><summary>Hint 1</summary><p>${cfg.hint1}</p></details><details><summary>Hint 2</summary><p>${cfg.hint2}</p></details>
   <div class="fb res"></div>`;
  const box=host.querySelector('.cases');
  const views=cases.map(c=>{
    const d=document.createElement('div'); d.className='case';
    const kk=c.keys?'<div class="keys9">Keys pressed: '+(c.keys.length?c.keys.map(k=>'<kbd>'+k+'</kbd>').join(' '):'no keys')+'</div>':'';
    d.innerHTML=(multi?'<div class="case-h">'+c.name+'</div>':'')+kk+`<div class="pz-grid"><div><div class="lbl">This is how it should look at the end:</div><div class="tgt"></div><div class="info tinfo">Hover or tap the picture to see numbers</div></div><div><div class="lbl">Your screen at the end of the run:</div><div class="mine"></div></div></div>`;
    box.appendChild(d);
    const T=new Uint8Array(512).fill(0x60); c.target.forEach(([i,v])=>T[i]=v);
    const ti=d.querySelector('.tinfo');
    const tg=new Screen(d.querySelector('.tgt'),{labels:true,hexcols:true,interactive:true,onHover:i=>{ ti.innerHTML=i<0?'Hover or tap the picture to see numbers':cellInfo(tg.mem,i); },onClick:i=>{ ti.innerHTML=cellInfo(tg.mem,i); }});
    tg.mem.set(T); tg.draw();
    const mine=new Screen(d.querySelector('.mine'),{labels:true,hexcols:true});
    return {T,mine,c};
  });
  const ta=host.querySelector('textarea'), res=host.querySelector('.res');
  host.querySelector('.sol').onclick=()=>{ ta.value=cfg.solution; res.className='fb res'; res.innerHTML='This is one solution. If you wrote a different one that works, it is right too. Press “Run and check”.'; };
  host.querySelector('.go').onclick=async ()=>{
    const userLines=ta.value.replace(/\r/g,'').split('\n');
    const msgs=[]; let allOk=true, nUser=0, tmax=0;
    for(const v of views){
      const img=asm12({pre:cfg.pre||[],user:userLines,tail,post:cfg.post||[]},{ops:cfg.ops,userAt:at});
      if(img.errs.length){ res.className='fb res no'; res.innerHTML=img.errs.map(e=>'⚠️ '+e).join('<br>'); return; }
      const mineProg=img.items.filter(p=>p.kind==='user'); nUser=mineProg.length;
      if(!mineProg.length){ res.className='fb res no'; res.innerHTML='There are no lines of yours yet.'; return; }
      if(cfg.maxLines&&nUser>cfg.maxLines){ res.className='fb res no'; res.innerHTML='⚠️ '+nUser+' lines is a lot. In this puzzle you may use up to '+cfg.maxLines+'.'; return; }
      const ruleMsg=cfg.rule&&cfg.rule(mineProg,img); if(ruleMsg){ res.className='fb res no'; res.innerHTML='⚠️ '+ruleMsg; return; }
      const out=cpuRun12(img,{keys:v.c.keys||[]});
      v.mine.mem.set(scr12(out.st)); v.mine.marks={};
      let diff=0; for(let i=0;i<512;i++) if(v.mine.mem[i]!==v.T[i]){ diff++; v.mine.marks[i]='#c0392b'; } v.mine.draw();
      tmax=Math.max(tmax,out.st.cyc);
      const pfx=multi?v.c.name+': ':'';
      if(out.err){ allOk=false; msgs.push(pfx+'⚠️ '+out.err); continue; }
      if(out.keysLeft){ allOk=false; msgs.push(pfx+'The program ended before all the keys were pressed ('+out.keysLeft+' left). Maybe a loop that goes back to ask is missing?'); continue; }
      if(out.back&&tail==='real'){ allOk=false; msgs.push(pfx+'The program went back to DREAM before the fixed ending (RTS took DREAM’s plate). In DREAM the screen would be wiped at once, so we would not see the picture.'); continue; }
      if(diff){ allOk=false; msgs.push(pfx+diff+' squares are not like the picture (marked in red).'); continue; }
      if(cfg.minTime&&out.st.cyc/CLK9<cfg.minTime){ allOk=false; msgs.push(pfx+'The screen is right, but on the Dragon all this is over within '+secs9(out.st.cyc)+'. A wait is needed (at least '+cfg.minTime+' seconds in all).'); continue; }
      await sleep(60);
    }
    if(allOk){ res.className='fb res ok'; res.innerHTML='✓ '+(multi?'In every case the screen matches the picture!':'The screen matches the picture!')+(cfg.minTime?' On the Dragon it takes about '+secs9(tmax)+'.':'')+(cfg.best?' '+(nUser<=cfg.best?'And short too: '+nUser+' lines.':'You did it in '+nUser+' lines. Challenge: it can also be done in '+cfg.best+'.'):'')+' <span class="badge">★ Solved</span>'; if(!host._won){ host._won=1; cfg.onWin&&cfg.onWin(); } }
    else { res.className='fb res no'; res.innerHTML='Almost! '+msgs.join('<br>'); }
  };
}

/* ---------------- change-one-byte puzzles (chapter 13) ----------------
   cfg: tag, q, lines, target, changes (how many bytes may change), hint1, hint2, solution:[[addr,value]], onWin */
function memPuzzle12(host,cfg){
  const base=asm12({pre:cfg.lines,tail:'real'}), edits={};
  host.innerHTML=`<span class="tag">${cfg.tag}</span><p>${cfg.q}</p>
   <div class="pz-mem"><div><ol class="code lst12 locked"></ol></div><div><div class="lbl">The program’s memory (click a number to change it):</div><div class="mem12"><div class="m12g"></div></div></div></div>
   <div class="row" style="margin-top:6px"><button class="btn go">Run and check</button><button class="btn ghost orig">Put it all back</button><button class="btn ghost sol">Solution</button></div>
   <div class="pz-grid"><div><div class="lbl">This is how it should look at the end:</div><div class="tgt"></div></div><div><div class="lbl">Your screen at the end of the run:</div><div class="mine"></div></div></div>
   <details><summary>Hint 1</summary><p>${cfg.hint1}</p></details><details><summary>Hint 2</summary><p>${cfg.hint2}</p></details>
   <div class="fb res"></div>`;
  const ol=host.querySelector('ol'), g=host.querySelector('.m12g'), res=host.querySelector('.res');
  ol.innerHTML=base.items.map(P=>'<li'+(P.kind==='tail'?' class="tl9"':'')+'><span class="ad12">'+hex4(P.addr).slice(1)+'</span><span class="by12">'+P.bytes.map(v=>hex2(v).slice(1)).join('')+'</span>'+codeLine9(P.text)+'</li>').join('');
  const T=new Uint8Array(512).fill(0x60); cfg.target.forEach(([i,v])=>T[i]=v);
  const tg=new Screen(host.querySelector('.tgt'),{labels:true,hexcols:true}); tg.mem.set(T); tg.draw();
  const mine=new Screen(host.querySelector('.mine'),{labels:true,hexcols:true});
  const img=()=>{ const m=asm12({pre:cfg.lines,tail:'real'}); for(const a in edits) m.mem[a]=edits[a]; return m; };
  const paint=()=>{ const i=img(); const st=cpuNew12(i); g.innerHTML=memHtml12(st,i,{edit:true,noPC:true,changed:new Set(Object.keys(edits).map(Number))}); };
  g.addEventListener('click',e=>{ const b=e.target.closest('.m12c[data-a]'); if(!b) return; const a=+b.dataset.a;
    const inp=document.createElement('input'); inp.className='m12in ltr'; inp.maxLength=2; inp.value=hex2(img().mem[a]).slice(1); b.replaceWith(inp); inp.focus(); inp.select();
    let done=false; const commit=()=>{ if(done) return; done=true; if(/^[0-9A-Fa-f]{1,2}$/.test(inp.value.trim())){ const v=parseInt(inp.value,16); if(v===base.mem[a]) delete edits[a]; else edits[a]=v; } paint(); };
    inp.addEventListener('keydown',ev=>{ if(ev.key==='Enter') commit(); if(ev.key==='Escape'){ done=true; paint(); } }); inp.addEventListener('blur',commit); });
  host.querySelector('.orig').onclick=()=>{ for(const a in edits) delete edits[a]; paint(); res.innerHTML=''; };
  host.querySelector('.sol').onclick=()=>{ for(const a in edits) delete edits[a]; cfg.solution.forEach(([a,v])=>edits[a]=v); paint(); res.className='fb res'; res.innerHTML='This is the solution: the number that changed is marked in orange. Press “Run and check”.'; };
  host.querySelector('.go').onclick=()=>{
    const n=Object.keys(edits).length, out=cpuRun12(img(),{keys:[]});
    mine.mem.set(scr12(out.st)); mine.marks={}; let diff=0; for(let i=0;i<512;i++) if(mine.mem[i]!==T[i]){ diff++; mine.marks[i]='#c0392b'; } mine.draw();
    if(!n){ res.className='fb res no'; res.innerHTML='You haven’t changed any number yet. Click a number in the memory and change it.'; return; }
    if(out.err){ res.className='fb res no'; res.innerHTML='⚠️ '+out.err; return; }
    if(diff){ res.className='fb res no'; res.innerHTML='Almost! '+diff+' squares are not like the picture (marked in red).'; return; }
    if(n>cfg.changes){ res.className='fb res no'; res.innerHTML='The screen is right! But you changed '+n+' numbers. '+cfg.changes+' is enough.'; return; }
    res.className='fb res ok'; res.innerHTML='✓ The screen matches the picture, and you changed only one number! <span class="badge">★ Solved</span>'; if(!host._won){ host._won=1; cfg.onWin&&cfg.onWin(); }
  };
  paint();
}

/* ---------------- the translator: text in, numbers out (chapter 13), and the tape line (chapter 15) ---------------- */
function asmTool12(host,cfg){
  host.innerHTML=`<div class="tool12"><div class="lbl">${cfg.label||'Write lines here (as in DREAM):'}</div><textarea class="src" spellcheck="false" autocapitalize="characters" rows="${cfg.rows||6}">${cfg.start||''}</textarea>
    <ol class="code lst12 out12"></ol><div class="info sum12"></div></div>`;
  const ta=host.querySelector('textarea'), ol=host.querySelector('.out12'), sum=host.querySelector('.sum12');
  const go=()=>{ const lines=ta.value.replace(/\r/g,'').split('\n'); const img=asm12({user:lines,tail:cfg.tail||'real',post:[]},{});
    if(img.errs.length){ ol.innerHTML=''; sum.innerHTML='⚠️ '+img.errs[0]; return; }
    ol.innerHTML=img.items.map(P=>'<li'+(P.kind==='tail'?' class="tl9"':'')+'><span class="ad12">'+hex4(P.addr).slice(1)+'</span><span class="by12">'+P.bytes.map(v=>hex2(v).slice(1)).join('')+'</span>'+codeLine9(P.text)+'</li>').join('')+'<li><span class="ad12">'+hex4(img.end).slice(1)+'</span></li>';
    const n=img.end-img.start; sum.innerHTML=cfg.tape?('The program takes up <b>'+n+' houses</b>: from '+L(hex4(img.start))+' to '+L(hex4(img.end-1))+'. The line for saving to tape:<br><code class="ltr big12">CSAVEM "'+(cfg.name||'CATCH')+'",&H'+hex4(img.start).slice(1)+',&H'+hex4(img.end-1).slice(1)+',&H'+hex4(img.entry).slice(1)+'</code>'):('The program takes up <b>'+n+' houses</b> in memory, from '+L(hex4(img.start))+' to '+L(hex4(img.end-1))+'. DREAM writes the next free house at the end of the listing: '+L(hex4(img.end))+'.'); };
  ta.addEventListener('input',go); go();
  if(cfg.send) sendBtn(host.querySelector('.tool12'),host,{tape:cfg.name},()=>({lines:ta.value.replace(/\r/g,'').split('\n'),tail:cfg.tail||'real',user:true}));
}
/* =================== chapters 12–15: the programs (one place, used by the page and by verify/) =================== */
const PRG12=(()=>{
  const g={};
  // ---- chapter 12
  g.pw121={lines:['@ LDY #$0484',' JSR DOT',' LDY #$048E',' JSR DOT',' LDY #$0498',' JSR DOT'],sub:['DOT LDA #$BF',' STA ,Y',' STA 1,Y',' RTS']};
  g.SQ={sub:['SQUARE STA ,Y',' STA 1,Y',' STA 32,Y',' STA 33,Y',' RTS']};
  g.pw122=gap=>({lines:['@ LDY #$0484',' LDA #$BF',' JSR SQUARE',' LDY #$048C',' LDA #$9F',gap,' LDY #$0494',' LDA #$AF',' JSR SQUARE'],sub:g.SQ.sub});
  g.MAIN123=['@ LDY #$0484'," LDA #'A",'LOOP STA ,Y',' JSR UNDER',' INCA',' LEAY 2,Y',' CMPY #$0490',' BNE LOOP'];
  g.pw123=keep=>({lines:g.MAIN123,sub:keep?['UNDER PSHS A',' LDA #$BF',' STA 32,Y',' PULS A',' RTS']:['UNDER LDA #$BF',' STA 32,Y',' RTS']});
  g.pw124={lines:g.MAIN123,sub:['UNDER PSHS A',' LDA #$BF',' STA 32,Y',' RTS']};
  g.pz121={pre:['@ LDY #$0442',' JSR LINE',' LDY #$04A2',' JSR LINE',' LDY #$0502',' JSR LINE'],
    solution:"LINE LDA #$9F\n LDB #6\nMORE STA ,Y+\n DECB\n BNE MORE\n RTS\n"};
  g.pz122={post:g.SQ.sub,solution:"@ LDY #$0450\n LDA #$BF\n JSR SQUARE\n LDY #$04B0\n LDA #$9F\n JSR SQUARE\n LDY #$0510\n LDA #$8F\n JSR SQUARE\n"};
  g.pz123={pre:['@ LDY #$0502',' LDB #8','LOOP JSR DOT',' LEAY 3,Y',' DECB',' BNE LOOP'],start:"DOT LDB #$CF\n STB ,Y\n RTS\n",solution:"DOT PSHS B\n LDB #$CF\n STB ,Y\n PULS B\n RTS\n"};
  // ---- chapter 13
  g.pw131={lines:['@ LDA #$BF',' STA $0510']};
  g.pw132={lines:['@ LDX #$0500',' LDA #$BF','LOOP STA ,X+',' CMPX #$0520',' BLO LOOP']};
  g.pw133={lines:["@ LDA #'A",' STA $0510',' LDA #$BF',' STA $0511']};
  g.pz131={lines:['@ LDX #$0500',' LDA #$BF','LOOP STA ,X+',' CMPX #$0508',' BLO LOOP'],solution:[[0x2EEA,0x10]]};
  g.pz132={lines:['@ LDX #$0400',' LDA #$9F','LOOP STA ,X',' LEAX 32,X',' CMPX #$0600',' BLO LOOP'],solution:[[0x2EEA,0x21]]};
  // ---- chapter 14: the game, stage by stage
  const MOVE=[' LDB #$60',' STB ,Y',' CMPA #$08',' BNE NOTL',' CMPY #$05E0',' BEQ NOTL',' LEAY -1,Y','NOTL CMPA #$09'];
  g.pw141=gap=>({lines:['@ LDY #$05F0','DRAW LDA #$AF',' STA ,Y','WAIT LDX $A000',' JSR ,X',' BEQ WAIT'," CMPA #'Q",' BEQ KEY',' LDB #$60',' STB ,Y',' CMPA #$08',' BNE NOTL',' CMPY #$05E0',' BEQ NOTL',gap,'NOTL CMPA #$09',' BNE DRAW',' CMPY #$05FF',' BEQ DRAW',' LEAY 1,Y',' BRA DRAW']});
  g.pw142=gap=>({lines:['@ LDU #$0430','LOOP LDA #$9F',' STA ,U',' LDX #$1800','WAIT LEAX -1,X',' BNE WAIT',' CMPU #$05F0',' BEQ KEY',' LDA #$60',' STA ,U',gap,' BRA LOOP']});
  // the common middle of stages 3–5: draw, wait a little, ask the keyboard once (no waiting), move the basket
  const TOP=['LOOP LDA #$AF',' STA ,Y',' LDA #$9F',' STA ,U'];
  const ASK=gap=>[' LDX #800','WAIT LEAX -1,X',' BNE WAIT',' LDX $A000',' JSR ,X',gap," CMPA #'Q",' BEQ KEY'].concat(MOVE,[' BNE FALL',' CMPY #$05FF',' BEQ FALL',' LEAY 1,Y']);
  const FALL=['FALL DEC TICK',' BNE LOOP',' LDA #25',' STA TICK',' LDA #$60',' STA ,U',' LEAU 32,U',' CMPU #$05E0',' BLO LOOP'];
  g.pw143=gap=>({lines:['@ LDY #$05F0',' LDU #$0430'].concat(TOP,ASK(gap),FALL,[' LDA ,U',' CMPA #$AF',' BNE MISS'," LDA #'Y",' STA $0400',' BRA KEY',"MISS LDA #'N",' STA $0400']),sub:['TICK FCB 25']});
  const SHOW=[' LDA SCORE',' ADDA #$70',' STA $0400'];
  g.pw144=gap=>({lines:['@ LDY #$05F0',' LDU #$0430',' CLR SCORE',' LDA #5',' STA LEFT'].concat(TOP,SHOW,ASK(' BEQ FALL'),FALL,[gap,' CMPA #$AF',' BNE MISS',' INC SCORE','MISS LDU #$0430',' DEC LEFT',' BNE LOOP'],SHOW),sub:['SCORE FCB 0','LEFT FCB 5','TICK FCB 25']});
  g.SUB14=['SCORE FCB 0','LEFT FCB 5','TICK FCB 25','SEED FCB 16'];
  g.stage4text=()=>g.pw144(' LDA ,U').lines.join('\n')+'\n';
  g.pz141={solution:['@ LDY #$05F0',' LDU #$0430',' CLR SCORE',' LDA #5',' STA LEFT',' LDB #16',' STB SEED'].concat(TOP,SHOW,ASK(' BEQ FALL'),FALL,[' LDA ,U',' CMPA #$AF',' BNE MISS',' INC SCORE','MISS LDB SEED',' ADDB #13',' ANDB #31',' STB SEED',' LDU #$0420',' LEAU B,U',' DEC LEFT',' BNE LOOP'],SHOW).join('\n')+'\n'};
  g.game={lines:g.pz141.solution.replace(/\n$/,'').split('\n'),sub:g.SUB14};
  return g;
})();
/* =================== chapters 12–15: content =================== */
const win12=winner(12,3), win13=winner(13,3), win14=winner(14,3), win15=winner(15,1);
Object.assign(QUIZ,{
  q12a:{q:'When the program starts, <bdi class="ltr">S = $2E05</bdi>. Now <bdi class="ltr">JSR DOT</bdi>. What will S be inside DOT?',opts:['<bdi class="ltr">$2E03</bdi>','<bdi class="ltr">$2E07</bdi>','<bdi class="ltr">$2E04</bdi>'],a:0,
       why:['Right! A JSR plate is two houses, and the stack grows downwards: <bdi class="ltr">$2E05</bdi> minus 2.','The stack grows <b>downwards</b> in memory: S goes down, not up.','A bookmark is a house number, and a house number takes two houses. S goes down by 2.']},
  q13a:{q:'DREAM shows <bdi class="ltr">2EF5</bdi> at the end of the listing. The program started at <bdi class="ltr">$2EE1</bdi>. How many houses does it take?',opts:['20','14','2EF5'],a:0,
       why:['Right! <bdi class="ltr">$2EF5 − $2EE1 = $14</bdi>, and that is 20 (16 plus 4).','14 is the computer’s way of writing (<bdi class="ltr">$14</bdi>). In ordinary counting it is 20.','That is the number of the free house after the program, not its size.']},
  q14a:{q:'Why is the check <bdi class="ltr">LDA ,U</bdi> and not <bdi class="ltr">LDA ,Y</bdi>?',opts:['Because U is the place where the apple lands. That is where we ask: is there a basket here?','Because Y doesn’t work with LDA','There is no difference'],a:0,
       why:['Right! <bdi class="ltr">,Y</bdi> is the square of the basket itself, and there is always blue there. It is like asking the basket whether it is a basket.','<bdi class="ltr">LDA ,Y</bdi> works perfectly well. But it looks at the basket itself, and there is always blue there.','Try it in the window: with <bdi class="ltr">,Y</bdi> every apple is “caught”, even when the basket is far away.']}
});
['q12a','q13a','q14a'].forEach(k=>{ const el=document.querySelector('[data-quiz="'+k+'"]'); if(el) makeQuiz(el,QUIZ[k]); });
const TLD12='<bdi class="ltr">';

/* ---------- chapter 12 ---------- */
function plate12(x,y,w,nm,col,thin){ const h=thin?20:30; return `<rect x="${x-w/2}" y="${y}" width="${w}" height="${h}" rx="${h/2}" fill="${col}" stroke="#5d646d" stroke-width="2"/>`+plateTxt12(x,y+h/2+5,nm,12,'#222'); }
function pile12(cx,top,items,title,sv){ // items: top first [{t,col,thin}]
  let s=heb(cx,top-44,title,13.5,'currentColor',700), y=top;
  s+=`<g transform="translate(${cx-104},${y+14}) rotate(90)">${hand9(0,0,0.42,'#e67e22')}</g>`+mono(cx-118,y+2,'S',14,'#c8a000','middle',700);
  items.forEach(it=>{ s+=plate12(cx,y,170,it.nm,it.col,it.thin); y+=(it.thin?20:30)+5; });
  s+=`<rect x="${cx-100}" y="${y+2}" width="200" height="8" rx="3" fill="#8a7358"/>`+mono(cx,y+30,'S = '+sv,12.5,'currentColor','middle',700);
  return s;
}
function fig121(){
  const D={nm:{he:'Back to DREAM',lt:''},col:'#c9ced4'};
  let s=pile12(130,96,[D],'When the program starts','$2E05');
  s+=pile12(380,96,[{nm:{he:'Back to house',lt:'$2EE8'},col:'#f3e7c6'},D],'After JSR DOT','$2E03');
  s+=pile12(630,96,[D],'After DOT’s RTS','$2E05');
  s+=arrow(232,120,270,120)+arrow(482,120,520,120);
  s+=heb(251,150,'JSR',12,'#c8a000',700)+heb(501,150,'RTS',12,'#c8a000',700);
  return svg(760,236,s);
}
function fig122(){
  let s=pile12(170,80,[{nm:{he:'',lt:'A = $41'},col:'#cde8ff',thin:true},{nm:{he:'Back to house',lt:'$2EEC'},col:'#f3e7c6'},{nm:{he:'Back to DREAM',lt:''},col:'#c9ced4'}],'Before the RTS, when PULS A was forgotten','$2E02');
  s+=`<rect x="76" y="76" width="188" height="44" rx="10" fill="none" stroke="#c0392b" stroke-width="3" stroke-dasharray="7 5"/>`+heb(170,148,'',1);
  s+=arrow(282,98,372,98,'#c0392b');
  s+=`<rect x="380" y="70" width="150" height="56" rx="10" fill="#2a2e34"/>`+mono(424,104,'$41',20,'#cde8ff','middle',700)+mono(486,104,'$2E',20,'#f3e7c6','middle',700);
  s+=heb(455,146,'RTS takes two houses',12.5,'currentColor',700);
  s+=arrow(536,98,600,98,'#c0392b');
  s+=`<rect x="606" y="64" width="140" height="68" rx="10" fill="#5a1d18"/>`+mono(676,96,'$412E',20,'#fff','middle',700)+heb(676,120,'Not our program!',12,'#ffd0c8',700);
  return svg(760,226,s);
}
put('fig121',fig121()); put('fig122',fig122());
progWindow12(document.getElementById('pw121'),{title:'Example 1 · Three bricks, one subroutine',show:{wide:['X','Y'],lamps:['Z'],stack:true},keys:['SPACE'],speed:1,
  lines:PRG12.pw121.lines,sub:PRG12.pw121.sub,
  predict:{q:'DOT’s first <bdi class="ltr">RTS</bdi>: which line does the processor go back to?',opts:['<bdi class="ltr">LDY #$048E</bdi>: the line after the JSR','<bdi class="ltr">DOT LDA #$BF</bdi>: back to the start of DOT','<bdi class="ltr">KEY</bdi>: to the fixed ending'],a:0,
    why:'The plate said <bdi class="ltr">$2EE8</bdi>: the house of the line after the JSR. Each JSR puts down a different bookmark, so each RTS goes back to the right place.'},onWin:()=>win12('p')});
progWindow12(document.getElementById('pw122'),{title:'Example 2 · Draw a block, three times',show:{wide:['X','Y'],lamps:['Z'],stack:true},keys:['SPACE'],speed:2,
  lines:PRG12.pw122(null).lines,sub:PRG12.SQ.sub,gapq:'A line is missing, between the red block and the blue one. What is needed there?',
  gap:[{t:' JSR SQUARE',ok:true,why:'Right! JSR puts down a plate, and the yellow block is drawn. SQUARE’s RTS goes back exactly to the line after it, and the program carries on to the blue block.'},
       {t:' BRA SQUARE',ok:false,why:'BRA jumps to SQUARE, but <b>without a plate</b>. The yellow block is drawn, and then the RTS takes the top plate: DREAM’s! The program goes back to DREAM halfway through, and the blue is never drawn.'},
       {t:' RTS',ok:false,why:'RTS here takes DREAM’s plate: the program ends after the red block. In DREAM we would see the editor straight away, without seeing the drawing.'}]});
progWindow12(document.getElementById('pw123'),{title:'Example 3 · Letters with a line underneath',show:{wide:['X','Y'],lamps:['Z'],stack:true},keys:['SPACE'],speed:3,
  varq:'Version:',variants:[{label:'With <bdi class="ltr">PSHS A</bdi> and <bdi class="ltr">PULS A</bdi>',lines:PRG12.MAIN123,sub:PRG12.pw123(1).sub},{label:'Without',lines:PRG12.MAIN123,sub:PRG12.pw123(0).sub}],onVariant:k=>{ if(k===1) win12('v'); }});
progWindow12(document.getElementById('pw124'),{title:'Example 4 · A forgotten plate',show:{wide:['X','Y'],lamps:['Z'],stack:true},keys:['SPACE'],speed:1,
  lines:PRG12.pw124.lines,sub:PRG12.pw124.sub,
  predict:{q:'What will happen when we run it?',opts:['One A and a line, and then the computer gets stuck','Six letters, like before','Nothing is drawn'],a:0,
    why:'The letter A and the line are drawn. But at the first RTS, the top plate is A’s. RTS takes it, together with half of the bookmark, and jumps to <bdi class="ltr">$412E</bdi>. Our program isn’t there.'},onWin:()=>win12('p4')});

codePuzzle12(document.getElementById('pz121'),{tag:'Puzzle 1 · The LINE subroutine',userAt:'sub',pre:PRG12.pz121.pre,
  q:'The main program is already written: it calls <code>LINE</code> three times, each time with a different Y. Write <code>LINE</code>: a yellow line (<code>$9F</code>) of 6 squares, from Y to the right. And don’t forget its ending.',
  cases:[{target:[0x42,0x43,0x44,0x45,0x46,0x47,0xA2,0xA3,0xA4,0xA5,0xA6,0xA7,0x102,0x103,0x104,0x105,0x106,0x107].map(i=>[i,0x9f])}],best:6,
  hint1:'The first line starts with the name: <bdi class="ltr">LINE LDA #$9F</bdi>. And after it, <bdi class="ltr">STA</bdi> six times, or a loop.',hint2:'With a loop: <bdi class="ltr">LDB #6</bdi>, <bdi class="ltr">MORE STA ,Y+</bdi>, <bdi class="ltr">DECB</bdi>, <bdi class="ltr">BNE MORE</bdi>. And at the end: <bdi class="ltr">RTS</bdi>.',
  solution:PRG12.pz121.solution,onWin:()=>win12('a')});
codePuzzle12(document.getElementById('pz122'),{tag:'Puzzle 2 · Traffic lights',post:PRG12.pz122.post,
  q:'This time <code>SQUARE</code> is already written (after the fixed ending). Write a main program that draws traffic lights in column 16: red (<code>$BF</code>) at the top, yellow (<code>$9F</code>) in the middle, green (<code>$8F</code>) at the bottom. Only with <code>JSR SQUARE</code>.',
  cases:[{target:[[0x50,0xbf],[0x51,0xbf],[0x70,0xbf],[0x71,0xbf],[0xB0,0x9f],[0xB1,0x9f],[0xD0,0x9f],[0xD1,0x9f],[0x110,0x8f],[0x111,0x8f],[0x130,0x8f],[0x131,0x8f]]}],best:9,
  rule:p=>p.some(x=>x.op==='STA')?'In this puzzle you don’t write STA yourself: SQUARE does the drawing.':null,
  hint1:'Each block takes three lines: where (<bdi class="ltr">LDY #…</bdi>), which colour (<bdi class="ltr">LDA #…</bdi>), and <bdi class="ltr">JSR SQUARE</bdi>.',hint2:'The top block starts at <bdi class="ltr">$0450</bdi> (row 2, column 16). The middle one at <bdi class="ltr">$04B0</bdi>, and the bottom one at <bdi class="ltr">$0510</bdi>.',
  solution:PRG12.pz122.solution,onWin:()=>win12('b')});
codePuzzle12(document.getElementById('pz123'),{tag:'Puzzle 3 · Who stole B?',userAt:'sub',pre:PRG12.pz123.pre,start:PRG12.pz123.start,ops:['LDB','STB','PSHS','PULS','RTS'],rows:6,
  q:'The main program counts in B: eight cyan dots on row 8. But <code>DOT</code> uses B for the colour, and “steals” the count. Run it and see what happens. Then fix <code>DOT</code> (only DOT), so that it gives B back the way it got it.',
  cases:[{target:[0x102,0x105,0x108,0x10b,0x10e,0x111,0x114,0x117].map(i=>[i,0xcf])}],best:5,
  hint1:'At the start of DOT: put B on the stack. Before the RTS: take it back.',hint2:'<bdi class="ltr">DOT PSHS B</bdi> on the first line, and <bdi class="ltr">PULS B</bdi> before <bdi class="ltr">RTS</bdi>.',
  solution:PRG12.pz123.solution,onWin:()=>win12('c')});

/* ---------- chapter 13 ---------- */
function fig131(){
  const R=[['LDA #$41','86','41'],['LDB #$41','C6','41'],['STA $0510','B7','05 10'],['LDX #$0500','8E','05 00'],['LDY #$0500','10 8E','05 00'],['LEAX -1,X','30','1F'],['BNE WAIT','26','FC'],['JSR ,X','AD','84'],['RTS','39','']];
  let s=`<rect x="10" y="8" width="230" height="${R.length*34+20}" rx="10" fill="#0e2a0e"/><rect x="420" y="8" width="320" height="${R.length*34+20}" rx="10" fill="#2a2e34"/>`;
  s+=heb(125,0+28,'',1);
  R.forEach(([w,c,n],k)=>{ const y=20+k*34;
    s+=mono(30,y+19,w,15,'#9df09d','start',700)+arrow(250,y+13,410,y+13,'#ff9b2f',2.5);
    const cs=c.split(' '), ns=n?n.split(' '):[]; let x=436;
    cs.forEach(v=>{ s+=`<rect x="${x}" y="${y}" width="40" height="26" rx="5" fill="#ffd23f"/>`+mono(x+20,y+18,v,14,'#222','middle',700); x+=44; });
    ns.forEach(v=>{ s+=`<rect x="${x}" y="${y}" width="40" height="26" rx="5" fill="#cfd6df"/>`+mono(x+20,y+18,v,14,'#222','middle',700); x+=44; }); });
  const y=R.length*34+40;
  s+=`<rect x="436" y="${y}" width="22" height="16" rx="3" fill="#ffd23f"/>`+heb(560,y+13,'Yellow: the instruction (what to do)',12)+`<rect x="436" y="${y+22}" width="22" height="16" rx="3" fill="#cfd6df"/>`+heb(560,y+35,'Grey: the number you wrote (with what)',12);
  return svg(760,y+46,s);
}
put('fig131',fig131());
progWindow12(document.getElementById('pw131'),{title:'Example 1 · Words and numbers',show:{wide:['X'],lamps:['Z'],mem:true,listing:true},keys:['SPACE'],speed:0,
  lines:PRG12.pw131.lines,
  predict:{q:'How many houses on the street does the line <bdi class="ltr">LDA #$BF</bdi> take?',opts:['1','2','4'],a:1,why:'Two: <bdi class="ltr">$86</bdi> (that is “LDA with a hash sign”) and <bdi class="ltr">$BF</bdi> (the number). Look at the street: house <bdi class="ltr">$2EE1</bdi> holds 86, and house <bdi class="ltr">$2EE2</bdi> holds BF.'},onWin:()=>win13('p')});
progWindow12(document.getElementById('pw132'),{title:'Example 2 · PC runs round the loop',show:{wide:['X'],lamps:['Z','C'],mem:true,listing:true},keys:['SPACE'],speed:1,
  lines:PRG12.pw132.lines,
  predict:{q:'<bdi class="ltr">BLO LOOP</bdi> turns back. What will be in PC after it?',opts:['<bdi class="ltr">$2EE6</bdi>','<bdi class="ltr">$2EE1</bdi>','<bdi class="ltr">$2EED</bdi>'],a:0,why:'<bdi class="ltr">$2EE6</bdi>: that is where <bdi class="ltr">LOOP STA ,X+</bdi> starts. The house after the BLO is <bdi class="ltr">$2EED</bdi>, and <bdi class="ltr">$F9</bdi> says: 7 back. <bdi class="ltr">$2EED − 7 = $2EE6</bdi>.'},onWin:()=>win13('q')});
(function(){
  const seen={b:false,blue:false,aa:false,up:false};
  const ms=[{t:'Change one number, so that <b>B</b> appears instead of A.',ok:()=>seen.b},{t:'Change one number, so that the block is <b>blue</b> (<bdi class="ltr">$AF</bdi>).',ok:()=>seen.blue},
    {t:'Change one number, so that <b>another A</b> appears instead of the block: AA. (Hint: the instruction is at <bdi class="ltr">$2EE6</bdi>. What is the code for LDB?)',ok:()=>seen.aa},{t:'Move the letter <b>one row up</b>, to <bdi class="ltr">$04F0</bdi>. Here you need to change two numbers.',ok:()=>seen.up}];
  const chk=missions(document.getElementById('m13'),ms,()=>({}));
  progWindow12(document.getElementById('pw133'),{title:'Example 3 · Change a number on the street',show:{wide:['X'],lamps:['Z'],mem:true,listing:true,edit:true},keys:['SPACE'],speed:4,
    lines:PRG12.pw133.lines,onEnd:(st)=>{ const m=st.mem;
      if(m[0x510]===0x42) seen.b=true; if(m[0x511]===0xAF&&m[0x510]===0x41) seen.blue=true; if(m[0x510]===0x41&&m[0x511]===0x41) seen.aa=true; if(m[0x4F0]===0x41&&m[0x510]===0x60) seen.up=true;
      chk(); const n=Object.values(seen).filter(Boolean).length; if(n>=2) win13('m'); }});
  chk();
})();
asmTool12(document.getElementById('tool13'),{start:"@ LDA #$BF\n STA $0510\n"});
memPuzzle12(document.getElementById('pz131'),{tag:'Puzzle 1 · A line twice as long',lines:PRG12.pz131.lines,changes:1,solution:PRG12.pz131.solution,
  q:'The program draws 8 red squares. Change one number, so that there are <b>16</b>.',target:[...Array(16)].map((_,i)=>[0x100+i,0xbf]),
  hint1:'Which line decides when to stop? Find it in the listing, and its numbers on the street.',hint2:'<bdi class="ltr">CMPX #$0508</bdi> became <bdi class="ltr">8C 05 08</bdi>. The 08 lives in house <bdi class="ltr">$2EEA</bdi>. 16 squares end at <bdi class="ltr">$0510</bdi>.',onWin:()=>win13('a')});
memPuzzle12(document.getElementById('pz132'),{tag:'Puzzle 2 · From a straight line to a diagonal',lines:PRG12.pz132.lines,changes:1,solution:PRG12.pz132.solution,
  q:'The program draws a yellow line from top to bottom. Change one number, so that the line is a <b>diagonal</b>, like in the picture.',target:[...Array(16)].map((_,i)=>[33*i,0x9f]),
  hint1:'The step of the finger X on each lap is <bdi class="ltr">LEAX 32,X</bdi>: one row down. On a diagonal, each step is one row down and one more to the right.',hint2:'<bdi class="ltr">LEAX 32,X</bdi> became <bdi class="ltr">30 88 20</bdi>. <bdi class="ltr">$20</bdi> is 32. What is 33?',onWin:()=>win13('b')});

/* ---------- chapter 14 ---------- */
function fig141(){
  const mini=(x,cells,label,n)=>{ let s=`<rect x="${x}" y="30" width="128" height="96" rx="6" fill="${VDG.green}"/>`;
    cells.forEach(([c,r,col])=>{ s+=`<rect x="${x+4+c*3.75}" y="${34+r*5.5}" width="3.75" height="5.5" fill="${col}"/>`; });
    return s+`<circle cx="${x+64}" cy="14" r="11" fill="#ffd23f"/>`+mono(x+64,19,n,13,'#222','middle',700)+heb(x+64,146,label,12,'currentColor',700); };
  const Y='#ffff83', B='#1b166b';
  let s=mini(10,[[16,15,B]],'A moving basket','1')+arrow(60,120,40,120,'#ff9b2f',2)+arrow(90,120,110,120,'#ff9b2f',2);
  s+=mini(160,[[16,3,Y],[16,6,'rgba(255,255,131,.45)'],[16,9,'rgba(255,255,131,.25)']],'A falling apple','2');
  s+=mini(310,[[16,14,Y],[16,15,B],[0,0,'#0e2a0e']],'Caught?','3')+mono(316,40,'Y',10,'#0e2a0e','start',700);
  s+=mini(460,[[16,7,Y],[12,15,B]],'Score','4')+mono(466,40,'3',10,'#0e2a0e','start',700);
  s+=mini(610,[[4,5,Y],[29,2,'rgba(255,255,131,.4)'],[10,9,'rgba(255,255,131,.4)'],[20,15,B]],'From somewhere else','5');
  return svg(750,156,s);
}
put('fig141',fig141());
const SH14={b:true,wide:['X','Y','U'],lamps:['Z','C']};
progWindow12(document.getElementById('pw141'),{title:'Stage 1 · A moving basket',show:{b:true,wide:['X','Y'],lamps:['Z']},keys:['←','→','Q'],speed:4,
  lines:PRG12.pw141(null).lines,gapq:'What does the basket do when you press the left arrow? Choose the missing line.',
  gap:[{t:' LEAY -1,Y',ok:true,why:'Right: Y minus 1 = a step to the left. Try pressing left lots of times: at the wall the basket stops.'},
       {t:' LEAY 1,Y',ok:false,why:'The basket moves <b>right</b> with both arrows. Y plus 1 is a step to the right.'},
       {t:' LEAY -32,Y',ok:false,why:'Y minus 32 is one row <b>up</b>: the basket flies off the bottom row. (On the Dragon, on the 16th press it would go off the top of the screen, and trample other memory.)'}],onWin:()=>win14('1')});
progWindow12(document.getElementById('pw142'),{title:'Stage 2 · A falling apple',show:{wide:['X','U'],lamps:['Z']},keys:['SPACE'],speed:4,
  lines:PRG12.pw142(null).lines,gapq:'How does the apple move on each step? Choose the missing line.',
  gap:[{t:' LEAU 32,U',ok:true,why:'Right: plus 32 = one row down. The apple falls in about a second.'},
       {t:' LEAU 64,U',ok:false,why:'Plus 64 = two rows on each step. It gets to the same place, but it jumps instead of falling.'},
       {t:' LEAU 1,U',ok:false,why:'Plus 1 = a step to the right. The apple “crawls” along all the rows, until it reaches <bdi class="ltr">$05F0</bdi>. On the Dragon that takes about 25 seconds.'}],onWin:()=>win14('2')});
progWindow12(document.getElementById('pw143'),{title:'Stage 3 · Both together: caught or not?',show:SH14,keys:['←','→','Q'],speed:4,
  lines:PRG12.pw143(null).lines,sub:PRG12.pw143('').sub,gapq:'We asked the keyboard, and nothing was pressed (lamp Z is on). What now?',
  gap:[{t:' BEQ FALL',ok:true,why:'Right: nothing pressed? Skip moving the basket, straight to the apple. No waiting. Also try moving aside and missing: an N will appear.'},
       {t:' BEQ LOOP',ok:false,why:'With no key we go back to the start, and skip the apple too! It moves only when you press a key. (Q still quits.)'},
       {t:' BEQ KEY',ok:false,why:'With no key, the game ends at once. There is almost never a key pressed at the exact moment of the question.'}],onWin:()=>win14('3')});
progWindow12(document.getElementById('pw144'),{title:'Stage 4 · Score, and five apples',show:SH14,keys:['←','→','Q'],speed:4,
  lines:PRG12.pw144(null).lines,sub:PRG12.pw144('').sub,gapq:'The apple has reached the bottom row. How do we check whether it is in the basket?',
  gap:[{t:' LDA ,U',ok:true,why:'Right: we copy the square the apple lands on. Blue? Caught. Move aside, and see that the score doesn’t go up.'},
       {t:' LDA ,Y',ok:false,why:'That is the square of the basket itself, and there is always blue there. Every apple is “caught”, even when the basket is on the other side. A score of 5 without doing anything.'},
       {t:' LDA #$AF',ok:false,why:'With a hash sign it is not a copy: it is just the number <bdi class="ltr">$AF</bdi>. CMPA will always say “equal”, and every apple will be counted.'}],onWin:()=>win14('4')});
codePuzzle12(document.getElementById('pz141'),{tag:'Stage 5 · Each apple from somewhere else',post:PRG12.SUB14,start:PRG12.stage4text(),rows:16,
  q:'This is the program from stage 4. Change it: the first apple falls from column 16, like now. Each apple after it falls <b>13 columns to the right</b> of the one before. Gone past column 31? Carry on from the start (<code>ANDB #31</code> does that). Keep the column in a new house, <code>SEED</code>, which is already waiting for you after the fixed ending.<br><code>ANDB #31</code> cuts B down to a number from 0 to 31: it takes 32 away from it again and again, and keeps what is left. For example 29 plus 13 = 42, and that becomes 10.',
  cases:[{name:'Case 1: don’t touch the keyboard',keys:[],target:[[0,0x71],[0x1f0,0xaf]]},{name:'Case 2: straight away, the right arrow 13 times',keys:Array(13).fill('→'),target:[[0,0x71],[0x1fd,0xaf]]}],
  hint1:'Only the place where a new apple is born changes: the line <bdi class="ltr">MISS LDU #$0430</bdi>. Instead of it: take SEED into B, add 13, cut it with <bdi class="ltr">ANDB #31</bdi>, and store it back in SEED.',
  hint2:'And then: <bdi class="ltr">LDU #$0420</bdi> (the start of row 1) and <bdi class="ltr">LEAU B,U</bdi> (B steps to the right). And at the start, so that every game starts the same: <bdi class="ltr">LDB #16</bdi>, <bdi class="ltr">STB SEED</bdi>.',
  solution:PRG12.pz141.solution,onWin:()=>{ win14('5'); win14('6'); }});

/* ---------- chapter 15 ---------- */
progWindow12(document.getElementById('pw151'),{title:'The game “Catch”',tape:'CATCH',show:SH14,keys:['←','→','Q'],speed:4,lines:PRG12.game.lines,sub:PRG12.game.sub});
function fig151(){
  const box=(x,w,t1,t2,col)=>`<rect x="${x}" y="40" width="${w}" height="78" rx="12" fill="${col}"/>`+heb(x+w/2,72,t1,13,'#fff',700)+heb(x+w/2,96,t2,11.5,'#eee');
  let s=box(10,150,'The course','🐉 Send to the machine','#2f6fd0');
  s+=arrow(162,79,196,79)+box(198,150,'My tapes','The tape CATCH','#8e44ad');
  s+=arrow(350,79,384,79)+box(386,150,'The Dragon machine','CLOADM, then EXEC','#3b4048');
  s+=arrow(538,79,572,79)+box(574,170,'A real Dragon','🔊 a wav file','#6b0f1b');
  return svg(754,140,s);
}
put('fig151',fig151());
asmTool12(document.getElementById('tool15'),{tape:true,send:true,name:'MYGAME',rows:8,label:'Your program (as you typed it into DREAM, including the fixed ending and the houses after it):',tail:'none',start:PRG12.game.lines.concat(TAIL9,PRG12.game.sub).join('\n')+'\n'});
(function(){ // the certificate
  const h=document.getElementById('cert15'); let name=''; try{ name=localStorage.getItem('d32course-name')||''; }catch(e){}
  h.innerHTML='<div class="row cert-in"><label>Your name: <input class="certname" maxlength="30" value=""></label><button class="btn certgo">Make certificate</button><button class="btn ghost certpr">Print</button></div><div class="cert12" hidden></div>';
  const inp=h.querySelector('.certname'), c=h.querySelector('.cert12'); inp.value=name;
  const make=()=>{ const n=inp.value.trim(); if(!n){ inp.focus(); return; } try{ localStorage.setItem('d32course-name',n); }catch(e){}
    const d=new Date(), dt=d.getDate()+'.'+(d.getMonth()+1)+'.'+d.getFullYear(); let done={}; try{ done=store.get('done')||{}; }catch(e){}
    const marks=Array.from({length:16},(_,i)=>'<span class="cm'+(done[i]?' on':'')+'">'+i+'</span>').join('');
    c.hidden=false; c.innerHTML='<div class="c-top">🐉 Dragon 32 · 1982</div><div class="c-t">Certificate of completion</div><div class="c-n"></div><div class="c-b">has completed the course <b>Machine code for the Dragon 32</b>: from the first square on the screen to a whole game, “Catch”, written for the 6809 processor.</div><div class="c-m">'+marks+'</div><div class="c-d">'+dt+'</div>';
    c.querySelector('.c-n').textContent=n; win15('c'); };
  h.querySelector('.certgo').onclick=make; h.querySelector('.certpr').onclick=()=>{ if(c.hidden) make(); if(!c.hidden) window.print(); };
  if(name) make();
})();

/* ---------- "on the real Dragon" notes (what we saw on our machine) ---------- */
const OKM12='<span class="verified">✓ Checked on our Dragon machine</span>';
put('mach12','<b>What we saw on our Dragon machine:</b> every program in the chapter (including the three answers to “a line is missing”, both versions of example 3 and the solutions to the puzzles) was typed into DREAM, assembled with no errors (<code>0000</code>) and run. The screen was checked square by square, and it is the same as what the windows show. The numbers in memory are the same too, house by house. In DREAM you write exactly as here: <code>JSR DOT</code>, <code>PSHS A</code>, <code>PSHS A,B</code>, <code>PULS A</code>.<br>And what we measured on the stack: when the program starts, <code>S = $2E05</code>, and the top plate says <code>$6DD0</code>, the place where DREAM carries on. After asking the keyboard checker, S comes back to exactly the same place, and B, Y and U are not touched. With <code>BRA SQUARE</code> or <code>RTS</code> in the missing place in example 2, DREAM came back at once and the editor appeared on the screen.<br>And example 4 (a forgotten plate), on our Dragon machine: the A and the line appeared, and then everything froze. SPACE and BREAK didn’t help, and DREAM didn’t come back. At house <code>$412E</code> there were numbers that are not a program (<code>FF FF 00 00</code>...). The machine stayed stuck until we closed it. '+OKM12);
put('mach13','<b>What we saw on our Dragon machine:</b> after assembling in DREAM we read the machine’s memory, from <code>$2EE1</code>: for every program in the chapter (and every program in chapters 12 to 15) it holds exactly the numbers the windows here show. Changing a number was also really tested, on the machine: we left DREAM for BASIC, changed a house, and ran it. Each of the four tasks of example 3, and both puzzles, did exactly on the machine what the window shows.<br><b>Try it yourself:</b> assemble example 3 in DREAM, then <b>BREAK</b>, <b>Q</b>, ENTER. In BASIC: <code>PRINT PEEK(&amp;H2EE1)</code> answers <code>134</code>, which is <code>$86</code>: <code>LDA #</code>. <code>POKE &amp;H2EE2,66</code> writes 66 (<code>$42</code>, the letter B) into the second house. <code>CLS:EXEC &amp;H2EE1</code> runs the program, and a B appears on the screen. Press a key, and you are back at <code>OK</code>. To go back to DREAM: <code>EXEC &amp;H6080</code> (where DREAM starts), and then N. '+OKM12);
put('mach14','<b>What we saw on our Dragon machine:</b> all five stages, all three lines of each stage, and the solution to stage 5, were typed into DREAM, assembled with no errors (<code>0000</code>) and run. The keys were really pressed. The screen at the end is the same as the windows, square by square, and so are the numbers in memory. The timing was checked too: the apple went down a row every 0.18 to 0.19 seconds (the window works out 0.185), and landed after about 2.6 seconds. In stage 2 with <code>LEAU 1,U</code> it crawled for about 25 seconds. In the whole game we pressed the right arrow 13 times, fast: the basket reached column 29 within a second and a half, and the apples fell in columns 16, 29, 10, 23 and 4, exactly as in the window. The final score: 1. '+OKM12);
put('mach15','<b>What we saw on our Dragon machine:</b> the button <b>🐉 Send to the Dragon machine</b> was tested on the machine: the tape CATCH appeared in “My tapes”, <code>CLOADM "CATCH"</code> loaded it, <code>CLS:EXEC</code> ran the game, and the screen matched the window, square by square. A key brought us back to <code>OK</code>. The same went for a program from Chapter 12 and one from Chapter 2. '+OKM12+'<br>And the DREAM way too: we tested the whole way on the Dragon machine, except for the real Dragon itself. Assembling in DREAM, BREAK and Q, and then <code>CLS:EXEC &amp;H2EE1</code> ran the game straight from BASIC, and Q plus a key brought us back to <code>OK</code>. <code>CSAVEM "CATCH",&amp;H2EE1,&amp;H2F7A,&amp;H2EE1</code> made the tape CATCH in “My tapes”, with the ⬇ and 🔊 buttons. We wiped the game from memory (we wrote 0 in all its houses), loaded it back with <code>CLOADM "CATCH"</code>, and the houses came back exactly as we saved them. <code>CLS:EXEC</code> ran it, and <code>EXEC &amp;H6080</code> took us back to DREAM. '+OKM12+'<br>We haven’t yet tried the sound file on a real Dragon ourselves: the instructions in step 4 are the Dragon machine’s own; they are written there next to “My tapes”.');

/* ---------------- chapters are pages (site build) ---------------- */
const TABS=["ch0","ch1","ch2","ch3","ch4","ch5","ch6","ch7","ch8","ch9","ch10","ch11","ch12","ch13","ch14","ch15"];
const HERE=document.body.dataset.ch||'';
function showTab(id){ if(TABS.includes(id)&&id!==HERE) location.href="/en/learn/"+id+'/'; }
document.querySelectorAll('nav.toc a').forEach(a=>a.classList.toggle('on',a.dataset.tab===HERE));
if(HERE){ store.set('tab',HERE); const on=document.querySelector('nav.toc a.on'); const t=document.getElementById('toc'); if(on&&t) t.scrollLeft+=on.getBoundingClientRect().left-t.getBoundingClientRect().left-(t.clientWidth-on.offsetWidth)/2; }
document.querySelectorAll('.nextch').forEach(b=>b.onclick=()=>showTab(b.dataset.go));

/* =================== chapters 6–8: a small, honest 6809 ===================
   Only the instructions taught so far. Effects follow the 6809 programming manual:
   LDA/STA: N,Z from the byte, V=0, C unchanged.   LDX: N,Z from 16 bits, V=0.
   ADDA: N,Z,V,C (C = carry out of bit 7).          SUBA/CMPA: N,Z,V,C (C = borrow, i.e. A < operand unsigned). CMPA does not store.
   INCA/DECA/INC/DEC: N,Z,V — C unchanged.          CLRA: N=0 Z=1 V=0 C=0.
   LEAX: only Z.                                     CMPX: N,Z,V,C on 16 bits.
   Branches change nothing. BEQ Z=1, BNE Z=0, BLO C=1, BHS C=0, BRA always.
   Memory: only the screen ($0400–$05FF) is simulated; anything else stops with an explanation. */
const OPS2={
  LDA:{m:['imm','ext','idx']}, STA:{m:['ext','idx']}, ADDA:{m:['imm','ext','idx']}, SUBA:{m:['imm','ext','idx']},
  CMPA:{m:['imm','ext','idx']}, INCA:{m:['inh']}, DECA:{m:['inh']}, CLRA:{m:['inh']}, INC:{m:['ext','idx']}, DEC:{m:['ext','idx']},
  LDX:{m:['imm']}, CMPX:{m:['imm']}, LEAX:{m:['idx']},
  BEQ:{m:['rel']}, BNE:{m:['rel']}, BLO:{m:['rel']}, BHS:{m:['rel']}, BRA:{m:['rel']}
};
const OPCH={LDA:2,STA:2,LDX:7,LEAX:7,ADDA:6,SUBA:6,INCA:6,DECA:6,CLRA:6,INC:6,DEC:6,CMPA:8,CMPX:8,BEQ:8,BNE:8,BLO:8,BHS:8,BRA:8};
function parseNum2(t){
  t=t.trim(); let neg=false;
  if(t[0]==='-'){ neg=true; t=t.slice(1); }
  let v=null;
  if(/^\$[0-9A-F]+$/i.test(t)) v=parseInt(t.slice(1),16);
  else if(/^\d+$/.test(t)) v=parseInt(t,10);
  else if(/^'.$/.test(t)&&!neg){ const ch=t[1].toUpperCase(); const k=CHARS.indexOf(ch); v=k<0?null:(ch>='@'&&ch<='Z'? 0x40+k : k); }
  return v==null?null:(neg?-v:v);
}
const TAIL2=[/^KEY\s+LDX\s+\$A000\s*$/i,/^\s+JSR\s+,X\s*$/i,/^\s+BEQ\s+KEY\s*$/i,/^\s+RTS\s*$/i];
/* src: DREAM text (label in column 0, otherwise the line starts with a space). opt: {ops:[allowed], base:n (lines before the user's), lenient:bool} */
function asm2(src,opt={}){
  const prog=[], errs=[], labels={}, refs=[];
  const allowed=opt.ops?new Set(opt.ops):null;
  const all=src.split('\n'); const ti=all.findIndex(l=>TAIL2[0].test(l));
  if(ti>=0&&TAIL2.every((re,k)=>re.test(all[ti+k]||''))) all.splice(ti,4);
  all.forEach((raw,n)=>{
    const N='Line '+(n+1-(opt.base||0))+': ';
    const line=raw.replace(/\t/g,' ').replace(/\s+$/,'');
    if(!line.trim()||/^\s*\*/.test(line)) return;
    let label=null, rest=line;
    if(line[0]!==' '){
      const m=line.match(/^(\S+)\s*(.*)$/); label=m[1].toUpperCase(); rest=m[2];
      if(OPS2[label]&&!rest.match(/^[A-Za-z]{3,4}\b/)){ errs.push(N+'The line starts without a space, so DREAM will think '+L(label)+' is a <b>place name</b>, not a command. Add a space at the start of the line.'); return; }
      if(!/^(@|[A-Z][A-Z0-9]{0,5})$/.test(label)){ errs.push(N+'The name '+L(label)+' doesn’t fit. A place name is letters (digits may follow them), up to 6 characters, right at the start of the line.'); return; }
      if(label==='KEY'){ errs.push(N+'The name KEY is already taken: it is the name of the fixed ending.'); return; }
      if(labels[label]!=null){ errs.push(N+'The name '+L(label)+' appears twice. Each place needs its own name.'); return; }
      labels[label]=prog.length;
      if(!rest.trim()){ errs.push(N+'After the name '+L(label)+', the command is missing on the same line.'); return; }
    }
    const m=rest.trim().match(/^([A-Za-z]+)\s*(.*)$/);
    if(!m){ errs.push(N+'I don’t understand this line.'); return; }
    const op=m[1].toUpperCase(), arg=m[2].trim().toUpperCase();
    const spec=OPS2[op];
    if(!spec||(allowed&&!allowed.has(op))){ errs.push(N+(spec?'This window doesn’t use '+L(op)+' yet.':'We haven’t learnt '+L(op)+' yet (or is it a typo?).')); return; }
    const P={op,label,line:n,text:raw,argText:m[2].trim().toUpperCase()};
    if(spec.m[0]==='inh'){ if(arg){ errs.push(N+L(op)+' doesn’t need a number after it. It works on its own, on drawer A.'); return; } P.mode='inh'; prog.push(P); return; }
    if(!arg){ errs.push(N+'After '+L(op)+', a '+(spec.m[0]==='rel'?'place name is missing.':'number is missing.')); return; }
    if(spec.m[0]==='rel'){
      if(!/^(@|[A-Z][A-Z0-9]{0,5})$/.test(arg)){ errs.push(N+'After '+L(op)+' you write the name of a place in the program, for example '+L('KEY')+'.'); return; }
      P.mode='rel'; P.target=arg; refs.push([P,N]); prog.push(P); return;
    }
    if(arg[0]==='#'){
      if(!spec.m.includes('imm')){ errs.push(N+(op==='STA'?'STA takes no '+L('#')+'. It always writes to a house.':(op==='LEAX'?'LEAX takes no '+L('#')+'. You write how far to move, then '+L(',X')+', for example '+L('LEAX 1,X')+'.':L(op)+' doesn’t work with '+L('#')+'.'))); return; }
      const v=parseNum2(arg.slice(1)); if(v==null){ errs.push(N+'I don’t understand the number '+L(arg.slice(1))+'.'); return; }
      const big=(op==='LDX'||op==='CMPX');
      if(big){ if(v<0||v>65535){ errs.push(N+'The number is too big even for drawer X.'); return; } }
      else { if(v>255){ errs.push(N+'The number '+L(arg.slice(1))+' ('+v+') is too big for drawer A: only 0 to 255 fits.'); return; } if(v<-128){ errs.push(N+'The number is too small.'); return; } }
      P.mode='imm'; P.v=big?v:(v&255); prog.push(P); return;
    }
    if(arg.includes(',')){
      const mx=arg.match(/^(.*),\s*X(\+?)$/);
      if(!mx){ errs.push(N+'After the comma comes '+L('X')+': for example '+L(',X')+', '+L(',X+')+' or '+L('32,X')+'.'); return; }
      if(!spec.m.includes('idx')){ errs.push(N+L(op)+' doesn’t work with the finger X.'); return; }
      let off=0; if(mx[1].trim()){ off=parseNum2(mx[1]); if(off==null){ errs.push(N+'I don’t understand the '+L(mx[1])+' before the comma.'); return; } }
      if(mx[2]&&op==='LEAX'){ errs.push(N+'With LEAX you write how far to move, for example '+L('LEAX 1,X')+'.'); return; }
      if(mx[2]&&mx[1].trim()){ errs.push(N+'With '+L('+')+' after the X, you don’t write a number before the comma. Either '+L(',X+')+', or for example '+L('1,X')+'.'); return; }
      if(off<-32768||off>32767){ errs.push(N+'The move is too big.'); return; }
      P.mode='idx'; P.off=off; P.post=!!mx[2]; prog.push(P); return;
    }
    if(!spec.m.includes('ext')){ errs.push(N+(op==='LDX'||op==='CMPX'?'Here we use '+L(op)+' with '+L('#')+': '+L(op+' #'+arg)+'.':(op==='LEAX'?'With LEAX you write how far to move and then '+L(',X')+', for example '+L('LEAX 32,X')+'.':L(op)+' needs something else here.'))); return; }
    const a=parseNum2(arg); if(a==null||a<0){ errs.push(N+'I don’t understand the house number '+L(arg)+'.'); return; }
    if(a<0x400||a>0x5ff){ errs.push(N+'House '+L(arg)+' ('+a+') is not on the screen. On this page we only work with the screen squares ('+L('$0400')+' to '+L('$05FF')+').'); return; }
    P.mode='ext'; P.a=a; prog.push(P);
  });
  labels.KEY=prog.length;
  refs.forEach(([P,N])=>{ if(labels[P.target]==null) errs.push(N+'The program has no place called '+L(P.target)+'. (A place name is written right at the start of the line.)'); });
  return {prog,errs,labels};
}
function cpuNew(){ return {A:null,X:null,N:null,Z:null,V:null,C:null,mem:new Uint8Array(512).fill(0x60),pc:0,steps:0}; }
class CpuStop extends Error{}
/* one instruction; returns an event that describes what happened */
function cpuStep(st,prog,labels){
  const p=prog[st.pc]; const ev={p,old:{A:st.A,X:st.X,N:st.N,Z:st.Z,V:st.V,C:st.C}};
  const stop=m=>{ throw new CpuStop(m); };
  const needA=()=>{ if(st.A==null) stop('Drawer A holds a number we don’t know (we haven’t put anything in it yet). On the Dragon you would get something random here.'); };
  const needX=()=>{ if(st.X==null) stop('The finger X doesn’t point anywhere yet. First '+L('LDX #…')+'.'); };
  const ea=()=>{ if(p.mode==='ext') return p.a; needX(); return (st.X+(p.post?0:p.off))&0xFFFF; };
  const chk=(a,w)=>{ if(a<0x400||a>0x5ff) stop((w?'Writing to':'Reading from')+' house '+L(hex4(a))+' ('+a+'): it is not on the screen. '+(w?'On the Dragon this would write somewhere else in memory, and might break something.':'On this page you only see the screen.')); };
  const rd=a=>{ chk(a,false); return st.mem[a-0x400]; };
  const nz=(r,bits=8)=>{ st.N=!!(r&(bits===8?0x80:0x8000)); st.Z=(r===0); };
  const opnd=()=>{ if(p.mode==='imm') return p.v; const a=ea(); ev.ea=a; const v=rd(a); if(p.post){ st.X=(st.X+1)&0xFFFF; } return v; };
  switch(p.op){
    case 'LDA': { const v=opnd(); st.A=v; nz(v); st.V=false; ev.v=v; break; }
    case 'STA': { needA(); const a=ea(); chk(a,true); ev.ea=a; ev.prev=st.mem[a-0x400]; st.mem[a-0x400]=st.A; if(p.post) st.X=(st.X+1)&0xFFFF; nz(st.A); st.V=false; break; }
    case 'ADDA': { needA(); const m=opnd(), r=st.A+m; st.V=!!((st.A^r)&(m^r)&0x80); st.C=r>255; ev.m=m; ev.raw=r; st.A=r&255; nz(st.A); break; }
    case 'SUBA': case 'CMPA': { needA(); const m=opnd(), r=(st.A-m)&255; st.C=st.A<m; st.V=!!((st.A^m)&(st.A^r)&0x80); ev.m=m; ev.r=r; nz(r); if(p.op==='SUBA') st.A=r; break; }
    case 'INCA': { needA(); st.V=(st.A===0x7F); st.A=(st.A+1)&255; nz(st.A); break; }
    case 'DECA': { needA(); st.V=(st.A===0x80); st.A=(st.A-1)&255; nz(st.A); break; }
    case 'CLRA': { st.A=0; st.N=false; st.Z=true; st.V=false; st.C=false; break; }
    case 'INC': case 'DEC': { const a=ea(); chk(a,true); ev.ea=a; const o=st.mem[a-0x400]; ev.prev=o; const r=(o+(p.op==='INC'?1:255))&255; st.V=(p.op==='INC'?o===0x7F:o===0x80); st.mem[a-0x400]=r; if(p.post) st.X=(st.X+1)&0xFFFF; nz(r); break; }
    case 'LDX': { st.X=p.v; nz(p.v,16); st.V=false; break; }
    case 'LEAX': { needX(); st.X=(st.X+p.off)&0xFFFF; st.Z=(st.X===0); break; }
    case 'CMPX': { needX(); const m=p.v, r=(st.X-m)&0xFFFF; st.C=st.X<m; st.V=!!((st.X^m)&(st.X^r)&0x8000); nz(r,16); ev.m=m; ev.r=r; break; }
    default: { // branches
      const f={BEQ:'Z',BNE:'Z',BLO:'C',BHS:'C'}[p.op];
      if(f&&st[f]==null) stop('Lamp '+f+' hasn’t come on or gone off since the program started, so we can’t know which way to turn. First a comparison (CMPA).');
      const take= p.op==='BRA' || (p.op==='BEQ'&&st.Z) || (p.op==='BNE'&&!st.Z) || (p.op==='BLO'&&st.C) || (p.op==='BHS'&&!st.C);
      ev.take=take; if(take){ st.pc=labels[p.target]; st.steps++; return ev; }
    }
  }
  st.pc++; st.steps++; return ev;
}
/* run to the end. returns {st, err} */
function cpuRun(prog,labels,st,limit=20000){
  st=st||cpuNew();
  try{ while(st.pc<prog.length){ if(st.steps>=limit) return {st,err:'The program ran '+limit+' steps and didn’t reach the end. Probably a crossroads that always sends you back: a loop without end. On the Dragon the screen would just freeze.'}; cpuStep(st,prog,labels); } return {st,err:null}; }
  catch(e){ if(e instanceof CpuStop) return {st,err:e.message}; throw e; }
}

/* ---------------- the CPU picture: drawers A and X, lamps ---------------- */
function finger(x,y,s=1,dir='down'){ // a pointing hand, finger tip at (x,y)
  const rot={down:0,left:90,up:180,right:-90}[dir];
  return `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})">
  <rect x="-5" y="-30" width="10" height="27" rx="5" fill="#f6c99a" stroke="#7a4a1c" stroke-width="1.6"/>
  <path d="M-3 -9 h6" stroke="#c98a5a" stroke-width="1.2"/>
  <rect x="-13" y="-52" width="28" height="26" rx="8" fill="#f6c99a" stroke="#7a4a1c" stroke-width="1.6"/>
  <path d="M-7 -44 v10 M1 -46 v10 M9 -44 v9" stroke="#c98a5a" stroke-width="1.4" stroke-linecap="round"/>
  <rect x="-11" y="-62" width="24" height="12" rx="3" fill="#2f6fd0"/>
  </g>`;
}
const LAMPINFO={N:'lamp 128',Z:'zero / equal',C:'carry wheel'};
function cpuBox2(o){
  const show=o.show||{}; const lamps=show.lamps||[];
  let s=`<rect x="6" y="6" width="308" height="${lamps.length?226:178}" rx="16" fill="#3b4048" stroke="#22252a" stroke-width="3"/>
  <rect x="20" y="16" width="280" height="24" rx="6" fill="#2a2e34"/>
  <text x="160" y="33" text-anchor="middle" ${FT} font-size="13.5" fill="#cfd6df" direction="ltr">The 6809 processor</text>
  <g class="drawerA">
   <rect x="18" y="50" width="128" height="74" rx="8" fill="#c99a5b" stroke="#7a5428" stroke-width="3"/>
   <rect x="58" y="114" width="46" height="7" rx="3.5" fill="#7a5428"/>
   <circle cx="36" cy="68" r="12" fill="#ffd23f"/><text x="36" y="74" text-anchor="middle" ${FM} font-size="15" font-weight="700" fill="#222">A</text>
   <rect class="aval-bg" x="52" y="58" width="86" height="46" rx="5" fill="#2f3a2c"/>
   <text class="aval" x="95" y="86" text-anchor="middle" ${FM} font-size="21" fill="#f1f1e6">?</text>
   <text class="adec" x="95" y="100" text-anchor="middle" ${FM} font-size="10" fill="#b9c8b0"></text>
  </g>`;
  if(show.x){
    s+=`<g class="drawerX">
   <rect x="154" y="50" width="148" height="74" rx="8" fill="#b7895a" stroke="#6e4a22" stroke-width="3"/>
   <rect x="206" y="114" width="46" height="7" rx="3.5" fill="#6e4a22"/>
   <circle cx="172" cy="68" r="12" fill="#9fc6ff"/><text x="172" y="74" text-anchor="middle" ${FM} font-size="15" font-weight="700" fill="#222">X</text>
   <rect class="xval-bg" x="188" y="58" width="106" height="46" rx="5" fill="#2f3a2c"/>
   <text class="xval" x="241" y="86" text-anchor="middle" ${FM} font-size="20" fill="#f1f1e6">?</text>
   <text class="xdec" x="241" y="100" text-anchor="middle" ${FM} font-size="10" fill="#b9c8b0"></text>
   ${finger(172,112,0.42)}
  </g>`;
  } else {
    s+=`<path d="M156 50 Q190 44 226 52 Q262 46 302 54 L302 124 Q268 118 232 126 Q196 120 156 126 Z" fill="#8c7aa8" stroke="#5e4f78" stroke-width="2"/>
   <text x="229" y="84" text-anchor="middle" ${FT} font-size="12" fill="#fff" direction="ltr">More drawers</text>
   <text x="229" y="102" text-anchor="middle" ${FT} font-size="12" fill="#fff" direction="ltr">under the cloth</text>`;
  }
  s+=`<text x="160" y="148" text-anchor="middle" ${FT} font-size="12" fill="#cfd6df" direction="ltr">${show.x?'A holds a small number, X a house number':'Drawer A: one number, 0 to 255'}</text>`;
  if(lamps.length){
    s+=`<rect x="20" y="158" width="280" height="64" rx="10" fill="#23262b"/>`;
    const n=lamps.length, gap=280/n;
    lamps.forEach((f,k)=>{ const cx=20+gap*k+gap/2;
      s+=`<g class="lamp lamp${f}"><circle class="bulb" cx="${cx}" cy="182" r="13" fill="#4a4f57" stroke="#15171a" stroke-width="2"/>
      <text class="lq" x="${cx}" y="187" text-anchor="middle" ${FM} font-size="13" font-weight="700" fill="#cfd6df">?</text>
      <text x="${cx-20}" y="187" text-anchor="end" ${FM} font-size="15" font-weight="700" fill="#ffd23f">${f}</text>
      <text x="${cx}" y="213" text-anchor="middle" ${FT} font-size="11" fill="#aab3bd" direction="ltr">${LAMPINFO[f]}</text></g>`; });
  }
  return s;
}
function paintCpu(root,st,show){
  const q=s=>root.querySelector(s);
  q('.aval').textContent=st.A==null?'?':hex2(st.A); q('.adec').textContent=st.A==null?'':st.A+(st.A>=0x40&&st.A<0x5b?'  '+CHARS[st.A&63]:'');
  if(show.x){ q('.xval').textContent=st.X==null?'?':hex4(st.X); q('.xdec').textContent=st.X==null?'':String(st.X); }
  (show.lamps||[]).forEach(f=>{ const g=q('.lamp'+f); if(!g) return; const v=st[f];
    const b=g.querySelector('.bulb'), t=g.querySelector('.lq');
    b.setAttribute('fill', v==null?'#4a4f57':(v?'#ffb020':'#1b1d21')); b.setAttribute('filter',''); b.style.filter=v?'drop-shadow(0 0 6px #ffb020)':'';
    t.textContent=v==null?'?':(v?'':''); });
}
function blink(el){ if(!el) return; el.style.transition='filter .15s'; el.style.filter='brightness(1.35)'; setTimeout(()=>el.style.filter='',320); }

/* a screen that can also show where the finger X points */
class Screen2 extends Screen{
  draw(){ super.draw(); const f=this.finger; if(f==null||f<0||f>511||!this.ctx) return;
    const c=this.ctx, {x,y}=this.xy(f), w=this.cw, h=this.chh;
    c.strokeStyle='#2f6fd0'; c.lineWidth=2.5; c.strokeRect(x-1.5,y-1.5,w+3,h+3);
    const fx=x+w/2, s=h*1.15/62;
    c.save(); c.translate(fx,y-1); c.scale(s,s);
    c.fillStyle='#f6c99a'; c.strokeStyle='#7a4a1c'; c.lineWidth=2;
    const rr=(X,Y,W,H,R)=>{ c.beginPath(); c.moveTo(X+R,Y); c.arcTo(X+W,Y,X+W,Y+H,R); c.arcTo(X+W,Y+H,X,Y+H,R); c.arcTo(X,Y+H,X,Y,R); c.arcTo(X,Y,X+W,Y,R); c.closePath(); c.fill(); c.stroke(); };
    rr(-5,-30,10,28,5); rr(-13,-52,28,26,8);
    c.fillStyle='#2f6fd0'; c.fillRect(-11,-62,24,11);
    c.restore();
  }
}

/* ---------------- program window with STEP (chapters 6+) ---------------- */
function codeLine(l){ const m=l.match(/^(\S*)\s+(\w+)\s*(.*)$/); if(!m) return l; return (m[1]?'<span class="lbl">'+m[1]+'</span>':'')+' '+'<span class="op">'+m[2]+'</span> <span class="arg">'+m[3]+'</span>'; }
function flagNote(ev,st,lamps,skip=[]){
  const out=[];
  lamps.forEach(f=>{ if(skip.includes(f)) return; const a=ev.old[f], b=st[f]; if(a===b) return;
    out.push('lamp '+f+(b?' came on':(a==null?' off':' went off'))); });
  return out.length?' <span class="fl">('+out.join(', ')+')</span>':'';
}
function stepText(ev,st,lamps){
  const p=ev.p, o=ev.old, A0=o.A, X0=o.X;
  const nm=v=>L(hex2(v))+' ('+v+(v>=0x40&&v<0x5b?', '+CHARS[v&63]:'')+')';
  const where=()=> p.mode==='ext'? 'in house '+L(hex4(ev.ea)) : (p.off? 'in the house next to the finger: X '+(p.off>0?'plus ':'minus ')+Math.abs(p.off)+' = '+L(hex4(ev.ea)) : 'in the house the finger points at ('+L(hex4(ev.ea))+')');
  const post=p.post?' Then the finger moves one step right: X = '+L(hex4(st.X))+'.':'';
  let t='';
  const head=L(p.op+(p.argText?' '+p.argText:''))+': ';
  switch(p.op){
    case 'LDA': t= p.mode==='imm'? 'Put '+nm(st.A)+' in drawer A.' : 'Copy what is written '+where()+': '+nm(st.A)+', and put it in drawer A.'+post; break;
    case 'STA': t='Write what is in drawer A ('+L(hex2(st.A))+') '+where()+'. Drawer A still holds '+L(hex2(st.A))+'.'+post; break;
    case 'ADDA': t= L(hex2(A0))+' plus '+L(hex2(ev.m))+(p.mode!=='imm'?' (what is written '+where()+')':'')+' = '+(ev.raw>255? L('$'+ev.raw.toString(16).toUpperCase())+'. That doesn’t fit in two digits! The drawer keeps only '+L(hex2(st.A))+', and the wheel that came out lights up lamp C.' : L(hex2(st.A))+'. It fits, so lamp C is off.'); break;
    case 'SUBA': t= L(hex2(A0))+' minus '+L(hex2(ev.m))+(p.mode!=='imm'?' (what is written '+where()+')':'')+' = '+(st.C? 'Below zero! The drawer turns backwards like an odometer: '+L(hex2(st.A))+', and lamp C comes on.' : L(hex2(st.A))+'. We didn’t pass zero, so lamp C is off.'); break;
    case 'INCA': t='Drawer A goes up by 1: '+L(hex2(A0))+' → '+L(hex2(st.A))+'.'+(A0===255?' The odometer rolled over! But INCA <b>doesn’t touch</b> lamp C.':''); break;
    case 'DECA': t='Drawer A goes down by 1: '+L(hex2(A0))+' → '+L(hex2(st.A))+'.'+(A0===0?' The odometer rolled over backwards! But DECA doesn’t touch lamp C.':''); break;
    case 'CLRA': t='Put 0 in drawer A: '+L('$00')+'. (It also turns lamp C off.)'; break;
    case 'INC': case 'DEC': t=(p.op==='INC'?'Add 1 to':'Take 1 off')+' the number '+where()+': '+L(hex2(ev.prev))+' → '+L(hex2(st.mem[ev.ea-0x400]))+'. Drawer A took no part.'; break;
    case 'LDX': t='Put '+L(hex4(st.X))+' ('+st.X+') in drawer X. The finger now points at this house'+(st.X>=0x400&&st.X<=0x5ff?' (row '+((st.X-0x400)>>5)+', column '+((st.X-0x400)&31)+').':'.'); break;
    case 'LEAX': { const d=p.off; t='Move the finger '+(d===1?'one step right':d===-1?'one step left':d===32?'one row down':d===-32?'one row up':(d>=0?'forward ':'back ')+Math.abs(d)+' houses')+': '+L(hex4(X0))+' → '+L(hex4(st.X))+'.'; break; }
    case 'CMPA': t='Compare A ('+L(hex2(st.A))+') with '+L(hex2(ev.m))+(p.mode!=='imm'?' (what is written '+where()+')':'')+'. '+(st.Z?'<b>Equal</b>: lamp Z comes on.':(st.C?'A is <b>smaller</b>: lamp C comes on, and lamp Z is off.':'A is <b>bigger</b>: lamps Z and C are off.'))+' Drawer A did not change.'; break;
    case 'CMPX': t='Compare X ('+L(hex4(st.X))+') with '+L(hex4(ev.m))+'. '+(st.Z?'<b>Equal</b>: lamp Z comes on.':(st.C?'X is still <b>smaller</b>: lamp Z is off (and C is on).':'X is <b>bigger</b>: lamps Z and C are off.')); break;
    case 'BRA': t='Always turn: jump to '+(p.target==='KEY'?'<b>KEY</b>, the fixed ending.':L(p.target)+'.'); break;
    default: { const f={BEQ:'Z',BNE:'Z',BLO:'C',BHS:'C'}[p.op], on=st[f];
      const cond={BEQ:'If lamp Z is on (equal)',BNE:'If lamp Z is off (not equal)',BLO:'If lamp C is on (A is smaller)',BHS:'If lamp C is off (A is bigger or equal)'}[p.op];
      t=cond+', turn to '+(p.target==='KEY'?'<b>KEY</b> (the fixed ending)':L(p.target))+'. Lamp '+f+' is '+(on?'on':'off')+', so '+(ev.take?'we <b>turn</b>. ↪':'we <b>carry straight on</b> to the next line. ↓'); }
  }
  const skip={ADDA:['C'],SUBA:['C'],CMPA:['Z','C'],CMPX:['Z','C'],CLRA:['C']}[p.op]||[];
  return head+t+flagNote(ev,st,lamps,skip);
}
function progWindow2(host,cfg){
  const show=cfg.show||{lamps:['C']}; const lamps=show.lamps||[];
  const variants=cfg.variants||null;
  host.innerHTML=`<div class="prog"><div class="prog-title"><span>${cfg.title}</span><span>✓ Checked in DREAM on our Dragon machine</span></div>
    ${cfg.predict?'<div class="predict"><div class="q">🤔 Guess first: '+cfg.predict.q+'</div><div class="opts"></div><div class="fb pfb"></div></div>':''}
    ${cfg.gap?'<div class="gapopts"><div class="q">'+(cfg.gapq||'Which line is missing?')+'</div><div class="opts gopts"></div><div class="fb gfb"></div></div>':''}
    ${variants?'<div class="variants"><div class="q">'+(cfg.varq||'Choose:')+'</div><div class="opts vopts"></div></div>':''}
    <div class="prog-body"><ol class="code"></ol><div class="cpu">${svg(320,lamps.length?238:190,cpuBox2({show}),300)}</div><div class="scr-cell"><div class="scr"></div></div></div>
    <div class="stepsay"><div class="box"></div></div>
    <div class="ctrls"><button class="btn st">Step ▶</button><button class="btn ghost run">Run all</button><button class="btn ghost rs">From the start ↺</button>${cfg.fast?'<button class="btn ghost fast">Fast ⚡</button>':''}</div></div>`;
  const P=host.querySelector('.prog'), pfb=P.querySelector('.pfb')||document.createElement('div'), ol=P.querySelector('ol.code'), sayb=P.querySelector('.stepsay .box'), cpuEl=P.querySelector('.cpu');
  const sc=new Screen2(P.querySelector('.scr'),{labels:true,hexcols:true,interactive:!!(cfg.predict&&cfg.predict.cell),onClick:i=>pickCell(i),onHover:()=>{}});
  let lines=(variants?variants[0].lines:cfg.lines).slice(), guess=null, busy=false, gapOk=!cfg.gap, stopped=false, ended=false, A, st, prog, labels;
  sendBtn(P,host,cfg,()=>({lines,tail:'real'}));
  const btnS=P.querySelector('.st'), btnR=P.querySelector('.run');
  function build(){ const r=asm2(lines.filter(l=>l!=null).join('\n')); prog=r.prog; labels=r.labels; if(r.errs.length) console.warn(cfg.title,r.errs); }
  function renderCode(){
    ol.innerHTML='';
    let k=0;
    lines.forEach(l=>{ const li=document.createElement('li');
      if(l===null){ li.className='gap'; li.textContent='  ???'; }
      else { li.innerHTML=codeLine(l); li.dataset.k=k; if(st&&!ended&&k===st.pc) li.classList.add('cur'); k++; }
      ol.appendChild(li); });
    const t=document.createElement('li'); t.className='tail'; t.innerHTML='<span class="ltr">KEY</span> … the fixed ending (waits for a key)'; if(st&&st.pc>=prog.length) t.classList.add('cur'); ol.appendChild(t);
  }
  function paint(){ paintCpu(cpuEl,st,show); sc.finger=show.x&&st.X!=null?st.X-0x400:null; sc.draw(); }
  function reset(){ build(); st=cpuNew(); stopped=false; ended=false; sc.clear(); paint(); renderCode();
    sayb.innerHTML=lines.includes(null)?'First choose the missing line.':'The screen is clear, as in DREAM before a run. '+(show.x?'The drawers hold':'The drawer holds')+' numbers we don’t know, so “?”. The lamps aren’t known yet either. Press <b>Step</b>.'; lock(); }
  function lock(){ const need=(cfg.predict&&guess==null)||!gapOk; const fin=ended||stopped; btnS.disabled=need||busy||fin; btnR.disabled=need||busy||fin; const bf=P.querySelector('.fast'); if(bf) bf.disabled=need||busy||fin; if(need&&cfg.predict&&guess==null) sayb.innerHTML='👆 Guess first, then we run it.'; }
  async function step(quick){
    if(busy) return; busy=true; lock();
    if(st.pc>=prog.length){ sayb.innerHTML='The program has reached <b>KEY</b>, the fixed ending, and waits for a key. On the Dragon: you look, press a key, and go back to the editor.'; ended=true; renderCode(); busy=false; lock(); reveal(); return; }
    const li=ol.querySelector('li[data-k="'+st.pc+'"]');
    let ev; try{ ev=cpuStep(st,prog,labels); }catch(e){ if(!(e instanceof CpuStop)) throw e; sayb.innerHTML='⚠️ '+e.message; if(li) li.style.background='#5a1d18'; stopped=true; busy=false; lock(); return; }
    const p=ev.p;
    if(!quick){
      const aR=()=>P.querySelector('.aval-bg').getBoundingClientRect(), xR=()=>P.querySelector('.xval-bg').getBoundingClientRect();
      const fr=li?li.getBoundingClientRect():aR();
      if(p.op==='LDA'&&p.mode==='imm') await fly(fr,aR(),hex2(st.A));
      else if(p.op==='LDA'){ sc.marks={}; sc.marks[ev.ea-0x400]='#9fc6ff'; sc.draw(); await fly(sc.cellRect(ev.ea-0x400),aR(),hex2(st.A)); sc.marks={}; }
      else if(p.op==='STA'){ await fly(aR(),sc.cellRect(ev.ea-0x400),hex2(st.A)); }
      else if(p.op==='LDX') await fly(fr,xR(),hex4(st.X));
      else if((p.op==='ADDA'||p.op==='SUBA'||p.op==='CMPA')&&p.mode!=='imm'){ await fly(sc.cellRect(ev.ea-0x400),aR(),hex2(ev.m)); }
      else if(p.op==='ADDA'||p.op==='SUBA'||p.op==='CMPA') await fly(fr,aR(),(p.op==='ADDA'?'+':p.op==='SUBA'?'−':'?')+hex2(p.v));
    }
    if((p.op==='STA'||p.op==='INC'||p.op==='DEC')) sc.set(ev.ea-0x400,st.mem[ev.ea-0x400],!quick);
    paint(); if(!quick){ blink(P.querySelector(p.op==='LDX'||p.op==='LEAX'||p.op==='CMPX'?'.drawerX':'.drawerA')); }
    sayb.innerHTML=stepText(ev,st,lamps);
    renderCode(); busy=false; lock();
  }
  async function runAll(){ stopped=false; while(!ended&&!stopped){ await step(); await sleep(260); } }
  async function fast(){ stopped=false; let n=0; while(!ended&&!stopped){ await step(true); if(++n%2===0) await sleep(30); } }
  function pickCell(i){ if(!cfg.predict||!cfg.predict.cell||st.steps>0) return; guess=i; sc.marks={}; sc.marks[i]='#ff9b2f'; sc.draw(); pfb.className='fb pfb'; pfb.innerHTML='Your guess is marked with an orange frame (house '+L(hex4(0x400+i))+'). Now run it.'; lock(); sayb.innerHTML='Good. Now press <b>Step</b>.'; }
  function reveal(){
    if(!cfg.predict||guess==null) return;
    const right=cfg.predict.cell? cfg.predict.check(guess): guess===cfg.predict.a;
    pfb.className='fb pfb '+(right?'ok':'no'); pfb.innerHTML=(right?'✓ You were right! ':'✗ Not quite. ')+cfg.predict.why;
    if(cfg.predict.cell){ sc.marks={}; sc.draw(); }
  }
  if(cfg.predict){
    const po=P.querySelector('.predict .opts');
    if(cfg.predict.cell){ po.innerHTML='<span class="chip">Click the square on the screen below</span>'; }
    else cfg.predict.opts.forEach((o,k)=>{ const b=document.createElement('button'); b.className='opt'; b.innerHTML=o; b.onclick=()=>{ if(st.steps>0) return; guess=k; po.querySelectorAll('.opt').forEach(x=>x.style.borderColor=''); b.style.borderColor='var(--warm)'; pfb.innerHTML='Chosen. Now run it and see.'; lock(); sayb.innerHTML='Press <b>Step</b>.'; }; po.appendChild(b); });
  }
  if(cfg.gap){
    const gi=lines.indexOf(null), go=P.querySelector('.gopts'), gfb=P.querySelector('.gfb');
    cfg.gap.forEach(g=>{ const b=document.createElement('button'); b.className='opt'; b.innerHTML=L(g.t.trim()); b.onclick=()=>{
      go.querySelectorAll('.opt').forEach(x=>x.classList.remove('right','wrong')); b.classList.add(g.ok?'right':'wrong');
      gfb.className='fb '+(g.ok?'ok':'no'); gfb.innerHTML=g.why; lines[gi]=g.t; gapOk=true; reset(); sayb.innerHTML=g.ok?'The line is in place. Press <b>Step</b> and see.':'This line is in place. Run it and see what comes out, then try another line.'; if(g.ok&&cfg.onWin) cfg.onWin(); }; go.appendChild(b); });
  }
  if(variants){
    const vo=P.querySelector('.vopts');
    variants.forEach((v,k)=>{ const b=document.createElement('button'); b.className='opt'+(k===0?' sel':''); b.innerHTML=v.label; b.onclick=()=>{ vo.querySelectorAll('.opt').forEach(x=>x.classList.remove('sel')); b.classList.add('sel'); lines=v.lines.slice(); reset(); if(cfg.onVariant) cfg.onVariant(k); }; vo.appendChild(b); });
  }
  btnS.onclick=()=>step(); btnR.onclick=runAll; P.querySelector('.rs').onclick=()=>reset(); const bf=P.querySelector('.fast'); if(bf) bf.onclick=fast;
  reset();
}

/* ---------------- write-it-yourself puzzles (chapters 6+) ----------------
   cfg.cases: [{name, pre:[lines], target:[[i,v],...]}]  — the program must give the target in every case. */
function codePuzzle2(host,cfg){
  const cases=cfg.cases;
  const multi=cases.length>1;
  const preShow=cfg.preShow||cases[0].pre||[];
  const preHtml=preShow.length?`<ol class="code locked">${preShow.map(l=>'<li>'+codeLine(l)+'</li>').join('')}<li class="tail">🔒 ${cfg.preNote||'These lines are already written. Carry on below them:'}</li></ol>`:'';
  host.innerHTML=`<span class="tag">${cfg.tag}</span><p>${cfg.q}</p>
   <div class="lbl">Your program${cfg.ops?' · allowed: '+cfg.ops.map(o=>'<bdi class="ltr">'+o+'</bdi>').join(', '):''}</div>${preHtml}
   <textarea class="src" spellcheck="false" autocapitalize="characters" autocomplete="off">${cfg.start||''}</textarea>
   <div class="row" style="margin-top:6px"><button class="btn go">Run and check</button><button class="btn ghost sol">Solution</button><span class="soft">A line without a name starts with a space.</span></div>
   <div class="cases"></div>
   <details><summary>Hint 1</summary><p>${cfg.hint1}</p></details><details><summary>Hint 2</summary><p>${cfg.hint2}</p></details>
   <div class="fb res"></div>`;
  const box=host.querySelector('.cases');
  const views=cases.map((c,k)=>{
    const d=document.createElement('div'); d.className='case';
    d.innerHTML=(multi?'<div class="case-h">'+c.name+'</div>':'')+`<div class="pz-grid"><div><div class="lbl">This is how it should look${multi?'':''}:</div><div class="tgt"></div><div class="info tinfo">Hover or tap the picture to see numbers</div></div><div><div class="lbl">Your screen after the run:</div><div class="mine"></div></div></div>`;
    box.appendChild(d);
    const T=new Uint8Array(512).fill(0x60); c.target.forEach(([i,v])=>T[i]=v);
    const ti=d.querySelector('.tinfo');
    const tg=new Screen(d.querySelector('.tgt'),{labels:true,hexcols:true,interactive:true,onHover:i=>{ ti.innerHTML=i<0?'Hover or tap the picture to see numbers':cellInfo(tg.mem,i); },onClick:i=>{ ti.innerHTML=cellInfo(tg.mem,i); }});
    tg.mem.set(T); tg.draw();
    const mine=new Screen(d.querySelector('.mine'),{labels:true,hexcols:true});
    return {T,tg,mine,c};
  });
  const ta=host.querySelector('textarea'), res=host.querySelector('.res');
  host.querySelector('.sol').onclick=()=>{ ta.value=cfg.solution; res.className='fb res'; res.innerHTML='That’s one solution. If you wrote a different one that works, it’s right too. Press “Run and check”.'; };
  host.querySelector('.go').onclick=async ()=>{
    let user=ta.value.replace(/\r/g,'');
    const userLines=user.split('\n');
    const msgs=[]; let allOk=true, nUser=0;
    for(const v of views){
      const pre=v.c.pre||[];
      const r=asm2(pre.concat(userLines).join('\n'),{base:pre.length});
      if(r.errs.length){ res.className='fb res no'; res.innerHTML=r.errs.map(e=>'⚠️ '+e).join('<br>'); return; }
      const mineProg=r.prog.filter(p=>p.line>=pre.length); nUser=mineProg.length;
      if(!mineProg.length){ res.className='fb res no'; res.innerHTML='You haven’t written any lines yet.'; return; }
      const bad=cfg.ops&&mineProg.find(p=>!cfg.ops.includes(p.op));
      if(bad){ res.className='fb res no'; res.innerHTML='⚠️ In this puzzle you may only use: '+cfg.ops.map(o=>L(o)).join(', ')+'. '+L(bad.op)+' is not on the list.'; return; }
      const ruleMsg=cfg.rule&&cfg.rule(mineProg); if(ruleMsg){ res.className='fb res no'; res.innerHTML='⚠️ '+ruleMsg; return; }
      const out=cpuRun(r.prog,r.labels);
      v.mine.mem.set(out.st.mem); v.mine.marks={};
      let diff=0; for(let i=0;i<512;i++) if(v.mine.mem[i]!==v.T[i]){ diff++; v.mine.marks[i]='#c0392b'; } v.mine.draw();
      if(out.err){ allOk=false; msgs.push((multi?v.c.name+': ':'')+'⚠️ '+out.err); continue; }
      if(diff){ allOk=false; msgs.push((multi?v.c.name+': ':'')+diff+' squares are not as in the picture (marked in red).'); }
      await sleep(120);
    }
    if(allOk){ res.className='fb res ok'; res.innerHTML='✓ '+(multi?'In every case the screen matches the picture!':'The screen matches the picture!')+' '+(nUser<=cfg.best?'And in the shortest way: '+nUser+' lines.':'You did it in '+nUser+' lines. Challenge: it can also be done in '+cfg.best+'.')+' <span class="badge">★ Solved</span>'; if(!host._won){ host._won=1; cfg.onWin&&cfg.onWin(); } }
    else { res.className='fb res no'; res.innerHTML='Almost! '+msgs.join('<br>'); }
  };
}

/* =================== chapters 6–8 =================== */
const V678=[]; // every runnable program on these pages (checked on our machine, see course-src/verify678.mjs)
const SH6={lamps:['C']}, SH7={x:true,lamps:['C']}, SH8={x:true,lamps:['N','Z','C']};
function pw2(id,cfg){
  const el=document.getElementById(id); if(!el) return;
  if(cfg.variants) cfg.variants.forEach((v,k)=>V678.push({name:id+'_v'+k,lines:v.lines}));
  else if(cfg.gap) cfg.gap.forEach((g,k)=>V678.push({name:id+'_g'+k,lines:cfg.lines.map(l=>l===null?g.t:l)}));
  else V678.push({name:id,lines:cfg.lines});
  progWindow2(el,cfg);
}
function pz2(id,cfg){
  const el=document.getElementById(id); if(!el) return;
  cfg.cases.forEach((c,k)=>V678.push({name:id+'_c'+k,lines:(c.pre||[]).concat(cfg.solution.replace(/\n$/,'').split('\n')),target:c.target}));
  codePuzzle2(el,cfg);
}
const B=s=>'<bdi class="ltr">'+s+'</bdi>';
const txt=(s,base)=>[...s].map((ch,k)=>[base+k,0x40+CHARS.indexOf(ch)]);

Object.assign(QUIZ,{
  q6a:{q:'Drawer A holds '+B('$41')+' (A). What will it hold after '+B('DECA')+'?',opts:[B('$40')+' (@)',B('$42')+' (B)',B('$3F')],a:0,
       why:['Right! DECA takes away 1: '+B('$41')+' minus 1 = '+B('$40')+'. And before A comes @.','That’s INCA. DECA goes backwards.',''+B('$41')+' minus 1: only the right wheel moves, from 1 to 0.']},
  q6b:{q:'Drawer A holds '+B('$BF')+' (a full red block). What will it hold after '+B('ADDA #$10')+'?',opts:[B('$CF')+': a full white block',B('$C0')+': a black square',B('$BF')+': still red'],a:0,
       why:['Right! '+B('$10')+' moves only the left wheel: B → C. The next colour (white), the same lamps (F).',''+B('$10')+' doesn’t touch the right wheel. The lamps stay F.','ADDA always changes the drawer (except '+B('ADDA #0')+').']},
  q7a:{q:'The finger points at '+B('$0500')+'. Where will '+B('STA 33,X')+' write?',opts:[B('$0521')+': one row down and one step right',B('$0533'),B('$0500')],a:0,
       why:['Right! 33 = 32 + 1: one row down and one step right, on the diagonal. And the finger stays on '+B('$0500')+'.','33 is an ordinary number, without '+B('$')+'. 33 = '+B('$21')+'.',''+B('33,X')+' writes next to the finger, not on it.']},
  q8a:{q:'After '+B('LDA $0400')+' lamp N is on. What is in house '+B('$0400')+'?',opts:['A colour square','A letter','An empty square'],a:0,
       why:['Right! N on = lamp 128 on = the number is 128 or more ('+B('$80')+' to '+B('$FF')+'). Those are exactly the colour squares.','Letters are below 128 (for example A = 65), so N would be off.','An empty square is '+B('$60')+' = 96, less than 128.']},
  q8b:{q:'Drawer A holds '+B('$41')+' (A). After '+B('CMPA #$41')+', what will '+B('BHS')+' do?',opts:['Turn','Carry straight on'],a:0,
       why:['Right! They are equal, so A is not smaller, and lamp C is off. BHS means “higher <b>or same</b>”, and it turns.','Equal counts as “higher or same”. Lamp C is off, and BHS turns when C is off.']}
});
['q6a','q6b','q7a','q8a','q8b'].forEach(k=>{ const el=document.querySelector('[data-quiz="'+k+'"]'); if(el) makeQuiz(el,QUIZ[k]); });

/* ---------- figures ---------- */
function drawerSvg(x,y,val,lab='A',w=150){ return `<g><rect x="${x}" y="${y}" width="${w}" height="70" rx="8" fill="#c99a5b" stroke="#7a5428" stroke-width="3"/><circle cx="${x+20}" cy="${y+20}" r="12" fill="${lab==='X'?'#9fc6ff':'#ffd23f'}"/>${mono(x+20,y+26,lab,15,'#222','middle',700)}<rect x="${x+38}" y="${y+10}" width="${w-48}" height="50" rx="5" fill="#2f3a2c"/>${mono(x+38+(w-48)/2,y+44,val,26,'#f1f1e6','middle',700)}</g>`; }
function lampSvg(x,y,f,on,r=14){ return `<circle cx="${x}" cy="${y}" r="${r}" fill="${on?'#ffb020':'#1b1d21'}" stroke="#15171a" stroke-width="2" ${on?'style="filter:drop-shadow(0 0 6px #ffb020)"':''}/>`+mono(x-r-8,y+5,f,15,'#ff9b2f','end',700); }
function fig61(){
  let s='';
  s+=drawerSvg(20,40,'$FF'); s+=heb(95,130,'Before',13)+mono(95,148,'$FF = 255',13);
  s+=arrow(186,75,286,75); s+=mono(236,62,'ADDA #1',14,'#ff9b2f','middle',700);
  s+=drawerSvg(296,40,'$00'); s+=heb(371,130,'After',13)+mono(371,148,'$00 = 0',13);
  s+=`<circle cx="470" cy="56" r="13" fill="#ffd23f" stroke="#b8901a" stroke-width="2"/>`+mono(470,61,'1',14,'#222','middle',700);
  s+=`<path d="M448 64 Q470 30 470 46" fill="none"/>`;
  s+=arrow(484,60,600,74,'#ff9b2f',2.5);
  s+=heb(530,46,'the 1 with no room',12);
  s+=`<rect x="608" y="44" width="130" height="70" rx="10" fill="#23262b"/>`+lampSvg(690,76,'C',true,16)+heb(673,108,'Lamp C is on',12,'#fff');
  s+=heb(380,170,'Just like an odometer: 99 plus 1, and there is no room for a third digit.',13);
  return svg(760,186,s);
}
function fig71(){
  let s=''; const x0=230, cw=74, y0=96;
  for(let k=0;k<6;k++){ const x=x0+k*cw; s+=`<rect x="${x}" y="${y0}" width="${cw-6}" height="56" rx="4" fill="${k===2?'#ffd23f':'#1daa1d'}" stroke="#0a3a0a"/>`+mono(x+(cw-6)/2,y0+72,hex4(0x400+k),12,'currentColor'); }
  s+=finger(x0+2*cw+(cw-6)/2,y0-4,0.9);
  s+=drawerSvg(10,40,'$0402','X',170);
  s+=arrow(182,75,x0+2*cw-24,64,'#2f6fd0',2.5);
  const lab=(k,t)=>mono(x0+k*cw+(cw-6)/2,y0+96,t,14,'#ff9b2f','middle',700);
  s+=lab(1,'-1,X')+lab(2,',X')+lab(3,'1,X')+lab(4,'2,X');
  s+=heb(x0+2*cw+30,y0+122,'32,X: the same place, one row down',13);
  return svg(760,236,s);
}
function cmpPanel(x,a,m,res){
  const z=a===m, c=a<m; let s=`<rect x="${x}" y="8" width="240" height="186" rx="12" fill="none" stroke="currentColor" stroke-opacity=".25"/>`;
  s+=mono(x+120,34,'A = '+hex2(a)+' · CMPA #'+hex2(m),14,'currentColor','middle',700);
  s+=mono(x+120,62,hex2(a)+' − '+hex2(m)+' → '+(z?'0':c?'below 0':'above 0'),13,'currentColor');
  s+=`<rect x="${x+30}" y="78" width="180" height="56" rx="10" fill="#23262b"/>`+lampSvg(x+90,106,'Z',z)+lampSvg(x+170,106,'C',c);
  s+=heb(x+120,160,res,14,'currentColor',700);
  s+=heb(x+120,182,'A stays '+hex2(a),12);
  return s;
}
function fig81(){ return svg(760,200,cmpPanel(8,0x41,0x41,'Equal: Z is on')+cmpPanel(260,0x41,0x42,'A is smaller: C is on')+cmpPanel(512,0x41,0x40,'A is bigger: both off')); }
function fig82(){
  let s='';
  s+=`<path d="M380 0 L380 120" stroke="#6b6f76" stroke-width="54"/><path d="M380 120 L380 236" stroke="#6b6f76" stroke-width="54"/><path d="M380 120 Q380 160 560 170 L760 170" stroke="#6b6f76" stroke-width="54" fill="none"/>`;
  s+=`<path d="M380 6 L380 230" stroke="#fff" stroke-width="3" stroke-dasharray="14 12"/><path d="M392 136 Q400 160 560 168 L752 168" stroke="#fff" stroke-width="3" stroke-dasharray="14 12" fill="none"/>`;
  s+=`<rect x="130" y="70" width="190" height="60" rx="10" fill="#1d211b"/>`+mono(225,108,'BEQ YES',22,'#9df09d','middle',700);
  s+=`<rect x="236" y="150" width="96" height="44" rx="10" fill="#23262b"/>`+lampSvg(296,172,'Z',true,12);
  s+=heb(284,214,'Lamp Z?',13);
  s+=`<rect x="600" y="104" width="150" height="40" rx="8" fill="#ffd23f"/>`+heb(675,130,'On: turn to YES',13,'#222',700);
  s+=`<rect x="420" y="196" width="190" height="36" rx="8" fill="#fff" stroke="#333"/>`+heb(515,220,'Off: straight to the next line',13,'#222',700);
  return svg(760,240,s);
}
put('fig61',fig61()); put('fig71',fig71()); put('fig81',fig81()); put('fig82',fig82());

/* ---------- chapter 6: the A drawer as an odometer, with the C lamp ---------- */
const win6=winner(6,4);
(function(){
  const host=document.getElementById('odo6'); if(!host) return;
  host.innerHTML=`<div class="odo-wrap"><div class="odo-row"><span class="odo-d">A</span><div class="odo h6"></div><div class="clamp"><span class="bulb6"></span><b>C</b></div></div>
    <div class="odo-where info o6say"></div>
    <div class="row" style="justify-content:center;margin-top:8px">
      <button class="btn" data-o="INCA">INCA</button><button class="btn" data-o="ADDA1"><bdo dir="ltr">ADDA #1</bdo></button><button class="btn" data-o="ADDA16"><bdo dir="ltr">ADDA #$10</bdo></button>
      <button class="btn ghost" data-o="DECA">DECA</button><button class="btn ghost" data-o="SUBA1"><bdo dir="ltr">SUBA #1</bdo></button><button class="btn ghost" data-o="CLRA">CLRA</button><button class="btn ghost" data-o="R">↺ <bdi dir="ltr">$FE</bdi></button></div></div>`;
  const H=host.querySelector('.odo.h6'), say=host.querySelector('.o6say'), bulb=host.querySelector('.clamp');
  const ws=[]; for(let k=0;k<2;k++){ const w=document.createElement('div'); w.className='wheel'; const s=document.createElement('div'); s.className='strip'; for(let j=0;j<=16;j++){ const d=document.createElement('div'); d.textContent=HEXD[j%16]; s.appendChild(d);} w.appendChild(s); H.appendChild(w); ws.push({w,s,cur:0}); }
  let A=0xFE, C=false;
  const st={addc:false,incff:false,subb:false,coff:false};
  const setW=(val,dir)=>{ ws.forEach((W,k)=>{ const d=k===0?val>>4:val&15; if(d===W.cur) return; const h=W.w.clientHeight||62;
      if(dir>0&&d===0&&W.cur===15){ W.s.style.transition='transform .45s'; W.s.style.transform=`translateY(${-16*h}px)`; setTimeout(()=>{ W.s.style.transition='none'; W.s.style.transform='translateY(0px)'; },470); }
      else { W.s.style.transition=dir?'transform .45s':'none'; W.s.style.transform=`translateY(${-d*h}px)`; }
      if(dir){ W.w.classList.add('flip'); setTimeout(()=>W.w.classList.remove('flip'),470); } W.cur=d; }); };
  const show=(msg,dir)=>{ setW(A,dir); bulb.classList.toggle('on',C); say.innerHTML=`In the drawer: <b class="ltr">${hex2(A)}</b> = <b>${A}</b> · lamp C: <b>${C?'on':'off'}</b>`+(msg?'<br>'+msg:''); };
  const ms=[
    {t:'With '+B('ADDA #1')+', go past '+B('$FF')+'. What happened to lamp C?',ok:()=>st.addc},
    {t:'Press ↺ and try the same thing with '+B('INCA')+'. Did C change?',ok:()=>st.incff},
    {t:'Go below '+B('$00')+' with '+B('SUBA #1')+'.',ok:()=>st.subb},
    {t:'Turn lamp C off (there are two ways).',ok:()=>st.coff}];
  const chk=missions(document.getElementById('m6'),ms,()=>st);
  host.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{ const o=b.dataset.o, a0=A, c0=C; let msg='', dir=1;
    if(o==='R'){ A=0xFE; msg='Back to '+B('$FE')+'. The lamp stayed as it was.'; dir=0; }
    else if(o==='INCA'){ A=(A+1)&255; msg=a0===255?'INCA rolled over to '+B('$00')+', but <b>didn’t touch</b> lamp C.':'INCA: plus 1. Lamp C didn’t move.'; if(a0===255) st.incff=true; }
    else if(o==='DECA'){ A=(A-1)&255; dir=-1; msg=a0===0?'DECA rolled back over to '+B('$FF')+', and didn’t touch lamp C.':'DECA: minus 1. Lamp C didn’t move.'; }
    else if(o==='ADDA1'||o==='ADDA16'){ const m=o==='ADDA1'?1:16, r=A+m; C=r>255; A=r&255; msg=C?'It didn’t fit! '+B(hex2(A))+' is left, and the wheel that fell out lit up C.':'It fitted, so ADDA turned C off.'; if(C) st.addc=true; }
    else if(o==='SUBA1'){ C=A<1; A=(A-1)&255; dir=-1; msg=C?'We went below 0: the odometer turned back to '+B('$FF')+', and C lit up.':'We didn’t go below 0, so SUBA turned C off.'; if(C) st.subb=true; }
    else if(o==='CLRA'){ A=0; C=false; dir=0; msg='CLRA: zero in the drawer, and lamp C is off.'; }
    if(c0&&!C) st.coff=true;
    show(msg,o==='R'||o==='CLRA'?0:dir); chk(); if(st.addc&&st.incff&&st.subb&&st.coff) win6('odo'); });
  new ResizeObserver(()=>{ ws.forEach(W=>{ W.s.style.transition='none'; W.s.style.transform=`translateY(${-W.cur*(W.w.clientHeight||62)}px)`; }); }).observe(host);
  show('',0); chk();
})();

pw2('pw61',{title:'Example 1 · The next letter',show:SH6,lines:['@ LDA #$41',' STA $050F',' INCA',' STA $0510'],
  predict:{q:'Which letter will appear in house '+B('$0510')+'?',opts:['B','A','AB'],a:0,why:'INCA turned '+B('$41')+' into '+B('$42')+', and that is B. The A stayed on the screen, because it was already written before.'}});
pw2('pw62',{title:'Example 2 · Counting down',show:SH6,lines:['@ LDA #$5A',' STA $050E',' DECA',' STA $050F',' DECA',' STA $0510'],
  predict:{q:'What will be written in the middle of the screen?',opts:['ZYX','ZZZ','XYZ'],a:0,why:'Each DECA takes away 1 before the next write: '+B('$5A')+' (Z), '+B('$59')+' (Y), '+B('$58')+' (X). We write from left to right.'}});
pw2('pw63',{title:'Example 3 · The next colour',show:SH6,lines:['@ LDA #$9F',' STA $050C',' ADDA #$10',' STA $050D',' ADDA #$10',' STA $050E',' ADDA #$10',' STA $050F'],
  predict:{q:'The first is yellow ('+B('$9F')+'). What colour will the fourth be?',opts:['White','Blue','Green'],a:0,why:'The left digit goes up by 1 each time: 9 yellow, A blue, B red, C white. And the lamps (F) stay: a full block.'}});
pw2('pw64',{title:'Example 4 · Adding a number from a house',show:SH6,lines:['@ LDA #3',' STA $0400',' LDA #$41',' ADDA $0400',' STA $050F'],
  predict:{q:'Which letter will appear in the middle?',opts:['D','A','C'],a:0,why:'House '+B('$0400')+' holds 3 (on the screen it looks like an inverted C, because 3 is its code). ADDA without a hash sign added that 3: A plus 3 = D.'}});
pw2('pw65',{title:'Example 5 · The odometer rolls over',show:SH6,lines:['@ LDA #$FE',' STA $0500',' ADDA #1',' STA $0501',' ADDA #1',' STA $0502'],
  predict:{q:'What will drawer A hold at the end?',opts:[B('$00')+', and lamp C is on',B('$100'),B('$FF')],a:0,why:''+B('$FE')+' plus 1 = '+B('$FF')+': it fits, C is off. Plus 1 = '+B('$100')+': it doesn’t fit. '+B('$00')+' is left (on the screen: an inverted @), and C is on.'}});
pw2('pw66',{title:'Example 6 · Two ways to $00',show:SH6,lines:['@ CLRA',' LDA #$FF',' INCA',' STA $0500',' LDA #$FF',' ADDA #1',' STA $0501'],
  predict:{q:'After the INCA (line 3), is lamp C on or off?',opts:['Off','On'],a:0,why:'CLRA turned it off at the start, and INCA doesn’t touch it, even when the odometer rolls over. Only the ADDA on line 6 lit it up. On the screen both results are the same: '+B('$00')+'.'}});
pw2('pw67',{title:'Example 7 · Sums on the screen',show:SH6,lines:['@ LDA #$41',' STA $0500',' STA $0501',' INC $0500',' INC $0500',' DEC $0501'],
  predict:{q:'What will be written at the start of row 8?',opts:['C@','AA','CA'],a:0,why:'Two INCs turned the first A into C. DEC turned the second into @ ('+B('$40')+'). And drawer A? Still '+B('$41')+'.'}});
pw2('pw68',{title:'Missing line · ABC',show:SH6,lines:['@ LDA #$41',' STA $050F',null,' STA $0510',' INCA',' STA $0511'],
  gap:[{t:' INCA',ok:true,why:'Right! INCA before each write: A, B, C.'},
       {t:' ADDA #2',ok:false,why:'ADDA #2 skips B. You get A, C, D.'},
       {t:' LDA $050F',ok:false,why:'That copies the A that is already on the screen. You get A, A, B.'}],onWin:()=>win6('gap')});

const ONE_LDA=prog=>prog.filter(p=>p.op==='LDA').length>1?'In this puzzle only one LDA is allowed.':null;
const OPS6=['LDA','STA','INCA','DECA','ADDA','SUBA','CLRA','INC','DEC'];
pz2('pz61',{tag:'Puzzle 1 · Alphabet',ops:OPS6,rule:ONE_LDA,q:'Write ABCDE in the middle of the screen, as in the picture, with only <b>one</b> LDA.',
  cases:[{target:txt('ABCDE',0x10B)}],start:'@ LDA #$41\n',best:10,
  hint1:'Hover over the picture: the A is in house '+B('$050B')+'.',hint2:'After each STA: INCA, then STA to the next house.',
  solution:'@ LDA #$41\n STA $050B\n INCA\n STA $050C\n INCA\n STA $050D\n INCA\n STA $050E\n INCA\n STA $050F\n',onWin:()=>win6('a')});
pz2('pz62',{tag:'Puzzle 2 · Colour stairs',ops:OPS6,rule:ONE_LDA,q:'Draw stairs of four full blocks: yellow, blue, red, white, each one row down and one step right. Only one LDA.',
  cases:[{target:[[0x84,0x9f],[0xa5,0xaf],[0xc6,0xbf],[0xe7,0xcf]]}],start:'@ LDA #$9F\n',best:8,
  hint1:'The next colour: '+B('ADDA #$10')+'. One row down and one step right: plus '+B('$21')+'.',hint2:'The houses: '+B('$0484')+', '+B('$04A5')+', '+B('$04C6')+', '+B('$04E7')+'.',
  solution:'@ LDA #$9F\n STA $0484\n ADDA #$10\n STA $04A5\n ADDA #$10\n STA $04C6\n ADDA #$10\n STA $04E7\n',onWin:()=>win6('b')});
pz2('pz63',{tag:'Puzzle 3 · HAL becomes IBM',ops:['INC','DEC'],q:'The locked lines write HAL. Turn it into IBM, using only '+B('INC')+' and '+B('DEC')+'. (A hint from the cinema: each letter moves one step.)',
  cases:[{pre:['@ LDA #$48',' STA $050E',' LDA #$41',' STA $050F',' LDA #$4C',' STA $0510'],target:txt('IBM',0x10E)}],start:'',best:3,
  hint1:'H → I, A → B, L → M. Each one goes up by 1.',hint2:''+B('INC $050E')+', and two more like it.',
  solution:' INC $050E\n INC $050F\n INC $0510\n',onWin:()=>win6('c')});

/* ---------- chapter 7 ---------- */
const win7=winner(7,4);
(function(){
  const host=document.getElementById('fw7'); if(!host) return;
  host.innerHTML=`<div class="fw"><div class="fw-top"><div class="xbox">X = <b class="ltr xv"></b></div><div class="xbox">A = <b class="ltr">$BF</b> <span class="sw" style="background:${VDG.sg[3]}"></span></div></div>
   <div class="fw-scr"></div><div class="info fwsay"></div>
   <div class="row fw-btns">
    <button class="btn" data-f="-32"><bdo dir="ltr">LEAX -32,X</bdo> ↑</button><button class="btn" data-f="-1"><bdo dir="ltr">LEAX -1,X</bdo> ←</button><button class="btn" data-f="1"><bdo dir="ltr">LEAX 1,X</bdo> →</button><button class="btn" data-f="32"><bdo dir="ltr">LEAX 32,X</bdo> ↓</button>
    <button class="btn warm" data-f="s"><bdo dir="ltr">STA ,X</bdo></button><button class="btn warm" data-f="s+"><bdo dir="ltr">STA ,X+</bdo></button><button class="btn ghost" data-f="r">↺ <bdo dir="ltr">LDX #$0400</bdo></button></div></div>`;
  const sc=new Screen2(host.querySelector('.fw-scr'),{labels:true,hexcols:true});
  const xv=host.querySelector('.xv'), say=host.querySelector('.fwsay');
  let X=0x400, run=0; const st={first:false,diag:false,line:false,out:false};
  const show=m=>{ xv.textContent=hex4(X); sc.finger=(X>=0x400&&X<=0x5ff)?X-0x400:null; sc.draw(); say.innerHTML=m||('The finger is on '+B(hex4(X))+(X>=0x400&&X<=0x5ff?' (row '+((X-0x400)>>5)+', column '+((X-0x400)&31)+')':' — off the screen!')); };
  const ms=[{t:'Write a red block in the corner ('+B('$0400')+').',ok:()=>st.first},
    {t:'Move the finger to '+B('$0421')+': one row down and one step right.',ok:()=>st.diag},
    {t:'Draw a line of 3 blocks, with three '+B('STA ,X+')+' in a row.',ok:()=>st.line},
    {t:'What happens if you move the finger above the first row?',ok:()=>st.out}];
  const chk=missions(document.getElementById('m7'),ms,()=>st);
  host.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{ const f=b.dataset.f; let m='';
    if(f==='r'){ X=0x400; sc.clear(); run=0; }
    else if(f==='s'||f==='s+'){
      if(X<0x400||X>0x5ff){ m='⚠️ The finger is on '+B(hex4(X))+', off the screen. Here we don’t write there: on the Dragon it would write somewhere else in memory.'; }
      else { sc.set(X-0x400,0xbf,true); if(X===0x400) st.first=true; if(f==='s+'){ X++; run++; if(run>=3) st.line=true; } else run=0; }
    } else { X=(X+(+f))&0xFFFF; run=0; if(X===0x421) st.diag=true; if(X<0x400) st.out=true; if(X<0x400) m='The finger is on '+B(hex4(X))+': above the screen there is more memory (the numbers just carry on), but it isn’t squares. Go back down with '+B('LEAX 32,X')+'.'; }
    show(m); chk(); if(st.first&&st.diag&&st.line&&st.out) win7('fw'); });
  show(); chk();
})();

pw2('pw71',{title:'Example 1 · The finger points',show:SH7,lines:['@ LDX #$0510',' LDA #$41',' STA ,X'],
  predict:{cell:true,q:'Which square will the A appear on? Click it on the screen.',check:i=>i===0x110,why:'LDX puts '+B('$0510')+' in drawer X, so the finger points at the middle of the screen. '+B('STA ,X')+' writes exactly there.'}});
pw2('pw72',{title:'Example 2 · A step to the right',show:SH7,lines:['@ LDX #$050E',' LDA #$48',' STA ,X',' LEAX 1,X',' LDA #$49',' STA ,X'],
  predict:{q:'Which house will the finger point at in the end?',opts:[B('$050F'),B('$050E'),B('$0510')],a:0,why:'The finger started at '+B('$050E')+', and '+B('LEAX 1,X')+' moved it one step. The I was written there, next to the H.'}});
pw2('pw74',{title:'Example 3 · One row down',show:SH7,lines:['@ LDX #$0410',' LDA #$BF',' STA ,X',' LEAX 32,X',' STA ,X',' LEAX 32,X',' STA ,X'],
  predict:{q:'What shape will come out?',opts:['A standing line (top to bottom)','A lying line','A diagonal'],a:0,why:''+B('LEAX 32,X')+' moves the finger down a whole row, in the same column. Three writes, one under the other.'}});
pw2('pw73',{title:'Example 4 · Write and move',show:SH7,lines:['@ LDX #$050E',' LDA #$59',' STA ,X+',' LDA #$45',' STA ,X+',' LDA #$53',' STA ,X+'],
  predict:{q:'Which house will the finger point at in the end?',opts:[B('$0511'),B('$0510'),B('$050E')],a:0,why:'Three writes, and a step after each one. The finger is already on the next empty square, ready for a fourth letter.'}});
const STAMP=[' LDA #$AF',' STA ,X',' STA 1,X',' STA 2,X',' STA 32,X',' STA 34,X',' STA 64,X',' STA 65,X',' STA 66,X'];
pw2('pw75',{title:'Example 5 · A stamp',show:SH7,varq:'Where to draw? Choose, and look only at the first line:',
  variants:[{label:'Top corner',lines:['@ LDX #$0400'].concat(STAMP)},{label:'Middle',lines:['@ LDX #$04EE'].concat(STAMP)},{label:'Bottom corner',lines:['@ LDX #$05BD'].concat(STAMP)}]});
pw2('pw76',{title:'Example 6 · Reading from the finger',show:SH7,lines:['@ LDA #$41',' STA $0500',' LDX #$0500',' LDA ,X',' INCA',' STA 1,X',' INCA',' STA 2,X'],
  predict:{q:'What will be written in house '+B('$0502')+'?',opts:['C','A','B'],a:0,why:''+B('LDA ,X')+' copied the A in the finger’s house. Then INCA (B) to the neighbour, and another INCA (C) to the one after it. The finger didn’t move at all.'}});
pw2('pw77',{title:'Missing line · A line of three',show:SH7,lines:['@ LDX #$0508',' LDA #$BF',' STA ,X+',null,' STA ,X'],
  gap:[{t:' STA ,X+',ok:true,why:'Right! Write and move, twice, and then the third one where the finger has got to.'},
       {t:' STA ,X',ok:false,why:''+B('STA ,X')+' doesn’t move the finger. The last line will write on the same square again, and there will be only two.'},
       {t:' LEAX 32,X',ok:false,why:'That moves the finger down a row. The second block will appear underneath, on the diagonal, not in a line.'}],onWin:()=>win7('gap')});

const NO_ADDR=prog=>prog.some(p=>(p.op==='STA')&&p.mode==='ext')?'In this puzzle STA writes only through the finger: '+B(',X')+', '+B(',X+')+' or, for example, '+B('32,X')+'.':null;
const OPS7=['LDA','STA','LDX','LEAX','INCA','DECA','ADDA','SUBA'];
pz2('pz71',{tag:'Puzzle 1 · A blue line',ops:OPS7,rule:NO_ADDR,q:'Draw a blue line ('+B('$AF')+') of 8 blocks, as in the picture.',
  cases:[{target:Array.from({length:8},(_,k)=>[0x104+k,0xaf])}],start:'@ LDX #$0504\n LDA #$AF\n',best:10,
  hint1:'The finger is already on the first block. Which STA writes and moves?',hint2:'Eight times '+B('STA ,X+')+'.',
  solution:'@ LDX #$0504\n LDA #$AF\n STA ,X+\n STA ,X+\n STA ,X+\n STA ,X+\n STA ,X+\n STA ,X+\n STA ,X+\n STA ,X+\n',onWin:()=>win7('a')});
pz2('pz72',{tag:'Puzzle 2 · A column',ops:OPS7,rule:NO_ADDR,q:'Draw a column of four white blocks ('+B('$CF')+') in column 3, from row 2 downwards.',
  cases:[{target:[[0x43,0xcf],[0x63,0xcf],[0x83,0xcf],[0xa3,0xcf]]}],start:'',best:6,
  hint1:'The finger starts at '+B('$0443')+'. Down = 32.',hint2:'You can move the finger with '+B('LEAX 32,X')+'. Or you can not move it at all: '+B('STA 32,X')+', '+B('STA 64,X')+'... That is the shortest way.',
  solution:'@ LDX #$0443\n LDA #$CF\n STA ,X\n STA 32,X\n STA 64,X\n STA 96,X\n',onWin:()=>win7('b')});
pz2('pz73',{tag:'Puzzle 3 · Stairs',ops:OPS7,rule:NO_ADDR,q:'Draw a diagonal of five yellow blocks ('+B('$9F')+'), from the top left corner, down and to the right.',
  cases:[{target:[0,33,66,99,132].map(i=>[i,0x9f])}],start:'@ LDX #$0400\n LDA #$9F\n',best:11,
  hint1:'A diagonal step: one row down plus one step right. How much is that altogether?',hint2:''+B('STA ,X')+' then '+B('LEAX 33,X')+', again and again. (And '+B('STA 33,X')+', '+B('STA 66,X')+'... works too.)',
  solution:'@ LDX #$0400\n LDA #$9F\n STA ,X\n LEAX 33,X\n STA ,X\n LEAX 33,X\n STA ,X\n LEAX 33,X\n STA ,X\n LEAX 33,X\n STA ,X\n',onWin:()=>win7('c')});
pz2('pz74',{tag:'Puzzle 4 · Plus (hard)',ops:OPS7,rule:NO_ADDR,q:'Draw a white plus ('+B('$CF')+') from five blocks. The finger must point at its <b>middle</b>, '+B('$04CF')+'.',
  cases:[{target:[[0xaf,0xcf],[0xce,0xcf],[0xcf,0xcf],[0xd0,0xcf],[0xef,0xcf]]}],start:'@ LDX #$04CF\n LDA #$CF\n',best:7,
  hint1:'Above the middle = 32 <b>less</b>. To the left = 1 less.',hint2:''+B('STA -32,X')+', '+B('STA -1,X')+', '+B('STA ,X')+', '+B('STA 1,X')+', '+B('STA 32,X')+'.',
  solution:'@ LDX #$04CF\n LDA #$CF\n STA -32,X\n STA -1,X\n STA ,X\n STA 1,X\n STA 32,X\n',onWin:()=>win7('d')});

/* ---------- chapter 8 ---------- */
const win8=winner(8,3);
(function(){
  const host=document.getElementById('jw8'); if(!host) return;
  const LET='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const opts=sel=>[...LET].map(c=>`<option value="${0x40+CHARS.indexOf(c)}"${c===sel?' selected':''}>${c}</option>`).join('');
  host.innerHTML=`<div class="jw"><div class="row jw-in"><span>In drawer A:</span><select class="ja">${opts('G')}</select><span class="ltr">CMPA #'</span><select class="jm">${opts('M')}</select></div>
   <div class="jw-l"></div><table class="codes jw-t"></table></div>`;
  const sa=host.querySelector('.ja'), sm=host.querySelector('.jm'), lo=host.querySelector('.jw-l'), tb=host.querySelector('.jw-t');
  const st={eq:false,lo:false,hs:false};
  const ms=[{t:'Make '+B('BEQ')+' turn.',ok:()=>st.eq},{t:'Make '+B('BLO')+' turn.',ok:()=>st.lo},{t:'Find a case where '+B('BHS')+' turns and '+B('BEQ')+' turns too.',ok:()=>st.hs}];
  const chk=missions(document.getElementById('m8'),ms,()=>st);
  const upd=()=>{ const a=+sa.value, m=+sm.value, Z=a===m, C=a<m, N=!!(((a-m)&255)&0x80);
    lo.innerHTML=`<div dir="ltr" class="ltr">${hex2(a)} − ${hex2(m)}</div><div>`+(Z?'<b>Equal</b>':C?'A comes <b>before</b> (smaller)':'A comes <b>after</b> (bigger)')+`</div><div class="lrow" dir="ltr"><span class="lc${N?' on':''}">N</span><span class="lc${Z?' on':''}">Z</span><span class="lc${C?' on':''}">C</span></div>`;
    const row=(op,take,why)=>`<tr><td class="ltr"><b>${op}</b></td><td>${why}</td><td>${take?'<b style="color:var(--warm)">↪ turns</b>':'↓ carries straight on'}</td></tr>`;
    tb.innerHTML=row('BEQ',Z,'turns if Z is on')+row('BNE',!Z,'turns if Z is off')+row('BLO',C,'turns if C is on')+row('BHS',!C,'turns if C is off')+row('BRA',true,'always turns');
    if(Z) st.eq=true; if(C) st.lo=true; if(Z&&!C) st.hs=true; chk(); if(st.eq&&st.lo&&st.hs) win8('jw'); };
  sa.onchange=upd; sm.onchange=upd; upd();
})();

pw2('pw81',{title:'Example 1 · Watching the lamps',show:SH8,lines:['@ LDA #$BF',' STA $0500',' LDA #$41',' CMPA #$41',' CMPA #$42',' CMPA #$40'],
  predict:{q:'After '+B('CMPA #$41')+' (line 4), which lamp will light up?',opts:['Z (equal)','C (smaller)','Neither'],a:0,why:''+B('$41')+' minus '+B('$41')+' = 0: equal, Z is on. Then '+B('$42')+': A is smaller, C is on (and N too, because 0 minus 1 gave '+B('$FF')+'). And last '+B('$40')+': A is bigger, everything is off. And A? '+B('$41')+' the whole time.'}});
const YN=(l)=>[{label:'Y in the corner',lines:['@ LDA #$59'].concat(l)},{label:'N in the corner',lines:['@ LDA #$4E'].concat(l)}];
pw2('pw82',{title:'Example 2 · If not Y, draw red',show:SH8,varq:'What will be written in the corner?',variants:YN([' STA $0400',' CMPA #$59',' BEQ KEY',' LDA #$BF',' STA $050F']),
  predict:{q:'Y in the corner. Will a red block appear in the middle?',opts:['No','Yes'],a:0,why:'A equals '+B('$59')+', so Z is on, and '+B('BEQ KEY')+' turns straight to the end. The two red lines are skipped. Now try “N in the corner”.'}});
pw2('pw83',{title:'Example 3 · Blue or red',show:SH8,varq:'What will be written in the corner?',variants:YN([' STA $0400',' CMPA #$59',' BNE NO',' LDA #$AF',' STA $050F',' BRA KEY','NO LDA #$BF',' STA $050F']),
  predict:{q:'Y in the corner. What colour will appear in the middle?',opts:['Blue','Red','Blue, then red'],a:0,why:'They are equal, so BNE does <b>not</b> turn: blue. Then '+B('BRA KEY')+' jumps over the NO road. Without the BRA, red would be written over the blue.'}});
const LMR=l=>[{label:'G',lines:['@ LDA #$47'].concat(l)},{label:'M',lines:['@ LDA #$4D'].concat(l)},{label:'T',lines:['@ LDA #$54'].concat(l)}];
pw2('pw85',{title:'Example 4 · Before M or after',show:SH8,varq:'Which letter?',variants:LMR([' STA $0400',' CMPA #$4D',' BLO LEFT',' STA $051F',' BRA KEY','LEFT STA $0500'])});
pw2('pw84',{title:'Example 5 · Only if empty',show:SH8,varq:'What is in house $0510 at the start?',
  variants:[{label:'Empty',lines:['@ LDA $0510',' CMPA #$60',' BNE KEY',' LDA #$58',' STA $0510']},{label:'Already an A',lines:['@ LDA #$41',' STA $0510',' LDA $0510',' CMPA #$60',' BNE KEY',' LDA #$58',' STA $0510']}]});
pw2('pw86',{title:'Example 6 · A bug: the STA in the middle',show:SH8,lines:['@ CLRA',' STA $0400',' CMPA #$41',' STA $0401',' BEQ KEY',' LDA #$BF',' STA $050F'],
  predict:{q:'We wanted: “if A equals '+B('$41')+', skip the red”. A holds 0, not '+B('$41')+'. Will red appear?',opts:['No!','Yes'],a:0,why:'CMPA turned Z off (not equal). But then '+B('STA $0401')+' wrote 0, and <b>turned Z on</b> again, because the number it wrote is 0. The crossroads saw the STA’s Z, and turned. The fix: move the STA above the CMPA.'}});
pw2('pw88',{title:'Missing line · Red only for A',show:SH8,lines:['@ LDA #$41',' STA $0400',' CMPA #$41',null,' LDA #$BF',' STA $050F'],gapq:'We wanted: a red block in the middle only if there is an A in the corner. Which crossroads is missing?',
  gap:[{t:' BNE KEY',ok:true,why:'Right! Not equal? To the end, no red. Equal? Carry straight on to the red.'},
       {t:' BEQ KEY',ok:false,why:'The other way round: when there is an A, this is exactly what skips the red.'},
       {t:' BRA KEY',ok:false,why:'BRA always turns, so the red will never appear.'}],onWin:()=>win8('gap')});
pw2('pw87',{title:'A taste · A whole row in five lines',show:SH8,fast:true,lines:['@ LDX #$0500',' LDA #$BF','LOOP STA ,X+',' CMPX #$0520',' BNE LOOP'],
  predict:{q:'How many red blocks will there be at the end?',opts:['32','1','3'],a:0,why:'The finger starts at '+B('$0500')+' and writes and moves, until it reaches '+B('$0520')+'. That is '+B('$20')+' = 32 steps: a whole row.'}});

const OPS8=['LDA','STA','LDX','LEAX','INCA','DECA','ADDA','SUBA','CMPA','CMPX','BEQ','BNE','BLO','BHS','BRA'];
pz2('pz81',{tag:'Puzzle 1 · YES or NO',ops:OPS8,q:'The locked lines put Y or N in the corner (and leave it in drawer A too). If Y, write YES in the middle. If N, write NO.',
  preShow:['@ LDA #?',' STA $0400'],preNote:'In the first check the ? is Y, and in the second N. Carry on below them:',
  cases:[{name:'When the corner is Y',pre:['@ LDA #$59',' STA $0400'],target:[[0,0x59]].concat(txt('YES',0x10E))},{name:'When the corner is N',pre:['@ LDA #$4E',' STA $0400'],target:[[0,0x4e]].concat(txt('NO',0x10E))}],start:'',best:11,
  hint1:''+B('CMPA #$59')+', and a crossroads after it. Each road must write a different word, and at the end of the first road '+B('BRA KEY')+'.',hint2:'Note: the Y or N is already in the drawer, so you can write the first letter of the word without an LDA.',
  solution:' CMPA #$59\n BNE NO\n STA $050E\n LDA #$45\n STA $050F\n LDA #$53\n STA $0510\n BRA KEY\nNO STA $050E\n LDA #$4F\n STA $050F\n',onWin:()=>win8('a')});
pz2('pz82',{tag:'Puzzle 2 · Colour or letter',ops:OPS8,q:'In the corner there is a colour square or a letter (and it is in drawer A too). If it is a colour square, copy it to the bottom right corner. If it is a letter, copy it to the middle ('+B('$050F')+').',
  preShow:['@ LDA #?',' STA $0400'],preNote:'Three checks: a red block, the letter A, and a magenta half. Carry on below them:',
  cases:[{name:'A red block',pre:['@ LDA #$BF',' STA $0400'],target:[[0,0xbf],[511,0xbf]]},{name:'The letter A',pre:['@ LDA #$41',' STA $0400'],target:[[0,0x41],[0x10f,0x41]]},{name:'A magenta half',pre:['@ LDA #$E5',' STA $0400'],target:[[0,0xe5],[511,0xe5]]}],start:'',best:5,
  hint1:'Colour squares are '+B('$80')+' and above. Compare with '+B('$80')+'.',hint2:''+B('CMPA #$80')+', then '+B('BLO')+' to the letter’s road (smaller than '+B('$80')+').',
  solution:' CMPA #$80\n BLO LET\n STA $05FF\n BRA KEY\nLET STA $050F\n',onWin:()=>win8('b')});
pz2('pz83',{tag:'Puzzle 3 · Which comes later (hard)',ops:OPS8,q:'House '+B('$0400')+' and house '+B('$0401')+' hold two letters. Write in the middle ('+B('$050F')+') the one that comes later in the alphabet. If they are the same, that letter.',
  preShow:['@ LDA #?',' STA $0400',' LDA #?',' STA $0401'],preNote:'Three checks: C and F, K and B, D and D. Carry on below them:',
  cases:[{name:'C and F',pre:['@ LDA #$43',' STA $0400',' LDA #$46',' STA $0401'],target:[[0,0x43],[1,0x46],[0x10f,0x46]]},
         {name:'K and B',pre:['@ LDA #$4B',' STA $0400',' LDA #$42',' STA $0401'],target:[[0,0x4b],[1,0x42],[0x10f,0x4b]]},
         {name:'D and D',pre:['@ LDA #$44',' STA $0400',' LDA #$44',' STA $0401'],target:[[0,0x44],[1,0x44],[0x10f,0x44]]}],start:'',best:5,
  hint1:'CMPA can also compare with a house, without a hash sign: '+B('CMPA $0401')+'.',hint2:''+B('LDA $0400')+', '+B('CMPA $0401')+'. If A is higher or the same, it is the winner: '+B('BHS')+' to the line that writes. Otherwise, first '+B('LDA $0401')+'.',
  solution:' LDA $0400\n CMPA $0401\n BHS WIN\n LDA $0401\nWIN STA $050F\n',onWin:()=>win8('c')});

/* extra checks, not shown on the page: each claim about the lamps, run on our machine too */
[['x_inca0',['@ CLRA',' LDA #$FF',' INCA',' STA $0500']],
 ['x_inca1',['@ LDA #$FF',' ADDA #1',' LDA #$FF',' INCA',' STA $0500']],
 ['x_deca',['@ CLRA',' DECA',' STA $0500']],
 ['x_suba',['@ CLRA',' SUBA #1',' STA $0500']],
 ['x_suba2',['@ LDA #$43',' SUBA #2',' STA $0500']],
 ['x_cmpgt',['@ LDA #$41',' CMPA #$40']],
 ['x_cmplt',['@ LDA #$41',' CMPA #$42']],
 ['x_leax',['@ LDX #$0400',' CMPX #$0400',' LEAX 1,X']],
 ['x_ldaz',['@ LDA $0400',' ADDA #1',' LDA #0']],
 ['x_inc7f',['@ LDA #$7F',' STA $0500',' INC $0500']],
 ['x_addh',['@ LDA #$90',' ADDA #$90',' STA $0500']],
 ['x_addv',['@ LDA #$90',' ADDA #$90']]].forEach(([n,l])=>V678.push({name:n,lines:l}));
const MACH={
 mach6:'<b>What DREAM wrote next to the lines:</b> every line turns into numbers. <code>INCA</code> → <code>4C</code>, <code>DECA</code> → <code>4A</code>: only one house, because no number comes after them. <code>ADDA #1</code> → <code>8B 01</code>, <code>ADDA $0400</code> → <code>BB 04 00</code> (a different number for the instruction, because there is no hash sign). <code>INC $0500</code> → <code>7C 05 00</code>, <code>DEC $0501</code> → <code>7A 05 01</code>.<br><b>The lamps on the machine:</b> after <bdi class="ltr">$FF</bdi> plus 1 with ADDA, lamp C came on. After INCA from <bdi class="ltr">$FF</bdi> it stayed as it was: off after CLRA, and on after an earlier ADDA. SUBA from 0 lit it up. All just like in the windows. <span class="verified">✓ Checked on our Dragon machine</span>',
 mach7:'All the programs and solutions were typed into DREAM on our Dragon machine, and the screen and the drawers (X too) were checked against the windows.<br><b>What DREAM wrote:</b> <code>LDX #$0510</code> → <code>8E 05 10</code>. <code>STA ,X</code> → <code>A7 84</code>, <code>STA ,X+</code> → <code>A7 80</code>, <code>LDA ,X</code> → <code>A6 84</code>. <code>STA 1,X</code> → <code>A7 01</code>: a small move fits inside the second number. <code>STA 32,X</code> → <code>A7 88 20</code>: a big move needs an extra house (<bdi class="ltr">$20</bdi> = 32). DREAM chooses by itself. <code>LEAX 1,X</code> → <code>30 01</code>, <code>LEAX 32,X</code> → <code>30 88 20</code>.<br>And in the fixed ending: <code>LDX $A000</code> → <code>BE A0 00</code>. With a hash sign it would be <code>8E</code>: the difference between “here is the number” and “go to the house”, just like with LDA. <span class="verified">✓ Checked on our Dragon machine</span>',
 mach8:'All the programs, in every case (Y and N, G, M and T, empty and full), and all the solutions in all their checks, were typed into DREAM on our Dragon machine and run. The screen, the drawers and lamps N, Z and C at the end of each run match the windows. The bug in Example 6 happened on the machine exactly the same way too: the STA turned Z on, and the red didn’t appear.<br><b>What DREAM wrote:</b> <code>CMPA #$59</code> → <code>81 59</code>, <code>CMPA $0401</code> → <code>B1 04 01</code>, <code>CMPX #$0520</code> → <code>8C 05 20</code>. The crossroads: <code>BRA</code> → <code>20</code>, <code>BHS</code> → <code>24</code>, <code>BLO</code> → <code>25</code>, <code>BNE</code> → <code>26</code>, <code>BEQ</code> → <code>27</code>.<br>And the second number of a crossroads? It isn’t the house number of the name, but <b>how far to jump</b>. <code>BEQ KEY</code> in Example 2 → <code>27 05</code>: “jump 5 houses forward”, over the two red lines (2 + 3 houses). <code>BNE LOOP</code> in the taste → <code>26 F9</code>: <bdi class="ltr">$F9</bdi> means “7 houses back”, back to the line LOOP. We’ll talk more about these numbers in Chapter 13. <span class="verified">✓ Checked on our Dragon machine</span>'
};
for(const k in MACH){ const e=document.getElementById(k); if(e&&MACH[k]) e.innerHTML=MACH[k]; }

paintDone();

window.__courseLoaded();
