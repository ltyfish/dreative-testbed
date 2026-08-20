import { useEffect, useRef, useState } from 'react'

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

const chf = (n) => n.toLocaleString('en-CH')

// One observer for everything marked [data-reveal]; adds .is-in once.
function useReveal() {
  const root = useRef(null)
  useEffect(() => {
    const el = root.current
    if (!el) return
    const targets = el.querySelectorAll('[data-reveal]')
    if (!('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            io.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    )
    targets.forEach((t) => io.observe(t))
    return () => io.disconnect()
  }, [])
  return root
}

// A hairline plate diagram: concentric circles, index ticks, jewel positions.
function PlateMark() {
  const ticks = Array.from({ length: 60 }, (_, i) => i)
  const jewels = [
    [50, 22],
    [72, 38],
    [76, 64],
    [50, 78],
    [28, 63],
    [24, 37],
  ]
  return (
    <svg className="platemark" viewBox="0 0 100 100" aria-hidden="true">
      <g className="platemark-spin">
        <circle cx="50" cy="50" r="48" />
        <circle cx="50" cy="50" r="41" />
        <circle cx="50" cy="50" r="29" />
        <circle cx="50" cy="50" r="14.5" />
        {ticks.map((i) => (
          <line
            key={i}
            x1="50"
            y1="2.6"
            x2="50"
            y2={i % 5 === 0 ? 7.6 : 5}
            transform={`rotate(${i * 6} 50 50)`}
            className={i % 5 === 0 ? 'tick tick-major' : 'tick'}
          />
        ))}
        {jewels.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" className="jewel" />
        ))}
      </g>
    </svg>
  )
}

// Layer thicknesses are drawn to scale; they sum to the 3.8mm movement height.
function LayerStack({ active, onActive }) {
  const total = LAYERS.reduce((sum, l) => sum + parseFloat(l.thickness), 0)
  return (
    <div className="stack">
      <span className="stack-edge stack-edge--front">Front</span>
      <div className="stack-body">
        {LAYERS.map((l) => {
          const mm = parseFloat(l.thickness)
          return (
            <button
              type="button"
              key={l.id}
              data-layer={l.id}
              className={`band${active === l.id ? ' is-active' : ''}`}
              style={{ height: `${(mm / total) * 100}%` }}
              onMouseEnter={() => onActive(l.id)}
              onFocus={() => onActive(l.id)}
              aria-label={`${l.name}, ${l.thickness}`}
            >
              <span className="band-mm">{l.thickness}</span>
            </button>
          )
        })}
      </div>
      <span className="stack-edge stack-edge--back">Back</span>
      <span className="stack-total">3.8mm overall</span>
    </div>
  )
}

