// פינת הלמידה: הופך את קובץ הקורס "שפת מכונה בדראגון" (קובץ HTML אחד, כל הפרקים בלשוניות) לדפים באתר.
// דף לכל פרק (/learn/ch0/ … /learn/ch15/), ודף פתיחה (/learn/). כל הדפים חולקים קובץ JS אחד וקובץ CSS אחד,
// אז בטלפון כל פרק נטען מהר, והקבצים המשותפים נשמרים בדפדפן אחרי הפעם הראשונה.
// ההתקדמות (✓ ליד כל פרק) נשמרת באותם מפתחות של הקורס (mc-course-*), אז היא עוברת בין הדפים.
//
// הרצה: node tools/learn/build.mjs "<קובץ הקורס>.html" [he|en]
//   he → /learn/      en → /en/learn/   (קובץ קורס באנגלית עובר באותה דרך בדיוק)
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const [src, lang = 'he'] = process.argv.slice(2);
if (!src || !['he', 'en'].includes(lang)) { console.error('usage: node tools/learn/build.mjs <course.html> [he|en]'); process.exit(1); }
const HE = lang === 'he';
const BASE = HE ? '/learn/' : '/en/learn/';
const OTHER = HE ? '/en/learn/' : '/learn/';
const OUT = join(ROOT, BASE);
const SITE = 'https://dragon1982.com';
const hasOther = existsSync(join(ROOT, OTHER, 'index.html'));

const T = HE ? {
  dir: 'rtl', course: 'שפת מכונה בדראגון', home: '← לדף הבית', all: 'כל הפרקים', other: 'English', nav: 'ניווט',
  chapter: n => 'פרק ' + n,
  foot: 'פרויקט מחווה של חובב, לא קשור ל-<bdi>Dragon Data</bdi> ולא מורשה על ידה. הקורס, הציורים והטקסט שלנו. כל תוכנית בקורס נבדקה במכונת ה-<bdi>Dragon</bdi> של האתר (<bdi>XRoar</bdi> עם ה-<bdi>BASIC</bdi> שכתבנו).',
  landTitle: 'פינת הלמידה: שפת מכונה מאפס',
  landDesc: 'קורס חינמי בעברית: לומדים לכתוב שפת מכונה ל-Dragon 32 מאפס, צעד אחרי צעד, עם חלונות שמריצים כל שורה, חידות ומשחק שבונים לבד. לילדים, לנוער ולמבוגרים.',
  landH1: 'פינת הלמידה',
  landSub: 'שפת מכונה מאפס · 16 פרקים',
  landIntro: [
    'המעבד של הדראגון לא מבין <bdi>BASIC</bdi>. הוא מבין רק מספרים. בקורס הזה לומדים לדבר איתו בשפה שלו, שפת מכונה, מהצעד הראשון: מה זה זיכרון, איך אות מופיעה על המסך, לולאות, מקשים ותנועה. בסוף בונים משחק שלם: סל שתופס תפוחים נופלים.',
    'הקורס מתאים לילדים, לנוער ולמבוגרים, גם למי שמעולם לא כתב שורת קוד. כל פרק קצר, עם ציורים, חלון שמריץ את התוכנית שורה אחרי שורה, ושאלות וחידות. אפשר לעצור בכל מקום: הדפדפן זוכר אילו פרקים סיימת.',
    'כל התוכניות נבדקו במכונת ה-<bdi>Dragon</bdi> של האתר. ובפרקים האחרונים, כפתור אחד שולח את התוכנית שלך אל המכונה, ושם היא רצה כמו בשנת 1982.'
  ],
  start: 'מתחילים: פרק 0 ←', cont: n => 'ממשיכים מפרק ' + n + ' ←', list: 'הפרקים',
  basic: 'עוד לא מכירים <bdi>BASIC</bdi>? אפשר להתחיל ב<a href="/lessons/">שיעורי ה-<bdi>BASIC</bdi></a>, אבל זה לא חובה.',
} : {
  dir: 'ltr', course: 'Machine Code on the Dragon', home: '← Home', all: 'All chapters', other: 'עברית', nav: 'Navigation',
  chapter: n => 'Chapter ' + n,
  foot: 'A hobbyist tribute project, not affiliated with or endorsed by <bdi>Dragon Data</bdi>. The course, drawings and text are our own. Every program in the course was checked on the site\'s <bdi>Dragon</bdi> machine (<bdi>XRoar</bdi> running the <bdi>BASIC</bdi> we wrote).',
  landTitle: 'The Learning Corner: machine code from zero',
  landDesc: 'A free course: learn to write machine code for the Dragon 32 from zero, step by step, with windows that run every line, puzzles and a game you build yourself. For kids, teens and adults.',
  landH1: 'The Learning Corner',
  landSub: 'Machine code from zero · 16 chapters',
  landIntro: [
    'The Dragon\'s processor does not understand <bdi>BASIC</bdi>. It only understands numbers. In this course you learn to speak its own language, machine code, from the very first step: what memory is, how a letter appears on the screen, loops, keys and movement. At the end you build a whole game: a basket that catches falling apples.',
    'The course is for kids, teens and adults, including people who never wrote a line of code. Each chapter is short, with drawings, a window that runs the program line by line, questions and puzzles. You can stop anywhere: the browser remembers which chapters you finished.',
    'Every program was checked on the site\'s <bdi>Dragon</bdi> machine. And in the last chapters one button sends your program to the machine, where it runs just like in 1982.'
  ],
  start: 'Start: chapter 0 →', cont: n => 'Continue from chapter ' + n + ' →', list: 'The chapters',
  basic: 'Don\'t know <bdi>BASIC</bdi> yet? You can start with the <a href="/en/lessons/">BASIC lessons</a>, but you don\'t have to.',
};

