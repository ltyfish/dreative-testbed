import { useEffect, useState } from 'react'

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

const SECTIONS = [
  ['power', 'Power path'],
  ['construction', 'Construction'],
  ['specification', 'Specification'],
  ['finishes', 'Finishes'],
  ['workshop', 'Workshop'],
  ['reserve', 'Reserve'],
]

const chf = (n) => n.toLocaleString('en-CH')

function useActiveSection() {
  const [active, setActive] = useState('power')
  useEffect(() => {
    const ratios = new Map()
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => ratios.set(e.target.id, e.intersectionRatio))
        let best = null
        ratios.forEach((ratio, id) => {
          if (ratio > 0 && (!best || ratio > best.ratio)) best = { id, ratio }
        })
        if (best) setActive(best.id)
      },
      { rootMargin: '-15% 0px -55% 0px', threshold: [0, 0.2, 0.5, 1] },
    )
    SECTIONS.forEach(([id]) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])
  return active
}

export default function App() {
  const [config, setConfig] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reserved, setReserved] = useState(false)
  const active = useActiveSection()

  const chosen = CONFIGURATIONS.find((c) => c.id === config)
  const maxMm = Math.max(...LAYERS.map((l) => l.mm))

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !email || !config) return
    setReserved(true)
  }

  function pick(id) {
    setConfig(id)
    const el = document.getElementById('reserve')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="page">
      <header className="topbar">
        <a className="wordmark" href="#top">
          Aubry <span className="amp">&amp;</span> Vent
        </a>
        <nav className="topnav" aria-label="Sections">
          {SECTIONS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={active === id ? 'is-active' : undefined}>
              {label}
            </a>
          ))}
        </nav>
        <a className="topcta" href="#reserve">
          Reserve
        </a>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-inner">
            <p className="eyebrow">Caliber 08 — a run of 200</p>
            <h1>A manual-winding mechanical movement, made in a run of 200 and then never again.</h1>
            <p className="lede">
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
          </div>
          <div className="hero-plate" aria-hidden="true">
            <div className="plate-disc">
              <span className="ring ring-a" />
              <span className="ring ring-b" />
              <span className="ring ring-c" />
              <span className="jewel jewel-1" />
              <span className="jewel jewel-2" />
              <span className="jewel jewel-3" />
              <span className="balance-wheel">
                <span className="balance-spoke" />
                <span className="balance-spoke rot" />
              </span>
            </div>
          </div>
        </section>

        <section id="power" className="section">
          <div className="section-head">
            <p className="kicker">01 / Power path</p>
            <h2>How the energy travels</h2>
            <p className="section-note">
              Six stages, in the order the power moves through them. Each one takes the motion it is
              given and hands on something more precise.
            </p>
          </div>
          <ol className="path">
            {POWER_PATH.map((s, i) => (
              <li key={s.id} data-stage={s.id} className="stage">
                <span className="stage-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="stage-body">
                  <h3>{s.name}</h3>
                  <p className="stage-detail">{s.detail}</p>
                </div>
                <p className="stage-figure">{s.figure}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="construction" className="section">
          <div className="section-head">
            <p className="kicker">02 / Construction</p>
            <h2>Four layers, front to back</h2>
            <p className="section-note">
              The bars are drawn to the stated thicknesses. Stacked, they are the 3.8mm height of the
              movement.
            </p>
          </div>
          <ul className="layers">
            {LAYERS.map((l) => (
              <li key={l.id} data-layer={l.id} className="layer">
                <div className="layer-head">
                  <h3>{l.name}</h3>
                  <span className="layer-thickness">{l.thickness}</span>
                </div>
                <div className="layer-bar">
                  <span style={{ width: `${(l.mm / maxMm) * 100}%` }} />
                </div>
                <p className="layer-note">{l.note}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="specification" className="section">
          <div className="section-head">
            <p className="kicker">03 / Specification</p>
            <h2>Measured and recorded</h2>
          </div>
          <dl className="specs">
            {SPECS.map(([k, v]) => (
              <div className="spec-row" key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="finishes" className="section">
          <div className="section-head">
            <p className="kicker">04 / Finishes</p>
            <h2>Three finishes</h2>
            <p className="section-note">
              Prices are for the movement alone; casing is arranged separately.
            </p>
          </div>
          <ul className="configs">
            {CONFIGURATIONS.map((c) => (
              <li
                key={c.id}
                data-config={c.id}
                className={`config${config === c.id ? ' is-chosen' : ''}`}
              >
                <div className="config-top">
                  <h3>{c.name}</h3>
                  <p className="config-price">CHF {chf(c.price)}</p>
                </div>
                <p className="config-finish">{c.finish}</p>
                <p className="config-lead">{c.lead}</p>
                <p className="config-remaining">
                  <strong>{c.remaining}</strong> of the run still unallocated
                </p>
                <button type="button" className="config-pick" onClick={() => pick(c.id)}>
                  {config === c.id ? 'Selected' : 'Choose this finish'}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section id="workshop" className="section">
          <div className="section-head">
            <p className="kicker">05 / Workshop</p>
            <h2>Where it is made, and for how long</h2>
          </div>
          <ul className="atelier">
            {ATELIER.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>

        <section id="reserve" className="section reserve">
          <div className="section-head">
            <p className="kicker">06 / Reserve</p>
            <h2>Reserve a movement</h2>
            <p className="section-note">
              Reservations are not binding and no payment is taken now. We will write once, with the
              timing record of the movement allocated to you.
            </p>
          </div>

          {reserved ? (
            <p role="status" className="confirmation">
              Reserved. {name}, we have held one {chosen.name} movement at CHF {chf(chosen.price)}{' '}
              and will write to {email}. {chosen.lead}.
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
              <div className="field-submit">
                <button type="submit">Reserve a movement</button>
                <p className="field-summary">
                  {chosen
                    ? `${chosen.name} · CHF ${chf(chosen.price)} · ${chosen.lead} · ${chosen.remaining} unallocated`
                    : 'No payment is taken and nothing is binding.'}
                </p>
              </div>
            </form>
          )}
        </section>
      </main>

      <footer className="footer">
        <p className="footer-mark">Aubry &amp; Vent. Caliber 08. © 2026.</p>
        <nav className="footer-links" aria-label="More">
          <span>Servicing.</span>
          <span>Provenance.</span>
          <span>Terms of reservation.</span>
        </nav>
        <p className="footer-contact">
          Enquiries: <a href="mailto:atelier@aubryvent.ch">atelier@aubryvent.ch</a>
        </p>
      </footer>
    </div>
  )
}
