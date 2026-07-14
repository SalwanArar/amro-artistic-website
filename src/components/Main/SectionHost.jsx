// src/components/Main/SectionHost.jsx
// ─────────────────────────────────────────────────────────────────
// Renders the live section layer(s) and registers each layer's DOM
// node with the transition manager so the master timeline can animate
// them.
//
// Normally only the active section is mounted. During a transition the
// incoming section is mounted alongside it so the two can crossfade.
// Every layer is keyed by section id: when the transition commits
// (active := pending), the incoming layer's node is preserved by React
// (same key) and simply becomes the active layer — zero remount, zero
// flicker.
// ─────────────────────────────────────────────────────────────────

import { useTransition } from '../../hooks/useTransition'
import { SECTIONS } from '../../constants/sections'
import './SectionHost.css'

export default function SectionHost() {
  const { activeSection, pendingSection, registerLayer } = useTransition()

  const ids = pendingSection
    ? [activeSection, pendingSection]
    : [activeSection]

  return (
    <>
      {ids.map(id => {
        const Section = SECTIONS[id].component
        return (
          <div
            key={id}
            className="section-layer"
            ref={el => registerLayer(id, el)}
          >
            <Section />
          </div>
        )
      })}
    </>
  )
}
