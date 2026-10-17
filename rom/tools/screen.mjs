// בונה ROM זמני ומציג את מסך הטקסט מצילום מצב.
// שימוש: node rom/tools/screen.mjs [שורות מופרדות ב-|] [זמן מדומה מרבי בשניות]
import { runRom } from './xr.mjs';
const [typed = '', timeout = '5'] = process.argv.slice(2);
try {
  console.log((await runRom(typed ? typed.split('|') : [], { timeout: Number(timeout) })).screen);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
