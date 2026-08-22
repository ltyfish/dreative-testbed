import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
    unit: 'torque band across the run',
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

const ATELIER_LABELS = ['Workshop', 'Hands', 'The run', 'Testing', 'Servicing']

const SECTIONS = [
  ['path', 'Power path'],
  ['layers', 'Four layers'],
  ['specification', 'Specification'],
  ['finishes', 'Finishes'],
  ['workshop', 'Workshop'],
]

const RUN_TOTAL = 200
const chf = (n) => n.toLocaleString('en-CH')

/* ------------------------------------------------------------------ hooks */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return reduced
}

// The escapement runs at the movement's real rate: five releases a second.
function useBeat(running) {
  const [beat, setBeat] = useState(0)
  useEffect(() => {
    if (!running) return undefined
    const id = window.setInterval(() => setBeat((b) => b + 1), 200)
    return () => window.clearInterval(id)
  }, [running])
  return beat
}

function useVisible(ref) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return undefined
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.15 })
    io.observe(node)
    return () => io.disconnect()
  }, [ref])
  return visible
}

// Scroll progress across a section, measured against the top of the viewport
// so nothing resolves behind the reader.
function useScrollProgress(ref) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const node = ref.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      const vh = window.innerHeight || 1
      const span = vh * 0.1 + rect.height
      const t = (vh * 0.7 - rect.top) / span
      setProgress(Math.min(1, Math.max(0, t)))
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ref])
  return progress
}

function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'))
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.classList.add('is-in'))
      return undefined
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
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])
}

/* ------------------------------------------------- the movement, in plan */

// The path drawn between the parts is the power path: the order of the line is
// the order the energy travels.
const TRACK = 'M130,250 L182,176 L236,150 L294,212 L266,292 L178,322'

