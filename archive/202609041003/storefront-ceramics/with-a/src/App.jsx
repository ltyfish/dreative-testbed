import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { PRODUCTS, GLAZES, FIRING, MAKING, CARE, NOTES, SHIPPING, CREDITS, glazeName } from './data.js'

const img = (name, w) => `/media/${name}-${w}.webp`

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(q.matches)
    on()
    q.addEventListener('change', on)
    return () => q.removeEventListener('change', on)
  }, [])
  return reduced
}

function useCoarse() {
  const [coarse, setCoarse] = useState(false)
  useEffect(() => {
    const q = window.matchMedia('(max-width: 860px)')
    const on = () => setCoarse(q.matches)
    on()
    q.addEventListener('change', on)
    return () => q.removeEventListener('change', on)
  }, [])
  return coarse
}

/* Regions resolve while they are on screen: the trigger is the region's top
   crossing 82% of the viewport, not its first pixel crossing the bottom. */
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-in')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
      },
      { rootMargin: '0px 0px -18% 0px', threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

function Reveal({ as: As = 'div', className = '', children, ...rest }) {
  const ref = useReveal()
  return (
    <As ref={ref} className={`reveal ${className}`} {...rest}>
      {children}
    </As>
  )
}

/* ---------------------------------------------------------------- the shelf */

function Piece({ p, selected, onSelect, registerNode }) {
  const out = p.stock === 'out'
  return (
    <button
      type="button"
      className={`piece${selected ? ' is-selected' : ''}${out ? ' is-out' : ''}`}
      style={{ '--fw': p.frameMm.w, '--fh': p.frameMm.h }}
      onClick={() => onSelect(p.id)}
      aria-pressed={selected}
      aria-label={`${p.name}, £${p.price}, ${p.dims}${out ? ', sold out' : ''}`}
    >
      <span className="piece-plate">
        <img
          ref={(n) => registerNode(p.id, n)}
          src={img(p.img, 700)}
          alt={`${p.name} — thrown stoneware`}
          width={p.frame.w}
          height={p.frame.h}
          loading="lazy"
          decoding="async"
        />
      </span>
      <span className="piece-tag">
        <span className="piece-name">{p.name}</span>
        <span className="piece-mm">{p.maxMm}mm</span>
      </span>
    </button>
  )
}

function Rule() {
  const ticks = []
  for (let mm = 0; mm <= 300; mm += 10) ticks.push(mm)
  return (
    <div className="rule" aria-hidden="true">
      <div className="rule-body" style={{ '--fh': 300 }}>
        {ticks.map((mm) => (
          <span key={mm} className={`tick${mm % 50 === 0 ? ' is-major' : ''}`} style={{ '--mm': mm }}>
            {mm % 50 === 0 ? <i>{mm}</i> : null}
          </span>
        ))}
      </div>
      <span className="rule-unit">mm</span>
    </div>
  )
}

/* -------------------------------------------------------------- the firing */

function Firing({ reduced, coarse }) {
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const [p, setP] = useState(0)
  const still = !!(reduced || coarse)

  useEffect(() => {
    if (still) return
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return
    let raf = 0
    const read = () => {
      raf = 0
      const rect = section.getBoundingClientRect()
      const span = rect.height - window.innerHeight
      const v = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 0
      setP(v)
      const travel = track.scrollWidth - window.innerWidth
      track.style.transform = `translate3d(${-(v * Math.max(0, travel))}px,0,0)`
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read) }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [still])

  const active = Math.min(FIRING.length - 1, Math.floor(p * FIRING.length + 0.0001))

  return (
    <section
      className={`firing${still ? ' is-still' : ''}`}
      id="firing"
      ref={sectionRef}
      aria-labelledby="firing-h"
    >
      <div className="firing-stick">
        <div className="firing-head">
          <h2 id="firing-h">
            One glaze. <em>Eight pots.</em>
          </h2>
          <p>
            The same ash glaze, mixed in one batch, on eight pots through one firing. Nothing about them was
            decided at the wheel.
          </p>
        </div>
        <div className="firing-track" ref={trackRef}>
          {FIRING.map((f, i) => (
            <figure key={f} className={`firing-pot${i === active ? ' is-active' : ''}`} style={{ '--i': i }}>
              <img
                src={img(f, i === 0 ? 1500 : 700)}
                srcSet={`${img(f, 700)} 700w, ${img(f, 1500)} 1500w`}
                sizes="(max-width: 860px) 74vw, 34vw"
                alt={`Ash-glazed stoneware jar, pot ${i + 1} of the firing`}
                loading={i < 2 ? 'eager' : 'lazy'}
                decoding="async"
              />
              <figcaption>
                <b>{String(i + 1).padStart(2, '0')}</b>
                <span>
                  {[
                    'the glaze ran and stopped short of the foot',
                    'it pooled in the throwing rings',
                    'the shoulder took most of the ash',
                    'one side stayed dry where it faced the wall',
                    'it went green where the flame turned',
                    'the neck is darker than the belly',
                    'a run reached the shelf and had to be ground off',
                    'this one came out almost white',
                  ][i]}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="firing-foot">
          <div className="firing-count" aria-live="off">
            <b>{String(active + 1).padStart(2, '0')}</b>
            <span>/ {FIRING.length}</span>
          </div>
          <p className="firing-line">
            The glaze is mixed in small batches and each firing takes it differently, so{' '}
            <em>no two pieces match exactly.</em> The photographs are of pieces from the last firing, not of
            the one you will receive.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------- app */

export default function App() {
  const [bag, setBag] = useState([])
  const [selectedId, setSelectedId] = useState('mug-tall')
  const [glazeFocus, setGlazeFocus] = useState(null)
  const [bagOpen, setBagOpen] = useState(false)
  const reduced = usePrefersReducedMotion()
  const coarse = useCoarse()

  const shelfNodes = useRef({})
  const detailImgRef = useRef(null)
  const pendingFlip = useRef(null)
  const detailRef = useRef(null)

  const registerNode = useCallback((id, node) => {
    if (node) shelfNodes.current[id] = node
    else delete shelfNodes.current[id]
  }, [])

  const selected = PRODUCTS.find((p) => p.id === selectedId)
  const [glaze, setGlaze] = useState(selected.glazes[0])

  useEffect(() => {
    if (!selected.glazes.includes(glaze)) setGlaze(selected.glazes[0])
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  /* The piece you were looking at becomes the piece you are looking at: the
     same image changes layout ownership from the shelf to the detail plate. */
  const selectPiece = useCallback(
    (id) => {
      const node = shelfNodes.current[id]
      if (node && !reduced) pendingFlip.current = node.getBoundingClientRect()
      setSelectedId(id)
    },
    [reduced],
  )

  useLayoutEffect(() => {
    const from = pendingFlip.current
    pendingFlip.current = null
    const el = detailImgRef.current
    if (!from || !el) return
    const to = el.getBoundingClientRect()
    if (!to.width || !to.height) return
    const dx = from.left + from.width / 2 - (to.left + to.width / 2)
    const dy = from.top + from.height / 2 - (to.top + to.height / 2)
    const s = from.width / to.width
    el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0.55 },
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
      ],
      { duration: 460, easing: 'cubic-bezier(.2,.7,.2,1)' },
    )
  }, [selectedId])

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
    setBagOpen(true)
  }

  function remove(index) {
    setBag((lines) => lines.filter((_, i) => i !== index))
  }

  const total = bag.reduce((sum, l) => sum + l.price * l.qty, 0)
  const count = bag.reduce((n, l) => n + l.qty, 0)
  const toFree = Math.max(0, 60 - total)

  const jumpToPiece = useCallback(
    (id) => {
      selectPiece(id)
      const node = shelfNodes.current[id]
      if (node) {
        node.closest('.piece')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', inline: 'center', block: 'nearest' })
        document.getElementById('shelf')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
      }
    },
    [reduced, selectPiece],
  )

  const takesGlaze = useMemo(
    () => Object.fromEntries(GLAZES.map((g) => [g.id, PRODUCTS.filter((p) => p.glazes.includes(g.id))])),
    [],
  )

  return (
    <div className={`shop${glazeFocus ? ` glaze-${glazeFocus}` : ''}`}>
      <a className="skip" href="#shelf">Skip to the pieces</a>

      {/* ------------------------------------------------------- masthead */}
      <header className="masthead">
        <div className="masthead-in">
          <p className="wordmark">Kilnwork</p>
          <h1>
            Nine pieces, <em>thrown and fired here,</em> sold direct.
          </h1>
          <p className="lede">
            A two-person ceramics studio. Everything below is drawn to one scale, in millimetres, so you can
            see what you are buying before it is in your hands.
          </p>
          <a className="masthead-cue" href="#shelf">
            <span>The shelf</span>
            <svg width="13" height="26" viewBox="0 0 13 26" aria-hidden="true">
              <path d="M6.5 0v24M1 18.5l5.5 6 5.5-6" fill="none" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </a>
        </div>
      </header>

      {/* ---------------------------------------------------------- shelf */}
      <section className="shelf" id="shelf" aria-labelledby="shelf-h">
        <div className="shelf-head">
          <h2 id="shelf-h">The shelf</h2>
          <p>
            Drawn to scale against the rule. The tallest is 280mm; the smallest would sit inside it.
            <span className="hint"> Pick one up.</span>
          </p>
        </div>
        <div className="shelf-scroll">
          <div className="shelf-row">
            <Rule />
            {PRODUCTS.map((p) => (
              <Piece
                key={p.id}
                p={p}
                selected={p.id === selectedId}
                onSelect={selectPiece}
                registerNode={registerNode}
              />
            ))}
          </div>
          <div className="shelf-line" aria-hidden="true" />
        </div>
      </section>

      {/* --------------------------------------------------------- detail */}
      <section className="detail" id="piece" ref={detailRef} aria-labelledby="detail-h" aria-live="polite">
        <figure className="detail-plate">
          <img
            ref={detailImgRef}
            key={selected.id}
            src={img(selected.img, 1500)}
            srcSet={`${img(selected.img, 700)} 700w, ${img(selected.img, 1500)} 1500w`}
            sizes="(max-width: 860px) 92vw, 46vw"
            alt={`${selected.name}, ${selected.dims}`}
            width={selected.frame.w}
            height={selected.frame.h}
            decoding="async"
          />
          <figcaption>From the last firing. Yours will not be this one.</figcaption>
        </figure>

        <div className="detail-body">
          <h2 id="detail-h">{selected.name}</h2>
          <p className="detail-price">£{selected.price}</p>

          <dl className="spec">
            <div>
              <dt>Size</dt>
              <dd>{selected.dims}</dd>
            </div>
            {selected.capacity && (
              <div>
                <dt>Holds</dt>
                <dd>{selected.capacity}</dd>
              </div>
            )}
            <div>
              <dt>Dishwasher</dt>
              <dd className={selected.dishwasher ? 'yes' : 'no'}>
                {selected.dishwasher ? 'Safe' : 'Not safe'}
              </dd>
            </div>
            <div>
              <dt>Microwave</dt>
              <dd className={selected.microwave ? 'yes' : 'no'}>
                {selected.microwave ? 'Safe' : 'Not safe'}
              </dd>
            </div>
          </dl>

          <div className="pick">
            <p className="pick-label">
              Glaze
              <span>
                {selected.glazes.length === 3
                  ? 'Made in all three.'
                  : `This form is only made in ${selected.glazes.map(glazeName).join(' and ')}.`}
              </span>
            </p>
            <div className="pick-row" role="radiogroup" aria-label="Glaze">
              {GLAZES.map((g) => {
                const offered = selected.glazes.includes(g.id)
                return (
                  <button
                    key={g.id}
                    type="button"
                    role="radio"
                    aria-checked={offered && glaze === g.id}
                    disabled={!offered}
                    className={`swatch swatch-${g.id}${glaze === g.id && offered ? ' is-on' : ''}${offered ? '' : ' is-off'}`}
                    onClick={() => offered && setGlaze(g.id)}
                    title={offered ? g.note : `${selected.name} is not made in ${g.name}`}
                  >
                    <img src={img(g.img, 640)} alt="" loading="lazy" decoding="async" />
                    <span>{g.name}</span>
                    {!offered && <em>not in this form</em>}
                  </button>
                )
              })}
            </div>
          </div>

          {selected.stock === 'out' ? (
            <div className="sold-out">
              <p>
                <b>Sold out</b> — about six weeks
              </p>
              <p>
                That is one full cycle of throwing, drying, and two firings. We will not sell you one we have
                not made.
              </p>
            </div>
          ) : (
            <button className="add" type="button" onClick={() => add(selected, glaze)}>
              Add to bag — {selected.name} in {glazeName(glaze)}
              <span>£{selected.price}</span>
            </button>
          )}
        </div>
      </section>

      {/* --------------------------------------------------------- glazes */}
      <section className="glazes" id="glazes" aria-labelledby="glazes-h">
        <Reveal as="div" className="glazes-head">
          <h2 id="glazes-h">Three glazes</h2>
          <p>
            Shown at about ten times life size, off the pieces themselves. Each fires differently and no two
            pieces match exactly.
          </p>
        </Reveal>
        <div className="glaze-row">
          {GLAZES.map((g) => (
            <Reveal
              as="article"
              key={g.id}
              className={`glaze${glazeFocus === g.id ? ' is-focus' : ''}`}
              onMouseEnter={() => setGlazeFocus(g.id)}
              onMouseLeave={() => setGlazeFocus(null)}
            >
              <figure>
                <img
                  src={img(g.img, 1200)}
                  srcSet={`${img(g.img, 640)} 640w, ${img(g.img, 1200)} 1200w`}
                  sizes="(max-width: 860px) 92vw, 30vw"
                  alt={`${g.name} glaze, magnified`}
                  loading="lazy"
                  decoding="async"
                />
              </figure>
              <h3>{g.name}</h3>
              <p className="glaze-note">{g.note}</p>
              <ul className="glaze-list">
                {PRODUCTS.map((p) => {
                  const takes = p.glazes.includes(g.id)
                  return (
                    <li key={p.id} className={takes ? '' : 'is-struck'}>
                      <button type="button" onClick={() => takes && jumpToPiece(p.id)} disabled={!takes}>
                        {p.name}
                      </button>
                    </li>
                  )
                })}
              </ul>
              <p className="glaze-count">
                {takesGlaze[g.id].length} of the nine
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- firing */}
      <Firing reduced={reduced} coarse={coarse} />

      {/* ---------------------------------------------------------- making */}
      <section className="making" id="making" aria-labelledby="making-h">
        <Reveal className="making-in">
          <h2 id="making-h">How they are made</h2>
          <div className="figures">
            <div>
              <b>2</b>
              <span>of us, at the wheel</span>
            </div>
            <div>
              <b>1260°C</b>
              <span>the glaze firing, after a bisque at 1000°C</span>
            </div>
            <div>
              <b>14h</b>
              <span>with a four hour hold at the top</span>
            </div>
            <div>
              <b>6 weeks</b>
              <span>to make a sold-out piece again</span>
            </div>
          </div>
          <div className="making-text">
            {MAKING.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ------------------------------------------------------------ care */}
      <section className="care" id="care" aria-labelledby="care-h">
        <Reveal className="care-in">
          <figure className="care-foot">
            <img
              src={img('care-foot', 1200)}
              srcSet={`${img('care-foot', 640)} 640w, ${img('care-foot', 1200)} 1200w`}
              sizes="(max-width: 860px) 92vw, 42vw"
              alt="The unglazed foot ring of a bowl, where the bare clay meets the table"
              loading="lazy"
              decoding="async"
            />
            <figcaption>
              <span className="callout">The unglazed foot</span>
              This is the part that will mark a soft surface. Lift rather than slide on wood or a painted
              table.
            </figcaption>
          </figure>
          <div className="care-body">
            <h2 id="care-h">Living with them</h2>
            {CARE.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            <table className="care-table">
              <caption>Dishwasher and microwave, piece by piece</caption>
              <thead>
                <tr>
                  <th scope="col">Piece</th>
                  <th scope="col">Dishwasher</th>
                  <th scope="col">Microwave</th>
                </tr>
              </thead>
              <tbody>
                {PRODUCTS.map((p) => (
                  <tr key={p.id} className={p.dishwasher ? '' : 'is-warn'}>
                    <th scope="row">
                      <button type="button" onClick={() => jumpToPiece(p.id)}>{p.name}</button>
                    </th>
                    <td className={p.dishwasher ? 'yes' : 'no'}>{p.dishwasher ? 'Safe' : 'No'}</td>
                    <td className={p.microwave ? 'yes' : 'no'}>{p.microwave ? 'Safe' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* ----------------------------------------------------------- notes */}
      <section className="notes" id="notes" aria-labelledby="notes-h">
        <h2 id="notes-h" className="visually-hidden">
          What buyers said
        </h2>
        <div className="notes-row">
          {NOTES.map((n) => {
            const p = PRODUCTS.find((x) => x.id === n.piece)
            return (
              <Reveal as="figure" key={n.name} className="note">
                <blockquote>{n.quote}</blockquote>
                <figcaption>
                  <b>{n.name}</b>
                  <button type="button" className="note-bought" onClick={() => jumpToPiece(n.piece)}>
                    <img src={img(p.img, 700)} alt="" loading="lazy" decoding="async" />
                    <span>{n.bought}</span>
                  </button>
                </figcaption>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* ----------------------------------------------------------- terms */}
      <section className="terms" id="terms" aria-labelledby="terms-h">
        <Reveal className="terms-in">
          <h2 id="terms-h">Getting it to you</h2>
          <ol className="terms-list">
            {SHIPPING.map((line, i) => (
              <li key={i}>
                <span className="terms-n">{String(i + 1).padStart(2, '0')}</span>
                <p>{line}</p>
              </li>
            ))}
          </ol>
          <div className={`threshold${total >= 60 ? ' is-met' : ''}`}>
            <div className="threshold-bar">
              <span style={{ width: `${Math.min(100, (total / 60) * 100)}%` }} />
              <i>£60</i>
            </div>
            <p>
              {total === 0
                ? 'Free shipping over £60. Your bag is empty.'
                : total >= 60
                  ? `£${total} in the bag — shipping is free.`
                  : `£${total} in the bag. £${toFree} more and shipping is free.`}
            </p>
          </div>
        </Reveal>
      </section>

      {/* -------------------------------------------------------- colophon */}
      <footer className="colophon">
        <div className="colophon-in">
          <p className="wordmark">Kilnwork</p>
          <p className="colophon-line">A two-person ceramics studio. Nine pieces, thrown and fired here, sold direct.</p>
          <div className="credits">
            {CREDITS.map((c) => (
              <p key={c.group}>
                <b>{c.group}.</b> {c.line}
              </p>
            ))}
          </div>
        </div>
      </footer>

      {/* ------------------------------------------------------------- bag */}
      <div className={`bag${bagOpen ? ' is-open' : ''}`}>
        <button
          type="button"
          className="bag-tab"
          onClick={() => setBagOpen((o) => !o)}
          aria-expanded={bagOpen}
          aria-controls="bag-panel"
        >
          <span className="bag-word">Bag</span>
          <span className="bag-count">{count}</span>
          <span className="bag-total">£{total}</span>
        </button>
        <div className="bag-panel" id="bag-panel" hidden={!bagOpen}>
          {bag.length === 0 ? (
            <p className="bag-empty">Nothing in the bag yet.</p>
          ) : (
            <>
              <ul className="bag-lines">
                {bag.map((l, i) => {
                  const p = PRODUCTS.find((x) => x.id === l.id)
                  return (
                    <li key={`${l.id}-${l.glaze}`}>
                      <img src={img(p.img, 700)} alt="" loading="lazy" decoding="async" />
                      <span className="bag-name">
                        {l.name} <em>in {glazeName(l.glaze)}</em>
                      </span>
                      <span className="bag-qty">
                        {l.qty} × £{l.price}
                      </span>
                      <span className="bag-sum">£{l.price * l.qty}</span>
                      <button type="button" onClick={() => remove(i)} aria-label={`Remove ${l.name} in ${glazeName(l.glaze)}`}>
                        Remove
                      </button>
                    </li>
                  )
                })}
              </ul>
              <p className="bag-foot">
                <span>Total</span>
                <b>£{total}</b>
              </p>
              <p className="bag-ship">
                {total >= 60 ? 'Shipping is free.' : `£${toFree} more for free shipping.`}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
