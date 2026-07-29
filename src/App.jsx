import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'

gsap.registerPlugin(ScrollTrigger, Flip)

const PROFILES = {
  bright: {
    id: 'bright',
    index: '01',
    label: 'Bright',
    character: 'Floral & lifted',
    beanId: 'ethiopia',
    bean: 'Ethiopia Yirgacheffe',
    brewFocus: 'Bloom',
    brewNote: 'Give the bloom its full 30 seconds before the first slow circle.',
    pairing: 'Ethiopia Yirgacheffe + Kenya AA Nyeri',
  },
  balanced: {
    id: 'balanced',
    index: '02',
    label: 'Balanced',
    character: 'Sweet & rounded',
    beanId: 'colombia',
    bean: 'Colombia Huila',
    brewFocus: 'Pour',
    brewNote: 'Keep the pour steady and centered through the full 2.5-minute sequence.',
    pairing: 'Colombia Huila + Guatemala Antigua',
  },
  deep: {
    id: 'deep',
    index: '03',
    label: 'Deep',
    character: 'Dark & grounded',
    beanId: 'sumatra',
    bean: 'Sumatra Mandheling',
    brewFocus: 'Grind',
    brewNote: 'Start medium-fine, then keep every remaining variable measured and calm.',
    pairing: 'Sumatra Mandheling + Swiss Water Decaf',
  },
}

const PROFILE_LIST = Object.values(PROFILES)

const BEANS = [
  { id: 'ethiopia', name: 'Ethiopia Yirgacheffe', origin: 'Yirgacheffe · Ethiopia', notes: 'Jasmine, lemon zest, honey', roast: 'Light', price: 18, lot: 'ETH-24-11', altitude: '1,950m', tone: '#d9a44b' },
  { id: 'colombia', name: 'Colombia Huila', origin: 'Huila · Colombia', notes: 'Caramel, red apple, cocoa', roast: 'Medium', price: 16, lot: 'COL-24-08', altitude: '1,780m', tone: '#e4572e' },
  { id: 'sumatra', name: 'Sumatra Mandheling', origin: 'Lintong · Sumatra', notes: 'Dark chocolate, cedar, earth', roast: 'Dark', price: 17, lot: 'SUM-24-06', altitude: '1,400m', tone: '#6d4637' },
  { id: 'kenya', name: 'Kenya AA Nyeri', origin: 'Nyeri · Kenya', notes: 'Blackcurrant, tomato, brown sugar', roast: 'Light', price: 19, lot: 'KEN-24-09', altitude: '1,820m', tone: '#c9784a' },
  { id: 'guatemala', name: 'Guatemala Antigua', origin: 'Antigua · Guatemala', notes: 'Milk chocolate, orange, almond', roast: 'Medium', price: 16, lot: 'GUA-24-12', altitude: '1,650m', tone: '#b55d35' },
  { id: 'decaf', name: 'Swiss Water Decaf Blend', origin: 'Seasonal blend', notes: 'Toffee, hazelnut, smooth', roast: 'Medium', price: 15, lot: 'DCF-24-07', altitude: 'Mixed', tone: '#887461' },
]

