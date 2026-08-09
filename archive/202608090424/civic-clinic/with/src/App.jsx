import { useEffect, useState } from 'react'
import {
  ASSURANCES,
  CLINIC,
  LANGUAGES,
  SERVICES,
  WEEK,
  barPosition,
  formatMinutes,
  getWalkInStatus,
  nowPosition,
} from './clinic.js'

const TRANSIT = [
  { id: 'bus', label: 'Bus', text: 'Bus 14 and 27 stop directly outside the door on East Barrow.' },
  { id: 'train', label: 'Train', text: 'Green line to Barrow Street station, then a four-minute walk east.' },
  { id: 'car', label: 'Car', text: 'Free parking behind the building, entrance from Alder Lane.' },
  { id: 'access', label: 'Access', text: 'Step-free entrance and accessible restrooms on the ground floor.' },
]

const WALK_IN_SERVICES = SERVICES.filter((s) => s.access === 'walkin')
const BOOKED_SERVICES = SERVICES.filter((s) => s.access === 'booked')

function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])
  return now
}

function ServiceRow({ service }) {
  return (
    <li className="service" data-service={service.id}>
      <h3 className="service-name">{service.name}</h3>
      <p className="service-eligibility">
        <span className="field-label">Who</span>
        {service.eligibility}
      </p>
      <p className="service-cost">
        <span className="field-label">Cost</span>
        {service.cost}
      </p>
    </li>
  )
}

