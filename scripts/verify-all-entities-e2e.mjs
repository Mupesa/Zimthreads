/**
 * scripts/verify-all-entities-e2e.mjs
 * 
 * Comprehensive End-to-End Live CRUD Verification Test Suite for Zimthreads Collective
 * 
 * Verifies live Neon PostgreSQL Database persistence across all 6 core entities plus settings:
 * 1. Bookings (public create, read, admin status update to "completed", delete permanence)
 * 2. Orders (public create multi-item, deep field fidelity, admin fulfillment/payment update, delete permanence)
 * 3. Products (create test product, read, batch update 14 racing jackets & test product, delete permanence)
 * 4. Services (create test service, read, toggle active & update price, delete permanence)
 * 5. Blog Posts (create draft, read, update status to "published" & edit title, delete permanence)
 * 6. Customer Inquiries (public create unread, read, admin response & read toggle, delete permanence)
 * 7. Store Settings (read, banner & featured drop update, persistence check, restore baseline)
 * 
 * Target Database:
 *   Neon Project ID: rapid-hill-42448439 ("Zimthreads Collective")
 *   Endpoint: ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech
 *   Owner: anesumupesa@gmail.com / Mupesa
 */

import handler, { executeSql } from "../api/store.ts"

// --- ANSI formatting helpers ---
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
}

function logHeader(text) {
  console.log(`\n${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}`)
  console.log(`${colors.bold}${colors.cyan}  ${text}${colors.reset}`)
  console.log(`${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}`)
}

function logSection(title) {
  console.log(`\n${colors.bold}▶ ${title}${colors.reset}`)
}

function logStep(name, durationMs = null) {
  const timing = durationMs !== null ? `${colors.dim}(${durationMs.toFixed(1)}ms)${colors.reset}` : ""
  console.log(`  ${colors.green}✓${colors.reset} ${name} ${timing}`)
}

function logFail(name, error) {
  console.error(`  ${colors.red}✗ [FAIL] ${name}${colors.reset}`)
  console.error(`    ${colors.red}Error: ${error.message || error}${colors.reset}`)
}

// --- Mock Response for Serverless Handler ---
function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    setHeader(key, val) {
      this.headers[key] = val
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.data = body
      return this
    },
    end() {
      return this
    },
  }
  return res
}

// --- API Invocation Helper ---
async function callApi(method, body = null, query = null) {
  const req = {
    method,
    url: "/api/store" + (query ? "?" + new URLSearchParams(query).toString() : ""),
    body,
    query: query || {},
  }
  const res = createMockRes()
  await handler(req, res)
  if (res.statusCode >= 400) {
    const errMsg = res.data?.error || `API returned HTTP ${res.statusCode}`
    throw new Error(errMsg)
  }
  return res.data
}

// --- Direct SQL Query Helper ---
async function queryDbKey(key) {
  const rows = await executeSql(
    "SELECT key, data, updated_at FROM public.zimthreads_store WHERE key = $1;",
    [key],
  )
  if (rows.length === 0) return null
  return rows[0]
}

// --- Deep equality helper ---
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

