// Northwind roast log data.
//
// Every lot carries the roast record the roastery actually keeps: charge
// temperature, turning point, end of drying, first crack and drop, in seconds
// and degrees Celsius. `roastColor` is the ground colour of the finished bean;
// `agtron` is the whole-bean reading taken off the cooling tray.

export const BEANS = [
  {
    id: 'ethiopia',
    name: 'Ethiopia Yirgacheffe',
    notes: 'Jasmine, lemon zest, honey',
    roast: 'Light',
    price: 18,
    lot: 'NW-241',
    origin: 'Gedeb, Gedeo Zone',
    altitude: '1950–2100 m',
    process: 'Washed',
    varietal: 'Heirloom',
    agtron: 89,
    roastColor: '#8b5c33',
    profile: {
      charge: 195,
      points: [
        [0, 195],
        [65, 88],
        [270, 150],
        [485, 197],
        [555, 203],
      ],
      firstCrack: 485,
      drop: 555,
    },
  },
  {
    id: 'colombia',
    name: 'Colombia Huila',
    notes: 'Caramel, red apple, cocoa',
    roast: 'Medium',
    price: 16,
    lot: 'NW-242',
    origin: 'Pitalito, Huila',
    altitude: '1700–1850 m',
    process: 'Washed',
    varietal: 'Caturra, Castillo',
    agtron: 62,
    roastColor: '#6f4327',
    profile: {
      charge: 200,
      points: [
        [0, 200],
        [75, 92],
        [290, 151],
        [525, 199],
        [650, 210],
      ],
      firstCrack: 525,
      drop: 650,
    },
  },
  {
    id: 'sumatra',
    name: 'Sumatra Mandheling',
    notes: 'Dark chocolate, cedar, earth',
    roast: 'Dark',
    price: 17,
    lot: 'NW-243',
    origin: 'Lintong, North Sumatra',
    altitude: '1300–1500 m',
    process: 'Wet hulled',
    varietal: 'Ateng, Jember',
    agtron: 43,
    roastColor: '#3f2318',
    profile: {
      charge: 202,
      points: [
        [0, 202],
        [80, 93],
        [300, 152],
        [535, 199],
        [730, 218],
      ],
      firstCrack: 535,
      drop: 730,
    },
  },
  {
    id: 'kenya',
    name: 'Kenya AA Nyeri',
    notes: 'Blackcurrant, tomato, brown sugar',
    roast: 'Light',
    price: 19,
    lot: 'NW-244',
    origin: 'Nyeri, Central Highlands',
    altitude: '1800–2000 m',
    process: 'Washed, double fermented',
    varietal: 'SL28, SL34',
    agtron: 84,
    roastColor: '#94643a',
    profile: {
      charge: 197,
      points: [
        [0, 197],
        [70, 90],
        [280, 152],
        [500, 198],
        [580, 205],
      ],
      firstCrack: 500,
      drop: 580,
    },
  },
  {
    id: 'guatemala',
    name: 'Guatemala Antigua',
    notes: 'Milk chocolate, orange, almond',
    roast: 'Medium',
    price: 16,
    lot: 'NW-245',
    origin: 'Antigua Valley, Sacatepéquez',
    altitude: '1500–1700 m',
    process: 'Washed',
    varietal: 'Bourbon, Typica',
    agtron: 58,
    roastColor: '#67402a',
    profile: {
      charge: 200,
      points: [
        [0, 200],
        [72, 91],
        [285, 150],
        [520, 198],
        [645, 209],
      ],
      firstCrack: 520,
      drop: 645,
    },
  },
  {
    id: 'decaf',
    name: 'Swiss Water Decaf Blend',
    notes: 'Toffee, hazelnut, smooth',
    roast: 'Medium',
    price: 15,
    lot: 'NW-246',
    origin: 'Colombia & Peru, blended',
    altitude: '1500–1900 m',
    process: 'Swiss Water®',
    varietal: 'Mixed',
    agtron: 55,
    roastColor: '#5e3a24',
    profile: {
      // Decaffeinated green is porous and browns early, so it charges cooler.
      charge: 188,
      points: [
        [0, 188],
        [60, 86],
        [250, 148],
        [470, 193],
        [585, 204],
      ],
      firstCrack: 470,
      drop: 585,
    },
  },
]

// Brew-guide copy is preserved exactly as written by the roastery.
export const STEPS = [
  { n: 1, title: 'Weigh', body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.', at: '0:00', axis: 0 },
  { n: 2, title: 'Grind', body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.', at: '0:20', axis: 0.11 },
  { n: 3, title: 'Bloom', body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.', at: '0:30', axis: 0.28 },
  { n: 4, title: 'Pour', body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.', at: '3:00', axis: 1 },
]

export const REVIEWS = [
  { quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.', name: 'Maya T.', role: 'Subscriber since 2022' },
  { quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.', name: 'Daniel R.', role: 'Home barista' },
  { quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.', name: 'Priya S.', role: 'Gift subscriber' },
]

// Grind and dose recommendations follow from the roast level, not from taste.
export const RECIPE_BY_ROAST = {
  Light: { grind: 'Medium-fine', clicks: '22 clicks', water: '96°C', ratio: '1:16.5', bloom: '40g / 35s' },
  Medium: { grind: 'Medium', clicks: '24 clicks', water: '94°C', ratio: '1:16.5', bloom: '36g / 30s' },
  Dark: { grind: 'Medium-coarse', clicks: '27 clicks', water: '92°C', ratio: '1:17', bloom: '36g / 30s' },
}

export const CREDITS = [
  { what: 'Probat drum roaster', who: 'Matt Biddulph', licence: 'CC BY-SA 2.0', href: 'https://www.flickr.com/photos/51035707449@N01/3331346097' },
  { what: 'Picking line, Colombia', who: 'mckaysavage', licence: 'CC BY 2.0', href: 'https://www.flickr.com/photos/56796376@N00/8808037070' },
  { what: 'Bryggen, Bergen', who: 'Giuseppe Milo', licence: 'CC BY 2.0', href: 'https://www.flickr.com/photos/87690240@N03/20900678860' },
  { what: 'Cooling tray', who: 'Rod Waddington', licence: 'CC BY-SA 2.0', href: 'https://www.flickr.com/photos/64607715@N05/10699349524' },
]
