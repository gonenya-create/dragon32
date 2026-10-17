import assert from 'node:assert/strict';
import { runRom } from './xr.mjs';
const cases = [
  ['SOUND 128,1', s => { assert.ok(!s.screen.includes('ERROR')); assert.ok(s.ram.readUInt16BE(0x3c0) > 100); }],
  ['SOUNDX=7:PLAYX=8:PRINT SOUNDX+PLAYX', s => assert.ok(s.screen.includes('15'))],
  ['PLAY "T255O4L16V12C#D-E+FGABP16N12"', s => { assert.ok(!s.screen.includes('ERROR')); assert.ok(s.ram.readUInt16BE(0x3c0) > 100); }],
  ...['SOUND 0,1','SOUND 1,0','SOUND 256,1','PLAY "O6C"','PLAY "L0C"','PLAY "Q"','PLAY "T0C"','PLAY "V32C"','PLAY "N13"','PLAY "C'].map(cmd => [cmd,s => assert.ok(s.screen.includes('ERROR'))]),
];
export async function testSound() {
 for (const [cmd, check] of cases) { const s = await runRom([cmd]); check(s); assert.ok(/\nOK(?:\no)?$/.test(s.screen)); }
 const high = await runRom(['SOUND 128,1'], { trapSym: 'sn_sample', range: '4' });
 assert.equal(high.pia1a & 0xfc, 0xfc);
 assert.equal(high.pia1cra & 4, 4);
 assert.equal(high.pia1crb & 0x38, 0x38);
 assert.equal(high.pia0cra & 0x38, 0x30);
 assert.equal(high.pia0crb & 0x38, 0x30);
 const low = await runRom(['SOUND 128,1'], { trapSym: 'sn_sample', range: '2' });
 assert.equal(low.pia1a & 0xfc, 0);
 const baseline = await runRom([]);
 const done = await runRom(['SOUND 128,1']);
 for (const key of ['pia1cra','pia1crb','pia0cra','pia0crb']) assert.equal(done[key], baseline[key]);
 assert.equal(done.pia1b & 0xf8, baseline.pia1b & 0xf8);
 const mute = await runRom(['PLAY "T255V0C"'], { trapSym: 'sn_sample', range: '4' });
 assert.equal(mute.pia1a & 0xfc, 0);
 const duration = await runRom(['SOUND 255,2']);
 assert.equal(duration.ram.readUInt16BE(0x3c0), 800);
 const rest = await runRom(['PLAY "T255P16"'], { trapSym: 'sn_sample', range: '4' });
 assert.equal(rest.pia1a & 0xfc, 0);
 const full = await runRom(['SOUND 1,255'], { timeout: 16 });
 assert.equal(full.ram.readUInt16BE(0x3c0), (400 * 255) & 65535);
 const scale = await runRom(['PLAY "T255O2;1;3;5;6;8;10;12"']);
 assert.ok(!scale.screen.includes('ERROR'));
 console.log(`${cases.length + 8} sound tests passed`);
}
if (process.argv[1] === new URL(import.meta.url).pathname) await testSound();
