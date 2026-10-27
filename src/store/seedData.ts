export interface ProductView {
  label: string
  url: string
}

export interface PriceOption {
  id?: string
  label?: string
  price: number
  active: boolean
}

export interface Product {
  id: string
  name: string
  category: "Cleaning" | "Apparel" | "Accessories"
  price: number
  priceOptions?: PriceOption[]
  stock: number
  img: string
  images?: string[]
  views?: ProductView[]
  alt: string
  description: string
  sizes?: string[]
  featured?: boolean
  isPreorder?: boolean
  preorderDeadline?: string
  isPresale?: boolean
  tag?: string
  badge?: string
  allowCustomName?: boolean
  customNamePrice?: number
  collectionId?: string
  collectionName?: string
  hidden?: boolean
}

export interface CollectiveCollection {
  id: string
  name: string
  slug: string
  tagline: string
  category: "Cleaning" | "Apparel" | "Accessories"
  description: string
  heroImage: string
  previewImages: string[]
  productIds: string[]
  itemCount: number
  priceRange: { min: number max: number }
  badge: string
}

export interface Service {
  id: string
  title: string
  subtitle: string
  price: string
  priceNumeric: number
  desc: string
  features: string[]
  turnaround: string
  img: string
  alt: string
  active: boolean
  badge?: string
  tagline?: string
}

export interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  category: string
  date: string
  img: string
  alt: string
  readTime: string
  author: string
}

export interface BookingItem {
  id: string
  customer: string
  email: string
  phone: string
  serviceId: string
  serviceName: string
  price: string
  priceNumeric: number
  date: string
  time: string
  notes?: string
  status: "Pending" | "Confirmed" | "In Progress" | "Completed" | "Cancelled"
  createdAt: string
}

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  size?: string
  img: string
  customName?: string
  priceOptionLabel?: string
}

export interface OrderItem {
  id: string
  customer: string
  email: string
  phone: string
  address: string
  city: string
  items: CartItem[]
  itemSummary: string
  totalAmount: number
  paymentMethod: "Juice by MCB" | "Bank Transfer" | "Card / Online" | "Cash on Drop-off" | "EcoCash" | "ZIPIT" | "Swipe / Card" | "Cash on Delivery"
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled"
  date: string
  createdAt: string
}

export interface Inquiry {
  id: string
  name: string
  email: string
  subject: string
  message: string
  date: string
  read: boolean
}

export interface FeaturedDropBanner {
  enabled: boolean
  badge: string
  title: string
  subtitle: string
  description: string
  imageUrl: string
  productId?: string
  priceText?: string
  ctaText?: string
  secondaryCtaText?: string
  tag?: string
}

export interface StoreSettings {
  storeName: string
  tagline: string
  email: string
  phone: string
  location: string
  hours: string
  currency: string
  deliveryFee: number
  freeDeliveryThreshold: number
  featuredDrop?: FeaturedDropBanner
}

