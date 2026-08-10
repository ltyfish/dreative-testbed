import { useEffect, useMemo, useRef, useState } from 'react'

const BEANS = [
  { id: 'ethiopia', name: 'Ethiopia Yirgacheffe', notes: 'Jasmine, lemon zest, honey', roast: 'Light', price: 18, origin: 'Gedeo Zone, Ethiopia', altitude: '1,950 m' },
  { id: 'colombia', name: 'Colombia Huila', notes: 'Caramel, red apple, cocoa', roast: 'Medium', price: 16, origin: 'Huila, Colombia', altitude: '1,700 m' },
  { id: 'sumatra', name: 'Sumatra Mandheling', notes: 'Dark chocolate, cedar, earth', roast: 'Dark', price: 17, origin: 'North Sumatra, Indonesia', altitude: '1,300 m' },
  { id: 'kenya', name: 'Kenya AA Nyeri', notes: 'Blackcurrant, tomato, brown sugar', roast: 'Light', price: 19, origin: 'Nyeri County, Kenya', altitude: '1,800 m' },
  { id: 'guatemala', name: 'Guatemala Antigua', notes: 'Milk chocolate, orange, almond', roast: 'Medium', price: 16, origin: 'Antigua Valley, Guatemala', altitude: '1,550 m' },
  { id: 'decaf', name: 'Swiss Water Decaf Blend', notes: 'Toffee, hazelnut, smooth', roast: 'Medium', price: 15, origin: 'Blend of three origins', altitude: '1,400 m' },
]

