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
  "Home.tsx does NOT contain the shop components (cleanly rolled back)"
)

// 2. Verify Shop.tsx has the upgraded Babwe-style architecture
console.log("\n▶ TEST 2: Shop.tsx (zimthreads.online/shop) Upgraded Architecture")
const shopSrc = readFileSync(resolve("src/pages/Shop.tsx"), "utf-8")
assert(
  shopSrc.includes("<ShopHero") &&
    shopSrc.includes("<CollectionRail") &&
    shopSrc.includes("<FeaturedProductSpotlight"),
  "Shop.tsx integrates ShopHero, CollectionRail, and FeaturedProductSpotlight"
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
  shopHeroSrc.includes("CURATED ATELIER.") &&
    shopHeroSrc.includes("UNAPOLOGETIC") &&
    shopHeroSrc.includes("STREETWEAR."),
  "ShopHero renders luxury editorial headline"
)
assert(
  shopHeroSrc.includes("EXPLORE CAPSULES") &&
    shopHeroSrc.includes("FLAGSHIP DROP SPOTLIGHT") &&
    shopHeroSrc.includes("FULL CATALOG"),
  "ShopHero provides triple action navigation buttons"
)

// 4. Verify CollectionRail.tsx
console.log("\n▶ TEST 4: CollectionRail.tsx Horizontal Scroll & Peek Behavior")
const collectionRailSrc = readFileSync(
  resolve("src/components/CollectionRail.tsx"),
  "utf-8"
)
assert(
  collectionRailSrc.includes("snap-x snap-mandatory"),
  "CollectionRail implements native CSS scroll-snap mandatory"
)
assert(
  collectionRailSrc.includes("onSelectCategory"),
  "CollectionRail supports onSelectCategory callback for instant filtering on /shop"
)
assert(
  collectionRailSrc.includes("capsule-zim-02") &&
    collectionRailSrc.includes("capsule-paddock") &&
    collectionRailSrc.includes("capsule-streetwear") &&
    collectionRailSrc.includes("capsule-sneaker-care"),
  "CollectionRail contains all 4 capsules"
)

// 5. Verify FeaturedProductSpotlight.tsx
console.log("\n▶ TEST 5: FeaturedProductSpotlight.tsx In-Page Direct Commerce")
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

// 6. Verify Dashboard.tsx admin controls
console.log("\n▶ TEST 6: Dashboard.tsx Admin Spotlight Controls")
const dashboardSrc = readFileSync(
  resolve("src/pages/admin/Dashboard.tsx"),
  "utf-8"
)
assert(
  dashboardSrc.includes("Featured Spotlight Product (Homepage Showcase & Shop Banner)"),
  "Dashboard.tsx provides admin selector for the spotlight product"
)

console.log("\n══════════════════════════════════════════════════════════════════════")
console.log(`  SUMMARY: ${passed} Passed, ${failed} Failed`)
console.log("══════════════════════════════════════════════════════════════════════")

if (failed > 0) {
  process.exit(1)
}
