import { BEANS, ROASTS } from '../data.js'
import { useRoast } from '../roast.jsx'

export default function Subscribe() {
  const { roast, stage, setRoast } = useRoast()
  const sellable = stage.sells ? stage : ROASTS[2]
  const picks = BEANS.filter((b) => b.roast.toLowerCase() === sellable.id)

  return (
    <section className="section subscribe" id="subscribe">
      <div className="subscribe-pitch">
        <p className="section-eyebrow">The Northwind subscription</p>
        <h2 className="section-title">
          Two bags a month, <em>still warm from the drum.</em>
        </h2>
        <p className="subscribe-lede">
          Two 250g bags of our current favourites, every month, free shipping, pause any time.
          $29/month.
        </p>
        <a className="btn btn-primary" href="#contact">
          Start a subscription
        </a>
      </div>

      {/* The last stop for the shared roast state: the shelf you have been
          building since the ladder, shown as the bags it would put in the box. */}
      <aside className="subscribe-box" data-subscribe-box aria-label="Current roast shelf">
        <p className="subscribe-box-head">
          On the {sellable.label.toLowerCase()} shelf right now
        </p>
        <ul className="subscribe-box-list">
          {picks.map((b) => (
            <li key={b.id} data-box-item={b.id}>
              <span className="subscribe-box-name">{b.name}</span>
              <span className="subscribe-box-notes">{b.notes}</span>
              <span className="subscribe-box-price">${b.price}</span>
            </li>
          ))}
        </ul>
        <p className="subscribe-box-foot">
          {stage.sells ? (
            <>Change the shelf on the <a href="#roast-ladder">roast ladder</a>.</>
          ) : (
            <>
              Green coffee never ships.{' '}
              <button type="button" className="linkish" onClick={() => setRoast('medium')}>
                Show me a roast that does
              </button>
              .
            </>
          )}
        </p>
        <span className="subscribe-box-stamp" aria-hidden="true" data-roast-stamp={roast} />
      </aside>
    </section>
  )
}
