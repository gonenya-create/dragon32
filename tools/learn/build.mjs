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
  landAsm: 'כבר יודעים קצת? ב<a href="/learn/asm/">האסמבלר</a> כותבים שפת מכונה בחופשיות: כל פקודות ה-<bdi>6809</bdi>, הרצה בדף ושליחה למכונה. ויש גם <a href="/lab/1982/dragon-assembler/#videos">שיעור בווידאו</a> על האסמבלר שבתוך ה-<bdi>Dragon</bdi>.',
  ch15Asm: 'רוצים לכתוב תוכנית משלכם מאפס, עם כל פקודות המעבד? <a href="/learn/asm/">האסמבלר</a> מחכה לכם: עורך, הרצה, צעד ושליחה למכונה.',
  asmTitle: 'האסמבלר: כותבים שפת מכונה ל-Dragon 32',
  asmDesc: 'כותבים תוכנית בשפת מכונה של המעבד 6809, בחופשיות: האסמבלר מתרגם למספרים, מריץ בדף צעד אחרי צעד, ושולח את התוכנית למכונת ה-Dragon של האתר. חינם, בעברית.',
  asmH1: 'האסמבלר',
  asmSub: 'כותבים שפת מכונה בחופשיות · כל פקודות ה-<bdi>6809</bdi>',
  asmIntro: [
    'אסמבלר הוא <b>מתרגם</b>: כותבים פקודות במילים, כמו <code>LDA #$41</code>, והוא הופך אותן למספרים שהמעבד מבין. בקורס הכרנו חלק מהפקודות. כאן אפשר להשתמש בכולן.',
    'כותבים בחלון, ומיד רואים מתחת כל שורה עם הבית שלה והמספרים שלה. <b>▶ הרץ</b> מריץ את התוכנית על מסך הדראגון שבדף, ו<b>צעד</b> מריץ פקודה אחת ומראה מה השתנה במגירות ובנורות. כשהתוכנית מוכנה, <b>🐉 שלח למכונה</b> מעביר אותה למכונת ה-<bdi>Dragon</bdi> של האתר, כמו קלטת.',
    'התוכנית נשמרת בדפדפן הזה בלבד, ונשארת גם אחרי שסוגרים את הדף.'
  ],
  asmHelp: `<details class="step asm-help"><summary><b>עזרה: איך כותבים</b></summary>
<h3>שורה</h3>
<p>שם של מקום (כמו <code>LOOP</code>) כותבים צמוד לתחילת השורה. פקודה באה אחרי רווח, ולכן שורה בלי שם מתחילה ברווח. מה שבא אחרי הפקודה ורווח נוסף הוא הערה. שורה שמתחילה ב-<code>*</code> היא הערה כולה.</p>
<pre>LOOP STA ,X+     * כותבים ומזיזים את X
 INCA</pre>
<h3>מספרים</h3>
<p><code>$41</code> הקסדצימלי, <code>%01000001</code> בינארי, <code>65</code> רגיל, <code>'A</code> הקוד של האות. אפשר גם חשבון פשוט: <code>LOOP+2</code>, <code>SCREEN+32</code>, <code>*-1</code> (‏<code>*</code> הוא הבית של השורה הזאת).</p>
<h3>הוראות למתרגם</h3>
<table>
<tr><td><code>ORG $3000</code></td><td>מאיזה בית לשים את התוכנית. בלי <code>ORG</code> מתחילים ב-<code>$2EE1</code>, כמו בקורס.</td></tr>
<tr><td><code>SCREEN EQU $0400</code></td><td>נותנים שם למספר.</td></tr>
<tr><td><code>FCB 1,2,3</code></td><td>שמים בתים בזיכרון (כל אחד 0 עד 255).</td></tr>
<tr><td><code>FDB $0400,LOOP</code></td><td>שמים מספרים של שני בתים.</td></tr>
<tr><td><code>FCC /HELLO/</code></td><td>שמים את הקודים של טקסט.</td></tr>
<tr><td><code>RMB 10</code></td><td>שומרים 10 בתים ריקים.</td></tr>
<tr><td><code>@</code></td><td>שם מיוחד: מכאן התוכנית מתחילה לרוץ (כמו בקורס). בלי <code>@</code> מתחילים בבית הראשון.</td></tr>
</table>
<h3>לחזור ל-<bdi>BASIC</bdi>: ‏<code>RTS</code></h3>
<p>‏<code>EXEC</code> במכונה קופצת לתוכנית כמו <code>JSR</code>, ושמה בערימה את הבית שאליו חוזרים. בסוף התוכנית כותבים <code>RTS</code>, והמחשב חוזר ל-<bdi>BASIC</bdi> ול-<code>OK</code>. מה שהכנסתם לערימה (<code>PSHS</code>) מוציאים לפני ה-<code>RTS</code>. כדי לראות את המסך לפני שה-<code>OK</code> מופיע, מחכים קודם למקש:</p>
<pre>KEY LDX $A000    * הבית של בודק המקלדת
 JSR ,X          * A = המקש, או 0
 BEQ KEY         * אין מקש? שוב
 RTS             * חזרה ל-BASIC</pre>
<h3>מה רואים בדף, ומה רק במכונה</h3>
<p>הדף מראה את מסך הטקסט (‏<code>$0400</code> עד <code>$05FF</code>), את הזיכרון, את המגירות, את הנורות ואת בודק המקלדת. צליל (<code>$FF20</code>), גרפיקה (<code>PMODE</code>, ‏<code>$FFC0</code>) וקריאות אחרות ל-ROM של ה-<bdi>BASIC</bdi> רואים רק במכונה: הדף עוצר ואומר "את זה רואים במכונה", ושם שולחים בכפתור 🐉. הדף עוצר גם לולאה שלא נגמרת, וכתיבה מחוץ לזיכרון של התוכנית והמסך.</p>
<h3>מאיפה ללמוד</h3>
<ul>
<li><a href="/learn/ch2/">פרק 2</a>: ‏<code>LDA</code> ו-<code>STA</code>. ‏<a href="/learn/ch5/">פרק 5</a>: עם <code>#</code> או בלי.</li>
<li><a href="/learn/ch6/">פרק 6</a>: חשבון. ‏<a href="/learn/ch7/">פרק 7</a>: האצבע <code>X</code>. ‏<a href="/learn/ch8/">פרק 8</a>: השוואה וקפיצה.</li>
<li><a href="/learn/ch9/">פרקים 9 עד 11</a>: לולאות, מקשים ותנועה. ‏<a href="/learn/ch12/">פרק 12</a>: תת-תוכניות והערימה.</li>
<li><a href="/learn/ch13/">פרק 13</a>: התוכנית כמספרים. ‏<a href="/learn/ch14/">פרקים 14 ו-15</a>: המשחק, והדרך למכונה.</li>
</ul>
<p class="asm-own">זה כלי שכתבנו בעצמנו, בהשראת הדרך שבה עבד <bdi>DREAM</bdi> בשנת 1983. ‏<bdi>DREAM</bdi> עצמו לא שלנו, והוא לא נמצא באתר.</p>
<p class="asm-own">הבדל אחד מ-<bdi>DREAM</bdi>: סוגריים מרובעים, כמו <bdi dir="ltr">JSR [$A000]</bdi>, עובדים אצלנו כמו במעבד האמיתי. <bdi>DREAM</bdi> מתעלם מהם.</p>
</details>`,
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
  landAsm: 'Know a little already? In <a href="/en/learn/asm/">the Assembler</a> you write machine code freely: every <bdi>6809</bdi> command, running in the page and sending to the machine. And there is a <a href="/en/lab/1982/dragon-assembler/#videos">video lesson</a> on the assembler inside the <bdi>Dragon</bdi>.',
  ch15Asm: 'Want to write a program of your own from scratch, with every command of the processor? <a href="/en/learn/asm/">The Assembler</a> is waiting: an editor, run, step and send to the machine.',
  asmTitle: 'The Assembler: write machine code for the Dragon 32',
  asmDesc: 'Write a program in the machine code of the 6809 processor, freely: the assembler translates it into numbers, runs it in the page step by step, and sends it to the site\'s Dragon machine. Free.',
  asmH1: 'The Assembler',
  asmSub: 'Write machine code freely · every <bdi>6809</bdi> command',
  asmIntro: [
    'An assembler is a <b>translator</b>: you write commands in words, like <code>LDA #$41</code>, and it turns them into the numbers the processor understands. The course met some of the commands. Here you can use all of them.',
    'Write in the box, and right below you see every line with its address and its numbers. <b>▶ Run</b> runs the program on the Dragon screen in the page, and <b>Step</b> runs one command and shows what changed in the drawers and lamps. When the program is ready, <b>🐉 Send to the machine</b> takes it to the site\'s <bdi>Dragon</bdi> machine, like a tape.',
    'The program is kept in this browser only, and stays after you close the page.'
  ],
  asmHelp: `<details class="step asm-help"><summary><b>Help: how to write</b></summary>
<h3>A line</h3>
<p>A place name (like <code>LOOP</code>) is written at the very start of the line. A command comes after a space, so a line with no name starts with a space. Whatever comes after the command and another space is a comment. A line that starts with <code>*</code> is all comment.</p>
<pre>LOOP STA ,X+     * write and move X
 INCA</pre>
<h3>Numbers</h3>
<p><code>$41</code> hex, <code>%01000001</code> binary, <code>65</code> ordinary, <code>'A</code> the letter's code. Simple sums work too: <code>LOOP+2</code>, <code>SCREEN+32</code>, <code>*-1</code> (<code>*</code> is this line's address).</p>
<h3>Instructions for the translator</h3>
<table>
<tr><td><code>ORG $3000</code></td><td>Where in memory to put the program. With no <code>ORG</code> it starts at <code>$2EE1</code>, as in the course.</td></tr>
<tr><td><code>SCREEN EQU $0400</code></td><td>Give a number a name.</td></tr>
<tr><td><code>FCB 1,2,3</code></td><td>Put bytes in memory (each 0 to 255).</td></tr>
<tr><td><code>FDB $0400,LOOP</code></td><td>Put two-byte numbers.</td></tr>
<tr><td><code>FCC /HELLO/</code></td><td>Put the codes of a text.</td></tr>
<tr><td><code>RMB 10</code></td><td>Keep 10 empty bytes.</td></tr>
<tr><td><code>@</code></td><td>A special name: the program starts running here (as in the course). With no <code>@</code> it starts at the first byte.</td></tr>
</table>
<h3>Going back to <bdi>BASIC</bdi>: <code>RTS</code></h3>
<p>On the machine, <code>EXEC</code> jumps to the program like <code>JSR</code>, and puts on the stack the place to come back to. At the end of the program write <code>RTS</code>, and the computer goes back to <bdi>BASIC</bdi> and its <code>OK</code>. Whatever you put on the stack (<code>PSHS</code>) take off before the <code>RTS</code>. To see the screen before the <code>OK</code> appears, wait for a key first:</p>
<pre>KEY LDX $A000    * the keyboard check's address
 JSR ,X          * A = the key, or 0
 BEQ KEY         * no key? again
 RTS             * back to BASIC</pre>
<h3>What the page shows, and what only the machine shows</h3>
<p>The page shows the text screen (<code>$0400</code> to <code>$05FF</code>), the memory, the drawers, the lamps and the keyboard check. Sound (<code>$FF20</code>), graphics (<code>PMODE</code>, <code>$FFC0</code>) and other calls into the <bdi>BASIC</bdi> ROM you see only on the machine: the page stops and says "You see this on the machine", and you send it there with the 🐉 button. The page also stops a loop that never ends, and writing outside the program's memory and the screen.</p>
<h3>Where to learn</h3>
<ul>
<li><a href="/en/learn/ch2/">Chapter 2</a>: <code>LDA</code> and <code>STA</code>. <a href="/en/learn/ch5/">Chapter 5</a>: with <code>#</code> or without.</li>
<li><a href="/en/learn/ch6/">Chapter 6</a>: sums. <a href="/en/learn/ch7/">Chapter 7</a>: the finger <code>X</code>. <a href="/en/learn/ch8/">Chapter 8</a>: compare and jump.</li>
<li><a href="/en/learn/ch9/">Chapters 9 to 11</a>: loops, keys and movement. <a href="/en/learn/ch12/">Chapter 12</a>: subroutines and the stack.</li>
<li><a href="/en/learn/ch13/">Chapter 13</a>: the program as numbers. <a href="/en/learn/ch14/">Chapters 14 and 15</a>: the game, and the way to the machine.</li>
</ul>
<p class="asm-own">This is a tool we wrote ourselves, inspired by how <bdi>DREAM</bdi> worked in 1983. <bdi>DREAM</bdi> itself isn't ours, and it isn't on the site.</p>
<p class="asm-own">One difference from <bdi>DREAM</bdi>: square brackets, as in <bdi dir="ltr">JSR [$A000]</bdi>, work here as they do on the real processor. <bdi>DREAM</bdi> ignores them.</p>
</details>`,
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

