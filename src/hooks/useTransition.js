import { useContext } from 'react'
import { TransitionContext } from '../transitions/TransitionContextValue'

// useTransition() is the only way any component should reach the
// transition manager. Nav just calls transitionTo(); everything else
// (lock, GSAP timeline, section swap, unlock) is handled internally.
export function useTransition() {
  const context = useContext(TransitionContext)
  if (!context) {
    throw new Error('useTransition must be used within a <TransitionProvider>.')
  }
  return context
}
