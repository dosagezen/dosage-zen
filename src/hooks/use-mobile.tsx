import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Initialize with a safe default value
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  
  // Memoize the mobile state to prevent unnecessary re-renders
  const mobileState = React.useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < MOBILE_BREAKPOINT
  }, [])

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    // Set initial value immediately
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Debounce the change handler for better performance
    let timeout: NodeJS.Timeout
    const onChange = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT
        setIsMobile(newIsMobile)
      }, 100)
    }
    
    mql.addEventListener("change", onChange)
    return () => {
      mql.removeEventListener("change", onChange)
      clearTimeout(timeout)
    }
  }, [])

  return isMobile
}
