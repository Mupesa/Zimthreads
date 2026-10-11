# Handoff Report: Jackets Collection Page Modal Reactivity Strategy

**Agent**: Explorer 3 (`m2_explorer_iter2_3`)  
**Role**: Teamwork Explorer (Investigation & Strategy)  
**Date**: 2026-10-10  
**Target Milestone**: Milestone 2 Iteration 2  
**Handoff Type**: Hard (Task Complete)  

---

## 1. Observation

1. **`src/pages/JacketsCollectionPage.tsx` lines 8–10**:
   ```tsx
   export default function JacketsCollectionPage() {
     const { products } = useStore()
     const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
     const [expandedDescIds, setExpandedDescIds] = useState<Record<string, boolean>>({})
   ```
   Component state holds `selectedProduct` as a static `Product | null` snapshot initialized on card click.

2. **`src/pages/JacketsCollectionPage.tsx` lines 261–264**:
   ```tsx
         {/* Close-Up Product Modal (Shows Full Description, Sizes, and Add to Bag) */}
         <ProductModal
           product={selectedProduct}
           onClose={() => setSelectedProduct(null)}
         />
   ```
   The modal is supplied directly with `product={selectedProduct}` rather than a live-derived product reference.

3. **`src/pages/Shop.tsx` lines 21–26 and line 363**:
   ```tsx
     const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

     const liveSelectedProduct = useMemo(() => {
       if (!selectedProduct) return null
       return products.find((p) => p.id === selectedProduct.id) || selectedProduct
     }, [products, selectedProduct])
   ```
   ```tsx
         {/* Quick View Modal */}
         <ProductModal
           product={liveSelectedProduct}
           onClose={() => setSelectedProduct(null)}
         />
   ```
   `Shop.tsx` dynamically dereferences `liveSelectedProduct` from `products` from `useStore()` whenever `products` or `selectedProduct` changes.

4. **`src/components/ProductModal.tsx` lines 21–27 & line 49**:
   ```tsx
     // Reset active image index, size and custom options when product changes
     useEffect(() => {
       setActiveImageIdx(0)
       setSelectedSize("")
       setQuantity(1)
       setIsCustomizing(false)
       setCustomName("")
     }, [product?.id])
   ```
   ```tsx
     const unitPrice = product.price + (isCustomActive ? customPrice : 0)
   ```
   Inside `ProductModal`, the reset effect depends solely on `[product?.id]`. When price, stock, or badges change, the user's active selections (size, custom name, image index) remain intact while prices and stock limitations immediately update.

5. **`src/store/StoreContext.tsx` lines 437–458**:
   ```tsx
       const extraPrice = formattedCustomName ? product.customNamePrice || 50 : 0
       const finalPrice = product.price + extraPrice
       // ...
       setCart((prev) => [
         // ...
         price: finalPrice,
       ])
   ```
   When `addToCart` is called from the modal, the item is inserted with `product.price`. If `ProductModal` holds a stale product snapshot, the cart is credited with stale pricing.

---

## 2. Logic Chain

1. **Observation 1 & 2** demonstrate that in `JacketsCollectionPage.tsx`, clicking an item snapshot captures `selectedProduct` in local state, and passes it directly to `<ProductModal>`.
2. **Observation 5** demonstrates that adding a jacket to cart directly uses `product.price` from whatever `Product` reference is passed to `ProductModal`.
3. If an administrator modifies jacket price or stock in Neon PostgreSQL (e.g. via batch pricing or admin desk) while a user has `/collection/racing-jackets` open, `useStore().products` updates dynamically.
4. While the catalog grid and header badges on `JacketsCollectionPage.tsx` re-render reactively from `jacketProducts`, the open modal does not update because it references the stale snapshot in `selectedProduct` (**Observation 2**).
5. As observed in **Observation 3**, `Shop.tsx` avoids this issue by memoizing `liveSelectedProduct` against `products` using `products.find((p) => p.id === selectedProduct.id) || selectedProduct`.
6. Furthermore, **Observation 4** verifies that `ProductModal` safely handles updates to `product`: because its input reset effect keys only on `product?.id`, updating price or stock updates displayed pricing and button states without resetting user-selected sizes, custom names, or gallery positions.
7. Therefore, applying the exact `liveSelectedProduct` pattern from `Shop.tsx` to `JacketsCollectionPage.tsx` will restore complete reactivity, guarantee parity across the application, and eliminate stale price/stock anomalies.

---

## 3. Caveats

- **Product Deletion during Open Modal**: If a product is completely deleted from the database while the modal is open, `products.find(...)` returns `undefined`, falling back to `selectedProduct`. The user will still see the product they opened until they close the modal. If desired, this could be changed to close the modal upon deletion, but the current `|| selectedProduct` fallback matches `Shop.tsx` and prevents abrupt crashes.
- **Hidden Products**: If an admin toggles `p.hidden = true` while a customer is viewing that jacket in the modal, `products.find(...)` still finds it in `products` (since `products` includes hidden items; only `jacketProducts` filters them out). This is desirable so the modal does not crash mid-viewing.
- No other components or pages host a `ProductModal`; the pattern is fully scoped to `Shop.tsx` (already compliant) and `JacketsCollectionPage.tsx` (the subject of this strategy).

---

## 4. Conclusion

`src/pages/JacketsCollectionPage.tsx` must be updated to dynamically derive `liveSelectedProduct` via `useMemo` matching `Shop.tsx`:
1. Add `liveSelectedProduct` definition in `JacketsCollectionPage.tsx`:
   ```tsx
   const liveSelectedProduct = useMemo(() => {
     if (!selectedProduct) return null
     return products.find((p) => p.id === selectedProduct.id) || selectedProduct
   }, [products, selectedProduct])
   ```
2. Update `<ProductModal product={liveSelectedProduct} onClose={() => setSelectedProduct(null)} />`.

Full implementation specifications and unified diff patch are documented in:
`c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_3\strategy.md`.

---

## 5. Verification Method

To independently verify the strategy and implementation:

1. **Static Analysis & Type Checking**:
   ```powershell
   npx tsc --noEmit
   ```
   *Expected Result*: Compiles cleanly with zero errors.

2. **Production Build Compilation**:
   ```powershell
   npm run build
   ```
   *Expected Result*: Vite production bundle builds cleanly.

3. **Manual / Automated Reactivity Inspection**:
   - Inspect `src/pages/JacketsCollectionPage.tsx` line 262 to verify that `ProductModal` receives `product={liveSelectedProduct}`.
   - Trigger a price update in `useStore().products` while viewing a jacket modal on `/collection/racing-jackets`.
   - Confirm that the displayed price in the modal updates immediately to the new price, and `addToCart` commits the updated price.
