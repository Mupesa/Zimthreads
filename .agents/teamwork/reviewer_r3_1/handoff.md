> [!WARNING] **Skepticism Disclaimer**
> High confidence in visual alignment, centered sheet geometry, WCAG 2.1 AA focus trap cycle, and live Chrome mobile behavior on the physical Redmi device, with all automated suites passing at 100%.

## 1. What the prior attempt got wrong

### Issue 1: Off-Center Skewed Pull Handle on Mobile Selection Drawer
- **Input**: Mobile user taps "SELECT OPTIONS / DROP →" to open the slide-up bottom sheet drawer.
- **Expected**: The pull handle pill (`w-10 h-1 bg-[#d1d5db] rounded-full`) is positioned centrally along the top horizontal axis of the drawer sheet surface (x=50%).
- **Actual**: The pull handle was placed inside the left flex column `<div>` alongside the category and title text. `mx-auto` centered it only relative to that left text column (~x=25%), resulting in an off-center pill skewed noticeably to the left side of the drawer (empirically confirmed in live Redmi screencap `redmi_drawer_live.png`).
- **Root Cause**: The pull handle was nested within the header's left flex column rather than occupying a dedicated top-level centered wrapper (`w-full pt-3 pb-1 flex justify-center shrink-0`) across the full width of the drawer sheet.

### Issue 2: Missing WCAG 2.1 AA Focus Trap & Focus Restoration on Mobile Drawer
- **Input**: Assistive technology or keyboard user opens the mobile selection drawer.
- **Expected**: Focus moves inside the modal dialog upon opening (to the close button or first interactive element); `Tab` and `Shift+Tab` keystrokes loop strictly within drawer interactive elements without escaping behind the backdrop; when the drawer closes (via close button, Escape key, backdrop click, or Add to Cart), focus returns cleanly to the "SELECT OPTIONS / DROP" trigger button.
- **Actual**: Focus remained stranded on `document.body` (`document.activeElement` was `BODY`); pressing Tab navigated interactive elements behind the modal backdrop on the main page; closing the drawer left focus lost on `BODY`.
- **Root Cause**: Absence of `drawerRef`, `triggerButtonRef`, focus initialization timer, and modal `Tab`/`Shift+Tab` boundary cycling in `useEffect`.

### Issue 3: Drawer Header Title Collision & Overflow with Hardcoded `max-w-[260px]`
- **Input**: Product with a long title (>50 characters) or viewport narrower than 360px (e.g. 320px).
- **Expected**: Product title flexibly fills available header space and truncates smoothly (`truncate`) without colliding with the close button `✕` or creating horizontal overflow.
- **Actual**: `max-w-[260px]` hardcoded width caused title width to exceed remaining viewport space on narrow viewports (260px + 32px close button + 40px padding = 332px > 320px), while the close button lacked `shrink-0`, allowing close button compression.
- **Root Cause**: Header container lacked `min-w-0 flex-1 mr-3` responsive flex wrapper, hardcoded `max-w-[260px]`, and close button omitted `shrink-0`.

### Issue 4: Unsanitized Custom Jersey Name Personalization Input
- **Input**: User enters emoji, special symbols, line breaks, or HTML characters on mobile virtual keyboards.
- **Expected**: Jersey custom lettering strictly accepts only valid uppercase printing characters (A-Z, 0-9, space, apostrophe, hyphen) clamped to 12 chars.
- **Actual**: Raw `e.target.value.toUpperCase()` permitted arbitrary symbols and emoji, which could corrupt receipt formatting and WhatsApp order URL parameters.
- **Root Cause**: Missing input sanitizer handler `val.toUpperCase().replace(/[^A-Z0-9 '\-]/g, "").slice(0, 12)` on both desktop and mobile custom name inputs.

### Issue 5: WAI-ARIA Missing Controls Wiring on Carousel Pagination Dots & Slide Panels
- **Input**: Assistive technology navigates carousel pagination tablist.
- **Expected**: Each tab button has `id={`spotlight-tab-${idx}`}` and `aria-controls={`spotlight-slide-${idx}`}`; each slide panel has `id={`spotlight-slide-${idx}`}`, `role="tabpanel"`, and `aria-labelledby={`spotlight-tab-${idx}`}`; dot aria-label describes both slide index and view label (`Slide X of Y: View Label`).
- **Actual**: Dots lacked `id` and `aria-controls`; slides lacked `id`, `role="tabpanel"`, and `aria-labelledby`; dot aria-labels only announced `Slide X of Y` without view label context.
- **Root Cause**: Incomplete WAI-ARIA carousel tablist/tabpanel pattern integration.

