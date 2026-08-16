import { useEffect, useRef, useState } from 'react'

/**
 * Regional entrance. Only observes elements that start below the fold, so
 * content already on screen at load never animates in.
 */
export function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'))
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      nodes.forEach((n) => n.setAttribute('data-reveal', 'in'))
      return
    }

    const pending = []
    nodes.forEach((n) => {
      if (n.getBoundingClientRect().top < window.innerHeight * 0.9) {
        n.setAttribute('data-reveal', 'in')
      } else {
        pending.push(n)
      }
    })

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.setAttribute('data-reveal', 'in')
          io.unobserve(e.target)
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0 },
    )
    pending.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])
}

/** Which section the reader is in. Drives the numbered rail marker. */
export function useScrollSpy(ids) {
  const [active, setActive] = useState(ids[0])

  useEffect(() => {
    function onScroll() {
      const line = window.innerHeight * 0.3
      let current = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) current = id
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ids])

  return active
}

/** Keeps the mobile rail's active chip in view as the reader scrolls. */
export function useRailFollow(active) {
  const ref = useRef(null)
  useEffect(() => {
    const rail = ref.current
    if (!rail) return
    const chip = rail.querySelector(`[data-rail="${active}"]`)
    if (!chip || rail.scrollWidth <= rail.clientWidth) return
    const target = chip.offsetLeft - rail.clientWidth / 2 + chip.offsetWidth / 2
    rail.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
  }, [active])
  return ref
}
