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
  console.log("Syncing blog posts to Neon DB (rapid-hill-42448439)...");

  const blogPosts = [
    {
      id: "post-llicyland-dice-collab",
      title: 'OWN THE DRIP: THE "LLICYLAND" DICE ROLL STREETWEAR COLLABORATION',
      excerpt:
        "Zimthread Collective teams up with Designer Llicious to unveil the LLICYLAND Boxy Tee — heavyweight combed cotton, signature red dice graphics, and relaxed oversized silhouette.",
      content: `Streetwear is a language of bold statements, cultural heritage, and uncompromising quality. Zimthread Collective is proud to officially unveil the **LLICYLAND Collection** — an exclusive collaboration with **Designer Llicious** celebrating luck, risk, and raw urban aesthetic.

### The Dice Edition: Symbol of Luck & Culture
The centerpiece of the drop is the signature **LLICYLAND Boxy Tee**, showcasing glossy 3D-rendered red dice spelling out LLICYLAND across the chest. The dice motif is a tribute to taking chances, street culture resilience, and rolling high stakes with every drop.

### Crafted for the Streets, Designed for Everyday
Engineered for those who demand both structural integrity and effortless drape:
- **260+ GSM Heavyweight Combed Cotton**: Thick, structured, and pre-shrunk to retain its silhouette through repeated wears and washes.
- **Relaxed Drop-Shoulder Oversized Silhouette**: Cut with roomy sleeves, dropped shoulder seams, and a snug ribbed crew collar that won't sag.
- **High-Definition Direct-To-Film (DTF) Graphics**: Vivid crimson red dice typography with high-gloss finish and stretch-resistant durability.
- **Signature Atelier Woven Label**: Hand-stitched Zimthread Collective hem tag certifying genuine small-batch atelier craftsmanship.

### Style Guide: How to Rock the Drop
Pair the LLICYLAND Boxy Tee with relaxed neutral cargo trousers, minimal silver chain jewellery, and fresh all-black or triple-white kicks restored by the Zimthread cleaning lab.

### Limited Drop Availability
The LLICYLAND Collection is strictly limited in quantity. Available now exclusively through the Zimthread Collective online shop with islandwide delivery across Mauritius and international collection orders.

*Own the drip. Built for the culture. Made to last.*`,
      category: "Apparel",
      date: "Oct 2, 2026",
      img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1790959536/zimthreads/blog/oqpojiputsm4qndzgstg.jpg",
      alt: "Zimthread Collective x LLICYLAND Dice Roll Streetwear Collection 2025 poster featuring the oversized white graphic tee and editorial model",
      readTime: "4 min read",
      author: "Designer Llicious",
    },
    {
      id: "post-1",
      title: "How Often Should You Clean Your Shoes?",
      excerpt:
        "Keep your kicks fresh all year. Here's a breakdown of cleaning intervals based on usage, weather, and fabric type.",
      content: `Shoes are an investment, whether they are daily beaters, gym runners, or prized collection grails. But how often should you actually clean them?

### 1. The Daily Check
After walking through dusty streets or rainy puddles, a quick 30-second wipe with a damp microfiber cloth prevents dirt from embedding into canvas and leather micro-pores.

### 2. Bi-Weekly Routine
For shoes worn 3–4 days a week, a bi-weekly wash with our gentle foaming cleanser removes oil, sweat, and street grime without stripping natural leather moisture.

### 3. Monthly Deep Clean
Give your sneakers a complete midsole scrub, insole wash, and deodorizing soak once a month.

### 4. Suede & Nubuck Caution
Never submerge suede in water! Use our brass-bristle brush dry, followed by a dedicated suede eraser for scuff marks.`,
      category: "Shoe Care",
      date: "Aug 12, 2026",
      img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=500&fit=crop&auto=format",
      alt: "White sneakers being cleaned",
      readTime: "4 min read",
      author: "Shepherd Chara",
    },
    {
      id: "post-2",
      title: "Best Products for Sneaker Care in 2026",
      excerpt:
        "The right products make all the difference. Our top picks for maintaining spotless footwear.",
      content: `Choosing the right shoe care kit can save you hundreds of dollars in premature replacements. Here are the essentials tested by our studio team:

- **Enzyme-Based Cleaners**: Unlike harsh household detergents that yellow soles, enzyme solutions break down organic dirt without bleaching.
- **Hog Hair Brushes**: Soft enough for delicate flyknit mesh and soft leathers.
- **Creep Rubber Erasers**: The golden standard for stubborn grease and scuff removal on suede.
- **Hydrophobic Protective Sprays**: Applied every 4 weeks to create an invisible liquid barrier.`,
      category: "Products",
      date: "Jul 28, 2026",
      img: "https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?w=800&h=500&fit=crop&auto=format",
      alt: "Sneaker care products lined up",
      readTime: "6 min read",
      author: "Davies L .M",
    },
    {
      id: "post-3",
      title: "Custom Apparel Trends in Zimbabwe & Beyond",
      excerpt:
        "What's trending in streetwear this year — from oversized silhouettes to minimalist high-density embroidery.",
      content: `Streetwear across Southern Africa is experiencing a renaissance. Zimthread Collective sits at the intersection of heritage artistry and modern urban cuts.

Key aesthetic trends we are producing this season:
- **Heavyweight 400+ GSM Boxy Cuts**: Dropped shoulders, durable collar ribbing, and minimal shrinkage.
- **Tonal & Subtle Monograms**: Discreet embroidery matching the fabric hue for low-key luxury.
- **Direct-to-Film (DTF) Graphics**: High-definition, hyper-vibrant prints with extreme wash resistance.`,
      category: "Apparel",
      date: "Jul 10, 2026",
      img: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=800&h=500&fit=crop&auto=format",
      alt: "Custom apparel on display",
      readTime: "5 min read",
      author: "Anesu M",
    },
    {
      id: "post-4",
      title: "The Science Behind Deep Cleaning Suede",
      excerpt:
        "Suede is notoriously delicate. Here is how our lab restores texture without water stains.",
      content: `Suede is the underside of animal hide, which gives it that signature velvety nap. Because it lacks the tough outer epidermis, moisture easily causes the fibres to clump and discolor.

When restoring suede at Zimthread:
1. We brush the nap dry in one continuous direction.
2. We apply dry cleaning foam that suspends dirt without penetrating deep into the leather core.
3. We brush out the nap as it dries to maintain that plush, velvety feel.`,
      category: "Shoe Care",
      date: "Jun 22, 2026",
      img: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&h=500&fit=crop&auto=format",
      alt: "Suede shoe cleaning",
      readTime: "7 min read",
      author: "Shepherd Chara",
    },
  ];

  const updateQuery = `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW()
    RETURNING key;
  `;

  await executeSql(updateQuery, ['blog_posts', JSON.stringify(blogPosts)]);
  console.log(`Successfully synced ${blogPosts.length} blog posts to Neon DB!`);
}

main().catch(err => {
  console.error("Sync failed:", err);
  process.exit(1);
});
