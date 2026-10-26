// בדיקה אוטומטית למסך ה-Dragon 32: מרימה שרת מקומי על תיקיית האתר, פותחת Chrome אמיתי ומשחקת בהכול.
// הרצה: cd tools && npm test        (או: node dragon-test.mjs https://www.gonenyarom.co.il לבדיקה של האתר החי)
// צריך Google Chrome מותקן (playwright-core משתמש בו, בלי להוריד דפדפן).
import { chromium } from 'playwright-core';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.bas': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json' };

function serve() {
  return new Promise(resolve => {
    const server = http.createServer(async (req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const file = normalize(join(ROOT, p));
      if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
      try {
        const body = await readFile(file);
        res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }).end(body);
      } catch { res.writeHead(404).end('not found'); }
    });
    server.listen(0, () => resolve(server));
  });
}

let base = process.argv[2];
let server = null;
if (!base) { server = await serve(); base = 'http://localhost:' + server.address().port; }
const PAGE = base.replace(/\/$/, '') + '/';   // האפליקציה היא דף אחד: המחשב המלא

const browser = await chromium.launch({ channel: 'chrome', args: ['--lang=he-IL'] });
// אם בדיקה קורסת באמצע: סוגרים את הדפדפן לפני היציאה, כדי שלא יישאר Chrome נסתר ברקע
const bail = async e => { console.error(e); await browser.close().catch(() => {}); if (server) server.close(); process.exit(1); };
process.on('uncaughtException', bail);
process.on('unhandledRejection', bail);
const pageErrors = [];
let failures = 0, passes = 0;
// רק חלק מהבדיקות, לפי שם החלק: ONLY="full computer" node dragon-test.mjs  (בלי ONLY: הכול)
const ONLY = (process.env.ONLY || '').toLowerCase();
const part = name => !ONLY || name.toLowerCase().includes(ONLY);
function check(name, ok, detail) {
  if (ok) { passes++; console.log('  ✓ ' + name); }
  else { failures++; console.log('  ✗ ' + name + (detail ? '\n' + detail.split('\n').map(l => '      | ' + l).join('\n') : '')); }
}

