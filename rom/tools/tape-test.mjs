// בדיקות קלטת דרך החומרה המדומה בלבד; הקבצים נוצרים לפי תיעוד הפורמט.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runRom } from './xr.mjs';

const options = { timeout: 120, wallTimeout: 30000 };
async function temporary(fn) {
  const dir = await mkdtemp(join(tmpdir(), 'dragon-tape-'));
  try { await fn(dir); } finally { await rm(dir, { recursive: true, force: true }); }
}
function block(type, data = Buffer.alloc(0)) {
  return Buffer.from([0x55, 0x3c, type, data.length, ...data,
    (type + data.length + [...data].reduce((a, b) => a + b, 0)) & 255, 0x55]);
}
function cassette(name, text, { type = 0, ascii = 255, chunk = 255 } = {}) {
  const header = Buffer.from([...Buffer.from(name.padEnd(8)), type, ascii, 255, 0, 0, 0, 0]);
  const data = Buffer.from(text);
  const parts = [Buffer.alloc(128, 0x55), block(0, header), Buffer.alloc(128, 0x55)];
  for (let i = 0; i < data.length; i += chunk) parts.push(block(1, data.subarray(i, i + chunk)));
  parts.push(block(255));
  return Buffer.concat(parts);
}
function program(ram) {
  const lines = [];
  for (let p = 0x1e00, next; (next = ram.readUInt16BE(p)); p = next) {
    assert.ok(next > p && next < 0x7b00, 'valid program links');
    const end = ram.indexOf(0, p + 4);
    lines.push(`${ram.readUInt16BE(p + 2)} ${ram.toString('ascii', p + 4, end)}`);
  }
  return lines;
}
function idle(result) {
  assert.equal(result.pia1cra & 8, 0, 'motor off');
  assert.equal(result.pia0crb & 0x3f, 5, '50 Hz IRQ configuration restored');
  assert.doesNotMatch(result.screen, /\?\w+ ERROR/);
}

test('CSAVE to real CAS, CLOAD and LIST in a second emulator', () => temporary(async dir => {
  const tape = join(dir, 'out.cas');
  const lines = ['10 PRINT "HELLO"', '20 PRINT 42'];
  const saved = await runRom([...lines, 'CSAVE "TEST",A'], { ...options, tapeWrite: tape });
  idle(saved);
  const bytes = await readFile(tape);
  const header = bytes.indexOf(Buffer.from([0x55, 0x3c, 0, 15]));
  assert.ok(header >= 128);
  assert.deepEqual(bytes.subarray(header + 4, header + 19),
    Buffer.from([...Buffer.from('TEST    '), 0, 255, 255, 0, 0, 0, 0]));
  assert.ok(bytes.includes(Buffer.from(lines.join('\r') + '\r')));
  const loaded = await runRom(['CLOAD "TEST"', 'LIST'], { ...options, tapeLoad: tape });
  idle(loaded);
  assert.deepEqual(program(loaded.ram), lines);
  assert.match(loaded.screen, /S\nF TEST/);
  assert.match(loaded.screen, /LIST\n10 PRINT "HELLO"\n20 PRINT 42\nOK/);
}));

test('WAV uses the real DAC output and comparator input', () => temporary(async dir => {
  const tape = join(dir, 'out.wav');
  await runRom(['10 PRINT "WAVE"', 'CSAVE "TEST"'], { ...options, tapeWrite: tape });
  const loaded = await runRom(['CLOAD', 'LIST'], { ...options, tapeLoad: tape });
  idle(loaded);
  assert.deepEqual(program(loaded.ram), ['10 PRINT "WAVE"']);
}));

test('20 lines cross data blocks and are saved again without loss', () => temporary(async dir => {
  const tape = join(dir, 'twenty.cas'), saved = join(dir, 'again.cas');
  const lines = Array.from({ length: 20 }, (_, i) => `${(i + 1) * 10} REM LINE ${i + 1} WITH SOME TEXT`);
  await writeFile(tape, cassette('TWENTY', lines.join('\r') + '\r'));
  const loaded = await runRom(['CLOAD "TWENTY"', 'CSAVE "TWENTY"'], { ...options, tapeLoad: tape, tapeWrite: saved });
  idle(loaded);
  assert.deepEqual(program(loaded.ram), lines);
  const again = await runRom(['CLOAD "TWENTY"'], { ...options, tapeLoad: saved });
  idle(again);
  assert.deepEqual(program(again.ram), lines);
}));

