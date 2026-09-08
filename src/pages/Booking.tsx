import { useState, useEffect, useRef } from "react"
import { useStore } from "@/store/StoreContext"
import { BookingItem } from "@/store/seedData"
import { CheckIcon, WhatsAppIcon } from "@/components/Icons"
import {
  formatBookingWhatsAppMessage,
  getWhatsAppUrl,
  openWhatsApp,
} from "@/lib/whatsapp"

const timeSlots = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
]
const steps = ["Service", "Details", "Date & Time", "Review", "Confirmed"]

export default function Booking() {
  const { services, addBooking, prefilledServiceId, setPrefilledServiceId } =
    useStore()
  const [step, setStep] = useState(0)
  const [selectedService, setSelectedService] = useState("")
  const [details, setDetails] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  })
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [confirmedBooking, setConfirmedBooking] = useState<BookingItem | null>(
    null,
  )

  // UX Navigation Refs for auto-scroll & focus management
  const formTopRef = useRef<HTMLDivElement>(null)
  const detailsRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // If user navigated from Services page with a prefilled service
  useEffect(() => {
    if (prefilledServiceId) {
      setSelectedService(prefilledServiceId)
      setPrefilledServiceId(null)
    }
  }, [prefilledServiceId, setPrefilledServiceId])

  // Viewport auto-alignment on step transitions
  useEffect(() => {
    if (formTopRef.current) {
      const navHeight = 72
      const elementTop = formTopRef.current.getBoundingClientRect().top
      const targetScroll = elementTop + window.pageYOffset - navHeight
      window.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: "smooth",
      })
    }

    // On Step 1 (Client Details), autofocus the name field smoothly without jumping
    if (step === 1) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus({ preventScroll: true })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [step])

  const activeServices = services.filter((s) => s.active !== false)

  const canNext = () => {
    if (step === 0) return !!selectedService
    if (step === 1)
      return details.name.trim() && details.email.trim() && details.phone.trim()
    if (step === 2) return selectedDate && selectedTime
    return true
  }

  const serviceObj = services.find((s) => s.id === selectedService)

  const handleSelectService = (id: string) => {
    setSelectedService(id)
    // Smooth micro-scroll to reveal treatment features breakdown and continue options
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      })
    }, 60)
  }

  const handleNext = () => {
    if (step === 3) {
      handleConfirmBooking()
    } else if (canNext()) {
      setStep((s) => s + 1)
    }
  }

  const handleConfirmBooking = () => {
    if (!serviceObj) return

    const newBooking = addBooking({
      customer: details.name,
      email: details.email,
      phone: details.phone,
      serviceId: serviceObj.id,
      serviceName: serviceObj.title,
      price: serviceObj.price,
      priceNumeric: serviceObj.priceNumeric || 15,
      date: selectedDate,
      time: selectedTime,
      notes: details.notes,
    })

    setConfirmedBooking(newBooking)
    setStep(4)

    // Automatically dispatch booking details via WhatsApp
    const waText = formatBookingWhatsAppMessage({
      id: newBooking.id,
      customer: newBooking.customer,
      phone: newBooking.phone,
      email: newBooking.email,
      serviceName: newBooking.serviceName,
      price: newBooking.price,
      date: newBooking.date,
      time: newBooking.time,
      notes: newBooking.notes,
    })
    openWhatsApp(waText)
  }

  return (
    <main className="min-h-screen bg-[#f5f2ec] pt-8 pb-32 sm:py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <p className="text-xs text-[#6b7280] mb-4">Home / Booking</p>

        <div ref={formTopRef} className="scroll-mt-24">
          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold uppercase text-[#1a1a1a] mb-6 sm:mb-8">
            BOOK YOUR SESSION
          </h1>

          {/* Mobile Step Bar */}
          <div className="sm:hidden mb-6 bg-white border border-[#e5e1d8] p-4 shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#4a5c2d]">
                STEP {step + 1} OF {steps.length}
              </span>
              <span className="text-xs font-bold uppercase text-[#1a1a1a]">
                {steps[step]}
              </span>
            </div>
            <div className="w-full bg-[#e5e1d8] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#4a5c2d] h-full transition-all duration-300 rounded-full"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Desktop Step indicators */}
        <div className="hidden sm:flex items-center mb-10 overflow-x-auto scrollbar-hide pb-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  disabled={i >= step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    i < step
                      ? "bg-[#4a5c2d] border-[#4a5c2d] text-[#f5f2ec] cursor-pointer hover:bg-[#5a7038]"
                      : i === step
                        ? "bg-[#1a1a1a] border-[#1a1a1a] text-[#f5f2ec]"
                        : "bg-transparent border-[#d1cdc4] text-[#9ca3af] cursor-not-allowed"
                  }`}
                >
                  {i < step ? <CheckIcon className="w-3.5 h-3.5" /> : i + 1}
                </button>
                <span
                  className={`text-[10px] font-semibold tracking-widest uppercase mt-1 ${
                    i === step ? "text-[#1a1a1a]" : "text-[#9ca3af]"
                  }`}
                >
                  {i + 1}. {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-10 sm:w-20 h-0.5 mx-2 mb-5 ${
                    i < step ? "bg-[#4a5c2d]" : "bg-[#e5e1d8]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white border border-[#e5e1d8] p-5 sm:p-8 shadow-xs">
          {/* Step 0: Choose Service */}
          {step === 0 && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
                <div>
                  <h2 className="font-display text-xl font-bold uppercase tracking-wide text-[#1a1a1a]">
                    SELECT TREATMENT OR COMBO DEAL
                  </h2>
                  <p className="text-xs text-[#6b7280]">
                    Choose from standard cleaning, deep restorations, or
                    multi-pair packages.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeServices.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectService(s.id)}
                    className={`border-2 p-4 text-left transition-all relative flex flex-col justify-between ${
                      selectedService === s.id
                        ? "border-[#4a5c2d] bg-[#4a5c2d]/10 ring-2 ring-[#4a5c2d]/20 shadow-xs"
                        : "border-[#e5e1d8] bg-white hover:border-[#4a5c2d]"
                    }`}
                  >
                    {s.badge && (
                      <span className="absolute -top-2.5 right-3 bg-[#4a5c2d] text-white text-[8px] font-extrabold px-2 py-0.5 uppercase tracking-widest shadow-xs">
                        {s.badge}
                      </span>
                    )}
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-display text-base font-bold uppercase tracking-wide text-[#1a1a1a]">
                          {s.title}
                        </h3>
                        {selectedService === s.id && (
                          <CheckIcon className="w-4 h-4 text-[#4a5c2d]" />
                        )}
                      </div>
                      <p className="text-xs text-[#6b7280] mt-1 leading-tight">
                        {s.subtitle}
                      </p>
                      {s.tagline && (
                        <p className="text-[10px] text-[#4a5c2d] font-bold mt-1 uppercase">
                          {s.tagline}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 pt-2 border-t border-[#f5f2ec] flex items-center justify-between">
                      <p className="text-sm font-extrabold text-[#4a5c2d]">
                        {s.price}
                      </p>
                      {s.turnaround && (
                        <span className="text-[9px] text-[#9ca3af] font-semibold uppercase">
                          {s.turnaround}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Service Details on Booking Selection */}
              {selectedService && serviceObj && (
                <div
                  ref={detailsRef}
                  className="mt-6 p-4 sm:p-5 bg-[#f5f2ec] border border-[#4a5c2d]/30 animate-slide-down scroll-mt-20"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#e5e1d8] gap-1">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest uppercase text-[#4a5c2d]">
                        Selected Treatment
                      </span>
                      <h4 className="font-display text-xl font-bold uppercase text-[#1a1a1a]">
                        {serviceObj.title} ({serviceObj.price})
                      </h4>
                    </div>
                    {serviceObj.turnaround && (
                      <span className="text-xs font-mono text-[#6b7280]">
                        Turnaround: {serviceObj.turnaround}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#4b5563] leading-relaxed my-3">
                    {serviceObj.desc}
                  </p>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-[#1a1a1a] mb-2">
                      Included in this service:
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {serviceObj.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-xs text-[#1a1a1a]"
                        >
                          <CheckIcon className="w-3.5 h-3.5 text-[#4a5c2d] shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div>
              <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-2 text-[#1a1a1a]">
                CLIENT & SHOE DETAILS
              </h2>
              <p className="text-xs text-[#6b7280] mb-6">
                Provide your contact information. Drop-off coordinates will be
                shared on WhatsApp.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    label: "Full Name *",
                    key: "name",
                    type: "text",
                    placeholder: "e.g. Jean-Luc / Alex",
                  },
                  {
                    label: "Email Address *",
                    key: "email",
                    type: "email",
                    placeholder: "e.g. client@example.com",
                  },
                  {
                    label: "Phone / WhatsApp Number *",
                    key: "phone",
                    type: "tel",
                    placeholder: "e.g. +230 5513 2614",
                  },
                ].map(({ label, key, type, placeholder }) => (
                  <div
                    key={key}
                    className={key === "phone" ? "sm:col-span-2" : ""}
                  >
                    <label className="text-[10px] font-bold tracking-widest uppercase text-[#6b7280] block mb-1">
                      {label}
                    </label>
                    <input
                      ref={key === "name" ? nameInputRef : undefined}
                      type={type}
                      required
                      value={details[(key as keyof typeof details)]}
                      onChange={(e) =>
                        setDetails({ ...details, [key]: e.target.value })
                      }
                      className="w-full border border-[#e5e1d8] bg-[#f5f2ec] px-4 py-3 text-base sm:text-sm text-[#1a1a1a] focus:outline-none focus:border-[#4a5c2d] transition-colors"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-[#6b7280] block mb-1">
                    Shoe Model & Condition Notes
                  </label>
                  <textarea
                    value={details.notes}
                    onChange={(e) =>
                      setDetails({ ...details, notes: e.target.value })
                    }
                    rows={3}
                    className="w-full border border-[#e5e1d8] bg-[#f5f2ec] px-4 py-3 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#4a5c2d] resize-none"
                    placeholder="e.g. Nike Air Force 1 White (EU 43), heavy scuffing on toe box..."
                  />
                  <p className="text-[11px] text-[#4a5c2d] font-semibold mt-1">
                    Tip: You can send us a photo of your pair on WhatsApp (+230
                    55132614) for instant material inspection.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && (
            <div>
              <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-6 text-[#1a1a1a]">
                SCHEDULE DROP-OFF
              </h2>
              <div className="mb-6">
                <label className="text-[10px] font-bold tracking-widest uppercase text-[#6b7280] block mb-2">
                  Preferred Date *
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-[#e5e1d8] bg-[#f5f2ec] px-4 py-3 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#4a5c2d]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold tracking-widest uppercase text-[#6b7280] block mb-3">
                  Time Window *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTime(t)}
                      className={`py-2.5 text-xs font-semibold border transition-colors ${
                        selectedTime === t
                          ? "bg-[#4a5c2d] text-[#f5f2ec] border-[#4a5c2d]"
                          : "border-[#e5e1d8] text-[#1a1a1a] hover:border-[#4a5c2d]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-6 text-[#1a1a1a]">
                CONFIRM APPOINTMENT
              </h2>
              <div className="space-y-3.5">
                {[
                  { label: "Treatment", value: serviceObj?.title },
                  { label: "Price Estimate", value: serviceObj?.price },
                  {
                    label: "Turnaround Time",
                    value: serviceObj?.turnaround || "24-48 Hours",
                  },
                  { label: "Client Name", value: details.name },
                  { label: "Email", value: details.email },
                  { label: "Phone", value: details.phone },
                  { label: "Drop-off Date", value: selectedDate },
                  { label: "Scheduled Slot", value: selectedTime },
                  ...(details.notes
                    ? [{ label: "Notes", value: details.notes }]
                    : []),
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between border-b border-[#e5e1d8] pb-2.5"
                  >
                    <span className="text-[11px] font-bold tracking-widest uppercase text-[#6b7280]">
                      {label}
                    </span>
                    <span className="text-sm font-semibold text-[#1a1a1a] text-right">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Confirmed */}
          {step === 4 && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-[#4a5c2d] flex items-center justify-center mx-auto mb-4 text-white">
                <CheckIcon className="w-6 h-6" />
              </div>
              <h2 className="font-display text-3xl font-extrabold uppercase text-[#1a1a1a] mb-2">
                BOOKING CONFIRMED
              </h2>
              <p className="text-[#6b7280] text-sm mb-6 max-w-sm mx-auto">
                We have registered your session. A confirmation email has been
                dispatched to <strong>{details.email}</strong>.
              </p>
              <div className="inline-block border border-[#e5e1d8] p-5 text-left mb-8 bg-[#f5f2ec] w-full max-w-md">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#e5e1d8]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">
                    BOOKING REFERENCE
                  </span>
                  <span className="font-mono font-bold text-sm text-[#4a5c2d]">
                    {confirmedBooking?.id || "BK-CONFIRMED"}
                  </span>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#4a5c2d]">
                  {serviceObj?.title} ({serviceObj?.price})
                </p>
                <p className="font-semibold text-[#1a1a1a] mt-1">
                  {selectedDate} at {selectedTime}
                </p>
                <p className="text-sm text-[#6b7280]">
                  {details.name} · {details.phone}
                </p>
                {details.notes && (
                  <p className="text-xs text-[#6b7280] italic mt-2">
                    "{details.notes}"
                  </p>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href={getWhatsAppUrl(
                    formatBookingWhatsAppMessage({
                      id: confirmedBooking?.id || "BK-CONFIRMED",
                      customer: details.name,
                      phone: details.phone,
                      email: details.email,
                      serviceName: serviceObj?.title || "",
                      price: serviceObj?.price || "",
                      date: selectedDate,
                      time: selectedTime,
                      notes: details.notes,
                    }),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 bg-[#25D366] hover:bg-[#1EBE5D] text-black text-xs font-bold tracking-wider uppercase transition-colors inline-flex items-center gap-2 shadow-sm"
                >
                  <WhatsAppIcon className="w-4 h-4 text-black" />
                  <span>SEND BOOKING ON WHATSAPP</span>
                </a>
                <button
                  onClick={() => {
                    setStep(0)
                    setSelectedService("")
                    setSelectedDate("")
                    setSelectedTime("")
                    setConfirmedBooking(null)
                  }}
                  className="px-6 py-3.5 bg-[#1a1a1a] text-[#f5f2ec] text-xs font-bold tracking-wider uppercase hover:bg-black transition-colors"
                >
                  BOOK ANOTHER SESSION
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Navigation buttons */}
        {step < 4 && (
          <div className="hidden sm:flex items-center justify-between gap-3 mt-6">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-6 py-3.5 border border-[#e5e1d8] text-[#6b7280] text-[11px] font-bold tracking-widest uppercase hover:border-[#1a1a1a] hover:text-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-center"
            >
              BACK
            </button>
            <button
              onClick={handleNext}
              disabled={!canNext()}
              className="px-7 py-3.5 bg-[#4a5c2d] text-[#f5f2ec] text-[11px] font-bold tracking-widest uppercase hover:bg-[#5a7038] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-center shadow-xs inline-flex items-center justify-center gap-1.5"
            >
              {step === 3 ? (
                <>
                  <WhatsAppIcon className="w-3.5 h-3.5 text-[#f5f2ec]" />
                  <span>CONFIRM & BOOK VIA WHATSAPP</span>
                </>
              ) : (
                <span>CONTINUE</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Floating Mobile Step Controller (Thumb Zone UX) */}
      {step < 4 && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a]/95 backdrop-blur-md border-t border-[#333] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.35)] animate-slide-up">
          {/* Step 0: Service Selection status & quick continue */}
          {step === 0 ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0 pr-2">
                {selectedService && serviceObj ? (
                  <div className="animate-fade-in">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="w-2 h-2 rounded-full bg-[#86a84e] animate-pulse"></span>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#86a84e] truncate">
                        Selected
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white uppercase truncate">
                      {serviceObj.title} · {serviceObj.price}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-[#9ca3af]">
                      Step 1 of 5
                    </p>
                    <p className="text-xs text-white/80 font-medium truncate">
                      Tap a treatment above
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleNext}
                disabled={!selectedService}
                className={`px-5 py-2.5 text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 shrink-0 rounded-xs ${
                  selectedService
                    ? "bg-[#4a5c2d] hover:bg-[#5a7038] text-[#f5f2ec] shadow-lg shadow-[#4a5c2d]/40 active:scale-95 animate-scale-up"
                    : "bg-[#2a2a2a] text-[#6b7280] cursor-not-allowed opacity-60"
                }`}
              >
                <span>CONTINUE</span>
                <span className="text-sm">→</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2.5">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="px-4 py-2.5 border border-[#444] text-[#d1d5db] text-xs font-bold tracking-wider uppercase hover:border-white transition-colors"
              >
                BACK
              </button>
              <button
                onClick={handleNext}
                disabled={!canNext()}
                className="flex-1 py-2.5 px-4 bg-[#4a5c2d] hover:bg-[#5a7038] text-[#f5f2ec] text-xs font-bold tracking-wider uppercase disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-1.5 active:scale-95 rounded-xs"
              >
                {step === 3 ? (
                  <>
                    <WhatsAppIcon className="w-3.5 h-3.5 text-[#f5f2ec]" />
                    <span>BOOK VIA WHATSAPP</span>
                  </>
                ) : (
                  <>
                    <span>CONTINUE</span>
                    <span className="text-sm">→</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
