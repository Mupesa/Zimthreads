# Execution Plan — Orchestrator 2

## Context & Objectives
Resume and complete the integration of the Zimthreads admin dashboard (`/admin`) and customer-facing flows with the production Neon PostgreSQL database (`rapid-hill-42448439` under `anesumupesa@gmail.com`).

## Milestone Plan

### Milestone 2: Customer-Facing Integration (Iteration 2 Remediation)
- **Goal**: Resolve Reviewer 2's `REQUEST_CHANGES` verdict regarding async persistence, error banners, and catalog reactivity.
- **Worker Tasks**:
  - `StoreContext.tsx`: `persistPublicRecord`, `addBooking`, `createOrder`, `addInquiry` must return `Promise<T>`, throw on HTTP/network errors, await persistence before state commit.
  - `Booking.tsx`: Async `handleConfirmBooking` with try/catch, red error banner on failure, maintain Step 3 state with retry capability, genuine loading indicator.
  - `CartDrawer.tsx`: Async `handleCheckoutSubmit` with try/catch, red error banner, maintain cart state on error.
  - `Contact.tsx`: Async `handleSubmit` with try/catch, red error banner, retain user input on error.
  - `JacketsCollectionPage.tsx`: Memoize `liveSelectedProduct` for quick-view modal.
- **Verification**: Reviewers (2) + Challengers (2) + Forensic Auditor (1) -> Gate.

### Milestone 3: Admin Dashboard Wire-up (All Desks, Batch Operations, Full CRUD)
- **Goal**: Wire all desks in `src/pages/admin/Dashboard.tsx` to Neon DB via `api/store.ts`:
  1. Bookings Desk (status changes, deletions)
  2. Orders Desk (fulfillment & payment status updates, deletions)
  3. Inquiries Desk (read/unread toggling, replies, deletions)
  4. Products Desk & Batch Pricing Desk (14 Archival Racing Jackets pricing/stock updates)
  5. Services Desk (create, edit, delete, active toggle)
  6. Blog Posts Desk (create, edit, status toggle, delete)
  7. Store Settings Desk (hero banner, delivery thresholds, configuration)
  8. Analytics Desk (dynamic computation from live DB data)
  9. Full page reload hydration (all desks load fresh state from Neon DB)
- **Workflow**: Explorers (3) -> Worker -> Reviewers (2) + Challengers (2) + Forensic Auditor (1) -> Gate.

### Milestone 4: Automated E2E Verification Suite Execution
- **Goal**: Build and run an automated verification script executing live Neon DB CRUD operations for all 6 entity types (`bookings`, `orders`, `products`, `services`, `blog_posts`, `inquiries`) against `rapid-hill-42448439`.
- **Workflow**: Worker / Test Writer -> Reviewers (2) + Challengers (2) + Forensic Auditor (1) -> Gate.

### Milestone 5: Production Build & Final Acceptance
- **Goal**: Full TypeScript typecheck (`npx tsc --noEmit`) and Vite build (`npm run build`) verification with zero errors. Final forensic audit check.
- **Output**: Victory report to user and parent.
