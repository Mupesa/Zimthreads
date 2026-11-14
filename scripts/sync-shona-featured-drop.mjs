import fs from "fs";

const NEON_CONNECTION_STRING =
  process.env.NEON_DATABASE_URL ||
  "postgresql://neondb_owner:npg_DR0tIYcQyeX8@ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";
const NEON_HOST = "ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech";

const newFeaturedDrop = {
  enabled: true,
  badge: "NEW DROP · HERITAGE ATELIER",
  title: 'THE "SHONA REPUBLIC" BOXY TEE',
  subtitle: "260 GSM Heavyweight Streetwear Cut",
  description:
    "260 GSM heavyweight combed cotton boxy-fit graphic tee celebrating Great Zimbabwe stone architecture, conical tower, acacia landscape, and vibrant +263 national colors. Finished with custom Zimthread atelier collar tag.",
  imageUrl:
    "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1794674172/zimthreads/products/efmb8kjhrcrmp6dtke9n.jpg",
  productId: "prod-shona-white",
  priceText: "Rs 650",
  ctaText: "Shop This Drop",
  secondaryCtaText: "Inquire via WhatsApp",
  tag: "Heritage Atelier Exclusive",
};

async function main() {
  console.log("Fetching settings from Neon...");
  const fetchRes = await fetch(`https://${NEON_HOST}/sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": NEON_CONNECTION_STRING,
    },
    body: JSON.stringify({
      query: "SELECT data FROM public.zimthreads_store WHERE key = 'settings';",
    }),
  });
  const fetchData = await fetchRes.json();
  const currentSettings = fetchData.rows[0]?.data || {};
  console.log("Current featuredDrop in Neon was:", currentSettings.featuredDrop?.title);

  const updatedSettings = {
    ...currentSettings,
    featuredDrop: newFeaturedDrop,
  };

  console.log("Updating Neon database settings with The Shona Republic featuredDrop...");
  const updateRes = await fetch(`https://${NEON_HOST}/sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": NEON_CONNECTION_STRING,
    },
    body: JSON.stringify({
      query: "UPDATE public.zimthreads_store SET data = $1::jsonb, updated_at = NOW() WHERE key = 'settings';",
      params: [JSON.stringify(updatedSettings)],
    }),
  });

  const updateResult = await updateRes.json();
  console.log("Neon update result:", updateResult);
  console.log("Successfully set 'THE SHONA REPUBLIC BOXY TEE' as featuredDrop in Neon database!");
}

main().catch(console.error);
