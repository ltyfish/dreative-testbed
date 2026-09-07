// Marlow & Vale. Content constants are the product requirement and are preserved exactly;
// the page around them is authored.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FRAME_COUNT, clamp, drawCover, ease, loadSequence, manifest, mix, span } from './fall.js'
import { useReveal } from './useReveal.js'

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

/* --- authored presentation data. Notation, not photography. ---------------- */

// The colour plates on the cards are indicative dye references, drawn — the shop
// says so on the page. They are the only "image" a garment we cannot photograph gets.
const SWATCH = {
  White: '#efeee9',
  'Pale blue': '#b3c3d2',
  'Faded navy': '#3d4a5c',
  Black: '#17171a',
  Ecru: '#ded3bd',
  'Washed olive': '#6e7256',
  Indigo: '#2f3c57',
  Sand: '#cbb18c',
  Charcoal: '#3a3a3c',
  Oat: '#d8cbb2',
  Stone: '#a9a294',
  Brown: '#6b4a34',
  Rinse: '#26344a',
  'Mid wash': '#64789a',
  Navy: '#22304a',
  'Grey melange': '#8e8e8c',
  Rust: '#9a5230',
  Camel: '#b5854f',
  Khaki: '#8b8259',
}

// The three shop facts, read twice: a figure first, the sentence second.
const FACTS = [
  { figure: '11', label: 'people, one shop', body: ABOUT[0] },
  { figure: '4', label: 'factories, all visited', body: ABOUT[1] },
  { figure: '0', label: 'sales, ever', body: ABOUT[2] },
]

const REGIONS = [
  { where: 'United Kingdom', cost: 'Free over £100, otherwise £4.95', when: '2–3 working days', bar: 0.22, line: SHIPPING[0] },
  { where: 'Europe', cost: '£12, duties included', when: '5–7 working days', bar: 0.5, line: SHIPPING[1] },
  { where: 'Rest of the world', cost: '£22, duties not included', when: '7–14 working days', bar: 1, line: SHIPPING[2] },
]

const LANDING = GARMENTS.find((g) => g.id === 'overshirt')

const money = (n) => `£${n.toFixed(2)}`

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

/* ---------------------------------------------------------------------------
   The signature moment.

   A garment does one thing a photograph cannot show: it falls. So the chapter is
   ten real seconds of a coat being lifted, thrown, and landing on a body, cut to
   80 graded frames and scrubbed by the reader. The same scroll value that picks
   the frame also drives the rectangle the frame is drawn in — a small centred
   plate at the top, full bleed through the throw, and then, on the way out, the
   exact rectangle of the Wool Overshirt's image well in the shop below. The film
   does not cut to the shop; it becomes the first thing you can buy.
--------------------------------------------------------------------------- */

