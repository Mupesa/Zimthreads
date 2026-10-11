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

async function runTests() {
  console.log("=== STARTING MILESTONE 2 PERSISTENCE TEST ===")

  // 1. Test GET /api/store?key=all
  console.log("\n[Test 1] GET /api/store?key=all hydration check...")
  {
    const req = { method: "GET", url: "/api/store?key=all", query: { key: "all" } }
    const res = mockRes()
    await handler(req, res)
    if (res.statusCode !== 200 || !res.data?.success) {
      throw new Error(`GET /api/store failed: ${JSON.stringify(res.data)}`)
    }
    const entities = ["products", "services", "blog_posts", "settings", "bookings", "orders", "inquiries"]
    for (const ent of entities) {
      if (res.data.data[ent] === undefined) {
        throw new Error(`Entity missing from all hydration: ${ent}`)
      }
    }
    console.log("✓ All 7 entities present in cloud store response:")
    for (const ent of entities) {
      const val = res.data.data[ent]
      const count = Array.isArray(val) ? val.length : Object.keys(val || {}).length
      console.log(`   - ${ent}: ${Array.isArray(val) ? `array (${count} items)` : `object (${count} keys)`}`)
    }
  }

  // 2. Test Validation: Invalid email rejection on bookings
  console.log("\n[Test 2] Testing validation rejection for invalid email on bookings...")
  {
    const req = {
      method: "POST",
      body: {
        action: "public_create",
        entity: "bookings",
        record: {
          customer: "Invalid Tester",
          email: "not-an-email",
          phone: "+230 5513 2614",
          serviceId: "clean",
        },
      },
    }
    const res = mockRes()
    await handler(req, res)
    if (res.statusCode === 400 && res.data?.error?.includes("invalid email")) {
      console.log("✓ Rejection succeeded (HTTP 400):", res.data.error)
    } else {
      throw new Error(`Expected HTTP 400 rejection, got: ${res.statusCode} ${JSON.stringify(res.data)}`)
    }
  }

  // 3. Test Validation: Empty items rejection on orders
  console.log("\n[Test 3] Testing validation rejection for empty cart items on orders...")
  {
    const req = {
      method: "POST",
      body: {
        action: "public_create",
        entity: "orders",
        record: {
          customer: "Empty Cart Tester",
          email: "valid@zimthreads.com",
          phone: "+230 5513 2614",
          items: [],
        },
      },
    }
    const res = mockRes()
    await handler(req, res)
    if (res.statusCode === 400 && res.data?.error?.includes("at least one item")) {
      console.log("✓ Rejection succeeded (HTTP 400):", res.data.error)
    } else {
      throw new Error(`Expected HTTP 400 rejection, got: ${res.statusCode} ${JSON.stringify(res.data)}`)
    }
  }

  // 4. Test public_create for bookings
  const testBookingId = `BK-TEST-${Date.now().toString().slice(-4)}`
  console.log(`\n[Test 4] Submitting live public booking: ${testBookingId}...`)
  {
    const req = {
      method: "POST",
      body: {
        action: "public_create",
        entity: "bookings",
        record: {
          id: testBookingId,
          customer: "M2 Automated Verification Customer",
          email: "m2.verify@zimthreads.com",
          phone: "+230 5513 2614",
          serviceId: "restore",
          serviceName: "FULL RESTORATION & REDYES",
          price: "Rs 800",
          priceNumeric: 800,
          date: "2026-10-30",
          time: "14:00",
          notes: "Verification booking for M2",
        },
      },
    }
    const res = mockRes()
    await handler(req, res)
    if (res.statusCode !== 200 || !res.data?.success) {
      throw new Error(`public_create booking failed: ${JSON.stringify(res.data)}`)
    }
    console.log("✓ Booking created in Neon DB:", res.data.record.id, res.data.record.customer)
  }

  // 5. Test public_create for orders
  const testOrderId = `ORD-TEST-${Date.now().toString().slice(-4)}`
  console.log(`\n[Test 5] Submitting live public order: ${testOrderId}...`)
  {
    const req = {
      method: "POST",
      body: {
        action: "public_create",
        entity: "orders",
        record: {
          id: testOrderId,
          customer: "M2 Automated Verification Buyer",
          email: "buyer.verify@zimthreads.com",
          phone: "+230 5513 2614",
          address: "Royal Road",
          city: "Port Louis",
          paymentMethod: "Juice by MCB",
          totalAmount: 2850,
          items: [
            {
              productId: "prod-jacket-1",
              name: "1998 Repsol Honda CBR Archival Racing Jacket",
              price: 2850,
              quantity: 1,
              size: "XL",
              customName: "VERIFY",
              img: "https://res.cloudinary.com/qyuoyjju/image/upload/sample.jpg",
            },
          ],
        },
      },
    }
    const res = mockRes()
    await handler(req, res)
    if (res.statusCode !== 200 || !res.data?.success) {
      throw new Error(`public_create order failed: ${JSON.stringify(res.data)}`)
    }
    console.log("✓ Order created in Neon DB:", res.data.record.id, res.data.record.customer)
  }

  // 6. Test public_create for inquiries
  const testInquiryId = `INQ-TEST-${Date.now().toString().slice(-4)}`
  console.log(`\n[Test 6] Submitting live public inquiry: ${testInquiryId}...`)
  {
    const req = {
      method: "POST",
      body: {
        action: "public_create",
        entity: "inquiries",
        record: {
          id: testInquiryId,
          name: "M2 Inquirer",
          email: "inquirer.verify@zimthreads.com",
          subject: "Verification of Contact Form",
          message: "Automated test verifying public_create contact flow.",
        },
      },
    }
    const res = mockRes()
    await handler(req, res)
    if (res.statusCode !== 200 || !res.data?.success) {
      throw new Error(`public_create inquiry failed: ${JSON.stringify(res.data)}`)
    }
    console.log("✓ Inquiry created in Neon DB:", res.data.record.id, res.data.record.name)
  }

  // 7. Verify all three records persist into Neon DB and are returned by GET /api/store?key=all
  console.log("\n[Test 7] Verifying live persistence via re-fetching all entities...")
  {
    const req = { method: "GET", url: "/api/store?key=all", query: { key: "all" } }
    const res = mockRes()
    await handler(req, res)
    if (res.statusCode !== 200 || !res.data?.success) {
      throw new Error(`Re-fetch failed: ${JSON.stringify(res.data)}`)
    }

    const { bookings, orders, inquiries } = res.data.data
    const foundBooking = bookings.find((b) => b.id === testBookingId)
    const foundOrder = orders.find((o) => o.id === testOrderId)
    const foundInquiry = inquiries.find((i) => i.id === testInquiryId)

    if (!foundBooking) throw new Error(`Test booking ${testBookingId} not found in Neon DB!`)
    if (!foundOrder) throw new Error(`Test order ${testOrderId} not found in Neon DB!`)
    if (!foundInquiry) throw new Error(`Test inquiry ${testInquiryId} not found in Neon DB!`)

    console.log("✓ All 3 records successfully retrieved from Neon DB!")
    console.log(`   - Verified Booking: ${foundBooking.id} (${foundBooking.serviceName}, ${foundBooking.price})`)
    console.log(`   - Verified Order: ${foundOrder.id} (${foundOrder.items.length} items, Rs ${foundOrder.totalAmount})`)
    console.log(`   - Verified Inquiry: ${foundInquiry.id} (${foundInquiry.subject})`)
  }

  // 8. Clean up test records via authenticated delete_entity
  console.log("\n[Test 8] Cleaning up test records from Neon DB...")
  for (const [entity, id] of [
    ["bookings", testBookingId],
    ["orders", testOrderId],
    ["inquiries", testInquiryId],
  ]) {
    const req = {
      method: "POST",
      body: {
        action: "delete_entity",
        adminToken: "Zimthreads200",
        entity,
        id,
      },
    }
    const res = mockRes()
    await handler(req, res)
    if (res.statusCode !== 200) {
      console.warn(`Warning: failed to delete test record ${id}:`, res.data)
    } else {
      console.log(`✓ Cleaned up test ${entity} record: ${id}`)
    }
  }

  console.log("\n=== ALL PERSISTENCE AND REVALIDATION TESTS PASSED CLEANLY! ===")
}

runTests().catch((err) => {
  console.error("Test error:", err)
  process.exit(1)
})
