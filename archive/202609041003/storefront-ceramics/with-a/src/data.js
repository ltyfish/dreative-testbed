// Kilnwork — content. Every fact the shop owes, unchanged from the baseline,
// plus the media the page is built out of and the millimetres the shelf is
// drawn to. Dimensions are parsed from the `dims` string so there is exactly
// one source of truth for a piece's size.
import media from './media.json'

export const GLAZES = [
  { id: 'ash', name: 'Ash', note: 'A pale grey-green that breaks to white where the form turns.', img: 'glaze-ash' },
  { id: 'iron', name: 'Iron Red', note: 'Rust over a dark body, darker where the glaze pools.', img: 'glaze-iron' },
  { id: 'salt', name: 'Salt White', note: 'An off-white with a faint orange peel from the salt firing.', img: 'glaze-salt' },
]

// glazes: which of the three this piece is offered in. Not every form takes every glaze.
const RAW_PRODUCTS = [
  { id: 'mug-tall', name: 'Tall Mug', price: 34, dims: '95mm tall, 78mm across', capacity: '330ml', glazes: ['ash', 'iron', 'salt'], stock: 'in', dishwasher: true, microwave: true, img: 'tall-mug' },
  { id: 'mug-low', name: 'Low Mug', price: 32, dims: '72mm tall, 88mm across', capacity: '280ml', glazes: ['ash', 'salt'], stock: 'in', dishwasher: true, microwave: true, img: 'low-mug' },
  { id: 'cup-espresso', name: 'Espresso Cup', price: 22, dims: '55mm tall, 60mm across', capacity: '90ml', glazes: ['ash', 'iron', 'salt'], stock: 'in', dishwasher: true, microwave: true, img: 'espresso-cup' },
  { id: 'bowl-deep', name: 'Deep Bowl', price: 48, dims: '90mm tall, 190mm across', capacity: '1.1L', glazes: ['ash', 'iron'], stock: 'in', dishwasher: true, microwave: true, img: 'deep-bowl' },
  { id: 'bowl-shallow', name: 'Shallow Bowl', price: 42, dims: '48mm tall, 220mm across', capacity: '850ml', glazes: ['ash', 'salt'], stock: 'out', dishwasher: true, microwave: true, img: 'shallow-bowl' },
  { id: 'plate-side', name: 'Side Plate', price: 30, dims: '18mm tall, 200mm across', capacity: null, glazes: ['ash', 'iron', 'salt'], stock: 'in', dishwasher: true, microwave: true, img: 'side-plate' },
  { id: 'plate-dinner', name: 'Dinner Plate', price: 46, dims: '22mm tall, 275mm across', capacity: null, glazes: ['ash', 'salt'], stock: 'in', dishwasher: true, microwave: true, img: 'dinner-plate' },
  { id: 'jug', name: 'Pouring Jug', price: 68, dims: '160mm tall, 110mm across', capacity: '900ml', glazes: ['iron', 'salt'], stock: 'in', dishwasher: false, microwave: false, img: 'jug' },
  { id: 'vase', name: 'Bottle Vase', price: 94, dims: '280mm tall, 120mm across', capacity: null, glazes: ['ash', 'iron'], stock: 'out', dishwasher: false, microwave: false, img: 'vase' },
]

// The shelf is drawn to one scale. Each piece's largest stated measurement is
// what gets drawn at that scale, and it is the largest dimension of the object
// in its photograph that carries it.
export const PRODUCTS = RAW_PRODUCTS.map((p) => {
  const [, tall, across] = p.dims.match(/(\d+)mm tall, (\d+)mm across/)
  const m = media[p.img]
  const objPxW = m.objW * m.w
  const objPxH = m.objH * m.h
  return {
    ...p,
    mm: { tall: +tall, across: +across },
    maxMm: Math.max(+tall, +across),
    frame: m,
    // frame size, in millimetres, once the object's larger side is drawn to scale
    frameMm: (() => {
      const scale = Math.max(+tall, +across) / Math.max(objPxW, objPxH)
      return { w: m.w * scale, h: m.h * scale }
    })(),
  }
})

export const FIRING = ['fire-5', 'fire-1', 'fire-8', 'fire-3', 'fire-6', 'fire-4', 'fire-7', 'fire-2']

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

// Every photograph on this page, with where it came from and what it is under.
export const CREDITS = [
  {
    group: 'The pieces, the glaze surfaces and the foot',
    line: 'Photographed stoneware from the open collections of the Cleveland Museum of Art (CC0) and The Metropolitan Museum of Art (CC0), and one mug from the Los Angeles County Museum of Art via Wikimedia Commons (public domain). Ash-, iron- and salt-glazed wares standing in for the pieces from our last firing. Cropped and graded here; nothing else altered.',
  },
  {
    group: 'The firing',
    line: 'Eight ash-glazed Shigaraki and Tokoname storage jars, Cleveland Museum of Art open access (CC0). One glaze, eight pots, no two alike.',
  },
]

export function glazeName(id) {
  return GLAZES.find((g) => g.id === id).name
}
