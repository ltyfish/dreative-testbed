import { useState } from 'react'

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
// chosen for the page. `mm` is the same number as `thickness`, kept separate so
// the bars can be drawn to scale.
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

const NAV = [
  ['power-path', 'Power path'],
  ['construction', 'Construction'],
  ['specification', 'Specification'],
  ['finishes', 'Finishes'],
  ['workshop', 'Workshop'],
  ['reserve', 'Reserve'],
]

const THICKEST = Math.max(...LAYERS.map((l) => l.mm))
const MOST_REMAINING = Math.max(...CONFIGURATIONS.map((c) => c.remaining))

const chf = (n) => n.toLocaleString('en-CH')

function BalanceWheel() {
  return (
    <svg className="wheel" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <radialGradient id="plate" cx="38%" cy="28%" r="82%">
          <stop offset="0%" stopColor="#3b3b38" />
          <stop offset="58%" stopColor="#1e1f20" />
          <stop offset="100%" stopColor="#101011" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="97" fill="url(#plate)" stroke="#33342f" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="#262723" />
      {Array.from({ length: 60 }, (_, i) => (
        <line
          key={i}
          x1="100"
          y1="10"
          x2="100"
          y2={i % 5 === 0 ? 20 : 16}
          stroke="#5c5d57"
          strokeWidth={i % 5 === 0 ? 1.1 : 0.5}
          transform={`rotate(${i * 6} 100 100)`}
        />
      ))}
      <g className="wheel-osc">
        <circle cx="100" cy="100" r="60" fill="none" stroke="#b3893f" strokeWidth="4.5" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="#e8c98d" strokeWidth="0.7" />
        {[45, 135, 225, 315].map((a) => (
          <rect key={a} x="96.5" y="33" width="7" height="10" rx="1.5" fill="#e8c98d" transform={`rotate(${a} 100 100)`} />
        ))}
        <line x1="40" y1="100" x2="160" y2="100" stroke="#b3893f" strokeWidth="3" />
        <line x1="100" y1="40" x2="100" y2="160" stroke="#b3893f" strokeWidth="3" />
        <circle cx="100" cy="100" r="10" fill="#0d0d0e" stroke="#b3893f" strokeWidth="2" />
        <circle cx="100" cy="100" r="3.4" fill="#8f2f2f" />
      </g>
      <circle cx="100" cy="100" r="30" fill="none" stroke="#4c4d48" strokeWidth="0.7" strokeDasharray="2 7" />
    </svg>
  )
}

