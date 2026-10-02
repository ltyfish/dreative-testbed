import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

gsap.registerPlugin(ScrollTrigger, Flip)

const SIZES = ['XS', 'S', 'M', 'L', 'XL']

const GARMENTS = [
  { id: 'oxford', name: 'The Oxford Shirt', category: 'Shirts', price: 78, colours: ['White', 'Pale blue', 'Faded navy'], fabric: '100% long-staple cotton oxford, 140gsm, woven in Portugal', detail: 'Cut straight through the body with a soft collar that stands without fusing.', sold: ['XS'], image: '/media/hero-carry.png', productImage: '/media/oxford.png' },
  { id: 'tee', name: 'Heavy Cotton Tee', category: 'Shirts', price: 34, colours: ['White', 'Black', 'Ecru', 'Washed olive'], fabric: '100% organic cotton, 240gsm, tubular knit', detail: 'Heavy enough to hold its shape after a year of washing. It shrinks about 2cm in length on the first wash and then stops.', sold: [], image: '/media/tee.png' },
  { id: 'chore', name: 'Chore Jacket', category: 'Outerwear', price: 165, colours: ['Indigo', 'Sand'], fabric: '12oz cotton canvas, unlined', detail: 'Three patch pockets, a corozo button front, and a back yoke that lets you reach forward without the shoulders pulling.', sold: ['S', 'XL'], image: '/media/chore.png' },
  { id: 'overshirt', name: 'Wool Overshirt', category: 'Outerwear', price: 210, colours: ['Charcoal', 'Oat'], fabric: '80% wool, 20% nylon, brushed', detail: 'Warm enough to be the only layer down to about 8°C. Sized to go over a shirt.', sold: [], image: '/media/worn-overshirt.png', productImage: '/media/overshirt.png' },
  { id: 'trouser', name: 'Pleated Trouser', category: 'Trousers', price: 120, colours: ['Black', 'Stone', 'Brown'], fabric: '58% wool, 42% cotton twill', detail: 'A single forward pleat, a mid rise, and a leg that tapers slightly from the knee.', sold: ['M'], image: '/media/trouser.png' },
  { id: 'jean', name: 'Straight Jean', category: 'Trousers', price: 98, colours: ['Rinse', 'Mid wash', 'Ecru'], fabric: '13.5oz rigid cotton denim, selvedge', detail: 'Rigid, not stretch. It will feel stiff for two weeks and then fit only you.', sold: [], image: '/media/jean.png' },
  { id: 'knit', name: 'Lambswool Crew', category: 'Knitwear', price: 135, colours: ['Navy', 'Grey melange', 'Rust'], fabric: '100% lambswool, spun in Scotland', detail: 'Fully fashioned, so the panels are knitted to shape rather than cut out of a sheet of fabric.', sold: ['L'], image: '/media/knit.png' },
  { id: 'cardigan', name: 'Shawl Cardigan', category: 'Knitwear', price: 155, colours: ['Charcoal', 'Camel'], fabric: '70% wool, 30% alpaca', detail: 'A heavy shawl collar that stays up without a scarf.', sold: ['XS', 'S'], image: '/media/cardigan.png' },
  { id: 'shorts', name: 'Camp Short', category: 'Trousers', price: 64, colours: ['Khaki', 'Navy'], fabric: '8oz washed cotton twill', detail: 'A 7 inch inseam and an elasticated back half of the waistband.', sold: ['XL'], image: '/media/worn-shorts.png', productImage: '/media/shorts.png' },
]

const CATEGORIES = ['Shirts', 'Outerwear', 'Trousers', 'Knitwear']
const SIZE_CHART = [
  { size: 'XS', chest: 88, waist: 74, sleeve: 61 },
  { size: 'S', chest: 96, waist: 82, sleeve: 63 },
  { size: 'M', chest: 104, waist: 90, sleeve: 65 },
  { size: 'L', chest: 112, waist: 98, sleeve: 66 },
  { size: 'XL', chest: 120, waist: 107, sleeve: 67 },
]

