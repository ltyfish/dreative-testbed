import { useState, useEffect, useRef, useCallback } from 'react'
import { Mail, ArrowDown, ArrowUpRight, Check, Infinity as InfinityIcon } from 'lucide-react'

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

// The lead a reader can land on before reading the sentence under it. The
// sentences themselves are the required workshop facts, unchanged and in order.
const ATELIER_LEADS = [
  { lead: '1', sub: 'Workshop, in the Vallée de Joux' },
  { lead: '11', sub: 'Watchmakers, two of them finishers' },
  { lead: '200', sub: 'Movements, then the tooling is retired' },
  { lead: '21', sub: 'Days on test, in six positions' },
  { lead: '∞', sub: 'Servicing, with no end date' },
]

const RUN_TOTAL = 200
const REMAINING = CONFIGURATIONS.reduce((n, c) => n + c.remaining, 0)
const ALLOCATED = RUN_TOTAL - REMAINING

const chf = (n) => n.toLocaleString('en-CH')

/* ---------------------------------------------------------------- marks --
   Six line marks, one per stage of the power path: a spiral for the spring, a
   toothed barrel, two meshing wheels, a lever and escape wheel, a balance with
   its hairspring, a dial with hands. They mark the stage for a reader who is
   scanning the list rather than reading it. */

function ring(n, r, len, cx = 12, cy = 12) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const c = Math.cos(a)
    const s = Math.sin(a)
    return <line key={i} x1={cx + c * r} y1={cy + s * r} x2={cx + c * (r + len)} y2={cy + s * (r + len)} />
  })
}

function StageMark({ id }) {
  const p = { viewBox: '0 0 24 24', className: 'mark', 'aria-hidden': 'true', focusable: 'false' }
  switch (id) {
    case 'mainspring':
      return (
        <svg {...p}>
          <path d="M12 12a1.6 1.6 0 1 1 1.6-1.6 3.7 3.7 0 1 1-3.7 3.7 5.8 5.8 0 1 1 5.8-5.8 7.9 7.9 0 1 1-7.9 7.9" />
        </svg>
      )
    case 'barrel':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2.4" />
          {ring(16, 7, 1.8)}
        </svg>
      )
    case 'train':
      return (
        <svg {...p}>
          <circle cx="8.5" cy="9" r="4.2" />
          {ring(10, 4.2, 1.6, 8.5, 9)}
          <circle cx="16.4" cy="16.2" r="2.7" />
          {ring(8, 2.7, 1.5, 16.4, 16.2)}
        </svg>
      )
    case 'escapement':
      return (
        <svg {...p}>
          <circle cx="9" cy="14.5" r="4.3" />
          {ring(9, 4.3, 1.7, 9, 14.5)}
          <path d="M17.8 4.6 15.2 11l3 2.5-2.4 5.1" />
          <circle cx="17.8" cy="4.6" r="1" />
        </svg>
      )
    case 'balance':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="5.2" />
          <path d="M4 12h16M12 4v16" />
        </svg>
      )
    default:
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="8.2" />
          <path d="M12 12V6.6M12 12l4.2 2.7" />
          <circle cx="12" cy="12" r="1" />
        </svg>
      )
  }
}

/* ------------------------------------------------------------- reveals -- */

function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-in')
      return
    }
    // Measured against the top of the viewport, so a region taller than one
    // screen has finished revealing long before the reader scrolls past it.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add('is-in')
            io.disconnect()
          }
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.01 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

function Section({ index, id, title, kicker, children, className = '' }) {
  const ref = useReveal()
  return (
    <section id={id} ref={ref} className={`section reveal ${className}`}>
      <header className="section-head">
        <span className="section-num">{index}</span>
        <h2>{title}</h2>
        {kicker ? <p className="section-kicker">{kicker}</p> : null}
      </header>
      {children}
    </section>
  )
}

/* --------------------------------------------------------- power gauge -- */

function ReserveGauge() {
  const [wound, setWound] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setWound(true), 300)
    return () => clearTimeout(t)
  }, [])
  const R = 86
  const C = 2 * Math.PI * R
  const arc = C * 0.75
  const start = -215
  return (
    <figure className={`gauge ${wound ? 'is-wound' : ''}`}>
      <svg viewBox="0 0 220 220" role="img" aria-label="Power reserve: 72 hours from one full wind">
        <g transform={`rotate(${start} 110 110)`}>
          <circle className="gauge-track" cx="110" cy="110" r={R} strokeDasharray={`${arc} ${C}`} />
          <circle
            className="gauge-fill"
            cx="110"
            cy="110"
            r={R}
            strokeDasharray={`${arc} ${C}`}
            style={{ '--arc': arc }}
          />
        </g>
        {Array.from({ length: 7 }, (_, i) => {
          const a = ((start + (i / 6) * 270) * Math.PI) / 180
          const c = Math.cos(a)
          const s = Math.sin(a)
          const long = i % 2 === 0
          return (
            <line
              key={i}
              className={long ? 'tick tick-long' : 'tick'}
              x1={110 + c * (R - 13)}
              y1={110 + s * (R - 13)}
              x2={110 + c * (R - (long ? 24 : 19))}
              y2={110 + s * (R - (long ? 24 : 19))}
            />
          )
        })}
      </svg>
      <figcaption>
        <span className="gauge-value">72</span>
        <span className="gauge-unit">hours</span>
        <span className="gauge-note">from one wind of 6.5 turns</span>
      </figcaption>
    </figure>
  )
}

