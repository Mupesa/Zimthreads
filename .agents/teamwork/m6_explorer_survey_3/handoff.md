# Milestone 6 Survey Report: Cloud Persistence, Verification Suite, Build & Git Compliance

**Agent**: Explorer 3 (`m6_explorer_survey_3`)  
**Mission**: Investigate Cloud Persistence Layer, Automated E2E Verification, Build & Git requirements for Milestone 6.  
**Target Environment**: Neon PostgreSQL Project `rapid-hill-42448439` ("Zimthreads Collective") under `anesumupesa@gmail.com` / `Mupesa`.

---

## 1. Observation

### 1.1 Cloud Persistence Architecture (`api/store.ts` & `vite.config.ts`)
- **Direct Connection & Host**:
  - `api/store.ts` lines 1–6:
    ```typescript
    const NEON_CONNECTION_STRING =
      process.env.NEON_DATABASE_URL ||
      "postgresql://neondb_owner:npg_DR0tIYcQyeX8@ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require"
    const NEON_HOST = "ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech"
    ```
  - Direct HTTP SQL endpoint: `POST https://${NEON_HOST}/sql` with header `Neon-Connection-String`.
- **Database Schema**:
  - `api/store.ts` lines 32–49:
    Table `public.zimthreads_store (key text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz DEFAULT now())`.
    Managed keys: `'bookings'`, `'orders'`, `'inquiries'`, `'products'`, `'services'`, `'blog_posts'`, `'settings'`.
- **Vite Dev Server Integration**:
  - `vite.config.ts` lines 420–510 (`viteDevStoreApiPlugin`):
    Intercepts `/api/store` in `npm run dev` and dynamically executes `server.ssrLoadModule("/api/store.ts")`.
    In production (e.g. Vercel), `api/store.ts` runs directly as a serverless endpoint.
- **API Endpoints for Product Mutations**:
  - `GET /api/store?key=products` or `GET /api/store?key=all`: fetches JSONB array of products.
  - `POST /api/store` with `adminToken: "Zimthreads200"`:
    - `action: "sync"` with `key: "products", data: [...]`: upserts the entire catalog JSONB array.
    - `action: "batch_update_products"` with `updates: [{ id, changes }]`: atomic in-memory merge on DB server.
    - `action: "update_entity"` with `entity: "products", id, updates`: single entity update.

### 1.2 StoreContext Reactivity & Multi-Device Polling (`src/store/StoreContext.tsx`)
- **Hydration & Merge Logic**:
  - `src/store/StoreContext.tsx` lines 440–480 (`fetchCloudData`):
    Fetches `GET /api/store?key=all`.
    When `cloudProducts` is loaded, it preserves all cloud attributes (e.g. prices, stock, custom sizes). If initial catalog has missing IDs, it appends them and syncs back.
- **Multi-Device Synchronization Triggers**:
  - `src/store/StoreContext.tsx` lines 573–597:
    1. Initial fetch on component mount (`fetchCloudData()`).
    2. Window `focus` event listener: `window.addEventListener("focus", handleFocusOrVisible)`.
    3. Document `visibilitychange` listener: `document.addEventListener("visibilitychange", handleFocusOrVisible)`.
    4. 30-second continuous background polling:
       ```typescript
       const interval = setInterval(() => {
         if (typeof document !== "undefined" && document.visibilityState === "visible") {
           fetchCloudData()
         }
       }, 30000)
       ```
    5. Manual trigger: `refreshCloudData()` exposed on the context.
- **Mutation Sync**:
  - Mutations (`addProduct`, `updateProduct`, `updateProductsBatch`, `deleteProduct`) update React state and synchronously invoke `syncToCloud("products", next)` (lines 900–938).

