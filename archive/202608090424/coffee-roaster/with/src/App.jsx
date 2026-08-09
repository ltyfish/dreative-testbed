import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { STAGES, groundsField, profilePath, profileTopPct } from './roast.js'

const BEANS = [
  { id: 'ethiopia', name: 'Ethiopia Yirgacheffe', notes: 'Jasmine, lemon zest, honey', roast: 'Light', price: 18, origin: 'Ethiopia', color: '#b8763a', seed: 17 },
  { id: 'colombia', name: 'Colombia Huila', notes: 'Caramel, red apple, cocoa', roast: 'Medium', price: 16, origin: 'Colombia', color: '#8a4a24', seed: 41 },
  { id: 'sumatra', name: 'Sumatra Mandheling', notes: 'Dark chocolate, cedar, earth', roast: 'Dark', price: 17, origin: 'Sumatra', color: '#47251a', seed: 73 },
  { id: 'kenya', name: 'Kenya AA Nyeri', notes: 'Blackcurrant, tomato, brown sugar', roast: 'Light', price: 19, origin: 'Kenya', color: '#a8603c', seed: 128 },
  { id: 'guatemala', name: 'Guatemala Antigua', notes: 'Milk chocolate, orange, almond', roast: 'Medium', price: 16, origin: 'Guatemala', color: '#7d4527', seed: 205 },
  { id: 'decaf', name: 'Swiss Water Decaf Blend', notes: 'Toffee, hazelnut, smooth', roast: 'Medium', price: 15, origin: 'Blend', color: '#6e452c', seed: 311 },
]

// How far into the roast each level is dropped. Light comes out before the
// curve ever flattens; dark rides it to the end.
const DROP_AT = { Light: 0.66, Medium: 0.82, Dark: 0.97 }

