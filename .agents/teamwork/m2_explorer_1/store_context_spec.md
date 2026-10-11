# StoreContext Persistence & Hydration Specification (Milestone 2)

**Author**: Explorer 1  
**Target File**: `src/store/StoreContext.tsx`  
**Dependencies**: `api/store.ts`, `src/store/seedData.ts`  
**Target Cloud DB**: Neon PostgreSQL (Project `rapid-hill-42448439`, `anesumupesa@gmail.com` / `Mupesa`)

---

## 1. Executive Summary

This document specifies the technical architecture and exact implementation blueprint for **StoreContext Cloud Hydration and Persistence** in `src/store/StoreContext.tsx`.

Currently, `StoreContext.tsx` only hydrates catalog products, services, blog posts, and settings on mount. Customer submissions (`addBooking`, `createOrder`, and `addInquiry`) and administrative modifications (`updateBookingStatus`, `deleteBooking`, `updateOrderStatus`, `deleteOrder`, `markInquiryAsRead`, `deleteInquiry`) update only local React state and `localStorage`. None of the transaction entities (`bookings`, `orders`, `inquiries`) are ever persisted to or hydrated from the live Neon PostgreSQL cloud store.

This specification closes all persistence gaps:
1. **Full 7-Entity Cloud Hydration**: On application mount and on demand, all 7 entities (`products`, `services`, `blog_posts`, `settings`, `bookings`, `orders`, `inquiries`) hydrate from Neon PostgreSQL via `GET /api/store?key=all`.
2. **Defensive Safe Array Fallbacks**: Ensures all 6 array entities are guaranteed arrays at all times, preventing UI component rendering exceptions if the database or local cache returns empty arrays, `null`, or malformed records.
3. **Public Customer Submission Persistence**: Refactors `addBooking`, `createOrder`, and `addInquiry` to perform optimistic local state updates while asynchronously dispatching `POST /api/store` with `action: "public_create"`.
4. **Administrative Mutation Sync**: Extends `syncToCloud` across all booking, order, and inquiry admin mutations.
5. **Preserved Calling Contracts**: Preserves synchronous return signatures (`BookingItem`, `OrderItem`, and `void`) so existing client flows (`/booking`, Cart Drawer checkout, `/contact`, and WhatsApp message generation) operate without breaking changes or TypeScript errors.

---

## 2. Forensic Analysis of Current Implementation

### 2.1 Hydration Gap (`fetchCloudData`)
In `src/store/StoreContext.tsx` (lines 300–348), the current `fetchCloudData` routine performs:
```tsx
const {
  products: cloudProducts,
  services: cloudServices,
  blog_posts: cloudBlogPosts,
  settings: cloudSettings,
} = result.data

if (Array.isArray(cloudProducts) && cloudProducts.length > 0) setProducts(cloudProducts)
if (Array.isArray(cloudServices) && cloudServices.length > 0) setServices(cloudServices)
if (Array.isArray(cloudBlogPosts) && cloudBlogPosts.length > 0) setBlogPosts(cloudBlogPosts)
if (cloudSettings && typeof cloudSettings === "object" && Object.keys(cloudSettings).length > 0) { ... }
```
- **Finding**: `bookings`, `orders`, and `inquiries` are completely omitted from the destructuring and state updating logic.
- **Consequence**: When an admin or customer reloads the page or opens another browser session, any customer bookings, orders, or inquiries stored in the Neon database are never loaded into the client.

### 2.2 Customer Submission Persistence Gap
In `src/store/StoreContext.tsx`:
- `addBooking` (lines 469–485): Only calls `setBookings((prev) => [newBooking, ...prev])`.
- `createOrder` (lines 502–546): Only calls `setOrders((prev) => [newOrder, ...prev])`.
- `addInquiry` (lines 671–688): Only calls `setInquiries((prev) => [newInquiry, ...prev])`.
- **Finding**: None of these functions call `/api/store`.
- **Consequence**: Bookings, checkout orders, and contact inquiries are trapped in the customer's browser `localStorage` and never reach the Neon database table `zimthreads_store`.

### 2.3 Administrative Mutation Sync Gap
In `src/store/StoreContext.tsx`:
- `updateBookingStatus` (lines 487–494) and `deleteBooking` (lines 496–499) do not call `syncToCloud`.
- `updateOrderStatus` (lines 548–555) and `deleteOrder` (lines 557–560) do not call `syncToCloud`.
- `markInquiryAsRead` (lines 690–694) and `deleteInquiry` (lines 696–699) do not call `syncToCloud`.
- **Finding**: Only `services`, `products`, `blog_posts`, and `settings` currently call `syncToCloud`.
- **Consequence**: When an admin updates an order status or marks an inquiry as read in `Dashboard.tsx`, the change is lost on the next reload.

