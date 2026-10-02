const fs = require('fs');
const path = require('path');
const { uploadToCloudinary } = require('./upload-cloudinary.cjs');

async function main() {
  const braceletsDir = path.resolve(__dirname, '../bracelets');
  const cachePath = path.resolve(__dirname, '../bracelets-uploaded.json');
  
  let cache = {};
  if (fs.existsSync(cachePath)) {
    try {
      cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    } catch (e) {
      cache = {};
    }
  }

  const files = fs.readdirSync(braceletsDir).filter(f => f.endsWith('.png'));
  console.log(`Found ${files.length} bracelet images to process.`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (cache[file]) {
      console.log(`[${i + 1}/${files.length}] Already uploaded: ${file} -> ${cache[file].cdn_url}`);
      continue;
    }

    const filePath = path.join(braceletsDir, file);
    console.log(`[${i + 1}/${files.length}] Uploading ${file}...`);
    try {
      const res = await uploadToCloudinary(filePath, 'zimthreads/bracelets');
      cache[file] = {
        cdn_url: res.cdn_url,
        public_id: res.public_id,
        filename: file
      };
      fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
      console.log(`Uploaded: ${res.cdn_url}`);
    } catch (err) {
      console.error(`Error uploading ${file}:`, err.message);
    }
  }

  console.log('\nFinished all uploads!');
  console.log(JSON.stringify(cache, null, 2));
}

main().catch(console.error);
