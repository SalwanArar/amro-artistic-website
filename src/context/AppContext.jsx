// src/context/AppContext.jsx
// ─────────────────────────────────────────────────────────────────
// Global state for the Amro Gharz website.
// Every major system (Preloader, Intro, Audio, Sections) reads from
// or writes to this context so they stay in sync without prop drilling.
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from 'react'
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
  // audioEnabled:     whether background music should currently play.
  //                   Starts enabled; toggled by the UI button.
  // audioReady:       Howler has loaded and decoded the track.
  // introModeChosen:  true once the user picks Scroll or Auto-play in
  //                   the Intro. Music playback is gated on this (in
  //                   addition to audioEnabled) so it starts alongside
  //                   the sequence actually playing, not at the Enter
  //                   click while the mode-select screen just sits idle.
  const [audioEnabled,    setAudioEnabled]    = useState(true)
  const [audioReady,      setAudioReady]      = useState(false)
  const [introModeChosen, setIntroModeChosen] = useState(false)

  // ── INTRO STATE ───────────────────────────────────────────────
  // introComplete: true after the scroll-driven image sequence has
  //                fully played through. Unlocks the main sections.
  // introExiting:  true while the intro→hero hand-off is in progress
  //                (shared-element logo flight + hero chrome reveal) —
  //                Main is rendered during this window so both are
  //                mounted at once. See Intro.jsx's finishIntro().
  const [introComplete, setIntroComplete] = useState(false)
  const [introExiting,  setIntroExiting]  = useState(false)

  // Shared handle to Hero's real logo <img>. Intro reads its rect (FLIP
  // destination) and toggles its visibility during the hand-off — this is a
  // plain ref (not state) so wiring it up never triggers a re-render.
  const heroLogoRef = useRef(null)

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

  // Called by the Intro component the moment the user picks a mode
  // (Scroll or Auto-play). One-way flip — once chosen it stays chosen.
  const chooseIntroMode = useCallback(() => {
    setIntroModeChosen(true)
  }, [])

  // Called by the Intro component when the exit hand-off begins.
  // Causes Main to mount (Hero's real logo starts hidden — see
  // heroLogoRef — until Intro's shared-element flight lands on it).
  const exitIntro = useCallback(() => {
    setIntroExiting(true)
  }, [])

  // Called by the Intro component when the hand-off is done.
  const completeIntro = useCallback(() => {
    setIntroComplete(true)
    setIntroExiting(false)
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
    introModeChosen,
    introComplete,
    introExiting,
    heroLogoRef,
    // actions
    onProgress,
    enter,
    onAudioReady,
    toggleAudio,
    chooseIntroMode,
    exitIntro,
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
