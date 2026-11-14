import base64
import os

qr_path = os.path.join("public", "assets", "zimthreads_vip_qr.png")
with open(qr_path, "rb") as f:
    b64_qr = base64.b64encode(f.read()).decode("utf-8")

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Zimthreads VIP Pop-Up Display Card (Print Ready)</title>
  <style>
    @page {{
      size: 5in 7in;
      margin: 0;
    }}
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0f19;
      color: #f5f2ec;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }}
    .card {{
      width: 5in;
      height: 7in;
      background: linear-gradient(165deg, #111827 0%, #0d131f 60%, #162015 100%);
      border: 3px solid #4a5c2d;
      border-radius: 18px;
      padding: 34px 28px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      position: relative;
      overflow: hidden;
    }}
    .badge {{
      background: rgba(74, 92, 45, 0.3);
      border: 1px solid #4a5c2d;
      color: #9ec26b;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      padding: 5px 14px;
      border-radius: 9999px;
      margin-bottom: 10px;
      display: inline-block;
    }}
    .brand-title {{
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #ffffff;
      line-height: 1.1;
    }}
    .brand-sub {{
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #9ca3af;
      margin-top: 4px;
    }}
    .headline {{
      margin-top: 10px;
      font-size: 20px;
      font-weight: 800;
      text-transform: uppercase;
      color: #fbbf24;
      line-height: 1.2;
    }}
    .qr-frame {{
      background: #ffffff;
      padding: 14px;
      border-radius: 16px;
      margin: 12px 0;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
      display: inline-block;
      border: 3px solid #9ec26b;
    }}
    .qr-frame img {{
      display: block;
      width: 195px;
      height: 195px;
    }}
    .callout {{
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #ffffff;
    }}
    .callout-sub {{
      font-size: 10px;
      color: #9ca3af;
      margin-top: 3px;
    }}
    .footer-box {{
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 10px;
      color: #d1d5db;
      line-height: 1.4;
      width: 100%;
    }}
    .print-btn {{
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4a5c2d;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-size: 14px;
    }}
    @media print {{
      body {{
        padding: 0;
        background: none;
      }}
      .print-btn {{
        display: none;
      }}
      .card {{
        box-shadow: none;
        width: 100%;
        height: 100%;
        border-radius: 0;
      }}
    }}
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Print Display Card</button>

  <div class="card">
    <div>
      <div class="badge">Oasis Beach Bar Pop-Up</div>
      <div class="brand-title">ZIMTHREADS</div>
      <div class="brand-sub">Sneaker Atelier & Streetwear</div>
    </div>

    <div>
      <div class="headline">⚡ SCAN FOR 10% OFF ⚡</div>
      <div class="qr-frame">
        <img src="data:image/png;base64,{b64_qr}" alt="Scan to Unlock 10% Off VIP Pass" />
      </div>
      <div class="callout">1-Tap Google Access</div>
      <div class="callout-sub">Instant VIP Discount Pass • No Typing Needed</div>
    </div>

    <div class="footer-box">
      <strong>Show your phone screen to the team at the table</strong> to apply 10% off graphic tees, archival racing jackets, or sneaker drop-off!
    </div>
  </div>
</body>
</html>"""

os.makedirs("public/assets", exist_ok=True)
with open("public/assets/tent-card-oasis.html", "w", encoding="utf-8") as f:
    f.write(html_content)

brain_dir = r"C:\Users\AnesuMetaBox\.gemini\antigravity\brain\6ae49908-efb9-490a-b677-b8b7342e558d"
with open(os.path.join(brain_dir, "tent_card_oasis.html"), "w", encoding="utf-8") as f:
    f.write(html_content)

print("Tent card created successfully")