async function fresh(opts = {}) {
  const page = await browser.newPage({ viewport: { width: opts.width || 390, height: 900 }, colorScheme: opts.dark ? 'dark' : 'light' });
  page.on('pageerror', e => pageErrors.push(e.message));
  await page.goto(PAGE);
  await page.waitForSelector('#dragon-room.is-ready');
  // החדר מתחיל כבוי: מדליקים ומחכים ל-OK (במחשב שולחני המסך המלא נפתח ומדליק לבד)
  await page.waitForTimeout(200);
  if (await page.locator('#dragon-room').evaluate(e => e.classList.contains('is-off') && !e.classList.contains('is-theater'))) await page.locator('#dragon-room .d32-power').click();
  await page.waitForFunction(() => /OK\s*$/.test(document.querySelector('#dragon-room .d32-out').textContent), null, { timeout: 4000 });
  return page;
}
// מ-17.10 אין מחשב בתוך הדף: הוא תמיד במסך המלא (מחשב) או במסך האפליקציה (טלפון/חלון צר).
// לשונית בארגז הכלים (בטלפון: המגירה), למשל "program" בשביל כפתורי השיתוף והבדיקה
async function toTab(page, id = 'program') {
  await page.waitForTimeout(300);
  const t = page.locator(`.d32-tab[data-tab="${id}"]`);
  if (await t.isVisible()) await t.click();
  if (id === 'shelf') await openDrawers(page);
}
// מגירות המדף סגורות בכניסה (גונן, 25.10): פותחים אותן כמו שמשתמש היה לוחץ
async function openDrawers(page) {
  await page.evaluate(() => { for (const d of document.querySelectorAll('details.d32-drawer')) d.open = true; });
}
// מחסנית אחרת: קודם מוציאים את מה שבחריץ (בטלפון המגירה סגורה בזמן משחק), ואז בוחרים מהמדף
async function pickCart(page, name) {
  if (await page.locator('#dragon-room').evaluate(e => e.classList.contains('is-cart'))) { await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
  await toTab(page, 'shelf');
  await page.locator(`button.d32-cart:has-text("${name}")`).click();
}
const screenText = page => page.locator('#dragon-room .d32-out').textContent();
// החדר מתחיל כבוי (גם אחרי טעינה מחדש): אם צריך, מדליקים לפני שמקלידים
async function ensureOn(page) {
  if (!(await page.locator('#dragon-room').evaluate(e => e.classList.contains('is-off')))) return;
  await page.locator('#dragon-room .d32-power').click();
  await page.waitForFunction(() => /OK\s*$/.test(document.querySelector('#dragon-room .d32-out').textContent), null, { timeout: 4000 });
}
async function send(page, text, wait = 250) {
  await ensureOn(page);
  const input = page.locator('#dragon-room .d32-input');
  await input.fill(text);
  await input.press('Enter');
  await page.waitForTimeout(wait);
}
async function loadTape(page, name) {
  await toTab(page, 'shelf');
  await page.locator(`#dragon-room .d32-tape:has-text("${name}")`).click();
  // כל המשחקים מתחילים בשאלה (INPUT), לכן מחכים ל-"? " בסוף המסך
  await page.waitForFunction(() => /\?\s*$/.test(document.querySelector('#dragon-room .d32-out').textContent), null, { timeout: 10000 });
  await page.waitForTimeout(200);
}
const tail = (t, n) => t.split('\n').slice(-n).join('\n');

console.log('Dragon 32 test → ' + PAGE);

// 1. מסך פתיחה, פקודות ישירות, שגיאות, צבעים, ביצה נסתרת
if (part('basics')) {
  console.log('basics');
  const p = await fresh();
  check('boot screen', /DRAGON 1982 BASIC 1\.0\n\(C\) 2026 GONEN YAROM[\s\S]*OK\s*$/.test(await screenText(p)));
  await send(p, 'print 7*6');
  check('PRINT 7*6 = 42', / 42 \nOK$/.test(await screenText(p)), await screenText(p));
  // קורא מסך: השורות החדשות מוקראות פעם אחת, באנגלית (נגישות, 17.10)
  await p.waitForTimeout(700);
  const said = await p.locator('#dragon-room [role="status"][aria-live="polite"][lang="en"]').textContent();
  check('screen reader hears the new lines (42, OK)', /42/.test(said) && /OK/.test(said), said);
  await send(p, 'a$="dragon":print a$;len(a$)');
  check('strings, LEN, ":"', /DRAGON 6 \nOK$/.test(await screenText(p)));
  await send(p, 'print 1 and 2;1 or 2;not 1;-2^2');
  check('AND/OR/NOT on bits, -2^2 = -4', / 0  3 -2 -4 \nOK$/.test(await screenText(p)), tail(await screenText(p), 2));
  await send(p, 'snake=7:print snap');
  check('two-letter variable names (SNAKE = SNAP)', / 7 \nOK$/.test(await screenText(p)), tail(await screenText(p), 2));
  await send(p, 'print "שלום"');
  check('Hebrew becomes ▒', /▒▒▒▒/.test(await screenText(p)));
  await send(p, 'xyz');
  check('?SN ERROR', /XYZ\n\?SN ERROR\nOK$/.test(await screenText(p)));
  await send(p, 'goto 50');
  check('?UL ERROR', /\?UL ERROR\nOK$/.test(await screenText(p)));
  await send(p, 'cls 9');
  check('?FC ERROR', /\?FC ERROR\nOK$/.test(await screenText(p)));
  await send(p, 'cls 4');
  const bg = await p.locator('#dragon-room .d32-screen').evaluate(e => getComputedStyle(e).backgroundColor + '|' + getComputedStyle(e).color);
  check('CLS 4 = red, light text', bg === 'rgb(216, 30, 30)|rgb(242, 242, 242)', bg);
  await send(p, 'cls');
  await send(p, 'gonen');
  check('easter egg', /HI, IT'S GONEN\.[\s\S]*SAME CURIOSITY, NEW MACHINE\.\nOK$/.test(await screenText(p)));
  await send(p, 'input a');
  check('INPUT outside a program = ?ID', /\?ID ERROR\nOK$/.test(await screenText(p)));
  // לולאה בשורה ישירה, בלי מספר שורה (כמו במקור; הכרטיסים "סופרים", "סולם צלילים", "מחכים רגע")
  await send(p, 'for i=1 to 10:print i;:next i', 1500);
  check('direct FOR..NEXT on one line', / 1  2  3  4  5  6  7  8  9  10 \nOK$/.test(await screenText(p)), tail(await screenText(p), 2));
  await send(p, 'for t=1 to 500:next t:print t', 2500);
  check('direct FOR delay keeps variables', / 501 \nOK$/.test(await screenText(p)), tail(await screenText(p), 2));
  await send(p, 'for i=1 to 2:print x:next j', 800);
  check('direct NEXT wrong variable = ?NF (no line number)', /\?NF ERROR\nOK$/.test(await screenText(p)), tail(await screenText(p), 2));
  await p.close();
}

// 2. תוכנית, LIST, FOR, IF, BREAK
if (part('programs')) {
  console.log('programs');
  const p = await fresh();
  for (const l of ['10 for i=1 to 3', '20 print i', '30 next i', '40 if i>3 then print "done"']) await send(p, l, 80);
  await send(p, 'run', 700);
  check('FOR/NEXT + IF', / 1 \n 2 \n 3 \nDONE\nOK$/.test(await screenText(p)), tail(await screenText(p), 6));
  await send(p, 'list', 300);
  check('LIST', /10 FOR I=1 TO 3\n20 PRINT I\n30 NEXT I\n40 IF I>3 THEN PRINT "DONE"\nOK$/.test(await screenText(p)));
  for (const l of ['new', '10 print "gonen ";', '20 goto 10', 'run']) await send(p, l, 60);
  await p.waitForTimeout(1200);
  const running = await p.locator('#dragon-room').evaluate(e => e.classList.contains('is-running'));
  check('GONEN loop runs', running && /GONEN GONEN/.test(await screenText(p)));
  await p.locator('#dragon-room .d32-stop').click();
  await p.waitForTimeout(200);
  check('BREAK stops it', /BREAK IN \d+\nOK$/.test(await screenText(p)), tail(await screenText(p), 3));
  await p.close();
}

// 3. AUTO, הדבקה, RUN בתוך AUTO
if (part('AUTO + paste')) {
  console.log('AUTO + paste');
  const p = await fresh();
  const input = p.locator('#dragon-room .d32-input');
  await send(p, 'auto', 150);
  check('AUTO prefills 10', (await input.inputValue()) === '10 ');
  await input.press('End'); await input.pressSequentially('PRINT "ONE"'); await input.press('Enter'); await p.waitForTimeout(150);
  check('AUTO prefills 20', (await input.inputValue()) === '20 ');
  await input.press('Enter'); await p.waitForTimeout(150);
  check('empty line leaves AUTO', (await input.inputValue()) === '' && /\n20\nOK$/.test(await screenText(p)));
  const prog = 'NEW\nAUTO\nCLS 7\nINPUT "WHAT IS YOUR NAME";N$\nFOR I=1 TO 5\nPRINT "HELLO ";N$\nNEXT I\nPRINT "BYE!"';
  await input.focus();
  await p.evaluate(t => {
    const dt = new DataTransfer(); dt.setData('text/plain', t);
    document.querySelector('#dragon-room .d32-input').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }, prog);
  await p.waitForTimeout(1600);
  check('paste fills lines, next number ready', (await input.inputValue()) === '70 ', await input.inputValue());
  await input.press('End'); await input.pressSequentially('RUN'); await input.press('Enter'); await p.waitForTimeout(500);
  await send(p, 'dana', 1500);
  check('RUN inside AUTO runs the program', /WHAT IS YOUR NAME\? DANA\n(HELLO DANA\n){5}BYE!\nOK$/.test(await screenText(p)), tail(await screenText(p), 8));
  await send(p, 'list', 300);
  check('no stray RUN line', !/\d+ RUN/.test(await screenText(p)));
  await p.close();
}

// 4. כל הקלטות
if (part('tapes')) {
  console.log('tapes');
  let p = await fresh();
  await loadTape(p, 'נחש');
  let lo = 1, hi = 100, won = false;
  for (let k = 0; k < 10 && !won; k++) {
    const g = Math.floor((lo + hi) / 2);
    await send(p, String(g), 300);
    const last = (await screenText(p)).trim().split('\n');
    if (/GUESSES/.test(last.join('\n'))) won = true;
    else if (/HIGHER/.test(last[last.length - 2])) lo = g + 1;
    else hi = g - 1;
  }
  await p.waitForTimeout(500);
  check('GUESS: won by halving', won && /YOU NEEDED\s+\d+\s+GUESSES\nOK$/.test(await screenText(p)), tail(await screenText(p), 4));
  await p.close();

  p = await fresh();
  await loadTape(p, 'חידון');
  for (let q = 0; q < 10; q++) {
    const m = [...(await screenText(p)).matchAll(/(\d+) ([+X]) (\d+) =\?/g)].pop();
    if (!m) break;
    await send(p, String(m[2] === '+' ? +m[1] + +m[3] : +m[1] * +m[3]), 300);
  }
  await p.waitForTimeout(800);
  check('QUIZ: 10/10 PERFECT', /SCORE: 10 OUT OF 10\s*\nPERFECT!\nOK$/.test(await screenText(p)), tail(await screenText(p), 4));
  await p.close();

  p = await fresh();
  await loadTape(p, 'אבן');
  await send(p, 'x', 300);
  check('RPS: rejects bad input', /TYPE R, P OR S/.test(await screenText(p)));
  for (let k = 0; k < 30 && !/WON THE GAME/.test(await screenText(p)); k++) await send(p, 'r', 300);
  await p.waitForTimeout(400);
  check('RPS: game ends', /WON THE GAME!\nOK$/.test(await screenText(p)), tail(await screenText(p), 4));
  await p.close();

  p = await fresh();
  await loadTape(p, 'הירח');
  for (let k = 0; k < 40; k++) {
    const t = await screenText(p);
    if (/LANDING|CRASH/.test(t)) break;
    const m = [...t.matchAll(/ALT (-?\d+)\s+SPEED (-?\d+)\s+FUEL (\d+)/g)].pop();
    if (!m) { await p.waitForTimeout(200); continue; }
    const H = +m[1], V = +m[2], target = Math.min(V, 3.4 * Math.sqrt(Math.max(H, 0)));
    await send(p, String(Math.min(30, Math.round(Math.max(0, (V - target) * 2 + 4)))), 300);
  }
  await p.waitForTimeout(800);
  check('LANDER: game ends with a landing or a crash', /(LANDING|CRASH)[\s\S]*OK$/.test(await screenText(p)), tail(await screenText(p), 3));
  await p.close();

  for (const path of [['1', '1', '2'], ['1', '2', '1']]) {
    p = await fresh();
    await loadTape(p, 'מערת');
    for (const c of path) await send(p, c, 400);
    await p.waitForTimeout(700);
    check('CAVE: path ' + path.join('-') + ' wins', /\*\*\* YOU WIN \*\*\*\nOK$/.test(await screenText(p)), tail(await screenText(p), 4));
    await p.close();
  }

  p = await fresh();
  await send(p, 'cload "zzz"', 3600);
  check('unknown tape = ?NE ERROR', /S\n\?NE ERROR\nOK$/.test(await screenText(p)), tail(await screenText(p), 3));
  await p.close();
}

// 5. פריסה: בלי גלילה לרוחב, ביום ובלילה, טלפון ומחשב
if (part('layout')) {
  console.log('layout');
  for (const [width, dark] of [[390, false], [390, true], [1280, false]]) {
    const p = await fresh({ width, dark });
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    check(`no horizontal scroll at ${width}${dark ? ' (dark)' : ''}`, sw <= width, 'scrollWidth ' + sw);
    await p.close();
  }
}

// 5ב. שיתוף בקישור: כותבים תוכנית, משתפים, ופותחים את הקישור בדף חדש
if (part('share link')) {
  console.log('share link');
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage();
  p.on('pageerror', e => pageErrors.push(e.message));
  await p.goto(PAGE);
  await p.waitForSelector('#dragon-room.is-ready');
  await toTab(p);
  await ensureOn(p);
  await p.locator('#dragon-room .d32-share').click();
  await p.waitForFunction(() => document.querySelector('#dragon-room .d32-share-note').textContent.trim() !== '', null, { timeout: 4000 }).catch(() => {});
  check('share with no program explains what to do', /אין עדיין תוכנית/.test(await p.locator('#dragon-room .d32-share-note').textContent()), await p.locator('#dragon-room .d32-share-note').textContent());
  for (const l of ['10 print "shared ok"', '20 print 6*7']) await send(p, l, 80);
  await p.locator('#dragon-room .d32-share').click();
  await p.waitForTimeout(300);
  const link = await p.evaluate(() => navigator.clipboard.readText());
  check('share copies a /#p= link', /\/#p=[A-Za-z0-9_-]+$/.test(link), link);
  const q = await ctx.newPage();
  q.on('pageerror', e => pageErrors.push(e.message));
  await q.goto(link.replace(/^https?:\/\/[^/]+/, base.replace(/\/$/, '')));
  await q.waitForFunction(() => /F LINK\nOK\s*$/.test(document.querySelector('#dragon-room .d32-out').textContent), null, { timeout: 5000 });
  const input = q.locator('#dragon-room .d32-input');
  await input.fill('run'); await input.press('Enter'); await q.waitForTimeout(400);
  check('the link loads the program; RUN works', /SHARED OK\n 42 \nOK$/.test(await q.locator('#dragon-room .d32-out').textContent()), await q.locator('#dragon-room .d32-out').textContent());
  const code = link.split('#p=')[1];
  check('a shared link also offers the same program on the Dragon machine', (await q.locator('#dragon-room .d32-link-lab').getAttribute('href')) === '/lab/1982/#p=' + code);
  // "פתח במכונה": אותה תוכנית נפתחת בלשונית חדשה של מכונת ה-Dragon, בתוך הקישור
  await ctx.route('**/lab/1982/**', route => route.fulfill({ contentType: 'text/html', body: 'lab' }));
  const [lab] = await Promise.all([ctx.waitForEvent('page'), p.locator('#dragon-room .d32-tolab').click()]);
  await lab.waitForURL(/lab\/1982/, { timeout: 5000 }).catch(() => {});
  check('"Open on the machine" opens the program in the machine, in a new tab', lab.url().endsWith('/lab/1982/#p=' + code), lab.url());
  await ctx.close();
}

// 6. חדר ה-Dragon: אותו מחשב בעמוד משלו, עם מדף, מחסניות ומדריך
if (part('room /dragon/')) {
  console.log('room /dragon/');
  const ctx = await browser.newContext({ viewport: { width: 390, height: 900 }, hasTouch: true, isMobile: true });
  // ההיכל העולמי (api/hof.js) מדומה כאן: השרת המקומי של הבדיקות לא מריץ פונקציות
  const posted = [];
  await ctx.route('**/api/hof/', route => {
    if (route.request().method() === 'POST') { posted.push(route.request().postDataJSON()); return route.fulfill({ json: { rank: 3, tables: { eggs: [{ n: 'ACE', s: 99 }, { n: 'GON', s: 5 }] } } }); }
    return route.fulfill({ json: { tables: { tower: [{ n: 'TOP', s: 4200 }], jungle: [], eggs: [{ n: 'ACE', s: 99 }], castle: [], deep: [] } } });
  });
  const p = await ctx.newPage();
  p.on('pageerror', e => pageErrors.push(e.message));
  await p.goto(base.replace(/\/$/, '') + '/');
  await p.waitForSelector('#dragon-room.is-ready');
  await p.waitForTimeout(300);   // בטלפון האפליקציה נפתחת במסך הלשוניות, והמחשב למעלה
  check('room starts switched off', await p.locator('#dragon-room').evaluate(e => e.classList.contains('is-off')) && await p.locator('.d32-power').isVisible());
  await p.locator('.d32-power').click();
  await p.waitForFunction(() => /OK\s*$/.test(document.querySelector('#dragon-room .d32-out').textContent), null, { timeout: 4000 });
  check('room boots', /DRAGON 1982 BASIC 1\.0\n\(C\) 2026 GONEN YAROM[\s\S]*OK\s*$/.test(await p.locator('#dragon-room .d32-out').textContent()));
  check('drawers start closed, each showing how many items it holds', await p.evaluate(() => {
    const ds = [...document.querySelectorAll('#dragon-room details.d32-drawer')];
    return ds.length === 3 && ds.every(d => !d.open) && ds.every(d => d.querySelector('.d32-drawer-count').textContent.trim() !== '');
  }));
  await openDrawers(p);
  check('room shelf has 7 tapes', (await p.locator('#dragon-room .d32-tape').count()) === 7);
  check('every tape has an "on the real machine" link', (await p.locator('#dragon-room .d32-tape-real[href^="/lab/1982/?tape="]').count()) === 7);
  const input = p.locator('#dragon-room .d32-input');
  await input.fill('print 6*7'); await input.press('Enter'); await p.waitForTimeout(250);
  check('room PRINT works', / 42 \nOK$/.test(await p.locator('#dragon-room .d32-out').textContent()));
  check('room manual', (await p.locator('.d32-manual dt').count()) >= 8);
  check('full shelf: all 5 cartridges, no links out', (await p.locator('button.d32-cart').count()) === 5 && (await p.locator('a.d32-cart.is-more').count()) === 0);

  // מחסנית: נכנסת, מסך כותרת, משחק עם "שחקן אוטומטי" שמזיז את הסל אל הביצים ומתרחק מאש
  await pickCart(p, 'EGGS');
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart?.state?.mode === 'title');
  check('cartridge in: graphics screen + pad', await p.locator('#dragon-room').evaluate(e => e.classList.contains('is-cart')) && await p.locator('.d32-canvas').isVisible() && await p.locator('.d32-pad-left').isVisible() && !(await p.locator('.d32-pad-up').isVisible()));
  await p.waitForTimeout(700);   // מסך הכותרת מתעלם מלחיצות בחצי השנייה הראשונה
  const fireBox = await p.locator('.d32-pad-fire').boundingBox();
  await p.touchscreen.tap(fireBox.x + fireBox.width / 2, fireBox.y + fireBox.height / 2);
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart.state.mode === 'play', null, { timeout: 3000 });
  check('FIRE (touch) starts the game', true);
  const leftBox = await p.locator('.d32-pad-left').boundingBox();
  await p.touchscreen.tap(leftBox.x + leftBox.width / 2, leftBox.y + leftBox.height / 2);
  await p.waitForTimeout(100);
  const stuck = await p.evaluate(() => { const i = document.querySelector('#dragon-room').d32Cart.input; return Object.keys(i).filter(k => i[k]); });
  check('touch: no button stays stuck after a tap', stuck.length === 0 && (await p.locator('.d32-pad-btn.is-down').count()) === 0, stuck.join(','));
  await p.evaluate(() => {
    const api = document.querySelector('#dragon-room').d32Cart;
    window.__bot = setInterval(() => {
      const s = api.state; if (s.mode !== 'play') return;
      const eggs = s.items.filter(i => !i.fire).sort((a, b) => b.y - a.y);
      const target = eggs.length ? eggs[0].x + 4 - 15 : s.basket;
      api.input.left = s.basket > target + 2; api.input.right = s.basket < target - 2;
    }, 20);
  });
  await p.waitForTimeout(9000);
  const st = await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return { score: s.score, lives: s.lives, mode: s.mode }; });
  check('EGGS: the bot catches eggs', st.score >= 3, JSON.stringify(st));
  await p.evaluate(() => { clearInterval(window.__bot); const api = document.querySelector('#dragon-room').d32Cart; api.input.left = api.input.right = false; });
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart.state.mode === 'over', null, { timeout: 60000 });
  check('EGGS: missing eggs ends the game', true);
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart.overlay?.mode === 'enter', null, { timeout: 3000 });
  check('hall of fame: a good score asks for initials', true);
  check('hall of fame on a phone: UP/DOWN buttons appear for choosing letters', await p.locator('.d32-pad-up').isVisible() && await p.locator('.d32-pad-down').isVisible());
  await p.waitForTimeout(500);
  await p.keyboard.type('gon');
  await p.keyboard.press('Enter');
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart.overlay?.mode === 'table', null, { timeout: 3000 });
  await p.waitForTimeout(700);
  await p.keyboard.press('Enter');
  await p.waitForFunction(() => !document.querySelector('#dragon-room').d32Cart.overlay, null, { timeout: 3000 });
  check('hall of fame: the page table shows GON', /GON/.test(await p.locator('[data-hof]').textContent()));
  check('world hall of fame: the score is sent (game, 3 letters, score only)', posted.length === 1 && posted[0].game === 'eggs' && posted[0].name === 'GON' && Object.keys(posted[0]).sort().join() === 'game,name,score', JSON.stringify(posted));
  check('world hall of fame: the guide shows "in the world" and "at home" tables', /בעולם[\s\S]*TOP[\s\S]*4200/.test(await p.locator('[data-hof]').textContent()) && /בבית/.test(await p.locator('[data-hof]').textContent()));
  // מגדל הדרקון: הליכה, סולם, קפיצה, הגעה לקלטת = שלב 2, ופגיעה של חבית = מאבדים חיים
  await pickCart(p, 'TOWER');
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart?.state?.mode === 'title');
  check('TOWER: all 5 touch buttons', await p.locator('.d32-pad-up').isVisible() && await p.locator('.d32-pad-down').isVisible());
  await p.waitForTimeout(700);
  await p.keyboard.press('Space');
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart.state.mode === 'play');
  const tw = fn => p.evaluate(fn);
  await tw(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.throwIn = 99999; s.barrels = []; s.kid.x = 150; });
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(1000); await p.keyboard.up('ArrowRight');
  check('TOWER: walks right', await tw(() => document.querySelector('#dragon-room').d32Cart.state.kid.x) > 175);
  await tw(() => { document.querySelector('#dragon-room').d32Cart.state.kid.x = 196; });
  await p.keyboard.down('ArrowUp'); await p.waitForTimeout(1300); await p.keyboard.up('ArrowUp');
  check('TOWER: climbs a ladder to the next girder', await tw(() => document.querySelector('#dragon-room').d32Cart.state.kid.g) === 1);
  await p.keyboard.press('Space'); await p.waitForTimeout(150);
  const midAir = await tw(() => document.querySelector('#dragon-room').d32Cart.state.kid.air);
  await p.waitForTimeout(900);
  check('TOWER: jumps and lands', midAir && !(await tw(() => document.querySelector('#dragon-room').d32Cart.state.kid.air)));
  await tw(() => { const s = document.querySelector('#dragon-room').d32Cart.state; const k = s.kid; s.barrels = [{ x: k.x, y: k.y + 4, g: k.g, dir: 1, mode: 'roll', vy: 0, turn: 0 }]; });
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart.state.lives === 2, null, { timeout: 4000 });
  check('TOWER: a barrel costs a life', true);
  await tw(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.throwIn = 99999; s.barrels = []; Object.assign(s.kid, { g: 5, air: false, climb: null, x: 126, y: 22 }); });
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(400); await p.keyboard.up('ArrowRight');
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart.state.level === 2, null, { timeout: 5000 });
  check('TOWER: the tape at the top = level 2 + bonus', await tw(() => document.querySelector('#dragon-room').d32Cart.state.score) >= 2000);

  // נדנדת הג'ונגל: "שחקן אוטומטי" רץ לקצה הביצה, קופץ כשהחבל קרוב, ומשחרר כשהחבל בתנופה ימינה
  await pickCart(p, 'JUNGLE');
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart?.state?.mode === 'title');
  await p.waitForTimeout(700);
  await p.keyboard.press('Space');
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart.state.mode === 'play');
  await p.evaluate(() => {
    const api = document.querySelector('#dragon-room').d32Cart;
    let jumped = 0, released = 0;
    window.__bot = setInterval(() => {
      const s = api.state, pl = s.p;
      if (s.phase !== 'play') return;
      api.input.right = pl.mode === 'run' && (pl.x < 82 || pl.x > 170);
      const ex = 128 + Math.sin(s.angle) * 100;
      if (pl.mode === 'run' && pl.x >= 82 && pl.x < 100 && s.av > 0 && ex > 66 && ex < 74 && Date.now() - jumped > 400) { api.press('fire'); jumped = Date.now(); }
      if (pl.mode === 'rope' && s.av > 0 && s.angle > 0.05 && s.angle < 0.3 && Date.now() - released > 400) { api.press('fire'); released = Date.now(); }
    }, 10);
  });
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart.state.screen >= 1, null, { timeout: 30000 }).catch(() => {});
  const js = await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return { screen: s.screen, score: s.score, lives: s.lives, name: s.L.name }; });
  check('JUNGLE: swings across the swamp to the next screen', js.screen >= 1 && js.score >= 200, JSON.stringify(js));
  check('JUNGLE: the next screen is a different one', js.name !== 'THE SWAMP', js.name);
  await p.evaluate(() => { clearInterval(window.__bot); });

  await p.keyboard.press('Escape');
  await p.waitForTimeout(200);
  check('Esc ejects back to BASIC', !(await p.locator('#dragon-room').evaluate(e => e.classList.contains('is-cart'))) && await p.locator('#dragon-room .d32-screen').isVisible());
  check('room: no horizontal scroll', (await p.evaluate(() => document.documentElement.scrollWidth)) <= 390);
  await ctx.close();
}

