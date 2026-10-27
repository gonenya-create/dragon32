// בונה את גלריית הפרסומות מ-tools/adverts/data.mjs: דף גלריה ודף לכל פרסומת, בעברית (/adverts/) ובאנגלית (/en/adverts/).
// הדפים סטטיים (בלי JavaScript בדפדפן), כדי שלכל פרסומת תהיה כתובת ישירה ותמונה משלה בשיתוף בפייסבוק.
// הרצה: node tools/adverts/build.mjs (מתיקיית הפרויקט). הקבצים שנבנים נשמרים בגיט כמו כל דף אחר.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADVERTS } from './data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE = 'https://dragon1982.com';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// בעברית: כל רצף באנגלית (או מחיר בליש"ט) מבודד ב-bdi, כדי שהשורה לא תתהפך. סימן פיסוק בסוף נשאר בחוץ
// (רצף שמתחיל בספרה, כמו 32K RAM או 6809E, נחשב אנגלית רק אם יש בו אות לטינית)
const LATIN = /[£A-Za-z0-9][A-Za-z0-9£.,'’&\-×/ ]*[A-Za-z0-9]/g;
const bidi = s => { let out = '', at = 0; for (const m of String(s).matchAll(LATIN)) { if (!/[A-Za-z£]/.test(m[0])) continue; out += esc(s.slice(at, m.index)) + `<bdi>${esc(m[0])}</bdi>`; at = m.index + m[0].length; } return out + esc(s.slice(at)); };
// פסקה שמתחילה ב-**...** : החלק הזה מודגש
const strong = (s, f) => { const m = /^\*\*(.+?)\*\*(.*)$/s.exec(s); return m ? `<b>${f(m[1])}</b>${f(m[2])}` : f(s); };

// חשוב (27.10.2026): חוסמי פרסומות מסתירים שמות פנימיים כמו ad-card ו-ad-grid, וחוסמים כל קובץ בתיקייה /adverts/.
// לכן: השמות בדפים מתחילים ב-scan-, והתמונות והעיצוב נמצאים ב-/assets/scans/. כתובות הדפים עצמם נשארות /adverts/ (את הדף עצמו לא חוסמים).
// אין להשתמש ב-ad, ads או advert בשמות פנימיים או בתיקיות של קבצים. הבדיקה: cd tools && node adverts/adblock-check.mjs
// צבע התגית לפי סוג הפריט (פסי הצבע של ה-Dragon). השם לפי הצבע, לא לפי הסוג, כדי שלא יהיה tag-ad
const TAG = { ad: 'blue', brochure: 'green', leaflet: 'red', prices: 'yellow' };

const T = {
  he: {
    dir: 'rtl', lang: 'he', base: '/adverts/', other: '/en/adverts/', otherLang: 'en', otherName: 'English',
    title: 'הפרסומות של Dragon Data', kicker: 'Dragon 1982 · ארכיון',
    lead: 'ככה מכרו את ה-Dragon בתחילת שנות ה-80: פרסומות, חוברות ומחירונים מקוריים, לפי הסדר.',
    thanks: 'הסריקות באדיבות <b><bdi>Dragon Data Archive</bdi></b> (<bdi>dragondata.co.uk</bdi>), ותודה ל-<bdi>Dan</bdi> מ-<bdi>Retro Collective</bdi> שסרק חלק מהן. בכל פרסומת יש קישור למקור.',
    kinds: { ad: 'פרסומת', brochure: 'חוברת', leaflet: 'עלון', prices: 'מחירון' },
    noYear: 'תחילת שנות ה-80',
    back: '→ כל הפרסומות', prev: '→ הקודמת', next: 'הבאה ←',
    tryIt: 'לנסות את המחשב מהפרסומת ←', tryHref: '/lab/1982/', source: 'המקור בארכיון ←',
    translation: '📄 התרגום המלא של הפרסומת', original: 'במקור',
    credit: { scan: 'סריקה: <bdi>Dan</bdi> מ-<bdi>Retro Collective</bdi>, דרך <bdi>Dragon Data Archive</bdi>', archive: 'מתוך העותק של <bdi>Dragon Data Archive</bdi>', ia: 'מתוך <bdi>Dragon Data Archive</bdi> (המקור שם: <bdi>Internet Archive</bdi>)' },
    more: 'עוד מהתקופה:', mag: ['/magazine/', 'מה קראו בעלי <bdi>Dragon</bdi>'], typein: ['/lab/1982/', 'הקלד בעצמך (במכונה)'],
    nav: [['/story/', 'יומן המסע'], ['/', '← חזרה למחשב']], navLabel: 'ניווט', pager: 'פרסומות קודמות והבאות',
    img: n => `עמוד ${n} של הפרסומת`, page: 'הפרסומות של Dragon Data — Dragon 1982',
    desc: 'פרסומות, חוברות ומחירונים מקוריים של Dragon Data מתחילת שנות ה-80, עם תקציר ותרגום מלא לעברית.'
  },
  en: {
    dir: 'ltr', lang: 'en', base: '/en/adverts/', other: '/adverts/', otherLang: 'he', otherName: 'עברית',
    title: 'Dragon Data adverts', kicker: 'Dragon 1982 · Archive',
    lead: 'How the Dragon was sold in the early 1980s: original adverts, brochures and price lists, in order.',
    thanks: 'Scans courtesy of the <b>Dragon Data Archive</b> (dragondata.co.uk), with thanks to Dan at the Retro Collective, who scanned some of them. Every advert links to its original page.',
    kinds: { ad: 'Advert', brochure: 'Brochure', leaflet: 'Leaflet', prices: 'Price list' },
    noYear: 'Early 1980s',
    back: '← All adverts', prev: '← Previous', next: 'Next →',
    tryIt: 'Try the computer from the ad →', tryHref: '/en/lab/1982/', source: 'Original in the archive →',
    credit: { scan: 'Scan: Dan at the Retro Collective, via the Dragon Data Archive', archive: "From the Dragon Data Archive's own copy", ia: 'From the Dragon Data Archive (source there: Internet Archive)' },
    more: 'More from the time:', mag: ['/en/magazine/', 'What Dragon Owners Were Reading'], typein: ['/en/lab/1982/', 'Type it in (on the machine)'],
    nav: [['/en/story/', 'The journey'], ['/en/', '← Back to the computer']], navLabel: 'Navigation', pager: 'Previous and next adverts',
    img: n => `Page ${n} of the advert`, page: 'Dragon Data adverts — Dragon 1982',
    desc: 'Original Dragon Data adverts, brochures and price lists from the early 1980s.'
  }
};

function head(t, { title, desc, url, image }) {
  return `<!doctype html>
<html lang="${t.lang}" dir="${t.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${url}">
<link rel="alternate" hreflang="${t.lang}" href="${SITE}${url}">
<link rel="alternate" hreflang="${t.otherLang}" href="${SITE}${url.replace(t.base, t.other)}">
<link rel="alternate" hreflang="x-default" href="${SITE}${t.lang === 'he' ? url : url.replace(t.base, t.other)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}${url}">
<meta property="og:image" content="${SITE}${image}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;700&amp;family=Rubik:wght@400;700;900&amp;display=swap">
<link rel="stylesheet" href="/magazine/magazine.css">
<link rel="stylesheet" href="/assets/scans/scans.css">
</head>
<body>
<nav class="site" aria-label="${t.navLabel}">
  <b dir="ltr">Dragon 1982</b>
  <a href="${url.replace(t.base, t.other)}" lang="${t.otherLang}" hreflang="${t.otherLang}">${t.otherName}</a>
${t.nav.map(([h, n]) => `  <a href="${h}">${n}</a>`).join('\n')}
</nav>
<main class="sheet scans">
`;
}
const foot = t => `<p class="scans-more">${t.more} <a href="${t.mag[0]}">${t.mag[1]}</a> · <a href="${t.typein[0]}">${t.typein[1]}</a></p>
</main>
</body>
</html>
`;
const year = (a, t) => a.year ? a.year[t.lang] : t.noYear;
const txt = (t, s) => t.lang === 'he' ? bidi(s) : esc(s);
const mast = (t, h1 = true) => `<header class="mast">
  <div class="mast-top"><span>${t.lang === 'he' ? '<bdi>Dragon 1982</bdi> · ארכיון' : t.kicker}</span><span><bdi>Dragon Data</bdi></span></div>
  <${h1 ? 'h1' : 'p'} class="mast-name">${txt(t, t.title)}</${h1 ? 'h1' : 'p'}>
  <div class="stripes" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
</header>`;

function gallery(t) {
  const url = t.base;
  const cards = ADVERTS.map(a => {
    const L = a[t.lang];
    return `<li><a class="scan-card" href="${t.base}${a.id}/" id="${a.id}">
  <span class="scan-thumb"><img src="/assets/scans/img/${a.id}-card.jpg" alt=""></span>
  <span class="scan-meta"><span class="tag tag-${TAG[a.kind]}">${t.kinds[a.kind]}</span> <span class="scan-year">${esc(year(a, t))}</span></span>
  <span class="scan-title">${txt(t, L.title)}</span>
</a></li>`;
  }).join('\n');
  return head(t, { title: t.page, desc: t.desc, url, image: '/assets/scans/img/at-last.jpg' }) + mast(t) + `
<div class="story">
<p class="standfirst">${txt(t, t.lead)}</p>
<p class="thanks">${t.thanks}</p>
<ul class="scan-grid">
${cards}
</ul>
</div>
` + foot(t);
}

function advert(t, a, i) {
  const L = a[t.lang], url = `${t.base}${a.id}/`;
  const prev = ADVERTS[i - 1], next = ADVERTS[i + 1];
  const imgs = a.images.map((f, n) => `<img src="/assets/scans/img/${f}" alt="${esc(t.img(n + 1))}"${n ? ' loading="lazy"' : ''}>`).join('\n  ');
  const facts = L.facts.map(([k, v]) => `<li><b>${txt(t, k)}:</b> ${txt(t, v)}</li>`).join('\n  ');
  const body = t.lang === 'he'
    ? `<p class="scan-summary">${bidi(L.summary)}</p>
 <p class="scan-original">${t.original}: <bdi lang="en">${esc(a.original)}</bdi></p>
 <ul class="facts">
  ${facts}
 </ul>
 <details class="scan-tr"><summary>${t.translation}</summary>
  ${L.translation.map(p => `<p>${strong(p, bidi)}</p>`).join('\n  ')}
 </details>`
    : `<p class="scan-summary">${esc(L.context)}</p>
 <ul class="facts">
  ${facts}
 </ul>`;
  return head(t, { title: `${L.title.replace(/"/g, '')} — ${t.title}`, desc: t.lang === 'he' ? L.summary : L.context, url, image: `/assets/scans/img/${a.images[0]}` }) + mast(t, false) + `
<div class="story">
<p class="scan-back"><a href="${t.base}">${t.back}</a></p>
<article class="scan-detail" id="${a.id}">
 <div class="scan-big">
  ${imgs}
 </div>
 <div class="scan-text">
 <p class="scan-kicker"><span class="tag tag-${TAG[a.kind]}">${t.kinds[a.kind]}</span> ${esc(year(a, t))}</p>
 <h1>${txt(t, L.title)}</h1>
 ${body}
 <p class="btns"><a class="main" href="${t.tryHref}">${t.tryIt}</a> <a href="${a.archive}" rel="noopener">${t.source}</a></p>
 <p class="credit">${t.credit[a.source]}</p>
 </div>
</article>
<nav class="scan-pager" aria-label="${t.pager}">${prev ? `<a href="${t.base}${prev.id}/">${t.prev}</a>` : '<span></span>'}${next ? `<a href="${t.base}${next.id}/">${t.next}</a>` : '<span></span>'}</nav>
</div>
` + foot(t);
}

// שמירה מפני חוסמי פרסומות: הבנייה נעצרת אם שם פנימי (class / id) כולל ad / ads / advert, או אם קובץ נטען מהתיקייה /adverts/
const BAD_NAME = /(^|[-_\s])(ad|ads|advert\w*)([-_\s]|$)|^advert/i;
function guard(path, html) {
  for (const [, kind, v] of html.matchAll(/\s(class|id)="([^"]*)"/g)) for (const n of v.split(/\s+/)) if (BAD_NAME.test(n)) throw new Error(`${path}: ${kind}="${n}" — חוסמי פרסומות מסתירים שמות כאלה. בחרו שם אחר (למשל scan-...)`);
  for (const [, , v] of html.matchAll(/\s(src|href)="([^"]*)"/g)) if (/\/adverts\/.*\.\w+$/.test(v.replace(/^https?:\/\/[^/]+/, '')) && !/dragondata\.co\.uk/.test(v)) throw new Error(`${path}: ${v} — קובץ בתיקייה /adverts/ נחסם. שימו אותו ב-/assets/scans/`);
}
const write = (path, html) => { guard(path, html); const f = join(ROOT, path); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, html); };
for (const t of Object.values(T)) {
  write(`${t.base}index.html`, gallery(t));
  ADVERTS.forEach((a, i) => write(`${t.base}${a.id}/index.html`, advert(t, a, i)));
}
console.log(`built ${ADVERTS.length} adverts × 2 languages`);
