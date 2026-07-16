import { useEffect, useRef, useState } from 'react'

const BEANS = [
  { id: 'ethiopia', name: 'Ethiopia Yirgacheffe', notes: 'Jasmine, lemon zest, honey', roast: 'Light', price: 18, code: 'ET-01' },
  { id: 'colombia', name: 'Colombia Huila', notes: 'Caramel, red apple, cocoa', roast: 'Medium', price: 16, code: 'CO-02' },
  { id: 'sumatra', name: 'Sumatra Mandheling', notes: 'Dark chocolate, cedar, earth', roast: 'Dark', price: 17, code: 'SU-03' },
  { id: 'kenya', name: 'Kenya AA Nyeri', notes: 'Blackcurrant, tomato, brown sugar', roast: 'Light', price: 19, code: 'KE-04' },
  { id: 'guatemala', name: 'Guatemala Antigua', notes: 'Milk chocolate, orange, almond', roast: 'Medium', price: 16, code: 'GU-05' },
  { id: 'decaf', name: 'Swiss Water Decaf Blend', notes: 'Toffee, hazelnut, smooth', roast: 'Medium', price: 15, code: 'DC-06' },
]

const STEPS = [
  { n: 1, title: 'Weigh', body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.', mark: '18G' },
  { n: 2, title: 'Grind', body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.', mark: 'M-F' },
  { n: 3, title: 'Bloom', body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.', mark: '00:30' },
  { n: 4, title: 'Pour', body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.', mark: '02:30' },
]

const REVIEWS = [
  { quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.', name: 'Maya T.', role: 'Subscriber since 2022' },
  { quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.', name: 'Daniel R.', role: 'Home barista' },
  { quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.', name: 'Priya S.', role: 'Gift subscriber' },
]

const NAV_LINKS = [
  ['Beans', '#beans'],
  ['Brew Guide', '#brew-guide'],
  ['Reviews', '#reviews'],
  ['Subscribe', '#subscribe'],
  ['Contact', '#contact'],
]

const POLICIES = {
  '/shipping': ['Shipping', 'Orders roasted before noon leave Bergen the same working day. Delivery times vary by destination.'],
  '/returns': ['Returns', 'Coffee is perishable. If a bag arrives damaged or incorrect, write to us and we will replace it.'],
  '/privacy': ['Privacy', 'We use your contact details only to answer your message or manage an order you request.'],
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

function SiteNav({ activeSection }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    const focusable = [...menuRef.current.querySelectorAll('a, button')]
    focusable[0]?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
      if (event.key !== 'Tab' || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey)
      triggerRef.current?.focus()
    }
  }, [open])

  const closeAndNavigate = () => setOpen(false)

  return (
    <nav className="site-nav" id="site-nav" aria-label="Primary navigation">
      <a className="brand" href="#hero" aria-label="Northwind Coffee Roasters, home">
        <span className="brand-mark" aria-hidden="true">NW</span>
        <span>Northwind <b>Coffee Roasters</b></span>
      </a>
      <div className="nav-links desktop-nav">
        {NAV_LINKS.map(([label, href]) => (
          <a key={href} href={href} aria-current={activeSection === href.slice(1) ? 'location' : undefined}>{label}</a>
        ))}
      </div>
      <a className="nav-shop desktop-nav" href="#beans">Shop beans</a>
      <button ref={triggerRef} className="menu-trigger" type="button" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((value) => !value)}>
        <span>{open ? 'Close' : 'Menu'}</span><span aria-hidden="true">{open ? '×' : '+'}</span>
      </button>
      <div className={`mobile-menu ${open ? 'is-open' : ''}`} id="mobile-menu" ref={menuRef} aria-hidden={!open}>
        <button className="menu-scrim" type="button" aria-label="Close menu" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)} />
        <div className="menu-panel">
          <p className="instrument-label">Bergen chapter index</p>
          {NAV_LINKS.map(([label, href], index) => (
            <a key={href} href={href} tabIndex={open ? 0 : -1} onClick={closeAndNavigate}>
              <span>{String(index + 1).padStart(2, '0')}</span>{label}
            </a>
          ))}
          <p className="menu-address">Roasted in Bergen, Norway<br />Shipped within 24 hours</p>
        </div>
      </div>
    </nav>
  )
}

function OrbitStage() {
  const reduced = useReducedMotion()
  const discRef = useRef(null)
  const frameRef = useRef(0)
  const stateRef = useRef({ angle: -8, velocity: 0, dragging: false, lastX: 0, lastTime: 0 })
  const [angle, setAngle] = useState(-8)
  const [state, setState] = useState('rest')

  const paint = (nextAngle, nextState) => {
    stateRef.current.angle = nextAngle
    setAngle(nextAngle)
    setState(nextState)
  }

  const settle = () => {
    const data = stateRef.current
    if (reduced) {
      paint(Math.round(data.angle / 45) * 45, 'rest')
      return
    }
    data.angle += data.velocity
    data.velocity *= 0.92
    if (Math.abs(data.velocity) < 0.08) {
      const target = Math.round(data.angle / 45) * 45
      data.angle += (target - data.angle) * 0.18
      if (Math.abs(target - data.angle) < 0.12) {
        paint(target, 'rest')
        return
      }
    }
    paint(data.angle, 'settling')
    frameRef.current = requestAnimationFrame(settle)
  }

  useEffect(() => () => cancelAnimationFrame(frameRef.current), [])

  const onPointerDown = (event) => {
    if (reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    cancelAnimationFrame(frameRef.current)
    const data = stateRef.current
    data.dragging = true
    data.lastX = event.clientX
    data.lastTime = performance.now()
    data.velocity = 0
    event.currentTarget.setPointerCapture(event.pointerId)
    setState('dragging')
  }

  const onPointerMove = (event) => {
    const data = stateRef.current
    if (!data.dragging) return
    const now = performance.now()
    const dx = event.clientX - data.lastX
    const elapsed = Math.max(16, now - data.lastTime)
    data.angle += dx * 0.36
    data.velocity = (dx * 0.36) / (elapsed / 16)
    data.lastX = event.clientX
    data.lastTime = now
    paint(data.angle, 'dragging')
  }

  const onPointerUp = () => {
    if (!stateRef.current.dragging) return
    stateRef.current.dragging = false
    settle()
  }

  const rotate = (direction) => {
    cancelAnimationFrame(frameRef.current)
    stateRef.current.velocity = 0
    paint(Math.round(stateRef.current.angle / 45) * 45 + direction * 45, 'rest')
  }

  const normalized = Math.round((angle % 360 + 360) % 360)

  return (
    <div className="orbit-wrap" data-dreative-id="orbit-stage">
      <div className="orbit-rail" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => <i key={index} style={{ '--mark': index }} />)}
      </div>
      <div
        ref={discRef}
        className="orbit-disc"
        data-orbit-state={state}
        role="slider"
        tabIndex="0"
        aria-label="Rotate the Probat cooling tray"
        aria-valuemin="0"
        aria-valuemax="359"
        aria-valuenow={normalized}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') { event.preventDefault(); rotate(-1) }
          if (event.key === 'ArrowRight') { event.preventDefault(); rotate(1) }
        }}
        style={{ '--angle': `${angle}deg` }}
      >
        <img src="/assets/northwind-cooling-tray.png" alt="Vintage Probat cooling tray filled with freshly roasted coffee beans" width="1536" height="1024" />
        <span className="orbit-glass" aria-hidden="true" />
        <span className="orbit-label" aria-hidden="true"><b>12 KG</b><em>Batch 0714</em></span>
      </div>
      <div className="orbit-controls">
        <button type="button" onClick={() => rotate(-1)} aria-label="Rotate tray counterclockwise">−45</button>
        <output aria-live="polite">{state} {String(normalized).padStart(3, '0')}°</output>
        <button type="button" onClick={() => rotate(1)} aria-label="Rotate tray clockwise">+45</button>
      </div>
    </div>
  )
}

