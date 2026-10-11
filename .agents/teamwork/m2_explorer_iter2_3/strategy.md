# Strategy: Dynamic Product Dereferencing for `JacketsCollectionPage.tsx` Modal Reactivity

## 1. Executive Summary & Problem Analysis

In Reviewer 2's adversarial evaluation (`review.md` Finding 2), an inconsistency was uncovered between `src/pages/Shop.tsx` and `src/pages/JacketsCollectionPage.tsx` regarding how the quick-view `ProductModal` is supplied with product data:

- In `Shop.tsx` (lines 23–26 and 363), the component defines a memoized selector `liveSelectedProduct` that searches the live `products` array from `useStore()` whenever `products` or `selectedProduct` changes.
- In `JacketsCollectionPage.tsx` (lines 9 and 261–264), the component passes the static state snapshot `product={selectedProduct}` directly into `<ProductModal>`.

### The Problem & Blast Radius
When a customer clicks any jacket card on `/collection/racing-jackets`, `setSelectedProduct(p)` captures the product snapshot at that specific point in time. If an administrator subsequently alters the jacket's price or stock (e.g., via the Admin Dashboard's Batch Pricing desk or direct Neon PostgreSQL sync), or if background rehydration occurs via `fetchCloudData()`:
1. `products` in `StoreContext` updates.
2. `JacketsCollectionPage.tsx` re-evaluates `jacketProducts`, `minPrice`, `maxPrice`, and the catalog cards in the grid.
3. **However, `selectedProduct` remains frozen at the old snapshot.** The open `ProductModal` continues to display the outdated price and old stock count.
4. If the user clicks **ADD TO BAG**, `addToCart()` receives the stale `product.price` from the snapshot, resulting in checkout price desynchronization and potential overselling of depleted stock.

---

## 2. Examination of `Shop.tsx` Architecture

In `src/pages/Shop.tsx`, the reactivity pattern is implemented as follows:

```tsx
// src/pages/Shop.tsx: lines 21-26
const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

const liveSelectedProduct = useMemo(() => {
  if (!selectedProduct) return null
  return products.find((p) => p.id === selectedProduct.id) || selectedProduct
}, [products, selectedProduct])
```

And passed to `ProductModal`:

```tsx
// src/pages/Shop.tsx: lines 361-365
{/* Quick View Modal */}
<ProductModal
  product={liveSelectedProduct}
  onClose={() => setSelectedProduct(null)}
/>
```

### Why this design works seamlessly with `ProductModal.tsx`
Inside `src/components/ProductModal.tsx` (lines 21–27):
```tsx
useEffect(() => {
  setActiveImageIdx(0)
  setSelectedSize("")
  setQuantity(1)
  setIsCustomizing(false)
  setCustomName("")
}, [product?.id])
```
Because the effect dependency is strictly `[product?.id]`, when `price` or `stock` updates while the modal is open:
- `product.id` does **not** change.
- User input states (selected size, quantity, custom name personalization, and active gallery view) are **preserved without resetting**.
- Dynamic values derived during render (such as `unitPrice = product.price + ...`, `disabled={product.stock <= 0}`, and the button text) immediately update to match the live store state.
- When `handleAdd()` is triggered, `{ ...product }` captures the live price and live stock.

---

## 3. Comparison of Architectural Options

| Evaluation Criterion | Option 1: Memoized Selector (`Shop.tsx` Parity) | Option 2: Pure Product ID State (`selectedProductId`) |
| :--- | :--- | :--- |
| **State Declaration** | `useState<Product \| null>(null)` | `useState<string \| null>(null)` |
| **Selector** | `products.find(p => p.id === selectedProduct.id) \|\| selectedProduct` | `products.find(p => p.id === selectedProductId) \|\| null` |
| **Consistency** | 100% identical to `Shop.tsx` | Diverges from `Shop.tsx` pattern |
| **Code Churn** | Minimal (6 new lines, 1 line modified) | High (modifies state + 3 click handlers + close handler) |
| **Click Handlers** | Unchanged: `onClick={() => setSelectedProduct(p)}` | Modified: `onClick={() => setSelectedProductId(p.id)}` |
| **Fallback Safety** | Falls back to snapshot if temporarily missing | Evaluates to `null`, instantly unmounting modal |
| **Regression Risk** | Extremely low | Low-Medium (syntax and prop mismatches) |

