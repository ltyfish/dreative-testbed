import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import bergenRoastery from './assets/bergen-roastery.png'
import probatRoast from './assets/probat-roast.png'
import coffeeLineup from './assets/coffee-lineup.png'

gsap.registerPlugin(ScrollTrigger)

const BEANS = [
  { id: 'ethiopia', name: 'Ethiopia Yirgacheffe', origin: 'Ethiopia · Worka', notes: 'Jasmine, lemon zest, honey', roast: 'Light', price: 18, profile: 'bright', color: '#2c5bf0' },
  { id: 'colombia', name: 'Colombia Huila', origin: 'Colombia · Huila', notes: 'Caramel, red apple, cocoa', roast: 'Medium', price: 16, profile: 'sweet', color: '#c38b43' },
  { id: 'sumatra', name: 'Sumatra Mandheling', origin: 'Indonesia · Sumatra', notes: 'Dark chocolate, cedar, earth', roast: 'Dark', price: 17, profile: 'deep', color: '#b54131' },
  { id: 'kenya', name: 'Kenya AA Nyeri', origin: 'Kenya · Nyeri', notes: 'Blackcurrant, tomato, brown sugar', roast: 'Light', price: 19, profile: 'bright', color: '#3558bb' },
  { id: 'guatemala', name: 'Guatemala Antigua', origin: 'Guatemala · Antigua', notes: 'Milk chocolate, orange, almond', roast: 'Medium', price: 16, profile: 'sweet', color: '#d05b35' },
  { id: 'decaf', name: 'Swiss Water Decaf Blend', origin: 'Americas · Water process', notes: 'Toffee, hazelnut, smooth', roast: 'Medium', price: 15, profile: 'deep', color: '#3e4a3f' },
]

