import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { CONFIGURATIONS, chf } from '../data.js'

export default function Reserve({ config, setConfig }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reserved, setReserved] = useState(false)
  const [touched, setTouched] = useState(false)

  const chosen = CONFIGURATIONS.find((c) => c.id === config)

  function handleSubmit(e) {
    e.preventDefault()
    setTouched(true)
    if (!name || !email || !config) return
    setReserved(true)
  }

  return (
    <section className="reserve" id="reserve" aria-labelledby="reserve-title">
      <div className="reserve-inner">
        <header className="reserve-head">
          <p className="eyebrow">
            <span className="eyebrow-mark" aria-hidden="true" />
            Reserve a movement
          </p>
          <h2 className="section-title" id="reserve-title">
            Nothing is binding,
            <br />
            and nothing is taken
          </h2>
          <p className="reserve-terms">
            Reservations are not binding and no payment is taken now. We will write once, with the
            timing record of the movement allocated to you.
          </p>
        </header>

        {reserved ? (
          <div className="reserved" role="status">
            <p className="reserved-mark" aria-hidden="true">
              <Check size={20} strokeWidth={1.5} />
            </p>
            <p className="reserved-lead">Reserved.</p>
            <p className="reserved-body">
              {name}, we have held one {chosen.name} movement at CHF {chf(chosen.price)} and will
              write to {email}. {chosen.lead}.
            </p>
            <dl className="reserved-slip">
              <div>
                <dt>Finish</dt>
                <dd>{chosen.name}</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>CHF {chf(chosen.price)}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>{chosen.lead}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <form className="reserve-form" onSubmit={handleSubmit} noValidate={false}>
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
              <p className="field-note">
                {chosen
                  ? `${chosen.lead}. ${chosen.remaining} of the run still unallocated.`
                  : 'Carried over from the finish you chose above.'}
              </p>
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

            <div className="reserve-action">
              <button type="submit" className="btn-primary">
                Reserve a movement
                <ArrowRight size={17} strokeWidth={1.6} aria-hidden="true" />
              </button>
              {touched && (!name || !email || !config) && (
                <p className="field-error" role="alert">
                  A finish, a name and an email — then we will hold one.
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
