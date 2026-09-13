// Content-only baseline. Every fact and every piece of behaviour the shop owes, with none of
// its architecture: no sections, no ids, no nav, no hero, no cards, no grid, no table, and no
// ordering that means anything.
//
// See BASELINES.md for why this exists.
import { useEffect, useRef, useState } from 'react'

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


// Each garment is presented by its cloth. These plates are drawn to the fabric
// statement above — a representation of the cloth, not a photograph of stock.
const CLOTH = {
  oxford:    { weave: 'Plain basket, 2/2',    note: '140gsm oxford, Portugal' },
  tee:       { weave: 'Tubular jersey',       note: '240gsm organic cotton' },
  chore:     { weave: 'Plain weave, 12oz',    note: 'Unlined cotton canvas' },
  overshirt: { weave: 'Brushed 2/2 twill',    note: '80% wool, 20% nylon' },
  trouser:   { weave: '2/2 twill',            note: '58% wool, 42% cotton' },
  jean:      { weave: '3/1 warp-faced twill', note: '13.5oz selvedge, unwashed' },
  knit:      { weave: 'Fully fashioned knit', note: 'Lambswool, spun in Scotland' },
  cardigan:  { weave: 'Heavy gauge knit',     note: '70% wool, 30% alpaca' },
  shorts:    { weave: 'Fine 2/1 twill',       note: '8oz washed cotton' },
}

const PLATE_W = 900          // one cloth plate in the bolt, in source pixels
const BOLT_H = 1300
const BOLT_W = PLATE_W * GARMENTS.length

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const lerp = (a, b, t) => a + (b - a) * t

