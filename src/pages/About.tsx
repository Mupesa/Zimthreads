import { Link } from "@/router"
import { LockIcon, SparklesIcon, CheckIcon } from "@/components/Icons"

interface TeamMember {
  name: string
  role: string
  img?: string
  alt: string
  isFounder?: boolean
  isSuspense?: boolean
  suspenseTeaser?: string
  tagline?: string
}

const team: TeamMember[] = [
  {
    name: "Shepherd Chara",
    role: "Founder & Head Cleaner",
    img: "https://res.cloudinary.com/pwranjbq/image/upload/c_fill,g_face,w_800,h_800,f_auto,q_auto/v1788984689/zimthreads/team/p5ppnv5cr9epaxjzikpj.jpg",
    alt: "Shepherd Chara - Founder & Head Cleaner of Zimthreads Collective",
    isFounder: true,
    tagline: "Master Craftsman & Sneaker Restoration Lead",
  },
  {
    name: "Davis",
    role: "Custom Apparel Lead",
    alt: "Davis - Custom Apparel Lead",
    isSuspense: true,
    suspenseTeaser:
      "Portrait in darkroom production. Official reveal arriving soon.",
    tagline: "Bespoke Cut & Sew & Streetwear Design",
  },
  {
    name: "Anesu",
    role: "Personalization Artist",
    alt: "Anesu - Personalization Artist",
    isSuspense: true,
    suspenseTeaser:
      "Studio session scheduled. Craft portfolio & portrait dropping soon.",
    tagline: "Hand-Painted Finishes & Patina Artistry",
  },
]

const stats = [
  { value: "2,000+", label: "Pairs Cleaned" },
  { value: "340+", label: "Active Clients" },
  { value: "4.9 / 5", label: "Client Rating" },
  { value: "3+", label: "Years of Craft" },
]

