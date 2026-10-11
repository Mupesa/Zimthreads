# Project: Zimthreads Neon DB & Admin Dashboard Persistence

## Architecture
- **Cloud Database**: Neon PostgreSQL (Project `rapid-hill-42448439` under `anesumupesa@gmail.com` / `Mupesa`)
  - Endpoint: `ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech`
  - Engine: PostgreSQL 18.6 over serverless HTTP SQL API (`https://<host>/sql`)
  - Storage Table: `public.zimthreads_store` (`key text primary key, data jsonb not null, updated_at timestamptz`)
  - Entities managed:
    1. `bookings` (array of customer booking objects)
    2. `orders` (array of customer order objects with item details)
    3. `products` (array of catalog products, including 14 Archival Racing Jackets with stock & pricing)
    4. `services` (array of service packages & pricing)
    5. `blog_posts` (array of blog post objects & statuses)
    6. `inquiries` (array of customer inquiries with read tracking)
    7. `settings` (store settings, banner, delivery thresholds)
- **API Layer**:
  - `api/store.ts`: Vercel serverless / HTTP handler supporting:
    - GET `?key=<key>`: Public read for store entities.
    - POST:
      - `action: "public_create"`: Allows public customer creation of bookings, orders, and inquiries without admin token. Appends record to Neon DB jsonb array atomically or via safe transaction/update.
      - `action: "sync"`: Administrative full sync / update, requires `adminToken === "Zimthreads200"`.
      - `action: "batch_update_products"` / `action: "update_entity"`: Authenticated administrative mutations.
  - `vite.config.ts`: Dev server middleware handling `/api/store` requests during local Vite development (`npm run dev`), mirroring serverless function behavior.
- **Client State & Hydration**:
  - `src/store/StoreContext.tsx`:
    - `fetchCloudData()`: On application mount and page reload, loads all 7 entities (`products`, `services`, `blog_posts`, `settings`, `bookings`, `orders`, `inquiries`) from Neon via `/api/store`.
    - `syncToCloud()`: Authenticated push for admin modifications.
    - Public submission helpers (`addBooking`, `createOrder`, `addInquiry`): Update local state and immediately persist new records to Neon DB via public API endpoint.
- **User Interface**:
  - Customer Flows: `/booking` (appointment form), Cart Drawer (checkout & order submission), `/contact` (inquiries), `/shop` & `/collection/racing-jackets` (catalog reactivity).
  - Admin Dashboard (`src/pages/admin/Dashboard.tsx`): Desks for Bookings, Orders, Products & Batch Pricing, Services, Blog Posts, Inquiries, Settings.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Neon DB Schema & Entities | Verify & initialize table `zimthreads_store` with all keys (`bookings`, `orders`, `inquiries`, `products`, `services`, `blog_posts`, `settings`) | M1 | Survey / R1 |
| 2 | Public Creation API | Implement unauthenticated customer submission endpoint in `api/store.ts` for bookings, orders, inquiries | M1 | Survey / R1 |
| 3 | Authenticated Admin API | Secure admin updates, batch updates, and deletions behind `adminToken` in `api/store.ts` | M1 | Survey / R1 |
| 4 | Vite Dev Server API Handler | Add Vite dev server middleware in `vite.config.ts` to handle `/api/store` in local development | M1 | Survey / R1 |
| 5 | Cloudinary Type Fix | Fix syntax error in `src/lib/cloudinary.ts:90` for clean TypeScript build | M1 | Survey / Build |
| 6 | Customer Booking Flow | Wire `/booking` submission to persist directly to Neon DB and appear in admin dashboard | M2 | R1, R2, AC |
| 7 | Customer Checkout / Order Flow | Wire Cart Checkout to persist order to Neon DB with full item details | M2 | R1, R2, AC |
| 8 | Customer Inquiry Flow | Wire `/contact` inquiry submission to persist directly to Neon DB | M2 | R1, R2, AC |
| 9 | Catalog & Jacket Reactivity | Ensure `/shop` and `/collection/racing-jackets` dynamically reflect live DB prices and stock | M2 | R1, R2, AC |
| 10 | Admin Bookings Desk Persistence | Wire status transitions and deletion to persist immediately to Neon DB | M3 | R2, AC |
| 11 | Admin Orders Desk Persistence | Wire order payment/fulfillment status updates and deletion to persist to Neon DB | M3 | R2, AC |
| 12 | Admin Inquiries Desk Persistence | Wire read/unread tracking and deletion to persist to Neon DB | M3 | R2, AC |
| 13 | Admin Batch Pricing & Stock Desk | Wire batch price & stock edits for 14 Archival Racing Jackets to persist to Neon DB | M3 | R2, AC |
| 14 | Admin Services Desk Persistence | Wire creation, editing, deletion, and active toggles to persist to Neon DB | M3 | R2, AC |
| 15 | Admin Blog Posts Desk Persistence | Wire creation, editing, status toggling, and deletion to persist to Neon DB | M3 | R2, AC |
| 16 | Admin Store Settings Persistence | Wire hero drop banner, delivery thresholds, and settings to persist to Neon DB | M3 | R2, AC |
| 17 | Full Page Reload Hydration | Ensure all desks and customer flows hydrate complete state from Neon DB on refresh | M3 | R2, AC |
| 18 | Automated Verification Test Suite | End-to-end automated script testing live Neon DB read & write for all 6 entity types | M4 | AC |
| 19 | Production Build Validation | Verify `npm run build` compiles with zero errors | M5 | AC |
| 20 | LLICYLAND Tee Sizes Expansion | Expand `prod-5` sizes to `["S", "M", "L", "XL", "2XL", "XXL"]` in seedData and live Neon DB | M6 | 2026-10-11 R1 |
| 21 | Storefront Size & Price Selection | Interactive size selector with 2XL/XXL and active/inactive price options in `ProductModal` & `Shop` | M6 | 2026-10-11 R1, R3 |
| 22 | Admin Preset & Custom Size Chips | Interactive preset chips (S, M, L, XL, 2XL, XXL, One Size) + custom size adder in Admin CMS | M7 | 2026-10-11 R2 |
| 23 | Admin Price Tiers & Active Toggles | Configurable price options/tiers with active vs deselected toggles in Admin CMS | M7 | 2026-10-11 R3 |
| 24 | Neon Cloud Persistence & Reactivity | Live persistence of size and price configs to Neon PostgreSQL with multi-device reactivity | M7 | 2026-10-11 R2, R3 |
| 25 | E2E Sizes & Prices Verification Script | Automated test script testing live Neon DB CRUD for sizes and price options | M8 | 2026-10-11 AC |
| 26 | Clean Build & Git Push under Mupesa | `npm run build` zero errors and git commit/push to origin/main under Mupesa identity | M8 | 2026-10-11 AC |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Neon Database & API Layer | Database keys initialization, `api/store.ts` public/admin routing, Vite dev proxy, `cloudinary.ts` fix | none | DONE |
| M2 | Customer-Facing Flows & StoreContext | Update `StoreContext.tsx` hydration & submissions, wire `/booking`, `/cart` checkout, `/contact`, verify catalog reactivity | M1 | DONE |
| M3 | Admin Dashboard Full CRUD Persistence | Wire all 8 desks in `Dashboard.tsx` to Neon DB, batch pricing/stock for 14 jackets, hard refresh persistence | M2 | DONE |
| M4 | Automated E2E Verification Suite | Build and run automated test script executing live Neon DB CRUD for all entities | M3 | DONE |
| M5 | Production Build & Final Acceptance | `npm run build`, final forensic audit, and delivery victory report | M4 | DONE |
| M6 | Data Model & Storefront Sizes & Price Tiers | Types (`PriceOption`), `prod-5` sizes (`2XL`, `XXL`), `ProductModal` & `Shop` size/price selectors with disabled states | M5 | IN_PROGRESS |
| M7 | Admin CMS Size Chips & Price Tiers Config | Dashboard Add/Edit product modals with preset chips, custom sizes, price options & active toggles with Neon DB sync | M6 | PLANNED |
| M8 | Automated E2E Verification, Build & Git Push | E2E automated test script for sizes & prices, clean Vite build, git commit & push under Mupesa | M7 | PLANNED |