### 2.4 Defensive Fallbacks & Parsing Robustness
- `getStored` (lines 154–162) returns `fallback` when `localStorage.getItem(key)` is null, but if `item` contains `"null"`, `JSON.parse` returns `null`.
- In `customers` calculation (lines 729–787), `b.createdAt.split("T")[0]` assumes `b.createdAt` is always populated; if a legacy record has undefined `createdAt`, the component tree throws an uncaught exception.

---

## 3. Architecture & Interface Specifications

### 3.1 Data Flow Diagram
```
┌──────────────────────────────────────────────────────────────────┐
│                     Client Browser (React 19)                    │
│                                                                  │
│  [Booking.tsx]         [CartDrawer.tsx]          [Contact.tsx]  │
│        │                      │                        │         │
│   addBooking()           createOrder()            addInquiry()   │
│        ▼                      ▼                        ▼         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    StoreContext.tsx                        │  │
│  │                                                            │  │
│  │  1. Optimistic React State Update (Instant UI render)      │  │
│  │  2. LocalStorage Cache Update                              │  │
│  │  3. Async Persistence (persistPublicRecord)                │  │
│  │  4. On Mount / On Refresh: fetchCloudData(all 7 entities) │  │
│  └────────────────────────────┬───────────────────────────────┘  │
└───────────────────────────────┼──────────────────────────────────┘
                                │
        POST /api/store (action: "public_create")
        GET  /api/store?key=all
        POST /api/store (action: "sync", adminToken: "Zimthreads200")
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│             API Layer (api/store.ts / vite.config.ts)            │
│  - Public validation & record preparation                        │
│  - Admin token authentication ("Zimthreads200")                  │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│           Neon PostgreSQL (public.zimthreads_store)              │
│  Entities: bookings, orders, inquiries, products, services,      │
│            blog_posts, settings                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Neon DB Schema & Entity Keys
Table: `public.zimthreads_store` (`key text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz`)

| Entity Key | DB Format | Client Type | Hydration Rule |
|---|---|---|---|
| `products` | `jsonb` array (16 items) | `Product[]` | `Array.isArray(x) && x.length > 0 ? x : prev` |
| `services` | `jsonb` array (7 items) | `Service[]` | `Array.isArray(x) && x.length > 0 ? x : prev` |
| `blog_posts` | `jsonb` array (5 items) | `BlogPost[]` | `Array.isArray(x) && x.length > 0 ? x : prev` |
| `settings` | `jsonb` object | `StoreSettings` | `x && typeof x === "object" ? merge(prev, x) : prev` |
| `bookings` | `jsonb` array | `BookingItem[]` | `Array.isArray(x) ? x : []` |
| `orders` | `jsonb` array | `OrderItem[]` | `Array.isArray(x) ? x : []` |
| `inquiries` | `jsonb` array | `Inquiry[]` | `Array.isArray(x) ? x : []` |

---

## 4. Detailed Component Blueprints

### 4.1 Defensive LocalStorage Helper (`getStored`)
Harden `getStored` to ensure it never returns `null` or a non-array when an array fallback is expected:
```typescript
function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key)
    if (!item) return fallback
    const parsed = JSON.parse(item)
    if (parsed === null || parsed === undefined) return fallback
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback
    return parsed
  } catch (e) {
    console.warn(`Error reading localStorage key "${key}"`, e)
    return fallback
  }
}
```

### 4.2 Cloud Persistence Helpers
Add `persistPublicRecord` alongside the existing `syncToCloud`:

```typescript
// Unauthenticated persistence helper for customer submissions
const persistPublicRecord = async (
  entity: "bookings" | "orders" | "inquiries",
  record: any,
) => {
  try {
    const res = await fetch("/api/store", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "public_create",
        entity,
        record,
      }),
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      console.warn(
        `[StoreContext] Failed to persist ${entity} to cloud:`,
        errData.error || res.statusText,
      )
    }
  } catch (err) {
    console.warn(`[StoreContext] Network error persisting ${entity} to cloud:`, err)
  }
}

