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

  const singleBraceletProduct = {
    id: "prod-brace-heritage",
    name: "Zimthread African Heritage Beaded Bracelet",
    category: "Accessories",
    price: 320,
    stock: 120,
    img: cache["exec-083bf4e8-80fc-4ab0-a56b-245753e14fa0.png"].cdn_url,
    images: [
      cache["exec-083bf4e8-80fc-4ab0-a56b-245753e14fa0.png"].cdn_url,
      cache["exec-518a0b58-c459-4e87-ad7c-5d9c445dddee.png"].cdn_url,
      cache["exec-8f0d03ac-802d-492f-9779-017ec4f8c669.png"].cdn_url,
      cache["exec-f491b72b-207f-405a-bf07-967d793f2546.png"].cdn_url,
      cache["exec-61d903f9-5750-40d2-b5f1-012c302a6a05.png"].cdn_url,
      cache["exec-6e29244c-7307-4e85-90e0-3e63ae6c64c6.png"].cdn_url,
      cache["exec-0b4e3477-b20a-4c4e-b588-e22cf4656266.png"].cdn_url,
      cache["exec-1fd7ac2e-effb-4711-aea5-67ad52b36615.png"].cdn_url,
      cache["exec-70c0be2f-8aca-4126-8c68-616a8b95473c.png"].cdn_url,
      cache["exec-b36da025-0722-4ee2-84bd-53f3263ba8bb.png"].cdn_url,
      cache["exec-e65c2f5a-99d8-4460-bea3-6e57283b4c92.png"].cdn_url,
      cache["exec-e97e7138-ff8e-4825-9e76-3c0dcbc16d61.png"].cdn_url,
    ],
    views: [
      {
        label: 'Mauritius "Les 4 Couleurs" Quad Stack',
        url: cache["exec-083bf4e8-80fc-4ab0-a56b-245753e14fa0.png"].cdn_url,
      },
      {
        label: 'Mauritius "Moris" Island Band',
        url: cache["exec-0b4e3477-b20a-4c4e-b588-e22cf4656266.png"].cdn_url,
      },
      {
        label: 'Pan-African "Uhuru" Tri-Tone Band',
        url: cache["exec-1fd7ac2e-effb-4711-aea5-67ad52b36615.png"].cdn_url,
      },
      {
        label: 'South Africa "Mzansi" Flag Band',
        url: cache["exec-518a0b58-c459-4e87-ad7c-5d9c445dddee.png"].cdn_url,
      },
      {
        label: 'Nigeria "Naija" Green & White Band',
        url: cache["exec-61d903f9-5750-40d2-b5f1-012c302a6a05.png"].cdn_url,
      },
      {
        label: 'Kenya "Harambee" Flag Striped Band',
        url: cache["exec-6e29244c-7307-4e85-90e0-3e63ae6c64c6.png"].cdn_url,
      },
      {
        label: 'Heritage "Roots & Culture" Band',
        url: cache["exec-70c0be2f-8aca-4126-8c68-616a8b95473c.png"].cdn_url,
      },
      {
        label: 'Kenya "Maasai Warrior" Shield Band',
        url: cache["exec-8f0d03ac-802d-492f-9779-017ec4f8c669.png"].cdn_url,
      },
      {
        label: "Kingdom of Eswatini Nguni Shield",
        url: cache["exec-b36da025-0722-4ee2-84bd-53f3263ba8bb.png"].cdn_url,
      },
      {
        label: 'South Africa "Protea" Wide Cuff',
        url: cache["exec-e65c2f5a-99d8-4460-bea3-6e57283b4c92.png"].cdn_url,
      },
      {
        label: 'Côte d\'Ivoire "Éléphant" Tricolor Cuff',
        url: cache["exec-e97e7138-ff8e-4825-9e76-3c0dcbc16d61.png"].cdn_url,
      },
      {
        label: 'Ghana "Black Star" Heritage Cuff',
        url: cache["exec-f491b72b-207f-405a-bf07-967d793f2546.png"].cdn_url,
      },
    ],
    alt: "Zimthread African Heritage Beaded Bracelet Collection",
    description:
      "Hand-strung artisan beaded bracelet collection celebrating African national flags and cultural heritage. Crafted with high-density polished glass beads on durable reinforced elastic stretch-cord for a flexible, comfortable all-day fit.\n\nPRESALE EXCLUSIVE · Rs 320 each · Slide through options to choose your edition.",
    sizes: ["One Size (Stretch Fit)"],
    featured: true,
    isPreorder: true,
    isPresale: true,
    badge: "PRESALE",
    preorderDeadline: "Presale Open · Rs 320",
  };

  // Keep existing products like prod-zim-02 and prod-5
  const nonBracelets = currentProducts.filter(p => !p.id.startsWith("brace-"));
  
  // Clean products array: Zimbabwe jersey first, then the unified bracelet collection card, then apparel
  const existingJersey = nonBracelets.find(p => p.id === "prod-zim-02");
  const jerseyProduct = {
    ...(existingJersey || {}),
    id: "prod-zim-02",
    name: "Zimthread Zimbabwe '02' Heritage Jersey",
    category: "Apparel",
    price: 750,
    stock: 50,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1790842891/zimthreads/products/d7oauktons2oaunl3nnp.png",
    images: [
      "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1790842891/zimthreads/products/d7oauktons2oaunl3nnp.png",
      "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1790842917/zimthreads/products/fhxh4msyd0asmpbolrot.png",
    ],
    views: [
      {
        label: "Front View",
        url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1790842891/zimthreads/products/d7oauktons2oaunl3nnp.png",
      },
      {
        label: "Back View",
        url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1790842917/zimthreads/products/fhxh4msyd0asmpbolrot.png",
      },
    ],
    alt: "Zimthread Zimbabwe 02 Heritage Jersey Front and Back",
    description:
      "Official Zimthread Limited Pre-Order Kit. Premium performance jersey featuring the iconic Zimbabwe National bird crest on the chest, subtle right-chest Zimthread branding, and classic 'ZIMBABWE 02' lettering on the back in national green and gold. Orders strictly close Sunday evening.\n\nPersonalize with your Custom Name printed on the back above '02' for +Rs 50.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    featured: true,
    isPreorder: true,
    preorderDeadline: "Closes Sunday Evening",
    allowCustomName: true,
    customNamePrice: 50,
  };

  // Clean products array: Zimbabwe jersey first, then the unified bracelet collection card, then apparel
  const allCatalog = [
    jerseyProduct,
    singleBraceletProduct,
    ...nonBracelets.filter(p => p.id !== "prod-zim-02" && p.id !== "prod-brace-heritage")
  ];

  // Ensure unique by ID
  const seenIds = new Set();
  const mergedProducts = allCatalog.filter(p => {
    if (seenIds.has(p.id)) return false;
    seenIds.add(p.id);
    return true;
  });

  console.log(`Writing ${mergedProducts.length} catalog products to Neon public.zimthreads_store...`);

  const updateQuery = `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW()
    RETURNING key;
  `;

  await executeSql(updateQuery, ['products', JSON.stringify(mergedProducts)]);
  console.log("Successfully updated Neon database with unified bracelet product card!");
}

main().catch(err => {
  console.error("Neon update failed:", err);
  process.exit(1);
});
