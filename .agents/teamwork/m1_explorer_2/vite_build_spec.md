# Technical Specification: Vite Dev Server Middleware & Cloudinary Build Fix

**Target Repository**: Zimthreads Collective  
**Target Milestone**: Milestone 1 (Vite Dev Server Middleware & Build Fix)  
**Author**: Explorer 2  
**Date**: 2026-10-10  
**Target Files**:
- `vite.config.ts`
- `src/lib/cloudinary.ts`

---

## 1. Executive Summary

During local development (`npm run dev`), the Vite development server serves the Single-Page Application (SPA) shell (`index.html`) by default for any unknown routes. Because Vercel serverless functions (`api/*.ts`) do not run natively under a raw Vite dev server without middleware or a proxy, frontend calls to `/api/store` (such as `fetch('/api/store')` in `StoreContext.tsx`) hit Vite's fallback route and receive `index.html` with status 200. This triggers browser JSON parsing errors:
```
SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON
```

This specification provides:
1. **The exact Vite plugin implementation (`viteDevStoreApiPlugin`)** in `vite.config.ts` to intercept `/api/store` requests, parse JSON request bodies, adapt Node's HTTP primitives, and delegate dynamically to the Neon database handler via Vite's SSR module loader (`server.ssrLoadModule`).
2. **The exact TypeScript syntax fix in `src/lib/cloudinary.ts:90`** resolving `error TS1005: ';' expected`.
3. **The type alignment fix in `src/lib/cloudinary.ts`** adding `cdnUrl?: string` to `CloudinaryUploadResult`, resolving downstream type checking errors in `src/components/ImageUploader.tsx`.

---

## 2. Vite Dev Server Middleware Specification

### 2.1 The Interception Mechanism

In Vite, plugins can hook into the development HTTP server lifecycle using `configureServer(server)`. The server's internal HTTP pipeline is powered by `Connect`.

Key requirements for the dev middleware:
- **Environment Gating**: Must use `apply: 'serve'` so the plugin is strictly scoped to `npm run dev` and excluded from production builds (`npm run build`).
- **Route Filtering**: Must intercept requests where the pathname equals `/api/store`, while allowing Vite's internal assets, HMR web sockets, and static files to pass through untouched via `next()`.
- **Query Parameter Handling**: Must parse query parameters (e.g. `?key=all`, `?key=bookings`) and expose them as `req.query` on the request object.
- **Request Body Parsing**: In Node's HTTP pipeline, `req` is a readable stream. For `POST`, `PUT`, and `PATCH` requests, the middleware must buffer incoming chunks, parse the payload as JSON, and attach it to `req.body`.
- **Response API Adaptation**: Serverless handlers (such as `api/store.ts`) call Express/Vercel convenience methods like `res.status(code).json(data)`. Standard Node `http.ServerResponse` only provides `res.statusCode = code` and `res.end()`. The middleware must augment `res` with chainable `.status(code)` and `.json(data)` helper methods.
- **Dynamic HMR Execution**: By loading the API route via `server.ssrLoadModule('/api/store.ts')`, any changes made to `api/store.ts` (or database queries) take effect immediately without needing to restart the Vite dev server.

---

### 2.2 Recommended Architecture: SSR Module Loader Adapter (Option A)

This architecture maintains a **single source of truth**: `api/store.ts` contains all business logic, validation, and Neon SQL queries for both production (Vercel) and local development (Vite).

```
[ Browser / Client ]
         │
         │  HTTP GET / POST / OPTIONS /api/store
         ▼
[ Vite Dev Server (server.middlewares) ]
         │
         ├─ Path !== '/api/store' ──> next() (Vite SPA Fallback / Assets)
         │
         ├─ OPTIONS ──────────────> Return 204 with CORS Headers
         │
         ├─ Body Parser ──────────> Buffer chunks, parse JSON -> req.body
         ├─ Query Parser ─────────> Parse URL search params -> req.query
         ├─ Response Adapter ─────> Inject res.status().json()
         │
         ▼
[ server.ssrLoadModule('/api/store.ts') ]
         │
         ▼
[ Neon Database HTTP SQL API ] (https://<host>/sql)
```

#### Detailed Code Implementation:

Add this plugin function to `vite.config.ts`:

