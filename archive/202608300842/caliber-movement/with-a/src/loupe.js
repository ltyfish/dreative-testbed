// The loupe. One photograph, one engine.
//
// Every view of the movement on this page — the hero, the six stops of the power
// path, the four layers — is the same file, framed differently. `applyView` is
// the only thing that ever moves it: give it a box, an <img> inside that box,
// and a region of the image, and it puts that region in the middle of the box.
//
// Regions are fractions of the image, so they survive any resize and any
// derivative. The image's own aspect ratio is the only measurement it needs.

export const PLATE_RATIO = 4000 / 3647

export function applyView(img, box, view, ratio = PLATE_RATIO) {
  if (!img || !box) return
  const bw = box.clientWidth
  const bh = box.clientHeight
  if (!bw || !bh) return

  // The region must be wide enough that the scaled image still covers the box.
  const maxW = bw / (ratio * bh)
  const w = Math.min(view.w, maxW, 1)
  const s = 1 / w

  const ih = bw / ratio // the img is laid out at 100% of the box width
  let x = bw / 2 - s * (view.cx * bw)
  let y = bh / 2 - s * (view.cy * ih)

  // Never let the frame run off the edge of the photograph.
  x = Math.min(0, Math.max(bw - s * bw, x))
  y = Math.min(0, Math.max(bh - s * ih, y))

  img.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${s.toFixed(4)})`
}

export const lerpView = (a, b, t) => ({
  cx: a.cx + (b.cx - a.cx) * t,
  cy: a.cy + (b.cy - a.cy) * t,
  w: a.w + (b.w - a.w) * t,
})

// Slow in, slow out. Used between stops so the travel reads as a camera move
// rather than a jump, and so a fast scroll does not tear through six stages.
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
