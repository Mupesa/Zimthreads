/**
 * Challenger Test Harness: Milestone 1
 * Empirical verification of api/store.ts and live Neon DB (rapid-hill-42448439)
 */

import handler, { executeSql } from "../api/store.ts";

const NEON_CONN =
  process.env.NEON_DATABASE_URL ||
  "postgresql://neondb_owner:npg_DR0tIYcQyeX8@ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";
const NEON_HOST = "ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech";

// Test Result Tracker
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function record(name, passed, details = "") {
  if (passed) {
    results.passed++;
    console.log(`  [PASS] ${name}`);
    results.tests.push({ name, status: "PASS", details });
  } else {
    results.failed++;
    console.error(`  [FAIL] ${name}: ${details}`);
    results.tests.push({ name, status: "FAIL", details });
  }
}

// Request Simulator for api/store.ts handler
function invokeApi(method, { query = {}, body = null, headers = {} } = {}) {
  return new Promise(async (resolve, reject) => {
    let statusCode = 200;
    const resHeaders = {};
    let responseData = null;
    let ended = false;

    const req = {
      method,
      query,
      body,
      headers: { ...headers },
      url: `/api/store?${new URLSearchParams(query).toString()}`,
    };

    const res = {
      setHeader(k, v) {
        resHeaders[k.toLowerCase()] = v;
      },
      status(c) {
        statusCode = c;
        return this;
      },
      json(data) {
        responseData = data;
        ended = true;
        resolve({ status: statusCode, headers: resHeaders, data });
        return this;
      },
      end(data) {
        if (!ended) {
          ended = true;
          resolve({ status: statusCode, headers: resHeaders, data });
        }
        return this;
      },
    };

    try {
      await handler(req, res);
    } catch (err) {
      reject(err);
    }
  });
}

// Direct SQL query helper
async function queryNeon(sql, params = []) {
  return await executeSql(sql, params);
}

