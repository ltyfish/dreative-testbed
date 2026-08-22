import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUpRight, Check, Mail } from 'lucide-react'
import { STAGE_MARKS, PlanView } from './marks.jsx'

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

// ---------------------------------------------------------------------------
// Page-level presentation data. None of it changes a stated fact; it decides
// how each stage is drawn and which of the sourced photographs sits with it.

const STAGE_VIEW = {
  mainspring: {
    motion: 'unwind',
    period: '16s',
    photo: {
      src: '/media/mainspring.webp',
      alt: 'A watch mainspring uncoiled on a sheet of paper, curling from a tight inner eye out into a long flat ribbon.',
      caption: 'A mainspring out of its barrel, uncoiled. Ours runs 380mm.',
    },
  },
  barrel: { motion: 'spin', period: '11s' },
  train: {
    motion: 'spin',
    period: '2.8s',
    photo: {
      src: '/media/gear-train.webp',
      alt: 'Macro photograph of the wheels of a mechanical watch train, gilt teeth meshing over a brushed steel plate set with ruby jewels.',
      caption: 'Train wheels meshing. Four of them sit between the barrel and the escapement.',
    },
  },
  escapement: { motion: 'escape', period: '0.2s' },
  balance: {
    motion: 'swing',
    period: '0.4s',
    photo: {
      src: '/media/balance-cock.webp',
      alt: 'Macro photograph of a watch balance cock, its regulator arms and endstone jewel above a coiled flat hairspring.',
      caption: 'A balance cock over its hairspring. Ours holds the wheel from one side only.',
    },
  },
  hands: { motion: 'spin', period: '60s' },
}

const LAYER_MM = { 'dial-side': 0.9, main: 1.4, bridge: 0.8, 'balance-cock': 0.7 }
const RUN_TOTAL = 200
const chf = (n) => n.toLocaleString('en-CH')

// ---------------------------------------------------------------------------
// One reveal grammar for the whole route: a little travel, triggered against
// the top of the viewport, once, and never on what is already on screen.

function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const nodes = ref.current?.querySelectorAll('[data-reveal]')
    if (!nodes?.length) return
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.classList.add('is-in'))
      return
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
      { rootMargin: '0px 0px -12% 0px', threshold: 0.01 },
    )
    nodes.forEach((n) => {
      if (n.getBoundingClientRect().top < window.innerHeight * 0.92) n.classList.add('is-in')
      else io.observe(n)
    })
    return () => io.disconnect()
  }, [])
  return ref
}

export default function App() {
  const [config, setConfig] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reserved, setReserved] = useState(false)

  const chosen = CONFIGURATIONS.find((c) => c.id === config)
  const rootRef = useReveal()

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !email || !config) return
    setReserved(true)
  }

  const selectFinish = useCallback((id) => {
    setConfig(id)
    setReserved(false)
  }, [])

  return (
    <div className="page" ref={rootRef}>
      <SiteHeader />
      <main id="top">
        <Hero />
        <PowerPath />
        <LayerStack />
        <Specification />
        <Finishes config={config} onSelect={selectFinish} />
        <Workshop />
        <Reserve
          config={config}
          setConfig={setConfig}
          name={name}
          setName={setName}
          email={email}
          setEmail={setEmail}
          reserved={reserved}
          chosen={chosen}
          onSubmit={handleSubmit}
        />
      </main>
      <SiteFooter />
    </div>
  )
}

// ---------------------------------------------------------------------------

const NAV = [
  ['path', 'Power path'],
  ['layers', 'Layers'],
  ['specification', 'Specification'],
  ['finishes', 'Finishes'],
  ['workshop', 'Workshop'],
]

