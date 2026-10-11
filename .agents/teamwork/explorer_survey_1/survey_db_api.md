# Survey Report: Database, Backend/API Architecture & Neon Configuration

**Date**: 2026-10-10  
**Investigator**: Explorer 1 (Database & Backend Architecture Explorer)  
**Target Identity & Account**: `anesumupesa@gmail.com` / GitHub: `Mupesa`  
**Target Neon Project**: `rapid-hill-42448439` ("Zimthreads Collective")  

---

## 1. Executive Summary

The Zimthreads application is a React 19 + Vite 8 + Tailwind CSS v4 single-page application hosted on Vercel with serverless API capabilities. Live connectivity to the production Neon PostgreSQL database (`rapid-hill-42448439` via endpoint `ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech`) was independently tested and confirmed functional over Neon's serverless HTTP SQL API (`/sql`). The database currently possesses one primary key-value table, `public.zimthreads_store`, containing records for `products` (16 items including all 14 Archival Racing Jackets), `services` (7 items), `blog_posts` (5 items), and `settings` (1 object).

However, **three critical architectural disconnects** currently prevent the application from satisfying the live persistence requirements:
1. **Unwired Customer Entities**: `bookings`, `orders`, and `inquiries` are not stored in Neon, not seeded, and not synchronized in `src/store/StoreContext.tsx` (they only exist in temporary browser `localStorage`).
2. **API Authorization Barrier**: `api/store.ts` requires `adminToken !== "Zimthreads200"` for *all* POST requests, making public customer submissions from `/booking`, `/contact`, and checkout impossible without exposing the admin token.
3. **Local Dev Server Proxy Gap**: `vite.config.ts` does not define a connect middleware or proxy for `/api/*`, causing `/api/store` requests to fail or return HTML fallbacks when developing locally.

---

## 2. Infrastructure & Account Audit

Per strict user rules in `AGENTS.md`:
- **Owner Account**: `anesumupesa@gmail.com` / `Mupesa`
- **Target Neon Project ID**: `rapid-hill-42448439` ("Zimthreads Collective")
- **Active Neon Host**: `ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech`
- **Database Engine**: PostgreSQL 18.6 (verified via `SELECT version()`)
- **Active Database Name**: `neondb`
- **Active Database User**: `neondb_owner`

### Environment Files
- No `.env`, `.env.local`, or `.env.production` files exist in the repository.
- The connection string is currently stored as a fallback in `api/store.ts` (line 3) and `scripts/sync-*.cjs`:
  ```
  postgresql://neondb_owner:npg_DR0tIYcQyeX8@ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require
  ```
- **Security Check**: This connection string targets exclusively `rapid-hill-42448439` under `anesumupesa@gmail.com`. No foreign accounts or databases are referenced.

---

## 3. Database Architecture & Neon Schema Inspection

Direct SQL queries were executed against `https://ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech/sql`.

