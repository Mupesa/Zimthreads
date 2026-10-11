/**
 * scripts/verify-milestone6-worker1.mjs
 * 
 * Specialized Milestone 6 Verification Suite for Worker 1:
 * - Checks live Neon PostgreSQL DB prod-5 sizes include 2XL and XXL
 * - Verifies PriceOption model fidelity and live storage round-trip
 * - Ensures zero residuals and pristine baseline preservation
 */

import { executeSql } from "../api/store.ts"

async function runMilestone6Verification() {
  console.log("=== STARTING MILESTONE 6 WORKER 1 VERIFICATION ===")

  // 1. Verify prod-5 in Neon PostgreSQL
  console.log("Checking prod-5 in public.zimthreads_store...")
  const rows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  if (!rows || rows.length === 0 || !Array.isArray(rows[0].data)) {
    throw new Error("Failed to load products from Neon DB")
  }

  const products = rows[0].data
  const prod5 = products.find((p) => p.id === "prod-5")

  if (!prod5) {
    throw new Error("prod-5 ('LLICYLAND' Graphic Boxy Tee) not found in Neon DB!")
  }

  console.log("prod-5 details:", {
    id: prod5.id,
    name: prod5.name,
    category: prod5.category,
    price: prod5.price,
    sizes: prod5.sizes,
  })

  const requiredSizes = ["S", "M", "L", "XL", "2XL", "XXL"]
  for (const s of requiredSizes) {
    if (!prod5.sizes.includes(s)) {
      throw new Error(`prod-5 is missing size '${s}'! Current sizes: ${JSON.stringify(prod5.sizes)}`)
    }
  }
  console.log("✓ prod-5 contains all required sizes including 2XL and XXL.")

  // 2. Test PriceOption model fidelity with a temporary test product
  console.log("Testing PriceOption model round-trip in Neon...")
  const testProdId = `prod-m6-test-${Date.now().toString().slice(-4)}`
  const testPriceOptions = [
    { id: "opt-1", label: "Standard Apparel", price: 650, active: true },
    { id: "opt-2", label: "Archival Limited Box", price: 950, active: false },
  ]
  const testProduct = {
    id: testProdId,
    name: "Milestone 6 Test Boxy Tee",
    category: "Apparel",
    price: 650,
    stock: 10,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/sample.jpg",
    alt: "M6 Test",
    description: "Temporary test product for M6 verification",
    sizes: ["S", "M", "L", "XL", "2XL", "XXL"],
    priceOptions: testPriceOptions,
  }

  // Insert test product
  const nextProducts = [testProduct, ...products]
  await executeSql(
    `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ('products', $1::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW();
    `,
    [JSON.stringify(nextProducts)]
  )

  // Read back and verify
  const readBackRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  const savedTestProd = readBackRows[0]?.data?.find((p) => p.id === testProdId)

  if (!savedTestProd) {
    throw new Error("Test product with priceOptions failed to persist to Neon DB")
  }

  if (!Array.isArray(savedTestProd.priceOptions) || savedTestProd.priceOptions.length !== 2) {
    throw new Error("priceOptions failed to round-trip properly")
  }

  if (savedTestProd.priceOptions[0].active !== true || savedTestProd.priceOptions[1].active !== false) {
    throw new Error("priceOptions active boolean states corrupted during round-trip")
  }
  console.log("✓ PriceOption array and active/inactive boolean fidelity verified in Neon DB.")

  // 3. Clean up test product
  const cleanedProducts = readBackRows[0].data.filter((p) => p.id !== testProdId)
  await executeSql(
    `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ('products', $1::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW();
    `,
    [JSON.stringify(cleanedProducts)]
  )

  // Verify clean up
  const finalRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  const foundResidual = finalRows[0]?.data?.find((p) => p.id === testProdId)
  if (foundResidual) {
    throw new Error("Clean up failed: residual test product still exists in Neon DB")
  }

  console.log(`✓ Zero residuals confirmed. Baseline restored (${finalRows[0].data.length} products).`)
  console.log("=== MILESTONE 6 WORKER 1 VERIFICATION COMPLETE: ALL PASSED ===")
}

runMilestone6Verification().catch((err) => {
  console.error("Verification failed:", err)
  process.exit(1)
})
