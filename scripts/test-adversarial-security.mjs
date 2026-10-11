/**
 * Adversarial Security & Boundary Test Suite for api/store.ts
 *
 * Tests security boundaries:
 * 1. Admin authentication boundaries (401 on missing/invalid token)
 * 2. Public create whitelist boundaries (400 on disallowed entities)
 * 3. Payload validation & malformation rejection (400 on malformed payloads)
 * 4. Boundary and injection testing (SQL injection, XSS, unicode, special chars)
 * 5. Method rejection (405 on PUT, DELETE)
 */

import handler, { executeSql } from "../api/store.ts"

function createMockReqRes(reqOptions = {}) {
  const req = {
    method: reqOptions.method || "POST",
    headers: reqOptions.headers || {},
    query: reqOptions.query || {},
    body: reqOptions.body,
    url: reqOptions.url || "/api/store",
  }

  let statusCode = 200
  let responseData = null
  const responseHeaders = {}

  const res = {
    statusCode: 200,
    setHeader(name, value) {
      responseHeaders[name.toLowerCase()] = value
    },
    status(code) {
      statusCode = code
      this.statusCode = code
      return this
    },
    json(data) {
      responseData = data
      return this
    },
    end() {
      return this
    },
    get result() {
      return {
        statusCode,
        data: responseData,
        headers: responseHeaders,
      }
    },
  }

  return { req, res }
}

const testResults = []

async function runTestCase(name, reqOptions, assertionFn) {
  process.stdout.write(`Testing: ${name}... `)
  const { req, res } = createMockReqRes(reqOptions)
  try {
    await handler(req, res)
    const result = res.result
    const check = assertionFn(result)
    if (check.pass) {
      console.log(`\x1b[32mPASS\x1b[0m (HTTP ${result.statusCode})`)
      testResults.push({ name, pass: true, status: result.statusCode, details: check.message || "OK" })
    } else {
      console.log(`\x1b[31mFAIL\x1b[0m (HTTP ${result.statusCode}): ${check.message}`)
      testResults.push({ name, pass: false, status: result.statusCode, details: check.message })
    }
  } catch (err) {
    console.log(`\x1b[31mERROR\x1b[0m: ${err.message}`)
    testResults.push({ name, pass: false, status: 500, details: `Exception: ${err.message}` })
  }
}

