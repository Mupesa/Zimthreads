import base64
import os

with open(os.path.join("public", "assets", "zimthreads_vip_qr.png"), "rb") as f:
    b64_qr = base64.b64encode(f.read()).decode("utf-8")

html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
</head>
<body class="bg-transparent text-[var(--foreground)] antialiased p-2 sm:p-4">
  <div class="bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl max-w-4xl mx-auto">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-3 bg-[var(--background)]">
      <div>
        <div class="flex items-center gap-2">
          <span class="inline-block w-3 h-3 rounded-full bg-[#4a5c2d] shadow-md shadow-[#4a5c2d]/50"></span>
          <h2 class="font-extrabold text-base sm:text-lg tracking-wide uppercase">Event QR Code & Google 1-Tap Capture</h2>
        </div>
        <p class="text-xs text-[var(--muted-foreground)]">Live Lead Engine for Oasis Beach Bar Pop-Up</p>
      </div>

      <div class="flex items-center gap-2">
        <span class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          ✓ Neon DB Connected
        </span>
        <span class="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          ⚡ 1-Tap Active
        </span>
      </div>
    </div>

    <!-- Interactive Grid -->
    <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-[var(--card)]">
      <!-- QR Code Display -->
      <div class="flex flex-col items-center text-center p-6 rounded-2xl border border-[var(--border)] bg-[var(--background)]">
        <div class="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#4a5c2d]/20 text-[#86a84e] border border-[#4a5c2d]/40 mb-3">
          300 DPI High-Resolution QR
        </div>
        <div class="p-3 bg-white rounded-2xl shadow-xl border-2 border-[#86a84e] my-2">
          <img src="data:image/png;base64,{b64_qr}" alt="Zimthreads VIP QR Code" class="w-52 h-52 block" />
        </div>
        <div class="mt-3 font-mono text-xs text-amber-400 font-bold">
          https://www.zimthreads.online/vip?src=oasis_popup
        </div>
        <p class="text-xs text-[var(--muted-foreground)] mt-1 max-w-xs">
          Point any phone camera to scan. Opens directly into the 1-Tap Google bottom sheet.
        </p>
        <div class="mt-4 flex gap-2">
          <a href="file:///C:/Users/AnesuMetaBox/.gemini/antigravity/brain/6ae49908-efb9-490a-b677-b8b7342e558d/tent_card_oasis.html" target="_blank" class="px-3.5 py-1.5 rounded-lg bg-[#4a5c2d] hover:bg-[#586e36] text-white text-xs font-bold transition-all">
            🖨️ Open Print Card
          </a>
          <a href="file:///C:/Users/AnesuMetaBox/.gemini/antigravity/brain/6ae49908-efb9-490a-b677-b8b7342e558d/zimthreads_vip_qr.png" download class="px-3.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold transition-all">
            ⬇️ Download PNG
          </a>
        </div>
      </div>

      <!-- Mobile Screen Experience Simulation -->
      <div class="flex flex-col justify-between p-5 rounded-2xl border border-[var(--border)] bg-[#111827] text-white space-y-4">
        <div class="border-b border-gray-800 pb-3 flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Customer Phone Experience</span>
          <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">1-Second Flow</span>
        </div>

        <div class="space-y-3">
          <!-- Step 1 -->
          <div class="flex gap-3 items-start">
            <div class="w-6 h-6 rounded-full bg-[#4a5c2d] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
            <div>
              <div class="text-xs font-bold text-white">Scan QR at Booth</div>
              <div class="text-[11px] text-gray-400">Attendee scans with their phone camera while browsing tees or shoes.</div>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="flex gap-3 items-start">
            <div class="w-6 h-6 rounded-full bg-[#4a5c2d] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
            <div>
              <div class="text-xs font-bold text-white">Google One-Tap Pop-Up</div>
              <div class="text-[11px] text-gray-400">A native bottom sheet prompts: <em>'Continue as [Name]'</em>. One tap captures their verified Gmail address with zero typing.</div>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="flex gap-3 items-start">
            <div class="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
            <div>
              <div class="text-xs font-bold text-amber-300">Confetti & 'OASIS10' Pass</div>
              <div class="text-[11px] text-gray-400">Confetti explodes! Digital VIP Voucher displays with 1-tap copy button and booth staff instructions.</div>
            </div>
          </div>

          <!-- Step 4 -->
          <div class="flex gap-3 items-start">
            <div class="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
            <div>
              <div class="text-xs font-bold text-emerald-400">Stored in Neon PostgreSQL</div>
              <div class="text-[11px] text-gray-400">Saved instantly to Neon DB. Tracked live in your Admin Dashboard under 'VIP Leads & QR' with 1-click CSV export.</div>
            </div>
          </div>
        </div>

        <!-- Simulation VIP Voucher Card -->
        <div class="p-3.5 rounded-xl bg-gradient-to-r from-black to-[#1e2a1b] border border-amber-500/30 text-center mt-2">
          <div class="text-[10px] uppercase tracking-wider text-gray-400">Generated Voucher Preview</div>
          <div class="font-mono text-xl font-extrabold text-amber-300 my-1">OASIS10</div>
          <div class="text-[10px] text-gray-300">Show to Shepherd, Davies, or Anesu for 10% Off</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>"""

brain_dir = r"C:\Users\AnesuMetaBox\.gemini\antigravity\brain\6ae49908-efb9-490a-b677-b8b7342e558d"
with open(os.path.join(brain_dir, "qr_lead_capture_viewer.html"), "w", encoding="utf-8") as f:
    f.write(html_content)

print("Viewer generated successfully")
