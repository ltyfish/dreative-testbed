import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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

const RUN_TOTAL = 200
const UNALLOCATED = CONFIGURATIONS.reduce((n, c) => n + c.remaining, 0)
const chf = (n) => n.toLocaleString('en-CH')

/* ------------------------------------------------------------------ hooks */

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

// Regional entrance. Fires against the top of the viewport so a reveal never
// resolves behind the reader, and never re-hides once it has played.
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-in')
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
      { rootMargin: '-4% 0px -18% 0px', threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

// One authored progress value for the power path, so the spine fill and the
// active station can never disagree with each other.
function usePathProgress(count) {
  const ref = useRef(null)
  const [state, setState] = useState({ p: 0, active: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let frame = 0
    const measure = () => {
      frame = 0
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const anchor = vh * 0.42 // read the path against the upper third
      const raw = (anchor - r.top) / Math.max(r.height - vh * 0.3, 1)
      const p = Math.min(1, Math.max(0, raw))
      const active = Math.min(count - 1, Math.max(0, Math.round(p * (count - 1))))
      setState((prev) => (prev.p === p && prev.active === active ? prev : { p, active }))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [count])
  return [ref, state]
}

/* -------------------------------------------------------------- fragments */

function Beat({ running }) {
  return (
    <span className={running ? 'beat is-running' : 'beat'} aria-hidden="true">
      <span className="beat-dot" />
      <span className="beat-dot" />
      <span className="beat-dot" />
      <span className="beat-dot" />
      <span className="beat-dot" />
    </span>
  )
}

// 200 movements, one mark each: what is spoken for and what is still open,
// split by the finish it is open for.
function AllocationMark({ highlight }) {
  const marks = useMemo(() => {
    const out = []
    for (let i = 0; i < RUN_TOTAL - UNALLOCATED; i += 1) out.push({ k: `a${i}`, of: null })
    CONFIGURATIONS.forEach((c) => {
      for (let i = 0; i < c.remaining; i += 1) out.push({ k: `${c.id}${i}`, of: c.id })
    })
    return out
  }, [])
  return (
    <div className="alloc">
      <div
        className="alloc-grid"
        role="img"
        aria-label={`${RUN_TOTAL - UNALLOCATED} of the ${RUN_TOTAL} movements are already allocated; ${UNALLOCATED} remain unallocated.`}
      >
        {marks.map((m) => (
          <span
            key={m.k}
            className={[
              'tick',
              m.of ? 'is-open' : 'is-taken',
              highlight && m.of === highlight ? 'is-lit' : '',
              highlight && m.of && m.of !== highlight ? 'is-dim' : '',
            ].join(' ')}
          />
        ))}
      </div>
      <dl className="alloc-key">
        <div>
          <dt>{RUN_TOTAL - UNALLOCATED}</dt>
          <dd>allocated</dd>
        </div>
        <div>
          <dt>{UNALLOCATED}</dt>
          <dd>still open</dd>
        </div>
        <div>
          <dt>{RUN_TOTAL}</dt>
          <dd>and then the tooling is retired</dd>
        </div>
      </dl>
    </div>
  )
}

/* ------------------------------------------------------------------ route */

export default function App() {
  const [config, setConfig] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reserved, setReserved] = useState(false)
  const [hoverConfig, setHoverConfig] = useState('')
  const [layer, setLayer] = useState('main')

  const reduced = useReducedMotion()
  const [pathRef, path] = usePathProgress(POWER_PATH.length)
  const stage = POWER_PATH[path.active]

  const beatRef = useReveal()
  const stackRef = useReveal()
  const specRef = useReveal()
  const atelierRef = useReveal()
  const chooseRef = useReveal()

  const chosen = CONFIGURATIONS.find((c) => c.id === config)
  const activeLayer = LAYERS.find((l) => l.id === layer)
  const totalMm = LAYERS.reduce((n, l) => n + l.mm, 0)

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !email || !config) return
    setReserved(true)
  }

  const onLayerKey = useCallback(
    (e) => {
      const i = LAYERS.findIndex((l) => l.id === layer)
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        setLayer(LAYERS[Math.min(LAYERS.length - 1, i + 1)].id)
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        setLayer(LAYERS[Math.max(0, i - 1)].id)
      }
    },
    [layer],
  )

  return (
    <div className="page">
      <a className="skip" href="#reserve">Skip to reservation</a>

      <header className="masthead">
        <span className="wordmark">Aubry &amp; Vent</span>
        <nav aria-label="Sections">
          <a href="#path">Power path</a>
          <a href="#stack">Construction</a>
          <a href="#spec">Specification</a>
          <a href="#workshop">Workshop</a>
          <a className="masthead-cta" href="#reserve">Reserve</a>
        </nav>
      </header>

      {/* 1 — orient */}
      <section className="hero" id="top">
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-inner">
          <p className="eyebrow">Vallée de Joux · Manual winding · 200 pieces</p>
          <h1>
            Caliber<span className="hero-num">08</span>
          </h1>
          <p className="hero-lede">
            A manual-winding mechanical movement, made in a run of 200 and then never again.
          </p>
          <dl className="hero-rail">
            <div><dt>72 h</dt><dd>reserve</dd></div>
            <div><dt>2.5 Hz</dt><dd>beat</dd></div>
            <div><dt>31.0 mm</dt><dd>diameter</dd></div>
            <div><dt>214</dt><dd>components</dd></div>
          </dl>
          <a className="btn btn-primary hero-btn" href="#reserve">Reserve a movement</a>
        </div>
        <span className="hero-line" aria-hidden="true" />
      </section>

      {/* 2 — characterise */}
      <section className="beat-band reveal" ref={beatRef}>
        <div className="beat-band-inner">
          <p className="beat-claim">
            Seventy-two hours of stored energy, released one escape-wheel tooth at a time, five times
            a second, for three days from a single wind.
          </p>
          <div className="beat-meter">
            <Beat running={!reduced} />
            <span className="beat-label">five releases · one second</span>
          </div>
        </div>
      </section>

      {/* 3 — demonstrate (peak) */}
      <section className="path" id="path" ref={pathRef} style={{ '--p': path.p }}>
        <div className="path-body">
          <aside className="path-aside">
            <div className="path-sticky">
              <h2 className="section-title">How the energy travels</h2>
              <p className="section-note">
                One push, handed along six times. Follow it down, or jump to any stage.
              </p>
              <nav className="path-jump" aria-label="Power path stages">
                {POWER_PATH.map((s, i) => (
                  <a
                    key={s.id}
                    href={`#stage-${s.id}`}
                    className={i === path.active ? 'is-active' : ''}
                    aria-current={i === path.active ? 'true' : undefined}
                  >
                    <span className="jump-i">{String(i + 1).padStart(2, '0')}</span>
                    <span className="jump-name">{s.name}</span>
                  </a>
                ))}
              </nav>
              <div className="path-state" aria-hidden="true">
                <span className="path-index">
                  Stage {String(path.active + 1).padStart(2, '0')} of 06
                </span>
                {(stage.id === 'escapement' || stage.id === 'balance') && <Beat running={!reduced} />}
              </div>
            </div>
          </aside>

          <ol className="path-list">
            <span className="path-charge" aria-hidden="true" />
            {POWER_PATH.map((s, i) => (
              <li
                key={s.id}
                id={`stage-${s.id}`}
                data-stage={s.id}
                className={['stage', i === path.active ? 'is-active' : '', i < path.active ? 'is-passed' : ''].join(' ')}
              >
                <p className="stage-index">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="stage-name">{s.name}</h3>
                <p className="stage-figure">{s.figure}</p>
                <p className="stage-detail">{s.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 4 — transform */}
      <section className="stack reveal" id="stack" ref={stackRef}>
        <div className="stack-head">
          <h2 className="section-title">Four layers, {totalMm.toFixed(1)}mm in all</h2>
          <p className="section-note">
            The movement seen edge-on, front to back. Each layer is drawn at its real relative
            thickness; together they are the {totalMm.toFixed(1)}mm on the specification.
          </p>
        </div>

        <div className="stack-body">
          <div className="stack-figure">
            <span className="stack-bracket" aria-hidden="true"><i>{totalMm.toFixed(1)}mm</i></span>
            <div
              className="stack-bars"
              role="tablist"
              aria-orientation="vertical"
              aria-label="Layers, front to back"
              onKeyDown={onLayerKey}
            >
              {LAYERS.map((l) => (
                <button
                  key={l.id}
                  role="tab"
                  type="button"
                  id={`tab-${l.id}`}
                  aria-selected={layer === l.id}
                  aria-controls={`panel-${l.id}`}
                  tabIndex={layer === l.id ? 0 : -1}
                  data-layer={l.id}
                  className={['bar', layer === l.id ? 'is-active' : ''].join(' ')}
                  style={{ '--h': `${l.mm}` }}
                  onClick={() => setLayer(l.id)}
                  onMouseEnter={() => setLayer(l.id)}
                  onFocus={() => setLayer(l.id)}
                >
                  <span className="bar-name">{l.name}</span>
                  <span className="bar-face" />
                  <span className="bar-mm">{l.thickness}</span>
                </button>
              ))}
            </div>
          </div>

          <div
            className="stack-note"
            id={`panel-${activeLayer.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeLayer.id}`}
          >
            <p className="stack-note-idx">
              Layer {LAYERS.findIndex((l) => l.id === activeLayer.id) + 1} of 4, front to back
            </p>
            <p className="stack-note-mm">{activeLayer.thickness}</p>
            <h3>{activeLayer.name}</h3>
            <p className="stack-note-body">{activeLayer.note}</p>
          </div>
        </div>
      </section>

      {/* 5 — prove, at rest */}
      <section className="spec reveal" id="spec" ref={specRef}>
        <div className="spec-head">
          <h2 className="section-title">Specification</h2>
          <p className="section-note">Measured on the running movement, not on the drawing.</p>
        </div>
        <dl className="spec-list">
          {SPECS.map(([k, v]) => (
            <div key={k} className="spec-row">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 6 — prove, with the run made visible */}
      <section className="workshop reveal" id="workshop" ref={atelierRef}>
        <div className="workshop-media" aria-hidden="true" />
        <div className="workshop-inner">
          <div className="workshop-lead">
            <h2 className="section-title">The workshop</h2>
            <p className="workshop-first">{ATELIER[2]}</p>
            <AllocationMark highlight={hoverConfig || config} />
          </div>
          <ul className="workshop-facts">
            {[ATELIER[0], ATELIER[1], ATELIER[3]].map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <p className="pledge">
            <span>{ATELIER[4]}</span>
          </p>
        </div>
      </section>

      {/* 7 — decide */}
      <section className="choose reveal" id="reserve" ref={chooseRef}>
        <div className="choose-head">
          <h2 className="section-title">Three finishes</h2>
          <p className="section-note">Prices are for the movement alone; casing is arranged separately.</p>
        </div>

        <div className="choose-body">
          <div className="finishes" role="radiogroup" aria-label="Finish">
            {CONFIGURATIONS.map((c) => (
              <label
                key={c.id}
                data-config={c.id}
                className={['finish', config === c.id ? 'is-chosen' : ''].join(' ')}
                onMouseEnter={() => setHoverConfig(c.id)}
                onMouseLeave={() => setHoverConfig('')}
              >
                <input
                  type="radio"
                  name="finish"
                  value={c.id}
                  checked={config === c.id}
                  onChange={() => setConfig(c.id)}
                  onFocus={() => setHoverConfig(c.id)}
                  onBlur={() => setHoverConfig('')}
                />
                <span className="finish-mark" aria-hidden="true" />
                <span className={`finish-swatch swatch-${c.id}`} aria-hidden="true" />
                <span className="finish-body">
                  <span className="finish-name">{c.name}</span>
                  <span className="finish-desc">{c.finish}</span>
                </span>
                <span className="finish-figures">
                  <span className="finish-price">CHF {chf(c.price)}</span>
                  <span className="finish-lead">{c.lead}</span>
                  <span className="finish-left">
                    <b>{c.remaining}</b> of the run still unallocated
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="reserve">
            {reserved ? (
              <div className="confirm" role="status">
                <p className="confirm-mark">Reserved</p>
                <p className="confirm-line">
                  {name}, we have held one <b>{chosen.name}</b> movement at{' '}
                  <b>CHF {chf(chosen.price)}</b> and will write to {email}. <b>{chosen.lead}</b>.
                </p>
                <p className="fineprint">
                  Reservations are not binding and no payment is taken now. We will write once, with
                  the timing record of the movement allocated to you.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <p className="reserve-title">Reserve a movement</p>
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

                <p className={chosen ? 'summary is-set' : 'summary'}>
                  {chosen ? (
                    <>
                      <b>{chosen.name}</b> · CHF {chf(chosen.price)} · {chosen.lead}
                    </>
                  ) : (
                    'No finish chosen yet.'
                  )}
                </p>

                <button className="btn btn-primary" type="submit">Reserve a movement</button>
                <p className="fineprint">
                  Reservations are not binding and no payment is taken now. We will write once, with
                  the timing record of the movement allocated to you.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="foot">
        <div className="foot-top">
          <span className="wordmark">Aubry &amp; Vent</span>
          <p className="foot-mail">
            Enquiries: <a href="mailto:atelier@aubryvent.ch">atelier@aubryvent.ch</a>
          </p>
          <nav aria-label="Legal">
            <a href="#top">Servicing</a>
            <a href="#top">Provenance</a>
            <a href="#top">Terms of reservation</a>
          </nav>
        </div>
        <p className="foot-credit">
          Photography: macro studies of mechanical movements by{' '}
          <a href="https://www.flickr.com/photos/76491533@N00" rel="noreferrer noopener" target="_blank">
            GuySie
          </a>
          , cropped and graded, under{' '}
          <a href="https://creativecommons.org/licenses/by-sa/2.0/" rel="noreferrer noopener" target="_blank">
            CC BY-SA 2.0
          </a>
          . They are reference imagery of the horological subject, not photographs of Caliber 08.
        </p>
        <p className="foot-legal">Aubry &amp; Vent. Caliber 08. © 2026.</p>
      </footer>
    </div>
  )
}
