// The press.
//
// A photograph is never shown as a photograph. It is sampled, auto-levelled and
// printed back onto the paper as ink dots. Scroll progress across the element
// drives the dot cell from coarse to fine, so the picture prints itself as you
// reach it.
//
// One owner per canvas. Cells are quantised to a short ladder so most frames are
// a repaint of an already-computed grid rather than a new sample.

const INK = [22, 21, 15]
const PAPER = [239, 233, 221]

// Coarse to fine. The floor stays at 3 so it always reads as print, never as a photo.
export const CELL_LADDER = [26, 20, 15, 11, 8, 6, 5, 4, 3]

const sourceCache = new Map()

/** Decode once per URL; every canvas using that photograph shares the bitmap. */
export function loadSource(src) {
  if (!sourceCache.has(src)) {
    sourceCache.set(
      src,
      new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      }),
    )
  }
  return sourceCache.get(src)
}

/**
 * Sample `img` into a cols x rows luminance grid, cover-cropped, auto-levelled.
 * Returned values are 0 (paper) .. 1 (full ink).
 */
function sample(img, cols, rows) {
  const off = document.createElement('canvas')
  off.width = cols
  off.height = rows
  const oc = off.getContext('2d', { willReadFrequently: true })
  const s = Math.max(cols / img.width, rows / img.height)
  oc.drawImage(img, (cols - img.width * s) / 2, (rows - img.height * s) / 2, img.width * s, img.height * s)
  const d = oc.getImageData(0, 0, cols, rows).data

  const lum = new Float32Array(cols * rows)
  let lo = 1
  let hi = 0
  for (let k = 0; k < lum.length; k++) {
    const i = k * 4
    const v = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255
    lum[k] = v
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  const span = Math.max(0.001, hi - lo)
  // Auto-level, then lift the midtones so ink never floods a whole area solid.
  for (let k = 0; k < lum.length; k++) lum[k] = Math.pow((lum[k] - lo) / span, 0.62)
  return lum
}

/**
 * A press for one canvas element. `print(progress)` is idempotent and cheap to
 * call every frame; it only redraws when the quantised cell actually changes.
 */
export function createPress(canvas, src) {
  let img = null
  let gridCache = new Map() // cell -> { cols, rows, lum }
  let lastKey = ''
  let cssW = 0
  let cssH = 0
  let disposed = false

  const dpr = () => Math.min(window.devicePixelRatio || 1, 2)

  function measure() {
    const r = canvas.getBoundingClientRect()
    if (!r.width || !r.height) return false
    const w = Math.round(r.width)
    const h = Math.round(r.height)
    if (w === cssW && h === cssH) return true
    cssW = w
    cssH = h
    // Cap the backing store: dots are big, resolution beyond this buys nothing.
    const scale = Math.min(dpr(), 1400 / Math.max(1, w))
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    gridCache = new Map()
    lastKey = ''
    return true
  }

  function print(progress) {
    if (disposed || !img) return
    if (!measure()) return
    const t = Math.max(0, Math.min(1, progress))
    const idx = Math.min(CELL_LADDER.length - 1, Math.round(t * (CELL_LADDER.length - 1)))
    const key = idx + ':' + canvas.width
    if (key === lastKey) return
    lastKey = key

    const scale = canvas.width / cssW
    const cell = CELL_LADDER[idx] * scale
    const cols = Math.max(1, Math.ceil(canvas.width / cell))
    const rows = Math.max(1, Math.ceil(canvas.height / cell))

    let grid = gridCache.get(idx)
    if (!grid) {
      grid = { cols, rows, lum: sample(img, cols, rows) }
      gridCache.set(idx, grid)
    }

    const ctx = canvas.getContext('2d')
    ctx.fillStyle = `rgb(${PAPER.join(',')})`
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = `rgb(${INK.join(',')})`
    const half = cell / 2
    const rMax = cell * 0.6
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const r = Math.sqrt(1 - Math.min(1, grid.lum[y * cols + x])) * rMax
        if (r < 0.25) continue
        ctx.beginPath()
        ctx.arc(x * cell + half, y * cell + half, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    return CELL_LADDER[idx]
  }

  const ready = loadSource(src).then((loaded) => {
    img = loaded
    return true
  })

  return {
    ready,
    print,
    dispose() {
      disposed = true
      gridCache = new Map()
    },
  }
}
