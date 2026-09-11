import { RouterProvider, useRouter } from "./router"
import { StoreProvider } from "./store/StoreContext"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import CartDrawer from "./components/CartDrawer"
import ToastContainer from "./components/ToastContainer"
import Home from "./pages/Home"
import Services from "./pages/Services"
import Shop from "./pages/Shop"
import Booking from "./pages/Booking"
import Blog from "./pages/Blog"
import About from "./pages/About"
import Contact from "./pages/Contact"
import Dashboard from "./pages/admin/Dashboard"

import SEOHead from "./components/SEOHead"

const routeSeo: Record<string, {
  title: string
  description: string
  canonical: string
}> = {
  "/": {
    title:
      "Zim Collectives | Premium Sneaker Care & Custom Streetwear Mauritius",
    description:
      "Mauritius' premier sneaker laundry, restoration, and custom streetwear studio. Professional shoe deep cleaning, un-yellowing, repainting & bespoke apparel.",
    canonical: "https://zimthreads.online/",
  },
  "/services": {
    title:
      "Sneaker Cleaning & Restoration Services Mauritius | Zim Collectives",
    description:
      "Explore our professional sneaker services in Mauritius: Standard Clean (Rs 300), Deep Clean (Rs 400), and Restore & Repaint (Rs 600+). Drop-off points across Mauritius.",
    canonical: "https://zimthreads.online/services",
  },
  "/shop": {
    title:
      "Shop Custom Streetwear & Sneaker Care Products | Zim Collectives Mauritius",
    description:
      "Browse bespoke Zim Collectives streetwear, premium heavyweight hoodies, and specialty sneaker cleaning supplies crafted in Mauritius.",
    canonical: "https://zimthreads.online/shop",
  },
  "/booking": {
    title: "Book Sneaker Cleaning Session | Zim Collectives Mauritius",
    description:
      "Book your sneaker cleaning, deep wash, or un-yellowing session online. Select your service, schedule drop-off, and track your restore progress in Mauritius.",
    canonical: "https://zimthreads.online/booking",
  },
  "/blog": {
    title:
      "Zim Collectives Journal | Sneaker Care Tips & Streetwear Culture Mauritius",
    description:
      "Expert shoe care advice, suede protection guides, midsole un-yellowing tips, and sneaker culture articles from the Zim Collectives team in Mauritius.",
    canonical: "https://zimthreads.online/blog",
  },
  "/about": {
    title:
      "About Zim Collectives Mauritius | Sneaker Restoration & Atelier Craft",
    description:
      "Learn about Zim Collectives, founded by Shepherd Chara. Dedicated to shoe longevity, sustainable sneaker restoration, and custom streetwear culture in Mauritius.",
    canonical: "https://zimthreads.online/about",
  },
  "/contact": {
    title: "Contact & Drop-Off Locations Mauritius | Zim Collectives",
    description:
      "Get in touch with Zim Collectives Mauritius. Call or WhatsApp +230 5513 2614, arrange drop-off and collection across Mauritius, or inquire about custom apparel.",
    canonical: "https://zimthreads.online/contact",
  },
}

function AppRoutes() {
  const { path } = useRouter()
  const cleanPath = path.split("?")[0].replace(/\/+$/, "") || "/"

  const isAdmin = cleanPath.startsWith("/admin")

  if (isAdmin) {
    return (
      <>
        <SEOHead
          title="Admin Dashboard | Zim Collectives"
          description="Internal management dashboard for Zim Collectives"
          noindex={true}
        />
        <Dashboard />
        <ToastContainer />
      </>
    )
  }

  const currentSeo = routeSeo[cleanPath] || routeSeo["/"]

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f2ec] text-[#1a1a1a]">
      <SEOHead
        title={currentSeo.title}
        description={currentSeo.description}
        canonicalUrl={currentSeo.canonical}
      />
      <Navbar />
      <div className="flex-1 pb-16 lg:pb-0">
        {cleanPath === "/" && <Home />}
        {cleanPath === "/services" && <Services />}
        {cleanPath === "/shop" && <Shop />}
        {cleanPath === "/booking" && <Booking />}
        {cleanPath === "/blog" && <Blog />}
        {cleanPath === "/about" && <About />}
        {cleanPath === "/contact" && <Contact />}
      </div>
      <Footer />
      <CartDrawer />
      <ToastContainer />
    </div>
  )
}

export default function App() {
  return (
    <RouterProvider>
      <StoreProvider>
        <AppRoutes />
      </StoreProvider>
    </RouterProvider>
  )
}