async function run() {
  console.log("==================================================================");
  console.log("CHALLENGER 1 EMPIRICAL HARNESS: MILESTONE 1");
  console.log("Target Neon DB: rapid-hill-42448439 (ep-icy-brook-b4bmxdh6-pooler)");
  console.log("==================================================================\n");

  const cleanupIds = {
    bookings: [],
    orders: [],
    inquiries: [],
  };

  try {
    // -------------------------------------------------------------------------
    // SUITE 1: Baseline Neon DB Schema & Entities Check
    // -------------------------------------------------------------------------
    console.log("SUITE 1: Baseline Neon DB Schema & Entities Check");
    const baselineRows = await queryNeon(
      "SELECT key, jsonb_typeof(data) as type, CASE WHEN jsonb_typeof(data)='array' THEN jsonb_array_length(data) ELSE 1 END as count FROM public.zimthreads_store ORDER BY key;"
    );

    const keyMap = new Map(baselineRows.map((r) => [r.key, r]));
    const expectedKeys = [
      "blog_posts",
      "bookings",
      "inquiries",
      "orders",
      "products",
      "services",
      "settings",
    ];

    const allKeysPresent = expectedKeys.every((k) => keyMap.has(k));
    record("1.1 All 7 primary keys exist in public.zimthreads_store", allKeysPresent, `Found keys: ${Array.from(keyMap.keys()).join(", ")}`);

    const productsCount = keyMap.get("products")?.count || 0;
    record("1.2 Catalog products seeded (expected >= 16)", productsCount >= 16, `Product count: ${productsCount}`);

    const servicesCount = keyMap.get("services")?.count || 0;
    record("1.3 Services catalog seeded (expected >= 7)", servicesCount >= 7, `Services count: ${servicesCount}`);

    const blogPostsCount = keyMap.get("blog_posts")?.count || 0;
    record("1.4 Blog posts catalog seeded (expected >= 5)", blogPostsCount >= 5, `Blog posts count: ${blogPostsCount}`);

    const settingsType = keyMap.get("settings")?.type;
    record("1.5 Settings stored as JSON object", settingsType === "object", `Settings type: ${settingsType}`);

    // -------------------------------------------------------------------------
    // SUITE 2: Public Create - Bookings Persistence & Head Array Guarantee
    // -------------------------------------------------------------------------
    console.log("\nSUITE 2: Public Create - Bookings");
    const bookingPayload = {
      action: "public_create",
      entity: "bookings",
      record: {
        customer: "Empirical Challenger Alpha",
        email: "challenger.alpha@zimthreads.com",
        phone: "+230 5234 5678",
        serviceId: "restoration-deep-clean",
        serviceName: "Complete Restoration & Deep Clean",
        price: "Rs 650",
        priceNumeric: 650,
        date: "2026-10-25",
        time: "11:00",
        notes: "Milestone 1 Empirical Challenger Booking Test",
      },
    };

    const bookingRes = await invokeApi("POST", { body: bookingPayload });
    record("2.1 public_create booking returns HTTP 200", bookingRes.status === 200, `Status: ${bookingRes.status}`);
    record("2.2 public_create booking response success=true and contains ID", bookingRes.data?.success === true && typeof bookingRes.data?.record?.id === "string" && bookingRes.data.record.id.startsWith("BK-"), `ID: ${bookingRes.data?.record?.id}`);

    const createdBookingId = bookingRes.data?.record?.id;
    if (createdBookingId) cleanupIds.bookings.push(createdBookingId);

    // Verify Neon DB direct query
    const dbBookingRows = await queryNeon("SELECT data FROM public.zimthreads_store WHERE key = 'bookings';");
    const dbBookings = dbBookingRows[0]?.data || [];
    const bookingAtHead = Array.isArray(dbBookings) && dbBookings[0]?.id === createdBookingId;
    record("2.3 Created booking is directly persisted at head (index 0) of Neon DB bookings array", bookingAtHead, `Index 0 ID: ${dbBookings[0]?.id}, Expected: ${createdBookingId}`);

    // Verify GET /api/store?key=all
    const getAllRes = await invokeApi("GET", { query: { key: "all" } });
    const getAllBookingsHead = getAllRes.data?.data?.bookings?.[0]?.id === createdBookingId;
    record("2.4 GET /api/store?key=all returns created booking at index 0", getAllBookingsHead, `Head ID: ${getAllRes.data?.data?.bookings?.[0]?.id}`);

    // Verify GET /api/store?key=bookings
    const getBookingRes = await invokeApi("GET", { query: { key: "bookings" } });
    const getBookingHead = getBookingRes.data?.data?.[0]?.id === createdBookingId;
    record("2.5 GET /api/store?key=bookings returns created booking at index 0", getBookingHead, `Head ID: ${getBookingRes.data?.data?.[0]?.id}`);

    // -------------------------------------------------------------------------
    // SUITE 3: Public Create - Orders Persistence & Head Array Guarantee
    // -------------------------------------------------------------------------
    console.log("\nSUITE 3: Public Create - Orders");
    const orderPayload = {
      action: "public_create",
      entity: "orders",
      record: {
        customer: "Empirical Buyer Beta",
        email: "buyer.beta@zimthreads.com",
        phone: "+230 5987 6543",
        address: "24 Cybercity Boulevard, Ebene",
        city: "Ebene",
        paymentMethod: "Juice by MCB",
        totalAmount: 4500,
        items: [
          {
            id: "racing-jacket-01",
            name: "Repsol Honda Vintage Racing Jacket",
            price: "Rs 4,500",
            quantity: 1,
            size: "L",
          },
        ],
      },
    };

    const orderRes = await invokeApi("POST", { body: orderPayload });
    record("3.1 public_create order returns HTTP 200", orderRes.status === 200, `Status: ${orderRes.status}`);
    record("3.2 public_create order response success=true and contains ID", orderRes.data?.success === true && typeof orderRes.data?.record?.id === "string" && orderRes.data.record.id.startsWith("ORD-"), `ID: ${orderRes.data?.record?.id}`);

    const createdOrderId = orderRes.data?.record?.id;
    if (createdOrderId) cleanupIds.orders.push(createdOrderId);

    // Verify Neon DB direct query
    const dbOrderRows = await queryNeon("SELECT data FROM public.zimthreads_store WHERE key = 'orders';");
    const dbOrders = dbOrderRows[0]?.data || [];
    const orderAtHead = Array.isArray(dbOrders) && dbOrders[0]?.id === createdOrderId;
    record("3.3 Created order is directly persisted at head (index 0) of Neon DB orders array", orderAtHead, `Index 0 ID: ${dbOrders[0]?.id}, Expected: ${createdOrderId}`);

    // Verify GET /api/store?key=all
    const getAllOrdersRes = await invokeApi("GET", { query: { key: "all" } });
    const getAllOrdersHead = getAllOrdersRes.data?.data?.orders?.[0]?.id === createdOrderId;
    record("3.4 GET /api/store?key=all returns created order at index 0", getAllOrdersHead, `Head ID: ${getAllOrdersRes.data?.data?.orders?.[0]?.id}`);

    // Verify GET /api/store?key=orders
    const getOrderRes = await invokeApi("GET", { query: { key: "orders" } });
    const getOrderHead = getOrderRes.data?.data?.[0]?.id === createdOrderId;
    record("3.5 GET /api/store?key=orders returns created order at index 0", getOrderHead, `Head ID: ${getOrderRes.data?.data?.[0]?.id}`);

    // -------------------------------------------------------------------------
    // SUITE 4: Public Create - Inquiries Persistence & Head Array Guarantee
    // -------------------------------------------------------------------------
    console.log("\nSUITE 4: Public Create - Inquiries");
    const inquiryPayload = {
      action: "public_create",
      entity: "inquiries",
      record: {
        name: "Empirical Inquirer Gamma",
        email: "gamma.inquiry@zimthreads.com",
        subject: "Sizing for Vintage Marlboro Leather Jacket",
        message: "Hello Zimthreads, could you confirm chest width and sleeve length? Thanks!",
      },
    };

    const inquiryRes = await invokeApi("POST", { body: inquiryPayload });
    record("4.1 public_create inquiry returns HTTP 200", inquiryRes.status === 200, `Status: ${inquiryRes.status}`);
    record("4.2 public_create inquiry response success=true and contains ID", inquiryRes.data?.success === true && typeof inquiryRes.data?.record?.id === "string" && inquiryRes.data.record.id.startsWith("INQ-"), `ID: ${inquiryRes.data?.record?.id}`);

    const createdInquiryId = inquiryRes.data?.record?.id;
    if (createdInquiryId) cleanupIds.inquiries.push(createdInquiryId);

    // Verify Neon DB direct query
    const dbInquiryRows = await queryNeon("SELECT data FROM public.zimthreads_store WHERE key = 'inquiries';");
    const dbInquiries = dbInquiryRows[0]?.data || [];
    const inquiryAtHead = Array.isArray(dbInquiries) && dbInquiries[0]?.id === createdInquiryId;
    record("4.3 Created inquiry is directly persisted at head (index 0) of Neon DB inquiries array", inquiryAtHead, `Index 0 ID: ${dbInquiries[0]?.id}, Expected: ${createdInquiryId}`);

    // Verify GET /api/store?key=all
    const getAllInquiriesRes = await invokeApi("GET", { query: { key: "all" } });
    const getAllInquiriesHead = getAllInquiriesRes.data?.data?.inquiries?.[0]?.id === createdInquiryId;
    record("4.4 GET /api/store?key=all returns created inquiry at index 0", getAllInquiriesHead, `Head ID: ${getAllInquiriesRes.data?.data?.inquiries?.[0]?.id}`);

    // Verify GET /api/store?key=inquiries
    const getInquiryRes = await invokeApi("GET", { query: { key: "inquiries" } });
    const getInquiryHead = getInquiryRes.data?.data?.[0]?.id === createdInquiryId;
    record("4.5 GET /api/store?key=inquiries returns created inquiry at index 0", getInquiryHead, `Head ID: ${getInquiryRes.data?.data?.[0]?.id}`);

    // -------------------------------------------------------------------------
    // SUITE 5: Adversarial Boundary & Validation Negative Tests
    // -------------------------------------------------------------------------
    console.log("\nSUITE 5: Adversarial Boundary & Validation Negative Tests");

    // 5.1 Booking missing customer
    const badBooking1 = await invokeApi("POST", {
      body: { action: "public_create", entity: "bookings", record: { email: "a@b.com", phone: "123", serviceId: "s1" } },
    });
    record("5.1 Rejects booking missing customer with HTTP 400", badBooking1.status === 400 && badBooking1.data?.error?.includes("customer"), `Status: ${badBooking1.status}, Error: ${badBooking1.data?.error}`);

    // 5.2 Booking invalid email
    const badBooking2 = await invokeApi("POST", {
      body: { action: "public_create", entity: "bookings", record: { customer: "Bob", email: "not-an-email", phone: "123", serviceId: "s1" } },
    });
    record("5.2 Rejects booking with invalid email with HTTP 400", badBooking2.status === 400 && badBooking2.data?.error?.includes("email"), `Status: ${badBooking2.status}, Error: ${badBooking2.data?.error}`);

    // 5.3 Booking missing phone
    const badBooking3 = await invokeApi("POST", {
      body: { action: "public_create", entity: "bookings", record: { customer: "Bob", email: "bob@zimthreads.com", serviceId: "s1" } },
    });
    record("5.3 Rejects booking missing phone with HTTP 400", badBooking3.status === 400 && badBooking3.data?.error?.includes("phone"), `Status: ${badBooking3.status}, Error: ${badBooking3.data?.error}`);

    // 5.4 Booking missing serviceId
    const badBooking4 = await invokeApi("POST", {
      body: { action: "public_create", entity: "bookings", record: { customer: "Bob", email: "bob@zimthreads.com", phone: "123" } },
    });
    record("5.4 Rejects booking missing serviceId with HTTP 400", badBooking4.status === 400 && badBooking4.data?.error?.includes("serviceId"), `Status: ${badBooking4.status}, Error: ${badBooking4.data?.error}`);

    // 5.5 Order missing customer
    const badOrder1 = await invokeApi("POST", {
      body: { action: "public_create", entity: "orders", record: { email: "a@b.com", phone: "123", items: [{ id: 1 }] } },
    });
    record("5.5 Rejects order missing customer with HTTP 400", badOrder1.status === 400 && badOrder1.data?.error?.includes("customer"), `Status: ${badOrder1.status}, Error: ${badOrder1.data?.error}`);

    // 5.6 Order invalid email
    const badOrder2 = await invokeApi("POST", {
      body: { action: "public_create", entity: "orders", record: { customer: "Sam", email: "bademail", phone: "123", items: [{ id: 1 }] } },
    });
    record("5.6 Rejects order with invalid email with HTTP 400", badOrder2.status === 400 && badOrder2.data?.error?.includes("email"), `Status: ${badOrder2.status}, Error: ${badOrder2.data?.error}`);

    // 5.7 Order empty items
    const badOrder3 = await invokeApi("POST", {
      body: { action: "public_create", entity: "orders", record: { customer: "Sam", email: "sam@zimthreads.com", phone: "123", items: [] } },
    });
    record("5.7 Rejects order with empty items array with HTTP 400", badOrder3.status === 400 && badOrder3.data?.error?.includes("item"), `Status: ${badOrder3.status}, Error: ${badOrder3.data?.error}`);

    // 5.8 Order non-array items
    const badOrder4 = await invokeApi("POST", {
      body: { action: "public_create", entity: "orders", record: { customer: "Sam", email: "sam@zimthreads.com", phone: "123", items: "not-an-array" } },
    });
    record("5.8 Rejects order with non-array items with HTTP 400", badOrder4.status === 400 && badOrder4.data?.error?.includes("item"), `Status: ${badOrder4.status}, Error: ${badOrder4.data?.error}`);

    // 5.9 Inquiry missing name
    const badInquiry1 = await invokeApi("POST", {
      body: { action: "public_create", entity: "inquiries", record: { email: "a@b.com", subject: "Sub", message: "Msg" } },
    });
    record("5.9 Rejects inquiry missing name with HTTP 400", badInquiry1.status === 400 && badInquiry1.data?.error?.includes("name"), `Status: ${badInquiry1.status}, Error: ${badInquiry1.data?.error}`);

    // 5.10 Inquiry invalid email
    const badInquiry2 = await invokeApi("POST", {
      body: { action: "public_create", entity: "inquiries", record: { name: "Alice", email: "not-an-email", subject: "Sub", message: "Msg" } },
    });
    record("5.10 Rejects inquiry with invalid email with HTTP 400", badInquiry2.status === 400 && badInquiry2.data?.error?.includes("email"), `Status: ${badInquiry2.status}, Error: ${badInquiry2.data?.error}`);

    // 5.11 Inquiry missing subject
    const badInquiry3 = await invokeApi("POST", {
      body: { action: "public_create", entity: "inquiries", record: { name: "Alice", email: "alice@zimthreads.com", message: "Msg" } },
    });
    record("5.11 Rejects inquiry missing subject with HTTP 400", badInquiry3.status === 400 && badInquiry3.data?.error?.includes("subject"), `Status: ${badInquiry3.status}, Error: ${badInquiry3.data?.error}`);

    // 5.12 Inquiry missing message
    const badInquiry4 = await invokeApi("POST", {
      body: { action: "public_create", entity: "inquiries", record: { name: "Alice", email: "alice@zimthreads.com", subject: "Sub" } },
    });
    record("5.12 Rejects inquiry missing message with HTTP 400", badInquiry4.status === 400 && badInquiry4.data?.error?.includes("message"), `Status: ${badInquiry4.status}, Error: ${badInquiry4.data?.error}`);

    // 5.13 Unauthorized entity: products
    const unauthEntity1 = await invokeApi("POST", {
      body: { action: "public_create", entity: "products", record: { title: "Hacked Product" } },
    });
    record("5.13 Rejects public_create for products with HTTP 400", unauthEntity1.status === 400, `Status: ${unauthEntity1.status}`);

    // 5.14 Unauthorized entity: settings
    const unauthEntity2 = await invokeApi("POST", {
      body: { action: "public_create", entity: "settings", record: { banner: "Hacked Banner" } },
    });
    record("5.14 Rejects public_create for settings with HTTP 400", unauthEntity2.status === 400, `Status: ${unauthEntity2.status}`);

    // 5.15 SQL Injection in entity field
    const sqliEntity = await invokeApi("POST", {
      body: { action: "public_create", entity: "bookings'; DROP TABLE zimthreads_store;--", record: { customer: "Evil" } },
    });
    record("5.15 Rejects SQL injection in entity parameter with HTTP 400", sqliEntity.status === 400, `Status: ${sqliEntity.status}`);

    // 5.16 Malformed JSON string in body
    const malformedJson = await invokeApi("POST", { body: "{ bad json: missing quotes" });
    record("5.16 Rejects malformed JSON string with HTTP 400", malformedJson.status === 400, `Status: ${malformedJson.status}`);

    // -------------------------------------------------------------------------
    // SUITE 6: Security Boundary & Authentication Tests
    // -------------------------------------------------------------------------
    console.log("\nSUITE 6: Security Boundary & Authentication Tests");

    // 6.1 Admin sync without token
    const unauthSync1 = await invokeApi("POST", { body: { action: "sync", key: "products", data: [] } });
    record("6.1 Admin sync without adminToken returns HTTP 401", unauthSync1.status === 401, `Status: ${unauthSync1.status}`);

    // 6.2 Admin sync with invalid token
    const unauthSync2 = await invokeApi("POST", { body: { action: "sync", adminToken: "invalid_pass", key: "products", data: [] } });
    record("6.2 Admin sync with invalid adminToken returns HTTP 401", unauthSync2.status === 401, `Status: ${unauthSync2.status}`);

    // 6.3 Admin update_entity without token
    const unauthUpdate = await invokeApi("POST", { body: { action: "update_entity", entity: "bookings", id: "123", updates: {} } });
    record("6.3 Admin update_entity without adminToken returns HTTP 401", unauthUpdate.status === 401, `Status: ${unauthUpdate.status}`);

    // 6.4 Admin delete_entity without token
    const unauthDelete = await invokeApi("POST", { body: { action: "delete_entity", entity: "bookings", id: "123" } });
    record("6.4 Admin delete_entity without adminToken returns HTTP 401", unauthDelete.status === 401, `Status: ${unauthDelete.status}`);

    // 6.5 Admin batch_update_products without token
    const unauthBatch = await invokeApi("POST", { body: { action: "batch_update_products", updates: [] } });
    record("6.5 Admin batch_update_products without adminToken returns HTTP 401", unauthBatch.status === 401, `Status: ${unauthBatch.status}`);

    // 6.6 Unsupported HTTP method (e.g. PUT)
    const unsupportedMethod = await invokeApi("PUT", { body: {} });
    record("6.6 Unsupported HTTP method returns HTTP 405", unsupportedMethod.status === 405, `Status: ${unsupportedMethod.status}`);

    // 6.7 OPTIONS request returns 200 with CORS headers
    const optionsRes = await invokeApi("OPTIONS", {});
    record("6.7 OPTIONS preflight returns HTTP 200 with CORS headers", optionsRes.status === 200 && optionsRes.headers["access-control-allow-origin"] === "*", `Status: ${optionsRes.status}`);

    // -------------------------------------------------------------------------
    // SUITE 7: High Concurrency Prepend Stress Test
    // -------------------------------------------------------------------------
    console.log("\nSUITE 7: High Concurrency Prepend Stress Test (10 parallel requests)");

    const CONCURRENT_COUNT = 10;
    const concurrentPromises = [];

    for (let i = 0; i < CONCURRENT_COUNT; i++) {
      const p = invokeApi("POST", {
        body: {
          action: "public_create",
          entity: "bookings",
          record: {
            customer: `Concurrent Customer #${i + 1}`,
            email: `concurrent.${i + 1}@zimthreads.com`,
            phone: `+230 5000 ${String(i).padStart(4, "0")}`,
            serviceId: "express-steam",
            serviceName: "Express Steam Clean",
            price: "Rs 350",
            notes: `Concurrency test iteration ${i + 1}`,
          },
        },
      });
      concurrentPromises.push(p);
    }

    const concurrentResults = await Promise.all(concurrentPromises);
    const allConcurrentSucceeded = concurrentResults.every((r) => r.status === 200 && r.data?.success === true);
    record("7.1 All 10 concurrent public_create requests resolved HTTP 200", allConcurrentSucceeded, `Success rate: ${concurrentResults.filter((r) => r.status === 200).length}/${CONCURRENT_COUNT}`);

    const concurrentIds = concurrentResults.map((r) => r.data?.record?.id).filter(Boolean);
    const uniqueIds = new Set(concurrentIds);
    record("7.2 All 10 generated booking IDs are unique", uniqueIds.size === CONCURRENT_COUNT, `Unique IDs: ${uniqueIds.size}/${CONCURRENT_COUNT}`);

    concurrentIds.forEach((id) => cleanupIds.bookings.push(id));

    // Verify all 10 are actually persisted in Neon DB
    const postConcurrentDbRows = await queryNeon("SELECT data FROM public.zimthreads_store WHERE key = 'bookings';");
    const postConcurrentBookings = postConcurrentDbRows[0]?.data || [];
    const dbBookingIdSet = new Set(postConcurrentBookings.map((b) => b.id));
    const allPersistedInDb = concurrentIds.every((id) => dbBookingIdSet.has(id));
    record("7.3 All 10 concurrent bookings verified present in Neon DB jsonb array", allPersistedInDb, `Found ${concurrentIds.filter((id) => dbBookingIdSet.has(id)).length}/${CONCURRENT_COUNT} in DB`);

    // -------------------------------------------------------------------------
    // SUITE 8: Special Characters & Unicode Stress Test
    // -------------------------------------------------------------------------
    console.log("\nSUITE 8: Special Characters & Unicode Stress Test");
    const specialInquiryPayload = {
      action: "public_create",
      entity: "inquiries",
      record: {
        name: "Élise O'Connor & \"Mupesa\"",
        email: "elise.special@zimthreads.com",
        subject: "Repsol jacket size: L'Édition Spéciale 🏁",
        message: "Can you confirm 'heritage' embroidery with quotes: \"vintage\" and apostrophe 's' & emoji 🏎️ 🇲🇺?",
      },
    };

    const specialRes = await invokeApi("POST", { body: specialInquiryPayload });
    const specialId = specialRes.data?.record?.id;
    if (specialId) cleanupIds.inquiries.push(specialId);

    record("8.1 Special characters inquiry created successfully", specialRes.status === 200 && specialRes.data?.success === true, `ID: ${specialId}`);

    // Direct check in DB
    const specialDbRows = await queryNeon("SELECT data FROM public.zimthreads_store WHERE key = 'inquiries';");
    const specialInquiries = specialDbRows[0]?.data || [];
    const foundSpecial = specialInquiries.find((inq) => inq.id === specialId);
    const nameMatches = foundSpecial?.name === "Élise O'Connor & \"Mupesa\"";
    const emojiMatches = foundSpecial?.subject?.includes("🏁");
    record("8.2 Special characters, quotes, and emojis preserved accurately in Neon DB", nameMatches && emojiMatches, `DB Name: ${foundSpecial?.name}`);

    // -------------------------------------------------------------------------
    // SUITE 9: Admin Mutation & Cleanup Verification
    // -------------------------------------------------------------------------
    console.log("\nSUITE 9: Admin Mutation & Cleanup Verification");

    // 9.1 Test update_entity with valid adminToken
    const updateRes = await invokeApi("POST", {
      body: {
        action: "update_entity",
        adminToken: "Zimthreads200",
        entity: "bookings",
        id: createdBookingId,
        updates: { status: "Confirmed", notes: "Updated by Challenger Admin Test" },
      },
    });
    record("9.1 Admin update_entity successfully updates booking status", updateRes.status === 200 && updateRes.data?.updatedRecord?.status === "Confirmed", `Updated Status: ${updateRes.data?.updatedRecord?.status}`);

    // Verify DB reflection of update
    const dbUpdateCheck = await queryNeon("SELECT data FROM public.zimthreads_store WHERE key = 'bookings';");
    const updatedInDb = (dbUpdateCheck[0]?.data || []).find((b) => b.id === createdBookingId);
    record("9.2 Updated booking status verified in Neon DB", updatedInDb?.status === "Confirmed", `DB Status: ${updatedInDb?.status}`);

    // 9.3 Clean up all created test records using delete_entity
    console.log("\nCleaning up test records from live Neon DB...");
    let deleteFailures = 0;

    for (const bId of cleanupIds.bookings) {
      const d = await invokeApi("POST", {
        body: { action: "delete_entity", adminToken: "Zimthreads200", entity: "bookings", id: bId },
      });
      if (d.status !== 200) deleteFailures++;
    }

    for (const oId of cleanupIds.orders) {
      const d = await invokeApi("POST", {
        body: { action: "delete_entity", adminToken: "Zimthreads200", entity: "orders", id: oId },
      });
      if (d.status !== 200) deleteFailures++;
    }

    for (const inqId of cleanupIds.inquiries) {
      const d = await invokeApi("POST", {
        body: { action: "delete_entity", adminToken: "Zimthreads200", entity: "inquiries", id: inqId },
      });
      if (d.status !== 200) deleteFailures++;
    }

    record("9.3 Admin delete_entity cleaned up all test records cleanly", deleteFailures === 0, `Failures: ${deleteFailures}`);

    // Check final counts
    const finalDbRows = await queryNeon(
      "SELECT key, CASE WHEN jsonb_typeof(data)='array' THEN jsonb_array_length(data) ELSE 1 END as count FROM public.zimthreads_store ORDER BY key;"
    );
    const finalMap = new Map(finalDbRows.map((r) => [r.key, r.count]));
    console.log("Final database counts:", Object.fromEntries(finalMap.entries()));

  } catch (err) {
    console.error("FATAL ERROR in test harness:", err);
    record("FATAL Test Harness Exception", false, err.message);
  }

  console.log("\n==================================================================");
  console.log(`TOTAL TESTS: ${results.passed + results.failed}`);
  console.log(`PASSED: ${results.passed}`);
  console.log(`FAILED: ${results.failed}`);
  console.log("==================================================================");

  if (results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run();
