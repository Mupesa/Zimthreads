# Customer Submission Forms Specification (`/booking`, Cart Checkout, `/contact`)
**Milestone 2 Specification Report**
**Author:** Milestone 2 Explorer 2
**Date:** 2026-10-10
**Target Environment:** Neon PostgreSQL Project `rapid-hill-42448439` | Zimthreads Collective

---

## 1. Executive Summary

This specification provides the authoritative engineering blueprint for all customer-facing submission flows in Zimthreads:
1. **Appointment Booking Wizard** (`/booking` via `src/pages/Booking.tsx`)
2. **Shopping Bag & Checkout Drawer** (Cart Drawer via `src/components/CartDrawer.tsx`)
3. **Studio Contact & Inquiry Form** (`/contact` via `src/pages/Contact.tsx`)

Each of these customer submission flows must seamlessly persist new records to the production Neon PostgreSQL database (`rapid-hill-42448439`) via the unauthenticated `public_create` action exposed by `/api/store` (`api/store.ts` and the `viteDevStoreApiPlugin` dev middleware in `vite.config.ts`), ensuring zero data loss and immediate visibility in the Admin Dashboard desks.

---

## 2. API Contract: `public_create` Protocol

### 2.1 Endpoint Specification
- **Method:** `POST`
- **Route:** `/api/store`
- **Authentication:** Unauthenticated (Public customer access; no `adminToken` required)
- **CORS:** `Access-Control-Allow-Origin: *`, `Methods: GET, POST, OPTIONS`

### 2.2 Request Body Structure
```json
{
  "action": "public_create",
  "entity": "bookings" | "orders" | "inquiries",
  "record": { ... }
}
```

### 2.3 Backend Validation Rules (`api/store.ts:59-115`)
The serverless handler applies strict validation before admitting records into the database:

| Entity | Required Fields & Validation Logic | Error Response on Failure |
|---|---|---|
| `bookings` | • `customer`: String, non-empty (trimmed)<br>• `email`: String, matches `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`<br>• `phone`: String, non-empty (trimmed)<br>• `serviceId`: String, non-empty (trimmed) | `HTTP 400`<br>`{"error": "Validation failed: ..."}` |
| `orders` | • `customer`: String, non-empty (trimmed)<br>• `email`: String, matches `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`<br>• `phone`: String, non-empty (trimmed)<br>• `items`: Array, `items.length >= 1` | `HTTP 400`<br>`{"error": "Validation failed: ..."}` |
| `inquiries` | • `name`: String, non-empty (trimmed)<br>• `email`: String, matches `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`<br>• `subject`: String, non-empty (trimmed)<br>• `message`: String, non-empty (trimmed) | `HTTP 400`<br>`{"error": "Validation failed: ..."}` |

### 2.4 Server Database Persistence Behavior
When valid, `api/store.ts` atomically prepends the prepared record to the head (`index 0`) of the respective JSONB array in table `public.zimthreads_store`:
```sql
INSERT INTO public.zimthreads_store (key, data, updated_at)
VALUES ($1, jsonb_build_array($2::jsonb), NOW())
ON CONFLICT (key) DO UPDATE
SET data = CASE 
      WHEN jsonb_typeof(zimthreads_store.data) = 'array' 
      THEN jsonb_build_array($2::jsonb) || COALESCE(zimthreads_store.data, '[]'::jsonb)
      ELSE jsonb_build_array($2::jsonb)
    END,
    updated_at = NOW()
RETURNING key;
```
This guarantees:
1. **LIFO Ordering**: The newest booking, order, or inquiry appears at index `0` immediately.
2. **No Data Loss**: Concurrent appends are safely merged into the JSONB array.
3. **Response Guarantee**: Returns `HTTP 200` with `{ success: true, record: preparedRecord }`.

---

## 3. Customer Flow 1: `/booking` (`src/pages/Booking.tsx`)

### 3.1 Flow & Architecture
`Booking.tsx` is a 5-step wizard:
- **Step 0 (Service)**: Select sneaker cleaning or restoration package (`selectedService`).
- **Step 1 (Details)**: Client full name, email, phone / WhatsApp, and shoe model/condition notes.
- **Step 2 (Date & Time)**: Preferred drop-off date (`min = today`) and time slot (09:00 - 16:00).
- **Step 3 (Review)**: Summary of service, price estimate, turnaround, client info, and drop-off slot.
- **Step 4 (Confirmed)**: Success screen showing booking reference (`BK-XXXX`), email dispatch message, and WhatsApp redirection button.

