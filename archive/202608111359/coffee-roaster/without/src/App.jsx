import { useEffect, useRef, useState } from 'react'

const BEANS = [
  { id: 'ethiopia', name: 'Ethiopia Yirgacheffe', notes: 'Jasmine, lemon zest, honey', roast: 'Light', price: 18, origin: 'Gedeo Zone', altitude: '1,950 m' },
  { id: 'colombia', name: 'Colombia Huila', notes: 'Caramel, red apple, cocoa', roast: 'Medium', price: 16, origin: 'Pitalito', altitude: '1,720 m' },
  { id: 'sumatra', name: 'Sumatra Mandheling', notes: 'Dark chocolate, cedar, earth', roast: 'Dark', price: 17, origin: 'Lake Toba', altitude: '1,400 m' },
  { id: 'kenya', name: 'Kenya AA Nyeri', notes: 'Blackcurrant, tomato, brown sugar', roast: 'Light', price: 19, origin: 'Nyeri County', altitude: '1,800 m' },
  { id: 'guatemala', name: 'Guatemala Antigua', notes: 'Milk chocolate, orange, almond', roast: 'Medium', price: 16, origin: 'Antigua Valley', altitude: '1,600 m' },
  { id: 'decaf', name: 'Swiss Water Decaf Blend', notes: 'Toffee, hazelnut, smooth', roast: 'Medium', price: 15, origin: 'Blend of four lots', altitude: '1,500 m' },
]

const ROAST_POSITION = { Light: 18, Medium: 52, Dark: 88 }

