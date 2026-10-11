# Milestone 3 Explorer 2 Investigation Report: Products, Batch Pricing & Services Desks

## 1. Observation

### A. Codebase Structure & Component Wiring
- **Admin Dashboard**: `src/pages/admin/Dashboard.tsx`
  - Products & Batch Pricing Section: Lines 1407–1844.
  - Services Section: Lines 1306–1405.
  - Form & Modal states: Lines 121–124:
    ```tsx
    const [newProductModal, setNewProductModal] = useState(false)
    const [editProduct, setEditProduct] = useState<Product | null>(null)
    const [newServiceModal, setNewServiceModal] = useState(false)
    const [editService, setEditService] = useState<Service | null>(null)
    ```
  - Service creation form default state (Lines 154–165):
    ```tsx
    const [serviceForm, setServiceForm] = useState({
      title: "",
      subtitle: "",
      price: "From $15",
      priceNumeric: 15,
      desc: "",
      features: "Deep clean, Midsole scrub, Deodorize",
      turnaround: "24-48 Hours",
      img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=350&fit=crop&auto=format",
      alt: "Service showcase",
      active: true,
    })
    ```
  - Batch Pricing staging state (Lines 113–114):
    ```tsx
    const [batchPrices, setBatchPrices] = useState<Record<string, { price: number; stock: number }>>({})
    const [showBatchPricingDesk, setShowBatchPricingDesk] = useState(true)
    ```

### B. Missing Service Edit Modal
- In `src/pages/admin/Dashboard.tsx`:
  - `editService` state declared at Line 124: `const [editService, setEditService] = useState<Service | null>(null)`.
  - Service Edit handler implemented at Lines 414–419:
    ```tsx
    const handleSaveEditService = (e: React.FormEvent) => {
      e.preventDefault()
      if (!editService) return
      updateService(editService.id, editService)
      setEditService(null)
    }
    ```
  - Services Catalog desk has an "Edit" button at Line 1388:
    ```tsx
    <button
      onClick={() => setEditService(s)}
      className="px-3 py-1 bg-[#374151] text-xs font-bold uppercase text-white hover:bg-[#4b5563]"
    >
      Edit
    </button>
    ```
  - **Critical Defect**: Searching for `{editService && (` or `editService` in the JSX modal block (Lines 2680–3425) reveals that **no modal is ever rendered for `editService`**. The JSX terminates at line 3424 after `newBlogModal`. Clicking "Edit" sets local state but renders nothing to the user interface.

### C. Service Creation Modal Limitations
- In `src/pages/admin/Dashboard.tsx:3106-3194` (`newServiceModal`):
  - Currency placeholder is `"From $20"` (Line 3146), inconsistent with Zimthreads' standard Mauritian Rupees (`Rs`).
  - There is **no input field for `priceNumeric`** in the modal form. When submitted (Lines 402–403), `priceNumeric: Number(serviceForm.priceNumeric)` always inherits the initial default `15`.
  - There is **no input field for `turnaround`** in the modal form. It always defaults to `"24-48 Hours"`.
  - `serviceForm` state is not reset upon form submission or cancellation.

### D. Products Desk Persistence & Keystroke Sync
- In `src/pages/admin/Dashboard.tsx:1799–1808`, standard product stock inline edit:
  ```tsx
  <input
    type="number"
    value={p.stock}
    onChange={(e) =>
      updateProduct(p.id, {
        stock: parseInt(e.target.value) || 0,
      })
    }
    className="w-14 bg-[#111827] border border-[#374151] px-1.5 py-0.5 text-xs text-white text-center font-mono"
  />
  ```
  Every keystroke immediately triggers `updateProduct`, calling `syncToCloud("products", next)` and showing toast `"Product Updated"` (Lines 748–755 of `StoreContext.tsx`). There is no debounce or blur trigger, generating redundant network requests during numeric typing.

### E. Batch Pricing Desk for 14 Archival Racing Jackets
- In `src/pages/admin/Dashboard.tsx:1409–1413`:
  ```tsx
  const jacketProducts = products.filter(
    (p) =>
      p.collectionId === "racing-jackets" ||
      p.id.startsWith("prod-jacket-"),
  )
  ```
