import React, { useState, useEffect, useMemo } from "react"
import { Link, useRouter } from "@/router"
import { useStore } from "@/store/StoreContext"
import { Product, racingJacketsCollection } from "@/store/seedData"
import ProductModal from "@/components/ProductModal"
import ShopHero from "@/components/ShopHero"
import FeaturedProductSpotlight from "@/components/FeaturedProductSpotlight"

const categories = [
  { id: "all", label: "All Products" },
  { id: "Apparel", label: "Apparel" },
  { id: "Cleaning", label: "Cleaning" },
  { id: "Accessories", label: "Accessories" },
]

export default function Shop() {
  const { products, addToCart, settings } = useStore()
  const { navigate } = useRouter()

  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const liveSelectedProduct = useMemo(() => {
    if (!selectedProduct) return null
    return products.find((p) => p.id === selectedProduct.id) || selectedProduct
  }, [products, selectedProduct])

  // Redirect legacy ?collection=racing-jackets queries to /collection/racing-jackets
  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search
      if (
        search.includes("collection=racing-jackets") ||
        search.includes("collection") ||
        search.includes("jackets")
      ) {
        navigate("/collection/racing-jackets")
      }
    }
  }, [navigate])

  // Compute minimum jacket price dynamically from store (excluding hidden jackets)
  const activeJacketProds = useMemo(() => {
    return products.filter(
      (p) =>
        !p.hidden &&
        (p.collectionId === "racing-jackets" ||
          racingJacketsCollection.productIds.includes(p.id) ||
          p.id.startsWith("prod-jacket-")),
    )
  }, [products])

  const minJacketPrice = useMemo(() => {
    if (activeJacketProds.length === 0) return 1750
    return Math.min(...activeJacketProds.map((p) => p.price))
  }, [activeJacketProds])

  // Filter products for standard catalog view (excluding hidden products and collection jackets)
  const filtered = useMemo(() => {
    return products.filter((p) => {
      // Exclude hidden products from shop catalog
      if (p.hidden) {
        return false
      }

      const isCollectiveProduct =
        p.collectionId === "racing-jackets" ||
        racingJacketsCollection.productIds.includes(p.id) ||
        p.id.startsWith("prod-jacket-")

      // Exclude all individual collective jackets from standard shop catalog
      if (isCollectiveProduct) {
        return false
      }

      const matchesCategory =
        activeCategory === "all" || p.category === activeCategory

      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesCategory && matchesSearch
    })
  }, [products, activeCategory, searchQuery])

  // Whether to render the Collection Card in the grid
  const showCollectionCard =
    activeJacketProds.length > 0 &&
    (activeCategory === "all" || activeCategory === "Apparel") &&
    (!searchQuery.trim() ||
      "the paddock archive racing jackets retro vintage motorsport jacket"
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim()) ||
      activeJacketProds.some(
        (j) =>
          j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          j.description.toLowerCase().includes(searchQuery.toLowerCase()),
      ))

  const handleQuickAdd = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation()
    const hasMultipleSizes = Boolean(p.sizes && p.sizes.length > 1)
    const hasMultipleViews = Boolean(p.views && p.views.length > 1)
    const hasPriceOptions = Boolean(p.priceOptions && p.priceOptions.length > 0)
    if (hasMultipleSizes || hasMultipleViews || hasPriceOptions) {
      setSelectedProduct(p)
    } else {
      addToCart(p, 1, p.sizes ? p.sizes[0] : undefined)
    }
  }

  const handleSelectFeaturedProduct = (productId: string) => {
    if (productId === "racing-jackets") {
      navigate("/collection/racing-jackets")
      return
    }
    const prod = products.find((p) => p.id === productId)
    if (prod) {
      setSelectedProduct(prod)
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f2ec] text-[#1a1a1a]">
      {/* 1. Full-Bleed Editorial Shop Hero */}
      <ShopHero
        banner={settings.featuredDrop}
        onScrollToSpotlight={() => {
          document
            .getElementById("featured-product-spotlight")
            ?.scrollIntoView({ behavior: "smooth" })
        }}
        onScrollToCatalog={() => {
          document
            .getElementById("shop-catalog-section")
            ?.scrollIntoView({ behavior: "smooth" })
        }}
      />

      {/* 2. In-Page Featured Product Spotlight ("The Card Below That") */}
      <FeaturedProductSpotlight banner={settings.featuredDrop} />

      {/* 4. Complete Catalog Section */}
      <div
        id="shop-catalog-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16"
      >
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 text-[10px] font-mono tracking-[0.3em] uppercase text-[#4a5c2d] mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4a5c2d]" />
            <span>FULL CATALOG DIRECTORY</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold uppercase text-[#1a1a1a]">
            ALL PRODUCTS & GEAR
          </h2>
        </div>

        {/* Category Tabs and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map((c) => {
              const isSelected = activeCategory === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-4 py-2 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase border whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-[#1a1a1a] text-[#f5f2ec] border-[#1a1a1a]"
                      : "border-[#e5e1d8] text-[#6b7280] hover:border-[#1a1a1a] hover:text-[#1a1a1a] bg-white"
                  }`}
                >
                  {c.label}
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full border border-[#e5e1d8] bg-white px-4 py-2.5 sm:py-2 text-xs text-[#1a1a1a] focus:outline-none focus:border-[#4a5c2d]"
            />
          </div>
        </div>

        {/* Product Grid */}
        {filtered.length === 0 && !showCollectionCard ? (
          <div className="text-center py-16 sm:py-20 bg-white border border-[#e5e1d8]">
            <p className="font-display text-lg font-bold uppercase text-[#1a1a1a] mb-1">
              No Products Found
            </p>
            <p className="text-xs text-[#6b7280]">
              Try adjusting your search criteria or category filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {/* ===================== THE PADDOCK ARCHIVE COLLECTION CARD ===================== */}
            {showCollectionCard && (
              <div
                onClick={() => navigate("/collection/racing-jackets")}
                className="group border border-[#1a1a1a] bg-[#111827] text-white overflow-hidden hover:border-[#86a84e] transition-all cursor-pointer flex flex-col justify-between shadow-sm relative"
              >
                <div>
                  <div className="aspect-square overflow-hidden bg-black relative">
                    <img
                      src={racingJacketsCollection.heroImage}
                      alt={racingJacketsCollection.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                    />
                    {/* Badge */}
                    <span className="absolute top-2 left-2 bg-[#86a84e] text-black text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 tracking-wider shadow-sm flex items-center gap-1.5 z-10">
                      <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                      <span>
                        COLLECTION · {activeJacketProds.length} PIECES
                      </span>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent opacity-80" />
                  </div>

                  <div className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[9px] sm:text-[10px] font-bold tracking-[0.25em] uppercase text-[#86a84e]">
                        Curated Capsule
                      </p>
                      <span className="text-[8px] sm:text-[9px] font-mono text-[#9ca3af] uppercase">
                        Limited Drop
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-xs sm:text-sm text-white mb-1 leading-snug group-hover:text-[#86a84e] transition-colors line-clamp-2">
                      {racingJacketsCollection.name}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-[#9ca3af] line-clamp-2 leading-relaxed">
                      {racingJacketsCollection.tagline}
                    </p>
                  </div>
                </div>

                <div className="p-3 sm:p-4 pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-2 border-t border-[#374151]">
                    <div>
                      <span className="block text-[8px] font-mono uppercase text-[#9ca3af] tracking-wider">
                        Starting At
                      </span>
                      <span className="font-display text-base sm:text-lg font-bold text-white">
                        From Rs {minJacketPrice}
                      </span>
                    </div>
                    <span onClick={(e) => e.stopPropagation()}>
                      <Link
                        to="/collection/racing-jackets"
                        className="w-full sm:w-auto px-2.5 py-1.5 sm:py-1 bg-[#86a84e] text-black text-[9px] sm:text-[10px] font-black tracking-widest uppercase hover:bg-[#9cc45e] transition-colors text-center inline-flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>VIEW COLLECTION</span>
                        <span>→</span>
                      </Link>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Standard Catalog Products */}
            {filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProduct(p)}
                className="group border border-[#e5e1d8] bg-white overflow-hidden hover:border-[#4a5c2d] transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-square overflow-hidden bg-[#f5f2ec] relative">
                    {p.images && p.images.length > 1 ? (
                      <>
                        <img
                          src={p.images[0]}
                          alt={p.alt}
                          className={`w-full h-full ${
                            p.category === "Accessories"
                              ? "object-contain p-3.5"
                              : "object-cover"
                          } transition-opacity duration-500 group-hover:opacity-0`}
                        />
                        <img
                          src={p.images[1]}
                          alt={`${p.name} Alternate View`}
                          className={`w-full h-full ${
                            p.category === "Accessories"
                              ? "object-contain p-3.5"
                              : "object-cover"
                          } absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                        />
                        <span className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-xs text-white text-[8px] font-bold uppercase px-2 py-0.5 tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                          {p.views && p.views.length > 2
                            ? `${p.views.length} Styles · Slide`
                            : "Back View"}
                        </span>
                      </>
                    ) : (
                      <img
                        src={p.img}
                        alt={p.alt}
                        className={`w-full h-full ${
                          p.category === "Accessories"
                            ? "object-contain p-3.5"
                            : "object-cover"
                        } group-hover:scale-105 transition-transform duration-500`}
                      />
                    )}

                    {(p.isPresale || p.isPreorder) && (
                      <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-[#4a5c2d] text-white text-[8px] sm:text-[9px] font-extrabold uppercase px-2 py-0.5 shadow-sm flex items-center gap-1 z-10">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
                        <span>{p.isPresale ? "PRESALE" : "PRE-ORDER"}</span>
                      </span>
                    )}

                    {p.badge && !p.isPresale && !p.isPreorder && (
                      <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-[#1a1a1a] text-white text-[8px] sm:text-[9px] font-extrabold uppercase px-2 py-0.5 shadow-sm z-10">
                        {p.badge}
                      </span>
                    )}

                    {!p.isPresale &&
                      !p.isPreorder &&
                      p.stock <= 5 &&
                      p.stock > 0 && (
                        <span className="absolute bottom-2 left-2 bg-amber-600 text-white text-[8px] sm:text-[9px] font-bold uppercase px-1.5 sm:px-2 py-0.5 z-10">
                          Low Stock
                        </span>
                      )}
                    {!p.isPresale && !p.isPreorder && p.stock === 0 && (
                      <span className="absolute bottom-2 left-2 bg-red-600 text-white text-[8px] sm:text-[9px] font-bold uppercase px-1.5 sm:px-2 py-0.5 z-10">
                        Sold Out
                      </span>
                    )}
                  </div>
                  <div className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[9px] sm:text-[10px] font-semibold tracking-widest uppercase text-[#4a5c2d]">
                        {p.category}
                      </p>
                      {p.views && p.views.length > 2 ? (
                        <span className="text-[8px] sm:text-[9px] text-[#4a5c2d] font-bold">
                          {p.views.length} Styles
                        </span>
                      ) : p.sizes ? (
                        <span className="text-[8px] sm:text-[9px] text-[#9ca3af]">
                          {p.sizes.length}{" "}
                          {p.sizes.length === 1 ? "Option" : "Sizes"}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="font-semibold text-xs sm:text-sm text-[#1a1a1a] mb-1.5 leading-snug group-hover:text-[#4a5c2d] transition-colors line-clamp-2">
                      {p.name}
                    </h3>
                    {p.sizes && p.sizes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {p.sizes.map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold border border-[#e5e1d8] bg-[#fbf9f6] text-[#6b7280]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 sm:p-4 pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-2 border-t border-[#f5f2ec]">
                    <div>
                      {p.priceOptions && p.priceOptions.length > 0 ? (
                        <div>
                          {p.priceOptions.some((opt) => opt.active) ? (
                            <span className="font-display text-base sm:text-lg font-bold text-[#1a1a1a]">
                              Rs{" "}
                              {Math.min(
                                ...p.priceOptions
                                  .filter((opt) => opt.active)
                                  .map((opt) => opt.price),
                              )}
                              {p.priceOptions.filter((opt) => opt.active)
                                .length > 1
                                ? "+"
                                : ""}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-[#9ca3af] line-through">
                              UNAVAILABLE
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="font-display text-base sm:text-lg font-bold text-[#1a1a1a]">
                          Rs {p.price}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleQuickAdd(e, p)}
                      disabled={
                        p.stock <= 0 ||
                        (p.priceOptions &&
                          p.priceOptions.length > 0 &&
                          !p.priceOptions.some((opt) => opt.active))
                      }
                      className="w-full sm:w-auto px-2.5 py-1.5 sm:py-1 bg-[#4a5c2d] text-[#f5f2ec] text-[9px] sm:text-[10px] font-bold tracking-widest uppercase hover:bg-[#5a7038] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-center cursor-pointer"
                    >
                      {p.isPresale
                        ? "PRESALE"
                        : p.isPreorder
                          ? "PRE-ORDER"
                          : p.priceOptions &&
                              p.priceOptions.length > 0 &&
                              !p.priceOptions.some((opt) => opt.active)
                            ? "SOLD OUT"
                            : "+ ADD"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick View Modal */}
        <ProductModal
          product={liveSelectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      </div>
    </main>
  )
}
