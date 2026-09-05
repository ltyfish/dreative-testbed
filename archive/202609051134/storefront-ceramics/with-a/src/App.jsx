import { useEffect, useRef, useState } from 'react'
import { GLAZES, PRODUCTS, MAKING, CARE, NOTES, SHIPPING, CREDITS, glazeName, productById } from './data.js'
import { useReducedMotion, useReveal, gsap, ScrollTrigger } from './lib/motion.js'
import Firing from './sections/Firing.jsx'
import Shelf from './sections/Shelf.jsx'

function Hero({ glaze, setGlaze, reduced }) {
  const ref = useRef(null)
  useEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      gsap.to('.hero__img', {
        yPercent: 10,
        scale: 1.06,
        ease: 'none',
        scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true },
      })
    }, ref)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section className="hero" ref={ref}>
      <div className="hero__media">
        <img className="hero__img" src="/media/hero.webp" alt="A stoneware jar with the glaze run down one side" />
      </div>
      <div className="hero__text">
        <p className="eyebrow">Kilnwork · a two-person studio</p>
        <h1>
          Nine pieces.<br />Three glazes.<br />
          <em>No two alike.</em>
        </h1>
        <p className="hero__lede">
          A supermarket mug costs a few pounds because ten thousand of them came out of one mould. Ours are thrown on the
          wheel here, one at a time, and the fire decides how each one ends up.
        </p>
        <div className="hero__pick">
          <span className="hero__picklabel" id="hero-glaze">Pick a glaze to look through</span>
          <div className="chips" role="group" aria-labelledby="hero-glaze">
            {GLAZES.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`chip chip--${g.id} ${glaze === g.id ? 'is-on' : ''}`}
                aria-pressed={glaze === g.id}
                onClick={() => setGlaze(g.id)}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>
        <a className="hero__jump" href="#shop">
          See the nine <span aria-hidden="true">&#8595;</span>
        </a>
      </div>
    </section>
  )
}

