// The thermal life of a coffee bean, used as the site's spine.
//
// The page is one temperature-over-time reading. It starts when green beans hit
// the hot drum, climbs through drying and first crack, falls off a cliff into
// the cooling tray, sits at room temperature in the bag, and rises one last time
// when someone pours 95°C water over it. Scroll position is time.

/** Anchor points of a standard drum roast + the brew that follows, in °C. */
export const PROFILE = [
  { p: 0.0, temp: 200, phase: 'Charge', vessel: 'drum' },
  { p: 0.04, temp: 118, phase: 'Charge', vessel: 'drum' },
  { p: 0.08, temp: 91, phase: 'Turning point', vessel: 'drum' },
  { p: 0.2, temp: 128, phase: 'Drying', vessel: 'drum' },
  { p: 0.3, temp: 152, phase: 'Drying', vessel: 'drum' },
  { p: 0.38, temp: 174, phase: 'Yellowing', vessel: 'drum' },
  { p: 0.46, temp: 189, phase: 'Yellowing', vessel: 'drum' },
  { p: 0.53, temp: 199, phase: 'First crack', vessel: 'drum' },
  { p: 0.6, temp: 209, phase: 'Development', vessel: 'drum' },
  { p: 0.66, temp: 219, phase: 'Drop', vessel: 'drum' },
  { p: 0.71, temp: 96, phase: 'Cooling tray', vessel: 'tray' },
  { p: 0.75, temp: 34, phase: 'Cooling tray', vessel: 'tray' },
  { p: 0.79, temp: 95, phase: 'Bloom', vessel: 'brewer' },
  { p: 0.86, temp: 93, phase: 'Pour', vessel: 'brewer' },
  { p: 0.92, temp: 71, phase: 'In the cup', vessel: 'cup' },
  { p: 0.97, temp: 58, phase: 'In the cup', vessel: 'cup' },
  { p: 1.0, temp: 52, phase: 'In the cup', vessel: 'cup' },
]

/** Elapsed clock shown on the readout, in seconds, across the whole reading. */
const CLOCK_END = 15 * 60

export function sampleProfile(p) {
  const t = Math.min(1, Math.max(0, p))
  let i = 1
  while (i < PROFILE.length - 1 && PROFILE[i].p < t) i += 1
  const a = PROFILE[i - 1]
  const b = PROFILE[i]
  const k = b.p === a.p ? 0 : (t - a.p) / (b.p - a.p)
  return {
    progress: t,
    temp: a.temp + (b.temp - a.temp) * k,
    phase: k > 0.5 ? b.phase : a.phase,
    vessel: k > 0.5 ? b.vessel : a.vessel,
    clock: t * CLOCK_END,
  }
}

export function formatClock(seconds) {
  const s = Math.max(0, Math.round(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/**
 * Bean colour through a roast, sampled from what green coffee actually looks
 * like on the trier: grass green, straw, cinnamon, chestnut, then near-black.
 */
const BEAN_RAMP = [
  { t: 90, c: [125, 143, 106] },
  { t: 150, c: [186, 165, 106] },
  { t: 180, c: [176, 122, 68] },
  { t: 200, c: [141, 78, 43] },
  { t: 214, c: [104, 52, 30] },
  { t: 226, c: [70, 32, 20] },
  { t: 235, c: [43, 21, 15] },
]

export function beanRgb(temp) {
  const t = Math.min(235, Math.max(90, temp))
  let i = 1
  while (i < BEAN_RAMP.length - 1 && BEAN_RAMP[i].t < t) i += 1
  const a = BEAN_RAMP[i - 1]
  const b = BEAN_RAMP[i]
  const k = (t - a.t) / (b.t - a.t)
  return a.c.map((v, j) => Math.round(v + (b.c[j] - v) * k))
}

export function beanColor(temp) {
  const [r, g, b] = beanRgb(temp)
  return `rgb(${r} ${g} ${b})`
}

/** Where the beans section sits in the reading — used to jump the marker. */
export const BEANS_SECTION_RANGE = [0.46, 0.68]

/** Roast-level scale drawn under the bean shelf. */
export const ROAST_SCALE = { min: 198, max: 232 }

export function roastScalePosition(dropTemp) {
  const { min, max } = ROAST_SCALE
  return (dropTemp - min) / (max - min)
}
