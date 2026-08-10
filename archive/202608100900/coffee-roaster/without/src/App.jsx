import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const BEANS = [
  {
    id: 'ethiopia',
    name: 'Ethiopia Yirgacheffe',
    notes: 'Jasmine, lemon zest, honey',
    roast: 'Light',
    price: 18,
    origin: 'Gedeb, Ethiopia',
    altitude: '2,050 m',
    hue: 44,
  },
  {
    id: 'colombia',
    name: 'Colombia Huila',
    notes: 'Caramel, red apple, cocoa',
    roast: 'Medium',
    price: 16,
    origin: 'Pitalito, Colombia',
    altitude: '1,750 m',
    hue: 22,
  },
  {
    id: 'sumatra',
    name: 'Sumatra Mandheling',
    notes: 'Dark chocolate, cedar, earth',
    roast: 'Dark',
    price: 17,
    origin: 'Lintong, Sumatra',
    altitude: '1,400 m',
    hue: 12,
  },
  {
    id: 'kenya',
    name: 'Kenya AA Nyeri',
    notes: 'Blackcurrant, tomato, brown sugar',
    roast: 'Light',
    price: 19,
    origin: 'Nyeri, Kenya',
    altitude: '1,900 m',
    hue: 6,
  },
  {
    id: 'guatemala',
    name: 'Guatemala Antigua',
    notes: 'Milk chocolate, orange, almond',
    roast: 'Medium',
    price: 16,
    origin: 'Antigua, Guatemala',
    altitude: '1,600 m',
    hue: 30,
  },
  {
    id: 'decaf',
    name: 'Swiss Water Decaf Blend',
    notes: 'Toffee, hazelnut, smooth',
    roast: 'Medium',
    price: 15,
    origin: 'Blend of three lots',
    altitude: '1,500 m',
    hue: 36,
  },
]

const ROAST_LEVEL = { Light: 1, Medium: 2, Dark: 3 }

const STEPS = [
  {
    n: 1,
    title: 'Weigh',
    body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.',
    clock: '00:00',
  },
  {
    n: 2,
    title: 'Grind',
    body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.',
    clock: '00:20',
  },
  {
    n: 3,
    title: 'Bloom',
    body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.',
    clock: '00:30',
  },
  {
    n: 4,
    title: 'Pour',
    body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.',
    clock: '03:00',
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

const LEDGER = [
  { value: '11', unit: '', label: 'Partner farms', note: 'Ethiopia · Colombia · Kenya · Guatemala · Sumatra' },
  { value: '2.4', unit: '×', label: 'Commodity price paid', note: 'Average across all contracts, published in full' },
  { value: '12', unit: 'kg', label: 'Maximum batch size', note: 'One 1962 Probat, two roasters, no shortcuts' },
  { value: '24', unit: 'h', label: 'Roast to shipment', note: 'Every bag leaves in under a day', prefix: '<' },
]

const NAV = [
  ['Beans', '#beans'],
  ['Brew Guide', '#brew-guide'],
  ['Reviews', '#reviews'],
  ['Subscribe', '#subscribe'],
  ['Contact', '#contact'],
]

/* Reveals a section once it crosses into view; degrades to "always visible". */
function useReveal() {
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      node.dataset.revealed = 'true'
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.dataset.revealed = 'true'
            io.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  return ref
}

function Reveal({ as: Tag = 'div', children, ...rest }) {
  const ref = useReveal()
  return (
    <Tag ref={ref} data-reveal="" {...rest}>
      {children}
    </Tag>
  )
}

function RoastMeter({ roast }) {
  const level = ROAST_LEVEL[roast]
  return (
    <span className="roast-meter" title={`${roast} roast`}>
      <span className="roast-meter__label">{roast}</span>
      <span className="roast-meter__track" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span key={i} className="roast-meter__pip" data-on={i <= level ? 'true' : 'false'} />
        ))}
      </span>
    </span>
  )
}