function SiteHeader() {
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > window.innerHeight * 0.7)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className={'site-header' + (stuck ? ' is-stuck' : '')}>
      <div className="header-inner">
      <a className="wordmark" href="#top">
        <span className="wordmark-name">Aubry &amp; Vent</span>
        <span className="wordmark-sep" aria-hidden="true" />
        <span className="wordmark-cal">Caliber 08</span>
      </a>
      <nav className="site-nav" aria-label="Sections">
        {NAV.map(([id, label]) => (
          <a key={id} href={'#' + id}>
            {label}
          </a>
        ))}
      </nav>
      <a className="btn btn-small" href="#reserve">
        Reserve
      </a>
    </header>
  )
}

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-media">
        <img
          src="/media/movement-macro.webp"
          alt="Macro photograph of a hand-wound mechanical watch movement: gilt wheels, a coiled hairspring under its balance, and ruby jewels set into a brushed steel plate."
          width="1600"
          height="977"
          fetchPriority="high"
        />
        <span className="hero-scrim" aria-hidden="true" />
      </div>

      <div className="hero-body">
        <p className="eyebrow" data-reveal>
          <span className="tick" aria-hidden="true" />
          Aubry &amp; Vent · Vallée de Joux
        </p>
        <h1 id="hero-title" data-reveal>
          Caliber&nbsp;08
        </h1>
        <p className="hero-lede" data-reveal>
          A manual-winding mechanical movement, made in a run of 200 and then never again.
        </p>
        <p className="hero-claim" data-reveal>
          Seventy-two hours of stored energy, released one escape-wheel tooth at a time, five times a
          second, for three days from a single wind.
        </p>
        <div className="hero-actions" data-reveal>
          <a className="btn" href="#reserve">
            Reserve a movement
          </a>
          <a className="link-arrow" href="#path">
            Follow the energy through <ArrowDown size={15} strokeWidth={1.6} aria-hidden="true" />
          </a>
        </div>
      </div>

      <dl className="hero-figures" data-reveal>
        <div>
          <dt>Power reserve</dt>
          <dd>
            72<span>h</span>
          </dd>
        </div>
        <div>
          <dt>Frequency</dt>
          <dd>
            2.5<span>Hz</span>
          </dd>
        </div>
        <div>
          <dt>Components</dt>
          <dd>214</dd>
        </div>
        <div>
          <dt>Of the run</dt>
          <dd>200</dd>
        </div>
      </dl>
    </section>
  )
}

// ---------------------------------------------------------------------------
// The power path: the peak of the route. Six stages in the order the energy
// travels, each mark running at the rate that stage actually runs at wherever
// that rate can honestly be drawn.

