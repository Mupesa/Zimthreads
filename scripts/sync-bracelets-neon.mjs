/**
 * scripts/sync-bracelets-neon.mjs
 * 
 * Synchronizes prod-brace-heritage (Zimthread African Heritage Beaded Bracelet) in Neon PostgreSQL:
 * Project: rapid-hill-42448439 ("Zimthreads Collective")
 * Owner: anesumupesa@gmail.com / Mupesa
 * 
 * Appends the 2 new bracelet editions:
 * 1. Zimbabwe Flag Beaded Drawstring Bracelet
 * 2. Ghana "Black Star" Beaded Drawstring Bracelet
 * Total views: 14. Total images: 14.
 */

import { executeSql } from "../api/store.ts"
import { heritageBraceletProduct } from "../src/store/seedData.ts"

async function main() {
  console.log("Checking Neon database connection for project rapid-hill-42448439...")

  const rows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  if (!rows || rows.length === 0 || !Array.isArray(rows[0].data)) {
    throw new Error("No products found in public.zimthreads_store WHERE key = 'products'")
  }

  const products = rows[0].data
  console.log(`Retrieved ${products.length} products from live Neon database.`)

  const braceIndex = products.findIndex((p) => p.id === "prod-brace-heritage")
  if (braceIndex === -1) {
    throw new Error("Product 'prod-brace-heritage' not found in Neon database!")
  }

  const currentBrace = products[braceIndex]
  console.log(`Current bracelet views count: ${currentBrace.views?.length || 0}`)

  const currentViews = Array.isArray(currentBrace.views) ? currentBrace.views : []
  const canonicalViews = heritageBraceletProduct.views || []
  const existingUrls = new Set(currentViews.map((v) => v.url))

  const missingViews = canonicalViews.filter((v) => !existingUrls.has(v.url))
  console.log(`Missing views to append: ${missingViews.length}`)
  missingViews.forEach((v) => console.log(` + ${v.label} -> ${v.url}`))

  const updatedViews = [...currentViews, ...missingViews]
  const updatedImages = Array.from(new Set([...(currentBrace.images || []), ...(heritageBraceletProduct.images || [])]))

  products[braceIndex] = {
    ...currentBrace,
    views: updatedViews,
    images: updatedImages,
  }

  console.log(`Updating prod-brace-heritage in Neon DB with ${updatedViews.length} views and ${updatedImages.length} images...`)

  await executeSql(
    `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ('products', $1::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW();
    `,
    [JSON.stringify(products)]
  )

  // Re-read and verify from Neon DB
  const verifyRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  const verifiedBrace = verifyRows[0]?.data?.find((p) => p.id === "prod-brace-heritage")

  console.log(`Verified bracelet in Neon: views count = ${verifiedBrace?.views?.length}`)
  verifiedBrace?.views?.forEach((v, i) => console.log(` [${i + 1}] ${v.label}`))

  if (!verifiedBrace || verifiedBrace.views?.length !== 14) {
    throw new Error(`Verification failed: Expected 14 views, found ${verifiedBrace?.views?.length}`)
  }

  console.log("SUCCESS: prod-brace-heritage in Neon DB successfully updated and verified with all 14 editions.")
}

main().catch((err) => {
  console.error("FATAL ERROR:", err)
  process.exit(1)
})