function BeanCard({ bean, index, onAdd }) {
  const [justAdded, setJustAdded] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  function add() {
    onAdd(bean)
    setJustAdded(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setJustAdded(false), 1800)
  }

  return (
    <article
      className="bean"
      data-bean={bean.id}
      style={{ '--bean-hue': bean.hue, '--bean-index': index }}
    >
      <div className="bean__photo" aria-hidden="true">
        <span className="bean__disc" />
        <span className="bean__index">{String(index + 1).padStart(2, '0')}</span>
      </div>

      <div className="bean__body">
        <h3 className="bean__name">{bean.name}</h3>
        <p className="bean__notes">{bean.notes}</p>

        <dl className="bean__spec">
          <div>
            <dt>Origin</dt>
            <dd>{bean.origin}</dd>
          </div>
          <div>
            <dt>Altitude</dt>
            <dd>{bean.altitude}</dd>
          </div>
          <div>
            <dt>Bag</dt>
            <dd>250 g</dd>
          </div>
        </dl>

        <div className="bean__foot">
          <RoastMeter roast={bean.roast} />
          <span className="bean__price">${bean.price}</span>
        </div>

        <button type="button" className="bean__buy" onClick={add} data-added={justAdded ? 'true' : 'false'}>
          <span className="bean__buy-face">Add to cart</span>
          <span className="bean__buy-face bean__buy-face--alt" aria-hidden="true">
            Added ✓
          </span>
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
  const [scrolled, setScrolled] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const addToCart = useCallback((bean) => {
    setCart((c) => [...c, bean.id])
    setAnnouncement(`${bean.name} added to cart`)
  }, [])

  const cartTotal = useMemo(
    () => cart.reduce((sum, id) => sum + (BEANS.find((b) => b.id === id)?.price ?? 0), 0),
    [cart],
  )

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    setSent(true)
    setEmail('')
    setMessage('')
  }

  return (
    <div className="page">
      <a className="skip" href="#beans">
        Skip to the beans
      </a>

      <div className="grain" aria-hidden="true" />

      <nav className="nav" id="site-nav" data-scrolled={scrolled ? 'true' : 'false'}>
        <a className="nav__logo" href="#hero">
          <span className="nav__mark" aria-hidden="true" />
          <span className="nav__wordmark">
            Northwind<span className="nav__wordmark-sub">Coffee Roasters</span>
          </span>
        </a>

        <div className="nav__links">
          {NAV.map(([label, href]) => (
            <a key={href} href={href}>
              <span>{label}</span>
            </a>
          ))}
        </div>

        <div className="nav__cart" data-filled={cart.length ? 'true' : 'false'}>
          <span className="nav__cart-count">{cart.length}</span>
          <span className="nav__cart-label">
            {cart.length === 1 ? 'bag' : 'bags'}
            {cart.length ? ` · $${cartTotal}` : ''}
          </span>
        </div>
      </nav>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <header className="hero" id="hero">
        <div className="hero__glow" aria-hidden="true" />

        <div className="hero__inner">
          <p className="eyebrow hero__eyebrow">
            <span className="eyebrow__dot" aria-hidden="true" />
            Bergen, Norway · 60.39° N
          </p>

          <h1 className="hero__title">
            <span className="hero__line">Small-batch coffee,</span>
            <span className="hero__line hero__line--accent">
              roasted the morning <em>it ships.</em>
            </span>
          </h1>

          <div className="hero__cols">
            <p className="hero__lede">
              We roast single-origin beans in 12kg batches on a 1962 Probat in Bergen, Norway, and ship
              them within hours. Freshness is not a slogan here; it is a timestamp on the bag.
            </p>

            <div className="ticket" aria-label="Today's roast log">
              <div className="ticket__head">
                <span>Roast log</span>
                <span>№ 4128</span>
              </div>
              <RoastCurve />
              <dl className="ticket__rows">
                <div>
                  <dt>Batch</dt>
                  <dd>12.0 kg</dd>
                </div>
                <div>
                  <dt>Drop temp</dt>
                  <dd>208 °C</dd>
                </div>
                <div>
                  <dt>Development</dt>
                  <dd>1:42 · 21%</dd>
                </div>
                <div>
                  <dt>Roast → ship</dt>
                  <dd>&lt; 24 h</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="hero__actions">
            <a className="btn btn--primary" href="#beans">
              Shop the beans
              <span aria-hidden="true">→</span>
            </a>
            <a className="btn btn--ghost" href="#brew-guide">
              Learn to brew
            </a>
          </div>
        </div>

        <div className="marquee" aria-hidden="true">
          <div className="marquee__track">
            {Array.from({ length: 2 }).map((_, i) => (
              <span key={i} className="marquee__group">
                <b>Roasted daily</b> ✦ <b>Eleven partner farms</b> ✦ <b>2.4× commodity price</b> ✦{' '}
                <b>12kg batches</b> ✦ <b>Shipped in under 24 hours</b> ✦{' '}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main>
        <Reveal as="section" className="section story" id="story">
          <div className="section__head">
            <h2 className="section__title">
              <span className="section__index">01</span> Our story
            </h2>
            <p className="section__kicker">A fishing shed, 2014 — and deliberately still small.</p>
          </div>

          <div className="story__grid">
            <p className="story__prose">
              Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still small
              on purpose: two roasters, one machine, and direct relationships with eleven farms across
              Ethiopia, Colombia, Kenya, Guatemala, and Sumatra. We pay on average 2.4× the commodity price
              and publish every contract.
            </p>

            <ul className="ledger">
              {LEDGER.map((row) => (
                <li className="ledger__row" key={row.label}>
                  <span className="ledger__value">
                    {row.prefix ? <i className="ledger__prefix">{row.prefix}</i> : null}
                    {row.value}
                    <i className="ledger__unit">{row.unit}</i>
                  </span>
                  <span className="ledger__text">
                    <strong>{row.label}</strong>
                    <em>{row.note}</em>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal as="section" className="section beans" id="beans">
          <div className="section__head">
            <h2 className="section__title">
              <span className="section__index">02</span> This month's beans
            </h2>
            <p className="section__kicker">Six lots on the bench right now. When they're gone, they're gone.</p>
          </div>

          <div className="bean-grid">
            {BEANS.map((bean, i) => (
              <BeanCard key={bean.id} bean={bean} index={i} onAdd={addToCart} />
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="section brew" id="brew-guide">
          <div className="section__head">
            <h2 className="section__title">
              <span className="section__index">03</span> Brew guide: pour over in four steps
            </h2>
            <p className="section__kicker">Three minutes, start to cup.</p>
          </div>

          <ol className="steps">
            {STEPS.map((s) => (
              <li className="step" key={s.n} style={{ '--step': s.n }}>
                <span className="step__clock">{s.clock}</span>
                <span className="step__rule" aria-hidden="true">
                  <span className="step__node" />
                </span>
                <span className="step__ghost" aria-hidden="true">
                  {s.n}
                </span>
                <h3 className="step__title">{s.title}</h3>
                <p className="step__body">{s.body}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal as="section" className="section reviews" id="reviews">
          <div className="section__head">
            <h2 className="section__title">
              <span className="section__index">04</span> What subscribers say
            </h2>
            <p className="section__kicker">Unedited, from the inbox.</p>
          </div>

          <div className="review-grid">
            {REVIEWS.map((r, i) => (
              <blockquote className="review" key={r.name} style={{ '--i': i }}>
                <span className="review__quote" aria-hidden="true">
                  &ldquo;
                </span>
                <p className="review__text">{r.quote}</p>
                <footer className="review__by">
                  <strong>{r.name}</strong>
                  <span>{r.role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="subscribe" id="subscribe">
          <div className="subscribe__inner">
            <p className="eyebrow eyebrow--light">
              <span className="eyebrow__dot" aria-hidden="true" />
              The Northwind subscription
            </p>
            <h2 className="subscribe__title">
              Two bags of our current favourites, <em>on your counter every month.</em>
            </h2>
            <p className="subscribe__body">
              Two 250g bags of our current favourites, every month, free shipping, pause any time. $29/month.
            </p>
            <div className="subscribe__actions">
              <a className="btn btn--light" href="#contact">
                Start a subscription
                <span aria-hidden="true">→</span>
              </a>
              <span className="subscribe__price">
                <b>$29</b> / month
              </span>
            </div>
          </div>
        </Reveal>

        <Reveal as="section" className="section contact" id="contact">
          <div className="contact__grid">
            <div className="contact__aside">
              <div className="section__head">
                <h2 className="section__title">
                  <span className="section__index">05</span> Get in touch
                </h2>
              </div>
              <p className="contact__blurb">
                Questions about a lot, wholesale pricing, or the exact bloom time we'd use on a Kenyan —
                two humans read this inbox.
              </p>
              <dl className="contact__facts">
                <div>
                  <dt>Roastery</dt>
                  <dd>Sandviken, Bergen, Norway</dd>
                </div>
                <div>
                  <dt>Hours</dt>
                  <dd>Tue–Sat, 08:00–16:00</dd>
                </div>
                <div>
                  <dt>Reply time</dt>
                  <dd>Within one working day</dd>
                </div>
              </dl>
            </div>

            <div className="contact__panel">
              {sent ? (
                <p className="form-success" role="status">
                  <span className="form-success__mark" aria-hidden="true">
                    ✓
                  </span>
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

                  <button type="submit" className="btn btn--primary btn--block">
                    Send message
                    <span aria-hidden="true">→</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </Reveal>
      </main>

      <footer className="footer" id="site-footer">
        <div className="footer__top">
          <p className="footer__wordmark" aria-hidden="true">
            Northwind
          </p>
          <div className="footer__links">
            <a href="#hero">Top</a>
            <a href="/shipping">Shipping</a>
            <a href="/returns">Returns</a>
            <a href="/privacy">Privacy</a>
          </div>
        </div>
        <div className="footer__bottom">
          <p>© 2026 Northwind Coffee Roasters — Bergen, Norway</p>
          <p className="footer__coords">60.3913° N, 5.3221° E</p>
        </div>
      </footer>
    </div>
  )
}

/* A roast profile drawn as a line that traces itself in. */
function RoastCurve() {
  return (
    <svg className="curve" viewBox="0 0 260 74" role="img" aria-label="Roast profile curve">
      <defs>
        <linearGradient id="curveStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--brass)" />
          <stop offset="100%" stopColor="var(--ember)" />
        </linearGradient>
      </defs>
      {[18, 37, 56].map((y) => (
        <line key={y} className="curve__grid" x1="0" y1={y} x2="260" y2={y} />
      ))}
      <path
        className="curve__line"
        d="M2 68 C 40 66, 58 40, 96 30 S 168 16, 258 8"
        fill="none"
        stroke="url(#curveStroke)"
      />
      <circle className="curve__dot" cx="258" cy="8" r="3" />
    </svg>
  )
}
