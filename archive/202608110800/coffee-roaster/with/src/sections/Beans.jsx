import { useState } from 'react'
import { BEANS, ROASTS } from '../data.js'
import { useRoast } from '../roast.jsx'

const SELLABLE = ROASTS.filter((r) => r.sells)

export default function Beans() {
  const { roast, setRoast } = useRoast()
  const [added, setAdded] = useState({})

  function addToCart(bean) {
    setAdded((prev) => ({ ...prev, [bean.id]: (prev[bean.id] || 0) + 1 }))
    // Preserved behaviour from the original site.
    alert(`${bean.name} added to cart`)
  }

  return (
    <section className="section beans" id="beans">
      <div className="beans-head">
        <p className="section-eyebrow">This month&rsquo;s beans</p>
        <h2 className="section-title">Six coffees, sorted by where the drum stopped.</h2>
        <p className="beans-lede">
          The rack follows the ladder. Your roast is open and in full colour; the other two stay
          racked, priced and one tap from the cart.
        </p>
      </div>

      <div className="beans-rack">
        {SELLABLE.map((r) => {
          const group = BEANS.filter((b) => b.roast.toLowerCase() === r.id)
          const open = r.id === roast
          return (
            <section
              className={`rack-group${open ? ' is-open' : ''}`}
              key={r.id}
              data-rack-group={r.id}
              aria-label={`${r.label} roast`}
            >
              <h3 className="rack-heading">
                <button type="button" className="rack-heading-btn" onClick={() => setRoast(r.id)}>
                  <span className="rack-heading-rule" aria-hidden="true" />
                  <span className="rack-heading-label">{r.label} roast</span>
                  <span className="rack-heading-count">
                    {group.length} coffee{group.length === 1 ? '' : 's'}
                  </span>
                  <span className="rack-heading-drop">{r.drop}</span>
                </button>
              </h3>

              <div className="rack-rows">
                {group.map((b) => (
                  <article
                    className="bean-card"
                    key={b.id}
                    data-bean={b.id}
                    data-roast={r.id}
                    style={{ '--tone': b.tone }}
                  >
                    <div className="bean-photo">
                      <img src={b.photo} alt={b.photoAlt} loading="lazy" />
                      <span className="bean-photo-grade" aria-hidden="true" />
                      <span className="bean-origin">{b.origin}</span>
                    </div>

                    <div className="bean-text">
                      <h4 className="bean-name">{b.name}</h4>
                      <p className="bean-notes">{b.notes}</p>
                      <p className="bean-meta">{b.roast} roast · 250g</p>
                    </div>

                    <div className="bean-buy">
                      <span className="bean-price">${b.price}</span>
                      <button type="button" className="bean-add" onClick={() => addToCart(b)}>
                        Add to cart
                        {added[b.id] ? <span className="bean-add-count">{added[b.id]}</span> : null}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </section>
  )
}
