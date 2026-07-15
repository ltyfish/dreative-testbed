import { useEffect, useRef, useState } from 'react'

const BEANS = [
  { id: 'ethiopia', code: '01', origin: 'Ethiopia', name: 'Ethiopia Yirgacheffe', notes: 'Jasmine, lemon zest, honey', roast: 'Light', temp: '198°C', price: 18 },
  { id: 'colombia', code: '02', origin: 'Colombia', name: 'Colombia Huila', notes: 'Caramel, red apple, cocoa', roast: 'Medium', temp: '204°C', price: 16 },
  { id: 'sumatra', code: '03', origin: 'Indonesia', name: 'Sumatra Mandheling', notes: 'Dark chocolate, cedar, earth', roast: 'Dark', temp: '212°C', price: 17 },
  { id: 'kenya', code: '04', origin: 'Kenya', name: 'Kenya AA Nyeri', notes: 'Blackcurrant, tomato, brown sugar', roast: 'Light', temp: '197°C', price: 19 },
  { id: 'guatemala', code: '05', origin: 'Guatemala', name: 'Guatemala Antigua', notes: 'Milk chocolate, orange, almond', roast: 'Medium', temp: '205°C', price: 16 },
  { id: 'decaf', code: '06', origin: 'Blend', name: 'Swiss Water Decaf Blend', notes: 'Toffee, hazelnut, smooth', roast: 'Medium', temp: '203°C', price: 15 },
]

const STEPS = [
  { n: 1, title: 'Weigh', meta: '18g / 300ml', body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.' },
  { n: 2, title: 'Grind', meta: 'Medium-fine', body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.' },
  { n: 3, title: 'Bloom', meta: '30 seconds', body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.' },
  { n: 4, title: 'Pour', meta: '2.5 minutes', body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.' },
]

const REVIEWS = [
  { quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.', name: 'Maya T.', role: 'Subscriber since 2022' },
  { quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.', name: 'Daniel R.', role: 'Home barista' },
  { quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.', name: 'Priya S.', role: 'Gift subscriber' },
]

const NAV_ITEMS = [
  ['beans', 'Beans'],
  ['brew-guide', 'Brew Guide'],
  ['reviews', 'Reviews'],
  ['subscribe', 'Subscribe'],
  ['contact', 'Contact'],
]

const POLICY_CONTENT = {
  shipping: {
    index: '01',
    title: 'Shipping, kept quick.',
    intro: 'Coffee leaves Bergen within 24 hours of roasting. Orders ship Monday through Thursday so bags do not wait in a weekend depot.',
    details: ['Norway: 1 to 3 business days', 'Europe: 3 to 7 business days', 'Tracking is emailed when the label is printed', 'Free shipping is included with every subscription'],
  },
  returns: {
    index: '02',
    title: 'If the roast misses, tell us.',
    intro: 'Coffee is personal. If a bag arrives damaged or the roast is not right, contact us within 14 days and we will replace it.',
    details: ['Keep the bag and order number', 'Photograph shipping damage when possible', 'Refunds return to the original payment method', 'We do not ask you to ship opened coffee back'],
  },
  privacy: {
    index: '03',
    title: 'Your details stay yours.',
    intro: 'We collect only what is needed to fulfil orders, reply to messages, and manage subscriptions. We do not sell personal data.',
    details: ['Order records are retained for accounting requirements', 'Marketing email requires explicit consent', 'You can request a data export or deletion', 'Questions go to privacy@northwind.coffee'],
  },
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-label="Northwind Coffee Roasters">
      <span className="brand-ring" aria-hidden="true"><i /></span>
      <span className="brand-name">Northwind</span>
      <span className="brand-sub">Coffee Roasters</span>
    </span>
  )
}

function SiteNav({ activeSection = '', cartCount = 0, simple = false }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    const focusable = () => [...panelRef.current.querySelectorAll('a, button')]
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
      if (event.key !== 'Tab') return
      const items = focusable()
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.documentElement.style.overflow = previousOverflow
      triggerRef.current?.focus()
    }
  }, [open])

  const close = () => setOpen(false)
  const openMenu = () => {
    setOpen(true)
    window.setTimeout(() => panelRef.current?.querySelector('.menu-close')?.focus(), 80)
  }

  return (
    <nav className="site-nav" id="site-nav" aria-label="Primary">
      <a className="brand-link" href="/#hero" aria-label="Northwind home"><BrandMark /></a>
      {!simple && (
        <div className="desktop-nav">
          {NAV_ITEMS.map(([id, label]) => (
            <a key={id} href={`#${id}`} aria-current={activeSection === id ? 'location' : undefined}>{label}</a>
          ))}
        </div>
      )}
      <div className="nav-actions">
        {cartCount > 0 && <span className="cart-count" role="status">Cart {String(cartCount).padStart(2, '0')}</span>}
        {!simple && (
          <button ref={triggerRef} className="menu-trigger" type="button" aria-expanded={open} aria-controls="mobile-menu" onClick={openMenu}>
            Menu
            <span className="menu-glyph" aria-hidden="true"><i /><i /></span>
          </button>
        )}
      </div>
      {!simple && open && (
        <div className="menu-shell" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Site menu" ref={panelRef}>
          <button className="menu-backdrop" aria-label="Close menu" type="button" onClick={close} />
          <div className="menu-panel">
            <div className="menu-top">
              <BrandMark />
              <button className="menu-close" type="button" onClick={close}>Close</button>
            </div>
            <div className="menu-links">
              {NAV_ITEMS.map(([id, label], index) => (
                <a key={id} href={`#${id}`} onClick={close} style={{ '--menu-index': index }}>
                  <span>{String(index + 1).padStart(2, '0')}</span>{label}
                </a>
              ))}
            </div>
            <p className="menu-address">Bergen, Norway<br />Roasting Monday to Thursday</p>
          </div>
        </div>
      )}
    </nav>
  )
}

function RoasteryDepth() {
  const stageRef = useRef(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage || !window.matchMedia('(hover: hover) and (pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let raf = 0
    const render = () => {
      currentX += (targetX - currentX) * 0.1
      currentY += (targetY - currentY) * 0.1
      stage.style.setProperty('--depth-x', currentX.toFixed(3))
      stage.style.setProperty('--depth-y', currentY.toFixed(3))
      if (Math.abs(targetX - currentX) > 0.002 || Math.abs(targetY - currentY) > 0.002) raf = requestAnimationFrame(render)
      else raf = 0
    }
    const wake = () => { if (!raf) raf = requestAnimationFrame(render) }
    const move = (event) => {
      const rect = stage.getBoundingClientRect()
      targetX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2))
      targetY = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2))
      wake()
    }
    const leave = () => { targetX = 0; targetY = 0; wake() }
    window.addEventListener('pointermove', move)
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="depth-stage" ref={stageRef} aria-hidden="true">
      <picture className="depth-base">
        <source media="(max-width: 680px)" srcSet="/media/northwind-roastery-mobile.jpg" />
        <img src="/media/northwind-roastery-hero.jpg" alt="" width="1600" height="900" fetchpriority="high" />
      </picture>
      <div className="depth-field">
        <div className="depth-tile depth-tile-window" />
        <div className="depth-tile depth-tile-shed" />
        <div className="depth-tile depth-tile-roaster" />
        <div className="depth-tile depth-tile-tray" />
      </div>
      <div className="heat-window"><span>198</span><small>°C</small></div>
    </div>
  )
}

