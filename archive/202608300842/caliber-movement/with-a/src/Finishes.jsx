import { CONFIGURATIONS, chf } from './data'
import { useReveal } from './reveal'

// 200 movements will be made. Each finish's remaining allocation is drawn
// against that whole run, because "12 left" and "12 of 200 left" are different
// facts and only one of them is the one being sold.
function Allocation({ remaining }) {
  const marks = Array.from({ length: 200 }, (_, i) => i)
  return (
    <div className="alloc">
      <svg viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
        {marks.map((i) => (
          <rect
            key={i}
            x={i + 0.18}
            y={i < remaining ? 0 : 4}
            width="0.64"
            height={i < remaining ? 12 : 8}
            className={i < remaining ? 'alloc-open' : 'alloc-taken'}
          />
        ))}
      </svg>
      <p className="mono alloc-note">
        <strong>{remaining}</strong> of the run of 200 still unallocated
      </p>
    </div>
  )
}

export default function Finishes({ chosen, onChoose }) {
  const ref = useReveal()
  return (
    <section className="finishes" id="finishes" ref={ref} aria-labelledby="finishes-title">
      <header className="finishes-head">
        <p className="label">Three finishes</p>
        <h2 id="finishes-title" className="display">
          The same movement, finished three ways.
        </h2>
        <p className="lede">
          Prices are for the movement alone; casing is arranged separately. The surfaces
          below are photographed at around twenty times life size, which is roughly what a
          finisher sees.
        </p>
      </header>

      <ul className="finish-list" role="list">
        {CONFIGURATIONS.map((c) => {
          const on = chosen === c.id
          return (
            <li key={c.id} className="finish-row" data-chosen={on ? 'true' : 'false'}>
              <div className="finish-surface">
                <img src={c.surface} alt={c.surfaceNote} loading="lazy" />
                <span className="mono finish-surface-note">{c.surfaceNote}</span>
              </div>

              <div className="finish-body">
                <div className="finish-title">
                  <h3>{c.name}</h3>
                  <p className="finish-price mono">CHF {chf(c.price)}</p>
                </div>
                <p className="finish-text">{c.finish}</p>
                <p className="finish-lead mono">{c.lead}</p>
                <Allocation remaining={c.remaining} />
                <button
                  type="button"
                  className={on ? 'btn-solid' : 'btn-outline'}
                  onClick={() => onChoose(c.id)}
                  aria-pressed={on}
                >
                  {on ? 'Chosen — carried to your reservation' : `Choose ${c.name.toLowerCase()}`}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