const CARE = [
  'Everything here is washable at 30°C except the knitwear and the wool overshirt, which are hand wash or wool cycle only.',
  'Nothing we sell should go in a tumble dryer.',
  'The denim is unwashed. Wash it cold and inside out, and expect it to bleed onto light upholstery for the first few wears.',
  'We will repair anything we made, for as long as we are trading. Send it back and we quote before doing the work.',
]

const SHIPPING = [
  'Free delivery on orders over £100, otherwise £4.95. Two to three working days in the UK.',
  'Europe is £12 and five to seven working days, duties included.',
  'Rest of the world is £22 and seven to fourteen working days, duties not included.',
  '60 days to return anything unworn with its tags on, and return postage is free in the UK.',
  'Exchanges for a different size ship the same day the return is scanned, so you are not waiting twice.',
]

const REVIEWS = [
  { name: 'Priya N.', bought: 'The Oxford Shirt, M', text: 'I am 5ft 9in and it is the first shirt in years that has not been too short in the body. The collar does what they say it does.' },
  { name: 'Daniel O.', bought: 'Straight Jean, 32', text: 'Genuinely stiff for the first fortnight, exactly as warned. Now they are the only pair I wear. Sizing ran true for me.' },
  { name: 'Marta K.', bought: 'Lambswool Crew, S', text: 'Softer than I expected for the weight. It pilled a little under the arms in the first month and then settled.' },
]

const ABOUT = [
  'Eleven people, one shop in Leeds, and a website. We make about thirty styles a year and keep the ones that sell for a decade.',
  'Every garment is made in one of four factories we have visited, and each product page names which one.',
  'We do not run sales. The price is the price all year, and it is the same price in the shop as it is here.',
]

const FACTORIES = ['Vale Shirt Works', 'Calder Cut & Sew', 'North Sea Knit Room', 'Bell Foundry Clothing']

function CrossMark() {
  return <span className="cross-mark" aria-hidden="true"><i /><b /></span>
}

function ProductCard({ garment, index, chosen, onChoose, onAdd }) {
  const selected = chosen[garment.id]
  return (
    <article className={`product-card product-${index + 1}`} data-product-id={garment.id}>
      <div className="product-media-wrap">
        <img className="product-media" src={garment.image} alt={`Representative styling for ${garment.name}`} width="1024" height="1280" loading={index < 3 ? 'eager' : 'lazy'} />
        {garment.productImage && <img className="product-inset" src={garment.productImage} alt="Representative garment-only view" width="1024" height="1280" loading="lazy" />}
        <span className="product-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="product-heading">
        <div><p className="eyebrow">{garment.category}</p><h3>{garment.name}</h3></div>
        <p className="product-price">£{garment.price}</p>
      </div>
      <p className="product-detail">{garment.detail}</p>
      <p className="product-fabric">{garment.fabric}</p>
      <p className="product-colours"><span>Colours</span> {garment.colours.join(' · ')}</p>
      <fieldset className="size-picker">
        <legend>Choose a size</legend>
        <div className="size-row">
          {SIZES.map((size) => {
            const sold = garment.sold.includes(size)
            return <button key={size} type="button" disabled={sold} aria-pressed={selected === size} aria-label={sold ? `${size}, sold out` : `Choose size ${size}`} onClick={() => onChoose(garment.id, size)}>{size}<span className="sold-slash" aria-hidden="true" /></button>
          })}
        </div>
      </fieldset>
      <div className="product-action">
        <span aria-live="polite">{selected ? `Size ${selected} selected` : 'Select a size first'}</span>
        <button className="add-button" type="button" disabled={!selected} onClick={() => onAdd(garment)}>Add to bag <span aria-hidden="true">↗</span></button>
      </div>
    </article>
  )
}

