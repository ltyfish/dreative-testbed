import { useEffect, useMemo, useRef, useState } from 'react'

const BEANS = [
  { id: 'ethiopia', name: 'Ethiopia Yirgacheffe', notes: 'Jasmine, lemon zest, honey', roast: 'Light', price: 18, origin: 'Gedeo Zone', altitude: '1,950 m', hue: 44 },
  { id: 'colombia', name: 'Colombia Huila', notes: 'Caramel, red apple, cocoa', roast: 'Medium', price: 16, origin: 'Pitalito', altitude: '1,720 m', hue: 22 },
  { id: 'sumatra', name: 'Sumatra Mandheling', notes: 'Dark chocolate, cedar, earth', roast: 'Dark', price: 17, origin: 'Lake Toba', altitude: '1,400 m', hue: 8 },
  { id: 'kenya', name: 'Kenya AA Nyeri', notes: 'Blackcurrant, tomato, brown sugar', roast: 'Light', price: 19, origin: 'Mount Kenya', altitude: '1,880 m', hue: 34 },
  { id: 'guatemala', name: 'Guatemala Antigua', notes: 'Milk chocolate, orange, almond', roast: 'Medium', price: 16, origin: 'Sacatepéquez', altitude: '1,600 m', hue: 18 },
  { id: 'decaf', name: 'Swiss Water Decaf Blend', notes: 'Toffee, hazelnut, smooth', roast: 'Medium', price: 15, origin: 'Four farms', altitude: '1,500 m', hue: 26 },
]

const ROAST_LEVEL = { Light: 1, Medium: 2, Dark: 3 }