- Filtering correctly targets all 14 archival jackets.
- Row-level edits stage changes into `batchPrices` via `handleBatchPriceChange` (Lines 1444–1466).
- Two save paths exist:
  1. Row-level save button (Lines 1656–1671) calling `updateProduct(j.id, { price: pendingPrice, stock: pendingStock })`.
  2. Batch button `Save All Prices & Stock` (Lines 1468–1482) calling `updateProductsBatch(updates)`:
     ```tsx
     const handleSaveAllBatch = () => {
       const updates = Object.entries(batchPrices).map(([id, data]) => ({
         id,
         changes: {
           price: data.price,
           stock: data.stock,
         },
       }))
       if (updates.length === 0) {
         showToast("No Changes", "No price or stock changes were made.", "info")
         return
       }
       updateProductsBatch(updates)
       setBatchPrices({})
     }
     ```
- In `src/store/StoreContext.tsx:757–770`:
  ```tsx
  const updateProductsBatch = (
    updates: { id: string; changes: Partial<Product> }[],
  ) => {
    setProducts((prev) => {
      const map = new Map(updates.map((u) => [u.id, u.changes]))
      const next = prev.map((p) => {
        const changes = map.get(p.id)
        return changes ? { ...p, ...changes } : p
      })
      syncToCloud("products", next)
      return next
    })
    showToast("Batch Updated", "Product prices & inventory updated successfully.")
  }
  ```
- Changes persist to Neon DB via `syncToCloud("products", next)` which sends POST `/api/store` with `{ action: "sync", key: "products", data: next, adminToken: "Zimthreads200" }`.

### F. Live Database State & Initial Product Resurrections
- Querying live Neon DB table `public.zimthreads_store` (`ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech`, project `rapid-hill-42448439`):
  - `products`: currently has **16 items** in Neon DB:
    - 14 jackets (`prod-jacket-ferrari-red-leather` through `prod-jacket-ferrari-windbreaker`)
    - `prod-brace-heritage`
    - `prod-5`
  - `services`: currently has **7 items** in Neon DB (`clean`, `deep`, `restore`, `deal-2pairs`, `deal-3pairs`, `apparel`, `personal`).
- Observation in `src/store/seedData.ts`:
  - `initialProducts` contains **24 items** (14 jackets + 10 core apparel/cleaning products).
  - 8 core products are missing from Neon DB (`prod-zim-02`, `prod-1`, `prod-2`, `prod-3`, `prod-4`, `prod-6`, `prod-7`, `prod-8`).
- Observation in `src/store/StoreContext.tsx:253–262`:
  ```tsx
  const [products, setProducts] = useState<Product[]>(() => {
    const loaded = getStored(STORAGE_KEYS.PRODUCTS, initialProducts)
    const loadedMap = new Map(loaded.map((p) => [p.id, p]))
    const merged = initialProducts.map((initProd) => {
      const existing = loadedMap.get(initProd.id)
      return existing ? { ...initProd, ...existing } : initProd
    })
    const initialIds = new Set(initialProducts.map((p) => p.id))
    const extraCustom = loaded.filter((p) => !initialIds.has(p.id))
    const combined = [...merged, ...extraCustom]
  ```
  - If an admin deletes an initial product, on hard refresh the item resurrects because `initialProducts.map` falls back to `initProd` when `existing` is missing from `loadedMap`.
  - When `fetchCloudData()` subsequently sets `setProducts(cloudProducts)` (Lines 377–379), products drops from 24 to 16, hiding the 8 core products from both the admin catalog and `/shop`.

---

## 2. Logic Chain

1. **Service Editing is Broken**:
   - Observation B shows `editService` state exists and `handleSaveEditService` is declared, but no modal JSX exists for `{editService && (...) }`.
   - Clicking "Edit" on any service card sets state but produces no DOM change.
   - Conclusion: The worker must create the `Edit Service Modal` in `Dashboard.tsx`.

2. **Service Active Toggle Works and Propagates**:
   - Observation A & `Services.tsx:20` / `Booking.tsx:79` show `services.filter(s => s.active !== false)`.
   - Toggling active status calls `updateService(s.id, { active: s.active === false })`, which persists to Neon DB via `syncToCloud("services", next)`.
   - Customer-facing pages react immediately in memory and retain state across hard reloads once saved in Neon.