function RoastCurve() {
  return (
    <svg className="roast-curve" viewBox="0 0 1200 220" role="img" aria-label="A roast curve rising from green coffee to first crack and release">
      <path className="curve-grid" d="M0 180H1200M0 120H1200M0 60H1200" />
      <path className="curve-line" pathLength="1" d="M0 198 C135 190 170 168 250 158 C365 143 405 82 510 96 C625 110 650 48 750 58 C860 68 915 25 1010 39 C1090 50 1145 17 1200 12" />
      <circle cx="1010" cy="39" r="8" />
      <text x="1026" y="43">FIRST CRACK</text>
    </svg>
  )
}

function Hero() {
  return (
    <header className="hero" id="hero" data-dreative-id="hero">
      <RoasteryDepth />
      <div className="hero-shade" aria-hidden="true" />
      <div className="hero-copy">
        <p className="hero-kicker">Bergen, Norway / Batch 07:42</p>
        <h1><span className="hero-line-solid">Roasted today.</span><br /><span>Shipped today.</span></h1>
        <p className="hero-sub">Small-batch coffee, roasted the morning it ships.</p>
        <div className="hero-actions">
          <a className="button button-primary" href="#beans">Shop the beans</a>
          <a className="text-link" href="#brew-guide">Learn to brew <span aria-hidden="true">↘</span></a>
        </div>
      </div>
      <div className="hero-stamp" aria-hidden="true">
        <span>1962</span>
        <small>PROBAT / 12KG</small>
      </div>
    </header>
  )
}

