# Technical Survey: Customer-Facing Flows & Live Data Integration

**Target System**: Zimthreads Collective (`c:\Dev\Active Projects\Zimthreads`)  
**Investigator**: Explorer 2 (Customer Flows Explorer)  
**Date**: 2026-10-10  
**Target Neon Project**: `rapid-hill-42448439` ("Zimthreads Collective") under `anesumupesa@gmail.com` / `Mupesa`  

---

## Executive Summary

This survey provides a comprehensive audit of all customer-facing routes, components, data models, submission mechanisms, and catalog rendering pipelines across the Zimthreads application. 

### Key Findings
1. **Critical Submission Disconnect**: Customer submissions across `/booking`, Cart & Checkout (`CartDrawer.tsx`), and `/contact` are currently trapped inside client-side `localStorage`. Neither `addBooking`, `createOrder`, nor `addInquiry` invokes any cloud synchronization API.
2. **Mount Hydration Gap**: On application mount, `StoreContext.tsx` only loads `products`, `services`, `blog_posts`, and `settings` from `/api/store`. It **completely ignores** `bookings`, `orders`, and `inquiries`, meaning even if these records existed in Neon, the frontend never restores them on page load.
3. **Public API Authentication Barrier**: The current `/api/store` serverless handler enforces an administrative token check (`adminToken === "Zimthreads200"`) on all POST operations. Public customer actions cannot currently post data without exposing admin credentials.
4. **Catalog Architecture**: Products (including the 14 Archival Racing Jackets) are properly reactive in React state and already wire batch price and stock updates through `updateProductsBatch` to `/api/store`. Integrating live persistence for public customer actions will make the entire store end-to-end synchronized.

---

## 1. Booking Flow (`/booking`)

### 1.1 Architecture & Route Entry
- **Route**: `/booking`
- **Mount Point**: `src/App.tsx:115` (`cleanPath === "/booking"`)
- **Page Component**: `src/pages/Booking.tsx` (650 lines)
- **Service Dependency**: `services` consumed via `useStore()`, filtered to `active !== false` (`Booking.tsx:74`).
- **Prefill Integration**: Supports incoming prefill from `/services` (`Services.tsx:15-18`) or `/` via `prefilledServiceId` stored in `StoreContext`.

### 1.2 Form State & Multi-Step Wizard
The booking flow is structured as a 5-step interactive wizard (`steps = ["Service", "Details", "Date & Time", "Review", "Confirmed"]`):

| Step | Name | Form State / Inputs | Validation (`canNext()`) |
| :--- | :--- | :--- | :--- |
| **0** | **Service Selection** | `selectedService`: string (Service ID e.g. `"clean"`, `"restore"`) | Requires `!!selectedService` (`Booking.tsx:77`) |
| **1** | **Client Details** | `details.name`: string (Full Name)<br>`details.email`: string (Email)<br>`details.phone`: string (Phone/WhatsApp)<br>`details.notes`: string (Sneaker issues/notes) | Requires `details.name.trim() && details.email.trim() && details.phone.trim()` (`Booking.tsx:78-79`) |
| **2** | **Date & Time** | `selectedDate`: string (`YYYY-MM-DD`, min=today)<br>`selectedTime`: string (Time slot from `["09:00", ... "16:00"]`) | Requires `selectedDate && selectedTime` (`Booking.tsx:80`) |
| **3** | **Review Summary** | Visual review of treatment package, price, turnaround, client details | Returns `true` |
| **4** | **Confirmed** | Displays confirmation card with `#BK-xxxx` reference and direct WhatsApp link | Terminal state |

