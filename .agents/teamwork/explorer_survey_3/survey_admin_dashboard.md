# SURVEY REPORT: Admin Dashboard Architecture, State Storage & Neon Persistence

**Explorer**: Explorer 3 (Admin Dashboard Explorer)  
**Date**: 2026-10-10  
**Target Codebase**: Zimthreads Collective (`c:\Dev\Active Projects\Zimthreads`)  
**Strict Neon Target**: Project `rapid-hill-42448439` ("Zimthreads Collective") under `anesumupesa@gmail.com` / `Mupesa`  

---

## 1. Executive Summary

A comprehensive, read-only architectural investigation was conducted on `src/pages/admin/Dashboard.tsx` (3,427 lines), `src/store/StoreContext.tsx` (849 lines), `src/store/seedData.ts` (926 lines), `api/store.ts`, and associated configuration files.

### Core Discoveries:
1. **Centralized Desk Implementation**: The entire Admin Dashboard UI—comprising 8 main desks (Dashboard Overview, Bookings, Orders, Services, Products & Collective Batch Pricing, Blog CMS, Customers, Inquiries, Settings) plus a Media Studio desk and 6 modal dialogs—is implemented within `src/pages/admin/Dashboard.tsx`.
2. **Current State Architecture**: The application relies on a React Context provider (`StoreContext.tsx`) that initializes state from browser `localStorage` (`zimthread_*_v7`), falling back to static seed data (`seedData.ts`).
3. **Severe Cloud Synchronization Disconnect**:
   - `bookings`, `orders`, and `inquiries` have **zero** cloud database synchronization. All creations, status transitions, and deletions exist strictly in the client's local memory and `localStorage`. When a customer books an appointment or places an order, the record never leaves their machine; the admin dashboard never receives it.
   - `products`, `services`, `blog_posts`, and `settings` attempt cloud persistence via `syncToCloud()`, which writes monolithic JSON blobs to `public.zimthreads_store (key, data, updated_at)`. However, on page mount, `fetchCloudData()` in `StoreContext.tsx` only parses `products`, `services`, `blog_posts`, and `settings`, completely omitting `bookings`, `orders`, and `inquiries`.
4. **API Endpoint & Auth Impediment**: `api/store.ts` strictly rejects all POST requests that lack `adminToken === "Zimthreads200"`. As a result, public customer submissions (`/booking`, cart checkout, `/contact`) cannot submit records without either exposing the admin secret or failing authentication.
5. **Vite Local Dev Gap**: `vite.config.ts` has no server middleware or proxy for `/api/store`. In local development (`vite` on port 8443), client requests to `/api/store` return 404 from Vite's static file handler unless handled.

---

## 2. Architectural Topology of the Admin System

```
                  ┌────────────────────────────────────────┐
                  │          StoreProvider                 │
                  │    (src/store/StoreContext.tsx)        │
                  └──────┬──────────────────────┬──────────┘
                         │                      │
           State / Dispatch Hooks          HTTP Fetch / Sync
                         │                      │
                         ▼                      ▼
        ┌────────────────────────────┐   ┌───────────────────────────┐
        │  src/pages/admin/          │   │  api/store.ts             │
        │  Dashboard.tsx             │   │  (Vercel Serverless / DB) │
        └────────────────────────────┘   └─────────────┬─────────────┘
          ├── Overview (Analytics)                     │
          ├── Bookings Desk                            │ Neon SQL over HTTP
          ├── Orders Desk                              │ (rapid-hill-42448439)
          ├── Services Desk                            ▼
          ├── Products & Batch Desk      ┌───────────────────────────┐
          ├── Blog CMS Desk              │  public.zimthreads_store  │
          ├── Customers Desk             │  (key, data, updated_at)  │
          ├── Inquiries Desk             └───────────────────────────┘
          ├── Store Settings Desk
          └── Media Studio Desk
```

