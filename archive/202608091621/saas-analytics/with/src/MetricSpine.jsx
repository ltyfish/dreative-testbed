import { useEffect, useRef } from 'react'

/*
 * The Line.
 *
 * One metric series plotted down the whole document: time runs on Y (with the
 * page), value runs on X. It is the same series everywhere — what changes is how
 * governed it is. Raw at the hero, banded once the metric layer is introduced,
 * quantised through the feature ledger, breaching its band at the alert act, and
 * flat on its governed baseline by the time you are asked for an email.
 *
 * This is the site's continuity device and its only canvas.
 */

// Regime parameters, keyed to real section ids. Values are interpolated between
// the vertical centres of consecutive sections, so the series transforms while
// you travel between them rather than snapping at a boundary.
const REGIMES = {
  hero: { wave: 1, noise: 1, quant: 0, band: 0, x: 0.085, spread: 46, weight: 1.25 },
  customers: { wave: 0.9, noise: 0.8, quant: 0, band: 0, x: 0.085, spread: 40, weight: 1.25 },
  metrics: { wave: 0.75, noise: 0.42, quant: 0, band: 1.3, x: 0.085, spread: 34, weight: 1.6 },
  features: { wave: 0.6, noise: 0.16, quant: 1, band: 1.15, x: 0.085, spread: 30, weight: 1.8 },
  alert: { wave: 0.5, noise: 0.3, quant: 0.35, band: 1.3, x: 0.42, spread: 52, weight: 2.6 },
  pricing: { wave: 0.32, noise: 0.06, quant: 0.8, band: 0.9, x: 0.085, spread: 22, weight: 1.8 },
  faq: { wave: 0.18, noise: 0.04, quant: 0.9, band: 0.55, x: 0.085, spread: 14, weight: 1.6 },
  signup: { wave: 0.04, noise: 0.01, quant: 0, band: 0.3, x: 0.085, spread: 6, weight: 2.2 },
  'site-footer': { wave: 0, noise: 0, quant: 0, band: 0.25, x: 0.085, spread: 2, weight: 2.2 },
}

const ORDER = ['hero', 'customers', 'metrics', 'features', 'alert', 'pricing', 'faq', 'signup', 'site-footer']

// Axis ticks. The spine is the page's time axis, so it is labelled like one.
const TICKS = {
  hero: 'raw series',
  metrics: 'measured',
  features: 'governed',
  alert: 'breach',
  pricing: 'plans',
  signup: 'baseline',
}

const PAPER = { line: [46, 62, 72], band: [176, 168, 152], breach: [199, 74, 22], tick: [150, 141, 124] }
const INK = { line: [150, 176, 186], band: [70, 78, 88], breach: [255, 106, 43], tick: [96, 104, 116] }

