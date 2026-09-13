import { useEffect, useRef, useState } from 'react'

const SIZES = ['XS', 'S', 'M', 'L', 'XL']
const GARMENTS = [
  { id: 'oxford', name: 'The Oxford Shirt', category: 'Shirts', price: 78, colours: ['White', 'Pale blue', 'Faded navy'], fabric: '100% long-staple cotton oxford, 140gsm, woven in Portugal', detail: 'Cut straight through the body with a soft collar that stands without fusing.', sold: ['XS'], image: '/material/oxford.webp', factory: 'Ribeiro & Filhos · Porto' },
  { id: 'tee', name: 'Heavy Cotton Tee', category: 'Shirts', price: 34, colours: ['White', 'Black', 'Ecru', 'Washed olive'], fabric: '100% organic cotton, 240gsm, tubular knit', detail: 'Heavy enough to hold its shape after a year of washing. It shrinks about 2cm in length on the first wash and then stops.', sold: [], image: '/material/tee.webp', factory: 'Pritchard Works · Leeds' },
  { id: 'chore', name: 'Chore Jacket', category: 'Outerwear', price: 165, colours: ['Indigo', 'Sand'], fabric: '12oz cotton canvas, unlined', detail: 'Three patch pockets, a corozo button front, and a back yoke that lets you reach forward without the shoulders pulling.', sold: ['S', 'XL'], image: '/material/chore-editorial-treated.webp', factory: 'Ribeiro & Filhos · Porto' },
  { id: 'overshirt', name: 'Wool Overshirt', category: 'Outerwear', price: 210, colours: ['Charcoal', 'Oat'], fabric: '80% wool, 20% nylon, brushed', detail: 'Warm enough to be the only layer down to about 8°C. Sized to go over a shirt.', sold: [], image: '/material/overshirt.webp', factory: 'Calder Knit · Hawick' },
  { id: 'trouser', name: 'Pleated Trouser', category: 'Trousers', price: 120, colours: ['Black', 'Stone', 'Brown'], fabric: '58% wool, 42% cotton twill', detail: 'A single forward pleat, a mid rise, and a leg that tapers slightly from the knee.', sold: ['M'], image: '/material/trouser.webp', factory: 'Ribeiro & Filhos · Porto' },
  { id: 'jean', name: 'Straight Jean', category: 'Trousers', price: 98, colours: ['Rinse', 'Mid wash', 'Ecru'], fabric: '13.5oz rigid cotton denim, selvedge', detail: 'Rigid, not stretch. It will feel stiff for two weeks and then fit only you.', sold: [], image: '/material/jean.webp', factory: 'Arco Denim · Braga' },
  { id: 'knit', name: 'Lambswool Crew', category: 'Knitwear', price: 135, colours: ['Navy', 'Grey melange', 'Rust'], fabric: '100% lambswool, spun in Scotland', detail: 'Fully fashioned, so the panels are knitted to shape rather than cut out of a sheet of fabric.', sold: ['L'], image: '/material/knit.webp', factory: 'Calder Knit · Hawick' },
  { id: 'cardigan', name: 'Shawl Cardigan', category: 'Knitwear', price: 155, colours: ['Charcoal', 'Camel'], fabric: '70% wool, 30% alpaca', detail: 'A heavy shawl collar that stays up without a scarf.', sold: ['XS', 'S'], image: '/material/cardigan.webp', factory: 'Calder Knit · Hawick' },
  { id: 'shorts', name: 'Camp Short', category: 'Trousers', price: 64, colours: ['Khaki', 'Navy'], fabric: '8oz washed cotton twill', detail: 'A 7 inch inseam and an elasticated back half of the waistband.', sold: ['XL'], image: '/material/shorts.webp', factory: 'Pritchard Works · Leeds' },
]

