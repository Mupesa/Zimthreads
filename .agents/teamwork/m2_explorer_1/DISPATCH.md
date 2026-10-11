# DISPATCH: Milestone 2 Explorer 1 - StoreContext Persistence & Hydration

## Objective
Analyze `src/store/StoreContext.tsx` for Milestone 2:
1. `fetchCloudData()`:
   - Must request `GET /api/store?key=all` (or individual keys) and hydrate all entities: `bookings`, `orders`, `inquiries`, `products`, `services`, `blog_posts`, `settings`.
   - Ensure initial state has safe array fallbacks so UI components never crash on empty arrays.
2. Customer submission mutations:
   - Refactor `addBooking`, `createOrder`, and `addInquiry` to send `POST /api/store` with `action: "public_create"` for their respective entities (`bookings`, `orders`, `inquiries`).
   - Ensure optimistic local state update + persistent backend write to Neon DB.
3. Administrative actions:
   - Ensure `syncToCloud` or dedicated entity update functions also cover `bookings`, `orders`, and `inquiries`.

## Authoritative Inputs
- `c:\Dev\Active Projects\Zimthreads\PROJECT.md`
- `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\ORIGINAL_REQUEST.md`
- `c:\Dev\Active Projects\Zimthreads\AGENTS.md`
- `src/store/StoreContext.tsx`
- `api/store.ts`

## Output
Write findings and code blueprints to `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_1\store_context_spec.md` and handoff report to `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_1\handoff.md`.
Report completion via send_message.


## 2026-10-10T18:39:40Z
You are Explorer 1 for Milestone 2 (StoreContext Persistence & Hydration).
Your working directory is c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_1.
Read your instructions in:
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_1\DISPATCH.md
- c:\Dev\Active Projects\Zimthreads\PROJECT.md
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\ORIGINAL_REQUEST.md
- c:\Dev\Active Projects\Zimthreads\AGENTS.md
- src/store/StoreContext.tsx
- api/store.ts

Analyze StoreContext.tsx to specify full cloud hydration for all 7 entities on mount/refresh, and async persistence for addBooking, createOrder, and addInquiry via /api/store public_create.
Write your report to c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_1\store_context_spec.md and handoff report to c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_1\handoff.md.
Report completion via send_message.