function Story() {
  const facts = [
    ['11', 'partner farms'],
    ['2.4×', 'commodity price paid'],
    ['12kg', 'max batch size'],
    ['<24h', 'roast to shipment'],
  ]
  return (
    <section className="story section-shell" id="story" data-dreative-id="story-ledger">
      <div className="story-media">
        <img src="/assets/northwind-roaster.png" alt="A Northwind roaster checks a sample from a vintage Probat machine" width="1122" height="1402" loading="lazy" />
        <span className="media-stamp">Bergen, 60.392° N</span>
      </div>
      <div className="story-copy">
        <p className="instrument-label">Small on purpose since 2014</p>
        <h2>The machine is old. The coffee is not.</h2>
        <p>Northwind started in a fishing shed. We are still two roasters, one machine, and direct partners with eleven farms across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra.</p>
        <div className="proof-ledger" aria-label="Northwind sourcing and freshness facts">
          {facts.map(([value, label], index) => (
            <div className="proof-row" key={label} tabIndex="0">
              <span>{String(index + 1).padStart(2, '0')}</span><strong>{value}</strong><p>{label}</p>
            </div>
          ))}
        </div>
        <p className="story-note">We pay on average 2.4× the commodity price and publish every contract.</p>
      </div>
    </section>
  )
}

