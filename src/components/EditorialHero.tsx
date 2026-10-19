import React from "react"
import { Link, useRouter } from "@/router"
import {
  ShieldCheckIcon,
  LeafIcon,
  LightningIcon,
  SparklesIcon,
  ArrowRightIcon,
} from "@/components/Icons"

interface EditorialHeroProps {
  onScrollToRail?: () => void
  onScrollToServices?: () => void
}

const trustBadges = [
  { icon: ShieldCheckIcon, label: "CERTIFIED CARE ATELIER" },
  { icon: LeafIcon, label: "HOG HAIR & ECO CHEMISTRY" },
  { icon: SparklesIcon, label: "BESPOKE CULTURAL CUTS" },
  { icon: LightningIcon, label: "ISLAND-WIDE DROP POINTS" },
]

export default function EditorialHero({
  onScrollToRail,
  onScrollToServices,
}: EditorialHeroProps) {
  const { navigate } = useRouter()

  const handleExploreDrops = () => {
    if (onScrollToRail) {
      onScrollToRail()
    } else {
      const el = document.getElementById("collection-rail-section")
      if (el) {
        el.scrollIntoView({ behavior: "smooth" })
      } else {
        navigate("/shop")
      }
    }
  }

  const handleBookCare = () => {
    if (onScrollToServices) {
      onScrollToServices()
    } else {
      const el = document.getElementById("core-services-section")
      if (el) {
        el.scrollIntoView({ behavior: "smooth" })
      } else {
        navigate("/booking")
      }
    }
  }

  return (
    <section className="relative min-h-[88vh] sm:min-h-[92vh] flex flex-col justify-between overflow-hidden bg-[#121513] text-[#f5f2ec]">
      {/* Background Ambience & Editorial Imagery */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Subtle grid lines */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(#f5f2ec 1px, transparent 1px), linear-gradient(90deg, #f5f2ec 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />

        {/* Cinematic gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121513] via-[#121513]/70 to-[#121513]/40 z-1" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#121513] via-[#121513]/80 to-transparent z-1" />

        {/* Editorial Heritage Image Layer */}
        <img
          src="https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto,w_1920/v1791397726/zimthreads/jackets/fmyul3tffougz1obkara.png"
          alt="Zimthreads Collective Editorial Mood"
          className="w-full h-full object-cover object-center lg:object-right filter brightness-[0.55] contrast-[1.1] scale-105 animate-fade-in"
        />
      </div>

      {/* Top Identity Kicker */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full pt-10 sm:pt-14">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2a322b] pb-4">
          <div className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-mono tracking-[0.25em] uppercase text-[#86a84e]">
            <span className="w-2 h-2 rounded-full bg-[#86a84e] animate-pulse" />
            <span>MAURITIUS ATELIER // EST. 2024</span>
          </div>

          <div className="flex items-center gap-4 text-[9px] sm:text-[10px] font-mono uppercase text-[#9ca3af]">
            <span>STREETWEAR DROPS</span>
            <span className="text-[#4a5c2d]">/</span>
            <span>FOOTWEAR LAUNDRY</span>
            <span className="text-[#4a5c2d]">/</span>
            <span>HERITAGE CAPSULES</span>
          </div>
        </div>
      </div>

      {/* Main Editorial Hero Typography & Dual Action */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full py-12 sm:py-20 flex-1 flex flex-col justify-center">
        <div className="max-w-3xl">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#86a84e]/15 border border-[#86a84e]/30 text-[#86a84e] text-[10px] font-bold tracking-[0.25em] uppercase mb-6">
            Clothes · Sneakers · Heritage
          </div>

          {/* Master Headline */}
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black uppercase leading-[0.92] tracking-tight text-white mb-6">
            PREMIUM CARE.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#86a84e] via-[#a3c965] to-[#f5f2ec]">
              UNAPOLOGETIC
            </span>
            <br />
            STREETWEAR.
          </h1>

          {/* Subtext Manifesto */}
          <p className="text-sm sm:text-base text-[#d1d5db] max-w-xl leading-relaxed mb-8 font-sans">
            Mauritius&apos; premier dual-identity collective. We engineer
            hospital-grade shoe restoration chemistry by day, and cut
            limited-edition African heritage silhouettes & vintage motorsport
            archives by night.
          </p>

          {/* Dual Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 max-w-md sm:max-w-none">
            {/* Primary Action: Explore Drops */}
            <button
              onClick={handleExploreDrops}
              className="px-6 py-4 bg-[#86a84e] hover:bg-[#96bd59] text-[#121513] font-display text-xs sm:text-sm font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-[#86a84e]/20"
            >
              <span>EXPLORE DROPS & CAPSULES</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>

            {/* Secondary Action: Book Shoe Care */}
            <button
              onClick={handleBookCare}
              className="px-6 py-4 bg-transparent hover:bg-white/10 text-white border border-[#374151] hover:border-white font-display text-xs sm:text-sm font-extrabold tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>BOOK SNEAKER RESTORATION</span>
              <span>↓</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Status & Trust Badges Strip */}
      <div className="relative z-10 border-t border-[#242b25] bg-[#121513]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-8">
            {trustBadges.map((b) => {
              const IconComp = b.icon
              return (
                <div key={b.label} className="flex items-center gap-2">
                  <IconComp className="w-3.5 h-3.5 text-[#86a84e]" />
                  <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-[#d1d5db]">
                    {b.label}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono text-[#86a84e] uppercase bg-[#1a211b] px-3 py-1 border border-[#2e3b2f]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#86a84e] animate-ping" />
            <span>ZIMBABWE &apos;02&apos; PRE-ORDER NOW LIVE</span>
          </div>
        </div>
      </div>
    </section>
  )
}
