# Catalog & Racing Jackets Reactivity Specification

**Document**: `catalog_reactivity_spec.md`  
**Milestone**: Milestone 2 — Customer-Facing Flows & StoreContext  
**Target Pages**: `/shop` (`src/pages/Shop.tsx`), `/collection/racing-jackets` (`src/pages/JacketsCollectionPage.tsx`)  
**Investigator**: Explorer 3 (Catalog Reactivity)  
**Date**: October 10, 2026  

---

## 1. Executive Summary

This specification provides a thorough investigation and reactivity verification for the Zimthreads product catalog and the 14 Archival Racing Jackets across `/shop` and `/collection/racing-jackets`.

### Core Assessment
1. **Live State Reactivity**: Both `/shop` and `/collection/racing-jackets` actively consume products from `useStore().products`. Neither page relies on static product arrays for rendering items, prices, or stock.
2. **Dynamic Price & Stock Aggregation**: Minimum jacket pricing on `/shop` (`minJacketPrice`) and price ranges on `/collection/racing-jackets` (`minPrice`, `maxPrice`) are dynamically derived via `useMemo` hooks over the live `products` array.
3. **Admin Batch Update Propagation**: Mutations initiated in the Admin Dashboard (`updateProductsBatch` or `updateProduct`) update React state `products` in `StoreContext`, which immediately triggers re-renders on both customer-facing pages.
4. **No Static Shadow Arrays**: No hardcoded product object arrays shadow the live store state. `racingJacketsCollection` in `src/store/seedData.ts` serves solely as metadata (collection title, tagline, hero image, and an ID checklist).
5. **Key Defects Identified**:
   - **Critical TypeScript Build Errors**: In `src/pages/Shop.tsx`, properties `title` and `subtitle` are accessed on `racingJacketsCollection` instead of `name` and `tagline`, and `Link` receives an incompatible `onClick` signature. This currently causes `tsc --noEmit` and `npm run build` to fail.
   - **Modal Snapshot Staleness (Soft Shadowing)**: `selectedProduct` in `Shop.tsx` and `JacketsCollectionPage.tsx` holds a point-in-time product snapshot in local component state. If store state updates while the modal is open or immediately before, the modal displays the stale snapshot rather than re-indexing `products.find(p => p.id === selectedProduct.id)`.
   - **Hardcoded Piece Count in Shop Badge**: `Shop.tsx:190` hardcodes `"COLLECTION · 14 PIECES"` rather than referencing `activeJacketProds.length`.
   - **Missing Sold Out Visual Indicator on Jacket Cards**: `JacketsCollectionPage.tsx` displays "Low Stock" for 1-5 pieces, but omits a "Sold Out" badge when `stock === 0`.

---

## 2. Catalog State Architecture & Reactivity Chain

```
┌─────────────────────────────────────────────────────────────┐
│                 Neon PostgreSQL Database                    │
│   Table: public.zimthreads_store (key: 'products')          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                fetch('/api/store') / syncToCloud()
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                src/store/StoreContext.tsx                   │
│   - products: Product[] (useState initialized from cache)   │
│   - fetchCloudData() on mount hydrates live Neon DB state   │
│   - updateProductsBatch() / updateProduct() mutates state   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│      src/pages/Shop.tsx      │ │src/pages/JacketsCollectionPage│
│  - useStore().products       │ │  - useStore().products       │
│  - activeJacketProds (memo)  │ │  - jacketProducts (memo)     │
│  - minJacketPrice (memo)     │ │  - minPrice / maxPrice (memo)│
│  - filtered (memo)           │ │  - Live edition grid cards   │
│  - Paddock Capsule Card      │ │  - Live price & stock badges │
└──────────────┬───────────────┘ └────────────┬────────────────┘
               │                              │
               └──────────────┬───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                src/components/ProductModal.tsx              │
│  - Live price calculation: product.price + customNamePrice  │
│  - Stock guard: disabled={product.stock <= 0}               │
│  - addToCart(product, quantity, size, customName)           │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                src/components/CartDrawer.tsx                │
│  - cart: CartItem[] with captured price                     │
│  - Real-time subtotal, shipping threshold, & total          │
│  - createOrder() persists order to Neon DB                  │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 State Hydration in `StoreContext.tsx`
- **Initial Load**:
  - `localStorage` key `zimthread_products_v7` is checked first.
  - If cached, items are merged with `initialProducts` (which seeds the 14 jackets and core apparel).
- **Cloud Revalidation**:
  - In `StoreContext.tsx` (lines 300-348), an asynchronous `fetchCloudData()` effect executes `fetch("/api/store")`.
  - When the response resolves with `{ success: true, data: { products: cloudProducts } }`, `setProducts(cloudProducts)` overwrites local state with the latest production Neon DB records.
- **Admin Mutation**:
  - In `StoreContext.tsx` (lines 615-628):
    ```typescript
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
  - When invoked from the Admin Dashboard, `setProducts(next)` synchronously updates the React context, broadcasting new state to all subscribed consumers. Simultaneously, `syncToCloud("products", next)` issues a `POST /api/store` with `adminToken: "Zimthreads200"` to persist updates to Neon PostgreSQL.

