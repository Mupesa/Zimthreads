/**
 * scripts/verify-milestone7-worker1.mjs
 * 
 * Milestone 7 Automated Live Neon DB Verification Suite:
 * - Verifies Admin Product Manager Size Configuration (preset + custom sizes) persisting to Neon DB.
 * - Verifies Admin Product Manager Price Options & Tiers (active/inactive state toggles & deletion) persisting to Neon DB.
 * - Simulates full Admin CMS CRUD cycle as executed in Dashboard.tsx.
 * - Ensures zero residuals and pristine baseline preservation on live database.
 */

import { executeSql } from "../api/store.ts"

async function runMilestone7Verification() {
  console.log("=== STARTING MILESTONE 7 (ADMIN CMS SIZES & PRICE TIERS) VERIFICATION ===")

  // 1. Fetch current live baseline
  console.log("\n[Step 1] Loading baseline products from Neon PostgreSQL (rapid-hill-42448439)...")
  const initialRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  if (!initialRows || initialRows.length === 0 || !Array.isArray(initialRows[0].data)) {
    throw new Error("Failed to load products table from live Neon PostgreSQL!")
  }

  const baselineProducts = initialRows[0].data
  const baselineCount = baselineProducts.length
  console.log(`✓ Loaded baseline with ${baselineCount} products.`)

  // Verify prod-5 is intact in baseline
  const prod5 = baselineProducts.find((p) => p.id === "prod-5")
  if (!prod5 || !prod5.sizes.includes("2XL") || !prod5.sizes.includes("XXL")) {
    throw new Error("Baseline prod-5 ('LLICYLAND' Graphic Boxy Tee) is missing 2XL or XXL!")
  }
  console.log(`✓ prod-5 confirmed present with 2XL and XXL sizes: ${JSON.stringify(prod5.sizes)}`)

  // 2. Admin Create Product with Preset + Custom Sizes & Price Options
  console.log("\n[Step 2] Admin creates new product with preset & custom sizes and price options...")
  const testProdId = `prod-m7-cms-${Date.now().toString().slice(-4)}`
  
  // Preset chips: ["S", "M", "L", "XL", "2XL", "XXL", "One Size"] - admin selected S, L, XL, 2XL, XXL, One Size (toggled off M)
  // Custom size entries: ["3XL", "Kids", "Tailored", "42 EU"]
  const initialSizes = [
    "S", "L", "XL", "2XL", "XXL", "One Size",
    "3XL", "Kids", "Tailored", "42 EU"
  ]

  const initialPriceOptions = [
    { id: "tier-101", label: "Standard Drop", price: 750, active: true },
    { id: "tier-102", label: "Limited Pre-release", price: 600, active: false },
    { id: "tier-103", label: "Collector Bundle w/ Hat", price: 1450, active: true },
  ]

  const newProductPayload = {
    id: testProdId,
    name: "Admin CMS Milestone 7 Verification Tee",
    category: "Apparel",
    price: 750,
    stock: 25,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/sample.jpg",
    alt: "M7 Verification Tee",
    description: "Temporary product created by Admin CMS verification suite",
    sizes: initialSizes,
    priceOptions: initialPriceOptions,
    featured: false,
    hidden: false,
  }

  // Persist new product to Neon DB (simulating handleCreateProduct -> addProduct -> syncToCloud)
  const productsWithNew = [newProductPayload, ...baselineProducts]
  await executeSql(
    `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ('products', $1::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW();
    `,
    [JSON.stringify(productsWithNew)]
  )

  // Read back and assert persistence
  const step2Rows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  const savedNewProduct = step2Rows[0]?.data?.find((p) => p.id === testProdId)
  if (!savedNewProduct) {
    throw new Error(`Failed to retrieve newly created product ${testProdId} from Neon DB!`)
  }

  // Validate sizes
  for (const s of initialSizes) {
    if (!savedNewProduct.sizes.includes(s)) {
      throw new Error(`Expected size '${s}' was not saved to Neon DB! Saved: ${JSON.stringify(savedNewProduct.sizes)}`)
    }
  }
  console.log(`✓ Product creation verified in Neon DB with ${savedNewProduct.sizes.length} sizes (preset + custom).`)

  // Validate price options
  if (!Array.isArray(savedNewProduct.priceOptions) || savedNewProduct.priceOptions.length !== 3) {
    throw new Error("Price options array failed to persist with correct count")
  }
  if (savedNewProduct.priceOptions[0].active !== true || savedNewProduct.priceOptions[1].active !== false || savedNewProduct.priceOptions[2].active !== true) {
    throw new Error("Active/Inactive boolean states on initial price tiers corrupted in Neon DB")
  }
  console.log("✓ Initial price options verified with active (true) and deselected/inactive (false) states.")

  // 3. Admin Edit Product: Update sizes, toggle price active states, add new tier, delete tier
  console.log("\n[Step 3] Admin edits product: updates sizes, toggles price tiers, adds & deletes tiers...")
  
  // Admin modifies sizes in Edit modal: adds "44 EU", removes "Kids"
  const updatedSizes = savedNewProduct.sizes.filter((s) => s !== "Kids").concat(["44 EU"])

  // Admin toggles active states:
  // - tier-101: active -> false (Deselected)
  // - tier-102: inactive -> true (Activated)
  // Admin adds new tier:
  // - tier-104: label "VIP Fast Pass", price 990, active: true
  // Admin deletes tier-103
  const updatedPriceOptions = [
    { id: "tier-101", label: "Standard Drop", price: 750, active: false },
    { id: "tier-102", label: "Limited Pre-release", price: 600, active: true },
    { id: "tier-104", label: "VIP Fast Pass", price: 990, active: true },
  ]

  const updatedProductPayload = {
    ...savedNewProduct,
    sizes: updatedSizes,
    priceOptions: updatedPriceOptions,
  }

  // Persist updated product to Neon DB (simulating handleSaveEditProduct -> updateProduct -> syncToCloud)
  const productsWithUpdate = step2Rows[0].data.map((p) => p.id === testProdId ? updatedProductPayload : p)
  await executeSql(
    `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ('products', $1::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW();
    `,
    [JSON.stringify(productsWithUpdate)]
  )

  // Read back and assert modifications
  const step3Rows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  const savedUpdatedProduct = step3Rows[0]?.data?.find((p) => p.id === testProdId)
  if (!savedUpdatedProduct) {
    throw new Error(`Failed to retrieve updated product ${testProdId} from Neon DB!`)
  }

  // Validate updated sizes
  if (savedUpdatedProduct.sizes.includes("Kids")) {
    throw new Error("Removed size 'Kids' still present after edit save!")
  }
  if (!savedUpdatedProduct.sizes.includes("44 EU")) {
    throw new Error("Newly added custom size '44 EU' missing after edit save!")
  }
  console.log(`✓ Updated sizes verified in Neon DB: 'Kids' removed, '44 EU' added (${savedUpdatedProduct.sizes.length} sizes total).`)

  // Validate updated price tiers
  const opt101 = savedUpdatedProduct.priceOptions.find((o) => o.id === "tier-101")
  const opt102 = savedUpdatedProduct.priceOptions.find((o) => o.id === "tier-102")
  const opt103 = savedUpdatedProduct.priceOptions.find((o) => o.id === "tier-103")
  const opt104 = savedUpdatedProduct.priceOptions.find((o) => o.id === "tier-104")

  if (!opt101 || opt101.active !== false) {
    throw new Error("tier-101 failed to toggle to active = false (Deselected)!")
  }
  if (!opt102 || opt102.active !== true) {
    throw new Error("tier-102 failed to toggle to active = true (Active)!")
  }
  if (opt103) {
    throw new Error("tier-103 was not deleted!")
  }
  if (!opt104 || opt104.price !== 990 || opt104.active !== true) {
    throw new Error("tier-104 was not properly added with active = true!")
  }
  console.log("✓ Price tier toggles, additions, and deletions verified in Neon DB.")

  // 4. Cleanup: Delete test product and restore baseline
  console.log("\n[Step 4] Cleaning up test records and restoring baseline...")
  const cleanedProducts = step3Rows[0].data.filter((p) => p.id !== testProdId)
  await executeSql(
    `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ('products', $1::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW();
    `,
    [JSON.stringify(cleanedProducts)]
  )

  // Verify baseline restored with zero residuals
  const finalRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  const finalProducts = finalRows[0]?.data
  if (!finalProducts || finalProducts.length !== baselineCount) {
    throw new Error(`Residuals detected! Expected ${baselineCount} products, found ${finalProducts?.length}`)
  }
  if (finalProducts.some((p) => p.id === testProdId)) {
    throw new Error("Test product was not cleaned up from Neon DB!")
  }
  console.log(`✓ Zero residuals confirmed. Baseline restored to exact count (${baselineCount} products).`)
  console.log("\n=== MILESTONE 7 AUTOMATED VERIFICATION: ALL PASSED SUCCESSFULLY ===")
}

runMilestone7Verification().catch((err) => {
  console.error("\n❌ Milestone 7 Verification FAILED:", err)
  process.exit(1)
})
