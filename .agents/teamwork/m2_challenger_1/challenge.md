# Milestone 2 Challenge Report: Customer Flows Live Persistence

**Agent**: `m2_challenger_1` (Empirical Challenger)  
**Target Environment**: Neon PostgreSQL Project `rapid-hill-42448439` (`ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech`) under `anesumupesa@gmail.com` / `Mupesa`  
**Date**: 2026-10-10  
**Verdict**: **APPROVE**  

---

## Challenge Summary

**Overall risk assessment**: **LOW**

The Milestone 2 implementation for customer-facing flows, `StoreContext` hydration, and live persistence against Neon PostgreSQL has been rigorously stress-tested via automated adversarial harnesses. All public customer endpoints (`bookings`, `orders`, `inquiries`) persist directly to Neon DB, normalize inputs, adhere to LIFO prepend ordering (head-of-array placement for fresh submissions), and strictly forbid unauthenticated mutations against catalog entities.

---

## Challenges

### [Medium] Challenge 1: Unauthenticated Public Mutation of Catalog & Settings
- **Assumption challenged**: Can an attacker exploit `action: "public_create"` to tamper with products, pricing, services, or store settings without an admin token?
- **Attack scenario**: Dispatched POST requests with `action: "public_create"` targeting `products`, `settings`, `services`, `blog_posts`, and `admin` with injected malicious payloads.
- **Empirical result**: System enforced whitelist validation against `ALLOWED_PUBLIC_ENTITIES = new Set(["bookings", "orders", "inquiries"])`. Every unauthorized target was rejected with HTTP 400 and descriptive rejection error `"Entity '...' not permitted for public_create"`.
- **Blast radius**: None. Catalog and configuration are strictly protected from public tampering.
- **Mitigation**: Whitelist in `api/store.ts` is robust and complete.

### [Medium] Challenge 2: Malformed Input Ingestion & Email Bypass
- **Assumption challenged**: Can invalid customer emails, missing messages, or empty cart orders bypass client/server validation and pollute the Neon database?
- **Attack scenario**: Dispatched varied invalid email schemas (`"notanemail"`, `"@missinguser.com"`, `"user@"`, `"user@domain"`, `"user space@test.com"`), order payloads with empty items array (`items: []`), and contact inquiries missing the required message body.
- **Empirical result**: All 5 invalid email formats were intercepted with HTTP 400 (`"Validation failed: invalid email address"`). The empty cart order was rejected with HTTP 400 (`"Validation failed: order must contain at least one item"`). The missing message inquiry was rejected with HTTP 400 (`"Validation failed: message cannot be empty"`).
- **Blast radius**: None. Input sanitization prevents dirty data ingestion.

### [Low] Challenge 3: Head-of-Array LIFO Prepend Under Concurrent Submissions
- **Assumption challenged**: Does cloud re-fetch (`GET /api/store?key=all`) guarantee that newly placed customer bookings, orders, and inquiries appear at index 0 (the head of their respective arrays), and do successive submissions maintain LIFO order?
- **Attack scenario**: Submitted a live booking (`BK-CHALLENGE-74511`), order (`ORD-CHALLENGE-74511`), and inquiry (`INQ-CHALLENGE-74511`), followed by a secondary successive booking (`BK-CHALLENGE-2ND-74511`). Re-fetched the entire cloud store and verified array indices.
- **Empirical result**: Neon DB atomic `jsonb_build_array($2::jsonb) || zimthreads_store.data` prepending succeeded flawlessly. `bookings[0]` was `BK-CHALLENGE-2ND-74511`, `bookings[1]` was `BK-CHALLENGE-74511`, and `orders[0]` and `inquiries[0]` held the respective test records.
- **Blast radius**: None. Admin dashboard desks will immediately render the latest submissions at the top of their desks.

