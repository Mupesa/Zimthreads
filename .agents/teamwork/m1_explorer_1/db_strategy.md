# Neon Database Execution Strategy & Schema Specification

**Target Database**: Neon PostgreSQL (Project ID: `rapid-hill-42448439`, "Zimthreads Collective")  
**Owner / Account**: `anesumupesa@gmail.com` / `Mupesa`  
**Host**: `ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech`  
**Storage Table**: `public.zimthreads_store`  
**Author**: Explorer 1 (Milestone 1)  
**Date**: 2026-10-10  

---

## 1. Executive Summary

A forensic audit of the live Neon database (`rapid-hill-42448439`) reveals that `public.zimthreads_store` already exists with the expected schema (`key text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz`). It currently stores 4 active entities (`products`, `services`, `blog_posts`, `settings`), while 3 customer-facing transactional entities (**`bookings`**, **`orders`**, and **`inquiries`**) are **not yet initialized**.

This document outlines the complete SQL execution strategy for:
1. **Zero-downtime, non-destructive database initialization** ensuring all 7 keys exist.
2. **Serverless HTTP execution architecture** via Neon's `/sql` endpoint.
3. **Atomic prepend queries for unauthenticated customer creation (`public_create`)**, eliminating read-modify-write concurrency race conditions.
4. **Fine-grained administrative mutations** for in-place JSON element updates and deletions.

---

## 2. Neon Connection & Architecture Specifications

### 2.1 Connection Parameters
- **Neon Project ID**: `rapid-hill-42448439`
- **Database Engine**: PostgreSQL 18.6
- **Database Name**: `neondb`
- **Host**: `ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech`
- **HTTP SQL URL**: `https://ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech/sql`
- **Connection String**: `postgresql://neondb_owner:npg_DR0tIYcQyeX8@ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require`

### 2.2 HTTP SQL Protocol
All queries run via serverless HTTP POST requests to `https://${NEON_HOST}/sql`:
- **Header**: `Neon-Connection-String: <NEON_CONNECTION_STRING>`
- **Header**: `Content-Type: application/json`
- **Payload Format**:
  ```json
  {
    "query": "SELECT key, data FROM public.zimthreads_store WHERE key = $1;",
    "params": ["products"]
  }
  ```
- **Response Format**:
  ```json
  {
    "fields": [
      { "name": "key", "dataTypeID": 25 },
      { "name": "data", "dataTypeID": 3802 },
      { "name": "updated_at", "dataTypeID": 1184 }
    ],
    "rows": [ ... ],
    "rowCount": 1,
    "command": "SELECT"
  }
  ```

---

## 3. Forensic Inspection of Live Database State

Inspection performed on live Neon DB `rapid-hill-42448439` at `2026-10-10 18:21 UTC`:

### 3.1 Table Schema (`information_schema.columns`)
| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|---------|
| `key` | `text` | `NO` | *None* (Primary Key) |
| `data` | `jsonb` | `NO` | *None* |
| `updated_at` | `timestamp with time zone` | `YES` | `now()` |

### 3.2 Constraints (`pg_constraint`)
- `zimthreads_store_pkey`: `PRIMARY KEY (key)`
- `zimthreads_store_key_not_null`: `NOT NULL key`
- `zimthreads_store_data_not_null`: `NOT NULL data`

### 3.3 Key Inventory & Counts
| Key | Type | Item Count / Size | Status in Neon |
|-----|------|-------------------|----------------|
| `products` | `array` | 16 products (incl. 14 jackets + 2 accessories) | **Live & populated** |
| `services` | `array` | 7 service packages | **Live & populated** |
| `blog_posts` | `array` | 5 articles | **Live & populated** |
| `settings` | `object` | Store details & hero drop banner | **Live & populated** |
| `bookings` | `array` | — | **MISSING** (Needs initialization) |
| `orders` | `array` | — | **MISSING** (Needs initialization) |
| `inquiries` | `array` | — | **MISSING** (Needs initialization) |

---

## 4. Database Initialization Strategy

