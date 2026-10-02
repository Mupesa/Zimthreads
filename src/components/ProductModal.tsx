import { useState, useMemo, useEffect } from "react"
import { Product } from "@/store/seedData"
import { useStore } from "@/store/StoreContext"
import { CloseIcon } from "@/components/Icons"

interface ProductModalProps {
  product: Product | null
  onClose: () => void
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const { addToCart } = useStore()
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [quantity, setQuantity] = useState<number>(1)
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  // Reset active image index and size when product changes
  useEffect(() => {
    setActiveImageIdx(0)
    setSelectedSize("")
    setQuantity(1)
  }, [product?.id])

  // Derive gallery views
  const gallery = useMemo(() => {
    if (!product) return []
    if (product.views && product.views.length > 0) {
      return product.views
    }
    if (product.images && product.images.length > 0) {
      return product.images.map((url, i) => ({
        label: i === 0 ? "Front View" : i === 1 ? "Back View" : `View ${i + 1}`,
        url,
      }))
    }
    return [{ label: "Front View", url: product.img }]
  }, [product])

  if (!product) return null

  const currentSize =
    selectedSize || (product.sizes ? product.sizes[0] : undefined)

  const handleAdd = () => {
    const isMultiStyle =
      gallery.length > 1 &&
      activeImage.label &&
      !activeImage.label.toLowerCase().includes("view")

    const itemToAdd: Product = {
      ...product,
      name: isMultiStyle
        ? `${product.name} - ${activeImage.label}`
        : product.name,
      img: activeImage.url,
    }
    addToCart(itemToAdd, quantity, currentSize)
    onClose()
  }

  const handlePrevImage = () => {
    setActiveImageIdx((prev) => (prev === 0 ? gallery.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setActiveImageIdx((prev) => (prev === gallery.length - 1 ? 0 : prev + 1))
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNextImage()
      } else {
        handlePrevImage()
      }
    }
    setTouchStart(null)
  }

  const activeImage = gallery[activeImageIdx] || gallery[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative bg-white border border-[#e5e1d8] w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl z-10 grid grid-cols-1 md:grid-cols-12 animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-white/95 border border-[#e5e1d8] flex items-center justify-center text-[#1a1a1a] hover:bg-black hover:text-white transition-colors shadow-md cursor-pointer"
          aria-label="Close modal"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </button>

        {/* ================= Left Column: Interactive Slide Panel ================= */}
        <div className="md:col-span-6 bg-[#f5f2ec] flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-[#e5e1d8] select-none">
          {/* Top Bar: View Switcher Tabs & Pre-order Badge */}
          <div className="p-3 sm:p-4 flex items-center justify-between gap-2 z-20">
            {gallery.length > 1 && gallery.length <= 3 ? (
              <div className="inline-flex bg-white/90 backdrop-blur-xs border border-[#e5e1d8] p-0.5 shadow-xs">
                {gallery.map((view, idx) => (
                  <button
                    key={view.label}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`px-2.5 py-1 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
                      activeImageIdx === idx
                        ? "bg-[#1a1a1a] text-white"
                        : "text-[#6b7280] hover:text-[#1a1a1a]"
                    }`}
                  >
                    {view.label}
                  </button>
                ))}
              </div>
            ) : gallery.length > 3 ? (
              <div className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-xs border border-[#e5e1d8] px-2.5 py-1 shadow-xs">
                <span className="text-[9px] font-extrabold text-[#4a5c2d] uppercase tracking-wider">
                  Option {activeImageIdx + 1}/{gallery.length}
                </span>
                <span className="text-[#d1d5db]">|</span>
                <span className="text-[9px] font-bold text-[#1a1a1a] uppercase truncate max-w-[130px] sm:max-w-[180px]">
                  {gallery[activeImageIdx]?.label}
                </span>
              </div>
            ) : (
              <div />
            )}

            {(product.isPresale || product.isPreorder) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#4a5c2d] text-white text-[9px] font-extrabold uppercase tracking-wider shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
                <span>{product.isPresale ? "PRESALE" : "PRE-ORDER"}</span>
              </span>
            )}
          </div>

          {/* Main Slide Image Container with Touch Support */}
          <div
            className="relative flex-1 min-h-[300px] sm:min-h-[360px] flex items-center justify-center overflow-hidden px-4"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Main Image with Smooth Fade/Scale */}
            <img
              key={activeImage.url}
              src={activeImage.url}
              alt={`${product.name} - ${activeImage.label}`}
              className="max-h-[340px] sm:max-h-[400px] w-auto max-w-full object-contain drop-shadow-md transition-all duration-300"
            />

