// src/components/Intro/Intro.jsx
// ─────────────────────────────────────────────────────────────────
// Scroll-driven / auto-play image-sequence player.
//
// MODES
// ─────
//   'idle'   — nothing active yet; buttons visible, hint shown
//   'scroll' — ScrollTrigger scrubs frames as user scrolls
//   'auto'   — GSAP tween plays all frames at a fixed FPS, no scroll needed
//
// Switching modes tears down the previous driver and starts the new one
// from the current frame position so playback is seamless.
// ─────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react'
import { gsap }            from 'gsap'
import { ScrollTrigger }   from 'gsap/ScrollTrigger'
import { useApp }          from '../../hooks/useApp'
import { getLoadedAssets } from '../../utils/assetLoader'
import {
  LAST_FRAME_WIDTH, LAST_FRAME_HEIGHT,
  LOGO_CENTER_X, LOGO_CENTER_Y, LOGO_DIAMETER,
  FLIGHT_DURATION, FLIGHT_EASE,
} from '../../constants/heroTransition'
import logoSrc from '../../assets/images/Logo.png'
import './Intro.css'
import ScrollIcon from './icons/ScrollIcon'
import PlayIcon from './icons/PlayIcon'
import IntroButton from './IntroButton/IntroButton'

gsap.registerPlugin(ScrollTrigger)

const PX_PER_FRAME  = 24      // scroll distance per frame (scroll mode)
const AUTO_DURATION = 11      // seconds to play all frames (auto mode)

// 'svh' stays pinned to the max-chrome-shown viewport height instead of
// live-tracking the mobile address bar like plain 'vh' does — avoids the
// canvas overlay resizing out from under the Intro->Hero measurement/flight.
const STABLE_VH_UNIT = typeof CSS !== 'undefined' && CSS.supports?.('height', '100svh') ? 'svh' : 'vh'

