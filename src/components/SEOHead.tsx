import { useEffect } from "react"

export interface SEOProps {
  title: string
  description: string
  canonicalUrl?: string
  ogImage?: string
  noindex?: boolean
}

export default function SEOHead({
  title,
  description,
  canonicalUrl = "https://zimthreads.online/",
  ogImage = "https://zimthreads.online/images/products/hoodie-front.png",
  noindex = false,
}: SEOProps) {
  useEffect(() => {
    // 1. Update Document Title
    document.title = title

    // 2. Helper to set or create meta tag
    const setMetaTag = (
      attr: "name" | "property",
      key: string,
      content: string,
    ) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
      if (!el) {
        el = document.createElement("meta")
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.setAttribute("content", content)
    }

    // 3. Update Standard Meta Description & Robots
    setMetaTag("name", "description", description)
    if (noindex) {
      setMetaTag("name", "robots", "noindex, nofollow")
    } else {
      setMetaTag(
        "name",
        "robots",
        "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
      )
    }

    // 4. Update Open Graph
    setMetaTag("property", "og:title", title)
    setMetaTag("property", "og:description", description)
    setMetaTag("property", "og:url", canonicalUrl)
    setMetaTag("property", "og:image", ogImage)

    // 5. Update Twitter
    setMetaTag("name", "twitter:title", title)
    setMetaTag("name", "twitter:description", description)
    setMetaTag("name", "twitter:image", ogImage)

    // 6. Update Canonical Link
    let canonical = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    )
    if (!canonical) {
      canonical = document.createElement("link")
      canonical.setAttribute("rel", "canonical")
      document.head.appendChild(canonical)
    }
    canonical.setAttribute("href", canonicalUrl)
  }, [title, description, canonicalUrl, ogImage, noindex])

  return null
}
