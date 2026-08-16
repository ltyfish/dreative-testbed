import { useEffect, useRef, useState } from 'react'

/**
 * Regional entrance. One rule for the whole route: triggered against the top of
 * the viewport so a reveal always finishes while the reader is still looking at
 * it, once only, and never for content that was already on screen at load.
 */
export function useReveal() {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }

    // Already visible on load: show immediately, do not animate.
    if (node.getBoundingClientRect().top < window.innerHeight * 0.92) {
      node.dataset.instant = 'true'
      setShown(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -15% 0px', threshold: 0 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [ref, shown]
}

/** Re-render on a cadence so the walk-in clock stays truthful. */
export function useTick(intervalMs = 30000) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
}

/** True once the given element has scrolled fully out of the top of the view. */
export function usePassed(ref) {
  const [passed, setPassed] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setPassed(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])
  return passed
}
