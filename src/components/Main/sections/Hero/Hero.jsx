import { useEffect, useRef } from 'react'
import { gsap } from 'gsap/gsap-core'
import { useApp } from '../../../../hooks/useApp'
import './Hero.css'
import logo from '../../../../assets/images/Logo.png'

export default function Hero() {
  const { introExiting } = useApp()
  const heroRef = useRef(null)

  useEffect(() => {
    if (!introExiting || !heroRef.current) return

    // Fade in while the canvas is fading out — duration matches canvas fade (1.2 s)
    gsap.fromTo(
      heroRef.current,
      { opacity: 0, scale: 1.06 },
      { opacity: 1, scale: 1, duration: 1.2, delay: 0.1, ease: 'power2.inOut' }
    )
  }, [introExiting])

  return (
    <section
      ref={heroRef}
      className="hero"
      aria-labelledby="hero-title"
      style={{ opacity: introExiting ? 0 : 1 }}
    >
      <img
        src={logo}
        style={{ width: '230px' }}
        alt="Hero"
        className="hero__image"
      />
    </section>
  )
}