### 1.3 Live Neon DB State for `prod-5`
- A live SQL query executed against `public.zimthreads_store WHERE key = 'products'` revealed:
  ```json
  {
    "id": "prod-5",
    "name": "Zimthread 'LLICYLAND' Graphic Boxy Tee",
    "category": "Apparel",
    "price": 910,
    "sizes": ["S", "M", "L", "XL"],
    "stock": 5,
    "hidden": false,
    "featured": true,
    "description": "Heavyweight combed cotton boxy-fit graphic tee with signature red dice LLICYLAND artwork and custom Zimthread atelier tag."
  }
  ```
- **Discrepancy**: Neither the live Neon database nor `src/store/seedData.ts` (line 741) currently contains `"2XL"` or `"XXL"` for `prod-5`.

### 1.4 Admin Dashboard Gap (`src/pages/admin/Dashboard.tsx`)
- **`newProductModal`** (lines 3183–3196):
  Contains a basic comma-separated input `Sizes / Options (comma separated)`. No quick preset chips or price tier toggles.
- **`editProduct` modal** (lines 3251–3370):
  Has inputs for `name`, `price`, `stock`, `img`, `description`, `hidden`.
  **CRITICAL FINDING**: The `editProduct` modal contains **NO SIZE CONTROLS** and **NO PRICE OPTIONS CONTROLS** whatsoever! An admin cannot currently inspect or edit sizes for an existing product in the CMS.

### 1.5 Existing Verification Suite (`scripts/verify-all-entities-e2e.mjs`)
- Executed command: `npm run test:verify` (`node scripts/verify-all-entities-e2e.mjs`).
- Output:
  - Total Assertions: 26/26 passed.
  - Duration: 23.40s.
  - Verifies: Bookings (public create, read, admin update, delete), Orders (multi-item, deep fidelity, admin update, delete), Products (baseline count 24, racing jackets 14, create test wax, batch update, delete), Services, Blog Posts, Inquiries, Settings, and Zero-Residual baseline audit.

### 1.6 Build and Type Checking
- Executed `npm run build`:
  Vite built `dist/` cleanly in 1.17s with zero errors.
- Executed `npx tsc --noEmit`:
  TypeScript completed with code 0 and zero errors.

### 1.7 Git & GitHub CLI Verification
- `git config user.name`: `Mupesa`
- `git config user.email`: `anesumupesa@gmail.com`
- `gh auth status`:
  - Active account: `anesu-metabox`
  - Secondary account in keyring: `Mupesa`
  - Per `AGENTS.md` Rule 3: Before pushing to `origin/main`, must run `gh auth switch --user Mupesa`.

---

## 2. Logic Chain

1. **R1 (LLICYLAND Graphic Boxy Tee Sizes)**:
   - Observation 1.3 shows `prod-5` in Neon DB currently only has `["S", "M", "L", "XL"]`.
   - `src/store/seedData.ts:741` also specifies `sizes: ["S", "M", "L", "XL"]`.
   - In `src/store/StoreContext.tsx:466`, cloud hydration does not overwrite cloud attributes with canonical seeds unless the cloud catalog is empty or the product ID is missing.
   - **Reasoning**: Updating `seedData.ts` alone will NOT update the live Neon DB if `prod-5` is already in the database.
   - **Required Action**: We must update both:
     a) `src/store/seedData.ts` to `sizes: ["S", "M", "L", "XL", "2XL", "XXL"]`.
     b) A database migration/sync script (or admin update) to update `prod-5.sizes` directly in Neon DB `zimthreads_store`.

2. **R2 (Admin Configurable Sizes for Products)**:
   - Observation 1.4 confirms `editProduct` modal completely lacks any size field, and `newProductModal` only has a plain text box.
   - **Reasoning**: To fulfill R2, `Dashboard.tsx` needs:
     a) Quick preset chips: `["S", "M", "L", "XL", "2XL", "XXL", "One Size"]`.
     b) Interactive chip toggles (click to add/remove preset).
     c) Custom size text input with "+ Add Size" button (allowing arbitrary custom sizes like "3XL" or "Tailored Fit").
     d) Removable tag badges for all configured sizes.
     e) These controls must be present in BOTH `newProductModal` and `editProduct` modal.
     f) When saved, `updateProduct` / `addProduct` automatically passes `sizes: string[]` to `syncToCloud("products", next)`, which updates Neon DB immediately.

