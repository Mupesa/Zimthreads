import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useMemo,
} from "react"
import {
  Product,
  Service,
  BlogPost,
  BookingItem,
  OrderItem,
  CartItem,
  Inquiry,
  StoreSettings,
  initialProducts,
  initialServices,
  initialBookings,
  initialOrders,
  initialBlogPosts,
  initialInquiries,
  initialSettings,
  heritageBraceletProduct,
} from "./seedData"

declare module "./seedData" {
  interface OrderItem {
    paymentStatus?: "Paid" | "Pending" | "Refunded"
  }
  interface Inquiry {
    response?: string
    respondedAt?: string
  }
  interface BlogPost {
    status?: "published" | "draft"
  }
  interface StoreSettings {
    announcementText?: string
  }
}

export interface ToastMessage {
  id: string
  type: "success" | "info" | "error"
  title: string
  message: string
}

export interface CustomerSummary {
  name: string
  email: string
  phone: string
  bookingsCount: number
  ordersCount: number
  totalSpent: number
  joinedDate: string
  status: "Active" | "VIP" | "New"
}

export interface StoreContextType {
  // State
  products: Product[]
  services: Service[]
  bookings: BookingItem[]
  orders: OrderItem[]
  blogPosts: BlogPost[]
  inquiries: Inquiry[]
  settings: StoreSettings
  cart: CartItem[]
  isCartOpen: boolean
  toasts: ToastMessage[]
  customers: CustomerSummary[]
  isHydrating: boolean
  lastSyncedAt: Date | null

  // Selected item for booking prefill
  prefilledServiceId: string | null
  setPrefilledServiceId: (id: string | null) => void

  // Cart actions
  setIsCartOpen: (open: boolean) => void
  addToCart: (
    product: Product,
    quantity?: number,
    size?: string,
    customName?: string,
    selectedPrice?: number,
    priceOptionLabel?: string,
  ) => void
  removeFromCart: (
    productId: string,
    size?: string,
    customName?: string,
    priceOptionLabel?: string,
  ) => void
  updateCartQuantity: (
    productId: string,
    quantity: number,
    size?: string,
    customName?: string,
    priceOptionLabel?: string,
  ) => void
  clearCart: () => void
  cartTotal: number
  cartCount: number

  // Booking actions
  addBooking: (
    booking: Omit<BookingItem, "id" | "createdAt" | "status">,
  ) => Promise<BookingItem>
  updateBookingStatus: (id: string, status: BookingItem["status"]) => void
  deleteBooking: (id: string) => void

  // Order actions
  createOrder: (orderData: {
    customer: string
    email: string
    phone: string
    address: string
    city: string
    paymentMethod: OrderItem["paymentMethod"]
  }) => Promise<OrderItem>
  updateOrderStatus: (id: string, status: OrderItem["status"]) => void
  updateOrderPaymentStatus: (
    id: string,
    paymentStatus: "Paid" | "Pending" | "Refunded",
  ) => void
  deleteOrder: (id: string) => void

  // Service actions
  addService: (service: Omit<Service, "id">) => Service
  updateService: (id: string, service: Partial<Service>) => void
  deleteService: (id: string) => void

  // Product actions
  addProduct: (product: Omit<Product, "id">) => Product
  updateProduct: (id: string, product: Partial<Product>) => void
  updateProductsBatch: (
    updates: { id: string changes: Partial<Product> }[],
  ) => void
  deleteProduct: (id: string) => void

  // Blog actions
  addBlogPost: (post: Omit<BlogPost, "id">) => BlogPost
  updateBlogPost: (id: string, post: Partial<BlogPost>) => void
  deleteBlogPost: (id: string) => void

  // Inquiry actions
  addInquiry: (
    inquiry: Omit<Inquiry, "id" | "date" | "read">,
  ) => Promise<Inquiry>
  markInquiryAsRead: (id: string, read?: boolean) => void
  respondToInquiry: (id: string, response: string) => Promise<void>
  deleteInquiry: (id: string) => void

  // Settings
  updateSettings: (newSettings: Partial<StoreSettings>) => void
  resetAllData: () => void

  // Toast
  showToast: (
    title: string,
    message: string,
    type?: ToastMessage["type"],
  ) => void
  removeToast: (id: string) => void

