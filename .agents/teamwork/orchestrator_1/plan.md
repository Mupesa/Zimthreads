# Master Orchestration Plan: Zimthreads Neon DB & Admin Dashboard Persistence

## Objectives
Connect the Zimthreads admin dashboard (`/admin`) and customer-facing flows completely to the production Neon PostgreSQL database (`rapid-hill-42448439` under `anesumupesa@gmail.com`).
Support persistent CRUD operations across all dashboard tabs:
- Bookings
- Orders
- Products (including 14 Archival Racing Jackets & batch pricing)
- Services
- Blog Posts
- Customer Inquiries
- Store Settings / Analytics

## Strict Constraints & Security
1. All tools, accounts, and credentials must strictly belong to `anesumupesa@gmail.com` / `Mupesa`.
2. Target Neon Project: `rapid-hill-42448439`.
3. Commit authorship: `user.name = "Mupesa"`, `user.email = "anesumupesa@gmail.com"`.
4. Dispatch-only orchestrator: delegate all technical investigation, implementation, and testing to specialized subagents.

## Phases
- **Phase 0: Scope Survey** (3 Parallel Explorers)
  - Explorer 1: Neon DB configuration, credentials (.env / Neon client), schema / migration state, existing API/backend setup.
  - Explorer 2: Frontend customer-facing flows (`/booking`, `/shop`, `/contact`, cart/checkout, `/collection/racing-jackets`).
  - Explorer 3: Admin dashboard (`src/pages/admin/Dashboard.tsx`), state management, desk components, batch price/stock desk.
- **Phase 1: Project & Test Specification**
  - Synthesize Explorer findings into `PROJECT.md` (architecture, feature inventory, milestone boundaries, contracts).
  - Define `TEST_INFRA.md` for dual-track E2E verification.
- **Phase 2: Milestone Execution & Verification**
  - M1: Neon Database Schema & Storage/API Layer
  - M2: Customer-Facing Flows Integration
  - M3: Admin Dashboard Wire-up & Full CRUD Persistence
  - M4: E2E Automated Verification Test Suite (live database read/write checks across all 6 entities)
  - M5: Production Build & Final Hardening
- **Phase 3: Final Acceptance & Victory Report**
