import { useEffect, useRef, useState } from 'react'

const BEANS = [
  { id: 'ethiopia', origin: 'ET', name: 'Ethiopia Yirgacheffe', notes: 'Jasmine, lemon zest, honey', roast: 'Light', price: 18, accent: '#d8ef62', profile: 'Floral / bright', batch: 'NW–0727–E' },
  { id: 'colombia', origin: 'CO', name: 'Colombia Huila', notes: 'Caramel, red apple, cocoa', roast: 'Medium', price: 16, accent: '#ffad61', profile: 'Sweet / round', batch: 'NW–0727–C' },
  { id: 'sumatra', origin: 'ID', name: 'Sumatra Mandheling', notes: 'Dark chocolate, cedar, earth', roast: 'Dark', price: 17, accent: '#86c9ba', profile: 'Deep / grounded', batch: 'NW–0727–S' },
  { id: 'kenya', origin: 'KE', name: 'Kenya AA Nyeri', notes: 'Blackcurrant, tomato, brown sugar', roast: 'Light', price: 19, accent: '#e87590', profile: 'Juicy / vivid', batch: 'NW–0727–K' },
  { id: 'guatemala', origin: 'GT', name: 'Guatemala Antigua', notes: 'Milk chocolate, orange, almond', roast: 'Medium', price: 16, accent: '#e4c06c', profile: 'Balanced / warm', batch: 'NW–0727–G' },
  { id: 'decaf', origin: 'SW', name: 'Swiss Water Decaf Blend', notes: 'Toffee, hazelnut, smooth', roast: 'Medium', price: 15, accent: '#a99bd6', profile: 'Soft / complete', batch: 'NW–0727–D' },
]

const ROAST_STAGES = [
  { phase: 'Charge', temp: '95°', time: '00:00', loss: '0%', title: 'Green potential.', body: 'Dense, cool and grassy. The 1962 Probat takes a precisely weighed 12kg charge.' },
  { phase: 'Drying', temp: '154°', time: '04:20', loss: '7%', title: 'Water becomes momentum.', body: 'Heat moves inward. Moisture escapes while the bean shifts from green to straw and begins to expand.' },
  { phase: 'First crack', temp: '196°', time: '08:34', loss: '12%', title: 'The bean speaks.', body: 'Pressure releases in an audible crack. Sugars develop; origin character becomes legible rather than burnt away.' },
  { phase: 'Drop', temp: '204°', time: '10:12', loss: '14%', title: 'Stop at clarity.', body: 'The batch drops into cooling air. We stop before roast flavour drowns the character of the farm.' },
]

