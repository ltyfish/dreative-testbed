// Content-only baseline. Every fact and every piece of behaviour the shop owes, with none of
// its architecture: no sections, no ids, no nav, no hero, no cards, no grid, no table, and no
// ordering that means anything.
//
// See BASELINES.md for why this exists.
import { useState } from 'react'

const SIZES = ['XS', 'S', 'M', 'L', 'XL']

// A normal clothing shop: nine garments across three categories, sized, some sizes gone.
// `sold` is the sizes that cannot be added to the bag.
const GARMENTS = [
  {
    id: 'oxford',
    name: 'The Oxford Shirt',
    category: 'Shirts',
    price: 78,
    colours: ['White', 'Pale blue', 'Faded navy'],
    fabric: '100% long-staple cotton oxford, 140gsm, woven in Portugal',
    detail: 'Cut straight through the body with a soft collar that stands without fusing.',
    sold: ['XS'],
  },
  {
    id: 'tee',
    name: 'Heavy Cotton Tee',
    category: 'Shirts',
    price: 34,
    colours: ['White', 'Black', 'Ecru', 'Washed olive'],
    fabric: '100% organic cotton, 240gsm, tubular knit',
    detail: 'Heavy enough to hold its shape after a year of washing. It shrinks about 2cm in length on the first wash and then stops.',
    sold: [],
  },
  {
    id: 'chore',
    name: 'Chore Jacket',
    category: 'Outerwear',
    price: 165,
    colours: ['Indigo', 'Sand'],
    fabric: '12oz cotton canvas, unlined',
    detail: 'Three patch pockets, a corozo button front, and a back yoke that lets you reach forward without the shoulders pulling.',
    sold: ['S', 'XL'],
  },
  {
    id: 'overshirt',
    name: 'Wool Overshirt',
    category: 'Outerwear',
    price: 210,
    colours: ['Charcoal', 'Oat'],
    fabric: '80% wool, 20% nylon, brushed',
    detail: 'Warm enough to be the only layer down to about 8°C. Sized to go over a shirt.',
    sold: [],
  },
  {
    id: 'trouser',
    name: 'Pleated Trouser',
    category: 'Trousers',
    price: 120,
    colours: ['Black', 'Stone', 'Brown'],
    fabric: '58% wool, 42% cotton twill',
    detail: 'A single forward pleat, a mid rise, and a leg that tapers slightly from the knee.',
    sold: ['M'],
  },
  {
    id: 'jean',
    name: 'Straight Jean',
    category: 'Trousers',
    price: 98,
    colours: ['Rinse', 'Mid wash', 'Ecru'],
    fabric: '13.5oz rigid cotton denim, selvedge',
    detail: 'Rigid, not stretch. It will feel stiff for two weeks and then fit only you.',
    sold: [],
  },
  {
    id: 'knit',
    name: 'Lambswool Crew',
    category: 'Knitwear',
    price: 135,
    colours: ['Navy', 'Grey melange', 'Rust'],
    fabric: '100% lambswool, spun in Scotland',
    detail: 'Fully fashioned, so the panels are knitted to shape rather than cut out of a sheet of fabric.',
    sold: ['L'],
  },
  {
    id: 'cardigan',
    name: 'Shawl Cardigan',
    category: 'Knitwear',
    price: 155,
    colours: ['Charcoal', 'Camel'],
    fabric: '70% wool, 30% alpaca',
    detail: 'A heavy shawl collar that stays up without a scarf.',
    sold: ['XS', 'S'],
  },
  {
    id: 'shorts',
    name: 'Camp Short',
    category: 'Trousers',
    price: 64,
    colours: ['Khaki', 'Navy'],
    fabric: '8oz washed cotton twill',
    detail: 'A 7 inch inseam and an elasticated back half of the waistband.',
    sold: ['XL'],
  },
]

const CATEGORIES = ['Shirts', 'Outerwear', 'Trousers', 'Knitwear']

// Body measurements in centimetres, not the garment laid flat.
const SIZE_CHART = [
  { size: 'XS', chest: 88, waist: 74, sleeve: 61 },
  { size: 'S', chest: 96, waist: 82, sleeve: 63 },
  { size: 'M', chest: 104, waist: 90, sleeve: 65 },
  { size: 'L', chest: 112, waist: 98, sleeve: 66 },
  { size: 'XL', chest: 120, waist: 107, sleeve: 67 },
]

const CARE = [
  'Everything here is washable at 30°C except the knitwear and the wool overshirt, which are hand wash or wool cycle only.',
  'Nothing we sell should go in a tumble dryer.',
  'The denim is unwashed. Wash it cold and inside out, and expect it to bleed onto light upholstery for the first few wears.',
  'We will repair anything we made, for as long as we are trading. Send it back and we quote before doing the work.',
]

