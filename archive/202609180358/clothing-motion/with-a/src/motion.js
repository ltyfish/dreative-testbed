import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/* One scroll-progress source for the whole page.
   Everything that moves subscribes to this single rAF loop and owns exactly one
   property. Native scrolling is untouched: nothing here hijacks or smooths it. */

const subscribers = new Set()
let frame = 0

function tick() {
  frame = 0
  for (const fn of subscribers) fn()
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(tick)
}

function subscribe(fn) {
  subscribers.add(fn)
  if (subscribers.size === 1) {
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
  }
  schedule()
  return () => {
    subscribers.delete(fn)
    if (subscribers.size === 0) {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }
}

function mediaQuery(query, initial) {
  const [on, setOn] = useState(() =>
    typeof window === 'undefined' ? initial : window.matchMedia(query).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const handle = () => setOn(mq.matches)
    handle()
    mq.addEventListener('change', handle)
    return () => mq.removeEventListener('change', handle)
  }, [query])
  return on
}

export const useReducedMotion = () => mediaQuery('(prefers-reduced-motion: reduce)', false)
export const useCoarsePointer = () => mediaQuery('(pointer: coarse)', false)
export const useNarrow = () => mediaQuery('(max-width: 900px)', false)

/* Progress of an element through the viewport, 0 when its top edge reaches the
   bottom of the screen and 1 when its bottom edge reaches the top. `onProgress`
   is called on the shared frame; it must not set React state. */
export function useScrollDriver(ref, onProgress, enabled = true) {
  const cb = useRef(onProgress)
  cb.current = onProgress
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!enabled) {
      // Reduced motion: leave the element exactly where the stylesheet puts it.
      // Clear anything a previous enabled pass wrote so nothing is left mid-travel.
      for (const node of el.querySelectorAll('[style*="translate3d"]')) node.style.transform = ''
      el.style.transform = ''
      return
    }
    let visible = false
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting
        schedule()
      },
      { rootMargin: '120px 0px' },
    )
    io.observe(el)
    const read = () => {
      if (!visible) return
      const r = el.getBoundingClientRect()
      const span = r.height + window.innerHeight
      const p = span <= 0 ? 0 : (window.innerHeight - r.top) / span
      cb.current(Math.min(1, Math.max(0, p)), el)
    }
    const off = subscribe(read)
    return () => {
      io.disconnect()
      off()
    }
  }, [ref, enabled])
}

/* Marks an element the first time it enters view, so entry animations can run
   once and then stop costing anything. */
export function useRevealed(ref, rootMargin = '-12% 0px') {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, seen, rootMargin])
  return seen
}

/* FLIP: when `key` changes, cards that survive the change travel from where they
   were to where they now are, instead of the grid blinking into a new shape. */
export function useFlip(containerRef, key, enabled) {
  const positions = useRef(new Map())
  useLayoutEffect(() => {
    const root = containerRef.current
    if (!root) return
    const items = Array.from(root.querySelectorAll('[data-flip]'))
    if (!enabled) {
      positions.current = new Map(items.map((el) => [el.dataset.flip, el.getBoundingClientRect()]))
      return
    }
    for (const el of items) {
      const id = el.dataset.flip
      const before = positions.current.get(id)
      const after = el.getBoundingClientRect()
      if (before) {
        const dx = before.left - after.left
        const dy = before.top - after.top
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          el.animate(
            [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0,0)' }],
            { duration: 460, easing: 'cubic-bezier(.22,.61,.24,1)' },
          )
        }
      } else {
        el.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], {
          duration: 380,
          easing: 'cubic-bezier(.22,.61,.24,1)',
        })
      }
    }
    positions.current = new Map(items.map((el) => [el.dataset.flip, el.getBoundingClientRect()]))
  }, [containerRef, key, enabled])
}