export default function App() {
  const now = useNow()
  const status = getWalkInStatus(now)
  const marker = nowPosition(status.minutes)

  const [service, setService] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [booked, setBooked] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || !phone || !service) return
    setBooked(true)
  }

  return (
    <div className="page" data-status={status.state}>
      <a className="skip" href="#status">
        Skip to today’s opening status
      </a>

      <p className="emergency" role="alert" id="emergency">
        <span className="emergency-lead">Emergency?</span>
        <span>
          Chest pain, trouble breathing, or severe bleeding — call 911 now. Do not wait for the
          clinic.
        </span>
        <a className="emergency-call" href="tel:911">
          Call 911
        </a>
      </p>

      <nav className="nav" id="site-nav" aria-label="Main">
        <a className="nav-logo" href="#status">
          {CLINIC.name}
        </a>
        <div className="nav-links">
          <a href="#hours">Hours</a>
          <a href="#services">Services</a>
          <a href="#visit">Getting here</a>
          <a href="#languages">Languages</a>
          <a href="#book">Book</a>
        </div>
        <a className="nav-call" href={CLINIC.phoneHref}>
          <span className="nav-call-label">Call the clinic</span>
          <span className="nav-call-number">{CLINIC.phone}</span>
        </a>
      </nav>

      <header className="hero" id="status">
        <div className="hero-answer">
          <p className="hero-question">Can I be seen today?</p>
          <p className="status-line" id="walkin-status">
            <strong>
              <span className="status-dot" aria-hidden="true" />
              {status.headline}
            </strong>{' '}
            {status.answer}
          </p>
          <p className="status-detail">{status.detail}</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#visit">
              Get directions
            </a>
            <a className="btn btn-secondary" href={CLINIC.phoneHref}>
              Call {CLINIC.phone}
            </a>
          </div>
        </div>

        <div className="hero-assurances">
          <h2 className="assurances-title">What we will never ask you for</h2>
          <ul className="assurances">
            {ASSURANCES.map((a) => (
              <li className="assurance" key={a.id} data-assurance={a.id}>
                <strong>{a.lead}</strong>
                <span>{a.detail}</span>
              </li>
            ))}
          </ul>
          <p className="assurance-foot">Every visit is free. Every visit is confidential.</p>
        </div>
      </header>

      <main>
        <section className="section" id="hours" aria-labelledby="hours-title">
          <div className="section-head">
            <h2 id="hours-title">Opening hours</h2>
            <p className="section-lead">
              The bar shows each day at a glance. Today is marked, and the line shows the time right
              now.
            </p>
          </div>

          <table className="hours-table">
            <caption className="visually-hidden">
              Opening hours for each day of the week, with today highlighted
            </caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Open</th>
                <th scope="col">Close</th>
                <th scope="col" className="col-bar">
                  <span className="visually-hidden">Opening window</span>
                  <span className="scale" aria-hidden="true">
                    <span>7:00</span>
                    <span>14:00</span>
                    <span>21:00</span>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {WEEK.map((h) => {
                const bar = barPosition(h)
                const isToday = h.index === status.todayIndex
                return (
                  <tr
                    key={h.day}
                    data-day={h.day.toLowerCase()}
                    data-today={isToday ? 'true' : undefined}
                  >
                    <th scope="row">
                      {h.day}
                      {isToday && <span className="today-tag">Today</span>}
                    </th>
                    {h.open ? (
                      <>
                        <td className="num">{h.open}</td>
                        <td className="num">{h.close}</td>
                      </>
                    ) : (
                      <td colSpan={2} className="closed-cell">
                        Closed
                      </td>
                    )}
                    <td className="col-bar">
                      <span className="bar-track" aria-hidden="true">
                        {bar && <span className="bar-fill" style={bar} />}
                        {isToday && marker && (
                          <span className="bar-now" style={{ left: marker }} />
                        )}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <p className="note">
            Walk-in registration closes 30 minutes before we do
            {status.today.open ? ` — that is ${formatMinutes(status.lastWalkIn)} today` : ''}. If you
            arrive late and it is urgent, come in anyway and speak to the front desk.
          </p>
        </section>

        <section className="section" id="services" aria-labelledby="services-title">
          <div className="section-head">
            <h2 id="services-title">What we can help with</h2>
            <p className="section-lead">
              Five of our six services take walk-ins. Only dental needs to be booked ahead.
            </p>
          </div>

          <h3 className="group-title">
            <span className="group-mark" aria-hidden="true" />
            Walk in — no appointment needed
          </h3>
          <ul className="services">
            {WALK_IN_SERVICES.map((s) => (
              <ServiceRow key={s.id} service={s} />
            ))}
          </ul>

          <h3 className="group-title group-title-booked">
            <span className="group-mark" aria-hidden="true" />
            Book ahead
          </h3>
          <ul className="services services-booked">
            {BOOKED_SERVICES.map((s) => (
              <ServiceRow key={s.id} service={s} />
            ))}
          </ul>
        </section>

        <section className="section section-visit" id="visit" aria-labelledby="visit-title">
          <div className="section-head">
            <h2 id="visit-title">Getting here</h2>
          </div>
          <div className="visit-grid">
            <div className="visit-contact">
              <address className="address">
                {CLINIC.addressLines.map((line, i) => (
                  <span key={line}>
                    {line}
                    {i === 0 && <br />}
                  </span>
                ))}
              </address>
              <a className="btn btn-primary btn-call" href={CLINIC.phoneHref}>
                Call {CLINIC.phone}
              </a>
              <p className="note">
                Front desk answers during opening hours. Ask for an interpreter and we will get one
                on the line.
              </p>
            </div>
            <ul className="transit">
              {TRANSIT.map((t) => (
                <li key={t.id} data-transit={t.id}>
                  <span className="transit-label">{t.label}</span>
                  <span className="transit-text">{t.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section" id="languages" aria-labelledby="languages-title">
          <div className="section-head">
            <h2 id="languages-title">We speak your language</h2>
            <p className="section-lead">
              Staff or on-site interpreters are available in these languages during all opening
              hours:
            </p>
          </div>
          <ul className="languages">
            {LANGUAGES.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <p className="interpreter">
            For any other language, call our free interpreter line at{' '}
            <a href={CLINIC.interpreterHref}>{CLINIC.interpreterPhone}</a> and we will connect a
            translator before your visit.
          </p>
        </section>

        <section className="section" id="book" aria-labelledby="book-title">
          <div className="section-head">
            <h2 id="book-title">Book an appointment</h2>
            <p className="section-lead">
              Walk-ins are always welcome. Booking is only needed for dental and some counselling
              slots.
            </p>
          </div>
          {booked ? (
            <p className="form-success" role="status">
              Thank you, {name}. We will call {phone} within one working day to confirm your time.
            </p>
          ) : (
            <form className="booking-form" onSubmit={handleSubmit}>
              <label htmlFor="svc">Which service?</label>
              <select
                id="svc"
                name="service"
                required
                value={service}
                onChange={(e) => setService(e.target.value)}
              >
                <option value="">Choose a service</option>
                {SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
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

              <label htmlFor="phone">Phone number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <button type="submit" className="btn btn-primary">
                Request appointment
              </button>
              <p className="note">
                We only use your number to confirm the appointment. It is not shared with anyone.
              </p>
            </form>
          )}
        </section>
      </main>

      <footer className="footer" id="site-footer">
        <p className="footer-mark">{CLINIC.name}</p>
        <p>© 2026 {CLINIC.name} — a nonprofit clinic funded by Springfield County</p>
        <div className="footer-links">
          <a href="#status">Top</a>
          <a href="/privacy">Patient privacy</a>
          <a href="/rights">Your rights</a>
          <a href="/volunteer">Volunteer</a>
        </div>
      </footer>
    </div>
  )
}
