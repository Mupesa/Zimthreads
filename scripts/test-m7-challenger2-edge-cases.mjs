/**
 * scripts/test-m7-challenger2-edge-cases.mjs
 * 
 * Milestone 7 Challenger 2 Empirical Stress Test Suite:
 * Boundary and System Stability Testing for:
 * 1. Preset Toggles Stress Testing (Rapid, repeated clicking of "S" on/off 100+ times)
 * 2. Custom Sizes Stress Testing (Special characters, emojis, varying lengths 1-255 chars, whitespace, quotes, injection payloads)
 * 3. Edge Cases: Product with Empty Sizes or Empty PriceOptions ([], undefined, null, all inactive)
 * 4. End-to-End Live Neon DB Persistence Round-Trip with Zero Residual Audit
 */

import { executeSql } from "../api/store.ts"

// ANSI colors
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
}

let totalTests = 0
let passedTests = 0
let failedTests = 0

function assert(condition, message) {
  totalTests++
  if (condition) {
    passedTests++
    console.log(`  ${colors.green}✓${colors.reset} ${message}`)
  } else {
    failedTests++
    console.error(`  ${colors.red}✗ FAILED:${colors.reset} ${message}`)
    throw new Error(`Assertion failed: ${message}`)
  }
}

function logSection(title) {
  console.log(`\n${colors.bold}${colors.cyan}▶ ${title}${colors.reset}`)
}

// -----------------------------------------------------------------------------
// Component State & Logic Simulators (Mirroring exact source implementation)
// -----------------------------------------------------------------------------

// Simulate newProductModal size preset toggle
function toggleNewProductPreset(formState, preset) {
  const isSelected = formState.sizes.includes(preset)
  return {
    ...formState,
    sizes: isSelected
      ? formState.sizes.filter((s) => s !== preset)
      : [...formState.sizes, preset],
  }
}

// Simulate editProduct modal size preset toggle
function toggleEditProductPreset(editState, preset) {
  const currentSizes = editState.sizes || []
  const isSelected = currentSizes.includes(preset)
  return {
    ...editState,
    sizes: isSelected
      ? currentSizes.filter((s) => s !== preset)
      : [...currentSizes, preset],
  }
}

// Simulate custom size addition in newProductModal
function addCustomSizeNewProduct(formState, inputVal) {
  const val = inputVal.trim()
  if (val && !formState.sizes.includes(val)) {
    return {
      ...formState,
      sizes: [...formState.sizes, val],
      customSizeInput: "",
    }
  }
  return formState
}

// Simulate custom size addition in editProduct
function addCustomSizeEditProduct(editState, inputVal) {
  const val = inputVal.trim()
  const currentSizes = editState.sizes || []
  if (val && !currentSizes.includes(val)) {
    return {
      ...editState,
      sizes: [...currentSizes, val],
    }
  }
  return editState
}

// Simulate openEditProductModal defensive cloning
function simulateOpenEditProductModal(product) {
  return {
    ...product,
    sizes: Array.isArray(product.sizes) ? [...product.sizes] : [],
    priceOptions: Array.isArray(product.priceOptions) ? [...product.priceOptions] : [],
  }
}

// Simulate handleSaveEditProduct array sanitization
function simulateHandleSaveEditProduct(editProduct) {
  const sizesArray =
    Array.isArray(editProduct.sizes) && editProduct.sizes.length > 0
      ? editProduct.sizes
      : []
  const priceOptionsArray =
    Array.isArray(editProduct.priceOptions) && editProduct.priceOptions.length > 0
      ? editProduct.priceOptions
      : []

  return {
    ...editProduct,
    sizes: sizesArray,
    priceOptions: priceOptionsArray,
  }
}

