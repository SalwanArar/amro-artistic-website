// src/context/AppContext.jsx
// ─────────────────────────────────────────────────────────────────
// Global state for the Amro Gharz website.
// Every major system (Preloader, Intro, Audio, Sections) reads from
// or writes to this context so they stay in sync without prop drilling.
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react'
import { AppContext } from './AppContextValue'

// ── 1. CREATE CONTEXT ────────────────────────────────────────────

// ── 2. PROVIDER ──────────────────────────────────────────────────
export function AppProvider({ children }) {

  // ── LOADING STATE ─────────────────────────────────────────────
  // progress    : 0–100, driven by assetLoader.js
  // currentAsset: name of the file currently being loaded (shown
  //               in the preloader status line)
  // isLoaded    : true once progress hits 100 and all assets are
  //               cached in memory
  const [progress,     setProgress]     = useState(0)
  const [currentAsset, setCurrentAsset] = useState('Initializing…')
  const [isLoaded,     setIsLoaded]     = useState(false)

  // ── ENTRY STATE ───────────────────────────────────────────────
  // isEntered: true after the user clicks "Enter" on the preloader.
  // Triggers the GSAP intro sequence and fades out the preloader.
  const [isEntered, setIsEntered] = useState(false)

  // ── AUDIO STATE ───────────────────────────────────────────────
  // audioEnabled: whether background music should currently play.
  //               It starts enabled and begins after the first
  //               user interaction (the Enter button).
  // audioReady  : Howler has loaded and decoded the track.
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [audioReady,   setAudioReady]   = useState(false)

  // ── INTRO STATE ───────────────────────────────────────────────
  // introComplete: true after the scroll-driven image sequence has
  //                fully played through. Unlocks the main sections.
  const [introComplete, setIntroComplete] = useState(false)

  // ── ACTIONS ───────────────────────────────────────────────────
  // Wrapped in useCallback so components that receive these as props
  // don't re-render needlessly.

  // Called by assetLoader.js on every loaded asset.
  // pct  : current overall percentage (0–100)
  // label: human-readable name of the asset just loaded
  const onProgress = useCallback((pct, label) => {
    setProgress(pct)
    setCurrentAsset(label)
    if (pct >= 100) {
      setIsLoaded(true)
    }
  }, [])

  // Called when the user clicks "Enter" on the preloader.
  const enter = useCallback(() => {
    setIsEntered(true)
  }, [])

  // Called by the audio hook (useAudio.js) once Howler is ready.
  const onAudioReady = useCallback(() => {
    setAudioReady(true)
  }, [])

  // Called by the audio toggle button in the UI.
  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => !prev)
  }, [])

  // Called by the Intro component when the sequence ends.
  const completeIntro = useCallback(() => {
    setIntroComplete(true)
  }, [])

  // ── CONTEXT VALUE ─────────────────────────────────────────────
  // Everything exposed to the rest of the app.
  const value = {
    // state
    progress,
    currentAsset,
    isLoaded,
    isEntered,
    audioEnabled,
    audioReady,
    introComplete,
    // actions
    onProgress,
    enter,
    onAudioReady,
    toggleAudio,
    completeIntro,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

// ── 3. HOOK ───────────────────────────────────────────────────────
// useApp() is the only way any component should access this context.
// It throws a clear error if someone forgets to wrap with AppProvider.