### 1.3 Submission Handling & Current Destination
- **Handler**: `handleConfirmBooking` (`src/pages/Booking.tsx:105-137`):
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

  const waText = formatBookingWhatsAppMessage({...})
  openWhatsApp(waText)
}
```
- **Internal Store Operation** (`src/store/StoreContext.tsx:469-485`):
  - Assigns ID: `BK-${Math.floor(1000 + Math.random() * 9000)}`
  - Defaults status: `"Pending"`
  - Timestamps: `createdAt: new Date().toISOString()`
  - State update: `setBookings(prev => [newBooking, ...prev])`
  - Persistence: `localStorage.setItem("zimthread_bookings_v7", ...)` via `useEffect` (`StoreContext.tsx:281-283`).
- **Defects & Gaps**:
  - **Zero Cloud Dispatch**: No `fetch("/api/store")` or backend endpoint is called.
  - **Admin Blindness**: Bookings are completely absent from Neon PostgreSQL. When an administrator accesses `/admin`, this customer booking cannot be seen.
  - **No Cloud Hydration**: `fetchCloudData()` in `StoreContext.tsx:309-314` does not fetch `bookings` from Neon on startup.

---

## 2. Cart & Checkout / Order Flow

### 2.1 Architecture & Components
- **Cart Slide-Over**: `src/components/CartDrawer.tsx` (578 lines), toggled globally via `isCartOpen`.
- **Cart Open Triggers**:
  - `Navbar.tsx` (Shopping bag icon with badge count)
  - `ProductModal.tsx` (`handleAdd` invokes `addToCart(...)`)
  - `Shop.tsx` (`handleQuickAdd` invokes `addToCart(...)`)
- **Cart State Management**: `src/store/StoreContext.tsx:368-466`.

### 2.2 Cart Data Model
```typescript
export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  size?: string
  img: string
  customName?: string
}
```
- Custom name printing adds `product.customNamePrice || 50` to unit price (`StoreContext.tsx:377`).
- Free Delivery Calculation: `cartTotal >= settings.freeDeliveryThreshold` (default Rs 1500).
- Delivery Fee: `cartTotal >= threshold ? 0 : settings.deliveryFee` (default Rs 150).
- Grand Total: `cartTotal + deliveryFee`.

### 2.3 Checkout Form Fields & Validation
Inside `CartDrawer.tsx:382-535`, clicking "PROCEED TO CHECKOUT" renders the checkout modal:

| Field Name | Type / UI Control | Required | Validation / Options |
| :--- | :--- | :--- | :--- |
| `name` | Text input | Yes | `!formData.name` check |
| `phone` | Tel input | Yes | `!formData.phone` check |
| `email` | Email input | Yes | `!formData.email` check |
| `address` | Text input | Yes | `!formData.address` check |
| `city` | Select dropdown | Yes | Options: `"Port Louis"`, `"Grand Baie"`, `"Ebene / Cybercity"`, `"Tamarin / Black River"`, `"Flic en Flac"`, `"Curepipe"`, `"Rose Hill / Beau Bassin"`, `"Other Area"` |
| `paymentMethod`| Button selector grid | Yes | Options: `"Juice by MCB"`, `"Bank Transfer"`, `"Cash on Drop-off"`, `"Card / Online"` |
| `notes` | Textarea | No | Optional special delivery instructions |

### 2.4 Order Placement & Current Destination
- **Handler**: `handleCheckoutSubmit` (`src/components/CartDrawer.tsx:52-86`):
```typescript
const order = createOrder({
  customer: formData.name,
  email: formData.email,
  phone: formData.phone,
  address: formData.address,
  city: formData.city,
  paymentMethod: formData.paymentMethod,
})
setOrderComplete(order)
const waText = formatOrderWhatsAppMessage({...})
openWhatsApp(waText)
```
- **Internal Store Operation** (`src/store/StoreContext.tsx:502-546`):
  - Assigns ID: `ORD-${Math.floor(100 + Math.random() * 900)}`
  - Copies items: `items: [...cart]`
  - Item Summary: Concatenated items string e.g. `"Scuderia Rosso [XL] (x1)"`
  - Defaults status: `"Processing"`
  - Timestamps: `date` (`"Oct 10, 2026"`) and `createdAt: new Date().toISOString()`
  - State update: `setOrders(prev => [newOrder, ...prev])`
  - Clears cart: `clearCart()`
  - Persistence: `localStorage.setItem("zimthread_orders_v7", ...)` via `useEffect`.
- **Defects & Gaps**:
  - **Zero Cloud Dispatch**: No API call is made. Orders are stored only in the customer's browser `localStorage`.
  - **Fulfillment Blocker**: Admins viewing `/admin` Orders Desk cannot view real incoming customer purchases.
  - **No Cloud Hydration**: On app startup, `orders` is not fetched from Neon.

---

## 3. Contact & Inquiry Flow (`/contact`)

### 3.1 Architecture & Route Entry
- **Route**: `/contact`
- **Mount Point**: `src/App.tsx:118` (`cleanPath === "/contact"`)
- **Page Component**: `src/pages/Contact.tsx` (244 lines)

### 3.2 Form Fields & Validation
Inside `Contact.tsx:15-35`, the contact form collects:

| Field Name | Type | Required | Purpose |
| :--- | :--- | :--- | :--- |
| `form.name` | Text input | Yes | Sender name |
| `form.email` | Email input | Yes | Sender email address |
| `form.subject` | Text input | Yes | Inquiry topic (e.g. restoration, bespoke, wholesale) |
| `form.message` | Textarea | Yes | Inquiry details |

Validation check: `if (!form.name || !form.email || !form.subject || !form.message) return` (`Contact.tsx:25`).

### 3.3 Submission Handling & Current Destination
- **Handler**: `handleSubmit` (`src/pages/Contact.tsx:23-35`):
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
- **Internal Store Operation** (`src/store/StoreContext.tsx:671-689`):
  - Assigns ID: `INQ-${Math.floor(100 + Math.random() * 900)}`
  - Defaults read status: `read: false`
  - Sets date: `date: new Date().toLocaleDateString("en-US", ...)`
  - State update: `setInquiries(prev => [newInquiry, ...prev])`
  - Persistence: `localStorage.setItem("zimthread_inquiries_v7", ...)`
  - Displays toast notification: `"Message Sent!"`
- **Defects & Gaps**:
  - **Zero Cloud Dispatch**: `addInquiry` contains no network call.
  - **Inquiry Desks Desync**: Admin `/admin` Customer Inquiries desk will never receive contact form submissions from website visitors.
  - **No Cloud Hydration**: `inquiries` is omitted from `fetchCloudData()`.

---

## 4. Shop Catalog (`/shop`) & Archival Racing Jackets (`/collection/racing-jackets`)

### 4.1 Data Sources & Catalog Separation
Both pages consume `products` from `StoreContext.tsx`. The initial seed products live in `src/store/seedData.ts`:
- **Core Products**: 4 flagship items (`prod-1` Zimbabwe '02' Heritage Jersey, `prod-brace-heritage` African Heritage Beaded Bracelet, `prod-4` Heavyweight Boxy Hoodie, `prod-5` LLICYLAND Graphic Boxy Tee).
- **Archival Racing Jackets**: 14 items (`prod-jacket-ferrari-red-leather`, `prod-jacket-nascar-chase-twill`, `prod-jacket-marlboro-vintage-biker`, etc.).
- **Collection Metadata**: `racingJacketsCollection` in `seedData.ts:327-353`.

### 4.2 Filtering & Presentation Logic on `/shop`
File: `src/pages/Shop.tsx`:
1. **Separation Rule**: Individual racing jackets are **explicitly excluded** from the general shop grid:
   ```typescript
   const isCollectiveProduct =
     p.collectionId === "racing-jackets" ||
     racingJacketsCollection.productIds.includes(p.id) ||
     p.id.startsWith("prod-jacket-")
   if (isCollectiveProduct) return false
   ```
2. **Collection Gateway Card**: When viewing `"all"` or `"Apparel"`, `/shop` dynamically inserts a high-profile collective card for **"THE PADDOCK ARCHIVE"** with a direct CTA to `/collection/racing-jackets`.
3. **Dynamic Price Reflection**: `/shop` dynamically calculates:
   ```typescript
   const minJacketPrice = useMemo(() => {
     if (activeJacketProds.length === 0) return 1750
     return Math.min(...activeJacketProds.map((p) => p.price))
   }, [activeJacketProds])
   ```
   The card renders `"From Rs {minJacketPrice}"`. When prices update in Neon DB, this banner reflects the new starting price immediately.
4. **Visibility & Filtering**: Excludes products where `p.hidden === true`. Supports category filtering (`"Apparel"`, `"Cleaning"`, `"Accessories"`) and search queries across `p.name` and `p.description`.
5. **Hero Banner**: Renders `<FeaturedDropHero banner={settings.featuredDrop} />`.

### 4.3 Editorial Capsule on `/collection/racing-jackets`
File: `src/pages/JacketsCollectionPage.tsx`:
1. **Target Selection**:
   ```typescript
   const jacketProducts = useMemo(() => {
     return products.filter(
       (p) =>
         !p.hidden &&
         (p.collectionId === "racing-jackets" ||
         racingJacketsCollection.productIds.includes(p.id) ||
         p.id.startsWith("prod-jacket-")),
     )
   }, [products])
   ```
2. **Dynamic Range Header**: Computes `minPrice` and `maxPrice` from `jacketProducts`:
   - Masthead strip: `"From Rs {minPrice} — Rs {maxPrice}"`
   - Total editions: `"{jacketProducts.length} Curated Editions"`
3. **Card Presentation**: Renders edition number (`#01` to `#14`), image from Cloudinary, badge, stock count (`"Only X left"` if `<= 5`), price (`"Rs {p.price}"`), and clickable detail modal (`<ProductModal>`).

