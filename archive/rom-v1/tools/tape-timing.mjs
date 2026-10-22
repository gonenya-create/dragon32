// מדידת זמן מדומה לפי המועד שבו מלכודת המעבד נגישה, ברזולוציה של 0.01 שנייה.
import { runRom } from './xr.mjs';
export async function arrival(lines, options = {}) {
  let low = 0, high = 64;
  while (high - low > 0.01) {
    const timeout = (low + high) / 2;
    try {
      await runRom(lines, { ...options, timeout, wallTimeout: 30000 });
      high = timeout;
    } catch (error) {
      if (!error.message.startsWith('No snapshot:')) throw error;
      low = timeout;
    }
  }
  // הגבול העליון עצמו חייב להפיק צילום מצב.
  await runRom(lines, { ...options, timeout: high, wallTimeout: 30000 });
  return high;
}
