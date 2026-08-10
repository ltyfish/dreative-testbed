import { useCallback, useEffect, useRef, useState } from 'react'
import RoastLog from './RoastLog.jsx'
import { STEPS, REVIEWS, STAGES } from './data.js'

const NAV = [
  { href: '#beans', label: 'Beans' },
  { href: '#brew-guide', label: 'Brew Guide' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#subscribe', label: 'Subscribe' },
  { href: '#contact', label: 'Contact' },
]

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const set = () => setReduced(mq.matches)
    set()
    mq.addEventListener('change', set)
    return () => mq.removeEventListener('change', set)
  }, [])
  return reduced
}

/** Which roast stage the reader is currently standing in, plus overall page progress. */
function useRoastStage() {
  const [stage, setStage] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const read = () => {
      frame = 0
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0)

      const line = window.innerHeight * 0.42
      let current = 0
      STAGES.forEach((s, i) => {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top <= line) current = i
      })
      setStage(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return { stage, progress }
}

/** 0 → 1 as the given element travels through the viewport. Drives the brew clock. */
function useSectionProgress(ref) {
  const [p, setP] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let frame = 0
    const read = () => {
      frame = 0
      const r = el.getBoundingClientRect()
      const span = r.height + window.innerHeight * 0.5
      const travelled = window.innerHeight * 0.85 - r.top
      setP(Math.min(1, Math.max(0, travelled / span)))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ref])
  return p
}

