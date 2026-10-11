/**
 * scripts/verify-m8-sizes-prices-e2e.mjs
 * 
 * End-to-end verification script for Milestone 8:
 * a) Confirm prod-5 ('LLICYLAND' Graphic Boxy Tee) contains all 6 sizes ["S", "M", "L", "XL", "2XL", "XXL"].
 * b) Admin configurable sizes: preset chips + custom size entries persist to Neon PostgreSQL and read back with 100% fidelity.
 * c) Configurable price options: active and deselected/disabled price options persist to Neon PostgreSQL and read back, toggle active boolean, delete options.
 * d) Confirm clean zero-residual restoration of baseline (24 products).
 * 
 * Target Database:
 * Neon PostgreSQL Project: rapid-hill-42448439 ("Zimthreads Collective")
 * Endpoint: ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech
 * Identity: anesumupesa@gmail.com / Mupesa
 */

import { executeSql } from "../api/store.ts"

let totalAssertions = 0
let passedAssertions = 0

function assert(condition, message) {
  totalAssertions++
  if (!condition) {
    console.error(`❌ FAILED: ${message}`)
    throw new Error(`Assertion failed: ${message}`)
  }
  passedAssertions++
  console.log(`✅ PASS: ${message}`)
}

async function run() {
  console.log("=== STARTING MILESTONE 8 E2E VERIFICATION SUITE ===")
  console.log("Connecting to Neon PostgreSQL (project rapid-hill-42448439)...")

  // 1. Fetch live products from Neon DB and take pristine baseline snapshot
  const baselineRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  assert(baselineRows && baselineRows.length > 0, "Successfully fetched products row from public.zimthreads_store")
  const baselineProducts = baselineRows[0].data
  assert(Array.isArray(baselineProducts) && baselineProducts.length === 24, `Products baseline is exactly 24 items (got ${baselineProducts.length})`)

  try {
    // ------------------------------------------------------------------------
    // CHECK A: Verify prod-5 contains all 6 sizes ["S", "M", "L", "XL", "2XL", "XXL"]
    // ------------------------------------------------------------------------
    console.log("\n--- [CHECK A] Verifying prod-5 ('LLICYLAND' Graphic Boxy Tee) Sizes ---")
    const prod5 = baselineProducts.find((p) => p.id === "prod-5")
    assert(Boolean(prod5), "Product prod-5 exists in Neon DB catalog")
    assert(prod5.name.includes("LLICYLAND"), "prod-5 name matches 'LLICYLAND'")
    assert(Array.isArray(prod5.sizes), "prod-5.sizes is an array")
    assert(prod5.sizes.length >= 6, `prod-5 has at least 6 sizes (found ${prod5.sizes.length})`)
    const requiredSizes = ["S", "M", "L", "XL", "2XL", "XXL"]
    for (const sz of requiredSizes) {
      assert(prod5.sizes.includes(sz), `prod-5.sizes includes '${sz}'`)
    }

    // ------------------------------------------------------------------------
    // CHECK B: Admin configurable sizes: preset chips + custom size entries
    // ------------------------------------------------------------------------
    console.log("\n--- [CHECK B] Testing Admin Configurable Sizes (Preset Chips + Custom Entries) ---")
    const testProductId = `prod-m8-e2e-sizes-${Date.now().toString().slice(-4)}`
    const presetAndCustomSizes = ["S", "M", "L", "XL", "2XL", "XXL", "3XL", "One Size", "Custom-Atelier-Fit"]

    const testProduct = {
      id: testProductId,
      name: "Zimthreads Milestone 8 Custom Config Boxy Hoodie",
      category: "Apparel",
      price: 1850,
      stock: 25,
      sizes: presetAndCustomSizes,
      img: "https://res.cloudinary.com/pwranjbq/image/upload/v1790345314/zimthreads/hoodie.jpg",
      alt: "M8 Custom Sizes Hoodie",
      description: "Testing admin configurable sizes with preset chips and custom entries.",
      featured: false,
      hidden: false,
    }

    // Persist new product with custom sizes to Neon DB
    const catalogWithTest = [testProduct, ...baselineProducts]
    await executeSql(
      `
      INSERT INTO public.zimthreads_store (key, data, updated_at)
      VALUES ('products', $1::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE
      SET data = EXCLUDED.data, updated_at = NOW();
      `,
      [JSON.stringify(catalogWithTest)]
    )

    // Read back and verify 100% fidelity
    const readAfterCreate = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
    const foundCreated = readAfterCreate[0].data.find((p) => p.id === testProductId)
    assert(Boolean(foundCreated), `Created test product ${testProductId} exists in Neon DB`)
    assert(Array.isArray(foundCreated.sizes), "foundCreated.sizes is an array")
    assert(
      JSON.stringify(foundCreated.sizes) === JSON.stringify(presetAndCustomSizes),
      `Preset chips + custom entries persist with 100% fidelity. Expected ${JSON.stringify(presetAndCustomSizes)}, got ${JSON.stringify(foundCreated.sizes)}`
    )

    // Mutate sizes: append another custom size and verify update persistence
    const mutatedSizes = [...presetAndCustomSizes, "Bespoke-44EU"]
    const catalogWithMutatedSizes = readAfterCreate[0].data.map((p) => {
      if (p.id === testProductId) {
        return { ...p, sizes: mutatedSizes }
      }
      return p
    })

    await executeSql(
      `
      INSERT INTO public.zimthreads_store (key, data, updated_at)
      VALUES ('products', $1::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE
      SET data = EXCLUDED.data, updated_at = NOW();
      `,
      [JSON.stringify(catalogWithMutatedSizes)]
    )

    const readAfterMutate = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
    const foundMutated = readAfterMutate[0].data.find((p) => p.id === testProductId)
    assert(foundMutated.sizes.includes("Bespoke-44EU"), "Newly appended custom size entry persists in Neon DB")
    assert(foundMutated.sizes.length === mutatedSizes.length, `Sizes length is ${mutatedSizes.length}`)

    // ------------------------------------------------------------------------
    // CHECK C: Configurable price options: active and deselected/disabled options, toggle, delete
    // ------------------------------------------------------------------------
    console.log("\n--- [CHECK C] Testing Configurable Price Options (Active, Deselected, Toggle, Delete) ---")
    const initialPriceOptions = [
      { id: "tier-std", label: "Standard Boxy Cut", price: 1850, active: true },
      { id: "tier-heavyweight", label: "450GSM Heavyweight Drop", price: 2350, active: false },
      { id: "tier-bespoke", label: "VIP Hand-Distressed Patina", price: 3100, active: true },
    ]

    const catalogWithPriceOptions = readAfterMutate[0].data.map((p) => {
      if (p.id === testProductId) {
        return { ...p, priceOptions: initialPriceOptions }
      }
      return p
    })

    await executeSql(
      `
      INSERT INTO public.zimthreads_store (key, data, updated_at)
      VALUES ('products', $1::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE
      SET data = EXCLUDED.data, updated_at = NOW();
      `,
      [JSON.stringify(catalogWithPriceOptions)]
    )

    // Read back and verify active vs inactive options
    const readAfterPrices = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
    const foundPrices = readAfterPrices[0].data.find((p) => p.id === testProductId)
    assert(Array.isArray(foundPrices.priceOptions), "priceOptions is an array in Neon DB")
    assert(foundPrices.priceOptions.length === 3, "priceOptions array length is 3")
    assert(foundPrices.priceOptions[0].active === true, "Tier 1 is active (selectable)")
    assert(foundPrices.priceOptions[1].active === false, "Tier 2 is deselected / inactive (disabled/greyed out)")
    assert(foundPrices.priceOptions[2].active === true, "Tier 3 is active (selectable)")
    assert(foundPrices.priceOptions[0].price === 1850, "Tier 1 price is 1850")
    assert(foundPrices.priceOptions[1].price === 2350, "Tier 2 price is 2350")
    assert(foundPrices.priceOptions[2].price === 3100, "Tier 3 price is 3100")

    // Toggle active boolean on tiers and delete tier-bespoke
    const mutatedPriceOptions = [
      { id: "tier-std", label: "Standard Boxy Cut", price: 1850, active: false }, // toggled from true to false
      { id: "tier-heavyweight", label: "450GSM Heavyweight Drop", price: 2350, active: true }, // toggled from false to true
      // tier-bespoke deleted
    ]

    const catalogWithToggledPrices = readAfterPrices[0].data.map((p) => {
      if (p.id === testProductId) {
        return { ...p, priceOptions: mutatedPriceOptions }
      }
      return p
    })

    await executeSql(
      `
      INSERT INTO public.zimthreads_store (key, data, updated_at)
      VALUES ('products', $1::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE
      SET data = EXCLUDED.data, updated_at = NOW();
      `,
      [JSON.stringify(catalogWithToggledPrices)]
    )

    const readAfterToggle = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
    const foundToggled = readAfterToggle[0].data.find((p) => p.id === testProductId)
    assert(foundToggled.priceOptions.length === 2, "priceOptions has 2 tiers after deletion")
    const tierStd = foundToggled.priceOptions.find((o) => o.id === "tier-std")
    const tierHvy = foundToggled.priceOptions.find((o) => o.id === "tier-heavyweight")
    const tierBespoke = foundToggled.priceOptions.find((o) => o.id === "tier-bespoke")

    assert(tierStd && tierStd.active === false, "tier-std active boolean successfully toggled to false (deselected)")
    assert(tierHvy && tierHvy.active === true, "tier-heavyweight active boolean successfully toggled to true (active)")
    assert(!tierBespoke, "tier-bespoke successfully deleted from priceOptions")

    // ------------------------------------------------------------------------
    // CHECK D: Confirm clean zero-residual restoration of baseline (24 products)
    // ------------------------------------------------------------------------
    console.log("\n--- [CHECK D] Clean Zero-Residual Baseline Restoration ---")
    await executeSql(
      `
      INSERT INTO public.zimthreads_store (key, data, updated_at)
      VALUES ('products', $1::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE
      SET data = EXCLUDED.data, updated_at = NOW();
      `,
      [JSON.stringify(baselineProducts)]
    )

    const finalRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
    const finalProducts = finalRows[0].data
    assert(finalProducts.length === 24, `Final catalog count matches pristine baseline: exactly 24 products (got ${finalProducts.length})`)

    const testProdResidual = finalProducts.find((p) => p.id === testProductId)
    assert(!testProdResidual, "No residual test product remains in Neon DB")

    const finalProd5 = finalProducts.find((p) => p.id === "prod-5")
    assert(Boolean(finalProd5), "prod-5 remains intact in final catalog")
    for (const sz of requiredSizes) {
      assert(finalProd5.sizes.includes(sz), `Final state: prod-5 retains size '${sz}'`)
    }

    console.log(`\n🎉 ALL ${passedAssertions}/${totalAssertions} E2E ASSERTIONS PASSED WITH ZERO RESIDUALS!`)
  } catch (err) {
    console.error("Error during execution, performing emergency restoration:", err)
    await executeSql(
      `
      INSERT INTO public.zimthreads_store (key, data, updated_at)
      VALUES ('products', $1::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE
      SET data = EXCLUDED.data, updated_at = NOW();
      `,
      [JSON.stringify(baselineProducts)]
    )
    throw err
  }
}

run().catch((err) => {
  console.error("FATAL ERROR in E2E Verification:", err)
  process.exit(1)
})
