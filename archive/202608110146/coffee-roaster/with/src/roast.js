// Monotone cubic interpolation (Fritsch–Carlson) through the logged roast
// points. A roast curve never doubles back on itself, so a monotone spline is
// the honest way to draw the bean-temperature probe between recorded marks.

function slopes(xs, ys) {
  const n = xs.length
  const dx = [], dy = [], m = []
  for (let i = 0; i < n - 1; i++) {
    dx.push(xs[i + 1] - xs[i])
    dy.push(ys[i + 1] - ys[i])
    m.push(dy[i] / dx[i])
  }
  const t = [m[0]]
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) {
      t.push(0)
    } else {
      const w1 = 2 * dx[i] + dx[i - 1]
      const w2 = dx[i] + 2 * dx[i - 1]
      t.push((w1 + w2) / (w1 / m[i - 1] + w2 / m[i]))
    }
  }
  t.push(m[n - 2])
  return t
}

export function makeProbe(points) {
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const t = slopes(xs, ys)
  return function tempAt(x) {
    if (x <= xs[0]) return ys[0]
    if (x >= xs[xs.length - 1]) return ys[ys.length - 1]
    let i = 0
    while (i < xs.length - 2 && x > xs[i + 1]) i++
    const h = xs[i + 1] - xs[i]
    const s = (x - xs[i]) / h
    const s2 = s * s, s3 = s2 * s
    return (
      (2 * s3 - 3 * s2 + 1) * ys[i] +
      (s3 - 2 * s2 + s) * h * t[i] +
      (-2 * s3 + 3 * s2) * ys[i + 1] +
      (s3 - s2) * h * t[i + 1]
    )
  }
}

// Rate of rise: degrees per minute, the number a roaster actually watches.
export function makeRor(tempAt) {
  return (x) => (tempAt(x + 15) - tempAt(x - 15)) * 2
}

export function samples(profile, count = 160) {
  const tempAt = makeProbe(profile.points)
  const ror = makeRor(tempAt)
  const end = profile.drop
  const out = []
  for (let i = 0; i <= count; i++) {
    const x = (end * i) / count
    out.push({ t: x, temp: tempAt(x), ror: Math.max(0, ror(x)) })
  }
  return out
}

export function phaseAt(profile, t) {
  const dryEnd = profile.points[2][0]
  if (t < profile.points[1][0]) return 'Turning'
  if (t < dryEnd) return 'Drying'
  if (t < profile.firstCrack) return 'Maillard'
  return 'Development'
}

export function developmentRatio(profile) {
  return (profile.drop - profile.firstCrack) / profile.drop
}

export function fmtTime(seconds) {
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// The bean's ground colour over the roast: green, through the pale tan of the
// drying phase, into the logged finish colour of this particular lot.
const GREEN = [122, 138, 92]
const TAN = [176, 140, 96]

function hexToRgb(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
}

function mix(a, b, k) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * k))
}

export function beanColorAt(bean, t) {
  const { profile } = bean
  const dryEnd = profile.points[2][0]
  const finish = hexToRgb(bean.roastColor)
  let rgb
  if (t <= dryEnd) {
    rgb = mix(GREEN, TAN, t / dryEnd)
  } else {
    const k = Math.min(1, (t - dryEnd) / (profile.drop - dryEnd))
    // Colour development accelerates through first crack.
    rgb = mix(TAN, finish, k * k * (3 - 2 * k))
  }
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
}
