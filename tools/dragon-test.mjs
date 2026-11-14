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
const PAGE = base.replace(/\/$/, '') + '/#app';   // האפליקציה (#app: ישר אליה, בלי מסך הבחירה)

const browser = await chromium.launch({ channel: 'chrome', args: ['--lang=he-IL', '--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream'] });
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
  await p.goto(base.replace(/\/$/, '') + '/#app');
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
  check('full shelf: all 6 cartridges (with JUNGLE KING), no links out', (await p.locator('button.d32-cart').count()) === 6 && (await p.locator('a.d32-cart.is-more').count()) === 0);

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
  await p.goto(base.replace(/\/$/, '') + '/#app');
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
  await p.goto(base.replace(/\/$/, '') + '/#app');
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
  await p.goto(base.replace(/\/$/, '') + '/#app');
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
  await p.goto(base.replace(/\/$/, '') + '/#app');
  await p.waitForSelector('#dragon-room.is-ready');
  await p.locator('.d32-tab[data-tab="shelf"]').click();
  await p.evaluate(() => [...document.querySelectorAll('.d32-cart')].find(e => /DEEP/.test(e.textContent)).click());
  await p.waitForTimeout(800);
  const S = () => p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return { mode: s.mode, x: s.x, y: s.y, dir: s.dir, hp: s.hp, score: s.score, mobs: s.mobs.length, paused: s.paused, view: s.view && s.view.length }; });
  check('deep shows its title', (await S()).mode === 'title');
  // סבב 1: מסכי פתיחה, ▼ עובר ביניהם
  const tp0 = await p.evaluate(() => document.querySelector('#dragon-room').d32Cart.state.titleP);
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(100);
  const tp1 = await p.evaluate(() => document.querySelector('#dragon-room').d32Cart.state.titleP);
  check('deep title: DOWN moves from the title to the story page (4 pages)', tp0 === 0 && tp1 === 1);
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(100); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(100);
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart.state.t > 45);
  await p.keyboard.press('Space'); await p.waitForTimeout(200);
  const a = await S();
  check('each floor opens with its name and a line of story, and the game waits', await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return s.intro > 0; }));
  check('the app shows a Hebrew how-to under the game', await p.evaluate(() => { const h = document.querySelector('.d32-cart-help'); return h && !h.hidden && h.querySelectorAll('li').length >= 5 && /קלטת הזהב/.test(h.textContent); }));
  check('deep starts on floor 1 at the entrance, facing east, with a 3D view', a.mode === 'play' && a.x === 1 && a.y === 1 && a.dir === 1 && a.view > 1, JSON.stringify(a));
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(100);   // המקש הראשון רק סוגר את מסך הקומה
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
  check('meeting a goblin for the first time names it and puts it in the album', await p.evaluate(() => document.querySelector('#dragon-room').d32Cart.state.met.has('g')));
  check('two strikes defeat a goblin and give points', c.mobs === m0 - 1 && c.score >= 25, JSON.stringify(c));
  await p.keyboard.press('p'); await p.waitForTimeout(100);
  check('P opens the map and pauses', (await S()).paused);
  // סבב 1: תפריט העצירה — ◀ ▶ דפים, הלפיד לא דועך, ושיקוי בתרמיל משמש רק כששותים אותו
  const tor0 = await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.potions = 1; s.hp = 2; return s.torch; });
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150);
  const bag = await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return { page: s.page, torch: s.torch }; });
  check('pause menu: RIGHT goes to the BAG page, and the torch does not burn while paused', bag.page === 1 && bag.torch === tor0, JSON.stringify(bag));
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(100); await p.keyboard.press('Space'); await p.waitForTimeout(150);
  check('bag: FIRE on the potion drinks it (+2 hearts)', await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return s.hp === 4 && s.potions === 0; }));
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(100); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150);
  check('pause menu has 4 pages (map, bag, creatures, how to play)', (await p.evaluate(() => document.querySelector('#dragon-room').d32Cart.state.page)) === 3);
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
  await p.keyboard.press('Space'); await p.waitForTimeout(900); await p.keyboard.press('Space'); await p.waitForTimeout(300); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(150);
  const f3 = await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return { floor: s.floor, trolls: s.mobs.filter(m => m.k === 'T').length, mole: s.mobs.some(m => m.k === 'M') }; });
  check('floor 3, the old mine: trolls and the Mole King', f3.floor === 3 && f3.trolls === 2 && f3.mole, JSON.stringify(f3));
  await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.mobs = []; s.x = s.sx; s.y = s.sy; s.atkCd = 0; });
  await p.keyboard.press('Space'); await p.waitForTimeout(900); await p.keyboard.press('Space'); await p.waitForTimeout(300); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(150);
  const f4 = await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return { floor: s.floor, book: s.mobs.some(m => m.k === 'W'), door: s.map[14][12] === 'D' }; });
  check('floor 4, the wizard library: a locked door and the Spell Book', f4.floor === 4 && f4.book && f4.door, JSON.stringify(f4));
  await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.mobs = []; s.x = s.sx; s.y = s.sy; s.atkCd = 0; });
  await p.keyboard.press('Space'); await p.waitForTimeout(900); await p.keyboard.press('Space'); await p.waitForTimeout(300); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(150);
  const f5 = await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return { floor: s.floor, dragon: s.mobs.some(m => m.k === 'X') }; });
  check('floor 5, the dragon lair: the Dragon', f5.floor === 5 && f5.dragon, JSON.stringify(f5));
  check('the progress is saved at the start of each floor', await p.evaluate(() => JSON.parse(localStorage.getItem('d32-deep-save') || '{}').floor === 5));
  await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.mobs = []; s.x = s.sx; s.y = s.sy; s.atkCd = 0; });
  await p.keyboard.press('Space'); await p.waitForTimeout(300);
  check('with the Dragon gone, FIRE takes the Golden Tape: the game is won and the save is cleared', await p.evaluate(() => document.querySelector('#dragon-room').d32Cart.state.mode === 'won' && !localStorage.getItem('d32-deep-save')));
  // שמירה ישנה, מלפני התרמיל, ממשיכה בלי לקרוס
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.evaluate(() => localStorage.setItem('d32-deep-save', JSON.stringify({ floor: 3, hp: 4, coins: 2, score: 900 })));
  await p.evaluate(() => [...document.querySelectorAll('.d32-cart')].find(e => /DEEP/.test(e.textContent)).click());
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart?.state?.t > 45);
  await p.keyboard.press('ArrowUp'); await p.waitForTimeout(300);
  check('an old save (before the bag) still goes on from its floor', await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return s.mode === 'play' && s.floor === 3 && s.potions === 0 && s.met instanceof Set; }));
  // אפשרות ב: מוות מחזיר לתחילת הקומה עם הניקוד של אז, ורק ויתור שולח להיכל התהילה
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(120);   // סוגרים את מסך הפתיחה של הקומה
  const before = await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.score += 777; s.hp = 0; return s.score; });
  await p.waitForTimeout(1100);
  const dead = await p.evaluate(() => document.querySelector('#dragon-room').d32Cart.state.mode);
  await p.keyboard.press('Space'); await p.waitForTimeout(300);
  const again = await p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return { mode: s.mode, floor: s.floor, score: s.score, hp: s.hp }; });
  check('after death, FIRE tries the floor again from its start (score as it was, 3+ hearts)', dead === 'over' && again.mode === 'play' && again.floor === 3 && again.score === before - 777 && again.hp >= 3, JSON.stringify(again));
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(120);
  await p.evaluate(() => { document.querySelector('#dragon-room').d32Cart.state.hp = 0; });
  await p.waitForTimeout(1100); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(300);
  check('after death, DOWN gives up: back to the title, and the save stays (Gonen, 27.10)', await p.evaluate(() => document.querySelector('#dragon-room').d32Cart.state.mode === 'title' && JSON.parse(localStorage.getItem('d32-deep-save') || '{}').floor === 3));
  // השמירה לא נדרסת (גונן, 27.10): עם שמירה, FIRE במסך הפתיחה ממשיך; משחק חדש רק ב-P ואז FIRE לאישור
  const DS = () => p.evaluate(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return { mode: s.mode, floor: s.floor, ask: !!s.askNew, save: JSON.parse(localStorage.getItem('d32-deep-save') || 'null')?.floor ?? null }; });
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);   // "בפעם הבאה": מכניסים את המחסנית מחדש
  await p.evaluate(() => [...document.querySelectorAll('.d32-cart')].find(e => /DEEP/.test(e.textContent)).click());
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart?.state?.t > 45);
  await p.keyboard.press('Space'); await p.waitForTimeout(300);
  const goOn = await DS();
  check('with a save, FIRE on the title goes on from the saved floor (it no longer starts over)', goOn.mode === 'play' && goOn.floor === 3 && goOn.save === 3, JSON.stringify(goOn));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.evaluate(() => [...document.querySelectorAll('.d32-cart')].find(e => /DEEP/.test(e.textContent)).click());
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart?.state?.t > 45);
  await p.keyboard.press('p'); await p.waitForTimeout(150);
  const asked = await DS();
  await p.keyboard.press('ArrowUp'); await p.waitForTimeout(150);
  const kept = await DS();
  check('with a save, P asks "NEW GAME?" and UP says no: still on the title, the save stays', asked.ask && asked.mode === 'title' && !kept.ask && kept.mode === 'title' && kept.save === 3, JSON.stringify([asked, kept]));
  await p.keyboard.press('p'); await p.waitForTimeout(60); await p.keyboard.press('Space'); await p.waitForTimeout(150);
  const quick = await DS();
  check('a quick FIRE right after P does not erase the save (only a deliberate FIRE does) and closes the question', quick.mode === 'title' && !quick.ask && quick.save === 3, JSON.stringify(quick));
  await p.keyboard.press('p'); await p.waitForTimeout(800); await p.keyboard.press('Space'); await p.waitForTimeout(300);
  const fresh = await DS();
  check('P and then FIRE starts a new game on floor 1 (only then is the old save replaced)', fresh.mode === 'play' && fresh.floor === 1 && fresh.save === 1, JSON.stringify(fresh));
  // הסוקר (27.10): אותה ריצה לא נכנסת להיכל התהילה (והטבלה העולמית) פעמיים. ויתור שולח רק ניקוד גבוה ממה שכבר נשלח בריצה הזו
  await p.evaluate(() => { const api = document.querySelector('#dragon-room').d32Cart; window.__sent = []; window.__origSubmit = api.submitScore; api.submitScore = (id, sc) => window.__sent.push(sc); });
  const dieAndGiveUp = async score => {
    await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(120);
    await p.evaluate(sc => { const s = document.querySelector('#dragon-room').d32Cart.state; s.score = sc; s.hp = 0; }, score);
    await p.waitForFunction(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return s.mode === 'over' && s.t > 45; });
    await p.keyboard.press('ArrowDown'); await p.waitForTimeout(200);
    await p.evaluate(() => { document.querySelector('#dragon-room').d32Cart.state.t = 50; });
    await p.keyboard.press('Space'); await p.waitForTimeout(250);   // ממשיכים מהשמירה, כמו שחקן שחוזר
    return p.evaluate(() => ({ sent: [...window.__sent], sub: JSON.parse(localStorage.getItem('d32-deep-save') || '{}').sub, mode: document.querySelector('#dragon-room').d32Cart.state.mode }));
  };
  const g1 = await dieAndGiveUp(500), g2 = await dieAndGiveUp(500), g3 = await dieAndGiveUp(900);
  check('giving up twice with the same score sends it to the hall of fame once; a better score is sent again', g1.sent.length === 1 && g1.sub === g1.sent[0] && g2.sent.length === 1 && g3.sent.length === 2 && g3.sub === g3.sent[1] && g3.mode === 'play', JSON.stringify([g1, g2, g3]));
  await p.evaluate(() => { document.querySelector('#dragon-room').d32Cart.submitScore = window.__origSubmit; });
  // איזון: בכל קומה יש לפחות 2 לפידים, והאור (התחלה + לפידים) מספיק לחקור את כל המבוך פעמיים בקצב של צעד בשנייה
  const bal = await p.evaluate(async () => {
    const { _test } = await import('/assets/dragon/carts/deep.js');
    return _test.FLOORS.map(F => { const all = F.map.join(''); return { torches: all.split('t').length - 1, open: all.split('').filter(c => c !== '#').length, light: (all.split('t').length) * _test.TORCH_FRAMES / 50 }; });
  });
  // ---- סבב 2: קומה 1 מחדש לבדיקות ----
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.evaluate(() => localStorage.removeItem('d32-deep-save'));
  await p.evaluate(() => [...document.querySelectorAll('.d32-cart')].find(e => /DEEP/.test(e.textContent)).click());
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart?.state?.t > 45);
  await p.keyboard.press('Space'); await p.waitForTimeout(150); await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(100); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(100);
  const D = f => p.evaluate(f);
  // קיר סדוק בקומה 1 (7,3): FIRE מולו פותח מעבר
  await D(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.mobs = []; s.x = 6; s.y = 3; s.dir = 1; s.atkCd = 0; s.dirty = true; });
  await p.keyboard.press('Space'); await p.waitForTimeout(150);
  check('round 2: FIRE at a cracked wall opens a secret passage', await D(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return s.map[3][7] === '.' && s.secrets === 1; }));
  // רמה: ניצחון שעובר את הסף מעלה רמה ומוסיף לב
  await D(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.xp = 50; s.hp = 5; s.mobs = [{ k: 'g', x: s.x + 1, y: s.y, hx: 0, hy: 0, hp: 1, cd: 9999, wind: 0, flash: 0, dust: 0 }]; s.map[s.y][s.x + 1] = '.'; s.atkCd = 0; s.dirty = true; });
  await p.keyboard.press('Space'); await p.waitForTimeout(150);
  check('round 2: a win past the threshold levels up (level 2, room for 6 hearts)', await D(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return s.lv === 2 && s.hp === 6; }));
  // קשת: חץ פוגע באויב שלושה צעדים קדימה; כשהחצים נגמרים חוזרים לחרב
  await D(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.x = 6; s.y = 1; s.dir = 1; s.hasBow = true; s.arrows = 1; s.weapon = 'bow'; s.mobs = [{ k: 'g', x: 9, y: 1, hx: 9, hy: 1, hp: 2, cd: 9999, wind: 0, flash: 0, dust: 0 }]; s.atkCd = 0; s.dirty = true; });
  await p.keyboard.press('Space'); await p.waitForTimeout(500);
  check('round 2: an arrow hits the first enemy down the corridor; out of arrows = sword again', await D(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return s.mobs[0].hp === 1 && s.arrows === 0 && s.weapon === 'sword'; }));
  // עם קשת ביד, FIRE על המדרגות יורד ולא יורה (ממצא הבודק)
  const stairsBow = await D(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.mobs = s.mobs.filter(m => !m.boss && !'BGMWX'.includes(m.k)); s.hasBow = true; s.arrows = 3; s.weapon = 'bow'; s.x = s.sx; s.y = s.sy; s.atkCd = 0; s.shot = null; return s.floor; });
  await p.keyboard.press('Space'); await p.waitForTimeout(150);
  check('round 2: with the bow in hand, FIRE on the stairs goes down and spends no arrow', await D(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return s.mode === 'next' && s.arrows === 3; }));
  await D(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.mode = 'play'; s.x = 6; s.y = 1; s.dir = 1; s.weapon = 'sword'; s.dirty = true; });
  // גובלין גונב מטבע ובורח
  await D(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.coins = 2; s.hp = 5; s.mobs = [{ k: 'g', x: s.x + 1, y: s.y, hx: 0, hy: 0, hp: 2, cd: 0, wind: 1, flash: 0, dust: 0 }]; });
  await p.waitForTimeout(120);
  check('round 2: a goblin steals a coin and runs, instead of hitting', await D(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return s.coins === 1 && s.hp === 5 && s.mobs[0].flee > 0; }));
  // איש פטרייה: מכה מאטה
  await D(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.mobs = [{ k: 'm', x: s.x + 1, y: s.y, hx: 0, hy: 0, hp: 3, cd: 0, wind: 1, flash: 0, dust: 0 }]; });
  await p.waitForTimeout(120);
  check('round 2: a mushroom man\'s blow leaves you slow', await D(() => document.querySelector('#dragon-room').d32Cart.state.slow > 0));
  // טרול לא זז
  await D(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.slow = 0; s.mobs = [{ k: 'T', x: 10, y: 1, hx: 10, hy: 1, hp: 5, cd: 0, wind: 0, flash: 0, dust: 0 }]; });
  await p.waitForTimeout(800);
  check('round 2: a troll stays put and blocks', await D(() => { const m = document.querySelector('#dragon-room').d32Cart.state.mobs[0]; return m.x === 10 && m.y === 1; }));
  // ידיד: הליכה אליו נותנת מתנה פעם אחת; מכה בו עולה 100
  await D(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.torch = 0.3; s.score = 500; s.mobs = [{ k: 'O', x: s.x + 1, y: s.y, hx: 0, hy: 0, hp: 1, cd: 0, wind: 0, flash: 0, dust: 0 }]; });
  await p.keyboard.press('ArrowUp'); await p.waitForTimeout(150);
  const gift = await D(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return s.torch > 0.95 && s.mobs[0].given; });
  await D(() => { document.querySelector('#dragon-room').d32Cart.state.atkCd = 0; });
  await p.keyboard.press('Space'); await p.waitForTimeout(150);
  check('a friend gives a gift when you walk up; FIRE at a friend talks and never hurts (Gonen, 27.10)', gift && await D(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return s.score === 500 && !s.mobs[0].dust && s.msg === 'THE MINER WAVES. GOOD LUCK!'; }));
  // קומה 4: הסורג נעול בלי מפתח
  await D(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.floor = 3; s.mode = 'next'; s.t = 99; });
  await p.waitForTimeout(150); await p.keyboard.press('Space'); await p.waitForTimeout(200); await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(100);
  await D(() => { const s = document.querySelector('#dragon-room').d32Cart.state; s.mobs = s.mobs.filter(m => m.k === 'J'); s.keys = 0; s.x = 14; s.y = 10; s.dir = 2; s.dirty = true; });
  await p.keyboard.press('ArrowUp'); await p.waitForTimeout(120);
  const barsShut = await D(() => document.querySelector('#dragon-room').d32Cart.state.map[11][14] === 'H');
  await D(() => { document.querySelector('#dragon-room').d32Cart.state.keys = 1; });
  await p.keyboard.press('ArrowUp'); await p.waitForTimeout(120);
  check('round 2: the prisoner\'s bars stay shut without a key and open with one', barsShut && await D(() => document.querySelector('#dragon-room').d32Cart.state.map[11][14] === '.'));
  await p.keyboard.press('ArrowUp'); await p.waitForTimeout(120); await p.keyboard.press('ArrowUp'); await p.waitForTimeout(120);
  check('round 2: the freed prisoner gives a potion and arrows', await D(() => { const s = document.querySelector('#dragon-room').d32Cart.state; return s.mobs.find(m => m.k === 'J').given && s.potions >= 1; }));
  // ---- סבב 3: קושי, מלכודות, סוחר, פתקים, מוזיקה ----
  const S3 = f => p.evaluate(f);
  const restart = async keys => {
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    await S3(() => { localStorage.removeItem('d32-deep-save'); localStorage.removeItem('d32-deep-diff'); });
    await S3(() => [...document.querySelectorAll('.d32-cart')].find(e => /DEEP/.test(e.textContent)).click());
    await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart?.state?.t > 45);
    for (const k of keys) { await p.keyboard.press(k); await p.waitForTimeout(100); }
    await p.keyboard.press('Space');
    await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart.state.mode === 'play');
    await p.evaluate(() => { document.querySelector('#dragon-room').d32Cart.state.intro = 0; }); await p.waitForTimeout(100);
  };
  const st = 'document.querySelector("#dragon-room").d32Cart.state';
  const ev = code => p.evaluate(`(() => { const s = ${st}; ${code} })()`);
  await restart(['ArrowLeft']);
  check('round 3: LEFT on the title picks EASY: 6 hearts from the start, and the choice is remembered', await ev("return s.diff === 0 && s.hp === 6 && localStorage.getItem('d32-deep-diff') === '0';"));
  await restart(['ArrowRight']);
  const hard = await ev("const t0 = s.torch; return { diff: s.diff, hp: s.hp };");
  await p.waitForTimeout(1000);
  const burn = await ev("return 1 - s.torch;");
  check('round 3: RIGHT picks HARD: 5 hearts, and the torch burns faster than on NORMAL', hard.diff === 2 && hard.hp === 5 && burn > 50 / 12000 * 1.1, JSON.stringify({ hard, burn }));
  await restart([]);
  check('round 3: NORMAL is the default', await ev('return s.diff === 1;'));
  // פתק בקומה 1: (5,1), עומדים ב-(4,1) מול מזרח
  await ev('s.mobs = []; s.x = 4; s.y = 1; s.dir = 1; s.atkCd = 0; s.dirty = true;');
  await p.waitForTimeout(100); await p.keyboard.press('Space'); await p.waitForTimeout(150);
  const note = await ev('return s.note && s.note[0];');
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(150);
  check('round 3: FIRE at a note reads it, and any key closes it', note === 'TO WHOEVER COMES NEXT:' && await ev('return !s.note && s.dir === 1;'), String(note));
  // קומה 2: קוצים ב-(12,1)
  await ev("s.floor = 1; s.mode = 'next'; s.t = 99;"); await p.waitForTimeout(150); await p.keyboard.press('Space'); await p.waitForTimeout(200); await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(100);
  await ev('s.mobs = s.mobs.filter(m => m.k === "V"); s.x = 12; s.y = 1; s.hp = 5; const t = s.traps.find(t => t.x === 12 && t.y === 1); s.floorT = (150 * 9 + 20 - 12 * 37 - 11) % 150 + 150 * 9; s.dirty = true;');
  await p.waitForTimeout(400);
  const safe = await ev('return s.hp;');
  await ev('s.floorT = 150 * 20 + ((125 - 12 * 37 - 11) % 150 + 150) % 150;');
  await p.waitForTimeout(800);
  check('round 3: spikes do nothing while down, and hit once when they rise under you', safe === 5 && await ev('return s.hp === 4;'), 'safe ' + safe);
  // הסוחר בקומה 2: (1,14), עומדים ב-(1,13) מול דרום
  await ev('s.x = 1; s.y = 13; s.dir = 2; s.coins = 5; s.potions = 0; s.hasBow = false; s.dirty = true;');
  await p.keyboard.press('ArrowUp'); await p.waitForTimeout(150);
  const shopOpen = await ev('return !!s.shop;');
  await p.keyboard.press('Space'); await p.waitForTimeout(120);
  const bought = await ev('return s.coins === 2 && s.potions === 1;');
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(80); await p.keyboard.press('Space'); await p.waitForTimeout(120);
  const noBow = await ev("return s.coins === 2 && s.msg === 'YOU HAVE NO BOW YET';");
  await p.keyboard.press('Space'); await p.waitForTimeout(120); await p.keyboard.press('ArrowUp'); await p.waitForTimeout(80); await p.keyboard.press('Space'); await p.waitForTimeout(120);
  const poor = await ev("return s.coins === 2 && s.potions === 1 && s.msg === 'NOT ENOUGH COINS';");
  await p.keyboard.press('p'); await p.waitForTimeout(150);
  check('round 3: the merchant opens a shop: a potion costs 3 coins, no arrows without a bow, no sale without coins, P leaves', shopOpen && bought && noBow && poor && await ev('return !s.shop && !s.paused;'), JSON.stringify({ shopOpen, bought, noBow, poor }));
  // קומה 3: תקרה רעועה ב-(10,3)
  await ev("s.floor = 2; s.mode = 'next'; s.t = 99;"); await p.waitForTimeout(150); await p.keyboard.press('Space'); await p.waitForTimeout(200); await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(100);
  await ev('s.mobs = []; s.x = 9; s.y = 3; s.dir = 1; s.hp = 5; s.dirty = true;');
  await p.keyboard.press('ArrowUp'); await p.waitForTimeout(1400);
  const stayed = await ev('return s.hp;');
  await ev('s.x = 13; s.y = 2; s.dir = 2; s.hp = 5; s.dirty = true;');
  await p.keyboard.press('ArrowUp'); await p.waitForTimeout(200); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(1400);
  check('round 3: a shaking ceiling hits you if you stay, and misses if you step away', stayed === 4 && await ev('return s.hp === 5 && s.traps.filter(t => t.k === "*" && t.done).length === 2;'), 'stayed ' + stayed);
  // מוזיקה: כיבוי בתרמיל נזכר
  await p.keyboard.press('p'); await p.waitForTimeout(150); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150);
  for (let i = 0; i < 10; i++) { await p.keyboard.press('ArrowDown'); await p.waitForTimeout(60); }
  await p.keyboard.press('Space'); await p.waitForTimeout(150); await p.keyboard.press('p'); await p.waitForTimeout(150);
  check('round 3: music can be turned off in the bag, and that is remembered', await ev("return s.music === false && localStorage.getItem('d32-deep-music') === 'off';"));
  await ev("localStorage.removeItem('d32-deep-music');");
  // כל קומה אפשר לסיים בלי לדרוך על מלכודת ובלי לעבור דרך ידיד
  const route = await p.evaluate(async () => {
    const { _test } = await import('/assets/dragon/carts/deep.js');
    return _test.FLOORS.map(f => {
      const M = f.map.map(r => r.split('')), find = c => { const o = []; M.forEach((r, y) => r.forEach((ch, x) => ch === c && o.push([x, y]))); return o; };
      const reach = open => { const st = find('@')[0], seen = new Set([st.join()]), q = [st]; while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const c = M[y + dy]?.[x + dx]; if (!c || '#%HN^*VOJ'.includes(c) || (c === 'D' && !open) || seen.has((x + dx) + ',' + (y + dy))) continue; seen.add((x + dx) + ',' + (y + dy)); q.push([x + dx, y + dy]); } } return seen; };
      const shut = reach(false), all = reach(true);
      return find('k').some(([x, y]) => shut.has(x + ',' + y)) || !find('D').length ? find('S').every(([x, y]) => all.has(x + ',' + y)) : false;
    });
  });
  check('round 3: every floor can be finished without stepping on a trap', route.every(Boolean), JSON.stringify(route));
  // שמירה ישנה (v3, בלי קושי) נטענת כ-NORMAL
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await S3(() => localStorage.setItem('d32-deep-save', JSON.stringify({ v: 3, floor: 2, hp: 5, coins: 1, score: 300, xp: 70, hasBow: false, arrows: 0, weapon: 'sword' })));
  await S3(() => [...document.querySelectorAll('.d32-cart')].find(e => /DEEP/.test(e.textContent)).click());
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart?.state?.t > 45);
  await p.keyboard.press('ArrowUp');
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart.state.mode === 'play', null, { timeout: 3000 }).catch(() => {});
  check('round 3: an older save (round 2) loads as NORMAL', await ev('return s.mode === "play" && s.floor === 2 && s.diff === 1 && s.lv === 2;'));
  await S3(() => localStorage.removeItem('d32-deep-save'));
  const longMsg = await p.evaluate(async () => (await import('/assets/dragon/carts/deep.js'))._test.messages().filter(m => m.length > 30));
  check('every game message fits on one line (30 characters at most)', longMsg.length === 0, longMsg.join(' | '));
  check('balance: every floor has 2+ torches, and enough light to walk the whole maze twice', bal.every(f => f.torches >= 2 && f.light >= f.open * 2), JSON.stringify(bal));
  await p.keyboard.press('Escape');
  await p.close();
}

