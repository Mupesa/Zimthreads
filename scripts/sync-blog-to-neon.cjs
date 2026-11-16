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
      id: "post-shona-republic-manifesto",
      title: "THE REPUBLICS OF ZIMBABWE: CULTURAL SOVEREIGNTY, DIVERSITY, AND THE STORY BEHIND THE SHONA REPUBLIC BOXY TEE",
      excerpt:
        "Beyond borders and statehood lies the sovereign soul of heritage. Discover how Zimthreads reimagines Zimbabwe's pluralistic cultural identities—from Great Zimbabwe stone masonry to Binga weaving—engineered into a 260 GSM streetwear statement.",
      content: `In the lexicon of modern geopolitics, a "republic" is defined by delineated borders, parliamentary halls, and legal constitutions. But long before lines were etched across African soil with surveyor ink, sovereign domains of memory, art, and philosophy flourished across the plateau between the Zambezi and the Limpopo.

At Zimthreads Collective, when we speak of "The Republics of Zimbabwe", we do not speak of division, secession, or political friction. We speak of Cultural Sovereignty—an empowering, elevated celebration of the distinct ancestral domains that collectively compose our national identity.

To honor the Shona Republic is not to elevate one voice above the rest; it is to inaugurate an intentional, pan-Zimbabwean series where every heritage receives the reverence of high-fashion curation: Shona Republic, Ndebele Republic, Tsonga Republic, and Tonga Republic.

### The Cultural Pillars of the Republics

• The Shona Republic: Rooted in the ancient civilizational heights of the Mutapa and Rozvi Empires and the stone-hewn grandeur of Dzimba-dza-Mabwe (Great Zimbabwe). It celebrates dry-stone masonry, ancient metallurgy, the reflective wisdom of the dare (sacred communal council), and the spiritual pulse of the mbira dzaVadzimu.

• The Ndebele Republic: Built upon the martial nobility and sovereign dignity (isidima) founded by King Mzilikazi and preserved through King Lobengula. It lives through intricate beadwork (ubuhlalu), bold geometric homestead murals (amabala), and an unwavering tradition of pride and courage.

• The Tsonga (Shangaan) Republic: Custodians of the radiant southeastern lowveld and the Save-Limpopo basin. Celebrated for the dynamic swirling kinetic beauty of the Xibelani dance skirts, vibrant textiles, profound ecological wisdom, and timeless storytelling.

• The Tonga Republic: The eternal guardians of the great Zambezi River (Gwembe Valley). Their legacy carries the sacred mythology of the Nyami Nyami river deity, intimate stewardship of water systems, and the globally celebrated precision of hand-woven Binga baskets.

### Deconstructing The Shona Republic Boxy Tee

The inaugural drop in our Heritage Capsule merges vintage collegiate athletic codes with profound Southern African historical iconography:

1. Distressed Collegiate Typography: The bold arch of "THE SHONA REPUBLIC" draws inspiration from vintage athletic varsity apparel, subverting traditional Western collegiate logos with African sovereign pride.
2. The Great Enclosure & Conical Tower (Chikuva): Central to the illustration is the conical stone tower of Great Zimbabwe. Standing 10 meters tall, erected between the 11th and 15th centuries using interlocking granite blocks without a single droplet of mortar.
3. The Sacred Acacia Tree (Muunga): Flanking the stone towers is the sprawling umbrella canopy of the native Acacia, representing shade, endurance in arid seasons, and the physical location of the dare—the ancestral council of wisdom.
4. The Chevron Stone Pattern (Nhodo): Framed along the lower borders is the double-chevron masonry pattern carved along the outer wall of Great Zimbabwe, symbolizing fertility, the ripple of life-giving water, royal dignity, and unbroken generational continuity.

### The Reverse Canvas: The Diasporic Heartbeat (+263)

• The "+263" Calling Code: Spanning the upper back in bold, energetic, street-art brushstrokes, the country code +263 serves as the universal passport of the Zimbabwean diaspora worldwide.
• The Expressive Tricolor Slashes: Sweeping across and behind the numerals are dynamic brushstrokes bearing Zimbabwe's iconic colors—Green (fertile earth & vegetation), Gold/Yellow (unmined mineral wealth & sunshine), and Red (liberation, courage & fierce resilience).

### Garment Engineering & Tailoring Details

• 260 GSM Heavyweight Combed Cotton: Substantial, heavyweight fabric with an ultra-soft hand-feel that drapes with architectural presence.
• The 90s Boxy Drop-Shoulder Silhouette: Generously widened across the chest, relaxed dropped shoulder seams, and roomy sleeves that break cleanly at the elbow.
• Anti-Sag 1.25" High-Density Ribbed Collar: Double-needle stitched neckband tailored to fit snug against the collarbone, engineered to resist stretching or warping.
• Bespoke Zimthreads Atelier Woven Collar Label: Finished with signature studio hang-tag and care labelling certifying small-batch atelier provenance.

*We do not wear our history to live in yesterday. We wear our history to anchor who we are tomorrow.*`,
      category: "Knowledge & Culture",
      date: "Nov 16, 2026",
      img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1794674172/zimthreads/products/efmb8kjhrcrmp6dtke9n.jpg",
      alt: "The Shona Republic Graphic Boxy Tee - Heritage Atelier Showcase",
      readTime: "6 min read",
      author: "Zimthreads Atelier",
    },
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