---

## 3. Detailed Verification: `/shop` (`src/pages/Shop.tsx`)

### 3.1 Product State Consumption
`Shop.tsx` accesses the global store at line 16:
```typescript
const { products, addToCart, settings } = useStore()
```

### 3.2 Dynamic Jacket Calculation & Separation
`Shop.tsx` separates the individual 14 archival racing jackets from standard shop catalog items:
- Lines 38-46:
  ```typescript
  const activeJacketProds = useMemo(() => {
    return products.filter(
      (p) =>
        !p.hidden &&
        (p.collectionId === "racing-jackets" ||
        racingJacketsCollection.productIds.includes(p.id) ||
        p.id.startsWith("prod-jacket-")),
    )
  }, [products])
  ```
- Lines 48-51:
  ```typescript
  const minJacketPrice = useMemo(() => {
    if (activeJacketProds.length === 0) return 1750
    return Math.min(...activeJacketProds.map((p) => p.price))
  }, [activeJacketProds])
  ```
- Lines 61-69: Individual collective jackets are excluded from the standard product grid so that they do not clutter the general catalog.
- Lines 84-91: When `activeJacketProds.length > 0`, the curated "The Paddock Archive" feature card is rendered inside the grid.
- Line 220: Displays `From Rs {minJacketPrice}` dynamically.

**Reactivity Finding**:
When an administrator modifies the prices of the jackets via the batch pricing desk, `products` changes, `activeJacketProds` recomputes, `minJacketPrice` recalculates, and the banner card immediately updates its "From Rs X" price tag without requiring a page reload.

### 3.3 Standard Catalog Products
Standard products in `filtered` (e.g., Zimbabwe '02' Heritage Jersey, Clean kits, combos) render directly from `products`:
- Displayed price: `Rs {p.price}` (line 335)
- Stock state:
  - `p.stock <= 5 && p.stock > 0`: renders `"Low Stock"` badge (lines 298-303)
  - `p.stock === 0`: renders `"Sold Out"` badge (lines 304-308)
  - Quick Add button: `disabled={p.stock <= 0}` (line 339)
  - `handleQuickAdd(e, p)` invokes `addToCart(p, 1, p.sizes ? p.sizes[0] : undefined)` passing the live product object `p`.

---

## 4. Detailed Verification: `/collection/racing-jackets` (`src/pages/JacketsCollectionPage.tsx`)

### 4.1 Product State Consumption
`JacketsCollectionPage.tsx` accesses the store at line 8:
```typescript
const { products } = useStore()
```

### 4.2 Live Product Filtering & Price Bounds
Lines 13-31:
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

const minPrice = useMemo(() => {
  if (jacketProducts.length === 0) return 1750
  return Math.min(...jacketProducts.map((p) => p.price))
}, [jacketProducts])

