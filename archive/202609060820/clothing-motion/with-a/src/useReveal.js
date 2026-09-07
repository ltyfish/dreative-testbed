import { useEffect } from 'react'

// The interaction baseline's entrance half. One observer for the whole route.
// Thresholds are measured so a reveal always finishes while its region is still
// on screen, and anything React mounts later — a filtered card that was never
// scrolled past — gets picked up rather than staying invisible.
export function useReveal(reduced) {
  useEffect(() => {
    const show = (n) => n.classList.add('is-in')
    if (reduced) {
      document.querySelectorAll('[data-reveal]').forEach(show)
      const mo = new MutationObserver(() =>
        document.querySelectorAll('[data-reveal]:not(.is-in)').forEach(show),
      )
      mo.observe(document.body, { childList: true, subtree: true })
      return () => mo.disconnect()
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            show(e.target)
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.01 },
    )
    const scan = () => document.querySelectorAll('[data-reveal]:not(.is-in)').forEach((n) => io.observe(n))
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [reduced])
}
