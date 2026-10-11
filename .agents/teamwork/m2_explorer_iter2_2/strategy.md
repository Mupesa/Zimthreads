# Concrete Fix Strategy: Form Async Handlers, Loading States & Error Resilience

**Target Components**:
1. `src/pages/Booking.tsx`
2. `src/components/CartDrawer.tsx`
3. `src/pages/Contact.tsx`
**Supporting Core**:
- `src/store/StoreContext.tsx`
- `src/pages/JacketsCollectionPage.tsx`

---

## 1. Executive Summary

Milestone 2 Iteration 1 Gate failed due to fire-and-forget, unawaited customer submission calls (`addBooking`, `createOrder`, `addInquiry`). Specifically:
1. `StoreContext.tsx` calls `persistPublicRecord` without `await`, and `persistPublicRecord` catches network errors internally and returns `false` without throwing.
2. In `Booking.tsx`, `CartDrawer.tsx`, and `Contact.tsx`, the `try/catch` blocks never catch network drops; `isSubmitting` resets to `false` in the exact same microtask tick (flashing for 0ms); and false confirmation screens ("BOOKING CONFIRMED", "ORDER CONFIRMED", "SENT!") are displayed even when Neon DB persistence fails completely.
3. In `CartDrawer.tsx`, `createOrder` immediately executes `clearCart()` and `setIsCartOpen(false)` before network persistence, permanently wiping the user's cart and force-closing the drawer so error banners and confirmation screens are unreachable.
4. On subsequent tab refocus or browser reload, `fetchCloudData()` overwrites local state from Neon DB, silently deleting customer records that were never persisted.

This document provides the exact, file-by-file implementation strategy to remediate these vulnerabilities.

---

## 2. Root Cause Analysis & Line-by-Line Inventory

| Component | File & Lines | Current Behavior | Defect / Failure Mode |
|---|---|---|---|
| **Booking Wizard** | `src/pages/Booking.tsx`<br>Lines 114–160 | `const newBooking = addBooking(bookingData)` is unawaited. Immediately runs `setConfirmedBooking(newBooking); setStep(4); openWhatsApp(...)`. | Skips Step 3 loading latch; skips `catch` block on network drop; customer sees Step 4 confirmation while Neon DB never received booking; error banner at line 468 is unreachable. |
| **Cart & Checkout Drawer** | `src/components/CartDrawer.tsx`<br>Lines 56–116 | `const order = createOrder({...})` is unawaited. Relies on `createOrder` which wipes cart and closes drawer synchronously. | Cart emptied before persistence verification; drawer closes immediately due to `setIsCartOpen(false)`; checkout modal error banner at line 434 is unreachable; user loses cart items on network error. |
| **Contact Form** | `src/pages/Contact.tsx`<br>Lines 27–67 | `addInquiry({...})` is unawaited. Immediately runs `setSent(true)`. | Form immediately unmounts to display success screen; loading state lasts 0ms; error banner at line 199 is unreachable; inquiry dropped on refresh. |
| **Persistence Helper** | `src/store/StoreContext.tsx`<br>Lines 180–208 | `persistPublicRecord` catches errors and returns `false`. | Swallows network errors and HTTP 4xx/5xx responses; callers cannot detect persistence failures. |
| **Store Actions** | `src/store/StoreContext.tsx`<br>Lines 87–125, 529–621, 754–773 | `addBooking`, `createOrder`, `addInquiry` are synchronous. `createOrder` calls `setIsCartOpen(false)`. | Functions do not return promises or await cloud persistence; `createOrder` prematurely force-closes CartDrawer. |
| **Jackets Modal Reactivity** | `src/pages/JacketsCollectionPage.tsx`<br>Line 261 | `<ProductModal product={selectedProduct} ... />` uses stale snapshot. | Modal does not reflect dynamic price/stock updates from live `products` context. |

---

## 3. Concrete Fix Strategy per Component

### 3.1 `src/pages/Booking.tsx`

