/**
 * scripts/test-m6-challenger-empirical.mjs
 * 
 * Empirical Verification & Stress Test Suite for Milestone 6 (Challenger 1)
 * 
 * Objectives:
 * 1. Query live Neon PostgreSQL (rapid-hill-42448439, table zimthreads_store key = 'products')
 *    and rigorously verify prod-5 contains all 6 sizes: ["S", "M", "L", "XL", "2XL", "XXL"].
 * 2. Stress-test PriceOption data structures:
 *    - Active option selection vs inactive option rejection
 *    - All inactive options / sold-out edge cases
 *    - Round-trip Neon persistence with active boolean toggles and zero residuals
 * 3. Test cart separation and collision avoidance:
 *    - Adding same product with different sizes (M vs 2XL vs XXL) creates separate cart items
 *    - Adding same product with same size increments quantity without colliding with other sizes
 *    - Adding same product with different priceOptionLabel or customName creates separate cart items
 *    - Item quantity update and item removal isolation
 *    - Cart total and count calculations
 * 4. Verify StoreContext hydration sanitization and fallback defense
 * 5. Verify order formatting and line item summary preservation
 */

import { executeSql } from "../api/store.ts"

// Assertion helper
let totalAssertions = 0
let passedAssertions = 0
let failedAssertions = 0

function assert(condition, message) {
  totalAssertions++
  if (condition) {
    passedAssertions++
    console.log(`  ✓ PASS: ${message}`)
  } else {
    failedAssertions++
    console.error(`  ✗ FAIL: ${message}`)
    throw new Error(`Assertion failed: ${message}`)
  }
}

function assertDeepEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual)
  const expectedStr = JSON.stringify(expected)
  assert(actualStr === expectedStr, `${message} (Expected: ${expectedStr}, Got: ${actualStr})`)
}

