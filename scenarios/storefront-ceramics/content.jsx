// Content-only baseline. Every fact and every piece of behaviour the shop owes,
// with none of its architecture: no sections, no ids, no nav, no hero, no grid,
// no cards, no ordering that means anything.
//
// See BASELINES.md for why this exists.
import { useState } from 'react'

const GLAZES = [
  { id: 'ash', name: 'Ash', note: 'A pale grey-green that breaks to white where the form turns.' },
  { id: 'iron', name: 'Iron Red', note: 'Rust over a dark body, darker where the glaze pools.' },
  { id: 'salt', name: 'Salt White', note: 'An off-white with a faint orange peel from the salt firing.' },
]

// glazes: which of the three this piece is offered in. Not every form takes every glaze.
const PRODUCTS = [
  { id: 'mug-tall', name: 'Tall Mug', price: 34, dims: '95mm tall, 78mm across', capacity: '330ml', glazes: ['ash', 'iron', 'salt'], stock: 'in', dishwasher: true, microwave: true },
  { id: 'mug-low', name: 'Low Mug', price: 32, dims: '72mm tall, 88mm across', capacity: '280ml', glazes: ['ash', 'salt'], stock: 'in', dishwasher: true, microwave: true },
  { id: 'cup-espresso', name: 'Espresso Cup', price: 22, dims: '55mm tall, 60mm across', capacity: '90ml', glazes: ['ash', 'iron', 'salt'], stock: 'in', dishwasher: true, microwave: true },
  { id: 'bowl-deep', name: 'Deep Bowl', price: 48, dims: '90mm tall, 190mm across', capacity: '1.1L', glazes: ['ash', 'iron'], stock: 'in', dishwasher: true, microwave: true },
  { id: 'bowl-shallow', name: 'Shallow Bowl', price: 42, dims: '48mm tall, 220mm across', capacity: '850ml', glazes: ['ash', 'salt'], stock: 'out', dishwasher: true, microwave: true },
  { id: 'plate-side', name: 'Side Plate', price: 30, dims: '18mm tall, 200mm across', capacity: null, glazes: ['ash', 'iron', 'salt'], stock: 'in', dishwasher: true, microwave: true },
  { id: 'plate-dinner', name: 'Dinner Plate', price: 46, dims: '22mm tall, 275mm across', capacity: null, glazes: ['ash', 'salt'], stock: 'in', dishwasher: true, microwave: true },
  { id: 'jug', name: 'Pouring Jug', price: 68, dims: '160mm tall, 110mm across', capacity: '900ml', glazes: ['iron', 'salt'], stock: 'in', dishwasher: false, microwave: false },
  { id: 'vase', name: 'Bottle Vase', price: 94, dims: '280mm tall, 120mm across', capacity: null, glazes: ['ash', 'iron'], stock: 'out', dishwasher: false, microwave: false },
]

const MAKING = [
  'Every piece is thrown on the wheel in the studio by the two of us. Nothing is slip cast and nothing is made anywhere else.',
  'Bisque fired to 1000°C, glazed by hand, then fired again to 1260°C over fourteen hours with a four hour hold.',
  'The glaze is mixed in small batches and each firing takes it differently, so no two pieces match exactly. The photographs are of pieces from the last firing, not of the one you will receive.',
  'When a piece sells out the restock takes about six weeks, because that is one full cycle of throwing, drying, and two firings.',
]

const CARE = [
  'The foot of every piece is left unglazed, which is what a potter does and what marks a soft surface. Lift rather than slide on wood or a painted table.',
  'The jug and the vase are not dishwasher or microwave safe: the iron in the glaze reacts and the wall is too thin to take the thermal shock.',
  'Everything else goes in both. It will not craze, and the glaze does not contain lead.',
]

const NOTES = [
  {
    quote:
      'I bought two tall mugs expecting them to be a bit precious and they have been the only two we use. The handle is the part I did not know I cared about.',
    name: 'Devan M.',
    bought: 'Two Tall Mugs in Ash',
  },
  {
    quote:
      'The jug arrived with a mark on the shoulder where the glaze had run and I nearly sent it back. Six months later that is the reason I pick it up.',
    name: 'Priya S.',
    bought: 'Pouring Jug in Iron Red',
  },
]

const SHIPPING = [
  'Shipping is free over £60 and £5.50 under it, within the UK.',
  'Thirty days to return anything unused, and you pay the return postage.',
  'If it arrives broken we replace it, and we do not ask for the pieces back. Send a photograph.',
]

function glazeName(id) {
  return GLAZES.find((g) => g.id === id).name
}

export default function Content() {
  const [bag, setBag] = useState([])

  function add(product, glazeId) {
    if (product.stock === 'out') return
    setBag((lines) => {
      const at = lines.findIndex((l) => l.id === product.id && l.glaze === glazeId)
      if (at === -1) return [...lines, { id: product.id, name: product.name, glaze: glazeId, price: product.price, qty: 1 }]
      const next = lines.slice()
      next[at] = { ...next[at], qty: next[at].qty + 1 }
      return next
    })
  }

  function remove(index) {
    setBag((lines) => lines.filter((_, i) => i !== index))
  }

  const total = bag.reduce((sum, l) => sum + l.price * l.qty, 0)

  return (
    <div>
      <p>Kilnwork</p>
      <p>A two-person ceramics studio. Nine pieces, thrown and fired here, sold direct.</p>

      {GLAZES.map((g) => (
        <div key={g.id}>
          <p>{g.name}</p>
          <p>{g.note}</p>
        </div>
      ))}

      {PRODUCTS.map((p) => (
        <div key={p.id}>
          <p>{p.name}</p>
          <p>£{p.price}</p>
          <p>{p.dims}</p>
          {p.capacity && <p>{p.capacity}</p>}
          <p>{p.stock === 'out' ? 'Sold out — about six weeks' : 'In stock'}</p>
          <p>
            {p.dishwasher ? 'Dishwasher safe' : 'Not dishwasher safe'}.{' '}
            {p.microwave ? 'Microwave safe' : 'Not microwave safe'}.
          </p>
          {p.glazes.map((gid) => (
            <button key={gid} disabled={p.stock === 'out'} onClick={() => add(p, gid)}>
              Add in {glazeName(gid)}
            </button>
          ))}
        </div>
      ))}

      {MAKING.map((line, i) => (
        <p key={i}>{line}</p>
      ))}

      {CARE.map((line, i) => (
        <p key={i}>{line}</p>
      ))}

      {NOTES.map((n) => (
        <div key={n.name}>
          <p>{n.quote}</p>
          <p>{n.name}</p>
          <p>{n.bought}</p>
        </div>
      ))}

      {SHIPPING.map((line, i) => (
        <p key={i}>{line}</p>
      ))}

      <div>
        <p>Bag</p>
        {bag.length === 0 && <p>Nothing in the bag yet.</p>}
        {bag.map((l, i) => (
          <div key={`${l.id}-${l.glaze}`}>
            <p>
              {l.name} in {glazeName(l.glaze)} — {l.qty} × £{l.price} = £{l.price * l.qty}
            </p>
            <button onClick={() => remove(i)}>Remove</button>
          </div>
        ))}
        {bag.length > 0 && <p>Total £{total}</p>}
      </div>
    </div>
  )
}
