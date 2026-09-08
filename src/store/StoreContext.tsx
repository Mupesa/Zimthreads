import React, {
  createContext,
  useContext,
  useState,
  useEffect,
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
} from "./seedData"

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

interface StoreContextType {
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

  // Selected item for booking prefill
  prefilledServiceId: string | null
  setPrefilledServiceId: (id: string | null) => void

  // Cart actions
  setIsCartOpen: (open: boolean) => void
  addToCart: (product: Product, quantity?: number, size?: string) => void
  removeFromCart: (productId: string, size?: string) => void
  updateCartQuantity: (
    productId: string,
    quantity: number,
    size?: string,
  ) => void
  clearCart: () => void
  cartTotal: number
  cartCount: number

  // Booking actions
  addBooking: (
    booking: Omit<BookingItem, "id" | "createdAt" | "status">,
  ) => BookingItem
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
  }) => OrderItem
  updateOrderStatus: (id: string, status: OrderItem["status"]) => void
  deleteOrder: (id: string) => void

  // Service actions
  addService: (service: Omit<Service, "id">) => Service
  updateService: (id: string, service: Partial<Service>) => void
  deleteService: (id: string) => void

  // Product actions
  addProduct: (product: Omit<Product, "id">) => Product
  updateProduct: (id: string, product: Partial<Product>) => void
  deleteProduct: (id: string) => void

  // Blog actions
  addBlogPost: (post: Omit<BlogPost, "id">) => BlogPost
  updateBlogPost: (id: string, post: Partial<BlogPost>) => void
  deleteBlogPost: (id: string) => void

  // Inquiry actions
  addInquiry: (inquiry: Omit<Inquiry, "id" | "date" | "read">) => void
  markInquiryAsRead: (id: string, read?: boolean) => void
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
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

const STORAGE_KEYS = {
  PRODUCTS: "zimthread_products_v6",
  SERVICES: "zimthread_services_v6",
  BOOKINGS: "zimthread_bookings_v6",
  ORDERS: "zimthread_orders_v6",
  BLOG_POSTS: "zimthread_blog_posts_v6",
  INQUIRIES: "zimthread_inquiries_v6",
  SETTINGS: "zimthread_settings_v6",
  CART: "zimthread_cart_v6",
}

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : fallback
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

