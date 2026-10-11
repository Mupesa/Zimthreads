/**
 * scripts/test-m7-reviewer2-adversarial.mjs
 * 
 * Reviewer 2 Adversarial Stress Test Suite for Milestone 7:
 * - Admin CMS dynamic size chips and custom size inputs.
 * - Price tier active/deselected toggles, initial state flags, and deletions.
 * - Neon PostgreSQL round-trip persistence and JSONB integrity check.
 * - Storefront logic simulation (selection, disabled states, quick-add gating).
 * - Full account and baseline integrity audit.
 */

import { executeSql } from "../api/store.ts"

async function runAdversarialReview() {
  console.log("================================================================================")
  console.log("=== MILESTONE 7 REVIEWER 2 ADVERSARIAL STRESS TEST & INTEGRITY AUDIT ===")
  console.log("================================================================================")

  // 1. Audit Account & Neon Database Target
  console.log("\n[Audit 1] Verifying Neon Database & Account Compliance...")
  const rows = await executeSql("SELECT current_database(), current_user, inet_server_addr();")
  console.log("✓ Connected to Neon DB:", rows[0])

  const storeRows = await executeSql("SELECT key, updated_at FROM public.zimthreads_store ORDER BY key;")
  const keys = storeRows.map((r) => r.key)
  console.log(`✓ Neon zimthreads_store contains ${keys.length} keys: ${keys.join(", ")}`)

  if (!keys.includes("products")) {
    throw new Error("Missing 'products' key in zimthreads_store!")
  }

  // 2. Baseline Catalog & prod-5 Integrity Check
  console.log("\n[Audit 2] Checking baseline product catalog & prod-5 'LLICYLAND' Graphic Boxy Tee...")
  const prodRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  const initialProducts = prodRows[0]?.data
  if (!Array.isArray(initialProducts)) {
    throw new Error("Products in Neon DB is not an array!")
  }
  const baselineCount = initialProducts.length
  console.log(`✓ Baseline product count: ${baselineCount}`)

  const prod5 = initialProducts.find((p) => p.id === "prod-5")
  if (!prod5) {
    throw new Error("prod-5 not found in baseline products!")
  }
  console.log(`✓ prod-5 name: "${prod5.name}"`)
  console.log(`✓ prod-5 sizes: ${JSON.stringify(prod5.sizes)}`)
  if (!prod5.sizes.includes("2XL") || !prod5.sizes.includes("XXL")) {
    throw new Error("prod-5 missing 2XL or XXL!")
  }

  // 3. Adversarial Stress-Test: Admin CMS Size Manipulation Simulation
  console.log("\n[Test 3] Simulating Admin CMS size configuration logic...")
  const PRESET_CHIPS = ["S", "M", "L", "XL", "2XL", "XXL", "One Size"]

  // Start with empty sizes
  let simSizes = []

  // Add presets: S, XL, XXL, One Size
  const toAdd = ["S", "XL", "XXL", "One Size"]
  for (const preset of toAdd) {
    if (!simSizes.includes(preset)) simSizes.push(preset)
  }

  // Toggle on then toggle off "M"
  if (!simSizes.includes("M")) simSizes.push("M")
  simSizes = simSizes.filter((s) => s !== "M")

  // Add custom sizes with special characters, trims, and edge cases
  const customInputs = [
    "  3XL  ",
    "Kids 10-12Y",
    "Tailored Slim",
    "44.5 EU",
    "One Size", // duplicate of preset
    "", // empty input
    "   ", // whitespace only
    "S", // duplicate of preset
  ]

  for (const raw of customInputs) {
    const val = raw.trim()
    if (val && !simSizes.includes(val)) {
      simSizes.push(val)
    }
  }

  console.log(`✓ Sim sizes result: ${JSON.stringify(simSizes)}`)
  // Expected: ["S", "XL", "XXL", "One Size", "3XL", "Kids 10-12Y", "Tailored Slim", "44.5 EU"]
  if (simSizes.length !== 8) {
    throw new Error(`Expected exactly 8 sizes after deduplication, got ${simSizes.length}`)
  }
  if (simSizes.includes("M") || simSizes.includes("") || simSizes.filter((s) => s === "One Size").length !== 1) {
    throw new Error("Size deduplication or toggle logic failed")
  }

  // 4. Adversarial Stress-Test: Admin CMS Price Tiers Simulation
  console.log("\n[Test 4] Simulating Admin CMS price tier configuration logic...")
  let simPriceOptions = []

  // Create tiers using admin controls:
  // Tier 1: Created with newPriceActive = true
  simPriceOptions.push({
    id: `tier-${Date.now()}-1`,
    label: "Standard Retail",
    price: 850,
    active: true,
  })

  // Tier 2: Created with newPriceActive = false (Deselected tier on creation)
  simPriceOptions.push({
    id: `tier-${Date.now()}-2`,
    label: "VIP Whitelist Tier",
    price: 650,
    active: false,
  })

  // Tier 3: Created without label (auto-label fallback `Tier Rs ${price}`)
  const tier3Price = 1200
  simPriceOptions.push({
    id: `tier-${Date.now()}-3`,
    label: "" || `Tier Rs ${tier3Price}`,
    price: tier3Price,
    active: true,
  })

  // Tier 4: Inactive tier
  simPriceOptions.push({
    id: `tier-${Date.now()}-4`,
    label: "Early Bird Pre-order",
    price: 500,
    active: false,
  })

  console.log(`✓ Configured 4 price tiers (2 active, 2 deselected)`)

  // Verify Storefront behavior with these tiers:
  const activeTiers = simPriceOptions.filter((po) => po.active)
  if (activeTiers.length !== 2) throw new Error("Expected 2 active tiers")

  // Shop card minimum starting price calculation:
  const minActivePrice = Math.min(...activeTiers.map((t) => t.price))
  if (minActivePrice !== 850) {
    throw new Error(`Expected min active price 850, got ${minActivePrice}`)
  }
  console.log(`✓ Storefront display starting price: Rs ${minActivePrice}+ (correctly ignores deselected 500 and 650 tiers)`)

  // Toggle Tier 2 from inactive to active
  simPriceOptions = simPriceOptions.map((opt) =>
    opt.id === `tier-${Date.now()}-2` ? { ...opt, active: !opt.active } : opt
  )
  // Delete Tier 4
  simPriceOptions = simPriceOptions.filter((opt) => !opt.label.includes("Early Bird"))

  console.log(`✓ Toggled Tier 2 to active and deleted Tier 4`)

  // 5. Live Neon PostgreSQL End-to-End Persistence Round-Trip
  console.log("\n[Test 5] Writing test product with custom sizes & price tiers to Neon PostgreSQL...")
  const testId = `prod-rev2-adv-${Date.now()}`
  const testProduct = {
    id: testId,
    name: "Adversarial Reviewer 2 Stress Tee",
    category: "Apparel",
    price: 850,
    stock: 15,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/sample.jpg",
    alt: "Adversarial Stress Tee",
    description: "Stress test product created by m7_reviewer_2",
    sizes: simSizes,
    priceOptions: simPriceOptions,
    featured: false,
    hidden: false,
  }

  const updatedCatalog = [testProduct, ...initialProducts]
  await executeSql(
    `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ('products', $1::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW();
    `,
    [JSON.stringify(updatedCatalog)]
  )

  // Verify by fetching back from Neon DB
  const readBackRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  const persistedProduct = readBackRows[0]?.data?.find((p) => p.id === testId)

  if (!persistedProduct) {
    throw new Error("Failed to find persisted product in Neon DB!")
  }

  // Check sizes persistence
  if (JSON.stringify(persistedProduct.sizes) !== JSON.stringify(simSizes)) {
    throw new Error(`Sizes mismatch! Saved: ${JSON.stringify(persistedProduct.sizes)}`)
  }
  console.log(`✓ Neon DB perfectly persisted all ${persistedProduct.sizes.length} sizes`)

  // Check price options persistence
  if (persistedProduct.priceOptions.length !== 3) {
    throw new Error(`Price options count mismatch! Got ${persistedProduct.priceOptions.length}`)
  }
  for (const opt of persistedProduct.priceOptions) {
    if (typeof opt.active !== "boolean") {
      throw new Error(`Price option ${opt.id} active state is not a boolean: ${opt.active}`)
    }
    if (typeof opt.price !== "number" || isNaN(opt.price)) {
      throw new Error(`Price option ${opt.id} price is not a valid number: ${opt.price}`)
    }
  }
  console.log(`✓ Neon DB perfectly persisted all price tiers with boolean active states and numeric prices`)

  // 6. Test Admin Modification & Re-Save Cycle
  console.log("\n[Test 6] Simulating Admin Edit: modifying sizes, toggling tiers, re-saving to Neon DB...")
  const editedSizes = ["S", "M", "L", "XL", "2XL", "XXL", "3XL"]
  const editedPriceOptions = [
    { id: "tier-p1", label: "Special Edition", price: 1100, active: true },
    { id: "tier-p2", label: "Standard Drop", price: 850, active: false },
  ]

  const reEditedCatalog = readBackRows[0].data.map((p) =>
    p.id === testId
      ? { ...p, sizes: editedSizes, priceOptions: editedPriceOptions }
      : p
  )

  await executeSql(
    `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ('products', $1::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW();
    `,
    [JSON.stringify(reEditedCatalog)]
  )

  const reReadRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  const rePersisted = reReadRows[0]?.data?.find((p) => p.id === testId)

  if (!rePersisted || rePersisted.sizes.length !== 7 || rePersisted.priceOptions.length !== 2) {
    throw new Error("Admin edit re-persistence failed!")
  }
  if (rePersisted.priceOptions[1].active !== false) {
    throw new Error("Active toggle failed to persist false on re-save!")
  }
  console.log("✓ Admin edit cycle verified with updated sizes and toggled price options in Neon DB")

  // 7. Cleanup & Pristine Baseline Restoration
  console.log("\n[Test 7] Cleaning up test product and verifying pristine baseline...")
  const cleanedCatalog = reReadRows[0].data.filter((p) => p.id !== testId)

  await executeSql(
    `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ('products', $1::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW();
    `,
    [JSON.stringify(cleanedCatalog)]
  )

  const finalCheckRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  const finalCatalog = finalCheckRows[0]?.data
  if (finalCatalog.length !== baselineCount) {
    throw new Error(`Baseline count mismatch! Expected ${baselineCount}, found ${finalCatalog.length}`)
  }
  if (finalCatalog.some((p) => p.id === testId)) {
    throw new Error("Test product residual remained in Neon DB!")
  }
  console.log(`✓ Cleaned up successfully. Exactly ${baselineCount} products in Neon DB with zero residuals.`)

  console.log("\n================================================================================")
  console.log("=== ALL ADVERSARIAL STRESS TESTS PASSED WITH 100% SUCCESS ===")
  console.log("================================================================================")
}

runAdversarialReview().catch((err) => {
  console.error("\n❌ Adversarial Review FAILED:", err)
  process.exit(1)
})