const html = readFileSync(src, 'utf8');
const cut = (a, b, from = 0) => { const i = html.indexOf(a, from); const j = html.indexOf(b, i + a.length); if (i < 0 || j < 0) throw new Error('missing ' + a); return [i, j]; };
// --- the parts of the course file
let [a, b] = cut('<style>', '</style>');
let css = html.slice(a + 7, b);
[a, b] = cut('<header class="top">', '</header>');
const header = html.slice(a, b + 9);
[a, b] = cut('<nav class="toc" id="toc">', '</nav>');
const toc = html.slice(a, b + 6);
const sections = [];
for (const m of html.matchAll(/<section class="ch" id="ch(\d+)">[\s\S]*?\n<\/section>/g)) sections.push({ n: +m[1], html: m[0] });
a = html.indexOf('<script>'); b = html.lastIndexOf('</script>');
let js = html.slice(a + 8, b);
if (sections.length !== 16) throw new Error('expected 16 chapters, found ' + sections.length);

// --- titles and descriptions of each chapter, from the chapter itself
const text = s => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/[‎‏]/g, '').replace(/\s+/g, ' ').trim();
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
for (const s of sections) {
  s.title = text((/<h2>([\s\S]*?)<\/h2>/.exec(s.html) || [])[1] || '');
  s.time = text((/<span class="time">([\s\S]*?)<\/span>/.exec(s.html) || [])[1] || '');
  s.short = text((new RegExp('data-tab="ch' + s.n + '">([\\s\\S]*?)<span').exec(toc) || [])[1] || '').replace(/^\d+\s*·\s*/, '');
  // the first sentences a reader sees: the bubble or the first paragraph of the chapter
  const paras = [...s.html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m => text(m[1])).filter(t => t.length > 40);
  let d = paras[0] || s.title;
  if (d.length > 160) d = d.slice(0, d.lastIndexOf(' ', 155)) + '…';
  s.desc = d;
}