  // Cloud revalidation
  refreshCloudData: () => Promise<void>
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

const STORAGE_KEYS = {
  PRODUCTS: "zimthread_products_v7",
  SERVICES: "zimthread_services_v7",
  BOOKINGS: "zimthread_bookings_v7",
  ORDERS: "zimthread_orders_v7",
  BLOG_POSTS: "zimthread_blog_posts_v7",
  INQUIRIES: "zimthread_inquiries_v7",
  SETTINGS: "zimthread_settings_v7",
  CART: "zimthread_cart_v7",
}

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key)
    if (!item) return fallback
    const parsed = JSON.parse(item)
    if (parsed === null || parsed === undefined) return fallback
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback
    return parsed
  } catch (e) {
    console.warn(`Error reading localStorage key "${key}"`, e)
    return fallback
  }
}

function setStored<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.warn(`Error writing to localStorage key "${key}"`, e)
  }
}

// Unauthenticated persistence helper for customer submissions
const persistPublicRecord = async <T,>(
  entity: "bookings" | "orders" | "inquiries",
  record: T,
): Promise<T> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  let res: Response
  try {
    res = await fetch("/api/store", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "public_create",
        entity,
        record,
      }),
      signal: controller.signal,
    })
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(
        "Request timed out. Please check your internet connection and try again.",
      )
    }
    throw new Error(
      err.message ||
        "Network error: Unable to reach the server. Please check your internet connection.",
    )
  } finally {
    clearTimeout(timeoutId)
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    const errorMsg =
      errData.error ||
      `Server error (${res.status}): Failed to save ${entity} to database.`
    console.warn(
      `[StoreContext] Failed to persist ${entity} to cloud:`,
      errorMsg,
    )
    throw new Error(errorMsg)
  }

  const json = await res.json().catch(() => ({}))
  return json.record as T || record
}

// Authenticated sync helper for administrative operations
const syncToCloud = async (key: string, data: any): Promise<boolean> => {
  if (
    (key === "products" || key === "services" || key === "blog_posts") &&
    Array.isArray(data) &&
    data.length === 0
  ) {
    console.error(`[StoreContext] Aborted sync of empty array for "${key}".`)
    return false
  }

  try {
    const res = await fetch("/api/store", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "sync",
        key,
        data,
        adminToken: "Zimthreads200",
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.warn(
        `[StoreContext] Cloud sync failed for ${key} (${res.status}):`,
        err,
      )
      return false
    }
    return true
  } catch (err) {
    console.warn(`[StoreContext] Failed to sync ${key} to cloud:`, err)
    return false
  }
}