const SHIPPING = [
  'Free delivery on orders over £100, otherwise £4.95. Two to three working days in the UK.',
  'Europe is £12 and five to seven working days, duties included.',
  'Rest of the world is £22 and seven to fourteen working days, duties not included.',
  '60 days to return anything unworn with its tags on, and return postage is free in the UK.',
  'Exchanges for a different size ship the same day the return is scanned, so you are not waiting twice.',
]

const REVIEWS = [
  { name: 'Priya N.', bought: 'The Oxford Shirt, M', text: 'I am 5ft 9in and it is the first shirt in years that has not been too short in the body. The collar does what they say it does.' },
  { name: 'Daniel O.', bought: 'Straight Jean, 32', text: 'Genuinely stiff for the first fortnight, exactly as warned. Now they are the only pair I wear. Sizing ran true for me.' },
  { name: 'Marta K.', bought: 'Lambswool Crew, S', text: 'Softer than I expected for the weight. It pilled a little under the arms in the first month and then settled.' },
]

const ABOUT = [
  'Eleven people, one shop in Leeds, and a website. We make about thirty styles a year and keep the ones that sell for a decade.',
  'Every garment is made in one of four factories we have visited, and each product page names which one.',
  'We do not run sales. The price is the price all year, and it is the same price in the shop as it is here.',
]

export default function App() {
  const [category, setCategory] = useState('All')
  const [chosen, setChosen] = useState({}) // garment id -> size
  const [bag, setBag] = useState([])

  const shown = category === 'All' ? GARMENTS : GARMENTS.filter((g) => g.category === category)
  const total = bag.reduce((sum, line) => sum + line.price, 0)
  const postage = total === 0 || total >= 100 ? 0 : 4.95

  const add = (garment) => {
    const size = chosen[garment.id]
    if (!size || garment.sold.includes(size)) return
    setBag([...bag, { id: garment.id, name: garment.name, size, price: garment.price }])
  }

  return (
    <div>
      <p>Marlow &amp; Vale</p>
      <p>Clothes made in four factories we have been to, sold at one price all year.</p>

      {ABOUT.map((line) => (
        <p key={line}>{line}</p>
      ))}

      <div>
        <button type="button" onClick={() => setCategory('All')}>
          All ({GARMENTS.length})
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" onClick={() => setCategory(c)}>
            {c} ({GARMENTS.filter((g) => g.category === c).length})
          </button>
        ))}
      </div>
      <p>Showing {shown.length} of {GARMENTS.length} garments{category === 'All' ? '' : ` in ${category}`}.</p>

      {shown.map((g) => (
        <div key={g.id}>
          <p>{g.name}</p>
          <p>{g.category}</p>
          <p>&pound;{g.price}</p>
          <p>{g.detail}</p>
          <p>{g.fabric}</p>
          <p>Colours: {g.colours.join(', ')}</p>
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={g.sold.includes(s)}
              onClick={() => setChosen({ ...chosen, [g.id]: s })}
            >
              {s}
              {g.sold.includes(s) ? ' — sold out' : ''}
            </button>
          ))}
          <p>{chosen[g.id] ? `Size ${chosen[g.id]} chosen` : 'No size chosen yet'}</p>
          <button type="button" disabled={!chosen[g.id]} onClick={() => add(g)}>
            Add to bag
          </button>
        </div>
      ))}

      <p>{bag.length ? `${bag.length} item(s) in the bag` : 'Your bag is empty'}</p>
      {bag.map((line, i) => (
        <div key={`${line.id}-${i}`}>
          <p>
            {line.name}, size {line.size} — &pound;{line.price}
          </p>
          <button type="button" onClick={() => setBag(bag.filter((_, j) => j !== i))}>
            Remove
          </button>
        </div>
      ))}
      {bag.length > 0 && (
        <div>
          <p>Subtotal &pound;{total.toFixed(2)}</p>
          <p>{postage === 0 ? 'Delivery free' : `Delivery £${postage.toFixed(2)} — £${(100 - total).toFixed(2)} more for free delivery`}</p>
          <p>Total &pound;{(total + postage).toFixed(2)}</p>
          <button type="button">Checkout</button>
        </div>
      )}

      <p>Size chart, measured on the body in centimetres.</p>
      {SIZE_CHART.map((row) => (
        <p key={row.size}>
          {row.size} — chest {row.chest}, waist {row.waist}, sleeve {row.sleeve}
        </p>
      ))}
      <p>Between two sizes? Everything except the knitwear is cut with room, so take the smaller one.</p>

      {CARE.map((line) => (
        <p key={line}>{line}</p>
      ))}

      {SHIPPING.map((line) => (
        <p key={line}>{line}</p>
      ))}

      {REVIEWS.map((r) => (
        <p key={r.name}>
          {r.text} — {r.name}, bought the {r.bought}
        </p>
      ))}
    </div>
  )
}