### 4.4 Price & Stock Propagation Mechanism
1. **Admin Desk**: In `src/pages/admin/Dashboard.tsx:1515-1640`, the "Collective Pricing & Inventory Desk" displays an inline table of all 14 jackets with `Price (Rs)` and `Stock (Qty)` input fields and a `Live / Hidden` toggle.
2. **Saving Updates**: Clicking "Save All Prices & Stock" triggers `handleSaveAllBatch()`, calling `updateProductsBatch(updates)` (`StoreContext.tsx:615-628`).
3. **Network Persistence**: `updateProductsBatch` calls `syncToCloud("products", next)`, which sends a `POST /api/store` with `{ key: "products", data: next, adminToken: "Zimthreads200" }`.
4. **Customer Reactivity**: Because both `/shop` and `/collection/racing-jackets` derive their view directly from React state `products`, changes are instantaneous in the current session.
5. **On Page Reload**: On mount, `StoreContext.tsx` executes `fetchCloudData()`, retrieving the latest `products` from Neon PostgreSQL (`public.zimthreads_store WHERE key = 'products'`). If Neon holds updated prices, the client immediately adopts them.

---

## 5. Comprehensive Data Models Inventory

| Entity Interface | Primary Key | Critical Fields | Initial Mock Count | Current Storage Key |
| :--- | :--- | :--- | :--- | :--- |
| `BookingItem` | `id` (`BK-xxxx`) | `customer`, `email`, `phone`, `serviceId`, `serviceName`, `price`, `priceNumeric`, `date`, `time`, `notes`, `status` (`"Pending" \| "Confirmed" \| "In Progress" \| "Completed" \| "Cancelled"`), `createdAt` | 4 in `seedData.ts` | `zimthread_bookings_v7` |
| `OrderItem` | `id` (`ORD-xxx`) | `customer`, `email`, `phone`, `address`, `city`, `items: CartItem[]`, `itemSummary`, `totalAmount`, `paymentMethod`, `status` (`"Processing" \| "Shipped" \| "Delivered" \| "Cancelled"`), `date`, `createdAt` | 4 in `seedData.ts` | `zimthread_orders_v7` |
| `Inquiry` | `id` (`INQ-xxx`) | `name`, `email`, `subject`, `message`, `date`, `read` (boolean) | 3 in `seedData.ts` | `zimthread_inquiries_v7` |
| `Product` | `id` (`prod-xxx`) | `name`, `category`, `price`, `stock`, `img`, `images`, `views`, `alt`, `description`, `sizes`, `badge`, `tag`, `collectionId`, `hidden`, `allowCustomName` | 18 in `seedData.ts` | `zimthread_products_v7` |
| `Service` | `id` (e.g. `"clean"`) | `title`, `subtitle`, `price`, `priceNumeric`, `desc`, `features[]`, `turnaround`, `img`, `active`, `badge` | 4 in `seedData.ts` | `zimthread_services_v7` |
| `BlogPost` | `id` (`post-xxx`) | `title`, `excerpt`, `content`, `category`, `date`, `img`, `readTime`, `author` | 3 in `seedData.ts` | `zimthread_blog_posts_v7` |
| `StoreSettings` | N/A (Object) | `storeName`, `tagline`, `email`, `phone`, `location`, `deliveryFee`, `freeDeliveryThreshold`, `featuredDrop` | 1 in `seedData.ts` | `zimthread_settings_v7` |

