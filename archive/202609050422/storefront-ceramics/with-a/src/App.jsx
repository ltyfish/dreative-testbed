import { useCallback, useEffect, useRef, useState } from 'react'
import { GLAZES, PRODUCTS, MAKING, CARE, NOTES, SHIPPING, glazeName, glaze } from './data.js'
import { CREDITS } from './credits.js'
import TrueScale from './TrueScale.jsx'
import Firing from './Firing.jsx'

const RATIO = {
  'mug-tall': '4 / 5', 'mug-low': '1 / 1', 'cup-espresso': '1 / 1',
  'bowl-deep': '1 / 1', 'bowl-shallow': '3 / 2', 'plate-side': '1 / 1',
  'plate-dinner': '3 / 2', jug: '4 / 5', vase: '4 / 5',
}
// Anchored to features that are actually visible in the photograph.
const DIFF_NOTES = [
  { at: "The bare foot.", text: "Glaze would fuse the piece to the kiln shelf, so it stops short of the bottom. That ring of raw clay is what will mark a soft table.", x: "44%", y: "20%" },
  { at: "The mark.", text: "Cut into the clay while it was still soft, before either firing. It is the only thing on the piece that is deliberately identical each time.", x: "66%", y: "31%" },
  { at: "Where the glaze stopped.", text: "Poured by hand, so the line lands somewhere different on every piece, and pools a shade darker where it ran thick.", x: "42%", y: "55%" },
]

const SPAN = {
  'mug-tall': 2, 'mug-low': 2, 'cup-espresso': 2,
  'bowl-deep': 3, 'bowl-shallow': 3,
  'plate-side': 2, 'plate-dinner': 2, jug: 2, vase: 2,
}

/* ------------------------------------------------------------------ marks */
// Notation, drawn: the care facts as marks you can read at a glance, the way
// they are stamped into the underside of a piece.
function Mark({ kind, ok }) {
  const label = kind === 'dishwasher'
    ? (ok ? 'Dishwasher safe' : 'Not dishwasher safe')
    : (ok ? 'Microwave safe' : 'Not microwave safe')
  return (
    <span className={'mark' + (ok ? '' : ' mark--no')} title={label}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {kind === 'dishwasher' ? (
          <>
            <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
            <path d="M7 8.4h10" />
            <path d="M9.2 12.6c1 0 1 1.5 2 1.5s1-1.5 2-1.5 1 1.5 2 1.5" />
            <path d="M9.2 16c1 0 1 1.5 2 1.5s1-1.5 2-1.5 1 1.5 2 1.5" />
          </>
        ) : (
          <>
            <rect x="2.5" y="5.5" width="19" height="13" rx="1.5" />
            <path d="M15 5.5v13" />
            <path d="M5.4 12.2c.9-1.6 2-1.6 2.9 0s2 1.6 2.9 0" />
          </>
        )}
        {!ok && <path className="mark__bar" d="M4 20L20 4" />}
      </svg>
      <span className="sr">{label}</span>
    </span>
  )
}

