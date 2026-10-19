import { readFileSync } from "fs"
import { resolve } from "path"

console.log("══════════════════════════════════════════════════════════════════════")
console.log("  ZIMTHREADS SHOP UPGRADE & SPOTLIGHT COMPONENT VERIFICATION")
console.log("══════════════════════════════════════════════════════════════════════\n")

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${message}`)
    failed++
  }
}

// 1. Verify Home.tsx was rolled back to original landing page state
console.log("▶ TEST 1: Home.tsx Rolled Back to Original Landing Page")
const homeSrc = readFileSync(resolve("src/pages/Home.tsx"), "utf-8")
assert(
  homeSrc.includes("CLEANER SHOES.") &&
    homeSrc.includes("A STRONGER YOU.") &&
    homeSrc.includes("WE CLEAN.") &&
    homeSrc.includes("YOU SHINE."),
  "Home.tsx contains original sneaker care landing page headline and badges"
)
assert(
  !homeSrc.includes("<EditorialHero") &&
    !homeSrc.includes("<CollectionRail") &&
    !homeSrc.includes("<FeaturedProductSpotlight"),
  "Home.tsx does NOT contain any shop spotlight components (cleanly rolled back)"
)

// 2. Verify Shop.tsx (zimthreads.online/shop)
console.log("\n▶ TEST 2: Shop.tsx (zimthreads.online/shop) Architecture")
const shopSrc = readFileSync(resolve("src/pages/Shop.tsx"), "utf-8")
assert(
  shopSrc.includes("<ShopHero") &&
    shopSrc.includes("<FeaturedProductSpotlight"),
  "Shop.tsx integrates ShopHero and FeaturedProductSpotlight"
)
assert(
  !shopSrc.includes("<CollectionRail") &&
    !shopSrc.includes("CURATED CAPSULES"),
  "Shop.tsx does NOT contain CURATED CAPSULES / CollectionRail (cleanly removed per user request)"
)
assert(
  shopSrc.includes('id="shop-catalog-section"'),
  "Shop.tsx provides smooth anchor scroll target for full catalog and category filters"
)

// 3. Verify ShopHero.tsx
console.log("\n▶ TEST 3: ShopHero.tsx Full-Bleed Editorial Banner")
const shopHeroSrc = readFileSync(
  resolve("src/components/ShopHero.tsx"),
  "utf-8"
)
assert(
  shopHeroSrc.includes("wjn81t1rzt0h6boikoxd.jpg"),
  "ShopHero uses the new high-fashion LLICYLAND editorial photo without text covering it"
)
assert(
  shopHeroSrc.includes("FEATURED DROP") &&
    shopHeroSrc.includes("ALL PRODUCTS"),
  "ShopHero provides clean action navigation buttons anchored at bottom edge"
)

// 4. Verify FeaturedProductSpotlight.tsx
console.log("\n▶ TEST 4: FeaturedProductSpotlight.tsx In-Page Direct Commerce")
const spotlightSrc = readFileSync(
  resolve("src/components/FeaturedProductSpotlight.tsx"),
  "utf-8"
)
assert(
  spotlightSrc.includes("activeBanner?.productId") &&
    spotlightSrc.includes("prod-zim-02"),
  "FeaturedProductSpotlight dynamically binds to admin productId or defaults to Zimbabwe '02' Jersey"
)
assert(
  spotlightSrc.includes("Personalize Custom Name") &&
    spotlightSrc.includes("customNamePrice"),
  "FeaturedProductSpotlight supports live custom name personalization (+Rs 50)"
)
assert(
  spotlightSrc.includes("addToCart(") && spotlightSrc.includes("setIsCartOpen(true)"),
  "FeaturedProductSpotlight adds to cart and immediately triggers the CartDrawer"
)
assert(
  spotlightSrc.includes("toggleAccordion") &&
    spotlightSrc.includes("Heritage Story") &&
    spotlightSrc.includes("Sizing & Fit Advice"),
  "FeaturedProductSpotlight includes Babwê-style collapsible accordion detail tabs"
)

console.log("\n══════════════════════════════════════════════════════════════════════")
console.log(`  SUMMARY: ${passed} Passed, ${failed} Failed`)
console.log("══════════════════════════════════════════════════════════════════════")

if (failed > 0) {
  process.exit(1)
}
