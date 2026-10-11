# Milestone 2 Iteration 2 Explorer 1 Handoff Report: Async Persistence & Error Propagation

**Author**: Explorer 1 (`m2_explorer_iter2_1`)  
**Task**: Async Persistence and Error Propagation Fix Strategy for `StoreContext.tsx`  
**Reference Dispatch**: `m2_explorer_iter2_1/DISPATCH.md`  
**Strategy Document**: `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_1\strategy.md`  
**Date**: 2026-10-10  

---

## 1. Observation

1. **`src/store/StoreContext.tsx` lines 180–209 (`persistPublicRecord`)**:
   `persistPublicRecord` catches all network and HTTP errors internally and returns `false`:
   ```ts
   196: if (!res.ok) {
   197:   const errData = await res.json().catch(() => ({}))
   198:   console.warn(`[StoreContext] Failed to persist ${entity} to cloud:`, ...)
   199:   return false
   200: }
   201: return true
   202: } catch (err) {
   203:   console.warn(`[StoreContext] Network error persisting ${entity} to cloud:`, err)
   204:   return false
   205: }
   ```
2. **`src/store/StoreContext.tsx` lines 529–547, 572–621, 754–773**:
   `addBooking`, `createOrder`, and `addInquiry` are synchronous functions. They fire `persistPublicRecord` without awaiting its completion and immediately return the local record:
   ```ts
   545: persistPublicRecord("bookings", newBooking)
   546: return newBooking
   ...
   619: persistPublicRecord("orders", newOrder)
   620: return newOrder
   ...
   772: persistPublicRecord("inquiries", newInquiry)
   ```
   In `createOrder` (lines 611–613), `clearCart()` and `setIsCartOpen(false)` are called synchronously before persistence even begins.
3. **Form Submit Handlers in `Booking.tsx` (lines 114–160), `CartDrawer.tsx` (lines 56–116), and `Contact.tsx` (lines 27–66)**:
   All three form submit handlers are already structured as `async` functions with `try/catch/finally` blocks and `isSubmitting` state management:
   - `Booking.tsx` line 134: `const newBooking = addBooking(bookingData)` is unawaited.
   - `CartDrawer.tsx` line 84: `const order = createOrder({...})` is unawaited.
   - `Contact.tsx` line 50: `addInquiry({...})` is unawaited.
   Because the store calls are synchronous and never throw, their `catch (err)` blocks never execute during network failures. In the `finally` block, `setIsSubmitting(false)` executes synchronously in the exact same frame, meaning `isSubmitting` is never observed as `true` during actual HTTP flight.
4. **Rehydration in `src/store/StoreContext.tsx` lines 381–389 (`fetchCloudData`)**:
   `fetchCloudData` unconditionally sets `setBookings(cloudBookings)`, `setOrders(cloudOrders)`, and `setInquiries(cloudInquiries)` without preserving locally queued or unpersisted records.
5. **Modal Derivation in `src/pages/JacketsCollectionPage.tsx` line 261–264**:
   `ProductModal` receives static state snapshot `product={selectedProduct}`, while `src/pages/Shop.tsx` lines 23–26 derives `liveSelectedProduct` via `useMemo` from `products`.
6. **Existing Test Suite Output**:
   Running `node scripts/test-m2-adversarial-challenger2.mjs` yields:
   ```
   ⚠️ OBSERVATION / CAVEAT: JacketsCollectionPage.tsx uses static state snapshot for ProductModal rather than deriving from live products like Shop.tsx.
   ```
   And `npm run build` currently succeeds in 1.59s with zero errors.

---

## 2. Logic Chain

1. From **Observation 1 & 2**, `persistPublicRecord` swallows errors and is called unawaited inside synchronous store methods.
2. From **Observation 3**, form callers cannot catch network or HTTP errors because the store methods never throw or await. The button loading state (`isSubmitting`) flashes for 0ms, defeating double-submit prevention and leaving red error alert banners (`submitError` / `checkoutError`) unreachable.
3. Furthermore, in `createOrder` (Observation 2), wiping the cart before cloud persistence guarantees that a network drop destroys the customer's shopping bag while misleading them with a false confirmation screen.
4. From **Observation 4**, if a record fails to persist remotely, on subsequent window focus `fetchCloudData()` overwrites local state from Neon DB, silently deleting the customer's record without notice.
5. Therefore, a **Pessimistic Cloud Persistence Strategy** is strictly required:
   - `persistPublicRecord` must be an async function returning `Promise<T>` that explicitly throws on network errors, request timeouts (15s `AbortController`), and HTTP non-200 responses.
   - `addBooking`, `createOrder`, and `addInquiry` must return `Promise<T>`. They must `await persistPublicRecord(...)` FIRST before updating local state or clearing the cart.
   - If persistence fails, local state is untouched, cart is preserved, no success toast is shown, and the error re-throws to the caller form.
   - Form callers (`Booking.tsx`, `CartDrawer.tsx`, `Contact.tsx`, `Dashboard.tsx`) must `await` the submissions. `isSubmitting` will remain `true` throughout the HTTP roundtrip (locking the button and rendering "SECURING SLOT...", "PLACING ORDER...", etc.), and on failure, the error is caught to display the red alert banner.
