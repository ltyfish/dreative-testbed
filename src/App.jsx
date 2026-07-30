import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import roast00 from './assets/roast-frames/frame-00.png'
import roast01 from './assets/roast-frames/frame-01.png'
import roast02 from './assets/roast-frames/frame-02.png'
import roast03 from './assets/roast-frames/frame-03.png'
import roast04 from './assets/roast-frames/frame-04.png'
import roast05 from './assets/roast-frames/frame-05.png'
import roast06 from './assets/roast-frames/frame-06.png'
import roast07 from './assets/roast-frames/frame-07.png'
import roast08 from './assets/roast-frames/frame-08.png'
import roast09 from './assets/roast-frames/frame-09.png'
import roast10 from './assets/roast-frames/frame-10.png'
import roast11 from './assets/roast-frames/frame-11.png'

gsap.registerPlugin(ScrollTrigger)

const FRAMES = [roast00, roast01, roast02, roast03, roast04, roast05, roast06, roast07, roast08, roast09, roast10, roast11]
const STAGES = [
  ['Ready', 'Twelve kilos. Green and dense.', 22],
  ['Charge', 'The hopper opens. The batch enters.', 38],
  ['Seal', 'The last green beans meet the drum.', 52],
  ['Turn', 'Moisture leaves. Color begins.', 96],
  ['Develop', 'Sugar browns. Structure becomes sweetness.', 148],
  ['Sample', 'The trier checks color at first crack.', 174],
  ['Decide', 'Seconds now separate bright from deep.', 194],
  ['Release', 'The drum door breaks the heat.', 201],
  ['Drop', 'The batch falls into moving air.', 202],
  ['Clear', 'The last beans leave the drum.', 188],
  ['Cool', 'Steel arms turn through the batch.', 132],
  ['Ship', 'Roast complete. Timestamp starts now.', 42],
]

const BEANS = [
  { id: 'ethiopia', name: 'Ethiopia Yirgacheffe', origin: 'Konga · 1,980m', notes: 'Jasmine, lemon zest, honey', roast: 'Light', price: 18, profile: 'bright', mark: 'ET' },
  { id: 'colombia', name: 'Colombia Huila', origin: 'San Agustín · 1,750m', notes: 'Caramel, red apple, cocoa', roast: 'Medium', price: 16, profile: 'round', mark: 'CO' },
  { id: 'sumatra', name: 'Sumatra Mandheling', origin: 'Lintong · 1,400m', notes: 'Dark chocolate, cedar, earth', roast: 'Dark', price: 17, profile: 'deep', mark: 'SU' },
  { id: 'kenya', name: 'Kenya AA Nyeri', origin: 'Gachatha · 1,900m', notes: 'Blackcurrant, tomato, brown sugar', roast: 'Light', price: 19, profile: 'bright', mark: 'KE' },
  { id: 'guatemala', name: 'Guatemala Antigua', origin: 'Volcán Agua · 1,600m', notes: 'Milk chocolate, orange, almond', roast: 'Medium', price: 16, profile: 'round', mark: 'GT' },
  { id: 'decaf', name: 'Swiss Water Decaf Blend', origin: 'Water process · 99.9%', notes: 'Toffee, hazelnut, smooth', roast: 'Medium', price: 15, profile: 'deep', mark: 'DE' },
]

const PROFILES = {
  bright: { label: 'Bright', description: 'Floral · citrus · lifted', bean: 'ethiopia', ratio: '18g / 300ml', grind: 'Medium-fine' },
  round: { label: 'Round', description: 'Sweet · balanced · familiar', bean: 'colombia', ratio: '19g / 300ml', grind: 'Medium' },
  deep: { label: 'Deep', description: 'Cocoa · cedar · lingering', bean: 'sumatra', ratio: '20g / 300ml', grind: 'Medium-coarse' },
}

