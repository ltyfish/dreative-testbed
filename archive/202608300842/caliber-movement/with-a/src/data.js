// Product content. Every fact here is a requirement, not a design opinion.

// The power path, in the order energy actually travels. This order is a fact
// about the movement, not a layout decision.
//
// `view` is where that stage sits on public/media/plate.jpg, as a fraction of
// the image: cx/cy is the centre of the region, w is its width. These were read
// off the file by opening it and looking, not guessed — see scripts/build-media.mjs
// for the source photograph.
export const POWER_PATH = [
  {
    id: 'mainspring',
    name: 'Mainspring',
    detail: 'A 380mm hardened alloy ribbon, wound to 6.5 turns.',
    figure: '72 hours of stored energy at full wind',
    short: '72 h',
    view: { cx: 0.515, cy: 0.62, w: 0.2 },
    look: 'The ratchet wheel. The ribbon is coiled in the barrel directly beneath it.',
  },
  {
    id: 'barrel',
    name: 'Barrel and stop-work',
    detail:
      'Releases the spring at a near-constant torque and refuses the last eight per cent, where the rate would drift.',
    figure: 'Torque held within 4% across the run',
    short: '±4 %',
    view: { cx: 0.505, cy: 0.565, w: 0.36 },
    look: 'The barrel bridge, the click, and the wheel that holds the wind.',
  },
  {
    id: 'train',
    name: 'Gear train',
    detail: 'Four wheels step the barrel’s one slow turn up to the escape wheel’s fast one.',
    figure: 'Ratio 1 : 4,608',
    short: '1 : 4,608',
    view: { cx: 0.478, cy: 0.425, w: 0.21 },
    look: 'A train wheel running in a jewelled bearing, set into the frosted plate.',
  },
  {
    id: 'escapement',
    name: 'Escapement',
    detail:
      'A free-sprung lever in silicon releases the train one tooth at a time. This is the ticking.',
    figure: '5 releases per second',
    short: '5 / s',
    view: { cx: 0.345, cy: 0.47, w: 0.19 },
    look: 'Running. Filmed at twenty-four frames a second, so you are seeing about a fifth of it.',
    live: true,
  },
  {
    id: 'balance',
    name: 'Balance wheel',
    detail:
      'A 10.6mm glucydur wheel swinging against a flat hairspring. Its period is what the watch calls a second.',
    figure: '18,000 semi-oscillations per hour',
    short: '18,000 A/h',
    view: { cx: 0.282, cy: 0.447, w: 0.23 },
    look: 'Running. The wheel turns one way, stops, and turns back, five times a second.',
    live: true,
  },
  {
    id: 'hands',
    name: 'Motion work and hands',
    detail: 'The last reduction divides that swing back down into minutes and hours.',
    figure: 'Cumulative deviation −1 to +4 seconds per day',
    short: '−1 / +4 s',
    view: { cx: 0.45, cy: 0.5, w: 0.34 },
    look: 'The centre of the plate. The motion work is on the far side of it, under the dial.',
  },
]

// Physical layers, front of the movement to back. Also a fact, not an order
// chosen for the page. `mm` drives the true-scale section drawing; `view` frames
// the layer on the same photograph the power path uses.
export const LAYERS = [
  {
    id: 'dial-side',
    name: 'Dial-side plate',
    thickness: '0.9mm',
    mm: 0.9,
    note: 'Carries the motion work and the hand posts.',
    view: { cx: 0.45, cy: 0.5, w: 0.4 },
    facing: 'Under the dial, on the far side of this plate.',
  },
  {
    id: 'main',
    name: 'Main plate',
    thickness: '1.4mm',
    mm: 1.4,
    note: 'German silver, frosted by hand. Every pivot is located from this one surface.',
    view: { cx: 0.478, cy: 0.425, w: 0.24 },
    facing: 'The frosted ground everything else is located from.',
  },
  {
    id: 'bridge',
    name: 'Train bridge',
    thickness: '0.8mm',
    mm: 0.8,
    note: 'One continuous bridge over all four train wheels, black-polished on the upper flanks.',
    view: { cx: 0.5, cy: 0.5, w: 0.26 },
    facing: 'The long bridge crossing the wheels.',
  },
  {
    id: 'balance-cock',
    name: 'Balance cock',
    thickness: '0.7mm',
    mm: 0.7,
    note: 'Holds the balance from one side only, so the wheel can be seen turning.',
    view: { cx: 0.282, cy: 0.447, w: 0.21 },
    facing: 'Held at one end, open at the other.',
  },
]

