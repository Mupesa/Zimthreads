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

async function runMilestone3Verification() {
  console.log("=== STARTING MILESTONE 3 ADMIN CRUD PERSISTENCE VERIFICATION ===")

  // 1. Initial Hydration Check
  console.log("\n[Test 1] Hydrating full store from Neon DB...")
  let storeData
  {
    const req = { method: "GET", url: "/api/store?key=all", query: { key: "all" } }
    const res = mockRes()
    await handler(req, res)
    if (res.statusCode !== 200 || !res.data?.success) {
      throw new Error(`Failed to fetch store data: ${JSON.stringify(res.data)}`)
    }
    storeData = res.data.data
    console.log("✓ Store successfully hydrated from Neon DB:")
    console.log(`  - Products: ${storeData.products.length}`)
    console.log(`  - Services: ${storeData.services.length}`)
    console.log(`  - Blog Posts: ${storeData.blog_posts.length}`)
    console.log(`  - Bookings: ${storeData.bookings.length}`)
    console.log(`  - Orders: ${storeData.orders.length}`)
    console.log(`  - Inquiries: ${storeData.inquiries.length}`)
  }

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

  // 2. Bookings Desk: Walk-in Booking CRUD Persistence
  console.log("\n[Test 2] Bookings Desk: Walk-in Booking CRUD...")
  const testBookingId = `BK-M3-${Date.now().toString().slice(-4)}`
  const testBooking = {
    id: testBookingId,
    customer: "M3 Admin Walk-in Test Client",
    email: "walkin@example.com",
    phone: "+230 5123 4567",
    serviceId: "clean",
    serviceName: "SIGNATURE SNEAKER DEEP CLEAN",
    price: "From Rs 300",
    priceNumeric: 300,
    date: new Date().toISOString().split("T")[0],
    time: "14:00",
    notes: "Walk-in client test booking",
    status: "Pending",
  }

  {
    const updatedBookings = [testBooking, ...storeData.bookings]
    await adminSync("bookings", updatedBookings)
    console.log(`✓ Walk-in booking ${testBookingId} created and synced to Neon DB`)
  }

  // Update booking status
  {
    const updatedBookings = [
      { ...testBooking, status: "Confirmed" },
      ...storeData.bookings,
    ]
    await adminSync("bookings", updatedBookings)
    console.log(`✓ Booking ${testBookingId} status updated to "Confirmed" in Neon DB`)
  }

  // 3. Orders Desk: Payment Status CRUD Persistence
  console.log("\n[Test 3] Orders Desk: Payment Status Persistence...")
  const testOrderId = `ORD-M3-${Date.now().toString().slice(-4)}`
  const testOrder = {
    id: testOrderId,
    customer: "M3 Admin Test Buyer",
    email: "buyer@example.com",
    phone: "+230 5987 6543",
    address: "Grand Baie, Mauritius",
    city: "Grand Baie",
    items: [
      {
        id: "prod-test",
        name: "Test Sneaker Clean Kit",
        price: 450,
        quantity: 2,
        img: "https://example.com/img.jpg",
      },
    ],
    totalAmount: 900,
    status: "Processing",
    paymentStatus: "Pending",
    paymentMethod: "Juice / MCB Transfer",
    date: new Date().toISOString().split("T")[0],
  }

  {
    const updatedOrders = [testOrder, ...storeData.orders]
    await adminSync("orders", updatedOrders)
    console.log(`✓ Order ${testOrderId} created with paymentStatus "Pending"`)
  }

  {
    const updatedOrders = [
      { ...testOrder, paymentStatus: "Paid" },
      ...storeData.orders,
    ]
    await adminSync("orders", updatedOrders)
    console.log(`✓ Order ${testOrderId} paymentStatus updated to "Paid" in Neon DB`)
  }

  // 4. Inquiries Desk: Response Logging & Read Status
  console.log("\n[Test 4] Inquiries Desk: Response Logging & Read Status...")
  const testInquiryId = `INQ-M3-${Date.now().toString().slice(-4)}`
  const testInquiry = {
    id: testInquiryId,
    name: "M3 Inquiring Customer",
    email: "inquiry@example.com",
    subject: "Custom Suede Restoration Query",
    message: "Can you restore vintage blue suede Jordans?",
    date: new Date().toISOString().split("T")[0],
    read: false,
  }

  {
    const updatedInquiries = [testInquiry, ...storeData.inquiries]
    await adminSync("inquiries", updatedInquiries)
    console.log(`✓ Inquiry ${testInquiryId} created with unread status`)
  }

  {
    const staffResponse = "Yes, we specialize in vintage suede nap restoration and color re-dyes."
    const respondedAt = new Date().toISOString()
    const updatedInquiries = [
      {
        ...testInquiry,
        read: true,
        response: staffResponse,
        respondedAt: respondedAt,
      },
      ...storeData.inquiries,
    ]
    await adminSync("inquiries", updatedInquiries)
    console.log(`✓ Inquiry ${testInquiryId} responded with staff message & timestamp: ${respondedAt}`)
  }

  // 5. Products Desk: Batch Updates & Persistence
  console.log("\n[Test 5] Products Desk: Batch Updates & Persistence...")
  const testProductId = `prod-m3-test-${Date.now().toString().slice(-4)}`
  const testProduct = {
    id: testProductId,
    name: "M3 Test Sneaker Care Balm",
    category: "Cleaning",
    price: 350,
    stock: 25,
    img: "https://example.com/balm.jpg",
    alt: "Balm",
    description: "Premium leather conditioning balm",
    featured: false,
    hidden: false,
  }

  {
    const updatedProducts = [testProduct, ...storeData.products]
    await adminSync("products", updatedProducts)
    console.log(`✓ Product ${testProductId} added to catalog`)
  }

  {
    const updatedProducts = [
      { ...testProduct, price: 399, stock: 50 },
      ...storeData.products,
    ]
    await adminSync("products", updatedProducts)
    console.log(`✓ Product ${testProductId} price updated to Rs 399 and stock to 50 in Neon DB`)
  }

  // 6. Services Desk: Active Toggle & Turnaround Persistence
  console.log("\n[Test 6] Services Desk: Active Toggle & Turnaround...")
  const testServiceId = `srv-m3-${Date.now().toString().slice(-4)}`
  const testService = {
    id: testServiceId,
    title: "M3 BESPOKE PATINA SERVICE",
    subtitle: "Custom leather dyeing",
    price: "From Rs 850",
    priceNumeric: 850,
    desc: "Bespoke hand-applied shoe patina and burnishing.",
    features: ["Hand-burnished leather", "Custom dye mix", "Wax sealing"],
    turnaround: "48-72 Hours",
    img: "https://example.com/patina.jpg",
    alt: "Patina Service",
    active: true,
  }

  {
    const updatedServices = [testService, ...storeData.services]
    await adminSync("services", updatedServices)
    console.log(`✓ Service ${testServiceId} created with turnaround "48-72 Hours"`)
  }

  {
    const updatedServices = [
      { ...testService, active: false },
      ...storeData.services,
    ]
    await adminSync("services", updatedServices)
    console.log(`✓ Service ${testServiceId} toggled to active: false in Neon DB`)
  }

  // 7. Blog Posts Desk: Draft / Published Status
  console.log("\n[Test 7] Blog Posts Desk: Draft / Published Status...")
  const testBlogId = `blog-m3-${Date.now().toString().slice(-4)}`
  const testBlog = {
    id: testBlogId,
    title: "M3 Behind The Craft: Suede Care Secrets",
    category: "Restoration Guide",
    author: "Shepherd Chara",
    date: "Oct 11, 2026",
    readTime: "4 min read",
    img: "https://example.com/blog.jpg",
    alt: "Craft",
    excerpt: "The ultimate insider guide to sneaker suede preservation.",
    content: "Full markdown guide on suede brush techniques and brass bristles...",
    status: "draft",
  }

  {
    const updatedBlogs = [testBlog, ...storeData.blog_posts]
    await adminSync("blog_posts", updatedBlogs)
    console.log(`✓ Blog article ${testBlogId} created with status: "draft"`)
  }

  {
    const updatedBlogs = [
      { ...testBlog, status: "published" },
      ...storeData.blog_posts,
    ]
    await adminSync("blog_posts", updatedBlogs)
    console.log(`✓ Blog article ${testBlogId} status toggled to "published" in Neon DB`)
  }

  // 8. Store Settings Desk: Announcement Banner Text
  console.log("\n[Test 8] Store Settings Desk: Announcement Banner...")
  const announcementMsg = "ZIMTHREADS EXCLUSIVE: Complimentary Sneaker Deodorizing on All Walk-in Bookings!"
  {
    const updatedSettings = {
      ...storeData.settings,
      announcementText: announcementMsg,
    }
    await adminSync("settings", updatedSettings)
    console.log(`✓ Store announcement text updated and persisted: "${announcementMsg}"`)
  }

  // 9. Re-fetch and verify all changes in Neon DB
  console.log("\n[Test 9] Re-fetching all entities to verify live Neon persistence...")
  {
    const req = { method: "GET", url: "/api/store?key=all", query: { key: "all" } }
    const res = mockRes()
    await handler(req, res)
    if (res.statusCode !== 200 || !res.data?.success) {
      throw new Error(`Failed to re-fetch store data: ${JSON.stringify(res.data)}`)
    }
    const fresh = res.data.data

    const verifiedBooking = fresh.bookings.find((b) => b.id === testBookingId)
    if (!verifiedBooking || verifiedBooking.status !== "Confirmed" || verifiedBooking.priceNumeric !== 300) {
      throw new Error(`Booking verification failed: ${JSON.stringify(verifiedBooking)}`)
    }
    console.log(`✓ Verified Booking in Neon: ${verifiedBooking.id} (Status: ${verifiedBooking.status}, Rs ${verifiedBooking.priceNumeric})`)

    const verifiedOrder = fresh.orders.find((o) => o.id === testOrderId)
    if (!verifiedOrder || verifiedOrder.paymentStatus !== "Paid") {
      throw new Error(`Order payment status verification failed: ${JSON.stringify(verifiedOrder)}`)
    }
    console.log(`✓ Verified Order in Neon: ${verifiedOrder.id} (Payment: ${verifiedOrder.paymentStatus}, Rs ${verifiedOrder.totalAmount})`)

    const verifiedInquiry = fresh.inquiries.find((i) => i.id === testInquiryId)
    if (!verifiedInquiry || !verifiedInquiry.response || !verifiedInquiry.respondedAt) {
      throw new Error(`Inquiry response verification failed: ${JSON.stringify(verifiedInquiry)}`)
    }
    console.log(`✓ Verified Inquiry in Neon: ${verifiedInquiry.id} (Response: "${verifiedInquiry.response}", RespondedAt: ${verifiedInquiry.respondedAt})`)

    const verifiedProduct = fresh.products.find((p) => p.id === testProductId)
    if (!verifiedProduct || verifiedProduct.price !== 399 || verifiedProduct.stock !== 50) {
      throw new Error(`Product batch update verification failed: ${JSON.stringify(verifiedProduct)}`)
    }
    console.log(`✓ Verified Product in Neon: ${verifiedProduct.id} (Price: Rs ${verifiedProduct.price}, Stock: ${verifiedProduct.stock})`)

    const verifiedService = fresh.services.find((s) => s.id === testServiceId)
    if (!verifiedService || verifiedService.active !== false || verifiedService.turnaround !== "48-72 Hours") {
      throw new Error(`Service verification failed: ${JSON.stringify(verifiedService)}`)
    }
    console.log(`✓ Verified Service in Neon: ${verifiedService.id} (Active: ${verifiedService.active}, Turnaround: ${verifiedService.turnaround})`)

    const verifiedBlog = fresh.blog_posts.find((b) => b.id === testBlogId)
    if (!verifiedBlog || verifiedBlog.status !== "published") {
      throw new Error(`Blog post verification failed: ${JSON.stringify(verifiedBlog)}`)
    }
    console.log(`✓ Verified Blog Post in Neon: ${verifiedBlog.id} (Status: ${verifiedBlog.status})`)

    if (fresh.settings.announcementText !== announcementMsg) {
      throw new Error(`Settings announcementText verification failed: ${fresh.settings.announcementText}`)
    }
    console.log(`✓ Verified Settings announcementText in Neon: "${fresh.settings.announcementText}"`)
  }

  // 10. Clean up test records
  console.log("\n[Test 10] Cleaning up test records from Neon DB...")
  {
    await adminSync("bookings", storeData.bookings)
    await adminSync("orders", storeData.orders)
    await adminSync("inquiries", storeData.inquiries)
    await adminSync("products", storeData.products)
    await adminSync("services", storeData.services)
    await adminSync("blog_posts", storeData.blog_posts)
    await adminSync("settings", { ...storeData.settings, announcementText: announcementMsg })

    console.log("✓ Test records cleaned up cleanly from Neon DB!")
  }

  console.log("\n=== ALL MILESTONE 3 ADMIN CRUD PERSISTENCE TESTS PASSED CLEANLY! ===")
}

runMilestone3Verification().catch((err) => {
  console.error("FATAL VERIFICATION ERROR:", err)
  process.exit(1)
})