function lerp(a, b, t) {
  return a + (b - a) * t
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

// Deterministic value noise so the series is stable across frames and reloads —
// it is meant to read as one recorded metric, not as static.
function hash(n) {
  const s = Math.sin(n * 127.1) * 43758.5453
  return s - Math.floor(s)
}

function valueNoise(y) {
  const i = Math.floor(y)
  const f = easeInOut(y - i)
  return lerp(hash(i), hash(i + 1), f) * 2 - 1
}

function rgba(c, a) {
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`
}

function mix(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
}

export default function MetricSpine({ reducedMotion }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let stops = []
    let docHeight = 1
    let width = 0
    let height = 0
    let dpr = 1
    let frame = 0
    let inkMix = 0

    function measure() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      docHeight = Math.max(document.documentElement.scrollHeight, 1)
      stops = ORDER.map((id) => {
        const el = document.getElementById(id)
        if (!el) return null
        const rect = el.getBoundingClientRect()
        const top = rect.top + window.scrollY
        return { id, top, centre: top + rect.height / 2, bottom: top + rect.height, params: REGIMES[id] }
      }).filter(Boolean)
    }

    // Interpolate the regime for an absolute document y.
    function paramsAt(y) {
      if (!stops.length) return REGIMES.hero
      if (y <= stops[0].centre) return stops[0].params
      for (let i = 0; i < stops.length - 1; i++) {
        const a = stops[i]
        const b = stops[i + 1]
        if (y <= b.centre) {
          const t = easeInOut((y - a.centre) / Math.max(b.centre - a.centre, 1))
          const out = {}
          for (const k of Object.keys(a.params)) out[k] = lerp(a.params[k], b.params[k], t)
          return out
        }
      }
      return stops[stops.length - 1].params
    }

    function alertStop() {
      return stops.find((s) => s.id === 'alert')
    }

    // The series value in normalised units. > 1 means outside the governed band.
    function valueAt(y) {
      const p = paramsAt(y)
      const wave = Math.sin(y * 0.0071) * 0.55 + Math.sin(y * 0.0023 + 1.7) * 0.45
      let v = wave * p.wave + valueNoise(y * 0.05) * p.noise * 0.8

      if (p.quant > 0.01) {
        const steps = 5
        const q = Math.round(v * steps) / steps
        v = lerp(v, q, p.quant)
      }

      // The breach: a single excursion centred on the alert act. This is the one
      // moment in the whole page where the series leaves its band, so it is the
      // only thing that colours vermilion.
      let breach = 0
      const a = alertStop()
      if (a) {
        const w = Math.max(a.bottom - a.top, 1) * 0.24
        const d = (y - (a.centre + w * 0.15)) / w
        breach = Math.exp(-d * d)
        v += breach * 2.55
      }
      return { v, p, breach }
    }

    function draw() {
      const scrollY = window.scrollY
      ctx.clearRect(0, 0, width, height)
      if (!stops.length) return

      const compact = width < 720
      const pal = { line: mix(PAPER.line, INK.line, inkMix), band: mix(PAPER.band, INK.band, inkMix), breach: mix(PAPER.breach, INK.breach, inkMix), tick: mix(PAPER.tick, INK.tick, inkMix) }

      const step = 5
      const top = scrollY - step * 2
      const bottom = scrollY + height + step * 2

      // Gather the sampled series once, then draw band, line and markers from it.
      const pts = []
      for (let y = top; y <= bottom; y += step) {
        const { v, p, breach } = valueAt(y)
        // On a phone the spine is a thread in the left margin and must never
        // reach the text column; the breach is re-staged as a wide chart inside
        // the alert act instead (see .act-chart).
        const spineX = compact ? 21 : width * p.x
        const spread = compact ? Math.min(p.spread, 11) : p.spread
        // Only count as "outside" once the excursion actually clears the rails.
        const outside = p.band > 0.02 ? Math.min(Math.max((Math.abs(v) / p.band - 1) * 1.6, 0), 1) * Math.min(breach * 3, 1) : 0
        pts.push({ y: y - scrollY, x: spineX + v * spread, spineX, band: p.band, spread, weight: p.weight, v, outside })
      }
      if (pts.length < 2) return

      // Governed band rails — the definition the series is being held to.
      ctx.lineWidth = 1
      for (const side of [-1, 1]) {
        ctx.beginPath()
        let started = false
        for (const pt of pts) {
          if (pt.band < 0.02) {
            started = false
            continue
          }
          const bx = pt.spineX + side * pt.spread * pt.band
          if (!started) {
            ctx.moveTo(bx, pt.y)
            started = true
          } else ctx.lineTo(bx, pt.y)
        }
        ctx.strokeStyle = rgba(pal.band, 0.55)
        ctx.setLineDash([2, 5])
        ctx.stroke()
        ctx.setLineDash([])
      }

      // The series. Coloured per segment so the breach is visible as a change in
      // the data, not as a glow laid over it.
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1]
        const b = pts[i]
        const outside = b.outside
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = rgba(mix(pal.line, pal.breach, outside), 0.42 + outside * 0.58)
        ctx.lineWidth = b.weight + outside * 1.9
        ctx.stroke()
      }

      // Axis ticks: the spine doubles as the page's time axis and progress read-out.
      ctx.font = '500 10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
      ctx.textBaseline = 'middle'
      for (const s of stops) {
        const label = TICKS[s.id]
        if (!label) continue
        const y = s.top - scrollY
        if (y < -20 || y > height + 20) continue
        const p = paramsAt(s.top)
        const spineX = compact ? 22 : width * p.x
        const passed = scrollY + height * 0.35 > s.top
        ctx.strokeStyle = rgba(pal.tick, passed ? 0.75 : 0.32)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(spineX - 9, y)
        ctx.lineTo(spineX + 9, y)
        ctx.stroke()
        if (!compact) {
          ctx.fillStyle = rgba(pal.tick, passed ? 0.9 : 0.4)
          ctx.fillText(label, spineX + 16, y)
        }
      }

      // The resolved node: the governed baseline terminates in a solid point.
      const last = stops[stops.length - 1]
      const endY = last.bottom - 8 - scrollY
      if (endY > -20 && endY < height + 20) {
        const p = paramsAt(last.bottom)
        const spineX = compact ? 22 : width * p.x
        ctx.beginPath()
        ctx.arc(spineX, endY, 4, 0, Math.PI * 2)
        ctx.fillStyle = rgba(pal.line, 0.95)
        ctx.fill()
      }
    }

    function tick() {
      const target = document.body.classList.contains('is-ink') ? 1 : 0
      const next = reducedMotion ? target : inkMix + (target - inkMix) * 0.12
      if (Math.abs(next - inkMix) > 0.001 || true) inkMix = next
      draw()
      frame = requestAnimationFrame(tick)
    }

    measure()
    draw()
    if (reducedMotion) {
      // Still drawn, still correct at any scroll position — just not animated per frame.
      const onScroll = () => {
        inkMix = document.body.classList.contains('is-ink') ? 1 : 0
        draw()
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', () => {
        measure()
        draw()
      })
      return () => window.removeEventListener('scroll', onScroll)
    }

    frame = requestAnimationFrame(tick)
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      ro.disconnect()
    }
  }, [reducedMotion])

  return <canvas className="spine" ref={canvasRef} aria-hidden="true" />
}
