import { useEffect, useRef, useState } from 'react'
import Schematic from './Schematic.jsx'

// The power path, in the order energy actually travels. This order is a fact
// about the movement, not a layout decision.
const POWER_PATH = [
  {
    id: 'mainspring',
    name: 'Mainspring',
    detail: 'A 380mm hardened alloy ribbon, wound to 6.5 turns.',
    figure: '72 hours of stored energy at full wind',
    lead: '72',
    unit: 'hours stored at full wind',
  },
  {
    id: 'barrel',
    name: 'Barrel and stop-work',
    detail: 'Releases the spring at a near-constant torque and refuses the last eight per cent, where the rate would drift.',
    figure: 'Torque held within 4% across the run',
    lead: '4%',
    unit: 'torque spread across the run',
  },
  {
    id: 'train',
    name: 'Gear train',
    detail: 'Four wheels step the barrel’s one slow turn up to the escape wheel’s fast one.',
    figure: 'Ratio 1 : 4,608',
    lead: '1 : 4,608',
    unit: 'barrel turn to escape wheel',
  },
  {
    id: 'escapement',
    name: 'Escapement',
    detail: 'A free-sprung lever in silicon releases the train one tooth at a time. This is the ticking.',
    figure: '5 releases per second',
    lead: '5',
    unit: 'releases per second',
  },
  {
    id: 'balance',
    name: 'Balance wheel',
    detail: 'A 10.6mm glucydur wheel swinging against a flat hairspring. Its period is what the watch calls a second.',
    figure: '18,000 semi-oscillations per hour',
    lead: '18,000',
    unit: 'semi-oscillations per hour',
  },
  {
    id: 'hands',
    name: 'Motion work and hands',
    detail: 'The last reduction divides that swing back down into minutes and hours.',
    figure: 'Cumulative deviation −1 to +4 seconds per day',
    lead: '−1 / +4',
    unit: 'seconds per day, cumulative',
  },
]

// Physical layers, front of the movement to back. Also a fact, not an order
// chosen for the page.
const LAYERS = [
  { id: 'dial-side', name: 'Dial-side plate', thickness: '0.9mm', mm: 0.9, note: 'Carries the motion work and the hand posts.' },
  { id: 'main', name: 'Main plate', thickness: '1.4mm', mm: 1.4, note: 'German silver, frosted by hand. Every pivot is located from this one surface.' },
  { id: 'bridge', name: 'Train bridge', thickness: '0.8mm', mm: 0.8, note: 'One continuous bridge over all four train wheels, black-polished on the upper flanks.' },
  { id: 'balance-cock', name: 'Balance cock', thickness: '0.7mm', mm: 0.7, note: 'Holds the balance from one side only, so the wheel can be seen turning.' },
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

const chf = (n) => n.toLocaleString('en-CH')

/* Reveals fire against the top of the viewport so a region has resolved by the
   time the reader is looking at it. */
function useReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll('[data-reveal]')
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.01 },
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])
}

function useInView(ref, margin = '0px') {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin])
  return inView
}

/* ------------------------------------------------------------------ header */

function Header() {
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className={`masthead${solid ? ' is-solid' : ''}`}>
      <a className="wordmark" href="#top">
        Aubry <span>&amp;</span> Vent
      </a>
      <nav className="masthead-nav" aria-label="Sections">
        <a href="#power">Power path</a>
        <a href="#layers">Construction</a>
        <a href="#spec">Specification</a>
        <a href="#workshop">Workshop</a>
      </nav>
      <a className="masthead-cta" href="#reserve">
        Reserve<span className="masthead-cta-note"> — 77 of 200 left</span>
      </a>
    </header>
  )
}

/* --------------------------------------------------------------- power path */

