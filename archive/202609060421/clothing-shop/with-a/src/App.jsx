// Marlow & Vale — the shop floor.
//
// Phase one builds one moment: choosing a size and taking the garment. Everything
// else the shop owes (the size chart section, care, shipping, reviews, the three
// shop facts) is still held in the constants below and is not yet on the page.
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import gsap from 'gsap'

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

// --- the measuring language -------------------------------------------------
// The tape runs 0 to 130cm. Every measurement on the page — a chest, a waist, a
// sleeve, the £100 that buys free delivery — is drawn against a rule.
const TAPE_MAX = 130
const RESTING_INDEX = 2 // M, held faintly until the buyer chooses

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// A fractional index into SIZE_CHART, so the tween passes through the real
// measurements between two sizes rather than jumping between them.
function measureAt(i) {
  const lo = Math.max(0, Math.min(SIZE_CHART.length - 1, Math.floor(i)))
  const hi = Math.max(0, Math.min(SIZE_CHART.length - 1, Math.ceil(i)))
  const f = i - lo
  const a = SIZE_CHART[lo]
  const b = SIZE_CHART[hi]
  return {
    chest: a.chest + (b.chest - a.chest) * f,
    waist: a.waist + (b.waist - a.waist) * f,
    sleeve: a.sleeve + (b.sleeve - a.sleeve) * f,
  }
}

