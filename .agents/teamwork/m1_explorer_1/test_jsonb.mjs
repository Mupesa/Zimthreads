// Test JSONB operations on Neon
const NEON_CONNECTION_STRING =
  process.env.NEON_DATABASE_URL ||
  "postgresql://neondb_owner:npg_DR0tIYcQyeX8@ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";
const NEON_HOST = "ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech";

async function executeSql(query, params = []) {
  const res = await fetch(`https://${NEON_HOST}/sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": NEON_CONNECTION_STRING,
    },
    body: JSON.stringify({ query, params }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Neon error: ${err}`);
  }
  const data = await res.json();
  return data.rows || [];
}

async function run() {
  console.log("Testing JSONB expressions in PostgreSQL...");

  // Test 1: jsonb concatenation with jsonb_build_array
  const q1 = `
    SELECT 
      jsonb_build_array($1::jsonb) || '[{"id": 1}]'::jsonb AS prepend_result,
      '[{"id": 1}]'::jsonb || jsonb_build_array($1::jsonb) AS append_result,
      COALESCE(NULL, '[]'::jsonb) AS coalesce_result;
  `;
  const r1 = await executeSql(q1, [JSON.stringify({ id: 2, name: "New Item" })]);
  console.log("Q1 results:", JSON.stringify(r1, null, 2));

  // Test 2: atomic UPSERT with prepend when key may or may not exist:
  const testKey = "__test_append_temp__";
  
  // Clean up if exists
  await executeSql("DELETE FROM public.zimthreads_store WHERE key = $1;", [testKey]);

  // Insert initial
  const insertQ = `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ($1, jsonb_build_array($2::jsonb), NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = jsonb_build_array($2::jsonb) || COALESCE(zimthreads_store.data, '[]'::jsonb),
        updated_at = NOW()
    RETURNING key, data, updated_at;
  `;
  const r2 = await executeSql(insertQ, [testKey, JSON.stringify({ id: "BK-1001", customer: "Alice" })]);
  console.log("Insert 1 into fresh key:", JSON.stringify(r2, null, 2));

  // Insert second item (atomic prepend)
  const r3 = await executeSql(insertQ, [testKey, JSON.stringify({ id: "BK-1002", customer: "Bob" })]);
  console.log("Insert 2 (prepend to existing):", JSON.stringify(r3, null, 2));

  // Clean up
  await executeSql("DELETE FROM public.zimthreads_store WHERE key = $1;", [testKey]);
  console.log("Cleaned up test key.");
}

run().catch(console.error);