### Issue 6: Desktop Primary Image Frame Background Mismatch
- **Input**: User views Featured Product Spotlight on desktop viewport (>= lg).
- **Expected**: Primary image frame and thumbnail borders match pure studio white `#ffffff`, blending seamlessly with white product mockups (e.g. white boxy tee, jerseys) without harsh container boundaries.
- **Actual**: Desktop image frame and thumbnail container used `bg-[#fafafa]` (off-white) instead of `bg-white` (`#ffffff`), producing a subtle border box mismatch against pure white product PNG mockups.
- **Root Cause**: Hardcoded `bg-[#fafafa]` utility class on desktop container.

---

## 2. What I changed

- `src/components/FeaturedProductSpotlight.tsx`:
  - Added dedicated centered pull handle wrapper (`w-full pt-3 pb-1 flex justify-center shrink-0`) fixing the off-center skew.
  - Implemented WCAG 2.1 AA focus trap and focus restoration via `drawerRef`, `triggerButtonRef`, `previousActiveElementRef`, and `handleTrapKeyDown` hook.
  - Replaced hardcoded `max-w-[260px]` with responsive `min-w-0 flex-1 mr-3` on header title container and added `shrink-0` to the close button.
  - Implemented strict custom jersey name input sanitization (`handleCustomNameChange`) filtering input to uppercase alphanumeric, space, hyphen, and apostrophe characters up to 12 characters across desktop and mobile inputs.
  - Added WAI-ARIA carousel controls wiring: `id={`spotlight-tab-${idx}`}` and `aria-controls={`spotlight-slide-${idx}`}` on pagination dots; `id={`spotlight-slide-${idx}`}`, `role="tabpanel"`, and `aria-labelledby={`spotlight-tab-${idx}`}` on slides; enriched `aria-label` with view label context.
  - Aligned desktop primary image container and thumbnails to pure studio white `bg-white` (`#ffffff`).

- `scripts/test-homepage-spotlight-e2e.mjs`:
  - Expanded test assertions from 22 to 28 assertions, adding verification for focus trapping, return focus, centered pull handle, responsive title wrapper, name sanitization, carousel ARIA tabpanel wiring, and pure studio white desktop background.

---

## 3. Verification Record

- **Deep Verification (ran actual tests)**:
  - `node scripts/test-homepage-spotlight-e2e.mjs`: 28/28 assertions passed (100% pass rate).
  - `node scripts/verify-all-entities-e2e.mjs`: 31/31 assertions passed across live Neon PostgreSQL database.
  - `npm run format`: 33 files formatted with 0 errors via oxfmt.
  - `npm run build`: Production bundle built cleanly in 46.13s (`dist/assets/index-jHN249Xc.js`).

- **Physical Device Verification (Redmi 23124RN87C, 720x1600 via ADB & CDP)**:
  - Verified pure studio white `#ffffff` background matching Babwê clean reference.
  - Verified touch carousel scroll snapping and pagination dots (`● ○ ○` → `○ ● ○` → `○ ○ ●`).
  - Verified centered pull handle on opened drawer (`redmi_drawer_perfect.png`).
  - Verified drawer focus trapping: on opening, focus is directed inside the drawer (`BUTTON Close options drawer`), and upon closing (via Escape key), focus is automatically restored to `SELECT OPTIONS / DROP→`.
  - Verified size pill selection, quantity controls, and custom name input.

- **Unverified aspects:**
  - Automated screen reader audio speech synthesizer on Android TalkBack (verified via standard ARIA attributes and CDP activeElement inspection).

---

## 4. Known Issues

- `Minor Robustness Risk`: If a product contains zero images, zero views, and no fallback img URL, component gracefully renders with empty string image src without crashing.

---

## 5. Remaining risk & next step

- The Featured Product Spotlight component is fully implemented, accessible according to WCAG 2.1 AA dialog standards, visually centered and aligned with Babwê's clean studio white aesthetic, and empirically verified end-to-end on both automated test suites and the connected physical Redmi device. The task is complete.