export default function Intro() {
  const { introComplete, exitIntro, completeIntro, heroLogoRef, chooseIntroMode } = useApp()

  const containerRef  = useRef(null)
  const canvasRef     = useRef(null)
  const ctxRef        = useRef(null)
  const frameIdxRef   = useRef(0)       // current frame index (source of truth)
  const stRef         = useRef(null)    // active ScrollTrigger
  const autoTweenRef  = useRef(null)    // active auto-play tween
  const roRef         = useRef(null)    // ResizeObserver
  const finishedRef   = useRef(false)   // guards finishIntro from firing twice
  const ghostRef      = useRef(null)    // floating logo used for the shared-element flight

  const [mode,         setMode]         = useState('idle')    // 'idle' | 'scroll' | 'auto'
  const [canvasVisible,setCanvasVisible] = useState(false)
  const [hintHidden,   setHintHidden]   = useState(false)
  const [frameCount] = useState(() => getLoadedAssets()?.frames.length ?? 0)

  // ── Draw a single frame index ─────────────────────────────────
  const drawFrame = useCallback((index) => {
    const assets = getLoadedAssets()
    if (!assets || !ctxRef.current || !canvasRef.current) return
    const frames = assets.frames
    const img = frames[Math.max(0, Math.min(Math.round(index), frames.length - 1))]
    if (!img) return
    const canvas = canvasRef.current
    const ctx    = ctxRef.current
    const cw = canvas.width,  ch = canvas.height
    const iw = img.naturalWidth || img.width
    const ih = img.naturalHeight || img.height
    const scale = Math.max(cw / iw, ch / ih)
    const dw = iw * scale, dh = ih * scale
    const dx = (cw - dw) / 2, dy = (ch - dh) / 2
    ctx.clearRect(0, 0, cw, ch)
    ctx.drawImage(img, dx, dy, dw, dh)
  }, [])

  // ── Resize canvas to DPR ──────────────────────────────────────
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width  = Math.round(canvas.clientWidth  * dpr)
    canvas.height = Math.round(canvas.clientHeight * dpr)
    ctxRef.current = canvas.getContext('2d')
    drawFrame(frameIdxRef.current)
  }, [drawFrame])

  // ── Tear down all active drivers ──────────────────────────────
  const tearDown = useCallback(() => {
    if (autoTweenRef.current) {
      autoTweenRef.current.kill()
      autoTweenRef.current = null
    }
    if (stRef.current) {
      stRef.current.kill()
      stRef.current = null
    }
  }, [])

  // ── Hide page scrollbar while intro is active ─────────────────
  useEffect(() => {
    if (introComplete) {
      document.documentElement.classList.remove('intro-active')
      return
    }
    document.documentElement.classList.add('intro-active')
    return () => document.documentElement.classList.remove('intro-active')
  }, [introComplete])

  // ── One-time canvas init ──────────────────────────────────────
  useEffect(() => {
    if (introComplete) return
    const assets = getLoadedAssets()
    if (!assets) return

    const count = assets.frames.length

    // Set scroll-container height for scroll mode
    if (containerRef.current) {
      containerRef.current.style.height = `${count * PX_PER_FRAME}px`
    }

    resizeCanvas()
    drawFrame(0)
    const revealFrame = requestAnimationFrame(() => setCanvasVisible(true))

    roRef.current = new ResizeObserver(resizeCanvas)
    roRef.current.observe(canvasRef.current)

    return () => {
      cancelAnimationFrame(revealFrame)
      roRef.current?.disconnect()
      tearDown()
    }
  }, [introComplete, drawFrame, resizeCanvas, tearDown])

  // ── Compute the on-screen circle the canvas is currently showing ──
  //
  // The final frame's logo is baked into its pixel content — there is no
  // DOM element for it. Its position/size within the 640x360 source frame
  // was measured once (see constants/heroTransition.js) and is reprojected
  // here through the same "cover fit" math drawFrame() uses, so this stays
  // correct at any viewport size/DPR without needing to guess.
  const measureCanvasLogoRect = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scale = Math.max(rect.width / LAST_FRAME_WIDTH, rect.height / LAST_FRAME_HEIGHT)
    const drawnW = LAST_FRAME_WIDTH * scale
    const drawnH = LAST_FRAME_HEIGHT * scale
    const offsetX = rect.left + (rect.width - drawnW) / 2
    const offsetY = rect.top + (rect.height - drawnH) / 2
    return {
      centerX:  offsetX + LOGO_CENTER_X * scale,
      centerY:  offsetY + LOGO_CENTER_Y * scale,
      diameter: LOGO_DIAMETER * scale,
    }
  }, [])

  // ── Finish intro (scroll + auto modes) ────────────────────────
  //
  // Shared-element strategy (Flutter-Hero-style flight, not a crossfade):
  //   1. Fix the canvas-wrap to screen (full-viewport overlay, z-index 50)
  //   2. Scroll to top so the hero is in position when it mounts
  //   3. Call exitIntro() → App renders Main; Hero mounts with its real
  //      logo already hidden (see RAF #1) so it can never flash into view
  //      at rest before the flight lands on it.
  //   4. RAF #1 (React has committed, browser hasn't painted yet): hide
  //      Hero's real logo.
  //   5. RAF #2 (layout is now stable and paintable): measure both the
  //      canvas's baked-in logo circle and Hero's real logo rect, drop a
  //      floating "ghost" <img> (same Logo.png) exactly on top of the
  //      canvas's logo, hide the whole canvas in the same tick (the swap
  //      is invisible because the ghost is pixel-identical to what was
  //      just there), then tween the ghost's transform (translate+scale
  //      only) to Hero's resting rect.
  //   6. onComplete → swap ghost for the real Hero logo (again pixel-
  //      identical, so invisible) → completeIntro() unmounts Intro.
  const finishIntro = useCallback(() => {
    if (finishedRef.current || introComplete) return
    finishedRef.current = true
    tearDown()

    const canvasWrap = containerRef.current?.querySelector('.intro__canvas-wrap')

    // Every child of .intro is (or is about to become) position:fixed, so
    // the section's own scroll-mode height (set in the canvas-init effect
    // above, up to ~4500px for a 189-frame sequence) is now dead weight —
    // but it still occupies that much *document* flow until Intro unmounts.
    // Left alone, that pushes Hero/Main that many pixels down the page for
    // the whole hand-off, so measureCanvasLogoRect/getBoundingClientRect
    // would target Hero's pre-scroll position instead of where it actually
    // rests — sending the flight toward a spot far below the viewport.
    // Collapsing it now (purely a layout change — every visible child is
    // already fixed-position, so nothing on screen moves) puts Hero at its
    // true resting position immediately.
    if (containerRef.current) {
      containerRef.current.style.height = '0px'
    }

    // Scroll to top before hero mounts so it is at the right position
    window.scrollTo({ top: 0, behavior: 'instant' })

    if (canvasWrap) {
      // Lift canvas out of flow so it can overlay the hero that's about to render
      gsap.set(canvasWrap, {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: `100${STABLE_VH_UNIT}`,
        zIndex: 50,
      })
    }

    // Fade out the control buttons so they don't hover over the hero
    const controlsEl = containerRef.current?.querySelector('.intro__controls')
    if (controlsEl) {
      gsap.to(controlsEl, { opacity: 0, duration: 0.35, ease: 'power2.out' })
    }

    // Tell App to render Main (hero mounts behind the fixed canvas)
    exitIntro()

    // RAF #1: React has committed Hero's DOM but the browser hasn't
    // painted it yet — hide the real logo now so it's never visible at
    // rest before the ghost lands on it.
    requestAnimationFrame(() => {
      if (heroLogoRef.current) {
        gsap.set(heroLogoRef.current, { autoAlpha: 0 })
      }

      // RAF #2: one more frame so layout is settled and both rects can
      // be measured accurately.
      requestAnimationFrame(() => {
        const sourceRect = measureCanvasLogoRect()
        const destEl     = heroLogoRef.current
        const destRect   = destEl?.getBoundingClientRect()

        if (!sourceRect || !destRect || !ghostRef.current) {
          // Defensive fallback — measurement wasn't possible, fall back
          // to a plain fade so the site never gets stuck mid-transition.
          if (destEl) gsap.set(destEl, { autoAlpha: 1 })
          if (canvasWrap) {
            gsap.to(canvasWrap, { opacity: 0, duration: 1.2, ease: 'power2.inOut', onComplete: completeIntro })
          } else {
            completeIntro()
          }
          return
        }

        const ghost = ghostRef.current
        const destCenterX = destRect.left + destRect.width / 2
        const destCenterY = destRect.top + destRect.height / 2

        // Ghost's resting box = Hero's real logo rect exactly. It starts
        // scaled/translated to alias the canvas's logo circle instead
        // (the FLIP "invert" step), so revealing it causes no jump.
        gsap.set(ghost, {
          top: destRect.top,
          left: destRect.left,
          width: destRect.width,
          height: destRect.height,
          x: sourceRect.centerX - destCenterX,
          y: sourceRect.centerY - destCenterY,
          scaleX: sourceRect.diameter / destRect.width,
          scaleY: sourceRect.diameter / destRect.height,
          autoAlpha: 1,
        })

        // The swap: canvas out, ghost in, same instant, same pixels.
        if (canvasWrap) gsap.set(canvasWrap, { autoAlpha: 0 })

        // destRect/sourceRect above are a one-shot snapshot. If the
        // viewport genuinely changes mid-flight (e.g. a mobile address
        // bar still finishing its show/hide animation right as this was
        // measured), that snapshot is now stale for whatever's left of
        // FLIGHT_DURATION — riding it out lands the ghost somewhere
        // wrong. Rather than try to redirect a moving target, cut
        // straight to the resting state: onComplete reveals the real,
        // currently-laid-out logo (destEl) instead of trusting the
        // ghost's baked math, so one hard cut beats visibly wrong numbers.
        let flightTween
        const settleEarly = () => flightTween?.progress(1)
        window.visualViewport?.addEventListener('resize', settleEarly)
        window.addEventListener('resize', settleEarly)

        flightTween = gsap.to(ghost, {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          duration: FLIGHT_DURATION,
          ease: FLIGHT_EASE,
          onComplete: () => {
            window.visualViewport?.removeEventListener('resize', settleEarly)
            window.removeEventListener('resize', settleEarly)
            // The swap back: real logo in, ghost out, same instant, same pixels.
            if (destEl) gsap.set(destEl, { autoAlpha: 1 })
            gsap.set(ghost, { autoAlpha: 0 })
            completeIntro()
          },
        })
      })
    })
  }, [introComplete, exitIntro, completeIntro, tearDown, heroLogoRef, measureCanvasLogoRect])

  // ── Activate SCROLL mode ──────────────────────────────────────
  const activateScroll = useCallback(() => {
    if (!containerRef.current || !frameCount) return
    tearDown()
    finishedRef.current = false
    setMode('scroll')
    setHintHidden(true)
    chooseIntroMode()

    const proxy = { frame: frameIdxRef.current }
    const lastFrame = frameCount - 1

    const tween = gsap.to(proxy, {
      frame: lastFrame,
      snap: 'frame',
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        start:   'top top',
        end:     'bottom bottom',
        scrub:   0.5,
        onUpdate: () => {
          frameIdxRef.current = Math.round(proxy.frame)
          drawFrame(frameIdxRef.current)
          if (frameIdxRef.current >= lastFrame) finishIntro()
        },
        onLeaveBack: () => { frameIdxRef.current = 0; drawFrame(0) },
      },
    })

    stRef.current = tween.scrollTrigger

    // Scroll the page so ScrollTrigger's position matches current frame
    const progress = frameIdxRef.current / (frameCount - 1)
    const totalPx  = frameCount * PX_PER_FRAME
    window.scrollTo({ top: totalPx * progress, behavior: 'instant' })

    ScrollTrigger.refresh()
  }, [frameCount, drawFrame, finishIntro, tearDown, chooseIntroMode])

  // ── Activate AUTO-PLAY mode ───────────────────────────────────
  const activateAuto = useCallback(() => {
    if (!frameCount) return
    tearDown()
    setMode('auto')
    setHintHidden(true)
    chooseIntroMode()

    const remaining = 1 - frameIdxRef.current / (frameCount - 1)
    const duration  = AUTO_DURATION * remaining

    const proxy = { frame: frameIdxRef.current }

    autoTweenRef.current = gsap.to(proxy, {
      frame:    frameCount - 1,
      duration,
      ease:     'none',
      onUpdate: () => {
        frameIdxRef.current = Math.round(proxy.frame)
        drawFrame(frameIdxRef.current)
      },
      onComplete: () => {
        autoTweenRef.current = null
        finishIntro()
      },
    })
  }, [frameCount, drawFrame, finishIntro, tearDown, chooseIntroMode])

  if (introComplete) return null

  const isScrollActive = mode === 'scroll'
  const isAutoActive   = mode === 'auto'

  return (
    <section
      ref={containerRef}
      // className="intro"
      className={`intro${mode !== 'idle' ? ' intro--fade-out' : ''}`}
      aria-label="Intro sequence"
    >
      {/* Canvas */}
      <div className="intro__canvas-wrap" style={{ willChange: 'transform' }}>
        <canvas
          ref={canvasRef}
          className={`intro__canvas${canvasVisible ? ' intro__canvas--visible' : ''}`}
          aria-hidden="true"
        />
      </div>

      {/* Mode buttons — fixed over the canvas */}
      <div className="intro__controls">
        <IntroButton
          onClick={activateScroll}
          label="Scroll mode"
          isHidden={hintHidden}
          isActive={isScrollActive}
          icon={<ScrollIcon />}
          labelText="Scroll"
          />

        <IntroButton
          onClick={activateAuto}
          label="Auto play"
          isHidden={hintHidden}
          isActive={isAutoActive}
          icon={<PlayIcon />}
          labelText="Auto play"
        />
      </div>

      {/* Scroll hint */}
      <div
        className={`intro__hint${hintHidden ? ' intro__hint--hidden' : ''}`}
        aria-hidden="true"
      >
        <span>Choose a mode</span>
        <div className="intro__hint-arrow" />
      </div>

      {/* Shared-element flight target — the same Logo.png Hero uses.
          Hidden until finishIntro() positions it; see measureCanvasLogoRect. */}
      <img
        ref={ghostRef}
        src={logoSrc}
        className="intro__logo-ghost"
        alt=""
        aria-hidden="true"
      />
    </section>
  )
}
