# Architecture & Fix Strategy: Async Persistence, Error Propagation & Rehydration Resilience

**Milestone**: Milestone 2 (Iteration 2)  
**Author**: Explorer 1 (`m2_explorer_iter2_1`)  
**Target Environment**: Neon PostgreSQL `rapid-hill-42448439`  
**Reference Input**: `m2_reviewer_2/review.md`  

---

## 1. Executive Summary & Root Cause Analysis

### 1.1 The Failure Mode
In Milestone 2 Iteration 1, Reviewer 2 identified a critical breakdown in customer submission persistence and error propagation:
1. **Fire-and-Forget Persistence**: Customer submissions (`addBooking`, `createOrder`, `addInquiry`) in `src/store/StoreContext.tsx` were implemented as synchronous functions that invoked `persistPublicRecord` without awaiting its completion.
2. **Silent Error Swallowing**: `persistPublicRecord` caught network errors and HTTP non-200 responses internally and returned `false`. This boolean return value was completely ignored by the calling functions.
3. **Dead Error Banners**: In `Booking.tsx`, `CartDrawer.tsx`, and `Contact.tsx`, the `try/catch` blocks surrounding submissions were unreachable on network drop or server failure because the store methods never threw an error.
4. **Broken Loading & Double-Submit Protection**: In each form, `isSubmitting` was flipped to `true` and then immediately back to `false` in the exact same synchronous execution frame (`finally { setIsSubmitting(false) }`). Real button loading states ("SECURING SLOT...", "PLACING ORDER...", "SENDING MESSAGE...") never rendered, and the buttons were not locked during in-flight network activity.
5. **Premature State Mutation & Cart Loss**: In `CartDrawer.tsx`, `createOrder` cleared the cart synchronously (`clearCart()`) before persistence even began. If the network dropped, the customer lost all cart items and was shown a false confirmation screen.
6. **Silent Record Dropping on Rehydration**: If a submission failed remotely, local storage retained the optimistic record. Upon window refocus or page reload, `fetchCloudData()` fetched state from Neon DB (where the record did not exist) and overwrote `localStorage`, silently deleting the unpersisted booking/order without warning.
7. **Stale Modal State in Jackets Page**: In `JacketsCollectionPage.tsx`, `ProductModal` received a static `selectedProduct` snapshot rather than deriving from live store state, violating price/inventory reactivity when admin updates occur.

---

## 2. Concrete Architectural Blueprint

```
+-----------------------------------------------------------------------------------+
|                                 CUSTOMER FORM                                     |
|  (Booking.tsx / CartDrawer.tsx / Contact.tsx / Dashboard.tsx)                     |
|                                                                                   |
|  1. Form Submit Event                                                             |
|  2. setIsSubmitting(true) -> Button shows loading state & disables double-click   |
|  3. await addBooking() / await createOrder() / await addInquiry()                 |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                             StoreContext.tsx (ASYNC)                              |
|                                                                                   |
|  Pessimistic Persistence Pattern:                                                 |
|  1. Construct record with unique ID, timestamp, and default status                |
|  2. await persistPublicRecord(entity, preparedRecord)                             |
|     - Uses AbortController with 15s timeout                                      |
|     - On fetch network drop -> throws Error("Network error...")                  |
|     - On HTTP !res.ok -> parses server errData.error and throws Error(...)        |
|     - On 200 OK -> returns saved record                                           |
|  3. ONLY on Success:                                                              |
|     - Update local state (setBookings / setOrders / setInquiries) with dedup      |
|     - For orders: clearCart() & close drawer                                      |
|     - Trigger success toast notification                                          |
|     - Return saved record to caller                                               |
+-----------------------------------------+-----------------------------------------+
                   |                                        |
                   | (ON SUCCESS)                           | (ON FAILURE / THROW)
                   v                                        v
+--------------------------------------+ +------------------------------------------+
|  FORM ADVANCES TO CONFIRMATION       | |  FORM CATCHES ERROR IN try/catch BLOCK   |
|  - Step 4 / Order Complete / Sent    | |  - setIsSubmitting(false)                |
|  - Opens WhatsApp dispatch           | |  - Cart & Form fields remain 100% INTACT |
|  - Toast notification visible        | |  - Red Alert Banner renders error text   |
+--------------------------------------+ +------------------------------------------+
```

