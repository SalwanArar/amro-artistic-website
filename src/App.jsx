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

import { AppProvider } from './context/AppContext'
import { useApp }      from './context/AppContext'
import AudioToggle     from './components/AudioToggle/AudioToggle'
import { useAudio }    from './hooks/useAudio'
import { usePreloader } from './hooks/usePreloader'
import { useScroll }    from './hooks/useScroll'
import Preloader        from './components/Preloader/Preloader'
import Intro            from './components/Intro/Intro'

function AppInner() {
  // Start loading all assets immediately
  usePreloader()

  // Prepare background music and sync it with app state.
  useAudio()

  // Init Lenis smooth scroll + wire to GSAP ticker
  useScroll()

  const { isEntered } = useApp()

  return (
    <>
      {/* Loading overlay — always rendered first */}
      <Preloader />

      <AudioToggle />

      {/* Only mount scroll content after user clicks Enter */}
      {isEntered && (
        <>
          <Intro />

          {/* Main site — future steps */}
          {/* <main> ... </main> */}
        </>
      )}
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