export default function App() {
  const [config, setConfig] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reserved, setReserved] = useState(false)
  const [layer, setLayer] = useState(LAYERS[1].id)
  const root = useReveal()

  const chosen = CONFIGURATIONS.find((c) => c.id === config)
  const maxRemaining = Math.max(...CONFIGURATIONS.map((c) => c.remaining))

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !email || !config) return
    setReserved(true)
  }

  function pick(id) {
    setConfig(id)
    const select = document.getElementById('config')
    if (select) select.focus({ preventScroll: true })
  }

  return (
    <div className="page" ref={root}>
      <header className="topbar">
        <a className="wordmark" href="#top">
          Aubry <span>&amp;</span> Vent
        </a>
        <nav className="topnav">
          <a href="#path">Power path</a>
          <a href="#build">Construction</a>
          <a href="#spec">Specification</a>
          <a href="#finishes">Finishes</a>
        </nav>
        <a className="topcta" href="#reserve">
          Reserve
        </a>
      </header>

      <main id="top">
        <section className="hero">
          <PlateMark />
          <div className="hero-inner">
            <p className="eyebrow">Caliber 08 · Manual winding</p>
            <h1>
              Seventy-two hours of stored energy, released one escape-wheel tooth at a time, five
              times a second, for three days from a single wind.
            </h1>
            <p className="lede">
              A manual-winding mechanical movement, made in a run of 200 and then never again.
            </p>
            <dl className="hero-figures">
              <div>
                <dt>Power reserve</dt>
                <dd>72 h</dd>
              </div>
              <div>
                <dt>Frequency</dt>
                <dd>2.5 Hz</dd>
              </div>
              <div>
                <dt>Components</dt>
                <dd>214</dd>
              </div>
              <div>
                <dt>Run of</dt>
                <dd>200</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="section" id="path">
          <div className="section-head" data-reveal>
            <p className="section-index">01</p>
            <h2>How the energy travels</h2>
            <p className="section-note">
              Six stages, in the order the wind passes through them — from the ribbon of steel you
              tension by hand to the hands on the dial.
            </p>
          </div>

          <ol className="path">
            {POWER_PATH.map((s, i) => (
              <li className="stage" key={s.id} data-stage={s.id} data-reveal>
                <div className="stage-rail" aria-hidden="true">
                  <span className="stage-node" />
                </div>
                <div className="stage-body">
                  <p className="stage-num">{String(i + 1).padStart(2, '0')}</p>
                  <h3>{s.name}</h3>
                  <p className="stage-detail">{s.detail}</p>
                </div>
                <p className="stage-figure">{s.figure}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section section--build" id="build">
          <div className="section-head" data-reveal>
            <p className="section-index">02</p>
            <h2>Four layers, front to back</h2>
            <p className="section-note">
              The movement is built up in four layers. Drawn to scale — together they are the
              3.8mm height of the caliber.
            </p>
          </div>

          <div className="build" data-reveal>
            <LayerStack active={layer} onActive={setLayer} />
            <ol className="layers">
              {LAYERS.map((l) => (
                <li
                  key={l.id}
                  data-layer={l.id}
                  className={`layer${layer === l.id ? ' is-active' : ''}`}
                  onMouseEnter={() => setLayer(l.id)}
                >
                  <h3>
                    {l.name}
                    <span className="layer-mm">{l.thickness}</span>
                  </h3>
                  <p>{l.note}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section section--spec" id="spec">
          <div className="section-head" data-reveal>
            <p className="section-index">03</p>
            <h2>Specification</h2>
          </div>
          <dl className="spec" data-reveal>
            {SPECS.map(([k, v]) => (
              <div className="spec-row" key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="section" id="finishes">
          <div className="section-head" data-reveal>
            <p className="section-index">04</p>
            <h2>Three finishes</h2>
            <p className="section-note">
              Prices are for the movement alone; casing is arranged separately.
            </p>
          </div>

          <ul className="finishes">
            {CONFIGURATIONS.map((c) => (
              <li
                key={c.id}
                data-config={c.id}
                className={`finish${config === c.id ? ' is-chosen' : ''}`}
                data-reveal
              >
                <h3>{c.name}</h3>
                <p className="finish-desc">{c.finish}</p>
                <p className="finish-price">
                  <span className="cur">CHF</span> {chf(c.price)}
                </p>
                <p className="finish-lead">{c.lead}</p>
                <div className="allocation">
                  <div className="alloc-bar" aria-hidden="true">
                    <span style={{ width: `${(c.remaining / maxRemaining) * 100}%` }} />
                  </div>
                  <p className="alloc-text">
                    <strong>{c.remaining}</strong> of the run still unallocated
                  </p>
                </div>
                <button type="button" className="finish-pick" onClick={() => pick(c.id)}>
                  {config === c.id ? 'Selected' : 'Select this finish'}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="section section--atelier" id="atelier">
          <div className="section-head" data-reveal>
            <p className="section-index">05</p>
            <h2>The workshop</h2>
          </div>
          <ul className="atelier">
            {ATELIER.map((a, i) => (
              <li key={a} data-reveal>
                <span className="atelier-num">{String(i + 1).padStart(2, '0')}</span>
                <p>{a}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="section section--reserve" id="reserve">
          <div className="reserve">
            <div className="reserve-copy" data-reveal>
              <p className="section-index">06</p>
              <h2>Reserve a movement</h2>
              <p className="reserve-note">
                Reservations are not binding and no payment is taken now. We will write once, with
                the timing record of the movement allocated to you.
              </p>
            </div>

            {reserved ? (
              <div className="confirm" role="status">
                <p className="confirm-mark">Reserved</p>
                <p className="confirm-text">
                  {name}, we have held one {chosen.name} movement at CHF {chf(chosen.price)} and
                  will write to {email}. {chosen.lead}.
                </p>
              </div>
            ) : (
              <form className="form" onSubmit={handleSubmit}>
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
                <p className="form-summary">
                  {chosen
                    ? `${chosen.name} — CHF ${chf(chosen.price)}. ${chosen.lead}.`
                    : 'No finish chosen yet.'}
                </p>
                <button type="submit">Reserve a movement</button>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <p className="footer-mark">Aubry &amp; Vent. Caliber 08. © 2026.</p>
        <p className="footer-mail">
          Enquiries: <a href="mailto:atelier@aubryvent.ch">atelier@aubryvent.ch</a>
        </p>
        <ul className="footer-links">
          <li>Servicing</li>
          <li>Provenance</li>
          <li>Terms of reservation</li>
        </ul>
      </footer>
    </div>
  )
}
