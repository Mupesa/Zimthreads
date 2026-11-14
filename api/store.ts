const NEON_CONNECTION_STRING =
  process.env.NEON_DATABASE_URL ||
  "postgresql://neondb_owner:npg_DR0tIYcQyeX8@ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require"

const NEON_HOST = "ep-icy-brook-b4bmxdh6-pooler.c-6.us-east-2.aws.neon.tech"

export async function executeSql(query: string, params: any[] = []) {
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

let isInitialized = false

export async function ensureDbInitialized() {
  if (isInitialized) return
  try {
    await executeSql(`
      CREATE TABLE IF NOT EXISTS public.zimthreads_store (
        key text PRIMARY KEY,
        data jsonb NOT NULL,
        updated_at timestamptz DEFAULT now()
      );
    `)
    await executeSql(`
      INSERT INTO public.zimthreads_store (key, data, updated_at)
      VALUES 
        ('bookings', '[]'::jsonb, NOW()),
        ('orders', '[]'::jsonb, NOW()),
        ('inquiries', '[]'::jsonb, NOW()),
        ('products', '[]'::jsonb, NOW()),
        ('services', '[]'::jsonb, NOW()),
        ('blog_posts', '[]'::jsonb, NOW()),
        ('settings', '{}'::jsonb, NOW()),
        ('custom_customers', '[]'::jsonb, NOW()),
        ('subscribers', '[]'::jsonb, NOW())
      ON CONFLICT (key) DO NOTHING;
    `)
    isInitialized = true
  } catch (err) {
    console.error("Failed to initialize database tables:", err)
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ALLOWED_PUBLIC_ENTITIES = new Set(["bookings", "orders", "inquiries", "subscribers"])

function validateSubscriberRecord(record: any): string | null {
  if (!record || typeof record !== "object") {
    return "Missing subscriber record"
  }
  const email = String(record.email || "").trim()
  if (!email || !EMAIL_REGEX.test(email)) {
    return "Validation failed: invalid email address"
  }
  return null
}

function validateBookingRecord(record: any): string | null {
  if (!record || typeof record !== "object") {
    return "Missing booking record"
  }
  const customer = String(record.customer || "").trim()
  if (!customer) return "Validation failed: customer cannot be empty"

  const email = String(record.email || "").trim()
  if (!email || !EMAIL_REGEX.test(email)) return "Validation failed: invalid email address"

  const phone = String(record.phone || "").trim()
  if (!phone) return "Validation failed: phone cannot be empty"

  const serviceId = String(record.serviceId || "").trim()
  if (!serviceId) return "Validation failed: serviceId cannot be empty"

  return null
}

function validateOrderRecord(record: any): string | null {
  if (!record || typeof record !== "object") {
    return "Missing order record"
  }
  const customer = String(record.customer || "").trim()
  if (!customer) return "Validation failed: customer cannot be empty"

  const email = String(record.email || "").trim()
  if (!email || !EMAIL_REGEX.test(email)) return "Validation failed: invalid email address"

  const phone = String(record.phone || "").trim()
  if (!phone) return "Validation failed: phone cannot be empty"

  if (!Array.isArray(record.items) || record.items.length === 0) {
    return "Validation failed: order must contain at least one item"
  }

  return null
}

function validateInquiryRecord(record: any): string | null {
  if (!record || typeof record !== "object") {
    return "Missing inquiry record"
  }
  const name = String(record.name || "").trim()
  if (!name) return "Validation failed: name cannot be empty"

  const email = String(record.email || "").trim()
  if (!email || !EMAIL_REGEX.test(email)) return "Validation failed: invalid email address"

  const subject = String(record.subject || "").trim()
  if (!subject) return "Validation failed: subject cannot be empty"

  const message = String(record.message || "").trim()
  if (!message) return "Validation failed: message cannot be empty"

  return null
}

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  try {
    await ensureDbInitialized()

    if (req.method === "GET") {
      const queryKey =
        req.query?.key ||
        (req.url && new URL(req.url, "http://localhost").searchParams.get("key"))

      if (queryKey && queryKey !== "all") {
        const rows = await executeSql(
          "SELECT key, data, updated_at FROM public.zimthreads_store WHERE key = $1;",
          [queryKey],
        )
        if (rows.length === 0) {
          const defaultData = queryKey === "settings" ? {} : []
          return res.status(200).json({
            success: true,
            key: queryKey,
            data: defaultData,
            updatedAt: null,
          })
        }
        return res.status(200).json({
          success: true,
          key: rows[0].key,
          data: rows[0].data,
          updatedAt: rows[0].updated_at,
        })
      }

      // Default or key=all: return all store data
      const rows = await executeSql(
        "SELECT key, data FROM public.zimthreads_store;",
      )
      const storeData: Record<string, any> = {
        products: [],
        services: [],
        blog_posts: [],
        settings: {},
        bookings: [],
        orders: [],
        inquiries: [],
        subscribers: [],
        custom_customers: [],
      }
      for (const row of rows) {
        storeData[row.key] = row.data
      }
      return res.status(200).json({ success: true, data: storeData })
    }

    if (req.method === "POST") {
      let body = req.body
      if (typeof body === "string") {
        try {
          body = JSON.parse(body)
        } catch {
          return res.status(400).json({ error: "Malformed JSON body" })
        }
      }
      body = body || {}

      const action = body.action

      // Public Customer Submission (Unauthenticated)
      if (action === "public_create") {
        const { entity, record } = body

        if (!entity || !ALLOWED_PUBLIC_ENTITIES.has(entity)) {
          return res.status(400).json({
            error: `Entity '${entity}' not permitted for public_create. Allowed: bookings, orders, inquiries`,
          })
        }

        let validationError: string | null = null
        if (entity === "bookings") validationError = validateBookingRecord(record)
        else if (entity === "orders") validationError = validateOrderRecord(record)
        else if (entity === "inquiries") validationError = validateInquiryRecord(record)
        else if (entity === "subscribers") validationError = validateSubscriberRecord(record)

        if (validationError) {
          return res.status(400).json({ error: validationError })
        }

        const now = new Date()
        let preparedRecord: any

        if (entity === "subscribers") {
          preparedRecord = {
            ...record,
            id: record.id || `SUB-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase(),
            email: String(record.email).trim().toLowerCase(),
            name: record.name ? String(record.name).trim() : "",
            source: record.source || "event_qr",
            event: record.event || "oasis_beach_bar",
            code: record.code || "OASIS10",
            redeemed: typeof record.redeemed === "boolean" ? record.redeemed : false,
            createdAt: record.createdAt || now.toISOString(),
            updatedAt: now.toISOString(),
          }

          // Check if email already exists in subscribers array for graceful deduplication
          const existingRows = await executeSql(
            "SELECT data FROM public.zimthreads_store WHERE key = 'subscribers';",
          )
          let existingArray: any[] = []
          if (existingRows.length > 0 && Array.isArray(existingRows[0].data)) {
            existingArray = existingRows[0].data
          }
          const existingIndex = existingArray.findIndex(
            (s: any) => s && s.email && s.email.toLowerCase() === preparedRecord.email,
          )

          // Dispatch confirmation email in background if Resend API key is available
          const resendKey = process.env.RESEND_API_KEY
          if (resendKey && preparedRecord.email) {
            fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from:
                  process.env.RESEND_FROM_EMAIL ||
                  "Zimthreads Collective <concierge@zimthreads.online>",
                to: preparedRecord.email,
                subject: `🎉 Zimthreads VIP Pass: 10% OFF (${preparedRecord.code || "OASIS10"})`,
                html: `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif; background: #0d1117; color: #f5f2ec; padding: 28px; border-radius: 16px; max-width: 480px; margin: auto; border: 1px solid #374151;">
                    <div style="text-align: center; margin-bottom: 20px;">
                      <div style="color: #86a84e; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Zimthreads Collective</div>
                      <h1 style="color: #ffffff; font-size: 24px; margin: 4px 0; text-transform: uppercase;">You're on the VIP List!</h1>
                      <p style="color: #9ca3af; font-size: 13px; margin: 0;">Captured at ${preparedRecord.event || "Oasis Beach Bar"}</p>
                    </div>
                    <div style="background: #161b22; border: 2px solid #fbbf24; border-radius: 14px; padding: 20px; text-align: center; margin: 20px 0;">
                      <div style="font-size: 11px; text-transform: uppercase; color: #9ca3af; letter-spacing: 1.5px;">Your 10% Event Discount Code</div>
                      <div style="font-size: 34px; font-weight: 800; font-family: monospace; color: #fbbf24; margin: 8px 0; letter-spacing: 3px;">${preparedRecord.code || "OASIS10"}</div>
                      <div style="font-size: 11px; color: #86a84e; font-weight: bold;">★ 10% OFF T-SHIRTS, RACING JACKETS & SNEAKER RESTORATION</div>
                    </div>
                    <p style="font-size: 13px; color: #d1d5db; line-height: 1.5; text-align: center;">Show this code on your phone to <strong>Shepherd, Davies, or Anesu</strong> at the booth right now, or use it online at <a href="https://www.zimthreads.online/shop" style="color: #86a84e; text-decoration: underline;">zimthreads.online/shop</a>.</p>
                  </div>
                `,
              }),
            }).catch((err) => console.warn("[Resend] Email dispatch notice:", err))
          }
          if (existingIndex >= 0) {
            existingArray[existingIndex] = {
              ...existingArray[existingIndex],
              ...preparedRecord,
              id: existingArray[existingIndex].id,
              scanCount: (existingArray[existingIndex].scanCount || 1) + 1,
              updatedAt: now.toISOString(),
            }
            await executeSql(
              `UPDATE public.zimthreads_store SET data = $1::jsonb, updated_at = NOW() WHERE key = 'subscribers';`,
              [JSON.stringify(existingArray)],
            )
            return res.status(200).json({ success: true, record: existingArray[existingIndex], isExisting: true })
          }
        } else if (entity === "bookings") {
          preparedRecord = {
            ...record,
            id: record.id || `BK-${Math.floor(1000 + Math.random() * 9000)}`,
            customer: String(record.customer).trim(),
            email: String(record.email).trim().toLowerCase(),
            phone: String(record.phone).trim(),
            serviceId: String(record.serviceId).trim(),
            serviceName: record.serviceName || record.serviceId,
            price: record.price || "Rs 300",
            priceNumeric:
              typeof record.priceNumeric === "number" ? record.priceNumeric : 300,
            date: record.date || now.toISOString().split("T")[0],
            time: record.time || "09:00",
            notes: record.notes || "",
            status: record.status || "Pending",
            createdAt: record.createdAt || now.toISOString(),
          }
        } else if (entity === "orders") {
          preparedRecord = {
            ...record,
            id: record.id || `ORD-${Math.floor(100 + Math.random() * 900)}`,
            customer: String(record.customer).trim(),
            email: String(record.email).trim().toLowerCase(),
            phone: String(record.phone).trim(),
            items: record.items,
            address: record.address || "",
            city: record.city || "Mauritius",
            paymentMethod: record.paymentMethod || "Juice by MCB",
            totalAmount:
              typeof record.totalAmount === "number" ? record.totalAmount : 0,
            status: record.status || "Processing",
            date:
              record.date ||
              now.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
            createdAt: record.createdAt || now.toISOString(),
          }
        } else {
          preparedRecord = {
            ...record,
            id: record.id || `INQ-${Math.floor(100 + Math.random() * 900)}`,
            name: String(record.name).trim(),
            email: String(record.email).trim().toLowerCase(),
            subject: String(record.subject).trim(),
            message: String(record.message).trim(),
            read: typeof record.read === "boolean" ? record.read : false,
            date:
              record.date ||
              now.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
            createdAt: record.createdAt || now.toISOString(),
          }
        }

        const query = `
          INSERT INTO public.zimthreads_store (key, data, updated_at)
          VALUES ($1, jsonb_build_array($2::jsonb), NOW())
          ON CONFLICT (key) DO UPDATE
          SET data = CASE 
                WHEN jsonb_typeof(zimthreads_store.data) = 'array' 
                THEN jsonb_build_array($2::jsonb) || COALESCE(zimthreads_store.data, '[]'::jsonb)
                ELSE jsonb_build_array($2::jsonb)
              END,
              updated_at = NOW()
          RETURNING key;
        `
        await executeSql(query, [entity, JSON.stringify(preparedRecord)])

        return res.status(200).json({ success: true, record: preparedRecord })
      }

      // Administrative Operations (Requires adminToken === "Zimthreads200")
      const { adminToken } = body

      if (adminToken !== "Zimthreads200") {
        return res.status(401).json({ error: "Unauthorized" })
      }

      // 1. Admin Sync / Legacy Upsert
      if (action === "sync" || (!action && body.key !== undefined)) {
        const { key, data } = body

        if (!key || data === undefined) {
          return res.status(400).json({ error: "Missing key or data" })
        }

        if (
          (key === "products" || key === "services" || key === "blog_posts") &&
          Array.isArray(data) &&
          data.length === 0 &&
          !body.forceEmpty
        ) {
          return res.status(400).json({
            error: `Refusing to overwrite collection '${key}' with an empty array. Pass forceEmpty: true if this is intentional.`,
          })
        }

        // Always sanitize products to ensure only ONE consolidated bracelet card exists
        let sanitizedData = data
        if (key === "products" && Array.isArray(data)) {
          sanitizedData = data.filter(
            (p: any) =>
              p &&
              (!p.id.startsWith("prod-brace-") ||
                p.id === "prod-brace-heritage"),
          )
        }

        const query = `
          INSERT INTO public.zimthreads_store (key, data, updated_at)
          VALUES ($1, $2::jsonb, NOW())
          ON CONFLICT (key) DO UPDATE
          SET data = EXCLUDED.data, updated_at = NOW()
          RETURNING key;
        `
        await executeSql(query, [key, JSON.stringify(sanitizedData)])

        const count = Array.isArray(sanitizedData)
          ? sanitizedData.length
          : typeof sanitizedData === "object" && sanitizedData
            ? Object.keys(sanitizedData).length
            : 1

        return res.status(200).json({ success: true, key, updated: key, count })
      }

      // 2. Admin Batch Update Products
      if (action === "batch_update_products") {
        const { updates } = body

        if (!Array.isArray(updates)) {
          return res.status(400).json({ error: "Missing or invalid updates array" })
        }

        const rows = await executeSql(
          "SELECT data FROM public.zimthreads_store WHERE key = 'products';",
        )
        const currentProducts: any[] =
          rows.length > 0 && Array.isArray(rows[0].data) ? rows[0].data : []

        const updatesMap = new Map<string, any>()
        for (const u of updates) {
          if (u && u.id && u.changes) {
            updatesMap.set(u.id, u.changes)
          }
        }

        let updatedCount = 0
        const newProducts = currentProducts.map((prod) => {
          if (updatesMap.has(prod.id)) {
            updatedCount++
            return { ...prod, ...updatesMap.get(prod.id) }
          }
          return prod
        })

        await executeSql(
          `
          INSERT INTO public.zimthreads_store (key, data, updated_at)
          VALUES ('products', $1::jsonb, NOW())
          ON CONFLICT (key) DO UPDATE
          SET data = EXCLUDED.data, updated_at = NOW()
          RETURNING key;
        `,
          [JSON.stringify(newProducts)],
        )

        return res.status(200).json({ success: true, updatedCount })
      }

      // 3. Admin Update Single Entity
      if (action === "update_entity") {
        const { entity, id, updates } = body

        if (!entity || !id || !updates || typeof updates !== "object") {
          return res.status(400).json({ error: "Missing entity, id, or updates" })
        }

        const rows = await executeSql(
          "SELECT data FROM public.zimthreads_store WHERE key = $1;",
          [entity],
        )
        const currentList: any[] =
          rows.length > 0 && Array.isArray(rows[0].data) ? rows[0].data : []
        const index = currentList.findIndex(
          (item) => String(item.id) === String(id),
        )

        if (index === -1) {
          return res
            .status(404)
            .json({ error: `Entity not found with id: ${id}` })
        }

        const updatedRecord = { ...currentList[index], ...updates }
        currentList[index] = updatedRecord

        await executeSql(
          `
          INSERT INTO public.zimthreads_store (key, data, updated_at)
          VALUES ($1, $2::jsonb, NOW())
          ON CONFLICT (key) DO UPDATE
          SET data = EXCLUDED.data, updated_at = NOW()
          RETURNING key;
        `,
          [entity, JSON.stringify(currentList)],
        )

        return res
          .status(200)
          .json({ success: true, entity, id, updatedRecord })
      }

      // 4. Admin Delete Single Entity
      if (action === "delete_entity") {
        const { entity, id } = body

        if (!entity || !id) {
          return res.status(400).json({ error: "Missing entity or id" })
        }

        const rows = await executeSql(
          "SELECT data FROM public.zimthreads_store WHERE key = $1;",
          [entity],
        )
        const currentList: any[] =
          rows.length > 0 && Array.isArray(rows[0].data) ? rows[0].data : []
        const filtered = currentList.filter(
          (item) => String(item.id) !== String(id),
        )

        await executeSql(
          `
          INSERT INTO public.zimthreads_store (key, data, updated_at)
          VALUES ($1, $2::jsonb, NOW())
          ON CONFLICT (key) DO UPDATE
          SET data = EXCLUDED.data, updated_at = NOW()
          RETURNING key;
        `,
          [entity, JSON.stringify(filtered)],
        )

        return res.status(200).json({ success: true, entity, id })
      }

      return res.status(400).json({ error: `Unknown action: ${action}` })
    }

    return res.status(405).json({ error: "Method not allowed" })
  } catch (err: any) {
    console.error("API error:", err)
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" })
  }
}
