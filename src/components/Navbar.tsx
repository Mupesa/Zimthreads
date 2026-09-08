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
            className="lg:hidden relative w-10 h-10 flex flex-col justify-center items-center focus:outline-none touch-manipulation"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <span
              className={`block w-5 h-0.5 bg-[#1a1a1a] transition-all duration-200 ${
                open ? "rotate-45 translate-y-[3px]" : "-translate-y-1"
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-[#1a1a1a] transition-all duration-200 my-0.5 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-[#1a1a1a] transition-all duration-200 ${
                open ? "-rotate-45 -translate-y-[3px]" : "translate-y-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu backdrop */}
      {open && (
        <div
          className="fixed inset-0 top-16 bg-black/40 z-30 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile menu drawer */}
      {open && (
        <div className="relative z-40 lg:hidden bg-[#f5f2ec] border-t border-[#e5e1d8] px-5 py-6 flex flex-col gap-2 animate-slide-down shadow-xl">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`text-xs font-bold tracking-widest uppercase py-3 px-3 rounded-xs transition-colors flex items-center justify-between ${
                location.pathname === l.to
                  ? "bg-[#4a5c2d]/10 text-[#4a5c2d]"
                  : "text-[#1a1a1a] hover:bg-black/5"
              }`}
            >
              <span>{l.label}</span>
              {location.pathname === l.to && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#4a5c2d]" />
              )}
            </Link>
          ))}
          <div className="pt-4 mt-2 border-t border-[#e5e1d8] space-y-2">
            <Link
              to="/booking"
              onClick={() => setOpen(false)}
              className="w-full inline-flex items-center justify-center px-4 py-3.5 bg-[#4a5c2d] text-[#f5f2ec] text-xs font-bold tracking-widest uppercase hover:bg-[#5a7038] transition-colors shadow-xs"
            >
              BOOK A SERVICE
            </Link>
            <a
              href="https://wa.me/23055132614"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-white border border-[#1a1a1a] text-[#1a1a1a] text-xs font-bold tracking-widest uppercase hover:bg-black hover:text-white transition-colors"
            >
              WHATSAPP (+230 5513 2614)
            </a>
          </div>
        </div>
      )}

      {/* Mobile Bottom Quick Bar for instant access (hidden on /booking to prevent clash with booking controller) */}
      {location.pathname !== "/booking" && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#f5f2ec]/95 backdrop-blur-md border-t border-[#e5e1d8] px-3 py-2 flex items-center justify-between gap-2 shadow-lg">
          <a
            href="https://wa.me/23055132614"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 px-2 bg-white border border-[#1a1a1a] text-[#1a1a1a] text-[10px] font-extrabold tracking-wider uppercase text-center flex items-center justify-center gap-1 shadow-xs"
          >
            <span>WHATSAPP</span>
          </a>
          <Link
            to="/booking"
            className="flex-[1.6] py-2.5 px-3 bg-[#4a5c2d] text-[#f5f2ec] text-[11px] font-extrabold tracking-widest uppercase text-center shadow-xs flex items-center justify-center gap-1"
          >
            <span>BOOK A CLEAN</span>
          </Link>
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative py-2 px-3 bg-white border border-[#e5e1d8] text-[#1a1a1a] flex items-center justify-center shadow-xs"
            aria-label="Shopping Bag"
          >
            <BagIcon className="w-4 h-4 text-[#1a1a1a]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#4a5c2d] text-white text-[9px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      )}
    </nav>
  )
}
