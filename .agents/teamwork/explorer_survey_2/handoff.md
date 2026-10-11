# Handoff Report: Explorer 2 (Customer Flows & Live Data Integration)

## 1. Observation
1. **Booking Flow Submission & Storage**:
   - In `src/pages/Booking.tsx:105-120`, `handleConfirmBooking` invokes `addBooking(...)` from `useStore()` and dispatches a WhatsApp message.
   - In `src/store/StoreContext.tsx:469-485`, `addBooking` generates `id: BK-${randomNum}`, sets `status: "Pending"`, updates React state `setBookings(...)`, and sets `localStorage.setItem(STORAGE_KEYS.BOOKINGS, ...)` via `useEffect` (lines 281-283).
   - **Verbatim observation**: There is **no network call, `syncToCloud`, or API endpoint call** inside `addBooking`.
2. **Order Placement & Cart Checkout**:
   - In `src/components/CartDrawer.tsx:52-70`, `handleCheckoutSubmit` validates `name`, `email`, `phone`, `address` and invokes `createOrder(...)`.
   - In `src/store/StoreContext.tsx:502-546`, `createOrder` creates `newOrder` with `id: ORD-${randomNum}`, `status: "Processing"`, `createdAt`, clears the cart, and syncs only to `localStorage.setItem(STORAGE_KEYS.ORDERS, ...)` via `useEffect` (lines 284-286).
   - **Verbatim observation**: There is **no network call or cloud sync** inside `createOrder`.
3. **Contact / Inquiry Submission**:
   - In `src/pages/Contact.tsx:23-35`, `handleSubmit` invokes `addInquiry(...)`.
   - In `src/store/StoreContext.tsx:671-689`, `addInquiry` creates `newInquiry` with `id: INQ-${randomNum}`, `read: false`, updates state, and saves to `localStorage` (lines 290-292).
   - **Verbatim observation**: There is **no network call or cloud sync** inside `addInquiry`.
4. **Store Hydration from Cloud on Mount**:
   - In `src/store/StoreContext.tsx:300-348`, `useEffect` executes `fetchCloudData()`, calling `GET /api/store`.
   - In lines 309-314:
     ```typescript
     const {
       products: cloudProducts,
       services: cloudServices,
       blog_posts: cloudBlogPosts,
       settings: cloudSettings,
     } = result.data
     ```
   - **Verbatim observation**: `bookings`, `orders`, and `inquiries` are **completely omitted** from cloud extraction and state hydration.
5. **API Authorization Barrier**:
   - In `api/store.ts:50-54`:
     ```typescript
     const { key, data, adminToken } = body
     if (adminToken !== "Zimthreads200") {
       return res.status(401).json({ error: "Unauthorized" })
     }
     ```
   - **Verbatim observation**: `api/store.ts` enforces `adminToken !== "Zimthreads200"` across all POST requests. Public customers submitting a booking, order, or inquiry have no admin token.
6. **Product Catalog & Racing Jackets Reactivity**:
   - In `src/pages/Shop.tsx:38-46` and `src/pages/JacketsCollectionPage.tsx:13-21`, both views derive their product lists from `products` in `StoreContext.tsx`.
   - In `src/pages/Shop.tsx:48-51`, `minJacketPrice` is dynamically computed as `Math.min(...activeJacketProds.map((p) => p.price))`.
   - In `src/pages/admin/Dashboard.tsx:1468-1482`, the "Collective Pricing Desk" triggers `updateProductsBatch(updates)`, which calls `syncToCloud("products", next)` in `StoreContext.tsx:615-628`.
   - On page load, `fetchCloudData()` in `StoreContext.tsx:316-318` populates `products` from `result.data.products`, allowing live Neon database updates to reflect immediately.

## 2. Logic Chain
1. Observations 1, 2, and 3 demonstrate that client-side forms on `/booking`, `/contact`, and `CartDrawer.tsx` strictly update component state and `localStorage`.
2. Because no network request is made to any backend or cloud database, customer submissions cannot reach the Neon PostgreSQL database (`rapid-hill-42448439`).
3. Consequently, the admin dashboard at `/admin`, running on another device or after browser cache clear, cannot display customer bookings, orders, or inquiries.
4. Observation 4 proves that even if records were manually inserted into Neon for `bookings`, `orders`, or `inquiries`, `StoreContext.tsx` ignores them during initial load and falls back to mock `seedData.ts` or local cache.
5. Observation 5 reveals that even if the frontend were modified to dispatch submissions to `api/store.ts`, all public requests would be rejected with `401 Unauthorized` due to the blanket `adminToken` requirement.
6. Observation 6 proves that product catalog and racing jacket price/stock rendering already has complete reactive wiring in place. Once `/api/store` is reachable and populated in Neon, `/shop` and `/collection/racing-jackets` will automatically reflect the live prices and inventory.

## 3. Caveats
- Backend database schema creation and migration states were not evaluated in detail here, as Explorer 1 has primary jurisdiction over Neon connection strings, table DDL, and database migrations.
- Production Vercel environment variables (`process.env.NEON_DATABASE_URL`) were verified in source scripts and fallback strings, but live execution against Neon depends on active network configuration.
- Local Vite dev server does not natively serve `/api/store` without a Vite server middleware plugin or proxy configured in `vite.config.ts`.

## 4. Conclusion
To satisfy Requirements R1 and R2 for customer-facing flows:
1. **API Public Ingestion**: `/api/store` must support unauthenticated public creation for customer submissions (`key: "bookings" | "orders" | "inquiries"`), securely appending records without requiring `adminToken === "Zimthreads200"`, while retaining token protection for updates and deletes.
2. **Store Hydration**: `StoreContext.tsx` must be updated to unpack `bookings`, `orders`, and `inquiries` in `fetchCloudData()` on mount.
3. **Store Actions Dispatch**: `addBooking`, `createOrder`, and `addInquiry` in `StoreContext.tsx` must be updated to immediately dispatch new records to `/api/store`.
4. **Vite Dev Middleware**: A Vite server middleware plugin for `/api/store` must be provided in `vite.config.ts` so persistence operates during local dev and testing.

## 5. Verification Method
1. **Inspect Survey Artifact**:
   Read `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\explorer_survey_2\survey_customer_flows.md`.
2. **Codebase Inspection**:
   - Check `src/store/StoreContext.tsx` lines 309-314 to verify omission of `bookings`, `orders`, and `inquiries` from cloud fetch.
   - Check `src/store/StoreContext.tsx` lines 469-560 and 671-689 to verify absence of `syncToCloud` in `addBooking`, `createOrder`, and `addInquiry`.
   - Check `api/store.ts` line 52 to verify strict `adminToken` requirement blocking public submissions.
   - Check `src/pages/Shop.tsx` lines 38-51 and `src/pages/JacketsCollectionPage.tsx` lines 13-31 to verify reactive price calculation.
3. **Invalidation Conditions**:
   This report would be invalidated if customer submissions were already dispatched via an alternate endpoint or service worker not found in `src/`.
