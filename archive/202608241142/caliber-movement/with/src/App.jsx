import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MovementPlate, LayerPlate } from './movement.jsx'

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

// The mark pulled out of each workshop fact for the first-pass read. The
// sentence beside it is unchanged and carries the claim.
const ATELIER_MARKS = ['VdJ', '11', '200', '21', '∞']

// Photographs are of real watchmaking, credited and captioned as what they are.
// None of them is a picture of Caliber 08, and none is presented as one.
const CREDITS = [
  { file: 'movement-macro.jpg', what: 'Balance, hairspring and train of a manual-winding movement', who: 'GuySie', licence: 'CC BY-SA 2.0', href: 'https://www.flickr.com/photos/76491533@N00/6095265888' },
  { file: 'mainspring.jpg', what: 'A mainspring, uncoiled', who: 'Hustvedt', licence: 'CC BY-SA 3.0', href: 'https://commons.wikimedia.org/wiki/File:Mainspring_Chinese_uncoiled.jpg' },
  { file: 'escapement-jewels.jpg', what: 'A lever escapement and its jewels', who: 'Hustvedt', licence: 'CC BY-SA 3.0', href: 'https://commons.wikimedia.org/wiki/File:Chinese_movement_escapement_and_jewels.jpg' },
  { file: 'vallee-de-joux.jpg', what: 'Le Sentier, Vallée de Joux', who: 'Nouhailler', licence: 'CC BY-SA 2.0', href: 'https://www.flickr.com/photos/nouhailler/6525062615' },
  { file: 'staking-set.jpg', what: 'A watchmaker’s staking set on the bench', who: 'dustpuppy', licence: 'CC BY-SA 2.0', href: 'https://www.flickr.com/photos/dustpuppy/13457875' },
]

const SECTIONS = [
  ['overview', 'The movement'],
  ['path', 'Power path'],
  ['layers', 'Four layers'],
  ['workshop', 'The workshop'],
  ['record', 'Specification'],
  ['finishes', 'Three finishes'],
  ['reserve', 'Reserve'],
]

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

// The route's entrance grammar. Measured against the top of the viewport from
// the same scroll tick everything else reads, so a reveal can never resolve
// behind the reader — including when they jump straight to an anchor.
function revealPass() {
  const line = window.innerHeight * 0.86
  document.querySelectorAll('[data-reveal]:not([data-in])').forEach((el) => {
    if (el.getBoundingClientRect().top < line) el.setAttribute('data-in', '')
  })
}

