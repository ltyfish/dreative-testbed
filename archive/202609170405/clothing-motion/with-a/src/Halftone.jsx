import { useEffect, useRef, useState } from 'react'
import { createPress } from './halftone'

// One rAF loop and one scroll listener for the whole page, no matter how many
// plates are on it. Presses register themselves; only the ones intersecting the
// viewport are asked to print.
const live = new Set()
let frame = 0

function tick() {
  frame = 0
  for (const entry of live) entry.run()
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(tick)
}

let listening = false
function listen() {
  if (listening) return
  listening = true
  addEventListener('scroll', schedule, { passive: true })
  addEventListener('resize', schedule, { passive: true })
}

export const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * A photograph printed as halftone. `lead` is how far up the viewport the
 * element must travel before it is fully printed — the "fold".
 */
export default function Halftone({ src, alt, lead = 0.55, className = '', caption = '', onProgress }) {
  const ref = useRef(null)
  const [state, setState] = useState({ pct: 0, cell: null })

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const press = createPress(canvas, src)
    const reduced = prefersReducedMotion()
    let visible = false
    let last = -1
    // A plate already past the fold when the page loads has no scroll travel to
    // print with, so it gets a timed press stroke instead — it still arrives
    // coarse and settles, which is the whole point of the device.
    let strokeStart = 0

    const apply = (p) => {
      if (Math.abs(p - last) < 0.01 && last >= 0) return
      last = p
      const cell = press.print(p)
      if (cell !== undefined) {
        setState({ pct: Math.round(p * 100), cell })
        onProgress?.(p)
      }
    }

    const entry = {
      run() {
        if (!visible && last >= 0) return
        const r = canvas.getBoundingClientRect()
        const vh = innerHeight || 1
        // 0 when the top edge is at the bottom of the viewport,
        // 1 once it has travelled `lead` of the way up.
        // A narrow viewport stacks these, so the same lead would demand far more
        // travel than a phone screen's worth. Shorten it there.
        const reach = vh * lead * (innerWidth < 700 ? 0.5 : 1)
        const scrolled = Math.max(0, Math.min(1, (vh - r.top) / Math.max(1, reach)))
        if (reduced) return apply(1)
        if (!strokeStart) return apply(scrolled)
        const t = Math.min(1, (performance.now() - strokeStart) / 1100)
        apply(Math.max(scrolled * t, t * t)) // ease-in press stroke
        if (t < 1) schedule()
        else strokeStart = 0
      },
    }

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting
        if (visible) {
          live.add(entry)
          schedule()
        } else {
          live.delete(entry)
        }
      },
      { rootMargin: '150px 0px' },
    )

    press.ready.then(() => {
      const r = canvas.getBoundingClientRect()
      // Only a plate genuinely on screen at first paint gets the timed stroke.
      // (Testing against `lead` was wrong: any lead above 1 matched everything.)
      if (!reduced && r.top < (innerHeight || 1) && r.bottom > 0) strokeStart = performance.now()
      io.observe(canvas)
      listen()
      entry.run()
    })

    return () => {
      io.disconnect()
      live.delete(entry)
      press.dispose()
    }
  }, [src, lead, onProgress])

  const canvas = (
    <canvas
      ref={ref}
      className={'halftone ' + className}
      role="img"
      aria-label={alt}
      data-pct={state.pct}
      data-cell={state.cell ?? ''}
    />
  )

  if (!caption) return canvas

  return (
    <figure>
      {canvas}
      <figcaption>
        <span className="m">{caption}</span>
        <span className="m r">
          {state.cell ? `${state.cell}pt dot · ${state.pct}% inked` : 'inking'}
        </span>
      </figcaption>
    </figure>
  )
}