function FallChapter({ wellRef }) {
  const reduced = useReducedMotion()
  const trackRef = useRef(null)
  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const [ready, setReady] = useState(0)
  const framesRef = useRef(null)
  const stateRef = useRef({ p: 0, target: 0, w: 0, h: 0, dpr: 1 })

  // Load the real sequence. Desktop and mobile sets are authored separately.
  useEffect(() => {
    if (reduced) return
    const small = window.matchMedia('(max-width: 780px)').matches
    framesRef.current = loadSequence(manifest(small), (f) => setReady(f))
  }, [reduced])

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    const stage = stageRef.current
    const frames = framesRef.current
    if (!canvas || !stage || !frames) return
    const st = stateRef.current
    const ctx = canvas.getContext('2d')
    const vw = st.w
    const vh = st.h
    const p = st.p

    // --- the one authored value, read three ways -------------------------
    const idx = Math.min(FRAME_COUNT - 1, Math.round(span(p, 0.05, 0.78) * (FRAME_COUNT - 1)))
    const open = ease(span(p, 0.0, 0.26)) // plate -> full bleed
    const out = ease(span(p, 0.75, 0.995)) // full bleed -> the shop card

    // entry plate: a tall lookbook plate, centred
    const ph = vh * 0.58
    const pw = Math.min(ph * (9 / 16), vw * 0.86)
    let x = mix((vw - pw) / 2, 0, open)
    let y = mix((vh - ph) / 2 - vh * 0.02, 0, open)
    let w = mix(pw, vw, open)
    let h = mix(ph, vh, open)

    // exit: hand the frame to the shop's image well, wherever it actually is
    if (out > 0) {
      const well = wellRef.current
      const r = well
        ? well.getBoundingClientRect()
        : { left: vw * 0.1, top: vh * 0.2, width: vw * 0.3, height: vh * 0.6 }
      x = mix(x, r.left, out)
      y = mix(y, r.top, out)
      w = mix(w, r.width, out)
      h = mix(h, r.height, out)
    }

    ctx.clearRect(0, 0, vw, vh)
    // the ink ground belongs to the chapter and leaves with it
    ctx.globalAlpha = 1 - ease(span(p, 0.74, 0.92))
    ctx.fillStyle = '#0b0b0a'
    ctx.fillRect(0, 0, vw, vh)
    ctx.globalAlpha = 1
    drawCover(ctx, frames[idx], x, y, w, h)

    // every cue rides the same value
    stage.style.setProperty('--c1', String(1 - span(p, 0.15, 0.25)))
    stage.style.setProperty('--c2', String(span(p, 0.27, 0.34) * (1 - span(p, 0.45, 0.53))))
    stage.style.setProperty('--c3', String(span(p, 0.55, 0.62) * (1 - span(p, 0.7, 0.76))))
    stage.style.setProperty('--open', String(open))
    stage.style.setProperty('--out', String(out))
    canvas.style.opacity = p > 0.995 ? '0' : '1'
  }, [wellRef])

  useEffect(() => {
    if (reduced) return
    const canvas = canvasRef.current
    let raf = 0
    let running = true

    const resize = () => {
      const st = stateRef.current
      st.dpr = Math.min(2, window.devicePixelRatio || 1)
      st.w = window.innerWidth
      st.h = window.innerHeight
      canvas.width = Math.round(st.w * st.dpr)
      canvas.height = Math.round(st.h * st.dpr)
      canvas.style.width = st.w + 'px'
      canvas.style.height = st.h + 'px'
      canvas.getContext('2d').setTransform(st.dpr, 0, 0, st.dpr, 0, 0)
    }

    const read = () => {
      const track = trackRef.current
      if (!track) return
      const r = track.getBoundingClientRect()
      // The track pins for its own height and then releases; the last viewport of
      // travel is the handoff, during which the shop scrolls up under the frame.
      stateRef.current.target = clamp(-r.top / r.height)
    }

    const tick = () => {
      if (!running) return
      const st = stateRef.current
      read()
      // Smoothing lives here, not on the document: native scroll is untouched.
      st.p += (st.target - st.p) * 0.16
      if (Math.abs(st.target - st.p) < 0.0002) st.p = st.target
      paint()
      raf = requestAnimationFrame(tick)
    }

    resize()
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(tick)
    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [reduced, paint])

  if (reduced) {
    return (
      <section className="chapter chapter--still" aria-labelledby="fall-title">
        <div className="still-plate">
          <img
            src="/media/fall-throw.webp"
            alt="A long overcoat mid-air as it lands across a figure's shoulders, photographed in low lamplight."
          />
        </div>
        <div className="still-words">
          <p className="eyebrow">Marlow &amp; Vale — Leeds</p>
          <h1 id="fall-title" className="display">How it falls</h1>
          <p className="line">A still can show you the colour. It cannot show you the weight.</p>
          <p className="note">Representative film of an overcoat being put on. Not a photograph of this garment.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="chapter" ref={trackRef} aria-labelledby="fall-title">
      <canvas className="chapter-canvas" ref={canvasRef} aria-hidden="true" />
      <div className="chapter-stage" ref={stageRef}>
        <p className="eyebrow cue1">Marlow &amp; Vale — Leeds</p>
        <h1 id="fall-title" className="display cue1">
          How it<span>falls</span>
        </h1>
        <p className="line cue2">
          A still can show you the colour.
          <br />
          It cannot show you the weight.
        </p>
        <p className="line cue3">So we filmed the drop, and gave you the scroll.</p>
        <p className="note note--fixed">
          Representative film of an overcoat being put on. Not a photograph of this garment.
        </p>
        <p className="loading" data-done={ready >= 0.35 ? 'yes' : 'no'} aria-hidden={ready >= 0.35}>
          <span style={{ '--r': ready }} />
          {Math.round(ready * 100)}
        </p>
        <p className="scroll-hint cue1" aria-hidden="true">scroll</p>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- size picker */

function SizeRow({ garment, chosen, onChoose, id }) {
  return (
    <div className="sizes" role="group" aria-label={`Size, ${garment.name}`} id={id}>
      {SIZES.map((s) => {
        const gone = garment.sold.includes(s)
        return (
          <button
            key={s}
            type="button"
            className="size"
            disabled={gone}
            aria-pressed={chosen === s}
            aria-label={gone ? `${s}, sold out` : `Size ${s}`}
            onClick={() => onChoose(s)}
          >
            <span>{s}</span>
            {gone ? <em>sold out</em> : null}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------- the first look
   Where the film lands. The only garment on the route with footage behind it,
   and the reason the chapter exists — so it gets the full-height plate. */

function FirstLook({ wellRef, chosen, choose, add }) {
  const g = LANDING
  const size = chosen[g.id]
  return (
    <section className="look" id="shop" aria-labelledby="look-title">
      <div className="look-plate">
        <div className="card-well" ref={wellRef}>
          <img
            src="/media/fall-still.webp"
            alt="A long overcoat settled on the shoulders of a standing figure, photographed in low lamplight."
          />
        </div>
      </div>


      <div className="look-body" data-reveal>
        <p className="eyebrow eyebrow--ink">
          <span className="tick" aria-hidden="true" />
          The coat in the film
        </p>
        <h2 id="look-title" className="look-name">{g.name}</h2>
        <p className="look-price">£{g.price}</p>
        <p className="look-detail">{g.detail}</p>
        <p className="spec">{g.fabric}</p>
        <ul className="chips">
          {g.colours.map((c) => (
            <li key={c}>
              <i style={{ background: SWATCH[c] }} aria-hidden="true" />
              {c}
            </li>
          ))}
        </ul>
        <SizeRow garment={g} chosen={size} onChoose={(s) => choose(g.id, s)} />
        <button type="button" className="add" disabled={!size} onClick={() => add(g)}>
          {size ? `Add size ${size} — £${g.price}` : 'Choose a size'}
        </button>
        <p className="micro">Nine things below. One price all year.</p>
      </div>
      <aside className="look-aside" data-reveal style={{ '--i': 2 }}>
        <p className="note note--under">
          Representative film of an overcoat being put on, graded by us. Not a photograph of
          this garment.
        </p>
        <a className="jump" href="#grid">
          All nine garments
          <span aria-hidden="true">↓</span>
        </a>
      </aside>

    </section>
  )
}

/* --------------------------------------------------------------------- shop */

function GarmentCard({ g, chosen, choose, add, index }) {
  const size = chosen[g.id]
  return (
    <article className="gcard" data-reveal style={{ '--i': index % 3 }}>
      {/* A garment we cannot photograph gets notation instead of a fake photograph:
          the dye references, at plate scale. */}
      <div className="plate" aria-hidden="true">
        {g.colours.map((c) => (
          <span key={c} style={{ background: SWATCH[c] }} />
        ))}
        <b className="plate-price">£{g.price}</b>
      </div>
      <div className="gcard-body">
        <p className="eyebrow eyebrow--ink">{g.category}</p>
        <h3 className="gcard-name">{g.name}</h3>
        <p className="gcard-detail">{g.detail}</p>
        <p className="spec">{g.fabric}</p>
        <p className="micro">Colours: {g.colours.join(', ')}</p>
        <SizeRow garment={g} chosen={size} onChoose={(s) => choose(g.id, s)} />
        <button type="button" className="add add--sm" disabled={!size} onClick={() => add(g)}>
          {size ? `Add ${size} — £${g.price}` : 'Choose a size'}
        </button>
      </div>
    </article>
  )
}

function Shop({ chosen, choose, add }) {
  const [category, setCategory] = useState('All')
  const shown = category === 'All' ? GARMENTS : GARMENTS.filter((g) => g.category === category)
  return (
    <section className="shop" id="grid" aria-labelledby="grid-title">
      <div className="shop-head" data-reveal>
        <div>
          <h2 id="grid-title" className="h2">Everything we make</h2>
          <p className="micro">
            Colour plates are dye references, drawn. We do not shoot model photography for these.
          </p>
        </div>
        <div className="filter" role="group" aria-label="Filter by category">
          <button
            type="button"
            className="chip"
            aria-pressed={category === 'All'}
            onClick={() => setCategory('All')}
          >
            All <b>{GARMENTS.length}</b>
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className="chip"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c} <b>{GARMENTS.filter((g) => g.category === c).length}</b>
            </button>
          ))}
        </div>
      </div>

      <p className="count" aria-live="polite">
        Showing {shown.length} of {GARMENTS.length} garments
        {category === 'All' ? '' : ` in ${category}`}.
      </p>

      <div className="grid">
        {shown.map((g, i) => (
          <GarmentCard key={g.id} g={g} chosen={chosen} choose={choose} add={add} index={i} />
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- the rail band
   The chapter's logic, developed rather than repeated: the same scroll-driven
   film, but the camera travels sideways and the garments are the ground instead
   of the subject. It carries the three facts about the shop. */

function RailBand({ reduced }) {
  const trackRef = useRef(null)
  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const framesRef = useRef(null)
  const stateRef = useRef({ p: 0, target: 0, w: 0, h: 0 })

  useEffect(() => {
    if (reduced) return
    const small = window.matchMedia('(max-width: 780px)').matches
    const srcs = Array.from(
      { length: 48 },
      (_, i) => `/media/${small ? 'rail-sm' : 'rail'}/r-${String(i + 1).padStart(3, '0')}.webp`,
    )
    // only fetch once the band is within a screen of the viewport
    const track = trackRef.current
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          framesRef.current = loadSequence(srcs, () => {})
          io.disconnect()
        }
      },
      { rootMargin: '150% 0px' },
    )
    if (track) io.observe(track)
    return () => io.disconnect()
  }, [reduced])

  useEffect(() => {
    if (reduced) return
    const canvas = canvasRef.current
    let raf = 0
    let running = true
    const resize = () => {
      const st = stateRef.current
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const r = canvas.getBoundingClientRect()
      st.w = r.width
      st.h = r.height
      canvas.width = Math.round(r.width * dpr)
      canvas.height = Math.round(r.height * dpr)
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const tick = () => {
      if (!running) return
      const st = stateRef.current
      const track = trackRef.current
      if (track) {
        const r = track.getBoundingClientRect()
        st.target = clamp(-r.top / (r.height - window.innerHeight))
      }
      st.p += (st.target - st.p) * 0.14
      const stage = stageRef.current
      if (stage) {
        stage.style.setProperty('--f1', String(span(st.p, 0.04, 0.16)))
        stage.style.setProperty('--f2', String(span(st.p, 0.3, 0.44)))
        stage.style.setProperty('--f3', String(span(st.p, 0.58, 0.72)))
      }
      const frames = framesRef.current
      if (frames && st.w) {
        const ctx = canvas.getContext('2d')
        const i = Math.min(frames.length - 1, Math.round(st.p * (frames.length - 1)))
        ctx.fillStyle = '#0b0b0a'
        ctx.fillRect(0, 0, st.w, st.h)
        drawCover(ctx, frames[i], 0, 0, st.w, st.h)
      }
      raf = requestAnimationFrame(tick)
    }
    resize()
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(tick)
    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [reduced])

  return (
    <section className={`rail${reduced ? ' rail--still' : ''}`} ref={trackRef} aria-labelledby="rail-title">
      <div className="rail-stage" ref={stageRef}>
        <div className="rail-media">
          {reduced ? (
            <img
              src="/media/rail/r-024.webp"
              alt="A rail of knitwear seen close along the shoulders, in a warm shop light."
            />
          ) : (
            <canvas ref={canvasRef} aria-hidden="true" />
          )}
        </div>
        <div className="rail-words">
          <h2 id="rail-title" className="h2 h2--bone" data-reveal>The shop behind it</h2>
          <dl className="facts">
            {FACTS.map((f) => (
              <div className="fact" key={f.figure}>
                <dt>
                  <b>{f.figure}</b>
                  <span>{f.label}</span>
                </dt>
                <dd>{f.body}</dd>
              </div>
            ))}
          </dl>
          <p className="note">
            Representative film of a knitwear rail. Not a photograph of our shop in Leeds.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------- sizing
   The chart is five sizes measured three ways, so it is drawn as five sizes
   measured three ways: pick one and the three measurements are lengths you can
   compare. Every number stays on the page underneath. */

function Sizing() {
  const [pick, setPick] = useState('M')
  const row = SIZE_CHART.find((r) => r.size === pick)
  // one scale for all three, so the lengths are comparable to each other
  const max = 120
  return (
    <section className="sizing" id="sizing" aria-labelledby="sizing-title">
      <div className="sizing-head" data-reveal>
        <h2 id="sizing-title" className="h2">Size, measured on the body</h2>
        <p className="micro">Centimetres, measured on the body — not the garment laid flat.</p>
      </div>

      <div className="sizing-body">
        <div className="ruler" data-reveal>
          <div className="ruler-pick" role="group" aria-label="Show measurements for size">
            {SIZE_CHART.map((r) => (
              <button
                key={r.size}
                type="button"
                className="size size--plain"
                aria-pressed={pick === r.size}
                onClick={() => setPick(r.size)}
              >
                <span>{r.size}</span>
              </button>
            ))}
          </div>
          <ul className="bars" aria-live="polite">
            {['chest', 'waist', 'sleeve'].map((k) => (
              <li key={k}>
                <span className="bar-label">{k}</span>
                <span className="bar-track">
                  <span className="bar-fill" style={{ '--w': `${(row[k] / max) * 100}%` }} />
                </span>
                <span className="bar-num">{row[k]}<i>cm</i></span>
              </li>
            ))}
          </ul>
        </div>

        <div className="chart" data-reveal>
          <ul className="chart-rows">
            <li className="chart-row chart-row--head">
              <span>size</span><span>chest</span><span>waist</span><span>sleeve</span>
            </li>
            {SIZE_CHART.map((r) => (
              <li
                key={r.size}
                className={`chart-row${pick === r.size ? ' is-pick' : ''}`}
                onMouseEnter={() => setPick(r.size)}
              >
                <span>{r.size}</span>
                <span>{r.chest}</span>
                <span>{r.waist}</span>
                <span>{r.sleeve}</span>
              </li>
            ))}
          </ul>
          <p className="advice">
            Between two sizes? Everything except the knitwear is cut with room, so take the
            smaller one.
          </p>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------------- care */

const MARKS = {
  wash: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 9h18v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9Z" />
      <path d="M3 9c2-3 4-4 6-2s4 3 6 1 4-2 6 1" />
    </svg>
  ),
  hand: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 13h18v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-4Z" />
      <path d="M7 13V7a1.6 1.6 0 0 1 3.2 0v4M10.2 11V5.4a1.6 1.6 0 0 1 3.2 0V11M13.4 11V6.6a1.6 1.6 0 0 1 3.2 0V13" />
    </svg>
  ),
  dry: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M4 4l16 16" />
    </svg>
  ),
  repair: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 4 8.5 15.5" />
      <path d="M4.5 20.5 8 17l-1-1-3.5 3.5v1Z" />
      <circle cx="19.5" cy="4.5" r="1.4" />
      <path d="M12 12c-3 1-5 3-5.5 5" />
    </svg>
  ),
}

function Care() {
  const rows = [
    { mark: 'wash', head: '30°C, mostly', body: CARE[0], marks: ['wash', 'hand'] },
    { mark: 'dry', head: 'Never a tumble dryer', body: CARE[1], marks: ['dry'] },
    { mark: 'wash', head: 'The denim will bleed', body: CARE[2], marks: ['wash'] },
    { mark: 'repair', head: 'We repair it, for as long as we trade', body: CARE[3], marks: ['repair'] },
  ]
  return (
    <section className="care" id="care" aria-labelledby="care-title">
      <figure className="care-plate" data-reveal>
        <img
          src="/media/denim.webp"
          alt="Close view of rigid indigo denim twill, the diagonal weave visible."
        />
        <figcaption className="note">
          Representative film of rigid denim twill. Not a photograph of this garment.
        </figcaption>
      </figure>
      <div className="care-body">
        <h2 className="h2 h2--bone" id="care-title" data-reveal>Living with it</h2>
        <ul className="care-list">
          {rows.map((r, i) => (
            <li key={r.head} data-reveal style={{ '--i': i }}>
              <span className="marks">
                {r.marks.map((m) => (
                  <i key={m}>{MARKS[m]}</i>
                ))}
              </span>
              <div>
                <h3>{r.head}</h3>
                <p>{r.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ------------------------------------------------------- shipping & returns */

function Ship() {
  return (
    <section className="ship" id="delivery" aria-labelledby="ship-title">
      <h2 className="h2" id="ship-title" data-reveal>Getting it to you, and back</h2>
      <ul className="regions">
        {REGIONS.map((r, i) => (
          <li key={r.where} data-reveal style={{ '--i': i }}>
            <h3>{r.where}</h3>
            <p className="region-cost">{r.cost}</p>
            <p className="region-when">
              <span className="region-bar" style={{ '--w': `${r.bar * 100}%` }} aria-hidden="true" />
              {r.when}
            </p>
            <p className="sr-only">{r.line}</p>
          </li>
        ))}
      </ul>
      <div className="promises">
        <p data-reveal><b>60 days</b> to return anything unworn with its tags on, and return postage is free in the UK.</p>
        <p data-reveal style={{ '--i': 1 }}><b>Same day</b> — exchanges for a different size ship the day the return is scanned, so you are not waiting twice.</p>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ reviews */

function Reviews() {
  return (
    <section className="reviews" aria-labelledby="reviews-title">
      <h2 className="h2 h2--bone" id="reviews-title" data-reveal>Three people who bought something</h2>
      <ul className="review-list">
        {REVIEWS.map((r, i) => (
          <li key={r.name} data-reveal style={{ '--i': i }}>
            <blockquote>{r.text}</blockquote>
            <p className="review-who">
              <b>{r.name}</b>
              <span>bought {r.bought}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ---------------------------------------------------------------------- bag */

function Bag({ bag, remove, open, setOpen, shown }) {
  const total = bag.reduce((sum, line) => sum + line.price, 0)
  const postage = total === 0 || total >= 100 ? 0 : 4.95
  const drawer = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    const first = drawer.current?.querySelector('button')
    first?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  return (
    <>
      <button
        type="button"
        className={`bag-tab${shown || open ? ' is-on' : ''}`}
        tabIndex={shown || open ? 0 : -1}
        aria-expanded={open}
        aria-controls="bag-drawer"
        onClick={() => setOpen(!open)}
      >
        Bag <b>{bag.length}</b>
      </button>

      <div
        className={`bag${open ? ' is-open' : ''}`}
        id="bag-drawer"
        ref={drawer}
        role="dialog"
        aria-label="Your bag"
        aria-hidden={!open}
      >
        <div className="bag-head">
          <h2>Your bag</h2>
          <button type="button" className="x" onClick={() => setOpen(false)} aria-label="Close bag">
            ✕
          </button>
        </div>

        {bag.length === 0 ? (
          <p className="bag-empty">Your bag is empty.</p>
        ) : (
          <>
            <ul className="bag-lines">
              {bag.map((line, i) => (
                <li key={`${line.id}-${i}`}>
                  <span className="bag-name">{line.name}</span>
                  <span className="bag-size">size {line.size}</span>
                  <span className="bag-price">£{line.price}</span>
                  <button type="button" className="link" onClick={() => remove(i)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="bag-sum">
              <p>
                <span>Subtotal</span>
                <b>{money(total)}</b>
              </p>
              <p>
                <span>Delivery</span>
                <b>{postage === 0 ? 'Free' : money(postage)}</b>
              </p>
              {postage > 0 ? (
                <p className="bag-nudge">
                  {money(100 - total)} more for free delivery.
                  <span className="nudge-track" aria-hidden="true">
                    <span style={{ '--w': `${Math.min(100, (total / 100) * 100)}%` }} />
                  </span>
                </p>
              ) : (
                <p className="bag-nudge">Free delivery on orders over £100.</p>
              )}
              <p className="bag-total">
                <span>Total</span>
                <b>{money(total + postage)}</b>
              </p>
              <button type="button" className="add">Checkout</button>
            </div>
          </>
        )}
      </div>
      <button
        type="button"
        className={`scrim${open ? ' is-open' : ''}`}
        tabIndex={open ? 0 : -1}
        aria-label="Close bag"
        onClick={() => setOpen(false)}
      />
    </>
  )
}

/* --------------------------------------------------------------------- head */

function TopBar({ past, onBag, count }) {
  return (
    <header className={`topbar${past ? ' is-on' : ''}`}>
      <a className="wordmark" href="#top">Marlow &amp; Vale</a>
      <nav className="nav">
        <a href="#grid">Shop</a>
        <a href="#sizing">Size</a>
        <a href="#care">Care</a>
        <a href="#delivery">Delivery</a>
      </nav>
      <button type="button" className="nav-bag" onClick={onBag}>
        Bag <b>{count}</b>
      </button>
    </header>
  )
}

export default function App() {
  const reduced = useReducedMotion()
  const wellRef = useRef(null)
  const [chosen, setChosen] = useState({})
  const [bag, setBag] = useState([])
  const [open, setOpen] = useState(false)
  const [past, setPast] = useState(false)

  useReveal(reduced)

  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > window.innerHeight * (reduced ? 0.6 : 3.4))
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [reduced])

  const choose = (id, size) => setChosen((c) => ({ ...c, [id]: size }))

  const add = (garment) => {
    const size = chosen[garment.id]
    if (!size || garment.sold.includes(size)) return
    setBag((b) => [...b, { id: garment.id, name: garment.name, size, price: garment.price }])
    setOpen(true)
  }

  const remove = (i) => setBag((b) => b.filter((_, j) => j !== i))

  const count = useMemo(() => bag.length, [bag])

  return (
    <>
      <a className="skip" href="#shop">Skip to the shop</a>
      <span id="top" />
      <TopBar past={past} count={count} onBag={() => setOpen(true)} />
      <main>
        <FallChapter wellRef={wellRef} />
        <FirstLook wellRef={wellRef} chosen={chosen} choose={choose} add={add} />
        <Shop chosen={chosen} choose={choose} add={add} />
        <RailBand reduced={reduced} />
        <Sizing />
        <Care />
        <Ship />
        <Reviews />
      </main>
      <footer className="foot">
        <p className="wordmark wordmark--foot">Marlow &amp; Vale</p>
        <p className="micro">
          Eleven people, one shop in Leeds. Never any sales. All film on this page is
          representative stock footage, graded by us — none of it photographs our garments.
        </p>
      </footer>
      <Bag bag={bag} remove={remove} open={open} setOpen={setOpen} shown={past} />
    </>
  )
}