### 3.2 Current Implementation Analysis (`Booking.tsx:105-137`)
```typescript
const handleConfirmBooking = () => {
  if (!serviceObj) return

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

  setConfirmedBooking(newBooking)
  setStep(4)

  const waText = formatBookingWhatsAppMessage({ ... })
  openWhatsApp(waText)
}
```

### 3.3 Identified Deficiencies & Edge Cases
1. **Deficiency G1 — Client Email Validation Gap**:
   - `canNext()` on Step 1 only checks `details.email.trim()`.
   - If a customer types `client` without `@domain.com`, Step 1 allows proceeding. On Step 3 submission, backend `api/store.ts` rejects it with `Validation failed: invalid email address`.
   - **Fix**: Validate `EMAIL_REGEX.test(details.email.trim())` before leaving Step 1, with inline feedback.
2. **Deficiency G2 — Currency Default Fallback Bug**:
   - `priceNumeric: serviceObj.priceNumeric || 15`.
   - Zimthreads operates in Mauritian Rupees (Rs 300 to Rs 800). Defaulting to `15` is a legacy USD bug.
   - **Fix**: Default to `serviceObj.priceNumeric || 300`.
3. **Deficiency G3 — Missing Asynchronous Loading State**:
   - If `addBooking` persists over the network to Neon DB, the button currently has no `isSubmitting` spinner or disabled state.
   - A user clicking rapidly could spawn duplicate bookings or experience UI flicker.
   - **Fix**: Introduce `isSubmitting` state, disable buttons, and show "Securing Slot..." on both desktop and mobile buttons.
4. **Deficiency G4 — Missing Submission Error Handling**:
   - Currently, if cloud sync fails, the user is still advanced to Step 4.
   - **Fix**: Wrap `handleConfirmBooking` in `try ... catch`. On error, stay on Step 3, display an alert banner, and keep form inputs intact so the user can retry.
5. **Deficiency G5 — Mobile Step 3 Confirm Handler**:
   - The floating mobile controller (line 629) invokes `handleNext()`, which delegates to `handleConfirmBooking()`.
   - Both the desktop button (line 557) and mobile controller button (line 629) must reflect the loading state and disable during submission.

### 3.4 Prepared Schema Specification for `bookings`
```typescript
export interface BookingPayload {
  customer: string           // Trimmed, non-empty (e.g., "Alex Laurent")
  email: string              // Lowercase, valid email (e.g., "alex@example.mu")
  phone: string              // Phone or WhatsApp (e.g., "+230 5513 2614")
  serviceId: string          // Service package ID (e.g., "deep", "clean", "restore")
  serviceName: string        // Full service title (e.g., "DEEP CLEAN")
  price: string              // Formatted price string (e.g., "Rs 400")
  priceNumeric: number       // Numeric price (e.g., 400)
  date: string               // YYYY-MM-DD drop-off date (e.g., "2026-10-25")
  time: string               // Slot time (e.g., "11:00")
  notes?: string             // Optional shoe notes
}
```

### 3.5 Proposed Implementation Blueprint for `Booking.tsx`
```tsx
// Inside src/pages/Booking.tsx
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const [isSubmitting, setIsSubmitting] = useState(false)
const [submitError, setSubmitError] = useState<string | null>(null)

const isEmailValid = EMAIL_REGEX.test(details.email.trim())

const canNext = () => {
  if (step === 0) return !!selectedService
  if (step === 1)
    return (
      details.name.trim().length > 0 &&
      isEmailValid &&
      details.phone.trim().length > 0
    )
  if (step === 2) return selectedDate && selectedTime
  return true
}

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

    // addBooking supports async persistence or optimistic local return
    const newBooking = await addBooking(bookingData)

    setConfirmedBooking(newBooking)
    setStep(4)

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
    setSubmitError(err.message || "Failed to confirm booking with server. Please try again.")
  } finally {
    setIsSubmitting(false)
  }
}
```

---

## 4. Customer Flow 2: Cart Checkout (`src/components/CartDrawer.tsx`)

### 4.1 Flow & Architecture
`CartDrawer.tsx` manages the sliding shopping bag drawer and checkout modal:
- **Cart Bag View**: Shows cart items, quantity modifiers (+ / -), item remove button, subtotal, and free delivery progress bar (`settings.freeDeliveryThreshold`).
- **Checkout Modal**: Opened via `Proceed to Checkout`.
  - Captures: `name`, `phone`, `email`, `address`, `city` (Mauritius region dropdown), `paymentMethod`.
  - Calculates: Grand total (`cartTotal + deliveryFee`).
