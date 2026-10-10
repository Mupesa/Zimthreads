import React, { useState, useMemo } from "react"
import { Link } from "@/router"
import { useStore } from "@/store/StoreContext"
import { Product, racingJacketsCollection } from "@/store/seedData"
import ProductModal from "@/components/ProductModal"
import { BagIcon, CheckIcon, SparklesIcon } from "@/components/Icons"

export default function JacketsCollectionPage() {
  const { products, addToCart, showToast } = useStore()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({})

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

  const handleSelectSize = (productId: string, size: string) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }))
  }

  const handleQuickAdd = (p: Product) => {
    const size =
      selectedSizes[p.id] || (p.sizes && p.sizes.length > 0 ? p.sizes[0] : "L")
    addToCart(p, 1, size)
    showToast(
      "Added to Bag",
      `${p.name} (${size}) added to your bag at Rs ${p.price}.`,
      "success",
    )
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
              An archival collection of 14 iconic vintage motorsport racing
              garments. Preserved in authentic 90s boxy racing silhouettes,
              each piece features genuine heavy cowhide leathers, high-stitch
              embroidered sponsor patches, and technical satin paddock tourers.
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
              <span className="bg-[#1f2937] px-3.5 py-1.5 border border-[#374151] text-white">
                Continuous Editorial Lookbook
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CONTINUOUS EDITORIAL LOOKBOOK STREAM ===================== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20 lg:space-y-28">
        {jacketProducts.map((p, index) => {
          const activeSize =
            selectedSizes[p.id] ||
            (p.sizes && p.sizes.length > 0 ? p.sizes[0] : "L")
          const isEven = index % 2 === 0
          const editionNumber = String(index + 1).padStart(2, "0")

          return (
            <article
              key={p.id}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-white border border-[#e5e1d8] p-6 sm:p-8 lg:p-12 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {/* Giant Background Watermark Number */}
              <div className="absolute right-4 bottom-0 text-[10rem] font-display font-black text-black/[0.03] select-none pointer-events-none leading-none">
                {editionNumber}
              </div>

              {/* Showcase Image Column */}
              <div
                className={`lg:col-span-6 ${
                  isEven ? "lg:order-1" : "lg:order-2"
                }`}
              >
                <div
                  onClick={() => setSelectedProduct(p)}
                  className="aspect-square bg-[#f5f2ec] overflow-hidden relative cursor-pointer group border border-[#e5e1d8]"
                >
                  <img
                    src={p.img}
                    alt={p.alt || p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />

                  {/* Badge */}
                  {p.badge && (
                    <span className="absolute top-4 left-4 bg-[#1a1a1a] text-white text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 shadow-md z-10">
                      {p.badge}
                    </span>
                  )}

                  {/* Stock Notice */}
                  {p.stock <= 8 && p.stock > 0 && (
                    <span className="absolute bottom-4 right-4 bg-amber-600 text-white text-[9px] font-bold uppercase px-2.5 py-0.5 z-10">
                      Limited · {p.stock} In Stock
                    </span>
                  )}

                  {/* Zoom Inspect Overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/95 backdrop-blur-xs text-[#1a1a1a] text-xs font-bold uppercase tracking-widest px-4 py-2 shadow-lg">
                      Inspect Details ↗
                    </span>
                  </div>
                </div>
              </div>

              {/* Storytelling & Action Column */}
              <div
                className={`lg:col-span-6 flex flex-col justify-between space-y-6 ${
                  isEven ? "lg:order-2" : "lg:order-1"
                }`}
              >
                <div>
                  {/* Edition Index & Category Tag */}
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <span className="text-[11px] font-mono font-bold tracking-widest text-[#4a5c2d] uppercase">
                      EDITION {editionNumber} / {jacketProducts.length}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-[#9ca3af] tracking-wider">
                      {p.tag || "Archive Selection"}
                    </span>
                  </div>

                  {/* Jacket Title */}
                  <h2
                    onClick={() => setSelectedProduct(p)}
                    className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold uppercase text-[#1a1a1a] leading-tight hover:text-[#4a5c2d] transition-colors cursor-pointer"
                  >
                    {p.name}
                  </h2>

                  {/* Price Tag */}
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#9ca3af]">
                      Price:
                    </span>
                    <span className="font-display text-2xl sm:text-3xl font-extrabold text-[#1a1a1a]">
                      Rs {p.price}
                    </span>
                  </div>

                  {/* Detailed Craftsmanship Notes */}
                  <div className="mt-4 pt-4 border-t border-[#f5f2ec]">
                    <p className="text-xs sm:text-sm text-[#4b5563] leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  {/* Silhouette and Fit Spec Note */}
                  <div className="mt-4 p-3 bg-[#f9fafb] border border-[#e5e1d8] flex items-center gap-2 text-xs text-[#6b7280]">
                    <span className="font-bold uppercase tracking-wider text-[#1a1a1a]">
                      Silhouette:
                    </span>
                    <span>Authentic 90s Boxy Pit Fit · Drop Shoulder</span>
                  </div>
                </div>

                {/* Purchasing Section */}
                <div className="pt-6 border-t border-[#e5e1d8] space-y-4">
                  {/* Size Selector */}
                  {p.sizes && p.sizes.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold uppercase tracking-wider text-[#6b7280]">
                          Select Size:
                        </span>
                        <span className="font-bold text-[#1a1a1a]">
                          Size {activeSize}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {p.sizes.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleSelectSize(p.id, s)}
                            className={`w-10 h-10 text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center ${
                              activeSize === s
                                ? "bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-xs"
                                : "border-[#e5e1d8] text-[#1a1a1a] hover:border-[#1a1a1a] bg-white"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      onClick={() => handleQuickAdd(p)}
                      disabled={p.stock <= 0}
                      className="flex-1 py-3.5 px-6 bg-[#4a5c2d] hover:bg-[#5a7038] text-white text-xs font-extrabold tracking-widest uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <BagIcon className="w-4 h-4" />
                      <span>+ ADD TO BAG · RS {p.price}</span>
                    </button>

                    <button
                      onClick={() => setSelectedProduct(p)}
                      className="py-3.5 px-5 bg-white border border-[#1a1a1a] hover:bg-black hover:text-white text-[#1a1a1a] text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
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
              and slightly cropped hem. Order your true size for tailored structure, or
              size up for an oversized drape.
            </p>
          </div>

          <div className="border-l-2 border-[#4a5c2d] pl-4">
            <h3 className="font-display text-sm font-bold uppercase text-[#1a1a1a] mb-1.5">
              Material Authenticity
            </h3>
            <p className="text-xs text-[#6b7280] leading-relaxed">
              Crafted with heavy top-grain cowhide leather, heavy satin twill, and
              high-density embroidered sponsor heraldry. Fitted with heavy-gauge YKK
              zippers and quilted diamond interior lining.
            </p>
          </div>

          <div className="border-l-2 border-[#4a5c2d] pl-4">
            <h3 className="font-display text-sm font-bold uppercase text-[#1a1a1a] mb-1.5">
              Mauritius Atelier Care
            </h3>
            <p className="text-xs text-[#6b7280] leading-relaxed">
              Specialist leather conditioning and dry-cleaning recommended. Zimthreads
              provides complimentary sneaker laundry consultations and garment care advice.
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

      {/* Close-Up Inspection Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </main>
  )
}
