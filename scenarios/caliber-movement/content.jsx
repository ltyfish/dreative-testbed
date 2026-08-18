// Content-only baseline. Every fact and every piece of behaviour the designed
// baseline had, with none of its architecture: no sections, no ids, no nav, no
// hero, no cards, no table, no ordering that means anything.
//
// See BASELINES.md for why this exists.
import { useState } from 'react'

// The power path, in the order energy actually travels. This order is a fact
// about the movement, not a layout decision.
const POWER_PATH = [
  {
    id: 'mainspring',
    name: 'Mainspring',
    detail: 'A 380mm hardened alloy ribbon, wound to 6.5 turns.',
    figure: '72 hours of stored energy at full wind',
  },
  {
    id: 'barrel',
    name: 'Barrel and stop-work',
    detail: 'Releases the spring at a near-constant torque and refuses the last eight per cent, where the rate would drift.',
    figure: 'Torque held within 4% across the run',
  },
  {
    id: 'train',
    name: 'Gear train',
    detail: 'Four wheels step the barrel’s one slow turn up to the escape wheel’s fast one.',
    figure: 'Ratio 1 : 4,608',
  },
  {
    id: 'escapement',
    name: 'Escapement',
    detail: 'A free-sprung lever in silicon releases the train one tooth at a time. This is the ticking.',
    figure: '5 releases per second',
  },
  {
    id: 'balance',
    name: 'Balance wheel',
    detail: 'A 10.6mm glucydur wheel swinging against a flat hairspring. Its period is what the watch calls a second.',
    figure: '18,000 semi-oscillations per hour',
  },
  {
    id: 'hands',
    name: 'Motion work and hands',
    detail: 'The last reduction divides that swing back down into minutes and hours.',
    figure: 'Cumulative deviation −1 to +4 seconds per day',
  },
]

// Physical layers, front of the movement to back. Also a fact, not an order
// chosen for the page.
const LAYERS = [
  { id: 'dial-side', name: 'Dial-side plate', thickness: '0.9mm', note: 'Carries the motion work and the hand posts.' },
  { id: 'main', name: 'Main plate', thickness: '1.4mm', note: 'German silver, frosted by hand. Every pivot is located from this one surface.' },
  { id: 'bridge', name: 'Train bridge', thickness: '0.8mm', note: 'One continuous bridge over all four train wheels, black-polished on the upper flanks.' },
  { id: 'balance-cock', name: 'Balance cock', thickness: '0.7mm', note: 'Holds the balance from one side only, so the wheel can be seen turning.' },
]

const CONFIGURATIONS = [
  {
    id: 'frosted',
    name: 'Frosted German silver',
    finish: 'Hand-frosted plates, straight-grained bridges, blued screws.',
    price: 24800,
    lead: 'Delivered from March 2027',
    remaining: 41,
  },
  {
    id: 'skeleton',
    name: 'Open-worked',
    finish: 'Main plate cut back to the load paths, every remaining edge anglaged by hand.',
    price: 39500,
    lead: 'Delivered from September 2027',
    remaining: 12,
  },
  {
    id: 'black',
    name: 'Black-polished steel',
    finish: 'Bridges polished to a true black at every angle, matte plates for contrast.',
    price: 31200,
    lead: 'Delivered from June 2027',
    remaining: 24,
  },
]

const SPECS = [
  ['Reference', 'Caliber 08'],
  ['Diameter', '31.0mm'],
  ['Height', '3.8mm'],
  ['Jewels', '27'],
  ['Frequency', '2.5 Hz (18,000 A/h)'],
  ['Power reserve', '72 hours'],
  ['Regulation', 'Free-sprung, four inertia weights'],
  ['Winding', 'Manual'],
  ['Components', '214'],
  ['Finishing hours', '62 per movement'],
]

const ATELIER = [
  'Designed, cut, and finished at the workshop in Vallée de Joux. Nothing is subcontracted except the jewels and the mainspring.',
  'Eleven watchmakers. Two of them do nothing but finishing.',
  'A total of 200 movements will be made, after which the tooling is retired.',
  'Every movement is run for 21 days in six positions before it leaves. The timing record ships with it.',
  'Serviceable indefinitely. We keep parts for retired calibers and will not stop.',
]

export default function App() {
  const [config, setConfig] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reserved, setReserved] = useState(false)

  const chosen = CONFIGURATIONS.find((c) => c.id === config)

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !email || !config) return
    setReserved(true)
  }

  return (
    <div>
      <p>Aubry &amp; Vent. Caliber 08. © 2026.</p>

      <p>A manual-winding mechanical movement, made in a run of 200 and then never again.</p>

      <p>
        Seventy-two hours of stored energy, released one escape-wheel tooth at a time, five times a
        second, for three days from a single wind.
      </p>

      <p>How the energy travels:</p>
      <ul>
        {POWER_PATH.map((s) => (
          <li key={s.id} data-stage={s.id}>
            {s.name}. {s.detail} {s.figure}.
          </li>
        ))}
      </ul>

      <p>The movement is built up in four layers, front to back:</p>
      <ul>
        {LAYERS.map((l) => (
          <li key={l.id} data-layer={l.id}>
            {l.name}, {l.thickness}. {l.note}
          </li>
        ))}
      </ul>

      <p>Specification:</p>
      <ul>
        {SPECS.map(([k, v]) => (
          <li key={k}>
            {k}: {v}
          </li>
        ))}
      </ul>

      <p>Available in three finishes. Prices are for the movement alone; casing is arranged separately.</p>
      <ul>
        {CONFIGURATIONS.map((c) => (
          <li key={c.id} data-config={c.id}>
            {c.name}. {c.finish} CHF {c.price.toLocaleString('en-CH')}. {c.lead}. {c.remaining} of
            the run still unallocated.
          </li>
        ))}
      </ul>

      <p>About the workshop:</p>
      <ul>
        {ATELIER.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>

      <p>
        Reservations are not binding and no payment is taken now. We will write once, with the
        timing record of the movement allocated to you.
      </p>
      {reserved ? (
        <p role="status">
          Reserved. {name}, we have held one {chosen.name} movement at CHF{' '}
          {chosen.price.toLocaleString('en-CH')} and will write to {email}. {chosen.lead}.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
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
                {c.name} — CHF {c.price.toLocaleString('en-CH')}
              </option>
            ))}
          </select>
          <label htmlFor="name">Your name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit">Reserve a movement</button>
        </form>
      )}

      <p>Enquiries: <a href="mailto:atelier@aubryvent.ch">atelier@aubryvent.ch</a></p>

      <p>Servicing. Provenance. Terms of reservation.</p>
    </div>
  )
}
