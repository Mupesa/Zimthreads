import { Link, useRouter } from "@/router"
import { useStore } from "@/store/StoreContext"
import {
  ClockIcon,
  CheckIcon,
  ShieldCheckIcon,
  BagIcon,
  ArrowRightIcon,
} from "@/components/Icons"

export default function Services() {
  const { services, setPrefilledServiceId } = useStore()
  const { navigate } = useRouter()

  const handleBookService = (serviceId: string) => {
    setPrefilledServiceId(serviceId)
    navigate("/booking")
  }

  const activeServices = services.filter((s) => s.active !== false)
  const coreServices = activeServices.filter((s) => !s.id.startsWith("deal-"))
  const dealServices = activeServices.filter((s) => s.id.startsWith("deal-"))

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-14 text-center">
        <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[#4a5c2d] mb-3">
          Professional Shoe Care & Atelier
        </p>
        <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-extrabold uppercase text-[#1a1a1a] leading-none">
          SHOE CLEANING SERVICES
        </h1>
        <p className="text-[#6b7280] text-sm max-w-xl mx-auto mt-3">
          Cleaner shoes. A stronger you. From quick touch-ups to intensive stain
          treatment and full shoe restorations across Mauritius.
        </p>
      </div>

      {/* Primary Service Tiers */}
      <div className="space-y-12 mb-20">
        {coreServices.map((s, i) => (
          <div
            key={s.id}
            className={`relative grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center bg-white border ${
              s.badge ? "border-[#4a5c2d] shadow-sm" : "border-[#e5e1d8]"
            } p-4 sm:p-8 hover:border-[#4a5c2d] transition-colors`}
          >
            {s.badge && (
              <div className="absolute -top-3 right-4 sm:right-6 bg-[#4a5c2d] text-white text-[9px] sm:text-[10px] font-extrabold tracking-widest uppercase px-2.5 sm:px-3 py-1 shadow-xs">
                ★ {s.badge}
              </div>
            )}
            <div
              className={`overflow-hidden bg-[#e5e1d8] h-52 sm:h-72 ${
                i % 2 === 1 ? "lg:order-2" : ""
              }`}
            >
              <img
                src={s.img}
                alt={s.alt}
                className="w-full h-full object-cover"
              />
            </div>
            <div className={i % 2 === 1 ? "lg:order-1" : ""}>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-[#4a5c2d]">
                  {s.subtitle}
                </span>
                {s.turnaround && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-[#f5f2ec] text-[#6b7280] px-2 py-0.5 font-bold uppercase tracking-wider">
                    <ClockIcon className="w-3 h-3 text-[#4a5c2d]" />
                    {s.turnaround}
                  </span>
                )}
              </div>
              <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold uppercase text-[#1a1a1a] mb-1">
                {s.title}
              </h2>
              <p className="font-display text-2xl font-bold text-[#4a5c2d] mb-2">
                {s.price}
              </p>
              {s.tagline && (
                <p className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a] mb-5">
                  "{s.tagline}"
                </p>
              )}
              <button
                onClick={() => handleBookService(s.id)}
                className="w-full sm:w-auto text-center px-6 py-3.5 sm:py-3 bg-[#4a5c2d] text-[#f5f2ec] text-[11px] font-bold tracking-widest uppercase hover:bg-[#5a7038] transition-colors shadow-xs"
              >
                BOOK THIS SERVICE
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Multi-Pair Deals Banner */}
      <section className="bg-[#1a1a1a] text-[#f5f2ec] p-8 sm:p-12 mb-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#86a84e] mb-2">
            Clean More. Spend Less.
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-wide">
            MULTI-PAIR COMBO DEALS
          </h2>
          <p className="text-sm text-[#9ca3af] mt-2">
            Bring multiple pairs together and unlock maximum savings for your
            rotation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {dealServices.map((deal) => (
            <div
              key={deal.id}
              className="bg-[#242424] border border-[#374151] p-6 sm:p-8 flex flex-col justify-between hover:border-[#86a84e] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] bg-[#86a84e] text-black font-extrabold uppercase px-2.5 py-0.5 tracking-wider">
                    {deal.badge || "COMBO DEAL"}
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
                <div className="mb-6">
                  <span className="font-display text-4xl font-extrabold text-white">
                    {deal.price}
                  </span>
                </div>
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
      </section>

      {/* 5-Step Process Section */}
      <section className="bg-white border border-[#e5e1d8] p-8 sm:p-12 mb-16">
        <div className="text-center mb-10">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#4a5c2d] mb-2">
            Trusted Care. Step by Step.
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-[#1a1a1a]">
            OUR 5-STEP PROCESS
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            {
              step: "01",
              title: "BOOK",
              desc: "Send us a photo of your pair via WhatsApp or form and choose your service.",
            },
            {
              step: "02",
              title: "DROP OFF",
              desc: "Bring your shoes to our Mauritius collection point.",
            },
            {
              step: "03",
              title: "CLEAN",
              desc: "We carefully clean your pair according to its material and condition.",
            },
            {
              step: "04",
              title: "QUALITY CHECK",
              desc: "We thoroughly inspect the pair before returning it to you.",
            },
            {
              step: "05",
              title: "COLLECT",
              desc: "Your freshly cleaned sneakers are ready to step out again.",
            },
          ].map((st) => (
            <div
              key={st.step}
              className="p-5 bg-[#f5f2ec] border border-[#e5e1d8] flex flex-col justify-between"
            >
              <div>
                <span className="font-display text-2xl font-black text-[#4a5c2d]">
                  {st.step}
                </span>
                <h3 className="font-display text-lg font-bold uppercase text-[#1a1a1a] mt-2 mb-2">
                  {st.title}
                </h3>
                <p className="text-xs text-[#6b7280] leading-relaxed">
                  {st.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href="https://wa.me/23055132614"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1a1a1a] text-[#f5f2ec] hover:bg-[#4a5c2d] text-xs font-bold tracking-widest uppercase transition-colors"
          >
            CHAT ON WHATSAPP (+230 55132614)
            <ArrowRightIcon className="w-4 h-4" />
          </a>
        </div>
      </section>
    </main>
  )
}