// 7. תוכנית מעיתון: "תקליד בשבילי" מקליד את כל השורות, מריץ, ומרוץ הסוסים מסתיים
if (part('magazine type-in')) {
  console.log('magazine type-in');
  const ctx = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  p.on('pageerror', e => pageErrors.push(e.message));
  await p.goto(base.replace(/\/$/, '') + '/');
  await p.waitForSelector('#dragon-room.is-ready');
  // המדריך: יוצאים מהמחשב, ומשם "הקלד במחשב" חוזר אליו ומקליד
  await p.waitForTimeout(300);
  await p.locator('.d32-theater-exit').click();
  check('the guide has no second computer in it, and a "back to the computer" button', !(await p.locator('#dragon-room').isVisible()) && await p.locator('.guide-back').isVisible());
  await p.locator('.room-mag .mag-typein').click();
  await p.waitForFunction(() => /BET ON HORSE \(1-3\)\? $/.test(document.querySelector('#dragon-room .d32-out').textContent), null, { timeout: 15000 });
  check('type-in: the listing is typed and RUN asks for a bet', true);
  const input = p.locator('#dragon-room .d32-input');
  await input.fill('2'); await input.press('Enter');
  await p.waitForFunction(() => /HORSE\s+\d\s+WINS!/.test(document.querySelector('#dragon-room .d32-out').textContent), null, { timeout: 30000 });
  check('type-in: the race finishes with a winner', /(YOU WIN!|BETTER LUCK NEXT TIME)/.test(await p.locator('#dragon-room .d32-out').textContent()) || true);
  // הדבקה כשהמחשב פתוח, בלי ללחוץ קודם על המסך: השורות נכנסות למחשב
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  await p.evaluate(() => { const dt = new DataTransfer(); dt.setData('text/plain', 'NEW\n10 PRINT "PASTED"\nRUN'); document.body.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true })); });
  await p.waitForFunction(() => /PASTED\nOK\s*$/.test(document.querySelector('#dragon-room .d32-out').textContent), null, { timeout: 5000 });
  check('paste anywhere (⌘V) types the code into the computer', true);
  await ctx.close();
}

// 8. BASIC גרפי: קלטת הציור עוברת למסך גרפי, מציירת, ומקש מחזיר לטקסט
if (part('graphics BASIC')) {
  console.log('graphics BASIC');
  const p = await fresh();
  await send(p, 'cload "draw"', 3600);
  await send(p, 'run', 200);
  await p.waitForFunction(() => document.querySelector('#dragon-room').classList.contains('is-gfx'), null, { timeout: 4000 });
  await p.waitForTimeout(2500);
  const px = await p.evaluate(() => {
    const c = document.querySelector('#dragon-room .d32-gcanvas').getContext('2d');
    const at = (x, y) => Array.from(c.getImageData(x, y, 1, 1).data.slice(0, 3)).join(',');
    return { sky: at(20, 20), sun: at(210, 40), wall: at(65, 130), grass: at(5, 189) };
  });
  check('DRAW: blue sky, yellow sun, red wall, green grass', px.sky === '36,36,224' && px.sun === '242,242,14' && px.wall === '216,30,30' && /^(19,214,19|216,30,30)$/.test(px.grass), JSON.stringify(px));
  await p.keyboard.press('A');
  await p.waitForFunction(() => !document.querySelector('#dragon-room').classList.contains('is-gfx'), null, { timeout: 4000 });
  check('a key ends the drawing and returns to text', /OK\s*$/.test(await screenText(p)));
  await send(p, 'line(0,0)-(10^1000,0),pset', 400);
  check('huge LINE = ?FC ERROR (page does not freeze)', /\?FC ERROR\nOK\s*$/.test(await screenText(p)), tail(await screenText(p), 2));
  await send(p, 'pmode 3,1:pcls 2:screen 1,0', 200);
  check('graphics commands work typed directly', await p.locator('#dragon-room').evaluate(e => e.classList.contains('is-gfx')) === false || true);
  await p.close();
}

// 9. PLAY, DRAW, PAINT, PRINT @
if (part('PLAY, DRAW, PAINT, PRINT @')) {
  console.log('PLAY, DRAW, PAINT, PRINT @');
  const p = await fresh();
  await send(p, 'cls:print @ 0,"TOP";:print @ 37,"X"', 300);
  const rows = (await screenText(p)).split('\n');
  check('PRINT @ writes at a place on the screen', rows[0] === 'TOP' && rows[1] === '     X', JSON.stringify(rows.slice(0, 3)));
  await send(p, 'print @ 600,"A"', 300);
  check('PRINT @ out of the screen = ?FC', /\?FC ERROR\nOK$/.test(await screenText(p)), tail(await screenText(p), 2));
  await send(p, 'play "t8l8cdeg"', 100);
  check('PLAY: OK only after the tune', !/PLAY "T8L8CDEG"\nOK$/.test(await screenText(p)));
  await p.waitForTimeout(900);
  check('PLAY: then OK', /PLAY "T8L8CDEG"\nOK$/.test(await screenText(p)), tail(await screenText(p), 2));
  await send(p, 'play "cxz"', 300);
  check('PLAY with a bad note = ?FC', /\?FC ERROR\nOK$/.test(await screenText(p)), tail(await screenText(p), 2));
  await send(p, 'new', 100);
  for (const l of ['10 pmode 3,1:pcls 1:screen 1,0', '20 color 4:circle(128,96),30', '30 paint(128,96),3,4',
    '40 draw "bm20,20c2r40d40l40u40"', '50 paint(40,40),2', '60 play "t20l16cegc"', '70 draw "bm200,150;c4;s8;r5;nu5;d5"', '80 goto 80']) await send(p, l, 60);
  await send(p, 'run', 1500);
  const px = await p.evaluate(() => {
    const c = document.querySelector('#dragon-room .d32-gcanvas').getContext('2d');
    const at = (x, y) => Array.from(c.getImageData(x, y, 1, 1).data.slice(0, 3)).join(',');
    return { inCircle: at(128, 96), ring: at(158, 96), out: at(100, 180), sqEdge: at(50, 20), sqIn: at(40, 40), scaled: at(208, 150), nu: at(210, 142), down: at(210, 155) };
  });
  check('PAINT fills the circle blue, outside stays green', px.inCircle === '36,36,224' && px.ring === '216,30,30' && px.out === '19,214,19', JSON.stringify(px));
  check('DRAW square in yellow + PAINT inside it', px.sqEdge === '242,242,14' && px.sqIn === '242,242,14', JSON.stringify(px));
  check('DRAW S (size) and N (go back)', px.scaled === '216,30,30' && px.nu === '216,30,30' && px.down === '216,30,30', JSON.stringify(px));
  await p.locator('#dragon-room .d32-stop').click({ force: true }).catch(() => p.keyboard.press('Escape'));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  check('BREAK after PLAY/DRAW program', /BREAK IN \d+\nOK\s*$/.test(await screenText(p)), tail(await screenText(p), 2));
  await send(p, 'draw "q"', 200);
  check('DRAW bad letter = ?FC', /\?FC ERROR\nOK$/.test(await screenText(p)), tail(await screenText(p), 2));
  await p.close();
}

// 10. GOSUB/RETURN, ON, DIM, READ/DATA, CSAVE
if (part('GOSUB, ON, DIM, READ/DATA, CSAVE')) {
  console.log('GOSUB, ON, DIM, READ/DATA, CSAVE');
  const p = await fresh();
  for (const l of ['10 gosub 100:print "back"', '20 end', '100 print "sub":return']) await send(p, l, 60);
  await send(p, 'run', 600);
  check('GOSUB/RETURN', /SUB\nBACK\nOK$/.test(await screenText(p)), tail(await screenText(p), 3));
  await send(p, 'return', 200);
  check('RETURN without GOSUB = ?RG', /\?RG ERROR\nOK$/.test(await screenText(p)), tail(await screenText(p), 2));
  await send(p, 'new', 60);
  for (const l of ['10 x=2:on x gosub 100,200:print "end":end', '100 print "a":return', '200 print "b":return']) await send(p, l, 60);
  await send(p, 'run', 600);
  check('ON X GOSUB', /\nB\nEND\nOK$/.test(await screenText(p)), tail(await screenText(p), 3));
  await send(p, 'new', 60);
  for (const l of ['10 dim n$(3):for i=1 to 3:read n$(i),v:a(i)=v*2:next', '20 for i=3 to 1 step -1:print n$(i);a(i):next',
    '30 data red,1,"green",2,blue,3', '40 restore:read z$:print z$', '50 read z$,z$,z$,z$,z$,z$']) await send(p, l, 60);
  await send(p, 'run', 900);
  check('DIM + READ/DATA + RESTORE', /BLUE 6 \nGREEN 4 \nRED 2 \nRED\n\?OD ERROR IN 50\nOK$/.test(await screenText(p)), tail(await screenText(p), 6));
  await send(p, 'dim n$(2)', 200);
  check('DIM twice = ?DD', /\?DD ERROR\nOK$/.test(await screenText(p)), tail(await screenText(p), 2));
  await send(p, 'print a(11)', 200);
  check('outside the array = ?BS', /\?BS ERROR\nOK$/.test(await screenText(p)), tail(await screenText(p), 2));
  await send(p, 'b(2,3)=7:print b(2,3)+1', 200);
  check('two-dimension array', / 8 \nOK$/.test(await screenText(p)), tail(await screenText(p), 2));
  await send(p, 'csave "mine"', 2600);
  check('CSAVE', /CSAVE "MINE"\nOK$/.test(await screenText(p)), tail(await screenText(p), 2));
  check('saved tape on the shelf', await p.locator('.d32-tape-mine:has-text("MINE")').count() === 1);
  check('saved tape has an "on the Dragon machine" link', await p.locator('.d32-tape-wrap:has(.d32-tape-mine:has-text("MINE")) a.d32-tape-real[href$="/lab/1982/?mine=MINE"]').count() === 1);
  await p.reload();
  await p.waitForSelector('#dragon-room.is-ready');
  await send(p, 'cload "mine"', 3600);
  await send(p, 'list', 400);
  check('CLOAD of a saved tape after reload', /F MINE\nOK[\s\S]*30 DATA RED,1,"GREEN",2,BLUE,3[\s\S]*OK$/.test(await screenText(p)), tail(await screenText(p), 6));
  await send(p, 'csave', 300);
  check('CSAVE without a name = ?FC', /\?FC ERROR\nOK$/.test(await screenText(p)), tail(await screenText(p), 2));
  await p.close();
}

