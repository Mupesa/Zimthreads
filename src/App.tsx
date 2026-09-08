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

function AppRoutes() {
  const { path } = useRouter()
  const cleanPath = path.split("?")[0].replace(/\/+$/, "") || "/"

  const isAdmin = cleanPath.startsWith("/admin")

  if (isAdmin) {
    return (
      <>
        <Dashboard />
        <ToastContainer />
      </>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f2ec] text-[#1a1a1a]">
      <Navbar />
      <div className="flex-1">
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