function BeanRail() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [cartMessage, setCartMessage] = useState('')
  const active = BEANS[activeIndex]

  const select = (index) => {
    setActiveIndex((index + BEANS.length) % BEANS.length)
    setCartMessage('')
  }

  const handleAddToCart = (bean) => {
    setCartMessage(`${bean.name} added to cart`)
  }

  return (
    <section className="beans" id="beans" data-dreative-id="bean-rail" data-active-bean={active.id} onKeyDown={(event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); select(activeIndex - 1) }
      if (event.key === 'ArrowRight') { event.preventDefault(); select(activeIndex + 1) }
    }}>
      <header className="beans-header section-shell">
        <p className="instrument-label">Current roast specimens</p>
        <h2>This month, six clear choices.</h2>
        <p>Choose by taste, not by packaging. Every bag is 250g and roasted within hours of dispatch.</p>
      </header>
      <div className="bean-stage section-shell">
        <div className="active-bean" aria-live="polite">
          <span className="bean-code">{active.code}</span>
          <p className="bean-roast">{active.roast} roast</p>
          <h3>{active.name}</h3>
          <p className="bean-flavor">{active.notes}</p>
          <div className="bean-purchase">
            <p><strong>${active.price}</strong><span>250g</span></p>
            <button type="button" onClick={() => handleAddToCart(active)}>Add to cart</button>
          </div>
          <div className="flavor-lines" aria-hidden="true"><i /><i /><i /></div>
        </div>
        <div className="bean-index" role="list" aria-label="Coffee selection">
          {BEANS.map((bean, index) => (
            <article key={bean.id} data-bean={bean.id} role="listitem" className={index === activeIndex ? 'is-active' : ''}>
              <button type="button" aria-pressed={index === activeIndex} onClick={() => select(index)}>
                <span>{bean.code}</span><b>{bean.name}</b><em>${bean.price}</em>
              </button>
            </article>
          ))}
        </div>
      </div>
      <p className="cart-status section-shell" role="status">{cartMessage || 'Select a roast specimen to inspect it.'}</p>
    </section>
  )
}

function BrewGuide() {
  const [active, setActive] = useState(0)
  const step = STEPS[active]
  return (
    <section className="brew section-shell" id="brew-guide" data-dreative-id="brew-dial" onKeyDown={(event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); setActive((active - 1 + STEPS.length) % STEPS.length) }
      if (event.key === 'ArrowRight') { event.preventDefault(); setActive((active + 1) % STEPS.length) }
    }}>
      <header className="brew-heading">
        <p className="instrument-label">One reliable method</p>
        <h2>Pour over, without the folklore.</h2>
      </header>
      <div className="brew-media">
        <img src="/assets/northwind-brew-lab.png" alt="A precise pour-over brew on a brushed steel roastery workbench" width="1586" height="1024" loading="lazy" />
        <ol className="brew-controls" aria-label="Brew steps">
          {STEPS.map((item, index) => (
            <li key={item.n}>
              <button type="button" aria-current={index === active ? 'step' : undefined} onClick={() => setActive(index)}>
                <span>{String(item.n).padStart(2, '0')}</span><b>{item.title}</b>
              </button>
            </li>
          ))}
        </ol>
        <div className="brew-instruction" aria-live="polite">
          <span>{step.mark}</span>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
        </div>
      </div>
      <ol className="brew-fallback sr-only">
        {STEPS.map((item) => <li key={item.n}>{item.title}: {item.body}</li>)}
      </ol>
    </section>
  )
}

function Voices() {
  const [index, setIndex] = useState(0)
  const review = REVIEWS[index]
  const move = (direction) => setIndex((index + direction + REVIEWS.length) % REVIEWS.length)
  return (
    <section className="voices" id="reviews" data-dreative-id="voices-reel">
      <div className="section-shell quote-stage">
        <p className="instrument-label">Subscriber field notes</p>
        <div className="quote-counter"><span>{String(index + 1).padStart(2, '0')}</span> / 03</div>
        <blockquote key={review.name}>
          <p>“{review.quote}”</p>
          <footer><strong>{review.name}</strong><span>{review.role}</span></footer>
        </blockquote>
        <div className="quote-controls">
          <button type="button" onClick={() => move(-1)} aria-label="Previous review">Previous</button>
          <button type="button" onClick={() => move(1)} aria-label="Next review">Next</button>
        </div>
        <div className="sr-only" aria-hidden="true">
          {REVIEWS.map((item) => <p key={item.name}>{item.quote} {item.name}, {item.role}</p>)}
        </div>
      </div>
      <div className="subscribe" id="subscribe" data-dreative-id="subscription-seal">
        <div className="subscribe-ring" aria-hidden="true"><span>MONTHLY</span><i /></div>
        <div className="subscribe-copy">
          <p className="instrument-label">The Northwind subscription</p>
          <h2>Two fresh bags. Every month.</h2>
          <p>Two 250g bags of our current favourites, every month, free shipping, pause any time.</p>
        </div>
        <div className="subscribe-price"><strong>$29</strong><span>per month</span></div>
        <a href="#contact">Start a subscription</a>
      </div>
    </section>
  )
}

