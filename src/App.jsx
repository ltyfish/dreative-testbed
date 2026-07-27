import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'

gsap.registerPlugin(ScrollTrigger)

const PROFILES = {
  light: { label: 'Light', temp: 196, time: '08:42', color: '#e5a458', brew: '2:40', copy: 'Jasmine lifted by a fast, bright finish.' },
  medium: { label: 'Medium', temp: 208, time: '10:18', color: '#c26038', brew: '3:00', copy: 'Caramel depth with a clean fruit structure.' },
  dark: { label: 'Dark', temp: 220, time: '12:06', color: '#7f3427', brew: '3:20', copy: 'Deep cocoa carried through a long finish.' },
}

const BEANS = [
  { id: 'ethiopia', code: 'ET-01', name: 'Ethiopia Yirgacheffe', notes: 'Jasmine, lemon zest, honey', roast: 'Light', price: 18 },
  { id: 'colombia', code: 'CO-02', name: 'Colombia Huila', notes: 'Caramel, red apple, cocoa', roast: 'Medium', price: 16 },
  { id: 'sumatra', code: 'ID-03', name: 'Sumatra Mandheling', notes: 'Dark chocolate, cedar, earth', roast: 'Dark', price: 17 },
  { id: 'kenya', code: 'KE-04', name: 'Kenya AA Nyeri', notes: 'Blackcurrant, tomato, brown sugar', roast: 'Light', price: 19 },
  { id: 'guatemala', code: 'GT-05', name: 'Guatemala Antigua', notes: 'Milk chocolate, orange, almond', roast: 'Medium', price: 16 },
  { id: 'decaf', code: 'DC-06', name: 'Swiss Water Decaf Blend', notes: 'Toffee, hazelnut, smooth', roast: 'Medium', price: 15 },
]

const STEPS = [
  { n: '01', title: 'Weigh', body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.' },
  { n: '02', title: 'Grind', body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.' },
  { n: '03', title: 'Bloom', body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.' },
  { n: '04', title: 'Pour', body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.' },
]

const REVIEWS = [
  { quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.', name: 'Maya T.', role: 'Subscriber since 2022' },
  { quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.', name: 'Daniel R.', role: 'Home barista' },
  { quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.', name: 'Priya S.', role: 'Gift subscriber' },
]

function RoastScene({ profile }) {
  const mount = useRef(null)
  useEffect(() => {
    const host = mount.current
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, host.clientWidth / host.clientHeight, .1, 100)
    camera.position.z = 10
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6))
    renderer.setSize(host.clientWidth, host.clientHeight)
    host.appendChild(renderer.domElement)
    const group = new THREE.Group()
    scene.add(group)
    const drumMaterial = new THREE.MeshStandardMaterial({ color: 0x211c19, metalness: .87, roughness: .24, side: THREE.DoubleSide })
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 2.45, 48, 1, true), drumMaterial)
    drum.rotation.z = Math.PI / 2
    group.add(drum)
    const ringMat = new THREE.MeshStandardMaterial({ color: profile === 'light' ? 0xd4a35d : profile === 'dark' ? 0x7f3427 : 0xb85b35, metalness: .9, roughness: .18 })
    ;[-1.22, 1.22].forEach(x => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.72, .055, 12, 64), ringMat)
      ring.rotation.y = Math.PI / 2
      ring.position.x = x
      group.add(ring)
    })
    const beanGeo = new THREE.SphereGeometry(.12, 10, 8)
    const beanMat = new THREE.MeshStandardMaterial({ color: PROFILES[profile].color, roughness: .7 })
    for (let i = 0; i < 46; i++) {
      const bean = new THREE.Mesh(beanGeo, beanMat)
      bean.scale.set(1.3, .68, .68)
      const a = i * 2.4
      bean.position.set((i % 8 - 3.5) * .25, Math.sin(a) * 1.1, Math.cos(a) * 1.1)
      group.add(bean)
    }
    scene.add(new THREE.HemisphereLight(0xffe1b4, 0x061110, 2.3))
    const glow = new THREE.PointLight(PROFILES[profile].color, 34, 10)
    glow.position.set(-2, 1, 3)
    scene.add(glow)
    let raf
    const render = t => {
      group.rotation.y = t * .00022
      group.rotation.x = Math.sin(t * .00031) * .12
      renderer.render(scene, camera)
      raf = requestAnimationFrame(render)
    }
    render(0)
    const resize = () => {
      camera.aspect = host.clientWidth / host.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(host.clientWidth, host.clientHeight)
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)
    addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf); removeEventListener('resize', resize); resizeObserver.disconnect()
      renderer.dispose(); drum.geometry.dispose(); drumMaterial.dispose(); ringMat.dispose(); beanGeo.dispose(); beanMat.dispose()
      host.replaceChildren()
    }
  }, [profile])
  return <div className="roast-canvas" ref={mount} aria-label={`${PROFILES[profile].label} roast moving through a spatial Probat drum`} />
}

