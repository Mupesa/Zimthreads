# DISPATCH: Milestone 3 Worker — Admin Dashboard Full CRUD Persistence

## Role
Worker (`teamwork_preview_worker`)

## Working Directory
`c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m3_worker_1`

## Inputs
- `ORIGINAL_REQUEST.md`: `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\ORIGINAL_REQUEST.md`
- `PROJECT.md`: `c:\Dev\Active Projects\Zimthreads\PROJECT.md`
- `AGENTS.md`: `c:\Dev\Active Projects\Zimthreads\AGENTS.md` (Strict Neon DB `rapid-hill-42448439`, `anesumupesa@gmail.com` / `Mupesa`)
- Explorer 1 Report: `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m3_explorer_1\handoff.md`
- Explorer 2 Report: `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m3_explorer_2\handoff.md`
- Explorer 3 Report: `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m3_explorer_3\handoff.md`

## Exclusive File Ownership
- `src/pages/admin/Dashboard.tsx`
- `src/store/StoreContext.tsx`
- `src/pages/Blog.tsx`
- `src/components/Navbar.tsx`

## Core Implementation Tasks

### 1. Bookings Desk & Walk-In Modal (`Dashboard.tsx`, `StoreContext.tsx`):
- Make `handleCreateBooking` `async`, await `addBooking(newBooking)`, handle errors with error message, loading state (`isCreatingBooking`), and keep modal open on failure.
- Ensure status changes (`confirmed`, `completed`, `cancelled`) and deletions persist immediately to Neon DB.
- Prevent StrictMode double-sync: trigger cloud sync outside of state updater functions.

### 2. Orders Desk (`Dashboard.tsx`, `StoreContext.tsx`):
- Add `paymentStatus: "Paid" | "Pending" | "Refunded"` to `Order` type in `StoreContext.tsx`.
- Add payment status updater `updateOrderPaymentStatus(orderId, paymentStatus)` in `StoreContext.tsx` and wire in `Dashboard.tsx`.
- In Orders table and Order Details modal: add dropdown/buttons to update both fulfillment status (`Processing`, `Shipped`, `Delivered`, `Cancelled`) and `paymentStatus`.
- Fix currency symbols: replace any `$` with `Rs` for all orders and price displays.

### 3. Inquiries Desk (`Dashboard.tsx`, `StoreContext.tsx`):
- Wire read/unread status toggle and deletion to persist to Neon DB.
- Implement Inquiry Details & Response modal (`viewInquiry` / `replyInquiry`):
  - View full inquiry message, customer phone, date.
  - Allow admin to log a response text and click "Mark as Responded" (persisting `response` and `respondedAt` to Neon DB).
  - Include quick `mailto:` link to reply to the customer's email.

### 4. Products Desk & Batch Pricing Desk (`Dashboard.tsx`, `StoreContext.tsx`):
- Product CRUD: ensure Add Product, Edit Product, and Delete Product persist to Neon DB.
- Batch Pricing Desk: verify 14 Archival Racing Jackets batch price & stock edits save to Neon DB immediately via `updateProductsBatch` and reflect on `/shop` and `/collection/racing-jackets`.
- Fix product resurrection bug: `StoreContext.tsx` must not resurrect deleted products from `initialProducts` upon hard refresh.
- Debounce or onBlur the inline stock inputs in the Products table to avoid unneeded API spam.

### 5. Services Desk & Missing Modal Fix (`Dashboard.tsx`):
- **CRITICAL FIX**: Render the missing **Edit Service Modal** `{editService && (...) }` in `Dashboard.tsx` JSX so clicking "Edit" opens a modal to edit service name, category, price, turnaround time, description, and features.
- Wire service active toggle, service creation, editing, and deletion to persist to Neon DB.

