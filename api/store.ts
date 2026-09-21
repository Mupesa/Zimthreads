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

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  try {
    if (req.method === "GET") {
      const rows = await executeSql(
        "SELECT key, data FROM public.zimthreads_store;",
      )
      const storeData: Record<string, any> = {}
      for (const row of rows) {
        storeData[row.key] = row.data
      }
      return res.status(200).json({ success: true, data: storeData })
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {}
      const { key, data, adminToken } = body

      if (adminToken !== "Zimthreads200") {
        return res.status(401).json({ error: "Unauthorized" })
      }

      if (!key || data === undefined) {
        return res.status(400).json({ error: "Missing key or data" })
      }

      const query = `
        INSERT INTO public.zimthreads_store (key, data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (key) DO UPDATE
        SET data = EXCLUDED.data, updated_at = NOW()
        RETURNING key;
      `
      await executeSql(query, [key, JSON.stringify(data)])

      return res.status(200).json({ success: true, updated: key })
    }

    return res.status(405).json({ error: "Method not allowed" })
  } catch (err: any) {
    console.error("API error:", err)
    return res.status(500).json({ error: err.message || "Internal server error" })
  }
}
