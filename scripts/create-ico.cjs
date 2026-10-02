const fs = require('fs');
const path = require('path');

const png16 = fs.readFileSync(path.resolve(__dirname, '../public/favicon-16x16.png'));
const png32 = fs.readFileSync(path.resolve(__dirname, '../public/favicon-32x32.png'));

const numImages = 2;
const headerSize = 6;
const dirEntrySize = 16;
const header = Buffer.alloc(headerSize);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // ICO type
header.writeUInt16LE(numImages, 4);

let offset = headerSize + (numImages * dirEntrySize);

const entries = [];
const images = [
  { buf: png16, w: 16, h: 16 },
  { buf: png32, w: 32, h: 32 }
];

for (const img of images) {
  const entry = Buffer.alloc(dirEntrySize);
  entry.writeUInt8(img.w === 256 ? 0 : img.w, 0);
  entry.writeUInt8(img.h === 256 ? 0 : img.h, 1);
  entry.writeUInt8(0, 2); // color count
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // planes
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(img.buf.length, 8); // size
  entry.writeUInt32LE(offset, 12); // offset
  entries.push(entry);
  offset += img.buf.length;
}

const ico = Buffer.concat([header, ...entries, png16, png32]);
fs.writeFileSync(path.resolve(__dirname, '../public/favicon.ico'), ico);
fs.writeFileSync(path.resolve(__dirname, '../favicons/favicon.ico'), ico);
console.log('Successfully wrote ICO file:', ico.length, 'bytes');
