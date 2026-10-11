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

async function runAdversarialStressTest() {
  console.log("=== STARTING MILESTONE 3 ADVERSARIAL STRESS TEST ===")

  // Helper for admin sync
  const adminSync = async (key, data) => {
    const req = {
      method: "POST",
      body: {
        action: "sync",
        key,
        data,
        adminToken: "Zimthreads200",
      },
    }
    const res = mockRes()
    await handler(req, res)
    if (res.statusCode !== 200 || !res.data?.success) {
      throw new Error(`Admin sync failed for ${key}: ${JSON.stringify(res.data)}`)
    }
    return res.data
  }

  // 1. Initial State Snapshot
  const initialReq = { method: "GET", url: "/api/store?key=all", query: { key: "all" } }
  const initialRes = mockRes()
  await handler(initialReq, initialRes)
  if (initialRes.statusCode !== 200 || !initialRes.data?.success) {
    throw new Error("Failed to snapshot store state")
  }
  const snapshot = initialRes.data.data

  // Challenge 1: Special Characters and Multiline Staff Inquiries Response
  console.log("\n[Stress 1] Inquiries: Complex Multiline & Emoji Response...")
  const complexInquiryId = `INQ-ADV-${Date.now().toString().slice(-4)}`
  const complexResponse = `Dear Customer,\n\nWe confirm restoration of vintage suede! ✨👟\nCost: Rs 850 (including nano-repel coating & deodorizing).\n\nBest regards,\nShepherd — Zimthreads Studio Atelier`
  
  const testInquiry = {
    id: complexInquiryId,
    name: "Adversarial Client 'O'Connor & Co.'",
    email: "oconnor+adv@test.mu",
    subject: "Special Suede & Nubuck Question <script>alert(1)</script>",
    message: "Does your workshop clean nubuck with brass bristle brushes?",
    date: new Date().toISOString().split("T")[0],
    read: true,
    response: complexResponse,
    respondedAt: new Date().toISOString(),
  }

  await adminSync("inquiries", [testInquiry, ...snapshot.inquiries])

  // Verify Inquiry
  {
    const req = { method: "GET", url: "/api/store?key=inquiries", query: { key: "inquiries" } }
    const res = mockRes()
    await handler(req, res)
    const inq = res.data.data.find((i) => i.id === complexInquiryId)
    if (!inq || inq.response !== complexResponse) {
      throw new Error(`Inquiry response corrupted or missing: ${JSON.stringify(inq)}`)
    }
    console.log("✓ Inquiries complex response verified intact with multiline formatting and unicode emojis.")
  }

  // Challenge 2: Refunded & Cancelled Order State Transition
  console.log("\n[Stress 2] Orders: Refunded Payment & Cancelled Status Transition...")
  const advOrderId = `ORD-ADV-${Date.now().toString().slice(-4)}`
  const testOrder = {
    id: advOrderId,
    customer: "Cancelled Buyer",
    email: "cancelled@test.mu",
    phone: "+230 5777 8888",
    address: "Cybercity, Ebene",
    city: "Ebene",
    items: [
      {
        id: "prod-jacket-1",
        name: "Vintage Castrol Racing Blouson",
        price: 3600,
        quantity: 1,
        size: "L",
        img: "https://example.com/jacket1.jpg",
      },
    ],
    totalAmount: 3600,
    status: "Cancelled",
    paymentStatus: "Refunded",
    paymentMethod: "Juice / MCB Transfer",
    date: new Date().toISOString().split("T")[0],
  }

  await adminSync("orders", [testOrder, ...snapshot.orders])

  // Verify Order
  {
    const req = { method: "GET", url: "/api/store?key=orders", query: { key: "orders" } }
    const res = mockRes()
    await handler(req, res)
    const ord = res.data.data.find((o) => o.id === advOrderId)
    if (!ord || ord.status !== "Cancelled" || ord.paymentStatus !== "Refunded") {
      throw new Error(`Order status mismatch: ${JSON.stringify(ord)}`)
    }
    console.log(`✓ Order ${advOrderId} persisted with status 'Cancelled' and paymentStatus 'Refunded'.`)
  }

  // Challenge 3: Parallel Concurrent Admin Syncs
  console.log("\n[Stress 3] Concurrency: Parallel adminSync across 3 distinct keys...")
  const updatedSettings = {
    ...snapshot.settings,
    announcementText: "CONCURRENCY STRESS TEST ANNOUNCEMENT ⚡ LIVE",
  }
  const updatedServices = snapshot.services.map((s, idx) =>
    idx === 0 ? { ...s, turnaround: "Same Day (Express)" } : s,
  )

  await Promise.all([
    adminSync("settings", updatedSettings),
    adminSync("services", updatedServices),
  ])

  // Verify concurrent writes
  {
    const req = { method: "GET", url: "/api/store?key=all", query: { key: "all" } }
    const res = mockRes()
    await handler(req, res)
    const fresh = res.data.data
    if (fresh.settings.announcementText !== updatedSettings.announcementText) {
      throw new Error("Concurrent write failed for settings")
    }
    if (fresh.services[0].turnaround !== "Same Day (Express)") {
      throw new Error("Concurrent write failed for services")
    }
    console.log("✓ Parallel admin sync operations persisted concurrently without race conflicts.")
  }

  // Clean Up
  console.log("\n[Cleanup] Reverting adversarial test state...")
  await adminSync("inquiries", snapshot.inquiries)
  await adminSync("orders", snapshot.orders)
  await adminSync("settings", snapshot.settings)
  await adminSync("services", snapshot.services)
  console.log("✓ State reverted successfully.")

  console.log("\n=== ALL ADVERSARIAL STRESS TESTS COMPLETED SUCCESSFULLY! ===")
}

runAdversarialStressTest().catch((err) => {
  console.error("ADVERSARIAL STRESS TEST FAILED:", err)
  process.exit(1)
})
