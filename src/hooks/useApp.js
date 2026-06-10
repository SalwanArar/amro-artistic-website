import { useContext } from 'react'
import { AppContext } from '../context/AppContextValue'

// useApp() is the only way any component should access this context.
// It throws a clear error if someone forgets to wrap with AppProvider.
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an <AppProvider>.')
  }
  return context
}
