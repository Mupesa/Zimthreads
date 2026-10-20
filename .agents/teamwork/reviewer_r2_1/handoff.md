> [!WARNING] **Skepticism Disclaimer**
> High confidence in mobile aesthetic, touch carousel scrolling, and drawer commerce on the connected Redmi physical device, though screen reader focus trapping was verified through standard ARIA dialog attributes rather than a synthetic accessibility tree walker.

## 1. What the prior attempt got wrong

### Issue 1: Missing WCAG AA Dialog & Button ARIA Semantics on Mobile Drawer
- **Input**: Screen reader user or assistive device interacts with the "SELECT OPTIONS / DROP" trigger and slide-up drawer.
- **Expected**: Drawer element exposes `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="spotlight-drawer-title"`; trigger button announces `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls="spotlight-mobile-drawer"`; backdrop has `aria-hidden="true"`.
- **Actual**: Drawer was a bare `<div>` without semantic dialog attributes; trigger button had no popup/expanded status; screen readers could not determine that an interactive modal sheet had opened.
- **Root Cause**: The drawer container and trigger button only used visual CSS styling without the standard ARIA dialog specification attributes.

### Issue 2: Carousel Pagination Dots Lacked Tablist/Tab ARIA Roles
- **Input**: User navigates the mobile carousel via assistive navigation or keyboard.
- **Expected**: Pagination container announces `role="tablist"` with `aria-label="Product image slides"`; dot buttons announce `role="tab"` with `aria-selected` and descriptive position (e.g. `Slide 1 of 3`).
- **Actual**: Generic buttons with basic `aria-label="View slide X"` and no indication of which slide was actively selected.
- **Root Cause**: Missing `role="tablist"`, `role="tab"`, and `aria-selected={activeImageIdx === idx}`.

### Issue 3: Size Desynchronization on Cloud Hydration or Admin Size Reconfiguration
- **Input**: Database hydrates after initial mount or admin changes sizes in dashboard for the active drop (without changing product ID).
- **Expected**: `selectedSize` re-evaluates against the newly hydrated `targetProduct.sizes` list and falls back to `targetProduct.sizes[0]` if the previous selection is no longer valid.
- **Actual**: `useEffect` only listened to `[targetProduct.id]`, leaving `selectedSize` stuck on an invalid or unselected value if `sizes` changed post-mount.
- **Root Cause**: Missing reactive validation hook watching `[targetProduct.sizes, selectedSize]`.

### Issue 4: Potential Null Pointer Crash on Empty Gallery / Missing Product Images
- **Input**: Catalog product with empty `views: []` and empty `images: []` and no fallback image.
- **Expected**: Component renders safely with a defensive fallback without throwing runtime errors.
- **Actual**: `activeImage` resolution (`gallery[activeImageIdx] || gallery[0]`) evaluated to `undefined`, and accessing `activeImage.url` crashed the entire page render.
- **Root Cause**: Absence of an explicit fallback object `{ label: "Studio View", url: targetProduct.img || "" }` when both gallery indices are undefined.

### Issue 5: Missing Mobile Drawer Overscroll Containment & Dynamic Viewport Height
- **Input**: Mobile user opens on-screen keyboard or scrolls rapidly inside the drawer on modern Android devices.
- **Expected**: Scrolling stays contained within the drawer; drawer height dynamically adjusts to virtual keyboard without pushing actions off-screen.
- **Actual**: Drawer used rigid `max-h-[85vh]` without `overscroll-contain`, allowing scroll chaining to drag the background page on gesture flings.
- **Root Cause**: Missing `overscroll-contain` and `max-h-[85dvh]` utility classes.

### Issue 6: Unbounded Quantity Incrementation & Unlabeled Quantity Steppers
- **Input**: User clicks `+` repeatedly or uses screen reader on quantity buttons.
- **Expected**: Quantity steppers announce "Decrease quantity" / "Increase quantity" and clamp to reasonable upper bound (99).
- **Actual**: Stepper buttons had no `aria-label` (read as "dash" / "plus") and had no upper limit.
- **Root Cause**: `setQuantity((q) => q + 1)` had no `Math.min(99, ...)` and buttons omitted `aria-label`.

---

