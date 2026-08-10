import { useCallback, useEffect, useRef, useState } from 'react'

const BEANS = [
  { id: 'ethiopia', name: 'Ethiopia Yirgacheffe', notes: 'Jasmine, lemon zest, honey', roast: 'Light', price: 18, origin: 'Gedeo Zone', alt: '1,950 m' },
  { id: 'colombia', name: 'Colombia Huila', notes: 'Caramel, red apple, cocoa', roast: 'Medium', price: 16, origin: 'Pitalito', alt: '1,700 m' },
  { id: 'sumatra', name: 'Sumatra Mandheling', notes: 'Dark chocolate, cedar, earth', roast: 'Dark', price: 17, origin: 'Lake Toba', alt: '1,300 m' },
  { id: 'kenya', name: 'Kenya AA Nyeri', notes: 'Blackcurrant, tomato, brown sugar', roast: 'Light', price: 19, origin: 'Nyeri County', alt: '1,800 m' },
  { id: 'guatemala', name: 'Guatemala Antigua', notes: 'Milk chocolate, orange, almond', roast: 'Medium', price: 16, origin: 'Antigua Valley', alt: '1,550 m' },
  { id: 'decaf', name: 'Swiss Water Decaf Blend', notes: 'Toffee, hazelnut, smooth', roast: 'Medium', price: 15, origin: 'Blend of three lots', alt: '—' },
]

