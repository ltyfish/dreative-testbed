// The signature moment's driver.
//
// One authored value — `p`, the chapter's scroll progress, smoothed — selects a frame
// from a real 80-frame sequence AND the rectangle that frame is drawn into. Nothing in
// this chapter is animated by anything else, so the picture, the frame around it, the
// type and the handoff into the shop can never drift apart.

export const FRAME_COUNT = 80

const pad = (n) => String(n).padStart(3, '0')

export const manifest = (small) =>
  Array.from({ length: FRAME_COUNT }, (_, i) => `/media/${small ? 'fall-sm' : 'fall'}/f-${pad(i + 1)}.webp`)

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v)

// remap t from [a,b] to [0,1]
export const span = (t, a, b) => clamp((t - a) / (b - a))

export const mix = (a, b, t) => a + (b - a) * t

// smootherstep — used for the rect, never for the frame index (the film has its own timing)
export const ease = (t) => t * t * t * (t * (t * 6 - 15) + 10)

export function loadSequence(srcs, onProgress) {
  let done = 0
  const imgs = srcs.map((src) => {
    const img = new Image()
    img.decoding = 'async'
    img.src = src
    const settle = () => onProgress(++done / srcs.length)
    if (img.decode) img.decode().then(settle, settle)
    else img.onload = img.onerror = settle
    return img
  })
  return imgs
}

// Fit `w x h` inside a rect the way `object-fit: cover` would, then draw.
export function drawCover(ctx, img, x, y, w, h) {
  if (!img || !img.naturalWidth) return
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const dw = img.naturalWidth * scale
  const dh = img.naturalHeight * scale
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
  ctx.restore()
}
