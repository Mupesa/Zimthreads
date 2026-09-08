import React, { useState } from "react"
import { useStore } from "@/store/StoreContext"
import { OrderItem } from "@/store/seedData"
import {
  BagIcon,
  CloseIcon,
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "@/components/Icons"

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateCartQuantity,
    cartTotal,
    settings,
    createOrder,
  } = useStore()

  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "Mauritius",
    paymentMethod: "Juice by MCB" as OrderItem["paymentMethod"],
    notes: "",
  })
  const [orderComplete, setOrderComplete] = useState<OrderItem | null>(null)

  if (!isCartOpen) return null

  const isFreeDelivery = cartTotal >= settings.freeDeliveryThreshold
  const deliveryFee = isFreeDelivery ? 0 : settings.deliveryFee
  const grandTotal = cartTotal + deliveryFee
  const progressToFree = Math.min(
    100,
    (cartTotal / settings.freeDeliveryThreshold) * 100,
  )

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.address
    )
      return

    const order = createOrder({
      customer: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      paymentMethod: formData.paymentMethod,
    })

    setOrderComplete(order)
  }

  const handleResetCheckout = () => {
    setOrderComplete(null)
    setCheckoutOpen(false)
    setIsCartOpen(false)
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "Mauritius",
      paymentMethod: "Juice by MCB",
      notes: "",
    })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity backdrop-blur-xs"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-[#f5f2ec] text-[#1a1a1a] h-full shadow-2xl flex flex-col z-10">
        {/* Drawer Header */}
        <div className="px-5 sm:px-6 py-4 bg-white border-b border-[#e5e1d8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BagIcon className="w-5 h-5 text-[#4a5c2d]" />
            <h2 className="font-display text-lg font-bold tracking-wider uppercase text-[#1a1a1a]">
              SHOPPING BAG ({cart.reduce((s, i) => s + i.quantity, 0)})
            </h2>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="w-8 h-8 rounded-full border border-[#e5e1d8] flex items-center justify-center text-[#6b7280] hover:text-[#1a1a1a] hover:border-[#1a1a1a] transition-colors"
            aria-label="Close Shopping Bag"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Free Shipping Progress */}
        <div className="bg-[#4a5c2d]/10 px-5 sm:px-6 py-3 border-b border-[#4a5c2d]/20">
          <div className="flex justify-between text-xs font-semibold uppercase tracking-wider mb-1.5 text-[#4a5c2d]">
            <span>
              {isFreeDelivery
                ? "Eligible for Free Standard Delivery"
                : `Add Rs ${(settings.freeDeliveryThreshold - cartTotal).toFixed(0)} for Free Delivery`}
            </span>
            <span className="font-mono">{Math.round(progressToFree)}%</span>
          </div>
          <div className="w-full bg-[#e5e1d8] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#4a5c2d] h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressToFree}%` }}
            />
          </div>
        </div>

        {/* Cart Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-[#e5e1d8] flex items-center justify-center text-[#9ca3af] mb-4">
                <BagIcon className="w-6 h-6" />
              </div>
              <p className="font-display text-lg font-bold uppercase text-[#1a1a1a] mb-1">
                Your Bag is Empty
              </p>
              <p className="text-xs text-[#6b7280] max-w-xs mb-6">
                Explore our sneaker cleaning formulations, specialty brushes and
                custom apparel.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-6 py-3 bg-[#4a5c2d] text-[#f5f2ec] text-[11px] font-bold tracking-widest uppercase hover:bg-[#5a7038] transition-colors"
              >
                Shop Collection
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.productId}-${item.size || "default"}`}
                className="flex gap-3.5 p-3 bg-white border border-[#e5e1d8] hover:border-[#4a5c2d] transition-colors"
              >
                <div className="w-20 h-20 bg-[#f5f2ec] overflow-hidden flex-shrink-0">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-sm text-[#1a1a1a] truncate pr-2">
                        {item.name}
                      </h4>
                      <button
                        onClick={() =>
                          removeFromCart(item.productId, item.size)
                        }
                        className="text-[#9ca3af] hover:text-red-600 transition-colors p-1"
                        title="Remove item"
                      >
                        <CloseIcon className="w-3 h-3" />
                      </button>
                    </div>
                    {item.size && (
                      <span className="inline-block text-[10px] font-bold tracking-widest uppercase text-[#4a5c2d] bg-[#4a5c2d]/10 px-1.5 py-0.5 mt-1">
                        Size: {item.size}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-[#e5e1d8]">
                      <button
                        onClick={() =>
                          updateCartQuantity(
                            item.productId,
                            item.quantity - 1,
                            item.size,
                          )
                        }
                        className="w-7 h-7 flex items-center justify-center text-xs font-bold text-[#6b7280] hover:bg-[#e5e1d8]"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-[#1a1a1a]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateCartQuantity(
                            item.productId,
                            item.quantity + 1,
                            item.size,
                          )
                        }
                        className="w-7 h-7 flex items-center justify-center text-xs font-bold text-[#6b7280] hover:bg-[#e5e1d8]"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-display font-bold text-sm text-[#1a1a1a]">
                      Rs {(item.price * item.quantity).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-6 bg-white border-t border-[#e5e1d8] space-y-3">
            <div className="space-y-1.5 text-xs text-[#6b7280]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-[#1a1a1a]">
                  Rs {cartTotal.toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Standard Delivery</span>
                <span>
                  {isFreeDelivery ? (
                    <span className="text-[#4a5c2d] font-bold">FREE</span>
                  ) : (
                    `Rs ${deliveryFee.toFixed(0)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#1a1a1a] pt-2 border-t border-[#e5e1d8]">
                <span>Total</span>
                <span className="font-display text-xl text-[#4a5c2d]">
                  Rs {grandTotal.toFixed(0)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setCheckoutOpen(true)}
              className="w-full py-3.5 bg-[#4a5c2d] text-[#f5f2ec] text-[11px] font-bold tracking-widest uppercase hover:bg-[#5a7038] transition-colors flex items-center justify-center gap-2"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Checkout Modal Overlay */}
        {checkoutOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
            <div className="bg-[#f5f2ec] border border-[#e5e1d8] w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-8 text-[#1a1a1a] shadow-2xl relative animate-scale-up">
              {orderComplete ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 rounded-full bg-[#4a5c2d] text-white flex items-center justify-center mx-auto mb-4">
                    <CheckIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-2xl font-extrabold uppercase text-[#1a1a1a] mb-2">
                    ORDER CONFIRMED
                  </h3>
                  <p className="text-sm text-[#6b7280] mb-6">
                    Thank you, <strong>{orderComplete.customer}</strong>. Your
                    order has been recorded.
                  </p>

                  <div className="bg-white border border-[#e5e1d8] p-4 text-left mb-6 space-y-2.5 text-xs">
                    <div className="flex justify-between pb-2 border-b border-[#e5e1d8]">
                      <span className="font-bold text-[#6b7280]">
                        ORDER REFERENCE
                      </span>
                      <span className="font-mono font-bold text-[#4a5c2d]">
                        {orderComplete.id}
                      </span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-[#e5e1d8]">
                      <span className="font-bold text-[#6b7280]">AMOUNT</span>
                      <span className="font-bold text-sm text-[#1a1a1a]">
                        Rs {orderComplete.totalAmount.toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-[#e5e1d8]">
                      <span className="font-bold text-[#6b7280]">
                        PAYMENT METHOD
                      </span>
                      <span className="font-bold text-[#1a1a1a]">
                        {orderComplete.paymentMethod}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-[#6b7280]">
                        DELIVERY ADDRESS
                      </span>
                      <span className="text-right text-[#1a1a1a] max-w-[200px] truncate">
                        {orderComplete.address}, {orderComplete.city}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleResetCheckout}
                    className="w-full py-3.5 bg-[#4a5c2d] text-[#f5f2ec] text-[11px] font-bold tracking-widest uppercase hover:bg-[#5a7038] transition-colors"
                  >
                    RETURN TO STORE
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#e5e1d8]">
                    <div>
                      <h3 className="font-display text-xl font-extrabold uppercase text-[#1a1a1a]">
                        COMPLETE CHECKOUT
                      </h3>
                      <p className="text-xs text-[#6b7280]">
                        Delivery & Collection across Mauritius
                      </p>
                    </div>
                    <button
                      onClick={() => setCheckoutOpen(false)}
                      className="w-8 h-8 rounded-full border border-[#e5e1d8] flex items-center justify-center text-[#6b7280] hover:text-[#1a1a1a]"
                    >
                      <CloseIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold tracking-widest uppercase text-[#6b7280] block mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="e.g. Jean-Luc"
                          className="w-full border border-[#e5e1d8] bg-white px-3.5 py-2.5 text-xs text-[#1a1a1a] focus:outline-none focus:border-[#4a5c2d]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold tracking-widest uppercase text-[#6b7280] block mb-1">
                          Phone / WhatsApp *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="+230 5513 2614"
                          className="w-full border border-[#e5e1d8] bg-white px-3.5 py-2.5 text-xs text-[#1a1a1a] focus:outline-none focus:border-[#4a5c2d]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold tracking-widest uppercase text-[#6b7280] block mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="your.email@example.com"
                        className="w-full border border-[#e5e1d8] bg-white px-3.5 py-2.5 text-xs text-[#1a1a1a] focus:outline-none focus:border-[#4a5c2d]"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold tracking-widest uppercase text-[#6b7280] block mb-1">
                          Street Address / Area *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.address}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              address: e.target.value,
                            })
                          }
                          placeholder="e.g. Royal Road, Ebene / Grand Baie"
                          className="w-full border border-[#e5e1d8] bg-white px-3.5 py-2.5 text-xs text-[#1a1a1a] focus:outline-none focus:border-[#4a5c2d]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold tracking-widest uppercase text-[#6b7280] block mb-1">
                          District / Region
                        </label>
                        <select
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          className="w-full border border-[#e5e1d8] bg-white px-3 py-2.5 text-xs text-[#1a1a1a] focus:outline-none focus:border-[#4a5c2d]"
                        >
                          <option value="Port Louis">Port Louis</option>
                          <option value="Grand Baie">Grand Baie</option>
                          <option value="Ebene / Cybercity">Ebene</option>
                          <option value="Tamarin / Black River">Tamarin</option>
                          <option value="Flic en Flac">Flic en Flac</option>
                          <option value="Curepipe">Curepipe</option>
                          <option value="Rose Hill / Beau Bassin">
                            Rose Hill
                          </option>
                          <option value="Other Area">Other Region</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold tracking-widest uppercase text-[#6b7280] block mb-2">
                        Payment Method
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          "Juice by MCB",
                          "Bank Transfer",
                          "Cash on Drop-off",
                          "Card / Online",
                        ] as OrderItem["paymentMethod"][]).map((method) => (
                          <button
                            type="button"
                            key={method}
                            onClick={() =>
                              setFormData({
                                ...formData,
                                paymentMethod: method,
                              })
                            }
                            className={`p-2.5 border text-left text-xs font-semibold transition-colors flex items-center justify-between ${
                              formData.paymentMethod === method
                                ? "border-[#4a5c2d] bg-[#4a5c2d]/10 text-[#4a5c2d] font-bold"
                                : "border-[#e5e1d8] bg-white text-[#6b7280] hover:border-[#1a1a1a]"
                            }`}
                          >
                            <span>{method}</span>
                            {formData.paymentMethod === method && (
                              <CheckIcon className="w-3 h-3 text-[#4a5c2d]" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-[#e5e1d8] p-3 text-xs space-y-1 mt-4">
                      <div className="flex justify-between font-semibold">
                        <span>Items Total ({cart.length})</span>
                        <span>Rs {cartTotal.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-[#6b7280]">
                        <span>Delivery</span>
                        <span>
                          {isFreeDelivery
                            ? "FREE"
                            : `Rs ${deliveryFee.toFixed(0)}`}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-sm pt-1 border-t border-[#e5e1d8] text-[#1a1a1a]">
                        <span>Grand Total</span>
                        <span className="text-[#4a5c2d]">
                          Rs {grandTotal.toFixed(0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setCheckoutOpen(false)}
                        className="flex-1 py-3 border border-[#e5e1d8] text-[#6b7280] text-[10px] font-bold tracking-widest uppercase hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
                      >
                        BACK
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-[#4a5c2d] text-[#f5f2ec] text-[10px] font-bold tracking-widest uppercase hover:bg-[#5a7038] transition-colors"
                      >
                        CONFIRM ORDER (Rs {grandTotal.toFixed(0)})
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