3. **R3 (Selectable Active Prices & Disabled/Greyed-Out Options)**:
   - Observation 1.1 shows that `Product` currently has a single `price: number` and optional `customNamePrice: number`.
   - The user requirement specifies:
     "In the Admin CMS product manager, allow administrators to configure or toggle available active price options / tiers for a product."
     "On the storefront product pages and product detail modal: Active/selected price options remain selectable... Deselected/unavailable price options appear visually distinct (greyed-out / disabled / crossed-through with an 'Unavailable' indicator) and cannot be added to cart."
   - **Reasoning**: We need a formal schema extension on `Product`:
     ```typescript
     export interface PriceOption {
       id: string
       label: string      // e.g. "Standard Cotton" | "Heavyweight Atelier Edition"
       price: number      // e.g. 650 | 910
       active: boolean    // true = available for purchase, false = disabled / greyed out
     }
     ```
   - In `ProductModal.tsx` and `Shop.tsx`:
     - If `product.priceOptions` exists:
       - Render price tier chips/buttons.
       - Active options can be selected by clicking; unit price updates to the selected tier's price.
       - Inactive options (`active: false`) render with `opacity-40 cursor-not-allowed line-through` and an "UNAVAILABLE" badge.
       - If customer attempts to select or add an inactive price tier, disable the selection and prevent adding to cart.
   - In `Dashboard.tsx`:
     - Provide an admin UI section under both `newProductModal` and `editProduct` modal to add price options (Label, Price, Active toggle).
     - Provide quick active/inactive toggles for each price option.
     - Saving persists `priceOptions` directly into Neon JSONB array.

4. **Multi-Device Reactivity**:
   - Observation 1.2 shows that `StoreContext.tsx` already has robust multi-device reactivity (window focus, visibilitychange, 30s polling).
   - Once a size or price option is saved to Neon DB via `api/store.ts`, any other browser tab or device will automatically receive the updated `sizes` and `priceOptions` upon the next focus/visibilitychange or 30s cycle.

5. **Automated Verification Suite Design**:
   - Observation 1.5 shows `scripts/verify-all-entities-e2e.mjs` runs directly against live Neon DB and verifies all core entities.
   - **Reasoning**: We can add a dedicated Milestone 6 verification block (or standalone script `scripts/verify-milestone6-sizes-pricing-e2e.mjs`) that executes live checks:
     - Check 1: Verify `prod-5` in Neon DB contains `["S", "M", "L", "XL", "2XL", "XXL"]`.
     - Check 2: Admin size persistence: create a test product with preset + custom sizes (`["S", "M", "2XL", "XXL", "CUSTOM-OVERSIZE"]`), verify persistence via direct SQL, update sizes, and verify clean deletion.
     - Check 3: Admin price options persistence: create a test product with active and inactive price options (`[{ label: "Tier 1", price: 500, active: true }, { label: "Tier 2", price: 800, active: false }]`), verify persistence via direct SQL, toggle `active: false -> true`, verify readback, and clean up with zero residuals.

6. **Git & Release Compliance**:
   - Observation 1.7 shows that pushing requires switching to `Mupesa` on GitHub CLI:
     `gh auth switch --user Mupesa`
     `git push origin main`

---

## 3. Caveats

1. **No Production Database Overwrites**:
   - The test suite must strictly clean up all temporary test products after verification so the live catalog baseline remains at 24 products.
2. **Backwards Compatibility**:
   - Existing products that do not have `priceOptions` defined will continue to use `product.price`.
   - `ProductModal.tsx` and `Shop.tsx` must gracefully fall back to `product.price` when `product.priceOptions` is undefined or empty.