// The bolt passes the window, then the window divides into the nine cloths.
// One scroll position drives both: the travel along the bolt, and the split.
function useBoltScene({ sceneRef, stageRef, boardRef, cardRefs, onPassing, reduced }) {
  useEffect(() => {
    if (reduced) {
      // No pinning and no scrub. Every card sits in its own place showing its
      // own cloth, framed the way the moving version leaves it.
      const apply = () => {
        const board = boardRef.current
        if (!board) return
        const boardRect = board.getBoundingClientRect()
        const scale = Math.max((0.66 * boardRect.width) / PLATE_W, boardRect.height / BOLT_H)
        cardRefs.current.forEach((card, i) => {
          if (!card) return
          card.style.transform = 'none'
          const rect = card.getBoundingClientRect()
          const sheet = card.querySelector('.sheet')
          const scaler = card.querySelector('.scaler')
          sheet.style.width = `${BOLT_W * scale}px`
          sheet.style.height = `${BOLT_H * scale}px`
          scaler.style.transform = 'none'
          const ox = i * PLATE_W * scale + (PLATE_W * scale - rect.width) / 2
          const oy = (BOLT_H * scale - rect.height) / 2
          sheet.style.transform = `translate3d(${-ox}px, ${-oy}px, 0)`
          card.style.setProperty('--s', '1')
        })
      }
      apply()
      window.addEventListener('resize', apply)
      return () => window.removeEventListener('resize', apply)
    }

    let frame = 0
    let layout = null
    let lastPassing = -1

    const draw = () => {
      frame = 0
      const scene = sceneRef.current
      const stage = stageRef.current
      if (!scene || !stage || !layout) return
      const rect = scene.getBoundingClientRect()
      const span = scene.offsetHeight - stage.offsetHeight
      const p = clamp01(-rect.top / (span || 1))
      stage.style.setProperty('--p', p.toFixed(4))

      const hold = 0.62                      // how far in the window divides
      const travelled = easeInOut(clamp01(p / 0.94)) * layout.travel
      const split = clamp01((p - hold) / (1 - hold))
      stage.style.setProperty('--split', split.toFixed(4))

      cardRefs.current.forEach((card, i) => {
        if (!card) return
        const nat = layout.cards[i]
        const w0 = layout.window0
        // The panes divide together, so you read one window dividing rather than
        // nine sheets sliding over each other. Each pane holds the cloth that
        // was in the window and only then travels to its own.
        const start = split - i * 0.012
        const s = easeInOut(clamp01(start / 0.88))
        const sc = easeInOut(clamp01((start - 0.26) / 0.74))
        // Frame: from the single window to this card's own place in the grid.
        const x = lerp(w0.x, nat.x, s)
        const y = lerp(w0.y, nat.y, s)
        const w = lerp(w0.w, nat.w, s)
        const h = lerp(w0.h, nat.h, s)
        card.style.transform =
          `translate3d(${x - nat.x}px, ${y - nat.y}px, 0) scale(${w / nat.w}, ${h / nat.h})`
        // The cloth inside is held at its own scale, so nothing about the
        // material stretches while its frame changes shape.
        card.querySelector('.scaler').style.transform = `scale(${nat.w / w}, ${nat.h / h})`
        // Content: from wherever the bolt has run to, to this card's own cloth.
        // While the window divides, the bolt stays put in the page: every pane
        // is a hole opening onto the one cloth, not a copy of the same crop.
        const own = i * layout.plateW + (layout.plateW - w) / 2
        const held = travelled + (x - w0.x)
        const ox = lerp(held, own - (travelled - layout.travel) * 0.10, sc)
        const oy = lerp((layout.boltH - w0.h) / 2 + (y - w0.y), (layout.boltH - h) / 2, sc)
        card.querySelector('.sheet').style.transform = `translate3d(${-ox}px, ${-oy}px, 0)`
        card.style.visibility = s < 0.004 && i > 0 ? 'hidden' : 'visible'
        card.style.setProperty('--s', s.toFixed(3))
      })

      // Which cloth is in the window right now, for the running caption.
      const centre = (travelled + layout.window0.w / 2) / layout.plateW
      const idx = Math.max(0, Math.min(GARMENTS.length - 1, Math.floor(centre)))
      if (idx !== lastPassing) { lastPassing = idx; onPassing(idx) }
    }

    const measure = () => {
      const stage = stageRef.current
      const board = boardRef.current
      if (!stage || !board) return
      // Natural layout first: the cards are a real grid, and the scene flies
      // them in from the single window that the grid's own box describes.
      cardRefs.current.forEach((c) => c && (c.style.transform = 'none'))
      const stageRect = stage.getBoundingClientRect()
      const boardRect = board.getBoundingClientRect()
      const window0 = {
        x: boardRect.x - stageRect.x,
        y: boardRect.y - stageRect.y,
        w: boardRect.width,
        h: boardRect.height,
      }
      const cards = cardRefs.current.map((c) => {
        const r = c.getBoundingClientRect()
        return { x: r.x - stageRect.x, y: r.y - stageRect.y, w: r.width, h: r.height }
      })
      // The bolt is displayed at one scale for the whole scene: the height of
      // the window. Every card is a smaller hole cut in the same sheet.
      // One cloth should nearly fill the window, so it reads as cloth rather
      // than as a row of swatches — but never smaller than the window itself.
      const scale = Math.max((0.66 * window0.w) / PLATE_W, window0.h / BOLT_H)
      layout = {
        window0,
        cards,
        scale,
        boltW: BOLT_W * scale,
        boltH: BOLT_H * scale,
        plateW: PLATE_W * scale,
        travel: BOLT_W * scale - window0.w,
      }
      cardRefs.current.forEach((card) => {
        const sheet = card.querySelector('.sheet')
        sheet.style.width = `${layout.boltW}px`
        sheet.style.height = `${layout.boltH}px`
      })
      draw()
    }

    const onScroll = () => { if (!frame) frame = requestAnimationFrame(draw) }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [reduced])
}

// Things arrive once, on the way in, and then stay put.
function useReveal(reduced) {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'))
    if (reduced) {
      nodes.forEach((n) => n.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  })
}

// The cloth keeps moving after the bolt scene: each plate drifts inside its
// own window as the card crosses the viewport. Same material, same idea.
function usePlateDrift(reduced) {
  useEffect(() => {
    if (reduced) return
    let frame = 0
    const run = () => {
      frame = 0
      const vh = window.innerHeight
      document.querySelectorAll('.plate').forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.bottom < -200 || r.top > vh + 200) return
        const t = (r.top + r.height / 2 - vh / 2) / vh   // -1 .. 1 across the viewport
        el.style.setProperty('--py', `${(-t * 4.2).toFixed(2)}%`)
      })
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(run) }
    run()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [reduced])
}

const PLATE_INDEX = Object.fromEntries(GARMENTS.map((g, i) => [g.id, i]))

function Plate({ id, narrow, className = '' }) {
  return (
    <div className={`plate ${className}`} style={{ '--i': PLATE_INDEX[id] }} aria-hidden="true">
      <img
        className="plate-img"
        src={narrow ? '/cloth/bolt-sm.webp' : '/cloth/bolt.webp'}
        alt=""
        draggable="false"
      />
    </div>
  )
}

