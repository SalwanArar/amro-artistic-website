// src/constants/heroTransition.js
// ─────────────────────────────────────────────────────────────────
// Shared tuning values for the Intro → Hero logo shared-element
// ("Flutter Hero"-style) flight. Read by both Intro.jsx (which drives
// the flight) and Hero.jsx (which times its own chrome reveal to land
// alongside it) so the two never drift out of sync.
//
// LOGO geometry is measured directly from the pixel content of the
// final intro frame (src/assets/frames/frame_00189.png, 640x360) —
// there is no authored config for this, it's baked into the artwork.
// The frame's opaque ("ink") bounding box is a 112x112 square centered
// at (319.5, 185.5), i.e. dead-center horizontally and ~1.5% of the
// frame height below center vertically.
// ─────────────────────────────────────────────────────────────────

export const LAST_FRAME_WIDTH  = 640
export const LAST_FRAME_HEIGHT = 360
export const LOGO_CENTER_X     = 319.5
export const LOGO_CENTER_Y     = 185.5
export const LOGO_DIAMETER     = 112

export const FLIGHT_DURATION = 1.3
export const FLIGHT_EASE     = 'power3.inOut'