function Contact() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [policy, setPolicy] = useState(null)
  const emailRef = useRef(null)
  const policyCloseRef = useRef(null)
  const policyTriggerRef = useRef(null)

  useEffect(() => {
    if (!policy) return undefined
    policyCloseRef.current?.focus()
    const drawer = policyCloseRef.current?.closest('[role="dialog"]')
    const focusable = [...(drawer?.querySelectorAll('button, a') || [])]
    const onKey = (event) => {
      if (event.key === 'Escape') setPolicy(null)
      if (event.key !== 'Tab' || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      policyTriggerRef.current?.focus()
    }
  }, [policy])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.')
      emailRef.current?.focus()
      return
    }
    setError('')
    setSent(true)
    setEmail('')
    setMessage('')
  }

  const openPolicy = (event, path) => {
    event.preventDefault()
    policyTriggerRef.current = event.currentTarget
    setPolicy(path)
  }

  return (
    <section className="contact" id="contact" data-dreative-id="contact-form">
      <div className="contact-inner section-shell">
        <div className="contact-intro">
          <p className="instrument-label">Questions, wholesale, coffee talk</p>
          <h2>Write to the people roasting it.</h2>
          <p>We read everything and reply within a day from Bergen.</p>
        </div>
        <div className={`form-panel ${sent ? 'is-sent' : ''}`}>
          {sent ? (
            <div className="form-success" role="status">
              <span aria-hidden="true">✓</span>
              <h3>Message dispatched.</h3>
              <p>Thanks, we read everything and reply within a day.</p>
              <button type="button" onClick={() => setSent(false)}>Write another</button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label htmlFor="email">Email <span>Required</span></label>
                <input ref={emailRef} id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} aria-invalid={Boolean(error)} aria-describedby={error ? 'email-error' : undefined} onChange={(event) => { setEmail(event.target.value); if (error) setError('') }} />
                {error && <p className="field-error" id="email-error">{error}</p>}
              </div>
              <div className="field">
                <label htmlFor="message">Message <span>Optional</span></label>
                <textarea id="message" name="message" rows="4" placeholder="Questions, wholesale, or just coffee talk" value={message} onChange={(event) => setMessage(event.target.value)} />
              </div>
              <button type="submit" className="submit-button">Send message</button>
            </form>
          )}
        </div>
      </div>
      <footer className="site-footer section-shell" id="site-footer">
        <a className="footer-brand" href="#hero">Northwind Coffee Roasters</a>
        <p>© 2026 Northwind Coffee Roasters, Bergen, Norway</p>
        <div className="footer-links">
          <a href="#hero">Top</a>
          {Object.entries(POLICIES).map(([path, [label]]) => <a href={path} key={path} onClick={(event) => openPolicy(event, path)}>{label}</a>)}
        </div>
      </footer>
      {policy && (
        <div className="policy-drawer" role="dialog" aria-modal="true" aria-labelledby="policy-title">
          <button type="button" className="policy-scrim" aria-label="Close policy" onClick={() => setPolicy(null)} />
          <div className="policy-panel">
            <button ref={policyCloseRef} type="button" className="policy-close" onClick={() => setPolicy(null)}>Close</button>
            <p className="instrument-label">Northwind policy</p>
            <h2 id="policy-title">{POLICIES[policy][0]}</h2>
            <p>{POLICIES[policy][1]}</p>
          </div>
        </div>
      )}
    </section>
  )
}

export default function App() {
  const [activeSection, setActiveSection] = useState('hero')

  useEffect(() => {
    const sections = [...document.querySelectorAll('header[id], section[id]')]
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActiveSection(visible.target.id)
    }, { rootMargin: '-30% 0px -55%', threshold: [0.05, 0.3, 0.6] })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="page">
      <SiteNav activeSection={activeSection} />
      <main>
        <header className="hero" id="hero" data-dreative-id="hero">
          <div className="hero-copy">
            <p className="instrument-label">Roasted 07:14 / ships before noon</p>
            <h1>Roasted now.<br />Ships by noon.</h1>
            <p>Single-origin coffee, roasted in 12kg batches on our 1962 Probat in Bergen.</p>
            <div className="hero-actions">
              <a className="button-primary" href="#beans">Shop the beans</a>
              <a className="text-link" href="#brew-guide">Learn to brew</a>
            </div>
          </div>
          <OrbitStage />
          <div className="hero-facts" aria-label="Roast facts">
            <span><b>12kg</b> maximum batch</span>
            <span><b>&lt;24h</b> roast to shipment</span>
          </div>
        </header>
        <Story />
        <BeanRail />
        <BrewGuide />
        <Voices />
        <Contact />
      </main>
    </div>
  )
}
