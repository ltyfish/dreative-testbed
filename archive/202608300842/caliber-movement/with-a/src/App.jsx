import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import PowerPath from './PowerPath.jsx'
import Plate from './Plate.jsx'
import { applyView } from './loupe.js'
import {
  ATELIER,
  CONFIGURATIONS,
  CREDITS,
  HEADLINE_SPECS,
  LAYERS,
  RUN_TOTAL,
  SPECS,
  chf,
} from './data.js'

/* ---------------------------------------------------------------- entrances */

// One entrance for every region, triggered against the top of the viewport so a
// reveal never resolves behind a reader who has already scrolled past it.
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-in')
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-in')
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

/* -------------------------------------------------------------------- hero */

function Hero() {
  const box = useRef(null)
  const img = useRef(null)
  const section = useRef(null)

  // A slow push into the photograph as the reader begins. Real pixels, real
  // camera move — the frame the whole route is built out of, opening.
  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const frame = () => {
      raf = 0
      const el = section.current
      if (!el) return
      const p = reduce ? 0 : Math.min(1, Math.max(0, -el.getBoundingClientRect().top / el.offsetHeight))
      applyView(img.current, box.current, {
        cx: 0.47 - 0.02 * p,
        cy: 0.5 - 0.03 * p,
        w: 0.9 - 0.28 * p,
      })
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }
    frame()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', frame)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', frame)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <header className="hero" ref={section}>
      <div className="hero-plate" ref={box}>
        <img
          ref={img}
          className="hero-img"
          src="/media/plate.jpg"
          alt="Caliber 08 seen from the bridge side: a brass plate, steel wheels and an open balance."
          fetchPriority="high"
          decoding="async"
        />
      </div>
      <div className="hero-scrim" aria-hidden="true" />

      <div className="hero-body">
        <p className="eyebrow">Aubry &amp; Vent — Vallée de Joux</p>
        <h1 className="hero-title">
          Caliber<span className="hero-num"> 08</span>
        </h1>
        <p className="hero-lede">
          A manual-winding mechanical movement, made in a run of 200 and then never again.
        </p>
        <p className="hero-sub">
          Seventy-two hours of stored energy, released one escape-wheel tooth at a time, five times a
          second, for three days from a single wind.
        </p>
        <div className="hero-meta mono">
          <span>31.0 mm × 3.8 mm</span>
          <span>214 parts</span>
          <span>from CHF {chf(24800)}</span>
        </div>
        <a className="hero-cue" href="#power-path">
          <span>Follow the energy</span>
          <span className="hero-cue-rule" aria-hidden="true" />
        </a>
      </div>
    </header>
  )
}

/* ------------------------------------------------------------------- stack */

