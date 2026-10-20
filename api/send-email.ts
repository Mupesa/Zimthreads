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
 * Generates plain-text alternative of the showcase email.
 * Critical for deliverability to ensure emails land in Primary inbox instead of Promotions/Spam.
 */
export function renderZimthreadsPlainTextEmail(params: {
  recipientName: string
  headline: string
  introMessage: string
  products: ProductPitchItem[]
  ctaText?: string
  ctaUrl?: string
}): string {
  const { recipientName, headline, introMessage, products, ctaText, ctaUrl } = params
  const primaryUrl = ctaUrl || "https://zimthreads.online/shop"

  let text = `Z I M T H R E A D S\n`
  text += `COLLECTIVE & BESPOKE THREADS\n`
  text += `--------------------------------------------------\n\n`
  text += `${headline}\n\n`
  text += `Hi ${recipientName},\n\n`
  text += `${introMessage}\n\n`
  text += `CURATED SELECTION FOR YOU:\n`
  text += `--------------------------------------------------\n`

  products.forEach((p, idx) => {
    text += `\n${idx + 1}. ${p.name.toUpperCase()}\n`
    if (p.category) text += `   Category: ${p.category}\n`
    text += `   Price: Rs ${Number(p.price).toLocaleString()}\n`
    if (p.sizes && p.sizes.length > 0) text += `   Available Sizes: ${p.sizes.join(", ")}\n`
    if (p.description) text += `   Details: ${p.description}\n`
    text += `   View item: ${primaryUrl}\n`
  })

  text += `\n--------------------------------------------------\n`
  text += `${ctaText || "Explore Full Collection"}: ${primaryUrl}\n\n`
  text += `BESPOKE SIZING & STYLING CONCIERGE:\n`
  text += `Need custom fitting or alterations? Chat with us on WhatsApp: https://wa.me/23055132614\n\n`
  text += `Zimthreads Collective • Mauritius\n`
  text += `Contact: zimthreadmu@gmail.com | +230 5513 2614\n`

  return text
}