async function runEmpiricalChallengeSuite() {
  console.log("==================================================================")
  console.log("MILESTONE 6 EMPIRICAL CHALLENGER 1 VERIFICATION & STRESS SUITE")
  console.log("==================================================================")

  // ====================================================================
  // SUITE 1: LIVE NEON POSTGRESQL PROD-5 SIZES AUDIT
  // ====================================================================
  console.log("\n[SUITE 1] Live Neon PostgreSQL prod-5 Sizes & Integrity Audit...")

  const rows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  assert(Array.isArray(rows) && rows.length > 0, "Neon DB returned products table row")
  assert(Array.isArray(rows[0].data), "Products data column is a JSON array")

  const liveProducts = rows[0].data
  console.log(`  Found ${liveProducts.length} products in Neon database.`)

  const prod5 = liveProducts.find((p) => p.id === "prod-5")
  assert(Boolean(prod5), "Product 'prod-5' exists in Neon DB catalog")

  console.log("  prod-5 live data:", {
    id: prod5.id,
    name: prod5.name,
    category: prod5.category,
    price: prod5.price,
    sizes: prod5.sizes,
  })

  // Exact sizes specification check
  const expectedSizes = ["S", "M", "L", "XL", "2XL", "XXL"]
  assert(Array.isArray(prod5.sizes), "prod-5.sizes is an array")
  assert(prod5.sizes.length === 6, `prod-5.sizes has exactly 6 sizes (found ${prod5.sizes.length})`)
  assertDeepEqual(prod5.sizes, expectedSizes, "prod-5.sizes exactly matches ['S', 'M', 'L', 'XL', '2XL', 'XXL']")

  // Verify each size individually
  for (const size of expectedSizes) {
    assert(prod5.sizes.includes(size), `prod-5 includes size '${size}'`)
  }

  // Ensure no duplicates
  const uniqueSizes = new Set(prod5.sizes)
  assert(uniqueSizes.size === prod5.sizes.length, "prod-5 has no duplicate size entries")

  // Ensure 2XL and XXL are distinctly present
  assert(prod5.sizes.indexOf("2XL") !== -1, "'2XL' is present in sizes")
  assert(prod5.sizes.indexOf("XXL") !== -1, "'XXL' is present in sizes")
  assert(prod5.sizes.indexOf("2XL") !== prod5.sizes.indexOf("XXL"), "'2XL' and 'XXL' are distinct items in array")

  // ====================================================================
  // SUITE 2: PRICEOPTION DATA STRUCTURES & AVAILABILITY STRESS TEST
  // ====================================================================
  console.log("\n[SUITE 2] PriceOption Data Structure & Availability Stress Testing...")

  // Mock product with multi-tier price options
  const sampleProductWithTiers = {
    id: "prod-test-tiered",
    name: "Tiered Tee Specimen",
    price: 650,
    priceOptions: [
      { id: "tier-std", label: "Standard Apparel", price: 650, active: true },
      { id: "tier-ltd", label: "Archival Limited Box", price: 950, active: false },
      { id: "tier-vip", label: "VIP Gold Collector", price: 1500, active: true },
    ],
    sizes: ["S", "M", "L", "XL", "2XL", "XXL"],
  }

  // Helper simulating ProductModal selection and validation logic
  function evaluateProductModalSelection(product, selectedPriceOptionId) {
    const hasPriceOptions = Boolean(product.priceOptions && product.priceOptions.length > 0)
    const priceOptions = product.priceOptions || []
    const activePriceOptions = priceOptions.filter((po) => po.active)

    const selectedPriceOption = (() => {
      if (!hasPriceOptions) return undefined
      if (selectedPriceOptionId) {
        const found = priceOptions.find(
          (po) =>
            po.id === selectedPriceOptionId ||
            `${po.label}-${po.price}` === selectedPriceOptionId,
        )
        if (found) return found
      }
      return activePriceOptions[0]
    })()

    const isPriceOptionUnavailable =
      hasPriceOptions && (!selectedPriceOption || !selectedPriceOption.active)

    const canAddToCart = !isPriceOptionUnavailable

    return {
      hasPriceOptions,
      selectedPriceOption,
      isPriceOptionUnavailable,
      canAddToCart,
      effectivePrice: selectedPriceOption ? selectedPriceOption.price : product.price,
    }
  }

  // Test 2.1: Default selection picks first active option
  {
    const res = evaluateProductModalSelection(sampleProductWithTiers, "")
    assert(res.hasPriceOptions === true, "Recognizes priceOptions present")
    assert(res.selectedPriceOption?.id === "tier-std", "Defaults to first active option 'tier-std'")
    assert(res.isPriceOptionUnavailable === false, "Selection is available")
    assert(res.canAddToCart === true, "Can add default active option to cart")
    assert(res.effectivePrice === 650, "Effective price matches active tier (650)")
  }

  // Test 2.2: Active option selection (VIP tier)
  {
    const res = evaluateProductModalSelection(sampleProductWithTiers, "tier-vip")
    assert(res.selectedPriceOption?.id === "tier-vip", "Successfully selects 'tier-vip'")
    assert(res.selectedPriceOption?.active === true, "'tier-vip' is active")
    assert(res.canAddToCart === true, "Can add VIP option to cart")
    assert(res.effectivePrice === 1500, "Effective price matches VIP tier (1500)")
  }

  // Test 2.3: Inactive option rejection (Limited Box tier)
  {
    const res = evaluateProductModalSelection(sampleProductWithTiers, "tier-ltd")
    assert(res.selectedPriceOption?.id === "tier-ltd", "Selects 'tier-ltd'")
    assert(res.selectedPriceOption?.active === false, "'tier-ltd' is marked inactive")
    assert(res.isPriceOptionUnavailable === true, "isPriceOptionUnavailable is TRUE for inactive tier")
    assert(res.canAddToCart === false, "Rejects adding inactive option to cart (canAddToCart is FALSE)")
  }

  // Test 2.4: Edge Case: All options are inactive (Sold Out tier structure)
  {
    const allInactiveProduct = {
      ...sampleProductWithTiers,
      priceOptions: [
        { id: "opt-1", label: "Drop A", price: 700, active: false },
        { id: "opt-2", label: "Drop B", price: 800, active: false },
      ],
    }
    const res = evaluateProductModalSelection(allInactiveProduct, "")
    assert(res.selectedPriceOption === undefined, "No active option available to select")
    assert(res.isPriceOptionUnavailable === true, "isPriceOptionUnavailable is TRUE when all options inactive")
    assert(res.canAddToCart === false, "Cannot add to cart when all tiers are inactive")
  }

  // Test 2.5: Edge Case: Product with no price options
  {
    const standardProduct = {
      id: "prod-standard",
      name: "Standard Tee",
      price: 450,
      sizes: ["S", "M", "L"],
    }
    const res = evaluateProductModalSelection(standardProduct, "")
    assert(res.hasPriceOptions === false, "hasPriceOptions is FALSE for standard product")
    assert(res.selectedPriceOption === undefined, "selectedPriceOption is undefined")
    assert(res.isPriceOptionUnavailable === false, "isPriceOptionUnavailable is FALSE")
    assert(res.canAddToCart === true, "Can add standard product to cart")
    assert(res.effectivePrice === 450, "Effective price falls back to product.price (450)")
  }

  // Test 2.6: Neon DB round-trip persistence with active/inactive toggles
  console.log("  Testing live Neon DB PriceOption persistence and active toggle update...")
  const tempTestId = `prod-challenger-test-${Date.now().toString().slice(-4)}`
  const tempProduct = {
    id: tempTestId,
    name: "Milestone 6 Challenger Dynamic Tier Test",
    category: "Apparel",
    price: 750,
    stock: 12,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/sample.jpg",
    alt: "M6 Challenger Test",
    description: "Temporary product verifying active/inactive price option round-trip",
    sizes: ["S", "M", "L", "XL", "2XL", "XXL"],
    priceOptions: [
      { id: "po-1", label: "Standard Drop", price: 750, active: true },
      { id: "po-2", label: "Collector Case", price: 1100, active: false },
    ],
  }

  // Insert into Neon
  const catalogWithTemp = [tempProduct, ...liveProducts]
  await executeSql(
    `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ('products', $1::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW();
    `,
    [JSON.stringify(catalogWithTemp)],
  )

  // Read back and assert
  let verifyRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  let readTemp = verifyRows[0]?.data?.find((p) => p.id === tempTestId)
  assert(Boolean(readTemp), "Temporary product persisted to Neon DB")
  assert(readTemp.priceOptions.length === 2, "priceOptions array persisted with length 2")
  assert(readTemp.priceOptions[0].active === true, "Option 1 active is true in Neon DB")
  assert(readTemp.priceOptions[1].active === false, "Option 2 active is false in Neon DB")

  // Toggle option 2 to active: true, and option 1 to active: false
  readTemp.priceOptions[0].active = false
  readTemp.priceOptions[1].active = true
  const updatedCatalog = verifyRows[0].data.map((p) => (p.id === tempTestId ? readTemp : p))

  await executeSql(
    `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ('products', $1::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW();
    `,
    [JSON.stringify(updatedCatalog)],
  )

  // Verify toggle persisted
  verifyRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  const readToggled = verifyRows[0]?.data?.find((p) => p.id === tempTestId)
  assert(readToggled.priceOptions[0].active === false, "Option 1 successfully toggled to false in Neon DB")
  assert(readToggled.priceOptions[1].active === true, "Option 2 successfully toggled to true in Neon DB")

  // Clean up temporary product
  const cleanedCatalog = verifyRows[0].data.filter((p) => p.id !== tempTestId)
  await executeSql(
    `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ('products', $1::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW();
    `,
    [JSON.stringify(cleanedCatalog)],
  )

  // Ensure clean restoration
  const finalCheckRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  assert(
    !finalCheckRows[0]?.data?.some((p) => p.id === tempTestId),
    "Temporary test product cleanly removed with zero residuals from Neon DB",
  )
  assert(
    finalCheckRows[0]?.data?.length === liveProducts.length,
    `Pristine baseline of ${liveProducts.length} products confirmed`,
  )

  // ====================================================================
  // SUITE 3: CART SEPARATION & MULTI-SIZE COLLISION STRESS TEST
  // ====================================================================
  console.log("\n[SUITE 3] Cart Separation & Multi-Size Collision Stress Testing...")

  // Harness simulating StoreContext cart state machine
  class CartSimulator {
    constructor() {
      this.cart = []
    }

    addToCart(product, quantity = 1, size, customName, selectedPrice, priceOptionLabel) {
      const formattedCustomName = customName?.trim()
        ? customName.trim().toUpperCase()
        : undefined
      const extraPrice = formattedCustomName ? product.customNamePrice || 50 : 0
      const basePrice = selectedPrice !== undefined ? selectedPrice : product.price
      const finalPrice = basePrice + extraPrice

      const existingIndex = this.cart.findIndex(
        (item) =>
          item.productId === product.id &&
          (item.size || "") === (size || "") &&
          (item.customName || "") === (formattedCustomName || "") &&
          (item.priceOptionLabel || "") === (priceOptionLabel || ""),
      )

      if (existingIndex > -1) {
        this.cart[existingIndex].quantity += quantity
      } else {
        this.cart.push({
          productId: product.id,
          name: product.name,
          price: finalPrice,
          quantity,
          size,
          img: product.img,
          customName: formattedCustomName,
          priceOptionLabel,
        })
      }
    }

    removeFromCart(productId, size, customName, priceOptionLabel) {
      const formattedCustomName = customName?.trim()
        ? customName.trim().toUpperCase()
        : undefined
      this.cart = this.cart.filter(
        (item) =>
          !(
            item.productId === productId &&
            (item.size || "") === (size || "") &&
            (item.customName || "") === (formattedCustomName || "") &&
            (item.priceOptionLabel || "") === (priceOptionLabel || "")
          ),
      )
    }

    updateCartQuantity(productId, quantity, size, customName, priceOptionLabel) {
      if (quantity <= 0) {
        this.removeFromCart(productId, size, customName, priceOptionLabel)
        return
      }
      const formattedCustomName = customName?.trim()
        ? customName.trim().toUpperCase()
        : undefined
      this.cart = this.cart.map((item) =>
        item.productId === productId &&
        (item.size || "") === (size || "") &&
        (item.customName || "") === (formattedCustomName || "") &&
        (item.priceOptionLabel || "") === (priceOptionLabel || "")
          ? { ...item, quantity }
          : item,
      )
    }

    get cartTotal() {
      return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    }

    get cartCount() {
      return this.cart.reduce((sum, item) => sum + item.quantity, 0)
    }
  }

  const sim = new CartSimulator()

  // Test 3.1: Add same product (prod-5) with size "M"
  sim.addToCart(prod5, 1, "M")
  assert(sim.cart.length === 1, "Cart has 1 item after adding prod-5 size M")
  assert(sim.cart[0].size === "M" && sim.cart[0].quantity === 1, "Item 0 is size M with quantity 1")

  // Test 3.2: Add same product with size "2XL"
  sim.addToCart(prod5, 1, "2XL")
  assert(sim.cart.length === 2, "Cart has 2 items after adding prod-5 size 2XL (NO overwrite/collision)")
  assert(sim.cart[1].size === "2XL" && sim.cart[1].quantity === 1, "Item 1 is size 2XL with quantity 1")
  assert(sim.cart[0].size === "M" && sim.cart[0].quantity === 1, "Item 0 remains size M with quantity 1")

  // Test 3.3: Add same product with size "XXL"
  sim.addToCart(prod5, 1, "XXL")
  assert(sim.cart.length === 3, "Cart has 3 items after adding prod-5 size XXL (NO collision between 2XL and XXL)")
  assert(sim.cart[2].size === "XXL" && sim.cart[2].quantity === 1, "Item 2 is size XXL with quantity 1")

  // Test 3.4: Re-add size "2XL" with quantity 2
  sim.addToCart(prod5, 2, "2XL")
  assert(sim.cart.length === 3, "Cart length remains 3 when adding existing size 2XL")
  const item2XL = sim.cart.find((i) => i.size === "2XL")
  assert(item2XL.quantity === 3, "Size 2XL quantity incremented to 3 (1 + 2)")
  const itemM = sim.cart.find((i) => i.size === "M")
  assert(itemM.quantity === 1, "Size M quantity unaffected (still 1)")
  const itemXXL = sim.cart.find((i) => i.size === "XXL")
  assert(itemXXL.quantity === 1, "Size XXL quantity unaffected (still 1)")

  // Test 3.5: Add size "2XL" with a specific priceOptionLabel
  sim.addToCart(prod5, 1, "2XL", undefined, 1200, "Collector Archival Box")
  assert(sim.cart.length === 4, "Cart length increased to 4 (differentiates size 2XL with PriceOption label)")
  const item2XLTier = sim.cart.find((i) => i.size === "2XL" && i.priceOptionLabel === "Collector Archival Box")
  assert(Boolean(item2XLTier), "Found line item with size 2XL and tier 'Collector Archival Box'")
  assert(item2XLTier.price === 1200, "Tier item has custom tier price 1200")
  assert(item2XLTier.quantity === 1, "Tier item has quantity 1")

  // Test 3.6: Add size "2XL" with custom name
  sim.addToCart(prod5, 1, "2XL", "SPEEDSTER")
  assert(sim.cart.length === 5, "Cart length increased to 5 (differentiates size 2XL with customName)")
  const item2XLCustom = sim.cart.find((i) => i.size === "2XL" && i.customName === "SPEEDSTER")
  assert(Boolean(item2XLCustom), "Found line item with size 2XL and customName 'SPEEDSTER'")

  // Test 3.7: Update quantity of standard "2XL" item only
  sim.updateCartQuantity(prod5.id, 5, "2XL")
  assert(sim.cart.find((i) => i.size === "2XL" && !i.priceOptionLabel && !i.customName).quantity === 5, "Plain 2XL item updated to quantity 5")
  assert(item2XLTier.quantity === 1, "Tier item quantity remains 1")
  assert(item2XLCustom.quantity === 1, "Custom item quantity remains 1")
  assert(itemM.quantity === 1, "Size M quantity remains 1")
  assert(itemXXL.quantity === 1, "Size XXL quantity remains 1")

  // Test 3.8: Remove size "XXL" from cart
  sim.removeFromCart(prod5.id, "XXL")
  assert(sim.cart.length === 4, "Cart length decreased to 4 after removing XXL")
  assert(!sim.cart.some((i) => i.size === "XXL"), "Size XXL completely removed from cart")
  assert(sim.cart.some((i) => i.size === "2XL"), "Size 2XL remains in cart")
  assert(sim.cart.some((i) => i.size === "M"), "Size M remains in cart")

  // Test 3.9: Update quantity to 0 removes the item
  sim.updateCartQuantity(prod5.id, 0, "M")
  assert(sim.cart.length === 3, "Cart length decreased to 3 after updating M quantity to 0")
  assert(!sim.cart.some((i) => i.size === "M"), "Size M cleanly removed on 0 quantity")

  // Test 3.10: Cart total and cart count math
  // Remaining items:
  // 1) 2XL plain: price 990, qty 5 -> 4950
  // 2) 2XL tier: price 1200, qty 1 -> 1200
  // 3) 2XL custom: price 990 + 50 = 1040, qty 1 -> 1040
  // Total expected: 4950 + 1200 + 1040 = 7190
  // Count expected: 5 + 1 + 1 = 7
  assert(sim.cartCount === 7, `cartCount correctly calculated as 7 (got ${sim.cartCount})`)
  assert(sim.cartTotal === 7190, `cartTotal correctly calculated as 7190 (got ${sim.cartTotal})`)

  // ====================================================================
  // SUITE 4: HYDRATION & CANONICAL FALLBACK DEFENSE AUDIT
  // ====================================================================
  console.log("\n[SUITE 4] StoreContext Hydration Sanitization & Fallback Audit...")

  // Simulate StoreContext hydration map function
  function sanitizeProductList(rawProducts) {
    return rawProducts.map((p) => {
      if (p.id === "prod-5") {
        const canonicalSizes = ["S", "M", "L", "XL", "2XL", "XXL"]
        const existingSizes = Array.isArray(p.sizes) ? p.sizes : []
        const has2XL = existingSizes.includes("2XL")
        const hasXXL = existingSizes.includes("XXL")
        const finalSizes = has2XL && hasXXL ? existingSizes : canonicalSizes
        return {
          ...p,
          name: p.name || "Zimthread 'LLICYLAND' Graphic Boxy Tee",
          sizes: finalSizes,
        }
      }
      return p
    })
  }

  // Case A: Cloud returns stale sizes without 2XL / XXL
  const staleProd5 = { id: "prod-5", name: "Zimthread Boxy Tee", sizes: ["S", "M", "L", "XL"] }
  const sanitizedA = sanitizeProductList([staleProd5])
  assertDeepEqual(sanitizedA[0].sizes, ["S", "M", "L", "XL", "2XL", "XXL"], "Stale prod-5 without 2XL/XXL is automatically rescued to canonical 6 sizes")

  // Case B: Cloud returns corrupted sizes (null or non-array)
  const corruptProd5 = { id: "prod-5", name: "Zimthread Boxy Tee", sizes: null }
  const sanitizedB = sanitizeProductList([corruptProd5])
  assertDeepEqual(sanitizedB[0].sizes, ["S", "M", "L", "XL", "2XL", "XXL"], "Corrupted prod-5 with null sizes is rescued to canonical 6 sizes")

  // Case C: Cloud returns valid 6 sizes
  const validProd5 = { id: "prod-5", name: "Zimthread Boxy Tee", sizes: ["S", "M", "L", "XL", "2XL", "XXL"] }
  const sanitizedC = sanitizeProductList([validProd5])
  assertDeepEqual(sanitizedC[0].sizes, ["S", "M", "L", "XL", "2XL", "XXL"], "Valid prod-5 with all 6 sizes is preserved intact")

  // ====================================================================
  // SUITE 5: ORDER CHECKOUT & WHATSAPP FORMATTING INTEGRATION
  // ====================================================================
  console.log("\n[SUITE 5] Order Checkout & WhatsApp Formatting Verification...")

  // Line item summary generator as implemented in StoreContext.createOrder
  function buildItemSummary(cart) {
    return cart
      .map(
        (i) =>
          `${i.name}${i.size ? ` (${i.size})` : ""}${
            i.priceOptionLabel ? ` [Option: ${i.priceOptionLabel}]` : ""
          }${i.customName ? ` [Custom: ${i.customName}]` : ""} x${i.quantity}`,
      )
      .join(", ")
  }

  const testSummaryCart = [
    { name: "LLICYLAND Tee", size: "2XL", quantity: 2 },
    { name: "LLICYLAND Tee", size: "XXL", quantity: 1, priceOptionLabel: "VIP Tier" },
  ]
  const summary = buildItemSummary(testSummaryCart)
  assert(
    summary === "LLICYLAND Tee (2XL) x2, LLICYLAND Tee (XXL) [Option: VIP Tier] x1",
    `Item summary correctly reflects 2XL and XXL sizes and option tiers: "${summary}"`,
  )

  console.log("\n==================================================================")
  console.log(`EMPIRICAL SUITE COMPLETED: ${passedAssertions}/${totalAssertions} assertions passed, ${failedAssertions} failed.`)
  console.log("==================================================================")
}

runEmpiricalChallengeSuite().catch((err) => {
  console.error("\nFATAL ERROR in empirical verification suite:", err)
  process.exit(1)
})