const STEPS = [
  ['01', 'Weigh', 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.'],
  ['02', 'Grind', 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.'],
  ['03', 'Bloom', 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.'],
  ['04', 'Pour', 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.'],
]

const REVIEWS = [
  ['“The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.”', 'Maya T.', 'Subscriber since 2022'],
  ['“Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.”', 'Daniel R.', 'Home barista'],
  ['“I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.”', 'Priya S.', 'Gift subscriber'],
]

const roastFrameFor = (value) => Math.round(value * 11)

function MachineFrame({ index }) {
  return (
    <div className="machine-frame">
      <img src={FRAMES[index]} alt={`1962 Probat at roast stage ${index + 1}`} />
      <div className="machine-meta"><span>PROBAT 1962</span><span>{String(index + 1).padStart(2, '0')} / 12 · 12 KG</span></div>
    </div>
  )
}

function RoastJourney({ onComplete }) {
  const sectionRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const index = Math.min(11, roastFrameFor(progress))

  useEffect(() => {
    const section = sectionRef.current
    const update = () => {
      const top = section.getBoundingClientRect().top + window.scrollY
      const range = Math.max(1, section.offsetHeight - window.innerHeight)
      const value = Math.max(0, Math.min(1, (window.scrollY - top) / range))
      const nextIndex = Math.min(11, roastFrameFor(value))
      const image = section.querySelector('.machine-frame img')
      if (image) {
        image.src = FRAMES[nextIndex]
      }
      section.dataset.frame = String(nextIndex)
      setProgress(value)
      if (value > .95) onComplete?.()
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [onComplete])

  return (
    <section className="roast-journey" id="roast" ref={sectionRef}>
      <div className="roast-pin">
        <div className="roast-stage-copy">
          <p className="kicker">The morning roast · scroll the batch</p>
          <div className="stage-index">{String(index + 1).padStart(2, '0')}</div>
          <h2>{STAGES[index][0]}</h2>
          <p>{STAGES[index][1]}</p>
          <dl><div><dt>Heat</dt><dd>{STAGES[index][2]}°C</dd></div><div><dt>Phase</dt><dd>{index < 5 ? 'Endothermic' : index < 9 ? 'Exothermic' : 'Cooling'}</dd></div></dl>
        </div>
        <MachineFrame index={index} />
        <div className="roast-progress"><span style={{ transform: `scaleX(${Math.max(.015, index / 11)})` }} /></div>
      </div>
    </section>
  )
}

export default function App() {
  const rootRef = useRef(null)
  const [profile, setProfile] = useState('bright')
  const [selectedBean, setSelectedBean] = useState('ethiopia')
  const [cart, setCart] = useState([])

  useEffect(() => {
    const regions = ['story', 'beans', 'brew-guide', 'reviews', 'subscribe', 'contact']
      .map((id) => document.getElementById(id))
      .filter(Boolean)
    const toggle = (event) => event.currentTarget.classList.toggle('mechanism-active')
    regions.forEach((region) => region.addEventListener('click', toggle))
    return () => regions.forEach((region) => region.removeEventListener('click', toggle))
  }, [])
  const [menuOpen, setMenuOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const recommendation = useMemo(() => BEANS.find((bean) => bean.id === selectedBean) || BEANS[0], [selectedBean])

  useEffect(() => {
    setSelectedBean(PROFILES[profile].bean)
  }, [profile])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.timeline().from('.brand', { y: -20, opacity: 0, duration: .7 }).from('.hero-kicker', { y: 20, opacity: 0 }, '-=.4').from('.hero-line span', { yPercent: 110, rotate: 2, stagger: .09, duration: 1.15, ease: 'power4.out' }, '-=.35').from('.profile-picker', { y: 30, opacity: 0, duration: .8 }, '-=.5')
      gsap.utils.toArray('.reveal').forEach((node) => gsap.from(node, { y: 60, opacity: 0, duration: .35, ease: 'power3.out', scrollTrigger: { trigger: node, start: 'top 86%' } }))
      gsap.from('.proof-stat strong', { textContent: 0, duration: .5, stagger: .08, snap: { textContent: 1 }, scrollTrigger: { trigger: '.proof-grid', start: 'top 80%' } })
      gsap.to('.brew-water', { strokeDashoffset: 0, scrollTrigger: { trigger: '#brew-guide', start: 'top 70%', end: 'bottom 70%', scrub: true } })
      gsap.from('.sub-bag', { y: 170, rotate: -12, opacity: 0, stagger: .14, ease: 'power3.out', scrollTrigger: { trigger: '#subscribe', start: 'top 62%' } })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  function chooseProfile(next) {
    setProfile(next)
    document.documentElement.style.setProperty('--profile-hue', next === 'bright' ? '#d5ff31' : next === 'round' ? '#ff9f43' : '#a88bff')
  }

  function addToCart(bean) {
    setCart((items) => [...items, bean.id])
  }

  function submitContact(event) {
    event.preventDefault()
    if (!email.includes('@')) return
    setSent(true)
    setEmail('')
    setMessage('')
  }

  return (
    <div className="site" ref={rootRef}>
      <nav className="site-nav" id="site-nav">
        <a className="brand" href="#hero"><span>N</span><strong>Northwind</strong><small>Coffee Roasters · Bergen</small></a>
        <button className="menu-toggle" onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen}>Menu</button>
        <div className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
          <a href="#beans">Beans</a><a href="#brew-guide">Brew Guide</a><a href="#reviews">Reviews</a><a href="#subscribe">Subscribe</a><a href="#contact">Contact</a>
        </div>
        <div className="cart-count" aria-live="polite">Batch list <span>{String(cart.length).padStart(2, '0')}</span></div>
      </nav>

      <main>
      <header className="site-hero" id="hero" onClick={() => setProfile((current) => current === 'bright' ? 'round' : current === 'round' ? 'deep' : 'bright')}>
        <p className="hero-kicker">Batch 074 · roasted 06:12 · ships today</p>
        <h1>
          <span className="hero-line"><span>Choose the cup.</span></span>
          <span className="hero-line hero-serif"><span>We’ll trace the roast.</span></span>
        </h1>
        <p className="hero-copy">Small-batch coffee, roasted the morning it ships. Start with how you want coffee to feel; we’ll follow that choice from green bean to first pour.</p>
        <div className="profile-picker" aria-label="Choose your flavor profile">
          {Object.entries(PROFILES).map(([key, item]) => <button data-profile={key} className={profile === key ? 'is-active' : ''} onClick={(event) => { event.stopPropagation(); chooseProfile(key) }} key={key}><span>{item.label}</span><small>{item.description}</small></button>)}
        </div>
        <div className="hero-machine"><MachineFrame index={profile === 'bright' ? 3 : profile === 'round' ? 5 : 6} /></div>
        <div className="hero-footer"><span>11 direct farm partners</span><span>2.4× commodity price</span><a href="#story">Follow batch ↓</a></div>
      </header>

      <section className="story-section" id="story">
        <div className="story-intro reveal"><p className="kicker">Northwind / since 2014</p><h2>Small<br /><em>on purpose.</em></h2></div>
        <div className="story-copy reveal">
          <p>Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still small on purpose: two roasters, one machine, and direct relationships with eleven farms across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra.</p>
          <p>We roast single-origin beans in 12kg batches on a 1962 Probat in Bergen, Norway, and ship them within hours. Freshness is not a slogan here; it is a timestamp on the bag.</p>
        </div>
        <div className="proof-grid">
          <div className="proof-stat"><strong>11</strong><span>partner farms</span></div>
          <div className="proof-stat"><strong>2.4</strong><span>× commodity price paid</span></div>
          <div className="proof-stat"><strong>12</strong><span>kg max batch size</span></div>
          <div className="proof-stat"><strong>24</strong><span>&lt; hours roast to shipment</span></div>
        </div>
      </section>

      <section className="beans-section" id="beans">
        <div className="section-head reveal"><p className="kicker">Current lots · six stable identities</p><h2>This month’s<br /><em>beans.</em></h2><p>Your <strong>{PROFILES[profile].label.toLowerCase()}</strong> profile points to {recommendation.name}. Every lot stays visible; the recommendation only changes emphasis.</p></div>
        <div className="bean-grid">
          {BEANS.map((bean, i) => (
            <article className={`bean-card ${selectedBean === bean.id ? 'is-selected' : ''}`} data-bean={bean.id} key={bean.id} onClick={() => setSelectedBean(bean.id)}>
              <div className="bean-top"><span>{String(i + 1).padStart(2, '0')}</span><span>{bean.mark}</span></div>
              <div className="bean-disc" aria-hidden="true"><span>{bean.mark}</span></div>
              <p>{bean.origin}</p><h3>{bean.name}</h3><p className="tasting">{bean.notes}</p><p className="bean-meta">{bean.roast} roast · 250g</p>
              <div className="bean-action"><strong>${bean.price}</strong><button type="button" onClick={(event) => { event.stopPropagation(); addToCart(bean) }}>{cart.includes(bean.id) ? 'Added' : 'Add to cart'}</button></div>
            </article>
          ))}
        </div>
      </section>

      <RoastJourney onComplete={() => {}} />

      <section className="brew-section" id="brew-guide">
        <div className="brew-heading reveal"><p className="kicker">A recipe that follows the bean</p><h2>Four moves.<br /><em>One clear cup.</em></h2><div className="recipe-live"><span>{PROFILES[profile].ratio}</span><span>{PROFILES[profile].grind}</span><span>95°C</span><span>3:00</span></div></div>
        <svg className="brew-diagram" viewBox="0 0 500 920" aria-hidden="true"><path d="M250 30 C90 170 110 330 250 390 C405 457 425 585 250 890" /><path className="brew-water" d="M250 30 C90 170 110 330 250 390 C405 457 425 585 250 890" /></svg>
        <ol className="brew-steps">
          {STEPS.map(([n, title, body]) => <li className="reveal" key={n}><span>{n}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}
        </ol>
      </section>

      <section className="reviews-section" id="reviews">
        <p className="kicker reveal">Subscriber field notes</p>
        <div className="review-stack">
          {REVIEWS.map(([quote, name, role], i) => <blockquote className="review-card reveal" key={name}><span>0{i + 1}</span><p>{quote}</p><footer><strong>{name}</strong><small>{role}</small></footer></blockquote>)}
        </div>
      </section>

      <section className="subscribe-section" id="subscribe">
        <div className="subscribe-copy reveal"><p className="kicker">Your batch recommendation</p><h2>The Northwind<br /><em>subscription.</em></h2><p>Two 250g bags of our current favourites, every month, free shipping, pause any time. $29/month.</p><p className="tailored">Built around <strong>{recommendation.name}</strong> and your {PROFILES[profile].label.toLowerCase()} profile.</p><a className="primary-link" href="#contact">Start a subscription →</a></div>
        <div className="bag-stage">
          <svg className="bag-seam" viewBox="0 0 100 100" aria-hidden="true"><path d="M4 50H96M50 4V96" /></svg>
          <div className="sub-bag bag-one"><small>NW / MONTHLY / 01</small><strong>{recommendation.mark}</strong><span>{recommendation.name}</span><small>{recommendation.roast.toUpperCase()} · FILTER</small></div>
          <div className="sub-bag bag-two"><small>NW / MONTHLY / 02</small><strong>{profile === 'bright' ? 'KE' : profile === 'round' ? 'GT' : 'DE'}</strong><span>Roaster’s counterpoint</span><small>250 G · FILTER</small></div>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-title reveal"><p className="kicker">Roastery line · replies within a day</p><h2>Talk to<br /><em>the roasters.</em></h2></div>
        {sent ? <div className="success-stamp" role="status"><span>RECEIVED</span><p>Thanks — we read everything and reply within a day.</p><button onClick={() => setSent(false)}>Send another note</button></div> : (
          <form className="contact-form" onSubmit={submitContact}>
            <label htmlFor="email">Email</label><input id="email" name="email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label htmlFor="message">Message</label><textarea id="message" name="message" rows={4} placeholder="Questions, wholesale, or just coffee talk" value={message} onChange={(e) => setMessage(e.target.value)} />
            <button type="submit">Send message →</button>
          </form>
        )}
      </section>

      </main>
      <footer className="site-footer" id="site-footer">
        <div><span className="footer-mark">N</span><p>© 2026 Northwind Coffee Roasters<br />Bergen, Norway</p></div>
        <nav><a href="#hero">Top</a><a href="/shipping">Shipping</a><a href="/returns">Returns</a><a href="/privacy">Privacy</a></nav>
        <p>Two roasters.<br />One 1962 Probat.<br />No warehouse coffee.</p>
      </footer>
    </div>
  )
}
