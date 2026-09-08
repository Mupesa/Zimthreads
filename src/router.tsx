import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react"

interface RouterContextType {
  path: string
  navigate: (to: string) => void
}

const RouterContext = createContext<RouterContextType>({
  path: "/",
  navigate: () => {},
})

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname)

  const navigate = useCallback((to: string) => {
    window.history.pushState(null, "", to)
    setPath(to)
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const handlePop = () => setPath(window.location.pathname)
    window.addEventListener("popstate", handlePop)
    return () => window.removeEventListener("popstate", handlePop)
  }, [])

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  )
}

export function useRouter() {
  return useContext(RouterContext)
}

export function Link({
  to,
  children,
  className,
  onClick,
}: {
  to: string
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  const { navigate } = useRouter()
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        e.preventDefault()
        navigate(to)
        onClick?.()
      }}
    >
      {children}
    </a>
  )
}

export function useLocation() {
  const { path } = useRouter()
  return { pathname: path }
}
