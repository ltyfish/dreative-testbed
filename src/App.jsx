import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const RoastField = lazy(() => import('./RoastField.jsx'))

const BEANS = [
  { id: 'ethiopia', code: 'ET-01', name: 'Ethiopia Yirgacheffe', notes: 'Jasmine, lemon zest, honey', roast: 'Light', price: 18, color: '#e7ff38' },
  { id: 'colombia', code: 'CO-02', name: 'Colombia Huila', notes: 'Caramel, red apple, cocoa', roast: 'Medium', price: 16, color: '#ff6d4a' },
  { id: 'sumatra', code: 'ID-03', name: 'Sumatra Mandheling', notes: 'Dark chocolate, cedar, earth', roast: 'Dark', price: 17, color: '#c6a7ff' },
  { id: 'kenya', code: 'KE-04', name: 'Kenya AA Nyeri', notes: 'Blackcurrant, tomato, brown sugar', roast: 'Light', price: 19, color: '#76d6ff' },
  { id: 'guatemala', code: 'GT-05', name: 'Guatemala Antigua', notes: 'Milk chocolate, orange, almond', roast: 'Medium', price: 16, color: '#ffd05a' },
  { id: 'decaf', code: 'DC-06', name: 'Swiss Water Decaf Blend', notes: 'Toffee, hazelnut, smooth', roast: 'Medium', price: 15, color: '#ff8ab3' },
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

const POLICIES = {
  shipping: ['Shipping', 'Orders roasted before noon leave Bergen the same day. Norway delivery takes 1 to 3 working days. International delivery times vary by destination.'],
  returns: ['Returns', 'Coffee is perishable, so opened bags cannot be returned. If an order arrives damaged or incorrect, contact us and we will make it right.'],
  privacy: ['Privacy', 'We use contact details only to reply, fulfil orders, and manage subscriptions. We do not sell personal information.'],
}

function Arrow({ direction = 'right' }) {
  return <span aria-hidden="true">{direction === 'left' ? '←' : '→'}</span>
}

function useActiveSection() {
  const [active, setActive] = useState('hero')

  useEffect(() => {
    const sections = [...document.querySelectorAll('main section[id], header[id]')]
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-30% 0px -55%', threshold: [0.1, 0.4, 0.7] },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return active
}

export default function App() {
  const rootRef = useRef(null)
  const heroRef = useRef(null)
  const freshnessRef = useRef(null)
  const shelfRef = useRef(null)
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0 })
  const menuRef = useRef(null)
  const menuButtonRef = useRef(null)
  const policyRef = useRef(null)
  const policyReturnRef = useRef(null)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const [cartMessage, setCartMessage] = useState('')
  const [activeBean, setActiveBean] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [roastFrame, setRoastFrame] = useState(0)
  const [roastProgress, setRoastProgress] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [policy, setPolicy] = useState(null)
  const activeSection = useActiveSection()

  useLayoutEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return undefined

    const context = gsap.context(() => {
      gsap.from('.hero-copy > *', {
        yPercent: 28,
        opacity: 0,
        duration: 0.72,
        stagger: 0.07,
        ease: 'expo.out',
      })
      gsap.from('.hero-media, .batch-passport', {
        scale: 0.92,
        rotate: 2,
        opacity: 0,
        duration: 0.82,
        stagger: 0.08,
        ease: 'expo.out',
      })
      gsap.utils.toArray('[data-reveal]').forEach((element, index) => {
        gsap.from(element, {
          y: index % 2 ? 28 : 18,
          duration: 0.6,
          ease: 'expo.out',
          scrollTrigger: { trigger: element, start: 'top 84%', once: true },
        })
      })
      ScrollTrigger.create({
        trigger: freshnessRef.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const nextProgress = Math.min(1, Math.max(0, self.progress))
          setRoastProgress(nextProgress)
          setRoastFrame(Math.min(2, Math.floor(nextProgress * 3)))
        },
      })
    }, rootRef)

    return () => context.revert()
  }, [])

  useEffect(() => {
    if (!menuOpen) return undefined
    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    const focusables = [...menuRef.current.querySelectorAll('a, button')]
    focusables[0]?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') setMenuOpen(false)
      if (event.key !== 'Tab' || focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.documentElement.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      menuButtonRef.current?.focus()
    }
  }, [menuOpen])

  useEffect(() => {
    if (!cartMessage) return undefined
    const timer = window.setTimeout(() => setCartMessage(''), 3200)
    return () => window.clearTimeout(timer)
  }, [cartMessage])

  useEffect(() => {
    if (!policy) return undefined
    const panel = policyRef.current
    const focusables = [...panel.querySelectorAll('button, a')]
    focusables[0]?.focus()

    function handlePolicyKey(event) {
      if (event.key === 'Escape') setPolicy(null)
      if (event.key !== 'Tab' || focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handlePolicyKey)
    return () => {
      window.removeEventListener('keydown', handlePolicyKey)
      policyReturnRef.current?.focus()
    }
  }, [policy])

  function moveHero(event) {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const rect = heroRef.current.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    heroRef.current.style.setProperty('--pointer-x', x.toFixed(3))
    heroRef.current.style.setProperty('--pointer-y', y.toFixed(3))
  }

  function addToCart(bean) {
    setCartCount((count) => count + 1)
    setCartMessage(`${bean.name} added. Cart now has ${cartCount + 1} bag${cartCount === 0 ? '' : 's'}.`)
  }

  function handleSubmit(event) {
    event.preventDefault()
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!validEmail) {
      setEmailError('Enter a valid email address.')
      document.getElementById('email')?.focus()
      return
    }
    setEmailError('')
    setSubmitting(true)
    window.setTimeout(() => {
      setSubmitting(false)
      setSent(true)
      setEmail('')
      setMessage('')
    }, 550)
  }

  function moveReview(direction) {
    setReviewIndex((index) => (index + direction + REVIEWS.length) % REVIEWS.length)
  }

  function handleReviewKey(event) {
    if (event.key === 'ArrowLeft') moveReview(-1)
    if (event.key === 'ArrowRight') moveReview(1)
  }

  function openPolicy(event, key) {
    event.preventDefault()
    policyReturnRef.current = event.currentTarget
    setPolicy(key)
  }

  function startShelfDrag(event) {
    if (event.pointerType !== 'mouse' || event.target.closest('.bean-buy button')) return
    const shelf = shelfRef.current
    dragRef.current = { active: true, startX: event.clientX, scrollLeft: shelf.scrollLeft }
    shelf.dataset.dragging = 'true'
    shelf.setPointerCapture(event.pointerId)
  }

  function moveShelfDrag(event) {
    if (!dragRef.current.active) return
    shelfRef.current.scrollLeft = dragRef.current.scrollLeft - (event.clientX - dragRef.current.startX)
  }

  function endShelfDrag(event) {
    const shelf = shelfRef.current
    dragRef.current.active = false
    delete shelf.dataset.dragging
    if (shelf.hasPointerCapture(event.pointerId)) shelf.releasePointerCapture(event.pointerId)
  }

  const selectedBean = BEANS[activeBean]

  return (
    <div className="site-shell" ref={rootRef}>
      <a className="skip-link" href="#main-content">Skip to content</a>

      <nav className="site-nav" id="site-nav" aria-label="Primary navigation">
        <a className="brand-mark" href="#hero" aria-label="Northwind Coffee Roasters home">
          <span>Northwind</span><span>Coffee Roasters</span>
        </a>
        <div className="nav-links" aria-label="Page chapters">
          <a href="#beans" aria-current={activeSection === 'beans' ? 'location' : undefined}>Beans</a>
          <a href="#brew-guide" aria-current={activeSection === 'brew-guide' ? 'location' : undefined}>Brew Guide</a>
          <a href="#reviews" aria-current={activeSection === 'reviews' ? 'location' : undefined}>Reviews</a>
          <a href="#subscribe" aria-current={activeSection === 'subscribe' ? 'location' : undefined}>Subscribe</a>
          <a href="#contact" aria-current={activeSection === 'contact' ? 'location' : undefined}>Contact</a>
        </div>
        <div className="nav-actions">
          <a className="cart-link" href="#beans" aria-label={`Cart with ${cartCount} bags`}>Cart <span>{String(cartCount).padStart(2, '0')}</span></a>
          <button
            className="menu-toggle"
            ref={menuButtonRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span>{menuOpen ? 'Close' : 'Menu'}</span>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="menu-overlay" id="mobile-menu" ref={menuRef} role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button className="menu-backdrop" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <div className="menu-panel">
            <button className="menu-close" type="button" onClick={() => setMenuOpen(false)}>Close</button>
            <p>Roasted today in Bergen</p>
            {[
              ['beans', 'Beans'],
              ['brew-guide', 'Brew Guide'],
              ['reviews', 'Reviews'],
              ['subscribe', 'Subscribe'],
              ['contact', 'Contact'],
            ].map(([id, label], index) => (
              <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}><span>0{index + 1}</span>{label}</a>
            ))}
          </div>
        </div>
      )}

      <main id="main-content">
        <header className="hero" id="hero" ref={heroRef} onPointerMove={moveHero}>
          <div className="hero-copy">
            <p className="hero-kicker">Roasted in Bergen / Batch 0714</p>
            <h1>Taste the<br />weather.</h1>
            <p>Small batches. Eleven farms. Out the door before the rain changes.</p>
            <div className="hero-actions">
              <a className="button button-dark" href="#beans">Choose a roast <Arrow /></a>
              <a className="text-link" href="#story">Read our proof</a>
            </div>
          </div>

          <div className="hero-media" aria-hidden="true">
            <img src="/assets/rain-check-hero.webp" alt="" width="1586" height="992" fetchpriority="high" />
            <div className="hero-rain" />
          </div>

          <div className="batch-passport" aria-hidden="true">
            <div className="passport-top"><span>NW</span><span>0714</span></div>
            <img src="/assets/northwind-bag.webp" alt="" width="1024" height="1536" />
            <div className="passport-bottom"><span>Roasted 06:40</span><span>Ships &lt;24h</span></div>
          </div>

          <div className="hero-index" aria-hidden="true"><span>60.39° N</span><span>05.32° E</span></div>
        </header>

        <section className="story section-pad" id="story">
          <div className="story-image" data-reveal>
            <img src="/assets/bergen.jpg" alt="Bergen harbor seen from above, with colorful buildings gathered around the water" width="1800" height="1200" loading="lazy" />
            <span className="image-stamp">Bergen / Rain expected</span>
          </div>
          <div className="story-copy" data-reveal>
            <h2>Eleven farms.<br />No fog.</h2>
            <p>
              Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still small on purpose: two roasters, one machine, and direct relationships with eleven farms across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra.
            </p>
            <p>
              We roast single-origin beans in 12kg batches on a 1962 Probat in Bergen, Norway, and ship them within hours. Freshness is not a slogan here; it is a timestamp on the bag.
            </p>
          </div>
          <dl className="proof-ledger" data-reveal>
            <div><dt>11</dt><dd>11 partner farms</dd></div>
            <div><dt>2.4×</dt><dd>2.4× commodity price paid</dd></div>
            <div><dt>12kg</dt><dd>12kg max batch size</dd></div>
            <div><dt>&lt;24h</dt><dd>{'<24h roast to shipment'}</dd></div>
          </dl>
        </section>

        <section className="beans-section section-pad" id="beans" style={{ '--bean-color': selectedBean.color }}>
          <div className="section-heading" data-reveal>
            <h2>Choose your<br />forecast.</h2>
            <p>Six coffees in rotation. Pick by what you want the morning to feel like.</p>
          </div>

          <div className="bean-stage" data-reveal>
            <div className="bean-stage-image" aria-hidden="true">
              <img src="/assets/beans.jpg" alt="" width="1400" height="933" loading="lazy" />
            </div>
            <div className="active-bean-copy" aria-live="polite">
              <span>{selectedBean.code}</span>
              <strong>{selectedBean.notes}</strong>
            </div>
          </div>

          <div className="bean-shelf-wrap">
            <div
              className="bean-shelf"
              ref={shelfRef}
              role="list"
              aria-label="Available coffee beans"
              onPointerDown={startShelfDrag}
              onPointerMove={moveShelfDrag}
              onPointerUp={endShelfDrag}
              onPointerCancel={endShelfDrag}
            >
              {BEANS.map((bean, index) => (
                <article
                  className={`bean-card ${activeBean === index ? 'is-active' : ''}`}
                  key={bean.id}
                  data-bean={bean.id}
                  role="listitem"
                  style={{ '--card-color': bean.color, '--index': index }}
                  onPointerEnter={() => setActiveBean(index)}
                  onFocus={() => setActiveBean(index)}
                >
                  <button className="bean-select" type="button" onClick={() => setActiveBean(index)} aria-pressed={activeBean === index}>
                    <span className="bean-code">{bean.code}</span>
                    <span className="bean-name">{bean.name}</span>
                    <span className="bean-notes">{bean.notes}</span>
                    <span className="bean-meta">{bean.roast} roast / 250g</span>
                  </button>
                  <div className="bean-buy">
                    <span className="bean-price">${bean.price}</span>
                    <button type="button" onClick={() => addToCart(bean)}>Add to cart <Arrow /></button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="brew-section" id="brew-guide">
          <div className="brew-image" data-reveal>
            <img src="/assets/brew.jpg" alt="A careful pour-over brew falling into a clear glass server" width="1600" height="1067" loading="lazy" />
            <div className="brew-image-index"><span>18g</span><span>300ml</span><span>95°C</span></div>
          </div>
          <div className="brew-copy section-pad" data-reveal>
            <div className="section-heading compact">
              <h2>Four moves.<br />One clear cup.</h2>
              <p>Brew guide: pour over in four steps</p>
            </div>
            <ol className="brew-steps">
              {STEPS.map((step, index) => (
                <li key={step.n} className={activeStep === index ? 'is-active' : ''}>
                  <button type="button" onClick={() => setActiveStep(index)} aria-current={activeStep === index ? 'step' : undefined}>
                    <span>{String(step.n).padStart(2, '0')}</span>
                    <strong>{step.title}</strong>
                    <Arrow />
                  </button>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="freshness" id="freshness" ref={freshnessRef}>
          <div className="freshness-sticky">
            <div className="freshness-heading">
              <p>Roast clock / 06:40 to 07:02</p>
              <h2>Freshness has<br />a shape.</h2>
            </div>
            <div className="roast-contact" aria-label={`Roast stage ${roastFrame + 1} of 3`}>
              {[0, 1, 2].map((frame) => (
                <div className={`roast-frame frame-${frame} ${roastFrame === frame ? 'is-active' : ''}`} key={frame} aria-hidden={roastFrame !== frame}>
                  <img src="/assets/roaster.jpg" alt={frame === 0 ? 'Industrial coffee beans entering the roast process' : ''} width="1800" height="1200" loading="lazy" />
                </div>
              ))}
              <div className="frame-labels" aria-hidden="true"><span>Charge</span><span>First crack</span><span>Cool</span></div>
            </div>
            <div className="roast-field-wrap" aria-hidden="true">
              <Suspense fallback={<div className="roast-field-fallback" />}>
                <RoastField progress={roastProgress} />
              </Suspense>
            </div>
            <div className="freshness-progress" aria-hidden="true"><span style={{ transform: `scaleX(${Math.max(0.02, roastProgress)})` }} /></div>
            <p className="freshness-note">Scroll controls the batch. Every frame is one step closer to the bag.</p>
          </div>
        </section>

        <section className="reviews-section section-pad" id="reviews" onKeyDown={handleReviewKey} tabIndex="0" aria-label="Subscriber reviews">
          <div className="review-count" aria-hidden="true">0{reviewIndex + 1} / 03</div>
          <blockquote className="review-quote" key={REVIEWS[reviewIndex].name}>
            <p>“{REVIEWS[reviewIndex].quote}”</p>
            <footer><strong>{REVIEWS[reviewIndex].name}</strong><span>{REVIEWS[reviewIndex].role}</span></footer>
          </blockquote>
          <div className="review-controls">
            <button type="button" aria-label="Previous review" onClick={() => moveReview(-1)}><Arrow direction="left" /></button>
            <button type="button" aria-label="Next review" onClick={() => moveReview(1)}><Arrow /></button>
          </div>
          <div className="all-reviews" aria-hidden="true">
            {REVIEWS.map((review) => <span key={review.name}>{review.name}: {review.quote}</span>)}
          </div>
        </section>

        <section className="subscribe-section" id="subscribe">
          <div className="subscribe-visual" data-reveal>
            <div className="subscription-stamp">2 × 250g / Monthly</div>
            <img src="/assets/northwind-bag.webp" alt="A raincoat-yellow Northwind subscription coffee bag" width="1024" height="1536" loading="lazy" />
          </div>
          <div className="subscribe-copy section-pad" data-reveal>
            <h2>The month,<br />bagged.</h2>
            <p>The Northwind subscription</p>
            <p>Two 250g bags of our current favourites, every month, free shipping, pause any time. $29/month.</p>
            <a className="button button-dark magnetic" href="#contact">Start a subscription <Arrow /></a>
          </div>
        </section>

        <section className="contact-section section-pad" id="contact">
          <div className="contact-heading" data-reveal>
            <p>Questions / Wholesale / Coffee talk</p>
            <h2>Send a note<br />before noon.</h2>
          </div>
          <div className="contact-panel" data-reveal>
            {sent ? (
              <div className="form-success" role="status">
                <span aria-hidden="true">✓</span>
                <h3>Message received.</h3>
                <p>Thanks. We read everything and reply within a day.</p>
                <button className="text-link" type="button" onClick={() => setSent(false)}>Send another</button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit} noValidate>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? 'email-error' : undefined}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      if (emailError) setEmailError('')
                    }}
                  />
                  {emailError && <p className="field-error" id="email-error">{emailError}</p>}
                </div>
                <div className="field">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    placeholder="Questions, wholesale, or just coffee talk"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                  />
                </div>
                <button type="submit" className="button button-yellow" disabled={submitting} aria-busy={submitting}>
                  <span>{submitting ? 'Sending' : 'Send message'}</span><Arrow />
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="site-footer" id="site-footer">
        <a className="footer-logo" href="#hero">Northwind<br />Coffee Roasters</a>
        <div className="footer-address"><p>Sandviksveien 12</p><p>5036 Bergen, Norway</p><p>hello@northwind.coffee</p></div>
        <div className="footer-links">
          <a href="#hero">Top</a>
          <a href="/shipping" onClick={(event) => openPolicy(event, 'shipping')}>Shipping</a>
          <a href="/returns" onClick={(event) => openPolicy(event, 'returns')}>Returns</a>
          <a href="/privacy" onClick={(event) => openPolicy(event, 'privacy')}>Privacy</a>
        </div>
        <p className="copyright">© 2026 Northwind Coffee Roasters</p>
      </footer>

      {cartMessage && <div className="cart-toast" role="status">{cartMessage}</div>}

      {policy && (
        <div className="policy-overlay" ref={policyRef} role="dialog" aria-modal="true" aria-labelledby="policy-title">
          <button className="policy-backdrop" type="button" aria-label="Close policy" onClick={() => setPolicy(null)} />
          <div className="policy-panel">
            <button className="policy-close" type="button" onClick={() => setPolicy(null)}>Close</button>
            <h2 id="policy-title">{POLICIES[policy][0]}</h2>
            <p>{POLICIES[policy][1]}</p>
          </div>
        </div>
      )}
    </div>
  )
}