// Cheap shared scroll subscription: one rAF-throttled listener for the section
// index, the power path's active stage, and the layer stack's progress.
function useScrollTick(fn) {
  const cb = useRef(fn)
  cb.current = fn
  useEffect(() => {
    let frame = 0
    const run = () => {
      frame = 0
      cb.current()
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(run)
    }
    run()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
}

function useInView(ref, margin = '200px') {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver((e) => setSeen(e[0].isIntersecting), { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin])
  return seen
}

/* -------------------------------------------------------------- fragments */

function Figure({ src, alt, caption, credit, className = '', tall = false, noReveal = false }) {
  return (
    <figure className={'plate-photo ' + className} data-reveal={noReveal ? undefined : ''}>
      <div className={'plate-photo-frame' + (tall ? ' is-tall' : '')}>
        <img src={src} alt={alt} loading="lazy" decoding="async" />
      </div>
      <figcaption>
        <span>{caption}</span>
        <span className="credit">{credit}</span>
      </figcaption>
    </figure>
  )
}

/* ------------------------------------------------------------------- page */

export default function App() {
  const [config, setConfig] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reserved, setReserved] = useState(false)
  const [touched, setTouched] = useState(false)

  const [activeSection, setActiveSection] = useState('overview')
  const [stage, setStage] = useState('mainspring')
  const [layer, setLayer] = useState(null)

  const reduced = useReducedMotion()
  const heroRef = useRef(null)
  const pathPlateRef = useRef(null)
  const stageRefs = useRef({})
  const layersRef = useRef(null)

  const heroVisible = useInView(heroRef)
  const pathVisible = useInView(pathPlateRef)

  const chosen = CONFIGURATIONS.find((c) => c.id === config)
  const totalRemaining = useMemo(() => CONFIGURATIONS.reduce((s, c) => s + c.remaining, 0), [])
  const stageIndex = POWER_PATH.findIndex((s) => s.id === stage)

  // Section index, active power-path stage, and the layer stack's one progress
  // value all read from the same tick.
  useScrollTick(() => {
    revealPass()

    const mid = window.innerHeight * 0.42

    let current = SECTIONS[0][0]
    for (const [id] of SECTIONS) {
      const el = document.getElementById(id)
      if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.35) current = id
    }
    setActiveSection(current)

    let best = null
    let bestD = Infinity
    for (const s of POWER_PATH) {
      const el = stageRefs.current[s.id]
      if (!el) continue
      const r = el.getBoundingClientRect()
      const d = Math.abs(r.top + r.height / 2 - mid)
      if (d < bestD) {
        bestD = d
        best = s.id
      }
    }
    if (best) setStage(best)

    const wrap = layersRef.current
    if (wrap) {
      const r = wrap.getBoundingClientRect()
      const centre = r.top + r.height / 2
      const away = Math.abs(centre - window.innerHeight / 2) / (window.innerHeight * 0.8)
      // never fully collapsed: the stack always reads as four parts
      const p = 0.28 + 0.72 * Math.max(0, Math.min(1, 1 - away))
      wrap.style.setProperty('--explode', p.toFixed(3))
    }
  })

  // Selecting a stage moves it into the reading position; the plate then
  // follows from the same scroll value everything else reads, so the drawing and
  // the text can never disagree.
  const bringStage = useCallback((id) => {
    const el = stageRefs.current[id]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const goTo = useCallback((id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  useEffect(() => {
    revealPass()
  }, [reserved, config])

  function handleSubmit(e) {
    e.preventDefault()
    setTouched(true)
    if (!name || !email || !config) return
    setReserved(true)
  }

  function chooseFinish(id) {
    setConfig(id)
  }

  return (
    <div className="page" data-reduced={reduced ? 'yes' : 'no'}>
      <a className="skip" href="#overview">Skip to the movement</a>

      <header className="topbar">
        <div className="topbar-in">
          <a className="mark" href="#overview" onClick={(e) => { e.preventDefault(); goTo('overview') }}>
            <span className="mark-name">Aubry &amp; Vent</span>
            <span className="mark-sub">Vallée de Joux</span>
          </a>
          <p className="topbar-ident">Caliber 08 · Manual wind · 31.0 × 3.8mm</p>
          <div className="topbar-right">
            <p className="allocation" aria-live="polite">
              {chosen ? (
                <>
                  <strong>{chosen.remaining}</strong> {chosen.name.toLowerCase()} unallocated
                </>
              ) : (
                <>
                  <strong>{totalRemaining}</strong> of 200 unallocated
                </>
              )}
            </p>
            <button type="button" className="btn btn-quiet" onClick={() => goTo('reserve')}>
              Reserve
            </button>
          </div>
        </div>
      </header>

      <nav className="index" aria-label="Sections">
        <ol>
          {SECTIONS.map(([id, label], i) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => goTo(id)}
                aria-current={activeSection === id ? 'true' : undefined}
                className={activeSection === id ? 'is-active' : undefined}
              >
                <span className="num">{String(i + 1).padStart(2, '0')}</span>
                <span className="lbl">{label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <main>
        {/* 01 — orient ------------------------------------------------- */}
        <section id="overview" className="hero" ref={heroRef}>
          <div className="hero-type">
            <p className="eyebrow" data-reveal>Movement 08 · A run of two hundred</p>
            <h1 data-reveal>
              <span className="h1-line">Caliber</span>
              <span className="h1-line h1-num">08</span>
            </h1>
            <p className="hero-lede" data-reveal>
              A manual-winding mechanical movement, made in a run of 200 and then never again.
            </p>
            <p className="hero-sentence" data-reveal>
              Seventy-two hours of stored energy, released one escape-wheel tooth at a time, five times a
              second, for three days from a single wind.
            </p>
            <div className="hero-actions" data-reveal>
              <button type="button" className="btn btn-solid" onClick={() => goTo('reserve')}>
                Reserve a movement
              </button>
              <button type="button" className="btn btn-line" onClick={() => goTo('path')}>
                Follow the power path
              </button>
            </div>
          </div>

          <div className="hero-plate" data-reveal>
            <MovementPlate id="hero" running={heroVisible && !reduced} focus={null} />
            <p className="plate-legend">
              <span>Plan view, dial side down</span>
              <span>Balance running at 2.5&nbsp;Hz</span>
            </p>
          </div>
        </section>

        {/* material handoff into the power path */}
        <div className="band" data-reveal>
          <img src="/media/movement-macro.jpg" alt="Macro photograph of a balance wheel, hairspring and train wheels inside a mechanical watch movement." loading="lazy" decoding="async" />
          <p className="band-caption">
            <span>Balance, hairspring and train, under magnification.</span>
            <span className="credit">Photograph GuySie, CC BY-SA 2.0. Not Caliber 08.</span>
          </p>
        </div>

        {/* 02 — demonstrate ------------------------------------------- */}
        <section id="path" className="path">
          <div className="path-body">
            <div className="path-plate">
              <div className="sec-head" data-reveal>
                <p className="sec-num">02</p>
                <h2>How the energy travels</h2>
                <p className="sec-lede">
                  Six stages, in the order energy passes through them. Follow one and the plate finds it.
                </p>
              </div>
              <div className="path-plate-sticky" ref={pathPlateRef} data-reveal>
                <MovementPlate id="path" focus={stage} running={pathVisible && !reduced} />
                <div className="path-readout">
                  <span className="path-readout-num">{String(stageIndex + 1).padStart(2, '0')} / 06</span>
                  <span className="path-readout-name">{POWER_PATH[stageIndex]?.name}</span>
                  <span className="path-readout-fig">{POWER_PATH[stageIndex]?.figure}</span>
                </div>
              </div>
            </div>

            <ol className="stages">
              {POWER_PATH.map((s, i) => (
                <li
                  key={s.id}
                  data-stage={s.id}
                  className={'stage' + (stage === s.id ? ' is-live' : '')}
                  ref={(el) => { stageRefs.current[s.id] = el }}
                >
                  <button
                    type="button"
                    className="stage-hit"
                    onClick={() => bringStage(s.id)}
                    onFocus={() => bringStage(s.id)}
                    aria-current={stage === s.id ? 'true' : undefined}
                  >
                    <span className="stage-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="stage-name">{s.name}</span>
                    <span className="stage-mark" aria-hidden="true" />
                  </button>
                  <p className="stage-detail">{s.detail}</p>
                  <p className="stage-figure">{s.figure}</p>

                  {s.id === 'mainspring' && (
                    <Figure
                      className="stage-photo"
                      noReveal
                      src="/media/mainspring.jpg"
                      alt="A watch mainspring uncoiled to its full length against a plain ground."
                      caption="A mainspring uncoiled. Caliber 08’s is 380mm long."
                      credit="Hustvedt, CC BY-SA 3.0"
                    />
                  )}
                  {s.id === 'escapement' && (
                    <Figure
                      className="stage-photo"
                      noReveal
                      src="/media/escapement-jewels.jpg"
                      alt="Macro photograph of a lever escapement, its pallet jewels and ruby bearings in an open-worked movement."
                      caption="A lever escapement, its pallets and ruby bearings."
                      credit="Hustvedt, CC BY-SA 3.0"
                    />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 03 — transform: the post-hero peak ------------------------- */}
        <section id="layers" className="layers">
          <div className="layers-body" ref={layersRef} data-isolated={layer ? 'yes' : 'no'}>
            <div className="stack" aria-hidden="true">
              {LAYERS.map((l, i) => (
                <div
                  key={l.id}
                  className={'stack-layer' + (layer === l.id ? ' is-held' : '') + (layer && layer !== l.id ? ' is-back' : '')}
                  style={{ '--i': i }}
                >
                  <LayerPlate variant={l.id === 'balance-cock' ? 'cock' : l.id} />
                </div>
              ))}
            </div>

            <div className="layers-read">
              <div className="sec-head" data-reveal>
                <p className="sec-num">03</p>
                <h2>Built up in four layers</h2>
                <p className="sec-lede">
                  Front to back, 3.8mm of it. Take a layer to hold it clear of the rest.
                </p>
              </div>

              {/* A section through the movement: each band is its real share of
                  the 3.8mm, and it is also the control for the stack. */}
              <div className="scale" data-reveal>
                <p className="scale-cap">
                  <span>Front</span>
                  <span>Section through 3.8mm</span>
                  <span>Back</span>
                </p>
                <ul className="scale-bars">
                  {LAYERS.map((l) => (
                    <li key={l.id} style={{ '--mm': l.mm }}>
                      <button
                        type="button"
                        className={layer === l.id ? 'is-held' : undefined}
                        aria-pressed={layer === l.id}
                        aria-label={l.name + ', ' + l.thickness}
                        onClick={() => setLayer(layer === l.id ? null : l.id)}
                        onMouseEnter={() => setLayer(l.id)}
                        onMouseLeave={() => setLayer(null)}
                        onFocus={() => setLayer(l.id)}
                        onBlur={() => setLayer(null)}
                      >
                        <span className="scale-mm">{l.thickness}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <ul className="layer-notes">
                {LAYERS.map((l, i) => (
                  <li
                    key={l.id}
                    className={layer === l.id ? 'is-held' : undefined}
                    onMouseEnter={() => setLayer(l.id)}
                    onMouseLeave={() => setLayer(null)}
                    data-reveal
                  >
                    <p className="ln-name">
                      <span className="ln-i">{String(i + 1).padStart(2, '0')}</span>
                      {l.name} <span className="ln-mm">{l.thickness}</span>
                    </p>
                    <p className="ln-note">{l.note}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 04 — rest --------------------------------------------------- */}
        <section id="workshop" className="workshop">
          <div className="workshop-media">
            <Figure
              className="ws-place"
              src="/media/vallee-de-joux.jpg"
              alt="A snow-covered clearing among tall firs at Le Sentier in the Vallée de Joux, Switzerland."
              caption="Le Sentier, Vallée de Joux."
              credit="Nouhailler, CC BY-SA 2.0"
              tall
            />
            <Figure
              className="ws-bench"
              src="/media/staking-set.jpg"
              alt="A watchmaker’s staking set: rows of steel punches standing in a wooden bench block."
              caption="A staking set on the bench."
              credit="dustpuppy, CC BY-SA 2.0"
            />
          </div>

          <div className="workshop-text">
            <div className="sec-head" data-reveal>
              <p className="sec-num">04</p>
              <h2>The workshop</h2>
            </div>
            <ul className="facts">
              {ATELIER.map((a, i) => (
                <li key={a} data-reveal>
                  <span className="fact-mark" aria-hidden="true">{ATELIER_MARKS[i]}</span>
                  <p>{a}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 05 — prove: the printed record ----------------------------- */}
        <section id="record" className="record">
          <div className="doc" data-reveal>
            <header className="doc-head">
              <div>
                <p className="doc-kicker">Aubry &amp; Vent · Vallée de Joux</p>
                <h2>Specification</h2>
              </div>
              <p className="doc-ref">Ref. Caliber 08</p>
            </header>

            <dl className="doc-rows">
              {SPECS.map(([k, v]) => (
                <div
                  key={k}
                  className={'doc-row' + (k === 'Components' || k === 'Finishing hours' ? ' is-lead' : '')}
                >
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>

            <p className="doc-foot">
              A timing record for the individual movement is drawn up after twenty-one days on test and
              ships with it.
            </p>
          </div>
        </section>

        {/* 06 — compare ------------------------------------------------ */}
        <section id="finishes" className="finishes">
          <div className="sec-head" data-reveal>
            <p className="sec-num">06</p>
            <h2>Three finishes</h2>
            <p className="sec-lede">
              The same caliber, finished three ways. Prices are for the movement alone; casing is
              arranged separately.
            </p>
          </div>

          <ul className="finish-list" role="list">
            {CONFIGURATIONS.map((c) => {
              const isOn = config === c.id
              return (
                <li key={c.id} data-config={c.id} className={'finish' + (isOn ? ' is-chosen' : '')} data-reveal>
                  <div className="finish-plate" data-finish={c.id} aria-hidden="true">
                    <MovementPlate id={'fin-' + c.id} running={false} focus={null} />
                  </div>

                  <div className="finish-body">
                    <h3>{c.name}</h3>
                    <p className="finish-desc">{c.finish}</p>
                    <dl className="finish-facts">
                      <div>
                        <dt>Price</dt>
                        <dd className="price">CHF {chf(c.price)}</dd>
                      </div>
                      <div>
                        <dt>Delivery</dt>
                        <dd>{c.lead}</dd>
                      </div>
                      <div>
                        <dt>Allocation</dt>
                        <dd className="rem">{c.remaining} of the run still unallocated</dd>
                      </div>
                    </dl>
                    <button
                      type="button"
                      className={'btn ' + (isOn ? 'btn-solid' : 'btn-line')}
                      onClick={() => chooseFinish(c.id)}
                      aria-pressed={isOn}
                    >
                      {isOn ? 'Chosen — this finish' : 'Choose this finish'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        {/* 07 — decide ------------------------------------------------- */}
        <section id="reserve" className="reserve">
          <div className="sec-head" data-reveal>
            <p className="sec-num">07</p>
            <h2>Reserve a movement</h2>
            <p className="sec-lede">
              Reservations are not binding and no payment is taken now. We will write once, with the
              timing record of the movement allocated to you.
            </p>
          </div>

          <div className="reserve-body">
            <div className={'slip' + (reserved ? ' is-stamped' : '')} data-reveal>
              <p className="slip-kicker">Reservation slip</p>
              {chosen ? (
                <>
                  <p className="slip-finish">{chosen.name}</p>
                  <p className="slip-price">CHF {chf(chosen.price)}</p>
                  <dl className="slip-rows">
                    <div>
                      <dt>Delivery</dt>
                      <dd>{chosen.lead}</dd>
                    </div>
                    <div>
                      <dt>Allocation</dt>
                      <dd>{chosen.remaining} unallocated</dd>
                    </div>
                    <div>
                      <dt>Payment</dt>
                      <dd>None taken</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <div className="slip-empty">
                  <dl className="slip-rows">
                    {['Finish', 'Price', 'Delivery'].map((k) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd className="slip-blank" aria-hidden="true" />
                      </div>
                    ))}
                  </dl>
                  <p className="slip-prompt">Nothing is held until a finish is chosen.</p>
                  <button type="button" className="btn btn-line" onClick={() => goTo('finishes')}>
                    See the three finishes
                  </button>
                </div>
              )}
              {reserved && <p className="slip-stamp" aria-hidden="true">Held</p>}
            </div>

            {reserved ? (
              <p className="confirm" role="status">
                Reserved. {name}, we have held one {chosen.name} movement at CHF {chf(chosen.price)} and
                will write to {email}. {chosen.lead}.
                <span className="confirm-fine">No payment has been taken. Nothing here is binding.</span>
              </p>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
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
                    autoComplete="name"
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
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {touched && (!name || !email || !config) && (
                  <p className="form-note" role="alert">
                    A finish, a name, and an email are needed before we can hold one.
                  </p>
                )}

                <button type="submit" className="btn btn-solid btn-wide">
                  Reserve a movement
                </button>
                <p className="form-fine">Not binding. No payment is taken now.</p>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="foot-top">
          <p className="foot-mark">Aubry &amp; Vent</p>
          <p className="foot-contact">
            Enquiries: <a href="mailto:atelier@aubryvent.ch">atelier@aubryvent.ch</a>
          </p>
          <p className="foot-links">Servicing. Provenance. Terms of reservation.</p>
        </div>
        <div className="foot-credits">
          <p className="credits-head">Photography</p>
          <ul>
            {CREDITS.map((c) => (
              <li key={c.file}>
                <a href={c.href} rel="noreferrer noopener" target="_blank">{c.what}</a>
                <span> — {c.who}, {c.licence}</span>
              </li>
            ))}
          </ul>
          <p className="credits-note">
            Reference photography of mechanical watchmaking. Plate and layer drawings are schematics of
            Caliber 08.
          </p>
        </div>
        <p className="foot-legal">Aubry &amp; Vent. Caliber 08. © 2026.</p>
      </footer>
    </div>
  )
}
