// בדיקת חוסמי פרסומות לגלריית הפרסומות (גונן, 27.10.2026).
// ב-27.10 Adblock Plus הסתיר את כל הגלריה במחשב של גונן: שמות כמו ad-card היו ברשימת החסימה, והתמונות ישבו בתיקייה /adverts/.
// הבדיקה מורידה את רשימות החסימה העדכניות (של היום), פותחת כל דף פעמיים, בלי חוסם ועם חוסם, ומשווה:
// כל מה שנראה בלי חוסם חייב להיראות גם איתו, וכל תמונה חייבת להיטען. אם משהו נחסם, הבדיקה נכשלת ואומרת מה.
// מריצים לפני כל "מזג" שנוגע בגלריה, ובכל "חמישי של Dragon" לפני שמגישים פרסומת חדשה:
//   cd tools && node adverts/adblock-check.mjs                 (האתר מהתיקייה, בשרת מקומי)
//   cd tools && node adverts/adblock-check.mjs https://dragon1982.com   (אתר חי או קישור ניסיון)
import { chromium } from 'playwright-core';
import { PlaywrightBlocker } from '@ghostery/adblocker-playwright';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADVERTS } from './data.mjs';

// הרשימות שהחוסמים הנפוצים מפעילים כברירת מחדל: Adblock Plus (EasyList, ובישראל גם EasyList Hebrew) ו-uBlock Origin
const LISTS = [
  'https://easylist.to/easylist/easylist.txt',
  'https://easylist.to/easylist/easyprivacy.txt',
  'https://raw.githubusercontent.com/easylist/EasyListHebrew/master/EasyListHebrew.txt',
  'https://ublockorigin.github.io/uAssets/filters/filters.txt',
  'https://ublockorigin.github.io/uAssets/filters/privacy.txt',
  'https://ublockorigin.github.io/uAssets/filters/quick-fixes.txt',
];

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };
function serve() {
  return new Promise(resolve => {
    const server = http.createServer(async (req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const file = normalize(join(ROOT, p));
      if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
      let body;
      try { body = await readFile(file); } catch { res.writeHead(404).end('not found'); return; }
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }).end(body);
    });
    server.listen(0, () => resolve(server));
  });
}

let base = process.argv[2], server = null;
// השרת המקומי מוגש בשם שנראה כמו אתר אמיתי: על localhost החוסם לא מפעיל את כללי ההסתרה
if (!base) { server = await serve(); base = 'http://dragon1982.test:' + server.address().port; }
base = base.replace(/\/$/, '');

let blocker;
try { blocker = await PlaywrightBlocker.fromLists(fetch, LISTS); }
catch (e) { console.error('לא הצלחתי להוריד את רשימות החסימה (אין אינטרנט?):', e.message); process.exit(2); }
const blocked = [];
blocker.on('request-blocked', r => blocked.push(r.url));

// דפי הגלריה, ודפים עם קישור לגלריה (הקישור עצמו לא אמור להיעלם)
const GALLERY = ['/adverts/', '/en/adverts/', ...ADVERTS.flatMap(a => [`/adverts/${a.id}/`, `/en/adverts/${a.id}/`])];
const LINKS = ['/', '/en/', '/magazine/', '/en/magazine/', '/dragon-history/', '/en/dragon-history/'];

// מה נראה בדף: כל אלמנט עם גודל, וכל תמונה (נטענה או לא)
const snapshot = () => {
  const seen = [];
  for (const el of document.body.querySelectorAll('*')) {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none') {
      seen.push(el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''));
    }
  }
  const imgs = [...document.images].map(i => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0 }));
  const advertLinks = [...document.querySelectorAll('a[href*="/adverts/"]')].filter(a => a.getBoundingClientRect().height > 0).length;
  return { seen, imgs, advertLinks };
};

const browser = await chromium.launch({ channel: 'chrome', args: ['--host-resolver-rules=MAP dragon1982.test 127.0.0.1'] });
let fail = 0;
const out = (ok, name, detail) => { if (!ok) fail++; console.log(`  ${ok ? '✓' : '✗'} ${name}${!ok && detail ? '\n      ' + detail : ''}`); };
console.log(`adblock check: ${base} (${LISTS.length} lists)`);
for (const path of [...GALLERY, ...LINKS]) {
  const plain = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await plain.goto(base + path, { waitUntil: 'networkidle', timeout: 60000 });
  await plain.evaluate(() => Promise.all([...document.images].map(i => i.loading === 'lazy' ? (i.loading = 'eager', i.decode().catch(() => {})) : null)));
  const a = await plain.evaluate(snapshot);
  await plain.close();

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await blocker.enableBlockingInPage(page);
  blocked.length = 0;
  await page.goto(base + path, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(() => Promise.all([...document.images].map(i => i.loading === 'lazy' ? (i.loading = 'eager', i.decode().catch(() => {})) : null)));
  await page.waitForTimeout(300);   // החוסם מוסיף את כללי ההסתרה רגע אחרי הטעינה
  const b = await page.evaluate(snapshot);
  await blocker.disableBlockingInPage(page);
  await page.close();

  const hidden = a.seen.filter(s => !b.seen.includes(s));
  const missing = b.imgs.filter(i => !i.ok).map(i => i.src);
  const mine = blocked.filter(u => u.startsWith(base));
  if (GALLERY.includes(path)) {
    out(hidden.length === 0 && missing.length === 0 && mine.length === 0 && a.imgs.length > 0, `${path} looks the same with an ad blocker`,
      [hidden.length && 'hidden: ' + [...new Set(hidden)].slice(0, 8).join(' '), missing.length && 'images not loaded: ' + missing.join(' '), mine.length && 'blocked: ' + mine.join(' ')].filter(Boolean).join(' | '));
  } else {
    out(b.advertLinks === a.advertLinks && a.advertLinks > 0, `${path} the links to the gallery stay visible with an ad blocker`, `without ${a.advertLinks}, with ${b.advertLinks}`);
  }
}
await browser.close();
if (server) server.close();
console.log(fail ? `\n${fail} FAILED` : '\nall passed');
process.exit(fail ? 1 : 0);
