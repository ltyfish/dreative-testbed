import { useState, useEffect, useRef } from 'react'

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

const NAV = [
  ['path', 'Power path'],
  ['layers', 'Layers'],
  ['spec', 'Specification'],
  ['atelier', 'Workshop'],
  ['finishes', 'Finishes'],
]

const HERO_FIGURES = [
  ['72 h', 'Power reserve'],
  ['2.5 Hz', 'Frequency'],
  ['214', 'Components'],
  ['200', 'Movements, ever'],
]

const chf = (n) => n.toLocaleString('en-CH')
const pad = (i) => String(i).padStart(2, '0')

// Reveals a block once it has come far enough into view. The sections here are
// tall, so the threshold is deliberately small.
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.dataset.shown = 'true'
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        el.dataset.shown = 'true'
        io.disconnect()
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.03 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

function Section({ id, index, label, title, lede, children, wide }) {
  const ref = useReveal()
  return (
    <section id={id} className={wide ? 'section section--wide' : 'section'} ref={ref}>
      <div className="section__head">
        <p className="section__index">{index}</p>
        <div className="section__titles">
          <p className="section__label">{label}</p>
          <h2 className="section__title">{title}</h2>
        </div>
        {lede ? <p className="section__lede">{lede}</p> : null}
      </div>
      {children}
    </section>
  )
}

export default function App() {
  const [config, setConfig] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reserved, setReserved] = useState(false)

  const chosen = CONFIGURATIONS.find((c) => c.id === config)
  const heroRef = useReveal()
  const thickest = Math.max(...LAYERS.map((l) => l.mm))

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !email || !config) return
    setReserved(true)
  }

  function chooseAndScroll(id) {
    setConfig(id)
    const target = document.getElementById('reserve')
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="page">
      <a className="skip" href="#path">Skip to the movement</a>

      <header className="topbar">
        <a className="topbar__mark" href="#top">
          <span className="topbar__maker">Aubry &amp; Vent</span>
          <span className="topbar__ref">Cal. 08</span>
        </a>
        <nav className="topbar__nav" aria-label="Sections">
          {NAV.map(([id, text]) => (
            <a key={id} href={'#' + id}>{text}</a>
          ))}
        </nav>
        <a className="topbar__cta" href="#reserve">Reserve</a>
      </header>

      <main id="top">
        <section className="hero" ref={heroRef}>
          <div className="hero__inner">
            <p className="hero__eyebrow">
              <span>Aubry &amp; Vent</span>
              <span className="hero__rule" aria-hidden="true" />
              <span>Vallée de Joux</span>
            </p>
            <h1 className="hero__title">
              Caliber <span className="hero__num">08</span>
            </h1>
            <p className="hero__sub">
              A manual-winding mechanical movement, made in a run of 200 and then never again.
            </p>
            <p className="hero__body">
              Seventy-two hours of stored energy, released one escape-wheel tooth at a time, five
              times a second, for three days from a single wind.
            </p>
            <div className="hero__actions">
              <a className="btn btn--solid" href="#reserve">Reserve a movement</a>
              <a className="btn btn--ghost" href="#path">Follow the power path</a>
            </div>
          </div>

          <dl className="hero__figures">
            {HERO_FIGURES.map(([value, key]) => (
              <div key={key}>
                <dt>{value}</dt>
                <dd>{key}</dd>
              </div>
            ))}
          </dl>
        </section>

        <Section
          id="path"
          index="01"
          label="Power path"
          title="How the energy travels"
          lede="Six stages, from the wound ribbon to the tip of the minute hand. Each one takes what the last released."
        >
          <ol className="path">
            {POWER_PATH.map((s, i) => (
              <li className="stage" key={s.id} data-stage={s.id}>
                <p className="stage__index">{pad(i + 1)}</p>
                <div className="stage__body">
                  <h3 className="stage__name">{s.name}</h3>
                  <p className="stage__detail">{s.detail}</p>
                </div>
                <p className="stage__figure">{s.figure}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section
          id="layers"
          index="02"
          label="Construction"
          title="Four layers, front to back"
          lede="3.8mm of movement, in the order you would take it apart."
        >
          <ol className="layers">
            {LAYERS.map((l) => (
              <li className="layer" key={l.id} data-layer={l.id}>
                <div className="layer__head">
                  <h3 className="layer__name">{l.name}</h3>
                  <p className="layer__thickness">{l.thickness}</p>
                </div>
                <div className="layer__bar" aria-hidden="true">
                  <span style={{ width: (l.mm / thickest) * 100 + '%' }} />
                </div>
                <p className="layer__note">{l.note}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="spec" index="03" label="Specification" title="On paper">
          <dl className="spec">
            {SPECS.map(([k, v]) => (
              <div className="spec__row" key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="atelier" index="04" label="Workshop" title="Who makes it, and for how long">
          <ul className="atelier">
            {ATELIER.map((a, i) => (
              <li key={a}>
                <span className="atelier__index">{pad(i + 1)}</span>
                <p>{a}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="finishes"
          index="05"
          label="Finishes"
          title="Three ways to have it"
          lede="Prices are for the movement alone; casing is arranged separately."
          wide
        >
          <ul className="finishes">
            {CONFIGURATIONS.map((c) => (
              <li
                className={config === c.id ? 'finish is-chosen' : 'finish'}
                key={c.id}
                data-config={c.id}
              >
                <div className="finish__top">
                  <h3 className="finish__name">{c.name}</h3>
                  <p className="finish__desc">{c.finish}</p>
                </div>
                <p className="finish__price">
                  <span className="finish__currency">CHF</span> {chf(c.price)}
                </p>
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
                <button
                  type="button"
                  className="finish__choose"
                  onClick={() => chooseAndScroll(c.id)}
                  aria-pressed={config === c.id}
                >
                  {config === c.id ? 'Chosen — go to reservation' : 'Choose this finish'}
                </button>
              </li>
            ))}
          </ul>
        </Section>

        <section className="reserve" id="reserve">
          <div className="reserve__intro">
            <p className="section__index">06</p>
            <p className="section__label">Reservation</p>
            <h2 className="section__title">Reserve a movement</h2>
            <p className="reserve__note">
              Reservations are not binding and no payment is taken now. We will write once, with the
              timing record of the movement allocated to you.
            </p>
          </div>

          {reserved ? (
            <div className="confirm" role="status">
              <p className="confirm__mark">Reserved</p>
              <p className="confirm__text">
                {name}, we have held one {chosen.name} movement at CHF {chf(chosen.price)} and will
                write to {email}. {chosen.lead}.
              </p>
              <p className="confirm__fine">Nothing is binding and no payment has been taken.</p>
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
              <div className="form__foot">
                <button className="btn btn--solid" type="submit">Reserve a movement</button>
                <p className="form__summary">
                  {chosen
                    ? chosen.name + ', CHF ' + chf(chosen.price) + '. ' + chosen.lead + '.'
                    : 'Choose a finish to see its price and delivery date.'}
                </p>
              </div>
            </form>
          )}
        </section>
      </main>

      <footer className="footer">
        <p className="footer__mark">Aubry &amp; Vent. Caliber 08. © 2026.</p>
        <p className="footer__mail">
          Enquiries: <a href="mailto:atelier@aubryvent.ch">atelier@aubryvent.ch</a>
        </p>
        <ul className="footer__links">
          <li>Servicing</li>
          <li>Provenance</li>
          <li>Terms of reservation</li>
        </ul>
      </footer>
    </div>
  )
}
