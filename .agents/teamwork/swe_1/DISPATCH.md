## 2026-10-20T12:17:22Z
You are the SWE Light Orchestrator for this task.
Your working directory is: c:\Dev\Active Projects\Zimthreads\.agents\teamwork\swe_1
The authoritative user request is recorded in: c:\Dev\Active Projects\Zimthreads\.agents\teamwork\ORIGINAL_REQUEST.md (under ## 2026-10-20T12:15:47Z).

Task:
Refactor the Shop page Featured Product Spotlight (`src/components/FeaturedProductSpotlight.tsx`) on mobile to replicate Babwê's clean studio white aesthetic with a horizontal swipeable media scrollable and dot indicators. On mobile, remove the static product details and size/purchase block so it only appears when the user selects the flagship drop via a slide-up selection drawer, while preserving the existing 2-column layout on desktop.

Requirements:
1. R1: White Studio Background & Babwê Aesthetic Alignment (#ffffff / #fafafa) blending product mockups seamlessly.
2. R2: Mobile Horizontal Swipeable Gallery with pagination dots (animated ● ○ ○ ○ ○ beneath the image, touch indicator feedback).
3. R3: Mobile-Only Selective Details Reveal (Bottom Sheet Drawer):
   - On mobile (< sm / < lg), remove static in-page purchase block (Apparel // BESPOKE, THE "LLICYLAND" BOXY TEE, size pills, purchase panel) from taking up permanent vertical scroll space.
   - Display a clean, compact product header and a prominent 'SELECT OPTIONS / DROP' trigger button beneath the swipeable image.
   - When tapped, reveal a sleek mobile bottom sheet drawer containing full product details, size selector pills, custom name personalization, and Add to Cart action.
   - On desktop (>= lg), maintain the side-by-side sticky 2-column layout exactly as it currently functions.
4. R4: Device Verification & Visual Parity:
   - Verify on physical device (Redmi 23124RN87C, 720x1600) via ADB.
   - Compare side-by-side captures with babwe.store reference.
   - Run e2e tests (node scripts/test-homepage-spotlight-e2e.mjs).

Follow the SWE Light protocol: maintain progress in your working directory (progress.md and BRIEFING.md). Report victory to Sentinel when fully complete.