3. **Batch Pricing Desk is Fully Functional but Needs Staging Polish**:
   - Observation E shows `handleBatchPriceChange` buffers edits in `batchPrices` without immediate network spam.
   - `handleSaveAllBatch` and row-level save call `updateProductsBatch` and `updateProduct`, which serialize all 14 jackets to Neon DB via `action: "sync"`.
   - However, `setBatchPrices({})` runs synchronously before network confirmation. If the network call fails, edits are cleared locally.

4. **Product Resurrections and Catalog Discrepancy**:
   - Observation F shows Neon DB only contains 16 products, missing 8 core products from `initialProducts`.
   - Observation F also shows `StoreContext.tsx` uses a merger that resurrects deleted initial products on mount.
   - Conclusion: Seeding all 24 canonical products to Neon DB and updating `StoreContext.tsx` hydration logic to treat Neon DB as canonical will prevent resurrected products and ensure the full catalog is visible.

5. **Inline Stock Spam**:
   - Observation D demonstrates that typing in the standard product stock input triggers an un-debounced full table update to Neon on each keystroke.
   - Debouncing or triggering on blur will prevent unnecessary network traffic.

---

## 3. Caveats

- **Media Atelier Uploads**: Uploading images via Cloudinary inside modals depends on valid Cloudinary browser config or preset. If credentials are not configured, image URLs must be manually entered or pasted.
- **Admin Token**: All admin mutations depend on `adminToken === "Zimthreads200"`, which is hardcoded in `syncToCloud` in `StoreContext.tsx` and matches `api/store.ts:292`.
- **Other Desks**: Inquiries, Orders, Bookings, Blog, and Settings desks are investigated separately by Milestone 3 Explorer 1.

---

## 4. Conclusion

The Products and Batch Pricing desks are substantially wired to Neon DB, with batch updates for all 14 jackets successfully serializing to the cloud database. However, three critical issues require immediate remediation in Milestone 3:
1. **Missing Edit Service Modal**: Admins cannot edit services (price, turnaround, features, title, image) because the modal JSX was omitted from `Dashboard.tsx`.
2. **Missing Canonical Core Products in Neon**: Neon DB only has 16 items; the 8 core products must be synced to Neon DB so `/shop` displays the full catalog upon cloud hydration.
3. **Resurrection on Hard Reload**: `StoreContext.tsx` resurrects deleted products due to `initialProducts.map` fallback.

### Actionable Implementation Strategy for the Worker

#### Task 1: Add Edit Service Modal in `src/pages/admin/Dashboard.tsx`
Add the following JSX directly after `{newServiceModal && (...) }` (around line 3197):
```tsx
{/* Edit Service Modal */}
{editService && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
    <div className="bg-[#1f2937] border border-[#374151] w-full max-w-md p-6 text-white shadow-2xl animate-scale-up">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#374151]">
        <h3 className="font-display text-lg font-bold uppercase">Edit Service Offering</h3>
        <button
          onClick={() => setEditService(null)}
          className="text-sm font-bold text-[#9ca3af] hover:text-white"
        >
          ✕
        </button>
      </div>
      <form onSubmit={handleSaveEditService} className="space-y-3 text-xs">
        <div>
          <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">Service Title *</label>
          <input
            type="text"
            required
            value={editService.title}
            onChange={(e) => setEditService({ ...editService, title: e.target.value })}
            className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">Subtitle</label>
            <input
              type="text"
              value={editService.subtitle}
              onChange={(e) => setEditService({ ...editService, subtitle: e.target.value })}
              className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">Display Price *</label>
            <input
              type="text"
              required
              value={editService.price}
              onChange={(e) => setEditService({ ...editService, price: e.target.value })}
              className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">Numeric Price (Rs) *</label>
            <input
              type="number"
              required
              value={editService.priceNumeric}
              onChange={(e) => setEditService({ ...editService, priceNumeric: parseFloat(e.target.value) || 0 })}
              className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">Turnaround Time *</label>
            <input
              type="text"
              required
              value={editService.turnaround}
              onChange={(e) => setEditService({ ...editService, turnaround: e.target.value })}
              className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">Features (comma separated)</label>
          <input
            type="text"
            value={editService.features.join(", ")}
            onChange={(e) =>
              setEditService({
                ...editService,
                features: e.target.value.split(",").map((f) => f.trim()).filter(Boolean),
              })
            }
            className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
          />
        </div>
        <ImageUploader
          value={editService.img}
          onChange={(url) => setEditService({ ...editService, img: url })}
          folder="zimthreads/services"
          label="Service Showcase Image"
          compact
        />
        <div>
          <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">Description</label>
          <textarea
            value={editService.desc}
            onChange={(e) => setEditService({ ...editService, desc: e.target.value })}
            className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white resize-none"
            rows={2}
          />
        </div>
        <div className="flex items-center gap-2 p-2.5 bg-[#111827] border border-[#374151] rounded-xs">
          <input
            type="checkbox"
            id="editServiceActive"
            checked={editService.active !== false}
            onChange={(e) => setEditService({ ...editService, active: e.target.checked })}
            className="w-4 h-4 accent-[#4a5c2d] cursor-pointer"
          />
          <label htmlFor="editServiceActive" className="text-xs text-gray-300 font-mono cursor-pointer select-none">
            Active service (Available on website & booking)
          </label>
        </div>
        <button
          type="submit"
          className="w-full py-2.5 bg-[#4a5c2d] hover:bg-[#5a7038] text-white font-bold uppercase tracking-widest mt-2 cursor-pointer"
        >
          Save Service Changes
        </button>
      </form>
    </div>
  </div>
)}
```

