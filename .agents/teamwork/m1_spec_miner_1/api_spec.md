# Zimthreads API Specification: `api/store.ts`

**Target Milestone**: Milestone 1 (Neon Database & API Layer)  
**Author**: API Spec Miner (`m1_spec_miner_1`)  
**Target Environment**: Neon Serverless PostgreSQL (`ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech`)  
**Target Account**: `anesumupesa@gmail.com` / `Mupesa` (Project ID: `rapid-hill-42448439`)  
**Database Table**: `public.zimthreads_store` (`key text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz`)  

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | CORS & Preflight | OPTIONS Request Preflight | Responds to browser CORS preflight requests with open access headers | HTTP `OPTIONS /api/store` | HTTP 200 with headers: `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, POST, OPTIONS`, `Access-Control-Allow-Headers: Content-Type, Authorization` | N/A | `api/store.ts:28-34` |
| 2 | Read API | Public Read All Entities (`GET ?key=all` or omitted) | Fetches all managed entity records (`products`, `services`, `blog_posts`, `settings`, `bookings`, `orders`, `inquiries`) from `zimthreads_store` | HTTP `GET /api/store` or `GET /api/store?key=all` | HTTP 200: `{ success: true, data: { products: [...], services: [...], blog_posts: [...], settings: {...}, bookings: [...], orders: [...], inquiries: [...] } }` | HTTP 500 on database connection or query failure: `{ error: string }` | `PROJECT.md:69-70`, `api/store.ts:37-46` |
| 3 | Read API | Public Read Single Entity (`GET ?key=<key>`) | Fetches a single entity collection or object by primary key | HTTP `GET /api/store?key=products` (or `bookings`, `orders`, `inquiries`, `services`, `blog_posts`, `settings`) | HTTP 200: `{ success: true, key: string, data: any, updatedAt: string }` | HTTP 500 on database failure; returns `{ success: true, key: key, data: [], updatedAt: null }` if key is not yet populated | `PROJECT.md:67-68`, `DISPATCH.md:5` |
| 4 | Public Creation | Public Customer Booking (`POST action: "public_create", entity: "bookings"`) | Unauthenticated public appointment booking submission from `/booking` flow; prepends booking into `bookings` jsonb array in Neon DB | HTTP `POST /api/store` with body: `{ action: "public_create", entity: "bookings", record: { customer, email, phone, serviceId, ... } }` (NO `adminToken`) | HTTP 200: `{ success: true, record: BookingItem }` | HTTP 400 Bad Request if missing `customer`, `email`, `phone`, or `serviceId`, or if email is invalid format | `ORIGINAL_REQUEST.md:14,22`, `PROJECT.md:72-74`, `Booking.tsx:108-119` |
| 5 | Public Creation | Public Customer Order (`POST action: "public_create", entity: "orders"`) | Unauthenticated public checkout order placement from Cart Drawer; prepends order into `orders` jsonb array in Neon DB | HTTP `POST /api/store` with body: `{ action: "public_create", entity: "orders", record: { customer, email, phone, items: [...], totalAmount, ... } }` (NO `adminToken`) | HTTP 200: `{ success: true, record: OrderItem }` | HTTP 400 Bad Request if missing `customer`, `email`, `phone`, or if `items` array is empty/missing | `ORIGINAL_REQUEST.md:15,22`, `PROJECT.md:72-74`, `CartDrawer.tsx:62-69` |
| 6 | Public Creation | Public Customer Inquiry (`POST action: "public_create", entity: "inquiries"`) | Unauthenticated contact message submission from `/contact`; prepends inquiry into `inquiries` jsonb array in Neon DB | HTTP `POST /api/store` with body: `{ action: "public_create", entity: "inquiries", record: { name, email, subject, message } }` (NO `adminToken`) | HTTP 200: `{ success: true, record: Inquiry }` | HTTP 400 Bad Request if missing `name`, `email`, `subject`, or `message` | `ORIGINAL_REQUEST.md:19,22`, `PROJECT.md:72-74`, `Contact.tsx:27-32` |
| 7 | Public Creation | Public Create Entity Restriction Guard | Disallows unauthorized public modification of sensitive catalog/system keys via `public_create` | HTTP `POST /api/store` with body: `{ action: "public_create", entity: "products" | "services" | "blog_posts" | "settings", record: {...} }` | N/A | HTTP 400 Bad Request: `{ error: "Entity '<entity>' not permitted for public_create. Allowed: bookings, orders, inquiries" }` | `ORIGINAL_REQUEST.md:22`, `DISPATCH.md:6-7` |
| 8 | Admin Auth | Admin Token Enforcement Guard | Enforces administrative credential verification (`adminToken === "Zimthreads200"`) on all administrative mutations | HTTP `POST /api/store` with admin actions (`sync`, `batch_update_products`, `update_entity`, `delete_entity`) | Passes to authorized action handler if valid | HTTP 401 Unauthorized `{ error: "Unauthorized" }` if `adminToken` is missing, null, or not equal to `"Zimthreads200"` | `DISPATCH.md:10-12`, `PROJECT.md:75-83`, `api/store.ts:52-54` |
| 9 | Admin Mutation | Admin Full Sync (`POST action: "sync"`) | Full overwrite/upsert of an entire entity dataset (array or object) in Neon DB; supports legacy payload without `action` | HTTP `POST /api/store` with body: `{ action: "sync", adminToken: "Zimthreads200", key: string, data: any }` or legacy `{ key: string, data: any, adminToken: "Zimthreads200" }` | HTTP 200: `{ success: true, key: string, count: number }` | HTTP 401 if token invalid; HTTP 400 if `key` or `data` is missing | `PROJECT.md:75-77`, `StoreContext.tsx:172-188`, `api/store.ts:48-70` |
| 10 | Admin Mutation | Admin Batch Update Products (`POST action: "batch_update_products"`) | Atomic batch update of prices and inventory for multiple products (specifically the 14 Archival Racing Jackets) | HTTP `POST /api/store` with body: `{ action: "batch_update_products", adminToken: "Zimthreads200", updates: [{ id: string, changes: Partial<Product> }] }` | HTTP 200: `{ success: true, updatedCount: number }` | HTTP 401 if token invalid; HTTP 400 if `updates` is missing or not an array | `DISPATCH.md:10`, `PROJECT.md:22`, `StoreContext.tsx:615-628`, `Dashboard.tsx:1468-1481` |
| 11 | Admin Mutation | Admin Update Single Entity (`POST action: "update_entity"`) | Targeted modification of an individual record by ID within an entity jsonb array (e.g. changing booking status, order fulfillment, inquiry read flag) | HTTP `POST /api/store` with body: `{ action: "update_entity", adminToken: "Zimthreads200", entity: string, id: string, updates: Object }` | HTTP 200: `{ success: true, entity: string, id: string, updatedRecord: Object }` | HTTP 401 if token invalid; HTTP 400 if `entity`, `id`, or `updates` missing; HTTP 404 if record with `id` does not exist | `PROJECT.md:78-80`, `Dashboard.tsx:52,55,67` |
| 12 | Admin Mutation | Admin Delete Single Entity (`POST action: "delete_entity"`) | Deletion of an individual record by ID from an entity jsonb array | HTTP `POST /api/store` with body: `{ action: "delete_entity", adminToken: "Zimthreads200", entity: string, id: string }` | HTTP 200: `{ success: true, entity: string, id: string }` | HTTP 401 if token invalid; HTTP 400 if `entity` or `id` missing | `PROJECT.md:81-83`, `Dashboard.tsx:53,56,68` |
| 13 | Routing Guard | HTTP Method Not Allowed Guard | Rejects unsupported HTTP verbs (e.g. PUT, DELETE, PATCH) | HTTP `PUT /api/store`, `DELETE /api/store`, `PATCH /api/store` | N/A | HTTP 405 Method Not Allowed: `{ error: "Method not allowed" }` | `api/store.ts:72` |
| 14 | Local Dev | Vite Dev Server Middleware Proxy | Intercepts `/api/store` in Vite dev server (`vite.config.ts`), executing the API handler locally during `npm run dev` | HTTP requests to `/api/store` on Vite development port (8443) | Same responses and status codes as serverless function | HTTP 500 if dev server handler throws uncaught error | `PROJECT.md:23,39`, `vite.config.ts` |
| 15 | Build Integrity | Cloudinary Type Syntax Fix | Corrects syntax error in `src/lib/cloudinary.ts:90` (`options: { folder?: string tags?: string[] }`) to allow error-free compilation | `npm run build` | Clean TypeScript compilation | Syntax error in `cloudinary.ts:90` breaks build if unfixed | `PROJECT.md:40,59`, `cloudinary.ts:90` |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | `GET /api/store` (unseeded keys) | `GET /api/store?key=bookings` when `bookings` key is not yet inserted in `public.zimthreads_store` | Returns HTTP 200 with `{ success: true, key: "bookings", data: [], updatedAt: null }` rather than returning `null` or 404, preventing client-side `TypeError: cannot read properties of undefined (reading 'map')` |
| 2 | `GET /api/store?key=all` (missing keys) | `GET /api/store` when `zimthreads_store` only contains 4 keys (`products`, `services`, `blog_posts`, `settings`) | Fills missing entity keys with empty defaults (`bookings: []`, `orders: []`, `inquiries: []`) in the `data` map so StoreContext hydration does not leave state undefined |
| 3 | `POST public_create` (first submission) | First booking submitted when `bookings` row does not exist in table | Executes upsert `INSERT INTO public.zimthreads_store (key, data, updated_at) VALUES ('bookings', jsonb_build_array($1::jsonb), NOW()) ON CONFLICT (key) DO UPDATE SET data = jsonb_build_array($1::jsonb) || zimthreads_store.data, updated_at = NOW() RETURNING key;` successfully initializing the row |
| 4 | `POST public_create` (string whitespace) | `{ action: "public_create", entity: "bookings", record: { customer: "   ", email: "a@b.com", phone: "123", serviceId: "clean" } }` | Trims inputs; detects empty string for `customer`; returns HTTP 400 `{ error: "Validation failed: customer cannot be empty" }` |
| 5 | `POST public_create` (invalid email) | `{ action: "public_create", entity: "inquiries", record: { name: "Bob", email: "not-an-email", subject: "Hi", message: "Help" } }` | Validates email syntax against standard RFC 5322 regex; rejects with HTTP 400 `{ error: "Validation failed: invalid email address" }` |
| 6 | `POST public_create` (empty order items) | `{ action: "public_create", entity: "orders", record: { customer: "Alice", email: "alice@test.com", phone: "555", items: [] } }` | Checks `Array.isArray(record.items) && record.items.length > 0`; rejects empty cart checkout with HTTP 400 `{ error: "Validation failed: order must contain at least one item" }` |
| 7 | `POST public_create` (unauthorized entity) | `{ action: "public_create", entity: "products", record: { name: "Hacked", price: 0 } }` | Security check strictly restricts `entity` to `bookings`, `orders`, `inquiries`; returns HTTP 400 `{ error: "Entity 'products' not permitted for public_create. Allowed: bookings, orders, inquiries" }` |
| 8 | `POST admin actions` (missing token) | `{ action: "sync", key: "products", data: [] }` (no `adminToken`) | Token guard checks `adminToken === "Zimthreads200"`; returns HTTP 401 Unauthorized `{ error: "Unauthorized" }` |
| 9 | `POST admin actions` (wrong token) | `{ action: "batch_update_products", adminToken: "wrong_password", updates: [] }` | Token guard rejects mismatched credentials; returns HTTP 401 Unauthorized `{ error: "Unauthorized" }` |
| 10 | `POST admin actions` (legacy format) | `{ key: "services", data: [...], adminToken: "Zimthreads200" }` (omitted `action`) | Backward compatibility: when `action` is undefined but `key`, `data`, and valid `adminToken` are present, automatically routes to `sync` handler; returns HTTP 200 `{ success: true, updated: "services" }` |
| 11 | `POST update_entity` (non-existent ID) | `{ action: "update_entity", adminToken: "Zimthreads200", entity: "bookings", id: "BK-9999", updates: { status: "Cancelled" } }` | Searches existing `bookings` array; fails to find record with id `BK-9999`; returns HTTP 404 Not Found `{ error: "Entity not found with id: BK-9999" }` without modifying database |
| 12 | `POST delete_entity` (non-existent ID) | `{ action: "delete_entity", adminToken: "Zimthreads200", entity: "orders", id: "ORD-9999" }` | Idempotent operation: filtering non-existent id produces identical array; saves state and returns HTTP 200 `{ success: true, entity: "orders", id: "ORD-9999" }` |
| 13 | `POST batch_update_products` (partial match) | Updates array containing 1 valid jacket ID (`prod-jacket-ferrari-red-leather`) and 1 invalid ID (`prod-jacket-unknown`) | Updates matching jacket; leaves non-matching products untouched; writes result; returns HTTP 200 `{ success: true, updatedCount: 1 }` |
| 14 | Malformed JSON Body | Raw request body containing invalid JSON string (e.g. `{"action": "sync", bad}`) | Safe JSON parser catch block catches SyntaxError; returns HTTP 400 Bad Request `{ error: "Malformed JSON body" }` instead of crashing runtime |
| 15 | Neon Serverless SQL Connection Failure | Temporary network timeout or invalid connection string to `ep-icy-brook-b4bmxdh6-pooler` | `executeSql` catch block captures fetch failure; logs error; returns HTTP 500 `{ error: "Neon SQL error (...)" }` |
| 16 | OPTIONS Preflight with CORS Headers | Browser sends preflight `OPTIONS /api/store` with `Access-Control-Request-Headers` | Returns HTTP 200 with `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, POST, OPTIONS`, and `Access-Control-Allow-Headers: Content-Type, Authorization`, terminating immediately without DB query |