function ProfileControl({ profile, setProfile, compact = false }) {
  return <div className={`profile-control ${compact ? 'profile-control--compact' : ''}`} data-profile-control>
    {Object.entries(PROFILES).map(([key, p], i) =>
      <button key={key} className={profile === key ? 'active' : ''} onClick={() => setProfile(key)} aria-pressed={profile === key}>
        <span>0{i + 1}</span>{p.label}
      </button>
    )}
  </div>
}

export default function App() {
  const [profile, setProfile] = useState('medium')
  const [activeStep, setActiveStep] = useState(0)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [cartNotice, setCartNotice] = useState('')
  const data = PROFILES[profile]

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const context = gsap.context(() => {
      gsap.utils.toArray('[data-reveal]').forEach(element => {
        gsap.fromTo(element, { y: 54, rotateX: 3 }, {
          y: 0, rotateX: 0, duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 84%', toggleActions: 'play none none reverse' }
        })
      })
      gsap.to('.heat-line__fill', { width: '100%', ease: 'none', scrollTrigger: { trigger: '.page', start: 'top top', end: 'bottom bottom', scrub: .3 } })
      gsap.utils.toArray('.bean-card').forEach((card, index) => {
        gsap.fromTo(card,
          { xPercent: index % 2 ? 12 : -12, rotateZ: index % 2 ? 1.5 : -1.5 },
          { xPercent: 0, rotateZ: 0, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'center center', scrub: .6 } }
        )
      })
    })
    return () => context.revert()
  }, [])

  useEffect(() => {
    const lab = document.querySelector('.roast-lab')
    const vessel = document.querySelector('.roast-vessel')
    if (!lab || !vessel) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const stages = [
      { name: 'charge', width: '54%', height: '48vh', transform: 'translateX(20%) rotate(-12deg) scale(.74,.88)', clip: 'polygon(18% 8%,82% 0,94% 84%,8% 100%)' },
      { name: 'turn', width: '80%', height: '66vh', transform: 'translateX(-3%) rotate(0deg) scale(.94,1)', clip: 'polygon(6% 0,94% 8%,88% 100%,0 88%)' },
      { name: 'drop', width: '100%', height: '80vh', transform: 'translateX(0) rotate(16deg) scale(1.05,1)', clip: 'polygon(0 0,100% 8%,100% 100%,0 92%)' },
    ]
    const updateRoastStage = () => {
      const rect = lab.getBoundingClientRect()
      const travel = Math.max(1, lab.offsetHeight - innerHeight)
      const progress = Math.max(0, Math.min(1, -rect.top / travel))
      const stage = reduce ? stages[1] : stages[progress < .33 ? 0 : progress < .67 ? 1 : 2]
      lab.dataset.stage = stage.name
      vessel.style.width = stage.width
      vessel.style.height = stage.height
      vessel.style.transform = stage.transform
      vessel.style.clipPath = stage.clip
    }
    updateRoastStage()
    addEventListener('scroll', updateRoastStage, { passive: true })
    addEventListener('resize', updateRoastStage)
    return () => {
      removeEventListener('scroll', updateRoastStage)
      removeEventListener('resize', updateRoastStage)
    }
  }, [])

  const addToCart = bean => {
    setCartNotice(`${bean.name} added to your batch`)
    setTimeout(() => setCartNotice(''), 2600)
  }
  const handleSubmit = e => {
    e.preventDefault()
    if (!email.includes('@')) return
    setSent(true); setEmail(''); setMessage('')
  }

  return (
    <main className="page" style={{ '--heat': data.color }} data-roast={profile}>
      <div className="heat-line"><div className="heat-line__fill" /></div>
      {cartNotice && <div className="toast" role="status">{cartNotice}</div>}
      <nav className="nav" id="site-nav">
        <a className="nav-logo" href="#hero"><b>NORTHWIND</b><span>COFFEE ROASTERS / BERGEN</span></a>
        <div className="nav-links">
          <a href="#beans">Beans</a><a href="#brew-guide">Brew Guide</a><a href="#reviews">Reviews</a><a href="#subscribe">Subscribe</a><a href="#contact">Contact</a>
        </div>
        <span className="nav-time">ROASTED / 06:14</span>
      </nav>

      <header className="hero" id="hero">
        <div className="hero-copy" data-reveal>
          <p className="kicker">BATCH 0727 / {data.label.toUpperCase()} PROFILE</p>
          <h1>Roasted this morning.<br /><em>Remembered tomorrow.</em></h1>
          <p className="hero-intro">We roast single-origin beans in 12kg batches on a 1962 Probat in Bergen, Norway, and ship them within hours. Freshness is not a slogan here; it is a timestamp on the bag.</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#beans">Shop the beans <span>↘</span></a>
            <a className="btn btn-secondary" href="#brew-guide">Learn to brew <span>↓</span></a>
          </div>
        </div>
        <div className="hero-orbit" aria-hidden="true"><span>{data.temp}°</span><i /></div>
        <ProfileControl profile={profile} setProfile={setProfile} />
        <div className="hero-facts"><span>12 KG MAX BATCH</span><span>11 PARTNER FARMS</span><span>&lt;24H TO SHIPMENT</span></div>
      </header>

      <section className="story section" id="story">
        <div className="section-index">01 / ORIGIN</div>
        <div data-reveal>
          <p className="kicker">SMALL ON PURPOSE / SINCE 2014</p>
          <h2>A fishing shed,<br />a <em>1962 Probat,</em><br />and no shortcuts.</h2>
        </div>
        <div className="story-copy" data-reveal>
          <p>Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still small on purpose: two roasters, one machine, and direct relationships with eleven farms across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra. We pay on average 2.4× the commodity price and publish every contract.</p>
        </div>
        <div className="stats">
          {[['11','partner farms'],['2.4×','commodity price paid'],['12kg','max batch size'],['<24h','roast to shipment']].map(([n,l]) =>
            <div className="stat" key={l} data-reveal><strong>{n}</strong><span>{l}</span><i /></div>
          )}
        </div>
      </section>

      <section className="roast-lab section" id="roast-lab">
        <div className="roast-sticky">
          <div className="section-index">02 / TRANSFORMATION</div>
          <div className="roast-copy" data-reveal>
            <p className="kicker">LIVE ROAST PROFILE</p>
            <h2>Heat leaves<br />a signature.</h2>
            <p>{data.copy}</p>
            <div className="roast-readout"><strong>{data.temp}°</strong><span>TURN / {data.time}</span></div>
          </div>
          <div className="roast-vessel"><RoastScene profile={profile} /></div>
          <ProfileControl profile={profile} setProfile={setProfile} compact />
        </div>
      </section>

      <section className="beans section" id="beans">
        <div className="section-heading" data-reveal>
          <div className="section-index">03 / CURRENT ROASTS</div>
          <h2>Six origins.<br /><em>One morning.</em></h2>
          <p>Hover, focus, or choose a profile. The roast you selected stays in the room.</p>
        </div>
        <div className="bean-grid">
          {BEANS.map((bean, index) => {
            const match = bean.roast.toLowerCase() === profile
            return <article className={`bean-card ${match ? 'bean-card--match' : ''}`} key={bean.id} data-bean={bean.id} data-reveal>
              <div className="bean-visual" aria-hidden="true"><span>{bean.code}</span><div className="bean-shape" style={{ '--bean-turn': `${index * 17}deg` }} /></div>
              <div className="bean-info"><p>{bean.roast} roast · 250g</p><h3>{bean.name}</h3><span className="bean-notes">{bean.notes}</span></div>
              <div className="bean-buy"><strong>${bean.price}</strong><button type="button" onClick={() => addToCart(bean)}>Add to batch <span>+</span></button></div>
            </article>
          })}
        </div>
      </section>

      <section className="brew section" id="brew-guide">
        <div className="brew-head" data-reveal>
          <div className="section-index">04 / EXTRACTION</div>
          <h2>Four movements.<br /><em>{data.brew} minutes.</em></h2>
          <div className="brew-timer"><span style={{ '--progress': `${(activeStep + 1) * 25}%` }} /><strong>0{activeStep + 1}</strong></div>
        </div>
        <ol className="steps">
          {STEPS.map((step, index) => <li key={step.n} className={activeStep === index ? 'active' : ''} onMouseEnter={() => setActiveStep(index)}>
            <button onClick={() => setActiveStep(index)} aria-pressed={activeStep === index}>
              <span>{step.n}</span><h3>{step.title}</h3><p>{step.body}</p><i>↗</i>
            </button>
          </li>)}
        </ol>
      </section>

      <section className="reviews section" id="reviews">
        <div className="section-index">05 / FIELD NOTES</div>
        <div className="review-marquee" aria-hidden="true">FRESHNESS HAS WITNESSES · FRESHNESS HAS WITNESSES ·</div>
        <div className="review-stack">
          {REVIEWS.map((review, index) => <blockquote key={review.name} style={{ '--i': index }} data-reveal>
            <span>“</span><p>{review.quote}</p><footer><strong>{review.name}</strong><i>{review.role}</i></footer>
          </blockquote>)}
        </div>
      </section>

      <section className="subscribe section" id="subscribe">
        <div className="subscription-ring" aria-hidden="true"><span>{data.label}</span></div>
        <div className="subscribe-copy" data-reveal>
          <div className="section-index">06 / REPEAT THE RITUAL</div>
          <p className="kicker">THE NORTHWIND SUBSCRIPTION</p>
          <h2>Tomorrow’s<br />favorite coffee,<br /><em>on schedule.</em></h2>
          <p>Two 250g bags of our current favourites, every month, free shipping, pause any time. $29/month.</p>
          <a className="btn btn-primary" href="#contact">Start a subscription <span>↘</span></a>
        </div>
      </section>

      <section className="contact section" id="contact">
        <div className="contact-title" data-reveal><div className="section-index">07 / OPEN CHANNEL</div><h2>Talk coffee.<br /><em>We’re listening.</em></h2></div>
        <div className="contact-panel" data-reveal>
          {sent ? <p className="form-success" role="status">Thanks — we read everything and reply within a day.</p> :
            <form className="contact-form" onSubmit={handleSubmit}>
              <label htmlFor="email">01 / Email</label>
              <input id="email" name="email" type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              <label htmlFor="message">02 / Message</label>
              <textarea id="message" name="message" rows={4} placeholder="Questions, wholesale, or just coffee talk" value={message} onChange={e => setMessage(e.target.value)} />
              <button type="submit" className="btn btn-primary">Send message <span>↗</span></button>
            </form>}
        </div>
      </section>

      <footer className="footer" id="site-footer">
        <div><strong>NORTHWIND</strong><span>© 2026 Northwind Coffee Roasters — Bergen, Norway</span></div>
        <div className="footer-profile"><span>YOUR ROAST</span><b>{data.label} / {data.temp}°</b></div>
        <div className="footer-links"><a href="#hero">Top</a><a href="/shipping">Shipping</a><a href="/returns">Returns</a><a href="/privacy">Privacy</a></div>
      </footer>
    </main>
  )
}