const STEPS = [
  { n: 1, title: 'Weigh', body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.', tag: '18g / 300ml' },
  { n: 2, title: 'Grind', body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.', tag: 'Medium-fine' },
  { n: 3, title: 'Bloom', body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.', tag: '95°C / 30s' },
  { n: 4, title: 'Pour', body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.', tag: '~3 min total' },
]

const REVIEWS = [
  { quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.', name: 'Maya T.', role: 'Subscriber since 2022' },
  { quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.', name: 'Daniel R.', role: 'Home barista' },
  { quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.', name: 'Priya S.', role: 'Gift subscriber' },
]

const NAV = [
  ['Beans', '#beans'],
  ['Brew Guide', '#brew-guide'],
  ['Reviews', '#reviews'],
  ['Subscribe', '#subscribe'],
  ['Contact', '#contact'],
]

const STATS = [
  { value: 11, display: '11', label: 'partner farms', note: 'Ethiopia · Colombia · Kenya · Guatemala · Sumatra' },
  { value: 2.4, display: '2.4×', label: 'commodity price paid', note: 'Average across every contract, all published' },
  { value: 12, display: '12kg', label: 'max batch size', note: 'One 1962 Probat, two roasters, no shortcuts' },
  { value: 24, display: '<24h', label: 'roast to shipment', note: 'Bagged, sealed and out the door same day' },
]

const ROAST_LEVEL = { Light: 1, Medium: 2, Dark: 3 }

/* Reveals a node once it enters the viewport; degrades to always-visible. */
function useReveal() {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  return [ref, shown]
}

function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const [ref, shown] = useReveal()
  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? 'is-in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

function SectionHead({ index, kicker, title, lede }) {
  return (
    <header className="sec-head">
      <p className="sec-index">
        <span>{index}</span>
        {kicker}
      </p>
      <Reveal as="h2" className="sec-title">
        {title}
      </Reveal>
      {lede ? (
        <Reveal as="p" className="sec-lede" delay={80}>
          {lede}
        </Reveal>
      ) : null}
    </header>
  )
}

function Ticker() {
  const items = [
    'Bergen, Norway · 60.39°N',
    '1962 Probat · 12kg batches',
    'Roast to shipment in under 24h',
    '11 partner farms · every contract published',
    '2.4× the commodity price',
  ]
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {[0, 1].map((copy) => (
          <span className="ticker-run" key={copy}>
            {items.map((t) => (
              <span className="ticker-item" key={t}>
                {t}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}

function BeanCard({ bean, index, onAdd }) {
  return (
    <Reveal as="article" className="bean-card" delay={(index % 3) * 90} data-bean={bean.id} data-roast={bean.roast}>
      <div className="bean-photo" aria-hidden="true">
        <span className="bean-photo-no">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="bean-body">
        <div className="bean-rule">
          <span>{bean.origin}</span>
          <span>{bean.alt}</span>
        </div>
        <h3>{bean.name}</h3>
        <p className="bean-notes">{bean.notes}</p>
        <p className="bean-meta">
          <span className="roast-meter" aria-hidden="true">
            {[1, 2, 3].map((i) => (
              <i key={i} className={i <= ROAST_LEVEL[bean.roast] ? 'on' : ''} />
            ))}
          </span>
          {bean.roast} roast · 250g
        </p>
        <div className="bean-buy">
          <span className="bean-price">${bean.price}</span>
          <button type="button" onClick={() => onAdd(bean)}>
            Add to cart
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h12M9 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
          </button>
        </div>
      </div>
    </Reveal>
  )
}

export default function App() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [cart, setCart] = useState([])
  const [toast, setToast] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const toastTimer = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const addToCart = useCallback((bean) => {
    setCart((c) => [...c, bean.id])
    setToast(`${bean.name} added to cart`)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }, [])

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

      <nav className={`nav ${scrolled ? 'is-stuck' : ''}`} id="site-nav">
        <div className="nav-inner">
          <a className="nav-logo" href="#hero">
            <span className="nav-mark" aria-hidden="true">
              <svg viewBox="0 0 32 32"><path d="M16 3c5 4 7 8 7 12s-3 8-7 14c-4-6-7-10-7-14s2-8 7-12z" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M16 6c0 8-2 12-2 20" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
            </span>
            <span className="nav-name">
              Northwind <em>Coffee Roasters</em>
            </span>
          </a>
          <div className="nav-links">
            {NAV.map(([label, href]) => (
              <a href={href} key={href}>
                {label}
              </a>
            ))}
          </div>
          <span className={`nav-cart ${cart.length ? 'has-items' : ''}`} aria-live="polite">
            Cart <b>{cart.length}</b>
          </span>
        </div>
      </nav>

      <header className="hero" id="hero">
        <div className="hero-bg" aria-hidden="true">
          <span className="hero-glow" />
          <span className="hero-grain" />
        </div>
        <div className="hero-inner">
          <p className="hero-kicker">
            <span className="dot" aria-hidden="true" />
            Est. 2014 — Bergen, Norway
          </p>
          <h1>
            Small-batch coffee,
            <br />
            roasted the morning
            <br />
            <em>it ships.</em>
          </h1>
          <div className="hero-side">
            <p>
              We roast single-origin beans in 12kg batches on a 1962 Probat in Bergen, Norway, and ship
              them within hours. Freshness is not a slogan here; it is a timestamp on the bag.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#beans">
                Shop the beans
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h12M9 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
              </a>
              <a className="btn btn-secondary" href="#brew-guide">Learn to brew</a>
            </div>
          </div>
        </div>
        <Ticker />
      </header>

      <main>
        <section className="section section-story" id="story">
          <SectionHead index="01" kicker="Our story" title="Still small, on purpose." />
          <div className="story-grid">
            <Reveal as="p" className="story-lede">
              Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still
              small on purpose: two roasters, one machine, and direct relationships with eleven farms
              across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra. We pay on average 2.4× the
              commodity price and publish every contract.
            </Reveal>
            <Reveal className="story-plaque" delay={120}>
              <span className="plaque-label">The machine</span>
              <span className="plaque-value">Probat</span>
              <span className="plaque-year">1962</span>
              <span className="plaque-note">Drum roasted, one batch at a time</span>
            </Reveal>
          </div>
          <div className="stats">
            {STATS.map((s, i) => (
              <Reveal className="stat" key={s.label} delay={i * 80}>
                <strong>{s.display}</strong>
                <span className="stat-label">{s.label}</span>
                <span className="stat-note">{s.note}</span>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="section section-beans" id="beans">
          <SectionHead
            index="02"
            kicker="The offering"
            title="This month's beans"
            lede="Six lots on the bench right now. When a lot runs out it comes off the list — we would rather sell you nothing than sell you stale."
          />
          <div className="bean-grid">
            {BEANS.map((b, i) => (
              <BeanCard bean={b} index={i} key={b.id} onAdd={addToCart} />
            ))}
          </div>
        </section>

        <section className="section section-brew" id="brew-guide">
          <SectionHead index="03" kicker="Method" title="Brew guide: pour over in four steps" />
          <ol className="steps">
            {STEPS.map((s, i) => (
              <Reveal as="li" className="step" key={s.n} delay={i * 90}>
                <span className="step-number" aria-hidden="true">{s.n}</span>
                <div className="step-body">
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                  <span className="step-tag">{s.tag}</span>
                </div>
              </Reveal>
            ))}
          </ol>
        </section>

        <section className="section section-reviews" id="reviews">
          <SectionHead index="04" kicker="Word of mouth" title="What subscribers say" />
          <div className="reviews">
            {REVIEWS.map((r, i) => (
              <Reveal as="blockquote" className="review" key={r.name} delay={i * 110}>
                <span className="review-mark" aria-hidden="true">”</span>
                <p>{r.quote}</p>
                <footer>
                  <strong>{r.name}</strong>
                  <span>{r.role}</span>
                </footer>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="section section-subscribe" id="subscribe">
          <Reveal className="sub-card">
            <div className="sub-main">
              <p className="sec-index"><span>05</span>Subscription</p>
              <h2>The Northwind subscription</h2>
              <p className="sub-copy">
                Two 250g bags of our current favourites, every month, free shipping, pause any time.
              </p>
              <a className="btn btn-primary" href="#contact">
                Start a subscription
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h12M9 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
              </a>
            </div>
            <p className="sub-price">
              <span className="sub-amount">$29</span>
              <span className="sub-per">per month</span>
            </p>
          </Reveal>
        </section>

        <section className="section section-contact" id="contact">
          <div className="contact-grid">
            <div>
              <SectionHead index="06" kicker="Say hello" title="Get in touch" />
              <p className="contact-note">
                Questions about a lot, wholesale pricing, or the bloom time argument you are having with
                your father — all welcome. Two roasters read this inbox.
              </p>
              <dl className="contact-facts">
                <div><dt>Roastery</dt><dd>Bergen, Norway</dd></div>
                <div><dt>Reply time</dt><dd>Within one day</dd></div>
              </dl>
            </div>
            {sent ? (
              <p className="form-success" role="status">
                <span className="tick" aria-hidden="true">✓</span>
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
                <button type="submit" className="btn btn-primary">
                  Send message
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h12M9 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="footer" id="site-footer">
        <div className="footer-word" aria-hidden="true">Northwind</div>
        <div className="footer-row">
          <p>© 2026 Northwind Coffee Roasters — Bergen, Norway</p>
          <div className="footer-links">
            <a href="#hero">Top</a>
            <a href="/shipping">Shipping</a>
            <a href="/returns">Returns</a>
            <a href="/privacy">Privacy</a>
          </div>
        </div>
      </footer>

      <div className="toast-wrap" role="status" aria-live="polite">
        {toast ? <div className="toast">{toast}</div> : null}
      </div>
    </div>
  )
}
