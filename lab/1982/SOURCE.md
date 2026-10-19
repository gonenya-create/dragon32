# מכונת ה-Dragon (בבנייה): מקורות ורישיונות

## האמולטור: XRoar
- **מה זה:** `xroar.js` ו-`xroar.wasm` בתיקייה הזו הם XRoar, האמולטור של Ciaran Anscomb, בגרסה **1.12.1**. בנינו אותם בעצמנו ל-WebAssembly מקוד המקור הרשמי, בלי שינויים.
- **רישיון:** GNU GPL גרסה 3 ומעלה. הטקסט המלא בקובץ `COPYING.GPL` שבתיקייה הזו.
- **קוד המקור המלא של הגרסה הזו:** https://www.6809.org.uk/xroar/dl/xroar-1.12.1.tar.gz. העתק נמצא גם בריפו, ב-`lab/1982/xroar-1.12.1.tar.gz`.
- **איך בנינו:**
  - `emconfigure ./configure --host=wasm32-unknown-emscripten --enable-wasm`
  - `emmake make`
  - הפרטים ב-`rom/README.md`.

## ה-BASIC: Dragon 1982 BASIC
- **מה זה:** הקבצים `d32.rom` (ה-BASIC, ב-$8000) ו-`d32x.rom` (שבב ההרחבה בחריץ המחסנית, ב-$C000) הם ה-BASIC שכתבנו מאפס לשבב 6809. אין בהם שום חלק מה-ROM המקורי של Dragon Data או של Microsoft.
- **קוד המקור:** בתיקייה `rom/` בריפו https://github.com/gonenya-create/dragon32.
- **רישיון:** MIT.
- **השראה:** פורמט המספרים לפי BASIC-M6502 של Microsoft, שהוא קוד פתוח ברישיון MIT (`rom/LICENSE-MSBASIC`).

## הדף הזה
- **מה כולל:** הדף, המקלדת המצוירת וה-ROM.
- **רישיון:** הקוד שלנו ב-MIT, ולכן אפשר להפיץ אותו יחד עם XRoar לפי תנאי ה-GPL.