            {/* Left Chevron Button */}
            {gallery.length > 1 && (
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-[#e5e1d8] flex items-center justify-center text-[#1a1a1a] hover:bg-black hover:text-white transition-colors shadow-md cursor-pointer z-10"
                aria-label="Previous view"
              >
                ‹
              </button>
            )}

            {/* Right Chevron Button */}
            {gallery.length > 1 && (
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-[#e5e1d8] flex items-center justify-center text-[#1a1a1a] hover:bg-black hover:text-white transition-colors shadow-md cursor-pointer z-10"
                aria-label="Next view"
              >
                ›
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip */}
          {gallery.length > 1 && (
            <div className="p-2 sm:p-2.5 bg-white/80 border-t border-[#e5e1d8] flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {gallery.map((view, idx) => (
                <button
                  key={view.label + idx}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`flex items-center gap-1.5 px-2 py-1 border transition-all cursor-pointer bg-white shrink-0 ${
                    activeImageIdx === idx
                      ? "border-[#1a1a1a] ring-2 ring-[#1a1a1a]/20 shadow-xs"
                      : "border-[#e5e1d8] opacity-65 hover:opacity-100"
                  }`}
                >
                  <img
                    src={view.url}
                    alt={view.label}
                    className="w-6 h-6 sm:w-7 sm:h-7 object-contain bg-[#f5f2ec]"
                  />
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-[#1a1a1a] whitespace-nowrap">
                    {view.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ================= Right Column: Product Specs & Actions ================= */}
        <div className="md:col-span-6 p-5 sm:p-7 flex flex-col justify-between">
          <div>
            {/* Category & Availability */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#4a5c2d] bg-[#4a5c2d]/10 px-2 py-0.5">
                {product.category}
              </span>
              <span className="text-xs text-[#6b7280]">
                {product.isPresale
                  ? "Limited Presale Drop"
                  : product.isPreorder
                    ? "Limited Pre-Order"
                    : product.stock > 0
                      ? `${product.stock} in stock`
                      : "Out of Stock"}
              </span>
            </div>

            {/* Product Title */}
            <h3 className="font-display text-xl sm:text-2xl font-extrabold uppercase text-[#1a1a1a] leading-tight mb-2">
              {product.name}
            </h3>

            {/* Active Style Indicator if multi-option */}
            {gallery.length > 1 && (
              <div className="mb-3 px-3 py-2 bg-[#fbf9f6] border border-[#e5e1d8] flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
                  Option Selected:
                </span>
                <span className="text-xs font-extrabold uppercase text-[#1a1a1a] tracking-wide">
                  {activeImage.label}
                </span>
              </div>
            )}

            {/* Price */}
            <p className="font-display text-2xl font-bold text-[#4a5c2d] mb-4">
              Rs {product.price}
            </p>

            {/* Pre-order / Presale Alert Box */}
            {(product.isPresale || product.isPreorder) && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-900 rounded-none">
                <div className="flex items-center gap-1.5 font-bold text-[10px] sm:text-[11px] uppercase tracking-wider text-amber-800 mb-1">
                  <span>
                    ⏳{" "}
                    {product.isPresale
                      ? "EXCLUSIVE PRESALE OPEN"
                      : "PRE-ORDER WINDOW OPEN"}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  {product.isPresale ? (
                    <>
                      Special Presale pricing at{" "}
                      <strong>Rs {product.price}</strong>. Reserve your
                      handcrafted artisan piece now during the presale window.
                      Dispatches commence once production batch completes.
                    </>
                  ) : (
                    <>
                      Orders strictly close{" "}
                      <strong>
                        {product.preorderDeadline || "Sunday evening"}
                      </strong>
                      . Secure yours now. Dispatches begin once the batch window
                      closes.
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Description */}
            <p className="text-xs text-[#6b7280] leading-relaxed mb-5 whitespace-pre-line">
              {product.description}
            </p>

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-[#6b7280] block mb-2">
                  Select Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer ${
                        currentSize === s
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
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-[#e5e1d8]">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#6b7280]">
                Qty
              </span>
              <div className="flex items-center border border-[#e5e1d8] bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center font-bold text-xs hover:bg-[#f5f2ec] cursor-pointer"
                >
                  -
                </button>
                <span className="w-8 text-center text-xs font-bold">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 flex items-center justify-center font-bold text-xs hover:bg-[#f5f2ec] cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={product.stock <= 0}
              className={`w-full py-3.5 text-[#f5f2ec] text-[11px] font-bold tracking-widest uppercase disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-md ${
                product.isPresale || product.isPreorder
                  ? "bg-[#4a5c2d] hover:bg-[#5a7038]"
                  : "bg-[#1a1a1a] hover:bg-black"
              }`}
            >
              {product.isPresale
                ? `SECURE PRESALE (Rs ${(product.price * quantity).toFixed(0)})`
                : product.isPreorder
                  ? `PRE-ORDER NOW (Rs ${(product.price * quantity).toFixed(0)})`
                  : `ADD TO BAG (Rs ${(product.price * quantity).toFixed(0)})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