function BagDrawer({ bag, open, onClose, onRemove }) {
  const closeRef = useRef(null)
  const total = bag.reduce((sum, line) => sum + line.price, 0)
  const postage = total === 0 || total >= 100 ? 0 : 4.95

  useEffect(() => {
    if (!open) return undefined
    closeRef.current?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab') {
        const focusable = [...document.querySelectorAll('.bag-drawer button:not([disabled])')]
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.classList.add('drawer-open')
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('drawer-open') }
  }, [open, onClose])

  return (
    <>
      <button className={`drawer-scrim ${open ? 'is-open' : ''}`} type="button" aria-label="Close bag" tabIndex={open ? 0 : -1} onClick={onClose} />
      <aside className={`bag-drawer ${open ? 'is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Shopping bag" aria-hidden={!open}>
        <header className="bag-header"><p className="eyebrow">Order docket</p><button ref={closeRef} type="button" onClick={onClose}>Close <span aria-hidden="true">×</span></button></header>
        <div className="bag-title"><h2>Your bag</h2><span>{bag.length} {bag.length === 1 ? 'item' : 'items'}</span></div>
        {bag.length === 0 ? <p className="empty-bag">Your bag is empty. Choose a size on any garment to begin.</p> : (
          <div className="bag-lines">{bag.map((line, index) => <div className="bag-line" key={`${line.id}-${index}`}><span className="bag-line-number">{String(index + 1).padStart(2, '0')}</span><div><strong>{line.name}</strong><span>Size {line.size}</span></div><span>£{line.price}</span><button type="button" onClick={() => onRemove(index)}>Remove</button></div>)}</div>
        )}
        {bag.length > 0 && <footer className="bag-summary"><div><span>Subtotal</span><strong>£{total.toFixed(2)}</strong></div><div className="delivery-progress"><i style={{ width: `${Math.min(100, total)}%` }} /></div><p>{postage === 0 ? 'Delivery free' : `Delivery £${postage.toFixed(2)} — £${(100 - total).toFixed(2)} more for free delivery`}</p><div><span>Total</span><strong>£{(total + postage).toFixed(2)}</strong></div><button className="checkout" type="button">Checkout <span aria-hidden="true">→</span></button></footer>}
      </aside>
    </>
  )
}

export default function App() {
  const root = useRef(null)
  const hero = useRef(null)
  const productsRef = useRef(null)
  const returnFocusRef = useRef(null)
  const [category, setCategory] = useState('All')
  const [chosen, setChosen] = useState({})
  const [bag, setBag] = useState([])
  const [bagOpen, setBagOpen] = useState(false)
  const shown = category === 'All' ? GARMENTS : GARMENTS.filter((g) => g.category === category)

  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fineDesktop = window.matchMedia('(min-width: 761px) and (pointer: fine)').matches
    const mobile = window.matchMedia('(max-width: 760px)').matches
    const lenis = !reduce && fineDesktop ? new Lenis({ lerp: 0.1, smoothWheel: true }) : null
    const raf = (time) => lenis?.raf(time * 1000)
    if (lenis) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(raf); gsap.ticker.lagSmoothing(0) }
    const context = gsap.context(() => {
      if (!reduce) {
        gsap.timeline({ scrollTrigger: { trigger: hero.current, start: 'top top', end: 'bottom bottom', scrub: 0.75, invalidateOnRefresh: true } })
          .to('.wordmark-left', { xPercent: -24, opacity: 0.16, duration: 0.95, ease: 'power2.inOut' }, 0)
          .to('.wordmark-right', { xPercent: 18, opacity: 0.16, duration: 0.95, ease: 'power2.inOut' }, 0)
          .to('.hero-copy', { y: -70, opacity: 0, duration: 0.55, ease: 'power2.in' }, 0.08)
          .to('.hero-figure', mobile
            ? { xPercent: -24, yPercent: 36, scale: 0.86, duration: 1.15, ease: 'power2.inOut' }
            : { xPercent: -105, yPercent: 42, scale: 0.5, duration: 1.15, ease: 'power2.inOut' }, 0.08)
          .to('.hero-figure img', { scale: 1.08, objectPosition: '52% 30%', duration: 1.15, ease: 'none' }, 0.08)
          .to('.handoff-label', { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }, 0.86)
          .to({}, { duration: 0.22 })
        gsap.utils.toArray('.editorial-image').forEach((frame) => gsap.fromTo(frame.querySelector('img'), { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } }))
      }
    }, root)
    Promise.all([document.fonts.ready, ...[...document.querySelectorAll('[data-critical]')].map((img) => img.decode().catch(() => {}))]).then(() => ScrollTrigger.refresh())
    return () => { context.revert(); if (lenis) { gsap.ticker.remove(raf); lenis.destroy() } }
  }, [])

  const chooseCategory = (next) => {
    const state = Flip.getState(productsRef.current?.querySelectorAll('.product-card') || [])
    setCategory(next)
    requestAnimationFrame(() => Flip.from(state, { duration: 0.65, ease: 'power3.inOut', absolute: true, stagger: 0.025, onComplete: () => ScrollTrigger.refresh() }))
  }
  const openBag = () => { returnFocusRef.current = document.activeElement; setBagOpen(true) }
  const closeBag = () => { setBagOpen(false); requestAnimationFrame(() => returnFocusRef.current?.focus()) }
  const add = (garment) => { const size = chosen[garment.id]; if (!size || garment.sold.includes(size)) return; setBag((current) => [...current, { id: garment.id, name: garment.name, size, price: garment.price }]); setBagOpen(true) }

  return (
    <div ref={root} className="site-shell">
      <a className="skip-link" href="#shop">Skip to shop</a>
      <header className="topbar"><a className="mini-brand" href="#top">Marlow &amp; Vale</a><nav aria-label="Primary"><a href="#shop">Shop</a><a href="#sizing">Sizing</a><a href="#story">Our story</a></nav><button className="bag-button" type="button" onClick={openBag}>Bag <span>({bag.length})</span><i aria-hidden="true" /></button></header>
      <main>
        <section id="top" ref={hero} className="hero-bridge" aria-labelledby="hero-title">
          <div className="hero-sticky">
            <div className="hero-wordmark" id="hero-title" aria-label="Marlow and Vale"><span className="wordmark-left">Marlow</span><span className="wordmark-right">&amp; Vale</span></div>
            <div className="hero-copy"><p>Clothes made in four factories we have been to, sold at one price all year.</p><span>Good clothes<br />Common sense</span></div>
            <div className="hero-figure"><img data-critical src="/media/hero-carry.png" alt="Representative editorial styling: navy chore jacket layered over a pale blue Oxford shirt" width="1024" height="1280" /><div className="crop-frame" aria-hidden="true"><CrossMark /></div><p className="image-disclosure">Representative imagery</p></div>
            <p className="hero-side-note">A closer way<br />of dressing</p>
            <div className="hero-foot"><span>01 / Cut</span><span className="scroll-cue">Scroll to carry the frame</span><span>02 / Carry</span></div>
            <div className="handoff-label" aria-hidden="true"><span>01</span> The Oxford Shirt</div>
          </div>
        </section>

        <section id="shop" className="shop" aria-labelledby="shop-title">
          <div className="shop-intro"><p className="eyebrow">02 / The permanent collection</p><h2 id="shop-title">Nine pieces.<br />A wardrobe that works.</h2><p>Representative clothing imagery shows the intended cut and mood. Product facts, colours and availability below are the live source of truth.</p></div>
          <div className="filter-bar" aria-label="Filter garments by category"><span>Filter</span><div className="filter-scroll"><button type="button" className={category === 'All' ? 'active' : ''} aria-pressed={category === 'All'} onClick={() => chooseCategory('All')}>All <sup>{GARMENTS.length}</sup></button>{CATEGORIES.map((name) => <button type="button" key={name} className={category === name ? 'active' : ''} aria-pressed={category === name} onClick={() => chooseCategory(name)}>{name} <sup>{GARMENTS.filter((g) => g.category === name).length}</sup></button>)}</div><p aria-live="polite">Showing {shown.length} of {GARMENTS.length}{category === 'All' ? '' : ` in ${category}`}</p></div>
          <div ref={productsRef} className={`product-grid ${category !== 'All' ? 'is-filtered' : ''}`}>{shown.map((garment) => <ProductCard key={garment.id} garment={garment} index={GARMENTS.findIndex((g) => g.id === garment.id)} chosen={chosen} onChoose={(id, size) => setChosen((current) => ({ ...current, [id]: size }))} onAdd={add} />)}</div>
        </section>

        <section id="sizing" className="sizing-band" aria-labelledby="size-title"><div className="measure-photo editorial-image"><img src="/media/oxford.png" alt="Representative Oxford shirt front view" width="1024" height="1280" loading="lazy" /><span>Measured on the body</span></div><div className="size-content"><div className="section-heading"><p className="eyebrow">03 / Measure well. Wear longer.</p><h2 id="size-title">Size chart</h2></div><div className="table-wrap"><table><caption>Body measurements in centimetres</caption><thead><tr><th>Size</th><th>Chest</th><th>Waist</th><th>Sleeve</th></tr></thead><tbody>{SIZE_CHART.map((row) => <tr key={row.size}><th scope="row">{row.size}</th><td>{row.chest}</td><td>{row.waist}</td><td>{row.sleeve}</td></tr>)}</tbody></table></div><p className="size-advice">Between two sizes? Everything except the knitwear is cut with room, so take the smaller one.</p></div></section>

        <section className="service-grid" aria-label="Care and delivery information"><article className="care-panel"><p className="eyebrow">04 / Care</p><h2>Look after it.<br />We will too.</h2><ol>{CARE.map((line, index) => <li key={line}><span>{String(index + 1).padStart(2, '0')}</span><p>{line}</p></li>)}</ol></article><div className="fabric-photo editorial-image"><img src="/media/worn-overshirt.png" alt="Representative styling of the wool overshirt" width="1024" height="1280" loading="lazy" /><span>Brushed wool / worn view</span></div><article className="shipping-panel"><p className="eyebrow">05 / Shipping &amp; returns</p><h2>From Leeds,<br />then back if needed.</h2><ol>{SHIPPING.map((line, index) => <li key={line}><span>{['UK', 'EU', 'ROW', '60', '↔'][index]}</span><p>{line}</p></li>)}</ol></article></section>

        <section className="reviews" aria-labelledby="reviews-title"><div className="reviews-heading"><p className="eyebrow">06 / People we dress</p><h2 id="reviews-title">Worn, washed,<br />lived in.</h2></div><div className="review-list">{REVIEWS.map((review, index) => <blockquote key={review.name}><span>0{index + 1}</span><p>“{review.text}”</p><footer>{review.name}<br /><i>Bought {review.bought}</i></footer></blockquote>)}</div></section>

        <section id="story" className="story-ending" aria-labelledby="story-title"><div className="story-copy"><p className="eyebrow">07 / Marlow &amp; Vale, Leeds</p><h2 id="story-title">Eleven people.<br />One shop.<br />Leeds.</h2><div className="about-copy">{ABOUT.map((line) => <p key={line}>{line}</p>)}</div></div><div className="leeds-photo editorial-image"><img src="/media/leeds-ending.png" alt="Representative northern English industrial cityscape" width="1536" height="1024" loading="lazy" /><span>Context image / Leeds, imagined</span></div><div className="factory-list"><p>Four factories, named on the garments</p>{FACTORIES.map((factory, index) => <span key={factory}>{String(index + 1).padStart(2, '0')} / {factory}</span>)}</div><p className="no-sales">No sales. The price is the price.</p><footer className="site-footer"><span>Marlow &amp; Vale</span><a href="#top">Back to the cut ↑</a><span>Leeds / Since 2014</span></footer></section>
      </main>
      <BagDrawer bag={bag} open={bagOpen} onClose={closeBag} onRemove={(index) => setBag((current) => current.filter((_, currentIndex) => currentIndex !== index))} />
    </div>
  )
}
