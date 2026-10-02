const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const srcImage = path.resolve(__dirname, '../favicons/android-chrome-512x512.png');
  const pubDir = path.resolve(__dirname, '../public');
  const favDir = path.resolve(__dirname, '../favicons');

  console.log('Generating complete favicon suite from:', srcImage);

  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48x48.png', size: 48 }, // Google exact requirement (48px square multiple)
    { name: 'favicon-96x96.png', size: 96 },
    { name: 'favicon-144x144.png', size: 144 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-512x512.png', size: 512 },
  ];

  const buffers = {};

  for (const item of sizes) {
    const buf = await sharp(srcImage)
      .resize(item.size, item.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    buffers[item.size] = buf;
    fs.writeFileSync(path.join(pubDir, item.name), buf);
    fs.writeFileSync(path.join(favDir, item.name), buf);
    console.log(`✓ Wrote ${item.name} (${item.size}x${item.size}, ${buf.length} bytes)`);
  }

  // Also write fallback favicon.png (48x48)
  fs.writeFileSync(path.join(pubDir, 'favicon.png'), buffers[48]);
  fs.writeFileSync(path.join(favDir, 'favicon.png'), buffers[48]);

  // Build binary multi-frame ICO container (16x16, 32x32, 48x48)
  const icoFrames = [
    { buf: buffers[16], w: 16, h: 16 },
    { buf: buffers[32], w: 32, h: 32 },
    { buf: buffers[48], w: 48, h: 48 },
  ];

  const numImages = icoFrames.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(numImages, 4);

  let offset = headerSize + (numImages * dirEntrySize);
  const entries = [];

  for (const img of icoFrames) {
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

  const icoBuf = Buffer.concat([header, ...entries, ...icoFrames.map(f => f.buf)]);
  fs.writeFileSync(path.join(pubDir, 'favicon.ico'), icoBuf);
  fs.writeFileSync(path.join(favDir, 'favicon.ico'), icoBuf);
  console.log(`✓ Wrote multi-resolution favicon.ico (${icoBuf.length} bytes containing 16px, 32px, and 48px frames)`);
}

main().catch(err => {
  console.error('Failed to generate favicons:', err);
  process.exit(1);
});