### 3.1 Tables Found in `public`
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```
**Result**: Single table `public.zimthreads_store`.

### 3.2 Table Schema: `public.zimthreads_store`
Inspected via `information_schema.columns`:

| Column Name | Data Type | Nullable | Role |
| :--- | :--- | :--- | :--- |
| `key` | `text` | NO | Primary Key |
| `data` | `jsonb` | NO | Payload (JSON Array or Object) |
| `updated_at` | `timestamp with time zone` | YES | Last Modified Timestamp |

### 3.3 Existing Records in `zimthreads_store`

| Key | JSON Type | Record Count / Content | Last Updated |
| :--- | :--- | :--- | :--- |
| `products` | `array` | 16 products (14 Archival Racing Jackets, Heritage Beaded Bracelet, LLICYLAND Boxy Tee) | 2026-10-10 18:06:21 UTC |
| `services` | `array` | 7 services (Clean, Deep Clean, Restore, 2-Pairs Deal, 3-Pairs Deal, Apparel, Personalization) | 2026-09-21 08:09:53 UTC |
| `blog_posts` | `array` | 5 articles (Dice Collab, Cleaning intervals, Sneaker care, Apparel trends, Suede care) | 2026-10-02 16:47:24 UTC |
| `settings` | `object` | Store configuration (storeName, phone, email, delivery thresholds, hero banner) | 2026-09-25 14:12:07 UTC |
| `bookings` | **MISSING** | **0 records** (Key does not exist in DB) | N/A |
| `orders` | **MISSING** | **0 records** (Key does not exist in DB) | N/A |
| `inquiries` | **MISSING** | **0 records** (Key does not exist in DB) | N/A |

### 3.4 Verification of the 14 Archival Racing Jackets
The 14 jackets are verified present in `zimthreads_store` under key `products`:
1. `prod-jacket-ferrari-red-leather` (Rs 2,850)
2. `prod-jacket-ferrari-pink-white` (Rs 2,750)
3. `prod-jacket-mercedes-white-black` (Rs 2,650)
4. `prod-jacket-jack-daniels-black` (Rs 1,950)
5. `prod-jacket-mercedes-warsteiner` (Rs 1,950)
6. `prod-jacket-ferrari-black-red-white` (Rs 1,900)
7. `prod-jacket-ferrari-collar-edition` (Rs 1,900)
8. `prod-jacket-bmw-m-power` (Rs 1,850)
9. `prod-jacket-ferrari-lower-right` (Rs 1,850)
10. `prod-jacket-red-bull-blue` (Rs 1,800)
11. `prod-jacket-red-bull-black-white` (Rs 1,800)
12. `prod-jacket-ferrari-red` (Rs 1,800)
13. `prod-jacket-audi-sport-red` (Rs 1,750)
14. `prod-jacket-ferrari-windbreaker` (Rs 1,750)

---

## 4. Backend & API Layer Analysis (`api/store.ts`)

File location: `api/store.ts` (78 lines)  
Deployment: Vercel Serverless Function mapped to route `/api/store`.

### 4.1 Current Implementation Logic
- **HTTP Transport**: Uses standard Node 18+ `fetch()` to call `https://${NEON_HOST}/sql`. No native driver (`pg`, `@neondatabase/serverless`) is required.
- **GET Request** (`api/store.ts:37-46`):
  Queries `SELECT key, data FROM public.zimthreads_store;` and returns:
  ```json
  { "success": true, "data": { "<key>": <data>, ... } }
  ```
- **POST Request** (`api/store.ts:48-70`):
  ```typescript
  const { key, data, adminToken } = body;
  if (adminToken !== "Zimthreads200") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  ```
  Inserts/updates the row with `ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`.

### 4.2 Architectural Deficiencies in `api/store.ts`
1. **Public Customer Creation Blocked**:
   Customer actions from `/booking`, `/contact`, and checkout cannot call POST `/api/store` because `adminToken !== "Zimthreads200"` returns HTTP 401 Unauthorized. Requirement R1 specifies:
   > *"The API layer must allow public creation for customer submissions (bookings, checkout orders, and inquiries) without an admin token, while securing administrative updates and deletions."*
2. **No Append Support**:
   POST currently overwrites `data = EXCLUDED.data`. If a customer submits a single booking or order, the API currently expects the entire array to replace the key. An atomic append mechanism or action handler (`action: "public_create"`) is required so public clients can post an individual booking, order, or inquiry without having to read or overwrite the entire table.
3. **Missing Keys in Initial State**:
   Because `bookings`, `orders`, and `inquiries` rows do not exist in `zimthreads_store`, a GET request returns `{ products: [...], services: [...], blog_posts: [...], settings: {...} }` without those keys.

---

## 5. Client State & Sync Layer Analysis (`src/store/StoreContext.tsx`)

File location: `src/store/StoreContext.tsx` (849 lines)

