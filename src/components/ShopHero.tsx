import React from "react"
import { ArrowRightIcon } from "@/components/Icons"
import { FeaturedDropBanner } from "@/store/seedData"

interface ShopHeroProps {
  banner?: FeaturedDropBanner
  onScrollToSpotlight?: () => void
  onScrollToCatalog?: () => void
}

export default function ShopHero({
  banner,
  onScrollToSpotlight,
  onScrollToCatalog,
}: ShopHeroProps) {
  // Use the new LLICYLAND high-fashion editorial hero image
  const heroImage =
    banner?.imageUrl ||
    "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1792407895/zimthreads/banners/wjn81t1rzt0h6boikoxd.jpg"

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
    <section className="relative w-full h-[78vh] sm:h-[86vh] lg:h-[90vh] bg-[#0a0c0b] overflow-hidden border-b border-[#242b25] flex flex-col justify-between">
      {/* 1. Unobstructed High-Fashion Editorial Hero Visual */}
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        {/* Subtle background glow/grid */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#f5f2ec 1px, transparent 1px), linear-gradient(90deg, #f5f2ec 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />

        {/* The Clean Hero Image (Centerpiece - no text covering the model or LLICYLAND graphic) */}
        <img
          src={heroImage}
          alt={banner?.title || "Zimthreads Atelier Streetwear Hero"}
          className="w-full h-full object-contain sm:object-cover object-top sm:object-center transition-transform duration-700 hover:scale-[1.01]"
        />

        {/* Minimal bottom edge vignette so bottom controls are readable without obstructing the subject */}
        <div className="absolute inset-x-0 bottom-0 h-36 sm:h-44 bg-gradient-to-t from-[#0a0c0b] via-[#0a0c0b]/80 to-transparent pointer-events-none" />
      </div>

      {/* 2. Top Minimalist Status Strip (Floating quietly at top edge) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full pt-4 sm:pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 sm:px-3.5 py-1.5 border border-white/10 text-[9px] sm:text-[10px] font-mono tracking-[0.25em] uppercase text-[#86a84e]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#86a84e] animate-pulse" />
            <span>ZIMTHREADS ATELIER // THE DROP STORE</span>
          </div>

          <div className="hidden sm:inline-flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 border border-white/10 text-[9px] font-mono tracking-wider uppercase text-[#9ca3af]">
            <span>ISLAND-WIDE MAURITIUS DELIVERY</span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Minimalist Action Bar (Anchored at very bottom edge, keeping the photo clear) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full pb-6 sm:pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.25em] text-[#86a84e] mb-1">
              Bespoke Streetwear & Cultural Kits
            </p>
            <h1 className="font-display text-2xl sm:text-4xl font-black uppercase text-white tracking-wide">
              THE ATELIER STORE
            </h1>
          </div>

          {/* Clean Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleScrollToSpotlight}
              className="px-5 py-2.5 sm:py-3 bg-[#86a84e] hover:bg-[#97bd59] text-[#0a0c0b] font-display text-[11px] sm:text-xs font-black tracking-widest uppercase transition-all shadow-lg hover:shadow-[#86a84e]/20 flex items-center gap-2 cursor-pointer"
            >
              <span>FEATURED DROP</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleScrollToCatalog}
              className="px-5 py-2.5 sm:py-3 bg-black/60 hover:bg-black/90 text-white border border-white/20 hover:border-white font-mono text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer backdrop-blur-md"
            >
              <span>ALL PRODUCTS</span>
              <span>↓</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