### 4.1 Table Creation (Idempotent)
To ensure portability across development and deployment environments:
```sql
CREATE TABLE IF NOT EXISTS public.zimthreads_store (
  key text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);
```

### 4.2 Non-Destructive Seed Query
Because `products`, `services`, `blog_posts`, and `settings` already have active production data, the initialization query **must never overwrite** existing records. Using `ON CONFLICT (key) DO NOTHING` safely creates missing keys with empty arrays `[]` while preserving existing rows:

```sql
INSERT INTO public.zimthreads_store (key, data, updated_at)
VALUES 
  ('bookings', '[]'::jsonb, NOW()),
  ('orders', '[]'::jsonb, NOW()),
  ('inquiries', '[]'::jsonb, NOW()),
  ('products', '[]'::jsonb, NOW()),
  ('services', '[]'::jsonb, NOW()),
  ('blog_posts', '[]'::jsonb, NOW()),
  ('settings', '{}'::jsonb, NOW())
ON CONFLICT (key) DO NOTHING;
```

*Verification result*: Running this against the live Neon DB will insert exactly the 3 missing keys (`bookings`, `orders`, `inquiries`) without touching `products`, `services`, `blog_posts`, or `settings`.

---

## 5. Atomic Append Query Strategy for `public_create`

### 5.1 The Concurrency Problem
If customer submissions (`/booking`, cart checkout, `/contact`) used a naive read-modify-write pattern:
1. Process A reads `bookings` (`[BK-1]`)
2. Process B reads `bookings` (`[BK-1]`)
3. Process A appends `BK-2` and writes `[BK-2, BK-1]`
4. Process B appends `BK-3` and writes `[BK-3, BK-1]` -> **`BK-2` is lost!**

Under high traffic or concurrent checkout, customer orders or bookings would be silently dropped.

### 5.2 Atomic Prepend SQL Query
PostgreSQL allows atomic array manipulation directly within an `INSERT ... ON CONFLICT (key) DO UPDATE` statement. Row-level locks in PostgreSQL serialize concurrent updates to the same row key:

```sql
INSERT INTO public.zimthreads_store (key, data, updated_at)
VALUES ($1, jsonb_build_array($2::jsonb), NOW())
ON CONFLICT (key) DO UPDATE
SET data = jsonb_build_array($2::jsonb) || COALESCE(zimthreads_store.data, '[]'::jsonb),
    updated_at = NOW()
RETURNING key, data, updated_at;
```

#### Parameter Mapping:
- `$1`: Target entity key (`'bookings'`, `'orders'`, or `'inquiries'`)
- `$2`: JSON-serialized record string (`JSON.stringify(record)`)

#### Advantages:
1. **Strictly Atomic**: Executes in a single database transaction with row-level lock serialization. Zero race conditions.
2. **Self-Healing / Auto-Initializing**: If the table row for `'bookings'` does not exist, the `INSERT` clause creates it with `[$2]`.
3. **Correct Sort Order (Newest First)**: In the UI and Admin Dashboard, newer bookings, orders, and inquiries appear at index 0. The expression `jsonb_build_array($2::jsonb) || zimthreads_store.data` prepends the newest submission to index 0, matching `setBookings(prev => [newBooking, ...prev])`.
4. **Type-Safe**: Uses `COALESCE(..., '[]'::jsonb)` to guard against null data values.

### 5.3 Public Access Control & Security
To ensure public callers cannot overwrite sensitive entities, the API handler must enforce an entity whitelist:
```typescript
const ALLOWED_PUBLIC_ENTITIES = new Set(["bookings", "orders", "inquiries"]);

if (body.action === "public_create") {
  const { entity, record } = body;
  if (!ALLOWED_PUBLIC_ENTITIES.has(entity)) {
    return res.status(403).json({ error: "Unauthorized entity creation" });
  }
  if (!record || typeof record !== "object") {
    return res.status(400).json({ error: "Missing or invalid record payload" });
  }
  // Execute atomic prepend query
}
```

---

## 6. Administrative Mutation Strategies

For authenticated administrative operations (`adminToken === "Zimthreads200"`):

