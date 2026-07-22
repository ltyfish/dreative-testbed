import { useEffect, useMemo, useState } from 'react'

const BEANS = [
  { id: 'ethiopia', country: 'Ethiopia', name: 'Yirgacheffe', notes: 'Jasmine, lemon zest, honey', roast: 'Light', price: 18, altitude: '1,950m', process: 'Washed', color: '#d9e2b6' },
  { id: 'colombia', country: 'Colombia', name: 'Huila', notes: 'Caramel, red apple, cocoa', roast: 'Medium', price: 16, altitude: '1,800m', process: 'Washed', color: '#e8b767' },
  { id: 'sumatra', country: 'Sumatra', name: 'Mandheling', notes: 'Dark chocolate, cedar, earth', roast: 'Dark', price: 17, altitude: '1,500m', process: 'Wet hulled', color: '#a75d3f' },
  { id: 'kenya', country: 'Kenya', name: 'AA Nyeri', notes: 'Blackcurrant, tomato, brown sugar', roast: 'Light', price: 19, altitude: '1,900m', process: 'Washed', color: '#c56f72' },
  { id: 'guatemala', country: 'Guatemala', name: 'Antigua', notes: 'Milk chocolate, orange, almond', roast: 'Medium', price: 16, altitude: '1,700m', process: 'Washed', color: '#e89348' },
  { id: 'decaf', country: 'Blend', name: 'Swiss Water Decaf', notes: 'Toffee, hazelnut, smooth', roast: 'Medium', price: 15, altitude: 'Mixed', process: 'Swiss Water', color: '#b9a5c7' },
]

