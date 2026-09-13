import { useEffect, useRef } from 'react'
import { createLoom } from './loom.js'

// The shop grid speaks the same language as the hero. A card's picture arrives on the
// loom — coarse threads first — and closes up into the garment where it sits. Same
// renderer, same measured-rectangle rule; only the driver differs, because a filter
// change has no scroll to hang off. Once a card has resolved it stays resolved, and
// the canvas hands the picture back to the real <img>.

const DUR = 820
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const mix = (a, b, t) => a + (b - a) * t

export default function WeaveGrid() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const resolveAll = () => {
      document.querySelectorAll('[data-weave]').forEach((el) => { el.dataset.resolved = '1' })
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      resolveAll()
      const mo = new MutationObserver(resolveAll)
      mo.observe(document.body, { childList: true, subtree: true })
      return () => mo.disconnect()
    }

    const loom = createLoom(canvas)
    if (!loom) { resolveAll(); return }

    const loaded = new Map()      // key -> 'loading' | 'ready'
    const active = new Map()      // element -> { key, start }
    let raf = 0, alive = true, queued = 0
    let W = 0, H = 0

    const measure = () => {
      W = window.innerWidth; H = window.innerHeight
      loom.resize(W, H, Math.min(window.devicePixelRatio || 1, 2))
    }
    measure()

    // grid pictures are shown small, so upload them small: nine full-size textures
    // would cost far more memory than the grid can ever show
    const upload = (key, src) => {
      if (loaded.has(key)) return
      loaded.set(key, 'loading')
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        const c = document.createElement('canvas')
        c.width = 600; c.height = 800
        const cx = c.getContext('2d')
        cx.drawImage(img, 0, 0, c.width, c.height)
        loom.loadTexture(key, c)
        loaded.set(key, 'ready')
        if (!raf && active.size) raf = requestAnimationFrame(tick)
      }
      img.onerror = () => loaded.delete(key)
      img.src = src
    }

    const begin = (el) => {
      if (el.dataset.resolved || active.has(el)) return
      const key = el.dataset.weave
      upload(key, el.dataset.src)
      // a short stagger so a row of cards reads as a sequence, not a flash
      active.set(el, { key, start: performance.now() + (queued++ % 4) * 70 })
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const tick = (now) => {
      raf = 0
      if (!alive) return
      const quads = []
      for (const [el, state] of active) {
        const t = Math.max(0, Math.min(1, (now - state.start) / DUR))
        const r = el.getBoundingClientRect()
        if (loaded.get(state.key) !== 'ready') continue
        if (r.bottom < -200 || r.top > H + 200) {           // scrolled away mid-weave
          el.dataset.resolved = '1'; active.delete(el); continue
        }
        const e = easeInOut(t)
        quads.push({
          key: state.key,
          rect: [r.left, r.top, r.width, r.height],
          focal: [0.5, 0.5],
          zoom: 1,
          cell: mix(16, 1, e),
          amp: 1 - e,
          alpha: Math.min(1, t / 0.12),
          grain: 0.5,
        })
        if (t >= 1) { el.dataset.resolved = '1'; active.delete(el) }
      }
      loom.render(quads)
      if (active.size) raf = requestAnimationFrame(tick)
      else loom.render([])
    }

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { begin(e.target); io.unobserve(e.target) }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.15 })

    const seen = new WeakSet()
    const scan = () => {
      document.querySelectorAll('[data-weave]:not([data-resolved])').forEach((el) => {
        if (!seen.has(el)) { seen.add(el); io.observe(el) }
      })
    }
    scan()
    const mo = new MutationObserver(() => { queued = 0; scan() })
    mo.observe(document.body, { childList: true, subtree: true })

    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    const onScroll = () => { if (active.size && !raf) raf = requestAnimationFrame(tick) }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      io.disconnect(); mo.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
      loom.dispose()
    }
  }, [])

  return <canvas className="weavegrid" ref={canvasRef} aria-hidden="true" />
}
