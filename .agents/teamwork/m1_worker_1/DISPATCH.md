# DISPATCH: Milestone 1 Worker - Database & API Implementation

## Objective
Implement Milestone 1 requirements:
1. Update `api/store.ts`:
   - Support `GET /api/store?key=<key>` and `GET /api/store?key=all`.
   - Support `POST /api/store` with `action: "public_create"`: Allows unauthenticated customer submissions for `entity: "bookings" | "orders" | "inquiries"`. Atomically prepends record using `jsonb_build_array($2::jsonb) || COALESCE(zimthreads_store.data, '[]'::jsonb)`.
   - Support `POST /api/store` with authenticated admin actions (`action: "sync"`, `action: "batch_update_products"`, `action: "update_entity"`, `action: "delete_entity"`): strictly requires `adminToken === "Zimthreads200"`.
   - Uses Neon Serverless HTTP API (`https://<host>/sql` with `Neon-Connection-String`) targeting project `rapid-hill-42448439` under `anesumupesa@gmail.com`.
   - On startup or initial query, ensure idempotent initialization: seeds missing keys (`bookings`, `orders`, `inquiries`) as empty arrays `[]` with `ON CONFLICT (key) DO NOTHING`.
2. Update `vite.config.ts`:
   - Add dev server middleware plugin (`viteDevStoreApiPlugin` or `configureServer`) to intercept `/api/store` in local Vite development (`npm run dev`), parse JSON request bodies, and route through the API logic so `/api/store` works identically in dev.
3. Fix `src/lib/cloudinary.ts`:
   - Fix syntax on line 90 (`options: { folder?: string; tags?: string[] } = {}`).
   - Fix `CloudinaryUploadResult` to include `cdnUrl?: string` if needed by `ImageUploader.tsx`.
4. Run build and verification commands:
   - Run `npm run build` (or `npx tsc --noEmit`) to verify zero TypeScript errors.
   - Run a test request against `/api/store` or Neon DB to verify that the table has all 7 keys initialized and `public_create` persists records.

## Exclusive File Ownership
- `api/store.ts`
- `vite.config.ts`
- `src/lib/cloudinary.ts`

## Input Specifications & Reports to Read
- `c:\Dev\Active Projects\Zimthreads\PROJECT.md`
- `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\ORIGINAL_REQUEST.md`
- `c:\Dev\Active Projects\Zimthreads\AGENTS.md`
- `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m1_spec_miner_1\api_spec.md`
- `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m1_explorer_1\db_strategy.md`
- `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m1_explorer_2\vite_build_spec.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Output
Write your handoff report to `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m1_worker_1\handoff.md` with build and test results.
Report completion via send_message.
