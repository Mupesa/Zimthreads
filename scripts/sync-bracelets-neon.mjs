/**
 * scripts/sync-bracelets-neon.mjs
 * 
 * Synchronizes prod-brace-heritage (Zimthread African Heritage Beaded Bracelet) in Neon PostgreSQL:
 * Project: rapid-hill-42448439 ("Zimthreads Collective")
 * Owner: anesumupesa@gmail.com / Mupesa
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

const canonicalBracelet = {
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
  alt: "Zimthread African Heritage Beaded Drawstring Bracelet Collection",
  description:
    "Handcrafted artisan beaded flag bracelet collection celebrating African heritage. Crafted with high-density polished glass beads, durable braided black cord, and an adjustable drawstring closure with accent beads for a tailored, flexible all-day fit.\n\nPRESALE EXCLUSIVE · Rs 320 each · Slide through options to choose your edition.",
  sizes: ["One Size (Adjustable Drawstring)"],
  featured: true,
  isPreorder: true,
  isPresale: true,
  badge: "PRESALE",
  preorderDeadline: "Presale Open · Rs 320",
}

async function main() {
  console.log("Checking Neon database connection for project rapid-hill-42448439...")

  const rows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  if (!rows || rows.length === 0 || !Array.isArray(rows[0].data)) {
    throw new Error("No products found in public.zimthreads_store WHERE key = 'products'")
  }

  const products = rows[0].data
  console.log(`Retrieved ${products.length} products from live Neon database.`)

  const braceIndex = products.findIndex((p) => p.id === "prod-brace-heritage")
  if (braceIndex === -1) {
    throw new Error("Product 'prod-brace-heritage' not found in Neon database!")
  }

  const currentBrace = products[braceIndex]
  console.log(`Previous bracelet views count in Neon: ${currentBrace.views?.length || 0}`)

  products[braceIndex] = {
    ...currentBrace,
    img: canonicalBracelet.img,
    images: canonicalBracelet.images,
    views: canonicalBracelet.views,
    sizes: canonicalBracelet.sizes,
    description: canonicalBracelet.description,
    alt: canonicalBracelet.alt,
    badge: canonicalBracelet.badge,
    preorderDeadline: canonicalBracelet.preorderDeadline,
  }

  console.log(`Updating prod-brace-heritage in Neon DB with exactly ${canonicalBracelet.views.length} editions...`)
  canonicalBracelet.views.forEach((v, idx) => {
    console.log(` [${idx + 1}] ${v.label} -> ${v.url}`)
  })

  await executeSql(
    `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ('products', $1::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW();
    `,
    [JSON.stringify(products)]
  )

  // Re-read and verify from Neon DB
  const verifyRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  const verifiedBrace = verifyRows[0]?.data?.find((p) => p.id === "prod-brace-heritage")

  console.log(`Verified bracelet in Neon: views count = ${verifiedBrace?.views?.length}`)
  verifiedBrace?.views?.forEach((v, i) => console.log(` [${i + 1}] ${v.label}`))

  if (!verifiedBrace || verifiedBrace.views?.length !== 4) {
    throw new Error(`Verification failed: Expected 4 views, found ${verifiedBrace?.views?.length}`)
  }

  console.log("SUCCESS: prod-brace-heritage in Neon DB successfully updated and verified with the 4 editions.")
}

main().catch((err) => {
  console.error("FATAL ERROR:", err)
  process.exit(1)
})