const STEPS = [
  { n: 1, title: 'Weigh', body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.', meta: '18g / 300ml' },
  { n: 2, title: 'Grind', body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.', meta: 'medium-fine' },
  { n: 3, title: 'Bloom', body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.', meta: '30 seconds' },
  { n: 4, title: 'Pour', body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.', meta: '2:30' },
]

const REVIEWS = [
  { quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.', name: 'Maya T.', role: 'Subscriber since 2022' },
  { quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.', name: 'Daniel R.', role: 'Home barista' },
  { quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.', name: 'Priya S.', role: 'Gift subscriber' },
]

const STATS = [
  { value: '11', label: 'partner farms', sub: 'Ethiopia · Colombia · Kenya · Guatemala · Sumatra' },
  { value: '2.4×', label: 'commodity price paid', sub: 'every contract published in full' },
  { value: '12kg', label: 'max batch size', sub: 'one 1962 Probat, two roasters' },
  { value: '<24h', label: 'roast to shipment', sub: 'the bag carries its own timestamp' },
]

const LOG = [
  ['06:04', 'Kenya AA Nyeri', 'first crack'],
  ['06:21', 'Kenya AA Nyeri', 'drop · 11.8kg'],
  ['07:02', 'Colombia Huila', 'charge · 12.0kg'],
  ['07:36', 'Colombia Huila', 'drop · 11.6kg'],
  ['08:10', 'Ethiopia Yirgacheffe', 'charge · 12.0kg'],
  ['09:15', 'all lots', 'sealed · courier collected'],
]

/* Reveal-on-scroll, opt-out honoured for reduced motion. */
function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'))
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (still || !('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.setAttribute('data-shown', ''))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.setAttribute('data-shown', '')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15 },
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])
}

function BeanSection({ bean }) {
  return (
    <span className="bean-section" style={{ '--hue': bean.hue }} aria-hidden="true">
      <span className={`bean-body roast-${bean.roast.toLowerCase()}`}>
        <span className="bean-crease" />
      </span>
    </span>
  )
}

function RoastMeter({ roast }) {
  const level = ROAST_LEVEL[roast]
  return (
    <span className="roast-meter" title={`${roast} roast`}>
      <span className="roast-word">{roast}</span>
      <span className="roast-pips" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span key={i} className={i <= level ? 'pip on' : 'pip'} />
        ))}
      </span>
    </span>
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

  const count = cart.length
  const total = useMemo(() => cart.reduce((s, b) => s + b.price, 0), [cart])

  function addToCart(bean) {
    setCart((c) => [...c, bean])
    setToast(bean.name)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
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
      <div className="grain" aria-hidden="true" />

      <nav className="nav" id="site-nav">
        <a className="nav-logo" href="#hero">
          <span className="mark" aria-hidden="true" />
          <span className="wordmark">
            Northwind<span className="wordmark-sub">Coffee Roasters · Bergen</span>
          </span>
        </a>
        <div className="nav-links">
          <a href="#beans">Beans</a>
          <a href="#brew-guide">Brew Guide</a>
          <a href="#reviews">Reviews</a>
          <a href="#subscribe">Subscribe</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="nav-cart" aria-live="polite">
          <span className="cart-count">{count}</span>
          <span className="cart-total">{count ? `$${total}` : 'empty'}</span>
        </div>
      </nav>

      <header className="hero" id="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-inner">
          <p className="eyeblurb">
            <span className="dot" aria-hidden="true" />
            Roasting today · 60°22′N 5°19′E
          </p>
          <h1>
            Small-batch coffee,
            <br />
            roasted the morning
            <br />
            <em>it ships.</em>
          </h1>
          <p className="hero-lede">
            We roast single-origin beans in 12kg batches on a 1962 Probat in Bergen, Norway, and
            ship them within hours. Freshness is not a slogan here; it is a timestamp on the bag.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#beans">
              Shop the beans
            </a>
            <a className="btn btn-ghost" href="#brew-guide">
              Learn to brew
            </a>
          </div>
        </div>

        <aside className="roastlog" aria-label="Today's roast log">
          <div className="roastlog-head">
            <span>Roast log</span>
            <span>Today</span>
          </div>
          <ul>
            {LOG.map(([time, lot, event]) => (
              <li key={time}>
                <span className="log-time">{time}</span>
                <span className="log-lot">{lot}</span>
                <span className="log-event">{event}</span>
              </li>
            ))}
          </ul>
          <div className="roastlog-foot">Drum temp held 196–204°C throughout</div>
        </aside>
      </header>

      <section className="section story" id="story" data-reveal>
        <div className="section-head">
          <span className="kicker">01 — Our story</span>
          <h2>
            Ten years small,
            <br />
            on purpose.
          </h2>
        </div>
        <div className="story-body">
          <p className="lede">
            Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still
            small on purpose: two roasters, one machine, and direct relationships with eleven farms
            across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra.
          </p>
          <p>
            We pay on average 2.4× the commodity price and publish every contract. That is the whole
            model — fewer bags, better paid, out the door before the aromatics go.
          </p>
        </div>
        <dl className="stats">
          {STATS.map((s) => (
            <div className="stat" key={s.label}>
              <dt>{s.label}</dt>
              <dd>
                <strong>{s.value}</strong>
                <span>{s.sub}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="section beans" id="beans" data-reveal>
        <div className="section-head">
          <span className="kicker">02 — The offering</span>
          <h2>This month&rsquo;s beans</h2>
          <p className="section-note">Six lots, 250g each, ground to order or whole.</p>
        </div>
        <div className="bean-grid">
          {BEANS.map((b) => (
            <article className="bean-card" key={b.id} data-bean={b.id} style={{ '--hue': b.hue }}>
              <div className="bean-photo">
                <BeanSection bean={b} />
                <span className="bean-origin">{b.origin}</span>
              </div>
              <div className="bean-text">
                <h3>{b.name}</h3>
                <p className="bean-notes">{b.notes}</p>
                <p className="bean-meta">
                  <RoastMeter roast={b.roast} />
                  <span className="bean-spec">
                    250g · {b.altitude}
                  </span>
                </p>
              </div>
              <div className="bean-buy">
                <span className="bean-price">${b.price}</span>
                <button type="button" onClick={() => addToCart(b)}>
                  <span>Add to cart</span>
                  <span className="plus" aria-hidden="true">
                    +
                  </span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section brew" id="brew-guide" data-reveal>
        <div className="section-head">
          <span className="kicker">03 — Method</span>
          <h2>
            Pour over,
            <br />
            in four steps.
          </h2>
        </div>
        <ol className="steps">
          {STEPS.map((s) => (
            <li className="step" key={s.n}>
              <span className="step-number">{String(s.n).padStart(2, '0')}</span>
              <div className="step-text">
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
              <span className="step-meta">{s.meta}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="section reviews" id="reviews" data-reveal>
        <div className="section-head">
          <span className="kicker">04 — Subscribers</span>
          <h2>What people write back</h2>
        </div>
        <div className="review-grid">
          {REVIEWS.map((r, i) => (
            <blockquote className="review" key={r.name} style={{ '--i': i }}>
              <span className="quote-mark" aria-hidden="true">
                &ldquo;
              </span>
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
        <div className="subscribe-panel">
          <span className="kicker">05 — Standing order</span>
          <h2>The Northwind subscription</h2>
          <p>
            Two 250g bags of our current favourites, every month, free shipping, pause any time.
          </p>
          <p className="price-line">
            <strong>$29</strong>
            <span>per month</span>
          </p>
          <a className="btn btn-primary" href="#contact">
            Start a subscription
          </a>
        </div>
      </section>

      <section className="section contact" id="contact" data-reveal>
        <div className="section-head">
          <span className="kicker">06 — Say hello</span>
          <h2>Get in touch</h2>
          <p className="section-note">
            Questions, wholesale, or just coffee talk. Two of us read the inbox, between roasts.
          </p>
        </div>
        <div className="contact-body">
          {sent ? (
            <p className="form-success" role="status">
              <span className="check" aria-hidden="true" />
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
                  rows={5}
                  placeholder="Questions, wholesale, or just coffee talk"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Send message
              </button>
            </form>
          )}
          <address className="contact-details">
            <p>
              <span>Roastery</span>
              Skuteviksboder 7<br />
              5035 Bergen, Norway
            </p>
            <p>
              <span>Open</span>
              Tue–Sat, 08:00–16:00
              <br />
              Roasting Mon &amp; Thu
            </p>
          </address>
        </div>
      </section>

      <footer className="footer" id="site-footer">
        <div className="footer-brand">Northwind</div>
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

      <div className={toast ? 'toast show' : 'toast'} role="status" aria-live="polite">
        {toast ? (
          <>
            <span className="toast-mark" aria-hidden="true" />
            <span>
              <strong>{toast}</strong> added to cart
            </span>
          </>
        ) : null}
      </div>
    </div>
  )
}