```typescript
/**
 * Vite Dev Server Middleware for /api/store.
 * Intercepts /api/store in local development (`npm run dev`) and
 * delegates execution to the serverless handler in api/store.ts.
 */
function viteDevStoreApiPlugin(): Plugin {
  return {
    name: "vite-dev-store-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ""
        const [pathname] = url.split("?")

        if (pathname !== "/api/store") {
          return next()
        }

        // Standard CORS Headers
        res.setHeader("Access-Control-Allow-Origin", "*")
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization",
        )

        // Preflight OPTIONS handler
        if (req.method === "OPTIONS") {
          res.statusCode = 204
          return res.end()
        }

        try {
          // Parse query string into req.query
          const parsedUrl = new URL(url, "http://localhost")
          ;(req as any).query = Object.fromEntries(
            parsedUrl.searchParams.entries(),
          )

          // Parse JSON body for mutation requests (POST / PUT / PATCH)
          if (
            req.method === "POST" ||
            req.method === "PUT" ||
            req.method === "PATCH"
          ) {
            const body = await new Promise<any>((resolve, reject) => {
              let raw = ""
              req.on("data", (chunk: Buffer | string) => {
                raw += chunk
              })
              req.on("end", () => {
                if (!raw.trim()) {
                  return resolve({})
                }
                try {
                  resolve(JSON.parse(raw))
                } catch {
                  reject(new Error("Malformed JSON in request body"))
                }
              })
              req.on("error", (err) => reject(err))
            })
            ;(req as any).body = body
          }

          // Augment res with Express/Vercel convenience methods
          const nodeRes = res as any
          nodeRes.status = function (statusCode: number) {
            this.statusCode = statusCode
            return this
          }
          nodeRes.json = function (payload: any) {
            this.setHeader("Content-Type", "application/json; charset=utf-8")
            this.end(JSON.stringify(payload))
            return this
          }

          // Dynamically load api/store.ts via Vite SSR module loader
          // This enables live HMR updates without restarting the Vite server
          const storeModule = await server.ssrLoadModule("/api/store.ts")
          const handler = storeModule.default || storeModule
          await handler(req, res)
        } catch (err: any) {
          console.error("[Vite Dev Store API] Error handling request:", err)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader("Content-Type", "application/json; charset=utf-8")
            res.end(
              JSON.stringify({
                error: err.message || "Internal server error in dev API",
              }),
            )
          }
        }
      })
    },
  }
}
```

---

### 2.3 Alternative Architecture: Standalone Direct Neon SQL Plugin (Option B)

If decoupling from `api/store.ts` is ever desired, `vite.config.ts` can execute SQL directly against Neon's HTTP SQL API (`https://${NEON_HOST}/sql`).

```typescript
function viteDevStoreApiDirectPlugin(): Plugin {
  const NEON_CONNECTION_STRING =
    process.env.NEON_DATABASE_URL ||
    "postgresql://neondb_owner:npg_DR0tIYcQyeX8@ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require"
  const NEON_HOST = "ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech"

  async function executeSql(query: string, params: any[] = []) {
    const response = await fetch(`https://${NEON_HOST}/sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Neon-Connection-String": NEON_CONNECTION_STRING,
      },
      body: JSON.stringify({ query, params }),
    })
    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Neon SQL error (${response.status}): ${errText}`)
    }
    const data = await response.json()
    return data.rows || []
  }

  return {
    name: "vite-dev-store-api-direct",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ""
        const [pathname] = url.split("?")
        if (pathname !== "/api/store") return next()

        res.setHeader("Access-Control-Allow-Origin", "*")
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
        if (req.method === "OPTIONS") {
          res.statusCode = 204
          return res.end()
        }

        try {
          if (req.method === "GET") {
            const rows = await executeSql("SELECT key, data FROM public.zimthreads_store;")
            const storeData: Record<string, any> = {}
            for (const row of rows) storeData[row.key] = row.data
            res.setHeader("Content-Type", "application/json")
            return res.end(JSON.stringify({ success: true, data: storeData }))
          }

          if (req.method === "POST") {
            // Read body
            let raw = ""
            for await (const chunk of req) raw += chunk
            const body = raw ? JSON.parse(raw) : {}

            // Public create handler
            if (body.action === "public_create") {
              const { entity, record } = body
              if (!entity || !record) {
                res.statusCode = 400
                return res.end(JSON.stringify({ error: "Missing entity or record" }))
              }
              const query = `
                INSERT INTO public.zimthreads_store (key, data, updated_at)
                VALUES ($1, jsonb_build_array($2::jsonb), NOW())
                ON CONFLICT (key) DO UPDATE
                SET data = jsonb_build_array($2::jsonb) || COALESCE(zimthreads_store.data, '[]'::jsonb),
                    updated_at = NOW()
                RETURNING key;
              `
              await executeSql(query, [entity, JSON.stringify(record)])
              res.setHeader("Content-Type", "application/json")
              return res.end(JSON.stringify({ success: true, record }))
            }

            // Admin handler
            if (body.adminToken !== "Zimthreads200") {
              res.statusCode = 401
              return res.end(JSON.stringify({ error: "Unauthorized" }))
            }

            const { key, data } = body
            const query = `
              INSERT INTO public.zimthreads_store (key, data, updated_at)
              VALUES ($1, $2, NOW())
              ON CONFLICT (key) DO UPDATE
              SET data = EXCLUDED.data, updated_at = NOW()
              RETURNING key;
            `
            await executeSql(query, [key, JSON.stringify(data)])
            res.setHeader("Content-Type", "application/json")
            return res.end(JSON.stringify({ success: true, updated: key }))
          }

          res.statusCode = 405
          return res.end(JSON.stringify({ error: "Method not allowed" }))
        } catch (err: any) {
          res.statusCode = 500
          res.setHeader("Content-Type", "application/json")
          return res.end(JSON.stringify({ error: err.message }))
        }
      })
    }
  }
}
```

