import fs from 'fs'
import crypto from 'crypto'

const cloudName = 'pwranjbq'
const apiKey = '288594454619237'
const apiSecret = 'LaOHsEsChdjb71UP8HTO4XZj9uU'
const folder = 'zimthreads/bracelets'

async function uploadFile(filePath, filename) {
  const timestamp = Math.floor(Date.now() / 1000)
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
  const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex')

  const fileData = fs.readFileSync(filePath)
  const blob = new Blob([fileData])
  const formData = new FormData()
  formData.append('file', blob, filename)
  formData.append('api_key', apiKey)
  formData.append('timestamp', timestamp.toString())
  formData.append('signature', signature)
  formData.append('folder', folder)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })
  const data = await res.json()
  return data
}

async function run() {
  console.log('Uploading media 1...')
  const p1 = 'C:/Users/AnesuMetaBox/.gemini/antigravity/brain/90861c0d-e6f7-4084-9ee0-135b60a721b2/.user_uploaded/media_1792035049178_04c0d7e7.jpg'
  const res1 = await uploadFile(p1, 'bracelet-ghana-blackstar-cord.jpg')
  console.log('Media 1 uploaded:', res1.secure_url)

  console.log('Uploading media 2...')
  const p2 = 'C:/Users/AnesuMetaBox/.gemini/antigravity/brain/90861c0d-e6f7-4084-9ee0-135b60a721b2/.user_uploaded/media_1792035049225_894e5ae0.jpg'
  const res2 = await uploadFile(p2, 'bracelet-zimbabwe-flag-cord.jpg')
  console.log('Media 2 uploaded:', res2.secure_url)

  const result = {
    ghana: {
      url: res1.secure_url,
      public_id: res1.public_id,
    },
    zimbabwe: {
      url: res2.secure_url,
      public_id: res2.public_id,
    },
  }
  fs.writeFileSync('scripts/uploaded-new-bracelets.json', JSON.stringify(result, null, 2))
  console.log('Saved to scripts/uploaded-new-bracelets.json')
}

run().catch((err) => {
  console.error('Upload failed:', err)
  process.exit(1)
})