function MovementPlan({ active, pulse, beat, labelled }) {
  const trackRef = useRef(null)
  const [dot, setDot] = useState(null)

  useEffect(() => {
    const path = trackRef.current
    if (!path || pulse == null) return
    const len = path.getTotalLength()
    const p = path.getPointAtLength(len * Math.min(1, Math.max(0, pulse)))
    setDot({ x: p.x, y: p.y })
  }, [pulse])

  const swing = beat % 2 === 0 ? 26 : -26
  const teeth = Array.from({ length: 15 }, (_, i) => i)

  return (
    <svg
      className="plan"
      viewBox="0 0 420 440"
      role="img"
      aria-label="Plan view of Caliber 08: mainspring, barrel, gear train, escapement, balance and motion work, connected in the order energy travels through them."
    >
      <defs>
        <radialGradient id="plate-field" cx="38%" cy="28%" r="82%">
          <stop offset="0%" stopColor="#262B32" />
          <stop offset="100%" stopColor="#14171B" />
        </radialGradient>
      </defs>

      <circle cx="210" cy="235" r="166" fill="url(#plate-field)" stroke="rgba(233,224,206,.16)" />
      <circle cx="210" cy="235" r="156" fill="none" stroke="rgba(233,224,206,.09)" strokeDasharray="1 7" />

      <path ref={trackRef} d={TRACK} className="plan-track" />

      {/* mainspring, coiled in the barrel */}
      <g className={`plan-part${active === 'mainspring' ? ' is-active' : ''}`}>
        <circle cx="130" cy="250" r="47" className="plan-wheel" />
        <path
          className="plan-spring"
          d="M130,246 a4,4 0 1,1 -4,4 a8,8 0 1,1 8,8 a12,12 0 1,1 -12,-12 a16,16 0 1,1 16,-16 a20,20 0 1,1 -20,20 a24,24 0 1,1 24,24 a28,28 0 1,1 -28,-28 a32,32 0 1,1 32,-32 a36,36 0 1,1 -36,36"
        />
      </g>

      {/* barrel and stop-work */}
      <g className={`plan-part${active === 'barrel' ? ' is-active' : ''}`}>
        <circle cx="182" cy="176" r="17" className="plan-wheel" />
        <path d="M182,159 L182,193 M165,176 L199,176" className="plan-spoke" />
      </g>

      {/* gear train: four wheels */}
      <g className={`plan-part${active === 'train' ? ' is-active' : ''}`}>
        <circle cx="236" cy="150" r="31" className="plan-wheel" />
        <circle cx="272" cy="176" r="17" className="plan-wheel" />
        <circle cx="212" cy="192" r="14" className="plan-wheel" />
        <circle cx="252" cy="120" r="11" className="plan-wheel" />
        <path d="M236,119 L236,181 M205,150 L267,150 M214,128 L258,172 M258,128 L214,172" className="plan-spoke" />
      </g>

      {/* escapement: steps once per release */}
      <g className={`plan-part${active === 'escapement' ? ' is-active' : ''}`}>
        <g className="plan-escape" style={{ transform: `rotate(${beat * 12}deg)`, transformOrigin: '294px 212px' }}>
          <circle cx="294" cy="212" r="20" className="plan-wheel" />
          {teeth.map((i) => (
            <line
              key={i}
              className="plan-tooth"
              x1={294 + 20 * Math.cos((i * 24 * Math.PI) / 180)}
              y1={212 + 20 * Math.sin((i * 24 * Math.PI) / 180)}
              x2={294 + 27 * Math.cos((i * 24 * Math.PI) / 180)}
              y2={212 + 27 * Math.sin((i * 24 * Math.PI) / 180)}
            />
          ))}
        </g>
        <path
          className="plan-fork"
          d="M294,240 L286,258 M294,240 L302,258 M294,240 L294,268"
          style={{ transform: `rotate(${swing > 0 ? 7 : -7}deg)`, transformOrigin: '294px 262px' }}
        />
      </g>

      {/* balance and hairspring */}
      <g className={`plan-part${active === 'balance' ? ' is-active' : ''}`}>
        <g className="plan-balance" style={{ transform: `rotate(${swing}deg)`, transformOrigin: '266px 292px' }}>
          <circle cx="266" cy="292" r="43" className="plan-wheel" />
          <circle cx="266" cy="292" r="36" className="plan-rim" />
          <path d="M223,292 L309,292 M266,249 L266,335" className="plan-spoke" />
          <circle cx="266" cy="256" r="4" className="plan-weight" />
          <circle cx="266" cy="328" r="4" className="plan-weight" />
          <circle cx="230" cy="292" r="4" className="plan-weight" />
          <circle cx="302" cy="292" r="4" className="plan-weight" />
        </g>
        <path
          className="plan-spring"
          d="M266,289 a3,3 0 1,1 -3,3 a7,7 0 1,1 7,7 a11,11 0 1,1 -11,-11 a15,15 0 1,1 15,-15 a19,19 0 1,1 -19,19"
        />
      </g>

      {/* motion work and hands */}
      <g className={`plan-part${active === 'hands' ? ' is-active' : ''}`}>
        <circle cx="178" cy="322" r="25" className="plan-wheel" />
        <circle cx="178" cy="322" r="13" className="plan-rim" />
        <path d="M178,322 L178,301 M178,322 L193,331" className="plan-hands" />
      </g>

      {dot && <circle className="plan-pulse" cx={dot.x} cy={dot.y} r="6.5" />}

      {labelled && (
        <g className="plan-labels">
          <line x1="177" y1="250" x2="243" y2="250" />
          <text x="249" y="254">Mainspring — 72 h</text>
          <line x1="266" y1="336" x2="266" y2="388" />
          <text x="266" y="406" textAnchor="middle">Balance — 2.5 Hz</text>
        </g>
      )}
    </svg>
  )
}

/* -------------------------------------------------------------- sections */

function Hero() {
  const ref = useRef(null)
  const visible = useVisible(ref)
  const reduced = usePrefersReducedMotion()
  const beat = useBeat(visible && !reduced)

  return (
    <header className="hero" ref={ref}>
      <div className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">Aubry &amp; Vent — Vallée de Joux</p>
          <h1>
            Caliber<span className="hero-num">08</span>
          </h1>
          <p className="hero-lede">
            A manual-winding mechanical movement, made in a run of 200 and then never again.
          </p>
          <p className="hero-body">
            Seventy-two hours of stored energy, released one escape-wheel tooth at a time, five times a
            second, for three days from a single wind.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#reserve">Reserve a movement</a>
            <a className="btn btn-ghost" href="#path">Follow the energy</a>
          </div>
          <dl className="hero-figures">
            <div>
              <dt>Diameter</dt>
              <dd>31.0<span>mm</span></dd>
            </div>
            <div>
              <dt>Height</dt>
              <dd>3.8<span>mm</span></dd>
            </div>
            <div>
              <dt>Components</dt>
              <dd>214</dd>
            </div>
            <div>
              <dt>Finishing</dt>
              <dd>62<span>h</span></dd>
            </div>
          </dl>
        </div>

        <figure className="hero-plan">
          <MovementPlan active={null} pulse={null} beat={beat} labelled />
          <figcaption>
            <span className={`beat-dot${visible && !reduced ? ' is-running' : ''}`} aria-hidden="true" />
            Plan view of the caliber. The escapement on this drawing steps at the movement’s real
            rate — five releases a second.
          </figcaption>
        </figure>
      </div>
    </header>
  )
}

