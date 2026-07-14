import { createContext } from 'react'

// Consumed only through useTransition() (src/hooks/useTransition.js).
export const TransitionContext = createContext(null)