const STEPS = [
  { n: 1, title: 'Weigh', body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.', meta: '18g / 300ml' },
  { n: 2, title: 'Grind', body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.', meta: 'Medium-fine' },
  { n: 3, title: 'Bloom', body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.', meta: '30 seconds' },
  { n: 4, title: 'Pour', body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.', meta: '2.5 minutes' },
]

const REVIEWS = [
  { quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.', name: 'Maya T.', role: 'Subscriber since 2022', stamp: 'Flavor / 01' },
  { quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.', name: 'Daniel R.', role: 'Home barista', stamp: 'Freshness / 02' },
  { quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.', name: 'Priya S.', role: 'Gift subscriber', stamp: 'Ritual / 03' },
]

function ProfileControl({ value, onChange, compact = false }) {
  return (
    <div className={`profile-control${compact ? ' profile-control--compact' : ''}`} role="group" aria-label="Choose your roast profile">
      {PROFILE_LIST.map((item) => (
        <button
          type="button"
          key={item.id}
          className={value === item.id ? 'is-active' : ''}
          aria-pressed={value === item.id}
          onClick={() => onChange(item.id)}
        >
          <span>{item.index}</span>
          <strong>{item.label}</strong>
          <small>{item.character}</small>
        </button>
      ))}
    </div>
  )
}

function RoastDial({ profile }) {
  return (
    <div className="roast-dial" data-profile={profile.id} aria-label={`${profile.label} roast profile`}>
      <div className="dial-orbit dial-orbit--outer"><span>1962</span><span>PROBAT</span></div>
      <div className="dial-orbit dial-orbit--inner"><span>12 KG</span><span>BERGEN</span></div>
      <div className="dial-heat" />
      <div className="roast-bean">
        <span className="roast-bean__surface" />
        <span className="roast-bean__seam" />
        <span className="roast-bean__glint" />
      </div>
      <div className="dial-reading dial-reading--profile">
        <span>Profile</span>
        <strong>{profile.label}</strong>
      </div>
      <div className="dial-reading dial-reading--coords">60.3913° N<br />5.3221° E</div>
      <div className="dial-reading dial-reading--batch">
        <span>Live batch</span>
        <strong>0729</strong>
      </div>
    </div>
  )
}

function BeanCard({ bean, recommended, onAdd }) {
  return (
    <article
      className={`bean-card${recommended ? ' bean-card--recommended' : ''}`}
      data-bean={bean.id}
      style={{ '--bean-tone': bean.tone }}
    >
      <div className="bean-card__visual">
        <div className="bag">
          <span className="bag__seal">N / W</span>
          <span className="bag__origin">{bean.name}</span>
          <span className="bag__lot">{bean.lot}</span>
        </div>
        <span className="bean-card__coordinate">{bean.altitude}<br />250g</span>
        {recommended && <span className="match-badge">Your closest match</span>}
      </div>
      <div className="bean-card__body">
        <p className="bean-origin">{bean.origin}</p>
        <h3>{bean.name}</h3>
        <p className="bean-notes">{bean.notes}</p>
        <div className="bean-meta">
          <span>{bean.roast} roast · 250g</span>
          <span>{bean.lot}</span>
        </div>
        <div className="bean-buy">
          <span className="bean-price">${bean.price}</span>
          <button type="button" onClick={() => onAdd(bean)}>Add to cart <span>↗</span></button>
        </div>
      </div>
    </article>
  )
}

function BrewVisual({ activeStep, profile }) {
  return (
    <div className="brew-visual__frame" aria-label={`Pour-over visualization: step ${activeStep + 1}, ${STEPS[activeStep].title}`}>
      <div className="brew-readout">
        <div><span>Profile</span><strong>{profile.label}</strong></div>
        <div><span>Focus</span><strong>{profile.brewFocus}</strong></div>
        <div><span>Step</span><strong>0{activeStep + 1} / 04</strong></div>
      </div>
      <div className="brew-machine" data-step={activeStep + 1}>
        <div className="brew-kettle">
          <span className="brew-kettle__body" />
          <span className="brew-kettle__spout" />
        </div>
        <div className="brew-stream" />
        <div className="brew-cone">
          <span className="brew-grind" />
          <span className="brew-bloom" />
        </div>
        <div className="brew-carafe">
          <span className="brew-liquid" />
        </div>
        <div className="brew-scale"><span>18.0</span><small>grams</small></div>
      </div>
      <div className="brew-focus-note">
        <span>{profile.brewFocus} focus</span>
        <p>{profile.brewNote}</p>
      </div>
    </div>
  )
}

export default function App() {
  const pageRef = useRef(null)
  const flipStateRef = useRef(null)
  const cartTimerRef = useRef(null)
  const [roastProfile, setRoastProfile] = useState('balanced')
  const [activeBrewStep, setActiveBrewStep] = useState(0)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [cartNotice, setCartNotice] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const profile = PROFILES[roastProfile]
  const orderedBeans = useMemo(() => (
    [...BEANS].sort((a, b) => Number(b.id === profile.beanId) - Number(a.id === profile.beanId))
  ), [profile.beanId])

  function chooseProfile(nextProfile) {
    if (nextProfile === roastProfile) return
    flipStateRef.current = Flip.getState('.bean-card')
    setRoastProfile(nextProfile)
  }

  function addToCart(bean) {
    setCartNotice(`${bean.name} added to cart`)
    window.clearTimeout(cartTimerRef.current)
    cartTimerRef.current = window.setTimeout(() => setCartNotice(''), 2600)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!email.includes('@')) return
    setSent(true)
    setEmail('')
    setMessage('')
  }

  useLayoutEffect(() => {
    if (!flipStateRef.current) return
    Flip.from(flipStateRef.current, {
      duration: 0.9,
      ease: 'power3.inOut',
      stagger: 0.035,
      absolute: false,
      onComplete: () => ScrollTrigger.refresh(),
    })
    flipStateRef.current = null
  }, [roastProfile])

  useLayoutEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const context = gsap.context(() => {
      if (!reduced) {
        gsap.from('.hero-copy > *', {
          y: 34,
          opacity: 0,
          duration: 1.05,
          ease: 'power3.out',
          stagger: 0.08,
        })
        gsap.from('.roast-dial', {
          scale: 0.82,
          rotate: -8,
          opacity: 0,
          duration: 1.35,
          ease: 'power3.out',
        })

        gsap.from('.story-copy > *', {
          scrollTrigger: { trigger: '#story', start: 'top 68%' },
          y: 45,
          opacity: 0,
          duration: 1,
          stagger: 0.08,
          ease: 'power3.out',
        })
        gsap.from('.story-media', {
          scrollTrigger: { trigger: '#story', start: 'top 75%', end: 'center 45%', scrub: 1 },
          clipPath: 'inset(18% 18% 18% 18%)',
          scale: 0.92,
          ease: 'none',
        })
        gsap.from('.stat', {
          scrollTrigger: { trigger: '.stats', start: 'top 82%' },
          y: 42,
          opacity: 0,
          stagger: 0.11,
          duration: 0.9,
          ease: 'power3.out',
        })

        gsap.from('.beans-heading > *', {
          scrollTrigger: { trigger: '#beans', start: 'top 72%' },
          y: 38,
          opacity: 0,
          stagger: 0.08,
          duration: 0.9,
          ease: 'power3.out',
        })
      }

      STEPS.forEach((step, index) => {
        ScrollTrigger.create({
          trigger: `.brew-step[data-step="${step.n}"]`,
          start: 'top 58%',
          end: 'bottom 42%',
          onEnter: () => setActiveBrewStep(index),
          onEnterBack: () => setActiveBrewStep(index),
        })
      })
    }, pageRef)

    const media = gsap.matchMedia()
    media.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
      const brewTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: '#brew-guide',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
        },
      })
      brewTimeline
        .to('.brew-kettle', { x: 38, y: 20, rotation: 8, duration: 1 })
        .to('.brew-stream', { height: '34%', duration: 1 }, '<.15')
        .to('.brew-bloom', { width: '76%', height: '24%', borderRadius: '48%', duration: 1 })
        .to('.brew-stream', { height: '48%', x: -18, duration: 1 })
        .to('.brew-liquid', { height: '64%', borderRadius: '8% 8% 42% 42%', duration: 1 }, '<')
        .to('.brew-kettle', { x: -12, rotation: -5, duration: 1 })
        .to('.brew-stream', { height: '56%', x: 20, duration: 1 }, '<')
        .to('.brew-liquid', { height: '82%', duration: 1 }, '<')

      ScrollTrigger.create({
        trigger: '#brew-guide',
        start: 'top top',
        end: 'bottom bottom',
        pin: '.brew-visual',
        pinSpacing: false,
      })
    })

    return () => {
      media.revert()
      context.revert()
      window.clearTimeout(cartTimerRef.current)
    }
  }, [])

  return (
    <div className="page" ref={pageRef} data-profile={roastProfile}>
      <nav className="nav" id="site-nav">
        <a className="nav-logo" href="#hero" aria-label="Northwind Coffee Roasters home">
          <span className="nav-logo__mark">N</span>
          <span>Northwind<br />Coffee Roasters</span>
        </a>
        <div className={`nav-links${mobileNavOpen ? ' is-open' : ''}`}>
          <a href="#beans" onClick={() => setMobileNavOpen(false)}>Beans</a>
          <a href="#brew-guide" onClick={() => setMobileNavOpen(false)}>Brew Guide</a>
          <a href="#reviews" onClick={() => setMobileNavOpen(false)}>Reviews</a>
          <a href="#subscribe" onClick={() => setMobileNavOpen(false)}>Subscribe</a>
          <a href="#contact" onClick={() => setMobileNavOpen(false)}>Contact</a>
        </div>
        <div className="nav-status"><span /> Bergen · Batch 0729 · Live</div>
        <button
          className="nav-toggle"
          type="button"
          aria-expanded={mobileNavOpen}
          aria-label="Toggle navigation"
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          <span />
          <span />
        </button>
      </nav>

      <header className="hero" id="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span>Roasted 06:40</span><span>Dispatch 14:00</span></p>
          <h1>Small-batch coffee, roasted the morning it ships.</h1>
          <p className="hero-lede">
            We roast single-origin beans in 12kg batches on a 1962 Probat in Bergen,
            Norway, and ship them within hours. Freshness is not a slogan here; it is
            a timestamp on the bag.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#beans">Shop the beans <span>↘</span></a>
            <a className="btn btn-secondary" href="#brew-guide">Learn to brew <span>↘</span></a>
          </div>
        </div>
        <div className="hero-dial-wrap">
          <RoastDial profile={profile} />
        </div>
        <div className="hero-profile">
          <p>Choose the roast you wake up for.</p>
          <ProfileControl value={roastProfile} onChange={chooseProfile} />
        </div>
        <div className="hero-recommendation" aria-live="polite">
          <span>Recommended this month</span>
          <strong>{profile.bean}</strong>
          <a href="#beans">See your match <span>↘</span></a>
        </div>
      </header>

      <main>
        <section className="story section-dark" id="story">
          <div className="story-copy">
            <p className="section-index">01 / Small on purpose</p>
            <h2>From a fishing shed to eleven farm relationships.</h2>
            <p>
              Northwind started in 2014 as a roastery in a fishing shed. Ten years
              later we are still small on purpose: two roasters, one machine, and
              direct relationships with eleven farms across Ethiopia, Colombia,
              Kenya, Guatemala, and Sumatra. We pay on average 2.4× the commodity
              price and publish every contract.
            </p>
          </div>
          <figure className="story-media">
            <img src="/media/northwind-roaster.png" alt="Freshly roasted coffee inside a cast-iron drum roaster" />
            <figcaption>
              <span>Working drum roaster</span>
              <span>Bergen · Norway</span>
            </figcaption>
          </figure>
          <div className="stats" aria-label="Northwind facts">
            <div className="stat"><span>Partner farms</span><strong>11</strong><small>Five origins</small></div>
            <div className="stat"><span>Commodity price paid</span><strong>2.4×</strong><small>Average</small></div>
            <div className="stat"><span>Maximum batch</span><strong>12kg</strong><small>One machine</small></div>
            <div className="stat"><span>Roast to shipment</span><strong>&lt;24h</strong><small>Timestamped</small></div>
          </div>
          <div className="story-route" aria-hidden="true">
            <span className="route-origin">Origin</span>
            <span className="route-line" />
            <span className="route-node route-node--one" />
            <span className="route-node route-node--two" />
            <span className="route-node route-node--three" />
            <span className="route-bergen">Bergen</span>
          </div>
        </section>

        <section className="beans section-light" id="beans">
          <div className="beans-heading">
            <div>
              <p className="section-index">02 / Current origins</p>
              <h2>Six origins.<br />One morning batch.</h2>
            </div>
            <p>
              Your <strong>{profile.label.toLowerCase()}</strong> profile brings
              {` ${profile.bean}`} forward. Every coffee remains available.
            </p>
          </div>
          <div className="beans-toolbar">
            <span>Filter by taste</span>
            <ProfileControl value={roastProfile} onChange={chooseProfile} compact />
          </div>
          <div className="bean-grid">
            {orderedBeans.map((bean) => (
              <BeanCard
                bean={bean}
                key={bean.id}
                recommended={bean.id === profile.beanId}
                onAdd={addToCart}
              />
            ))}
          </div>
          <div className={`cart-toast${cartNotice ? ' is-visible' : ''}`} role="status" aria-live="polite">
            <span>Cart updated</span>
            <strong>{cartNotice || 'Coffee added'}</strong>
          </div>
        </section>

        <section className="brew section-light" id="brew-guide">
          <div className="brew-copy">
            <div className="brew-heading">
              <p className="section-index">03 / Brew by the numbers</p>
              <h2>Pour over,<br />calibrated.</h2>
              <p>
                Four movements. One measured three-minute ritual. Your
                <strong> {profile.label.toLowerCase()}</strong> profile puts the
                emphasis on <strong>{profile.brewFocus.toLowerCase()}</strong>.
              </p>
            </div>
            <ol className="steps">
              {STEPS.map((step, index) => (
                <li
                  className={`brew-step${activeBrewStep === index ? ' is-active' : ''}`}
                  data-step={step.n}
                  key={step.n}
                >
                  <span className="step-number">0{step.n}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                  <span className="step-meta">{step.meta}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="brew-visual">
            <BrewVisual activeStep={activeBrewStep} profile={profile} />
          </div>
        </section>

        <section className="reviews section-dark" id="reviews">
          <div className="reviews-heading">
            <p className="section-index">04 / Field notes</p>
            <h2>Freshness,<br />confirmed.</h2>
          </div>
          <div className="reviews-track">
            {REVIEWS.map((review) => (
              <blockquote className="review" key={review.name}>
                <span>{review.stamp}</span>
                <p>“{review.quote}”</p>
                <footer><strong>{review.name}</strong><span>{review.role}</span></footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section className="subscribe" id="subscribe">
          <div className="subscribe-orbit" aria-hidden="true">
            <span className="subscribe-ring subscribe-ring--one" />
            <span className="subscribe-ring subscribe-ring--two" />
            <span className="subscribe-bag subscribe-bag--one">N / W</span>
            <span className="subscribe-bag subscribe-bag--two">N / W</span>
          </div>
          <div className="subscribe-copy">
            <p className="section-index">05 / Your monthly batch</p>
            <h2>The Northwind subscription</h2>
            <p>
              Two 250g bags of our current favourites, every month, free shipping,
              pause any time. <strong>$29/month.</strong>
            </p>
            <div className="subscription-match" aria-live="polite">
              <span>Your {profile.label.toLowerCase()} pairing</span>
              <strong>{profile.pairing}</strong>
            </div>
            <a className="btn btn-primary" href="#contact">Start a subscription <span>↘</span></a>
          </div>
          <ProfileControl value={roastProfile} onChange={chooseProfile} compact />
        </section>

        <section className="contact section-light" id="contact">
          <div className="contact-heading">
            <p className="section-index">06 / Open channel</p>
            <h2>Talk to the<br />roastery.</h2>
            <div className="contact-status">
              <span><i /> Bergen workshop open</span>
              <span>Typical reply · within a day</span>
            </div>
          </div>
          <div className="contact-panel">
            {sent ? (
              <div className="form-success" role="status">
                <span>Message received / 0729</span>
                <h3>Thanks—we read everything and reply within a day.</h3>
                <button type="button" onClick={() => setSent(false)}>Send another message</button>
              </div>
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
                  onChange={(event) => setEmail(event.target.value)}
                />
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  placeholder="Questions, wholesale, or just coffee talk"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
                <button type="submit" className="btn btn-primary">Send message <span>↗</span></button>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="footer section-dark" id="site-footer">
        <div className="footer-brand">
          <span className="nav-logo__mark">N</span>
          <strong>Northwind<br />Coffee Roasters</strong>
        </div>
        <p>© 2026 Northwind Coffee Roasters<br />Bergen, Norway</p>
        <div className="footer-links">
          <a href="#hero">Top</a>
          <a href="/shipping">Shipping</a>
          <a href="/returns">Returns</a>
          <a href="/privacy">Privacy</a>
        </div>
        <div className="footer-batch">
          <span>Current batch</span>
          <strong>0729</strong>
        </div>
      </footer>
    </div>
  )
}