function Stack() {
  const [active, setActive] = useState(1)
  const ref = useReveal()
  const layer = LAYERS[active]
  const total = LAYERS.reduce((a, l) => a + l.mm, 0)

  return (
    <section className="stack section" id="stack" ref={ref} aria-labelledby="stack-title">
      <div className="wrap">
        <header className="sec-head">
          <p className="eyebrow">Section 02 — construction</p>
          <h2 id="stack-title">Four layers, {total.toFixed(1)}mm</h2>
          <p className="sec-lede">
            Front to back. The four thicknesses add up to the height on the specification, because
            there is nothing else in there.
          </p>
        </header>

        <div className="stack-grid">
          <div className="stack-figure">
            <span className="stack-scale" aria-hidden="true">
              <span className="stack-scale-rule" />
              <span className="mono">{total.toFixed(1)} mm</span>
            </span>
            <ol className="stack-bands">
              {LAYERS.map((l, i) => (
                <li
                  key={l.id}
                  className={`stack-band${i === active ? ' is-on' : ''}`}
                  style={{ '--mm': l.mm }}
                >
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    aria-pressed={i === active}
                  >
                    <span className="stack-band-face" aria-hidden="true" />
                    <span className="stack-band-name">{l.name}</span>
                    <span className="stack-band-mm mono">{l.thickness}</span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="stack-axis mono" aria-hidden="true">
              dial side <span className="stack-axis-line" /> bridge side
            </p>
          </div>

          <div className="stack-view">
            <Plate
              view={layer.view}
              className="plate--stack"
              alt={`The ${layer.name.toLowerCase()} on the movement.`}
            >
              <div className="loupe-frame" aria-hidden="true">
                <span className="loupe-corner tl" />
                <span className="loupe-corner tr" />
                <span className="loupe-corner bl" />
                <span className="loupe-corner br" />
              </div>
            </Plate>
            <div className="stack-note" key={layer.id}>
              <p className="stack-note-facing mono">{layer.facing}</p>
              <p className="stack-note-text">{layer.note}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ record */

function Record() {
  const ref = useReveal()
  return (
    <section className="record section" id="record" ref={ref} aria-labelledby="record-title">
      <div className="record-band">
        <Plate
          view={{ cx: 0.5, cy: 0.56, w: 0.3 }}
          className="plate--band"
          alt="The steel ratchet wheel and the brass plate, at high magnification."
        />
        <div className="record-figures">
          {HEADLINE_SPECS.map((f) => (
            <div className="record-figure" key={f.unit}>
              <p className="record-value mono">{f.value}</p>
              <p className="record-unit">{f.unit}</p>
              <p className="record-note">{f.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="wrap">
        <header className="sec-head sec-head--tight">
          <p className="eyebrow">Section 03 — specification</p>
          <h2 id="record-title">The whole record</h2>
          <p className="sec-lede">
            Every movement is run for 21 days in six positions before it leaves, and the record of
            that run ships with it. This is what it is measured against.
          </p>
        </header>

        <dl className="ledger">
          {SPECS.map(([k, v]) => (
            <div className="ledger-row" key={k}>
              <dt>{k}</dt>
              <dd className="mono">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------- finishes */

function Finishes({ config, setConfig }) {
  const ref = useReveal()
  return (
    <section className="finishes section" id="finishes" ref={ref} aria-labelledby="finishes-title">
      <div className="wrap">
        <header className="sec-head">
          <p className="eyebrow">Section 04 — the decision</p>
          <h2 id="finishes-title">Three finishes</h2>
          <p className="sec-lede">
            Prices are for the movement alone; casing is arranged separately. The photographs are of
            each treatment, at about ten times life size.
          </p>
        </header>

        <div className="finish-grid" role="radiogroup" aria-label="Choose a finish">
          {CONFIGURATIONS.map((c) => {
            const on = config === c.id
            return (
              <article className={`finish${on ? ' is-on' : ''}`} key={c.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className="finish-hit"
                  onClick={() => setConfig(on ? '' : c.id)}
                >
                  <span className="sr-only">
                    Choose {c.name}, CHF {chf(c.price)}
                  </span>
                </button>
                <figure className="finish-media">
                  <img src={c.image} alt={c.alt} loading="lazy" decoding="async" />
                </figure>
                <div className="finish-body">
                  <h3 className="finish-name">{c.name}</h3>
                  <p className="finish-text">{c.finish}</p>
                  <p className="finish-price mono">CHF {chf(c.price)}</p>
                  <dl className="finish-facts">
                    <div>
                      <dt>Delivery</dt>
                      <dd className="mono">{c.lead}</dd>
                    </div>
                    <div>
                      <dt>Unallocated</dt>
                      <dd className="mono">{c.remaining} of the run</dd>
                    </div>
                  </dl>
                  <p className="finish-state" aria-hidden="true">
                    {on ? 'Chosen' : 'Choose this finish'}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- the run of 200 */

function Register({ config }) {
  // 123 of the 200 are spoken for. The 77 that are not are grouped by finish,
  // in the order the finishes are listed, so the block a reader is looking at
  // is the one they can still have.
  const allocated = RUN_TOTAL - CONFIGURATIONS.reduce((a, c) => a + c.remaining, 0)
  const marks = []
  for (let i = 0; i < allocated; i++) marks.push({ key: `a${i}`, owner: null })
  for (const c of CONFIGURATIONS)
    for (let i = 0; i < c.remaining; i++) marks.push({ key: `${c.id}${i}`, owner: c.id })

  return (
    <div className="register">
      <ol className="register-grid" aria-hidden="true">
        {marks.map((m) => (
          <li
            key={m.key}
            className={
              'mark' +
              (m.owner ? ' is-open' : ' is-taken') +
              (config && m.owner === config ? ' is-picked' : '')
            }
          />
        ))}
      </ol>
      <p className="register-key mono">
        <span className="key-item">
          <span className="mark is-taken" aria-hidden="true" /> {allocated} allocated
        </span>
        <span className="key-item">
          <span className="mark is-open" aria-hidden="true" /> {RUN_TOTAL - allocated} open
        </span>
        {config && (
          <span className="key-item is-picked-key">
            <span className="mark is-open is-picked" aria-hidden="true" />{' '}
            {CONFIGURATIONS.find((c) => c.id === config).remaining} in your finish
          </span>
        )}
      </p>
    </div>
  )
}

function Atelier({ config }) {
  const ref = useReveal()
  return (
    <section className="atelier section" id="atelier" ref={ref} aria-labelledby="atelier-title">
      <figure className="atelier-band">
        <img
          src="/media/bench.jpg"
          alt="A watchmaker's turns clamped to a workshop bench, with parts and a movement behind it."
          loading="lazy"
          decoding="async"
        />
        <figcaption className="mono">The bench the last eight per cent is argued over.</figcaption>
      </figure>

      <div className="wrap">
        <div className="atelier-grid">
          <div className="atelier-run">
            <header className="sec-head sec-head--tight">
              <p className="eyebrow">Section 05 — the run</p>
              <h2 id="atelier-title">Two hundred, then the tooling is retired</h2>
            </header>
            <Register config={config} />
          </div>

          <ol className="facts">
            {ATELIER.map((f) => (
              <li className="fact" key={f.lead}>
                <p className="fact-lead mono">
                  {f.lead}
                  {f.unit && <span className="fact-unit"> {f.unit}</span>}
                </p>
                <p className="fact-text">{f.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ reserve */

function Reserve({ config, setConfig }) {
  const ref = useReveal()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reserved, setReserved] = useState(false)
  const chosen = CONFIGURATIONS.find((c) => c.id === config)

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !email || !config) return
    setReserved(true)
  }

  return (
    <section className="reserve section" id="reserve" ref={ref} aria-labelledby="reserve-title">
      <div className="wrap">
        <header className="sec-head">
          <p className="eyebrow">Section 06 — reserve</p>
          <h2 id="reserve-title">Hold one of the two hundred</h2>
        </header>

        <div className="reserve-grid">
          <aside className="reserve-card">
            {chosen ? (
              <>
                <figure className="reserve-card-media">
                  <img src={chosen.image} alt={chosen.alt} loading="lazy" decoding="async" />
                </figure>
                <div className="reserve-card-body">
                  <p className="eyebrow">Your movement</p>
                  <h3>{chosen.name}</h3>
                  <p className="reserve-card-price mono">CHF {chf(chosen.price)}</p>
                  <p className="reserve-card-lead mono">{chosen.lead}</p>
                  <p className="reserve-card-rest mono">
                    {chosen.remaining} of the run still unallocated
                  </p>
                </div>
              </>
            ) : (
              <div className="reserve-card-body reserve-card-empty">
                <p className="eyebrow">Your movement</p>
                <p className="reserve-card-hint">
                  Choose a finish and it will be named here, with its price and its delivery date,
                  before you send anything.
                </p>
              </div>
            )}
            <p className="reserve-terms">
              Reservations are not binding and no payment is taken now. We will write once, with the
              timing record of the movement allocated to you.
            </p>
          </aside>

          <div className="reserve-form-wrap">
            {reserved ? (
              <p className="reserve-done" role="status">
                <span className="reserve-done-mark mono" aria-hidden="true">
                  ✓
                </span>
                Reserved. {name}, we have held one {chosen.name} movement at CHF{' '}
                {chf(chosen.price)} and will write to {email}. {chosen.lead}.
              </p>
            ) : (
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
                <button type="submit" className="btn">
                  Reserve a movement
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------- footer */

function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-top">
          <p className="foot-mark">
            Aubry &amp; Vent<span className="foot-dot">·</span>Caliber 08
          </p>
          <p className="foot-contact">
            Enquiries: <a href="mailto:atelier@aubryvent.ch">atelier@aubryvent.ch</a>
          </p>
        </div>
        <p className="foot-links">Servicing. Provenance. Terms of reservation.</p>

        <details className="credits">
          <summary>Photography and footage</summary>
          <ul>
            {CREDITS.map((c) => (
              <li key={c.url}>
                <span className="credits-what">{c.what}</span>
                <span className="credits-src">
                  <a href={c.url} rel="noreferrer noopener" target="_blank">
                    {c.title}
                  </a>{' '}
                  — {c.author},{' '}
                  <a href={c.licenceUrl} rel="noreferrer noopener license" target="_blank">
                    {c.licence}
                  </a>
                </span>
              </li>
            ))}
          </ul>
          <p className="credits-note">
            Photographs are of real mechanical movements and of the treatments named, graded into one
            set. They are not photographs of Caliber 08, which is not yet finished.
          </p>
        </details>

        <p className="foot-legal">Aubry &amp; Vent. Caliber 08. © 2026.</p>
      </div>
    </footer>
  )
}

/* --------------------------------------------------------------------- rail */

const RAIL = [
  ['power-path', 'Power path'],
  ['stack', 'Construction'],
  ['record', 'Specification'],
  ['finishes', 'Finishes'],
  ['atelier', 'The run'],
  ['reserve', 'Reserve'],
]

function Rail() {
  const [here, setHere] = useState('')
  useEffect(() => {
    const els = RAIL.map(([id]) => document.getElementById(id)).filter(Boolean)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setHere(e.target.id)
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <nav className="rail" aria-label="Sections">
      <span className="rail-mark mono">A&amp;V</span>
      <ol>
        {RAIL.map(([id, label]) => (
          <li key={id} className={here === id ? 'is-on' : ''}>
            <a href={`#${id}`}>
              <span className="rail-dot" aria-hidden="true" />
              <span className="rail-label">{label}</span>
            </a>
          </li>
        ))}
      </ol>
      <span className="rail-foot mono">08</span>
    </nav>
  )
}

/* ---------------------------------------------------------------------- app */

export default function App() {
  const [config, setConfig] = useState('')

  const choose = useCallback((id) => setConfig(id), [])

  return (
    <div className="page">
      <a className="skip" href="#power-path">
        Skip to the movement
      </a>
      <Rail />
      <main>
        <Hero />
        <PowerPath />
        <Stack />
        <Record />
        <Finishes config={config} setConfig={choose} />
        <Atelier config={config} />
        <Reserve config={config} setConfig={choose} />
      </main>
      <Footer />
      <div className="grain" aria-hidden="true" />
    </div>
  )
}