function Story() {
  return (
    <section className="story section-shell" id="story" data-dreative-id="story">
      <RoastCurve />
      <div className="story-grid">
        <div className="section-index"><span>01</span><small>The room</small></div>
        <div className="story-heading">
          <h2>Small on purpose.<br />Exact by habit.</h2>
        </div>
        <div className="story-copy">
          <p>We roast single-origin beans in 12kg batches on a 1962 Probat in Bergen, Norway, and ship them within hours. Freshness is not a slogan here; it is a timestamp on the bag.</p>
          <p>Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still small on purpose: two roasters, one machine, and direct relationships with eleven farms across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra. We pay on average 2.4× the commodity price and publish every contract.</p>
        </div>
      </div>
      <dl className="proof-ledger">
        <div><dt>Partner farms</dt><dd>11</dd></div>
        <div><dt>Commodity price paid</dt><dd>2.4×</dd></div>
        <div><dt>Max batch size</dt><dd>12kg</dd></div>
        <div><dt>Roast to shipment</dt><dd>&lt;24h</dd></div>
      </dl>
    </section>
  )
}

function BeanLedger({ onAdd, cartMessage }) {
  const [active, setActive] = useState('ethiopia')
  return (
    <section className="beans section-shell" id="beans" data-dreative-id="beans">
      <div className="beans-head">
        <div className="section-index section-index-light"><span>02</span><small>The roast ledger</small></div>
        <h2>This month&apos;s beans</h2>
        <p>Six coffees. One batch at a time. Every record carries the day&apos;s roast, not a warehouse date.</p>
      </div>
      <div className="bean-ledger" role="list" aria-label="Coffee selection">
        {BEANS.map((bean) => (
          <article
            className={`bean-record ${active === bean.id ? 'is-active' : ''}`}
            key={bean.id}
            data-bean={bean.id}
            role="listitem"
            onPointerEnter={() => setActive(bean.id)}
            onFocus={() => setActive(bean.id)}
          >
            <span className="bean-code">{bean.code}</span>
            <div className="bean-identity">
              <span>{bean.origin}</span>
              <h3>{bean.name}</h3>
            </div>
            <p className="bean-notes">{bean.notes}</p>
            <div className="bean-roast"><span>{bean.roast} roast</span><small>{bean.temp} / 250g</small></div>
            <strong className="bean-price">${bean.price}</strong>
            <button className="bean-add" type="button" onClick={() => onAdd(bean)} aria-label={`Add ${bean.name} to cart`}>
              Add to cart <span aria-hidden="true">↗</span>
            </button>
          </article>
        ))}
      </div>
      <p className="cart-message" role="status" aria-live="polite">{cartMessage || 'Select a roast record to bring it forward.'}</p>
    </section>
  )
}

function BrewDial() {
  const [active, setActive] = useState(0)
  const current = STEPS[active]
  const handleKeys = (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return
    event.preventDefault()
    setActive((value) => event.key === 'ArrowRight' ? (value + 1) % STEPS.length : (value + STEPS.length - 1) % STEPS.length)
  }
  return (
    <section className="brew section-shell" id="brew-guide" data-dreative-id="brew-guide">
      <div className="brew-title">
        <div className="section-index"><span>03</span><small>The method</small></div>
        <h2>Brew guide:<br />pour over in four steps</h2>
      </div>
      <div className="brew-instrument">
        <div className="dial-wrap" style={{ '--dial-step': active }}>
          <div className="dial-orbit" aria-hidden="true">
            {STEPS.map((step, index) => <span key={step.n} className={index === active ? 'is-active' : ''} style={{ '--step': index }}>{String(step.n).padStart(2, '0')}</span>)}
          </div>
          <div className="dial-hand" aria-hidden="true"><i /></div>
          <div className="dial-center">
            <span>{String(current.n).padStart(2, '0')}</span>
            <small>{current.meta}</small>
          </div>
        </div>
        <div className="brew-copy">
          <div className="step-tabs" role="tablist" aria-label="Brew steps" onKeyDown={handleKeys}>
            {STEPS.map((step, index) => (
              <button key={step.n} type="button" role="tab" aria-selected={active === index} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)}>
                {String(step.n).padStart(2, '0')} {step.title}
              </button>
            ))}
          </div>
          <div className="active-step" role="tabpanel" aria-live="polite">
            <p className="step-meta">Step {current.n} / {current.meta}</p>
            <h3>{current.title}</h3>
            <p>{current.body}</p>
          </div>
        </div>
      </div>
      <ol className="step-fallback">
        {STEPS.map((step) => <li key={step.n}><strong>{step.n}. {step.title}</strong><span>{step.body}</span></li>)}
      </ol>
    </section>
  )
}

