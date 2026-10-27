/**
 * scripts/sync-bracelets-neon.mjs
 * 
 * Synchronizes products in Neon PostgreSQL:
 * Project: rapid-hill-42448439 ("Zimthreads Collective")
 * Owner: anesumupesa@gmail.com / Mupesa
 * 
 * Replaces any legacy consolidated bracelet (prod-brace-heritage) with the 4 distinct
 * artisan drawstring bracelet products directly in the catalog:
 * 1. prod-brace-zimbabwe (Zimbabwe Flag Beaded Drawstring Bracelet)
 * 2. prod-brace-ghana (Ghana "Black Star" Beaded Drawstring Bracelet)
 * 3. prod-brace-mauritius (Mauritius "Les 4 Couleurs" Beaded Drawstring Bracelet)
 * 4. prod-brace-nigeria (Nigeria "Naija" Beaded Drawstring Bracelet)
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

const canonicalDrawstringBracelets = [
  {
    id: "prod-brace-zimbabwe",
    name: "Zimbabwe Flag Beaded Drawstring Bracelet",
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
    alt: "Zimbabwe Flag Beaded Drawstring Bracelet",
    description:
      "Handcrafted artisan beaded flag bracelet celebrating Zimbabwean heritage. Crafted with high-density polished glass beads in national green, yellow, red, and black on durable braided cord with an adjustable sliding drawstring closure for a tailored fit.\n\nPRESALE EXCLUSIVE · Rs 320",
    sizes: ["One Size (Adjustable Drawstring)"],
    featured: true,
    isPreorder: true,
    isPresale: true,
    badge: "PRESALE",
    preorderDeadline: "Presale Open · Rs 320",
  },
  {
    id: "prod-brace-ghana",
    name: 'Ghana "Black Star" Beaded Drawstring Bracelet',
    category: "Accessories",
    price: 320,
    stock: 120,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121583/zimthreads/bracelets/bracelet-ghana-blackstar-cord-v2.jpg",
    images: [
      "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121583/zimthreads/bracelets/bracelet-ghana-blackstar-cord-v2.jpg",
      "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121580/zimthreads/bracelets/bracelet-zimbabwe-flag-cord-v2.jpg",
      "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121584/zimthreads/bracelets/bracelet-mauritius-flag-cord-v2.jpg",
      "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121585/zimthreads/bracelets/bracelet-nigeria-naija-cord-v2.jpg",
    ],
    views: [
      {
        label: 'Ghana "Black Star" Beaded Drawstring Bracelet',
        url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121583/zimthreads/bracelets/bracelet-ghana-blackstar-cord-v2.jpg",
      },
      {
        label: "Zimbabwe Flag Beaded Drawstring Bracelet",
        url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121580/zimthreads/bracelets/bracelet-zimbabwe-flag-cord-v2.jpg",
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
    alt: 'Ghana "Black Star" Beaded Drawstring Bracelet',
    description:
      "Handcrafted artisan beaded flag bracelet celebrating Ghanaian heritage. Featuring iconic red, yellow, and green national stripes centered by the Black Star of Africa, strung on durable braided cord with an adjustable sliding drawstring closure.\n\nPRESALE EXCLUSIVE · Rs 320",
    sizes: ["One Size (Adjustable Drawstring)"],
    featured: true,
    isPreorder: true,
    isPresale: true,
    badge: "PRESALE",
    preorderDeadline: "Presale Open · Rs 320",
  },
  {
    id: "prod-brace-mauritius",
    name: 'Mauritius "Les 4 Couleurs" Beaded Drawstring Bracelet',
    category: "Accessories",
    price: 320,
    stock: 120,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121584/zimthreads/bracelets/bracelet-mauritius-flag-cord-v2.jpg",
    images: [
      "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121584/zimthreads/bracelets/bracelet-mauritius-flag-cord-v2.jpg",
      "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121580/zimthreads/bracelets/bracelet-zimbabwe-flag-cord-v2.jpg",
      "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121583/zimthreads/bracelets/bracelet-ghana-blackstar-cord-v2.jpg",
      "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121585/zimthreads/bracelets/bracelet-nigeria-naija-cord-v2.jpg",
    ],
    views: [
      {
        label: 'Mauritius "Les 4 Couleurs" Beaded Drawstring Bracelet',
        url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121584/zimthreads/bracelets/bracelet-mauritius-flag-cord-v2.jpg",
      },
      {
        label: "Zimbabwe Flag Beaded Drawstring Bracelet",
        url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121580/zimthreads/bracelets/bracelet-zimbabwe-flag-cord-v2.jpg",
      },
      {
        label: 'Ghana "Black Star" Beaded Drawstring Bracelet',
        url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121583/zimthreads/bracelets/bracelet-ghana-blackstar-cord-v2.jpg",
      },
      {
        label: 'Nigeria "Naija" Beaded Drawstring Bracelet',
        url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121585/zimthreads/bracelets/bracelet-nigeria-naija-cord-v2.jpg",
      },
    ],
    alt: 'Mauritius "Les 4 Couleurs" Beaded Drawstring Bracelet',
    description:
      "Handcrafted artisan beaded flag bracelet honoring Mauritius. Woven with vibrant red, blue, yellow, and green polished glass beads on durable braided black cord with an adjustable sliding drawstring closure.\n\nPRESALE EXCLUSIVE · Rs 320",
    sizes: ["One Size (Adjustable Drawstring)"],
    featured: true,
    isPreorder: true,
    isPresale: true,
    badge: "PRESALE",
    preorderDeadline: "Presale Open · Rs 320",
  },
  {
    id: "prod-brace-nigeria",
    name: 'Nigeria "Naija" Beaded Drawstring Bracelet',
    category: "Accessories",
    price: 320,
    stock: 120,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121585/zimthreads/bracelets/bracelet-nigeria-naija-cord-v2.jpg",
    images: [
      "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121585/zimthreads/bracelets/bracelet-nigeria-naija-cord-v2.jpg",
      "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121580/zimthreads/bracelets/bracelet-zimbabwe-flag-cord-v2.jpg",
      "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121583/zimthreads/bracelets/bracelet-ghana-blackstar-cord-v2.jpg",
      "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121584/zimthreads/bracelets/bracelet-mauritius-flag-cord-v2.jpg",
    ],
    views: [
      {
        label: 'Nigeria "Naija" Beaded Drawstring Bracelet',
        url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121585/zimthreads/bracelets/bracelet-nigeria-naija-cord-v2.jpg",
      },
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
    ],
    alt: 'Nigeria "Naija" Beaded Drawstring Bracelet',
    description:
      "Handcrafted artisan beaded flag bracelet celebrating Naija heritage. Featuring crisp green and white national stripes on durable braided black cord with an adjustable sliding drawstring closure.\n\nPRESALE EXCLUSIVE · Rs 320",
    sizes: ["One Size (Adjustable Drawstring)"],
    featured: true,
    isPreorder: true,
    isPresale: true,
    badge: "PRESALE",
    preorderDeadline: "Presale Open · Rs 320",
  },
]

async function main() {
  console.log("Connecting to Neon PostgreSQL database for rapid-hill-42448439...")

  const rows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  if (!rows || rows.length === 0 || !Array.isArray(rows[0].data)) {
    throw new Error("No products found in public.zimthreads_store WHERE key = 'products'")
  }

  const products = rows[0].data
  console.log(`Retrieved ${products.length} products from live Neon database.`)

  // Filter out any legacy prod-brace-heritage or other old bracelet items
  const nonBraceletProducts = products.filter(
    (p) => p && p.id !== "prod-brace-heritage" && !p.id.startsWith("prod-brace-")
  )
  console.log(`Non-bracelet products count: ${nonBraceletProducts.length}`)

  // Combine with the 4 distinct drawstring bracelets
  const updatedProducts = [...nonBraceletProducts, ...canonicalDrawstringBracelets]
  console.log(`Total updated catalog count: ${updatedProducts.length}`)

  console.log("Drawstring bracelets to be persisted:")
  canonicalDrawstringBracelets.forEach((b, i) => {
    console.log(` [${i + 1}] ${b.id}: ${b.name}`)
  })

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
  const braceletList = verifiedProducts.filter((p) => p.id.startsWith("prod-brace-") || p.id === "prod-brace-heritage")

  console.log(`Verified bracelets in Neon DB: count = ${braceletList.length}`)
  braceletList.forEach((b) => console.log(` - ${b.id} | ${b.name}`))

  const legacyExists = verifiedProducts.some((p) => p.id === "prod-brace-heritage")
  if (legacyExists) {
    throw new Error("Legacy 'prod-brace-heritage' still exists in Neon DB!")
  }

  if (braceletList.length !== 4) {
    throw new Error(`Expected exactly 4 bracelets in Neon DB, found ${braceletList.length}`)
  }

  console.log("SUCCESS: Neon DB updated and verified with exactly the 4 distinct drawstring bracelets.")
}

main().catch((err) => {
  console.error("FATAL ERROR:", err)
  process.exit(1)
})
