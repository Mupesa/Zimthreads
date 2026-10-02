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
      "Zimthreads Collective | Premium Sneaker Care & Custom Streetwear Mauritius",
    description:
      "Mauritius' premier sneaker laundry, restoration studio, and bespoke streetwear brand. Professional shoe deep cleaning, un-yellowing, repainting, and custom apparel.",
    canonical: "https://www.zimthreads.online/",
  },
  "/services": {
    title:
      "Sneaker Cleaning & Restoration Services Mauritius | Zimthreads Collective",
    description:
      "Explore our professional sneaker cleaning in Mauritius: Standard Clean (Rs 300), Deep Clean (Rs 400), and Restore & Repaint (Rs 600+). Drop-off points across Mauritius.",
    canonical: "https://www.zimthreads.online/services",
  },
  "/shop": {
    title:
      "Shop Streetwear Drops, Zimbabwe Jersey & Bracelets | Zimthreads Collective",
    description:
      "Browse official Zimthreads drops: Zimbabwe '02' Heritage Jersey, African Heritage Beaded Bracelets, and premium streetwear designed in Mauritius.",
    canonical: "https://www.zimthreads.online/shop",
  },
  "/booking": {
    title: "Book Sneaker Cleaning Session | Zimthreads Collective Mauritius",
    description:
      "Book your sneaker cleaning, deep wash, or sole un-yellowing session online with Zimthreads. Choose your drop-off point and track progress in Mauritius.",
    canonical: "https://www.zimthreads.online/booking",
  },
  "/blog": {
    title:
      "Zimthreads Collective Journal | Sneaker Care Tips & Streetwear Culture Mauritius",
    description:
      "Expert shoe care guides, suede revival advice, midsole un-yellowing techniques, and streetwear culture insights from the Zimthreads Collective team.",
    canonical: "https://www.zimthreads.online/blog",
  },
  "/about": {
    title:
      "About Zimthreads Collective | Sneaker Restoration & Atelier Craft Mauritius",
    description:
      "Learn about Zimthreads Collective, founded by Shepherd Chara. Dedicated to shoe longevity, sustainable sneaker restoration, and custom streetwear culture.",
    canonical: "https://www.zimthreads.online/about",
  },
  "/contact": {
    title: "Contact & Drop-Off Locations Mauritius | Zimthreads Collective",
    description:
      "Get in touch with Zimthreads Collective Mauritius. Call or WhatsApp +230 5513 2614, arrange drop-off and collection, or inquire about bespoke orders.",
    canonical: "https://www.zimthreads.online/contact",
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
          title="Admin Dashboard | Zimthreads Collective"
          description="Internal management dashboard for Zimthreads Collective"
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
