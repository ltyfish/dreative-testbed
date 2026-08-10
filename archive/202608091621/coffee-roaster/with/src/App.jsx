import { useState } from 'react'
import { FOOTER_LINKS, LEDGER, NAV_LINKS, REVIEWS, STEPS } from './data.js'
import { formatClock } from './roast.js'
import { RoastProvider, useRoast } from './useRoast.jsx'
import RoastRail from './RoastRail.jsx'
import BeanShelf from './BeanShelf.jsx'

function Nav() {
  const { activeSection, cart } = useRoast()
  return (
    <nav className="nav" id="site-nav">
      <a className="nav-logo" href="#hero">
        Northwind
        <span>Coffee Roasters · Bergen</span>
      </a>
      <div className="nav-links">
        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href} data-active={activeSection === l.href.slice(1) ? 'true' : 'false'}>
            {l.label}
          </a>
        ))}
      </div>
      <p className="nav-cart" role="status" aria-live="polite">
        <span>Bags</span>
        <b>{cart.length}</b>
      </p>
    </nav>
  )
}

function Hero() {
  const { reading } = useRoast()
  return (
    <header className="hero" id="hero">
      <p className="hero-eyebrow">Batch 04 · Bergen, 60°N · drum charged</p>
      <h1>
        Small-batch coffee,
        <br />
        <em>roasted the morning it ships.</em>
      </h1>
      <div className="hero-foot">
        <p className="hero-copy">
          We roast single-origin beans in 12kg batches on a 1962 Probat in Bergen, Norway,
          and ship them within hours. Freshness is not a slogan here; it is a timestamp on the bag.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="#beans">Shop the beans</a>
          <a className="btn btn-secondary" href="#brew-guide">Learn to brew</a>
        </div>
      </div>
      <p className="hero-readout" aria-hidden="true">
        <span>{formatClock(reading.clock)}</span>
        <b>{Math.round(reading.temp)}°C</b>
        <span>{reading.phase}</span>
      </p>
      <p className="hero-hint" aria-hidden="true">Scroll — the batch runs as you read</p>
    </header>
  )
}

function Story() {
  return (
    <section className="section story" id="story">
      <div className="section-head">
        <p className="eyebrow">Drying · 128°C</p>
        <h2>
          Ten years small on purpose, <em>and every contract published.</em>
        </h2>
        <p className="section-lede">
          Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still
          small on purpose: two roasters, one machine, and direct relationships with eleven farms
          across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra. We pay on average 2.4× the
          commodity price and publish every contract.
        </p>
      </div>

      <dl className="ledger">
        {LEDGER.map((row) => (
          <div className="ledger-row" key={row.label}>
            <dt>{row.label}</dt>
            <dd className="ledger-note">{row.note}</dd>
            <dd className="ledger-value">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function BrewGuide() {
  const prep = STEPS.filter((s) => s.zone === 'prep')
  const brew = STEPS.filter((s) => s.zone === 'brew')
  const total = 180

  return (
    <section className="section brew" id="brew-guide">
      <div className="section-head">
        <p className="eyebrow">The second heat · 95°C</p>
        <h2>
          Brew guide: pour over <em>in four steps.</em>
        </h2>
        <p className="section-lede">
          The bean&rsquo;s temperature falls to room temperature in the bag and rises one last time in
          your kitchen. Two steps happen before the timer starts; two are the timer.
        </p>
      </div>

      <div className="brew-track">
        <div className="brew-zone brew-zone-prep">
          <p className="brew-zone-label">Before the timer</p>
          <ol className="brew-steps">
            {prep.map((s) => (
              <li className="brew-step" key={s.n}>
                <span className="brew-step-n">{s.n}</span>
                <h3>{s.title}</h3>
                <p className="brew-readout">{s.readout}</p>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="brew-zone brew-zone-brew">
          <p className="brew-zone-label">
            The timer <span>0:00 → 3:00, widths are real durations</span>
          </p>
          <ol className="brew-steps brew-steps-timed">
            {brew.map((s) => (
              <li
                className="brew-step"
                key={s.n}
                style={{ flexGrow: (s.span[1] - s.span[0]) / total }}
              >
                <span className="brew-step-n">{s.n}</span>
                <span className="brew-span" aria-hidden="true">
                  {formatClock(s.span[0])} — {formatClock(s.span[1])}
                </span>
                <h3>{s.title}</h3>
                <p className="brew-readout">{s.readout}</p>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function Reviews() {
  return (
    <section className="section reviews" id="reviews">
      <div className="section-head">
        <p className="eyebrow">In the cup · 71°C</p>
        <h2>
          What subscribers say <em>once it has cooled enough to taste.</em>
        </h2>
      </div>
      <div className="review-stack">
        {REVIEWS.map((r, i) => (
          <blockquote className="review" key={r.name} data-index={i}>
            <p>&ldquo;{r.quote}&rdquo;</p>
            <footer>
              <strong>{r.name}</strong> — {r.role}
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  )
}

function Subscribe() {
  return (
    <section className="section subscribe" id="subscribe">
      <div className="subscribe-panel">
        <p className="eyebrow">Charge the next batch</p>
        <h2>The Northwind subscription</h2>
        <p>
          Two 250g bags of our current favourites, every month, free shipping, pause any time.
          $29/month.
        </p>
        <a className="btn btn-primary" href="#contact">Start a subscription</a>
      </div>
    </section>
  )
}

function Contact() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    setSent(true)
    setEmail('')
    setMessage('')
  }

  return (
    <section className="section contact" id="contact">
      <div className="section-head">
        <p className="eyebrow">Ambient · Bergen</p>
        <h2>Get in touch</h2>
      </div>
      <div className="contact-grid">
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
        <aside className="contact-aside">
          <p className="contact-aside-line"><b>&lt;24h</b> roast to shipment</p>
          <p className="contact-aside-line"><b>11</b> partner farms, every contract published</p>
          <p className="contact-aside-line"><b>12kg</b> maximum batch, one 1962 Probat</p>
        </aside>
      </div>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer className="footer" id="site-footer">
      <p>© 2026 Northwind Coffee Roasters — Bergen, Norway</p>
      <div className="footer-links">
        {FOOTER_LINKS.map((l) => (
          <a key={l.href} href={l.href}>{l.label}</a>
        ))}
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <RoastProvider>
      <div className="page">
        <RoastRail />
        <div className="page-body">
          <Nav />
          <Hero />
          <Story />
          <BeanShelf />
          <BrewGuide />
          <Reviews />
          <Subscribe />
          <Contact />
          <SiteFooter />
        </div>
      </div>
    </RoastProvider>
  )
}
