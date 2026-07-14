// src/components/TransitionOverlay/TransitionOverlay.jsx
// ─────────────────────────────────────────────────────────────────
// The single, global transition overlay. Mounted once (in App.jsx),
// fixed and full-viewport, pointer-events: none, sitting above the
// app. It holds the transparent splash <video> and hands the manager
// two imperative controls:
//
//   el   — the overlay DOM node (the manager fades this in/out)
//   play — reset the splash to frame 0 and play it once
//
// It owns NO timing logic. The video plays when the timeline says so
// and its own length gates nothing. Reusable for every future effect.
// ─────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { useTransition } from '../../hooks/useTransition'
import splashSrc from '../../assets/videos/splash-effect.webm'
import './TransitionOverlay.css'

export default function TransitionOverlay() {
  const { registerOverlay } = useTransition()
  const rootRef  = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    const el    = rootRef.current
    const video = videoRef.current

    // Hidden at rest — the timeline reveals it per transition.
    gsap.set(el, { autoAlpha: 0 })

    registerOverlay({
      el,
      play: () => {
        if (!video) return
        // Always from the beginning, never looping. Muted → play() is
        // allowed without a direct user gesture.
        try { video.pause() } catch { /* not yet playable */ }
        video.currentTime = 0
        const p = video.play()
        if (p && typeof p.catch === 'function') p.catch(() => {})
      },
    })

    return () => registerOverlay(null)
  }, [registerOverlay])

  return (
    <div ref={rootRef} className="transition-overlay" aria-hidden="true">
      <video
        ref={videoRef}
        className="transition-overlay__video"
        src={splashSrc}
        muted
        playsInline
        preload="auto"
      />
    </div>
  )
}
