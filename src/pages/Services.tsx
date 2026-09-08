import { Link, useRouter } from "@/router"
import { useStore } from "@/store/StoreContext"
import { ClockIcon, CheckIcon } from "@/components/Icons"

export default function Services() {
  const { services, setPrefilledServiceId } = useStore()
  const { navigate } = useRouter()

  const handleBookService = (serviceId: string) => {
    setPrefilledServiceId(serviceId)
    navigate("/booking")
  }

  const activeServices = services.filter((s) => s.active !== false)

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-14 text-center">
        <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[#4a5c2d] mb-3">
          What We Offer
        </p>
        <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-extrabold uppercase text-[#1a1a1a]">
          OUR SERVICES
        </h1>
        <p className="text-[#6b7280] text-sm max-w-lg mx-auto mt-2">
          From quick sneaker touch-ups and deep stain removals to complete
          restorations and custom embroidery.
        </p>
      </div>

      <div className="space-y-12">
        {activeServices.map((s, i) => (
          <div
            key={s.id}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white border border-[#e5e1d8] p-6 sm:p-8 hover:border-[#4a5c2d] transition-colors ${
              i % 2 === 1 ? "lg:flex-row-reverse" : ""
            }`}
          >
            <div
              className={`overflow-hidden bg-[#e5e1d8] h-72 ${
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
              <div className="flex items-center gap-3 mb-2">
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
              <p className="font-display text-2xl font-bold text-[#4a5c2d] mb-4">
                {s.price}
              </p>
              <p className="text-[#6b7280] text-sm leading-relaxed mb-5">
                {s.desc}
              </p>
              <ul className="space-y-2 mb-6">
                {s.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm text-[#1a1a1a]"
                  >
                    <CheckIcon className="w-4 h-4 text-[#4a5c2d] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleBookService(s.id)}
                className="inline-block px-6 py-3 bg-[#4a5c2d] text-[#f5f2ec] text-[11px] font-bold tracking-widest uppercase hover:bg-[#5a7038] transition-colors"
              >
                BOOK THIS SERVICE
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
