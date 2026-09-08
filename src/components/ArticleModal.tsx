import React from "react"
import { BlogPost } from "@/store/seedData"
import { CloseIcon } from "@/components/Icons"

interface ArticleModalProps {
  post: BlogPost | null
  onClose: () => void
}

export default function ArticleModal({ post, onClose }: ArticleModalProps) {
  if (!post) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative bg-[#f5f2ec] border border-[#e5e1d8] w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl z-10 p-5 sm:p-10 animate-scale-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-[#e5e1d8] flex items-center justify-center text-[#1a1a1a] hover:bg-black hover:text-white transition-colors"
          aria-label="Close article"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#4a5c2d] bg-[#4a5c2d]/10 px-2.5 py-1">
            {post.category}
          </span>
          <span className="text-xs text-[#6b7280]">·</span>
          <span className="text-xs text-[#6b7280]">{post.readTime}</span>
          <span className="text-xs text-[#6b7280]">·</span>
          <span className="text-xs text-[#6b7280]">{post.date}</span>
        </div>

        <h1 className="font-display text-2xl sm:text-4xl font-extrabold uppercase text-[#1a1a1a] mb-4 leading-tight">
          {post.title}
        </h1>

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#e5e1d8]">
          <div className="w-8 h-8 rounded-full bg-[#4a5c2d] text-white flex items-center justify-center font-bold text-xs">
            {post.author[0]}
          </div>
          <div>
            <p className="text-xs font-bold text-[#1a1a1a]">
              Written by {post.author}
            </p>
            <p className="text-[10px] text-[#6b7280]">
              Zimthread Collective Studio
            </p>
          </div>
        </div>

        <div className="mb-6 h-56 sm:h-80 overflow-hidden bg-white border border-[#e5e1d8]">
          <img
            src={post.img}
            alt={post.alt}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="prose prose-sm max-w-none text-[#1a1a1a] space-y-4 leading-relaxed font-normal whitespace-pre-line text-sm">
          {post.content}
        </div>

        <div className="mt-8 pt-6 border-t border-[#e5e1d8] flex justify-end items-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#4a5c2d] text-[#f5f2ec] text-[11px] font-bold tracking-widest uppercase hover:bg-[#5a7038] transition-colors"
          >
            CLOSE ARTICLE
          </button>
        </div>
      </div>
    </div>
  )
}
