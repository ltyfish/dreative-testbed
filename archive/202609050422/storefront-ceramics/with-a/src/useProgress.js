import { useEffect, useRef } from 'react'

// One authored progress value for the whole route's scroll work.
//
// A single RAF, scheduled only by scroll and resize, publishing 0..1 for the
// element it is attached to. Everything scroll-linked on this page reads this
// one number, so nothing can drift out of step with anything else. Raw scroll
// position, deliberately: the route has exactly one scrubbed passage and taking
// ownership of native scrolling to smooth it would put anchors, keyboard paging
// and focus at risk for no gain the reader would notice.
export function useProgress(onProgress) {
  const ref = useRef(null)
  const cb = useRef(onProgress)
  cb.current = onProgress

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let frame = 0
    let last = -1

    const measure = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      const travel = rect.height - window.innerHeight
      if (travel <= 0) {
        // Section shorter than the viewport: report by its own centre instead,
        // so a short/mobile layout still resolves rather than sticking at 0.
        const centre = (window.innerHeight / 2 - rect.top) / rect.height
        const p = Math.min(1, Math.max(0, centre))
        if (p !== last) { last = p; cb.current(p) }
        return
      }
      const p = Math.min(1, Math.max(0, -rect.top / travel))
      if (p !== last) { last = p; cb.current(p) }
    }

    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure) }

    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return ref
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