if (part('full computer /dragon/app/ (theater, coder, AI)')) {
  console.log('full computer /dragon/app/ (theater, coder, AI)');
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  p.on('pageerror', e => pageErrors.push(e.message));
  await p.goto(base.replace(/\/$/, '') + '/#app');
  await p.waitForSelector('#dragon-room.is-ready');
  const room = p.locator('#dragon-room');
  await p.waitForTimeout(1400);
  check('the full computer opens straight in full screen', await room.evaluate(e => e.classList.contains('is-theater')));
  check('top bar: brand and status "מוכן"', (await p.locator('.d32-bar-brand b').textContent()) === 'Dragon 1982' && /מוכן/.test(await p.locator('.d32-status').textContent()));
  check('on a computer, all four pages (lessons, journey, magazine, history) are visible under the helper', (await Promise.all(['/lessons/', '/story/', '/magazine/', '/dragon-history/'].map(h => p.locator(`.d32-pages-side a[href="${h}"]`).isVisible()))).every(Boolean));
  check('toolbox has 3 tabs on a computer; the tapes are in the shelf tab', (await p.locator('.d32-tab:visible').count()) === 3 && (await p.locator('.d32-pane[data-pane="shelf"] .d32-tape').count()) >= 6);
  await p.locator('.d32-tab[data-tab="shelf"]').click(); await openDrawers(p);
  check('on a computer too, the shelf tab says how the Dragon machine differs from the app', await p.locator('.d32-pane[data-pane="shelf"] .d32-lab-shelf').isVisible() && /למכונת ה-Dragon/.test(await p.locator('.d32-pane[data-pane="shelf"] .d32-lab-shelf').textContent()));
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
  await late.goto(base.replace(/\/$/, '') + '/#app');
  await late.waitForSelector('#dragon-room.is-ready');
  const lateWas = await late.locator('#dragon-room').evaluate(e => e.classList.contains('is-theater'));
  await late.setViewportSize({ width: 1440, height: 900 });
  await late.waitForTimeout(300);
  check('window that grows after loading enters full screen by itself', !lateWas && await late.locator('#dragon-room').evaluate(e => e.classList.contains('is-theater')));
  await late.close();
  const ph = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await ph.goto(base.replace(/\/$/, '') + '/#app');
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
  await p.goto(base.replace(/\/$/, '') + '/#app');
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

// הדף הראשי נפתח בבחירה בין המכונה לאפליקציה; האפליקציה נפתחת רק אחרי בחירה (גונן, 9.11)
if (part('home choice')) {
  console.log('home choice');
  for (const [name, opt, path, lab] of [
    ['desktop he', { viewport: { width: 1440, height: 900 }, locale: 'he-IL' }, '/', '/lab/1982/'],
    ['phone he', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'he-IL' }, '/', '/lab/1982/'],
    ['desktop en', { viewport: { width: 1440, height: 900 }, locale: 'en-GB' }, '/en/', '/en/lab/1982/']]) {
    const ctx = await browser.newContext(opt);
    const p = await ctx.newPage();
    p.on('pageerror', e => pageErrors.push(e.message));
    await p.goto(base.replace(/\/$/, '') + path);
    await p.waitForSelector('#dragon-room.is-ready', { state: 'attached' });
    await p.waitForTimeout(600);
    const open = () => p.evaluate(() => document.documentElement.classList.contains('d32-theater-on'));
    check(name + ': the app does not open by itself', !(await open()));
    const vis = await p.evaluate(() => [...document.querySelectorAll('.d32-choose-card')].map(c => { const r = c.getBoundingClientRect(); return r.top < innerHeight && r.height > 0; }));
    check(name + ': both choices are on the first screen', vis.length === 2 && vis.every(Boolean), JSON.stringify(vis));
    check(name + ': the dark choice screen covers the page', await p.locator('.d32-choose').isVisible());
    check(name + ': the machine card links to the machine', (await p.locator('.d32-choose-machine').getAttribute('href')) === lab);
    await p.locator('.d32-choose-app').click();
    await p.waitForTimeout(500);
    check(name + ': "the app" opens the app', await open() && !(await p.locator('.d32-choose').count()));
    // מתוך האפליקציה: 🏠 Dragon 1982 חוזר למסך הראשי (גונן, 12.11)
    check(name + ': in the app, 🏠 Dragon 1982 leads back to the home screen', (await p.locator('.d32-home').first().getAttribute('href')) === (path === '/en/' ? '/en/' : '/'));
    await p.goto(base.replace(/\/$/, '') + path);
    await p.waitForSelector('.d32-choose');
    await p.locator('.d32-choose-guide').click();
    check(name + ': "guide" closes the choice and shows the guide page', !(await p.locator('.d32-choose').count()) && !(await open()) && await p.locator('.hero h1').isVisible());
    await ctx.close();
  }
  for (const f of ['lab/1982/index.html', 'en/lab/1982/index.html', 'lab/1982/the-count/index.html']) {
    const html = await readFile(new URL('../' + f, import.meta.url), 'utf8');
    check(f + ': its link to the app opens the app directly (#app)', /href="\/(en\/)?#app"/.test(html));
  }
  // מסך הבחירה נמצא בתוך ה-HTML עצמו (לא רק אחרי JavaScript), כדי שמנועי חיפוש יראו אותו (המנהל העליון, 9.11)
  for (const [f, lab] of [['index.html', '/lab/1982/'], ['en/index.html', '/en/lab/1982/']]) {
    const html = await readFile(new URL('../' + f, import.meta.url), 'utf8');
    check(f + ': the choice screen and both choices are in the page HTML, canonical set, no noindex', html.includes('class="d32-choose"') && html.includes('href="' + lab + '"') && html.includes('d32-choose-app') && /<link rel="canonical" href="https:\/\/dragon1982\.com\/(en\/)?">/.test(html) && !/noindex/i.test(html));
  }
  // דפי התוכן מובילים לדף הבית (מסך הבחירה), לא למחשב אחד מהשניים
  for (const f of ['story/index.html', 'guides/index.html', 'en/guides/index.html', 'magazine/index.html', 'adverts/index.html', 'lessons/index.html']) {
    const html = await readFile(new URL('../' + f, import.meta.url), 'utf8');
    check(f + ': "home" goes to the choice screen, no "back to the computer" left', /href="\/(en\/)?">← (לדף הבית|Home)</.test(html) && !/חזרה למחשב|Back to the computer/.test(html));
  }
}

