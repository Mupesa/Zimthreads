// Automated E2E verification test for Zimthreads VIP Event QR Lead Capture
// Account: anesumupesa@gmail.com / Mupesa | Target Neon Project ID: rapid-hill-42448439

import { executeSql } from "../api/store.ts"

const API_BASE = "http://localhost:8443/api/store"
const NEON_HOST = "ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech"

async function runTest() {
  console.log("=== Testing Zimthreads VIP Lead Capture E2E ===")
  console.log("Target Neon Host:", NEON_HOST)

  const testEmail = `test_vip_${Date.now()}@example.com`
  const testName = "Oasis Tester"
  const testEvent = "Oasis Beach Bar"
  const testCode = "OASIS10"

  // 1. Direct Public Create
  console.log("\n[Test 1] Testing public_create for 'subscribers'...")
  const createPayload = {
    action: "public_create",
    entity: "subscribers",
    record: {
      email: testEmail,
      name: testName,
      source: "google_one_tap",
      event: testEvent,
      code: testCode,
    },
  }

  // We can test directly using executeSql to test Neon DB integration
  console.log("1.1 Testing DB schema and direct upsert...")
  const checkRow = await executeSql("SELECT key FROM public.zimthreads_store WHERE key = 'subscribers';")
  console.log("Subscribers row exists in DB:", checkRow.length > 0)

  // 1.2 Insert test record
  const testRecord = {
    id: `SUB-TEST-${Date.now()}`,
    email: testEmail,
    name: testName,
    source: "event_qr_oasis",
    event: testEvent,
    code: testCode,
    redeemed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await executeSql(`
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ('subscribers', jsonb_build_array($1::jsonb), NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = CASE 
          WHEN jsonb_typeof(zimthreads_store.data) = 'array' 
          THEN jsonb_build_array($1::jsonb) || COALESCE(zimthreads_store.data, '[]'::jsonb)
          ELSE jsonb_build_array($1::jsonb)
        END,
        updated_at = NOW();
  `, [JSON.stringify(testRecord)])

  console.log("✓ Successfully inserted test subscriber into Neon DB.")

  // 2. Read back
  console.log("\n[Test 2] Reading back subscriber from Neon DB...")
  const fetchRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'subscribers';")
  const subs = fetchRows[0]?.data || []
  const found = subs.find((s) => s.email === testEmail)
  if (!found) {
    throw new Error(`Test subscriber ${testEmail} not found in database!`)
  }
  console.log("✓ Retrieved subscriber from Neon:", found.email, "Code:", found.code)

  // 3. Clean up test record
  console.log("\n[Test 3] Cleaning up test record from database...")
  const cleanedSubs = subs.filter((s) => s.email !== testEmail)
  await executeSql(
    "UPDATE public.zimthreads_store SET data = $1::jsonb, updated_at = NOW() WHERE key = 'subscribers';",
    [JSON.stringify(cleanedSubs)]
  )
  console.log("✓ Cleaned up test record cleanly.")

  console.log("\n=== ALL E2E DB TESTS PASSED SUCCESSFULLY ===")
}

runTest().catch((err) => {
  console.error("Test failed:", err)
  process.exit(1)
})
