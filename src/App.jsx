import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
const HeroScene = lazy(() => import('./HeroScene.jsx'))

const BEANS = [
  { id: 'ethiopia', short: 'Yirgacheffe', name: 'Ethiopia Yirgacheffe', notes: 'Jasmine, lemon zest, honey', roast: 'Light', price: 18, acid: 92, color: '#e8b764' },
  { id: 'kenya', short: 'Nyeri', name: 'Kenya AA Nyeri', notes: 'Blackcurrant, tomato, brown sugar', roast: 'Light', price: 19, acid: 84, color: '#b4543f' },
  { id: 'colombia', short: 'Huila', name: 'Colombia Huila', notes: 'Caramel, red apple, cocoa', roast: 'Medium', price: 16, acid: 66, color: '#ca6f45' },
  { id: 'guatemala', short: 'Antigua', name: 'Guatemala Antigua', notes: 'Milk chocolate, orange, almond', roast: 'Medium', price: 16, acid: 52, color: '#d39953' },
  { id: 'decaf', short: 'Decaf', name: 'Swiss Water Decaf Blend', notes: 'Toffee, hazelnut, smooth', roast: 'Medium', price: 15, acid: 38, color: '#8f704a' },
  { id: 'sumatra', short: 'Mandheling', name: 'Sumatra Mandheling', notes: 'Dark chocolate, cedar, earth', roast: 'Dark', price: 17, acid: 22, color: '#564036' },
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

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>
}