### 5.1 Revalidation on Mount (`StoreContext.tsx:300-348`)
```typescript
const {
  products: cloudProducts,
  services: cloudServices,
  blog_posts: cloudBlogPosts,
  settings: cloudSettings,
} = result.data;
```
- **Observation**: Only `products`, `services`, `blog_posts`, and `settings` are hydrated from the cloud.
- **Deficiency**: `bookings`, `orders`, and `inquiries` are completely ignored during mount revalidation. If a user visits `/admin` on a new device, incognito, or after clearing cookies, all bookings, orders, and inquiries show empty arrays.

### 5.2 CRUD Actions in StoreContext

| Entity Type | Action Method | Local State Updated | Synced to Cloud (`syncToCloud`)? |
| :--- | :--- | :--- | :--- |
| **Products** | `addProduct`, `updateProduct`, `updateProductsBatch`, `deleteProduct` | YES | **YES** (`syncToCloud("products", next)`) |
| **Services** | `addService`, `updateService`, `deleteService` | YES | **YES** (`syncToCloud("services", next)`) |
| **Blog Posts**| `addBlogPost`, `updateBlogPost`, `deleteBlogPost` | YES | **YES** (`syncToCloud("blog_posts", next)`) |
| **Settings**  | `updateSettings` | YES | **YES** (`syncToCloud("settings", next)`) |
| **Bookings**  | `addBooking`, `updateBookingStatus`, `deleteBooking` | YES | **NO** (Only writes to `localStorage`) |
| **Orders**    | `createOrder`, `updateOrderStatus`, `deleteOrder` | YES | **NO** (Only writes to `localStorage`) |
| **Inquiries** | `addInquiry`, `markInquiryAsRead`, `deleteInquiry` | YES | **NO** (Only writes to `localStorage`) |

---

## 6. Admin Dashboard Inspection (`src/pages/admin/Dashboard.tsx`)

File location: `src/pages/admin/Dashboard.tsx` (3,427 lines)

### 6.1 Authentication
- Password: `"Zimthreads200"`
- Session storage key: `"zimthread_admin_auth"`

### 6.2 Desks & Controls
- **Bookings Desk**: Renders `bookings`, filtering by status, search by customer name/phone/email, status update dropdown (`Pending`, `Confirmed`, `In Progress`, `Completed`, `Cancelled`), booking deletion, and manual booking creation modal.
- **Orders Desk**: Renders `orders`, status update dropdown (`Processing`, `Shipped`, `Delivered`, `Cancelled`), order deletion, customer shipping & item inspection modal.
- **Products Desk**: Catalog grid with search, filter, individual product add/edit/delete, and the **Batch Pricing Desk** (`Dashboard.tsx:1445-1482`) which calls `updateProductsBatch(updates)` to update price & stock across multiple items simultaneously.
- **Services Desk**: Active toggle switch, edit pricing/descriptions modal, add service modal, delete service.
- **Blog Desk**: Article creation, edit markdown content, delete article.
- **Inquiries Desk**: List of customer contact submissions, mark as read/unread, delete inquiry.
- **Settings Desk**: Store settings form with hero banner toggle, delivery thresholds, and "Save Store Settings" button.
- **Customers Desk**: Automatically derived via `useMemo` in `StoreContext.tsx` from `bookings` and `orders`.

**Conclusion for Dashboard**: All UI controls, modals, and event handlers in `Dashboard.tsx` already call the correct `useStore()` methods. Once `StoreContext.tsx` is wired to sync `bookings`, `orders`, and `inquiries`, every control across all 8 dashboard tabs will instantly become live and persistent in Neon DB.

---

## 7. Vite & Build Tooling Inspection

### 7.1 `vite.config.ts` (413 lines)
- Plugins installed:
  - `react()`
  - `tailwindcss()`
  - `figmaSiteConfiguration()`
  - `figmaErrorOverlayReplay()`
  - `figmaReactRefreshBoundaryFallback()`
  - `figmaMakeKitPlugin()`
- **Dev Server Middleware Observation**:
  Vite's dev server (`server.middlewares`) does not intercept `/api/store`. In local development or Figma Make preview, requests to `/api/store` return Vite's index.html fallback, preventing JSON parsing.