### Route Mounting & Access Control
- **Route**: Mounted in `src/App.tsx:84-98` when `window.location.pathname.startsWith("/admin")`.
- **Authentication**: `Dashboard.tsx:75-94` checks `sessionStorage.getItem("zimthread_admin_auth") === "true"` against hardcoded password `"Zimthreads200"`. If unauthenticated, it renders a dedicated login portal (`Dashboard.tsx:454-524`).
- **Store Consumption**: `Dashboard.tsx:43-72` binds to `useStore()`, extracting state arrays and dispatch handlers.

---

## 3. Exhaustive Desk-by-Desk Audit

### Desk 1: Bookings Desk (`Dashboard.tsx:876–1090`)
- **Purpose**: Manage sneaker drop-offs, cleaning tiers, dates, time slots, and status progression.
- **Controls & Filters**:
  - Search input: filters by customer name, reference ID, service name, or email (`Dashboard.tsx:898–904`).
  - Status filter pills: `All`, `Pending`, `Confirmed`, `In Progress`, `Completed`, `Cancelled` (`Dashboard.tsx:906–926`).
  - Status change dropdown: `<select value={b.status} onChange={(e) => updateBookingStatus(b.id, e.target.value)}>` (`Dashboard.tsx:1047–1072`).
  - Direct WhatsApp trigger: generates click-to-chat URL via `getWhatsAppUrl()` (`Dashboard.tsx:1015–1028`).
  - Delete action: `deleteBooking(b.id)` (`Dashboard.tsx:1076`).
  - New Booking Modal trigger: `setNewBookingModal(true)` (`Dashboard.tsx:889`).
- **Current State Lifecycle**:
  - Initialized from `localStorage.getItem("zimthread_bookings_v7") || initialBookings` (`StoreContext.tsx:244–246`).
  - Synced to `localStorage` via `useEffect` (`StoreContext.tsx:280–282`).
  - **CRITICAL FLAW**: `addBooking`, `updateBookingStatus`, and `deleteBooking` **never** call `syncToCloud()`. No cloud persistence exists. On browser reload, if `localStorage` is cleared or accessed from another machine, bookings are lost.

---

### Desk 2: Orders Desk (`Dashboard.tsx:1093–1304`)
- **Purpose**: Track e-commerce purchases, delivery details, item breakdown, payment methods, and fulfillment statuses.
- **Controls & Tables**:
  - Search input: matches order ID, customer name, items summary, payment method (`Dashboard.tsx:1109–1115`).
  - Status filter pills: `All`, `Processing`, `Shipped`, `Delivered`, `Cancelled` (`Dashboard.tsx:1117–1136`).
  - Orders Table: columns for Order ID, Customer & City, Items Summary, Total & Payment, Status, and Actions (`Dashboard.tsx:1140–1302`).
  - Status change dropdown: `updateOrderStatus(o.id, e.target.value)` (`Dashboard.tsx:1259–1282`).
  - View Order Breakdown Modal: `setViewOrder(o)` opens full line-item inspector with customer address, payment method, line item images, quantities, pricing, and WhatsApp follow-up button (`Dashboard.tsx:1285`, modal at lines 3200–3302).
  - Delete action: `deleteOrder(o.id)` (`Dashboard.tsx:1291`).
- **Current State Lifecycle**:
  - Initialized from `localStorage.getItem("zimthread_orders_v7") || initialOrders` (`StoreContext.tsx:247–249`).
  - Synced to `localStorage` via `useEffect` (`StoreContext.tsx:283–285`).
  - **CRITICAL FLAW**: `createOrder`, `updateOrderStatus`, and `deleteOrder` **never** call `syncToCloud()`. Order data never touches Neon DB.

---

