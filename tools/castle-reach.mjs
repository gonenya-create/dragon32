// בדיקה למחסנית DRAGON CASTLE: בכל חדר (בלי אויבים) מחפשים בכל הדרכים האפשריות - הליכה, טיפוס וקפיצות -
// ומוודאים שכל מפתח נגיש ושאפשר להגיע לדלת. רצה ב-node בלי דפדפן: node castle-reach.mjs
import game, { __test } from '../assets/dragon/carts/castle.js';
const { ROOMS } = __test;
const snd = { tone(){}, noise(){} };
function mk(n){ const api={ state:null, input:{}, edges:{}, sound:snd, hit(k){return !!this.edges[k];}, loadHigh(){return 0;}, submitScore(){} , frame:0};
  game.init(api); api.edges={fire:true}; api.state.t=30; game.update(api); api.edges={};
  const s=api.state; s.n=n; // rebuild room n
  return api; }
let bad = 0;
for (let n=0;n<ROOMS.length;n++){
  const api=mk(n); const s=api.state;
  // respawn into room n
  const base = JSON.parse(JSON.stringify(s));
  // use internal spawn via mode clear trick: set n-1 and clear
  s.n = n-1; s.mode='clear'; s.air=0; s.t=100; if(n===0){s.n=ROOMS.length-1; s.loop=-1;} game.update(api);
  s.room.enemies=[]; s.loop=0;
  const R=s.room; const keys=R.keys.map(k=>({...k})); const door=R.door;
  const seen=new Set(); const q=[]; const touched=new Set(); let doorOK=false;
  const snap=()=>JSON.stringify({p:s.p});
  function push(p){ const k=Math.round(p.x)+','+p.y+','+p.mode; if(seen.has(k))return; seen.add(k); q.push(JSON.parse(JSON.stringify(p))); }
  push(s.p);
  const acts=[['left'],['right'],['up'],['down'],['fire'],['fire','left'],['fire','right']];
  while(q.length){ const p0=q.shift();
    for(const a of acts){ s.p=JSON.parse(JSON.stringify(p0)); s.dying=0; s.air=99999; s.mode='play';
      for(const k of R.keys) k.got=false;
      for(let f=0;f<120;f++){ api.input={}; for(const x of a) if(x!=='fire') api.input[x]=true; api.edges = (a.includes('fire')&&f===0)?{fire:true}:{};
        if (s.p.mode==='air') { api.input={}; }
        game.update(api);
        if(s.dying||s.mode!=='play'){ if(s.mode==='clear') doorOK=true; break; }
        R.keys.forEach((k,i)=>{ if(k.got) touched.add(i); });
        const p=s.p;
        if(a[0]==='fire' ? (p.mode==='walk'&&f>2) : (f%4===3 && (p.mode==='walk'||p.mode==='climb'))) { push(p); if(a[0]==='fire') break; }
        if(a[0]!=='fire' && f>=12) break;
      }
    }
  }
  // door: any reachable node near door with all keys
  const nearDoor=[...seen].some(k=>{const [x,y]=k.split(',').map(Number); return Math.abs(x-door.x)<14 && y===door.y+16;});
  if (touched.size !== R.keys.length || !nearDoor) bad++;
  console.log((touched.size === R.keys.length && nearDoor ? '  ✓ ' : '  ✗ ') + ROOMS[n].name, 'states', seen.size, 'keys', touched.size+'/'+R.keys.length, 'missing', R.keys.map((k,i)=>touched.has(i)?null:ROOMS[n].K[i]).filter(Boolean), 'door reachable', nearDoor);
}
console.log(bad ? `\n${bad} castle rooms broken` : '\nall castle rooms passable');
process.exit(bad ? 1 : 0);