---

## 3. Detailed Component Fix Specifications

### Fix 1: StoreContext.tsx — `persistPublicRecord`
Replace the error-swallowing boolean return with an explicit async function that throws on network drops, timeouts, or HTTP non-200 responses.

```ts
// Unauthenticated persistence helper for customer submissions
const persistPublicRecord = async <T,>(
  entity: "bookings" | "orders" | "inquiries",
  record: T,
): Promise<T> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000) // 15-second timeout

  let res: Response
  try {
    res = await fetch("/api/store", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "public_create",
        entity,
        record,
      }),
      signal: controller.signal,
    })
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(
        "Request timed out. Please check your internet connection and try again.",
      )
    }
    throw new Error(
      err.message ||
        "Network error: Unable to reach the server. Please check your internet connection.",
    )
  } finally {
    clearTimeout(timeoutId)
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    const errorMsg =
      errData.error ||
      `Server error (${res.status}): Failed to save ${entity} to database.`
    console.warn(`[StoreContext] Failed to persist ${entity} to cloud:`, errorMsg)
    throw new Error(errorMsg)
  }

  const json = await res.json().catch(() => ({}))
  return (json.record as T) || record
}
```

### Fix 2: StoreContext.tsx — `StoreContextType` Signatures
Update method signatures to return Promises:

```ts
interface StoreContextType {
  ...
  // Booking actions
  addBooking: (
    booking: Omit<BookingItem, "id" | "createdAt" | "status">,
  ) => Promise<BookingItem>
  updateBookingStatus: (id: string, status: BookingItem["status"]) => void
  deleteBooking: (id: string) => void

  // Order actions
  createOrder: (orderData: {
    customer: string
    email: string
    phone: string
    address: string
    city: string
    paymentMethod: OrderItem["paymentMethod"]
  }) => Promise<OrderItem>
  updateOrderStatus: (id: string, status: OrderItem["status"]) => void
  deleteOrder: (id: string) => void
  ...
  // Inquiry actions
  addInquiry: (
    inquiry: Omit<Inquiry, "id" | "date" | "read">,
  ) => Promise<Inquiry>
  markInquiryAsRead: (id: string, read?: boolean) => void
  deleteInquiry: (id: string) => void
  ...
}
```

### Fix 3: StoreContext.tsx — Pessimistic Submission Mutations
Implement pessimistic persistence in `addBooking`, `createOrder`, and `addInquiry`:

```ts
  // Bookings
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

    // 1. Await Neon cloud persistence FIRST
    const savedRecord = await persistPublicRecord("bookings", newBooking)

    // 2. Commit to local state only upon successful persistence (with dedup)
    setBookings((prev) => {
      if (prev.some((b) => b.id === savedRecord.id)) return prev
      return [savedRecord, ...prev]
    })
    showToast(
      "Booking Confirmed!",
      `Your booking reference is #${savedRecord.id}.`,
    )
    return savedRecord
  }

  // Orders
  const createOrder = async (orderData: {
    customer: string
    email: string
    phone: string
    address: string
    city: string
    paymentMethod: OrderItem["paymentMethod"]
  }): Promise<OrderItem> => {
    if (cart.length === 0) {
      throw new Error("Cannot place an order with an empty shopping bag.")
    }

    const randomNum = Math.floor(100 + Math.random() * 900)
    const summary = cart
      .map(
        (i) =>
          `${i.name}${i.size ? ` [${i.size}]` : ""}${i.customName ? ` [Custom: "${i.customName}"]` : ""} (x${i.quantity})`,
      )
      .join(", ")
    const totalAmount =
      cartTotal +
      (cartTotal >= settings.freeDeliveryThreshold ? 0 : settings.deliveryFee)

    const newOrder: OrderItem = {
      id: `ORD-${randomNum}`,
      customer: orderData.customer,
      email: orderData.email,
      phone: orderData.phone,
      address: orderData.address,
      city: orderData.city,
      items: [...cart],
      itemSummary: summary,
      totalAmount,
      paymentMethod: orderData.paymentMethod,
      status: "Processing",
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      createdAt: new Date().toISOString(),
    }

    // 1. Await Neon cloud persistence FIRST
    const savedRecord = await persistPublicRecord("orders", newOrder)

    // 2. Commit to local state and clear cart only upon successful persistence
    setOrders((prev) => {
      if (prev.some((o) => o.id === savedRecord.id)) return prev
      return [savedRecord, ...prev]
    })
    clearCart()
    setIsCartOpen(false)
    showToast(
      "Order Placed Successfully!",
      `Order #${savedRecord.id} has been recorded.`,
    )
    return savedRecord
  }

  // Inquiries
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
      createdAt: new Date().toISOString(),
    }

    // 1. Await Neon cloud persistence FIRST
    const savedRecord = await persistPublicRecord("inquiries", newInquiry)

    // 2. Commit to local state only upon successful persistence
    setInquiries((prev) => {
      if (prev.some((i) => i.id === savedRecord.id)) return prev
      return [savedRecord, ...prev]
    })
    showToast(
      "Message Sent!",
      "Thank you for reaching out. We will get back to you shortly.",
    )
    return savedRecord
  }