export const initialServices: Service[] = [
  {
    id: "clean",
    title: "CLEAN",
    subtitle: "Standard Cleaning",
    tagline: "Clean look. Fresh steps.",
    price: "Rs 300",
    priceNumeric: 300,
    desc: "Standard exterior cleaning to remove surface dirt and light stains, bringing everyday sneakers back to fresh.",
    features: [
      "Exterior cleaning",
      "Remove dirt & light stains",
      "Sole cleaning",
      "Laces cleaned",
      "Basic finishing",
    ],
    turnaround: "24-48 Hours",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=350&fit=crop&auto=format",
    alt: "Clean white sneakers",
    active: true,
  },
  {
    id: "deep",
    title: "DEEP CLEAN",
    subtitle: "Premium Deep Cleaning",
    tagline: "A deeper clean. A fresher feel.",
    badge: "MOST POPULAR",
    price: "Rs 400",
    priceNumeric: 400,
    desc: "Our most popular comprehensive clean for soiled kicks. Full exterior scrub, deeper stain treatment, sole & midsole detailing, and deodorising.",
    features: [
      "Full exterior clean",
      "Deeper stain treatment",
      "Sole & midsole cleaning",
      "Laces cleaned",
      "Deodorising",
      "Final finishing",
    ],
    turnaround: "48 Hours",
    img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&h=350&fit=crop&auto=format",
    alt: "Sneaker deep clean process",
    active: true,
  },
  {
    id: "restore",
    title: "RESTORE",
    subtitle: "Full Restoration",
    tagline: "Bring them back to life.",
    price: "Rs 600+",
    priceNumeric: 600,
    desc: "Heavy cleaning and deep rejuvenation for heavily worn-out pairs, stubborn stains, and detailed sole treatment.",
    features: [
      "Heavy cleaning",
      "Stubborn stains treatment",
      "Detailed sole treatment",
      "Laces cleaned",
      "Deodorising",
      "Protective finishing",
    ],
    turnaround: "3-5 Days",
    img: "https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=600&h=450&fit=crop&auto=format",
    alt: "Shoe restoration before and after",
    active: true,
  },
  {
    id: "deal-2pairs",
    title: "MULTI-PAIR: 2 PAIRS",
    subtitle: "Clean More. Spend Less.",
    tagline: "Rs 500 instead of Rs 600.",
    badge: "SPECIAL DEAL",
    price: "Rs 500",
    priceNumeric: 500,
    desc: "Clean 2 pairs together and save Rs 100 instantly. Comprehensive care for both pairs.",
    features: [
      "2 Pairs cleaned together",
      "Exterior & sole treatment",
      "Laces cleaned & deodorised",
      "Save Rs 100 combo deal",
    ],
    turnaround: "48-72 Hours",
    img: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=500&h=350&fit=crop&auto=format",
    alt: "Two pairs of sneakers deal",
    active: true,
  },
  {
    id: "deal-3pairs",
    title: "MULTI-PAIR: 3 PAIRS",
    subtitle: "More Pairs. Better Value.",
    tagline: "Rs 800 instead of Rs 1,200.",
    badge: "BEST VALUE",
    price: "Rs 800",
    priceNumeric: 800,
    desc: "Clean 3 pairs together and save Rs 400! Ideal for households, teams, and sneaker collectors.",
    features: [
      "3 Pairs deep cleaned",
      "Full exterior & sole wash",
      "Laces cleaned & deodorised",
      "Save Rs 400 max value deal",
    ],
    turnaround: "3-5 Days",
    img: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=500&h=350&fit=crop&auto=format",
    alt: "Three pairs sneaker package",
    active: true,
  },
  {
    id: "apparel",
    title: "CUSTOM APPAREL",
    subtitle: "Tailored Streetwear",
    tagline: "Fresh fits. Bigger plans.",
    price: "From Rs 650",
    priceNumeric: 650,
    desc: "T-shirts, hoodies, caps and more — tailored to your personal aesthetic with high-grade prints, embroidery, or screen printing.",
    features: [
      "DTF premium print",
      "Precision embroidery",
      "Bulk team/club orders",
      "High GSM heavyweight fabric",
    ],
    turnaround: "2-4 Days",
    img: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=500&h=350&fit=crop&auto=format",
    alt: "Custom apparel showcase",
    active: true,
  },
  {
    id: "personal",
    title: "PERSONALIZATION",
    subtitle: "Bespoke Artwork & Monograms",
    tagline: "Distinct style. Custom detail.",
    price: "From Rs 450",
    priceNumeric: 450,
    desc: "Add your initials, personal artwork, team logo, or unique accents to any sneaker, cap, or bag.",
    features: [
      "Custom initials monogramming",
      "Hand-painted artwork accents",
      "Reflective vinyl heat transfers",
      "Permanent sealant",
    ],
    turnaround: "2-3 Days",
    img: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&h=350&fit=crop&auto=format",
    alt: "Personalized cap and sneakers",
    active: true,
  },
]

export const heritageBraceletProduct: Product = {
  id: "prod-brace-heritage",
  name: "Zimthread African Heritage Beaded Bracelet",
  category: "Accessories",
  price: 320,
  stock: 120,
  img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121580/zimthreads/bracelets/bracelet-zimbabwe-flag-cord-v2.jpg",
  images: [
    "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121580/zimthreads/bracelets/bracelet-zimbabwe-flag-cord-v2.jpg",
    "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121583/zimthreads/bracelets/bracelet-ghana-blackstar-cord-v2.jpg",
    "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121584/zimthreads/bracelets/bracelet-mauritius-flag-cord-v2.jpg",
    "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121585/zimthreads/bracelets/bracelet-nigeria-naija-cord-v2.jpg",
  ],
  views: [
    {
      label: "Zimbabwe Flag Beaded Drawstring Bracelet",
      url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121580/zimthreads/bracelets/bracelet-zimbabwe-flag-cord-v2.jpg",
    },
    {
      label: 'Ghana "Black Star" Beaded Drawstring Bracelet',
      url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121583/zimthreads/bracelets/bracelet-ghana-blackstar-cord-v2.jpg",
    },
    {
      label: 'Mauritius "Les 4 Couleurs" Beaded Drawstring Bracelet',
      url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121584/zimthreads/bracelets/bracelet-mauritius-flag-cord-v2.jpg",
    },
    {
      label: 'Nigeria "Naija" Beaded Drawstring Bracelet',
      url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1793121585/zimthreads/bracelets/bracelet-nigeria-naija-cord-v2.jpg",
    },
  ],
  alt: "Zimthread African Heritage Beaded Drawstring Bracelet Collection",
  description:
    "Handcrafted artisan beaded flag bracelet collection celebrating African heritage. Crafted with high-density polished glass beads, durable braided black cord, and an adjustable drawstring closure with accent beads for a tailored, flexible all-day fit.\n\nPRESALE EXCLUSIVE · Rs 320 each · Slide through options to choose your edition.",
  sizes: ["One Size (Adjustable Drawstring)"],
  featured: true,
  isPreorder: true,
  isPresale: true,
  badge: "PRESALE",
  preorderDeadline: "Presale Open · Rs 320",
}

