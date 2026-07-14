// src/components/Main/sections/About/About.jsx
// ─────────────────────────────────────────────────────────────────
// Test destination for the cinematic transition system. Requests a
// navigation back to Home the same way the Hero wheel requests one —
// through transitionTo(). It knows nothing about GSAP, the overlay,
// or the splash video.
// ─────────────────────────────────────────────────────────────────

import { useTransition } from '../../../../hooks/useTransition'
import './About.css'

export default function About() {
  const { transitionTo, isTransitioning } = useTransition()

  return (
    <section className="about" aria-labelledby="about-title">
      <div className="about__inner">
        <p className="about__eyebrow">Section</p>
        <h1 id="about-title" className="about__title">ABOUT</h1>
        <p className="about__body">
          A test destination for the cinematic transition system. The
          splash you just saw is one element on a GSAP timeline — it
          never controlled the timing.
        </p>
        <button
          type="button"
          className="about__back"
          onClick={() => transitionTo('home')}
          disabled={isTransitioning}
        >
          ← Back to Home
        </button>
      </div>
    </section>
  )
}
