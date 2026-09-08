import { useState, useMemo } from "react"
import { Link } from "@/router"
import { useStore } from "@/store/StoreContext"
import {
  BookingItem,
  OrderItem,
  Product,
  Service,
  BlogPost,
  Inquiry,
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
    updateBookingStatus,
    deleteBooking,
    addBooking,
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
    markInquiryAsRead,
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
  const [viewOrder, setViewOrder] = useState<OrderItem | null>(null)

  // Form states for creators
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
    sizes: "",
    featured: false,
  })

  const [serviceForm, setServiceForm] = useState({
    title: "",
    subtitle: "",
    price: "From $15",
    priceNumeric: 15,
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
    author: "Tinashe Moyo",
    readTime: "5 min read",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=500&fit=crop&auto=format",
    alt: "Article banner",
    excerpt: "",
    content: "",
  })

  const [settingsForm, setSettingsForm] = useState(settings)

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
        b.status !== "Cancelled" ? sum + (b.priceNumeric || 15) : sum,
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
    ]
  }, [bookings, orders, customers, pendingBookingsCount, processingOrdersCount])

  // Handlers for Form Submissions
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault()
    const serviceObj =
      services.find((s) => s.id === bookingForm.serviceId) || services[0]
    addBooking({
      customer: bookingForm.customer,
      email: bookingForm.email,
      phone: bookingForm.phone,
      serviceId: serviceObj.id,
      serviceName: serviceObj.title,
      price: serviceObj.price,
      priceNumeric: serviceObj.priceNumeric || 15,
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
  }

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault()
    const sizesArray = productForm.sizes
      ? productForm.sizes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined

    addProduct({
      name: productForm.name,
      category: productForm.category,
      price: Number(productForm.price),
      stock: Number(productForm.stock),
      img: productForm.img,
      alt: productForm.name,
      description: productForm.description,
      sizes: sizesArray,
      featured: productForm.featured,
    })
    setNewProductModal(false)
  }

  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editProduct) return
    updateProduct(editProduct.id, editProduct)
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
      priceNumeric: Number(serviceForm.priceNumeric),
      desc: serviceForm.desc,
      features: featuresList,
      turnaround: serviceForm.turnaround,
      img: serviceForm.img,
      alt: serviceForm.title,
      active: serviceForm.active,
    })
    setNewServiceModal(false)
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

        <div className="flex items-center gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                  ${o.totalAmount}
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
                                onClick={() => deleteBooking(b.id)}
                                className="text-xs text-red-400 hover:text-red-300 font-bold p-1"
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
                            <td className="p-4">
                              <p className="font-mono font-bold text-sm text-white">
                                ${o.totalAmount}
                              </p>
                              <span className="inline-block text-[9px] font-bold text-[#86a84e] bg-[#4a5c2d]/20 px-1.5 py-0.5">
                                {o.paymentMethod}
                              </span>
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
                                className="text-xs text-[#86a84e] hover:underline font-bold"
                              >
                                View
                              </button>
                              <button
                                onClick={() => deleteOrder(o.id)}
                                className="text-xs text-red-400 hover:text-red-300 font-bold"
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
                          onClick={() => deleteService(s.id)}
                          className="px-3 py-1 bg-red-950 text-xs font-bold uppercase text-red-400 hover:bg-red-900"
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
          {active === "products" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-extrabold uppercase text-[#f9fafb]">
                    PRODUCTS & MERCHANDISE ({products.length})
                  </h1>
                  <p className="text-xs text-[#9ca3af]">
                    Manage cleaning kits, suede brushes, apparel inventory &
                    pricing
                  </p>
                </div>
                <button
                  onClick={() => setNewProductModal(true)}
                  className="px-4 py-2 bg-[#4a5c2d] hover:bg-[#5a7038] text-white text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  + Add New Product
                </button>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-[#1f2937] border border-[#374151] p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-square bg-[#111827] overflow-hidden mb-3">
                        <img
                          src={p.img}
                          alt={p.alt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-[#86a84e] uppercase tracking-wider">
                          {p.category}
                        </span>
                        <span className="text-xs font-mono font-bold text-white">
                          ${p.price}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-white mb-1 leading-snug truncate">
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
                          value={p.stock}
                          onChange={(e) =>
                            updateProduct(p.id, {
                              stock: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-14 bg-[#111827] border border-[#374151] px-1.5 py-0.5 text-xs text-white text-center font-mono"
                        />
                      </div>
                      <div className="space-x-2">
                        <button
                          onClick={() => setEditProduct(p)}
                          className="text-xs text-[#86a84e] hover:underline font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="text-xs text-red-400 hover:text-red-300 font-bold"
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
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-[#86a84e] uppercase tracking-wider">
                            {post.category}
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
                        onClick={() => setEditBlog(post)}
                        className="px-3 py-1.5 bg-[#374151] text-xs font-bold uppercase text-white hover:bg-[#4b5563]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteBlogPost(post.id)}
                        className="px-3 py-1.5 bg-red-950 text-xs font-bold uppercase text-red-400 hover:bg-red-900"
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
                            ${c.totalSpent.toFixed(2)}
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
                        <p className="text-xs text-[#d1d5db] leading-relaxed mb-4">
                          {inq.message}
                        </p>

                        <div className="flex justify-end gap-3 pt-2 border-t border-[#374151]">
                          <button
                            onClick={() => markInquiryAsRead(inq.id, !inq.read)}
                            className="text-xs text-[#9ca3af] hover:text-white font-semibold"
                          >
                            {inq.read ? "Mark as Unread" : "Mark as Read"}
                          </button>
                          <button
                            onClick={() => deleteInquiry(inq.id)}
                            className="text-xs text-red-400 hover:text-red-300 font-bold"
                          >
                            Delete
                          </button>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] block mb-1">
                      Standard Delivery Fee ($)
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
                      Free Delivery Threshold ($)
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
                className="w-full py-2.5 bg-[#4a5c2d] hover:bg-[#5a7038] text-white font-bold uppercase tracking-widest mt-2"
              >
                Save Booking
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. New Product Modal */}
      {newProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#1f2937] border border-[#374151] w-full max-w-md p-6 text-white shadow-2xl animate-scale-up">
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
                    Price ($) *
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
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                  Sizes / Options (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. S, M, L, XL"
                  value={productForm.sizes}
                  onChange={(e) =>
                    setProductForm({ ...productForm, sizes: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white"
                />
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
          <div className="bg-[#1f2937] border border-[#374151] w-full max-w-md p-6 text-white shadow-2xl animate-scale-up">
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
                    Price ($)
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
                    Price Tag
                  </label>
                  <input
                    type="text"
                    placeholder="From $20"
                    value={serviceForm.price}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, price: e.target.value })
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
              <button
                type="submit"
                className="w-full py-2.5 bg-[#4a5c2d] hover:bg-[#5a7038] text-white font-bold uppercase tracking-widest mt-2"
              >
                Add Service Offering
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
                <p className="text-[#86a84e] font-bold mt-1">
                  Payment Method: {viewOrder.paymentMethod}
                </p>
                {viewOrder.phone && (
                  <div className="mt-2 pt-2 border-t border-[#374151]/50">
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
                        {item.quantity} x ${item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-[#111827] border border-[#374151] font-bold text-sm">
                <span>Grand Total:</span>
                <span className="text-[#86a84e] font-mono">
                  ${viewOrder.totalAmount}
                </span>
              </div>
            </div>

            <button
              onClick={() => setViewOrder(null)}
              className="w-full py-2.5 bg-[#374151] hover:bg-[#4b5563] text-white font-bold uppercase tracking-widest text-xs"
            >
              Close
            </button>
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
              <div className="grid grid-cols-3 gap-2">
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
                className="w-full py-2.5 bg-[#4a5c2d] hover:bg-[#5a7038] text-white font-bold uppercase tracking-widest mt-2"
              >
                Publish Article
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
