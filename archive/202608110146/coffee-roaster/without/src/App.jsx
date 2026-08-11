import { useEffect, useMemo, useRef, useState } from 'react'

const BEANS = [
  {
    id: 'ethiopia',
    name: 'Ethiopia Yirgacheffe',
    notes: 'Jasmine, lemon zest, honey',
    roast: 'Light',
    price: 18,
    origin: 'Gedeb, Ethiopia',
    altitude: '1,950 m',
    process: 'Washed',
    bean: ['#c98f4e', '#8a5322'],
  },
  {
    id: 'colombia',
    name: 'Colombia Huila',
    notes: 'Caramel, red apple, cocoa',
    roast: 'Medium',
    price: 16,
    origin: 'Pitalito, Colombia',
    altitude: '1,700 m',
    process: 'Washed',
    bean: ['#a86a35', '#5f3315'],
  },
  {
    id: 'sumatra',
    name: 'Sumatra Mandheling',
    notes: 'Dark chocolate, cedar, earth',
    roast: 'Dark',
    price: 17,
    origin: 'Lintong, Sumatra',
    altitude: '1,400 m',
    process: 'Wet-hulled',
    bean: ['#6d4020', '#2c150a'],
  },
  {
    id: 'kenya',
    name: 'Kenya AA Nyeri',
    notes: 'Blackcurrant, tomato, brown sugar',
    roast: 'Light',
    price: 19,
    origin: 'Nyeri, Kenya',
    altitude: '1,800 m',
    process: 'Washed',
    bean: ['#cf9550', '#8d5726'],
  },
  {
    id: 'guatemala',
    name: 'Guatemala Antigua',
    notes: 'Milk chocolate, orange, almond',
    roast: 'Medium',
    price: 16,
    origin: 'Antigua, Guatemala',
    altitude: '1,600 m',
    process: 'Washed',
    bean: ['#a4682f', '#5a3113'],
  },
  {
    id: 'decaf',
    name: 'Swiss Water Decaf Blend',
    notes: 'Toffee, hazelnut, smooth',
    roast: 'Medium',
    price: 15,
    origin: 'Blend of three farms',
    altitude: '1,500 m',
    process: 'Swiss Water',
    bean: ['#9c6330', '#4f2b12'],
  },
]

const ROAST_POSITION = { Light: 0.2, Medium: 0.52, Dark: 0.86 }

const STEPS = [
  {
    n: 1,
    title: 'Weigh',
    body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.',
    meta: '18g : 300ml',
  },
  {
    n: 2,
    title: 'Grind',
    body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.',
    meta: 'Medium-fine',
  },
  {
    n: 3,
    title: 'Bloom',
    body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.',
    meta: '95°C · 0:30',
  },
  {
    n: 4,
    title: 'Pour',
    body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.',
    meta: '~3:00 total',
  },
]

const REVIEWS = [
  {
    quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.',
    name: 'Maya T.',
    role: 'Subscriber since 2022',
  },
  {
    quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.',
    name: 'Daniel R.',
    role: 'Home barista',
  },
  {
    quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.',
    name: 'Priya S.',
    role: 'Gift subscriber',
  },
]

const STATS = [
  { value: '11', label: 'partner farms', sub: 'across five countries' },
  { value: '2.4×', label: 'commodity price paid', sub: 'every contract published' },
  { value: '12kg', label: 'max batch size', sub: 'one 1962 Probat' },
  { value: '<24h', label: 'roast to shipment', sub: 'stamped on the bag' },
]