// the chapters and the landing page are rebuilt from scratch; asm/ (the Assembler) keeps its own files (asm6809.js, asm.js, asm.css)
for (const s of sections) rmSync(join(OUT, 'ch' + s.n), { recursive: true, force: true });
for (const f of ['course.css', 'course.js', 'index.html']) rmSync(join(OUT, f), { force: true });
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

${(s.n === 15 ? s.html.replace('<div id="tool15"></div>', '<div id="tool15"></div>\n    <p class="note">' + T.ch15Asm + '</p>') : s.html).replace('<section class="ch"', '<section class="ch" aria-labelledby="h-ch' + s.n + '"').replace('<h2>', `<h2 id="h-ch${s.n}">`)}

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
<p class="soft">${T.landAsm}</p>
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

// --- the Assembler (/learn/asm/): the frame, the intro and the help here; the tool itself is asm.js + asm6809.js (in learn/asm/).
// shared.js = the course's own send button code and Dragon screen drawing, cut from the course script, so the tape is the same.
{
  const a1 = js.indexOf('/* ---------------- send to the Dragon machine'), a2 = js.indexOf('/* ---------------- ', a1 + 10);
  const b1 = js.indexOf('const VDG = {'), b2 = js.indexOf('function describe(');
  if ([a1, a2, b1, b2].some(i => i < 0)) throw new Error('send/screen code not found in the course script');
  const shared = `// Built by tools/learn/build.mjs from the course script (do not edit): the send button's tape code and the Dragon screen drawing.
"use strict";
const T12 = {};
${js.slice(a1, a2).trim()}
${js.slice(b1, b2).replace(/const SGNAME[^\n]*\n/, '').trim()}
`;
  mkdirSync(join(ROOT, 'learn', 'asm'), { recursive: true });
  writeFileSync(join(ROOT, 'learn', 'asm', 'shared.js'), shared);
  const path = 'asm/';
  const page = `${head(T.asmTitle, T.asmDesc, path).replace('</head>', '<link rel="stylesheet" href="/learn/asm/asm.css">\n</head>')}
<body data-ch="asm">
${siteNav(path)}
<div class="wrap">
<header class="top">
  <div>
    <h1>${T.asmH1}</h1>
    <p class="sub">${T.asmSub}</p>
  </div>
</header>
<div class="asm-intro">
${T.asmIntro.map(p => '<p>' + p + '</p>').join('\n')}
</div>
<div id="asm"><noscript>${HE ? 'האסמבלר צריך JavaScript.' : 'The Assembler needs JavaScript.'}</noscript></div>
${T.asmHelp}
</div>
${foot}
<script src="/learn/asm/shared.js"></script>
<script src="/learn/asm/asm6809.js"></script>
<script src="/learn/asm/asm.js"></script>
</body>
</html>
`;
  mkdirSync(join(OUT, path), { recursive: true });
  writeFileSync(join(OUT, path, 'index.html'), page);
}

// --- sitemap: the landing page and every chapter
const smPath = join(ROOT, 'sitemap.xml');
let sm = readFileSync(smPath, 'utf8').split('\n').filter(l => !l.includes(`<loc>${SITE}${BASE}`)).join('\n');
const urls = ['', ...sections.map(s => `ch${s.n}/`), 'asm/'].map(p => `  <url><loc>${SITE}${BASE}${p}</loc></url>`).join('\n');
sm = sm.replace('</urlset>', urls + '\n</urlset>');
writeFileSync(smPath, sm);

console.log(`learn (${lang}): ${sections.length} chapters → ${BASE} · course.js ${(js.length / 1024).toFixed(0)} KB · course.css ${(css.length / 1024).toFixed(0)} KB`);
