// בדיקת נגישות (axe-core, תקן WCAG 2.0/2.1 AA שעליו נשען ת"י 5568) במצבים העיקריים של האפליקציה
// הרצה: node a11y-scan.mjs [כתובת]   (ברירת מחדל: שרת מקומי על 8765)
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
const AXE = readFileSync(new URL('./node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const BASE = process.argv[2] || 'http://localhost:8765/';
const b = await chromium.launch({ channel: 'chrome' });
const states = [
  ['desktop computer', { viewport: { width: 1440, height: 900 } }, async p => {}],
  ['desktop guide', { viewport: { width: 1440, height: 900 } }, async p => { await p.locator('.d32-welcome-x').click().catch(() => {}); await p.locator('.d32-theater-exit').click(); }],
  ['phone off', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, async p => {}],
  ['phone on + commands', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, async p => { await p.locator('.d32-power').tap(); await p.waitForTimeout(2200); await p.locator('.d32-tab[data-tab="commands"]').tap(); }],
  ['phone helper', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, async p => { await p.locator('.d32-power').tap(); await p.waitForTimeout(2200); await p.locator('.d32-tab[data-tab="help"]').tap(); }],
  ['privacy', { viewport: { width: 1280, height: 900 } }, 'privacy/'],
  ['accessibility', { viewport: { width: 390, height: 844 }, isMobile: true }, 'accessibility/'],
  ['zoom 200% (720x450)', { viewport: { width: 720, height: 450 } }, async p => {}],
];
let total = 0;
for (const [name, opt, act] of states) {
  const p = await b.newPage(opt);
  await p.goto(BASE + (typeof act === 'string' ? act : ''));
  if (typeof act === 'function') { await p.waitForSelector('#dragon-room.is-ready'); await p.waitForTimeout(800); await act(p); await p.waitForTimeout(500); }
  await p.addScriptTag({ content: AXE });
  const r = await p.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, ex: v.nodes.slice(0, 3).map(x => x.target.join(' ') + ' :: ' + (x.failureSummary || '').split('\n').slice(1, 2).join(' ')) })));
  console.log(`\n== ${name}: ${r.length} rule(s)`);
  for (const v of r) { total += v.n; console.log(`- [${v.impact}] ${v.id} (${v.n}): ${v.help}`); v.ex.forEach(e => console.log('    ' + e.slice(0, 220))); }
  if (name.startsWith('zoom')) { console.log('   sideways scroll:', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)); await p.screenshot({ path: '/private/tmp/claude-501/-Users-goneny-Projects-gonenyarom-dragon/a343292a-3d1b-409e-8131-2c5545b1b41b/scratchpad/zoom.png' }); }
  await p.close();
}
await b.close();
console.log('\nTOTAL nodes', total);
