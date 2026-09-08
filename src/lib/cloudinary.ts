/**
 * Cloudinary Client Service for Zimthreads
 *
 * Provides browser-native signed upload capabilities to Cloudinary
 * utilizing the Web Crypto API (crypto.subtle) for SHA-1 signature generation.
 * Zero external dependencies required.
 */

export interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
  defaultFolder: string
}

export interface CloudinaryUploadResult {
  public_id: string
  version: number
  format: string
  width: number
  height: number
  bytes: number
  secure_url: string
  cdn_url: string
  created_at?: string
}

const STORAGE_KEY = "zimthreads_cloudinary_config"

// Default credentials loaded from the project configuration
const DEFAULT_CONFIG: CloudinaryConfig = {
  cloudName: "pwranjbq",
  apiKey: "288594454619237",
  apiSecret: "LaOHsEsChdjb71UP8HTO4XZj9uU",
  defaultFolder: "zimthreads",
}

/**
 * Retrieves the active Cloudinary configuration.
 * Allows overrides saved in localStorage (from Admin Settings),
 * falling back to the project default configuration.
 */
export function getCloudinaryConfig(): CloudinaryConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        cloudName: parsed.cloudName || DEFAULT_CONFIG.cloudName,
        apiKey: parsed.apiKey || DEFAULT_CONFIG.apiKey,
        apiSecret: parsed.apiSecret || DEFAULT_CONFIG.apiSecret,
        defaultFolder: parsed.defaultFolder || DEFAULT_CONFIG.defaultFolder,
      }
    }
  } catch {
    // Fall back to default config if localStorage fails
  }
  return DEFAULT_CONFIG
}

/**
 * Persists customized Cloudinary configuration into localStorage.
 */
export function saveCloudinaryConfig(config: Partial<CloudinaryConfig>): void {
  const current = getCloudinaryConfig()
  const updated = { ...current, ...config }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

/**
 * Computes a SHA-1 hexadecimal digest string using the browser's native Web Crypto API.
 */
async function computeSha1(text: string): Promise<string> {
  const enc = new TextEncoder()
  const data = enc.encode(text)
  const hashBuffer = await crypto.subtle.digest("SHA-1", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Uploads an image file or blob directly to Cloudinary using signed authentication.
 *
 * @param file - The File or Blob to upload.
 * @param options - Optional upload parameters like folder name or custom tags.
 * @returns A promise resolving to the CloudinaryUploadResult.
 */
export async function uploadImageToCloudinary(
  file: File | Blob,
  options: { folder?: string tags?: string[] } = {},
): Promise<CloudinaryUploadResult> {
  const config = getCloudinaryConfig()

  if (!config.cloudName || !config.apiKey || !config.apiSecret) {
    throw new Error(
      "Cloudinary credentials incomplete. Please verify Cloud Name, API Key, and API Secret in Admin Settings.",
    )
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = options.folder || config.defaultFolder || "zimthreads"

  // Parameters to sign in alphabetical order per Cloudinary API spec
  const signParams: string[] = []
  if (folder) signParams.push(`folder=${folder}`)
  if (options.tags && options.tags.length > 0) {
    signParams.push(`tags=${options.tags.join(",")}`)
  }
  signParams.push(`timestamp=${timestamp}`)
  signParams.sort()

  const signString = `${signParams.join("&")}${config.apiSecret}`
  const signature = await computeSha1(signString)

  const formData = new FormData()
  formData.append("file", file)
  formData.append("api_key", config.apiKey)
  formData.append("timestamp", timestamp.toString())
  if (folder) formData.append("folder", folder)
  if (options.tags && options.tags.length > 0) {
    formData.append("tags", options.tags.join(","))
  }
  formData.append("signature", signature)

  const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  })

  const data = await response.json()

  if (!response.ok) {
    const errorMsg =
      data.error?.message || response.statusText || "Upload failed"
    throw new Error(`Cloudinary Error: ${errorMsg}`)
  }

  // Construct auto-optimized CDN delivery URL (f_auto,q_auto)
  const cdnUrl = data.secure_url.replace(
    `/upload/v${data.version}/`,
    `/upload/f_auto,q_auto/v${data.version}/`,
  )

  return {
    public_id: data.public_id,
    version: data.version,
    format: data.format,
    width: data.width,
    height: data.height,
    bytes: data.bytes,
    secure_url: data.secure_url,
    cdn_url: cdnUrl,
    created_at: data.created_at,
  }
}

/**
 * Validates connectivity with Cloudinary credentials.
 */
export async function testCloudinaryConnection(): Promise<{
  success: boolean
  message: string
}> {
  try {
    // 1x1 transparent PNG blob for testing connectivity
    const dummyPng = new Blob(
      [
        new Uint8Array([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
          0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00,
          0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
          0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63,
          0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4,
          0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60,
          0x82,
        ]),
      ],
      { type: "image/png" },
    )

    const result = await uploadImageToCloudinary(dummyPng, {
      folder: "zimthreads/test",
    })
    return {
      success: true,
      message: `Connected successfully! Test upload public ID: ${result.public_id}`,
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Connection failed.",
    }
  }
}