### Recommended Choice: Option 1 (Parity with `Shop.tsx`)
Option 1 is strongly recommended. It adheres to the established codebase convention in `Shop.tsx`, minimizes code diff, prevents accidental modal flashing if `products` undergoes a transient update, and ensures clean maintainability across both catalog pages.

---

## 4. Concrete Proposed Code Changes

### Target File
`src/pages/JacketsCollectionPage.tsx`

### Change 1: Insert `liveSelectedProduct` Memoized Hook
Immediately after `selectedProduct` state declaration (lines 9–10):

**Before (Lines 8–11):**
```tsx
export default function JacketsCollectionPage() {
  const { products } = useStore()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [expandedDescIds, setExpandedDescIds] = useState<Record<string, boolean>>({})
```

**After:**
```tsx
export default function JacketsCollectionPage() {
  const { products } = useStore()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const liveSelectedProduct = useMemo(() => {
    if (!selectedProduct) return null
    return products.find((p) => p.id === selectedProduct.id) || selectedProduct
  }, [products, selectedProduct])

  const [expandedDescIds, setExpandedDescIds] = useState<Record<string, boolean>>({})
```

---

### Change 2: Update `<ProductModal>` Invocation
Change the `product` prop passed to `<ProductModal>` on line 262:

**Before (Lines 260–265):**
```tsx
      {/* Close-Up Product Modal (Shows Full Description, Sizes, and Add to Bag) */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
```

**After:**
```tsx
      {/* Close-Up Product Modal (Shows Full Description, Sizes, and Add to Bag) */}
      <ProductModal
        product={liveSelectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
```

---

## 5. Unified Unified Diff Patch

For direct reference by the implementation worker:

```diff
--- a/src/pages/JacketsCollectionPage.tsx
+++ b/src/pages/JacketsCollectionPage.tsx
@@ -8,6 +8,11 @@ export default function JacketsCollectionPage() {
   const { products } = useStore()
   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
+
+  const liveSelectedProduct = useMemo(() => {
+    if (!selectedProduct) return null
+    return products.find((p) => p.id === selectedProduct.id) || selectedProduct
+  }, [products, selectedProduct])
+
   const [expandedDescIds, setExpandedDescIds] = useState<Record<string, boolean>>({})
 
   // Retrieve all products belonging to this collection (excluding hidden pieces)
@@ -259,7 +264,7 @@ export default function JacketsCollectionPage() {
 
       {/* Close-Up Product Modal (Shows Full Description, Sizes, and Add to Bag) */}
       <ProductModal
-        product={selectedProduct}
+        product={liveSelectedProduct}
         onClose={() => setSelectedProduct(null)}
       />
     </main>
```

---

## 6. Edge Cases & Invariant Verification

1. **Price Change Invariant**:
   - When an admin adjusts a jacket price (e.g., from Rs 2200 to Rs 2450 in Neon DB), `StoreContext` updates `products`.
   - `liveSelectedProduct` recalculates and provides the updated price to `ProductModal`.
   - The modal displays `Rs 2450` without resetting any size or custom name inputs selected by the user.
   - Clicking `ADD TO BAG` adds the item with `price: 2450`.

2. **Stock Depletion Invariant**:
   - When jacket stock changes to `0` while modal is open, `product.stock <= 0` evaluates to true.
   - The primary CTA button is disabled (`disabled={product.stock <= 0}`), preventing overselling.

3. **Re-opening Modal Invariant**:
   - When closing the modal (`setSelectedProduct(null)`) and subsequently opening the same or another jacket, `liveSelectedProduct` accurately reflects the most up-to-date values from the store.

4. **Presale / Custom Name Invariant**:
   - If a jacket supports custom name printing or presale flags, updating `allowCustomName` or `customNamePrice` in store dynamically updates the preview in the open modal.

---

## 7. Verification Method

1. **TypeScript Typecheck**:
   ```bash
   npx tsc --noEmit
   ```
   Must compile with 0 errors.

2. **Vite Production Build**:
   ```bash
   npm run build
   ```
   Must succeed with 0 warnings or errors.

3. **Runtime Reactivity Check**:
   - Navigate to `/collection/racing-jackets`.
   - Click any jacket (e.g. "Scuderia Marlboro 90s Vintage Racing Jacket").
   - Confirm modal opens with live store pricing and stock.
   - Confirm closing and opening another item functions as expected.