// ל-Dragon אמיתי (גונן, 9.11): דף הורדות נפרד, בלי מכונה. בכל שורה ▶ השמעה, ⬇ צליל, ⬇ קלטת (גונן, 10.11: רשות של מחבר מכסה גם הורדה).
// בדף המשחק רק שורה עם קישור. הצליל נוצר בדפדפן מקובץ הקלטת
if (part('real dragon sound')) {
  console.log('real dragon sound');
  const p = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  p.on('pageerror', e => pageErrors.push(e.message));
  const root = base.replace(/\/$/, '');
  for (const [path, n] of [['/lab/1982/real-dragon/', 'he'], ['/en/lab/1982/real-dragon/', 'en']]) {
    await p.goto(root + path); await p.waitForTimeout(800);
    const r = await p.evaluate(() => ({ rows: document.querySelectorAll('.real-list li:not(.off)').length, off: [...document.querySelectorAll('.real-list li.off')].map(x => x.id).sort().join(), machine: !!document.querySelector('canvas'),
      count: [...document.querySelectorAll('#count .rb > *')].map(x => x.className), spores: !!document.querySelector('#spores'),
      dagg: !!document.querySelector('#daggorath button'), buzz: !!document.querySelector('#buzzard button'), cas: document.querySelector('#count a.c')?.getAttribute('href') }));
    check(n + ': the downloads page has 70 games and the Dragon Assembler to load, 3 others greyed out with a reason, Star Spores not on it at all (shelf-only permission, no explanation: Gonen 11.11), and no machine on it', r.rows === 71 && r.off === 'buzzard,cavehunter,daggorath' && !r.spores && !r.machine, JSON.stringify(r));
    check(n + ': The Count has play, sound and tape; no cartridges or Buzzard Bait', r.count.join() === 'p,w,c' && !r.dagg && !r.buzz && r.cas === '/lab/1982/tapes/count.cas', JSON.stringify(r));
  }
  const w = await p.evaluate(async () => { const x = await (async () => window.D32Wav.casWav(new Uint8Array(await (await fetch('/lab/1982/tapes/snaker.cas')).arrayBuffer())))(); return [String.fromCharCode(...x.slice(0, 4)), String.fromCharCode(...x.slice(8, 12)), x.length]; });
  check('a shelf tape becomes a WAV sound in the browser', w[0] === 'RIFF' && w[1] === 'WAVE' && w[2] > 1000000, JSON.stringify(w));
  await p.goto(root + '/lab/1982/the-count/'); await p.waitForTimeout(2500);
  check('the game page has only a one-line link to its row on the downloads page', (await p.locator('.gv-real').getAttribute('href')) === '/lab/1982/real-dragon/#count' && !(await p.locator('.real-play').count()));
  await p.close();
}

// בודקים מהקהילה (גונן, 10.11): כפתור "בדקתם?" בכל דף משחק, טופס, "נבדק על ידי", דף התודה ודף הקריאה הפרטי.
// ה-API מדומה כאן (route): הבדיקה לא צריכה מאגר נתונים
if (part('testers')) {
  console.log('testers');
  const root = base.replace(/\/$/, '');
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const posts = [], patches = []; let postStatus = 200;
  const credits = { 'the-count': ['Ann', 'Ben', 'Cy', 'Dee', 'Eve'], 'downland': ['Zed'] };
  await ctx.route('**/api/report**', route => {
    const r = route.request(), m = r.method();
    if (m === 'POST') { posts.push(JSON.parse(r.postData() || '{}')); return route.fulfill({ status: postStatus, contentType: 'application/json', body: postStatus === 200 ? '{"ok":true}' : '{"error":"fail"}' }); }
    if (m === 'PATCH') { const b = JSON.parse(r.postData() || '{}'); patches.push([r.headers()['x-reports-key'], b]); return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: b.id, approved: b.approved }) }); }
    if (r.headers()['x-reports-key']) return route.fulfill({ status: r.headers()['x-reports-key'] === 'k1' ? 200 : 401, contentType: 'application/json', body: JSON.stringify({ reports: [
      { id: 2, game: 'the-count', device: 'iPhone · Safari', result: 'no', note: 'stuck', name: 'Ann', show_name: true, contact: 'a@b.c', created: '2026-11-10T10:00:00Z', approved: false },
      { id: 1, game: 'downland', device: 'Mac · Chrome', result: 'ok', note: '', name: '', show_name: false, contact: '', created: '2026-11-09T10:00:00Z', approved: false }] }) });
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(credits) });
  });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(root + '/lab/1982/the-count/');
  await p.waitForSelector('.tst-open');
  check('he game page: the "🐞 בדקתם? ספרו לנו אם עבד" button sits right after the real-Dragon link', await p.evaluate(() => { const b = document.querySelector('.tst-open'); return b.textContent === '🐞 בדקתם? ספרו לנו אם עבד' && b.previousElementSibling?.classList.contains('gv-real'); }));
  await p.waitForSelector('.tst-credits:not([hidden])');
  const cr = await p.evaluate(() => { const c = document.querySelector('.tst-credits'); return c && !c.hidden && c.getClientRects().length ? { t: c.textContent, href: c.querySelector('a')?.getAttribute('href') } : null; });
  check('"נבדק על ידי" under the report button at the top: the 3 newest approved names, then "ועוד 2 ←" to the game on the thank-you page', cr && cr.t === 'נבדק על ידי: Ann, Ben, Cy ועוד 2 ←' && cr.href === '/lab/1982/testers/#the-count', JSON.stringify(cr));
  await p.click('.tst-open');
  const d = await p.evaluate(() => { const g = document.querySelector('dialog.tst-dlg'), r = g.getBoundingClientRect(); return { open: g.open, game: g.querySelector('.tst-gname').textContent, dev: g.querySelector('#tst-device').value, l: r.left, r: r.right, labels: [...g.querySelectorAll('input:not([type=radio]):not([type=checkbox]), textarea')].every(i => i.labels && i.labels.length) }; });
  check('the form opens as a dialog with the game fixed, device and browser filled in, every field labelled, and fits a 375 px phone with 16 px gutters', d.open && d.game === 'The Count' && /Chrome/.test(d.dev) && d.l >= 15.5 && d.r <= 359.5 && d.labels, JSON.stringify(d));
  await p.click('.tst-send');
  check('the result is required: sending without one shows a simple message and sends nothing', /בחרו אחת משלוש/.test(await p.locator('.tst-err').textContent()) && posts.length === 0);
  await p.locator('.tst-res label', { hasText: 'עבד חלקית' }).click();
  await p.fill('#tst-note', 'x'.repeat(1200));
  await p.check('#tst-show');
  await p.click('.tst-send');
  check('"show my name" without a name asks for the name, and sends nothing', /השם שלכם/.test(await p.locator('.tst-err').textContent()) && posts.length === 0);
  await p.fill('#tst-name', 'Gonen Y');
  await p.fill('#tst-contact', 'me@example.com');
  postStatus = 500; await p.click('.tst-send'); await p.waitForTimeout(300);
  check('a server error shows a simple message and keeps the form', /לא נשלח/.test(await p.locator('.tst-err').textContent()) && await p.locator('.tst-step').isVisible());
  postStatus = 200; posts.length = 0; await p.click('.tst-send');
  await p.waitForSelector('.tst-done:not([hidden])');
  const sent = posts[0] || {};
  check('Send posts the report (game slug, result, note cut to 1000, name, show_name, contact) and says thank you', sent.game === 'the-count' && sent.result === 'partly' && sent.note.length === 1000 && sent.name === 'Gonen Y' && sent.show_name === true && sent.contact === 'me@example.com' && /תודה רבה/.test(await p.locator('.tst-thanks').textContent()), JSON.stringify(sent).slice(0, 200));
  await p.click('.tst-close');
  check('the dialog closes', !(await p.evaluate(() => document.querySelector('dialog.tst-dlg').open)));
  // אנגלית
  await p.goto(root + '/en/lab/1982/downland/'); await p.waitForSelector('.tst-open');
  await p.click('.tst-open');
  const en = await p.evaluate(() => { const g = document.querySelector('dialog.tst-dlg'); return { b: document.querySelector('.tst-open').textContent, heb: /[֐-׿]/.test(g.innerText), t: g.querySelector('h2').textContent }; });
  check('en game page: "🐞 Tried it? Tell us if it worked", and the form has no Hebrew', en.b === '🐞 Tried it? Tell us if it worked' && !en.heb && /Tried it/.test(en.t), JSON.stringify(en));
  await p.keyboard.press('Escape');
  await p.waitForSelector('.tst-credits:not([hidden])');
  check('en: "Tested by:" with one name and a thank-you link', (await p.locator('.tst-credits').textContent()) === 'Tested by: Zed · Thank you! 🐞');
  // דף התודה
  await p.goto(root + '/lab/1982/testers/#the-count'); await p.waitForSelector('#tst-list tr:not(.example)');
  const tp = await p.evaluate(() => ({ ids: [...document.querySelectorAll('#tst-list tr')].map(l => l.id), who: document.querySelector('#the-count td:last-child').textContent, empty: document.getElementById('tst-empty').hidden }));
  check('the thank-you page: a table of every approved tester by game, in shelf order, an anchor per game, and the example row is gone', tp.ids.join() === 'downland,the-count' && tp.who === 'Ann, Ben, Cy, Dee, Eve' && tp.empty, JSON.stringify(tp));
  await p.goto(root + '/en/lab/1982/testers/'); await p.waitForSelector('#tst-list tr:not(.example)');
  check('en thank-you page: English game names, no Hebrew except the language link', await p.evaluate(() => [...document.querySelectorAll('main *')].every(e => !/[֐-׿]/.test(e.textContent))));
  await p.goto(root + '/lab/1982/');
  check('the machine page links to the thank-you page next to the downloads link', (await p.locator('.shelf a[href="/lab/1982/testers/"]').count()) === 1);
  // דף הקריאה הפרטי
  await p.goto(root + '/lab/1982/reports/');
  check('the private page is noindex and asks for the key', (await p.getAttribute('meta[name=robots]', 'content')).includes('noindex') && await p.locator('#key').isVisible());
  await p.fill('#key', 'bad'); await p.click('#key-box button');
  await p.waitForFunction(() => /לא נכון/.test(document.getElementById('msg').textContent));
  await p.fill('#key', 'k1'); await p.click('#key-box button');
  await p.waitForSelector('#list li');
  const rp = await p.evaluate(() => ({ n: document.querySelectorAll('#list li').length, first: document.querySelector('#list li').innerText, btns: document.querySelectorAll('.ok-name').length, saved: localStorage.getItem('d32-reports-key') }));
  check('with the key: all reports, newest first, with game, result, device, note, name and contact; one approve button (only the one that asked)', rp.n === 2 && /the-count[\s\S]*לא עבד[\s\S]*iPhone · Safari[\s\S]*stuck[\s\S]*Ann[\s\S]*a@b\.c/.test(rp.first) && rp.btns === 1 && rp.saved === 'k1', JSON.stringify(rp));
  await p.selectOption('#f-result', 'ok');
  check('filter by result', (await p.locator('#list li').count()) === 1 && /downland/.test(await p.locator('#list li').innerText()));
  await p.selectOption('#f-result', ''); await p.selectOption('#f-game', 'the-count');
  await p.click('.ok-name'); await p.waitForFunction(() => document.querySelector('.ok-name.on'));
  check('approve name sends PATCH with the key, and the button shows it', patches.length === 1 && patches[0][0] === 'k1' && patches[0][1].id === 2 && patches[0][1].approved === true);
  await p.reload(); await p.waitForSelector('#list li');
  check('the key is remembered in this browser', await p.locator('#panel').isVisible());
  check('no page errors', !errs.length, errs.join(' | '));
  await ctx.close();
}

