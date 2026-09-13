// Marlow & Vale.
// The content constants below are the shop's required facts, reproduced exactly as
// supplied. Everything around them is the route: the loom scene, the shop it hands
// itself to, and the sections that lead out of it.
import { useState } from 'react'
import LoomScene from './scene/LoomScene.jsx'
import WeaveGrid from './scene/WeaveGrid.jsx'
import { SiteHeader, Filters, Card, BagDrawer, useReveal } from './shop.jsx'

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
  const [bagOpen, setBagOpen] = useState(false)
  const [justAdded, setJustAdded] = useState(null)

  useReveal()

  const shown = category === 'All' ? GARMENTS : GARMENTS.filter((g) => g.category === category)
  const total = bag.reduce((sum, line) => sum + line.price, 0)
  const postage = total === 0 || total >= 100 ? 0 : 4.95

  const counts = Object.fromEntries(
    CATEGORIES.map((c) => [c, GARMENTS.filter((g) => g.category === c).length]),
  )

  const add = (garment) => {
    const size = chosen[garment.id]
    if (!size || garment.sold.includes(size)) return
    setBag([...bag, { id: garment.id, name: garment.name, size, price: garment.price }])
    setJustAdded(garment.id)
    window.setTimeout(() => setJustAdded((v) => (v === garment.id ? null : v)), 1800)
  }

  return (
    <>
      <a className="skip" href="#shop">Skip to the shop</a>
      <SiteHeader bagCount={bag.length} subtotal={total} onOpenBag={() => setBagOpen(true)} />

      <main id="top">
        <LoomScene />
        <WeaveGrid />

        {/* ------------------------------------------------------------- shop */}
        <section className="shop" id="shop">
          <div className="shop__intro reveal">
            <p className="eyebrow">The whole collection</p>
            <h2 className="display">Nine garments,<em>cut from four cloths</em></h2>
            <p className="lede">
              Every picture here is built from the cloth the garment is made of, thread by
              thread. They are representative images of a fictional collection, not
              photographs of stock.
            </p>
          </div>

          <Filters
            categories={CATEGORIES}
            counts={counts}
            total={GARMENTS.length}
            category={category}
            setCategory={setCategory}
            shown={shown.length}
          />

          <ul className="grid" key={category}>
            {shown.map((g) => (
              <Card
                key={g.id}
                garment={g}
                sizes={SIZES}
                chosen={chosen[g.id]}
                onChoose={(id, s) => setChosen({ ...chosen, [id]: s })}
                onAdd={add}
                justAdded={justAdded === g.id}
              />
            ))}
          </ul>
        </section>

        {/* -------------------------------------------------------- size & fit */}
        <section className="fit" id="fit">
          <div className="fit__head reveal">
            <p className="eyebrow">Size &amp; fit</p>
            <h2 className="display">Measured on the body,<em>in centimetres</em></h2>
            <p className="lede">
              These are body measurements, not the garment laid flat. Take a tape to
              something you already wear if you want to compare.
            </p>
          </div>

          <div className="fit__table reveal">
            <table>
              <caption className="visually-hidden">
                Size chart, measured on the body in centimetres
              </caption>
              <thead>
                <tr>
                  <th scope="col">Size</th>
                  <th scope="col">Chest <i>cm</i></th>
                  <th scope="col">Waist <i>cm</i></th>
                  <th scope="col">Sleeve <i>cm</i></th>
                </tr>
              </thead>
              <tbody>
                {SIZE_CHART.map((row) => (
                  <tr key={row.size}>
                    <th scope="row">{row.size}</th>
                    <td>{row.chest}</td>
                    <td>{row.waist}</td>
                    <td>{row.sleeve}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="fit__advice">
              Between two sizes? Everything except the knitwear is cut with room, so take the
              smaller one.
            </p>
          </div>
        </section>

        {/* -------------------------------------------------------------- care */}
        <section className="care" id="care">
          <div className="care__inner">
            <div className="care__head reveal">
              <p className="eyebrow">Care</p>
              <h2 className="display">Wash it cold,<em>hang it up</em></h2>
            </div>
            <ol className="care__list">
              {CARE.map((line, i) => (
                <li className="care__item reveal" key={line}>
                  <span className="care__n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <p>{line}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------------------------------------------------- delivery */}
        <section className="delivery" id="delivery">
          <div className="delivery__head reveal">
            <p className="eyebrow">Delivery &amp; returns</p>
            <h2 className="display">Where it goes,<em>and how it comes back</em></h2>
          </div>
          <ul className="delivery__list">
            {SHIPPING.map((line) => (
              <li className="delivery__item reveal" key={line}>{line}</li>
            ))}
          </ul>
        </section>

        {/* ----------------------------------------------------------- reviews */}
        <section className="reviews" id="reviews">
          <div className="reviews__head reveal">
            <p className="eyebrow">What people say</p>
            <h2 className="display">Three people,<em>a year in</em></h2>
          </div>
          <ul className="reviews__list">
            {REVIEWS.map((r) => (
              <li className="review reveal" key={r.name}>
                <blockquote>
                  <p>{r.text}</p>
                  <footer>
                    <span className="review__name">{r.name}</span>
                    <span className="review__bought">
                      bought {/The\b/.test(r.bought.slice(0, 3)) ? '' : 'the '}{r.bought}
                    </span>
                  </footer>
                </blockquote>
              </li>
            ))}
          </ul>
        </section>

        {/* ------------------------------------------------------------- about */}
        <section className="about" id="about">
          <div className="about__head reveal">
            <p className="eyebrow">The shop</p>
            <h2 className="display">Eleven people<em>in Leeds</em></h2>
          </div>
          <ul className="about__list">
            {ABOUT.map((line) => (
              <li className="about__item reveal" key={line}>
                <span className="about__rule" aria-hidden="true" />
                <p>{line}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="foot">
        <p className="foot__mark">Marlow &amp; Vale</p>
        <p className="foot__line">
          Clothes made in four factories we have been to, sold at one price all year.
        </p>
        <p className="foot__small">
          A fictional label built as a design exercise. Every garment picture is generated
          from the cloth it describes; it represents the garment and is not a photograph of
          real stock.
        </p>
      </footer>

      <BagDrawer
        open={bagOpen}
        onClose={() => setBagOpen(false)}
        bag={bag}
        remove={(i) => setBag(bag.filter((_, j) => j !== i))}
        total={total}
        postage={postage}
      />
    </>
  )
}
