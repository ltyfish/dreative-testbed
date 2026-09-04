import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createFabricSurface, hexToRgb, loadMaps } from './fabric.js'

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

export function useFabricMaps() {
  const [maps, setMaps] = useState(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let live = true
    loadMaps().then(
      (m) => live && setMaps(m),
      () => live && setFailed(true),
    )
    return () => {
      live = false
    }
  }, [])
  return { maps, failed }
}

// One WebGL context for the whole route.
//
// Every appearance of the cloth on this page — masthead, six dye lots, the
// opacity test, three magnifications, the ground under the bag — is this one
// surface rendered at different parameters and blitted into an ordinary 2D
// canvas. Eleven views of one cloth, one context, one set of textures.
let shared = null
let sharedFailed = false

function renderer(maps) {
  if (shared || sharedFailed) return shared
  const c = document.createElement('canvas')
  shared = createFabricSurface(c, maps)
  if (!shared) sharedFailed = true
  return shared
}

function paintInto(target, maps, p) {
  const surf = renderer(maps)
  if (!surf || !target) return false
  const rect = target.getBoundingClientRect()
  const w = Math.max(1, Math.round(rect.width))
  const h = Math.max(1, Math.round(rect.height))
  if (w < 2 || h < 2) return false
  const dpr = Math.min(window.devicePixelRatio || 1, p.dpr || 1.5)
  surf.resize(w, h, dpr)
  surf.draw({
    dye: hexToRgb(p.dye),
    scale: p.scale,
    stretch: p.stretch || 0,
    back: p.back || 0,
    light: p.light || [0.32, 0.7],
    grain: p.grain,
  })
  const gw = surf.canvas.width
  const gh = surf.canvas.height
  if (target.width !== gw || target.height !== gh) {
    target.width = gw
    target.height = gh
  }
  const ctx = target.getContext('2d')
  ctx.drawImage(surf.canvas, 0, 0)
  return true
}

// One frame loop for the whole page, joined only by panels that are both
// animating and on screen.
const movers = new Set()
let loop = 0

function ensureLoop() {
  if (loop) return
  const tick = () => {
    if (!movers.size) {
      loop = 0
      return
    }
    loop = requestAnimationFrame(tick)
    movers.forEach((fn) => fn())
  }
  loop = requestAnimationFrame(tick)
}

function useFabricCanvas(maps, params, { live = false } = {}) {
  const ref = useRef(null)
  const paramsRef = useRef(params)
  const visible = useRef(true)
  paramsRef.current = params

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !maps) return
    const paint = () => paintInto(el, maps, paramsRef.current)
    el.__paint = paint
    const ro = new ResizeObserver(paint)
    ro.observe(el)
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting
      if (e.isIntersecting) paint()
    })
    io.observe(el)
    paint()
    return () => {
      ro.disconnect()
      io.disconnect()
      el.__paint = null
    }
  }, [maps])

  // Repaint whenever a parameter changes. One triangle; cheaper than a reflow.
  useEffect(() => {
    const el = ref.current
    if (el && el.__paint) el.__paint()
  })

  // The idle drift of the key light across the masthead cloth.
  useEffect(() => {
    if (!live || !maps) return
    const start = performance.now()
    const fn = () => {
      const el = ref.current
      if (!el || !el.__paint || !visible.current) return
      const e = (performance.now() - start) / 1000
      paramsRef.current = {
        ...paramsRef.current,
        light: [0.34 + Math.sin(e * 0.19) * 0.27, 0.6 + Math.cos(e * 0.15) * 0.22],
      }
      el.__paint()
    }
    movers.add(fn)
    ensureLoop()
    return () => {
      movers.delete(fn)
    }
  }, [live, maps])

  return ref
}

export function FabricPanel({ maps, dye, scale, stretch = 0, back = 0, light, live = false, grain, dpr, className, style }) {
  const ref = useFabricCanvas(maps, { dye, scale, stretch, back, light, grain, dpr }, { live })
  return <canvas ref={ref} className={className} style={style} aria-hidden="true" />
}

export function FabricTile({ maps, dye, scale, light = [0.34, 0.7], stretch = 0, grain = 0.03, className, style }) {
  const ref = useFabricCanvas(maps, { dye, scale, stretch, light, grain, dpr: 1.4 })
  return <canvas ref={ref} className={className} style={style} aria-hidden="true" />
}