#### Objectives:
- `handleConfirmBooking` must `await addBooking(...)`.
- `isSubmitting` must stay `true` for the entire duration of the cloud persistence request, displaying "SECURING SLOT..." and preventing double submissions.
- On network failure or rejection:
  - Wizard **remains on Step 3** (`setStep(4)` is NOT called).
  - Red error banner is populated and scrolled into view.
  - Submit button reverts to "CONFIRM & BOOK VIA WHATSAPP" and is re-enabled.
  - All form fields (service, date, time, customer details, notes) remain intact.
  - WhatsApp is NOT opened.
- On success:
  - `setConfirmedBooking(newBooking)` is set.
  - Transitions to Step 4 ("BOOKING CONFIRMED").
  - WhatsApp opens with formatted confirmation.
  - Form is cleared only when the user chooses "BOOK ANOTHER SESSION".

#### Precise Implementation Changes:

1. **Submission Handler (`handleConfirmBooking`)**:
```tsx
const handleConfirmBooking = async () => {
  if (!serviceObj || isSubmitting) return

  setIsSubmitting(true)
  setSubmitError(null)

  try {
    const bookingData = {
      customer: details.name.trim(),
      email: details.email.trim().toLowerCase(),
      phone: details.phone.trim(),
      serviceId: serviceObj.id,
      serviceName: serviceObj.title,
      price: serviceObj.price,
      priceNumeric: serviceObj.priceNumeric || 300,
      date: selectedDate,
      time: selectedTime,
      notes: details.notes.trim(),
    }

    // Await cloud persistence to Neon DB
    const newBooking = await addBooking(bookingData)

    // Advance to Step 4 ONLY on successful persistence
    setConfirmedBooking(newBooking)
    setStep(4)

    // Automatically dispatch booking details via WhatsApp
    const waText = formatBookingWhatsAppMessage({
      id: newBooking.id,
      customer: newBooking.customer,
      phone: newBooking.phone,
      email: newBooking.email,
      serviceName: newBooking.serviceName,
      price: newBooking.price,
      date: newBooking.date,
      time: newBooking.time,
      notes: newBooking.notes,
    })
    openWhatsApp(waText)
  } catch (err: any) {
    console.error("Booking submission error:", err)
    setSubmitError(
      err.message || "Failed to confirm booking. Please check your connection and try again.",
    )
    // Scroll error banner into view
    setTimeout(() => {
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }, 50)
  } finally {
    setIsSubmitting(false)
  }
}
```

2. **Error Banner & Buttons in Step 3**:
- Line 467–471 already renders `{submitError && (<div className="mb-4 p-3.5 bg-red-50 border border-red-300 text-red-700 text-xs font-medium">{submitError}</div>)}`.
- Lines 596–610 (desktop button) and lines 669–688 (mobile button) already respect `disabled={!canNext() || isSubmitting}` and render `SECURING SLOT...` when `isSubmitting` is true.
- Because `finally` resets `isSubmitting(false)`, the button re-enables automatically upon error, enabling immediate retry.

---

### 3.2 `src/components/CartDrawer.tsx`

#### Objectives:
- `handleCheckoutSubmit` must `await createOrder(...)`.
- `isSubmitting` must stay `true` during the in-flight request, displaying "PLACING ORDER..." and disabling buttons.
- On network failure:
  - Drawer **remains open**.
  - Checkout overlay **remains open**.
  - `checkoutError` banner is displayed at top of the checkout form.
  - Cart is **NOT cleared** (`clearCart()` is NOT executed).
  - Form fields (`name`, `email`, `phone`, `address`, `city`, `paymentMethod`) remain intact.
  - Submit button re-enables for immediate retry.
  - WhatsApp is NOT opened.
- On success:
  - Cart is cleared (`clearCart()` executes only after successful persistence).
  - `orderComplete` is set to the returned order object.
  - Transitions to `orderComplete` view ("ORDER CONFIRMED") with order reference, summary, and "SEND ORDER ON WHATSAPP" button.
  - WhatsApp is opened.
  - Drawer and checkout form are reset only when the user clicks "RETURN TO STORE" (`handleResetCheckout`).

#### Precise Implementation Changes:

