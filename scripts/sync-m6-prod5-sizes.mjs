/**
 * scripts/sync-m6-prod5-sizes.mjs
 * 
 * Synchronizes prod-5 (Zimthread 'LLICYLAND' Graphic Boxy Tee) in Neon PostgreSQL:
 * Project: rapid-hill-42448439 ("Zimthreads Collective")
 * Owner: anesumupesa@gmail.com / Mupesa
 * 
 * Ensures sizes array contains ["S", "M", "L", "XL", "2XL", "XXL"].
 */

import { executeSql } from "../api/store.ts"

async function main() {
  console.log("Checking Neon database connection for project rapid-hill-42448439...")

  const rows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  if (!rows || rows.length === 0 || !Array.isArray(rows[0].data)) {
    throw new Error("No products found in public.zimthreads_store WHERE key = 'products'")
  }

  const products = rows[0].data
  console.log(`Retrieved ${products.length} products from live Neon database.`)

  const prod5Index = products.findIndex((p) => p.id === "prod-5")
  if (prod5Index === -1) {
    throw new Error("Product 'prod-5' not found in Neon database!")
  }

  const currentProd5 = products[prod5Index]
  console.log("Current prod-5 sizes in Neon:", currentProd5.sizes)

  const targetSizes = ["S", "M", "L", "XL", "2XL", "XXL"]

  // Merge target sizes
  const existingSizes = Array.isArray(currentProd5.sizes) ? currentProd5.sizes : []
  const updatedSizes = Array.from(new Set([...existingSizes, ...targetSizes]))

  products[prod5Index] = {
    ...currentProd5,
    sizes: updatedSizes,
  }

  console.log("Updating prod-5 in Neon with sizes:", updatedSizes)

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
  const verifiedProd5 = verifyRows[0]?.data?.find((p) => p.id === "prod-5")

  console.log("Verified prod-5 in Neon:", {
    id: verifiedProd5?.id,
    name: verifiedProd5?.name,
    sizes: verifiedProd5?.sizes,
  })

  if (
    !verifiedProd5 ||
    !Array.isArray(verifiedProd5.sizes) ||
    !verifiedProd5.sizes.includes("2XL") ||
    !verifiedProd5.sizes.includes("XXL")
  ) {
    throw new Error("Verification failed: prod-5 in Neon does not contain 2XL and XXL!")
  }

  console.log("SUCCESS: prod-5 in Neon DB successfully updated and verified with 2XL and XXL.")
}

main().catch((err) => {
  console.error("FATAL ERROR:", err)
  process.exit(1)
})
