import { executeSql } from "../api/store.ts"

async function main() {
  const rows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  const products = rows[0].data
  console.log(`Retrieved ${products.length} products:`)
  products.forEach((p, i) => console.log(`[${i}] ${p.id} | ${p.name} | category: ${p.category} | views: ${p.views?.length || 0}`))
}

main().catch(console.error)
