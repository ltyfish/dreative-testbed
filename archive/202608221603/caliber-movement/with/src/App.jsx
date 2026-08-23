import { useState, useEffect, useRef, useCallback } from 'react'

import heroMovement from './assets/hero-movement.jpg'
import stageMainspring from './assets/stage-mainspring.jpg'
import stageTrain from './assets/stage-train.jpg'
import stageEscapement from './assets/stage-escapement.jpg'
import constructionPlate from './assets/construction-plate.jpg'
import workshopLathe from './assets/workshop-lathe.jpg'
import finishFrosted from './assets/finish-frosted.jpg'
import finishOpen from './assets/finish-open.jpg'
import finishBlack from './assets/finish-black.jpg'

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

/* --- Presentation only. Keyed to the content above; adds nothing to it. --- */

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI']

const STAGE_MEDIA = {
  mainspring: { src: stageMainspring, alt: 'A watch mainspring uncoiled to its full length, a flat steel ribbon curled at each end.' },
  train: { src: stageTrain, alt: 'Macro photograph of gilt train wheels meshing tooth to tooth across a straight-grained steel plate.' },
  escapement: { src: stageEscapement, alt: 'Macro photograph of a lever escapement: escape wheel, balance and hairspring set among ruby jewels.' },
}

// Where no honest photograph exists, the stage gets a drawn plate instead —
// each one renders that stage's own figure, not a picture of the part.
const STAGE_MARK = {
  barrel: 'barrel',
  balance: 'balance',
  hands: 'hands',
}

const LAYER_SURFACE = {
  'dial-side': 'hairline',
  main: 'frosted',
  bridge: 'grained',
  'balance-cock': 'polished',
}

const LAYER_MM = { 'dial-side': 0.9, main: 1.4, bridge: 0.8, 'balance-cock': 0.7 }

const CONFIG_MEDIA = {
  frosted: { src: finishFrosted, alt: 'A hand-frosted main plate seen at a low angle, its circular graining catching the light.' },
  skeleton: { src: finishOpen, alt: 'Bridges cut back to narrow arms over a gilt plate, every edge bevelled.' },
  black: { src: finishBlack, alt: 'A polished steel cage photographed in monochrome, its flanks reflecting like a mirror.' },
}

// The four figures a collector checks first, drawn straight from SPECS.
const HEADLINE_SPECS = ['Diameter', 'Height', 'Components', 'Jewels']

// The mark each workshop fact is scanned by. Every one of these is stated in
// the fact it sits beside.
const ATELIER_MARK = ['Vallée de Joux', '11', '200', '21', '∞']

const chf = (n) => n.toLocaleString('en-CH')

/* ------------------------------- helpers -------------------------------- */