const STEPS = [
  { n: 1, title: 'Weigh', body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.', metric: '18g / 300ml' },
  { n: 2, title: 'Grind', body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.', metric: 'Medium–fine' },
  { n: 3, title: 'Bloom', body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.', metric: '36g / 30 sec' },
  { n: 4, title: 'Pour', body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.', metric: '03:00 total' },
]

const REVIEWS = [
  { quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.', name: 'Maya T.', role: 'Subscriber since 2022', number: '01' },
  { quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.', name: 'Daniel R.', role: 'Home barista', number: '02' },
  { quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.', name: 'Priya S.', role: 'Gift subscriber', number: '03' },
]

const PROFILES = {
  bright: { label: 'Bright', accent: '#2c5bf0', temp: '192°', target: '192°C', roast: 'Light', roastLine: 'Fast finish · floral clarity', bean: 'kenya', beanName: 'Kenya AA Nyeri', destination: 'Nyeri', cut: 'blue', brew: '95°C · medium-fine', pair: 'Yirgacheffe + Kenya AA' },
  sweet: { label: 'Sweet', accent: '#c38b43', temp: '204°', target: '204°C', roast: 'Medium', roastLine: 'Long Maillard · caramel depth', bean: 'colombia', beanName: 'Colombia Huila', destination: 'Huila', cut: 'ochre', brew: '94°C · medium', pair: 'Colombia + Guatemala' },
  deep: { label: 'Deep', accent: '#b54131', temp: '216°', target: '216°C', roast: 'Dark', roastLine: 'Deep development · cocoa finish', bean: 'sumatra', beanName: 'Sumatra Mandheling', destination: 'Sumatra', cut: 'red', brew: '92°C · medium-coarse', pair: 'Sumatra + Decaf Blend' },
}

export default function App() {
  const rootRef = useRef(null)
  const [profileKey, setProfileKey] = useState('bright')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [cartNotice, setCartNotice] = useState('')
  const profile = PROFILES[profileKey]

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return undefined

    const context = gsap.context(() => {
      gsap.utils.toArray('[data-reveal]').forEach((element) => {
        gsap.fromTo(element, { y: 70, opacity: 0 }, {
          y: 0, opacity: 1, duration: 1.05, ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 86%', once: true },
        })
      })

      gsap.to('.hero-media', {
        scale: 1.12, yPercent: 7, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
      })

      ScrollTrigger.create({
        trigger: '#roast-story', start: 'top top', end: 'bottom bottom', scrub: true,
        onUpdate: ({ progress }) => rootRef.current?.style.setProperty('--roast-progress', progress.toFixed(4)),
      })

      gsap.fromTo('.proof-image', { clipPath: 'inset(16% 18% 16% 18%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
        scrollTrigger: { trigger: '#story', start: 'top 80%', end: 'bottom 35%', scrub: true },
      })

      gsap.utils.toArray('.review').forEach((review, index) => {
        gsap.from(review, { xPercent: index % 2 ? 12 : -12, rotate: index - 1, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: review, start: 'top 85%' } })
      })
    }, rootRef)

    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)
    return () => { window.removeEventListener('load', refresh); context.revert() }
  }, [])

  useEffect(() => {
    rootRef.current?.style.setProperty('--accent', profile.accent)
  }, [profile])

  function chooseProfile(key) {
    setProfileKey(key)
  }

  function addToCart(bean) {
    setCartNotice(`${bean.name} added to cart`)
    window.setTimeout(() => setCartNotice(''), 2600)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!email.includes('@')) return
    setSent(true)
    setEmail('')
    setMessage('')
  }

  return (
    <div className="site" ref={rootRef} data-profile={profileKey}>
      <nav className="nav" id="site-nav">
        <a className="nav-logo" href="#hero" aria-label="Northwind home"><span>NW</span><b>Northwind<br />Coffee Roasters</b></a>
        <div className="nav-status"><i></i><span>Roasted 06:14 · Bergen</span></div>
        <div className="nav-links">
          <a href="#beans">Beans</a><a href="#brew-guide">Brew Guide</a><a href="#reviews">Reviews</a><a href="#subscribe">Subscribe</a><a href="#contact">Contact</a>
        </div>
      </nav>

      <header className="hero" id="hero">
        <img className="hero-media" src={bergenRoastery} alt="A small coffee roastery in a Bergen fishing shed on a rainy morning" />
        <div className="media-grain" aria-hidden="true"></div>
        <div className="hero-copy">
          <p className="kicker">Bergen, Norway · Small batch since 2014</p>
          <h1><span>Roasted before</span><span>the <em>rain clears.</em></span></h1>
          <p className="hero-deck">Small-batch coffee, roasted the morning it ships. Freshness is not a slogan here; it is a timestamp on the bag.</p>
          <div className="hero-actions"><a className="text-link" href="#beans">Shop the beans <span>↗</span></a><a className="text-link quiet" href="#brew-guide">Learn to brew <span>↓</span></a></div>
        </div>
        <div className="flavor-control">
          <p>Choose your cut <span>Flavor follows through the page</span></p>
          {Object.entries(PROFILES).map(([key, item], index) => (
            <button key={key} type="button" className={profileKey === key ? 'active' : ''} onClick={() => chooseProfile(key)} aria-pressed={profileKey === key}>
              <b>0{index + 1}</b><strong>{item.label}</strong><small>{key === 'bright' ? 'Jasmine · citrus' : key === 'sweet' ? 'Caramel · apple' : 'Cocoa · cedar'}</small>
            </button>
          ))}
        </div>
        <div className="hero-scroll"><span>Scroll to enter the roast</span><i></i></div>
      </header>

      <main>
        <section className="story" id="story">
          <div className="section-index"><span>01</span><b>Origin / proof</b></div>
          <div className="story-heading" data-reveal>
            <p className="kicker">A fishing shed. Two roasters. One machine.</p>
            <h2>Small<br />on <em>purpose.</em></h2>
          </div>
          <div className="story-body" data-reveal>
            <p>Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still small on purpose: two roasters, one machine, and direct relationships with eleven farms across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra.</p>
            <p>We roast single-origin beans in 12kg batches on a 1962 Probat in Bergen, Norway, and ship them within hours. We pay on average 2.4× the commodity price and publish every contract.</p>
          </div>
          <figure className="proof-image"><img src={bergenRoastery} alt="The Northwind roastery opening onto Bergen's wet waterfront" /><figcaption>Northwind shed no. 04 · Bergen harbor · 60.3913° N</figcaption></figure>
          <div className="stats">
            {[['11', 'partner farms'], ['2.4×', 'commodity price paid'], ['12kg', 'max batch size'], ['<24h', 'roast to shipment']].map(([value, label], index) => <div className="stat" key={label} data-reveal><span>0{index + 1}</span><strong>{value}</strong><p>{label}</p></div>)}
          </div>
        </section>

        <section className="roast-story" id="roast-story">
          <div className="roast-stage">
            <img className="roaster-media" src={probatRoast} alt="Vintage drum roaster releasing freshly roasted coffee into its cooling tray" />
            <div className="roast-shutter" aria-hidden="true"></div>
            <div className="roast-top"><span>02 / Transformation</span><span>1962 Probat · 12 kg</span><span>{profile.label} profile</span></div>
            <div className="roast-number">02</div>
            <div className="heat-readout"><span>Now roasting</span><strong>{profile.temp}</strong><small>{profile.roastLine}</small></div>
            <div className="roast-copy"><p>Heat / time / craft</p><h2>Green becomes<br /><em>character.</em></h2><span>The drum receives eleven kilos. Heat bends around the profile you chose, then releases the finished roast into moving air.</span></div>
            <div className="film-strip" aria-hidden="true"><i></i><i></i><i></i></div>
            <div className="roast-progress"><span></span></div>
          </div>
        </section>

        <section className="beans" id="beans">
          <div className="section-index light"><span>03</span><b>Current release</b></div>
          <div className="beans-heading" data-reveal><p className="kicker">Six origins · roasted this week</p><h2>Find your<br /><em>cut.</em></h2><p>Your {profile.label.toLowerCase()} profile points to <strong>{profile.beanName}</strong>. The full release stays in place so comparison remains honest.</p></div>
          <div className="bean-grid">
            {BEANS.map((bean, index) => (
              <article className={`bean-card ${bean.id === profile.bean ? 'recommended' : ''}`} key={bean.id} data-bean={bean.id} style={{ '--bean-color': bean.color }} data-reveal>
                <div className="bean-visual"><span className="bag-index">0{index + 1}</span><div className="bag"><b>NW</b><i></i><strong>{bean.name}</strong><small>{bean.origin}</small></div><em>{bean.id === profile.bean ? 'Your cut' : bean.roast}</em></div>
                <div className="bean-info"><p>{bean.origin}</p><h3>{bean.name}</h3><span className="bean-notes">{bean.notes}</span><span className="bean-meta">{bean.roast} roast · 250g</span><div className="bean-buy"><strong>${bean.price}</strong><button type="button" onClick={() => addToCart(bean)}>Add to cart <span>+</span></button></div></div>
              </article>
            ))}
          </div>
        </section>

        <section className="brew-guide" id="brew-guide">
          <div className="section-index"><span>04</span><b>Pour over / four cuts</b></div>
          <div className="brew-heading" data-reveal><p className="kicker">Brew guide · calibrated for {profile.label.toLowerCase()}</p><h2>Make time<br /><em>visible.</em></h2><p>Current profile: <b>{profile.brew}</b>. The fundamentals never change; small adjustments protect the roast you chose.</p></div>
          <ol className="steps">
            {STEPS.map((step) => <li className="step" key={step.n} data-reveal><div className="step-top"><span>0{step.n}</span><b>{step.metric}</b></div><div className="brew-disc" aria-hidden="true"><i></i><i></i><i></i></div><h3>{step.title}</h3><p>{step.body}</p></li>)}
          </ol>
        </section>

        <section className="reviews" id="reviews">
          <div className="section-index light"><span>05</span><b>Subscriber notes</b></div>
          <div className="reviews-heading" data-reveal><p className="kicker">Passed hand to hand</p><h2>Freshness<br />leaves a <em>mark.</em></h2></div>
          <div className="review-stack">
            {REVIEWS.map((review) => <blockquote className="review" key={review.name}><span>{review.number}</span><p>“{review.quote}”</p><footer><strong>{review.name}</strong><i>{review.role}</i></footer></blockquote>)}
          </div>
        </section>

        <section className="subscribe" id="subscribe">
          <img src={coffeeLineup} alt="Six Northwind coffee bags arranged in the roastery" />
          <div className="subscribe-overlay"></div>
          <div className="section-index"><span>06</span><b>Monthly pairing</b></div>
          <div className="subscribe-copy" data-reveal><p className="kicker">Your {profile.label.toLowerCase()} cut, continued</p><h2>Two bags.<br />One changing<br /><em>season.</em></h2><p>The Northwind subscription: two 250g bags of our current favourites every month, free shipping, pause any time. <strong>$29/month.</strong></p><div className="pairing"><span>This month</span><b>{profile.pair}</b></div><a className="solid-link" href="#contact">Start a subscription <span>↗</span></a></div>
        </section>

        <section className="contact" id="contact">
          <div className="section-index"><span>07</span><b>Direct line / Bergen</b></div>
          <div className="contact-heading" data-reveal><p className="kicker">Questions, wholesale, or coffee talk</p><h2>Write to the<br /><em>roastery.</em></h2><p>We read everything and reply within a day.</p></div>
          <div className="contact-panel" data-reveal>
            {sent ? <div className="form-success" role="status"><span>Message received</span><h3>Thanks — we’ll reply within a day.</h3><button type="button" onClick={() => setSent(false)}>Send another note</button></div> : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <label htmlFor="email"><span>01 / Email</span><input id="email" name="email" type="email" required placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
                <label htmlFor="message"><span>02 / Message</span><textarea id="message" name="message" rows={4} placeholder="Questions, wholesale, or just coffee talk" value={message} onChange={(event) => setMessage(event.target.value)} /></label>
                <button type="submit">Send message <span>↗</span></button>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="footer" id="site-footer">
        <div><span className="footer-mark">NW</span><p>Northwind Coffee Roasters<br />Bergen, Norway · 2014—2026</p></div>
        <h2>Roasted today.<br /><em>Gone tomorrow.</em></h2>
        <div className="footer-links"><a href="#hero">Top</a><a href="/shipping">Shipping</a><a href="/returns">Returns</a><a href="/privacy">Privacy</a></div>
        <p className="copyright">© 2026 Northwind Coffee Roasters — Bergen, Norway</p>
      </footer>

      <div className={`cart-toast ${cartNotice ? 'visible' : ''}`} role="status" aria-live="polite"><span>Added</span>{cartNotice}</div>
    </div>
  )
}
