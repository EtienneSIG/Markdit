// Generates a 1024x1024 placeholder source icon (PNG) for Markdit.
// Run: node scripts/gen-placeholder-icon.mjs
// Then: npm run tauri icon src-tauri/icons/source-icon.png
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SIZE = 1024;
const OUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src-tauri',
  'icons',
  'source-icon.png'
);

// Brand colors.
const BG = [37, 99, 235]; // blue
const FG = [255, 255, 255]; // white "M" glyph
const RADIUS = 180;

function inRoundedRect(x, y) {
  const margin = 64;
  const left = margin;
  const right = SIZE - margin;
  const top = margin;
  const bottom = SIZE - margin;
  if (x < left || x > right || y < top || y > bottom) return false;
  // Rounded corners.
  const corners = [
    [left + RADIUS, top + RADIUS],
    [right - RADIUS, top + RADIUS],
    [left + RADIUS, bottom - RADIUS],
    [right - RADIUS, bottom - RADIUS],
  ];
  const nearLeft = x < left + RADIUS;
  const nearRight = x > right - RADIUS;
  const nearTop = y < top + RADIUS;
  const nearBottom = y > bottom - RADIUS;
  let cx = null;
  let cy = null;
  if (nearLeft && nearTop) [cx, cy] = corners[0];
  else if (nearRight && nearTop) [cx, cy] = corners[1];
  else if (nearLeft && nearBottom) [cx, cy] = corners[2];
  else if (nearRight && nearBottom) [cx, cy] = corners[3];
  if (cx !== null) {
    return (x - cx) ** 2 + (y - cy) ** 2 <= RADIUS ** 2;
  }
  return true;
}

// Draw a simple block "M" glyph.
function inGlyph(x, y) {
  const gLeft = 300;
  const gRight = 724;
  const gTop = 320;
  const gBottom = 704;
  if (y < gTop || y > gBottom || x < gLeft || x > gRight) return false;
  const stroke = 90;
  // Left vertical bar.
  if (x <= gLeft + stroke) return true;
  // Right vertical bar.
  if (x >= gRight - stroke) return true;
  // Diagonals meeting in the middle (a "V" inside the M).
  const mid = (gLeft + gRight) / 2;
  const t = (y - gTop) / (gBottom - gTop);
  const leftDiag = gLeft + stroke + t * (mid - gLeft - stroke);
  const rightDiag = gRight - stroke - t * (gRight - stroke - mid);
  if (x >= leftDiag - stroke / 2 && x <= leftDiag + stroke / 2) return true;
  if (x >= rightDiag - stroke / 2 && x <= rightDiag + stroke / 2) return true;
  return false;
}

const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
let p = 0;
for (let y = 0; y < SIZE; y++) {
  raw[p++] = 0; // filter type none
  for (let x = 0; x < SIZE; x++) {
    if (!inRoundedRect(x, y)) {
      raw[p++] = 0;
      raw[p++] = 0;
      raw[p++] = 0;
      raw[p++] = 0; // transparent
    } else if (inGlyph(x, y)) {
      raw[p++] = FG[0];
      raw[p++] = FG[1];
      raw[p++] = FG[2];
      raw[p++] = 255;
    } else {
      raw[p++] = BG[0];
      raw[p++] = BG[1];
      raw[p++] = BG[2];
      raw[p++] = 255;
    }
  }
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;
const idat = deflateSync(raw, { level: 9 });
const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0)),
]);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, png);
console.log(`Wrote ${OUT} (${png.length} bytes)`);