function Garment({ garment, chosenSize, onChooseSize, onAdd, onRefuse, eager }) {
  const rootRef = useRef(null)
  const panelRef = useRef(null)
  const driver = useRef({ i: RESTING_INDEX })

  // One authored value per card. It moves the cloth, the rule, and every
  // number on the card; nothing on this card is driven by anything else.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const target = chosenSize ? SIZES.indexOf(chosenSize) : RESTING_INDEX

    const apply = () => {
      const { i } = driver.current
      const m = measureAt(i)
      // A bigger size is more cloth: the panel pulls back as the chest grows.
      root.style.setProperty('--zoom', (SIZE_CHART[4].chest / m.chest).toFixed(4))
      root.style.setProperty('--chest', (m.chest / TAPE_MAX).toFixed(4))
      root.style.setProperty('--waist', (m.waist / TAPE_MAX).toFixed(4))
      root.style.setProperty('--sleeve', (m.sleeve / TAPE_MAX).toFixed(4))
      const w = root.querySelectorAll('[data-read]')
      w.forEach((el) => {
        el.textContent = Math.round(m[el.dataset.read])
      })
    }

    if (reducedMotion()) {
      driver.current.i = target
      apply()
      return
    }
    const tween = gsap.to(driver.current, {
      i: target,
      duration: 0.62,
      ease: 'power3.out',
      onUpdate: apply,
    })
    return () => tween.kill()
  }, [chosenSize])

  const handleSize = (size) => {
    if (garment.sold.includes(size)) {
      onRefuse(garment, size)
      const chip = rootRef.current?.querySelector(`[data-size="${size}"]`)
      if (chip && !reducedMotion()) {
        gsap.fromTo(chip, { x: -4 }, { x: 0, duration: 0.45, ease: 'elastic.out(1, 0.3)' })
      }
      return
    }
    onChooseSize(garment.id, size)
  }

  const chart = chosenSize ? SIZE_CHART[SIZES.indexOf(chosenSize)] : SIZE_CHART[RESTING_INDEX]

  return (
    <article
      className={`garment${chosenSize ? ' is-sized' : ''}`}
      ref={rootRef}
      style={{
        '--zoom': (SIZE_CHART[4].chest / chart.chest).toFixed(4),
        '--chest': (chart.chest / TAPE_MAX).toFixed(4),
        '--waist': (chart.waist / TAPE_MAX).toFixed(4),
        '--sleeve': (chart.sleeve / TAPE_MAX).toFixed(4),
      }}
    >
      <div className="garment__panel" ref={panelRef}>
        <img
          className="garment__cloth"
          src={`/cloth/${garment.id}.webp`}
          srcSet={`/cloth/${garment.id}-sm.webp 520w, /cloth/${garment.id}.webp 1000w`}
          sizes="(max-width: 900px) 120vw, 640px"
          alt={`${garment.fabric}, photographed close.`}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          decoding="async"
        />
        <span className="garment__category">{garment.category}</span>
        <div className="garment__rule" aria-hidden="true">
          <div className="rule__ticks" />
          <div className="rule__span">
            <span className="rule__value">
              <b data-read="chest">{Math.round(chart.chest)}</b>
              <i>cm chest</i>
            </span>
          </div>
        </div>
      </div>

      <div className="garment__body">
        <h3 className="garment__name">{garment.name}</h3>
        <p className="garment__price">&pound;{garment.price}</p>
        <p className="garment__detail">{garment.detail}</p>
        <dl className="garment__spec">
          <dt>Fabric</dt>
          <dd>{garment.fabric}</dd>
          <dt>Colours</dt>
          <dd>{garment.colours.join(' · ')}</dd>
        </dl>

        <fieldset className="sizes">
          <legend>
            Size
            <span className="sizes__state">
              {chosenSize ? `${chosenSize} chosen` : 'none chosen yet'}
            </span>
          </legend>
          <div className="sizes__row">
            {SIZES.map((s) => {
              const gone = garment.sold.includes(s)
              return (
                <button
                  key={s}
                  type="button"
                  data-size={s}
                  className={`chip${gone ? ' is-gone' : ''}${chosenSize === s ? ' is-chosen' : ''}`}
                  aria-pressed={chosenSize === s}
                  aria-disabled={gone || undefined}
                  onClick={() => handleSize(s)}
                >
                  {s}
                  {gone && <span className="chip__note">sold out</span>}
                </button>
              )
            })}
          </div>
          <p className="sizes__read">
            <span>
              chest <b data-read="chest">{Math.round(chart.chest)}</b>
            </span>
            <span>
              waist <b data-read="waist">{Math.round(chart.waist)}</b>
            </span>
            <span>
              sleeve <b data-read="sleeve">{Math.round(chart.sleeve)}</b>
            </span>
            <em>cm, on the body</em>
          </p>
        </fieldset>

        <button
          type="button"
          className="add"
          disabled={!chosenSize}
          onClick={() => onAdd(garment, panelRef.current)}
        >
          {chosenSize ? `Add ${chosenSize} to the bag` : 'Choose a size'}
          <span className="add__price">&pound;{garment.price}</span>
        </button>
      </div>
    </article>
  )
}

