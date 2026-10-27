/**
 * scripts/sync-bracelets-neon.mjs
 * 
 * Synchronizes products in Neon PostgreSQL:
 * Project: rapid-hill-42448439 ("Zimthreads Collective")
 * Owner: anesumupesa@gmail.com / Mupesa
 * 
 * Consolidates bracelets into ONE SINGLE product card (prod-brace-heritage)
 * with the 4 authentic drawstring editions in its views, and removes any
 * individual bracelet cards (prod-brace-zimbabwe, prod-brace-ghana, etc.).
 */

const NEON_CONNECTION_STRING =
  process.env.NEON_DATABASE_URL ||
  "postgresql://neondb_owner:npg_DR0tIYcQyeX8@ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require"

const NEON_HOST = "ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech"

async function executeSql(query, params = []) {
  const response = await fetch(`https://${NEON_HOST}/sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": NEON_CONNECTION_STRING,
    },
    body: JSON.stringify({ query, params }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Neon SQL error (${response.status}): ${errText}`)
  }

  const data = await response.json()
  return data.rows || []
}

const canonicalHeritageBracelet = {
  id: "prod-brace-heritage",
  name: "Zimthread African Heritage Beaded Bracelet",
  category: "Accessories",
  price: 320,
  stock: 120,
  img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121580/zimthreads/bracelets/bracelet-zimbabwe-flag-cord-v2.jpg",
  images: [
    "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121580/zimthreads/bracelets/bracelet-zimbabwe-flag-cord-v2.jpg",
    "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121583/zimthreads/bracelets/bracelet-ghana-blackstar-cord-v2.jpg",
    "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121584/zimthreads/bracelets/bracelet-mauritius-flag-cord-v2.jpg",
    "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121585/zimthreads/bracelets/bracelet-nigeria-naija-cord-v2.jpg",
  ],
  views: [
    {
      label: "Zimbabwe Flag Beaded Drawstring Bracelet",
      url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121580/zimthreads/bracelets/bracelet-zimbabwe-flag-cord-v2.jpg",
    },
    {
      label: 'Ghana "Black Star" Beaded Drawstring Bracelet',
      url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121583/zimthreads/bracelets/bracelet-ghana-blackstar-cord-v2.jpg",
    },
    {
      label: 'Mauritius "Les 4 Couleurs" Beaded Drawstring Bracelet',
      url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121584/zimthreads/bracelets/bracelet-mauritius-flag-cord-v2.jpg",
    },
    {
      label: 'Nigeria "Naija" Beaded Drawstring Bracelet',
      url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121585/zimthreads/bracelets/bracelet-nigeria-naija-cord-v2.jpg",
    },
  ],
  alt: "Zimthread African Heritage Beaded Bracelet - Drawstring Editions",
  description:
    "Handcrafted artisan beaded flag bracelets celebrating African heritage and unity. Each piece is meticulously crafted with high-density polished glass beads on durable braided cord with an adjustable sliding drawstring closure for an effortless, tailored fit across all wrist sizes.\n\nPRESALE EXCLUSIVE · Rs 320",
  sizes: ["One Size (Adjustable Drawstring)"],
  featured: true,
  isPreorder: true,
  isPresale: true,
  badge: "PRESALE",
  preorderDeadline: "Presale Open · Rs 320",
}

async function main() {
  console.log("Connecting to Neon PostgreSQL database for rapid-hill-42448439...")

  const rows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  if (!rows || rows.length === 0 || !Array.isArray(rows[0].data)) {
    throw new Error("No products found in public.zimthreads_store WHERE key = 'products'")
  }

  const products = rows[0].data
  console.log(`Retrieved ${products.length} products from live Neon database.`)

  // Filter out any individual bracelet cards (prod-brace-zimbabwe, prod-brace-ghana, etc.) and old prod-brace-heritage
  const nonBraceletProducts = products.filter(
    (p) => p && !p.id.startsWith("prod-brace-"),
  )
  console.log(`Non-bracelet products count: ${nonBraceletProducts.length}`)

  // Combine with the single consolidated heritage bracelet
  const updatedProducts = [...nonBraceletProducts, canonicalHeritageBracelet]
  console.log(`Total updated catalog count: ${updatedProducts.length}`)

  await executeSql(
    `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ('products', $1::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW();
    `,
    [JSON.stringify(updatedProducts)]
  )

  // Verify
  const verifyRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  const verifiedProducts = verifyRows[0]?.data || []
  const braceletList = verifiedProducts.filter((p) => p.id.startsWith("prod-brace-"))

  console.log(`Verified bracelets in Neon DB: count = ${braceletList.length}`)
  braceletList.forEach((b) => {
    console.log(` - ${b.id} | ${b.name} | views: ${b.views?.length}`)
    b.views?.forEach((v, idx) => console.log(`     [${idx + 1}] ${v.label}`))
  })

  if (braceletList.length !== 1 || braceletList[0].id !== "prod-brace-heritage") {
    throw new Error(`Expected exactly 1 bracelet product ('prod-brace-heritage') in Neon DB, found ${braceletList.length}`)
  }

  console.log("SUCCESS: Neon DB updated with exactly ONE consolidated bracelet product containing all 4 editions.")
}

main().catch((err) => {
  console.error("FATAL ERROR:", err)
  process.exit(1)
})