// Authenticated sync helper for administrative operations
const syncToCloud = async (key: string, data: any) => {
  try {
    await fetch("/api/store", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "sync",
        key,
        data,
        adminToken: "Zimthreads200",
      }),
    })
  } catch (err) {
    console.warn(`[StoreContext] Failed to sync ${key} to cloud:`, err)
  }
}
```

### 4.3 Full Cloud Hydration (`fetchCloudData`)
Enhance `fetchCloudData` to request `/api/store?key=all`, hydrate all 7 entities, and expose `refreshCloudData`:

```typescript
const fetchCloudData = async () => {
  try {
    const res = await fetch("/api/store?key=all")
    if (!res.ok) return
    const result = await res.json()
    if (!result.success || !result.data) return

    const {
      products: cloudProducts,
      services: cloudServices,
      blog_posts: cloudBlogPosts,
      settings: cloudSettings,
      bookings: cloudBookings,
      orders: cloudOrders,
      inquiries: cloudInquiries,
    } = result.data

    if (Array.isArray(cloudProducts) && cloudProducts.length > 0) {
      setProducts(cloudProducts)
    }
    if (Array.isArray(cloudServices) && cloudServices.length > 0) {
      setServices(cloudServices)
    }
    if (Array.isArray(cloudBlogPosts) && cloudBlogPosts.length > 0) {
      setBlogPosts(cloudBlogPosts)
    }
    if (
      cloudSettings &&
      typeof cloudSettings === "object" &&
      Object.keys(cloudSettings).length > 0
    ) {
      setSettings((prev) => ({
        ...prev,
        ...cloudSettings,
        featuredDrop:
          cloudSettings.featuredDrop ||
          prev.featuredDrop ||
          initialSettings.featuredDrop,
      }))
    }
    if (Array.isArray(cloudBookings)) {
      setBookings(cloudBookings)
    }
    if (Array.isArray(cloudOrders)) {
      setOrders(cloudOrders)
    }
    if (Array.isArray(cloudInquiries)) {
      setInquiries(cloudInquiries)
    }
  } catch (err) {
    console.warn("[StoreContext] Could not fetch store data from cloud:", err)
  }
}

// Revalidate with Neon cloud store on mount
useEffect(() => {
  let isMounted = true
  fetchCloudData()
  return () => {
    isMounted = false
  }
}, [])
```

### 4.4 Refactored Customer Submission Mutations

#### `addBooking`
```typescript
const addBooking = (
  bookingData: Omit<BookingItem, "id" | "createdAt" | "status">,
): BookingItem => {
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  const newBooking: BookingItem = {
    ...bookingData,
    id: `BK-${randomNum}`,
    status: "Pending",
    createdAt: new Date().toISOString(),
  }
  setBookings((prev) => [newBooking, ...prev])
  showToast(
    "Booking Confirmed!",
    `Your booking reference is #${newBooking.id}.`,
  )
  // Async persistence to Neon DB via public_create
  persistPublicRecord("bookings", newBooking)
  return newBooking
}
```

#### `createOrder`
```typescript
const createOrder = (orderData: {
  customer: string
  email: string
  phone: string
  address: string
  city: string
  paymentMethod: OrderItem["paymentMethod"]
}): OrderItem => {
  const randomNum = Math.floor(100 + Math.random() * 900)
  const summary = cart
    .map((i) => `${i.name}${i.size ? ` [${i.size}]` : ""} (x${i.quantity})`)
    .join(", ")
  const totalAmount =
    cartTotal +
    (cartTotal >= settings.freeDeliveryThreshold ? 0 : settings.deliveryFee)

  const newOrder: OrderItem = {
    id: `ORD-${randomNum}`,
    customer: orderData.customer,
    email: orderData.email,
    phone: orderData.phone,
    address: orderData.address,
    city: orderData.city,
    items: [...cart],
    itemSummary: summary,
    totalAmount,
    paymentMethod: orderData.paymentMethod,
    status: "Processing",
    date: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    createdAt: new Date().toISOString(),
  }

  setOrders((prev) => [newOrder, ...prev])
  clearCart()
  setIsCartOpen(false)
  showToast(
    "Order Placed Successfully!",
    `Order #${newOrder.id} has been recorded.`,
  )
  // Async persistence to Neon DB via public_create
  persistPublicRecord("orders", newOrder)
  return newOrder
}
```

#### `addInquiry`
```typescript
const addInquiry = (inquiryData: Omit<Inquiry, "id" | "date" | "read">) => {
  const id = `INQ-${Math.floor(100 + Math.random() * 900)}`
  const newInquiry: Inquiry = {
    ...inquiryData,
    id,
    date: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    read: false,
  }
  setInquiries((prev) => [newInquiry, ...prev])
  showToast(
    "Message Sent!",
    "Thank you for reaching out. We will get back to you shortly.",
  )
  // Async persistence to Neon DB via public_create
  persistPublicRecord("inquiries", newInquiry)
}
```

### 4.5 Refactored Administrative Mutations

```typescript
const updateBookingStatus = (id: string, status: BookingItem["status"]) => {
  setBookings((prev) => {
    const next = prev.map((b) => (b.id === id ? { ...b, status } : b))
    syncToCloud("bookings", next)
    return next
  })
  showToast(
    "Booking Updated",
    `Booking #${id} status changed to ${status}.`,
    "info",
  )
}