const STEPS = [
  { n: 1, title: 'Weigh', clock: '00:00', body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.' },
  { n: 2, title: 'Grind', clock: '00:20', body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.' },
  { n: 3, title: 'Bloom', clock: '00:45', body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.' },
  { n: 4, title: 'Pour', clock: '01:15', body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.' },
]

const REVIEWS = [
  { quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.', name: 'Maya T.', role: 'Subscriber since 2022' },
  { quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.', name: 'Daniel R.', role: 'Home barista' },
  { quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.', name: 'Priya S.', role: 'Gift subscriber' },
]

const STATS = [
  { figure: '11', label: 'partner farms', note: 'Ethiopia · Colombia · Kenya · Guatemala · Sumatra' },
  { figure: '2.4×', label: 'commodity price paid', note: 'Average across every contract, all published' },
  { figure: '12kg', label: 'max batch size', note: 'One 1962 Probat, two roasters, no shortcuts' },
  { figure: '<24h', label: 'roast to shipment', note: 'Stamped on the bottom of every bag' },
]

const LOG_LINES = [
  { time: '05:12', text: 'Drum to 196°C — Kenya AA Nyeri charged' },
  { time: '05:23', text: 'First crack, 9m40s — development 18%' },
  { time: '05:31', text: 'Drop 11.8kg — cooling tray' },
  { time: '06:02', text: 'Ethiopia Yirgacheffe charged, 12.0kg' },
  { time: '07:40', text: 'Bagged, stamped, sealed' },
  { time: '09:15', text: 'Courier collection — 63 orders out' },
]

/** Reveal-on-scroll: adds .is-in once an element enters the viewport. */
function useReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll('[data-reveal]')
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            io.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.1 },
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])
}

export default function App() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [cart, setCart] = useState([])
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  useReveal()

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  function addToCart(bean) {
    setCart((c) => [...c, bean.id])
    setToast(`${bean.name} — added to cart`)
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

      <nav className="nav" id="site-nav">
        <a className="nav-logo" href="#hero">
          <span className="nav-mark" aria-hidden="true" />
          <span className="nav-name">
            Northwind <em>Coffee Roasters</em>
          </span>
        </a>
        <div className="nav-links">
          <a href="#beans">Beans</a>
          <a href="#brew-guide">Brew Guide</a>
          <a href="#reviews">Reviews</a>
          <a href="#subscribe">Subscribe</a>
          <a href="#contact">Contact</a>
        </div>
        <span className="nav-cart" aria-live="polite">
          Cart <b>{cart.length}</b>
        </span>
      </nav>

      <header className="hero" id="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow">Bergen, Norway · est. 2014</p>
          <h1>
            Small-batch coffee,
            <br />
            roasted <em>the morning</em>
            <br />
            it ships.
          </h1>
          <p className="lede">
            We roast single-origin beans in 12kg batches on a 1962 Probat in Bergen, Norway, and
            ship them within hours. Freshness is not a slogan here; it is a timestamp on the bag.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#beans">Shop the beans</a>
            <a className="btn btn-ghost" href="#brew-guide">Learn to brew</a>
          </div>
        </div>

        <aside className="roastlog" aria-label="Today's roast log">
          <div className="roastlog-head">
            <span className="dot" aria-hidden="true" />
            Roast log · today
          </div>
          <ol className="roastlog-lines">
            {LOG_LINES.map((l) => (
              <li key={l.time}>
                <time>{l.time}</time>
                <span>{l.text}</span>
              </li>
            ))}
          </ol>
          <p className="roastlog-foot">Batch 1148 · drop temp 208°C</p>
        </aside>
      </header>

      <section className="section story" id="story" data-reveal>
        <div className="section-head">
          <span className="section-index">01</span>
          <h2>Still small, on purpose</h2>
        </div>
        <p className="story-copy">
          Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still
          small on purpose: two roasters, one machine, and direct relationships with eleven farms
          across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra. We pay on average 2.4× the
          commodity price and publish every contract.
        </p>
        <div className="stats">
          {STATS.map((s) => (
            <div className="stat" key={s.label}>
              <strong>{s.figure}</strong>
              <span className="stat-label">{s.label}</span>
              <span className="stat-note">{s.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section beans" id="beans" data-reveal>
        <div className="section-head">
          <span className="section-index">02</span>
          <h2>This month&rsquo;s beans</h2>
          <p className="section-note">Six lots on the shelf. 250g bags, ground to order.</p>
        </div>

        <div className="bean-list">
          <div className="bean-legend" aria-hidden="true">
            <span>Lot</span>
            <span>Origin</span>
            <span>Roast</span>
            <span>Price</span>
          </div>
          {BEANS.map((b, i) => (
            <article className="bean-card" key={b.id} data-bean={b.id}>
              <span className="bean-index">{String(i + 1).padStart(2, '0')}</span>

              <div className="bean-main">
                <h3>{b.name}</h3>
                <p className="bean-notes">{b.notes}</p>
              </div>

              <div className="bean-origin">
                <span className="bean-photo" aria-hidden="true" />
                <span>
                  {b.origin}
                  <em>{b.altitude}</em>
                </span>
              </div>

              <div className="bean-roast">
                <p className="bean-meta">{b.roast} roast · 250g</p>
                <span className="roast-meter" aria-hidden="true">
                  <i style={{ left: `${ROAST_POSITION[b.roast]}%` }} />
                </span>
              </div>

              <div className="bean-buy">
                <span className="bean-price">${b.price}</span>
                <button type="button" onClick={() => addToCart(b)}>
                  Add to cart
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section brew" id="brew-guide" data-reveal>
        <div className="section-head">
          <span className="section-index">03</span>
          <h2>Brew guide: pour over in four steps</h2>
          <p className="section-note">Three minutes, start to cup.</p>
        </div>
        <ol className="steps">
          {STEPS.map((s) => (
            <li className="step" key={s.n}>
              <span className="step-number">{s.n}</span>
              <time className="step-clock">{s.clock}</time>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section reviews-section" id="reviews" data-reveal>
        <div className="section-head">
          <span className="section-index">04</span>
          <h2>What subscribers say</h2>
        </div>
        <div className="reviews">
          {REVIEWS.map((r) => (
            <blockquote className="review" key={r.name}>
              <p>&ldquo;{r.quote}&rdquo;</p>
              <footer>
                <strong>{r.name}</strong> — {r.role}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="section subscribe" id="subscribe" data-reveal>
        <div className="subscribe-inner">
          <span className="section-index">05</span>
          <h2>The Northwind subscription</h2>
          <p>
            Two 250g bags of our current favourites, every month, free shipping, pause any time.
            <b> $29/month.</b>
          </p>
          <a className="btn btn-primary" href="#contact">Start a subscription</a>
        </div>
      </section>

      <section className="section contact" id="contact" data-reveal>
        <div className="section-head">
          <span className="section-index">06</span>
          <h2>Get in touch</h2>
          <p className="section-note">
            Wholesale, subscriptions, or an argument about grind size — one inbox, two people.
          </p>
        </div>

        {sent ? (
          <p className="form-success" role="status">
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
            <button type="submit" className="btn btn-primary">Send message</button>
          </form>
        )}
      </section>

      <footer className="footer" id="site-footer">
        <p>© 2026 Northwind Coffee Roasters — Bergen, Norway</p>
        <div className="footer-links">
          <a href="#hero">Top</a>
          <a href="/shipping">Shipping</a>
          <a href="/returns">Returns</a>
          <a href="/privacy">Privacy</a>
        </div>
      </footer>

      <div className="toast-wrap" role="status" aria-live="polite">
        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  )
}