test('wrong filenames are skipped; only the matching program is loaded', () => temporary(async dir => {
  const tape = join(dir, 'names.cas');
  await writeFile(tape, Buffer.concat([
    cassette('OTHER', '10 PRINT "WRONG"\r'), cassette('RIGHT', '20 PRINT "RIGHT"\r')
  ]));
  const loaded = await runRom(['10 PRINT "OLD"', 'CLOAD "RIGHT"'], { ...options, tapeLoad: tape });
  idle(loaded);
  assert.deepEqual(program(loaded.ram), ['20 PRINT "RIGHT"']);
  assert.match(loaded.screen, /S\nF OTHER[\s\S]*F RIGHT/);
}));

test('a corrupted data byte reports IO and restores hardware', () => temporary(async dir => {
  const tape = join(dir, 'bad.cas');
  const bytes = cassette('BAD', '10 PRINT 42\r');
  const data = bytes.indexOf(Buffer.from([0x55, 0x3c, 1]));
  bytes[data + 8] ^= 1;
  await writeFile(tape, bytes);
  const loaded = await runRom(['CLOAD "BAD"', 'PRINT 7'], { ...options, tapeLoad: tape });
  assert.match(loaded.screen, /\?IO ERROR\nOK\nPRINT 7\n 7\nOK/);
  assert.equal(loaded.pia1cra & 8, 0);
  assert.equal(loaded.pia0crb & 0x3f, 5);
}));

for (const [label, settings] of [['machine code', { type: 2, ascii: 0 }],
  ['tokenised BASIC', { ascii: 0 }], ['ASCII data file', { type: 1 }]]) {
  test(`${label} reports FM`, () => temporary(async dir => {
    const tape = join(dir, 'format.cas');
    await writeFile(tape, cassette('FORMAT', '10 PRINT 1\r', settings));
    const loaded = await runRom(['CLOAD "FORMAT"'], { ...options, tapeLoad: tape });
    assert.match(loaded.screen, /\?FM ERROR\nOK/);
    assert.equal(loaded.pia1cra & 8, 0);
    assert.deepEqual(program(loaded.ram), []);
  }));
}

test('an empty program overwrites the old program and can be run', () => temporary(async dir => {
  const tape = join(dir, 'empty.cas');
  idle(await runRom(['CSAVE "EMPTY"'], { ...options, tapeWrite: tape }));
  const loaded = await runRom(['10 PRINT "OLD"', 'CLOAD "EMPTY"', 'LIST', 'RUN'], { ...options, tapeLoad: tape });
  idle(loaded);
  assert.deepEqual(program(loaded.ram), []);
  assert.match(loaded.screen, /LIST\nOK\nRUN\nOK/);
}));

test('MOTOR and AUDIO control their PIA pins', async () => {
  const on = await runRom(['MOTOR ON', 'AUDIO ON']);
  assert.equal(on.pia1cra & 0x3c, 0x38);
  assert.equal(on.pia1crb & 0x38, 0x38);
  assert.equal(on.pia0cra & 0x38, 0x38);
  assert.equal(on.pia0crb & 0x38, 0x30);
  const off = await runRom(['MOTOR ON:MOTOR OFF', 'AUDIO ON:AUDIO OFF']);
  assert.equal(off.pia1cra & 0x38, 0x30);
  assert.equal(off.pia1crb & 0x38, 0x30);
  assert.match(off.screen, /AUDIO OFF\nOK/);
});

for (const command of ['CSAVE', 'CSAVE "123456789"', 'CSAVE "UNCLOSED',
  'CSAVE "A",B', 'CSAVE "A",AX', 'CLOAD X', 'CLOAD "A" X', 'MOTOR ONCE', 'AUDIO OFFX']) {
  test(`invalid syntax: ${command}`, async () => {
    const result = await runRom([command]);
    assert.match(result.screen, /\?(?:SN|FC) ERROR\nOK/);
    assert.equal(result.pia1cra & 8, 0);
  });
}

for (const text of ['PRINT 1\r', '64000 PRINT 1\r', `10 ${'X'.repeat(248)}\r`, '10 PRINT 1', '10 PRINT\t1\r']) {
  test(`malformed ASCII line is IO: ${JSON.stringify(text.slice(0, 25))}`, () => temporary(async dir => {
    const tape = join(dir, 'badline.cas');
    await writeFile(tape, cassette('LINE', text));
    const loaded = await runRom(['CLOAD "LINE"'], { ...options, tapeLoad: tape });
    assert.match(loaded.screen, /\?IO ERROR\nOK/);
    assert.equal(loaded.pia1cra & 8, 0);
  }));
}

