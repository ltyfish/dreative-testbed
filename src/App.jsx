import { useState } from 'react'

const BEANS = [
  { id: 'ethiopia', name: 'Ethiopia Yirgacheffe', notes: 'Jasmine, lemon zest, honey', roast: 'Light', price: 18 },
  { id: 'colombia', name: 'Colombia Huila', notes: 'Caramel, red apple, cocoa', roast: 'Medium', price: 16 },
  { id: 'sumatra', name: 'Sumatra Mandheling', notes: 'Dark chocolate, cedar, earth', roast: 'Dark', price: 17 },
  { id: 'kenya', name: 'Kenya AA Nyeri', notes: 'Blackcurrant, tomato, brown sugar', roast: 'Light', price: 19 },
  { id: 'guatemala', name: 'Guatemala Antigua', notes: 'Milk chocolate, orange, almond', roast: 'Medium', price: 16 },
  { id: 'decaf', name: 'Swiss Water Decaf Blend', notes: 'Toffee, hazelnut, smooth', roast: 'Medium', price: 15 },
]

const STEPS = [
  { n: 1, title: 'Weigh', body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.' },
  { n: 2, title: 'Grind', body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.' },
  { n: 3, title: 'Bloom', body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.' },
  { n: 4, title: 'Pour', body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.' },
]

const REVIEWS = [
  { quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.', name: 'Maya T.', role: 'Subscriber since 2022' },
  { quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.', name: 'Daniel R.', role: 'Home barista' },
  { quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.', name: 'Priya S.', role: 'Gift subscriber' },
]

export default function App() {
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
    <div className="page">
      <nav className="nav" id="site-nav">
        <span className="nav-logo">Northwind Coffee Roasters</span>
        <div className="nav-links">
          <a href="#beans">Beans</a>
          <a href="#brew-guide">Brew Guide</a>
          <a href="#reviews">Reviews</a>
          <a href="#subscribe">Subscribe</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      <header className="hero" id="hero">
        <h1>Small-batch coffee, roasted the morning it ships.</h1>
        <p>
          We roast single-origin beans in 12kg batches on a 1962 Probat in Bergen, Norway,
          and ship them within hours. Freshness is not a slogan here; it is a timestamp on the bag.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="#beans">Shop the beans</a>
          <a className="btn btn-secondary" href="#brew-guide">Learn to brew</a>
        </div>
      </header>

      <section className="section" id="story">
        <h2>Our story</h2>
        <p>
          Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still
          small on purpose: two roasters, one machine, and direct relationships with eleven farms
          across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra. We pay on average 2.4× the
          commodity price and publish every contract.
        </p>
        <div className="stats">
          <div className="stat"><strong>11</strong><span>partner farms</span></div>
          <div className="stat"><strong>2.4×</strong><span>commodity price paid</span></div>
          <div className="stat"><strong>12kg</strong><span>max batch size</span></div>
          <div className="stat"><strong>&lt;24h</strong><span>roast to shipment</span></div>
        </div>
      </section>

      <section className="section" id="beans">
        <h2>This month's beans</h2>
        <div className="bean-grid">
          {BEANS.map((b) => (
            <article className="bean-card" key={b.id} data-bean={b.id}>
              <div className="bean-photo" aria-hidden="true" />
              <h3>{b.name}</h3>
              <p className="bean-notes">{b.notes}</p>
              <p className="bean-meta">{b.roast} roast · 250g</p>
              <div className="bean-buy">
                <span className="bean-price">${b.price}</span>
                <button type="button" onClick={() => alert(`${b.name} added to cart`)}>Add to cart</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="brew-guide">
        <h2>Brew guide: pour over in four steps</h2>
        <ol className="steps">
          {STEPS.map((s) => (
            <li className="step" key={s.n}>
              <span className="step-number">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section" id="reviews">
        <h2>What subscribers say</h2>
        <div className="reviews">
          {REVIEWS.map((r) => (
            <blockquote className="review" key={r.name}>
              <p>“{r.quote}”</p>
              <footer>
                <strong>{r.name}</strong> — {r.role}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="section subscribe" id="subscribe">
        <h2>The Northwind subscription</h2>
        <p>
          Two 250g bags of our current favourites, every month, free shipping, pause any time.
          $29/month.
        </p>
        <a className="btn btn-primary" href="#contact">Start a subscription</a>
      </section>

      <section className="section" id="contact">
        <h2>Get in touch</h2>
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
    </div>
  )
}
