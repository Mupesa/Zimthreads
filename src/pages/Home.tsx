import { Link, useRouter } from "@/router"
import { useStore } from "@/store/StoreContext"
import {
  ShieldCheckIcon,
  LeafIcon,
  LightningIcon,
  SparklesIcon,
  CheckIcon,
  ClockIcon,
  ArrowRightIcon,
  PhoneIcon,
} from "@/components/Icons"

const categories = [
  "CLEAN · RS 300",
  "DEEP CLEAN · RS 400",
  "RESTORE · RS 600+",
  "2 PAIRS COMBO · RS 500",
  "3 PAIRS COMBO · RS 800",
  "CUSTOM APPAREL",
]

const badges = [
  { icon: ShieldCheckIcon, label: "TRUSTED SERVICE" },
  { icon: LeafIcon, label: "QUALITY CARE CHEMISTRY" },
  { icon: SparklesIcon, label: "STUDENTS & SNEAKER LOVERS" },
  { icon: LightningIcon, label: "CLEAN REPEAT ROTATION" },
]

const whyUs = [
  {
    title: "TRUSTED SERVICE",
    desc: "Carefully cleaning every pair according to its specific upper material, age, and condition.",
  },
  {
    title: "QUALITY CARE",
    desc: "Formulated non-toxic cleaners and hog hair bristle scrubbers that preserve factory finishes and stitching.",
  },
  {
    title: "STUDENTS & SNEAKER LOVERS",
    desc: "Accessible, student-friendly rates with heavy multi-pair discounts so your entire rotation stays crisp.",
  },
  {
    title: "CLEAN REPEAT",
    desc: "Seamless drop-off and collection points across Mauritius with rapid turnaround and live WhatsApp updates.",
  },
]