---

## Detailed API Endpoint Specifications

### 1. `GET /api/store`
Retrieves store data from table `public.zimthreads_store`.

- **Method**: `GET`
- **Path**: `/api/store`
- **Authentication**: None (Public)
- **Query Parameters**:
  - `key` (optional string):
    - `key="all"` or omitted: returns all store entities.
    - `key="<entity>"`: returns the specific entity (e.g. `products`, `services`, `blog_posts`, `settings`, `bookings`, `orders`, `inquiries`).

#### Request Examples:
```http
GET /api/store HTTP/1.1
Host: localhost:8443
```
```http
GET /api/store?key=bookings HTTP/1.1
Host: localhost:8443
```

#### Success Response (`key=all` or omitted):
- **Status**: `200 OK`
- **Content-Type**: `application/json`
```json
{
  "success": true,
  "data": {
    "products": [ /* array of Product objects */ ],
    "services": [ /* array of Service objects */ ],
    "blog_posts": [ /* array of BlogPost objects */ ],
    "settings": { /* StoreSettings object */ },
    "bookings": [ /* array of BookingItem objects */ ],
    "orders": [ /* array of OrderItem objects */ ],
    "inquiries": [ /* array of Inquiry objects */ ]
  }
}
```

#### Success Response (`key=<specific_key>`):
- **Status**: `200 OK`
- **Content-Type**: `application/json`
```json
{
  "success": true,
  "key": "bookings",
  "data": [
    {
      "id": "BK-1042",
      "customer": "Jean-Paul Laurent",
      "email": "jp.laurent@gmail.com",
      "phone": "+230 5712 3456",
      "serviceId": "clean",
      "serviceName": "CLEAN",
      "price": "Rs 300",
      "priceNumeric": 300,
      "date": "2026-10-15",
      "time": "10:00",
      "notes": "White Nike Air Force 1s",
      "status": "Pending",
      "createdAt": "2026-10-10T18:30:00.000Z"
    }
  ],
  "updatedAt": "2026-10-10T18:30:00.000Z"
}
```

