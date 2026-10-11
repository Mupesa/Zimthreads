# E2E Test Infra: Zimthreads Neon DB & Dashboard Persistence

## Test Philosophy
- Opaque-box, requirement-driven verification against live Neon PostgreSQL (Project `rapid-hill-42448439`).
- Automated execution verifying read/write persistence for all application entities without mock fallbacks.

## Feature Inventory Coverage
| # | Feature / Entity | Source | Tier 1 (CRUD) | Tier 2 (Boundary) | Tier 3 (Cross-Flow) | Tier 4 (E2E Scenario) |
|---|------------------|--------|:-------------:|:-----------------:|:-------------------:|:---------------------:|
| 1 | Bookings | R1, R2, AC | 5 checks | 5 checks | ✓ | ✓ |
| 2 | Orders | R1, R2, AC | 5 checks | 5 checks | ✓ | ✓ |
| 3 | Products & Racing Jackets | R1, R2, AC | 5 checks | 5 checks | ✓ | ✓ |
| 4 | Services | R1, R2, AC | 5 checks | 5 checks | ✓ | ✓ |
| 5 | Blog Posts | R1, R2, AC | 5 checks | 5 checks | ✓ | ✓ |
| 6 | Inquiries | R1, R2, AC | 5 checks | 5 checks | ✓ | ✓ |
| 7 | Store Settings | R1, R2, AC | 3 checks | 3 checks | ✓ | ✓ |

## Test Architecture
- **Automated Verification Script**: `scripts/verify-persistence.mjs` (or `.ts`)
- **Execution Command**: `node scripts/verify-persistence.mjs`
- **Pass/Fail Semantics**:
  - Connects to Neon PostgreSQL `rapid-hill-42448439` using serverless HTTP endpoint.
  - Executes Live Create, Read, Update, Delete for:
    1. Booking: Public create -> Read -> Admin status transition -> Verify persistence.
    2. Order: Public checkout order with line items -> Read -> Admin status transition -> Verify persistence.
    3. Inquiry: Public contact submission -> Read -> Admin toggle read -> Verify persistence.
    4. Products: Batch update prices and stock for racing jackets -> Verify new prices in store payload.
    5. Services: Create custom package -> Update active flag -> Delete -> Verify persistence.
    6. Blog Posts: Create draft -> Publish -> Delete -> Verify persistence.
    7. Settings: Update delivery threshold/banner -> Verify persistence.
  - Returns exit code 0 only if all assertions pass.
- **Build Verification**:
  - Command: `npm run build`
  - Returns exit code 0 with zero TypeScript or Vite errors.
