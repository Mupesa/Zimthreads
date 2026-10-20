import React, { useState, useMemo, useRef, useEffect } from "react"
import { useStore } from "@/store/StoreContext"
import { Product, FeaturedDropBanner } from "@/store/seedData"

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
    // For prod-5 ('LLICYLAND' Graphic Boxy Tee), enrich with editorial and campaign views
    if (targetProduct.id === "prod-5") {
      return [
        {
          label: "Studio Mockup",
          url: targetProduct.img,
        },
        {
          label: "Editorial Lookbook",
          url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1792407895/zimthreads/banners/wjn81t1rzt0h6boikoxd.jpg",
        },
        {
          label: "Campaign Feature",
          url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1790959536/zimthreads/blog/oqpojiputsm4qndzgstg.jpg",
        },
      ]
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
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const triggerButtonRef = useRef<HTMLButtonElement>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)

  const handleCustomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9 '\-]/g, "")
      .slice(0, 12)
    setCustomName(sanitized)
  }

  const activeImage = gallery[activeImageIdx] ||
    gallery[0] || { label: "Studio View", url: targetProduct.img || "" }

  const customPrice = targetProduct.customNamePrice ?? 50
  const isCustomActive = isCustomizing && customName.trim().length > 0
  const unitPrice = targetProduct.price + (isCustomActive ? customPrice : 0)

  // Sync and reset selection state when target product changes
  useEffect(() => {
    setActiveImageIdx(0)
    setSelectedSize(
      targetProduct.sizes && targetProduct.sizes.length > 0
        ? targetProduct.sizes[0]
        : "",
    )
    setIsCustomizing(false)
    setCustomName("")
    setQuantity(1)
    setOpenAccordion(null)
    setIsDrawerOpen(false)
    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollTo({
        left: 0,
        behavior: "instant" as ScrollBehavior,
      })
    }
  }, [targetProduct.id])

  // Ensure selectedSize remains valid if product sizes update (e.g. cloud hydration or admin edits)
  useEffect(() => {
    if (targetProduct.sizes && targetProduct.sizes.length > 0) {
      if (!selectedSize || !targetProduct.sizes.includes(selectedSize)) {
        setSelectedSize(targetProduct.sizes[0])
      }
    } else if (selectedSize) {
      setSelectedSize("")
    }
  }, [targetProduct.sizes, selectedSize])

  // Prevent background scrolling when mobile selection drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isDrawerOpen])

  // Accessible Focus Trap & Return Focus for Mobile Selection Drawer (WCAG 2.1 AA)
  useEffect(() => {
    if (isDrawerOpen) {
      previousActiveElementRef.current = (document.activeElement as HTMLElement)

      const focusTimer = setTimeout(() => {
        if (drawerRef.current) {
          const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          )
          if (focusable.length > 0) {
            focusable[0].focus()
          }
        }
      }, 50)

      const handleTrapKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsDrawerOpen(false)
          return
        }
        if (e.key !== "Tab" || !drawerRef.current) return

        const focusable = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter(
          (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
        )

        if (focusable.length === 0) return

        const firstElement = focusable[0]
        const lastElement = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }

      window.addEventListener("keydown", handleTrapKeyDown)
      return () => {
        clearTimeout(focusTimer)
        window.removeEventListener("keydown", handleTrapKeyDown)
      }
    } else {
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus()
      } else if (triggerButtonRef.current) {
        triggerButtonRef.current.focus()
      }
    }
  }, [isDrawerOpen])

  // Re-align carousel scroll position on window resize / orientation change
  useEffect(() => {
    const handleResize = () => {
      if (mobileScrollRef.current) {
        const width = mobileScrollRef.current.clientWidth
        if (width > 0) {
          mobileScrollRef.current.scrollTo({
            left: activeImageIdx * width,
            behavior: "instant" as ScrollBehavior,
          })
        }
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [activeImageIdx])

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

  // Handle mobile horizontal scroll snapping to update active dot index
  const handleMobileScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    if (el.clientWidth > 0) {
      const newIdx = Math.round(el.scrollLeft / el.clientWidth)
      if (newIdx !== activeImageIdx && newIdx >= 0 && newIdx < gallery.length) {
        setActiveImageIdx(newIdx)
      }
    }
  }

  // Scroll to slide on dot indicator tap without shifting vertical window scroll
  const handleDotClick = (idx: number) => {
    setActiveImageIdx(idx)
    if (mobileScrollRef.current) {
      const width = mobileScrollRef.current.clientWidth
      mobileScrollRef.current.scrollTo({
        left: idx * width,
        behavior: "smooth",
      })
    }
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
      className="py-8 sm:py-16 bg-white text-[#1a1a1a] border-b border-[#e5e1d8]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Header Kicker */}
        <div className="mb-4 sm:mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 text-[9px] sm:text-[10px] font-mono tracking-[0.25em] uppercase text-[#4a5c2d] mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4a5c2d]" />
            <span>DIRECT ATELIER SPOTLIGHT</span>
          </div>
          <h2 className="font-display text-xl sm:text-4xl font-black uppercase tracking-tight text-[#1a1a1a]">
            FLAGSHIP DROP SHOWCASE
          </h2>
        </div>

        {/* 2-Column Split: Gallery on Left, Sticky Purchase Card on Right on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
          {/* ===================== LEFT: MEDIA GALLERY ===================== */}
          <div className="lg:col-span-7 flex flex-col">
            {/* 1. MOBILE-ONLY VIEW (< lg): Babwê Studio White Swipeable Gallery + Dots */}
            <div className="block lg:hidden">
              <div
                ref={mobileScrollRef}
                onScroll={handleMobileScroll}
                className="flex w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide touch-pan-y bg-white"
                style={{
                  scrollSnapType: "x mandatory",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {gallery.map((view, idx) => (
                  <div
                    key={`mobile-${view.label}-${idx}`}
                    id={`spotlight-slide-${idx}`}
                    role="tabpanel"
                    aria-labelledby={`spotlight-tab-${idx}`}
                    className="w-full shrink-0 snap-center snap-always relative aspect-square max-h-[380px] flex items-center justify-center bg-white overflow-hidden"
                    style={{ scrollSnapStop: "always" }}
                  >
                    <img
                      src={view.url}
                      alt={`${displayTitle} - ${view.label}`}
                      className="w-full h-full object-contain p-4 object-center transition-all duration-300"
                    />

                    {/* Badge Overlay */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="bg-[#1a1a1a] text-white text-[9px] font-bold uppercase px-2.5 py-1 tracking-wider shadow-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#86a84e] animate-pulse" />
                        <span>{displayBadge}</span>
                      </span>
                    </div>

                    {/* View Label Tag */}
                    <div className="absolute bottom-3 right-3 z-10 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 border border-[#e5e1d8] text-[9px] font-mono uppercase tracking-wider text-[#4b5563] shadow-xs">
                      {view.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Animated Pagination Dots (Matching Babwê on Redmi) */}
              {gallery.length > 1 && (
                <div
                  role="tablist"
                  aria-label="Product image slides"
                  className="flex items-center justify-center gap-1 py-2"
                >
                  {gallery.map((view, idx) => (
                    <button
                      key={`dot-${idx}`}
                      id={`spotlight-tab-${idx}`}
                      role="tab"
                      aria-controls={`spotlight-slide-${idx}`}
                      aria-selected={activeImageIdx === idx}
                      onClick={() => handleDotClick(idx)}
                      aria-label={`Slide ${idx + 1} of ${gallery.length}: ${view.label}`}
                      className="w-8 h-8 flex items-center justify-center cursor-pointer"
                    >
                      <span
                        className={`transition-all duration-200 rounded-full block ${
                          activeImageIdx === idx
                            ? "w-2.5 h-2.5 bg-[#1a1a1a]"
                            : "w-2 h-2 bg-[#d1d5db] hover:bg-[#9ca3af]"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Compact Mobile Product Summary & Trigger Button */}
              <div className="mt-3 pt-3 border-t border-[#f0eee6] flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#4a5c2d] font-bold">
                    {targetProduct.category} // BESPOKE
                  </span>
                  {targetProduct.isPreorder && (
                    <span className="text-[9px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 uppercase">
                      Orders Close Sunday
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-xl font-black uppercase text-[#1a1a1a] tracking-tight">
                    {displayTitle}
                  </h3>
                  <span className="font-display text-xl font-black text-[#1a1a1a] shrink-0">
                    Rs {unitPrice}
                  </span>
                </div>

                <p className="text-xs text-[#6b7280] line-clamp-2 leading-relaxed font-sans">
                  {displayDescription}
                </p>

                {/* Prominent Trigger Button: Opens Slide-Up Selection Drawer */}
                <button
                  ref={triggerButtonRef}
                  onClick={() => setIsDrawerOpen(true)}
                  aria-haspopup="dialog"
                  aria-expanded={isDrawerOpen}
                  aria-controls="spotlight-mobile-drawer"
                  className="w-full mt-2 py-3.5 px-5 bg-[#1a1a1a] hover:bg-neutral-800 text-white font-display font-black tracking-widest text-xs uppercase transition-all shadow-sm flex items-center justify-between cursor-pointer group"
                >
                  <span>SELECT OPTIONS / DROP</span>
                  <span className="font-mono text-xs group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </button>
              </div>
            </div>

            {/* 2. DESKTOP-ONLY VIEW (>= lg): Studio White Gallery with Primary Frame + Thumbnails */}
            <div className="hidden lg:flex flex-col gap-4">
              {/* Primary Main Image Frame */}
              <div className="relative aspect-square w-full bg-white border border-[#e5e1d8] overflow-hidden group">
                <img
                  src={activeImage.url}
                  alt={`${displayTitle} - ${activeImage.label}`}
                  className="w-full h-full object-contain p-6 object-center transition-all duration-500"
                />

                {/* Badge Overlay */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="bg-[#1a1a1a] text-white text-[9px] font-black uppercase px-3 py-1 tracking-wider shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#86a84e] animate-pulse" />
                    <span>{displayBadge}</span>
                  </span>
                </div>

                {/* View Label Tag */}
                <div className="absolute bottom-3 right-3 z-10 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 border border-[#e5e1d8] text-[10px] font-mono uppercase tracking-wider text-[#4b5563]">
                  {activeImage.label}
                </div>
              </div>

              {/* Desktop Thumbnail Row */}
              {gallery.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {gallery.map((view, idx) => (
                    <button
                      key={`${view.label}-${idx}`}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`relative w-24 h-24 shrink-0 border overflow-hidden cursor-pointer transition-all ${
                        activeImageIdx === idx
                          ? "border-[#1a1a1a] ring-2 ring-[#1a1a1a]/20 scale-102"
                          : "border-[#e5e1d8] opacity-70 hover:opacity-100 bg-white"
                      }`}
                    >
                      <img
                        src={view.url}
                        alt={view.label}
                        className="w-full h-full object-contain p-1"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] font-mono text-center uppercase py-0.5 text-white truncate px-0.5">
                        {view.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ===================== RIGHT: STICKY PURCHASE PANEL (Desktop >= lg) ===================== */}
          <div className="hidden lg:block lg:col-span-5 bg-white border border-[#e5e1d8] p-6 lg:p-8 lg:sticky lg:top-24 shadow-xs">
            {/* Category / Collection Tag */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#4a5c2d] font-bold">
                {targetProduct.category} // BESPOKE
              </span>
              {targetProduct.isPreorder && (
                <span className="text-[9px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 uppercase">
                  Orders Close Sunday
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-display text-2xl lg:text-3xl font-black uppercase text-[#1a1a1a] tracking-wide mb-2">
              {displayTitle}
            </h3>

            {/* Live Pricing */}
            <div className="flex items-baseline gap-3 mb-6 pb-6 border-b border-[#e5e1d8]">
              <span className="font-display text-3xl font-extrabold text-[#1a1a1a]">
                Rs {unitPrice}
              </span>
              {isCustomActive && (
                <span className="text-[11px] font-mono text-[#6b7280]">
                  (+Rs {customPrice} Custom Name)
                </span>
              )}
            </div>

            {/* Size Selector */}
            {targetProduct.sizes && targetProduct.sizes.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#6b7280] mb-2">
                  <span>SELECT SIZE</span>
                  <span className="text-[10px] text-[#4a5c2d] font-bold">
                    Selected: {selectedSize || "None"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {targetProduct.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      aria-pressed={selectedSize === s}
                      aria-label={`Select size ${s}`}
                      className={`flex-1 min-w-[42px] py-2 text-xs font-mono font-bold uppercase text-center transition-all cursor-pointer border ${
                        selectedSize === s
                          ? "bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-xs font-black"
                          : "bg-[#fafafa] text-[#1a1a1a] border-[#e5e1d8] hover:border-[#1a1a1a]"
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
              <div className="mb-6 p-4 bg-[#fafafa] border border-[#e5e1d8]">
                <label className="flex items-center gap-2 cursor-pointer mb-1.5">
                  <input
                    type="checkbox"
                    checked={isCustomizing}
                    onChange={(e) => setIsCustomizing(e.target.checked)}
                    className="w-4 h-4 text-[#4a5c2d] border-[#d1d5db] focus:ring-0"
                  />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1a1a1a]">
                    Personalize Custom Name (+Rs {customPrice})
                  </span>
                </label>

                {isCustomizing && (
                  <div className="mt-2.5">
                    <input
                      type="text"
                      maxLength={12}
                      value={customName}
                      onChange={handleCustomNameChange}
                      placeholder="ENTER NAME (E.G. MUPESA)"
                      aria-label="Custom jersey name personalization"
                      className="w-full bg-white border border-[#d1d5db] px-3 py-1.5 text-xs font-mono uppercase text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] tracking-widest"
                    />
                    {customName.trim() && (
                      <p className="mt-1.5 text-[10px] font-mono text-[#4a5c2d]">
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
              <div className="flex items-center border border-[#e5e1d8] bg-[#fafafa] shrink-0">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-10 h-12 text-sm text-[#6b7280] hover:text-[#1a1a1a] transition-colors cursor-pointer"
                >
                  -
                </button>
                <span className="w-10 text-center font-mono text-xs font-bold text-[#1a1a1a]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  aria-label="Increase quantity"
                  className="w-10 h-12 text-sm text-[#6b7280] hover:text-[#1a1a1a] transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 h-12 bg-[#1a1a1a] hover:bg-neutral-800 text-white font-display font-black tracking-widest text-xs uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>ADD TO CART · RS {unitPrice * quantity}</span>
                <span>→</span>
              </button>
            </div>

            {/* Accordion Tabs (Babwê Style Details) */}
            <div className="border-t border-[#e5e1d8] pt-4 flex flex-col gap-2">
              {/* Tab 1: Cultural & Craft Narrative */}
              <div className="border border-[#e5e1d8] bg-[#fafafa]">
                <button
                  onClick={() => toggleAccordion("story")}
                  aria-expanded={openAccordion === "story"}
                  aria-controls="spotlight-story-desktop"
                  className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-mono uppercase tracking-wider text-[#1a1a1a] cursor-pointer"
                >
                  <span>Heritage Story & Craft Details</span>
                  <span className="font-bold">
                    {openAccordion === "story" ? "−" : "+"}
                  </span>
                </button>
                {openAccordion === "story" && (
                  <div
                    id="spotlight-story-desktop"
                    role="region"
                    className="px-4 pb-4 text-xs text-[#6b7280] leading-relaxed border-t border-[#e5e1d8] pt-3 whitespace-pre-line font-sans"
                  >
                    {displayDescription}
                  </div>
                )}
              </div>

              {/* Tab 2: Sizing & Fit Advice */}
              <div className="border border-[#e5e1d8] bg-[#fafafa]">
                <button
                  onClick={() => toggleAccordion("sizing")}
                  aria-expanded={openAccordion === "sizing"}
                  aria-controls="spotlight-sizing-desktop"
                  className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-mono uppercase tracking-wider text-[#1a1a1a] cursor-pointer"
                >
                  <span>Sizing & Fit Advice</span>
                  <span className="font-bold">
                    {openAccordion === "sizing" ? "−" : "+"}
                  </span>
                </button>
                {openAccordion === "sizing" && (
                  <div
                    id="spotlight-sizing-desktop"
                    role="region"
                    className="px-4 pb-4 text-xs text-[#6b7280] leading-relaxed border-t border-[#e5e1d8] pt-3 font-sans"
                  >
                    True to size athletic cut with relaxed streetwear shoulders.
                    For an oversized, boxy look, we recommend sizing up one full
                    size.
                  </div>
                )}
              </div>

              {/* Tab 3: Mauritius Pickups & Delivery */}
              <div className="border border-[#e5e1d8] bg-[#fafafa]">
                <button
                  onClick={() => toggleAccordion("delivery")}
                  aria-expanded={openAccordion === "delivery"}
                  aria-controls="spotlight-delivery-desktop"
                  className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-mono uppercase tracking-wider text-[#1a1a1a] cursor-pointer"
                >
                  <span>Mauritius Pickups & Delivery</span>
                  <span className="font-bold">
                    {openAccordion === "delivery" ? "−" : "+"}
                  </span>
                </button>
                {openAccordion === "delivery" && (
                  <div
                    id="spotlight-delivery-desktop"
                    role="region"
                    className="px-4 pb-4 text-xs text-[#6b7280] leading-relaxed border-t border-[#e5e1d8] pt-3 font-sans"
                  >
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

      {/* ===================== MOBILE SLIDE-UP BOTTOM SHEET DRAWER ===================== */}
      {isDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="spotlight-drawer-title"
          id="spotlight-mobile-drawer"
          className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden"
        >
          {/* Backdrop */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer Surface */}
          <div
            ref={drawerRef}
            className="relative z-10 w-full max-h-[85vh] max-h-[85dvh] overscroll-contain bg-white border-t border-[#e5e1d8] rounded-t-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden"
          >
            {/* Centered Pull Handle */}
            <div className="w-full pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1 bg-[#d1d5db] rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 pb-3 border-b border-[#f0eee6] flex items-center justify-between shrink-0">
              <div className="min-w-0 flex-1 mr-3">
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#4a5c2d] font-bold block">
                  {targetProduct.category} // BESPOKE
                </span>
                <h4
                  id="spotlight-drawer-title"
                  className="font-display text-base font-black uppercase text-[#1a1a1a] truncate"
                >
                  {displayTitle}
                </h4>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f5f2ec] text-[#1a1a1a] hover:bg-[#e5e1d8] flex items-center justify-center text-sm font-bold cursor-pointer shrink-0"
                aria-label="Close options drawer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Drawer Body */}
            <div className="overflow-y-auto px-5 pt-4 pb-10 flex flex-col gap-5">
              {/* Live Pricing */}
              <div className="flex items-baseline justify-between border-b border-[#f0eee6] pb-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-2xl font-black text-[#1a1a1a]">
                    Rs {unitPrice}
                  </span>
                  {isCustomActive && (
                    <span className="text-[10px] font-mono text-[#6b7280]">
                      (+Rs {customPrice} Custom Name)
                    </span>
                  )}
                </div>
                {targetProduct.isPreorder && (
                  <span className="text-[9px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 uppercase">
                    Pre-Order
                  </span>
                )}
              </div>

              {/* Size Selector */}
              {targetProduct.sizes && targetProduct.sizes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#6b7280] mb-2">
                    <span>SELECT SIZE</span>
                    <span className="text-[10px] text-[#4a5c2d] font-bold">
                      Selected: {selectedSize || "None"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {targetProduct.sizes.map((s) => (
                      <button
                        key={`drawer-${s}`}
                        onClick={() => setSelectedSize(s)}
                        aria-pressed={selectedSize === s}
                        aria-label={`Select size ${s}`}
                        className={`flex-1 min-w-[44px] py-2.5 text-xs font-mono font-bold uppercase text-center transition-all cursor-pointer border ${
                          selectedSize === s
                            ? "bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-xs font-black"
                            : "bg-[#fafafa] text-[#1a1a1a] border-[#e5e1d8] hover:border-[#1a1a1a]"
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
                <div className="p-3.5 bg-[#fafafa] border border-[#e5e1d8]">
                  <label className="flex items-center gap-2 cursor-pointer mb-1.5">
                    <input
                      type="checkbox"
                      checked={isCustomizing}
                      onChange={(e) => setIsCustomizing(e.target.checked)}
                      className="w-4 h-4 text-[#4a5c2d] border-[#d1d5db] focus:ring-0"
                    />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1a1a1a]">
                      Personalize Custom Name (+Rs {customPrice})
                    </span>
                  </label>

                  {isCustomizing && (
                    <div className="mt-2">
                      <input
                        type="text"
                        maxLength={12}
                        value={customName}
                        onChange={handleCustomNameChange}
                        placeholder="ENTER NAME (E.G. MUPESA)"
                        aria-label="Custom jersey name personalization"
                        className="w-full bg-white border border-[#d1d5db] px-3 py-1.5 text-xs font-mono uppercase text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] tracking-widest"
                      />
                      {customName.trim() && (
                        <p className="mt-1 text-[10px] font-mono text-[#4a5c2d]">
                          ✓ Printed above &apos;02&apos; on jersey back:{" "}
                          <span className="font-bold">{customName.trim()}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Quantity & Add to Cart Controls */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center border border-[#e5e1d8] bg-[#fafafa] shrink-0">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="w-9 h-11 text-sm text-[#6b7280] hover:text-[#1a1a1a] transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-mono text-xs font-bold text-[#1a1a1a]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    aria-label="Increase quantity"
                    className="w-9 h-11 text-sm text-[#6b7280] hover:text-[#1a1a1a] transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => {
                    handleAddToCart()
                    setIsDrawerOpen(false)
                  }}
                  className="flex-1 h-11 bg-[#1a1a1a] hover:bg-neutral-800 text-white font-display font-black tracking-widest text-xs uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>ADD TO CART · RS {unitPrice * quantity}</span>
                  <span>→</span>
                </button>
              </div>

              {/* Accordion Details */}
              <div className="border-t border-[#f0eee6] pt-3 flex flex-col gap-2">
                {/* Tab 1 */}
                <div className="border border-[#e5e1d8] bg-[#fafafa]">
                  <button
                    onClick={() => toggleAccordion("story-mobile")}
                    aria-expanded={openAccordion === "story-mobile"}
                    aria-controls="spotlight-story-mobile"
                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-left text-[11px] font-mono uppercase tracking-wider text-[#1a1a1a] cursor-pointer"
                  >
                    <span>Heritage Story & Craft Details</span>
                    <span className="font-bold">
                      {openAccordion === "story-mobile" ? "−" : "+"}
                    </span>
                  </button>
                  {openAccordion === "story-mobile" && (
                    <div
                      id="spotlight-story-mobile"
                      role="region"
                      className="px-3.5 pb-3 text-xs text-[#6b7280] leading-relaxed border-t border-[#e5e1d8] pt-2 whitespace-pre-line font-sans"
                    >
                      {displayDescription}
                    </div>
                  )}
                </div>

                {/* Tab 2 */}
                <div className="border border-[#e5e1d8] bg-[#fafafa]">
                  <button
                    onClick={() => toggleAccordion("sizing-mobile")}
                    aria-expanded={openAccordion === "sizing-mobile"}
                    aria-controls="spotlight-sizing-mobile"
                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-left text-[11px] font-mono uppercase tracking-wider text-[#1a1a1a] cursor-pointer"
                  >
                    <span>Sizing & Fit Advice</span>
                    <span className="font-bold">
                      {openAccordion === "sizing-mobile" ? "−" : "+"}
                    </span>
                  </button>
                  {openAccordion === "sizing-mobile" && (
                    <div
                      id="spotlight-sizing-mobile"
                      role="region"
                      className="px-3.5 pb-3 text-xs text-[#6b7280] leading-relaxed border-t border-[#e5e1d8] pt-2 font-sans"
                    >
                      True to size athletic cut with relaxed streetwear
                      shoulders. For an oversized, boxy look, we recommend
                      sizing up one full size.
                    </div>
                  )}
                </div>

                {/* Tab 3 */}
                <div className="border border-[#e5e1d8] bg-[#fafafa]">
                  <button
                    onClick={() => toggleAccordion("delivery-mobile")}
                    aria-expanded={openAccordion === "delivery-mobile"}
                    aria-controls="spotlight-delivery-mobile"
                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-left text-[11px] font-mono uppercase tracking-wider text-[#1a1a1a] cursor-pointer"
                  >
                    <span>Mauritius Pickups & Delivery</span>
                    <span className="font-bold">
                      {openAccordion === "delivery-mobile" ? "−" : "+"}
                    </span>
                  </button>
                  {openAccordion === "delivery-mobile" && (
                    <div
                      id="spotlight-delivery-mobile"
                      role="region"
                      className="px-3.5 pb-3 text-xs text-[#6b7280] leading-relaxed border-t border-[#e5e1d8] pt-2 font-sans"
                    >
                      Free collection from designated drop points across Port
                      Louis, Grand Baie, Curepipe, Flic en Flac, and Ébène.
                      Direct island-wide doorstep courier delivery available
                      across Mauritius.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
