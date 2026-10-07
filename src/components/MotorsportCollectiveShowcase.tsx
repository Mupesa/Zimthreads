import React, { useState, useMemo } from "react"
import { Product, racingJacketsCollection } from "@/store/seedData"
import { useStore } from "@/store/StoreContext"
import ProductModal from "@/components/ProductModal"
import { BagIcon, CheckIcon, SparklesIcon } from "@/components/Icons"

interface MotorsportCollectiveShowcaseProps {
  products: Product[]
  onBackToShop?: () => void
}

type TeamFilter = "all" | "ferrari" | "mercedes" | "bmw" | "redbull" | "heritage"
type SilhouetteFilter = "all" | "leather" | "bomber" | "windbreaker"
type SortOrder = "curated" | "price-asc" | "price-desc"

export default function MotorsportCollectiveShowcase({
  products,
  onBackToShop,
}: MotorsportCollectiveShowcaseProps) {
  const { addToCart, showToast } = useStore()

  const [teamFilter, setTeamFilter] = useState<TeamFilter>("all")
  const [silhouetteFilter, setSilhouetteFilter] = useState<SilhouetteFilter>("all")
  const [sortOrder, setSortOrder] = useState<SortOrder>("curated")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({})

  // Filter products belonging to this collective
  const collectiveProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.collectionId === "racing-jackets" ||
        racingJacketsCollection.productIds.includes(p.id)
    )
  }, [products])

  // Apply filters
  const filteredProducts = useMemo(() => {
    return collectiveProducts
      .filter((p) => {
        // Team filter
        if (teamFilter === "ferrari" && !p.name.toLowerCase().includes("ferrari")) return false
        if (teamFilter === "mercedes" && !p.name.toLowerCase().includes("mercedes")) return false
        if (teamFilter === "bmw" && !p.name.toLowerCase().includes("bmw")) return false
        if (teamFilter === "redbull" && !p.name.toLowerCase().includes("red bull")) return false
        if (
          teamFilter === "heritage" &&
          (p.name.toLowerCase().includes("ferrari") ||
            p.name.toLowerCase().includes("mercedes") ||
            p.name.toLowerCase().includes("bmw") ||
            p.name.toLowerCase().includes("red bull"))
        ) {
          return false
        }

        // Silhouette filter
        if (silhouetteFilter === "leather") {
          const isLeather =
            p.badge?.includes("LEATHER") ||
            p.description.toLowerCase().includes("leather")
          if (!isLeather) return false
        }
        if (silhouetteFilter === "bomber") {
          const isBomber =
            p.name.toLowerCase().includes("bomber") ||
            p.badge?.includes("BOMBER") ||
            p.description.toLowerCase().includes("bomber")
          if (!isBomber) return false
        }
        if (silhouetteFilter === "windbreaker") {
          const isWindbreaker =
            p.name.toLowerCase().includes("windbreaker") ||
            p.name.toLowerCase().includes("shell") ||
            p.badge?.includes("WINDBREAKER") ||
            p.badge?.includes("RALLYE")
          if (!isWindbreaker) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortOrder === "price-asc") return a.price - b.price
        if (sortOrder === "price-desc") return b.price - a.price
        // Curated order: leathers first, then prominent bombers
        return 0
      })
  }, [collectiveProducts, teamFilter, silhouetteFilter, sortOrder])

  // Dynamic price range calculation
  const priceRange = useMemo(() => {
    if (collectiveProducts.length === 0) return { min: 1750, max: 2850 }
    const prices = collectiveProducts.map((p) => p.price)
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    }
  }, [collectiveProducts])

  const handleSelectSize = (productId: string, size: string) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }))
  }

  const handleQuickAdd = (p: Product) => {
    const size = selectedSizes[p.id] || (p.sizes && p.sizes.length > 0 ? p.sizes[0] : undefined)
    addToCart(p, 1, size)
    showToast(
      "Added to Bag",
      `${p.name} (${size || "Standard"}) added at Rs ${p.price}.`,
      "success"
    )
  }

  return (
    <div className="space-y-12 animate-fade-in">
      {/* ===================== HERO ARCHIVAL BANNER ===================== */}
      <section className="relative overflow-hidden bg-[#111827] text-[#f5f2ec] border border-[#374151] p-6 sm:p-10 lg:p-12">
        {/* Subtle background ambient pattern */}
        <div
          className="absolute inset-0 opacity-10 bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage: `url('${racingJacketsCollection.heroImage}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/90 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-4xl">
          {/* Top navigation & metadata */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            {onBackToShop && (
              <button
                onClick={onBackToShop}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#86a84e] hover:text-white transition-colors cursor-pointer"
              >
                <span>←</span> Back to All Products
              </button>
            )}
            <div className="inline-flex items-center gap-2 bg-[#1f2937] border border-[#374151] px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[#86a84e]">
              <span className="w-2 h-2 rounded-full bg-[#86a84e] animate-pulse" />
              <span>ZIMTHREADS ATELIER // CAPSULE 01</span>
            </div>
          </div>

          <p className="text-[11px] font-semibold tracking-[0.35em] uppercase text-[#86a84e] mb-2">
            The Archival Collective
          </p>
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold uppercase leading-[0.95] text-white tracking-wide">
            THE PADDOCK ARCHIVE
          </h1>
          <p className="font-display text-lg sm:text-2xl font-bold uppercase text-[#9ca3af] mt-2 tracking-wider">
            Retro Motorsport & Vintage Racing Jackets
          </p>

          <p className="mt-4 text-xs sm:text-sm text-[#d1d5db] max-w-2xl leading-relaxed">
            A hand-curated archival collective of 14 iconic vintage racing garments. From
            heavyweight top-grain distressed cowhide moto leathers with authentic sponsor heraldry
            to championship Formula 1 paddock bombers, golden-era DTM touring jackets, and NASCAR pit
            classics. Engineered in authentic 90s boxy silhouettes.
          </p>

          {/* Quick stats & features strip */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-6 pt-6 border-t border-[#374151]/80 text-[10px] sm:text-[11px] font-mono uppercase text-[#9ca3af]">
            <span className="bg-[#1f2937] px-3 py-1 border border-[#374151] text-white">
              {collectiveProducts.length} Curated Editions
            </span>
            <span className="bg-[#1f2937] px-3 py-1 border border-[#374151] text-[#86a84e]">
              Rs {priceRange.min} — Rs {priceRange.max}
            </span>
            <span className="bg-[#1f2937] px-3 py-1 border border-[#374151] text-white">
              Sizes S – XXL
            </span>
            <span className="bg-[#1f2937] px-3 py-1 border border-[#374151] text-white">
              Authentic 90s Boxy Fit
            </span>
          </div>
        </div>
      </section>

      {/* ===================== FILTER & SORT BAR ===================== */}
      <section className="bg-white border border-[#e5e1d8] p-4 sm:p-5 shadow-xs space-y-4">
        {/* Team / Make Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#6b7280] block sm:inline mr-3">
              Motorsport Line:
            </span>
            <div className="inline-flex flex-wrap gap-1.5 mt-1 sm:mt-0">
              {[
                { id: "all", label: `All (${collectiveProducts.length})` },
                { id: "ferrari", label: "Ferrari Scuderia (6)" },
                { id: "mercedes", label: "Mercedes-Benz (2)" },
                { id: "bmw", label: "BMW M Power (1)" },
                { id: "redbull", label: "Red Bull Racing (2)" },
                { id: "heritage", label: "NASCAR & Rallye (3)" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTeamFilter(tab.id as TeamFilter)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                    teamFilter === tab.id
                      ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                      : "border-[#e5e1d8] text-[#4b5563] hover:border-[#1a1a1a] hover:text-[#1a1a1a] bg-[#f9fafb]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#6b7280]">
              Sort:
            </span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="border border-[#e5e1d8] bg-white px-2.5 py-1.5 text-xs text-[#1a1a1a] font-medium focus:outline-none focus:border-[#4a5c2d] cursor-pointer"
            >
              <option value="curated">Curated Archive</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Silhouette / Material Secondary Filter */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#f5f2ec] text-[10px]">
          <span className="font-bold tracking-widest uppercase text-[#6b7280]">
            Silhouette / Material:
          </span>
          {[
            { id: "all", label: "All Cuts" },
            { id: "leather", label: "Genuine Leather Moto" },
            { id: "bomber", label: "Satin & Pit Bombers" },
            { id: "windbreaker", label: "Technical Windbreakers" },
          ].map((sil) => (
            <button
              key={sil.id}
              onClick={() => setSilhouetteFilter(sil.id as SilhouetteFilter)}
              className={`px-2.5 py-1 font-semibold uppercase tracking-wider transition-colors cursor-pointer rounded-xs ${
                silhouetteFilter === sil.id
                  ? "bg-[#4a5c2d] text-white"
                  : "bg-[#f5f2ec] text-[#4b5563] hover:text-[#1a1a1a]"
              }`}
            >
              {sil.label}
            </button>
          ))}
        </div>
      </section>

      {/* ===================== COLLECTIVE PRODUCTS GRID ===================== */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#e5e1d8]">
          <p className="font-display text-lg font-bold uppercase text-[#1a1a1a] mb-1">
            No Jackets Match Filter
          </p>
          <p className="text-xs text-[#6b7280]">
            Try switching to &quot;All Editions&quot; to view the complete collective.
          </p>
          <button
            onClick={() => {
              setTeamFilter("all")
              setSilhouetteFilter("all")
            }}
            className="mt-4 px-4 py-2 bg-[#1a1a1a] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((p) => {
            const activeSize =
              selectedSizes[p.id] || (p.sizes && p.sizes.length > 0 ? p.sizes[0] : "L")

            return (
              <div
                key={p.id}
                className="group border border-[#e5e1d8] bg-white overflow-hidden hover:border-[#1a1a1a] transition-all flex flex-col justify-between shadow-xs hover:shadow-md"
              >
                <div>
                  {/* Photo Container */}
                  <div
                    onClick={() => setSelectedProduct(p)}
                    className="aspect-square overflow-hidden bg-[#f5f2ec] relative cursor-pointer"
                  >
                    <img
                      src={p.img}
                      alt={p.alt || p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badge */}
                    {p.badge && (
                      <span className="absolute top-2.5 left-2.5 bg-[#1a1a1a] text-white text-[9px] font-extrabold uppercase px-2.5 py-1 tracking-wider shadow-sm z-10">
                        {p.badge}
                      </span>
                    )}

                    {/* Quick Inspect Hover Overlay Button */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="bg-white/95 backdrop-blur-xs text-[#1a1a1a] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 shadow-md">
                        Inspect Piece ↗
                      </span>
                    </div>

                    {/* Stock Alert */}
                    {p.stock <= 8 && p.stock > 0 && (
                      <span className="absolute bottom-2.5 right-2.5 bg-amber-600 text-white text-[8px] font-bold uppercase px-2 py-0.5">
                        Only {p.stock} Available
                      </span>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-[#4a5c2d]">
                        {p.tag || "Archive Edition"}
                      </span>
                      <span className="text-[9px] font-mono text-[#9ca3af]">
                        {p.stock > 0 ? "In Stock" : "Sold Out"}
                      </span>
                    </div>

                    <h3
                      onClick={() => setSelectedProduct(p)}
                      className="font-semibold text-sm text-[#1a1a1a] mb-2 leading-snug group-hover:text-[#4a5c2d] transition-colors cursor-pointer line-clamp-2"
                      title={p.name}
                    >
                      {p.name}
                    </h3>

                    <p className="text-xs text-[#6b7280] line-clamp-2 leading-relaxed mb-3">
                      {p.description}
                    </p>

                    {/* Interactive Size Selector */}
                    {p.sizes && p.sizes.length > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-[10px] text-[#6b7280] mb-1">
                          <span className="font-semibold uppercase tracking-wider">Size:</span>
                          <span className="font-bold text-[#1a1a1a]">{activeSize}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {p.sizes.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectSize(p.id, s)
                              }}
                              className={`w-7 h-7 text-[10px] font-bold border transition-colors cursor-pointer flex items-center justify-center ${
                                activeSize === s
                                  ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                                  : "border-[#e5e1d8] text-[#4b5563] hover:border-[#1a1a1a] bg-white"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price & Action Footer */}
                <div className="p-4 pt-0">
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#f5f2ec]">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#9ca3af] block">
                        Price
                      </span>
                      <span className="font-display text-lg font-bold text-[#1a1a1a]">
                        Rs {p.price}
                      </span>
                    </div>

                    <button
                      onClick={() => handleQuickAdd(p)}
                      disabled={p.stock <= 0}
                      className="px-3.5 py-2 bg-[#4a5c2d] hover:bg-[#5a7038] text-white text-[10px] font-bold tracking-widest uppercase disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-center cursor-pointer flex items-center gap-1.5"
                    >
                      <BagIcon className="w-3.5 h-3.5" />
                      <span>+ ADD TO BAG</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ===================== SIZING & ATELIER CARE NOTES ===================== */}
      <section className="bg-white border border-[#e5e1d8] p-6 sm:p-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-l-2 border-[#4a5c2d] pl-4">
            <h4 className="font-display text-sm font-bold uppercase text-[#1a1a1a] mb-1">
              Archival Boxy Fit
            </h4>
            <p className="text-xs text-[#6b7280] leading-relaxed">
              Cut in genuine 90s motorsport proportions with drop shoulders and structured chest width.
              Take your standard size for a classic cut, or size up for an oversized streetwear drape.
            </p>
          </div>

          <div className="border-l-2 border-[#4a5c2d] pl-4">
            <h4 className="font-display text-sm font-bold uppercase text-[#1a1a1a] mb-1">
              Material Authenticity
            </h4>
            <p className="text-xs text-[#6b7280] leading-relaxed">
              Featuring heavy top-grain leather, high-stitch-count embroidery, and durable satin twills.
              Finished with heavy brass or chrome YKK hardware and diamond quilted interior lining.
            </p>
          </div>

          <div className="border-l-2 border-[#4a5c2d] pl-4">
            <h4 className="font-display text-sm font-bold uppercase text-[#1a1a1a] mb-1">
              Atelier Care & Cleaning
            </h4>
            <p className="text-xs text-[#6b7280] leading-relaxed">
              Specialist dry clean or leather conditioning only. Zimthreads Collective atelier provides
              full complimentary care advice and professional leather restoration in Mauritius.
            </p>
          </div>
        </div>
      </section>

      {/* Modal for detailed inspection */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  )
}
