import React, { useState, useEffect, useRef } from "react"
import { useStore, Subscriber } from "@/store/StoreContext"
import { Link } from "@/router"
import { CheckIcon, SparklesIcon, ShieldCheckIcon } from "@/components/Icons"

// Google Multi-color G Icon SVG
function GoogleGIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

// Lightweight, zero-dependency confetti animator
function triggerConfettiBurst() {
  const count = 70
  const container = document.createElement("div")
  container.style.position = "fixed"
  container.style.inset = "0"
  container.style.pointerEvents = "none"
  container.style.zIndex = "9999"
  container.style.overflow = "hidden"
  document.body.appendChild(container)

  const colors = ["#4a5c2d", "#86a84e", "#fbbf24", "#22c55e", "#38bdf8", "#f43f5e", "#f5f2ec"]

  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div")
    const color = colors[Math.floor(Math.random() * colors.length)]
    const size = Math.random() * 8 + 6
    const left = Math.random() * 100
    const delay = Math.random() * 0.3
    const duration = Math.random() * 2 + 1.8

    particle.style.position = "absolute"
    particle.style.left = `${left}vw`
    particle.style.top = "-20px"
    particle.style.width = `${size}px`
    particle.style.height = `${size * (Math.random() > 0.5 ? 1.6 : 1)}px`
    particle.style.backgroundColor = color
    particle.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px"
    particle.style.opacity = "1"
    particle.style.transform = `rotate(${Math.random() * 360}deg)`
    particle.style.transition = `transform ${duration}s cubic-bezier(0.25, 1, 0.5, 1) ${delay}s, top ${duration}s cubic-bezier(0.25, 1, 0.5, 1) ${delay}s, opacity ${duration}s ease-out ${delay + 1.2}s`

    container.appendChild(particle)

    requestAnimationFrame(() => {
      particle.style.top = `${Math.random() * 85 + 15}vh`
      particle.style.transform = `translateX(${(Math.random() - 0.5) * 140}px) rotate(${Math.random() * 720}deg)`
      particle.style.opacity = "0"
    })
  }

  setTimeout(() => {
    container.remove()
  }, 4000)
}

