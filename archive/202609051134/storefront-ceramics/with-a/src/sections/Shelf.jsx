import { PRODUCTS, GLAZES, glazeName } from '../data.js'

// The shelf. Every tile is as wide as the piece is wide: one shared
// millimetre scale across all nine, read against the rule underneath.
const MAX = 275 // Dinner Plate, the widest piece
const SHELVES = [PRODUCTS.slice(0, 5), PRODUCTS.slice(5)]

function Rule() {
  const ticks = []
  for (let mm = 0; mm <= MAX; mm += 25) {
    ticks.push(
      <span className={`rule__tick ${mm % 50 === 0 ? 'is-major' : ''}`} style={{ left: `calc(${mm} * var(--mmpx))` }} key={mm}>
        {mm % 50 === 0 ? <i>{mm}</i> : null}
      </span>,
    )
  }
  return (
    <div className="rule" aria-hidden="true">
      {ticks}
      <span className="rule__unit">mm across</span>
    </div>
  )
}

export default function Shelf({ glaze, setGlaze, add, bagCount }) {
  return (
    <section className="shop" id="shop" aria-labelledby="shop-h">
      <header className="shop__head">
        <div>
          <p className="eyebrow">Nine pieces</p>
          <h2 id="shop-h">
            On the shelf, at the size they<span className="shop__em"> actually are</span>
          </h2>
        </div>
        <p className="shop__note">
          Each piece is drawn as wide as it really is, on one scale. The espresso cup is 60mm across; the dinner plate is
          275mm. Read them against the rule.
        </p>
      </header>

      <div className="shop__filter">
        <span className="shop__filterlabel" id="glaze-filter-label">Showing</span>
        <div className="chips" role="group" aria-labelledby="glaze-filter-label">
          {GLAZES.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`chip chip--${g.id} ${glaze === g.id ? 'is-on' : ''}`}
              aria-pressed={glaze === g.id}
              onClick={() => setGlaze(g.id)}
            >
              {g.name}
            </button>
          ))}
        </div>
        <p className="shop__filternote">
          {PRODUCTS.filter((p) => p.glazes.includes(glaze)).length} of the nine are made in {glazeName(glaze)}. The rest
          are marked.
        </p>
      </div>

      {SHELVES.map((row, i) => (
        <div className="shelf" key={i}>
          <ul className="shelf__row" style={{ '--shelfh': `calc(${Math.max(...row.map((p) => p.across))} * var(--mmpx))` }}>
            {row.map((p) => {
              const offered = p.glazes.includes(glaze)
              const soldOut = p.stock === 'out'
              return (
                <li
                  className={`piece ${soldOut ? 'is-out' : ''} ${offered ? '' : 'is-other'}`}
                  key={p.id}
                  id={`piece-${p.id}`}
                  style={{ '--w': p.across }}
                  data-reveal
                >
                  <div className="piece__frame">
                    <img src={`/media/${p.img}.webp`} alt={`${p.name} — ${p.dims}`} loading="lazy" />
                    {soldOut && <span className="piece__sold">Sold out</span>}
                  </div>
                  <div className="piece__body">
                    <h3 className="piece__name">
                      {p.name} <span className="piece__price">£{p.price}</span>
                    </h3>
                    <p className="piece__spec">
                      {p.dims}
                      {p.capacity ? ` · ${p.capacity}` : ''}
                    </p>
                    <p className={`piece__stock ${soldOut ? 'is-out' : ''}`}>
                      {soldOut ? 'Sold out — about six weeks' : 'In stock'}
                    </p>
                    <p className="piece__care">
                      {p.dishwasher ? 'Dishwasher safe' : 'Not dishwasher safe'}.{' '}
                      {p.microwave ? 'Microwave safe' : 'Not microwave safe'}.
                    </p>
                    <p className="piece__buylabel">{soldOut ? 'Made in' : 'Add in'}</p>
                    <div className="piece__buy">
                      {p.glazes.map((gid) => (
                        <button
                          key={gid}
                          type="button"
                          className={`buy buy--${gid} ${gid === glaze ? 'is-current' : ''}`}
                          disabled={soldOut}
                          onClick={() => add(p, gid)}
                          aria-label={
                            soldOut
                              ? `${p.name} in ${glazeName(gid)} — sold out`
                              : `Add ${p.name} in ${glazeName(gid)} to the bag`
                          }
                        >
                          <span className="buy__dot" aria-hidden="true" />
                          {glazeName(gid)}
                        </button>
                      ))}
                    </div>
                    {!offered && <p className="piece__not">Not made in {glazeName(glaze)}</p>}
                  </div>
                </li>
              )
            })}
          </ul>
          <Rule />
        </div>
      ))}
      <p className="shop__bagline" aria-hidden={bagCount === 0}>
        {bagCount > 0 ? `${bagCount} in the bag.` : ''}
      </p>
    </section>
  )
}