## Interface Contracts
### Client ↔ `/api/store`
- **GET `/api/store?key=<key>`**:
  - Response: `{ success: true, key: string, data: any, updatedAt: string }`
- **GET `/api/store?key=all`**:
  - Response: `{ success: true, data: { products: [...], services: [...], blog_posts: [...], settings: {...}, bookings: [...], orders: [...], inquiries: [...] } }`
- **POST `/api/store`**:
  - **Public Creation (`action: "public_create"`)**:
    - Request Body: `{ action: "public_create", entity: "bookings" | "orders" | "inquiries", record: Object }`
    - Response: `{ success: true, record: Object }`
  - **Admin Sync (`action: "sync"`)**:
    - Request Body: `{ action: "sync", adminToken: "Zimthreads200", key: string, data: any }`
    - Response: `{ success: true, count: number }`
  - **Admin Update Entity (`action: "update_entity"`)**:
    - Request Body: `{ action: "update_entity", adminToken: "Zimthreads200", entity: string, id: string, updates: Object }`
    - Response: `{ success: true }`
  - **Admin Delete Entity (`action: "delete_entity"`)**:
    - Request Body: `{ action: "delete_entity", adminToken: "Zimthreads200", entity: string, id: string }`
    - Response: `{ success: true }`

### Product Model & Pricing Contracts
- **`Product`**:
  - `sizes?: string[]`: Array of available size strings (e.g. `["S", "M", "L", "XL", "2XL", "XXL"]`).
  - `priceOptions?: PriceOption[]`: Optional array of configurable price tiers.
- **`PriceOption`**:
  - `{ id?: string; label?: string; price: number; active: boolean }`:
    - `active: true`: Selectable by customers on storefront / ProductModal.
    - `active: false`: Deselected/inactive. Rendered greyed-out, line-through, badge "Unavailable", and disabled from selection or cart addition.

## Code Layout
- `api/store.ts`: Serverless API route handling GET and POST requests with Neon DB connectivity
- `vite.config.ts`: Vite config with dev server middleware for `/api/store`
- `src/lib/cloudinary.ts`: Cloudinary utility with corrected TypeScript typings
- `src/store/seedData.ts`: Product & PriceOption types and initial catalog entries
- `src/store/StoreContext.tsx`: React store context managing state, cloud hydration, and persistence
- `src/components/ProductModal.tsx`: Product detail modal with sizes and active/disabled price options
- `src/pages/Shop.tsx`: Catalog storefront with size chips and price tier reactivity
- `src/components/CartDrawer.tsx`: Customer cart drawer and checkout flow
- `src/pages/admin/Dashboard.tsx`: Admin dashboard with Products desk, preset/custom size chips, and price tiers config
- `scripts/verify-sizes-and-prices.mjs`: Automated verification test script for sizes and price options CRUD against Neon DB
- `scripts/verify-all-entities-e2e.mjs`: Complete entities E2E test runner
