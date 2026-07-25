import { useEffect, useRef, useState } from 'react'
import roastery from './assets/probat-roastery.png'

const BEANS = [
  { id:'ethiopia', place:'ETHIOPIA · YIRGACHEFFE', name:'Ethiopia Yirgacheffe', notes:'Jasmine · lemon zest · honey', roast:'Light', price:18, hue:'#d9df8b', profile:[20,32,48,66,78] },
  { id:'colombia', place:'COLOMBIA · HUILA', name:'Colombia Huila', notes:'Caramel · red apple · cocoa', roast:'Medium', price:16, hue:'#ed9e73', profile:[18,38,56,72,86] },
  { id:'sumatra', place:'INDONESIA · MANDHELING', name:'Sumatra Mandheling', notes:'Dark chocolate · cedar · earth', roast:'Dark', price:17, hue:'#9eb39d', profile:[24,44,64,82,94] },
  { id:'kenya', place:'KENYA · NYERI', name:'Kenya AA Nyeri', notes:'Blackcurrant · tomato · brown sugar', roast:'Light', price:19, hue:'#c88fa8', profile:[16,34,52,68,79] },
  { id:'guatemala', place:'GUATEMALA · ANTIGUA', name:'Guatemala Antigua', notes:'Milk chocolate · orange · almond', roast:'Medium', price:16, hue:'#e4b858', profile:[22,40,58,74,87] },
  { id:'decaf', place:'SWISS WATER · BLEND', name:'Swiss Water Decaf Blend', notes:'Toffee · hazelnut · smooth', roast:'Medium', price:15, hue:'#91b7bd', profile:[19,36,54,73,85] },
]

const STEPS = [
  { title:'Weigh', meta:'18g / 300ml', body:'A cheap scale beats an expensive guess.' },
  { title:'Grind', meta:'Medium–fine', body:'Grind just before brewing. Pre-ground coffee stales in minutes.' },
  { title:'Bloom', meta:'36g / 30 sec', body:'Use 95°C water and wait for the trapped gases to escape.' },
  { title:'Pour', meta:'2.5 min / circles', body:'Pour slowly. Total brew time: about 3 minutes.' },
]

const REVIEWS = [
  ['The Yirgacheffe changed what I thought coffee could taste like. Floral, bright, ridiculous.','Maya T.','Subscriber since 2022'],
  ['Roasted Tuesday, at my door Thursday. Nobody else I have tried comes close on freshness.','Daniel R.','Home barista'],
  ['I gifted the subscription to my dad and now he lectures me about bloom times. Worth it.','Priya S.','Gift subscriber'],
]

