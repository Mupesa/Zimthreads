# Original User Request

## 2026-10-10T18:08:21Z

Connect the Zimthreads admin dashboard (`/admin`) and customer-facing flows completely to the production Neon PostgreSQL database (`rapid-hill-42448439` under `anesumupesa@gmail.com`), making all dashboard tabs (Bookings, Orders, Products, Services, Blog Posts, Customer Inquiries, and Analytics) fully functional and live with persistent CRUD operations.

Working directory: c:\Dev\Active Projects\Zimthreads
Integrity mode: development

## Requirements

### R1. Neon Database Storage & API Endpoint Layer
Provide a complete, reliable data storage and API layer connected to Neon PostgreSQL (Project `rapid-hill-42448439` under `anesumupesa@gmail.com`) for all application entities:
- Bookings (customer bookings, appointment dates, cleaning services, status transitions)
- Orders (checkout orders, item lists, customer shipping details, payment and fulfillment statuses)
- Products (catalog products, stock levels, sizes, and the 14 Archival Racing Jackets with batch pricing)
- Services (cleaning and restoration packages, pricing, active toggles)
- Blog Posts (published articles, drafts, creation and deletion)
- Inquiries (messages submitted via the contact form with read/unread tracking)
- Store Settings (hero drop banner, delivery thresholds, store configurations)

The API layer must allow public creation for customer submissions (bookings, checkout orders, and inquiries) without an admin token, while securing administrative updates and deletions.

### R2. Full Dashboard Interactive Functionality & Real-Time Sync
Wire all controls and tables in `src/pages/admin/Dashboard.tsx` and the store so every administrative operation (creating, updating, deleting, status toggling, and batch price/stock updates) persists to the Neon database immediately. On full page reload or initial visit, all dashboard desks and customer-facing pages must load their current state from the cloud database.

### R3. Controlled Cloud Infrastructure & Account Security
All cloud database operations must strictly target Neon project ID `rapid-hill-42448439` associated exclusively with `anesumupesa@gmail.com` / `Mupesa`. Never sync against or expose credentials to any foreign accounts.

## Acceptance Criteria

### Live CRUD & Persistence
- [ ] Submitting a booking from `/booking` creates a live record in the Neon database that appears immediately in the admin dashboard Bookings desk.
- [ ] Submitting an order from the cart checkout creates a live order record in the Neon database that appears in the admin dashboard Orders desk with full item details.
- [ ] Submitting a contact message from `/contact` creates a live inquiry in the Neon database that appears in the admin dashboard Inquiries desk.
- [ ] Changing booking status, order status, or inquiry status in the admin dashboard updates the record in Neon and remains unchanged after a hard browser refresh.
- [ ] Modifying product prices or stock (including the 14 Archival Racing Jackets via the batch pricing desk) saves to Neon and immediately updates prices displayed on `/shop` and `/collection/racing-jackets`.
- [ ] Creating, editing, or deleting services, blog posts, or store settings in the admin dashboard persists to Neon DB.

### Automated Verification
- [ ] An automated verification script executes end-to-end read and write checks against the live Neon database for all 6 entity types, confirming successful persistence and error-free execution.
- [ ] Production build (`npm run build`) compiles with zero TypeScript or Vite errors.


## 2026-10-11T13:10:19Z

Add 2XL and XXL size options to the Zimthread 'LLICYLAND' Graphic Boxy Tee, and enable store administrators in the CMS to dynamically configure available sizes and select which price tiers are active on product pages (greying out / disabling unselected prices).

Working directory: c:\Dev\Active Projects\Zimthreads
Integrity mode: development

## Requirements

### R1. Expand LLICYLAND Graphic Boxy Tee Sizes
- Add `2XL` and `XXL` sizes to the catalog entry for the **Zimthread 'LLICYLAND' Graphic Boxy Tee** (`prod-5`), joining existing sizes `["S", "M", "L", "XL", "2XL", "XXL"]`.
- Ensure customers selecting the tee on the storefront or product modal can choose 2XL or XXL, add to cart, and check out with the chosen size.

### R2. Admin Configurable Sizes for Products
- In the Admin Dashboard (`/admin`), allow administrators to easily add, edit, and manage sizes for any product in the catalog.
- Support both quick preset chips (e.g. S, M, L, XL, 2XL, XXL, One Size) and custom size entries when adding or editing products.
- Persist custom size configurations to the production Neon PostgreSQL database (`rapid-hill-42448439`) and sync live across all devices.

### R3. Selectable Active Prices & Disabled / Greyed-out Options
- In the Admin CMS product manager, allow administrators to configure or toggle available active price options / tiers for a product.
- On the storefront product pages and product detail modal:
  - Active/selected price options remain selectable for customers.
  - Deselected/unavailable price options appear visually distinct (greyed-out / disabled / crossed-through with an "Unavailable" indicator) and cannot be added to cart.
- Immediate persistence of price availability toggles to Neon PostgreSQL with multi-device reactivity.

## Acceptance Criteria

### Storefront Size & Price Selection
- [ ] Product `prod-5` (Zimthread 'LLICYLAND' Graphic Boxy Tee) displays `2XL` and `XXL` in its size selector on both `/shop` and `ProductModal`.
- [ ] Selecting 2XL or XXL adds the item to the cart drawer with the correct size tag and proceeds through checkout.
- [ ] Deselected/inactive price options on a product appear greyed-out and disabled from customer selection.

### Admin CMS Controls & Cloud Persistence
- [ ] Administrator can add/remove sizes when creating a new product or editing an existing product in `/admin`.
- [ ] Administrator can toggle active vs. deselected prices on products in the CMS.
- [ ] Saving product size and price changes persists immediately to Neon PostgreSQL (`rapid-hill-42448439`) under `anesumupesa@gmail.com`.
- [ ] Changes reflect across independent browser tabs/devices upon cloud re-fetch.

### Build & Verification
- [ ] `npm run build` compiles with zero TypeScript or Vite errors.
- [ ] Automated verification script verifies end-to-end read and write of sizes and price options against Neon DB.
- [ ] Git commit and push to `origin/main` executed under `Mupesa` identity (`anesumupesa@gmail.com`).