const STEPS = [
  { n: '01', title: 'Weigh', body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.', metric: '18g / 300ml' },
  { n: '02', title: 'Grind', body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.', metric: 'Medium–fine' },
  { n: '03', title: 'Bloom', body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.', metric: '36g / 30 sec' },
  { n: '04', title: 'Pour', body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.', metric: '3 min total' },
]

const REVIEWS = [
  { quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.', name: 'Maya T.', role: 'Subscriber since 2022' },
  { quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.', name: 'Daniel R.', role: 'Home barista' },
  { quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.', name: 'Priya S.', role: 'Gift subscriber' },
]

function Mark() {
  return <a className="mark" href="#hero" aria-label="Northwind home"><span>N</span><b>Northwind<br />Coffee Roasters</b></a>
}

function RoastBean({ stage }) {
  return (
    <div className="roast-object" aria-label={`Coffee bean at ${ROAST_STAGES[stage].phase} stage`}>
      <div className="roast-orbit orbit-a" />
      <div className="roast-orbit orbit-b" />
      <div className="roast-orbit orbit-c" />
      <div className="roast-bean"><i /></div>
    </div>
  )
}

const LEGAL_PAGES = {
  '/shipping': ['Shipping', 'Every order is roasted before dispatch. We ship from Bergen within 24 hours of roasting and send tracking as soon as the carrier scans your parcel.'],
  '/returns': ['Returns', 'Coffee is perishable, but mistakes should be made right. Contact us within 14 days if an order arrives damaged, incorrect, or unusable.'],
  '/privacy': ['Privacy', 'Northwind uses the information you provide to fulfil orders and answer messages. We do not sell personal data.'],
}

function LegalPage({ title, body }) {
  return (
    <div className="legal-page">
      <nav className="legal-nav"><Mark /><a href="/">Back to the roastery →</a></nav>
      <main><p className="kicker">Northwind / practical details</p><h1>{title}<em>.</em></h1><p>{body}</p><a className="button button-hot" href="/">Return home <span>↗</span></a></main>
      <footer>© 2026 Northwind Coffee Roasters — Bergen, Norway</footer>
    </div>
  )
}

export default function App() {
  const [selectedId, setSelectedId] = useState('ethiopia')
  const [roastStage, setRoastStage] = useState(0)
  const [cartMessage, setCartMessage] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const stageRefs = useRef([])
  const roastRef = useRef(null)
  const selected = BEANS.find((bean) => bean.id === selectedId)

  useEffect(() => {
    function updateRoastStage() {
      const node = roastRef.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      const travel = Math.max(1, rect.height - window.innerHeight)
      const progress = Math.min(1, Math.max(0, -rect.top / travel))
      const nextStage = Math.min(3, Math.floor(progress * 4))
      node.dataset.stage = String(nextStage)
      node.style.setProperty('--roast-progress', String(progress))
      setRoastStage(nextStage)
    }
    updateRoastStage()
    window.addEventListener('scroll', updateRoastStage, { passive: true })
    window.addEventListener('resize', updateRoastStage)
    return () => {
      window.removeEventListener('scroll', updateRoastStage)
      window.removeEventListener('resize', updateRoastStage)
    }
  }, [])

  function selectBean(bean) {
    setSelectedId(bean.id)
    document.documentElement.style.setProperty('--origin', bean.accent)
  }

  function cycleOrigin() {
    const origins = BEANS.slice(0, 3)
    const current = origins.findIndex((bean) => bean.id === selectedId)
    selectBean(origins[(current + 1) % origins.length])
  }

  function addToCart(bean) {
    setCartMessage(`${bean.name} added to your roast list.`)
    window.setTimeout(() => setCartMessage(''), 2600)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!email.includes('@')) return
    setSent(true)
    setEmail('')
    setMessage('')
  }

  const legal = LEGAL_PAGES[window.location.pathname]
  if (legal) return <LegalPage title={legal[0]} body={legal[1]} />

  return (
    <div className="site" style={{ '--origin': selected.accent }}>
      <div className="noise" aria-hidden="true" />
      <nav className="nav" id="site-nav" aria-label="Main navigation">
        <Mark />
        <div className="nav-links">
          <a href="#beans">Beans</a><a href="#brew-guide">Brew Guide</a><a href="#reviews">Reviews</a><a href="#subscribe">Subscribe</a><a href="#contact">Contact</a>
        </div>
        <a className="nav-batch" href="#beans">Batch <strong>{selected.batch}</strong></a>
      </nav>

      <main>
        <header className="hero" id="hero">
          <div className="hero-ledger">
            <span>Est. Bergen / 2014</span><span>Roast cycle / 10:12</span><span>Ships / &lt;24h</span>
          </div>
          <div className="hero-copy">
            <p className="kicker">Small-batch coffee / roasted the morning it ships</p>
            <h1>Follow the<br /><em>heat.</em></h1>
            <p className="hero-intro">We roast single-origin beans in 12kg batches on a 1962 Probat in Bergen, Norway, and ship them within hours. Freshness is not a slogan here; it is a timestamp on the bag.</p>
            <div className="hero-actions">
              <a className="button button-hot" href="#beans">Shop the beans <span>↘</span></a>
              <a className="text-link" href="#brew-guide">Learn to brew <span>↓</span></a>
            </div>
          </div>
          <div className="hero-selector" aria-label="Select a coffee origin">
            <div className="selector-label"><p>Select the batch that follows you</p><button data-continuity-source onClick={cycleOrigin}>Cycle origin ↻</button></div>
            {BEANS.slice(0, 3).map((bean, index) => (
              <button className={selectedId === bean.id ? 'active' : ''} key={bean.id} onClick={() => selectBean(bean)}>
                <span>0{index + 1}</span><b>{bean.name.replace(bean.name.split(' ')[0], '')}</b><small>{bean.origin} / {bean.profile}</small>
              </button>
            ))}
          </div>
          <div className="hero-stage" aria-hidden="true">
            <div className="hero-ring" />
            <div className="hero-bean"><i /></div>
            <div className="hero-temp"><span>Batch selected</span><strong>{selected.name}</strong></div>
          </div>
          <div className="scroll-cue">Scroll to enter the roast <span>↓</span></div>
        </header>

        <section className="story" id="story">
          <div className="section-index"><span>01</span><b>Proof before poetry</b></div>
          <div className="story-copy">
            <p className="kicker">Northwind / the short version</p>
            <h2>Small <em>on purpose.</em></h2>
            <p>Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still small on purpose: two roasters, one machine, and direct relationships with eleven farms across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra. We pay on average 2.4× the commodity price and publish every contract.</p>
          </div>
          <div className="stats">
            <div><strong>11</strong><span>Partner farms</span><i>Direct relationships</i></div>
            <div><strong>2.4×</strong><span>Commodity price paid</span><i>Contracts published</i></div>
            <div><strong>12kg</strong><span>Maximum batch</span><i>No industrial scale</i></div>
            <div><strong>&lt;24h</strong><span>Roast to shipment</span><i>Timestamped bags</i></div>
          </div>
        </section>

        <section className="roast-journey" id="roast" data-stage={roastStage} ref={roastRef}>
          <div className="roast-sticky">
            <div className="roast-heading">
              <p className="kicker">Inside the 1962 Probat</p>
              <h2>The roast is a<br /><em>decision, not a colour.</em></h2>
            </div>
            <div className="roast-machine">
              <RoastBean stage={roastStage} />
              <div className="machine-label">PROBAT<br />WERKE<br />1962</div>
              <div className="temperature"><span>Bean temp.</span><strong>{ROAST_STAGES[roastStage].temp}</strong></div>
            </div>
            <div className="roast-live">
              <span>{selected.batch}</span><strong>{selected.name}</strong><small>{selected.notes}</small>
            </div>
            <div className="mobile-stage-controls" aria-label="Roast stages">
              {ROAST_STAGES.map((item, index) => <button key={item.phase} className={index === roastStage ? 'active' : ''} onClick={() => setRoastStage(index)}>{index + 1}</button>)}
            </div>
          </div>
          <div className="roast-chapters">
            {ROAST_STAGES.map((stage, index) => (
              <article key={stage.phase} ref={(node) => { stageRefs.current[index] = node }}>
                <span>0{index + 1} / {stage.time}</span>
                <h3>{stage.title}</h3>
                <p>{stage.body}</p>
                <dl><div><dt>Phase</dt><dd>{stage.phase}</dd></div><div><dt>Mass loss</dt><dd>{stage.loss}</dd></div><div><dt>Temp.</dt><dd>{stage.temp}</dd></div></dl>
              </article>
            ))}
          </div>
        </section>

        <section className="beans" id="beans">
          <div className="beans-head">
            <div className="section-index light"><span>02</span><b>This month’s six</b></div>
            <div><p className="kicker">Roasted this week / shipping now</p><h2>Choose your<br /><em>finish.</em></h2></div>
            <p>The selected roast is carried forward from the chamber. Every bag still gets its own profile and timestamp.</p>
          </div>
          <div className="bean-list">
            {BEANS.map((bean, index) => (
              <article className={selectedId === bean.id ? 'bean-row selected' : 'bean-row'} key={bean.id} data-bean={bean.id} style={{ '--bean-accent': bean.accent }}>
                <button className="bean-select" onClick={() => selectBean(bean)} aria-label={`Select ${bean.name}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span><i className="mini-bean" /><small>{bean.origin}</small>
                </button>
                <div className="bean-name"><p>{bean.roast} roast / 250g</p><h3>{bean.name}</h3></div>
                <div className="bean-taste"><span>Tastes like</span><p>{bean.notes}</p></div>
                <div className="bean-buy"><strong>${bean.price}</strong><button type="button" onClick={() => addToCart(bean)}>Add to cart <span>＋</span></button></div>
              </article>
            ))}
          </div>
          <div className="cart-toast" role="status" aria-live="polite">{cartMessage}</div>
        </section>

        <section className="brew" id="brew-guide">
          <div className="brew-heading">
            <div className="section-index"><span>03</span><b>One reliable ritual</b></div>
            <p className="kicker">Brew guide / pour over</p>
            <h2>Make the work<br /><em>visible.</em></h2>
            <p>Four deliberate moves. No theatre, no expensive guesswork—just a clear expression of {selected.name}.</p>
          </div>
          <ol className="brew-steps">
            {STEPS.map((step) => (
              <li key={step.n}>
                <span>{step.n}</span><div><h3>{step.title}</h3><p>{step.body}</p></div><strong>{step.metric}</strong>
              </li>
            ))}
          </ol>
        </section>

        <section className="reviews" id="reviews">
          <div className="review-marquee" aria-hidden="true">ROASTED TUESDAY / AT MY DOOR THURSDAY / </div>
          <div className="reviews-head"><p className="kicker">Subscriber notes / unedited</p><h2>Freshness,<br /><em>confirmed.</em></h2></div>
          <div className="review-grid">
            {REVIEWS.map((review, index) => (
              <blockquote key={review.name}><span>“</span><p>{review.quote}</p><footer><b>{review.name}</b><small>{review.role}</small><i>0{index + 1}</i></footer></blockquote>
            ))}
          </div>
        </section>

        <section className="subscribe" id="subscribe">
          <div className="subscription-ticket">
            <div className="ticket-top"><Mark /><span>Monthly roast allocation</span></div>
            <div className="ticket-main">
              <div><p className="kicker">Your selected starting point</p><h2>{selected.name}</h2><p>{selected.notes}</p></div>
              <div className="ticket-price"><strong>$29</strong><span>/ month</span></div>
            </div>
            <div className="ticket-meta"><span>2 × 250g bags</span><span>Free shipping</span><span>Pause any time</span><b>{selected.batch}</b></div>
          </div>
          <div className="subscribe-copy">
            <p className="kicker">The Northwind subscription</p>
            <h2>Let the next<br />batch <em>find you.</em></h2>
            <p>Two 250g bags of our current favourites, every month, free shipping, pause any time. $29/month.</p>
            <a className="button button-hot" href="#contact">Start a subscription <span>↘</span></a>
          </div>
        </section>

        <section className="contact" id="contact">
          <div className="contact-title"><div className="section-index"><span>04</span><b>Talk to the roasters</b></div><p className="kicker">Bergen / replies within a day</p><h2>Get in<br /><em>touch.</em></h2></div>
          {sent ? (
            <div className="form-success" role="status"><span>✓</span><h3>Message received.</h3><p>Thanks — we read everything and reply within a day.</p><button onClick={() => setSent(false)}>Send another</button></div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <label htmlFor="email"><span>01</span>Email</label>
              <input id="email" name="email" type="email" required placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
              <label htmlFor="message"><span>02</span>Message</label>
              <textarea id="message" name="message" rows={4} placeholder="Questions, wholesale, or just coffee talk" value={message} onChange={(event) => setMessage(event.target.value)} />
              <button type="submit" className="button button-dark">Send message <span>→</span></button>
            </form>
          )}
        </section>
      </main>

      <footer className="footer" id="site-footer">
        <Mark />
        <p>© 2026 Northwind Coffee Roasters<br />Bergen, Norway</p>
        <div className="footer-links"><a href="#hero">Top</a><a href="/shipping">Shipping</a><a href="/returns">Returns</a><a href="/privacy">Privacy</a></div>
        <div className="footer-stamp">ROASTED<br />TO ORDER</div>
      </footer>
    </div>
  )
}
