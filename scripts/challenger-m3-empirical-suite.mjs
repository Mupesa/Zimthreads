import handler from "../api/store.ts"

function mockRes() {
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

async function apiCall(method, url, body = null, query = null) {
  const req = {
    method,
    url,
    query: query || {},
    body: body || {},
  }
  if (query && !url.includes("?")) {
    const qStr = new URLSearchParams(query).toString()
    if (qStr) req.url += "?" + qStr
  }
  const res = mockRes()
  await handler(req, res)
  return res
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const TEST_RESULTS = {
  batchJacketPricing: { passed: false, details: [] },
  stateHydration: { passed: false, details: [] },
  deletionPermanence: { passed: false, details: [] },
  concurrency: { passed: false, details: [] },
}

async function runChallengerSuite() {
  console.log("==================================================================")
  console.log("  CHALLENGER 2: EMPIRICAL STRESS TEST & CONCURRENCY SUITE")
  console.log("  Live Neon PostgreSQL: rapid-hill-42448439 (Zimthreads Collective)")
  console.log("==================================================================\n")

  // --- SECTION 0: PRE-FLIGHT SNAPSHOT ---
  console.log(">>> [Pre-Flight] Capturing live database state from Neon DB...")
  const preRes = await apiCall("GET", "/api/store?key=all", null, { key: "all" })
  if (preRes.statusCode !== 200 || !preRes.data?.success) {
    throw new Error(`Pre-flight fetch failed: ${JSON.stringify(preRes.data)}`)
  }
  const snapshot = preRes.data.data
  console.log("Pre-flight snapshot:")
  console.log(`  - Products: ${snapshot.products?.length || 0}`)
  console.log(`  - Services: ${snapshot.services?.length || 0}`)
  console.log(`  - Blog Posts: ${snapshot.blog_posts?.length || 0}`)
  console.log(`  - Bookings: ${snapshot.bookings?.length || 0}`)
  console.log(`  - Orders: ${snapshot.orders?.length || 0}`)
  console.log(`  - Inquiries: ${snapshot.inquiries?.length || 0}`)
  console.log(`  - Settings: ${JSON.stringify(snapshot.settings || {})}`)

  const initialProductsSnapshot = JSON.parse(JSON.stringify(snapshot.products || []))
  const initialBookingsSnapshot = JSON.parse(JSON.stringify(snapshot.bookings || []))
  const initialServicesSnapshot = JSON.parse(JSON.stringify(snapshot.services || []))
  const initialInquiriesSnapshot = JSON.parse(JSON.stringify(snapshot.inquiries || []))

  // =========================================================================
  // OBJECTIVE 1: BATCH JACKET PRICING UPDATE & IMMEDIATE CATALOG REFLECTION
  // =========================================================================
  console.log("\n==================================================================")
  console.log(">>> [CHALLENGE 1] BATCH JACKET PRICING UPDATES & IMMEDIATE REFLECTION")
  console.log("==================================================================")

  try {
    const jackets = initialProductsSnapshot.filter(
      (p) => p.collectionId === "racing-jackets" || p.id.startsWith("prod-jacket-"),
    )
    console.log(`Found ${jackets.length} racing jackets in current catalog`)
    if (jackets.length < 14) {
      console.warn(`Warning: Expected 14 racing jackets, found ${jackets.length}`)
    }

    // Pick 3 jackets for batch price & stock edits
    const targetJackets = jackets.slice(0, 3)
    console.log("Target jackets for batch price modification:")
    targetJackets.forEach((j) => {
      console.log(`  - ${j.id} (${j.name}): Rs ${j.price}, Stock: ${j.stock}`)
    })

    const priceDeltas = [
      { id: targetJackets[0].id, newPrice: targetJackets[0].price + 450, newStock: targetJackets[0].stock + 5 },
      { id: targetJackets[1].id, newPrice: targetJackets[1].price + 300, newStock: targetJackets[1].stock + 10 },
      { id: targetJackets[2].id, newPrice: targetJackets[2].price + 250, newStock: targetJackets[2].stock + 2 },
    ]

    // Simulate Admin Batch Save as executed by Dashboard.tsx handleSaveAllBatch -> updateProductsBatch
    const updatedCatalog = initialProductsSnapshot.map((p) => {
      const match = priceDeltas.find((d) => d.id === p.id)
      if (match) {
        return { ...p, price: match.newPrice, stock: match.newStock }
      }
      return p
    })

    console.log("\nSending batch pricing update via action: 'sync'...")
    const syncRes = await apiCall("POST", "/api/store", {
      action: "sync",
      key: "products",
      data: updatedCatalog,
      adminToken: "Zimthreads200",
    })

    if (syncRes.statusCode !== 200 || !syncRes.data?.success) {
      throw new Error(`Batch update failed: ${JSON.stringify(syncRes.data)}`)
    }
    console.log("✓ Admin sync response HTTP 200 success")

    // Immediately fetch /api/store?key=products (public GET used by /shop & /collection/racing-jackets)
    console.log("\nQuerying public GET /api/store?key=products...")
    const getRes = await apiCall("GET", "/api/store?key=products", null, { key: "products" })
    if (getRes.statusCode !== 200 || !getRes.data?.success) {
      throw new Error(`Failed to GET /api/store?key=products: ${JSON.stringify(getRes.data)}`)
    }

    const fetchedProducts = getRes.data.data
    console.log(`Received ${fetchedProducts.length} products from /api/store?key=products`)

    // Verify all 3 jackets reflect the exact new prices and stock
    for (const delta of priceDeltas) {
      const item = fetchedProducts.find((p) => p.id === delta.id)
      if (!item) {
        throw new Error(`Jacket ${delta.id} not found in fetched products!`)
      }
      if (item.price !== delta.newPrice || item.stock !== delta.newStock) {
        throw new Error(
          `Jacket ${delta.id} mismatch! Expected price: Rs ${delta.newPrice}, stock: ${delta.newStock}. Got price: Rs ${item.price}, stock: ${item.stock}`,
        )
      }
      console.log(
        `✓ Jacket ${delta.id}: price Rs ${item.price} (was ${targetJackets.find((j) => j.id === delta.id).price}), stock ${item.stock} verified immediately in /api/store?key=products`,
      )
    }

    // Verify other products were not corrupted
    const otherProduct = fetchedProducts.find((p) => !priceDeltas.some((d) => d.id === p.id))
    const originalOther = initialProductsSnapshot.find((p) => p.id === otherProduct.id)
    if (otherProduct.price !== originalOther.price || otherProduct.stock !== originalOther.stock) {
      throw new Error(`Regression: Non-targeted product ${otherProduct.id} was mutated!`)
    }
    console.log(`✓ Non-targeted product ${otherProduct.id} remained completely intact`)

    // Revert prices back to initial
    console.log("\nReverting jacket prices back to baseline...")
    await apiCall("POST", "/api/store", {
      action: "sync",
      key: "products",
      data: initialProductsSnapshot,
      adminToken: "Zimthreads200",
    })

    // Verify revert
    const revertCheck = await apiCall("GET", "/api/store?key=products", null, { key: "products" })
    const revertedItem = revertCheck.data.data.find((p) => p.id === priceDeltas[0].id)
    if (revertedItem.price !== targetJackets[0].price) {
      throw new Error(`Revert verification failed for ${priceDeltas[0].id}`)
    }
    console.log(`✓ Baseline prices successfully restored in Neon DB`)

    TEST_RESULTS.batchJacketPricing.passed = true
    TEST_RESULTS.batchJacketPricing.details.push("Batch pricing update immediately reflected in /api/store?key=products")
  } catch (err) {
    TEST_RESULTS.batchJacketPricing.passed = false
    TEST_RESULTS.batchJacketPricing.details.push(err.message)
    console.error("FAIL in Batch Jacket Pricing Test:", err)
  }

  // =========================================================================
  // OBJECTIVE 2: DELETION PERMANENCE & ANTI-RESURRECTION (HARD REFRESH SIMULATION)
  // =========================================================================
  console.log("\n==================================================================")
  console.log(">>> [CHALLENGE 2] DELETION PERMANENCE & REFRESH HYDRATION TEST")
  console.log("==================================================================")

  try {
    // 2A: Booking Deletion Permanence
    console.log("\n--- Sub-test 2A: Booking Deletion Permanence ---")
    const delBookingId = `BK-DEL-${Date.now().toString().slice(-4)}`
    const newBooking = {
      id: delBookingId,
      customer: "Ephemeral Test Customer",
      email: "ephemeral@example.com",
      phone: "+230 5000 0001",
      serviceId: "clean",
      serviceName: "STANDARD SNEAKER CLEAN",
      price: "Rs 300",
      priceNumeric: 300,
      date: "2026-10-12",
      time: "11:00",
      status: "Pending",
      createdAt: new Date().toISOString(),
    }

    // Customer public create
    const createBRes = await apiCall("POST", "/api/store", {
      action: "public_create",
      entity: "bookings",
      record: newBooking,
    })
    if (createBRes.statusCode !== 200 || !createBRes.data?.success) {
      throw new Error(`Failed to create booking: ${JSON.stringify(createBRes.data)}`)
    }
    console.log(`✓ Created test booking ${delBookingId} via public_create`)

    // Verify booking is present in Neon DB
    let curBRes = await apiCall("GET", "/api/store?key=bookings", null, { key: "bookings" })
    let bList = curBRes.data.data
    if (!bList.some((b) => b.id === delBookingId)) {
      throw new Error(`Booking ${delBookingId} not found in Neon DB after creation!`)
    }
    console.log(`✓ Confirmed ${delBookingId} exists in Neon DB`)

    // Admin Deletion
    const filteredB = bList.filter((b) => b.id !== delBookingId)
    const delBSync = await apiCall("POST", "/api/store", {
      action: "sync",
      key: "bookings",
      data: filteredB,
      adminToken: "Zimthreads200",
    })
    if (delBSync.statusCode !== 200) {
      throw new Error(`Admin sync delete failed: ${JSON.stringify(delBSync.data)}`)
    }
    console.log(`✓ Admin deleted booking ${delBookingId} from Neon DB`)

    // Hard page refresh simulation:
    // Client starts with local state (which has deleted the item), fetches from Neon
    const refreshBRes = await apiCall("GET", "/api/store?key=bookings", null, { key: "bookings" })
    const refreshedBList = refreshBRes.data.data
    if (refreshedBList.some((b) => b.id === delBookingId)) {
      throw new Error(`ZOMBIE RESURRECTION: Booking ${delBookingId} reappeared after hard refresh!`)
    }
    console.log(`✓ Verified booking ${delBookingId} remains deleted on hard reload`)

    // 2B: Product Deletion Permanence
    console.log("\n--- Sub-test 2B: Product Deletion Permanence ---")
    const delProdId = `prod-del-${Date.now().toString().slice(-4)}`
    const newProd = {
      id: delProdId,
      name: "Temporary Test Cleanser",
      category: "Cleaning",
      price: 299,
      stock: 10,
      img: "https://example.com/clean.jpg",
      alt: "Temporary Cleanser",
      description: "Ephemeral product to test deletion permanence",
      featured: false,
    }

    const curPRes = await apiCall("GET", "/api/store?key=products", null, { key: "products" })
    const currentProducts = curPRes.data.data
    const productsWithNew = [newProd, ...currentProducts]

    await apiCall("POST", "/api/store", {
      action: "sync",
      key: "products",
      data: productsWithNew,
      adminToken: "Zimthreads200",
    })
    console.log(`✓ Created test product ${delProdId} in Neon DB`)

    // Now delete it
    const productsAfterDelete = productsWithNew.filter((p) => p.id !== delProdId)
    await apiCall("POST", "/api/store", {
      action: "sync",
      key: "products",
      data: productsAfterDelete,
      adminToken: "Zimthreads200",
    })
    console.log(`✓ Admin deleted product ${delProdId}`)

    // Hard refresh simulation
    const refreshPRes = await apiCall("GET", "/api/store?key=products", null, { key: "products" })
    if (refreshPRes.data.data.some((p) => p.id === delProdId)) {
      throw new Error(`ZOMBIE RESURRECTION: Product ${delProdId} reappeared after refresh!`)
    }
    console.log(`✓ Product ${delProdId} remained permanently deleted`)

    // 2C: Service Deletion Permanence
    console.log("\n--- Sub-test 2C: Service Deletion Permanence ---")
    const delSrvId = `srv-del-${Date.now().toString().slice(-4)}`
    const newSrv = {
      id: delSrvId,
      title: "EPHEMERAL DELETION SERVICE",
      subtitle: "Test service",
      price: "Rs 550",
      priceNumeric: 550,
      desc: "Will be deleted immediately",
      features: ["Test feature"],
      turnaround: "24 Hours",
      img: "https://example.com/srv.jpg",
      alt: "Test",
      active: true,
    }

    const curSRes = await apiCall("GET", "/api/store?key=services", null, { key: "services" })
    const sWithNew = [newSrv, ...curSRes.data.data]
    await apiCall("POST", "/api/store", {
      action: "sync",
      key: "services",
      data: sWithNew,
      adminToken: "Zimthreads200",
    })
    console.log(`✓ Created test service ${delSrvId}`)

    const sAfterDel = sWithNew.filter((s) => s.id !== delSrvId)
    await apiCall("POST", "/api/store", {
      action: "sync",
      key: "services",
      data: sAfterDel,
      adminToken: "Zimthreads200",
    })
    console.log(`✓ Deleted test service ${delSrvId}`)

    const refreshSRes = await apiCall("GET", "/api/store?key=services", null, { key: "services" })
    if (refreshSRes.data.data.some((s) => s.id === delSrvId)) {
      throw new Error(`ZOMBIE RESURRECTION: Service ${delSrvId} reappeared after refresh!`)
    }
    console.log(`✓ Service ${delSrvId} remained permanently deleted`)

    // 2D: Inquiry Deletion Permanence
    console.log("\n--- Sub-test 2D: Inquiry Deletion Permanence ---")
    const delInqId = `INQ-DEL-${Date.now().toString().slice(-4)}`
    const newInq = {
      id: delInqId,
      name: "Ephemeral Inquirer",
      email: "del_inq@example.com",
      subject: "Test Delete Inquiry",
      message: "Testing inquiry deletion permanence",
      read: false,
      date: "Oct 11, 2026",
    }

    await apiCall("POST", "/api/store", {
      action: "public_create",
      entity: "inquiries",
      record: newInq,
    })
    console.log(`✓ Created test inquiry ${delInqId}`)

    const curIRes = await apiCall("GET", "/api/store?key=inquiries", null, { key: "inquiries" })
    const iAfterDel = curIRes.data.data.filter((i) => i.id !== delInqId)
    await apiCall("POST", "/api/store", {
      action: "sync",
      key: "inquiries",
      data: iAfterDel,
      adminToken: "Zimthreads200",
    })
    console.log(`✓ Deleted test inquiry ${delInqId}`)

    const refreshIRes = await apiCall("GET", "/api/store?key=inquiries", null, { key: "inquiries" })
    if (refreshIRes.data.data.some((i) => i.id === delInqId)) {
      throw new Error(`ZOMBIE RESURRECTION: Inquiry ${delInqId} reappeared after refresh!`)
    }
    console.log(`✓ Inquiry ${delInqId} remained permanently deleted`)

    TEST_RESULTS.deletionPermanence.passed = true
    TEST_RESULTS.deletionPermanence.details.push(
      "All entity deletions (Bookings, Products, Services, Inquiries) verified permanent across re-hydration",
    )
  } catch (err) {
    TEST_RESULTS.deletionPermanence.passed = false
    TEST_RESULTS.deletionPermanence.details.push(err.message)
    console.error("FAIL in Deletion Permanence Test:", err)
  }

  // =========================================================================
  // OBJECTIVE 3: STATE HYDRATION ON REFRESH & CONSISTENCY
  // =========================================================================
  console.log("\n==================================================================")
  console.log(">>> [CHALLENGE 3] STATE HYDRATION ON REFRESH & CONSISTENCY")
  console.log("==================================================================")

  try {
    // Test that GET /api/store?key=all returns all 7 entities in proper format
    const fullRes = await apiCall("GET", "/api/store?key=all", null, { key: "all" })
    if (fullRes.statusCode !== 200 || !fullRes.data?.success) {
      throw new Error(`Full hydration failed: ${JSON.stringify(fullRes.data)}`)
    }
    const hydrated = fullRes.data.data

    const requiredKeys = ["products", "services", "blog_posts", "settings", "bookings", "orders", "inquiries"]
    for (const key of requiredKeys) {
      if (hydrated[key] === undefined) {
        throw new Error(`Hydration failed: missing entity key '${key}' in storeData`)
      }
      if (key !== "settings" && !Array.isArray(hydrated[key])) {
        throw new Error(`Hydration entity '${key}' is not an array!`)
      }
    }
    console.log("✓ Full 7-entity hydration structure strictly validated")

    // Verify Settings hydration
    if (typeof hydrated.settings !== "object" || hydrated.settings === null) {
      throw new Error("Settings entity is not a valid object")
    }
    console.log(`✓ Settings hydrated: announcementText = "${hydrated.settings.announcementText || '(none)'}"`)

    // Verify Individual Key Queries vs Bulk All Query Consistency
    console.log("Testing individual key query consistency...")
    for (const key of ["products", "services", "bookings"]) {
      const singleRes = await apiCall("GET", `/api/store?key=${key}`, null, { key })
      if (singleRes.statusCode !== 200) {
        throw new Error(`Single query for ${key} failed`)
      }
      if (singleRes.data.data.length !== hydrated[key].length) {
        throw new Error(
          `Inconsistency between GET ?key=${key} (${singleRes.data.data.length}) and GET ?key=all (${hydrated[key].length})`,
        )
      }
      console.log(`✓ Consistent record counts for ${key}: ${singleRes.data.data.length}`)
    }

    TEST_RESULTS.stateHydration.passed = true
    TEST_RESULTS.stateHydration.details.push("Full 7-entity hydration and individual key consistency verified")
  } catch (err) {
    TEST_RESULTS.stateHydration.passed = false
    TEST_RESULTS.stateHydration.details.push(err.message)
    console.error("FAIL in State Hydration Test:", err)
  }

  // =========================================================================
  // OBJECTIVE 4: CONCURRENCY & RACE CONDITION STRESS HARNESS
  // =========================================================================
  console.log("\n==================================================================")
  console.log(">>> [CHALLENGE 4] CONCURRENCY & RACE CONDITION STRESS HARNESS")
  console.log("==================================================================")

  try {
    // 4A: 5 Simultaneous Public Submissions at the exact same millisecond
    console.log("\n--- Sub-test 4A: 5 Concurrent Public Submissions ---")
    const concurrentBookings = Array.from({ length: 5 }, (_, i) => ({
      id: `BK-RACE-${i + 1}-${Date.now().toString().slice(-4)}`,
      customer: `Concurrent User ${i + 1}`,
      email: `user${i + 1}@concurrent.test`,
      phone: `+230 5000 000${i + 1}`,
      serviceId: "clean",
      serviceName: "STANDARD SNEAKER CLEAN",
      price: "Rs 300",
      priceNumeric: 300,
      date: "2026-10-15",
      time: `1${i}:00`,
      status: "Pending",
      createdAt: new Date().toISOString(),
    }))

    console.log("Firing 5 simultaneous public_create requests in parallel via Promise.all...")
    const startMs = Date.now()
    const responses = await Promise.all(
      concurrentBookings.map((b) =>
        apiCall("POST", "/api/store", {
          action: "public_create",
          entity: "bookings",
          record: b,
        }),
      ),
    )
    const elapsedMs = Date.now() - startMs
    console.log(`All 5 concurrent requests returned in ${elapsedMs}ms`)

    // Check all response statuses
    responses.forEach((res, idx) => {
      if (res.statusCode !== 200 || !res.data?.success) {
        throw new Error(`Request ${idx + 1} failed: ${JSON.stringify(res.data)}`)
      }
    })
    console.log("✓ All 5 requests returned HTTP 200 success")

    // Verify how many arrived in Neon DB
    console.log("Inspecting Neon DB array state...")
    const postRaceRes = await apiCall("GET", "/api/store?key=bookings", null, { key: "bookings" })
    const postRaceBookings = postRaceRes.data.data
    const foundCount = concurrentBookings.filter((cb) =>
      postRaceBookings.some((b) => b.id === cb.id),
    ).length

    console.log(`Found ${foundCount} of 5 concurrent bookings in Neon DB`)
    if (foundCount !== 5) {
      console.warn(
        `[CONCURRENCY FINDING] Race condition detected: Only ${foundCount} of 5 concurrent submissions persisted! Lost: ${5 - foundCount}`,
      )
      TEST_RESULTS.concurrency.details.push(
        `Concurrent public submissions race condition: ${foundCount}/5 persisted (${5 - foundCount} lost due to concurrent array prepends)`,
      )
    } else {
      console.log("✓ All 5 concurrent bookings successfully persisted without data loss!")
      TEST_RESULTS.concurrency.details.push("All 5 concurrent submissions persisted without conflict")
    }

    // 4B: Public Submission vs Admin Mutation Interleaving
    console.log("\n--- Sub-test 4B: Public Submission vs Admin Sync Race Condition ---")
    const raceBookingId = `BK-INTERLEAVE-${Date.now().toString().slice(-4)}`
    const raceBooking = {
      id: raceBookingId,
      customer: "Interleaved Customer",
      email: "interleaved@test.com",
      phone: "+230 5111 2222",
      serviceId: "restore",
      serviceName: "FULL RESTORATION",
      price: "Rs 600",
      priceNumeric: 600,
      date: "2026-10-18",
      time: "15:00",
      status: "Pending",
      createdAt: new Date().toISOString(),
    }

    // Capture current bookings before admin sync
    const preInterleaveRes = await apiCall("GET", "/api/store?key=bookings", null, { key: "bookings" })
    const staleAdminBookings = preInterleaveRes.data.data

    // Simulate: Customer submits NEW booking
    console.log("Step 1: Customer submits new booking via public_create...")
    await apiCall("POST", "/api/store", {
      action: "public_create",
      entity: "bookings",
      record: raceBooking,
    })

    // Simultaneously/immediately after, Admin performs a sync with their stale snapshot (which doesn't have raceBooking)
    console.log("Step 2: Admin triggers sync with stale snapshot (simulating admin modifying a different booking)...")
    // Suppose admin modified the first booking's status in their stale snapshot
    const modifiedStale = staleAdminBookings.map((b, idx) =>
      idx === 0 ? { ...b, notes: "Admin note added" } : b,
    )
    await apiCall("POST", "/api/store", {
      action: "sync",
      key: "bookings",
      data: modifiedStale,
      adminToken: "Zimthreads200",
    })

    // Check if customer's raceBooking survived the admin's full sync
    const checkSurvived = await apiCall("GET", "/api/store?key=bookings", null, { key: "bookings" })
    const survived = checkSurvived.data.data.some((b) => b.id === raceBookingId)
    if (!survived) {
      console.warn(
        `[CRITICAL CONCURRENCY ARCHITECTURE FINDING] Full-array sync overwrote customer booking ${raceBookingId}!`,
      )
      TEST_RESULTS.concurrency.details.push(
        `Full array sync vulnerability: Admin sync replaces entire JSONB array, dropping any customer bookings submitted between admin hydration and admin sync.`,
      )
    } else {
      console.log(`✓ Customer booking ${raceBookingId} survived!`)
    }

    // Cleanup all test bookings
    console.log("\nCleaning up concurrency test records...")
    const cleanRes = await apiCall("GET", "/api/store?key=bookings", null, { key: "bookings" })
    const cleanList = cleanRes.data.data.filter(
      (b) => !b.id.startsWith("BK-RACE-") && !b.id.startsWith("BK-INTERLEAVE-") && !b.id.startsWith("BK-DEL-"),
    )
    await apiCall("POST", "/api/store", {
      action: "sync",
      key: "bookings",
      data: cleanList,
      adminToken: "Zimthreads200",
    })
    console.log("✓ Test records cleaned up cleanly")

    TEST_RESULTS.concurrency.passed = foundCount === 5
  } catch (err) {
    TEST_RESULTS.concurrency.passed = false
    TEST_RESULTS.concurrency.details.push(err.message)
    console.error("FAIL in Concurrency Test:", err)
  }

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  console.log("\n==================================================================")
  console.log("                    CHALLENGER 2 TEST SUMMARY")
  console.log("==================================================================")
  console.log(`1. Batch Jacket Pricing:  ${TEST_RESULTS.batchJacketPricing.passed ? "PASSED [OK]" : "FAILED [X]"}`)
  TEST_RESULTS.batchJacketPricing.details.forEach((d) => console.log(`   - ${d}`))

  console.log(`2. Deletion Permanence:   ${TEST_RESULTS.deletionPermanence.passed ? "PASSED [OK]" : "FAILED [X]"}`)
  TEST_RESULTS.deletionPermanence.details.forEach((d) => console.log(`   - ${d}`))

  console.log(`3. State Hydration:       ${TEST_RESULTS.stateHydration.passed ? "PASSED [OK]" : "FAILED [X]"}`)
  TEST_RESULTS.stateHydration.details.forEach((d) => console.log(`   - ${d}`))

  console.log(`4. Concurrency:           ${TEST_RESULTS.concurrency.passed ? "PASSED [OK]" : "ATTENTION [!] / PARTIAL"}`)
  TEST_RESULTS.concurrency.details.forEach((d) => console.log(`   - ${d}`))
  console.log("==================================================================\n")

  return TEST_RESULTS
}

runChallengerSuite()
  .then((res) => {
    console.log("Challenger suite finished execution successfully.")
  })
  .catch((err) => {
    console.error("Fatal suite crash:", err)
    process.exit(1)
  })
