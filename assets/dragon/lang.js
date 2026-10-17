// שפת הממשק: עברית (הדף /) או אנגלית (הדף /en/). נקבעת לפי lang של הדף עצמו.
// בכל מקום שיש טקסט לגולש: tr('בעברית', 'In English'). קוד BASIC ומה שעל מסך המחשב נשארים באנגלית בשתי השפות.
// בלי דפדפן (בדיקות ב-Node): עברית
export const EN = typeof document !== 'undefined' && (document.documentElement.lang || '').toLowerCase().startsWith('en');
export const tr = (he, en) => (EN ? en : he);
