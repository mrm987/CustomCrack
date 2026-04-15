// CustomCrack 아이콘 생성 스크립트
// 256x256 PNG → ICO 변환

const fs = require('fs');
const path = require('path');
const { default: pngToIco } = require('png-to-ico');

// 256x256 PNG를 순수 JS로 생성 (zlib 없이 비압축 PNG)
function createPNG(width, height, pixels) {
  function crc32(buf) {
    let c;
    const table = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
    c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function adler32(buf) {
    let a = 1, b = 0;
    for (let i = 0; i < buf.length; i++) {
      a = (a + buf[i]) % 65521;
      b = (b + a) % 65521;
    }
    return ((b << 16) | a) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeB = Buffer.from(type);
    const crcData = Buffer.concat([typeB, data]);
    const crcB = Buffer.alloc(4);
    crcB.writeUInt32BE(crc32(crcData));
    return Buffer.concat([len, typeB, data, crcB]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Raw image data with filter bytes
  const rawRows = [];
  for (let y = 0; y < height; y++) {
    rawRows.push(Buffer.from([0])); // filter none
    const row = Buffer.alloc(width * 4);
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      row[x * 4] = pixels[idx];
      row[x * 4 + 1] = pixels[idx + 1];
      row[x * 4 + 2] = pixels[idx + 2];
      row[x * 4 + 3] = pixels[idx + 3];
    }
    rawRows.push(row);
  }
  const rawData = Buffer.concat(rawRows);

  // zlib stored (no compression) wrapping
  const blocks = [];
  const BLOCK_SIZE = 65535;
  for (let i = 0; i < rawData.length; i += BLOCK_SIZE) {
    const end = Math.min(i + BLOCK_SIZE, rawData.length);
    const isLast = end === rawData.length;
    const blockData = rawData.slice(i, end);
    const header = Buffer.alloc(5);
    header[0] = isLast ? 1 : 0;
    header.writeUInt16LE(blockData.length, 1);
    header.writeUInt16LE(~blockData.length & 0xffff, 3);
    blocks.push(header, blockData);
  }

  const deflateData = Buffer.concat(blocks);
  const adler = adler32(rawData);
  const zlibHeader = Buffer.from([0x78, 0x01]);
  const adlerB = Buffer.alloc(4);
  adlerB.writeUInt32BE(adler);
  const idatData = Buffer.concat([zlibHeader, deflateData, adlerB]);

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idatData), iend]);
}

// 아이콘 디자인: 보라색 둥근 사각형 + C⚙ 심볼
const SIZE = 256;
const pixels = new Uint8Array(SIZE * SIZE * 4);

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const idx = (y * SIZE + x) * 4;

    // 둥근 사각형 배경
    const margin = 16;
    const radius = 48;
    const inX = x >= margin && x < SIZE - margin;
    const inY = y >= margin && y < SIZE - margin;

    let inside = false;
    if (inX && inY) {
      const lx = x - margin;
      const ly = y - margin;
      const w = SIZE - margin * 2;
      const h = SIZE - margin * 2;

      if (lx < radius && ly < radius) {
        inside = Math.hypot(lx - radius, ly - radius) <= radius;
      } else if (lx > w - radius && ly < radius) {
        inside = Math.hypot(lx - (w - radius), ly - radius) <= radius;
      } else if (lx < radius && ly > h - radius) {
        inside = Math.hypot(lx - radius, ly - (h - radius)) <= radius;
      } else if (lx > w - radius && ly > h - radius) {
        inside = Math.hypot(lx - (w - radius), ly - (h - radius)) <= radius;
      } else {
        inside = true;
      }
    }

    if (inside) {
      // 빨간 배경 (크랙 색상 #FF4438)
      pixels[idx] = 0xFF;
      pixels[idx + 1] = 0x44;
      pixels[idx + 2] = 0x38;
      pixels[idx + 3] = 255;

      // "CC" — 둥근 C 2개, 겹치게 (검정)
      const c1x = SIZE / 2 - 28;
      const c1y = SIZE / 2 - 25;
      const c2x = SIZE / 2 + 32;
      const c2y = SIZE / 2 + 25;

      const d1 = Math.hypot(x - c1x, y - c1y);
      const a1 = Math.atan2(y - c1y, x - c1x);
      const d2 = Math.hypot(x - c2x, y - c2y);
      const a2 = Math.atan2(y - c2y, x - c2x);

      const isC2 = d2 > 26 && d2 < 52 && (a2 < -0.5 || a2 > 0.5);
      const isC1 = d1 > 26 && d1 < 52 && (a1 < -0.5 || a1 > 0.5);

      if (isC1 || isC2) {
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 255;
      }
    } else {
      pixels[idx] = 0;
      pixels[idx + 1] = 0;
      pixels[idx + 2] = 0;
      pixels[idx + 3] = 0;
    }
  }
}

const pngBuf = createPNG(SIZE, SIZE, pixels);
const pngPath = path.join(__dirname, '..', 'build', 'icon.png');
const icoPath = path.join(__dirname, '..', 'build', 'icon.ico');

fs.mkdirSync(path.join(__dirname, '..', 'build'), { recursive: true });
fs.writeFileSync(pngPath, pngBuf);
console.log('PNG created:', pngPath);

pngToIco(pngBuf).then(ico => {
  fs.writeFileSync(icoPath, ico);
  console.log('ICO created:', icoPath);
}).catch(err => {
  console.error('ICO conversion failed:', err);
});