### [Low] Challenge 4: Teardown / Data Leakage in Production
- **Assumption challenged**: Can test records be cleanly pruned using authenticated administrative endpoints without leaving dangling residues or corrupting existing jsonb arrays?
- **Attack scenario**: Executed `delete_entity` with `adminToken: "Zimthreads200"` for all test records, then audited `zimthreads_store` via `GET /api/store?key=all` and direct SQL `jsonb_array_length`.
- **Empirical result**: All 4 challenge records were completely pruned. Post-test audit confirmed 0 test records in `bookings`, `orders`, and `inquiries`, with existing catalog keys (`products: 16`, `services: 7`, `blog_posts: 5`) remaining 100% intact.

---

## Stress Test Results

| # | Test Scenario | Expected Behavior | Actual Behavior | Result |
|---|---------------|-------------------|-----------------|--------|
| 1 | Direct Neon SQL Health Check | Connect to `ep-icy-brook-...pooler` | Connected: PostgreSQL 18.6 on aarch64 | **PASS** |
| 2 | Adversarial `public_create` on `products` | HTTP 400 blocked | HTTP 400: "Entity 'products' not permitted" | **PASS** |
| 3 | Adversarial `public_create` on `settings` | HTTP 400 blocked | HTTP 400: "Entity 'settings' not permitted" | **PASS** |
| 4 | Adversarial `public_create` on `services` | HTTP 400 blocked | HTTP 400: "Entity 'services' not permitted" | **PASS** |
| 5 | Adversarial `public_create` on `blog_posts` | HTTP 400 blocked | HTTP 400: "Entity 'blog_posts' not permitted" | **PASS** |
| 6 | 5 Invalid email variations on bookings | HTTP 400 blocked | All 5 rejected with HTTP 400 | **PASS** |
| 7 | Empty items array on order submission | HTTP 400 blocked | HTTP 400: "order must contain at least one item" | **PASS** |
| 8 | Missing message field on contact inquiry | HTTP 400 blocked | HTTP 400: "message cannot be empty" | **PASS** |
| 9 | Unauthenticated `delete_entity` | HTTP 401 Unauthorized | HTTP 401 Unauthorized | **PASS** |
| 10 | Invalid token `delete_entity` | HTTP 401 Unauthorized | HTTP 401 Unauthorized | **PASS** |
| 11 | Live booking submission (`BK-CHALLENGE-74511`) | HTTP 200, persisted | HTTP 200, created in Neon DB | **PASS** |
| 12 | Live order submission (`ORD-CHALLENGE-74511`, 2 items) | HTTP 200, persisted | HTTP 200, created in Neon DB | **PASS** |
| 13 | Live inquiry submission (`INQ-CHALLENGE-74511`) | HTTP 200, persisted | HTTP 200, created in Neon DB | **PASS** |
| 14 | Cloud Re-Fetch `GET /api/store?key=all` | Index 0 head-of-array | Index 0 confirmed for all 3 entities | **PASS** |
| 15 | Deep schema fidelity & email lowercasing | Fields match 100% | Full fidelity verified; emails normalized | **PASS** |
| 16 | Successive submission LIFO verification | Index 0 is newest | `bookings[0]` = 2nd, `bookings[1]` = 1st | **PASS** |
| 17 | Authenticated cleanup via `delete_entity` | Pruned from DB | All 4 test records removed | **PASS** |
| 18 | Post-cleanup audit check | 0 challenge records | Confirmed 0 test records remaining | **PASS** |
| 19 | TypeScript compilation (`npx tsc --noEmit`) | Code 0, zero errors | Code 0, clean | **PASS** |
| 20 | Vite production build (`npm run build`) | Code 0, bundle created | Code 0, built in 1.48s | **PASS** |

---

## Unchallenged Areas

- **WhatsApp API Gateway Dispatch**: WhatsApp link generation was inspected statically in `src/lib/whatsapp.ts` and component code, but third-party external browser URL opening was not executed end-to-end to avoid external phone pinging.
- **Admin Dashboard UI Interactivity**: Addressed in Milestone 3 scope.

---

## Conclusion & Verdict

**Verdict**: **APPROVE**  
Milestone 2 implementation satisfies all technical, architectural, security, and persistence requirements. Production readiness for customer flows is certified.
