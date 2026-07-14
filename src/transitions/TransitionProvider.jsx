// src/transitions/TransitionProvider.jsx
// ─────────────────────────────────────────────────────────────────
// The Transition Manager.
//
// Owns the runtime navigation domain: which section is active, which
// (if any) is transitioning in, whether nav is locked, and the master
// GSAP timeline that coordinates the whole cinematic hand-off.
//
// Public API (via useTransition):
//   activeSection    — id of the section currently shown
//   pendingSection   — id of the section transitioning in (or null)
//   isTransitioning  — nav lock flag
//   transitionTo(id, effect?) — request a navigation; everything else
//                               (lock → play effect → swap → unlock)
//                               is handled here
//
// Design notes:
//   • The video never drives timing — the GSAP timeline does. Effects
//     (effects.js) only add tweens to the timeline we own here.
//   • The section swap (React state commit) happens in the timeline's
//     onComplete, but the incoming layer is keyed by section id in
//     SectionHost, so its DOM node persists across that commit — no
//     remount, no flicker.
//   • No setTimeout anywhere; the timeline is the single clock.
// ─────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { TransitionContext } from './TransitionContextValue'
import { SECTIONS, DEFAULT_SECTION } from '../constants/sections'
import { EFFECTS, DEFAULT_EFFECT } from './effects'

export function TransitionProvider({ children }) {
  const [activeSection,   setActiveSection]   = useState(DEFAULT_SECTION)
  const [pendingSection,  setPendingSection]  = useState(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // DOM handles registered by the view layer.
  const layerEls   = useRef(new Map())  // sectionId -> section layer node
  const overlayRef = useRef(null)       // { el, play } from TransitionOverlay
  const effectRef  = useRef(DEFAULT_EFFECT)
  const tlRef      = useRef(null)

  // SectionHost registers/unregisters each live layer's DOM node.
  const registerLayer = useCallback((id, el) => {
    if (el) layerEls.current.set(id, el)
    else    layerEls.current.delete(id)
  }, [])

  // TransitionOverlay registers its imperative handle once on mount.
  const registerOverlay = useCallback((api) => {
    overlayRef.current = api
  }, [])

  // Navigation only *requests* — no GSAP knowledge lives at the call site.
  const transitionTo = useCallback((next, effect = DEFAULT_EFFECT) => {
    if (isTransitioning) return                 // locked mid-flight
    if (!SECTIONS[next]) {                       // tab with no section yet
      if (import.meta.env.DEV) console.warn(`[transition] no section "${next}"`)
      return
    }
    if (next === activeSection) return            // already there
    effectRef.current = EFFECTS[effect] ? effect : DEFAULT_EFFECT
    setIsTransitioning(true)
    setPendingSection(next)                        // mounts the incoming layer
  }, [isTransitioning, activeSection])

  // Once pendingSection is set, SectionHost has mounted BOTH layers and
  // registered their nodes. Build and play the master timeline here.
  useLayoutEffect(() => {
    if (!pendingSection) return

    const outgoing = layerEls.current.get(activeSection) || null
    const incoming = layerEls.current.get(pendingSection)
    const overlay  = overlayRef.current

    const commit = () => {
      // Leave the incoming layer clean (its node persists as the new
      // active layer, keyed by id) so nothing flashes on the swap.
      if (incoming) gsap.set(incoming, { clearProps: 'opacity,visibility' })
      setActiveSection(pendingSection)
      setPendingSection(null)
      setIsTransitioning(false)
      tlRef.current = null
    }

    // Defensive: if anything needed is missing, commit instantly so the
    // site can never get stuck behind a locked, half-built transition.
    if (!incoming || !overlay?.el) {
      commit()
      return
    }

    // Hide the incoming layer NOW — this runs before the browser paints,
    // so the newly-mounted section (which stacks above the outgoing one)
    // never flashes at full opacity before its fade-in tween begins.
    gsap.set(incoming, { autoAlpha: 0 })

    const tl = gsap.timeline({ onComplete: commit })
    tlRef.current = tl

    EFFECTS[effectRef.current]({
      tl,
      overlayEl: overlay.el,
      playVideo: overlay.play,
      outgoing,
      incoming,
    })

    return () => tl.kill()
  }, [pendingSection, activeSection])

  const value = {
    activeSection,
    pendingSection,
    isTransitioning,
    transitionTo,
    registerLayer,
    registerOverlay,
  }

  return (
    <TransitionContext.Provider value={value}>
      {children}
    </TransitionContext.Provider>
  )
}