function PowerPath() {
  const ref = useRef(null)
  const progress = useScrollProgress(ref)
  const visible = useVisible(ref)
  const reduced = usePrefersReducedMotion()
  const beat = useBeat(visible && !reduced)
  const [hovered, setHovered] = useState(null)
  const index = Math.min(POWER_PATH.length - 1, Math.floor(progress * POWER_PATH.length))
  const active = hovered || POWER_PATH[index].id

  return (
    <section className="section section-path" id="path" ref={ref}>
      <div className="section-head" data-reveal>
        <p className="eyebrow">01 — The power path</p>
        <h2>Six stages, in the order the energy travels</h2>
        <p className="section-lede">
          One wind puts seventy-two hours into a steel ribbon. Everything after it is a controlled way
          of giving that back — five times a second, without letting the rate drift.
        </p>
      </div>

      <div className="path-layout">
        <div className="path-figure">
          <div className="path-sticky">
            <MovementPlan active={active} pulse={progress} beat={beat} labelled={false} />
            <p className="path-readout">
              <span className="path-count">{String(index + 1).padStart(2, '0')} / 06</span>
              <span className="path-name">{POWER_PATH[index].name}</span>
            </p>
          </div>
        </div>

        <ol className="stages" data-reveal>
          {POWER_PATH.map((stage, i) => (
            <li
              key={stage.id}
              data-stage={stage.id}
              className={`stage${active === stage.id ? ' is-live' : ''}`}
              onMouseEnter={() => setHovered(stage.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="stage-index">{String(i + 1).padStart(2, '0')}</span>
              <div className="stage-body">
                <h3>{stage.name}</h3>
                <p className="stage-figure">
                  <b>{stage.lead}</b>
                  <span>{stage.unit}</span>
                </p>
                <p className="stage-detail">{stage.detail}</p>
                <p className="stage-full">{stage.figure}.</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <figure className="plate-figure" data-reveal>
        <img
          src="/media/horology-plate-xii-wellcome.jpg"
          alt="Coloured engraving, Horology Plate XII, showing a pocket watch mainspring, barrel, gear train, escapement and balance drawn as separate parts."
          loading="lazy"
          width="1000"
          height="1320"
        />
        <figcaption>
          <b>The same six stages, drawn in 1810.</b>
          <i>Clocks: mechanism of a pocket watch</i>, coloured engraving by J. Pass. Wellcome
          Collection, public domain. The order has not changed since. The tolerances have.
        </figcaption>
      </figure>
    </section>
  )
}

function Layers() {
  const [active, setActive] = useState(null)
  const total = LAYERS.reduce((sum, l) => sum + l.mm, 0)
  let offset = 0
  const stack = LAYERS.map((l) => {
    const item = { ...l, offset }
    offset += l.mm
    return item
  })

  return (
    <section className="section section-layers" id="layers">
      <div className="section-head" data-reveal>
        <p className="eyebrow">02 — Construction</p>
        <h2>Four layers, 3.8mm end to end</h2>
        <p className="section-lede">
          Front of the movement to back. These four thicknesses are the entire height of the caliber:
          there is nothing else in it.
        </p>
      </div>

      <div className="layers-layout">
        <div className="layers-figure" data-reveal>
          <div className="stack-scene">
            <div className="stack-shadow" aria-hidden="true" />
            <div className={`stack${active ? ' is-exploded' : ''}`}>
              {stack.map((l, i) => (
                <button
                  type="button"
                  key={l.id}
                  data-layer={l.id}
                  className={`plate plate-${l.id}${active === l.id ? ' is-active' : ''}${
                    active && active !== l.id ? ' is-dim' : ''
                  }`}
                  style={{ '--i': i }}
                  onMouseEnter={() => setActive(l.id)}
                  onFocus={() => setActive(l.id)}
                  onMouseLeave={() => setActive(null)}
                  onBlur={() => setActive(null)}
                  onClick={() => setActive((cur) => (cur === l.id ? null : l.id))}
                  aria-pressed={active === l.id}
                >
                  <span className="plate-face" aria-hidden="true" />
                  <span className="plate-tag" aria-hidden="true">
                    {l.thickness}
                  </span>
                  <span className="sr-only">
                    {l.name}, {l.thickness}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <p className="stack-hint">Hover, tap or tab a plate to lift it out of the stack</p>

          <div className="elevation">
            {stack.map((l) => (
              <div
                key={l.id}
                className={`band band-${l.id}${active === l.id ? ' is-active' : ''}`}
                style={{ '--h': (l.mm / total) * 100 }}
                onMouseEnter={() => setActive(l.id)}
                onMouseLeave={() => setActive(null)}
              >
                <span className="band-name">{l.name}</span>
                <span className="band-mm">{l.thickness}</span>
              </div>
            ))}
          </div>
          <p className="elevation-caption">Section through the movement, drawn to scale. 3.8mm total.</p>
        </div>

        <ol className="layer-list" data-reveal>
          {stack.map((l) => (
            <li
              key={l.id}
              className={`layer${active === l.id ? ' is-active' : ''}`}
              onMouseEnter={() => setActive(l.id)}
              onMouseLeave={() => setActive(null)}
            >
              <h3>
                {l.name} <em>{l.thickness}</em>
              </h3>
              <p className="layer-note">{l.note}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Specification() {
  return (
    <section className="section section-spec" id="specification">
      <div className="spec-inner">
        <div className="section-head" data-reveal>
          <p className="eyebrow">03 — Specification</p>
          <h2>The data sheet</h2>
          <p className="section-lede">
            Measured on the movement rather than taken off the drawing. The timing record for your
            individual caliber ships with it.
          </p>
        </div>
        <dl className="specs" data-reveal>
          {SPECS.map(([k, v]) => (
            <div className="spec-row" key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function Finishes({ config, setConfig }) {
  return (
    <section className="section section-finishes" id="finishes">
      <div className="section-head" data-reveal>
        <p className="eyebrow">04 — Finishes</p>
        <h2>Three ways it can be finished</h2>
        <p className="section-lede">
          Prices are for the movement alone; casing is arranged separately. What you choose here
          carries into the reservation below.
        </p>
      </div>

      <div className="finishes" data-reveal>
        {CONFIGURATIONS.map((c) => (
          <article key={c.id} data-config={c.id} className={`finish${config === c.id ? ' is-chosen' : ''}`}>
            <h3>{c.name}</h3>
            <p className="finish-price">
              <span className="cur">CHF</span>
              {chf(c.price)}
            </p>
            <p className="finish-desc">{c.finish}</p>
            <dl className="finish-meta">
              <div>
                <dt>Delivery</dt>
                <dd>{c.lead}</dd>
              </div>
              <div>
                <dt>Unallocated</dt>
                <dd>
                  {c.remaining} <span>of the run</span>
                </dd>
              </div>
            </dl>
            <button
              type="button"
              className={`btn btn-choose${config === c.id ? ' is-chosen' : ''}`}
              aria-pressed={config === c.id}
              onClick={() => setConfig(c.id)}
            >
              {config === c.id ? 'Chosen' : 'Choose this finish'}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

function Workshop() {
  return (
    <section className="section section-workshop" id="workshop">
      <div className="workshop-layout">
        <figure className="workshop-figure" data-reveal>
          <img
            src="/media/watch-movement-cabrier-met.jpg"
            alt="An eighteenth-century gilt watch movement with a pierced and engraved balance cock."
            loading="lazy"
            width="843"
            height="843"
          />
          <figcaption>
            Watch movement, Charles Cabrier II, London, ca. 1740–60. The Metropolitan Museum of Art,
            public domain. Not ours — the trade the balance cock came out of.
          </figcaption>
        </figure>

        <div className="workshop-copy">
          <div className="section-head" data-reveal>
            <p className="eyebrow">05 — The workshop</p>
            <h2>Eleven people, and then the tooling is retired</h2>
          </div>
          <p className="run-figure" data-reveal>
            <b>200</b>
            <span>movements in total. After that, the tooling is retired.</span>
          </p>
          <dl className="atelier">
            {ATELIER.map((a, i) => (
              <div key={a} data-reveal>
                <dt>{ATELIER_LABELS[i]}</dt>
                <dd>{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

function Allocation({ config }) {
  const cells = useMemo(() => {
    const out = []
    const open = CONFIGURATIONS.reduce((s, c) => s + c.remaining, 0)
    for (let i = 0; i < RUN_TOTAL - open; i += 1) out.push({ key: `allocated-${i}`, id: null })
    CONFIGURATIONS.forEach((c) => {
      for (let i = 0; i < c.remaining; i += 1) out.push({ key: `${c.id}-${i}`, id: c.id })
    })
    return out
  }, [])
  const open = cells.filter((c) => c.id).length
  const allocated = RUN_TOTAL - open

  return (
    <div className="allocation" data-reveal>
      <p className="allocation-head">
        <b>{open}</b>
        <span>of the 200 still unallocated</span>
      </p>
      <div className="ticks" aria-hidden="true">
        {cells.map((c) => (
          <i key={c.key} className={`tick${c.id ? ' is-open' : ''}${config && c.id === config ? ' is-chosen' : ''}`} />
        ))}
      </div>
      <ul className="allocation-key">
        {CONFIGURATIONS.map((c) => (
          <li key={c.id} className={config === c.id ? 'is-chosen' : ''}>
            <i className={`tick is-open${config === c.id ? ' is-chosen' : ''}`} aria-hidden="true" />
            {c.remaining} {c.name}
          </li>
        ))}
        <li>
          <i className="tick" aria-hidden="true" />
          {allocated} already allocated
        </li>
      </ul>
    </div>
  )
}

function Reserve({ config, setConfig }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reserved, setReserved] = useState(false)
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
    <section className="section section-reserve" id="reserve">
      <div className="reserve-layout">
        <div className="reserve-side">
          <div className="section-head" data-reveal>
            <p className="eyebrow">06 — Reservation</p>
            <h2>Hold one of the 200</h2>
          </div>
          <Allocation config={config} />
          <p className="terms" data-reveal>
            Reservations are not binding and no payment is taken now. We will write once, with the
            timing record of the movement allocated to you.
          </p>
        </div>

        <div className="reserve-card" data-reveal>
          {reserved ? (
            <div className="confirmation" role="status">
              <p className="confirm-mark">Reserved</p>
              <p className="confirm-body">
                Reserved. {name}, we have held one {chosen.name} movement at CHF {chf(chosen.price)} and
                will write to {email}. {chosen.lead}.
              </p>
              <dl className="confirm-meta">
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
              <p className="confirm-note">Not binding, and no payment has been taken.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="form-title">Reserve a movement</p>
              <div className="field">
                <label htmlFor="config">Which finish?</label>
                <select id="config" name="config" required value={config} onChange={(e) => setConfig(e.target.value)}>
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
                <input id="name" name="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="form-summary">
                {chosen ? (
                  <>
                    <span className="sum-name">{chosen.name}</span>
                    <span className="sum-price">CHF {chf(chosen.price)}</span>
                    <span className="sum-lead">{chosen.lead}</span>
                  </>
                ) : (
                  <span className="muted">No finish chosen yet.</span>
                )}
              </div>

              <button type="submit" className="btn btn-primary btn-wide">
                Reserve a movement
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

export default function App() {
  const [config, setConfig] = useState('')
  useReveal()

  return (
    <div className="page">
      <nav className="topbar">
        <a className="mark" href="#top">
          <b>Aubry &amp; Vent</b>
          <span>Caliber 08</span>
        </a>
        <ul className="nav-links">
          {SECTIONS.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`}>{label}</a>
            </li>
          ))}
        </ul>
        <a className="btn btn-small" href="#reserve">
          Reserve
        </a>
      </nav>

      <main id="top">
        <Hero />
        <PowerPath />
        <Layers />
        <Specification />
        <Finishes config={config} setConfig={setConfig} />
        <Workshop />
        <Reserve config={config} setConfig={setConfig} />
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <p className="footer-mark">Aubry &amp; Vent. Caliber 08. © 2026.</p>
          <ul className="footer-links">
            <li>
              <a href="#workshop">Servicing</a>
            </li>
            <li>
              <a href="#workshop">Provenance</a>
            </li>
            <li>
              <a href="#reserve">Terms of reservation</a>
            </li>
          </ul>
          <p className="footer-mail">
            Enquiries: <a href="mailto:atelier@aubryvent.ch">atelier@aubryvent.ch</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