export default function App() {
  const [category, setCategory] = useState('All')
  const [chosen, setChosen] = useState({}) // garment id -> size
  const [bag, setBag] = useState([])
  const [refusal, setRefusal] = useState('')

  const bagRef = useRef(null)
  const bagBarRef = useRef(null)
  const railRef = useRef(null)
  const subtotalRef = useRef(null)
  const gapRef = useRef(null)
  const meterRef = useRef(null)
  const counted = useRef({ total: 0 })

  const shown = category === 'All' ? GARMENTS : GARMENTS.filter((g) => g.category === category)
  const total = bag.reduce((sum, line) => sum + line.price, 0)
  const postage = total === 0 || total >= 100 ? 0 : 4.95
  const remaining = Math.max(0, 100 - total)

  const counts = useMemo(() => {
    const c = { All: GARMENTS.length }
    CATEGORIES.forEach((k) => {
      c[k] = GARMENTS.filter((g) => g.category === k).length
    })
    return c
  }, [])

  // The bag is measured on the same rule as the garments: the £100 that buys
  // free delivery is a distance, and the subtotal walks toward it.
  useEffect(() => {
    const write = () => {
      const t = counted.current.total
      if (subtotalRef.current) subtotalRef.current.textContent = t.toFixed(2)
      if (gapRef.current) gapRef.current.textContent = Math.max(0, 100 - t).toFixed(2)
      if (meterRef.current) {
        meterRef.current.style.setProperty('--fill', Math.min(1, t / 100).toFixed(4))
      }
    }
    if (reducedMotion()) {
      counted.current.total = total
      write()
      return
    }
    const tween = gsap.to(counted.current, {
      total,
      duration: 0.7,
      ease: 'power2.out',
      onUpdate: write,
    })
    return () => tween.kill()
  }, [total])

  // Entrance for the rail, and again whenever the filter changes the set. The
  // filter is a real state change, so it gets a real one.
  useEffect(() => {
    const rail = railRef.current
    if (!rail || reducedMotion()) return
    const cards = rail.querySelectorAll('.garment')
    const tween = gsap.fromTo(
      cards,
      { y: 26, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power2.out', stagger: 0.045, overwrite: true },
    )
    return () => tween.kill()
  }, [category])

  const onRefuse = useCallback((garment, size) => {
    setRefusal(`${size} is sold out in the ${garment.name.replace(/^The /, "")}. Sizes that are gone cannot go in the bag.`)
  }, [])

  const onChooseSize = useCallback((id, size) => {
    setRefusal('')
    setChosen((prev) => ({ ...prev, [id]: size }))
  }, [])

  // Taking the garment: a piece of its cloth is cut from the panel and carried
  // to the bag, and lands as that line's swatch.
  const add = useCallback(
    (garment, panelEl) => {
      const size = chosen[garment.id]
      if (!size || garment.sold.includes(size)) return

      const commit = () => setBag((prev) => [...prev, { id: garment.id, name: garment.name, size, price: garment.price }])

      // On a phone the bag sits below the rail, so the cloth is carried to the
      // summary bar that is actually on screen.
      const narrow = window.matchMedia('(max-width: 1080px)').matches
      const target = (narrow ? bagBarRef.current : bagRef.current) || bagRef.current
      if (!panelEl || !target || reducedMotion()) {
        commit()
        return
      }

      const from = panelEl.getBoundingClientRect()
      const to = target.getBoundingClientRect()
      const swatch = document.createElement('div')
      swatch.className = 'swatch-flight'
      swatch.style.backgroundImage = `url(/cloth/${garment.id}-sm.webp)`
      swatch.style.left = `${from.left}px`
      swatch.style.top = `${from.top}px`
      swatch.style.width = `${from.width}px`
      swatch.style.height = `${from.height}px`
      document.body.appendChild(swatch)

      const endW = narrow ? 34 : 56
      const endH = narrow ? 42 : 70
      gsap
        .timeline({
          onComplete: () => {
            swatch.remove()
            commit()
          },
        })
        .to(swatch, {
          left: narrow ? to.left + 14 : to.left + 22,
          top: narrow ? to.top + (to.height - endH) / 2 : to.top + 26,
          width: endW,
          height: endH,
          duration: 0.62,
          ease: 'power3.inOut',
        })
        .to(swatch, { autoAlpha: 0, duration: 0.14 }, '-=0.1')
    },
    [chosen],
  )

  const removeLine = (i) => setBag((prev) => prev.filter((_, j) => j !== i))

  return (
    <div className="shop">
      <header className="masthead">
        <p className="masthead__mark">Marlow &amp; Vale</p>
        <p className="masthead__line">
          Clothes made in four factories we have been to, sold at one price all year.
        </p>
      </header>

      <main>
        <section className="floor" aria-labelledby="floor-title">
          <div className="floor__head">
            <h2 id="floor-title">Nine garments</h2>
            <p className="floor__note">
              Every size is measured on the body, in centimetres. Choose one and the cloth
              opens to it.
            </p>
          </div>

          <div className="floor__grid">
            <div className="floor__main">
              <div className="filter">
                <div className="filter__chips" role="group" aria-label="Filter by category">
                  {['All', ...CATEGORIES].map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`filter__chip${category === c ? ' is-on' : ''}`}
                      aria-pressed={category === c}
                      onClick={() => setCategory(c)}
                    >
                      {c}
                      <span className="filter__count">{counts[c]}</span>
                    </button>
                  ))}
                </div>
                <p className="filter__state" aria-live="polite">
                  Showing {shown.length} of {GARMENTS.length} garments
                  {category === 'All' ? '' : ` in ${category}`}.
                </p>
              </div>

              <div className="rail" ref={railRef}>
                {shown.map((g, i) => (
                  <Garment
                    key={g.id}
                    eager={i < 4}
                    garment={g}
                    chosenSize={chosen[g.id]}
                    onChooseSize={onChooseSize}
                    onAdd={add}
                    onRefuse={onRefuse}
                  />
                ))}
              </div>

              <p className="refusal" role="status">
                {refusal}
              </p>
            </div>

            <aside className="bag" aria-labelledby="bag-title" ref={bagRef}>
              <div className="bag__inner">
                <h2 id="bag-title" className="bag__title">
                  Your bag
                  <span className="bag__count">{bag.length}</span>
                </h2>

                {bag.length === 0 ? (
                  <p className="bag__empty">
                    Your bag is empty. Free delivery starts at &pound;100.
                  </p>
                ) : (
                  <ul className="bag__lines">
                    {bag.map((line, i) => (
                      <li className="line" key={`${line.id}-${i}`}>
                        <span
                          className="line__swatch"
                          style={{ backgroundImage: `url(/cloth/${line.id}-sm.webp)` }}
                          aria-hidden="true"
                        />
                        <span className="line__text">
                          <b>{line.name}</b>
                          <i>Size {line.size}</i>
                        </span>
                        <span className="line__price">&pound;{line.price}</span>
                        <button
                          type="button"
                          className="line__remove"
                          onClick={() => removeLine(i)}
                        >
                          Remove
                          <span className="visually-hidden">
                            {' '}
                            {line.name}, size {line.size}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="bag__meter" ref={meterRef} style={{ '--fill': 0 }}>
                  <div className="bag__meter-track" aria-hidden="true">
                    <div className="bag__meter-fill" />
                    <span className="bag__meter-mark">&pound;100</span>
                  </div>
                  <p className="bag__delivery">
                    {postage === 0
                      ? bag.length === 0
                        ? 'Free over £100, otherwise £4.95.'
                        : 'Delivery free.'
                      : (
                        <>
                          Delivery &pound;4.95 — &pound;<span ref={gapRef}>{remaining.toFixed(2)}</span>{' '}
                          more for free delivery
                        </>
                      )}
                  </p>
                </div>

                <dl className="bag__totals">
                  <div>
                    <dt>Subtotal</dt>
                    <dd>
                      &pound;<span ref={subtotalRef}>{total.toFixed(2)}</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Delivery</dt>
                    <dd>{postage === 0 ? 'Free' : `£${postage.toFixed(2)}`}</dd>
                  </div>
                  <div className="bag__total">
                    <dt>Total</dt>
                    <dd>&pound;{(total + postage).toFixed(2)}</dd>
                  </div>
                </dl>

                <button type="button" className="checkout" disabled={bag.length === 0}>
                  Checkout
                </button>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <div className="bagbar" ref={bagBarRef}>
        <span className="bagbar__count" aria-hidden="true">
          {bag.length}
        </span>
        <span className="bagbar__label">
          {bag.length === 0
            ? 'Bag empty'
            : `${bag.length} ${bag.length === 1 ? 'item' : 'items'}`}
        </span>
        <span className="bagbar__sum">&pound;{total.toFixed(2)}</span>
        <a className="bagbar__go" href="#bag-title">
          {bag.length === 0 ? 'Free over £100' : 'View bag'}
        </a>
      </div>
    </div>
  )
}
