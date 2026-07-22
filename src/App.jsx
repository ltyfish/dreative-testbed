import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import roasteryImage from './assets/probat-roastery.png'

gsap.registerPlugin(ScrollTrigger)

const BEANS = [
  { id: 'ethiopia', origin: 'Ethiopia · Worka', name: 'Ethiopia Yirgacheffe', notes: 'Jasmine, lemon zest, honey', roast: 'Light', price: 18, altitude: '1,980m', tone: '#c8a24b' },
  { id: 'colombia', origin: 'Colombia · Huila', name: 'Colombia Huila', notes: 'Caramel, red apple, cocoa', roast: 'Medium', price: 16, altitude: '1,750m', tone: '#a74b32' },
  { id: 'sumatra', origin: 'Indonesia · Sumatra', name: 'Sumatra Mandheling', notes: 'Dark chocolate, cedar, earth', roast: 'Dark', price: 17, altitude: '1,400m', tone: '#4f5e48' },
  { id: 'kenya', origin: 'Kenya · Nyeri', name: 'Kenya AA Nyeri', notes: 'Blackcurrant, tomato, brown sugar', roast: 'Light', price: 19, altitude: '1,850m', tone: '#71434e' },
  { id: 'guatemala', origin: 'Guatemala · Antigua', name: 'Guatemala Antigua', notes: 'Milk chocolate, orange, almond', roast: 'Medium', price: 16, altitude: '1,600m', tone: '#c46d36' },
  { id: 'decaf', origin: 'Seasonal · Swiss Water', name: 'Swiss Water Decaf Blend', notes: 'Toffee, hazelnut, smooth', roast: 'Medium', price: 15, altitude: 'Mixed', tone: '#5b7181' },
]

