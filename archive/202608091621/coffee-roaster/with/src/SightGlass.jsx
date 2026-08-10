import { useEffect, useMemo, useRef } from 'react'
import { beanRgb } from './roast.js'
import { useRoast } from './useRoast.jsx'

// The sight glass on the front of a drum roaster: a small round window you keep
// looking through while the batch runs. Here it is one element that travels from
// the middle of the first screen into the instrument rail, and stays with you
// for the rest of the page — showing the beans tumbling and darkening, then
// settling in the cooling tray, then the bloom, then the surface of the cup.

const COUNT = 190

function makeBeans() {
  const beans = []
  for (let i = 0; i < COUNT; i += 1) {
    const r = Math.sqrt(Math.random()) * 0.86
    beans.push({
      r,
      a: Math.random() * Math.PI * 2,
      size: 0.052 + Math.random() * 0.03,
      squash: 0.56 + Math.random() * 0.16,
      tilt: Math.random() * Math.PI,
      spin: 0.5 + Math.random() * 1.1,
      bob: Math.random() * Math.PI * 2,
      shade: 0.82 + Math.random() * 0.36,
      settle: Math.random(),
    })
  }
  return beans
}

function drawBean(ctx, x, y, size, tilt, squash, rgb, shade) {
  const [r, g, b] = rgb
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * shade)))
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(tilt)
  ctx.fillStyle = `rgb(${f(r)} ${f(g)} ${f(b)})`
  ctx.beginPath()
  ctx.ellipse(0, 0, size, size * squash, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = `rgba(0,0,0,${0.42 + shade * 0.1})`
  ctx.lineWidth = Math.max(0.7, size * 0.13)
  ctx.beginPath()
  ctx.moveTo(-size * 0.72, 0)
  ctx.quadraticCurveTo(0, size * squash * 0.42, size * 0.72, 0)
  ctx.stroke()
  ctx.restore()
}