export default function App() {
  const [config, setConfig] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reserved, setReserved] = useState(false)
  const [activeLayer, setActiveLayer] = useState('main')

  const chosen = CONFIGURATIONS.find((c) => c.id === config)

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !email || !config) return
    setReserved(true)
  }

  function chooseFinish(id) {
    setConfig(id)
    const target = document.getElementById('reserve')
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="page">
      <header className="topbar">
        <a className="mark" href="#top">
          <span className="mark-name">Aubry &amp; Vent</span>
          <span className="mark-ref">Caliber 08</span>
        </a>
        <nav className="topnav" aria-label="Sections">
          <ul>
            {NAV.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`}>{label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <a className="topbar-cta" href="#reserve">
          Reserve
        </a>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-text">
            <p className="eyelet">Manual-winding movement — run of 200</p>
            <h1>Caliber 08</h1>
            <p className="hero-sub">
              A manual-winding mechanical movement, made in a run of 200 and then never again.
            </p>
            <p className="hero-lede">
              Seventy-two hours of stored energy, released one escape-wheel tooth at a time, five
              times a second, for three days from a single wind.
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
                <dt>Height</dt>
                <dd>3.8 mm</dd>
              </div>
              <div>
                <dt>Components</dt>
                <dd>214</dd>
              </div>
            </dl>
            <div className="hero-actions">
              <a className="button" href="#reserve">
                Reserve a movement
              </a>
              <a className="button button-quiet" href="#power-path">
                Follow the power path
              </a>
            </div>
          </div>
          <figure className="hero-figure">
            <BalanceWheel />
            <figcaption>Balance wheel, 10.6mm — 18,000 semi-oscillations per hour</figcaption>
          </figure>
        </section>

        <section id="power-path" className="section">
          <div className="section-head">
            <p className="section-index">01</p>
            <h2>How the energy travels</h2>
            <p className="section-note">
              Six stages, in the order the wind you put into the crown reaches the hands.
            </p>
          </div>
          <ol className="path">
            {POWER_PATH.map((s, i) => (
              <li key={s.id} data-stage={s.id}>
                <span className="path-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="path-body">
                  <h3>{s.name}</h3>
                  <p className="path-detail">{s.detail}</p>
                </div>
                <p className="path-figure">{s.figure}.</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="construction" className="section">
          <div className="section-head">
            <p className="section-index">02</p>
            <h2>Four layers, front to back</h2>
            <p className="section-note">
              Thicknesses drawn to scale against one another. Stacked, they make the 3.8mm height.
            </p>
          </div>
          <div className="layers">
            {LAYERS.map((l, i) => (
              <article
                key={l.id}
                data-layer={l.id}
                className={'layer' + (activeLayer === l.id ? ' is-active' : '')}
                onMouseEnter={() => setActiveLayer(l.id)}
                onFocus={() => setActiveLayer(l.id)}
                tabIndex={0}
              >
                <p className="layer-index">Layer {i + 1}</p>
                <h3>{l.name}</h3>
                <p className="layer-thickness">{l.thickness}</p>
                <div className="layer-bar" aria-hidden="true">
                  <span style={{ width: `${(l.mm / THICKEST) * 100}%` }} />
                </div>
                <p className="layer-note">{l.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="specification" className="section">
          <div className="section-head">
            <p className="section-index">03</p>
            <h2>Specification</h2>
            <p className="section-note">Measured on the finished movement, not the drawing.</p>
          </div>
          <dl className="specs">
            {SPECS.map(([k, v]) => (
              <div key={k} className="spec-row">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="finishes" className="section">
          <div className="section-head">
            <p className="section-index">04</p>
            <h2>Three finishes</h2>
            <p className="section-note">
              Prices are for the movement alone; casing is arranged separately.
            </p>
          </div>
          <div className="finishes">
            {CONFIGURATIONS.map((c) => (
              <article
                key={c.id}
                data-config={c.id}
                className={'finish' + (config === c.id ? ' is-chosen' : '')}
              >
                <h3>{c.name}</h3>
                <p className="finish-desc">{c.finish}</p>
                <p className="finish-price">
                  <span className="cur">CHF</span> {chf(c.price)}
                </p>
                <dl className="finish-meta">
                  <div>
                    <dt>Delivery</dt>
                    <dd>{c.lead}</dd>
                  </div>
                  <div>
                    <dt>Allocation</dt>
                    <dd>{c.remaining} of the run still unallocated</dd>
                  </div>
                </dl>
                <div className="allocation" aria-hidden="true">
                  <span style={{ width: `${(c.remaining / MOST_REMAINING) * 100}%` }} />
                </div>
                <button type="button" className="finish-pick" onClick={() => chooseFinish(c.id)}>
                  {config === c.id ? 'Selected for reservation' : 'Choose this finish'}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section id="workshop" className="section">
          <div className="section-head">
            <p className="section-index">05</p>
            <h2>The workshop</h2>
            <p className="section-note">Vallée de Joux.</p>
          </div>
          <ul className="atelier">
            {ATELIER.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>

        <section id="reserve" className="section section-reserve">
          <div className="section-head">
            <p className="section-index">06</p>
            <h2>Reserve a movement</h2>
            <p className="section-note">
              Reservations are not binding and no payment is taken now. We will write once, with the
              timing record of the movement allocated to you.
            </p>
          </div>

          {reserved ? (
            <p role="status" className="confirmation">
              <span className="confirmation-mark">Reserved</span>
              <span>
                {name}, we have held one {chosen.name} movement at CHF {chf(chosen.price)} and will
                write to {email}. {chosen.lead}.
              </span>
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="reserve-form">
              <div className="field field-wide">
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
              <p className="reserve-summary">
                {chosen
                  ? `${chosen.name} — CHF ${chf(chosen.price)}. ${chosen.lead}. ${chosen.remaining} of the run still unallocated.`
                  : 'No finish chosen yet.'}
              </p>
              <button type="submit" className="button reserve-submit">
                Reserve a movement
              </button>
            </form>
          )}
        </section>
      </main>

      <footer className="footer">
        <p className="footer-mail">
          Enquiries: <a href="mailto:atelier@aubryvent.ch">atelier@aubryvent.ch</a>
        </p>
        <ul className="footer-links">
          <li>Servicing</li>
          <li>Provenance</li>
          <li>Terms of reservation</li>
        </ul>
        <p className="footer-legal">Aubry &amp; Vent. Caliber 08. © 2026.</p>
      </footer>
    </div>
  )
}
