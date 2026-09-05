import { CONFIGURATIONS, chf } from '../data.js'

const RUN = 200
const OPEN = CONFIGURATIONS.reduce((s, c) => s + c.remaining, 0)
const ALLOCATED = RUN - OPEN

export default function Finishes({ config, setConfig }) {
  const chosen = CONFIGURATIONS.find((c) => c.id === config) || null
  const light = chosen ? chosen.light : { angle: 78, spread: 26, sheen: 0.24, contrast: 1, warmth: 1 }

  return (
    <section className="finishes" id="finishes" aria-labelledby="finishes-title">
      <header className="finishes-head">
        <p className="eyebrow">
          <span className="eyebrow-mark" aria-hidden="true" />
          Available in three finishes
        </p>
        <h2 className="section-title" id="finishes-title">
          One movement,
          <br />
          three answers to light
        </h2>
        <p className="finishes-lede">
          Prices are for the movement alone; casing is arranged separately.
        </p>
      </header>

      <div className="finishes-body">
        <figure
          className="finish-plate"
          style={{
            '--sheen-angle': `${light.angle}deg`,
            '--sheen-spread': `${light.spread}%`,
            '--sheen-op': light.sheen,
            '--plate-contrast': light.contrast,
            '--plate-warmth': light.warmth,
          }}
        >
          <span className="finish-plate-frame">
            <img
              src="/media/plate-macro-2200.jpg"
              srcSet="/media/plate-macro-1100.jpg 1100w, /media/plate-macro-2200.jpg 2200w"
              sizes="(max-width: 980px) 92vw, 48vw"
              width="2200"
              height="1462"
              alt="A movement plate in close-up, bridges and screws catching a raking light."
              loading="lazy"
              decoding="async"
            />
            <span className="finish-sheen" aria-hidden="true" />
          </span>
          <figcaption>
            {chosen
              ? `A light travelled across the plate, as ${chosen.name.toLowerCase()} would answer it.`
              : 'Choose a finish to see how it answers a light travelling across the plate.'}
          </figcaption>
        </figure>

        <fieldset className="finish-list">
          <legend className="visually-hidden">Choose a finish</legend>
          {CONFIGURATIONS.map((c) => {
            const on = c.id === config
            return (
              <label className="finish" key={c.id} data-on={on ? 'true' : 'false'}>
                <input
                  type="radio"
                  name="finish-choice"
                  value={c.id}
                  checked={on}
                  onChange={() => setConfig(c.id)}
                />
                {/* the same plate, at the same crop, under this finish's light —
                    so the difference between the rows is only the finish */}
                <span
                  className="finish-sample"
                  aria-hidden="true"
                  style={{
                    '--sheen-angle': `${c.light.angle}deg`,
                    '--sheen-spread': `${c.light.spread}%`,
                    '--sheen-op': c.light.sheen,
                    '--plate-contrast': c.light.contrast,
                    '--plate-warmth': c.light.warmth,
                  }}
                >
                  <img src="/media/plate-macro-1100.jpg" width="1100" height="731" alt="" loading="lazy" />
                  <span className="finish-sheen" />
                </span>
                <span className="finish-main">
                  <span className="finish-name">{c.name}</span>
                  <span className="finish-text">{c.finish}</span>
                  <span className="finish-sample-note">{c.sampleNote}</span>
                </span>
                <span className="finish-figures">
                  <span className="finish-price">
                    <span className="finish-cur">CHF</span> {chf(c.price)}
                  </span>
                  <span className="finish-lead">{c.lead}</span>
                  <span className="finish-left">
                    <b>{c.remaining}</b> of the run still unallocated
                  </span>
                </span>
                <span className="finish-mark" aria-hidden="true" />
              </label>
            )
          })}
        </fieldset>
      </div>

      <div className="ledger">
        <div className="ledger-head">
          <h3 className="ledger-title">The run</h3>
          <p className="ledger-line">
            <b>{RUN}</b> movements will be made, after which the tooling is retired.{' '}
            <b>{ALLOCATED}</b> are spoken for. <b>{OPEN}</b> are not.
          </p>
        </div>
        <ol className="ledger-marks" aria-hidden="true">
          {Array.from({ length: RUN }, (_, i) => {
            let state = 'allocated'
            if (i >= ALLOCATED) state = 'open'
            if (chosen && i >= ALLOCATED && i < ALLOCATED + chosen.remaining) state = 'chosen'
            return <li key={i} className="ledger-mark" data-state={state} />
          })}
        </ol>
        <p className="ledger-key">
          <span className="ledger-key-item" data-state="allocated">
            allocated
          </span>
          <span className="ledger-key-item" data-state="open">
            open
          </span>
          <span className="ledger-key-item" data-state="chosen">
            {chosen ? `${chosen.remaining} open in ${chosen.name.toLowerCase()}` : 'open in your finish'}
          </span>
        </p>
      </div>
    </section>
  )
}
