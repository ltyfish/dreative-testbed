import { useEffect, useRef, useState } from 'react'
import NightStage from './components/NightStage.jsx'

const BEANS = [
  { id: 'ethiopia', code: 'ET-01', name: 'Ethiopia Yirgacheffe', notes: 'Jasmine, lemon zest, honey', roast: 'Light', price: 18, altitude: '1,950m', process: 'Washed' },
  { id: 'colombia', code: 'CO-02', name: 'Colombia Huila', notes: 'Caramel, red apple, cocoa', roast: 'Medium', price: 16, altitude: '1,780m', process: 'Washed' },
  { id: 'sumatra', code: 'ID-03', name: 'Sumatra Mandheling', notes: 'Dark chocolate, cedar, earth', roast: 'Dark', price: 17, altitude: '1,450m', process: 'Wet hulled' },
  { id: 'kenya', code: 'KE-04', name: 'Kenya AA Nyeri', notes: 'Blackcurrant, tomato, brown sugar', roast: 'Light', price: 19, altitude: '1,900m', process: 'Washed' },
  { id: 'guatemala', code: 'GT-05', name: 'Guatemala Antigua', notes: 'Milk chocolate, orange, almond', roast: 'Medium', price: 16, altitude: '1,650m', process: 'Washed' },
  { id: 'decaf', code: 'DC-06', name: 'Swiss Water Decaf Blend', notes: 'Toffee, hazelnut, smooth', roast: 'Medium', price: 15, altitude: 'Mixed', process: 'Swiss Water' },
]