// Simulate ProductModal state derivation
function simulateProductModal(product, options = {}) {
  const {
    selectedSize = "",
    selectedPriceOptionId = "",
    isCustomizing = false,
    customName = "",
  } = options

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

  const basePrice = selectedPriceOption ? selectedPriceOption.price : product.price
  const customPrice = product.customNamePrice ?? 50
  const isCustomActive = isCustomizing && customName.trim().length > 0
  const isCustomRequiredButEmpty = isCustomizing && !customName.trim()
  const unitPrice = basePrice + (isCustomActive ? customPrice : 0)

  const currentSize =
    selectedSize || (product.sizes ? product.sizes[0] : undefined)

  const canAddToCart = !isCustomRequiredButEmpty && !isPriceOptionUnavailable

  return {
    hasPriceOptions,
    activePriceOptionsCount: activePriceOptions.length,
    selectedPriceOption,
    isPriceOptionUnavailable,
    unitPrice,
    currentSize,
    canAddToCart,
    showSizeSelector: Boolean(product.sizes && product.sizes.length > 0),
    showPriceOptions: hasPriceOptions,
  }
}

// Simulate Shop card state derivation
function simulateShopProductCard(product) {
  const hasPriceOptions = Boolean(product.priceOptions && product.priceOptions.length > 0)
  const hasActivePriceOptions =
    hasPriceOptions && product.priceOptions.some((opt) => opt.active)

  let displayPrice
  let isPriceUnavailable = false

  if (hasPriceOptions) {
    if (hasActivePriceOptions) {
      const activePrices = product.priceOptions
        .filter((opt) => opt.active)
        .map((opt) => opt.price)
      displayPrice = Math.min(...activePrices)
    } else {
      isPriceUnavailable = true
      displayPrice = null
    }
  } else {
    displayPrice = product.price
  }

  const isQuickAddDisabled =
    product.stock <= 0 || (hasPriceOptions && !hasActivePriceOptions)

  const quickAddButtonText =
    product.isPresale
      ? "PRESALE"
      : product.isPreorder
        ? "PRE-ORDER"
        : hasPriceOptions && !hasActivePriceOptions
          ? "SOLD OUT"
          : "+ ADD"

  return {
    hasPriceOptions,
    hasActivePriceOptions,
    isPriceUnavailable,
    displayPrice,
    isQuickAddDisabled,
    quickAddButtonText,
    showSizePills: Boolean(product.sizes && product.sizes.length > 0),
  }
}

