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
// chosen for the page. `mm` mirrors `thickness` so the diagram can be drawn to scale.
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
  ['construction', 'Construction'],
  ['specification', 'Specification'],
  ['workshop', 'Workshop'],
  ['finishes', 'Finishes'],
]

const chf = (n) => n.toLocaleString('en-CH')

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

/* Reveals each marked element once, as it enters the viewport. */
function useReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll('[data-reveal="out"]')
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.setAttribute('data-reveal', 'in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.setAttribute('data-reveal', 'in')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  })
  return 'out'
}

/* Which section is currently being read, for the header marker. */
function useCurrentSection() {
  const [current, setCurrent] = useState('')
  useEffect(() => {
    const ids = NAV.map(([id]) => id).concat('reserve')
    function onScroll() {
      const line = window.innerHeight * 0.35
      let active = ''
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) active = id
      }
      setCurrent(active)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return current
}

/* Decorative balance wheel. It turns with the scroll, as the real one is driven. */
function BalanceWheel() {
  const ref = useRef(null)
  useEffect(() => {
    let frame = 0
    function onScroll() {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        if (ref.current) ref.current.style.setProperty('--turn', window.scrollY * 0.05 + 'deg')
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  const spiral = Array.from({ length: 240 }, (_, i) => {
    const t = (i / 239) * 5.6 * Math.PI
    const r = 16 + t * 5.2
    const x = (200 + r * Math.cos(t)).toFixed(1)
    const y = (200 + r * Math.sin(t)).toFixed(1)
    return (i === 0 ? 'M' : 'L') + x + ' ' + y
  }).join(' ')

  return (
    <svg className="wheel" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="rimGrad" cx="34%" cy="26%">
          <stop offset="0%" stopColor="#e2d8c6" />
          <stop offset="52%" stopColor="#918879" />
          <stop offset="100%" stopColor="#43403a" />
        </radialGradient>
      </defs>
      <path className="wheel-spring" d={spiral} fill="none" stroke="#7f96bd" strokeWidth="1.3" />
      <g ref={ref} className="wheel-spin">
        <circle cx="200" cy="200" r="150" fill="none" stroke="url(#rimGrad)" strokeWidth="12" />
        {[0, 1, 2].map((i) => (
          <line
            key={'s' + i}
            x1={(200 + 147 * Math.cos((i * 2 * Math.PI) / 3)).toFixed(1)}
            y1={(200 + 147 * Math.sin((i * 2 * Math.PI) / 3)).toFixed(1)}
            x2={(200 - 147 * Math.cos((i * 2 * Math.PI) / 3)).toFixed(1)}
            y2={(200 - 147 * Math.sin((i * 2 * Math.PI) / 3)).toFixed(1)}
            stroke="url(#rimGrad)"
            strokeWidth="5"
          />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <circle
            key={'w' + i}
            cx={(200 + 150 * Math.cos((i * Math.PI) / 2 + Math.PI / 4)).toFixed(1)}
            cy={(200 + 150 * Math.sin((i * Math.PI) / 2 + Math.PI / 4)).toFixed(1)}
            r="8.5"
            fill="#c2a24a"
          />
        ))}
        <circle cx="200" cy="200" r="17" fill="#6d655a" />
        <circle cx="200" cy="200" r="6" fill="#c2a24a" />
      </g>
    </svg>
  )
}

function Hero() {
  const KEY = [
    ['72 h', 'Power reserve'],
    ['2.5 Hz', 'Frequency'],
    ['3.8 mm', 'Height'],
    ['214', 'Components'],
  ]
  return (
    <section className="hero" id="top">
      <div className="hero-art" aria-hidden="true">
        <BalanceWheel />
      </div>
      <div className="hero-copy">
        <p className="eyebrow">Manual-winding movement · Edition of 200</p>
        <h1 className="display">
          Caliber <span className="numeral display-num">08</span>
        </h1>
        <p className="lede">
          A manual-winding mechanical movement, made in a run of 200 and then never again.
        </p>
        <p className="lede-sub">
          Seventy-two hours of stored energy, released one escape-wheel tooth at a time, five times a
          second, for three days from a single wind.
        </p>
        <dl className="keyfigures">
          {KEY.map(([v, k]) => (
            <div key={k}>
              <dt className="numeral">{v}</dt>
              <dd>{k}</dd>
            </div>
          ))}
        </dl>
        <div className="hero-actions">
          <button type="button" className="btn btn-solid" onClick={() => scrollToId('finishes')}>
            See the three finishes
          </button>
          <button type="button" className="btn btn-line" onClick={() => scrollToId('path')}>
            Follow the power path
          </button>
        </div>
      </div>
    </section>
  )
}

function SectionHead({ index, title, note, reveal }) {
  return (
    <div className="section-head" data-reveal={reveal}>
      <span className="section-index numeral">{index}</span>
      <h2>{title}</h2>
      {note && <p className="section-note">{note}</p>}
    </div>
  )
}

function PowerPath({ reveal }) {
  return (
    <section className="section section-path" id="path">
      <SectionHead
        index="01"
        title="How the energy travels"
        note="Six stages, in the order the power moves through them — from a wound ribbon of steel to the tip of the minute hand."
        reveal={reveal}
      />
      <ol className="path">
        {POWER_PATH.map((s, i) => (
          <li className="stage" key={s.id} data-stage={s.id} data-reveal={reveal}>
            <div className="stage-rail" aria-hidden="true">
              <span className="stage-node" />
            </div>
            <div className="stage-body">
              <p className="stage-num numeral">{String(i + 1).padStart(2, '0')}</p>
              <h3>{s.name}</h3>
              <p className="stage-detail">{s.detail}</p>
              <p className="stage-figure numeral">{s.figure}.</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Construction({ reveal }) {
  return (
    <section className="section section-layers" id="construction">
      <SectionHead
        index="02"
        title="Four layers, front to back"
        note="The movement is built up in four plates. The bars below are drawn to their true relative thickness."
        reveal={reveal}
      />
      <div className="layers">
        {LAYERS.map((l, i) => (
          <article
            className="layer"
            key={l.id}
            data-layer={l.id}
            data-reveal={reveal}
            style={{ '--i': i }}
          >
            <div className="layer-bar" aria-hidden="true">
              <span style={{ '--h': (l.mm / 1.4) * 100 + '%' }} />
            </div>
            <div className="layer-meta">
              <span className="layer-order numeral">{String(i + 1).padStart(2, '0')}</span>
              <h3>{l.name}</h3>
              <p className="layer-thickness numeral">{l.thickness}</p>
              <p className="layer-note">{l.note}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function Specification({ reveal }) {
  return (
    <section className="section section-spec" id="specification">
      <SectionHead index="03" title="Specification" reveal={reveal} />
      <dl className="spec" data-reveal={reveal}>
        {SPECS.map(([k, v]) => (
          <div className="spec-row" key={k}>
            <dt>{k}</dt>
            <dd className="numeral">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function Workshop({ reveal }) {
  return (
    <section className="section section-workshop" id="workshop">
      <SectionHead index="04" title="The workshop" reveal={reveal} />
      <ul className="atelier">
        {ATELIER.map((a, i) => (
          <li key={a} data-reveal={reveal} style={{ '--i': i }}>
            <span className="atelier-index numeral" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <p>{a}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Finishes({ config, setConfig, reveal }) {
  return (
    <section className="section section-finishes" id="finishes">
      <SectionHead
        index="05"
        title="Three finishes"
        note="Prices are for the movement alone; casing is arranged separately."
        reveal={reveal}
      />
      <div className="finishes">
        {CONFIGURATIONS.map((c, i) => {
          const selected = config === c.id
          return (
            <article
              className="finish"
              key={c.id}
              data-config={c.id}
              data-selected={selected ? 'true' : undefined}
              data-reveal={reveal}
              style={{ '--i': i }}
            >
              <h3>{c.name}</h3>
              <p className="finish-desc">{c.finish}</p>
              <p className="finish-price">
                <span className="cur">CHF</span>
                <span className="numeral">{chf(c.price)}</span>
              </p>
              <dl className="finish-facts">
                <div>
                  <dt>Delivery</dt>
                  <dd>{c.lead}</dd>
                </div>
                <div>
                  <dt>Allocation</dt>
                  <dd>
                    <span className="numeral">{c.remaining}</span> of the run still unallocated
                  </dd>
                </div>
              </dl>
              <div
                className="finish-gauge"
                aria-hidden="true"
                style={{ '--w': (c.remaining / 41) * 100 + '%' }}
              >
                <span />
              </div>
              <button
                type="button"
                className={selected ? 'btn btn-solid btn-wide' : 'btn btn-line btn-wide'}
                onClick={() => {
                  setConfig(c.id)
                  scrollToId('reserve')
                }}
              >
                {selected ? 'Selected — go to reservation' : 'Choose this finish'}
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function Reserve({ config, setConfig, chosen, reveal }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reserved, setReserved] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !email || !config) return
    setReserved(true)
  }

  return (
    <section className="section section-reserve" id="reserve">
      <div className="reserve-card" data-reveal={reveal}>
        <div className="reserve-intro">
          <span className="section-index numeral">06</span>
          <h2>Reserve a movement</h2>
          <p className="terms">
            Reservations are not binding and no payment is taken now. We will write once, with the
            timing record of the movement allocated to you.
          </p>
        </div>

        <div className="reserve-body">
          {reserved ? (
            <p role="status" className="confirmation">
              <span className="confirm-mark" aria-hidden="true" />
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
              <button type="submit" className="btn btn-solid btn-wide">
                Reserve a movement
              </button>
              {chosen && (
                <p className="reserve-echo">
                  {chosen.name} · <span className="numeral">CHF {chf(chosen.price)}</span> ·{' '}
                  {chosen.lead}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

export default function App() {
  const [config, setConfig] = useState('')
  const chosen = CONFIGURATIONS.find((c) => c.id === config)
  const current = useCurrentSection()
  const reveal = useReveal()

  return (
    <div className="page">
      <header className="masthead">
        <a className="brand" href="#top">
          <span className="brand-mark" aria-hidden="true">
            A&amp;V
          </span>
          <span className="brand-name">Aubry &amp; Vent</span>
        </a>
        <nav className="nav" aria-label="Sections">
          {NAV.map(([id, label]) => (
            <a key={id} href={'#' + id} aria-current={current === id ? 'true' : undefined}>
              {label}
            </a>
          ))}
        </nav>
        <button type="button" className="btn btn-line btn-sm" onClick={() => scrollToId('reserve')}>
          Reserve
        </button>
      </header>

      <main>
        <Hero />
        <PowerPath reveal={reveal} />
        <Construction reveal={reveal} />
        <Specification reveal={reveal} />
        <Workshop reveal={reveal} />
        <Finishes config={config} setConfig={setConfig} reveal={reveal} />
        <Reserve config={config} setConfig={setConfig} chosen={chosen} reveal={reveal} />
      </main>

      <footer className="footer">
        <div className="footer-row">
          <p className="footer-brand">Aubry &amp; Vent. Caliber 08. © 2026.</p>
          <p className="footer-mail">
            Enquiries: <a href="mailto:atelier@aubryvent.ch">atelier@aubryvent.ch</a>
          </p>
        </div>
        <p className="footer-links">
          <span>Servicing.</span>
          <span>Provenance.</span>
          <span>Terms of reservation.</span>
        </p>
      </footer>
    </div>
  )
}