#### Error Response:
- **Status**: `500 Internal Server Error`
```json
{
  "error": "Neon SQL error (500): Database connection failed"
}
```

---

### 2. `POST /api/store` with `action: "public_create"`
Permits unauthenticated public customers to submit new bookings, orders, and inquiries.

- **Method**: `POST`
- **Path**: `/api/store`
- **Authentication**: None (Strictly Public)
- **Headers**: `Content-Type: application/json`

#### Request Schema:
```typescript
interface PublicCreateRequest {
  action: "public_create";
  entity: "bookings" | "orders" | "inquiries";
  record: BookingRecordInput | OrderRecordInput | InquiryRecordInput;
}
```

#### Entity 1: `bookings`
##### Required Fields:
- `customer`: string (non-empty after trimming)
- `email`: string (valid email format, e.g. `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- `phone`: string (non-empty after trimming)
- `serviceId`: string (non-empty after trimming)
##### Optional / Defaulted Fields:
- `serviceName`: string (defaults to `serviceId`)
- `price`: string (defaults to `"Rs 300"`)
- `priceNumeric`: number (defaults to `300`)
- `date`: string (defaults to current date `YYYY-MM-DD`)
- `time`: string (defaults to `"09:00"`)
- `notes`: string (optional, defaults to `""`)
- `id`: string (auto-generated if omitted: `BK-${Math.floor(1000 + Math.random() * 9000)}`)
- `status`: `"Pending"` | `"Confirmed"` | `"In Progress"` | `"Completed"` | `"Cancelled"` (defaults to `"Pending"`)
- `createdAt`: string (ISO 8601 timestamp, defaults to `new Date().toISOString()`)

##### Example Request:
```json
{
  "action": "public_create",
  "entity": "bookings",
  "record": {
    "customer": "Sarah Jenkins",
    "email": "sarah.j@outlook.com",
    "phone": "+230 5821 9900",
    "serviceId": "deep",
    "serviceName": "DEEP CLEAN",
    "price": "Rs 500",
    "priceNumeric": 500,
    "date": "2026-10-18",
    "time": "14:00",
    "notes": "Suede Jordan 4s with mud stains"
  }
}
```

##### Success Response:
- **Status**: `200 OK`
```json
{
  "success": true,
  "record": {
    "id": "BK-4821",
    "customer": "Sarah Jenkins",
    "email": "sarah.j@outlook.com",
    "phone": "+230 5821 9900",
    "serviceId": "deep",
    "serviceName": "DEEP CLEAN",
    "price": "Rs 500",
    "priceNumeric": 500,
    "date": "2026-10-18",
    "time": "14:00",
    "notes": "Suede Jordan 4s with mud stains",
    "status": "Pending",
    "createdAt": "2026-10-10T18:32:15.120Z"
  }
}
```

#### Entity 2: `orders`
##### Required Fields:
- `customer`: string (non-empty after trimming)
- `email`: string (valid email format)
- `phone`: string (non-empty after trimming)
- `items`: array (must contain at least 1 item)
  - Each item: `{ productId: string, name: string, price: number, quantity: number, size?: string, img: string, customName?: string }`
##### Optional / Defaulted Fields:
- `address`: string (defaults to `""`)
- `city`: string (defaults to `"Mauritius"`)
- `paymentMethod`: `"Juice by MCB"` | `"Bank Transfer"` | `"Card / Online"` | `"Cash on Drop-off"` | `"EcoCash"` | `"ZIPIT"` | `"Swipe / Card"` | `"Cash on Delivery"` (defaults to `"Juice by MCB"`)
- `totalAmount`: number (defaults to sum of `price * quantity` + delivery fee)
- `itemSummary`: string (defaults to formatted summary of cart items)
- `id`: string (auto-generated if omitted: `ORD-${Math.floor(100 + Math.random() * 900)}`)
- `status`: `"Processing"` | `"Shipped"` | `"Delivered"` | `"Cancelled"` (defaults to `"Processing"`)
- `date`: string (defaults to formatted string `Oct 10, 2026`)
- `createdAt`: string (defaults to `new Date().toISOString()`)

##### Example Request:
```json
{
  "action": "public_create",
  "entity": "orders",
  "record": {
    "customer": "Kavish Ramgoolam",
    "email": "kavish@gmail.com",
    "phone": "+230 5944 1122",
    "address": "14 Rue Desforges",
    "city": "Port Louis",
    "paymentMethod": "Juice by MCB",
    "items": [
      {
        "productId": "prod-jacket-ferrari-red-leather",
        "name": "Ferrari Scuderia Rosso Corsa Vintage Moto Leather Jacket",
        "price": 2850,
        "quantity": 1,
        "size": "L",
        "img": "https://res.cloudinary.com/pwranjbq/image/upload/v1/jackets/ferrari.png"
      }
    ],
    "totalAmount": 2850
  }
}
```

##### Success Response:
- **Status**: `200 OK`
```json
{
  "success": true,
  "record": {
    "id": "ORD-729",
    "customer": "Kavish Ramgoolam",
    "email": "kavish@gmail.com",
    "phone": "+230 5944 1122",
    "address": "14 Rue Desforges",
    "city": "Port Louis",
    "paymentMethod": "Juice by MCB",
    "items": [ /* items array */ ],
    "itemSummary": "Ferrari Scuderia Rosso Corsa Vintage Moto Leather Jacket [L] (x1)",
    "totalAmount": 2850,
    "status": "Processing",
    "date": "Oct 10, 2026",
    "createdAt": "2026-10-10T18:34:00.000Z"
  }
}
```

#### Entity 3: `inquiries`
##### Required Fields:
- `name`: string (non-empty after trimming)
- `email`: string (valid email format)
- `subject`: string (non-empty after trimming)
- `message`: string (non-empty after trimming)
##### Optional / Defaulted Fields:
- `id`: string (auto-generated if omitted: `INQ-${Math.floor(100 + Math.random() * 900)}`)
- `date`: string (defaults to formatted date `Oct 10, 2026`)
- `read`: boolean (defaults to `false`)
- `createdAt`: string (defaults to `new Date().toISOString()`)

##### Example Request:
```json
{
  "action": "public_create",
  "entity": "inquiries",
  "record": {
    "name": "Devina P.",
    "email": "devina@gmail.com",
    "subject": "Custom Jacket Embroidery",
    "message": "Do you offer custom name embroidery on the back of the vintage racing jackets?"
  }
}
```

##### Success Response:
- **Status**: `200 OK`
```json
{
  "success": true,
  "record": {
    "id": "INQ-384",
    "name": "Devina P.",
    "email": "devina@gmail.com",
    "subject": "Custom Jacket Embroidery",
    "message": "Do you offer custom name embroidery on the back of the vintage racing jackets?",
    "date": "Oct 10, 2026",
    "read": false,
    "createdAt": "2026-10-10T18:35:10.000Z"
  }
}
```

#### PostgreSQL Atomic Upsert Query for `public_create`:
```sql
INSERT INTO public.zimthreads_store (key, data, updated_at)
VALUES ($1, jsonb_build_array($2::jsonb), NOW())
ON CONFLICT (key) DO UPDATE
SET data = CASE
  WHEN jsonb_typeof(public.zimthreads_store.data) = 'array' THEN jsonb_build_array($2::jsonb) || public.zimthreads_store.data
  ELSE jsonb_build_array($2::jsonb)
END,
updated_at = NOW()
RETURNING key;
```
*Note*: Prepending `jsonb_build_array($2::jsonb) || zimthreads_store.data` ensures newest submissions appear first in index order, matching `[newRecord, ...prev]` in StoreContext.

---

### 3. `POST /api/store` with `action: "sync"`
Administrative full replacement of an entire dataset key.

- **Method**: `POST`
- **Path**: `/api/store`
- **Authentication**: `adminToken === "Zimthreads200"` (Required)
- **Request Schema**:
```typescript
interface AdminSyncRequest {
  action?: "sync"; // optional for backward compatibility
  adminToken: "Zimthreads200";
  key: "products" | "services" | "blog_posts" | "settings" | "bookings" | "orders" | "inquiries";
  data: any; // array or object
}
```

#### Success Response:
- **Status**: `200 OK`
```json
{
  "success": true,
  "key": "services",
  "count": 7
}
```

#### Error Responses:
- Missing / invalid token: `401 Unauthorized` `{ "error": "Unauthorized" }`
- Missing `key` or `data`: `400 Bad Request` `{ "error": "Missing key or data" }`

---

### 4. `POST /api/store` with `action: "batch_update_products"`
Administrative batch modification of price and stock across multiple products in the catalog (e.g. 14 Archival Racing Jackets).

- **Method**: `POST`
- **Path**: `/api/store`
- **Authentication**: `adminToken === "Zimthreads200"` (Required)
- **Request Schema**:
```typescript
interface BatchUpdateProductsRequest {
  action: "batch_update_products";
  adminToken: "Zimthreads200";
  updates: Array<{
    id: string;
    changes: {
      price?: number;
      stock?: number;
      [key: string]: any;
    };
  }>;
}
```

#### Example Request:
```json
{
  "action": "batch_update_products",
  "adminToken": "Zimthreads200",
  "updates": [
    {
      "id": "prod-jacket-ferrari-red-leather",
      "changes": { "price": 2950, "stock": 10 }
    },
    {
      "id": "prod-jacket-marlboro-ducati-leather",
      "changes": { "price": 3100, "stock": 5 }
    }
  ]
}
```

#### Success Response:
- **Status**: `200 OK`
```json
{
  "success": true,
  "updatedCount": 2
}
```

#### Error Responses:
- Missing / invalid token: `401 Unauthorized` `{ "error": "Unauthorized" }`
- Missing / non-array `updates`: `400 Bad Request` `{ "error": "Missing or invalid updates array" }`

---

### 5. `POST /api/store` with `action: "update_entity"`
Administrative targeted mutation of an individual entity record by ID.

- **Method**: `POST`
- **Path**: `/api/store`
- **Authentication**: `adminToken === "Zimthreads200"` (Required)
- **Request Schema**:
```typescript
interface UpdateEntityRequest {
  action: "update_entity";
  adminToken: "Zimthreads200";
  entity: "bookings" | "orders" | "inquiries" | "services" | "products" | "blog_posts";
  id: string;
  updates: Record<string, any>;
}
```

#### Example Request (Update Booking Status):
```json
{
  "action": "update_entity",
  "adminToken": "Zimthreads200",
  "entity": "bookings",
  "id": "BK-4821",
  "updates": {
    "status": "Confirmed"
  }
}
```

#### Example Request (Mark Inquiry Read):
```json
{
  "action": "update_entity",
  "adminToken": "Zimthreads200",
  "entity": "inquiries",
  "id": "INQ-384",
  "updates": {
    "read": true
  }
}
```

#### Success Response:
- **Status**: `200 OK`
```json
{
  "success": true,
  "entity": "bookings",
  "id": "BK-4821",
  "updatedRecord": {
    "id": "BK-4821",
    "customer": "Sarah Jenkins",
    "status": "Confirmed",
    /* ...remaining fields preserved... */
  }
}
```

#### Error Responses:
- Missing / invalid token: `401 Unauthorized` `{ "error": "Unauthorized" }`
- Missing `entity`, `id`, or `updates`: `400 Bad Request` `{ "error": "Missing entity, id, or updates" }`
- Record ID not found: `404 Not Found` `{ "error": "Entity not found with id: BK-4821" }`

---

### 6. `POST /api/store` with `action: "delete_entity"`
Administrative deletion of an individual entity record by ID.

- **Method**: `POST`
- **Path**: `/api/store`
- **Authentication**: `adminToken === "Zimthreads200"` (Required)
- **Request Schema**:
```typescript
interface DeleteEntityRequest {
  action: "delete_entity";
  adminToken: "Zimthreads200";
  entity: "bookings" | "orders" | "inquiries" | "services" | "products" | "blog_posts";
  id: string;
}
```

#### Example Request:
```json
{
  "action": "delete_entity",
  "adminToken": "Zimthreads200",
  "entity": "bookings",
  "id": "BK-4821"
}
```

#### Success Response:
- **Status**: `200 OK`
```json
{
  "success": true,
  "entity": "bookings",
  "id": "BK-4821"
}
```

#### Error Responses:
- Missing / invalid token: `401 Unauthorized` `{ "error": "Unauthorized" }`
- Missing `entity` or `id`: `400 Bad Request` `{ "error": "Missing entity or id" }`

---

## Vite Dev Server Integration Specification

When running in local development (`npm run dev`), the browser requests `/api/store` from the Vite dev server running on port 8443. To mirror production serverless behavior without requiring external serverless runtimes:

1. **Location**: `vite.config.ts` inside `server.middlewares.use(...)`.
2. **Path Match**: Intercepts any request where `req.url?.startsWith("/api/store")`.
3. **Execution**:
   - Parses query parameters from `req.url`.
   - Reads the incoming request body buffer stream and parses JSON.
   - Provides mock `res.status()`, `res.setHeader()`, `res.json()`, and `res.end()` methods.
   - Invokes `api/store.ts` handler function directly.
4. **Environment Variables**:
   - Uses `process.env.NEON_DATABASE_URL` (with fallback to the hardcoded Neon connection string targeting Project `rapid-hill-42448439`).

---

## TypeScript Data Models

For reference by implementers across all frontend and API layers:

```typescript
export interface BookingItem {
  id: string;
  customer: string;
  email: string;
  phone: string;
  serviceId: string;
  serviceName: string;
  price: string;
  priceNumeric: number;
  date: string;
  time: string;
  notes?: string;
  status: "Pending" | "Confirmed" | "In Progress" | "Completed" | "Cancelled";
  createdAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  img: string;
  customName?: string;
}

export interface OrderItem {
  id: string;
  customer: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  items: CartItem[];
  itemSummary: string;
  totalAmount: number;
  paymentMethod:
    | "Juice by MCB"
    | "Bank Transfer"
    | "Card / Online"
    | "Cash on Drop-off"
    | "EcoCash"
    | "ZIPIT"
    | "Swipe / Card"
    | "Cash on Delivery";
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  date: string;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  category: "Cleaning" | "Apparel" | "Accessories";
  price: number;
  stock: number;
  img: string;
  images?: string[];
  views?: { label: string; url: string }[];
  alt: string;
  description: string;
  sizes?: string[];
  featured?: boolean;
  isPreorder?: boolean;
  preorderDeadline?: string;
  isPresale?: boolean;
  tag?: string;
  badge?: string;
  allowCustomName?: boolean;
  customNamePrice?: number;
  collectionId?: string;
  collectionName?: string;
  hidden?: boolean;
}

export interface Service {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  priceNumeric: number;
  desc: string;
  features: string[];
  turnaround: string;
  img: string;
  alt: string;
  active: boolean;
  badge?: string;
  tagline?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  img: string;
  alt: string;
  readTime: string;
  author: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  email: string;
  phone: string;
  location: string;
  hours: string;
  currency: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  featuredDrop?: {
    enabled: boolean;
    badge: string;
    title: string;
    subtitle: string;
    description: string;
    imageUrl: string;
    productId?: string;
    priceText?: string;
    ctaText?: string;
    secondaryCtaText?: string;
    tag?: string;
  };
}
```

---

## Implementation Gap Analysis

| Aspect | Current State in Codebase | Required State in Milestone 1 |
|---|---|---|
| `GET /api/store` Query Handling | Completely ignores `req.query`; always queries all rows | Must check `req.query.key`: if `key="all"` or omitted, return full store map; if `key` specified, return single entity object `{ success: true, key, data, updatedAt }` |
| `POST /api/store` Public Creation | Rejects with 401 Unauthorized because `adminToken` check precedes action routing | Must inspect `action === "public_create"` first; bypass `adminToken` check; validate booking, order, or inquiry payload; append/prepend to jsonb array |
| `POST /api/store` Admin Actions | Only supports `{ key, data, adminToken }` full upsert | Must support `action: "sync"`, `action: "batch_update_products"`, `action: "update_entity"`, and `action: "delete_entity"`, while maintaining backward compatibility for legacy sync |
| Database Seed Keys | Only 4 keys populated (`products`, `services`, `blog_posts`, `settings`) | Keys `bookings`, `orders`, and `inquiries` must be initialized with empty arrays `[]` in `zimthreads_store` |
| Vite Dev Server Integration | No middleware for `/api/store` in `vite.config.ts` | Must mount middleware in `vite.config.ts` to route `/api/store` to handler in dev mode |
| Cloudinary Type Syntax | Syntax error in `src/lib/cloudinary.ts:90` (`folder?: string tags?: string[]`) | Add semicolon or comma between `folder?: string` and `tags?: string[]` to resolve TypeScript compilation failure |
