import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ROASTS } from './data.js'

const RoastContext = createContext(null)

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * One piece of state runs the whole site: which point in the roast you are
 * looking at. The roast ladder writes it, and the nav chip, the ledger rules,
 * the catalogue and the subscription box all read it.
 */
export function RoastProvider({ children }) {
  const [roast, setRoastState] = useState('medium')
  const [pinned, setPinned] = useState(false)

  const setRoast = useCallback((id, opts = {}) => {
    setRoastState(id)
    if (!opts.silent) setPinned(true)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.roast = roast
  }, [roast])

  const value = useMemo(
    () => ({
      roast,
      setRoast,
      pinned,
      stage: ROASTS.find((r) => r.id === roast) || ROASTS[2],
    }),
    [roast, setRoast, pinned],
  )

  return <RoastContext.Provider value={value}>{children}</RoastContext.Provider>
}

export function useRoast() {
  const ctx = useContext(RoastContext)
  if (!ctx) throw new Error('useRoast must be used inside RoastProvider')
  return ctx
}