const STEPS = [
  { n: '01', title: 'Weigh', body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.', metric: '18g / 300ml' },
  { n: '02', title: 'Grind', body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.', metric: 'Medium-fine' },
  { n: '03', title: 'Bloom', body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.', metric: '36g / 30 sec' },
  { n: '04', title: 'Pour', body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.', metric: '03:00 total' },
]

const REVIEWS = [
  { quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.', name: 'Maya T.', role: 'Subscriber since 2022' },
  { quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.', name: 'Daniel R.', role: 'Home barista' },
  { quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.', name: 'Priya S.', role: 'Gift subscriber' },
]

function Mark() {
  return <span className="mark" aria-label="Northwind Coffee Roasters"><i>N</i><span>Northwind<br/>Coffee Roasters</span></span>
}

export default function App() {
  const pageRef = useRef(null)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [cartNote, setCartNote] = useState('')

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const lab = pageRef.current?.querySelector('.roast-lab')
    const sticky = pageRef.current?.querySelector('.roast-sticky')
    const live = pageRef.current?.querySelector('.roast-live')
    const updateRoastState = () => {
      if (!lab || !sticky || !live) return
      const progress = Math.max(0, Math.min(1, -lab.getBoundingClientRect().top / (lab.offsetHeight - innerHeight)))
      const phase = progress < .3 ? 'charge' : progress < .68 ? 'maillard' : 'crack'
      sticky.dataset.phase = phase
      live.textContent = phase === 'charge' ? '01 / Charge / 095°C' : phase === 'maillard' ? '02 / Maillard / 156°C' : '03 / First crack / 203°C'
    }
    addEventListener('scroll', updateRoastState, { passive: true })
    updateRoastState()
    const ctx = gsap.context(() => {
      gsap.from('.hero-copy > *', { y: 34, opacity: 0, duration: 1, stagger: .09, ease: 'power3.out' })
      gsap.to('.hero-media img', { scale: 1.08, yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
      gsap.utils.toArray('.reveal').forEach((el) => gsap.from(el, { y: 42, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' } }))
      const stages = gsap.utils.toArray('.roast-phase')
      const tl = gsap.timeline({ scrollTrigger: { trigger: '.roast-lab', start: 'top top', end: 'bottom bottom', scrub: 1 } })
      tl.to('.roast-drum', { rotate: 120, '--heat': '#766846', duration: 1 })
        .to('.roast-drum', { rotate: 250, '--heat': '#b45a2e', duration: 1 })
        .to('.roast-drum', { rotate: 410, '--heat': '#e8642c', duration: 1 })
      stages.forEach((stage, i) => ScrollTrigger.create({ trigger: stage, start: 'top center', end: 'bottom center', onToggle: ({isActive}) => isActive && document.querySelectorAll('.roast-phase').forEach((x, j) => x.classList.toggle('is-active', i === j)) }))
      gsap.to('.brew-line', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.brew-grid', start: 'top 72%', end: 'bottom 62%', scrub: true } })
    }, pageRef)
    return () => { removeEventListener('scroll', updateRoastState); ctx.revert() }
  }, [])

  function addBean(name) {
    setCartNote(`${name} added to your roast list.`)
    window.clearTimeout(window.__northwindToast)
    window.__northwindToast = window.setTimeout(() => setCartNote(''), 2600)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    setSent(true); setEmail(''); setMessage('')
  }

  return (
    <div className="page" ref={pageRef}>
      <a className="skip-link" href="#main">Skip to content</a>
      <nav className="nav" id="site-nav">
        <a href="#hero" className="brand-link"><Mark /></a>
        <div className="nav-links">
          <a href="#beans">Beans</a><a href="#brew-guide">Brew guide</a><a href="#reviews">Reviews</a><a href="#subscribe">Subscribe</a><a href="#contact">Contact</a>
        </div>
        <a className="nav-shop" href="#beans">Shop <span>↘</span></a>
      </nav>

      <main id="main">
        <header className="hero" id="hero">
          <div className="hero-media" aria-hidden="true"><img src={roasteryImage} alt="" /></div>
          <div className="hero-wash" />
          <div className="hero-copy">
            <p className="eyebrow"><span>Batch 0722</span><span>Bergen · 05:42</span></p>
            <h1>Roasted<br/><em>this morning.</em></h1>
            <p className="hero-dek">Small-batch coffee, roasted the morning it ships. A freshness promise you can read on every bag.</p>
            <div className="hero-actions"><a className="btn btn-light" href="#beans">Shop the beans <span>↘</span></a><a className="text-link" href="#brew-guide">Learn to brew <span>↓</span></a></div>
          </div>
          <div className="hero-stamp"><span>Roast</span><strong>05:42</strong><small>Ships before 14:00</small></div>
          <p className="hero-caption">Our 1962 Probat<br/>Bergen, Norway</p>
        </header>

        <section className="story" id="story">
          <div className="section-index">01 / The shed</div>
          <div className="story-lead reveal"><p className="kicker">Small on purpose</p><h2>Two roasters.<br/>One old machine.<br/><em>No warehouse coffee.</em></h2></div>
          <div className="story-body reveal">
            <p>Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still small on purpose: two roasters, one machine, and direct relationships with eleven farms across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra.</p>
            <p>We pay on average 2.4× the commodity price and publish every contract. Freshness is not a slogan here; it is a timestamp on the bag.</p>
          </div>
          <div className="stats reveal">
            <div><strong>11</strong><span>partner farms</span></div><div><strong>2.4×</strong><span>commodity price paid</span></div><div><strong>12kg</strong><span>max batch size</span></div><div><strong>&lt;24h</strong><span>roast to shipment</span></div>
          </div>
        </section>

        <section className="roast-lab" id="roast-process">
          <div className="roast-sticky" data-phase="charge">
            <div className="roast-copy"><p className="kicker">Inside batch 0722</p><h2>Heat makes<br/>the flavour<br/><em>visible.</em></h2><p>Three phases. Twelve kilograms. One decision made by smell, sound, and the trier—not software.</p><strong className="roast-live">01 / Charge / 095°C</strong></div>
            <div className="roast-drum" style={{'--heat':'#84915d'}}>
              <svg viewBox="0 0 500 500" role="img" aria-label="Animated diagram of the coffee roast drum">
                <circle cx="250" cy="250" r="218" className="drum-outer"/><circle cx="250" cy="250" r="162" className="drum-inner"/>
                {Array.from({length: 22}).map((_,i)=><ellipse key={i} cx={250 + Math.cos(i*1.7)*110} cy={250 + Math.sin(i*1.7)*110} rx="9" ry="15" transform={`rotate(${i*47} ${250 + Math.cos(i*1.7)*110} ${250 + Math.sin(i*1.7)*110})`} className="bean-shape"/>)}
                <circle cx="250" cy="250" r="34" className="drum-hub"/><path d="M250 78v344M78 250h344" className="drum-spoke"/>
              </svg>
              <div className="temp-readout"><span>095—203</span><small>°C / 12:06</small></div>
            </div>
            <div className="roast-scale"><span>095°</span><i/><span>203°</span></div>
          </div>
          <div className="roast-phases">
            <article className="roast-phase is-active"><span>00:00</span><div><b>01</b><h3>Charge</h3><p>Green coffee meets cast iron. The drum drops to 95°C; grassy aroma fills the shed.</p></div></article>
            <article className="roast-phase"><span>04:20</span><div><b>02</b><h3>Maillard</h3><p>Sugars and amino acids turn straw yellow into cinnamon. Sweetness takes shape.</p></div></article>
            <article className="roast-phase"><span>09:48</span><div><b>03</b><h3>First crack</h3><p>A clean snap tells us the bean has opened. We drop by instinct at 203°C.</p></div></article>
          </div>
        </section>

        <section className="beans" id="beans">
          <div className="beans-head reveal"><div><p className="section-index">02 / The selection</p><h2>This month’s<br/><em>six roasts.</em></h2></div><p>Roasted Tuesday through Friday.<br/>Every bag carries its roast time.</p></div>
          <div className="bean-grid">
            {BEANS.map((b, i) => <article className="bean-card reveal" key={b.id} data-bean={b.id} style={{'--tone':b.tone}}>
              <div className="bean-visual"><span className="bean-number">0{i+1}</span><div className="bag"><span>N</span><small>{b.roast}<br/>roast</small></div><span className="altitude">{b.altitude}</span></div>
              <p className="bean-origin">{b.origin}</p><h3>{b.name}</h3><p className="bean-notes">{b.notes}</p><p className="bean-meta">{b.roast} roast · 250g</p>
              <div className="bean-buy"><span className="bean-price">${b.price}</span><button type="button" onClick={() => addBean(b.name)} aria-label={`Add ${b.name} to cart`}>Add to cart <span>＋</span></button></div>
            </article>)}
          </div>
        </section>

        <section className="brew" id="brew-guide">
          <div className="brew-intro reveal"><p className="section-index">03 / The ritual</p><h2>A better cup<br/>in <em>four moves.</em></h2><p>Pour over rewards attention, not expensive equipment. Start with fresh beans and let time do the rest.</p></div>
          <div className="brew-grid"><i className="brew-line"/>{STEPS.map(s=><article className="brew-step" key={s.n}><span className="step-number">{s.n}</span><div><p className="step-metric">{s.metric}</p><h3>{s.title}</h3><p>{s.body}</p></div></article>)}</div>
        </section>

        <section className="reviews" id="reviews">
          <p className="section-index">04 / Passed hand to hand</p>
          <div className="review-track">{REVIEWS.map((r,i)=><blockquote className="review reveal" key={r.name}><span>0{i+1}</span><p>“{r.quote}”</p><footer><strong>{r.name}</strong><small>{r.role}</small></footer></blockquote>)}</div>
        </section>

        <section className="subscribe" id="subscribe">
          <div className="subscribe-orbit" aria-hidden="true"><span>Fresh roast · Free shipping · Pause anytime · </span></div>
          <div className="subscribe-copy reveal"><p className="kicker">The Northwind subscription</p><h2>Tuesday’s roast.<br/><em>Thursday’s cup.</em></h2><p>Two 250g bags of our current favourites, every month, free shipping, pause any time. <strong>$29/month.</strong></p><a className="btn btn-dark" href="#contact">Start a subscription <span>↘</span></a></div>
          <div className="subscription-bag" aria-hidden="true"><span>N</span><small>ROASTED<br/>FOR YOU</small></div>
        </section>

        <section className="contact" id="contact">
          <div className="contact-title"><p className="section-index">05 / Talk to the roasters</p><h2>Questions,<br/>wholesale, or<br/><em>just coffee talk.</em></h2></div>
          {sent ? <div className="form-success" role="status"><span>✓</span><h3>Message received.</h3><p>Thanks — we read everything and reply within a day.</p></div> : <form className="contact-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label><input id="email" name="email" type="email" required placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/>
            <label htmlFor="message">Message</label><textarea id="message" name="message" rows={4} placeholder="What would you like to know?" value={message} onChange={e=>setMessage(e.target.value)}/>
            <button type="submit" className="send-button">Send message <span>↗</span></button>
          </form>}
        </section>
      </main>

      <footer className="footer" id="site-footer"><Mark/><p>© 2026 Northwind Coffee Roasters<br/>Bergen, Norway</p><div className="footer-links"><a href="#hero">Top</a><a href="/shipping">Shipping</a><a href="/returns">Returns</a><a href="/privacy">Privacy</a></div><p className="footer-note">Roast small.<br/>Send fresh.</p></footer>
      <div className={`cart-toast ${cartNote ? 'is-visible':''}`} role="status">{cartNote}</div>
    </div>
  )
}
