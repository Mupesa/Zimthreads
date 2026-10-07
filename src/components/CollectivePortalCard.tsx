import React, { useState, useEffect } from "react"
import { racingJacketsCollection, Product } from "@/store/seedData"

interface CollectivePortalCardProps {
  products: Product[]
  onOpenCollective: () => void
}

export default function CollectivePortalCard({
  products,
  onOpenCollective,
}: CollectivePortalCardProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Get collective products for dynamic stats
  const jacketProducts = products.filter(
    (p) =>
      p.collectionId === "racing-jackets" ||
      racingJacketsCollection.productIds.includes(p.id)
  )

  const previewImages =
    jacketProducts.length > 0
      ? jacketProducts.slice(0, 6).map((p) => p.img)
      : racingJacketsCollection.previewImages

  const minPrice =
    jacketProducts.length > 0
      ? Math.min(...jacketProducts.map((p) => p.price))
      : 1750
  const maxPrice =
    jacketProducts.length > 0
      ? Math.max(...jacketProducts.map((p) => p.price))
      : 2850

  // Auto-advance preview slides
  useEffect(() => {
    if (previewImages.length <= 1) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % previewImages.length)
    }, 3200)
    return () => clearInterval(interval)
  }, [previewImages.length])

  return (
    <div
      onClick={onOpenCollective}
      className="col-span-2 sm:col-span-2 lg:col-span-2 row-span-1 bg-[#111827] text-white border-2 border-[#1a1a1a] hover:border-[#86a84e] transition-all cursor-pointer overflow-hidden shadow-lg group relative flex flex-col justify-between"
    >
      {/* Background ambient gradient */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />

      {/* Top Banner Tag */}
      <div className="p-4 sm:p-5 pb-2 flex items-center justify-between z-10">
        <div className="inline-flex items-center gap-2 bg-[#1f2937] border border-[#374151] px-2.5 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#86a84e]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#86a84e] animate-pulse" />
          <span>CAPSULE DROP · 14 EDITIONS</span>
        </div>
        <span className="text-[10px] sm:text-xs font-mono font-bold text-[#9ca3af]">
          Rs {minPrice} – Rs {maxPrice}
        </span>
      </div>

      {/* Center visual & description */}
      <div className="p-4 sm:p-5 pt-0 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center z-10">
        {/* Visual carousel / preview */}
        <div className="sm:col-span-5 relative aspect-square bg-[#1f2937] overflow-hidden border border-[#374151]">
          {previewImages.map((img, idx) => (
            <img
              key={img}
              src={img}
              alt="Motorsport Archive Preview"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                idx === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105"
              }`}
            />
          ))}

          {/* Slide Indicator Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs">
            {previewImages.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentSlide ? "bg-[#86a84e] w-3" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Editorial Text */}
        <div className="sm:col-span-7 flex flex-col justify-center space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#86a84e]">
            The Collective Showcase
          </p>
          <h3 className="font-display text-xl sm:text-2xl font-extrabold uppercase leading-tight text-white group-hover:text-[#86a84e] transition-colors">
            THE PADDOCK ARCHIVE // RACING JACKETS
          </h3>
          <p className="text-xs text-[#d1d5db] line-clamp-3 leading-relaxed">
            Curated vintage Grand Prix & NASCAR motorsport jackets. Authentic cowhide leathers,
            embroidered team bombers, and DTM tourers — each with unique individual pricing and detailing.
          </p>

          {/* Mini thumbnails strip */}
          <div className="flex items-center gap-1.5 pt-1">
            {previewImages.slice(0, 4).map((img, idx) => (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentSlide(idx)
                }}
                className={`w-8 h-8 rounded-xs overflow-hidden border transition-all cursor-pointer ${
                  idx === currentSlide ? "border-[#86a84e] scale-105" : "border-[#374151] opacity-60"
                }`}
              >
                <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
              </div>
            ))}
            <span className="text-[9px] font-mono text-[#9ca3af] pl-1">
              +10 more
            </span>
          </div>
        </div>
      </div>

      {/* Bottom CTA bar */}
      <div className="p-3 sm:p-4 bg-[#1f2937]/80 border-t border-[#374151] flex items-center justify-between z-10 group-hover:bg-[#4a5c2d] transition-colors">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#d1d5db] group-hover:text-white">
          Explore all 14 individual jacket editions
        </span>
        <span className="text-xs font-black uppercase tracking-widest text-[#86a84e] group-hover:text-white flex items-center gap-1">
          <span>ENTER SHOWCASE</span>
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </span>
      </div>
    </div>
  )
}