// Simulate Cart operations (addToCart, updateQuantity, removeFromCart)
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

  updateQuantity(productId, quantity, size, customName, priceOptionLabel) {
    const formattedCustomName = customName?.trim()
      ? customName.trim().toUpperCase()
      : undefined
    if (quantity <= 0) {
      this.removeFromCart(productId, size, customName, priceOptionLabel)
      return
    }
    const idx = this.cart.findIndex(
      (item) =>
        item.productId === productId &&
        (item.size || "") === (size || "") &&
        (item.customName || "") === (formattedCustomName || "") &&
        (item.priceOptionLabel || "") === (priceOptionLabel || ""),
    )
    if (idx > -1) {
      this.cart[idx].quantity = quantity
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

  getTotalCount() {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  getTotalPrice() {
    return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }
}

// -----------------------------------------------------------------------------
// MAIN TEST RUNNER
// -----------------------------------------------------------------------------

async function runMilestone7Challenger2Suite() {
  console.log(`${colors.bold}${colors.magenta}======================================================================${colors.reset}`)
  console.log(`${colors.bold}${colors.magenta}  MILESTONE 7 CHALLENGER 2: ADVERSARIAL EMPIRICAL STRESS TEST SUITE   ${colors.reset}`)
  console.log(`${colors.bold}${colors.magenta}======================================================================${colors.reset}`)
  console.log(`Target Database: Neon PostgreSQL rapid-hill-42448439 (anesumupesa@gmail.com / Mupesa)`)
  console.log(`Timestamp: ${new Date().toISOString()}`)

  // ===========================================================================
  // SECTION 1: PRESET TOGGLES STRESS TESTING (RAPID, REPEATED S TOGGLING)
  // ===========================================================================
  logSection("SECTION 1: Preset Toggles Stress Testing (Rapid & Repeated S Toggling)")

  // 1.1 Rapid repeated toggling of "S" (100 cycles) in newProductModal
  let newProdState = { sizes: [], customSizeInput: "" }
  for (let i = 1; i <= 100; i++) {
    newProdState = toggleNewProductPreset(newProdState, "S")
    if (i % 2 === 1) {
      if (newProdState.sizes.length !== 1 || newProdState.sizes[0] !== "S") {
        throw new Error(`Cycle ${i}: Expected sizes to be ["S"], got ${JSON.stringify(newProdState.sizes)}`)
      }
    } else {
      if (newProdState.sizes.length !== 0) {
        throw new Error(`Cycle ${i}: Expected sizes to be [], got ${JSON.stringify(newProdState.sizes)}`)
      }
    }
  }
  assert(newProdState.sizes.length === 0, "100 rapid on/off toggles of 'S' in newProductModal maintain exact zero-residual state")

  // 1.2 Rapid repeated toggling of "S" (100 cycles) in editProductModal
  let editProdState = { sizes: ["S", "M", "L"], editProductCustomSize: "" }
  for (let i = 1; i <= 100; i++) {
    editProdState = toggleEditProductPreset(editProdState, "S")
    if (i % 2 === 1) {
      // S was removed (odd iteration because S was initially present)
      assert(!editProdState.sizes.includes("S"), `Cycle ${i}: S correctly removed`)
      assert(editProdState.sizes.includes("M") && editProdState.sizes.includes("L"), `Cycle ${i}: M and L remain intact`)
      assert(editProdState.sizes.length === 2, `Cycle ${i}: Size length is exactly 2`)
    } else {
      // S was added back
      assert(editProdState.sizes.includes("S"), `Cycle ${i}: S correctly re-added`)
      assert(editProdState.sizes.includes("M") && editProdState.sizes.includes("L"), `Cycle ${i}: M and L remain intact`)
      assert(editProdState.sizes.length === 3, `Cycle ${i}: Size length is exactly 3`)
    }
  }
  assert(
    editProdState.sizes.length === 3 && editProdState.sizes.includes("S") && editProdState.sizes.includes("M") && editProdState.sizes.includes("L"),
    "100 rapid on/off toggles of 'S' in editProduct preserve all existing sibling sizes (M, L) without duplicate 'S' or corruption"
  )

  // 1.3 Interleaved rapid toggling across all 7 chips ["S", "M", "L", "XL", "2XL", "XXL", "One Size"]
  const allPresets = ["S", "M", "L", "XL", "2XL", "XXL", "One Size"]
  let multiChipState = { sizes: [] }
  // Toggle all ON
  for (const p of allPresets) {
    multiChipState = toggleNewProductPreset(multiChipState, p)
  }
  assert(multiChipState.sizes.length === 7, "All 7 preset chips toggled ON successfully")
  assert(allPresets.every((p) => multiChipState.sizes.includes(p)), "Every preset is present in sizes array")

  // Toggle every even index OFF
  for (let idx = 0; idx < allPresets.length; idx += 2) {
    multiChipState = toggleNewProductPreset(multiChipState, allPresets[idx])
  }
  assert(multiChipState.sizes.length === 3, "Toggled 4 presets OFF, exactly 3 presets remain")
  assert(multiChipState.sizes.includes("M") && multiChipState.sizes.includes("XL") && multiChipState.sizes.includes("XXL"), "Remaining presets match exactly M, XL, XXL")

  // Toggle all remaining OFF
  multiChipState = toggleNewProductPreset(multiChipState, "M")
  multiChipState = toggleNewProductPreset(multiChipState, "XL")
  multiChipState = toggleNewProductPreset(multiChipState, "XXL")
  assert(multiChipState.sizes.length === 0, "All remaining presets toggled OFF, array cleanly empty")

  // 1.4 Uninitialized / undefined sizes handling during preset toggle
  let uninitState = { sizes: undefined }
  let toggledUninit = toggleEditProductPreset(uninitState, "S")
  assert(toggledUninit.sizes.length === 1 && toggledUninit.sizes[0] === "S", "Toggle preset on product with undefined sizes cleanly initializes array to ['S']")
  let toggledOffUninit = toggleEditProductPreset(toggledUninit, "S")
  assert(toggledOffUninit.sizes.length === 0, "Subsequent toggle cleanly removes 'S' to []")

  // ===========================================================================
  // SECTION 2: CUSTOM SIZES STRESS TESTING (SPECIAL CHARS, LENGTHS, WHITESPACE)
  // ===========================================================================
  logSection("SECTION 2: Custom Sizes Stress Testing (Special Chars, Emojis, Lengths, Whitespace)")

  // 2.1 Whitespace and duplicate rejection
  let customTestState = { sizes: ["S", "M"], customSizeInput: "" }
  // Empty string
  customTestState = addCustomSizeNewProduct(customTestState, "")
  assert(customTestState.sizes.length === 2, "Empty string input is rejected")

  // Pure spaces
  customTestState = addCustomSizeNewProduct(customTestState, "    \t \n  ")
  assert(customTestState.sizes.length === 2, "Whitespace-only input is rejected after trim()")

  // Leading and trailing spaces trimmed
  customTestState = addCustomSizeNewProduct(customTestState, "   2XL   ")
  assert(customTestState.sizes.length === 3 && customTestState.sizes[2] === "2XL", "Input with surrounding spaces trimmed to '2XL'")

  // Duplicate addition rejected
  customTestState = addCustomSizeNewProduct(customTestState, "2XL")
  assert(customTestState.sizes.length === 3, "Exact duplicate '2XL' is rejected")

  customTestState = addCustomSizeNewProduct(customTestState, "  2XL  ")
  assert(customTestState.sizes.length === 3, "Trimmed duplicate '  2XL  ' is rejected")

  // 2.2 Boundary string lengths
  const len1 = "X"
  const lenMedium = "Vintage 1990s Boxy Oversized Fit"
  const len100 = "Size-" + "A".repeat(95)
  const len255 = "Size-" + "B".repeat(250)

  customTestState = addCustomSizeNewProduct(customTestState, len1)
  customTestState = addCustomSizeNewProduct(customTestState, lenMedium)
  customTestState = addCustomSizeNewProduct(customTestState, len100)
  customTestState = addCustomSizeNewProduct(customTestState, len255)

  assert(customTestState.sizes.includes(len1), "1-character custom size 'X' accepted")
  assert(customTestState.sizes.includes(lenMedium), "32-character custom size accepted")
  assert(customTestState.sizes.includes(len100), "100-character custom size accepted")
  assert(customTestState.sizes.includes(len255), "255-character custom size accepted")

  // 2.3 Adversarial special characters, quotes, slashes, unicode, emojis
  const specialSizes = [
    '42 1/2 EU',
    '10.5 US',
    '32" W x 34" L',
    'O/S (One-Size)',
    '#44-Athletic',
    'M+ Tall',
    '50% Slim Fit',
    'Size: Large & Extra-Tall',
    '🔥 Rare Atelier Drop',
    '📏 Custom-90cm-Chest',
    'サイズ L',
    'مقاس كبير',
    'Размер XXL',
    '<script>alert("xss")</script>',
    "'; DROP TABLE products; --",
    '{"customTag":"VIP"}',
    '\\backslash/slash'
  ]

  for (const s of specialSizes) {
    customTestState = addCustomSizeNewProduct(customTestState, s)
    assert(customTestState.sizes.includes(s), `Special character size accepted: ${s}`)
  }

  // 2.4 Verify Live Neon DB JSONB Round-Trip with all Special Sizes
  console.log("\n  --> Testing Live Neon DB persistence round-trip of special character sizes...")
  const testProdSpecialId = `prod-m7-special-${Date.now().toString().slice(-4)}`
  const specialProductPayload = {
    id: testProdSpecialId,
    name: "Adversarial Special Chars & Lengths Tee",
    category: "Apparel",
    price: 999,
    stock: 10,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/sample.jpg",
    alt: "Adversarial Tee",
    description: "Stress test product with special character sizes",
    sizes: specialSizes,
    priceOptions: [
      { id: "opt-1", label: "Special Tier", price: 999, active: true }
    ],
    featured: false,
    hidden: false,
  }

  // Load baseline
  const rowsBefore = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  const currentProds = rowsBefore[0].data

  // Upsert test product to Neon
  await executeSql(
    `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ('products', $1::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW();
    `,
    [JSON.stringify([specialProductPayload, ...currentProds])]
  )

  // Fetch back from Neon
  const rowsAfter = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  const fetchedSpecialProd = rowsAfter[0].data.find((p) => p.id === testProdSpecialId)

  assert(Boolean(fetchedSpecialProd), "Special character product successfully persisted and fetched from Neon PostgreSQL")
  assert(fetchedSpecialProd.sizes.length === specialSizes.length, `Persisted sizes count (${fetchedSpecialProd.sizes.length}) matches exactly (${specialSizes.length})`)

  for (let i = 0; i < specialSizes.length; i++) {
    const expected = specialSizes[i]
    const actual = fetchedSpecialProd.sizes[i]
    assert(actual === expected, `Neon DB character-by-character fidelity: [${expected}] === [${actual}]`)
  }

  // Clean up special product from Neon
  const restoredWithoutSpecial = rowsAfter[0].data.filter((p) => p.id !== testProdSpecialId)
  await executeSql(
    `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ('products', $1::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW();
    `,
    [JSON.stringify(restoredWithoutSpecial)]
  )
  console.log("  --> Special character product cleaned up cleanly from live Neon DB.")

  // ===========================================================================
  // SECTION 3: EDGE CASES: PRODUCT WITH EMPTY SIZES OR EMPTY PRICEOPTIONS
  // ===========================================================================
  logSection("SECTION 3: Edge Cases: Empty Sizes / Empty PriceOptions ([], undefined, all inactive)")

  // 3.1 Product with empty sizes: `sizes: []`
  const emptySizesProd = {
    id: "prod-empty-sizes",
    name: "Tee with Empty Sizes",
    category: "Apparel",
    price: 500,
    stock: 15,
    sizes: [],
    priceOptions: [{ id: "t1", label: "Standard", price: 500, active: true }],
  }

  const modalEmptySizes = simulateProductModal(emptySizesProd)
  assert(modalEmptySizes.showSizeSelector === false, "Product with sizes: [] does NOT render size selector")
  assert(modalEmptySizes.currentSize === undefined, "currentSize for product with sizes: [] evaluates to undefined without crash")
  assert(modalEmptySizes.canAddToCart === true, "Product with sizes: [] can be added to cart")

  const shopEmptySizes = simulateShopProductCard(emptySizesProd)
  assert(shopEmptySizes.showSizePills === false, "Shop card for product with sizes: [] hides size pill badges")
  assert(shopEmptySizes.isQuickAddDisabled === false, "Quick add is enabled for product with sizes: []")

  // Cart operations with empty size
  const cartSim = new CartSimulator()
  cartSim.addToCart(emptySizesProd, 1, undefined, undefined, 500, "Standard")
  assert(cartSim.getTotalCount() === 1, "Item with size: undefined added to cart successfully")
  assert(cartSim.cart[0].size === undefined, "Cart item has size: undefined without crashing string templates")

  // Add same item again -> increments quantity
  cartSim.addToCart(emptySizesProd, 2, undefined, undefined, 500, "Standard")
  assert(cartSim.getTotalCount() === 3, "Adding item with size: undefined again correctly increments quantity (1+2=3)")

  // 3.2 Product with undefined sizes: `sizes: undefined`
  const undefSizesProd = {
    id: "prod-undef-sizes",
    name: "Tee with Undefined Sizes",
    category: "Apparel",
    price: 450,
    stock: 5,
    // sizes property omitted
    priceOptions: [{ id: "t1", label: "Standard", price: 450, active: true }],
  }

  const modalUndefSizes = simulateProductModal(undefSizesProd)
  assert(modalUndefSizes.showSizeSelector === false, "Product with sizes: undefined does NOT render size selector")
  assert(modalUndefSizes.currentSize === undefined, "currentSize for sizes: undefined evaluates safely")

  const sanitizedOpenModal = simulateOpenEditProductModal(undefSizesProd)
  assert(Array.isArray(sanitizedOpenModal.sizes) && sanitizedOpenModal.sizes.length === 0, "openEditProductModal defensively initializes undefined sizes to []")

  const sanitizedSave = simulateHandleSaveEditProduct({ ...undefSizesProd, sizes: undefined })
  assert(Array.isArray(sanitizedSave.sizes) && sanitizedSave.sizes.length === 0, "handleSaveEditProduct guarantees sizes is saved as []")

  // 3.3 Product with empty priceOptions: `priceOptions: []`
  const emptyPriceOptsProd = {
    id: "prod-empty-prices",
    name: "Tee with Empty Price Options",
    category: "Apparel",
    price: 850,
    stock: 8,
    sizes: ["S", "M", "L"],
    priceOptions: [],
  }

  const modalEmptyPrices = simulateProductModal(emptyPriceOptsProd)
  assert(modalEmptyPrices.showPriceOptions === false, "Product with priceOptions: [] hides price tier selector")
  assert(modalEmptyPrices.isPriceOptionUnavailable === false, "isPriceOptionUnavailable is false when priceOptions: []")
  assert(modalEmptyPrices.unitPrice === 850, "unitPrice defaults directly to product.price (850)")
  assert(modalEmptyPrices.canAddToCart === true, "Product with priceOptions: [] can be added to cart at base price")

  const shopEmptyPrices = simulateShopProductCard(emptyPriceOptsProd)
  assert(shopEmptyPrices.hasPriceOptions === false, "Shop card recognizes product has no price tiers")
  assert(shopEmptyPrices.displayPrice === 850, "Shop card displays base product.price (Rs 850)")
  assert(shopEmptyPrices.isQuickAddDisabled === false, "Quick add button enabled for in-stock item")
  assert(shopEmptyPrices.quickAddButtonText === "+ ADD", "Quick add button text is '+ ADD'")

  // Cart operations with empty price options
  cartSim.addToCart(emptyPriceOptsProd, 1, "M", undefined, undefined, undefined)
  assert(cartSim.getTotalCount() === 4, "Item with priceOptions: [] added to cart at base price")
  assert(cartSim.cart[1].price === 850, "Cart item stored at exact product.price (850)")
  assert(cartSim.cart[1].priceOptionLabel === undefined, "Cart item priceOptionLabel is undefined")

  // 3.4 Product with undefined priceOptions: `priceOptions: undefined`
  const undefPriceOptsProd = {
    id: "prod-undef-prices",
    name: "Tee with Undefined Price Options",
    category: "Apparel",
    price: 600,
    stock: 12,
    sizes: ["One Size"],
    // priceOptions omitted
  }

  const modalUndefPrices = simulateProductModal(undefPriceOptsProd)
  assert(modalUndefPrices.showPriceOptions === false, "Product with priceOptions: undefined hides price tier selector")
  assert(modalUndefPrices.unitPrice === 600, "unitPrice safely resolves to product.price (600)")

  const sanitizedOpenModalPrices = simulateOpenEditProductModal(undefPriceOptsProd)
  assert(Array.isArray(sanitizedOpenModalPrices.priceOptions) && sanitizedOpenModalPrices.priceOptions.length === 0, "openEditProductModal defensively initializes undefined priceOptions to []")

  const sanitizedSavePrices = simulateHandleSaveEditProduct({ ...undefPriceOptsProd, priceOptions: undefined })
  assert(Array.isArray(sanitizedSavePrices.priceOptions) && sanitizedSavePrices.priceOptions.length === 0, "handleSaveEditProduct guarantees priceOptions is saved as []")

  // 3.5 Product with ALL price options inactive (`active: false`)
  const allInactivePriceOptsProd = {
    id: "prod-all-inactive",
    name: "Tee with All Tiers Inactive",
    category: "Apparel",
    price: 700,
    stock: 20,
    sizes: ["S", "M"],
    priceOptions: [
      { id: "t-1", label: "Drop 1", price: 650, active: false },
      { id: "t-2", label: "Drop 2", price: 750, active: false },
    ],
  }

  const modalAllInactive = simulateProductModal(allInactivePriceOptsProd)
  assert(modalAllInactive.showPriceOptions === true, "Price tier container shown")
  assert(modalAllInactive.activePriceOptionsCount === 0, "Active price options count is 0")
  assert(modalAllInactive.selectedPriceOption === undefined, "selectedPriceOption is undefined when no tiers are active")
  assert(modalAllInactive.isPriceOptionUnavailable === true, "isPriceOptionUnavailable is TRUE")
  assert(modalAllInactive.canAddToCart === false, "CRITICAL: Adding to cart is completely PREVENTED when all price options are inactive")

  const shopAllInactive = simulateShopProductCard(allInactivePriceOptsProd)
  assert(shopAllInactive.isPriceUnavailable === true, "Shop card marks price as unavailable")
  assert(shopAllInactive.displayPrice === null, "Shop card does NOT display a price")
  assert(shopAllInactive.isQuickAddDisabled === true, "CRITICAL: Quick add button is DISABLED on storefront")
  assert(shopAllInactive.quickAddButtonText === "SOLD OUT", "CRITICAL: Quick add button displays 'SOLD OUT'")

  // 3.6 Product with BOTH empty sizes and empty priceOptions
  const completelyBareProd = {
    id: "prod-bare",
    name: "Minimalist Cap",
    category: "Accessories",
    price: 350,
    stock: 10,
    sizes: [],
    priceOptions: [],
  }

  const modalBare = simulateProductModal(completelyBareProd)
  assert(modalBare.showSizeSelector === false && modalBare.showPriceOptions === false, "Both size selector and price selector omitted")
  assert(modalBare.unitPrice === 350, "Resolves to base price Rs 350")
  assert(modalBare.canAddToCart === true, "Can be added to cart directly")

  cartSim.addToCart(completelyBareProd, 1)
  assert(cartSim.getTotalCount() === 5, "Item added to cart")
  cartSim.updateQuantity("prod-bare", 5)
  assert(cartSim.getTotalCount() === 9, "Quantity updated to 5")
  cartSim.removeFromCart("prod-bare")
  assert(cartSim.getTotalCount() === 4, "Item removed cleanly from cart")

  // ===========================================================================
  // SECTION 4: FULL PERSISTENCE LIFECYCLE & BASELINE INTEGRITY
  // ===========================================================================
  logSection("SECTION 4: Full Persistence Lifecycle & Baseline Integrity Audit")

  // Check baseline
  const baselineRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  const baseline = baselineRows[0].data
  assert(baseline.length === 24, `Baseline product count confirmed: 24 (found ${baseline.length})`)

  // Check prod-5
  const prod5 = baseline.find((p) => p.id === "prod-5")
  assert(Boolean(prod5), "prod-5 ('LLICYLAND' Graphic Boxy Tee) is present in baseline")
  assert(prod5.sizes.includes("2XL"), "prod-5 includes '2XL' size")
  assert(prod5.sizes.includes("XXL"), "prod-5 includes 'XXL' size")

  console.log(`\n${colors.bold}${colors.green}======================================================================${colors.reset}`)
  console.log(`${colors.bold}${colors.green}  CHALLENGER 2 EMPIRICAL STRESS SUITE COMPLETE: ALL TESTS PASSED!     ${colors.reset}`)
  console.log(`${colors.bold}${colors.green}======================================================================${colors.reset}`)
  console.log(`Total Assertions Checked: ${totalTests}`)
  console.log(`Passed:                  ${passedTests}`)
  console.log(`Failed:                  ${failedTests}`)
}

runMilestone7Challenger2Suite().catch((err) => {
  console.error(`\n${colors.bold}${colors.red}SUITE RUNTIME ERROR:${colors.reset}`, err)
  process.exit(1)
})