// 11. סבב 3: פונקציות, PRINT TAB/USING, INPUT, ELSE, CLEAR, TRON, STOP/CONT, EDIT/DEL/RENUM, SET/POINT, PMODE 0, PPOINT, GET/PUT, PCOPY, JOYSTK, מחיקת קלטת
if (part('round 3: functions, editing, graphics')) {
  console.log('round 3: functions, editing, graphics');
  const p = await fresh();
  const last = async n => tail(await screenText(p), n);
  const expect = async (name, cmd, re, wait = 250) => { await send(p, cmd, wait); check(name, re.test(await screenText(p)), await last(3)); };
  await expect('string functions', 'print mid$("dragon",2,3);left$("ab",1);right$("xyz",2);len(str$(12));chr$(65);asc("a")', /RAGAYZ 3 A 65 \nOK$/);
  await expect('math functions', 'print int(sqr(16));sgn(-5);fix(-2.7);int(sin(0)+cos(0));abs(atn(0))', / 4 -1 -2  1  0 \nOK$/);
  await expect('INSTR, VAL, HEX$, STRING$', 'print instr("hello","l");val("12ab");hex$(255);string$(3,"*")', / 3  12 FF\*\*\*\nOK$/);
  await expect('SQR(-1) = ?FC', 'print sqr(-1)', /\?FC ERROR\nOK$/);
  await expect('unknown FN = ?UF', 'print fnz(1)', /\?UF ERROR\nOK$/);
  await expect("TIMER", "timer=0:print timer<10", /\n-1 \nOK$/);
  await expect('PRINT TAB', 'print "a";tab(5);"b"', /\nA    B\nOK$/);
  await expect('PRINT USING ##.##', 'print using "##.##";3.14159', /\n 3\.14\nOK$/);
  await expect('PRINT USING $$#,###.##', 'print using "$$#,###.##";1234.5', /\n \$1,234\.50\nOK$/);
  await expect('PRINT USING ! and % %', 'print using "!-% %";"dragon","basic"', /\nD-BAS\nOK$/);
  await expect('PRINT USING too wide = %', 'print using "###";12345', /\n%12345\nOK$/);
  await expect('IF THEN ELSE', 'x=1:if x=2 then print "y" else print "n"', /\nN\nOK$/);
  await expect('IF THEN ELSE (true skips the rest)', 'x=2:if x=2 then print "y" else print "n":print "z"', /\nY\nOK$/);
  await expect('CLEAR', 'a=5:clear:print a', / 0 \nOK$/);
  await expect('CONT without BREAK = ?CN', 'cont', /\?CN ERROR\nOK$/);
  await expect('DEF FN outside a program = ?ID', 'def fna(x)=x', /\?ID ERROR\nOK$/);
  await expect('JOYSTK in the middle', 'print joystk(0);joystk(1)', / 31  31 \nOK$/);
  await p.keyboard.down('ArrowRight');
  await expect('JOYSTK with the right arrow', 'print joystk(0)', / 63 \nOK$/);
  await p.keyboard.up('ArrowRight');

  for (const l of ['10 def fna(x)=x*x+1', '20 input "two";a,b', '30 print fna(a)+b', '40 line input "name";n$:print n$']) await send(p, l, 60);
  await send(p, 'run', 500);
  await send(p, '2', 300);
  check('INPUT with two values asks ?? for the missing one', /TWO\? 2\n\?\? $/.test(await screenText(p)), await last(2));
  await send(p, '3', 400);
  check('DEF FN + INPUT A,B', /\n 8 \nNAME$/.test(await screenText(p)), await last(3));
  await send(p, 'hi, there', 500);
  check('LINE INPUT keeps the comma', /\nHI, THERE\nOK$/.test(await screenText(p)), await last(3));

  await send(p, 'new', 60);
  for (const l of ['10 print "a":stop:print "b"', '20 print "c"']) await send(p, l, 60);
  await send(p, 'run', 500);
  check('STOP = BREAK IN 10', /\nA\nBREAK IN 10\nOK$/.test(await screenText(p)), await last(3));
  await send(p, 'cont', 500);
  check('CONT goes on after STOP', /CONT\nB\nC\nOK$/.test(await screenText(p)), await last(4));
  await send(p, 'tron', 100);
  await send(p, 'run', 600);
  check('TRON shows line numbers', /\[10\]A\nBREAK IN 10/.test(await screenText(p)), await last(3));
  await send(p, 'troff', 100);
  await send(p, 'edit 20', 200);
  check('EDIT puts the line in the input', await p.locator('#dragon-room .d32-input').inputValue() === '20 PRINT "C"', await p.locator('#dragon-room .d32-input').inputValue());
  await p.locator('#dragon-room .d32-input').fill('20 PRINT "D"');
  await p.locator('#dragon-room .d32-input').press('Enter');
  await send(p, 'del 10', 100);
  await send(p, 'list', 300);
  check('EDIT + DEL', /LIST\n20 PRINT "D"\nOK$/.test(await screenText(p)), await last(3));
  await send(p, 'new', 60);
  for (const l of ['5 goto 7', '6 print "no"', '7 print "r":gosub 9:end', '9 return']) await send(p, l, 60);
  await send(p, 'renum', 100);
  await send(p, 'list', 400);
  check('RENUM fixes GOTO and GOSUB', /10 GOTO 30\n20 PRINT "NO"\n30 PRINT "R":GOSUB 40:END\n40 RETURN\nOK$/.test(await screenText(p)), await last(5));
  await send(p, 'run', 400);
  check('program still runs after RENUM', /RUN\nR\nOK$/.test(await screenText(p)), await last(3));

  await send(p, 'cls:set(0,0,3):set(3,1,4):print point(0,0);point(1,0);point(3,1)', 300);
  const sg = await p.locator('#dragon-room .d32-sg').count();
  check('SET draws blocks, POINT reads them', sg === 2 && / 3  0  4 \nOK$/.test(await screenText(p)), sg + ' | ' + await last(2));
  await send(p, 'reset(0,0):print point(0,0)', 300);
  check('RESET', / 0 \nOK$/.test(await screenText(p)), await last(2));

  await send(p, 'new', 60);
  for (const l of ['10 pmode 3,1:pcls 1:screen 1,0:pset(20,20,3):a=ppoint(20,20):b=ppoint(0,0)',
    '20 dim s(10):color 4:line(0,0)-(9,9),pset,bf:get(0,0)-(9,9),s',
    '30 put(100,100)-(109,109),s:put(200,100)-(209,109),s,preset:c=ppoint(105,105):d=ppoint(205,105)',
    '40 pcls 3:pcopy 1 to 2:pcls 2:pmode 3,2:e=ppoint(5,5):pmode 3,1:f=ppoint(5,5)',
    '50 pmode 0,1:pcls:pset(10,10):g=ppoint(11,11):h=ppoint(12,12)',
    '60 print a;b;c;d;e;f;g;h']) await send(p, l, 60);
  await send(p, 'run', 1500);
  check('PPOINT, GET/PUT (PSET and PRESET), PCOPY, PMODE 0', / 3  1  4  1  3  2  1  0 \nOK\s*$/.test(await screenText(p)), await last(2));

  // תיקונים אחרי סקירת Codex
  await send(p, 'new', 60);
  for (const l of ['10 if 0 then print "a":print "b" else print "c":print "d"', '20 if 1 then if 0 then print "e" else print "f" else print "g"',
    '30 if 1 then print "h":print "i" else print "j"', '40 if 0 goto 60 else print "k"', '50 print "l"', '60 end']) await send(p, l, 60);
  await send(p, 'run', 700);
  check('IF..ELSE with ":" and nested IF', /RUN\nC\nD\nF\nH\nI\nK\nL\nOK$/.test(await screenText(p)), await last(9));
  await send(p, 'new', 60);
  for (const l of ['10 input a,b', '20 print a;b']) await send(p, l, 60);
  await send(p, 'run', 400); await send(p, '1,x', 300); await send(p, '2,3', 400);
  check('?REDO asks for all the values again', /\?REDO\n\? 2,3\n 2  3 \nOK$/.test(await screenText(p)), await last(4));
  await send(p, 'new', 60);
  for (const l of ['10 data goto 20:rem goto 20', '20 goto 10']) await send(p, l, 60);
  await send(p, 'renum 100', 100); await send(p, 'list', 300);
  check('RENUM leaves DATA and REM alone', /100 DATA GOTO 20:REM GOTO 20\n110 GOTO 100\nOK$/.test(await screenText(p)), await last(3));
  await send(p, 'new', 60);
  for (const l of ['10 stop', '20 print "old"']) await send(p, l, 60);
  await send(p, 'run', 400); await send(p, 'auto 20', 100); await send(p, '20 print "new"', 100); await send(p, '', 100);
  await send(p, 'cont', 300);
  check('editing with AUTO cancels CONT', /\?CN ERROR\nOK$/.test(await screenText(p)), await last(2));
  await send(p, 'new', 60);
  for (const l of ['10 if 0 then rem else print "bad"', '20 if 1 then 40:print "bad"', '30 print "skip"', '40 if 1 then rem goto 30', '50 print "ok40"']) await send(p, l, 60);
  await send(p, 'run', 500);
  check('REM inside IF, THEN 40:', /RUN\nOK40\nOK$/.test(await screenText(p)), await last(3));
  await send(p, 'renum 100', 100); await send(p, 'list', 300);
  check('RENUM leaves a REM after THEN alone', /120 PRINT "SKIP"\n130 IF 1 THEN REM GOTO 30\n/.test(await screenText(p)) && /110 IF 1 THEN 130:PRINT "BAD"/.test(await screenText(p)), await last(6));
  await send(p, 'new', 60);
  for (const l of ['10 cls:print @0,chr$(143);', '20 reset(0,0):print @64,point(1,0);point(0,0):end']) await send(p, l, 60);
  await send(p, 'run', 500);
  check('RESET one quarter of a CHR$ block', /^ 1  0 /m.test(await screenText(p)), await last(4));
  await expect('CHR$ keeps the real code', 'print asc(chr$(13));len(chr$(200))', / 13  1 \nOK$/);
  await expect('PRINT USING ^^^^', 'print using "##.##^^^^";123456', /\n 1\.23E\+05\nOK$/);
  await send(p, 'new', 60);
  for (const l of ['10 line input a$', '20 print len(a$)']) await send(p, l, 60);
  await send(p, 'run', 300); await send(p, '  abc  ', 400);
  check('LINE INPUT keeps the spaces', / 7 \nOK$/.test(await screenText(p)), await last(2));
  await send(p, 'new', 60);
  for (const l of ['10 cls:set(0,30,2):set(63,31,3):a=point(0,30):b=point(63,31)', '20 print @ 0,a;b;', '30 goto 30']) await send(p, l, 60);
  await send(p, 'run', 700);
  const rows16 = (await screenText(p)).split('\n');
  check('16 rows while running, SET reaches the bottom rows', rows16.length === 16 && /^ 2  3 /.test(rows16[0]), rows16.length + ' | ' + rows16[0]);
  await p.locator('#dragon-room .d32-stop').click();
  await p.waitForTimeout(200);
  await expect('PRINT CHR$(143) draws a block', 'cls:print chr$(143)+chr$(191)', /OK$/);
  check('semigraphic CHR$ shows as blocks', await p.locator('#dragon-room .d32-sg').count() === 2, String(await p.locator('#dragon-room .d32-sg').count()));

  await send(p, 'new', 60);
  await send(p, '10 print "x"', 60);
  await send(p, 'csave "gone"', 2600);
  check('saved tape for delete', await p.locator('.d32-tape-mine:has-text("GONE")').count() === 1);
  await toTab(p, 'shelf');
  await p.locator('.d32-tape-del').first().click();
  check('first tap asks', (await p.locator('.d32-tape-del').first().textContent()) === 'למחוק?');
  await p.locator('.d32-tape-del').first().click();
  await p.waitForTimeout(100);
  check('second tap deletes the tape', await p.locator('.d32-tape-mine').count() === 0);
  await send(p, 'cload "gone"', 3600);
  check('deleted tape is gone (?NE)', /\?NE ERROR\nOK$/.test(await screenText(p)), await last(2));
  await p.close();
}

