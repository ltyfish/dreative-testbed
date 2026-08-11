import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BEANS, STEPS, REVIEWS, RECIPE_BY_ROAST, CREDITS } from './data.js'
import { fmtTime, developmentRatio } from './roast.js'
import RoastCurve from './RoastCurve.jsx'

const NAV = [
  { href: '#beans', label: 'Beans' },
  { href: '#brew-guide', label: 'Brew Guide' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#subscribe', label: 'Subscribe' },
  { href: '#contact', label: 'Contact' },
]

const ROAST_POSITION = { Light: 0.2, Medium: 0.55, Dark: 0.88 }

/**
 * Writes a 0–1 progress value for an element's pass through the viewport onto
 * the element itself as `--p`, without re-rendering React on every frame.
 */
function useScrollProgress(ref, { from = 'enter', to = 'leave' } = {}) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let frame = 0
    const measure = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight || 1
      const start = from === 'top' ? 0 : vh
      const span = from === 'top' ? rect.height : rect.height * 0.5 + vh
      const p = Math.min(1, Math.max(0, (start - rect.top) / span))
      el.style.setProperty('--p', p.toFixed(4))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ref, from, to])
}

function useInView(ref, threshold = 0.2) {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    // Content must never stay hidden because an observer did not fire — the
    // reveal is a nicety, the quotes are not.
    const failsafe = setTimeout(() => setSeen(true), 2500)
    return () => {
      clearTimeout(failsafe)
      io.disconnect()
    }
  }, [ref, threshold])
  return seen
}