/* ------------------------------------------------------------------- card */
function Card({ p, active, selected, onAdd, onSelect }) {
  const imgRef = useRef(null)
  const offered = p.glazes.includes(active.id)
  const out = p.stock === 'out'
  return (
    <article
      id={'piece-' + p.id}
      className={
        'card' +
        (out ? ' is-out' : '') +
        (offered ? '' : ' is-elsewhere') +
        (selected ? ' is-selected' : '')
      }
      style={{ '--span': SPAN[p.id] }}
      onMouseEnter={() => onSelect(p.id)}
    >
      <div className="card__figure" style={{ aspectRatio: RATIO[p.id] }}>
        <img ref={imgRef} src={p.img} alt={p.name + ', thrown stoneware.'} loading="lazy" />
        {out && <span className="card__flag mono">Sold out</span>}
      </div>

      <div className="card__body">
        <h3 className="card__name">
          {p.name}
          <span className="card__price mono">£{p.price}</span>
        </h3>

        <dl className="card__specs mono">
          <div><dt>Size</dt><dd>{p.dims}</dd></div>
          {p.capacity && <div><dt>Holds</dt><dd>{p.capacity}</dd></div>}
          <div className="card__care">
            <dt className="sr">Care</dt>
            <dd><Mark kind="dishwasher" ok={p.dishwasher} /><Mark kind="microwave" ok={p.microwave} /></dd>
          </div>
        </dl>

        {out ? (
          <p className="card__outnote">
            Sold out. The next one is about six weeks away &mdash; one full cycle
            of throwing, drying, and two firings.
          </p>
        ) : null}

        <div className="card__buy">
          <span className="mono card__buylabel">
            {offered ? 'Add in' : 'Not made in ' + active.name + ' — add in'}
          </span>
          <div className="card__glazes">
            {p.glazes.map((gid) => (
              <button
                key={gid}
                type="button"
                className={'gbtn' + (gid === active.id ? ' is-current' : '')}
                disabled={out}
                onClick={() => onAdd(p, gid, imgRef.current)}
              >
                <span className="gbtn__swatch" style={{ background: glaze(gid).accent }} aria-hidden="true" />
                {glazeName(gid)}
                <span className="sr">
                  {out ? ' — sold out' : ' — add ' + p.name + ' in ' + glazeName(gid) + ' to the bag'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}

/* -------------------------------------------------------------- the route */
export default function App() {
  const [bag, setBag] = useState([])
  const [active, setActive] = useState('ash')
  const [paint, setPaint] = useState('ash')
  const [wash, setWash] = useState(null)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const bagBtn = useRef(null)
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // Regional entrances. Thresholded against the top of the viewport so a tall
  // region resolves while it is still on screen rather than behind the reader.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll("[data-enter]"))
    if (!els.length) return
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("is-in"))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in")
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: "0px 0px -18% 0px", threshold: 0.02 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const reduced = () =>
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // The glaze runs down the page rather than switching. One band of the new
  // ground, soft at both edges, travelling the viewport; the page commits its
  // colours underneath it as it passes.
  const chooseGlaze = useCallback((id) => {
    setActive((cur) => {
      if (cur === id) return cur
      if (reduced()) {
        setPaint(id)
        return id
      }
      setWash({ id, key: Date.now() })
      timers.current.push(setTimeout(() => setPaint(id), 340))
      timers.current.push(setTimeout(() => setWash(null), 980))
      return id
    })
  }, [])

  const add = useCallback((p, gid, imgEl) => {
    if (p.stock === 'out') return
    setBag((lines) => {
      const at = lines.findIndex((l) => l.id === p.id && l.glaze === gid)
      if (at === -1) {
        return [...lines, { id: p.id, name: p.name, glaze: gid, price: p.price, qty: 1 }]
      }
      const next = lines.slice()
      next[at] = { ...next[at], qty: next[at].qty + 1 }
      return next
    })
    // the piece you chose travels to the bag, so the bag is never a surprise
    if (imgEl && bagBtn.current && !reduced() && typeof imgEl.animate === 'function') {
      const a = imgEl.getBoundingClientRect()
      const b = bagBtn.current.getBoundingClientRect()
      const fly = imgEl.cloneNode()
      Object.assign(fly.style, {
        position: 'fixed',
        left: a.left + 'px',
        top: a.top + 'px',
        width: a.width + 'px',
        height: a.height + 'px',
        objectFit: 'cover',
        zIndex: 90,
        pointerEvents: 'none',
        borderRadius: '2px',
      })
      document.body.appendChild(fly)
      const s = Math.max(0.1, 44 / Math.max(a.width, a.height))
      const dx = b.left + b.width / 2 - a.left - a.width / 2
      const dy = b.top + b.height / 2 - a.top - a.height / 2
      fly.animate(
        [
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')', opacity: 0.12 },
        ],
        { duration: 620, easing: 'cubic-bezier(.4,.1,.2,1)' },
      ).onfinish = () => fly.remove()
    }
  }, [])

  const remove = useCallback((i) => setBag((l) => l.filter((_, x) => x !== i)), [])
  const bump = useCallback((i, d) => setBag((l) => {
    const n = l.slice()
    const q = n[i].qty + d
    if (q < 1) return l.filter((_, x) => x !== i)
    n[i] = { ...n[i], qty: q }
    return n
  }), [])

  const total = bag.reduce((s, l) => s + l.price * l.qty, 0)
  const count = bag.reduce((s, l) => s + l.qty, 0)
  const g = glaze(paint)
  const activeG = glaze(active)
  const madeIn = PRODUCTS.filter((p) => p.glazes.includes(active)).length

  const jumpTo = useCallback((id) => {
    setSelected(id)
    const el = document.getElementById('piece-' + id)
    if (el) el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' })
  }, [])

  return (
    <div
      className="route"
      style={{
        '--paper': g.paper,
        '--paper-deep': g.paperDeep,
        '--ink': g.ink,
        '--accent': g.accent,
        '--rule': g.rule,
      }}
    >
      {wash && (
        <div key={wash.key} className="wash" aria-hidden="true" style={{ '--to': glaze(wash.id).paper }} />
      )}

      {/* ------------------------------------------------------- masthead */}
      <header className="mast">
        <div className="mast__in">
          <a className="mast__logo" href="#top">
            Kilnwork
            <span className="mast__sub mono">Two people, nine pieces</span>
          </a>

          <nav className="mast__nav mono" aria-label="Sections">
            <a href="#difference">The difference</a>
            <a href="#glazes">Glazes</a>
            <a href="#scale">Scale</a>
            <a href="#shop">The nine</a>
            <a href="#firing">The firing</a>
          </nav>

          <fieldset className="picker">
            <legend className="sr">Choose a glaze to see the shop in</legend>
            {GLAZES.map((gl) => (
              <button
                key={gl.id}
                type="button"
                className={'picker__b' + (gl.id === active ? ' is-on' : '')}
                aria-pressed={gl.id === active}
                onClick={() => chooseGlaze(gl.id)}
              >
                <span className="picker__dot" style={{ background: gl.accent }} aria-hidden="true" />
                {gl.name}
              </button>
            ))}
          </fieldset>

          <button
            ref={bagBtn}
            type="button"
            className={'mast__bag' + (count ? ' has-items' : '')}
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="bag-panel"
          >
            Bag <span className="mono">{count}</span>
          </button>
        </div>
      </header>

      {/* ----------------------------------------------------------- hero */}
      <section className="hero" id="top">
        <div className="hero__type">
          <p className="mono hero__kicker">Kilnwork &mdash; a two-person ceramics studio</p>
          <h1 className="hero__h1">
            Nine pieces,<br />thrown and fired here,<br /><em>sold direct.</em>
          </h1>
          <p className="hero__lede">
            The mug in the supermarket costs about a tenth of this one, and it is
            identical to its photograph. This one will not be. That is the whole
            of the difference, and the rest of this page is us showing it to you
            rather than telling you about it.
          </p>
          <div className="hero__acts">
            <a className="btn" href="#shop">See the nine</a>
            <a className="btn btn--quiet" href="#difference">What you are paying for</a>
          </div>
        </div>
        <figure className="hero__fig">
          <img src="/img/hero.webp" alt="A potter's hands raising the wall of a jug on the wheel." />
          <figcaption className="mono">Raising a wall. Every piece on this page starts here.</figcaption>
        </figure>
      </section>

      {/* ----------------------------------------------------- difference */}
      <section className="diff" id="difference" aria-labelledby="diff-h">
        <figure className="diff__fig" data-enter>
          <img src="/img/foot.webp" alt="The underside of a glazed cup: a bare clay foot, a mark cut into it, and the edge where the glaze stopped." />
          {DIFF_NOTES.map((n, i) => (
            <span key={n.at} className="diff__pin" style={{ left: n.x, top: n.y }} aria-hidden="true">
              <b className="mono">{i + 1}</b>
            </span>
          ))}
          <figcaption className="mono">One cup, turned over. Photographed in the studio, not retouched.</figcaption>
        </figure>
        <div className="diff__body" data-enter>
          <h2 className="h2" id="diff-h">Turn it over</h2>
          <p className="lede">
            The underside is where the two mugs stop being comparable. A factory
            mug has a smooth glazed base and a printed code. This has bare clay,
            a mark, and an edge where somebody stopped pouring.
          </p>
          <ol className="diff__keys">
            {DIFF_NOTES.map((n, i) => (
              <li key={n.at}>
                <b className="mono">{i + 1}</b>
                <span><b className="diff__keyterm">{n.at}</b> {n.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --------------------------------------------------------- glazes */}
      <section className="glazes" id="glazes" aria-labelledby="glazes-h">
        <div className="wrap glazes__head" data-enter>
          <h2 className="h2" id="glazes-h">Three glazes</h2>
          <p className="lede">
            Pick one and the whole shop below is shown in it. Not every form is
            offered in every glaze, and the page will say so where it is not.
          </p>
        </div>

        <div className="glazes__row">
          {GLAZES.map((gl) => {
            const on = gl.id === active
            return (
              <button
                key={gl.id}
                type="button"
                className={'glazec' + (on ? ' is-on' : '')}
                aria-pressed={on}
                onClick={() => chooseGlaze(gl.id)}
              >
                <span className="glazec__fig">
                  <img src={gl.img} alt={'A piece in the ' + gl.name + ' glaze.'} loading="lazy" />
                </span>
                <span className="glazec__meta">
                  <span className="glazec__name">{gl.name}</span>
                  <span className="glazec__note">{gl.note}</span>
                  <span className="mono glazec__cta">
                    {on ? 'Showing the shop in this' : 'Show the shop in this'}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="tiles" data-enter>
          <figure className="tiles__fig">
            <img src="/img/tiles-a.webp" alt="A board of glaze test tiles, each labelled by hand with its recipe." loading="lazy" />
          </figure>
          <div className="tiles__body">
            <p className="tiles__big">The same recipe, over and over, and never once the same.</p>
            <p>{MAKING[2]}</p>
          </div>
          <figure className="tiles__fig tiles__fig--b">
            <img src="/img/tiles-b.webp" alt="A second board of test tiles from the ash glaze trials." loading="lazy" />
          </figure>
        </div>
      </section>

      <TrueScale selected={selected} onSelect={jumpTo} />

      {/* ----------------------------------------------------------- shop */}
      <section className="shop" id="shop" aria-labelledby="shop-h">
        <div className="wrap shop__head" data-enter>
          <h2 className="h2" id="shop-h">The nine</h2>
          <p className="mono shop__state">
            Shown in <b>{activeG.name}</b> &mdash; {madeIn} of nine are made in it.
          </p>
        </div>
        <div className="grid">
          {PRODUCTS.map((p) => (
            <Card key={p.id} p={p} active={activeG} selected={selected === p.id} onAdd={add} onSelect={setSelected} />
          ))}
          <aside className="grid__aside" data-enter>
            <p className="grid__asidebig">Two of the nine are sold out.</p>
            <p>
              We do not take back-orders and we do not make more of something
              because it sold. The Shallow Bowl and the Bottle Vase go back on
              the page when the next firing comes out of the kiln.
            </p>
            <p className="mono grid__asidefoot">About six weeks, give or take a firing.</p>
          </aside>
        </div>
      </section>

      {/* -------------------------------------------------- band + firing */}
      <div className="band">
        <img src="/img/kiln-glow.webp" alt="" aria-hidden="true" loading="lazy" />
        <p className="mono band__cap">Three spy holes in a wood kiln at temperature.</p>
      </div>

      <Firing />

      {/* --------------------------------------------------------- studio */}
      <section className="studio" aria-labelledby="studio-h">
        <figure className="studio__tall" data-enter>
          <img src="/img/shelves.webp" alt="Freshly thrown cylinders drying on studio boards." loading="lazy" />
          <figcaption className="mono">Thrown, and now waiting. This is most of the six weeks.</figcaption>
        </figure>
        <div className="studio__body" data-enter>
          <h2 className="h2" id="studio-h">Between firings</h2>
          <p className="lede">
            Almost none of the six weeks is spent making. It is spent waiting for
            water to leave clay slowly enough that nothing cracks, and then
            waiting again for a kiln that is full enough to be worth lighting.
          </p>
        </div>
        <figure className="studio__wide" data-enter>
          <img src="/img/hands.webp" alt="A potter cupping a finished bowl in both hands." loading="lazy" />
          <figcaption className="mono">Out of the kiln, checked, and either shipped or broken up.</figcaption>
        </figure>
      </section>

      {/* ---------------------------------------------------------- notes */}
      <section className="notes" aria-labelledby="notes-h">
        <div className="wrap">
          <h2 className="h2" id="notes-h">Two notes</h2>
          <div className="notes__row">
            {NOTES.map((n) => (
              <figure key={n.name} className="note" data-enter>
                <blockquote><p>{n.quote}</p></blockquote>
                <figcaption>
                  <span className="note__name">{n.name}</span>
                  <button type="button" className="note__bought mono" onClick={() => jumpTo(n.piece)}>
                    {n.bought}
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ care + shipping */}
      <section className="terms" aria-labelledby="terms-h">
        <div className="wrap terms__in">
          <div className="terms__col" data-enter>
            <h2 className="h2" id="terms-h">Living with it</h2>
            <ul className="terms__list">
              {CARE.map((line, i) => <li key={i}>{line}</li>)}
            </ul>
          </div>
          <div className="terms__col" data-enter>
            <h2 className="h2">Getting it to you</h2>
            <ul className="terms__list">
              {SHIPPING.map((line, i) => <li key={i}>{line}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- footer */}
      <footer className="foot">
        <div className="wrap foot__in">
          <div className="foot__brand">
            <p className="foot__mark">Kilnwork</p>
            <p>{MAKING[0]}</p>
          </div>
          <details className="foot__credits">
            <summary className="mono">Photography &mdash; {CREDITS.length} sourced images, credited</summary>
            <ul>
              {CREDITS.map((c) => (
                <li key={c.slot} className="mono">
                  <span className="foot__slot">{c.slot}</span>
                  <a href={c.url} target="_blank" rel="noreferrer noopener">{c.title || 'source'}</a>
                  <span> &mdash; {c.author}, {c.licence}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </footer>

      {/* ------------------------------------------------------------ bag */}
      <div className={'bag' + (open ? ' is-open' : '') + (count ? ' has-items' : '')}>
        <button
          type="button"
          className="bag__handle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="bag-panel"
        >
          <span className="bag__handletitle">Bag</span>
          <span className="mono bag__handlesum">
            {count === 0 ? 'empty' : count + (count === 1 ? ' piece · £' : ' pieces · £') + total}
          </span>
          <span className="bag__chev" aria-hidden="true" />
        </button>

        <div className="bag__panel" id="bag-panel" hidden={!open}>
          {bag.length === 0 && <p className="bag__empty">Nothing in the bag yet.</p>}
          {bag.length > 0 && (
            <ul className="bag__lines">
              {bag.map((l, i) => (
                <li key={l.id + '-' + l.glaze} className="bagline">
                  <span className="bagline__sw" style={{ background: glaze(l.glaze).accent }} aria-hidden="true" />
                  <span className="bagline__name">
                    {l.name}
                    <span className="bagline__glaze mono"> in {glazeName(l.glaze)}</span>
                  </span>
                  <span className="bagline__qty mono">
                    <button type="button" onClick={() => bump(i, -1)} aria-label={'One fewer ' + l.name + ' in ' + glazeName(l.glaze)}>&minus;</button>
                    <b>{l.qty}</b>
                    <button type="button" onClick={() => bump(i, 1)} aria-label={'One more ' + l.name + ' in ' + glazeName(l.glaze)}>+</button>
                  </span>
                  <span className="bagline__price mono">{l.qty} &times; £{l.price} = £{l.price * l.qty}</span>
                  <button type="button" className="bagline__rm" onClick={() => remove(i)} aria-label={'Remove ' + l.name + ' in ' + glazeName(l.glaze)}>Remove</button>
                </li>
              ))}
            </ul>
          )}
          <div className="bag__foot">
            <p className="bag__total"><span>Total</span><b className="mono">£{total}</b></p>
            <p className="mono bag__ship">
              {total >= 60
                ? 'Free shipping — this is over £60.'
                : '£5.50 shipping under £60' + (total > 0 ? '. £' + (60 - total) + ' to go.' : '.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
