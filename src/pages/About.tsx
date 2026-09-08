import { Link } from "@/router"

const team = [
  {
    name: "Tinashe Moyo",
    role: "Founder & Head Cleaner",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&auto=format",
    alt: "Tinashe Moyo founder",
  },
  {
    name: "Rutendo Chikwanda",
    role: "Custom Apparel Lead",
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&auto=format",
    alt: "Rutendo Chikwanda",
  },
  {
    name: "Brandon Mutasa",
    role: "Personalization Artist",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&auto=format",
    alt: "Brandon Mutasa",
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
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold uppercase text-[#1a1a1a] mb-12 text-center">
            MEET THE TEAM
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {team.map((m) => (
              <div key={m.name} className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 overflow-hidden rounded-full bg-[#e5e1d8]">
                  <img
                    src={m.img}
                    alt={m.alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-display text-xl font-bold uppercase text-[#1a1a1a]">
                  {m.name}
                </h3>
                <p className="text-sm text-[#6b7280] mt-1">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
