# DISPATCH: Milestone 4 & 5 Worker — Automated E2E Verification & Production Build Validation

## Role
Worker (`teamwork_preview_worker`)

## Working Directory
`c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m4_worker_1`

## Inputs
- `ORIGINAL_REQUEST.md`: `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\ORIGINAL_REQUEST.md`
- `PROJECT.md`: `c:\Dev\Active Projects\Zimthreads\PROJECT.md`
- `AGENTS.md`: `c:\Dev\Active Projects\Zimthreads\AGENTS.md` (Strict Neon DB `rapid-hill-42448439`, `anesumupesa@gmail.com` / `Mupesa`)
- Live database endpoint: `ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech`

## Exclusive File Ownership
- `scripts/verify-all-entities-e2e.mjs`
- `package.json`

## Objectives

### 1. Build Comprehensive Automated E2E Verification Script (`scripts/verify-all-entities-e2e.mjs`):
Write a standalone, robust Node.js verification script that directly exercises live Neon PostgreSQL database `rapid-hill-42448439` (via the HTTP SQL endpoint `/sql`) and `/api/store` for all 6 core entity types:
1. **Bookings**:
   - Create booking record (public creation)
   - Read & verify presence in database
   - Update booking status (admin update to "completed")
   - Delete booking record & verify deletion permanence
2. **Orders**:
   - Create order record with multiple items, customer shipping details, paymentStatus ("Paid"), and total
   - Read & verify presence with deep field fidelity
   - Update order fulfillment status (admin update to "Delivered") and payment status
   - Delete order record & verify deletion permanence
3. **Products**:
   - Create test product (with name, price, category, stock)
   - Read & verify presence
   - Batch update test product / 14 Archival Racing Jackets prices and verify immediate persistence
   - Delete test product & verify clean removal
4. **Services**:
   - Create test service package (name, price, turnaround, features)
   - Read & verify presence
   - Toggle active status and update price
   - Delete test service & verify clean removal
5. **Blog Posts**:
   - Create test blog post (title, excerpt, content, status: "draft")
   - Read & verify presence
   - Update status to "published" and edit title
   - Delete test blog post & verify clean removal
6. **Inquiries**:
   - Create test customer inquiry (name, email, subject, message)
   - Read & verify presence
   - Toggle read status and log admin response (`response`, `respondedAt`)
   - Delete test inquiry & verify clean removal
7. **Store Settings** (7th bonus entity):
   - Update announcement banner and hero drop banner, verify persistence, and restore baseline.

The script must:
- Clean up all test records so the database is left in a clean baseline state.
- Print clear test steps with timing and status indicators.
- Exit with code 0 on 100% success, or exit with code 1 on any assertion failure.

### 2. Wire Test Script into `package.json`:
Add `"test:verify": "node scripts/verify-all-entities-e2e.mjs"` to `package.json` scripts.

### 3. Production Build Validation:
- Run `npx tsc --noEmit` and confirm 0 TypeScript errors.
- Run `npm run build` and confirm 0 Vite/build errors.
- Run `node scripts/verify-all-entities-e2e.mjs` and confirm 100% pass against live Neon DB.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Output
Write comprehensive handoff report to:
`c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m4_worker_1\handoff.md`
Report completion via send_message.


## 2026-10-10T23:02:10Z
Assigned to Milestone 4 & 5 Worker:
Exclusive files: scripts/verify-all-entities-e2e.mjs, package.json
1. Build scripts/verify-all-entities-e2e.mjs
2. Add "test:verify" script to package.json
3. Run npx tsc --noEmit, npm run build, node scripts/verify-all-entities-e2e.mjs
4. Handoff report and send_message.