export default function App() {
  const [category, setCategory] = useState('All')
  const [chosen, setChosen] = useState({}) // garment id -> size
  const [bag, setBag] = useState([])
  const [bagOpen, setBagOpen] = useState(false)
  const [note, setNote] = useState('')
  const [passing, setPassing] = useState(0)
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 760,
  )

  const sceneRef = useRef(null)
  const stageRef = useRef(null)
  const boardRef = useRef(null)
  const cardRefs = useRef([])
  const bagButtonRef = useRef(null)
  const bagPanelRef = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMq = () => setReduced(mq.matches)
    const onResize = () => setNarrow(window.innerWidth < 760)
    mq.addEventListener('change', onMq)
    window.addEventListener('resize', onResize)
    return () => {
      mq.removeEventListener('change', onMq)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  useBoltScene({ sceneRef, stageRef, boardRef, cardRefs, onPassing: setPassing, reduced })
  useReveal(reduced)
  usePlateDrift(reduced)

  // the top bar only exists once the bolt scene has handed over
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    const onScroll = () => {
      const past = window.scrollY > scene.offsetHeight - window.innerHeight * 0.65
      document.body.classList.toggle('has-bar', past)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // the bag panel: escape closes it, and focus goes in and comes back out
  useEffect(() => {
    if (!bagOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setBagOpen(false) }
    window.addEventListener('keydown', onKey)
    const first = bagPanelRef.current?.querySelector('button')
    first?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      bagButtonRef.current?.focus()
    }
  }, [bagOpen])

  const shown = category === 'All' ? GARMENTS : GARMENTS.filter((g) => g.category === category)
  const total = bag.reduce((sum, line) => sum + line.price, 0)
  const postage = total === 0 || total >= 100 ? 0 : 4.95

  const add = (garment) => {
    const size = chosen[garment.id]
    if (!size || garment.sold.includes(size)) return
    setBag([...bag, { id: garment.id, name: garment.name, size, price: garment.price }])
    setNote(`${garment.name}, size ${size}, added to the bag.`)
  }

  const goTo = (id) => {
    const el = document.getElementById(`g-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
    el.querySelector('.sizes button:not([disabled])')?.focus({ preventScroll: true })
  }

  const inWindow = GARMENTS[passing]

  return (
    <div className={`shop${reduced ? ' is-still' : ''}`}>
      <a className="skip" href="#shop">Skip to the garments</a>

      {/* ------------------------------------------------- the bolt scene */}
      <section className="scene" id="top" ref={sceneRef}>
        <div className="stage" ref={stageRef}>
          <header className="mast">
            <p className="mast-name">Marlow &amp; Vale</p>
            <p className="mast-line">
              Clothes made in four factories we have been to, sold at one price all year.
            </p>
          </header>

          <div className="board" ref={boardRef}>
            {GARMENTS.map((g, i) => (
              <article className="card" key={g.id} ref={(el) => { cardRefs.current[i] = el }}>
                <div className="card-window">
                  <div className="scaler">
                    <img
                      className="sheet"
                      src={narrow ? '/cloth/bolt-sm.webp' : '/cloth/bolt.webp'}
                      alt=""
                      draggable="false"
                    />
                  </div>
                </div>
                <div className="card-face">
                  <p className="card-name">{g.name}</p>
                  <p className="card-meta">
                    <span>{g.category}</span>
                    <span>&pound;{g.price}</span>
                  </p>
                </div>
                <button
                  type="button"
                  className="card-hit"
                  onClick={() => goTo(g.id)}
                >
                  <span className="sr">{g.name}, &pound;{g.price} — go to this garment</span>
                </button>
              </article>
            ))}
          </div>

          <div className="reading">
            <p className="reading-index">{String(passing + 1).padStart(2, '0')}<span>/09</span></p>
            <p className="reading-cloth">{CLOTH[inWindow.id].weave}</p>
            <p className="reading-note">{CLOTH[inWindow.id].note}</p>
          </div>

          <p className="selvedge">
            One bolt, nine cloths. Cloth plates drawn to each fabric statement —
            representations, not photographs of stock.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------- the top bar */}
      <div className="bar">
        <a className="bar-brand" href="#top">Marlow &amp; Vale</a>
        <nav className="bar-nav">
          <a href="#shop">Garments</a>
          <a href="#sizing">Sizing</a>
          <a href="#care">Care</a>
          <a href="#shipping">Shipping</a>
        </nav>
        <button
          type="button"
          className="bar-bag"
          ref={bagButtonRef}
          onClick={() => setBagOpen(true)}
          aria-expanded={bagOpen}
        >
          Bag<span className="bar-count">{bag.length}</span>
        </button>
      </div>

      {/* --------------------------------------------------------- the shop */}
      <main>
        <section className="counter" id="shop">
          <div className="counter-head">
            <h2 className="head-title" data-reveal>
              The nine cloths, <em>made up</em>
            </h2>
            <p className="head-note" data-reveal>
              Every garment below is cut from the cloth that just passed the window.
              Pick a size before it goes in the bag; anything greyed out is gone until
              we cut the next run.
            </p>

            <div className="filter" data-reveal>
              <span className="filter-label" id="filter-label">Category</span>
              <div className="filter-set" role="group" aria-labelledby="filter-label">
                <button
                  type="button"
                  className={`chip${category === 'All' ? ' is-on' : ''}`}
                  aria-pressed={category === 'All'}
                  onClick={() => setCategory('All')}
                >
                  All <i>{GARMENTS.length}</i>
                </button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`chip${category === c ? ' is-on' : ''}`}
                    aria-pressed={category === c}
                    onClick={() => setCategory(c)}
                  >
                    {c} <i>{GARMENTS.filter((g) => g.category === c).length}</i>
                  </button>
                ))}
              </div>
              <p className="filter-count" aria-live="polite">
                Showing {shown.length} of {GARMENTS.length} garments
                {category === 'All' ? '' : ` in ${category}`}.
              </p>
            </div>
          </div>

          <div className="rail">
            {shown.map((g, i) => {
              const size = chosen[g.id]
              return (
                <article
                  className="good"
                  id={`g-${g.id}`}
                  key={g.id}
                  data-reveal
                  style={{ '--d': `${Math.min(i, 5) * 55}ms` }}
                >
                  <div className="good-plate">
                    <Plate id={g.id} narrow={narrow} />
                    <p className="good-weave">{CLOTH[g.id].weave}</p>
                  </div>

                  <div className="good-body">
                    <div className="good-top">
                      <h3 className="good-name">{g.name}</h3>
                      <p className="good-price">&pound;{g.price}</p>
                    </div>
                    <p className="good-cat">{g.category}</p>
                    <p className="good-detail">{g.detail}</p>
                    <dl className="good-spec">
                      <dt>Cloth</dt>
                      <dd>{g.fabric}</dd>
                      <dt>Colours</dt>
                      <dd>{g.colours.join(', ')}</dd>
                    </dl>

                    <div className="sizes" role="group" aria-label={`Size, ${g.name}`}>
                      {SIZES.map((s) => {
                        const gone = g.sold.includes(s)
                        return (
                          <button
                            key={s}
                            type="button"
                            className={`size${size === s ? ' is-on' : ''}${gone ? ' is-gone' : ''}`}
                            disabled={gone}
                            aria-pressed={size === s}
                            onClick={() => setChosen({ ...chosen, [g.id]: s })}
                          >
                            {s}
                            {gone ? <span className="sr"> — sold out</span> : null}
                          </button>
                        )
                      })}
                    </div>

                    <div className="good-buy">
                      <button
                        type="button"
                        className="add"
                        disabled={!size}
                        onClick={() => add(g)}
                      >
                        {size ? `Add ${size} to bag` : 'Choose a size'}
                      </button>
                      <p className="good-state">
                        {size ? `Size ${size} chosen` : 'No size chosen yet'}
                        {g.sold.length ? ` · ${g.sold.join(', ')} sold out` : ''}
                      </p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {/* -------------------------------------------- the printed sheet */}
        <div className="sheetwork">
          <section className="pane" id="sizing">
            <div className="pane-head" data-reveal>
              <p className="pane-kicker">01 — Sizing</p>
              <h2>Measured on the body, in centimetres.</h2>
            </div>
            <div className="pane-body" data-reveal>
              <table className="chart">
                <caption className="sr">Size chart in centimetres</caption>
                <thead>
                  <tr><th scope="col">Size</th><th scope="col">Chest</th><th scope="col">Waist</th><th scope="col">Sleeve</th></tr>
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
              <p className="pane-aside">
                Between two sizes? Everything except the knitwear is cut with room, so take
                the smaller one.
              </p>
            </div>
          </section>

          <section className="pane" id="care">
            <div className="pane-head" data-reveal>
              <p className="pane-kicker">02 — Care</p>
              <h2>What it takes to keep it.</h2>
            </div>
            <div className="pane-body" data-reveal>
              <ol className="facts">
                {CARE.map((line) => <li key={line}>{line}</li>)}
              </ol>
            </div>
          </section>

          <section className="pane" id="shipping">
            <div className="pane-head" data-reveal>
              <p className="pane-kicker">03 — Shipping and returns</p>
              <h2>Where it goes, and how it comes back.</h2>
            </div>
            <div className="pane-body" data-reveal>
              <ol className="facts">
                {SHIPPING.map((line) => <li key={line}>{line}</li>)}
              </ol>
            </div>
          </section>
        </div>

        {/* ------------------------------------------------------ the room */}
        <section className="voices" id="reviews">
          <h2 className="voices-title" data-reveal>Three people who bought something.</h2>
          <div className="voices-set">
            {REVIEWS.map((r, i) => (
              <figure className="voice" key={r.name} data-reveal style={{ '--d': `${i * 90}ms` }}>
                <blockquote><p>{r.text}</p></blockquote>
                <figcaption>
                  <span className="voice-name">{r.name}</span>
                  <span className="voice-bought">bought the {r.bought}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="house" id="about">
          <div className="house-plate" aria-hidden="true">
            <Plate id="chore" narrow={narrow} className="is-wide" />
          </div>
          <div className="house-body">
            <h2 data-reveal>Eleven people, one shop, one price.</h2>
            {ABOUT.map((line, i) => (
              <p key={line} data-reveal style={{ '--d': `${i * 70}ms` }}>{line}</p>
            ))}
          </div>
        </section>
      </main>

      <footer className="foot">
        <p className="foot-brand">Marlow &amp; Vale</p>
        <p className="foot-note">
          One shop in Leeds and a website. Cloth plates on this page are drawn to each
          garment&rsquo;s fabric statement and are representations, not photographs of stock.
        </p>
      </footer>

      {/* ---------------------------------------------------------- the bag */}
      <div className={`bagwrap${bagOpen ? ' is-open' : ''}`}>
        <button
          type="button"
          className="bag-scrim"
          tabIndex={bagOpen ? 0 : -1}
          aria-label="Close the bag"
          onClick={() => setBagOpen(false)}
        />
        <aside
          className="bagpanel"
          ref={bagPanelRef}
          aria-label="Your bag"
          aria-hidden={!bagOpen}
          {...(bagOpen ? {} : { inert: '' })}
        >
          <div className="bag-head">
            <h2>Your bag</h2>
            <button type="button" className="bag-close" onClick={() => setBagOpen(false)}>
              Close
            </button>
          </div>

          {bag.length === 0 ? (
            <p className="bag-empty">Your bag is empty.</p>
          ) : (
            <>
              <ul className="bag-lines">
                {bag.map((line, i) => (
                  <li className="bag-line" key={`${line.id}-${i}`}>
                    <Plate id={line.id} narrow className="is-chip" />
                    <div className="bag-line-body">
                      <p className="bag-line-name">{line.name}</p>
                      <p className="bag-line-meta">Size {line.size} · &pound;{line.price}</p>
                    </div>
                    <button
                      type="button"
                      className="bag-remove"
                      onClick={() => setBag(bag.filter((_, j) => j !== i))}
                    >
                      Remove<span className="sr"> {line.name}, size {line.size}</span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="bag-sums">
                <p><span>Subtotal</span><span>&pound;{total.toFixed(2)}</span></p>
                <p>
                  <span>Delivery</span>
                  <span>{postage === 0 ? 'Free' : `£${postage.toFixed(2)}`}</span>
                </p>
                {postage > 0 ? (
                  <p className="bag-gap">
                    &pound;{(100 - total).toFixed(2)} more for free delivery.
                  </p>
                ) : (
                  <p className="bag-gap">Free delivery on orders over &pound;100.</p>
                )}
                <p className="bag-total">
                  <span>Total</span><span>&pound;{(total + postage).toFixed(2)}</span>
                </p>
              </div>

              <button type="button" className="bag-checkout">Checkout</button>
              <p className="bag-foot">
                60 days to return anything unworn with its tags on, and return postage is
                free in the UK.
              </p>
            </>
          )}
        </aside>
      </div>

      <p className="sr" role="status" aria-live="polite">{note}</p>
    </div>
  )
}
