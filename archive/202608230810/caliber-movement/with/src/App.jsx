import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { STAGE_MARKS } from './marks.jsx'
import planUrl from './assets/ref-calibre-plan.jpg'
import escapementUrl from './assets/ref-escapement.jpg'
import benchUrl from './assets/ref-bench.jpg'
import blockUrl from './assets/ref-movement-block.jpg'

// The power path, in the order energy actually travels. This order is a fact
// about the movement, not a layout decision.
const POWER_PATH = [
  {
    id: 'mainspring',
    name: 'Mainspring',
    detail: 'A 380mm hardened alloy ribbon, wound to 6.5 turns.',
    figure: '72 hours of stored energy at full wind',
  },
  {
    id: 'barrel',
    name: 'Barrel and stop-work',
    detail: 'Releases the spring at a near-constant torque and refuses the last eight per cent, where the rate would drift.',
    figure: 'Torque held within 4% across the run',
  },
  {
    id: 'train',
    name: 'Gear train',
    detail: 'Four wheels step the barrel’s one slow turn up to the escape wheel’s fast one.',
    figure: 'Ratio 1 : 4,608',
  },
  {
    id: 'escapement',
    name: 'Escapement',
    detail: 'A free-sprung lever in silicon releases the train one tooth at a time. This is the ticking.',
    figure: '5 releases per second',
  },
  {
    id: 'balance',
    name: 'Balance wheel',
    detail: 'A 10.6mm glucydur wheel swinging against a flat hairspring. Its period is what the watch calls a second.',
    figure: '18,000 semi-oscillations per hour',
  },
  {
    id: 'hands',
    name: 'Motion work and hands',
    detail: 'The last reduction divides that swing back down into minutes and hours.',
    figure: 'Cumulative deviation −1 to +4 seconds per day',
  },
]

// Physical layers, front of the movement to back. Also a fact, not an order
// chosen for the page.
const LAYERS = [
  { id: 'dial-side', name: 'Dial-side plate', thickness: '0.9mm', note: 'Carries the motion work and the hand posts.' },
  { id: 'main', name: 'Main plate', thickness: '1.4mm', note: 'German silver, frosted by hand. Every pivot is located from this one surface.' },
  { id: 'bridge', name: 'Train bridge', thickness: '0.8mm', note: 'One continuous bridge over all four train wheels, black-polished on the upper flanks.' },
  { id: 'balance-cock', name: 'Balance cock', thickness: '0.7mm', note: 'Holds the balance from one side only, so the wheel can be seen turning.' },
]

const CONFIGURATIONS = [
  {
    id: 'frosted',
    name: 'Frosted German silver',
    finish: 'Hand-frosted plates, straight-grained bridges, blued screws.',
    price: 24800,
    lead: 'Delivered from March 2027',
    remaining: 41,
  },
  {
    id: 'skeleton',
    name: 'Open-worked',
    finish: 'Main plate cut back to the load paths, every remaining edge anglaged by hand.',
    price: 39500,
    lead: 'Delivered from September 2027',
    remaining: 12,
  },
  {
    id: 'black',
    name: 'Black-polished steel',
    finish: 'Bridges polished to a true black at every angle, matte plates for contrast.',
    price: 31200,
    lead: 'Delivered from June 2027',
    remaining: 24,
  },
]

const SPECS = [
  ['Reference', 'Caliber 08'],
  ['Diameter', '31.0mm'],
  ['Height', '3.8mm'],
  ['Jewels', '27'],
  ['Frequency', '2.5 Hz (18,000 A/h)'],
  ['Power reserve', '72 hours'],
  ['Regulation', 'Free-sprung, four inertia weights'],
  ['Winding', 'Manual'],
  ['Components', '214'],
  ['Finishing hours', '62 per movement'],
]

const ATELIER = [
  'Designed, cut, and finished at the workshop in Vallée de Joux. Nothing is subcontracted except the jewels and the mainspring.',
  'Eleven watchmakers. Two of them do nothing but finishing.',
  'A total of 200 movements will be made, after which the tooling is retired.',
  'Every movement is run for 21 days in six positions before it leaves. The timing record ships with it.',
  'Serviceable indefinitely. We keep parts for retired calibers and will not stop.',
]

// Presentation-only annotations. Nothing here changes a stated fact.
const LAYER_FORM = {
  'dial-side': { mm: 0.9, width: 90 },
  main: { mm: 1.4, width: 100 },
  bridge: { mm: 0.8, width: 66 },
  'balance-cock': { mm: 0.7, width: 33 },
}
const MM = 88 // px per millimetre in the elevation

const SECTIONS = [
  { id: 'path', label: 'Power path' },
  { id: 'layers', label: 'Layers' },
  { id: 'spec', label: 'Specification' },
  { id: 'workshop', label: 'Workshop' },
  { id: 'reserve', label: 'Reserve' },
]

