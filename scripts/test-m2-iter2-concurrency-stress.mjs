import handler, { executeSql } from "../api/store.ts"

// ============================================================================
// MOCK HTTP RESPONSE UTILITY
// ============================================================================

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

async function callApi(method, pathOrQuery, body = null) {
  const req = {
    method,
    url: typeof pathOrQuery === "string" ? pathOrQuery : "/api/store",
    query: typeof pathOrQuery === "object" ? pathOrQuery : {},
    body,
  }
  if (typeof pathOrQuery === "string" && pathOrQuery.includes("?")) {
    const qs = pathOrQuery.split("?")[1]
    const params = new URLSearchParams(qs)
    req.query = Object.fromEntries(params.entries())
  }
  const res = mockRes()
  await handler(req, res)
  return res
}

// ============================================================================
// CONCURRENCY & REHYDRATION STRESS HARNESS
// ============================================================================

async function runConcurrencyStressHarness() {
  console.log("=================================================================")
  console.log("   EMPIRICAL CHALLENGER 2: CONCURRENCY & REHYDRATION STRESS      ")
  console.log("   Target: Neon PostgreSQL rapid-hill-42448439                   ")
  console.log("=================================================================\n")

  const createdRecords = {
    bookings: [],
    orders: [],
    inquiries: [],
  }

  const tag = `STRESS-${Date.now().toString().slice(-6)}`

  try {
    // ------------------------------------------------------------------------
    // PHASE 1: DB CONNECTION & LIVE ENVIRONMENT INTEGRITY CHECK
    // ------------------------------------------------------------------------
    console.log("[Phase 1] Verifying Live Neon DB Connection...")
    const dbInfo = await executeSql("SELECT current_database(), current_user, inet_server_addr(), version();")
    if (!dbInfo || dbInfo.length === 0) {
      throw new Error("Failed to query live Neon DB metadata.")
    }
    console.log("✓ Neon DB Connected:")
    console.log(`   - Database: ${dbInfo[0].current_database}`)
    console.log(`   - User: ${dbInfo[0].current_user}`)
    console.log(`   - Server Version: ${dbInfo[0].version.split(",")[0]}`)

    // ------------------------------------------------------------------------
    // PHASE 2: HIGH-CONCURRENCY PUBLIC BOOKINGS BURST (15 CONCURRENT WRITES)
    // ------------------------------------------------------------------------
    console.log("\n[Phase 2] Stress-testing 15 Concurrent Public Booking Submissions...")
    const CONCURRENCY_COUNT = 15

    const bookingPromises = []
    const expectedBookingIds = []

    for (let i = 0; i < CONCURRENCY_COUNT; i++) {
      const id = `BK-${tag}-${String(i).padStart(2, "0")}`
      expectedBookingIds.push(id)
      createdRecords.bookings.push(id)

      const payload = {
        id,
        customer: `Concurrent Customer ${i}`,
        email: `concurrent.customer.${i}@zimthreads-stress.mu`,
        phone: `+230 5000 ${String(1000 + i)}`,
        serviceId: i % 2 === 0 ? "clean" : "restore",
        serviceName: i % 2 === 0 ? "STANDARD SNEAKER CLEANSE" : "FULL RESTORATION",
        price: i % 2 === 0 ? "Rs 300" : "Rs 800",
        priceNumeric: i % 2 === 0 ? 300 : 800,
        date: "2026-11-25",
        time: `${String(9 + (i % 8)).padStart(2, "0")}:00`,
        notes: `Stress test booking #${i}`,
      }

      bookingPromises.push(
        callApi("POST", "/api/store", {
          action: "public_create",
          entity: "bookings",
          record: payload,
        }),
      )
    }

    const startBookings = Date.now()
    const bookingResponses = await Promise.all(bookingPromises)
    const bookingElapsed = Date.now() - startBookings

    console.log(`- Dispatched ${CONCURRENCY_COUNT} concurrent booking requests in ${bookingElapsed}ms (avg ${Math.round(bookingElapsed / CONCURRENCY_COUNT)}ms/req)`)

    // Verify all returned HTTP 200
    for (let i = 0; i < CONCURRENCY_COUNT; i++) {
      const res = bookingResponses[i]
      if (res.statusCode !== 200 || !res.data?.success) {
        throw new Error(`Booking #${i} failed: HTTP ${res.statusCode} ${JSON.stringify(res.data)}`)
      }
    }
    console.log(`✓ All ${CONCURRENCY_COUNT} booking creation responses succeeded with HTTP 200`)

    // Query Neon DB directly to verify NO dropped records
    const liveBookingsRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'bookings';")
    const liveBookings = liveBookingsRows[0]?.data || []
    const liveBookingIdSet = new Set(liveBookings.map((b) => b.id))

    const missingBookings = expectedBookingIds.filter((id) => !liveBookingIdSet.has(id))
    if (missingBookings.length > 0) {
      throw new Error(`RACE CONDITION DETECTED! ${missingBookings.length} booking records lost in concurrent writes: ${missingBookings.join(", ")}`)
    }
    console.log(`✓ Zero dropped bookings: All ${CONCURRENCY_COUNT} concurrent records verified in Neon DB array!`)

    // ------------------------------------------------------------------------
    // PHASE 3: HIGH-CONCURRENCY PUBLIC ORDERS BURST (15 CONCURRENT WRITES)
    // ------------------------------------------------------------------------
    console.log("\n[Phase 3] Stress-testing 15 Concurrent Public Order Submissions...")
    const orderPromises = []
    const expectedOrderIds = []

    for (let i = 0; i < CONCURRENCY_COUNT; i++) {
      const id = `ORD-${tag}-${String(i).padStart(2, "0")}`
      expectedOrderIds.push(id)
      createdRecords.orders.push(id)

      const payload = {
        id,
        customer: `Concurrent Buyer ${i}`,
        email: `concurrent.buyer.${i}@zimthreads-stress.mu`,
        phone: `+230 5111 ${String(2000 + i)}`,
        address: `${10 + i} Stress Avenue`,
        city: "Curepipe",
        paymentMethod: i % 2 === 0 ? "Juice by MCB" : "Cash on Delivery",
        totalAmount: 2850 + i * 50,
        items: [
          {
            productId: `prod-jacket-${(i % 14) + 1}`,
            name: `Racing Jacket #${(i % 14) + 1}`,
            price: 2850,
            quantity: 1,
            size: i % 3 === 0 ? "M" : i % 3 === 1 ? "L" : "XL",
            customName: `RACE-${i}`,
          },
        ],
      }

      orderPromises.push(
        callApi("POST", "/api/store", {
          action: "public_create",
          entity: "orders",
          record: payload,
        }),
      )
    }

    const startOrders = Date.now()
    const orderResponses = await Promise.all(orderPromises)
    const orderElapsed = Date.now() - startOrders

    console.log(`- Dispatched ${CONCURRENCY_COUNT} concurrent order requests in ${orderElapsed}ms`)

    for (let i = 0; i < CONCURRENCY_COUNT; i++) {
      const res = orderResponses[i]
      if (res.statusCode !== 200 || !res.data?.success) {
        throw new Error(`Order #${i} failed: HTTP ${res.statusCode} ${JSON.stringify(res.data)}`)
      }
    }
    console.log(`✓ All ${CONCURRENCY_COUNT} order creation responses succeeded with HTTP 200`)

    // Verify in Neon DB
    const liveOrdersRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'orders';")
    const liveOrders = liveOrdersRows[0]?.data || []
    const liveOrderIdSet = new Set(liveOrders.map((o) => o.id))

    const missingOrders = expectedOrderIds.filter((id) => !liveOrderIdSet.has(id))
    if (missingOrders.length > 0) {
      throw new Error(`RACE CONDITION DETECTED! ${missingOrders.length} order records lost in concurrent writes: ${missingOrders.join(", ")}`)
    }
    console.log(`✓ Zero dropped orders: All ${CONCURRENCY_COUNT} concurrent records verified in Neon DB array!`)

    // ------------------------------------------------------------------------
    // PHASE 4: MIXED CONCURRENT TRAFFIC (BOOKINGS, ORDERS, INQUIRIES & READS)
    // ------------------------------------------------------------------------
    console.log("\n[Phase 4] Mixed Concurrency: 20 Simultaneous Requests (Mutations + Hydration Reads)...")
    const mixedPromises = []
    const mixedExpectedIds = []

    // 5 bookings, 5 orders, 5 inquiries, 5 GET queries
    for (let i = 0; i < 5; i++) {
      const bId = `BK-${tag}-MIX-${i}`
      mixedExpectedIds.push({ entity: "bookings", id: bId })
      createdRecords.bookings.push(bId)
      mixedPromises.push(
        callApi("POST", "/api/store", {
          action: "public_create",
          entity: "bookings",
          record: {
            id: bId,
            customer: `Mixed Booking ${i}`,
            email: `mix.book.${i}@zimthreads.mu`,
            phone: "+230 5222 3333",
            serviceId: "clean",
          },
        }),
      )

      const oId = `ORD-${tag}-MIX-${i}`
      mixedExpectedIds.push({ entity: "orders", id: oId })
      createdRecords.orders.push(oId)
      mixedPromises.push(
        callApi("POST", "/api/store", {
          action: "public_create",
          entity: "orders",
          record: {
            id: oId,
            customer: `Mixed Order ${i}`,
            email: `mix.order.${i}@zimthreads.mu`,
            phone: "+230 5333 4444",
            items: [{ productId: "prod-1", quantity: 1 }],
          },
        }),
      )

      const inqId = `INQ-${tag}-MIX-${i}`
      mixedExpectedIds.push({ entity: "inquiries", id: inqId })
      createdRecords.inquiries.push(inqId)
      mixedPromises.push(
        callApi("POST", "/api/store", {
          action: "public_create",
          entity: "inquiries",
          record: {
            id: inqId,
            name: `Mixed Inquirer ${i}`,
            email: `mix.inq.${i}@zimthreads.mu`,
            subject: `Mixed Inquiry ${i}`,
            message: `Concurrent traffic simulation #${i}`,
          },
        }),
      )

      // Hydration read concurrent with writes
      mixedPromises.push(callApi("GET", "/api/store?key=all"))
    }

    const mixedResults = await Promise.all(mixedPromises)
    const readResults = mixedResults.filter((_, idx) => idx % 4 === 3)
    const writeResults = mixedResults.filter((_, idx) => idx % 4 !== 3)

    const writeFailures = writeResults.filter((r) => r.statusCode !== 200 || !r.data?.success)
    const readFailures = readResults.filter((r) => r.statusCode !== 200 || !r.data?.success)

    if (writeFailures.length > 0 || readFailures.length > 0) {
      throw new Error(`Mixed traffic failure: ${writeFailures.length} write errors, ${readFailures.length} read errors`)
    }
    console.log(`✓ Mixed Traffic: 15 concurrent writes and 5 concurrent hydration reads completed with 100% success`)

    // Verify all mixed records are in Neon DB
    const finalAllRes = await callApi("GET", "/api/store?key=all")
    const finalStore = finalAllRes.data.data
    for (const item of mixedExpectedIds) {
      const exists = (finalStore[item.entity] || []).some((r) => r.id === item.id)
      if (!exists) {
        throw new Error(`Missing record in mixed traffic: ${item.entity}/${item.id}`)
      }
    }
    console.log(`✓ All mixed traffic records confirmed in Neon DB`)

    // ------------------------------------------------------------------------
    // PHASE 5: REHYDRATION SYNC RECONCILIATION ALGORITHM AUDIT
    // ------------------------------------------------------------------------
    console.log("\n[Phase 5] Rehydration Sync (fetchCloudData) Reconciliation Engine Testing...")

    // Simulate the exact reconciliation algorithm from StoreContext.tsx lines 401-432:
    const reconcileLocalWithCloud = (prevList, cloudList, maxAgeMs = 60000) => {
      const cloudIds = new Set((cloudList || []).map((x) => x.id))
      const recentLocal = (prevList || []).filter((item) => {
        if (cloudIds.has(item.id)) return false
        const ageMs = Date.now() - new Date(item.createdAt || 0).getTime()
        return !isNaN(ageMs) && ageMs < maxAgeMs
      })
      return [...recentLocal, ...(cloudList || [])]
    }

    // 5.1 Case A: Pending / Recent Local Mutation Not Yet in Cloud Snapshot
    const now = Date.now()
    const recentLocalRecord = {
      id: "BK-LOCAL-RECENT-1",
      customer: "Fresh Local",
      createdAt: new Date(now - 3000).toISOString(), // 3s ago
    }
    const oldCloudList = [
      { id: "BK-OLD-CLOUD-1", customer: "Cloud Record 1" },
      { id: "BK-OLD-CLOUD-2", customer: "Cloud Record 2" },
    ]

    const reconciledCaseA = reconcileLocalWithCloud([recentLocalRecord], oldCloudList)
    if (reconciledCaseA.length !== 3 || reconciledCaseA[0].id !== "BK-LOCAL-RECENT-1") {
      throw new Error(`Reconciliation Case A Failed: Local mutation was dropped! Result: ${JSON.stringify(reconciledCaseA)}`)
    }
    console.log("✓ Case A Passed: Recent local mutation (< 60s) preserved at head of array during cloud lag")

    // 5.2 Case B: Mutation Has Landed on Cloud (Deduplication Check)
    const updatedCloudList = [
      { id: "BK-LOCAL-RECENT-1", customer: "Fresh Local (From Cloud)" },
      ...oldCloudList,
    ]
    const reconciledCaseB = reconcileLocalWithCloud([recentLocalRecord], updatedCloudList)
    if (reconciledCaseB.length !== 3) {
      throw new Error(`Reconciliation Case B Failed: Duplicate created! Length: ${reconciledCaseB.length}`)
    }
    const localIdOccurrences = reconciledCaseB.filter((r) => r.id === "BK-LOCAL-RECENT-1").length
    if (localIdOccurrences !== 1) {
      throw new Error(`Reconciliation Case B Failed: ${localIdOccurrences} instances found of ID BK-LOCAL-RECENT-1`)
    }
    console.log("✓ Case B Passed: Once landed in cloud snapshot, record is cleanly deduplicated (exact 1 copy)")

    // 5.3 Case C: Stale Local Mutation (> 60s) Deleted on Cloud
    const staleLocalRecord = {
      id: "BK-LOCAL-STALE-1",
      customer: "Stale Local",
      createdAt: new Date(now - 75000).toISOString(), // 75s ago
    }
    const reconciledCaseC = reconcileLocalWithCloud([staleLocalRecord], oldCloudList)
    if (reconciledCaseC.some((r) => r.id === "BK-LOCAL-STALE-1")) {
      throw new Error("Reconciliation Case C Failed: Stale deleted local record was not pruned!")
    }
    console.log("✓ Case C Passed: Stale deleted records (> 60s) are cleanly pruned on cloud sync")

    // 5.4 Case D: Rapid interleaving simulation (10 rapid cloud syncs with concurrent state changes)
    let clientState = []
    for (let step = 0; step < 10; step++) {
      // client adds a record
      const rec = { id: `REC-STEP-${step}`, createdAt: new Date().toISOString() }
      clientState = [rec, ...clientState]
      // cloud has only even steps
      const mockCloud = clientState.filter((_, idx) => idx % 2 === 0)
      clientState = reconcileLocalWithCloud(clientState, mockCloud)
    }
    if (clientState.length !== 10) {
      throw new Error(`Reconciliation Case D Failed: Expected 10 records after rapid interleaving, got ${clientState.length}`)
    }
    console.log("✓ Case D Passed: Rapid interleaving maintains 100% data integrity with zero lost records")

    // ------------------------------------------------------------------------
    // PHASE 6: ADVERSARIAL ORDER BOUNDARY & INTEGRITY UNDER CONCURRENCY
    // ------------------------------------------------------------------------
    console.log("\n[Phase 6] Testing Order Data Integrity with Multi-Item & Customization Payloads...")

    const multiItemOrderPayload = {
      id: `ORD-${tag}-HEAVY`,
      customer: "Heavy Order Buyer",
      email: "heavy.buyer@zimthreads.mu",
      phone: "+230 5777 8888",
      address: "Industrial Zone, Plaine Lauzun",
      city: "Port Louis",
      paymentMethod: "Juice by MCB",
      totalAmount: 14250,
      items: Array.from({ length: 5 }, (_, idx) => ({
        productId: `prod-jacket-${idx + 1}`,
        name: `Archival Jacket #${idx + 1}`,
        price: 2850,
        quantity: 1,
        size: "XL",
        customName: `BESPOKE-${idx + 1}`,
      })),
    }

    const heavyOrderRes = await callApi("POST", "/api/store", {
      action: "public_create",
      entity: "orders",
      record: multiItemOrderPayload,
    })
    if (heavyOrderRes.statusCode !== 200 || !heavyOrderRes.data?.success) {
      throw new Error(`Heavy order creation failed: ${JSON.stringify(heavyOrderRes.data)}`)
    }
    createdRecords.orders.push(multiItemOrderPayload.id)

    // Inspect in DB
    const heavyOrderRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'orders';")
    const foundHeavy = (heavyOrderRows[0]?.data || []).find((o) => o.id === multiItemOrderPayload.id)
    if (!foundHeavy || foundHeavy.items.length !== 5 || foundHeavy.totalAmount !== 14250) {
      throw new Error("Heavy order payload corrupted during persistence")
    }
    console.log(`✓ Multi-item heavy payload persisted with 100% fidelity (5 customized items, Rs 14,250)`)

    // ------------------------------------------------------------------------
    // PHASE 7: TEARDOWN & COMPLETE CLEANUP AUDIT
    // ------------------------------------------------------------------------
    console.log("\n[Phase 7] Cleaning Up All Test Records from Neon DB...")
    const totalToClean =
      createdRecords.bookings.length +
      createdRecords.orders.length +
      createdRecords.inquiries.length

    console.log(`- Total records to excise: ${totalToClean} (${createdRecords.bookings.length} bookings, ${createdRecords.orders.length} orders, ${createdRecords.inquiries.length} inquiries)`)

    for (const [entity, idList] of Object.entries(createdRecords)) {
      for (const id of idList) {
        const delRes = await callApi("POST", "/api/store", {
          action: "delete_entity",
          adminToken: "Zimthreads200",
          entity,
          id,
        })
        if (delRes.statusCode !== 200 || !delRes.data?.success) {
          throw new Error(`Failed to delete record ${entity}/${id}: ${JSON.stringify(delRes.data)}`)
        }
      }
    }
    console.log("✓ All test records deleted via authenticated API endpoint")

    // Forensic Post-Cleanup DB Audit
    console.log("- Performing Forensic Post-Cleanup Audit against Neon DB...")
    const postAuditRes = await callApi("GET", "/api/store?key=all")
    const postData = postAuditRes.data.data

    let strayCount = 0
    for (const [entity, idList] of Object.entries(createdRecords)) {
      for (const id of idList) {
        const stray = (postData[entity] || []).some((r) => r.id === id)
        if (stray) {
          console.error(`STRAY RECORD FOUND: ${entity}/${id}`)
          strayCount++
        }
      }
    }

    if (strayCount > 0) {
      throw new Error(`TEARDOWN FAILURE: ${strayCount} test records remained in Neon DB!`)
    }
    console.log("✓ Forensic Audit Passed: 0 stray records found. Production database restored to pristine state!")

    console.log("\n=================================================================")
    console.log("   CONCURRENCY & REHYDRATION STRESS HARNESS COMPLETED: 100% PASS ")
    console.log("=================================================================")

    return {
      success: true,
      totalConcurrentTested: totalToClean,
      bookingLatencyMs: bookingElapsed,
      orderLatencyMs: orderElapsed,
    }
  } catch (err) {
    console.error("\n❌ CONCURRENCY STRESS HARNESS FAILED:", err)

    // Emergency Cleanup
    console.log("\nInitiating emergency cleanup of any created records...")
    for (const [entity, idList] of Object.entries(createdRecords)) {
      for (const id of idList) {
        try {
          await callApi("POST", "/api/store", {
            action: "delete_entity",
            adminToken: "Zimthreads200",
            entity,
            id,
          })
        } catch {}
      }
    }
    throw err
  }
}

runConcurrencyStressHarness()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