### 6.1 Action `update_entity` (In-Place Array Item Update)
Instead of re-uploading entire arrays from the browser for single-field changes (e.g., toggling booking status from "Pending" to "Confirmed" or marking an inquiry as read), PostgreSQL can perform in-place item updates:

```sql
UPDATE public.zimthreads_store
SET data = (
  SELECT COALESCE(jsonb_agg(
    CASE 
      WHEN elem->>'id' = $2 THEN elem || $3::jsonb
      ELSE elem
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(data) AS elem
),
updated_at = NOW()
WHERE key = $1
RETURNING key;
```
- `$1`: Target entity key (e.g. `'bookings'`)
- `$2`: Record ID (e.g. `'BK-1001'`)
- `$3`: Partial updates JSON (e.g. `'{"status": "Confirmed"}'`)

### 6.2 Action `delete_entity` (In-Place Array Item Deletion)
```sql
UPDATE public.zimthreads_store
SET data = (
  SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
  FROM jsonb_array_elements(data) AS elem
  WHERE elem->>'id' != $2
),
updated_at = NOW()
WHERE key = $1
RETURNING key;
```
- `$1`: Target entity key (e.g. `'inquiries'`)
- `$2`: Record ID (e.g. `'INQ-482'`)

### 6.3 Action `sync` (Full Entity Replacement)
For operations like batch updating catalog prices, updating store settings, or full sync:
```sql
INSERT INTO public.zimthreads_store (key, data, updated_at)
VALUES ($1, $2::jsonb, NOW())
ON CONFLICT (key) DO UPDATE
SET data = EXCLUDED.data, updated_at = NOW()
RETURNING key;
```

---

## 7. Public Read Queries (GET Requests)

### 7.1 Single Key Read (`GET /api/store?key=<key>`)
```sql
SELECT key, data, updated_at 
FROM public.zimthreads_store 
WHERE key = $1;
```

### 7.2 Full Store Hydration (`GET /api/store` or `GET /api/store?key=all`)
```sql
SELECT key, data, updated_at 
FROM public.zimthreads_store;
```
Transforms rows into an object dictionary `{ products: [...], services: [...], bookings: [...], ... }`.

---

## 8. Empirical Verification Results

Tests were executed against Neon PostgreSQL 18.6 using test keys `__test_append_temp__` and `__test_entity_temp__`:

1. **Atomic Prepend Verification**:
   - Initial insert: `jsonb_build_array({ id: 'BK-1001' })` -> array length 1.
   - Subsequent insert: prepended `{ id: 'BK-1002' }` -> array length 2 with `BK-1002` at index 0.
   - Output confirmed:
     ```json
     [
       { "id": "BK-1002", "customer": "Bob" },
       { "id": "BK-1001", "customer": "Alice" }
     ]
     ```
2. **In-Place JSONB Array Update Verification**:
   - Updated `BK-1` status from `"Pending"` to `"Completed"` while leaving other elements untouched.
3. **In-Place JSONB Array Deletion Verification**:
   - Deleted `BK-2` from array; returned array with only remaining items.
4. **Cleanup**: Test records were purged immediately after verification. Zero orphaned rows.

---

## 9. Recommendations for Milestone 1 Implementation

1. **Database Initialization**: Run the non-destructive initialization query to seed `bookings`, `orders`, and `inquiries` as `[]`.
2. **`api/store.ts` Refactoring**:
   - Update POST handler to support:
     - `action: "public_create"` (unauthenticated, whitelisted for `bookings`, `orders`, `inquiries` using atomic prepend query).
     - `action: "sync"` (authenticated with `adminToken: "Zimthreads200"` using upsert).
     - `action: "update_entity"` (authenticated, using in-place update query).
     - `action: "delete_entity"` (authenticated, using in-place delete query).
   - Update GET handler to support both single key (`?key=<name>`) and full store hydration (`?key=all` or default).
3. **Vite Dev Server Middleware**: In `vite.config.ts`, implement a dev middleware on `/api/store` connecting to the same Neon endpoint, ensuring identical behavior in local development.