function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      el.dataset.revealed = 'true'
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.dataset.revealed = 'true'
            io.unobserve(e.target)
          }
        }
      },
      // Fires once the region's top has climbed to 82% of the viewport, so the
      // reveal finishes well before the reader is past it.
      { rootMargin: '0px 0px -18% 0px', threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
  const ref = useReveal()
  return (
    <Tag ref={ref} className={`reveal ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

/* The beat. 2.5 Hz — five semi-oscillations a second — is what the movement
   actually does, so the page does it too, at that exact rate. */
function Beat({ size = 'sm', running = true, label }) {
  return (
    <span className={`beat beat--${size}`} data-running={running ? 'true' : 'false'} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        <circle className="beat__rim" cx="24" cy="24" r="18" />
        <g className="beat__wheel">
          <circle className="beat__felloe" cx="24" cy="24" r="15" />
          <path className="beat__arm" d="M9 24h30M24 9v30" />
          <circle className="beat__weight" cx="24" cy="9" r="2.6" />
          <circle className="beat__weight" cx="24" cy="39" r="2.6" />
          <circle className="beat__weight" cx="9" cy="24" r="2.6" />
          <circle className="beat__weight" cx="39" cy="24" r="2.6" />
        </g>
        <circle className="beat__jewel" cx="24" cy="24" r="3.2" />
      </svg>
      {label ? <span className="beat__label">{label}</span> : null}
    </span>
  )
}

/* Drawn plates for the three stages with no honest photograph. Each one draws
   that stage's own figure at the scale the figure states. */
function StageMark({ kind, active }) {
  if (kind === 'balance') {
    return (
      <div className="plate plate--beat">
        <div className="plate__art">
          <Beat size="lg" running={active} />
        </div>
        <p className="plate__title">
          <span>Drawn at rate</span> Five semi-oscillations a second, which is 2.5 Hz. This is what
          the movement is doing while you read.
        </p>
      </div>
    )
  }

  if (kind === 'barrel') {
    // The run of the mainspring: what the stop-work lets through, and what it
    // refuses. Drawn to the eight per cent the barrel actually withholds.
    return (
      <div className="plate">
        <div className="plate__art">
          <svg viewBox="0 0 520 132" className="dia" role="img" aria-label="The barrel's run drawn as a bar: ninety-two per cent released at near-constant torque, the last eight per cent hatched off and refused.">
            <defs>
              <pattern id="refused" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="7" className="dia__hatch" />
              </pattern>
            </defs>
            <rect className="dia__band" x="4" y="40" width="452" height="40" />
            <rect className="dia__refused" x="456" y="40" width="60" height="40" fill="url(#refused)" />
            <line className="dia__torque" x1="4" y1="54" x2="456" y2="58" />
            <line className="dia__hairline" x1="4" y1="46" x2="456" y2="50" />
            <line className="dia__hairline" x1="4" y1="62" x2="456" y2="66" />
            <line className="dia__rule" x1="4" y1="98" x2="456" y2="98" />
            <line className="dia__rule" x1="456" y1="98" x2="516" y2="98" />
            <text className="dia__cap" x="4" y="118">released — 92%</text>
            <text className="dia__cap dia__cap--dim" x="516" y="118" textAnchor="end">refused — 8%</text>
            <text className="dia__cap dia__cap--gilt" x="4" y="28">torque, held within 4%</text>
          </svg>
        </div>
        <p className="plate__title">
          <span>The run</span> Where the rate would begin to drift, the stop-work simply refuses to
          give the energy up.
        </p>
      </div>
    )
  }

  // The figure this stage ends on is a rate, so the plate is a rate scale.
  const marks = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]
  return (
    <div className="plate">
      <div className="plate__art">
        <svg viewBox="0 0 520 132" className="dia" role="img" aria-label="A scale of seconds gained or lost per day from minus five to plus five, with the movement's band from minus one to plus four marked.">
          <line className="dia__rule" x1="10" y1="74" x2="510" y2="74" />
          {marks.map((m) => {
            const x = 10 + ((m + 5) / 10) * 500
            return (
              <g key={m}>
                <line className="dia__tick" x1={x} y1="74" x2={x} y2={m === 0 ? 88 : 82} />
                <text className="dia__cap dia__cap--dim" x={x} y="106" textAnchor="middle">
                  {m > 0 ? `+${m}` : m}
                </text>
              </g>
            )
          })}
          <rect className="dia__band-gilt" x={10 + (4 / 10) * 500} y="52" width={(5 / 10) * 500} height="16" />
          <text className="dia__cap dia__cap--gilt" x={10 + (4 / 10) * 500} y="40">−1 to +4</text>
        </svg>
      </div>
      <p className="plate__title">
        <span>Seconds per day</span> Everything above resolves into this one band, measured over the
        twenty-one days the movement spends on test.
      </p>
    </div>
  )
}

/* -------------------------------- sections ------------------------------- */

function Header({ onReserve }) {
  const [lifted, setLifted] = useState(false)
  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className="masthead" data-lifted={lifted ? 'true' : 'false'}>
      <div className="masthead__in">
        <a className="brand" href="#top">
          <span className="brand__house">Aubry &amp; Vent</span>
          <span className="brand__cal">Caliber 08</span>
        </a>
        <nav className="masthead__nav" aria-label="Sections">
          <a href="#transmission">Transmission</a>
          <a href="#construction">Construction</a>
          <a href="#specification">Specification</a>
          <a href="#workshop">Workshop</a>
          <a href="#finishes">Finishes</a>
        </nav>
        <div className="masthead__end">
          <span className="rate" title="The movement beats at 2.5 Hz">
            <Beat size="sm" />
            <span className="rate__num">2.5 Hz</span>
          </span>
          <button type="button" className="btn btn--gilt" onClick={onReserve}>
            Reserve
          </button>
        </div>
      </div>
    </header>
  )
}

function Hero({ onReserve }) {
  return (
    <section className="hero" id="top">
      <div className="hero__grid wrap">
        <div className="hero__type">
          <p className="eyebrow">Aubry &amp; Vent — Vallée de Joux</p>
          <h1 className="hero__title">
            Caliber<span className="hero__num">08</span>
          </h1>
          <p className="hero__sub">
            A manual-winding mechanical movement, made in a run of 200 and then never again.
          </p>
          <p className="hero__lead">
            Seventy-two hours of stored energy, released one escape-wheel tooth at a time, five times
            a second, for three days from a single wind.
          </p>
          <div className="hero__actions">
            <button type="button" className="btn btn--gilt btn--lg" onClick={onReserve}>
              Reserve a movement
            </button>
            <a className="btn btn--ghost btn--lg" href="#transmission">
              Follow the energy
            </a>
          </div>
          <dl className="hero__figures">
            <div>
              <dt>Power reserve</dt>
              <dd>72 h</dd>
            </div>
            <div>
              <dt>Frequency</dt>
              <dd>2.5 Hz</dd>
            </div>
            <div>
              <dt>Run</dt>
              <dd>200</dd>
            </div>
          </dl>
        </div>
        <figure className="hero__plate">
          <img
            src={heroMovement}
            width="1100"
            height="1101"
            alt="Macro photograph of a mechanical watch movement: gilt wheels, bevelled bridges and ruby jewels seen from the bridge side."
            fetchPriority="high"
            decoding="async"
          />
          <figcaption>Reference photography — a Swiss lever movement of the same architecture. Credits below.</figcaption>
        </figure>
      </div>
    </section>
  )
}

function Transmission() {
  const [active, setActive] = useState(0)
  const panelRefs = useRef([])

  // One authored value for the whole section: the last stage whose head has
  // crossed the reading line. Derived from scroll position rather than from
  // per-panel intersections, so it can never be left showing a stale stage
  // once the reader is above or below the section.
  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const line = window.innerHeight * 0.42
      let i = 0
      panelRefs.current.forEach((el, idx) => {
        if (el && el.getBoundingClientRect().top <= line) i = idx
      })
      setActive(i)
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
  }, [])

  // Energy has reached the end of stage `active`. Stepped, because that is how
  // an escapement actually lets it through.
  const progress = ((active + 1) / POWER_PATH.length) * 100

  return (
    <section className="sec sec--dark transmission" id="transmission">
      <div className="wrap">
        <Reveal as="header" className="sec__head">
          <p className="eyebrow">I — Transmission</p>
          <h2 className="sec__title">How the energy travels</h2>
          <p className="sec__intro">
            Six stages, in the order the energy actually reaches them. Nothing here is a metaphor:
            each one takes what the last one gave it and hands on something slower, steadier, or
            faster.
          </p>
          <span className="rule" />
        </Reveal>

        <div className="transmission__body">
          <aside className="track" aria-hidden="true">
            <div className="track__line">
              <span className="track__fill" style={{ height: `${progress}%` }} />
            </div>
            <ol className="track__list">
              {POWER_PATH.map((s, i) => (
                <li key={s.id} data-state={i === active ? 'on' : i < active ? 'past' : 'off'}>
                  <span className="track__roman">{ROMAN[i]}</span>
                  <span className="track__name">{s.name}</span>
                </li>
              ))}
            </ol>
          </aside>

          <div className="track__bar" aria-hidden="true">
            <span className="track__bar-fill" style={{ width: `${progress}%` }} />
            <span className="track__bar-label">
              {ROMAN[active]} / VI — {POWER_PATH[active].name}
            </span>
          </div>

          <ol className="stages">
            {POWER_PATH.map((s, i) => {
              const media = STAGE_MEDIA[s.id]
              const mark = STAGE_MARK[s.id]
              return (
                <li
                  key={s.id}
                  data-stage={s.id}
                  data-index={i}
                  ref={(el) => (panelRefs.current[i] = el)}
                  className="stage"
                  data-state={i === active ? 'on' : 'off'}
                >
                  <div className="stage__head">
                    <span className="stage__roman">{ROMAN[i]}</span>
                    <h3 className="stage__name">{s.name}</h3>
                  </div>
                  <p className="stage__figure">{s.figure}</p>
                  <p className="stage__detail">{s.detail}</p>
                  {media ? (
                    <figure className="stage__media">
                      <img src={media.src} alt={media.alt} loading="lazy" decoding="async" />
                    </figure>
                  ) : (
                    <StageMark kind={mark} active={i === active} />
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}

function Construction() {
  const [sel, setSel] = useState(1)
  const btnRefs = useRef([])
  const total = LAYERS.reduce((a, l) => a + LAYER_MM[l.id], 0)

  const onKeyDown = useCallback((e) => {
    const last = LAYERS.length - 1
    let next = null
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (sel + 1) % LAYERS.length
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = sel === 0 ? last : sel - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next !== null) {
      e.preventDefault()
      setSel(next)
      btnRefs.current[next]?.focus()
    }
  }, [sel])

  const chosen = LAYERS[sel]

  return (
    <section className="sec sec--paper construction" id="construction">
      <div className="wrap">
        <Reveal as="header" className="sec__head">
          <p className="eyebrow">II — Construction</p>
          <h2 className="sec__title">Four layers, front to back</h2>
          <p className="sec__intro">
            The movement is 3.8mm tall in total. Seen edge-on and drawn to that scale, this is where
            the height goes. Pull a layer out of the stack to read it.
          </p>
          <span className="rule" />
        </Reveal>

        <Reveal className="construction__body">
          <div className="elevation">
            <div className="elevation__dim" aria-hidden="true">
              <span className="elevation__dim-line" />
              <span className="elevation__dim-label">3.8 mm overall</span>
            </div>

            <div
              className="stack"
              role="tablist"
              aria-orientation="vertical"
              aria-label="Layers of the movement, front to back"
              onKeyDown={onKeyDown}
            >
              <span className="stack__edge stack__edge--front" aria-hidden="true">front / dial side</span>
              {LAYERS.map((l, i) => (
                <button
                  key={l.id}
                  type="button"
                  role="tab"
                  id={`layer-tab-${l.id}`}
                  aria-selected={i === sel}
                  aria-controls="layer-panel"
                  tabIndex={i === sel ? 0 : -1}
                  ref={(el) => (btnRefs.current[i] = el)}
                  className="stack__layer"
                  data-surface={LAYER_SURFACE[l.id]}
                  data-on={i === sel}
                  style={{ '--mm': LAYER_MM[l.id] }}
                  onClick={() => setSel(i)}
                >
                  <span className="stack__label">{l.name}</span>
                  <span className="stack__mm">{l.thickness}</span>
                </button>
              ))}
              <span className="stack__edge stack__edge--back" aria-hidden="true">back / balance side</span>
            </div>
          </div>

          <div className="construction__read">
            <div className="layercard" id="layer-panel" role="tabpanel" aria-labelledby={`layer-tab-${chosen.id}`} tabIndex={-1}>
              <p className="layercard__idx">
                Layer {sel + 1} of 4
                <span>
                  {' '}· {((LAYER_MM[chosen.id] / total) * 100).toFixed(0)}% of the height
                </span>
              </p>
              <h3 className="layercard__name">{chosen.name}</h3>
              <p className="layercard__mm">{chosen.thickness}</p>
              <p className="layercard__note">{chosen.note}</p>
            </div>
            <figure className="construction__plan">
              <img
                src={constructionPlate}
                alt="A frosted main plate laid flat, drilled for every pivot and jewel."
                loading="lazy"
                decoding="async"
              />
              <figcaption>The same stack seen in plan — a main plate drilled and frosted, before any wheel goes into it.</figcaption>
            </figure>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Specification() {
  const headline = HEADLINE_SPECS.map((k) => SPECS.find(([label]) => label === k)).filter(Boolean)
  return (
    <section className="sec sec--paper spec" id="specification">
      <div className="wrap">
        <Reveal as="header" className="sec__head">
          <p className="eyebrow">III — Specification</p>
          <h2 className="sec__title">On paper</h2>
          <span className="rule" />
        </Reveal>

        <Reveal className="spec__headline">
          {headline.map(([k, v]) => (
            <div key={k}>
              <span className="spec__headline-v">{v}</span>
              <span className="spec__headline-k">{k}</span>
            </div>
          ))}
        </Reveal>

        <Reveal as="dl" className="spec__list">
          {SPECS.map(([k, v]) => (
            <div className="spec__row" key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

function Workshop() {
  const [lead, ...rest] = [ATELIER[2], ATELIER[0], ATELIER[1], ATELIER[3], ATELIER[4]]
  const restMarks = [ATELIER_MARK[0], ATELIER_MARK[1], ATELIER_MARK[3], ATELIER_MARK[4]]
  return (
    <section className="sec sec--dark workshop" id="workshop">
      <div className="wrap">
        <Reveal as="header" className="sec__head">
          <p className="eyebrow">IV — The workshop</p>
          <h2 className="sec__title">Eleven people, and then the tooling is retired</h2>
          <span className="rule" />
        </Reveal>

        <div className="workshop__body">
          <Reveal as="figure" className="workshop__figure">
            <img
              src={workshopLathe}
              alt="A watchmaker's hands steadying a graver against a component turning on a lathe."
              loading="lazy"
              decoding="async"
            />
            <figcaption>Reference photography — a watchmaker's lathe in use. Credits below.</figcaption>
          </Reveal>

          <div className="workshop__facts">
            <Reveal className="fact fact--lead">
              <span className="fact__mark">200</span>
              <p>{lead}</p>
            </Reveal>
            <ul className="fact__list">
              {rest.map((a, i) => (
                <Reveal as="li" key={a} className="fact">
                  <span className="fact__mark fact__mark--sm">{restMarks[i]}</span>
                  <p>{a}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function Finishes({ config, setConfig, onReserve }) {
  return (
    <section className="sec sec--paper finishes" id="finishes">
      <div className="wrap">
        <Reveal as="header" className="sec__head">
          <p className="eyebrow">V — Finishes</p>
          <h2 className="sec__title">Three ways it can be finished</h2>
          <p className="sec__intro">
            Available in three finishes. Prices are for the movement alone; casing is arranged
            separately. Each mark below is one movement of the 200 still unallocated.
          </p>
          <span className="rule" />
        </Reveal>

        <div className="cards">
          {CONFIGURATIONS.map((c) => {
            const media = CONFIG_MEDIA[c.id]
            const on = config === c.id
            return (
              <Reveal as="article" key={c.id} className="card" data-config={c.id} data-on={on}>
                <figure className="card__media">
                  <img src={media.src} alt={media.alt} loading="lazy" decoding="async" width="760" height="950" />
                  {on ? <span className="card__badge">Selected</span> : null}
                </figure>
                <div className="card__body">
                  <h3 className="card__name">{c.name}</h3>
                  <p className="card__finish">{c.finish}</p>
                  <p className="card__price">
                    CHF <span>{chf(c.price)}</span>
                  </p>
                  <p className="card__lead">{c.lead}</p>
                  <div className="alloc">
                    <span className="alloc__ticks" aria-hidden="true">
                      {Array.from({ length: c.remaining }, (_, i) => (
                        <i key={i} />
                      ))}
                    </span>
                    <span className="alloc__label">{c.remaining} of the run still unallocated</span>
                  </div>
                  <button
                    type="button"
                    className={on ? 'btn btn--gilt card__cta' : 'btn btn--ghost card__cta'}
                    onClick={() => {
                      setConfig(c.id)
                      onReserve()
                    }}
                  >
                    {on ? 'Selected — go to reservation' : 'Reserve this finish'}
                  </button>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Reserve({ config, setConfig, formRef }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reserved, setReserved] = useState(false)
  const [touched, setTouched] = useState(false)
  const statusRef = useRef(null)

  const chosen = CONFIGURATIONS.find((c) => c.id === config)

  function handleSubmit(e) {
    e.preventDefault()
    setTouched(true)
    if (!name || !email || !config) return
    setReserved(true)
  }

  useEffect(() => {
    if (reserved) statusRef.current?.focus()
  }, [reserved])

  return (
    <section className="sec sec--dark reserve" id="reserve" ref={formRef}>
      <div className="wrap">
        <Reveal as="header" className="sec__head">
          <p className="eyebrow">VI — Reservation</p>
          <h2 className="sec__title">Hold one of the 200</h2>
          <span className="rule" />
        </Reveal>

        <div className="reserve__body">
          <Reveal className="reserve__terms">
            <p className="reserve__promise">
              Reservations are not binding and no payment is taken now. We will write once, with the
              timing record of the movement allocated to you.
            </p>
            <dl className="reserve__summary">
              <div>
                <dt>Finish</dt>
                <dd>{chosen ? chosen.name : <span className="muted">Not chosen yet</span>}</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>{chosen ? `CHF ${chf(chosen.price)}` : <span className="muted">—</span>}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>{chosen ? chosen.lead : <span className="muted">—</span>}</dd>
              </div>
            </dl>
          </Reveal>

          <Reveal className="reserve__panel">
            {reserved ? (
              <div className="confirm" role="status" ref={statusRef} tabIndex={-1}>
                <Beat size="md" />
                <p className="confirm__line">
                  Reserved. {name}, we have held one {chosen.name} movement at CHF{' '}
                  {chf(chosen.price)} and will write to {email}. {chosen.lead}.
                </p>
                <p className="confirm__note">
                  Not binding, and no payment has been taken.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate={false}>
                <div className="field">
                  <label htmlFor="config">Which finish?</label>
                  <select
                    id="config"
                    name="config"
                    required
                    value={config}
                    onChange={(e) => setConfig(e.target.value)}
                    aria-describedby={touched && !config ? 'config-err' : undefined}
                  >
                    <option value="">Choose a finish</option>
                    {CONFIGURATIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — CHF {chf(c.price)}
                      </option>
                    ))}
                  </select>
                  {touched && !config ? (
                    <p className="field__err" id="config-err">Choose one of the three finishes.</p>
                  ) : null}
                </div>
                <div className="field">
                  <label htmlFor="name">Your name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
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
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn--gilt btn--lg btn--block">
                  Reserve a movement
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}

const CREDITS = [
  {
    what: 'Movement macro (hero), escapement and jewels',
    who: 'Hustvedt',
    lic: 'CC BY-SA 3.0',
    href: 'https://commons.wikimedia.org/wiki/File:Chinese_movement_escapement_and_jewels.jpg',
  },
  {
    what: 'Mainspring uncoiled',
    who: 'Hustvedt',
    lic: 'CC BY-SA 3.0',
    href: 'https://commons.wikimedia.org/wiki/File:Mainspring_Chinese_uncoiled.jpg',
  },
  {
    what: 'Gear train and lever escapement macros',
    who: 'GuySie',
    lic: 'CC BY-SA 2.0',
    href: 'https://www.flickr.com/photos/76491533@N00/7483551136',
  },
  {
    what: 'Polished steel cage',
    who: 'GuySie',
    lic: 'CC BY-SA 2.0',
    href: 'https://www.flickr.com/photos/76491533@N00/3370465851',
  },
  {
    what: 'Frosted plates (plan and finish)',
    who: 'Watchexpert',
    lic: 'Public domain',
    href: 'https://commons.wikimedia.org/wiki/File:Perlage_01.JPG',
  },
  {
    what: 'Open-worked bridges',
    who: 'Shane Lin',
    lic: 'CC BY-SA 2.0',
    href: 'https://commons.wikimedia.org/wiki/File:Omega_Cal._321_Chronograph_movement.jpg',
  },
  {
    what: "Watchmaker's lathe in use",
    who: 'Zephyris',
    lic: 'CC BY-SA 3.0',
    href: "https://commons.wikimedia.org/wiki/File:Watchmaker's_Lathe_in_use.jpg",
  },
]

function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot__in">
        <div className="foot__col foot__col--brand">
          <span className="brand__house">Aubry &amp; Vent</span>
          <p className="foot__line">Aubry &amp; Vent. Caliber 08. © 2026.</p>
          <p className="foot__line">
            Enquiries: <a href="mailto:atelier@aubryvent.ch">atelier@aubryvent.ch</a>
          </p>
        </div>
        <div className="foot__col">
          <p className="eyebrow">Documents</p>
          <ul className="foot__docs">
            <li>Servicing.</li>
            <li>Provenance.</li>
            <li>Terms of reservation.</li>
          </ul>
        </div>
        <div className="foot__col foot__col--credits">
          <p className="eyebrow">Reference photography</p>
          <p className="foot__note">
            Caliber 08 has not been photographed for release. The images on this page are licensed
            photographs of other Swiss lever movements and of watchmaking, used as reference and
            cropped and graded for this page. Treated versions are shared under the same licence as
            their source.
          </p>
          <ul className="foot__credits">
            {CREDITS.map((c) => (
              <li key={c.what}>
                <a href={c.href} target="_blank" rel="noopener noreferrer">
                  {c.what}
                </a>{' '}
                — {c.who}, {c.lic}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  const [config, setConfig] = useState('')
  const reserveRef = useRef(null)

  const goToReserve = useCallback(() => {
    reserveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <>
      <a className="skip" href="#transmission">Skip to the movement</a>
      <Header onReserve={goToReserve} />
      <main>
        <Hero onReserve={goToReserve} />
        <Transmission />
        <Construction />
        <Specification />
        <Workshop />
        <Finishes config={config} setConfig={setConfig} onReserve={goToReserve} />
        <Reserve config={config} setConfig={setConfig} formRef={reserveRef} />
      </main>
      <Footer />
    </>
  )
}
