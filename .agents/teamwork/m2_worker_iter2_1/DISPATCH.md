# DISPATCH: Milestone 2 Worker (Iteration 2) - Async Persistence & Error Resilience Remediation

## Objective
Implement the remediation strategies for Reviewer 2's findings:
1. `src/store/StoreContext.tsx`:
   - `persistPublicRecord`: Return `Promise<T>`, implement timeout (e.g. 15s via AbortController), throw explicit `Error` on HTTP non-200 or network drop instead of swallowing it.
   - Update `StoreContextType` interface:
     - `addBooking: (booking: Omit<Booking, "id" | "createdAt" | "status">) => Promise<Booking>`
     - `createOrder: (orderData: Omit<Order, "id" | "createdAt">) => Promise<Order>`
     - `addInquiry: (inquiry: Omit<Inquiry, "id" | "createdAt" | "read">) => Promise<Inquiry>`
   - Await `persistPublicRecord` before updating local state and committing to localStorage. Throw error if persistence fails so caller catches it.
   - In `fetchCloudData()`: Avoid wiping freshly added local items on window refocus if cloud sync has small replication lag.
   - Remove automatic `setIsCartOpen(false)` inside `createOrder` so `CartDrawer.tsx` can cleanly handle its own checkout confirmation flow.
2. `src/pages/Booking.tsx`:
   - Make `handleConfirmBooking` an `async` function.
   - Wrap in `try/catch`: `await addBooking(...)`.
   - On error: catch error, set error state (`setError(err.message)`), stay on Step 3, display red error banner, and re-enable submit button.
   - On success: advance to Step 4 (Confirmed) and WhatsApp reference.
3. `src/components/CartDrawer.tsx`:
   - Make `handleCheckoutSubmit` an `async` function.
   - Wrap in `try/catch`: `await createOrder(...)`.
   - On error: catch error, display visible error message in checkout modal, keep cart intact, and re-enable submit button.
   - On success: clear cart and advance to order confirmation screen.
4. `src/pages/Contact.tsx`:
   - Make `handleSubmit` an `async` function.
   - Wrap in `try/catch`: `await addInquiry(...)`.
   - On error: display error banner, keep user-entered fields intact, and re-enable submit button.
   - On success: reset form and display success view.
5. `src/pages/JacketsCollectionPage.tsx`:
   - Memoize `liveSelectedProduct` using `useMemo` from `products` by `selectedProduct.id` (parity with `Shop.tsx`).
   - Pass `product={liveSelectedProduct}` to `ProductModal`.
6. Run build & test validation:
   - `npx tsc --noEmit` and `npm run build` must compile with exit code 0.
   - Run tests to verify persistence still works 100%.

## Exclusive File Ownership
- `src/store/StoreContext.tsx`
- `src/pages/Booking.tsx`
- `src/components/CartDrawer.tsx`
- `src/pages/Contact.tsx`
- `src/pages/JacketsCollectionPage.tsx`

## Inputs & Specifications
- `c:\Dev\Active Projects\Zimthreads\PROJECT.md`
- `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\ORIGINAL_REQUEST.md`
- `c:\Dev\Active Projects\Zimthreads\AGENTS.md`
- `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_reviewer_2\review.md`
- `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_1\strategy.md`
- `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_2\strategy.md`
- `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_3\strategy.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Output
Write handoff report to `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_worker_iter2_1\handoff.md`.
Report completion via send_message.


## 2026-10-10T19:24:22Z
You are the Milestone 2 Iteration 2 Remediation Worker.
Your working directory is c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_worker_iter2_1.
Read your instructions in:
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_worker_iter2_1\DISPATCH.md
- c:\Dev\Active Projects\Zimthreads\PROJECT.md
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\ORIGINAL_REQUEST.md
- c:\Dev\Active Projects\Zimthreads\AGENTS.md
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_reviewer_2\review.md
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_1\strategy.md
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_2\strategy.md
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_3\strategy.md

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive files to modify:
- src/store/StoreContext.tsx
- src/pages/Booking.tsx
- src/components/CartDrawer.tsx
- src/pages/Contact.tsx
- src/pages/JacketsCollectionPage.tsx

Execute the remediation:
1. Make persistPublicRecord and StoreContext submission helpers return Promise<T> and throw on HTTP/network errors.
2. Await submission helpers in Booking.tsx, CartDrawer.tsx, Contact.tsx; render red error banners on failure; stay in editable form state; clear forms/cart only on successful persistence.
3. Memoize liveSelectedProduct in JacketsCollectionPage.tsx for ProductModal.
4. Verify TypeScript compilation and npm run build.
5. Test live database persistence.
Write handoff report to:
c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_worker_iter2_1\handoff.md.
Report completion via send_message.