### Desk 3: Products Desk & Collective Batch Pricing Desk (`Dashboard.tsx:1408–1844`)
- **Purpose**: Manage the general product catalog (cleaning supplies, custom apparel, accessories) and the specialized **Retro Motorsport Collective** (14 Archival Racing Jackets).
- **Sub-Desk 1: Collective Batch Pricing & Inventory Desk (`Dashboard.tsx:1515–1687`)**:
  - Filtered target: `jacketProducts = products.filter(p => p.collectionId === "racing-jackets" || p.id.startsWith("prod-jacket-"))`.
  - Specifically targets all 14 jackets:
    1. `prod-jacket-ferrari-red-leather`
    2. `prod-jacket-ferrari-pink-white`
    3. `prod-jacket-mercedes-white-black`
    4. `prod-jacket-jack-daniels-black`
    5. `prod-jacket-mercedes-warsteiner`
    6. `prod-jacket-ferrari-black-red-white`
    7. `prod-jacket-ferrari-collar-edition`
    8. `prod-jacket-bmw-m-power`
    9. `prod-jacket-ferrari-lower-right`
    10. `prod-jacket-red-bull-blue`
    11. `prod-jacket-red-bull-black-white`
    12. `prod-jacket-ferrari-red`
    13. `prod-jacket-audi-sport-red`
    14. `prod-jacket-ferrari-windbreaker`
  - Inline controls per jacket:
    - Visibility toggle: `updateProduct(j.id, { hidden: !j.hidden })` (`Dashboard.tsx:1601`).
    - Price input: `handleBatchPriceChange(j.id, "price", value)` (`Dashboard.tsx:1617–1633`).
    - Stock quantity input: `handleBatchPriceChange(j.id, "stock", value)` (`Dashboard.tsx:1636–1651`).
    - Dirty tracking: `batchPrices` map tracks modified rows with yellow highlight (`Dashboard.tsx:1564–1574`).
    - Single-row Save button: `updateProduct(j.id, { price, stock })` (`Dashboard.tsx:1658–1671`).
    - Save All button: `handleSaveAllBatch()` converts dirty entries to `{ id, changes: { price, stock } }[]` and invokes `updateProductsBatch(updates)` (`Dashboard.tsx:1468–1482`).
- **Sub-Desk 2: General Catalog Grid (`Dashboard.tsx:1690–1841`)**:
  - Filter categories: `All`, `Active`, `Hidden`, `Motorsport`, `Core`, `Cleaning`, `Apparel`, `Accessories` (`Dashboard.tsx:1693–1727`).
  - Search query matching name, description, badge.
  - Inline stock modification: `updateProduct(p.id, { stock: parseInt(...) })` (`Dashboard.tsx:1803`).
  - Inline hide/unhide toggle: `updateProduct(p.id, { hidden: !p.hidden })` (`Dashboard.tsx:1813`).
  - Full Edit Modal trigger: `setEditProduct(p)` (`Dashboard.tsx:1824`).
  - Delete action: `deleteProduct(p.id)` (`Dashboard.tsx:1830`).
  - Add New Product Modal trigger: `setNewProductModal(true)` (`Dashboard.tsx:1506`).
- **Current State Lifecycle**:
  - Initialized from `localStorage` merged with `initialProducts` (`StoreContext.tsx:193–228`).
  - Mutation handlers (`addProduct`, `updateProduct`, `updateProductsBatch`, `deleteProduct`) invoke `syncToCloud("products", next)`.
  - `fetchCloudData()` on mount retrieves `products` array from cloud.
  - **DEFECT**: The merge logic in `StoreContext.tsx:193–228` forces hardcoded properties for `prod-4` and `prod-5` and merges with initial IDs, creating risk of resurrecting deleted products or overriding database edits upon reload.

---

### Desk 4: Services Desk (`Dashboard.tsx:1307–1405`)
- **Purpose**: Configure sneaker cleaning tiers, restorations, pricing tags, features, and active availability.
- **Controls & Actions**:
  - Service card display showing title, subtitle, price, turnaround, features checklist, and status badge (`Dashboard.tsx:1327–1375`).
  - Active/Disabled toggle button: `updateService(s.id, { active: s.active === false })` (`Dashboard.tsx:1380`).
  - Edit Service Modal: `setEditService(s)` (`Dashboard.tsx:1388`).
  - Delete Service: `deleteService(s.id)` (`Dashboard.tsx:1394`).
  - Add New Service Modal: `setNewServiceModal(true)` (`Dashboard.tsx:1320`).
