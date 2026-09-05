import { useEffect, useRef } from 'react'

// The interaction baseline's entrance half: a region settles in as it arrives.
// Triggered against the top of the viewport, not the bottom, so the movement
// has finished by the time the reader is actually looking at it.
export function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.setAttribute('data-shown', 'true')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.setAttribute('data-shown', 'true')
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -14% 0px', threshold: 0.01 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

export const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