export default function App() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  // The lot on the drum when the page loads is today's batch, not simply the
  // first row of the shelf.
  const [activeId, setActiveId] = useState('colombia')
  const [cart, setCart] = useState([])
  const [justAdded, setJustAdded] = useState(null)

  const heroRef = useRef(null)
  const brewRef = useRef(null)
  const logRef = useRef(null)
  useScrollProgress(heroRef, { from: 'top' })
  useScrollProgress(brewRef)

  const active = useMemo(() => BEANS.find((b) => b.id === activeId) || BEANS[0], [activeId])
  const recipe = RECIPE_BY_ROAST[active.roast]

  useEffect(() => {
    if (!justAdded) return
    const id = setTimeout(() => setJustAdded(null), 1800)
    return () => clearTimeout(id)
  }, [justAdded])

  const addToCart = useCallback((bean) => {
    setCart((c) => [...c, bean.id])
    setJustAdded(bean.id)
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    setSent(true)
    setEmail('')
    setMessage('')
  }

  function selectLot(bean, { scroll = false } = {}) {
    setActiveId(bean.id)
    if (scroll) logRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="page" data-lot={active.id} data-roast={active.roast.toLowerCase()}>
      <a className="skip" href="#hero">Skip to content</a>

      <aside className="rail" aria-hidden="true">
        <span className="rail__mark">Northwind Roast Log</span>
        <span className="rail__lot">
          <em>On the drum</em>
          <b>{active.lot}</b>
        </span>
      </aside>

      <nav className="nav" id="site-nav">
        <a className="nav-logo" href="#hero">
          <span className="nav-logo__name">Northwind Coffee Roasters</span>
          <span className="nav-logo__place">Bergen · 60.39°N</span>
        </a>
        <div className="nav-links">
          {NAV.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </div>
        <span className="nav-cart" data-count={cart.length}>
          <span className="visually-hidden">Bags in cart:</span>
          <b className="num">{cart.length}</b> in cart
        </span>
      </nav>

      <header className="hero" id="hero" ref={heroRef}>
        <div className="hero__frame">
          <img
            className="hero__img"
            src="/media/probat-drum.jpg"
            width="1024"
            height="683"
            alt="The front plate of a vintage Probat drum roaster, copper and lit from above, with its bean-trier and temperature gauge."
            fetchPriority="high"
          />
          <span className="hero__ember" aria-hidden="true" />
        </div>

        <div className="hero__type">
          <p className="hero__eyebrow">
            <span>Bergen, Norway</span>
            <span>Roasting since 2014</span>
          </p>
          <h1>
            Small-batch coffee,<br />
            <em>roasted the morning it ships.</em>
          </h1>
          <p className="hero__body">
            We roast single-origin beans in 12kg batches on a 1962 Probat in Bergen, Norway,
            and ship them within hours. Freshness is not a slogan here; it is a timestamp on the bag.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#beans">Shop the beans</a>
            <a className="btn btn-secondary" href="#brew-guide">Learn to brew</a>
          </div>
        </div>

        <figure className="ticket" aria-label="Batch ticket">
          <figcaption>Batch ticket</figcaption>
          <dl>
            <div><dt>Lot</dt><dd className="num">{active.lot}</dd></div>
            <div><dt>Origin</dt><dd>{active.origin}</dd></div>
            <div><dt>Drum</dt><dd>1962 Probat · 12kg</dd></div>
            <div><dt>Charge</dt><dd className="num">{active.profile.charge}°C</dd></div>
            <div><dt>Drop</dt><dd className="num">{fmtTime(active.profile.drop)} / {active.profile.points[4][1]}°C</dd></div>
            <div><dt>Roast to ship</dt><dd className="num">&lt;24h</dd></div>
          </dl>
          <p className="ticket__gauge" aria-hidden="true">
            <span className="ticket__needle" />
            <span className="ticket__temp num">drum preheat</span>
          </p>
        </figure>
      </header>

      <section className="section section--story" id="story">
        <div className="section__head">
          <span className="tag">01 — Provenance</span>
          <h2>Our story</h2>
        </div>
        <div className="story">
          <p className="story__lead">
            Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still
            small on purpose: two roasters, one machine, and direct relationships with eleven farms
            across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra. We pay on average 2.4× the
            commodity price and publish every contract.
          </p>
          <figure className="story__shot story__shot--city">
            <img src="/media/bergen-bryggen.jpg" width="1024" height="576" loading="lazy"
              alt="A wooden passage at Bryggen in Bergen opening onto the harbour square in hard sunlight." />
            <figcaption>Bryggen, Bergen — two streets from the roastery.</figcaption>
          </figure>
          <figure className="story__shot story__shot--farm">
            <img src="/media/farm-picking.jpg" width="1024" height="683" loading="lazy"
              alt="Two pickers selecting ripe cherries by hand on a Colombian coffee plantation." />
            <figcaption>Picking by selection — one of eleven partner farms.</figcaption>
          </figure>
        </div>

        <table className="ledger">
          <caption className="visually-hidden">Northwind by the numbers</caption>
          <tbody>
            <tr>
              <td className="ledger__value num">11</td>
              <th scope="row">partner farms</th>
              <td className="ledger__note">Ethiopia, Colombia, Kenya, Guatemala, Sumatra. Every contract published.</td>
            </tr>
            <tr>
              <td className="ledger__value num">2.4×</td>
              <th scope="row">commodity price paid</th>
              <td className="ledger__note">The average we pay above the C-market, across all eleven farms.</td>
            </tr>
            <tr>
              <td className="ledger__value num">12kg</td>
              <th scope="row">max batch size</th>
              <td className="ledger__note">One drum, two roasters, no batch bigger than the trier can judge.</td>
            </tr>
            <tr>
              <td className="ledger__value num">&lt;24h</td>
              <th scope="row">roast to shipment</th>
              <td className="ledger__note">Dropped in the morning, boxed by afternoon, on the van the same day.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="section section--beans" id="beans">
        <div className="section__head">
          <span className="tag">02 — Green on the shelf</span>
          <h2>This month's beans</h2>
          <p className="section__intro">
            Six lots, six roast profiles. Pick one to load its log into the plot below.
          </p>
        </div>

        <div className="lots" role="list">
          <div className="lots__header" aria-hidden="true">
            <span>Lot</span><span>Roast</span><span>Tasting notes</span><span>Price</span>
          </div>
          {BEANS.map((b) => {
            const isActive = b.id === activeId
            const added = justAdded === b.id
            return (
              <article
                className={`lot${isActive ? ' is-active' : ''}`}
                key={b.id}
                data-bean={b.id}
                role="listitem"
              >
                <div className="lot__id">
                  <span className="lot__chip" style={{ background: b.roastColor }} aria-hidden="true" />
                  <span className="lot__names">
                    <b>{b.name}</b>
                    <span className="lot__meta num">{b.lot} · {b.origin}</span>
                  </span>
                </div>

                <div className="lot__roast">
                  <span className="lot__level">{b.roast}</span>
                  <span className="lot__scale" aria-hidden="true">
                    <span className="lot__pin" style={{ left: `${ROAST_POSITION[b.roast] * 100}%`, background: b.roastColor }} />
                  </span>
                  <span className="lot__agtron num">Agtron {b.agtron}</span>
                </div>

                <p className="lot__notes">{b.notes}</p>

                <p className="lot__spec num">{b.process} · {b.varietal} · {b.altitude}</p>

                <div className="lot__buy">
                  <span className="lot__price num">${b.price}<span className="unit">/250g</span></span>
                  <button
                    type="button"
                    className={`btn lot__add${added ? ' is-added' : ''}`}
                    onClick={() => addToCart(b)}
                  >
                    {added ? 'Added ✓' : 'Add to cart'}
                  </button>
                  <button
                    type="button"
                    className="lot__select"
                    aria-pressed={isActive}
                    onClick={() => selectLot(b, { scroll: true })}
                  >
                    {isActive ? 'On the plot' : 'Read the roast log'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="section section--log" id="roast-log" ref={logRef}>
        <div className="section__head">
          <span className="tag">03 — The peak of the day</span>
          <h2>Nine minutes, logged to the second</h2>
          <p className="section__intro">
            Every batch leaves a curve behind: the probe in the bean mass, the falling rate of rise,
            the second the crack starts and the second we drop. This is {active.name}'s, as roasted.
          </p>
        </div>

        <div className="lotswitch" role="group" aria-label="Choose a lot to plot">
          {BEANS.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`lotswitch__btn${b.id === activeId ? ' is-active' : ''}`}
              aria-pressed={b.id === activeId}
              onClick={() => selectLot(b)}
            >
              <span className="lotswitch__chip" style={{ background: b.roastColor }} aria-hidden="true" />
              <span className="lotswitch__lot num">{b.lot}</span>
              <span className="lotswitch__name">{b.name}</span>
            </button>
          ))}
        </div>

        <RoastCurve bean={active} key={active.id} />
      </section>

      <section className="section section--brew" id="brew-guide" ref={brewRef}>
        <div className="section__head">
          <span className="tag">04 — The other three minutes</span>
          <h2>Brew guide: pour over in four steps</h2>
          <p className="section__intro">
            The roast curve ends at the cooling tray. The second curve is yours, and it is shorter.
          </p>
        </div>

        <ol className="steps">
          <span className="steps__axis" aria-hidden="true"><span className="steps__fill" /></span>
          {STEPS.map((s) => (
            <li className="step" key={s.n} style={{ '--at': s.axis }}>
              <span className="step-number num">{s.n}</span>
              <span className="step__time num">{s.at}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>

        <aside className="recipe" aria-live="polite">
          <p className="recipe__head">
            <span className="recipe__chip" style={{ background: active.roastColor }} aria-hidden="true" />
            Dialled for <b>{active.name}</b> · {active.roast.toLowerCase()} roast
          </p>
          <dl>
            <div><dt>Grind</dt><dd>{recipe.grind}</dd></div>
            <div><dt>Water</dt><dd className="num">{recipe.water}</dd></div>
            <div><dt>Ratio</dt><dd className="num">{recipe.ratio}</dd></div>
            <div><dt>Bloom</dt><dd className="num">{recipe.bloom}</dd></div>
          </dl>
          <p className="recipe__foot num">
            {recipe.clicks} on a hand grinder · development {(developmentRatio(active.profile) * 100).toFixed(1)}% ·
            rest 5 days after the drop
          </p>
        </aside>
      </section>

      <Reviews />

      <section className="section section--subscribe" id="subscribe">
        <figure className="subscribe__shot">
          <img src="/media/cooling-tray.jpg" width="1024" height="680" loading="lazy"
            alt="A cooling tray heaped with just-dropped roasted coffee beans, the arm still turning." />
        </figure>
        <div className="subscribe__type">
          <span className="tag">06 — Standing order</span>
          <h2>The Northwind subscription</h2>
          <p>
            Two 250g bags of our current favourites, every month, free shipping, pause any time.
            $29/month.
          </p>
          <p className="subscribe__next num">
            <span>Next box opens with</span>
            <b style={{ borderColor: active.roastColor }}>{active.lot} {active.name}</b>
          </p>
          <a className="btn btn-primary" href="#contact">Start a subscription</a>
        </div>
      </section>

      <section className="section section--contact" id="contact">
        <div className="section__head">
          <span className="tag">07 — Talk to the roasters</span>
          <h2>Get in touch</h2>
        </div>
        <div className="contact">
          {sent ? (
            <p className="form-success" role="status">Thanks — we read everything and reply within a day.</p>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                rows={4}
                placeholder="Questions, wholesale, or just coffee talk"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Send message</button>
            </form>
          )}
          <p className="contact__aside">
            Two roasters read this inbox. Wholesale, a bag that arrived stale, or an argument about
            bloom times — all of it lands in the same place.
          </p>
        </div>
      </section>

      <footer className="footer" id="site-footer">
        <p className="footer__mark">© 2026 Northwind Coffee Roasters — Bergen, Norway</p>
        <div className="footer-links">
          <a href="#hero">Top</a>
          <a href="/shipping">Shipping</a>
          <a href="/returns">Returns</a>
          <a href="/privacy">Privacy</a>
        </div>
        <p className="footer__credits">
          Photographs:{' '}
          {CREDITS.map((c, i) => (
            <span key={c.href}>
              {i ? ' · ' : ''}
              <a href={c.href} rel="noopener noreferrer" target="_blank">{c.what}</a> by {c.who}, {c.licence}
            </span>
          ))}
        </p>
      </footer>
    </div>
  )
}

function Reviews() {
  const ref = useRef(null)
  const seen = useInView(ref, 0.15)
  return (
    <section className={`section section--reviews${seen ? ' is-seen' : ''}`} id="reviews" ref={ref}>
      <div className="section__head">
        <span className="tag">05 — Cupped elsewhere</span>
        <h2>What subscribers say</h2>
      </div>
      <div className="reviews">
        {REVIEWS.map((r, i) => (
          <blockquote className="review" key={r.name} style={{ '--i': i }}>
            <p>“{r.quote}”</p>
            <footer>
              <strong>{r.name}</strong> <span className="num">{r.role}</span>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  )
}
