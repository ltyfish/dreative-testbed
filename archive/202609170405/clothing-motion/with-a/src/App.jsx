import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Halftone, { prefersReducedMotion } from './Halftone.jsx'
import { flatMarkup, PALETTES } from './flats'
import { measure, playLift, playRegistration } from './flip'

import cottonCollar from './assets/cotton-collar.jpg'
import clothFolded from './assets/cloth-folded.jpg'
import teeFolded from './assets/tee-folded.jpg'
import hungCotton from './assets/hung-cotton.jpg'

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
    detail:
      'Heavy enough to hold its shape after a year of washing. It shrinks about 2cm in length on the first wash and then stops.',
    sold: [],
  },
  {
    id: 'chore',
    name: 'Chore Jacket',
    category: 'Outerwear',
    price: 165,
    colours: ['Indigo', 'Sand'],
    fabric: '12oz cotton canvas, unlined',
    detail:
      'Three patch pockets, a corozo button front, and a back yoke that lets you reach forward without the shoulders pulling.',
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
    detail:
      'Fully fashioned, so the panels are knitted to shape rather than cut out of a sheet of fabric.',
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
  {
    name: 'Priya N.',
    bought: 'The Oxford Shirt, M',
    text: 'I am 5ft 9in and it is the first shirt in years that has not been too short in the body. The collar does what they say it does.',
  },
  {
    name: 'Daniel O.',
    bought: 'Straight Jean, 32',
    text: 'Genuinely stiff for the first fortnight, exactly as warned. Now they are the only pair I wear. Sizing ran true for me.',
  },
  {
    name: 'Marta K.',
    bought: 'Lambswool Crew, S',
    text: 'Softer than I expected for the weight. It pilled a little under the arms in the first month and then settled.',
  },
]

const ABOUT = [
  'Eleven people, one shop in Leeds, and a website. We make about thirty styles a year and keep the ones that sell for a decade.',
  'Every garment is made in one of four factories we have visited, and each product page names which one.',
  'We do not run sales. The price is the price all year, and it is the same price in the shop as it is here.',
]

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']
const money = (n) => '£' + n.toFixed(2)

/* ------------------------------------------------------------------ plates */

function Flat({ id, palette = PALETTES.paper, className = '' }) {
  return (
    <svg
      className={'flat ' + className}
      viewBox="0 0 200 300"
      role="img"
      aria-label={GARMENTS.find((g) => g.id === id)?.name ?? ''}
      dangerouslySetInnerHTML={{ __html: flatMarkup(id, palette) }}
    />
  )
}

