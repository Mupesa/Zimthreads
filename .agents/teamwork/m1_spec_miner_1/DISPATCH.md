# DISPATCH: Spec Miner - Milestone 1 API Specifications

## Task Objective
Extract and document exact API request/response specifications and authorization rules for `api/store.ts`:
1. `GET /api/store?key=<key>`: Returns single entity or all entities (`key=all`).
2. `POST /api/store` with `action: "public_create"`:
   - Must allow public creation of bookings, orders, and inquiries without requiring `adminToken`.
   - Validate payload format for bookings (`customer`, `email`, `phone`, `serviceId`, etc.), orders (`items`, `customer`, `total`, `status`), inquiries (`name`, `email`, `message`, `subject`).
   - Appends to existing jsonb array in Neon DB table `zimthreads_store`.
3. `POST /api/store` with admin actions (`action: "sync"`, `action: "batch_update_products"`, `action: "update_entity"`, `action: "delete_entity"`):
   - Strictly enforces `adminToken === "Zimthreads200"`.
   - Returns 401 Unauthorized if invalid or missing.
4. Error responses and HTTP status codes (400, 401, 500).

## Input Files
- `c:\Dev\Active Projects\Zimthreads\PROJECT.md`
- `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\ORIGINAL_REQUEST.md`
- `c:\Dev\Active Projects\Zimthreads\AGENTS.md`
- `c:\Dev\Active Projects\Zimthreads\api\store.ts`

## Output
Write your specification to `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m1_spec_miner_1\api_spec.md` and handoff report to `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m1_spec_miner_1\handoff.md`.


## 2026-10-10T18:19:26Z
You are the API Spec Miner for Milestone 1.
Your working directory is c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m1_spec_miner_1.
Read your instructions in:
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m1_spec_miner_1\DISPATCH.md
- c:\Dev\Active Projects\Zimthreads\PROJECT.md
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\ORIGINAL_REQUEST.md
- c:\Dev\Active Projects\Zimthreads\AGENTS.md

Document the complete API specification for api/store.ts, especially public_create for bookings, orders, and inquiries, and authenticated admin actions.
Write your specification to c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m1_spec_miner_1\api_spec.md and handoff report to c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m1_spec_miner_1\handoff.md.
Report completion via send_message.
