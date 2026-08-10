import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { sampleProfile } from './roast.js'

// Scroll is time. Rather than guess how tall each section will be, every section
// declares where it sits in the reading and the scroll position is interpolated
// between those anchors, so the drop always lands at the end of the shelf.
export const ANCHORS = [
  ['hero', 0.0],
  ['story', 0.14],
  ['beans', 0.46],
  ['brew-guide', 0.72],
  ['reviews', 0.9],
  ['subscribe', 0.945],
  ['contact', 0.97],
  ['site-footer', 1.0],
]

const RoastContext = createContext(null)

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function readProgress() {
  const y = window.scrollY + window.innerHeight * 0.42
  const points = []
  for (const [id, p] of ANCHORS) {
    const el = document.getElementById(id)
    if (el) points.push({ top: el.getBoundingClientRect().top + window.scrollY, p })
  }
  if (points.length < 2) return 0
  if (y <= points[0].top) return 0
  const last = points[points.length - 1]
  if (y >= last.top) return 1
  for (let i = 1; i < points.length; i += 1) {
    if (y <= points[i].top) {
      const a = points[i - 1]
      const b = points[i]
      const k = b.top === a.top ? 0 : (y - a.top) / (b.top - a.top)
      return a.p + (b.p - a.p) * k
    }
  }
  return 1
}

export function RoastProvider({ children }) {
  const reduced = usePrefersReducedMotion()
  const [progress, setProgress] = useState(0)
  const [heroHandoff, setHeroHandoff] = useState(0)
  const [activeSection, setActiveSection] = useState('hero')
  const [selectedBean, setSelectedBean] = useState(null)
  const [cart, setCart] = useState([])

  const target = useRef(0)
  const shown = useRef(0)
  const frame = useRef(0)

  useEffect(() => {
    let alive = true

    const settle = () => {
      const diff = target.current - shown.current
      shown.current = reduced || Math.abs(diff) < 0.0004 ? target.current : shown.current + diff * 0.14
      setProgress(shown.current)
      if (!alive) return
      if (Math.abs(target.current - shown.current) > 0.0002) {
        frame.current = requestAnimationFrame(settle)
      } else {
        frame.current = 0
      }
    }

    const onScroll = () => {
      target.current = readProgress()
      const vh = window.innerHeight
      setHeroHandoff(Math.min(1, Math.max(0, window.scrollY / (vh * 0.72))))
      let current = 'hero'
      for (const [id] of ANCHORS) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= vh * 0.4) current = id
      }
      setActiveSection(current)
      if (!frame.current) frame.current = requestAnimationFrame(settle)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    const t = setTimeout(onScroll, 300)
    return () => {
      alive = false
      clearTimeout(t)
      if (frame.current) cancelAnimationFrame(frame.current)
      frame.current = 0
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [reduced])

  const reading = useMemo(() => sampleProfile(progress), [progress])

  const value = useMemo(
    () => ({
      reading,
      progress,
      heroHandoff,
      activeSection,
      reduced,
      selectedBean,
      setSelectedBean,
      cart,
      addToCart: (bean) => setCart((c) => [...c, bean.id]),
    }),
    [reading, progress, heroHandoff, activeSection, reduced, selectedBean, cart],
  )

  return <RoastContext.Provider value={value}>{children}</RoastContext.Provider>
}

export function useRoast() {
  const ctx = useContext(RoastContext)
  if (!ctx) throw new Error('useRoast must be used inside RoastProvider')
  return ctx
}