const STEPS = [
  { n: '01', title: 'Weigh', body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.', cue: '18g / 300ml' },
  { n: '02', title: 'Grind', body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.', cue: 'Medium-fine' },
  { n: '03', title: 'Bloom', body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.', cue: '36g / 30 sec' },
  { n: '04', title: 'Pour', body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.', cue: '2:30 pour' },
]

const REVIEWS = [
  { quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.', name: 'Maya T.', role: 'Subscriber since 2022' },
  { quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.', name: 'Daniel R.', role: 'Home barista' },
  { quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.', name: 'Priya S.', role: 'Gift subscriber' },
]

function BeanGlyph({ bean, large = false }) {
  return <span className={`bean-glyph ${large ? 'bean-glyph--large' : ''}`} style={{ '--bean': bean.color }} aria-hidden="true"><i /></span>
}

export default function App() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [activeBean, setActiveBean] = useState(BEANS[0])
  const [roast, setRoast] = useState(62)
  const [brewStep, setBrewStep] = useState(0)
  const [cartMessage, setCartMessage] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [scroll, setScroll] = useState(0)

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight
      setScroll(max > 0 ? scrollY / max : 0)
    }
    update()
    addEventListener('scroll', update, { passive: true })
    return () => removeEventListener('scroll', update)
  }, [])

  useEffect(() => {
    if (!cartMessage) return
    const timer = setTimeout(() => setCartMessage(''), 2600)
    return () => clearTimeout(timer)
  }, [cartMessage])

  const roastLabel = roast < 42 ? 'Citrus lift' : roast < 72 ? 'Caramel balance' : 'Cocoa depth'
  const roastColor = useMemo(() => `hsl(${28 - roast * .12} 52% ${62 - roast * .32}%)`, [roast])

  function addToCart(bean) {
    setCartMessage(`${bean.country} ${bean.name} added to your bag`)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!e.currentTarget.checkValidity()) return
    setSent(true)
    setEmail('')
    setMessage('')
  }

  return (
    <div className="page" style={{ '--journey': scroll }}>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="progress" aria-hidden="true"><span style={{ transform: `scaleX(${scroll})` }} /></div>
      <nav className="nav" id="site-nav" aria-label="Primary navigation">
        <a className="brand" href="#hero" aria-label="Northwind Coffee Roasters home">
          <span className="brand-mark">N</span><span>Northwind<br />Coffee Roasters</span>
        </a>
        <button className="menu-button" type="button" aria-expanded={menuOpen} aria-controls="nav-links" onClick={() => setMenuOpen(!menuOpen)}>Menu <span>{menuOpen ? '×' : '↗'}</span></button>
        <div className={`nav-links ${menuOpen ? 'is-open' : ''}`} id="nav-links">
          <a href="#beans" onClick={() => setMenuOpen(false)}>Beans</a>
          <a href="#brew-guide" onClick={() => setMenuOpen(false)}>Brew Guide</a>
          <a href="#reviews" onClick={() => setMenuOpen(false)}>Reviews</a>
          <a href="#subscribe" onClick={() => setMenuOpen(false)}>Subscribe</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        </div>
        <span className="nav-meta">Bergen · 60.39° N<br />Roasting since 2014</span>
      </nav>

      <main id="main">
        <header className="hero" id="hero">
          <div className="hero-kicker"><span>Batch NW–0722</span><span>Roasted 06:40 CET</span></div>
          <div className="hero-copy">
            <p className="eyebrow">From green bean to first pour</p>
            <h1>Roasted this<br /><em>morning.</em><br />Gone by noon.</h1>
            <p className="hero-intro">Small-batch coffee from eleven partner farms, roasted on a 1962 Probat in Bergen and shipped while it is still telling time.</p>
            <div className="hero-actions">
              <a className="button button--light" href="#beans">Shop the beans <span>↓</span></a>
              <a className="text-link" href="#brew-guide">Learn to brew <span>↘</span></a>
            </div>
          </div>
          <div className="hero-machine" aria-hidden="true">
            <div className="machine-orbit"><span>ROAST · REST · PACK · SHIP ·</span></div>
            <div className="machine-drum"><div className="machine-window"><span>12</span><small>KG MAX</small></div></div>
            <div className="machine-leg machine-leg--left" /><div className="machine-leg machine-leg--right" />
            <p>PROBAT<br />1962</p>
          </div>
          <div className="hero-route" aria-hidden="true"><span>Origin</span><i /><span>Bergen</span><i /><span>Your cup</span></div>
        </header>

        <section className="story" id="story">
          <div className="section-index"><span>01</span><span>The roastery</span></div>
          <div className="story-lead">
            <p className="eyebrow">Small on purpose</p>
            <h2>Twelve kilos.<br />Two roasters.<br /><em>No warehouse.</em></h2>
          </div>
          <div className="story-copy">
            <p>Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still small on purpose: two roasters, one machine, and direct relationships with eleven farms across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra.</p>
            <p>We pay on average 2.4× the commodity price and publish every contract.</p>
          </div>
          <div className="stats" aria-label="Northwind facts">
            <div><strong>11</strong><span>Partner<br />farms</span></div>
            <div><strong>2.4×</strong><span>Commodity<br />price paid</span></div>
            <div><strong>12<small>kg</small></strong><span>Maximum<br />batch</span></div>
            <div><strong>&lt;24<small>h</small></strong><span>Roast to<br />shipment</span></div>
          </div>
        </section>

        <section className="origins" id="beans">
          <div className="section-index section-index--light"><span>02</span><span>Choose an origin</span></div>
          <div className="origins-head">
            <div><p className="eyebrow">This month’s beans</p><h2>Six lots.<br /><em>One moving harvest.</em></h2></div>
            <p>Choose a lot to open its field notes. Every coffee is roasted to reveal its own structure—not to match a house taste.</p>
          </div>
          <div className="origin-instrument" id="origin-bean-selector">
            <div className="origin-visual" style={{ '--active-bean': activeBean.color }}>
              <span className="origin-coordinates">LOT {String(BEANS.indexOf(activeBean) + 1).padStart(2, '0')} / 06</span>
              <BeanGlyph bean={activeBean} large />
              <div className="origin-rings" aria-hidden="true"><i /><i /><i /></div>
              <p>{activeBean.country}</p>
            </div>
            <div className="origin-detail" aria-live="polite">
              <p className="eyebrow">Selected lot</p>
              <h3>{activeBean.country}<br /><em>{activeBean.name}</em></h3>
              <p className="tasting">{activeBean.notes}</p>
              <dl><div><dt>Roast</dt><dd>{activeBean.roast}</dd></div><div><dt>Altitude</dt><dd>{activeBean.altitude}</dd></div><div><dt>Process</dt><dd>{activeBean.process}</dd></div></dl>
              <div className="buy-row"><span>${activeBean.price} <small>/ 250g</small></span><button type="button" onClick={() => addToCart(activeBean)}>Add to bag <span>+</span></button></div>
            </div>
            <div className="origin-tabs" role="list" aria-label="Coffee origins">
              {BEANS.map((bean, index) => <button type="button" role="listitem" className={activeBean.id === bean.id ? 'is-active' : ''} aria-pressed={activeBean.id === bean.id} key={bean.id} onClick={() => setActiveBean(bean)}><span>0{index + 1}</span>{bean.country}<small>{bean.name}</small></button>)}
            </div>
          </div>
          <div className="all-beans" aria-label="All available beans">
            {BEANS.map(bean => <article key={bean.id} data-bean={bean.id}><BeanGlyph bean={bean} /><div><p>{bean.country}</p><h3>{bean.name}</h3><span>{bean.notes}</span></div><div><span>{bean.roast} · 250g</span><strong>${bean.price}</strong><button type="button" onClick={() => addToCart(bean)}>Add <span>+</span></button></div></article>)}
          </div>
        </section>

        <section className="roast-lab" id="roast-lab">
          <div className="section-index section-index--dark"><span>03</span><span>Inside the drum</span></div>
          <div className="roast-copy"><p className="eyebrow">1962 Probat</p><h2>Heat is not<br />a flavour.<br /><em>It is a decision.</em></h2><p>Drag the profile through the roast. Watch a green bean lose moisture, build sweetness, and arrive at its first crack.</p></div>
          <div className="roast-dial" id="roast-profile" style={{ '--roast-color': roastColor, '--roast': `${roast}%` }}>
            <div className="dial-face"><div className="dial-bean"><i /></div><span className="dial-temp">{Math.round(150 + roast * .55)}°</span><span className="dial-time">{Math.floor(6 + roast / 18)}:{String(Math.round(roast % 18 * 3.3)).padStart(2, '0')}</span></div>
            <label htmlFor="roast-range"><span>Green</span><strong>{roastLabel}</strong><span>Dark</span></label>
            <input id="roast-range" type="range" min="0" max="100" value={roast} onChange={e => setRoast(Number(e.target.value))} aria-label="Explore roast profile" />
          </div>
          <div className="roast-notes"><span>Moisture release</span><span>Maillard reaction</span><span>First crack</span></div>
        </section>

        <section className="brew" id="brew-guide">
          <div className="section-index"><span>04</span><span>The first pour</span></div>
          <div className="brew-head"><div><p className="eyebrow">Brew guide</p><h2>Four quiet<br /><em>decisions.</em></h2></div><p>Pour over rewards attention, not expensive equipment. Move through the sequence; the recipe stays the same.</p></div>
          <div className="brew-stage">
            <div className="brew-vessel" aria-hidden="true"><span style={{ height: `${18 + brewStep * 18}%` }} /><i className={`pour pour--${brewStep}`} /></div>
            <div className="brew-cue"><span>Step {STEPS[brewStep].n}</span><strong>{STEPS[brewStep].cue}</strong></div>
          </div>
          <ol className="brew-steps">
            {STEPS.map((step, index) => <li key={step.n} className={brewStep === index ? 'is-active' : ''}><button type="button" className={brewStep === index ? 'is-active' : ''} onMouseEnter={() => setBrewStep(index)} onFocus={() => setBrewStep(index)} onClick={() => setBrewStep(index)}><span>{step.n}</span><h3>{step.title}</h3><p>{step.body}</p><i>↗</i></button></li>)}
          </ol>
        </section>

        <section className="reviews" id="reviews">
          <div className="section-index section-index--light"><span>05</span><span>At the table</span></div>
          <p className="eyebrow">Subscriber notes</p>
          <h2>Passed<br /><em>cup to cup.</em></h2>
          <div className="review-track">{REVIEWS.map((review, i) => <blockquote key={review.name}><span>“</span><p>{review.quote}</p><footer><strong>{review.name}</strong><small>{review.role}</small><i>0{i + 1}</i></footer></blockquote>)}</div>
        </section>

        <section className="subscribe" id="subscribe">
          <div className="subscription-disc" aria-hidden="true"><span>29</span><small>USD / MONTH</small></div>
          <div><p className="eyebrow">The Northwind subscription</p><h2>A new origin,<br /><em>while it is new.</em></h2><p>Two 250g bags of our current favourites, every month, free shipping, pause any time. $29/month.</p><a className="button button--dark" href="#contact">Start a subscription <span>↘</span></a></div>
          <p className="subscription-note">Roasted Tuesday<br />Dispatched Wednesday<br />In your cup by the weekend</p>
        </section>

        <section className="contact" id="contact">
          <div className="section-index"><span>06</span><span>Open channel</span></div>
          <div className="contact-head"><p className="eyebrow">Bergen is listening</p><h2>Questions,<br />wholesale, or<br /><em>coffee talk.</em></h2></div>
          {sent ? <div className="form-success" role="status"><span>✓</span><h3>Message received.</h3><p>Thanks — we read everything and reply within a day.</p><button type="button" onClick={() => setSent(false)}>Send another</button></div> : <form className="contact-form" onSubmit={handleSubmit}><label htmlFor="email">Email address</label><input id="email" name="email" type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} /><label htmlFor="message">Your message</label><textarea id="message" name="message" rows="4" placeholder="Questions, wholesale, or just coffee talk" value={message} onChange={e => setMessage(e.target.value)} /><button type="submit">Send north <span>↗</span></button></form>}
        </section>
      </main>

      <footer className="footer" id="site-footer"><a className="brand brand--footer" href="#hero"><span className="brand-mark">N</span><span>Northwind<br />Coffee Roasters</span></a><p>© 2026 Northwind Coffee Roasters<br />Bergen, Norway</p><div className="footer-links"><a href="#hero">Top</a><a href="/shipping">Shipping</a><a href="/returns">Returns</a><a href="/privacy">Privacy</a></div></footer>
      {cartMessage && <div className="toast" role="status"><span>Added</span>{cartMessage}<button type="button" onClick={() => setCartMessage('')} aria-label="Dismiss">×</button></div>}
    </div>
  )
}
