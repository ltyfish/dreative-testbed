import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ABOUT,
  ABOUT_NUMERALS,
  BETWEEN_SIZES,
  BOLT_RUNS,
  CARE,
  CATEGORIES,
  GARMENTS,
  REVIEWS,
  SHIPPING,
  SIZE_CHART,
  SIZES,
} from './data'
import { SIL, SIL_EXTRA } from './silhouettes'
import {
  useCoarsePointer,
  useFlip,
  useNarrow,
  useReducedMotion,
  useRevealed,
  useScrollDriver,
} from './motion'

const money = (n) => `£${n.toFixed(2)}`
const byId = Object.fromEntries(GARMENTS.map((g) => [g.id, g]))

/* ---------------------------------------------------------------- the cut --
   A garment is a hole in the cloth. The dark plane is knocked through by the
   garment path, so what you see inside the shape is that garment's own fabric. */

function Cut({ id, ground = '#0B0B0C', stroke = 'rgba(237,234,228,.34)', knockout = true, reveal = 1, fill }) {
  const maskId = `cut-${id}-${knockout ? 'k' : 'o'}`
  return (
    <svg className="cut" viewBox="0 0 200 270" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {knockout && (
        <>
          <defs>
            <mask id={maskId}>
              <rect width="200" height="270" fill="#fff" />
              <path d={SIL[id]} fill="#000" />
            </mask>
          </defs>
          <rect width="200" height="270" fill={ground} mask={`url(#${maskId})`} />
        </>
      )}
      <g style={{ opacity: reveal }}>
        <path d={SIL[id]} fill={fill ?? (knockout ? 'none' : 'rgba(11,11,12,.5)')} stroke={stroke} strokeWidth="0.85" />
        {SIL_EXTRA[id] && (
          <path d={SIL_EXTRA[id]} fill="none" stroke={stroke} strokeWidth="0.55" opacity=".78" />
        )}
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------------- nav -- */

function Nav({ bagCount, onBag }) {
  return (
    <nav className="nav">
      <a className="wordmark" href="#top">
        Marlow &amp; Vale
      </a>
      <ul className="mono">
        <li>
          <a href="#shop">Shop</a>
        </li>
        <li>
          <a href="#sizing">Sizing</a>
        </li>
        <li>
          <a href="#care">Care</a>
        </li>
        <li>
          <a href="#leeds">Leeds</a>
        </li>
        <li>
          <button type="button" className="navbag" onClick={onBag}>
            Bag ({bagCount})
          </button>
        </li>
      </ul>
    </nav>
  )
}

/* ------------------------------------------------------------------ hero --
   The bolt starts here: full-bleed cloth, drifting slowly, with the first
   garment scored into it. */

function Hero({ reduced }) {
  const ref = useRef(null)
  const clothRef = useRef(null)
  const midRef = useRef(null)

  useScrollDriver(
    ref,
    (p) => {
      const cloth = clothRef.current
      const mid = midRef.current
      if (!cloth || !mid) return
      cloth.style.transform = `translate3d(0, ${(p * 150 - 40).toFixed(1)}px, 0)`
      mid.style.transform = `translate3d(0, ${(p * -70).toFixed(1)}px, 0)`
      mid.style.opacity = String(Math.max(0, 1 - Math.max(0, p - 0.55) * 2.6))
    },
    !reduced,
  )

  return (
    <header className="hero" id="top" ref={ref}>
      <div className="hero-cloth" ref={clothRef} />
      <div className="hero-vignette" />
      <div className="hero-cut">
        <Cut id="chore" knockout={false} fill="none" stroke="rgba(237,234,228,.42)" />
      </div>
      <div className="hero-mid" ref={midRef}>
        <h1 className="display">
          CUT FROM
          <br />
          <em>one cloth</em>
        </h1>
        <p className="hero-sub">
          Clothes made in four factories we have been to, sold at one price all year.
        </p>
        <a className="hero-cta mono" href="#shop">
          Shop the nine garments
        </a>
      </div>
      <p className="hero-hint mono">{reduced ? 'Nine garments, one bolt' : 'Scroll — the bolt unrolls'}</p>
      <div className="hero-strip mono">
        <span>Marlow &amp; Vale · Leeds</span>
        <span>Nine garments</span>
        <span>Never a sale</span>
      </div>
    </header>
  )
}

/* ------------------------------------------------------------------ bolt --
   Three runs of cloth. The cloth feeds through a fixed frame at a different
   rate from its text, so it reads as one continuous length being unrolled. */

function BoltRun({ garment, index, reduced }) {
  const ref = useRef(null)
  const imgRef = useRef(null)
  const coarse = useCoarsePointer()
  const rate = coarse ? 0.14 : 0.28

  useScrollDriver(
    ref,
    (p) => {
      const img = imgRef.current
      if (!img) return
      img.style.transform = `translate3d(0, ${((0.5 - p) * rate * 100).toFixed(1)}%, 0)`
    },
    !reduced,
  )

  return (
    <article className={`run ${index % 2 ? 'run-flip' : ''}`} ref={ref}>
      <div className="run-text">
        <p className="mono">
          {String(index + 1).padStart(2, '0')} — Cloth
        </p>
        <h2>{garment.name}</h2>
        <p className="run-fabric">{garment.fabric}</p>
        <p className="run-detail">{garment.detail}</p>
        <p className="run-meta mono">
          £{garment.price} · {garment.colours.join(' / ')}
        </p>
        <a className="run-link mono" href={`#garment-${garment.id}`}>
          Choose a size ↓
        </a>
      </div>
      <div className="run-ribbon">
        <img src={`/cloth/${garment.id}.jpg`} alt="" ref={imgRef} />
        <Cut id={garment.id} ground="rgba(11,11,12,.88)" />
      </div>
    </article>
  )
}

function Bolt({ reduced }) {
  return (
    <section className="bolt" aria-label="The bolt">
      <h2 className="bolt-title display">THE BOLT</h2>
      <p className="bolt-note mono">
        One length of cloth. Every garment below is cut out of it.
      </p>
      {BOLT_RUNS.map((id, i) => (
        <BoltRun key={id} garment={byId[id]} index={i} reduced={reduced} />
      ))}
    </section>
  )
}

/* -------------------------------------------------------------- dissolve --
   The focal mechanism. The weave quantises as you scroll: block size runs from
   the raw thread up to the column width of the shop grid below, so the last row
   of tiles and the first row of product cards are the same measurement. */

const GRID_GUTTER = 10

function columnsFor(width) {
  if (width < 620) return 1
  if (width < 1000) return 2
  return 3
}

function Dissolve({ reduced }) {
  const ref = useRef(null)
  const canvasRef = useRef(null)
  const state = useRef({ img: null, w: 0, h: 0, cols: 3, last: -1 })
  const coarse = useCoarsePointer()

  const draw = useCallback(
    (progress) => {
      const s = state.current
      const canvas = canvasRef.current
      if (!canvas || !s.img || !s.w) return

      // Coarse pointers get a short ladder of fixed steps rather than a value
      // per frame: the same picture, a fraction of the raster work.
      const steps = coarse ? 6 : 26
      const q = Math.round(progress * steps) / steps
      if (q === s.last) return
      s.last = q

      const ctx = canvas.getContext('2d')
      const { w, h, img } = s
      // Match the shop grid exactly: same padding, same gutter, and on wide
      // screens the same allowance for the bag rail beside it.
      const pad = w > 1180 ? 48 : w > 900 ? 32 : 20
      const rail = w > 1180 ? 326 + 24 : 0
      const colWidth = (w - pad * 2 - rail - GRID_GUTTER * (s.cols - 1)) / s.cols
      const bands = 13
      ctx.clearRect(0, 0, w, h)

      for (let b = 0; b < bands; b += 1) {
        // Spatial gradient down the band stack, swept by scroll progress.
        const t = Math.min(1, Math.max(0, b / (bands - 1) + (q - 0.5) * 0.75))
        const block = Math.max(2, Math.round(2 + Math.pow(t, 2.3) * (colWidth + GRID_GUTTER - 2)))
        const y0 = Math.round((b * h) / bands)
        const y1 = Math.round(((b + 1) * h) / bands)
        const bh = y1 - y0
        // Put a tile boundary exactly on the grid's left padding, so the
        // coarsest rows and the product columns share the same edges.
        const startX = pad - Math.ceil(pad / block) * block
        const cw = Math.max(1, Math.ceil((w - startX) / block))
        const ch = Math.max(1, Math.ceil(bh / block))

        const off = document.createElement('canvas')
        off.width = cw
        off.height = ch
        const oc = off.getContext('2d')
        const srcY = Math.floor((0.12 + 0.62 * t) * img.height * 0.6)
        oc.drawImage(img, 0, srcY, img.width, Math.max(8, (img.height * bh) / h * 1.4), 0, 0, cw, ch)

        ctx.save()
        ctx.imageSmoothingEnabled = false
        ctx.filter = `brightness(${(1 - t * 0.18).toFixed(2)})`
        ctx.drawImage(off, startX, y0, cw * block, ch * block)
        ctx.restore()

        if (block > 10) {
          ctx.strokeStyle = 'rgba(11,11,12,.5)'
          ctx.lineWidth = 1
          for (let gx = startX; gx <= w; gx += block) {
            ctx.beginPath()
            ctx.moveTo(gx + 0.5, y0)
            ctx.lineTo(gx + 0.5, y1)
            ctx.stroke()
          }
          for (let gy = y0; gy <= y1; gy += block) {
            ctx.beginPath()
            ctx.moveTo(0, gy + 0.5)
            ctx.lineTo(w, gy + 0.5)
            ctx.stroke()
          }
        }
      }

      const grad = ctx.createLinearGradient(0, h * 0.5, 0, h)
      grad.addColorStop(0, 'rgba(11,11,12,0)')
      grad.addColorStop(1, 'rgba(11,11,12,.34)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
    },
    [coarse],
  )

  // Size the canvas to its box, and redraw when that changes.
  useEffect(() => {
    const el = ref.current
    const canvas = canvasRef.current
    if (!el || !canvas) return
    const img = new Image()
    img.src = '/cloth/overshirt.jpg'

    const resize = () => {
      const r = el.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const s = state.current
      s.w = Math.round(r.width)
      s.h = Math.round(r.height)
      s.cols = columnsFor(window.innerWidth)
      s.last = -1
      canvas.width = Math.round(s.w * dpr)
      canvas.height = Math.round(s.h * dpr)
      canvas.style.width = `${s.w}px`
      canvas.style.height = `${s.h}px`
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
      draw(reduced ? 0.82 : 0.5)
    }

    const onLoad = () => {
      state.current.img = img
      resize()
    }
    if (img.complete) onLoad()
    else img.addEventListener('load', onLoad)

    const ro = new ResizeObserver(resize)
    ro.observe(el)
    return () => {
      img.removeEventListener('load', onLoad)
      ro.disconnect()
    }
  }, [draw, reduced])

  // Reduced motion holds the resolved state: large tiles, the grid already legible.
  useScrollDriver(ref, (p) => draw(p), !reduced)

  return (
    <section className="dissolve" ref={ref} aria-hidden="true">
      <canvas ref={canvasRef} />
      <div className="dissolve-label">
        <p className="mono">The weave resolves into the grid</p>
        <b className="display">NINE GARMENTS</b>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ card -- */

function Card({ garment, chosenSize, onChoose, onAdd, reduced }) {
  const ref = useRef(null)
  const revealed = useRevealed(ref)
  const resolved = reduced || revealed
  const sold = garment.sold
  const canAdd = Boolean(chosenSize) && !sold.includes(chosenSize)

  return (
    <article
      className="card"
      id={`garment-${garment.id}`}
      data-flip={garment.id}
      ref={ref}
      aria-labelledby={`name-${garment.id}`}
    >
      {/* The tile arrives quantised — the last state of the dissolve — and resolves. */}
      <div className={`plate ${resolved ? 'is-resolved' : ''}`}>
        <img className="plate-lo" src={`/cloth/${garment.id}-lo.jpg`} alt="" aria-hidden="true" />
        <img
          className="plate-hi"
          src={`/cloth/${garment.id}.jpg`}
          alt={`Representative ${garment.fabric.split(',')[0].toLowerCase()} cloth, with the ${garment.name} outline cut out of it`}
          loading="lazy"
        />
        <Cut id={garment.id} />
        <p className="plate-cat mono">{garment.category}</p>
      </div>

      <div className="card-body">
        <div className="card-head">
          <h3 id={`name-${garment.id}`}>{garment.name}</h3>
          <p className="price mono">£{garment.price}</p>
        </div>
        <p className="card-detail">{garment.detail}</p>
        <p className="card-fabric">{garment.fabric}</p>
        <p className="card-colours mono">Colours: {garment.colours.join(' / ')}</p>

        <fieldset className="sizes">
          <legend className="mono">Size</legend>
          {SIZES.map((s) => {
            const isSold = sold.includes(s)
            return (
              <button
                key={s}
                type="button"
                className={`size ${chosenSize === s ? 'is-chosen' : ''} ${isSold ? 'is-sold' : ''}`}
                disabled={isSold}
                aria-pressed={chosenSize === s}
                aria-label={isSold ? `Size ${s}, sold out` : `Size ${s}`}
                onClick={() => onChoose(garment.id, s)}
              >
                {s}
              </button>
            )
          })}
        </fieldset>

        <p className="size-state mono" aria-live="polite">
          {chosenSize ? `Size ${chosenSize} chosen` : 'No size chosen yet'}
          {sold.length > 0 && (
            <span className="sold-note"> · {sold.join(' and ')} sold out</span>
          )}
        </p>

        <button type="button" className="add" disabled={!canAdd} onClick={() => onAdd(garment)}>
          {canAdd ? `Add to bag — size ${chosenSize}` : 'Choose a size'}
        </button>
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------- bag -- */

function Bag({ bag, subtotal, postage, onRemove, narrow }) {
  const toFree = Math.max(0, 100 - subtotal)
  const progress = Math.min(100, (subtotal / 100) * 100)

  return (
    <aside className={`bag ${narrow ? 'bag-flow' : ''}`} id="bag" aria-label="Your bag">
      <p className="bag-head">
        <span className="mono">
          Your bag — {bag.length ? `${bag.length} item${bag.length > 1 ? 's' : ''}` : 'empty'}
        </span>
        {bag.length > 0 && <span className="mono bag-sum">{money(subtotal)}</span>}
      </p>

      <div className="bag-body">
        {bag.length === 0 ? (
          <p className="bag-empty">Your bag is empty. Choose a size on any garment above.</p>
        ) : (
          <>
            <ul className="bag-lines">
              {bag.map((line, i) => (
                <li key={`${line.id}-${i}`}>
                  <span className="bag-name">
                    {line.name}, size {line.size}
                  </span>
                  <span className="bag-right">
                    <span className="mono">£{line.price}</span>
                    <button
                      type="button"
                      className="bag-remove"
                      onClick={() => onRemove(i)}
                      aria-label={`Remove ${line.name}, size ${line.size}, from the bag`}
                    >
                      ✕
                    </button>
                  </span>
                </li>
              ))}
            </ul>

            <p className="bag-row mono">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </p>
            <div className="bag-progress" aria-hidden="true">
              <i style={{ width: `${progress}%` }} />
            </div>
            <p className="bag-delivery mono">
              {postage === 0
                ? 'Delivery free — over £100'
                : `Delivery ${money(postage)} — ${money(toFree)} more for free delivery`}
            </p>
            <p className="bag-row bag-total mono">
              <span>Total</span>
              <span>{money(subtotal + postage)}</span>
            </p>
            <button type="button" className="checkout">
              Checkout
            </button>
          </>
        )}
      </div>
    </aside>
  )
}

/* ------------------------------------------------------------------ shop -- */

function Shop({ category, setCategory, shown, chosen, onChoose, onAdd, reduced, children }) {
  const gridRef = useRef(null)
  useFlip(gridRef, category, !reduced)

  return (
    <section className="shop" id="shop" aria-label="The shop">
      <div className="shop-head">
        <div>
          <p className="mono">The shop</p>
          <h2 className="display">
            EVERYTHING
            <br />
            WE MAKE
          </h2>
        </div>
      </div>

      <div className="filters" role="group" aria-label="Filter by category">
        <button
          type="button"
          className={category === 'All' ? 'is-on' : ''}
          aria-pressed={category === 'All'}
          onClick={() => setCategory('All')}
        >
          All ({GARMENTS.length})
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={category === c ? 'is-on' : ''}
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
          >
            {c} ({GARMENTS.filter((g) => g.category === c).length})
          </button>
        ))}
      </div>

      <p className="count mono" aria-live="polite">
        Showing {shown.length} of {GARMENTS.length} garments
        {category === 'All' ? '' : ` in ${category}`}.
      </p>

      <div className="layout">
        <div className="grid" ref={gridRef}>
          {shown.map((g) => (
            <Card
              key={g.id}
              garment={g}
              chosenSize={chosen[g.id]}
              onChoose={onChoose}
              onAdd={onAdd}
              reduced={reduced}
            />
          ))}
        </div>
        {children}
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- ending -- */

function Ending({ reduced }) {
  const footRef = useRef(null)
  const footImgRef = useRef(null)
  useScrollDriver(
    footRef,
    (p) => {
      const img = footImgRef.current
      if (img) img.style.transform = `translate3d(0, ${((0.5 - p) * 18).toFixed(1)}%, 0)`
    },
    !reduced,
  )

  return (
    <section className="ending">
      <div className="two-col">
        <div id="sizing">
          <p className="mono">Sizing</p>
          <h2 className="section-title">
            Measured on the body,
            <br />
            in centimetres.
          </h2>
          <table className="chart">
            <caption className="visually-hidden">
              Body measurements in centimetres for every size
            </caption>
            <thead>
              <tr>
                <th scope="col">Size</th>
                <th scope="col">Chest</th>
                <th scope="col">Waist</th>
                <th scope="col">Sleeve</th>
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
          <p className="between">{BETWEEN_SIZES}</p>
        </div>

        <div>
          <div id="care">
            <p className="mono">Care</p>
            <h2 className="section-title">How to keep it.</h2>
            <ul className="ruled">
              {CARE.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="stack-gap">
            <p className="mono">Shipping &amp; returns</p>
            <h2 className="section-title">Where it goes.</h2>
            <ul className="ruled">
              {SHIPPING.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="reviews-block">
        <p className="mono">Worn in</p>
        <h2 className="section-title">Three people who bought something.</h2>
        <div className="reviews">
          {REVIEWS.map((r) => (
            <figure className="review" key={r.name}>
              <blockquote>{r.text}</blockquote>
              <figcaption className="mono">
                {r.name} · bought {r.bought}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className="about" id="leeds">
        {ABOUT.map((line, i) => (
          <p key={line}>
            <b className="display">{ABOUT_NUMERALS[i]}</b>
            {line}
          </p>
        ))}
      </div>

      <div className="foot-cloth" ref={footRef}>
        <img src="/cloth/overshirt.jpg" alt="" ref={footImgRef} />
        <b className="display">MARLOW &amp; VALE</b>
      </div>

      <footer className="foot">
        <p className="mono">Leeds, England</p>
        <p className="mono">The price is the price all year</p>
        <p className="mono">© 2026</p>
      </footer>

      <p className="disclosure">
        Marlow &amp; Vale is a fictional label. The cloth on this page is representative fabric
        photography from open-licensed sources — denim, lambswool, corduroy, Donegal tweed and
        canvas, toned to each garment&rsquo;s stated colour — and every garment shape is a
        drawing. Nothing here is a photograph of stock held by this shop.
      </p>
    </section>
  )
}

/* ------------------------------------------------------------------- app -- */

export default function App() {
  const [category, setCategory] = useState('All')
  const [chosen, setChosen] = useState({})
  const [bag, setBag] = useState([])

  const reduced = useReducedMotion()
  const narrow = useNarrow()

  const shown = useMemo(
    () => (category === 'All' ? GARMENTS : GARMENTS.filter((g) => g.category === category)),
    [category],
  )
  const subtotal = bag.reduce((sum, line) => sum + line.price, 0)
  const postage = subtotal === 0 || subtotal >= 100 ? 0 : 4.95

  const choose = useCallback((id, size) => {
    setChosen((prev) => ({ ...prev, [id]: size }))
  }, [])

  const add = useCallback(
    (garment) => {
      const size = chosen[garment.id]
      if (!size || garment.sold.includes(size)) return
      setBag((prev) => [...prev, { id: garment.id, name: garment.name, size, price: garment.price }])
    },
    [chosen],
  )

  const remove = useCallback((index) => {
    setBag((prev) => prev.filter((_, i) => i !== index))
  }, [])

  return (
    <div className="page">
      <Nav
        bagCount={bag.length}
        onBag={() => {
          document.getElementById('bag')?.scrollIntoView({
            behavior: reduced ? 'auto' : 'smooth',
            block: 'center',
          })
        }}
      />
      <Hero reduced={reduced} />
      <Bolt reduced={reduced} />
      <Dissolve reduced={reduced} />
      <Shop
        category={category}
        setCategory={setCategory}
        shown={shown}
        chosen={chosen}
        onChoose={choose}
        onAdd={add}
        reduced={reduced}
      >
        <Bag
          bag={bag}
          subtotal={subtotal}
          postage={postage}
          onRemove={remove}
          narrow={narrow}
        />
      </Shop>
      <Ending reduced={reduced} />
    </div>
  )
}