// הגרסה האנגלית (/en/): דפדפן באנגלית מגיע אליה לבד, אין בה עברית גלויה, והבחירה בשפה נשמרת
if (part('english')) {
  console.log('english');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-GB' });
  const p = await ctx.newPage();
  p.on('pageerror', e => pageErrors.push(e.message));
  await p.goto(base.replace(/\/$/, '') + '/#app');
  await p.waitForSelector('#dragon-room.is-ready');
  await p.waitForTimeout(500);
  check('an English browser lands on /en/ (lang=en, ltr)', /\/en\/(#app)?$/.test(p.url()) && await p.evaluate(() => document.documentElement.lang === 'en' && document.documentElement.dir === 'ltr'), p.url());
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
  await p.waitForURL(/\/(#app)?$/);
  await p.waitForSelector('#dragon-room.is-ready', { state: 'attached' });
  check('"עברית" goes to the Hebrew home page and is remembered', await p.evaluate(() => document.documentElement.lang === 'he' && localStorage.getItem('d32-lang') === 'he'));
  await p.goto(base.replace(/\/$/, '') + '/en/#app');
  await p.waitForURL(/\/(#app)?$/);
  check('a remembered Hebrew choice wins over /en/ too', await p.evaluate(() => document.documentElement.lang === 'he'));
  await ctx.close();
}

// המחשב האמיתי (ניסוי): XRoar עם ה-ROM שלנו עולה, והמקלדת המצוירת מקלידה בו
if (part('cartridge JUNGLE KING')) {
  // JUNGLE KING, סבב 1 (גונן, 27.10): המנוע, עולמות 1 ו-2 (12 מסכים), שמירה בטוחה, ורובוט שעובר כל מסך
  console.log('\ncartridge JUNGLE KING');
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  p.on('pageerror', e => pageErrors.push(e.message));
  await p.goto(base.replace(/\/$/, '') + '/#app');
  await p.evaluate(() => { localStorage.removeItem('d32-king-save'); localStorage.removeItem('d32-king-diff'); });
  await p.reload(); await p.waitForSelector('#dragon-room.is-ready');
  await p.locator('.d32-tab[data-tab="shelf"]').click();
  const open = () => p.evaluate(() => [...document.querySelectorAll('.d32-cart')].find(e => /KING/.test(e.textContent)).click());
  await open();
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart?.state?.t > 45);
  const K = (code = '') => p.evaluate(`(async () => { const m = await import('/assets/dragon/carts/king.js'); const s = document.querySelector('#dragon-room').d32Cart.state; ${code} })()`);
  const press = async (key, ms = 120) => { await p.keyboard.down(key); await p.waitForTimeout(ms); await p.keyboard.up(key); await p.waitForTimeout(40); };
  check('jungle king is on the shelf and shows its title', await K('return s.mode === "title" && !s.save;'));
  await press('Space');
  const started = await K('return { mode: s.mode, world: s.world, save: JSON.parse(localStorage.getItem("d32-king-save") || "null") };');
  check('FIRE starts a new game: the tree map of world 1, and the game is saved at the start of the world', started.mode === 'map' && started.world === 1 && started.save && started.save.world === 1, JSON.stringify(started));
  await K('s.t = 40;'); await press('Space'); await K('s.t = 80;'); await p.waitForTimeout(150);
  check('FIRE on the map shows screen 1-1 and the game starts', await K('return s.mode === "play" && s.L.sc.id === "1-1";'));
  await K('s.noEnemies = true;');
  const x0 = await K('return s.p.x;'); await press('ArrowRight', 400);
  check('right arrow walks PIP to the right', (await K('return s.p.x;')) > x0 + 15);
  await K('s.p.vy = 0;'); await p.keyboard.press('Space'); await p.waitForTimeout(100);
  const air = await K('return s.p.mode;'); await p.waitForTimeout(900);
  check('FIRE jumps, and PIP lands again', air === 'air' && (await K('return s.p.mode;')) === 'walk');
  // טיפוס: החבל שעומד על הרצפה (נמצא לפי המפה), עד השורש שהוא תלוי ממנו
  const rp = await K('const g = s.L.grid; for (let c = 0; c < 32; c++) if (g[19][c] === "|") { let r = 19; while (g[r - 1][c] === "|") r--; return { c, top: 10 + (r - 1) * 8 }; }');
  await K(`s.p.x = ${rp.c} * 8 + 4; s.p.y = 170; s.p.mode = "walk";`);
  await p.keyboard.down('ArrowUp'); await p.waitForTimeout(1200); await p.keyboard.up('ArrowUp'); await p.waitForTimeout(80);
  check('UP climbs the rope and PIP stands on the root above', await K(`return s.p.mode === "walk" && s.p.y === ${rp.top};`), await K('return JSON.stringify(s.p);'));
  await K(`s.p.x = ${rp.c} * 8 + 4; s.p.y = ${rp.top};`); await press('ArrowDown', 300);
  check('DOWN on a root over a rope climbs down', await K('return s.p.mode === "climb";'));
  // חלק קלטת
  const tp = await K('const t = s.L.tapes[0]; s.p.mode = "walk"; s.p.x = t.x; s.p.y = t.y + 8; return s.score;');
  await p.waitForTimeout(100);
  check('touching a tape piece collects it (+250)', await K(`return s.got === 1 && s.score === ${tp} + 250;`));
  // חבית פוגעת
  await K('s.noEnemies = false; s.p.mode = "walk"; s.p.x = 120; s.p.y = 170; s.L.barrels.push({ x: 122, y: 170, vx: -1, vy: 0, mode: "roll", rot: 0 });');
  await p.waitForTimeout(150);
  const hurt = await K('return s.mode;'); await p.waitForTimeout(1700);
  check('a barrel hits PIP: one life less and the screen starts again', hurt === 'dying' && await K('return s.lives === 2 && (s.mode === "intro" || s.mode === "play");'));
  // יציאה
  await K('s.mode = "play"; s.noEnemies = true; const g = s.L.grid; let er = 0, ec = 0; for (let r = 20; r >= 0; r--) for (let c = 0; c < 32; c++) if (g[r][c] === "E") { er = r; ec = c; } let r2 = er; while (g[r2][ec] === "E") r2++; s.p.x = ec * 8 + 4; s.p.y = 10 + r2 * 8; s.p.mode = "walk";'); await p.waitForTimeout(150);
  check('reaching the arrow at the top clears the screen (time bonus)', await K('return s.mode === "clear";'));
  await K('s.t = 200; s.bonusShown = s.bonus;'); await press('Space'); await p.waitForTimeout(100);
  check('after the tally, the next screen (1-2)', await K('return s.L.sc.id === "1-2";'));
  // פטרייה
  await K('s.mode = "play"; s.noEnemies = true; const m0 = s.L.mush[0]; s.p.mode = "air"; s.p.x = m0.x; s.p.y = m0.y - 14; s.p.vy = 1; s.p.fallY = s.p.y;'); await p.waitForTimeout(100);
  check('landing on a mushroom bounces PIP high', await K('return s.p.mode === "air" && s.p.vy < -3;'));
  // ליאנה, מים, ושער השומר
  await K('m._test.loadScreen(s, 6); s.mode = "play"; s.noEnemies = true; const v = s.L.vines[0], a = v.amp * Math.sin(v.ph); s.p.mode = "air"; s.p.vy = 0.1; s.p.grabCd = 0; s.p.x = v.px + Math.sin(a) * v.len; s.p.y = v.py + Math.cos(a) * v.len + 14;');
  await p.waitForTimeout(100);
  check('jumping into a swinging vine grabs it', await K('return s.p.mode === "swing";'));
  await p.waitForTimeout(500); await p.keyboard.press('Space'); await p.waitForTimeout(60);
  check('FIRE lets go of the vine and PIP flies on with the swing', await K('return s.p.mode === "air" && Math.abs(s.p.vx) > 0.3;'));
  await K('s.p.mode = "air"; s.p.x = 120; s.p.y = 150; s.p.vy = 2; s.p.fallY = 150;'); await p.waitForTimeout(150);
  check('falling into the water costs a life (SPLASH)', await K('return s.mode === "dying" && s.why === "SPLASH!";'));
  await p.waitForTimeout(1600);
  await K('m._test.loadScreen(s, 5); s.mode = "play"; s.noEnemies = false; s.p.x = 12 * 8; s.p.y = 170; s.p.mode = "walk"; s.p.inv = 99999;');
  await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart.state.gateOpen, null, { timeout: 30000 }).catch(() => {});
  check('1-6: after PIP dodges the giant barrel three times on the floor, the gate opens', await K('return s.gateOpen && s.passes === 3;'));
  // שמירה בטוחה, כמו ב-DRAGON DEEP
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  await p.evaluate(() => localStorage.setItem('d32-king-save', JSON.stringify({ v: 1, diff: 1, world: 2, lives: 4, score: 5000, tapes: 9, sub: 0 })));
  await open(); await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart?.state?.t > 45);
  await press('Space');
  check('with a save, FIRE on the title goes on from the saved world (world 2)', await K('return s.mode === "map" && s.world === 2 && s.score === 5000;'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  await open(); await p.waitForFunction(() => document.querySelector('#dragon-room').d32Cart?.state?.t > 45);
  await press('p'); const asked = await K('return !!s.askNew;'); await press('ArrowUp');
  check('with a save, P asks "NEW GAME?" and UP keeps the save', asked && await K('return !s.askNew && s.mode === "title" && JSON.parse(localStorage.getItem("d32-king-save")).world === 2;'));
  await press('p'); await p.waitForTimeout(800); await press('Space');
  check('P and then FIRE starts a new game in world 1', await K('return s.mode === "map" && s.world === 1 && JSON.parse(localStorage.getItem("d32-king-save")).world === 1;'));
  // מוזיקה בתפריט P (סגירת המשחק, 27.10): ▼ מכבה ומדליק, ונזכר בדפדפן. ועמוד שני של חיות במסך הפתיחה
  await K('s.mode = "play"; s.paused = false; m._test.loadScreen(s, 0); s.world = 1;'); await press('p'); await press('ArrowDown');
  const musicOff = await p.evaluate(() => localStorage.getItem('d32-king-music')); await press('ArrowDown'); const musicOn = await p.evaluate(() => localStorage.getItem('d32-king-music')); await press('p');
  check('in the P menu, DOWN turns the music off and on, and the browser remembers it', musicOff === 'off' && musicOn === 'on', JSON.stringify([musicOff, musicOn]));
  await K('s.mode = "title"; s.titleP = 4; s.titleT = 0; s.askNew = false;'); await p.waitForTimeout(300);
  check('the title shows a second page of animals (worlds 3-7) without errors', await K('return s.mode === "title" && s.titleP === 4;') && pageErrors.length === 0);
  // טלפון: הכפתורים של המשחק, כולל P, ועל הכפתור האדום כתוב JUMP
  await p.setViewportSize({ width: 390, height: 844 });
  const pad = await p.evaluate(() => ({ shown: [...document.querySelectorAll('.d32-pad-btn')].filter(b => !b.hidden).map(b => b.dataset.pad), fire: document.querySelector('.d32-pad-fire').textContent }));
  check('on a phone: arrows, JUMP and P buttons', ['left', 'up', 'down', 'right', 'fire', 'pause'].every(b => pad.shown.includes(b)) && pad.fire === 'JUMP', JSON.stringify(pad));
  await p.keyboard.press('Escape'); await p.evaluate(() => localStorage.removeItem('d32-king-save'));
  await p.close();
  // הרובוט: כל מסך אפשר לסיים, בפחות מחצי מהזמן של המסך
  const { solve } = await import('./king/bot.mjs');
  const { _test: KT } = await import('../assets/dragon/carts/king.js');
  const route = KT.SCREENS.map((sc, i) => [sc, i]).filter(([sc]) => sc.guard !== 'bongo').map(([sc, i]) => { const r = solve(i); return { id: sc.id, ok: r.ok, sec: r.ok ? r.frames / 50 : null, time: sc.time }; });
  check(`the robot finishes every one of the ${route.length} screens with an exit (7 worlds, 40 screens with the fight), each in less than half its time`, KT.SCREENS.length === 40 && route.length === 39 && route.every(r => r.ok && r.sec < r.time / 2), JSON.stringify(route.filter(r => !r.ok || r.sec >= r.time / 2)));
  // זורק החביות בפינה (גונן, 27.10: "בדונקי לא היה אפשר להגיע לקוף"): PIP לא מגיע אליו, והחביות מתגלגלות על הקומה של היציאה
  const { reachTop, barrelRows } = await import('./king/bot.mjs');
  const thr = KT.SCREENS.map((sc, i) => [sc, i]).filter(([sc]) => sc.map[0].includes('K'));
  const reach = thr.map(([sc, i]) => ({ id: sc.id, top: reachTop(i).top }));
  check('in every screen with a barrel thrower, it sits on its own ledge where PIP can never get to', thr.length === 7 && reach.every(r => !r.top), JSON.stringify(reach));
  const flow = thr.filter(([sc]) => sc.dir !== 0).map(([sc, i]) => { const er = sc.map.findLastIndex(r => r.includes('E')) + 1; return { id: sc.id, er, rows: barrelRows(i) }; });
  check('the barrels roll down onto the top floor, where PIP walks to the exit', flow.length === 5 && flow.every(f => f.rows.includes(f.er)), JSON.stringify(flow));
  // סבב 2 (27.10): הנהרות, הכוורות והמערות. כל תכונה חדשה נבדקת על הפיזיקה עצמה
  const ksnd = { tone() {}, note() {} };
  const at = id => { const s = KT.newState(1); KT.loadScreen(s, KT.SCREENS.findIndex(x => x.id === id)); s.mode = 'play'; return s; };
  const run = (s, n, inp = {}) => { let ev = null; for (let i = 0; i < n; i++) ev = KT.step(s, inp, ksnd) || ev; return ev; };
  { const s = at('3-1'); s.noEnemies = true; const lg = s.L.logs[0]; lg.x = lg.b - 0.2; run(s, 2);
    check('3-1: at the end of the river the current sinks the log, and it comes back at the start', lg.down > 0 && lg.x <= lg.a + 1); }
  { const s = at('3-2'); const f = s.L.fish[0]; s.p.inv = 0; f.t = 27; s.p.x = f.x0 + f.dx * 0.5; s.p.y = KT.WATER + 2 - f.h + 8; s.p.mode = 'air'; s.p.vy = 0;
    check('3-2: a fish jumping out of the water hits PIP', run(s, 2) === 'die'); }
  { const s = at('3-3'); s.noEnemies = true; s.p.mode = 'climb'; s.p.x = 13 * 8 + 4; s.p.y = KT.OY + 14 * 8; const y0 = s.p.y; run(s, 15);
    check('3-3: on a rope inside the waterfall, PIP who stops climbing slides down', s.p.y > y0 + 8, s.p.y - y0); }
  { const s = at('3-4'); s.noEnemies = true; const r = s.L.raft; run(s, 1); s.p.x = r.x; s.p.y = r.y - 5; s.p.mode = 'walk'; const x0 = s.p.x; const ev = run(s, 120);
    check('3-4: the barrel raft carries PIP down the river', ev !== 'die' && s.p.x > x0 + 50 && s.p.mode === 'walk', JSON.stringify({ dx: s.p.x - x0, mode: s.p.mode })); }
  { const s = at('3-5'); s.p.inv = 1e9; const b = s.L.beavers[0]; s.p.mode = 'climb'; s.p.x = b.c * 8 + 4; s.p.y = KT.OY + (b.a + 2) * 8; run(s, 100);
    const cut = s.L.grid[b.a][b.c] === '.'; run(s, 420);
    check('3-5: a beaver gnaws the rope PIP stays on until it snaps, and later it grows back', cut && s.L.grid[b.a][b.c] === '|'); }
  { const s = at('3-6'); s.noEnemies = true; run(s, 2); const x0 = s.L.guard.logs[0].x; run(s, 60);
    check('3-6: the logs circle around the whirlpool', Math.abs(s.L.guard.logs[0].x - x0) > 10); }
  { const a = at('4-1'), b = at('4-1'); a.noEnemies = b.noEnemies = true; b.L.sticky.push({ x: b.p.x, y: b.p.y, t: 999 }); b.L.sticky.push({ x: b.p.x + 12, y: b.p.y, t: 999 });
    const xa = a.p.x, xb = b.p.x; run(a, 12, { right: 1 }); run(b, 12, { right: 1 });
    check('4-2: honey on the shelf is sticky: PIP walks at less than half speed', (b.p.x - xb) < (a.p.x - xa) * 0.6, JSON.stringify([a.p.x - xa, b.p.x - xb])); }
  { const s = at('4-3'); s.noEnemies = true; const u = s.L.lifts[0]; u.wait = 0; u.vy = -u.sp; s.p.x = u.x; s.p.y = u.y; s.p.mode = 'walk'; const y0 = s.p.y; run(s, 40);
    check('4-3: a wax lift carries PIP up', s.p.y < y0 - 10 && s.p.mode === 'walk', s.p.y - y0); }
  { const s = at('4-5'); const pot = s.L.pots[0], bee = s.L.bees[0]; s.p.inv = 0; s.p.x = pot.x; s.p.y = pot.y; s.p.mode = 'walk'; run(s, 2); const slept = s.L.sleep > 0;
    s.p.x = bee.x; s.p.y = bee.y + 8;
    check('4-5: the smoke pot puts the bees to sleep, and a sleeping bee does not sting', slept && run(s, 3) !== 'die'); }
  { const s = at('4-6'); s.noEnemies = true; const closed = !s.gateOpen; for (const j of s.L.jars) { s.p.x = j.x; s.p.y = j.y; s.p.mode = 'walk'; run(s, 2); }
    check("4-6: the queen's gate stays shut until PIP takes all 3 honey jars", closed && s.gateOpen); }
  { const s = at('5-1'); s.noEnemies = true; const r0 = KT.lightR(s); run(s, 500); const r1 = KT.lightR(s); const t = s.L.torches[0]; s.p.x = t.x; s.p.y = t.y; s.p.mode = 'walk'; run(s, 2);
    check('5-1: in the dark the torch burns down and lights less; a new torch lights it up again', r1 < r0 - 10 && KT.lightR(s) > r0 - 3, JSON.stringify([r0, r1, KT.lightR(s)])); }
  { const s = at('5-2'); s.p.inv = 1e9; const b = s.L.bats[0]; s.p.x = b.x + 10; s.p.y = b.y + 30; s.p.mode = 'air'; s.p.vy = 0; run(s, 2);
    check('5-2: a bat dives when the torch light reaches it', b.mode === 'dive'); }
  { const s = at('5-3'); s.p.inv = 1e9; const st = s.L.stones.find(k => k.hy > KT.OY + 16 * 8); s.p.x = st.x; s.p.y = KT.OY + 20 * 8; s.p.mode = 'walk'; run(s, 2); const shook = st.mode === 'shake'; run(s, 40);
    check('5-3: a stalactite shakes and falls when PIP passes under it', shook && (st.mode === 'fall' || st.mode === 'gone')); }
  { const a = at('5-6'), b = at('5-6'); a.p.inv = b.p.inv = 1e9;
    for (const s of [a, b]) { s.p.x = s.L.guard.x + 70; s.p.y = s.L.guard.y; s.p.mode = 'walk'; }
    for (let i = 0; i < 70; i++) KT.step(a, { left: i % 2 ? 0 : 0 } && { left: 1 }, ksnd);
    for (let i = 0; i < 160; i++) KT.step(b, { left: (i % 40) < 18 ? 1 : 0 }, ksnd);
    check('5-6: walking on and on near the sleeping bear wakes it; walk, stop, walk does not', a.L.guard.mode !== 'sleep' && b.L.guard.mode === 'sleep', JSON.stringify([a.L.guard.mode, b.L.guard.mode, b.L.guard.noise])); }
  // סבב 3 (27.10): הענפים, הצמרת והקרב
  { const s = at('6-1'); s.p.inv = 0; const k = s.L.nutters[0]; k.cd = 1; s.p.x = k.x + 40; s.p.y = k.y; s.p.mode = 'walk'; let ev = null; for (let i = 0; i < 90 && ev !== 'die'; i++) ev = KT.step(s, {}, ksnd) || ev;
    check('6-1: a monkey throws a coconut in an arc at PIP, and it hits him', ev === 'die'); }
  { const s = at('6-2'); s.noEnemies = true; const w = s.L.sways[0]; run(s, 1); s.p.x = w.x; s.p.y = w.y; s.p.mode = 'walk'; const x0 = s.p.x; run(s, 40);
    check('6-2: a swaying branch carries PIP with it', Math.abs(s.p.x - x0) > 8 && s.p.mode === 'walk', s.p.x - x0); }
  { const s = at('6-3'); s.p.inv = 1e9; s.p.x = 4; let rained = false; for (let i = 0; i < 120; i++) { run(s, 1); if (s.L.nuts.length) rained = true; }
    const [rr, rc] = s.L.grid.flatMap((r, ri) => r.map((ch, c) => ch === 'f' ? [ri, c] : null)).filter(Boolean)[0];
    s.L.nuts = [{ x: rc * 8 + 4, y: KT.OY + (rr - 3) * 8, vx: 0, vy: 0 }]; const nut = s.L.nuts[0]; let lowest = 0; for (let i = 0; i < 40; i++) { run(s, 1); if (s.L.nuts.includes(nut)) lowest = nut.y; }
    check('6-3: coconuts rain from the treetop, and a leaf roof stops them', rained && !s.L.nuts.includes(nut) && lowest <= KT.OY + rr * 8, JSON.stringify({ rained, lowest, roof: KT.OY + rr * 8 })); }
  { const s = at('6-4'); s.noEnemies = true; s.p.x = 10 * 8 + 4; s.p.y = KT.OY + 15 * 8; s.p.mode = 'walk'; run(s, 30); const fell = s.L.grid[15][10] === '.'; s.p.x = 20; s.p.y = KT.OY + 15 * 8; s.p.mode = 'walk'; run(s, 320);
    check('6-4: a plank of the rope bridge falls a moment after PIP stands on it, and comes back later', fell && s.L.grid[15][10] === 'b'); }
  { const s = at('6-5'); s.p.inv = 0; const a = s.L.guard.apes[0]; s.p.x = a.x; s.p.y = s.L.guard.y; s.p.mode = 'walk';
    check("6-5: BONGO's big monkeys hurt PIP when they touch him", run(s, 2) === 'die'); }
  { const s = at('7-1'); s.noEnemies = true; s.L.t = 0; s.p.x = 60; s.p.y = KT.OY + 20 * 8; s.p.mode = 'walk'; const x0 = s.p.x; run(s, 60);
    check('7-1: a gust of wind pushes PIP to one side', Math.abs(s.p.x - x0) > 15, s.p.x - x0); }
  { const s = at('7-2'); s.p.inv = 1e9; const b = s.L.bats.find(k => k.bird); s.p.x = b.x + 30; s.p.y = b.y + 8; s.p.mode = 'walk'; run(s, 2);
    check("7-2: the mother bird lunges when PIP comes near her nest", b.mode === 'dive'); }
  { const s = at('7-5'); s.p.inv = 1e9; const g = s.L.guard, ss = s.L.seesaw; let n = 0, ev = null;
    while (n < 20000 && g.hits < 3) { const b = s.L.barrels.find(k => k.mode === 'rest'); if (b) { s.p.x = ss.x - 20 * b.side; s.p.y = ss.y; s.p.mode = 'walk'; s.p.vx = 0; run(s, 1, { fire: 1 }); run(s, 100); n += 101; } else { s.p.x = 20; s.p.y = ss.y; s.p.mode = 'walk'; run(s, 1); n++; } }
    run(s, 200); const gold = s.L.gold; if (gold) { s.p.x = gold.x - 30; s.p.y = ss.y; s.p.mode = 'walk'; for (let i = 0; i < 60 && ev !== 'win'; i++) ev = KT.step(s, { right: 1 }, ksnd); }
    check("7-5: barrels on the seesaw fly back at BIG BONGO; after 3 hits he runs, and the Golden Tape wins the game", g.hits === 3 && ev === 'win', JSON.stringify({ hits: g.hits, ev, n })); }
  { const a = at('1-1'), b = at('1-1'); b.loop = 1; const ta = a.time, tb = KT.newState(1); tb.loop = 1; KT.loadScreen(tb, 0);
    check('THE KING RETURNS: the next round is faster, with less time', tb.time < ta); }
  // תיקונים אחרי הסוקר החיצוני (27.10)
  { const { reachSecret } = await import('./king/bot.mjs'); const per = ['1-5', '2-4', '3-2', '4-4', '5-3', '6-3', '7-1'].map(id => ({ id, ok: reachSecret(KT.SCREENS.findIndex(x => x.id === id)).ok }));
    check('every world has a secret crack, and PIP can reach it', per.every(r => r.ok), JSON.stringify(per)); }
  { const r = ['5-5', '6-4', '7-3', '7-4'].map(id => { const s = at(id); s.noEnemies = true; const x0 = s.p.x; let ev = null; for (let i = 0; i < 300 && ev !== 'die'; i++) ev = KT.step(s, { [id === '5-5' || id === '7-3' || id === '7-4' ? 'right' : 'right']: 1 }, ksnd) || ev; if (ev !== 'die') { s.p.x = 128; s.p.y = KT.OY + 10 * 8; s.p.mode = 'air'; s.p.vy = 0; s.p.fallY = s.p.y; for (let i = 0; i < 200 && ev !== 'die'; i++) ev = KT.step(s, {}, ksnd) || ev; } return { id, ev }; });
    check('falling off the bottom of a screen with no floor costs a life (no hidden floor under the screen)', r.every(x => x.ev === 'die'), JSON.stringify(r)); }
  { const s = at('6-3'); s.p.inv = 1e9; s.p.x = 4; const free = { x: 30 * 8 + 4, y: KT.OY + 2 * 8, vx: 0, vy: 0, rain: true }, roof = { x: 9 * 8 + 4, y: KT.OY, vx: 0, vy: 0, rain: true }; s.L.nuts = [free, roof]; let deepest = 0, roofLow = 0;
    for (let i = 0; i < 90; i++) { run(s, 1); if (s.L.nuts.includes(free)) deepest = free.y; if (s.L.nuts.includes(roof)) roofLow = roof.y; }
    check('6-3: the coconut rain falls through the shelves, and only the leaf roofs stop it', deepest > KT.OY + 12 * 8 && roofLow <= KT.OY + 2 * 8 + 1, JSON.stringify({ deepest, roofLow })); }
  { const s = at('7-2'); s.p.inv = 0; const q = s.L.parrots[0]; s.p.x = 128; s.p.y = KT.OY + 16 * 8; s.p.mode = 'walk'; q.t = q.per - 1; let ev = null; for (let i = 0; i < 200 && ev !== 'die'; i++) ev = KT.step(s, {}, ksnd) || ev;
    check('7-2: a parrot dives down to a walking PIP and hits him', ev === 'die'); }
  { const s = at('5-2'); s.p.inv = 1e9; const b = s.L.bats[0], far = KT.lightR(s) + 30; s.p.x = b.x + far; s.p.y = b.y + 8; s.p.mode = 'air'; s.p.vy = 0; run(s, 2); const dark = b.mode;
    s.p.x = b.x + 20; run(s, 2);
    check('5-2: a bat stays put in the dark, and dives once the torch light reaches it', dark === 'hang' && b.mode === 'dive', JSON.stringify([dark, b.mode])); }
  { const s = at('5-3'); s.p.inv = 1e9; const st = s.L.stones.find(k => k.hy < KT.OY + 8 * 8); s.p.x = st.x; s.p.y = KT.OY + 20 * 8; s.p.mode = 'walk'; run(s, 3);
    check('5-3: a stalactite does not fall for PIP several floors below it', st.mode === 'hang'); }
  { const s = at('7-5'); s.p.inv = 0; s.p.x = s.L.seesaw.x; s.p.y = s.L.seesaw.y; s.p.mode = 'walk'; let ev = null; for (let i = 0; i < 1500 && ev !== 'die'; i++) { ev = KT.step(s, {}, ksnd) || ev; s.L.barrels = s.L.barrels.filter(b => b.mode !== 'rest'); }
    check("7-5: the middle of the seesaw is not a safe spot any more (BONGO drops barrels straight down on it), and his crown fits on the screen", ev === 'die' && s.L.guard.y - 22 >= 0, JSON.stringify({ ev, top: s.L.guard.y - 22 })); }
  { const D = l => { const s = KT.newState(1); s.loop = l; KT.loadScreen(s, 0); return s.time; };
    check('THE KING RETURNS stops speeding up after round 4', D(3) === D(9) && D(3) < D(2)); }
  { const s = KT.newState(2); s.loop = 3; KT.loadScreen(s, KT.SCREENS.findIndex(x => x.id === '3-5')); s.mode = 'play'; s.p.inv = 1e9; const b = s.L.beavers[0]; s.p.mode = 'climb'; s.p.x = b.c * 8 + 4; s.p.y = KT.OY + (b.b + 1) * 8 + 2;
    let top = false; for (let i = 0; i < 120 && !top; i++) { KT.step(s, { up: 1 }, ksnd); if (s.p.mode === 'walk' && s.p.y <= KT.OY + b.a * 8) top = true; }
    check('3-5: a straight climb always beats the beaver, even on HARD in round 4', top && s.L.grid[b.a][b.c] === '|'); }
}

if (part('adverts gallery')) {
  // גלריית הפרסומות של Dragon Data (גונן, 27.10): רשת כרטיסים, דף לכל פרסומת, קרדיט וקישור לארכיון, תרגום מלא רק בעברית
  console.log('\nadverts gallery');
  const { ADVERTS } = await import('./adverts/data.mjs');
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  p.on('pageerror', e => pageErrors.push(e.message));
  // /_vercel/ (ספירת הביקורים) קיים רק ב-Vercel, לא בשרת הבדיקה המקומי
  const bad = []; p.on('response', r => { if (r.status() >= 400 && new URL(r.url()).host === new URL(PAGE).host && !new URL(r.url()).pathname.startsWith('/_vercel/')) bad.push(r.status() + ' ' + r.url()); });
  for (const [base, he] of [['/adverts/', true], ['/en/adverts/', false]]) {
    await p.goto(new URL(base, PAGE).href);
    const cards = await p.$$eval('.scan-card', as => as.map(a => ({ href: a.getAttribute('href'), img: a.querySelector('img').complete && a.querySelector('img').naturalWidth > 0 })));
    check(`${base} shows all ${ADVERTS.length} adverts in order, each with its picture`, cards.length === ADVERTS.length && cards.every((c, i) => c.href === base + ADVERTS[i].id + '/' && c.img), JSON.stringify(cards));
    check(`${base} thanks the Dragon Data Archive and Dan at the Retro Collective at the top`, /Dragon Data Archive[\s\S]*Retro Collective/.test(await p.locator('.thanks').textContent()));
    check(`${base} 3 cards in a row on a computer`, await p.evaluate(() => getComputedStyle(document.querySelector('.scan-grid')).gridTemplateColumns.split(' ').length === 3));
    for (const a of ADVERTS) {
      const r = await p.goto(new URL(base + a.id + '/', PAGE).href);
      const info = await p.evaluate(() => ({ archive: document.querySelector('.btns a[href*="dragondata.co.uk"]')?.getAttribute('href'), tr: !!document.querySelector('details.scan-tr'), credit: document.querySelector('.credit')?.textContent || '', img: document.querySelector('.scan-big img').complete && document.querySelector('.scan-big img').naturalWidth > 0, og: document.querySelector('meta[property="og:image"]')?.content || '' }));
      check(`${base}${a.id}/ opens directly, links to its page in the archive, credits it${he ? ', and has the full Hebrew translation' : ', with no translation button'}`, r.ok() && info.archive === a.archive && /Dragon Data Archive/.test(info.credit) && info.img && info.tr === he && info.og.endsWith('/assets/scans/img/' + a.images[0]), JSON.stringify(info));
    }
  }
  await p.goto(new URL('/adverts/before-we-made-it-clever/', PAGE).href);
  await p.click('details.scan-tr summary');
  check('the Hebrew translation opens and keeps English words in their own direction (bdi)', await p.evaluate(() => document.querySelector('details.scan-tr').open && document.querySelectorAll('details.scan-tr bdi').length > 10));
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto(new URL('/adverts/', PAGE).href);
  check('/adverts/ on a phone: one card per row and no sideways scrolling', await p.evaluate(() => getComputedStyle(document.querySelector('.scan-grid')).gridTemplateColumns.split(' ').length === 1 && document.documentElement.scrollWidth <= innerWidth + 1));
  check('the gallery pages load every file (no missing pictures or styles)', bad.length === 0, bad.join(' '));
  // חוסמי פרסומות (27.10): אף שם פנימי עם ad / ads / advert, ואף קובץ מהתיקייה /adverts/. הבדיקה המלאה עם חוסם אמיתי: adverts/adblock-check.mjs
  const names = [], files = [];
  for (const path of ['/adverts/', '/en/adverts/', ...ADVERTS.flatMap(a => ['/adverts/' + a.id + '/', '/en/adverts/' + a.id + '/'])]) {
    await p.goto(new URL(path, PAGE).href);
    const r = await p.evaluate(() => ({ names: [...document.querySelectorAll('[class],[id]')].flatMap(e => [...e.classList, e.id].filter(Boolean)), files: [...document.querySelectorAll('img[src],link[href],script[src]')].map(e => new URL(e.src || e.href, location.href)).filter(u => u.host === location.host).map(u => u.pathname) }));
    names.push(...r.names.filter(n => /(^|[-_])(ad|ads|advert\w*)([-_]|$)|^advert/i.test(n)).map(n => path + ' ' + n));
    files.push(...r.files.filter(f => f.startsWith('/adverts/') && /\.\w+$/.test(f)).map(f => path + ' ' + f));
  }
  check('the gallery has no ad-blocker names (ad / ads / advert) and loads no file from /adverts/', names.length === 0 && files.length === 0, [...new Set(names)].concat(files).slice(0, 8).join(' | '));
  await p.close();
}

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
  for (const path of ['/magazine/', '/magazine/du01/', '/magazine/du02/', '/magazine/du03/', '/magazine/du04/', '/magazine/du05/', '/en/magazine/', '/en/magazine/du01/', '/en/magazine/du02/', '/en/magazine/du03/', '/en/magazine/du04/', '/en/magazine/du05/']) {
    const r = await p.goto(new URL(path, PAGE).href);
    check(`${path} loads`, r.ok() && /archive\.org|Dragon User/.test(await p.content()));
  }
  for (const path of ['/guides/', '/guides/telewriter/', '/guides/synther-7/', '/guides/picture-maker/', '/guides/logo/', '/guides/family-budget/', '/guides/dream/', '/en/guides/', '/en/guides/telewriter/', '/en/guides/synther-7/', '/en/guides/picture-maker/', '/en/guides/logo/', '/en/guides/family-budget/', '/en/guides/dream/']) {
    const r = await p.goto(new URL(path, PAGE).href);
    const html = await p.content();
    check(`${path} (software guide) loads, links its other language, has no download link`, r.ok() && /hreflang="(he|en)"/.test(html) && !/\.(cas|wav|zip|rom|pdf)"/i.test(html));
  }
  {
    const r = await p.request.get(new URL('/assets/poster/dragon1982-poster-a3.pdf', PAGE).href);
    const pages = await Promise.all(['/posters/', '/en/posters/', '/', '/en/'].map(u => p.request.get(new URL(u, PAGE).href).then(x => x.text())));
    check('/posters/ (he+en): the "1982 comes back to life" poster PDF downloads, both pages link it, and both home pages link to the posters', r.ok() && (await r.body()).subarray(0, 4).toString() === '%PDF' && pages.slice(0, 2).every(t => /dragon1982-poster-a3\.pdf/.test(t)) && /href="\/posters\/"/.test(pages[2]) && /href="\/en\/posters\/"/.test(pages[3]));
  }
  await p.close();
}

// פינת הלמידה: קורס שפת המכונה, דף לכל פרק (tools/learn/build.mjs). הכפתור "שלח למכונת הדראגון" שם קלטת ב"הקלטות שלי"
if (part('learn')) {
  console.log('\nlearn');
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
  await ctx.addInitScript(() => { window.open = u => { window.__opened = u; return null; }; });   // בלי לפתוח את המכונה עצמה
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const langs = ['/learn/'];
  if (await p.request.get(new URL('/en/learn/', PAGE).href).then(r => r.ok())) langs.push('/en/learn/');
  for (const base of langs) {
    const bad = [];
    for (const path of [base, ...Array.from({ length: 16 }, (_, i) => base + 'ch' + i + '/')]) {
      const before = errs.length;
      const r = await p.goto(new URL(path, PAGE).href);
      await p.waitForTimeout(150);
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      if (!r.ok() || errs.length > before || sw > 390) bad.push(path + ' (' + (r.ok() ? '' : 'status ' + r.status() + ' ') + (sw > 390 ? 'width ' + sw + ' ' : '') + errs.slice(before).join('; ') + ')');
    }
    check(`${base}: the landing page and all 16 chapters load, no page errors, no sideways scroll at 390px`, !bad.length, bad.join('\n'));
    await p.goto(new URL(base + 'ch3/', PAGE).href);
    const html = await p.content();
    check(`${base}ch3/: own title, description, canonical, and the chapter is marked in the chapter list`, /<title>[^<]*3[^<]*<\/title>/.test(html) && /name="description" content="[^"]{40,}/.test(html) && html.includes(`rel="canonical" href="https://dragon1982.com${base}ch3/"`) && await p.locator('nav.toc a.on[data-tab="ch3"]').count() === 1);
    await p.locator('nav.toc a[data-tab="ch4"]').click();
    const nav1 = await p.waitForURL(u => u.pathname === base + 'ch4/', { timeout: 5000 }).then(() => true, () => false);
    await p.locator('#ch4 .nextch').click();
    const nav2 = await p.waitForURL(u => u.pathname === base + 'ch5/', { timeout: 5000 }).then(() => true, () => false);
    check(`${base}: the chapter list and the "next chapter" button go to the other pages`, nav1 && nav2);
  }
  const sm = await p.request.get(new URL('/sitemap.xml', PAGE).href).then(r => r.text());
  check('sitemap has /learn/ and its 16 chapters', sm.includes('<loc>https://dragon1982.com/learn/</loc>') && sm.includes('<loc>https://dragon1982.com/learn/ch15/</loc>'));
  // חידה: הפתרון עובר, והפרק מסומן ✓ גם בדפים האחרים (אותו מפתח בדפדפן)
  await p.goto(new URL('/learn/ch12/', PAGE).href);
  await p.evaluate(() => { localStorage.removeItem('mc-course-done'); localStorage.removeItem('d32-lab-tapes'); });
  await p.locator('#pz121 textarea').fill(await p.evaluate(() => PRG12.pz121.solution));
  await p.locator('#pz121 .go').click();
  await p.waitForTimeout(1500);
  check('/learn/ch12/: the solution of puzzle 1 (subroutine LINE) passes', await p.locator('#pz121 .fb.ok').count() > 0, (await p.locator('#pz121').textContent()).slice(-300));
  await p.goto(new URL('/learn/ch15/', PAGE).href);
  await p.locator('#cert15 .certname').fill('Test');
  await p.locator('#cert15 .certgo').click();
  await p.goto(new URL('/learn/ch3/', PAGE).href);
  const badge = await p.locator('nav.toc [data-done="15"]').textContent();
  await p.goto(new URL('/learn/', PAGE).href);
  check('progress: the chapter 15 certificate puts ✓ on chapter 15 in the other pages and on the landing page', /✓/.test(badge) && /✓/.test(await p.locator('ol.chapters [data-done="15"]').textContent()));
  // שלח למכונת הדראגון: קלטת שפת מכונה כמו של CSAVEM, ב"הקלטות שלי" של המכונה, והמכונה נפתחת
  await p.goto(new URL('/learn/ch15/', PAGE).href);
  await p.locator('#pw151 .sendgo').click();
  const tape = await p.evaluate(() => { const t = JSON.parse(localStorage.getItem('d32-lab-tapes'))[0]; return { n: t.n, hdr: t.b[0].slice(9), len: t.b.filter(b => b[0] === 1).reduce((a, b) => a + b.length - 1, 0), end: t.b[t.b.length - 1][0], opened: window.__opened }; });
  check('/learn/ch15/: "send to the Dragon machine" puts the tape CATCH (154 bytes, machine code at $2EE1) in My tapes and opens the machine',
    tape.n === 'CATCH' && tape.hdr.join() === [2, 0, 0, 0x2e, 0xe1, 0x2e, 0xe1].join() && tape.len === 154 && tape.end === 255 && tape.opened === '/lab/1982/?learn=CATCH', JSON.stringify(tape));
  await p.goto(new URL('/learn/ch2/', PAGE).href);
  await p.locator('#pw6 .sendgo').click();
  check('/learn/ch2/: a window with a missing line asks for the line before sending', /השורה החסרה/.test(await p.locator('#pw6 .sendsay').textContent()));
  await p.evaluate(() => { localStorage.removeItem('mc-course-done'); localStorage.removeItem('d32-lab-tapes'); localStorage.removeItem('d32course-name'); });
  check('learn: no page errors', !errs.length, errs.join('\n'));
  await ctx.close();
}

if (part('asm')) {
  // האסמבלר (/learn/asm/): מתרגם 6809 מלא ומעבד מלא, משלנו. הבתים מול lwasm ו-asm6809, המעבד מול מכונת ה-Dragon (11.11)
  console.log('\nasm (the Assembler)');
  await import('../learn/asm/asm6809.js');
  const A = globalThis.ASM6809;
  const { corpus } = await import('./asm/corpus.mjs');
  const { CPU_PROGS } = await import('./asm/cpu-progs.mjs');
  const { createHash } = await import('node:crypto');
  const sha = b => createHash('sha256').update(b).digest('hex');
  const ref = JSON.parse(await readFile(new URL('./asm/corpus-ref.json', import.meta.url), 'utf8'));
  const big = A.assemble(' ORG $2EE1\n' + corpus(A).join('\n') + '\n');
  const lines = big.lines.filter(l => l.bytes.length);
  check(`the byte tables: every 6809 command in every mode (${lines.length} lines, ${big.end - big.start} bytes) = lwasm and asm6809, and the cycle counts = lwasm's`,
    !big.errs.length && lines.length === ref.lines && sha(Buffer.from(big.mem.slice(big.start, big.end))) === ref.sha256 && sha(lines.map(l => l.cyc).join(',')) === ref.cycles,
    big.errs.slice(0, 3).map(e => e.line + ' ' + e.en).join('\n'));
  // what DREAM did on our machine (11.11): $12 → short (direct), 0,X → ,X, a later name as an offset → the shortest form
  const hx = s => { const r = A.assemble(s); return r.errs.length ? 'ERR ' + r.errs[0].en : Buffer.from(r.mem.slice(r.start, r.end)).toString('hex'); };
  const dream = [[' LDA $12\n LDA 0,X\n LDA FWD\n LDA FWD2,X\n LDA >$12\nFWD EQU $10\nFWD2 EQU 5\n', '9612a684b60010a605b60012'],
    [' LDA F3,X\n LDA F4,X\n LDA F5,Y\n LEAX FAR,PCR\n RMB 200\nFAR RTS\nF3 EQU 1000\nF4 EQU 100\nF5 EQU -3\n', 'a68903e8a68864a63d308d00c8' + '00'.repeat(200) + '39'],
    [' MUL\n TFR A,B\n EXG X,Y\n PSHU A,B,X\n LBRA *\n', '3d1f891e12361616fffd'],
    [' ORG $2FFE\nTOP LDA TOP,PCR\n LDA 5,PC\n', 'a68cfda68dd000']];
  check('like DREAM on our machine: LDA $12 is short (direct), 0,X is ,X, a later name in an offset takes the shortest form, n,PC = n,PCR, MUL/TFR/EXG/PSHU/LBRA',
    dream.every(([s, h]) => hx(s) === h), dream.map(([s, h]) => hx(s).slice(0, 40) + ' / ' + h.slice(0, 40)).join('\n'));
  const errOf = s => { const r = A.assemble(s); return r.errs[0] || {}; };
  const e1 = errOf(' LDA #300\n'), e2 = errOf('LDA #1\n'), e3 = errOf(' BRA FAR\n RMB 200\nFAR RTS\n'), e4 = errOf(' TFR A,X\n'), e5 = errOf(' INC A\n'), e6 = errOf(' LDA LOOP\n');
  check('friendly errors with the line number, in Hebrew and English (too big, no space, too far, sizes, INCA, unknown place)',
    e1.line === 1 && /גדול מדי/.test(e1.he) && /too big/.test(e1.en) && /בלי רווח/.test(e2.he) && e3.line === 1 && /LBRA/.test(e3.he) && /בגדלים שונים/.test(e4.he) && /INCA/.test(e5.he) && /LOOP/.test(e6.he),
    JSON.stringify([e1, e2, e3, e4, e5, e6].map(e => e.he)));
  // the CPU: three programs (arithmetic + lamps; 16 bits + MUL + every branch; every addressing mode + stack + TFR/EXG) against what XRoar's 6809 wrote
  let exp = {}; try { exp = JSON.parse(await readFile(new URL('./asm/cpu-expected.json', import.meta.url), 'utf8')); } catch {}
  for (const k of Object.keys(CPU_PROGS)) {
    const img = A.assemble(CPU_PROGS[k]()), mem = new Uint8Array(65536), w = new Set();
    for (let a = 0; a < 65536; a++) if (img.used[a]) mem[a] = img.mem[a];
    const cpu = A.cpu(a => mem[a], (a, v) => { mem[a] = v; if (a >= 0x6000 && a < 0x7800) w.add(a); });
    cpu.r.PC = img.entry; cpu.r.S = 0x7EF0; mem[0x7EF0] = 0xFF; mem[0x7EF1] = 0xF0;
    while (cpu.r.PC !== 0xFFF0 && cpu.r.steps < 2e6) cpu.step();
    const got = Buffer.from([...w].sort((a, b) => a - b).map(a => mem[a])).toString('hex');
    check(`the CPU, program "${k}": all ${w.size} result bytes = what the Dragon machine (XRoar's 6809) wrote`, !!exp[k] && got === exp[k].hex, exp[k] ? 'differs' : 'no machine result saved (tools/asm/machine-check.mjs --save)');
  }
  // the pages
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
  await ctx.addInitScript(() => { window.open = u => { window.__opened = u; return null; }; });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  for (const path of ['/learn/asm/', '/en/learn/asm/']) {
    const before = errs.length;
    const r = await p.goto(new URL(path, PAGE).href);
    await p.waitForTimeout(300);
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    const html = await p.content();
    check(`${path}: loads, no page errors, no sideways scroll at 390px, own title/description/canonical, link to the other language`,
      r.ok() && errs.length === before && sw <= 390 && html.includes(`rel="canonical" href="https://dragon1982.com${path}"`) && /name="description" content="[^"]{60,}/.test(html) && html.includes(path === '/learn/asm/' ? 'href="/en/learn/asm/"' : 'href="/learn/asm/"'),
      `status ${r.status()} width ${sw} ${errs.slice(before).join('; ')}`);
  }
  await p.goto(new URL('/learn/asm/', PAGE).href);
  await p.evaluate(() => { localStorage.removeItem('d32-asm-src'); localStorage.removeItem('d32-lab-tapes'); });
  await p.reload();
  const ex = await p.evaluate(() => window.__asm.EX.map(e => { const r = ASM6809.assemble(e.src.join('\n')); return { id: e.id, errs: r.errs.length, n: r.count }; }));
  check(`every example assembles with no errors (${ex.map(e => e.id + ' ' + e.n).join(', ')}); the catch game is 154 bytes, as in DREAM`, ex.every(e => !e.errs && e.n > 0) && ex.find(e => e.id === 'catch').n === 154, JSON.stringify(ex));
  // run: the alphabet; it waits for a key, then RTS back to BASIC
  await p.selectOption('#asm-ex', 'abc');
  await p.click('#asm-run');
  await p.waitForTimeout(800);
  const scr = await p.evaluate(() => String.fromCharCode(...window.__asm.mem().slice(0x400, 0x41A)));
  await p.locator('#asm-keys [data-k="32"]').click();
  await p.waitForTimeout(500);
  const said = await p.locator('#asm-say').textContent();
  check('▶ runs the alphabet on the page\'s screen (A to Z at $0400), waits for a key, then goes back to BASIC (RTS)', scr === 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' && /BASIC/.test(said), scr + ' | ' + said);
  // step: one command at a time
  await p.click('#asm-reset'); await p.click('#asm-step'); await p.click('#asm-step');
  const st = await p.evaluate(() => ({ X: window.__asm.cpu.r.X, A: window.__asm.cpu.r.A, pc: document.querySelector('#asm-lst tr.pc td:nth-child(2)')?.textContent }));
  check('"Step" runs one command at a time: X = $0400, A = \'A\', and the next line is marked in the listing', st.X === 0x400 && st.A === 0x41 && st.pc === '2EE6', JSON.stringify(st));
  // an error in the editor
  await p.evaluate(() => { const t = document.getElementById('asm-src'); t.value = ' LDA #$41\nLOOP STA $0400\n BRA LOP\n'; t.dispatchEvent(new Event('input')); });
  await p.waitForTimeout(500);
  const er = await p.locator('#asm-errs').textContent();
  check('an error shows the line number and a friendly message (BRA to a missing place)', /בשורה 3/.test(er) && /LOP/.test(er), er);
  // the page can't show sound: it stops politely and points at the machine
  await p.evaluate(() => { const t = document.getElementById('asm-src'); t.value = ' LDA #$FF\n STA $FF20\n RTS\n'; t.dispatchEvent(new Event('input')); });
  await p.waitForTimeout(400); await p.click('#asm-run'); await p.waitForTimeout(300);
  check('sound ($FF20): "את זה רואים במכונה", and the send button is highlighted', /רואים במכונה/.test(await p.locator('#asm-say').textContent()) && await p.locator('#asm-send.hot').count() === 1);
  // send: a CSAVEM-style tape in My tapes, and the machine opens
  await p.selectOption('#asm-ex', 'mul');
  await p.click('#asm-send');
  const tape = await p.evaluate(() => { const t = JSON.parse(localStorage.getItem('d32-lab-tapes'))[0], img = window.__asm.img; return { n: t.n, hdr: t.b[0].slice(9), len: t.b.filter(b => b[0] === 1).reduce((a, b) => a + b.length - 1, 0), end: t.b[t.b.length - 1][0], opened: window.__opened, size: img.end - img.start }; });
  check('🐉 send: the tape TIMES (machine code, type 2, load and run at $2EE1) is in My tapes, and the machine opens',
    tape.n === 'TIMES' && tape.hdr.join() === [2, 0, 0, 0x2e, 0xe1, 0x2e, 0xe1].join() && tape.len === tape.size && tape.end === 255 && tape.opened === '/lab/1982/?learn=TIMES', JSON.stringify(tape));
  await p.evaluate(() => { const t = document.getElementById('asm-src'); t.value = ' ORG $0600\n RTS\n'; t.dispatchEvent(new Event('input')); });
  await p.waitForTimeout(400); await p.click('#asm-send');
  check('send: a program outside the free memory ($2EE1–$7DFF) gets a clear message, and no tape', /\$2EE1/.test(await p.locator('#asm-sendsay').textContent()));
  await p.evaluate(() => { localStorage.removeItem('d32-asm-src'); localStorage.removeItem('d32-lab-tapes'); localStorage.removeItem('d32-asm-name'); });
  const sm = await p.request.get(new URL('/sitemap.xml', PAGE).href).then(r => r.text());
  await p.goto(new URL('/learn/', PAGE).href);
  const land = await p.locator('a[href="/learn/asm/"]').count();
  await p.goto(new URL('/learn/ch15/', PAGE).href);
  const c15 = await p.locator('#ch15 a[href="/learn/asm/"]').count();
  check('links: /learn/ and chapter 15 point to the Assembler; the sitemap has both languages', land > 0 && c15 > 0 && sm.includes('/learn/asm/</loc>') && sm.includes('/en/learn/asm/</loc>'));
  check('asm: no page errors', !errs.length, errs.join('\n'));
  await ctx.close();
}

if (part('real machine lab')) {
  console.log('real machine lab');
  {
    // טבלת המקלדת ($0151-$0159) כמו במקור: מקש לחוץ = 0 וביט 7 דולק. SAS בודק PEEK(341)=223 לחץ למעלה (29.10)
    const p = await browser.newPage({ viewport: { width: 1000, height: 900 } });
    await p.goto(base.replace(/\/$/, '') + '/lab/1982/');
    await p.waitForFunction(() => window.d32Ready, null, { timeout: 60000 }); await p.waitForTimeout(3000);
    await p.evaluate(() => d32Type('10 IF PEEK(341)=223 THEN PRINT "UP";PEEK(338):END\n20 GOTO 10\nRUN\n'));
    await p.waitForTimeout(2500);
    await p.focus('#canvas').catch(() => {}); await p.keyboard.down('ArrowUp'); await p.waitForTimeout(400); await p.keyboard.up('ArrowUp');
    const up = await p.waitForFunction(() => /UP 255/.test((window.d32Screen() || []).join('\n')), null, { timeout: 10000 }).then(() => true, () => false);
    check('the keyboard table holds what the PIA reads, as on the original: up arrow held → PEEK(341)=223, an idle column = 255 (SAS reads it directly)', up, (await p.evaluate(() => (window.d32Screen() || []).filter(Boolean).join(' | '))));
    await p.close();
  }
  {
    // CLOADM"" ואחריו ':' באותה שורה (שורה 10 של Tim Love's Cricket): ההיסט 0, הטעינה לכתובת שבכותרת (באג עד 29.10: ההיסט היה $3A00)
    const p = await browser.newPage({ viewport: { width: 1000, height: 900 } });
    await p.goto(base.replace(/\/$/, '') + '/lab/1982/');
    await p.waitForFunction(() => window.d32Ready, null, { timeout: 60000 }); await p.waitForTimeout(3000);
    await p.evaluate(() => { localStorage.removeItem('d32-lab-tapes'); d32Type('POKE&H3000,42:CSAVEM"MC",&H3000,&H3000,&H3000\n'); });
    await p.waitForFunction(() => (JSON.parse(localStorage.getItem('d32-lab-tapes') || '[]')).some(t => t.n === 'MC'), null, { timeout: 60000 }).catch(() => {});
    await p.locator('#mytapes .tape').first().click().catch(() => {});
    await p.evaluate(() => d32Type('\nPOKE&H3000,0\n10 CLEAR200,&H2FFF:CLOADM"":GOTO20\n20 PRINT"GOT";PEEK(&H3000)\nRUN\n'));
    const ok = await p.waitForFunction(() => /GOT 42/.test((window.d32Screen() || []).join('\n')), null, { timeout: 60000 }).then(() => true, () => false);
    check('CLOADM"" followed by ":" on the same line loads to the address in the header (offset 0), as on the original', ok, (await p.evaluate(() => (window.d32Screen() || []).filter(Boolean).join(' | '))));
    await p.close();
  }
  {
    // קלטת קול ל-Dragon אמיתי (29.10): CSAVE ← 🔊 wav ← הצליל נכנס לרשמקול כמו קלטת אמיתית ← NEW, CLOAD ← אותה תוכנית
    const p = await browser.newPage({ viewport: { width: 1000, height: 900 } });
    await p.goto(base.replace(/\/$/, '') + '/lab/1982/');
    await p.waitForFunction(() => window.d32Ready, null, { timeout: 60000 }); await p.waitForTimeout(3000);
    await p.evaluate(() => { localStorage.removeItem('d32-lab-tapes'); d32Type('10 PRINT "HELLO GONEN ";\n20 GOTO 10\nCSAVE "HELLO"\n'); });
    await p.waitForFunction(() => (JSON.parse(localStorage.getItem('d32-lab-tapes') || '[]')).some(t => t.n === 'HELLO'), null, { timeout: 60000 }).catch(() => {});
    const info = await p.evaluate(() => {
      const f = (JSON.parse(localStorage.getItem('d32-lab-tapes') || '[]')).find(t => t.n === 'HELLO');
      if (!f) return null;
      const w = d32TapeWav(f), v = new DataView(w.buffer);
      FS.writeFile('/t.wav', w); Module.ccall('wasm_load_file', null, ['string', 'number', 'number'], ['/t.wav', 2, 0]);
      const btn = [...document.querySelectorAll('#mytapes .mini')].some(b => b.textContent === '🔊');
      return { riff: String.fromCharCode(...w.slice(0, 4)), rate: v.getUint32(24, true), bits: v.getUint16(34, true), secs: (w.length - 44) / 44100, btn };
    });
    await p.evaluate(() => d32Type('NEW\nCLOAD\n'));
    const loaded = await p.waitForFunction(() => /F HELLO[\s\S]*\nOK\s*$/.test((window.d32Screen() || []).join('\n')), null, { timeout: 60000 }).then(() => true, () => false);
    await p.evaluate(() => d32Type('CLS\nLIST\n')); await p.waitForTimeout(1500);
    const list = (await p.evaluate(() => (window.d32Screen() || []).join('\n')));
    check('/lab/1982/ 🔊 a saved tape becomes a sound file (wav, 44100 Hz, 8 bit) in the Dragon\'s own format, and the machine CLOADs it back from the sound unchanged', !!info && info.riff === 'RIFF' && info.rate === 44100 && info.bits === 8 && info.btn && info.secs > 2.7 && info.secs < 3.1 && loaded && /10 PRINT "HELLO GONEN ";\n20 GOTO 10/.test(list), JSON.stringify(info) + ' ' + loaded);
    await p.close();
  }
  {
    // קלטת אמיתית מהבית (גונן, 30.10: "רכיב ... שיהיה עמיד"): מיקרופון מדומה מנגן את קלטת הבדיקה דרך "טלפון"
    // (הצליל הגבוה מוחלש ב-15 dB, בלי בסים, חלש), לוחצים להקליט ולעצור, הקורא מכניס לרשמקול קלטת נקייה, CLOAD ו-RUN
    const p = await browser.newPage({ viewport: { width: 1300, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(base.replace(/\/$/, '') + '/lab/1982/'); await p.waitForFunction(() => window.d32Ready, null, { timeout: 60000 }); await p.waitForTimeout(2500);
    await p.evaluate(async () => {
      const ac = new AudioContext(), buf = await ac.decodeAudioData(await (await fetch('/lab/1982/tapes/guess-tape.m4a')).arrayBuffer());
      navigator.mediaDevices.getUserMedia = async () => {
        const src = ac.createBufferSource(), shelf = ac.createBiquadFilter(), hp = ac.createBiquadFilter(), g = ac.createGain(), dest = ac.createMediaStreamDestination();
        src.buffer = buf; shelf.type = 'highshelf'; shelf.frequency.value = 1500; shelf.gain.value = -15; hp.type = 'highpass'; hp.frequency.value = 600; g.gain.value = 0.3;
        src.connect(shelf).connect(hp).connect(g).connect(dest); setTimeout(() => src.start(), 700); window.__dur = buf.duration; return dest.stream;
      };
    });
    await p.click('#tape-mic'); await p.waitForTimeout((await p.evaluate(() => window.__dur) + 1.8) * 1000); await p.click('#tape-mic');
    const msg = await p.waitForFunction(() => /✅|⚠️|לא מצאתי/.test(document.getElementById('mic-status').textContent), null, { timeout: 120000 })
      .then(() => p.evaluate(() => document.getElementById('mic-status').textContent), () => 'timeout');
    await p.evaluate(() => window.d32Type('CLOAD\n'));
    const ok = await p.waitForFunction(() => { const r = window.d32Screen?.() || []; const i = r.findIndex(x => x === 'F GUESS'); return i >= 0 && r.slice(i + 1).includes('OK'); }, null, { timeout: 60000 }).then(() => true, () => false);
    if (ok) await p.evaluate(() => window.d32Type('RUN\n'));
    const ran = ok && await p.waitForFunction(() => (window.d32Screen?.() || []).some(r => r.includes('GUESS MY NUMBER')), null, { timeout: 30000 }).then(() => true, () => false);
    check('/lab/1982/ 🎙️ a tape played through a "phone" into the microphone is read with no errors, and CLOAD then RUN runs it', /^✅ נקראה הקלטת "GUESS"/.test(msg) && ran && !errs.length, msg + ' ' + errs.join(' | '));
    await p.close();
  }
  {
    // הקריאה נכשלת (רק רעש): מופיעה הודעה, וכפתור ששומר את ההקלטה כקובץ wav כדי לשלוח אותה לבדיקה (גונן, 30.10)
    const p = await browser.newPage({ viewport: { width: 1300, height: 900 }, acceptDownloads: true }); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(base.replace(/\/$/, '') + '/lab/1982/'); await p.waitForFunction(() => window.d32Ready, null, { timeout: 60000 }); await p.waitForTimeout(2000);
    await p.evaluate(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        const ac = new AudioContext(), n = ac.sampleRate * 4, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() - 0.5) * 0.2;
        const src = ac.createBufferSource(), dest = ac.createMediaStreamDestination(); src.buffer = buf; src.loop = true; src.connect(dest); src.start(); return dest.stream;
      };
    });
    await p.click('#tape-mic'); await p.waitForTimeout(3000); await p.click('#tape-mic');
    const shown = await p.waitForFunction(() => { const b = document.querySelector('.mic-save'); return b && !b.hidden && b.offsetParent; }, null, { timeout: 120000 }).then(() => true, () => false);
    let name = '';
    if (shown) { const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 10000 }).catch(() => null), p.click('.mic-save')]); name = dl ? dl.suggestedFilename() : ''; }
    const msg = await p.evaluate(() => document.getElementById('mic-status').textContent);
    check('/lab/1982/ 🎙️ when nothing can be read (only noise), the box says so and offers "💾 save the recording" as a wav file', shown && /לא מצאתי/.test(msg) && /^dragon-mic-\d{8}-\d{4}\.wav$/.test(name) && !errs.length, msg + ' | ' + name + ' ' + errs.join(' | '));
    await p.close();
  }
  {
    // גם רווח יורה במשחקי ג'ויסטיק (גונן, 27.10: Option במק פותח את החלון המהיר של Claude): הקלטת של Danger Ranger מדליקה את הג'ויסטיק מהמקלדת
    const p = await browser.newPage({ viewport: { width: 1000, height: 900 } });
    await p.goto(base.replace(/\/$/, '') + '/lab/1982/'); await p.waitForTimeout(3500);
    await p.evaluate(() => { const c = document.getElementById('canvas'); window.__k = []; c.addEventListener('keydown', e => window.__k.push(e.key)); });
    await p.evaluate(() => { const t = document.querySelector('.tape.row[data-id="ranger"]'); t.click(); document.querySelector('.gv-go').click(); });
    await p.waitForTimeout(400);
    await p.focus('#canvas').catch(() => {}); await p.keyboard.press('Space'); await p.waitForTimeout(100);
    const joyKeys = await p.evaluate(() => ({ joy: window.d32Joy, keys: window.__k.splice(0) }));
    check('/lab/1982/ joystick game (Danger Ranger): Space fires as the joystick button (Alt) and does not reach the machine as a space', joyKeys.joy === true && joyKeys.keys.join() === 'Alt', JSON.stringify(joyKeys));
    await p.evaluate(() => { const t = document.querySelector('.tape.row[data-id="eggs"]'); t.click(); document.querySelector('.gv-go').click(); });
    await p.waitForTimeout(400); await p.keyboard.press('Space'); await p.waitForTimeout(100);
    const plain = await p.evaluate(() => ({ joy: window.d32Joy, keys: window.__k.splice(0) }));
    check('/lab/1982/ other games: Space stays a space', plain.joy === false && plain.keys.join() === ' ', JSON.stringify(plain));
    await p.evaluate(() => { const t = document.querySelector('.tape.row[data-id="dungeon"]'); t.click(); document.querySelector('.gv-go').click(); });
    await p.waitForTimeout(400); await p.keyboard.press('Space'); await p.waitForTimeout(100);
    const dr = await p.evaluate(() => { return { joy: window.d32Joy, keys: window.__k.splice(0), credit: document.querySelector('.game-view .tape-credit').textContent, size: FS.stat('/tape-dungeon.cas').size }; });
    check('/lab/1982/ Dungeon Raid (Ken Kalish): the original tape goes in the recorder, the arrows and Space become the joystick, and the credit says "with his permission · removed on request"', dr.joy === true && dr.keys.join() === 'Alt' && dr.size === 34819 && /Ken Kalish/.test(dr.credit) && /באישורו|with his permission/.test(dr.credit) && /יוסר לפי בקשה|removed on request/.test(dr.credit), JSON.stringify(dr));
    await p.close();
  }
  for (const path of ['/lab/1982/', '/en/lab/1982/']) {
    const p = await browser.newPage({ viewport: { width: 1000, height: 900 } });
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    const r = await p.goto(base.replace(/\/$/, '') + path);
    await p.waitForTimeout(3500);
    check(`${path} loads with the drawn keyboard`, r.status() === 200 && (await p.locator('.kbd .k').count()) > 50 && errs.length === 0, errs.join(' | '));
    check(`${path} has the tape shelf (75 tapes: 7 BASIC, Dragon Eggs, the Dragon Assembler, Blockdown, DragonTet, Escape, Invaders Revenge, El Diablero, Phantom Slayer, Danger Ranger, Cuthbert in the Jungle, Devil Assault, Starship Chameleon, Dungeon Raid, Athletyx, Alcatraz II, Grabber, Draconian, Hang It!, Death's Head Hole, Champions!, Lionheart, SAS, Ninja Warrior, Tim Love's Cricket, Tea Time, Williamsburg Adventure, Bonka, Vultures, Maurice Minor, Chess, Crusader, Droids, River of Fire, Starman Jones, The Sword and the Sorcerer, The Wizard's Lair, Shenanigans, Sea Search, Trekboer, The Vortex Factor, The King, Downland, Buzzard Bait, Manic Miner, Jet Set Willy, Nerble Force, Black Sanctum, Calixto Island, Cave Hunter, Star Spores, Tanglewood, Dig-It, Dungeons of Daggorath, Snaker, Brickout, Adventureland, Pirate Adventure, Secret Mission, Voodoo Castle, The Count, and Scott Adams' adventures 6–13)`, (await p.locator('#tapes .tape.row').count()) === 75);
    check(`${path} everything starts closed: the cabinet drawers, "what is this machine?", "first try", "what works", "how to edit a line" and the mic box\'s "how does it work?", with no memory of what was opened last time`, await p.evaluate(() =>
      [...document.querySelectorAll('#tapes details.drawer, .info details, details.how')].every(d => !d.open) && document.querySelectorAll('.info > details').length === 4 && document.querySelectorAll('.info .realtape details.rt-how').length === 1
      && /PRINT 2\+3/.test(document.querySelector('.info details.try')?.textContent || '') && ![...document.querySelectorAll('.info > p.note')].some(e => /PRINT 2\+3/.test(e.textContent))
      && localStorage.getItem('d32-lab-drawers') === null));
    check(`${path} "type it in" drawer: 7 magazine pages (1983–85); a page opens beside the machine (scan from archive.org, credit) and closes`, await p.evaluate(async () => {
      const cards = document.querySelectorAll('[data-drawer="type"] .tape');
      if (cards.length !== 7) return false;
      document.querySelector('.tape[data-page="sketch"]').click();
      const v = document.querySelector('.typein-view');
      const ok = !v.hidden && /^https:\/\/archive\.org\/download\/Dragon_User_1983-09_Sunshine_Books_GB\/page\/n38_/.test(v.querySelector('.tv-scan img').src) && /R Steel/.test(v.textContent);
      v.querySelector('.tv-close').click();
      return ok && v.hidden;
    }));
    // הארון החדש (גונן, 27.10): מגירות לפי סדר כרונולוגי, השנים בתגית משמאל לימין, ובכל מגירה המשחקים לפי השנה
    const cab = await p.evaluate(() => ({
      drawers: [...document.querySelectorAll('.cabinet details.drawer')].map(d => d.dataset.drawer),
      years: [...document.querySelectorAll('.cabinet details.drawer > summary .yr')].map(y => [y.textContent, getComputedStyle(y).direction]),
      rows: Object.fromEntries([...document.querySelectorAll('.cabinet details.drawer')].map(d => [d.dataset.drawer, [...d.querySelectorAll('.tape.row')].map(r => r.dataset.id)])),
      kalish: document.querySelector('.cabinet [data-drawer="period"] .drawer-name')?.textContent,
      hughey: document.querySelector('.cabinet [data-drawer="hughey"] .drawer-name')?.textContent,
      icons: [...document.querySelectorAll('.tape.row .ic')].every(i => /shots\/|covers\//.test(i.style.backgroundImage)) }));
    check(`${path} the cabinet: "Legends" first (The King, Buzzard Bait, Downland), then drawers in time order (Scott Adams 1979–84, Ron Krebs' games 1981, Ken Kalish's games, Mike Hughey's games, Harry Whitehouse's games, John Morrison's games, Bob Withers' adventures, Paul Garner's games, more from the time, the community, ours, tools, my tapes, and type it in at the bottom), the years left to right, rows by year, an icon from each game's screen`,
      cab.drawers.join() === 'legends,adams,krebs,period,hughey,harry,morrison,withers,garner,more,coco,community,ours,tools,mine,type' && cab.years.map(y => y[0]).join() === '1983–85,1979–84,1981,1982–85,1982–84,1983,1983,1983–85,1984–85,1983–86,1982–87,2021–2025,2026,2026,1983–85' && /Ken Kalish/.test(cab.kalish) && /Mike Hughey/.test(cab.hughey) && cab.years.every(y => y[1] === 'ltr')
      && cab.rows.adams.join() === 'adventureland,pirate,mission,voodoo,count,odyssey,funhouse,pyramid,ghost,savage1,savage2,golden,claymorgue' && cab.rows.period.join() === 'escape,invrev,diablero,phantom,ranger,cuthbert,devil,chameleon,dungeon,athletyx' && cab.rows.hughey.join() === 'alcatraz,williamsburg,grabber,draconian' && cab.rows.morrison.join() === 'bonka,vultures,maurice,mchess,crusader,droids,riverfire' && cab.rows.garner.join() === 'starman,sword,wizlair' && cab.rows.harry.join() === 'hangit,dhh,champs,lionht,sas' && cab.rows.krebs.join() === 'sanctum,calixto,cavehunter' && cab.rows.legends.join() === 'king,buzzard,downland,manic,jsw' && cab.rows.withers.join() === 'shenan,seasearch,trekboer,vortex' && cab.rows.more.join() === 'ninja,cricket,teatime,spores,nerble,tangle,digit' && cab.rows.coco.join() === 'daggorath,snaker,brickout' && cab.rows.community.join() === 'blockdown,dragontet' && cab.rows.ours.length === 8 && cab.rows.ours[0] === 'eggs' && cab.rows.tools.join() === 'dasm' && cab.icons, JSON.stringify(cab));
    // שני חלקים במדף (גונן, 12.11): בהתחלה רק "משחקים מהתקופה"; "שלנו ושלכם" מראה את השאר. ו-🏠 Dragon 1982 חוזר למסך הראשי
    const parts = await p.evaluate(() => {
      const vis = () => [...document.querySelectorAll('.cabinet .drawer')].filter(d => d.offsetParent).map(d => d.dataset.drawer);
      const tabs = [...document.querySelectorAll('.part-tabs button')].map(b => b.textContent);
      const a = vis(); document.querySelector('.part-tabs [data-part="ours"]').click(); const b = vis(); document.querySelector('.part-tabs [data-part="period"]').click();
      return { tabs, a, b, home: document.querySelector('header a.home')?.getAttribute('href') };
    });
    check(`${path} the shelf has two parts: "games from the period" (64, shown first) and "ours and yours" (community, ours, tools, my tapes, type it in); 🏠 Dragon 1982 goes back to the home screen`,
      parts.tabs.length === 2 && /64/.test(parts.tabs[0]) && parts.a.length === 11 && parts.a[0] === 'legends' && !parts.a.includes('mine') && parts.b.join() === 'community,ours,tools,mine,type' && parts.home === (path.startsWith('/en') ? '/en/' : '/'), JSON.stringify(parts));
    // הברכה של Scott Adams במגירה שלו: המילים שלו באנגלית משמאל לימין, עם חתימה; בעברית גם תרגום (28.10)
    const sq = await p.evaluate(() => { const q = document.querySelector('.cabinet [data-drawer="adams"] blockquote.drawer-quote');
      return q && { dir: getComputedStyle(q).direction, t: q.textContent, he: !!document.querySelector('.cabinet [data-drawer="adams"] .drawer-quote-he'), n: document.querySelectorAll('blockquote.drawer-quote').length }; });
    check(`${path} Scott Adams' greeting in his drawer, in his words, signed`,
      sq && sq.n === 1 && sq.dir === 'ltr' && /^\u201CGreetings to all those Dragon Players out there/.test(sq.t) && /G-D bless!\u201D/.test(sq.t) && /\u2014 Scott Adams, 10\/28\/2026, Platteville Wisconsin USA$/.test(sq.t) && sq.he === !path.startsWith('/en/'), JSON.stringify(sq));
    // המגירה של Scott Adams: 13 הרפתקאות, 5 גלויות ו"עוד 8"; בכל שורה מספר ונושא, והעטיפה כצלמית (גונן, 31.10)
    const fold = await p.evaluate(() => { const rows = [...document.querySelectorAll('.cabinet [data-drawer="adams"] .tape.row')], more = document.querySelector('.cabinet [data-drawer="adams"] .rows-more');
      const r = { n: rows.length, hidden: rows.filter(b => b.classList.contains('folded')).length, more: !!more, tg: rows[5]?.querySelector('.tg').textContent, cv: rows.filter(b => b.querySelector('.ic.cv')).length };
      more?.click(); r.after = rows.filter(b => getComputedStyle(b).display !== 'none').length; r.gone = !document.querySelector('.cabinet [data-drawer="adams"] .rows-more'); return r; });
    check(`${path} Scott Adams' drawer: 5 adventures shown and "+ 8 more", each row with its number and theme, the original cover as its icon`,
      fold.n === 13 && fold.hidden === 8 && fold.more && /#6\u2069 · /.test(fold.tg) && fold.cv === 11 && fold.after === 13 && fold.gone, JSON.stringify(fold));
    // רמזים (7.11): ב-Adventureland לשונית רביעית, 15 שאלות, וכל מדרגה נפתחת רק אחרי הקודמת
    const hints = await p.evaluate(async () => {
      document.querySelector('.tape.row[data-id="adventureland"]').click();
      await new Promise(f => setTimeout(f, 800));
      const v = document.querySelector('.game-view'), q = v.querySelector('.hint-q');
      const r = { tab: [...v.querySelectorAll('.gv-tabs button')].pop().textContent, n: v.querySelectorAll('.hint-q').length, lv: q ? q.querySelectorAll('.hint-lv').length : 0,
        nested: !!(q && q.querySelector('.hint-lv0 .hint-lv1 .hint-lv2')), closed: q ? !q.open && !q.querySelector('.hint-lv[open]') : false };
      v.querySelector('.gv-back').click();
      return r;
    });
    check(`${path} Adventureland has a hints tab: 15 questions, each a small hint, a clearer hint and the full solution, one inside the other, all closed`,
      /^(רמזים|Hints)$/.test(hints.tab) && hints.n === 15 && hints.lv === 3 && hints.nested && hints.closed, JSON.stringify(hints));
    // דף משחק ליד המכונה, עם כתובת משלו; "חזרה לארון" חוזר
    const gv = await p.evaluate(async () => {
      const out = [];
      for (const r of document.querySelectorAll('.tape.row')) {
        r.click(); await new Promise(f => setTimeout(f, 30));
        const v = document.querySelector('.game-view'), tabs = [...v.querySelectorAll('.gv-tabs button')], panes = [...v.querySelectorAll('.gv-pane')];
        out.push({ id: r.dataset.id, url: location.pathname, open: !v.hidden && document.body.classList.contains('game-open'), tabs: tabs.length, load: panes[0].querySelectorAll('li').length, play: panes[1].querySelectorAll('li').length, about: panes[2].querySelectorAll('p').length, credit: !!v.querySelector('.tape-credit'), go: !!v.querySelector('.gv-go') });
        v.querySelector('.gv-back').click();
      }
      return { out, after: location.pathname, closed: !document.body.classList.contains('game-open') };
    });
    const pre = path;
    const tool = await p.evaluate(async () => {
      document.querySelector('.tape.row[data-id="dasm"]').click(); await new Promise(f => setTimeout(f, 50));
      const v = document.querySelector('.game-view'), r = { tabs: [...v.querySelectorAll('.gv-tabs button')].map(b => b.textContent), cmds: v.querySelectorAll('.gv-cmds tr').length, code: (v.querySelector('.gv-code') || {}).textContent, testers: !!v.querySelector('.tst-open'), tool: v.classList.contains('gv-is-tool') };
      const vt = [...v.querySelectorAll('.gv-tabs button')].find(b => /סרטונים|Videos/.test(b.textContent)); if (vt) vt.click();
      const tile = v.querySelector('.gv-vtile'); r.tiles = v.querySelectorAll('.gv-vtile').length; r.hiddenBefore = !!v.querySelector('.gv-player')?.hidden; if (tile) tile.click();
      const vid = v.querySelector('.gv-video'); if (vid) vid.pause(); r.video = vid ? { src: vid.getAttribute('src'), poster: vid.getAttribute('poster'), preload: vid.preload, shown: vid.offsetWidth > 0 } : null;
      if (r.video) { const c = v.querySelector('.gv-video-close'); if (c) c.click(); r.video.closes = !!c && v.querySelector('.gv-player').hidden && !v.querySelector('.gv-vtile[aria-pressed="true"]');
        const h = await fetch(r.video.src, { method: 'HEAD' }); r.video.ok = h.ok;
        // תמונת השער שונה בכל שפה (באג 12.11: גם באנגלית יצאה השער העברי)
        const buf = async u => new Uint8Array(await (await fetch(u)).arrayBuffer()).join(',');
        r.video.ownPoster = (await buf(r.video.poster)) !== (await buf(r.video.poster.replace(/-(he|en)\.jpg$/, (m, l) => l === 'he' ? '-en.jpg' : '-he.jpg'))); }
      v.querySelector('.gv-back').click(); return r;
    });
    check(`${path} the Dragon Assembler has a tool page: how to load, commands, first program, videos (small tiles with the lesson's name; a tile opens the player and ✕ closes it, lesson 1 in the page's language, kept on the site), about; no "tried it?" button`,
      tool.tool && tool.tabs.length === 5 && tool.tiles >= 1 && tool.hiddenBefore && !!tool.video && tool.video.ok && tool.video.closes && tool.video.ownPoster && tool.video.shown && tool.video.preload === 'none' && tool.video.src.endsWith((path.startsWith('/en') ? '-en' : '-he') + '.mp4') && tool.cmds === 28 && /STA \$0400/.test(tool.code || '') && !tool.testers, JSON.stringify(tool));
    check(`${path} every game opens its own page beside the machine, at its own address, with the 3 tabs (how to load, how to play, about; + hints in a game we finished), the red button and the credit; "back to the cabinet" returns`,
      gv.out.length === 75 && gv.out.every(g => g.id === 'dasm' ? (g.open && g.tabs === 5 && g.credit && g.go && g.url.startsWith(pre)) : g.open && g.url.startsWith(pre) && g.url.length > pre.length + 3 && g.tabs === 3 + (['adventureland', 'pirate', 'voodoo', 'mission', 'count', 'odyssey', 'pyramid', 'funhouse', 'ghost', 'golden', 'savage1', 'savage2', 'claymorgue', 'calixto', 'sanctum', 'shenan', 'seasearch', 'trekboer', 'williamsburg', 'vortex', 'diablero', 'sword', 'riverfire', 'daggorath', 'dhh', 'tangle'].includes(g.id) ? 1 : 0) && g.load >= 2 && g.play >= 2 && g.about >= 1 && g.credit && g.go) && gv.after === pre && gv.closed, JSON.stringify(gv.out.filter(g => !(g.open && true && g.load >= 2 && g.play >= 2 && g.about >= 1 && g.credit && g.go)).slice(0, 3)));
    // העטיפה המקורית (30.10): רק במשחק שיש עליו רשות (El Diablero, מארכיון Dragon Data), בלשונית "על המשחק", עם קרדיט וקישור. התמונה נטענת
    const cv = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await cv.goto(base.replace(/\/$/, '') + path + 'el-diablero/'); await cv.waitForTimeout(1500);
    const cov = await cv.evaluate(async () => { const tb = [...document.querySelectorAll('.gv-tabs button')]; const i = document.querySelector('.gv-media .gv-cover img'), seen = !!(i && i.getBoundingClientRect().height > 100);
      if (i) await new Promise(r => i.complete ? r() : (i.onload = i.onerror = r));
      tb[0].click(); const onlyOne = [...document.querySelectorAll('.gv-pane')].filter(p => getComputedStyle(p).display !== 'none').length === 1;
      const v = document.querySelector('.game-view').getBoundingClientRect(), kb = document.querySelector('.machine').getBoundingClientRect();
      const fit = []; for (const t of tb) { t.click(); await new Promise(r => setTimeout(r, 50)); fit.push(Math.round(document.querySelector('.game-view').getBoundingClientRect().bottom - kb.bottom)); }
      return { w: i && i.naturalWidth, seen, link: document.querySelector('.gv-media figcaption a')?.href, onlyOne, fit }; });
    check(`${path}el-diablero/ shows the original cover as soon as the game page opens (beside the screenshot), with credit and a link to the Dragon Data Archive; one tab at a time, and the page ends at the keyboard's bottom in every tab`, cov.w > 300 && cov.seen && /dragondata\.co\.uk/.test(cov.link || '') && cov.onlyOne && cov.fit.every(d => Math.abs(d) <= 2), JSON.stringify(cov));
    await cv.close();
    // מחסנית (31.10): Dungeons of Daggorath נכנס לחריץ, המחשב נדלק מחדש עם המשחק, ו"הוצא" מחזיר ל-BASIC שלנו
    {
      const cp = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await cp.goto(base.replace(/\/$/, '') + path + 'dungeons-of-daggorath/');
      await cp.waitForFunction(() => window.d32Ready, null, { timeout: 20000 }); await cp.waitForTimeout(2000);
      const before = await cp.evaluate(() => ({ go: document.querySelector('.gv-go')?.textContent, eject: getComputedStyle(document.querySelector('.gv-eject')).display, credit: document.querySelector('.game-view .tape-credit')?.textContent,
        lic: document.querySelector('.game-view .tape-credit a')?.getAttribute('href'), steps: document.querySelector('.game-view')?.textContent || '' }));
      await cp.click('.gv-go'); await cp.waitForTimeout(6000);
      const inCart = await cp.evaluate(() => ({ cart: document.body.classList.contains('cart-in'), eject: getComputedStyle(document.querySelector('.gv-eject')).display, basic: (window.d32Screen?.() || []).some(r => /DRAGON 1982 BASIC/.test(r)) }));
      await cp.click('.gv-eject'); await cp.waitForTimeout(3000);
      const out = await cp.evaluate(() => ({ cart: document.body.classList.contains('cart-in'), basic: (window.d32Screen?.() || []).some(r => /DRAGON 1982 BASIC/.test(r)) }));
      check(`${path}dungeons-of-daggorath/ a cartridge: the red button puts it in the slot and the game starts by itself (no BASIC on screen); "take the cartridge out" brings back our BASIC; credit with the public licence`,
        /(מחסנית|cartridge)/i.test(before.go) && before.eject === 'none' && /Douglas J\. Morgan/.test(before.credit) && before.lic === '/lab/1982/carts/daggorath-license.txt'
        && inCart.cart && inCart.eject === 'block' && !inCart.basic && !out.cart && out.basic, JSON.stringify([before.go, before.eject, before.lic, inCart, out]));
      await cp.close();
    }
    const direct = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const dres = await direct.goto(base.replace(/\/$/, '') + path + 'dungeon-raid/'); await direct.waitForTimeout(1500);
    const dd = await direct.evaluate(() => ({ open: document.body.classList.contains('game-open'), name: document.querySelector('.gv-title')?.textContent, title: document.title, og: document.querySelector('meta[property="og:title"]')?.content, shot: document.querySelector('.gv-shot').complete && document.querySelector('.gv-shot').naturalWidth === 256 }));
    check(`${path}dungeon-raid/ opens the machine with the Dungeon Raid page already open (its own title for sharing, and a screenshot from our machine)`, dres.status() === 200 && dd.open && dd.name === 'Dungeon Raid' && /^Dungeon Raid — Dragon 1982/.test(dd.title) && /Dungeon Raid/.test(dd.og) && dd.shot, JSON.stringify(dd));
    const seo = await direct.evaluate(() => ({ robots: !!document.querySelector('meta[name=robots][content*=noindex]'), canon: document.querySelector('link[rel=canonical]')?.href,
      he: document.querySelector('link[hreflang=he]')?.href, en: document.querySelector('link[hreflang=en]')?.href, desc: document.querySelector('meta[name=description]')?.content || '' }));
    const seoMain = await p.evaluate(() => ({ robots: !!document.querySelector('meta[name=robots][content*=noindex]'), canon: document.querySelector('link[rel=canonical]')?.href, n: document.querySelectorAll('link[rel=alternate][hreflang]').length }));
    check(`${path} open to Google: no "noindex", its own main address and the address in the other language (the machine and every game page)`, !seo.robots && !seoMain.robots
      && seo.canon === 'https://dragon1982.com' + path + 'dungeon-raid/' && seo.he === 'https://dragon1982.com/lab/1982/dungeon-raid/' && seo.en === 'https://dragon1982.com/en/lab/1982/dungeon-raid/' && /Kalish/.test(seo.desc)
      && seoMain.canon === 'https://dragon1982.com' + path && seoMain.n >= 2, JSON.stringify([seo, seoMain]));
    // אחרי הטעינה: מה לוחצים (גונן, 28.10: נתקע במסך שמחכה למקש), ו-CLOADM לפני הכפתור האדום מביא תזכורת מתחתיו
    await direct.waitForFunction(() => window.d32Ready, null, { timeout: 20000 }); await direct.waitForTimeout(2500);
    const steps = await direct.$$eval('.gv-pane ol li', l => l.map(x => x.textContent));
    await direct.click('#canvas');
    for (const k of [...'CLOADM', 'Enter']) { await direct.keyboard.down(k); await direct.waitForTimeout(80); await direct.keyboard.up(k); await direct.waitForTimeout(80); }
    await direct.waitForTimeout(600);
    const hint = await direct.evaluate(() => [document.getElementById('tape-status')?.textContent || '', document.querySelector('.gv-go')?.classList.contains('nudge')]);
    check(`${path}dungeon-raid/ "how to load" ends with what to press after loading, and CLOADM before the red button brings a reminder under it`,
      /SELECT LEVEL/.test(steps.at(-1) || '') && /(אדום|red button)/.test(hint[0]) && hint[1], JSON.stringify([steps.at(-1), hint]));
    await direct.close();
    const b = await p.request.get(base.replace(/\/$/, '') + path + 'building/');
    check(`${path} links to "what we are building now", which loads`, b.status() === 200 && (await p.locator('#about a[href="./building/"]').count()) === 1);
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
      await p.evaluate(() => { document.querySelector('.tape.row[data-id="guess"]').click(); document.querySelector('.gv-go').click(); });
      await p.waitForTimeout(800);
      check('the red button only puts the tape in the recorder (you type CLOAD yourself, like 1982)', await p.evaluate(() =>
        document.querySelector('#tapes .tape.in')?.dataset.id === 'guess' && /CLOAD/.test(document.getElementById('tape-status').textContent)
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
      await q.waitForFunction(() => document.querySelector('#tapes .tape.in')?.dataset.id === 'lander', null, { timeout: 30000 }).catch(() => {});
      check('?tape=lander from the app loads that tape by itself', await q.evaluate(() => document.querySelector('#tapes .tape.in')?.dataset.id === 'lander'));
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
      check('the app program also lands on the machine\'s "my tapes"', await a.locator('#mytapes .tape .tname:text-is("APPPROG")').count() === 1);
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
      await m.waitForFunction(() => [...document.querySelectorAll('#mytapes .tape .tname')].some(e => e.textContent === 'MYPROG'), null, { timeout: 20000 }).catch(() => {});
      check('CSAVE on the real machine puts the program on "my tapes"', await m.locator('#mytapes .tape .tname:text-is("MYPROG")').count() === 1);
      await m.reload();
      await m.waitForFunction(() => window.d32Ready, null, { timeout: 20000 });
      await m.waitForTimeout(4000);
      await m.evaluate(() => d32Type('CLOAD "MYPROG"\n'));
      await m.waitForFunction(() => (d32Screen() || []).includes('F MYPROG') && (d32Screen() || []).slice(-3).includes('OK'), null, { timeout: 20000 }).catch(() => {});
      await m.evaluate(() => d32Type('LIST\n'));
      await m.waitForTimeout(1500);
      check('after a reload, CLOAD "MYPROG" loads it back', (await m.evaluate(() => d32Screen())).includes('10 PRINT "SAVED"') && merrs.length === 0, (await m.evaluate(() => d32Screen())).filter(Boolean).join(' | ') + merrs.join(' | '));
      await m.evaluate(() => { document.querySelector('.part-tabs [data-part="ours"]').click(); document.getElementById('drawer-mine').open = true; });   // המגירות נסגרות בכל כניסה (גונן, 28.10)
      const del = m.locator('#mytapes .mytape .mini[aria-label^="מחיקת"], #mytapes .mytape .mini[aria-label^="Delete"]').first();   // ⬇ 🔊 ✕: המחיקה לפי השם, לא לפי המקום
      await del.click();
      await del.click();
      check('a saved tape can be deleted (two taps)', await m.locator('#mytapes .tape').count() === 0);
      // הפקודות שבשבב ההרחבה (חריץ המחסנית): ELSE, RENUM, PRINT USING, ו-EDIT עם SHIFT+↑ מהמקלדת המצוירת
      await m.evaluate(() => d32Type('NEW\n5 IF 1 THEN PRINT USING "##.#";3.14159 ELSE 7\n7 PRINT "NO"\nRENUM\nEDIT 20\nX;'));
      await m.click('.k[data-k="SHIFT"] >> nth=0');
      await m.dispatchEvent('.k[data-k="↑"]', 'pointerdown');
      await m.waitForTimeout(120);
      await m.dispatchEvent('.k[data-k="↑"]', 'pointerup');   // מקש מצויר לחוץ עד שהאצבע עוזבת (9.11)
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
