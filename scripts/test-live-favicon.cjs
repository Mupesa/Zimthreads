const https = require('https');

function testUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const buf = Buffer.concat(data);
        console.log('URL:', url);
        console.log('Status:', res.statusCode);
        console.log('Content-Type:', res.headers['content-type']);
        console.log('Cache-Control:', res.headers['cache-control']);
        console.log('Content-Length:', res.headers['content-length'] || buf.length);
        console.log('First 20 bytes:', Array.from(buf.slice(0, 20)));
        if (res.headers['content-type'] && res.headers['content-type'].includes('text/html')) {
          console.log('HTML snippet:', buf.slice(0, 200).toString('utf8'));
        }
        console.log('---');
        resolve();
      });
    }).on('error', err => {
      console.error('Error for', url, err.message);
      resolve();
    });
  });
}

async function run() {
  await testUrl('https://www.zimthreads.online/favicon.ico');
  await testUrl('https://www.zimthreads.online/favicon-32x32.png');
  await testUrl('https://www.zimthreads.online/favicon.png');
  await testUrl('https://www.zimthreads.online/apple-touch-icon.png');
  await testUrl('https://www.zimthreads.online/manifest.json');
  await testUrl('https://www.zimthreads.online/');
  await testUrl('https://zimthreads.online/favicon.ico');
}

run();
