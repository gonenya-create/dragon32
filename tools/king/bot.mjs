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
const movers = s => s.L.lifts.length + s.L.drips.length + s.L.vines.length + s.L.logs.length + s.L.lilies.length + s.L.crocs.length + (s.L.raft ? 1 : 0) + (s.L.guard && (s.L.guard.kind === 'croc' || s.L.guard.kind === 'whirl') ? 1 : 0);
function key(s) {
  const p = s.p;
  let k = p.mode + ':' + Math.round(p.x / 2) + ',' + Math.round(p.y / 2) + ':' + Math.round(p.vy);
  if (p.mode === 'swing') k += ':v' + s.L.vines.indexOf(p.vine) + ',' + Math.round(p.vd / 4);
  if (movers(s)) k += ':t' + (Math.floor(s.L.t / 10) % 120);
  if (s.L.jars.length) k += ':j' + s.L.jars.map(j => j.got ? 1 : 0).join('');
  return k;
}

export function solve(idx, { limit = 3000000, diff = 1 } = {}) {
  const s0 = _test.newState(diff); _test.loadScreen(s0, idx); s0.noEnemies = true; s0.gateOpen = !s0.L.jars.length;   // אצל המלכה: צריך לאסוף את הצנצנות
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

// זורק החביות לא בהישג יד (גונן, 27.10: "בדונקי לא היה אפשר להגיע לקוף"): חיפוש מלא, בלי לעצור ביציאה,
// ובשום מצב PIP לא עומד בשורות העליונות (0 או 1), שם יושב הזורק
export function reachTop(idx, { limit = 3000000 } = {}) {
  const s0 = _test.newState(1); _test.loadScreen(s0, idx); s0.noEnemies = true; s0.gateOpen = false;
  const seen = new Set([key(s0)]);
  let frontier = [s0], nodes = 0, best = s0.p.y;
  while (frontier.length && nodes < limit) {
    const next = [];
    for (const s of frontier) for (let a = 0; a < ACTS.length; a++) {
      const c = clone(s); let ev = null;
      for (let f = 0; f < HOLD && !ev; f++) ev = _test.step(c, { ...ACTS[a], fire: f === 0 && !!ACTS[a].fire }, snd);
      nodes++;
      if (ev === 'die') continue;
      if (c.p.mode === 'walk') best = Math.min(best, c.p.y);
      const k = key(c); if (seen.has(k)) continue; seen.add(k); next.push(c);
    }
    frontier = next;
  }
  return { top: best <= _test.OY + _test.T, best, nodes, done: !frontier.length };
}
// החביות זורמות במסלול של PIP: מריצים את הזורק דקה וחצי, ורושמים על אילו שורות חביות התגלגלו
export function barrelRows(idx, frames = 4500) {
  const s = _test.newState(1); _test.loadScreen(s, idx); s.p.inv = 1e9; s.p.x = 4; s.p.y = _test.OY + 20 * _test.T;
  const rows = new Set();
  for (let f = 0; f < frames; f++) { _test.step(s, {}, snd); s.p.mode = 'walk'; s.p.x = 4; s.p.y = _test.OY + 20 * _test.T; for (const b of s.L.barrels) if (b.mode === 'roll') rows.add(Math.round((b.y - _test.OY) / _test.T)); }
  return [...rows].sort((a, b) => a - b);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const only = process.argv[2];
  for (let i = 0; i < _test.SCREENS.length; i++) {
    const sc = _test.SCREENS[i];
    if (only && sc.id !== only) continue;
    const t0 = Date.now(), r = solve(i);
    const thrower = sc.map[0].includes('K'), top = thrower ? reachTop(i) : null, rows = thrower ? barrelRows(i) : null;
    console.log(`${sc.id} ${sc.name.padEnd(18)} ${r.ok ? 'OK  ' + (r.frames / 50).toFixed(1) + 's of ' + sc.time + 's' : 'NO PATH'}  nodes ${r.nodes}${r.secret ? '  secret reachable' : ''}${thrower ? '  thrower ' + (top.top ? 'REACHABLE' : 'out of reach') + (top.done ? '' : ' (search cut)') + '  barrels on rows ' + rows.join(',') : ''}  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
}