/** Hero readout: one 12kg batch, charge to drop, played once on arrival. */
function BatchReadout({ reduced }) {
  const FINAL = { clock: '11:40', temp: 212 }
  const [frame, setFrame] = useState(reduced ? 1 : 0)

  useEffect(() => {
    if (reduced) {
      setFrame(1)
      return
    }
    const start = performance.now()
    const dur = 2200
    let raf = 0
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur)
      setFrame(t)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  const eased = 1 - Math.pow(1 - frame, 3)
  const seconds = Math.round(eased * 700)
  const clock = frame >= 1 ? FINAL.clock : `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  // Bean temperature dips at the turning point, then climbs to the drop.
  const temp = frame >= 1 ? FINAL.temp : Math.round(200 - 112 * Math.min(1, eased / 0.12) + 124 * Math.max(0, (eased - 0.12) / 0.88))

  return (
    <div className="batch" aria-hidden="true">
      <span className="batch-id">Batch 0412</span>
      <span className="batch-cell">
        <b>{clock}</b>
        <i>elapsed</i>
      </span>
      <span className="batch-cell">
        <b>{temp}°C</b>
        <i>bean temp</i>
      </span>
      <span className="batch-cell">
        <b>12kg</b>
        <i>charge</i>
      </span>
      <span className={`batch-state${frame >= 1 ? ' is-done' : ''}`}>{frame >= 1 ? 'Dropped' : 'Roasting'}</span>
    </div>
  )
}

export default function App() {
  const reduced = useReducedMotion()
  const { stage, progress } = useRoastStage()
  const brewRef = useRef(null)
  const brewProgress = useSectionProgress(brewRef)

  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [cart, setCart] = useState(0)
  const [added, setAdded] = useState(null)
  const addedTimer = useRef(null)

  const handleAdd = useCallback((bean) => {
    setCart((c) => c + 1)
    setAdded(bean.id)
    clearTimeout(addedTimer.current)
    addedTimer.current = setTimeout(() => setAdded(null), 1800)
  }, [])

  useEffect(() => () => clearTimeout(addedTimer.current), [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    setSent(true)
    setEmail('')
    setMessage('')
  }

  const active = STAGES[stage]
  const brewClock = `${String(Math.floor(brewProgress * 3)).padStart(2, '0')}:${String(
    Math.round(brewProgress * 180) % 60,
  ).padStart(2, '0')}`

  return (
    <div className="page">
      <a className="skip" href="#beans">Skip to the beans</a>

      <nav className="nav" id="site-nav">
        <span className="nav-logo">
          Northwind
          <em>Coffee Roasters · Bergen</em>
        </span>
        <div className="nav-links">
          {NAV.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
        <span className="nav-cart" role="status" aria-live="polite">
          {cart === 0 ? 'Cart empty' : `Cart · ${cart} bag${cart > 1 ? 's' : ''}`}
        </span>
      </nav>

      {/* Continuity: the whole route is one batch. The rail says where you are in it. */}
      <aside className="stagerail" aria-hidden="true">
        <span className="stagerail-title">Batch 0412</span>
        <div className="stagerail-track">
          <span className="stagerail-fill" style={{ transform: `scaleY(${progress})` }} />
        </div>
        <ol>
          {STAGES.map((s, i) => (
            <li key={s.id} className={i === stage ? 'is-on' : i < stage ? 'is-past' : ''}>
              <b>{s.clock}</b>
              <span>{s.label}</span>
            </li>
          ))}
        </ol>
      </aside>

      <div className="stagebar" aria-hidden="true">
        <span className="stagebar-fill" style={{ transform: `scaleX(${progress})` }} />
        <span className="stagebar-text">
          <b>{active.clock}</b> {active.label} <i>{active.temp}</i>
        </span>
      </div>

      <header className="hero" id="hero">
        <div className="hero-media">
          <img
            src="/img/IbZFP9eAIic.jpg"
            alt="Roasted beans falling from the drum into the cooling tray"
            width="1600"
            height="2400"
            fetchpriority="high"
          />
        </div>
        <div className="hero-body">
          <p className="tag">Bergen, Norway · est. 2014</p>
          <h1>
            Small-batch coffee,<br />
            roasted the morning<br />
            it ships.
          </h1>
          <p className="lede">
            We roast single-origin beans in 12kg batches on a 1962 Probat in Bergen, Norway, and ship
            them within hours. Freshness is not a slogan here; it is a timestamp on the bag.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#beans">Shop the beans</a>
            <a className="btn btn-secondary" href="#brew-guide">Learn to brew</a>
          </div>
        </div>
        <BatchReadout reduced={reduced} />
      </header>

      <section className="section story" id="story">
        <div className="story-grid">
          <div className="story-text">
            <p className="tag">Our story</p>
            <h2>Two roasters, one machine, eleven farms.</h2>
            <p>
              Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still
              small on purpose: two roasters, one machine, and direct relationships with eleven farms
              across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra. We pay on average 2.4× the
              commodity price and publish every contract.
            </p>
          </div>
          <figure className="story-media">
            <img
              src="/img/lEJDGl8nLhM.jpg"
              alt="A jute sack of green, unroasted coffee beans"
              width="1600"
              height="1067"
              loading="lazy"
            />
            <figcaption>Green arrivals, before anything happens to them.</figcaption>
          </figure>
        </div>
        <dl className="stats">
          <div className="stat">
            <dt>partner farms</dt>
            <dd>11</dd>
          </div>
          <div className="stat">
            <dt>commodity price paid</dt>
            <dd>2.4×</dd>
          </div>
          <div className="stat">
            <dt>max batch size</dt>
            <dd>12kg</dd>
          </div>
          <div className="stat">
            <dt>roast to shipment</dt>
            <dd>&lt;24h</dd>
          </div>
        </dl>
      </section>

      <section className="section beans" id="beans">
        <div className="section-head">
          <p className="tag">This month's beans</p>
          <h2>Every bag is a curve we can show you.</h2>
          <p className="section-sub">
            Pick an origin to read the profile it was roasted on — turning point, dry end, first crack,
            drop. The five faint lines behind it are the others, on the same drum, the same week.
          </p>
        </div>
        <RoastLog onAdd={handleAdd} added={added} />
      </section>

      <section className="section brew" id="brew-guide" ref={brewRef}>
        <div className="brew-grid">
          <div className="brew-lead">
            <p className="tag">Brew guide</p>
            <h2>Pour over in four steps.</h2>
            <p className="section-sub">
              The roast takes eleven minutes and forty seconds. Yours takes three. Same idea: know
              what time it is.
            </p>
            <figure className="brew-media">
              <img
                src="/img/Ta_v2pLJKcU.jpg"
                alt="Water poured from a gooseneck kettle into a pour-over dripper"
                width="1600"
                height="1067"
                loading="lazy"
              />
            </figure>
          </div>

          <div className="brewline" style={{ '--brew': brewProgress }}>
            <div className="brewline-track" aria-hidden="true">
              <span className="brewline-fill" />
              <span className="brewline-clock">{brewClock}</span>
            </div>
            <ol className="brewline-steps">
            {STEPS.map((s) => (
              <li className="step" key={s.n}>
                <span className="step-mark" aria-hidden="true" />
                <span className="step-clock">{s.mark}</span>
                <h3>
                  <span className="step-n">{s.n}</span>
                  {s.title}
                </h3>
                <p>{s.body}</p>
                <span className="step-aside">{s.aside}</span>
              </li>
            ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="section reviews" id="reviews">
        <div className="section-head">
          <p className="tag">What subscribers say</p>
          <h2>Roasted Tuesday. Opinions by Thursday.</h2>
        </div>
        <div className="review-list">
          {REVIEWS.map((r) => (
            <blockquote className="review" key={r.name}>
              <p>“{r.quote}”</p>
              <footer>
                <strong>{r.name}</strong>
                <span>{r.role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="section subscribe" id="subscribe">
        <figure className="subscribe-media">
          <img
            src="/img/mS2QlkTEirI.jpg"
            alt="Bergen seen from above, harbour and fjord under cloud"
            width="1600"
            height="1067"
            loading="lazy"
          />
        </figure>
        <div className="subscribe-body">
          <p className="tag">The Northwind subscription</p>
          <h2>It leaves Bergen before it cools.</h2>
          <p>
            Two 250g bags of our current favourites, every month, free shipping, pause any time.
            $29/month.
          </p>
          <ol className="ship">
            <li><b>+0h</b> <span>Dropped and cooled</span></li>
            <li><b>+18h</b> <span>Bagged, dated, boxed</span></li>
            <li><b>&lt;24h</b> <span>Out of the roastery</span></li>
          </ol>
          <a className="btn btn-primary" href="#contact">Start a subscription</a>
        </div>
      </section>

      <section className="section contact" id="contact">
        <div className="contact-grid">
          <div className="contact-lead">
            <p className="tag">Get in touch</p>
            <h2>Questions, wholesale, or just coffee talk.</h2>
            <p className="section-sub">Skuteviksboder 12, 5035 Bergen · Open Tuesday to Saturday.</p>
          </div>
          {sent ? (
            <p className="form-success" role="status">Thanks — we read everything and reply within a day.</p>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                rows={4}
                placeholder="Questions, wholesale, or just coffee talk"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Send message</button>
            </form>
          )}
        </div>
      </section>

      <footer className="footer" id="site-footer">
        <p className="footer-mark">Northwind Coffee Roasters</p>
        <div className="footer-links">
          <a href="#hero">Top</a>
          <a href="/shipping">Shipping</a>
          <a href="/returns">Returns</a>
          <a href="/privacy">Privacy</a>
        </div>
        <p className="footer-legal">© 2026 Northwind Coffee Roasters — Bergen, Norway</p>
      </footer>
    </div>
  )
}