```

### Fix 4: StoreContext.tsx — Rehydration Overwrite Protection
In `fetchCloudData()`, protect recently committed client records (created within 30 seconds) from being overwritten if replication lag or edge caching delays cloud visibility on instant window refocus:

```ts
      if (Array.isArray(cloudBookings)) {
        setBookings((prev) => {
          const cloudIds = new Set(cloudBookings.map((b) => b.id))
          const recentLocal = prev.filter((b) => {
            if (cloudIds.has(b.id)) return false
            const ageMs = Date.now() - new Date(b.createdAt || 0).getTime()
            return ageMs < 30000
          })
          return [...recentLocal, ...cloudBookings]
        })
      }
      if (Array.isArray(cloudOrders)) {
        setOrders((prev) => {
          const cloudIds = new Set(cloudOrders.map((o) => o.id))
          const recentLocal = prev.filter((o) => {
            if (cloudIds.has(o.id)) return false
            const ageMs = Date.now() - new Date(o.createdAt || 0).getTime()
            return ageMs < 30000
          })
          return [...recentLocal, ...cloudOrders]
        })
      }
      if (Array.isArray(cloudInquiries)) {
        setInquiries((prev) => {
          const cloudIds = new Set(cloudInquiries.map((i) => i.id))
          const recentLocal = prev.filter((i) => {
            if (cloudIds.has(i.id)) return false
            const ageMs = Date.now() - new Date(i.createdAt || 0).getTime()
            return ageMs < 30000
          })
          return [...recentLocal, ...cloudInquiries]
        })
      }
```

### Fix 5: Form Call Sites — Await Submissions

#### In `src/pages/Booking.tsx`:
Line 134:
```ts
// Before:
const newBooking = addBooking(bookingData)

// After:
const newBooking = await addBooking(bookingData)
```
*Effect*:
- `isSubmitting` stays `true` during the HTTP roundtrip.
- Button shows "SECURING SLOT..." and is disabled against double-clicks.
- If network drops, error bubbles to `catch (err: any)`, sets `submitError`, stays on Step 3, and renders the red banner.
- Form inputs remain intact.

#### In `src/components/CartDrawer.tsx`:
Line 84:
```ts
// Before:
const order = createOrder({
  customer: name,
  email,
  phone,
  address,
  city: formData.city,
  paymentMethod: formData.paymentMethod,
})

// After:
const order = await createOrder({
  customer: name,
  email,
  phone,
  address,
  city: formData.city,
  paymentMethod: formData.paymentMethod,
})
```
*Effect*:
- `isSubmitting` stays `true` during the HTTP roundtrip.
- Button shows "PLACING ORDER..." and is disabled against double-clicks.
- If network drops, error bubbles to `catch (err: any)`, sets `checkoutError`, and renders the red banner.
- Cart items and customer checkout inputs remain 100% intact.

#### In `src/pages/Contact.tsx`:
Line 50:
```ts
// Before:
addInquiry({
  name,
  email,
  subject,
  message,
})

