import * as React from "react"

// Breakpoints aligned with Tailwind's default breakpoints
export const BREAKPOINTS = {
  SM: 640,  // Small devices (phones, 640px and up)
  MD: 768,  // Medium devices (tablets, 768px and up)
  LG: 1024, // Large devices (laptops, 1024px and up)
  XL: 1280, // Extra large devices (desktops, 1280px and up)
  XXL: 1536 // 2XL devices (large desktops, 1536px and up)
}

type BreakpointKey = keyof typeof BREAKPOINTS

/**
 * Hook to check if the current viewport is below a specific breakpoint
 * @param breakpoint - The breakpoint to check (default: MD - 768px)
 * @returns Boolean indicating if the viewport is below the specified breakpoint
 */
export function useIsBelowBreakpoint(breakpoint: BreakpointKey = 'MD') {
  const [isBelow, setIsBelow] = React.useState<boolean | undefined>(undefined)
  const breakpointValue = BREAKPOINTS[breakpoint]

  React.useEffect(() => {
    // Initial check
    setIsBelow(window.innerWidth < breakpointValue)
    
    // Set up listener for resize events
    const checkBreakpoint = () => {
      setIsBelow(window.innerWidth < breakpointValue)
    }
    
    // Use both matchMedia and window resize for better coverage
    const mql = window.matchMedia(`(max-width: ${breakpointValue - 1}px)`)
    const onChange = () => checkBreakpoint()
    
    // Add event listeners
    mql.addEventListener("change", onChange)
    window.addEventListener("resize", checkBreakpoint)
    
    // Clean up event listeners
    return () => {
      mql.removeEventListener("change", onChange)
      window.removeEventListener("resize", checkBreakpoint)
    }
  }, [breakpointValue])

  return !!isBelow
}

/**
 * Hook to detect mobile devices
 * @returns Boolean indicating if the current device is mobile (below MD breakpoint)
 */
export function useIsMobile() {
  return useIsBelowBreakpoint('MD')
}

/**
 * Hook to detect a small mobile device
 * @returns Boolean indicating if the current device is a small mobile (below SM breakpoint)
 */
export function useIsSmallMobile() {
  return useIsBelowBreakpoint('SM')
}

/**
 * Hook to detect tablet devices
 * @returns Boolean indicating if the current device is a tablet (between MD and LG breakpoints)
 */
export function useIsTablet() {
  const isBelowLarge = useIsBelowBreakpoint('LG')
  const isBelowMedium = useIsBelowBreakpoint('MD')
  
  return isBelowLarge && !isBelowMedium
}

/**
 * Hook to get the current device type
 * @returns String indicating the current device type ('mobile', 'tablet', or 'desktop')
 */
export function useDeviceType() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  
  if (isMobile) return 'mobile'
  if (isTablet) return 'tablet'
  return 'desktop'
}

/**
 * Hook to check if the device has touch capabilities
 * @returns Boolean indicating if touch is available
 */
export function useHasTouch() {
  const [hasTouch, setHasTouch] = React.useState<boolean | undefined>(undefined)
  
  React.useEffect(() => {
    setHasTouch(
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 || 
      (navigator as any).msMaxTouchPoints > 0
    )
  }, [])
  
  return !!hasTouch
}