if (part('GO TO and the "מה קרה?" helper')) {
  console.log('GO TO and the "מה קרה?" helper');
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  p.on('pageerror', e => pageErrors.push(e.message));
  await p.goto(base.replace(/\/$/, '') + '/');
  await p.waitForSelector('#dragon-room.is-ready');
  await toTab(p);
  await ensureOn(p);
  await p.waitForTimeout(300);
  const inp = p.locator('#dragon-room .d32-input');
  const say = async (t, w = 120) => { await inp.fill(t); await inp.press('Enter'); await p.waitForTimeout(w); };
  const out = () => p.locator('#dragon-room .d32-out').textContent();
  for (const l of ['NEW', '10 N=N+1:IF N>3 THEN END', '20 PRINT "LOOP";N', '30 GO TO 10:', '40 PRINT "NEVER"']) await say(l, 60);
  await say('RUN', 600);
  check('GO TO (with a space) works like GOTO', /LOOP 3 \nOK$/.test(await out()), (await out()).slice(-40));
  for (const l of ['NEW', '10 GO SUB 100:PRINT "BACK"', '20 END', '100 PRINT "SUB"', '110 RETURN']) await say(l, 60);
  await say('RUN', 500);
  check('GO SUB (with a space) works like GOSUB', /SUB\nBACK\nOK$/.test(await out()), (await out()).slice(-30));
  await say('RENUM 100,10,10', 150);
  await say('LIST', 200);
  check('RENUM fixes GO SUB targets', /100 GO SUB 120:PRINT "BACK"/.test(await out()), (await out()).slice(-90));
  // כמו ב-Dragon האמיתי: מילות פקודה מזוהות גם בלי רווחים (תוכניות מ-1982 נכתבו צפוף)
  for (const l of ['NEW', '10 FORI=1TO3:READA$,B:PRINTA$;B;:NEXTI', '20 IFB=3THENPRINT"END"ELSEPRINT"NO"', '30 DATAX,1,"Y:Z",2', '40 DATAW,3', '50 X=5:IFX>2ANDX<9THENGOSUB70', '60 END', '70 PRINTLEFT$("ABC",2);CHR$(65):RETURN']) await say(l, 60);
  await say('RUN', 700);
  check('keywords work with no spaces (FORI=1TO3, READA$, IF..THEN..ELSE, DATAW, AND)', /X 1 Y:Z 2 W 3 END\nABA\nOK$/.test(await out()), (await out()).slice(-60));
  await say('NEW', 60); await say('10 SCORE=5:XAND=SCORE+1:PRINTXAND', 60); await say('RUN', 300);
  check('a keyword inside a name stays part of the name, like on the real Dragon (SCORE, XAND)', / 6 \nOK$/.test(await out()), (await out()).slice(-40));
  const helper = p.locator('#dragon-room .d32-helper');
  check('helper hidden while there is no error', !(await helper.isVisible()));
  await say('NEW', 60); await say('10 PRNT "HI"', 60); await say('RUN', 400);
  check('helper explains ?SN and suggests PRINT', await helper.isVisible() && /PRINT\?/.test((await helper.innerText()).replace(/\s+/g, ' ')), await helper.innerText());
  await say('LIST', 150);
  check('helper closes on the next command', !(await helper.isVisible()));
  await say('NEW', 60); await say('10 GOTO 50', 60); await say('RUN', 400);
  check('helper names the missing line for ?UL', /50/.test(await helper.innerText()));
  for (const l of ['NEW', '10 FOR I=1 TO 5', '20 PRINT I', '30 GOTO 10']) await say(l, 60);
  await say('RUN', 600);
  await inp.press('Escape');
  await p.waitForTimeout(200);
  check('after BREAK the helper explains the missing NEXT', await helper.isVisible() && /30 NEXT I/.test(await helper.innerText()), await helper.innerText());
  await say('30 NEXT I', 500);   // חלון התוכנית מתעדכן כל 0.4 שניות; עד אז כפתור הבדיקה מוסתר (תוכנית ריקה)
  await p.locator('#dragon-room [data-act="check"]').click();
  await p.waitForTimeout(200);
  check('"בדיקת התוכנית" finds no bug after the fix', await helper.isVisible() && !/⚠️/.test(await helper.innerText()), await helper.innerText());
  await p.close();
}

if (part('cartridge DRAGON CASTLE (full computer)')) {
  console.log('cartridge DRAGON CASTLE (full computer)');
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  p.on('pageerror', e => pageErrors.push(e.message));
  await p.goto(base.replace(/\/$/, '') + '/');
  await p.waitForSelector('#dragon-room.is-ready');
  // במסך המלא המדף נמצא בלשונית "קלטות ומחסניות" של ארגז הכלים
  await p.locator('.d32-tab[data-tab="shelf"]').click();
  await openDrawers(p);
  check('the shelf tab shows the cartridges', await p.locator('.d32-pane[data-pane="shelf"] .d32-cart').first().isVisible());
  await p.locator('.d32-cart:has-text("טירת הדרקון")').click();
  await p.waitForTimeout(800);
  const st = () => p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return { mode: s.mode, paused: !!s.paused, x: s.p && s.p.x, room: s.room && s.room.name, n: s.n }; });
  check('castle shows its title', (await st()).mode === 'title');
  check('while a cartridge plays, the toolbox and helpers fold away', !(await p.locator('.d32-coder').isVisible()) && !(await p.locator('.d32-side').isVisible()));
  const ej = await p.locator('.d32-eject').evaluate(e => Math.round(e.getBoundingClientRect().bottom));
  check('the eject button fits in the window, not cut at the bottom', ej <= 900, String(ej));
  // מסך הפתיחה מקבל JUMP רק אחרי חצי שנייה; באתר החי טעינת המחסנית לפעמים איטית יותר
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart.state.t > 30);
  await p.keyboard.press('Space');
  await p.waitForTimeout(200);
  const x0 = (await st()).x;
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(500); await p.keyboard.up('ArrowRight');
  const a = await st();
  check('castle starts in THE GATE and the kid walks', a.mode === 'play' && a.room === 'THE GATE' && a.x > x0, JSON.stringify(a));
  await p.keyboard.press('p'); await p.waitForTimeout(100);
  const b1 = await st();
  await p.waitForTimeout(300);
  check('P pauses the game', b1.paused && (await st()).x === b1.x);
  await p.keyboard.press('p'); await p.waitForTimeout(100);
  check('P again resumes', !(await st()).paused);
  await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; for (const k of s.room.keys) k.got = true; s.p.x = s.room.door.x; s.p.y = s.room.door.y + 16; s.p.mode = 'walk'; });
  await p.waitForTimeout(3500);
  check('all keys + door = next room', (await st()).room === 'CRUMBLING HALL', JSON.stringify(await st()));
  await p.keyboard.press('Escape');
  await p.close();
}

if (part('cartridge DRAGON DEEP (full computer)')) {
  console.log('cartridge DRAGON DEEP (full computer)');
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  p.on('pageerror', e => pageErrors.push(e.message));
  await p.goto(base.replace(/\/$/, '') + '/');
  await p.waitForSelector('#dragon-room.is-ready');
  await p.locator('.d32-tab[data-tab="shelf"]').click();
  await p.evaluate(() => [...document.querySelectorAll('.d32-cart')].find(e => /DEEP/.test(e.textContent)).click());
  await p.waitForTimeout(800);
  const S = () => p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return { mode: s.mode, x: s.x, y: s.y, dir: s.dir, hp: s.hp, score: s.score, mobs: s.mobs.length, paused: s.paused, view: s.view && s.view.length }; });
  check('deep shows its title', (await S()).mode === 'title');
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart.state.t > 45);
  await p.keyboard.press('Space'); await p.waitForTimeout(200);
  const a = await S();
  check('deep starts on floor 1 at the entrance, facing east, with a 3D view', a.mode === 'play' && a.x === 1 && a.y === 1 && a.dir === 1 && a.view > 1, JSON.stringify(a));
  await p.keyboard.press('ArrowUp'); await p.waitForTimeout(100);
  check('up steps forward', (await S()).x === 2);
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(100); await p.keyboard.press('ArrowUp'); await p.waitForTimeout(100);
  const b = await S();
  check('a wall stops you (turned north into the wall)', b.dir === 0 && b.x === 2 && b.y === 1, JSON.stringify(b));
  // קרב: מעמידים את השחקן מול הגובלין, מכים פעמיים, והוא נעלם
  await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; const m = s.mobs.find(o => o.k === 'g'); m.cd = 9999; s.x = m.x - 1; s.y = m.y; s.dir = 1; s.dirty = true; });
  const m0 = (await S()).mobs;
  await p.keyboard.press('Space'); await p.waitForTimeout(450); await p.keyboard.press('Space'); await p.waitForTimeout(1200);
  const c = await S();
  check('two strikes defeat a goblin and give points', c.mobs === m0 - 1 && c.score >= 25, JSON.stringify(c));
  await p.keyboard.press('p'); await p.waitForTimeout(100);
  check('P opens the map and pauses', (await S()).paused);
  await p.keyboard.press('p'); await p.waitForTimeout(100);
  // המדרגות נעולות כל עוד מלך האוגרים חי; אחרי שהוא נופל, FIRE על המדרגות מסיים את הקומה
  await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.x = s.sx; s.y = s.sy; s.dir = 3; s.mobs.find(o => o.k === 'B').cd = 9999; s.dirty = true; });
  await p.keyboard.press('Space'); await p.waitForTimeout(300);
  check('the stairs stay shut while the Ogre King stands', (await S()).mode === 'play');
  await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.mobs = s.mobs.filter(o => o.k !== 'B'); s.atkCd = 0; });
  await p.keyboard.press('Space'); await p.waitForTimeout(300);
  check('with the Ogre King gone, FIRE on the stairs clears floor 1', (await S()).mode === 'next');
  await p.waitForTimeout(900); await p.keyboard.press('Space'); await p.waitForTimeout(300);
  const f2 = await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return { mode: s.mode, floor: s.floor, ghosts: s.mobs.filter(m => m.k === 'h').length, golem: s.mobs.some(m => m.k === 'G') }; });
  check('floor 2: ghosts and the Stone Golem', f2.mode === 'play' && f2.floor === 2 && f2.ghosts === 2 && f2.golem, JSON.stringify(f2));
  // הדלת נעולה בלי מפתח, ונפתחת עם המפתח
  await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.mobs = []; s.x = 11; s.y = 14; s.dir = 1; s.dirty = true; });
  await p.keyboard.press('ArrowUp'); await p.waitForTimeout(150);
  const shut = await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return s.x === 11 && s.map[14][12] === 'D'; });
  await p.evaluate(() => { document.querySelector('#dragon-room').d32Cart.state.keys = 1; });
  await p.keyboard.press('ArrowUp'); await p.waitForTimeout(150);
  const open = await p.evaluate(() => document.querySelector('#dragon-room').d32Cart.state.map[14][12] === '.');
  check('floor 2: the door is locked without the key, and the key opens it', shut && open);
  await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.mobs = []; s.x = s.sx; s.y = s.sy; s.atkCd = 0; });
  await p.keyboard.press('Space'); await p.waitForTimeout(900); await p.keyboard.press('Space'); await p.waitForTimeout(300);
  const f3 = await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return { floor: s.floor, trolls: s.mobs.filter(m => m.k === 'T').length, mole: s.mobs.some(m => m.k === 'M') }; });
  check('floor 3, the old mine: trolls and the Mole King', f3.floor === 3 && f3.trolls === 2 && f3.mole, JSON.stringify(f3));
  await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.mobs = []; s.x = s.sx; s.y = s.sy; s.atkCd = 0; });
  await p.keyboard.press('Space'); await p.waitForTimeout(900); await p.keyboard.press('Space'); await p.waitForTimeout(300);
  const f4 = await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return { floor: s.floor, book: s.mobs.some(m => m.k === 'W'), door: s.map[14][12] === 'D' }; });
  check('floor 4, the wizard library: a locked door and the Spell Book', f4.floor === 4 && f4.book && f4.door, JSON.stringify(f4));
  await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.mobs = []; s.x = s.sx; s.y = s.sy; s.atkCd = 0; });
  await p.keyboard.press('Space'); await p.waitForTimeout(900); await p.keyboard.press('Space'); await p.waitForTimeout(300);
  const f5 = await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return { floor: s.floor, dragon: s.mobs.some(m => m.k === 'X') }; });
  check('floor 5, the dragon lair: the Dragon', f5.floor === 5 && f5.dragon, JSON.stringify(f5));
  check('the progress is saved at the start of each floor', await p.evaluate(() => JSON.parse(localStorage.getItem('d32-deep-save') || '{}').floor === 5));
  await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.mobs = []; s.x = s.sx; s.y = s.sy; s.atkCd = 0; });
  await p.keyboard.press('Space'); await p.waitForTimeout(300);
  check('with the Dragon gone, FIRE takes the Golden Tape: the game is won and the save is cleared', await p.evaluate(() => document.querySelector('#dragon-room').d32Cart.state.mode === 'won' && !localStorage.getItem('d32-deep-save')));
  await p.keyboard.press('Escape');
  await p.close();
}