function PowerPath() {
  const [active, setActive] = useState(0)
  const stageRefs = useRef([])

  useEffect(() => {
    const nodes = stageRefs.current.filter(Boolean)
    if (!nodes.length || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const i = Number(e.target.dataset.index)
          if (e.isIntersecting) setActive((prev) => (i > prev ? i : prev))
          e.target.classList.toggle('is-live', e.isIntersecting)
        })
      },
      { rootMargin: '-12% 0px -30% 0px', threshold: 0 },
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])

  const progress = ((active + 0.5) / POWER_PATH.length) * 100

  return (
    <section className="band band-dark path" id="path" aria-labelledby="path-title">
      <div className="band-inner">
        <header className="section-head" data-reveal>
          <p className="kicker">
            <span className="kicker-rule" aria-hidden="true" />
            The power path
          </p>
          <h2 id="path-title">
            Six stages, and the energy
            <br />
            goes through them in this order.
          </h2>
          <p className="section-lede">
            One wind puts three days into a steel ribbon. Everything after it is the movement letting
            that out slowly enough to be useful.
          </p>
          <p className="section-note">
            The escapement and the balance below beat at their real rate — five releases and five
            swings a second. The wheels above them are drawn turning far faster than they do: the
            barrel takes about eleven hours to come round once.
          </p>
        </header>

        <ol className="stages">
          <span className="stage-rail" aria-hidden="true">
            <span className="stage-rail-fill" style={{ '--progress': progress + '%' }} />
          </span>

          {POWER_PATH.map((s, i) => {
            const Mark = STAGE_MARKS[s.id]
            const view = STAGE_VIEW[s.id]
            const [fig, rest] = splitFigure(s.figure)
            return (
              <li
                key={s.id}
                data-stage={s.id}
                data-index={i}
                ref={(el) => (stageRefs.current[i] = el)}
                className={'stage' + (i <= active ? ' is-reached' : '')}
              >
                <div className="stage-row">
                  <div className="stage-index">
                    <span className="stage-num">{String(i + 1).padStart(2, '0')}</span>
                    <span
                      className={'stage-mark m-' + view.motion}
                      style={{ '--period': view.period }}
                    >
                      <Mark />
                    </span>
                  </div>

                  <div className="stage-text">
                    <h3>{s.name}</h3>
                    <p>{s.detail}</p>
                  </div>

                  <p className="stage-figure">
                    <strong>{fig}</strong>
                    <span>{rest}</span>
                  </p>
                </div>

                {view.photo && (
                  <figure className="stage-photo" data-reveal>
                    <img src={view.photo.src} alt={view.photo.alt} loading="lazy" decoding="async" />
                    <figcaption>{view.photo.caption}</figcaption>
                  </figure>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

// Split a figure line into the part that should be set large and the part that
// reads as its unit. "5 releases per second" -> "5" / "releases per second".
function splitFigure(figure) {
  const words = figure.split(' ')
  let take = 1
  if (words[0] === 'Torque') take = 4
  if (words[0] === 'Ratio') take = 4
  if (words[0] === 'Cumulative') take = 5
  return [words.slice(0, take).join(' '), words.slice(take).join(' ')]
}

// ---------------------------------------------------------------------------
// Four layers, drawn at their true relative thickness. They sum to the 3.8mm
// in the specification, which is the reason for drawing them to scale.

function LayerStack() {
  const [openId, setOpenId] = useState('main')
  const total = useMemo(() => Object.values(LAYER_MM).reduce((a, b) => a + b, 0), [])
  const openLayer = LAYERS.find((l) => l.id === openId)

  return (
    <section className="band band-paper layers" id="layers" aria-labelledby="layers-title">
      <div className="band-inner">
        <header className="section-head" data-reveal>
          <p className="kicker">
            <span className="kicker-rule" aria-hidden="true" />
            Section through the movement
          </p>
          <h2 id="layers-title">Four layers, {total.toFixed(1)}mm from front to back.</h2>
          <p className="section-lede">Drawn to scale. Choose a layer to lift it out of the stack.</p>
        </header>

        <div className="stack-wrap" data-reveal>
          <div className="stack-scale" aria-hidden="true">
            <span className="stack-scale-mark stack-scale-top">0</span>
            <span className="stack-scale-rule" />
            <span className="stack-scale-mark stack-scale-bot">{total.toFixed(1)}mm</span>
          </div>

          <div className="stack" role="radiogroup" aria-label="Layers of the movement, front to back">
            {LAYERS.map((l) => {
              const open = openId === l.id
              return (
                <button
                  key={l.id}
                  type="button"
                  role="radio"
                  aria-checked={open}
                  data-layer={l.id}
                  className={'slab' + (open ? ' is-open' : '')}
                  style={{ '--mm': LAYER_MM[l.id] }}
                  onClick={() => setOpenId(l.id)}
                >
                  <span className="slab-body" aria-hidden="true" />
                  <span className="slab-name">{l.name}</span>
                  <span className="slab-mm">{l.thickness}</span>
                </button>
              )
            })}
          </div>

          <div className="stack-notes">
            <p className="stack-note" role="status">
              <span className="stack-note-name">{openLayer.name}</span>
              <span className="stack-note-mm">{openLayer.thickness}</span>
              <span className="stack-note-text">{openLayer.note}</span>
            </p>
            <p className="stack-caption">
              Front of the movement at the top, caseback at the bottom. The balance cock comes last
              because the balance is the part you are meant to watch.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------

function Specification() {
  return (
    <section className="band band-paper spec" id="specification" aria-labelledby="spec-title">
      <div className="band-inner spec-inner">
        <div className="spec-drawing" data-reveal>
          <PlanView />
          <p className="spec-drawing-caption">
            Plan view at 31.0mm. A drawing, not a photograph — the first movements are still on the
            bench.
          </p>
        </div>

        <div className="spec-sheet" data-reveal>
          <header className="section-head section-head-tight">
            <p className="kicker">
              <span className="kicker-rule" aria-hidden="true" />
              Specification
            </p>
            <h2 id="spec-title">Every number we hold ourselves to.</h2>
          </header>
          <dl className="spec-list">
            {SPECS.map(([k, v]) => (
              <div key={k} className="spec-row">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------

function Finishes({ config, onSelect }) {
  return (
    <section className="band band-paper finishes" id="finishes" aria-labelledby="finishes-title">
      <div className="band-inner">
        <header className="section-head" data-reveal>
          <p className="kicker">
            <span className="kicker-rule" aria-hidden="true" />
            Three finishes
          </p>
          <h2 id="finishes-title">Same movement. Three ways of finishing it.</h2>
          <p className="section-lede">
            Prices are for the movement alone; casing is arranged separately. What you choose here
            carries through to the reservation.
          </p>
        </header>

        <div className="finish-grid" role="radiogroup" aria-label="Finish">
          {CONFIGURATIONS.map((c) => {
            const selected = config === c.id
            const allocated = RUN_TOTAL - c.remaining
            return (
              <article
                key={c.id}
                data-config={c.id}
                className={'finish' + (selected ? ' is-selected' : '')}
                data-reveal
              >
                <header className="finish-head">
                  <h3>{c.name}</h3>
                  <p className="finish-price">
                    <span className="cur">CHF</span> {chf(c.price)}
                  </p>
                </header>

                <p className="finish-desc">{c.finish}</p>

                <div className="finish-meta">
                  <p className="finish-lead">{c.lead}</p>
                  <div className="alloc">
                    <span className="alloc-bar" aria-hidden="true">
                      <span
                        className="alloc-fill"
                        style={{ '--pct': (allocated / RUN_TOTAL) * 100 + '%' }}
                      />
                    </span>
                    <span className="alloc-text">
                      <strong>{c.remaining}</strong> of the run still unallocated
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className="finish-choose"
                  onClick={() => onSelect(c.id)}
                >
                  <span className="finish-choose-box" aria-hidden="true">
                    <Check size={13} strokeWidth={2.4} />
                  </span>
                  {selected ? 'Chosen' : 'Choose this finish'}
                </button>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------

const ATELIER_LABELS = ['Vallée de Joux', 'Eleven', '200', '21 days', 'Indefinitely']

function Workshop() {
  return (
    <section className="band band-dark workshop" id="workshop" aria-labelledby="workshop-title">
      <div className="workshop-grid">
        <figure className="workshop-media" data-reveal>
          <img
            src="/media/lathe.webp"
            alt="A watchmaker's hands at a bench lathe, holding a graver against a small part spinning between centres."
            loading="lazy"
            decoding="async"
          />
          <figcaption>
            Turning a part on a bench lathe. Zephyris / Wikimedia Commons, CC BY-SA 3.0
          </figcaption>
        </figure>

        <div className="workshop-body">
          <header className="section-head" data-reveal>
            <p className="kicker">
              <span className="kicker-rule" aria-hidden="true" />
              The workshop
            </p>
            <h2 id="workshop-title">Eleven people, 200 movements, and no plan to make more.</h2>
          </header>

          <ul className="facts">
            {ATELIER.map((a, i) => (
              <li key={a} data-reveal>
                <span className="fact-label">{ATELIER_LABELS[i]}</span>
                <p>{a}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------

function Reserve({ config, setConfig, name, setName, email, setEmail, reserved, chosen, onSubmit }) {
  return (
    <section className="band band-paper reserve" id="reserve" aria-labelledby="reserve-title">
      <div className="band-inner reserve-inner">
        <div className="reserve-say" data-reveal>
          <header className="section-head section-head-tight">
            <p className="kicker">
              <span className="kicker-rule" aria-hidden="true" />
              Reserve
            </p>
            <h2 id="reserve-title">Hold one of the 200.</h2>
          </header>
          <p className="reserve-note">
            Reservations are not binding and no payment is taken now. We will write once, with the
            timing record of the movement allocated to you.
          </p>
          <ol className="reserve-steps">
            <li>
              <span>01</span>You choose a finish and leave a name.
            </li>
            <li>
              <span>02</span>We allocate a movement number against it.
            </li>
            <li>
              <span>03</span>We write once, when yours comes off the bench.
            </li>
          </ol>
        </div>

        <div className="reserve-panel" data-reveal>
          {reserved ? (
            <div className="docket" role="status">
              <p className="docket-stamp">
                <Check size={14} strokeWidth={2.4} aria-hidden="true" /> Reserved
              </p>
              <p className="docket-line">
                Reserved. {name}, we have held one {chosen.name} movement at CHF {chf(chosen.price)}{' '}
                and will write to {email}. {chosen.lead}.
              </p>
              <dl className="docket-rows">
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
              <p className="docket-foot">
                Not binding, and nothing has been charged. Change anything by writing to{' '}
                <a href="mailto:atelier@aubryvent.ch">atelier@aubryvent.ch</a>.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="form">
              <div className="field">
                <label htmlFor="config">Which finish?</label>
                <div className="select-wrap">
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

              <button type="submit" className="btn btn-block">
                Reserve a movement
              </button>
              <p className="form-foot">Not binding. No payment is taken.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <p className="footer-mark">Aubry &amp; Vent</p>
          <p className="footer-line">Caliber 08 · Vallée de Joux</p>
        </div>
        <a className="footer-mail" href="mailto:atelier@aubryvent.ch">
          <Mail size={15} strokeWidth={1.6} aria-hidden="true" />
          atelier@aubryvent.ch
          <ArrowUpRight size={14} strokeWidth={1.6} aria-hidden="true" />
        </a>
        <nav className="footer-nav" aria-label="More">
          <a href="#specification">Servicing</a>
          <a href="#workshop">Provenance</a>
          <a href="#reserve">Terms of reservation</a>
        </nav>
      </div>

      <div className="footer-bottom">
        <p className="credits">
          Photographs show other movements and other benches, not Caliber 08. Calibre and balance
          cock and train wheels,{' '}
          <a href="https://www.flickr.com/photos/76491533@N00/6095265888" rel="nofollow noreferrer">
            GuySie
          </a>{' '}
          (CC BY-SA 2.0); uncoiled mainspring,{' '}
          <a href="https://commons.wikimedia.org/w/index.php?curid=6096793" rel="nofollow noreferrer">
            Hustvedt
          </a>{' '}
          (CC BY-SA 3.0); bench lathe,{' '}
          <a href="https://commons.wikimedia.org/w/index.php?curid=27664029" rel="nofollow noreferrer">
            Zephyris
          </a>{' '}
          (CC BY-SA 3.0).
        </p>
        <p className="copyright">Aubry &amp; Vent. Caliber 08. © 2026.</p>
      </div>
    </footer>
  )
}