- **Current State Lifecycle**:
  - Initialized from `localStorage` merged with `initialServices` (`StoreContext.tsx:229–243`).
  - Mutations call `syncToCloud("services", next)`.
  - Rehydrates on mount if `cloudServices` array exists.

---

### Desk 5: Blog Posts CMS Desk (`Dashboard.tsx:1848–1923`)
- **Purpose**: Manage editorial articles, shoe care guides, and streetwear lookbooks.
- **Controls & Actions**:
  - Article list displaying thumbnail, category, date, author, title, and excerpt (`Dashboard.tsx:1869–1903`).
  - Edit Article Modal: `setEditBlog(post)` (`Dashboard.tsx:1907`).
  - Delete Article: `deleteBlogPost(post.id)` (`Dashboard.tsx:1913`).
  - Publish Article Modal: `setNewBlogModal(true)` (`Dashboard.tsx:1861`).
- **Current State Lifecycle**:
  - Initialized from `localStorage` (`StoreContext.tsx:250–252`).
  - Mutations call `syncToCloud("blog_posts", next)`.
  - Rehydrates on mount from `cloudBlogPosts`.

---

### Desk 6: Customers Directory Desk (`Dashboard.tsx:1926–2012`)
- **Purpose**: View registered clients across Mauritius, lifetime spend, booking counts, order counts, and tier statuses (`VIP`, `Active`, `New`).
- **Implementation**:
  - This desk is **100% computed** via `useMemo` in `StoreContext.tsx:729–792` by aggregating customer details across `bookings` and `orders`.
  - **DIRECT IMPLICATION**: Because `bookings` and `orders` currently fail to sync with the cloud database, the Customers directory displays only stale local cache. Once `bookings` and `orders` sync properly with Neon, the Customers directory will automatically become live and accurate.

---

### Desk 7: Customer Inquiries Desk (`Dashboard.tsx:2015–2114`)
- **Purpose**: Inbox for customer contact messages submitted through `/contact`.
- **Controls & Actions**:
  - Filter tabs: `All`, `Unread`, `Read` (`Dashboard.tsx:2027–2040`).
  - Unread indicator dot: animated pulse dot for unread messages (`Dashboard.tsx:2074`).
  - Mark as Read / Unread toggle: `markInquiryAsRead(inq.id, !inq.read)` (`Dashboard.tsx:2097`).
  - Delete inquiry: `deleteInquiry(inq.id)` (`Dashboard.tsx:2103`).
  - Notification counter: sidebar and topbar badges display `unreadInquiriesCount` (`Dashboard.tsx:250–253, 554–557, 620–622`).
- **Current State Lifecycle**:
  - Initialized from `localStorage` (`StoreContext.tsx:253–255`).
  - **CRITICAL FLAW**: `addInquiry` (in `src/pages/Contact.tsx`), `markInquiryAsRead`, and `deleteInquiry` **never** sync to the cloud. Customer inquiries remain stranded on the user's browser, completely invisible to the admin.

---