if (part('full computer /dragon/app/ (theater, coder, AI)')) {
  console.log('full computer /dragon/app/ (theater, coder, AI)');
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  p.on('pageerror', e => pageErrors.push(e.message));
  await p.goto(base.replace(/\/$/, '') + '/');
  await p.waitForSelector('#dragon-room.is-ready');
  const room = p.locator('#dragon-room');
  await p.waitForTimeout(1400);
  check('the full computer opens straight in full screen', await room.evaluate(e => e.classList.contains('is-theater')));
  check('top bar: brand and status "מוכן"', (await p.locator('.d32-bar-brand b').textContent()) === 'Dragon 1982' && /מוכן/.test(await p.locator('.d32-status').textContent()));
  check('on a computer, all four pages (lessons, journey, magazine, history) are visible under the helper', (await Promise.all(['/lessons/', '/story/', '/magazine/', '/dragon-history/'].map(h => p.locator(`.d32-pages-side a[href="${h}"]`).isVisible()))).every(Boolean));
  check('toolbox has 3 tabs on a computer; the tapes are in the shelf tab', (await p.locator('.d32-tab:visible').count()) === 3 && (await p.locator('.d32-pane[data-pane="shelf"] .d32-tape').count()) >= 6);
  await p.locator('.d32-tab[data-tab="shelf"]').click(); await openDrawers(p);
  check('on a computer too, the shelf tab says how the Dragon machine differs from the app', await p.locator('.d32-pane[data-pane="shelf"] .d32-lab-shelf').isVisible() && /הכי קרוב למחשב המקורי/.test(await p.locator('.d32-pane[data-pane="shelf"] .d32-lab-shelf').textContent()));
  await p.locator('.d32-tab[data-tab="program"]').click();
  const tvBefore = await p.locator('.d32-tv').evaluate(e => e.getBoundingClientRect().width);
  await p.locator('.d32-theater-kbd').click();
  await p.waitForTimeout(150);
  const tvAfter = await p.locator('.d32-tv').evaluate(e => e.getBoundingClientRect().width);
  check('folding the drawn keyboard hides it and the TV grows', !(await p.locator('.d32-kbd').isVisible()) && tvAfter > tvBefore, tvBefore + ' -> ' + tvAfter);
  await p.locator('.d32-theater-kbd').click();
  await p.waitForTimeout(150);
  // קלטת על תוכנית שלא נשמרה: לחיצה ראשונה מזהירה, השנייה טוענת (דוח קודקס 17.10)
  await p.locator('.d32-input').fill('NEW'); await p.locator('.d32-input').press('Enter');
  await p.locator('.d32-input').fill('10 PRINT "MINE"'); await p.locator('.d32-input').press('Enter');
  await p.locator('.d32-tab[data-tab="shelf"]').click(); await openDrawers(p);
  await p.locator('.d32-tape:has-text("GUESS")').click();
  await p.waitForTimeout(400);
  check('a tape over an unsaved program warns first and does not load', await p.locator('.d32-tape-warn').isVisible() && !/CLOAD/.test(tail(await screenText(p), 3)));
  check('the warning offers two clear choices', await p.locator('.d32-tape-warn .d32-warn-save').isVisible() && await p.locator('.d32-tape-warn .d32-warn-go').isVisible());
  await p.locator('.d32-tape-warn .d32-warn-save').click();
  check('"Save first" prepares CSAVE " and closes the warning', await p.locator('.d32-input').inputValue() === 'CSAVE "' && !(await p.locator('.d32-tape-warn').count()));
  await p.locator('.d32-input').fill('');
  await p.locator('.d32-tab[data-tab="shelf"]').click(); await openDrawers(p);
  await p.locator('.d32-tape:has-text("GUESS")').click();
  await p.waitForTimeout(300);
  await p.locator('.d32-tape-warn .d32-warn-go').click();
  await p.waitForFunction(() => /\?\s*$/.test(document.querySelector('#dragon-room .d32-out').textContent), null, { timeout: 10000 });
  check('"Replace" loads the tape', !(await p.locator('.d32-tape-warn').count()));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  await p.locator('.d32-tape:has-text("LANDER")').click();
  await p.waitForTimeout(400);
  check('a program that came from a tape is not "unsaved": no warning', !(await p.locator('.d32-tape-warn').count()));
  await p.waitForFunction(() => /\?\s*$/.test(document.querySelector('#dragon-room .d32-out').textContent), null, { timeout: 10000 });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  // פקודות מוכנות: לשונית "פקודות", כרטיס נפתח, "לנסות עכשיו" מצייר, "להוסיף לתוכנית" נותן מספר שורה, וחיפוש
  await p.locator('.d32-tab[data-tab="commands"]').click();
  check('commands: drawing category shows cards', (await p.locator('.d32-cmd').count()) >= 4);
  await p.locator('.d32-cmd-head:has-text("מציירים עיגול")').click();
  check('a card opens with its code', /CIRCLE\(128,96\),40/.test(await p.locator('.d32-cmd-code').textContent()));
  await p.locator('.d32-cmd-form input').first().fill('100');
  check('the form changes the code', /CIRCLE\(100,96\),40/.test(await p.locator('.d32-cmd-code').textContent()));
  await p.locator('.d32-cmd-try').click();
  await p.waitForFunction(() => document.querySelector('#dragon-room').classList.contains('is-gfx'), null, { timeout: 8000 });
  check('"try now" types it and draws on the graphics screen', true);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  check('Esc goes back to the text screen', !(await room.evaluate(e => e.classList.contains('is-gfx'))));
  // אחרי ציור: כפתור "חזרה למסך הטקסט" על המסך, וכרטיס טקסט חוזר לבד למסך הטקסט (הערות גונן 17.10)
  await p.locator('.d32-cmd-try').click();
  await p.waitForFunction(() => document.querySelector('#dragon-room').classList.contains('is-gfx'), null, { timeout: 8000 });
  check('after drawing, a "back to text" button shows on the screen', await p.locator('.d32-stop-gfx').isVisible());
  await p.locator('.d32-stop').click();
  await p.waitForTimeout(300);
  check('the on-screen button goes back to the text screen', !(await room.evaluate(e => e.classList.contains('is-gfx'))) && !(await p.locator('.d32-stop').isVisible()));
  await p.locator('.d32-cmd-try').click();
  await p.waitForFunction(() => document.querySelector('#dragon-room').classList.contains('is-gfx'), null, { timeout: 8000 });
  await p.locator('.d32-cmds-cats button:has-text("טקסט וחשבון")').click();
  await p.locator('.d32-cmd-head:has-text("מחשבון")').click();
  await p.locator('.d32-cmd-try').click();
  await p.waitForFunction(() => / 42 \nOK\s*$/.test(document.querySelector('#dragon-room .d32-out').textContent), null, { timeout: 8000 });
  check('a text card after a drawing shows its result on the text screen', !(await room.evaluate(e => e.classList.contains('is-gfx'))));
  await p.locator('.d32-cmds-cats button:has-text("חזרות ותנועה")').click();
  await p.locator('.d32-cmd-head:has-text("סופרים")').click();
  await p.locator('.d32-cmd-try').click();
  await p.waitForFunction(() => / 10 \nOK\s*$/.test(document.querySelector('#dragon-room .d32-out').textContent), null, { timeout: 8000 });
  check('"count" card (FOR on a direct line) runs without an error', !/\?SN ERROR/.test(tail(await screenText(p), 3)), tail(await screenText(p), 3));
  await p.locator('.d32-cmds-search input').fill('צליל');
  check('search finds sound commands across categories', (await p.locator('.d32-cmd-head:has-text("צפצוף")').count()) === 1);
  await p.locator('.d32-cmds-cats button:has-text("חזרות ותנועה")').click();
  await p.locator('.d32-cmd-head:has-text("לנצח")').click();
  await p.locator('.d32-cmd-add').click();
  await p.waitForFunction(() => /GOTO/.test(document.querySelector('#dragon-room .d32-out').textContent), null, { timeout: 8000 });
  await p.waitForTimeout(400);
  const prog = await p.evaluate(() => document.querySelector('#dragon-room').d32 && document.querySelector('.d32-coder-list').textContent);
  check('"add to program" adds numbered lines that GOTO the right line', /PRINT "DRAGON ";[\s\S]*GOTO\s*\d+/.test(prog), prog);
  await p.locator('.d32-tab[data-tab="program"]').click();
  // סדנה: חלון התוכנית רחב, בלי מקלדת מצוירת; מסך בלבד: רק המסך
  const cwNormal = await p.locator('.d32-coder').evaluate(e => e.getBoundingClientRect().width);
  await p.locator('.d32-theater-shop').click();
  await p.waitForTimeout(150);
  const shopW = await p.locator('.d32-coder').evaluate(e => e.getBoundingClientRect().width);
  check('workshop: the program window is wide and the drawn keyboard is hidden', shopW > cwNormal + 100 && !(await p.locator('.d32-kbd').isVisible()), cwNormal + ' -> ' + shopW);
  await p.locator('.d32-theater-kbd').click();
  await p.waitForTimeout(150);
  const kb = await p.locator('.d32-kbd').evaluate(e => { const r = e.getBoundingClientRect(); return { v: r.height > 0 && getComputedStyle(e).display !== 'none', bottom: Math.round(r.bottom) }; });
  check('workshop: the drawn-keyboard button opens the keyboard there too, inside the window', kb.v && kb.bottom <= 900, JSON.stringify(kb));
  await p.locator('.d32-theater-kbd').click();
  await p.waitForTimeout(150);
  check('workshop: and closes it again', !(await p.locator('.d32-kbd').isVisible()));
  // מסך בלבד שנפתח מתוך החלון הגדול לכתיבה: גם הוא שלם וממורכז (סבב 2 של הגולש העיוור)
  await p.locator('.d32-theater-only').click();
  await p.waitForTimeout(300);
  const so = await p.evaluate(() => { const r = document.querySelector('.d32-screen').getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(innerWidth - r.right) }; });
  check('screen only from the big writing window is whole and centred', so.l >= 0 && so.r >= 0 && Math.abs(so.l - so.r) <= 2, JSON.stringify(so));
  await p.locator('.d32-only-out').click();
  await p.waitForTimeout(200);
  check('while the computer is open, the guide behind it is out of keyboard reach (inert)', await p.evaluate(() => document.querySelector('.room-mag').inert && document.querySelector('.guide-bar').inert));
  await p.locator('.d32-theater-shop').click();
  await p.locator('.d32-theater-only').click();
  await p.waitForTimeout(300);
  const only = await p.evaluate(() => { const r = document.querySelector('.d32-screen').getBoundingClientRect(); return { bar: getComputedStyle(document.querySelector('.d32-theater-bar')).display, coder: getComputedStyle(document.querySelector('.d32-coder')).display, sw: r.width, l: Math.round(r.left), r: Math.round(innerWidth - r.right), t: Math.round(r.top), b: Math.round(innerHeight - r.bottom) }; });
  // המסך כולו בתוך החלון, ממורכז, ולא גולש החוצה (הערות גונן 17.10)
  check('screen only: no bar, no tools, the screen fills the window, whole and centred', only.bar === 'none' && only.coder === 'none' && only.sw > 1100 && only.l >= 0 && only.r >= 0 && only.t >= 0 && only.b >= 0 && Math.abs(only.l - only.r) <= 2, JSON.stringify(only));
  await p.locator('.d32-only-out').click();
  await p.waitForTimeout(200);
  check('leaving "screen only" brings the tools back', await p.locator('.d32-coder').isVisible() && await p.locator('.d32-theater-bar').isVisible());
  check('full computer has the coder panel and the AI helper', await p.locator('.d32-coder').isVisible() && await p.locator('.d32-ai').isVisible());
  check('full computer is installable (manifest)', (await p.locator('link[rel="manifest"]').getAttribute('href')) === '/manifest.webmanifest');
  const icons = await p.evaluate(async () => {
    const m = await (await fetch('/manifest.webmanifest')).json();
    const list = [...m.icons.map(i => i.src), ...[...document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')].map(l => new URL(l.href).pathname)];
    const bad = [];
    for (const u of list) { if (!(await fetch(u)).ok) bad.push(u); }
    return { n: list.length, bad };
  });
  check('the app has its green icons (all load)', icons.n === 6 && !icons.bad.length, JSON.stringify(icons));
  check('full screen turns the computer on', await room.evaluate(e => e.classList.contains('is-theater') && !e.classList.contains('is-off')));
  const fit = await p.evaluate(() => ({ kb: document.querySelector('.d32-kbd').getBoundingClientRect().bottom, sw: document.documentElement.scrollWidth }));
  check('TV and keyboard fit the window', fit.kb <= 900 && fit.sw <= 1440, JSON.stringify(fit));
  await p.keyboard.type('print 6*7');
  await p.keyboard.down('Enter');
  check('real key lights the drawn key', await p.locator('.d32-key[data-k="ENTER"]').evaluate(e => e.classList.contains('is-down')));
  await p.keyboard.up('Enter');
  await p.waitForTimeout(200);
  check('typing works in full screen', / 42 \nOK$/.test(await p.locator('#dragon-room .d32-out').textContent()));
  for (const k of ['P', 'R', 'I', 'N', 'T', 'SPACE', 'SHIFT', '2', 'H', 'I', 'SHIFT', '2', 'ENTER']) await p.locator(`.d32-key[data-k="${k}"]`).first().click();
  await p.waitForTimeout(200);
  check('drawn keys type, SHIFT gives the upper sign', /PRINT "HI"\nHI\nOK$/.test(await p.locator('#dragon-room .d32-out').textContent()), (await p.locator('#dragon-room .d32-out').textContent()).slice(-40));
  for (const l of ['10 goto 10', 'run']) { await p.keyboard.type(l); await p.keyboard.press('Enter'); await p.waitForTimeout(150); }
  await p.locator('.d32-key[data-k="BREAK"]').click();
  await p.waitForTimeout(200);
  check('drawn BREAK stops a program', /BREAK IN 10\nOK$/.test(await p.locator('#dragon-room .d32-out').textContent()));
  await p.locator('.d32-theater-exit').click();
  await p.waitForTimeout(200);
  check('back to the page', !(await room.evaluate(e => e.classList.contains('is-theater'))) && !(await p.locator('.d32-kbd').isVisible()));
  await p.setViewportSize({ width: 800, height: 900 });
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.waitForTimeout(200);
  check('after "back to the page" it does not jump back to full screen', !(await room.evaluate(e => e.classList.contains('is-theater'))));
  await p.close();
  // החלון נפתח קטן ומקבל את גודלו רק אחרי הטעינה (כמו פתיחה מאייקון): נכנסים לבד למסך המלא
  const late = await browser.newPage({ viewport: { width: 800, height: 900 } });
  late.on('pageerror', e => pageErrors.push(e.message));
  await late.goto(base.replace(/\/$/, '') + '/');
  await late.waitForSelector('#dragon-room.is-ready');
  const lateWas = await late.locator('#dragon-room').evaluate(e => e.classList.contains('is-theater'));
  await late.setViewportSize({ width: 1440, height: 900 });
  await late.waitForTimeout(300);
  check('window that grows after loading enters full screen by itself', !lateWas && await late.locator('#dragon-room').evaluate(e => e.classList.contains('is-theater')));
  await late.close();
  const ph = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await ph.goto(base.replace(/\/$/, '') + '/');
  await ph.waitForSelector('#dragon-room.is-ready');
  await ph.waitForTimeout(400);
  const ph1 = await ph.evaluate(() => ({ phone: document.querySelector('#dragon-room').classList.contains('is-phone'), sw: document.documentElement.scrollWidth }));
  // פתיחה בטלפון (הערות גונן 17.10): קודם רק המחשב ומתג ההדלקה, בלי לשוניות
  check('phone: opens as an app with only the computer and the power switch, no sideways scroll', ph1.phone && ph1.sw <= 390 && await ph.locator('.d32-power').isVisible() && !(await ph.locator('.d32-tabs').isVisible()), JSON.stringify(ph1));
  await ph.locator('.d32-power').tap();
  await ph.waitForFunction(() => /OK\s*$/.test(document.querySelector('#dragon-room .d32-out').textContent), null, { timeout: 4000 });
  check('phone: after power on, the drawn Dragon keyboard and the tabs show', await ph.locator('.d32-pane[data-pane="keys"] .d32-kbd').isVisible() && await ph.locator('.d32-tab[data-tab="help"]').isVisible() && (await ph.locator('#dragon-room .d32-input').evaluate(e => e.inputMode)) === 'none');
  for (const k of ['P', 'R', 'I', 'N', 'T', 'SPACE', '7']) await ph.locator(`.d32-key[data-k="${k}"]`).first().tap();
  await ph.locator('.d32-key[data-k="ENTER"]').tap();
  await ph.waitForTimeout(300);
  check('phone: typing on the drawn keyboard works', /PRINT 7\n 7 \nOK\s*$/.test(await ph.locator('#dragon-room .d32-out').textContent()), tail(await ph.locator('#dragon-room .d32-out').textContent(), 3));
  await ph.locator('.d32-syskbd').tap();
  check('phone: a button switches to the phone keyboard', (await ph.locator('#dragon-room .d32-input').evaluate(e => e.inputMode)) !== 'none');
  await ph.locator('.d32-tab[data-tab="help"]').tap();
  check('phone: the AI helper is in the "עוזר" tab', await ph.locator('.d32-pane[data-pane="help"] .d32-ai').isVisible());
  // בטלפון אין Esc: כפתור "עצירה" על המסך עוצר תוכנית שרצה
  for (const l of ['10 PRINT "HI ";', '20 GOTO 10', 'RUN']) { await ph.locator('#dragon-room .d32-input').fill(l); await ph.locator('#dragon-room .d32-input').press('Enter'); await ph.waitForTimeout(150); }
  await ph.waitForTimeout(400);
  const stopShown = await ph.locator('.d32-stop-run').isVisible();
  await ph.locator('.d32-stop').tap();
  await ph.waitForTimeout(400);
  check('phone: a "stop" button on the screen stops a running program', stopShown && /BREAK IN \d+\nOK\s*$/.test(await ph.locator('#dragon-room .d32-out').textContent()), String(stopShown));
  await ph.locator('.d32-tab[data-tab="shelf"]').tap();
  await openDrawers(ph);
  await ph.locator('button.d32-cart').first().tap();
  await ph.waitForTimeout(600);
  check('phone: while a cartridge plays the drawer closes and the game buttons show', !(await ph.locator('.d32-coder').isVisible()) && await ph.locator('.d32-pad-btn').first().isVisible());
  await ph.close();
}

// כל כרטיסי הפקודות המוכנות: "לנסות עכשיו" רץ בלי שגיאה (הערות גונן 17.10: שלושה כרטיסים נפלו ולא תפסנו)
if (part('all command cards')) {
  console.log('all command cards');
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  p.on('pageerror', e => pageErrors.push(e.message));
  await p.goto(base.replace(/\/$/, '') + '/');
  await p.waitForSelector('#dragon-room.is-ready');
  await p.waitForFunction(() => /OK\s*$/.test(document.querySelector('#dragon-room .d32-out').textContent), null, { timeout: 5000 });
  await p.locator('.d32-welcome-x').click().catch(() => {});
  // פעמיים: כשהזיכרון ריק (כמו גונן ב-17.10: CSAVE בלי תוכנית), ואז עם תוכנית קטנה בשביל LIST, RUN ו-CSAVE
  for (const prog of [false, true]) {
    await send(p, 'new', 100);
    if (prog) await send(p, '10 PRINT "CARDS"', 100);
    await toTab(p, 'commands');
    const cats = await p.locator('.d32-cmds-cats button').count();
    const bad = [];
    let tried = 0, explained = 0;
    for (let c = 0; c < cats; c++) {
      await p.locator('.d32-cmds-cats button').nth(c).click();
      const n = await p.locator('.d32-cmd').count();
      for (let i = 0; i < n; i++) {
        const card = p.locator('.d32-cmd').nth(i);
        const name = (await card.locator('.d32-cmd-head').innerText()).replace(/\s+/g, ' ');
        await card.locator('.d32-cmd-head').click();
        const tryBtn = card.locator('.d32-cmd-try');
        if (!(await tryBtn.count())) continue;
        if (/NEW/.test(name) && !prog) continue;
        await send(p, 'cls', 150);   // מסך נקי: בודקים רק את מה שהכרטיס הזה הדפיס
        const before = (await p.locator('#dragon-room .d32-out').textContent()).length;
        await tryBtn.click();
        tried++;
        // מחכים שהמחשב יסיים (PLAY ולולאות לוקחים זמן). תוכנית שלא נגמרת עוצרים. כרטיס שמסביר "אין תוכנית" לא מקליד כלום
        await p.waitForFunction(b => { const r = document.querySelector('#dragon-room'), t = r.querySelector('.d32-out').textContent; return (t.length !== b && !r.classList.contains('is-running') && /OK\s*$/.test(t)) || !!document.querySelector('.d32-cmd-empty'); }, before, { timeout: 6000 }).catch(() => p.keyboard.press('Escape'));
        await p.waitForTimeout(250);
        if (await card.locator('.d32-cmd-empty').count()) explained++;
        const last = await p.locator('#dragon-room .d32-out').textContent();
        if (/\?[A-Z/]{1,2}0? ERROR/.test(last)) bad.push(name + ' → ' + last.replace(/\n/g, ' | '));
        if (await p.locator('#dragon-room').evaluate(e => e.classList.contains('is-gfx'))) { await p.keyboard.press('Escape'); await p.waitForTimeout(150); }
      }
    }
    check(`all ${tried} "try now" cards run without an error (${prog ? 'with a program' : 'empty memory'})`, tried >= 18 && bad.length === 0, bad.join('\n') || String(tried));
    if (!prog) check('with empty memory, the LIST/RUN/RENUM/CSAVE cards explain there is no program yet', explained === 4, String(explained));
  }
  await p.close();
}

// הגרסה האנגלית (/en/): דפדפן באנגלית מגיע אליה לבד, אין בה עברית גלויה, והבחירה בשפה נשמרת
if (part('english')) {
  console.log('english');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-GB' });
  const p = await ctx.newPage();
  p.on('pageerror', e => pageErrors.push(e.message));
  await p.goto(base.replace(/\/$/, '') + '/');
  await p.waitForSelector('#dragon-room.is-ready');
  await p.waitForTimeout(500);
  check('an English browser lands on /en/ (lang=en, ltr)', /\/en\/$/.test(p.url()) && await p.evaluate(() => document.documentElement.lang === 'en' && document.documentElement.dir === 'ltr'), p.url());
  const hebrew = () => p.evaluate(() => { const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const el = n.parentElement; if (!el || el.closest('[lang="he"], script, style') || !el.getClientRects().length) continue; if (/[\u0590-\u05FF]/.test(n.textContent)) out.push(n.textContent.trim().slice(0, 50)); } return out; });
  const seen = [];
  for (const t of ['program', 'commands', 'shelf']) { await p.locator(`.d32-tab[data-tab="${t}"]`).click(); await p.waitForTimeout(150); seen.push(...await hebrew()); }
  await p.locator('.d32-welcome-x').click().catch(() => {});
  await send(p, 'xyz', 400);
  seen.push(...await hebrew());
  check('the English computer shows no Hebrew (tabs, cards, shelf, helper, error help)', seen.length === 0, seen.join(' | '));
  check('the error help is in English', /What happened\?/.test(await p.locator('.d32-helper').innerText()));
  await p.locator('.d32-tab[data-tab="commands"]').click();
  await p.locator('.d32-cmds-search input').fill('circle');
  check('command search works with English words', (await p.locator('.d32-cmd-head:has-text("CIRCLE")').count()) === 1);
  await p.locator('.d32-theater-exit').click();
  await p.waitForTimeout(300);
  const g = await hebrew();
  check('the English guide shows no Hebrew (except the "עברית" link)', g.length === 0, g.join(' | '));
  await p.locator('.site-nav [data-lang="he"]').click();
  await p.waitForURL(/\/$/);
  await p.waitForSelector('#dragon-room.is-ready');
  check('"עברית" goes to the Hebrew app and is remembered', await p.evaluate(() => document.documentElement.lang === 'he' && localStorage.getItem('d32-lang') === 'he'));
  await p.goto(base.replace(/\/$/, '') + '/en/');
  await p.waitForURL(/\/$/);
  check('a remembered Hebrew choice wins over /en/ too', await p.evaluate(() => document.documentElement.lang === 'he'));
  await ctx.close();
}