const deleteBooking = (id: string) => {
  setBookings((prev) => {
    const next = prev.filter((b) => b.id !== id)
    syncToCloud("bookings", next)
    return next
  })
  showToast("Booking Deleted", `Booking #${id} has been removed.`, "info")
}

const updateOrderStatus = (id: string, status: OrderItem["status"]) => {
  setOrders((prev) => {
    const next = prev.map((o) => (o.id === id ? { ...o, status } : o))
    syncToCloud("orders", next)
    return next
  })
  showToast(
    "Order Updated",
    `Order #${id} status updated to ${status}.`,
    "info",
  )
}

const deleteOrder = (id: string) => {
  setOrders((prev) => {
    const next = prev.filter((o) => o.id !== id)
    syncToCloud("orders", next)
    return next
  })
  showToast("Order Deleted", `Order #${id} removed.`, "info")
}

const markInquiryAsRead = (id: string, read = true) => {
  setInquiries((prev) => {
    const next = prev.map((inq) => (inq.id === id ? { ...inq, read } : inq))
    syncToCloud("inquiries", next)
    return next
  })
}

const deleteInquiry = (id: string) => {
  setInquiries((prev) => {
    const next = prev.filter((inq) => inq.id !== id)
    syncToCloud("inquiries", next)
    return next
  })
  showToast("Inquiry Deleted", "Message removed.", "info")
}
```

### 4.6 Hardening Computed `customers`
```typescript
  const customers = useMemo<CustomerSummary[]>(() => {
    const customerMap = new Map<string, {
      name: string
      email: string
      phone: string
      bookingsCount: number
      ordersCount: number
      totalSpent: number
      joinedDate: string
    }>()

    // From bookings
    ;(bookings || []).forEach((b) => {
      const key = (b.email || b.customer || "").toLowerCase()
      if (!key) return
      const existing = customerMap.get(key) || {
        name: b.customer,
        email: b.email,
        phone: b.phone,
        bookingsCount: 0,
        ordersCount: 0,
        totalSpent: 0,
        joinedDate: (b.createdAt || new Date().toISOString()).split("T")[0],
      }
      existing.bookingsCount += 1
      existing.totalSpent += b.priceNumeric || 15
      customerMap.set(key, existing)
    })

    // From orders
    ;(orders || []).forEach((o) => {
      const key = (o.email || o.customer || "").toLowerCase()
      if (!key) return
      const existing = customerMap.get(key) || {
        name: o.customer,
        email: o.email,
        phone: o.phone,
        bookingsCount: 0,
        ordersCount: 0,
        totalSpent: 0,
        joinedDate: (o.createdAt || new Date().toISOString()).split("T")[0],
      }
      existing.ordersCount += 1
      existing.totalSpent += o.totalAmount
      customerMap.set(key, existing)
    })

    return Array.from(customerMap.values()).map((c) => {
      const totalActivities = c.bookingsCount + c.ordersCount
      const status: "Active" | "VIP" | "New" =
        c.totalSpent > 60 || totalActivities >= 3
          ? "VIP"
          : totalActivities >= 2
            ? "Active"
            : "New"
      return {
        ...c,
        status,
      }
    })
  }, [bookings, orders])
```

### 4.7 Exposing `refreshCloudData` in `StoreContextType`
Add optional method to `StoreContextType`:
```typescript
export interface StoreContextType {
  // ... existing members
  refreshCloudData: () => Promise<void>
}
```
And pass `refreshCloudData: fetchCloudData` in the Provider value.

---

## 5. Verification & Test Plan

1. **Compilation Check**:
   ```bash
   npm run build
   ```
   Must succeed with zero TypeScript errors or broken imports.

2. **Public Create Persistence Check**:
   Simulate customer creation via `node`:
   - POST `{"action": "public_create", "entity": "bookings", "record": {"customer": "Test Customer", "email": "test@zimthreads.com", "phone": "+263 77 123 4567", "serviceId": "clean"}}`
   - Verify 200 response with created record.
   - Verify `SELECT data FROM public.zimthreads_store WHERE key = 'bookings'` returns the newly prepended booking.

3. **Hydration Check**:
   - GET `/api/store?key=all` returns `{ success: true, data: { products: [...], services: [...], blog_posts: [...], settings: {...}, bookings: [...], orders: [...], inquiries: [...] } }`.
   - On page mount or refresh, React state contains the persistent cloud records.

4. **Admin Mutation Sync Check**:
   - Trigger `updateBookingStatus("BK-...", "Confirmed")`
   - Verify `syncToCloud` writes updated list to Neon DB.
   - Reload page and verify state remains "Confirmed".
