import { useState } from 'react'

const COLOURWAYS = [
  { id: 'slate', name: 'Slate', price: 88, stock: 'in', hex: '#5c6572', ink: '#f4f4f3' },
  { id: 'clay', name: 'Burnt Clay', price: 88, stock: 'in', hex: '#a4523a', ink: '#fdf3ee' },
  { id: 'moss', name: 'Deep Moss', price: 88, stock: 'in', hex: '#3b4a38', ink: '#eef2ea' },
  { id: 'black', name: 'True Black', price: 84, stock: 'in', hex: '#17181b', ink: '#f2f2f2' },
  { id: 'oat', name: 'Oat', price: 88, stock: 'out', hex: '#d5c5a8', ink: '#33301f' },
  { id: 'plum', name: 'Dried Plum', price: 92, stock: 'out', hex: '#5a3242', ink: '#f7ecef' },
]

// Waist and hip are the garment laid flat and doubled; inseam is the 26 inch length.
const SIZES = [
  { size: 'XXS', waist: 58, hip: 80, inseam: 66 },
  { size: 'XS', waist: 63, hip: 85, inseam: 66 },
  { size: 'S', waist: 68, hip: 90, inseam: 66 },
  { size: 'M', waist: 74, hip: 96, inseam: 66 },
  { size: 'L', waist: 81, hip: 103, inseam: 67 },
  { size: 'XL', waist: 89, hip: 111, inseam: 67 },
  { size: '2XL', waist: 98, hip: 120, inseam: 68 },
  { size: '3XL', waist: 108, hip: 130, inseam: 68 },
]

const INSEAMS = [
  { id: 'short', label: '24 inch, short', offered: 'XXS to XL', from: 'XXS', to: 'XL' },
  { id: 'regular', label: '26 inch, regular', offered: 'XXS to 3XL', from: 'XXS', to: '3XL' },
  { id: 'tall', label: '28 inch, tall', offered: 'S to 3XL', from: 'S', to: '3XL' },
]

const ORDER = SIZES.map((s) => s.size)

// The offered range is a fact about the product, so a length and a size that are
// not sold together should not be selectable together.
function offers(inseamId, sizeName) {
  const i = INSEAMS.find((x) => x.id === inseamId)
  if (!i) return true
  const n = ORDER.indexOf(sizeName)
  return n >= ORDER.indexOf(i.from) && n <= ORDER.indexOf(i.to)
}

const FABRIC = [
  {
    head: 'Composition',
    body: '78% recycled nylon, 22% elastane, knitted in a single mill in Portugal.',
  },
  {
    head: 'Weight',
    body: '240gsm, heavier than most leggings sold at this price, which is where the opacity comes from.',
  },
  {
    head: 'Opacity',
    body: 'Opacity tested at full squat under studio light by nine wearers across the size range. No sheerness recorded at any size.',
  },
  {
    head: 'Stretch',
    body: 'Four-way stretch, so the fabric recovers across the leg as well as along it.',
  },
  {
    head: 'Gusset',
    body: 'A single diamond gusset, flatlocked, so there is no seam at the crotch to rub or fail.',
  },
]

const REVIEWS = [
  {
    quote:
      'The waistband is the first one I have owned that stays where I put it through a full session. I stopped thinking about it, which is the whole point.',
    name: 'Renata K.',
    fit: '172cm, usually a M, bought M regular',
  },
  {
    quote:
      'I ordered the tall inseam expecting the usual compromise and it actually reaches my ankle. The fabric is thicker than I expected from the photos.',
    name: 'Junho P.',
    fit: '181cm, usually a L, bought L tall',
  },
  {
    quote:
      'Sized down after the fit finder told me to and it was right. They are firm at first and settle after an hour.',
    name: 'Amara O.',
    fit: '158cm, usually an S, bought XS short',
  },
]

const RETURNS =
  'Sixty days to return anything, return shipping is free, and we accept them worn and washed. If they did not work out we would rather have them back than have you keep them in a drawer.'

// The fit finder. Below 165cm recommends the short inseam, above 176cm the tall
// one. It sizes down one step only when the wearer reports being between sizes.
function recommend(height, usualSize, between) {
  const h = Number(height)
  if (!h || !usualSize) return null
  if (h < 140 || h > 210) return { unsure: true }
  const i = SIZES.findIndex((s) => s.size === usualSize)
  if (i < 0) return { unsure: true }
  const size = between && i > 0 ? SIZES[i - 1].size : usualSize
  const inseam = h < 165 ? INSEAMS[0] : h > 176 ? INSEAMS[2] : INSEAMS[1]
  return { size, inseam }
}