const STEPS = [
  { n: 1, title: 'Weigh', body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.', clock: 'before', mark: 'Prep' },
  { n: 2, title: 'Grind', body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.', clock: 'before', mark: 'Prep' },
  { n: 3, title: 'Bloom', body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.', clock: 'start', mark: '0:00 — 0:30' },
  { n: 4, title: 'Pour', body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.', clock: 'run', mark: '0:30 — 3:00' },
]

const REVIEWS = [
  { quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.', name: 'Maya T.', role: 'Subscriber since 2022', lead: true },
  { quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.', name: 'Daniel R.', role: 'Home barista' },
  { quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.', name: 'Priya S.', role: 'Gift subscriber' },
]

const LEDGER = [
  { value: '11', unit: 'farms', label: 'Direct partner farms', detail: 'Ethiopia · Colombia · Kenya · Guatemala · Sumatra' },
  { value: '2.4', unit: '× commodity', label: 'Average price paid', detail: 'Every contract published in full' },
  { value: '12', unit: 'kg', label: 'Maximum batch size', detail: 'One 1962 Probat, two roasters' },
  { value: '<24', unit: 'hours', label: 'Roast to shipment', detail: 'The bag is stamped with the hour' },
]

/* Reveals the roast curve by drawing it, once, when the section arrives. The
   motion is the point: it shows the roast happening rather than decorating it. */
function useDrawIn() {
  const ref = useRef(null)
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node || drawn) return
    if (typeof IntersectionObserver === 'undefined') {
      setDrawn(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setDrawn(true)
          io.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [drawn])
  return [ref, drawn]
}

/* A bed of this batch's beans, generated from the roast colour. Every bean gets
   its own colour and its own seeded scatter, so no two cards share an image. */
function Grounds({ seed, color }) {
  const beans = useMemo(() => groundsField(seed), [seed])
  const clip = `grounds-${seed}`
  return (
    <svg className="grounds" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <clipPath id={clip}><rect width="100" height="100" /></clipPath>
        <radialGradient id={`lit-${seed}`} cx="32%" cy="18%" r="95%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.42" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill={color} />
      <g clipPath={`url(#${clip})`}>
        {beans.map((b, i) => (
          <g key={i} transform={`rotate(${b.rot} ${b.cx} ${b.cy})`}>
            <ellipse cx={b.cx} cy={b.cy + b.ry * 0.16} rx={b.rx} ry={b.ry} fill="#000" opacity="0.3" />
            <ellipse
              cx={b.cx}
              cy={b.cy}
              rx={b.rx}
              ry={b.ry}
              fill={color}
              style={{ filter: `brightness(${(0.72 + b.shade * 0.72).toFixed(2)})` }}
            />
            <path
              d={`M${b.cx} ${b.cy - b.ry * 0.82} Q${b.cx + b.rx * 0.42} ${b.cy} ${b.cx} ${b.cy + b.ry * 0.82}`}
              fill="none"
              stroke="#000"
              strokeOpacity="0.42"
              strokeWidth={b.rx * 0.18}
            />
          </g>
        ))}
      </g>
      <rect width="100" height="100" fill={`url(#lit-${seed})`} />
    </svg>
  )
}

/* Each card carries the same profile truncated at its own drop point, over a
   dotted ghost of the full roast — so the six cards read as one comparison. */
function BeanCurve({ roast, color }) {
  const to = DROP_AT[roast]
  const d = profilePath(100, 40, { to, top: 0.06, bottom: 0.94 })
  const ghost = profilePath(100, 40, { top: 0.06, bottom: 0.94 })
  return (
    <div className="bean-curve-wrap">
      <svg className="bean-curve" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
        <path className="bean-curve-ghost" d={ghost} vectorEffect="non-scaling-stroke" />
        <path className="bean-curve-line" d={d} vectorEffect="non-scaling-stroke" style={{ stroke: color }} />
      </svg>
      {Object.entries(DROP_AT).map(([level, t]) => (
        <span
          key={level}
          className="bean-tick"
          data-self={level === roast ? 'true' : 'false'}
          style={{ left: `${t * 100}%`, top: `${profileTopPct(t, 0.06, 0.94)}%`, '--bean': color }}
        >
          <i aria-hidden="true" />
          <em>{level[0]}</em>
        </span>
      ))}
    </div>
  )
}

export default function App() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [cart, setCart] = useState([])
  const [justAdded, setJustAdded] = useState(null)
  const [active, setActive] = useState('beans')
  const timer = useRef(null)

  const [heroRef, heroDrawn] = useDrawIn()
  const [brewRef, brewDrawn] = useDrawIn()

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    setSent(true)
    setEmail('')
    setMessage('')
  }

  const addToCart = useCallback((bean) => {
    setCart((c) => [...c, bean.id])
    setJustAdded(bean.id)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setJustAdded(null), 1800)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  // The nav doubles as a position readout on the log sheet.
  useEffect(() => {
    const ids = ['beans', 'brew-guide', 'reviews', 'subscribe', 'contact']
    const nodes = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (!nodes.length || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (hit) setActive(hit.target.id)
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])

  const heroPath = profilePath(1000, 320, { top: 0.1, bottom: 0.92 })

  return (
    <div className="page">
      <a className="skip" href="#hero">Skip to content</a>

      <nav className="nav" id="site-nav">
        <div className="nav-inner">
          <a className="nav-logo" href="#hero">
            <span className="nav-logo-mark" aria-hidden="true">
              <svg viewBox="0 0 40 16"><path d={profilePath(40, 16, { top: 0.14, bottom: 0.9, steps: 40 })} vectorEffect="non-scaling-stroke" /></svg>
            </span>
            <span className="nav-logo-text">Northwind<span className="nav-logo-sub">Coffee Roasters · Bergen</span></span>
          </a>
          <div className="nav-links">
            <a href="#beans" className={active === 'beans' ? 'is-active' : undefined}>Beans</a>
            <a href="#brew-guide" className={active === 'brew-guide' ? 'is-active' : undefined}>Brew Guide</a>
            <a href="#reviews" className={active === 'reviews' ? 'is-active' : undefined}>Reviews</a>
            <a href="#subscribe" className={active === 'subscribe' ? 'is-active' : undefined}>Subscribe</a>
            <a href="#contact" className={active === 'contact' ? 'is-active' : undefined}>Contact</a>
          </div>
          <div className="nav-cart" role="status" aria-live="polite">
            <span className="nav-cart-label">Bags</span>
            <span className="nav-cart-count">{String(cart.length).padStart(2, '0')}</span>
          </div>
        </div>
      </nav>

      <header className="hero" id="hero" ref={heroRef}>
        <div className="hero-chart" data-drawn={heroDrawn ? 'true' : 'false'}>
          <svg className="hero-svg" viewBox="0 0 1000 320" preserveAspectRatio="none" aria-hidden="true">
            <g className="hero-grid">
              {[0.2, 0.4, 0.6, 0.8].map((g) => (
                <line key={g} x1="0" x2="1000" y1={320 * g} y2={320 * g} vectorEffect="non-scaling-stroke" />
              ))}
            </g>
            <path className="hero-fill" d={`${heroPath} L1000 320 L0 320 Z`} />
            <path className="hero-line" d={heroPath} vectorEffect="non-scaling-stroke" />
          </svg>
          {STAGES.map((s) => (
            <div
              key={s.label}
              className="hero-stage"
              style={{ left: `${s.t * 100}%`, top: `${profileTopPct(s.t, 0.1, 0.92)}%` }}
            >
              <span className="hero-stage-dot" aria-hidden="true" />
              <span className="hero-stage-label">{s.label}</span>
              <span className="hero-stage-note">{s.note}</span>
            </div>
          ))}
        </div>

        <div className="hero-copy">
          <p className="stamp">
            <span>Batch log</span>
            <span className="stamp-rule" aria-hidden="true" />
            <span>Bergen 60.39° N</span>
          </p>
          <h1>
            Small-batch coffee,<br />roasted the morning<br /><em>it ships.</em>
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
        <p className="hero-axis" aria-hidden="true">
          <span>Charge</span><span>Time in the drum</span><span>Drop · &lt;24h to the bag</span>
        </p>
      </header>

      <section className="section section-story" id="story">
        <div className="rail"><span className="rail-num">01</span><span className="rail-label">Our story</span></div>
        <div className="section-body">
          <h2 className="lede">
            Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still
            small on purpose: two roasters, one machine, and direct relationships with eleven farms
            across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra. We pay on average 2.4× the
            commodity price and publish every contract.
          </h2>
          <dl className="ledger">
            {LEDGER.map((row) => (
              <div className="ledger-row" key={row.label}>
                <dt>
                  <span className="ledger-value">{row.value}</span>
                  <span className="ledger-unit">{row.unit}</span>
                </dt>
                <dd>
                  <span className="ledger-label">{row.label}</span>
                  <span className="ledger-detail">{row.detail}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section section-beans" id="beans">
        <div className="rail"><span className="rail-num">02</span><span className="rail-label">This month's beans</span></div>
        <div className="section-body">
          <div className="section-head">
            <h2>This month's beans</h2>
            <p className="section-note">
              Six batches on the sheet. The curve on each card is where we dropped it —
              a light roast leaves the drum before the profile ever flattens out.
            </p>
          </div>
          <div className="bean-grid">
            {BEANS.map((b) => (
              <article className="bean-card" key={b.id} data-bean={b.id} data-roast={b.roast}>
                <div className="bean-photo" style={{ '--bean': b.color }}>
                  <Grounds seed={b.seed} color={b.color} />
                  <span className="bean-origin">{b.origin}</span>
                </div>
                <div className="bean-body">
                  <div className="bean-head">
                    <h3>{b.name}</h3>
                    <span className="bean-price">${b.price}</span>
                  </div>
                  <p className="bean-notes">{b.notes}</p>
                  <BeanCurve roast={b.roast} color={b.color} />
                  <p className="bean-meta">
                    <span className="bean-roast" style={{ '--bean': b.color }}>{b.roast} roast</span>
                    <span>250g</span>
                  </p>
                  <button
                    type="button"
                    className="bean-add"
                    data-added={justAdded === b.id ? 'true' : 'false'}
                    onClick={() => addToCart(b)}
                  >
                    <span>{justAdded === b.id ? 'Added to cart' : 'Add to cart'}</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-brew" id="brew-guide" ref={brewRef}>
        <div className="rail"><span className="rail-num">03</span><span className="rail-label">Brew guide</span></div>
        <div className="section-body">
          <div className="section-head">
            <h2>Brew guide: pour over in four steps</h2>
            <p className="section-note">Two steps before the clock starts, two on it. Three minutes end to end.</p>
          </div>
          <ol className="steps" data-drawn={brewDrawn ? 'true' : 'false'}>
            {STEPS.map((s) => (
              <li className={`step step-${s.clock}`} key={s.n}>
                <div className="step-clock">
                  <span className="step-number">{s.n}</span>
                  <span className="step-mark">{s.mark}</span>
                </div>
                <div className="step-text">
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="brew-axis" aria-hidden="true">
            <span>Prep</span><span>Prep</span><span>0:00</span><span>0:30</span>
            <span className="brew-axis-end">3:00</span>
          </p>
        </div>
      </section>

      <section className="section section-reviews" id="reviews">
        <div className="rail"><span className="rail-num">04</span><span className="rail-label">Reviews</span></div>
        <div className="section-body">
          <h2 className="visually-hidden">What subscribers say</h2>
          <div className="reviews">
            {REVIEWS.map((r) => (
              <blockquote className={r.lead ? 'review review-lead' : 'review'} key={r.name}>
                <p>{r.lead ? `“${r.quote}”` : r.quote}</p>
                <footer>
                  <strong>{r.name}</strong>
                  <span>{r.role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="section subscribe" id="subscribe">
        <div className="subscribe-inner">
          <div className="rail rail-dark"><span className="rail-num">05</span><span className="rail-label">Subscribe</span></div>
          <div className="section-body">
            <h2>The Northwind subscription</h2>
            <p className="subscribe-copy">
              Two 250g bags of our current favourites, every month, free shipping, pause any time.
              $29/month.
            </p>
            <a className="btn btn-ember" href="#contact">Start a subscription</a>
          </div>
          {/* The bag label as it is actually printed: the roast fields are left
              blank because they are stamped by hand at packing, which is the
              whole point of the timestamp. */}
          <aside className="bag" aria-label="What is printed on the bag">
            <div className="bag-head">
              <span>Northwind</span>
              <span>250g</span>
            </div>
            <p className="bag-title">Single origin<br />filter roast</p>
            <dl className="bag-fields">
              <div><dt>Roasted</dt><dd className="bag-blank" aria-label="stamped at packing" /></div>
              <div><dt>Shipped</dt><dd className="bag-blank" aria-label="stamped at packing" /></div>
              <div><dt>Batch</dt><dd>max 12kg</dd></div>
              <div><dt>Roastery</dt><dd>Bergen, NO</dd></div>
            </dl>
            <p className="bag-foot">Two bags a month · free shipping · pause any time</p>
          </aside>
        </div>
        <svg className="subscribe-rhythm" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i} transform={`translate(${i * 200} 0)`}>
              <path d={profilePath(200, 60, { top: 0.18, bottom: 0.86, steps: 48 })} vectorEffect="non-scaling-stroke" />
            </g>
          ))}
        </svg>
        <p className="subscribe-rhythm-label" aria-hidden="true">One roast a month, on the same curve</p>
      </section>

      <section className="section section-contact" id="contact">
        <div className="rail"><span className="rail-num">06</span><span className="rail-label">Get in touch</span></div>
        <div className="section-body">
          <div className="contact-grid">
            <div className="contact-aside">
              <h2>Get in touch</h2>
              <p>
                Wholesale, a question about a batch, or an argument about bloom times —
                it reaches the same two people who run the roaster.
              </p>
            </div>
            {sent ? (
              <p className="form-success" role="status">Thanks — we read everything and reply within a day.</p>
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
          </div>
        </div>
      </section>

      <footer className="footer" id="site-footer">
        <svg className="footer-rule" viewBox="0 0 1200 28" preserveAspectRatio="none" aria-hidden="true">
          <path d={profilePath(1200, 28, { top: 0.25, bottom: 0.85, steps: 80 })} vectorEffect="non-scaling-stroke" />
        </svg>
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
    </div>
  )
}
