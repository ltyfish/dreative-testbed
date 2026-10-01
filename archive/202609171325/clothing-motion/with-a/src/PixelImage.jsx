import { useEffect, useRef } from 'react'

// One image cache for the whole page, so the rail and the index share decodes.
const cache = new Map()
function load(src) {
  let p = cache.get(src)
  if (!p) {
    p = new Promise((res, rej) => {
      const im = new Image()
      im.decoding = 'async'
      im.onload = () => res(im)
      im.onerror = rej
      im.src = src
    })
    cache.set(src, p)
  }
  return p
}

// The resolution ladder. `blocks` is snapped to one of these before drawing, so a
// continuously changing scroll value only ever triggers a redraw ~14 times across the
// whole resolve, not once per frame. RESOLVED means "draw the photograph as it is".
const LADDER = [6, 8, 11, 14, 18, 24, 31, 40, 52, 68, 88, 115, 150, 200]
export const RESOLVED = 10000

function snap(blocks) {
  if (blocks >= LADDER[LADDER.length - 1]) return RESOLVED
  for (const step of LADDER) if (blocks <= step) return step
  return RESOLVED
}

/**
 * A photograph that can be held at an arbitrary pixel-block size.
 *
 * Draws the source into a tiny offscreen canvas, then blows that up with
 * imageSmoothingEnabled = false, which is the only way to get true
 * nearest-neighbour blocks (CSS image-rendering does not survive a transform).
 *
 * `blocks` is the number of blocks across the element's width. Pass RESOLVED for
 * the untouched photograph. The duotone is CSS, applied by the .duo wrapper.
 */
export default function PixelImage({ src, blocks = RESOLVED, className = '', style, alt = '' }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const small = useRef(null)
  const state = useRef({ img: null, drawn: -1, w: 0, h: 0 })

  // Keep the latest requested level in a ref so scroll can write to it every frame
  // while the actual draw only happens when the snapped level changes.
  const want = useRef(snap(blocks))
  want.current = snap(blocks)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    let alive = true
    let raf = 0
    if (!small.current) small.current = document.createElement('canvas')

    const paint = (force) => {
      const s = state.current
      if (!s.img || !s.w || !s.h) return
      if (!force && s.drawn === want.current) return
      s.drawn = want.current
      const ctx = canvas.getContext('2d')
      const img = s.img
      // cover-crop the source to the element's aspect
      const ar = img.naturalWidth / img.naturalHeight
      const tar = s.w / s.h
      let sw, sh, sx, sy
      if (ar > tar) {
        sh = img.naturalHeight
        sw = sh * tar
        sx = (img.naturalWidth - sw) / 2
        sy = 0
      } else {
        sw = img.naturalWidth
        sh = sw / tar
        sx = 0
        sy = (img.naturalHeight - sh) / 2
      }
      ctx.imageSmoothingEnabled = want.current === RESOLVED
      if (want.current === RESOLVED) {
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
        return
      }
      const bw = Math.max(2, want.current)
      const bh = Math.max(2, Math.round((bw * s.h) / s.w))
      const sc = small.current
      sc.width = bw
      sc.height = bh
      const sctx = sc.getContext('2d')
      sctx.imageSmoothingEnabled = true
      sctx.drawImage(img, sx, sy, sw, sh, 0, 0, bw, bh)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(sc, 0, 0, bw, bh, 0, 0, canvas.width, canvas.height)
    }

    const resize = () => {
      const r = wrap.getBoundingClientRect()
      const w = Math.max(1, Math.round(r.width))
      const h = Math.max(1, Math.round(r.height))
      const s = state.current
      if (w === s.w && h === s.h) return
      s.w = w
      s.h = h
      // DPR is capped: blocks are square either way, and this is the frame budget.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      paint(true)
    }

    const tick = () => {
      paint(false)
      raf = requestAnimationFrame(tick)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    load(src).then((img) => {
      if (!alive) return
      state.current.img = img
      resize()
      paint(true)
    })
    resize()
    raf = requestAnimationFrame(tick)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [src])

  return (
    <div ref={wrapRef} className={`duo ${className}`} style={style} role="img" aria-label={alt}>
      <canvas ref={canvasRef} className="duo-canvas" />
    </div>
  )
}