export default function Home() {
  const { services, setPrefilledServiceId } = useStore()
  const { navigate } = useRouter()

  const handleBookService = (serviceId: string) => {
    setPrefilledServiceId(serviceId)
    navigate("/booking")
  }

  const coreServices = services.filter((s) =>
    ["clean", "deep", "restore"].includes(s.id),
  )
  const dealServices = services.filter((s) => s.id.startsWith("deal-"))

  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#f5f2ec]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1400&h=900&fit=crop&auto=format')",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center py-16 sm:py-24">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#4a5c2d]/10 text-[#4a5c2d] text-[10px] font-bold tracking-[0.25em] uppercase mb-4">
              Clothes · Sneakers · Community
            </div>
            <h1 className="font-display text-[clamp(3rem,7.5vw,6rem)] font-extrabold uppercase leading-none text-[#1a1a1a] mb-5">
              CLEANER SHOES.
              <br />
              <span className="text-[#4a5c2d]">A STRONGER YOU.</span>
            </h1>
            <p className="text-[#4b5563] text-sm sm:text-base max-w-md mb-8 leading-relaxed font-medium">
              Mauritius professional sneaker care and restoration atelier. Same
              shoes. Cleaner story. Fresh steps, bigger plans.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/booking"
                className="px-7 py-3.5 bg-[#4a5c2d] text-[#f5f2ec] text-[11px] font-bold tracking-widest uppercase hover:bg-[#5a7038] transition-colors shadow-sm"
              >
                BOOK A SERVICE
              </Link>
              <a
                href="https://wa.me/23055132614"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-[#1a1a1a] text-[#1a1a1a] text-[11px] font-bold tracking-widest uppercase hover:bg-[#1a1a1a] hover:text-[#f5f2ec] transition-colors"
              >
                <PhoneIcon className="w-3.5 h-3.5" />
                WHATSAPP (+230 55132614)
              </a>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=500&fit=crop&auto=format"
                alt="Clean white sneakers"
                className="w-full max-w-md object-contain drop-shadow-2xl"
              />
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-28 h-28 rounded-full border-2 border-[#1a1a1a] flex items-center justify-center bg-[#f5f2ec] shadow-lg">
                <div className="text-center">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest leading-tight text-[#1a1a1a]">
                    WE CLEAN.
                    <br />
                    <span className="text-[#4a5c2d]">YOU SHINE.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xs border-t border-[#e5e1d8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap justify-center sm:justify-between gap-4 sm:gap-6">
            {badges.map((b) => {
              const IconComp = b.icon
              return (
                <div key={b.label} className="flex items-center gap-2">
                  <IconComp className="w-4 h-4 text-[#4a5c2d]" />
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[#1a1a1a]">
                    {b.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Category bar */}
      <section className="bg-[#1a1a1a] py-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-8 px-6 min-w-max mx-auto justify-center">
          {categories.map((c) => (
            <Link
              key={c}
              to="/services"
              className="text-[#9ca3af] hover:text-[#86a84e] transition-colors whitespace-nowrap text-[11px] font-semibold tracking-widest uppercase"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      {/* Core Services Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[#4a5c2d] mb-2">
            Professional Shoe Cleaning Services
          </p>
          <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold uppercase text-[#1a1a1a]">
            OUR CORE TREATMENTS
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {coreServices.map((s) => (
            <div
              key={s.id}
              className={`relative border ${
                s.badge ? "border-[#4a5c2d] shadow-md" : "border-[#e5e1d8]"
              } bg-white group hover:border-[#4a5c2d] transition-colors overflow-hidden flex flex-col justify-between`}
            >
              {s.badge && (
                <div className="absolute top-0 right-0 z-10 bg-[#4a5c2d] text-white text-[9px] font-extrabold tracking-widest uppercase px-3 py-1">
                  ★ {s.badge}
                </div>
              )}
              <div>
                <div className="h-52 overflow-hidden bg-[#e5e1d8]">
                  <img
                    src={s.img}
                    alt={s.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-[#1a1a1a]">
                      {s.title}
                    </h3>
                    <span className="font-display text-2xl font-extrabold text-[#4a5c2d]">
                      {s.price}
                    </span>
                  </div>
                  {s.tagline && (
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#4a5c2d] mb-2">
                      "{s.tagline}"
                    </p>
                  )}
                  <div className="w-8 h-0.5 bg-[#4a5c2d] mb-3" />
                  <p className="text-xs text-[#6b7280] leading-relaxed mb-4">
                    {s.desc}
                  </p>
                  <ul className="space-y-1.5 mb-4 border-t border-[#f5f2ec] pt-3">
                    {s.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-xs text-[#1a1a1a]"
                      >
                        <CheckIcon className="w-3.5 h-3.5 text-[#4a5c2d] shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => handleBookService(s.id)}
                  className="w-full py-3 bg-[#f5f2ec] text-[#1a1a1a] text-[11px] font-bold tracking-widest uppercase hover:bg-[#4a5c2d] hover:text-[#f5f2ec] transition-colors text-center block"
                >
                  BOOK {s.title} →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Multi-Pair Deals Showcase */}
      <section className="bg-[#1a1a1a] text-[#f5f2ec] py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#86a84e] mb-2">
              Clean More. Spend Less.
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-wide">
              MULTI-PAIR COMBO DEALS
            </h2>
            <p className="text-sm text-[#9ca3af] mt-2">
              Save big when you bring your shoes together. More pairs, better
              value.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {dealServices.map((deal) => (
              <div
                key={deal.id}
                className="bg-[#242424] border border-[#374151] p-6 sm:p-8 flex flex-col justify-between hover:border-[#86a84e] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] bg-[#86a84e] text-black font-extrabold uppercase px-2.5 py-0.5 tracking-wider">
                      {deal.badge}
                    </span>
                    <span className="text-xs text-[#9ca3af] font-mono">
                      {deal.turnaround}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl font-bold uppercase text-white mb-1">
                    {deal.title.replace("MULTI-PAIR: ", "")}
                  </h3>
                  <p className="text-xs text-[#86a84e] font-semibold mb-4 uppercase tracking-wider">
                    {deal.tagline}
                  </p>
                  <p className="font-display text-4xl font-extrabold text-white mb-4">
                    {deal.price}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {deal.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-xs text-[#d1d5db]"
                      >
                        <CheckIcon className="w-3.5 h-3.5 text-[#86a84e] shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => handleBookService(deal.id)}
                  className="w-full py-3 bg-[#4a5c2d] hover:bg-[#5a7038] text-white text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  BOOK {deal.title}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5-Step Process */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[#4a5c2d] mb-2">
            Trusted Care. Step by Step.
          </p>
          <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold uppercase text-[#1a1a1a]">
            OUR PROCESS
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            {
              step: "1. BOOK",
              desc: "Send us a photo of your pair and choose your service.",
            },
            {
              step: "2. DROP OFF",
              desc: "Bring your shoes to our Mauritius collection point.",
            },
            {
              step: "3. CLEAN",
              desc: "We carefully clean your pair according to its material and condition.",
            },
            {
              step: "4. QUALITY CHECK",
              desc: "We inspect the pair before returning it to you.",
            },
            {
              step: "5. COLLECT",
              desc: "Your freshly cleaned sneakers are ready to step out again.",
            },
          ].map((st, idx) => (
            <div
              key={st.step}
              className="p-6 bg-white border border-[#e5e1d8] flex flex-col justify-between hover:border-[#4a5c2d] transition-colors"
            >
              <div>
                <span className="font-display text-sm font-black text-[#4a5c2d] tracking-widest block mb-2">
                  {st.step}
                </span>
                <p className="text-xs text-[#6b7280] leading-relaxed">
                  {st.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose */}
      <section className="bg-[#1a1a1a] py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold uppercase text-[#f5f2ec] mb-4">
              WHY CHOOSE
              <br />
              ZIMTHREAD?
            </h2>
            <p className="text-[#9ca3af] text-base leading-relaxed mb-6">
              Mauritius dedicated shoe care and streetwear atelier. We treat
              every silhouette with precision active formulations and tailored
              craft.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/about"
                className="px-6 py-3 border border-[#f5f2ec] text-[#f5f2ec] text-[11px] font-bold tracking-widest uppercase hover:bg-[#f5f2ec] hover:text-[#1a1a1a] transition-colors inline-block"
              >
                OUR STORY & PHILOSOPHY
              </Link>
              <a
                href="https://wa.me/23055132614"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-[#86a84e] text-black text-[11px] font-bold tracking-widest uppercase hover:bg-[#9cc45e] transition-colors inline-block"
              >
                WHATSAPP CHAT
              </a>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {whyUs.map((w) => (
              <div
                key={w.title}
                className="border border-[#374151] bg-[#1f2937]/40 p-6 text-left hover:border-[#4a5c2d] transition-colors"
              >
                <div className="font-display text-sm font-bold tracking-widest uppercase text-[#86a84e] mb-2">
                  {w.title}
                </div>
                <div className="text-xs text-[#9ca3af] leading-relaxed">
                  {w.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 bg-[#4a5c2d] text-center px-4">
        <h2 className="font-display text-[clamp(2rem,5vw,4rem)] font-extrabold uppercase text-[#f5f2ec] mb-2">
          WE CLEAN. YOU SHINE.
        </h2>
        <p className="text-[#c5d4a8] mb-8 max-w-md mx-auto text-sm sm:text-base">
          Book your shoe cleaning service today or message us on WhatsApp for
          fast drop-off coordination.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/booking"
            className="px-8 py-4 bg-[#f5f2ec] text-[#1a1a1a] text-[11px] font-bold tracking-widest uppercase hover:bg-white transition-colors inline-block shadow-lg"
          >
            BOOK YOUR SERVICE NOW
          </Link>
          <a
            href="https://wa.me/23055132614"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-[#1a1a1a] text-white text-[11px] font-bold tracking-widest uppercase hover:bg-black transition-colors inline-block shadow-lg"
          >
            WHATSAPP: 55132614
          </a>
        </div>
      </section>
    </main>
  )
}
