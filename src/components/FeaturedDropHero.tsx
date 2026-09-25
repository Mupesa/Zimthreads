import React from "react"
import { FeaturedDropBanner } from "@/store/seedData"

interface FeaturedDropHeroProps {
  banner?: FeaturedDropBanner
  onSelectProduct?: (productId: string) => void
}

export default function FeaturedDropHero({
  banner,
  onSelectProduct,
}: FeaturedDropHeroProps) {
  if (!banner || !banner.enabled || !banner.imageUrl) {
    return null
  }

  const handleClick = () => {
    if (banner.productId && onSelectProduct) {
      onSelectProduct(banner.productId)
    }
  }

  return (
    <div className="mb-10 w-full overflow-hidden border border-[#e5e1d8] bg-white">
      <div
        onClick={handleClick}
        className={`w-full overflow-hidden ${
          banner.productId ? "cursor-pointer" : ""
        }`}
        title={banner.productId ? "View Product Details" : undefined}
      >
        <img
          src={banner.imageUrl}
          alt={banner.title || "Featured Drop"}
          className="w-full h-auto max-h-[420px] object-cover object-center hover:opacity-95 transition-opacity"
        />
      </div>
    </div>
  )
}
