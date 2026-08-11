import originEthiopia from './media/origin-ethiopia.jpg'
import originColombia from './media/origin-colombia.jpg'
import originSumatra from './media/origin-sumatra.jpg'
import originKenya from './media/origin-kenya.jpg'
import originGuatemala from './media/origin-guatemala.jpg'
import originDecaf from './media/origin-decaf.jpg'

import roastGreen from './media/roast-0-green.jpg'
import roastLight from './media/roast-1-light.jpg'
import roastMedium from './media/roast-2-medium.jpg'
import roastDark from './media/roast-3-dark.jpg'

export const BEANS = [
  {
    id: 'ethiopia',
    // Average colour of this origin's photograph, sampled from the file.
    tone: '#638382',
    name: 'Ethiopia Yirgacheffe',
    notes: 'Jasmine, lemon zest, honey',
    roast: 'Light',
    price: 18,
    origin: 'Yirgacheffe, Ethiopia',
    photo: originEthiopia,
    photoAlt: 'Terraced coffee-growing highlands in Ethiopia',
  },
  {
    id: 'colombia',
    // Average colour of this origin's photograph, sampled from the file.
    tone: '#5d6257',
    name: 'Colombia Huila',
    notes: 'Caramel, red apple, cocoa',
    roast: 'Medium',
    price: 16,
    origin: 'Huila, Colombia',
    photo: originColombia,
    photoAlt: 'Cloud-covered coffee slopes in the Colombian Andes',
  },
  {
    id: 'sumatra',
    // Average colour of this origin's photograph, sampled from the file.
    tone: '#718371',
    name: 'Sumatra Mandheling',
    notes: 'Dark chocolate, cedar, earth',
    roast: 'Dark',
    price: 17,
    origin: 'Mandheling, Sumatra',
    photo: originSumatra,
    photoAlt: 'Dense forested ridge in Sumatra',
  },
  {
    id: 'kenya',
    // Average colour of this origin's photograph, sampled from the file.
    tone: '#b49f8b',
    name: 'Kenya AA Nyeri',
    notes: 'Blackcurrant, tomato, brown sugar',
    roast: 'Light',
    price: 19,
    origin: 'Nyeri, Kenya',
    photo: originKenya,
    photoAlt: 'Coffee drying on raised beds in the sun',
  },
  {
    id: 'guatemala',
    // Average colour of this origin's photograph, sampled from the file.
    tone: '#958f8c',
    name: 'Guatemala Antigua',
    notes: 'Milk chocolate, orange, almond',
    roast: 'Medium',
    price: 16,
    origin: 'Antigua, Guatemala',
    photo: originGuatemala,
    photoAlt: 'A volcano above the cloud line in Guatemala',
  },
  {
    id: 'decaf',
    // Average colour of this origin's photograph, sampled from the file.
    tone: '#595f74',
    name: 'Swiss Water Decaf Blend',
    notes: 'Toffee, hazelnut, smooth',
    roast: 'Medium',
    price: 15,
    origin: 'Swiss Water process',
    photo: originDecaf,
    photoAlt: 'Cold moving water at a shoreline',
  },
]

export const STEPS = [
  {
    n: 1,
    title: 'Weigh',
    body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.',
    // Position on the brew clock, expressed as a fraction of the 3-minute brew.
    at: 0,
    clock: 'before the water',
    metric: '18g : 300ml',
  },
  {
    n: 2,
    title: 'Grind',
    body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.',
    at: 0,
    clock: 'before the water',
    metric: 'medium-fine',
  },
  {
    n: 3,
    title: 'Bloom',
    body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.',
    at: 0,
    clock: '0:00 – 0:30',
    metric: '36g at 95°C',
  },
  {
    n: 4,
    title: 'Pour',
    body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.',
    at: 0.166,
    clock: '0:30 – 3:00',
    metric: '264g remaining',
  },
]

export const REVIEWS = [
  {
    quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.',
    name: 'Maya T.',
    role: 'Subscriber since 2022',
  },
  {
    quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.',
    name: 'Daniel R.',
    role: 'Home barista',
  },
  {
    quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.',
    name: 'Priya S.',
    role: 'Gift subscriber',
  },
]

// Stage 0 is the green coffee that arrives from the farm; stages 1–3 are the
// three roast levels Northwind actually sells. Descriptions are the standard
// drum-roasting definitions, not new claims about this roastery.
export const ROASTS = [
  {
    id: 'green',
    label: 'Green',
    sells: false,
    photo: roastGreen,
    photoAlt: 'Macro photograph of pale green unroasted coffee beans',
    drop: 'Not yet in the drum',
    note: 'How eleven farms send it to Bergen: dense, grassy, and shelf-stable for months.',
  },
  {
    id: 'light',
    label: 'Light',
    sells: true,
    photo: roastLight,
    photoAlt: 'Macro photograph of matte tan light-roast coffee beans',
    drop: 'Dropped just after first crack',
    note: 'The origin still does the talking. Acidity high, body light, sugars barely caramelised.',
  },
  {
    id: 'medium',
    label: 'Medium',
    sells: true,
    photo: roastMedium,
    photoAlt: 'Macro photograph of glossy amber medium-roast coffee beans',
    drop: 'Dropped between first and second crack',
    note: 'The balance point. Caramelisation and origin character hold roughly equal weight.',
  },
  {
    id: 'dark',
    label: 'Dark',
    sells: true,
    photo: roastDark,
    photoAlt: 'Macro photograph of near-black oily dark-roast coffee beans',
    drop: 'Taken to the edge of second crack',
    note: 'Oils reach the surface. Roast character leads; the cup turns heavy, low and sweet.',
  },
]

export const ROAST_IDS = ROASTS.map((r) => r.id)