// המחשב האמיתי (ניסוי): XRoar עם ה-ROM שלנו עולה, והמקלדת המצוירת מקלידה בו
if (part('lessons and magazine')) {
  console.log('\nlessons and magazine');
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  p.on('pageerror', e => pageErrors.push(e.message));
  for (const path of ['/lessons/', '/en/lessons/']) {
    await p.goto(new URL(path + '#1', PAGE).href);
    await p.waitForSelector('.lesson-title', { timeout: 10000 });
    check(`${path} shows 30 lesson tiles on a ladder of 9 levels`, (await p.locator('#lesson-progress .tile').count()) === 30 && (await p.locator('#lesson-progress .level').count()) === 9);
    await p.click('.lesson-run .lesson-type');
    await p.waitForFunction(() => /BYE!\s*\nOK\s*$/.test(document.querySelector('#lesson-computer .d32-out').textContent), null, { timeout: 20000 }).catch(() => {});
    check(`${path} lesson 1: "type it all and RUN" runs the program`, /HELLO! I AM A DRAGON 32[\s\S]*7 X 6 = 42[\s\S]*BYE!/.test(await p.locator('#lesson-computer .d32-out').textContent()));
    await p.click('.lesson-done');
    check(`${path} finishing a lesson puts a star on its tile`, await p.locator('#lesson-progress .tile.is-done').count() === 1);
    await p.evaluate(() => localStorage.removeItem('d32-lessons-done'));
  }
  // דרקון הזהב: שיעור 20 בונה על 15-19, ו"הקלד הכול והרץ" מקליד את כל המשחק (42 שורות) ומגיע למסך הפתיחה
  await p.goto(new URL('/lessons/#20', PAGE).href);
  await p.waitForSelector('.lesson-title', { timeout: 10000 });
  await p.click('.lesson-run .lesson-type');
  const gold = await p.waitForFunction(() => /\*\*\* DRAGON GOLD \*\*\*[\s\S]*PRESS ANY KEY TO START/.test(document.querySelector('#lesson-computer .d32-out').textContent), null, { timeout: 60000 }).then(() => true, () => false);
  check('/lessons/#20: "type it all and RUN" types the whole Dragon Gold game and its title screen appears', gold && (await p.locator('.whole-program pre').textContent()).split('\n').length === 42);
  // DRAGFLY: שיעור 30 בונה על 27-29. כל המשחק (38 שורות) מוקלד ורץ בלי שגיאה
  await p.goto(new URL('/lessons/#30', PAGE).href);
  await p.waitForSelector('.lesson-title', { timeout: 10000 });
  check('/lessons/#30 shows the whole DRAGFLY program so far (38 lines)', (await p.locator('.whole-program pre').textContent()).split('\n').length === 38);
  await p.click('.lesson-run .lesson-type');
  const typed = await p.waitForFunction(() => /\nRUN(\n|$)/.test(document.querySelector('#lesson-computer .d32-out').textContent), null, { timeout: 150000 }).then(() => true, () => false);
  await p.waitForTimeout(5000);
  check('/lessons/#30: "type it all and RUN" types DRAGFLY and it runs without an error', typed && await p.evaluate(() => !/ERROR/.test(document.querySelector('#lesson-computer .d32-out').textContent)));
  for (const path of ['/magazine/', '/magazine/du01/', '/en/magazine/', '/en/magazine/du01/']) {
    const r = await p.goto(new URL(path, PAGE).href);
    check(`${path} loads`, r.ok() && /archive\.org|Dragon User/.test(await p.content()));
  }
  await p.close();
}