export default function App() {
  const [colourway, setColourway] = useState('')
  const [size, setSize] = useState('')
  const [inseam, setInseam] = useState('')
  const [bag, setBag] = useState(null)
  const [height, setHeight] = useState('')
  const [usualSize, setUsualSize] = useState('')
  const [between, setBetween] = useState(false)

  const chosen = COLOURWAYS.find((c) => c.id === colourway)
  const canAdd = Boolean(chosen && chosen.stock === 'in' && size && inseam)
  const suggestion = recommend(height, usualSize, between)

  function pickInseam(id) {
    setInseam(id)
    if (size && !offers(id, size)) setSize('')
  }

  function applySuggestion() {
    if (!suggestion || suggestion.unsure) return
    setInseam(suggestion.inseam.id)
    setSize(suggestion.size)
    const panel = document.getElementById('buy')
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function addToBag(e) {
    e.preventDefault()
    if (!canAdd) return
    setBag({
      colourway: chosen.name,
      size,
      inseam: INSEAMS.find((i) => i.id === inseam).label,
      price: chosen.price,
    })
  }

  const swatch = chosen || COLOURWAYS[0]

  return (
    <div className="page">
      <header className="topbar">
        <a className="mark" href="#top">
          Halfmoon
        </a>
        <nav className="topnav">
          <a href="#fabric">Fabric</a>
          <a href="#sizing">Sizing</a>
          <a href="#reviews">Reviews</a>
        </nav>
        <p className="topnote">60 days. Free returns. Worn and washed is fine.</p>
      </header>

      <main id="top">
        <section className="buy" id="buy">
          <div
            className="figure"
            style={{ '--cw': swatch.hex, '--cw-ink': swatch.ink }}
            aria-hidden="true"
          >
            <div className="figure-fabric">
              <span className="figure-band" />
              <span className="figure-seam" />
            </div>
            <p className="figure-caption">
              {swatch.name} · 240gsm · four-way stretch
            </p>
          </div>

          <div className="panel">
            <p className="eyebrow">One garment, made properly</p>
            <h1>The Contour legging</h1>
            <p className="lede">
              A 240gsm knit that does not go sheer, a waistband that does not roll, and a size chart
              measured off the garment rather than off a hope. $84 to $92.
            </p>

            <form onSubmit={addToBag}>
              <fieldset className="field">
                <legend>
                  <span className="legend-label">Colourway</span>
                  <span className="legend-note">
                    {chosen ? chosen.name + ' · $' + chosen.price : 'six, two sold out'}
                  </span>
                </legend>
                <div className="swatches">
                  {COLOURWAYS.map((c) => (
                    <label
                      key={c.id}
                      className={
                        'swatch' +
                        (c.stock === 'out' ? ' is-out' : '') +
                        (colourway === c.id ? ' is-on' : '')
                      }
                      style={{ '--cw': c.hex }}
                    >
                      <input
                        type="radio"
                        name="colourway"
                        value={c.id}
                        checked={colourway === c.id}
                        disabled={c.stock === 'out'}
                        onChange={() => setColourway(c.id)}
                      />
                      <span className="swatch-chip" />
                      <span className="swatch-name">{c.name}</span>
                      <span className="swatch-price">
                        ${c.price}
                        {c.stock === 'out' ? ' · sold out' : ''}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="field">
                <legend>
                  <span className="legend-label">Inseam</span>
                  <a className="legend-note legend-link" href="#sizing">
                    size chart
                  </a>
                </legend>
                <div className="inseams">
                  {INSEAMS.map((i) => (
                    <label key={i.id} className={'inseam' + (inseam === i.id ? ' is-on' : '')}>
                      <input
                        type="radio"
                        name="inseam"
                        value={i.id}
                        checked={inseam === i.id}
                        onChange={() => pickInseam(i.id)}
                      />
                      <span className="inseam-label">{i.label}</span>
                      <span className="inseam-offered">offered {i.offered}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="field">
                <legend>
                  <span className="legend-label">Size</span>
                  <span className="legend-note">
                    {inseam
                      ? INSEAMS.find((i) => i.id === inseam).offered + ' in this length'
                      : 'XXS to 3XL'}
                  </span>
                </legend>
                <div className="sizes">
                  {SIZES.map((s) => {
                    const ok = !inseam || offers(inseam, s.size)
                    return (
                      <label
                        key={s.size}
                        className={
                          'size' + (size === s.size ? ' is-on' : '') + (ok ? '' : ' is-out')
                        }
                        title={ok ? undefined : 'Not offered in this length'}
                      >
                        <input
                          type="radio"
                          name="size"
                          value={s.size}
                          checked={size === s.size}
                          disabled={!ok}
                          onChange={() => setSize(s.size)}
                        />
                        <span>{s.size}</span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              <button type="submit" className="add" disabled={!canAdd}>
                {canAdd ? 'Add to bag — $' + chosen.price : 'Add to bag'}
              </button>
              {!canAdd && (
                <p className="hint">
                  {chosen && chosen.stock === 'out'
                    ? 'That colourway is sold out.'
                    : 'Choose a colourway, a length, and a size.'}
                </p>
              )}
            </form>

            {bag && (
              <p className="bag" role="status">
                <strong>In your bag:</strong> the Contour legging in {bag.colourway}, size {bag.size}
                , {bag.inseam}, {bag.price} dollars.
              </p>
            )}
          </div>
        </section>

        <section className="fabric" id="fabric">
          <div className="section-head">
            <h2>Why it does not go sheer</h2>
            <p>Five things about the cloth, and the test we ran on it.</p>
          </div>
          <div className="facts">
            {FABRIC.map((f, n) => (
              <article className="fact" key={f.head}>
                <span className="fact-n">{String(n + 1).padStart(2, '0')}</span>
                <h3>{f.head}</h3>
                <p>{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="sizing" id="sizing">
          <div className="section-head">
            <h2>The measurements, not the guesswork</h2>
            <p>
              Waist and hip are the garment laid flat and doubled. The inseam column is the 26 inch
              regular length; the short runs two inches under it and the tall two inches over.
            </p>
          </div>

          <div className="sizing-grid">
            <div className="chart-wrap">
              <table className="chart">
                <caption>Size chart, centimetres</caption>
                <thead>
                  <tr>
                    <th scope="col">Size</th>
                    <th scope="col">Waist</th>
                    <th scope="col">Hip</th>
                    <th scope="col">Inseam</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZES.map((s) => (
                    <tr key={s.size} className={size === s.size ? 'is-on' : undefined}>
                      <th scope="row">{s.size}</th>
                      <td>{s.waist}</td>
                      <td>{s.hip}</td>
                      <td>{s.inseam}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <aside className="finder">
              <h3>Fit finder</h3>
              <p className="finder-note">
                Two questions. If we are not confident, we say so rather than guess.
              </p>

              <label className="finder-field">
                <span>Your height in cm</span>
                <input
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  inputMode="numeric"
                  placeholder="168"
                />
              </label>

              <label className="finder-field">
                <span>The size you usually wear</span>
                <select value={usualSize} onChange={(e) => setUsualSize(e.target.value)}>
                  <option value="">choose</option>
                  {SIZES.map((s) => (
                    <option key={s.size} value={s.size}>
                      {s.size}
                    </option>
                  ))}
                </select>
              </label>

              <label className="finder-check">
                <input
                  type="checkbox"
                  checked={between}
                  onChange={(e) => setBetween(e.target.checked)}
                />
                <span>I am usually between sizes</span>
              </label>

              {suggestion && suggestion.unsure && (
                <p className="finder-out is-unsure">
                  We are not confident enough to recommend a size from that. The chart is beside
                  this.
                </p>
              )}
              {suggestion && !suggestion.unsure && (
                <div className="finder-out">
                  <p>
                    We would send you the <strong>{suggestion.size}</strong> in the{' '}
                    <strong>{suggestion.inseam.label}</strong>.
                  </p>
                  <button type="button" className="apply" onClick={applySuggestion}>
                    Use this selection
                  </button>
                </div>
              )}
            </aside>
          </div>
        </section>

        <section className="reviews" id="reviews">
          <div className="section-head">
            <h2>Three people who measured first</h2>
            <p>Every review carries the height and size behind it, because that is the part that helps.</p>
          </div>
          <div className="review-grid">
            {REVIEWS.map((r) => (
              <figure className="review" key={r.name}>
                <blockquote>{r.quote}</blockquote>
                <figcaption>
                  <span className="review-name">{r.name}</span>
                  <span className="review-fit">{r.fit}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="returns">
          <div className="returns-inner">
            <h2>If they are wrong, send them back</h2>
            <p>{RETURNS}</p>
            <ul className="returns-pills">
              <li>60 days</li>
              <li>Free return shipping</li>
              <li>Worn and washed accepted</li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="foot">
        <span className="mark">Halfmoon</span>
        <span>The Contour legging. Knitted in Portugal.</span>
      </footer>
    </div>
  )
}