1. **Checkout Submit Handler (`handleCheckoutSubmit`)**:
```tsx
const handleCheckoutSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (isSubmitting) return
  setCheckoutError(null)

  const name = formData.name.trim()
  const email = formData.email.trim().toLowerCase()
  const phone = formData.phone.trim()
  const address = formData.address.trim()

  if (!name || !email || !phone || !address) {
    setCheckoutError("Please fill in all required fields.")
    return
  }

  if (!EMAIL_REGEX.test(email)) {
    setCheckoutError("Please enter a valid email address.")
    return
  }

  if (cart.length === 0) {
    setCheckoutError("Your shopping bag is empty.")
    return
  }

  setIsSubmitting(true)

  try {
    // Await cloud persistence to Neon DB
    const order = await createOrder({
      customer: name,
      email,
      phone,
      address,
      city: formData.city,
      paymentMethod: formData.paymentMethod,
    })

    // Display order confirmed screen inside drawer
    setOrderComplete(order)

    // Automatically dispatch order receipt via WhatsApp
    const waText = formatOrderWhatsAppMessage({
      id: order.id,
      customer: order.customer,
      phone: order.phone,
      email: order.email,
      address: order.address,
      city: order.city,
      paymentMethod: order.paymentMethod,
      items: order.items,
      totalAmount: order.totalAmount,
    })
    openWhatsApp(waText)
  } catch (err: any) {
    console.error("Order submission error:", err)
    setCheckoutError(
      err.message || "Failed to place order. Please check your connection and try again.",
    )
  } finally {
    setIsSubmitting(false)
  }
}
```

2. **Crucial Decoupling in `StoreContext.tsx`**:
- In `StoreContext.tsx` `createOrder`:
  - **Remove `setIsCartOpen(false)`!** (Force-closing the drawer prevents the user from seeing `orderComplete` or `checkoutError`).
  - Move `clearCart()` to occur **after** `await persistPublicRecord("orders", newOrder)`. If persistence throws, `clearCart()` is bypassed and cart items remain intact.

---

### 3.3 `src/pages/Contact.tsx`

#### Objectives:
- `handleSubmit` must `await addInquiry(...)`.
- `isSubmitting` must stay `true` during the in-flight request, displaying "SENDING MESSAGE...".
- On network failure:
  - `setSent(true)` is **NOT called**.
  - Form remains active and visible.
  - `submitError` banner displays at top of form.
  - Form contents (`name`, `email`, `subject`, `message`) are **preserved** (no data loss).
  - Submit button reverts to "SEND MESSAGE" and is re-enabled for retry.
- On success:
  - `setSent(true)` runs, switching to the success card ("SENT! Thank you for reaching out.").
  - Form inputs are reset to empty.
  - Clicking "SEND ANOTHER MESSAGE" allows sending a new inquiry.

#### Precise Implementation Changes:

1. **Submission Handler (`handleSubmit`)**:
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (isSubmitting) return
  setSubmitError(null)

  const name = form.name.trim()
  const email = form.email.trim().toLowerCase()
  const subject = form.subject.trim()
  const message = form.message.trim()

  if (!name || !email || !subject || !message) {
    setSubmitError("Please complete all required fields.")
    return
  }

  if (!EMAIL_REGEX.test(email)) {
    setSubmitError("Please enter a valid email address.")
    return
  }

  setIsSubmitting(true)

  try {
    // Await cloud persistence to Neon DB
    await addInquiry({
      name,
      email,
      subject,
      message,
    })

    // Advance to sent success card only upon successful persistence
    setSent(true)
    setForm({ name: "", email: "", subject: "", message: "" })
  } catch (err: any) {
    console.error("Inquiry submission error:", err)
    setSubmitError(
      err.message ||
        "Could not dispatch message. Please check your connection and try again.",
    )
  } finally {
    setIsSubmitting(false)
  }
}
```

2. **Error Banner & Buttons in Contact Form**:
- Lines 198–202 already render `{submitError && (<div className="p-3.5 bg-red-50 border border-red-300 text-red-700 text-xs font-medium">{submitError}</div>)}`.
- Submit button at line 264 already renders `{isSubmitting ? "SENDING MESSAGE..." : "SEND MESSAGE"}` and `disabled={isSubmitting}`.
- Re-enables seamlessly on failure without wiping user inputs.

---

### 3.4 Supporting Core Adjustments in `StoreContext.tsx`

To support the above component strategies, `src/store/StoreContext.tsx` requires the following changes:

1. **`persistPublicRecord` (Throw on Failure)**:
```ts
const persistPublicRecord = async (
  entity: "bookings" | "orders" | "inquiries",
  record: any,
): Promise<void> => {
  const res = await fetch("/api/store", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "public_create",
      entity,
      record,
    }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    const errMsg =
      errData.error || `Failed to persist ${entity} to cloud (HTTP ${res.status})`
    console.warn(`[StoreContext] Failed to persist ${entity} to cloud:`, errMsg)
    throw new Error(errMsg)
  }
}
```

2. **`StoreContextType` Interface Updates**:
```ts
// Booking actions
addBooking: (
  booking: Omit<BookingItem, "id" | "createdAt" | "status">,
) => Promise<BookingItem>

