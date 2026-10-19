import { Link, useRouter } from "@/router"
import { useStore } from "@/store/StoreContext"
import {
  CheckIcon,
  ClockIcon,
  ArrowRightIcon,
  WhatsAppIcon,
} from "@/components/Icons"
import EditorialHero from "@/components/EditorialHero"
import CollectionRail from "@/components/CollectionRail"
import FeaturedProductSpotlight from "@/components/FeaturedProductSpotlight"

const categories = [
  "ZIMBABWE '02' PRE-ORDER",
  "PADDOCK RACING JACKETS",
  "BEADED HERITAGE BRACELETS",
  "STANDARD CLEAN · RS 300",
  "DEEP CLEAN · RS 400",
  "RESTORE · RS 600+",
  "2 PAIRS COMBO · RS 500",
  "3 PAIRS COMBO · RS 800",
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
      {/* 1. Full-Bleed Dual-Identity Editorial Hero */}
      <EditorialHero
        onScrollToRail={() => {
          document
            .getElementById("collection-rail-section")
            ?.scrollIntoView({ behavior: "smooth" })
        }}
        onScrollToServices={() => {
          document
            .getElementById("core-services-section")
            ?.scrollIntoView({ behavior: "smooth" })
        }}
      />

      {/* 2. Minimalist Brand Ticker */}
      <section className="bg-[#121513] border-b border-[#242b25] py-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-6 sm:gap-8 px-4 sm:px-6 min-w-max mx-auto justify-start sm:justify-center">
          {categories.map((c) => (
            <Link
              key={c}
              to={
                c.includes("CLEAN") ||
                c.includes("RESTORE") ||
                c.includes("COMBO")
                  ? "/services"
                  : "/shop"
              }
              className="text-[#9ca3af] hover:text-[#86a84e] transition-colors whitespace-nowrap text-[10px] sm:text-[11px] font-mono tracking-widest uppercase flex items-center gap-2"
            >
              <span className="text-[#86a84e]">/</span>
              <span>{c}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. The Right-Side Scrollable Collection Rail */}
      <CollectionRail
        onSelectSpotlight={() => {
          document
            .getElementById("featured-product-spotlight")
            ?.scrollIntoView({ behavior: "smooth" })
        }}
        onSelectServices={() => {
          document
            .getElementById("core-services-section")
            ?.scrollIntoView({ behavior: "smooth" })
        }}
      />

      {/* 4. The In-Page Featured Product Spotlight ("That Card Below That") */}
      <FeaturedProductSpotlight />

      {/* 5. Core Shoe Restoration Treatments Section */}
      <section
        id="core-services-section"
        className="py-20 max-w-7xl mx-auto px-4 sm:px-6"
      >
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
                <div className="p-5 sm:p-6">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-[#1a1a1a]">
                      {s.title}
                    </h3>
                    <span className="font-display text-2xl font-extrabold text-[#4a5c2d]">
                      {s.price}
                    </span>
                  </div>
                  {s.tagline && (
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#4a5c2d] mb-4">
                      "{s.tagline}"
                    </p>
                  )}
                  <button
                    onClick={() => handleBookService(s.id)}
                    className="w-full py-3 bg-[#f5f2ec] text-[#1a1a1a] text-[11px] font-bold tracking-widest uppercase hover:bg-[#4a5c2d] hover:text-[#f5f2ec] transition-colors text-center block mt-2"
                  >
                    BOOK {s.title} →
                  </button>
                </div>
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
                  <p className="text-xs text-[#86a84e] font-semibold mb-3 uppercase tracking-wider">
                    {deal.tagline}
                  </p>
                  <p className="font-display text-4xl font-extrabold text-white mb-6">
                    {deal.price}
                  </p>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
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
          ].map((st) => (
            <div
              key={st.step}
              className="p-4 sm:p-6 bg-white border border-[#e5e1d8] flex flex-col justify-between hover:border-[#4a5c2d] transition-colors"
            >
              <div>
                <span className="font-display text-sm font-black text-[#4a5c2d] tracking-widest block mb-1.5">
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
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/about"
                className="inline-flex items-center justify-center px-4 py-2.5 border border-[#f5f2ec]/60 text-[#f5f2ec] text-xs font-bold tracking-wider uppercase hover:bg-[#f5f2ec] hover:text-[#1a1a1a] active:scale-[0.98] transition-all"
              >
                OUR STORY
              </Link>
              <a
                href="https://wa.me/23055132614"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#86a84e] text-black text-xs font-bold tracking-wider uppercase hover:bg-[#9cc45e] active:scale-[0.98] transition-all shadow-sm"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-[#1a1a1a]" />
                <span>WHATSAPP</span>
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
        <div className="flex flex-wrap justify-center items-center gap-3">
          <Link
            to="/booking"
            className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#f5f2ec] text-[#1a1a1a] text-xs font-bold tracking-wider uppercase hover:bg-white active:scale-[0.98] transition-all shadow-md"
          >
            <span>BOOK A SERVICE</span>
            <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="https://wa.me/23055132614"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a1a1a] text-white text-xs font-bold tracking-wider uppercase hover:bg-black active:scale-[0.98] transition-all shadow-md"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>WHATSAPP</span>
          </a>
        </div>
      </section>
    </main>
  )
}
