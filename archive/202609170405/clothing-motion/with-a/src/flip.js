// Registration.
//
// The sheet does not fade when you filter it. It re-registers: the plates that
// survive travel to their new cells, the way a forme is re-locked. Same idea for
// lifting a plate off the sheet into the enlarged view.
//
// Rects are measured on every run rather than cached, so a resize or an
// interrupted run always resolves to the current layout.

const EASE = 'cubic-bezier(.22,.61,.36,1)'

export function measure(nodes) {
  const map = new Map()
  for (const [key, node] of nodes) {
    if (!node) continue
    const r = node.getBoundingClientRect()
    if (r.width) map.set(key, r)
  }
  return map
}

/**
 * Invert-then-play. `before` is a Map(key -> DOMRect) captured before the layout
 * change; `nodes` is the same keyed map of elements after it.
 */
export function playRegistration(before, nodes, { duration = 420 } = {}) {
  const runs = []
  for (const [key, node] of nodes) {
    if (!node) continue
    const from = before.get(key)
    if (!from) {
      // A plate that was not on the sheet a moment ago: set it, don't slide it.
      runs.push(
        node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: duration * 0.7, easing: EASE, fill: 'none' }),
      )
      continue
    }
    const to = node.getBoundingClientRect()
    const dx = from.left - to.left
    const dy = from.top - to.top
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue
    runs.push(
      node.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
        duration,
        easing: EASE,
        fill: 'none',
      }),
    )
  }
  return runs
}

/**
 * Lift: the enlarged plate starts life at the rect of the sheet cell it came
 * from, so the garment you chose is visibly the garment you get.
 */
export function playLift(node, fromRect, { duration = 480 } = {}) {
  if (!node || !fromRect) return null
  const to = node.getBoundingClientRect()
  if (!to.width || !fromRect.width) return null
  const sx = fromRect.width / to.width
  const sy = fromRect.height / to.height
  const dx = fromRect.left + fromRect.width / 2 - (to.left + to.width / 2)
  const dy = fromRect.top + fromRect.height / 2 - (to.top + to.height / 2)
  return node.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 0.55 },
      { transform: 'none', opacity: 1 },
    ],
    { duration, easing: EASE, fill: 'none' },
  )
}