async function runSuite() {
  console.log("================================================================")
  console.log("MILESTONE 1 CHALLENGER 2: ADVERSARIAL SECURITY & BOUNDARY TESTS")
  console.log("================================================================\n")

  // --- SECTION 1: ADMIN AUTHENTICATION BOUNDARIES (Expect 401) ---
  console.log("\n--- SECTION 1: Administrative Authentication Boundaries (Expect HTTP 401) ---")

  await runTestCase(
    "1.1 Admin sync without token",
    { method: "POST", body: { action: "sync", key: "test_key", data: [] } },
    (res) => ({ pass: res.statusCode === 401 && res.data?.error === "Unauthorized", message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "1.2 Admin sync with invalid token string",
    { method: "POST", body: { action: "sync", adminToken: "invalid_secret", key: "test_key", data: [] } },
    (res) => ({ pass: res.statusCode === 401 && res.data?.error === "Unauthorized", message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "1.3 Admin sync with empty token",
    { method: "POST", body: { action: "sync", adminToken: "", key: "test_key", data: [] } },
    (res) => ({ pass: res.statusCode === 401 && res.data?.error === "Unauthorized", message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "1.4 Admin sync with numeric token",
    { method: "POST", body: { action: "sync", adminToken: 200, key: "test_key", data: [] } },
    (res) => ({ pass: res.statusCode === 401 && res.data?.error === "Unauthorized", message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "1.5 Admin sync with boolean token",
    { method: "POST", body: { action: "sync", adminToken: true, key: "test_key", data: [] } },
    (res) => ({ pass: res.statusCode === 401 && res.data?.error === "Unauthorized", message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "1.6 Admin update_entity without token",
    { method: "POST", body: { action: "update_entity", entity: "bookings", id: "BK-1234", updates: { status: "Cancelled" } } },
    (res) => ({ pass: res.statusCode === 401 && res.data?.error === "Unauthorized", message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "1.7 Admin update_entity with invalid token",
    { method: "POST", body: { action: "update_entity", adminToken: "bad_token", entity: "bookings", id: "BK-1234", updates: { status: "Cancelled" } } },
    (res) => ({ pass: res.statusCode === 401 && res.data?.error === "Unauthorized", message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "1.8 Admin delete_entity without token",
    { method: "POST", body: { action: "delete_entity", entity: "bookings", id: "BK-1234" } },
    (res) => ({ pass: res.statusCode === 401 && res.data?.error === "Unauthorized", message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "1.9 Admin delete_entity with invalid token",
    { method: "POST", body: { action: "delete_entity", adminToken: "fake_token", entity: "bookings", id: "BK-1234" } },
    (res) => ({ pass: res.statusCode === 401 && res.data?.error === "Unauthorized", message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "1.10 Admin batch_update_products without token",
    { method: "POST", body: { action: "batch_update_products", updates: [{ id: "p1", changes: { price: 999 } }] } },
    (res) => ({ pass: res.statusCode === 401 && res.data?.error === "Unauthorized", message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "1.11 Admin batch_update_products with invalid token",
    { method: "POST", body: { action: "batch_update_products", adminToken: "wrong", updates: [{ id: "p1", changes: { price: 999 } }] } },
    (res) => ({ pass: res.statusCode === 401 && res.data?.error === "Unauthorized", message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "1.12 Legacy upsert (no action, key specified) without token",
    { method: "POST", body: { key: "products", data: [] } },
    (res) => ({ pass: res.statusCode === 401 && res.data?.error === "Unauthorized", message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "1.13 Arbitrary action without token",
    { method: "POST", body: { action: "arbitrary_backdoor" } },
    (res) => ({ pass: res.statusCode === 401 && res.data?.error === "Unauthorized", message: JSON.stringify(res.data) })
  )

  // --- SECTION 2: PUBLIC CREATE WHITELIST BOUNDARIES (Expect 400) ---
  console.log("\n--- SECTION 2: Public Create Whitelist Boundaries (Expect HTTP 400) ---")

  await runTestCase(
    "2.1 Public create targeting 'products' catalog",
    { method: "POST", body: { action: "public_create", entity: "products", record: { name: "Fake Jacket" } } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("not permitted"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "2.2 Public create targeting 'services'",
    { method: "POST", body: { action: "public_create", entity: "services", record: { name: "Fake Service" } } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("not permitted"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "2.3 Public create targeting 'blog_posts'",
    { method: "POST", body: { action: "public_create", entity: "blog_posts", record: { title: "Spam Post" } } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("not permitted"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "2.4 Public create targeting 'settings'",
    { method: "POST", body: { action: "public_create", entity: "settings", record: { banner: "Hacked" } } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("not permitted"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "2.5 Public create targeting arbitrary entity 'users'",
    { method: "POST", body: { action: "public_create", entity: "users", record: { name: "Admin" } } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("not permitted"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "2.6 Public create with empty entity string",
    { method: "POST", body: { action: "public_create", entity: "", record: {} } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("not permitted"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "2.7 Public create with null entity",
    { method: "POST", body: { action: "public_create", entity: null, record: {} } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("not permitted"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "2.8 Public create with prototype pollution entity '__proto__'",
    { method: "POST", body: { action: "public_create", entity: "__proto__", record: {} } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("not permitted"), message: JSON.stringify(res.data) })
  )

  // --- SECTION 3: MALFORMED PAYLOADS & VALIDATION REJECTION (Expect 400) ---
  console.log("\n--- SECTION 3: Malformed Payloads & Validation Rejection (Expect HTTP 400) ---")

  await runTestCase(
    "3.1 Malformed raw JSON string body",
    { method: "POST", body: '{"action": "public_create", entity: invalid_json' },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error === "Malformed JSON body", message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "3.2 Booking with null record",
    { method: "POST", body: { action: "public_create", entity: "bookings", record: null } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("Missing booking record"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "3.3 Booking with missing customer name",
    { method: "POST", body: { action: "public_create", entity: "bookings", record: { email: "test@example.com", phone: "+230 5555", serviceId: "srv-1" } } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("customer cannot be empty"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "3.4 Booking with whitespace-only customer name",
    { method: "POST", body: { action: "public_create", entity: "bookings", record: { customer: "   \t  ", email: "test@example.com", phone: "+230 5555", serviceId: "srv-1" } } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("customer cannot be empty"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "3.5 Booking with invalid email format",
    { method: "POST", body: { action: "public_create", entity: "bookings", record: { customer: "Alice", email: "invalid-email-address", phone: "+230 5555", serviceId: "srv-1" } } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("invalid email address"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "3.6 Booking with missing phone",
    { method: "POST", body: { action: "public_create", entity: "bookings", record: { customer: "Alice", email: "alice@example.com", serviceId: "srv-1" } } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("phone cannot be empty"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "3.7 Booking with missing serviceId",
    { method: "POST", body: { action: "public_create", entity: "bookings", record: { customer: "Alice", email: "alice@example.com", phone: "+230 5555" } } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("serviceId cannot be empty"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "3.8 Order with null record",
    { method: "POST", body: { action: "public_create", entity: "orders", record: null } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("Missing order record"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "3.9 Order with missing customer name",
    { method: "POST", body: { action: "public_create", entity: "orders", record: { email: "test@example.com", phone: "+230 5555", items: [{ id: "1" }] } } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("customer cannot be empty"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "3.10 Order with invalid email",
    { method: "POST", body: { action: "public_create", entity: "orders", record: { customer: "Bob", email: "not_an_email", phone: "+230 5555", items: [{ id: "1" }] } } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("invalid email address"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "3.11 Order with missing phone",
    { method: "POST", body: { action: "public_create", entity: "orders", record: { customer: "Bob", email: "bob@example.com", items: [{ id: "1" }] } } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("phone cannot be empty"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "3.12 Order with empty items array",
    { method: "POST", body: { action: "public_create", entity: "orders", record: { customer: "Bob", email: "bob@example.com", phone: "+230 5555", items: [] } } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("order must contain at least one item"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "3.13 Order with non-array items",
    { method: "POST", body: { action: "public_create", entity: "orders", record: { customer: "Bob", email: "bob@example.com", phone: "+230 5555", items: "single_jacket" } } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("order must contain at least one item"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "3.14 Inquiry with null record",
    { method: "POST", body: { action: "public_create", entity: "inquiries", record: null } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("Missing inquiry record"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "3.15 Inquiry with missing name",
    { method: "POST", body: { action: "public_create", entity: "inquiries", record: { email: "charlie@example.com", subject: "Help", message: "Hi" } } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("name cannot be empty"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "3.16 Inquiry with invalid email",
    { method: "POST", body: { action: "public_create", entity: "inquiries", record: { name: "Charlie", email: "bad.email", subject: "Help", message: "Hi" } } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("invalid email address"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "3.17 Inquiry with missing subject",
    { method: "POST", body: { action: "public_create", entity: "inquiries", record: { name: "Charlie", email: "charlie@example.com", message: "Hi" } } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("subject cannot be empty"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "3.18 Inquiry with missing message",
    { method: "POST", body: { action: "public_create", entity: "inquiries", record: { name: "Charlie", email: "charlie@example.com", subject: "Help" } } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("message cannot be empty"), message: JSON.stringify(res.data) })
  )

  // --- SECTION 4: HTTP METHOD & UNKNOWN ACTIONS (Expect 405 / 400) ---
  console.log("\n--- SECTION 4: HTTP Verb & Action Validation (Expect HTTP 405 / 400 / 404) ---")

  await runTestCase(
    "4.1 Unsupported PUT method",
    { method: "PUT" },
    (res) => ({ pass: res.statusCode === 405 && res.data?.error === "Method not allowed", message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "4.2 Unsupported DELETE method",
    { method: "DELETE" },
    (res) => ({ pass: res.statusCode === 405 && res.data?.error === "Method not allowed", message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "4.3 Valid adminToken with unknown action",
    { method: "POST", body: { action: "unknown_maintenance_action", adminToken: "Zimthreads200" } },
    (res) => ({ pass: res.statusCode === 400 && res.data?.error?.includes("Unknown action"), message: JSON.stringify(res.data) })
  )

  await runTestCase(
    "4.4 Valid adminToken update_entity with non-existent ID",
    { method: "POST", body: { action: "update_entity", adminToken: "Zimthreads200", entity: "bookings", id: "NON_EXISTENT_ID_999", updates: { status: "Active" } } },
    (res) => ({ pass: res.statusCode === 404 && res.data?.error?.includes("Entity not found"), message: JSON.stringify(res.data) })
  )

  // --- SECTION 5: BOUNDARY & INJECTION TESTING (SQL Injection, XSS, Special Chars) ---
  console.log("\n--- SECTION 5: Boundary & Injection Resilience Against Live DB ---")

  // Case 5.1: SQL Injection attempt in booking customer name
  const sqlInjectionBookingId = `BK-CHALLENGE-SQLI-${Date.now()}`
  await runTestCase(
    "5.1 SQL Injection attack in booking customer field",
    {
      method: "POST",
      body: {
        action: "public_create",
        entity: "bookings",
        record: {
          id: sqlInjectionBookingId,
          customer: "Robert'); DROP TABLE public.zimthreads_store; --",
          email: "sqli-test@adversarial.org",
          phone: "+230 5111 2233",
          serviceId: "srv-clean-01",
          notes: "' OR '1'='1' -- /* comment */",
        },
      },
    },
    (res) => ({
      pass: res.statusCode === 200 && res.data?.success === true && res.data?.record?.id === sqlInjectionBookingId,
      message: JSON.stringify(res.data),
    })
  )

  // Verify DB table was NOT dropped and still intact
  let dbIntact = false
  try {
    const rows = await executeSql("SELECT count(*) as cnt FROM public.zimthreads_store;")
    dbIntact = Number(rows[0].cnt) >= 7
    console.log(`    Verification: Database table count = ${rows[0].cnt} (Intact: ${dbIntact})`)
  } catch (err) {
    console.error("    Verification failed: DB Error:", err)
  }

  // Clean up 5.1 record
  await runTestCase(
    "5.1b Clean up SQL Injection test booking",
    {
      method: "POST",
      body: {
        action: "delete_entity",
        adminToken: "Zimthreads200",
        entity: "bookings",
        id: sqlInjectionBookingId,
      },
    },
    (res) => ({ pass: res.statusCode === 200 && res.data?.success === true, message: JSON.stringify(res.data) })
  )

  // Case 5.2: XSS, Unicode, quotes and special characters in inquiry
  const xssInquiryId = `INQ-CHALLENGE-XSS-${Date.now()}`
  const xssPayload = "<script>alert('xss')</script> & <img src=x onerror=alert(1)> / \\ \" ' ` 🇿🇼 🔥"
  await runTestCase(
    "5.2 XSS and Unicode boundary payloads in inquiry",
    {
      method: "POST",
      body: {
        action: "public_create",
        entity: "inquiries",
        record: {
          id: xssInquiryId,
          name: "Security Reviewer 🇿🇼",
          email: "xss-test@adversarial.org",
          subject: xssPayload,
          message: "Testing special delimiters: \r\n\t, quotes: \"'` and backslashes \\\\\\",
        },
      },
    },
    (res) => ({
      pass: res.statusCode === 200 && res.data?.success === true && res.data?.record?.subject === xssPayload,
      message: JSON.stringify(res.data),
    })
  )

  // Clean up 5.2 record
  await runTestCase(
    "5.2b Clean up XSS test inquiry",
    {
      method: "POST",
      body: {
        action: "delete_entity",
        adminToken: "Zimthreads200",
        entity: "inquiries",
        id: xssInquiryId,
      },
    },
    (res) => ({ pass: res.statusCode === 200 && res.data?.success === true, message: JSON.stringify(res.data) })
  )

  // Case 5.3: Order with complex address and quotes
  const specialOrderId = `ORD-CHALLENGE-ADDR-${Date.now()}`
  await runTestCase(
    "5.3 Order with special characters in address and items",
    {
      method: "POST",
      body: {
        action: "public_create",
        entity: "orders",
        record: {
          id: specialOrderId,
          customer: "O'Connor & Sons Ltd",
          email: "oconnor@adversarial.org",
          phone: "+230 5999 8877",
          address: "Apt #4-B, 12th St. / O'Reilly's Lane, C:\\Data\\Store",
          city: "Port Louis",
          items: [
            {
              id: "jacket-test-1",
              name: "Castrol Honda '98 Racing Jacket",
              size: "XL",
              price: "Rs 4,500",
            },
          ],
        },
      },
    },
    (res) => ({
      pass: res.statusCode === 200 && res.data?.success === true && res.data?.record?.id === specialOrderId,
      message: JSON.stringify(res.data),
    })
  )

  // Clean up 5.3 record
  await runTestCase(
    "5.3b Clean up special characters test order",
    {
      method: "POST",
      body: {
        action: "delete_entity",
        adminToken: "Zimthreads200",
        entity: "orders",
        id: specialOrderId,
      },
    },
    (res) => ({ pass: res.statusCode === 200 && res.data?.success === true, message: JSON.stringify(res.data) })
  )

  // --- SECTION 6: SUMMARY & VERDICT ---
  console.log("\n================================================================")
  console.log("FINAL RESULTS SUMMARY")
  console.log("================================================================")
  const total = testResults.length
  const passed = testResults.filter((r) => r.pass).length
  const failed = total - passed

  console.log(`Total tests executed : ${total}`)
  console.log(`Passed               : ${passed}`)
  console.log(`Failed               : ${failed}`)

  if (failed > 0) {
    console.log("\nFAILED TESTS:")
    testResults.filter((r) => !r.pass).forEach((r) => {
      console.log(`- [FAIL] ${r.name}: ${r.details}`)
    })
    process.exit(1)
  } else {
    console.log("\nAll security boundary & negative tests passed successfully!")
    process.exit(0)
  }
}

runSuite().catch((err) => {
  console.error("Test suite fatal error:", err)
  process.exit(1)
})
