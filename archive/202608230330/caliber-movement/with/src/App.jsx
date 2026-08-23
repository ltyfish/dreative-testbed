import { useCallback, useEffect, useRef, useState } from 'react'

// The power path, in the order energy actually travels. This order is a fact
// about the movement, not a layout decision.
const POWER_PATH = [
  {
    id: 'mainspring',
    name: 'Mainspring',
    detail: 'A 380mm hardened alloy ribbon, wound to 6.5 turns.',
    figure: '72 hours of stored energy at full wind',
    role: 'stores',
    media: 'mainspring',
  },
  {
    id: 'barrel',
    name: 'Barrel and stop-work',
    detail: 'Releases the spring at a near-constant torque and refuses the last eight per cent, where the rate would drift.',
    figure: 'Torque held within 4% across the run',
    role: 'meters',
    diagram: 'reserve',
  },
  {
    id: 'train',
    name: 'Gear train',
    detail: 'Four wheels step the barrel’s one slow turn up to the escape wheel’s fast one.',
    figure: 'Ratio 1 : 4,608',
    role: 'multiplies',
    diagram: 'ratio',
  },
  {
    id: 'escapement',
    name: 'Escapement',
    detail: 'A free-sprung lever in silicon releases the train one tooth at a time. This is the ticking.',
    figure: '5 releases per second',
    role: 'releases',
    media: 'openworked',
    diagram: 'beat',
  },
  {
    id: 'balance',
    name: 'Balance wheel',
    detail: 'A 10.6mm glucydur wheel swinging against a flat hairspring. Its period is what the watch calls a second.',
    figure: '18,000 semi-oscillations per hour',
    role: 'governs',
    media: 'balance',
  },
  {
    id: 'hands',
    name: 'Motion work and hands',
    detail: 'The last reduction divides that swing back down into minutes and hours.',
    figure: 'Cumulative deviation −1 to +4 seconds per day',
    role: 'reads out',
    diagram: 'deviation',
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

// Reference photography. These are photographs of comparable mechanical
// movements and of watchmaking work — not of Caliber 08 — and each one is
// credited where it appears.
const PLATES = {
  bridges: {
    file: 'bridges',
    w: 1000,
    h: 1400,
    alt: 'Macro photograph of striped watch bridges, ruby jewels and a gilt wheel inside a mechanical movement.',
    caption: 'Striped bridges, capped jewels and a gilt wheel',
    credit: 'Guy Sie',
    licence: 'CC BY-SA 2.0',
    href: 'https://commons.wikimedia.org/w/index.php?curid=113485927',
  },
  mainspring: {
    file: 'mainspring',
    w: 1280,
    h: 600,
    alt: 'A mainspring ribbon uncoiled on a pale surface, curving from a tight coil into a long S.',
    caption: 'A mainspring ribbon, uncoiled out of its barrel',
    credit: 'Hustvedt',
    licence: 'CC BY-SA 3.0',
    href: 'https://commons.wikimedia.org/w/index.php?curid=6096793',
  },
  openworked: {
    file: 'openworked',
    w: 1100,
    h: 1100,
    alt: 'Macro photograph of an open-worked movement showing the escape wheel, pallet fork and jewels.',
    caption: 'Escape wheel, pallet fork and jewelling, open-worked',
    credit: 'Hustvedt',
    licence: 'CC BY-SA 3.0',
    href: 'https://commons.wikimedia.org/w/index.php?curid=6037523',
  },
  balance: {
    file: 'balance',
    w: 1200,
    h: 900,
    alt: 'Macro photograph of a gilt balance wheel and its hairspring beneath a polished balance cock.',
    caption: 'A balance wheel and hairspring under the cock',
    credit: 'Hustvedt',
    licence: 'CC BY-SA 3.0',
    href: 'https://commons.wikimedia.org/wiki/File:Balance_wheel_Chinese_movement.jpg',
  },
  bench: {
    file: 'bench',
    w: 1300,
    h: 975,
    alt: 'Two hands turning a small part on a watchmaker’s lathe with a graver.',
    caption: 'A watchmaker’s lathe in use',
    credit: 'Zephyris',
    licence: 'CC BY-SA 3.0',
    href: 'https://commons.wikimedia.org/w/index.php?curid=27664029',
  },
  components: {
    file: 'components',
    w: 1000,
    h: 600,
    alt: 'Loose movement components and a pair of tweezers laid out on a bench tray.',
    caption: 'Loose components and tweezers on the tray',
    credit: 'Politikaner',
    licence: 'CC BY-SA 3.0',
    href: 'https://commons.wikimedia.org/wiki/File:Clockworks_Wien_2009_IMG_0028.JPG',
  },
}

const NAV = [
  ['power', 'Power path'],
  ['architecture', 'Architecture'],
  ['specification', 'Specification'],
  ['workshop', 'Workshop'],
  ['finishes', 'Finishes'],
]

const RUN_TOTAL = 200
const chf = (n) => n.toLocaleString('en-CH')

// One small entrance per region. Triggered against the upper two thirds of the
// viewport so it always resolves while the region is still on screen.
const REVEAL = '.hero__type, .hero__media, .band__head, .stage, .stack, .sheet, .shop__media, .shop__facts, .shop__strip, .fin, .res__left, .res__right, .foot__col'

function useReveals() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(REVEAL))
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.setAttribute('data-in', ''))
      return undefined
    }
    els.forEach((el) => el.setAttribute('data-reveal', ''))
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.setAttribute('data-in', '')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '-2% 0px -22% 0px', threshold: 0.01 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