function PowerPath() {
  const sectionRef = useRef(null)
  const [active, setActive] = useState('mainspring')
  const running = useInView(sectionRef, '-10% 0px -10% 0px')

  useEffect(() => {
    const stages = Array.from(document.querySelectorAll('[data-stage-block]'))
    if (!stages.length || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.dataset.stageBlock)
        })
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    stages.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])

  const activeIndex = POWER_PATH.findIndex((s) => s.id === active)

  return (
    <section className="power" id="power" ref={sectionRef} aria-labelledby="power-title">
      <div className="power-intro" data-reveal>
        <p className="eyebrow">Section 01 — the power path</p>
        <h2 id="power-title">
          Six stages, in the order the energy passes through them.
        </h2>
        <p className="lede">
          Seventy-two hours of stored energy, released one escape-wheel tooth at a time, five
          times a second, for three days from a single wind.
        </p>
      </div>

      <div className="power-grid">
        <div className="power-figure">
          <div className="power-figure-inner">
            <Schematic active={active} beating={running} id="power" />
            <p className="figure-caption">
              <span className="tick-row" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`tick${running ? ' is-beating' : ''}`} style={{ animationDelay: `${i * 80}ms` }} />
                ))}
              </span>
              <span className="figure-caption-text">
                Caliber 08, bridge side. The balance is drawn beating at its true rate.
              </span>
            </p>
          </div>
        </div>

        <ol className="stages">
          {POWER_PATH.map((s, i) => (
            <li
              key={s.id}
              data-stage={s.id}
              data-stage-block={s.id}
              className={`stage${active === s.id ? ' is-active' : ''}${i <= activeIndex ? ' is-passed' : ''}`}
            >
              <div className="stage-rail" aria-hidden="true">
                <span className="stage-num">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="stage-body">
                <h3>{s.name}</h3>
                <p className="stage-figure">
                  <strong>{s.lead}</strong>
                  <span>{s.unit}</span>
                </p>
                <p className="stage-detail">{s.detail}</p>
                <p className="sr-only">{s.figure}.</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ layers */

function Layers() {
  const [open, setOpen] = useState('main')
  const scale = 74 // px per mm

  return (
    <section className="layers" id="layers" aria-labelledby="layers-title">
      <div className="layers-head" data-reveal>
        <p className="eyebrow">Section 02 — construction</p>
        <h2 id="layers-title">Four layers, 3.8mm from front to back.</h2>
        <p className="lede">
          Drawn to scale. Choose a layer to lift it off the stack.
        </p>
      </div>

      <div className="layers-grid" data-reveal>
        <div className="stack" role="group" aria-label="Cross-section through the movement, front to back">
          <div className="stack-scale" aria-hidden="true">
            <span>front</span>
            <span className="stack-scale-rule" />
            <span className="stack-total">3.8mm</span>
            <span className="stack-scale-rule" />
            <span>back</span>
          </div>
          <div className="stack-slabs">
            {LAYERS.map((l) => (
              <button
                key={l.id}
                type="button"
                data-layer={l.id}
                className={`slab${open === l.id ? ' is-open' : ''}`}
                style={{ '--h': `${l.mm * scale}px` }}
                aria-pressed={open === l.id}
                onClick={() => setOpen(l.id)}
              >
                <span className="slab-face" />
                <span className="slab-label">
                  <span className="slab-name">{l.name}</span>
                  <span className="slab-mm">{l.thickness}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="layer-notes">
          {LAYERS.map((l) => (
            <p key={l.id} className={`layer-note${open === l.id ? ' is-open' : ''}`} data-layer={l.id}>
              <span className="layer-note-name">
                {l.name} <span className="layer-note-mm">{l.thickness}</span>
              </span>
              <span className="layer-note-text">{l.note}</span>
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------- spec */

function Spec() {
  return (
    <section className="spec" id="spec" aria-labelledby="spec-title">
      <div className="spec-head" data-reveal>
        <p className="eyebrow">Section 03 — specification</p>
        <h2 id="spec-title">The whole of it, on one sheet.</h2>
      </div>
      <dl className="spec-list" data-reveal>
        {SPECS.map(([k, v]) => (
          <div className="spec-row" key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/* ---------------------------------------------------------------- workshop */

function Workshop() {
  const [headline, ...rest] = [ATELIER[2], ATELIER[0], ATELIER[1], ATELIER[3], ATELIER[4]]
  return (
    <section className="workshop" id="workshop" aria-labelledby="workshop-title">
      <div className="workshop-lead" data-reveal>
        <p className="eyebrow">Section 04 — the workshop</p>
        <h2 id="workshop-title">
          <span className="run-number">200</span>
        </h2>
        <p className="run-line">{headline}</p>
      </div>
      <ul className="workshop-facts" data-reveal>
        {rest.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </section>
  )
}

/* ------------------------------------------------------- finishes + reserve */

function Reserve() {
  const [config, setConfig] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reserved, setReserved] = useState(false)
  const [touched, setTouched] = useState(false)

  const chosen = CONFIGURATIONS.find((c) => c.id === config)

  function handleSubmit(e) {
    e.preventDefault()
    setTouched(true)
    if (!name || !email || !config) return
    setReserved(true)
  }

  return (
    <section className="reserve" id="reserve" aria-labelledby="reserve-title">
      <div className="reserve-head" data-reveal>
        <p className="eyebrow">Section 05 — finishes and reservation</p>
        <h2 id="reserve-title">Three finishes. Then the movement is yours to case.</h2>
        <p className="lede">
          Prices are for the movement alone; casing is arranged separately.
        </p>
      </div>

      <div className="finishes" role="radiogroup" aria-label="Choose a finish" data-reveal>
        {CONFIGURATIONS.map((c) => {
          const selected = config === c.id
          return (
            <label key={c.id} data-config={c.id} className={`finish${selected ? ' is-selected' : ''}`}>
              <input
                type="radio"
                name="finish"
                value={c.id}
                checked={selected}
                onChange={() => setConfig(c.id)}
              />
              <span className="finish-swatch" aria-hidden="true" data-swatch={c.id}>
                <Schematic active={null} beating={false} id={'swatch-' + c.id} plain />
              </span>
              <span className="finish-name">{c.name}</span>
              <span className="finish-price">CHF {chf(c.price)}</span>
              <span className="finish-desc">{c.finish}</span>
              <span className="finish-meta">
                <span className="finish-lead">{c.lead}</span>
                <span className="finish-remaining">
                  <span className="finish-remaining-bar" aria-hidden="true">
                    <span style={{ width: `${(c.remaining / 200) * 100}%` }} />
                  </span>
                  {c.remaining} of the run still unallocated
                </span>
              </span>
              <span className="finish-choose" aria-hidden="true">
                {selected ? 'Chosen' : 'Choose this finish'}
              </span>
            </label>
          )
        })}
      </div>

      <div className="reserve-panel" data-reveal>
        {reserved ? (
          <div className="confirmation" role="status">
            <p className="confirmation-mark">Reservation record</p>
            <p className="confirmation-body">
              Reserved. {name}, we have held one {chosen.name} movement at CHF {chf(chosen.price)}{' '}
              and will write to {email}. {chosen.lead}.
            </p>
            <dl className="confirmation-record">
              <div>
                <dt>Finish</dt>
                <dd>{chosen.name}</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>CHF {chf(chosen.price)}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>{chosen.lead}</dd>
              </div>
            </dl>
            <p className="reserve-terms">
              Reservations are not binding and no payment is taken now. We will write once, with the
              timing record of the movement allocated to you.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <p className="form-title">Reserve a movement</p>
            <div className="field">
              <label htmlFor="config">Which finish?</label>
              <select
                id="config"
                name="config"
                required
                value={config}
                onChange={(e) => setConfig(e.target.value)}
              >
                <option value="">Choose a finish</option>
                {CONFIGURATIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — CHF {chf(c.price)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="name">Your name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {chosen && (
              <p className="form-echo">
                {chosen.name} · CHF {chf(chosen.price)} · {chosen.lead}
              </p>
            )}
            {touched && (!name || !email || !config) && (
              <p className="form-error" role="alert">
                Choose a finish and give us a name and an email address.
              </p>
            )}
            <button type="submit">Reserve a movement</button>
            <p className="reserve-terms">
              Reservations are not binding and no payment is taken now. We will write once, with the
              timing record of the movement allocated to you.
            </p>
          </form>
        )}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------- page */

export default function App() {
  useReveal()
  const heroRef = useRef(null)
  const heroLive = useInView(heroRef, '0px')

  return (
    <div className="page" id="top">
      <Header />

      <main>
        <section className="hero" ref={heroRef} aria-labelledby="hero-title">
          <div className="hero-type">
            <p className="hero-house">Aubry &amp; Vent · Vallée de Joux</p>
            <h1 id="hero-title">
              Caliber <span className="hero-num">08</span>
            </h1>
            <p className="hero-claim">
              A manual-winding mechanical movement, made in a run of 200 and then never again.
            </p>
            <dl className="hero-facts">
              <div>
                <dt>Power reserve</dt>
                <dd>72 h</dd>
              </div>
              <div>
                <dt>Frequency</dt>
                <dd>2.5 Hz</dd>
              </div>
              <div>
                <dt>Height</dt>
                <dd>3.8 mm</dd>
              </div>
              <div>
                <dt>Components</dt>
                <dd>214</dd>
              </div>
            </dl>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#reserve">
                Reserve a movement
              </a>
              <a className="btn btn-ghost" href="#power">
                Follow the power path
              </a>
            </div>
          </div>
          <div className="hero-figure">
            <Schematic active={null} beating={heroLive} id="hero" />
          </div>
        </section>

        <PowerPath />
        <Layers />
        <Spec />
        <Workshop />
        <Reserve />
      </main>

      <footer className="foot">
        <p className="foot-mark">
          Aubry &amp; Vent. Caliber 08. © 2026.
        </p>
        <nav className="foot-links" aria-label="More">
          <a href="#top">Servicing</a>
          <a href="#top">Provenance</a>
          <a href="#top">Terms of reservation</a>
        </nav>
        <p className="foot-mail">
          Enquiries: <a href="mailto:atelier@aubryvent.ch">atelier@aubryvent.ch</a>
        </p>
      </footer>
    </div>
  )
}
