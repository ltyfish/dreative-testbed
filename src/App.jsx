import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import roasterImage from './assets/northwind-roaster.png'

gsap.registerPlugin(ScrollTrigger)

const PROFILES = {
  light: { label: 'Light', temp: '198°', note: 'floral · bright · citrus', accent: '#d8ff73' },
  medium: { label: 'Medium', temp: '207°', note: 'caramel · fruit · cocoa', accent: '#ffab63' },
  dark: { label: 'Dark', temp: '218°', note: 'dark chocolate · cedar · smoke', accent: '#ff6847' },
}

const BEANS = [
  { id: 'ethiopia', origin: 'ET / 01', name: 'Ethiopia Yirgacheffe', notes: 'Jasmine, lemon zest, honey', roast: 'Light', price: 18 },
  { id: 'colombia', origin: 'CO / 02', name: 'Colombia Huila', notes: 'Caramel, red apple, cocoa', roast: 'Medium', price: 16 },
  { id: 'sumatra', origin: 'ID / 03', name: 'Sumatra Mandheling', notes: 'Dark chocolate, cedar, earth', roast: 'Dark', price: 17 },
  { id: 'kenya', origin: 'KE / 04', name: 'Kenya AA Nyeri', notes: 'Blackcurrant, tomato, brown sugar', roast: 'Light', price: 19 },
  { id: 'guatemala', origin: 'GT / 05', name: 'Guatemala Antigua', notes: 'Milk chocolate, orange, almond', roast: 'Medium', price: 16 },
  { id: 'decaf', origin: 'CH / 06', name: 'Swiss Water Decaf Blend', notes: 'Toffee, hazelnut, smooth', roast: 'Medium', price: 15 },
]