export const racingJacketsProducts: Product[] = [
  {
    id: "prod-jacket-ferrari-red-leather",
    name: "Ferrari Scuderia Rosso Corsa Vintage Moto Leather Jacket",
    category: "Apparel",
    collectionId: "racing-jackets",
    collectionName: "Retro Motorsport Collection",
    price: 2850,
    stock: 8,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1791397726/zimthreads/jackets/fmyul3tffougz1obkara.png",
    alt: "Ferrari Scuderia Rosso Corsa Vintage Moto Leather Jacket",
    badge: "LEATHER GRAIN",
    tag: "Archival Moto",
    description:
      "Archival Grand Prix craftsmanship in iconic Rosso Corsa red. Heavyweight premium distressed cowhide leather featuring high-density Scuderia Ferrari chest crest, Shell & Vodafone sponsor patches, embroidered sleeve typography, snap-mandarin collar, and quilted satin interior. Cut in an authentic relaxed 90s moto racing boxy silhouette.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    featured: true,
  },
  {
    id: "prod-jacket-ferrari-pink-white",
    name: "Ferrari Scuderia Blossom Pastel Pink & White Moto Leather Jacket",
    category: "Apparel",
    collectionId: "racing-jackets",
    collectionName: "Retro Motorsport Collection",
    price: 2750,
    stock: 6,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1791397723/zimthreads/jackets/zs5crhp8bxlxdlxwldil.png",
    alt: "Ferrari Scuderia Blossom Pastel Pink & White Moto Leather Jacket",
    badge: "LIMITED EDITION",
    tag: "Statement Leather",
    description:
      "Statement high-contrast colorblock in soft blossom pink and off-white milled leather. Features bold embroidered pink Ferrari lettering across the chest, Italian tricolore arm shields, racing flag number '1', silver-tone zipped slash pockets, and double snap hem tab. The standout centerpiece of the collection.",
    sizes: ["S", "M", "L", "XL"],
    featured: true,
  },
  {
    id: "prod-jacket-mercedes-white-black",
    name: "Mercedes-Benz AMG 'Kompressor' Vintage Moto Leather Jacket",
    category: "Apparel",
    collectionId: "racing-jackets",
    collectionName: "Retro Motorsport Collection",
    price: 2650,
    stock: 10,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1791397736/zimthreads/jackets/z9cgo6k5hwlbau9uj6be.png",
    alt: "Mercedes-Benz AMG Kompressor Vintage Moto Leather Jacket",
    badge: "TOURING ARCHIVE",
    tag: "Vintage Moto",
    description:
      "Monochrome perfection celebrating Mercedes-Benz touring heritage. Crisp ivory and jet black leather paneling with heavyweight raised chenille-stitched 'MERCEDES' chest bar, AMG and Kompressor sleeve hits, vintage Motul, Veltins, and Allianz motorsport partner embroidery. Fully lined with inner chest stash pocket.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    featured: true,
  },
  {
    id: "prod-jacket-jack-daniels-black",
    name: "Jack Daniel's Old No. 7 NASCAR Cup Series Heritage Pit Bomber",
    category: "Apparel",
    collectionId: "racing-jackets",
    collectionName: "Retro Motorsport Collection",
    price: 1950,
    stock: 10,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1791397731/zimthreads/jackets/ciejszuwpceurjudwyug.png",
    alt: "Jack Daniels Old No. 7 NASCAR Cup Series Heritage Pit Bomber",
    badge: "NASCAR HERITAGE",
    tag: "Heavy Brushed Twill",
    description:
      "Authentic NASCAR cup series pit jacket in heavy brushed cotton twill. Enormous high-stitch-count Jack Daniel's Old No. 7 Brand embroidery spanning front, back, and neck, flanked by Nextel, Snap-on, SKF, Okuma, and Sunoco sponsor patches. Vintage boxy cut with contrast white piping and snap throat latch.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    featured: true,
  },
  {
    id: "prod-jacket-mercedes-warsteiner",
    name: "Mercedes-Benz Warsteiner DTM Touring Racing Bomber",
    category: "Apparel",
    collectionId: "racing-jackets",
    collectionName: "Retro Motorsport Collection",
    price: 1950,
    stock: 8,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1791397733/zimthreads/jackets/vpa3qdjqdj4nhfa7epjc.png",
    alt: "Mercedes-Benz Warsteiner DTM Touring Racing Bomber",
    badge: "DTM CLASSIC",
    tag: "Touring Satin Twill",
    description:
      "Golden era DTM touring car tribute jacket. Features iconic Warsteiner brewery racing livery and Mercedes three-pointed star embroidery across front and back, Michelin, Bilstein, and Bosch race sponsor badges. Heavyweight satin twill construction with ribbed collar and hem.",
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "prod-jacket-ferrari-black-red-white",
    name: "Ferrari Scuderia Tricolor Sponsor Team Bomber",
    category: "Apparel",
    collectionId: "racing-jackets",
    collectionName: "Retro Motorsport Collection",
    price: 1900,
    stock: 14,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1791397716/zimthreads/jackets/vrxjrshmuj6bss8ltrwa.png",
    alt: "Ferrari Scuderia Tricolor Sponsor Team Bomber",
    badge: "TEAM PADDOCK",
    tag: "Paddock Bomber",
    description:
      "Classic Maranello paddock colorway featuring bold black, crisp white, and racing red horizontal block panels. High-density embroidered Ferrari chest lettering, Scuderia Ferrari shield, Shell, UPS, and F-1 arm badges with red Puma cat embroidery on neck.",
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "prod-jacket-ferrari-collar-edition",
    name: "Ferrari F-1 Scuderia Collar Embroidered Track Jacket",
    category: "Apparel",
    collectionId: "racing-jackets",
    collectionName: "Retro Motorsport Collection",
    price: 1900,
    stock: 10,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1791397718/zimthreads/jackets/c9bfxhcou1x1ag3jntzn.png",
    alt: "Ferrari F-1 Scuderia Collar Embroidered Track Jacket",
    badge: "SPECIAL DETAILS",
    tag: "Embroidered Collar",
    description:
      "Detailed edition of the Maranello team jacket featuring cursive Ferrari embroidery on both collar wings, custom brass Prancing Horse zip pull, dual front slash hand pockets, and reinforced shoulder piping.",
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "prod-jacket-bmw-m-power",
    name: "BMW M Power Petronas Track Bomber Jacket",
    category: "Apparel",
    collectionId: "racing-jackets",
    collectionName: "Retro Motorsport Collection",
    price: 1850,
    stock: 12,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1791397714/zimthreads/jackets/bw1t7dqspocp2ehyrbmi.png",
    alt: "BMW M Power Petronas Track Bomber Jacket",
    badge: "PADDOCK BOMBER",
    tag: "Stealth Black",
    description:
      "Sleek matte nylon paddock bomber in stealth black. Detailed with the iconic tri-color BMW M Power emblem, Petronas lower-chest typographic branding, Credit Suisse shoulder accents, and Dell sleeve embroidery. Features water-resistant technical windbreaker shell, stand collar, and elasticated cuffs and waistband.",
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "prod-jacket-ferrari-lower-right",
    name: "Ferrari Scuderia Lower-Split Contrast Track Jacket",
    category: "Apparel",
    collectionId: "racing-jackets",
    collectionName: "Retro Motorsport Collection",
    price: 1850,
    stock: 8,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1791397715/zimthreads/jackets/tiedipps6tdxd7gt9v0n.png",
    alt: "Ferrari Scuderia Lower-Split Contrast Track Jacket",
    badge: "ASYMMETRIC CUT",
    tag: "Split Racing Shell",
    description:
      "Asymmetrical split racing jacket featuring lower-body contrast panels, heavy-gauge front zipper, reinforced elbow sections, and Scuderia Ferrari racing heraldry across chest and sleeve.",
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "prod-jacket-red-bull-blue",
    name: "Red Bull Racing Infiniti F1 Cyan & Midnight Paddock Jacket",
    category: "Apparel",
    collectionId: "racing-jackets",
    collectionName: "Retro Motorsport Collection",
    price: 1800,
    stock: 12,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1791397740/zimthreads/jackets/p1wcj0h99yszaei0wghy.png",
    alt: "Red Bull Racing Infiniti F1 Cyan & Midnight Paddock Jacket",
    badge: "FORMULA 1",
    tag: "Paddock Twill",
    description:
      "Championship-era Formula 1 paddock jacket crafted in technical matte twill. Features electric cyan and deep midnight color blocking, Infiniti Red Bull Racing raised chest badging, Total, Pepe Jeans, and Renault partner embroidery. Breathable athletic mesh interior and concealed inner pocket.",
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "prod-jacket-red-bull-black-white",
    name: "Red Bull Racing Infiniti Stealth Monochrome Paddock Jacket",
    category: "Apparel",
    collectionId: "racing-jackets",
    collectionName: "Retro Motorsport Collection",
    price: 1800,
    stock: 10,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1791397738/zimthreads/jackets/o91zsdc1ztygka1msmqc.png",
    alt: "Red Bull Racing Infiniti Stealth Monochrome Paddock Jacket",
    badge: "STEALTH EDITION",
    tag: "Monochrome F1",
    description:
      "Stealth edition of the Red Bull Racing paddock jacket in monochromatic black, white, and carbon grey. Embroidered Infiniti Red Bull Racing bulls crest, technical raglan shoulder cut, and heavy metal zipper pull. Perfect everyday streetwear piece with subtle racing pedigree.",
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "prod-jacket-ferrari-red",
    name: "Ferrari Scuderia Rosso Corsa Lightweight Paddock Jacket",
    category: "Apparel",
    collectionId: "racing-jackets",
    collectionName: "Retro Motorsport Collection",
    price: 1800,
    stock: 10,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1791397729/zimthreads/jackets/mdjsoigmxnzzkarlkgeu.png",
    alt: "Ferrari Scuderia Rosso Corsa Lightweight Paddock Jacket",
    badge: "ROSSO CORSA",
    tag: "Lightweight Layer",
    description:
      "All-red Rosso Corsa paddock jacket with clean white racing stripe accents. Scuderia Ferrari crest on chest, sponsor arm badges, and full-zip front. Lightweight, versatile daily layering piece.",
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "prod-jacket-audi-sport-red",
    name: "Audi Sport Quattro Rallye Crimson Racing Shell",
    category: "Apparel",
    collectionId: "racing-jackets",
    collectionName: "Retro Motorsport Collection",
    price: 1750,
    stock: 8,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1791397713/zimthreads/jackets/ousdwogzohpzge2z7pv3.png",
    alt: "Audi Sport Quattro Rallye Crimson Racing Shell",
    badge: "RALLYE HERITAGE",
    tag: "Technical Shell",
    description:
      "Vibrant crimson red Audi Sport heritage jacket. Celebrates Audi's Quattro rally dominance with bold Audi rings, Audi Sport diagonal slash badge, Castrol, and Michelin sleeve patches. Lightweight weather-resistant technical fabric with breathable lining.",
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "prod-jacket-ferrari-windbreaker",
    name: "Ferrari F-1 Scuderia Technical Windbreaker Shell",
    category: "Apparel",
    collectionId: "racing-jackets",
    collectionName: "Retro Motorsport Collection",
    price: 1750,
    stock: 12,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1791397719/zimthreads/jackets/hfb6kqjqll82ysq3ioia.png",
    alt: "Ferrari F-1 Scuderia Technical Windbreaker Shell",
    badge: "WINDBREAKER",
    tag: "Weather Resistant",
    description:
      "Lightweight technical windbreaker version of the Scuderia Ferrari team uniform. Weather-resistant shell, breathable mesh lining, stand-up collar with zip shield, and high-visibility block paneling.",
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
]

export const racingJacketsCollection: CollectiveCollection = {
  id: "racing-jackets",
  name: "Retro Motorsport Archive",
  slug: "retro-motorsport",
  tagline: "Vintage Grand Prix, DTM & NASCAR Paddock Racing Jackets",
  category: "Apparel",
  description:
    "A hand-curated archival collective of 14 iconic vintage motorsport racing jackets. From genuine top-grain cowhide moto leathers with authentic sponsor heraldry to heavyweight brushed cotton NASCAR pit bombers and aerodynamic paddock track shells.",
  heroImage:
    "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1791397726/zimthreads/jackets/fmyul3tffougz1obkara.png",
  previewImages: [
    "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1791397726/zimthreads/jackets/fmyul3tffougz1obkara.png",
    "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1791397723/zimthreads/jackets/zs5crhp8bxlxdlxwldil.png",
    "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1791397736/zimthreads/jackets/z9cgo6k5hwlbau9uj6be.png",
    "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1791397731/zimthreads/jackets/ciejszuwpceurjudwyug.png",
    "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1791397714/zimthreads/jackets/bw1t7dqspocp2ehyrbmi.png",
  ],
  productIds: [
    "prod-jacket-ferrari-red-leather",
    "prod-jacket-ferrari-pink-white",
    "prod-jacket-mercedes-white-black",
    "prod-jacket-jack-daniels-black",
    "prod-jacket-mercedes-warsteiner",
    "prod-jacket-ferrari-black-red-white",
    "prod-jacket-ferrari-collar-edition",
    "prod-jacket-bmw-m-power",
    "prod-jacket-ferrari-lower-right",
    "prod-jacket-red-bull-blue",
    "prod-jacket-red-bull-black-white",
    "prod-jacket-ferrari-red",
    "prod-jacket-audi-sport-red",
    "prod-jacket-ferrari-windbreaker",
  ],
  itemCount: 14,
  priceRange: { min: 1750, max: 2850 },
  badge: "CAPSULE DROP · 14 EDITIONS",
}

export const initialProducts: Product[] = [
  ...racingJacketsProducts,
  heritageBraceletProduct,
  {
    id: "prod-zim-02",
    name: "Zimthread Zimbabwe '02' Heritage Jersey",
    category: "Apparel",
    price: 750,
    stock: 50,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1790842891/zimthreads/products/d7oauktons2oaunl3nnp.png",
    images: [
      "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1790842891/zimthreads/products/d7oauktons2oaunl3nnp.png",
      "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1790842917/zimthreads/products/fhxh4msyd0asmpbolrot.png",
    ],
    views: [
      {
        label: "Front View",
        url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1790842891/zimthreads/products/d7oauktons2oaunl3nnp.png",
      },
      {
        label: "Back View",
        url: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1790842917/zimthreads/products/fhxh4msyd0asmpbolrot.png",
      },
    ],
    alt: "Zimthread Zimbabwe 02 Heritage Jersey Front and Back",
    description:
      "Official Zimthread Limited Pre-Order Kit. Premium performance jersey featuring the iconic Zimbabwe National bird crest on the chest, subtle right-chest Zimthread branding, and classic 'ZIMBABWE 02' lettering on the back in national green and gold. Orders strictly close Sunday evening.\n\nPersonalize with your Custom Name printed on the back above '02' for +Rs 50.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    featured: true,
    isPreorder: true,
    preorderDeadline: "Closes Sunday Evening",
    allowCustomName: true,
    customNamePrice: 50,
  },
  {
    id: "prod-1",
    name: "Zimthread Foaming Shoe Cleaner 250ml",
    category: "Cleaning",
    price: 350,
    stock: 45,
    img: "https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?w=500&h=500&fit=crop&auto=format",
    alt: "Shoe cleaner bottle",
    description:
      "Eco-friendly foaming sneaker cleanser formulated for leather, canvas, mesh, and synthetic uppers. Safe on colours.",
    featured: true,
  },
  {
    id: "prod-2",
    name: "Premium Sneaker Cleaning Kit",
    category: "Cleaning",
    price: 750,
    stock: 22,
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop&auto=format",
    alt: "Cleaning kit with brush",
    description:
      "Complete set with 250ml Solution, Soft Hog Bristle Brush, Medium Synthetic Brush, and Microfiber Cloth in a zipper pouch.",
    featured: true,
  },
  {
    id: "prod-3",
    name: "Suede & Nubuck Eraser Brush Set",
    category: "Cleaning",
    price: 300,
    stock: 30,
    img: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500&h=500&fit=crop&auto=format",
    alt: "Suede brush set",
    description:
      "Dual-sided brass and crepe brush designed specifically to lift nap and safely erase scuffs from delicate suede.",
  },
  {
    id: "prod-4",
    name: "Zimthread Heavyweight Atelier Hoodie",
    category: "Apparel",
    price: 1350,
    stock: 18,
    img: "https://res.cloudinary.com/qyuoyjju/image/upload/f_auto,q_auto/v1788884997/zimthreads/products/zcb9ju1mhzsuaizw668l.jpg",
    alt: "Black heavyweight atelier hoodie",
    description:
      "420 GSM 100% combed cotton boxy-fit hoodie with embroidered Zimthread Collective chest emblem.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    featured: true,
  },
  {
    id: "prod-5",
    name: "Zimthread 'LLICYLAND' Graphic Boxy Tee",
    category: "Apparel",
    price: 650,
    stock: 35,
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1789976413/zimthreads/products/jnfkstiyqubyzn4xslia.jpg",
    alt: "Zimthread LLICYLAND Graphic Boxy Tee",
    description:
      "Heavyweight combed cotton boxy-fit graphic tee with signature red dice LLICYLAND artwork and custom Zimthread atelier tag.",
    sizes: ["S", "M", "L", "XL", "2XL", "XXL"],
    featured: true,
  },
  {
    id: "prod-6",
    name: "Zimthread Structured Twill Cap",
    category: "Apparel",
    price: 450,
    stock: 25,
    img: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&h=500&fit=crop&auto=format",
    alt: "Black cap with Zimthread logo",
    description:
      "6-panel twill cap with brass buckle adjuster and high-density 3D embroidery.",
    sizes: ["One Size"],
  },
  {
    id: "prod-7",
    name: "Waterproof Sneaker Carry Bag",
    category: "Accessories",
    price: 350,
    stock: 40,
    img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop&auto=format",
    alt: "Sneaker carrying bag",
    description:
      "Heavy-duty ripstop nylon travel bag with ventilation eyelets to transport your kicks in style.",
  },
  {
    id: "prod-8",
    name: "Aromatic Red Cedar Shoe Trees",
    category: "Accessories",
    price: 550,
    stock: 15,
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop&auto=format",
    alt: "Cedar shoe tree pair",
    description:
      "Natural cedar wood shoe trees that absorb moisture, prevent creasing, and maintain your shoe's original silhouette.",
    sizes: ["M (40-42)", "L (43-45)"],
  },
]

export const initialBookings: BookingItem[] = []

export const initialOrders: OrderItem[] = []

export const initialInquiries: Inquiry[] = []

export const initialBlogPosts: BlogPost[] = [
  {
    id: "post-llicyland-dice-collab",
    title: 'OWN THE DRIP: THE "LLICYLAND" DICE ROLL STREETWEAR COLLABORATION',
    excerpt:
      "Zimthread Collective teams up with Designer Llicious to unveil the LLICYLAND Boxy Tee — heavyweight combed cotton, signature red dice graphics, and relaxed oversized silhouette.",
    content: `Streetwear is a language of bold statements, cultural heritage, and uncompromising quality. Zimthread Collective is proud to officially unveil the **LLICYLAND Collection** — an exclusive collaboration with **Designer Llicious** celebrating luck, risk, and raw urban aesthetic.

### The Dice Edition: Symbol of Luck & Culture
The centerpiece of the drop is the signature **LLICYLAND Boxy Tee**, showcasing glossy 3D-rendered red dice spelling out LLICYLAND across the chest. The dice motif is a tribute to taking chances, street culture resilience, and rolling high stakes with every drop.

### Crafted for the Streets, Designed for Everyday
Engineered for those who demand both structural integrity and effortless drape:
- **260+ GSM Heavyweight Combed Cotton**: Thick, structured, and pre-shrunk to retain its silhouette through repeated wears and washes.
- **Relaxed Drop-Shoulder Oversized Silhouette**: Cut with roomy sleeves, dropped shoulder seams, and a snug ribbed crew collar that won't sag.
- **High-Definition Direct-To-Film (DTF) Graphics**: Vivid crimson red dice typography with high-gloss finish and stretch-resistant durability.
- **Signature Atelier Woven Label**: Hand-stitched Zimthread Collective hem tag certifying genuine small-batch atelier craftsmanship.

### Style Guide: How to Rock the Drop
Pair the LLICYLAND Boxy Tee with relaxed neutral cargo trousers, minimal silver chain jewellery, and fresh all-black or triple-white kicks restored by the Zimthread cleaning lab.

### Limited Drop Availability
The LLICYLAND Collection is strictly limited in quantity. Available now exclusively through the Zimthread Collective online shop with islandwide delivery across Mauritius and international collection orders.

*Own the drip. Built for the culture. Made to last.*`,
    category: "Apparel",
    date: "Oct 2, 2026",
    img: "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1790959536/zimthreads/blog/oqpojiputsm4qndzgstg.jpg",
    alt: "Zimthread Collective x LLICYLAND Dice Roll Streetwear Collection 2025 poster featuring the oversized white graphic tee and editorial model",
    readTime: "4 min read",
    author: "Designer Llicious",
  },
  {
    id: "post-1",
    title: "How Often Should You Clean Your Shoes?",
    excerpt:
      "Keep your kicks fresh all year. Here's a breakdown of cleaning intervals based on usage, weather, and fabric type.",
    content: `Shoes are an investment, whether they are daily beaters, gym runners, or prized collection grails. But how often should you actually clean them?

### 1. The Daily Check
After walking through dusty Harare streets or rainy puddles, a quick 30-second wipe with a damp microfiber cloth prevents dirt from embedding into canvas and leather micro-pores.

### 2. Bi-Weekly Routine
For shoes worn 3–4 days a week, a bi-weekly wash with our gentle foaming cleanser removes oil, sweat, and street grime without stripping natural leather moisture.

### 3. Monthly Deep Clean
Give your sneakers a complete midsole scrub, insole wash, and deodorizing soak once a month.

### 4. Suede & Nubuck Caution
Never submerge suede in water! Use our brass-bristle brush dry, followed by a dedicated suede eraser for scuff marks.`,
    category: "Shoe Care",
    date: "Aug 12, 2026",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=500&fit=crop&auto=format",
    alt: "White sneakers being cleaned",
    readTime: "4 min read",
    author: "Shepherd Chara",
  },
  {
    id: "post-2",
    title: "Best Products for Sneaker Care in 2026",
    excerpt:
      "The right products make all the difference. Our top picks for maintaining spotless footwear.",
    content: `Choosing the right shoe care kit can save you hundreds of dollars in premature replacements. Here are the essentials tested by our studio team:

- **Enzyme-Based Cleaners**: Unlike harsh household detergents that yellow soles, enzyme solutions break down organic dirt without bleaching.
- **Hog Hair Brushes**: Soft enough for delicate flyknit mesh and soft leathers.
- **Creep Rubber Erasers**: The golden standard for stubborn grease and scuff removal on suede.
- **Hydrophobic Protective Sprays**: Applied every 4 weeks to create an invisible liquid barrier.`,
    category: "Products",
    date: "Jul 28, 2026",
    img: "https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?w=800&h=500&fit=crop&auto=format",
    alt: "Sneaker care products lined up",
    readTime: "6 min read",
    author: "Davies L .M",
  },
  {
    id: "post-3",
    title: "Custom Apparel Trends in Zimbabwe & Beyond",
    excerpt:
      "What's trending in streetwear this year — from oversized silhouettes to minimalist high-density embroidery.",
    content: `Streetwear across Southern Africa is experiencing a renaissance. Zimthread Collective sits at the intersection of heritage artistry and modern urban cuts.

Key aesthetic trends we are producing this season:
- **Heavyweight 400+ GSM Boxy Cuts**: Dropped shoulders, durable collar ribbing, and minimal shrinkage.
- **Tonal & Subtle Monograms**: Discreet embroidery matching the fabric hue for low-key luxury.
- **Direct-to-Film (DTF) Graphics**: High-definition, hyper-vibrant prints with extreme wash resistance.`,
    category: "Apparel",
    date: "Jul 10, 2026",
    img: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=800&h=500&fit=crop&auto=format",
    alt: "Custom apparel on display",
    readTime: "5 min read",
    author: "Anesu M",
  },
  {
    id: "post-4",
    title: "The Science Behind Deep Cleaning Suede",
    excerpt:
      "Suede is notoriously delicate. Here is how our lab restores texture without water stains.",
    content: `Suede is the underside of animal hide, which gives it that signature velvety nap. Because it lacks the tough outer epidermis, moisture easily causes the fibres to clump and discolor.

When restoring suede at Zimthread:
1. We brush the nap dry in one continuous direction.
2. We apply dry cleaning foam that suspends dirt without penetrating deep into the leather core.
3. We brush out the nap as it dries to maintain that plush, velvety feel.`,
    category: "Shoe Care",
    date: "Jun 22, 2026",
    img: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&h=500&fit=crop&auto=format",
    alt: "Suede shoe cleaning",
    readTime: "7 min read",
    author: "Shepherd Chara",
  },
]

export const initialSettings: StoreSettings = {
  storeName: "Zimthreads Collective",
  tagline: "We Clean. You Shine.",
  email: "zimthreadmu@gmail.com",
  phone: "+23055132614",
  location: "Mauritius (Drop Off & Collection Points)",
  hours: "Mon–Sat: 8:00 AM – 6:00 PM",
  currency: "Rs",
  deliveryFee: 100,
  freeDeliveryThreshold: 1500,
  featuredDrop: {
    enabled: true,
    badge: "NEW DROP · LIMITED RELEASE",
    title: 'THE "LLICYLAND" BOXY TEE',
    subtitle: "260 GSM Heavyweight Streetwear Cut",
    description:
      "Crafted from heavyweight combed cotton with drop-shoulder silhouette, iconic red dice LLICYLAND typography, and woven Zimthread atelier tag.",
    imageUrl:
      "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1792407895/zimthreads/banners/wjn81t1rzt0h6boikoxd.jpg",
    productId: "prod-5",
    priceText: "Rs 650",
    ctaText: "Shop This Drop",
    secondaryCtaText: "Inquire via WhatsApp",
    tag: "Atelier Exclusive",
  },
}