#### Task 2: Polish `newServiceModal` in `src/pages/admin/Dashboard.tsx`
- In `serviceForm` state (Line 154), change default price to `"Rs 300"` and `priceNumeric: 300`.
- In `newServiceModal` form, add input fields for `priceNumeric` and `turnaround`.
- Reset `serviceForm` on modal submit and cancellation.

#### Task 3: Seed Canonical 24 Products to Neon DB
- Ensure the 8 missing products from `initialProducts` are merged with the 16 products in Neon DB so that all 24 items are persisted to Neon.
- In `StoreContext.tsx:377–379`, hydrate `products` from `cloudProducts` while falling back to `initialProducts` only if Neon DB is empty.

#### Task 4: Fix State Resurrections in `src/store/StoreContext.tsx`
- Replace `initialProducts.map(...)` fallback on mount with direct loading from `localStorage` (`getStored(STORAGE_KEYS.PRODUCTS, initialProducts)`). If an item was deleted, it will stay deleted instead of being artificially reintroduced.

#### Task 5: Debounce Inline Stock Inputs
- In `Dashboard.tsx:1801`, attach `onBlur` or a debounced updater to the stock `<input>` so user keystrokes do not spam `/api/store`.

---

## 5. Verification Method

To independently verify the findings and implementation:
1. **Inspect Modal JSX in Dashboard**:
   ```powershell
   Get-Content "src\pages\admin\Dashboard.tsx" | Select-String -Pattern "editService &&"
   ```
   *Expected Current Output*: 0 matches (confirms missing modal).
   *Post-Fix Output*: 1 match rendering the edit modal.

2. **Verify Neon DB Products & Services Count**:
   Run via node against Neon endpoint:
   ```javascript
   const res = await fetch("https://ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech/sql", {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
       "Neon-Connection-String": "postgresql://neondb_owner:npg_DR0tIYcQyeX8@ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require"
     },
     body: JSON.stringify({
       query: "SELECT key, jsonb_array_length(data) as count FROM public.zimthreads_store WHERE key IN ('products', 'services');"
     })
   });
   ```
   *Expected Current Output*: `products` = 16, `services` = 7.
   *Post-Fix Output*: `products` = 24, `services` = 7 (or more upon service addition).

3. **Verify Build Integrity**:
   ```powershell
   npm run build
   ```
   *Expected Output*: Build completes cleanly with zero TypeScript errors.

4. **Invalidation Condition**:
   If `Dashboard.tsx` already had an active `editService` modal or if Neon DB already held all 24 products, this analysis would be invalidated. Direct file inspection and SQL query confirm both findings.