export const CONFIGURATIONS = [
  {
    id: 'frosted',
    name: 'Frosted German silver',
    finish: 'Hand-frosted plates, straight-grained bridges, blued screws.',
    price: 24800,
    lead: 'Delivered from March 2027',
    remaining: 41,
    image: '/media/finish-frosted.jpg',
    alt: 'Macro photograph of a hand-frosted plate with polished steel wheels running on it.',
  },
  {
    id: 'skeleton',
    name: 'Open-worked',
    finish: 'Main plate cut back to the load paths, every remaining edge anglaged by hand.',
    price: 39500,
    lead: 'Delivered from September 2027',
    remaining: 12,
    image: '/media/finish-openworked.jpg',
    alt: 'Macro photograph of open-worked bridges cut back to narrow arms, with ruby jewels set into them.',
  },
  {
    id: 'black',
    name: 'Black-polished steel',
    finish: 'Bridges polished to a true black at every angle, matte plates for contrast.',
    price: 31200,
    lead: 'Delivered from June 2027',
    remaining: 24,
    image: '/media/finish-black.jpg',
    alt: 'Macro photograph of a black-polished steel cock and index over a matte plate.',
  },
]

export const SPECS = [
  ['Reference', 'Caliber 08'],
  ['Diameter', '31.0mm'],
  ['Height', '3.8mm'],
  ['Jewels', '27'],
  ['Frequency', '2.5 Hz (18,000 A/h)'],
  ['Power reserve', '72 hours'],
  ['Regulation', 'Free-sprung, four inertia weights'],
  ['Winding', 'Manual'],
  ['Components', '214'],
  ['Finishing hours', '62 per movement'],
]

// The four figures the specification is read by, before it is read in full.
export const HEADLINE_SPECS = [
  { value: '72', unit: 'hours', note: 'from one wind' },
  { value: '2.5', unit: 'hertz', note: '18,000 A/h' },
  { value: '27', unit: 'jewels', note: 'every pivot but two' },
  { value: '214', unit: 'parts', note: '62 hours of finishing' },
]

export const ATELIER = [
  {
    lead: 'Vallée de Joux',
    text: 'Designed, cut, and finished at the workshop in Vallée de Joux. Nothing is subcontracted except the jewels and the mainspring.',
  },
  {
    lead: '11',
    unit: 'watchmakers',
    text: 'Eleven watchmakers. Two of them do nothing but finishing.',
  },
  {
    lead: '200',
    unit: 'movements',
    text: 'A total of 200 movements will be made, after which the tooling is retired.',
  },
  {
    lead: '21',
    unit: 'days, six positions',
    text: 'Every movement is run for 21 days in six positions before it leaves. The timing record ships with it.',
  },
  {
    lead: '∞',
    unit: 'servicing',
    text: 'Serviceable indefinitely. We keep parts for retired calibers and will not stop.',
  },
]

export const RUN_TOTAL = 200

// Every image and clip on this page, with where it came from and what it is
// licensed under. Rendered in the footer.
export const CREDITS = [
  {
    what: 'The movement: hero, power path, and layer views',
    title: 'Taschenuhrpstest2023.jpg',
    author: 'Fentriss',
    licence: 'CC0 1.0',
    licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    url: 'https://commons.wikimedia.org/wiki/File:Taschenuhrpstest2023.jpg',
  },
  {
    what: 'The escapement running',
    title: 'Stührling Original Imperial Tourbillon — Movement Spinning',
    author: 'Stührling Original',
    licence: 'CC BY-SA 2.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    url: 'https://commons.wikimedia.org/wiki/File:St%C3%BChrling_Original_Imperial_Tourbillon_in_Midnight_Blue_-_Movement_Spinning.webm',
  },
  {
    what: 'Frosted German silver',
    title: 'Longines 4 Grand Prix pocket watch, clockwork visible',
    author: 'Sandstein',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    url: 'https://commons.wikimedia.org/wiki/File:Longines_4_Grand_Prix_pocket_watch_-_clockwork_visible_-_enhanced_resolution_DSF3402-PSMS.jpg',
  },
  {
    what: 'Open-worked',
    title: 'Jaeger-LeCoultre Master Eight Days Perpetual Squelette',
    author: 'Anonimski',
    licence: 'CC BY-SA 3.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    url: 'https://commons.wikimedia.org/wiki/File:Jaeger-LeCoultre_MasterEightDaysPerpetualSquelette.jpg',
  },
  {
    what: 'Black-polished steel',
    title: 'Watch, Movement (48709465341)',
    author: 'Auckland Museum',
    licence: 'CC BY 2.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/2.0/',
    url: 'https://commons.wikimedia.org/wiki/File:Watch,_Movement_(48709465341).jpg',
  },
  {
    what: 'The bench',
    title: 'Roscheiderhof — Uhrmacher',
    author: 'Roscheider Hof, Open Air Museum',
    licence: 'CC0 1.0',
    licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    url: 'https://commons.wikimedia.org/wiki/File:Roscheiderhof-lg1-uhrmacher-2a.jpg',
  },
]

export const chf = (n) => n.toLocaleString('en-CH')
