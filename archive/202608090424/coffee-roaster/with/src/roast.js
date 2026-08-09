// The roast profile is the continuity device for the whole site: the same
// curve function draws the hero chart, every bean's sparkline, the subscription
// rhythm and the footer rule. It is the shape a drum roaster actually traces —
// charge, turning point, yellowing, first crack, drop.

// Normalised bean temperature (0 = charge floor, 1 = drop) across the roast.
export function profileY(t) {
  if (t <= 0.09) {
    // Charge: the cold beans pull the drum temperature down to the turning point.
    const u = t / 0.09
    return 0.58 - 0.34 * (u * u * (3 - 2 * u))
  }
  const u = (t - 0.09) / 0.91
  return 0.24 + 0.76 * (1 - Math.pow(1 - u, 2.15))
}

// Sample the curve into an SVG path across a box, optionally stopping early
// (a light roast is dropped before a dark one ever reaches first crack).
export function profilePath(width, height, { from = 0, to = 1, top = 0.08, bottom = 0.94, steps = 96 } = {}) {
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = from + ((to - from) * i) / steps
    const y = profileY(t)
    pts.push([t * width, height * (bottom - (bottom - top) * y)])
  }
  return pts.map(([x, y], i) => (i ? `L${x.toFixed(2)} ${y.toFixed(2)}` : `M${x.toFixed(2)} ${y.toFixed(2)}`)).join(' ')
}

// Where the curve sits vertically, as a percentage — used to hang HTML labels
// off exact points on the SVG curve so type and geometry stay locked together.
export function profileTopPct(t, top = 0.08, bottom = 0.94) {
  return (bottom - (bottom - top) * profileY(t)) * 100
}

export const STAGES = [
  { t: 0.09, label: 'Turning point', note: 'the drum takes the cold back' },
  { t: 0.4, label: 'Yellowing', note: 'grassy smell turns to bread' },
  { t: 0.72, label: 'First crack', note: 'audible, and the clock speeds up' },
  { t: 0.97, label: 'Drop', note: 'into the cooling tray' },
]

// Deterministic scatter so a bean's grounds texture is stable between renders
// and different for every bean.
function lcg(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

// A bed of roasted beans: each one an ellipse with the centre crease, packed on
// a jittered grid so the field is dense and never repeats between batches.
export function groundsField(seed, cols = 15, rows = 9) {
  const rand = lcg(seed)
  const out = []
  const cw = 100 / cols
  const ch = 100 / rows
  for (let r = -1; r <= rows; r++) {
    for (let c = -1; c <= cols; c++) {
      const size = 0.78 + rand() * 0.5
      out.push({
        cx: (c + 0.5) * cw + (rand() - 0.5) * cw * 1.15,
        cy: (r + 0.5) * ch + (rand() - 0.5) * ch * 1.15,
        rx: cw * 0.62 * size,
        ry: ch * 0.9 * size * (0.62 + rand() * 0.18),
        rot: rand() * 360,
        shade: rand(),
        depth: rand(),
      })
    }
  }
  // Draw the deepest beans first so the bed reads as layered, not tiled.
  return out.sort((a, b) => a.depth - b.depth)
}
