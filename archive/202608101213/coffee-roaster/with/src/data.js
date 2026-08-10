// The roast log is the spine of this site: every bean Northwind sells exists as a
// curve recorded off the 1962 Probat. Times are mm:ss from charge, temperatures are
// bean temperature in °C, and `swatch` is the roasted colour the batch drops at.

export const BEANS = [
  {
    id: 'ethiopia',
    name: 'Ethiopia Yirgacheffe',
    notes: 'Jasmine, lemon zest, honey',
    roast: 'Light',
    price: 18,
    origin: 'Gedeb, Gedeo Zone',
    altitude: '1,950 m',
    process: 'Washed',
    swatch: '#a97a4e',
    log: { charge: 200, turn: 88, dryEnd: 148, firstCrack: 8.17, drop: 9.67, dropTemp: 205, dev: 15.5 },
  },
  {
    id: 'colombia',
    name: 'Colombia Huila',
    notes: 'Caramel, red apple, cocoa',
    roast: 'Medium',
    price: 16,
    origin: 'Pitalito, Huila',
    altitude: '1,720 m',
    process: 'Washed',
    swatch: '#8a5733',
    log: { charge: 202, turn: 90, dryEnd: 151, firstCrack: 8.67, drop: 10.83, dropTemp: 210, dev: 20.0 },
  },
  {
    id: 'sumatra',
    name: 'Sumatra Mandheling',
    notes: 'Dark chocolate, cedar, earth',
    roast: 'Dark',
    price: 17,
    origin: 'Lintong, North Sumatra',
    altitude: '1,400 m',
    process: 'Wet-hulled',
    swatch: '#452a1c',
    log: { charge: 205, turn: 92, dryEnd: 154, firstCrack: 8.92, drop: 12.33, dropTemp: 219, dev: 27.7 },
  },
  {
    id: 'kenya',
    name: 'Kenya AA Nyeri',
    notes: 'Blackcurrant, tomato, brown sugar',
    roast: 'Light',
    price: 19,
    origin: 'Nyeri County',
    altitude: '1,800 m',
    process: 'Washed',
    swatch: '#a06f45',
    log: { charge: 201, turn: 89, dryEnd: 149, firstCrack: 8.42, drop: 10.0, dropTemp: 206, dev: 15.8 },
  },
  {
    id: 'guatemala',
    name: 'Guatemala Antigua',
    notes: 'Milk chocolate, orange, almond',
    roast: 'Medium',
    price: 16,
    origin: 'Antigua Valley',
    altitude: '1,600 m',
    process: 'Washed',
    swatch: '#79492a',
    log: { charge: 203, turn: 91, dryEnd: 152, firstCrack: 8.58, drop: 11.17, dropTemp: 212, dev: 23.1 },
  },
  {
    id: 'decaf',
    name: 'Swiss Water Decaf Blend',
    notes: 'Toffee, hazelnut, smooth',
    roast: 'Medium',
    price: 15,
    origin: 'Blend — Colombia & Peru',
    altitude: '1,500–1,800 m',
    process: 'Swiss Water®',
    swatch: '#6b4028',
    log: { charge: 196, turn: 85, dryEnd: 145, firstCrack: 7.75, drop: 10.33, dropTemp: 208, dev: 25.0 },
  },
]

// Preserved verbatim from the original brew guide.
export const STEPS = [
  {
    n: 1,
    title: 'Weigh',
    body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.',
    at: 0,
    mark: '00:00',
    aside: '18g : 300ml',
  },
  {
    n: 2,
    title: 'Grind',
    body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.',
    at: 0.35,
    mark: '00:20',
    aside: 'Medium-fine',
  },
  {
    n: 3,
    title: 'Bloom',
    body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.',
    at: 0.5,
    mark: '00:30',
    aside: '36ml at 95°C',
  },
  {
    n: 4,
    title: 'Pour',
    body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.',
    at: 3,
    mark: '03:00',
    aside: '264ml, slow circles',
  },
]

export const REVIEWS = [
  { quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.', name: 'Maya T.', role: 'Subscriber since 2022' },
  { quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.', name: 'Daniel R.', role: 'Home barista' },
  { quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.', name: 'Priya S.', role: 'Gift subscriber' },
]

// The roast stages double as the site's continuity rail: reading the page top to
// bottom is one 12kg batch, from charge to the parcel leaving the door.
export const STAGES = [
  { id: 'hero', clock: '00:00', label: 'Charge', temp: '200°C' },
  { id: 'story', clock: '04:10', label: 'Drying', temp: '148°C' },
  { id: 'beans', clock: '08:30', label: 'First crack', temp: '196°C' },
  { id: 'brew-guide', clock: '11:40', label: 'Drop', temp: '212°C' },
  { id: 'reviews', clock: '13:30', label: 'Cooling', temp: '40°C' },
  { id: 'subscribe', clock: '+18h', label: 'Boxed', temp: 'Bergen' },
  { id: 'contact', clock: '+24h', label: 'Shipped', temp: 'Out' },
]

export const PLOT = { w: 760, h: 400, ml: 56, mr: 20, mt: 22, mb: 42, tMax: 13, tempMin: 60, tempMax: 232 }

export function px(t) {
  const inner = PLOT.w - PLOT.ml - PLOT.mr
  return PLOT.ml + (t / PLOT.tMax) * inner
}

export function py(temp) {
  const inner = PLOT.h - PLOT.mt - PLOT.mb
  return PLOT.mt + (1 - (temp - PLOT.tempMin) / (PLOT.tempMax - PLOT.tempMin)) * inner
}

export function curvePoints(log) {
  const { charge, turn, dryEnd, firstCrack, drop, dropTemp } = log
  const fcTemp = 196
  return [
    [0, charge],
    [0.45, charge - (charge - turn) * 0.62],
    [1.3, turn],
    [2.4, turn + (dryEnd - turn) * 0.4],
    [3.7, turn + (dryEnd - turn) * 0.74],
    [5.0, dryEnd],
    [6.4, dryEnd + (fcTemp - dryEnd) * 0.42],
    [7.6, dryEnd + (fcTemp - dryEnd) * 0.76],
    [firstCrack, fcTemp],
    [firstCrack + (drop - firstCrack) * 0.5, fcTemp + (dropTemp - fcTemp) * 0.58],
    [drop, dropTemp],
  ]
}

// Catmull-Rom through the logged points, converted to cubic beziers so the curve
// reads like a drawn profile rather than a chain of straight segments.
export function smoothPath(points) {
  const p = points.map(([t, temp]) => [px(t), py(temp)])
  if (p.length < 2) return ''
  let d = `M ${p[0][0].toFixed(2)} ${p[0][1].toFixed(2)}`
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i]
    const p1 = p[i]
    const p2 = p[i + 1]
    const p3 = p[i + 2] || p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C ${c1[0].toFixed(2)} ${c1[1].toFixed(2)}, ${c2[0].toFixed(2)} ${c2[1].toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`
  }
  return d
}

export function mmss(minutes) {
  const total = Math.round(minutes * 60)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