- **Order Complete View**: Shows order reference (`ORD-XXX`), total amount, delivery details, and WhatsApp order submission button.

### 4.2 Current Implementation Analysis (`CartDrawer.tsx:52-86`)
```typescript
const handleCheckoutSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  if (
    !formData.name ||
    !formData.email ||
    !formData.phone ||
    !formData.address
  )
    return

  const order = createOrder({
    customer: formData.name,
    email: formData.email,
    phone: formData.phone,
    address: formData.address,
    city: formData.city,
    paymentMethod: formData.paymentMethod,
  })

  setOrderComplete(order)

  const waText = formatOrderWhatsAppMessage({ ... })
  openWhatsApp(waText)
}
```

### 4.3 Line Items & Archival Racing Jackets Formatting
When customers purchase Archival Racing Jackets or apparel items:
1. **Jacket Details**:
   - `productId`: e.g. `prod-jacket-1` to `prod-jacket-14`.
   - `name`: Jacket name (e.g. `1998 Repsol Honda CBR Archival Racing Jacket`).
   - `size`: S, M, L, XL, XXL (validated from product size options).
   - `customName`: Optional embroidered name (e.g. `"MUPESA"`, uppercase).
   - `price`: Live dynamic price reflected from Neon DB catalog.
   - `img`: Cloudinary CDN URL.
2. **Item Summary Formulation**:
   Currently in `StoreContext.tsx`:
   `const summary = cart.map((i) => `${i.name}${i.size ? ` [${i.size}]` : ""} (x${i.quantity})`).join(", ")`
   **Enhancement**: Include custom embroidery in the summary:
   ```typescript
   const summary = cart
     .map((i) => `${i.name}${i.size ? ` [${i.size}]` : ""}${i.customName ? ` [Custom: "${i.customName}"]` : ""} (x${i.quantity})`)
     .join(", ")
   ```

### 4.4 Identified Deficiencies & Edge Cases
1. **Deficiency G1 — Client Email Validation**:
   - In `handleCheckoutSubmit`, only string presence is verified (`!formData.email`).
   - Invalid email strings cause backend `api/store.ts` to return `HTTP 400: Validation failed: invalid email address`.
   - **Fix**: Check `EMAIL_REGEX.test(formData.email.trim())` and display error banner.
2. **Deficiency G2 — Synchronous Submission & Loading Feedback**:
   - No `isSubmitting` flag.
   - **Fix**: Add `isSubmitting`, disable checkout button, show "Placing Order (Rs ...)...".
3. **Deficiency G3 — Schema Completeness (`total`, `shipping`, `paymentStatus`, `fulfillmentStatus`)**:
   - To align with both `OrderItem` interface and `PROJECT.md` contracts, ensure order record contains:
     - `totalAmount`: number
     - `total`: number (alias for totalAmount)
     - `shipping`: `{ address: string, city: string }`
     - `address`: string
     - `city`: string
     - `status`: `"Processing"`
     - `fulfillmentStatus`: `"Processing"`
     - `paymentStatus`: `"Pending"`

### 4.5 Proposed Implementation Blueprint for `CartDrawer.tsx`
```tsx
// Inside src/components/CartDrawer.tsx
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const [isSubmitting, setIsSubmitting] = useState(false)
const [checkoutError, setCheckoutError] = useState<string | null>(null)

const handleCheckoutSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
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
    const order = await createOrder({
      customer: name,
      email,
      phone,
      address,
      city: formData.city,
      paymentMethod: formData.paymentMethod,
    })

    setOrderComplete(order)

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
    setCheckoutError(err.message || "Failed to place order with server. Please try again.")
  } finally {
    setIsSubmitting(false)
  }
}
```

---

## 5. Customer Flow 3: `/contact` (`src/pages/Contact.tsx`)

### 5.1 Flow & Architecture
`Contact.tsx` handles customer inquiries:
- **Left Column**: Studio email (`settings.email`), WhatsApp number (`settings.phone`), Instagram link, and drop-off coordinates (`settings.location`).
- **Right Column**: Form fields for `name`, `email`, `subject`, and `message`.
- **Submission View**: Toggles to `MESSAGE DISPATCHED` with a WhatsApp chat button (`CHAT ON WHATSAPP`) and `SEND ANOTHER MESSAGE` button.

