import { Link } from "@/router"

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-[#f5f2ec] pt-16 pb-12 border-t border-[#2a2a2a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        <div>
          <div className="mb-4">
            <div className="font-display text-2xl font-bold tracking-widest uppercase text-white">
              ZIMTHREADS
            </div>
            <div className="text-[10px] tracking-[0.3em] text-[#9ca3af] uppercase">
              Collective
            </div>
          </div>
          <p className="text-sm text-[#9ca3af] leading-relaxed">
            Mauritius premier sneaker restoration atelier, premium shoe care
            formulations & custom streetwear collective.
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
            <li>
              <a
                href="mailto:zimthreadmu@gmail.com"
                className="hover:text-[#86a84e] transition-colors"
              >
                zimthreadmu@gmail.com
              </a>
            </li>
            <li>
              <a
                href="https://wa.me/23055132614"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#86a84e] transition-colors"
              >
                +230 5513 2614 (WhatsApp)
              </a>
            </li>
            <li>Mauritius (Drop Off & Collection)</li>
            <li className="text-xs text-[#6b7280] pt-1">
              Mon–Sat: 8:00 AM – 6:00 PM
            </li>
          </ul>
          <div className="flex gap-2 mt-4">
            <a
              href="https://instagram.com/zimthread.collective"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-[#9ca3af] hover:text-white hover:border-white tracking-wider uppercase border border-[#374151] px-2 py-1 transition-colors"
            >
              INSTAGRAM
            </a>
            <a
              href="https://wa.me/23055132614"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-[#9ca3af] hover:text-white hover:border-white tracking-wider uppercase border border-[#374151] px-2 py-1 transition-colors"
            >
              WHATSAPP
            </a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 border-t border-[#2e3744] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-[#6b7280]">
          © 2026 Zimthreads Collective. All rights reserved.
        </span>
        <span className="text-xs text-[#6b7280]">
          Mauritius · Clothes · Sneakers · Community
        </span>
      </div>
    </footer>
  )
}
