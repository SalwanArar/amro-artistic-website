// src/components/Preloader/Preloader.jsx
// ─────────────────────────────────────────────────────────────────
// Full-screen loading overlay that:
//   1. Shows a progress bar driven by AppContext (fed by assetLoader)
//   2. Reveals an "Enter" button once isLoaded === true
//   3. Plays a fade-out exit animation when the user clicks Enter,
//      then calls context.enter() to unlock the intro sequence
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react'
import { useApp }                from '../../hooks/useApp'
import './Preloader.css'

export default function Preloader() {
  const { progress, currentAsset, isLoaded, isEntered, enter } = useApp()
  const [leaving, setLeaving] = useState(false)

  // ── Handle Enter click ────────────────────────────────────────
  const handleEnter = useCallback(() => {
    if (leaving) return
    setLeaving(true)

    // Give the CSS fade-out time to run (matches transition: 0.9s)
    setTimeout(() => {
      enter()
    }, 900)
  }, [leaving, enter])

  // Once the AppContext marks us as entered, stop rendering entirely
  // (the component tree can unmount Preloader after the transition)
  if (isEntered && !leaving) return null

  return (
    <div
      className={`preloader${leaving ? ' preloader--leaving' : ''}`}
      aria-label="Loading"
      aria-busy={!isLoaded}
    >
      {/* Ambient glow */}
      <div className="preloader__glow" aria-hidden="true" />

      {/* Logo / wordmark */}
      <div className="preloader__logo">
        <span className="preloader__logo-text">Amro Gharz</span>
      </div>

      {/* Progress bar */}
      <div className="preloader__bar-wrap" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="preloader__track">
          <div
            className="preloader__fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="preloader__meta">
          <span className="preloader__pct">{progress}%</span>
          <span className="preloader__asset">{currentAsset}</span>
        </div>
      </div>

      {/* Enter button — appears once fully loaded */}
      <div className={`preloader__enter${isLoaded ? ' preloader__enter--visible' : ''}`}>
        <button
          className="preloader__enter-btn"
          onClick={handleEnter}
          disabled={!isLoaded}
          aria-label="Enter the site"
        >
          Enter
        </button>
      </div>
    </div>
  )
}
