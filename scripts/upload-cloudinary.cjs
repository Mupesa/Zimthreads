#!/usr/bin/env node

/**
 * Cloudinary Upload Tool for Zimthreads
 * Usage:
 *   node scripts/upload-cloudinary.cjs <file-or-url> [folder] [--cloud <cloud_name>]
 * Examples:
 *   node scripts/upload-cloudinary.cjs public/images/products/black-hoodie.jpg zimthreads/products
 *   node scripts/upload-cloudinary.cjs https://example.com/shoe.jpg zimthreads/restorations
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function loadCredentials(cliCloudName) {
  let cloudName = cliCloudName || process.env.CLOUDINARY_CLOUD_NAME || '';
  let apiKey = process.env.CLOUDINARY_API_KEY || '';
  let apiSecret = process.env.CLOUDINARY_API_SECRET || '';

  // 1. Check .env.local or .env
  const envFiles = ['.env.local', '.env'];
  for (const ef of envFiles) {
    const envPath = path.resolve(process.cwd(), ef);
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('CLOUDINARY_CLOUD_NAME=')) cloudName = cloudName || trimmed.split('=')[1].replace(/["']/g, '').trim();
        if (trimmed.startsWith('CLOUDINARY_API_KEY=')) apiKey = apiKey || trimmed.split('=')[1].replace(/["']/g, '').trim();
        if (trimmed.startsWith('CLOUDINARY_API_SECRET=')) apiSecret = apiSecret || trimmed.split('=')[1].replace(/["']/g, '').trim();
      }
    }
  }

  // 2. Check "api keys/api keys.txt"
  const apiKeysPath = path.resolve(process.cwd(), 'api keys/api keys.txt');
  if (fs.existsSync(apiKeysPath)) {
    const lines = fs.readFileSync(apiKeysPath, 'utf8').split('\n').map(l => l.trim()).filter(Boolean);
    for (const l of lines) {
      if (/cloud[\s_-]*name[:=\s]+([a-zA-Z0-9_-]+)/i.test(l)) {
        const m = l.match(/cloud[\s_-]*name[:=\s]+([a-zA-Z0-9_-]+)/i);
        if (m) cloudName = cloudName || m[1].trim();
      } else if (l.toLowerCase().startsWith('api_key:') || l.toLowerCase().startsWith('api_key=')) {
        apiKey = apiKey || l.split(/[:=]/)[1].trim();
      } else if (l.toLowerCase().startsWith('api_secret:') || l.toLowerCase().startsWith('api_secret=')) {
        apiSecret = apiSecret || l.split(/[:=]/)[1].trim();
      } else if (l.startsWith('cloudinary://')) {
        const match = l.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
        if (match) {
          apiKey = apiKey || match[1].trim();
          apiSecret = apiSecret || match[2].trim();
          cloudName = cloudName || match[3].trim();
        }
      }
    }

    // Positional lines if not key-value:
    if (!apiKey && lines.length >= 2) {
      if (/^\d+$/.test(lines[0])) {
        apiKey = lines[0];
        apiSecret = lines[1];
        if (lines[2] && !cloudName) {
          const match = lines[2].match(/([a-zA-Z0-9_-]+)$/);
          if (match) cloudName = match[1];
        }
      }
    } else if (apiKey && !cloudName && lines.length >= 3) {
      const match = lines[2].match(/([a-zA-Z0-9_-]+)$/);
      if (match) cloudName = match[1];
    }
  }

  return { cloudName, apiKey, apiSecret };
}

async function uploadToCloudinary(filePathOrUrl, folder = 'zimthreads', cliCloudName = '') {
  const { cloudName, apiKey, apiSecret } = loadCredentials(cliCloudName);

  if (!cloudName) {
    throw new Error(
      `Missing Cloudinary Cloud Name.\n` +
      `We found your API Key (${apiKey ? '***' + apiKey.slice(-4) : 'none'}) and API Secret in "api keys/api keys.txt".\n` +
      `Please add your Cloud Name as the 3rd line in "api keys/api keys.txt" or specify --cloud <name>.`
    );
  }

  if (!apiKey || !apiSecret) {
    throw new Error(
      `Missing Cloudinary API Key or Secret in "api keys/api keys.txt".`
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  
  // Sort parameters for SHA-1 signature
  const signParams = [];
  if (folder) signParams.push(`folder=${folder}`);
  signParams.push(`timestamp=${timestamp}`);
  signParams.sort();
  
  const signString = `${signParams.join('&')}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(signString).digest('hex');

  let filePayload = filePathOrUrl;
  if (!filePathOrUrl.startsWith('http://') && !filePathOrUrl.startsWith('https://')) {
    const resolved = path.resolve(filePathOrUrl);
    if (!fs.existsSync(resolved)) {
      throw new Error(`File does not exist at: ${resolved}`);
    }
    const buffer = fs.readFileSync(resolved);
    const ext = path.extname(resolved).toLowerCase().replace('.', '');
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'svg' ? 'image/svg+xml' : 'image/jpeg';
    filePayload = `data:${mime};base64,${buffer.toString('base64')}`;
  }

  const formData = new URLSearchParams();
  formData.append('file', filePayload);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  if (folder) formData.append('folder', folder);
  formData.append('signature', signature);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(`Cloudinary error (${response.status}): ${result.error?.message || JSON.stringify(result)}`);
  }

  // Construct auto-optimized CDN URL
  const optimizedUrl = result.secure_url.replace(
    `/upload/v${result.version}/`,
    `/upload/f_auto,q_auto/v${result.version}/`
  );

  return {
    public_id: result.public_id,
    version: result.version,
    format: result.format,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    raw_url: result.secure_url,
    cdn_url: optimizedUrl,
  };
}

// CLI handler
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node scripts/upload-cloudinary.cjs <file_path_or_url> [folder] [--cloud <cloud_name>]');
    process.exit(1);
  }

  const targetFile = args[0];
  let targetFolder = 'zimthreads';
  let cliCloud = '';

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--cloud' && args[i + 1]) {
      cliCloud = args[i + 1];
      i++;
    } else if (!args[i].startsWith('--')) {
      targetFolder = args[i];
    }
  }

  console.log(`Uploading "${targetFile}" to Cloudinary (folder: "${targetFolder}")...`);
  uploadToCloudinary(targetFile, targetFolder, cliCloud)
    .then((res) => {
      console.log('\nUpload Successful!');
      console.log('----------------------------------------------------');
      console.log('Public ID:      ', res.public_id);
      console.log('Direct URL:     ', res.raw_url);
      console.log('Optimized CDN:  ', res.cdn_url);
      console.log('----------------------------------------------------');
      console.log('\nYou can copy & paste the Optimized CDN URL directly into seedData.ts or your components.');
    })
    .catch((err) => {
      console.error('\nUpload Failed:', err.message);
      process.exit(1);
    });
}

module.exports = { uploadToCloudinary, loadCredentials };
