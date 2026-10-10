import React, { useState, useMemo } from "react"
import { Link } from "@/router"
import { useStore } from "@/store/StoreContext"
import { Product, racingJacketsCollection } from "@/store/seedData"
import ProductModal from "@/components/ProductModal"

export default function JacketsCollectionPage() {
  const { products } = useStore()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [expandedDescIds, setExpandedDescIds] = useState<Record<string, boolean>>({})

  // Retrieve all products belonging to this collection
  const jacketProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.collectionId === "racing-jackets" ||
        racingJacketsCollection.productIds.includes(p.id) ||
        p.id.startsWith("prod-jacket-"),
    )
  }, [products])

  const minPrice = useMemo(() => {
    if (jacketProducts.length === 0) return 1750
    return Math.min(...jacketProducts.map((p) => p.price))
  }, [jacketProducts])

  const maxPrice = useMemo(() => {
    if (jacketProducts.length === 0) return 2850
    return Math.max(...jacketProducts.map((p) => p.price))
  }, [jacketProducts])

  const toggleDescription = (id: string) => {
    setExpandedDescIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <main className="min-h-screen bg-[#f5f2ec] text-[#1a1a1a]">
      {/* ===================== EDITORIAL MASTHEAD ===================== */}
      <section className="bg-[#111827] text-[#f5f2ec] border-b border-[#374151] pt-12 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle backdrop overlay */}
        <div
          className="absolute inset-0 opacity-10 bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage: `url('${racingJacketsCollection.heroImage}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#111827]/70 to-[#111827] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#86a84e] hover:text-white transition-colors"
            >
              <span>←</span>
              <span>Back to Shop</span>
            </Link>

            <div className="inline-flex items-center gap-2 bg-[#1f2937] border border-[#374151] px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[#86a84e]">
              <span className="w-2 h-2 rounded-full bg-[#86a84e] animate-pulse" />
              <span>ZIMTHREADS ATELIER // CAPSULE 01</span>
            </div>
          </div>

          {/* Headline & Editorial Copy */}
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold tracking-[0.35em] uppercase text-[#86a84e] mb-2">
              The Curated Collection
            </p>
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold uppercase leading-[0.92] text-white tracking-wide">
              THE PADDOCK ARCHIVE
            </h1>
            <p className="font-display text-lg sm:text-2xl font-bold uppercase text-[#9ca3af] mt-3 tracking-wider">
              Vintage Motorsport & Retro Racing Jackets
            </p>
            <p className="mt-5 text-sm sm:text-base text-[#d1d5db] leading-relaxed max-w-2xl">
              An archival collection of 14 iconic vintage motorsport racing garments.
              Preserved in authentic 90s boxy racing silhouettes with heavy cowhide
              leathers and technical paddock twills. Tap any piece to view its craftsmanship
              story and sizing.
            </p>

            {/* Collection Metadata Strip */}
            <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-[#374151] text-[11px] font-mono uppercase">
              <span className="bg-[#1f2937] px-3.5 py-1.5 border border-[#374151] text-white">
                {jacketProducts.length} Curated Editions
              </span>
              <span className="bg-[#1f2937] px-3.5 py-1.5 border border-[#374151] text-[#86a84e] font-bold">
                From Rs {minPrice} — Rs {maxPrice}
              </span>
              <span className="bg-[#1f2937] px-3.5 py-1.5 border border-[#374151] text-white">
                Sizes S to XXL
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== JACKETS GALLERY GRID ===================== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {jacketProducts.map((p, index) => {
            const editionNumber = String(index + 1).padStart(2, "0")
            const isExpanded = expandedDescIds[p.id]

            return (
              <article
                key={p.id}
                className="group bg-white border border-[#e5e1d8] overflow-hidden hover:border-[#4a5c2d] hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                {/* Clickable Image Area */}
                <div
                  onClick={() => setSelectedProduct(p)}
                  className="aspect-[4/5] bg-[#f5f2ec] overflow-hidden relative cursor-pointer"
                >
                  <img
                    src={p.img}
                    alt={p.alt || p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />

                  {/* Badge */}
                  {p.badge && (
                    <span className="absolute top-3 left-3 bg-[#1a1a1a] text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 shadow-md z-10">
                      {p.badge}
                    </span>
                  )}

                  {/* Edition Tag */}
                  <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-[#1a1a1a] text-[9px] font-mono font-bold px-2 py-0.5 shadow-xs z-10">
                    #{editionNumber}
                  </span>

                  {/* Stock Notice */}
                  {p.stock <= 5 && p.stock > 0 && (
                    <span className="absolute bottom-3 right-3 bg-amber-600 text-white text-[8px] sm:text-[9px] font-bold uppercase px-2 py-0.5 z-10">
                      Low Stock · {p.stock} Left
                    </span>
                  )}

                  {/* Hover Inspect Overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                    <span className="bg-white/95 backdrop-blur-xs text-[#1a1a1a] text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 shadow-md">
                      View Description & Sizes ↗
                    </span>
                  </div>
                </div>

                {/* Product Info: Name and Price */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#6b7280] uppercase tracking-wider mb-1.5">
                      <span>Edition {editionNumber} / {jacketProducts.length}</span>
                      <span>{p.sizes ? `${p.sizes.length} Sizes (S–XXL)` : "Archival"}</span>
                    </div>

                    {/* Jacket Name */}
                    <h2
                      onClick={() => setSelectedProduct(p)}
                      className="font-display text-base sm:text-lg font-extrabold uppercase text-[#1a1a1a] leading-tight hover:text-[#4a5c2d] transition-colors cursor-pointer mb-2 line-clamp-2"
                      title={p.name}
                    >
                      {p.name}
                    </h2>

                    {/* Price and Inline Description Trigger */}
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="font-display text-lg sm:text-xl font-bold text-[#1a1a1a]">
                        Rs {p.price}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleDescription(p.id)
                        }}
                        className="text-[10px] font-bold uppercase tracking-wider text-[#4a5c2d] hover:text-[#1a1a1a] transition-colors cursor-pointer"
                      >
                        {isExpanded ? "Hide Description ▴" : "Description ▾"}
                      </button>
                    </div>

                    {/* Expandable Description when toggled */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-[#f5f2ec] text-xs text-[#6b7280] leading-relaxed">
                        <p className="mb-2 whitespace-pre-line">{p.description}</p>
                        <div className="text-[10px] font-mono text-[#9ca3af] uppercase">
                          Silhouette: Authentic 90s Boxy Pit Fit
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Primary Press Action */}
                  <div className="pt-4 mt-3 border-t border-[#f5f2ec]">
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(p)}
                      className="w-full py-2.5 bg-[#1a1a1a] hover:bg-[#4a5c2d] text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors cursor-pointer text-center"
                    >
                      View Details & Sizes
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* ===================== FOOTER ATELIER NOTES ===================== */}
      <section className="bg-white border-t border-[#e5e1d8] py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border-l-2 border-[#4a5c2d] pl-4">
            <h3 className="font-display text-sm font-bold uppercase text-[#1a1a1a] mb-1.5">
              90s Boxy Fit Guide
            </h3>
            <p className="text-xs text-[#6b7280] leading-relaxed">
              Cut in authentic vintage pit-lane proportions with structured chest width
              and slightly cropped hem. True to size for tailored boxy structure.
            </p>
          </div>

          <div className="border-l-2 border-[#4a5c2d] pl-4">
            <h3 className="font-display text-sm font-bold uppercase text-[#1a1a1a] mb-1.5">
              Material Authenticity
            </h3>
            <p className="text-xs text-[#6b7280] leading-relaxed">
              Crafted with heavy top-grain cowhide leather, heavy satin twill, and
              high-density embroidered sponsor heraldry with quilted diamond linings.
            </p>
          </div>

          <div className="border-l-2 border-[#4a5c2d] pl-4">
            <h3 className="font-display text-sm font-bold uppercase text-[#1a1a1a] mb-1.5">
              Mauritius Atelier Care
            </h3>
            <p className="text-xs text-[#6b7280] leading-relaxed">
              Specialist leather conditioning and dry-cleaning recommended. Zimthreads
              provides complimentary footwear and garment care advice.
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#4a5c2d] transition-colors"
          >
            <span>← Return to Full Shop</span>
          </Link>
        </div>
      </section>

      {/* Close-Up Product Modal (Shows Full Description, Sizes, and Add to Bag) */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </main>
  )
}