export default function App() {
  const route = window.location.pathname
  const routeCopy = {
    '/shipping': ['Shipping', 'Roasted, packed, moving.', 'Orders leave Bergen within 24 hours of roasting. Norwegian orders typically arrive in 1–3 working days; international delivery timing is shown at checkout.'],
    '/returns': ['Returns', 'Make it right.', 'Coffee is perishable, but your trust is not. If a bag arrives damaged or the roast is not what you expected, write to us within 14 days and we will replace it or refund it.'],
    '/privacy': ['Privacy', 'Your data, kept small.', 'We collect only what is needed to fulfil orders, answer messages, and manage subscriptions. We never sell personal information.'],
  }
  if (routeCopy[route]) {
    const [label, title, copy] = routeCopy[route]
    return <main className="route-page"><a className="brand" href="/"><i>NW</i><span>NORTHWIND<br/>COFFEE ROASTERS</span></a><div><p className="eyebrow">NORTHWIND / {label}</p><h1>{title}</h1><p>{copy}</p><a className="button dark" href="/">Back to the roastery <span>↖</span></a></div></main>
  }
  const [selected, setSelected] = useState(0)
  const [brew, setBrew] = useState(0)
  const [cart, setCart] = useState([])
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const roastRef = useRef(null)
  const [roastStage, setRoastStage] = useState(0)
  const bean = BEANS[selected]

  useEffect(() => {
    const node = roastRef.current
    if (!node || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const onScroll = () => {
      const r = node.getBoundingClientRect()
      const p = Math.max(0, Math.min(0.999, -r.top / Math.max(1, r.height - innerHeight)))
      setRoastStage(Math.floor(p * 4))
    }
    addEventListener('scroll', onScroll, { passive:true }); onScroll()
    return () => removeEventListener('scroll', onScroll)
  }, [])

  function addBean(b) {
    setCart(c => [...c, b.id])
  }
  function submit(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    setSent(true); setEmail(''); setMessage('')
  }

  return <main>
    <nav className="nav">
      <a className="brand" href="#top" aria-label="Northwind home"><i>NW</i><span>NORTHWIND<br/>COFFEE ROASTERS</span></a>
      <div className="nav-links">
        <a href="#beans">Beans</a><a href="#brew-guide">Brew guide</a><a href="#reviews">Reviews</a><a href="#subscribe">Subscribe</a><a href="#contact">Contact</a>
      </div>
      <a className="bag" href="#beans" aria-label={`${cart.length} items in bag`}>Bag <b>{String(cart.length).padStart(2,'0')}</b></a>
    </nav>

    <header className="hero" id="top">
      <img src={roastery} alt="A vintage Probat roaster working beside Bergen harbour" />
      <div className="hero-shade"/>
      <div className="hero-copy">
        <p className="eyebrow">BERGEN · NORWAY / 60.3913° N</p>
        <h1>Roasted<br/><em>this morning.</em></h1>
        <p className="dek">Small batches. Shipped within hours. Every bag carries the moment it left our 1962 Probat.</p>
        <div className="hero-actions"><a className="button light" href="#beans">Choose your origin <span>↘</span></a><a href="#brew-guide">Learn the ritual ↗</a></div>
      </div>
      <div className="fresh-stamp"><span>ROASTED</span><strong>06:42</strong><small>25 JUL 2026</small></div>
      <p className="scroll-note">SCROLL TO FOLLOW THE BATCH <b>↓</b></p>
    </header>

    <section className="manifesto" id="story">
      <p className="eyebrow">01 / THE ROASTERY</p>
      <h2>Small <em>on purpose.</em><br/>Fresh by design.</h2>
      <div className="story-copy">
        <p>Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still two roasters, one machine, and direct relationships with eleven farms across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra.</p>
        <p>We pay on average 2.4× the commodity price and publish every contract. Freshness isn’t a slogan here. It’s a timestamp on the bag.</p>
      </div>
      <div className="facts">{[['11','partner farms'],['2.4×','commodity price'],['12kg','maximum batch'],['<24h','roast to shipment']].map(x=><div key={x[1]}><strong>{x[0]}</strong><span>{x[1]}</span></div>)}</div>
    </section>

    <section className="origin" id="beans">
      <div className="section-head"><p className="eyebrow">02 / CHOOSE AN ORIGIN</p><h2>Six places.<br/><em>One morning.</em></h2><p>Select a harvest to change the roast profile.</p></div>
      <div className="origin-stage" style={{'--bean':bean.hue}}>
        <div className="origin-list" role="tablist" aria-label="Coffee origins">{BEANS.map((b,i)=><button role="tab" aria-selected={i===selected} onClick={()=>setSelected(i)} key={b.id}><span>0{i+1}</span>{b.name}<b>↗</b></button>)}</div>
        <article className="bean-focus" onClick={() => setSelected(i => (i + 1) % BEANS.length)}>
          <div className="bean-orbit"><span/><span/><span/><b>{bean.roast}</b></div>
          <p>{bean.place}</p><h3>{bean.name}</h3><div className="tasting">{bean.notes.split(' · ').map(n=><span key={n}>{n}</span>)}</div>
          <div className="profile"><span>ROAST PROFILE</span><svg viewBox="0 0 400 100" preserveAspectRatio="none"><polyline points={bean.profile.map((n,i)=>`${i*100},${100-n}`).join(' ')} /></svg></div>
          <div className="buyline"><span>250G · WHOLE BEAN</span><strong>${bean.price}</strong><button onClick={(e)=>{e.stopPropagation();addBean(bean)}}>Add to bag <b>+</b></button></div>
        </article>
      </div>
      <div className="all-beans">{BEANS.map(b=><article key={b.id}><p>{b.place}</p><h3>{b.name}</h3><span>{b.notes}</span><div><b>{b.roast} · 250g</b><strong>${b.price}</strong><button onClick={()=>addBean(b)} aria-label={`Add ${b.name} to cart`}>+</button></div></article>)}</div>
    </section>

    <section className="roast-journey" ref={roastRef}>
      <div className="roast-sticky">
        <div className="roast-copy">
          <p className="eyebrow">03 / INSIDE THE PROBAT</p>
          <span className="stage-count">0{roastStage+1} / 04</span>
          <h2>{['Green enters.','Heat gathers.','First crack.','Morning, sealed.'][roastStage]}</h2>
          <p>{['Twelve kilos maximum. Small enough to listen to every bean.','Drying gives way to sweetness as the drum builds momentum.','The batch speaks: a chorus of tiny cracks, then we cut the heat.','Cooled, weighed and timestamped while the harbour is still waking.'][roastStage]}</p>
        </div>
        <div className={`drum stage-${roastStage}`}><div className="drum-ring"/><div className="drum-core">{Array.from({length:18}).map((_,i)=><i key={i} style={{'--i':i}}/>)}</div><span>{['20°C','148°C','196°C','06:42'][roastStage]}</span></div>
        <div className="roast-track">{['LOAD','DRY','CRACK','DROP'].map((x,i)=><span className={i<=roastStage?'active':''} key={x}>{x}</span>)}</div>
      </div>
    </section>

    <section className="brew" id="brew-guide">
      <div className="section-head"><p className="eyebrow">04 / THE MORNING RITUAL</p><h2>Four moves.<br/><em>Nothing wasted.</em></h2></div>
      <div className="brew-machine">
        <div className={`pour pour-${brew}`}><div className="kettle"/><div className="water"/><div className="dripper"><i/><i/><i/></div><div className="carafe"/></div>
        <div className="brew-steps">{STEPS.map((s,i)=><button className={brew===i?'active':''} onClick={()=>setBrew(i)} key={s.title}><span>0{i+1}</span><div><h3>{s.title}</h3><b>{s.meta}</b><p>{s.body}</p></div></button>)}</div>
      </div>
    </section>

    <section className="reviews" id="reviews">
      <p className="eyebrow">05 / NOTES FROM THE KITCHEN</p>
      <div className="review-rail">{REVIEWS.map((r,i)=><blockquote key={r[1]}><span>“</span><p>{r[0]}</p><footer><b>{r[1]}</b><small>{r[2]}</small><i>0{i+1}</i></footer></blockquote>)}</div>
    </section>

    <section className="subscribe" id="subscribe">
      <p className="eyebrow">06 / NEVER RUN OUT</p><h2>Your next morning,<br/><em>already in motion.</em></h2>
      <p>Two 250g bags of our current favourites, every month. Free shipping. Pause any time.</p>
      <div><strong><sup>$</sup>29<small>/ MONTH</small></strong><a className="button dark" href="#contact">Start a subscription <span>↘</span></a></div>
    </section>

    <section className="contact" id="contact">
      <div><p className="eyebrow">07 / WRITE TO THE ROASTERY</p><h2>Questions,<br/>wholesale,<br/><em>coffee talk.</em></h2><a href="mailto:hello@northwind.coffee">hello@northwind.coffee ↗</a></div>
      {sent ? <p className="success" role="status">Message received.<br/><span>We read everything and reply within a day.</span></p> :
      <form onSubmit={submit}><label>Email<input type="email" required placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Message<textarea rows="4" placeholder="What’s on your mind?" value={message} onChange={e=>setMessage(e.target.value)}/></label><button className="button dark">Send message <span>↗</span></button></form>}
    </section>

    <footer><div className="brand"><i>NW</i><span>NORTHWIND<br/>COFFEE ROASTERS</span></div><p>© 2026 Northwind Coffee Roasters<br/>Bergen, Norway</p><div><a href="#top">Top ↑</a><a href="/shipping">Shipping</a><a href="/returns">Returns</a><a href="/privacy">Privacy</a></div></footer>
  </main>
}