- **Solution Blueprint**: Add a lightweight connect middleware in `vite.config.ts` (or import `api/store.ts` handler directly in dev) to handle `/api/*` endpoints during `vite dev`.

### 7.2 Build & TypeScript Verification
1. `npm run build`: **PASSES** in ~990ms (`dist/` generated cleanly).
2. `npx tsc --noEmit`: **FAILS** with error:
   ```
   src/lib/cloudinary.ts(90,30): error TS1005: ';' expected.
   ```
   - Line 90 of `src/lib/cloudinary.ts` has a missing separator in parameter typing:
     `options: { folder?: string tags?: string[] } = {}`
     (Needs semicolon or comma: `{ folder?: string; tags?: string[] }`).

---

## 8. Concrete Architecture & Implementation Blueprint

To fulfill requirements R1, R2, and R3 without architectural regressions:

### Step 1: Database Seeding in Neon
Execute SQL against `public.zimthreads_store` to insert initial rows for:
- `key = 'bookings'`: `data = '[]'::jsonb`
- `key = 'orders'`: `data = '[]'::jsonb`
- `key = 'inquiries'`: `data = '[]'::jsonb`
(Ensures GET `/api/store` immediately returns these keys).

### Step 2: Enhance `api/store.ts`
Support both administrative full sync and public customer submissions:
```typescript
if (req.method === "POST") {
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  const { key, data, adminToken, action, item } = body;

  // 1. Public customer submission without adminToken
  if (action === "public_create") {
    if (!["bookings", "orders", "inquiries"].includes(key) || !item) {
      return res.status(400).json({ error: "Invalid public submission" });
    }
    // Prepend new item to existing JSONB array in Neon
    const query = `
      INSERT INTO public.zimthreads_store (key, data, updated_at)
      VALUES ($1, jsonb_build_array($2::jsonb), NOW())
      ON CONFLICT (key) DO UPDATE
      SET data = jsonb_insert(public.zimthreads_store.data, '{0}', $2::jsonb, true),
          updated_at = NOW()
      RETURNING key;
    `;
    await executeSql(query, [key, JSON.stringify(item)]);
    return res.status(200).json({ success: true, created: key });
  }

  // 2. Admin full update / mutation
  if (adminToken !== "Zimthreads200") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Upsert key
  const query = `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW()
    RETURNING key;
  `;
  await executeSql(query, [key, JSON.stringify(data)]);
  return res.status(200).json({ success: true, updated: key });
}
```

### Step 3: Enable Dev API in `vite.config.ts`
Add a Vite plugin `viteApiStorePlugin()` that mounts a connect middleware on `server.middlewares`:
- Intercepts requests where `req.url.startsWith('/api/store')`
- Forwards to the handler logic in `api/store.ts`
- Ensures seamless live testing in the dev environment.

### Step 4: Wire `StoreContext.tsx`
1. In `fetchCloudData` (on mount), hydrate `bookings`, `orders`, and `inquiries`:
   ```typescript
   if (Array.isArray(cloudBookings)) setBookings(cloudBookings);
   if (Array.isArray(cloudOrders)) setOrders(cloudOrders);
   if (Array.isArray(cloudInquiries)) setInquiries(cloudInquiries);
   ```
2. In customer submission functions (`addBooking`, `createOrder`, `addInquiry`):
   Submit to `/api/store` with `action: "public_create", key, item: newRecord`.
3. In administrative status update and delete functions (`updateBookingStatus`, `deleteBooking`, `updateOrderStatus`, `deleteOrder`, `markInquiryAsRead`, `deleteInquiry`):
   Call `syncToCloud(key, next)`.

### Step 5: TypeScript Fix
Fix line 90 in `src/lib/cloudinary.ts` to restore clean `npx tsc --noEmit` build.

### Step 6: Automated Verification Script
Create an automated test script (`scripts/verify-neon-e2e.cjs`) that:
- Reads all 7 keys from Neon
- Inserts a test booking, test order, and test inquiry via public API
- Updates booking and order status via admin API
- Modifies product price via batch update
- Asserts that all changes persisted in Neon and cleans up test records.