const chf = (n) => n.toLocaleString('en-CH')

/* ---------------------------------------------------------------- reveal -- */

function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (!('IntersectionObserver' in window)) {
      node.classList.add('is-in')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        }
      },
      // Fire while the region is still entering, against the top of the
      // viewport, so nothing resolves behind the reader.
      { rootMargin: '0px 0px -22% 0px', threshold: 0 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])
  return ref
}

function Section({ id, index, title, lede, className = '', children }) {
  const ref = useReveal()
  return (
    <section id={id} ref={ref} className={`section reveal ${className}`}>
      <header className="section-head">
        <span className="section-index">{index}</span>
        <h2 className="section-title">{title}</h2>
        {lede ? <p className="section-lede">{lede}</p> : null}
      </header>
      {children}
    </section>
  )
}

/* ------------------------------------------------------------------ chrome -- */

function Masthead() {
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className={`masthead${solid ? ' is-solid' : ''}`}>
      <a className="masthead-brand" href="#top">
        <span className="brand-name">Aubry &amp; Vent</span>
        <span className="brand-ref">Caliber 08</span>
      </a>
      <nav className="masthead-nav" aria-label="Sections">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`}>
            {s.label}
          </a>
        ))}
      </nav>
    </header>
  )
}

/* -------------------------------------------------------------------- hero -- */

function Hero() {
  const ref = useReveal()
  return (
    <section className="hero reveal" id="top" ref={ref}>
      <div className="hero-type">
        <p className="eyebrow">Aubry &amp; Vent · Vallée de Joux</p>
        <h1 className="hero-title">
          <span>Caliber</span>
          <span className="hero-num">08</span>
        </h1>
        <p className="hero-claim">
          A manual-winding mechanical movement, made in a run of 200 and then never again.
        </p>
        <p className="hero-body">
          Seventy-two hours of stored energy, released one escape-wheel tooth at a time, five times a
          second, for three days from a single wind.
        </p>
        <dl className="hero-figures">
          <div>
            <dt>Reserve</dt>
            <dd>72 h</dd>
          </div>
          <div>
            <dt>Beat</dt>
            <dd>18,000 A/h</dd>
          </div>
          <div>
            <dt>Height</dt>
            <dd>3.8 mm</dd>
          </div>
        </dl>
        <a className="button button-lead" href="#reserve">
          Reserve a movement
          <span className="button-rule" aria-hidden="true" />
        </a>
      </div>
      <figure className="hero-plate">
        <img
          src={planUrl}
          alt="A hand-wound mechanical watch movement seen from above: bridges, ruby jewels, blued screws and the balance wheel."
          width="1024"
          height="1011"
        />
        <figcaption>
          Reference photography — Peseux calibre 320, a comparable hand-wound movement.
          Not Caliber 08.
        </figcaption>
      </figure>
    </section>
  )
}

/* -------------------------------------------------------------- power path -- */

function PowerPath() {
  // The line is driven by the reader's scroll — energy travels down the path as
  // the section passes — until they point at a stage themselves, which wins.
  const listRef = useRef(null)
  const [scrolled, setScrolled] = useState(0)
  const [picked, setPicked] = useState(null)

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const el = listRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const span = r.height + window.innerHeight * 0.5
      const p = (window.innerHeight * 0.82 - r.top) / span
      const i = Math.round(Math.min(1, Math.max(0, p)) * (POWER_PATH.length - 1))
      setScrolled(i)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const traced = picked ?? scrolled
  const setTraced = setPicked
  const fill = (traced / (POWER_PATH.length - 1)) * 100

  return (
    <Section
      id="path"
      index="01"
      title="How the energy travels"
      lede="Six stages, in the order energy actually passes through them. Follow one and the line fills from the mainspring to it."
    >
      <figure className="band-figure">
        <img
          src={escapementUrl}
          alt="Close view of a movement's balance wheel, hairspring and lever escapement."
          loading="lazy"
          width="1024"
          height="722"
        />
        <figcaption>
          Reference photography — the balance and lever of a Vertex Revue 81. Not Caliber 08.
        </figcaption>
      </figure>

      <ol className="path" ref={listRef} style={{ "--fill": `${fill}%` }}>
        <div className="path-spine" aria-hidden="true">
          <span className="path-spine-fill" />
        </div>
        {POWER_PATH.map((stage, i) => {
          const Mark = STAGE_MARKS[stage.id]
          const state = i < traced ? 'is-passed' : i === traced ? 'is-traced' : ''
          return (
            <li key={stage.id} data-stage={stage.id} className={`stage ${state}`}>
              <button
                type="button"
                className="stage-button"
                onMouseEnter={() => setTraced(i)}
                onFocus={() => setTraced(i)}
                onClick={() => setTraced(i)}
                aria-pressed={i === traced}
              >
                <span className="stage-node" aria-hidden="true">
                  <Mark />
                </span>
                <span className="stage-body">
                  <span className="stage-index">{String(i + 1).padStart(2, '0')}</span>
                  <span className="stage-name">{stage.name}</span>
                  <span className="stage-detail">{stage.detail}</span>
                </span>
                <span className="stage-figure">{stage.figure}</span>
              </button>
            </li>
          )
        })}
      </ol>
      <p className="path-note">
        The escape wheel and balance above run at the rate printed beside them — five releases a
        second, 18,000 semi-oscillations an hour. They hold still if you have asked your system to
        reduce motion.
      </p>
    </Section>
  )
}

/* ------------------------------------------------------------------ layers -- */

function LayerStack() {
  const [open, setOpen] = useState(null)
  const total = LAYERS.reduce((s, l) => s + LAYER_FORM[l.id].mm, 0)

  return (
    <Section
      id="layers"
      index="02"
      title="Four layers, 3.8 millimetres"
      lede="The movement is built up in four layers, front to back. Drawn here in section, each to its true thickness; together they are the height in the specification."
      className="section-layers"
    >
      <div className="stack-grid">
        <figure
          className={`elevation${open ? ' is-open' : ''}`}
          onMouseLeave={() => setOpen(null)}
        >
          <div className="elevation-dim" aria-hidden="true">
            <span className="elevation-dim-line" />
            <span className="elevation-dim-value tabular">{total.toFixed(1)} mm</span>
          </div>
          <div className="elevation-stack">
            {LAYERS.map((l) => {
              const f = LAYER_FORM[l.id]
              return (
                <div
                  key={l.id}
                  className={`slab${open === l.id ? ' is-active' : ''}${
                    open && open !== l.id ? ' is-dim' : ''
                  }`}
                  style={{ height: `${f.mm * MM}px`, width: `${f.width}%` }}
                  data-layer={l.id}
                  aria-hidden="true"
                >
                  <span className="slab-face" />
                  <span className="slab-caption tabular">{l.thickness}</span>
                  <span className="slab-name">{l.name}</span>
                </div>
              )
            })}
          </div>
          <figcaption>Section through the movement, front at the top. Drawn to scale.</figcaption>
        </figure>

        <ul className="layer-list">
          {LAYERS.map((l, i) => (
            <li key={l.id} data-layer={l.id}>
              <button
                type="button"
                className={`layer-row${open === l.id ? ' is-active' : ''}`}
                onMouseEnter={() => setOpen(l.id)}
                onFocus={() => setOpen(l.id)}
                onClick={() => setOpen(open === l.id ? null : l.id)}
                aria-pressed={open === l.id}
              >
                <span className="layer-index">{String(i + 1).padStart(2, '0')}</span>
                <span className="layer-name">{l.name}</span>
                <span className="layer-thickness tabular">{l.thickness}</span>
                <span className="layer-note">{l.note}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}

/* ------------------------------------------------------------------- specs -- */

function Specification() {
  return (
    <Section
      id="spec"
      index="03"
      title="Specification"
      lede="The whole of it, on one page."
      className="section-spec"
    >
      <dl className="spec">
        {SPECS.map(([k, v]) => (
          <div className="spec-row" key={k}>
            <dt>{k}</dt>
            <dd className="tabular">{v}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}

/* ---------------------------------------------------------------- workshop -- */

function Workshop() {
  const ref = useReveal()
  const [runOf200, pull] = [ATELIER[2], ATELIER[4]]
  const rest = [ATELIER[0], ATELIER[1], ATELIER[3]]
  const restLabels = ['Vallée de Joux', 'Eleven watchmakers', '21 days, six positions']
  return (
    <section id="workshop" ref={ref} className="section section-workshop reveal">
      <div className="workshop-ground" aria-hidden="true">
        <img src={benchUrl} alt="" loading="lazy" width="1024" height="684" />
      </div>
      <div className="workshop-inner">
        <header className="section-head">
          <span className="section-index">04</span>
          <h2 className="section-title">The workshop</h2>
        </header>

        <div className="workshop-grid">
          <p className="workshop-run">
            <span className="workshop-run-num tabular">200</span>
            <span className="workshop-run-text">{runOf200}</span>
          </p>
          <ul className="workshop-facts">
            {rest.map((fact, i) => (
              <li key={fact}>
                <span className="workshop-label">{restLabels[i]}</span>
                <span className="workshop-fact">{fact}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="workshop-pull">{pull}</p>

        <p className="workshop-credit">
          Reference photography — hands fitting at the bench, Siduna workshop. Not our atelier.
        </p>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------- reserve -- */

function Swatch({ id }) {
  return <span className={`swatch swatch-${id}`} aria-hidden="true" />
}

function Reserve() {
  const [config, setConfig] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reserved, setReserved] = useState(false)
  const ref = useReveal()
  const uid = useId()

  const chosen = CONFIGURATIONS.find((c) => c.id === config)

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      if (!name || !email || !config) return
      setReserved(true)
    },
    [name, email, config],
  )

  return (
    <section id="reserve" ref={ref} className="section section-reserve reveal">
      <header className="section-head">
        <span className="section-index">05</span>
        <h2 className="section-title">Three finishes</h2>
        <p className="section-lede">
          Available in three finishes. Prices are for the movement alone; casing is arranged
          separately.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="reserve-form">
        <fieldset className="finishes">
          <legend className="sr-only">Which finish?</legend>
          {CONFIGURATIONS.map((c) => (
            <label
              key={c.id}
              data-config={c.id}
              className={`finish${config === c.id ? ' is-chosen' : ''}`}
            >
              <input
                type="radio"
                name="config"
                value={c.id}
                required
                checked={config === c.id}
                onChange={() => setConfig(c.id)}
                className="sr-only"
              />
              <Swatch id={c.id} />
              <span className="finish-head">
                <span className="finish-name">{c.name}</span>
                <span className="finish-check" aria-hidden="true">
                  {config === c.id ? 'Chosen' : 'Choose'}
                </span>
              </span>
              <span className="finish-price tabular">
                <span className="finish-currency">CHF</span> {chf(c.price)}
              </span>
              <span className="finish-finish">{c.finish}</span>
              <span className="finish-meta">
                <span className="finish-lead">{c.lead}</span>
                <span className="finish-remaining">
                  <span className="tabular">{c.remaining}</span> of the run still unallocated
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="reserve-decide">
        <figure className="reserve-figure">
          <img
            src={blockUrl}
            alt="A movement held on a bench block, tweezers and a dial beside it."
            loading="lazy"
            width="1024"
            height="683"
          />
          <figcaption>
            Reference photography — a movement on the block, Siduna workshop. Yours is run for 21
            days before it leaves this bench.
          </figcaption>
        </figure>
        {reserved ? (
          <div className="slip slip-done" role="status">
            <p className="slip-title">Reserved.</p>
            <p className="slip-line">
              {name}, we have held one {chosen.name} movement at CHF {chf(chosen.price)} and will
              write to {email}. {chosen.lead}.
            </p>
            <p className="slip-foot">
              Reservations are not binding and no payment is taken now. We will write once, with the
              timing record of the movement allocated to you.
            </p>
          </div>
        ) : (
          <div className="slip">
            <p className="slip-title">Reserve a movement</p>
            <p className="slip-summary">
              {chosen ? (
                <>
                  <span className="slip-chosen">{chosen.name}</span>
                  <span className="slip-sep" aria-hidden="true" />
                  <span className="tabular">CHF {chf(chosen.price)}</span>
                  <span className="slip-sep" aria-hidden="true" />
                  <span>{chosen.lead}</span>
                </>
              ) : (
                <span className="slip-empty">Choose a finish above to begin.</span>
              )}
            </p>

            <div className="field">
              <label htmlFor={`${uid}-name`}>Your name</label>
              <input
                id={`${uid}-name`}
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor={`${uid}-email`}>Email</label>
              <input
                id={`${uid}-email`}
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <p className="slip-foot">
              Reservations are not binding and no payment is taken now. We will write once, with the
              timing record of the movement allocated to you.
            </p>
            <button type="submit" className="button button-lead">
              Reserve a movement
              <span className="button-rule" aria-hidden="true" />
            </button>
          </div>
        )}
        </div>
      </form>
    </section>
  )
}

/* ------------------------------------------------------------------ footer -- */

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <p className="footer-enquiry">
          Enquiries: <a href="mailto:atelier@aubryvent.ch">atelier@aubryvent.ch</a>
        </p>
        <nav className="footer-links" aria-label="More">
          <a href="#reserve">Servicing</a>
          <a href="#workshop">Provenance</a>
          <a href="#reserve">Terms of reservation</a>
        </nav>
      </div>
      <p className="footer-credit">
        Reference photography by misteraitch, ourmaninjapan and sidunawatch, used under{' '}
        <a href="https://creativecommons.org/licenses/by/2.0/" rel="license noreferrer" target="_blank">
          CC BY 2.0
        </a>
        . It shows other makers’ movements and benches, never Caliber 08.
      </p>
      <p className="footer-legal">Aubry &amp; Vent. Caliber 08. © 2026.</p>
    </footer>
  )
}

/* --------------------------------------------------------------------- app -- */

export default function App() {
  return (
    <>
      <Masthead />
      <main>
        <Hero />
        <PowerPath />
        <LayerStack />
        <Specification />
        <Workshop />
        <Reserve />
      </main>
      <Footer />
    </>
  )
}
