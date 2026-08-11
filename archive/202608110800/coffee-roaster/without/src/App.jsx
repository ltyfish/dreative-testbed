import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const BEANS = [
  {
    id: 'ethiopia',
    name: 'Ethiopia Yirgacheffe',
    notes: 'Jasmine, lemon zest, honey',
    roast: 'Light',
    price: 18,
    origin: 'Ethiopia',
    lot: 'NW-01',
  },
  {
    id: 'kenya',
    name: 'Kenya AA Nyeri',
    notes: 'Blackcurrant, tomato, brown sugar',
    roast: 'Light',
    price: 19,
    origin: 'Kenya',
    lot: 'NW-02',
  },
  {
    id: 'colombia',
    name: 'Colombia Huila',
    notes: 'Caramel, red apple, cocoa',
    roast: 'Medium',
    price: 16,
    origin: 'Colombia',
    lot: 'NW-03',
  },
  {
    id: 'guatemala',
    name: 'Guatemala Antigua',
    notes: 'Milk chocolate, orange, almond',
    roast: 'Medium',
    price: 16,
    origin: 'Guatemala',
    lot: 'NW-04',
  },
  {
    id: 'decaf',
    name: 'Swiss Water Decaf Blend',
    notes: 'Toffee, hazelnut, smooth',
    roast: 'Medium',
    price: 15,
    origin: 'Blend',
    lot: 'NW-05',
  },
  {
    id: 'sumatra',
    name: 'Sumatra Mandheling',
    notes: 'Dark chocolate, cedar, earth',
    roast: 'Dark',
    price: 17,
    origin: 'Sumatra',
    lot: 'NW-06',
  },
]

const ROAST_POSITION = { Light: 0.2, Medium: 0.55, Dark: 0.88 }

/* Roast curves — the profile shape shortens and steepens as the roast goes darker. */
const ROAST_CURVE = {
  Light: 'M0 74 C 34 70, 58 54, 78 34 S 116 10, 148 8',
  Medium: 'M0 76 C 30 72, 52 58, 70 38 S 104 12, 148 6',
  Dark: 'M0 78 C 26 74, 44 62, 60 42 S 92 10, 148 4',
}

