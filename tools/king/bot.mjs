// JUNGLE KING: "הרובוט" של תוכנית האיכות. מחפש לבד דרך מההתחלה עד היציאה בכל מסך, עם אותה פיזיקה של המשחק
// (החיות כבויות: בודקים שהמבנה של המסך עביר, ושהדרך לא ארוכה מדי ביחס לזמן). חיפוש לרוחב על פעולות של 5 פריימים.
// הרצה: node tools/king/bot.mjs [מספר מסך, למשל 1-5]
import { fileURLToPath } from 'node:url';

const K = await import(new URL('../../assets/dragon/carts/king.js', import.meta.url).href);
const { _test } = K;
const snd = { tone() {}, note() {} };
const HOLD = 5;
const ACTS = [{}, { left: 1 }, { right: 1 }, { up: 1 }, { down: 1 }, { fire: 1 }, { left: 1, fire: 1 }, { right: 1, fire: 1 }];

function clone(s) {
  const g = s.L.grid, sc = s.L.sc; s.L.grid = null; s.L.sc = null;
  const c = structuredClone(s);
  s.L.grid = g; s.L.sc = sc; c.L.grid = g; c.L.sc = sc;
  return c;
}
const movers = s => s.L.vines.length + s.L.logs.length + s.L.lilies.length + s.L.crocs.length + (s.L.guard && s.L.guard.kind === 'croc' ? 1 : 0);
function key(s) {
  const p = s.p;
  let k = p.mode + ':' + Math.round(p.x / 2) + ',' + Math.round(p.y / 2) + ':' + Math.round(p.vy);
  if (p.mode === 'swing') k += ':v' + s.L.vines.indexOf(p.vine) + ',' + Math.round(p.vd / 4);
  if (movers(s)) k += ':t' + (Math.floor(s.L.t / 10) % 120);
  return k;
}

export function solve(idx, { limit = 400000, diff = 1 } = {}) {
  const s0 = _test.newState(diff); _test.loadScreen(s0, idx); s0.noEnemies = true; s0.gateOpen = true;
  const seen = new Set([key(s0)]);
  let frontier = [{ s: s0, path: [] }], nodes = 0, secret = null;
  while (frontier.length && nodes < limit) {
    const next = [];
    for (const { s, path } of frontier) {
      for (let a = 0; a < ACTS.length; a++) {
        const c = clone(s); let ev = null;
        for (let f = 0; f < HOLD && !ev; f++) ev = _test.step(c, { ...ACTS[a], fire: f === 0 && !!ACTS[a].fire }, snd);
        nodes++;
        if (ev === 'die') continue;
        if (ev === 'secret' && !secret) secret = path.length + 1;
        if (ev === 'exit') return { ok: true, frames: (path.length + 1) * HOLD, nodes, secret, path: [...path, a] };
        const k = key(c);
        if (seen.has(k)) continue;
        seen.add(k); next.push({ s: c, path: [...path, a] });
      }
    }
    frontier = next;
  }
  return { ok: false, nodes, secret };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const only = process.argv[2];
  for (let i = 0; i < _test.SCREENS.length; i++) {
    const sc = _test.SCREENS[i];
    if (only && sc.id !== only) continue;
    const t0 = Date.now(), r = solve(i);
    console.log(`${sc.id} ${sc.name.padEnd(18)} ${r.ok ? 'OK  ' + (r.frames / 50).toFixed(1) + 's of ' + sc.time + 's' : 'NO PATH'}  nodes ${r.nodes}${r.secret ? '  secret reachable' : ''}  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
}
