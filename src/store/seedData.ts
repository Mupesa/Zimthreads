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
  paymentMethod: "EcoCash" | "ZIPIT" | "Swipe / Card" | "Cash on Delivery"
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
    price: "From $8",
    priceNumeric: 8,
    desc: "Standard cleaning for everyday shoes. Removes surface dirt and grime, restores the fresh look of your sneakers or casuals.",
    features: [
      "Surface dirt removal",
      "Lace cleaning",
      "Deodorising treatment",
      "Gentle air-dry finish",
    ],
    turnaround: "24 Hours",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=350&fit=crop&auto=format",
    alt: "Clean white sneakers",
    active: true,
  },
  {
    id: "deep",
    title: "DEEP CLEAN",
    subtitle: "Premium Deep Cleaning",
    price: "From $15",
    priceNumeric: 15,
    desc: "Deep cleaning & stain treatment for heavily soiled shoes. Perfect for trainers, boots, and any shoes that need serious love.",
    features: [
      "Deep stain treatment",
      "Midsole scrub & brightener",
      "Insole & inner lining wash",
      "Repellent protective coating",
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
    price: "From $25",
    priceNumeric: 25,
    desc: "Full restoration for worn-out shoes. We repair, repaint, and bring your beloved kicks back to life — looking like new.",
    features: [
      "Custom paint & color match",
      "Sole re-gluing & bond repair",
      "Crease reduction & reshaping",
      "UV anti-yellowing seal",
    ],
    turnaround: "3-5 Days",
    img: "https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=600&h=450&fit=crop&auto=format",
    alt: "Shoe restoration before and after",
    active: true,
  },
  {
    id: "apparel",
    title: "CUSTOM APPAREL",
    subtitle: "Tailored Streetwear",
    price: "From $20",
    priceNumeric: 20,
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
    price: "From $12",
    priceNumeric: 12,
    desc: "Add your initials, personal artwork, team logo, or unique graffiti accents to any sneaker, cap, or bag.",
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
    name: "Zimthread Shoe Cleaner 250ml",
    category: "Cleaning",
    price: 12,
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
    price: 28,
    stock: 22,
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop&auto=format",
    alt: "Cleaning kit with brush",
    description:
      "Complete set with 250ml Solution, Soft Hog Bristle Brush, Medium Synthetic Brush, and Microfiber Cloth in a zipper pouch.",
    featured: true,
  },
  {
    id: "prod-3",
    name: "Suede & Nubuck Brush Set",
    category: "Cleaning",
    price: 15,
    stock: 30,
    img: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500&h=500&fit=crop&auto=format",
    alt: "Suede brush set",
    description:
      "Dual-sided brass and crepe brush designed specifically to lift nap and safely erase scuffs from delicate suede.",
  },
  {
    id: "prod-4",
    name: "Zimthread Heavyweight Hoodie",
    category: "Apparel",
    price: 45,
    stock: 18,
    img: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=500&h=500&fit=crop&auto=format",
    alt: "Black heavyweight hoodie",
    description:
      "420 GSM 100% combed cotton boxy-fit hoodie with embroidered Zimthread Collective chest emblem.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    featured: true,
  },
  {
    id: "prod-5",
    name: "Collective Vintage Wash Tee",
    category: "Apparel",
    price: 22,
    stock: 35,
    img: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=500&h=500&fit=crop&auto=format",
    alt: "Branded t-shirt",
    description:
      "Acid-washed oversized cotton tee featuring screen-printed typography on the back and subtle chest crest.",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "prod-6",
    name: "Zimthread Structured Dad Cap",
    category: "Apparel",
    price: 18,
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
    price: 14,
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
    price: 20,
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
    author: "Tinashe Moyo",
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
    author: "Rutendo Chikwanda",
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
    author: "Brandon Mutasa",
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
    author: "Tinashe Moyo",
  },
]

export const initialSettings: StoreSettings = {
  storeName: "Zimthread Collective",
  tagline: "More Than Clean. It's Care.",
  email: "info@zimthread.co.zw",
  phone: "+263 77 123 4567",
  location: "Harare, Zimbabwe",
  hours: "Mon–Sat: 8:00 AM – 6:00 PM",
  currency: "USD ($)",
  deliveryFee: 3,
  freeDeliveryThreshold: 50,
}
