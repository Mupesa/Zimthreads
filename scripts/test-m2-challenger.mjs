import handler, { executeSql } from "../api/store.ts"

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

async function runEmpiricalChallenge() {
  console.log("=================================================================")
  console.log("   EMPIRICAL CHALLENGER: MILESTONE 2 CUSTOMER FLOWS & NEON DB    ")
  console.log("=================================================================\n")

  const createdRecords = {
    bookings: [],
    orders: [],
    inquiries: [],
  }

  try {
    // -------------------------------------------------------------
    // PHASE 1: TARGET HOST & DIRECT SQL HEALTH CHECK
    // -------------------------------------------------------------
    console.log("[Phase 1] Target Neon DB Host & Connection Verification...")
    const dbRows = await executeSql("SELECT current_database(), current_user, version();")
    if (!dbRows || dbRows.length === 0) {
      throw new Error("Direct Neon SQL query returned empty result")
    }
    console.log("✓ Neon SQL Direct Connection verified:")
    console.log(`   - Database: ${dbRows[0].current_database}`)
    console.log(`   - User: ${dbRows[0].current_user}`)
    console.log(`   - Version: ${dbRows[0].version.split(",")[0]}`)

    // -------------------------------------------------------------
    // PHASE 2: ADVERSARIAL SECURITY & INPUT VALIDATION
    // -------------------------------------------------------------
    console.log("\n[Phase 2] Adversarial Security & Validation Boundary Tests...")

    // 2.1 Unauthorized public_create against non-customer entities
    for (const unauthorizedEntity of ["products", "settings", "services", "blog_posts", "admin"]) {
      const res = await callApi("POST", "/api/store", {
        action: "public_create",
        entity: unauthorizedEntity,
        record: { title: "Malicious Injection" },
      })
      if (res.statusCode !== 400 || !res.data?.error?.includes("not permitted")) {
        throw new Error(
          `Security vulnerability! public_create allowed against '${unauthorizedEntity}': HTTP ${res.statusCode}`,
        )
      }
      console.log(`✓ Access blocked for public_create on '${unauthorizedEntity}' (HTTP 400)`)
    }

    // 2.2 Malformed email rejections
    const invalidEmails = ["notanemail", "@missinguser.com", "user@", "user@domain", "user space@test.com"]
    for (const badEmail of invalidEmails) {
      const res = await callApi("POST", "/api/store", {
        action: "public_create",
        entity: "bookings",
        record: {
          customer: "Adversary",
          email: badEmail,
          phone: "+230 5555 1234",
          serviceId: "clean",
        },
      })
      if (res.statusCode !== 400 || !res.data?.error?.includes("invalid email")) {
        throw new Error(`Validation bypass! Invalid email '${badEmail}' was accepted for bookings!`)
      }
    }
    console.log(`✓ Tested ${invalidEmails.length} invalid email variations on bookings - all rejected (HTTP 400)`)

    // 2.3 Empty order items array
    {
      const res = await callApi("POST", "/api/store", {
        action: "public_create",
        entity: "orders",
        record: {
          customer: "Zero Item Buyer",
          email: "valid@customer.com",
          phone: "+230 5555 1234",
          items: [],
        },
      })
      if (res.statusCode !== 400 || !res.data?.error?.includes("at least one item")) {
        throw new Error(`Validation bypass! Order with empty items array was accepted!`)
      }
      console.log("✓ Empty items array on order rejected (HTTP 400)")
    }

    // 2.4 Missing inquiry fields
    {
      const res = await callApi("POST", "/api/store", {
        action: "public_create",
        entity: "inquiries",
        record: {
          name: "Tester",
          email: "valid@customer.com",
          subject: "Test Subject",
          // missing message
        },
      })
      if (res.statusCode !== 400 || !res.data?.error?.includes("message cannot be empty")) {
        throw new Error(`Validation bypass! Inquiry with missing message was accepted!`)
      }
      console.log("✓ Missing inquiry message rejected (HTTP 400)")
    }

    // 2.5 Admin deletion without token or with invalid token
    {
      const unauthRes = await callApi("POST", "/api/store", {
        action: "delete_entity",
        entity: "bookings",
        id: "BK-FAKE-ID",
      })
      if (unauthRes.statusCode !== 401) {
        throw new Error(`Security breach! Unauthenticated delete_entity was not rejected with 401! Got: ${unauthRes.statusCode}`)
      }
      console.log("✓ Unauthenticated delete_entity blocked with HTTP 401")

      const badTokenRes = await callApi("POST", "/api/store", {
        action: "delete_entity",
        adminToken: "WrongPassword999",
        entity: "bookings",
        id: "BK-FAKE-ID",
      })
      if (badTokenRes.statusCode !== 401) {
        throw new Error(`Security breach! Invalid adminToken was not rejected with 401! Got: ${badTokenRes.statusCode}`)
      }
      console.log("✓ Invalid adminToken blocked with HTTP 401")
    }

    // -------------------------------------------------------------
    // PHASE 3: LIVE PUBLIC CUSTOMER FLOWS SUBMISSION
    // -------------------------------------------------------------
    console.log("\n[Phase 3] Submitting Live Public Customer Flow Records...")

    const uniqueTag = Date.now().toString().slice(-5)
    const testBookingId = `BK-CHALLENGE-${uniqueTag}`
    const testOrderId = `ORD-CHALLENGE-${uniqueTag}`
    const testInquiryId = `INQ-CHALLENGE-${uniqueTag}`

    // 3.1 Live Booking Submission
    const bookingPayload = {
      id: testBookingId,
      customer: "Amara Patel",
      email: "Amara.Patel@ZimThreads-Testing.mu",
      phone: "+230 5712 9988",
      serviceId: "custom",
      serviceName: "BESPOKE SNEAKER CUSTOMIZATION",
      price: "Rs 1,500",
      priceNumeric: 1500,
      date: "2026-11-15",
      time: "11:00",
      notes: "Adversarial empirical challenge test booking - verify cloud head ordering",
    }
    const bookingRes = await callApi("POST", "/api/store", {
      action: "public_create",
      entity: "bookings",
      record: bookingPayload,
    })
    if (bookingRes.statusCode !== 200 || !bookingRes.data?.success) {
      throw new Error(`Live booking creation failed: ${JSON.stringify(bookingRes.data)}`)
    }
    createdRecords.bookings.push(testBookingId)
    console.log(`✓ Live Booking created successfully: ${testBookingId} (${bookingRes.data.record.customer})`)

    // 3.2 Live Order Submission (with multi-item & custom personalization)
    const orderPayload = {
      id: testOrderId,
      customer: "Kavish Naidoo",
      email: "Kavish.Naidoo@ZimThreads-Testing.mu",
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
          img: "https://res.cloudinary.com/qyuoyjju/image/upload/sample1.jpg",
        },
        {
          productId: "prod-acc-1",
          name: "Vintage Silver Chain Bracelet",
          price: 900,
          quantity: 1,
          size: "One Size",
          img: "https://res.cloudinary.com/qyuoyjju/image/upload/sample2.jpg",
        },
      ],
    }
    const orderRes = await callApi("POST", "/api/store", {
      action: "public_create",
      entity: "orders",
      record: orderPayload,
    })
    if (orderRes.statusCode !== 200 || !orderRes.data?.success) {
      throw new Error(`Live order creation failed: ${JSON.stringify(orderRes.data)}`)
    }
    createdRecords.orders.push(testOrderId)
    console.log(`✓ Live Order created successfully: ${testOrderId} (${orderRes.data.record.customer}, 2 items)`)

    // 3.3 Live Inquiry Submission
    const inquiryPayload = {
      id: testInquiryId,
      name: "Jean-Luc Fontaine",
      email: "JL.Fontaine@ZimThreads-Testing.mu",
      subject: "Bespoke Varsity Jacket Inquiry",
      message: "Requesting lead time and swatch samples for 5 custom embroidery varsity jackets.",
    }
    const inquiryRes = await callApi("POST", "/api/store", {
      action: "public_create",
      entity: "inquiries",
      record: inquiryPayload,
    })
    if (inquiryRes.statusCode !== 200 || !inquiryRes.data?.success) {
      throw new Error(`Live inquiry creation failed: ${JSON.stringify(inquiryRes.data)}`)
    }
    createdRecords.inquiries.push(testInquiryId)
    console.log(`✓ Live Inquiry created successfully: ${testInquiryId} (${inquiryRes.data.record.name})`)

    // -------------------------------------------------------------
    // PHASE 4: CLOUD RE-FETCH & HEAD-OF-ARRAY VERIFICATION
    // -------------------------------------------------------------
    console.log("\n[Phase 4] Cloud Re-Fetch (GET /api/store?key=all) & Schema Verification...")
    const fetchAllRes = await callApi("GET", "/api/store?key=all", null)
    if (fetchAllRes.statusCode !== 200 || !fetchAllRes.data?.success) {
      throw new Error(`Cloud re-fetch failed: HTTP ${fetchAllRes.statusCode}`)
    }
    const { bookings, orders, inquiries } = fetchAllRes.data.data

    // 4.1 Check Head of Array (Record MUST be index 0)
    console.log("\n-> Verifying Head-of-Array Placement (LIFO Prepend)...")
    if (!bookings || bookings.length === 0 || bookings[0].id !== testBookingId) {
      throw new Error(
        `Head-of-array assertion failed for bookings! Expected index 0 to be '${testBookingId}', got: '${bookings?.[0]?.id}'`,
      )
    }
    console.log(`✓ bookings[0] is '${testBookingId}' (Head-of-Array confirmed)`)

    if (!orders || orders.length === 0 || orders[0].id !== testOrderId) {
      throw new Error(
        `Head-of-array assertion failed for orders! Expected index 0 to be '${testOrderId}', got: '${orders?.[0]?.id}'`,
      )
    }
    console.log(`✓ orders[0] is '${testOrderId}' (Head-of-Array confirmed)`)

    if (!inquiries || inquiries.length === 0 || inquiries[0].id !== testInquiryId) {
      throw new Error(
        `Head-of-array assertion failed for inquiries! Expected index 0 to be '${testInquiryId}', got: '${inquiries?.[0]?.id}'`,
      )
    }
    console.log(`✓ inquiries[0] is '${testInquiryId}' (Head-of-Array confirmed)`)

    // 4.2 Deep Field Fidelity Checks
    console.log("\n-> Verifying Deep Data Integrity & Normalization...")
    const liveBooking = bookings[0]
    if (liveBooking.customer !== "Amara Patel") throw new Error("Booking customer mismatch")
    if (liveBooking.email !== "amara.patel@zimthreads-testing.mu") throw new Error("Booking email normalization failed (expected lowercase)")
    if (liveBooking.phone !== "+230 5712 9988") throw new Error("Booking phone mismatch")
    if (liveBooking.serviceId !== "custom") throw new Error("Booking serviceId mismatch")
    if (liveBooking.priceNumeric !== 1500) throw new Error("Booking priceNumeric mismatch")
    if (liveBooking.date !== "2026-11-15") throw new Error("Booking date mismatch")
    if (liveBooking.status !== "Pending") throw new Error("Booking initial status must be 'Pending'")
    console.log("✓ Live Booking fields verified with 100% fidelity")

    const liveOrder = orders[0]
    if (liveOrder.customer !== "Kavish Naidoo") throw new Error("Order customer mismatch")
    if (liveOrder.email !== "kavish.naidoo@zimthreads-testing.mu") throw new Error("Order email normalization failed (expected lowercase)")
    if (liveOrder.paymentMethod !== "Juice by MCB") throw new Error("Order paymentMethod mismatch")
    if (liveOrder.totalAmount !== 3750) throw new Error("Order totalAmount mismatch")
    if (liveOrder.status !== "Processing") throw new Error("Order initial status must be 'Processing'")
    if (!Array.isArray(liveOrder.items) || liveOrder.items.length !== 2) throw new Error("Order items array corrupted")
    if (liveOrder.items[0].customName !== "KAVISH-98") throw new Error("Order item customName missing or corrupted")
    console.log("✓ Live Order fields & nested items verified with 100% fidelity")

    const liveInquiry = inquiries[0]
    if (liveInquiry.name !== "Jean-Luc Fontaine") throw new Error("Inquiry name mismatch")
    if (liveInquiry.email !== "jl.fontaine@zimthreads-testing.mu") throw new Error("Inquiry email normalization failed (expected lowercase)")
    if (liveInquiry.subject !== "Bespoke Varsity Jacket Inquiry") throw new Error("Inquiry subject mismatch")
    if (liveInquiry.read !== false) throw new Error("Inquiry read must default to false")
    console.log("✓ Live Inquiry fields verified with 100% fidelity")

    // -------------------------------------------------------------
    // PHASE 5: MULTI-SUBMISSION SUCCESSIVE PREPEND TEST
    // -------------------------------------------------------------
    console.log("\n[Phase 5] Multi-Submission Successive Prepend Ordering Test...")
    const testBooking2Id = `BK-CHALLENGE-2ND-${uniqueTag}`
    const booking2Payload = {
      id: testBooking2Id,
      customer: "Nasser Al-Mansoor",
      email: "nasser@zimthreads-testing.mu",
      phone: "+230 5111 2233",
      serviceId: "clean",
      serviceName: "DEEP CLEANING & SANITIZATION",
      price: "Rs 400",
      priceNumeric: 400,
    }
    const booking2Res = await callApi("POST", "/api/store", {
      action: "public_create",
      entity: "bookings",
      record: booking2Payload,
    })
    if (booking2Res.statusCode !== 200 || !booking2Res.data?.success) {
      throw new Error(`Second booking creation failed: ${JSON.stringify(booking2Res.data)}`)
    }
    createdRecords.bookings.push(testBooking2Id)

    // Query entity directly via key=bookings
    const singleKeyRes = await callApi("GET", "/api/store?key=bookings", null)
    if (singleKeyRes.statusCode !== 200 || !singleKeyRes.data?.data) {
      throw new Error("Direct key query GET /api/store?key=bookings failed")
    }
    const liveBookingsList = singleKeyRes.data.data
    if (liveBookingsList[0].id !== testBooking2Id || liveBookingsList[1].id !== testBookingId) {
      throw new Error(
        `Prepend ordering violated! Expected [${testBooking2Id}, ${testBookingId}], got: [${liveBookingsList[0]?.id}, ${liveBookingsList[1]?.id}]`,
      )
    }
    console.log(`✓ LIFO Prepend verified: index 0 is newest ('${testBooking2Id}'), index 1 is preceding ('${testBookingId}')`)

    // -------------------------------------------------------------
    // PHASE 6: AUTHENTICATED PRUNING / TEARDOWN & CLEAN STATE ASSERTION
    // -------------------------------------------------------------
    console.log("\n[Phase 6] Authenticated Record Pruning & DB Cleanliness Verification...")

    for (const [entity, idList] of Object.entries(createdRecords)) {
      for (const id of idList) {
        const delRes = await callApi("POST", "/api/store", {
          action: "delete_entity",
          adminToken: "Zimthreads200",
          entity,
          id,
        })
        if (delRes.statusCode !== 200 || !delRes.data?.success) {
          throw new Error(`Failed to delete challenge record ${entity}/${id}: ${JSON.stringify(delRes.data)}`)
        }
        console.log(`✓ Successfully pruned ${entity} record: ${id}`)
      }
    }

    // Post-cleanup audit: re-fetch all entities and verify absence
    console.log("\n-> Post-Cleanup Verification via GET /api/store?key=all...")
    const auditRes = await callApi("GET", "/api/store?key=all", null)
    if (auditRes.statusCode !== 200 || !auditRes.data?.success) {
      throw new Error("Audit re-fetch failed")
    }
    const auditData = auditRes.data.data
    for (const [entity, idList] of Object.entries(createdRecords)) {
      for (const id of idList) {
        const exists = auditData[entity]?.some((r) => r.id === id)
        if (exists) {
          throw new Error(`CRITICAL! Record ${id} was not properly pruned from ${entity}!`)
        }
      }
    }
    console.log("✓ Audit verified: All test records have been 100% excised from Neon PostgreSQL!")
    console.log("✓ Production database state restored to pristine condition.")

    console.log("\n=================================================================")
    console.log("   EMPIRICAL CHALLENGE COMPLETED: ALL TESTS PASSED WITH 100%     ")
    console.log("=================================================================")
    return true
  } catch (error) {
    console.error("\n❌ EMPIRICAL CHALLENGE FAILURE:", error)
    // Emergency cleanup attempt in case of failure mid-way
    console.log("\nAttempting emergency cleanup of test records...")
    for (const [entity, idList] of Object.entries(createdRecords)) {
      for (const id of idList) {
        try {
          await callApi("POST", "/api/store", {
            action: "delete_entity",
            adminToken: "Zimthreads200",
            entity,
            id,
          })
          console.log(`Emergency pruned ${entity} record: ${id}`)
        } catch {}
      }
    }
    throw error
  }
}

runEmpiricalChallenge()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
