import { useEffect, useRef, useState } from 'react'

const BEANS = [
  { id: 'ethiopia', code: 'ETH–01', name: 'Ethiopia Yirgacheffe', origin: 'Yirgacheffe · 1,950m', notes: ['Jasmine', 'Lemon zest', 'Honey'], roast: 'Light', price: 18, color: '#e9b949' },
  { id: 'colombia', code: 'COL–02', name: 'Colombia Huila', origin: 'Huila · 1,800m', notes: ['Caramel', 'Red apple', 'Cocoa'], roast: 'Medium', price: 16, color: '#e86a4f' },
  { id: 'sumatra', code: 'IDN–03', name: 'Sumatra Mandheling', origin: 'Lintong · 1,500m', notes: ['Dark chocolate', 'Cedar', 'Earth'], roast: 'Dark', price: 17, color: '#795548' },
  { id: 'kenya', code: 'KEN–04', name: 'Kenya AA Nyeri', origin: 'Nyeri · 1,850m', notes: ['Blackcurrant', 'Tomato', 'Brown sugar'], roast: 'Light', price: 19, color: '#c43d5d' },
  { id: 'guatemala', code: 'GTM–05', name: 'Guatemala Antigua', origin: 'Antigua · 1,600m', notes: ['Milk chocolate', 'Orange', 'Almond'], roast: 'Medium', price: 16, color: '#ed7f42' },
  { id: 'decaf', code: 'DCF–06', name: 'Swiss Water Decaf Blend', origin: 'Water process · 0.01%', notes: ['Toffee', 'Hazelnut', 'Smooth'], roast: 'Medium', price: 15, color: '#4f7f72' },
]

const ROAST_STAGES = [
  { name: 'Charge', temp: 195, time: '00:00', note: 'Green coffee enters the cast-iron drum.', tone: '#b9d2bd' },
  { name: 'Drying', temp: 148, time: '04:20', note: 'Moisture leaves. The beans turn straw-gold.', tone: '#d8bb6b' },
  { name: 'Maillard', temp: 171, time: '07:10', note: 'Sugars and amino acids build sweetness.', tone: '#bc7542' },
  { name: 'First crack', temp: 196, time: '09:42', note: 'The batch opens. Aroma becomes audible.', tone: '#7a3f2b' },
  { name: 'Drop', temp: 204, time: '10:38', note: 'Development stops at the exact sweet spot.', tone: '#34201b' },
]