function ReviewsAndSubscribe() {
  return (
    <section className="voices" id="reviews" data-dreative-id="reviews">
      <div className="voices-head section-shell">
        <div className="section-index section-index-light"><span>04</span><small>The regulars</small></div>
        <h2>What subscribers say</h2>
      </div>
      <div className="review-tape">
        {REVIEWS.map((review, index) => (
          <blockquote key={review.name} className={`review review-${index + 1}`}>
            <span className="quote-mark" aria-hidden="true">“</span>
            <p>“{review.quote}”</p>
            <footer><strong>{review.name}</strong><span>{review.role}</span></footer>
          </blockquote>
        ))}
      </div>
      <div className="subscription section-shell" id="subscribe" data-dreative-id="subscribe">
        <div className="subscription-ring" aria-hidden="true"><span>29</span><small>USD / MONTH</small></div>
        <div className="subscription-copy">
          <p className="subscription-label">Two bags / Every month / Free shipping</p>
          <h2>The Northwind subscription</h2>
          <p>Two 250g bags of our current favourites, every month, free shipping, pause any time. $29/month.</p>
          <a className="button button-primary" href="#contact">Start a subscription</a>
        </div>
      </div>
    </section>
  )
}

function Contact() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef(null)
  const emailRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  function handleSubmit(event) {
    event.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.')
      emailRef.current?.focus()
      return
    }
    setError('')
    setSubmitting(true)
    timerRef.current = window.setTimeout(() => {
      setSubmitting(false)
      setSent(true)
      setEmail('')
      setMessage('')
    }, 450)
  }

  return (
    <section className="contact section-shell" id="contact" data-dreative-id="contact">
      <div className="contact-copy">
        <div className="section-index"><span>05</span><small>The open hatch</small></div>
        <h2>Get in touch</h2>
        <p>Questions, wholesale, or just coffee talk. We read everything in Bergen and reply within a day.</p>
      </div>
      <div className="contact-hatch">
        {sent ? (
          <div className="form-success" role="status">
            <span aria-hidden="true">✓</span>
            <h3>Message received.</h3>
            <p>Thanks, we read everything and reply within a day.</p>
            <button type="button" className="text-link" onClick={() => setSent(false)}>Send another message</button>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input ref={emailRef} id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(event) => { setEmail(event.target.value); if (error) setError('') }} aria-invalid={Boolean(error)} aria-describedby={error ? 'email-error' : 'email-help'} />
              {error ? <p className="field-error" id="email-error">{error}</p> : <p className="field-help" id="email-help">Where we should send the reply.</p>}
            </div>
            <div className="field">
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" rows={5} placeholder="Questions, wholesale, or just coffee talk" value={message} onChange={(event) => setMessage(event.target.value)} />
              <p className="field-help">Optional, but details help us answer faster.</p>
            </div>
            <button type="submit" className="button button-primary submit-button" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send message'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer" id="site-footer" data-dreative-id="site-footer">
      <a href="/#hero" className="footer-brand"><BrandMark /></a>
      <p>© 2026 Northwind Coffee Roasters, Bergen, Norway</p>
      <div className="footer-links">
        <a href="#hero">Top</a>
        <a href="/shipping">Shipping</a>
        <a href="/returns">Returns</a>
        <a href="/privacy">Privacy</a>
      </div>
    </footer>
  )
}

function PolicyPage({ type }) {
  const content = POLICY_CONTENT[type]
  return (
    <div className="policy-page">
      <SiteNav simple />
      <main className="policy-main">
        <div className="policy-index">NW / {content.index}</div>
        <h1>{content.title}</h1>
        <p className="policy-intro">{content.intro}</p>
        <ul>{content.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
        <a className="button button-primary" href="/#contact">Contact Northwind</a>
      </main>
      <footer className="policy-footer">
        <p>© 2026 Northwind Coffee Roasters, Bergen, Norway</p>
        <a href="/">Back to the roastery</a>
      </footer>
    </div>
  )
}

function HomePage() {
  const [activeSection, setActiveSection] = useState('')
  const [cart, setCart] = useState([])
  const [cartMessage, setCartMessage] = useState('')

  useEffect(() => {
    const targets = NAV_ITEMS.map(([id]) => document.getElementById(id)).filter(Boolean)
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActiveSection(visible.target.id)
    }, { rootMargin: '-25% 0px -55%', threshold: [0.05, 0.35, 0.7] })
    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [])

  const addBean = (bean) => {
    setCart((items) => [...items, bean.id])
    setCartMessage(`${bean.name} added to cart.`)
  }

  return (
    <div className="page">
      <SiteNav activeSection={activeSection} cartCount={cart.length} />
      <main>
        <Hero />
        <Story />
        <BeanLedger onAdd={addBean} cartMessage={cartMessage} />
        <BrewDial />
        <ReviewsAndSubscribe />
        <Contact />
      </main>
      <SiteFooter />
    </div>
  )
}

export default function App() {
  const route = window.location.pathname.replace(/^\//, '').replace(/\/$/, '')
  if (POLICY_CONTENT[route]) return <PolicyPage type={route} />
  return <HomePage />
}
