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
import './Intro.css'

gsap.registerPlugin(ScrollTrigger)

const PX_PER_FRAME  = 24      // scroll distance per frame (scroll mode)
const AUTO_DURATION = 11      // seconds to play all frames (auto mode)

export default function Intro() {
  const { introComplete, completeIntro } = useApp()

  const containerRef  = useRef(null)
  const canvasRef     = useRef(null)
  const ctxRef        = useRef(null)
  const frameIdxRef   = useRef(0)       // current frame index (source of truth)
  const stRef         = useRef(null)    // active ScrollTrigger
  const autoTweenRef  = useRef(null)    // active auto-play tween
  const roRef         = useRef(null)    // ResizeObserver
  const finishedRef   = useRef(false)   // guards finishIntro from firing twice

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

  // ── Finish intro (scroll + auto modes) ────────────────────────
  const finishIntro = useCallback(() => {
    if (finishedRef.current || introComplete) return
    finishedRef.current = true
    tearDown()
    completeIntro()
  }, [introComplete, completeIntro, tearDown])

  // ── Activate SCROLL mode ──────────────────────────────────────
  const activateScroll = useCallback(() => {
    if (!containerRef.current || !frameCount) return
    tearDown()
    finishedRef.current = false
    setMode('scroll')
    setHintHidden(true)

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
  }, [frameCount, drawFrame, finishIntro, tearDown])

  // ── Activate AUTO-PLAY mode ───────────────────────────────────
  const activateAuto = useCallback(() => {
    if (!frameCount) return
    tearDown()
    setMode('auto')
    setHintHidden(true)

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
  }, [frameCount, drawFrame, finishIntro, tearDown])

  const deactivate = useCallback(() => {
    tearDown()
    setMode('idle')
    setHintHidden(false)
  }, [tearDown])

  if (introComplete) return null

  const isScrollActive = mode === 'scroll'
  const isAutoActive   = mode === 'auto'

  return (
    <section
      ref={containerRef}
      className="intro"
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
        <button
          className={`intro__btn${isScrollActive ? ' intro__btn--active' : ''}`}
          onClick={isScrollActive ? deactivate : activateScroll}
          aria-pressed={isScrollActive}
          aria-label="Scroll mode"
        >
          {/* Scroll icon */}
          <svg className="intro__btn-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="8" y="2" width="8" height="14" rx="4" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="12" cy="7" r="1.5" fill="currentColor"/>
            <path d="M8 19l4 3 4-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Scroll</span>
        </button>

        <button
          className={`intro__btn${isAutoActive ? ' intro__btn--active' : ''}`}
          onClick={isAutoActive ? deactivate : activateAuto}
          aria-pressed={isAutoActive}
          aria-label="Auto play"
        >
          {/* Play icon */}
          <svg className="intro__btn-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {isAutoActive
              ? <><rect x="6"  y="5" width="4" height="14" rx="1" fill="currentColor"/>
                  <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/></>
              : <path d="M6 4.5l14 7.5-14 7.5V4.5z" fill="currentColor"/>
            }
          </svg>
          <span>{isAutoActive ? 'Pause' : 'Auto play'}</span>
        </button>
      </div>

      {/* Scroll hint */}
      <div
        className={`intro__hint${hintHidden ? ' intro__hint--hidden' : ''}`}
        aria-hidden="true"
      >
        <span>Choose a mode</span>
        <div className="intro__hint-arrow" />
      </div>
    </section>
  )
}
