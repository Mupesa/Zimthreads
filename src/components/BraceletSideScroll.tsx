import React, { useRef, useState, useEffect } from "react"
import { Product } from "@/store/seedData"
import { useStore } from "@/store/StoreContext"

interface BraceletSideScrollProps {
  bracelets: Product[]
  onSelectProduct: (product: Product) => void
}

export default function BraceletSideScroll({
  bracelets,
  onSelectProduct,
}: BraceletSideScrollProps) {
  const { addToCart } = useStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeftState, setScrollLeftState] = useState(0)

  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)

    const maxScroll = scrollWidth - clientWidth
    if (maxScroll > 0) {
      setScrollProgress(
        Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100)),
      )
    }
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true })
      window.addEventListener("resize", checkScroll)
      return () => {
        el.removeEventListener("scroll", checkScroll)
        window.removeEventListener("resize", checkScroll)
      }
    }
  }, [bracelets])

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    const distance = 320
    scrollRef.current.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    })
  }

  // Mouse drag to scroll handlers for desktop UX
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - scrollRef.current.offsetLeft)
    setScrollLeftState(scrollRef.current.scrollLeft)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX) * 1.5
    scrollRef.current.scrollLeft = scrollLeftState - walk
  }

  const handleMouseUpOrLeave = () => {
    setIsDragging(false)
  }

  const handleQuickPresale = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation()
    addToCart(p, 1, p.sizes ? p.sizes[0] : undefined)
  }

  if (!bracelets || bracelets.length === 0) return null

  return (
    <section className="mb-14 border border-[#e5e1d8] bg-[#fcfbfa] p-4 sm:p-7 relative overflow-hidden shadow-xs">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-[#e5e1d8]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#4a5c2d] text-white text-[9px] font-extrabold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
              <span>PRESALE DROP</span>
            </span>
            <span className="text-[10px] font-bold text-[#6b7280] tracking-wider uppercase">
              12 National & Heritage Editions
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-[#1a1a1a] tracking-tight">
            BEADED HERITAGE BRACELETS
          </h2>
          <p className="text-xs text-[#6b7280] max-w-xl mt-1">
            Hand-strung artisan beadwork celebrating Mauritian, East African,
            and Pan-African heritage. Special presale pricing at{" "}
            <strong className="text-[#1a1a1a]">Rs 320 each</strong>.
          </p>
        </div>

        {/* Navigation Arrows & Counter */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <span className="hidden md:inline-block text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mr-2">
            Scroll or Drag ⟶
          </span>
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className="w-9 h-9 border border-[#e5e1d8] bg-white flex items-center justify-center text-[#1a1a1a] text-lg font-bold hover:bg-[#1a1a1a] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#1a1a1a] disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
          >
            ‹
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className="w-9 h-9 border border-[#e5e1d8] bg-white flex items-center justify-center text-[#1a1a1a] text-lg font-bold hover:bg-[#1a1a1a] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#1a1a1a] disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
          >
            ›
          </button>
        </div>
      </div>

      {/* Horizontal Side-Scroll Track */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth scrollbar-hide select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {bracelets.map((b) => (
          <div
            key={b.id}
            onClick={() => onSelectProduct(b)}
            className="group w-[240px] sm:w-[270px] shrink-0 snap-start bg-white border border-[#e5e1d8] hover:border-[#4a5c2d] transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-xs hover:shadow-md"
          >
            {/* Image Container with Badges */}
            <div className="relative aspect-square bg-[#fbf9f6] flex items-center justify-center p-4 overflow-hidden border-b border-[#f0ede6]">
              {/* Presale Badge */}
              <div className="absolute top-2.5 left-2.5 z-10">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#4a5c2d] text-white text-[8px] font-extrabold uppercase tracking-widest shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                  <span>PRESALE</span>
                </span>
              </div>

              {/* Tag / Region Badge */}
              {b.tag && (
                <div className="absolute top-2.5 right-2.5 z-10">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-[#6b7280] bg-white/90 backdrop-blur-xs px-2 py-0.5 border border-[#e5e1d8]">
                    {b.tag}
                  </span>
                </div>
              )}

              {/* High-Res Product Image */}
              <img
                src={b.img}
                alt={b.alt}
                loading="lazy"
                draggable={false}
                className="max-h-[175px] w-auto max-w-full object-contain drop-shadow-sm group-hover:scale-108 transition-transform duration-500 ease-out"
              />

              {/* Quick View Overlay on Hover */}
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2 pointer-events-none">
                <span className="bg-white/95 text-[#1a1a1a] text-[9px] font-bold uppercase tracking-widest px-3 py-1 shadow-xs border border-[#e5e1d8]">
                  Quick View
                </span>
              </div>
            </div>

            {/* Product Meta & Actions */}
            <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1">
              <div>
                <p className="text-[9px] font-semibold text-[#4a5c2d] uppercase tracking-wider mb-1">
                  Accessories · Beadwork
                </p>
                <h3 className="font-display text-xs sm:text-sm font-bold text-[#1a1a1a] uppercase leading-snug line-clamp-2 group-hover:text-[#4a5c2d] transition-colors">
                  {b.name}
                </h3>
              </div>

              <div className="mt-3 pt-3 border-t border-[#f5f2ec] flex items-center justify-between gap-2">
                <div>
                  <span className="text-[9px] text-[#9ca3af] block leading-none mb-0.5">
                    Presale Price
                  </span>
                  <span className="font-display text-base sm:text-lg font-bold text-[#1a1a1a]">
                    Rs {b.price}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleQuickPresale(e, b)}
                  className="px-3 py-1.5 bg-[#4a5c2d] text-white text-[9px] sm:text-[10px] font-extrabold tracking-widest uppercase hover:bg-[#5a7038] active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  + PRESALE
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Track Progress Bar */}
      <div className="mt-4 pt-2 flex items-center justify-between gap-4">
        <div className="flex-1 bg-[#e5e1d8] h-1 relative overflow-hidden rounded-full">
          <div
            className="bg-[#4a5c2d] h-full transition-all duration-150"
            style={{ width: `${Math.max(10, scrollProgress)}%` }}
          />
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-[#6b7280] whitespace-nowrap">
          {bracelets.length} Styles Available
        </span>
      </div>
    </section>
  )
}