const maxPrice = useMemo(() => {
  if (jacketProducts.length === 0) return 2850
  return Math.max(...jacketProducts.map((p) => p.price))
}, [jacketProducts])
```

### 4.3 Masthead & Gallery Reactivity
- **Masthead Metadata Strip** (lines 90-95):
  - `{jacketProducts.length} Curated Editions` reflects the live array length.
  - `From Rs {minPrice} — Rs {maxPrice}` updates immediately whenever any jacket price changes.
- **Gallery Grid Cards** (lines 107-213):
  - `jacketProducts.map((p, index) => ...)`
  - Price: `<span ...>Rs {p.price}</span>` (line 174) renders the exact store price.
  - Stock Notice: `{p.stock <= 5 && p.stock > 0 && <span ...>Low Stock · {p.stock} Left</span>}` (lines 140-144).
  - Visibility: When an admin toggles a jacket to `hidden: true`, `jacketProducts` filter filters it out, and the card immediately disappears from the collection.

---

## 5. Cart Interactions & Pricing Dynamics

### 5.1 Quick Add vs Product Modal
1. **Quick Add (`Shop.tsx:92-99`)**:
   - For single-size products with 1 view, `handleQuickAdd` immediately adds the item via `addToCart(p, 1, ...)`.
   - The price recorded in `cart` is `p.price`.
2. **Modal View (`ProductModal.tsx:11-502`)**:
   - Used for multi-size apparel and all 14 racing jackets.
   - Calculates unit price: `unitPrice = product.price + (isCustomActive ? customPrice : 0)` (line 49).
   - Prevents purchase when out of stock: `disabled={product.stock <= 0 || isCustomRequiredButEmpty}` (line 479).
   - Button text displays live price: `ADD TO BAG (Rs ${(unitPrice * quantity).toFixed(0)})`.

### 5.2 Cart State & Checkout
- `StoreContext.tsx` `addToCart`:
  - Captures `price: finalPrice` onto the new `CartItem`.
  - Calculates `cartTotal` via `cart.reduce((sum, item) => sum + item.price * item.quantity, 0)`.
- `CartDrawer.tsx`:
  - Dynamically computes `isFreeDelivery = cartTotal >= settings.freeDeliveryThreshold`.
  - On checkout submission, `createOrder()` snapshots the cart items into `newOrder.items` with exact item prices and submits to Neon DB.

---

## 6. Audit of Static Shadows & Defects Identified

### Defect 1: Critical TypeScript Compilation Errors in `src/pages/Shop.tsx`
- **Location**: `src/pages/Shop.tsx:184, 205, 208, 225`
- **Direct Observation**:
  Executing `npx tsc --noEmit` yields:
  ```
  src/pages/Shop.tsx(184,50): error TS2339: Property 'title' does not exist on type 'CollectiveCollection'.
  src/pages/Shop.tsx(205,46): error TS2339: Property 'title' does not exist on type 'CollectiveCollection'.
  src/pages/Shop.tsx(208,46): error TS2339: Property 'subtitle' does not exist on type 'CollectiveCollection'.
  src/pages/Shop.tsx(225,21): error TS2322: Type '(e: any) => any' is not assignable to type '() => void'.
    Target signature provides too few arguments. Expected 1 or more, but got 0.
  src/pages/Shop.tsx(225,31): error TS7006: Parameter 'e' implicitly has an 'any' type.
  ```
- **Root Cause**:
  `CollectiveCollection` in `src/store/seedData.ts` defines `name: string` and `tagline: string`, NOT `title` and `subtitle`.
  In `src/router.tsx`, `Link` defines `onClick?: () => void`, rejecting `(e) => e.stopPropagation()`.
- **Proposed Correction**:
  In `src/pages/Shop.tsx`:
  - Line 184: `alt={racingJacketsCollection.name}`
  - Line 205: `{racingJacketsCollection.name}`
  - Line 208: `{racingJacketsCollection.tagline}`
  - Line 225: `<span onClick={(e) => e.stopPropagation()}><Link to="/collection/racing-jackets" ...`

### Defect 2: Selected Product Modal Snapshot Staleness (Soft Shadowing)
- **Location**: `src/pages/Shop.tsx:21, 357` and `src/pages/JacketsCollectionPage.tsx:9, 262`
- **Direct Observation**:
  Components store `const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)`. When a product card is clicked, `selectedProduct` holds the object reference from that render.
  If the store receives updated prices (e.g. from `fetchCloudData` revalidation or admin updates), `selectedProduct` in local state does not automatically re-derive from `products`.
- **Proposed Correction**:
  Derive the active product reactively before passing to `ProductModal`:
  ```typescript
  const liveSelectedProduct = useMemo(() => {
    if (!selectedProduct) return null
    return products.find((p) => p.id === selectedProduct.id) || selectedProduct
  }, [products, selectedProduct])
  ```
  Pass `product={liveSelectedProduct}` to `<ProductModal />`.

### Defect 3: Hardcoded Badge Piece Count in `Shop.tsx`
- **Location**: `src/pages/Shop.tsx:190`
- **Direct Observation**:
  ```tsx
  <span>COLLECTION · 14 PIECES</span>
  ```
  This is a hardcoded string. If one or more jackets are toggled to `hidden: true` by the admin, `activeJacketProds.length` changes, but the badge continues to state `"14 PIECES"`.
- **Proposed Correction**:
  ```tsx
  <span>COLLECTION · {activeJacketProds.length} PIECES</span>
  ```

### Defect 4: Missing "Sold Out" Visual Cue on Jacket Gallery Cards
- **Location**: `src/pages/JacketsCollectionPage.tsx:140-144`
- **Direct Observation**:
  Only displays `p.stock <= 5 && p.stock > 0` ("Low Stock · {p.stock} Left"). If `p.stock === 0`, no badge is displayed on the card, unlike `Shop.tsx` which clearly marks `Sold Out`.
- **Proposed Correction**:
  Add:
  ```tsx
  {p.stock === 0 && (
    <span className="absolute bottom-3 right-3 bg-red-600 text-white text-[8px] sm:text-[9px] font-bold uppercase px-2 py-0.5 z-10">
      Sold Out
    </span>
  )}
  ```

---

## 7. Concrete Code Patches for Implementation

### Patch 1: Fix `src/pages/Shop.tsx`
```diff
--- a/src/pages/Shop.tsx
+++ b/src/pages/Shop.tsx
@@ -181,7 +181,7 @@ export default function Shop() {
                 <div className="aspect-square overflow-hidden bg-black relative">
                   <img
                     src={racingJacketsCollection.heroImage}
-                    alt={racingJacketsCollection.title}
+                    alt={racingJacketsCollection.name}
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                   />
                   {/* Badge */}
@@ -187,7 +187,7 @@ export default function Shop() {
                   <span className="absolute top-2 left-2 bg-[#86a84e] text-black text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 tracking-wider shadow-sm flex items-center gap-1.5 z-10">
                     <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
-                    <span>COLLECTION · 14 PIECES</span>
+                    <span>COLLECTION · {activeJacketProds.length} PIECES</span>
                   </span>
                   <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent opacity-80" />
                 </div>
@@ -202,10 +202,10 @@ export default function Shop() {
                     </span>
                   </div>
                   <h3 className="font-display font-bold text-xs sm:text-sm text-white mb-1 leading-snug group-hover:text-[#86a84e] transition-colors line-clamp-2">
-                    {racingJacketsCollection.title}
+                    {racingJacketsCollection.name}
                   </h3>
                   <p className="text-[10px] sm:text-[11px] text-[#9ca3af] line-clamp-2 leading-relaxed">
-                    {racingJacketsCollection.subtitle}
+                    {racingJacketsCollection.tagline}
                   </p>
                 </div>
               </div>
@@ -220,13 +220,14 @@ export default function Shop() {
                       From Rs {minJacketPrice}
                     </span>
                   </div>
-                  <Link
-                    to="/collection/racing-jackets"
-                    onClick={(e) => e.stopPropagation()}
-                    className="w-full sm:w-auto px-2.5 py-1.5 sm:py-1 bg-[#86a84e] text-black text-[9px] sm:text-[10px] font-black tracking-widest uppercase hover:bg-[#9cc45e] transition-colors text-center inline-flex items-center justify-center gap-1 cursor-pointer"
-                  >
-                    <span>VIEW COLLECTION</span>
-                    <span>→</span>
-                  </Link>
+                  <span onClick={(e) => e.stopPropagation()}>
+                    <Link
+                      to="/collection/racing-jackets"
+                      className="w-full sm:w-auto px-2.5 py-1.5 sm:py-1 bg-[#86a84e] text-black text-[9px] sm:text-[10px] font-black tracking-widest uppercase hover:bg-[#9cc45e] transition-colors text-center inline-flex items-center justify-center gap-1 cursor-pointer"
+                    >
+                      <span>VIEW COLLECTION</span>
+                      <span>→</span>
+                    </Link>
+                  </span>
                 </div>
               </div>
             </div>
```

### Patch 2: Add Live Reactive Modal Selection to `Shop.tsx` and `JacketsCollectionPage.tsx`
In both files:
```typescript
const liveSelectedProduct = useMemo(() => {
  if (!selectedProduct) return null
  return products.find((p) => p.id === selectedProduct.id) || selectedProduct
}, [products, selectedProduct])
```
And replace:
```tsx
<ProductModal
  product={liveSelectedProduct}
  onClose={() => setSelectedProduct(null)}
/>
```

---

## 8. Verification Commands & Acceptance Checklist
1. **Compilation Check**:
   ```bash
   npx tsc --noEmit
   ```
   Must exit with code 0.
2. **Reactivity Test Procedure**:
   - Start dev server (`npm run dev`).
   - Open `/admin` in one browser tab. Navigate to Products -> Collective Pricing Desk.
   - Change the price of `Ferrari Scuderia Rosso Corsa Vintage Moto Leather Jacket` from `Rs 2850` to `Rs 3100`.
   - Click "Save All Prices & Stock".
   - Switch to `/collection/racing-jackets` tab: The Ferrari jacket should immediately display `Rs 3100`, and the masthead upper bound should update to `Rs 3100`.
   - Switch to `/shop` tab: The Paddock Archive collection card should dynamically display the correct minimum price.
   - Change stock to `0`: The jacket in `/shop` should show "Sold Out" and quick add should be disabled.