const NAV = [
  { href: '#beans', label: 'Beans' },
  { href: '#brew-guide', label: 'Brew Guide' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#subscribe', label: 'Subscribe' },
  { href: '#contact', label: 'Contact' },
]

/* Reveal-on-scroll. Degrades to "always visible" without IntersectionObserver
   or when the visitor prefers reduced motion. */
function useReveal() {
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'))
    if (reduced || typeof IntersectionObserver === 'undefined') {
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

function useScrolled(offset = 24) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [offset])
  return scrolled
}

/* The roast dial that recurs across the site: a heat gradient with a marker
   sitting where this coffee stops. */
function RoastDial({ roast, label = true }) {
  return (
    <div className="dial" title={`${roast} roast`}>
      {label && <span className="dial-label">{roast}</span>}
      <span className="dial-track" aria-hidden="true">
        <span className="dial-marker" style={{ left: `${ROAST_POSITION[roast] * 100}%` }} />
      </span>
    </div>
  )
}

function BeanCard({ bean, onAdd }) {
  const [added, setAdded] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  function handleAdd() {
    onAdd(bean)
    setAdded(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setAdded(false), 1600)
  }

  return (
    <article className="bean-card" data-bean={bean.id} data-reveal>
      <div
        className="bean-photo"
        aria-hidden="true"
        style={{ '--bean-a': bean.bean[0], '--bean-b': bean.bean[1] }}
      >
        <span className="bean-seed" />
        <span className="bean-origin">{bean.origin}</span>
      </div>
      <div className="bean-body">
        <h3>{bean.name}</h3>
        <p className="bean-notes">{bean.notes}</p>
        <RoastDial roast={bean.roast} />
        <p className="bean-meta">
          {bean.roast} roast · 250g · {bean.process} · {bean.altitude}
        </p>
      </div>
      <div className="bean-buy">
        <span className="bean-price">${bean.price}</span>
        <button type="button" onClick={handleAdd} data-added={added || undefined}>
          <span>{added ? 'Added' : 'Add to cart'}</span>
        </button>
      </div>
    </article>
  )
}

export default function App() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [cart, setCart] = useState([])
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  useReveal()
  const scrolled = useScrolled()

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price, 0), [cart])

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  function addToCart(bean) {
    setCart((c) => [...c, bean])
    setToast(`${bean.name} added to cart`)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }

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

      <nav className="nav" id="site-nav" data-scrolled={scrolled || undefined}>
        <div className="nav-inner">
          <a className="nav-logo" href="#hero">
            <span className="nav-mark" aria-hidden="true" />
            <span className="nav-name">
              Northwind<span className="nav-name-sub">Coffee Roasters</span>
            </span>
          </a>
          <div className="nav-links">
            {NAV.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
          <div className="nav-cart" aria-live="polite">
            <span className="nav-cart-count">{cart.length}</span>
            <span className="nav-cart-total">${cartTotal}</span>
          </div>
        </div>
      </nav>

      <header className="hero" id="hero">
        <div className="hero-ember" aria-hidden="true" />
        <div className="hero-grain" aria-hidden="true" />
        <div className="hero-inner">
          <p className="eyebrow">60°23′N · Bergen, Norway · est. 2014</p>
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
        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">
            {Array.from({ length: 2 }).map((_, i) => (
              <span className="ticker-run" key={i}>
                {BEANS.map((b) => (
                  <span className="ticker-item" key={b.id}>
                    <span className="ticker-dot" />
                    {b.name} <em>{b.notes}</em>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main>
        <section className="section story" id="story">
          <div className="section-head" data-reveal>
            <span className="section-index">01</span>
            <h2>Two roasters, one machine, eleven farms.</h2>
          </div>
          <div className="story-grid">
            <p className="story-copy" data-reveal>
              Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still
              small on purpose: two roasters, one machine, and direct relationships with eleven farms
              across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra. We pay on average 2.4× the
              commodity price and publish every contract.
            </p>
            <ul className="stats">
              {STATS.map((s) => (
                <li className="stat" key={s.label} data-reveal>
                  <strong>{s.value}</strong>
                  <span className="stat-label">{s.label}</span>
                  <span className="stat-sub">{s.sub}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section beans" id="beans">
          <div className="section-head" data-reveal>
            <span className="section-index">02</span>
            <h2>This month's beans</h2>
            <p className="section-note">
              Six lots on the bar right now. Roasted to order, never sat in a warehouse.
            </p>
          </div>
          <div className="roast-legend" data-reveal>
            <span>Light</span>
            <span className="roast-legend-bar" aria-hidden="true" />
            <span>Dark</span>
          </div>
          <div className="bean-grid">
            {BEANS.map((b) => (
              <BeanCard bean={b} key={b.id} onAdd={addToCart} />
            ))}
          </div>
        </section>

        <section className="section brew" id="brew-guide">
          <div className="section-head" data-reveal>
            <span className="section-index">03</span>
            <h2>Brew guide: pour over in four steps</h2>
            <p className="section-note">Three minutes, start to cup. No special gear required.</p>
          </div>
          <ol className="steps">
            {STEPS.map((s) => (
              <li className="step" key={s.n} data-reveal>
                <span className="step-number">{s.n}</span>
                <div className="step-body">
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
                <span className="step-meta">{s.meta}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="section reviews" id="reviews">
          <div className="section-head" data-reveal>
            <span className="section-index">04</span>
            <h2>What subscribers say</h2>
          </div>
          <div className="reviews-grid">
            {REVIEWS.map((r) => (
              <blockquote className="review" key={r.name} data-reveal>
                <span className="review-quote" aria-hidden="true">”</span>
                <p>“{r.quote}”</p>
                <footer>
                  <strong>{r.name}</strong> — {r.role}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section className="section subscribe" id="subscribe">
          <div className="subscribe-card" data-reveal>
            <div className="subscribe-ember" aria-hidden="true" />
            <span className="section-index">05</span>
            <h2>The Northwind subscription</h2>
            <p>
              Two 250g bags of our current favourites, every month, free shipping, pause any time.
              $29/month.
            </p>
            <a className="btn btn-primary" href="#contact">Start a subscription</a>
          </div>
        </section>

        <section className="section contact" id="contact">
          <div className="contact-grid">
            <div className="section-head" data-reveal>
              <span className="section-index">06</span>
              <h2>Get in touch</h2>
              <p className="section-note">
                Wholesale, a wrong grind size, or just coffee talk — it lands in the same inbox,
                and the two of us read it.
              </p>
            </div>
            <div className="contact-panel" data-reveal>
              {sent ? (
                <p className="form-success" role="status">
                  Thanks — we read everything and reply within a day.
                </p>
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
          </div>
        </section>
      </main>

      <footer className="footer" id="site-footer">
        <div className="footer-inner">
          <p>© 2026 Northwind Coffee Roasters — Bergen, Norway</p>
          <div className="footer-links">
            <a href="#hero">Top</a>
            <a href="/shipping">Shipping</a>
            <a href="/returns">Returns</a>
            <a href="/privacy">Privacy</a>
          </div>
        </div>
      </footer>

      <div className="toast" role="status" aria-live="polite" data-visible={toast ? 'true' : undefined}>
        {toast}
      </div>
    </div>
  )
}