### 2.4 Architecture Comparison

| Feature | Option A (SSR Adapter) | Option B (Direct Plugin) |
|---|---|---|
| Single Source of Truth | **Yes** (`api/store.ts`) | No (SQL logic duplicated in Vite) |
| Hot Module Replacement | **Yes** (Instant on edit of `api/store.ts`) | Requires Vite server restart on config edit |
| Production Parity | **Identical behavior to Vercel** | Risk of drift between dev & prod |
| Maintenance Overhead | Low (maintained only in `api/store.ts`) | Higher (must mirror changes in two files) |
| **Recommendation** | **STRONGLY RECOMMENDED** | Fallback only |

---

## 3. Cloudinary TypeScript Error & Type Fix

### 3.1 Syntax Error at `src/lib/cloudinary.ts:90`

**Direct Observation**:
Running `npx tsc --noEmit` produces:
```
src/lib/cloudinary.ts(90,30): error TS1005: ';' expected.
```

**Location in Code**:
```typescript
// src/lib/cloudinary.ts lines 88-91
export async function uploadImageToCloudinary(
  file: File | Blob,
  options: { folder?: string tags?: string[] } = {},
): Promise<CloudinaryUploadResult> {
```

**Root Cause**:
In TypeScript, inline object type annotations require member separators (`;` or `,`). In `{ folder?: string tags?: string[] }`, there is no delimiter between `string` and `tags?:`, which causes a fatal parsing syntax error.

**Fix**:
Change line 90 to:
```typescript
  options: { folder?: string; tags?: string[] } = {},
```

---

### 3.2 Secondary Type Inconsistency: `CloudinaryUploadResult`

**Direct Observation**:
Once line 90's syntax error is resolved, TypeScript's semantic checker evaluates the rest of the codebase and reports:
```
src/components/ImageUploader.tsx:84 - Property 'cdnUrl' does not exist on type 'CloudinaryUploadResult'. Did you mean 'cdn_url'?
```

**Root Cause**:
In `src/lib/cloudinary.ts`:
- The interface defines: `cdn_url: string` (snake_case).
- The internal implementation computes: `const cdnUrl = ...` and returns `cdn_url: cdnUrl`.
- However, consumer component `src/components/ImageUploader.tsx` (line 84) accesses `result.cdnUrl || result.secure_url` (camelCase).

**Fix**:
In `src/lib/cloudinary.ts`:
1. Add `cdnUrl?: string` to `CloudinaryUploadResult`:
```typescript
export interface CloudinaryUploadResult {
  public_id: string
  version: number
  format: string
  width: number
  height: number
  bytes: number
  secure_url: string
  cdn_url: string
  cdnUrl?: string
  created_at?: string
}
```
2. In `uploadImageToCloudinary`, return both `cdn_url` and `cdnUrl`:
```typescript
  return {
    public_id: data.public_id,
    version: data.version,
    format: data.format,
    width: data.width,
    height: data.height,
    bytes: data.bytes,
    secure_url: data.secure_url,
    cdn_url: cdnUrl,
    cdnUrl: cdnUrl,
    created_at: data.created_at,
  }
```

---

## 4. Verification and Downstream Type Audit

### 4.1 Production Build (`npm run build`)
Running `npm run build` executes `vite build`.
- **Test Result**: Succeeded with zero errors (`built in 784ms`).
- **Assets Generated**:
  - `dist/index.html` (9.72 kB)
  - `dist/assets/index-*.css` (66.88 kB)
  - `dist/assets/index-*.js` (454.95 kB)

### 4.2 TypeScript Compiler Diagnostics (`npx tsc --noEmit`)
- Applying the fix to `src/lib/cloudinary.ts:90` and adding `cdnUrl?: string` eliminates all errors in `src/lib/cloudinary.ts` and `src/components/ImageUploader.tsx`.
- Downstream notes for Milestone 2: `src/pages/Shop.tsx` contains 4 property mismatches with `CollectiveCollection` (`title` -> `name`, `subtitle` -> `tagline`, and `onClick` handler signature). These are scoped to Milestone 2 (Customer-Facing Flows & StoreContext).

