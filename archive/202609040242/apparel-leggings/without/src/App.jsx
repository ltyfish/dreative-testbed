// Content-only baseline. Every fact and every piece of behaviour the page owes,
// with none of its architecture: no sections, no ids, no nav, no hero, no cards,
// no table, no ordering that means anything.
//
// See BASELINES.md for why this exists.
import { useState } from 'react'

const COLOURWAYS = [
  { id: 'slate', name: 'Slate', price: 88, stock: 'in' },
  { id: 'clay', name: 'Burnt Clay', price: 88, stock: 'in' },
  { id: 'moss', name: 'Deep Moss', price: 88, stock: 'in' },
  { id: 'black', name: 'True Black', price: 84, stock: 'in' },
  { id: 'oat', name: 'Oat', price: 88, stock: 'out' },
  { id: 'plum', name: 'Dried Plum', price: 92, stock: 'out' },
]

// Waist and hip are the garment laid flat and doubled; inseam is the 26 inch length.
const SIZES = [
  { size: 'XXS', waist: 58, hip: 80, inseam: 66 },
  { size: 'XS', waist: 63, hip: 85, inseam: 66 },
  { size: 'S', waist: 68, hip: 90, inseam: 66 },
  { size: 'M', waist: 74, hip: 96, inseam: 66 },
  { size: 'L', waist: 81, hip: 103, inseam: 67 },
  { size: 'XL', waist: 89, hip: 111, inseam: 67 },
  { size: '2XL', waist: 98, hip: 120, inseam: 68 },
  { size: '3XL', waist: 108, hip: 130, inseam: 68 },
]

const INSEAMS = [
  { id: 'short', label: '24 inch, short', offered: 'XXS to XL' },
  { id: 'regular', label: '26 inch, regular', offered: 'XXS to 3XL' },
  { id: 'tall', label: '28 inch, tall', offered: 'S to 3XL' },
]

const FABRIC = [
  '78% recycled nylon, 22% elastane, knitted in a single mill in Portugal.',
  '240gsm, heavier than most leggings sold at this price, which is where the opacity comes from.',
  'Opacity tested at full squat under studio light by nine wearers across the size range. No sheerness recorded at any size.',
  'Four-way stretch, so the fabric recovers across the leg as well as along it.',
  'A single diamond gusset, flatlocked, so there is no seam at the crotch to rub or fail.',
]

const REVIEWS = [
  {
    quote:
      'The waistband is the first one I have owned that stays where I put it through a full session. I stopped thinking about it, which is the whole point.',
    name: 'Renata K.',
    fit: '172cm, usually a M, bought M regular',
  },
  {
    quote:
      'I ordered the tall inseam expecting the usual compromise and it actually reaches my ankle. The fabric is thicker than I expected from the photos.',
    name: 'Junho P.',
    fit: '181cm, usually a L, bought L tall',
  },
  {
    quote:
      'Sized down after the fit finder told me to and it was right. They are firm at first and settle after an hour.',
    name: 'Amara O.',
    fit: '158cm, usually an S, bought XS short',
  },
]

const RETURNS =
  'Sixty days to return anything, return shipping is free, and we accept them worn and washed. If they did not work out we would rather have them back than have you keep them in a drawer.'

// The fit finder. Below 165cm recommends the short inseam, above 176cm the tall
// one. It sizes down one step only when the wearer reports being between sizes.
function recommend(height, usualSize, between) {
  const h = Number(height)
  if (!h || !usualSize) return null
  if (h < 140 || h > 210) return { unsure: true }
  const i = SIZES.findIndex((s) => s.size === usualSize)
  if (i < 0) return { unsure: true }
  const size = between && i > 0 ? SIZES[i - 1].size : usualSize
  const inseam = h < 165 ? INSEAMS[0] : h > 176 ? INSEAMS[2] : INSEAMS[1]
  return { size, inseam }
}

export default function App() {
  const [colourway, setColourway] = useState('')
  const [size, setSize] = useState('')
  const [inseam, setInseam] = useState('')
  const [bag, setBag] = useState(null)
  const [height, setHeight] = useState('')
  const [usualSize, setUsualSize] = useState('')
  const [between, setBetween] = useState(false)

  const chosen = COLOURWAYS.find((c) => c.id === colourway)
  const canAdd = Boolean(chosen && chosen.stock === 'in' && size && inseam)
  const suggestion = recommend(height, usualSize, between)

  function addToBag(e) {
    e.preventDefault()
    if (!canAdd) return
    setBag({
      colourway: chosen.name,
      size,
      inseam: INSEAMS.find((i) => i.id === inseam).label,
      price: chosen.price,
    })
  }

  return (
    <div>
      <p>Halfmoon</p>
      <p>The Contour legging</p>

      {REVIEWS.map((r) => (
        <div key={r.name}>
          <p>{r.quote}</p>
          <p>{r.name}</p>
          <p>{r.fit}</p>
        </div>
      ))}

      <p>{RETURNS}</p>

      {FABRIC.map((f) => (
        <p key={f}>{f}</p>
      ))}

      <form onSubmit={addToBag}>
        {COLOURWAYS.map((c) => (
          <label key={c.id}>
            <input
              type="radio"
              name="colourway"
              value={c.id}
              checked={colourway === c.id}
              disabled={c.stock === 'out'}
              onChange={() => setColourway(c.id)}
            />
            {c.name}, {c.price} dollars
            {c.stock === 'out' ? ', sold out' : ''}
          </label>
        ))}

        {SIZES.map((s) => (
          <label key={s.size}>
            <input
              type="radio"
              name="size"
              value={s.size}
              checked={size === s.size}
              onChange={() => setSize(s.size)}
            />
            {s.size}
          </label>
        ))}

        {INSEAMS.map((i) => (
          <label key={i.id}>
            <input
              type="radio"
              name="inseam"
              value={i.id}
              checked={inseam === i.id}
              onChange={() => setInseam(i.id)}
            />
            {i.label}, offered {i.offered}
          </label>
        ))}

        <button type="submit" disabled={!canAdd}>
          Add to bag
        </button>
      </form>

      {bag && (
        <p>
          In your bag: the Contour legging in {bag.colourway}, size {bag.size}, {bag.inseam},{' '}
          {bag.price} dollars.
        </p>
      )}

      {SIZES.map((s) => (
        <p key={s.size}>
          {s.size}, waist {s.waist}cm, hip {s.hip}cm, inseam {s.inseam}cm
        </p>
      ))}

      <div>
        <label>
          Your height in cm
          <input value={height} onChange={(e) => setHeight(e.target.value)} inputMode="numeric" />
        </label>
        <label>
          The size you usually wear
          <select value={usualSize} onChange={(e) => setUsualSize(e.target.value)}>
            <option value="">choose</option>
            {SIZES.map((s) => (
              <option key={s.size} value={s.size}>
                {s.size}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input type="checkbox" checked={between} onChange={(e) => setBetween(e.target.checked)} />
          I am usually between sizes
        </label>
        {suggestion && suggestion.unsure && (
          <p>We are not confident enough to recommend a size from that. The chart is above.</p>
        )}
        {suggestion && !suggestion.unsure && (
          <p>
            We would send you the {suggestion.size} in the {suggestion.inseam.label}.
          </p>
        )}
      </div>
    </div>
  )
}