### Desk 8: Store Settings Desk (`Dashboard.tsx:2117–2484`)
- **Purpose**: Global storefront configuration, hero drop banner, delivery thresholds, store branding, and Cloudinary API configuration.
- **Components**:
  1. **Featured Hero Drop Banner (`Dashboard.tsx:2129–2246`)**:
     - `enabled`: boolean toggle for hero banner visibility.
     - `imageUrl`: Cloudinary CDN banner URL via `ImageUploader`.
     - `productId`: dropdown selector linking the banner to a specific product (e.g. LLICYLAND tee, Ferrari jacket).
     - Preview display: live banner preview box.
     - Save button: `handleSaveSettings` saves and triggers `syncToCloud("settings", next)`.
  2. **Brand & Logistics Form (`Dashboard.tsx:2248–2380`)**:
     - Fields: `storeName`, `tagline`, `email`, `phone`, `location`, `deliveryFee`, `freeDeliveryThreshold`.
     - Form submit: `handleSaveSettings` saves and triggers `syncToCloud("settings", next)`.
  3. **Cloudinary CDN Configuration (`Dashboard.tsx:2382–2482`)**:
     - Fields: `cloudName`, `defaultFolder`, `apiKey`, `apiSecret`.
     - Action: `handleTestConnection` tests signed API connectivity; `handleSaveCloudinaryConfig` persists to `localStorage`.

---

### Desk 9: Media Studio Desk (`Dashboard.tsx:2487–2674`)
- **Purpose**: Direct CDN upload laboratory with automatic image optimization (`f_auto,q_auto`).
- **Controls**:
  - Target folder selector (`zimthreads/products`, `zimthreads/services`, `zimthreads/blog`, `zimthreads/general`).
  - `ImageUploader` component with direct upload to Cloudinary.
  - Recent session uploads history with one-click URL copying.

---

## 4. Modal Dialogs Deep Dive

| Modal | Lines in `Dashboard.tsx` | Trigger Handler | Form Submit Handler | Actions Dispatched |
|---|---|---|---|---|
| **1. New Booking Modal** | 2680–2814 | `setNewBookingModal(true)` | `handleCreateBooking` (333–359) | `addBooking({...})` |
| **2. New Product Modal** | 2815–2966 | `setNewProductModal(true)` | `handleCreateProduct` (361–383) | `addProduct({...})` |
| **3. Edit Product Modal** | 2968–3089 | `setEditProduct(p)` | `handleSaveEditProduct` (385–390) | `updateProduct(id, {...})` |
| **4. New Service Modal** | 3091–3197 | `setNewServiceModal(true)` | `handleCreateService` (392–412) | `addService({...})` |
| **5. View Order Modal** | 3200–3302 | `setViewOrder(o)` | N/A (read-only view) | WhatsApp link, line-items view |
| **6. New Blog Post Modal**| 3304–3423 | `setNewBlogModal(true)` | `handleCreateBlog` (421–440) | `addBlogPost({...})` |

---

## 5. Current State Storage & Data Lifecycle Breakdown

### Current Flow for Mutations:
```
User Action (e.g. updateBookingStatus)
      │
      ▼
StoreContext Hook Dispatch
      │
      ├─► React useState updated (setBookings)
      │
      ├─► useEffect writes to localStorage ("zimthread_bookings_v7")
      │
      └─► syncToCloud()?
            ├── For products, services, blog_posts, settings: YES (posts to /api/store)
            └── For bookings, orders, inquiries: NO (Omitted! Never synced!)
```

### Current Flow for Initial Mount / Browser Refresh:
```
Browser Hard Refresh / Navigation to /admin
      │
      ▼
StoreProvider Mounts
      │
      ├─► State initialized synchronously from localStorage (or seedData fallback)
      │
      └─► useEffect: fetchCloudData() fetches GET /api/store
            │
            ├─► Reads result.data.products   ──► setProducts(cloudProducts)
            ├─► Reads result.data.services   ──► setServices(cloudServices)
            ├─► Reads result.data.blog_posts ──► setBlogPosts(cloudBlogPosts)
            ├─► Reads result.data.settings   ──► setSettings(cloudSettings)
            │
            └─► Bookings, Orders, Inquiries? ──► COMPLETELY IGNORED!
                (Stay stuck on localStorage / seed data!)
```

---

## 6. Gap Analysis & Root Causes

