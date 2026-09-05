import { useEffect, useRef, useState } from 'react'

/** True when the visitor has asked for reduced motion. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

/** Matches a media query, kept in sync on resize. */
export function useMedia(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false,
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatches(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return matches
}

/**
 * Regional entrance. Fires against the top of the viewport rather than the
 * bottom, so a reveal always resolves while its region is still on screen —
 * including for sections taller than one screen, which observe a sentinel
 * pinned to their own top edge.
 */
export function useReveal(options) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true)
            io.disconnect()
          }
        }
      },
      { rootMargin: options?.rootMargin ?? '-5% 0px -18% 0px', threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [options?.rootMargin])
  return [ref, shown]
}

/**
 * One authored progress value, 0..1, for how far a tall region has travelled
 * past a pinned viewport. Every element in the power path reads this same
 * number, so nothing can drift out of step with anything else.
 */
export function useScrollProgress(ref, enabled = true) {
  const [p, setP] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    let frame = 0
    const measure = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      const travel = rect.height - window.innerHeight
      if (travel <= 0) {
        setP(rect.top <= 0 ? 1 : 0)
        return
      }
      const raw = -rect.top / travel
      setP(raw < 0 ? 0 : raw > 1 ? 1 : raw)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ref, enabled])
  return p
}

/**
 * The escapement's tempo: five releases a second. Runs only while its section
 * is on screen and the visitor has not asked for less motion.
 */
export function useBeat(active) {
  const [beat, setBeat] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setBeat((b) => b + 1), 200)
    return () => window.clearInterval(id)
  }, [active])
  return beat
}
