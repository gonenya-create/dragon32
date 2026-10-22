// מחזיר זיכרון גרפי, מסך טקסט ואוגר פלט מצילום מצב.
// שימוש: node rom/tools/gfxshot.mjs [שורות מופרדות ב-|] [זמן מדומה מרבי בשניות]
import { runRom } from './xr.mjs';
const [typed = '', timeout = '5'] = process.argv.slice(2);
const lines = typed ? typed.split('|') : [];
try {
  const { ram, pia1b } = await runRom(lines, {
    timeout: Number(timeout),
    ...(process.env.GFX_ACTIVE ? { trapSym: 'main_ok', range: lines.length + 1 } : {})
  });
  console.log(JSON.stringify({ memory: ram.subarray(0x600, 0x3000).toString('hex'), pia: pia1b.toString(16).padStart(2, '0'), text: ram.subarray(0x400, 0x600).toString('hex') }));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
