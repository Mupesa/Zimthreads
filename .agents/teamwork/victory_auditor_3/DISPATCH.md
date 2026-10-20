## 2026-10-20T15:25:42Z
Your working directory is: c:\Dev\Active Projects\Zimthreads\.agents\teamwork\victory_auditor_3
Please maintain progress in progress.md in your working directory and output your final audit handoff report to c:\Dev\Active Projects\Zimthreads\.agents\teamwork\victory_auditor_3\handoff.md.
When you finish, notify me via send_message with recipient 49d9bb9e-850b-46db-bd12-277691b02ed2.

<original_task>
This is a single self-contained fix; keep it small and focused.

Refactor the Shop page Featured Product Spotlight (`src/components/FeaturedProductSpotlight.tsx`) on mobile to replicate Babwê's clean studio white aesthetic with a horizontal swipeable media scrollable and dot indicators. On mobile, remove the static product details and size/purchase block so it only appears when the user selects the flagship drop via a slide-up selection drawer, while preserving the existing 2-column layout on desktop.

Working directory: c:\Dev\Active Projects\Zimthreads
Integrity mode: development

## Requirements

### R1. White Studio Background & Babwê Aesthetic Alignment
- Transition the Featured Product Spotlight container from dark charcoal (`#111412`) to a pure studio white / clean light aesthetic (`#ffffff` / `#fafafa`) matching `babwe.store` and the Zimthreads light catalog theme (`#f5f2ec`).
- Ensure product mockups (e.g. white boxy tee, jerseys) blend seamlessly into the background without harsh dark box boundaries or letterboxing.

### R2. Mobile Horizontal Swipeable Gallery with Pagination Dots
- On mobile screens, replace thumbnail buttons with a smooth touch-swipeable horizontal scroll container with snap alignment.
- Implement animated pagination dots (`● ○ ○ ○ ○`) beneath the image reflecting active index and allowing touch indicator feedback, matching the Babwê reference on the connected Redmi phone.

### R3. Mobile-Only Selective Details Reveal (Bottom Sheet Drawer)
- **Mobile (`< sm` / `< lg`)**: Remove the static in-page purchase block (`Apparel // BESPOKE`, `THE "LLICYLAND" BOXY TEE`, size pills, and purchase panel) from taking up permanent vertical scroll space.
- Display a clean, compact product header and a prominent "SELECT OPTIONS / DROP" trigger button beneath the swipeable image.
- When tapped, reveal a sleek mobile bottom sheet drawer containing the full product details, size selector pills, custom name personalization, and the "Add to Cart" action.
- **Desktop (`>= lg`)**: Maintain the side-by-side sticky 2-column layout exactly as it currently functions.

### R4. Device Verification & Visual Parity
- Verify the mobile experience directly on the connected physical device (Redmi 23124RN87C, 720x1600) via ADB.
- Compare live side-by-side captures of `babwe.store` and `zimthreads.online/shop` to confirm clean white background, swipe smoothness, and zero layout overflow.

## Acceptance Criteria

### Visual & Layout
- [ ] Spotlight background is clean studio white matching the Babwê reference page.
- [ ] Mobile view features a swipeable carousel with pagination dots.
- [ ] On mobile, the static `Apparel // BESPOKE` and `THE "LLICYLAND" BOXY TEE` purchase block does NOT consume permanent vertical scroll space; it opens smoothly in a selection drawer upon tapping.
- [ ] Desktop view retains its sticky 2-column side-by-side purchase layout.

### Functionality & Verification
- [ ] Selecting size and adding to cart works smoothly without errors.
- [ ] All e2e tests (`node scripts/test-homepage-spotlight-e2e.mjs`) pass.
- [ ] ADB screenshots on Redmi confirm parity with Babwê's white scrollable design.
</original_task>
