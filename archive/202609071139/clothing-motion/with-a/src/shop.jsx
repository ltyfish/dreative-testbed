import { useEffect, useRef, useState, useId } from 'react'

// Which cloth each garment is shown in. The pictures are made from the fabric the
// garment is cut from; they represent the garments and are not photographs of stock.
export const MEDIA = {
  oxford: { src: '/garment-oxford.webp', shown: 'Pale blue' },
  tee: { src: '/garment-tee.webp', shown: 'White' },
  chore: { src: '/garment-chore.webp', shown: 'Indigo' },
  overshirt: { src: '/garment-overshirt.webp', shown: 'Charcoal' },
  trouser: { src: '/garment-trouser.webp', shown: 'Stone' },
  jean: { src: '/garment-jean.webp', shown: 'Rinse' },
  knit: { src: '/garment-knit.webp', shown: 'Navy' },
  cardigan: { src: '/garment-cardigan.webp', shown: 'Charcoal' },
  shorts: { src: '/garment-shorts.webp', shown: 'Khaki' },
}

export const money = (n) => `£${n.toFixed(2).replace(/\.00$/, '')}`

/* ------------------------------------------------------------------ reveal */
// Sections arrive the way the cloth does: they settle rather than pop. One observer,
// one class, and nothing at all when the visitor has asked for reduced motion.
export function useReveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
      }
      // fire on the first pixel of the region, so nothing sits in its approach
      // state while the reader is already looking at it
    }, { rootMargin: '0px 0px -4% 0px', threshold: 0 })
    const seen = new Set()
    const scan = () => {
      document.querySelectorAll('.reveal:not(.is-in)').forEach((el) => {
        if (!seen.has(el)) { seen.add(el); io.observe(el) }
      })
    }
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => { io.disconnect(); mo.disconnect() }
  }, [])
}

/* -------------------------------------------------------------------- header */

export function SiteHeader({ bagCount, onOpenBag, subtotal }) {
  // over the dark loom the masthead is paper on ink; past it, ink on paper. With
  // reduced motion there is no dark scene to sit on, so it starts solid.
  const [solid, setSolid] = useState(
    () => typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [bump, setBump] = useState(false)
  const first = useRef(true)

  useEffect(() => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const onScroll = () => setSolid(still || window.scrollY > window.innerHeight * 1.05)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (first.current) { first.current = false; return }
    setBump(true)
    const t = setTimeout(() => setBump(false), 420)
    return () => clearTimeout(t)
  }, [bagCount])

  return (
    <header className={`site${solid ? ' site--solid' : ''}`}>
      <a className="site__mark" href="#top">
        Marlow <span>&amp;</span> Vale
      </a>
      <nav className="site__nav" aria-label="Sections">
        <a href="#shop">Shop</a>
        <a href="#fit">Size &amp; fit</a>
        <a href="#care">Care</a>
        <a href="#delivery">Delivery</a>
        <a href="#about">The shop</a>
      </nav>
      <button
        type="button"
        className={`site__bag${bump ? ' is-bumped' : ''}`}
        onClick={onOpenBag}
        aria-haspopup="dialog"
      >
        Bag
        <span className="site__count" aria-hidden="true">{bagCount}</span>
        <span className="visually-hidden">
          {bagCount === 1 ? '1 item' : `${bagCount} items`}
          {bagCount > 0 ? `, subtotal ${money(subtotal)}` : ''}
        </span>
      </button>
    </header>
  )
}

/* ------------------------------------------------------------------ filters */

export function Filters({ categories, counts, total, category, setCategory, shown }) {
  return (
    <div className="filters">
      <div className="filters__bar" role="group" aria-label="Filter by category">
        <button
          type="button"
          className={`chip${category === 'All' ? ' is-on' : ''}`}
          aria-pressed={category === 'All'}
          onClick={() => setCategory('All')}
        >
          All <span className="chip__n">{total}</span>
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={`chip${category === c ? ' is-on' : ''}`}
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
          >
            {c} <span className="chip__n">{counts[c]}</span>
          </button>
        ))}
      </div>
      <p className="filters__count" aria-live="polite">
        Showing {shown} of {total} garments{category === 'All' ? '' : ` in ${category}`}.
      </p>
    </div>
  )
}

/* --------------------------------------------------------------------- card */