/**
 * Compiles a luxury, 100% mobile-responsive dark-mode HTML email template for Zimthreads.
 * Optimized specifically for Android/Redmi, iOS Mail, and Gmail.
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

  // Product cards HTML with fluid table stacking
  const productCardsHtml = products
    .map((p) => {
      // Ensure image URL is optimized for email
      let imgUrl = p.img || "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80"
      if (imgUrl.includes("cloudinary.com") && !imgUrl.includes("f_auto")) {
        imgUrl = imgUrl.replace("/upload/", "/upload/f_auto,q_auto:good,w_600/")
      }

      const sizesBadge =
        p.sizes && p.sizes.length > 0
          ? `<div style="font-size: 11px; color: #9ca3af; margin: 4px 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Sizes: <strong style="color: #d1d5db;">${p.sizes.join(", ")}</strong></div>`
          : ""

      return `
      <!-- PRODUCT CARD -->
      <tr>
        <td style="padding-bottom: 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="background-color: #161e2e; border: 1px solid #243048; border-radius: 8px; overflow: hidden;">
            <tr>
              <td style="padding: 14px;">
                <!-- DESKTOP / TABLET TWO-COLUMN (STACKS ON MOBILE) -->
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                  <tr>
                    <!-- IMAGE COLUMN -->
                    <th class="stack-column" width="140" valign="top" align="left" style="font-weight: normal; padding: 0 16px 0 0;">
                      <img src="${imgUrl}" alt="${p.name}" class="product-img" width="140" style="width: 140px; max-width: 140px; height: 140px; object-fit: cover; border-radius: 6px; border: 1px solid #374151; display: block;" />
                    </th>
                    <!-- DETAILS COLUMN -->
                    <th class="stack-column content-column" valign="top" align="left" style="font-weight: normal; padding: 0;">
                      ${
                        p.category
                          ? `<div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #86a84e; margin-bottom: 4px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">${p.category}</div>`
                          : ""
                      }
                      <h3 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: #ffffff; line-height: 1.35; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                        ${p.name}
                      </h3>
                      ${
                        p.description
                          ? `<p style="margin: 0 0 8px 0; font-size: 12.5px; color: #9ca3af; line-height: 1.45; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">${p.description.slice(0, 110)}${p.description.length > 110 ? "..." : ""}</p>`
                          : ""
                      }
                      ${sizesBadge}
                      
                      <!-- PRICE & BUTTON TABLE (EMAIL-SAFE REPLACEMENT FOR FLEXBOX) -->
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin-top: 8px;">
                        <tr>
                          <td align="left" valign="middle" style="padding-right: 10px;">
                            <span style="font-size: 16px; font-weight: 800; color: #86a84e; font-family: monospace, -apple-system, sans-serif; white-space: nowrap;">
                              Rs ${Number(p.price).toLocaleString()}
                            </span>
                          </td>
                          <td align="right" valign="middle">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn-table">
                              <tr>
                                <td align="center" style="background-color: #4a5c2d; border-radius: 4px;">
                                  <a href="${primaryUrl}" target="_blank" style="display: inline-block; padding: 8px 16px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; font-weight: 700; color: #ffffff; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">
                                    View Item &rarr;
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                    </th>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      `
    })
    .join("")

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>${headline}</title>
  <style type="text/css">
    /* RESETS */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #0b0f17; }

    /* MOBILE RESPONSIVE STYLES (ANDROID / REDMI / IOS) */
    @media only screen and (max-width: 580px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 0 !important;
        border-left: 0 !important;
        border-right: 0 !important;
      }
      .mobile-shell-padding {
        padding: 10px 0 !important;
      }
      .mobile-pad {
        padding: 20px 16px !important;
      }
      .mobile-header-pad {
        padding: 24px 16px 20px 16px !important;
      }
      .mobile-products-pad {
        padding: 0 14px 16px 14px !important;
      }
      .stack-column {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        padding-right: 0 !important;
      }
      .content-column {
        padding-top: 12px !important;
      }
      .product-img {
        width: 100% !important;
        max-width: 100% !important;
        height: 200px !important;
        object-fit: cover !important;
        display: block !important;
      }
      .btn-table {
        width: 100% !important;
      }
      .mobile-full-width {
        width: 100% !important;
        display: block !important;
      }
      .mobile-full-width a {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        text-align: center !important;
      }
      .concierge-cell {
        display: block !important;
        width: 100% !important;
        text-align: left !important;
        box-sizing: border-box !important;
      }
      .concierge-btn-cell {
        display: block !important;
        width: 100% !important;
        margin-top: 12px !important;
        box-sizing: border-box !important;
      }
      .concierge-btn-cell a {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
        box-sizing: border-box !important;
      }
      h1 {
        font-size: 20px !important;
        letter-spacing: 3px !important;
      }
      h2 {
        font-size: 18px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #d1d5db;">
  <!-- PREHEADER SNIPPET (PREVENTS EMAIL CLIENTS FROM PULLING RANDOM HTML TEXT INTO PREVIEW) -->
  <div style="display: none; font-size: 1px; color: #0b0f17; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${headline} &bull; Curated selection from Zimthreads Atelier.
  </div>

  <!-- OUTER SHELL -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="background-color: #0b0f17; margin: 0; padding: 0;">
    <tr>
      <td align="center" class="mobile-shell-padding" style="padding: 24px 12px;">
        
        <!-- MAIN CARD CONTAINER (MAX 580PX FOR EMAIL COMPATIBILITY) -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 580px; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; margin: 0 auto;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td align="center" class="mobile-header-pad" style="padding: 28px 24px 22px 24px; background-color: #121926; border-bottom: 2px solid #4a5c2d;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 4px; color: #ffffff; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                Z I M T H R E A D S
              </h1>
              <p style="margin: 5px 0 0 0; font-size: 10px; letter-spacing: 2px; color: #86a84e; text-transform: uppercase; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                COLLECTIVE & BESPOKE ATELIER
              </p>
            </td>
          </tr>

          <!-- PERSONAL GREETING & INTRO -->
          <tr>
            <td class="mobile-pad" style="padding: 26px 26px 18px 26px;">
              <h2 style="margin: 0 0 12px 0; font-size: 19px; font-weight: 800; color: #ffffff; line-height: 1.35; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                ${headline}
              </h2>
              <p style="margin: 0 0 14px 0; font-size: 14px; color: #e5e7eb; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                Hi <strong style="color: #ffffff;">${recipientName}</strong>,
              </p>
              <div style="font-size: 13.5px; color: #d1d5db; line-height: 1.6; background-color: #1a2234; padding: 14px 16px; border-radius: 6px; border-left: 3px solid #86a84e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                ${introMessage.replace(/\n/g, "<br>")}
              </div>
            </td>
          </tr>

          <!-- CURATED SELECTION HEADER -->
          <tr>
            <td class="mobile-products-pad" style="padding: 0 26px 4px 26px;">
              <div style="padding-top: 10px; padding-bottom: 8px; border-top: 1px solid #243048;">
                <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #86a84e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  CURATED PIECES FOR YOU
                </span>
              </div>
            </td>
          </tr>

          <!-- PRODUCT LIST -->
          <tr>
            <td class="mobile-products-pad" style="padding: 0 26px 16px 26px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                ${productCardsHtml}
              </table>
            </td>
          </tr>

          <!-- PRIMARY STORE CTA -->
          <tr>
            <td align="center" class="mobile-pad" style="padding: 10px 26px 26px 26px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="mobile-full-width">
                <tr>
                  <td align="center" style="background-color: #4a5c2d; border-radius: 6px;">
                    <a href="${primaryUrl}" target="_blank" style="display: inline-block; padding: 13px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; font-weight: 800; color: #ffffff; text-decoration: none; text-transform: uppercase; letter-spacing: 1px; border-radius: 6px;">
                      ${primaryCta} &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- WHATSAPP CONCIERGE STRIP -->
          <tr>
            <td class="mobile-pad" style="padding: 18px 26px; background-color: #141c2c; border-top: 1px solid #1f2937; border-bottom: 1px solid #1f2937;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                <tr>
                  <td class="concierge-cell" valign="middle">
                    <p style="margin: 0; font-size: 13px; font-weight: 700; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                      Need Bespoke Fitting or Private Consultation?
                    </p>
                    <p style="margin: 3px 0 0 0; font-size: 12px; color: #9ca3af; line-height: 1.4; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                      Connect directly with our styling team on WhatsApp for custom orders.
                    </p>
                  </td>
                  <td class="concierge-btn-cell" align="right" valign="middle" width="110">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background-color: #25D366; border-radius: 4px;">
                          <a href="https://wa.me/23055132614" target="_blank" style="display: inline-block; padding: 8px 14px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; font-weight: 800; color: #ffffff; text-decoration: none; white-space: nowrap;">
                            WhatsApp
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" class="mobile-pad" style="padding: 24px 20px; background-color: #0d121c; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #86a84e; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                ZIMTHREADS COLLECTIVE &bull; MAURITIUS
              </p>
              <p style="margin: 0 0 10px 0; font-size: 11px; color: #6b7280; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                Handcrafted Streetwear &bull; Archival Racing Jackets &bull; Sneaker Restoration
              </p>
              <p style="margin: 0; font-size: 11px; color: #4b5563; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                Direct: <a href="mailto:zimthreadmu@gmail.com" style="color: #9ca3af; text-decoration: none;">zimthreadmu@gmail.com</a> &bull; +230 5513 2614
              </p>
              <p style="margin: 10px 0 0 0; font-size: 10px; color: #374151; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
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

    // Generate plain-text alternative (essential for landing in Primary inbox)
    const textContent = renderZimthreadsPlainTextEmail({
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

    const fromAddress = getEnv("RESEND_FROM_EMAIL") || "Zimthreads Collective <concierge@zimthreads.online>"
    const recipients = Array.isArray(to) ? to : [to]

    // Dispatch via Resend API with both HTML and Plain-Text + personal reply-to
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
        text: textContent,
        reply_to: "zimthreadmu@gmail.com",
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