export default function App() {
  const root = useRef()
  const pointer = useRef({ x: 0, y: 0 })
  const menuButton = useRef()
  const [activeBean, setActiveBean] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartMessage, setCartMessage] = useState('')
  const [activeStep, setActiveStep] = useState(0)
  const [activeReview, setActiveReview] = useState(0)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [formError, setFormError] = useState('')
  const [reducedMotion, setReducedMotion] = useState(false)
  const [heroActive, setHeroActive] = useState(true)
  const [activeSection, setActiveSection] = useState('hero')

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const hero = document.getElementById('hero')
    if (!hero) return undefined
    let visible = true
    const sync = () => setHeroActive(visible && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      sync()
    }, { rootMargin: '12% 0px' })
    observer.observe(hero)
    document.addEventListener('visibilitychange', sync)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('main > section[id]'))
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible?.target.id) setActiveSection(visible.target.id)
    }, { rootMargin: '-28% 0px -58%', threshold: [0, 0.2, 0.5] })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('menu-is-open', menuOpen)
    if (!menuOpen) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        requestAnimationFrame(() => menuButton.current?.focus())
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  useLayoutEffect(() => {
    if (reducedMotion) return undefined
    const context = gsap.context(() => {
      gsap.fromTo('.hero-kicker, .hero-title .line, .hero-copy, .hero-actions', {
        yPercent: 32,
        opacity: 0,
      }, {
        yPercent: 0,
        opacity: 1,
        duration: 1.05,
        stagger: 0.1,
        ease: 'power3.out',
      })

      gsap.timeline({
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
        },
      })
        .to('.hero-title', { letterSpacing: '-0.065em', yPercent: -8 }, 0)
        .to('.hero-visual', { yPercent: 17, scale: 0.92 }, 0)
        .to('.current-path', { strokeDashoffset: 0, ease: 'none' }, 0)
        .to('.current-orb', { offsetDistance: '100%', ease: 'none' }, 0)

      gsap.fromTo('.ledger-line', { scaleX: 0 }, {
        scaleX: 1,
        transformOrigin: 'left center',
        ease: 'none',
        scrollTrigger: {
          trigger: '.story',
          start: 'top 78%',
          end: 'center 42%',
          scrub: 0.5,
        },
      })

      gsap.fromTo('.spectrum-track', { '--track-progress': 0 }, {
        '--track-progress': 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.beans',
          start: 'top 75%',
          end: 'top 25%',
          scrub: 0.5,
        },
      })

      gsap.utils.toArray('.brew-step').forEach((step, index) => {
        ScrollTrigger.create({
          trigger: step,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => setActiveStep(index),
          onEnterBack: () => setActiveStep(index),
        })
      })

      gsap.fromTo('.brew-stream-path', { strokeDashoffset: 1 }, {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '.brew-guide',
          start: 'top 65%',
          end: 'bottom 65%',
          scrub: 0.4,
        },
      })

      gsap.fromTo('.subscription-seal', { rotate: -18, scale: 0.72 }, {
        rotate: 0,
        scale: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.subscribe-section',
          start: 'top 75%',
          end: 'center 52%',
          scrub: 0.35,
        },
      })
    }, root)
    return () => context.revert()
  }, [reducedMotion])

  const active = BEANS[activeBean]

  function moveBean(direction) {
    setActiveBean((current) => (current + direction + BEANS.length) % BEANS.length)
  }

  function addToCart(bean) {
    setCartMessage(`${bean.name} added to your cart.`)
    window.setTimeout(() => setCartMessage(''), 3200)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!email || !email.includes('@')) {
      setFormError('Enter a valid email address.')
      document.getElementById('email')?.focus()
      return
    }
    setFormError('')
    setIsSending(true)
    await new Promise((resolve) => window.setTimeout(resolve, 650))
    setIsSending(false)
    setSent(true)
    setEmail('')
    setMessage('')
  }

  return (
    <div className="site-shell" ref={root}>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <a className="brand" href="#hero" aria-label="Northwind Coffee Roasters, home">
          <span className="brand-mark">N</span>
          <span>Northwind<br />Coffee Roasters</span>
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a className={activeSection === 'story' ? 'is-current' : ''} aria-current={activeSection === 'story' ? 'location' : undefined} href="#story">Our story</a>
          <a className={activeSection === 'beans' ? 'is-current' : ''} aria-current={activeSection === 'beans' ? 'location' : undefined} href="#beans">Beans</a>
          <a className={activeSection === 'brew-guide' ? 'is-current' : ''} aria-current={activeSection === 'brew-guide' ? 'location' : undefined} href="#brew-guide">Brew guide</a>
          <a className={activeSection === 'reviews' ? 'is-current' : ''} aria-current={activeSection === 'reviews' ? 'location' : undefined} href="#reviews">Reviews</a>
          <a className={`nav-cta ${activeSection === 'subscribe' ? 'is-current' : ''}`} aria-current={activeSection === 'subscribe' ? 'location' : undefined} href="#subscribe">Subscribe <ArrowIcon /></a>
        </nav>
        <button
          ref={menuButton}
          className="menu-button"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span>{menuOpen ? 'Close' : 'Menu'}</span>
          <span className="menu-glyph" aria-hidden="true">{menuOpen ? '×' : '＋'}</span>
        </button>
      </header>

      <div className={`mobile-menu ${menuOpen ? 'is-open' : ''}`} id="mobile-menu" aria-hidden={!menuOpen}>
        <button className="menu-backdrop" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
        <nav aria-label="Mobile navigation">
          {['story', 'beans', 'brew-guide', 'reviews', 'subscribe', 'contact'].map((id, index) => (
            <a key={id} className={activeSection === id ? 'is-current' : ''} aria-current={activeSection === id ? 'location' : undefined} href={`#${id}`} onClick={() => setMenuOpen(false)}>
              <span>0{index + 1}</span>{id.replace('-', ' ')}
            </a>
          ))}
        </nav>
      </div>

      <main id="main">
        <section
          className="hero"
          id="hero"
          onPointerMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect()
            pointer.current = {
              x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
              y: ((event.clientY - rect.top) / rect.height) * 2 - 1,
            }
          }}
          onPointerLeave={() => { pointer.current = { x: 0, y: 0 } }}
        >
          <svg className="current-map" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">
            <path className="current-path" pathLength="1" d="M-40 590 C 170 500, 210 710, 430 600 S 730 410, 830 510 S 1050 680, 1500 340" />
          </svg>
          <span className="current-orb" aria-hidden="true" />
          <div className="hero-copy-block">
            <p className="hero-kicker"><span>Roasted in Bergen</span><span>Shipped within 24 hours</span></p>
            <h1 className="hero-title">
              <span className="line">Small batch.</span>
              <span className="line title-offset">North wind.</span>
              <span className="line title-accent">Wide awake.</span>
            </h1>
            <p className="hero-copy">
              We roast single-origin coffee in 12kg batches on a 1962 Probat,
              then ship it within hours. Freshness is not a slogan. It is a timestamp.
            </p>
            <div className="hero-actions">
              <a className="button button-dark" href="#beans">Shop this month <ArrowIcon /></a>
              <a className="text-link" href="#story">Trace the roast <span aria-hidden="true">↓</span></a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-halo" aria-hidden="true" />
            <Suspense fallback={<div className="scene-poster" aria-hidden="true" />}>
              <HeroScene pointer={pointer} reducedMotion={reducedMotion} active={heroActive} />
            </Suspense>
            <p className="scene-hint">Move to change the light</p>
            <div className="roast-stamp" aria-hidden="true">
              <span>Roasted</span><strong>06:40</strong><span>16 · 07 · 26</span>
            </div>
          </div>
          <div className="hero-index" aria-hidden="true">
            <span>61.0000° N</span><span>05.3333° E</span><span>Batch 07/26</span>
          </div>
        </section>

        <section className="story" id="story">
          <div className="section-number">01 / The ledger</div>
          <div className="story-intro">
            <p className="eyebrow">Small by design</p>
            <h2>One machine.<br />Eleven farms.<br /><em>No shortcuts.</em></h2>
          </div>
          <div className="story-body">
            <p>
              Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still
              small on purpose: two roasters, one machine, and direct relationships with eleven farms
              across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra.
            </p>
            <p>
              We pay on average 2.4× the commodity price and publish every contract.
              The line below is our promise made visible—from producer to Tuesday roast to Thursday cup.
            </p>
          </div>
          <div className="ledger" aria-label="Northwind sourcing and freshness facts">
            <div className="ledger-line" />
            {[
              ['11', 'partner farms', 'Origin'],
              ['2.4×', 'commodity price paid', 'Fairness'],
              ['12kg', 'maximum batch', 'Control'],
              ['<24h', 'roast to shipment', 'Freshness'],
            ].map(([value, label, meta]) => (
              <div className="ledger-point" key={label}>
                <span className="ledger-dot" />
                <small>{meta}</small>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="beans" id="beans">
          <div className="section-number light">02 / Current selection</div>
          <div className="beans-heading">
            <div>
              <p className="eyebrow">Six origins · one spectrum</p>
              <h2>Find your<br /><em>frequency.</em></h2>
            </div>
            <p>Move from bright florals to deep chocolate. Every coffee was roasted this week in Bergen.</p>
          </div>

          <div className="spectrum-shell" onKeyDown={(event) => {
            if (event.key === 'ArrowRight') moveBean(1)
            if (event.key === 'ArrowLeft') moveBean(-1)
          }}>
            <div className="spectrum-labels" aria-hidden="true"><span>Bright / floral</span><span>Deep / resonant</span></div>
            <div className="spectrum-track" role="listbox" aria-label="Choose a coffee">
              <div className="spectrum-axis" />
              {BEANS.map((bean, index) => {
                const offset = index - activeBean
                return (
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === activeBean}
                    className={`bean-node ${index === activeBean ? 'is-active' : ''}`}
                    style={{
                      '--bean-color': bean.color,
                      '--offset': offset,
                      '--acid': bean.acid,
                    }}
                    key={bean.id}
                    onClick={() => setActiveBean(index)}
                  >
                    <span className="bean-packet" aria-hidden="true">
                      <span className="packet-seal">N</span>
                      <span className="packet-name">{bean.short}</span>
                    </span>
                    <span className="node-label">{bean.short}</span>
                  </button>
                )
              })}
            </div>
            <div className="spectrum-controls">
              <button type="button" onClick={() => moveBean(-1)} aria-label="Previous coffee">←</button>
              <span>{String(activeBean + 1).padStart(2, '0')} / {String(BEANS.length).padStart(2, '0')}</span>
              <button type="button" onClick={() => moveBean(1)} aria-label="Next coffee">→</button>
            </div>
          </div>

          <article className="bean-dossier" aria-live="polite">
            <div className="dossier-origin">
              <span>Selected origin</span>
              <strong>{active.name}</strong>
            </div>
            <div>
              <span>Tasting notes</span>
              <p>{active.notes}</p>
            </div>
            <div>
              <span>Roast</span>
              <p>{active.roast} · 250g</p>
            </div>
            <div className="dossier-buy">
              <strong>${active.price}</strong>
              <button className="button button-copper" type="button" onClick={() => addToCart(active)}>
                Add to cart <span aria-hidden="true">＋</span>
              </button>
            </div>
          </article>
        </section>

        <section className="brew-guide" id="brew-guide">
          <div className="brew-visual">
            <div className="brew-media">
              <img src="/assets/pour-over.webp" alt="Hot water being poured through a V60 coffee dripper" loading="lazy" />
              <div className={`brew-state state-${activeStep}`} aria-hidden="true" />
              <svg viewBox="0 0 500 720" preserveAspectRatio="none" aria-hidden="true">
                <path className="brew-stream-path" pathLength="1" d="M342 -30 C 338 135 290 220 315 334 C 340 450 210 464 235 585 C 246 641 302 668 410 730" />
              </svg>
              <div className="brew-readout" aria-hidden="true">
                <span>{['18.0g', '650μm', '00:30', '03:00'][activeStep]}</span>
                <small>{['dose', 'grind', 'bloom', 'total'][activeStep]}</small>
              </div>
            </div>
          </div>
          <div className="brew-content">
            <div className="section-number">03 / The ritual</div>
            <div className="brew-title">
              <p className="eyebrow">One current · four states</p>
              <h2>Make the<br /><em>morning count.</em></h2>
            </div>
            <ol className="brew-steps">
              {STEPS.map((step, index) => (
                <li className={`brew-step ${activeStep === index ? 'is-active' : ''}`} key={step.n}>
                  <button type="button" onClick={() => setActiveStep(index)} aria-current={activeStep === index ? 'step' : undefined}>
                    <span>0{step.n}</span><h3>{step.title}</h3><span className="step-arrow">↘</span>
                  </button>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="reviews-section" id="reviews">
          <div className="reviews-image">
            <img src="/assets/beans-roasting.webp" alt="Freshly roasted coffee beans cooling in a roasting machine" loading="lazy" />
            <span className="image-caption">Tuesday roast · cooling tray 02</span>
          </div>
          <div className="reviews-copy">
            <div className="section-number">04 / Dispatches</div>
            <p className="eyebrow">Notes from the kitchen counter</p>
            <div className="review-stage" aria-live="polite">
              <span className="quote-mark" aria-hidden="true">“</span>
              <blockquote>
                <p>{REVIEWS[activeReview].quote}</p>
                <footer><strong>{REVIEWS[activeReview].name}</strong> — {REVIEWS[activeReview].role}</footer>
              </blockquote>
            </div>
            <div className="review-controls">
              <button type="button" aria-label="Previous review" onClick={() => setActiveReview((activeReview - 1 + REVIEWS.length) % REVIEWS.length)}>←</button>
              <span>{String(activeReview + 1).padStart(2, '0')} / 0{REVIEWS.length}</span>
              <button type="button" aria-label="Next review" onClick={() => setActiveReview((activeReview + 1) % REVIEWS.length)}>→</button>
            </div>
          </div>
        </section>

        <section className="subscribe-section" id="subscribe">
          <div className="subscription-seal" aria-hidden="true">
            <span>Northwind</span>
            <strong>02</strong>
            <span>bags / month</span>
          </div>
          <div className="subscribe-copy">
            <p className="eyebrow">05 / Recurring roast</p>
            <h2>Fresh coffee,<br /><em>on your current.</em></h2>
            <p>Two 250g bags of our current favourites, every month, free shipping, pause any time. $29/month.</p>
            <a className="button button-dark" href="#contact">Start a subscription <ArrowIcon /></a>
          </div>
          <div className="subscribe-bag" aria-hidden="true">
            <img src="/assets/northwind-bag.webp" alt="" />
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div>
            <p className="eyebrow">06 / Get in touch</p>
            <h2>Questions,<br />wholesale,<br /><em>coffee talk.</em></h2>
          </div>
          {sent ? (
            <p className="form-success" role="status">Thanks—we read everything and reply within a day.</p>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" value={email} aria-describedby={formError ? 'email-error' : undefined} aria-invalid={Boolean(formError)} onChange={(event) => setEmail(event.target.value)} />
              {formError && <p className="field-error" id="email-error">{formError}</p>}
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" rows={5} value={message} onChange={(event) => setMessage(event.target.value)} />
              <button className="button button-dark" type="submit" disabled={isSending}>
                {isSending ? 'Sending…' : 'Send message'} <ArrowIcon />
              </button>
            </form>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#hero"><span className="brand-mark">N</span><span>Northwind<br />Coffee Roasters</span></a>
        <p>© 2026 Northwind Coffee Roasters<br />Bergen, Norway</p>
        <div><a href="#hero">Top</a><a href="#contact">Contact</a><span>Shipping · Returns · Privacy</span></div>
      </footer>

      <div className={`cart-toast ${cartMessage ? 'is-visible' : ''}`} role="status" aria-live="polite">{cartMessage}</div>
    </div>
  )
}
