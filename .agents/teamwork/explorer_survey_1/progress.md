# Progress Heartbeat - Explorer 1 (Database & Backend Architecture)

- **Status**: Investigation completed; drafting reports
- **Last visited**: 2026-10-10T18:17:00Z
- **Current task**: Compiling survey_db_api.md and handoff.md.
- **Key discoveries**:
  - Live Neon database actively verified (`rapid-hill-42448439` via endpoint `ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech`).
  - Table `public.zimthreads_store` (`key text primary key, data jsonb, updated_at timestamptz`) holds `products` (16 items, all 14 jackets included), `services` (7 items), `blog_posts` (5 items), `settings` (1 object).
  - `bookings`, `orders`, `inquiries` are completely missing from Neon database and unwired in `StoreContext.tsx`.
  - `api/store.ts` blocks all non-admin POSTs (`adminToken !== "Zimthreads200"`), preventing public customer submissions from `/booking`, `/contact`, and checkout.
  - `vite.config.ts` currently lacks an `/api/*` connect middleware for dev server.
  - `npx tsc --noEmit` revealed syntax error at `src/lib/cloudinary.ts:90:30`.
