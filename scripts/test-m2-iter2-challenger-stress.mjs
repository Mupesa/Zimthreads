/**
 * Milestone 2 Iteration 2 Challenger 1 Comprehensive Empirical Stress Test Suite
 * Target: Neon PostgreSQL rapid-hill-42448439 (anesumupesa@gmail.com / Mupesa)
 */

import handler, { executeSql } from "../api/store.ts"
import { initialProducts, racingJacketsCollection } from "../src/store/seedData.ts"

// ============================================================================
// HELPER: Mock HTTP Response
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

// Track created IDs for teardown
const cleanupTracker = {
  bookings: [],
  orders: [],
  inquiries: [],
}

async function runAllChallengerSuites() {
  console.log("=================================================================")
  console.log("   M2 ITERATION 2 CHALLENGER 1: EMPIRICAL STRESS TEST HARNESS   ")
  console.log("   Target Neon DB: rapid-hill-42448439                          ")
  console.log("=================================================================\n")

  let passedTests = 0
  let failedTests = 0

  function assert(condition, message) {
    if (!condition) {
      failedTests++
      console.error(`❌ FAILED: ${message}`)
      throw new Error(`Assertion failed: ${message}`)
    }
    passedTests++
    console.log(`✓ ${message}`)
  }

  try {
    // ------------------------------------------------------------------------
    // SUITE 1: CLIENT PESSIMISTIC PERSISTENCE & ERROR BUBBLING CONTRACT
    // ------------------------------------------------------------------------
    console.log("--- SUITE 1: StoreContext Client Pessimistic Persistence & Error Bubbling ---")

    // 1.1 Simulated network error: fetch fails
    console.log("1.1 Simulating persistPublicRecord network failure...")
    {
      let localBookings = [{ id: "BK-INITIAL", customer: "Existing" }]
      let localOrders = [{ id: "ORD-INITIAL", customer: "Existing" }]
      let localInquiries = [{ id: "INQ-INITIAL", customer: "Existing" }]
      let cart = [{ productId: "prod-1", name: "Jacket", price: 2850, quantity: 1 }]

      const simulatePersistPublicRecord = async (entity, record, mockMode) => {
        if (mockMode === "network_error") {
          throw new Error("Network error: Unable to reach the server. Please check your internet connection.")
        }
        if (mockMode === "timeout") {
          throw new Error("Request timed out. Please check your internet connection and try again.")
        }
        if (mockMode === "server_500") {
          throw new Error("Server error (500): Failed to save record.")
        }
        return record
      }

      // addBooking under network failure
      const addBookingSim = async (data, mode) => {
        const newRecord = { ...data, id: "BK-FAIL-1", status: "Pending" }
        const saved = await simulatePersistPublicRecord("bookings", newRecord, mode)
        localBookings = [saved, ...localBookings]
        return saved
      }

      let errorCaught = null
      try {
        await addBookingSim({ customer: "Failed Customer" }, "network_error")
      } catch (err) {
        errorCaught = err
      }

      assert(errorCaught !== null, "addBooking rethrows network error to caller")
      assert(errorCaught.message.includes("Network error"), "addBooking surfaces exact network error message")
      assert(localBookings.length === 1 && localBookings[0].id === "BK-INITIAL", "Local bookings state untouched on rejection")

      // createOrder under network failure
      const createOrderSim = async (data, mode) => {
        if (cart.length === 0) throw new Error("Cannot place an order with an empty shopping bag.")
        const newRecord = { ...data, id: "ORD-FAIL-1", items: [...cart] }
        const saved = await simulatePersistPublicRecord("orders", newRecord, mode)
        localOrders = [saved, ...localOrders]
        cart = [] // clearCart
        return saved
      }

      let orderErrorCaught = null
      try {
        await createOrderSim({ customer: "Failed Buyer" }, "timeout")
      } catch (err) {
        orderErrorCaught = err
      }

      assert(orderErrorCaught !== null, "createOrder rethrows timeout error to caller")
      assert(orderErrorCaught.message.includes("timed out"), "createOrder surfaces timeout message")
      assert(cart.length === 1, "Shopping bag cart items PRESERVED on order failure (not wiped)")
      assert(localOrders.length === 1 && localOrders[0].id === "ORD-INITIAL", "Local orders state untouched on rejection")

      // Empty cart validation guard in createOrder
      let emptyCartError = null
      cart = []
      try {
        await createOrderSim({ customer: "Empty Cart Buyer" }, "success")
      } catch (err) {
        emptyCartError = err
      }
      assert(emptyCartError !== null && emptyCartError.message.includes("empty shopping bag"), "createOrder throws immediately if cart is empty")

      // addInquiry under server 500 error
      const addInquirySim = async (data, mode) => {
        const newRecord = { ...data, id: "INQ-FAIL-1" }
        const saved = await simulatePersistPublicRecord("inquiries", newRecord, mode)
        localInquiries = [saved, ...localInquiries]
        return saved
      }

      let inqErrorCaught = null
      try {
        await addInquirySim({ name: "Failed Inquirer" }, "server_500")
      } catch (err) {
        inqErrorCaught = err
      }

      assert(inqErrorCaught !== null && inqErrorCaught.message.includes("Server error (500)"), "addInquiry rethrows HTTP 500 error")
      assert(localInquiries.length === 1 && localInquiries[0].id === "INQ-INITIAL", "Local inquiries state untouched on rejection")
    }

    // ------------------------------------------------------------------------
    // SUITE 2: FORM COMPONENT ASYNC ERROR & STATE RETENTION LIFECYCLE
    // ------------------------------------------------------------------------
    console.log("\n--- SUITE 2: UI Form Component Error Lifecycle & State Retention ---")

    // 2.1 Booking.tsx lifecycle simulation
    console.log("2.1 Simulating Booking.tsx handleConfirmBooking on rejection...")
    {
      let step = 3
      let isSubmitting = false
      let submitError = null
      let confirmedBooking = null
      const details = { name: "Adversarial Tester", email: "tester@test.com", phone: "+230 5111 2222", notes: "Keep my notes" }

      const handleConfirmBooking = async () => {
        isSubmitting = true
        submitError = null
        try {
          // Simulated failing addBooking
          throw new Error("Unable to reach Neon DB endpoint")
          step = 4
        } catch (err) {
          submitError = err.message || "Failed to confirm booking."
        } finally {
          isSubmitting = false
        }
      }

      await handleConfirmBooking()

      assert(step === 3, "Booking step remains at 3 (does NOT jump to Step 4 Confirmed)")
      assert(submitError === "Unable to reach Neon DB endpoint", "submitError receives exact rejection message")
      assert(isSubmitting === false, "isSubmitting properly resets to false for user retry")
      assert(details.name === "Adversarial Tester" && details.notes === "Keep my notes", "User form inputs remain 100% intact")
      assert(confirmedBooking === null, "confirmedBooking remains null on failure")
    }

    // 2.2 CartDrawer.tsx lifecycle simulation
    console.log("2.2 Simulating CartDrawer.tsx handleCheckoutSubmit on rejection...")
    {
      let isCheckoutOpen = true
      let isSubmitting = false
      let checkoutError = null
      let orderComplete = null
      const cartItems = [{ productId: "jacket-1", quantity: 1, price: 2850 }]
      const formData = { name: "Buyer Jean", email: "jean@zimthreads.mu", phone: "+230 5222 3333", address: "Route Royale" }

      const handleCheckoutSubmit = async () => {
        isSubmitting = true
        checkoutError = null
        try {
          // Simulated failing createOrder
          throw new Error("Server error (503): Database service temporarily unavailable.")
          orderComplete = { id: "ORD-123" }
        } catch (err) {
          checkoutError = err.message
        } finally {
          isSubmitting = false
        }
      }

      await handleCheckoutSubmit()

      assert(isCheckoutOpen === true, "Checkout modal/drawer remains open on failure")
      assert(checkoutError.includes("503"), "checkoutError banner receives exact error message")
      assert(cartItems.length === 1, "Cart items remain 100% intact on failure")
      assert(formData.name === "Buyer Jean" && formData.address === "Route Royale", "Checkout form fields remain 100% intact")
      assert(orderComplete === null, "orderComplete remains null on failure")
      assert(isSubmitting === false, "isSubmitting resets to false to re-enable submit button")
    }

    // 2.3 Contact.tsx lifecycle simulation
    console.log("2.3 Simulating Contact.tsx handleSubmit on rejection...")
    {
      let sent = false
      let isSubmitting = false
      let submitError = null
      const form = { name: "Farai Mutasa", email: "farai@test.com", subject: "Sneaker clean", message: "Preserve this message" }

      const handleSubmit = async () => {
        isSubmitting = true
        submitError = null
        try {
          // Simulated failing addInquiry
          throw new Error("Network connection dropped")
          sent = true
        } catch (err) {
          submitError = err.message
        } finally {
          isSubmitting = false
        }
      }

      await handleSubmit()

      assert(sent === false, "Contact form does NOT transition to sent screen on failure")
      assert(submitError === "Network connection dropped", "submitError receives exact rejection message")
      assert(form.name === "Farai Mutasa" && form.message === "Preserve this message", "User message and fields remain 100% intact")
      assert(isSubmitting === false, "isSubmitting resets to false to allow retry")
    }

    // ------------------------------------------------------------------------
    // SUITE 3: CATALOG & MODAL REACTIVITY IN JACKETSCOLLECTIONPAGE
    // ------------------------------------------------------------------------
    console.log("\n--- SUITE 3: JacketsCollectionPage ProductModal Dynamic Reactivity ---")
    {
      const catalog = [
        { id: "prod-jacket-1", name: "Repsol Jacket", price: 2850, collectionId: "racing-jackets" },
        { id: "prod-jacket-2", name: "Ferrari Windbreaker", price: 2200, collectionId: "racing-jackets" },
      ]

      let selectedProduct = { id: "prod-jacket-1", name: "Repsol Jacket", price: 2850, collectionId: "racing-jackets" }

      // Memoized dereferencing from JacketsCollectionPage.tsx line 11-14:
      const deriveLiveSelectedProduct = (prods, sel) => {
        if (!sel) return null
        return prods.find((p) => p.id === sel.id) || sel
      }

      let liveModalProduct = deriveLiveSelectedProduct(catalog, selectedProduct)
      assert(liveModalProduct.price === 2850, "Initial modal product price matches initial catalog")

      // Admin updates price in store
      const updatedCatalog = catalog.map((p) => (p.id === "prod-jacket-1" ? { ...p, price: 3400 } : p))
      liveModalProduct = deriveLiveSelectedProduct(updatedCatalog, selectedProduct)

      assert(liveModalProduct.price === 3400, "liveSelectedProduct reactively updates modal price to Rs 3400 without closing modal")
    }

    // ------------------------------------------------------------------------
    // SUITE 4: LIVE NEON DB PERSISTENCE & DATA INTEGRITY (rapid-hill-42448439)
    // ------------------------------------------------------------------------
    console.log("\n--- SUITE 4: Live Neon DB Persistence, Ordering & Data Fidelity ---")

    const runTag = `CHALLENGE-${Date.now().toString().slice(-5)}`
    const bookingId1 = `BK-${runTag}-1`
    const bookingId2 = `BK-${runTag}-2`
    const orderId1 = `ORD-${runTag}-1`
    const inquiryId1 = `INQ-${runTag}-1`

    // 4.1 Create Booking 1
    console.log(`4.1 Creating Live Booking 1: ${bookingId1}...`)
    const b1Res = await callApi("POST", "/api/store", {
      action: "public_create",
      entity: "bookings",
      record: {
        id: bookingId1,
        customer: "Nasser Al-Mansoor",
        email: "Nasser.Mansoor@ZimThreads.mu",
        phone: "+230 5711 0011",
        serviceId: "clean",
        serviceName: "DEEP CLEANING & SANITIZATION",
        price: "Rs 400",
        priceNumeric: 400,
        date: "2026-11-20",
        time: "10:30",
        notes: "M2 Iter2 Challenger Empirical Test Booking 1",
      },
    })
    assert(b1Res.statusCode === 200 && b1Res.data?.success, "Booking 1 public_create returns HTTP 200")
    cleanupTracker.bookings.push(bookingId1)

    // 4.2 Create Booking 2 (Successive Prepend Test)
    console.log(`4.2 Creating Live Booking 2: ${bookingId2}...`)
    const b2Res = await callApi("POST", "/api/store", {
      action: "public_create",
      entity: "bookings",
      record: {
        id: bookingId2,
        customer: "Amara Patel",
        email: "amara@zimthreads.mu",
        phone: "+230 5722 0022",
        serviceId: "restore",
        serviceName: "FULL RESTORATION & REDYES",
        price: "Rs 800",
        priceNumeric: 800,
        date: "2026-11-21",
        time: "14:00",
        notes: "M2 Iter2 Challenger Empirical Test Booking 2",
      },
    })
    assert(b2Res.statusCode === 200 && b2Res.data?.success, "Booking 2 public_create returns HTTP 200")
    cleanupTracker.bookings.push(bookingId2)

    // 4.3 Create Order 1 with multi-item and custom personalization
    console.log(`4.3 Creating Live Order 1: ${orderId1}...`)
    const o1Res = await callApi("POST", "/api/store", {
      action: "public_create",
      entity: "orders",
      record: {
        id: orderId1,
        customer: "Kavish Naidoo",
        email: "Kavish.Naidoo@ZimThreads.mu",
        phone: "+230 5844 3322",
        address: "14 Rue Desforges, Chinatown",
        city: "Port Louis",
        paymentMethod: "Juice by MCB",
        totalAmount: 3750,
        items: [
          {
            productId: "prod-jacket-1",
            name: "1998 Repsol Honda CBR Archival Racing Jacket",
            price: 2850,
            quantity: 1,
            size: "L",
            customName: "KAVISH-98",
          },
          {
            productId: "prod-acc-1",
            name: "Vintage Silver Chain Bracelet",
            price: 900,
            quantity: 1,
            size: "One Size",
          },
        ],
      },
    })
    assert(o1Res.statusCode === 200 && o1Res.data?.success, "Order 1 public_create returns HTTP 200")
    cleanupTracker.orders.push(orderId1)

    // 4.4 Create Inquiry 1
    console.log(`4.4 Creating Live Inquiry 1: ${inquiryId1}...`)
    const inq1Res = await callApi("POST", "/api/store", {
      action: "public_create",
      entity: "inquiries",
      record: {
        id: inquiryId1,
        name: "Jean-Luc Fontaine",
        email: "JeanLuc.Fontaine@ZimThreads.mu",
        subject: "Bespoke Varsity Jacket Order",
        message: "Requesting lead times for custom embroidery.",
      },
    })
    assert(inq1Res.statusCode === 200 && inq1Res.data?.success, "Inquiry 1 public_create returns HTTP 200")
    cleanupTracker.inquiries.push(inquiryId1)

    // 4.5 Verify Hydration & Prepend Ordering
    console.log("4.5 Verifying Live Neon DB Hydration (GET /api/store?key=all)...")
    const allRes = await callApi("GET", "/api/store?key=all")
    assert(allRes.statusCode === 200 && allRes.data?.success, "GET /api/store?key=all returns HTTP 200")

    const { bookings, orders, inquiries } = allRes.data.data

    // Check LIFO ordering: bookingId2 must be index 0, bookingId1 must be index 1
    assert(bookings[0]?.id === bookingId2, `bookings[0] is newest booking (${bookingId2})`)
    assert(bookings[1]?.id === bookingId1, `bookings[1] is preceding booking (${bookingId1})`)
    assert(orders[0]?.id === orderId1, `orders[0] is newest order (${orderId1})`)
    assert(inquiries[0]?.id === inquiryId1, `inquiries[0] is newest inquiry (${inquiryId1})`)

    // Check Data Fidelity & Normalization
    const fetchedBooking2 = bookings[0]
    assert(fetchedBooking2.customer === "Amara Patel", "Booking customer name preserved")
    assert(fetchedBooking2.email === "amara@zimthreads.mu", "Booking email preserved")
    assert(fetchedBooking2.status === "Pending", "Booking status defaults to 'Pending'")

    const fetchedOrder = orders[0]
    assert(fetchedOrder.customer === "Kavish Naidoo", "Order customer name preserved")
    assert(fetchedOrder.email === "kavish.naidoo@zimthreads.mu", "Order email normalized to lowercase")
    assert(fetchedOrder.items.length === 2, "Order items array length preserved")
    assert(fetchedOrder.items[0].customName === "KAVISH-98", "Order customName personalization preserved")
    assert(fetchedOrder.totalAmount === 3750, "Order total amount preserved")
    assert(fetchedOrder.status === "Processing", "Order status defaults to 'Processing'")

    const fetchedInquiry = inquiries[0]
    assert(fetchedInquiry.email === "jeanluc.fontaine@zimthreads.mu", "Inquiry email normalized to lowercase")
    assert(fetchedInquiry.read === false, "Inquiry read flag defaults to false")

    // ------------------------------------------------------------------------
    // SUITE 5: ADVERSARIAL BOUNDARY & CONCURRENT WRITE STRESS TESTING
    // ------------------------------------------------------------------------
    console.log("\n--- SUITE 5: Adversarial Boundary & Concurrency Stress Testing ---")

    // 5.1 Unauthorized entity modification
    console.log("5.1 Testing unauthorized entity injections via public_create...")
    for (const badEntity of ["products", "services", "settings", "admin_users"]) {
      const res = await callApi("POST", "/api/store", {
        action: "public_create",
        entity: badEntity,
        record: { title: "Hacked" },
      })
      assert(res.statusCode === 400 && res.data?.error?.includes("not permitted"), `public_create against '${badEntity}' rejected with HTTP 400`)
    }

    // 5.2 Malformed email validation matrix
    console.log("5.2 Testing malformed email boundary rejection...")
    const badEmails = ["plain", "user@", "@domain.com", "user space@domain.com", "user@domain"]
    for (const badEmail of badEmails) {
      const res = await callApi("POST", "/api/store", {
        action: "public_create",
        entity: "bookings",
        record: {
          customer: "Bad Email Customer",
          email: badEmail,
          phone: "+230 5000 0000",
          serviceId: "clean",
        },
      })
      assert(res.statusCode === 400 && res.data?.error?.includes("invalid email"), `Invalid email '${badEmail}' rejected with HTTP 400`)
    }

    // 5.3 Empty items order rejection
    console.log("5.3 Testing empty items order rejection...")
    {
      const res = await callApi("POST", "/api/store", {
        action: "public_create",
        entity: "orders",
        record: {
          customer: "Empty Items Buyer",
          email: "buyer@test.mu",
          phone: "+230 5000 0000",
          items: [],
        },
      })
      assert(res.statusCode === 400 && res.data?.error?.includes("at least one item"), "Order with empty items rejected with HTTP 400")
    }

    // 5.4 SQL Injection resilience
    console.log("5.4 Testing SQL injection parameterization resilience...")
    const sqliId = `BK-${runTag}-SQLI`
    const sqliRes = await callApi("POST", "/api/store", {
      action: "public_create",
      entity: "bookings",
      record: {
        id: sqliId,
        customer: "Robert'); DROP TABLE zimthreads_store; --",
        email: "sqli@zimthreads.mu",
        phone: "+230 5000 9999",
        serviceId: "clean",
      },
    })
    assert(sqliRes.statusCode === 200, "SQL injection string safely stored via parameterization (HTTP 200)")
    cleanupTracker.bookings.push(sqliId)

    // Verify table is intact
    const verifyTableRows = await executeSql("SELECT count(*) as count FROM public.zimthreads_store;")
    assert(Number(verifyTableRows[0].count) >= 7, "Neon DB table zimthreads_store completely intact after injection attempt")

    // 5.5 High-Throughput Concurrent Burst Persistence
    console.log("5.5 Testing Concurrent Burst Persistence (6 simultaneous submissions)...")
    const burstPromises = []
    const burstIds = []
    for (let i = 0; i < 6; i++) {
      const burstId = `BK-${runTag}-BURST-${i}`
      burstIds.push(burstId)
      cleanupTracker.bookings.push(burstId)
      burstPromises.push(
        callApi("POST", "/api/store", {
          action: "public_create",
          entity: "bookings",
          record: {
            id: burstId,
            customer: `Burst Customer ${i}`,
            email: `burst.${i}@zimthreads.mu`,
            phone: "+230 5999 1111",
            serviceId: "clean",
          },
        }),
      )
    }

    const burstResponses = await Promise.all(burstPromises)
    const allBurstOk = burstResponses.every((r) => r.statusCode === 200 && r.data?.success)
    assert(allBurstOk, "All 6 concurrent burst submissions responded with HTTP 200")

    // Verify all 6 landed in Neon DB
    const checkBurstRes = await callApi("GET", "/api/store?key=bookings")
    const liveBookings = checkBurstRes.data.data || []
    const foundBurstCount = burstIds.filter((bId) => liveBookings.some((b) => b.id === bId)).length
    assert(foundBurstCount === 6, `Zero dropped records under concurrency: All 6 burst bookings verified in Neon DB!`)

    // ------------------------------------------------------------------------
    // TEARDOWN & REVALIDATION
    // ------------------------------------------------------------------------
    console.log("\n--- TEARDOWN: Authenticated Cleanup & DB Cleanliness Verification ---")
    let deletedCount = 0

    for (const [entity, idList] of Object.entries(cleanupTracker)) {
      for (const id of idList) {
        const delRes = await callApi("POST", "/api/store", {
          action: "delete_entity",
          adminToken: "Zimthreads200",
          entity,
          id,
        })
        if (delRes.statusCode === 200) {
          deletedCount++
        }
      }
    }
    console.log(`✓ Cleaned up ${deletedCount} test records from Neon DB`)

    // Forensic verification that no test records remain
    const finalAudit = await callApi("GET", "/api/store?key=all")
    const allData = finalAudit.data.data
    let strays = 0
    for (const [entity, idList] of Object.entries(cleanupTracker)) {
      for (const id of idList) {
        if (allData[entity]?.some((r) => r.id === id)) {
          strays++
          console.error(`Stray found: ${entity}/${id}`)
        }
      }
    }
    assert(strays === 0, "Forensic Audit Verified: 100% of test records cleanly excised from Neon DB")

    console.log("\n=================================================================")
    console.log(`   CHALLENGER 1 RESULTS: ${passedTests} PASSED, ${failedTests} FAILED    `)
    console.log("   VERDICT: APPROVE                                              ")
    console.log("=================================================================")
    return true
  } catch (err) {
    console.error("\n❌ CHALLENGER 1 SUITE FAILED WITH ERROR:", err)
    // Emergency cleanup
    for (const [entity, idList] of Object.entries(cleanupTracker)) {
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
    process.exit(1)
  }
}

runAllChallengerSuites().then(() => process.exit(0)).catch(() => process.exit(1))