export function Card({ garment, sizes, chosen, onChoose, onAdd, justAdded }) {
  const media = MEDIA[garment.id]
  const nameId = useId()
  const size = chosen
  const soldOut = size ? garment.sold.includes(size) : false

  return (
    <li className="card reveal" id={`g-${garment.id}`}>
      <div className="card__media" data-weave={garment.id} data-src={media.src}>
        <img
          src={media.src}
          alt={`${garment.name}, laid flat, shown in ${media.shown}`}
          loading="lazy"
          decoding="async"
        />
        <span className="card__cloth" aria-hidden="true">{garment.fabric.split(',')[0]}</span>
      </div>

      <div className="card__body">
        <div className="card__line">
          <h3 className="card__name" id={nameId}>{garment.name}</h3>
          <span className="card__price">£{garment.price}</span>
        </div>
        <p className="card__cat">{garment.category}</p>
        <p className="card__detail">{garment.detail}</p>
        <p className="card__fabric">{garment.fabric}</p>
        <p className="card__colours">
          <span>Colours</span> {garment.colours.join(', ')}
          <span className="card__shownin">Shown in {media.shown}</span>
        </p>

        <div className="sizes" role="group" aria-labelledby={nameId}>
          {sizes.map((s) => {
            const gone = garment.sold.includes(s)
            return (
              <button
                key={s}
                type="button"
                className={`size${chosen === s ? ' is-on' : ''}${gone ? ' is-gone' : ''}`}
                disabled={gone}
                aria-pressed={chosen === s}
                onClick={() => onChoose(garment.id, s)}
              >
                {s}
                {gone && <span className="visually-hidden"> — sold out</span>}
              </button>
            )
          })}
        </div>

        <p className="sizes__state" aria-live="polite">
          {chosen
            ? (soldOut ? `Size ${chosen} is sold out` : `Size ${chosen} chosen`)
            : 'No size chosen yet'}
          {garment.sold.length > 0 && (
            <span className="sizes__gone"> · {garment.sold.join(' and ')} sold out</span>
          )}
        </p>

        <button
          type="button"
          className={`add${justAdded ? ' is-added' : ''}`}
          disabled={!chosen || soldOut}
          onClick={() => onAdd(garment)}
        >
          <span>{justAdded ? 'Added to bag' : 'Add to bag'}</span>
        </button>
      </div>
    </li>
  )
}

/* ---------------------------------------------------------------------- bag */

export function BagDrawer({ open, onClose, bag, remove, total, postage }) {
  const panel = useRef(null)
  const closeBtn = useRef(null)
  const opener = useRef(null)

  useEffect(() => {
    if (open) {
      opener.current = document.activeElement
      closeBtn.current?.focus()
      const onKey = (e) => {
        if (e.key === 'Escape') { e.stopPropagation(); onClose() }
        if (e.key === 'Tab' && panel.current) {
          const f = panel.current.querySelectorAll('button, a[href], input')
          if (!f.length) return
          const first = f[0], last = f[f.length - 1]
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
        }
      }
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
      return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
    }
    opener.current?.focus?.()
  }, [open, onClose])

  const shortfall = 100 - total

  return (
    <div className={`bag${open ? ' is-open' : ''}`} aria-hidden={!open}>
      <button className="bag__scrim" type="button" tabIndex={-1} aria-hidden="true" onClick={onClose} />
      <div
        className="bag__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Your bag"
        ref={panel}
      >
        <div className="bag__head">
          <h2>Your bag</h2>
          <button type="button" className="bag__close" onClick={onClose} ref={closeBtn}>
            Close<span aria-hidden="true"> ×</span>
          </button>
        </div>

        {bag.length === 0 ? (
          <p className="bag__empty">Your bag is empty.</p>
        ) : (
          <>
            <ul className="bag__lines">
              {bag.map((line, i) => (
                <li className="bag__line" key={`${line.id}-${i}`}>
                  <span className="bag__thumb" aria-hidden="true">
                    <img src={MEDIA[line.id].src} alt="" />
                  </span>
                  <span className="bag__meta">
                    <span className="bag__name">{line.name}</span>
                    <span className="bag__size">Size {line.size}</span>
                  </span>
                  <span className="bag__price">£{line.price}</span>
                  <button type="button" className="bag__remove" onClick={() => remove(i)}>
                    Remove<span className="visually-hidden"> {line.name}, size {line.size}</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="bag__sums" aria-live="polite">
              <p className="bag__row"><span>Subtotal</span><span>£{total.toFixed(2)}</span></p>
              <p className="bag__row bag__row--note">
                {postage === 0
                  ? <span>Delivery free</span>
                  : <span>Delivery £{postage.toFixed(2)} — £{shortfall.toFixed(2)} more for free delivery</span>}
                {postage !== 0 && (
                  <span className="bag__gauge" aria-hidden="true">
                    <span style={{ transform: `scaleX(${Math.max(0.02, Math.min(1, total / 100))})` }} />
                  </span>
                )}
              </p>
              <p className="bag__row bag__row--total"><span>Total</span><span>£{(total + postage).toFixed(2)}</span></p>
            </div>

            <button type="button" className="bag__checkout">Checkout</button>
            <p className="bag__small">
              Free delivery on orders over £100, otherwise £4.95. 60 days to return anything
              unworn with its tags on.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
