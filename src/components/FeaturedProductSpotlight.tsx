import React, { useState, useMemo } from "react"
import { useStore } from "@/store/StoreContext"
import { Product, FeaturedDropBanner } from "@/store/seedData"
import { CheckIcon, SparklesIcon } from "@/components/Icons"

interface FeaturedProductSpotlightProps {
  banner?: FeaturedDropBanner
}

export default function FeaturedProductSpotlight({
  banner,
}: FeaturedProductSpotlightProps) {
  const { products, addToCart, setIsCartOpen, settings } = useStore()

  // Use banner from props or fall back to store settings
  const activeBanner = banner || settings?.featuredDrop

  // If explicitly disabled in admin settings, do not render
  if (activeBanner && activeBanner.enabled === false) {
    return null
  }

  // Resolve target product:
  // 1. Specified productId in activeBanner
  // 2. Default to flagship 'prod-zim-02'
  // 3. First product with featured flag or first catalog product
  const targetProduct = useMemo<Product | undefined>(() => {
    if (activeBanner?.productId) {
      const found = products.find((p) => p.id === activeBanner.productId)
      if (found) return found
    }
    const defaultFlagship = products.find((p) => p.id === "prod-zim-02")
    if (defaultFlagship) return defaultFlagship

    return products.find((p) => p.featured && !p.hidden) || products[0]
  }, [products, activeBanner?.productId])

  if (!targetProduct) {
    return null
  }

  // Gallery images derivation
  const gallery = useMemo(() => {
    if (targetProduct.views && targetProduct.views.length > 0) {
      return targetProduct.views
    }
    if (targetProduct.images && targetProduct.images.length > 0) {
      return targetProduct.images.map((url, i) => ({
        label:
          i === 0 ? "Front View" : i === 1 ? "Back View" : `Angle ${i + 1}`,
        url,
      }))
    }
    return [{ label: "Front View", url: targetProduct.img }]
  }, [targetProduct])

  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string>(
    targetProduct.sizes && targetProduct.sizes.length > 0
      ? targetProduct.sizes[0]
      : "",
  )
  const [quantity, setQuantity] = useState(1)
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [customName, setCustomName] = useState("")
  const [openAccordion, setOpenAccordion] = useState<string | null>("story")

  const activeImage = gallery[activeImageIdx] || gallery[0]

  const customPrice = targetProduct.customNamePrice ?? 50
  const isCustomActive = isCustomizing && customName.trim().length > 0
  const unitPrice = targetProduct.price + (isCustomActive ? customPrice : 0)

  const handleAddToCart = () => {
    addToCart(
      targetProduct,
      quantity,
      selectedSize || undefined,
      isCustomActive ? customName.trim().toUpperCase() : undefined,
    )
    setIsCartOpen(true)
  }

  const toggleAccordion = (id: string) => {
    setOpenAccordion((prev) => (prev === id ? null : id))
  }

  // Overrides from admin banner if present
  const displayTitle = activeBanner?.title || targetProduct.name
  const displayBadge =
    activeBanner?.badge ||
    (targetProduct.isPreorder
      ? "PRE-ORDER · LIMITED DROP"
      : targetProduct.badge || "ATELIER SPOTLIGHT")
  const displayDescription =
    activeBanner?.description || targetProduct.description

  return (
    <section
      id="featured-product-spotlight"
      className="py-16 sm:py-24 bg-[#111412] text-[#f5f2ec] border-b border-[#242b25]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Header Kicker */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 text-[10px] font-mono tracking-[0.3em] uppercase text-[#86a84e] mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#86a84e]" />
            <span>DIRECT ATELIER SPOTLIGHT</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
            FLAGSHIP DROP SHOWCASE
          </h2>
        </div>

        {/* 2-Column Split: Gallery on Left, Sticky Purchase Card on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ===================== LEFT: MEDIA GALLERY ===================== */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Primary Main Image Frame */}
            <div className="relative aspect-[4/5] sm:aspect-square w-full bg-[#181d19] border border-[#2a322b] overflow-hidden group">
              <img
                src={activeImage.url}
                alt={`${displayTitle} - ${activeImage.label}`}
                className="w-full h-full object-cover object-center transition-all duration-500"
              />

              {/* Badge Overlay */}
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-[#86a84e] text-[#121513] text-[9px] font-black uppercase px-3 py-1 tracking-wider shadow-md flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#121513] animate-pulse" />
                  <span>{displayBadge}</span>
                </span>
              </div>

              {/* View Label Tag */}
              <div className="absolute bottom-4 right-4 z-10 bg-[#121513]/85 backdrop-blur-xs px-3 py-1 border border-[#2a322b] text-[10px] font-mono uppercase tracking-wider text-[#d1d5db]">
                {activeImage.label}
              </div>
            </div>

            {/* Thumbnail Row */}
            {gallery.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {gallery.map((view, idx) => (
                  <button
                    key={`${view.label}-${idx}`}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 border overflow-hidden cursor-pointer transition-all ${
                      activeImageIdx === idx
                        ? "border-[#86a84e] ring-2 ring-[#86a84e]/30 scale-102"
                        : "border-[#2a322b] opacity-60 hover:opacity-100 bg-[#181d19]"
                    }`}
                  >
                    <img
                      src={view.url}
                      alt={view.label}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-mono text-center uppercase py-0.5 text-white truncate px-1">
                      {view.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ===================== RIGHT: STICKY PURCHASE PANEL ===================== */}
          <div className="lg:col-span-5 bg-[#181d19] border border-[#2a322b] p-6 sm:p-8 lg:sticky lg:top-24">
            {/* Category / Collection Tag */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#86a84e] font-bold">
                {targetProduct.category} // BESPOKE
              </span>
              {targetProduct.isPreorder && (
                <span className="text-[9px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 uppercase">
                  Orders Close Sunday
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-display text-2xl sm:text-3xl font-black uppercase text-white tracking-wide mb-2">
              {displayTitle}
            </h3>

            {/* Live Pricing */}
            <div className="flex items-baseline gap-3 mb-6 pb-6 border-b border-[#2a322b]">
              <span className="font-display text-3xl font-extrabold text-[#86a84e]">
                Rs {unitPrice}
              </span>
              {isCustomActive && (
                <span className="text-[11px] font-mono text-[#9ca3af]">
                  (Includes +Rs {customPrice} Personalization)
                </span>
              )}
            </div>

            {/* Size Selector */}
            {targetProduct.sizes && targetProduct.sizes.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#9ca3af] mb-2.5">
                  <span>SELECT SIZE</span>
                  <span className="text-[10px] text-[#86a84e]">
                    Selected: {selectedSize || "None"}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {targetProduct.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`py-2 text-xs font-mono font-bold uppercase transition-all cursor-pointer border ${
                        selectedSize === s
                          ? "bg-[#86a84e] text-[#121513] border-[#86a84e] shadow-sm font-black"
                          : "bg-[#121513] text-[#d1d5db] border-[#2a322b] hover:border-[#86a84e]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Name Personalization (if supported) */}
            {targetProduct.allowCustomName && (
              <div className="mb-6 p-4 bg-[#121513] border border-[#2a322b]">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={isCustomizing}
                    onChange={(e) => setIsCustomizing(e.target.checked)}
                    className="w-4 h-4 rounded text-[#86a84e] bg-[#181d19] border-[#374151] focus:ring-0"
                  />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    Personalize Custom Name (+Rs {customPrice})
                  </span>
                </label>

                {isCustomizing && (
                  <div className="mt-3">
                    <input
                      type="text"
                      maxLength={12}
                      value={customName}
                      onChange={(e) =>
                        setCustomName(e.target.value.toUpperCase())
                      }
                      placeholder="ENTER NAME (E.G. MUPESA)"
                      className="w-full bg-[#181d19] border border-[#374151] px-3 py-2 text-xs font-mono uppercase text-white focus:outline-none focus:border-[#86a84e] tracking-widest"
                    />
                    {customName.trim() && (
                      <p className="mt-2 text-[10px] font-mono text-[#86a84e]">
                        ✓ Printed above &apos;02&apos; on jersey back:{" "}
                        <span className="font-bold">{customName.trim()}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quantity & Add to Cart Controls */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center border border-[#2a322b] bg-[#121513]">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-12 text-sm text-[#9ca3af] hover:text-white transition-colors cursor-pointer"
                >
                  -
                </button>
                <span className="w-10 text-center font-mono text-xs font-bold text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-12 text-sm text-[#9ca3af] hover:text-white transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 h-12 bg-[#86a84e] hover:bg-[#97bd59] text-[#121513] font-display font-black tracking-widest text-xs uppercase transition-all shadow-md hover:shadow-[#86a84e]/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>ADD TO CART · RS {unitPrice * quantity}</span>
                <span>→</span>
              </button>
            </div>

            {/* Accordion Tabs (Babwê Style Details) */}
            <div className="border-t border-[#2a322b] pt-4 flex flex-col gap-2">
              {/* Tab 1: Cultural & Craft Narrative */}
              <div className="border border-[#2a322b] bg-[#121513]">
                <button
                  onClick={() => toggleAccordion("story")}
                  className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-mono uppercase tracking-wider text-white cursor-pointer"
                >
                  <span>Heritage Story & Craft Details</span>
                  <span className="font-bold">
                    {openAccordion === "story" ? "−" : "+"}
                  </span>
                </button>
                {openAccordion === "story" && (
                  <div className="px-4 pb-4 text-xs text-[#9ca3af] leading-relaxed border-t border-[#242b25] pt-3 whitespace-pre-line font-sans">
                    {displayDescription}
                  </div>
                )}
              </div>

              {/* Tab 2: Sizing & Fit */}
              <div className="border border-[#2a322b] bg-[#121513]">
                <button
                  onClick={() => toggleAccordion("sizing")}
                  className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-mono uppercase tracking-wider text-white cursor-pointer"
                >
                  <span>Sizing & Fit Advice</span>
                  <span className="font-bold">
                    {openAccordion === "sizing" ? "−" : "+"}
                  </span>
                </button>
                {openAccordion === "sizing" && (
                  <div className="px-4 pb-4 text-xs text-[#9ca3af] leading-relaxed border-t border-[#242b25] pt-3 font-sans">
                    True to size athletic cut with relaxed streetwear shoulders.
                    For an oversized, boxy look, we recommend sizing up one full
                    size.
                  </div>
                )}
              </div>

              {/* Tab 3: Mauritius Drop-Off & Delivery */}
              <div className="border border-[#2a322b] bg-[#121513]">
                <button
                  onClick={() => toggleAccordion("delivery")}
                  className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-mono uppercase tracking-wider text-white cursor-pointer"
                >
                  <span>Mauritius Pickups & Delivery</span>
                  <span className="font-bold">
                    {openAccordion === "delivery" ? "−" : "+"}
                  </span>
                </button>
                {openAccordion === "delivery" && (
                  <div className="px-4 pb-4 text-xs text-[#9ca3af] leading-relaxed border-t border-[#242b25] pt-3 font-sans">
                    Free collection from designated drop points across Port
                    Louis, Grand Baie, Curepipe, Flic en Flac, and Ébène. Direct
                    island-wide doorstep courier delivery available across
                    Mauritius.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