function Fires({ glaze, setGlaze }) {
  return (
    <section className="fires" id="glazes" aria-labelledby="fires-h">
      <div className="fires__head">
        <p className="eyebrow">The three fires</p>
        <h2 id="fires-h">The glaze is mixed in small batches, and each firing takes it differently</h2>
        <p className="fires__lede">
          So no two pieces match exactly. The photographs are of pieces from the last firing, not of the one you will
          receive.
        </p>
      </div>
      <ul className="fires__list">
        {GLAZES.map((g) => {
          const count = PRODUCTS.filter((p) => p.glazes.includes(g.id)).length
          return (
            <li key={g.id} className={`fire fire--${g.id} ${glaze === g.id ? 'is-on' : ''}`} data-reveal>
              <button type="button" className="fire__btn" onClick={() => setGlaze(g.id)} aria-pressed={glaze === g.id}>
                <span className="fire__media">
                  <img src={`/media/glaze-${g.id}.webp`} alt={`A piece glazed in ${g.name}`} loading="lazy" />
                </span>
                <span className="fire__body">
                  <span className="fire__name">{g.name}</span>
                  <span className="fire__note">{g.note}</span>
                  <span className="fire__count">{count} of the nine pieces</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Care() {
  const both = PRODUCTS.filter((p) => p.dishwasher && p.microwave)
  const neither = PRODUCTS.filter((p) => !p.dishwasher && !p.microwave)
  return (
    <section className="care" id="care" aria-labelledby="care-h">
      <figure className="care__fig" data-reveal>
        <img src="/media/foot.webp" alt="The underside of a pot, showing the bare unglazed clay of the foot ring" />
        <figcaption className="care__anno">
          <span className="care__annoline" aria-hidden="true" />
          The foot is bare clay, and it will mark a soft surface.
        </figcaption>
      </figure>
      <div className="care__body">
        <p className="eyebrow">Care</p>
        <h2 id="care-h">Lift it, do not slide it</h2>
        <p className="care__lead">{CARE[0]}</p>
        <div className="care__split">
          <div className="care__col">
            <p className="care__colhead">Dishwasher and microwave</p>
            <ul>
              {both.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
            <p className="care__colnote">{CARE[2]}</p>
          </div>
          <div className="care__col care__col--no">
            <p className="care__colhead">Neither</p>
            <ul>
              {neither.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
            <p className="care__colnote">{CARE[1]}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function Notes() {
  return (
    <section className="notes" aria-labelledby="notes-h">
      <h2 className="visually-hidden" id="notes-h">What two buyers said</h2>
      {NOTES.map((n) => {
        const p = productById(n.piece)
        return (
          <figure className="note" key={n.name} data-reveal>
            <img className="note__img" src={`/media/${n.img}.webp`} alt={`Detail of a ${p.name}`} loading="lazy" />
            <blockquote className="note__quote">{n.quote}</blockquote>
            <figcaption className="note__by">
              <span className="note__name">{n.name}</span>
              <span className="note__bought">{n.bought}</span>
              <a className="note__link" href={`#piece-${p.id}`}>
                See the {p.name} &mdash; &pound;{p.price}
              </a>
            </figcaption>
          </figure>
        )
      })}
    </section>
  )
}

function Shipping() {
  return (
    <section className="ship" aria-labelledby="ship-h">
      <h2 id="ship-h">Getting it to you</h2>
      <ol className="ship__list">
        {SHIPPING.map((line, i) => (
          <li key={i} data-reveal>
            <span className="ship__n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            {line}
          </li>
        ))}
      </ol>
    </section>
  )
}

function Bag({ bag, remove, total, open, setOpen, past }) {
  const panel = useRef(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  const count = bag.reduce((n, l) => n + l.qty, 0)
  const toFree = 60 - total

  return (
    <>
      <div className={`bag ${open ? 'is-open' : ''}`} role="dialog" aria-label="Your bag" ref={panel}>
        <div className="bag__head">
          <h2>Bag</h2>
          <button type="button" className="bag__close" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
        {bag.length === 0 && <p className="bag__empty">Nothing in the bag yet.</p>}
        <ul className="bag__lines">
          {bag.map((l, i) => (
            <li key={`${l.id}-${l.glaze}`} className="bagline">
              <img src={`/media/${productById(l.id).img}.webp`} alt="" />
              <div className="bagline__body">
                <p className="bagline__name">
                  {l.name} <span className={`bagline__glaze bagline__glaze--${l.glaze}`}>{glazeName(l.glaze)}</span>
                </p>
                <p className="bagline__sum">
                  {l.qty} &times; &pound;{l.price} = <strong>&pound;{l.price * l.qty}</strong>
                </p>
              </div>
              <button type="button" className="bagline__rm" onClick={() => remove(i)}>
                Remove<span className="visually-hidden"> {l.name} in {glazeName(l.glaze)}</span>
              </button>
            </li>
          ))}
        </ul>
        {bag.length > 0 && (
          <div className="bag__foot">
            <p className="bag__total">
              <span>Total</span>
              <span>&pound;{total}</span>
            </p>
            <p className="bag__ship">
              {toFree > 0
                ? `£${toFree} more and the shipping is free.`
                : 'Shipping is free — you are over £60.'}
            </p>
          </div>
        )}
      </div>
      <button
        type="button"
        className={`bagbar ${count ? 'has-items' : ''} ${past || open ? 'is-shown' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="bagbar__label">Bag</span>
        <span className="bagbar__count">{count}</span>
        <span className="bagbar__total">&pound;{total}</span>
      </button>
      <div className={`scrim ${open ? 'is-on' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />
    </>
  )
}

export default function App() {
  const [bag, setBag] = useState([])
  const [glaze, setGlaze] = useState('ash')
  const [open, setOpen] = useState(false)
  const reduced = useReducedMotion()
  useReveal(reduced)

  useEffect(() => {
    document.documentElement.dataset.glaze = glaze
  }, [glaze])

  useEffect(() => {
    const t = setTimeout(() => ScrollTrigger.refresh(), 500)
    return () => clearTimeout(t)
  }, [])

  const [past, setPast] = useState(false)
  useEffect(() => {
    const onScroll = () => {
      const hero = document.querySelector('.hero')
      setPast(window.scrollY > (hero ? hero.offsetHeight - 120 : 400))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function add(product, glazeId) {
    if (product.stock === 'out') return
    setBag((lines) => {
      const at = lines.findIndex((l) => l.id === product.id && l.glaze === glazeId)
      if (at === -1)
        return [...lines, { id: product.id, name: product.name, glaze: glazeId, price: product.price, qty: 1 }]
      const next = lines.slice()
      next[at] = { ...next[at], qty: next[at].qty + 1 }
      return next
    })
  }

  function remove(index) {
    setBag((lines) => lines.filter((_, i) => i !== index))
  }

  const total = bag.reduce((sum, l) => sum + l.price * l.qty, 0)
  const count = bag.reduce((n, l) => n + l.qty, 0)

  return (
    <div className="page">
      <a className="skip" href="#shop">Skip to the nine pieces</a>
      <header className="top">
        <a className="top__mark" href="#top">Kilnwork</a>
        <nav className="top__nav">
          <a href="#shop">Shop</a>
          <a href="#glazes">Glazes</a>
          <a href="#making">Making</a>
          <a href="#care">Care</a>
        </nav>
        <button type="button" className="top__bag" onClick={() => setOpen(true)} aria-expanded={open}>
          Bag <span className="top__count">{count}</span>
        </button>
      </header>

      <main id="top">
        <Hero glaze={glaze} setGlaze={setGlaze} reduced={reduced} />
        <Fires glaze={glaze} setGlaze={setGlaze} />
        <Shelf glaze={glaze} setGlaze={setGlaze} add={add} bagCount={count} />
        <Firing reduced={reduced} glaze={glaze} />
        <Care />
        <Notes />
        <Shipping />
      </main>

      <footer className="foot">
        <p className="foot__line">{MAKING[0]}</p>
        <div className="foot__credits">
          <p className="foot__creditshead">Photographs</p>
          <dl>
            {CREDITS.map(([what, who]) => (
              <div key={what}>
                <dt>{what}</dt>
                <dd>{who}</dd>
              </div>
            ))}
          </dl>
        </div>
      </footer>

      <Bag bag={bag} remove={remove} total={total} open={open} setOpen={setOpen} past={past} />
    </div>
  )
}
