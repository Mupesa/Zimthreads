import { useState, useEffect } from "react"
import { useStore } from "@/store/StoreContext"
import { Product, racingJacketsCollection } from "@/store/seedData"
import ProductModal from "@/components/ProductModal"
import FeaturedDropHero from "@/components/FeaturedDropHero"
import MotorsportCollectiveShowcase from "@/components/MotorsportCollectiveShowcase"

const categories = [
  { id: "all", label: "All Products" },
  {
    id: "racing-jackets",
    label: "Retro Motorsport Collection",
    badge: "14 Pieces",
    isCollection: true,
  },
  { id: "Apparel", label: "Apparel" },
  { id: "Cleaning", label: "Cleaning" },
  { id: "Accessories", label: "Accessories" },
]

export default function Shop() {
  const { products, addToCart, settings } = useStore()

  // Support URL query param e.g. /shop?collection=racing-jackets
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search
      if (
        search.includes("collection=racing-jackets") ||
        search.includes("collection") ||
        search.includes("jackets")
      ) {
        return "racing-jackets"
      }
    }
    return "all"
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Listen to popstate / url changes
  useEffect(() => {
    const handleUrlCheck = () => {
      const search = window.location.search
      if (
        search.includes("collection=racing-jackets") ||
        search.includes("collection") ||
        search.includes("jackets")
      ) {
        setActiveCategory("racing-jackets")
      }
    }
    window.addEventListener("popstate", handleUrlCheck)
    return () => window.removeEventListener("popstate", handleUrlCheck)
  }, [])

  // Sync category changes with URL query string
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      if (activeCategory === "racing-jackets") {
        url.searchParams.set("collection", "racing-jackets")
      } else {
        url.searchParams.delete("collection")
      }
      window.history.replaceState(null, "", url.toString())
    }
  }, [activeCategory])

  // Filter products for standard catalog view (excluding collection jackets from general views)
  const filtered = products.filter((p) => {
    const isCollectiveProduct =
      p.collectionId === "racing-jackets" ||
      racingJacketsCollection.productIds.includes(p.id) ||
      p.id.startsWith("prod-jacket-")

    // Jackets only appear if explicitly in collection mode or searched
    if (activeCategory === "racing-jackets") {
      return isCollectiveProduct
    }

    // In all regular catalog views (All, Apparel, Cleaning, Accessories), exclude the collection jackets
    if (!searchQuery.trim() && isCollectiveProduct) {
      return false
    }

    const matchesCategory =
      activeCategory === "all" || p.category === activeCategory

    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch
  })

  const handleQuickAdd = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation()
    if ((p.sizes && p.sizes.length > 1) || (p.views && p.views.length > 1)) {
      setSelectedProduct(p)
    } else {
      addToCart(p, 1, p.sizes ? p.sizes[0] : undefined)
    }
  }

  const handleSelectFeaturedProduct = (productId: string) => {
    if (productId === "racing-jackets") {
      setActiveCategory("racing-jackets")
      return
    }
    const prod = products.find((p) => p.id === productId)
    if (prod) {
      setSelectedProduct(prod)
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-8 text-center">
        <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[#4a5c2d] mb-2">
          Products & Gear
        </p>
        <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-extrabold uppercase text-[#1a1a1a]">
          ZIMTHREAD SHOP
        </h1>
      </div>

      {/* Featured Drop Hero Image */}
      <FeaturedDropHero
        banner={settings.featuredDrop}
        onSelectProduct={handleSelectFeaturedProduct}
      />

      {/* Category Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((c) => {
            const isSelected = activeCategory === c.id
            return (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCategory(c.id)
                  if (c.id === "racing-jackets") {
                    window.scrollTo({ top: 120, behavior: "smooth" })
                  }
                }}
                className={`px-4 py-2 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase border whitespace-nowrap transition-colors shrink-0 cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? "bg-[#1a1a1a] text-[#f5f2ec] border-[#1a1a1a]"
                    : "border-[#e5e1d8] text-[#6b7280] hover:border-[#1a1a1a] hover:text-[#1a1a1a] bg-white"
                }`}
              >
                <span>{c.label}</span>
                {c.badge && (
                  <span
                    className={`text-[8px] font-mono px-1.5 py-0.2 rounded-xs uppercase tracking-normal ${
                      isSelected
                        ? "bg-[#86a84e] text-black font-extrabold"
                        : "bg-[#4a5c2d] text-white"
                    }`}
                  >
                    {c.badge}
                  </span>
                )}
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

      {/* ===================== VIEW 1: COLLECTION SHOWCASE ===================== */}
      {activeCategory === "racing-jackets" && !searchQuery.trim() ? (
        <MotorsportCollectiveShowcase
          products={products}
          onBackToShop={() => setActiveCategory("all")}
        />
      ) : (
        /* ===================== VIEW 2: REGULAR CATALOG GRID ===================== */
        <>
          {filtered.length === 0 ? (
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
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 pt-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-2 border-t border-[#f5f2ec]">
                      <span className="font-display text-base sm:text-lg font-bold text-[#1a1a1a]">
                        Rs {p.price}
                      </span>
                      <button
                        onClick={(e) => handleQuickAdd(e, p)}
                        disabled={p.stock <= 0}
                        className="w-full sm:w-auto px-2.5 py-1.5 sm:py-1 bg-[#4a5c2d] text-[#f5f2ec] text-[9px] sm:text-[10px] font-bold tracking-widest uppercase hover:bg-[#5a7038] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-center cursor-pointer"
                      >
                        {p.isPresale
                          ? "PRESALE"
                          : p.isPreorder
                            ? "PRE-ORDER"
                            : "+ ADD"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Quick View Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </main>
  )
}