function Plate({ name, className = '', sizes = '(max-width: 900px) 100vw, 50vw', priority = false }) {
  const p = PLATES[name]
  return (
    <figure className={`plate ${className}`}>
      <div className="plate__frame">
        <img
          src={`/media/${p.file}-1200.webp`}
          srcSet={`/media/${p.file}-640.webp 640w, /media/${p.file}-1200.webp 1200w`}
          sizes={sizes}
          width={p.w}
          height={p.h}
          alt={p.alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      </div>
      <figcaption>
        <span className="plate__label">Reference plate</span>
        <span className="plate__cap">{p.caption}</span>
        <span className="plate__credit">
          <a href={p.href} target="_blank" rel="noreferrer noopener">
            {p.credit}
          </a>{' '}
          · {p.licence}
        </span>
      </figcaption>
    </figure>
  )
}

/* ── The 72-hour rule: what the stop-work refuses ─────────────────────── */
function ReserveRule() {
  return (
    <div className="diagram diagram--rule" aria-hidden="true">
      <div className="rule__track">
        <div className="rule__used" />
        <div className="rule__refused" />
        {Array.from({ length: 13 }, (_, i) => (
          <span key={i} className="rule__tick" style={{ left: `${(i / 12) * 100}%` }} data-major={i % 3 === 0 || undefined} />
        ))}
      </div>
      <div className="rule__marks">
        <span>0h</span>
        <span className="rule__mid">usable run</span>
        <span>72h</span>
      </div>
      <p className="diagram__note">The hatched eight per cent is never released.</p>
    </div>
  )
}

/* ── Ratio: one barrel turn against 4,608 escape-wheel turns ───────────── */
function RatioDiagram() {
  return (
    <div className="diagram diagram--ratio" aria-hidden="true">
      <div className="ratio__row">
        <span className="ratio__wheel ratio__wheel--slow" />
        <span className="ratio__gap" />
        <span className="ratio__wheel ratio__wheel--fast" />
      </div>
      <div className="ratio__labels">
        <span>1 turn of the barrel</span>
        <span>4,608 of the escape wheel</span>
      </div>
    </div>
  )
}

/* ── The beat: the defining figure of the movement, in real time ───────── */
function BeatDiagram({ live }) {
  return (
    <div className="diagram diagram--beat" aria-hidden="true">
      <div className="beat__row" data-live={live || undefined}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className="beat__dot" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
      <p className="diagram__note">Five releases, one second — running at the caliber’s own rate.</p>
    </div>
  )
}

/* ── Deviation: −1 to +4 seconds a day, against a zero line ────────────── */
function DeviationDiagram() {
  return (
    <div className="diagram diagram--dev" aria-hidden="true">
      <div className="dev__scale">
        <span className="dev__zero" />
        <span className="dev__band" />
      </div>
      <div className="dev__labels">
        <span>−1s</span>
        <span className="dev__z">0</span>
        <span>+4s</span>
      </div>
      <p className="diagram__note">Cumulative deviation over one day, measured in six positions.</p>
    </div>
  )
}

function PowerPath() {
  const listRef = useRef(null)
  const rowRefs = useRef([])
  const [armed, setArmed] = useState(0)
  const [fill, setFill] = useState(0)
  const [beatLive, setBeatLive] = useState(false)

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const list = listRef.current
      if (!list) return
      const vh = window.innerHeight
      const line = vh * 0.66 // one authored progress value: where the energy has reached
      const box = list.getBoundingClientRect()
      setFill(Math.max(0, Math.min(1, (line - box.top) / Math.max(1, box.height))))
      let count = 0
      rowRefs.current.forEach((el) => {
        if (el && el.getBoundingClientRect().top < line) count += 1
      })
      setArmed(count)
      const esc = rowRefs.current[3]
      if (esc) {
        const r = esc.getBoundingClientRect()
        setBeatLive(r.top < vh * 0.9 && r.bottom > vh * 0.1)
      }
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

  return (
    <section className="band band--power" id="power" aria-labelledby="power-h">
      <div className="shell">
        <header className="band__head">
          <p className="eyebrow">
            <span className="eyebrow__num">01</span> The power path
          </p>
          <h2 id="power-h">Six stages between the wind and the hands.</h2>
          <p className="lede">
            In the order the energy actually travels through them. Wind the mainspring, and it takes
            three days to reach the far end of this list.
          </p>
        </header>

        <ol className="path" ref={listRef}>
          <div className="path__rail" aria-hidden="true">
            <div className="path__charge" style={{ height: `${fill * 100}%` }} />
          </div>
          {POWER_PATH.map((s, i) => (
            <li
              key={s.id}
              className="stage"
              data-stage={s.id}
              data-armed={i < armed || undefined}
              ref={(el) => {
                rowRefs.current[i] = el
              }}
            >
              <div className="stage__node" aria-hidden="true">
                <span className="stage__dot" />
              </div>
              <div className="stage__body">
                <p className="stage__index">
                  <span>{String(i + 1).padStart(2, '0')}</span> {s.role}
                </p>
                <h3 className="stage__name">{s.name}</h3>
                <p className="stage__detail">{s.detail}</p>
                <p className="stage__figure">{s.figure}</p>
              </div>
              <div className="stage__media">
                {s.media ? <Plate name={s.media} sizes="(max-width: 900px) 90vw, 34vw" /> : null}
                {s.diagram === 'reserve' && <ReserveRule />}
                {s.diagram === 'ratio' && <RatioDiagram />}
                {s.diagram === 'beat' && <BeatDiagram live={beatLive} />}
                {s.diagram === 'deviation' && <DeviationDiagram />}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Architecture() {
  const [active, setActive] = useState('main')
  const total = LAYERS.reduce((t, l) => t + l.mm, 0)
  const chosen = LAYERS.find((l) => l.id === active)

  return (
    <section className="band band--arch" id="architecture" aria-labelledby="arch-h">
      <div className="shell">
        <header className="band__head">
          <p className="eyebrow">
            <span className="eyebrow__num">02</span> Architecture
          </p>
          <h2 id="arch-h">Four layers. Three point eight millimetres, all in.</h2>
          <p className="lede">
            An elevation through the movement, front to back, drawn at true relative thickness.
            Take a layer to see where it sits.
          </p>
        </header>

        <div className="stack">
          <div className="stack__figure">
            <div className="stack__dim" aria-hidden="true">
              <span className="stack__dimline" />
              <span className="stack__dimval">{total.toFixed(1)}mm</span>
            </div>
            <div className="stack__plates" data-open={Boolean(active) || undefined}>
              {LAYERS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className="slab"
                  data-active={active === l.id || undefined}
                  style={{ height: `${l.mm * 46}px` }}
                  aria-pressed={active === l.id}
                  onClick={() => setActive(l.id)}
                  onMouseEnter={() => setActive(l.id)}
                  onFocus={() => setActive(l.id)}
                >
                  <span className="slab__face" />
                  <span className="slab__name">{l.name}</span>
                  <span className="slab__mm">{l.thickness}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="stack__read">
            <p className="stack__eyebrow">
              Layer {LAYERS.findIndex((l) => l.id === chosen.id) + 1} of 4 · front to back
            </p>
            <h3 className="stack__name">{chosen.name}</h3>
            <p className="stack__mm">{chosen.thickness}</p>
            <p className="stack__note">{chosen.note}</p>
            <ul className="stack__all">
              {LAYERS.map((l) => (
                <li key={l.id} data-active={active === l.id || undefined}>
                  <span>{l.name}</span>
                  <span className="mono">{l.thickness}</span>
                </li>
              ))}
              <li className="stack__total">
                <span>Overall height</span>
                <span className="mono">{total.toFixed(1)}mm</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function Specification() {
  return (
    <section className="band band--spec" id="specification" aria-labelledby="spec-h">
      <div className="shell">
        <div className="sheet">
          <header className="sheet__head">
            <p className="eyebrow eyebrow--dark">
              <span className="eyebrow__num">03</span> Specification
            </p>
            <h2 id="spec-h">Caliber 08, in full</h2>
            <p className="sheet__meta mono">Aubry &amp; Vent · Vallée de Joux · sheet 1 of 1</p>
          </header>
          <dl className="specs">
            {SPECS.map(([k, v]) => (
              <div className="specs__row" key={k}>
                <dt>{k}</dt>
                <dd className="mono">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

function Workshop() {
  const allocated = RUN_TOTAL - CONFIGURATIONS.reduce((t, c) => t + c.remaining, 0)
  const [lead, second, run, timing, service] = ATELIER

  return (
    <section className="band band--shop" id="workshop" aria-labelledby="shop-h">
      <div className="shell">
        <header className="band__head">
          <p className="eyebrow">
            <span className="eyebrow__num">04</span> The workshop
          </p>
          <h2 id="shop-h">Eleven watchmakers, and then the tooling is retired.</h2>
        </header>

        <div className="shop">
          <div className="shop__media">
            <Plate name="bench" sizes="(max-width: 900px) 92vw, 42vw" />
          </div>

          <div className="shop__facts">
            <p className="fact fact--lead">{lead}</p>
            <p className="fact">{second}</p>

            <div className="runcard">
              <p className="runcard__fact">{run}</p>
              <div className="runcard__grid" role="img" aria-label={`${allocated} of ${RUN_TOTAL} movements allocated, ${RUN_TOTAL - allocated} still unallocated.`}>
                {Array.from({ length: RUN_TOTAL }, (_, i) => (
                  <span key={i} className="runcard__tick" data-taken={i < allocated || undefined} />
                ))}
              </div>
              <p className="runcard__legend mono">
                <span className="key key--taken" /> {allocated} allocated
                <span className="key key--free" /> {RUN_TOTAL - allocated} unallocated
              </p>
            </div>

            <p className="fact">{timing}</p>
            <p className="fact fact--vow">{service}</p>
          </div>
        </div>

        <div className="shop__strip">
          <Plate name="components" className="plate--wide" sizes="(max-width: 900px) 92vw, 60vw" />
          <p className="shop__strip-note">
            <span className="mono">214</span> components leave the bench in the right order, or they
            do not leave it.
          </p>
        </div>
      </div>
    </section>
  )
}

function Finishes({ selected, onSelect }) {
  return (
    <section className="band band--fin" id="finishes" aria-labelledby="fin-h">
      <div className="shell">
        <header className="band__head">
          <p className="eyebrow">
            <span className="eyebrow__num">05</span> Finishes
          </p>
          <h2 id="fin-h">Three finishes, one caliber underneath.</h2>
          <p className="lede">
            Prices are for the movement alone; casing is arranged separately.
          </p>
        </header>

        <ul className="fins">
          {CONFIGURATIONS.map((c) => (
            <li key={c.id} className="fin" data-config={c.id} data-selected={selected === c.id || undefined}>
              <div className={`fin__swatch fin__swatch--${c.id}`} aria-hidden="true" />
              <h3 className="fin__name">{c.name}</h3>
              <p className="fin__desc">{c.finish}</p>
              <p className="fin__price mono">CHF {chf(c.price)}</p>
              <dl className="fin__meta">
                <div>
                  <dt>Delivery</dt>
                  <dd>{c.lead}</dd>
                </div>
                <div>
                  <dt>Remaining</dt>
                  <dd>
                    <span className="mono">{c.remaining}</span> of the run still unallocated
                  </dd>
                </div>
              </dl>
              <div className="fin__bar" aria-hidden="true">
                <span style={{ width: `${(c.remaining / 41) * 100}%` }} />
              </div>
              <button type="button" className="btn btn--ghost" onClick={() => onSelect(c.id)}>
                {selected === c.id ? 'Selected' : 'Choose this finish'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default function App() {
  const [config, setConfig] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reserved, setReserved] = useState(false)

  const chosen = CONFIGURATIONS.find((c) => c.id === config)

  useReveals()

  const choose = useCallback((id) => {
    setConfig(id)
    const el = document.getElementById('reserve')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !email || !config) return
    setReserved(true)
  }

  return (
    <div className="site">
      <a className="skip" href="#reserve">
        Skip to reservation
      </a>

      <header className="mast">
        <div className="mast__inner">
          <a className="mast__brand" href="#top">
            <span className="mast__house">Aubry &amp; Vent</span>
            <span className="mast__cal mono">Caliber 08</span>
          </a>
          <nav className="mast__nav" aria-label="Sections">
            {NAV.map(([id, label]) => (
              <a key={id} href={`#${id}`}>
                {label}
              </a>
            ))}
          </nav>
          <a className="btn btn--solid mast__cta" href="#reserve">
            Reserve
          </a>
        </div>
      </header>

      <main id="top">
        {/* ── Hero ───────────────────────────────────────────────────── */}
        <section className="hero" aria-labelledby="hero-h">
          <div className="hero__type">
            <p className="hero__kicker mono">Manual winding · 200 movements · then never again</p>
            <h1 id="hero-h">
              Caliber&nbsp;08
              <span className="hero__sub">
                A manual-winding mechanical movement, made in a run of 200 and then never again.
              </span>
            </h1>
            <p className="hero__claim">
              Seventy-two hours of stored energy, released one escape-wheel tooth at a time, five
              times a second, for three days from a single wind.
            </p>
            <div className="hero__actions">
              <a className="btn btn--solid" href="#reserve">
                Reserve a movement
              </a>
              <a className="btn btn--quiet" href="#power">
                Follow the power path
              </a>
            </div>
            <dl className="hero__figs">
              {[
                ['Diameter', '31.0mm'],
                ['Height', '3.8mm'],
                ['Components', '214'],
                ['Power reserve', '72h'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd className="mono">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="hero__media">
            <Plate name="bridges" priority sizes="(max-width: 900px) 100vw, 46vw" />
          </div>
        </section>

        <PowerPath />
        <Architecture />
        <Specification />
        <Workshop />
        <Finishes selected={config} onSelect={choose} />

        {/* ── Reserve ────────────────────────────────────────────────── */}
        <section className="band band--reserve" id="reserve" aria-labelledby="res-h">
          <div className="shell">
            <div className="res">
              <div className="res__left">
                <p className="eyebrow eyebrow--dark">
                  <span className="eyebrow__num">06</span> Reservation
                </p>
                <h2 id="res-h">Hold one of the two hundred.</h2>
                <p className="res__lede">
                  Reservations are not binding and no payment is taken now. We will write once, with
                  the timing record of the movement allocated to you.
                </p>

                {reserved ? (
                  <div className="docket docket--done" role="status">
                    <p className="docket__stamp mono">Reserved</p>
                    <p className="docket__line">
                      {name}, we have held one {chosen.name} movement at CHF {chf(chosen.price)} and
                      will write to {email}. {chosen.lead}.
                    </p>
                    <dl className="docket__rows">
                      <div>
                        <dt>Finish</dt>
                        <dd>{chosen.name}</dd>
                      </div>
                      <div>
                        <dt>Price</dt>
                        <dd className="mono">CHF {chf(chosen.price)}</dd>
                      </div>
                      <div>
                        <dt>Delivery</dt>
                        <dd>{chosen.lead}</dd>
                      </div>
                    </dl>
                    <p className="docket__foot">
                      Nothing is binding and no payment has been taken. Write to us at{' '}
                      <a href="mailto:atelier@aubryvent.ch">atelier@aubryvent.ch</a> to change or
                      release it.
                    </p>
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
                    <button type="submit" className="btn btn--solid btn--wide">
                      Reserve a movement
                    </button>
                  </form>
                )}
              </div>

              <aside className="res__right" aria-live="polite">
                {reserved ? (
                  <div className="docket docket--next">
                    <p className="docket__title mono">What happens next</p>
                    <ol className="next">
                      <li>
                        <span className="next__n mono">1</span>
                        <span>{ATELIER[3]}</span>
                      </li>
                      <li>
                        <span className="next__n mono">2</span>
                        <span>{ATELIER[4]}</span>
                      </li>
                    </ol>
                    <p className="docket__foot">
                      Nothing is owed until you say so. Reply to our letter to confirm or release
                      the movement.
                    </p>
                  </div>
                ) : (
                <div className="docket">
                  <p className="docket__title mono">Reservation docket</p>
                  {chosen ? (
                    <dl className="docket__rows">
                      <div>
                        <dt>Finish</dt>
                        <dd>{chosen.name}</dd>
                      </div>
                      <div>
                        <dt>Price</dt>
                        <dd className="mono">CHF {chf(chosen.price)}</dd>
                      </div>
                      <div>
                        <dt>Delivery</dt>
                        <dd>{chosen.lead}</dd>
                      </div>
                      <div>
                        <dt>Remaining</dt>
                        <dd className="mono">{chosen.remaining} of 200</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="docket__empty">
                      No finish chosen yet. Pick one above or in{' '}
                      <a href="#finishes">the three finishes</a>, and its price and delivery date
                      will be written here.
                    </p>
                  )}
                  <p className="docket__foot">
                    Not binding. No payment is taken now.
                  </p>
                </div>
                )}
              </aside>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="shell foot__inner">
          <div className="foot__col">
            <p className="foot__house">Aubry &amp; Vent</p>
            <p className="foot__line">
              Enquiries: <a href="mailto:atelier@aubryvent.ch">atelier@aubryvent.ch</a>
            </p>
            <p className="foot__line mono">Caliber 08. © 2026.</p>
          </div>
          <nav className="foot__col" aria-label="Further reading">
            <p className="foot__h mono">Further</p>
            <a href="#workshop">Servicing</a>
            <a href="#workshop">Provenance</a>
            <a href="#reserve">Terms of reservation</a>
          </nav>
          <div className="foot__col foot__col--credits">
            <p className="foot__h mono">Reference plates</p>
            <p className="foot__note">
              Photographs on this page are of comparable mechanical movements and of watchmaking
              work — not of Caliber 08.
            </p>
            <ul className="credits">
              {Object.values(PLATES).map((p) => (
                <li key={p.file}>
                  <a href={p.href} target="_blank" rel="noreferrer noopener">
                    {p.caption}
                  </a>{' '}
                  — {p.credit}, {p.licence}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}
