import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const BEANS = [
  { id: 'ethiopia', code: 'ET-04', name: 'Ethiopia Yirgacheffe', origin: 'Gedeo · 1,980m', notes: 'Jasmine · lemon zest · honey', roast: 'Light', price: 18, color: '#e0b45b' },
  { id: 'colombia', code: 'CO-11', name: 'Colombia Huila', origin: 'San Agustín · 1,750m', notes: 'Caramel · red apple · cocoa', roast: 'Medium', price: 16, color: '#cf6d44' },
  { id: 'sumatra', code: 'ID-08', name: 'Sumatra Mandheling', origin: 'Lintong · 1,450m', notes: 'Dark chocolate · cedar · earth', roast: 'Dark', price: 17, color: '#8c6655' },
  { id: 'kenya', code: 'KE-02', name: 'Kenya AA Nyeri', origin: 'Nyeri · 1,820m', notes: 'Blackcurrant · tomato · brown sugar', roast: 'Light', price: 19, color: '#bd3452' },
  { id: 'guatemala', code: 'GT-06', name: 'Guatemala Antigua', origin: 'Antigua · 1,600m', notes: 'Milk chocolate · orange · almond', roast: 'Medium', price: 16, color: '#d8893a' },
  { id: 'decaf', code: 'DC-01', name: 'Swiss Water Decaf Blend', origin: 'Latin America · water process', notes: 'Toffee · hazelnut · smooth', roast: 'Medium', price: 15, color: '#789da5' },
]

const STEPS = [
  { n: '01', title: 'Weigh', time: '00:00', body: 'Use 18g of coffee for every 300ml of water. A cheap scale beats an expensive guess.' },
  { n: '02', title: 'Grind', time: '−00:15', body: 'Grind just before brewing, medium-fine for pour over. Pre-ground coffee stales in minutes.' },
  { n: '03', title: 'Bloom', time: '00:30', body: 'Pour twice the coffee weight in 95°C water and wait 30 seconds for the gases to escape.' },
  { n: '04', title: 'Pour', time: '03:00', body: 'Pour the remaining water in slow circles over 2.5 minutes. Total brew time: about 3 minutes.' },
]

const REVIEWS = [
  { quote: 'The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.', name: 'Maya T.', role: 'Subscriber since 2022' },
  { quote: 'Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.', name: 'Daniel R.', role: 'Home barista' },
  { quote: 'I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.', name: 'Priya S.', role: 'Gift subscriber' },
]

function RouteCanvas({ progressRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let frame
    let active = true

    const draw = () => {
      if (!active) return
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      const p = progressRef.current
      ctx.clearRect(0, 0, w, h)
      const heat = ctx.createRadialGradient(w * .18, h * .55, 0, w * .18, h * .55, w * .5)
      heat.addColorStop(0, `rgba(241,103,38,${.32 * (1 - p)})`)
      heat.addColorStop(1, 'rgba(11,18,20,0)')
      ctx.fillStyle = heat
      ctx.fillRect(0, 0, w, h)

      ctx.lineWidth = 1
      for (let i = 0; i < 12; i += 1) {
        const y = h * (.15 + i * .065)
        ctx.beginPath()
        for (let x = 0; x <= w; x += 8) {
          const furnace = Math.sin(x * .013 + i * .72 + p * 4) * (16 - i * .45)
          const chart = Math.sin(x * .004 + i) * 5 + Math.cos(x * .011) * 3
          const yy = y + furnace * (1 - p) + chart * p
          x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy)
        }
        ctx.strokeStyle = p > .45 ? `rgba(159,197,204,${.1 + p * .18})` : `rgba(214,121,63,${.1 + (1-p) * .17})`
        ctx.stroke()
      }

      const routeY = h * .7
      ctx.beginPath()
      ctx.moveTo(w * .09, routeY)
      ctx.bezierCurveTo(w * .28, routeY - h * .2, w * .56, routeY + h * .14, w * .9, h * .27)
      ctx.setLineDash([5, 9])
      ctx.lineDashOffset = -p * 120
      ctx.strokeStyle = p > .48 ? '#bcd9dc' : '#f09a55'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.setLineDash([])
      const pointX = w * (.09 + .81 * p)
      const pointY = routeY + Math.sin(p * Math.PI * 1.65) * -h * .15
      ctx.beginPath()
      ctx.arc(pointX, pointY, 4.5, 0, Math.PI * 2)
      ctx.fillStyle = '#f3efe2'
      ctx.fill()
      frame = requestAnimationFrame(draw)
    }
    draw()
    return () => { active = false; cancelAnimationFrame(frame) }
  }, [progressRef])

  return <canvas ref={canvasRef} className="route-canvas" aria-hidden="true" />
}

