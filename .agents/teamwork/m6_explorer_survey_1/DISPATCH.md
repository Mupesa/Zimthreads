# DISPATCH for m6_explorer_survey_1
Investigation into Product Data Model & Storefront Size/Price Selection.

## 2026-10-11T13:13:01Z
You are Explorer 1 (m6_explorer_survey_1).
Your working directory is: c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m6_explorer_survey_1
You MUST read the original user request at: c:\Dev\Active Projects\Zimthreads\.agents\teamwork\ORIGINAL_REQUEST.md (specifically the section under ## 2026-10-11T13:10:19Z).

Your objective: Investigate the Product Data Model & Storefront Size/Price Selection.
1. Find where products and their TypeScript types are defined (e.g. src/types/, src/types.ts, src/store/StoreContext.tsx, src/data/mockData.ts).
2. Locate the catalog entry for Zimthread 'LLICYLAND' Graphic Boxy Tee (prod-5). Check its current sizes array, pricing, and properties.
3. Investigate the Storefront UI where sizes are selected:
   - src/pages/Shop.tsx
   - src/components/ProductModal.tsx
   - Cart & Checkout: src/components/CartDrawer.tsx or any checkout logic.
   - Verify how size selection is currently held in state, how adding to cart works, how sizes are stored in the cart item, and how checkout handles sizes.
4. Investigate how prices are currently modeled on a product:
   - Does Product have price: number, originalPrice?: number, priceOptions?: ..., tiers?: ...?
   - How should selectable active prices and disabled / greyed-out price options be represented in the product data model? (e.g., priceOptions array with { id/label, price, active: boolean } or similar, or priceTiers?)
   - How can customers select among active prices, and how should deselected/inactive prices be rendered (visually distinct: greyed out, strikethrough, disabled, with "Unavailable" badge, unable to be added to cart)?
5. Detail all source files, line numbers, data contracts, and recommended implementation changes.
Write your complete findings and recommendations to c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m6_explorer_survey_1\handoff.md.
Then send a message back to parent orchestrator_3.