---

## 6. Gap Analysis & Live Neon DB Wiring Strategy

### 6.1 Identified Architecture Gaps

```
[Customer Client] ──(addBooking/createOrder/addInquiry)──► [localStorage ONLY] ❌ NO CLOUD DISPATCH
[Customer Client] ◄──(fetchCloudData on mount)──────────── [api/store ONLY fetches 4 entities] ❌ NO BOOKINGS/ORDERS/INQUIRIES
[api/store.ts]   ──(POST request)────────────────────────► [Enforces adminToken === "Zimthreads200"] ❌ BLOCKS PUBLIC SUBMISSIONS
[Vite Dev Server] ──(GET/POST /api/store)─────────────────► [SPA fallback: index.html] ❌ NO DEV SERVER API HANDLER
```

### 6.2 Target Solution Architecture

To fulfill requirements R1 and R2 while complying with Neon project constraints (`rapid-hill-42448439` under `anesumupesa@gmail.com`):

#### 1. Public Submissions API Endpoint Protocol
Extend `api/store.ts` (or add modular endpoints) to allow public creation without `adminToken`:
- **Allowed Public Actions / Keys**:
  - `key: "bookings"`: Append new `BookingItem` to `zimthreads_store.data`.
  - `key: "orders"`: Append new `OrderItem` to `zimthreads_store.data`.
  - `key: "inquiries"`: Append new `Inquiry` to `zimthreads_store.data`.