// --- shared CSS: the course's own, plus the site bar and the bits the pages add
css += `
/* --- site pages (tools/learn/build.mjs) --- */
nav.site{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 16px;background:#2a221b;color:#efe6d2;font:15px/1.4 "Rubik",system-ui,sans-serif}
nav.site b{font-size:17px}
nav.site a{color:#efe6d2;text-decoration:none;border:1.5px solid #4a3d31;border-radius:8px;padding:6px 12px;font-size:14px}
nav.site a:first-of-type{margin-inline-start:auto}
nav.toc a.on{outline:2px solid var(--accent)}
.site-foot{max-width:760px;margin:24px auto 40px;padding:0 16px;color:var(--soft);font-size:14px;line-height:1.6;text-align:center}
.land-intro p{margin:.6em 0}
.land-go{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}
.land-go a{text-decoration:none}
ol.chapters{list-style:none;padding:0;margin:12px 0;display:grid;gap:10px}
ol.chapters a{display:flex;gap:12px;align-items:baseline;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--card);color:var(--ink);text-decoration:none;box-shadow:var(--shadow)}
ol.chapters .cn{font-weight:700;color:var(--accent-ink);min-width:2.2em}
ol.chapters .ct{flex:1}
ol.chapters .ct small{display:block;color:var(--soft);font-size:14px}
`;

// --- shared JS. A chapter page holds only its own chapter, but the course script builds every chapter's windows at load.
// While the script first runs, a missing element is answered with an empty box that is not on the page, so the other
// chapters' code runs harmlessly; then the boxes are thrown away.
const tabsStart = js.indexOf('/* ---------------- tabs ---------------- */');
const tabsEnd = js.indexOf("window.addEventListener('hashchange'", tabsStart);
if (tabsStart < 0 || tabsEnd < 0) throw new Error('tabs block not found');
const tabsEndLine = js.indexOf('\n', tabsEnd) + 1;
const pageTabs = `/* ---------------- chapters are pages (site build) ---------------- */
const TABS=${JSON.stringify(sections.map(s => 'ch' + s.n))};
const HERE=document.body.dataset.ch||'';
function showTab(id){ if(TABS.includes(id)&&id!==HERE) location.href=${JSON.stringify(BASE)}+id+'/'; }
document.querySelectorAll('nav.toc a').forEach(a=>a.classList.toggle('on',a.dataset.tab===HERE));
if(HERE){ store.set('tab',HERE); const on=document.querySelector('nav.toc a.on'); const t=document.getElementById('toc'); if(on&&t) t.scrollLeft+=on.getBoundingClientRect().left-t.getBoundingClientRect().left-(t.clientWidth-on.offsetWidth)/2; }
document.querySelectorAll('.nextch').forEach(b=>b.onclick=()=>showTab(b.dataset.go));
`;
js = js.slice(0, tabsStart) + pageTabs + js.slice(tabsEndLine);
// the auto-playing teaser of chapter 0 draws every 160 ms: only on the page that shows it
const teaser = "const sc=new Screen(document.getElementById('teaser'),{labels:false});";
if (!js.includes(teaser)) throw new Error('teaser not found');
js = js.replace(teaser, "const host=document.getElementById('teaser'); if(host.closest('[hidden]')) return; const sc=new Screen(host,{labels:false});");
js = `(()=>{ const real=document.getElementById.bind(document); let sink=null;
document.getElementById=id=>real(id)||(()=>{ if(!sink){ sink=document.createElement('div'); sink.hidden=true; document.body.appendChild(sink); } const d=document.createElement('div'); d.id=id; sink.appendChild(d); return d; })();
window.__courseLoaded=()=>{ document.getElementById=real; if(sink) sink.remove(); sink=null; };
})();
${js}
window.__courseLoaded();
`;

// --- page frame
const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700&amp;display=swap">';
const altLinks = path => `<link rel="canonical" href="${SITE}${BASE}${path}">
<link rel="alternate" hreflang="${lang}" href="${SITE}${BASE}${path}">${hasOther ? `\n<link rel="alternate" hreflang="${HE ? 'en' : 'he'}" href="${SITE}${OTHER}${path}">` : ''}`;
const head = (title, desc, path) => `<!doctype html>
<html lang="${lang}" dir="${T.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${SITE}${BASE}${path}">
<meta property="og:image" content="${SITE}/icon-512.png">
${altLinks(path)}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
${fonts}
<link rel="stylesheet" href="${BASE}course.css">
</head>`;
const siteNav = path => `<nav class="site" aria-label="${T.nav}">
  <b dir="ltr">Dragon 1982</b>
  ${hasOther ? `<a href="${OTHER}${path}" lang="${HE ? 'en' : 'he'}" hreflang="${HE ? 'en' : 'he'}">${T.other}</a>\n  ` : ''}${path ? `<a href="${BASE}">${T.all}</a>\n  ` : ''}<a href="${HE ? '/' : '/en/'}">${T.home}</a>
</nav>`;
const tocPage = toc.replace(/href="#(ch\d+)"/g, (m, id) => `href="${BASE}${id}/"`);
const foot = `<p class="site-foot">${T.foot}</p>`;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'course.css'), css.trim() + '\n');
writeFileSync(join(OUT, 'course.js'), js.trim() + '\n');