3. **Cart Item Structure**:
   - When a customer purchases a product with a specific price option, `CartItem` can optionally record `priceOptionLabel` or `price` so that the checkout order details reflect the chosen price tier.

---

## 4. Conclusion

1. **Database & Persistence**:
   - Neon PostgreSQL table `public.zimthreads_store` (`key = 'products'`) uses JSONB, which inherently supports arbitrary nested fields including `sizes: string[]` and `priceOptions: PriceOption[]`.
   - No table DDL alteration is required; `api/store.ts` already supports full JSONB sync and update operations.
2. **Database Data Update Needed**:
   - `prod-5` in the live Neon DB currently lacks `2XL` and `XXL`. A database update must be executed to persist `["S", "M", "L", "XL", "2XL", "XXL"]` to Neon DB.
3. **Frontend Changes Needed**:
   - `src/store/seedData.ts`:
     - Define `PriceOption` interface.
     - Add `priceOptions?: PriceOption[]` to `Product`.
     - Update `prod-5` in `initialProducts` to include `["S", "M", "L", "XL", "2XL", "XXL"]`.
   - `src/pages/admin/Dashboard.tsx`:
     - Add Size Management (preset chips for `S, M, L, XL, 2XL, XXL, One Size` + custom size adder) to both `newProductModal` and `editProduct` modal.
     - Add Price Option Management (tier label, price numeric, active toggle) to both `newProductModal` and `editProduct` modal.
   - `src/components/ProductModal.tsx`:
     - Support 2XL and XXL size buttons for `prod-5` and all products.
     - Support selectable price options, rendering inactive options as greyed-out / disabled / line-through with "UNAVAILABLE" tag, preventing add-to-cart.
   - `src/pages/Shop.tsx`:
     - Render price option indicators or ranges where appropriate, preventing quick-add if primary tier is unavailable.
4. **Verification & Testing**:
   - Create or extend E2E verification script to test:
     1. `prod-5` sizes in Neon DB.
     2. Admin size CRUD in Neon DB.
     3. Active/inactive price option CRUD in Neon DB.
     4. Build check (`npm run build` & `npx tsc --noEmit`).
     5. Zero residuals guarantee.
5. **Git & Account Security**:
   - Commits strictly under `Mupesa` / `anesumupesa@gmail.com`.
   - Push strictly preceded by `gh auth switch --user Mupesa`.

---

## 5. Verification Method

To independently verify all findings and validate the forthcoming implementation:

### 5.1 Verification Commands
```powershell
# 1. Run full project TypeScript type check
npx tsc --noEmit

# 2. Run production Vite build
npm run build

# 3. Verify current live E2E test suite against Neon PostgreSQL
npm run test:verify

# 4. Query live Neon DB directly to check prod-5 sizes
node -e "
import('./api/store.ts').then(async (m) => {
  const rows = await m.executeSql('SELECT data FROM public.zimthreads_store WHERE key = \'products\';');
  const prod5 = rows[0]?.data.find(p => p.id === 'prod-5');
  console.log('prod-5 sizes in Neon DB:', prod5?.sizes);
  process.exit(0);
});
"

# 5. Verify Git and GitHub authentication
git config user.name
git config user.email
gh auth status
```

### 5.2 Invalidation Conditions
- If `prod-5` in Neon DB does not include both `"2XL"` and `"XXL"`.
- If an administrator in `/admin` cannot add or remove sizes in the `editProduct` modal.
- If inactive price options in `ProductModal` remain selectable or allow adding to cart.
- If changes to product sizes or price options do not persist to Neon DB `zimthreads_store`.
- If `npm run build` or `npx tsc --noEmit` fails with any compilation error.
- If git commits or pushes are executed under any identity other than `Mupesa` (`anesumupesa@gmail.com`).
