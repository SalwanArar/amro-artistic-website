// src/hooks/usePreloader.js
// ─────────────────────────────────────────────────────────────────
// Kicks off asset loading on mount and pipes progress into AppContext.
// Import this hook ONCE — at the top level of the app (App.jsx or
// inside AppProvider's immediate child).
// ─────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import { useApp }           from './useApp'
import { loadAllAssets }    from '../utils/assetLoader'

export function usePreloader() {
  const { onProgress } = useApp()
  const started        = useRef(false)   // guard against StrictMode double-mount

  useEffect(() => {
    if (started.current) return
    started.current = true

    loadAllAssets(onProgress).catch(err => {
      console.error('[usePreloader] Asset loading failed:', err)
      // Still mark as loaded so the user isn't stuck at 0 %
      onProgress(100, 'Error — some assets may be missing')
    })
  }, [onProgress])
}
