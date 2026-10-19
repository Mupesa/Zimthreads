import fs from 'node:fs';
import path from 'node:path';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || '';
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      process.env[match[1]] = val.trim();
    }
  }
}

console.log('Testing Resend API Key presence:', Boolean(process.env.RESEND_API_KEY));

async function run() {
  const { default: handler, renderZimthreadsProductShowcaseEmail } = await import('../api/send-email.ts');

  // Test 1: HTML template generator
  const testHtml = renderZimthreadsProductShowcaseEmail({
    recipientName: "Anesu",
    headline: "Exclusive Zimthreads Archival Selection",
    introMessage: "We've reserved these two archival pieces for your next showcase.",
    products: [
      {
        id: "prod-1",
        name: "Vintage Marlboro F1 Racing Jacket",
        category: "Archival Racing",
        price: 4500,
        img: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80",
        description: "Heavyweight embroidered cotton canvas racing jacket with iconic archival patches.",
        sizes: ["M", "L", "XL"]
      },
      {
        id: "prod-2",
        name: "LLICYLAND Heavyweight Graphic Tee",
        category: "Streetwear",
        price: 1800,
        img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80",
        description: "260 GSM custom washed streetwear tee with distressed vintage typography.",
        sizes: ["S", "M", "L", "XL", "2XL"]
      }
    ]
  });

  console.log('Test 1 (HTML Generation): SUCCESS, length =', testHtml.length);
  if (!testHtml.includes('Z I M T H R E A D S') || !testHtml.includes('Vintage Marlboro F1 Racing Jacket')) {
    throw new Error('Template missing expected brand content');
  }

  // Test 2: Handler previewOnly
  let previewResponse = null;
  const mockReqPreview = {
    method: 'POST',
    body: {
      adminToken: 'Zimthreads200',
      to: 'anesumupesa@gmail.com',
      recipientName: 'Anesu Mupesa',
      subject: 'Your Curated Zimthreads Selection',
      headline: 'Curated Zimthreads Pieces',
      introMessage: 'Here are the pieces you requested.',
      products: [
        {
          id: 'prod-1',
          name: 'Vintage Marlboro F1 Racing Jacket',
          price: 4500,
          img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80',
          category: 'Archival Racing'
        }
      ],
      previewOnly: true
    }
  };

  const mockResPreview = {
    headers: {},
    setHeader(k, v) { this.headers[k] = v; return this; },
    status(code) { this.statusCode = code; return this; },
    json(data) { previewResponse = data; return this; }
  };

  await handler(mockReqPreview, mockResPreview);
  console.log('Test 2 (Preview Endpoint): statusCode =', mockResPreview.statusCode, 'success =', previewResponse?.success);
  if (!previewResponse?.html) {
    throw new Error('Preview did not return html');
  }

  // Test 3: Live Resend dispatch test to zimthreadmu@gmail.com
  let liveResponse = null;
  const mockReqLive = {
    method: 'POST',
    body: {
      adminToken: 'Zimthreads200',
      to: 'zimthreadmu@gmail.com',
      recipientName: 'Zimthreads Team',
      subject: '✨ Zimthreads Live Showcase Test',
      headline: 'Handpicked Archival Collection',
      introMessage: 'This is a live test dispatch of the Zimthreads Product Showcase Emailer powered by Resend.',
      products: [
        {
          id: 'prod-1',
          name: 'Vintage Marlboro F1 Racing Jacket',
          price: 4500,
          img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80',
          category: 'Archival Racing',
          description: 'Authentic 90s embroidery with padded lining.'
        }
      ]
    }
  };

  const mockResLive = {
    headers: {},
    setHeader(k, v) { this.headers[k] = v; return this; },
    status(code) { this.statusCode = code; return this; },
    json(data) { liveResponse = data; return this; }
  };

  await handler(mockReqLive, mockResLive);
  console.log('Test 3 (Live Resend Dispatch): statusCode =', mockResLive.statusCode, 'data =', liveResponse);
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
