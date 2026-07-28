import { useEffect, useMemo, useState } from 'react'
import RoastPrototype, { ThreeChamber } from './RoastPrototype'

const BEANS = [
  { id: 'ethiopia', origin: 'Ethiopia', name: 'Yirgacheffe', notes: 'Jasmine, lemon zest, honey', roast: 'Light', price: 18, altitude: '1,950m', code: 'ET-04' },
  { id: 'colombia', origin: 'Colombia', name: 'Huila', notes: 'Caramel, red apple, cocoa', roast: 'Medium', price: 16, altitude: '1,780m', code: 'CO-11' },
  { id: 'sumatra', origin: 'Sumatra', name: 'Mandheling', notes: 'Dark chocolate, cedar, earth', roast: 'Dark', price: 17, altitude: '1,450m', code: 'ID-08' },
  { id: 'kenya', origin: 'Kenya', name: 'AA Nyeri', notes: 'Blackcurrant, tomato, brown sugar', roast: 'Light', price: 19, altitude: '1,850m', code: 'KE-03' },
  { id: 'guatemala', origin: 'Guatemala', name: 'Antigua', notes: 'Milk chocolate, orange, almond', roast: 'Medium', price: 16, altitude: '1,600m', code: 'GT-06' },
  { id: 'decaf', origin: 'Swiss Water', name: 'Decaf Blend', notes: 'Toffee, hazelnut, smooth', roast: 'Medium', price: 15, altitude: 'Multi-origin', code: 'DC-02' },
]