function Journey() {
  const sectionRef = useRef(null)
  const progressRef = useRef(0)
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { progressRef.current = 1; setStage(2); return undefined }
    const context = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=180%',
        pin: '.journey-stage',
        scrub: .6,
        onUpdate: (self) => {
          progressRef.current = self.progress
          setStage(self.progress < .33 ? 0 : self.progress < .7 ? 1 : 2)
          sectionRef.current?.style.setProperty('--journey', self.progress)
        },
      })
      gsap.fromTo('.journey-image', { scale: 1.08 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom bottom', scrub: true } })
    }, sectionRef)
    return () => context.revert()
  }, [])

  const stages = [
    ['06:14', 'Drop', 'The drum opens. Twelve kilograms meet cold air.'],
    ['07:02', 'Seal', 'Degassed, weighed, coded and sealed at the roast table.'],
    ['08:40', 'Harbour', 'The morning batch leaves Bergen before the city fully wakes.'],
  ]

  return (
    <section className="journey" ref={sectionRef} aria-label="From roast to shipment">
      <div className="journey-stage">
        <img className="journey-image" src="/assets/northwind-roast-harbour.png" alt="Vintage coffee roaster opening toward Bergen harbour before dawn" />
        <div className="journey-shade" />
        <RouteCanvas progressRef={progressRef} />
        <div className="journey-topline"><span>Batch NW–0721</span><span>Bergen · 60.3929° N</span></div>
        <div className="journey-copy" aria-live="polite">
          <p className="eyebrow">Roast to harbour / 02:26 elapsed</p>
          <p className="journey-time">{stages[stage][0]}</p>
          <h2>{stages[stage][1]}</h2>
          <p>{stages[stage][2]}</p>
        </div>
        <div className="journey-progress"><span style={{ width: `${(stage + 1) * 33.333}%` }} /></div>
        <p className="scroll-cue">Scroll to follow the batch <span>↓</span></p>
      </div>
    </section>
  )
}

