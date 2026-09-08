import { useState } from "react"
import { Link, useLocation } from "@/router"
import { useStore } from "@/store/StoreContext"
import { BagIcon } from "@/components/Icons"

const navLinks = [
  { label: "HOME", to: "/" },
  { label: "SERVICES", to: "/services" },
  { label: "SHOP", to: "/shop" },
  { label: "BOOKING", to: "/booking" },
  { label: "BLOG", to: "/blog" },
  { label: "ABOUT", to: "/about" },
  { label: "CONTACT", to: "/contact" },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { cartCount, setIsCartOpen } = useStore()

  return (
    <nav className="sticky top-0 z-40 bg-[#f5f2ec] border-b border-[#e5e1d8] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex flex-col leading-none">
          <span className="font-display text-2xl font-bold tracking-widest text-[#1a1a1a] uppercase">
            ZIMTHREAD
          </span>
          <span className="text-[10px] tracking-[0.3em] text-[#6b7280] uppercase">
            Collective
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-[11px] font-semibold tracking-widest uppercase transition-colors ${
                location.pathname === l.to
                  ? "text-[#4a5c2d] border-b-2 border-[#4a5c2d] pb-0.5"
                  : "text-[#1a1a1a] hover:text-[#4a5c2d]"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* CTA + Cart + Hamburger */}
        <div className="flex items-center gap-4">
          {/* Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-[#1a1a1a] hover:text-[#4a5c2d] transition-colors flex items-center gap-1.5 focus:outline-none"
            aria-label="Shopping Cart"
          >
            <BagIcon className="w-5 h-5 text-[#1a1a1a]" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#4a5c2d] text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </button>

          <Link
            to="/booking"
            className="hidden sm:inline-flex items-center px-4 py-2 bg-[#4a5c2d] text-[#f5f2ec] text-[11px] font-semibold tracking-widest uppercase hover:bg-[#5a7038] transition-colors"
          >
            BOOK NOW
          </Link>

          <button
            className="lg:hidden flex flex-col justify-center items-center w-8 h-8 p-1 gap-1.5 focus:outline-none"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <span
              className={`block w-5 h-0.5 bg-[#1a1a1a] transition-all duration-200 ${
                open ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-[#1a1a1a] transition-all duration-200 ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-[#1a1a1a] transition-all duration-200 ${
                open ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-[#f5f2ec] border-t border-[#e5e1d8] px-4 py-6 flex flex-col gap-4 animate-slide-down shadow-lg">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`text-sm font-semibold tracking-widest uppercase py-1 ${
                location.pathname === l.to ? "text-[#4a5c2d]" : "text-[#1a1a1a]"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-[#e5e1d8]">
            <Link
              to="/booking"
              onClick={() => setOpen(false)}
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-[#4a5c2d] text-[#f5f2ec] text-xs font-semibold tracking-widest uppercase hover:bg-[#5a7038] transition-colors"
            >
              BOOK A CLEAN
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