## 2. What I Changed

- `src/components/FeaturedProductSpotlight.tsx`:
  - Added full accessible dialog semantics to the mobile selection drawer (`role="dialog"`, `aria-modal="true"`, `aria-labelledby="spotlight-drawer-title"`, `id="spotlight-mobile-drawer"`).
  - Added `aria-haspopup="dialog"`, `aria-expanded={isDrawerOpen}`, and `aria-controls="spotlight-mobile-drawer"` to the mobile "SELECT OPTIONS / DROP" trigger button.
  - Added `aria-hidden="true"` to the drawer backdrop.
  - Added `overscroll-contain` and `max-h-[85dvh]` to the drawer surface.
  - Implemented accessible tablist/tab semantics for pagination dots (`role="tablist"`, `role="tab"`, `aria-selected={activeImageIdx === idx}`, `aria-label="Slide X of Y"`).
  - Added reactive size validation hook `useEffect` watching `[targetProduct.sizes, selectedSize]` to automatically keep `selectedSize` valid across cloud hydration.
  - Added `setIsDrawerOpen(false)` to target product reset effect.
  - Added defensive fallback `{ label: "Studio View", url: targetProduct.img || "" }` to `activeImage` resolution.
  - Added `aria-pressed={selectedSize === s}` and `aria-label` to all desktop and mobile size buttons.
  - Added `aria-label="Custom jersey name personalization"` to custom name inputs.
  - Clamped quantity increment to `Math.min(99, q + 1)` and added `aria-label="Decrease quantity"` / `aria-label="Increase quantity"`.
  - Added `aria-expanded` and `aria-controls` to all desktop and mobile accordion detail tabs with `id` and `role="region"` on content containers.

- `scripts/test-homepage-spotlight-e2e.mjs`:
  - Expanded test assertions from 16 to 22 assertions verifying dialog semantics, trigger button attributes, tablist pagination, dynamic viewport overscroll containment, accordion ARIA controls, and size selector pressed states.

---

## 3. Verification Record

- **Deep Verification (ran actual tests)**:
  - `node scripts/test-homepage-spotlight-e2e.mjs`: 22/22 assertions passed (100% pass rate).
  - `node scripts/verify-all-entities-e2e.mjs`: 31/31 assertions passed across live Neon PostgreSQL CRUD.
  - `npm run format`: 33 files formatted with 0 errors via oxfmt.
  - `npm run build`: Production bundle built cleanly in 14.17s (`dist/assets/index-B1IcG9m8.js`).

- **Physical Device Verification (Redmi 23124RN87C, 720x1600)**:
  - Confirmed studio white background `#ffffff` matches Babwê clean reference.
  - Verified touch carousel swipe and dot indicators (`● ○ ○` → `○ ● ○` → `○ ○ ●`) with zero vertical scroll displacement or window jumping.
  - Verified mobile selection drawer opens smoothly via "SELECT OPTIONS / DROP →".
  - Verified responsive size pills `[ S ] [ M ] [ L ] [ XL ] [ 2XL ] [ XXL ]` render in a single balanced row.
  - Verified size selection ("M") and quantity incrementation (`+`).
  - Verified "ADD TO CART" smoothly adds item and transitions into the CartDrawer with updated item count `(6)`.
  - Captured screenshots saved at `.agents/teamwork/reviewer_r2_1/`:
    - `redmi_spotlight2.png`
    - `redmi_dot1_real.png`
    - `redmi_dot2_real.png`
    - `redmi_dot0_real.png`
    - `redmi_drawer_reopened.png`
    - `redmi_drawer_size_m_qty2_real.png`

- **Unverified aspects:**
  - Automated screen reader audio output on Android TalkBack (verified via standard ARIA attributes instead of assistive audio synthesizer).

---

## 4. Known Issues

- `Minor Robustness Risk`: If a product title exceeds 50 characters, the drawer header text truncates gracefully with `truncate max-w-[260px]`; full title is visible in the compact header.

---

## 5. Remaining risk & next step

- The Featured Product Spotlight component is fully implemented, accessible, visually aligned with Babwê's clean studio white aesthetic, and empirically verified end-to-end on both automated suites and the connected physical Redmi device. The task is complete.
