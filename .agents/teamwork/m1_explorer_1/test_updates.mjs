// Test SQL update and delete by id inside JSONB array
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
  const testKey = "__test_entity_temp__";
  await executeSql("DELETE FROM public.zimthreads_store WHERE key = $1;", [testKey]);

  // Insert array with 2 items
  await executeSql(`
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ($1, $2::jsonb, NOW());
  `, [testKey, JSON.stringify([
    { id: "BK-1", customer: "John", status: "Pending" },
    { id: "BK-2", customer: "Sarah", status: "Confirmed" }
  ])]);

  // Update item BK-1 status to "Completed"
  const updateQ = `
    UPDATE public.zimthreads_store
    SET data = (
      SELECT COALESCE(jsonb_agg(
        CASE 
          WHEN elem->>'id' = $2 THEN elem || $3::jsonb
          ELSE elem
        END
      ), '[]'::jsonb)
      FROM jsonb_array_elements(data) AS elem
    ),
    updated_at = NOW()
    WHERE key = $1
    RETURNING key, data;
  `;
  const updateRes = await executeSql(updateQ, [testKey, "BK-1", JSON.stringify({ status: "Completed" })]);
  console.log("Updated result:", JSON.stringify(updateRes, null, 2));

  // Delete item BK-2
  const deleteQ = `
    UPDATE public.zimthreads_store
    SET data = (
      SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
      FROM jsonb_array_elements(data) AS elem
      WHERE elem->>'id' != $2
    ),
    updated_at = NOW()
    WHERE key = $1
    RETURNING key, data;
  `;
  const deleteRes = await executeSql(deleteQ, [testKey, "BK-2"]);
  console.log("Delete result:", JSON.stringify(deleteRes, null, 2));

  // Clean up
  await executeSql("DELETE FROM public.zimthreads_store WHERE key = $1;", [testKey]);
  console.log("Cleaned up successfully.");
}

run().catch(console.error);