export default function VIPEventPage() {
  const { addSubscriber } = useStore()

  // URL parameters
  const [eventSource, setEventSource] = useState("oasis_popup")
  const [eventName, setEventName] = useState("Oasis Beach Bar")
  const [promoCode, setPromoCode] = useState("OASIS10")

  // Form & Popup State
  const [showGooglePrompt, setShowGooglePrompt] = useState(true)
  const [emailInput, setEmailInput] = useState("")
  const [nameInput, setNameInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [copied, setCopied] = useState(false)

  // Success state
  const [claimedRecord, setClaimedRecord] = useState<Subscriber | null>(null)

  const emailInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const src = params.get("src") || "oasis_popup"
      const code = params.get("code") || "OASIS10"
      const evt = params.get("event") || "Oasis Beach Bar"
      setEventSource(src)
      setPromoCode(code)
      setEventName(evt)
    }

    // Auto-focus email input after small delay so native mobile autofill pops up
    const timer = setTimeout(() => {
      emailInputRef.current?.focus()
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  // Submission handler
  const handleCompleteSignUp = async (emailToSubmit: string, nameToSubmit?: string) => {
    const cleanEmail = (emailToSubmit || "").trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid Gmail or email address.")
      return
    }

    setErrorMessage("")
    setIsSubmitting(true)

    try {
      const res = await addSubscriber(
        cleanEmail,
        (nameToSubmit || nameInput || "").trim() || undefined,
        eventSource,
        eventName
      )

      if (res.success && res.record) {
        setClaimedRecord(res.record)
        setShowGooglePrompt(false)
        triggerConfettiBurst()
        try {
          navigator.vibrate?.([80, 40, 80])
        } catch {}
      } else {
        setErrorMessage(res.error || "Unable to save email. Please try again.")
      }
    } catch {
      setErrorMessage("Network issue. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyCode = () => {
    const codeToCopy = claimedRecord?.code || promoCode
    navigator.clipboard.writeText(codeToCopy)
    setCopied(true)
    try {
      navigator.vibrate?.(50)
    } catch {}
    setTimeout(() => setCopied(false), 2500)
  }

  const handleAppendDomain = (domain: string) => {
    const val = emailInput.trim()
    if (!val) {
      setEmailInput(`user${domain}`)
    } else if (val.includes("@")) {
      const prefix = val.split("@")[0]
      setEmailInput(`${prefix}${domain}`)
    } else {
      setEmailInput(`${val}${domain}`)
    }
    emailInputRef.current?.focus()
  }

  const whatsappMessage = encodeURIComponent(
    `Hi Zimthreads! I just scanned at the ${eventName} booth (VIP Code: ${claimedRecord?.code || promoCode}). I'd like to claim my 10% discount on t-shirts / sneaker drop-off!`
  )

  return (
    <main className="min-h-screen bg-[#0d1117] text-[#f5f2ec] flex flex-col justify-between selection:bg-[#4a5c2d] selection:text-white relative overflow-x-hidden">
      {/* Background Lighting Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-35">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#4a5c2d] rounded-full blur-[130px]" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-amber-600/25 rounded-full blur-[110px]" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-md mx-auto w-full px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4a5c2d]/25 border border-[#4a5c2d]/50 text-[#86a84e] text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-[#86a84e] animate-pulse" />
            {eventName} Exclusive Pop-Up
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
            ZIMTHREADS <span className="text-[#86a84e]">VIP PASS</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Sneaker Restoration Atelier & Streetwear
          </p>
        </div>

        {/* ==================== VIEW 1: ACTIVE PROMPT / GOOGLE POPUP ==================== */}
        {!claimedRecord ? (
          <div className="bg-[#161b22]/95 backdrop-blur-xl border border-gray-700/70 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
            {/* Google-Style Native Account Prompt Header */}
            <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-4 mb-5 flex items-center gap-3.5 shadow-inner">
              <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md">
                <GoogleGIcon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Sign in with Google</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#4a5c2d] text-white">VIP</span>
                </div>
                <div className="text-[11px] text-gray-400 truncate">
                  Choose your account for Zimthreads Collective
                </div>
              </div>
            </div>

            {/* Value Proposition */}
            <div className="text-center mb-5">
              <h2 className="text-lg font-extrabold uppercase text-amber-400 tracking-wide">
                ⚡ Unlock 10% Off Today ⚡
              </h2>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                Select or confirm your Gmail address below to instantly unlock your event voucher pass.
              </p>
            </div>

            {/* Email Input with Native Mobile Keyboard Autofill */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleCompleteSignUp(emailInput)
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Select or Enter Your Gmail:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <GoogleGIcon className="w-4 h-4 opacity-75" />
                  </div>
                  <input
                    ref={emailInputRef}
                    type="email"
                    name="email"
                    inputMode="email"
                    autoComplete="email webauthn"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="your.name@gmail.com"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[#0d1117] border-2 border-gray-700 text-white placeholder-gray-500 text-sm font-medium focus:outline-none focus:border-[#4a5c2d] focus:ring-2 focus:ring-[#4a5c2d]/40 transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* 1-Tap Domain Quick Fill Pills */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-gray-500 font-semibold uppercase">1-Tap:</span>
                {["@gmail.com", "@yahoo.com", "@icloud.com"].map((dom) => (
                  <button
                    type="button"
                    key={dom}
                    onClick={() => handleAppendDomain(dom)}
                    className="px-2.5 py-1 rounded-lg bg-gray-800/80 hover:bg-gray-700 active:scale-95 text-[11px] text-gray-300 font-mono transition-all cursor-pointer border border-gray-700/50"
                  >
                    {dom}
                  </button>
                ))}
              </div>

              {/* Optional Name */}
              <div>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="First name (optional)"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0d1117]/80 border border-gray-700 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-gray-500 transition-all"
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs text-center font-medium">
                  {errorMessage}
                </div>
              )}

              {/* High-Impact 1-Tap Confirmation Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#4a5c2d] to-[#5a7036] hover:from-[#546a33] hover:to-[#68823f] active:scale-[0.99] text-white font-extrabold text-sm tracking-wide uppercase transition-all shadow-xl shadow-[#4a5c2d]/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
              >
                {isSubmitting ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Confirm & Unlock 10% Off</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>

            {/* Privacy note */}
            <div className="mt-5 text-center flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-gray-400" />
              <span>Instant discount • Stored securely in Zimthreads Collective</span>
            </div>
          </div>
        ) : (
          /* ==================== VIEW 2: CONGRATULATIONS & VOUCHER ==================== */
          <div className="bg-[#161b22]/95 backdrop-blur-xl border-2 border-[#4a5c2d] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Top Celebration Ribbon */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#4a5c2d]/30 border-2 border-[#4a5c2d] text-[#86a84e] mx-auto flex items-center justify-center text-3xl mb-3 shadow-lg shadow-[#4a5c2d]/20 animate-bounce">
                🎉
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">
                CONGRATULATIONS!
              </h2>
              <p className="text-sm text-emerald-400 font-bold mt-1">
                You're officially on the Zimthreads VIP List!
              </p>
              {claimedRecord.name && (
                <p className="text-xs text-gray-300 mt-0.5">
                  Welcome to the collective, <span className="font-bold text-white">{claimedRecord.name}</span>.
                </p>
              )}
            </div>

            {/* Digital VIP Voucher Card */}
            <div className="bg-gradient-to-br from-black via-[#0d131f] to-[#162215] border-2 border-amber-500/50 rounded-2xl p-5 mb-5 shadow-inner relative">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-800 text-[10px] uppercase tracking-widest text-amber-400 font-bold">
                <span>ZIMTHREADS VIP EVENT PASS</span>
                <span>{eventName}</span>
              </div>

              <div className="text-center py-2">
                <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                  Your Exclusive Event Discount Code
                </div>
                <div className="font-mono text-3xl sm:text-4xl font-extrabold text-amber-300 tracking-wider my-2.5">
                  {claimedRecord.code || promoCode}
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/40">
                  ★ 10% OFF APPAREL & SNEAKER CARE
                </div>
              </div>

              {/* 1-Tap Copy Button */}
              <button
                type="button"
                onClick={handleCopyCode}
                className="w-full mt-4 py-3 px-4 rounded-xl bg-gray-800/90 hover:bg-gray-700 active:scale-[0.99] border border-gray-700 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                {copied ? (
                  <>
                    <CheckIcon className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Code Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <span>📋 Tap to Copy Voucher Code</span>
                  </>
                )}
              </button>
            </div>

            {/* In-Person Booth Instruction Callout */}
            <div className="p-4 rounded-2xl bg-[#4a5c2d]/25 border border-[#4a5c2d]/50 mb-5 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-[#86a84e] mb-1">
                📍 At the Booth Right Now?
              </div>
              <p className="text-xs text-gray-200 leading-relaxed">
                Show this screen to <strong className="text-white">Shepherd, Davies, or Anesu</strong> at the table to apply your 10% discount to your t-shirt, jacket, or sneaker drop-off!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <a
                href={`https://wa.me/23055132614?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] active:scale-[0.99] text-black font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <span>💬 WhatsApp the Team at the Booth</span>
              </a>

              <Link
                to="/shop"
                className="w-full py-3 px-5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs uppercase tracking-wide flex items-center justify-center transition-all cursor-pointer"
              >
                Browse Shop Collection →
              </Link>
            </div>

            <div className="text-center mt-4 text-[11px] text-gray-500">
              Registered with: <span className="text-gray-300 font-medium">{claimedRecord.email}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Zimthreads Collective • Mauritius</p>
        </div>
      </div>
    </main>
  )
}
