# Handoff Report: Milestone 2 Explorer 2 (Customer Submission Forms)

## 1. Observation
1. **`api/store.ts` Public Creation Protocol**:
   - Lines 56-115 define `EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/` and explicit validators: `validateBookingRecord`, `validateOrderRecord`, and `validateInquiryRecord`.
   - `validateBookingRecord` requires non-empty `customer`, valid `email`, non-empty `phone`, and non-empty `serviceId`.
   - `validateOrderRecord` requires non-empty `customer`, valid `email`, non-empty `phone`, and a non-empty `items` array.
   - `validateInquiryRecord` requires non-empty `name`, valid `email`, non-empty `subject`, and non-empty `message`.
   - Lines 190-287 implement `action === "public_create"`. Permitted entities are strictly `bookings`, `orders`, and `inquiries`.
   - Database mutation prepends the prepared record atomically to the head of the respective JSONB array in `public.zimthreads_store` (`jsonb_build_array($2::jsonb) || COALESCE(zimthreads_store.data, '[]'::jsonb)`).
2. **`Booking.tsx` Flow Analysis**:
   - Lines 76-82 define `canNext()`:
     ```typescript
     const canNext = () => {
       if (step === 0) return !!selectedService
       if (step === 1)
         return details.name.trim() && details.email.trim() && details.phone.trim()
       if (step === 2) return selectedDate && selectedTime
       return true
     }
     ```
     `details.email.trim()` does not validate email format against `EMAIL_REGEX`.
   - Lines 105-137 define `handleConfirmBooking()`:
     ```typescript
     const newBooking = addBooking({
       customer: details.name,
       email: details.email,
       phone: details.phone,
       serviceId: serviceObj.id,
       serviceName: serviceObj.title,
       price: serviceObj.price,
       priceNumeric: serviceObj.priceNumeric || 15,
       date: selectedDate,
       time: selectedTime,
       notes: details.notes,
     })
     ```
     Notice `serviceObj.priceNumeric || 15`. It defaults to 15 (legacy USD), rather than Mauritian Rupees (300).
   - Confirmed booking reference is rendered in Step 4 at line 489: `{confirmedBooking?.id || "BK-CONFIRMED"}`.
   - There is no `isSubmitting` loading state or disabled attribute on the desktop confirm button (line 557) or mobile controller button (line 629).
3. **`CartDrawer.tsx` Flow Analysis**:
   - Lines 52-86 define `handleCheckoutSubmit`:
     ```typescript
     const handleCheckoutSubmit = (e: React.FormEvent) => {
       e.preventDefault()
       if (!formData.name || !formData.email || !formData.phone || !formData.address) return
       const order = createOrder({ ... })
       setOrderComplete(order)
       ...
     }
     ```
   - Only checks presence of `formData.email`; lacks regex email format verification.
   - Submission is synchronous; lacks `isSubmitting` flag and disabled state on the submit button (line 559).
   - Order confirmation displays `orderComplete.id` (line 320) and triggers WhatsApp message formatting (`formatOrderWhatsAppMessage`).
   - Line items from `cart` preserve `productId`, `name`, `price`, `quantity`, `size`, `img`, and `customName`.
4. **`Contact.tsx` Flow Analysis**:
   - Lines 23-35 define `handleSubmit`:
     ```typescript
     const handleSubmit = (e: React.FormEvent) => {
       e.preventDefault()
       if (!form.name || !form.email || !form.subject || !form.message) return
       addInquiry({
         name: form.name,
         email: form.email,
         subject: form.subject,
         message: form.message,
       })
       setSent(true)
     }
     ```
   - Lacks email regex check; synchronously calls `addInquiry` and unconditionally sets `sent = true`.
   - Lacks `isSubmitting` loading feedback and error display.
5. **`StoreContext.tsx` Implementation**:
   - Currently, `addBooking` (lines 469-485), `createOrder` (lines 502-546), and `addInquiry` (lines 671-689) only update React state and `localStorage`. They do not currently perform HTTP calls to `/api/store` with `action: "public_create"`.
   - In `fetchCloudData` (lines 309-328), only `products`, `services`, `blog_posts`, and `settings` are hydrated; `bookings`, `orders`, and `inquiries` are omitted from cloud hydration.

## 2. Logic Chain
1. From Observation 1, `api/store.ts` requires specific field presence, non-empty strings, and valid email format (`EMAIL_REGEX`) for all customer records under `action: "public_create"`. If an invalid email is submitted, the API rejects the request with HTTP 400.
2. From Observations 2, 3, and 4, all three customer forms currently check only string presence (`.trim()` or truthiness) for emails. If a user enters an unformatted email string, client submission succeeds but backend persistence would fail with HTTP 400. Adding `EMAIL_REGEX` client-side validation prevents bad requests.
3. From Observation 2, `priceNumeric` in `Booking.tsx` defaults to `15` when undefined. Since Zimthreads service packages cost between Rs 300 and Rs 800, this defaults to an incorrect legacy currency amount. Defaulting to `serviceObj.priceNumeric || 300` restores currency consistency.
4. From Observations 2, 3, and 4, all three submission handlers currently run synchronously without `isSubmitting` tracking. When persistence is wired to asynchronous `/api/store` HTTP calls, rapid clicks can trigger duplicate submissions, and network failures would leave the UI in an inconsistent state.
5. From Observation 5, wiring `addBooking`, `createOrder`, and `addInquiry` to send `POST /api/store` with `action: "public_create"` (either directly or via `StoreContext`) ensures every customer submission is atomically stored in the Neon database table `public.zimthreads_store`.
6. Updating `Booking.tsx`, `CartDrawer.tsx`, and `Contact.tsx` with `isSubmitting` states, error banners, and client validation ensures resilient, double-click-safe user experiences.

## 3. Caveats
- No caveats regarding form schema compatibility; the fields passed by `Booking.tsx`, `CartDrawer.tsx`, and `Contact.tsx` fully cover the requirements of `api/store.ts`.
- Implementation of the async network calls in `StoreContext.tsx` is being analyzed in parallel by Explorer 1 (`m2_explorer_1`). Explorer 2's specification provides the exact component-side contracts and error boundaries that integrate with Explorer 1's store refactoring.

## 4. Conclusion
1. **Schema Compliance**: The data models in `Booking.tsx`, `CartDrawer.tsx`, and `Contact.tsx` map cleanly to the Neon DB `public_create` contracts for `bookings`, `orders`, and `inquiries`.
2. **Key Enhancements Required**:
   - Add client-side email format validation (`EMAIL_REGEX`) to all three forms.
   - Fix currency fallback in `Booking.tsx` from `15` to `300`.
   - Add `isSubmitting` loading states, disabled button states, and error alerts to prevent double-clicks and gracefully handle network failures.
   - Include `customName` in `itemSummary` for Archival Racing Jackets orders.
3. Detailed specifications and drop-in code blueprints have been documented in `customer_forms_spec.md`.

## 5. Verification Method
1. **Code Review**: Inspect `customer_forms_spec.md` to verify all form schemas match `api/store.ts`.
2. **TypeScript Compilation**:
   ```bash
   npm run build
   ```
   Must compile with 0 errors.
3. **Empirical API Test**:
   Execute the challenger harness to confirm `public_create` behavior:
   ```bash
   node scripts/test-m1-challenger.mjs
   ```
   All suites (Suites 2, 3, 4) must pass with `[PASS]`.
4. **Invalidation Conditions**:
   - Modifying `api/store.ts` validation rules without updating the client validators.
   - Renaming entity keys from `bookings`, `orders`, `inquiries` in database storage.
