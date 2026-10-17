// בדיקות לתשתית ההרצה ולשגיאות, בלי ניסיונות חוזרים.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runRom } from './xr.mjs';

test('snapshot contains text, RAM and PIA1 B', async () => {
  const { ram, screen, pia1b } = await runRom(['PRINT 2+3']);
  assert.equal(ram.length, 32768);
  assert.match(screen, /\n 5\nOK/);
  assert.equal(pia1b & 0xf8, 0);
});
test('input limit includes carriage returns', async () => {
  await assert.rejects(runRom(['A'.repeat(255)]), /255 bytes/);
});
test('unknown trap symbol is reported', async () => {
  await assert.rejects(runRom([], { trapSym: 'missing_symbol' }), /Unknown trap symbol/);
});
test('endless program reports missing snapshot', async () => {
  await assert.rejects(runRom(['10 GOTO 10', 'RUN'], { timeout: 0.05 }), /No snapshot/);
});
test('trap range captures final graphics command', async () => {
  const { pia1b } = await runRom(['PMODE 4,1', 'SCREEN 1,1'], { trapSym: 'main_ok', range: 3 });
  assert.equal(pia1b & 0xf8, 0xf8);
});

test('ROM consumes 250 bytes through the final CR', async () => {
  const { screen } = await runRom([...Array(241).fill(''), 'PRINT 42']);
  assert.match(screen, /\n 42\nOK/);
});