test('line zero, five digit numbers, and lines split across blocks', () => temporary(async dir => {
  const tape = join(dir, 'split.cas'), copy = join(dir, 'copy.cas');
  const lines = ['0 PRINT "ZERO"', '9 PRINT 9', '1000 PRINT 1000', '63999 PRINT "LAST"'];
  await writeFile(tape, cassette('SPLIT', lines.join('\r') + '\r', { chunk: 7 }));
  const loaded = await runRom(['CLOAD "SPLIT"', 'CSAVE "SPLIT"'], { ...options, tapeLoad: tape, tapeWrite: copy });
  idle(loaded);
  assert.deepEqual(program(loaded.ram), lines);
  const again = await runRom(['CLOAD'], { ...options, tapeLoad: copy });
  idle(again);
  assert.deepEqual(program(again.ram), lines);
}));

for (const command of ['CLOAD', 'CSAVE "BREAK"']) {
  test(`BREAK aborts ${command} and stops the motor`, async () => {
    const result = await runRom([command], { ...options, tapeBreak: true });
    assert.match(result.screen, /\nBREAK\nOK/);
    assert.doesNotMatch(result.screen, /\?\w+ ERROR/);
    assert.equal(result.pia1cra & 8, 0);
    assert.equal(result.pia0crb & 0x3f, 5);
  });
}

test('a program exceeding the interpreter limit reports OM with the motor off', () => temporary(async dir => {
  const tape = join(dir, 'huge.cas');
  const lines = Array.from({ length: 110 }, (_, i) => `${i + 1} REM ${'X'.repeat(230)}`);
  await writeFile(tape, cassette('HUGE', lines.join('\r') + '\r'));
  const loaded = await runRom(['CLOAD "HUGE"'], { timeout: 300, wallTimeout: 30000, tapeLoad: tape });
  assert.match(loaded.screen, /\?OM ERROR\nOK/);
  assert.equal(loaded.pia1cra & 8, 0);
  assert.ok(loaded.ram.readUInt16BE(0x90) < 0x7b00);
}));

test('graphics pages are preserved by saving and loading', () => temporary(async dir => {
  const tape = join(dir, 'graphics.cas');
  const setup = ['PMODE 4,1', 'PCLS 1'];
  const before = await runRom(setup);
  const saved = await runRom([...setup, '10 PRINT 1', 'CSAVE "GFX"'], { ...options, tapeWrite: tape });
  assert.deepEqual(saved.ram.subarray(0x600, 0x1e00), before.ram.subarray(0x600, 0x1e00));
  const loaded = await runRom([...setup, 'CLOAD "GFX"'], { ...options, tapeLoad: tape });
  idle(loaded);
  assert.deepEqual(loaded.ram.subarray(0x600, 0x1e00), before.ram.subarray(0x600, 0x1e00));
}));

test('20-line save/load timing in emulated seconds', () => temporary(async dir => {
  const { arrival } = await import('./tape-timing.mjs');
  const input = join(dir, 'timing-input.cas'), output = join(dir, 'timing-output.cas');
  const lines = Array.from({ length: 20 }, (_, i) => `${(i + 1) * 10} REM LINE ${i + 1} WITH SOME TEXT`);
  await writeFile(input, cassette('TWENTY', lines.join('\r') + '\r'));
  const commands = ['CLOAD "TWENTY"', 'CSAVE "TWENTY"'];
  const saveStart = await arrival(commands, { tapeLoad: input, trapSym: 't_save' });
  const saveEnd = await arrival(commands, { tapeLoad: input, tapeWrite: output });
  const loadCommands = ['CLOAD "TWENTY"'];
  const loadStart = await arrival(loadCommands, { tapeLoad: output, trapSym: 't_load' });
  const loadEnd = await arrival(loadCommands, { tapeLoad: output });
  const savedSeconds = saveEnd - saveStart, loadedSeconds = loadEnd - loadStart;
  assert.ok(savedSeconds > 1 && savedSeconds < 30);
  assert.ok(loadedSeconds > 1 && loadedSeconds < 30);
  console.log(`20 lines (${Buffer.byteLength(lines.join('\r') + '\r')} ASCII bytes): save ${savedSeconds.toFixed(2)} s; load ${loadedSeconds.toFixed(2)} s (emulated, +/-0.02 s)`);
}));

test('a maximum typed line without a separator survives canonical saving', () => temporary(async dir => {
  const tape = join(dir, 'maximum.cas'), copy = join(dir, 'maximum-copy.cas');
  const text = `1REM ${'X'.repeat(244)}`;
  assert.equal(text.length, 249);
  await writeFile(tape, cassette('MAX', text + '\r'));
  const loaded = await runRom(['CLOAD "MAX"', 'CSAVE "MAX"'], { ...options, tapeLoad: tape, tapeWrite: copy });
  idle(loaded);
  const again = await runRom(['CLOAD "MAX"'], { ...options, tapeLoad: copy });
  idle(again);
  assert.deepEqual(program(again.ram), program(loaded.ram));
}));