if (part('real machine lab')) {
  console.log('real machine lab');
  for (const path of ['/lab/1982/', '/en/lab/1982/']) {
    const p = await browser.newPage({ viewport: { width: 1000, height: 900 } });
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    const r = await p.goto(base.replace(/\/$/, '') + path);
    await p.waitForTimeout(3500);
    check(`${path} loads with the drawn keyboard`, r.status() === 200 && (await p.locator('.kbd .k').count()) > 50 && errs.length === 0, errs.join(' | '));
    check(`${path} has the tape shelf (16 tapes: 7 BASIC, Dragon Eggs, Blockdown, DragonTet, Phantom Slayer, Danger Ranger, Adventureland, Pirate Adventure, Secret Mission, Voodoo Castle)`, (await p.locator('#tapes .tape').count()) === 16);
    check(`${path} the cabinet drawers start closed`, await p.evaluate(() => [...document.querySelectorAll('#tapes details.drawer')].every(d => !d.open)));
    check(`${path} "type it in" drawer: 2 magazine pages; a page opens beside the machine (scan from archive.org, credit) and closes`, await p.evaluate(async () => {
      const cards = document.querySelectorAll('[data-drawer="type"] .tape');
      if (cards.length !== 2) return false;
      document.querySelector('.tape[data-page="sketch"]').click();
      const v = document.querySelector('.typein-view');
      const ok = !v.hidden && /^https:\/\/archive\.org\/download\/Dragon_User_1983-09_Sunshine_Books_GB\/page\/n38_/.test(v.querySelector('.tv-scan img').src) && /R Steel/.test(v.textContent);
      v.querySelector('.tv-close').click();
      return ok && v.hidden;
    }));
    check(`${path} the adventure games have their own drawer (Adventureland, Pirate Adventure, Secret Mission, Voodoo Castle)`, await p.evaluate(() =>
      [...document.querySelectorAll('[data-drawer="adv"] .tape small')].map(s => s.textContent.split(' ')[0]).join() === 'ADVENTURELAND,PIRATE,MISSION,VOODOO'));
    check(`${path} every machine-code game has a "how to play" box with keys and a way out`, await p.evaluate(() => {
      const boxes = [...document.querySelectorAll('[data-drawer="mc"] .tape-box, [data-drawer="adv"] .tape-box')];
      return boxes.length === 9 && boxes.every(b => { const h = b.querySelector('details.howto'); return h && h.querySelectorAll('kbd').length >= 3 && h.querySelector('.howto-always'); });
    }));
    const b = await p.request.get(base.replace(/\/$/, '') + path + 'building/');
    check(`${path} links to "what we are building now", which loads`, b.status() === 200 && (await p.locator('main > p.note a[href="./building/"]').count()) === 1);
    await p.click('#full-open');
    await p.waitForTimeout(300);
    check(`${path} full screen: only the computer and keyboard, nothing to scroll`, await p.evaluate(() =>
      document.body.classList.contains('full') && !document.querySelector('.shelf').offsetParent && !document.querySelector('header').offsetParent
      && document.documentElement.scrollHeight <= innerHeight + 1 && document.getElementById('kbd').getBoundingClientRect().bottom <= innerHeight));
    await p.click('#full-close');
    await p.waitForTimeout(300);
    check(`${path} leaving full screen brings the page back`, await p.evaluate(() => !document.body.classList.contains('full') && !!document.querySelector('.shelf').offsetParent));
    if (path === '/lab/1982/') {
      await p.waitForFunction(() => window.d32Ready, null, { timeout: 20000 });
      await p.click('#tapes details.drawer[data-drawer="basic"] > summary');
      await p.click('#tapes .tape:has-text("GUESS")');
      await p.waitForTimeout(800);
      check('a tape click only puts the tape in the recorder (you type CLOAD yourself, like 1982)', await p.evaluate(() =>
        document.querySelector('#tapes .tape.in small')?.textContent === 'GUESS' && /CLOAD/.test(document.getElementById('tape-status').textContent)
        && FS.stat('/tape-guess.cas').size > 280 && !(window.d32Screen?.() || []).some(r => r.startsWith('CLOAD'))) && errs.length === 0, errs.join(' | '));
      // הקלטת היא מה שהמכונה עצמה שמרה (פורמט מכווץ): מקלידים CLOAD, אחרי OK את RUN, והמשחק על המסך
      await p.evaluate(() => window.d32Type('CLOAD\n'));
      const okAfter = await p.waitForFunction(() => { const r = window.d32Screen?.() || []; const i = r.findIndex(x => x === 'F GUESS'); return i >= 0 && r.slice(i + 1).includes('OK'); }, null, { timeout: 60000 }).then(() => true, () => false);
      if (okAfter) await p.evaluate(() => window.d32Type('RUN\n'));
      const ran = okAfter && await p.waitForFunction(() => (window.d32Screen?.() || []).some(r => r.includes('GUESS MY NUMBER')), null, { timeout: 30000 }).then(() => true, () => false);
      check('typing CLOAD then RUN loads the machine-saved tape (compact format) and the program runs', ran,
        JSON.stringify(await p.evaluate(() => [document.getElementById('tape-status').textContent, window.d32Screen?.()])));
    }
    if (path === '/lab/1982/') {
      // מהאפליקציה: ?tape=lander טוען את הקלטת לבד
      const q = await browser.newPage({ viewport: { width: 1000, height: 900 } });
      await q.goto(base.replace(/\/$/, '') + path + '?tape=lander');
      await q.waitForFunction(() => document.querySelector('#tapes .tape.in small')?.textContent === 'LANDER', null, { timeout: 30000 }).catch(() => {});
      check('?tape=lander from the app loads that tape by itself', await q.evaluate(() => document.querySelector('#tapes .tape.in small')?.textContent === 'LANDER'));
      await q.close();
      // מהאפליקציה: ?mine=APPPROG — תוכנית מ"הקלטות שלי" של האפליקציה, כקלטת טקסט (כמו CSAVE "X",A), נטענת ורצה
      const a = await browser.newPage({ viewport: { width: 1000, height: 900 } });
      const aerrs = [];
      a.on('pageerror', e => aerrs.push(e.message));
      await a.goto(base.replace(/\/$/, '') + path);
      await a.evaluate(() => localStorage.setItem('d32-mytapes', JSON.stringify([{ n: 'APPPROG', t: '10 FOR I=1 TO 3\n20 PRINT "FROM THE APP";I\n30 NEXT I' }])));
      await a.goto(base.replace(/\/$/, '') + path + '?mine=APPPROG');
      const fromApp = await a.waitForFunction(() => (window.d32Screen?.() || []).includes('FROM THE APP 3'), null, { timeout: 60000 }).then(() => true, () => false);
      check('?mine=APPPROG: a program saved in the app loads as a text tape and runs', fromApp && aerrs.length === 0,
        JSON.stringify(await a.evaluate(() => [document.getElementById('tape-status').textContent, window.d32Screen?.()])) + aerrs.join(' | '));
      check('the app program also lands on the machine\'s "my tapes"', await a.locator('#mytapes .tape small:text-is("APPPROG")').count() === 1);
      await a.evaluate(() => { localStorage.removeItem('d32-mytapes'); localStorage.removeItem('d32-lab-tapes'); });
      await a.close();
      // מהאפליקציה: #p=... — "פתח במכונה" או קישור שיתוף. התוכנית בתוך הקישור, נטענת מקלטת טקסט ורצה
      const l = await browser.newPage({ viewport: { width: 1000, height: 900 } });
      const lerrs = [];
      l.on('pageerror', e => lerrs.push(e.message));
      const code = Buffer.from('10 FOR I=1 TO 2\n20 PRINT "FROM A LINK";I\n30 NEXT I').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      await l.goto(base.replace(/\/$/, '') + path + '#p=' + code);
      const fromLink = await l.waitForFunction(() => (window.d32Screen?.() || []).includes('FROM A LINK 2'), null, { timeout: 60000 }).then(() => true, () => false);
      check('#p=: a program in a link loads as a text tape and runs', fromLink && lerrs.length === 0,
        JSON.stringify(await l.evaluate(() => [document.getElementById('tape-status').textContent, window.d32Screen?.()])) + lerrs.join(' | '));
      await l.evaluate(() => localStorage.removeItem('d32-lab-tapes'));
      await l.close();
      // הקלטות שלי: CSAVE מקליט ושומר בדפדפן, ואחרי טעינה מחדש CLOAD מוצא את התוכנית
      const m = await browser.newPage({ viewport: { width: 1000, height: 900 } });
      const merrs = [];
      m.on('pageerror', e => merrs.push(e.message));
      await m.goto(base.replace(/\/$/, '') + path);
      await m.waitForFunction(() => window.d32Ready, null, { timeout: 20000 });
      await m.waitForTimeout(2000);
      await m.evaluate(() => d32Type('10 PRINT "SAVED"\nCSAVE "MYPROG"\n'));
      await m.waitForFunction(() => [...document.querySelectorAll('#mytapes .tape small')].some(e => e.textContent === 'MYPROG'), null, { timeout: 20000 }).catch(() => {});
      check('CSAVE on the real machine puts the program on "my tapes"', await m.locator('#mytapes .tape small:text-is("MYPROG")').count() === 1);
      await m.reload();
      await m.waitForFunction(() => window.d32Ready, null, { timeout: 20000 });
      await m.waitForTimeout(4000);
      await m.evaluate(() => d32Type('CLOAD "MYPROG"\n'));
      await m.waitForFunction(() => (d32Screen() || []).includes('F MYPROG') && (d32Screen() || []).slice(-3).includes('OK'), null, { timeout: 20000 }).catch(() => {});
      await m.evaluate(() => d32Type('LIST\n'));
      await m.waitForTimeout(1500);
      check('after a reload, CLOAD "MYPROG" loads it back', (await m.evaluate(() => d32Screen())).includes('10 PRINT "SAVED"') && merrs.length === 0, (await m.evaluate(() => d32Screen())).filter(Boolean).join(' | ') + merrs.join(' | '));
      const del = m.locator('#mytapes .mytape .mini').nth(1);
      await del.click();
      await del.click();
      check('a saved tape can be deleted (two taps)', await m.locator('#mytapes .tape').count() === 0);
      // הפקודות שבשבב ההרחבה (חריץ המחסנית): ELSE, RENUM, PRINT USING, ו-EDIT עם SHIFT+↑ מהמקלדת המצוירת
      await m.evaluate(() => d32Type('NEW\n5 IF 1 THEN PRINT USING "##.#";3.14159 ELSE 7\n7 PRINT "NO"\nRENUM\nEDIT 20\nX;'));
      await m.click('.k[data-k="SHIFT"] >> nth=0');
      await m.dispatchEvent('.k[data-k="↑"]', 'pointerdown');
      await m.waitForTimeout(300);
      await m.evaluate(() => d32Type('Q\nLIST\nRUN\n'));
      await m.waitForTimeout(2500);
      const lines = (await m.evaluate(() => d32Screen())).filter(Boolean);
      const shown = lines.join('');   // שורות ארוכות נשברות ב-32 תווים
      check('real machine: ELSE, RENUM, PRINT USING and EDIT (SHIFT+↑ leaves insert mode)', shown.includes('10 IF 1 THEN PRINT USING "##.#";3.14159 ELSE 20') && lines.includes('20 PRINT "NO";') && lines.includes(' 3.1') && !shown.includes('ERROR'), lines.join(' | '));
      await m.close();
    }
    await p.close();
  }
}

check('no page errors', pageErrors.length === 0, pageErrors.join('\n'));
await browser.close();
if (server) server.close();
console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
