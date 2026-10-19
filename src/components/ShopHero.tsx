import React from "react"
import { ArrowRightIcon } from "@/components/Icons"
import { FeaturedDropBanner } from "@/store/seedData"

interface ShopHeroProps {
  banner?: FeaturedDropBanner
  onScrollToRail?: () => void
  onScrollToSpotlight?: () => void
  onScrollToCatalog?: () => void
}

export default function ShopHero({
  banner,
  onScrollToRail,
  onScrollToSpotlight,
  onScrollToCatalog,
}: ShopHeroProps) {
  const heroImage =
    banner?.imageUrl ||
    "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto,w_1920/v1791397726/zimthreads/jackets/fmyul3tffougz1obkara.png"

  const handleScrollToRail = () => {
    if (onScrollToRail) {
      onScrollToRail()
    } else {
      document
        .getElementById("collection-rail-section")
        ?.scrollIntoView({ behavior: "smooth" })
    }
  }

  const handleScrollToSpotlight = () => {
    if (onScrollToSpotlight) {
      onScrollToSpotlight()
    } else {
      document
        .getElementById("featured-product-spotlight")
        ?.scrollIntoView({ behavior: "smooth" })
    }
  }

  const handleScrollToCatalog = () => {
    if (onScrollToCatalog) {
      onScrollToCatalog()
    } else {
      document
        .getElementById("shop-catalog-section")
        ?.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section className="relative min-h-[70vh] sm:min-h-[78vh] flex flex-col justify-between overflow-hidden bg-[#121513] text-[#f5f2ec] mb-12 border-b border-[#242b25]">
      {/* Background Ambience & Full-Bleed Editorial Visual */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(#f5f2ec 1px, transparent 1px), linear-gradient(90deg, #f5f2ec 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />

        {/* Cinematic Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121513] via-[#121513]/70 to-[#121513]/40 z-1" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#121513] via-[#121513]/85 to-transparent z-1" />

        <img
          src={heroImage}
          alt={banner?.title || "Zimthreads Shop Editorial Hero"}
          className="w-full h-full object-cover object-center lg:object-right filter brightness-[0.55] contrast-[1.1] scale-105"
        />
      </div>

      {/* Top Identity Kicker */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full pt-8 sm:pt-12">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2a322b] pb-4">
          <div className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-mono tracking-[0.25em] uppercase text-[#86a84e]">
            <span className="w-2 h-2 rounded-full bg-[#86a84e] animate-pulse" />
            <span>ZIMTHREADS ATELIER // THE DROP STORE</span>
          </div>

          <div className="flex items-center gap-3 text-[9px] sm:text-[10px] font-mono uppercase text-[#9ca3af]">
            <span>HERITAGE KITS</span>
            <span className="text-[#4a5c2d]">/</span>
            <span>RACING ARCHIVES</span>
            <span className="text-[#4a5c2d]">/</span>
            <span>RESTORE LAB</span>
          </div>
        </div>
      </div>

      {/* Main Editorial Headline & Interactive Actions */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full py-10 sm:py-16 flex-1 flex flex-col justify-center">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#86a84e]/15 border border-[#86a84e]/30 text-[#86a84e] text-[10px] font-bold tracking-[0.25em] uppercase mb-4 sm:mb-6">
            Bespoke Drops · Official Kits · Motorsport Archives
          </div>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black uppercase leading-[0.92] tracking-tight text-white mb-5 sm:mb-6">
            CURATED ATELIER.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#86a84e] via-[#a3c965] to-[#f5f2ec]">
              UNAPOLOGETIC
            </span>
            <br />
            STREETWEAR.
          </h1>

          <p className="text-sm sm:text-base text-[#d1d5db] max-w-xl leading-relaxed mb-8 font-sans">
            The official Zimthreads store. Shop limited-edition Zimbabwe
            &apos;02&apos; pre-order kits with custom back-name printing,
            archival 90s vintage motorsport jackets, handcrafted African
            heritage beaded bracelets, and sneaker care products.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 max-w-md sm:max-w-none">
            <button
              onClick={handleScrollToRail}
              className="px-6 py-3.5 bg-[#86a84e] hover:bg-[#96bd59] text-[#121513] font-display text-xs sm:text-sm font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-[#86a84e]/20"
            >
              <span>EXPLORE CAPSULES</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>

            <button
              onClick={handleScrollToSpotlight}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-[#374151] hover:border-white font-display text-xs sm:text-sm font-extrabold tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>FLAGSHIP DROP SPOTLIGHT</span>
              <span>↓</span>
            </button>

            <button
              onClick={handleScrollToCatalog}
              className="px-5 py-3.5 bg-transparent hover:bg-white/5 text-[#9ca3af] hover:text-white border border-[#2a322b] font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>FULL CATALOG</span>
              <span>↓</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Status Bar */}
      <div className="relative z-10 border-t border-[#242b25] bg-[#121513]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-[10px] font-mono uppercase">
          <div className="flex items-center gap-2 text-[#86a84e]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#86a84e] animate-ping" />
            <span>
              ZIMBABWE &apos;02&apos; HERITAGE KIT PRE-ORDERS NOW OPEN
            </span>
          </div>

          <div className="text-[#9ca3af]">
            <span>
              FREE COLLECTION AT ALL MAURITIUS DROP POINTS · ISLAND-WIDE
              DELIVERY
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
