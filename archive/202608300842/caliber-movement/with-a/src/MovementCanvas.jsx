import { useEffect, useRef } from 'react'
import { FRAME_COUNT } from './frames.js'
import { loadFrames, getFrames } from './useMovement.js'

// The movement itself, drawn from 60 sampled frames of one continuous take.
// Two drivers, one subject: `progress` (the reader's scroll) or `autoplay`
// (the caliber running on its own clock, in the hero).
export default function MovementCanvas({ progress = 0, autoplay = false, reduced = false, label }) {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const progressRef = useRef(progress)
  progressRef.current = progress

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d', { alpha: false })
    const small = window.matchMedia('(max-width: 760px)').matches

    let disposed = false
    let raf = 0
    let visible = true
    let drawn = -1
    let clock = reduced ? FRAME_COUNT * 0.5 : 0
    let last = 0

    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const rect = wrap.getBoundingClientRect()
      const side = Math.max(1, Math.round(Math.min(rect.width, rect.height)))
      canvas.width = Math.round(side * dpr)
      canvas.height = Math.round(side * dpr)
      canvas.style.width = side + 'px'
      canvas.style.height = side + 'px'
      drawn = -1
    }

    const paint = (index, blend) => {
      const frames = getFrames()
      if (!frames) return
      const a = frames[Math.min(FRAME_COUNT - 1, Math.max(0, index))]
      if (!a || !a.naturalWidth) return
      ctx.fillStyle = '#0e0f11'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.globalAlpha = 1
      ctx.drawImage(a, 0, 0, canvas.width, canvas.height)
      if (blend > 0) {
        ctx.globalAlpha = blend
        ctx.drawImage(frames[0], 0, 0, canvas.width, canvas.height)
        ctx.globalAlpha = 1
      }
    }

    const tick = (t) => {
      if (disposed) return
      const dt = last ? Math.min(64, t - last) : 16
      last = t
      if (autoplay && !reduced && visible) {
        clock += dt * 0.006 // ~6 frames a second: the take, at its own pace
        if (clock >= FRAME_COUNT - 1 + 6) clock = 0
      }
      let index
      let blend = 0
      if (autoplay) {
        if (clock > FRAME_COUNT - 1) {
          index = FRAME_COUNT - 1
          blend = (clock - (FRAME_COUNT - 1)) / 6
        } else {
          index = Math.round(clock)
        }
      } else {
        index = Math.round(progressRef.current * (FRAME_COUNT - 1))
      }
      const key = index * 100 + Math.round(blend * 20)
      if (key !== drawn) {
        drawn = key
        paint(index, blend)
      }
      raf = requestAnimationFrame(tick)
    }

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting
      },
      { rootMargin: '20%' },
    )
    io.observe(wrap)

    const ro = new ResizeObserver(size)
    ro.observe(wrap)
    size()

    loadFrames(small).then(() => {
      if (disposed) return
      wrap.dataset.loaded = 'true'
      drawn = -1
    })

    raf = requestAnimationFrame(tick)
    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
    }
  }, [autoplay, reduced])

  return (
    <div className="movement" ref={wrapRef}>
      <canvas ref={canvasRef} role="img" aria-label={label} />
      <span className="movement__vignette" aria-hidden="true" />
    </div>
  )
}