// Order actions
createOrder: (orderData: {
  customer: string
  email: string
  phone: string
  address: string
  city: string
  paymentMethod: OrderItem["paymentMethod"]
}) => Promise<OrderItem>

// Inquiry actions
addInquiry: (inquiry: Omit<Inquiry, "id" | "date" | "read">) => Promise<Inquiry>
```

3. **`addBooking` Implementation**:
```ts
const addBooking = async (
  bookingData: Omit<BookingItem, "id" | "createdAt" | "status">,
): Promise<BookingItem> => {
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  const newBooking: BookingItem = {
    ...bookingData,
    id: `BK-${randomNum}`,
    status: "Pending",
    createdAt: new Date().toISOString(),
  }

  // Persist to Neon DB first; if it throws, error bubbles to caller
  await persistPublicRecord("bookings", newBooking)

  // Update local state only on success
  setBookings((prev) => [newBooking, ...prev])
  showToast(
    "Booking Confirmed!",
    `Your booking reference is #${newBooking.id}.`,
  )
  return newBooking
}
```

4. **`createOrder` Implementation**:
```ts
const createOrder = async (orderData: {
  customer: string
  email: string
  phone: string
  address: string
  city: string
  paymentMethod: OrderItem["paymentMethod"]
}): Promise<OrderItem> => {
  const randomNum = Math.floor(100 + Math.random() * 900)
  const isFreeDelivery = cartTotal >= settings.freeDeliveryThreshold
  const deliveryFee = isFreeDelivery ? 0 : settings.deliveryFee
  const totalAmount = cartTotal + deliveryFee

  const newOrder: OrderItem = {
    id: `ORD-${randomNum}`,
    customer: orderData.customer,
    email: orderData.email,
    phone: orderData.phone,
    items: [...cart],
    totalAmount,
    status: "Processing",
    paymentMethod: orderData.paymentMethod,
    address: orderData.address,
    city: orderData.city,
    date: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    createdAt: new Date().toISOString(),
  }

  // Persist to Neon DB first; if it throws, error bubbles to caller
  await persistPublicRecord("orders", newOrder)

  // State updates only upon successful persistence:
  setOrders((prev) => [newOrder, ...prev])
  clearCart()
  // NOTE: Do NOT call setIsCartOpen(false) here - allows CartDrawer to display orderComplete
  showToast(
    "Order Placed Successfully!",
    `Order #${newOrder.id} has been recorded.`,
  )
  return newOrder
}
```

5. **`addInquiry` Implementation**:
```ts
const addInquiry = async (
  inquiryData: Omit<Inquiry, "id" | "date" | "read">,
): Promise<Inquiry> => {
  const id = `INQ-${Math.floor(100 + Math.random() * 900)}`
  const newInquiry: Inquiry = {
    ...inquiryData,
    id,
    date: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    read: false,
  }

  // Persist to Neon DB first; if it throws, error bubbles to caller
  await persistPublicRecord("inquiries", newInquiry)

  setInquiries((prev) => [newInquiry, ...prev])
  showToast(
    "Message Sent!",
    "Thank you for reaching out. We will get back to you shortly.",
  )
  return newInquiry
}
```

6. **Admin Dashboard Compatibility Check (`src/pages/admin/Dashboard.tsx`)**:
- In `Dashboard.tsx` line 337:
  `handleCreateBooking` calls `addBooking({...})`.
  Because `addBooking` returns `Promise<BookingItem>`, `handleCreateBooking` can simply `await addBooking({...})` (or retain synchronous void consumption). To prevent unhandled rejections, update `handleCreateBooking` to `async` and wrap in try/catch or await.

---

### 3.5 `src/pages/JacketsCollectionPage.tsx` (Minor Finding 2)

#### Objective:
- Derive `liveSelectedProduct` reactively from `products` context so price and stock adjustments in Neon DB immediately update the open quick-view modal.

#### Change:
```tsx
// Around line 10:
const liveSelectedProduct = useMemo(
  () =>
    !selectedProduct
      ? null
      : products.find((p) => p.id === selectedProduct.id) || selectedProduct,
  [products, selectedProduct],
)