const STEPS = [
  { n: 1, title: 'Weigh', body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.', clock: '00:00' },
  { n: 2, title: 'Grind', body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.', clock: '00:20' },
  { n: 3, title: 'Bloom', body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.', clock: '00:30' },
  { n: 4, title: 'Pour', body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.', clock: '03:00' },
]

const REVIEWS = [
  { quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.', name: 'Maya T.', role: 'Subscriber since 2022' },
  { quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.', name: 'Daniel R.', role: 'Home barista' },
  { quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.', name: 'Priya S.', role: 'Gift subscriber' },
]

const NAV = [
  { href: '#beans', label: 'Beans' },
  { href: '#brew-guide', label: 'Brew Guide' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#subscribe', label: 'Subscribe' },
  { href: '#contact', label: 'Contact' },
]

const STATS = [
  { value: '11', label: 'partner farms', sub: 'Ethiopia · Colombia · Kenya · Guatemala · Sumatra' },
  { value: '2.4×', label: 'commodity price paid', sub: 'average across every contract, published in full' },
  { value: '12kg', label: 'max batch size', sub: 'one 1962 Probat, two roasters, no shortcuts' },
  { value: '<24h', label: 'roast to shipment', sub: 'the bag is stamped with the hour it left the drum' },
]

/* The roast scale doubles as the card's colour key: light beans read pale and acidic,
   dark beans read deep and oily. Index is 1-based out of ROAST_STEPS. */
const ROAST_STEPS = 5
const ROAST_INDEX = { Light: 2, Medium: 3, Dark: 5 }
const ROAST_TINT = { Light: '#c98f3f', Medium: '#9c5a2c', Dark: '#4e2c1b' }

function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'))
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach((n) => n.setAttribute('data-revealed', 'true'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-revealed', 'true')
            io.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])
}

function useScrollSpy(ids) {
  const [active, setActive] = useState(null)
  useEffect(() => {
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean)
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5] },
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [ids])
  return active
}

/* A real roast profile: bean temperature over eleven minutes, with the
   milestones a roaster actually calls out. Drawn, not photographed. */
function RoastCurve() {
  const path =
    'M 0 168 C 34 168 52 120 80 96 C 112 68 150 54 196 44 C 250 32 310 24 372 18'
  return (
    <svg className="curve" viewBox="0 0 380 200" role="img" aria-label="Roast profile: bean temperature rising over eleven minutes, through drying, first crack, and drop.">
      <defs>
        <linearGradient id="curveStroke" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#6d503a" />
          <stop offset="55%" stopColor="#c2662c" />
          <stop offset="100%" stopColor="#f0a44e" />
        </linearGradient>
      </defs>
      <g className="curve-grid">
        {[24, 60, 96, 132, 168].map((y) => (
          <line key={y} x1="0" y1={y} x2="380" y2={y} />
        ))}
        {[0, 95, 190, 285, 380].map((x) => (
          <line key={x} x1={x} y1="4" x2={x} y2="188" />
        ))}
      </g>
      <path className="curve-line" d={path} />
      <g className="curve-marks">
        <g transform="translate(80 96)">
          <circle r="4" />
          <text x="8" y="-6">drying ends · 05:10</text>
        </g>
        <g transform="translate(196 44)">
          <circle r="4" />
          <text x="8" y="-6">first crack · 08:40</text>
        </g>
        <g transform="translate(372 18)">
          <circle r="4" />
          <text x="-8" y="-6" textAnchor="end">drop · 11:00</text>
        </g>
      </g>
      <g className="curve-axis">
        <text x="0" y="196">0 min</text>
        <text x="380" y="196" textAnchor="end">11 min</text>
      </g>
    </svg>
  )
}

function RoastScale({ roast }) {
  const filled = ROAST_INDEX[roast] ?? 3
  return (
    <span className="roast-scale" title={`${roast} roast`}>
      <span className="roast-label">{roast}</span>
      <span className="roast-dots" aria-hidden="true">
        {Array.from({ length: ROAST_STEPS }, (_, i) => (
          <span key={i} data-on={i < filled ? 'true' : undefined} />
        ))}
      </span>
    </span>
  )
}

function BeanCard({ bean, count, onAdd }) {
  const noteList = bean.notes.split(',').map((n) => n.trim())
  return (
    <article className="bean-card" data-bean={bean.id} data-reveal>
      <div
        className="bean-photo"
        aria-hidden="true"
        style={{ '--tint': ROAST_TINT[bean.roast] }}
      >
        <span className="bean-index">{String(BEANS.indexOf(bean) + 1).padStart(2, '0')}</span>
      </div>
      <div className="bean-body">
        <h3>{bean.name}</h3>
        <p className="bean-origin">{bean.origin} · {bean.altitude}</p>
        <p className="bean-notes">
          {noteList.map((n) => (
            <span className="note" key={n}>{n}</span>
          ))}
        </p>
        <p className="bean-meta">
          <RoastScale roast={bean.roast} />
          <span className="bean-weight">250g</span>
        </p>
        <div className="bean-buy">
          <span className="bean-price">${bean.price}</span>
          <button type="button" className="add" onClick={() => onAdd(bean)} data-in-cart={count > 0 ? 'true' : undefined}>
            {count > 0 ? `In cart · ${count}` : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  )
}

export default function App() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [cart, setCart] = useState({})
  const [lastAdded, setLastAdded] = useState(null)
  const toastTimer = useRef(null)

  useReveal()
  const sectionIds = useMemo(() => NAV.map((n) => n.href.slice(1)), [])
  const active = useScrollSpy(sectionIds)

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)

  function addToCart(bean) {
    setCart((c) => ({ ...c, [bean.id]: (c[bean.id] || 0) + 1 }))
    setLastAdded(bean.name)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setLastAdded(null), 2600)
  }

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    setSent(true)
    setEmail('')
    setMessage('')
  }

  return (
    <div className="page">
      <a className="skip" href="#hero">Skip to content</a>

      <nav className="nav" id="site-nav">
        <a className="nav-logo" href="#hero">
          <span className="mark" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M4 20 L12 3 L20 20" /><path d="M8 13 H16" /></svg>
          </span>
          <span className="nav-word">
            <strong>Northwind</strong>
            <em>Coffee Roasters</em>
          </span>
        </a>
        <div className="nav-links">
          {NAV.map((l) => (
            <a key={l.href} href={l.href} data-active={active === l.href.slice(1) ? 'true' : undefined}>
              {l.label}
            </a>
          ))}
        </div>
        <span className="nav-cart" aria-live="polite">
          Cart <b>{cartCount}</b>
        </span>
      </nav>

      <header className="hero" id="hero">
        <div className="hero-grain" aria-hidden="true" />
        <div className="hero-inner">
          <p className="eyebrow">Bergen, Norway · 60°23′N · est. 2014</p>
          <h1>
            Small-batch coffee,
            <em> roasted the morning</em> it ships.
          </h1>
          <p className="hero-lede">
            We roast single-origin beans in 12kg batches on a 1962 Probat in Bergen, Norway,
            and ship them within hours. Freshness is not a slogan here; it is a timestamp on the bag.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#beans">Shop the beans</a>
            <a className="btn btn-secondary" href="#brew-guide">Learn to brew</a>
          </div>
        </div>
        <figure className="hero-figure">
          <RoastCurve />
          <figcaption>Batch 1184 · Kenya AA Nyeri · drum drop at 11:00</figcaption>
        </figure>
        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">
            {Array.from({ length: 2 }, (_, r) => (
              <span className="ticker-run" key={r}>
                {['Gedeo Zone', 'Huila', 'North Sumatra', 'Nyeri County', 'Antigua Valley', 'Sidama', 'Kirinyaga', 'Tolima', 'Aceh', 'Acatenango', 'Guji'].map((f) => (
                  <span className="ticker-item" key={f}>{f}</span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main>
        <section className="section story" id="story" data-reveal>
          <div className="section-head">
            <span className="section-no">01</span>
            <h2>Our story</h2>
          </div>
          <div className="story-grid">
            <p className="story-lede">
              Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still
              small on purpose: two roasters, one machine, and direct relationships with eleven farms
              across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra. We pay on average 2.4× the
              commodity price and publish every contract.
            </p>
            <dl className="stats">
              {STATS.map((s) => (
                <div className="stat" key={s.label}>
                  <dt>
                    <strong>{s.value}</strong>
                    <span>{s.label}</span>
                  </dt>
                  <dd>{s.sub}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="section beans" id="beans">
          <div className="section-head" data-reveal>
            <span className="section-no">02</span>
            <h2>This month's beans</h2>
            <p className="section-note">Six lots on the bench right now. When a lot runs out, it is gone until next harvest.</p>
          </div>
          <div className="bean-grid">
            {BEANS.map((b) => (
              <BeanCard key={b.id} bean={b} count={cart[b.id] || 0} onAdd={addToCart} />
            ))}
          </div>
        </section>

        <section className="section brew" id="brew-guide">
          <div className="section-head" data-reveal>
            <span className="section-no">03</span>
            <h2>Brew guide: pour over in four steps</h2>
            <p className="section-note">Three minutes, one scale, no gadgets.</p>
          </div>
          <ol className="steps">
            {STEPS.map((s) => (
              <li className="step" key={s.n} data-reveal>
                <span className="step-clock">{s.clock}</span>
                <span className="step-number">{String(s.n).padStart(2, '0')}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section reviews" id="reviews">
          <div className="section-head" data-reveal>
            <span className="section-no">04</span>
            <h2>What subscribers say</h2>
          </div>
          <div className="reviews-grid">
            {REVIEWS.map((r) => (
              <blockquote className="review" key={r.name} data-reveal>
                <span className="quote-mark" aria-hidden="true">“</span>
                <p>{r.quote}</p>
                <footer>
                  <strong>{r.name}</strong>
                  <span>{r.role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section className="section subscribe" id="subscribe" data-reveal>
          <div className="subscribe-card">
            <span className="section-no">05</span>
            <h2>The Northwind subscription</h2>
            <p>
              Two 250g bags of our current favourites, every month, free shipping, pause any time.
              $29/month.
            </p>
            <a className="btn btn-primary" href="#contact">Start a subscription</a>
          </div>
        </section>

        <section className="section contact" id="contact">
          <div className="section-head" data-reveal>
            <span className="section-no">06</span>
            <h2>Get in touch</h2>
            <p className="section-note">Wholesale, brew trouble, or just coffee talk — the same two people read it.</p>
          </div>
          <div className="contact-panel" data-reveal>
            {sent ? (
              <p className="form-success" role="status">
                <span aria-hidden="true">✓</span>
                Thanks — we read everything and reply within a day.
              </p>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="field">
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
                </div>
                <div className="field">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    placeholder="Questions, wholesale, or just coffee talk"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary">Send message</button>
              </form>
            )}
            <aside className="contact-aside">
              <p className="mono">Roastery</p>
              <p>Sandviksveien 12<br />5035 Bergen, Norway</p>
              <p className="mono">Hours</p>
              <p>Tue–Sat, 08:00–16:00<br />Roasting Mondays</p>
            </aside>
          </div>
        </section>
      </main>

      <footer className="footer" id="site-footer">
        <p className="footer-mark">Northwind</p>
        <p>© 2026 Northwind Coffee Roasters — Bergen, Norway</p>
        <div className="footer-links">
          <a href="#hero">Top</a>
          <a href="/shipping">Shipping</a>
          <a href="/returns">Returns</a>
          <a href="/privacy">Privacy</a>
        </div>
      </footer>

      <div className="toast" role="status" aria-live="polite" data-show={lastAdded ? 'true' : undefined}>
        {lastAdded ? `${lastAdded} added to cart` : ''}
      </div>
    </div>
  )
}
