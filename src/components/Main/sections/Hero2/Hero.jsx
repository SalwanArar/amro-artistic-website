import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap/gsap-core'
import { useApp } from '../../../../hooks/useApp'
import './Hero.css'

import logo from '../../../../assets/images/Logo.png'
import logoBg from './assets/images/Logo bg.png'
import geoCircle from './assets/svg/Geometric Circle.svg'
import pinkSpiral from './assets/svg/Pink Spiral.svg'
import blueSpiral from './assets/svg/Blue Spiral.svg'

// SVG coordinate space
const CX = 260, CY = 260
const R_OUTER = 260
const R_INNER = 180
const R_LABEL = (R_OUTER + R_INNER) / 2  // midpoint for text arc
const GAP_DEG = 10      // gap between segments
const TEXT_PAD_DEG = 10   // inset text arc from segment edges
const STEP = 60          // 360 / 6 tabs
const SEP_ANGLES = [30, 90, 150, 210, 270, 330]

const TABS = [
  { id: 'home',      label: 'HOME',      color: '#F5821F', angle: 0   },
  { id: 'portfolio', label: 'PORTFOLIO', color: '#5EB2E4', angle: 60  },
  { id: 'shop',      label: 'SHOP',      color: '#725AA6', angle: 120 },
  { id: 'about',     label: 'ABOUT',     color: '#F5821F', angle: 180 },
  { id: 'subscribe', label: 'SUBSCRIBE', color: '#5EB2E4', angle: 240 },
  { id: 'learn',     label: 'LEARN',     color: '#ED4A94', angle: 300 },
]

function pt(r, deg) {
  const rad = (deg - 90) * Math.PI / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function segPath(rOuter, rInner, start, end) {
  const large = (end - start) > 180 ? 1 : 0
  const p1 = pt(rOuter, start), p2 = pt(rOuter, end)
  const p3 = pt(rInner, end),   p4 = pt(rInner, start)
  return `M${p1.x.toFixed(2)} ${p1.y.toFixed(2)} `
       + `A${rOuter} ${rOuter} 0 ${large} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `
       + `L${p3.x.toFixed(2)} ${p3.y.toFixed(2)} `
       + `A${rInner} ${rInner} 0 ${large} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}Z`
}

// Bottom-half labels trace the arc in reverse so text doesn't render upside-down
function arcPath(r, start, end, flip) {
  if (!flip) {
    const p1 = pt(r, start), p2 = pt(r, end)
    return `M${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A${r} ${r} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  const p1 = pt(r, end), p2 = pt(r, start)
  return `M${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A${r} ${r} 0 0 0 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
}

export default function Hero() {
  const { introExiting } = useApp()
  const heroRef = useRef(null)
  const [activeTab, setActiveTab] = useState(null)
  const [hoverTab, setHoverTab] = useState(null)

  useEffect(() => {
    if (!introExiting || !heroRef.current) return
    gsap.fromTo(
      heroRef.current,
      { opacity: 0, scale: 1.06 },
      { opacity: 1, scale: 1, duration: 1.2, delay: 0.1, ease: 'power2.inOut' }
    )
  }, [introExiting])

  function toggle(id) {
    setActiveTab(prev => prev === id ? null : id)
  }

  return (
    <section
      ref={heroRef}
      className="hero"
      aria-labelledby="hero-title"
      style={{ opacity: introExiting ? 0 : 1 }}
    >
      <div className="hero__container">

        <div className="hero__center-box">

          <img className="hero__geo" src={geoCircle} alt="" aria-hidden="true" />
          
          <svg
            className="hero__nav-svg"
            viewBox="0 0 520 520"
            role="tablist"
            aria-label="Primary navigation"
          >
            <defs>
              {TABS.map(tab => {
                const s  = tab.angle - STEP / 2 + GAP_DEG / 2
                const e  = tab.angle + STEP / 2 - GAP_DEG / 2
                const ts = s + TEXT_PAD_DEG
                const te = e - TEXT_PAD_DEG
                const flip = Math.sin((tab.angle - 90) * Math.PI / 180) > 0
                return (
                  <path
                    key={tab.id}
                    id={`arc-${tab.id}`}
                    d={arcPath(R_LABEL, ts, te, flip)}
                    fill="none"
                  />
                )
              })}
            </defs>

            {TABS.map(tab => {
              const s = tab.angle - STEP / 2 + GAP_DEG / 2
              const e = tab.angle + STEP / 2 - GAP_DEG / 2
              const isActive = activeTab === tab.id
              const isHover  = hoverTab  === tab.id

              const segFill  = isActive ? tab.color
                             : isHover  ? tab.color + '44'
                             : '#00000000'
              const textFill = (isActive || isHover) ? '#ffffff' : tab.color

              return (
                <g
                  key={tab.id}
                  role="tab"
                  tabIndex={0}
                  aria-selected={isActive}
                  aria-label={tab.label}
                  className="hero__nav-tab"
                  onClick={() => toggle(tab.id)}
                  onMouseEnter={() => setHoverTab(tab.id)}
                  onMouseLeave={() => setHoverTab(null)}
                  onKeyDown={ev => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault()
                      toggle(tab.id)
                    }
                  }}
                >
                  <path
                    d={segPath(R_OUTER, R_INNER, s, e)}
                    fill={segFill}
                    stroke="none"
                    style={{ transition: 'fill 0.25s ease' }}
                  />
                  <text
                    fontSize="20"
                    fontWeight="600"
                    fill={textFill}
                    style={{ transition: 'fill 0.25s ease' }}
                  >
                    <textPath
                      href={`#arc-${tab.id}`}
                      startOffset="50%"
                      textAnchor="middle"
                    >
                      {tab.label}
                    </textPath>
                  </text>
                </g>
              )
            })}
            
            {SEP_ANGLES.map(angle => {
              const { x, y } = pt(R_LABEL, angle)
              return (
                <circle
                  key={angle}
                  cx={x.toFixed(2)}
                  cy={y.toFixed(2)}
                  r="9"
                  fill="none"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1.5"
                  style={{ pointerEvents: 'none' }}
                />
              )
            })}
          </svg>

          <div className="hero__logo-border">
            <img className="hero__logo" src={logo} alt="Amro Gharz" />
          </div>

          <div className="hero__bottom-box">
            <p className="hero__subtitle">Learn the Art Beyond Mediums</p>
            <h1 id="hero-title" className="hero__title">AMRO GHARZ</h1>
            <div className="hero__ornament">
              <img src={pinkSpiral} alt="" aria-hidden="true" className="hero__spiral" />
              <div className="hero__line-wrap">
                <span className="hero__line" />
                <span className="hero__line hero__line--short" />
              </div>
              <img src={blueSpiral} alt="" aria-hidden="true" className="hero__spiral" />
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