const STEPS = [
  { n: 1, title: 'Weigh', short: '18g / 300ml', body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.' },
  { n: 2, title: 'Grind', short: 'Medium-fine', body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.' },
  { n: 3, title: 'Bloom', short: '30 seconds', body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.' },
  { n: 4, title: 'Pour', short: '2.5 minutes', body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.' },
]

const REVIEWS = [
  { quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.', name: 'Maya T.', role: 'Subscriber since 2022' },
  { quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.', name: 'Daniel R.', role: 'Home barista' },
  { quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.', name: 'Priya S.', role: 'Gift subscriber' },
]

const ROAST_STATES = [
  { name: 'Charge', time: '00:00', heat: '196°C', copy: 'Green coffee enters the drum. Rain-cold steel gives way to stored heat.' },
  { name: 'First crack', time: '08:42', heat: '204°C', copy: 'The bean structure opens. Sweetness, acidity, and roast momentum meet for a few exact seconds.' },
  { name: 'Dispatch', time: '11:18', heat: '42°C', copy: 'The batch cools fast, rests, is sealed, timestamped, and leaves Bergen before noon.' },
]

const NAV_ITEMS = [
  ['Beans', '#beans'],
  ['Brew guide', '#brew-guide'],
  ['Reviews', '#reviews'],
  ['Subscribe', '#subscribe'],
  ['Contact', '#contact'],
]

const POLICIES = {
  '/shipping': {
    title: 'Shipping',
    body: 'We dispatch within 24 hours of roasting. Norway orders usually arrive in 1–3 business days; international delivery times vary by destination. Subscription shipping is included.',
  },
  '/returns': {
    title: 'Returns',
    body: 'Coffee is perishable, so opened bags cannot be returned. If an order arrives damaged or incorrect, contact us within seven days and we will replace it or refund it.',
  },
  '/privacy': {
    title: 'Privacy',
    body: 'We use contact and order details only to fulfil purchases, manage subscriptions, and reply to messages. We do not sell personal information.',
  },
}

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')
  const [heroProgress, setHeroProgress] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [selectedBean, setSelectedBean] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [roastState, setRoastState] = useState(0)
  const [cartMessage, setCartMessage] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [emailError, setEmailError] = useState('')
  const [sent, setSent] = useState(false)
  const [policyPath, setPolicyPath] = useState(POLICIES[location.pathname] ? location.pathname : null)
  const heroRef = useRef(null)
  const menuButtonRef = useRef(null)
  const menuRef = useRef(null)
  const emailRef = useRef(null)
  const policyCloseRef = useRef(null)
  const policyTriggerRef = useRef(null)
  const cartTimerRef = useRef(null)

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    let disposed = false
    let teardown = () => {}

    async function setupHeroProgress() {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (disposed || !heroRef.current) return
      gsap.registerPlugin(ScrollTrigger)
      const trigger = ScrollTrigger.create({
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => setHeroProgress(clamp(self.progress)),
      })
      teardown = () => trigger.kill()
    }

    setupHeroProgress()
    return () => {
      disposed = true
      teardown()
    }
  }, [])

  useEffect(() => {
    const ids = ['hero', 'beans', 'brew-guide', 'reviews', 'subscribe', 'contact']
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActiveSection(visible.target.id)
    }, { rootMargin: '-20% 0px -65%', threshold: [0.05, 0.3, 0.6] })
    ids.forEach((id) => {
      const node = document.getElementById(id)
      if (node) observer.observe(node)
    })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('menu-is-open', menuOpen || Boolean(policyPath))
    if (menuRef.current) menuRef.current.inert = !menuOpen
    if (!menuOpen) return undefined

    const focusable = menuRef.current?.querySelectorAll('a, button')
    focusable?.[0]?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
      if (event.key === 'Tab' && focusable?.length) {
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    addEventListener('keydown', onKeyDown)
    return () => removeEventListener('keydown', onKeyDown)
  }, [menuOpen, policyPath])

  useEffect(() => {
    const onPopState = () => setPolicyPath(POLICIES[location.pathname] ? location.pathname : null)
    addEventListener('popstate', onPopState)
    return () => removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => () => clearTimeout(cartTimerRef.current), [])

  useEffect(() => {
    if (!policyPath) return undefined
    policyCloseRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closePolicy()
      if (event.key === 'Tab') {
        const dialog = policyCloseRef.current?.closest('[role="dialog"]')
        const focusable = dialog?.querySelectorAll('button, a')
        if (!focusable?.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    addEventListener('keydown', onKeyDown)
    return () => removeEventListener('keydown', onKeyDown)
  }, [policyPath])

  function handleAddToCart(bean) {
    clearTimeout(cartTimerRef.current)
    setCartMessage(`${bean.name} added to cart`)
    cartTimerRef.current = window.setTimeout(() => setCartMessage(''), 2800)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!email.includes('@')) {
      setEmailError('Enter a valid email address.')
      emailRef.current?.focus()
      return
    }
    setEmailError('')
    setSent(true)
    setEmail('')
    setMessage('')
  }

  function openPolicy(event, path) {
    event.preventDefault()
    policyTriggerRef.current = event.currentTarget
    history.pushState({ policy: path }, '', path)
    setPolicyPath(path)
  }

  function closePolicy() {
    const trigger = policyTriggerRef.current
    if (POLICIES[location.pathname]) {
      history.pushState({}, '', '/')
    }
    setPolicyPath(null)
    window.setTimeout(() => trigger?.focus(), 0)
  }

  function cycleBean(direction) {
    setSelectedBean((current) => (current + direction + BEANS.length) % BEANS.length)
  }

  function moveTab(event, current, total, select) {
    const keyMoves = {
      ArrowRight: (current + 1) % total,
      ArrowLeft: (current + total - 1) % total,
      Home: 0,
      End: total - 1,
    }
    const next = keyMoves[event.key]
    if (next === undefined) return
    event.preventDefault()
    select(next)
    event.currentTarget.parentElement?.querySelectorAll('[role="tab"]')[next]?.focus()
  }

  const bean = BEANS[selectedBean]
  const step = STEPS[activeStep]
  const review = REVIEWS[reviewIndex]
  const roast = ROAST_STATES[roastState]
  const heroState = heroProgress < 0.34 ? 'charge' : heroProgress < 0.76 ? 'first crack' : 'dispatch'

  return (
    <div className="site">
      <a className="skip-link" href="#main">Skip to content</a>
      <nav className="site-nav" id="site-nav" aria-label="Primary navigation">
        <a className="wordmark" href="#hero" aria-label="Northwind Coffee Roasters, back to top">
          <span>Northwind</span>
          <span>Coffee Roasters</span>
        </a>
        <div className="desktop-nav">
          {NAV_ITEMS.map(([label, href]) => (
            <a key={href} href={href} aria-current={activeSection === href.slice(1) ? 'location' : undefined}>
              {label}
            </a>
          ))}
        </div>
        <button
          ref={menuButtonRef}
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span>{menuOpen ? 'Close' : 'Menu'}</span>
          <i aria-hidden="true" />
        </button>
      </nav>

      <div
        id="mobile-menu"
        ref={menuRef}
        className={`mobile-menu ${menuOpen ? 'is-open' : ''}`}
        aria-hidden={!menuOpen}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setMenuOpen(false)
        }}
      >
        <div className="mobile-menu-panel">
          <p>Night shift / Bergen</p>
          {NAV_ITEMS.map(([label, href], index) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}>
              <span>0{index + 1}</span>{label}
            </a>
          ))}
          <small>Roasting since 2014 · Reply within one day</small>
        </div>
      </div>

      <main id="main">
        <header className="night-hero" id="hero" ref={heroRef}>
          <div className="hero-sticky">
            <NightStage progress={reducedMotion ? 1 : heroProgress} reducedMotion={reducedMotion} />
            <div className="hero-shade" aria-hidden="true" />
            <div className="hero-frame">
              <div className="hero-kicker">
                <span>Bergen, Norway</span>
                <span>Batch NW-0217</span>
                <span>Roast state {heroState}</span>
              </div>
              <div className="hero-copy">
                <p className="section-mark">Night shift / 01</p>
                <h1>Roasted while Bergen sleeps.</h1>
                <p>
                  We roast single-origin beans in 12kg batches on a 1962 Probat and ship them
                  within hours. Freshness is not a slogan here; it is a timestamp on the bag.
                </p>
                <div className="hero-actions">
                  <a className="button button-ember" href="#beans">Shop the night’s roast</a>
                  <a className="text-link" href="#story">Read the batch ledger <span aria-hidden="true">↘</span></a>
                </div>
              </div>
              <div className="hero-telemetry" aria-hidden="true">
                <span>Charge<strong>196°C</strong></span>
                <span>First crack<strong>204°C</strong></span>
                <span>Dispatch<strong>&lt;24h</strong></span>
              </div>
            </div>
            <div className="batch-trace" aria-hidden="true">
              <i style={{ transform: `scaleX(${Math.max(0.025, heroProgress)})` }} />
            </div>
          </div>
        </header>

        <section className="story-chapter" id="story">
          <div className="story-image">
            <img src="/assets/night-roastery-prototype.png" alt="A vintage coffee roaster working beside rain-streaked windows overlooking Bergen harbor at night." />
            <span>02:43 / cooling tray</span>
          </div>
          <div className="story-copy">
            <p className="section-mark">Proof / 02</p>
            <h2>Small on purpose. Exact by habit.</h2>
            <p>
              Northwind started in 2014 as a roastery in a fishing shed. Ten years later we
              are still small on purpose: two roasters, one machine, and direct relationships
              with eleven farms across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra.
              We pay on average 2.4× the commodity price and publish every contract.
            </p>
            <dl className="proof-ledger">
              <div><dt>Partner farms</dt><dd>11</dd></div>
              <div><dt>Commodity price paid</dt><dd>2.4×</dd></div>
              <div><dt>Maximum batch</dt><dd>12kg</dd></div>
              <div><dt>Roast to shipment</dt><dd>&lt;24h</dd></div>
            </dl>
          </div>
        </section>

        <section className="roast-journey" id="freshness" style={{ '--roast-progress': roastState / 2 }}>
          <div className="roast-heading">
            <p className="section-mark">Freshness / 03</p>
            <h2>Eleven minutes from green to ready.</h2>
            <p>Control the batch. The visual state, temperature line, and dispatch object all follow the same roast moment.</p>
          </div>
          <div className="roast-chamber">
            <div className="roast-visual" aria-hidden="true">
              <img src="/assets/night-roastery-prototype.png" alt="" />
              <div className="roast-aperture">
                <span>{roast.time}</span>
                <strong>{roast.heat}</strong>
              </div>
              <img className="roast-bag" src="/assets/northwind-bag-prototype.png" alt="" />
            </div>
            <div className="roast-console">
              <p className="roast-index">0{roastState + 1} / 03</p>
              <h3>{roast.name}</h3>
              <p>{roast.copy}</p>
              <div className="roast-controls" role="group" aria-label="Roast states">
                {ROAST_STATES.map((state, index) => (
                  <button
                    key={state.name}
                    type="button"
                    aria-pressed={roastState === index}
                    onClick={() => setRoastState(index)}
                  >
                    <span>0{index + 1}</span>{state.name}
                  </button>
                ))}
              </div>
              <input
                className="roast-range"
                type="range"
                min="0"
                max="2"
                step="1"
                value={roastState}
                onChange={(event) => setRoastState(Number(event.target.value))}
                aria-label="Roast progress"
              />
            </div>
          </div>
        </section>

        <section className="beans-section" id="beans">
          <div className="beans-heading">
            <div>
              <p className="section-mark">Current roast / 04</p>
              <h2>Choose your origin after dark.</h2>
            </div>
            <div className="section-arrows">
              <button type="button" onClick={() => cycleBean(-1)} aria-label="Previous coffee">←</button>
              <button type="button" onClick={() => cycleBean(1)} aria-label="Next coffee">→</button>
            </div>
          </div>

          <div
            className="bean-dossier"
            id="active-bean"
            data-roast={bean.roast.toLowerCase()}
            role="tabpanel"
            aria-labelledby={`bean-tab-${bean.id}`}
          >
            <div className="bean-identity">
              <span>{bean.code} · {bean.process}</span>
              <h3>{bean.name}</h3>
              <p>{bean.notes}</p>
            </div>
            <div className="bean-pack">
              <span className="bean-orbit" aria-hidden="true" />
              <img src="/assets/northwind-bag-prototype.png" alt={`${bean.name} coffee bag`} />
            </div>
            <dl className="bean-specs">
              <div><dt>Roast</dt><dd>{bean.roast}</dd></div>
              <div><dt>Altitude</dt><dd>{bean.altitude}</dd></div>
              <div><dt>Weight</dt><dd>250g</dd></div>
              <div><dt>Price</dt><dd>${bean.price}</dd></div>
            </dl>
            <button className="button button-ember bean-add" type="button" onClick={() => handleAddToCart(bean)}>
              Add {bean.name} to cart
            </button>
          </div>

          <div className="bean-shelf" role="tablist" aria-label="Coffee origins">
            {BEANS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`bean-tab-${item.id}`}
                aria-selected={selectedBean === index}
                aria-controls="active-bean"
                onClick={() => setSelectedBean(index)}
                onKeyDown={(event) => moveTab(event, index, BEANS.length, setSelectedBean)}
              >
                <span>{item.code}</span>
                <strong>{item.name}</strong>
                <small>{item.notes}</small>
                <b>${item.price}</b>
              </button>
            ))}
          </div>
        </section>

        <section className="brew-section" id="brew-guide">
          <div className="brew-media">
            <img src="/assets/night-roastery-prototype.png" alt="A working Northwind roastery, used as the visual setting for the pour-over guide." />
            <div className="brew-rings" aria-hidden="true">
              {STEPS.map((item, index) => (
                <i key={item.n} className={activeStep === index ? 'is-active' : ''} />
              ))}
            </div>
          </div>
          <div className="brew-panel">
            <p className="section-mark">Brew / 05</p>
            <h2>Four moves. One clear cup.</h2>
            <div className="brew-tabs" role="tablist" aria-label="Pour-over steps">
              {STEPS.map((item, index) => (
                <button
                  key={item.n}
                  type="button"
                  role="tab"
                  id={`brew-tab-${item.n}`}
                  aria-selected={activeStep === index}
                  aria-controls="brew-instruction"
                  onClick={() => setActiveStep(index)}
                  onKeyDown={(event) => moveTab(event, index, STEPS.length, setActiveStep)}
                >
                  <span>0{item.n}</span>{item.title}
                </button>
              ))}
            </div>
            <div
              className="brew-instruction"
              id="brew-instruction"
              role="tabpanel"
              aria-labelledby={`brew-tab-${step.n}`}
            >
              <span>{step.short}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
            <ol className="brew-fallback">
              {STEPS.map((item) => <li key={item.n}><strong>{item.title}</strong> {item.body}</li>)}
            </ol>
          </div>
        </section>

        <section className="reviews-section" id="reviews">
          <div className="reviews-meta">
            <p className="section-mark">Voices / 06</p>
            <span>0{reviewIndex + 1} / 03</span>
          </div>
          <blockquote key={review.name}>
            <p>“{review.quote}”</p>
            <footer><strong>{review.name}</strong><span>{review.role}</span></footer>
          </blockquote>
          <div className="review-controls">
            <button type="button" onClick={() => setReviewIndex((reviewIndex + REVIEWS.length - 1) % REVIEWS.length)}>Previous</button>
            <button type="button" onClick={() => setReviewIndex((reviewIndex + 1) % REVIEWS.length)}>Next</button>
          </div>
          <div className="all-reviews">
            {REVIEWS.map((item) => <span key={item.name}>{item.quote} — {item.name}, {item.role}</span>)}
          </div>
        </section>

        <section className="subscribe-section" id="subscribe">
          <div className="subscribe-seal" aria-hidden="true">
            <i />
            <img src="/assets/northwind-bag-prototype.png" alt="" />
            <span>Roasted monthly<br />Dispatched from Bergen</span>
          </div>
          <div className="subscribe-copy">
            <p className="section-mark">Recurring dispatch / 07</p>
            <h2>The Northwind subscription.</h2>
            <p>Two 250g bags of our current favourites, every month, free shipping, pause any time.</p>
            <div className="subscription-price"><strong>$29</strong><span>/ month</span></div>
            <a className="button button-ember" href="#contact">Start a subscription</a>
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div className="contact-intro">
            <p className="section-mark">Dispatch desk / 08</p>
            <h2>Questions, wholesale, or just coffee talk.</h2>
            <p>We read everything and reply within a day from Bergen.</p>
          </div>
          <div className="contact-panel">
            {sent ? (
              <div className="form-success" role="status">
                <span>NW / SENT</span>
                <h3>Message stamped for dispatch.</h3>
                <p>Thanks — we read everything and reply within a day.</p>
                <button type="button" className="text-button" onClick={() => setSent(false)}>Send another message</button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit} noValidate>
                <label htmlFor="email">Email <span>Required</span></label>
                <input
                  ref={emailRef}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? 'email-error' : undefined}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    if (emailError && event.target.value.includes('@')) setEmailError('')
                  }}
                />
                {emailError && <p className="field-error" id="email-error">{emailError}</p>}
                <label htmlFor="message">Message <span>Optional</span></label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  placeholder="What can we help with?"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
                <button type="submit" className="button button-ember">Send message</button>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="footer" id="site-footer">
        <div>
          <a className="wordmark" href="#hero"><span>Northwind</span><span>Coffee Roasters</span></a>
          <p>© 2026 Northwind Coffee Roasters — Bergen, Norway</p>
        </div>
        <div className="footer-links">
          <a href="#hero">Top</a>
          {Object.entries(POLICIES).map(([path, policy]) => (
            <a key={path} href={path} onClick={(event) => openPolicy(event, path)}>{policy.title}</a>
          ))}
        </div>
        <p className="footer-note">Two roasters. One machine. Eleven farms.</p>
      </footer>

      <div className={`cart-toast ${cartMessage ? 'is-visible' : ''}`} role="status" aria-live="polite">
        {cartMessage}
      </div>

      {policyPath && (
        <div className="policy-dialog" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closePolicy()
        }}>
          <article role="dialog" aria-modal="true" aria-labelledby="policy-title">
            <button ref={policyCloseRef} className="policy-close" type="button" onClick={closePolicy}>Close</button>
            <p className="section-mark">Northwind policy</p>
            <h2 id="policy-title">{POLICIES[policyPath].title}</h2>
            <p>{POLICIES[policyPath].body}</p>
            <a href="mailto:hello@northwind.coffee">hello@northwind.coffee</a>
          </article>
        </div>
      )}
    </div>
  )
}