// After:
await addInquiry({
  name,
  email,
  subject,
  message,
})
```
*Effect*:
- `isSubmitting` stays `true` during the HTTP roundtrip (showing "SENDING MESSAGE...").
- On error, bubbles to `catch (err: any)`, sets `submitError`, and renders the red banner.
- Customer form inputs remain intact for easy retry.

#### In `src/pages/admin/Dashboard.tsx`:
Lines 333-356:
```ts
// Before:
const handleCreateBooking = (e: React.FormEvent) => {
  e.preventDefault()
  const serviceObj = ...
  addBooking({...})
  setNewBookingModal(false)
  setBookingForm({...})
}

// After:
const handleCreateBooking = async (e: React.FormEvent) => {
  e.preventDefault()
  const serviceObj =
    services.find((s) => s.id === bookingForm.serviceId) || services[0]
  try {
    await addBooking({
      customer: bookingForm.customer,
      email: bookingForm.email,
      phone: bookingForm.phone,
      serviceId: serviceObj.id,
      serviceName: serviceObj.title,
      price: serviceObj.price,
      priceNumeric: serviceObj.priceNumeric || 15,
      date: bookingForm.date,
      time: bookingForm.time,
      notes: bookingForm.notes,
    })
    setNewBookingModal(false)
    setBookingForm({
      customer: "",
      email: "",
      phone: "",
      serviceId: "clean",
      date: new Date().toISOString().split("T")[0],
      time: "10:00",
      notes: "",
    })
  } catch (err: any) {
    console.error("Admin booking creation error:", err)
    showToast(
      "Creation Failed",
      err.message || "Failed to persist booking to database.",
      "error",
    )
  }
}
```

### Fix 6: Minor Finding 2 — `src/pages/JacketsCollectionPage.tsx`
Add dynamic derivation for `liveSelectedProduct` identical to `Shop.tsx`:

```tsx
// Before (lines 9 & 261-264):
const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
...
<ProductModal
  product={selectedProduct}
  onClose={() => setSelectedProduct(null)}
/>

// After:
const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

const liveSelectedProduct = useMemo(() => {
  if (!selectedProduct) return null
  return products.find((p) => p.id === selectedProduct.id) || selectedProduct
}, [products, selectedProduct])
...
<ProductModal
  product={liveSelectedProduct}
  onClose={() => setSelectedProduct(null)}
/>
```
*Effect*:
If jacket prices or inventory are modified dynamically in Neon DB while the quick-view modal is open on `/collection/racing-jackets`, the modal reactively displays the latest price and stock.

---

## 4. Verification Protocol

To verify this implementation independently:

1. **TypeScript Typecheck**:
   ```powershell
   npx tsc --noEmit
   ```
   Must exit with code 0 and zero type errors.

2. **Production Build**:
   ```powershell
   npm run build
   ```
   Must compile cleanly in under 2 seconds.

3. **Milestone 2 Automated Persistence Suite**:
   ```powershell
   node scripts/test-milestone2-persistence.mjs
   ```
   Must pass all tests against live Neon DB `rapid-hill-42448439`.

4. **Adversarial Challenger Suite**:
   ```powershell
   node scripts/test-m2-adversarial-challenger2.mjs
   ```
   Must pass Suite 1, Suite 2, Suite 3, and confirm that `JacketsCollectionPage.tsx` modal derives from live product state.

5. **Adversarial Error Propagation Simulation**:
   Create and run an automated script (`scripts/test-m2-error-propagation.mjs`) that intercepts `/api/store` with network offline (mocking `fetch` rejection) and HTTP 500/400 errors:
   - Asserts that `addBooking` rejects with `Error`.
   - Asserts that `createOrder` rejects with `Error` and does NOT clear the cart.
   - Asserts that `addInquiry` rejects with `Error`.
   - Asserts that local state has 0 phantom entries added on failure.
   - Asserts that `isSubmitting` latch prevents concurrent double-clicks.
