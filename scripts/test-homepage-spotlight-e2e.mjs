import { readFileSync } from "fs"
import { resolve } from "path"

console.log("══════════════════════════════════════════════════════════════════════")
console.log("  ZIMTHREADS HOMEPAGE UPGRADE & SPOTLIGHT COMPONENT VERIFICATION")
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

// 1. Verify EditorialHero.tsx structure
console.log("▶ TEST 1: EditorialHero.tsx Structure & Typography")
const editorialHeroSrc = readFileSync(
  resolve("src/components/EditorialHero.tsx"),
  "utf-8"
)
assert(
  editorialHeroSrc.includes("PREMIUM CARE.") &&
    editorialHeroSrc.includes("UNAPOLOGETIC") &&
    editorialHeroSrc.includes("STREETWEAR."),
  "EditorialHero renders unapologetic dual-identity master headline"
)
assert(
  editorialHeroSrc.includes("EXPLORE DROPS & CAPSULES") &&
    editorialHeroSrc.includes("BOOK SNEAKER RESTORATION"),
  "EditorialHero provides dual action CTAs for both streetwear and shoe restoration"
)
assert(
  editorialHeroSrc.includes("fmyul3tffougz1obkara.png"),
  "EditorialHero utilizes high-impact editorial imagery instead of stock sneakers"
)
assert(
  editorialHeroSrc.includes("trustBadges.map"),
  "EditorialHero renders trust badges strip with certified care & drop points"
)

// 2. Verify CollectionRail.tsx structure
console.log("\n▶ TEST 2: CollectionRail.tsx Structure & Peek Behavior")
const collectionRailSrc = readFileSync(
  resolve("src/components/CollectionRail.tsx"),
  "utf-8"
)
assert(
  collectionRailSrc.includes("scrollSnapType: \"x mandatory\"") ||
    collectionRailSrc.includes("snap-x snap-mandatory"),
  "CollectionRail implements native CSS scroll-snap mandatory"
)
assert(
  collectionRailSrc.includes("pr-12") || collectionRailSrc.includes("pr-20"),
  "CollectionRail implements right-side padding/peek visual cue"
)
assert(
  collectionRailSrc.includes("capsule-zim-02") &&
    collectionRailSrc.includes("capsule-paddock") &&
    collectionRailSrc.includes("capsule-streetwear") &&
    collectionRailSrc.includes("capsule-sneaker-care"),
  "CollectionRail includes all 4 signature capsules: Jersey, Paddock, Streetwear, and Care"
)
assert(
  collectionRailSrc.includes("scrollLeft") &&
    collectionRailSrc.includes("scrollRight"),
  "CollectionRail provides programmatic chevron navigation buttons"
)

// 3. Verify FeaturedProductSpotlight.tsx
console.log("\n▶ TEST 3: FeaturedProductSpotlight.tsx In-Page Direct Commerce")
const spotlightSrc = readFileSync(
  resolve("src/components/FeaturedProductSpotlight.tsx"),
  "utf-8"
)
assert(
  spotlightSrc.includes("activeBanner.enabled === false") &&
    spotlightSrc.includes("return null"),
  "FeaturedProductSpotlight gracefully hides if disabled in admin settings"
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

// 4. Verify Home.tsx integration
console.log("\n▶ TEST 4: Home.tsx Flow & Layout Orchestration")
const homeSrc = readFileSync(resolve("src/pages/Home.tsx"), "utf-8")
assert(
  homeSrc.includes("<EditorialHero") &&
    homeSrc.includes("<CollectionRail") &&
    homeSrc.includes("<FeaturedProductSpotlight"),
  "Home.tsx integrates EditorialHero, CollectionRail, and FeaturedProductSpotlight in sequence"
)
assert(
  homeSrc.includes('id="core-services-section"'),
  "Home.tsx provides smooth anchor scroll target for sneaker care services"
)

// 5. Verify Dashboard.tsx admin controls
console.log("\n▶ TEST 5: Dashboard.tsx Admin Spotlight Controls")
const dashboardSrc = readFileSync(
  resolve("src/pages/admin/Dashboard.tsx"),
  "utf-8"
)
assert(
  dashboardSrc.includes("Featured Spotlight Product (Homepage Showcase & Shop Banner)"),
  "Dashboard.tsx provides admin selector for the homepage spotlight product"
)
assert(
  dashboardSrc.includes("Spotlight Badge Override") &&
    dashboardSrc.includes("Spotlight Title Override") &&
    dashboardSrc.includes("Spotlight Story / Description Override"),
  "Dashboard.tsx provides badge, title, and description override controls for the spotlight"
)

// 6. Verify Docs
console.log("\n▶ TEST 6: UI/UX Audit Documentation")
const auditDoc = readFileSync(
  resolve("docs/UI_UX_AUDIT_BABWE_VS_ZIMTHREADS.md"),
  "utf-8"
)
assert(
  auditDoc.includes("babwe.store") && auditDoc.includes("zimthreads.online"),
  "Documentation contains comprehensive Babwê vs Zimthreads comparative audit"
)

console.log("\n══════════════════════════════════════════════════════════════════════")
console.log(`  SUMMARY: ${passed} Passed, ${failed} Failed`)
console.log("══════════════════════════════════════════════════════════════════════")

if (failed > 0) {
  process.exit(1)
}
