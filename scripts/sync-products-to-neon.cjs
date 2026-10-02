const fs = require('fs');
const path = require('path');

const NEON_CONNECTION_STRING =
  process.env.NEON_DATABASE_URL ||
  "postgresql://neondb_owner:npg_DR0tIYcQyeX8@ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";

const NEON_HOST = "ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech";

async function executeSql(query, params = []) {
  const response = await fetch(`https://${NEON_HOST}/sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": NEON_CONNECTION_STRING,
    },
    body: JSON.stringify({ query, params }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Neon SQL error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.rows || [];
}

async function main() {
  console.log("Fetching current products from Neon...");
  const rows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';");
  let currentProducts = [];
  if (rows.length > 0 && Array.isArray(rows[0].data)) {
    currentProducts = rows[0].data;
  }
  console.log(`Current products in DB count: ${currentProducts.length}`);

  // Load uploaded bracelets cache
  const cachePath = path.resolve(__dirname, '../bracelets-uploaded.json');
  const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

  const bracelets = [
    {
      id: "brace-01",
      name: '"Les 4 Couleurs" Mauritius Quad Beaded Bracelet',
      category: "Accessories",
      price: 320,
      stock: 50,
      img: cache["exec-083bf4e8-80fc-4ab0-a56b-245753e14fa0.png"].cdn_url,
      alt: "Les 4 Couleurs Mauritius Beaded Bracelet - Red, Blue, Yellow, Green",
      description:
        "Artisan-crafted 4-band beaded bracelet celebrating the iconic colors of Mauritius (Les 4 Couleurs: Rouge, Bleu, Jaune, Vert). Hand-strung with high-density polished glass beads on reinforced stretch-cord for a flexible, comfortable all-day fit.\n\nPRESALE EXCLUSIVE · Handcrafted in limited artisan batches.",
      sizes: ["One Size (Stretch Fit)"],
      featured: true,
      isPreorder: true,
      isPresale: true,
      tag: "Mauritius",
      badge: "PRESALE",
      preorderDeadline: "Presale Open · Rs 320"
    },
    {
      id: "brace-02",
      name: '"Moris" Island Quad Beaded Stack',
      category: "Accessories",
      price: 320,
      stock: 50,
      img: cache["exec-0b4e3477-b20a-4c4e-b588-e22cf4656266.png"].cdn_url,
      alt: "Moris Quad Beaded Stack Bracelet - Mauritian Colors",
      description:
        "Subtle profile Mauritian heritage bead stack in crimson, ocean blue, sunlight yellow, and palm green. Hand-tensioned elastic core with gloss ceramic-finish beads.\n\nPRESALE EXCLUSIVE · Handcrafted in limited artisan batches.",
      sizes: ["One Size (Stretch Fit)"],
      featured: true,
      isPreorder: true,
      isPresale: true,
      tag: "Mauritius",
      badge: "PRESALE",
      preorderDeadline: "Presale Open · Rs 320"
    },
    {
      id: "brace-03",
      name: '"Uhuru" Pan-African Tri-Tone Beaded Band',
      category: "Accessories",
      price: 320,
      stock: 50,
      img: cache["exec-1fd7ac2e-effb-4711-aea5-67ad52b36615.png"].cdn_url,
      alt: "Uhuru Pan-African Tri-Tone Beaded Band - Black, Gold, Red",
      description:
        "Bold tri-tone beaded wristband crafted in onyx black, radiant gold, and vibrant red. Symbolizing sovereignty, wealth of the land, and cultural resilience.\n\nPRESALE EXCLUSIVE · Handcrafted in limited artisan batches.",
      sizes: ["One Size (Stretch Fit)"],
      featured: true,
      isPreorder: true,
      isPresale: true,
      tag: "Pan-African",
      badge: "PRESALE",
      preorderDeadline: "Presale Open · Rs 320"
    },
    {
      id: "brace-04",
      name: '"Mzansi" South Africa Flag Beaded Band',
      category: "Accessories",
      price: 320,
      stock: 50,
      img: cache["exec-518a0b58-c459-4e87-ad7c-5d9c445dddee.png"].cdn_url,
      alt: "Mzansi South Africa Flag Beaded Band",
      description:
        "Hand-woven beaded bracelet in South Africa's iconic six-color flag palette. Detailed micro-beadwork depicting the iconic Y-chevron emblem on stretch cord.\n\nPRESALE EXCLUSIVE · Handcrafted in limited artisan batches.",
      sizes: ["One Size (Stretch Fit)"],
      featured: true,
      isPreorder: true,
      isPresale: true,
      tag: "South Africa",
      badge: "PRESALE",
      preorderDeadline: "Presale Open · Rs 320"
    },
    {
      id: "brace-05",
      name: '"Naija" Nigeria Tricolor Beaded Band',
      category: "Accessories",
      price: 320,
      stock: 50,
      img: cache["exec-61d903f9-5750-40d2-b5f1-012c302a6a05.png"].cdn_url,
      alt: "Naija Nigeria Green and White Beaded Band",
      description:
        "Minimalist green-white-green stacked beadwork celebrating Nigerian unity and prosperity. Vibrant emerald gloss beads contrasted with crisp chalk-white center rows.\n\nPRESALE EXCLUSIVE · Handcrafted in limited artisan batches.",
      sizes: ["One Size (Stretch Fit)"],
      featured: true,
      isPreorder: true,
      isPresale: true,
      tag: "Nigeria",
      badge: "PRESALE",
      preorderDeadline: "Presale Open · Rs 320"
    },
    {
      id: "brace-06",
      name: '"Harambee" Kenya Flag Striped Beaded Band',
      category: "Accessories",
      price: 320,
      stock: 50,
      img: cache["exec-6e29244c-7307-4e85-90e0-3e63ae6c64c6.png"].cdn_url,
      alt: "Harambee Kenya Flag Striped Beaded Band",
      description:
        "Classic Kenyan flag beaded bracelet in jet black, blood red, emerald green, and fine white accent margins. Finished with elastic comfort fitting.\n\nPRESALE EXCLUSIVE · Handcrafted in limited artisan batches.",
      sizes: ["One Size (Stretch Fit)"],
      featured: true,
      isPreorder: true,
      isPresale: true,
      tag: "Kenya",
      badge: "PRESALE",
      preorderDeadline: "Presale Open · Rs 320"
    },
    {
      id: "brace-07",
      name: '"Roots & Culture" Gold, Green & Onyx Beaded Band',
      category: "Accessories",
      price: 320,
      stock: 50,
      img: cache["exec-70c0be2f-8aca-4126-8c68-616a8b95473c.png"].cdn_url,
      alt: "Roots & Culture Gold, Green & Onyx Beaded Band",
      description:
        "Pan-African & Jamaican heritage color-blocked beaded bracelet. Features structured bands of deep green, radiant gold, and midnight black.\n\nPRESALE EXCLUSIVE · Handcrafted in limited artisan batches.",
      sizes: ["One Size (Stretch Fit)"],
      featured: true,
      isPreorder: true,
      isPresale: true,
      tag: "Heritage",
      badge: "PRESALE",
      preorderDeadline: "Presale Open · Rs 320"
    },
    {
      id: "brace-08",
      name: '"Maasai Warrior" Shield Beaded Bracelet',
      category: "Accessories",
      price: 320,
      stock: 50,
      img: cache["exec-8f0d03ac-802d-492f-9779-017ec4f8c669.png"].cdn_url,
      alt: "Maasai Warrior Shield Beaded Bracelet",
      description:
        "Authentic East African Maasai beaded bracelet featuring the traditional warrior shield crest centerpiece with crossed spears on the national flag band.\n\nPRESALE EXCLUSIVE · Handcrafted in limited artisan batches.",
      sizes: ["One Size (Stretch Fit)"],
      featured: true,
      isPreorder: true,
      isPresale: true,
      tag: "Kenya / Maasai",
      badge: "PRESALE",
      preorderDeadline: "Presale Open · Rs 320"
    },
    {
      id: "brace-09",
      name: '"Kingdom of Eswatini" Nguni Shield Beaded Bracelet',
      category: "Accessories",
      price: 320,
      stock: 50,
      img: cache["exec-b36da025-0722-4ee2-84bd-53f3263ba8bb.png"].cdn_url,
      alt: "Kingdom of Eswatini Nguni Shield Beaded Bracelet",
      description:
        "Royal Swazi heritage beadwork in sapphire blue, crimson red, and sun gold, flanked with the traditional monochrome Nguni ox-hide battle shield.\n\nPRESALE EXCLUSIVE · Handcrafted in limited artisan batches.",
      sizes: ["One Size (Stretch Fit)"],
      featured: true,
      isPreorder: true,
      isPresale: true,
      tag: "Eswatini",
      badge: "PRESALE",
      preorderDeadline: "Presale Open · Rs 320"
    },
    {
      id: "brace-10",
      name: '"Protea Wide Cuff" South Africa Beaded Bracelet',
      category: "Accessories",
      price: 320,
      stock: 50,
      img: cache["exec-e65c2f5a-99d8-4460-bea3-6e57283b4c92.png"].cdn_url,
      alt: "Protea Wide Cuff South Africa Beaded Bracelet",
      description:
        "Statement wide cuff bracelet intricately hand-woven with thousands of glass beads into the full South African national emblem. Dense, structured, and vibrant.\n\nPRESALE EXCLUSIVE · Handcrafted in limited artisan batches.",
      sizes: ["One Size (Stretch Fit)"],
      featured: true,
      isPreorder: true,
      isPresale: true,
      tag: "South Africa",
      badge: "PRESALE",
      preorderDeadline: "Presale Open · Rs 320"
    },
    {
      id: "brace-11",
      name: '"Éléphant" Côte d\'Ivoire Tricolor Beaded Cuff',
      category: "Accessories",
      price: 320,
      stock: 50,
      img: cache["exec-e97e7138-ff8e-4825-9e76-3c0dcbc16d61.png"].cdn_url,
      alt: "Éléphant Côte d'Ivoire Tricolor Beaded Cuff",
      description:
        "West African tricolor beaded cuff featuring high-gloss beads in mandarin orange, pearl white, and savanna green. Ergonomic tubular weave with gentle flex.\n\nPRESALE EXCLUSIVE · Handcrafted in limited artisan batches.",
      sizes: ["One Size (Stretch Fit)"],
      featured: true,
      isPreorder: true,
      isPresale: true,
      tag: "Côte d'Ivoire",
      badge: "PRESALE",
      preorderDeadline: "Presale Open · Rs 320"
    },
    {
      id: "brace-12",
      name: '"Black Star" Ghana Heritage Beaded Cuff',
      category: "Accessories",
      price: 320,
      stock: 50,
      img: cache["exec-f491b72b-207f-405a-bf07-967d793f2546.png"].cdn_url,
      alt: "Black Star Ghana Heritage Beaded Cuff",
      description:
        "Iconic Ghanaian Pan-African cuff featuring the black lodestar centerpiece flanked by rich gold beads, bordered with red and green bands.\n\nPRESALE EXCLUSIVE · Handcrafted in limited artisan batches.",
      sizes: ["One Size (Stretch Fit)"],
      featured: true,
      isPreorder: true,
      isPresale: true,
      tag: "Ghana",
      badge: "PRESALE",
      preorderDeadline: "Presale Open · Rs 320"
    }
  ];

  // Keep existing non-bracelet products (like prod-zim-02 and prod-5)
  const nonBracelets = currentProducts.filter(p => !p.id.startsWith("brace-"));
  
  // Combine bracelets at the front, followed by the rest
  const mergedProducts = [...bracelets, ...nonBracelets];

  console.log(`Writing ${mergedProducts.length} products to Neon public.zimthreads_store...`);

  const updateQuery = `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW()
    RETURNING key;
  `;

  await executeSql(updateQuery, ['products', JSON.stringify(mergedProducts)]);
  console.log("Successfully updated Neon database with all 12 bracelets!");
}

main().catch(err => {
  console.error("Neon update failed:", err);
  process.exit(1);
});