export default function SightGlass() {
  const canvasRef = useRef(null)
  const renderRef = useRef(null)
  const beansRef = useRef(null)
  const stateRef = useRef({ temp: 200, vessel: 'drum', heat: 1 })
  const { reading, selectedBean, reduced } = useRoast()

  if (!beansRef.current) beansRef.current = makeBeans()

  // The selected bag freezes the window at that bean's roast: the reason to
  // click a bean is to see what "Dark" actually looks like coming out.
  const shownTemp = selectedBean ? selectedBean.drop : reading.temp
  const shownVessel = selectedBean ? 'drum' : reading.vessel

  stateRef.current.temp = shownTemp
  stateRef.current.vessel = shownVessel

  const rgb = useMemo(() => beanRgb(shownTemp), [shownTemp])
  stateRef.current.rgb = rgb

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf = 0
    let t = 0
    let running = true

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
    }

    const render = () => {
      const { temp, vessel, rgb: color } = stateRef.current
      const w = canvas.width
      const h = canvas.height
      const cx = w / 2
      const cy = h / 2
      const R = Math.min(w, h) / 2
      ctx.clearRect(0, 0, w, h)

      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.clip()

      const hot = Math.max(0, Math.min(1, (temp - 90) / 140))
      if (vessel === 'drum') {
        const glow = ctx.createRadialGradient(cx, cy + R * 0.65, R * 0.05, cx, cy, R * 1.25)
        glow.addColorStop(0, `rgba(255,${110 + hot * 60},30,${0.32 + hot * 0.4})`)
        glow.addColorStop(1, '#0d0906')
        ctx.fillStyle = glow
        ctx.fillRect(0, 0, w, h)
      } else if (vessel === 'tray') {
        const g = ctx.createLinearGradient(0, 0, 0, h)
        g.addColorStop(0, '#141a1e')
        g.addColorStop(1, '#0a0d10')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      } else {
        const g = ctx.createRadialGradient(cx, cy - R * 0.3, R * 0.1, cx, cy, R * 1.1)
        g.addColorStop(0, vessel === 'cup' ? '#4a2a17' : '#2a1a10')
        g.addColorStop(1, '#0b0705')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }

      if (vessel === 'drum' || vessel === 'tray') {
        const spin = vessel === 'drum' ? t * 0.55 : 0
        for (const bean of beansRef.current) {
          let x
          let y
          if (vessel === 'drum') {
            const a = bean.a + spin * bean.spin * 0.4 + spin * 0.6
            const r = bean.r * (0.94 + Math.sin(t * 1.6 + bean.bob) * 0.055)
            x = cx + Math.cos(a) * r * R * 0.9
            y = cy + Math.sin(a) * r * R * 0.9 + R * 0.12 * Math.sin(a)
          } else {
            // Poured out flat onto the cooling tray.
            x = cx + (bean.settle - 0.5) * R * 1.85
            y = cy + R * 0.16 + Math.cos(bean.a) * R * 0.5 * bean.r + Math.sin(t * 0.5 + bean.bob) * R * 0.008
          }
          drawBean(
            ctx,
            x,
            y,
            R * bean.size,
            bean.tilt + (vessel === 'drum' ? spin * bean.spin : 0),
            bean.squash,
            color,
            bean.shade,
          )
        }
        if (vessel === 'drum') {
          ctx.strokeStyle = 'rgba(20,12,6,0.55)'
          ctx.lineWidth = R * 0.09
          ctx.beginPath()
          ctx.arc(cx, cy, R * 1.02, spin * 0.6, spin * 0.6 + 1.1)
          ctx.stroke()
        } else {
          ctx.strokeStyle = 'rgba(150,190,210,0.5)'
          ctx.lineWidth = Math.max(1, R * 0.02)
          ctx.beginPath()
          ctx.arc(cx, cy - R * 0.55, R * 0.9, 0.25, Math.PI - 0.25)
          ctx.stroke()
        }
      } else if (vessel === 'brewer') {
        // Wet bed of grounds, blooming.
        const bed = cy + R * 0.28
        ctx.fillStyle = '#20120b'
        ctx.beginPath()
        ctx.moveTo(cx - R, h)
        ctx.lineTo(cx - R, bed)
        for (let i = 0; i <= 24; i += 1) {
          const px = cx - R + (i / 24) * 2 * R
          const dome = Math.cos(((i / 24) - 0.5) * Math.PI) * R * 0.34
          ctx.lineTo(px, bed - dome + Math.sin(t * 1.1 + i * 0.6) * R * 0.012)
        }
        ctx.lineTo(cx + R, h)
        ctx.closePath()
        ctx.fill()
        for (let i = 0; i < 26; i += 1) {
          const ph = (t * 0.5 + i * 0.19) % 1
          const px = cx + Math.sin(i * 2.1) * R * 0.7
          const py = bed - R * 0.3 - ph * R * 0.5
          ctx.fillStyle = `rgba(214,178,132,${0.5 * (1 - ph)})`
          ctx.beginPath()
          ctx.arc(px, py, R * (0.012 + ph * 0.03), 0, Math.PI * 2)
          ctx.fill()
        }
      } else {
        // Looking down into the cup.
        ctx.fillStyle = '#1b0f08'
        ctx.beginPath()
        ctx.arc(cx, cy, R * 0.96, 0, Math.PI * 2)
        ctx.fill()
        for (let i = 0; i < 3; i += 1) {
          ctx.strokeStyle = `rgba(200,160,110,${0.3 - i * 0.08})`
          ctx.lineWidth = Math.max(1, R * 0.03)
          ctx.beginPath()
          ctx.arc(cx, cy, R * (0.9 - i * 0.13) + Math.sin(t * 0.6 + i) * R * 0.012, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      // Glass: rim shadow and a fixed highlight so it reads as a window.
      const vig = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, 'rgba(0,0,0,0.72)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(255,255,255,0.07)'
      ctx.beginPath()
      ctx.ellipse(cx - R * 0.34, cy - R * 0.46, R * 0.42, R * 0.2, -0.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    const loop = () => {
      if (!running) return
      t += 1 / 60
      render()
      raf = requestAnimationFrame(loop)
    }

    renderRef.current = render
    resize()
    const ro = new ResizeObserver(() => {
      resize()
      render()
    })
    ro.observe(canvas)

    if (reduced) {
      render()
    } else {
      raf = requestAnimationFrame(loop)
      const onVisibility = () => {
        if (document.hidden) {
          running = false
          cancelAnimationFrame(raf)
        } else if (!running) {
          running = true
          raf = requestAnimationFrame(loop)
        }
      }
      document.addEventListener('visibilitychange', onVisibility)
      return () => {
        running = false
        cancelAnimationFrame(raf)
        ro.disconnect()
        document.removeEventListener('visibilitychange', onVisibility)
      }
    }

    return () => {
      running = false
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [reduced])

  // Reduced motion still needs the colour to update when the state changes.
  useEffect(() => {
    if (reduced && renderRef.current) renderRef.current()
  }, [reduced, shownTemp, shownVessel])

  return (
    <canvas
      ref={canvasRef}
      className="sight-glass-canvas"
      data-vessel={shownVessel}
      role="img"
      aria-label={`Roaster sight glass: beans at ${Math.round(shownTemp)} degrees Celsius, ${shownVessel}`}
    />
  )
}
