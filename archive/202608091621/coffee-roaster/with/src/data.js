// Product content. Names, tasting notes, roast levels, prices, step
// instructions, reviews and copy claims are preserved exactly as written.
//
// Two things are added for the design, both derived from the content itself:
// `drop` places each bean on the roast-level scale, and `noteColors` gives each
// tasting note a colour so a bag's flavour can be read as a swatch.

const NOTE_COLORS = {
  Jasmine: '#efe6c2',
  'lemon zest': '#e3c62f',
  honey: '#d69f33',
  Caramel: '#c07a2e',
  'red apple': '#b3352e',
  cocoa: '#563322',
  'Dark chocolate': '#33190f',
  cedar: '#7a6742',
  earth: '#4b3a2a',
  Blackcurrant: '#4a2350',
  tomato: '#b7402a',
  'brown sugar': '#a5713a',
  'Milk chocolate': '#7a4a2c',
  orange: '#e07a1f',
  almond: '#d8c3a0',
  Toffee: '#b07a34',
  hazelnut: '#8a5a33',
  smooth: '#c9b79a',
}

function withNotes(bean) {
  const parts = bean.notes.split(',').map((s) => s.trim())
  return {
    ...bean,
    noteColors: parts.map((word) => ({ word, color: NOTE_COLORS[word] ?? '#8a5a33' })),
  }
}

export const BEANS = [
  { id: 'ethiopia', name: 'Ethiopia Yirgacheffe', notes: 'Jasmine, lemon zest, honey', roast: 'Light', price: 18, drop: 201, origin: 'Ethiopia' },
  { id: 'kenya', name: 'Kenya AA Nyeri', notes: 'Blackcurrant, tomato, brown sugar', roast: 'Light', price: 19, drop: 206, origin: 'Kenya' },
  { id: 'colombia', name: 'Colombia Huila', notes: 'Caramel, red apple, cocoa', roast: 'Medium', price: 16, drop: 212, origin: 'Colombia' },
  { id: 'guatemala', name: 'Guatemala Antigua', notes: 'Milk chocolate, orange, almond', roast: 'Medium', price: 16, drop: 216, origin: 'Guatemala' },
  { id: 'decaf', name: 'Swiss Water Decaf Blend', notes: 'Toffee, hazelnut, smooth', roast: 'Medium', price: 15, drop: 219, origin: 'Blend' },
  { id: 'sumatra', name: 'Sumatra Mandheling', notes: 'Dark chocolate, cedar, earth', roast: 'Dark', price: 17, drop: 229, origin: 'Sumatra' },
].map(withNotes)

// Step instructions preserved verbatim. `readout` and `span` only restate
// numbers already present in the instruction; the two prep steps are untimed
// because the instructions do not time them.
export const STEPS = [
  {
    n: 1,
    title: 'Weigh',
    body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.',
    readout: '18 g : 300 ml',
    zone: 'prep',
  },
  {
    n: 2,
    title: 'Grind',
    body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.',
    readout: 'medium-fine',
    zone: 'prep',
  },
  {
    n: 3,
    title: 'Bloom',
    body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.',
    readout: '95°C · 30 s',
    zone: 'brew',
    span: [0, 30],
  },
  {
    n: 4,
    title: 'Pour',
    body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.',
    readout: '2.5 min · ends 3:00',
    zone: 'brew',
    span: [30, 180],
  },
]

export const REVIEWS = [
  { quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.', name: 'Maya T.', role: 'Subscriber since 2022' },
  { quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.', name: 'Daniel R.', role: 'Home barista' },
  { quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.', name: 'Priya S.', role: 'Gift subscriber' },
]

export const LEDGER = [
  { value: '11', label: 'partner farms', note: 'Ethiopia · Colombia · Kenya · Guatemala · Sumatra' },
  { value: '2.4×', label: 'commodity price paid', note: 'average across every contract, all published' },
  { value: '12kg', label: 'max batch size', note: 'one 1962 Probat, two roasters' },
  { value: '<24h', label: 'roast to shipment', note: 'the bag carries the timestamp' },
]

export const NAV_LINKS = [
  { href: '#beans', label: 'Beans' },
  { href: '#brew-guide', label: 'Brew Guide' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#subscribe', label: 'Subscribe' },
  { href: '#contact', label: 'Contact' },
]

export const FOOTER_LINKS = [
  { href: '#hero', label: 'Top' },
  { href: '/shipping', label: 'Shipping' },
  { href: '/returns', label: 'Returns' },
  { href: '/privacy', label: 'Privacy' },
]