6. From **Observation 4 & 5**, `fetchCloudData()` must protect recent local records (created within 30 seconds) from replication lag or refocus overwrite, and `JacketsCollectionPage.tsx` must derive `liveSelectedProduct` via `useMemo` to ensure modal price reactivity.

---

## 3. Caveats

1. **Admin Desk Mutations (Milestone 3 Scope)**: Administrative operations (`updateBookingStatus`, `deleteBooking`, `updateOrderStatus`, etc.) currently use fire-and-forget `syncToCloud`. Milestone 2 scope is strictly focused on customer-facing flows and submissions (`addBooking`, `createOrder`, `addInquiry`, and catalog reactivity). Admin full CRUD persistence will be addressed in Milestone 3.
2. **Network Timeout Threshold**: The recommended timeout in `persistPublicRecord` is set to 15,000ms (15 seconds). On extremely slow mobile 2G networks, this may time out if Neon cold start takes >15s. However, empirical testing shows Neon serverless SQL responds in 200–600ms, making 15s an optimal safety limit against hung browser sockets.
3. **Database Deduplication**: Backend deduplication for duplicate IDs was flagged in `test-m2-adversarial-challenger2.mjs`. The proposed frontend `some(b => b.id === savedRecord.id)` check guards client state, while backend deduplication in `api/store.ts` can be reinforced if required.

---

## 4. Conclusion

The strategy detailed in `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_1\strategy.md` provides a complete, robust, and minimally invasive solution for Milestone 2 Iteration 2. It:
1. Converts `persistPublicRecord`, `addBooking`, `createOrder`, and `addInquiry` to async functions with explicit error propagation and timeout handling.
2. Implements pessimistic mutation: local state is committed and cart is cleared only upon verified Neon cloud persistence.
3. Wires `await` in `Booking.tsx`, `CartDrawer.tsx`, `Contact.tsx`, and `Dashboard.tsx`, restoring genuine in-flight button locking and surfacing red error banners on network failure.
4. Safeguards `fetchCloudData()` against tab-refocus wipeout.
5. Resolves Finding 2 in `JacketsCollectionPage.tsx` with dynamic `liveSelectedProduct` memoization.

---

## 5. Verification Method

To verify the implementation once executed by Worker:

1. **Static Analysis & Typecheck**:
   ```powershell
   npx tsc --noEmit
   ```
   *Expected*: Exit code 0, 0 errors.

2. **Production Build Validation**:
   ```powershell
   npm run build
   ```
   *Expected*: Builds clean client bundle in under 2s with zero warnings or errors.

3. **Live Neon DB Persistence Suite**:
   ```powershell
   node scripts/test-milestone2-persistence.mjs
   ```
   *Expected*: All 8 tests pass against Neon project `rapid-hill-42448439`.

4. **Adversarial Boundary & Reactivity Challenger**:
   ```powershell
   node scripts/test-m2-adversarial-challenger2.mjs
   ```
   *Expected*: Clean pass on all suites including modal reactivity.

5. **Files to Inspect for Exact Changes**:
   - `src/store/StoreContext.tsx`: `persistPublicRecord` throws on error; `addBooking`, `createOrder`, `addInquiry` return Promises and await persistence; `fetchCloudData` preserves recent local items.
   - `src/pages/Booking.tsx`: line 134 has `await addBooking`.
   - `src/components/CartDrawer.tsx`: line 84 has `await createOrder`.
   - `src/pages/Contact.tsx`: line 50 has `await addInquiry`.
   - `src/pages/admin/Dashboard.tsx`: line 337 has `await addBooking` inside async handler with try/catch.
   - `src/pages/JacketsCollectionPage.tsx`: derives `liveSelectedProduct` and passes to `ProductModal`.
