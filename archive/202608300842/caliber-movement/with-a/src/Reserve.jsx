import { useState } from 'react'
import { CONFIGURATIONS, chf } from './data'
import { useReveal } from './reveal'

export default function Reserve({ config, setConfig }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reserved, setReserved] = useState(false)
  const ref = useReveal()

  const chosen = CONFIGURATIONS.find((c) => c.id === config)

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !email || !config) return
    setReserved(true)
  }

  return (
    <section className="reserve" id="reserve" ref={ref} aria-labelledby="reserve-title">
      <div className="reserve-inner">
        <div className="reserve-copy">
          <p className="label">Reserve a movement</p>
          <h2 id="reserve-title" className="display">
            Reservations are not binding and no payment is taken now.
          </h2>
          <p className="lede">
            We will write once, with the timing record of the movement allocated to you —
            twenty-one days in six positions, on paper, in the box.
          </p>
          <p className="reserve-mail">
            Enquiries: <a href="mailto:atelier@aubryvent.ch">atelier@aubryvent.ch</a>
          </p>
        </div>

        <div className="reserve-panel">
          {/* The finish chosen anywhere on the page is the finish shown here. */}
          <div className="reserve-chosen" data-empty={chosen ? 'false' : 'true'}>
            {chosen ? (
              <>
                <img src={chosen.surface} alt={chosen.surfaceNote} />
                <div>
                  <p className="mono label-sm">Your finish</p>
                  <p className="reserve-chosen-name">{chosen.name}</p>
                  <p className="mono reserve-chosen-meta">
                    CHF {chf(chosen.price)} · {chosen.lead} · {chosen.remaining} left of 200
                  </p>
                </div>
              </>
            ) : (
              <p className="mono reserve-chosen-empty">
                No finish chosen yet — pick one above, or in the form.
              </p>
            )}
          </div>

          {reserved ? (
            <p role="status" className="reserve-done">
              <span className="reserve-done-mark mono">Reserved</span>
              {name}, we have held one {chosen.name} movement at CHF {chf(chosen.price)} and
              will write to {email}. {chosen.lead}. Nothing is binding and no payment has
              been taken.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="reserve-form" noValidate={false}>
              <div className="field">
                <label htmlFor="config">Which finish?</label>
                <select
                  id="config"
                  name="config"
                  required
                  value={config}
                  onChange={(e) => setConfig(e.target.value)}
                >
                  <option value="">Choose a finish</option>
                  {CONFIGURATIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — CHF {chf(c.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="name">Your name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-solid btn-wide">
                Reserve a movement
              </button>
              <p className="reserve-small">
                Not binding. No payment now. One email, when your movement is timed.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
