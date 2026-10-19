import fs from "node:fs"
import path from "node:path"

export interface ProductPitchItem {
  id: string
  name: string
  category?: string
  price: number
  img: string
  description?: string
  badge?: string
  sizes?: string[]
}

export interface SendEmailPayload {
  adminToken: string
  to: string | string[]
  recipientName?: string
  subject: string
  headline?: string
  introMessage?: string
  products: ProductPitchItem[]
  ctaText?: string
  ctaUrl?: string
  previewOnly?: boolean
}

// Fallback loader for .env / .env.local if not loaded by process environment
function getEnv(key: string): string {
  if (process.env[key]) return process.env[key] as string
  try {
    const cwd = process.cwd()
    for (const file of [".env.local", ".env"]) {
      const fullPath = path.join(cwd, file)
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf-8")
        for (const line of content.split("\n")) {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
          if (match) {
            const k = match[1]
            let v = match[2] || ""
            if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1)
            if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1)
            if (k === key && v) return v.trim()
          }
        }
      }
    }
  } catch (e) {
    // Ignore fs read errors in restricted serverless environments
  }
  return ""
}

/**
 * Compiles a luxury, responsive dark-mode HTML email template for Zimthreads
 */
export function renderZimthreadsProductShowcaseEmail(params: {
  recipientName: string
  headline: string
  introMessage: string
  products: ProductPitchItem[]
  ctaText?: string
  ctaUrl?: string
}): string {
  const { recipientName, headline, introMessage, products, ctaText, ctaUrl } = params
  const primaryCta = ctaText || "Explore Full Collection"
  const primaryUrl = ctaUrl || "https://zimthreads.online/shop"

  // Product cards HTML
  const productRows = products
    .map((p) => {
      // Ensure image URL is optimized for email
      let imgUrl = p.img || "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80"
      if (imgUrl.includes("cloudinary.com") && !imgUrl.includes("f_auto")) {
        imgUrl = imgUrl.replace("/upload/", "/upload/f_auto,q_auto:good,w_600/")
      }

      const sizesBadge =
        p.sizes && p.sizes.length > 0
          ? `<span style="display:inline-block; font-size:11px; color:#9ca3af; margin-top:4px;">Sizes: ${p.sizes.join(", ")}</span>`
          : ""

      return `
      <!-- PRODUCT CARD -->
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #2d3748;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
            <tr>
              <td width="140" valign="top" style="padding-right: 18px;">
                <img src="${imgUrl}" alt="${p.name}" width="140" style="width: 140px; max-width: 140px; height: 140px; object-fit: cover; border-radius: 8px; border: 1px solid #374151; display: block;" />
              </td>
              <td valign="top" style="vertical-align: top;">
                ${
                  p.category
                    ? `<span style="display:inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #86a84e; margin-bottom: 4px;">${p.category}</span>`
                    : ""
                }
                <h3 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: #ffffff; line-height: 1.3;">${p.name}</h3>
                ${
                  p.description
                    ? `<p style="margin: 0 0 10px 0; font-size: 13px; color: #9ca3af; line-height: 1.4;">${p.description.slice(0, 110)}${p.description.length > 110 ? "..." : ""}</p>`
                    : ""
                }
                <div>${sizesBadge}</div>
                <div style="margin-top: 10px; display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-size: 17px; font-weight: 800; color: #86a84e; font-family: monospace;">Rs ${Number(p.price).toLocaleString()}</span>
                  <a href="${primaryUrl}" target="_blank" style="display: inline-block; background-color: #4a5c2d; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 14px; border-radius: 4px;">View Item &rarr;</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      `
    })
    .join("")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${headline}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #d1d5db;">
  <!-- PREHEADER SNIPPET -->
  <div style="display: none; font-size: 1px; color: #0b0f17; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${headline} &bull; Handpicked pieces curated for you by Zimthreads Collective.
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="background-color: #0b0f17; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 30px 15px;">
        <!-- MAIN CONTAINER -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- BRAND HEADER -->
          <tr>
            <td align="center" style="padding: 32px 24px 24px 24px; background: linear-gradient(180deg, #182216 0%, #111827 100%); border-bottom: 2px solid #4a5c2d;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 4px; color: #ffffff; text-transform: uppercase;">Z I M T H R E A D S</h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; letter-spacing: 2px; color: #86a84e; text-transform: uppercase; font-weight: 600;">COLLECTIVE & BESPOKE THREADS</p>
            </td>
          </tr>

          <!-- HERO INTRO -->
          <tr>
            <td style="padding: 28px 28px 20px 28px;">
              <h2 style="margin: 0 0 14px 0; font-size: 20px; font-weight: 800; color: #ffffff; line-height: 1.3;">
                ${headline}
              </h2>
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #9ca3af; line-height: 1.6;">
                Hi <strong style="color: #ffffff;">${recipientName}</strong>,
              </p>
              <div style="font-size: 14px; color: #d1d5db; line-height: 1.6; background-color: #1a2234; padding: 16px; border-radius: 8px; border-left: 3px solid #86a84e;">
                ${introMessage.replace(/\n/g, "<br>")}
              </div>
            </td>
          </tr>

          <!-- PRODUCTS LIST -->
          <tr>
            <td style="padding: 0 28px 20px 28px;">
              <div style="padding: 10px 0; border-top: 1px solid #2d3748; margin-bottom: 6px;">
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #86a84e;">CURATED SELECTION FOR YOU</span>
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                ${productRows}
              </table>
            </td>
          </tr>

          <!-- MAIN CTA BUTTON -->
          <tr>
            <td align="center" style="padding: 10px 28px 30px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #4a5c2d;">
                    <a href="${primaryUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 13px; font-weight: 800; color: #ffffff; text-decoration: none; text-transform: uppercase; letter-spacing: 1px; border-radius: 6px;">
                      ${primaryCta} &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CONCIERGE & FITTING STRIP -->
          <tr>
            <td style="padding: 20px 28px; background-color: #141c2c; border-top: 1px solid #1f2937; border-bottom: 1px solid #1f2937;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 13px; font-weight: 700; color: #ffffff;">Need Bespoke Sizing or Custom Alterations?</p>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #9ca3af;">Chat with our styling concierge directly on WhatsApp for reserved drops & private fittings.</p>
                  </td>
                  <td align="right" width="120">
                    <a href="https://wa.me/23055132614" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff; font-size: 11px; font-weight: 700; text-decoration: none; padding: 8px 14px; border-radius: 4px;">WhatsApp</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding: 28px 24px; background-color: #0d121c; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #86a84e; text-transform: uppercase;">
                ZIMTHREADS COLLECTIVE &bull; MAURITIUS
              </p>
              <p style="margin: 0 0 12px 0; font-size: 11px; color: #6b7280; line-height: 1.5;">
                Handcrafted streetwear &bull; Archival Racing Jackets &bull; Premium Care
              </p>
              <p style="margin: 0; font-size: 11px; color: #4b5563;">
                Contact: <a href="mailto:zimthreadmu@gmail.com" style="color: #9ca3af; text-decoration: none;">zimthreadmu@gmail.com</a> &bull; +230 5513 2614
              </p>
              <p style="margin: 12px 0 0 0; font-size: 10px; color: #374151;">
                &copy; ${new Date().getFullYear()} Zimthreads Collective. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Serverless HTTP Handler for /api/send-email
 */
export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." })
  }

  try {
    let body = req.body
    if (typeof body === "string") {
      try {
        body = JSON.parse(body)
      } catch {
        return res.status(400).json({ error: "Malformed JSON payload" })
      }
    }
    body = body || {}

    const {
      adminToken,
      to,
      recipientName,
      subject,
      headline,
      introMessage,
      products,
      ctaText,
      ctaUrl,
      previewOnly,
    } = body as SendEmailPayload

    // Strict Admin Authorization
    if (adminToken !== "Zimthreads200") {
      return res.status(401).json({ error: "Unauthorized: Invalid admin token" })
    }

    if (!to || (Array.isArray(to) && to.length === 0)) {
      return res.status(400).json({ error: "Missing recipient email address ('to')" })
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: "Missing email subject" })
    }

    // Generate responsive HTML template
    const htmlContent = renderZimthreadsProductShowcaseEmail({
      recipientName: recipientName || "Valued Client",
      headline: headline || subject || "Curated Products for You",
      introMessage:
        introMessage ||
        "We've curated this exclusive selection of handcrafted streetwear and archival pieces tailored to your style.",
      products: Array.isArray(products) ? products : [],
      ctaText: ctaText || "Explore Full Collection",
      ctaUrl: ctaUrl || "https://zimthreads.online/shop",
    })

    // If client only requested HTML preview
    if (previewOnly) {
      return res.status(200).json({
        success: true,
        preview: true,
        html: htmlContent,
      })
    }

    const apiKey = getEnv("RESEND_API_KEY")
    if (!apiKey) {
      return res.status(500).json({
        error: "RESEND_API_KEY is not configured in environment variables.",
        previewHtml: htmlContent,
      })
    }

    const fromAddress = getEnv("RESEND_FROM_EMAIL") || "Zimthreads Collective <onboarding@resend.dev>"
    const recipients = Array.isArray(to) ? to : [to]

    // Dispatch via Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: recipients,
        subject: subject.trim(),
        html: htmlContent,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      return res.status(resendResponse.status).json({
        error: resendData.message || "Failed to dispatch email via Resend API",
        details: resendData,
      })
    }

    return res.status(200).json({
      success: true,
      id: resendData.id,
      recipientsCount: recipients.length,
      message: `Email successfully dispatched to ${recipients.length} recipient(s)`,
    })
  } catch (err: any) {
    console.error("[api/send-email] Error:", err)
    return res.status(500).json({ error: err.message || "Internal server error" })
  }
}
