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
assert(
  spotlightSrc.includes("touch-pan-y") && !spotlightSrc.includes("touch-pan-x"),
  "FeaturedProductSpotlight uses touch-pan-y to prevent vertical scroll locking on mobile"
)
assert(
  !spotlightSrc.includes("targetSlide.scrollIntoView") &&
    spotlightSrc.includes("mobileScrollRef.current.scrollTo"),
  "FeaturedProductSpotlight scrolls mobile container directly without shifting vertical page scroll"
)
assert(
  spotlightSrc.includes("snap-always") &&
    spotlightSrc.includes('scrollSnapStop: "always"'),
  "FeaturedProductSpotlight configures snap-always for clean single-slide touch flings"
)
assert(
  spotlightSrc.includes("flex flex-wrap gap-2") &&
    spotlightSrc.includes("drawer-${s}"),
  "FeaturedProductSpotlight drawer employs responsive flex-wrap size pill layout"
)
assert(
  spotlightSrc.includes("[targetProduct.id]") &&
    spotlightSrc.includes("setActiveImageIdx(0)"),
  "FeaturedProductSpotlight resets active index and sizing state when targetProduct changes"
)
assert(
  spotlightSrc.includes('role="dialog"') &&
    spotlightSrc.includes('aria-modal="true"') &&
    spotlightSrc.includes('aria-labelledby="spotlight-drawer-title"'),
  "FeaturedProductSpotlight drawer implements complete accessible dialog semantics"
)
assert(
  spotlightSrc.includes('aria-haspopup="dialog"') &&
    spotlightSrc.includes("aria-controls=\"spotlight-mobile-drawer\""),
  "FeaturedProductSpotlight trigger button has proper aria-haspopup and aria-controls attributes"
)
assert(
  spotlightSrc.includes('role="tablist"') &&
    spotlightSrc.includes('role="tab"') &&
    spotlightSrc.includes("aria-selected={activeImageIdx === idx}"),
  "FeaturedProductSpotlight pagination dots implement accessible tablist/tab semantics"
)
assert(
  spotlightSrc.includes("overscroll-contain") &&
    spotlightSrc.includes("max-h-[85dvh]"),
  "FeaturedProductSpotlight mobile drawer includes overscroll containment and dynamic viewport height"
)
assert(
  spotlightSrc.includes("aria-expanded={openAccordion ===") &&
    spotlightSrc.includes("aria-controls=\"spotlight-"),
  "FeaturedProductSpotlight accordion triggers wire aria-expanded and aria-controls"
)
assert(
  spotlightSrc.includes("aria-pressed={selectedSize === s}"),
  "FeaturedProductSpotlight size selector buttons declare aria-pressed state"
)
assert(
  spotlightSrc.includes("handleTrapKeyDown") &&
    spotlightSrc.includes("triggerButtonRef") &&
    spotlightSrc.includes("previousActiveElementRef"),
  "FeaturedProductSpotlight implements WCAG 2.1 AA focus trap and focus restoration"
)
assert(
  spotlightSrc.includes("w-full pt-3 pb-1 flex justify-center shrink-0") &&
    spotlightSrc.includes("w-10 h-1 bg-[#d1d5db] rounded-full"),
  "FeaturedProductSpotlight mobile drawer pull handle is centered across entire sheet surface"
)
assert(
  spotlightSrc.includes("min-w-0 flex-1 mr-3") &&
    spotlightSrc.includes("id=\"spotlight-drawer-title\"") &&
    spotlightSrc.includes("shrink-0"),
  "FeaturedProductSpotlight drawer header title wraps/truncates flexibly without colliding with close button"
)
assert(
  spotlightSrc.includes("handleCustomNameChange") &&
    spotlightSrc.includes("replace(/[^A-Z0-9 '\\-]/g, \"\")"),
  "FeaturedProductSpotlight strictly sanitizes custom jersey name input against emoji and special characters"
)
assert(
  spotlightSrc.includes("role=\"tabpanel\"") &&
    spotlightSrc.includes("aria-controls={`spotlight-slide-${idx}`}"),
  "FeaturedProductSpotlight carousel connects tab controls to slide tabpanels via ARIA attributes"
)
assert(
  spotlightSrc.includes("relative aspect-square w-full bg-white border border-[#e5e1d8] overflow-hidden group"),
  "FeaturedProductSpotlight desktop primary image container uses pure studio white background"
)

console.log("\n══════════════════════════════════════════════════════════════════════")
console.log(`  SUMMARY: ${passed} Passed, ${failed} Failed`)
console.log("══════════════════════════════════════════════════════════════════════")

if (failed > 0) {
  process.exit(1)
}
