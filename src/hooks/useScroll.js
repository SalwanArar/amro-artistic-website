// src/hooks/useScroll.js
// ─────────────────────────────────────────────────────────────────
// Initialises Lenis smooth scroll and wires it to the GSAP ticker
// so ScrollTrigger's scrub animations stay perfectly in sync.
//
// Returns the Lenis instance so consumers can:
//   - lenis.scrollTo(target)
//   - lenis.on('scroll', cb)
//   - lenis.stop() / lenis.start()
//
// Mount ONCE — at AppInner level. Cleaned up automatically on unmount.
// ─────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import Lenis                 from 'lenis'
import { gsap }              from 'gsap'
import { ScrollTrigger }     from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// By default GSAP ignores small viewport-height changes on touch-only
// devices (e.g. the address bar hiding while scrolling) to avoid jank.
// Our intro's scroll-driven ScrollTrigger uses `end: 'bottom bottom'`,
// which is computed FROM the viewport height — so an ignored resize
// leaves that end position stale, capping scroll progress just short
// of 1 once the address bar collapses mid-scroll on touch. Disabling
// this keeps `end` in sync with the real scrollable range on touch.
ScrollTrigger.config({ ignoreMobileResize: false })

export function useScroll() {
  const lenisRef = useRef(null)

  useEffect(() => {
    // Create Lenis instance
    const lenis = new Lenis({
      duration:   1.3,
      easing:     t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch:   false,   // native momentum on mobile
    })
    lenisRef.current = lenis

    // Pipe Lenis into GSAP's RAF so ScrollTrigger scrub stays synced
    const rafId = gsap.ticker.add(time => {
      lenis.raf(time * 1000)  // GSAP time is in seconds, Lenis wants ms
    })
    gsap.ticker.lagSmoothing(0)   // prevent lag spike on tab-switch

    // Also keep ScrollTrigger updated on every Lenis scroll event
    lenis.on('scroll', ScrollTrigger.update)

    return () => {
      gsap.ticker.remove(rafId)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  return lenisRef
}