// In JSX line 261:
<ProductModal
  product={liveSelectedProduct}
  onClose={() => setSelectedProduct(null)}
/>
```

---

## 4. State & Lifecycle Matrix

| Event | `Booking.tsx` | `CartDrawer.tsx` | `Contact.tsx` |
|---|---|---|---|
| **Submit clicked** | `isSubmitting = true`<br>`submitError = null`<br>Button shows "SECURING SLOT..." | `isSubmitting = true`<br>`checkoutError = null`<br>Button shows "PLACING ORDER..." | `isSubmitting = true`<br>`submitError = null`<br>Button shows "SENDING MESSAGE..." |
| **In-flight network** | Concurrent clicks blocked<br>Back buttons disabled | Concurrent clicks blocked<br>Back button disabled | Concurrent clicks blocked |
| **Network failure (HTTP 4xx/5xx / offline)** | `submitError = errMsg`<br>`isSubmitting = false`<br>Stays on Step 3<br>Button re-enables "CONFIRM & BOOK VIA WHATSAPP"<br>Inputs preserved<br>Error banner auto-scrolled | `checkoutError = errMsg`<br>`isSubmitting = false`<br>Drawer stays OPEN<br>Modal stays OPEN<br>Cart is NOT cleared<br>Button re-enables "ORDER VIA WHATSAPP"<br>Inputs preserved | `submitError = errMsg`<br>`isSubmitting = false`<br>`sent` remains `false`<br>Form stays visible<br>Inputs preserved<br>Button re-enables "SEND MESSAGE" |
| **Network success (HTTP 200)** | `setConfirmedBooking(order)`<br>`setStep(4)`<br>Shows "BOOKING CONFIRMED"<br>WhatsApp opened<br>Reset available on "BOOK ANOTHER SESSION" | `orderComplete = order`<br>Cart cleared (`clearCart()`)<br>Shows "ORDER CONFIRMED"<br>WhatsApp opened<br>Drawer closed on "RETURN TO STORE" | `setSent(true)`<br>Form reset to empty<br>Shows "SENT!" card<br>Reset available on "SEND ANOTHER MESSAGE" |

---

## 5. Verification Plan

1. **Static Analysis & Build**:
   ```powershell
   npx tsc --noEmit
   npm run build
   ```
   Verify zero TypeScript errors across all modified files.

2. **Automated Adversarial Regression**:
   ```powershell
   node scripts/test-m2-adversarial-challenger2.mjs
   node scripts/test-m2-challenger.mjs
   ```
   Verify 100% pass across all boundary and reactivity test suites.

3. **Empirical Network Drop Simulation**:
   - Temporarily intercept `/api/store` with a 500 error or simulated timeout.
   - Run booking submission: verify remains on Step 3 with red error banner visible, button re-enabled.
   - Run cart checkout: verify drawer remains open with red error banner visible, cart retains all items, button re-enabled.
   - Run contact submission: verify form remains visible with red error banner visible, user message preserved, button re-enabled.
   - Re-enable `/api/store`: verify all three flows complete successfully, clear their respective states, and appear in Neon DB.
