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

const HEADLINE_FIGURES = [
  ['72 h', 'Power reserve'],
  ['2.5 Hz', 'Frequency'],
  ['214', 'Components'],
  ['62 h', 'Finishing, per movement'],
  ['200', 'Made, then never again'],
]

const NAV = [
  ['power', 'Power path'],
  ['layers', 'Layers'],
  ['specification', 'Specification'],
  ['finishes', 'Finishes'],
  ['workshop', 'Workshop'],
]

const chf = (n) => n.toLocaleString('en-CH')

// Reveal on scroll. Purely presentational: the content is in the DOM either way.
function useReveal() {
  const root = useRef(null)
  useEffect(() => {
    const nodes = root.current ? root.current.querySelectorAll('[data-reveal]') : null
    if (!nodes || !nodes.length) return
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.setAttribute('data-shown', ''))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.setAttribute('data-shown', '')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])
  return root
}

export default function App() {
  const [config, setConfig] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reserved, setReserved] = useState(false)
  const root = useReveal()

  const chosen = CONFIGURATIONS.find((c) => c.id === config)
  const maxThickness = Math.max(...LAYERS.map((l) => parseFloat(l.thickness)))

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
    <div className="page" ref={root}>
      <header className="masthead">
        <a className="masthead__brand" href="#top">
          <span className="masthead__house">Aubry &amp; Vent</span>
          <span className="masthead__caliber">Caliber 08</span>
        </a>
        <nav className="masthead__nav" aria-label="Sections">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
        </nav>
        <a className="masthead__cta" href="#reserve">
          Reserve
        </a>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero__inner">
            <p className="eyebrow" data-reveal>
              Manual winding · Vallée de Joux · Run of 200
            </p>
            <h1 className="hero__title" data-reveal>
              Caliber 08
            </h1>
            <p className="hero__lede" data-reveal>
              A manual-winding mechanical movement, made in a run of 200 and then never again.
            </p>
            <p className="hero__body" data-reveal>
              Seventy-two hours of stored energy, released one escape-wheel tooth at a time, five
              times a second, for three days from a single wind.
            </p>
            <div className="hero__actions" data-reveal>
              <a className="button button--solid" href="#reserve">
                Reserve a movement
              </a>
              <a className="button button--quiet" href="#power">
                Follow the energy
              </a>
            </div>
          </div>
          <dl className="figures" data-reveal>
            {HEADLINE_FIGURES.map(([value, label]) => (
              <div className="figures__item" key={label}>
                <dt className="figures__value">{value}</dt>
                <dd className="figures__label">{label}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="section section--power" id="power">
          <div className="section__head" data-reveal>
            <p className="section__index">01</p>
            <h2 className="section__title">How the energy travels</h2>
            <p className="section__note">
              Six stages, in the order the power passes through them — from a wound ribbon of steel
              to a hand that moves.
            </p>
          </div>
          <ol className="path">
            {POWER_PATH.map((s, i) => (
              <li className="stage" key={s.id} data-stage={s.id} data-reveal>
                <div className="stage__marker" aria-hidden="true">
                  <span className="stage__num">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className="stage__body">
                  <h3 className="stage__name">{s.name}</h3>
                  <p className="stage__detail">{s.detail}</p>
                </div>
                <p className="stage__figure">{s.figure}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section section--layers" id="layers">
          <div className="section__head" data-reveal>
            <p className="section__index">02</p>
            <h2 className="section__title">Four layers, front to back</h2>
            <p className="section__note">
              The movement is built up in four layers, 3.8mm from dial side to balance cock. The
              bars are drawn to relative scale.
            </p>
          </div>
          <div className="layers">
            {LAYERS.map((l) => (
              <article className="layer" key={l.id} data-layer={l.id} data-reveal>
                <h3 className="layer__name">{l.name}</h3>
                <p className="layer__thickness">{l.thickness}</p>
                <div className="layer__bar" aria-hidden="true">
                  <span
                    className="layer__fill"
                    style={{ width: `${(parseFloat(l.thickness) / maxThickness) * 100}%` }}
                  />
                </div>
                <p className="layer__note">{l.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section section--spec" id="specification">
          <div className="section__head" data-reveal>
            <p className="section__index">03</p>
            <h2 className="section__title">Specification</h2>
            <p className="section__note">Measured on the finished movement, not on the drawing.</p>
          </div>
          <dl className="spec" data-reveal>
            {SPECS.map(([k, v]) => (
              <div className="spec__row" key={k}>
                <dt className="spec__key">{k}</dt>
                <dd className="spec__value">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="section section--finishes" id="finishes">
          <div className="section__head" data-reveal>
            <p className="section__index">04</p>
            <h2 className="section__title">Three finishes</h2>
            <p className="section__note">
              Prices are for the movement alone; casing is arranged separately.
            </p>
          </div>
          <div className="finishes">
            {CONFIGURATIONS.map((c) => (
              <article
                className="finish"
                key={c.id}
                data-config={c.id}
                data-selected={config === c.id ? '' : undefined}
                data-reveal
              >
                <h3 className="finish__name">{c.name}</h3>
                <p className="finish__price">
                  <span className="finish__currency">CHF</span> {chf(c.price)}
                </p>
                <p className="finish__desc">{c.finish}</p>
                <dl className="finish__meta">
                  <div>
                    <dt>Delivery</dt>
                    <dd>{c.lead}</dd>
                  </div>
                  <div>
                    <dt>Allocation</dt>
                    <dd>{c.remaining} of the run still unallocated</dd>
                  </div>
                </dl>
                <div className="finish__gauge" aria-hidden="true">
                  <span style={{ width: `${(c.remaining / 200) * 100}%` }} />
                </div>
                <button type="button" className="finish__choose" onClick={() => chooseFinish(c.id)}>
                  {config === c.id ? 'Selected' : 'Choose this finish'}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="section section--workshop" id="workshop">
          <div className="section__head" data-reveal>
            <p className="section__index">05</p>
            <h2 className="section__title">The workshop</h2>
            <p className="section__note">Who makes it, how many, and what happens afterwards.</p>
          </div>
          <ul className="atelier">
            {ATELIER.map((a, i) => (
              <li className="atelier__item" key={a} data-reveal>
                <span className="atelier__num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p>{a}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="section section--reserve" id="reserve">
          <div className="reserve">
            <div className="reserve__intro" data-reveal>
              <p className="section__index">06</p>
              <h2 className="section__title">Reserve a movement</h2>
              <p className="reserve__terms">
                Reservations are not binding and no payment is taken now. We will write once, with
                the timing record of the movement allocated to you.
              </p>
            </div>

            {reserved ? (
              <div className="confirmation" role="status">
                <p className="confirmation__mark" aria-hidden="true">
                  ✓
                </p>
                <p className="confirmation__text">
                  Reserved. {name}, we have held one {chosen.name} movement at CHF{' '}
                  {chf(chosen.price)} and will write to {email}. {chosen.lead}.
                </p>
                <p className="confirmation__terms">
                  Nothing is binding and no payment has been taken.
                </p>
              </div>
            ) : (
              <form className="form" onSubmit={handleSubmit} data-reveal>
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
                <p className="form__summary">
                  {chosen
                    ? `${chosen.name} · CHF ${chf(chosen.price)} · ${chosen.lead}`
                    : 'No finish chosen yet.'}
                </p>
                <button type="submit" className="button button--solid">
                  Reserve a movement
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer__brand">
          <p className="footer__house">Aubry &amp; Vent</p>
          <p className="footer__line">Caliber 08. © 2026.</p>
        </div>
        <p className="footer__contact">
          Enquiries: <a href="mailto:atelier@aubryvent.ch">atelier@aubryvent.ch</a>
        </p>
        <p className="footer__links">
          <span>Servicing.</span> <span>Provenance.</span> <span>Terms of reservation.</span>
        </p>
      </footer>
    </div>
  )
}