### Gap 1: Incomplete Entity Synchronization
- **Observed**: `StoreContext.tsx` contains 7 primary state arrays, but only 4 are wired to `syncToCloud` and `fetchCloudData()`.
- **Root Cause**: `bookings`, `orders`, and `inquiries` were treated as purely local mock stores.
- **Consequence**: Bookings and orders placed by customers are invisible to administrators. Any status update made by an admin vanishes if another user or device visits `/admin`.

### Gap 2: Inflexible API Security Model
- **Observed**: `api/store.ts:52-54` enforces:
  ```ts
  if (adminToken !== "Zimthreads200") {
    return res.status(401).json({ error: "Unauthorized" })
  }
  ```
- **Root Cause**: All POST operations require the secret admin token.
- **Consequence**: Public customers on `/booking`, cart checkout, and `/contact` cannot create records without embedding the admin token in the client bundle (violating security) or failing with 401.

### Gap 3: Dev Environment API Resolution
- **Observed**: In Vite development mode (`vite.config.ts`), requests to `/api/store` are unhandled and return 404 HTML.
- **Root Cause**: No dev server proxy or middleware routes `/api/*` requests in Vite.
- **Consequence**: During local testing, cloud synchronization fails unless running on Vercel or with a proxy.

### Gap 4: Monolithic Array Replacement vs. Concurrency
- **Observed**: `syncToCloud("products", next)` serializes the entire array of products and overwrites the entire row in `public.zimthreads_store`.
- **Root Cause**: Key-value table architecture stores full entity collections as JSON blobs.
- **Consequence**: For `products` and `settings`, this works cleanly. But for high-velocity customer submissions (`bookings`, `orders`, `inquiries`), monolithic array replacement from the client risks race conditions if two customers submit simultaneously. The API endpoint should support atomic append or row-level inserts for customer entries.

---

## 7. Exact Technical Remediation Plan

To fulfill all requirements in `ORIGINAL_REQUEST.md` and `DISPATCH.md` without disrupting the UI structure of `Dashboard.tsx`, the following updates are recommended for the implementation team:

### 1. Upgrade `api/store.ts` to Support All 7 Entities and Public Submissions
- **Target File**: `c:\Dev\Active Projects\Zimthreads\api\store.ts`
- **Modifications**:
  1. Support GET query returning all 7 keys:
     - `products`
     - `services`
     - `blog_posts`
     - `settings`
     - `bookings`
     - `orders`
     - `inquiries`
  2. Differentiate public customer actions from protected admin actions:
     - **Public Actions (No Admin Token Required)**:
       - `POST /api/store` with `action: "create_booking"` or `key: "bookings"` and payload containing single new booking record (appends to database array).
       - `POST /api/store` with `action: "create_order"` or `key: "orders"` and payload containing single new order record (appends to database array).
       - `POST /api/store` with `action: "create_inquiry"` or `key: "inquiries"` and payload containing single new inquiry record (appends to database array).
     - **Admin Actions (Requires `adminToken === "Zimthreads200"`)**:
       - Status changes, edits, batch pricing updates, and deletions across any entity.
  3. Ensure strict adherence to Neon Project `rapid-hill-42448439` using authenticated connection string.