export const StoreProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const loaded = getStored(STORAGE_KEYS.PRODUCTS, initialProducts)
    return loaded.map((p) => {
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
      return p
    })
  })
  const [services, setServices] = useState<Service[]>(() => {
    const loaded = getStored(STORAGE_KEYS.SERVICES, initialServices)
    return loaded.map((s) => {
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
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() =>
    getStored(STORAGE_KEYS.BLOG_POSTS, initialBlogPosts),
  )
  const [inquiries, setInquiries] = useState<Inquiry[]>(() =>
    getStored(STORAGE_KEYS.INQUIRIES, initialInquiries),
  )
  const [settings, setSettings] = useState<StoreSettings>(() =>
    getStored(STORAGE_KEYS.SETTINGS, initialSettings),
  )
  const [cart, setCart] = useState<CartItem[]>(() =>
    getStored(STORAGE_KEYS.CART, []),
  )
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [prefilledServiceId, setPrefilledServiceId] = useState<string | null>(
    null,
  )

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
  const addToCart = (product: Product, quantity = 1, size?: string) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === product.id && item.size === size,
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
            price: product.price,
            quantity,
            size,
            img: product.img,
          },
        ]
      }
    })
    showToast(
      "Added to Cart",
      `${product.name} ${size ? `(${size})` : ""} was added.`,
    )
  }

  const removeFromCart = (productId: string, size?: string) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.productId === productId && item.size === size),
      ),
    )
  }

  const updateCartQuantity = (
    productId: string,
    quantity: number,
    size?: string,
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, size)
      return
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId && item.size === size
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
  const addBooking = (
    bookingData: Omit<BookingItem, "id" | "createdAt" | "status">,
  ): BookingItem => {
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const newBooking: BookingItem = {
      ...bookingData,
      id: `BK-${randomNum}`,
      status: "Pending",
      createdAt: new Date().toISOString(),
    }
    setBookings((prev) => [newBooking, ...prev])
    showToast(
      "Booking Confirmed!",
      `Your booking reference is #${newBooking.id}.`,
    )
    return newBooking
  }

  const updateBookingStatus = (id: string, status: BookingItem["status"]) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)))
    showToast(
      "Booking Updated",
      `Booking #${id} status changed to ${status}.`,
      "info",
    )
  }

  const deleteBooking = (id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id))
    showToast("Booking Deleted", `Booking #${id} has been removed.`, "info")
  }

  // Orders
  const createOrder = (orderData: {
    customer: string
    email: string
    phone: string
    address: string
    city: string
    paymentMethod: OrderItem["paymentMethod"]
  }): OrderItem => {
    const randomNum = Math.floor(100 + Math.random() * 900)
    const summary = cart
      .map((i) => `${i.name}${i.size ? ` [${i.size}]` : ""} (x${i.quantity})`)
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
      status: "Processing",
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      createdAt: new Date().toISOString(),
    }

    setOrders((prev) => [newOrder, ...prev])
    clearCart()
    setIsCartOpen(false)
    showToast(
      "Order Placed Successfully!",
      `Order #${newOrder.id} has been recorded.`,
    )
    return newOrder
  }

  const updateOrderStatus = (id: string, status: OrderItem["status"]) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
    showToast(
      "Order Updated",
      `Order #${id} status updated to ${status}.`,
      "info",
    )
  }

  const deleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id))
    showToast("Order Deleted", `Order #${id} removed.`, "info")
  }

  // Services
  const addService = (serviceData: Omit<Service, "id">): Service => {
    const id = serviceData.title.toLowerCase().replace(/[^a-z0-9]/g, "-")
    const newService: Service = { ...serviceData, id }
    setServices((prev) => [...prev, newService])
    showToast("Service Added", `Service "${newService.title}" created.`)
    return newService
  }

  const updateService = (id: string, updated: Partial<Service>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated } : s)),
    )
    showToast("Service Saved", "Service details updated.")
  }

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id))
    showToast("Service Removed", "Service deleted.", "info")
  }

  // Products
  const addProduct = (prodData: Omit<Product, "id">): Product => {
    const id = `prod-${Date.now().toString().slice(-4)}`
    const newProduct: Product = { ...prodData, id }
    setProducts((prev) => [newProduct, ...prev])
    showToast("Product Added", `Product "${newProduct.name}" added to catalog.`)
    return newProduct
  }

  const updateProduct = (id: string, updated: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    )
    showToast("Product Updated", "Product catalog entry updated.")
  }

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
    showToast("Product Deleted", "Product removed from catalog.", "info")
  }

  // Blog Posts
  const addBlogPost = (postData: Omit<BlogPost, "id">): BlogPost => {
    const id = `post-${Date.now().toString().slice(-4)}`
    const newPost: BlogPost = { ...postData, id }
    setBlogPosts((prev) => [newPost, ...prev])
    showToast("Blog Published", `Article "${newPost.title}" published.`)
    return newPost
  }

  const updateBlogPost = (id: string, updated: Partial<BlogPost>) => {
    setBlogPosts((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updated } : b)),
    )
    showToast("Article Saved", "Blog post updated.")
  }

  const deleteBlogPost = (id: string) => {
    setBlogPosts((prev) => prev.filter((b) => b.id !== id))
    showToast("Article Deleted", "Post removed.", "info")
  }

  // Inquiries
  const addInquiry = (inquiryData: Omit<Inquiry, "id" | "date" | "read">) => {
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
    setInquiries((prev) => [newInquiry, ...prev])
    showToast(
      "Message Sent!",
      "Thank you for reaching out. We will get back to you shortly.",
    )
  }

  const markInquiryAsRead = (id: string, read = true) => {
    setInquiries((prev) =>
      prev.map((inq) => (inq.id === id ? { ...inq, read } : inq)),
    )
  }

  const deleteInquiry = (id: string) => {
    setInquiries((prev) => prev.filter((inq) => inq.id !== id))
    showToast("Inquiry Deleted", "Message removed.", "info")
  }

  // Settings
  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
    showToast("Settings Saved", "Store configuration updated.")
  }

  const resetAllData = () => {
    setProducts(initialProducts)
    setServices(initialServices)
    setBookings(initialBookings)
    setOrders(initialOrders)
    setBlogPosts(initialBlogPosts)
    setInquiries(initialInquiries)
    setSettings(initialSettings)
    setCart([])
    localStorage.clear()
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

    // From bookings
    bookings.forEach((b) => {
      const key = (b.email || b.customer).toLowerCase()
      const existing = customerMap.get(key) || {
        name: b.customer,
        email: b.email,
        phone: b.phone,
        bookingsCount: 0,
        ordersCount: 0,
        totalSpent: 0,
        joinedDate: b.createdAt.split("T")[0],
      }
      existing.bookingsCount += 1
      existing.totalSpent += b.priceNumeric || 15
      customerMap.set(key, existing)
    })

    // From orders
    orders.forEach((o) => {
      const key = (o.email || o.customer).toLowerCase()
      const existing = customerMap.get(key) || {
        name: o.customer,
        email: o.email,
        phone: o.phone,
        bookingsCount: 0,
        ordersCount: 0,
        totalSpent: 0,
        joinedDate: o.createdAt.split("T")[0],
      }
      existing.ordersCount += 1
      existing.totalSpent += o.totalAmount
      customerMap.set(key, existing)
    })

    return Array.from(customerMap.values()).map((c) => {
      const totalActivities = c.bookingsCount + c.ordersCount
      const status: "Active" | "VIP" | "New" =
        c.totalSpent > 60 || totalActivities >= 3
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
        deleteOrder,
        addService,
        updateService,
        deleteService,
        addProduct,
        updateProduct,
        deleteProduct,
        addBlogPost,
        updateBlogPost,
        deleteBlogPost,
        addInquiry,
        markInquiryAsRead,
        deleteInquiry,
        updateSettings,
        resetAllData,
        showToast,
        removeToast,
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