const STEPS = [
  { n: '01', title: 'Weigh', value: '18g', body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.' },
  { n: '02', title: 'Grind', value: '540µm', body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.' },
  { n: '03', title: 'Bloom', value: '00:30', body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.' },
  { n: '04', title: 'Pour', value: '02:30', body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.' },
]

const REVIEWS = [
  { quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.', name: 'Maya T.', role: 'Subscriber since 2022', stamp: 'BRG–0422' },
  { quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.', name: 'Daniel R.', role: 'Home barista', stamp: 'OSL–1187' },
  { quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.', name: 'Priya S.', role: 'Gift subscriber', stamp: 'LDN–0904' },
]

const PROFILES = {
  Light: { code: 'L01', temp: '203°C', color: '#c46b35', copy: 'Floral clarity · bright acidity', stage: 2 },
  Medium: { code: 'M02', temp: '211°C', color: '#a94c27', copy: 'Balanced sweetness · round body', stage: 3 },
  Dark: { code: 'D03', temp: '218°C', color: '#73331f', copy: 'Deep caramel · long finish', stage: 4 },
}

function Arrow() {
  return <span aria-hidden="true">↗</span>
}

const LEGAL_PAGES = {
  '/shipping': {
    eyebrow: 'Dispatch terms / BRG–01',
    title: 'Shipping',
    body: 'Coffee roasted in Bergen ships within 24 hours of roasting. Subscription shipping is included; one-off orders show their delivery rate before confirmation.',
  },
  '/returns': {
    eyebrow: 'Order care / BRG–02',
    title: 'Returns',
    body: 'Coffee is perishable, so unopened bags can be returned within 14 days. If a bag arrives damaged or incorrect, contact the roastery and we will replace it.',
  },
  '/privacy': {
    eyebrow: 'Data handling / BRG–03',
    title: 'Privacy',
    body: 'Northwind uses contact and order information only to answer messages, fulfil purchases, and manage subscriptions. We do not sell personal information.',
  },
}

function LegalPage({ page }) {
  return (
    <main className="legal-page">
      <nav><a href="/">Northwind Coffee Roasters</a><a href="/">Return to roastery <Arrow /></a></nav>
      <section>
        <span>{page.eyebrow}</span>
        <h1>{page.title}</h1>
        <p>{page.body}</p>
        <a href="/#contact">Contact the roastery <Arrow /></a>
      </section>
    </main>
  )
}

export default function App() {
  if (window.location.pathname === '/prototype-bounded') return <RoastPrototype mode="bounded" />
  if (window.location.pathname === '/prototype-spatial') return <RoastPrototype mode="spatial" />
  if (LEGAL_PAGES[window.location.pathname]) return <LegalPage page={LEGAL_PAGES[window.location.pathname]} />

  const [profile, setProfile] = useState('Medium')
  const [roastStage, setRoastStage] = useState(PROFILES.Medium.stage)
  const [activeBean, setActiveBean] = useState(0)
  const [cart, setCart] = useState([])
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const profileData = PROFILES[profile]
  const cycleProfile = () => {
    const profiles = Object.keys(PROFILES)
    setProfile(profiles[(profiles.indexOf(profile) + 1) % profiles.length])
  }

  useEffect(() => {
    setRoastStage(PROFILES[profile].stage)
  }, [profile])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.target.classList.toggle('in-view', entry.isIntersecting)),
      { threshold: 0.16 }
    )
    document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let frame
    const updateRoastFromScroll = () => {
      frame = null
      const section = document.querySelector('#roast-transformation')
      if (!section) return
      const rect = section.getBoundingClientRect()
      const progress = Math.max(0, Math.min(0.999, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)))
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setRoastStage(Math.floor(progress * 5))
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(updateRoastFromScroll)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    let frame
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      document.documentElement.style.setProperty('--route-progress', max > 0 ? window.scrollY / max : 0)
      frame = null
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  const profileMatches = useMemo(
    () => BEANS.map((bean) => bean.roast === profile),
    [profile]
  )

  function addToCart(bean) {
    setCart((items) => [...items, bean.id])
  }

  function submitContact(event) {
    event.preventDefault()
    if (!email.includes('@')) return
    setSent(true)
  }

  return (
    <div className="showcase-site" style={{ '--profile-color': profileData.color }}>
      <div className="route-line" aria-hidden="true" />
      <nav className="roast-nav" id="site-nav" aria-label="Primary navigation">
        <a className="brand" href="#hero"><span>Northwind</span><small>Coffee roasters / Bergen</small></a>
        <div className="nav-temperature"><i /> Live roast · {profileData.temp}</div>
        <div className="nav-links">
          <a href="#beans">Beans</a>
          <a href="#brew-guide">Brew guide</a>
          <a href="#reviews">Reviews</a>
          <a href="#subscribe">Subscribe</a>
          <a href="#contact">Contact</a>
        </div>
        <a className="cart-count" href="#beans" aria-label={`${cart.length} items in cart`}>Bag / {String(cart.length).padStart(2, '0')}</a>
      </nav>

      <header className="roast-hero" id="hero">
        <div className="hero-grid-mark" aria-hidden="true">60.392° N<br />005.323° E</div>
        <div className="hero-copy" data-reveal>
          <span className="kicker">Roasted the morning it ships</span>
          <h1>First crack.<br /><em>Then north.</em></h1>
          <p>Small-batch coffee roasted on a 1962 Probat in Bergen, Norway. Freshness isn’t a slogan here; it’s a timestamp on the bag.</p>
          <div className="hero-actions">
            <a className="action action-fill" href="#beans">Shop the beans <Arrow /></a>
            <a className="action" href="#brew-guide">Learn to brew <Arrow /></a>
          </div>
        </div>
        <button
          type="button"
          className="hero-machine"
          data-reveal
          data-profile={profile}
          aria-label={`Cycle roast profile. Current profile: ${profile}`}
          onClick={cycleProfile}
        >
          <ThreeChamber stage={roastStage} />
          <span className="profile-caliper" data-profile={profile} style={{ '--profile-index': Object.keys(PROFILES).indexOf(profile) }} aria-label={`${profile} roast material gauge`} />
          <div className="machine-overlay">
            <span>Drum no. 1962–P / {profileData.code}</span><span>Batch capacity 12kg</span>
          </div>
        </button>
        <div className="profile-instrument" aria-label="Choose roast profile">
          <div><span>Choose your roast</span><strong>{profileData.code}</strong></div>
          {Object.keys(PROFILES).map((name) => (
            <button
              type="button"
              key={name}
              onClick={() => setProfile(name)}
              className={profile === name ? 'active' : ''}
              aria-pressed={profile === name}
            >
              <i /> {name}
            </button>
          ))}
          <p>{profileData.copy}</p>
        </div>
      </header>

      <main>
        <section className="story-section" id="story">
          <div className="section-index">01 / Provenance</div>
          <div className="story-heading" data-reveal>
            <span>Small on purpose</span>
            <h2>Two roasters.<br />One machine.<br /><em>Eleven farms.</em></h2>
          </div>
          <div className="machine-blueprint" data-reveal aria-hidden="true">
            <div className="blueprint-ring ring-one" />
            <div className="blueprint-ring ring-two" />
            <div className="blueprint-axis" />
            <span>PROBAT<br />SECTION 62–A</span>
          </div>
          <div className="story-copy" data-reveal>
            <p>Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still small on purpose: two roasters, one machine, and direct relationships with eleven farms across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra.</p>
            <p>We pay on average 2.4× the commodity price and publish every contract.</p>
          </div>
          <div className="proof-grid">
            {[['11', 'partner farms'], ['2.4×', 'commodity price paid'], ['12kg', 'max batch size'], ['<24h', 'roast to shipment']].map(([value, label], index) => (
              <div className="proof-stat" data-reveal key={label} style={{ '--delay': `${index * 80}ms` }}>
                <span>0{index + 1}</span><strong>{value}</strong><small>{label}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="bean-section" id="beans">
          <div className="section-index">02 / Current lots</div>
          <header className="catalogue-head" data-reveal>
            <div><span>July selection / six lots</span><h2>Find your<br /><em>frequency.</em></h2></div>
            <p>The catalogue reorganizes around your {profile.toLowerCase()} roast profile. Select an origin to open its batch record.</p>
          </header>
          <div className="bean-stage" data-reveal>
            <div className="origin-rail" role="tablist" aria-label="Coffee origins">
              {BEANS.map((bean, index) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeBean === index}
                  className={activeBean === index ? 'active' : ''}
                  onClick={() => setActiveBean(index)}
                  key={bean.id}
                >
                  <span>{bean.code}</span><strong>{bean.origin}</strong><small>{bean.roast}</small>
                </button>
              ))}
            </div>
            <article className="featured-bean" data-bean={BEANS[activeBean].id}>
              <div className="bean-orbit" aria-hidden="true">
                <div className="bean-object"><i /></div>
                <span>{BEANS[activeBean].altitude}</span>
              </div>
              <div className="bean-record">
                <span className="batch-code">Batch {BEANS[activeBean].code} / {profileMatches[activeBean] ? 'profile match' : 'alternate expression'}</span>
                <h3><small>{BEANS[activeBean].origin}</small>{BEANS[activeBean].name}</h3>
                <p>{BEANS[activeBean].notes}</p>
                <dl>
                  <div><dt>Roast</dt><dd>{BEANS[activeBean].roast}</dd></div>
                  <div><dt>Weight</dt><dd>250g</dd></div>
                  <div><dt>Altitude</dt><dd>{BEANS[activeBean].altitude}</dd></div>
                </dl>
                <div className="bean-purchase">
                  <strong>${BEANS[activeBean].price}</strong>
                  <button type="button" onClick={() => addToCart(BEANS[activeBean])}>
                    {cart.includes(BEANS[activeBean].id) ? 'Add another' : 'Add to bag'} <Arrow />
                  </button>
                </div>
              </div>
            </article>
            <div className="quick-buy" aria-label="Quick add all beans">
              {BEANS.map((bean) => (
                <button type="button" onClick={() => addToCart(bean)} key={bean.id}>
                  <span>{bean.code}</span><span>{bean.origin} {bean.name}</span><strong>${bean.price}</strong><i>+</i>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="roast-peak" id="roast-transformation">
          <div className="section-index">03 / Inside the drum</div>
          <div className="roast-sticky">
          <div className="roast-copy" data-reveal>
            <span>1962 Probat / live section</span>
            <h2>Heat becomes<br /><em>flavour.</em></h2>
            <p>A roast isn’t a color. It’s a curve: energy enters, moisture leaves, pressure builds, and the bean opens.</p>
          </div>
          <div className="roast-render" data-reveal>
            <ThreeChamber stage={roastStage} />
            <div className="roast-geometry" data-stage={roastStage} style={{ '--stage': roastStage }} aria-label={`Thermal development curve, stage ${roastStage + 1} of 5`}>
              <i /><i /><i /><i /><i />
            </div>
          </div>
          <div className="roast-timeline" aria-label="Roast transformation stages">
            {['Charge', 'Drying', 'First crack', 'Development', 'Drop'].map((name, index) => (
              <button type="button" onClick={() => setRoastStage(index)} className={roastStage === index ? 'active' : ''} key={name}>
                <span>0{index + 1}</span><strong>{name}</strong><i />
              </button>
            ))}
          </div>
          </div>
        </section>

        <section className="brew-section" id="brew-guide">
          <div className="section-index">04 / Brew instrument</div>
          <header data-reveal><span>Your pour-over field manual</span><h2>Four moves.<br /><em>Three minutes.</em></h2></header>
          <div className="brew-instrument">
            {STEPS.map((step, index) => (
              <article className="brew-step" data-reveal key={step.n} style={{ '--delay': `${index * 90}ms` }}>
                <div className={`brew-glyph glyph-${index + 1}`} aria-hidden="true"><i /><i /><i /></div>
                <div className="step-meta"><span>{step.n}</span><strong>{step.value}</strong></div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="review-section" id="reviews">
          <div className="section-index">05 / Field reports</div>
          <div className="review-intro" data-reveal><span>Opened after arrival</span><h2>Freshness,<br /><em>reported back.</em></h2></div>
          <div className="dispatch-stack">
            {REVIEWS.map((review, index) => (
              <blockquote className="dispatch-note" data-reveal key={review.name} style={{ '--note-index': index, '--delay': `${index * 100}ms` }}>
                <header><span>Northwind dispatch</span><strong>{review.stamp}</strong></header>
                <p>“{review.quote}”</p>
                <footer><strong>{review.name}</strong><span>{review.role}</span></footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section className="subscribe-section" id="subscribe">
          <div className="section-index">06 / Recurring dispatch</div>
          <div className="subscription-copy" data-reveal>
            <span>Next roast / first Tuesday</span>
            <h2>Your month,<br /><em>packed fresh.</em></h2>
            <p>Two 250g bags of our current favourites, every month, free shipping, pause any time.</p>
            <div className="subscription-price"><strong>$29</strong><span>/ month<br />shipping included</span></div>
            <a className="action action-fill" href="#contact">Start a subscription <Arrow /></a>
          </div>
          <div
            className="packing-stage"
            data-reveal
            aria-label={`Cycle subscription roast profile. Current profile: ${profile}`}
            role="button"
            tabIndex="0"
            onClick={cycleProfile}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') cycleProfile()
            }}
          >
            <div className="crate-back" />
            <div className="coffee-bag bag-one"><span>Northwind</span><strong>{profile}</strong><small>{profileData.code} / 250g</small></div>
            <div className="coffee-bag bag-two"><span>Northwind</span><strong>Guest lot</strong><small>Rotates monthly / 250g</small></div>
            <div className="crate-front"><span>BRG → YOU</span><strong>ROASTED &lt;24H</strong></div>
            <div className="packing-stamp">Dispatch<br />approved</div>
            <button
              type="button"
              className="packing-control"
              onClick={(event) => {
                event.stopPropagation()
                cycleProfile()
              }}
            >
              Change pack / {profileData.code} <Arrow />
            </button>
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div className="section-index">07 / Open channel</div>
          <div className="contact-copy" data-reveal>
            <span>Two roasters read every note</span>
            <h2>Talk to<br /><em>the source.</em></h2>
            <p>Questions, wholesale, or just coffee talk. We reply from Bergen within a day.</p>
          </div>
          <div className="signal-field" aria-hidden="true"><i /><i /><i /><i /><span>BRG / CHANNEL 05</span></div>
          {sent ? (
            <div className="transmission-success" role="status"><span>Transmission received</span><strong>We’ll reply within a day.</strong><i /></div>
          ) : (
            <form className="radio-form" onSubmit={submitContact} data-reveal>
              <label htmlFor="email"><span>01 / Return address</span><input id="email" name="email" type="email" required placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              <label htmlFor="message"><span>02 / Message</span><textarea id="message" name="message" rows="4" placeholder="Questions, wholesale, or just coffee talk" value={message} onChange={(event) => setMessage(event.target.value)} /></label>
              <button type="submit">Transmit message <Arrow /></button>
            </form>
          )}
        </section>
      </main>

      <footer className="roast-footer" id="site-footer">
        <div className="cooling-rail" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</div>
        <div className="footer-mark"><span>Northwind</span><strong>Coffee<br />Roasters</strong><small>Bergen, Norway<br />Est. 2014</small></div>
        <div className="footer-dispatch"><span>Batch closed</span><strong>Roasted today.<br />Moving north.</strong></div>
        <div className="footer-links">
          <a href="#hero">Top</a><a href="/shipping">Shipping</a><a href="/returns">Returns</a><a href="/privacy">Privacy</a>
        </div>
        <p>© 2026 Northwind Coffee Roasters — Bergen, Norway</p>
      </footer>
    </div>
  )
}
