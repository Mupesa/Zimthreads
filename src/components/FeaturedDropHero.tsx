import React from "react"
import { FeaturedDropBanner } from "@/store/seedData"
import { ArrowRightIcon, WhatsAppIcon, SparklesIcon } from "@/components/Icons"

interface FeaturedDropHeroProps {
  banner?: FeaturedDropBanner
  onSelectProduct?: (productId: string) => void
  whatsappPhone?: string
}

export default function FeaturedDropHero({
  banner,
  onSelectProduct,
  whatsappPhone = "+23055132614",
}: FeaturedDropHeroProps) {
  if (!banner || !banner.enabled) {
    return null
  }

  const cleanPhone = whatsappPhone.replace(/[^0-9]/g, "")
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hi Zimthreads Collective, I would like to inquire about / pre-order the ${banner.title} drop!`,
  )}`

  const handleShopClick = () => {
    if (banner.productId && onSelectProduct) {
      onSelectProduct(banner.productId)
    }
  }

  return (
    <section className="mb-12 overflow-hidden border border-[#1a1a1a] bg-[#141715] text-[#f5f2ec] shadow-2xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Left Column: Drop Story & CTAs */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative z-10">
          <div>
            {/* Badge & Live Beacon */}
            <div className="flex items-center gap-2.5 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#86a84e] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#86a84e]" />
              </span>
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.25em] text-[#86a84e]">
                {banner.badge || "NEW DROP · LIMITED RELEASE"}
              </span>
            </div>

            {/* Title */}
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold uppercase tracking-tight text-[#f5f2ec] leading-[1.05] mb-2 sm:mb-3">
              {banner.title}
            </h2>

            {/* Subtitle */}
            {banner.subtitle && (
              <p className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-[#c4caa5] mb-3 sm:mb-4">
                {banner.subtitle}
              </p>
            )}

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#9ca3af] leading-relaxed max-w-xl mb-6">
              {banner.description}
            </p>

            {/* Spec Highlights Pill Row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-8">
              {banner.priceText && (
                <span className="px-3 py-1 bg-[#86a84e]/20 text-[#86a84e] border border-[#86a84e]/30 text-xs font-black tracking-wider uppercase">
                  {banner.priceText}
                </span>
              )}
              <span className="px-3 py-1 bg-white/5 border border-white/10 text-white/80 text-[11px] font-semibold tracking-wider uppercase">
                Heavyweight 260 GSM
              </span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 text-white/80 text-[11px] font-semibold tracking-wider uppercase">
                Sizes: S · M · L · XL
              </span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 text-white/80 text-[11px] font-semibold tracking-wider uppercase">
                Atelier Label
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-white/10">
            {banner.productId && onSelectProduct ? (
              <button
                type="button"
                onClick={handleShopClick}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#86a84e] hover:bg-[#97bd59] text-[#141715] font-display font-extrabold text-xs tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
              >
                <span>{banner.ctaText || "SHOP THIS DROP"}</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>
            ) : null}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-transparent hover:bg-white/5 border border-white/20 hover:border-white/40 text-white/90 text-xs font-bold tracking-widest uppercase transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
              <span>{banner.secondaryCtaText || "INQUIRE ON WHATSAPP"}</span>
            </a>
          </div>
        </div>

        {/* Right Column: Hero Visual Artwork */}
        <div
          onClick={handleShopClick}
          className={`lg:col-span-5 relative group overflow-hidden bg-[#0c0e0d] min-h-[260px] sm:min-h-[320px] lg:min-h-full flex items-center justify-center border-t lg:border-t-0 lg:border-l border-white/10 ${
            banner.productId ? "cursor-pointer" : ""
          }`}
        >
          {/* Subtle Background Radial Glow */}
          <div className="absolute inset-0 bg-radial from-[#86a84e]/10 via-transparent to-transparent opacity-60 pointer-events-none" />

          {/* Hero Banner Image */}
          <img
            src={banner.imageUrl}
            alt={banner.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          />

          {/* Ambient Edge Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141715]/80 via-transparent to-black/20 pointer-events-none" />

          {/* Floating Tag */}
          <div className="absolute top-4 right-4 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#141715]/90 backdrop-blur-md border border-white/15 text-[10px] font-bold tracking-widest uppercase text-[#f5f2ec] shadow-lg">
              <SparklesIcon className="w-3 h-3 text-[#86a84e]" />
              {banner.tag || "ATELIER EXCLUSIVE"}
            </span>
          </div>

          {/* Click to inspect prompt on hover */}
          {banner.productId && (
            <div className="absolute bottom-4 left-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#141715]/90 backdrop-blur-md text-[10px] font-bold tracking-wider uppercase text-white/90 border border-white/20">
                <span>Click to view drop details & sizing</span>
                <ArrowRightIcon className="w-3 h-3 text-[#86a84e]" />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