const STEPS = [
  { n: '01', title: 'Weigh', metric: '18g / 300ml', body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.' },
  { n: '02', title: 'Grind', metric: 'medium–fine', body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.' },
  { n: '03', title: 'Bloom', metric: '30 seconds', body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.' },
  { n: '04', title: 'Pour', metric: '2.5 minutes', body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.' },
]
const ROAST_PHASES = ['Charge', 'Turn', 'First crack', 'Drop']

const REVIEWS = [
  { quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.', name: 'Maya T.', role: 'Subscriber since 2022' },
  { quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.', name: 'Daniel R.', role: 'Home barista' },
  { quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.', name: 'Priya S.', role: 'Gift subscriber' },
]

function Mark() {
  return <span className="mark" aria-hidden="true"><i /><i /><i /></span>
}

const LEGAL_PAGES = {
  '/shipping': ['Shipping', 'Freshness needs a short route.', 'For current destinations, dispatch days, and delivery estimates, contact the roastery before ordering. We will confirm the route from Bergen without making a promise the carrier cannot keep.'],
  '/returns': ['Returns', 'Start with a conversation.', 'If something is wrong with your order, tell us what arrived and include the roast date from the bag. We will review it directly and explain the available resolution.'],
  '/privacy': ['Privacy', 'Plain language, human contact.', 'Use the contact form for questions about information submitted through this site. This demonstration does not connect the form to an external data service.'],
}

function LegalPage({ page }) {
  return <div className="legal-page"><nav className="legal-nav"><a className="nav-logo" href="/"><Mark /><span>Northwind</span></a><a href="/">Back to roastery ↗</a></nav><main><p className="kicker">Northwind / Information</p><h1>{page[0]}</h1><h2>{page[1]}</h2><p>{page[2]}</p><a className="btn btn-primary" href="/#contact">Contact the roasters <span>↗</span></a></main></div>
}

export default function App() {
  const legalPage = LEGAL_PAGES[window.location.pathname]
  if (legalPage) return <LegalPage page={legalPage} />

  const [profile, setProfile] = useState('light')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [cartNotice, setCartNotice] = useState('')
  const [roastStage, setRoastStage] = useState(0)
  const journeyRef = useRef(null)
  const current = PROFILES[profile]

  useEffect(() => {
    const media = gsap.matchMedia()
    media.add('(min-width: 801px) and (prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        const stages = gsap.utils.toArray('.roast-stage')
        stages.forEach((stage, index) => {
          gsap.fromTo(stage, { opacity: index ? 0.14 : 1 }, {
            opacity: 1,
            scrollTrigger: {
              trigger: stage,
              start: 'top 62%',
              end: 'bottom 38%',
              scrub: true,
              onEnter: () => setRoastStage(index),
              onEnterBack: () => setRoastStage(index),
            },
          })
        })
        gsap.fromTo('.roast-sticky img', { scale: 1, filter: 'saturate(.65) brightness(.72)' }, {
          scale: 1.12,
          filter: 'saturate(1.2) brightness(.95)',
          ease: 'none',
          scrollTrigger: { trigger: '.roast-journey', start: 'top top', end: 'bottom bottom', scrub: .5 },
        })
        gsap.fromTo('.roast-shade', { opacity: .94 }, {
          opacity: .45,
          ease: 'none',
          scrollTrigger: { trigger: '.roast-journey', start: 'top top', end: 'bottom bottom', scrub: .5 },
        })
        ScrollTrigger.create({
          trigger: '.roast-journey',
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: self => setRoastStage(Math.min(3, Math.floor(self.progress * 4))),
        })
        gsap.fromTo('.roast-orbit', { rotate: -18, scale: .82 }, {
          rotate: 118, scale: 1.12, ease: 'none',
          scrollTrigger: { trigger: '.roast-journey', start: 'top top', end: 'bottom bottom', scrub: .5 },
        })
      }, journeyRef)
      return () => ctx.revert()
    })
    return () => media.revert()
  }, [])

  useEffect(() => {
    const stages = [...document.querySelectorAll('.roast-stage')]
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setRoastStage(stages.indexOf(entry.target))
      })
    }, { rootMargin: '-35% 0px -45%' })
    stages.forEach(stage => observer.observe(stage))
    return () => observer.disconnect()
  }, [])

  function addBean(bean) {
    setCartNotice(`${bean.name} added to cart`)
    window.setTimeout(() => setCartNotice(''), 2200)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!email.includes('@')) return
    setSent(true)
    setEmail('')
    setMessage('')
  }

  return (
    <div className={`page profile-${profile}`} style={{ '--accent': current.accent }}>
      <a className="skip-link" href="#main">Skip to coffee</a>
      <div className="cart-notice" role="status" aria-live="polite">{cartNotice}</div>
      <nav className="nav" id="site-nav" aria-label="Primary navigation">
        <a className="nav-logo" href="#hero"><Mark /><span>Northwind</span><small>Coffee Roasters · Bergen</small></a>
        <div className="nav-links">
          <a href="#beans">Beans</a><a href="#brew-guide">Brew Guide</a><a href="#reviews">Reviews</a>
          <a href="#subscribe">Subscribe</a><a href="#contact">Contact</a>
        </div>
        <a className="nav-shop" href="#beans">Shop / 06</a>
      </nav>

      <main id="main" data-profile={profile}>
        <header className="hero" id="hero">
          <div className="hero-grain" />
          <div className="eyebrow"><span>Roasted in Bergen</span><span>Batch 0726</span><span>&lt;24h to ship</span></div>
          <div className="hero-copy">
            <p className="kicker">Small batch / cold coast</p>
            <h1>Roasted this <em>morning.</em><br />Not last month.</h1>
            <p className="hero-intro">We roast single-origin beans in 12kg batches on a 1962 Probat in Bergen, Norway, and ship them within hours. Freshness is not a slogan here; it is a timestamp on the bag.</p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#beans">Shop the beans <span>↘</span></a>
              <a className="text-link" href="#brew-guide">Learn to brew <span>↓</span></a>
            </div>
          </div>
          <div className="profile-control" aria-label="Choose your preferred roast profile">
            <span className="profile-label">Set the journey</span>
            <div className="profile-options" onClick={(event) => {
              if (event.target === event.currentTarget) setProfile(profile === 'light' ? 'medium' : profile === 'medium' ? 'dark' : 'light')
            }}>
              {Object.entries(PROFILES).map(([key, value]) => (
                <button key={key} type="button" className={profile === key ? 'active' : ''} onClick={() => setProfile(key)} aria-pressed={profile === key}>
                  <span>{value.label}</span><small>{value.temp}</small>
                </button>
              ))}
            </div>
            <button className="profile-cycle" type="button" onClick={() => setProfile(profile === 'light' ? 'medium' : profile === 'medium' ? 'dark' : 'light')}>Cycle roast profile <span>↻</span></button>
            <p><span>{current.temp}</span> Finish temperature<br /><b>{current.note}</b></p>
          </div>
          <div className="hero-coordinate">60.3913° N<br />5.3221° E</div>
          <div className="hero-bean" aria-hidden="true"><span /></div>
        </header>

        <section className="story" id="story">
          <div className="section-index">01 / ORIGIN</div>
          <div className="story-lead">
            <p className="kicker">Small on purpose</p>
            <h2>Eleven farms.<br />Two roasters.<br /><em>One old machine.</em></h2>
          </div>
          <div className="story-copy">
            <p>Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still small on purpose: two roasters, one machine, and direct relationships with eleven farms across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra. We pay on average 2.4× the commodity price and publish every contract.</p>
          </div>
          <div className="stats">
            <div><strong>11</strong><span>partner farms</span></div>
            <div><strong>2.4×</strong><span>commodity price paid</span></div>
            <div><strong>12kg</strong><span>max batch size</span></div>
            <div><strong>&lt;24h</strong><span>roast to shipment</span></div>
          </div>
        </section>

        <section className="beans" id="beans">
          <div className="section-head">
            <div className="section-index">02 / SELECTION</div>
            <div><p className="kicker">Current release · July 2026</p><h2>Six origins.<br /><em>Choose your signal.</em></h2></div>
            <p className="section-aside">Your {current.label.toLowerCase()} preference brings the closest matches forward. Every bag carries its roast date.</p>
          </div>
          <div className="bean-list">
            {BEANS.map((bean, index) => (
              <article className={`bean-row ${bean.roast.toLowerCase() === profile ? 'profile-match' : ''}`} key={bean.id} data-bean={bean.id}>
                <span className="bean-origin">{bean.origin}</span>
                <span className="bean-swatch" aria-hidden="true" style={{ '--i': index }} />
                <div><h3>{bean.name}</h3><p>{bean.notes}</p></div>
                <span className="bean-roast">{bean.roast}<small>roast · 250g</small></span>
                <span className="bean-price">${bean.price}</span>
                <button type="button" onClick={() => addBean(bean)} aria-label={`Add ${bean.name} to cart`}>Add <span>＋</span></button>
              </article>
            ))}
          </div>
        </section>

        <section className={`roast-journey profile-${profile}`} ref={journeyRef} aria-label="The roast transformation" data-profile={profile} data-stage={roastStage}>
          <div className="roast-sticky">
            <img src={roasterImage} alt="Vintage copper drum roaster releasing a fresh batch into its cooling tray" />
            <div className="roast-shade" />
            <div className="roast-orbit" aria-hidden="true"><span /><span /><span /><span /></div>
            <div className="roast-meter"><span>Charge</span><i /><span>First crack</span><i /><span>Drop</span></div>
            <div className="roast-title"><p className="kicker">03 / HEAT</p><h2>Watch green<br />become <em>{current.label.toLowerCase()}.</em></h2></div>
            <div className="roast-phase-display" aria-live="off">0{roastStage + 1} / {ROAST_PHASES[roastStage]}</div>
            <div className="roast-temp" style={{ transform: `translateX(${profile === 'light' ? 0 : profile === 'medium' ? -36 : -72}px)` }}>{current.temp}<small>finish</small></div>
          </div>
          <div className="roast-stages">
            <article className="roast-stage"><span>00:00 / 22°C</span><h3>Charge</h3><p>Twelve kilograms enter the drum. Cold green seed meets old iron.</p></article>
            <article className="roast-stage"><span>04:20 / 150°C</span><h3>Turn</h3><p>Moisture leaves. Grass becomes bread, then honey. The batch finds momentum.</p></article>
            <article className="roast-stage"><span>08:40 / 196°C</span><h3>First crack</h3><p>Pressure releases in a quick, audible chorus. The roast profile becomes flavour.</p></article>
            <article className="roast-stage"><span>10:18 / {current.temp}</span><h3>Drop</h3><p>Heat stops exactly where your selected profile opens its clearest signal.</p></article>
          </div>
        </section>

        <section className="brew" id="brew-guide">
          <div className="brew-intro">
            <div className="section-index">04 / EXTRACTION</div>
            <p className="kicker">Pour over · four movements</p>
            <h2>The roast is half<br />the work. <em>You finish it.</em></h2>
            <div className="brew-ring" aria-hidden="true"><span>95°</span></div>
          </div>
          <ol className="steps">
            {STEPS.map(step => <li className="step" key={step.n}><span>{step.n}</span><div><h3>{step.title}</h3><strong>{step.metric}</strong><p>{step.body}</p></div></li>)}
          </ol>
        </section>

        <section className="reviews" id="reviews">
          <div className="section-index">05 / PROOF</div>
          <p className="kicker">Dispatches from the kitchen counter</p>
          <div className="review-track">
            {REVIEWS.map((review, index) => <blockquote key={review.name}><span>0{index + 1}</span><p>“{review.quote}”</p><footer><strong>{review.name}</strong><small>{review.role}</small></footer></blockquote>)}
          </div>
        </section>

        <section className={`subscribe profile-${profile}`} id="subscribe" data-profile={profile}>
          <div className="subscribe-light" />
          <div className="section-index">06 / RETURN</div>
          <div><p className="kicker" style={{ background: current.accent, color: '#111', padding: '.55rem .7rem', display: 'inline-block' }}>Your profile is set to {current.label}</p><h2>Two bags.<br />A new origin.<br /><em>Every month.</em></h2></div>
          <div className="subscribe-offer"><span>$29<small>/ month</small></span><p>Two 250g bags of our current favourites, every month, free shipping, pause any time.</p><a className="btn btn-primary" href="#contact">Start a subscription <span>↘</span></a></div>
        </section>

        <section className="contact" id="contact">
          <div><div className="section-index">07 / CONTACT</div><p className="kicker">Bergen answers</p><h2>Ask the<br /><em>roasters.</em></h2></div>
          {sent ? <p className="form-success" role="status">Thanks — we read everything and reply within a day.</p> : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <label htmlFor="email">Email</label><input id="email" name="email" type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              <label htmlFor="message">Message</label><textarea id="message" name="message" rows={4} placeholder="Questions, wholesale, or just coffee talk" value={message} onChange={e => setMessage(e.target.value)} />
              <button type="submit" className="btn btn-primary">Send message <span>↗</span></button>
            </form>
          )}
        </section>
      </main>

      <footer className="footer" id="site-footer">
        <a className="footer-brand" href="#hero"><Mark />Northwind</a>
        <p>© 2026 Northwind Coffee Roasters<br />Bergen, Norway</p>
        <div className="footer-links"><a href="#hero">Top</a><a href="/shipping">Shipping</a><a href="/returns">Returns</a><a href="/privacy">Privacy</a></div>
      </footer>
    </div>
  )
}
