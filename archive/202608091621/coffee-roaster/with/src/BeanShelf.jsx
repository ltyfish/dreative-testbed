import { useEffect, useRef, useState } from 'react'
import { BEANS } from './data.js'
import { ROAST_SCALE, beanColor, roastScalePosition } from './roast.js'
import { useRoast } from './useRoast.jsx'

function flavourGradient(bean) {
  const stops = bean.noteColors.map((n, i) => {
    const from = (i / bean.noteColors.length) * 100
    const to = ((i + 1) / bean.noteColors.length) * 100
    return `${n.color} ${from}%, ${n.color} ${to}%`
  })
  return `linear-gradient(90deg, ${stops.join(', ')})`
}

function AddToCart({ bean }) {
  const { addToCart } = useRoast()
  const [justAdded, setJustAdded] = useState(false)
  const timer = useRef(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <button
      type="button"
      className="add-to-cart"
      data-added={justAdded ? 'true' : 'false'}
      onClick={(e) => {
        e.stopPropagation()
        addToCart(bean)
        setJustAdded(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setJustAdded(false), 1800)
      }}
    >
      {justAdded ? 'In the bag ✓' : 'Add to cart'}
      <span className="sr-only"> — {bean.name}, ${bean.price}</span>
    </button>
  )
}

export default function BeanShelf() {
  const { selectedBean, setSelectedBean } = useRoast()

  return (
    <section className="section beans" id="beans">
      <div className="section-head">
        <p className="eyebrow">First crack · 199°C</p>
        <h2>
          This month&rsquo;s beans, <em>plotted where they left the drum.</em>
        </h2>
        <p className="section-lede">
          Roast level is a temperature, not an adjective. Every bag below sits on the same scale
          it was dropped at — the further right the marker, the longer it stayed in. Choose one and
          the window in the rail holds at that roast so you can see the colour you are buying.
        </p>
      </div>

      <div className="scale-head" aria-hidden="true">
        <span className="scale-head-spacer">Drop temperature</span>
        <span className="scale-head-axis">
          <span>Light · {ROAST_SCALE.min}°C</span>
          <span className="scale-head-line" />
          <span>Dark · {ROAST_SCALE.max}°C</span>
        </span>
      </div>

      <ul className="bean-shelf">
        {BEANS.map((bean) => {
          const pos = roastScalePosition(bean.drop)
          const selected = selectedBean?.id === bean.id
          return (
            <li
              className="bean-row"
              key={bean.id}
              data-bean={bean.id}
              data-roast={bean.roast.toLowerCase()}
              data-selected={selected ? 'true' : 'false'}
            >
              <button
                type="button"
                className="bean-select"
                aria-pressed={selected}
                onClick={() => setSelectedBean(selected ? null : bean)}
              >
                <span
                  className="bean-disc"
                  style={{ backgroundColor: beanColor(bean.drop) }}
                  aria-hidden="true"
                />
                <span className="bean-identity">
                  <span className="bean-name">{bean.name}</span>
                  <span className="bean-notes">{bean.notes}</span>
                </span>
                <span className="bean-scale" aria-hidden="true">
                  <span className="bean-scale-track" />
                  <span
                    className="bean-flavour"
                    style={{ backgroundImage: flavourGradient(bean) }}
                  />
                  <span className="bean-scale-pin" style={{ left: `${pos * 100}%` }}>
                    <b>{bean.roast}</b>
                  </span>
                </span>
                <span className="bean-meta">{bean.roast} roast · 250g</span>
              </button>

              <span className="bean-price">${bean.price}</span>
              <AddToCart bean={bean} />

              {selected && (
                <p className="bean-cupping" role="status">
                  <span className="bean-cupping-label">In the window now</span>
                  {bean.noteColors.map((n) => (
                    <span className="flavour-chip" key={n.word}>
                      <i style={{ backgroundColor: n.color }} aria-hidden="true" />
                      {n.word}
                    </span>
                  ))}
                  <span className="bean-cupping-origin">{bean.origin}</span>
                </p>
              )}
            </li>
          )
        })}
      </ul>

      <p className="shelf-foot">
        Every bag is 250g, roasted in a 12kg batch and shipped in under 24 hours.
        {selectedBean ? (
          <> Holding at <b>{selectedBean.name}</b>. <button type="button" className="link-button" onClick={() => setSelectedBean(null)}>Release the window</button></>
        ) : (
          <> Nothing selected — the window is following the page.</>
        )}
      </p>
    </section>
  )
}