/* ----------------------------------------------------------- power path -- */

function PowerPath() {
  const wrapRef = useRef(null)
  const [progress, setProgress] = useState(0)

  const onScroll = useCallback(() => {
    const el = wrapRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const vh = window.innerHeight
    // Zero as the list enters from the bottom, one by the time the region is
    // centred: the trace finishes while the reader is still looking at it,
    // never behind them.
    const total = ((vh + r.height) / 2) * 0.96
    const done = vh - r.top
    setProgress(Math.max(0, Math.min(1, done / total)))
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1)
      return
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [onScroll])

  const reached = Math.round(progress * POWER_PATH.length * 1.12)

  return (
    <div className="path" ref={wrapRef}>
      <div className="path-spine" aria-hidden="true">
        <span className="path-spine-fill" style={{ transform: `scaleY(${progress})` }} />
      </div>
      <ol className="path-list">
        {POWER_PATH.map((s, i) => (
          <li key={s.id} data-stage={s.id} className={`path-stage ${i < reached ? 'is-live' : ''}`} tabIndex={0}>
            <span className="path-node">
              <StageMark id={s.id} />
            </span>
            <span className="path-step">{String(i + 1).padStart(2, '0')}</span>
            <div className="path-body">
              <h3>{s.name}</h3>
              <p>{s.detail}</p>
            </div>
            <p className="path-figure">{s.figure}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

/* --------------------------------------------------------- layer stack -- */

const mm = (t) => parseFloat(t)
const TOTAL_MM = LAYERS.reduce((n, l) => n + mm(l.thickness), 0)

function Stack() {
  const [active, setActive] = useState(null)
  const [exploded, setExploded] = useState(true)

  // Oblique plates. Each front edge is the real thickness, to one scale.
  const SCALE = 26
  const GAP = 62
  let running = 0
  const plates = LAYERS.map((l, i) => {
    const h = mm(l.thickness) * SCALE
    const y = running
    running += h
    return { ...l, h, collapsedY: y, explodedY: i * GAP }
  })
  const collapsedTop = (3 * GAP + plates[3].h - running) / 2

  return (
    <div className={`stack ${exploded ? 'is-exploded' : ''}`}>
      <div className="stack-figure">
        <svg viewBox="0 0 440 290" role="img" aria-label="The four plates of Caliber 08, drawn to their real thicknesses">
          <g transform="translate(24 96)">
            {plates.map((p) => {
              const dy = exploded ? p.explodedY : collapsedTop + p.collapsedY
              const dim = active && active !== p.id
              return (
                <g
                  key={p.id}
                  className={`plate ${active === p.id ? 'is-active' : ''} ${dim ? 'is-dim' : ''}`}
                  style={{ transform: `translateY(${dy}px)` }}
                  onMouseEnter={() => setActive(p.id)}
                  onMouseLeave={() => setActive(null)}
                >
                  <polygon className="plate-side" points={`46,0 286,0 286,${p.h} 46,${p.h}`} />
                  <polygon className="plate-end" points={`286,0 386,-52 386,${p.h - 52} 286,${p.h}`} />
                  <polygon className="plate-face" points="46,0 286,0 386,-52 146,-52" />
                  <line className="plate-lead" x1="46" y1={p.h / 2} x2="-18" y2={p.h / 2} />
                </g>
              )
            })}
          </g>
        </svg>
        <div className="stack-controls">
          <button type="button" className="btn btn-quiet stack-toggle" onClick={() => setExploded((v) => !v)}>
            {exploded ? 'Assemble the stack' : 'Separate the plates'}
          </button>
          <p className="stack-caption">{exploded ? 'Exploded view' : 'Assembled — 3.8mm'}</p>
        </div>
      </div>

      <div className="stack-side">
        <ul className="layer-list">
          {plates.map((l) => (
            <li key={l.id} data-layer={l.id}>
              <button
                type="button"
                className={`layer ${active === l.id ? 'is-active' : ''}`}
                onMouseEnter={() => setActive(l.id)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(l.id)}
                onBlur={() => setActive(null)}
                aria-pressed={active === l.id}
              >
                <span className="layer-top">
                  <span className="layer-name">{l.name}</span>
                  <span className="layer-mm">{l.thickness}</span>
                </span>
                <span className="layer-note">{l.note}</span>
                <span className="layer-bar" aria-hidden="true">
                  <span style={{ width: `${(mm(l.thickness) / TOTAL_MM) * 100}%` }} />
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="stack-total">
          <span>{TOTAL_MM.toFixed(1)}mm</span> of movement, front to back — the thicknesses in the drawing are to
          scale.
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ the page -- */

export default function App() {
  const [config, setConfig] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reserved, setReserved] = useState(false)

  const chosen = CONFIGURATIONS.find((c) => c.id === config)

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !email || !config) return
    setReserved(true)
  }

  const specRef = useReveal()
  const atelierRef = useReveal()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 60)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])

  return (
    <div className="page">
      <header className={`topbar ${scrolled ? 'is-stuck' : ''}`}>
        <a className="wordmark" href="#top">
          Aubry <span>&amp;</span> Vent
        </a>
        <p className="topbar-mid">Caliber 08 · manual winding · Vallée de Joux</p>
        <p className="topbar-run">
          <strong>{REMAINING}</strong> of {RUN_TOTAL} unallocated
        </p>
        <a className="btn btn-solid btn-sm" href="#reserve">
          Reserve
        </a>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-type">
            <p className="eyebrow">Movement · one run of 200</p>
            <h1>
              Caliber<span className="hero-num">08</span>
            </h1>
            <p className="hero-claim">
              A manual-winding mechanical movement, made in a run of 200 and then never again.
            </p>
            <p className="hero-lede">
              Seventy-two hours of stored energy, released one escape-wheel tooth at a time, five times a second, for
              three days from a single wind.
            </p>
            <div className="hero-actions">
              <a className="btn btn-solid" href="#reserve">
                Reserve a movement
              </a>
              <a className="btn btn-line" href="#path">
                Follow the energy <ArrowDown size={15} strokeWidth={1.6} aria-hidden="true" />
              </a>
            </div>
            <dl className="hero-figures">
              <div>
                <dt>Height</dt>
                <dd>3.8mm</dd>
              </div>
              <div>
                <dt>Diameter</dt>
                <dd>31.0mm</dd>
              </div>
              <div>
                <dt>Components</dt>
                <dd>214</dd>
              </div>
              <div>
                <dt>Finishing</dt>
                <dd>62 h</dd>
              </div>
            </dl>
          </div>
          <ReserveGauge />
        </section>

        <Section
          index="01"
          id="path"
          title="Where the energy goes"
          kicker="Six stages, in the order the energy travels through them — three days of it, spent one tooth at a time."
        >
          <PowerPath />
        </Section>

        <Section
          index="02"
          id="stack"
          title="Four plates, 3.8 millimetres"
          kicker="Front of the movement to back. Take a plate to isolate it, or put the stack back together."
          className="section-stack"
        >
          <Stack />
        </Section>

        <section id="spec" className="section section-spec reveal" ref={specRef}>
          <header className="section-head">
            <span className="section-num">03</span>
            <h2>Specification</h2>
          </header>
          <div className="spec-grid">
            <p className="spec-shout">
              <span>62</span>
              hours of hand finishing, on 214 parts, inside 3.8 millimetres.
            </p>
            <dl className="spec-list">
              {SPECS.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="workshop" className="atelier reveal" ref={atelierRef}>
          <div className="atelier-band">
            <img
              src="/media/lac-de-joux-ccby.jpg"
              alt="The Lac de Joux in the Vallée de Joux, where the workshop is."
              width="1280"
              height="351"
              loading="lazy"
            />
            <div className="atelier-band-type">
              <span className="section-num">04</span>
              <h2>The workshop</h2>
            </div>
          </div>

          <div className="atelier-body">
            <div className="run">
              <p className="run-head">
                <strong>{ALLOCATED}</strong> allocated<span className="run-sep" />
                <strong>{REMAINING}</strong> unallocated
              </p>
              <div className="run-grid" role="img" aria-label={`${ALLOCATED} of ${RUN_TOTAL} movements allocated`}>
                {Array.from({ length: RUN_TOTAL }, (_, i) => (
                  <span key={i} className={i < ALLOCATED ? 'run-tick is-taken' : 'run-tick'} />
                ))}
              </div>
              <p className="run-foot">The whole run of 200, one mark each.</p>
            </div>

            <ol className="facts">
              {ATELIER.map((a, i) => (
                <li key={a}>
                  <span className="fact-lead" aria-hidden="true">
                    {ATELIER_LEADS[i].lead === '∞' ? (
                      <InfinityIcon size={34} strokeWidth={1.2} />
                    ) : (
                      ATELIER_LEADS[i].lead
                    )}
                  </span>
                  <span className="fact-sub">{ATELIER_LEADS[i].sub}</span>
                  <p>{a}</p>
                </li>
              ))}
            </ol>

            <figure className="lineage">
              <span className="lineage-frame">
              <img
                src="/media/cabrier-movement-met-cc0.jpg"
                alt="Gilt and silver watch movement by Charles Cabrier, London, mid-eighteenth century."
                width="1280"
                height="1280"
                loading="lazy"
              />
              </span>
              <figcaption>
                Not ours: Charles Cabrier, London, mid-18th century. A movement built to be opened, looked at, and kept
                running — which is the only reason a caliber deserves parts kept for it three centuries later.
                <span>Metropolitan Museum of Art, CC0.</span>
              </figcaption>
            </figure>
          </div>
        </section>

        <Section
          index="05"
          id="finishes"
          title="Three finishes"
          kicker="Prices are for the movement alone; casing is arranged separately. Choosing here fills in the reservation below."
          className="section-finishes"
        >
          <ul className="finishes">
            {CONFIGURATIONS.map((c) => (
              <li key={c.id} data-config={c.id}>
                <button
                  type="button"
                  className={`finish finish-${c.id} ${config === c.id ? 'is-chosen' : ''}`}
                  onClick={() => setConfig(c.id)}
                  aria-pressed={config === c.id}
                >
                  <span className="finish-swatch" aria-hidden="true" />
                  <span className="finish-name">{c.name}</span>
                  <span className="finish-desc">{c.finish}</span>
                  <span className="finish-price">
                    <em>CHF</em> {chf(c.price)}
                  </span>
                  <span className="finish-meta">
                    <span className="finish-lead">{c.lead}</span>
                    <span className="finish-left">
                      <span className="finish-left-bar" aria-hidden="true">
                        <span style={{ width: `${(c.remaining / 41) * 100}%` }} />
                      </span>
                      <span>{c.remaining} of the run still unallocated</span>
                    </span>
                  </span>
                  <span className="finish-pick">
                    {config === c.id ? (
                      <>
                        <Check size={14} strokeWidth={2} aria-hidden="true" /> Chosen
                      </>
                    ) : (
                      'Choose this finish'
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          index="06"
          id="reserve"
          title="Reserve a movement"
          kicker="Reservations are not binding and no payment is taken now. We will write once, with the timing record of the movement allocated to you."
          className="section-reserve"
        >
          <div className="reserve">
            {reserved ? (
              <p className="slip slip-done" role="status">
                <span className="slip-stamp">Reserved</span>
                <span className="slip-line">
                  <em>{name}</em>, we have held one {chosen.name} movement at CHF {chf(chosen.price)} and will write to{' '}
                  {email}. {chosen.lead}.
                </span>
                <span className="slip-foot">Not binding. No payment has been taken.</span>
              </p>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="reserve-form">
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
                  <button type="submit" className="btn btn-solid btn-wide">
                    Reserve a movement <ArrowUpRight size={16} strokeWidth={1.6} aria-hidden="true" />
                  </button>
                </form>

                <aside className={`slip ${chosen ? 'is-filled' : ''}`} aria-live="polite">
                  <span className="slip-title">Reservation</span>
                  <dl>
                    <div>
                      <dt>Finish</dt>
                      <dd>{chosen ? chosen.name : <span className="slip-blank">Not chosen yet</span>}</dd>
                    </div>
                    <div>
                      <dt>Price</dt>
                      <dd>{chosen ? `CHF ${chf(chosen.price)}` : <span className="slip-blank">—</span>}</dd>
                    </div>
                    <div>
                      <dt>Delivery</dt>
                      <dd>{chosen ? chosen.lead : <span className="slip-blank">—</span>}</dd>
                    </div>
                  </dl>
                  <p className="slip-foot">Not binding. No payment is taken now.</p>
                </aside>
              </>
            )}
          </div>
        </Section>
      </main>

      <footer className="foot">
        <div className="foot-main">
          <p className="foot-mark">
            Aubry <span>&amp;</span> Vent
          </p>
          <p className="foot-addr">Vallée de Joux, Switzerland</p>
          <a className="foot-mail" href="mailto:atelier@aubryvent.ch">
            <Mail size={15} strokeWidth={1.6} aria-hidden="true" /> atelier@aubryvent.ch
          </a>
        </div>
        <nav className="foot-links" aria-label="Further information">
          <a href="#workshop">Servicing</a>
          <a href="#workshop">Provenance</a>
          <a href="#reserve">Terms of reservation</a>
        </nav>
        <p className="foot-credit">
          Images: watch movement by Charles Cabrier, Metropolitan Museum of Art (CC0); Lac de Joux by apollo13,
          Wikimedia Commons (CC BY 3.0).
        </p>
        <p className="foot-legal">Aubry &amp; Vent. Caliber 08. © 2026.</p>
      </footer>
    </div>
  )
}
