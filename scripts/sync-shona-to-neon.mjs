import fs from "fs";
import path from "path";

const NEON_CONNECTION_STRING =
  process.env.NEON_DATABASE_URL ||
  "postgresql://neondb_owner:npg_DR0tIYcQyeX8@ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";
const NEON_HOST = "ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech";

const shonaProducts = [
  {
    id: "prod-shona-white",
    name: "Zimthread 'The Shona Republic' Boxy Tee - White",
    category: "Apparel",
    price: 650,
    stock: 35,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1794674172/zimthreads/products/efmb8kjhrcrmp6dtke9n.jpg",
    images: [
      "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1794674172/zimthreads/products/efmb8kjhrcrmp6dtke9n.jpg",
      "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1794674178/zimthreads/products/edqd5ul58v2zm1o3pt9g.jpg",
    ],
    views: [
      {
        label: "Studio Mockup",
        url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1794674172/zimthreads/products/efmb8kjhrcrmp6dtke9n.jpg",
      },
      {
        label: "Back Artwork (+263)",
        url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1794674178/zimthreads/products/edqd5ul58v2zm1o3pt9g.jpg",
      },
      {
        label: "Clean Studio View",
        url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1794674175/zimthreads/products/gwoltokldjcvruoktjdk.jpg",
      },
    ],
    alt: "The Shona Republic Graphic Boxy Tee - White",
    badge: "HERITAGE ATELIER",
    tag: "Great Zimbabwe Capsule",
    description:
      "260 GSM heavyweight combed cotton boxy-fit graphic tee celebrating Great Zimbabwe stone architecture, conical tower, acacia landscape, and vibrant +263 national colors. Finished with custom Zimthread atelier collar tag.",
    sizes: ["S", "M", "L", "XL", "2XL", "XXL"],
    featured: true,
  },
  {
    id: "prod-shona-black",
    name: "Zimthread 'The Shona Republic' Boxy Tee - Black",
    category: "Apparel",
    price: 650,
    stock: 35,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1794674182/zimthreads/products/rxyhhjo7acwlb2mxnmff.jpg",
    images: [
      "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1794674182/zimthreads/products/rxyhhjo7acwlb2mxnmff.jpg",
      "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1794674186/zimthreads/products/hahdust6qmslhndrjb8v.jpg",
    ],
    views: [
      {
        label: "Studio Mockup",
        url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1794674182/zimthreads/products/rxyhhjo7acwlb2mxnmff.jpg",
      },
      {
        label: "Back Artwork (+263)",
        url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1794674186/zimthreads/products/hahdust6qmslhndrjb8v.jpg",
      },
      {
        label: "Clean Studio View",
        url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1794674184/zimthreads/products/dcpx5n4ii6dxoxbhmqce.jpg",
      },
    ],
    alt: "The Shona Republic Graphic Boxy Tee - Black",
    badge: "HERITAGE ATELIER",
    tag: "Great Zimbabwe Capsule",
    description:
      "260 GSM heavyweight combed cotton boxy-fit graphic tee in stealth black, showcasing contrasting white Great Zimbabwe conical tower artwork and dynamic +263 national brushstrokes on the reverse. Fitted with custom Zimthread atelier collar tag.",
    sizes: ["S", "M", "L", "XL", "2XL", "XXL"],
    featured: true,
  },
];

async function main() {
  console.log("Fetching current products from Neon...");
  const fetchRes = await fetch(`https://${NEON_HOST}/sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": NEON_CONNECTION_STRING,
    },
    body: JSON.stringify({
      query: "SELECT data FROM public.zimthreads_store WHERE key = 'products';",
    }),
  });
  const fetchData = await fetchRes.json();
  const currentProducts = fetchData.rows[0]?.data || [];
  console.log(`Current products in Neon: ${currentProducts.length}`);

  // Merge Shona products into list
  const existingIds = new Set(currentProducts.map((p) => p.id));
  let updatedProducts = [...currentProducts];

  for (const sp of shonaProducts) {
    if (existingIds.has(sp.id)) {
      console.log(`Updating existing product ${sp.id}...`);
      updatedProducts = updatedProducts.map((p) => (p.id === sp.id ? { ...p, ...sp } : p));
    } else {
      console.log(`Adding new product ${sp.id}...`);
      // Insert right after prod-5 if present, or append
      const prod5Idx = updatedProducts.findIndex((p) => p.id === "prod-5");
      if (prod5Idx >= 0) {
        updatedProducts.splice(prod5Idx + 1, 0, sp);
      } else {
        updatedProducts.push(sp);
      }
    }
  }

  console.log(`Updating Neon database with ${updatedProducts.length} products...`);
  const updateRes = await fetch(`https://${NEON_HOST}/sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": NEON_CONNECTION_STRING,
    },
    body: JSON.stringify({
      query: "UPDATE public.zimthreads_store SET data = $1::jsonb, updated_at = NOW() WHERE key = 'products';",
      params: [JSON.stringify(updatedProducts)],
    }),
  });

  const updateResult = await updateRes.json();
  console.log("Neon update result:", updateResult);
  console.log("Successfully synchronized Republic of Shona t-shirts to Neon PostgreSQL!");
}

main().catch(console.error);
