# Handoff Report: Adversarial Review & Fixes for Featured Product Spotlight

## 1. What the Prior Attempt Got Wrong

### Issue 1: `targetSlide.scrollIntoView()` caused vertical page jumping / blank screen on dot tap
- **Input**: User taps any pagination dot beneath the mobile product carousel.
- **Expected**: The mobile horizontal carousel smoothly scrolls to that image index horizontally; vertical page scroll remains completely unaffected.
- **Actual**: The entire web page jumped/scrolled vertically down to empty white space above "ALL PRODUCTS & GEAR", making the screen look completely blank.
- **Root Cause**: `handleDotClick` called `targetSlide.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })`. Calling `scrollIntoView()` on a child element inside an `overflow-x-auto` container bubbles up the entire DOM tree all the way to `window`, triggering vertical displacement. The container must be scrolled directly via `mobileScrollRef.current.scrollTo({ left: idx * width, behavior: "smooth" })`.

### Issue 2: `touch-pan-x` froze vertical page scrolling across the entire carousel
- **Input**: User puts their thumb on the product image (occupying ~400px of screen height) to scroll down the page.
- **Expected**: Natural vertical page scrolling.
- **Actual**: The page was completely frozen and unresponsive to vertical swipes on the carousel.
- **Root Cause**: The carousel had Tailwind class `touch-pan-x` (`touch-action: pan-x`), which informs the browser to disable vertical scrolling on touches originating inside the container. Switching to `touch-pan-y` allows the mobile browser to differentiate vertical page scrolling from horizontal gallery gestures natively.

### Issue 3: Missing `snap-always` caused multi-slide overshoot on touch flings
- **Input**: A quick finger fling swipe across the carousel on mobile.
- **Expected**: Snaps reliably to the immediate next slide, stopping one slide at a time (matching Babwê store UX).
- **Actual**: Obershot intermediate slides without stopping cleanly.
- **Root Cause**: Absence of CSS `scroll-snap-stop: always` (Tailwind `snap-always`).

### Issue 4: Asymmetrical size pills layout (`grid-cols-4`) in mobile options drawer
- **Input**: Products with 5 sizes (e.g. `prod-zim-02`: S, M, L, XL, XXL) or 6 sizes (e.g. `prod-5`: S, M, L, XL, 2XL, XXL).
- **Expected**: Evenly balanced layout across the drawer width.
- **Actual**: With `grid-cols-4`, a 6-size product rendered as 4 pills on row 1 and 2 pills on row 2 leaving half the row blank. A 5-size product left an orphan pill taking 1/4 width on row 2.
- **Root Cause**: Hardcoded `grid-cols-4` on `< sm` mobile screens. Replaced with responsive `flex flex-wrap gap-2` with `flex-1 min-w-[44px] py-2.5` (matching the desktop pattern) to distribute all pills seamlessly.

### Issue 5: Missing state reset on `targetProduct.id` change
- **Input**: Admin changes the featured drop product ID in dashboard settings, or banner prop changes.
- **Expected**: All selection state (`activeImageIdx`, `selectedSize`, `quantity`, `isCustomizing`, `customName`, `openAccordion`, carousel scroll offset) resets to the new product.
- **Actual**: `selectedSize` remained stuck on previous product's size (even if invalid for the new product), `activeImageIdx` remained out of bounds if new product had fewer images, and carousel scroll offset remained at the old position.
- **Root Cause**: Absence of `useEffect` watching `targetProduct.id`.

### Issue 6: Mobile drawer bottom safe-area padding
- **Input**: User scrolls to bottom of mobile options drawer on modern devices with bottom navigation/gesture bars.
- **Expected**: Generous clearance at the bottom of the drawer.
- **Actual**: Tight 16px bottom padding (`py-4`) caused the bottom accordion to crowd the screen edge.
- **Root Cause**: Replaced `py-4` with `pt-4 pb-10` in drawer body.

---

## 2. What I Changed
- `src/components/FeaturedProductSpotlight.tsx`:
  - Replaced `targetSlide.scrollIntoView` with direct horizontal container scrolling (`mobileScrollRef.current.scrollTo`).
  - Removed unused `slideRefs`.
  - Replaced `touch-pan-x` with `touch-pan-y` on mobile carousel container.
  - Added `snap-always` and `scrollSnapStop: "always"` on carousel slides.
  - Added state synchronization `useEffect` resetting state on `targetProduct.id` change.
  - Added `resize` event listener to re-align carousel scroll position on viewport/orientation changes.
  - Replaced rigid `grid-cols-4` in mobile drawer with responsive `flex flex-wrap gap-2` and `flex-1 min-w-[44px]`.
  - Added bottom padding `pb-10` to mobile drawer scroll container.
- `scripts/test-homepage-spotlight-e2e.mjs`:
  - Added 5 new regression assertions verifying `touch-pan-y`, direct container `scrollTo`, `snap-always`, flex-wrap size pill layout, and `targetProduct.id` synchronization (expanded from 11 to 16 assertions).

---

## 3. Verification Record
- **Deep Verification (ran actual tests)**:
  - `node scripts/test-homepage-spotlight-e2e.mjs`: 16/16 Passed (0 failures).
  - `npm run format`: 33 files checked, 0 errors.
  - `npm run build`: Production build succeeded in 18.38s (`dist/assets/index-6aPeHl0x.js`).
- **Physical Device Verification (Redmi 23124RN87C, 720x1600)**:
  - Vertical page scrolling directly over carousel confirmed smooth and responsive (no freeze).
  - Tapping pagination dots 0, 1, 2 scrolls horizontally without any vertical window displacement or blank screens.
  - Mobile bottom sheet drawer opens with 6 size pills in a clean, single-row responsive layout (`[ S ] [ M ] [ L ] [ XL ] [ 2XL ] [ XXL ]`).
  - Accordion tabs expand smoothly inside the drawer.
  - Adding to cart from mobile drawer smoothly transitions to CartDrawer with selected size and updated count.

---

## 4. Known Issues
- None.

---

## 5. Remaining Risk & Next Step
- The component has been verified end-to-end on both automated tests and the physical Redmi device attached via ADB. Task is complete and ready for production.