### 5.2 Current Implementation Analysis (`Contact.tsx:23-35`)
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

### 5.3 Identified Deficiencies & Edge Cases
1. **Deficiency G1 — Client Email Format Validation**:
   - Only checks presence of string.
   - If invalid email is provided, `api/store.ts` returns `HTTP 400: Validation failed: invalid email address`.
   - **Fix**: Check `EMAIL_REGEX.test(form.email.trim())`.
2. **Deficiency G2 — Missing Asynchronous Loading State**:
   - No `isSubmitting` state. Button remains "SEND MESSAGE" without disabling.
   - **Fix**: Add `isSubmitting`, disable button, show "Sending Message...".
3. **Deficiency G3 — Missing Error Banner**:
   - If server rejects submission or connection fails, the user is transitioned to `sent = true` without the message actually being saved in the database.
   - **Fix**: Only call `setSent(true)` upon successful persistence. If error occurs, display an alert banner and retain form inputs.

### 5.4 Proposed Implementation Blueprint for `Contact.tsx`
```tsx
// Inside src/pages/Contact.tsx
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const [isSubmitting, setIsSubmitting] = useState(false)
const [submitError, setSubmitError] = useState<string | null>(null)

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
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
    await addInquiry({
      name,
      email,
      subject,
      message,
    })

    setSent(true)
  } catch (err: any) {
    console.error("Inquiry submission error:", err)
    setSubmitError(err.message || "Could not dispatch message. Please try again or reach us via WhatsApp.")
  } finally {
    setIsSubmitting(false)
  }
}
```

---

## 6. Integration Contract with `StoreContext.tsx`

For optimal maintainability and clean separation of concerns, the public submission API call should be encapsulated within `StoreContext.tsx` helpers:
1. `addBooking(bookingData)`:
   - Performs optimistic state update to `bookings`.
   - Sends `POST /api/store` with `{ action: "public_create", entity: "bookings", record: newBooking }`.
   - Returns the created `BookingItem`.
2. `createOrder(orderData)`:
   - Formats line items, summary, and calculates total.
   - Performs optimistic state update to `orders`, clears cart, closes drawer.
   - Sends `POST /api/store` with `{ action: "public_create", entity: "orders", record: newOrder }`.
   - Returns the created `OrderItem`.
3. `addInquiry(inquiryData)`:
   - Performs optimistic state update to `inquiries`.
   - Sends `POST /api/store` with `{ action: "public_create", entity: "inquiries", record: newInquiry }`.

By making these methods return Promises (or async functions), both the UI components (`Booking.tsx`, `CartDrawer.tsx`, `Contact.tsx`) and the Admin Dashboard creators (`handleCreateBooking`) can `await` them and gracefully handle loading/error states.

---

## 7. Verification Matrix & Test Strategy

| Test Scenario | Action | Expected Outcome | Verification Tool |
|---|---|---|---|
| **V1. Booking Persistence** | Submit appointment on `/booking` | Record added to Neon DB `bookings` array with `BK-` ID; visible in Admin Bookings desk | Automated script / Neon SQL query |
| **V2. Order Persistence** | Complete checkout in `CartDrawer` with racing jacket | Record added to Neon DB `orders` array with `ORD-` ID and full jacket line items; visible in Admin Orders desk | Automated script / Neon SQL query |
| **V3. Inquiry Persistence** | Send message on `/contact` | Record added to Neon DB `inquiries` array with `INQ-` ID and `read: false`; visible in Admin Inquiries desk | Automated script / Neon SQL query |
| **V4. Invalid Email Handling** | Input invalid email on all 3 forms | Immediate client-side validation error displayed; submission blocked; no malformed record sent to API | Manual UI test & unit assertions |
| **V5. Double Click Prevention** | Rapidly click submit buttons | Buttons enter disabled loading state (`isSubmitting: true`); exactly 1 record created in database | Network log inspection |
| **V6. WhatsApp Integration** | Submit each form | Valid WhatsApp URL generated with customer name and reference number pre-filled | URL structure verification |

---

## 8. Conclusion
The customer-facing submission flows in `Booking.tsx`, `CartDrawer.tsx`, and `Contact.tsx` are fully designed and aligned with the Neon DB `public_create` schema. Applying the blueprints in this specification will guarantee reliable data persistence, robust error handling, and zero regression during Milestone 2 execution.