const CATEGORIES = ['Shirts', 'Outerwear', 'Trousers', 'Knitwear']
const SIZE_CHART = [
  { size: 'XS', chest: 88, waist: 74, sleeve: 61 }, { size: 'S', chest: 96, waist: 82, sleeve: 63 },
  { size: 'M', chest: 104, waist: 90, sleeve: 65 }, { size: 'L', chest: 112, waist: 98, sleeve: 66 },
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

const jacket = GARMENTS.find((garment) => garment.id === 'chore')
const money = (value) => `£${value.toFixed(2)}`

function ProductCard({ garment, chosenSize, setChosenSize, addToBag, index }) {
  return (
    <article className={`garment garment-${garment.id}`} data-reveal style={{ '--card-index': index }}>
      <div className="garment-image">
        <img src={garment.image} alt={`Representative concept image for ${garment.name}`} loading="lazy" />
        <span>{String(index + 1).padStart(2, '0')} / 09</span>
      </div>
      <div className="garment-summary">
        <div className="garment-title"><h3>{garment.name}</h3><p>£{garment.price}</p></div>
        <p className="garment-detail">{garment.detail}</p>
        <dl>
          <div><dt>Cloth</dt><dd>{garment.fabric}</dd></div>
          <div><dt>Colour</dt><dd>{garment.colours.join(' · ')}</dd></div>
          <div><dt>Made by</dt><dd>{garment.factory}</dd></div>
        </dl>
        <fieldset className="card-sizes">
          <legend>Choose size</legend>
          <div className="sizes">
            {SIZES.map((size) => {
              const soldOut = garment.sold.includes(size)
              return <button key={size} type="button" disabled={soldOut} aria-pressed={chosenSize === size} aria-label={`${size}${soldOut ? ', sold out' : ''}`} onClick={() => setChosenSize(size)}>{size}<small>{soldOut ? 'Gone' : ''}</small></button>
            })}
          </div>
        </fieldset>
        <button className="add-button" type="button" disabled={!chosenSize} onClick={addToBag}><span>{chosenSize ? `Add size ${chosenSize}` : 'Choose a size'}</span><span>£{garment.price}</span></button>
      </div>
    </article>
  )
}

function BagDialog({ open, onClose, bag, removeLine }) {
  const ref = useRef(null)
  const subtotal = bag.reduce((sum, line) => sum + line.price, 0)
  const delivery = subtotal === 0 || subtotal >= 100 ? 0 : 4.95
  const remaining = Math.max(0, 100 - subtotal)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog className="bag-dialog" ref={ref} onClose={onClose} onCancel={onClose} onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="bag-sheet">
        <header><div><span>Your bag</span><strong>{String(bag.length).padStart(2, '0')}</strong></div><button type="button" onClick={onClose}>Close ×</button></header>
        <div className="bag-lines">
          {bag.length === 0 ? <p className="empty-bag">Nothing here yet.<br /><span>£100.00 away from free delivery.</span></p> : bag.map((line) => (
            <article key={line.lineId}><div><strong>{line.name}</strong><span>Size {line.size}</span></div><p>£{line.price.toFixed(2)}</p><button type="button" onClick={() => removeLine(line.lineId)}>Remove</button></article>
          ))}
        </div>
        <footer>
          <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
          <p>{subtotal === 0 ? 'Free UK delivery over £100.' : remaining > 0 ? `${money(remaining)} more for free delivery. Delivery is £4.95.` : 'Delivery free.'}</p>
          {bag.length > 0 && <><div><span>Delivery</span><strong>{money(delivery)}</strong></div><div className="bag-total"><span>Total</span><strong>{money(subtotal + delivery)}</strong></div><button className="checkout" type="button">Checkout</button></>}
        </footer>
      </div>
    </dialog>
  )
}