---

## 5. Concrete File Patches

### 5.1 Patch for `vite.config.ts`

```diff
--- a/vite.config.ts
+++ b/vite.config.ts
@@ -26,6 +26,7 @@ export default defineConfig(({ mode }) => {
       figmaErrorOverlayReplay(),
       figmaReactRefreshBoundaryFallback(),
       figmaMakeKitPlugin({ storiesGlob: "/src/**/*.stories.{ts,tsx,js,jsx}" }),
+      viteDevStoreApiPlugin(),
     ],
     resolve: {
       alias: {
@@ -412,3 +413,87 @@ function figmaMakeKitPlugin(options: {
   }
 }
 
+/**
+ * Local development middleware for /api/store.
+ * Intercepts /api/store requests during `npm run dev` and delegates
+ * them to the serverless API handler via ssrLoadModule.
+ */
+function viteDevStoreApiPlugin(): Plugin {
+  return {
+    name: "vite-dev-store-api",
+    apply: "serve",
+    configureServer(server) {
+      server.middlewares.use(async (req, res, next) => {
+        const url = req.url || ""
+        const [pathname] = url.split("?")
+
+        if (pathname !== "/api/store") {
+          return next()
+        }
+
+        // Standard CORS headers
+        res.setHeader("Access-Control-Allow-Origin", "*")
+        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
+        res.setHeader(
+          "Access-Control-Allow-Headers",
+          "Content-Type, Authorization",
+        )
+
+        if (req.method === "OPTIONS") {
+          res.statusCode = 204
+          return res.end()
+        }
+
+        try {
+          // Parse query string into req.query
+          const parsedUrl = new URL(url, "http://localhost")
+          ;(req as any).query = Object.fromEntries(
+            parsedUrl.searchParams.entries(),
+          )
+
+          // Parse JSON body for mutation requests
+          if (
+            req.method === "POST" ||
+            req.method === "PUT" ||
+            req.method === "PATCH"
+          ) {
+            const body = await new Promise<any>((resolve, reject) => {
+              let raw = ""
+              req.on("data", (chunk: Buffer | string) => {
+                raw += chunk
+              })
+              req.on("end", () => {
+                if (!raw.trim()) {
+                  return resolve({})
+                }
+                try {
+                  resolve(JSON.parse(raw))
+                } catch {
+                  reject(new Error("Malformed JSON in request body"))
+                }
+              })
+              req.on("error", (err) => reject(err))
+            })
+            ;(req as any).body = body
+          }
+
+          // Augment res with Express/Vercel convenience methods
+          const nodeRes = res as any
+          nodeRes.status = function (statusCode: number) {
+            this.statusCode = statusCode
+            return this
+          }
+          nodeRes.json = function (payload: any) {
+            this.setHeader("Content-Type", "application/json; charset=utf-8")
+            this.end(JSON.stringify(payload))
+            return this
+          }
+
+          // Delegate to api/store.ts via Vite SSR module loader
+          const storeModule = await server.ssrLoadModule("/api/store.ts")
+          const handler = storeModule.default || storeModule
+          await handler(req, res)
+        } catch (err: any) {
+          console.error("[Vite Dev Store API] Error handling request:", err)
+          if (!res.headersSent) {
+            res.statusCode = 500
+            res.setHeader("Content-Type", "application/json; charset=utf-8")
+            res.end(
+              JSON.stringify({
+                error: err.message || "Internal server error in dev API",
+              }),
+            )
+          }
+        }
+      })
+    },
+  }
+}
```

---

### 5.2 Patch for `src/lib/cloudinary.ts`

```diff
--- a/src/lib/cloudinary.ts
+++ b/src/lib/cloudinary.ts
@@ -23,6 +23,7 @@ export interface CloudinaryUploadResult {
   bytes: number
   secure_url: string
   cdn_url: string
+  cdnUrl?: string
   created_at?: string
 }
 
@@ -87,7 +88,7 @@ async function computeSha1(text: string): Promise<string> {
  */
 export async function uploadImageToCloudinary(
   file: File | Blob,
-  options: { folder?: string tags?: string[] } = {},
+  options: { folder?: string; tags?: string[] } = {},
 ): Promise<CloudinaryUploadResult> {
   const config = getCloudinaryConfig()
 
@@ -152,6 +153,7 @@ export async function uploadImageToCloudinary(
     bytes: data.bytes,
     secure_url: data.secure_url,
     cdn_url: cdnUrl,
+    cdnUrl: cdnUrl,
     created_at: data.created_at,
   }
 }
```