const STEPS = [
  { n: '01', title: 'Weigh', spec: '18g : 300ml', body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.' },
  { n: '02', title: 'Grind', spec: 'Medium–fine', body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.' },
  { n: '03', title: 'Bloom', spec: '36g · 30 sec', body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.' },
  { n: '04', title: 'Pour', spec: '2.5 min', body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.' },
]

const REVIEWS = [
  { quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.', name: 'Maya T.', role: 'Subscriber since 2022' },
  { quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.', name: 'Daniel R.', role: 'Home barista' },
  { quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.', name: 'Priya S.', role: 'Gift subscriber' },
]

function Mark() {
  return <svg className="mark" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="19"/><path d="M13 28c8-1 12-7 18-14-1 9-5 17-14 18-3 0-5-1-6-3 4-4 9-6 14-8"/></svg>
}

function OriginGraphic() {
  return (
    <div className="origin-graphic" aria-hidden="true">
      <svg viewBox="0 0 720 720">
        <circle className="chart-ring r1" cx="360" cy="360" r="270"/><circle className="chart-ring r2" cx="360" cy="360" r="190"/>
        <path className="coast" d="M380 65c20 44 4 76 22 107 20 35 65 36 70 83 5 48-49 68-50 110-2 64 73 81 55 135-13 41-68 42-80 83-9 29 13 55 4 82"/>
        <path className="route" d="M129 488C230 442 239 296 365 271c99-20 132 61 218 17"/>
        <path className="route route-two" d="M160 548c93-82 176-62 229-146 44-71 7-141 108-190"/>
        {[[129,488],[365,271],[583,288],[160,548],[389,402],[497,212]].map(([x,y],i)=><g key={i}><circle className="port-pulse" cx={x} cy={y} r="14"/><circle className="port" cx={x} cy={y} r="4"/></g>)}
        <text x="106" y="522">ORIGIN</text><text x="501" y="196">BERGEN</text>
      </svg>
      <div className="graphic-stamp"><span>Roasted</span><strong>06:42</strong><small>BERGEN / NO</small></div>
    </div>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [roastStage, setRoastStage] = useState(0)
  const [cart, setCart] = useState([])
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const roastRef = useRef(null)

  useEffect(() => {
    const el = roastRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const onScroll = () => {
      const rect = el.getBoundingClientRect()
      const span = Math.max(1, el.offsetHeight - window.innerHeight)
      const progress = Math.min(1, Math.max(0, -rect.top / span))
      setRoastStage(Math.min(ROAST_STAGES.length - 1, Math.floor(progress * ROAST_STAGES.length)))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function addToCart(bean) {
    setCart((items) => [...items, bean.id])
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!email.includes('@')) return
    setSent(true)
    setEmail('')
    setMessage('')
  }

  const stage = ROAST_STAGES[roastStage]

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <nav className="nav" id="site-nav" aria-label="Main navigation">
        <a className="brand" href="#hero" aria-label="Northwind Coffee Roasters, home"><Mark/><span>Northwind</span><small>Coffee Roasters · Bergen</small></a>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="nav-links">{menuOpen ? 'Close' : 'Menu'}</button>
        <div className={`nav-links ${menuOpen ? 'is-open' : ''}`} id="nav-links" onClick={() => setMenuOpen(false)}>
          <a href="#beans">Beans</a><a href="#brew-guide">Brew Guide</a><a href="#reviews">Reviews</a><a href="#subscribe">Subscribe</a><a href="#contact">Contact</a>
        </div>
        <div className="cart-readout" aria-live="polite"><span>Bag</span><strong>{String(cart.length).padStart(2, '0')}</strong></div>
      </nav>

      <main id="main">
        <header className="hero" id="hero">
          <div className="hero-kicker"><span>Batch 0721</span><span>12 kg · Light roast</span><span>Shipping today</span></div>
          <div className="hero-copy">
            <p className="eyebrow">From cold coast to warm cup</p>
            <h1>Roasted at<br/><em>first light.</em></h1>
            <p className="hero-intro">Small-batch coffee, roasted the morning it ships on our 1962 Probat in Bergen, Norway. Freshness is not a slogan here; it is a timestamp on the bag.</p>
            <div className="hero-actions"><a className="button button-hot" href="#beans">Shop today’s roast <span>↘</span></a><a className="text-link" href="#brew-guide">Learn to brew <span>→</span></a></div>
          </div>
          <OriginGraphic/>
          <div className="scroll-cue"><span>Trace the batch</span><i/></div>
        </header>

        <section className="story" id="story">
          <div className="section-index"><span>01</span><small>The roastery</small></div>
          <div className="story-lead"><p className="eyebrow">Small on purpose</p><h2>One old machine.<br/>Eleven lasting<br/><em>relationships.</em></h2></div>
          <div className="story-body"><p>Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still small on purpose: two roasters, one machine, and direct relationships with eleven farms across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra. We pay on average 2.4× the commodity price and publish every contract.</p><div className="story-signoff"><span>Rain outside</span><span>Probat warm</span><span>06:42, Bergen</span></div></div>
          <div className="stats" aria-label="Northwind facts">
            <div className="stat"><strong>11</strong><span>partner farms</span></div><div className="stat"><strong>2.4×</strong><span>commodity price paid</span></div><div className="stat"><strong>12<small>kg</small></strong><span>max batch size</span></div><div className="stat"><strong>&lt;24<small>h</small></strong><span>roast to shipment</span></div>
          </div>
        </section>

        <section className="roast" id="roast" ref={roastRef} style={{'--roast-tone': stage.tone}}>
          <div className="roast-sticky">
            <div className="section-index light"><span>02</span><small>Inside the roast</small></div>
            <div className="roast-copy"><p className="eyebrow">The ten-minute transformation</p><h2>Heat makes<br/><em>flavour visible.</em></h2><p>{stage.note}</p></div>
            <div className="roaster-visual" aria-label={`Roast stage: ${stage.name}, ${stage.temp} degrees Celsius`}>
              <div className="temperature"><span>Bean temp.</span><strong>{stage.temp}<sup>°C</sup></strong></div>
              <div className="drum"><div className="drum-inner">{Array.from({length: 18}).map((_,i)=><i key={i} style={{'--i': i}}/>)}<span className="drum-label">PROBAT<br/><small>1962 · BERGEN</small></span></div></div>
              <svg className="roast-curve" viewBox="0 0 620 170" preserveAspectRatio="none" aria-hidden="true"><path d="M0 150C80 145 83 93 151 102S242 83 289 72 356 75 396 48 478 35 620 12"/><line x1={`${roastStage * 25}%`} x2={`${roastStage * 25}%`} y1="0" y2="170"/></svg>
              <div className="roast-clock"><span>{stage.name}</span><strong>{stage.time}</strong></div>
            </div>
            <div className="stage-controls" aria-label="Roast stages">{ROAST_STAGES.map((item,index)=><button key={item.name} className={index === roastStage ? 'active' : ''} onClick={()=>setRoastStage(index)}><span>{String(index+1).padStart(2,'0')}</span>{item.name}</button>)}</div>
          </div>
        </section>

        <section className="beans" id="beans">
          <div className="section-index"><span>03</span><small>This month’s lots</small></div>
          <div className="beans-heading"><p className="eyebrow">Six distinct coordinates</p><h2>Find your<br/><em>frequency.</em></h2><p>Read the notes, choose the roast, then follow the timestamp from our drum to your door.</p></div>
          <div className="rail-hint" aria-hidden="true"><span>Drag to taste all six</span><i>→</i></div>
          <div className="bean-grid">
            {BEANS.map((bean,index)=><article className="bean-card" key={bean.id} data-bean={bean.id}>
              <div className="bean-top"><span>{bean.code}</span><span>{bean.roast} / 250g</span></div>
              <div className="bean-orbit" style={{'--bean-color':bean.color}} aria-hidden="true"><span>{index+1}</span><i/><i/><i/></div>
              <p className="bean-origin">{bean.origin}</p><h3>{bean.name}</h3>
              <ul className="tasting-notes">{bean.notes.map(note=><li key={note}>{note}</li>)}</ul>
              <div className="bean-buy"><strong>${bean.price}</strong><button type="button" onClick={()=>addToCart(bean)} aria-label={`Add ${bean.name} to cart`}>{cart.includes(bean.id) ? 'Add another' : 'Add to bag'} <span>＋</span></button></div>
            </article>)}
          </div>
        </section>

        <section className="brew" id="brew-guide">
          <div className="section-index light"><span>04</span><small>The daily ritual</small></div>
          <div className="brew-heading"><p className="eyebrow">Pour over / four movements</p><h2>Three quiet<br/><em>minutes.</em></h2><div className="brew-total"><strong>03:00</strong><span>Total brew time</span></div></div>
          <div className="rail-hint rail-hint-light" aria-hidden="true"><span>Swipe through the ritual</span><i>→</i></div>
          <ol className="steps">{STEPS.map((step,index)=><li className="step" key={step.n}>
            <div className="step-visual" aria-hidden="true"><span>{step.n}</span>{index===0&&<div className="scale-icon"><i/></div>}{index===1&&<div className="grind-icon">••••••<br/>••••••</div>}{index===2&&<div className="bloom-icon"><i/><i/><i/></div>}{index===3&&<div className="pour-icon"><i/></div>}</div>
            <div><span className="step-spec">{step.spec}</span><h3>{step.title}</h3><p>{step.body}</p></div>
          </li>)}</ol>
        </section>

        <section className="reviews" id="reviews">
          <div className="section-index"><span>05</span><small>Field notes</small></div>
          <p className="eyebrow">From kitchen counters</p><h2>Proof, poured<br/><em>at home.</em></h2>
          <div className="rail-hint" aria-hidden="true"><span>Three field notes</span><i>→</i></div>
          <div className="review-grid">{REVIEWS.map((review,index)=><blockquote className="review" key={review.name}><span className="quote-mark">“</span><p>{review.quote}</p><footer><strong>{review.name}</strong><span>{review.role}</span><small>Log / 0{index+1}</small></footer></blockquote>)}</div>
        </section>

        <section className="subscribe" id="subscribe">
          <div className="dispatch-stamp"><Mark/><span>Next dispatch</span><strong>01 AUG</strong><small>Bergen → your door</small></div>
          <div><p className="eyebrow">Never run out of the good stuff</p><h2>Two bags.<br/>Every month.<br/><em>Always fresh.</em></h2></div>
          <div className="subscribe-offer"><p>Two 250g bags of our current favourites, every month, free shipping, pause any time.</p><div><strong>$29</strong><span>/ month</span></div><a className="button button-hot" href="#contact">Start a subscription <span>↘</span></a></div>
        </section>

        <section className="contact" id="contact">
          <div className="section-index"><span>06</span><small>Open channel</small></div>
          <div className="contact-heading"><p className="eyebrow">Questions, wholesale, coffee talk</p><h2>Send a<br/><em>signal.</em></h2><p>Bergen, Norway<br/>Mon–Fri / 07:00–16:00 CET</p></div>
          {sent ? <div className="form-success" role="status"><span>Message received</span><strong>Thanks — we read everything and reply within a day.</strong><button type="button" onClick={()=>setSent(false)}>Send another →</button></div> : <form className="contact-form" onSubmit={handleSubmit}>
            <label htmlFor="email"><span>01 / Email</span><input id="email" name="email" type="email" required placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></label>
            <label htmlFor="message"><span>02 / Message</span><textarea id="message" name="message" rows="4" placeholder="Questions, wholesale, or just coffee talk" value={message} onChange={e=>setMessage(e.target.value)}/></label>
            <button type="submit" className="button button-dark">Send message <span>↗</span></button>
          </form>}
        </section>
      </main>

      <footer className="footer" id="site-footer"><a className="brand" href="#hero"><Mark/><span>Northwind</span><small>Coffee Roasters · Bergen</small></a><p>© 2026 Northwind Coffee Roasters — Bergen, Norway</p><div className="footer-links"><a href="#hero">Top</a><a href="/shipping">Shipping</a><a href="/returns">Returns</a><a href="/privacy">Privacy</a></div></footer>
    </div>
  )
}

export default App
