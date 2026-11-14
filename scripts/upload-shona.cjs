const fs = require('fs');
const path = require('path');
const { uploadToCloudinary } = require('./upload-cloudinary.cjs');

const files = [
  'shona-republic-tee-white-studio-front.jpg',
  'shona-republic-tee-white-clean-front.jpg',
  'shona-republic-tee-white-studio-back.jpg',
  'shona-republic-tee-black-studio-front.jpg',
  'shona-republic-tee-black-clean-front.jpg',
  'shona-republic-tee-black-studio-back.jpg',
];

async function main() {
  const dir = path.resolve(__dirname, '../public/images/products/republic-of-shona');
  const cachePath = path.resolve(__dirname, '../public/images/products/republic-of-shona/uploaded-shona.json');
  
  let cache = {};
  if (fs.existsSync(cachePath)) {
    try { cache = JSON.parse(fs.readFileSync(cachePath, 'utf8')); } catch (e) {}
  }

  for (const f of files) {
    if (cache[f]) {
      console.log(`Already uploaded ${f}: ${cache[f].cdn_url}`);
      continue;
    }
    const fullPath = path.join(dir, f);
    if (!fs.existsSync(fullPath)) {
      console.warn(`File not found: ${fullPath}`);
      continue;
    }
    console.log(`Uploading ${f}...`);
    try {
      const res = await uploadToCloudinary(fullPath, 'zimthreads/products');
      cache[f] = {
        public_id: res.public_id,
        cdn_url: res.cdn_url,
        direct_url: res.direct_url,
      };
      fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
      console.log(`Success ${f} -> ${res.cdn_url}`);
    } catch (err) {
      console.error(`Failed ${f}:`, err.message);
    }
  }

  console.log('Finished uploading Shona products to Cloudinary:');
  console.log(JSON.stringify(cache, null, 2));
}

main().catch(console.error);
