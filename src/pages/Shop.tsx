import { useState } from "react"
import { useStore } from "@/store/StoreContext"
import { Product } from "@/store/seedData"
import ProductModal from "@/components/ProductModal"

const categories = ["All", "Cleaning", "Apparel", "Accessories"]

export default function Shop() {
  const { products, addToCart } = useStore()
  const [activeCategory, setActiveCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const filtered = products.filter((p) => {
    const matchesCategory =
      activeCategory === "All" || p.category === activeCategory
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleQuickAdd = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation()
    if (p.sizes && p.sizes.length > 1) {
      setSelectedProduct(p)
    } else {
      addToCart(p, 1, p.sizes ? p.sizes[0] : undefined)
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-10 text-center">
        <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[#4a5c2d] mb-3">
          Products & Gear
        </p>
        <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-extrabold uppercase text-[#1a1a1a]">
          ZIMTHREAD SHOP
        </h1>
        <p className="text-[#6b7280] text-sm max-w-lg mx-auto mt-2">
          Professional grade sneaker cleaning formulations, tools, and bespoke
          streetwear essentials.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-5 py-2 text-[11px] font-bold tracking-widest uppercase border transition-colors ${
                activeCategory === c
                  ? "bg-[#1a1a1a] text-[#f5f2ec] border-[#1a1a1a]"
                  : "border-[#e5e1d8] text-[#6b7280] hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full border border-[#e5e1d8] bg-white px-4 py-2 text-xs text-[#1a1a1a] focus:outline-none focus:border-[#4a5c2d]"
          />
        </div>
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#e5e1d8]">
          <p className="font-display text-lg font-bold uppercase text-[#1a1a1a] mb-1">
            No Products Found
          </p>
          <p className="text-xs text-[#6b7280]">
            Try adjusting your search criteria or category filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              className="group border border-[#e5e1d8] bg-white overflow-hidden hover:border-[#4a5c2d] transition-colors cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="aspect-square overflow-hidden bg-[#f5f2ec] relative">
                  <img
                    src={p.img}
                    alt={p.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {p.stock <= 5 && p.stock > 0 && (
                    <span className="absolute top-2 left-2 bg-amber-600 text-white text-[9px] font-bold uppercase px-2 py-0.5">
                      Low Stock
                    </span>
                  )}
                  {p.stock === 0 && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold uppercase px-2 py-0.5">
                      Sold Out
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-[#4a5c2d]">
                      {p.category}
                    </p>
                    {p.sizes && (
                      <span className="text-[9px] text-[#9ca3af]">
                        {p.sizes.length}{" "}
                        {p.sizes.length === 1 ? "Option" : "Sizes"}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm text-[#1a1a1a] mb-2 leading-tight group-hover:text-[#4a5c2d] transition-colors">
                    {p.name}
                  </h3>
                </div>
              </div>

              <div className="p-4 pt-0">
                <div className="flex items-center justify-between pt-2 border-t border-[#f5f2ec]">
                  <span className="font-display text-lg font-bold text-[#1a1a1a]">
                    Rs {p.price}
                  </span>
                  <button
                    onClick={(e) => handleQuickAdd(e, p)}
                    disabled={p.stock <= 0}
                    className="px-3 py-1 bg-[#4a5c2d] text-[#f5f2ec] text-[10px] font-bold tracking-widest uppercase hover:bg-[#5a7038] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    + ADD
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick View Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </main>
  )
}
