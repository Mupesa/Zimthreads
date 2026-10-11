import { useState, useMemo, useEffect } from "react"
import { Link } from "@/router"
import { useStore } from "@/store/StoreContext"
import {
  BookingItem,
  OrderItem,
  Product,
  PriceOption,
  Service,
  BlogPost,
  Inquiry,
  initialSettings,
  FeaturedDropBanner,
} from "@/store/seedData"
import {
  DashboardIcon,
  CalendarIcon,
  BoxIcon,
  BrushIcon,
  BagIcon,
  ArticleIcon,
  UsersIcon,
  MailIcon,
  SettingsIcon,
  DollarIcon,
  LockIcon,
  AlertTriangleIcon,
  MenuIcon,
  CheckIcon,
  SparklesIcon,
  WhatsAppIcon,
} from "@/components/Icons"
import ImageUploader from "@/components/ImageUploader"
import {
  getCloudinaryConfig,
  saveCloudinaryConfig,
  testCloudinaryConnection,
} from "@/lib/cloudinary"
import { getWhatsAppUrl } from "@/lib/whatsapp"

type Section = "dashboard" | "bookings" | "orders" | "services" | "products" | "blog" | "customers" | "inquiries" | "settings" | "media"

export default function Dashboard() {
  const {
    bookings,
    orders,
    services,
    products,
    blogPosts,
    inquiries,
    settings,
    customers,
    isHydrating,
    lastSyncedAt,
    refreshCloudData,
    updateBookingStatus,
    deleteBooking,
    addBooking,
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
    markInquiryAsRead,
    respondToInquiry,
    deleteInquiry,
    updateSettings,
    resetAllData,
    showToast,
  } = useStore()

  // Authentication state
  const ADMIN_PASSWORD = "Zimthreads200"
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("zimthread_admin_auth") === "true"
  })
  const [passwordInput, setPasswordInput] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem("zimthread_admin_auth", "true")
      setIsAuthenticated(true)
      setLoginError("")
      setPasswordInput("")
      showToast("Access Granted", "Welcome to the Zimthread Admin Dashboard.")
    } else {
      setLoginError("Invalid admin password. Please try again.")
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("zimthread_admin_auth")
    setIsAuthenticated(false)
    setPasswordInput("")
    showToast("Logged Out", "You have exited the admin session.", "info")
  }

  const [active, setActive] = useState<Section>("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Search & Filter States
  const [bookingFilter, setBookingFilter] = useState("All")
  const [bookingSearch, setBookingSearch] = useState("")
  const [orderFilter, setOrderFilter] = useState("All")
  const [orderSearch, setOrderSearch] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [productCategoryFilter, setProductCategoryFilter] = useState("All")
  const [batchPrices, setBatchPrices] = useState<Record<string, { price: number; stock: number }>>({})
  const [showBatchPricingDesk, setShowBatchPricingDesk] = useState(true)
  const [inquiryFilter, setInquiryFilter] = useState<"All" | "Unread" | "Read">(
    "All",
  )

  // Modals
  const [newBookingModal, setNewBookingModal] = useState(false)
  const [newProductModal, setNewProductModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [newServiceModal, setNewServiceModal] = useState(false)
  const [editService, setEditService] = useState<Service | null>(null)
  const [newBlogModal, setNewBlogModal] = useState(false)
  const [editBlog, setEditBlog] = useState<BlogPost | null>(null)
  const [viewInquiry, setViewInquiry] = useState<Inquiry | null>(null)
  const [inquiryResponseText, setInquiryResponseText] = useState("")
  const [viewOrder, setViewOrder] = useState<OrderItem | null>(null)

  // Form states for creators
  const [isCreatingBooking, setIsCreatingBooking] = useState(false)
  const [bookingError, setBookingError] = useState("")
  const [bookingForm, setBookingForm] = useState({
    customer: "",
    email: "",
    phone: "",
    serviceId: "clean",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    notes: "",
  })

  const [productForm, setProductForm] = useState({
    name: "",
    category: "Cleaning" as Product["category"],
    price: 15,
    stock: 20,
    img: "https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?w=500&h=500&fit=crop&auto=format",
    alt: "Product image",
    description: "",
    sizes: [] as string[],
    customSizeInput: "",
    priceOptions: [] as PriceOption[],
    newPriceLabel: "",
    newPriceValue: "",
    newPriceActive: true,
    featured: false,
    hidden: false,
  })

  // Edit Product auxiliary states for sizes & price options
  const [editProductCustomSize, setEditProductCustomSize] = useState("")
  const [editProductPriceLabel, setEditProductPriceLabel] = useState("")
  const [editProductPriceValue, setEditProductPriceValue] = useState("")
  const [editProductPriceActive, setEditProductPriceActive] = useState(true)

  const openEditProductModal = (product: Product) => {
    setEditProduct({
      ...product,
      sizes: Array.isArray(product.sizes) ? [...product.sizes] : [],
      priceOptions: Array.isArray(product.priceOptions) ? [...product.priceOptions] : [],
    })
    setEditProductCustomSize("")
    setEditProductPriceLabel("")
    setEditProductPriceValue("")
    setEditProductPriceActive(true)
  }

  const [serviceForm, setServiceForm] = useState({
    title: "",
    subtitle: "",
    price: "From Rs 300",
    priceNumeric: 300,
    desc: "",
    features: "Deep clean, Midsole scrub, Deodorize",
    turnaround: "24-48 Hours",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=350&fit=crop&auto=format",
    alt: "Service showcase",
    active: true,
  })

  const [blogForm, setBlogForm] = useState({
    title: "",
    category: "Shoe Care",
    author: "Shepherd Chara",
    readTime: "5 min read",
    status: "published" as "published" | "draft",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=500&fit=crop&auto=format",
    alt: "Article banner",
    excerpt: "",
    content: "",
  })

  const [settingsForm, setSettingsForm] = useState(settings)

  useEffect(() => {
    setSettingsForm(settings)
  }, [settings])

  // Cloudinary Media Studio State
  const [quickMediaUrl, setQuickMediaUrl] = useState("")
  const [mediaFolder, setMediaFolder] = useState("zimthreads/products")
  const [recentUploads, setRecentUploads] = useState<Array<{
    url: string
    timestamp: string
  }>>(() => {
    try {
      const saved = localStorage.getItem("zimthreads_recent_uploads")
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null)
  const [cloudinaryConfigState, setCloudinaryConfigState] = useState(() =>
    getCloudinaryConfig(),
  )
  const [copiedMediaUrl, setCopiedMediaUrl] = useState<string | null>(null)

  const handleMediaUploaded = (url: string) => {
    setQuickMediaUrl(url)
    const newEntry = { url, timestamp: new Date().toLocaleTimeString() }
    const updated = [
      newEntry,
      ...recentUploads.filter((u) => u.url !== url),
    ].slice(0, 16)
    setRecentUploads(updated)
    try {
      localStorage.setItem("zimthreads_recent_uploads", JSON.stringify(updated))
    } catch {}
    showToast("Media Uploaded", "Image sent to Cloudinary CDN successfully.")
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    setConnectionStatus(null)
    const result = await testCloudinaryConnection()
    setTestingConnection(false)
    setConnectionStatus(result.message)
    if (result.success) {
      showToast(
        "Cloudinary Connected",
        "Connection verified with Cloudinary API.",
      )
    } else {
      showToast("Connection Error", result.message, "info")
    }
  }

  const handleSaveCloudinaryConfig = (e: React.FormEvent) => {
    e.preventDefault()
    saveCloudinaryConfig(cloudinaryConfigState)
    showToast("Credentials Saved", "Cloudinary configuration saved to browser.")
  }

  const handleCopyAnyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedMediaUrl(url)
      setTimeout(() => setCopiedMediaUrl(null), 2000)
    } catch {}
  }

  // Navigation Items
  const unreadInquiriesCount = useMemo(
    () => inquiries.filter((i) => !i.read).length,
    [inquiries],
  )
  const pendingBookingsCount = useMemo(
    () => bookings.filter((b) => b.status === "Pending").length,
    [bookings],
  )
  const processingOrdersCount = useMemo(
    () => orders.filter((o) => o.status === "Processing").length,
    [orders],
  )

  const navItems = [
    { icon: DashboardIcon, label: "Dashboard", id: "dashboard", count: null },
    {
      icon: CalendarIcon,
      label: "Bookings",
      id: "bookings",
      count: pendingBookingsCount || null,
    },
    {
      icon: BoxIcon,
      label: "Orders",
      id: "orders",
      count: processingOrdersCount || null,
    },
    { icon: BrushIcon, label: "Services", id: "services", count: null },
    { icon: BagIcon, label: "Products", id: "products", count: null },
    { icon: SparklesIcon, label: "Media Studio", id: "media", count: null },
    { icon: ArticleIcon, label: "Blog Posts", id: "blog", count: null },
    { icon: UsersIcon, label: "Customers", id: "customers", count: null },
    {
      icon: MailIcon,
      label: "Inquiries",
      id: "inquiries",
      count: unreadInquiriesCount || null,
    },
    { icon: SettingsIcon, label: "Settings", id: "settings", count: null },
  ]

  // Calculated Stats
  const stats = useMemo(() => {
    const totalOrderRev = orders.reduce(
      (sum, o) => (o.status !== "Cancelled" ? sum + o.totalAmount : sum),
      0,
    )
    const totalBookingRev = bookings.reduce(
      (sum, b) =>
        b.status !== "Cancelled" ? sum + (b.priceNumeric || 300) : sum,
      0,
    )
    const totalRev = totalOrderRev + totalBookingRev

    return [
      {
        label: "TOTAL REVENUE",
        value: `Rs ${totalRev.toFixed(0)}`,
        sub: `Orders: Rs ${totalOrderRev.toFixed(0)} · Services: Rs ${totalBookingRev.toFixed(0)}`,
        icon: DollarIcon,
      },
      {
        label: "TOTAL BOOKINGS",
        value: `${bookings.length}`,
        sub: `${pendingBookingsCount} Pending Approval`,
        icon: CalendarIcon,
      },
      {
        label: "STORE ORDERS",
        value: `${orders.length}`,
        sub: `${processingOrdersCount} Processing`,
        icon: BoxIcon,
      },
      {
        label: "REGISTERED CLIENTS",
        value: `${customers.length}`,
        sub: "Across Mauritius",
        icon: UsersIcon,
      },
      {
        label: "INQUIRIES",
        value: `${inquiries.length}`,
        sub: `${unreadInquiriesCount} Unread Messages`,
        icon: MailIcon,
      },
    ]
  }, [
    bookings,
    orders,
    customers,
    inquiries,
    pendingBookingsCount,
    processingOrdersCount,
    unreadInquiriesCount,
  ])

  // Handlers for Form Submissions
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingBooking(true)
    setBookingError("")
    try {
      const serviceObj =
        services.find((s) => s.id === bookingForm.serviceId) || services[0]
      await addBooking({
        customer: bookingForm.customer,
        email: bookingForm.email,
        phone: bookingForm.phone,
        serviceId: serviceObj.id,
        serviceName: serviceObj.title,
        price: serviceObj.price,
        priceNumeric: serviceObj.priceNumeric || 300,
        date: bookingForm.date,
        time: bookingForm.time,
        notes: bookingForm.notes,
      })
      setNewBookingModal(false)
      setBookingForm({
        customer: "",
        email: "",
        phone: "",
        serviceId: "clean",
        date: new Date().toISOString().split("T")[0],
        time: "10:00",
        notes: "",
      })
    } catch (err: any) {
      setBookingError(
        err.message || "Failed to create booking. Please try again.",
      )
    } finally {
      setIsCreatingBooking(false)
    }
  }

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault()
    const sizesArray =
      Array.isArray(productForm.sizes) && productForm.sizes.length > 0
        ? productForm.sizes
        : undefined

    const priceOptionsArray =
      Array.isArray(productForm.priceOptions) && productForm.priceOptions.length > 0
        ? productForm.priceOptions
        : undefined

    addProduct({
      name: productForm.name,
      category: productForm.category,
      price: Number(productForm.price),
      priceOptions: priceOptionsArray,
      stock: Number(productForm.stock),
      img: productForm.img,
      alt: productForm.name,
      description: productForm.description,
      sizes: sizesArray,
      featured: productForm.featured,
      hidden: productForm.hidden,
    })
    setNewProductModal(false)
    // Reset productForm
    setProductForm({
      name: "",
      category: "Cleaning",
      price: 15,
      stock: 20,
      img: "https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?w=500&h=500&fit=crop&auto=format",
      alt: "Product image",
      description: "",
      sizes: [],
      customSizeInput: "",
      priceOptions: [],
      newPriceLabel: "",
      newPriceValue: "",
      newPriceActive: true,
      featured: false,
      hidden: false,
    })
  }

  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editProduct) return
    const sizesArray =
      Array.isArray(editProduct.sizes) && editProduct.sizes.length > 0
        ? editProduct.sizes
        : []
    const priceOptionsArray =
      Array.isArray(editProduct.priceOptions) && editProduct.priceOptions.length > 0
        ? editProduct.priceOptions
        : []

    updateProduct(editProduct.id, {
      ...editProduct,
      sizes: sizesArray,
      priceOptions: priceOptionsArray,
    })
    setEditProduct(null)
  }

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault()
    const featuresList = serviceForm.features
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean)

    addService({
      title: serviceForm.title,
      subtitle: serviceForm.subtitle,
      price: serviceForm.price,
      priceNumeric: Number(serviceForm.priceNumeric) || 300,
      desc: serviceForm.desc,
      features: featuresList,
      turnaround: serviceForm.turnaround || "24-48 Hours",
      img: serviceForm.img,
      alt: serviceForm.title,
      active: serviceForm.active,
    })
    setNewServiceModal(false)
    setServiceForm({
      title: "",
      subtitle: "",
      price: "From Rs 300",
      priceNumeric: 300,
      desc: "",
      features: "Deep clean, Midsole scrub, Deodorize",
      turnaround: "24-48 Hours",
      img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=350&fit=crop&auto=format",
      alt: "Service showcase",
      active: true,
    })
  }

  const handleSaveEditService = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editService) return
    updateService(editService.id, editService)
    setEditService(null)
  }

  const handleCreateBlog = (e: React.FormEvent) => {
    e.preventDefault()
    addBlogPost({
      title: blogForm.title,
      category: blogForm.category,
      author: blogForm.author,
      readTime: blogForm.readTime,
      status: blogForm.status || "published",
      img: blogForm.img,
      alt: blogForm.title,
      excerpt: blogForm.excerpt,
      content: blogForm.content,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
    })
    setNewBlogModal(false)
    setBlogForm({
      title: "",
      category: "Shoe Care",
      author: "Shepherd Chara",
      readTime: "5 min read",
      status: "published",
      img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=500&fit=crop&auto=format",
      alt: "Article banner",
      excerpt: "",
      content: "",
    })
  }

  const handleSaveEditBlog = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editBlog) return
    updateBlogPost(editBlog.id, editBlog)
    setEditBlog(null)
  }

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettings(settingsForm)
  }

  // If not authenticated, render dedicated Login Portal
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#111827] text-[#f9fafb] flex flex-col justify-center items-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-[#1f2937] border border-[#374151] p-8 sm:p-10 shadow-2xl animate-scale-up">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[#4a5c2d] rounded-full flex items-center justify-center mx-auto mb-3 text-white">
              <LockIcon className="w-5 h-5" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-wider text-[#f9fafb]">
              ZIMTHREAD ADMIN
            </h1>
            <p className="text-xs text-[#86a84e] uppercase font-bold tracking-widest mt-1">
              Authorized Personnel Only
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangleIcon className="w-4 h-4 text-red-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] mb-1">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value)
                    if (loginError) setLoginError("")
                  }}
                  placeholder="Enter admin password..."
                  className="w-full bg-[#111827] border border-[#374151] px-4 py-3 text-sm text-white focus:outline-none focus:border-[#86a84e] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-xs text-[#9ca3af] hover:text-white"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#4a5c2d] hover:bg-[#5a7038] text-white text-xs font-bold uppercase tracking-widest transition-colors shadow-lg mt-2"
            >
              ACCESS DASHBOARD
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#374151] text-center">
            <Link
              to="/"
              className="text-xs text-[#9ca3af] hover:text-[#86a84e] transition-colors inline-flex items-center gap-1.5"
            >
              Return to Zimthread Storefront
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111827] text-[#f9fafb] flex flex-col font-sans">
      {/* Top bar */}
      <header className="bg-[#1f2937] border-b border-[#374151] h-14 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-1.5 text-[#9ca3af] hover:text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <div>
            <span className="font-display text-lg font-bold tracking-widest uppercase text-[#f9fafb]">
              ZIMTHREAD
            </span>
            <span className="text-xs text-[#86a84e] ml-2 font-mono hidden sm:inline">
              ● Management System
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Cloud Hydration Status & Manual Sync Button */}
          <div className="flex items-center gap-2 bg-[#111827] border border-[#374151] px-2.5 py-1 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isHydrating ? "bg-amber-400 animate-ping" : "bg-emerald-400"
              }`}
            />
            <span className="text-[10px] font-mono text-[#9ca3af] hidden md:inline">
              {isHydrating
                ? "Syncing Cloud..."
                : lastSyncedAt
                  ? `Cloud Live (${lastSyncedAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })})`
                  : "Cloud Live"}
            </span>
            <button
              onClick={() => refreshCloudData()}
              disabled={isHydrating}
              className="text-[#86a84e] hover:text-[#9fc75d] disabled:opacity-50 transition-colors ml-1 font-bold flex items-center gap-1 cursor-pointer"
              title="Refresh from Neon Cloud DB"
            >
              <span
                className={`inline-block ${isHydrating ? "animate-spin" : ""}`}
              >
                ↻
              </span>
              <span className="text-[9px] uppercase tracking-wider hidden sm:inline">
                Refresh
              </span>
            </button>
          </div>

          <button
            onClick={() => setActive("inquiries")}
            className="relative text-[#9ca3af] hover:text-[#f9fafb] p-1.5"
            title="Inquiries"
          >
            <MailIcon className="w-5 h-5" />
            {unreadInquiriesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#86a84e] text-black rounded-full text-[9px] font-bold flex items-center justify-center">
                {unreadInquiriesCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 border-l border-[#374151] pl-4">
            <div className="w-7 h-7 rounded-full bg-[#4a5c2d] flex items-center justify-center text-xs font-bold text-white">
              A
            </div>
            <div className="hidden sm:block text-left leading-none">
              <p className="text-xs font-bold text-[#f9fafb]">Harare HQ</p>
              <p className="text-[10px] text-[#9ca3af]">Super Admin</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-2.5 py-1 bg-red-950/60 border border-red-900/60 hover:bg-red-900 text-red-300 text-[11px] font-bold uppercase tracking-wider transition-colors"
            title="Sign out of admin"
          >
            Logout
          </button>

          <Link
            to="/"
            className="px-3 py-1 bg-[#374151] hover:bg-[#4b5563] text-xs font-semibold uppercase tracking-wider text-[#f9fafb] transition-colors"
          >
            Live Site ↗
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-60 bg-[#1f2937] border-r border-[#374151] flex flex-col pt-14 lg:pt-0 transform transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <nav className="flex-1 py-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActive(item.id as Section)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center justify-between px-5 py-3 text-left transition-colors ${
                  active === item.id
                    ? "bg-[#4a5c2d]/20 text-[#86a84e] border-r-4 border-[#86a84e] font-bold"
                    : "text-[#9ca3af] hover:bg-[#374151] hover:text-[#f9fafb]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`w-4 h-4 shrink-0 ${
                      active === item.id ? "text-[#86a84e]" : "text-[#9ca3af]"
                    }`}
                  />
                  <span className="text-xs font-semibold tracking-widest uppercase">
                    {item.label}
                  </span>
                </div>
                {item.count !== null && (
                  <span className="bg-[#4a5c2d] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-[#374151] bg-[#1a222e]">
            <p className="text-[10px] text-[#6b7280] font-bold uppercase tracking-wider mb-2">
              System Health
            </p>
            <div className="flex items-center gap-2 text-xs text-[#86a84e]">
              <span className="w-2 h-2 rounded-full bg-[#86a84e] animate-ping" />
              <span>Reactive Store Online</span>
            </div>
            <button
              onClick={resetAllData}
              className="mt-3 w-full py-1.5 text-[10px] font-bold tracking-widest uppercase text-[#9ca3af] hover:text-red-400 border border-[#374151] hover:border-red-900 transition-colors"
            >
              Reset Seed Data
            </button>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 lg:hidden backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#111827]">
          {/* ===================== DASHBOARD OVERVIEW ===================== */}
          {active === "dashboard" && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-[#f9fafb]">
                    ADMIN DASHBOARD OVERVIEW
                  </h1>
                  <p className="text-xs text-[#9ca3af]">
                    Realtime metrics across Mauritius studio bookings &
                    e-commerce shop
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewBookingModal(true)}
                    className="px-4 py-2 bg-[#4a5c2d] hover:bg-[#5a7038] text-white text-xs font-bold uppercase tracking-widest transition-colors"
                  >
                    + Log Walk-in Booking
                  </button>
                  <button
                    onClick={() => setNewProductModal(true)}
                    className="px-4 py-2 bg-[#374151] hover:bg-[#4b5563] text-white text-xs font-bold uppercase tracking-widest transition-colors"
                  >
                    + Add Product
                  </button>
                </div>
              </div>

              {/* KPI Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="bg-[#1f2937] border border-[#374151] p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-[#9ca3af]">
                        {s.label}
                      </p>
                      <s.icon className="w-5 h-5 text-[#86a84e]" />
                    </div>
                    <p className="font-display text-3xl font-extrabold text-[#f9fafb]">
                      {s.value}
                    </p>
                    <p className="text-xs text-[#86a84e] mt-1 font-mono">
                      {s.sub}
                    </p>
                  </div>
                ))}
              </div>

              {/* Dual Column: Recent Bookings & Orders */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Bookings */}
                <div className="bg-[#1f2937] border border-[#374151] p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[#f9fafb]">
                        Recent Service Bookings
                      </h2>
                      <button
                        onClick={() => setActive("bookings")}
                        className="text-[10px] font-bold tracking-widest uppercase text-[#86a84e] hover:underline"
                      >
                        View All ({bookings.length}) →
                      </button>
                    </div>

                    <div className="space-y-2">
                      {bookings.length === 0 ? (
                        <div className="p-6 text-center text-xs text-[#9ca3af] bg-[#111827] border border-[#374151]">
                          {isHydrating ? (
                            <div className="flex items-center justify-center gap-2 text-[#86a84e] py-2">
                              <span className="w-2 h-2 rounded-full bg-[#86a84e] animate-ping" />
                              <span>Syncing bookings from Neon Cloud...</span>
                            </div>
                          ) : (
                            <>
                              <p className="mb-1">No bookings recorded yet.</p>
                              <p className="text-[10px] text-[#6b7280]">
                                Test the live flow by booking at{" "}
                                <Link
                                  to="/booking"
                                  className="text-[#86a84e] underline"
                                >
                                  /booking
                                </Link>{" "}
                                or logging a walk-in above.
                              </p>
                            </>
                          )}
                        </div>
                      ) : (
                        bookings.slice(0, 5).map((b) => (
                          <div
                            key={b.id}
                            className="flex items-center justify-between p-3 bg-[#111827] border border-[#374151]"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-[#86a84e]">
                                  {b.id}
                                </span>
                                <span className="text-sm font-semibold text-white truncate">
                                  {b.customer}
                                </span>
                              </div>
                              <p className="text-xs text-[#9ca3af]">
                                {b.serviceName} · {b.date} ({b.time})
                              </p>
                            </div>
                            <select
                              value={b.status}
                              onChange={(e) =>
                                updateBookingStatus(
                                  b.id,
                                  e.target.value as BookingItem["status"],
                                )
                              }
                              className={`text-[10px] font-bold uppercase px-2 py-1 border rounded-none cursor-pointer ${
                                b.status === "Confirmed"
                                  ? "bg-[#4a5c2d]/30 text-[#86a84e] border-[#4a5c2d]"
                                  : b.status === "In Progress"
                                    ? "bg-blue-900/30 text-blue-400 border-blue-700"
                                    : b.status === "Completed"
                                      ? "bg-emerald-900/30 text-emerald-400 border-emerald-700"
                                      : b.status === "Cancelled"
                                        ? "bg-red-900/30 text-red-400 border-red-700"
                                        : "bg-yellow-900/30 text-yellow-400 border-yellow-700"
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-[#1f2937] border border-[#374151] p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[#f9fafb]">
                        Recent Store Orders
                      </h2>
                      <button
                        onClick={() => setActive("orders")}
                        className="text-[10px] font-bold tracking-widest uppercase text-[#86a84e] hover:underline"
                      >
                        View All ({orders.length}) →
                      </button>
                    </div>

                    <div className="space-y-2">
                      {orders.length === 0 ? (
                        <div className="p-6 text-center text-xs text-[#9ca3af] bg-[#111827] border border-[#374151]">
                          {isHydrating ? (
                            <div className="flex items-center justify-center gap-2 text-[#86a84e] py-2">
                              <span className="w-2 h-2 rounded-full bg-[#86a84e] animate-ping" />
                              <span>Syncing orders from Neon Cloud...</span>
                            </div>
                          ) : (
                            <>
                              <p className="mb-1">No orders placed yet.</p>
                              <p className="text-[10px] text-[#6b7280]">
                                Test the cart & checkout flow by purchasing gear at{" "}
                                <Link
                                  to="/shop"
                                  className="text-[#86a84e] underline"
                                >
                                  /shop
                                </Link>
                                .
                              </p>
                            </>
                          )}
                        </div>
                      ) : (
                        orders.slice(0, 5).map((o) => (
                          <div
                            key={o.id}
                            className="flex items-center justify-between p-3 bg-[#111827] border border-[#374151]"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-[#86a84e]">
                                  {o.id}
                                </span>
                                <span className="text-sm font-semibold text-white truncate">
                                  {o.customer}
                                </span>
                                <span className="text-xs font-bold text-[#f9fafb] font-mono">
                                  Rs {o.totalAmount}
                                </span>
                              </div>
                              <p className="text-xs text-[#9ca3af] truncate">
                                {o.itemSummary}
                              </p>
                            </div>
                            <select
                              value={o.status}
                              onChange={(e) =>
                                updateOrderStatus(
                                  o.id,
                                  e.target.value as OrderItem["status"],
                                )
                              }
                              className={`text-[10px] font-bold uppercase px-2 py-1 border rounded-none cursor-pointer ${
                                o.status === "Delivered"
                                  ? "bg-[#4a5c2d]/30 text-[#86a84e] border-[#4a5c2d]"
                                  : o.status === "Shipped"
                                    ? "bg-blue-900/30 text-blue-400 border-blue-700"
                                    : o.status === "Cancelled"
                                      ? "bg-red-900/30 text-red-400 border-red-700"
                                      : "bg-yellow-900/30 text-yellow-400 border-yellow-700"
                              }`}
                            >
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== BOOKINGS SECTION ===================== */}
          {active === "bookings" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-extrabold uppercase text-[#f9fafb]">
                    SERVICE BOOKINGS ({bookings.length})
                  </h1>
                  <p className="text-xs text-[#9ca3af]">
                    Manage sneaker drop-offs, deep cleans, and restoration
                    sessions
                  </p>
                </div>
                <button
                  onClick={() => setNewBookingModal(true)}
                  className="px-4 py-2 bg-[#4a5c2d] hover:bg-[#5a7038] text-white text-xs font-bold uppercase tracking-widest transition-colors self-start"
                >
                  + Create New Booking
                </button>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Search customer, reference, service..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="bg-[#1f2937] border border-[#374151] px-4 py-2 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-[#86a84e] flex-1"
                />
                <div className="flex flex-wrap gap-1">
                  {[
                    "All",
                    "Pending",
                    "Confirmed",
                    "In Progress",
                    "Completed",
                    "Cancelled",
                  ].map((st) => (
                    <button
                      key={st}
                      onClick={() => setBookingFilter(st)}
                      className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider border ${
                        bookingFilter === st
                          ? "bg-[#4a5c2d] text-white border-[#4a5c2d]"
                          : "bg-[#1f2937] text-[#9ca3af] border-[#374151] hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bookings Table */}
              <div className="bg-[#1f2937] border border-[#374151] overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="border-b border-[#374151] bg-[#111827]/60 text-[10px] uppercase font-bold tracking-widest text-[#9ca3af]">
                      <th className="p-4">Reference</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Service</th>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#374151] text-xs">
                    {bookings.filter((b) => {
                      const matchesFilter =
                        bookingFilter === "All" || b.status === bookingFilter
                      const matchesSearch =
                        b.customer
                          .toLowerCase()
                          .includes(bookingSearch.toLowerCase()) ||
                        b.id
                          .toLowerCase()
                          .includes(bookingSearch.toLowerCase()) ||
                        b.serviceName
                          .toLowerCase()
                          .includes(bookingSearch.toLowerCase()) ||
                        b.email
                          .toLowerCase()
                          .includes(bookingSearch.toLowerCase())
                      return matchesFilter && matchesSearch
                    }).length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-8 text-center text-xs text-[#9ca3af]"
                        >
                          No bookings found. Test by creating a booking at{" "}
                          <Link
                            to="/booking"
                            className="text-[#86a84e] underline font-bold"
                          >
                            /booking
                          </Link>{" "}
                          or clicking "+ Create New Booking" above.
                        </td>
                      </tr>
                    ) : (
                      bookings
                        .filter((b) => {
                          const matchesFilter =
                            bookingFilter === "All" ||
                            b.status === bookingFilter
                          const matchesSearch =
                            b.customer
                              .toLowerCase()
                              .includes(bookingSearch.toLowerCase()) ||
                            b.id
                              .toLowerCase()
                              .includes(bookingSearch.toLowerCase()) ||
                            b.serviceName
                              .toLowerCase()
                              .includes(bookingSearch.toLowerCase()) ||
                            b.email
                              .toLowerCase()
                              .includes(bookingSearch.toLowerCase())
                          return matchesFilter && matchesSearch
                        })
                        .map((b) => (
                          <tr
                            key={b.id}
                            className="hover:bg-[#111827]/40 transition-colors"
                          >
                            <td className="p-4 font-mono font-bold text-[#86a84e]">
                              {b.id}
                            </td>
                            <td className="p-4">
                              <p className="font-semibold text-white">
                                {b.customer}
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-[#9ca3af]">
                                <span>
                                  {b.phone} · {b.email}
                                </span>
                                {b.phone && (
                                  <a
                                    href={getWhatsAppUrl(
                                      `Hi ${b.customer}, this is Zimthreads regarding your booking for ${b.serviceName} on ${b.date}!`,
                                      b.phone,
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] rounded-xs font-semibold"
                                    title="Message customer on WhatsApp"
                                  >
                                    <WhatsAppIcon className="w-2.5 h-2.5 text-[#25D366]" />
                                    <span>WhatsApp</span>
                                  </a>
                                )}
                              </div>
                              {b.notes && (
                                <p className="text-[10px] text-[#6b7280] italic mt-0.5 max-w-xs truncate">
                                  "{b.notes}"
                                </p>
                              )}
                            </td>
                            <td className="p-4 text-[#f9fafb] font-medium">
                              {b.serviceName}
                            </td>
                            <td className="p-4 text-[#9ca3af]">
                              <p className="text-white">{b.date}</p>
                              <p className="text-[10px]">{b.time} Slot</p>
                            </td>
                            <td className="p-4 font-mono font-bold text-[#86a84e]">
                              {b.price}
                            </td>
                            <td className="p-4">
                              <select
                                value={b.status}
                                onChange={(e) =>
                                  updateBookingStatus(
                                    b.id,
                                    e.target.value as BookingItem["status"],
                                  )
                                }
                                className={`text-[10px] font-bold uppercase px-2 py-1 border rounded-none cursor-pointer ${
                                  b.status === "Confirmed"
                                    ? "bg-[#4a5c2d]/30 text-[#86a84e] border-[#4a5c2d]"
                                    : b.status === "In Progress"
                                      ? "bg-blue-900/30 text-blue-400 border-blue-700"
                                      : b.status === "Completed"
                                        ? "bg-emerald-900/30 text-emerald-400 border-emerald-700"
                                        : b.status === "Cancelled"
                                          ? "bg-red-900/30 text-red-400 border-red-700"
                                          : "bg-yellow-900/30 text-yellow-400 border-yellow-700"
                                }`}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Are you sure you want to delete booking #${b.id} for ${b.customer}?`,
                                    )
                                  ) {
                                    deleteBooking(b.id)
                                  }
                                }}
                                className="text-xs text-red-400 hover:text-red-300 font-bold p-1 cursor-pointer"
                                title="Delete Booking"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================== ORDERS SECTION ===================== */}
          {active === "orders" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-extrabold uppercase text-[#f9fafb]">
                    STORE ORDERS ({orders.length})
                  </h1>
                  <p className="text-xs text-[#9ca3af]">
                    Track sneaker care kit deliveries & custom apparel
                    fulfillments
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Search order ID, customer, payment..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="bg-[#1f2937] border border-[#374151] px-4 py-2 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-[#86a84e] flex-1"
                />
                <div className="flex flex-wrap gap-1">
                  {[
                    "All",
                    "Processing",
                    "Shipped",
                    "Delivered",
                    "Cancelled",
                  ].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderFilter(st)}
                      className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider border ${
                        orderFilter === st
                          ? "bg-[#4a5c2d] text-white border-[#4a5c2d]"
                          : "bg-[#1f2937] text-[#9ca3af] border-[#374151] hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-[#1f2937] border border-[#374151] overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="border-b border-[#374151] bg-[#111827]/60 text-[10px] uppercase font-bold tracking-widest text-[#9ca3af]">
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Customer & City</th>
                      <th className="p-4">Items Summary</th>
                      <th className="p-4">Total & Payment</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#374151] text-xs">
                    {orders.filter((o) => {
                      const matchesFilter =
                        orderFilter === "All" || o.status === orderFilter
                      const matchesSearch =
                        o.customer
                          .toLowerCase()
                          .includes(orderSearch.toLowerCase()) ||
                        o.id
                          .toLowerCase()
                          .includes(orderSearch.toLowerCase()) ||
                        o.itemSummary
                          .toLowerCase()
                          .includes(orderSearch.toLowerCase()) ||
                        o.paymentMethod
                          .toLowerCase()
                          .includes(orderSearch.toLowerCase())
                      return matchesFilter && matchesSearch
                    }).length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-8 text-center text-xs text-[#9ca3af]"
                        >
                          No orders placed yet. Test by purchasing items at{" "}
                          <Link
                            to="/shop"
                            className="text-[#86a84e] underline font-bold"
                          >
                            /shop
                          </Link>
                          .
                        </td>
                      </tr>
                    ) : (
                      orders
                        .filter((o) => {
                          const matchesFilter =
                            orderFilter === "All" || o.status === orderFilter
                          const matchesSearch =
                            o.customer
                              .toLowerCase()
                              .includes(orderSearch.toLowerCase()) ||
                            o.id
                              .toLowerCase()
                              .includes(orderSearch.toLowerCase()) ||
                            o.itemSummary
                              .toLowerCase()
                              .includes(orderSearch.toLowerCase()) ||
                            o.paymentMethod
                              .toLowerCase()
                              .includes(orderSearch.toLowerCase())
                          return matchesFilter && matchesSearch
                        })
                        .map((o) => (
                          <tr
                            key={o.id}
                            className="hover:bg-[#111827]/40 transition-colors"
                          >
                            <td className="p-4 font-mono font-bold text-[#86a84e]">
                              {o.id}
                            </td>
                            <td className="p-4">
                              <p className="font-semibold text-white">
                                {o.customer}
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-[#9ca3af]">
                                <span>
                                  {o.city} · {o.phone}
                                </span>
                                {o.phone && (
                                  <a
                                    href={getWhatsAppUrl(
                                      `Hi ${o.customer}, this is Zimthreads regarding your order #${o.id}!`,
                                      o.phone,
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] rounded-xs font-semibold"
                                    title="Message customer on WhatsApp"
                                  >
                                    <WhatsAppIcon className="w-2.5 h-2.5 text-[#25D366]" />
                                    <span>WhatsApp</span>
                                  </a>
                                )}
                              </div>
                              <p className="text-[10px] text-[#6b7280]">
                                {o.address}
                              </p>
                            </td>
                            <td className="p-4 max-w-xs">
                              <p className="text-white font-medium line-clamp-2">
                                {o.itemSummary}
                              </p>
                              <p className="text-[10px] text-[#9ca3af]">
                                {o.date}
                              </p>
                            </td>
                            <td className="p-4 space-y-1">
                              <p className="font-mono font-bold text-sm text-white">
                                Rs {o.totalAmount}
                              </p>
                              <div className="flex flex-col gap-1">
                                <span className="inline-block text-[9px] font-bold text-[#86a84e] bg-[#4a5c2d]/20 px-1.5 py-0.5 w-fit">
                                  {o.paymentMethod}
                                </span>
                                <select
                                  value={o.paymentStatus || "Paid"}
                                  onChange={(e) =>
                                    updateOrderPaymentStatus(
                                      o.id,
                                      e.target.value as
                                        | "Paid"
                                        | "Pending"
                                        | "Refunded",
                                    )
                                  }
                                  className={`text-[9px] font-bold uppercase px-1.5 py-0.5 border rounded-none cursor-pointer w-fit ${
                                    (o.paymentStatus || "Paid") === "Paid"
                                      ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                                      : (o.paymentStatus || "Paid") === "Refunded"
                                        ? "bg-red-950 text-red-400 border-red-800"
                                        : "bg-amber-950 text-amber-400 border-amber-800"
                                  }`}
                                  title="Payment Status"
                                >
                                  <option value="Paid">Paid</option>
                                  <option value="Pending">Pending</option>
                                  <option value="Refunded">Refunded</option>
                                </select>
                              </div>
                            </td>
                            <td className="p-4">
                              <select
                                value={o.status}
                                onChange={(e) =>
                                  updateOrderStatus(
                                    o.id,
                                    e.target.value as OrderItem["status"],
                                  )
                                }
                                className={`text-[10px] font-bold uppercase px-2 py-1 border rounded-none cursor-pointer ${
                                  o.status === "Delivered"
                                    ? "bg-[#4a5c2d]/30 text-[#86a84e] border-[#4a5c2d]"
                                    : o.status === "Shipped"
                                      ? "bg-blue-900/30 text-blue-400 border-blue-700"
                                      : o.status === "Cancelled"
                                        ? "bg-red-900/30 text-red-400 border-red-700"
                                        : "bg-yellow-900/30 text-yellow-400 border-yellow-700"
                                }`}
                              >
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button
                                onClick={() => setViewOrder(o)}
                                className="text-xs text-[#86a84e] hover:underline font-bold cursor-pointer"
                              >
                                View
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Are you sure you want to delete order #${o.id}?`,
                                    )
                                  ) {
                                    deleteOrder(o.id)
                                  }
                                }}
                                className="text-xs text-red-400 hover:text-red-300 font-bold cursor-pointer"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================== SERVICES SECTION ===================== */}
          {active === "services" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-extrabold uppercase text-[#f9fafb]">
                    SERVICES CATALOG ({services.length})
                  </h1>
                  <p className="text-xs text-[#9ca3af]">
                    Configure cleaning tiers, restorations, pricing & active
                    availability
                  </p>
                </div>
                <button
                  onClick={() => setNewServiceModal(true)}
                  className="px-4 py-2 bg-[#4a5c2d] hover:bg-[#5a7038] text-white text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  + Add New Service
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((s) => (
                  <div
                    key={s.id}
                    className="bg-[#1f2937] border border-[#374151] p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-40 overflow-hidden bg-[#111827] mb-4">
                        <img
                          src={s.img}
                          alt={s.alt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-[#86a84e] tracking-widest uppercase">
                          {s.subtitle}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 ${
                            s.active !== false
                              ? "bg-emerald-900/40 text-emerald-400"
                              : "bg-red-900/40 text-red-400"
                          }`}
                        >
                          {s.active !== false ? "Active" : "Disabled"}
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-bold text-white uppercase">
                        {s.title}
                      </h3>
                      <p className="font-mono text-base font-bold text-[#86a84e] mb-2">
                        {s.price}
                      </p>
                      <p className="text-xs text-[#9ca3af] leading-relaxed mb-4">
                        {s.desc}
                      </p>
                      <div className="space-y-1 mb-4">
                        {s.features.map((f) => (
                          <div
                            key={f}
                            className="text-[11px] text-[#d1d5db] flex items-center gap-1.5"
                          >
                            <CheckIcon className="w-3.5 h-3.5 text-[#86a84e] shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#374151] flex justify-between items-center">
                      <button
                        onClick={() =>
                          updateService(s.id, { active: s.active === false })
                        }
                        className="text-xs text-[#9ca3af] hover:text-white"
                      >
                        {s.active !== false ? "Disable" : "Enable"}
                      </button>
                      <div className="space-x-2">
                        <button
                          onClick={() => setEditService(s)}
                          className="px-3 py-1 bg-[#374151] text-xs font-bold uppercase text-white hover:bg-[#4b5563]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Are you sure you want to delete service "${s.title}"?`,
                              )
                            ) {
                              deleteService(s.id)
                            }
                          }}
                          className="px-3 py-1 bg-red-950 text-xs font-bold uppercase text-red-400 hover:bg-red-900 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================== PRODUCTS SECTION ===================== */}
          {active === "products" && (() => {
            const jacketProducts = products.filter(
              (p) =>
                p.collectionId === "racing-jackets" ||
                p.id.startsWith("prod-jacket-"),
            )
            const coreProducts = products.filter(
              (p) =>
                p.collectionId !== "racing-jackets" &&
                !p.id.startsWith("prod-jacket-"),
            )

            const filteredProducts = products.filter((p) => {
              const matchesSearch =
                p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                p.description.toLowerCase().includes(productSearch.toLowerCase()) ||
                (p.badge && p.badge.toLowerCase().includes(productSearch.toLowerCase()))

              if (!matchesSearch) return false

              if (productCategoryFilter === "All") return true
              if (productCategoryFilter === "Active") return !p.hidden
              if (productCategoryFilter === "Hidden") return p.hidden === true
              if (productCategoryFilter === "Motorsport")
                return (
                  p.collectionId === "racing-jackets" ||
                  p.id.startsWith("prod-jacket-")
                )
              if (productCategoryFilter === "Core")
                return (
                  p.collectionId !== "racing-jackets" &&
                  !p.id.startsWith("prod-jacket-")
                )
              return p.category === productCategoryFilter
            })

            const handleBatchPriceChange = (
              productId: string,
              field: "price" | "stock",
              value: number,
            ) => {
              setBatchPrices((prev) => ({
                ...prev,
                [productId]: {
                  price:
                    field === "price"
                      ? value
                      : prev[productId]?.price ??
                        products.find((p) => p.id === productId)?.price ??
                        0,
                  stock:
                    field === "stock"
                      ? value
                      : prev[productId]?.stock ??
                        products.find((p) => p.id === productId)?.stock ??
                        0,
                },
              }))
            }

            const handleSaveAllBatch = () => {
              const updates = Object.entries(batchPrices).map(([id, data]) => ({
                id,
                changes: {
                  price: data.price,
                  stock: data.stock,
                },
              }))
              if (updates.length === 0) {
                showToast("No Changes", "No price or stock changes were made.", "info")
                return
              }
              updateProductsBatch(updates)
              setBatchPrices({})
            }

            return (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="font-display text-2xl font-extrabold uppercase text-[#f9fafb]">
                      PRODUCTS & CATALOG ({products.length})
                    </h1>
                    <p className="text-xs text-[#9ca3af]">
                      Manage Retro Motorsport Collectives, cleaning supplies, and custom apparel
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowBatchPricingDesk((prev) => !prev)}
                      className="px-3.5 py-2 bg-[#1f2937] hover:bg-[#374151] border border-[#374151] text-[#86a84e] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>🏎️</span>
                      <span>
                        {showBatchPricingDesk ? "Hide Pricing Desk" : "Collective Pricing Desk"}
                      </span>
                    </button>
                    <button
                      onClick={() => setNewProductModal(true)}
                      className="px-4 py-2 bg-[#4a5c2d] hover:bg-[#5a7038] text-white text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
                    >
                      + Add New Product
                    </button>
                  </div>
                </div>

                {/* ================= BATCH PRICING DESK FOR COLLECTIVES ================= */}
                {showBatchPricingDesk && jacketProducts.length > 0 && (
                  <div className="bg-[#111827] border-2 border-[#86a84e]/40 p-5 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#374151]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#86a84e] animate-pulse" />
                          <h3 className="font-display text-base font-extrabold uppercase tracking-wide text-white">
                            RETRO MOTORSPORT COLLECTIVE — BATCH PRICING & INVENTORY DESK
                          </h3>
                        </div>
                        <p className="text-xs text-[#9ca3af] mt-0.5">
                          Set your final prices and available quantities for all 14 jackets directly below.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {Object.keys(batchPrices).length > 0 && (
                          <span className="text-xs font-mono text-amber-400 font-bold">
                            {Object.keys(batchPrices).length} unsaved edits
                          </span>
                        )}
                        <button
                          onClick={handleSaveAllBatch}
                          className="px-4 py-2 bg-[#86a84e] hover:bg-[#9cc45e] text-black font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                        >
                          <CheckIcon className="w-3.5 h-3.5 text-black" />
                          <span>Save All Prices & Stock</span>
                        </button>
                      </div>
                    </div>

                    {/* Compact Scrollable Pricing Table */}
                    <div className="overflow-x-auto max-h-[460px] overflow-y-auto border border-[#374151]">
                      <table className="w-full text-left text-xs text-white">
                        <thead className="bg-[#1f2937] text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] sticky top-0 z-10 border-b border-[#374151]">
                          <tr>
                            <th className="py-2.5 px-3">Piece</th>
                            <th className="py-2.5 px-3">Jacket Name & Line</th>
                            <th className="py-2.5 px-3">Badge</th>
                            <th className="py-2.5 px-3">Visibility</th>
                            <th className="py-2.5 px-3">Price (Rs)</th>
                            <th className="py-2.5 px-3">Stock (Qty)</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#374151] bg-[#111827]">
                          {jacketProducts.map((j) => {
                            const pendingPrice = batchPrices[j.id]?.price ?? j.price
                            const pendingStock = batchPrices[j.id]?.stock ?? j.stock
                            const isDirty =
                              batchPrices[j.id] !== undefined &&
                              (batchPrices[j.id].price !== j.price ||
                                batchPrices[j.id].stock !== j.stock)

                            return (
                              <tr
                                key={j.id}
                                className={`hover:bg-[#1f2937]/60 transition-colors ${
                                  isDirty ? "bg-[#1f2937]/90" : ""
                                }`}
                              >
                                <td className="py-2 px-3">
                                  <div className="w-10 h-10 rounded-xs bg-[#1f2937] overflow-hidden border border-[#374151] flex-shrink-0">
                                    <img
                                      src={j.img}
                                      alt={j.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </td>
                                <td className="py-2 px-3">
                                  <div className="font-semibold text-white leading-snug line-clamp-1 max-w-[280px]">
                                    {j.name}
                                  </div>
                                  <div className="text-[10px] text-[#9ca3af] font-mono">
                                    ID: {j.id}
                                  </div>
                                </td>
                                <td className="py-2 px-3">
                                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-[#1f2937] border border-[#374151] text-[#86a84e]">
                                    {j.badge || "COLLECTIVE"}
                                  </span>
                                </td>
                                <td className="py-2 px-3">
                                  <button
                                    type="button"
                                    onClick={() => updateProduct(j.id, { hidden: !j.hidden })}
                                    className={`px-2 py-0.5 text-[9px] font-bold uppercase border transition-colors cursor-pointer ${
                                      j.hidden
                                        ? "bg-amber-950/80 text-amber-300 border-amber-600/60 hover:bg-amber-900"
                                        : "bg-emerald-950/80 text-emerald-300 border-emerald-600/60 hover:bg-emerald-900"
                                    }`}
                                    title={j.hidden ? "Currently hidden from shop. Click to show." : "Currently live on shop. Click to hide."}
                                  >
                                    {j.hidden ? "👁️ Hidden" : "✓ Live"}
                                  </button>
                                </td>
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-[#9ca3af] font-mono font-bold">
                                      Rs
                                    </span>
                                    <input
                                      type="number"
                                      value={pendingPrice}
                                      onChange={(e) =>
                                        handleBatchPriceChange(
                                          j.id,
                                          "price",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className={`w-24 bg-[#1f2937] border px-2 py-1 text-xs text-white font-mono font-bold ${
                                        isDirty
                                          ? "border-amber-400 bg-amber-950/30"
                                          : "border-[#374151]"
                                      }`}
                                    />
                                  </div>
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="number"
                                    value={pendingStock}
                                    onChange={(e) =>
                                      handleBatchPriceChange(
                                        j.id,
                                        "stock",
                                        parseInt(e.target.value) || 0,
                                      )
                                    }
                                    className={`w-18 bg-[#1f2937] border px-2 py-1 text-xs text-white font-mono text-center ${
                                      isDirty
                                        ? "border-amber-400 bg-amber-950/30"
                                        : "border-[#374151]"
                                    }`}
                                  />
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {isDirty && (
                                      <button
                                        onClick={() => {
                                          updateProduct(j.id, {
                                            price: pendingPrice,
                                            stock: pendingStock,
                                          })
                                          setBatchPrices((prev) => {
                                            const next = { ...prev }
                                            delete next[j.id]
                                            return next
                                          })
                                        }}
                                        className="text-[10px] bg-[#4a5c2d] hover:bg-[#5a7038] text-white px-2 py-1 font-bold uppercase cursor-pointer"
                                      >
                                        Save
                                      </button>
                                    )}
                                    <button
                                      onClick={() => openEditProductModal(j)}
                                      className="text-xs text-[#86a84e] hover:underline font-bold cursor-pointer"
                                    >
                                      Edit Full
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: "All", label: `All (${products.length})` },
                      {
                        id: "Active",
                        label: `Active (${products.filter((p) => !p.hidden).length})`,
                      },
                      {
                        id: "Hidden",
                        label: `👁️ Hidden (${products.filter((p) => p.hidden).length})`,
                      },
                      {
                        id: "Motorsport",
                        label: `🏎️ Motorsport (${jacketProducts.length})`,
                      },
                      {
                        id: "Core",
                        label: `Core (${coreProducts.length})`,
                      },
                      { id: "Cleaning", label: "Cleaning" },
                      { id: "Apparel", label: "Apparel" },
                      { id: "Accessories", label: "Accessories" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setProductCategoryFilter(tab.id)}
                        className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                          productCategoryFilter === tab.id
                            ? "bg-[#4a5c2d] text-white border-[#4a5c2d]"
                            : "bg-[#1f2937] text-[#9ca3af] border-[#374151] hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="w-full sm:w-64">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search catalog..."
                      className="w-full bg-[#111827] border border-[#374151] px-3 py-1.5 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-[#4a5c2d]"
                    />
                  </div>
                </div>

                {/* Product Grid */}
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12 bg-[#1f2937] border border-[#374151]">
                    <p className="text-sm font-bold uppercase text-white mb-1">
                      No Products Found
                    </p>
                    <p className="text-xs text-[#9ca3af]">
                      Try clearing your search query or filter.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((p) => {
                      const isCollective =
                        p.collectionId === "racing-jackets" ||
                        p.id.startsWith("prod-jacket-")

                      return (
                        <div
                          key={p.id}
                          className="bg-[#1f2937] border border-[#374151] p-4 flex flex-col justify-between hover:border-[#86a84e] transition-colors"
                        >
                          <div>
                            <div className="aspect-square bg-[#111827] overflow-hidden mb-3 relative">
                              <img
                                src={p.img}
                                alt={p.alt || p.name}
                                className="w-full h-full object-cover"
                              />
                              {isCollective && (
                                <span className="absolute top-2 left-2 bg-[#86a84e] text-black text-[8px] font-black uppercase px-2 py-0.5 tracking-wider">
                                  {p.badge || "COLLECTIVE"}
                                </span>
                              )}
                              {p.hidden && (
                                <span className="absolute bottom-2 left-2 bg-amber-500 text-black text-[8px] font-black uppercase px-2 py-0.5 shadow-md z-10">
                                  HIDDEN FROM SHOP
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-bold text-[#86a84e] uppercase tracking-wider">
                                {isCollective ? "Motorsport Archive" : p.category}
                              </span>
                              <span className="text-xs font-mono font-bold text-white">
                                Rs {p.price}
                              </span>
                            </div>
                            <h4 className="font-semibold text-sm text-white mb-1 leading-snug truncate" title={p.name}>
                              {p.name}
                            </h4>
                            <p className="text-xs text-[#9ca3af] mb-3 line-clamp-2">
                              {p.description}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-[#374151] flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-[#9ca3af]">Stock:</span>
                              <input
                                type="number"
                                defaultValue={p.stock}
                                key={p.stock}
                                onBlur={(e) => {
                                  const newStock =
                                    parseInt(e.target.value) || 0
                                  if (newStock !== p.stock) {
                                    updateProduct(p.id, { stock: newStock })
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.currentTarget.blur()
                                  }
                                }}
                                className="w-14 bg-[#111827] border border-[#374151] px-1.5 py-0.5 text-xs text-white text-center font-mono focus:border-[#86a84e]"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateProduct(p.id, { hidden: !p.hidden })}
                                className={`text-xs font-bold cursor-pointer transition-colors ${
                                  p.hidden
                                    ? "text-amber-400 hover:text-amber-300 underline"
                                    : "text-[#9ca3af] hover:text-white"
                                }`}
                                title={p.hidden ? "Unhide on storefront" : "Hide from storefront without deleting"}
                              >
                                {p.hidden ? "Unhide" : "Hide"}
                              </button>
                              <button
                                onClick={() => openEditProductModal(p)}
                                className="text-xs text-[#86a84e] hover:underline font-bold cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Are you sure you want to delete product "${p.name}"?`,
                                    )
                                  ) {
                                    deleteProduct(p.id)
                                  }
                                }}
                                className="text-xs text-red-400 hover:text-red-300 font-bold cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })()}


          {/* ===================== BLOG CMS SECTION ===================== */}
          {active === "blog" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-extrabold uppercase text-[#f9fafb]">
                    BLOG CMS ({blogPosts.length})
                  </h1>
                  <p className="text-xs text-[#9ca3af]">
                    Publish sneaker care guides, streetwear editorial, and
                    studio updates
                  </p>
                </div>
                <button
                  onClick={() => setNewBlogModal(true)}
                  className="px-4 py-2 bg-[#4a5c2d] hover:bg-[#5a7038] text-white text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  + Publish New Article
                </button>
              </div>

              <div className="space-y-4">
                {blogPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-[#1f2937] border border-[#374151] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-16 bg-[#111827] overflow-hidden flex-shrink-0">
                        <img
                          src={post.img}
                          alt={post.alt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-bold text-[#86a84e] uppercase tracking-wider">
                            {post.category}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 ${
                              post.status === "draft"
                                ? "bg-amber-950 text-amber-400 border border-amber-800"
                                : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            }`}
                          >
                            {post.status === "draft" ? "Draft" : "Published"}
                          </span>
                          <span className="text-xs text-[#6b7280]">·</span>
                          <span className="text-xs text-[#9ca3af]">
                            {post.date}
                          </span>
                          <span className="text-xs text-[#6b7280]">·</span>
                          <span className="text-xs text-[#9ca3af]">
                            By {post.author}
                          </span>
                        </div>
                        <h3 className="font-display text-base font-bold text-white uppercase">
                          {post.title}
                        </h3>
                        <p className="text-xs text-[#9ca3af] max-w-xl truncate">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() =>
                          updateBlogPost(post.id, {
                            status:
                              post.status === "draft"
                                ? "published"
                                : "draft",
                          })
                        }
                        className={`px-3 py-1.5 text-xs font-bold uppercase cursor-pointer transition-colors ${
                          post.status === "draft"
                            ? "bg-[#4a5c2d] hover:bg-[#5a7038] text-white"
                            : "bg-amber-950/80 hover:bg-amber-900 text-amber-400 border border-amber-800"
                        }`}
                        title="Toggle publish status"
                      >
                        {post.status === "draft" ? "Publish" : "Unpublish"}
                      </button>
                      <button
                        onClick={() => setEditBlog(post)}
                        className="px-3 py-1.5 bg-[#374151] text-xs font-bold uppercase text-white hover:bg-[#4b5563] cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Are you sure you want to delete article "${post.title}"?`,
                            )
                          ) {
                            deleteBlogPost(post.id)
                          }
                        }}
                        className="px-3 py-1.5 bg-red-950 text-xs font-bold uppercase text-red-400 hover:bg-red-900 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================== CUSTOMERS SECTION ===================== */}
          {active === "customers" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-extrabold uppercase text-[#f9fafb]">
                  CUSTOMER DIRECTORY ({customers.length})
                </h1>
                <p className="text-xs text-[#9ca3af]">
                  Calculated lifetime value, booking counts, and order activity
                </p>
              </div>

              <div className="bg-[#1f2937] border border-[#374151] overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-[#374151] bg-[#111827]/60 text-[10px] uppercase font-bold tracking-widest text-[#9ca3af]">
                      <th className="p-4">Customer</th>
                      <th className="p-4">Contact Info</th>
                      <th className="p-4">Bookings</th>
                      <th className="p-4">Store Orders</th>
                      <th className="p-4">Lifetime Spend</th>
                      <th className="p-4">Tier Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#374151] text-xs">
                    {customers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-8 text-center text-xs text-[#9ca3af]"
                        >
                          No customer profiles recorded yet. Profiles will
                          automatically generate when bookings or orders are
                          placed.
                        </td>
                      </tr>
                    ) : (
                      customers.map((c) => (
                        <tr
                          key={c.email || c.name}
                          className="hover:bg-[#111827]/40 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#4a5c2d] flex items-center justify-center font-bold text-white text-xs">
                                {c.name[0]}
                              </div>
                              <span className="font-bold text-white">
                                {c.name}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-[#9ca3af]">
                            <p className="text-white">{c.email}</p>
                            <p className="text-[10px]">
                              {c.phone || "No phone recorded"}
                            </p>
                          </td>
                          <td className="p-4 font-mono font-bold text-white">
                            {c.bookingsCount}
                          </td>
                          <td className="p-4 font-mono font-bold text-white">
                            {c.ordersCount}
                          </td>
                          <td className="p-4 font-mono font-bold text-sm text-[#86a84e]">
                            Rs {c.totalSpent.toFixed(0)}
                          </td>
                          <td className="p-4">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 ${
                                c.status === "VIP"
                                  ? "bg-amber-900/30 text-amber-400 border border-amber-600"
                                  : c.status === "Active"
                                    ? "bg-[#4a5c2d]/30 text-[#86a84e] border border-[#4a5c2d]"
                                    : "bg-blue-900/30 text-blue-400 border border-blue-700"
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================== INQUIRIES SECTION ===================== */}
          {active === "inquiries" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-extrabold uppercase text-[#f9fafb]">
                    CUSTOMER INBOX & INQUIRIES ({inquiries.length})
                  </h1>
                  <p className="text-xs text-[#9ca3af]">
                    Messages sent from the public website contact form
                  </p>
                </div>
                <div className="flex gap-2">
                  {(["All", "Unread", "Read"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setInquiryFilter(tab)}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border ${
                        inquiryFilter === tab
                          ? "bg-[#4a5c2d] text-white border-[#4a5c2d]"
                          : "bg-[#1f2937] text-[#9ca3af] border-[#374151] hover:text-white"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {inquiries.filter((i) => {
                  if (inquiryFilter === "Unread") return !i.read
                  if (inquiryFilter === "Read") return i.read
                  return true
                }).length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#9ca3af] bg-[#1f2937] border border-[#374151]">
                    <p className="mb-1">No customer messages found.</p>
                    <p className="text-[10px] text-[#6b7280]">
                      Messages submitted via the contact page will appear here.
                    </p>
                  </div>
                ) : (
                  inquiries
                    .filter((i) => {
                      if (inquiryFilter === "Unread") return !i.read
                      if (inquiryFilter === "Read") return i.read
                      return true
                    })
                    .map((inq) => (
                      <div
                        key={inq.id}
                        className={`p-4 border transition-colors ${
                          !inq.read
                            ? "bg-[#1f2937] border-[#86a84e]"
                            : "bg-[#1f2937]/60 border-[#374151]"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {!inq.read && (
                              <span className="w-2 h-2 rounded-full bg-[#86a84e] animate-pulse" />
                            )}
                            <span className="font-bold text-white text-sm">
                              {inq.name}
                            </span>
                            <span className="text-xs text-[#9ca3af]">
                              ({inq.email})
                            </span>
                          </div>
                          <span className="text-[10px] text-[#6b7280] font-mono">
                            {inq.date}
                          </span>
                        </div>

                        <h4 className="font-semibold text-xs text-[#86a84e] mb-1">
                          Subject: {inq.subject}
                        </h4>
                        <p className="text-xs text-[#d1d5db] leading-relaxed mb-3">
                          {inq.message}
                        </p>

                        {inq.response && (
                          <div className="mb-3 p-3 bg-[#111827] border-l-2 border-[#86a84e] text-xs space-y-1">
                            <div className="flex justify-between items-center text-[10px] text-[#9ca3af]">
                              <span className="font-bold text-[#86a84e] uppercase">
                                Logged Staff Response
                              </span>
                              <span>
                                {inq.respondedAt
                                  ? new Date(inq.respondedAt).toLocaleDateString()
                                  : ""}
                              </span>
                            </div>
                            <p className="text-[#e5e7eb] italic leading-relaxed">
                              "{inq.response}"
                            </p>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#374151]">
                          <a
                            href={`mailto:${inq.email}?subject=Re: ${encodeURIComponent(inq.subject)}`}
                            className="text-xs text-[#86a84e] hover:underline font-semibold"
                          >
                            Email Customer ↗
                          </a>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                setViewInquiry(inq)
                                setInquiryResponseText(inq.response || "")
                                if (!inq.read) {
                                  markInquiryAsRead(inq.id, true)
                                }
                              }}
                              className="text-xs text-[#86a84e] hover:text-[#9fc75d] font-bold cursor-pointer"
                            >
                              View & Respond
                            </button>
                            <button
                              onClick={() => markInquiryAsRead(inq.id, !inq.read)}
                              className="text-xs text-[#9ca3af] hover:text-white font-semibold cursor-pointer"
                            >
                              {inq.read ? "Mark as Unread" : "Mark as Read"}
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Are you sure you want to delete inquiry from ${inq.name}?`,
                                  )
                                ) {
                                  deleteInquiry(inq.id)
                                }
                              }}
                              className="text-xs text-red-400 hover:text-red-300 font-bold cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* ===================== SETTINGS SECTION ===================== */}
          {active === "settings" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h1 className="font-display text-2xl font-extrabold uppercase text-[#f9fafb]">
                  BUSINESS & APP SETTINGS
                </h1>
                <p className="text-xs text-[#9ca3af]">
                  Configure store identity, delivery pricing rules & operating
                  hours
                </p>
              </div>

              {/* ===================== FEATURED HERO BANNER (SHOP DROP) ===================== */}
              <div className="bg-[#1f2937] border border-[#374151] p-6 space-y-5 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#374151]">
                  <div>
                    <h3 className="font-display text-base font-bold uppercase text-white flex items-center gap-2">
                      <SparklesIcon className="w-4 h-4 text-[#86a84e]" />
                      Shop Hero Banner (Featured Drop)
                    </h3>
                    <p className="text-xs text-[#9ca3af]">
                      Spotlight new drops, upcoming capsules & limited items at
                      the top of the Shop page.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settingsForm.featuredDrop?.enabled ?? true}
                      onChange={(e) => {
                        const current =
                          settingsForm.featuredDrop ||
                          initialSettings.featuredDrop!
                        setSettingsForm({
                          ...settingsForm,
                          featuredDrop: {
                            ...current,
                            enabled: e.target.checked,
                          },
                        })
                      }}
                      className="w-4 h-4 rounded text-[#86a84e] bg-[#111827] border-[#374151] focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                      {(settingsForm.featuredDrop?.enabled ?? true)
                        ? "Active"
                        : "Disabled"}
                    </span>
                  </label>
                </div>

                {/* Banner Hero Image */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] block mb-1">
                    Hero Banner Image (Cloudinary CDN)
                  </label>
                  <ImageUploader
                    value={settingsForm.featuredDrop?.imageUrl || ""}
                    onChange={(url) => {
                      const current =
                        settingsForm.featuredDrop ||
                        initialSettings.featuredDrop!
                      setSettingsForm({
                        ...settingsForm,
                        featuredDrop: {
                          ...current,
                          imageUrl: url,
                        },
                      })
                    }}
                    folder="zimthreads/banners"
                  />
                </div>

                {/* Linked Product */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] block mb-1">
                    Link to Catalog Product (Optional - opens product on click)
                  </label>
                  <select
                    value={settingsForm.featuredDrop?.productId || ""}
                    onChange={(e) => {
                      const current =
                        settingsForm.featuredDrop ||
                        initialSettings.featuredDrop!
                      setSettingsForm({
                        ...settingsForm,
                        featuredDrop: {
                          ...current,
                          productId: e.target.value,
                        },
                      })
                    }}
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white focus:outline-none focus:border-[#86a84e]"
                  >
                    <option value="">
                      -- No linked product (Image banner only) --
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Rs {p.price})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mini Preview Box */}
                {settingsForm.featuredDrop?.imageUrl && (
                  <div className="p-4 bg-[#111827] border border-[#374151]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] mb-2">
                      Live Shop Banner Preview
                    </p>
                    <div className="w-full max-h-48 overflow-hidden border border-[#374151] bg-[#141715]">
                      <img
                        src={settingsForm.featuredDrop.imageUrl}
                        alt="Drop Preview"
                        className="w-full h-auto max-h-48 object-cover"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="w-full py-3 bg-[#86a84e] hover:bg-[#97bd59] text-[#141715] font-display font-extrabold uppercase tracking-widest text-xs transition-colors cursor-pointer shadow-md"
                >
                  Save Hero Banner & Sync to Cloud
                </button>
              </div>

              <form
                onSubmit={handleSaveSettings}
                className="bg-[#1f2937] border border-[#374151] p-6 space-y-4 text-xs"
              >
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] block mb-1">
                    Store Brand Name
                  </label>
                  <input
                    type="text"
                    value={settingsForm.storeName}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        storeName: e.target.value,
                      })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white focus:outline-none focus:border-[#86a84e]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] block mb-1">
                    Brand Slogan
                  </label>
                  <input
                    type="text"
                    value={settingsForm.tagline}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        tagline: e.target.value,
                      })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white focus:outline-none focus:border-[#86a84e]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] block mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={settingsForm.email}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          email: e.target.value,
                        })
                      }
                      className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white focus:outline-none focus:border-[#86a84e]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] block mb-1">
                      Phone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={settingsForm.phone}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          phone: e.target.value,
                        })
                      }
                      className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white focus:outline-none focus:border-[#86a84e]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] block mb-1">
                    Studio Location
                  </label>
                  <input
                    type="text"
                    value={settingsForm.location}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        location: e.target.value,
                      })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white focus:outline-none focus:border-[#86a84e]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] block mb-1">
                    Store Announcement Bar Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FREE ISLANDWIDE DELIVERY ON ORDERS OVER RS 1,500 ⚡ SNEAKER RESTORATION ATELIER OPEN"
                    value={settingsForm.announcementText || ""}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        announcementText: e.target.value,
                      })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white focus:outline-none focus:border-[#86a84e]"
                  />
                  <p className="text-[10px] text-[#6b7280] mt-1">
                    Appears across the top of all pages in the customer storefront.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] block mb-1">
                      Standard Delivery Fee (Rs)
                    </label>
                    <input
                      type="number"
                      value={settingsForm.deliveryFee}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          deliveryFee: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white focus:outline-none focus:border-[#86a84e]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] block mb-1">
                      Free Delivery Threshold (Rs)
                    </label>
                    <input
                      type="number"
                      value={settingsForm.freeDeliveryThreshold}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          freeDeliveryThreshold:
                            parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white focus:outline-none focus:border-[#86a84e]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#4a5c2d] hover:bg-[#5a7038] text-white font-bold uppercase tracking-widest transition-colors"
                >
                  Save Store Settings
                </button>
              </form>

              {/* Cloudinary Integration Settings Card */}
              <form
                onSubmit={handleSaveCloudinaryConfig}
                className="bg-[#1f2937] border border-[#374151] p-6 space-y-4 text-xs"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#374151]">
                  <div>
                    <h3 className="font-display text-base font-bold uppercase text-white">
                      Cloudinary CDN Configuration
                    </h3>
                    <p className="text-xs text-[#9ca3af]">
                      Credentials used for browser-native signed uploads
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="px-3 py-1 bg-[#374151] hover:bg-[#4b5563] text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {testingConnection ? "Testing..." : "Test Connection"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] block mb-1">
                      Cloud Name
                    </label>
                    <input
                      type="text"
                      value={cloudinaryConfigState.cloudName}
                      onChange={(e) =>
                        setCloudinaryConfigState({
                          ...cloudinaryConfigState,
                          cloudName: e.target.value,
                        })
                      }
                      className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white focus:outline-none focus:border-[#86a84e]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] block mb-1">
                      Default Upload Folder
                    </label>
                    <input
                      type="text"
                      value={cloudinaryConfigState.defaultFolder}
                      onChange={(e) =>
                        setCloudinaryConfigState({
                          ...cloudinaryConfigState,
                          defaultFolder: e.target.value,
                        })
                      }
                      className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white focus:outline-none focus:border-[#86a84e]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] block mb-1">
                      API Key
                    </label>
                    <input
                      type="text"
                      value={cloudinaryConfigState.apiKey}
                      onChange={(e) =>
                        setCloudinaryConfigState({
                          ...cloudinaryConfigState,
                          apiKey: e.target.value,
                        })
                      }
                      className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white focus:outline-none focus:border-[#86a84e]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] block mb-1">
                      API Secret
                    </label>
                    <input
                      type="password"
                      value={cloudinaryConfigState.apiSecret}
                      onChange={(e) =>
                        setCloudinaryConfigState({
                          ...cloudinaryConfigState,
                          apiSecret: e.target.value,
                        })
                      }
                      className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white focus:outline-none focus:border-[#86a84e]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#4a5c2d] hover:bg-[#5a7038] text-white font-bold uppercase tracking-widest transition-colors"
                >
                  Save Cloudinary Credentials
                </button>
              </form>
            </div>
          )}

          {/* Media Atelier Section */}
          {active === "media" && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-extrabold uppercase text-[#f9fafb]">
                    CLOUDINARY MEDIA ATELIER
                  </h1>
                  <p className="text-xs text-[#9ca3af]">
                    Upload and host photos directly on Cloudinary CDN with
                    automatic f_auto,q_auto optimization
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Cloud: {cloudinaryConfigState.cloudName}</span>
                  </div>
                  <button
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="px-3 py-1 bg-[#374151] hover:bg-[#4b5563] text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {testingConnection ? "Testing..." : "Test Connection"}
                  </button>
                </div>
              </div>

              {connectionStatus && (
                <div className="p-3 bg-[#111827] border border-[#374151] text-xs flex items-center justify-between">
                  <span className="text-[#86a84e]">{connectionStatus}</span>
                  <button
                    onClick={() => setConnectionStatus(null)}
                    className="text-[#9ca3af] hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Upload Card */}
              <div className="bg-[#1f2937] border border-[#374151] p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#374151]">
                  <div>
                    <h3 className="font-display text-base font-bold uppercase text-white">
                      Direct CDN Upload
                    </h3>
                    <p className="text-xs text-[#9ca3af]">
                      Select or drop any image file to send it straight to
                      Cloudinary
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-[#9ca3af]">
                      Target Folder:
                    </span>
                    <select
                      value={mediaFolder}
                      onChange={(e) => setMediaFolder(e.target.value)}
                      className="bg-[#111827] border border-[#374151] text-xs text-white px-2 py-1 outline-none"
                    >
                      <option value="zimthreads/products">
                        zimthreads/products
                      </option>
                      <option value="zimthreads/services">
                        zimthreads/services
                      </option>
                      <option value="zimthreads/blog">zimthreads/blog</option>
                      <option value="zimthreads/general">
                        zimthreads/general
                      </option>
                    </select>
                  </div>
                </div>

                <ImageUploader
                  value={quickMediaUrl}
                  onChange={handleMediaUploaded}
                  folder={mediaFolder}
                  label="Select Image to Upload"
                  helperText="Supports high-res PNG, JPG, WEBP, SVG up to 10MB"
                />

                {quickMediaUrl && (
                  <div className="p-4 bg-[#111827] border border-[#4a5c2d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase text-[#86a84e] tracking-widest mb-0.5">
                        Latest Upload CDN URL
                      </div>
                      <div className="font-mono text-xs text-white truncate max-w-xl">
                        {quickMediaUrl}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCopyAnyUrl(quickMediaUrl)}
                        className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors border ${
                          copiedMediaUrl === quickMediaUrl
                            ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                            : "bg-[#4a5c2d] border-[#4a5c2d] text-white hover:bg-[#5a7038]"
                        }`}
                      >
                        {copiedMediaUrl === quickMediaUrl
                          ? "Copied!"
                          : "Copy URL"}
                      </button>
                      <a
                        href={quickMediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-[#1f2937] border border-[#374151] text-xs font-bold uppercase tracking-wider text-[#9ca3af] hover:text-white transition-colors"
                      >
                        Open ↗
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Uploads Gallery */}
              <div className="bg-[#1f2937] border border-[#374151] p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#374151]">
                  <div>
                    <h3 className="font-display text-base font-bold uppercase text-white">
                      Recent Session Uploads ({recentUploads.length})
                    </h3>
                    <p className="text-xs text-[#9ca3af]">
                      Quickly copy URLs from your recently uploaded images
                    </p>
                  </div>
                  {recentUploads.length > 0 && (
                    <button
                      onClick={() => {
                        setRecentUploads([])
                        localStorage.removeItem("zimthreads_recent_uploads")
                      }}
                      className="text-[10px] font-bold uppercase text-[#9ca3af] hover:text-red-400"
                    >
                      Clear History
                    </button>
                  )}
                </div>

                {recentUploads.length === 0 ? (
                  <div className="py-12 text-center text-[#9ca3af] text-xs">
                    No uploads in this session yet. Drop an image in the
                    uploader above to test it live.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {recentUploads.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-[#111827] border border-[#374151] p-2 flex flex-col justify-between group hover:border-[#86a84e] transition-colors"
                      >
                        <div className="relative aspect-square bg-black border border-[#374151] overflow-hidden mb-2">
                          <img
                            src={item.url}
                            alt="Uploaded media"
                            className="w-full h-full object-contain"
                          />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-[8px] font-mono text-[#86a84e]">
                            CDN
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-[#6b7280] font-mono truncate">
                            {item.timestamp}
                          </p>
                          <button
                            onClick={() => handleCopyAnyUrl(item.url)}
                            className={`w-full py-1 text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                              copiedMediaUrl === item.url
                                ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                                : "bg-[#1f2937] border-[#374151] text-[#9ca3af] hover:text-white hover:border-[#6b7280]"
                            }`}
                          >
                            {copiedMediaUrl === item.url
                              ? "Copied!"
                              : "Copy URL"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ===================== MODALS ===================== */}

      {/* 1. New Booking Modal */}
      {newBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#1f2937] border border-[#374151] w-full max-w-md p-6 text-white shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#374151]">
              <h3 className="font-display text-lg font-bold uppercase">
                Log Walk-In Booking
              </h3>
              <button
                onClick={() => setNewBookingModal(false)}
                className="text-sm font-bold text-[#9ca3af] hover:text-white"
              >
                ✕
              </button>
            </div>
            {bookingError && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs mb-3">
                {bookingError}
              </div>
            )}
            <form onSubmit={handleCreateBooking} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={bookingForm.customer}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, customer: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={bookingForm.email}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, email: e.target.value })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={bookingForm.phone}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, phone: e.target.value })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Service Selection
                </label>
                <select
                  value={bookingForm.serviceId}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      serviceId: e.target.value,
                    })
                  }
                  className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.price})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingForm.date}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, date: e.target.value })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    required
                    value={bookingForm.time}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, time: e.target.value })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Shoe Details & Notes
                </label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, notes: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white resize-none"
                  rows={2}
                />
              </div>
              <button
                type="submit"
                disabled={isCreatingBooking}
                className="w-full py-2.5 bg-[#4a5c2d] hover:bg-[#5a7038] disabled:opacity-50 text-white font-bold uppercase tracking-widest mt-2 cursor-pointer transition-colors"
              >
                {isCreatingBooking ? "Saving Walk-in Booking..." : "Save Booking"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. New Product Modal */}
      {newProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#1f2937] border border-[#374151] w-full max-w-md p-6 text-white shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#374151]">
              <h3 className="font-display text-lg font-bold uppercase">
                Add New Product
              </h3>
              <button
                onClick={() => setNewProductModal(false)}
                className="text-sm font-bold text-[#9ca3af] hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Category
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        category: e.target.value as Product["category"],
                      })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                  >
                    <option value="Cleaning">Cleaning</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Price (Rs) *
                  </label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        stock: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                  />
                </div>
              </div>
              {/* Dynamic Size Configuration */}
              <div className="p-3 bg-[#111827] border border-[#374151] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">
                    Available Sizes / Options
                  </label>
                  {productForm.sizes.length > 0 && (
                    <span className="text-[10px] font-mono text-[#86a84e]">
                      {productForm.sizes.length} selected
                    </span>
                  )}
                </div>

                {/* Preset Chips */}
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">
                    Quick Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {["S", "M", "L", "XL", "2XL", "XXL", "One Size"].map((preset) => {
                      const isSelected = productForm.sizes.includes(preset)
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setProductForm((prev) => ({
                              ...prev,
                              sizes: isSelected
                                ? prev.sizes.filter((s) => s !== preset)
                                : [...prev.sizes, preset],
                            }))
                          }}
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase border transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#86a84e] text-[#141715] border-[#86a84e]"
                              : "bg-[#1f2937] text-gray-300 border-[#374151] hover:border-gray-400"
                          }`}
                        >
                          {isSelected ? `✓ ${preset}` : `+ ${preset}`}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Custom Size Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Custom size (e.g. 3XL, 42 EU, Kids)"
                    value={productForm.customSizeInput}
                    onChange={(e) =>
                      setProductForm({ ...productForm, customSizeInput: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        const val = productForm.customSizeInput.trim()
                        if (val && !productForm.sizes.includes(val)) {
                          setProductForm({
                            ...productForm,
                            sizes: [...productForm.sizes, val],
                            customSizeInput: "",
                          })
                        }
                      }
                    }}
                    className="flex-1 bg-[#1f2937] border border-[#374151] px-2.5 py-1 text-white text-xs focus:outline-none focus:border-[#86a84e]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = productForm.customSizeInput.trim()
                      if (val && !productForm.sizes.includes(val)) {
                        setProductForm({
                          ...productForm,
                          sizes: [...productForm.sizes, val],
                          customSizeInput: "",
                        })
                      }
                    }}
                    className="px-3 py-1 bg-[#374151] hover:bg-[#4b5563] text-white text-[10px] font-bold uppercase cursor-pointer"
                  >
                    + Add Size
                  </button>
                </div>

                {/* Selected Size Chips */}
                {productForm.sizes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#374151]/60">
                    {productForm.sizes.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#1f2937] border border-[#86a84e]/60 text-emerald-300 text-[10px] font-mono"
                      >
                        <span>{s}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setProductForm((prev) => ({
                              ...prev,
                              sizes: prev.sizes.filter((item) => item !== s),
                            }))
                          }
                          className="hover:text-red-400 cursor-pointer font-bold"
                          title="Remove size"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Options / Tiers Configuration */}
              <div className="p-3 bg-[#111827] border border-[#374151] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">
                    Selectable Price Tiers / Options
                  </label>
                  <span className="text-[9px] text-gray-400">
                    Toggle active to show/grey-out
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Tier label (e.g. Standard, Member)"
                      value={productForm.newPriceLabel}
                      onChange={(e) =>
                        setProductForm({ ...productForm, newPriceLabel: e.target.value })
                      }
                      className="bg-[#1f2937] border border-[#374151] px-2.5 py-1 text-white text-xs focus:outline-none focus:border-[#86a84e]"
                    />
                    <input
                      type="number"
                      placeholder="Price (Rs)"
                      value={productForm.newPriceValue}
                      onChange={(e) =>
                        setProductForm({ ...productForm, newPriceValue: e.target.value })
                      }
                      className="w-full bg-[#1f2937] border border-[#374151] px-2.5 py-1 text-white text-xs focus:outline-none focus:border-[#86a84e]"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setProductForm((prev) => ({
                          ...prev,
                          newPriceActive: !prev.newPriceActive,
                        }))
                      }
                      className={`px-2.5 py-1 text-[10px] font-extrabold uppercase border cursor-pointer transition-colors flex items-center gap-1.5 ${
                        productForm.newPriceActive
                          ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                          : "bg-amber-950/60 border-amber-600/70 text-amber-300"
                      }`}
                      title="Set active state for new price tier"
                    >
                      {productForm.newPriceActive ? "✓ Active Tier" : "✕ Inactive / Deselected Tier"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const price = parseFloat(productForm.newPriceValue)
                        if (!isNaN(price) && price > 0) {
                          const newOpt: PriceOption = {
                            id: `tier-${Date.now()}`,
                            label: productForm.newPriceLabel.trim() || `Tier Rs ${price}`,
                            price,
                            active: productForm.newPriceActive,
                          }
                          setProductForm({
                            ...productForm,
                            priceOptions: [...productForm.priceOptions, newOpt],
                            newPriceLabel: "",
                            newPriceValue: "",
                            newPriceActive: true,
                          })
                        }
                      }}
                      className="px-3 py-1 bg-[#86a84e] hover:bg-[#97bd58] text-[#141715] text-[10px] font-extrabold uppercase cursor-pointer"
                    >
                      + Add Price Tier
                    </button>
                  </div>
                </div>

                {/* Configured Price Options List */}
                {productForm.priceOptions.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-[#374151]/60">
                    {productForm.priceOptions.map((opt, idx) => (
                      <div
                        key={opt.id || idx}
                        className={`flex items-center justify-between p-2 border transition-colors ${
                          opt.active
                            ? "bg-[#1f2937] border-[#374151]"
                            : "bg-amber-950/20 border-amber-900/50 opacity-75"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = productForm.priceOptions.map((p, i) =>
                                i === idx ? { ...p, active: !p.active } : p,
                              )
                              setProductForm({ ...productForm, priceOptions: updated })
                            }}
                            className={`px-2 py-0.5 text-[9px] font-extrabold uppercase border cursor-pointer transition-colors ${
                              opt.active
                                ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                                : "bg-amber-950/70 border-amber-600/70 text-amber-300"
                            }`}
                            title="Toggle active / deselected"
                          >
                            {opt.active ? "✓ Active" : "✕ Inactive / Deselected"}
                          </button>
                          <span
                            className={`text-xs font-bold ${
                              opt.active ? "text-white" : "text-gray-400 line-through"
                            }`}
                          >
                            {opt.label || `Option ${idx + 1}`} · Rs {opt.price}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setProductForm({
                              ...productForm,
                              priceOptions: productForm.priceOptions.filter((_, i) => i !== idx),
                            })
                          }}
                          className="text-red-400 hover:text-red-300 text-xs px-1.5 py-0.5 cursor-pointer font-bold"
                          title="Delete price option"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <ImageUploader
                value={productForm.img}
                onChange={(url) => setProductForm({ ...productForm, img: url })}
                folder="zimthreads/products"
                label="Product Image"
                compact
              />
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Description
                </label>
                <textarea
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white resize-none"
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-[#111827] border border-[#374151] rounded-sm">
                <input
                  type="checkbox"
                  id="productFormHidden"
                  checked={productForm.hidden || false}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      hidden: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#4a5c2d] cursor-pointer"
                />
                <label
                  htmlFor="productFormHidden"
                  className="text-xs text-gray-300 font-mono cursor-pointer select-none"
                >
                  Hide from shop (Keep in CMS as draft)
                </label>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#4a5c2d] hover:bg-[#5a7038] text-white font-bold uppercase tracking-widest mt-2"
              >
                Add Product to Catalog
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Edit Product Modal */}
      {editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#1f2937] border border-[#374151] w-full max-w-md p-6 text-white shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#374151]">
              <h3 className="font-display text-lg font-bold uppercase">
                Edit Product
              </h3>
              <button
                onClick={() => setEditProduct(null)}
                className="text-sm font-bold text-[#9ca3af] hover:text-white"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={handleSaveEditProduct}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={editProduct.name}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, name: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Price (Rs)
                  </label>
                  <input
                    type="number"
                    required
                    value={editProduct.price}
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    required
                    value={editProduct.stock}
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        stock: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                  />
                </div>
              </div>
              <ImageUploader
                value={editProduct.img || ""}
                onChange={(url) => setEditProduct({ ...editProduct, img: url })}
                folder="zimthreads/products"
                label="Product Image"
                compact
              />

              {/* Dynamic Size Configuration */}
              <div className="p-3 bg-[#111827] border border-[#374151] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">
                    Available Sizes / Options
                  </label>
                  {(editProduct.sizes || []).length > 0 && (
                    <span className="text-[10px] font-mono text-[#86a84e]">
                      {(editProduct.sizes || []).length} selected
                    </span>
                  )}
                </div>

                {/* Preset Chips */}
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">
                    Quick Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {["S", "M", "L", "XL", "2XL", "XXL", "One Size"].map((preset) => {
                      const currentSizes = editProduct.sizes || []
                      const isSelected = currentSizes.includes(preset)
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setEditProduct({
                              ...editProduct,
                              sizes: isSelected
                                ? currentSizes.filter((s) => s !== preset)
                                : [...currentSizes, preset],
                            })
                          }}
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase border transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#86a84e] text-[#141715] border-[#86a84e]"
                              : "bg-[#1f2937] text-gray-300 border-[#374151] hover:border-gray-400"
                          }`}
                        >
                          {isSelected ? `✓ ${preset}` : `+ ${preset}`}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Custom Size Adder */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Custom size (e.g. 3XL, 42 EU, Kids)"
                    value={editProductCustomSize}
                    onChange={(e) => setEditProductCustomSize(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        const val = editProductCustomSize.trim()
                        const currentSizes = editProduct.sizes || []
                        if (val && !currentSizes.includes(val)) {
                          setEditProduct({
                            ...editProduct,
                            sizes: [...currentSizes, val],
                          })
                          setEditProductCustomSize("")
                        }
                      }
                    }}
                    className="flex-1 bg-[#1f2937] border border-[#374151] px-2.5 py-1 text-white text-xs focus:outline-none focus:border-[#86a84e]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = editProductCustomSize.trim()
                      const currentSizes = editProduct.sizes || []
                      if (val && !currentSizes.includes(val)) {
                        setEditProduct({
                          ...editProduct,
                          sizes: [...currentSizes, val],
                        })
                        setEditProductCustomSize("")
                      }
                    }}
                    className="px-3 py-1 bg-[#374151] hover:bg-[#4b5563] text-white text-[10px] font-bold uppercase cursor-pointer"
                  >
                    + Add Size
                  </button>
                </div>

                {/* Current Sizes Chips */}
                {(editProduct.sizes || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#374151]/60">
                    {(editProduct.sizes || []).map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#1f2937] border border-[#86a84e]/60 text-emerald-300 text-[10px] font-mono"
                      >
                        <span>{s}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditProduct({
                              ...editProduct,
                              sizes: (editProduct.sizes || []).filter((item) => item !== s),
                            })
                          }}
                          className="hover:text-red-400 cursor-pointer font-bold"
                          title="Remove size"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Options / Tiers Configuration */}
              <div className="p-3 bg-[#111827] border border-[#374151] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">
                    Selectable Price Tiers / Options
                  </label>
                  <span className="text-[9px] text-gray-400">
                    Toggle active to show/grey-out
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Tier label (e.g. Standard, Member)"
                      value={editProductPriceLabel}
                      onChange={(e) => setEditProductPriceLabel(e.target.value)}
                      className="bg-[#1f2937] border border-[#374151] px-2.5 py-1 text-white text-xs focus:outline-none focus:border-[#86a84e]"
                    />
                    <input
                      type="number"
                      placeholder="Price (Rs)"
                      value={editProductPriceValue}
                      onChange={(e) => setEditProductPriceValue(e.target.value)}
                      className="w-full bg-[#1f2937] border border-[#374151] px-2.5 py-1 text-white text-xs focus:outline-none focus:border-[#86a84e]"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setEditProductPriceActive((prev) => !prev)}
                      className={`px-2.5 py-1 text-[10px] font-extrabold uppercase border cursor-pointer transition-colors flex items-center gap-1.5 ${
                        editProductPriceActive
                          ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                          : "bg-amber-950/60 border-amber-600/70 text-amber-300"
                      }`}
                      title="Set active state for new price tier"
                    >
                      {editProductPriceActive ? "✓ Active Tier" : "✕ Inactive / Deselected Tier"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const price = parseFloat(editProductPriceValue)
                        if (!isNaN(price) && price > 0) {
                          const newOpt: PriceOption = {
                            id: `tier-${Date.now()}`,
                            label: editProductPriceLabel.trim() || `Tier Rs ${price}`,
                            price,
                            active: editProductPriceActive,
                          }
                          const existingOpts = editProduct.priceOptions || []
                          setEditProduct({
                            ...editProduct,
                            priceOptions: [...existingOpts, newOpt],
                          })
                          setEditProductPriceLabel("")
                          setEditProductPriceValue("")
                          setEditProductPriceActive(true)
                        }
                      }}
                      className="px-3 py-1 bg-[#86a84e] hover:bg-[#97bd58] text-[#141715] text-[10px] font-extrabold uppercase cursor-pointer"
                    >
                      + Add Price Tier
                    </button>
                  </div>
                </div>

                {/* Price Options List with Active / Inactive Toggle */}
                {(editProduct.priceOptions || []).length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-[#374151]/60">
                    {(editProduct.priceOptions || []).map((opt, idx) => (
                      <div
                        key={opt.id || idx}
                        className={`flex items-center justify-between p-2 border transition-colors ${
                          opt.active
                            ? "bg-[#1f2937] border-[#374151]"
                            : "bg-amber-950/20 border-amber-900/50 opacity-75"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (editProduct.priceOptions || []).map((p, i) =>
                                i === idx ? { ...p, active: !p.active } : p,
                              )
                              setEditProduct({
                                ...editProduct,
                                priceOptions: updated,
                              })
                            }}
                            className={`px-2 py-0.5 text-[9px] font-extrabold uppercase border cursor-pointer transition-colors ${
                              opt.active
                                ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                                : "bg-amber-950/70 border-amber-600/70 text-amber-300"
                            }`}
                            title="Toggle active / deselected"
                          >
                            {opt.active ? "✓ Active" : "✕ Inactive / Deselected"}
                          </button>
                          <span
                            className={`text-xs font-bold ${
                              opt.active ? "text-white" : "text-gray-400 line-through"
                            }`}
                          >
                            {opt.label || `Option ${idx + 1}`} · Rs {opt.price}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditProduct({
                              ...editProduct,
                              priceOptions: (editProduct.priceOptions || []).filter((_, i) => i !== idx),
                            })
                          }}
                          className="text-red-400 hover:text-red-300 text-xs px-1.5 py-0.5 cursor-pointer font-bold"
                          title="Delete price option"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Description
                </label>
                <textarea
                  value={editProduct.description}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white resize-none"
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-[#111827] border border-[#374151] rounded-sm">
                <input
                  type="checkbox"
                  id="editProductHidden"
                  checked={editProduct.hidden || false}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      hidden: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#4a5c2d] cursor-pointer"
                />
                <label
                  htmlFor="editProductHidden"
                  className="text-xs text-gray-300 font-mono cursor-pointer select-none"
                >
                  Hide from shop (Keep in CMS without showing to customers)
                </label>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#4a5c2d] hover:bg-[#5a7038] text-white font-bold uppercase tracking-widest mt-2"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. New Service Modal */}
      {newServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#1f2937] border border-[#374151] w-full max-w-md p-6 text-white shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#374151]">
              <h3 className="font-display text-lg font-bold uppercase">
                Add New Service
              </h3>
              <button
                onClick={() => setNewServiceModal(false)}
                className="text-sm font-bold text-[#9ca3af] hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateService} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Service Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SOLE REPAIR"
                  value={serviceForm.title}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, title: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Re-gluing & sole bond"
                    value={serviceForm.subtitle}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        subtitle: e.target.value,
                      })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Display Price Tag
                  </label>
                  <input
                    type="text"
                    placeholder="From Rs 300"
                    value={serviceForm.price}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, price: e.target.value })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Numeric Price (Rs)
                  </label>
                  <input
                    type="number"
                    value={serviceForm.priceNumeric}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        priceNumeric: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Turnaround Time
                  </label>
                  <input
                    type="text"
                    placeholder="24-48 Hours"
                    value={serviceForm.turnaround}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        turnaround: e.target.value,
                      })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Features (comma separated)
                </label>
                <input
                  type="text"
                  value={serviceForm.features}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, features: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                />
              </div>
              <ImageUploader
                value={serviceForm.img}
                onChange={(url) => setServiceForm({ ...serviceForm, img: url })}
                folder="zimthreads/services"
                label="Service Showcase Image"
                compact
              />
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Description
                </label>
                <textarea
                  value={serviceForm.desc}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, desc: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white resize-none"
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#111827] border border-[#374151]">
                <input
                  type="checkbox"
                  id="serviceFormActive"
                  checked={serviceForm.active}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, active: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#4a5c2d] cursor-pointer"
                />
                <label
                  htmlFor="serviceFormActive"
                  className="text-xs text-gray-300 font-mono cursor-pointer select-none"
                >
                  Active (Available for customer booking)
                </label>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#4a5c2d] hover:bg-[#5a7038] text-white font-bold uppercase tracking-widest mt-2 cursor-pointer"
              >
                Add Service Offering
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {editService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#1f2937] border border-[#374151] w-full max-w-md p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#374151]">
              <h3 className="font-display text-lg font-bold uppercase">
                Edit Service Offering
              </h3>
              <button
                onClick={() => setEditService(null)}
                className="text-sm font-bold text-[#9ca3af] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEditService} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Service Title *
                </label>
                <input
                  type="text"
                  required
                  value={editService.title}
                  onChange={(e) =>
                    setEditService({ ...editService, title: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={editService.subtitle}
                    onChange={(e) =>
                      setEditService({
                        ...editService,
                        subtitle: e.target.value,
                      })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Display Price Tag
                  </label>
                  <input
                    type="text"
                    value={editService.price}
                    onChange={(e) =>
                      setEditService({ ...editService, price: e.target.value })
                    }
                    placeholder="From Rs 300"
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Numeric Price (Rs)
                  </label>
                  <input
                    type="number"
                    value={editService.priceNumeric || 300}
                    onChange={(e) =>
                      setEditService({
                        ...editService,
                        priceNumeric: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Turnaround Time
                  </label>
                  <input
                    type="text"
                    value={editService.turnaround || "24-48 Hours"}
                    onChange={(e) =>
                      setEditService({
                        ...editService,
                        turnaround: e.target.value,
                      })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Features (comma separated)
                </label>
                <input
                  type="text"
                  value={editService.features?.join(", ") || ""}
                  onChange={(e) =>
                    setEditService({
                      ...editService,
                      features: e.target.value
                        .split(",")
                        .map((f) => f.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                />
              </div>
              <ImageUploader
                value={editService.img || ""}
                onChange={(url) => setEditService({ ...editService, img: url })}
                folder="zimthreads/services"
                label="Service Showcase Image"
                compact
              />
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Description
                </label>
                <textarea
                  value={editService.desc}
                  onChange={(e) =>
                    setEditService({ ...editService, desc: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white resize-none"
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#111827] border border-[#374151]">
                <input
                  type="checkbox"
                  id="editServiceActive"
                  checked={editService.active !== false}
                  onChange={(e) =>
                    setEditService({
                      ...editService,
                      active: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#4a5c2d] cursor-pointer"
                />
                <label
                  htmlFor="editServiceActive"
                  className="text-xs text-gray-300 font-mono cursor-pointer select-none"
                >
                  Active (Available for customer booking)
                </label>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#4a5c2d] hover:bg-[#5a7038] text-white font-bold uppercase tracking-widest mt-2 cursor-pointer"
              >
                Save Service Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. View Order Breakdown Modal */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#1f2937] border border-[#374151] w-full max-w-lg p-6 text-white shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#374151]">
              <div>
                <h3 className="font-display text-lg font-bold uppercase">
                  Order {viewOrder.id}
                </h3>
                <p className="text-xs text-[#9ca3af]">{viewOrder.date}</p>
              </div>
              <button
                onClick={() => setViewOrder(null)}
                className="text-sm font-bold text-[#9ca3af] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs mb-4">
              <div className="bg-[#111827] p-3 border border-[#374151]">
                <p className="font-bold text-[#86a84e] uppercase text-[10px] mb-1">
                  Customer & Shipping
                </p>
                <p className="font-semibold text-white">{viewOrder.customer}</p>
                <p className="text-[#9ca3af]">
                  {viewOrder.email} · {viewOrder.phone}
                </p>
                <p className="text-white mt-1">
                  {viewOrder.address}, {viewOrder.city}
                </p>
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-[#374151]">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                      Fulfillment Status
                    </label>
                    <select
                      value={viewOrder.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as OrderItem["status"]
                        updateOrderStatus(viewOrder.id, newStatus)
                        setViewOrder({ ...viewOrder, status: newStatus })
                      }}
                      className="w-full bg-[#1f2937] border border-[#374151] px-2 py-1.5 text-xs text-white uppercase font-bold"
                    >
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                      Payment ({viewOrder.paymentMethod})
                    </label>
                    <select
                      value={viewOrder.paymentStatus || "Paid"}
                      onChange={(e) => {
                        const newPayment = e.target.value as
                          | "Paid"
                          | "Pending"
                          | "Refunded"
                        updateOrderPaymentStatus(viewOrder.id, newPayment)
                        setViewOrder({
                          ...viewOrder,
                          paymentStatus: newPayment,
                        })
                      }}
                      className="w-full bg-[#1f2937] border border-[#374151] px-2 py-1.5 text-xs text-white uppercase font-bold"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </div>
                </div>
                {viewOrder.phone && (
                  <div className="mt-3 pt-2 border-t border-[#374151]/50">
                    <a
                      href={getWhatsAppUrl(
                        `Hi ${viewOrder.customer}, this is Zimthreads following up on your order #${viewOrder.id}!`,
                        viewOrder.phone,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-black text-[11px] font-bold uppercase rounded-xs transition-colors"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 text-black" />
                      <span>Chat with Customer on WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>

              <div>
                <p className="font-bold uppercase text-[10px] text-[#9ca3af] mb-2">
                  Line Items
                </p>
                <div className="space-y-2">
                  {viewOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-[#111827] border border-[#374151]"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={item.img}
                          alt={item.name}
                          className="w-10 h-10 object-cover"
                        />
                        <div>
                          <p className="font-semibold text-white">
                            {item.name}
                          </p>
                          {item.size && (
                            <span className="text-[10px] text-[#86a84e]">
                              Size: {item.size}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-white">
                        {item.quantity} x Rs {item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-[#111827] border border-[#374151] font-bold text-sm">
                <span>Grand Total:</span>
                <span className="text-[#86a84e] font-mono">
                  Rs {viewOrder.totalAmount}
                </span>
              </div>
            </div>

            <button
              onClick={() => setViewOrder(null)}
              className="w-full py-2.5 bg-[#374151] hover:bg-[#4b5563] text-white font-bold uppercase tracking-widest text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Inquiry Details & Response Modal */}
      {viewInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#1f2937] border border-[#374151] w-full max-w-lg p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#374151]">
              <div>
                <h3 className="font-display text-lg font-bold uppercase">
                  Customer Inquiry
                </h3>
                <p className="text-xs text-[#9ca3af]">{viewInquiry.date}</p>
              </div>
              <button
                onClick={() => setViewInquiry(null)}
                className="text-sm font-bold text-[#9ca3af] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-[#111827] p-3 border border-[#374151]">
                <p className="font-bold text-[#86a84e] uppercase text-[10px] mb-1">
                  Customer Information
                </p>
                <p className="font-semibold text-white text-sm">
                  {viewInquiry.name}
                </p>
                <p className="text-[#9ca3af]">{viewInquiry.email}</p>
                <div className="mt-2 pt-2 border-t border-[#374151]/50">
                  <a
                    href={`mailto:${viewInquiry.email}?subject=Re: ${encodeURIComponent(viewInquiry.subject)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4a5c2d] hover:bg-[#5a7038] text-white text-[11px] font-bold uppercase rounded-xs transition-colors"
                  >
                    <MailIcon className="w-3.5 h-3.5" />
                    <span>Open Email Client ↗</span>
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Subject
                </label>
                <div className="bg-[#111827] p-2.5 border border-[#374151] text-white font-medium">
                  {viewInquiry.subject}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Customer Message
                </label>
                <div className="bg-[#111827] p-3 border border-[#374151] text-[#d1d5db] leading-relaxed whitespace-pre-wrap">
                  {viewInquiry.message}
                </div>
              </div>

              {viewInquiry.response && (
                <div className="p-3 bg-[#111827] border-l-2 border-[#86a84e] space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-[#9ca3af]">
                    <span className="font-bold text-[#86a84e] uppercase">
                      Current Saved Response
                    </span>
                    <span>
                      {viewInquiry.respondedAt
                        ? new Date(viewInquiry.respondedAt).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                  <p className="text-gray-200 italic">
                    "{viewInquiry.response}"
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Staff Resolution / Logged Response
                </label>
                <textarea
                  value={inquiryResponseText}
                  onChange={(e) => setInquiryResponseText(e.target.value)}
                  placeholder="Type official response notes or resolution summary..."
                  rows={3}
                  className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    respondToInquiry(viewInquiry.id, inquiryResponseText)
                    setViewInquiry({
                      ...viewInquiry,
                      response: inquiryResponseText,
                      respondedAt: new Date().toISOString(),
                      read: true,
                    })
                  }}
                  className="flex-1 py-2.5 bg-[#4a5c2d] hover:bg-[#5a7038] text-white font-bold uppercase tracking-widest text-xs cursor-pointer"
                >
                  Save Response & Mark Responded
                </button>
                <button
                  type="button"
                  onClick={() => setViewInquiry(null)}
                  className="px-4 py-2.5 bg-[#374151] hover:bg-[#4b5563] text-white font-bold uppercase tracking-widest text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. New Blog Post Modal */}
      {newBlogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#1f2937] border border-[#374151] w-full max-w-xl p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#374151]">
              <h3 className="font-display text-lg font-bold uppercase">
                Publish New Blog Article
              </h3>
              <button
                onClick={() => setNewBlogModal(false)}
                className="text-sm font-bold text-[#9ca3af] hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateBlog} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  value={blogForm.title}
                  onChange={(e) =>
                    setBlogForm({ ...blogForm, title: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={blogForm.category}
                    onChange={(e) =>
                      setBlogForm({ ...blogForm, category: e.target.value })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Author
                  </label>
                  <input
                    type="text"
                    required
                    value={blogForm.author}
                    onChange={(e) =>
                      setBlogForm({ ...blogForm, author: e.target.value })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Read Time
                  </label>
                  <input
                    type="text"
                    required
                    value={blogForm.readTime}
                    onChange={(e) =>
                      setBlogForm({ ...blogForm, readTime: e.target.value })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Status
                  </label>
                  <select
                    value={blogForm.status}
                    onChange={(e) =>
                      setBlogForm({
                        ...blogForm,
                        status: e.target.value as "published" | "draft",
                      })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-2 py-2 text-white cursor-pointer"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              <ImageUploader
                value={blogForm.img}
                onChange={(url) => setBlogForm({ ...blogForm, img: url })}
                folder="zimthreads/blog"
                label="Article Hero Banner"
                compact
              />
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Short Excerpt *
                </label>
                <input
                  type="text"
                  required
                  value={blogForm.excerpt}
                  onChange={(e) =>
                    setBlogForm({ ...blogForm, excerpt: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Article Content *
                </label>
                <textarea
                  required
                  rows={6}
                  value={blogForm.content}
                  onChange={(e) =>
                    setBlogForm({ ...blogForm, content: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white resize-none"
                  placeholder="Write your article in markdown or plain text..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#4a5c2d] hover:bg-[#5a7038] text-white font-bold uppercase tracking-widest mt-2 cursor-pointer"
              >
                Publish Article
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. Edit Blog Post Modal */}
      {editBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#1f2937] border border-[#374151] w-full max-w-xl p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#374151]">
              <h3 className="font-display text-lg font-bold uppercase">
                Edit Blog Article
              </h3>
              <button
                onClick={() => setEditBlog(null)}
                className="text-sm font-bold text-[#9ca3af] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEditBlog} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  value={editBlog.title}
                  onChange={(e) =>
                    setEditBlog({ ...editBlog, title: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={editBlog.category}
                    onChange={(e) =>
                      setEditBlog({ ...editBlog, category: e.target.value })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Author
                  </label>
                  <input
                    type="text"
                    required
                    value={editBlog.author}
                    onChange={(e) =>
                      setEditBlog({ ...editBlog, author: e.target.value })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Read Time
                  </label>
                  <input
                    type="text"
                    required
                    value={editBlog.readTime}
                    onChange={(e) =>
                      setEditBlog({ ...editBlog, readTime: e.target.value })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                    Status
                  </label>
                  <select
                    value={editBlog.status || "published"}
                    onChange={(e) =>
                      setEditBlog({
                        ...editBlog,
                        status: e.target.value as "published" | "draft",
                      })
                    }
                    className="w-full bg-[#111827] border border-[#374151] px-2 py-2 text-white cursor-pointer"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              <ImageUploader
                value={editBlog.img || ""}
                onChange={(url) => setEditBlog({ ...editBlog, img: url })}
                folder="zimthreads/blog"
                label="Article Hero Banner"
                compact
              />
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Short Excerpt *
                </label>
                <input
                  type="text"
                  required
                  value={editBlog.excerpt}
                  onChange={(e) =>
                    setEditBlog({ ...editBlog, excerpt: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Article Content *
                </label>
                <textarea
                  required
                  rows={6}
                  value={editBlog.content}
                  onChange={(e) =>
                    setEditBlog({ ...editBlog, content: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white resize-none"
                  placeholder="Write your article in markdown or plain text..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#4a5c2d] hover:bg-[#5a7038] text-white font-bold uppercase tracking-widest mt-2 cursor-pointer"
              >
                Save Article Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
