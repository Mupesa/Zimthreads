# DISPATCH: Milestone 2 Worker - Customer-Facing Flows & StoreContext Integration

## Objective
Implement Milestone 2:
1. `src/store/StoreContext.tsx`:
   - Hydrate all 7 entities (`products`, `services`, `blog_posts`, `settings`, `bookings`, `orders`, `inquiries`) from `/api/store?key=all` on mount and window focus/reload.
   - Guard all state with `Array.isArray()` fallbacks to prevent UI crashes.
   - Refactor `addBooking`, `createOrder`, and `addInquiry` to trigger `POST /api/store` with `action: "public_create"` for their respective entities (`bookings`, `orders`, `inquiries`) while keeping local state responsive.
   - Wire administrative updates for bookings, orders, and inquiries to sync back to Neon DB.
2. `src/pages/Booking.tsx`:
   - Update `handleConfirmBooking` to call `addBooking` with validated customer name, email, phone, service details, date, time, and notes. Ensure double-submit protection.
3. `src/components/CartDrawer.tsx`:
   - Update checkout submission to call `createOrder` with order items (id, name, price, quantity, size, image), customer details, shipping address, total, and default statuses (`paymentStatus: "paid"`, `fulfillmentStatus: "unfulfilled"` or appropriate defaults).
4. `src/pages/Contact.tsx`:
   - Update inquiry form submission to call `addInquiry` with name, email, subject, message, and date.
5. `src/pages/Shop.tsx`:
   - Fix TypeScript errors on lines 184, 205, 208, 225 (`title`/`subtitle` vs `name`/`tagline`, and Link onClick type mismatch).
6. Build & Verification:
   - Run `npm run build` to verify clean build with zero TypeScript errors.
   - Test that submitting a booking, order, or inquiry successfully writes to Neon DB and is returned on reload.

## Exclusive File Ownership
- `src/store/StoreContext.tsx`
- `src/pages/Booking.tsx`
- `src/components/CartDrawer.tsx`
- `src/pages/Contact.tsx`
- `src/pages/Shop.tsx`

## Inputs & Specifications to Read
- `c:\Dev\Active Projects\Zimthreads\PROJECT.md`
- `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\ORIGINAL_REQUEST.md`
- `c:\Dev\Active Projects\Zimthreads\AGENTS.md`
- `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_1\store_context_spec.md`
- `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_2\customer_forms_spec.md`
- `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_3\catalog_reactivity_spec.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Output
Write handoff report to `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_worker_1\handoff.md`.
Report completion via send_message.


## 2026-10-10T18:46:47Z (Incoming Dispatch)
You are the Milestone 2 Core Worker.
Your working directory is c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_worker_1.
Read your instructions in:
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_worker_1\DISPATCH.md
- c:\Dev\Active Projects\Zimthreads\PROJECT.md
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\ORIGINAL_REQUEST.md
- c:\Dev\Active Projects\Zimthreads\AGENTS.md
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_1\store_context_spec.md
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_2\customer_forms_spec.md
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_3\catalog_reactivity_spec.md
