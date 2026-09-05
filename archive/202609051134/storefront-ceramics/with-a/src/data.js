// Content preserved verbatim from the baseline. Prices, dimensions, capacities,
// stock, per-piece glaze availability and every statement are product facts.

export const GLAZES = [
  { id: 'ash', name: 'Ash', note: 'A pale grey-green that breaks to white where the form turns.' },
  { id: 'iron', name: 'Iron Red', note: 'Rust over a dark body, darker where the glaze pools.' },
  { id: 'salt', name: 'Salt White', note: 'An off-white with a faint orange peel from the salt firing.' },
]

export const PRODUCTS = [
  { id: 'mug-tall', name: 'Tall Mug', price: 34, dims: '95mm tall, 78mm across', tall: 95, across: 78, capacity: '330ml', glazes: ['ash', 'iron', 'salt'], stock: 'in', dishwasher: true, microwave: true, img: 'p-mug-tall' },
  { id: 'mug-low', name: 'Low Mug', price: 32, dims: '72mm tall, 88mm across', tall: 72, across: 88, capacity: '280ml', glazes: ['ash', 'salt'], stock: 'in', dishwasher: true, microwave: true, img: 'p-mug-low' },
  { id: 'cup-espresso', name: 'Espresso Cup', price: 22, dims: '55mm tall, 60mm across', tall: 55, across: 60, capacity: '90ml', glazes: ['ash', 'iron', 'salt'], stock: 'in', dishwasher: true, microwave: true, img: 'p-cup-espresso' },
  { id: 'bowl-deep', name: 'Deep Bowl', price: 48, dims: '90mm tall, 190mm across', tall: 90, across: 190, capacity: '1.1L', glazes: ['ash', 'iron'], stock: 'in', dishwasher: true, microwave: true, img: 'p-bowl-deep' },
  { id: 'bowl-shallow', name: 'Shallow Bowl', price: 42, dims: '48mm tall, 220mm across', tall: 48, across: 220, capacity: '850ml', glazes: ['ash', 'salt'], stock: 'out', dishwasher: true, microwave: true, img: 'p-bowl-shallow' },
  { id: 'plate-side', name: 'Side Plate', price: 30, dims: '18mm tall, 200mm across', tall: 18, across: 200, capacity: null, glazes: ['ash', 'iron', 'salt'], stock: 'in', dishwasher: true, microwave: true, img: 'p-plate-side' },
  { id: 'plate-dinner', name: 'Dinner Plate', price: 46, dims: '22mm tall, 275mm across', tall: 22, across: 275, capacity: null, glazes: ['ash', 'salt'], stock: 'in', dishwasher: true, microwave: true, img: 'p-plate-dinner' },
  { id: 'jug', name: 'Pouring Jug', price: 68, dims: '160mm tall, 110mm across', tall: 160, across: 110, capacity: '900ml', glazes: ['iron', 'salt'], stock: 'in', dishwasher: false, microwave: false, img: 'p-jug' },
  { id: 'vase', name: 'Bottle Vase', price: 94, dims: '280mm tall, 120mm across', tall: 280, across: 120, capacity: null, glazes: ['ash', 'iron'], stock: 'out', dishwasher: false, microwave: false, img: 'p-vase' },
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
    img: 'note-mug',
    piece: 'mug-tall',
  },
  {
    quote:
      'The jug arrived with a mark on the shoulder where the glaze had run and I nearly sent it back. Six months later that is the reason I pick it up.',
    name: 'Priya S.',
    bought: 'Pouring Jug in Iron Red',
    img: 'note-jug',
    piece: 'jug',
  },
]

export const SHIPPING = [
  'Shipping is free over £60 and £5.50 under it, within the UK.',
  'Thirty days to return anything unused, and you pay the return postage.',
  'If it arrives broken we replace it, and we do not ask for the pieces back. Send a photograph.',
]

export const glazeName = (id) => GLAZES.find((g) => g.id === id).name
export const productById = (id) => PRODUCTS.find((p) => p.id === id)

// Photograph credits. Every image is a real photograph under a free licence;
// the set was cropped and graded for this page.
export const CREDITS = [
  ['Hero and the kiln shelf', 'Storage Jar, 1400s — museado (CC0)'],
  ['The three fires', 'Bottles at LACMA, photographed by Fæ (CC BY 2.0)'],
  ['The nine pieces', 'Bridgman Pottery, orcmid, BLW Photography, bptakoma, Nicola since 1972, Fæ (CC BY 2.0); Windmemories (CC BY-SA 4.0)'],
  ['The wheel', 'North Carolina Potter — gurdonark (CC BY 2.0)'],
  ['The kiln', 'Anagama fire! — carmichaellibrary (CC BY 2.0)'],
  ['The drying racks', 'Shaping Clay, Shaping Lives — Md shameem ul islam (CC0)'],
  ['The unglazed foot', 'Tamba ware jar, Freer Gallery of Art (CC0)'],
]