const STEPS = [
  {
    n: 1,
    title: 'Weigh',
    body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.',
    mark: '18g',
    clock: '0:00',
  },
  {
    n: 2,
    title: 'Grind',
    body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.',
    mark: 'Medium-fine',
    clock: '0:00',
  },
  {
    n: 3,
    title: 'Bloom',
    body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.',
    mark: '36g · 95°C',
    clock: '0:30',
  },
  {
    n: 4,
    title: 'Pour',
    body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.',
    mark: '300ml total',
    clock: '3:00',
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

const NAV = [
  { href: '#beans', label: 'Beans' },
  { href: '#brew-guide', label: 'Brew Guide' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#subscribe', label: 'Subscribe' },
  { href: '#contact', label: 'Contact' },
]

const LEDGER = [
  { value: '11', label: 'partner farms', note: 'every contract published' },
  { value: '2.4×', label: 'commodity price paid', note: 'average across all lots' },
  { value: '12kg', label: 'max batch size', note: 'one 1962 Probat' },
  { value: '<24h', label: 'roast to shipment', note: 'timestamped on the bag' },
]

/* Time elapsed since this morning's 07:00 roast — the freshness claim, made literal. */
function useRoastClock() {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  return useMemo(() => {
    const roastedAt = new Date(now)
    roastedAt.setHours(7, 0, 0, 0)
    if (roastedAt.getTime() > now) roastedAt.setDate(roastedAt.getDate() - 1)
    const elapsed = Math.floor((now - roastedAt.getTime()) / 1000)
    const pad = (v) => String(v).padStart(2, '0')
    return {
      text: `${pad(Math.floor(elapsed / 3600))}:${pad(Math.floor(elapsed / 60) % 60)}:${pad(elapsed % 60)}`,
      progress: Math.min(elapsed / (24 * 3600), 1),
    }
  }, [now])
}

/* Reveals a section once it crosses into view; degrades to always-visible. */
function useReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll('[data-reveal]')
    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.setAttribute('data-revealed', 'true'))
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
    targets.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

function useActiveSection() {
  const [active, setActive] = useState('')

  useEffect(() => {
    const ids = NAV.map((n) => n.href.slice(1))
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (!sections.length || !('IntersectionObserver' in window)) return
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
  }, [])

  return active
}

function RoastRing({ className }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.45" />
      <path
        d="M16 3.4a12.6 12.6 0 0 1 0 25.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M16 9.5c3.2 2.4 3.2 10.6 0 13" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function Header({ cartCount, active }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className="nav" id="site-nav" data-scrolled={scrolled} data-open={open}>
      <div className="nav-inner">
        <a className="nav-logo" href="#hero" onClick={() => setOpen(false)}>
          <RoastRing className="nav-mark" />
          <span className="nav-logo-text">
            Northwind <em>Coffee Roasters</em>
          </span>
        </a>

        <button
          className="nav-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="nav-links"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        </button>

        <div className="nav-links" id="nav-links">
          {NAV.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={active === link.href.slice(1) ? 'true' : undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <span className="nav-cart" aria-live="polite">
            Cart<span className="nav-cart-count">{cartCount}</span>
          </span>
        </div>
      </div>
    </nav>
  )
}

function Hero({ clock }) {
  return (
    <header className="hero" id="hero">
      <div className="hero-field" aria-hidden="true">
        <span className="hero-glow" />
        <span className="hero-steam hero-steam-a" />
        <span className="hero-steam hero-steam-b" />
        <span className="hero-steam hero-steam-c" />
      </div>

      <div className="hero-inner">
        <p className="eyebrow hero-eyebrow">
          <span className="eyebrow-dot" />
          Bergen, Norway · 60°23′N
        </p>

        <h1 className="hero-title">
          <span className="hero-line">Small-batch coffee,</span>
          <span className="hero-line hero-line-accent">
            roasted the <em>morning</em>
          </span>
          <span className="hero-line">it ships.</span>
        </h1>

        <div className="hero-body">
          <p>
            We roast single-origin beans in 12kg batches on a 1962 Probat in Bergen, Norway, and ship
            them within hours. Freshness is not a slogan here; it is a timestamp on the bag.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#beans">
              Shop the beans
              <span className="btn-arrow" aria-hidden="true">
                →
              </span>
            </a>
            <a className="btn btn-ghost" href="#brew-guide">
              Learn to brew
            </a>
          </div>
        </div>

        <aside className="roast-ticket" aria-label="Today's roast log">
          <div className="ticket-head">
            <span className="ticket-title">Roast log</span>
            <span className="ticket-live">
              <span className="ticket-pulse" aria-hidden="true" />
              live
            </span>
          </div>
          <p className="ticket-clock">
            <time>{clock.text}</time>
          </p>
          <p className="ticket-caption">since the drum dropped this morning</p>
          <div className="ticket-bar" role="presentation">
            <span className="ticket-bar-fill" style={{ '--fill': clock.progress }} />
          </div>
          <dl className="ticket-meta">
            <div>
              <dt>Batch</dt>
              <dd>12kg</dd>
            </div>
            <div>
              <dt>Machine</dt>
              <dd>Probat ’62</dd>
            </div>
            <div>
              <dt>Ships in</dt>
              <dd>&lt;24h</dd>
            </div>
          </dl>
        </aside>
      </div>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <span className="marquee-group" key={copy}>
              {['Ethiopia', 'Colombia', 'Kenya', 'Guatemala', 'Sumatra', 'Bergen'].map((word) => (
                <span className="marquee-item" key={word}>
                  {word}
                  <RoastRing className="marquee-mark" />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </header>
  )
}

function Story() {
  return (
    <section className="section section-story" id="story" data-reveal>
      <div className="section-head">
        <p className="eyebrow">
          <span className="section-index">01</span> Our story
        </p>
        <h2 className="section-title">
          Still small <em>on purpose.</em>
        </h2>
      </div>

      <div className="story-grid">
        <p className="story-lede">
          Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still small
          on purpose: two roasters, one machine, and direct relationships with eleven farms across
          Ethiopia, Colombia, Kenya, Guatemala, and Sumatra. We pay on average 2.4× the commodity
          price and publish every contract.
        </p>

        <dl className="stats">
          {LEDGER.map((item, i) => (
            <div className="stat" key={item.label} style={{ '--i': i }}>
              <dt className="stat-value">{item.value}</dt>
              <dd>
                <span className="stat-label">{item.label}</span>
                <span className="stat-note">{item.note}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function BeanCard({ bean, onAdd, added }) {
  return (
    <article className="bean-card" data-bean={bean.id} data-roast={bean.roast.toLowerCase()}>
      <div className="bean-photo" aria-hidden="true">
        <span className="bean-swatch" />
        <span className="bean-bloom" />
        <svg className="bean-curve" viewBox="0 0 148 84" preserveAspectRatio="none" focusable="false">
          <path d={ROAST_CURVE[bean.roast]} fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        <span className="bean-lot">{bean.lot}</span>
        <span className="bean-tone">{bean.roast}</span>
      </div>

      <div className="bean-body">
        <p className="bean-origin">{bean.origin}</p>
        <h3>{bean.name}</h3>
        <p className="bean-notes">{bean.notes}</p>

        <div className="bean-roast">
          <span className="bean-roast-label">{bean.roast} roast · 250g</span>
          <span className="bean-roast-track" aria-hidden="true">
            <span className="bean-roast-dot" style={{ '--pos': ROAST_POSITION[bean.roast] }} />
          </span>
        </div>

        <div className="bean-buy">
          <span className="bean-price">${bean.price}</span>
          <button type="button" className="add-btn" data-added={added} onClick={() => onAdd(bean)}>
            <span className="add-btn-label">{added ? 'Added' : 'Add to cart'}</span>
          </button>
        </div>
      </div>
    </article>
  )
}

function Beans({ onAdd, lastAdded }) {
  return (
    <section className="section section-beans" id="beans" data-reveal>
      <div className="section-head">
        <p className="eyebrow">
          <span className="section-index">02</span> This month&rsquo;s beans
        </p>
        <h2 className="section-title">
          Six lots, <em>light to dark.</em>
        </h2>
        <div className="roast-scale" aria-hidden="true">
          <span>Light</span>
          <span className="roast-scale-bar" />
          <span>Dark</span>
        </div>
      </div>

      <div className="bean-grid">
        {BEANS.map((bean) => (
          <BeanCard key={bean.id} bean={bean} onAdd={onAdd} added={lastAdded === bean.id} />
        ))}
      </div>
    </section>
  )
}

function BrewGuide() {
  const [active, setActive] = useState(1)

  return (
    <section className="section section-brew" id="brew-guide" data-reveal>
      <div className="section-head">
        <p className="eyebrow">
          <span className="section-index">03</span> Brew guide
        </p>
        <h2 className="section-title">
          Pour over in <em>four steps.</em>
        </h2>
      </div>

      <ol className="steps" style={{ '--active': active }}>
        <span className="steps-rail" aria-hidden="true" />
        {STEPS.map((step) => (
          <li
            className="step"
            key={step.n}
            data-active={active === step.n}
            onMouseEnter={() => setActive(step.n)}
            onFocus={() => setActive(step.n)}
          >
            <button className="step-button" type="button" onClick={() => setActive(step.n)}>
              <span className="step-number" aria-hidden="true">
                {String(step.n).padStart(2, '0')}
              </span>
              <span className="step-clock">{step.clock}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              <span className="step-mark">{step.mark}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Reviews() {
  return (
    <section className="section section-reviews" id="reviews" data-reveal>
      <div className="section-head">
        <p className="eyebrow">
          <span className="section-index">04</span> What subscribers say
        </p>
        <h2 className="section-title">
          Notes from <em>the other end</em> of the post.
        </h2>
      </div>

      <div className="reviews">
        {REVIEWS.map((review, i) => (
          <blockquote className="review" key={review.name} style={{ '--i': i }}>
            <span className="review-quote" aria-hidden="true">
              &ldquo;
            </span>
            <p>{review.quote}</p>
            <footer>
              <strong>{review.name}</strong>
              <span>{review.role}</span>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  )
}

function Subscribe() {
  return (
    <section className="section subscribe" id="subscribe" data-reveal>
      <div className="subscribe-panel">
        <div className="subscribe-grain" aria-hidden="true" />
        <p className="eyebrow eyebrow-light">
          <span className="section-index">05</span> The Northwind subscription
        </p>
        <h2 className="subscribe-title">
          Two bags. Every month. <em>Never older than a day.</em>
        </h2>
        <p className="subscribe-copy">
          Two 250g bags of our current favourites, every month, free shipping, pause any time. $29/month.
        </p>
        <a className="btn btn-ember" href="#contact">
          Start a subscription
          <span className="btn-arrow" aria-hidden="true">
            →
          </span>
        </a>
        <ul className="subscribe-facts">
          <li>Free shipping</li>
          <li>Pause any time</li>
          <li>Roast-to-ship under 24h</li>
        </ul>
      </div>
    </section>
  )
}

function Contact({ email, setEmail, message, setMessage, sent, onSubmit }) {
  return (
    <section className="section section-contact" id="contact" data-reveal>
      <div className="contact-grid">
        <div className="section-head">
          <p className="eyebrow">
            <span className="section-index">06</span> Get in touch
          </p>
          <h2 className="section-title">
            We read <em>everything.</em>
          </h2>
          <p className="contact-aside">
            Questions about a lot, wholesale for your café, or an argument about bloom times — the
            same two people who run the roaster answer the post.
          </p>
        </div>

        {sent ? (
          <p className="form-success" role="status">
            <span className="form-success-mark" aria-hidden="true">
              ✓
            </span>
            Thanks — we read everything and reply within a day.
          </p>
        ) : (
          <form className="contact-form" onSubmit={onSubmit}>
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
            <button type="submit" className="btn btn-primary btn-block">
              Send message
              <span className="btn-arrow" aria-hidden="true">
                →
              </span>
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer" id="site-footer">
      <div className="footer-mark">
        <RoastRing className="footer-ring" />
        <span>
          Northwind <em>Coffee Roasters</em>
        </span>
      </div>
      <p className="footer-legal">© 2026 Northwind Coffee Roasters — Bergen, Norway</p>
      <div className="footer-links">
        <a href="#hero">Top</a>
        <a href="/shipping">Shipping</a>
        <a href="/returns">Returns</a>
        <a href="/privacy">Privacy</a>
      </div>
    </footer>
  )
}

export default function App() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [cart, setCart] = useState([])
  const [lastAdded, setLastAdded] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const addedTimer = useRef(null)

  const clock = useRoastClock()
  const active = useActiveSection()
  useReveal()

  useEffect(
    () => () => {
      clearTimeout(toastTimer.current)
      clearTimeout(addedTimer.current)
    },
    [],
  )

  const handleAdd = useCallback((bean) => {
    setCart((prev) => [...prev, bean.id])
    setLastAdded(bean.id)
    setToast(`${bean.name} added to cart`)
    clearTimeout(toastTimer.current)
    clearTimeout(addedTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
    addedTimer.current = setTimeout(() => setLastAdded(null), 1400)
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
      <Header cartCount={cart.length} active={active} />
      <Hero clock={clock} />

      <main className="main">
        <Story />
        <Beans onAdd={handleAdd} lastAdded={lastAdded} />
        <BrewGuide />
        <Reviews />
        <Subscribe />
        <Contact
          email={email}
          setEmail={setEmail}
          message={message}
          setMessage={setMessage}
          sent={sent}
          onSubmit={handleSubmit}
        />
      </main>

      <Footer />

      <div className="toast-region" role="status" aria-live="polite">
        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  )
}
