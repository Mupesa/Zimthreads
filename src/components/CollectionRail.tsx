import React, { useRef } from "react"
import { Link, useRouter } from "@/router"
import { ArrowRightIcon } from "@/components/Icons"

interface CollectionRailProps {
  onSelectSpotlight?: () => void
  onSelectServices?: () => void
}

interface CapsuleItem {
  id: string
  title: string
  subtitle: string
  pill: string
  pricing: string
  imageUrl: string
  alt: string
  actionType: "spotlight" | "services" | "link"
  href?: string
}

export default function CollectionRail({
  onSelectSpotlight,
  onSelectServices,
}: CollectionRailProps) {
  const { navigate } = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const capsules: CapsuleItem[] = [
    {
      id: "capsule-zim-02",
      title: "Zimbabwe '02' Heritage Jersey",
      subtitle:
        "Official Pre-Order Kit featuring national bird heraldry and custom name lettering.",
      pill: "FLAGSHIP DROP · PRE-ORDER",
      pricing: "Rs 750 · Free Customization Option",
      imageUrl:
        "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto,w_800/v1790842891/zimthreads/products/d7oauktons2oaunl3nnp.png",
      alt: "Zimbabwe 02 Heritage Jersey Front View",
      actionType: "spotlight",
    },
    {
      id: "capsule-paddock",
      title: "The Paddock Archive",
      subtitle:
        "14 iconic vintage motorsport racing garments. Genuine cowhide leathers & pit twills.",
      pill: "CAPSULE 01 · 14 EDITIONS",
      pricing: "From Rs 1,750 — Rs 2,850",
      imageUrl:
        "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto,w_800/v1791397726/zimthreads/jackets/fmyul3tffougz1obkara.png",
      alt: "The Paddock Archive Vintage Motorsport Racing Jackets",
      actionType: "link",
      href: "/collection/racing-jackets",
    },
    {
      id: "capsule-streetwear",
      title: "African Heritage & Atelier Cuts",
      subtitle:
        "Authentic beaded heritage bracelets, heavyweight hoodies, and structured twill caps.",
      pill: "HANDCRAFTED · ACCESSORIES",
      pricing: "From Rs 300 · Limited Quantities",
      imageUrl:
        "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto,w_800/v1790926754/zimthreads/bracelets/maabu3xpq1t58u2xky6i.png",
      alt: "Zimthread African Heritage Beaded Bracelet",
      actionType: "link",
      href: "/shop",
    },
    {
      id: "capsule-sneaker-care",
      title: "Footwear Restoration Lab",
      subtitle:
        "Hospital-grade shoe laundry, midsole un-yellowing, suede nap revival, and multi-pair deals.",
      pill: "CERTIFIED CARE · DROP POINTS",
      pricing: "Treatments From Rs 300 · Combos Rs 500+",
      imageUrl:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop&auto=format",
      alt: "Zimthreads Professional Sneaker Laundry",
      actionType: "services",
    },
  ]

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -340, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 340, behavior: "smooth" })
    }
  }

  const handleCardClick = (capsule: CapsuleItem) => {
    if (capsule.actionType === "spotlight") {
      if (onSelectSpotlight) {
        onSelectSpotlight()
      } else {
        const el = document.getElementById("featured-product-spotlight")
        if (el) {
          el.scrollIntoView({ behavior: "smooth" })
        } else {
          navigate("/shop")
        }
      }
    } else if (capsule.actionType === "services") {
      if (onSelectServices) {
        onSelectServices()
      } else {
        const el = document.getElementById("core-services-section")
        if (el) {
          el.scrollIntoView({ behavior: "smooth" })
        } else {
          navigate("/services")
        }
      }
    } else if (capsule.href) {
      navigate(capsule.href)
    }
  }

  return (
    <section
      id="collection-rail-section"
      className="py-16 sm:py-24 bg-[#141715] text-[#f5f2ec] border-b border-[#242b25] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header with Left-Right Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-mono tracking-[0.3em] uppercase text-[#86a84e] mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#86a84e]" />
              <span>COLLECTION RAIL // EXPLORE ARCHIVE</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              CURATED CAPSULES
            </h2>
            <p className="text-xs sm:text-sm text-[#9ca3af] mt-2 max-w-lg">
              Swipe through our current seasonal releases, archival motorsport
              capsules, and professional sneaker laundry services.
            </p>
          </div>

          {/* Chevron Controls */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={scrollLeft}
              aria-label="Scroll left"
              className="w-10 h-10 border border-[#374151] hover:border-[#86a84e] text-white hover:text-[#86a84e] bg-[#1a211b] transition-colors flex items-center justify-center cursor-pointer"
            >
              <span className="font-mono text-base font-bold">←</span>
            </button>
            <button
              onClick={scrollRight}
              aria-label="Scroll right"
              className="w-10 h-10 border border-[#374151] hover:border-[#86a84e] text-white hover:text-[#86a84e] bg-[#1a211b] transition-colors flex items-center justify-center cursor-pointer"
            >
              <span className="font-mono text-base font-bold">→</span>
            </button>
          </div>
        </div>

        {/* The Scrollable Rail with Right-Side Peek */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mr-4 pr-12 sm:-mr-6 sm:pr-20 pb-4"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {capsules.map((capsule) => (
            <div
              key={capsule.id}
              onClick={() => handleCardClick(capsule)}
              className="group shrink-0 w-[280px] sm:w-[340px] md:w-[380px] snap-start border border-[#2a322b] bg-[#1a201c] hover:border-[#86a84e] transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden relative shadow-lg"
            >
              {/* Image Container with Tall Aspect Ratio */}
              <div className="aspect-[4/5] sm:aspect-[3/4] w-full overflow-hidden bg-[#111412] relative">
                <img
                  src={capsule.imageUrl}
                  alt={capsule.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                  loading="lazy"
                />

                {/* Subtle dark gradient scrim for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a201c] via-[#1a201c]/30 to-transparent opacity-90" />

                {/* Top Badge Pill */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="bg-[#86a84e] text-[#121513] text-[9px] font-black uppercase px-2.5 py-1 tracking-wider shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#121513] animate-pulse" />
                    <span>{capsule.pill}</span>
                  </span>
                </div>

                {/* Bottom Overlay Price Strip */}
                <div className="absolute bottom-3 left-3 right-3 z-10">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#86a84e] font-bold">
                    {capsule.pricing}
                  </p>
                </div>
              </div>

              {/* Text Card Body */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between border-t border-[#2a322b]">
                <div>
                  <h3 className="font-display font-extrabold text-base sm:text-lg text-white mb-2 leading-snug group-hover:text-[#86a84e] transition-colors">
                    {capsule.title}
                  </h3>
                  <p className="text-xs text-[#9ca3af] leading-relaxed line-clamp-2">
                    {capsule.subtitle}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#2a322b] flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[#86a84e] group-hover:text-white transition-colors">
                  <span>VIEW DETAILS</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