export default function App() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [cart, setCart] = useState([])

  const addBean = (bean) => {
    setCart((items) => [...items, bean.id])
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    setSent(true)
    setEmail('')
    setMessage('')
  }

  return (
    <div className="page">
      <nav className="nav" id="site-nav" aria-label="Primary navigation">
        <a className="nav-logo" href="#hero"><span className="windmark">N</span><span>Northwind<br />Coffee Roasters</span></a>
        <div className="nav-links">
          <a href="#beans">Beans</a><a href="#brew-guide">Brew Guide</a><a href="#reviews">Reviews</a><a href="#subscribe">Subscribe</a><a href="#contact">Contact</a>
        </div>
        <a className="cart-link" href="#beans" aria-label={`${cart.length} items in cart`}>Bag <span>{String(cart.length).padStart(2, '0')}</span></a>
      </nav>

      <header className="hero" id="hero">
        <div className="hero-grid">
          <div className="hero-main">
            <p className="eyebrow">Independent roastery · Bergen, Norway</p>
            <h1>Roasted at dawn.<br /><em>Gone by morning.</em></h1>
            <p className="hero-deck">Small-batch coffee roasted on our 1962 Probat and dispatched within hours. Freshness isn’t a slogan. It’s the timestamp on every bag.</p>
            <div className="hero-actions"><a className="button button-light" href="#beans">Shop this roast <span>↘</span></a><a className="text-link" href="#story">Read the batch log</a></div>
          </div>
          <div className="hero-dial" aria-label="Current batch information">
            <div className="dial-ring"><span>12</span><small>KG</small></div>
            <p><b>Current batch</b><span>07 / 21 / 26</span><span>Roast 06:14</span><span>Dispatch 08:40</span></p>
          </div>
        </div>
        <div className="hero-meta"><span>PROBAT · 1962</span><span>Batch NW–0721</span><span>Air 12°C · Rain</span></div>
      </header>

      <Journey />

      <main>
        <section className="story section-pad" id="story">
          <div className="section-index">01 / The record</div>
          <div className="story-head"><p className="eyebrow">Small on purpose since 2014</p><h2>Two roasters.<br />One old machine.<br /><em>Eleven handshakes.</em></h2></div>
          <div className="story-copy"><p>Northwind started in a fishing shed. Ten years later we still roast in 12kg batches and work directly with eleven farms across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra.</p><p>We pay on average 2.4× the commodity price and publish every contract. Better coffee starts with a relationship you can inspect.</p><a className="text-link dark" href="#beans">Meet this month’s lots →</a></div>
          <div className="stats">
            <div><strong>11</strong><span>partner farms</span></div><div><strong>2.4×</strong><span>commodity price paid</span></div><div><strong>12kg</strong><span>maximum batch</span></div><div><strong>&lt;24h</strong><span>roast to shipment</span></div>
          </div>
        </section>

        <section className="beans section-pad" id="beans">
          <div className="section-index">02 / Current lots</div>
          <div className="section-title"><div><p className="eyebrow">Roasted this week</p><h2>Choose your<br /><em>coordinates.</em></h2></div><p>Six distinct origins. One shared rule: every bag leaves our roastery before the roast is a day old.</p></div>
          <div className="bean-grid">
            {BEANS.map((bean, index) => (
              <article className="bean-card" key={bean.id} style={{ '--bean': bean.color }}>
                <div className="bean-visual"><span className="bean-code">{bean.code}</span><div className="contours" /><span className="roast-mark">{bean.roast}</span><span className="bean-number">0{index + 1}</span></div>
                <div className="bean-info"><p>{bean.origin}</p><h3>{bean.name}</h3><p className="bean-notes">{bean.notes}</p><div className="bean-buy"><span>${bean.price} <small>/ 250g</small></span><button type="button" onClick={() => addBean(bean)}>{cart.includes(bean.id) ? 'Add another' : 'Add to bag'} <span>＋</span></button></div></div>
              </article>
            ))}
          </div>
        </section>

        <section className="brew section-pad" id="brew-guide">
          <div className="section-index">03 / Extraction chart</div>
          <div className="brew-intro"><p className="eyebrow">A three-minute ritual</p><h2>Precision,<br /><em>then pleasure.</em></h2><p>Pour over in four measured movements. No mystique, just a repeatable path to a better cup.</p></div>
          <ol className="steps">
            {STEPS.map((step) => <li key={step.n}><div className="step-top"><span>{step.n}</span><time>{step.time}</time></div><div className="step-disc" aria-hidden="true"><i /></div><h3>{step.title}</h3><p>{step.body}</p></li>)}
          </ol>
        </section>

        <section className="reviews section-pad" id="reviews">
          <div className="section-index">04 / Field notes</div>
          <p className="eyebrow">Letters from kitchen counters</p>
          <h2>Freshness,<br /><em>confirmed.</em></h2>
          <div className="review-list">{REVIEWS.map((review, index) => <blockquote key={review.name}><span>“</span><p>{review.quote}</p><footer><b>{String(index + 1).padStart(2, '0')} · {review.name}</b><small>{review.role}</small></footer></blockquote>)}</div>
        </section>

        <section className="subscribe section-pad" id="subscribe">
          <div className="subscription-copy"><p className="eyebrow">A standing order for good mornings</p><h2>The current<br /><em>favourites.</em></h2><p>Two 250g bags every month. Roasted that morning, shipped free, pause any time.</p></div>
          <div className="subscription-ticket"><p>Northwind / Monthly dispatch</p><div><span>02</span><small>bags<br />every month</small></div><div className="ticket-price"><span>$29</span><small>including<br />shipping</small></div><a className="button button-dark" href="#contact">Start a subscription <span>→</span></a><p className="ticket-code">NW–SUB / BER–WORLD / PAUSE ANY TIME</p></div>
        </section>

        <section className="contact section-pad" id="contact">
          <div><div className="section-index">05 / Signal us</div><p className="eyebrow">Questions · wholesale · coffee talk</p><h2>Send word<br /><em>north.</em></h2></div>
          {sent ? <p className="form-success" role="status">Message received.<br /><span>We read everything and reply within a day.</span></p> : (
            <form onSubmit={handleSubmit} className="contact-form"><label htmlFor="email">01 / Your email</label><input id="email" name="email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /><label htmlFor="message">02 / Your message</label><textarea id="message" name="message" rows="4" placeholder="Questions, wholesale, or just coffee talk" value={message} onChange={(e) => setMessage(e.target.value)} /><button className="button button-light" type="submit">Send message <span>↗</span></button></form>
          )}
        </section>
      </main>

      <footer className="footer" id="site-footer"><a className="nav-logo" href="#hero"><span className="windmark">N</span><span>Northwind<br />Coffee Roasters</span></a><p>© 2026 · Bergen, Norway<br />Roasting north since 2014</p><div className="footer-links"><a href="#hero">Top</a><a href="/shipping">Shipping</a><a href="/returns">Returns</a><a href="/privacy">Privacy</a></div></footer>
    </div>
  )
}