function SizeSelector({ garment, chosen, onChoose, idPrefix }) {
  return (
    <div className="szrow" role="group" aria-label={'Size — ' + garment.name}>
      {SIZES.map((s) => {
        const out = garment.sold.includes(s)
        return (
          <button
            key={s}
            type="button"
            id={`${idPrefix}-${garment.id}-${s}`}
            className={'sz' + (out ? ' out' : '') + (chosen === s ? ' on' : '')}
            disabled={out}
            aria-pressed={chosen === s}
            onClick={() => onChoose(garment.id, s)}
          >
            {s}
            <span className="vh">{out ? ' — sold out' : ''}</span>
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------- page */

export default function App() {
  const [category, setCategory] = useState('All')
  const [chosen, setChosen] = useState({}) // garment id -> size
  const [bag, setBag] = useState([])
  const [openId, setOpenId] = useState('oxford')
  const [note, setNote] = useState('')

  const shown = category === 'All' ? GARMENTS : GARMENTS.filter((g) => g.category === category)
  const total = bag.reduce((sum, line) => sum + line.price, 0)
  const postage = total === 0 || total >= 100 ? 0 : 4.95
  const opened = GARMENTS.find((g) => g.id === openId) ?? GARMENTS[0]

  const plateRefs = useRef(new Map())
  const beforeRects = useRef(null)
  const liftFrom = useRef(null)
  const openedRef = useRef(null)
  const bagRef = useRef(null)

  const setPlateRef = useCallback((id, node) => {
    if (node) plateRefs.current.set(id, node)
    else plateRefs.current.delete(id)
  }, [])

  /* -- registration: measure before the filter changes, play after it lands -- */

  const changeCategory = (next) => {
    if (next === category) return
    beforeRects.current = prefersReducedMotion() ? null : measure(plateRefs.current)
    setCategory(next)
  }

  useLayoutEffect(() => {
    const before = beforeRects.current
    beforeRects.current = null
    if (before) playRegistration(before, plateRefs.current)
  }, [category])

  /* -------- lift: the enlarged plate arrives from the cell it came from ------ */

  const openPlate = (id) => {
    // Measure the drawing in the sheet cell, not the cell's paper ground: the
    // enlarged plate should grow out of the small plate, and the two grounds
    // are different shapes.
    const source = plateRefs.current.get(id)?.querySelector('.flat')
    liftFrom.current = !prefersReducedMotion() && source ? source.getBoundingClientRect() : null
    setOpenId(id)
  }

  useLayoutEffect(() => {
    const from = liftFrom.current
    liftFrom.current = null
    if (from) playLift(openedRef.current, from)
  }, [openId])

  /* --------------------------------- bag ----------------------------------- */

  const add = (garment) => {
    const size = chosen[garment.id]
    if (!size || garment.sold.includes(size)) return
    setBag((b) => [...b, { id: garment.id, name: garment.name, size, price: garment.price }])
    setNote(`${garment.name}, size ${size}, added to the bag.`)
  }

  const choose = (id, size) => setChosen((c) => ({ ...c, [id]: size }))

  const remove = (index) => {
    setBag((b) => {
      const line = b[index]
      if (line) setNote(`${line.name}, size ${line.size}, removed from the bag.`)
      return b.filter((_, j) => j !== index)
    })
  }

  const goToBag = () => bagRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })

  const counts = useMemo(
    () => Object.fromEntries(CATEGORIES.map((c) => [c, GARMENTS.filter((g) => g.category === c).length])),
    [],
  )

  // Keep the opened plate inside the current filter, so the enlargement never
  // shows a garment the sheet is not showing.
  useEffect(() => {
    if (!shown.some((g) => g.id === openId)) setOpenId(shown[0]?.id ?? 'oxford')
  }, [category]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page">
      <a className="skip" href="#sheet">
        Skip to the nine plates
      </a>

      <header className="head">
        <div>
          <p className="m">Catalogue eleven — Leeds — no sales, ever</p>
          <h1>Marlow &amp; Vale</h1>
        </div>
        <button type="button" className="m bagbtn" onClick={goToBag}>
          Bag ({bag.length}) — {money(total)}
        </button>
      </header>
      <hr className="rule2" />

      <p className="vh" role="status" aria-live="polite">
        {note}
      </p>

      {/* ---------------------------------------------------- frontispiece */}
      <section className="front">
        <div>
          <h2>
            Nine styles,
            <br />
            printed as <em>nine plates</em>,<br />
            photographed once.
          </h2>
          <p className="lede">Clothes made in four factories we have been to, sold at one price all year.</p>

          <p className="m idxhead">Index of plates</p>
          <table className="index">
            <tbody>
              {GARMENTS.map((g, i) => (
                <tr key={g.id}>
                  <td className="n">{ROMAN[i]}</td>
                  <td>
                    <button
                      type="button"
                      className="idxlink"
                      onClick={() => {
                        if (category !== 'All' && g.category !== category) changeCategory('All')
                        document.getElementById('plate-' + g.id)?.scrollIntoView({
                          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
                          block: 'center',
                        })
                      }}
                    >
                      {g.name}
                    </button>
                  </td>
                  <td className="c">{g.category}</td>
                  <td className="p">£{g.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <figure className="frontfig">
          <Halftone src={cottonCollar} alt="Cotton shirting, printed as halftone" lead={0.75} />
          <figcaption>
            <span className="m">Frontispiece — cotton, hung</span>
            <span className="m r">Representative image · not stock</span>
          </figcaption>
        </figure>
      </section>

      {/* ----------------------------------------------------- the device */}
      <section className="resolve">
        <hr />
        <p className="m">The device — every image prints as you reach it</p>
        <h2>Coarse dots first, then the photograph, in the time it takes the plate to cross the fold.</h2>
        <div className="three">
          {[
            { src: clothFolded, lead: 1.6, alt: 'Folded cloth, printed as halftone', caption: 'Cloth, folded' },
            { src: teeFolded, lead: 1.15, alt: 'Folded cotton, printed as halftone', caption: 'Cotton, folded' },
            { src: hungCotton, lead: 0.8, alt: 'Cotton on a hanger, printed as halftone', caption: 'Cotton, hung' },
          ].map((f) => (
            <Halftone key={f.src} src={f.src} alt={f.alt} lead={f.lead} caption={f.caption} />
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- the sheet */}
      <section className="sheet" id="sheet">
        <p className="m">The sheet — nine plates, filtered in place</p>

        <div className="reg">
          <div className="regfilters" role="group" aria-label="Filter by category">
          <button
            type="button"
            className={'f' + (category === 'All' ? ' on' : '')}
            aria-pressed={category === 'All'}
            onClick={() => changeCategory('All')}
          >
            All ({GARMENTS.length})
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={'f' + (category === c ? ' on' : '')}
              aria-pressed={category === c}
              onClick={() => changeCategory(c)}
            >
              {c} ({counts[c]})
            </button>
          ))}
          </div>
          <span className="m showing" aria-live="polite">
            Showing {shown.length} of {GARMENTS.length} garments
            {category === 'All' ? '' : ` in ${category}`}.
          </span>
        </div>

        <div className="sheetgrid">
          {shown.map((g) => {
            const i = GARMENTS.indexOf(g)
            const size = chosen[g.id]
            const ready = Boolean(size) && !g.sold.includes(size)
            return (
              <article className="pl" key={g.id} id={'plate-' + g.id} ref={(n) => setPlateRef(g.id, n)}>
                <button
                  type="button"
                  className="img"
                  onClick={() => openPlate(g.id)}
                  aria-label={`Enlarge plate ${ROMAN[i]} — ${g.name}`}
                >
                  <Flat id={g.id} />
                  <span className="no">Plate {ROMAN[i]}</span>
                  <span className="m lift">Enlarge</span>
                </button>

                <h3>{g.name}</h3>
                <p className="cat">
                  {g.category} · £{g.price}
                </p>
                <p className="det">{g.detail}</p>
                <p className="fab">{g.fabric}</p>
                <p className="fab">Colours: {g.colours.join(', ')}</p>

                <SizeSelector garment={g} chosen={size} onChoose={choose} idPrefix="sheet" />
                <p className="m chose">{size ? `Size ${size} chosen` : 'No size chosen yet'}</p>

                <button type="button" className={'addbtn' + (ready ? ' go' : '')} disabled={!ready} onClick={() => add(g)}>
                  {ready ? `Add size ${size} — £${g.price}` : 'Select a size'}
                </button>
              </article>
            )
          })}
        </div>

        {/* --------------------------------------- opened plate and the bag */}
        <div className="open" id="bag" ref={bagRef}>
          <div className="openimg">
            <div className="openinner" ref={openedRef}>
              <Flat id={opened.id} className="big" />
            </div>
            <span className="m cap">
              Plate {ROMAN[GARMENTS.indexOf(opened)]} enlarged — {opened.name}, {opened.fabric}
            </span>
            <div className="openbuy">
              <SizeSelector garment={opened} chosen={chosen[opened.id]} onChoose={choose} idPrefix="open" />
              <button
                type="button"
                className={
                  'addbtn' + (chosen[opened.id] && !opened.sold.includes(chosen[opened.id]) ? ' go' : '')
                }
                disabled={!chosen[opened.id] || opened.sold.includes(chosen[opened.id])}
                onClick={() => add(opened)}
              >
                {chosen[opened.id] && !opened.sold.includes(chosen[opened.id])
                  ? `Add size ${chosen[opened.id]} — £${opened.price}`
                  : 'Select a size'}
              </button>
            </div>
          </div>

          <div className="bagp">
            <p className="m">
              Bag — {bag.length === 0 ? 'empty' : bag.length === 1 ? 'one line' : `${bag.length} lines`}
            </p>

            {bag.length === 0 ? (
              <p className="bagempty">
                Your bag is empty. Choose a size on a plate, then add it.
              </p>
            ) : (
              <>
                <ul className="baglines">
                  {bag.map((line, i) => (
                    <li className="bagline" key={`${line.id}-${i}`}>
                      <span>
                        {line.name} — size {line.size}
                      </span>
                      <span className="right">
                        £{line.price}
                        <button type="button" className="m rm" onClick={() => remove(i)}>
                          Remove
                          <span className="vh">
                            {' '}
                            {line.name}, size {line.size}
                          </span>
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="tot">
                  <span>Subtotal</span>
                  <span>{money(total)}</span>
                </div>
                <div className="prog">
                  <i style={{ width: Math.min(100, (total / 100) * 100) + '%' }} />
                </div>
                <p className={'m ' + (postage === 0 ? 'r' : '')}>
                  {postage === 0
                    ? 'Delivery free — subtotal is over £100'
                    : `Delivery ${money(postage)} — ${money(100 - total)} more for free delivery`}
                </p>
                <div className="bagline plain">
                  <span className="m">Total</span>
                  <span className="m">{money(total + postage)}</span>
                </div>
                <button type="button" className="co">
                  Checkout
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- spec sheet */}
      <section className="spec">
        <div className="specimg">
          {/* annotations hang off the drawing itself, not the panel, so they
              stay on the right part of the garment at any panel height */}
          <div className="specdraw">
            <Flat id="oxford" className="spec" />
            <span className="ann chest">chest 104</span>
            <span className="ann waist">waist 90</span>
            <span className="ann sleeve">sleeve 65</span>
          </div>
          <span className="m base">Measured on the body</span>
        </div>
        <div>
          <p className="m">Sizing — centimetres</p>
          <h2 className="mid">The size chart</h2>
          <table className="chart">
            <thead>
              <tr>
                <th>Size</th>
                <th>Chest</th>
                <th>Waist</th>
                <th>Sleeve</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_CHART.map((r) => (
                <tr key={r.size}>
                  <td>{r.size}</td>
                  <td>{r.chest} cm</td>
                  <td>{r.waist} cm</td>
                  <td>{r.sleeve} cm</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="advice">
            Between two sizes? Everything except the knitwear is cut with room, so take the smaller one.
          </p>
        </div>
      </section>

      {/* -------------------------------------------------------- care notes */}
      <section className="margin">
        <p className="m marginhead">Care &amp; repair</p>
        {CARE.map((c, i) => (
          <div className="carerow" key={c}>
            <p className="m">[{i + 1}]</p>
            <p className="carefact">{c}</p>
          </div>
        ))}
      </section>

      {/* -------------------------------------------------------- shipping */}
      <section className="shiprow">
        <div>
          <p className="m">Shipping &amp; returns</p>
          <h2 className="mid">
            Three regions.
            <br />
            Sixty days.
          </h2>
        </div>
        <ul>
          {SHIPPING.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      {/* --------------------------------------------------------- reviews */}
      <section className="quotes">
        {REVIEWS.map((r) => (
          <div key={r.name}>
            <q>{r.text}</q>
            <cite className="m">
              {r.name} — bought {r.bought}
            </cite>
          </div>
        ))}
      </section>

      {/* -------------------------------------------------------- colophon */}
      <section className="colophon">
        {ABOUT.map((a, i) => (
          <div key={a}>
            <p className="m">Colophon {i + 1}</p>
            <p>{a}</p>
          </div>
        ))}
      </section>

      <p className="foot">
        Plates are drawn technical illustrations of each style. Photographic images are representative of
        cloth and making, not photographs of this inventory.
      </p>
    </div>
  )
}