### 2. Upgrade `src/store/StoreContext.tsx` for Complete Cloud Hydration & Persistence
- **Target File**: `c:\Dev\Active Projects\Zimthreads\src\store\StoreContext.tsx`
- **Modifications**:
  1. **Update `fetchCloudData()` (lines 300–348)**:
     - Parse `cloudBookings`, `cloudOrders`, and `cloudInquiries` from `result.data`.
     - Update state if cloud data exists:
       ```ts
       if (Array.isArray(cloudBookings)) setBookings(cloudBookings)
       if (Array.isArray(cloudOrders)) setOrders(cloudOrders)
       if (Array.isArray(cloudInquiries)) setInquiries(cloudInquiries)
       ```
     - Sync the freshly fetched cloud data into `localStorage` so local cache stays fresh.
  2. **Wire Cloud Persistence into Bookings Actions**:
     - `addBooking`: persist new booking to cloud (via customer-allowed append or full sync).
     - `updateBookingStatus`: `syncToCloud("bookings", updatedBookings)`.
     - `deleteBooking`: `syncToCloud("bookings", remainingBookings)`.
  3. **Wire Cloud Persistence into Orders Actions**:
     - `createOrder`: persist new order to cloud with line items and customer details.
     - `updateOrderStatus`: `syncToCloud("orders", updatedOrders)`.
     - `deleteOrder`: `syncToCloud("orders", remainingOrders)`.
  4. **Wire Cloud Persistence into Inquiries Actions**:
     - `addInquiry`: persist new inquiry to cloud.
     - `markInquiryAsRead`: `syncToCloud("inquiries", updatedInquiries)`.
     - `deleteInquiry`: `syncToCloud("inquiries", remainingInquiries)`.
  5. **Ensure Batch Pricing & Catalog Sync**:
     - `updateProductsBatch` and `updateProduct` already call `syncToCloud("products", next)`. Ensure the cloud sync resolves reliably and any hard reload retains updated prices and stock levels.

### 3. Add Vite Dev Server API Handler in `vite.config.ts`
- **Target File**: `c:\Dev\Active Projects\Zimthreads\vite.config.ts`
- **Modifications**:
  - Add a lightweight `configureServer` middleware in Vite that intercepts `/api/store` requests and executes the same Neon SQL logic as `api/store.ts`. This ensures instant, live persistence during local development without needing separate backend servers.

### 4. Enhance Visual Feedback in `Dashboard.tsx`
- **Target File**: `c:\Dev\Active Projects\Zimthreads\src\pages\admin\Dashboard.tsx`
- **Modifications**:
  - Add a manual "Refresh / Sync Cloud" button in the admin header or sidebar (`Dashboard.tsx:547–585`).
  - Provide clear toast notifications confirming persistence to Neon DB upon status transitions, batch pricing saves, and deletions.

---

## 8. Traceability Matrix & Acceptance Criteria Alignment

| Acceptance Criteria | Current Codebase Status | Required Implementation |
|---|---|---|
| **AC 1: Booking persistence from `/booking` to Admin Desk** | ❌ Fails: Only saved to customer's `localStorage` | Wire `addBooking` to Neon API; rehydrate `bookings` in `StoreContext` |
| **AC 2: Order persistence from Cart to Admin Orders Desk** | ❌ Fails: Only saved to customer's `localStorage` | Wire `createOrder` to Neon API; rehydrate `orders` in `StoreContext` |
| **AC 3: Contact message persistence from `/contact` to Inquiries Desk** | ❌ Fails: Only saved to customer's `localStorage` | Wire `addInquiry` to Neon API; rehydrate `inquiries` in `StoreContext` |
| **AC 4: Admin status changes persist across hard browser refresh** | ❌ Fails: Bookings/Orders/Inquiries changes only in `localStorage` | Wire status change handlers to Neon; rehydrate on mount |
| **AC 5: 14 Racing Jackets batch pricing saves & updates `/shop`** | ⚠️ Partial: `syncToCloud` called, but reload merge logic and API endpoint need end-to-end sync | Verify batch pricing updates persist to `products` key in Neon and reload cleanly |
| **AC 6: Services, Blog Posts & Store Settings CRUD persists to Neon** | ⚠️ Partial: Handlers wired, but requires API endpoint reliability and reload verification | Ensure all mutations persist to Neon `rapid-hill-42448439` |

---

## 9. Conclusion

The Admin Dashboard UI in `src/pages/admin/Dashboard.tsx` is structurally complete, aesthetically polished, and fully equipped with all required desks, tables, modals, and handlers. The primary barrier to live operation is the omission of cloud database synchronization for `bookings`, `orders`, and `inquiries` in `src/store/StoreContext.tsx`, coupled with the restrictive authorization check in `api/store.ts` and missing local Vite dev server middleware. Addressing these exact integration points will achieve full live functionality and permanent database persistence across the entire platform.
