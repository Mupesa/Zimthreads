import { executeSql } from "../../../api/store.ts"

async function run() {
  const rows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = $1;", ["products"])
  const prods = rows[0]?.data || []
  const p5 = prods.find((p) => p.id === "prod-5")
  console.log("Total products in Neon:", prods.length)
  console.log("prod-5 in Neon:", JSON.stringify(p5, null, 2))
}

run().catch(console.error)
