// src/App.jsx
// ─────────────────────────────────────────────────────────────────
// Root component.
//
// Render order:
//   Preloader   — full-screen loading overlay (unmounts after Enter)
//   Intro       — scroll-driven frame sequence (unmounts after last frame)
//   Main        — actual website content       (future steps)
//
// useScroll() is mounted here so Lenis + GSAP ticker are ready before
// any ScrollTrigger animations are registered inside Intro.
// ─────────────────────────────────────────────────────────────────

import { useEffect }            from 'react'
import { ScrollTrigger }        from 'gsap/ScrollTrigger'
import { AppProvider }          from './context/AppContext'
import { TransitionProvider }   from './transitions/TransitionProvider'
import { useApp }               from './hooks/useApp'
import AudioToggle              from './components/AudioToggle/AudioToggle'
import { useAudio }             from './hooks/useAudio'
import { usePreloader }         from './hooks/usePreloader'
import { useScroll }            from './hooks/useScroll'
import Preloader                from './components/Preloader/Preloader'
import Intro                    from './components/Intro/Intro'
import Main                     from './components/Main/Main'
import TransitionOverlay        from './components/TransitionOverlay/TransitionOverlay'

function AppInner() {
  usePreloader()
  useAudio()
  const lenisRef = useScroll()

  const { isEntered, introComplete, introExiting } = useApp()

  // Reset scroll once intro is fully done so main content starts at top
  useEffect(() => {
    if (!introComplete) return
    lenisRef.current?.scrollTo(0, { immediate: true })
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    ScrollTrigger.refresh()
  }, [introComplete, lenisRef])

  return (
    <>
      <Preloader />
      <AudioToggle />

      {/* Intro plays until all frames are shown */}
      {isEntered && !introComplete && <Intro />}

      {/* Main mounts during introExiting so hero can crossfade with the canvas */}
      {isEntered && (introComplete || introExiting) && <Main />}

      {/* Single global overlay for all section transitions. Mounted once,
          hidden at rest; the transition manager drives it. */}
      <TransitionOverlay />
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <TransitionProvider>
        <AppInner />
      </TransitionProvider>
    </AppProvider>
  )
}
