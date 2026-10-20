import { runRom } from './xr2.mjs';
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
const prog = [
 '10 PMODE 3,1:PCLS 1:SCREEN 1,0',
 '20 LINE(10,10)-(245,181),PSET,B',
 '30 COLOR 4:CIRCLE(128,96),70',
 '40 PAINT(128,96),3,4',
 '50 COLOR 2:DRAW"BM30,150;U20R20D20L20;BM60,150;E15F15L30"',
 '60 CIRCLE(200,50),30,4,.5',
 '70 LINE(20,20)-(80,60),PSET,BF',
 '80 DIM A(20):GET(20,20)-(50,40),A,G:PUT(170,130)-(200,150),A,PSET',
 'RUN'];
const r = await runRom(prog, { timeout: 60, wallTimeout: 120000 });
console.log(r.screen.split('\n').slice(-3).join(' | '));
const pal = [[0,255,0],[255,255,0],[0,0,255],[255,0,0]];
const W = 256, H = 192, S = 3, raw = [];
for (let y = 0; y < H * S; y++) { raw.push(0); for (let x = 0; x < W * S; x++) {
  const px = Math.floor(x / S / 2), py = Math.floor(y / S), b = r.ram[0x600 + py * 32 + (px >> 2)], v = (b >> (6 - 2 * (px & 3))) & 3; raw.push(...pal[v]); } }
const crc = b => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } c = 0xffffffff; for (const x of b) c = t[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W * S, 0); ihdr.writeUInt32BE(H * S, 4); ihdr[8] = 8; ihdr[9] = 2;
writeFileSync(process.argv[2] || 'dragon-graphics.png', Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(Buffer.from(raw))), chunk('IEND', Buffer.alloc(0))]));
