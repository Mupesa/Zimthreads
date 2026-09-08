import { Link } from "@/router"

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-[#f5f2ec] pt-16 pb-12 border-t border-[#2a2a2a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        <div>
          <div className="mb-4">
            <div className="font-display text-2xl font-bold tracking-widest uppercase text-white">
              ZIMTHREAD
            </div>
            <div className="text-[10px] tracking-[0.3em] text-[#9ca3af] uppercase">
              Collective
            </div>
          </div>
          <p className="text-sm text-[#9ca3af] leading-relaxed">
            Harare's premier sneaker restoration lab, premium shoe care
            formulations & custom streetwear atelier.
          </p>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold tracking-widest uppercase text-white mb-4">
            Services
          </h4>
          <ul className="space-y-2.5 text-sm text-[#9ca3af]">
            {[
              "Shoe Cleaning",
              "Deep Clean",
              "Shoe Restoration",
              "Custom Apparel",
              "Personalization",
            ].map((s) => (
              <li key={s}>
                <Link
                  to="/services"
                  className="hover:text-[#86a84e] transition-colors"
                >
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold tracking-widest uppercase text-white mb-4">
            Company
          </h4>
          <ul className="space-y-2.5 text-sm text-[#9ca3af]">
            {[
              ["About Studio", "/about"],
              ["Journal & Care Guides", "/blog"],
              ["Contact & Location", "/contact"],
              ["Book Service", "/booking"],
            ].map(([l, to]) => (
              <li key={l}>
                <Link
                  to={to}
                  className="hover:text-[#86a84e] transition-colors"
                >
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold tracking-widest uppercase text-white mb-4">
            Studio
          </h4>
          <ul className="space-y-2 text-sm text-[#9ca3af]">
            <li>info@zimthread.co.zw</li>
            <li>+263 77 123 4567</li>
            <li>Harare, Zimbabwe</li>
            <li className="text-xs text-[#6b7280] pt-1">
              Mon–Sat: 8:00 AM – 6:00 PM
            </li>
          </ul>
          <div className="flex gap-2 mt-4">
            {["INSTAGRAM", "WHATSAPP", "FACEBOOK"].map((s) => (
              <span
                key={s}
                className="text-[10px] font-bold text-[#9ca3af] tracking-wider uppercase border border-[#374151] px-2 py-1"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 border-t border-[#2e3744] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-[#6b7280]">
          © 2026 Zimthread Collective. All rights reserved.
        </span>
        <span className="text-xs text-[#6b7280]">
          Crafted in Harare, Zimbabwe
        </span>
      </div>
    </footer>
  )
}
