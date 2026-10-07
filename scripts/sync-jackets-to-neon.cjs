const fs = require('fs');
const path = require('path');

// Target Neon Project: rapid-hill-42448439 ("Zimthreads Collective")
// Target Account: anesumupesa@gmail.com / Mupesa
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
  console.log("Verifying target Neon Project ID: rapid-hill-42448439 (Zimthreads Collective)...");
  console.log("Fetching current products from Neon...");

  const rows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';");
  let currentProducts = [];
  if (rows.length > 0 && Array.isArray(rows[0].data)) {
    currentProducts = rows[0].data;
  }
  console.log(`Current products count in DB: ${currentProducts.length}`);

  // Load jackets uploaded cache
  const jacketsCachePath = path.resolve(__dirname, '../jackets-uploaded.json');
  const jacketsCache = JSON.parse(fs.readFileSync(jacketsCachePath, 'utf8'));

  const newJackets = [
    {
      id: "prod-jacket-ferrari-red-leather",
      name: "Ferrari Scuderia Rosso Corsa Vintage Moto Leather Jacket",
      category: "Apparel",
      collectionId: "racing-jackets",
      collectionName: "Retro Motorsport Collection",
      price: 2850,
      stock: 8,
      img: jacketsCache["ferrari-red-leather.png"].cdn_url,
      alt: "Ferrari Scuderia Rosso Corsa Vintage Moto Leather Jacket",
      badge: "LEATHER GRAIN",
      tag: "Archival Moto",
      description:
        "Archival Grand Prix craftsmanship in iconic Rosso Corsa red. Heavyweight premium distressed cowhide leather featuring high-density Scuderia Ferrari chest crest, Shell & Vodafone sponsor patches, embroidered sleeve typography, snap-mandarin collar, and quilted satin interior. Cut in an authentic relaxed 90s moto racing boxy silhouette.",
      sizes: ["S", "M", "L", "XL", "XXL"],
      featured: true,
    },
    {
      id: "prod-jacket-ferrari-pink-white",
      name: "Ferrari Scuderia Blossom Pastel Pink & White Moto Leather Jacket",
      category: "Apparel",
      collectionId: "racing-jackets",
      collectionName: "Retro Motorsport Collection",
      price: 2750,
      stock: 6,
      img: jacketsCache["ferrari-pink-white.png"].cdn_url,
      alt: "Ferrari Scuderia Blossom Pastel Pink & White Moto Leather Jacket",
      badge: "LIMITED EDITION",
      tag: "Statement Leather",
      description:
        "Statement high-contrast colorblock in soft blossom pink and off-white milled leather. Features bold embroidered pink Ferrari lettering across the chest, Italian tricolore arm shields, racing flag number '1', silver-tone zipped slash pockets, and double snap hem tab. The standout centerpiece of the collection.",
      sizes: ["S", "M", "L", "XL"],
      featured: true,
    },
    {
      id: "prod-jacket-mercedes-white-black",
      name: "Mercedes-Benz AMG 'Kompressor' Vintage Moto Leather Jacket",
      category: "Apparel",
      collectionId: "racing-jackets",
      collectionName: "Retro Motorsport Collection",
      price: 2650,
      stock: 10,
      img: jacketsCache["mercedes-white-black.png"].cdn_url,
      alt: "Mercedes-Benz AMG Kompressor Vintage Moto Leather Jacket",
      badge: "TOURING ARCHIVE",
      tag: "Vintage Moto",
      description:
        "Monochrome perfection celebrating Mercedes-Benz touring heritage. Crisp ivory and jet black leather paneling with heavyweight raised chenille-stitched 'MERCEDES' chest bar, AMG and Kompressor sleeve hits, vintage Motul, Veltins, and Allianz motorsport partner embroidery. Fully lined with inner chest stash pocket.",
      sizes: ["S", "M", "L", "XL", "XXL"],
      featured: true,
    },
    {
      id: "prod-jacket-jack-daniels-black",
      name: "Jack Daniel's Old No. 7 NASCAR Cup Series Heritage Pit Bomber",
      category: "Apparel",
      collectionId: "racing-jackets",
      collectionName: "Retro Motorsport Collection",
      price: 1950,
      stock: 10,
      img: jacketsCache["jack-daniels-black.png"].cdn_url,
      alt: "Jack Daniels Old No. 7 NASCAR Cup Series Heritage Pit Bomber",
      badge: "NASCAR HERITAGE",
      tag: "Heavy Brushed Twill",
      description:
        "Authentic NASCAR cup series pit jacket in heavy brushed cotton twill. Enormous high-stitch-count Jack Daniel's Old No. 7 Brand embroidery spanning front, back, and neck, flanked by Nextel, Snap-on, SKF, Okuma, and Sunoco sponsor patches. Vintage boxy cut with contrast white piping and snap throat latch.",
      sizes: ["S", "M", "L", "XL", "XXL"],
      featured: true,
    },
    {
      id: "prod-jacket-mercedes-warsteiner",
      name: "Mercedes-Benz Warsteiner DTM Touring Racing Bomber",
      category: "Apparel",
      collectionId: "racing-jackets",
      collectionName: "Retro Motorsport Collection",
      price: 1950,
      stock: 8,
      img: jacketsCache["mercedes-warsteiner.png"].cdn_url,
      alt: "Mercedes-Benz Warsteiner DTM Touring Racing Bomber",
      badge: "DTM CLASSIC",
      tag: "Touring Satin Twill",
      description:
        "Golden era DTM touring car tribute jacket. Features iconic Warsteiner brewery racing livery and Mercedes three-pointed star embroidery across front and back, Michelin, Bilstein, and Bosch race sponsor badges. Heavyweight satin twill construction with ribbed collar and hem.",
      sizes: ["S", "M", "L", "XL", "XXL"],
    },
    {
      id: "prod-jacket-ferrari-black-red-white",
      name: "Ferrari Scuderia Tricolor Sponsor Team Bomber",
      category: "Apparel",
      collectionId: "racing-jackets",
      collectionName: "Retro Motorsport Collection",
      price: 1900,
      stock: 14,
      img: jacketsCache["ferrari-black-red-white.png"].cdn_url,
      alt: "Ferrari Scuderia Tricolor Sponsor Team Bomber",
      badge: "TEAM PADDOCK",
      tag: "Paddock Bomber",
      description:
        "Classic Maranello paddock colorway featuring bold black, crisp white, and racing red horizontal block panels. High-density embroidered Ferrari chest lettering, Scuderia Ferrari shield, Shell, UPS, and F-1 arm badges with red Puma cat embroidery on neck.",
      sizes: ["S", "M", "L", "XL", "XXL"],
    },
    {
      id: "prod-jacket-ferrari-collar-edition",
      name: "Ferrari F-1 Scuderia Collar Embroidered Track Jacket",
      category: "Apparel",
      collectionId: "racing-jackets",
      collectionName: "Retro Motorsport Collection",
      price: 1900,
      stock: 10,
      img: jacketsCache["ferrari-f1-scuderia-collar-edition.png"].cdn_url,
      alt: "Ferrari F-1 Scuderia Collar Embroidered Track Jacket",
      badge: "SPECIAL DETAILS",
      tag: "Embroidered Collar",
      description:
        "Detailed edition of the Maranello team jacket featuring cursive Ferrari embroidery on both collar wings, custom brass Prancing Horse zip pull, dual front slash hand pockets, and reinforced shoulder piping.",
      sizes: ["S", "M", "L", "XL", "XXL"],
    },
    {
      id: "prod-jacket-bmw-m-power",
      name: "BMW M Power Petronas Track Bomber Jacket",
      category: "Apparel",
      collectionId: "racing-jackets",
      collectionName: "Retro Motorsport Collection",
      price: 1850,
      stock: 12,
      img: jacketsCache["bmw-m-power-black.png"].cdn_url,
      alt: "BMW M Power Petronas Track Bomber Jacket",
      badge: "PADDOCK BOMBER",
      tag: "Stealth Black",
      description:
        "Sleek matte nylon paddock bomber in stealth black. Detailed with the iconic tri-color BMW M Power emblem, Petronas lower-chest typographic branding, Credit Suisse shoulder accents, and Dell sleeve embroidery. Features water-resistant technical windbreaker shell, stand collar, and elasticated cuffs and waistband.",
      sizes: ["S", "M", "L", "XL", "XXL"],
    },
    {
      id: "prod-jacket-ferrari-lower-right",
      name: "Ferrari Scuderia Lower-Split Contrast Track Jacket",
      category: "Apparel",
      collectionId: "racing-jackets",
      collectionName: "Retro Motorsport Collection",
      price: 1850,
      stock: 8,
      img: jacketsCache["ferrari-black-red-lower-right.png"].cdn_url,
      alt: "Ferrari Scuderia Lower-Split Contrast Track Jacket",
      badge: "ASYMMETRIC CUT",
      tag: "Split Racing Shell",
      description:
        "Asymmetrical split racing jacket featuring lower-body contrast panels, heavy-gauge front zipper, reinforced elbow sections, and Scuderia Ferrari racing heraldry across chest and sleeve.",
      sizes: ["S", "M", "L", "XL", "XXL"],
    },
    {
      id: "prod-jacket-red-bull-blue",
      name: "Red Bull Racing Infiniti F1 Cyan & Midnight Paddock Jacket",
      category: "Apparel",
      collectionId: "racing-jackets",
      collectionName: "Retro Motorsport Collection",
      price: 1800,
      stock: 12,
      img: jacketsCache["red-bull-infiniti-blue.png"].cdn_url,
      alt: "Red Bull Racing Infiniti F1 Cyan & Midnight Paddock Jacket",
      badge: "FORMULA 1",
      tag: "Paddock Twill",
      description:
        "Championship-era Formula 1 paddock jacket crafted in technical matte twill. Features electric cyan and deep midnight color blocking, Infiniti Red Bull Racing raised chest badging, Total, Pepe Jeans, and Renault partner embroidery. Breathable athletic mesh interior and concealed inner pocket.",
      sizes: ["S", "M", "L", "XL", "XXL"],
    },
    {
      id: "prod-jacket-red-bull-black-white",
      name: "Red Bull Racing Infiniti Stealth Monochrome Paddock Jacket",
      category: "Apparel",
      collectionId: "racing-jackets",
      collectionName: "Retro Motorsport Collection",
      price: 1800,
      stock: 10,
      img: jacketsCache["red-bull-infiniti-black-white.png"].cdn_url,
      alt: "Red Bull Racing Infiniti Stealth Monochrome Paddock Jacket",
      badge: "STEALTH EDITION",
      tag: "Monochrome F1",
      description:
        "Stealth edition of the Red Bull Racing paddock jacket in monochromatic black, white, and carbon grey. Embroidered Infiniti Red Bull Racing bulls crest, technical raglan shoulder cut, and heavy metal zipper pull. Perfect everyday streetwear piece with subtle racing pedigree.",
      sizes: ["S", "M", "L", "XL", "XXL"],
    },
    {
      id: "prod-jacket-ferrari-red",
      name: "Ferrari Scuderia Rosso Corsa Lightweight Paddock Jacket",
      category: "Apparel",
      collectionId: "racing-jackets",
      collectionName: "Retro Motorsport Collection",
      price: 1800,
      stock: 10,
      img: jacketsCache["ferrari-red.png"].cdn_url,
      alt: "Ferrari Scuderia Rosso Corsa Lightweight Paddock Jacket",
      badge: "ROSSO CORSA",
      tag: "Lightweight Layer",
      description:
        "All-red Rosso Corsa paddock jacket with clean white racing stripe accents. Scuderia Ferrari crest on chest, sponsor arm badges, and full-zip front. Lightweight, versatile daily layering piece.",
      sizes: ["S", "M", "L", "XL", "XXL"],
    },
    {
      id: "prod-jacket-audi-sport-red",
      name: "Audi Sport Quattro Rallye Crimson Racing Shell",
      category: "Apparel",
      collectionId: "racing-jackets",
      collectionName: "Retro Motorsport Collection",
      price: 1750,
      stock: 8,
      img: jacketsCache["audi-sport-red.png"].cdn_url,
      alt: "Audi Sport Quattro Rallye Crimson Racing Shell",
      badge: "RALLYE HERITAGE",
      tag: "Technical Shell",
      description:
        "Vibrant crimson red Audi Sport heritage jacket. Celebrates Audi's Quattro rally dominance with bold Audi rings, Audi Sport diagonal slash badge, Castrol, and Michelin sleeve patches. Lightweight weather-resistant technical fabric with breathable lining.",
      sizes: ["S", "M", "L", "XL", "XXL"],
    },
    {
      id: "prod-jacket-ferrari-windbreaker",
      name: "Ferrari F-1 Scuderia Technical Windbreaker Shell",
      category: "Apparel",
      collectionId: "racing-jackets",
      collectionName: "Retro Motorsport Collection",
      price: 1750,
      stock: 12,
      img: jacketsCache["ferrari-f1-tricolor-windbreaker.png"].cdn_url,
      alt: "Ferrari F-1 Scuderia Technical Windbreaker Shell",
      badge: "WINDBREAKER",
      tag: "Weather Resistant",
      description:
        "Lightweight technical windbreaker version of the Scuderia Ferrari team uniform. Weather-resistant shell, breathable mesh lining, stand-up collar with zip shield, and high-visibility block paneling.",
      sizes: ["S", "M", "L", "XL", "XXL"],
    },
  ];

  // Merge jackets into existing products
  const jacketIds = new Set(newJackets.map(j => j.id));
  const nonJackets = currentProducts.filter(p => !jacketIds.has(p.id));

  const allMerged = [...newJackets, ...nonJackets];

  console.log(`Writing ${allMerged.length} total products to Neon DB public.zimthreads_store...`);

  const updateQuery = `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW()
    RETURNING key;
  `;

  await executeSql(updateQuery, ['products', JSON.stringify(allMerged)]);
  console.log("Successfully synced all 14 jackets to Neon Database (rapid-hill-42448439)!");
}

main().catch(err => {
  console.error("Neon update failed:", err);
  process.exit(1);
});