export default function App() {
  const sceneRef = useRef(null)
  const lineId = useRef(0)
  const [category, setCategory] = useState('All')
  const [chosen, setChosen] = useState({})
  const [bag, setBag] = useState([])
  const [bagOpen, setBagOpen] = useState(false)
  const shown = category === 'All' ? GARMENTS : GARMENTS.filter((garment) => garment.category === category)

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return undefined
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    const render = () => {
      frame = 0
      const rect = scene.getBoundingClientRect()
      const range = Math.max(1, scene.offsetHeight - window.innerHeight)
      const progress = reduced.matches ? 1 : Math.min(1, Math.max(0, -rect.top / range))
      scene.style.setProperty('--progress', progress.toFixed(4))
      scene.dataset.phase = progress < 0.2 ? 'encounter' : progress < 0.73 ? 'cut' : 'shop'
    }
    const requestRender = () => { if (!frame) frame = window.requestAnimationFrame(render) }
    render()
    window.addEventListener('scroll', requestRender, { passive: true })
    window.addEventListener('resize', requestRender)
    reduced.addEventListener('change', requestRender)
    return () => {
      window.removeEventListener('scroll', requestRender)
      window.removeEventListener('resize', requestRender)
      reduced.removeEventListener('change', requestRender)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    const items = [...document.querySelectorAll('[data-reveal]')]
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach((item) => item.classList.add('is-visible'))
      return undefined
    }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')), { threshold: 0.12 })
    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [category])

  const choose = (id, size) => setChosen((current) => ({ ...current, [id]: size }))
  const addToBag = (garment, size = chosen[garment.id]) => {
    if (!size || garment.sold.includes(size)) return
    lineId.current += 1
    setBag((current) => [...current, { lineId: `${garment.id}-${lineId.current}`, id: garment.id, name: garment.name, size, price: garment.price }])
    setBagOpen(true)
  }

  return (
    <main id="top">
      <section className="relay" ref={sceneRef} aria-label="From editorial image to Chore Jacket product view">
        <div className="stage">
          <header className="masthead">
            <a className="wordmark" href="#top" aria-label="Marlow and Vale home">M<span>&amp;</span>V</a>
            <p>Leeds · Est. 2014</p>
            <button className="bag-button" type="button" aria-label={`${bag.length} items in bag`} onClick={() => setBagOpen(true)}>Bag <span>{String(bag.length).padStart(2, '0')}</span></button>
          </header>
          <div className="editorial-copy" aria-hidden="true"><span className="copy-top">MADE TO</span><span className="copy-bottom">BE WORN</span></div>
          <div className="index-mark" aria-hidden="true"><span>01</span><i /><span>09</span></div>
          <figure className="carrier">
            <img className="carrier-sharp" src="/material/chore-editorial-treated.webp" alt="Concept editorial image of a model in an indigo work jacket, pale shirt and stone trousers" />
            <img className="carrier-pixel" src="/material/chore-editorial-pixel.webp" alt="" aria-hidden="true" />
            <span className="frame-corner frame-corner-a" aria-hidden="true" /><span className="frame-corner frame-corner-b" aria-hidden="true" />
            <figcaption>Concept imagery · representative, not verified inventory photography</figcaption>
          </figure>
          <p className="scroll-cue"><span>Scroll to cut</span><i aria-hidden="true" /></p>
          <article className="product-panel" aria-labelledby="jacket-title">
            <div className="product-kicker"><span>Outerwear / 03</span><span>Indigo shown</span></div>
            <div className="product-heading"><h1 id="jacket-title">Chore<br />Jacket</h1><p className="price">£{jacket.price}</p></div>
            <p className="product-detail">{jacket.detail}</p>
            <p className="product-fabric">{jacket.fabric}<br />Colours: {jacket.colours.join(', ')}</p>
            <fieldset><legend>Select size</legend><div className="sizes">{SIZES.map((size) => { const soldOut = jacket.sold.includes(size); return <button key={size} type="button" disabled={soldOut} aria-pressed={chosen.chore === size} aria-label={`${size}${soldOut ? ', sold out' : ''}`} onClick={() => choose('chore', size)}>{size}<small>{soldOut ? 'Gone' : ''}</small></button> })}</div></fieldset>
            <button className="add-button" type="button" disabled={!chosen.chore} onClick={() => addToBag(jacket)}><span>{chosen.chore ? `Add size ${chosen.chore}` : 'Choose a size'}</span><span>£{jacket.price}</span></button>
            <p className="delivery">Free UK delivery · 60 day returns</p>
          </article>
          <div className="phase-label" aria-hidden="true"><span>Encounter</span><span>Cut</span><span>Choose</span></div>
        </div>
      </section>

      <section className="release" aria-label="Collection introduction">
        <p>One honest frame becomes a useful one.</p>
        <a href="#collection"><span>Continue to the collection</span><strong>09</strong><span>garments ↓</span></a>
      </section>

      <section className="collection" id="collection">
        <header className="collection-head" data-reveal>
          <p>Permanent collection · No seasonal sale</p>
          <h2>Clothes for<br /><em>keeping.</em></h2>
          <p className="collection-intro">Nine shapes. Honest cloth. Every useful detail shown before you choose.</p>
        </header>
        <nav className="filters" aria-label="Filter garments">
          {['All', ...CATEGORIES].map((name) => <button key={name} type="button" aria-pressed={category === name} onClick={() => setCategory(name)}><span>{name}</span><sup>{name === 'All' ? GARMENTS.length : GARMENTS.filter((garment) => garment.category === name).length}</sup></button>)}
        </nav>
        <p className="showing" aria-live="polite">Showing {shown.length} of {GARMENTS.length} garments{category === 'All' ? '' : ` in ${category}`}.</p>
        <div className="garment-grid">
          {shown.map((garment, index) => <ProductCard key={garment.id} garment={garment} index={index} chosenSize={chosen[garment.id] || ''} setChosenSize={(size) => choose(garment.id, size)} addToBag={() => addToBag(garment)} />)}
        </div>
        <p className="concept-note">All garment photographs on this prototype are generated representative concept imagery for a fictional collection, not verified inventory photography.</p>
      </section>

      <section className="measurements" id="size-guide">
        <div className="measure-title" data-reveal><p>Body / Cloth / Fit</p><h2>Measured<br />on you.</h2><span>Centimetres, not garment laid flat.</span></div>
        <div className="size-table-wrap" data-reveal>
          <table><caption>Full size chart in centimetres</caption><thead><tr><th>Size</th><th>Chest</th><th>Waist</th><th>Sleeve</th></tr></thead><tbody>{SIZE_CHART.map((row) => <tr key={row.size}><th>{row.size}</th><td>{row.chest}</td><td>{row.waist}</td><td>{row.sleeve}</td></tr>)}</tbody></table>
          <p>Between two sizes? Everything except the knitwear is cut with room, so take the smaller one.</p>
        </div>
      </section>

      <section className="care-section">
        <header data-reveal><p>Care notes / Keep longer</p><h2>Wear is<br /><em>the point.</em></h2></header>
        <ol>{CARE.map((fact, index) => <li key={fact} data-reveal><span>0{index + 1}</span><p>{fact}</p></li>)}</ol>
      </section>

      <section className="reviews-section">
        <header><p>Worn, washed, reported</p><h2>Field notes</h2></header>
        <div className="reviews">{REVIEWS.map((review, index) => <figure key={review.name} data-reveal><span>“</span><blockquote>{review.text}</blockquote><figcaption><strong>{review.name}</strong><small>Bought the {review.bought}</small><i>0{index + 1}</i></figcaption></figure>)}</div>
      </section>

      <section className="shop-story">
        <header data-reveal><p>How this shop works</p><h2>No mythology.<br />Just the facts.</h2></header>
        <div className="shop-facts">{ABOUT.map((fact, index) => <article key={fact} data-reveal><span>0{index + 1}</span><p>{fact}</p></article>)}</div>
        <div className="factory-ledger" data-reveal><p>The four factories</p><ul><li>Ribeiro &amp; Filhos <span>Porto</span></li><li>Calder Knit <span>Hawick</span></li><li>Pritchard Works <span>Leeds</span></li><li>Arco Denim <span>Braga</span></li></ul></div>
      </section>

      <section className="shipping-section">
        <header data-reveal><p>Distance / Service</p><h2>From Leeds,<br /><em>without fuss.</em></h2></header>
        <div className="shipping-list">{SHIPPING.map((fact, index) => <article key={fact} data-reveal><span>{String(index + 1).padStart(2, '0')}</span><p>{fact}</p></article>)}</div>
      </section>

      <footer className="site-footer">
        <a href="#top">Marlow <i>&amp;</i> Vale</a>
        <p>Eleven people · One shop · Leeds</p>
        <button type="button" onClick={() => setBagOpen(true)}>Bag {String(bag.length).padStart(2, '0')}</button>
      </footer>

      <BagDialog open={bagOpen} onClose={() => setBagOpen(false)} bag={bag} removeLine={(id) => setBag((current) => current.filter((line) => line.lineId !== id))} />
    </main>
  )
}

export { ABOUT, CARE, CATEGORIES, GARMENTS, REVIEWS, SHIPPING, SIZE_CHART }
