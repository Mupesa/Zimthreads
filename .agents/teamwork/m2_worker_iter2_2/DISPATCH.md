# DISPATCH: Milestone 2 Worker (Iteration 2) — Async Persistence & Error Handling Remediation

## Objective
Implement genuine async persistence, error banners, and catalog reactivity across customer flows as specified by Reviewer 2's findings.

## Working Directory
`c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_worker_iter2_2`

## Key Specifications & Context
1. `ORIGINAL_REQUEST.md`: `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\ORIGINAL_REQUEST.md`
2. `PROJECT.md`: `c:\Dev\Active Projects\Zimthreads\PROJECT.md`
3. `AGENTS.md`: `c:\Dev\Active Projects\Zimthreads\AGENTS.md` (Strict account: `anesumupesa@gmail.com` / `Mupesa`, Neon DB `rapid-hill-42448439`)
4. Reviewer Findings: `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_reviewer_2\review.md`
5. Explorer Strategies:
   - `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_1\strategy.md`
   - `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_2\strategy.md`
   - `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_3\strategy.md`

## Detailed Tasks
1. `src/store/StoreContext.tsx`:
   - `persistPublicRecord`: Return `Promise<T>`. Wrap fetch with an AbortController timeout (e.g. 15s). Check `res.ok`, and throw an explicit `Error(errData.error || "Network error persisting to cloud")` if request fails or network drops.
   - Update `StoreContextType` interface and implementations:
     - `addBooking: (booking: Omit<Booking, "id" | "createdAt" | "status">) => Promise<Booking>`
     - `createOrder: (orderData: Omit<Order, "id" | "createdAt">) => Promise<Order>`
     - `addInquiry: (inquiry: Omit<Inquiry, "id" | "createdAt" | "read">) => Promise<Inquiry>`
   - Await `persistPublicRecord` before committing the created entity into local state and localStorage. Throw the error so the caller can catch it and display a user-facing error banner.
   - In `fetchCloudData()`: Avoid wiping unpersisted or freshly created local entities if cloud sync returns an empty array or lags slightly.
   - Remove automatic `setIsCartOpen(false)` inside `createOrder` so `CartDrawer.tsx` controls its own drawer/modal transitions.
2. `src/pages/Booking.tsx`:
   - Make `handleConfirmBooking` an `async` function.
   - Await `addBooking(...)` inside `try/catch`.
   - Maintain `isSubmitting = true` while request is in flight.
   - On error: catch error, set error state (`setError(err.message || "Failed to confirm booking")`), stay on Step 3, show red error alert banner, re-enable submission button.
   - On success: advance to Step 4 (Confirmation screen with WhatsApp link).
3. `src/components/CartDrawer.tsx`:
   - Make `handleCheckoutSubmit` an `async` function.
   - Await `createOrder(...)` inside `try/catch`.
   - On error: catch error, set error message (`setCheckoutError(...)`), keep cart items intact, display visible red error banner in modal, re-enable checkout button.
   - On success: clear cart and advance to order confirmation view.
4. `src/pages/Contact.tsx`:
   - Make `handleSubmit` an `async` function.
   - Await `addInquiry(...)` inside `try/catch`.
   - On error: set error message (`setSubmitError(...)`), retain user-entered form fields, display visible red error banner, re-enable submit button.
   - On success: reset form and display success confirmation.
5. `src/pages/JacketsCollectionPage.tsx`:
   - Memoize `liveSelectedProduct` via `useMemo` comparing `selectedProduct.id` against `products` array (parity with `Shop.tsx`).
   - Pass `product={liveSelectedProduct}` to `ProductModal`.
6. Verification & Build:
   - Run `npx tsc --noEmit` and `npm run build` — both must succeed with 0 errors.
   - Test live persistence against Neon DB `rapid-hill-42448439`.

## Exclusive File Ownership
- `src/store/StoreContext.tsx`
- `src/pages/Booking.tsx`
- `src/components/CartDrawer.tsx`
- `src/pages/Contact.tsx`
- `src/pages/JacketsCollectionPage.tsx`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Output
Write comprehensive handoff report to:
`c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_worker_iter2_2\handoff.md`
Report completion via send_message.


## 2026-10-10T21:50:12Z
Received dispatch message from parent b0f5ea69-02f8-446f-afc0-53122715a0c7 to execute Milestone 2 Remediation.