for (const s of sections) {
  const path = `ch${s.n}/`;
  const page = `${head(`${T.chapter(s.n)} · ${s.title} — ${T.course}`, s.desc, path)}
<body data-ch="ch${s.n}">
${siteNav(path)}
<div class="wrap">

${header}

${tocPage}

${s.html.replace('<section class="ch"', '<section class="ch" aria-labelledby="h-ch' + s.n + '"').replace('<h2>', `<h2 id="h-ch${s.n}">`)}

</div>
${foot}
<script src="${BASE}course.js"></script>
</body>
</html>
`;
  mkdirSync(join(OUT, path), { recursive: true });
  writeFileSync(join(OUT, path, 'index.html'), page);
}

// --- the landing page: what the course is, and the list of chapters (no course script: it only reads the ✓ marks)
const land = `${head(T.landTitle + ' — Dragon 1982', T.landDesc, '')}
<body>
${siteNav('')}
<div class="wrap">
<header class="top">
  <svg class="mascot" viewBox="0 0 120 120" aria-hidden="true" id="mascotBig"></svg>
  <div>
    <h1>${T.landH1}</h1>
    <p class="sub">${T.landSub}</p>
  </div>
</header>
<div class="land-intro">
${T.landIntro.map(p => '<p>' + p + '</p>').join('\n')}
<p class="soft">${T.basic}</p>
</div>
<div class="land-go"><a class="btn warm" id="go" href="${BASE}ch0/">${T.start}</a></div>
<h2>${T.list}</h2>
<ol class="chapters">
${sections.map(s => `<li><a href="${BASE}ch${s.n}/"><span class="cn">${s.n}</span><span class="ct">${s.title}<small>${s.time}</small></span><span class="done" data-done="${s.n}"></span></a></li>`).join('\n')}
</ol>
</div>
${foot}
<script>
(()=>{ let d={}, tab=null; try{ d=JSON.parse(localStorage.getItem('mc-course-done'))||{}; tab=JSON.parse(localStorage.getItem('mc-course-tab')); }catch(e){}
document.querySelectorAll('[data-done]').forEach(s=>{ s.textContent=d[s.dataset.done]?' ✓':''; });
const h=(location.hash||'').slice(1); if(/^ch\\d+$/.test(h)) { location.replace(${JSON.stringify(BASE)}+h+'/'); return; }
if(/^ch([1-9]|1[0-5])$/.test(tab||'')){ const g=document.getElementById('go'); g.href=${JSON.stringify(BASE)}+tab+'/'; g.textContent=${JSON.stringify(T.cont('#'))}.replace('#',tab.slice(2)); }
})();
</script>
<script>${(/const MASCOT = `[\s\S]*?`;/.exec(js) || [''])[0]}
document.getElementById('mascotBig').innerHTML=MASCOT;</script>
</body>
</html>
`;
writeFileSync(join(OUT, 'index.html'), land);

// --- sitemap: the landing page and every chapter
const smPath = join(ROOT, 'sitemap.xml');
let sm = readFileSync(smPath, 'utf8').split('\n').filter(l => !l.includes(`<loc>${SITE}${BASE}`)).join('\n');
const urls = ['', ...sections.map(s => `ch${s.n}/`)].map(p => `  <url><loc>${SITE}${BASE}${p}</loc></url>`).join('\n');
sm = sm.replace('</urlset>', urls + '\n</urlset>');
writeFileSync(smPath, sm);

console.log(`learn (${lang}): ${sections.length} chapters → ${BASE} · course.js ${(js.length / 1024).toFixed(0)} KB · course.css ${(css.length / 1024).toFixed(0)} KB`);
