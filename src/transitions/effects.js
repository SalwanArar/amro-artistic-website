// src/transitions/effects.js
// ─────────────────────────────────────────────────────────────────
// Registry of cinematic transition EFFECTS.
//
// An effect is a pure "timeline builder": it receives the shared GSAP
// timeline plus the handles it may animate, and adds its tweens to
// that timeline. It never creates its own timeline, never uses
// setTimeout, and never controls the video's own playback length —
// the timeline is the single source of truth for timing, and the
// video is just one element placed on it.
//
// Handles passed to every effect:
//   tl        — the master GSAP timeline (add tweens/callbacks to this)
//   overlayEl — the fullscreen overlay DOM node (fade this in/out)
//   playVideo — () => void, resets the splash video to frame 0 and plays it
//   outgoing  — DOM node of the section leaving  (may be null)
//   incoming  — DOM node of the section entering
//
// To add a future effect (smoke, ink, fire, distortion) just register
// another builder here with the same signature — the navigation API
// (transitionTo) never changes.
// ─────────────────────────────────────────────────────────────────

// Transparent WebM splash playing center-screen while the sections
// crossfade beneath it. Total ~1.9s.
const splash = ({ tl, overlayEl, playVideo, outgoing, incoming }) => {
  // t=0 — the splash begins from its first frame as the overlay reveals.
  tl.add(playVideo, 0)
    .to(overlayEl, { autoAlpha: 1, duration: 0.35, ease: 'power2.out' }, 0)

  // Under the splash, at its strongest, the sections crossfade.
  if (outgoing) {
    tl.to(outgoing, { autoAlpha: 0, duration: 0.7, ease: 'power2.inOut' }, 0.35)
  }
  tl.fromTo(
    incoming,
    { autoAlpha: 0 },
    { autoAlpha: 1, duration: 0.7, ease: 'power2.inOut' },
    0.55,
  )

  // The splash resolves and the overlay clears — timeline onComplete
  // (in TransitionProvider) commits the swap and unlocks navigation.
  tl.to(overlayEl, { autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 1.4)
}

export const EFFECTS = {
  splash,
  // smoke: ({ tl, ... }) => { ... },   ← future effects drop in here
  // ink:   ({ tl, ... }) => { ... },
}

export const DEFAULT_EFFECT = 'splash'
