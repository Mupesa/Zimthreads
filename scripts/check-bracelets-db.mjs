import { executeSql } from "../api/store.ts"

async function main() {
  const rows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  const products = rows[0].data
  console.log(`Retrieved ${products.length} products.`)
  const bracelet = products.find((p) => p.id === "prod-brace-heritage")
  if (!bracelet) {
    console.log("prod-brace-heritage not found!")
    return
  }
  console.log("Bracelet views count:", bracelet.views?.length)
  bracelet.views?.forEach((v, i) => console.log(`${i}: ${v.label} -> ${v.url}`))
}

main().catch(console.error)
