import { Link, useRouter } from "@/router"
import { useStore } from "@/store/StoreContext"
import {
  ShieldCheckIcon,
  LeafIcon,
  LightningIcon,
  SparklesIcon,
} from "@/components/Icons"

const categories = [
  "SNEAKERS",
  "SPORTS FOOTWEAR",
  "FORMAL & LEATHER",
  "BOOTS & HIKING",
  "CANVAS & SUEDE",
  "CUSTOM APPAREL",
]

const badges = [
  { icon: ShieldCheckIcon, label: "MASTER CRAFT GUARANTEE" },
  { icon: LeafIcon, label: "ECO-FRIENDLY ACTIVE CHEMISTRY" },
  { icon: SparklesIcon, label: "HARARE FLAGSHIP STUDIO" },
  { icon: LightningIcon, label: "24–48H EXPEDITE AVAILABLE" },
]

const whyUs = [
  {
    title: "LABORATORY CARE",
    desc: "Formulated specifically for delicate suede nap, flyknit mesh, and full-grain leathers without harsh bleaching.",
  },
  {
    title: "PROPRIETARY BOTANICAL FOAMS",
    desc: "Non-toxic biodegradable enzymes that break down dirt and protect the factory midsole seal.",
  },
  {
    title: "PRECISION RESTORATION",
    desc: "Factory sole re-bonding, crease reduction, custom paint matching, and UV anti-yellowing seals.",
  },
  {
    title: "STREETWEAR ATELIER",
    desc: "Heavyweight 400+ GSM apparel, high-density embroidery, and bespoke monogramming.",
  },
]

export default function Home() {
  const { services, setPrefilledServiceId } = useStore()
  const { navigate } = useRouter()

  const handleBookService = (serviceId: string) => {
    setPrefilledServiceId(serviceId)
    navigate("/booking")
  }

  const featuredServices = services.slice(0, 3)

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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center py-16 sm:py-20">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[#4a5c2d] mb-4">
              Restoration · Care · Streetwear
            </p>
            <h1 className="font-display text-[clamp(3.2rem,8vw,6.5rem)] font-extrabold uppercase leading-none text-[#1a1a1a] mb-5">
              MORE THAN
              <br />
              CLEAN.
              <br />
              <span className="text-[#4a5c2d]">IT'S CARE.</span>
            </h1>
            <p className="text-[#6b7280] text-sm sm:text-base max-w-md mb-8 leading-relaxed">
              Harare's dedicated sneaker restoration lab, specialized shoe care
              formulations, and bespoke streetwear collective.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/booking"
                className="px-7 py-3.5 bg-[#4a5c2d] text-[#f5f2ec] text-[11px] font-bold tracking-widest uppercase hover:bg-[#5a7038] transition-colors shadow-sm"
              >
                BOOK A CLEAN
              </Link>
              <Link
                to="/shop"
                className="px-7 py-3.5 border-2 border-[#1a1a1a] text-[#1a1a1a] text-[11px] font-bold tracking-widest uppercase hover:bg-[#1a1a1a] hover:text-[#f5f2ec] transition-colors"
              >
                SHOP STORE
              </Link>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=500&fit=crop&auto=format"
                alt="Premium white sneakers"
                className="w-full max-w-md object-contain drop-shadow-2xl"
              />
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-24 h-24 rounded-full border-2 border-[#1a1a1a] flex items-center justify-center bg-[#f5f2ec] shadow-md">
                <div className="text-center">
                  <div className="text-[9px] font-extrabold uppercase tracking-widest leading-tight text-[#1a1a1a]">
                    SAME
                    <br />
                    SHOES
                    <br />
                    NEW
                    <br />
                    JOURNEY
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xs border-t border-[#e5e1d8]">
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
              className="text-[#9ca3af] hover:text-[#4a5c2d] transition-colors whitespace-nowrap text-[11px] font-semibold tracking-widest uppercase"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[#4a5c2d] mb-2">
            Signature Treatments
          </p>
          <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold uppercase text-[#1a1a1a]">
            OUR SERVICES
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredServices.map((s) => (
            <div
              key={s.id}
              className="border border-[#e5e1d8] bg-white group hover:border-[#4a5c2d] transition-colors overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="h-48 overflow-hidden bg-[#e5e1d8]">
                  <img
                    src={s.img}
                    alt={s.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-display text-xl font-bold uppercase tracking-wide text-[#1a1a1a]">
                      {s.title}
                    </h3>
                    <span className="font-display text-lg font-bold text-[#4a5c2d]">
                      {s.price}
                    </span>
                  </div>
                  <div className="w-8 h-0.5 bg-[#4a5c2d] mb-3" />
                  <p className="text-sm text-[#6b7280] leading-relaxed mb-4">
                    {s.desc}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => handleBookService(s.id)}
                  className="w-full py-3 bg-[#f5f2ec] text-[#1a1a1a] text-[11px] font-bold tracking-widest uppercase hover:bg-[#4a5c2d] hover:text-[#f5f2ec] transition-colors text-center block"
                >
                  BOOK THIS SERVICE →
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/services"
            className="px-8 py-3.5 border-2 border-[#1a1a1a] text-[#1a1a1a] text-[11px] font-bold tracking-widest uppercase hover:bg-[#1a1a1a] hover:text-[#f5f2ec] transition-colors inline-block"
          >
            VIEW ALL SERVICES
          </Link>
        </div>
      </section>

      {/* Why Choose */}
      <section className="bg-[#1a1a1a] py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold uppercase text-[#f5f2ec] mb-4">
              WHY CHOOSE
              <br />
              ZIMTHREAD COLLECTIVE?
            </h2>
            <p className="text-[#9ca3af] text-base leading-relaxed mb-6">
              We understand the heritage behind every silhouette. Using
              non-abrasive active foams and tailored techniques, we protect and
              extend the lifecycle of your sneakers and garments.
            </p>
            <Link
              to="/about"
              className="px-6 py-3 border border-[#f5f2ec] text-[#f5f2ec] text-[11px] font-bold tracking-widest uppercase hover:bg-[#f5f2ec] hover:text-[#1a1a1a] transition-colors inline-block"
            >
              OUR STORY & PHILOSOPHY
            </Link>
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
        <h2 className="font-display text-[clamp(2rem,5vw,4rem)] font-extrabold uppercase text-[#f5f2ec] mb-4">
          READY TO RESTORE YOUR KICKS?
        </h2>
        <p className="text-[#c5d4a8] mb-8 max-w-md mx-auto text-sm sm:text-base">
          Book your cleaning session in minutes. Pick your treatment, choose a
          convenient slot, and our team will handle the rest.
        </p>
        <Link
          to="/booking"
          className="px-8 py-4 bg-[#f5f2ec] text-[#1a1a1a] text-[11px] font-bold tracking-widest uppercase hover:bg-white transition-colors inline-block shadow-lg"
        >
          BOOK YOUR CLEAN NOW
        </Link>
      </section>
    </main>
  )
}
