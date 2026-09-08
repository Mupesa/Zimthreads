import { useState } from "react"
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

  if (!product) return null

  const currentSize =
    selectedSize || (product.sizes ? product.sizes[0] : undefined)

  const handleAdd = () => {
    addToCart(product, quantity, currentSize)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative bg-white border border-[#e5e1d8] w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl z-10 grid grid-cols-1 sm:grid-cols-2 animate-scale-up">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/90 border border-[#e5e1d8] flex items-center justify-center text-[#1a1a1a] hover:bg-black hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </button>

        <div className="h-64 sm:h-full bg-[#f5f2ec] overflow-hidden">
          <img
            src={product.img}
            alt={product.alt}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-5 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#4a5c2d] bg-[#4a5c2d]/10 px-2 py-0.5">
                {product.category}
              </span>
              <span className="text-xs text-[#6b7280]">
                {product.stock > 0
                  ? `${product.stock} available`
                  : "Out of Stock"}
              </span>
            </div>

            <h3 className="font-display text-xl sm:text-2xl font-extrabold uppercase text-[#1a1a1a] mb-2">
              {product.name}
            </h3>

            <p className="font-display text-2xl font-bold text-[#4a5c2d] mb-3">
              Rs {product.price}
            </p>

            <p className="text-xs text-[#6b7280] leading-relaxed mb-5">
              {product.description}
            </p>

            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-[#6b7280] block mb-2">
                  Select Size / Option
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`px-3 py-1.5 text-xs font-bold border transition-colors ${
                        currentSize === s
                          ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                          : "border-[#e5e1d8] text-[#1a1a1a] hover:border-[#1a1a1a]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#6b7280]">
                Qty
              </span>
              <div className="flex items-center border border-[#e5e1d8]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center font-bold text-xs hover:bg-[#f5f2ec]"
                >
                  -
                </button>
                <span className="w-8 text-center text-xs font-bold">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 flex items-center justify-center font-bold text-xs hover:bg-[#f5f2ec]"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={product.stock <= 0}
              className="w-full py-3.5 bg-[#4a5c2d] text-[#f5f2ec] text-[11px] font-bold tracking-widest uppercase hover:bg-[#5a7038] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ADD TO BAG (Rs {(product.price * quantity).toFixed(0)})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
