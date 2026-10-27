import fs from 'fs'
import crypto from 'crypto'
import path from 'path'

const cloudName = 'pwranjbq'
const apiKey = '288594454619237'
const apiSecret = 'LaOHsEsChdjb71UP8HTO4XZj9uU'
const folder = 'zimthreads/bracelets'

async function uploadFile(filePath, publicId) {
  const timestamp = Math.floor(Date.now() / 1000)
  // Parameters to sign in alphabetical order
  const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
  const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex')

  const fileData = fs.readFileSync(filePath)
  const blob = new Blob([fileData])
  const formData = new FormData()
  formData.append('file', blob, path.basename(filePath))
  formData.append('api_key', apiKey)
  formData.append('timestamp', timestamp.toString())
  formData.append('signature', signature)
  formData.append('folder', folder)
  formData.append('public_id', publicId)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Upload failed for ${publicId}: ${JSON.stringify(data)}`)
  }
  return data
}

async function run() {
  const items = [
    { name: 'zimbabwe', file: 'public/images/bracelets/bracelet-zimbabwe.jpg', id: 'bracelet-zimbabwe-flag-cord-v2' },
    { name: 'ghana', file: 'public/images/bracelets/bracelet-ghana.jpg', id: 'bracelet-ghana-blackstar-cord-v2' },
    { name: 'mauritius', file: 'public/images/bracelets/bracelet-mauritius.jpg', id: 'bracelet-mauritius-flag-cord-v2' },
    { name: 'nigeria', file: 'public/images/bracelets/bracelet-nigeria.jpg', id: 'bracelet-nigeria-naija-cord-v2' },
  ]

  const results = {}

  for (const item of items) {
    console.log(`Uploading ${item.name} from ${item.file}...`)
    const res = await uploadFile(item.file, item.id)
    console.log(`Uploaded ${item.name}: ${res.secure_url}`)
    results[item.name] = {
      url: res.secure_url,
      public_id: res.public_id,
      width: res.width,
      height: res.height,
    }
  }

  fs.writeFileSync('scripts/uploaded-optimized-bracelets.json', JSON.stringify(results, null, 2))
  console.log('Finished uploading all bracelets. Saved to scripts/uploaded-optimized-bracelets.json')
}

run().catch((err) => {
  console.error('Upload script error:', err)
  process.exit(1)
})
