import { useState } from "react"
import { useStore } from "@/store/StoreContext"
import { BlogPost } from "@/store/seedData"
import ArticleModal from "@/components/ArticleModal"

const categories = [
  "All",
  "Shoe Care",
  "Products",
  "Apparel",
  "Services",
  "Personalization",
]

export default function Blog() {
  const { blogPosts } = useStore()
  const [active, setActive] = useState("All")
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)

  const filtered =
    active === "All"
      ? blogPosts
      : blogPosts.filter((p) => p.category === active)
  const [featured, ...rest] = filtered

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[#4a5c2d] mb-2">
            Knowledge & Culture
          </p>
          <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-extrabold uppercase text-[#1a1a1a]">
            ZIMTHREAD JOURNAL
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase border transition-colors ${
                active === c
                  ? "bg-[#1a1a1a] text-[#f5f2ec] border-[#1a1a1a]"
                  : "border-[#e5e1d8] text-[#6b7280] hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {featured && (
        <div
          onClick={() => setSelectedPost(featured)}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10 border border-[#e5e1d8] bg-white overflow-hidden group hover:border-[#4a5c2d] transition-colors cursor-pointer"
        >
          <div className="h-64 lg:h-auto overflow-hidden bg-[#e5e1d8]">
            <img
              src={featured.img}
              alt={featured.alt}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="p-8 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#4a5c2d]">
                {featured.category}
              </span>
              <span className="text-[#e5e1d8]">·</span>
              <span className="text-[10px] text-[#6b7280]">
                {featured.readTime}
              </span>
              <span className="text-[#e5e1d8]">·</span>
              <span className="text-[10px] text-[#6b7280]">
                By {featured.author}
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-[#1a1a1a] mb-3 group-hover:text-[#4a5c2d] transition-colors">
              {featured.title}
            </h2>
            <p className="text-sm text-[#6b7280] leading-relaxed mb-5">
              {featured.excerpt}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9ca3af]">{featured.date}</span>
              <span className="text-[11px] font-bold tracking-widest uppercase text-[#4a5c2d] group-hover:underline">
                Read Full Story →
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rest.map((p) => (
          <div
            key={p.id}
            onClick={() => setSelectedPost(p)}
            className="border border-[#e5e1d8] bg-white overflow-hidden group hover:border-[#4a5c2d] transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="h-48 overflow-hidden bg-[#e5e1d8]">
                <img
                  src={p.img}
                  alt={p.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[#4a5c2d]">
                    {p.category}
                  </span>
                  <span className="text-[10px] text-[#9ca3af]">
                    {p.readTime}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold uppercase text-[#1a1a1a] mb-2 leading-tight group-hover:text-[#4a5c2d] transition-colors">
                  {p.title}
                </h3>
                <p className="text-xs text-[#6b7280] leading-relaxed line-clamp-3 mb-4">
                  {p.excerpt}
                </p>
              </div>
            </div>

            <div className="p-5 pt-0">
              <div className="flex items-center justify-between pt-3 border-t border-[#f5f2ec]">
                <span className="text-xs text-[#9ca3af]">{p.date}</span>
                <span className="text-[11px] font-bold tracking-widest uppercase text-[#4a5c2d] group-hover:underline">
                  Read More →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Article Reader Modal */}
      <ArticleModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </main>
  )
}
