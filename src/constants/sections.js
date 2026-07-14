// src/constants/sections.js
// ─────────────────────────────────────────────────────────────────
// Single source of truth for which sections exist and what renders
// them. The nav wheel (Hero) and the render host (SectionHost) both
// read from here, so adding a real section later is a one-line change
// and never touches the navigation or transition code.
//
// Keys match the nav tab ids in Hero.jsx (home, portfolio, shop,
// about, subscribe, learn). Only the ids present here are navigable;
// clicking a tab with no registered section is a no-op (see
// transitionTo in TransitionProvider).
// ─────────────────────────────────────────────────────────────────

import Hero  from '../components/Main/sections/Hero/Hero'
import About from '../components/Main/sections/About/About'

export const SECTIONS = {
  home:  { id: 'home',  component: Hero },
  about: { id: 'about', component: About },
}

export const DEFAULT_SECTION = 'home'
