# BRIEFING — 2026-10-10T18:16:15Z

## Mission
Investigate src/pages/admin/Dashboard.tsx and all admin desk components, tables, actions, and tabs to determine current state storage and exact updates needed for persistent CRUD and full reload sync with Neon PostgreSQL DB.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigator, synthesist
- Working directory: c:\Dev\Active Projects\Zimthreads\.agents\teamwork\explorer_survey_3
- Original parent: 5a6ffff8-d538-45d1-a6a8-df47b01baa37
- Milestone: Explorer Phase - Admin Dashboard Survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify source code
- Strictly respect AGENTS.md rules (Neon project rapid-hill-42448439, anesumupesa@gmail.com, Mupesa)
- Files for content delivery (survey_admin_dashboard.md, handoff.md), send_message for coordination

## Current Parent
- Conversation ID: 5a6ffff8-d538-45d1-a6a8-df47b01baa37
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `src/pages/admin/Dashboard.tsx` (all 3,427 lines, sections, handlers, and 6 modal dialogs)
  - `src/store/StoreContext.tsx` (state initialization, localStorage hooks, syncToCloud, fetchCloudData)
  - `src/store/seedData.ts` (data interfaces, initial seeds, 14 racing jackets)
  - `api/store.ts` (current serverless endpoint, auth check, SQL queries)
  - `scripts/sync-jackets-to-neon.cjs`, `scripts/sync-blog-to-neon.cjs` (Neon database schema and connection verification)
  - `vite.config.ts`, `vercel.json`, `src/App.tsx`, `src/router.tsx`
- **Key findings**:
  - All admin desks (Bookings, Orders, Services, Products & Batch Pricing, Blog, Inquiries, Settings, Customers, Media) are built inside `src/pages/admin/Dashboard.tsx` and consume `useStore()`.
  - State storage is hybrid: in-memory React state + `localStorage` mirrors (`zimthread_*_v7`).
  - Critical sync gap: `bookings`, `orders`, and `inquiries` have ZERO cloud synchronization in `StoreContext.tsx` (neither on mutations nor on initial mount fetch).
  - Current cloud sync for `products`, `services`, `blog_posts`, and `settings` writes monolithic arrays/objects to `public.zimthreads_store (key, data, updated_at)`.
  - `api/store.ts` blocks customer submissions because all POST requests require `adminToken === "Zimthreads200"`.
  - Vite dev server lacks `/api/store` middleware, causing local dev to 404 when syncing to cloud unless handled.
- **Unexplored areas**: None within the admin dashboard domain. All desks and call sites mapped.

## Key Decisions Made
- Document full findings in `survey_admin_dashboard.md` with concrete line numbers and exact remediation proposals.
- Author 5-component `handoff.md`.

## Artifact Index
- survey_admin_dashboard.md — Complete findings report
- handoff.md — 5-component handoff report
- progress.md — Liveness heartbeat
