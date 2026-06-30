import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap/gsap-core'
import { useApp } from '../../../../hooks/useApp'

import './Hero.css'

import logo from '../../../../assets/images/Logo.png'

import geometricCircle from './assets/svg/Geometric Circle.svg'
import logoBg from './assets/images/Logo bg.png'
import blueSpiral from './assets/svg/Blue Spiral.svg'
import pinkSpiral from './assets/svg/Pink Spiral.svg'

const NAV_ITEMS = [
  { label: 'HOME', color: '#F5821F', angle: 0 },
  { label: 'PORTFOLIO', color: '#4C7FA7', angle: 60 },
  { label: 'SHOP', color: '#6B4FA4', angle: 120 },
  { label: 'ABOUT', color: '#A56A4D', angle: 180 },
  { label: 'SUBSCRIBE', color: '#356D96', angle: 240 },
  { label: 'LEARN', color: '#C2468D', angle: 300 },
]

const SEP_ANGLES = [30, 90, 150, 210, 270, 330]

function navTransform(angle, radius) {
  const rad = (angle - 90) * (Math.PI / 180)
  const x = (radius * Math.cos(rad)).toFixed(2)
  const y = (radius * Math.sin(rad)).toFixed(2)
  const rot = angle >= 180 ? angle - 180 : angle
  return `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${rot}deg)`
}

function sepTransform(angle, radius) {
  const rad = (angle - 90) * (Math.PI / 180)
  const x = (radius * Math.cos(rad)).toFixed(2)
  const y = (radius * Math.sin(rad)).toFixed(2)
  return `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
}

export default function Hero() {
  const { introExiting } = useApp()

  const heroRef = useRef(null)
  const ringRef = useRef(null)
  const [navRadius, setNavRadius] = useState(180)

  useEffect(() => {
    const ring = ringRef.current
    if (!ring) return
    const update = () => setNavRadius(ring.offsetWidth * 0.44)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(ring)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!introExiting || !heroRef.current) return

    gsap.fromTo(
      heroRef.current,
      {
        opacity: 0,
        scale: 1.06,
      },
      {
        opacity: 1,
        scale: 1,
        duration: 1.2,
        delay: 0.1,
        ease: 'power2.inOut',
      }
    )
  }, [introExiting])

  return (
    <section
      ref={heroRef}
      className="hero"
      aria-labelledby="hero-title"
      style={{ opacity: introExiting ? 0 : 1 }}
    >
      <div className="hero__container">

        <div className='hero__center-box'>
          <img className="hero__geo-circle"
            src={geometricCircle}
            alt=""
            aria-hidden="true"
          />

          <div ref={ringRef} className="hero__ring">

            {NAV_ITEMS.map(item => (
              <span
                key={item.label}
                className="hero__nav-label"
                style={{
                  color: item.color,
                  transform: navTransform(item.angle, navRadius),
                }}
              >
                {item.label}
              </span>
            ))}

            {SEP_ANGLES.map(angle => (
              <span
                key={angle}
                className="hero__nav-sep"
                style={{
                  transform: sepTransform(angle, navRadius),
                }}
              />
            ))}
          </div>

          <div className="hero__logo-container">

            <img
              src={logoBg}
              alt=""
              aria-hidden="true"
              className="hero__logo-bg"
            />

            <img
              src={logo}
              alt="Amro Gharz"
              className="hero__logo"
            />

          </div>
        </div>

        <div className="hero__bottom-box">
          <p className="hero__subtitle">
            Learn the Art Beyond Mediums
          </p>

          <h1 id="hero-title"
            className="hero__title"
          >
            AMRO GHARZ
          </h1>

          <div className="hero__ornament">

            <img
              src={pinkSpiral}
              alt=""
              aria-hidden="true"
              className="hero__spiral"
            />

            <div className="hero__line-wrap">
              <span className="hero__line" />
              <span className="hero__line hero__line--short" />
            </div>

            <img
              src={blueSpiral}
              alt=""
              aria-hidden="true"
              className="hero__spiral"
            />

          </div>
        </div>

      </div>
    </section>
  )
}