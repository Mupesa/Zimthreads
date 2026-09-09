export interface Product {
  id: string
  name: string
  category: "Cleaning" | "Apparel" | "Accessories"
  price: number
  stock: number
  img: string
  alt: string
  description: string
  sizes?: string[]
  featured?: boolean
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

export const initialProducts: Product[] = [
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
    name: "Collective Vintage Wash Tee",
    category: "Apparel",
    price: 650,
    stock: 35,
    img: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=500&h=500&fit=crop&auto=format",
    alt: "Branded t-shirt",
    description:
      "Acid-washed oversized cotton tee featuring screen-printed typography on the back and subtle chest crest.",
    sizes: ["S", "M", "L", "XL"],
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
    author: "Davis",
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
    author: "Anesu",
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
  storeName: "Zimthread Collective",
  tagline: "We Clean. You Shine.",
  email: "zimthreadmu@gmail.com",
  phone: "+23055132614",
  location: "Mauritius (Drop Off & Collection Points)",
  hours: "Mon–Sat: 8:00 AM – 6:00 PM",
  currency: "Rs",
  deliveryFee: 100,
  freeDeliveryThreshold: 1500,
}