- **Atomic Appending**:
  Instead of overwriting the whole array via `EXCLUDED.data`, use PostgreSQL JSONB concatenation:
  ```sql
  INSERT INTO public.zimthreads_store (key, data, updated_at)
  VALUES ($1, jsonb_build_array($2::jsonb), NOW())
  ON CONFLICT (key) DO UPDATE
  SET data = EXCLUDED.data::jsonb || zimthreads_store.data,
      updated_at = NOW();
  ```
  This guarantees that concurrent bookings or orders prepend safely without overwriting concurrent records.
- **Admin Operations Guard**:
  Full updates, deletes, and status changes continue to require `adminToken === "Zimthreads200"`.

#### 2. Frontend Hydration in `StoreContext.tsx`
Modify `fetchCloudData()` (`src/store/StoreContext.tsx:300-348`) to hydrate all 7 entities on mount:
```typescript
const {
  products: cloudProducts,
  services: cloudServices,
  blog_posts: cloudBlogPosts,
  settings: cloudSettings,
  bookings: cloudBookings,
  orders: cloudOrders,
  inquiries: cloudInquiries,
} = result.data

if (Array.isArray(cloudBookings) && cloudBookings.length > 0) setBookings(cloudBookings)
if (Array.isArray(cloudOrders) && cloudOrders.length > 0) setOrders(cloudOrders)
if (Array.isArray(cloudInquiries) && cloudInquiries.length > 0) setInquiries(cloudInquiries)
```

#### 3. Frontend Customer Dispatch in `StoreContext.tsx`
Update customer action methods to trigger asynchronous cloud sync immediately:
- In `addBooking`: call `syncPublicToCloud("bookings", newBooking)`
- In `createOrder`: call `syncPublicToCloud("orders", newOrder)`
- In `addInquiry`: call `syncPublicToCloud("inquiries", newInquiry)`

#### 4. Vite Dev Server API Integration
In `vite.config.ts`, install a lightweight dev server middleware plugin for `/api/store` so that `fetch("/api/store")` connects directly to Neon PostgreSQL during local development (`npm run dev`) exactly as it does on Vercel serverless.

---

## 7. Downstream Milestones & Task Boundaries

| Flow / Module | Implementer Task | Verification Method |
| :--- | :--- | :--- |
| **Public API Layer** | Update `/api/store` to handle public customer submissions (bookings, orders, inquiries) and secure admin updates. | Send POST request without `adminToken` for booking, order, and inquiry; verify 200 OK. |
| **`StoreContext.tsx` Hydration** | Add `bookings`, `orders`, and `inquiries` to `fetchCloudData()`. Wire public dispatch into `addBooking`, `createOrder`, and `addInquiry`. | Hard refresh browser; verify records persist from Neon DB. |
| **Booking Flow** | Verify `/booking` submission saves to Neon and triggers WhatsApp. | Complete 5-step booking; verify record in Neon DB and Admin Bookings desk. |
| **Checkout Flow** | Verify CartDrawer checkout saves to Neon and clears cart. | Add products, complete checkout; verify order in Neon DB and Admin Orders desk. |
| **Contact Flow** | Verify `/contact` inquiry saves to Neon. | Submit inquiry; verify record in Neon DB and Admin Inquiries desk. |
| **Catalog Flow** | Verify batch updates from Admin Dashboard update `/shop` and `/collection/racing-jackets`. | Edit price in Admin; verify updated price on `/shop` and `/collection/racing-jackets`. |
