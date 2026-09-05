// Product truth. Every string here is a preservation requirement and is
// reproduced verbatim from the content baseline.

export const GLAZES = [
  {
    id: 'ash',
    name: 'Ash',
    note: 'A pale grey-green that breaks to white where the form turns.',
    img: '/img/glaze-ash.webp',
    // sampled from the graded exemplar photograph for this glaze
    paper: '#EDEBE2',
    paperDeep: '#DFDED2',
    ink: '#1E211C',
    accent: '#5F7059',
    rule: '#BCBFAF',
  },
  {
    id: 'iron',
    name: 'Iron Red',
    note: 'Rust over a dark body, darker where the glaze pools.',
    img: '/img/glaze-iron.webp',
    paper: '#EFE7DC',
    paperDeep: '#E2D5C4',
    ink: '#241811',
    accent: '#8C4423',
    rule: '#C9B49C',
  },
  {
    id: 'salt',
    name: 'Salt White',
    note: 'An off-white with a faint orange peel from the salt firing.',
    img: '/img/glaze-salt.webp',
    paper: '#F2EFE7',
    paperDeep: '#E6E1D5',
    ink: '#221F1A',
    accent: '#7A6A52',
    rule: '#CBC4B4',
  },
]

// glazes: which of the three this piece is offered in. Not every form takes every glaze.
export const PRODUCTS = [
  { id: 'mug-tall', name: 'Tall Mug', price: 34, dims: '95mm tall, 78mm across', h: 95, w: 78, form: 'mug', capacity: '330ml', glazes: ['ash', 'iron', 'salt'], stock: 'in', dishwasher: true, microwave: true, img: '/img/p-mug-tall.webp' },
  { id: 'mug-low', name: 'Low Mug', price: 32, dims: '72mm tall, 88mm across', h: 72, w: 88, form: 'mug', capacity: '280ml', glazes: ['ash', 'salt'], stock: 'in', dishwasher: true, microwave: true, img: '/img/p-mug-low.webp' },
  { id: 'cup-espresso', name: 'Espresso Cup', price: 22, dims: '55mm tall, 60mm across', h: 55, w: 60, form: 'cup', capacity: '90ml', glazes: ['ash', 'iron', 'salt'], stock: 'in', dishwasher: true, microwave: true, img: '/img/p-cup-espresso.webp' },
  { id: 'bowl-deep', name: 'Deep Bowl', price: 48, dims: '90mm tall, 190mm across', h: 90, w: 190, form: 'bowl', capacity: '1.1L', glazes: ['ash', 'iron'], stock: 'in', dishwasher: true, microwave: true, img: '/img/p-bowl-deep.webp' },
  { id: 'bowl-shallow', name: 'Shallow Bowl', price: 42, dims: '48mm tall, 220mm across', h: 48, w: 220, form: 'bowl', capacity: '850ml', glazes: ['ash', 'salt'], stock: 'out', dishwasher: true, microwave: true, img: '/img/p-bowl-shallow.webp' },
  { id: 'plate-side', name: 'Side Plate', price: 30, dims: '18mm tall, 200mm across', h: 18, w: 200, form: 'plate', capacity: null, glazes: ['ash', 'iron', 'salt'], stock: 'in', dishwasher: true, microwave: true, img: '/img/p-plate-side.webp' },
  { id: 'plate-dinner', name: 'Dinner Plate', price: 46, dims: '22mm tall, 275mm across', h: 22, w: 275, form: 'plate', capacity: null, glazes: ['ash', 'salt'], stock: 'in', dishwasher: true, microwave: true, img: '/img/p-plate-dinner.webp' },
  { id: 'jug', name: 'Pouring Jug', price: 68, dims: '160mm tall, 110mm across', h: 160, w: 110, form: 'jug', capacity: '900ml', glazes: ['iron', 'salt'], stock: 'in', dishwasher: false, microwave: false, img: '/img/p-jug.webp' },
  { id: 'vase', name: 'Bottle Vase', price: 94, dims: '280mm tall, 120mm across', h: 280, w: 120, form: 'vase', capacity: null, glazes: ['ash', 'iron'], stock: 'out', dishwasher: false, microwave: false, img: '/img/p-vase.webp' },
]

export const MAKING = [
  'Every piece is thrown on the wheel in the studio by the two of us. Nothing is slip cast and nothing is made anywhere else.',
  'Bisque fired to 1000°C, glazed by hand, then fired again to 1260°C over fourteen hours with a four hour hold.',
  'The glaze is mixed in small batches and each firing takes it differently, so no two pieces match exactly. The photographs are of pieces from the last firing, not of the one you will receive.',
  'When a piece sells out the restock takes about six weeks, because that is one full cycle of throwing, drying, and two firings.',
]

export const CARE = [
  'The foot of every piece is left unglazed, which is what a potter does and what marks a soft surface. Lift rather than slide on wood or a painted table.',
  'The jug and the vase are not dishwasher or microwave safe: the iron in the glaze reacts and the wall is too thin to take the thermal shock.',
  'Everything else goes in both. It will not craze, and the glaze does not contain lead.',
]

export const NOTES = [
  {
    quote:
      'I bought two tall mugs expecting them to be a bit precious and they have been the only two we use. The handle is the part I did not know I cared about.',
    name: 'Devan M.',
    bought: 'Two Tall Mugs in Ash',
    piece: 'mug-tall',
  },
  {
    quote:
      'The jug arrived with a mark on the shoulder where the glaze had run and I nearly sent it back. Six months later that is the reason I pick it up.',
    name: 'Priya S.',
    bought: 'Pouring Jug in Iron Red',
    piece: 'jug',
  },
]

export const SHIPPING = [
  'Shipping is free over £60 and £5.50 under it, within the UK.',
  'Thirty days to return anything unused, and you pay the return postage.',
  'If it arrives broken we replace it, and we do not ask for the pieces back. Send a photograph.',
]

export function glazeName(id) {
  return GLAZES.find((g) => g.id === id).name
}
export function glaze(id) {
  return GLAZES.find((g) => g.id === id)
}
export function product(id) {
  return PRODUCTS.find((p) => p.id === id)
}