export default function About() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-[#1a1a1a] py-24 px-4 sm:px-6 text-center">
        <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[#4a5c2d] mb-4">
          Our Story
        </p>
        <h1 className="font-display text-[clamp(2.5rem,7vw,6rem)] font-extrabold uppercase text-[#f5f2ec] leading-none mb-6">
          MORE THAN
          <br />A BRAND.
        </h1>
        <p className="text-[#9ca3af] max-w-xl mx-auto text-base leading-relaxed">
          Zimthread Collective was born from a simple belief: every pair of
          shoes has a story worth preserving. We're the community that keeps
          those stories going.
        </p>
      </section>

      {/* Stats */}
      <section className="bg-[#4a5c2d] py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-display text-4xl font-extrabold text-[#f5f2ec]">
                {s.value}
              </div>
              <div className="text-[10px] font-bold tracking-widest uppercase text-[#c5d4a8] mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <img
            src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=450&fit=crop&auto=format"
            alt="Zimthread workshop"
            className="w-full object-cover"
          />
        </div>
        <div>
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold uppercase text-[#1a1a1a] mb-5">
            WHY WE STARTED
          </h2>
          <p className="text-[#6b7280] text-base leading-relaxed mb-4">
            It started with a single pair of sneakers and a determination to
            restore them to factory condition. Zimthread Collective was built
            around a dedicated community that values craft, longevity, and
            streetwear culture.
          </p>
          <p className="text-[#6b7280] text-base leading-relaxed mb-6">
            What began with shoe cleaning has expanded into specialized
            multi-pair rotations, restorations, and tailored custom apparel.
            Today, Zimthread is trusted by students, creatives, athletes, and
            sneaker lovers across Mauritius.
          </p>
          <Link
            to="/booking"
            className="inline-block px-6 py-3 bg-[#4a5c2d] text-[#f5f2ec] text-[11px] font-bold tracking-widest uppercase hover:bg-[#5a7038] transition-colors"
          >
            BOOK A SESSION
          </Link>
        </div>
      </section>

      {/* Team */}
      <section className="bg-[#f5f2ec] border-t border-[#e5e1d8] py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#4a5c2d] block mb-2">
              Craft, Community & Artistry
            </span>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold uppercase text-[#1a1a1a] mb-3">
              MEET THE TEAM
            </h2>
            <p className="text-xs text-[#6b7280] leading-relaxed">
              The sneaker restoration craftsmen and custom apparel designers
              dedicated to elevating footwear culture in Mauritius.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {team.map((m) => (
              <div
                key={m.name}
                className="group bg-white/70 backdrop-blur-xs border border-[#e5e1d8] p-6 sm:p-8 text-center transition-all duration-300 hover:border-[#4a5c2d]/50 hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  {m.isFounder ? (
                    /* Founder Verified Portrait */
                    <div className="relative w-40 h-40 sm:w-44 sm:h-44 mx-auto mb-6 rounded-full p-1 bg-gradient-to-tr from-[#4a5c2d] via-[#86a84e] to-[#4a5c2d] shadow-lg group-hover:scale-[1.03] transition-transform duration-300">
                      <div className="w-full h-full rounded-full overflow-hidden bg-white shadow-inner">
                        <img
                          src={m.img}
                          alt={m.alt}
                          className="w-full h-full object-cover object-[center_18%] transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#4a5c2d] text-[#f5f2ec] text-[9px] font-extrabold uppercase px-3 py-0.5 tracking-widest whitespace-nowrap shadow-xs border border-[#86a84e] flex items-center gap-1">
                        <SparklesIcon className="w-2.5 h-2.5 text-[#c5d4a8]" />
                        <span>FOUNDER</span>
                      </span>
                    </div>
                  ) : (
                    /* Suspense Team Portrait */
                    <div className="relative w-40 h-40 sm:w-44 sm:h-44 mx-auto mb-6 rounded-full p-1 bg-gradient-to-tr from-[#2a2a2a] via-[#374151] to-[#1f2937] shadow-lg group-hover:scale-[1.03] transition-transform duration-300">
                      <div className="w-full h-full rounded-full overflow-hidden bg-[#111827] flex flex-col items-center justify-center relative border border-[#374151]">
                        {/* Ambient scanline glow */}
                        <div className="absolute inset-0 bg-radial from-[#4a5c2d]/20 to-transparent animate-pulse" />
                        <div className="w-12 h-12 rounded-full bg-[#1f2937] border border-[#374151] flex items-center justify-center text-[#86a84e] mb-1.5 shadow-inner z-10">
                          <LockIcon className="w-5 h-5 text-[#86a84e]" />
                        </div>
                        <span className="text-[9px] font-mono tracking-widest text-[#9ca3af] uppercase z-10">
                          PORTRAIT LOCKED
                        </span>
                      </div>
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#1f2937] text-[#c5d4a8] text-[9px] font-extrabold uppercase px-3 py-0.5 tracking-widest whitespace-nowrap shadow-xs border border-[#374151] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        <span>REVEALING SOON</span>
                      </span>
                    </div>
                  )}

                  <h3 className="font-display text-xl font-bold uppercase text-[#1a1a1a] flex items-center justify-center gap-1.5">
                    <span>{m.name}</span>
                    {m.isFounder && (
                      <span
                        title="Verified Founder"
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#4a5c2d] text-white text-[9px]"
                      >
                        ✓
                      </span>
                    )}
                  </h3>

                  <p className="text-xs font-bold uppercase tracking-wider text-[#4a5c2d] mt-1">
                    {m.role}
                  </p>

                  {m.tagline && (
                    <p className="text-[11px] text-[#6b7280] font-medium mt-1">
                      {m.tagline}
                    </p>
                  )}
                </div>

                {m.isSuspense && m.suspenseTeaser && (
                  <div className="mt-5 pt-3 border-t border-dashed border-[#e5e1d8]">
                    <div className="px-3 py-2 bg-[#f5f2ec] border border-[#e5e1d8] rounded-xs">
                      <p className="text-[10px] text-[#6b7280] italic leading-tight">
                        "{m.suspenseTeaser}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