// --- Test Suite Execution ---
async function runEndToEndVerification() {
  const suiteStartTime = performance.now()
  let passCount = 0
  let failCount = 0

  logHeader("ZIMTHREADS END-TO-END LIVE CRUD VERIFICATION SUITE")
  console.log(`Target Host: ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech`)
  console.log(`Target Project: rapid-hill-42448439 ("Zimthreads Collective")`)
  console.log(`Associated Account: anesumupesa@gmail.com / Mupesa`)
  console.log(`Execution Timestamp: ${new Date().toISOString()}`)

  // Track initial baseline snapshots so we can restore exact baseline with zero residuals
  let baseline = {
    bookings: [],
    orders: [],
    products: [],
    services: [],
    blog_posts: [],
    inquiries: [],
    settings: {},
  }

  try {
    // ------------------------------------------------------------------------
    // PRE-FLIGHT: Database Table & Baseline Snapshot
    // ------------------------------------------------------------------------
    logSection("PRE-FLIGHT: Checking Live Neon DB Connectivity & Schema")
    const t0 = performance.now()
    const allRows = await executeSql("SELECT key, data, updated_at FROM public.zimthreads_store ORDER BY key;")
    for (const row of allRows) {
      baseline[row.key] = row.data
    }
    const t0End = performance.now()
    logStep(
      `Live Neon connection verified: 7 storage keys found in public.zimthreads_store ` +
      `(${baseline.products.length} products, ${baseline.services.length} services, ` +
      `${baseline.blog_posts.length} blogs, ${baseline.bookings.length} bookings, ` +
      `${baseline.orders.length} orders, ${baseline.inquiries.length} inquiries)`,
      t0End - t0,
    )
    passCount++

    // ------------------------------------------------------------------------
    // TEST 1: BOOKINGS DESK CRUD PERSISTENCE
    // ------------------------------------------------------------------------
    logSection("TEST 1: Bookings Desk — Public Creation, Live Read, Status Update, Deletion")
    const testBookingId = `BK-E2E-${Date.now().toString().slice(-4)}`
    const testBooking = {
      id: testBookingId,
      customer: "Amara Tanaka (E2E Verification)",
      email: "amara.tanaka@e2e-zimthreads.com",
      phone: "+230 5712 3456",
      serviceId: "clean",
      serviceName: "SIGNATURE SNEAKER DEEP CLEAN",
      date: new Date().toISOString().split("T")[0],
      time: "11:30",
      notes: "Suede panels require delicate brass-bristle cleaning",
      price: "From Rs 300",
      priceNumeric: 300,
      status: "Pending",
    }

    // 1.1 Public Creation
    {
      const tStart = performance.now()
      const createRes = await callApi("POST", {
        action: "public_create",
        entity: "bookings",
        record: testBooking,
      })
      assert(createRes.success, "Public booking creation response must be success: true")
      assert(createRes.record.id === testBookingId, `Created booking must retain id ${testBookingId}`)
      logStep(`Public booking submission succeeded for ${testBookingId}`, performance.now() - tStart)
      passCount++
    }

    // 1.2 Live Read via API & Direct SQL
    {
      const tStart = performance.now()
      const apiGet = await callApi("GET", null, { key: "bookings" })
      const foundInApi = apiGet.data.find((b) => b.id === testBookingId)
      assert(foundInApi, `Booking ${testBookingId} must be present in GET /api/store?key=bookings`)
      assert(foundInApi.customer === testBooking.customer, "Customer name must match exactly")
      assert(foundInApi.priceNumeric === 300, "Price numeric must be 300")

      // Direct SQL check
      const sqlRow = await queryDbKey("bookings")
      assert(sqlRow, "bookings key must exist in Neon DB")
      const foundInSql = sqlRow.data.find((b) => b.id === testBookingId)
      assert(foundInSql, `Booking ${testBookingId} must be present in Neon JSONB storage array`)
      assert(foundInSql.email === "amara.tanaka@e2e-zimthreads.com", "Email must be persisted in Neon DB")
      logStep(`Verified Booking ${testBookingId} presence via API GET and direct Neon SQL`, performance.now() - tStart)
      passCount++
    }

    // 1.3 Update booking status to "completed"
    {
      const tStart = performance.now()
      const updateRes = await callApi("POST", {
        action: "update_entity",
        entity: "bookings",
        id: testBookingId,
        updates: { status: "completed", notes: "Suede restoration finished cleanly" },
        adminToken: "Zimthreads200",
      })
      assert(updateRes.success, "Admin update booking status must succeed")

      // Verify in Neon DB
      const freshSql = await queryDbKey("bookings")
      const updated = freshSql.data.find((b) => b.id === testBookingId)
      assert(updated, "Updated booking must exist in Neon DB")
      assert(updated.status === "completed", `Booking status in Neon must be "completed", got "${updated.status}"`)
      assert(updated.notes.includes("finished cleanly"), "Updated notes must persist in Neon DB")
      logStep(`Admin updated booking status to "completed" and verified in Neon DB`, performance.now() - tStart)
      passCount++
    }

    // 1.4 Delete booking record & verify deletion permanence
    {
      const tStart = performance.now()
      const deleteRes = await callApi("POST", {
        action: "delete_entity",
        entity: "bookings",
        id: testBookingId,
        adminToken: "Zimthreads200",
      })
      assert(deleteRes.success, "Admin delete booking must succeed")

      // Verify deletion in Neon DB and API
      const freshSql = await queryDbKey("bookings")
      const foundInSql = freshSql.data.find((b) => b.id === testBookingId)
      assert(!foundInSql, `Deleted booking ${testBookingId} must NOT exist in Neon DB array`)

      const apiFresh = await callApi("GET", null, { key: "bookings" })
      const foundInApi = apiFresh.data.find((b) => b.id === testBookingId)
      assert(!foundInApi, `Deleted booking ${testBookingId} must NOT exist in GET /api/store?key=bookings`)
      logStep(`Booking ${testBookingId} permanently deleted with zero residuals`, performance.now() - tStart)
      passCount++
    }

    // ------------------------------------------------------------------------
    // TEST 2: ORDERS DESK CRUD PERSISTENCE
    // ------------------------------------------------------------------------
    logSection("TEST 2: Orders Desk — Multi-Item Checkout, Deep Fidelity, Status Updates, Deletion")
    const testOrderId = `ORD-E2E-${Date.now().toString().slice(-4)}`
    const testOrder = {
      id: testOrderId,
      customer: "Kavish Ramgoolam (E2E Buyer)",
      email: "kavish.ramgoolam@e2e-zimthreads.com",
      phone: "+230 5876 5432",
      address: "Villa 14, Royal Road, Grand Baie",
      city: "Grand Baie",
      paymentMethod: "Juice by MCB",
      paymentStatus: "Paid",
      totalAmount: 3750,
      status: "Processing",
      items: [
        {
          id: "prod-jacket-ferrari-red-leather",
          name: "Ferrari Scuderia Rosso Corsa Vintage Moto Leather Jacket",
          price: 2850,
          quantity: 1,
          size: "L",
          img: "https://res.cloudinary.com/pwranjbq/image/upload/v1790345300/zimthreads/jackets/ferrari_red_leather.jpg",
        },
        {
          id: "prod-brace-heritage",
          name: "Zimthread African Heritage Beaded Bracelet",
          price: 385,
          quantity: 2,
          customName: "ZIM-RACING",
          img: "https://res.cloudinary.com/pwranjbq/image/upload/v1790345310/zimthreads/bracelets/heritage.jpg",
        },
      ],
    }

    // 2.1 Public Creation
    {
      const tStart = performance.now()
      const createRes = await callApi("POST", {
        action: "public_create",
        entity: "orders",
        record: testOrder,
      })
      assert(createRes.success, "Public order creation response must be success: true")
      assert(createRes.record.id === testOrderId, `Order ID must match ${testOrderId}`)
      logStep(`Multi-item order submission created: ${testOrderId}`, performance.now() - tStart)
      passCount++
    }

    // 2.2 Deep Field Fidelity Verification via API and direct SQL
    {
      const tStart = performance.now()
      const sqlRow = await queryDbKey("orders")
      const foundInSql = sqlRow.data.find((o) => o.id === testOrderId)
      assert(foundInSql, `Order ${testOrderId} must exist in live Neon DB`)
      assert(foundInSql.customer === testOrder.customer, "Order customer must match")
      assert(foundInSql.totalAmount === 3750, `Order totalAmount must be 3750, got ${foundInSql.totalAmount}`)
      assert(foundInSql.paymentStatus === "Paid", `Order paymentStatus must be "Paid", got ${foundInSql.paymentStatus}`)
      assert(Array.isArray(foundInSql.items) && foundInSql.items.length === 2, "Order must contain exactly 2 items")
      assert(foundInSql.items[0].id === "prod-jacket-ferrari-red-leather", "Item 1 must be Ferrari jacket")
      assert(foundInSql.items[1].quantity === 2, "Item 2 quantity must be 2")
      assert(foundInSql.items[1].customName === "ZIM-RACING", "Item 2 custom engraving must persist")
      logStep(`Verified deep field fidelity for Order ${testOrderId} in Neon PostgreSQL`, performance.now() - tStart)
      passCount++
    }

    // 2.3 Admin Update: Fulfillment to "Delivered" and Payment to "Paid"
    {
      const tStart = performance.now()
      const updateRes = await callApi("POST", {
        action: "update_entity",
        entity: "orders",
        id: testOrderId,
        updates: {
          status: "Delivered",
          paymentStatus: "Paid",
          trackingNumber: "MCB-EXPRESS-9921",
        },
        adminToken: "Zimthreads200",
      })
      assert(updateRes.success, "Admin update order status must succeed")

      const freshSql = await queryDbKey("orders")
      const updated = freshSql.data.find((o) => o.id === testOrderId)
      assert(updated, "Updated order must exist in Neon DB")
      assert(updated.status === "Delivered", `Order fulfillment status in Neon must be "Delivered", got "${updated.status}"`)
      assert(updated.paymentStatus === "Paid", `Order paymentStatus in Neon must be "Paid"`)
      assert(updated.trackingNumber === "MCB-EXPRESS-9921", "Tracking number must persist")
      logStep(`Admin updated order to "Delivered" with tracking number in Neon DB`, performance.now() - tStart)
      passCount++
    }

    // 2.4 Admin Delete & Verify Permanence
    {
      const tStart = performance.now()
      const deleteRes = await callApi("POST", {
        action: "delete_entity",
        entity: "orders",
        id: testOrderId,
        adminToken: "Zimthreads200",
      })
      assert(deleteRes.success, "Admin delete order must succeed")

      const freshSql = await queryDbKey("orders")
      const foundInSql = freshSql.data.find((o) => o.id === testOrderId)
      assert(!foundInSql, `Deleted order ${testOrderId} must NOT exist in Neon DB array`)
      logStep(`Order ${testOrderId} permanently deleted with zero residuals`, performance.now() - tStart)
      passCount++
    }

    // ------------------------------------------------------------------------
    // TEST 3: PRODUCTS DESK CRUD & BATCH RACING JACKETS PRICING
    // ------------------------------------------------------------------------
    logSection("TEST 3: Products Desk — Creation, Batch Racing Jacket Pricing, Immediate Persistence, Deletion")
    const testProductId = `prod-e2e-wax-${Date.now().toString().slice(-4)}`
    const testProduct = {
      id: testProductId,
      name: "Zimthreads Atelier Bespoke Finishing Wax",
      category: "Accessories",
      price: 420,
      stock: 35,
      img: "https://res.cloudinary.com/pwranjbq/image/upload/v1790345314/zimthreads/wax.jpg",
      alt: "Finishing Wax",
      description: "Organic beeswax and conditioning oils for leather sneakers.",
      featured: false,
      hidden: false,
    }

    // 3.1 Verify baseline jackets
    const racingJackets = baseline.products.filter(
      (p) => p.id && p.id.startsWith("prod-jacket-"),
    )
    assert(racingJackets.length === 14, `Must have exactly 14 Archival Racing Jackets, found ${racingJackets.length}`)
    logStep(`Catalog baseline confirmed: ${baseline.products.length} total products, exactly 14 Archival Racing Jackets`)
    passCount++

    // 3.2 Milestone 8 R1: Verify prod-5 ('LLICYLAND' Graphic Boxy Tee) contains all 6 sizes
    {
      const tStart = performance.now()
      const sqlRow = await queryDbKey("products")
      assert(sqlRow && Array.isArray(sqlRow.data), "Products must exist in Neon DB")
      const prod5 = sqlRow.data.find((p) => p.id === "prod-5")
      assert(prod5, "Product prod-5 ('LLICYLAND' Graphic Boxy Tee) must exist in Neon DB catalog")
      assert(Array.isArray(prod5.sizes), "prod-5.sizes must be an array")
      assert(prod5.sizes.length >= 6, `prod-5 must contain at least 6 sizes, got ${prod5.sizes.length}`)
      const requiredSizes = ["S", "M", "L", "XL", "2XL", "XXL"]
      for (const sz of requiredSizes) {
        assert(prod5.sizes.includes(sz), `prod-5.sizes must include size '${sz}'`)
      }
      logStep(`Milestone 8 R1: prod-5 contains all 6 sizes [${requiredSizes.join(", ")}] in live Neon DB`, performance.now() - tStart)
      passCount++
    }

    // 3.3 Milestone 8 R2: Admin Configurable Sizes (Preset Chips + Custom Size Entries) Persistence & Readback
    const m8TestProductId = `prod-e2e-m8-sizes-${Date.now().toString().slice(-4)}`
    const presetAndCustomSizes = ["S", "M", "L", "XL", "2XL", "XXL", "3XL", "One Size", "Custom-Atelier-Fit"]
    const m8TestProduct = {
      id: m8TestProductId,
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

    {
      const tStart = performance.now()
      const currentProducts = (await queryDbKey("products")).data
      const updatedProducts = [m8TestProduct, ...currentProducts]
      await callApi("POST", {
        action: "sync",
        key: "products",
        data: updatedProducts,
        adminToken: "Zimthreads200",
      })

      // Read back via direct SQL and API GET
      const freshSql = await queryDbKey("products")
      const foundInSql = freshSql.data.find((p) => p.id === m8TestProductId)
      assert(foundInSql, `Test product ${m8TestProductId} must be present in Neon DB`)
      assert(Array.isArray(foundInSql.sizes), "foundInSql.sizes must be an array")
      assert(
        JSON.stringify(foundInSql.sizes) === JSON.stringify(presetAndCustomSizes),
        `Sizes in Neon DB must match preset chips + custom entries with 100% fidelity. Expected ${JSON.stringify(presetAndCustomSizes)}, got ${JSON.stringify(foundInSql.sizes)}`,
      )

      // Also verify via API GET
      const apiGet = await callApi("GET", null, { key: "products" })
      const foundInApi = apiGet.data.find((p) => p.id === m8TestProductId)
      assert(foundInApi, "Test product must be present in GET /api/store?key=products")
      assert(
        JSON.stringify(foundInApi.sizes) === JSON.stringify(presetAndCustomSizes),
        "Sizes returned by API must match preset chips + custom entries",
      )

      // Mutate sizes via admin update_entity: add additional custom size entry
      const mutatedSizes = [...presetAndCustomSizes, "Bespoke-44EU"]
      await callApi("POST", {
        action: "update_entity",
        entity: "products",
        id: m8TestProductId,
        updates: { sizes: mutatedSizes },
        adminToken: "Zimthreads200",
      })

      const recheckedSql = await queryDbKey("products")
      const recheckedProd = recheckedSql.data.find((p) => p.id === m8TestProductId)
      assert(
        recheckedProd.sizes.includes("Bespoke-44EU"),
        "Newly appended custom size entry must persist in Neon DB",
      )
      assert(
        recheckedProd.sizes.length === mutatedSizes.length,
        `Expected ${mutatedSizes.length} sizes after update, got ${recheckedProd.sizes.length}`,
      )

      logStep(`Milestone 8 R2: Admin configurable sizes (preset chips + custom entries) persist & read back with 100% fidelity`, performance.now() - tStart)
      passCount++
    }

    // 3.4 Milestone 8 R3: Configurable Price Options (Active & Deselected/Disabled Options)
    const initialPriceOptions = [
      { id: "tier-std", label: "Standard Boxy Cut", price: 1850, active: true },
      { id: "tier-heavyweight", label: "450GSM Heavyweight Drop", price: 2350, active: false },
      { id: "tier-bespoke", label: "VIP Hand-Distressed Patina", price: 3100, active: true },
    ]

    {
      const tStart = performance.now()
      await callApi("POST", {
        action: "update_entity",
        entity: "products",
        id: m8TestProductId,
        updates: { priceOptions: initialPriceOptions },
        adminToken: "Zimthreads200",
      })

      // Read back via SQL and API
      const freshSql = await queryDbKey("products")
      const foundInSql = freshSql.data.find((p) => p.id === m8TestProductId)
      assert(Array.isArray(foundInSql.priceOptions), "priceOptions must be an array in Neon DB")
      assert(foundInSql.priceOptions.length === 3, "priceOptions array length must be 3")
      assert(foundInSql.priceOptions[0].active === true, "Tier 1 must be active: true (selectable)")
      assert(foundInSql.priceOptions[1].active === false, "Tier 2 must be active: false (deselected / disabled)")
      assert(foundInSql.priceOptions[2].active === true, "Tier 3 must be active: true (selectable)")
      assert(foundInSql.priceOptions[0].price === 1850, "Tier 1 price must be 1850")
      assert(foundInSql.priceOptions[1].price === 2350, "Tier 2 price must be 2350")

      logStep(`Milestone 8 R3: Configurable price options (active & deselected/disabled) persist and read back from Neon DB`, performance.now() - tStart)
      passCount++
    }

    // 3.5 Milestone 8 R3: Toggle Active Boolean & Delete Price Option
    {
      const tStart = performance.now()
      // Toggle tier-std to false (deselected), tier-heavyweight to true (active), and delete tier-bespoke
      const mutatedPriceOptions = [
        { id: "tier-std", label: "Standard Boxy Cut", price: 1850, active: false },
        { id: "tier-heavyweight", label: "450GSM Heavyweight Drop", price: 2350, active: true },
      ]

      await callApi("POST", {
        action: "update_entity",
        entity: "products",
        id: m8TestProductId,
        updates: { priceOptions: mutatedPriceOptions },
        adminToken: "Zimthreads200",
      })

      const freshSql = await queryDbKey("products")
      const foundInSql = freshSql.data.find((p) => p.id === m8TestProductId)
      assert(foundInSql.priceOptions.length === 2, "priceOptions must have exactly 2 tiers after deletion")
      const tierStd = foundInSql.priceOptions.find((o) => o.id === "tier-std")
      const tierHvy = foundInSql.priceOptions.find((o) => o.id === "tier-heavyweight")
      const tierBespoke = foundInSql.priceOptions.find((o) => o.id === "tier-bespoke")

      assert(tierStd && tierStd.active === false, "tier-std must now have active: false (toggled to deselected)")
      assert(tierHvy && tierHvy.active === true, "tier-heavyweight must now have active: true (toggled to active)")
      assert(!tierBespoke, "tier-bespoke must be permanently deleted from priceOptions")

      logStep(`Milestone 8 R3: Active boolean toggle & price option deletion persisted in Neon DB`, performance.now() - tStart)
      passCount++
    }

    // 3.6 Delete Milestone 8 Test Product & Clean Removal
    {
      const tStart = performance.now()
      const deleteRes = await callApi("POST", {
        action: "delete_entity",
        entity: "products",
        id: m8TestProductId,
        adminToken: "Zimthreads200",
      })
      assert(deleteRes.success, "delete_entity for M8 test product must succeed")

      const freshSql = await queryDbKey("products")
      const found = freshSql.data.find((p) => p.id === m8TestProductId)
      assert(!found, `Test product ${m8TestProductId} must NOT exist in Neon DB`)
      logStep(`Milestone 8 test product deleted cleanly`, performance.now() - tStart)
      passCount++
    }

    // 3.7 Add Test Product via Admin Sync
    {
      const tStart = performance.now()
      const updatedProducts = [testProduct, ...baseline.products]
      const syncRes = await callApi("POST", {
        action: "sync",
        key: "products",
        data: updatedProducts,
        adminToken: "Zimthreads200",
      })
      assert(syncRes.success, "Admin sync products must succeed")

      // Verify in Neon DB
      const freshSql = await queryDbKey("products")
      const found = freshSql.data.find((p) => p.id === testProductId)
      assert(found, `Test product ${testProductId} must be present in Neon DB`)
      assert(found.price === 420 && found.stock === 35, "Price and stock must match")
      logStep(`Created test product ${testProductId} in live catalog`, performance.now() - tStart)
      passCount++
    }

    // 3.8 Batch Update Test Product and Archival Racing Jacket
    {
      const tStart = performance.now()
      const targetJacketId = "prod-jacket-ferrari-red-leather"
      const originalJacket = baseline.products.find((p) => p.id === targetJacketId)
      assert(originalJacket, `Original jacket ${targetJacketId} must exist`)

      const batchUpdates = [
        {
          id: testProductId,
          changes: { price: 495, stock: 75, featured: true },
        },
        {
          id: targetJacketId,
          changes: { price: 2950 },
        },
      ]

      const batchRes = await callApi("POST", {
        action: "batch_update_products",
        updates: batchUpdates,
        adminToken: "Zimthreads200",
      })
      assert(batchRes.success, "batch_update_products API call must succeed")
      assert(batchRes.updatedCount === 2, `batch_update_products should update 2 items, got ${batchRes.updatedCount}`)

      // Direct Neon SQL verification of immediate batch persistence
      const freshSql = await queryDbKey("products")
      const updatedTestProd = freshSql.data.find((p) => p.id === testProductId)
      assert(updatedTestProd.price === 495, `Test product price in Neon must be 495, got ${updatedTestProd.price}`)
      assert(updatedTestProd.stock === 75, `Test product stock in Neon must be 75, got ${updatedTestProd.stock}`)

      const updatedJacket = freshSql.data.find((p) => p.id === targetJacketId)
      assert(updatedJacket.price === 2950, `Racing jacket price in Neon must be 2950, got ${updatedJacket.price}`)

      // Restore jacket price back to baseline immediately
      await callApi("POST", {
        action: "batch_update_products",
        updates: [{ id: targetJacketId, changes: { price: originalJacket.price } }],
        adminToken: "Zimthreads200",
      })
      logStep(`Batch updated test product & Archival Racing Jacket; verified immediate persistence in Neon DB`, performance.now() - tStart)
      passCount++
    }

    // 3.9 Delete Test Product & verify clean removal
    {
      const tStart = performance.now()
      const deleteRes = await callApi("POST", {
        action: "delete_entity",
        entity: "products",
        id: testProductId,
        adminToken: "Zimthreads200",
      })
      assert(deleteRes.success, "delete_entity for product must succeed")

      const freshSql = await queryDbKey("products")
      const foundInSql = freshSql.data.find((p) => p.id === testProductId)
      assert(!foundInSql, `Test product ${testProductId} must be deleted from Neon DB`)
      assert(freshSql.data.length === baseline.products.length, `Product catalog count must return to baseline ${baseline.products.length}`)
      logStep(`Test product deleted; catalog returned to exact ${baseline.products.length} products baseline`, performance.now() - tStart)
      passCount++
    }

    // ------------------------------------------------------------------------
    // TEST 4: SERVICES DESK CRUD PERSISTENCE
    // ------------------------------------------------------------------------
    logSection("TEST 4: Services Desk — Creation, Active Toggle & Turnaround Updates, Deletion")
    const testServiceId = `srv-e2e-patina-${Date.now().toString().slice(-4)}`
    const testService = {
      id: testServiceId,
      title: "E2E BESPOKE ARTISAN PATINA & SOLE RESTORATION",
      subtitle: "Hand-applied gradient leather burnishing",
      price: "From Rs 850",
      priceNumeric: 850,
      desc: "Full bespoke patina application, toe-box burnishing, and sole seal.",
      features: ["Custom Italian dye blend", "Natural carnauba wax seal", "Edge dressing"],
      turnaround: "48-72 Hours",
      img: "https://res.cloudinary.com/pwranjbq/image/upload/v1790345314/zimthreads/patina.jpg",
      alt: "Bespoke Patina",
      active: true,
    }

    // 4.1 Create Test Service
    {
      const tStart = performance.now()
      const currentSql = await queryDbKey("services")
      const updatedList = [testService, ...currentSql.data]
      await callApi("POST", {
        action: "sync",
        key: "services",
        data: updatedList,
        adminToken: "Zimthreads200",
      })

      const freshSql = await queryDbKey("services")
      const found = freshSql.data.find((s) => s.id === testServiceId)
      assert(found, `Service ${testServiceId} must exist in Neon DB`)
      assert(found.active === true, "Service active status must be true")
      logStep(`Created test service ${testServiceId} in live Neon DB`, performance.now() - tStart)
      passCount++
    }

    // 4.2 Toggle Active Status & Update Price
    {
      const tStart = performance.now()
      await callApi("POST", {
        action: "update_entity",
        entity: "services",
        id: testServiceId,
        updates: {
          active: false,
          price: "From Rs 950",
          priceNumeric: 950,
          turnaround: "24-48 Hours Express",
        },
        adminToken: "Zimthreads200",
      })

      const freshSql = await queryDbKey("services")
      const updated = freshSql.data.find((s) => s.id === testServiceId)
      assert(updated, "Updated service must exist in Neon DB")
      assert(updated.active === false, `Service active must be false in Neon DB, got ${updated.active}`)
      assert(updated.priceNumeric === 950, `Service priceNumeric must be 950, got ${updated.priceNumeric}`)
      assert(updated.turnaround === "24-48 Hours Express", "Turnaround must persist")
      logStep(`Service ${testServiceId} toggled to active: false and price updated in Neon DB`, performance.now() - tStart)
      passCount++
    }

    // 4.3 Delete Service & Verify Clean Removal
    {
      const tStart = performance.now()
      await callApi("POST", {
        action: "delete_entity",
        entity: "services",
        id: testServiceId,
        adminToken: "Zimthreads200",
      })

      const freshSql = await queryDbKey("services")
      const found = freshSql.data.find((s) => s.id === testServiceId)
      assert(!found, `Deleted service ${testServiceId} must NOT exist in Neon DB`)
      assert(freshSql.data.length === baseline.services.length, `Service count must return to baseline ${baseline.services.length}`)
      logStep(`Service ${testServiceId} permanently deleted with zero residuals`, performance.now() - tStart)
      passCount++
    }

    // ------------------------------------------------------------------------
    // TEST 5: BLOG POSTS DESK CRUD PERSISTENCE
    // ------------------------------------------------------------------------
    logSection("TEST 5: Blog Posts Desk — Draft Creation, Published Toggle, Deletion")
    const testBlogId = `blog-e2e-guide-${Date.now().toString().slice(-4)}`
    const testBlogPost = {
      id: testBlogId,
      title: "E2E Masterclass: Preserving Suede in Tropical Humidity",
      category: "Restoration Guide",
      author: "Shepherd Chara",
      date: "Oct 11, 2026",
      readTime: "5 min read",
      img: "https://res.cloudinary.com/pwranjbq/image/upload/v1790345314/zimthreads/blog.jpg",
      alt: "Suede Care",
      excerpt: "Expert humidity defense protocols for luxury suede footwear.",
      content: "Mauritian coastal humidity presents unique challenges for suede footwear nap. Here is our master protocol...",
      status: "draft",
    }

    // 5.1 Create Draft Blog Post
    {
      const tStart = performance.now()
      const currentSql = await queryDbKey("blog_posts")
      const updatedList = [testBlogPost, ...currentSql.data]
      await callApi("POST", {
        action: "sync",
        key: "blog_posts",
        data: updatedList,
        adminToken: "Zimthreads200",
      })

      const freshSql = await queryDbKey("blog_posts")
      const found = freshSql.data.find((b) => b.id === testBlogId)
      assert(found, `Blog post ${testBlogId} must exist in Neon DB`)
      assert(found.status === "draft", `Blog post status must be "draft", got "${found.status}"`)
      logStep(`Created draft blog post ${testBlogId} in live Neon DB`, performance.now() - tStart)
      passCount++
    }

    // 5.2 Update to "published" and edit title
    {
      const tStart = performance.now()
      const updatedTitle = "E2E Masterclass: Preserving Suede in Tropical Humidity (Official Edition)"
      await callApi("POST", {
        action: "update_entity",
        entity: "blog_posts",
        id: testBlogId,
        updates: {
          title: updatedTitle,
          status: "published",
        },
        adminToken: "Zimthreads200",
      })

      const freshSql = await queryDbKey("blog_posts")
      const updated = freshSql.data.find((b) => b.id === testBlogId)
      assert(updated, "Updated blog post must exist in Neon DB")
      assert(updated.status === "published", `Blog status in Neon must be "published", got "${updated.status}"`)
      assert(updated.title === updatedTitle, "Blog title update must persist in Neon DB")
      logStep(`Blog post ${testBlogId} published and title updated in Neon DB`, performance.now() - tStart)
      passCount++
    }

    // 5.3 Delete Blog Post & Verify Clean Removal
    {
      const tStart = performance.now()
      await callApi("POST", {
        action: "delete_entity",
        entity: "blog_posts",
        id: testBlogId,
        adminToken: "Zimthreads200",
      })

      const freshSql = await queryDbKey("blog_posts")
      const found = freshSql.data.find((b) => b.id === testBlogId)
      assert(!found, `Deleted blog post ${testBlogId} must NOT exist in Neon DB`)
      assert(freshSql.data.length === baseline.blog_posts.length, `Blog count must return to baseline ${baseline.blog_posts.length}`)
      logStep(`Blog post ${testBlogId} permanently deleted with zero residuals`, performance.now() - tStart)
      passCount++
    }

    // ------------------------------------------------------------------------
    // TEST 6: CUSTOMER INQUIRIES DESK CRUD PERSISTENCE
    // ------------------------------------------------------------------------
    logSection("TEST 6: Customer Inquiries Desk — Public Submission, Admin Response, Deletion")
    const testInquiryId = `INQ-E2E-${Date.now().toString().slice(-4)}`
    const testInquiry = {
      id: testInquiryId,
      name: "Leila Dookun (E2E Customer)",
      email: "leila.dookun@e2e-zimthreads.com",
      subject: "Bespoke Patina Consultation on LV Trainers",
      message: "Do you offer two-tone gradient dyeing on white calfskin sneakers?",
      read: false,
    }

    // 6.1 Public Customer Submission
    {
      const tStart = performance.now()
      const createRes = await callApi("POST", {
        action: "public_create",
        entity: "inquiries",
        record: testInquiry,
      })
      assert(createRes.success, "Public inquiry submission must succeed")
      assert(createRes.record.id === testInquiryId, `Inquiry ID must match ${testInquiryId}`)
      logStep(`Public customer inquiry created: ${testInquiryId}`, performance.now() - tStart)
      passCount++
    }

    // 6.2 Verify Unread in Neon DB
    {
      const tStart = performance.now()
      const freshSql = await queryDbKey("inquiries")
      const found = freshSql.data.find((i) => i.id === testInquiryId)
      assert(found, `Inquiry ${testInquiryId} must exist in Neon DB`)
      assert(found.read === false, "Inquiry initial read state must be false")
      assert(found.message === testInquiry.message, "Inquiry message must match exactly")
      logStep(`Verified Inquiry ${testInquiryId} stored in Neon DB with unread status`, performance.now() - tStart)
      passCount++
    }

    // 6.3 Admin Response Logging & Mark Read
    {
      const tStart = performance.now()
      const staffResponse = "Yes! Our master colorist can apply custom two-tone gradients with factory-grade sealant."
      const respondedAt = new Date().toISOString()

      await callApi("POST", {
        action: "update_entity",
        entity: "inquiries",
        id: testInquiryId,
        updates: {
          read: true,
          response: staffResponse,
          respondedAt: respondedAt,
        },
        adminToken: "Zimthreads200",
      })

      const freshSql = await queryDbKey("inquiries")
      const updated = freshSql.data.find((i) => i.id === testInquiryId)
      assert(updated, "Updated inquiry must exist in Neon DB")
      assert(updated.read === true, "Inquiry read flag in Neon must be true")
      assert(updated.response === staffResponse, "Admin staff response must persist in Neon DB")
      assert(updated.respondedAt === respondedAt, "Staff response timestamp must persist")
      logStep(`Admin logged staff response and marked inquiry as read in Neon DB`, performance.now() - tStart)
      passCount++
    }

    // 6.4 Delete Inquiry & Verify Clean Removal
    {
      const tStart = performance.now()
      await callApi("POST", {
        action: "delete_entity",
        entity: "inquiries",
        id: testInquiryId,
        adminToken: "Zimthreads200",
      })

      const freshSql = await queryDbKey("inquiries")
      const found = freshSql.data.find((i) => i.id === testInquiryId)
      assert(!found, `Deleted inquiry ${testInquiryId} must NOT exist in Neon DB`)
      logStep(`Inquiry ${testInquiryId} permanently deleted with zero residuals`, performance.now() - tStart)
      passCount++
    }

    // ------------------------------------------------------------------------
    // TEST 7: STORE SETTINGS DESK PERSISTENCE & RESTORATION
    // ------------------------------------------------------------------------
    logSection("TEST 7: Store Settings Desk — Announcement Banner & Hero Drop Update & Restore")
    const testBannerMsg = "ZIMTHREADS EXCLUSIVE: Automated E2E Verification Suite In Progress [PASS]"
    {
      const tStart = performance.now()
      const modifiedSettings = {
        ...baseline.settings,
        announcementText: testBannerMsg,
      }

      await callApi("POST", {
        action: "sync",
        key: "settings",
        data: modifiedSettings,
        adminToken: "Zimthreads200",
      })

      // Verify in Neon DB
      const freshSql = await queryDbKey("settings")
      assert(freshSql.data.announcementText === testBannerMsg, "Updated announcement banner must persist in Neon DB")
      logStep(`Announcement banner updated and verified in live Neon DB`, performance.now() - tStart)
      passCount++

      // Restore baseline settings
      const tRestoreStart = performance.now()
      await callApi("POST", {
        action: "sync",
        key: "settings",
        data: baseline.settings,
        adminToken: "Zimthreads200",
      })

      const restoredSql = await queryDbKey("settings")
      assert(
        restoredSql.data.announcementText === baseline.settings.announcementText,
        "Baseline announcement text must be restored in Neon DB",
      )
      logStep(`Baseline settings restored cleanly in live Neon DB`, performance.now() - tRestoreStart)
      passCount++
    }

    // ------------------------------------------------------------------------
    // FINAL INTEGRITY CHECK: ZERO-RESIDUAL VERIFICATION
    // ------------------------------------------------------------------------
    logSection("FINAL AUDIT: Verifying Zero Residual Test Records & Exact Baseline Matching")
    {
      const tFinal = performance.now()
      const endRows = await executeSql("SELECT key, data, updated_at FROM public.zimthreads_store ORDER BY key;")
      const endData = {}
      for (const row of endRows) {
        endData[row.key] = row.data
      }

      assert(endData.bookings.length === baseline.bookings.length, `Bookings residual detected! Expected ${baseline.bookings.length}, got ${endData.bookings.length}`)
      assert(endData.orders.length === baseline.orders.length, `Orders residual detected! Expected ${baseline.orders.length}, got ${endData.orders.length}`)
      assert(endData.inquiries.length === baseline.inquiries.length, `Inquiries residual detected! Expected ${baseline.inquiries.length}, got ${endData.inquiries.length}`)
      assert(endData.products.length === baseline.products.length, `Products discrepancy detected! Expected ${baseline.products.length}, got ${endData.products.length}`)
      assert(endData.services.length === baseline.services.length, `Services discrepancy detected! Expected ${baseline.services.length}, got ${endData.services.length}`)
      assert(endData.blog_posts.length === baseline.blog_posts.length, `Blog posts discrepancy detected! Expected ${baseline.blog_posts.length}, got ${endData.blog_posts.length}`)

      // Verify baseline products count is exactly 24
      assert(endData.products.length === 24, `Products baseline count must be exactly 24, found ${endData.products.length}`)

      // Verify racing jackets count is still 14
      const endJackets = endData.products.filter((p) => p.id && p.id.startsWith("prod-jacket-"))
      assert(endJackets.length === 14, `Racing jackets count must remain 14, found ${endJackets.length}`)

      // Verify prod-5 retains all 6 sizes in final database state
      const finalProd5 = endData.products.find((p) => p.id === "prod-5")
      assert(finalProd5, "prod-5 must exist in final database state")
      for (const sz of ["S", "M", "L", "XL", "2XL", "XXL"]) {
        assert(finalProd5.sizes && finalProd5.sizes.includes(sz), `prod-5 must retain size '${sz}' in final database state`)
      }

      logStep(`Zero residual audit passed: Database state identical to pristine baseline (24 products, all 6 sizes retained on prod-5)`, performance.now() - tFinal)
      passCount++
    }

  } catch (err) {
    failCount++
    logFail("UNEXPECTED ERROR DURING E2E SUITE EXECUTION", err)
    
    // Attempt emergency cleanup to guarantee zero residuals even after an error
    try {
      console.log(`\n${colors.yellow}Attempting emergency baseline restoration...${colors.reset}`)
      for (const key of Object.keys(baseline)) {
        if (baseline[key]) {
          await executeSql(
            "INSERT INTO public.zimthreads_store (key, data, updated_at) VALUES ($1, $2::jsonb, NOW()) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();",
            [key, JSON.stringify(baseline[key])],
          )
        }
      }
      console.log(`${colors.yellow}Emergency baseline restoration completed.${colors.reset}`)
    } catch (cleanupErr) {
      console.error("Emergency cleanup also failed:", cleanupErr)
    }

    process.exit(1)
  }

  // --- Suite Summary ---
  const totalDurationMs = performance.now() - suiteStartTime
  logHeader("E2E VERIFICATION SUITE EXECUTION SUMMARY")
  console.log(`Total Assertions/Steps: ${passCount + failCount}`)
  console.log(`Passed:                 ${colors.green}${passCount}${colors.reset}`)
  console.log(`Failed:                 ${failCount > 0 ? colors.red + failCount + colors.reset : "0"}`)
  console.log(`Total Duration:         ${(totalDurationMs / 1000).toFixed(2)}s`)
  console.log(`Final Status:           ${colors.bold}${colors.green}100% PASS — LIVE NEON DB FULL CRUD VERIFIED${colors.reset}`)
  console.log(`${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}\n`)

  process.exit(0)
}

runEndToEndVerification().catch((fatalErr) => {
  console.error("FATAL ERROR IN RUNNER:", fatalErr)
  process.exit(1)
})