export const StoreProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const loaded = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, initialProducts)
    const effective =
      Array.isArray(loaded) && loaded.length > 0 ? loaded : initialProducts
    return effective.map((p) => {
      if (
        p.id === "prod-4" &&
        (!p.img ||
          p.img.includes("photo-1556821840-3a63f15732ce") ||
          p.img === "/images/products/black-hoodie.jpg")
      ) {
        return {
          ...p,
          img: "https://res.cloudinary.com/qyuoyjju/image/upload/f_auto,q_auto/v1788884997/zimthreads/products/zcb9ju1mhzsuaizw668l.jpg",
        }
      }
      if (p.id === "prod-5") {
        const canonicalSizes = ["S", "M", "L", "XL", "2XL", "XXL"]
        const existingSizes = Array.isArray(p.sizes) ? p.sizes : []
        const has2XL = existingSizes.includes("2XL")
        const hasXXL = existingSizes.includes("XXL")
        const finalSizes = has2XL && hasXXL ? existingSizes : canonicalSizes
        return {
          ...p,
          name: p.name || "Zimthread 'LLICYLAND' Graphic Boxy Tee",
          img:
            !p.img || p.img.includes("photo-1521572267360-ee0c2909d518")
              ? "https://res.cloudinary.com/pwranjbq/image/upload/f_auto,q_auto/v1789976413/zimthreads/products/jnfkstiyqubyzn4xslia.jpg"
              : p.img,
          sizes: finalSizes,
        }
      }
      if (p.id === "prod-brace-heritage") {
        const localViews = Array.isArray(p.views) ? p.views : []
        const canonicalViews = heritageBraceletProduct.views || []
        const existingUrls = new Set(localViews.map((v: any) => v.url))
        const missingViews = canonicalViews.filter(
          (v: any) => !existingUrls.has(v.url),
        )
        if (missingViews.length > 0) {
          return {
            ...p,
            views: [...localViews, ...missingViews],
            images: Array.from(
              new Set([
                ...(p.images || []),
                ...(heritageBraceletProduct.images || []),
              ]),
            ),
          }
        }
      }
      return p
    })
  })
  const [services, setServices] = useState<Service[]>(() => {
    const loaded = getStored<Service[]>(STORAGE_KEYS.SERVICES, initialServices)
    const effective =
      Array.isArray(loaded) && loaded.length > 0 ? loaded : initialServices
    return effective.map((s) => {
      if (
        s.id === "restore" &&
        (!s.img || s.img.includes("photo-1556906781-9a412961a28c"))
      ) {
        return {
          ...s,
          img: "https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=600&h=450&fit=crop&auto=format",
        }
      }
      return s
    })
  })
  const [bookings, setBookings] = useState<BookingItem[]>(() =>
    getStored(STORAGE_KEYS.BOOKINGS, initialBookings),
  )
  const [orders, setOrders] = useState<OrderItem[]>(() =>
    getStored(STORAGE_KEYS.ORDERS, initialOrders),
  )
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() => {
    const loaded = getStored<BlogPost[]>(
      STORAGE_KEYS.BLOG_POSTS,
      initialBlogPosts,
    )
    return Array.isArray(loaded) && loaded.length > 0
      ? loaded
      : initialBlogPosts
  })
  const [inquiries, setInquiries] = useState<Inquiry[]>(() =>
    getStored(STORAGE_KEYS.INQUIRIES, initialInquiries),
  )
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const loaded = getStored(STORAGE_KEYS.SETTINGS, initialSettings)
    return {
      ...initialSettings,
      announcementText:
        loaded.announcementText ||
        "FREE ISLANDWIDE DELIVERY ON ORDERS OVER RS 1,500 ⚡ SNEAKER RESTORATION ATELIER OPEN",
      ...loaded,
      featuredDrop: loaded.featuredDrop || initialSettings.featuredDrop,
    }
  })
  const [cart, setCart] = useState<CartItem[]>(() =>
    getStored(STORAGE_KEYS.CART, []),
  )
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [prefilledServiceId, setPrefilledServiceId] = useState<string | null>(
    null,
  )
  const [isHydrating, setIsHydrating] = useState(true)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)

  // Live synchronized refs to eliminate closure stale-state bugs in mutations
  const productsRef = useRef<Product[]>(products)
  const servicesRef = useRef<Service[]>(services)
  const bookingsRef = useRef<BookingItem[]>(bookings)
  const ordersRef = useRef<OrderItem[]>(orders)
  const blogPostsRef = useRef<BlogPost[]>(blogPosts)
  const inquiriesRef = useRef<Inquiry[]>(inquiries)
  const settingsRef = useRef<StoreSettings>(settings)

  useEffect(() => {
    productsRef.current = products
  }, [products])
  useEffect(() => {
    servicesRef.current = services
  }, [services])
  useEffect(() => {
    bookingsRef.current = bookings
  }, [bookings])
  useEffect(() => {
    ordersRef.current = orders
  }, [orders])
  useEffect(() => {
    blogPostsRef.current = blogPosts
  }, [blogPosts])
  useEffect(() => {
    inquiriesRef.current = inquiries
  }, [inquiries])
  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  // Sync state changes with localStorage
  useEffect(() => {
    setStored(STORAGE_KEYS.PRODUCTS, products)
  }, [products])
  useEffect(() => {
    setStored(STORAGE_KEYS.SERVICES, services)
  }, [services])
  useEffect(() => {
    setStored(STORAGE_KEYS.BOOKINGS, bookings)
  }, [bookings])
  useEffect(() => {
    setStored(STORAGE_KEYS.ORDERS, orders)
  }, [orders])
  useEffect(() => {
    setStored(STORAGE_KEYS.BLOG_POSTS, blogPosts)
  }, [blogPosts])
  useEffect(() => {
    setStored(STORAGE_KEYS.INQUIRIES, inquiries)
  }, [inquiries])
  useEffect(() => {
    setStored(STORAGE_KEYS.SETTINGS, settings)
  }, [settings])
  useEffect(() => {
    setStored(STORAGE_KEYS.CART, cart)
  }, [cart])

  // Full 7-Entity Cloud Hydration from Neon PostgreSQL
  const fetchCloudData = async () => {
    setIsHydrating(true)
    try {
      const res = await fetch("/api/store?key=all")
      if (!res.ok) return
      const result = await res.json()
      if (!result.success || !result.data) return

      const {
        products: cloudProducts,
        services: cloudServices,
        blog_posts: cloudBlogPosts,
        settings: cloudSettings,
        bookings: cloudBookings,
        orders: cloudOrders,
        inquiries: cloudInquiries,
      } = result.data

      if (Array.isArray(cloudProducts)) {
        // Defensive sanitization: ensure prod-5 includes ["S", "M", "L", "XL", "2XL", "XXL"]
        const sanitizedCloudProducts = cloudProducts.map((p: any) => {
          if (p && p.id === "prod-5") {
            const sizes = Array.isArray(p.sizes) ? p.sizes : []
            const has2XL = sizes.includes("2XL")
            const hasXXL = sizes.includes("XXL")
            if (!has2XL || !hasXXL) {
              const merged = Array.from(
                new Set([...sizes, "S", "M", "L", "XL", "2XL", "XXL"]),
              )
              return { ...p, sizes: merged }
            }
          }
          if (p && p.id === "prod-brace-heritage") {
            const cloudViews = Array.isArray(p.views) ? p.views : []
            const canonicalViews = heritageBraceletProduct.views || []
            const existingUrls = new Set(cloudViews.map((v: any) => v.url))
            const missingViews = canonicalViews.filter(
              (v: any) => !existingUrls.has(v.url),
            )
            if (missingViews.length > 0) {
              const mergedViews = [...cloudViews, ...missingViews]
              const mergedImages = Array.from(
                new Set([
                  ...(p.images || []),
                  ...(heritageBraceletProduct.images || []),
                ]),
              )
              return { ...p, views: mergedViews, images: mergedImages }
            }
          }
          return p
        })

        if (sanitizedCloudProducts.length === 0) {
          // Cloud catalog was empty, seed with initial canonical products
          setProducts(initialProducts)
          productsRef.current = initialProducts
          syncToCloud("products", initialProducts)
        } else {
          // Cloud has products: merge any missing canonical products into cloud data without overriding cloud attributes
          const cloudIds = new Set(sanitizedCloudProducts.map((p: any) => p.id))
          const missingCanonical = initialProducts.filter(
            (p) => !cloudIds.has(p.id),
          )
          if (missingCanonical.length > 0) {
            const fullCanonical = [
              ...sanitizedCloudProducts,
              ...missingCanonical,
            ]
            setProducts(fullCanonical)
            productsRef.current = fullCanonical
            syncToCloud("products", fullCanonical)
          } else {
            setProducts(sanitizedCloudProducts)
            productsRef.current = sanitizedCloudProducts
          }
        }
      }
      if (Array.isArray(cloudServices)) {
        if (cloudServices.length === 0) {
          setServices(initialServices)
          servicesRef.current = initialServices
          syncToCloud("services", initialServices)
        } else {
          setServices(cloudServices)
          servicesRef.current = cloudServices
        }
      }
      if (Array.isArray(cloudBlogPosts)) {
        if (cloudBlogPosts.length === 0) {
          setBlogPosts(initialBlogPosts)
          blogPostsRef.current = initialBlogPosts
          syncToCloud("blog_posts", initialBlogPosts)
        } else {
          setBlogPosts(cloudBlogPosts)
          blogPostsRef.current = cloudBlogPosts
        }
      }
      if (
        cloudSettings &&
        typeof cloudSettings === "object" &&
        Object.keys(cloudSettings).length > 0
      ) {
        setSettings((prev) => {
          const next = {
            ...prev,
            ...cloudSettings,
            announcementText:
              cloudSettings.announcementText !== undefined
                ? cloudSettings.announcementText
                : prev.announcementText ||
                  "FREE ISLANDWIDE DELIVERY ON ORDERS OVER RS 1,500 ⚡ SNEAKER RESTORATION ATELIER OPEN",
            featuredDrop:
              cloudSettings.featuredDrop ||
              prev.featuredDrop ||
              initialSettings.featuredDrop,
          }
          settingsRef.current = next
          return next
        })
      }
      if (Array.isArray(cloudBookings)) {
        setBookings((prev) => {
          const cloudIds = new Set(cloudBookings.map((b) => b.id))
          const recentLocal = prev.filter((b) => {
            if (cloudIds.has(b.id)) return false
            const ageMs = Date.now() - new Date(b.createdAt || 0).getTime()
            return !isNaN(ageMs) && ageMs < 60000
          })
          const merged = [...recentLocal, ...cloudBookings]
          bookingsRef.current = merged
          return merged
        })
      }
      if (Array.isArray(cloudOrders)) {
        setOrders((prev) => {
          const cloudIds = new Set(cloudOrders.map((o) => o.id))
          const recentLocal = prev.filter((o) => {
            if (cloudIds.has(o.id)) return false
            const ageMs = Date.now() - new Date(o.createdAt || 0).getTime()
            return !isNaN(ageMs) && ageMs < 60000
          })
          const merged = [...recentLocal, ...cloudOrders]
          ordersRef.current = merged
          return merged
        })
      }
      if (Array.isArray(cloudInquiries)) {
        setInquiries((prev) => {
          const cloudIds = new Set(cloudInquiries.map((i) => i.id))
          const recentLocal = prev.filter((i) => {
            if (cloudIds.has(i.id)) return false
            const created = (i as any).createdAt || i.date
            const ageMs = Date.now() - new Date(created || 0).getTime()
            return !isNaN(ageMs) && ageMs < 60000
          })
          const merged = [...recentLocal, ...cloudInquiries]
          inquiriesRef.current = merged
          return merged
        })
      }
      setLastSyncedAt(new Date())
    } catch (err) {
      console.warn("[StoreContext] Could not fetch store data from cloud:", err)
    } finally {
      setIsHydrating(false)
    }
  }

  // Multi-device sync: Revalidate with Neon cloud on mount, focus, tab visibility, and 30s background polling
  useEffect(() => {
    fetchCloudData()

    const handleFocusOrVisible = () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        fetchCloudData()
      }
    }

    window.addEventListener("focus", handleFocusOrVisible)
    document.addEventListener("visibilitychange", handleFocusOrVisible)

    // Periodic 30s background poll so open devices stay continuously in sync
    const interval = setInterval(() => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        fetchCloudData()
      }
    }, 30000)

    return () => {
      window.removeEventListener("focus", handleFocusOrVisible)
      document.removeEventListener("visibilitychange", handleFocusOrVisible)
      clearInterval(interval)
    }
  }, [])

  // Toast Helpers
  const showToast = (
    title: string,
    message: string,
    type: ToastMessage["type"] = "success",
  ) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, title, message, type }])
    setTimeout(() => {
      removeToast(id)
    }, 4000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // Cart operations
  const addToCart = (
    product: Product,
    quantity = 1,
    size?: string,
    customName?: string,
    selectedPrice?: number,
    priceOptionLabel?: string,
  ) => {
    const formattedCustomName = customName?.trim()
      ? customName.trim().toUpperCase()
      : undefined
    const extraPrice = formattedCustomName ? product.customNamePrice || 50 : 0
    const basePrice =
      selectedPrice !== undefined ? selectedPrice : product.price
    const finalPrice = basePrice + extraPrice

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.productId === product.id &&
          (item.size || "") === (size || "") &&
          (item.customName || "") === (formattedCustomName || "") &&
          (item.priceOptionLabel || "") === (priceOptionLabel || ""),
      )
      if (existingIndex > -1) {
        const next = [...prev]
        next[existingIndex].quantity += quantity
        return next
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price: finalPrice,
            quantity,
            size,
            img: product.img,
            customName: formattedCustomName,
            priceOptionLabel,
          },
        ]
      }
    })
    showToast(
      "Added to Cart",
      `${product.name} ${size ? `(${size})` : ""}${
        priceOptionLabel ? ` [${priceOptionLabel}]` : ""
      }${
        formattedCustomName ? ` [Custom: "${formattedCustomName}"]` : ""
      } was added.`,
    )
  }

  const removeFromCart = (
    productId: string,
    size?: string,
    customName?: string,
    priceOptionLabel?: string,
  ) => {
    const formattedCustomName = customName?.trim()
      ? customName.trim().toUpperCase()
      : undefined
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.productId === productId &&
            (item.size || "") === (size || "") &&
            (item.customName || "") === (formattedCustomName || "") &&
            (item.priceOptionLabel || "") === (priceOptionLabel || "")
          ),
      ),
    )
  }

  const updateCartQuantity = (
    productId: string,
    quantity: number,
    size?: string,
    customName?: string,
    priceOptionLabel?: string,
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, customName, priceOptionLabel)
      return
    }
    const formattedCustomName = customName?.trim()
      ? customName.trim().toUpperCase()
      : undefined
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId &&
        (item.size || "") === (size || "") &&
        (item.customName || "") === (formattedCustomName || "") &&
        (item.priceOptionLabel || "") === (priceOptionLabel || "")
          ? { ...item, quantity }
          : item,
      ),
    )
  }

  const clearCart = () => setCart([])

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cart])

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  // Bookings
  const addBooking = async (
    bookingData: Omit<BookingItem, "id" | "createdAt" | "status">,
  ): Promise<BookingItem> => {
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const newBooking: BookingItem = {
      ...bookingData,
      id: `BK-${randomNum}`,
      status: "Pending",
      createdAt: new Date().toISOString(),
    }

    // Persist to Neon DB first; if it throws, error bubbles to caller
    const savedRecord = await persistPublicRecord("bookings", newBooking)

    // Commit to local state only upon successful persistence
    setBookings((prev) => {
      if (prev.some((b) => b.id === savedRecord.id)) return prev
      return [savedRecord, ...prev]
    })
    showToast(
      "Booking Confirmed!",
      `Your booking reference is #${savedRecord.id}.`,
    )
    return savedRecord
  }

  const updateBookingStatus = (id: string, status: BookingItem["status"]) => {
    const next = bookingsRef.current.map((b) =>
      b.id === id ? { ...b, status } : b,
    )
    bookingsRef.current = next
    setBookings(next)
    syncToCloud("bookings", next)
    showToast(
      "Booking Updated",
      `Booking #${id} status changed to ${status}.`,
      "info",
    )
  }

  const deleteBooking = (id: string) => {
    const next = bookingsRef.current.filter((b) => b.id !== id)
    bookingsRef.current = next
    setBookings(next)
    syncToCloud("bookings", next)
    showToast("Booking Deleted", `Booking #${id} has been removed.`, "info")
  }

  // Orders
  const createOrder = async (orderData: {
    customer: string
    email: string
    phone: string
    address: string
    city: string
    paymentMethod: OrderItem["paymentMethod"]
  }): Promise<OrderItem> => {
    if (cart.length === 0) {
      throw new Error("Cannot place an order with an empty shopping bag.")
    }

    const randomNum = Math.floor(100 + Math.random() * 900)
    const summary = cart
      .map(
        (i) =>
          `${i.name}${i.size ? ` [${i.size}]` : ""}${
            i.priceOptionLabel ? ` [${i.priceOptionLabel}]` : ""
          }${
            i.customName ? ` [Custom: "${i.customName}"]` : ""
          } (x${i.quantity})`,
      )
      .join(", ")
    const totalAmount =
      cartTotal +
      (cartTotal >= settings.freeDeliveryThreshold ? 0 : settings.deliveryFee)

    const newOrder: OrderItem = {
      id: `ORD-${randomNum}`,
      customer: orderData.customer,
      email: orderData.email,
      phone: orderData.phone,
      address: orderData.address,
      city: orderData.city,
      items: [...cart],
      itemSummary: summary,
      totalAmount,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: "Paid",
      status: "Processing",
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      createdAt: new Date().toISOString(),
    }

    // Persist to Neon DB first; if it throws, error bubbles to caller
    const savedRecord = await persistPublicRecord("orders", newOrder)

    // Commit to local state and clear cart only upon successful persistence
    const next = [savedRecord, ...ordersRef.current]
    ordersRef.current = next
    setOrders(next)
    clearCart()
    // NOTE: Do not call setIsCartOpen(false) here - allows CartDrawer to display order confirmation view
    showToast(
      "Order Placed Successfully!",
      `Order #${savedRecord.id} has been recorded.`,
    )
    return savedRecord
  }

  const updateOrderStatus = (id: string, status: OrderItem["status"]) => {
    const next = ordersRef.current.map((o) =>
      o.id === id ? { ...o, status } : o,
    )
    ordersRef.current = next
    setOrders(next)
    syncToCloud("orders", next)
    showToast(
      "Order Updated",
      `Order #${id} status updated to ${status}.`,
      "info",
    )
  }

  const updateOrderPaymentStatus = (
    id: string,
    paymentStatus: "Paid" | "Pending" | "Refunded",
  ) => {
    const next = ordersRef.current.map((o) =>
      o.id === id ? { ...o, paymentStatus } : o,
    )
    ordersRef.current = next
    setOrders(next)
    syncToCloud("orders", next)
    showToast(
      "Payment Status Updated",
      `Order #${id} payment status set to ${paymentStatus}.`,
      "info",
    )
  }

  const deleteOrder = (id: string) => {
    const next = ordersRef.current.filter((o) => o.id !== id)
    ordersRef.current = next
    setOrders(next)
    syncToCloud("orders", next)
    showToast("Order Deleted", `Order #${id} removed.`, "info")
  }

  // Services
  const addService = (serviceData: Omit<Service, "id">): Service => {
    const id = serviceData.title.toLowerCase().replace(/[^a-z0-9]/g, "-")
    const newService: Service = { ...serviceData, id }
    const next = [...servicesRef.current, newService]
    servicesRef.current = next
    setServices(next)
    syncToCloud("services", next)
    showToast("Service Added", `Service "${newService.title}" created.`)
    return newService
  }

  const updateService = (id: string, updated: Partial<Service>) => {
    const next = servicesRef.current.map((s) =>
      s.id === id ? { ...s, ...updated } : s,
    )
    servicesRef.current = next
    setServices(next)
    syncToCloud("services", next)
    showToast("Service Saved", "Service details updated.")
  }

  const deleteService = (id: string) => {
    const next = servicesRef.current.filter((s) => s.id !== id)
    servicesRef.current = next
    setServices(next)
    syncToCloud("services", next)
    showToast("Service Removed", "Service deleted.", "info")
  }

  // Products
  const addProduct = (prodData: Omit<Product, "id">): Product => {
    const id = `prod-${Date.now().toString().slice(-4)}`
    const newProduct: Product = { ...prodData, id }
    const next = [newProduct, ...productsRef.current]
    productsRef.current = next
    setProducts(next)
    syncToCloud("products", next)
    showToast("Product Added", `Product "${newProduct.name}" added to catalog.`)
    return newProduct
  }

  const updateProduct = (id: string, updated: Partial<Product>) => {
    const next = productsRef.current.map((p) =>
      p.id === id ? { ...p, ...updated } : p,
    )
    productsRef.current = next
    setProducts(next)
    syncToCloud("products", next)
    showToast("Product Updated", "Product catalog entry updated.")
  }

  const updateProductsBatch = (
    updates: { id: string changes: Partial<Product> }[],
  ) => {
    const map = new Map(updates.map((u) => [u.id, u.changes]))
    const next = productsRef.current.map((p) => {
      const changes = map.get(p.id)
      return changes ? { ...p, ...changes } : p
    })
    productsRef.current = next
    setProducts(next)
    syncToCloud("products", next)
    showToast(
      "Batch Updated",
      "Product prices & inventory updated successfully.",
    )
  }

  const deleteProduct = (id: string) => {
    const next = productsRef.current.filter((p) => p.id !== id)
    productsRef.current = next
    setProducts(next)
    syncToCloud("products", next)
    showToast("Product Deleted", "Product removed from catalog.", "info")
  }

  // Blog Posts
  const addBlogPost = (postData: Omit<BlogPost, "id">): BlogPost => {
    const id = `post-${Date.now().toString().slice(-4)}`
    const newPost: BlogPost = { status: "published", ...postData, id }
    const next = [newPost, ...blogPostsRef.current]
    blogPostsRef.current = next
    setBlogPosts(next)
    syncToCloud("blog_posts", next)
    showToast("Blog Published", `Article "${newPost.title}" published.`)
    return newPost
  }

  const updateBlogPost = (id: string, updated: Partial<BlogPost>) => {
    const next = blogPostsRef.current.map((b) =>
      b.id === id ? { ...b, ...updated } : b,
    )
    blogPostsRef.current = next
    setBlogPosts(next)
    syncToCloud("blog_posts", next)
    showToast("Article Saved", "Blog post updated.")
  }

  const deleteBlogPost = (id: string) => {
    const next = blogPostsRef.current.filter((b) => b.id !== id)
    blogPostsRef.current = next
    setBlogPosts(next)
    syncToCloud("blog_posts", next)
    showToast("Article Deleted", "Post removed.", "info")
  }

  // Inquiries
  const addInquiry = async (
    inquiryData: Omit<Inquiry, "id" | "date" | "read">,
  ): Promise<Inquiry> => {
    const id = `INQ-${Math.floor(100 + Math.random() * 900)}`
    const newInquiry: Inquiry = {
      ...inquiryData,
      id,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      read: false,
    }

    // Persist to Neon DB first; if it throws, error bubbles to caller
    const savedRecord = await persistPublicRecord("inquiries", newInquiry)

    // Commit to local state only upon successful persistence
    const next = [savedRecord, ...inquiriesRef.current]
    inquiriesRef.current = next
    setInquiries(next)
    showToast(
      "Message Sent!",
      "Thank you for reaching out. We will get back to you shortly.",
    )
    return savedRecord
  }

  const markInquiryAsRead = (id: string, read = true) => {
    const next = inquiriesRef.current.map((inq) =>
      inq.id === id ? { ...inq, read } : inq,
    )
    inquiriesRef.current = next
    setInquiries(next)
    syncToCloud("inquiries", next)
  }

  const respondToInquiry = async (id: string, response: string) => {
    const respondedAt = new Date().toISOString()
    const next = inquiriesRef.current.map((inq) =>
      inq.id === id ? { ...inq, response, respondedAt, read: true } : inq,
    )
    inquiriesRef.current = next
    setInquiries(next)
    await syncToCloud("inquiries", next)
    showToast("Response Logged", `Response saved for inquiry #${id}.`)
  }

  const deleteInquiry = (id: string) => {
    const next = inquiriesRef.current.filter((inq) => inq.id !== id)
    inquiriesRef.current = next
    setInquiries(next)
    syncToCloud("inquiries", next)
    showToast("Inquiry Deleted", "Message removed.", "info")
  }

  // Settings
  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    const next: StoreSettings = { ...settingsRef.current, ...newSettings }
    settingsRef.current = next
    setSettings(next)
    syncToCloud("settings", next)
    showToast("Settings Saved", "Store configuration updated.")
  }

  const resetAllData = () => {
    productsRef.current = initialProducts
    servicesRef.current = initialServices
    bookingsRef.current = initialBookings
    ordersRef.current = initialOrders
    blogPostsRef.current = initialBlogPosts
    inquiriesRef.current = initialInquiries
    settingsRef.current = initialSettings
    setProducts(initialProducts)
    setServices(initialServices)
    setBookings(initialBookings)
    setOrders(initialOrders)
    setBlogPosts(initialBlogPosts)
    setInquiries(initialInquiries)
    setSettings(initialSettings)
    setCart([])
    localStorage.clear()
    syncToCloud("products", initialProducts)
    syncToCloud("services", initialServices)
    syncToCloud("blog_posts", initialBlogPosts)
    syncToCloud("settings", initialSettings)
    showToast(
      "Reset Complete",
      "All data has been restored to default seeds.",
      "info",
    )
  }

  // Aggregated Customers calculation
  const customers = useMemo<CustomerSummary[]>(() => {
    const customerMap = new Map<string, {
      name: string
      email: string
      phone: string
      bookingsCount: number
      ordersCount: number
      totalSpent: number
      joinedDate: string
    }>()

    // From bookings (excluding cancelled bookings)
    ;(bookings || []).forEach((b) => {
      const key = (b.email || b.customer || "").toLowerCase()
      if (!key) return
      const existing = customerMap.get(key) || {
        name: b.customer || "Anonymous",
        email: b.email || "",
        phone: b.phone || "",
        bookingsCount: 0,
        ordersCount: 0,
        totalSpent: 0,
        joinedDate: (b.createdAt || new Date().toISOString()).split("T")[0],
      }
      existing.bookingsCount += 1
      if (b.status !== "Cancelled") {
        existing.totalSpent += b.priceNumeric || 300
      }
      customerMap.set(key, existing)
    })

    // From orders (excluding cancelled orders)
    ;(orders || []).forEach((o) => {
      const key = (o.email || o.customer || "").toLowerCase()
      if (!key) return
      const existing = customerMap.get(key) || {
        name: o.customer || "Anonymous",
        email: o.email || "",
        phone: o.phone || "",
        bookingsCount: 0,
        ordersCount: 0,
        totalSpent: 0,
        joinedDate: (o.createdAt || new Date().toISOString()).split("T")[0],
      }
      existing.ordersCount += 1
      if (o.status !== "Cancelled") {
        existing.totalSpent += o.totalAmount || 0
      }
      customerMap.set(key, existing)
    })

    return Array.from(customerMap.values()).map((c) => {
      const totalActivities = c.bookingsCount + c.ordersCount
      const status: "Active" | "VIP" | "New" =
        c.totalSpent > 3000 || totalActivities >= 3
          ? "VIP"
          : totalActivities >= 2
            ? "Active"
            : "New"
      return {
        ...c,
        status,
      }
    })
  }, [bookings, orders])

  return (
    <StoreContext.Provider
      value={{
        products,
        services,
        bookings,
        orders,
        blogPosts,
        inquiries,
        settings,
        cart,
        isCartOpen,
        toasts,
        customers,
        isHydrating,
        lastSyncedAt,
        prefilledServiceId,
        setPrefilledServiceId,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        cartCount,
        addBooking,
        updateBookingStatus,
        deleteBooking,
        createOrder,
        updateOrderStatus,
        updateOrderPaymentStatus,
        deleteOrder,
        addService,
        updateService,
        deleteService,
        addProduct,
        updateProduct,
        updateProductsBatch,
        deleteProduct,
        addBlogPost,
        updateBlogPost,
        deleteBlogPost,
        addInquiry,
        markInquiryAsRead,
        respondToInquiry,
        deleteInquiry,
        updateSettings,
        resetAllData,
        showToast,
        removeToast,
        refreshCloudData: fetchCloudData,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider")
  }
  return context
}
