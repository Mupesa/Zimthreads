// Read-only query test
const NEON_CONNECTION_STRING =
  process.env.NEON_DATABASE_URL ||
  "postgresql://neondb_owner:npg_DR0tIYcQyeX8@ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";
const NEON_HOST = "ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech";

async function run() {
  const res = await fetch(`https://${NEON_HOST}/sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": NEON_CONNECTION_STRING,
    },
    body: JSON.stringify({
      query: `SELECT key, updated_at, jsonb_typeof(data) as val_type, 
              CASE WHEN jsonb_typeof(data) = 'array' THEN jsonb_array_length(data) ELSE -1 END as item_count 
              FROM public.zimthreads_store ORDER BY key;`,
      params: [],
    }),
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

run().catch(console.error);