### 6. Blog Posts Desk & Missing Modal Fix (`Dashboard.tsx`, `Blog.tsx`):
- **CRITICAL FIX**: Render the missing **Edit Blog Post Modal** `{editBlog && (...) }` in `Dashboard.tsx` JSX so clicking "Edit" opens a modal to edit post title, excerpt, content, category, cover image, and read time.
- Add `status: "published" | "draft"` support in `BlogPost` and render status badge + toggle button ("Publish" / "Unpublish") in the Blog Posts table.
- In `src/pages/Blog.tsx`: ensure public view only displays `"published"` blog posts.

### 7. Store Settings Desk & Storefront Integration (`Dashboard.tsx`, `Navbar.tsx`, `StoreContext.tsx`):
- Add `announcementText` to `StoreSettings` in `StoreContext.tsx`.
- In Store Settings Desk: add field for `announcementText` alongside hero drop banner and delivery thresholds, and save all to Neon DB under `'settings'`.
- In `src/components/Navbar.tsx`: render `settings.announcementText` in the top announcement bar dynamically.

### 8. Analytics Desk & Full Page Reload Hydration:
- Analytics metrics: derive dynamically from live state. Include Inquiries count KPI card.
- Fix booking revenue calculation to use actual service price (or default `Rs 300`, not `$15`).
- Unified currency: ensure all revenue, order values, and averages display in `Rs`.
- Full Page Reload Hydration:
  - Add a manual "Refresh from Cloud" / "Sync Now" button in the Dashboard header with spinning refresh icon and last synced timestamp.
  - Handle loading/hydration state so tables and metrics don't flash empty defaults on fresh reload.

### 9. Build & Live Database Verification:
- Run `npx tsc --noEmit` and `npm run build` — both must compile with zero errors.
- Run live persistence tests against Neon DB `rapid-hill-42448439` confirming full CRUD persistence for all desks.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Output
Write comprehensive handoff report to:
`c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m3_worker_1\handoff.md`
Report completion via send_message.

## 2026-10-10T22:21:29Z
You are the Milestone 3 Implementation Worker.
Your working directory is:
c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m3_worker_1

Read instructions in:
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m3_worker_1\DISPATCH.md
- c:\Dev\Active Projects\Zimthreads\PROJECT.md
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\ORIGINAL_REQUEST.md
- c:\Dev\Active Projects\Zimthreads\AGENTS.md
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m3_explorer_1\handoff.md
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m3_explorer_2\handoff.md
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m3_explorer_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive files to modify:
- src/pages/admin/Dashboard.tsx
- src/store/StoreContext.tsx
- src/pages/Blog.tsx
- src/components/Navbar.tsx

Core tasks:
1. Bookings Desk: Async walk-in booking creation with loading latch & error handling. Status updates and deletions persist to Neon DB.
2. Orders Desk: Add paymentStatus ("Paid" | "Pending" | "Refunded") to Order type and updateOrderPaymentStatus in StoreContext; wire status dropdowns/modals in Dashboard; unify currency to Rs.
3. Inquiries Desk: Read/unread and deletion persist. Implement Inquiry Details & Response modal (logging response & respondedAt).
4. Products Desk & Batch Pricing: Full product CRUD; 14 Archival Racing Jackets batch pricing & stock updates persist immediately; fix deleted product resurrection bug; debounce inline stock edits.
5. Services Desk: Render the MISSING Edit Service Modal in JSX; wire service active toggle, creation, edit, deletion to persist.
6. Blog Posts Desk: Render the MISSING Edit Blog Post Modal in JSX; add status ("published" | "draft") with toggle; filter published posts in Blog.tsx.
7. Store Settings Desk: Add announcementText to StoreSettings, settings form, and top AnnouncementBar in Navbar.tsx.
8. Analytics Desk & Hydration: Add Inquiries KPI card, calculate booking revenue with Rs 300 fallback, unify Rs currency, add manual "Refresh from Cloud" button, and prevent flashing empty tables on hard reload.
9. Verification: npx tsc --noEmit and npm run build must compile with 0 errors. Test live Neon DB persistence.

Write your handoff report to:
c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m3_worker_1\handoff.md
Send completion message via send_message.

